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

export interface GifEncodeOptions {
  frameDir: string;
  framePattern: string;
  fps: number;
  width: number;
  height: number;
  outputPath: string;
  /** Output width in pixels. Height scales proportionally. Default: 640 */
  gifWidth?: number;
  /** Playback speed multiplier (e.g. 2 = 2x faster). Default: 1 */
  speed?: number;
  /** Max colors in palette (2-256). Default: 128 */
  maxColors?: number;
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

/**
 * Encode a directory of frames into an animated GIF with palette optimization.
 */
export function encodeGif(options: GifEncodeOptions): Promise<void> {
  const {
    frameDir, framePattern, fps, width, height, outputPath,
    gifWidth = 640,
    speed = 1,
    maxColors = 128,
  } = options;

  const inputPattern = `${frameDir}/${framePattern}`;
  const effectiveFps = Math.min(Math.round(fps * speed), 50); // GIF viewers cap ~50fps
  const scaleFilter = `scale=${gifWidth}:-1:flags=lanczos`;

  // Two-pass: generate palette then encode with it for best quality
  const filtergraph = [
    speed !== 1 ? `setpts=${(1 / speed).toFixed(4)}*PTS` : null,
    `fps=${effectiveFps}`,
    scaleFilter,
    'split[s0][s1]',
    `[s0]palettegen=max_colors=${maxColors}:stats_mode=diff[p]`,
    '[s1][p]paletteuse=dither=bayer:bayer_scale=3',
  ].filter(Boolean).join(',');

  return new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(inputPattern)
      .inputFPS(fps)
      .complexFilter(filtergraph)
      .outputOptions(['-loop', '0'])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(new Error(`ffmpeg GIF encoding failed: ${err.message}`)))
      .run();
  });
}
