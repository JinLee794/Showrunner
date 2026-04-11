import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const require = createRequire(__filename);

let gsapCoreCache: string | null = null;

/**
 * Returns the GSAP core library source as a string for injection into browser pages.
 * Uses the installed gsap npm package.
 */
export function getGsapBundle(): string {
  if (gsapCoreCache) return gsapCoreCache;

  // Resolve GSAP relative to this package regardless of install location
  const gsapPath = require.resolve('gsap/dist/gsap.min.js');
  gsapCoreCache = readFileSync(gsapPath, 'utf-8');
  return gsapCoreCache;
}
