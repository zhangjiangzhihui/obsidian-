import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import type { ProgressBarConfig, Chapter } from '../types';
import { MASCOT_OPTIONS } from '../types';

interface ProgressBarCanvasProps {
  config: ProgressBarConfig;
  progress: number; // 0 to 1
}

export interface ProgressBarCanvasRef {
  getCanvas: () => HTMLCanvasElement | null;
  renderFrame: (progress: number) => void;
}

// Easing functions
const easingFunctions = {
  linear: (t: number) => t,
  'ease-in': (t: number) => t * t * t,
  'ease-out': (t: number) => 1 - Math.pow(1 - t, 3),
  'ease-in-out': (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
};

// Helper: Get chapter end time
function getChapterEndTime(chapters: Chapter[], index: number, totalDuration: number): number {
  if (index >= chapters.length - 1) {
    return totalDuration;
  }
  return chapters[index + 1].startTime;
}

// Helper: Get chapter width as percentage
function getChapterWidthPercent(chapters: Chapter[], index: number, totalDuration: number): number {
  const duration = getChapterEndTime(chapters, index, totalDuration) - chapters[index].startTime;
  return duration / totalDuration;
}

// Helper: Get chapter start as percentage
function getChapterStartPercent(chapters: Chapter[], index: number, totalDuration: number): number {
  return chapters[index].startTime / totalDuration;
}

export const ProgressBarCanvas = forwardRef<ProgressBarCanvasRef, ProgressBarCanvasProps>(
  ({ config, progress }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const getCanvasHeight = () => {
      let height = config.height;
      
      if (config.showChapterNames && config.chapterNamePosition !== 'inside') {
        height += 40;
      }
      
      if (config.mascot.type !== 'none') {
        const mascotSpace = config.mascot.size + 10;
        if (config.mascot.position === 'above-bar' || config.mascot.position === 'below-bar') {
          height += mascotSpace;
        }
      }
      
      return height;
    };

    const getBarY = () => {
      let y = 0;
      
      if (config.showChapterNames && config.chapterNamePosition === 'above') {
        y += 40;
      }
      
      if (config.mascot.type !== 'none' && config.mascot.position === 'above-bar') {
        y += config.mascot.size + 10;
      }
      
      return y;
    };

    const renderFrame = (currentProgress: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const easedProgress = easingFunctions[config.animationEasing](currentProgress);
      const canvasHeight = getCanvasHeight();
      const barY = getBarY();

      canvas.width = config.width;
      canvas.height = canvasHeight;

      ctx.clearRect(0, 0, config.width, canvasHeight);

      const hasMascotOnBar = config.mascot.type !== 'none' && config.mascot.position === 'on-bar';
      
      switch (config.style) {
        case 'modern':
          renderModernStyle(ctx, config, easedProgress, barY, hasMascotOnBar);
          break;
        case 'minimal':
          renderMinimalStyle(ctx, config, easedProgress, barY);
          break;
        case 'neon':
          renderNeonStyle(ctx, config, easedProgress, barY);
          break;
        case 'glass':
          renderGlassStyle(ctx, config, easedProgress, barY);
          break;
        case 'gradient':
          renderGradientStyle(ctx, config, easedProgress, barY, hasMascotOnBar);
          break;
      }
      
      if (config.mascot.type !== 'none') {
        renderMascot(ctx, config, easedProgress, barY);
      }
      
      if (config.showChapterNames) {
        renderChapterNames(ctx, config, easedProgress, barY);
      }
    };

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
      renderFrame,
    }));

    useEffect(() => {
      renderFrame(progress);
    }, [config, progress]);

    return (
      <canvas
        ref={canvasRef}
        width={config.width}
        height={getCanvasHeight()}
        className="max-w-full h-auto"
      />
    );
  }
);

ProgressBarCanvas.displayName = 'ProgressBarCanvas';

