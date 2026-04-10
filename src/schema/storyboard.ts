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
]);

export const AnimationOverridesSchema = z.object({
  stagger: z.number().optional(),
  easing: EasingTypeSchema.optional(),
  direction: z.enum(['up', 'down', 'left', 'right']).optional(),
  emphasis: z.array(z.number()).optional(),
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
});

export const RenderQualitySchema = z.enum(['high', 'medium', 'fast']);

// Scene-specific data schemas for validation
export const TitleCardDataSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  date: z.string().optional(),
  presenter: z.string().optional(),
});

export const SectionHeaderDataSchema = z.object({
  heading: z.string(),
  subheading: z.string().optional(),
  icon: z.string().optional(),
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
