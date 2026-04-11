import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { SceneSchema } from '../schema/storyboard.js';
import { Renderer } from '../renderer/index.js';

export const renderSceneTool = {
  name: 'render_scene',
  description: 'Render a single scene to MP4. Useful for previewing one scene during storyboard iteration.',
  inputSchema: {
    type: 'object' as const,
    required: ['scene'],
    properties: {
      scene: {
        type: 'object',
        description: 'A single scene definition with type, duration, and data.',
      },
      assets: {
        type: 'object',
        description: 'Optional asset map. Keys are names, values are HTTPS URLs or data URIs. Reference in scene data as $asset:key.',
      },
      theme: {
        type: 'string',
        default: 'corporate-dark',
        description: 'Theme name.',
      },
      resolution: {
        type: 'array',
        items: { type: 'number' },
        default: [1920, 1080],
        description: 'Video resolution [width, height].',
      },
      fps: {
        type: 'number',
        enum: [24, 30, 60],
        default: 30,
      },
      outputPath: {
        type: 'string',
        description: 'Where to write the output file.',
      },
    },
  },
};

export async function handleRenderScene(
  args: Record<string, unknown>,
  renderer: Renderer
) {
  const scene = SceneSchema.parse(args.scene);
  const assets = (typeof args.assets === 'object' && args.assets !== null)
    ? args.assets as Record<string, string>
    : undefined;
  const theme = (typeof args.theme === 'string' ? args.theme : 'corporate-dark');
  const resolution = (Array.isArray(args.resolution) ? args.resolution : [1920, 1080]) as [number, number];
  const fps = (typeof args.fps === 'number' ? args.fps : 30) as 24 | 30 | 60;
  const outputPath = typeof args.outputPath === 'string'
    ? args.outputPath
    : join(tmpdir(), `scene-${randomUUID()}.mp4`);

  const result = await renderer.renderScene(scene, {
    theme,
    resolution,
    fps,
    outputPath,
    assets,
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
