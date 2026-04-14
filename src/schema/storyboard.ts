import { z } from 'zod';

export const ThemeNameSchema = z.enum([
  'corporate-dark',
  'corporate-light',
  'minimal',
  'microsoft',
  'custom',
]);

export const TransitionTypeSchema = z.enum([
  'cut',
  'fade',
  'slide-left',
  'slide-up',
  'zoom',
]);

export const EasingTypeSchema = z.enum([
  'linear',
  'easeOut',
  'easeInOut',
  'spring',
  'bouncy',
  'elastic',
  'slow',
  'snap',
  'power1',
  'power4',
  'circ',
  'expo',
  'steps',
]);

export const SceneTypeSchema = z.enum([
  'title-card',
  'section-header',
  'pipeline-funnel',
  'milestone-timeline',
  'risk-callout',
  'action-items',
  'deal-team',
  'kpi-scorecard',
  'chart-bar',
  'chart-line',
  'chart-donut',
  'table',
  'quote-highlight',
  'comparison',
  'closing',
  'code-terminal',
  'scene-showcase',
  'image-card',
  'bullet-list',
  'stat-counter',
  'text-reveal',
  'logic-flow',
]);

export const PacingPhasesSchema = z.object({
  entrance: z.number().min(0).max(1).optional(),
  hold: z.number().min(0).max(1).optional(),
  exit: z.number().min(0).max(1).optional(),
});

export const TextEffectSchema = z.enum([
  'typewriter',
  'word-reveal',
  'char-cascade',
  'fade-lines',
  'highlight-sweep',
  'counter',
]);

export const AnimationOverridesSchema = z.object({
  stagger: z.number().optional(),
  easing: EasingTypeSchema.optional(),
  direction: z.enum(['up', 'down', 'left', 'right']).optional(),
  emphasis: z.array(z.number()).optional(),
  pacing: PacingPhasesSchema.optional(),
  textEffect: TextEffectSchema.optional(),
  speed: z.number().min(0.1).max(5).optional(),
  delay: z.number().min(0).optional(),
  exitAnimation: z.enum(['fade', 'slide-up', 'slide-down', 'scale-down', 'none']).optional(),
});

export const SceneSchema = z.object({
  type: SceneTypeSchema,
  duration: z.number().min(0.5).max(120),
  transition: TransitionTypeSchema.optional(),
  data: z.record(z.unknown()),
  animation: AnimationOverridesSchema.optional(),
  notes: z.string().optional(),
});

export const BrandingSchema = z.object({
  logo: z.string().optional(),
  accent: z.string().optional(),
  font: z.string().optional(),
});

export const StoryboardSchema = z.object({
  title: z.string().min(1),
  theme: ThemeNameSchema.optional().default('corporate-dark'),
  fps: z.union([z.literal(24), z.literal(30), z.literal(60)]).optional().default(30),
  resolution: z.tuple([z.number().positive(), z.number().positive()]).optional().default([1920, 1080]),
  scenes: z.array(SceneSchema).min(1),
  branding: BrandingSchema.optional(),
  assets: z.record(z.string()).optional(),
});

export const RenderQualitySchema = z.enum(['high', 'medium', 'fast']);

// Scene-specific data schemas for validation
export const TitleCardDataSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  date: z.string().optional(),
  presenter: z.string().optional(),
  image: z.string().optional(),
});

export const SectionHeaderDataSchema = z.object({
  heading: z.string(),
  subheading: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
});

export const PipelineFunnelDataSchema = z.object({
  stages: z.array(z.object({
    name: z.string(),
    count: z.number(),
    value: z.string(),
    highlight: z.boolean().optional(),
  })),
});

export const MilestoneTimelineDataSchema = z.object({
  milestones: z.array(z.object({
    name: z.string(),
    due: z.string(),
    status: z.enum(['on-track', 'at-risk', 'overdue', 'completed']),
    owner: z.string(),
    note: z.string().optional(),
  })),
});

export const RiskCalloutDataSchema = z.object({
  risks: z.array(z.object({
    signal: z.string(),
    severity: z.enum(['critical', 'high', 'medium', 'low']),
    context: z.string().optional(),
  })),
});

export const ActionItemsDataSchema = z.object({
  items: z.array(z.object({
    text: z.string(),
    owner: z.string().optional(),
    due: z.string().optional(),
    priority: z.enum(['high', 'normal']).optional(),
  })),
});

export const DealTeamDataSchema = z.object({
  members: z.array(z.object({
    name: z.string(),
    role: z.string(),
    initials: z.string(),
    avatar: z.string().optional(),
    highlight: z.boolean().optional(),
  })),
});

export const KpiScorecardDataSchema = z.object({
  kpis: z.array(z.object({
    label: z.string(),
    value: z.union([z.string(), z.number()]),
    unit: z.string().optional(),
    trend: z.enum(['up', 'down', 'flat']).optional(),
    target: z.string().optional(),
    animateCount: z.boolean().optional(),
  })),
});

