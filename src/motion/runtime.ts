import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AnimationOverrides } from '../types/index.js';
import { resolveEasing, directionToFrom, exitAnimationProps } from './presets.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Serializes animation overrides into a JS snippet that scene templates
 * can read at runtime via `window.__anim`.
 *
 * This is injected into the page BEFORE scene scripts run, so templates
 * can reference `__anim.stagger`, `__anim.ease`, `__anim.pacing`, etc.
 */
export function buildAnimationRuntime(overrides?: AnimationOverrides): string {
  const easeStr = resolveEasing(overrides?.easing);
  const dir = directionToFrom(overrides?.direction);
  const exitProps = exitAnimationProps(overrides?.exitAnimation);
  const pacing = {
    entrance: overrides?.pacing?.entrance ?? 0.3,
    hold: overrides?.pacing?.hold ?? 0.5,
    exit: overrides?.pacing?.exit ?? 0.2,
  };
  // Normalize so they sum to 1
  const total = pacing.entrance + pacing.hold + pacing.exit;
  if (total > 0 && Math.abs(total - 1) > 0.001) {
    pacing.entrance /= total;
    pacing.hold /= total;
    pacing.exit /= total;
  }

  const runtime = {
    stagger: overrides?.stagger ?? null,
    ease: easeStr,
    direction: dir,
    emphasis: overrides?.emphasis ?? [],
    pacing,
    textEffect: overrides?.textEffect ?? null,
    speed: overrides?.speed ?? 1,
    delay: overrides?.delay ?? 0,
    exitAnimation: overrides?.exitAnimation ?? 'none',
    exitProps,
  };

  return `
<script>
// Animation runtime — injected by Showrunner engine
window.__anim = ${JSON.stringify(runtime)};

/**
 * Helper: apply text effect to a DOM element.
 * Returns an array of GSAP tweens to add to your timeline.
 */
window.__textEffect = function(el, effect, opts) {
  opts = opts || {};
  var tl = gsap.timeline();
  var text = el.textContent || '';

  switch (effect) {
    case 'typewriter': {
      // Use a single tween with onUpdate for reliable scrubbing
      var totalChars = text.length;
      el.textContent = '';
      el.style.visibility = 'visible';
      var charObj = { idx: 0 };
      tl.to(charObj, {
        idx: totalChars,
        duration: totalChars * (opts.charDuration || 0.04),
        ease: 'none',
        onUpdate: function() {
          var showCount = Math.floor(charObj.idx);
          el.textContent = text.substring(0, showCount);
        }
      });
      // Cursor blink at end (3 blinks)
      var cursor = document.createElement('span');
      cursor.className = '__sr-cursor';
      cursor.style.cssText = 'display:inline-block;width:2px;height:1em;background:var(--accent,#0078D4);margin-left:4px;vertical-align:text-bottom;opacity:0';
      el.parentNode.insertBefore(cursor, el.nextSibling);
      tl.to(cursor, { opacity: 1, duration: 0.01 }, '<');
      tl.to(cursor, { opacity: 0, duration: 0.15, yoyo: true, repeat: 5, ease: 'steps(1)' });
      tl.to(cursor, { opacity: 0, duration: 0.1 });
      break;
    }
    case 'word-reveal': {
      el.innerHTML = text.split(/\\s+/).map(function(w) {
        return '<span class="__sr-word" style="display:inline-block;margin-right:0.3em">' + w + '</span>';
      }).join('');
      tl.from(el.querySelectorAll('.__sr-word'), {
        y: opts.y || 20,
        opacity: 0,
        duration: opts.duration || 0.3,
        stagger: opts.stagger || 0.08,
        ease: opts.ease || 'power2.out'
      });
      break;
    }
    case 'char-cascade': {
      el.innerHTML = text.split('').map(function(ch) {
        if (ch === ' ') return '<span class="__sr-char" style="display:inline-block">&nbsp;</span>';
        return '<span class="__sr-char" style="display:inline-block">' + ch + '</span>';
      }).join('');
      tl.from(el.querySelectorAll('.__sr-char'), {
        y: opts.y || 30,
        opacity: 0,
        rotateX: opts.rotateX || -90,
        duration: opts.duration || 0.4,
        stagger: opts.stagger || 0.02,
        ease: opts.ease || 'back.out(1.5)'
      });
      break;
    }
    case 'fade-lines': {
      // Split by <br>, or by sentence boundaries, or treat as single line
      var html = el.innerHTML || '';
      var parts = [];
      if (html.indexOf('<br') !== -1) {
        parts = html.split(/<br\\s*\\/?>/i);
      } else if (text.indexOf('. ') !== -1) {
        parts = text.split(/(?<=\\.)\\s+/);
      } else if (text.indexOf(' — ') !== -1) {
        parts = text.split(' — ');
      }
      if (parts.length > 1) {
        el.innerHTML = parts.map(function(l) {
          return '<span class="__sr-line" style="display:block;padding:0.15em 0">' + l.trim() + '</span>';
        }).join('');
        tl.from(el.querySelectorAll('.__sr-line'), {
          opacity: 0,
          y: 30,
          scale: 0.97,
          duration: opts.duration || 0.5,
          stagger: opts.stagger || 0.25,
          ease: opts.ease || 'power2.out'
        });
      } else {
        tl.from(el, { opacity: 0, y: 25, duration: 0.5, ease: 'power2.out' });
      }
      break;
    }
    case 'highlight-sweep': {
      // First: text fades in with upward motion
      tl.from(el, { opacity: 0, y: 20, duration: 0.4, ease: opts.ease || 'power2.out' });
      // Then: highlight underline sweeps across
      el.style.backgroundImage = 'linear-gradient(90deg, var(--accent, #0078D4) 0%, var(--accent, #0078D4) 100%)';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundPosition = '0 88%';
      el.style.backgroundSize = '0% 35%';
      el.style.transition = 'none';
      tl.to(el, {
        backgroundSize: '100% 35%',
        duration: opts.duration || 0.8,
        ease: opts.ease || 'power2.inOut'
      });
      break;
    }
    case 'counter': {
      var target = parseFloat(text.replace(/[^\\d.-]/g, '')) || 0;
      var prefix = text.match(/^[^\\d.-]*/) ? text.match(/^[^\\d.-]*/)[0] : '';
      var suffix = text.match(/[^\\d.-]*$/) ? text.match(/[^\\d.-]*$/)[0] : '';
      var isInt = Number.isInteger(target);
      // Set initial display to 0 immediately so frame-0 shows the starting value
      el.textContent = prefix + '0' + suffix;
      var obj = { val: 0 };
      tl.to(obj, {
        val: target,
        duration: opts.duration || 1.5,
        ease: opts.ease || 'power2.out',
        onUpdate: function() {
          el.textContent = prefix + (isInt ? Math.round(obj.val).toLocaleString() : obj.val.toFixed(1)) + suffix;
        }
      });
      break;
    }
  }

  return tl;
};

/**
 * Helper: build exit animation for the whole scene container.
 */
window.__buildExit = function(selector) {
  var exitTl = gsap.timeline();
  if (window.__anim.exitAnimation === 'none' || !window.__anim.exitProps || Object.keys(window.__anim.exitProps).length === 0) {
    return exitTl;
  }
  exitTl.to(selector || '.scene', window.__anim.exitProps);
  return exitTl;
};

/**
 * Helper: get the stagger value — uses override if set, otherwise falls back.
 */
window.__getStagger = function(fallback) {
  return window.__anim.stagger != null ? window.__anim.stagger : (fallback || 0.1);
};

/**
 * Helper: get the ease string — uses override if set, otherwise falls back.
 */
window.__getEase = function(fallback) {
  return window.__anim.ease || fallback || 'power3.out';
};

/**
 * Helper: get direction-based from properties.
 */
window.__getDirectionFrom = function(fallbackY) {
  var d = window.__anim.direction;
  if (d && (d.x || d.y)) return d;
  return { y: fallbackY || 25 };
};
</script>
`;
}
