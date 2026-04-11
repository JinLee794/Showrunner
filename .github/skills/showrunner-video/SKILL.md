---
name: showrunner-video
description: 'Generate Showrunner storyboard JSON for rendering animated MP4 videos. Use when asked to create a video, render a presentation, build an animated recap, or produce visual content from data. Covers scene type selection, animation overrides, asset references, branding, and storyboard structure. Triggers: create video, render video, make a video, video recap, animated presentation, showrunner, storyboard, render MP4, video from data.'
argument-hint: 'Describe what the video should contain — topic, data, audience, tone'
---

# Showrunner Video Generation

Generate well-structured storyboard JSON that the Showrunner MCP server renders into polished MP4 videos with GSAP-powered animations.

## When to Use

- User asks to create, render, or produce a video
- User wants an animated recap, briefing, or presentation
- User has data (KPIs, charts, timelines) they want visualized
- User mentions Showrunner, storyboard, or render_video

## MCP Tools Available

Call these via the Showrunner MCP server:

| Tool | Purpose | When |
|------|---------|------|
| `list_scene_types` | Get all 18+ scene types with data schemas | Before building a storyboard — discover what's available |
| `validate_storyboard` | Dry-run validation without rendering | After building JSON — catch errors before the slow render |
| `render_video` | Full render → MP4 | Final step — produces the video file |
| `render_scene` | Render a single scene | Testing one scene type |
| `render_gif` | Render → animated GIF | For previews or docs |
| `preview_storyboard` | Instant HTML preview | Quick iteration, no ffmpeg needed |

## Storyboard Structure

```json
{
  "title": "Video Title",
  "theme": "microsoft",
  "fps": 30,
  "resolution": [1920, 1080],
  "branding": {
    "logo": "$asset:logo",
    "accent": "#0078D4"
  },
  "assets": {
    "logo": "https://example.com/logo.png"
  },
  "scenes": [
    {
      "type": "title-card",
      "duration": 5,
      "transition": "fade",
      "data": { "title": "...", "subtitle": "...", "image": "$asset:logo" },
      "animation": { "easing": "spring" }
    }
  ]
}
```

### Key Fields

| Field | Required | Notes |
|-------|----------|-------|
| `title` | Yes | Video title (metadata) |
| `theme` | No | `corporate-dark` (default), `microsoft`, `corporate-light` |
| `fps` | No | 24, 30 (default), or 60 |
| `resolution` | No | `[1920, 1080]` default. Also supports `[1280, 720]` |
| `branding.logo` | No | Renders as persistent watermark on every scene (bottom-right) |
| `assets` | No | Map of key → URL/path. Referenced as `$asset:key` in scene data |
| `scenes` | Yes | Array of scene objects (min 1) |

### Scene Object

| Field | Required | Notes |
|-------|----------|-------|
| `type` | Yes | One of the 18+ scene types |
| `duration` | Yes | Seconds (2–15 typical) |
| `transition` | No | `cut`, `fade`, `slide-left`, `slide-up`, `zoom` |
| `data` | Yes | Scene-specific data (varies by type) |
| `animation` | No | Override default animation behavior |
| `notes` | No | Agent notes (not rendered) |

## Scene Types Quick Reference

### Narrative / Structure
| Type | Use For | Key Data Fields |
|------|---------|----------------|
| `title-card` | Opening slide with logo | `title`, `subtitle`, `date`, `presenter`, `image` |
| `section-header` | Chapter dividers | `heading`, `subheading`, `image` |
| `closing` | Closing slide with CTA | `tagline`, `cta`, `timestamp`, `image` |
| `text-reveal` | Dramatic text moments | `eyebrow`, `headline`, `body`, `footnote` |
| `quote-highlight` | Pull quotes | `quote`, `attribution`, `sentiment` |

### Data / Charts
| Type | Use For | Key Data Fields |
|------|---------|----------------|
| `chart-bar` | Bar charts (multi-dataset) | `title`, `labels[]`, `datasets[{label, values[], color}]` |
| `chart-line` | Line charts with area fills | `title`, `labels[]`, `series[{label, values[], color}]` |
| `chart-donut` | Donut/pie charts | `title`, `segments[{label, value, color}]` |
| `kpi-scorecard` | Metric cards with trends | `kpis[{label, value, unit, trend, animateCount}]` |
| `stat-counter` | Large animated counters | `stats[{value, label, prefix, suffix, change, progress}]` |

### Lists / Comparisons
| Type | Use For | Key Data Fields |
|------|---------|----------------|
| `bullet-list` | Bulleted items with icons | `title`, `items[{text, sub, icon, highlight}]` |
| `action-items` | Checklist with owners | `items[{text, owner, due, priority}]` |
| `comparison` | Side-by-side pro/con | `title`, `left{label, items[]}`, `right{label, items[]}` |
| `table` | Data tables with highlights | `title`, `columns[{key, label}]`, `rows[]`, `highlightRows[]` |

