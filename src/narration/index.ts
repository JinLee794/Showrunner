import { mkdir, rename, rm } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import type { Storyboard, NarrationConfig } from '../types/index.js';
import {
  synthesizeStoryboard,
  type SceneSynthesisResult,
} from './azure-speech.js';
import {
  buildCues,
  writeTranscripts,
  type TimelineEntry,
} from './transcript.js';
import { generateSilence, concatAudio, muxAudio } from './audio-mux.js';

export interface NarrationPipelineResult {
  /** Per-scene synthesis metadata (sceneDurationMs reflects any auto-extend). */
  timeline: TimelineEntry[];
  /** Concatenated audio file covering the full video timeline. */
  concatenatedAudioPath: string;
  /** Total timeline duration in seconds. */
  totalDurationSec: number;
  /** Voice used (first non-empty). */
  voice: string;
  workDir: string;
}

/**
 * Synthesize narration for every scene, build a concatenated audio track
 * (with silence padding between scenes) and (optionally) update the
 * storyboard's per-scene durations so video frames cover each narration.
 *
 * Returns null when narration is not requested / not configured.
 * Mutates `storyboard.scenes[i].duration` when `autoExtendScenes` is true.
 */
export async function prepareNarration(
  storyboard: Storyboard,
): Promise<NarrationPipelineResult | null> {
  const cfg: NarrationConfig = storyboard.narration ?? {};
  const workDir = join(tmpdir(), `showrunner-narration-${randomUUID()}`);
  await mkdir(workDir, { recursive: true });

  let synth;
  try {
    synth = await synthesizeStoryboard(storyboard, workDir);
  } catch (err) {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
    throw err;
  }
  if (!synth) {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
    return null;
  }

  const gapMs = cfg.gapMs ?? 150;
  const autoExtend = cfg.autoExtendScenes ?? true;

  const timeline: TimelineEntry[] = [];
  const audioSegments: string[] = [];
  let cursorMs = 0;
  let voice = '';

  for (let i = 0; i < storyboard.scenes.length; i++) {
    const scene = storyboard.scenes[i]!;
    const synthesis: SceneSynthesisResult = synth.results[i]!;
    const videoDurationMs = scene.duration * 1000;
    const narrationMs = synthesis.audioDurationMs;
    const requiredMs = narrationMs > 0 ? narrationMs + gapMs : 0;

    let sceneDurationMs = videoDurationMs;
    if (autoExtend && requiredMs > videoDurationMs) {
      sceneDurationMs = requiredMs;
      scene.duration = sceneDurationMs / 1000;
    }

    if (synthesis.audioPath) {
      audioSegments.push(synthesis.audioPath);
      if (voice === '' && synthesis.voice) voice = synthesis.voice;

      // Pad with silence so the audio segment matches the video segment exactly.
      const padMs = Math.max(0, sceneDurationMs - narrationMs);
      if (padMs > 0) {
        const silencePath = join(workDir, `pad-${String(i).padStart(3, '0')}.mp3`);
        await generateSilence(silencePath, padMs);
        audioSegments.push(silencePath);
      }
    } else {
      // Scene has no voiceover → pure silence for its full duration.
      const silencePath = join(workDir, `silence-${String(i).padStart(3, '0')}.mp3`);
      await generateSilence(silencePath, sceneDurationMs);
      audioSegments.push(silencePath);
    }

    timeline.push({
      synthesis,
      sceneStartMs: cursorMs,
      sceneDurationMs,
    });
    cursorMs += sceneDurationMs;
  }

  const concatenatedAudioPath = join(workDir, 'narration.mp3');
  await concatAudio(audioSegments, concatenatedAudioPath, workDir);

  return {
    timeline,
    concatenatedAudioPath,
    totalDurationSec: cursorMs / 1000,
    voice: voice || (cfg.voice ?? 'en-US-JennyNeural'),
    workDir,
  };
}

/**
 * Mux narration audio into a rendered video and write transcript sidecars.
 * Returns the final MP4 path plus optional transcript paths.
 */
export async function finalizeNarration(
  videoPath: string,
  narration: NarrationPipelineResult,
  cfg: NarrationConfig,
): Promise<{ videoPath: string; vttPath?: string; srtPath?: string }> {
  // Mux to a sibling temp path then atomically replace.
  const muxedPath = join(
    dirname(videoPath),
    `.${basename(videoPath)}.muxing.mp4`,
  );
  try {
    await muxAudio(videoPath, narration.concatenatedAudioPath, muxedPath);
    await rm(videoPath, { force: true });
    await rename(muxedPath, videoPath);
  } catch (err) {
    await rm(muxedPath, { force: true }).catch(() => {});
    throw err;
  }

  const cues = buildCues(narration.timeline);
  const transcripts = await writeTranscripts(
    cues,
    videoPath,
    cfg.transcriptFormat ?? 'vtt',
  );

  return { videoPath, ...transcripts };
}

export async function cleanupNarration(
  narration: NarrationPipelineResult | null,
): Promise<void> {
  if (!narration) return;
  await rm(narration.workDir, { recursive: true, force: true }).catch(() => {});
}

export { buildCues, writeTranscripts } from './transcript.js';
export { loadAzureSpeechCredentials } from './azure-speech.js';
