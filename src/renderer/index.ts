import { readFileSync, statSync } from 'node:fs';
import { rm, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import Handlebars from 'handlebars';
import type { Storyboard, Scene, RenderQuality, RenderResult } from '../types/index.js';
import { BrowserPool } from './browser-pool.js';
import { captureFrames } from './frame-capture.js';
import { encodeVideo, encodeGif } from './encoder.js';
import { getGsapBundle } from '../motion/gsap-bundle.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', 'templates');
// When running from dist/, templates are copied alongside
const TEMPLATES_FALLBACK = join(__dirname, '..', '..', 'src', 'templates');
const THEMES_DIR = join(__dirname, '..', 'themes');
const THEMES_FALLBACK = join(__dirname, '..', '..', 'src', 'themes');

function resolveFile(...paths: string[][]): string {
  for (const p of paths) {
    const full = join(...p);
    try {
      statSync(full);
      return full;
    } catch { /* try next */ }
  }
  throw new Error(`File not found in any path: ${paths.map(p => join(...p)).join(', ')}`);
}

// Register Handlebars helpers
Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);

// Template cache
const templateCache = new Map<string, HandlebarsTemplateDelegate>();

function loadTemplate(name: string): string {
  const filePath = resolveFile(
    [TEMPLATES_DIR, name],
    [TEMPLATES_FALLBACK, name]
  );
  return readFileSync(filePath, 'utf-8');
}

function getSceneTemplate(sceneType: string): HandlebarsTemplateDelegate {
  if (templateCache.has(sceneType)) return templateCache.get(sceneType)!;
  const source = loadTemplate(`scenes/${sceneType}.html`);
  const compiled = Handlebars.compile(source);
  templateCache.set(sceneType, compiled);
  return compiled;
}

function loadThemeCSS(themeName: string): string {
  const filePath = resolveFile(
    [THEMES_DIR, `${themeName}.css`],
    [THEMES_FALLBACK, `${themeName}.css`]
  );
  return readFileSync(filePath, 'utf-8');
}

/**
 * Build a full HTML page for a scene by combining base template + theme + GSAP + scene content.
 */
function buildSceneHTML(
  scene: Scene,
  themeCSS: string,
  gsapBundle: string,
  width: number,
  height: number,
): string {
  // Pre-process scene data with computed fields
  const processedData = preprocessSceneData(scene);

  // Render scene-specific HTML
  const sceneTemplate = getSceneTemplate(scene.type);
  const sceneContent = sceneTemplate({ data: processedData });

  // Render base template
  const baseSource = loadTemplate('base.html');
  const baseTemplate = Handlebars.compile(baseSource);

  return baseTemplate({
    width,
    height,
    themeCSS,
    gsapBundle,
    sceneContent,
  });
}

/**
 * Pre-process scene data to add computed fields needed by templates.
 */
function preprocessSceneData(scene: Scene): Record<string, unknown> {
  const data = { ...scene.data } as Record<string, any>;

  if (scene.type === 'pipeline-funnel' && Array.isArray(data.stages)) {
    const maxCount = Math.max(...data.stages.map((s: any) => s.count));
    data.stages = data.stages.map((stage: any) => ({
      ...stage,
      widthPercent: maxCount > 0 ? Math.round((stage.count / maxCount) * 100) : 0,
    }));
  }

  if (scene.type === 'action-items' && Array.isArray(data.items)) {
    data.items = data.items.map((item: any, i: number) => ({
      ...item,
      index: i + 1,
    }));
  }

  if (scene.type === 'table' && Array.isArray(data.rows) && Array.isArray(data.highlightRows)) {
    data.rows = data.rows.map((row: any, i: number) => ({
      ...row,
      _highlight: data.highlightRows.includes(i),
    }));
  }

  return data;
}

export class Renderer {
  private pool: BrowserPool;

  constructor(pool?: BrowserPool) {
    this.pool = pool ?? new BrowserPool();
  }

  getPool(): BrowserPool {
    return this.pool;
  }

  /**
   * Render a full storyboard to MP4.
   */
  async renderStoryboard(
    storyboard: Storyboard,
    outputPath: string,
    quality: RenderQuality = 'medium'
  ): Promise<RenderResult> {
    const fps = storyboard.fps ?? 30;
    const [width, height] = storyboard.resolution ?? [1920, 1080];
    const theme = storyboard.theme ?? 'corporate-dark';

    const themeCSS = loadThemeCSS(theme);
    const gsapBundle = getGsapBundle();
    const renderSessionId = randomUUID();
    const tempBase = join(tmpdir(), `avengine-${renderSessionId}`);
    await mkdir(tempBase, { recursive: true });

    const context = await this.pool.acquire();
    let totalFrameCount = 0;
    let totalDuration = 0;

    try {
      // Collect all frame dirs for concatenation
      const sceneDirs: Array<{ dir: string; pattern: string; count: number; duration: number }> = [];

      for (let i = 0; i < storyboard.scenes.length; i++) {
        const scene = storyboard.scenes[i]!;
        const sceneHTML = buildSceneHTML(scene, themeCSS, gsapBundle, width, height);
        const sceneDir = join(tempBase, `scene-${i}`);

        const result = await captureFrames(context, {
          html: sceneHTML,
          width,
          height,
          fps,
          duration: scene.duration,
          quality,
          outputDir: sceneDir,
          framePrefix: `scene${i}`,
        });

        sceneDirs.push({
          dir: result.frameDir,
          pattern: result.framePattern,
          count: result.frameCount,
          duration: scene.duration,
        });

        totalFrameCount += result.frameCount;
        totalDuration += scene.duration;
      }

      // For M1, concatenate by encoding all scene frames sequentially.
      // Create a merged frame directory with symlinks or copies.
      const mergedDir = join(tempBase, 'merged');
      await mkdir(mergedDir, { recursive: true });
      await mergeFrames(sceneDirs, mergedDir);

      const mergedPattern = `frame-%06d.${quality === 'high' ? 'png' : 'jpeg'}`;

      await encodeVideo({
        frameDir: mergedDir,
        framePattern: mergedPattern,
        fps,
        width,
        height,
        quality,
        outputPath,
      });

      const stats = statSync(outputPath);

      return {
        path: outputPath,
        duration: totalDuration,
        frames: totalFrameCount,
        fileSize: stats.size,
      };
    } finally {
      await this.pool.release(context);
      // Clean up temp frames
      await rm(tempBase, { recursive: true, force: true }).catch(() => {});
    }
  }

