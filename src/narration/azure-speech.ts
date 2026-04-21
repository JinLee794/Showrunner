import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildSsml } from './ssml.js';
import type { NarrationConfig, Storyboard, Voiceover } from '../types/index.js';

export interface WordBoundary {
  /** Absolute offset in ms from the start of THIS scene's narration audio. */
  audioOffsetMs: number;
  /** Duration of the word/boundary in ms. */
  durationMs: number;
  /** The word or punctuation text. */
  text: string;
  /** Boundary kind: Word, Punctuation, Sentence. */
  boundaryType: string;
}

export interface SceneSynthesisResult {
  sceneIndex: number;
  audioPath: string | null;
  audioDurationMs: number;
  words: WordBoundary[];
  voice: string;
  /** The plain-text content (for transcript cues when no word boundaries are available). */
  plainText: string;
}

export interface AzureSpeechCredentials {
  region: string;
  subscriptionKey?: string;
  authToken?: string;
  endpoint?: string;
}

/**
 * Read Azure Speech credentials from the local environment (passthrough auth).
 * Returns null if none are configured.
 *
 * Env vars (any of):
 *   AZURE_SPEECH_REGION   required unless AZURE_SPEECH_ENDPOINT is set
 *   AZURE_SPEECH_KEY      subscription key, OR
 *   AZURE_SPEECH_TOKEN    short-lived STS / Entra bearer token
 *   AZURE_SPEECH_ENDPOINT optional custom endpoint (sovereign / private)
 */
export function loadAzureSpeechCredentials(
  cfg?: NarrationConfig,
): AzureSpeechCredentials | null {
  const region = cfg?.region ?? process.env.AZURE_SPEECH_REGION;
  const endpoint = cfg?.endpoint ?? process.env.AZURE_SPEECH_ENDPOINT;
  const subscriptionKey = process.env.AZURE_SPEECH_KEY;
  const authToken = process.env.AZURE_SPEECH_TOKEN;

  if (!subscriptionKey && !authToken) return null;
  if (!region && !endpoint) return null;

  return {
    region: region ?? '',
    endpoint,
    subscriptionKey: subscriptionKey || undefined,
    authToken: authToken || undefined,
  };
}

/**
 * Dynamically load the Azure Speech SDK. Returns null when the optional
 * dependency is not installed (so narration becomes a no-op instead of
 * breaking plain video rendering).
 */
async function loadSpeechSdk(): Promise<any | null> {
  try {
    // Optional dependency — resolved at runtime only when narration is used.
    // Using an indirect specifier prevents TS from requiring @types at build time.
    const specifier = 'microsoft-cognitiveservices-speech-sdk';
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const dynamicImport = new Function('s', 'return import(s)') as (s: string) => Promise<any>;
    const mod: any = await dynamicImport(specifier);
    return mod.default ?? mod;
  } catch {
    return null;
  }
}

function buildSpeechConfig(
  sdk: any,
  creds: AzureSpeechCredentials,
): any {
  let cfg: any;
  if (creds.endpoint) {
    const url = new URL(creds.endpoint);
    if (creds.subscriptionKey) {
      cfg = sdk.SpeechConfig.fromEndpoint(url, creds.subscriptionKey);
    } else {
      cfg = sdk.SpeechConfig.fromEndpoint(url);
      if (creds.authToken) cfg.authorizationToken = creds.authToken;
    }
  } else if (creds.authToken) {
    cfg = sdk.SpeechConfig.fromAuthorizationToken(creds.authToken, creds.region);
  } else {
    cfg = sdk.SpeechConfig.fromSubscription(creds.subscriptionKey!, creds.region);
  }
  cfg.speechSynthesisOutputFormat =
    sdk.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3;
  // Surface word-boundary events
  cfg.requestWordLevelTimestamps?.();
  return cfg;
}

/**
 * Synthesize a single voiceover to MP3 + capture word-boundary timings.
 * Throws on synthesis failure.
 */
