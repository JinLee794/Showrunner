# Showrunner — Product Spec

> An MCP server for programmatic video generation.
> Target state: any agent sends a storyboard JSON and gets back a polished video artifact.
> Current state: a working local MP4 renderer with a smaller feature surface than the surrounding docs currently claim.

## Status

This document mixes two things:

- The product vision for Showrunner.
- The current implementation reality in this repo.

Right now, the implementation is a capable prototype with a real render loop, not a finished platform. The renderer works. The surrounding product surface is ahead of the code. This spec now calls that out explicitly so the roadmap is driven by facts instead of launch-copy momentum.

## Problem

Agents produce structured data — metrics, timelines, risks, comparisons — but deliver it as text, tables, or static images. A produced video with pacing, interpolated motion, and visual hierarchy is a fundamentally different artifact. It plays in Teams, email, or async briefings without a presenter. No agent framework has a general-purpose "render me a video" tool today.

## Core Concept

```
                    ┌─── MCP stdio ──────▶ Local Engine (dev, light renders)
                    │                           │
  Any Agent ────────┤                           ▼
                    │                    Playwright + ffmpeg
                    │                           │
                    └─── MCP HTTP/SSE ──▶ Azure Function App (production)
                                                │
                                                ▼
                                    Container: Playwright + ffmpeg
                                    Blob Storage for output
                                                │
                        ┌───────────────────────┘
                        ▼
              Storyboard JSON (validated)
                        │
              ┌─────────┼─────────┐
              ▼         ▼         ▼
        Theme CSS   Scene HTML  Interpolation
              │     Templates    Functions
              └─────────┼─────────┘
                        ▼
              Playwright (warm browser)
                Frame-by-frame capture
                JS progress → element animations
                        │
                        ▼
                   ffmpeg encode
                        │
                        ▼
                MP4 → local path or Blob URL
```

The calling agent assembles a **storyboard** (declarative JSON). This engine validates it, renders each scene frame-by-frame using Playwright with JS-driven interpolation, encodes to H.264, and returns the output.

**Two transports, identical tools.** The rendering core is the same code — the transport layer determines where it runs:

| | **stdio (local)** | **HTTP/SSE (remote)** |
|---|---|---|
| Transport | Agent spawns `node dist/server.js` | Agent connects to Function App URL |
| Rendering | Local Playwright + ffmpeg | Container with Playwright + ffmpeg |
| Output | File path on disk | Blob Storage URL (SAS-signed) |
| Best for | Dev iteration, light renders, preview | Production renders, heavy/parallel workloads |
| Startup | ~2s (browser launch) | Warm container: <1s; cold start: ~8s |

**No Remotion. No subscription. No framework lock-in.** The animation quality comes from per-element JS interpolation functions (spring, easeOut, stagger) — the same mathematical approach Remotion uses, running inside standard browser pages.

---

## Reality Check

The repo is strongest at one thing: taking supported HTML scene templates, scrubbing GSAP timelines frame-by-frame in Playwright, and encoding the results into an MP4. Everything around that core is uneven. The fast roast version is: the codebase built a solid engine, then dressed it up like the rest of the car had already been assembled.

The spec and README have been promising the future tense in the present tense. That drift is now product debt.

### Current Gap Register

| Area | What the docs imply | What the repo actually does today | Priority |
|---|---|---|---|
| Public contract parity | The public surface reads like a complete product | The repo is a prototype with a narrower supported path than the docs advertise | P0 |
| Scene catalog parity | All listed scene types are renderable | Multiple scene types are present in the schema but have no matching template implementation (`risk-callout`, `deal-team`, `chart-line`, `chart-donut`) | P0 |
| Theme parity | Four built-in themes plus custom branding are available | Only `corporate-dark` and `microsoft` ship as real theme files | P0 |
| Validation parity | Rendering is protected by the full storyboard and scene-specific contracts | Only `validate_storyboard` runs per-scene data validation; the actual render and preview paths mostly rely on broad schemas and can fail later | P0 |
| Tool contract parity | `render_scene` supports multiple output formats and transport-aware outputs | Current handlers only render local MP4s; Blob output is a placeholder and format selection is not wired through | P0 |
| Transition parity | Transitions are overlap-rendered and composited | Transition helpers exist, but the main render pipeline does not perform the compositing flow described elsewhere in this spec | P1 |
| Preview architecture | Preview mode is the fast, safe mirror of runtime behavior | Preview duplicates preprocessing logic and executes scene scripts via `eval`, which is brittle and hard to reason about | P1 |
| Testing story | The project is backed by renderer, schema, and template tests | `npm test` exists, but there are currently no test files in the repo | P0 |
| Build and packaging | Asset handling is production-ready | The build is TypeScript plus manual directory copies, which is workable but fragile as the surface area grows | P2 |

### Recovery Goals

1. Make every public claim either true in code or explicitly marked as planned.
2. Ensure the render path validates the same contracts the validation tool validates.
3. Reduce the supported surface to what can be tested, then grow it back intentionally.
4. Stop shipping placeholders as if they are features.

### Recovery Workstreams

#### W1. Spec and README truth pass

Problem:
The current docs market the destination as if it is already the current release.

Required changes:
- Mark target-state sections as planned where needed.
- Remove or qualify unsupported claims about themes, scene types, transitions, output modes, and formats.
- Align tool docs with actual handler behavior.

