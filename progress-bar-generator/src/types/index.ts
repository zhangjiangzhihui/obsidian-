export type ProgressBarStyle = 'modern' | 'minimal' | 'neon' | 'glass' | 'gradient';

export interface Chapter {
  id: string;
  name: string;
  startTime: number; // in seconds
  color?: string;
}

export type MascotType = 'none' | 'cat' | 'dog' | 'rabbit' | 'bear' | 'panda' | 'fox' | 'penguin' | 'chicken' | 'rocket' | 'star' | 'heart' | 'fire' | 'custom';

export interface MascotConfig {
  type: MascotType;
  customEmoji: string;
  size: number;
  position: 'on-bar' | 'above-bar' | 'below-bar';
  bounce: boolean;
  trail: boolean;
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
  
  // Mascot
  mascot: MascotConfig;
}

// Default chapters with timestamps
export const DEFAULT_CHAPTERS: Chapter[] = [
  { id: '1', name: '开场', startTime: 0, color: '#6366f1' },
  { id: '2', name: '第一部分', startTime: 15, color: '#8b5cf6' },
  { id: '3', name: '核心内容', startTime: 45, color: '#a855f7' },
  { id: '4', name: '总结', startTime: 100, color: '#d946ef' },
  { id: '5', name: '结尾', startTime: 130, color: '#ec4899' },
];

export const MASCOT_OPTIONS: { type: MascotType; emoji: string; label: string }[] = [
  { type: 'none', emoji: '⊘', label: '无' },
  { type: 'cat', emoji: '🐱', label: '猫咪' },
  { type: 'dog', emoji: '🐶', label: '狗狗' },
  { type: 'rabbit', emoji: '🐰', label: '兔子' },
  { type: 'bear', emoji: '🐻', label: '小熊' },
  { type: 'panda', emoji: '🐼', label: '熊猫' },
  { type: 'fox', emoji: '🦊', label: '狐狸' },
  { type: 'penguin', emoji: '🐧', label: '企鹅' },
  { type: 'chicken', emoji: '🐤', label: '小鸡' },
  { type: 'rocket', emoji: '🚀', label: '火箭' },
  { type: 'star', emoji: '⭐', label: '星星' },
  { type: 'heart', emoji: '❤️', label: '爱心' },
  { type: 'fire', emoji: '🔥', label: '火焰' },
  { type: 'custom', emoji: '✏️', label: '自定义' },
];

export const DEFAULT_MASCOT: MascotConfig = {
  type: 'cat',
  customEmoji: '😀',
  size: 32,
  position: 'on-bar',
  bounce: true,
  trail: false,
};

export const DEFAULT_CONFIG: ProgressBarConfig = {
  style: 'modern',
  width: 1000,
  height: 60,
  totalDuration: 150, // 2:30
  fps: 30,
  
  backgroundColor: '#1a1a2e',
  progressColor: '#6366f1',
  accentColor: '#818cf8',
  textColor: '#ffffff',
  
  chapters: DEFAULT_CHAPTERS,
  showChapterNames: true,
  showChapterDividers: true,
  chapterNamePosition: 'inside',
  
  borderRadius: 12,
  glowEffect: true,
  glowIntensity: 20,
  
  animationEasing: 'linear',
  
  showTimeCode: true,
  showPercentage: false,
  
  fontSize: 14,
  fontWeight: 'medium',
  
  mascot: DEFAULT_MASCOT,
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

// Helper: Convert seconds to time string (mm:ss)
export function formatTimeString(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Helper: Parse time string to seconds
export function parseTimeString(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length === 1) {
    return parseInt(parts[0], 10) || 0;
  } else if (parts.length === 2) {
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    return mins * 60 + secs;
  } else if (parts.length === 3) {
    const hours = parseInt(parts[0], 10) || 0;
    const mins = parseInt(parts[1], 10) || 0;
    const secs = parseInt(parts[2], 10) || 0;
    return hours * 3600 + mins * 60 + secs;
  }
  return 0;
}

// Helper: Get chapter duration based on next chapter's start time
export function getChapterDuration(chapters: Chapter[], index: number, totalDuration: number): number {
  if (index >= chapters.length - 1) {
    return totalDuration - chapters[index].startTime;
  }
  return chapters[index + 1].startTime - chapters[index].startTime;
}

// Helper: Get chapter duration as percentage
export function getChapterPercentage(chapters: Chapter[], index: number, totalDuration: number): number {
  const duration = getChapterDuration(chapters, index, totalDuration);
  return (duration / totalDuration) * 100;
}
