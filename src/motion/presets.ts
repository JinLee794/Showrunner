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
    y: 40,
    opacity: 0,
    duration: 0.6,
    ease: 'back.out(1.4)',
  },
  slideUp: {
    y: 25,
    opacity: 0,
    duration: 0.4,
    ease: 'power2.out',
  },
  slideUpSpring: {
    y: 30,
    opacity: 0,
    duration: 0.45,
    ease: 'back.out(1.2)',
  },
  fadeIn: {
    opacity: 0,
    duration: 0.4,
    ease: 'power2.out',
  },
  fadeInUp: {
    y: 15,
    opacity: 0,
    duration: 0.35,
    ease: 'power2.out',
  },
  scaleIn: {
    scale: 0,
    opacity: 0,
    duration: 0.45,
    ease: 'back.out(2)',
  },
  scaleInSubtle: {
    scale: 0.9,
    opacity: 0,
    duration: 0.4,
    ease: 'back.out(1.4)',
  },
  barGrow: {
    scaleX: 0,
    transformOrigin: 'left center',
    duration: 0.7,
    ease: 'power3.out',
  },
  slideFromLeft: {
    x: -25,
    opacity: 0,
    duration: 0.4,
    ease: 'back.out(1.2)',
  },
  slideFromRight: {
    x: 25,
    opacity: 0,
    duration: 0.4,
    ease: 'back.out(1.2)',
  },
  expandWidth: {
    scaleX: 0,
    transformOrigin: 'center center',
    duration: 0.4,
    ease: 'power3.out',
  },
  popIn: {
    scale: 0.3,
    opacity: 0,
    duration: 0.35,
    ease: 'back.out(2.5)',
  },
} as const;