  /**
   * Render a single scene.
   */
  async renderScene(
    scene: Scene,
    options: {
      theme?: string;
      resolution?: [number, number];
      fps?: number;
      quality?: RenderQuality;
      outputPath: string;
    }
  ): Promise<RenderResult> {
    const fps = options.fps ?? 30;
    const [width, height] = options.resolution ?? [1920, 1080];
    const theme = options.theme ?? 'corporate-dark';
    const quality = options.quality ?? 'medium';

    const themeCSS = loadThemeCSS(theme);
    const gsapBundle = getGsapBundle();
    const renderSessionId = randomUUID();
    const tempBase = join(tmpdir(), `avengine-scene-${renderSessionId}`);
    await mkdir(tempBase, { recursive: true });

    const context = await this.pool.acquire();

    try {
      const sceneHTML = buildSceneHTML(scene, themeCSS, gsapBundle, width, height);

      const result = await captureFrames(context, {
        html: sceneHTML,
        width,
        height,
        fps,
        duration: scene.duration,
        quality,
        outputDir: tempBase,
      });

      await encodeVideo({
        frameDir: tempBase,
        framePattern: result.framePattern,
        fps,
        width,
        height,
        quality,
        outputPath: options.outputPath,
      });

      const stats = statSync(options.outputPath);

      return {
        path: options.outputPath,
        duration: scene.duration,
        frames: result.frameCount,
        fileSize: stats.size,
      };
    } finally {
      await this.pool.release(context);
      await rm(tempBase, { recursive: true, force: true }).catch(() => {});
    }
  }

  /**
   * Render a full storyboard to animated GIF.
   */
  async renderGif(
    storyboard: Storyboard,
    outputPath: string,
    options: {
      quality?: RenderQuality;
      gifWidth?: number;
      speed?: number;
      maxColors?: number;
    } = {}
  ): Promise<RenderResult> {
    const fps = storyboard.fps ?? 30;
    const [width, height] = storyboard.resolution ?? [1920, 1080];
    const theme = storyboard.theme ?? 'corporate-dark';
    const quality = options.quality ?? 'medium';

    const themeCSS = loadThemeCSS(theme);
    const gsapBundle = getGsapBundle();
    const renderSessionId = randomUUID();
    const tempBase = join(tmpdir(), `avengine-gif-${renderSessionId}`);
    await mkdir(tempBase, { recursive: true });

    const context = await this.pool.acquire();
    let totalFrameCount = 0;
    let totalDuration = 0;

    try {
      const sceneDirs: Array<{ dir: string; pattern: string; count: number; duration: number }> = [];

      for (let i = 0; i < storyboard.scenes.length; i++) {
        const scene = storyboard.scenes[i]!;
        const sceneHTML = buildSceneHTML(scene, themeCSS, gsapBundle, width, height);
        const sceneDir = join(tempBase, `scene-${i}`);

        const result = await captureFrames(context, {
          html: sceneHTML,
          width,
          height,
          fps,
          duration: scene.duration,
          quality,
          outputDir: sceneDir,
          framePrefix: `scene${i}`,
        });

        sceneDirs.push({
          dir: result.frameDir,
          pattern: result.framePattern,
          count: result.frameCount,
          duration: scene.duration,
        });

        totalFrameCount += result.frameCount;
        totalDuration += scene.duration;
      }

      const mergedDir = join(tempBase, 'merged');
      await mkdir(mergedDir, { recursive: true });
      await mergeFrames(sceneDirs, mergedDir);

      const mergedPattern = `frame-%06d.${quality === 'high' ? 'png' : 'jpeg'}`;

      await encodeGif({
        frameDir: mergedDir,
        framePattern: mergedPattern,
        fps,
        width,
        height,
        outputPath,
        gifWidth: options.gifWidth,
        speed: options.speed,
        maxColors: options.maxColors,
      });

      const stats = statSync(outputPath);

      return {
        path: outputPath,
        duration: totalDuration,
        frames: totalFrameCount,
        fileSize: stats.size,
      };
    } finally {
      await this.pool.release(context);
      await rm(tempBase, { recursive: true, force: true }).catch(() => {});
    }
  }

  async close(): Promise<void> {
    await this.pool.close();
  }
}

/**
 * Merge frames from multiple scene directories into a single directory
 * with sequential filenames for ffmpeg.
 */
async function mergeFrames(
  sceneDirs: Array<{ dir: string; pattern: string; count: number }>,
  mergedDir: string
): Promise<void> {
  const { copyFile } = await import('node:fs/promises');
  const { readdirSync } = await import('node:fs');

  let globalIdx = 0;
  for (const sd of sceneDirs) {
    const files = readdirSync(sd.dir).filter(f => !f.startsWith('.')).sort();
    const ext = files[0]?.split('.').pop() ?? 'jpeg';
    for (const file of files) {
      const src = join(sd.dir, file);
      const dest = join(mergedDir, `frame-${String(globalIdx).padStart(6, '0')}.${ext}`);
      await copyFile(src, dest);
      globalIdx++;
    }
  }
}
