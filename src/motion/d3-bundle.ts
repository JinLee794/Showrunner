import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const require = createRequire(__filename);

let d3Cache: string | null = null;

/**
 * Returns the D3.js library source as a string for injection into browser pages.
 * Uses the installed d3 npm package.
 *
 * d3 v7's package.json `exports` map only exposes `dist/d3.min.js` under the
 * `"umd"` condition, so `require.resolve('d3/dist/d3.min.js')` fails in
 * Node ≥ 20.  We resolve the package root and build the path manually instead.
 */
export function getD3Bundle(): string {
  if (d3Cache) return d3Cache;

  // resolve('d3') gives us the default entry (src/index.js) — walk up to the
  // package directory and reference the UMD bundle directly.
  const d3Entry = require.resolve('d3');
  const d3Dir = dirname(d3Entry).replace(/[/\\]src$/, '');
  const d3Path = join(d3Dir, 'dist', 'd3.min.js');
  d3Cache = readFileSync(d3Path, 'utf-8');
  return d3Cache;
}
