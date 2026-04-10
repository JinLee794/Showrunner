import type { EasingType } from '../types/index.js';

/**
 * Map our easing names to GSAP ease strings.
 */
export function resolveEasing(easing?: EasingType): string {
  switch (easing) {
    case 'linear': return 'none';
    case 'easeOut': return 'power3.out';
    case 'easeInOut': return 'power2.inOut';
    case 'spring': return 'back.out(1.7)';
    case 'bouncy': return 'elastic.out(1, 0.5)';
    default: return 'power3.out';
  }
}

/**
 * Animation preset configurations reusable across scene templates.
 */
export const presets = {
  titleEntrance: {
    y: 30,
    opacity: 0,
    duration: 0.4,
    ease: 'back.out(1.7)',
  },
  slideUp: {
    y: 20,
    opacity: 0,
    duration: 0.3,
    ease: 'power2.out',
  },
  fadeIn: {
    opacity: 0,
    duration: 0.4,
    ease: 'power2.out',
  },
  scaleIn: {
    scale: 0,
    opacity: 0,
    duration: 0.4,
    ease: 'back.out(1.7)',
  },
  barGrow: {
    scaleX: 0,
    transformOrigin: 'left center',
    duration: 0.6,
    ease: 'power3.out',
  },
} as const;