Acceptance criteria:
- A new contributor can read the README and spec without being misled about what works today.
- No unsupported scene type, theme, output mode, or format is described as currently available.
- The documented tool contracts match the shipped MCP handlers.

#### W2. Enforce validation on the real render path

Problem:
Validation is currently strongest in the one tool that does not render anything.

Required changes:
- Reuse scene-type validation in `render_video`, `render_scene`, and `preview_storyboard`.
- Fail early with actionable errors before template loading or frame capture begins.
- Add fixture coverage for valid and invalid storyboards.

Acceptance criteria:
- Invalid scene data is rejected before rendering starts.
- Validation error messages identify the scene index, scene type, and failing field.
- `validate_storyboard` and the render tools accept and reject the same inputs.

#### W3. Close schema/template/theme drift

Problem:
The schema advertises a broader scene and theme catalog than the repo actually implements.

Required changes:
- Either implement the missing scene templates and themes or remove them from the supported enum and docs until they exist.
- Add a parity check that asserts schema entries map to actual templates and themes.
- Decide whether `custom` branding is a supported theme mode or still planned work.

Acceptance criteria:
- Every supported scene type has a template, validation schema, and example fixture coverage.
- Every supported theme resolves to a real file.
- Unsupported options fail with explicit messages instead of surfacing later as missing files.

#### W4. Bring tool contracts back under control

Problem:
The spec describes a richer tool interface than the handlers actually honor.

Required changes:
- Decide whether `render_scene` genuinely supports `gif` and `png-sequence`; if not, cut those claims for now.
- Either implement output strategies in the transport layer or document local-path-only behavior until remote output exists.
- Remove placeholder abstractions from public promises until they are wired into the runtime.

Acceptance criteria:
- Every advertised tool argument changes runtime behavior in a tested way.
- Remote output is either implemented end-to-end or documented as future work.
- There are no placeholder classes described as production behavior.

#### W5. Finish or cut transitions

Problem:
Transition behavior is documented in detail, but the render pipeline still behaves like sequential scene concatenation.

Required changes:
- Implement overlap rendering and compositing, or narrow the current transition contract to `cut` only.
- Add visual smoke tests or snapshot checks for the supported transitions.
- Keep the transition docs tied to what is actually executable.

Acceptance criteria:
- Supported transitions produce visibly distinct output in a fixture render.
- Unsupported transitions are rejected or omitted from the public contract.
- Transition helpers are either integrated or removed.

#### W6. Harden preview mode

Problem:
Preview is useful, but it currently mirrors runtime behavior through duplicated logic and dynamic script evaluation.

Required changes:
- Extract shared scene preprocessing so preview and render use the same code path.
- Remove or isolate `eval`-driven execution where possible.
- Add smoke coverage ensuring preview loads every supported scene type.

Acceptance criteria:
- Preview and render share scene preprocessing logic.
- Preview can load all supported fixtures without custom per-scene hacks.
- The preview runtime is easier to inspect and debug than it is today.

#### W7. Add a real test floor

Problem:
Right now the test command is mostly decorative.

Required changes:
- Add schema validation tests, template render smoke tests, and at least one end-to-end renderer smoke test.
- Add parity tests for schema-to-template and theme-to-file mapping.
- Gate future feature claims behind tests.

Acceptance criteria:
- `npm test` executes real automated coverage.
- Core paths fail loudly when a scene template, theme file, or tool contract drifts.
- The repo has a minimum confidence floor before adding new surface area.

## MCP Server Interface

The interface below is the target product surface. Unless otherwise noted in the Reality Check section, treat unshipped capabilities here as roadmap items rather than current guarantees.

The engine exposes the same MCP tools over two transports:

- **stdio** — Agent spawns `node dist/server.js`. Best for local dev, preview generation, and light renders.
- **HTTP/SSE (Streamable HTTP)** — Agent connects to `https://<function-app>.azurewebsites.net/mcp`. Renders offloaded to an Azure Function App with a containerized Playwright + ffmpeg runtime. Best for production workloads and keeping the agent's local machine free.

Both transports serve identical tools with identical schemas. The agent picks the transport; the engine doesn't care.

### Tools

#### `render_video`

Primary tool. Accepts a full storyboard, returns an MP4.

```typescript
{
  name: 'render_video',
  description: 'Render a storyboard into an MP4 video with animated scenes.',
  inputSchema: {
    type: 'object',
    required: ['storyboard'],
    properties: {
      storyboard: { $ref: '#/definitions/Storyboard' },
      outputPath: {
        type: 'string',
        description: 'Where to write the MP4. Default: temp dir with auto-generated name.'
      },
      quality: {
        enum: ['high', 'medium', 'fast'],
        default: 'medium',
        description: 'high=PNG frames, medium=JPEG 90%, fast=JPEG 70%'
      }
    }
  },
  // Returns: { path: string, duration: number, frames: number, fileSize: number }
}
```

#### `render_scene`

Render a single scene to MP4 or GIF. Useful for previewing one scene during storyboard iteration.

