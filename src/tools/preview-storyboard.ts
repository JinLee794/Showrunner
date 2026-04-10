import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { StoryboardSchema } from '../schema/storyboard.js';
import { generatePreview } from '../renderer/preview.js';

export const previewStoryboardTool = {
  name: 'preview_storyboard',
  description: 'Generate an interactive HTML preview without Playwright/ffmpeg. Instant output for iteration.',
  inputSchema: {
    type: 'object' as const,
    required: ['storyboard'],
    properties: {
      storyboard: {
        type: 'object',
        description: 'The storyboard to preview.',
      },
      outputPath: {
        type: 'string',
        description: 'Where to write the HTML file.',
      },
    },
  },
};

export async function handlePreviewStoryboard(
  args: Record<string, unknown>
) {
  const storyboard = StoryboardSchema.parse(args.storyboard);
  const outputPath = typeof args.outputPath === 'string'
    ? args.outputPath
    : join(tmpdir(), `preview-${randomUUID()}.html`);

  const result = await generatePreview(storyboard, outputPath);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
