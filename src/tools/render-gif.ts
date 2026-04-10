import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { StoryboardSchema, RenderQualitySchema } from '../schema/storyboard.js';
import { Renderer } from '../renderer/index.js';
import type { RenderQuality } from '../types/index.js';

export const renderGifTool = {
  name: 'render_gif',
  description:
    'Render a storyboard into an animated GIF. Produces a smaller, easily shareable file — ideal for previews, chat embeds, or README demos. Supports speed-up and resolution control.',
  inputSchema: {
    type: 'object' as const,
    required: ['storyboard'],
    properties: {
      storyboard: {
        type: 'object',
        description: 'The storyboard definition with title, scenes, and optional theme/fps/resolution.',
      },
      outputPath: {
        type: 'string',
        description: 'Where to write the GIF. Default: temp dir with auto-generated name.',
      },
      quality: {
        type: 'string',
        enum: ['high', 'medium', 'fast'],
        default: 'medium',
        description: 'Frame capture quality. high=PNG, medium=JPEG 90%, fast=JPEG 70%.',
      },
      width: {
        type: 'number',
        default: 640,
        description: 'Output GIF width in pixels. Height scales proportionally. Default: 640.',
      },
      speed: {
        type: 'number',
        default: 1,
        description: 'Playback speed multiplier (e.g. 2 = 2× faster). Default: 1.',
      },
      maxColors: {
        type: 'number',
        default: 128,
        description: 'Max colors in GIF palette (2-256). Lower = smaller file. Default: 128.',
      },
    },
  },
};

export async function handleRenderGif(
  args: Record<string, unknown>,
  renderer: Renderer
) {
  const parsed = StoryboardSchema.parse(args.storyboard);
  const quality = RenderQualitySchema.optional().parse(args.quality) ?? 'medium';
  const outputPath = typeof args.outputPath === 'string'
    ? args.outputPath
    : join(tmpdir(), `gif-${randomUUID()}.gif`);
  const width = typeof args.width === 'number' ? args.width : 640;
  const speed = typeof args.speed === 'number' ? args.speed : 1;
  const maxColors = typeof args.maxColors === 'number' ? args.maxColors : 128;

  const result = await renderer.renderGif(parsed, outputPath, {
    quality,
    gifWidth: width,
    speed,
    maxColors,
  });

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
