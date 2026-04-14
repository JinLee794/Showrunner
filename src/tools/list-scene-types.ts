import type { SceneTypeInfo } from '../types/index.js';

export const listSceneTypesTool = {
  name: 'list_scene_types',
  description: 'Discovery tool. Returns all available scene types with descriptions and data schemas. Image fields accept $asset:key references (resolved from the storyboard-level assets map), HTTPS URLs, or data URIs.',
  inputSchema: {
    type: 'object' as const,
    properties: {},
  },
};

const sceneTypes: SceneTypeInfo[] = [
  {
    type: 'title-card',
    description: 'Full-screen branded intro. Logo fades in with scale spring, title slides up with easeOut. Optional image replaces accent bar (logo/icon via $asset:key or data URI).',
    dataSchema: {
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        date: { type: 'string' },
        presenter: { type: 'string' },
        image: { type: 'string', description: 'Logo/icon — use $asset:key reference or data URI' },
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
    description: 'Branded outro. Logo scales in with spring. Tagline fades up. Optional image (logo/icon via $asset:key or data URI).',
    dataSchema: {
      type: 'object',
      properties: {
        tagline: { type: 'string' },
        timestamp: { type: 'string' },
        cta: { type: 'string' },
        image: { type: 'string', description: 'Logo/icon — use $asset:key reference or data URI' },
      },
    },
  },
  {
    type: 'image-card',
    description: 'Full-bleed image with optional caption overlay. Image fades in with subtle zoom. Caption slides up from bottom.',
    dataSchema: {
      type: 'object',
      required: ['image'],
      properties: {
        image: { type: 'string', description: 'Image source — use $asset:key reference, HTTPS URL, or data URI' },
        caption: { type: 'string' },
        fit: { type: 'string', enum: ['cover', 'contain', 'fill'], default: 'cover' },
        position: { type: 'string', enum: ['center', 'top', 'bottom'], default: 'center' },
        overlay: { type: 'string', enum: ['none', 'gradient', 'dark'], default: 'none' },
      },
    },
  },
  {
    type: 'bullet-list',
    description: 'Animated bullet list with staggered entrance. Items slide in with spring easing. Supports icons, highlight borders, and sub-text. Respects animation.textEffect, animation.stagger, animation.direction overrides.',
    dataSchema: {
      type: 'object',
      required: ['items'],
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            required: ['text'],
            properties: {
              text: { type: 'string' },
              sub: { type: 'string', description: 'Secondary description line' },
              icon: { type: 'string', description: 'Emoji or HTML icon' },
              highlight: { type: 'boolean', description: 'Add accent left border' },
            },
          },
        },
      },
    },
  },
  {
    type: 'stat-counter',
    description: 'Big animated numbers that count up from 0. Cards with optional progress bars, change indicators, and descriptions. Ideal for metrics, KPIs, and achievements.',
    dataSchema: {
      type: 'object',
      required: ['stats'],
      properties: {
        title: { type: 'string' },
        stats: {
          type: 'array',
          items: {
            type: 'object',
            required: ['value', 'label'],
            properties: {
              value: { type: ['string', 'number'], description: 'Numeric value to count up to' },
              label: { type: 'string' },
              prefix: { type: 'string', description: 'e.g. "$"' },
              suffix: { type: 'string', description: 'e.g. "%", "ms"' },
              icon: { type: 'string' },
              description: { type: 'string' },
              change: { type: 'string', description: 'e.g. "+12%"' },
              changeDirection: { type: 'string', enum: ['up', 'down'] },
              progress: { type: 'number', description: '0-100, fills a progress bar' },
            },
          },
        },
      },
    },
  },
  {
    type: 'text-reveal',
    description: 'Cinematic text reveal scene. Supports word-by-word, typewriter, char-cascade, fade-lines, and highlight-sweep text effects via animation.textEffect. Use <em> or <strong> in headline for gradient-colored emphasis. Great for key messages, quotes, or dramatic reveals.',
    dataSchema: {
      type: 'object',
      required: ['headline'],
      properties: {
        eyebrow: { type: 'string', description: 'Small uppercase label above headline' },
        headline: { type: 'string', description: 'Main text. Supports <em>/<strong> for accent coloring' },
        body: { type: 'string', description: 'Supporting body text below headline' },
        footnote: { type: 'string', description: 'Small monospaced note at bottom' },
      },
    },
  },
  {
    type: 'logic-flow',
    description: 'Animated flowchart / decision-tree diagram. Nodes appear in topological order with scale-in, edges draw on with stroke animation, arrowheads fade in at completion. Supports decision diamonds, process boxes, I/O parallelograms, start/end pills, and subprocess double-border rects. Back-edges (cycles) are auto-detected and rendered as dashed curves. Use highlight:true on edges to mark the happy path. Best with 5–8 nodes per scene — decompose complex flows into multiple scenes for clarity.',
    dataSchema: {
      type: 'object',
      required: ['nodes', 'edges'],
      properties: {
        title: { type: 'string' },
        nodes: {
          type: 'array',
          description: 'Max 12 nodes. 5–8 recommended per scene.',
          items: {
            type: 'object',
            required: ['id', 'label'],
            properties: {
              id: { type: 'string', description: 'Unique node identifier' },
              label: { type: 'string', description: 'Display text inside the node' },
              shape: { type: 'string', description: 'start | end | process | decision | io | subprocess' },
              sublabel: { type: 'string', description: 'Secondary line of text' },
              icon: { type: 'string', description: 'Emoji or symbol shown in node' },
              color: { type: 'string', description: 'Override fill color' },
            },
          },
        },
        edges: {
          type: 'array',
          items: {
            type: 'object',
            required: ['from', 'to'],
            properties: {
              from: { type: 'string', description: 'Source node id' },
              to: { type: 'string', description: 'Target node id' },
              label: { type: 'string', description: 'Edge label (e.g. "Yes", "No", "Pass")' },
              highlight: { type: 'boolean', description: 'True to highlight this edge as the primary path' },
            },
          },
        },
        direction: { type: 'string', description: 'LR (left-to-right, default) or TB (top-to-bottom)' },
        maxNodes: { type: 'number', description: 'Advisory limit (default 8). Validation warns above this.' },
        annotation: { type: 'string', description: 'Italic footnote below the diagram' },
      },
    },
  },
  {
    type: 'tool-call',
    description: 'Animated tool/API call visualization. Badge with tool name animates in, parameters stagger from left, a processing bar fills, then response rows slide up. Perfect for illustrating MCP tools, REST APIs, function calls, or any request→response pattern. Supports success/error status styling and optional latency badge.',
    dataSchema: {
      type: 'object',
      required: ['tool', 'params', 'response'],
      properties: {
        title: { type: 'string', description: 'Optional heading above the call visualization' },
        tool: { type: 'string', description: 'Tool or function name displayed in the badge' },
        description: { type: 'string', description: 'Short description shown next to tool name' },
        icon: { type: 'string', description: 'Emoji or symbol for the tool badge' },
        params: {
          type: 'array',
          description: 'Key-value pairs representing the call parameters',
          items: {
            type: 'object',
            required: ['key', 'value'],
            properties: {
              key: { type: 'string', description: 'Parameter name' },
              value: { type: 'string', description: 'Parameter value' },
            },
          },
        },
        response: {
          type: 'array',
          description: 'Rows of the response — can be key:value pairs or single-key labels',
          items: {
            type: 'object',
            required: ['key'],
            properties: {
              key: { type: 'string', description: 'Response field or label' },
              value: { type: 'string', description: 'Response value (omit for label-only rows)' },
              highlight: { type: 'boolean', description: 'Accent-color this row' },
            },
          },
        },
        status: { type: 'string', description: 'success (default) or error — controls icon and color' },
        latency: { type: 'string', description: 'Latency label shown in response header, e.g. "42ms"' },
        processingLabel: { type: 'string', description: 'Custom processing text (default: "Processing…")' },
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
