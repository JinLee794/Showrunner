import { readFileSync, statSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';
import type { Storyboard } from '../types/index.js';
import { getGsapBundle } from '../motion/gsap-bundle.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);

function tryRead(...paths: string[]): string {
  for (const p of paths) {
    try { return readFileSync(p, 'utf-8'); } catch { /* next */ }
  }
  throw new Error(`File not found: ${paths.join(', ')}`);
}

/**
 * Generate a self-contained HTML preview of a storyboard.
 * Plays in-browser using requestAnimationFrame to scrub GSAP timelines.
 */
export async function generatePreview(
  storyboard: Storyboard,
  outputPath: string
): Promise<{ path: string }> {
  const theme = storyboard.theme ?? 'corporate-dark';
  const fps = storyboard.fps ?? 30;

  const themeCSS = tryRead(
    join(__dirname, '..', 'themes', `${theme}.css`),
    join(__dirname, '..', '..', 'src', 'themes', `${theme}.css`)
  );
  const gsapBundle = getGsapBundle();

  // Load scene templates
  const sceneHTMLs: string[] = [];
  for (const scene of storyboard.scenes) {
    const tplSrc = tryRead(
      join(__dirname, '..', 'templates', 'scenes', `${scene.type}.html`),
      join(__dirname, '..', '..', 'src', 'templates', 'scenes', `${scene.type}.html`)
    );
    const tpl = Handlebars.compile(tplSrc);

    // Preprocess data
    const data = preprocessForPreview(scene);
    sceneHTMLs.push(tpl({ data }));
  }

  const html = buildPreviewHTML(storyboard, themeCSS, gsapBundle, sceneHTMLs);
  await writeFile(outputPath, html, 'utf-8');
  return { path: outputPath };
}

function preprocessForPreview(scene: { type: string; data: Record<string, unknown> }): Record<string, any> {
  const data = { ...scene.data } as Record<string, any>;
  if (scene.type === 'pipeline-funnel' && Array.isArray(data.stages)) {
    const maxCount = Math.max(...data.stages.map((s: any) => s.count));
    data.stages = data.stages.map((stage: any) => ({
      ...stage,
      widthPercent: maxCount > 0 ? Math.round((stage.count / maxCount) * 100) : 0,
    }));
  }
  if (scene.type === 'action-items' && Array.isArray(data.items)) {
    data.items = data.items.map((item: any, i: number) => ({ ...item, index: i + 1 }));
  }
  if (scene.type === 'logic-flow') {
    data.flowDataJSON = JSON.stringify({
      nodes: data.nodes || [],
      edges: data.edges || [],
      direction: data.direction || 'TB',
    });
  }
  return data;
}

function buildPreviewHTML(
  storyboard: Storyboard,
  themeCSS: string,
  gsapBundle: string,
  sceneHTMLs: string[]
): string {
  const sceneDurations = storyboard.scenes.map(s => s.duration);
  const totalDuration = sceneDurations.reduce((a, b) => a + b, 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHTML(storyboard.title)} — Preview</title>
  <style>${themeCSS}</style>
  <style>
    html, body { margin: 0; padding: 0; width: 100vw; height: 100vh; overflow: hidden; background: #000; }
    .preview-viewport { width: 100vw; height: calc(100vh - 60px); position: relative; overflow: hidden; }
    .preview-scene { position: absolute; inset: 0; display: none; }
    .preview-scene.active { display: block; }
    .preview-controls {
      height: 60px; background: #111; display: flex; align-items: center;
      padding: 0 20px; gap: 16px; color: #fff; font-family: system-ui;
    }
    .preview-controls button {
      background: #333; border: none; color: #fff; padding: 8px 16px;
      border-radius: 6px; cursor: pointer; font-size: 14px;
    }
    .preview-controls button:hover { background: #444; }
    .preview-scrub { flex: 1; }
    .preview-scrub input { width: 100%; }
    .preview-info { font-size: 13px; color: #888; font-family: monospace; }
  </style>
  <script>${gsapBundle}</script>
</head>
<body>
  <div class="preview-viewport">
    ${sceneHTMLs.map((html, i) => `<div class="preview-scene" data-scene="${i}" data-duration="${sceneDurations[i]}">${html}</div>`).join('\n    ')}
  </div>
  <div class="preview-controls">
    <button id="playBtn">Play</button>
    <button id="prevBtn">◀ Prev</button>
    <button id="nextBtn">Next ▶</button>
    <div class="preview-scrub"><input type="range" id="scrub" min="0" max="1000" value="0"></div>
    <div class="preview-info">
      <span id="sceneInfo">Scene 1/${sceneHTMLs.length}</span> |
      <span id="timeInfo">0.0s / ${totalDuration.toFixed(1)}s</span>
    </div>
  </div>
  <script>
    (function() {
      var scenes = document.querySelectorAll('.preview-scene');
      var timelines = [];
      var durations = ${JSON.stringify(sceneDurations)};
      var totalDuration = ${totalDuration};
      var playing = false;
      var globalTime = 0;
      var lastTimestamp = null;

      // Build timelines for each scene
      scenes.forEach(function(sceneEl, i) {
        sceneEl.style.display = 'block';
        // Each scene has its own __buildTimeline in its script
        var scripts = sceneEl.querySelectorAll('script');
        scripts.forEach(function(s) { eval(s.textContent); });
        if (typeof window.__buildTimeline === 'function') {
          timelines[i] = window.__buildTimeline();
          window.__buildTimeline = null;
        }
        sceneEl.style.display = '';
      });

      function getSceneAtTime(t) {
        var elapsed = 0;
        for (var i = 0; i < durations.length; i++) {
          if (t < elapsed + durations[i]) {
            return { index: i, localProgress: (t - elapsed) / durations[i] };
          }
          elapsed += durations[i];
        }
        return { index: durations.length - 1, localProgress: 1 };
      }

      function seek(t) {
        globalTime = Math.max(0, Math.min(t, totalDuration));
        var info = getSceneAtTime(globalTime);
        scenes.forEach(function(s, i) {
          s.classList.toggle('active', i === info.index);
        });
        if (timelines[info.index]) {
          timelines[info.index].progress(info.localProgress);
        }
        document.getElementById('scrub').value = String((globalTime / totalDuration) * 1000);
        document.getElementById('sceneInfo').textContent = 'Scene ' + (info.index + 1) + '/' + scenes.length;
        document.getElementById('timeInfo').textContent = globalTime.toFixed(1) + 's / ' + totalDuration.toFixed(1) + 's';
      }

      function tick(ts) {
        if (!playing) return;
        if (lastTimestamp === null) lastTimestamp = ts;
        var dt = (ts - lastTimestamp) / 1000;
        lastTimestamp = ts;
        globalTime += dt;
        if (globalTime >= totalDuration) {
          globalTime = 0;
        }
        seek(globalTime);
        requestAnimationFrame(tick);
      }

      document.getElementById('playBtn').addEventListener('click', function() {
        playing = !playing;
        this.textContent = playing ? 'Pause' : 'Play';
        if (playing) { lastTimestamp = null; requestAnimationFrame(tick); }
      });

      document.getElementById('scrub').addEventListener('input', function() {
        seek((this.value / 1000) * totalDuration);
      });

      document.getElementById('prevBtn').addEventListener('click', function() {
        var info = getSceneAtTime(globalTime);
        var elapsed = 0;
        for (var i = 0; i < info.index; i++) elapsed += durations[i];
        seek(info.index > 0 ? elapsed - 0.01 : 0);
      });

      document.getElementById('nextBtn').addEventListener('click', function() {
        var info = getSceneAtTime(globalTime);
        var elapsed = 0;
        for (var i = 0; i <= info.index; i++) elapsed += durations[i];
        seek(Math.min(elapsed, totalDuration - 0.01));
      });

      // Initial state
      seek(0);
    })();
  </script>
</body>
</html>`;
}

function escapeHTML(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
