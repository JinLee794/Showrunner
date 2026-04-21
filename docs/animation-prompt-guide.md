# Showrunner Animation Prompt Engineering Guide

> **For AI agents** generating storyboard JSON — how to use animation overrides
> to control pacing, text effects, and visual quality.

---

## Animation Overrides Schema

Every scene accepts an optional `animation` object:

```json
{
  "type": "text-reveal",
  "duration": 6,
  "data": { "headline": "Ship faster with <em>confidence</em>" },
  "animation": {
    "easing": "spring",
    "textEffect": "word-reveal",
    "stagger": 0.1,
    "direction": "up",
    "speed": 1.0,
    "delay": 0.3,
    "exitAnimation": "fade",
    "pacing": { "entrance": 0.3, "hold": 0.5, "exit": 0.2 },
    "emphasis": [0, 2]
  }
}
```

### Field Reference

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `easing` | EasingType | `"easeOut"` | Global easing for the scene's entrance animations |
| `textEffect` | TextEffect | none | Text display mechanism for primary text |
| `stagger` | number | varies | Delay between staggered items (seconds) |
| `direction` | `up\|down\|left\|right` | `up` | Direction elements enter from |
| `speed` | number (0.1–5) | 1 | Timeline speed multiplier |
| `delay` | number | 0 | Delay before entrance begins |
| `exitAnimation` | `fade\|slide-up\|slide-down\|scale-down\|none` | `none` | How the scene exits |
| `pacing.entrance` | 0–1 | 0.3 | Fraction of duration for entrance |
| `pacing.hold` | 0–1 | 0.5 | Fraction of duration showing final state |
| `pacing.exit` | 0–1 | 0.2 | Fraction of duration for exit |
| `emphasis` | number[] | [] | Indices of items to emphasize (pulse/highlight) |

---

## Easing Types

| Name | Feel | Best For |
|------|------|----------|
| `linear` | Constant speed | Progress bars, loading |
| `easeOut` | Fast start, gentle stop | General UI, default |
| `easeInOut` | Smooth start and end | Transitions, transforms |
| `spring` | Overshoot bounce-back | Cards, buttons, emphasis |
| `bouncy` | Elastic wobble | Playful, attention-grabbing |
| `elastic` | Tight elastic snap | Tech demos, precise |
| `slow` | Dramatic slow-motion feel | Cinematic reveals |
| `snap` | Sharp decisive movement | Strong professional |
| `power1` | Gentle, subtle motion | Backgrounds, ambient |
| `power4` | Aggressive, punchy | Impactful stat reveals |
| `circ` | Circular arc motion | Geometric, clean |
| `expo` | Exponential acceleration | Dramatic entrances |
| `steps` | Stepped/discrete frames | Retro, technical |

---

## Text Effects

| Effect | Description | Best For |
|--------|-------------|----------|
| `typewriter` | Characters appear one-by-one with cursor | Code, technical, hacker feel |
| `word-reveal` | Words fade up individually | Headlines, key messages |
| `char-cascade` | Characters cascade in with 3D rotation | Dramatic reveals, titles |
| `fade-lines` | Lines fade in sequentially | Body text, paragraphs |
| `highlight-sweep` | Text highlight sweeps across | Emphasis, key phrases |
| `counter` | Number counts up from 0 | Metrics, statistics |

---

## Pacing Strategy Guide

### Short scenes (3–4s) — Fast pace
```json
"animation": { "pacing": { "entrance": 0.5, "hold": 0.5, "exit": 0 } }
```
No exit animation. All motion up front, hold the rest.

### Standard scenes (5–7s) — Balanced
```json
"animation": { "pacing": { "entrance": 0.3, "hold": 0.5, "exit": 0.2 } }
```
Default feel. Entrance animations complete in first third.

### Long/complex scenes (8–15s) — Deliberate
```json
"animation": {
  "pacing": { "entrance": 0.2, "hold": 0.6, "exit": 0.2 },
  "stagger": 0.2,
  "speed": 0.8
}
```
Slower stagger so items appear gradually. More hold time to read.

### Dramatic reveal scenes — Cinematic
```json
"animation": {
  "textEffect": "word-reveal",
  "easing": "slow",
  "delay": 0.5,
  "speed": 0.7,
  "exitAnimation": "fade"
}
```

---

## Scene Type × Animation Pairing Recommendations

### Data-heavy scenes (kpi-scorecard, table, chart-*)
- Use `stagger: 0.08–0.15` so items don't pile up
- `easing: "spring"` for cards, `"easeOut"` for bars/lines
- Longer hold times: `pacing.hold: 0.6`
- `speed: 0.9` gives readers time to absorb numbers

### Narrative scenes (text-reveal, quote-highlight, section-header)
- `textEffect: "word-reveal"` or `"char-cascade"` for drama
- `easing: "slow"` or `"expo"` for cinematic feel
- `exitAnimation: "fade"` for smooth transitions
- Use `delay: 0.3` to let the previous scene settle

### List scenes (bullet-list, action-items, comparison)
- `stagger: 0.12–0.2` — enough gap to read each item
- `direction: "left"` for left-aligned lists, `"up"` for centered
- `easing: "spring"` for playful, `"easeOut"` for corporate
- `emphasis: [0, 2]` to highlight key items

### Title/transition scenes (title-card, section-header, closing)
- `textEffect: "word-reveal"` or `"char-cascade"`
- `easing: "spring"` or `"expo"` for impact
- `exitAnimation: "slide-up"` before content scenes
- Keep `duration: 4–5s` — enough for text to land