```typescript
{
  name: 'render_scene',
  inputSchema: {
    type: 'object',
    required: ['scene'],
    properties: {
      scene: { $ref: '#/definitions/Scene' },
      theme: { $ref: '#/definitions/ThemeName', default: 'corporate-dark' },
      resolution: { type: 'array', items: { type: 'number' }, default: [1920, 1080] },
      fps: { enum: [24, 30, 60], default: 30 },
      format: { enum: ['mp4', 'gif', 'png-sequence'], default: 'mp4' },
      outputPath: { type: 'string' }
    }
  }
}
```

#### `preview_storyboard`

Generate an interactive HTML preview without Playwright/ffmpeg. Instant output for iteration.

```typescript
{
  name: 'preview_storyboard',
  inputSchema: {
    type: 'object',
    required: ['storyboard'],
    properties: {
      storyboard: { $ref: '#/definitions/Storyboard' },
      outputPath: { type: 'string' }
    }
  },
  // Returns: { path: string } — self-contained HTML file
}
```

#### `list_scene_types`

Discovery tool. Returns all available scene types with descriptions and data schemas.

```typescript
{
  name: 'list_scene_types',
  inputSchema: { type: 'object', properties: {} },
  // Returns: Array<{ type: string, description: string, dataSchema: JSONSchema }>
}
```

#### `validate_storyboard`

Dry-run validation. Returns errors or a summary (scene count, total duration, frame count).

```typescript
{
  name: 'validate_storyboard',
  inputSchema: {
    type: 'object',
    required: ['storyboard'],
    properties: {
      storyboard: { $ref: '#/definitions/Storyboard' }
    }
  },
  // Returns: { valid: boolean, errors?: string[], summary?: { scenes: number, duration: number, frames: number } }
}
```

### Server Lifecycle

#### stdio mode

```
Agent MCP client → spawns: node dist/server.js (stdio)
                                │
                   Server initializes:
                     - Validates ffmpeg on PATH
                     - Launches Playwright Chromium (kept warm)
                     - Registers MCP tools
                     - Ready for requests
                                │
                   On tool call:
                     - Reuses warm browser context
                     - Creates new page per scene
                     - Renders frames → encodes → returns file path
                                │
                   On disconnect:
                     - Closes browser
                     - Cleans up temp files
                     - Exits
```

#### HTTP/SSE mode (Azure Function App)

```
Agent MCP client → HTTP POST https://<func>.azurewebsites.net/mcp
                                │
                   Function App (container):
                     - Custom Docker image: Node + Playwright + ffmpeg
                     - Chromium warm on container start (Flex Consumption / Premium plan)
                     - Same MCP tool registry, exposed via Streamable HTTP transport
                                │
                   On tool call:
                     - Reuses warm browser (container-lifetime)
                     - Renders frames → encodes → writes MP4 to Azure Blob Storage
                     - Returns SAS-signed Blob URL (1h expiry) + metadata
                                │
                   Container lifecycle:
                     - Flex Consumption: auto-scale 0→N, cold start ~8s (container pull)
                     - Premium plan: always-warm, <1s response, higher base cost
                     - Container keeps Chromium alive across invocations within same instance
```

#### Output handling by transport

| Transport | `render_video` returns | `render_scene` returns | `preview_storyboard` returns |
|---|---|---|---|
| stdio | `{ path: "/tmp/video-abc.mp4", ... }` | `{ path: "/tmp/scene-0.mp4" }` | `{ path: "/tmp/preview.html" }` |
| HTTP | `{ url: "https://...blob.../video-abc.mp4?sv=...", ... }` | `{ url: "https://...blob.../scene-0.mp4?sv=..." }` | `{ url: "https://...blob.../preview.html?sv=..." }` |

The calling agent uses `path` or `url` — both are present in the response, whichever applies.

The warm browser is the key performance optimization in both modes. stdio pays ~2s browser startup on first connection. The Function App container keeps Chromium alive for its instance lifetime (minutes to hours depending on traffic).

---

## Storyboard Schema

```typescript
interface Storyboard {
  /** Video metadata */
  title: string;
  theme?: ThemeName;                          // default: 'corporate-dark'
  fps?: 24 | 30 | 60;                        // default: 30
  resolution?: [width: number, height: number]; // default: [1920, 1080]

  /** Ordered scene sequence */
  scenes: Scene[];

  /** Optional global settings */
  branding?: {
    logo?: string;      // path to logo image
    accent?: string;    // hex color override
    font?: string;      // Google Font or system font
  };
}

interface Scene {
  type: SceneType;
  duration: number;                // seconds (min: 0.5, max: 120)
  transition?: TransitionType;     // entrance transition, default: 'fade'
  data: Record<string, unknown>;   // scene-type-specific payload
  animation?: AnimationOverrides;  // optional per-scene animation tuning
  notes?: string;                  // internal notes (not rendered)
}

interface AnimationOverrides {
  stagger?: number;       // ms between element entrances, default: 80
  easing?: EasingType;    // override default easing for this scene
  direction?: 'up' | 'down' | 'left' | 'right'; // entrance direction
  emphasis?: number[];    // indices of data items to pulse/highlight
}

type ThemeName =
  | 'corporate-dark'     // dark navy, white text, gold accent
  | 'corporate-light'    // white, dark text, blue accent
  | 'minimal'            // near-white, subtle grays
  | 'microsoft'          // follows Microsoft brand guidelines
  | 'custom';            // uses branding overrides

type TransitionType = 'cut' | 'fade' | 'slide-left' | 'slide-up' | 'zoom';

type EasingType = 'linear' | 'easeOut' | 'easeInOut' | 'spring' | 'bouncy';

type SceneType =
  | 'title-card'
  | 'section-header'
  | 'pipeline-funnel'
  | 'milestone-timeline'
  | 'risk-callout'
  | 'action-items'
  | 'deal-team'
  | 'kpi-scorecard'
  | 'chart-bar'
  | 'chart-line'
  | 'chart-donut'
  | 'table'
  | 'quote-highlight'
  | 'comparison'
  | 'closing';
```

