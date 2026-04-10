import type { TransitionType } from '../types/index.js';

/**
 * Compute the number of overlap frames for a transition.
 * Returns 0 for 'cut' transitions.
 */
export function getTransitionOverlapFrames(
  transition: TransitionType | undefined,
  fps: number,
  overlapSeconds = 0.5
): number {
  if (!transition || transition === 'cut') return 0;
  return Math.ceil(overlapSeconds * fps);
}

/**
 * Generate CSS for the exit animation of the outgoing scene.
 */
export function getExitCSS(transition: TransitionType, progress: number): string {
  switch (transition) {
    case 'fade':
      return `opacity: ${1 - progress};`;
    case 'slide-left':
      return `transform: translateX(${-progress * 100}%);`;
    case 'slide-up':
      return `transform: translateY(${-progress * 100}%);`;
    case 'zoom':
      return `transform: scale(${1 + progress * 0.1}); opacity: ${1 - progress};`;
    case 'cut':
    default:
      return '';
  }
}

/**
 * Generate CSS for the entrance animation of the incoming scene.
 */
export function getEntranceCSS(transition: TransitionType, progress: number): string {
  switch (transition) {
    case 'fade':
      return `opacity: ${progress};`;
    case 'slide-left':
      return `transform: translateX(${(1 - progress) * 100}%);`;
    case 'slide-up':
      return `transform: translateY(${(1 - progress) * 100}%);`;
    case 'zoom':
      return `transform: scale(${0.9 + progress * 0.1}); opacity: ${progress};`;
    case 'cut':
    default:
      return '';
  }
}
