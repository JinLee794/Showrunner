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
    case 'elastic': return 'elastic.out(1, 0.3)';
    case 'slow': return 'slow(0.7, 0.7, false)';
    case 'snap': return 'power4.inOut';
    case 'power1': return 'power1.out';
    case 'power4': return 'power4.out';
    case 'circ': return 'circ.out';
    case 'expo': return 'expo.out';
    case 'steps': return 'steps(12)';
    default: return 'power3.out';
  }
}

/**
 * Direction-to-axis mapping helpers.
 */
export function directionToFrom(direction?: string): { x?: number; y?: number } {
  switch (direction) {
    case 'left': return { x: -40 };
    case 'right': return { x: 40 };
    case 'down': return { y: -40 };
    case 'up':
    default: return { y: 40 };
  }
}

/**
 * Exit animation configurations.
 */
export function exitAnimationProps(exit?: string): Record<string, unknown> {
  switch (exit) {
    case 'fade': return { opacity: 0, duration: 0.4, ease: 'power2.in' };
    case 'slide-up': return { y: -60, opacity: 0, duration: 0.4, ease: 'power2.in' };
    case 'slide-down': return { y: 60, opacity: 0, duration: 0.4, ease: 'power2.in' };
    case 'scale-down': return { scale: 0.8, opacity: 0, duration: 0.4, ease: 'power2.in' };
    case 'none':
    default: return {};
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
  // --- New presets ---
  typewriter: {
    duration: 0.03, // per character
    ease: 'none',
  },
  wordReveal: {
    y: 20,
    opacity: 0,
    duration: 0.3,
    stagger: 0.08,
    ease: 'power2.out',
  },
  charCascade: {
    y: 30,
    opacity: 0,
    rotateX: -90,
    duration: 0.4,
    stagger: 0.02,
    ease: 'back.out(1.5)',
  },
  counterRoll: {
    duration: 1.2,
    ease: 'power2.out',
  },
  highlightSweep: {
    backgroundSize: '0% 100%',
    duration: 0.6,
    ease: 'power2.inOut',
  },
  gentleFloat: {
    y: 10,
    duration: 2,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
  },
  pulse: {
    scale: 1.05,
    duration: 0.8,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
  },
} as const;
