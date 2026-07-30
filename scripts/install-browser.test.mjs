import { describe, expect, it, vi } from 'vitest';
import { installChromium } from './install-browser.mjs';

describe('installChromium', () => {
  it('runs the Playwright CLI through Node without a shell', () => {
    const run = vi.fn(() => ({ status: 0, signal: null }));
    const stderr = { write: vi.fn() };

    expect(installChromium({ run, stderr })).toBe(true);
    expect(run).toHaveBeenCalledOnce();
    const [command, args, options] = run.mock.calls[0];
    expect(command).toBe(process.execPath);
    expect(args[0]).toMatch(/[\\/]playwright[\\/]cli\.js$/);
    expect(args.slice(1)).toEqual(['install', 'chromium']);
    expect(options).toEqual({ stdio: 'inherit' });
    expect(stderr.write).not.toHaveBeenCalled();
  });

  it('keeps package installation non-fatal when browser setup fails', () => {
    const run = vi.fn(() => ({ status: 1, signal: null }));
    const stderr = { write: vi.fn() };

    expect(
      installChromium({ resolveCli: () => 'playwright-cli.js', run, stderr }),
    ).toBe(false);
    expect(stderr.write).toHaveBeenCalledWith(
      '[showrunner] Chromium setup skipped (exit code 1). ' +
        'Run "npx playwright install chromium" before rendering.\n',
    );
  });
});