### Scene Type Data Contracts

#### title-card
```typescript
{ title: string; subtitle?: string; date?: string; presenter?: string }
```
Full-screen branded intro. Logo fades in with scale spring, title slides up with easeOut, subtitle follows 200ms later. Background has subtle gradient shift over scene duration.

#### section-header
```typescript
{ heading: string; subheading?: string; icon?: string }
```
Transition slide between sections. Heading enters with spring, accent line draws left-to-right.

#### pipeline-funnel
```typescript
{
  stages: Array<{
    name: string;
    count: number;
    value: string;        // formatted currency
    highlight?: boolean;  // pulse animation for attention
  }>
}
```
Horizontal bars grow left-to-right with staggered spring easing (80ms between stages). Values count up from 0 using interpolated number animation. Highlighted stages pulse with accent glow.

#### milestone-timeline
```typescript
{
  milestones: Array<{
    name: string;
    due: string;          // ISO date
    status: 'on-track' | 'at-risk' | 'overdue' | 'completed';
    owner: string;
    note?: string;
  }>
}
```
Vertical timeline draws downward. Status dots appear with spring scale-in, staggered by index. At-risk/overdue dots pulse continuously. Owner labels slide in from right with easeOut.

#### risk-callout
```typescript
{
  risks: Array<{
    signal: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    context?: string;     // one-line evidence
  }>
}
```
Cards slide in from right with spring, staggered 120ms per card. Severity stripe animates color. Critical items get a persistent subtle pulse. Context text fades in 200ms after card entrance.

#### action-items
```typescript
{
  items: Array<{
    text: string;
    owner?: string;
    due?: string;
    priority?: 'high' | 'normal';
  }>
}
```
Numbered list. Each item slides up with spring easing, staggered 100ms. Check-circle icon draws its stroke on entrance. High-priority items have accent-colored left border that fades in.

#### deal-team
```typescript
{
  members: Array<{
    name: string;
    role: string;
    initials: string;
    avatar?: string;       // image path (falls back to initials circle)
    highlight?: boolean;   // primary owner
  }>
}
```
Grid of avatar circles. Each scales in with bouncy spring (stagger 60ms). Role labels fade in after avatar lands. Highlighted member has accent ring that pulses once.

#### kpi-scorecard
```typescript
{
  kpis: Array<{
    label: string;
    value: string | number;
    unit?: string;         // "$", "%", "seats"
    trend?: 'up' | 'down' | 'flat';
    target?: string;
    animateCount?: boolean; // count-up animation, default true for numbers
  }>
}
```
2×2 or 3×2 grid of KPI cards. Cards scale in with stagger. Numeric values count up from 0 over 60% of scene duration using easeOut interpolation. Trend arrows slide in from below. Target comparison bar fills proportionally.

#### chart-bar / chart-line / chart-donut
```typescript
{
  title?: string;
  labels: string[];
  datasets: Array<{
    label: string;
    values: number[];
    color?: string;
  }>;
  annotation?: string;    // bottom-right note
}
```
**bar**: Bars grow upward with staggered spring. Y-axis labels fade in. Hover-style value labels appear at bar tops.
**line**: Line draws left-to-right using path interpolation. Data points pop in with spring scale after line passes them. Area fill fades in.
**donut**: Segments fill clockwise with easeInOut. Center label counts up. Legend items stagger in.

Bar and donut charts use DOM elements animated by GSAP. Line charts use SVG paths with DrawSVG plugin (optional — falls back to CSS clip-path animation).

#### table
```typescript
{
  title?: string;
  columns: Array<{ key: string; label: string; width?: string }>;
  rows: Array<Record<string, string>>;
  highlightRows?: number[];  // 0-indexed rows to emphasize
}
```
Header row fades in first. Data rows slide up sequentially (60ms stagger). Highlighted rows have accent background that fades in after row entrance.

#### quote-highlight
```typescript
{
  quote: string;
  attribution?: string;  // "— Email from CTO, March 28"
  sentiment?: 'positive' | 'negative' | 'neutral';
}
```
Quote mark scales in with spring. Quote text fades in word-by-word or line-by-line (configurable). Attribution slides up 400ms after quote completes. Sentiment colors the accent line.

#### comparison
```typescript
{
  title?: string;
  left: { label: string; items: string[] };
  right: { label: string; items: string[] };
}
```
Center divider draws top-to-bottom. Left items slide in from left, right items from right, alternating with 100ms stagger. Labels appear first with spring.

#### closing
```typescript
{
  tagline?: string;       // default: "Showrunner"
  timestamp?: string;
  cta?: string;           // "Questions? Reach out to the team"
}
```
Branded outro. Logo scales in with spring. Tagline fades up. Timestamp and CTA stagger in below.

---

## Animation System