### Visual / Technical
| Type | Use For | Key Data Fields |
|------|---------|----------------|
| `pipeline-funnel` | Sales/conversion funnels | `stages[{name, count, value, highlight}]` |
| `milestone-timeline` | Project timelines | `milestones[{name, due, status, owner, note}]` |
| `code-terminal` | Code walkthroughs | `title`, `shell`, `lines[{kind, text}]` |
| `image-card` | Full-bleed images | `image`, `caption`, `title`, `overlay`, `effect`, `fit` |
| `scene-showcase` | Card grids | `title`, `subtitle`, `cards[{name, description, icon}]` |

## Animation Overrides

Add `animation` to any scene to control motion:

```json
"animation": {
  "easing": "spring",
  "textEffect": "word-reveal",
  "stagger": 0.12,
  "direction": "up",
  "speed": 1.0,
  "delay": 0.3,
  "exitAnimation": "fade",
  "pacing": { "entrance": 0.3, "hold": 0.5, "exit": 0.2 }
}
```

### Easing Guide

| Easing | Feel | Best For |
|--------|------|----------|
| `spring` | Overshoot bounce-back | Cards, KPIs, general use |
| `easeOut` | Fast start, gentle stop | Default, safe choice |
| `elastic` | Tight snap | Tech demos, data |
| `bouncy` | Playful wobble | Casual, fun content |
| `power4` | Punchy, aggressive | Stat reveals, impact |
| `expo` | Dramatic acceleration | Title entrances |
| `slow` | Cinematic slow-motion | Dramatic text reveals |
| `snap` | Sharp decisive | Professional, corporate |

### Text Effects

| Effect | Best For | Avoid With |
|--------|----------|------------|
| `word-reveal` | Headlines, key messages | Short durations (<3s) |
| `typewriter` | Code, technical content | Long text (>100 chars at <5s) |
| `char-cascade` | Dramatic title reveals | Gradient text (use `word-reveal` instead) |
| `fade-lines` | Body text, paragraphs | Single-line content |
| `highlight-sweep` | Emphasis phrases | Multiple paragraphs |
| `counter` | Metrics, statistics | Non-numeric content |

### Scene Type × Animation Pairings

| Scene Type | Recommended | Example |
|------------|-------------|---------|
| `title-card` | `easing: "spring"` | `{ "easing": "spring" }` |
| `chart-bar` | `stagger: 0.1, easing: "spring"` | `{ "stagger": 0.1, "easing": "spring" }` |
| `chart-line` | `easing: "spring"` | `{ "easing": "spring" }` |
| `chart-donut` | `easing: "spring"` | `{ "easing": "spring" }` |
| `kpi-scorecard` | `stagger: 0.12, easing: "elastic"` | `{ "stagger": 0.12, "easing": "elastic" }` |
| `stat-counter` | `stagger: 0.15, easing: "power4"` | `{ "stagger": 0.15, "easing": "power4" }` |
| `bullet-list` | `stagger: 0.15, direction: "left"` | `{ "stagger": 0.15, "easing": "spring", "direction": "left" }` |
| `action-items` | `stagger: 0.12, easing: "spring"` | `{ "stagger": 0.12, "easing": "spring" }` |
| `comparison` | `stagger: 0.08, direction: "left"` | `{ "stagger": 0.08, "direction": "left" }` |
| `table` | `stagger: 0.08, easing: "spring"` | `{ "stagger": 0.08, "easing": "spring" }` |
| `pipeline-funnel` | `stagger: 0.12, easing: "bouncy"` | `{ "stagger": 0.12, "easing": "bouncy" }` |
| `milestone-timeline` | `stagger: 0.1, direction: "up"` | `{ "stagger": 0.1, "easing": "spring" }` |
| `text-reveal` | `textEffect: "word-reveal"` | `{ "textEffect": "word-reveal", "easing": "slow" }` |
| `quote-highlight` | `easing: "slow"` | `{ "easing": "slow", "delay": 0.3 }` |
| `code-terminal` | default (built-in typing) | No overrides needed |
| `section-header` | default or `textEffect` | `{ "textEffect": "word-reveal" }` |
| `closing` | `easing: "spring"` | `{ "easing": "spring", "exitAnimation": "fade" }` |

## Asset References

Declare assets once, reference everywhere with `$asset:key`:

```json
{
  "assets": {
    "logo": "https://cdn.example.com/logo.png",
    "hero": "docs/assets/hero.jpg"
  },
  "branding": { "logo": "$asset:logo" },
  "scenes": [{
    "type": "title-card",
    "data": { "image": "$asset:logo" }
  }]
}
```

