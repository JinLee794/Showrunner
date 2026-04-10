import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let d3Cache: string | null = null;

/**
 * Returns the D3.js library source as a string for injection into browser pages.
 * Uses the installed d3 npm package.
 */
export function getD3Bundle(): string {
  if (d3Cache) return d3Cache;

  const d3Path = join(__dirname, '..', '..', 'node_modules', 'd3', 'dist', 'd3.min.js');
  d3Cache = readFileSync(d3Path, 'utf-8');
  return d3Cache;
}