The animation system is the core differentiator. It uses **GSAP** (GreenSock Animation Platform) — the industry-standard web animation library — with its timelines paused and scrubbed frame-by-frame by the renderer. This gives us professional-grade motion (springs, staggers, SVG path drawing, text splitting) without building a custom interpolation engine.

### Why GSAP

| Consideration | GSAP | Custom motion lib | anime.js |
|---|---|---|---|
| **Frame-seekable** | `.progress(0-1)` on any timeline | Manual per-element math | `.seek(ms)` |
| **Timeline choreography** | Hierarchical timelines with labels, overlaps | None — manual offset math | Basic |
| **Stagger** | Built-in, deeply integrated | Manual helper function | Built-in |
| **Easing library** | 30+ built-in, custom cubic-bezier, springs | Must implement each one | Limited |
| **Plugins** | SplitText (word animation), DrawSVG, MorphSVG, MotionPath | N/A | N/A |
| **Template author familiarity** | Industry standard — most animators know it | Nobody knows it | Some |
| **License** | Free "no-charge" license (non-competing tool) | N/A | MIT |

### How It Works

Each scene template builds a **GSAP timeline** (`gsap.timeline({ paused: true })`) that choreographs all element animations. The renderer scrubs this timeline to the correct progress for each frame, then screenshots.

```
Renderer (Node)                          Browser Page (Playwright)
─────────────────                        ────────────────────────
Load page with scene HTML + GSAP
                                         Scene JS builds paused GSAP timeline:
                                           tl.from('.title', { y: 30, opacity: 0, ease: 'back.out' })
                                             .from('.bars', { scaleX: 0, stagger: 0.08, ease: 'power3.out' })
                                             .from('.values', { textContent: 0, snap: { textContent: 1 } })

for frame in 0..totalFrames:
  progress = frame / totalFrames    →    window.__seek(0.42)
  page.evaluate(seek)                    tl.progress(0.42)  // GSAP renders all elements at this point
  page.screenshot()                      ← frame captured
```

GSAP's `.progress()` is deterministic — the same input always produces the same DOM state. No requestAnimationFrame, no timing jitter, no dropped frames. Every frame is pixel-perfect.

### GSAP Features Used Per Scene Type

| Feature | Used In | Effect |
|---|---|---|
| `gsap.from()` / `gsap.to()` | All scenes | Animate any CSS property with easing |
| `stagger` | pipeline-funnel, action-items, kpi-scorecard, table | Sequential element entrance with configurable delay |
| `ease: 'back.out(1.7)'` | title-card, section-header | Overshoot spring for impactful entrances |
| `ease: 'elastic.out'` | deal-team avatars, kpi values | Bouncy, energetic entrance |
| `ease: 'power3.out'` | Bars, progress fills | Fast start, smooth deceleration |
| `snap: { textContent: 1 }` | kpi-scorecard, pipeline-funnel | Count-up number animation (rounds to integers) |
| `DrawSVGPlugin` | chart-line, milestone-timeline | SVG path draw-on animation |
| `SplitText` | quote-highlight | Word-by-word or character-by-character text reveal |
| Timeline labels | All scenes | Named positions for precise choreography |
| Nested timelines | Complex scenes | Compose sub-animations independently |

### Example: How a Scene Template Uses GSAP

```html
<!-- pipeline-funnel.html -->
<div id="scene" class="pipeline-funnel">
  <h2 class="scene-title">Pipeline Overview</h2>
  {{#each stages}}
  <div class="stage">
    <div class="stage-bar" style="--target-width: {{this.widthPercent}}%"></div>
    <span class="stage-label">{{this.name}}</span>
    <span class="stage-value">{{this.count}}</span>
  </div>
  {{/each}}
</div>

<script>
  // Scene duration (used for stagger timing proportions)
  const duration = {{duration}};

  // Build the master timeline — paused, scrubbed by renderer
  const tl = gsap.timeline({ paused: true });

  // Title entrance: slide up with overshoot spring
  tl.from('.scene-title', {
    y: 30,
    opacity: 0,
    duration: 0.4,
    ease: 'back.out(1.7)'
  })

  // Bars grow left-to-right with staggered power3 easing
  .from('.stage-bar', {
    scaleX: 0,
    transformOrigin: 'left center',
    duration: 0.6,
    stagger: 0.08,
    ease: 'power3.out'
  }, '-=0.1')  // slight overlap with title

  // Labels fade in alongside their bars
  .from('.stage-label', {
    opacity: 0,
    x: -10,
    duration: 0.3,
    stagger: 0.08,
    ease: 'power2.out'
  }, '<')  // same start as bars

  // Values count up from 0
  .from('.stage-value', {
    textContent: 0,
    duration: 0.8,
    stagger: 0.08,
    ease: 'power2.out',
    snap: { textContent: 1 },  // round to integers
    // Format with commas after snap
    onUpdate: function() {
      document.querySelectorAll('.stage-value').forEach(el => {
        el.textContent = Number(el.textContent).toLocaleString();
      });
    }
  }, '-=0.4');

  // Expose seek function for renderer
  window.__seek = (progress) => tl.progress(progress);
</script>
```

**Key differences from a custom motion library:**
- No manual interpolation math — GSAP handles all easing, stagger offsets, and property updates
- Timeline-relative positioning (`'-=0.1'`, `'<'`) replaces manual progress offset calculation
- `snap: { textContent: 1 }` replaces a custom `countUp()` function
- `stagger: 0.08` replaces manual stagger helpers
- Adding a new animation is one line, not 5-10 lines of interpolation math

