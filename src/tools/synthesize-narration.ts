import { mkdir, rename } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { StoryboardSchema } from '../schema/storyboard.js';
import {
  prepareNarration,
  cleanupNarration,
  buildCues,
  writeTranscripts,
  loadAzureSpeechCredentials,
} from '../narration/index.js';

export const synthesizeNarrationTool = {
  name: 'synthesize_narration',
  description:
    'Generate Azure Speech voice-over audio (MP3) and a synchronized transcript (VTT/SRT) for a storyboard, without rendering the video. ' +
    'Requires AZURE_SPEECH_REGION + (AZURE_SPEECH_KEY or AZURE_SPEECH_TOKEN) in the MCP server environment. ' +
    'Returns the concatenated audio path, transcript paths, and per-scene word timings.',
  inputSchema: {
    type: 'object' as const,
    required: ['storyboard'],
    properties: {
      storyboard: {
        type: 'object',
        description:
          'Storyboard with `narration` config and per-scene `voiceover` fields. Scenes without voiceover are rendered as silence.',
      },
      audioOutputPath: {
        type: 'string',
        description: 'Where to write the concatenated MP3. Default: temp dir with auto-generated name.',
      },
      transcriptBasePath: {
        type: 'string',
        description:
          'Base path for transcript sidecars. `.vtt`/`.srt` extensions are appended. Defaults to the audio output path.',
      },
    },
  },
};

export async function handleSynthesizeNarration(args: Record<string, unknown>) {
  const storyboard = StoryboardSchema.parse(args.storyboard);

  const creds = loadAzureSpeechCredentials(storyboard.narration);
  if (!creds) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              error: 'azure_speech_not_configured',
              message:
                'Azure Speech credentials are not set. Provide AZURE_SPEECH_REGION and either AZURE_SPEECH_KEY or AZURE_SPEECH_TOKEN in the MCP server environment.',
            },
            null,
            2,
          ),
        },
      ],
      isError: true,
    };
  }

  // Force-enable narration for this standalone tool even if no scenes have voiceover;
  // that case will still produce a silent track and an empty transcript, which is useful
  // for confirming configuration / pipeline health.
  const working = { ...storyboard, narration: { ...(storyboard.narration ?? {}), enabled: true } };

  const audioOutputPath =
    typeof args.audioOutputPath === 'string'
      ? args.audioOutputPath
      : join(tmpdir(), `narration-${randomUUID()}.mp3`);
  const transcriptBase =
    typeof args.transcriptBasePath === 'string' ? args.transcriptBasePath : audioOutputPath;

  await mkdir(dirname(audioOutputPath), { recursive: true });

  const narration = await prepareNarration(working);
  if (!narration) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              error: 'no_voiceover_content',
              message: 'The storyboard has no scene with a `voiceover` field.',
            },
            null,
            2,
          ),
        },
      ],
      isError: true,
    };
  }

  try {
    // Move the concatenated audio from temp into the requested location.
    await rename(narration.concatenatedAudioPath, audioOutputPath).catch(async () => {
      // rename may fail across devices — fall back to copy.
      const { copyFile } = await import('node:fs/promises');
      await copyFile(narration.concatenatedAudioPath, audioOutputPath);
    });

    const cues = buildCues(narration.timeline);
    const { vttPath, srtPath } = await writeTranscripts(
      cues,
      transcriptBase,
      working.narration?.transcriptFormat ?? 'vtt',
    );

    const result = {
      audioPath: audioOutputPath,
      durationSec: narration.totalDurationSec,
      voice: narration.voice,
      transcriptPath: vttPath,
      srtPath,
      cueCount: cues.length,
      scenes: narration.timeline.map((t) => ({
        sceneIndex: t.synthesis.sceneIndex,
        sceneStartMs: t.sceneStartMs,
        sceneDurationMs: t.sceneDurationMs,
        audioDurationMs: t.synthesis.audioDurationMs,
        wordCount: t.synthesis.words.length,
        voice: t.synthesis.voice,
      })),
    };

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  } finally {
    // Keep the caller's audio output; only scrub the temp working dir.
    await cleanupNarration(narration);
  }
}
