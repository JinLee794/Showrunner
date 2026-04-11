#!/usr/bin/env node

import { readFileSync, mkdirSync } from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const command = args[0];

// ── npx showrunner render <file.json> [--output path] [--quality high|medium|fast] ──
if (command === 'render') {
  const file = args[1];
  if (!file) {
    console.error('Usage: showrunner render <storyboard.json> [--output path] [--quality high|medium|fast] [--gif]');
    process.exit(1);
  }

  const outputIdx = args.indexOf('--output');
  const qualityIdx = args.indexOf('--quality');
  const isGif = args.includes('--gif');

  const quality = (qualityIdx !== -1 ? args[qualityIdx + 1] : 'medium') as 'high' | 'medium' | 'fast';
  const ext = isGif ? '.gif' : '.mp4';
  const defaultOutput = path.join(process.cwd(), 'output', path.basename(file, '.json') + ext);
  const outputPath = outputIdx !== -1 ? args[outputIdx + 1] : defaultOutput;

  const { StoryboardSchema } = await import('./schema/storyboard.js');
  const { Renderer } = await import('./renderer/index.js');
  const { BrowserPool } = await import('./renderer/browser-pool.js');

  let storyboard;
  try {
    const raw = JSON.parse(readFileSync(path.resolve(file), 'utf8'));
    storyboard = StoryboardSchema.parse(raw);
  } catch (e: any) {
    console.error('Invalid storyboard:', e.message);
    process.exit(1);
  }

  mkdirSync(path.dirname(outputPath), { recursive: true });

  const totalFrames = storyboard.scenes.reduce((s, sc) => s + sc.duration, 0) * (storyboard.fps ?? 30);
  console.log(`Rendering ${storyboard.scenes.length} scenes (${totalFrames} frames) → ${outputPath}`);

  const pool = new BrowserPool();
  const renderer = new Renderer(pool);

  try {
    if (isGif) {
      const result = await renderer.renderGif(storyboard, outputPath, { quality });
      console.log(`✅ GIF saved: ${outputPath} (${result.frames} frames)`);
    } else {
      const result = await renderer.renderStoryboard(storyboard, outputPath, quality);
      console.log(`✅ Video saved: ${outputPath} (${result.frames} frames)`);
    }
  } catch (e: any) {
    console.error('Render failed:', e.message);
    process.exit(1);
  } finally {
    await pool.close();
  }

// ── npx showrunner validate <file.json> ──
} else if (command === 'validate') {
  const file = args[1];
  if (!file) {
    console.error('Usage: showrunner validate <storyboard.json>');
    process.exit(1);
  }

  const { StoryboardSchema } = await import('./schema/storyboard.js');
  try {
    const raw = JSON.parse(readFileSync(path.resolve(file), 'utf8'));
    const sb = StoryboardSchema.parse(raw);
    const totalDuration = sb.scenes.reduce((s, sc) => s + sc.duration, 0);
    console.log(`✅ Valid storyboard: ${sb.scenes.length} scenes, ${totalDuration}s total`);
  } catch (e: any) {
    console.error('❌ Invalid:', e.message);
    process.exit(1);
  }

// ── npx showrunner scenes ──
} else if (command === 'scenes') {
  const { handleListSceneTypes } = await import('./tools/list-scene-types.js');
  const result = await handleListSceneTypes();
  console.log(result.content[0].text);

// ── npx showrunner (default: start MCP server) ──
} else if (!command || command === 'serve') {
  // Pass through to the MCP server
  await import('./server.js');

} else {
  console.log(`showrunner v0.1.0 — Storyboard JSON in, MP4 out.

Usage:
  npx showrunner-mcp                       Start MCP server (stdio)
  npx showrunner-mcp serve                 Start MCP server (stdio, or set TRANSPORT=http)
  npx showrunner-mcp render <file.json>    Render storyboard to MP4
    --output <path>                        Output file path
    --quality <high|medium|fast>           Render quality (default: medium)
    --gif                                  Output as GIF instead of MP4
  npx showrunner-mcp validate <file.json>  Validate a storyboard JSON file
  npx showrunner-mcp scenes                List available scene types
`);
  if (command !== 'help' && command !== '--help' && command !== '-h') {
    process.exit(1);
  }
}
