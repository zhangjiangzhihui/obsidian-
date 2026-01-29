export type ProgressBarStyle = 'line' | 'circle' | 'wave' | 'dots' | 'gradient-line';

export interface ProgressBarConfig {
  style: ProgressBarStyle;
  width: number;
  height: number;
  duration: number; // in seconds
  fps: number;
  backgroundColor: string;
  progressColor: string;
  secondaryColor: string;
  borderRadius: number;
  strokeWidth: number;
  showPercentage: boolean;
  fontColor: string;
  fontSize: number;
  glowEffect: boolean;
  animationEasing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface ExportOptions {
  format: 'png-sequence' | 'gif' | 'webm';
  quality: number;
}

export const DEFAULT_CONFIG: ProgressBarConfig = {
  style: 'line',
  width: 800,
  height: 40,
  duration: 10,
  fps: 30,
  backgroundColor: '#1a1a1a',
  progressColor: '#6366f1',
  secondaryColor: '#818cf8',
  borderRadius: 20,
  strokeWidth: 8,
  showPercentage: false,
  fontColor: '#ffffff',
  fontSize: 16,
  glowEffect: true,
  animationEasing: 'linear',
};

export const STYLE_OPTIONS: { value: ProgressBarStyle; label: string; icon: string }[] = [
  { value: 'line', label: '直线进度条', icon: '━' },
  { value: 'gradient-line', label: '渐变进度条', icon: '▓' },
  { value: 'circle', label: '圆形进度条', icon: '◐' },
  { value: 'wave', label: '波浪进度条', icon: '〰' },
  { value: 'dots', label: '点阵进度条', icon: '●●●' },
];