Supported: `https://` URLs, local file paths, `data:` URIs.
Supported formats: PNG, JPG, GIF, WebP, SVG.

### Image-Card Effects

When using `image-card`, set the `effect` field for motion:

| Effect | Description |
|--------|-------------|
| `ken-burns` | Slow zoom + pan (default, cinematic) |
| `zoom-in` | Gradual zoom into center |
| `pan-left` | Slow horizontal pan left |
| `pan-right` | Slow horizontal pan right |
| `static` | No motion |

## Procedure

### 1. Understand the Request
- What data/content needs to be in the video?
- What's the audience? (executive → `slow`/`expo` easing; team → `spring`/`bouncy`)
- How long should it be? (30s quick recap vs 3min deep-dive)

### 2. Call `list_scene_types`
Get the latest scene types and schemas. Don't assume — verify.

### 3. Build the Storyboard

Follow this scene flow pattern:

```
title-card (5s) → [content scenes] → closing (5s)
```

For longer videos, add `section-header` (2-3s) between topic groups.

**Duration guidelines:**
- Title/closing: 4–5s
- Section headers: 2–3s
- Data scenes (charts, KPIs, tables): 6–8s
- Code terminals: 8–12s (need time to read)
- Text/quotes: 4–6s
- Comparisons: 6–7s

**Transition guidelines:**
- Use `fade` between same-topic scenes
- Use `slide-left` or `slide-up` for section changes
- Use `fade` for title and closing

### 4. Add Animation Variety
- Don't use the same easing on every scene
- Use `textEffect` sparingly — 1-2 key moments, not every scene
- Add `exitAnimation: "fade"` before major section changes
- Vary `stagger` values: 0.08 for data, 0.12-0.18 for lists

### 5. Validate First
Call `validate_storyboard` before rendering. Fix any errors.

### 6. Render
Call `render_video` with quality `medium` (default) or `fast` (for iteration).

## Anti-Patterns

1. **Don't use `char-cascade` on gradient text** — it breaks `background-clip: text`. Use `word-reveal` instead.
2. **Don't use `bouncy` on data scenes** — elastic wobble on charts looks unprofessional.
3. **Don't set `speed` below 0.5** — timeline gets sluggish.
4. **Don't use `typewriter` with short durations** — characters fly by too fast at <4s with long text.
5. **Don't create >15 scenes without section headers** — viewer loses orientation.
6. **Don't set stagger > 0.3** unless you have very few items.
7. **Don't skip `validate_storyboard`** — rendering is slow; catch errors early.
8. **Don't hardcode base64 images** — use the `assets` map with `$asset:key` references to keep the storyboard small.

## Example: Sprint Recap Video

```json
{
  "title": "Sprint 25 Recap",
  "theme": "microsoft",
  "branding": { "logo": "$asset:logo" },
  "assets": { "logo": "https://cdn.example.com/team-logo.png" },
  "scenes": [
    {
      "type": "title-card",
      "duration": 5,
      "transition": "fade",
      "data": { "title": "Sprint 25 Recap", "subtitle": "Platform Engineering", "date": "April 2026", "image": "$asset:logo" },
      "animation": { "easing": "spring" }
    },
    {
      "type": "kpi-scorecard",
      "duration": 7,
      "transition": "fade",
      "data": {
        "kpis": [
          { "label": "Velocity", "value": 67, "unit": "pts", "trend": "up", "animateCount": true },
          { "label": "Cycle Time", "value": 3.2, "unit": "days", "trend": "down", "animateCount": true },
          { "label": "Deploys", "value": 14, "unit": "/wk", "trend": "up", "animateCount": true }
        ]
      },
      "animation": { "stagger": 0.15, "easing": "power4" }
    },
    {
      "type": "chart-bar",
      "duration": 7,
      "transition": "fade",
      "data": {
        "title": "Commits by Category",
        "labels": ["Features", "Fixes", "Docs", "Chores"],
        "datasets": [{ "label": "Commits", "values": [34, 15, 8, 6], "color": "#0078D4" }]
      },
      "animation": { "stagger": 0.1, "easing": "spring" }
    },
    {
      "type": "action-items",
      "duration": 6,
      "transition": "slide-left",
      "data": {
        "items": [
          { "text": "Ship v3 API migration", "owner": "Backend", "priority": "high" },
          { "text": "Fix flaky E2E tests", "owner": "QA", "priority": "high" },
          { "text": "Update runbook for on-call", "owner": "SRE", "priority": "normal" }
        ]
      },
      "animation": { "stagger": 0.12, "easing": "spring", "direction": "left" }
    },
    {
      "type": "closing",
      "duration": 5,
      "transition": "fade",
      "data": { "tagline": "Ship with confidence.", "cta": "Next sprint planning: Monday 9am", "image": "$asset:logo" },
      "animation": { "easing": "spring" }
    }
  ]
}
```
