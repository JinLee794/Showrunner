import type { SceneTypeInfo } from '../types/index.js';

export const listSceneTypesTool = {
  name: 'list_scene_types',
  description: 'Discovery tool. Returns all available scene types with descriptions and data schemas.',
  inputSchema: {
    type: 'object' as const,
    properties: {},
  },
};

const sceneTypes: SceneTypeInfo[] = [
  {
    type: 'title-card',
    description: 'Full-screen branded intro. Logo fades in with scale spring, title slides up with easeOut.',
    dataSchema: {
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        date: { type: 'string' },
        presenter: { type: 'string' },
      },
    },
  },
  {
    type: 'section-header',
    description: 'Transition slide between sections. Heading enters with spring, accent line draws left-to-right.',
    dataSchema: {
      type: 'object',
      required: ['heading'],
      properties: {
        heading: { type: 'string' },
        subheading: { type: 'string' },
        icon: { type: 'string' },
      },
    },
  },
  {
    type: 'pipeline-funnel',
    description: 'Horizontal bars grow left-to-right with staggered spring easing. Values count up from 0.',
    dataSchema: {
      type: 'object',
      required: ['stages'],
      properties: {
        stages: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'count', 'value'],
            properties: {
              name: { type: 'string' },
              count: { type: 'number' },
              value: { type: 'string', description: 'formatted currency' },
              highlight: { type: 'boolean' },
            },
          },
        },
      },
    },
  },
  {
    type: 'milestone-timeline',
    description: 'Vertical timeline draws downward. Status dots appear with spring scale-in.',
    dataSchema: {
      type: 'object',
      required: ['milestones'],
      properties: {
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'due', 'status', 'owner'],
            properties: {
              name: { type: 'string' },
              due: { type: 'string', description: 'ISO date' },
              status: { type: 'string', enum: ['on-track', 'at-risk', 'overdue', 'completed'] },
              owner: { type: 'string' },
              note: { type: 'string' },
            },
          },
        },
      },
    },
  },
  {
    type: 'risk-callout',
    description: 'Cards slide in from right with spring. Severity stripe animates color.',
    dataSchema: {
      type: 'object',
      required: ['risks'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            required: ['signal', 'severity'],
            properties: {
              signal: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              context: { type: 'string' },
            },
          },
        },
      },
    },
  },
  {
    type: 'action-items',
    description: 'Numbered list. Each item slides up with spring easing, staggered 100ms.',
    dataSchema: {
      type: 'object',
      required: ['items'],
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            required: ['text'],
            properties: {
              text: { type: 'string' },
              owner: { type: 'string' },
              due: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'normal'] },
            },
          },
        },
      },
    },
  },
  {
    type: 'deal-team',
    description: 'Grid of avatar circles. Each scales in with bouncy spring.',
    dataSchema: {
      type: 'object',
      required: ['members'],
      properties: {
        members: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'role', 'initials'],
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              initials: { type: 'string' },
              avatar: { type: 'string' },
              highlight: { type: 'boolean' },
            },
          },
        },
      },
    },
  },
  {
    type: 'kpi-scorecard',
    description: 'Grid of KPI cards with count-up number animation and trend arrows.',
    dataSchema: {
      type: 'object',
      required: ['kpis'],
      properties: {
        kpis: {
          type: 'array',
          items: {
            type: 'object',
            required: ['label', 'value'],
            properties: {
              label: { type: 'string' },
              value: { type: ['string', 'number'] },
              unit: { type: 'string' },
              trend: { type: 'string', enum: ['up', 'down', 'flat'] },
              target: { type: 'string' },
              animateCount: { type: 'boolean', default: true },
            },
          },
        },
      },
    },
  },
  {
    type: 'chart-bar',
    description: 'Bars grow upward with staggered spring. Values appear at bar tops.',
    dataSchema: {
      type: 'object',
      required: ['labels', 'datasets'],
      properties: {
        title: { type: 'string' },
        labels: { type: 'array', items: { type: 'string' } },
        datasets: { type: 'array', items: { type: 'object', required: ['label', 'values'] } },
        annotation: { type: 'string' },
      },
    },
  },
  {
    type: 'chart-line',
    description: 'Line draws left-to-right using path interpolation. Data points pop in.',
    dataSchema: {
      type: 'object',
      required: ['labels', 'datasets'],
      properties: {
        title: { type: 'string' },
        labels: { type: 'array', items: { type: 'string' } },
        datasets: { type: 'array', items: { type: 'object', required: ['label', 'values'] } },
        annotation: { type: 'string' },
      },
    },
  },
  {
    type: 'chart-donut',
    description: 'Segments fill clockwise with easeInOut. Center label counts up.',
    dataSchema: {
      type: 'object',
      required: ['labels', 'datasets'],
      properties: {
        title: { type: 'string' },
        labels: { type: 'array', items: { type: 'string' } },
        datasets: { type: 'array', items: { type: 'object', required: ['label', 'values'] } },
        annotation: { type: 'string' },
      },
    },
  },
  {
    type: 'table',
    description: 'Data table with staggered row entrance. Highlighted rows get accent background.',
    dataSchema: {
      type: 'object',
      required: ['columns', 'rows'],
      properties: {
        title: { type: 'string' },
        columns: { type: 'array', items: { type: 'object', required: ['key', 'label'] } },
        rows: { type: 'array', items: { type: 'object' } },
        highlightRows: { type: 'array', items: { type: 'number' } },
      },
    },
  },
  {
    type: 'quote-highlight',
    description: 'Quote text with attribution. Quote mark scales in with spring.',
    dataSchema: {
      type: 'object',
      required: ['quote'],
      properties: {
        quote: { type: 'string' },
        attribution: { type: 'string' },
        sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
      },
    },
  },
  {
    type: 'comparison',
    description: 'Side-by-side comparison with center divider. Items slide in from opposite sides.',
    dataSchema: {
      type: 'object',
      required: ['left', 'right'],
      properties: {
        title: { type: 'string' },
        left: { type: 'object', required: ['label', 'items'] },
        right: { type: 'object', required: ['label', 'items'] },
      },
    },
  },
  {
    type: 'closing',
    description: 'Branded outro. Logo scales in with spring. Tagline fades up.',
    dataSchema: {
      type: 'object',
      properties: {
        tagline: { type: 'string' },
        timestamp: { type: 'string' },
        cta: { type: 'string' },
      },
    },
  },
];

export async function handleListSceneTypes() {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(sceneTypes, null, 2),
      },
    ],
  };
}
