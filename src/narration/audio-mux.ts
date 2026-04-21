import ffmpeg from 'fluent-ffmpeg';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Generate a silent MP3 of the given duration in ms.
 * Used to pad gaps when a scene's video duration exceeds its narration length.
 */
export function generateSilence(outputPath: string, durationMs: number): Promise<void> {
  const seconds = Math.max(0.01, durationMs / 1000);
  return new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input('anullsrc=r=24000:cl=mono')
      .inputOptions(['-f', 'lavfi', '-t', seconds.toFixed(3)])
      .audioCodec('libmp3lame')
      .audioBitrate('48k')
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err: Error) =>
        reject(new Error(`silence generation failed: ${err.message}`)),
      )
      .run();
  });
}

/**
 * Concatenate a list of MP3 files end-to-end into a single MP3
 * using the ffmpeg concat demuxer.
 */
export async function concatAudio(
  inputs: string[],
  outputPath: string,
  workDir: string,
): Promise<void> {
  if (inputs.length === 0) {
    throw new Error('concatAudio requires at least one input');
  }
  const listPath = join(workDir, 'concat-list.txt');
  const listContent = inputs
    .map((p) => `file '${p.replace(/'/g, "'\\''")}'`)
    .join('\n');
  await writeFile(listPath, listContent, 'utf-8');

  return new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(listPath)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      // Re-encode to normalise timebases/bitrates across scenes.
      .audioCodec('libmp3lame')
      .audioBitrate('48k')
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err: Error) =>
        reject(new Error(`audio concat failed: ${err.message}`)),
      )
      .run();
  });
}

/**
 * Mux a pre-encoded video with an audio track into a new MP4.
 * Stream-copies the video and encodes audio to AAC.
 */
export function muxAudio(
  videoPath: string,
  audioPath: string,
  outputPath: string,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .outputOptions([
        '-map', '0:v:0',
        '-map', '1:a:0',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest',
        '-movflags', '+faststart',
      ])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err: Error) =>
        reject(new Error(`audio mux failed: ${err.message}`)),
      )
      .run();
  });
}