The renderer calls `window.__seek(progress)` each frame, then screenshots. GSAP's timeline handles all the choreography internally.

### GSAP Licensing

GSAP core + most plugins are free under the "no-charge" license for tools that don't compete with GSAP itself. This video engine is a server-side rendering tool, not an animation authoring tool — it qualifies clearly.

Premium plugins (SplitText, DrawSVG, MorphSVG) require a GSAP Club membership ($99/yr) for use in commercial tools. These are optional enhancements — scenes degrade gracefully without them (e.g., quote text fades in as a block instead of word-by-word).

GSAP is bundled into each page by the renderer (not served from CDN), so it works in headless Chromium with no network.

---

## Themes

Each theme is a CSS custom property set injected into every scene page:

```css
/* corporate-dark.css */
:root {
  --bg-primary: #0d1117;
  --bg-secondary: #161b22;
  --bg-tertiary: #21262d;
  --text-primary: #ffffff;
  --text-secondary: #8b949e;
  --text-muted: #484f58;
  --accent: #4fc3f7;
  --accent-secondary: #d4af37;
  --accent-glow: rgba(79, 195, 247, 0.15);
  --risk-critical: #ff4757;
  --risk-high: #ff6b35;
  --risk-medium: #ffa726;
  --risk-low: #66bb6a;
  --status-on-track: #4caf50;
  --status-at-risk: #ff9800;
  --status-overdue: #f44336;
  --status-completed: #4fc3f7;
  --font-heading: 'Segoe UI', system-ui, sans-serif;
  --font-body: 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'Cascadia Code', monospace;
  --border-radius: 12px;
  --border-radius-sm: 6px;
  --spacing-unit: 8px;
  --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.3);
  --shadow-glow: 0 0 20px var(--accent-glow);
}
```

Themes are standalone CSS files. The renderer injects the theme into the page before each scene renders. Agents should not need to think about themes — they pick a name, the engine handles the rest.

---

## Transitions

Transitions are rendered as an overlap period (default 0.5s) between consecutive scenes. During the overlap, the outgoing scene is captured with an exit animation and the incoming scene with an entrance animation. Frames are alpha-composited.

The renderer handles transitions by:
1. Rendering the last N frames of scene A with `window.__animateExit(exitProgress)` (0→1)
2. Rendering the first N frames of scene B with entrance animation (progress starts from transition start)
3. Compositing both frame sets with alpha blending via Canvas

Transition types affect the exit/entrance transforms:

| Transition | Exit | Entrance |
|---|---|---|
| `cut` | No overlap — hard cut | Immediate |
| `fade` | Opacity 1→0 | Opacity 0→1 |
| `slide-left` | TranslateX 0→-100% | TranslateX 100%→0 |
| `slide-up` | TranslateY 0→-100% | TranslateY 100%→0 |
| `zoom` | Scale 1→1.1 + opacity→0 | Scale 0.9→1 + opacity→1 |

---

## Renderer

### Dependencies

| Package | Purpose | License |
|---|---|---|
| `playwright` | Headless Chromium for frame capture | Apache 2.0 |
| `fluent-ffmpeg` | Video encoding wrapper | MIT |
| `ffmpeg` (system) | H.264 encoding | LGPL (CLI, not linked) |
| `gsap` | Animation engine (timelines, easing, stagger) | No-charge license |
| `gsap` plugins | SplitText, DrawSVG (optional, premium) | GSAP Club ($99/yr) |
| `handlebars` | HTML template rendering | MIT |
| `@modelcontextprotocol/sdk` | MCP server framework | MIT |
| `zod` | Schema validation | MIT |

### Render Pipeline

```
1. Validate storyboard against Zod schema
2. Resolve theme CSS + scene templates + GSAP bundle
3. Acquire warm Playwright browser page (reuse from pool)
4. For each scene:
   a. Build HTML: base template + theme CSS + GSAP bundle + scene template + data
   b. Set page content, set viewport to target resolution
   c. Wait for scene JS to build paused GSAP timeline
   d. For each frame (0 → scene.duration × fps):
      - progress = frame / totalFrames
      - page.evaluate((p) => window.__seek(p), progress)
      - page.screenshot({ type: quality === 'high' ? 'png' : 'jpeg' })
      - Write frame to temp dir
   d. If transition to next scene, render overlap frames (composite)
5. Return page to pool
6. Encode: ffmpeg frames → H.264 MP4 (CRF 18 for high, 23 for medium, 28 for fast)
7. Clean up temp frames
8. Return { path, duration, frames, fileSize }
```

### Performance Targets

| Resolution | FPS | Duration | Frames | Target render time |
|---|---|---|---|---|
| 1920×1080 | 30 | 30s | 900 | < 60s |
| 1280×720 | 30 | 30s | 900 | < 30s |
| 1920×1080 | 30 | 60s | 1800 | < 120s |

Optimization levers:
- JPEG instead of PNG frames (3-5× faster I/O)
- Frame deduplication for static holds (hash consecutive frames, skip duplicates)
- Lower resolution for preview renders
- Parallel scene rendering across multiple browser pages (future)

---

## Preview Mode