### Counter/metric scenes (stat-counter, kpi-scorecard)
- `easing: "power4"` makes numbers feel punchy
- `stagger: 0.15` between cards
- No text effect needed — count-up is built in
- `speed: 0.8` to savor the count-up

### Review scenes (code-diff, table, comparison, risk-callout)
- Lead with orientation: file path, one-line summary, and 2-4 reviewer metrics
- Keep motion restrained: `easing: "easeOut"`, `stagger: 0.03–0.08`, `speed: 0.9–1.0`
- Prefer one focused hunk per scene instead of packing a full PR into one frame
- Use callouts for review questions or risk framing, not to restate every changed line

---

## Reviewer-Oriented Storyboards

When the audience is code reviewers, the storyboard should reduce scanning effort instead of maximizing spectacle.

### Recommended sequence

1. Use `title-card` or `section-header` to state the review goal.
2. Use `code-diff` for the most behaviorally important hunk.
3. Use `risk-callout` or `comparison` to frame regressions, tradeoffs, or before/after behavior.
4. Use `action-items` to end with explicit reviewer checks.

### Good prompt pattern

```text
Create a reviewer-focused storyboard for this proposed change. Minimize cognitive load.
Start with the user-visible behavior change, show only the highest-risk diff hunk,
include 2-3 callouts that tell reviewers what to verify, and end with explicit review checks.
Use restrained animation and avoid decorative motion.
```

### Recommended `code-diff` shape

```json
{
  "type": "code-diff",
  "duration": 7,
  "data": {
    "title": "Primary Diff",
    "filePath": "src/example.ts",
    "summary": "Explains the behavioral change before the reviewer reads code.",
    "focusLabel": "Behavioral change",
    "metrics": [
      { "label": "Added", "value": "+8", "tone": "positive" },
      { "label": "Risk", "value": "Medium", "tone": "caution" }
    ],
    "callouts": [
      "Call out the test or edge case reviewers should inspect.",
      "Note whether the blast radius is localized or cross-cutting."
    ],
    "hunks": [
      {
        "heading": "handleRequest()",
        "lines": [
          { "kind": "context", "oldNumber": 41, "newNumber": 41, "text": "export async function handleRequest(req: Request) {" },
          { "kind": "add", "newNumber": 42, "text": "  if (!req.headers.authorization) {" },
          { "kind": "add", "newNumber": 43, "text": "    return unauthorized();" },
          { "kind": "add", "newNumber": 44, "text": "  }" }
        ]
      }
    ]
  },
  "animation": { "easing": "easeOut", "stagger": 0.05, "speed": 0.95 }
}
```

---

## Example: Mixed-Pace Storyboard

```json
{
  "title": "Q2 Business Review",
  "theme": "microsoft",
  "fps": 30,
  "scenes": [
    {
      "type": "title-card",
      "duration": 5,
      "data": { "title": "Q2 Business Review", "subtitle": "Engineering Excellence", "date": "2026-Q2" },
      "animation": { "textEffect": "word-reveal", "easing": "expo", "exitAnimation": "fade" }
    },
    {
      "type": "stat-counter",
      "duration": 7,
      "data": {
        "title": "Key Metrics",
        "stats": [
          { "value": 2847, "label": "Deployments", "suffix": "+", "change": "+34%", "changeDirection": "up", "progress": 85 },
          { "value": 99.97, "label": "Uptime", "suffix": "%", "progress": 99 },
          { "value": 142, "label": "Team Size", "change": "+18", "changeDirection": "up", "progress": 71 }
        ]
      },
      "animation": { "easing": "power4", "stagger": 0.18, "pacing": { "entrance": 0.25, "hold": 0.6, "exit": 0.15 } }
    },
    {
      "type": "bullet-list",
      "duration": 6,
      "data": {
        "title": "Top Priorities",
        "items": [
          { "text": "Zero-downtime migration to v3 API", "sub": "Target: August 2026", "highlight": true },
          { "text": "Reduce P50 latency below 50ms", "sub": "Currently: 73ms" },
          { "text": "Ship mobile SDK public beta", "icon": "📱" },
          { "text": "SOC 2 Type II certification", "sub": "Audit scheduled Q3" }
        ]
      },
      "animation": { "stagger": 0.18, "easing": "spring", "direction": "left" }
    },
    {
      "type": "text-reveal",
      "duration": 5,
      "data": {
        "eyebrow": "Our Mission",
        "headline": "Build tools that make <em>every developer</em> more productive",
        "body": "We ship with confidence, measure with precision, and iterate with purpose."
      },
      "animation": { "textEffect": "word-reveal", "easing": "slow", "delay": 0.3, "exitAnimation": "fade" }
    }
  ]
}
```

---

## Anti-Patterns to Avoid

1. **Don't over-animate** — Not every scene needs `textEffect` + custom easing + exit. Save drama for 1–2 key moments.
2. **Don't use `bouncy` on data scenes** — Elastic wobble on charts/tables looks unprofessional.
3. **Don't set `speed` below 0.5** — Timeline gets sluggish and frames waste render time.
4. **Don't combine `typewriter` with short durations** — At 3s with 100 chars, characters fly by too fast.
5. **Don't use `steps` easing on smooth animations** — It's designed for discrete/retro effects only.
6. **Don't set stagger > 0.3 unless very few items** — 8 items × 0.3s stagger = 2.4s just for entrance.
