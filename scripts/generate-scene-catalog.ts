#!/usr/bin/env node
/**
 * generate-scene-catalog.ts
 *
 * Renders every scene type as an animated GIF and generates a markdown
 * catalog page (docs/scene-catalog.md) with previews, descriptions, and
 * data-schema tables.
 *
 * Usage:
 *   npx tsx scripts/generate-scene-catalog.ts
 *     # render only missing GIFs + regenerate markdown
 *   npx tsx scripts/generate-scene-catalog.ts --skip-gifs   # regenerate markdown only
 *   npx tsx scripts/generate-scene-catalog.ts --refresh-gifs # re-render all GIFs + regenerate markdown
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CATALOG_DATA = join(ROOT, 'scripts', 'scene-catalog-data.json');
const GIF_DIR = join(ROOT, 'docs', 'assets', 'scenes');
const OUTPUT_MD = join(ROOT, 'docs', 'scene-catalog.md');

// ── Helpers ──────────────────────────────────────────────────────────────────

interface SceneTypeInfo {
  type: string;
  description: string;
  dataSchema: {
    type: string;
    required?: string[];
    properties: Record<string, unknown>;
  };
}

function prettyName(type: string): string {
  return type
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function schemaTable(schema: SceneTypeInfo['dataSchema']): string {
  const props = schema.properties ?? {};
  const required = new Set(schema.required ?? []);
  const lines: string[] = [
    '| Field | Type | Required | Description |',
    '|-------|------|----------|-------------|',
  ];
  for (const [key, def] of Object.entries(props)) {
    const d = def as Record<string, unknown>;
    let typeStr = String(d.type ?? 'object');
    if (Array.isArray(d.type)) typeStr = d.type.join(' \\| ');
    if (d.enum) typeStr += ` (${(d.enum as string[]).join(', ')})`;
    const req = required.has(key) ? '✅' : '';
    const desc = String(d.description ?? '');
    lines.push(`| \`${key}\` | ${typeStr} | ${req} | ${desc} |`);
  }
  return lines.join('\n');
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const skipGifs = process.argv.includes('--skip-gifs');
  const refreshGifs = process.argv.includes('--refresh-gifs');

  // Load scene catalog data
  const catalogData: Record<string, { duration: number; data: Record<string, unknown> }> =
    JSON.parse(readFileSync(CATALOG_DATA, 'utf-8'));

  // Load scene type metadata from list-scene-types tool
  const { handleListSceneTypes } = await import('../src/tools/list-scene-types.js');
  const result = await handleListSceneTypes();
  const parsed = JSON.parse(result.content[0].text);
  const sceneTypes: SceneTypeInfo[] = Array.isArray(parsed)
    ? parsed
    : parsed.sceneTypes;

  mkdirSync(GIF_DIR, { recursive: true });

  // ── Render GIFs ───────────────────────────────────────────────────────────
  const rendered: string[] = [];
  const skipped: string[] = [];
  const alreadyPresent: string[] = [];

  if (!skipGifs) {
    const { Renderer } = await import('../src/renderer/index.js');
    const { BrowserPool } = await import('../src/renderer/browser-pool.js');

    const pool = new BrowserPool();
    const renderer = new Renderer(pool);

    for (const info of sceneTypes) {
      const entry = catalogData[info.type];
      if (!entry) {
        console.log(`⏭  ${info.type} — no sample data, skipping`);
        skipped.push(info.type);
        continue;
      }

      const gifPath = join(GIF_DIR, `${info.type}.gif`);
      const gifExists = existsSync(gifPath);

      if (!refreshGifs && gifExists) {
        console.log(`⏭  ${info.type} — GIF exists, skipping`);
        alreadyPresent.push(info.type);
        continue;
      }

      try {
        const storyboard = {
          title: `${prettyName(info.type)} Demo`,
          theme: 'corporate-dark' as const,
          fps: 30 as const,
          resolution: [1920, 1080] as [number, number],
          scenes: [
            {
              type: info.type as any,
              duration: entry.duration,
              data: entry.data,
            },
          ],
        };

        console.log(`🎬 Rendering ${info.type} ...`);
        await renderer.renderGif(storyboard, gifPath, {
          quality: 'fast',
          gifWidth: 480,
          speed: 1,
          maxColors: 128,
        });
        rendered.push(info.type);
        console.log(`   ✅ ${gifPath}`);
      } catch (err: any) {
        console.log(`   ❌ ${info.type}: ${err.message}`);
        skipped.push(info.type);
      }
    }

    await pool.close();
    console.log(
      `\nRendered ${rendered.length} GIFs, reused ${alreadyPresent.length}, skipped ${skipped.length}.`,
    );
  } else {
    console.log('Skipping GIF rendering (--skip-gifs)');
    // Mark all scene types that have existing GIFs as rendered
    for (const info of sceneTypes) {
      if (existsSync(join(GIF_DIR, `${info.type}.gif`))) {
        rendered.push(info.type);
      } else {
        skipped.push(info.type);
      }
    }
  }

  // ── Generate Markdown ─────────────────────────────────────────────────────
  const lines: string[] = [
    '# Scene Type Catalog',
    '',
    '> **Auto-generated** — do not edit manually. Run `npm run generate:catalog` to regenerate.',
    '',
    `This catalog showcases every scene type available in Showrunner with animated previews, descriptions, and data schemas. Last updated: ${new Date().toISOString().split('T')[0]}.`,
    '',
    '## Table of Contents',
    '',
  ];

  // TOC
  for (const info of sceneTypes) {
    const anchor = info.type;
    lines.push(`- [${prettyName(info.type)}](#${anchor})`);
  }
  lines.push('');

  // Quick-reference grid
  lines.push('## Quick Reference', '');
  lines.push('| Scene Type | Description |');
  lines.push('|------------|-------------|');
  for (const info of sceneTypes) {
    lines.push(`| [\`${info.type}\`](#${info.type}) | ${info.description.split('.')[0]}. |`);
  }
  lines.push('');
  lines.push('---', '');

  // Scene sections
  for (const info of sceneTypes) {
    const hasGif = rendered.includes(info.type) || existsSync(join(GIF_DIR, `${info.type}.gif`));
    const sampleData = catalogData[info.type];

    lines.push(`## ${prettyName(info.type)}`, '');
    lines.push(`**Type:** \`${info.type}\``, '');
    lines.push(info.description, '');

    if (hasGif) {
      lines.push(`![${prettyName(info.type)} preview](assets/scenes/${info.type}.gif)`, '');
    } else {
      lines.push('*Preview not available — scene template pending.*', '');
    }

    lines.push('### Data Schema', '');
    lines.push(schemaTable(info.dataSchema), '');

    if (sampleData) {
      lines.push('<details>', `<summary>Sample JSON</summary>`, '', '```json');
      lines.push(JSON.stringify(
        { type: info.type, duration: sampleData.duration, data: sampleData.data },
        null,
        2,
      ));
      lines.push('```', '', '</details>', '');
    }

    lines.push('---', '');
  }

  // Footer
  lines.push(
    '## Animation Overrides',
    '',
    'Every scene supports optional `animation` overrides. See the [Animation Prompt Guide](animation-prompt-guide.md) for details.',
    '',
    '```json',
    '{',
    '  "animation": {',
    '    "stagger": 0.15,',
    '    "easing": "spring",',
    '    "direction": "up",',
    '    "textEffect": "typewriter",',
    '    "speed": 1.2,',
    '    "delay": 0.3,',
    '    "exitAnimation": "fade"',
    '  }',
    '}',
    '```',
    '',
    '---',
    '',
    '*Generated by `scripts/generate-scene-catalog.ts`*',
    '',
  );

  writeFileSync(OUTPUT_MD, lines.join('\n'), 'utf-8');
  console.log(`📄 Wrote ${OUTPUT_MD}`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