The `preview_storyboard` tool generates a self-contained HTML file that plays the storyboard in-browser — no Playwright, no ffmpeg, instant output.

The preview HTML contains:
- All scene templates inlined
- GSAP core inlined (no CDN dependency)
- requestAnimationFrame loop scrubbing GSAP timelines via `window.__seek(progress)`
- Transport controls: play/pause, scrub timeline, scene navigation
- Frame counter and progress indicator
- Scene data baked in as JSON

This is the fast iteration loop. An agent can call `preview_storyboard` to verify layout before committing to a full `render_video`.

---

## Project Structure

```
showrunner/
├── package.json
├── tsconfig.json
├── src/
│   ├── server.ts                    # MCP server entry — stdio + HTTP transports
│   ├── tools/                       # MCP tool handlers (transport-agnostic)
│   │   ├── render-video.ts
│   │   ├── render-scene.ts
│   │   ├── preview-storyboard.ts
│   │   ├── list-scene-types.ts
│   │   └── validate-storyboard.ts
│   ├── renderer/
│   │   ├── index.ts                 # Main render pipeline
│   │   ├── frame-capture.ts         # Playwright frame loop
│   │   ├── encoder.ts               # ffmpeg encoding
│   │   ├── transitions.ts           # Scene transition compositing
│   │   ├── browser-pool.ts          # Warm Playwright browser management
│   │   └── preview.ts              # HTML preview generator
│   ├── output/
│   │   ├── index.ts                 # Output strategy interface
│   │   ├── local.ts                 # Write to disk, return file path
│   │   └── blob.ts                  # Upload to Azure Blob, return SAS URL
│   ├── motion/
│   │   ├── gsap-bundle.ts           # GSAP core + plugins, bundled for injection into pages
│   │   └── presets.ts               # Reusable GSAP animation presets (entrance, countUp, etc.)
│   ├── templates/
│   │   ├── base.html                # Common layout: viewport, theme injection, GSAP bundle
│   │   └── scenes/
│   │       ├── title-card.html
│   │       ├── section-header.html
│   │       ├── pipeline-funnel.html
│   │       ├── milestone-timeline.html
│   │       ├── risk-callout.html
│   │       ├── action-items.html
│   │       ├── deal-team.html
│   │       ├── kpi-scorecard.html
│   │       ├── chart-bar.html
│   │       ├── chart-line.html
│   │       ├── chart-donut.html
│   │       ├── table.html
│   │       ├── quote-highlight.html
│   │       ├── comparison.html
│   │       └── closing.html
│   ├── themes/
│   │   ├── corporate-dark.css
│   │   ├── corporate-light.css
│   │   ├── minimal.css
│   │   └── microsoft.css
│   ├── schema/
│   │   └── storyboard.ts           # Zod schemas for validation
│   └── types/
│       └── index.ts                 # TypeScript interfaces
├── infra/                           # Azure Function App deployment
│   ├── Dockerfile                   # Node 20 + Playwright deps + ffmpeg
│   ├── host.json                    # Function App config
│   ├── function.json                # HTTP trigger binding for /mcp
│   └── bicep/
│       ├── main.bicep               # Function App + Storage + Container Registry
│       └── parameters.json
├── fixtures/
│   ├── sample-storyboard.json       # Generic demo storyboard
│   └── sample-kpi-report.json       # KPI-heavy example
├── tests/
│   ├── render.test.ts
│   ├── gsap-timeline.test.ts        # GSAP timeline seek + determinism tests
│   ├── templates.test.ts
│   └── schema.test.ts
└── docs/
    ├── scene-catalog.md             # Visual reference for each scene type
    └── mcp-integration.md           # How agents connect (stdio + HTTP)
```

---

## Milestones

The original milestone list assumed a smoother path from prototype to product than the codebase actually took. The first milestone now needs to be a stabilization pass.

### M0: Stop Lying To Ourselves
- Align the README, spec, tool schemas, and handler behavior.
- Enforce scene-specific validation on render and preview paths.
- Cut or implement unsupported scene types, themes, transitions, and output modes.
- Add a minimum automated test floor for schema parity, template coverage, and renderer smoke tests.
- Decide which features are truly v1 and remove placeholder promises for the rest.

### M1: MCP Server + Static Render (stdio)
- MCP server (**stdio** transport) with `render_video` and `validate_storyboard` tools
- Renderer pipeline: Playwright → frames → ffmpeg → MP4
- GSAP integration: core + timeline scrubbing via `window.__seek(progress)`
- 3 scene templates: `title-card`, `pipeline-funnel`, `action-items` — with GSAP timeline animations
- 1 theme: `corporate-dark`
- Warm browser pool (single instance)
- Local output strategy (file path)
- Sample fixture storyboard
- Zod schema validation

### M2: Full Animation + Transitions + Preview
- GSAP easing + stagger tuning across all templates
- `fade`, `cut`, `slide-left` transitions with frame compositing
- 3 more templates: `milestone-timeline`, `risk-callout`, `kpi-scorecard`
- `preview_storyboard` tool → self-contained HTML output
- `render_scene` tool for single-scene renders

### M3: Full Scene Library + Themes
- Remaining scene types: `deal-team`, `chart-*`, `table`, `quote-highlight`, `comparison`, `section-header`, `closing`
- All 4 themes
- `slide-up` and `zoom` transitions
- `list_scene_types` tool with full JSON Schema per scene
- Performance optimization pass (JPEG frames, frame dedup)

