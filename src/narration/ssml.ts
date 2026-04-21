import type { Voiceover, NarrationConfig } from '../types/index.js';

/** XML-escape for SSML text nodes and attributes. */
function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Build a full SSML document for one scene's voiceover.
 * If the voiceover already supplies raw SSML, return it verbatim.
 */
export function buildSsml(vo: Voiceover, cfg: NarrationConfig): string {
  if (vo.ssml && vo.ssml.trim().length > 0) {
    return vo.ssml;
  }
  const text = xmlEscape(vo.text ?? '');
  const lang = cfg.language ?? 'en-US';
  const voice = vo.voice ?? cfg.voice ?? 'en-US-JennyNeural';
  const style = vo.style ?? cfg.style;
  const styleDegree = vo.styleDegree;
  const rate = vo.rate;
  const pitch = vo.pitch;

  // Start with raw text, layer inner prosody/style wrappers.
  let inner = text;

  if (rate !== undefined || pitch !== undefined) {
    const attrs: string[] = [];
    if (rate !== undefined) attrs.push(`rate="${xmlEscape(String(rate))}"`);
    if (pitch !== undefined) attrs.push(`pitch="${xmlEscape(String(pitch))}"`);
    inner = `<prosody ${attrs.join(' ')}>${inner}</prosody>`;
  }

  if (style) {
    const degreeAttr = styleDegree !== undefined ? ` styledegree="${styleDegree}"` : '';
    inner =
      `<mstts:express-as style="${xmlEscape(style)}"${degreeAttr}>${inner}</mstts:express-as>`;
  }

  return (
    `<speak version="1.0" xml:lang="${xmlEscape(lang)}" ` +
    `xmlns="http://www.w3.org/2001/10/synthesis" ` +
    `xmlns:mstts="https://www.w3.org/2001/mstts">` +
    `<voice name="${xmlEscape(voice)}">${inner}</voice>` +
    `</speak>`
  );
}
