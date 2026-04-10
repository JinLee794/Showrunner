import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let gsapCoreCache: string | null = null;

/**
 * Returns the GSAP core library source as a string for injection into browser pages.
 * Uses the installed gsap npm package.
 */
export function getGsapBundle(): string {
  if (gsapCoreCache) return gsapCoreCache;

  // Read the GSAP UMD bundle from node_modules
  const gsapPath = join(__dirname, '..', '..', 'node_modules', 'gsap', 'dist', 'gsap.min.js');
  gsapCoreCache = readFileSync(gsapPath, 'utf-8');
  return gsapCoreCache;
}
