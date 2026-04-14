import { StoryboardSchema, validateSceneData } from '../schema/storyboard.js';
import type { ValidationResult } from '../types/index.js';

export const validateStoryboardTool = {
  name: 'validate_storyboard',
  description: 'Dry-run validation. Returns errors or a summary (scene count, total duration, frame count).',
  inputSchema: {
    type: 'object' as const,
    required: ['storyboard'],
    properties: {
      storyboard: {
        type: 'object',
        description: 'The storyboard to validate.',
      },
    },
  },
};

export async function handleValidateStoryboard(
  args: Record<string, unknown>
) {
  const errors: string[] = [];

  // Validate top-level structure
  const parseResult = StoryboardSchema.safeParse(args.storyboard);
  if (!parseResult.success) {
    for (const issue of parseResult.error.issues) {
      errors.push(`${issue.path.join('.')}: ${issue.message}`);
    }
    const result: ValidationResult = { valid: false, errors };
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  }

  const storyboard = parseResult.data;

  // Validate each scene's data against its type-specific schema
  const warnings: string[] = [];
  for (let i = 0; i < storyboard.scenes.length; i++) {
    const scene = storyboard.scenes[i]!;
    const sceneErrors = validateSceneData(scene.type, scene.data);
    for (const err of sceneErrors) {
      errors.push(`scenes[${i}]: ${err}`);
    }

    // Advisory: logic-flow node count
    if (scene.type === 'logic-flow') {
      const data = scene.data as Record<string, unknown>;
      const nodes = Array.isArray(data.nodes) ? data.nodes : [];
      const limit = (typeof data.maxNodes === 'number' ? data.maxNodes : 8);
      if (nodes.length > limit) {
        warnings.push(
          `scenes[${i}]: logic-flow has ${nodes.length} nodes (recommended max: ${limit}). ` +
          `Consider decomposing into multiple scenes — each covering one decision path or stage — ` +
          `so the audience can focus on one concept at a time.`
        );
      }
    }
  }

  if (errors.length > 0) {
    const result: ValidationResult = { valid: false, errors };
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  }

  const fps = storyboard.fps ?? 30;
  const totalDuration = storyboard.scenes.reduce((sum, s) => sum + s.duration, 0);
  const totalFrames = storyboard.scenes.reduce(
    (sum, s) => sum + Math.ceil(s.duration * fps) + 1,
    0
  );

  const result: ValidationResult = {
    valid: true,
    summary: {
      scenes: storyboard.scenes.length,
      duration: totalDuration,
      frames: totalFrames,
    },
    ...(warnings.length > 0 ? { warnings } : {}),
  };

  return {
    content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
  };
}
