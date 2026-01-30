import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import type { ProgressBarConfig, Chapter } from '../types';

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

export const ProgressBarCanvas = forwardRef<ProgressBarCanvasRef, ProgressBarCanvasProps>(
  ({ config, progress }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Calculate canvas height based on chapter name position
    const getCanvasHeight = () => {
      if (!config.showChapterNames) return config.height;
      if (config.chapterNamePosition === 'inside') return config.height;
      return config.height + 30; // Extra space for labels
    };

    const getBarY = () => {
      if (!config.showChapterNames) return 0;
      if (config.chapterNamePosition === 'above') return 30;
      return 0;
    };

    const renderFrame = (currentProgress: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const easedProgress = easingFunctions[config.animationEasing](currentProgress);
      const canvasHeight = getCanvasHeight();
      const barY = getBarY();

      // Set canvas size
      canvas.width = config.width;
      canvas.height = canvasHeight;

      // Clear canvas
      ctx.clearRect(0, 0, config.width, canvasHeight);

      // Render based on style
      switch (config.style) {
        case 'modern':
          renderModernStyle(ctx, config, easedProgress, barY);
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
          renderGradientStyle(ctx, config, easedProgress, barY);
          break;
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

// Helper: Draw rounded rectangle
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
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

// Helper: Get chapter at progress
function getChapterAtProgress(chapters: Chapter[], progress: number): { chapter: Chapter; index: number } | null {
  let accumulated = 0;
  for (let i = 0; i < chapters.length; i++) {
    accumulated += chapters[i].duration / 100;
    if (progress <= accumulated) {
      return { chapter: chapters[i], index: i };
    }
  }
  return chapters.length > 0 ? { chapter: chapters[chapters.length - 1], index: chapters.length - 1 } : null;
}

// Helper: Format time
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Helper: Get font weight
function getFontWeight(weight: string): string {
  switch (weight) {
    case 'bold': return '700';
    case 'medium': return '500';
    default: return '400';
  }
}

// Modern Style
function renderModernStyle(
  ctx: CanvasRenderingContext2D,
  config: ProgressBarConfig,
  progress: number,
  barY: number
) {
  const { width, height, chapters, borderRadius, backgroundColor, showChapterDividers, showChapterNames, chapterNamePosition } = config;
  
  // Background
  ctx.fillStyle = backgroundColor;
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.fill();

  // Draw chapters
  let xOffset = 0;
  const currentChapter = getChapterAtProgress(chapters, progress);

  chapters.forEach((chapter, index) => {
    const chapterWidth = (chapter.duration / 100) * width;
    const chapterEnd = (xOffset + chapterWidth) / width;
    const chapterStart = xOffset / width;
    
    // Calculate fill for this chapter
    let fillWidth = 0;
    if (progress >= chapterEnd) {
      fillWidth = chapterWidth;
    } else if (progress > chapterStart) {
      fillWidth = (progress - chapterStart) * width;
    }

    // Draw chapter background (slightly lighter)
    ctx.save();
    roundRect(ctx, 0, barY, width, height, borderRadius);
    ctx.clip();
    
    ctx.fillStyle = hexToRgba(chapter.color || config.progressColor, 0.15);
    ctx.fillRect(xOffset, barY, chapterWidth, height);

    // Draw filled progress
    if (fillWidth > 0) {
      const gradient = ctx.createLinearGradient(xOffset, 0, xOffset + fillWidth, 0);
      gradient.addColorStop(0, chapter.color || config.progressColor);
      gradient.addColorStop(1, lightenColor(chapter.color || config.progressColor, 20));
      
      if (config.glowEffect) {
        ctx.shadowColor = chapter.color || config.progressColor;
        ctx.shadowBlur = config.glowIntensity;
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(xOffset, barY, fillWidth, height);
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    // Draw chapter divider
    if (showChapterDividers && index < chapters.length - 1) {
      ctx.fillStyle = hexToRgba('#ffffff', 0.3);
      ctx.fillRect(xOffset + chapterWidth - 1, barY + 4, 2, height - 8);
    }

    // Draw chapter name
    if (showChapterNames) {
      const isActive = currentChapter?.index === index;
      const centerX = xOffset + chapterWidth / 2;
      
      ctx.font = `${getFontWeight(isActive ? 'bold' : config.fontWeight)} ${config.fontSize}px Inter, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (chapterNamePosition === 'above') {
        ctx.fillStyle = isActive ? config.textColor : hexToRgba(config.textColor, 0.6);
        ctx.fillText(chapter.name, centerX, 12);
      } else if (chapterNamePosition === 'inside') {
        ctx.fillStyle = isActive ? '#ffffff' : hexToRgba('#ffffff', 0.7);
        ctx.fillText(chapter.name, centerX, barY + height / 2);
      } else {
        ctx.fillStyle = isActive ? config.textColor : hexToRgba(config.textColor, 0.6);
        ctx.fillText(chapter.name, centerX, barY + height + 18);
      }
    }

    xOffset += chapterWidth;
  });

  // Draw time code
  if (config.showTimeCode) {
    const currentTime = progress * config.totalDuration;
    const timeText = `${formatTime(currentTime)} / ${formatTime(config.totalDuration)}`;
    
    ctx.font = `500 ${config.fontSize - 2}px Inter, monospace`;
    ctx.fillStyle = hexToRgba(config.textColor, 0.8);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(timeText, width - 10, barY + height / 2);
  }

  // Draw progress indicator
  const progressX = progress * width;
  if (progressX > 0 && progressX < width) {
    ctx.beginPath();
    ctx.arc(progressX, barY + height / 2, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = currentChapter?.chapter.color || config.progressColor;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

// Minimal Style
function renderMinimalStyle(
  ctx: CanvasRenderingContext2D,
  config: ProgressBarConfig,
  progress: number,
  barY: number
) {
  const { width, height, chapters, borderRadius, backgroundColor, showChapterNames, chapterNamePosition } = config;
  
  const barHeight = height * 0.4;
  const barYOffset = barY + (height - barHeight) / 2;

  // Background
  ctx.fillStyle = backgroundColor;
  roundRect(ctx, 0, barYOffset, width, barHeight, borderRadius / 2);
  ctx.fill();

  // Draw chapters
  let xOffset = 0;
  const currentChapter = getChapterAtProgress(chapters, progress);

  ctx.save();
  roundRect(ctx, 0, barYOffset, width, barHeight, borderRadius / 2);
  ctx.clip();

  chapters.forEach((chapter, index) => {
    const chapterWidth = (chapter.duration / 100) * width;
    const chapterEnd = (xOffset + chapterWidth) / width;
    const chapterStart = xOffset / width;
    
    let fillWidth = 0;
    if (progress >= chapterEnd) {
      fillWidth = chapterWidth;
    } else if (progress > chapterStart) {
      fillWidth = (progress - chapterStart) * width;
    }

    if (fillWidth > 0) {
      ctx.fillStyle = chapter.color || config.progressColor;
      ctx.fillRect(xOffset, barYOffset, fillWidth, barHeight);
    }

    // Draw chapter name
    if (showChapterNames) {
      const isActive = currentChapter?.index === index;
      const centerX = xOffset + chapterWidth / 2;
      
      ctx.font = `${getFontWeight(config.fontWeight)} ${config.fontSize}px Inter, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      
      if (chapterNamePosition === 'above') {
        ctx.fillStyle = isActive ? config.textColor : hexToRgba(config.textColor, 0.5);
        ctx.fillText(chapter.name, centerX, barY + 8);
      } else if (chapterNamePosition === 'below') {
        ctx.fillStyle = isActive ? config.textColor : hexToRgba(config.textColor, 0.5);
        ctx.fillText(chapter.name, centerX, barY + height - 5);
      }
    }

    // Divider dot
    if (index < chapters.length - 1) {
      ctx.beginPath();
      ctx.arc(xOffset + chapterWidth, barYOffset + barHeight / 2, 3, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(config.textColor, 0.3);
      ctx.fill();
    }

    xOffset += chapterWidth;
  });

  ctx.restore();
}

// Neon Style
function renderNeonStyle(
  ctx: CanvasRenderingContext2D,
  config: ProgressBarConfig,
  progress: number,
  barY: number
) {
  const { width, height, chapters, borderRadius, showChapterNames, chapterNamePosition } = config;
  
  // Dark background with border
  ctx.fillStyle = '#0a0a0f';
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.fill();
  
  ctx.strokeStyle = hexToRgba('#ffffff', 0.1);
  ctx.lineWidth = 1;
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.stroke();

  let xOffset = 0;
  const currentChapter = getChapterAtProgress(chapters, progress);

  ctx.save();
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.clip();

  chapters.forEach((chapter, index) => {
    const chapterWidth = (chapter.duration / 100) * width;
    const chapterEnd = (xOffset + chapterWidth) / width;
    const chapterStart = xOffset / width;
    
    let fillWidth = 0;
    if (progress >= chapterEnd) {
      fillWidth = chapterWidth;
    } else if (progress > chapterStart) {
      fillWidth = (progress - chapterStart) * width;
    }

    const color = chapter.color || config.progressColor;

    // Glow background
    ctx.fillStyle = hexToRgba(color, 0.1);
    ctx.fillRect(xOffset, barY, chapterWidth, height);

    if (fillWidth > 0) {
      // Multiple glow layers
      ctx.shadowColor = color;
      ctx.shadowBlur = 30;
      ctx.fillStyle = hexToRgba(color, 0.8);
      ctx.fillRect(xOffset, barY, fillWidth, height);
      
      ctx.shadowBlur = 15;
      ctx.fillStyle = color;
      ctx.fillRect(xOffset, barY + height * 0.3, fillWidth, height * 0.4);
      
      ctx.shadowBlur = 0;
    }

    // Draw chapter name with glow
    if (showChapterNames) {
      const isActive = currentChapter?.index === index;
      const centerX = xOffset + chapterWidth / 2;
      
      ctx.font = `${getFontWeight(isActive ? 'bold' : config.fontWeight)} ${config.fontSize}px Inter, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      
      if (isActive) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
      }
      
      if (chapterNamePosition === 'above') {
        ctx.fillStyle = isActive ? color : hexToRgba(config.textColor, 0.5);
        ctx.fillText(chapter.name, centerX, 12);
      } else if (chapterNamePosition === 'inside') {
        ctx.fillStyle = isActive ? '#ffffff' : hexToRgba('#ffffff', 0.5);
        ctx.fillText(chapter.name, centerX, barY + height / 2);
      }
      
      ctx.shadowBlur = 0;
    }

    // Neon divider
    if (index < chapters.length - 1) {
      ctx.fillStyle = hexToRgba('#ffffff', 0.2);
      ctx.fillRect(xOffset + chapterWidth - 1, barY + 8, 2, height - 16);
    }

    xOffset += chapterWidth;
  });

  ctx.restore();
  
  // Scan line effect
  const scanY = barY + (progress * height * 3) % height;
  ctx.fillStyle = hexToRgba('#ffffff', 0.03);
  ctx.fillRect(0, scanY, width, 2);
}

// Glass Style
function renderGlassStyle(
  ctx: CanvasRenderingContext2D,
  config: ProgressBarConfig,
  progress: number,
  barY: number
) {
  const { width, height, chapters, borderRadius, showChapterNames, chapterNamePosition } = config;
  
  // Glass background
  const glassGradient = ctx.createLinearGradient(0, barY, 0, barY + height);
  glassGradient.addColorStop(0, hexToRgba('#ffffff', 0.15));
  glassGradient.addColorStop(0.5, hexToRgba('#ffffff', 0.05));
  glassGradient.addColorStop(1, hexToRgba('#ffffff', 0.1));
  
  ctx.fillStyle = glassGradient;
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.fill();
  
  // Border
  ctx.strokeStyle = hexToRgba('#ffffff', 0.2);
  ctx.lineWidth = 1;
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.stroke();

  let xOffset = 0;
  const currentChapter = getChapterAtProgress(chapters, progress);

  ctx.save();
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.clip();

  chapters.forEach((chapter, index) => {
    const chapterWidth = (chapter.duration / 100) * width;
    const chapterEnd = (xOffset + chapterWidth) / width;
    const chapterStart = xOffset / width;
    
    let fillWidth = 0;
    if (progress >= chapterEnd) {
      fillWidth = chapterWidth;
    } else if (progress > chapterStart) {
      fillWidth = (progress - chapterStart) * width;
    }

    const color = chapter.color || config.progressColor;

    if (fillWidth > 0) {
      const fillGradient = ctx.createLinearGradient(0, barY, 0, barY + height);
      fillGradient.addColorStop(0, hexToRgba(color, 0.9));
      fillGradient.addColorStop(0.5, hexToRgba(color, 0.7));
      fillGradient.addColorStop(1, hexToRgba(color, 0.8));
      
      ctx.fillStyle = fillGradient;
      ctx.fillRect(xOffset, barY, fillWidth, height);
      
      // Highlight
      ctx.fillStyle = hexToRgba('#ffffff', 0.3);
      ctx.fillRect(xOffset, barY, fillWidth, height * 0.3);
    }

    // Chapter name
    if (showChapterNames) {
      const isActive = currentChapter?.index === index;
      const centerX = xOffset + chapterWidth / 2;
      
      ctx.font = `${getFontWeight(config.fontWeight)} ${config.fontSize}px Inter, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      
      if (chapterNamePosition === 'above') {
        ctx.fillStyle = isActive ? config.textColor : hexToRgba(config.textColor, 0.6);
        ctx.fillText(chapter.name, centerX, 12);
      } else if (chapterNamePosition === 'inside') {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText(chapter.name, centerX, barY + height / 2);
        ctx.shadowBlur = 0;
      }
    }

    // Glass divider
    if (index < chapters.length - 1) {
      ctx.fillStyle = hexToRgba('#ffffff', 0.3);
      ctx.fillRect(xOffset + chapterWidth - 1, barY + 4, 1, height - 8);
    }

    xOffset += chapterWidth;
  });

  ctx.restore();
}

// Gradient Style
function renderGradientStyle(
  ctx: CanvasRenderingContext2D,
  config: ProgressBarConfig,
  progress: number,
  barY: number
) {
  const { width, height, chapters, borderRadius, showChapterNames, chapterNamePosition } = config;
  
  // Background
  ctx.fillStyle = config.backgroundColor;
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.fill();

  let xOffset = 0;
  const currentChapter = getChapterAtProgress(chapters, progress);
  const progressX = progress * width;

  ctx.save();
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.clip();

  // Create full gradient across all chapters
  const fullGradient = ctx.createLinearGradient(0, 0, width, 0);
  let gradientOffset = 0;
  chapters.forEach((chapter) => {
    const color = chapter.color || config.progressColor;
    fullGradient.addColorStop(gradientOffset, color);
    gradientOffset += chapter.duration / 100;
    fullGradient.addColorStop(Math.min(gradientOffset, 1), color);
  });

  // Draw gradient progress
  if (progressX > 0) {
    if (config.glowEffect) {
      ctx.shadowColor = chapters[0]?.color || config.progressColor;
      ctx.shadowBlur = config.glowIntensity;
    }
    
    ctx.fillStyle = fullGradient;
    ctx.fillRect(0, barY, progressX, height);
    ctx.shadowBlur = 0;
  }

  // Chapter markers and names
  xOffset = 0;
  chapters.forEach((chapter, index) => {
    const chapterWidth = (chapter.duration / 100) * width;

    if (showChapterNames) {
      const isActive = currentChapter?.index === index;
      const centerX = xOffset + chapterWidth / 2;
      
      ctx.font = `${getFontWeight(isActive ? 'bold' : config.fontWeight)} ${config.fontSize}px Inter, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      
      if (chapterNamePosition === 'above') {
        ctx.fillStyle = isActive ? config.textColor : hexToRgba(config.textColor, 0.6);
        ctx.fillText(chapter.name, centerX, 12);
      } else if (chapterNamePosition === 'inside') {
        ctx.fillStyle = xOffset + chapterWidth / 2 < progressX ? '#ffffff' : hexToRgba('#ffffff', 0.5);
        ctx.fillText(chapter.name, centerX, barY + height / 2);
      }
    }

    // Diamond divider
    if (index < chapters.length - 1) {
      const divX = xOffset + chapterWidth;
      ctx.save();
      ctx.translate(divX, barY + height / 2);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = hexToRgba('#ffffff', 0.4);
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    }

    xOffset += chapterWidth;
  });

  ctx.restore();

  // Progress head
  if (progressX > 0 && progressX < width) {
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

// Utility functions
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

export default ProgressBarCanvas;
