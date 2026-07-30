import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function warnSkipped(stderr, reason) {
  stderr.write(
    `[showrunner] Chromium setup skipped (${reason}). ` +
      'Run "npx playwright install chromium" before rendering.\n',
  );
}

export function installChromium({
  resolveCli = () =>
    join(dirname(require.resolve('playwright/package.json')), 'cli.js'),
  run = spawnSync,
  stderr = process.stderr,
} = {}) {
  let cliPath;
  try {
    cliPath = resolveCli();
  } catch (error) {
    warnSkipped(stderr, errorMessage(error));
    return false;
  }

  let result;
  try {
    result = run(process.execPath, [cliPath, 'install', 'chromium'], {
      stdio: 'inherit',
    });
  } catch (error) {
    warnSkipped(stderr, errorMessage(error));
    return false;
  }

  if (result.error) {
    warnSkipped(stderr, errorMessage(result.error));
    return false;
  }

  if (result.status !== 0) {
    const reason = result.signal
      ? `signal ${result.signal}`
      : `exit code ${result.status ?? 'unknown'}`;
    warnSkipped(stderr, reason);
    return false;
  }

  return true;
}

const isMain =
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  installChromium();
}