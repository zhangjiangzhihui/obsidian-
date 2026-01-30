export type ProgressBarStyle = 'modern' | 'minimal' | 'neon' | 'glass' | 'gradient';

export interface Chapter {
  id: string;
  name: string;
  duration: number; // percentage of total (0-100)
  color?: string;
}

export interface ProgressBarConfig {
  style: ProgressBarStyle;
  width: number;
  height: number;
  totalDuration: number; // total video duration in seconds
  fps: number;
  
  // Colors
  backgroundColor: string;
  progressColor: string;
  accentColor: string;
  textColor: string;
  
  // Chapter settings
  chapters: Chapter[];
  showChapterNames: boolean;
  showChapterDividers: boolean;
  chapterNamePosition: 'above' | 'inside' | 'below';
  
  // Visual settings
  borderRadius: number;
  glowEffect: boolean;
  glowIntensity: number;
  
  // Animation
  animationEasing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  
  // Time display
  showTimeCode: boolean;
  showPercentage: boolean;
  
  // Typography
  fontSize: number;
  fontWeight: 'normal' | 'medium' | 'bold';
}

export const DEFAULT_CHAPTERS: Chapter[] = [
  { id: '1', name: '开场', duration: 10, color: '#6366f1' },
  { id: '2', name: '第一部分', duration: 25, color: '#8b5cf6' },
  { id: '3', name: '核心内容', duration: 40, color: '#a855f7' },
  { id: '4', name: '总结', duration: 15, color: '#d946ef' },
  { id: '5', name: '结尾', duration: 10, color: '#ec4899' },
];

export const DEFAULT_CONFIG: ProgressBarConfig = {
  style: 'modern',
  width: 1000,
  height: 80,
  totalDuration: 60,
  fps: 30,
  
  backgroundColor: '#1a1a2e',
  progressColor: '#6366f1',
  accentColor: '#818cf8',
  textColor: '#ffffff',
  
  chapters: DEFAULT_CHAPTERS,
  showChapterNames: true,
  showChapterDividers: true,
  chapterNamePosition: 'above',
  
  borderRadius: 12,
  glowEffect: true,
  glowIntensity: 20,
  
  animationEasing: 'linear',
  
  showTimeCode: true,
  showPercentage: false,
  
  fontSize: 14,
  fontWeight: 'medium',
};

export const STYLE_OPTIONS: { value: ProgressBarStyle; label: string; description: string }[] = [
  { value: 'modern', label: '现代风格', description: '简洁现代，渐变高亮' },
  { value: 'minimal', label: '极简风格', description: '纯净简约，突出内容' },
  { value: 'neon', label: '霓虹风格', description: '赛博朋克，发光效果' },
  { value: 'glass', label: '玻璃风格', description: '毛玻璃质感，通透' },
  { value: 'gradient', label: '渐变风格', description: '彩虹渐变，活力四射' },
];

export const PRESET_COLOR_SCHEMES = [
  {
    name: '靛蓝紫',
    colors: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'],
  },
  {
    name: '海洋蓝',
    colors: ['#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e'],
  },
  {
    name: '日落橙',
    colors: ['#f97316', '#fb923c', '#fbbf24', '#facc15', '#eab308'],
  },
  {
    name: '玫瑰红',
    colors: ['#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#fecdd3'],
  },
  {
    name: '森林绿',
    colors: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
  },
];
