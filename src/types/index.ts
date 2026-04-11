export type ThemeName =
  | 'corporate-dark'
  | 'corporate-light'
  | 'minimal'
  | 'microsoft'
  | 'custom';

export type TransitionType = 'cut' | 'fade' | 'slide-left' | 'slide-up' | 'zoom';

export type EasingType =
  | 'linear'
  | 'easeOut'
  | 'easeInOut'
  | 'spring'
  | 'bouncy'
  | 'elastic'
  | 'slow'
  | 'snap'
  | 'power1'
  | 'power4'
  | 'circ'
  | 'expo'
  | 'steps';

export type SceneType =
  | 'title-card'
  | 'section-header'
  | 'pipeline-funnel'
  | 'milestone-timeline'
  | 'risk-callout'
  | 'action-items'
  | 'deal-team'
  | 'kpi-scorecard'
  | 'chart-bar'
  | 'chart-line'
  | 'chart-donut'
  | 'table'
  | 'quote-highlight'
  | 'comparison'
  | 'closing'
  | 'code-terminal'
  | 'scene-showcase'
  | 'image-card'
  | 'bullet-list'
  | 'stat-counter'
  | 'text-reveal';

export interface PacingPhases {
  /** Fraction of duration for entrance animations (0-1, default ~0.3) */
  entrance?: number;
  /** Fraction of duration to hold the final state (0-1, default ~0.5) */
  hold?: number;
  /** Fraction of duration for exit animation (0-1, default ~0.2, 0 = no exit) */
  exit?: number;
}

export type TextEffect =
  | 'typewriter'
  | 'word-reveal'
  | 'char-cascade'
  | 'fade-lines'
  | 'highlight-sweep'
  | 'counter';

export interface AnimationOverrides {
  stagger?: number;
  easing?: EasingType;
  direction?: 'up' | 'down' | 'left' | 'right';
  emphasis?: number[];
  /** Control entrance/hold/exit timing within the scene duration */
  pacing?: PacingPhases;
  /** Text display effect to apply to primary text elements */
  textEffect?: TextEffect;
  /** Speed multiplier for overall animation (0.5 = half speed, 2 = double) */
  speed?: number;
  /** Delay before entrance begins (seconds, within the scene timeline) */
  delay?: number;
  /** Enable exit animation at the end of the scene */
  exitAnimation?: 'fade' | 'slide-up' | 'slide-down' | 'scale-down' | 'none';
}

export interface Scene {
  type: SceneType;
  duration: number;
  transition?: TransitionType;
  data: Record<string, unknown>;
  animation?: AnimationOverrides;
  notes?: string;
}

export interface Branding {
  logo?: string;
  accent?: string;
  font?: string;
}

export interface Storyboard {
  title: string;
  theme?: ThemeName;
  fps?: 24 | 30 | 60;
  resolution?: [number, number];
  scenes: Scene[];
  branding?: Branding;
  assets?: Record<string, string>;
}

export type RenderQuality = 'high' | 'medium' | 'fast';

export interface RenderResult {
  path?: string;
  url?: string;
  duration: number;
  frames: number;
  fileSize: number;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  summary?: {
    scenes: number;
    duration: number;
    frames: number;
  };
}

export interface OutputResult {
  path?: string;
  url?: string;
  fileSize: number;
}

export interface OutputStrategy {
  write(buffer: Buffer, filename: string): Promise<OutputResult>;
  cleanup(id: string): Promise<void>;
}

export interface SceneTypeInfo {
  type: SceneType;
  description: string;
  dataSchema: Record<string, unknown>;
}
