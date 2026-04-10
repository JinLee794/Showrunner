import ffmpeg from 'fluent-ffmpeg';
import type { RenderQuality } from '../types/index.js';

export interface EncodeOptions {
  frameDir: string;
  framePattern: string;
  fps: number;
  width: number;
  height: number;
  quality: RenderQuality;
  outputPath: string;
}

/**
 * Encode a directory of frames into an H.264 MP4.
 */
export function encodeVideo(options: EncodeOptions): Promise<void> {
  const { frameDir, framePattern, fps, width, height, quality, outputPath } = options;

  const crf = quality === 'high' ? 18 : quality === 'medium' ? 23 : 28;
  const inputPattern = `${frameDir}/${framePattern}`;

  return new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(inputPattern)
      .inputFPS(fps)
      .videoCodec('libx264')
      .outputOptions([
        `-crf ${crf}`,
        '-pix_fmt yuv420p',
        `-s ${width}x${height}`,
        '-preset medium',
        '-movflags +faststart',
      ])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(new Error(`ffmpeg encoding failed: ${err.message}`)))
      .run();
  });
}
