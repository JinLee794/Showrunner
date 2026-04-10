import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { StoryboardSchema, RenderQualitySchema } from '../schema/storyboard.js';
import { Renderer } from '../renderer/index.js';
import type { RenderQuality, Storyboard } from '../types/index.js';

export const renderVideoTool = {
  name: 'render_video',
  description: 'Render a storyboard into an MP4 video with animated scenes.',
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
        description: 'Where to write the MP4. Default: temp dir with auto-generated name.',
      },
      quality: {
        type: 'string',
        enum: ['high', 'medium', 'fast'],
        default: 'medium',
        description: 'high=PNG frames, medium=JPEG 90%, fast=JPEG 70%',
      },
    },
  },
};

export async function handleRenderVideo(
  args: Record<string, unknown>,
  renderer: Renderer
) {
  const parsed = StoryboardSchema.parse(args.storyboard);
  const quality = RenderQualitySchema.optional().parse(args.quality) ?? 'medium';
  const outputPath = typeof args.outputPath === 'string'
    ? args.outputPath
    : join(tmpdir(), `video-${randomUUID()}.mp4`);

  const result = await renderer.renderStoryboard(parsed, outputPath, quality);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