### M4: Remote Rendering (Azure Function App)
- **HTTP/SSE transport** — same MCP tools, accessible via `https://<func>.azurewebsites.net/mcp`
- Dockerfile: Node 20 + Playwright system deps + ffmpeg, optimized for cold start
- Azure Blob Storage output strategy (SAS-signed URLs)
- Bicep IaC: Function App (Flex Consumption or Premium) + Storage Account + ACR
- `src/server.ts` dual-mode: detects transport from env/CLI flag
- Output abstraction: `OutputStrategy` interface → `LocalOutput` / `BlobOutput`
- Container health check + warm browser on startup
- Tested: cold start time, concurrent render limits, blob cleanup policy

### M5: Polish + Docs
- GSAP animation tuning — ease configs, stagger timing, pacing review
- Optional premium plugins: SplitText for quote scene, DrawSVG for chart-line
- Custom font loading via branding config
- Background music support
- MCP integration docs covering both transports
- Template screenshot tests in CI
- Blob TTL policy (auto-delete rendered videos after 24h)

### Future: Narration
- Azure TTS integration
- SSML generation from narration text
- Audio-scene timing synchronization
- Audio muxing into final MP4
- Scene auto-extend when narration exceeds duration

---

---

## Azure Function App Architecture

### Container Image

```dockerfile
# infra/Dockerfile
FROM mcr.microsoft.com/playwright:v1.50.0-noble

RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY dist/ ./dist/
COPY src/templates/ ./dist/templates/
COPY src/themes/ ./dist/themes/

# Pre-warm: install browser on build, not on cold start
RUN npx playwright install chromium

ENV NODE_ENV=production
ENV TRANSPORT=http
ENV AZURE_STORAGE_CONNECTION_STRING=""
ENV PORT=8080

EXPOSE 8080
CMD ["node", "dist/server.js"]
```

### Server Transport Selection

```typescript
// src/server.ts — simplified
const transport = process.env.TRANSPORT || 'stdio';

if (transport === 'http') {
  // Streamable HTTP transport for Function App
  const app = express();
  app.post('/mcp', mcpHttpHandler(server));
  app.get('/mcp', mcpSseHandler(server));  // SSE for streaming
  app.get('/health', (_, res) => res.json({ status: 'ok', browser: pool.isReady() }));
  app.listen(Number(process.env.PORT) || 8080);
} else {
  // stdio transport for local dev
  server.connect(new StdioTransport());
}
```

### Output Strategy

```typescript
interface OutputStrategy {
  write(buffer: Buffer, filename: string): Promise<OutputResult>;
  cleanup(id: string): Promise<void>;
}

interface OutputResult {
  path?: string;   // local file path (stdio mode)
  url?: string;    // SAS-signed blob URL (HTTP mode)
  fileSize: number;
}

// LocalOutput — writes to /tmp, returns path
// BlobOutput — uploads to Azure Blob Storage container, returns SAS URL with 1h expiry
```

The output strategy is selected based on transport. Tool handlers call `output.write()` and return whichever field is populated. The calling agent doesn't need to know which transport is active — it uses `path` or `url` from the response.

### Infrastructure (Bicep)

Deployed resources:
- **Azure Container Registry** — hosts the engine Docker image
- **Azure Function App** (Flex Consumption, Linux, custom container) — runs the MCP server
- **Azure Storage Account** — Blob container for rendered video output + Function App backing storage
- **Managed Identity** — Function App → Storage Account (Storage Blob Data Contributor)

Flex Consumption plan scales to 0 when idle (no cost) and auto-scales on demand. Cold start is ~8s (container pull + Chromium init). For latency-sensitive workloads, Premium plan keeps instances warm.

### Agent Configuration

Agents reference the engine in their MCP config:

```json
{
  "mcpServers": {
    "video-engine-local": {
      "command": "node",
      "args": ["path/to/showrunner/dist/server.js"],
      "transport": "stdio"
    },
    "video-engine-remote": {
      "url": "https://showrunner.azurewebsites.net/mcp",
      "transport": "http"
    }
  }
}
```

The agent author chooses which to configure — or both, using local for preview and remote for final renders.

---

## Open Questions

1. **Aspect ratios**: 16:9 (1920×1080) is default. Support 9:16 for mobile/social? 1:1 for Teams cards? (Probably v2.)
2. **Streaming output**: Should `render_video` support progress notifications via MCP? (MCP supports notifications — could report % complete.)
3. **Template extensibility**: Should agents be able to register custom scene templates at runtime? (Probably not v1 — the built-in library should cover most cases.)
4. **Browser resource limits**: How many concurrent renders before Chromium OOMs? Need to test and set a sane max per container instance.
5. **Output formats**: MP4 is primary. WebM? GIF for short clips? (GIF via `render_scene` is in scope; WebM is easy to add.)
6. **Blob retention**: Auto-delete rendered videos after 24h via lifecycle policy? Or let agents manage cleanup via a future `delete_output` tool?
7. **Auth for remote endpoint**: Function-level API key is simplest. Entra ID (managed identity for calling agents) is more secure. Which for v1?
8. **Max video duration**: Should the Function App enforce a duration cap to prevent runaway renders? (60s timeout on Flex Consumption, 230s on Premium.)
