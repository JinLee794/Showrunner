import { writeFile } from 'node:fs/promises';
import type { SceneSynthesisResult } from './azure-speech.js';

export interface TranscriptCue {
  startMs: number;
  endMs: number;
  text: string;
}

export interface TimelineEntry {
  /** Synthesis result for this scene (may have null audioPath / empty words). */
  synthesis: SceneSynthesisResult;
  /** Absolute start time (ms) of this scene within the final video timeline. */
  sceneStartMs: number;
  /** Effective video duration of this scene in the final timeline (ms). */
  sceneDurationMs: number;
}

/**
 * Build transcript cues by grouping word-boundary events into short phrases.
 * Offsets are shifted to absolute video-timeline milliseconds.
 */
export function buildCues(
  timeline: TimelineEntry[],
  options: { maxCueChars?: number; maxCueMs?: number } = {},
): TranscriptCue[] {
  const maxChars = options.maxCueChars ?? 80;
  const maxCueMs = options.maxCueMs ?? 4500;
  const cues: TranscriptCue[] = [];

  for (const entry of timeline) {
    const { synthesis, sceneStartMs } = entry;
    if (!synthesis.audioPath) continue;

    const wordEvents = synthesis.words.filter((w) => w.boundaryType !== 'Sentence');

    if (wordEvents.length === 0) {
      // Fall back to a single cue for the whole scene narration.
      if (synthesis.plainText.trim().length > 0) {
        cues.push({
          startMs: sceneStartMs,
          endMs: sceneStartMs + synthesis.audioDurationMs,
          text: synthesis.plainText.trim(),
        });
      }
      continue;
    }

    let cueStart = sceneStartMs + wordEvents[0]!.audioOffsetMs;
    let cueText = '';
    let lastEnd = cueStart;

    for (const w of wordEvents) {
      const absOffset = sceneStartMs + w.audioOffsetMs;
      const absEnd = absOffset + w.durationMs;
      const isPunct = w.boundaryType === 'Punctuation';
      const separator = cueText.length === 0 || isPunct ? '' : ' ';
      const candidate = cueText + separator + w.text;

      const wouldOverflow =
        candidate.length > maxChars || absEnd - cueStart > maxCueMs;

      if (wouldOverflow && cueText.length > 0) {
        cues.push({ startMs: cueStart, endMs: lastEnd, text: cueText.trim() });
        cueStart = absOffset;
        cueText = w.text;
      } else {
        cueText = candidate;
      }
      lastEnd = absEnd;

      // Break on sentence-ending punctuation for readability.
      if (isPunct && /[.!?]/.test(w.text)) {
        cues.push({ startMs: cueStart, endMs: lastEnd, text: cueText.trim() });
        cueText = '';
        cueStart = lastEnd;
      }
    }
    if (cueText.trim().length > 0) {
      cues.push({ startMs: cueStart, endMs: lastEnd, text: cueText.trim() });
    }
  }

  return cues;
}

function formatVttTime(ms: number): string {
  const totalMs = Math.max(0, Math.round(ms));
  const h = Math.floor(totalMs / 3600000);
  const m = Math.floor((totalMs % 3600000) / 60000);
  const s = Math.floor((totalMs % 60000) / 1000);
  const msPart = totalMs % 1000;
  return (
    `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:` +
    `${String(s).padStart(2, '0')}.${String(msPart).padStart(3, '0')}`
  );
}

function formatSrtTime(ms: number): string {
  return formatVttTime(ms).replace('.', ',');
}

export function renderVtt(cues: TranscriptCue[]): string {
  const lines: string[] = ['WEBVTT', ''];
  cues.forEach((cue, i) => {
    lines.push(String(i + 1));
    lines.push(`${formatVttTime(cue.startMs)} --> ${formatVttTime(cue.endMs)}`);
    lines.push(cue.text);
    lines.push('');
  });
  return lines.join('\n');
}

export function renderSrt(cues: TranscriptCue[]): string {
  const lines: string[] = [];
  cues.forEach((cue, i) => {
    lines.push(String(i + 1));
    lines.push(`${formatSrtTime(cue.startMs)} --> ${formatSrtTime(cue.endMs)}`);
    lines.push(cue.text);
    lines.push('');
  });
  return lines.join('\n');
}

export async function writeTranscripts(
  cues: TranscriptCue[],
  basePath: string,
  format: 'vtt' | 'srt' | 'both' | 'none',
): Promise<{ vttPath?: string; srtPath?: string }> {
  if (format === 'none' || cues.length === 0) return {};
  const out: { vttPath?: string; srtPath?: string } = {};
  if (format === 'vtt' || format === 'both') {
    const vttPath = basePath.replace(/\.[^.]+$/, '') + '.vtt';
    await writeFile(vttPath, renderVtt(cues), 'utf-8');
    out.vttPath = vttPath;
  }
  if (format === 'srt' || format === 'both') {
    const srtPath = basePath.replace(/\.[^.]+$/, '') + '.srt';
    await writeFile(srtPath, renderSrt(cues), 'utf-8');
    out.srtPath = srtPath;
  }
  return out;
}