// Helper functions
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function getChapterAtProgress(chapters: Chapter[], progress: number, totalDuration: number): { chapter: Chapter; index: number } | null {
  const currentTime = progress * totalDuration;
  for (let i = chapters.length - 1; i >= 0; i--) {
    if (currentTime >= chapters[i].startTime) {
      return { chapter: chapters[i], index: i };
    }
  }
  return chapters.length > 0 ? { chapter: chapters[0], index: 0 } : null;
}

function getFontWeight(weight: string): string {
  switch (weight) {
    case 'bold': return '700';
    case 'medium': return '600';
    default: return '500';
  }
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  const metrics = ctx.measureText(text);
  if (metrics.width <= maxWidth) return text;
  
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + '…').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated.length > 0 ? truncated + '…' : '';
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function lightenColor(hex: string, percent: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  const newR = Math.min(255, r + (255 - r) * (percent / 100));
  const newG = Math.min(255, g + (255 - g) * (percent / 100));
  const newB = Math.min(255, b + (255 - b) * (percent / 100));
  
  return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
}

function darkenColor(hex: string, percent: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  const newR = Math.max(0, r * (1 - percent / 100));
  const newG = Math.max(0, g * (1 - percent / 100));
  const newB = Math.max(0, b * (1 - percent / 100));
  
  return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
}

