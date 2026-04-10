export type ThemeName =
  | 'corporate-dark'
  | 'corporate-light'
  | 'minimal'
  | 'microsoft'
  | 'custom';

export type TransitionType = 'cut' | 'fade' | 'slide-left' | 'slide-up' | 'zoom';

export type EasingType = 'linear' | 'easeOut' | 'easeInOut' | 'spring' | 'bouncy';

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
  | 'scene-showcase';

export interface AnimationOverrides {
  stagger?: number;
  easing?: EasingType;
  direction?: 'up' | 'down' | 'left' | 'right';
  emphasis?: number[];
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