export const ChartDataSchema = z.object({
  title: z.string().optional(),
  labels: z.array(z.string()),
  datasets: z.array(z.object({
    label: z.string(),
    values: z.array(z.number()),
    color: z.string().optional(),
  })),
  annotation: z.string().optional(),
});

export const TableDataSchema = z.object({
  title: z.string().optional(),
  columns: z.array(z.object({
    key: z.string(),
    label: z.string(),
    width: z.string().optional(),
  })),
  rows: z.array(z.record(z.string())),
  highlightRows: z.array(z.number()).optional(),
});

export const QuoteHighlightDataSchema = z.object({
  quote: z.string(),
  attribution: z.string().optional(),
  sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
});

export const ComparisonDataSchema = z.object({
  title: z.string().optional(),
  left: z.object({ label: z.string(), items: z.array(z.string()) }),
  right: z.object({ label: z.string(), items: z.array(z.string()) }),
});

export const ClosingDataSchema = z.object({
  tagline: z.string().optional(),
  timestamp: z.string().optional(),
  cta: z.string().optional(),
  image: z.string().optional(),
});

export const CodeTerminalDataSchema = z.object({
  title: z.string().optional(),
  shell: z.string().optional(),
  lines: z.array(z.object({
    kind: z.enum(['prompt', 'output', 'comment', 'success', 'error', 'highlight', 'blank']),
    text: z.string().optional(),
  })),
});

export const SceneShowcaseDataSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  cards: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
    style: z.string().optional(),
  })),
});

export const ImageCardDataSchema = z.object({
  image: z.string(),
  caption: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  fit: z.enum(['cover', 'contain', 'fill']).optional(),
  position: z.enum(['center', 'top', 'bottom']).optional(),
  overlay: z.enum(['none', 'gradient', 'dark']).optional(),
  effect: z.enum(['ken-burns', 'zoom-in', 'pan-left', 'pan-right', 'static']).optional(),
});

export const BulletListDataSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  items: z.array(z.object({
    text: z.string(),
    sub: z.string().optional(),
    icon: z.string().optional(),
    highlight: z.boolean().optional(),
  })),
});

export const StatCounterDataSchema = z.object({
  title: z.string().optional(),
  stats: z.array(z.object({
    value: z.union([z.string(), z.number()]),
    label: z.string(),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
    icon: z.string().optional(),
    description: z.string().optional(),
    change: z.string().optional(),
    changeDirection: z.enum(['up', 'down']).optional(),
    progress: z.number().min(0).max(100).optional(),
  })),
});

export const TextRevealDataSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string(),
  body: z.string().optional(),
  footnote: z.string().optional(),
});

export const LogicFlowNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  shape: z.enum(['start', 'end', 'process', 'decision', 'io', 'subprocess']).optional(),
  sublabel: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const LogicFlowEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
  highlight: z.boolean().optional(),
});

export const LogicFlowDataSchema = z.object({
  title: z.string().optional(),
  nodes: z.array(LogicFlowNodeSchema).min(2).max(12),
  edges: z.array(LogicFlowEdgeSchema).min(1),
  direction: z.enum(['TB', 'LR']).optional(),
  maxNodes: z.number().min(2).max(12).optional(),
  annotation: z.string().optional(),
});

export const sceneDataSchemas: Record<string, z.ZodType> = {
  'title-card': TitleCardDataSchema,
  'section-header': SectionHeaderDataSchema,
  'pipeline-funnel': PipelineFunnelDataSchema,
  'milestone-timeline': MilestoneTimelineDataSchema,
  'risk-callout': RiskCalloutDataSchema,
  'action-items': ActionItemsDataSchema,
  'deal-team': DealTeamDataSchema,
  'kpi-scorecard': KpiScorecardDataSchema,
  'chart-bar': ChartDataSchema,
  'chart-line': ChartDataSchema,
  'chart-donut': ChartDataSchema,
  'table': TableDataSchema,
  'quote-highlight': QuoteHighlightDataSchema,
  'comparison': ComparisonDataSchema,
  'closing': ClosingDataSchema,
  'code-terminal': CodeTerminalDataSchema,
  'scene-showcase': SceneShowcaseDataSchema,
  'image-card': ImageCardDataSchema,
  'bullet-list': BulletListDataSchema,
  'stat-counter': StatCounterDataSchema,
  'text-reveal': TextRevealDataSchema,
  'logic-flow': LogicFlowDataSchema,
};

/**
 * Validate scene data against its type-specific schema.
 */
export function validateSceneData(type: string, data: Record<string, unknown>): string[] {
  const schema = sceneDataSchemas[type];
  if (!schema) {
    return [`Unknown scene type: ${type}`];
  }
  const result = schema.safeParse(data);
  if (result.success) return [];
  return result.error.issues.map(
    (issue) => `Scene "${type}" data.${issue.path.join('.')}: ${issue.message}`
  );
}