// Render chapter names
function renderChapterNames(ctx: CanvasRenderingContext2D, config: ProgressBarConfig, progress: number, barY: number) {
  const { width, height, chapters, chapterNamePosition, totalDuration } = config;
  const currentChapter = getChapterAtProgress(chapters, progress, totalDuration);

  chapters.forEach((chapter, index) => {
    const chapterStartPercent = getChapterStartPercent(chapters, index, totalDuration);
    const chapterWidthPercent = getChapterWidthPercent(chapters, index, totalDuration);
    const chapterX = chapterStartPercent * width;
    const chapterW = chapterWidthPercent * width;
    const chapterEndPercent = chapterStartPercent + chapterWidthPercent;

    const isActive = currentChapter?.index === index;
    const centerX = chapterX + chapterW / 2;
    const maxTextWidth = chapterW - 24;

    if (maxTextWidth < 20) return;

    ctx.font = `${getFontWeight(isActive ? 'bold' : config.fontWeight)} ${config.fontSize}px "SF Pro Display", "PingFang SC", -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const displayText = truncateText(ctx, chapter.name, maxTextWidth);
    if (!displayText) return;

    let fillRatio = 0;
    if (progress >= chapterEndPercent) {
      fillRatio = 1;
    } else if (progress > chapterStartPercent) {
      fillRatio = (progress - chapterStartPercent) / chapterWidthPercent;
    }

    if (chapterNamePosition === 'above') {
      // 上方显示 - 更精致的标签样式
      const textMetrics = ctx.measureText(displayText);
      const pillWidth = textMetrics.width + 20;
      const pillHeight = 26;
      const pillX = centerX - pillWidth / 2;
      const pillY = 6;

      if (isActive) {
        // 活动章节 - 填充背景
        ctx.fillStyle = chapter.color || config.progressColor;
        roundRect(ctx, pillX, pillY, pillWidth, pillHeight, pillHeight / 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.fillText(displayText, centerX, pillY + pillHeight / 2);
        
        // 小三角指示器
        ctx.beginPath();
        ctx.moveTo(centerX - 5, pillY + pillHeight);
        ctx.lineTo(centerX + 5, pillY + pillHeight);
        ctx.lineTo(centerX, pillY + pillHeight + 6);
        ctx.closePath();
        ctx.fillStyle = chapter.color || config.progressColor;
        ctx.fill();
      } else {
        ctx.fillStyle = hexToRgba(config.textColor, 0.5);
        ctx.fillText(displayText, centerX, pillY + pillHeight / 2);
      }
    } else if (chapterNamePosition === 'inside') {
      // 内部显示 - 更有质感的标签
      const textMetrics = ctx.measureText(displayText);
      const pillWidth = Math.min(textMetrics.width + 24, chapterW - 8);
      const pillHeight = Math.min(config.fontSize + 14, height - 8);
      const pillX = centerX - pillWidth / 2;
      const pillY = barY + (height - pillHeight) / 2;

      const isFilled = fillRatio > 0.5;
      
      // 背景
      if (isFilled) {
        ctx.fillStyle = hexToRgba('#000000', 0.35);
      } else {
        ctx.fillStyle = hexToRgba(chapter.color || config.progressColor, 0.12);
      }
      roundRect(ctx, pillX, pillY, pillWidth, pillHeight, pillHeight / 2);
      ctx.fill();
      
      // 边框
      ctx.strokeStyle = isFilled ? hexToRgba('#ffffff', 0.2) : hexToRgba(chapter.color || config.progressColor, 0.3);
      ctx.lineWidth = 1;
      roundRect(ctx, pillX, pillY, pillWidth, pillHeight, pillHeight / 2);
      ctx.stroke();

      // 文字
      ctx.fillStyle = isFilled ? '#ffffff' : hexToRgba(config.textColor, 0.85);
      ctx.fillText(displayText, centerX, barY + height / 2);
    } else {
      // 下方显示
      ctx.fillStyle = isActive ? config.textColor : hexToRgba(config.textColor, 0.5);
      ctx.fillText(displayText, centerX, barY + height + 24);
    }
  });
}

// Modern Style - 高质感设计
function renderModernStyle(ctx: CanvasRenderingContext2D, config: ProgressBarConfig, progress: number, barY: number, hideDot: boolean = false) {
  const { width, height, chapters, borderRadius, backgroundColor, showChapterDividers, totalDuration } = config;
  
  // 外层阴影
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = backgroundColor;
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  
  // 内层背景渐变 - 增加深度感
  const bgGradient = ctx.createLinearGradient(0, barY, 0, barY + height);
  bgGradient.addColorStop(0, lightenColor(backgroundColor, 8));
  bgGradient.addColorStop(0.5, backgroundColor);
  bgGradient.addColorStop(1, darkenColor(backgroundColor, 10));
  ctx.fillStyle = bgGradient;
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.fill();
  
  // 顶部高光线
  ctx.strokeStyle = hexToRgba('#ffffff', 0.08);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(borderRadius, barY + 0.5);
  ctx.lineTo(width - borderRadius, barY + 0.5);
  ctx.stroke();

  const currentChapter = getChapterAtProgress(chapters, progress, totalDuration);

  ctx.save();
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.clip();

  chapters.forEach((chapter, index) => {
    const chapterStartPercent = getChapterStartPercent(chapters, index, totalDuration);
    const chapterWidthPercent = getChapterWidthPercent(chapters, index, totalDuration);
    const chapterX = chapterStartPercent * width;
    const chapterW = chapterWidthPercent * width;
    const chapterEndPercent = chapterStartPercent + chapterWidthPercent;
    
    let fillWidth = 0;
    if (progress >= chapterEndPercent) {
      fillWidth = chapterW;
    } else if (progress > chapterStartPercent) {
      fillWidth = (progress - chapterStartPercent) * width;
    }

    const color = chapter.color || config.progressColor;

    if (fillWidth > 0) {
      // 主渐变 - 更丰富的层次
      const gradient = ctx.createLinearGradient(0, barY, 0, barY + height);
      gradient.addColorStop(0, lightenColor(color, 15));
      gradient.addColorStop(0.3, color);
      gradient.addColorStop(0.7, color);
      gradient.addColorStop(1, darkenColor(color, 15));
      
      ctx.fillStyle = gradient;
      ctx.fillRect(chapterX, barY, fillWidth, height);
      
      // 顶部高光
      const highlightGradient = ctx.createLinearGradient(0, barY, 0, barY + height * 0.4);
      highlightGradient.addColorStop(0, hexToRgba('#ffffff', 0.25));
      highlightGradient.addColorStop(1, hexToRgba('#ffffff', 0));
      ctx.fillStyle = highlightGradient;
      ctx.fillRect(chapterX, barY, fillWidth, height * 0.4);
      
      // 底部阴影
      const shadowGradient = ctx.createLinearGradient(0, barY + height * 0.7, 0, barY + height);
      shadowGradient.addColorStop(0, hexToRgba('#000000', 0));
      shadowGradient.addColorStop(1, hexToRgba('#000000', 0.15));
      ctx.fillStyle = shadowGradient;
      ctx.fillRect(chapterX, barY + height * 0.7, fillWidth, height * 0.3);
    }

    // 章节分隔线
    if (showChapterDividers && index < chapters.length - 1) {
      const divX = chapterX + chapterW;
      ctx.fillStyle = hexToRgba('#ffffff', 0.15);
      ctx.fillRect(divX - 0.5, barY + 4, 1, height - 8);
    }
  });

  ctx.restore();
  
  // 边框
  ctx.strokeStyle = hexToRgba('#ffffff', 0.1);
  ctx.lineWidth = 1;
  roundRect(ctx, 0.5, barY + 0.5, width - 1, height - 1, borderRadius);
  ctx.stroke();

  // 进度指示器
  if (!hideDot) {
    const progressX = progress * width;
    if (progressX > 4 && progressX < width - 4) {
      const dotColor = currentChapter?.chapter.color || config.progressColor;
      
      // 外发光
      ctx.beginPath();
      ctx.arc(progressX, barY + height / 2, 10, 0, Math.PI * 2);
      const glowGradient = ctx.createRadialGradient(progressX, barY + height / 2, 0, progressX, barY + height / 2, 10);
      glowGradient.addColorStop(0, hexToRgba(dotColor, 0.4));
      glowGradient.addColorStop(1, hexToRgba(dotColor, 0));
      ctx.fillStyle = glowGradient;
      ctx.fill();
      
      // 白色外圈
      ctx.beginPath();
      ctx.arc(progressX, barY + height / 2, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = hexToRgba('#000000', 0.1);
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // 彩色内圈
      ctx.beginPath();
      ctx.arc(progressX, barY + height / 2, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = dotColor;
      ctx.fill();
    }
  }
}

// Minimal Style - 简约风格
function renderMinimalStyle(ctx: CanvasRenderingContext2D, config: ProgressBarConfig, progress: number, barY: number) {
  const { width, height, chapters, backgroundColor, chapterNamePosition, totalDuration } = config;
  
  const barHeight = chapterNamePosition === 'inside' ? height : height * 0.4;
  const barYOffset = chapterNamePosition === 'inside' ? barY : barY + (height - barHeight) / 2;

  // 背景
  ctx.fillStyle = backgroundColor;
  roundRect(ctx, 0, barYOffset, width, barHeight, barHeight / 2);
  ctx.fill();

  ctx.save();
  roundRect(ctx, 0, barYOffset, width, barHeight, barHeight / 2);
  ctx.clip();

  chapters.forEach((chapter, index) => {
    const chapterStartPercent = getChapterStartPercent(chapters, index, totalDuration);
    const chapterWidthPercent = getChapterWidthPercent(chapters, index, totalDuration);
    const chapterX = chapterStartPercent * width;
    const chapterW = chapterWidthPercent * width;
    const chapterEndPercent = chapterStartPercent + chapterWidthPercent;
    
    let fillWidth = 0;
    if (progress >= chapterEndPercent) {
      fillWidth = chapterW;
    } else if (progress > chapterStartPercent) {
      fillWidth = (progress - chapterStartPercent) * width;
    }

    if (fillWidth > 0) {
      ctx.fillStyle = chapter.color || config.progressColor;
      ctx.fillRect(chapterX, barYOffset, fillWidth, barHeight);
    }
  });

  ctx.restore();
}

// Neon Style - 霓虹风格
function renderNeonStyle(ctx: CanvasRenderingContext2D, config: ProgressBarConfig, progress: number, barY: number) {
  const { width, height, chapters, borderRadius, totalDuration } = config;
  
  // 深色背景
  ctx.fillStyle = '#0a0a12';
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.fill();
  
  // 发光边框
  ctx.strokeStyle = hexToRgba('#6366f1', 0.3);
  ctx.lineWidth = 1;
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.stroke();

  ctx.save();
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.clip();

  chapters.forEach((chapter, index) => {
    const chapterStartPercent = getChapterStartPercent(chapters, index, totalDuration);
    const chapterWidthPercent = getChapterWidthPercent(chapters, index, totalDuration);
    const chapterX = chapterStartPercent * width;
    const chapterW = chapterWidthPercent * width;
    const chapterEndPercent = chapterStartPercent + chapterWidthPercent;
    
    let fillWidth = 0;
    if (progress >= chapterEndPercent) {
      fillWidth = chapterW;
    } else if (progress > chapterStartPercent) {
      fillWidth = (progress - chapterStartPercent) * width;
    }

    const color = chapter.color || config.progressColor;

    // 背景发光
    ctx.fillStyle = hexToRgba(color, 0.05);
    ctx.fillRect(chapterX, barY, chapterW, height);

    if (fillWidth > 0) {
      // 外发光
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.fillStyle = hexToRgba(color, 0.6);
      ctx.fillRect(chapterX, barY, fillWidth, height);
      ctx.shadowBlur = 0;
      
      // 核心亮光
      ctx.fillStyle = color;
      ctx.fillRect(chapterX, barY + height * 0.3, fillWidth, height * 0.4);
      
      // 中心高光
      ctx.fillStyle = lightenColor(color, 40);
      ctx.fillRect(chapterX, barY + height * 0.4, fillWidth, height * 0.2);
    }

    if (index < chapters.length - 1) {
      ctx.fillStyle = hexToRgba('#ffffff', 0.1);
      ctx.fillRect(chapterX + chapterW - 0.5, barY + 8, 1, height - 16);
    }
  });

  ctx.restore();
}

// Glass Style - 玻璃风格
function renderGlassStyle(ctx: CanvasRenderingContext2D, config: ProgressBarConfig, progress: number, barY: number) {
  const { width, height, chapters, borderRadius, totalDuration } = config;
  
  // 毛玻璃背景
  const bgGradient = ctx.createLinearGradient(0, barY, 0, barY + height);
  bgGradient.addColorStop(0, hexToRgba('#ffffff', 0.15));
  bgGradient.addColorStop(0.5, hexToRgba('#ffffff', 0.08));
  bgGradient.addColorStop(1, hexToRgba('#ffffff', 0.12));
  ctx.fillStyle = bgGradient;
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.fill();
  
  // 边框
  ctx.strokeStyle = hexToRgba('#ffffff', 0.2);
  ctx.lineWidth = 1;
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.stroke();

  ctx.save();
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.clip();

  chapters.forEach((chapter, index) => {
    const chapterStartPercent = getChapterStartPercent(chapters, index, totalDuration);
    const chapterWidthPercent = getChapterWidthPercent(chapters, index, totalDuration);
    const chapterX = chapterStartPercent * width;
    const chapterW = chapterWidthPercent * width;
    const chapterEndPercent = chapterStartPercent + chapterWidthPercent;
    
    let fillWidth = 0;
    if (progress >= chapterEndPercent) {
      fillWidth = chapterW;
    } else if (progress > chapterStartPercent) {
      fillWidth = (progress - chapterStartPercent) * width;
    }

    const color = chapter.color || config.progressColor;

    if (fillWidth > 0) {
      const fillGradient = ctx.createLinearGradient(0, barY, 0, barY + height);
      fillGradient.addColorStop(0, hexToRgba(color, 0.9));
      fillGradient.addColorStop(0.4, hexToRgba(color, 0.75));
      fillGradient.addColorStop(1, hexToRgba(color, 0.85));
      
      ctx.fillStyle = fillGradient;
      ctx.fillRect(chapterX, barY, fillWidth, height);
      
      // 玻璃高光
      ctx.fillStyle = hexToRgba('#ffffff', 0.3);
      ctx.fillRect(chapterX, barY, fillWidth, height * 0.35);
    }

    if (index < chapters.length - 1) {
      const divX = chapterX + chapterW;
      ctx.fillStyle = hexToRgba('#ffffff', 0.25);
      ctx.fillRect(divX - 0.5, barY + 4, 1, height - 8);
    }
  });

  ctx.restore();
}

// Gradient Style - 渐变风格
function renderGradientStyle(ctx: CanvasRenderingContext2D, config: ProgressBarConfig, progress: number, barY: number, hideDot: boolean = false) {
  const { width, height, chapters, borderRadius, backgroundColor, totalDuration } = config;
  
  // 背景
  ctx.fillStyle = backgroundColor;
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.fill();

  const currentChapter = getChapterAtProgress(chapters, progress, totalDuration);
  const progressX = progress * width;

  ctx.save();
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.clip();

  if (progressX > 0) {
    // 创建跨章节渐变
    const fullGradient = ctx.createLinearGradient(0, 0, width, 0);
    
    chapters.forEach((chapter, index) => {
      const chapterStartPercent = getChapterStartPercent(chapters, index, totalDuration);
      const chapterEndPercent = chapterStartPercent + getChapterWidthPercent(chapters, index, totalDuration);
      const color = chapter.color || config.progressColor;
      
      fullGradient.addColorStop(chapterStartPercent, color);
      fullGradient.addColorStop(Math.min(chapterEndPercent - 0.001, 0.999), color);
    });

    ctx.fillStyle = fullGradient;
    ctx.fillRect(0, barY, progressX, height);
    
    // 高光
    ctx.fillStyle = hexToRgba('#ffffff', 0.2);
    ctx.fillRect(0, barY, progressX, height * 0.4);
  }

  // 分隔符
  chapters.forEach((_chapter, index) => {
    if (index < chapters.length - 1) {
      const chapterStartPercent = getChapterStartPercent(chapters, index, totalDuration);
      const chapterWidthPercent = getChapterWidthPercent(chapters, index, totalDuration);
      const divX = (chapterStartPercent + chapterWidthPercent) * width;
      
      ctx.fillStyle = hexToRgba('#ffffff', 0.3);
      ctx.beginPath();
      ctx.arc(divX, barY + height / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  ctx.restore();

  // 进度指示器
  if (!hideDot && progressX > 4 && progressX < width - 4) {
    const headColor = currentChapter?.chapter.color || config.progressColor;
    
    ctx.beginPath();
    ctx.arc(progressX, barY + height / 2, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(progressX, barY + height / 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = headColor;
    ctx.fill();
  }
}

// Render mascot
function renderMascot(ctx: CanvasRenderingContext2D, config: ProgressBarConfig, progress: number, barY: number) {
  const { width, height, mascot } = config;
  
  let emoji = '';
  if (mascot.type === 'custom') {
    emoji = mascot.customEmoji;
  } else {
    const mascotOption = MASCOT_OPTIONS.find(m => m.type === mascot.type);
    emoji = mascotOption?.emoji || '🐱';
  }
  
  const progressX = Math.max(mascot.size / 2, Math.min(progress * width, width - mascot.size / 2));
  
  let mascotY: number;
  switch (mascot.position) {
    case 'above-bar':
      mascotY = barY - mascot.size / 2 - 5;
      break;
    case 'below-bar':
      mascotY = barY + height + mascot.size / 2 + 5;
      break;
    case 'on-bar':
    default:
      mascotY = barY + height / 2;
      break;
  }
  
  // 阴影
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.font = `${mascot.size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, progressX + 2, mascotY + 2);
  ctx.restore();
  
  // 萌宠
  ctx.save();
  ctx.font = `${mascot.size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, progressX, mascotY);
  ctx.restore();
}

export default ProgressBarCanvas;
