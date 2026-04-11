import { readFileSync } from 'node:fs';
import { extname } from 'node:path';

const ASSET_REF_PREFIX = '$asset:';

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

/**
 * Resolve an asset value to a data URI.
 * Accepts: data: URIs (pass-through), https:// URLs (fetch + encode), local file paths.
 */
async function resolveAssetValue(value: string): Promise<string> {
  if (value.startsWith('data:')) {
    return value;
  }

  if (value.startsWith('https://')) {
    const resp = await fetch(value);
    if (!resp.ok) {
      throw new Error(`Failed to fetch asset: ${value} (${resp.status})`);
    }
    const contentType = resp.headers.get('content-type') ?? 'image/png';
    const buf = Buffer.from(await resp.arrayBuffer());
    return `data:${contentType};base64,${buf.toString('base64')}`;
  }

  // Reject insecure schemes
  if (value.startsWith('http://') || value.includes('://')) {
    throw new Error(`Insecure or unsupported asset scheme: ${value}. Use https:// or data: URIs.`);
  }

  // Local file path
  const ext = extname(value).toLowerCase();
  const mime = MIME_TYPES[ext] ?? 'image/png';
  const buf = readFileSync(value);
  return `data:${mime};base64,${buf.toString('base64')}`;
}

/**
 * Build a resolved asset map from the storyboard's `assets` dictionary.
 * Returns a map of asset key → data URI.
 */
export async function resolveAssets(
  assets: Record<string, string> | undefined
): Promise<Map<string, string>> {
  const resolved = new Map<string, string>();
  if (!assets) return resolved;

  const entries = Object.entries(assets);
  const results = await Promise.all(
    entries.map(async ([key, value]) => {
      const dataUri = await resolveAssetValue(value);
      return [key, dataUri] as const;
    })
  );

  for (const [key, dataUri] of results) {
    resolved.set(key, dataUri);
  }
  return resolved;
}

/**
 * Replace `$asset:key` references in a scene data object with resolved data URIs.
 * Walks string values recursively through objects and arrays.
 */
export function injectAssetRefs(
  data: Record<string, unknown>,
  resolved: Map<string, string>
): Record<string, unknown> {
  if (resolved.size === 0) return data;
  return walkAndReplace(data, resolved) as Record<string, unknown>;
}

function walkAndReplace(value: unknown, resolved: Map<string, string>): unknown {
  if (typeof value === 'string' && value.startsWith(ASSET_REF_PREFIX)) {
    const key = value.slice(ASSET_REF_PREFIX.length);
    // Only treat as a reference if the key exactly matches a resolved asset
    // (no spaces, no extra text — avoids false positives in prose like "$asset:key reference system")
    if (resolved.has(key)) {
      return resolved.get(key)!;
    }
    // Not a valid ref — pass through as-is (could be descriptive text)
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => walkAndReplace(item, resolved));
  }

  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = walkAndReplace(v, resolved);
    }
    return out;
  }

  return value;
}