export async function synthesizeVoiceover(
  vo: Voiceover,
  cfg: NarrationConfig,
  creds: AzureSpeechCredentials,
  outputPath: string,
): Promise<{ audioDurationMs: number; words: WordBoundary[]; voice: string }> {
  const sdk = await loadSpeechSdk();
  if (!sdk) {
    throw new Error(
      "Azure Speech SDK not installed. Run `npm install microsoft-cognitiveservices-speech-sdk` to enable narration.",
    );
  }
  const speechConfig = buildSpeechConfig(sdk, creds);
  // Do not pass an audio destination; we want raw bytes from result.audioData.
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

  const words: WordBoundary[] = [];
  synthesizer.wordBoundary = (_s: unknown, e: any) => {
    // audioOffset is in 100-nanosecond ticks (1 tick = 100ns → /10000 = ms)
    words.push({
      audioOffsetMs: Number(e.audioOffset) / 10000,
      durationMs: Number(e.duration) / 10000,
      text: String(e.text ?? ''),
      boundaryType: String(e.boundaryType ?? 'Word'),
    });
  };

  const ssml = buildSsml(vo, cfg);
  const voice = vo.voice ?? cfg.voice ?? 'en-US-JennyNeural';

  const result: any = await new Promise((resolve, reject) => {
    synthesizer.speakSsmlAsync(
      ssml,
      (r: any) => resolve(r),
      (err: unknown) => reject(err instanceof Error ? err : new Error(String(err))),
    );
  }).finally(() => {
    try {
      synthesizer.close();
    } catch {
      /* ignore */
    }
  });

  if (result.reason !== sdk.ResultReason.SynthesizingAudioCompleted) {
    const details = result.errorDetails ?? `reason=${result.reason}`;
    throw new Error(`Azure Speech synthesis failed: ${details}`);
  }

  const audio = Buffer.from(result.audioData);
  await writeFile(outputPath, audio);

  // audioDuration on the result is in ticks as well.
  const audioDurationMs =
    typeof result.audioDuration === 'number' || typeof result.audioDuration === 'bigint'
      ? Number(result.audioDuration) / 10000
      : estimateDurationFromWords(words);

  return { audioDurationMs, words, voice };
}

function estimateDurationFromWords(words: WordBoundary[]): number {
  if (words.length === 0) return 0;
  const last = words[words.length - 1]!;
  return last.audioOffsetMs + last.durationMs;
}

/**
 * Synthesize narration for every scene that has a `voiceover` field.
 * Returns one result per scene (null audioPath for scenes without voiceover).
 */
export async function synthesizeStoryboard(
  storyboard: Storyboard,
  outputDir: string,
): Promise<{ results: SceneSynthesisResult[]; credentials: AzureSpeechCredentials } | null> {
  const cfg: NarrationConfig = storyboard.narration ?? {};
  const hasAnyVo = storyboard.scenes.some((s) => !!s.voiceover);
  const enabled = cfg.enabled ?? hasAnyVo;
  if (!enabled || !hasAnyVo) return null;

  const creds = loadAzureSpeechCredentials(cfg);
  if (!creds) {
    throw new Error(
      'Narration requested but Azure Speech credentials are not configured. ' +
        'Set AZURE_SPEECH_REGION plus AZURE_SPEECH_KEY or AZURE_SPEECH_TOKEN in the environment.',
    );
  }

  const results: SceneSynthesisResult[] = [];
  for (let i = 0; i < storyboard.scenes.length; i++) {
    const scene = storyboard.scenes[i]!;
    if (!scene.voiceover) {
      results.push({
        sceneIndex: i,
        audioPath: null,
        audioDurationMs: 0,
        words: [],
        voice: '',
        plainText: '',
      });
      continue;
    }
    const audioPath = join(outputDir, `scene-${String(i).padStart(3, '0')}.mp3`);
    const { audioDurationMs, words, voice } = await synthesizeVoiceover(
      scene.voiceover,
      cfg,
      creds,
      audioPath,
    );
    results.push({
      sceneIndex: i,
      audioPath,
      audioDurationMs,
      words,
      voice,
      plainText: scene.voiceover.text ?? '',
    });
  }

  return { results, credentials: creds };
}
