import { type BrowserContext, type Page } from 'playwright';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import type { RenderQuality } from '../types/index.js';

export interface FrameCaptureOptions {
  html: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  quality: RenderQuality;
  outputDir: string;
  framePrefix?: string;
}

export interface FrameCaptureResult {
  frameDir: string;
  frameCount: number;
  framePattern: string; // e.g. "frame-%06d.jpeg"
}

/**
 * Captures frames from a scene page by scrubbing the GSAP timeline.
 */
export async function captureFrames(
  context: BrowserContext,
  options: FrameCaptureOptions
): Promise<FrameCaptureResult> {
  const {
    html,
    width,
    height,
    fps,
    duration,
    quality,
    outputDir,
    framePrefix = 'frame',
  } = options;

  mkdirSync(outputDir, { recursive: true });

  const page = await context.newPage();
  await page.setViewportSize({ width, height });
  await page.setContent(html, { waitUntil: 'networkidle' });

  // Wait for GSAP timeline to be built
  await page.waitForFunction('window.__timelineReady === true', {
    timeout: 5000,
  });

  const totalFrames = Math.ceil(duration * fps);
  const ext = quality === 'high' ? 'png' : 'jpeg';
  const screenshotType = quality === 'high' ? 'png' : 'jpeg';
  const jpegQuality = quality === 'fast' ? 70 : 90;
  const pad = String(totalFrames).length;

  for (let frame = 0; frame <= totalFrames; frame++) {
    const progress = totalFrames > 0 ? frame / totalFrames : 1;
    await page.evaluate(`window.__seek(${progress})`);

    const filename = `${framePrefix}-${String(frame).padStart(pad, '0')}.${ext}`;
    const framePath = join(outputDir, filename);

    const screenshotOpts: any = {
      path: framePath,
      type: screenshotType,
    };
    if (screenshotType === 'jpeg') {
      screenshotOpts.quality = jpegQuality;
    }
    await page.screenshot(screenshotOpts);
  }

  await page.close();

  return {
    frameDir: outputDir,
    frameCount: totalFrames + 1,
    framePattern: `${framePrefix}-%0${pad}d.${ext}`,
  };
}
