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

// Helper: Get chapter duration
function getChapterDuration(chapters: Chapter[], index: number, totalDuration: number): number {
  return getChapterEndTime(chapters, index, totalDuration) - chapters[index].startTime;
}

// Helper: Get chapter width as percentage
function getChapterWidthPercent(chapters: Chapter[], index: number, totalDuration: number): number {
  return getChapterDuration(chapters, index, totalDuration) / totalDuration;
}

// Helper: Get chapter start as percentage
function getChapterStartPercent(chapters: Chapter[], index: number, totalDuration: number): number {
  return chapters[index].startTime / totalDuration;
}

export const ProgressBarCanvas = forwardRef<ProgressBarCanvasRef, ProgressBarCanvasProps>(
  ({ config, progress }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Calculate canvas height based on chapter name position and mascot
    const getCanvasHeight = () => {
      let height = config.height;
      
      // Add space for chapter names
      if (config.showChapterNames && config.chapterNamePosition !== 'inside') {
        height += 35;
      }
      
      // Add space for mascot above or below bar
      if (config.mascot.type !== 'none') {
        const mascotSpace = config.mascot.size + 10;
        if (config.mascot.position === 'above-bar') {
          height += mascotSpace;
        } else if (config.mascot.position === 'below-bar') {
          height += mascotSpace;
        }
        // on-bar: mascot stays on the bar, no extra height needed
      }
      
      return height;
    };

    const getBarY = () => {
      let y = 0;
      
      // Offset for chapter names above
      if (config.showChapterNames && config.chapterNamePosition === 'above') {
        y += 35;
      }
      
      // Offset for mascot above
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

      // Set canvas size
      canvas.width = config.width;
      canvas.height = canvasHeight;

      // Clear canvas
      ctx.clearRect(0, 0, config.width, canvasHeight);

      // Render progress bar style
      // Pass mascot info so it can replace the progress indicator
      const hasMascotOnBar = config.mascot.type !== 'none' && config.mascot.position === 'on-bar';
      
      switch (config.style) {
        case 'modern':
          renderModernStyle(ctx, config, easedProgress, barY, hasMascotOnBar);
          break;
        case 'minimal':
          renderMinimalStyle(ctx, config, easedProgress, barY, hasMascotOnBar);
          break;
        case 'neon':
          renderNeonStyle(ctx, config, easedProgress, barY, hasMascotOnBar);
          break;
        case 'glass':
          renderGlassStyle(ctx, config, easedProgress, barY, hasMascotOnBar);
          break;
        case 'gradient':
          renderGradientStyle(ctx, config, easedProgress, barY, hasMascotOnBar);
          break;
      }
      
      // Render mascot last (on top of progress bar, below chapter names which are drawn by style)
      if (config.mascot.type !== 'none') {
        renderMascot(ctx, config, easedProgress, barY, currentProgress);
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
function getChapterAtProgress(chapters: Chapter[], progress: number, totalDuration: number): { chapter: Chapter; index: number } | null {
  const currentTime = progress * totalDuration;
  for (let i = chapters.length - 1; i >= 0; i--) {
    if (currentTime >= chapters[i].startTime) {
      return { chapter: chapters[i], index: i };
    }
  }
  return chapters.length > 0 ? { chapter: chapters[0], index: 0 } : null;
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

// Helper: Truncate text to fit width
function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  const metrics = ctx.measureText(text);
  if (metrics.width <= maxWidth) return text;
  
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + '…').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '…';
}

// Modern Style
function renderModernStyle(
  ctx: CanvasRenderingContext2D,
  config: ProgressBarConfig,
  progress: number,
  barY: number,
  hideDot: boolean = false
) {
  const { width, height, chapters, borderRadius, backgroundColor, showChapterDividers, showChapterNames, chapterNamePosition, totalDuration } = config;
  
  // Background
  ctx.fillStyle = backgroundColor;
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.fill();

  const currentChapter = getChapterAtProgress(chapters, progress, totalDuration);

  chapters.forEach((chapter, index) => {
    const chapterStartPercent = getChapterStartPercent(chapters, index, totalDuration);
    const chapterWidthPercent = getChapterWidthPercent(chapters, index, totalDuration);
    const chapterX = chapterStartPercent * width;
    const chapterW = chapterWidthPercent * width;
    const chapterEndPercent = chapterStartPercent + chapterWidthPercent;
    
    // Calculate fill for this chapter
    let fillWidth = 0;
    if (progress >= chapterEndPercent) {
      fillWidth = chapterW;
    } else if (progress > chapterStartPercent) {
      fillWidth = (progress - chapterStartPercent) * width;
    }

    // Draw chapter section
    ctx.save();
    roundRect(ctx, 0, barY, width, height, borderRadius);
    ctx.clip();
    
    // Chapter background
    ctx.fillStyle = hexToRgba(chapter.color || config.progressColor, 0.1);
    ctx.fillRect(chapterX, barY, chapterW, height);

    // Draw filled progress
    if (fillWidth > 0) {
      const gradient = ctx.createLinearGradient(chapterX, 0, chapterX + fillWidth, 0);
      gradient.addColorStop(0, chapter.color || config.progressColor);
      gradient.addColorStop(1, lightenColor(chapter.color || config.progressColor, 15));
      
      if (config.glowEffect) {
        ctx.shadowColor = chapter.color || config.progressColor;
        ctx.shadowBlur = config.glowIntensity;
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(chapterX, barY, fillWidth, height);
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    // Draw chapter divider
    if (showChapterDividers && index < chapters.length - 1) {
      ctx.fillStyle = hexToRgba('#ffffff', 0.4);
      ctx.fillRect(chapterX + chapterW - 1, barY + 6, 2, height - 12);
    }

    // Draw chapter name
    if (showChapterNames) {
      const isActive = currentChapter?.index === index;
      const centerX = chapterX + chapterW / 2;
      const maxTextWidth = chapterW - 20;
      
      ctx.font = `${getFontWeight(isActive ? 'bold' : config.fontWeight)} ${config.fontSize}px Inter, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const displayText = truncateText(ctx, chapter.name, maxTextWidth);
      
      if (chapterNamePosition === 'above') {
        ctx.fillStyle = isActive ? config.textColor : hexToRgba(config.textColor, 0.6);
        ctx.fillText(displayText, centerX, 14);
        
        if (isActive) {
          ctx.beginPath();
          ctx.moveTo(centerX - 6, 26);
          ctx.lineTo(centerX + 6, 26);
          ctx.lineTo(centerX, barY);
          ctx.closePath();
          ctx.fillStyle = chapter.color || config.progressColor;
          ctx.fill();
        }
      } else if (chapterNamePosition === 'inside') {
        const textMetrics = ctx.measureText(displayText);
        const textWidth = textMetrics.width + 16;
        const textHeight = config.fontSize + 8;
        const textX = centerX - textWidth / 2;
        const textY = barY + (height - textHeight) / 2;
        
        const isFilled = fillWidth >= chapterW / 2;
        ctx.fillStyle = isFilled 
          ? hexToRgba('#000000', 0.3)
          : hexToRgba(chapter.color || config.progressColor, 0.15);
        roundRect(ctx, textX, textY, textWidth, textHeight, textHeight / 2);
        ctx.fill();
        
        ctx.fillStyle = isFilled ? '#ffffff' : hexToRgba(config.textColor, 0.9);
        if (isActive) {
          ctx.shadowColor = isFilled ? 'rgba(0,0,0,0.5)' : chapter.color || config.progressColor;
          ctx.shadowBlur = 4;
        }
        ctx.fillText(displayText, centerX, barY + height / 2);
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = isActive ? config.textColor : hexToRgba(config.textColor, 0.6);
        ctx.fillText(displayText, centerX, barY + height + 20);
      }
    }
  });

  // Draw time code
  if (config.showTimeCode && chapterNamePosition !== 'inside') {
    const currentTime = progress * totalDuration;
    const timeText = `${formatTime(currentTime)} / ${formatTime(totalDuration)}`;
    
    ctx.font = `500 ${config.fontSize - 2}px Inter, monospace`;
    ctx.fillStyle = hexToRgba(config.textColor, 0.7);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(timeText, width - 12, barY + height / 2);
  }

  // Draw progress indicator (skip if mascot replaces it)
  if (!hideDot) {
    const progressX = progress * width;
    if (progressX > 0 && progressX < width) {
      if (config.glowEffect) {
        ctx.beginPath();
        ctx.arc(progressX, barY + height / 2, 10, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(currentChapter?.chapter.color || config.progressColor, 0.3);
        ctx.fill();
      }
      
      ctx.beginPath();
      ctx.arc(progressX, barY + height / 2, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(progressX, barY + height / 2, 4, 0, Math.PI * 2);
      ctx.fillStyle = currentChapter?.chapter.color || config.progressColor;
      ctx.fill();
    }
  }
}

// Minimal Style
function renderMinimalStyle(
  ctx: CanvasRenderingContext2D,
  config: ProgressBarConfig,
  progress: number,
  barY: number,
  _hideDot: boolean = false
) {
  const { width, height, chapters, borderRadius, backgroundColor, showChapterNames, chapterNamePosition, totalDuration } = config;
  
  const barHeight = chapterNamePosition === 'inside' ? height : height * 0.5;
  const barYOffset = chapterNamePosition === 'inside' ? barY : barY + (height - barHeight) / 2;

  ctx.fillStyle = backgroundColor;
  roundRect(ctx, 0, barYOffset, width, barHeight, borderRadius / 2);
  ctx.fill();

  const currentChapter = getChapterAtProgress(chapters, progress, totalDuration);

  ctx.save();
  roundRect(ctx, 0, barYOffset, width, barHeight, borderRadius / 2);
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

  // Chapter names and dividers
  if (showChapterNames) {
    chapters.forEach((chapter, index) => {
      const chapterStartPercent = getChapterStartPercent(chapters, index, totalDuration);
      const chapterWidthPercent = getChapterWidthPercent(chapters, index, totalDuration);
      const chapterX = chapterStartPercent * width;
      const chapterW = chapterWidthPercent * width;
      const chapterEndPercent = chapterStartPercent + chapterWidthPercent;
      
      const isActive = currentChapter?.index === index;
      const centerX = chapterX + chapterW / 2;
      const maxTextWidth = chapterW - 16;
      
      ctx.font = `${getFontWeight(isActive ? 'bold' : config.fontWeight)} ${config.fontSize}px Inter, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const displayText = truncateText(ctx, chapter.name, maxTextWidth);
      
      if (chapterNamePosition === 'above') {
        ctx.fillStyle = isActive ? chapter.color || config.textColor : hexToRgba(config.textColor, 0.5);
        ctx.fillText(displayText, centerX, barY + 10);
      } else if (chapterNamePosition === 'inside') {
        const isFilled = progress >= chapterEndPercent;
        ctx.fillStyle = isFilled ? '#ffffff' : hexToRgba(config.textColor, 0.7);
        ctx.fillText(displayText, centerX, barYOffset + barHeight / 2);
      } else {
        ctx.fillStyle = isActive ? chapter.color || config.textColor : hexToRgba(config.textColor, 0.5);
        ctx.fillText(displayText, centerX, barY + height - 5);
      }

      if (index < chapters.length - 1) {
        ctx.beginPath();
        ctx.arc(chapterX + chapterW, barYOffset + barHeight / 2, 3, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(config.textColor, 0.3);
        ctx.fill();
      }
    });
  }
}

// Neon Style
function renderNeonStyle(
  ctx: CanvasRenderingContext2D,
  config: ProgressBarConfig,
  progress: number,
  barY: number,
  _hideDot: boolean = false
) {
  const { width, height, chapters, borderRadius, showChapterNames, chapterNamePosition, totalDuration } = config;
  
  ctx.fillStyle = '#0a0a12';
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.fill();
  
  ctx.strokeStyle = hexToRgba('#ffffff', 0.1);
  ctx.lineWidth = 1;
  roundRect(ctx, 0, barY, width, height, borderRadius);
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

    ctx.fillStyle = hexToRgba(color, 0.05);
    ctx.fillRect(chapterX, barY, chapterW, height);

    if (fillWidth > 0) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 25;
      ctx.fillStyle = hexToRgba(color, 0.6);
      ctx.fillRect(chapterX, barY, fillWidth, height);
      
      ctx.shadowBlur = 12;
      ctx.fillStyle = color;
      ctx.fillRect(chapterX, barY + height * 0.25, fillWidth, height * 0.5);
      
      ctx.shadowBlur = 8;
      ctx.fillStyle = lightenColor(color, 30);
      ctx.fillRect(chapterX, barY + height * 0.4, fillWidth, height * 0.2);
      
      ctx.shadowBlur = 0;
    }

    if (showChapterNames) {
      const isActive = currentChapter?.index === index;
      const centerX = chapterX + chapterW / 2;
      const maxTextWidth = chapterW - 16;
      
      ctx.font = `${getFontWeight(isActive ? 'bold' : config.fontWeight)} ${config.fontSize}px Inter, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const displayText = truncateText(ctx, chapter.name, maxTextWidth);
      
      if (isActive) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
      }
      
      if (chapterNamePosition === 'above') {
        ctx.fillStyle = isActive ? color : hexToRgba(config.textColor, 0.4);
        ctx.fillText(displayText, centerX, 14);
      } else if (chapterNamePosition === 'inside') {
        ctx.fillStyle = isActive ? '#ffffff' : hexToRgba('#ffffff', 0.5);
        ctx.fillText(displayText, centerX, barY + height / 2);
      } else {
        ctx.fillStyle = isActive ? color : hexToRgba(config.textColor, 0.4);
        ctx.fillText(displayText, centerX, barY + height + 20);
      }
      
      ctx.shadowBlur = 0;
    }

    if (index < chapters.length - 1) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 5;
      ctx.fillStyle = hexToRgba('#ffffff', 0.3);
      ctx.fillRect(chapterX + chapterW - 1, barY + 10, 2, height - 20);
      ctx.shadowBlur = 0;
    }
  });

  ctx.restore();
}

// Glass Style
function renderGlassStyle(
  ctx: CanvasRenderingContext2D,
  config: ProgressBarConfig,
  progress: number,
  barY: number,
  _hideDot: boolean = false
) {
  const { width, height, chapters, borderRadius, showChapterNames, chapterNamePosition, totalDuration } = config;
  
  const glassGradient = ctx.createLinearGradient(0, barY, 0, barY + height);
  glassGradient.addColorStop(0, hexToRgba('#ffffff', 0.18));
  glassGradient.addColorStop(0.4, hexToRgba('#ffffff', 0.08));
  glassGradient.addColorStop(0.6, hexToRgba('#ffffff', 0.05));
  glassGradient.addColorStop(1, hexToRgba('#ffffff', 0.12));
  
  ctx.fillStyle = glassGradient;
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.fill();
  
  ctx.strokeStyle = hexToRgba('#ffffff', 0.25);
  ctx.lineWidth = 1;
  roundRect(ctx, 0, barY, width, height, borderRadius);
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
      const fillGradient = ctx.createLinearGradient(0, barY, 0, barY + height);
      fillGradient.addColorStop(0, hexToRgba(color, 0.95));
      fillGradient.addColorStop(0.3, hexToRgba(color, 0.8));
      fillGradient.addColorStop(0.7, hexToRgba(color, 0.75));
      fillGradient.addColorStop(1, hexToRgba(color, 0.85));
      
      ctx.fillStyle = fillGradient;
      ctx.fillRect(chapterX, barY, fillWidth, height);
      
      ctx.fillStyle = hexToRgba('#ffffff', 0.35);
      ctx.fillRect(chapterX, barY, fillWidth, height * 0.35);
    }

    if (showChapterNames) {
      const isActive = currentChapter?.index === index;
      const centerX = chapterX + chapterW / 2;
      const maxTextWidth = chapterW - 16;
      
      ctx.font = `${getFontWeight(isActive ? 'bold' : config.fontWeight)} ${config.fontSize}px Inter, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const displayText = truncateText(ctx, chapter.name, maxTextWidth);
      
      if (chapterNamePosition === 'above') {
        ctx.fillStyle = isActive ? config.textColor : hexToRgba(config.textColor, 0.6);
        ctx.fillText(displayText, centerX, 14);
      } else if (chapterNamePosition === 'inside') {
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetY = 1;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(displayText, centerX, barY + height / 2);
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
      } else {
        ctx.fillStyle = isActive ? config.textColor : hexToRgba(config.textColor, 0.6);
        ctx.fillText(displayText, centerX, barY + height + 20);
      }
    }

    if (index < chapters.length - 1) {
      const divX = chapterX + chapterW;
      ctx.fillStyle = hexToRgba('#ffffff', 0.35);
      ctx.fillRect(divX - 1, barY + 6, 1, height - 12);
      ctx.fillStyle = hexToRgba('#000000', 0.15);
      ctx.fillRect(divX, barY + 6, 1, height - 12);
    }
  });

  ctx.restore();
}

// Gradient Style
function renderGradientStyle(
  ctx: CanvasRenderingContext2D,
  config: ProgressBarConfig,
  progress: number,
  barY: number,
  hideDot: boolean = false
) {
  const { width, height, chapters, borderRadius, backgroundColor, showChapterNames, chapterNamePosition, totalDuration } = config;
  
  ctx.fillStyle = backgroundColor;
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.fill();

  const currentChapter = getChapterAtProgress(chapters, progress, totalDuration);
  const progressX = progress * width;

  ctx.save();
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.clip();

  if (progressX > 0) {
    const fullGradient = ctx.createLinearGradient(0, 0, width, 0);
    
    chapters.forEach((chapter, index) => {
      const chapterStartPercent = getChapterStartPercent(chapters, index, totalDuration);
      const chapterEndPercent = chapterStartPercent + getChapterWidthPercent(chapters, index, totalDuration);
      const color = chapter.color || config.progressColor;
      
      fullGradient.addColorStop(chapterStartPercent, color);
      fullGradient.addColorStop(Math.min(chapterEndPercent, 0.999), color);
    });

    if (config.glowEffect) {
      ctx.shadowColor = chapters[0]?.color || config.progressColor;
      ctx.shadowBlur = config.glowIntensity;
    }
    
    ctx.fillStyle = fullGradient;
    ctx.fillRect(0, barY, progressX, height);
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = hexToRgba('#ffffff', 0.2);
    ctx.fillRect(0, barY, progressX, height * 0.4);
  }

  // Chapter names and dividers
  chapters.forEach((chapter, index) => {
    const chapterStartPercent = getChapterStartPercent(chapters, index, totalDuration);
    const chapterWidthPercent = getChapterWidthPercent(chapters, index, totalDuration);
    const chapterX = chapterStartPercent * width;
    const chapterW = chapterWidthPercent * width;

    if (showChapterNames) {
      const isActive = currentChapter?.index === index;
      const centerX = chapterX + chapterW / 2;
      const maxTextWidth = chapterW - 20;
      
      ctx.font = `${getFontWeight(isActive ? 'bold' : config.fontWeight)} ${config.fontSize}px Inter, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const displayText = truncateText(ctx, chapter.name, maxTextWidth);
      
      if (chapterNamePosition === 'above') {
        ctx.fillStyle = isActive ? config.textColor : hexToRgba(config.textColor, 0.6);
        ctx.fillText(displayText, centerX, 14);
      } else if (chapterNamePosition === 'inside') {
        const isFilled = centerX < progressX;
        ctx.fillStyle = isFilled ? '#ffffff' : hexToRgba(config.textColor, 0.6);
        if (isFilled) {
          ctx.shadowColor = 'rgba(0,0,0,0.3)';
          ctx.shadowBlur = 2;
        }
        ctx.fillText(displayText, centerX, barY + height / 2);
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = isActive ? config.textColor : hexToRgba(config.textColor, 0.6);
        ctx.fillText(displayText, centerX, barY + height + 20);
      }
    }

    if (index < chapters.length - 1) {
      const divX = chapterX + chapterW;
      ctx.save();
      ctx.translate(divX, barY + height / 2);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = hexToRgba('#ffffff', 0.5);
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    }
  });

  ctx.restore();

  // Draw progress indicator (skip if mascot replaces it)
  if (!hideDot && progressX > 0 && progressX < width) {
    const headColor = currentChapter?.chapter.color || config.progressColor;
    
    if (config.glowEffect) {
      ctx.beginPath();
      ctx.arc(progressX, barY + height / 2, 12, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(headColor, 0.3);
      ctx.fill();
    }
    
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

// Render mascot
function renderMascot(
  ctx: CanvasRenderingContext2D,
  config: ProgressBarConfig,
  progress: number,
  barY: number,
  rawProgress: number
) {
  const { width, height, mascot, showChapterNames, chapterNamePosition } = config;
  
  // Get emoji
  let emoji = '';
  if (mascot.type === 'custom') {
    emoji = mascot.customEmoji;
  } else {
    const mascotOption = MASCOT_OPTIONS.find(m => m.type === mascot.type);
    emoji = mascotOption?.emoji || '🐱';
  }
  
  // Calculate position
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
      // If chapter names are inside the bar, position mascot at bottom edge of bar
      if (showChapterNames && chapterNamePosition === 'inside') {
        mascotY = barY + height - mascot.size / 3;
      } else {
        mascotY = barY + height / 2;
      }
      break;
  }
  
  // Bounce effect
  let bounceOffset = 0;
  if (mascot.bounce) {
    bounceOffset = Math.sin(rawProgress * Math.PI * 20) * 5;
  }
  
  // Draw trail
  if (mascot.trail && progress > 0.05) {
    const trailCount = 5;
    for (let i = trailCount; i > 0; i--) {
      const trailProgress = Math.max(0, progress - i * 0.02);
      const trailX = trailProgress * width;
      const trailAlpha = (1 - i / trailCount) * 0.3;
      const trailSize = mascot.size * (1 - i / trailCount * 0.3);
      
      ctx.save();
      ctx.globalAlpha = trailAlpha;
      ctx.font = `${trailSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, trailX, mascotY);
      ctx.restore();
    }
  }
  
  // Draw mascot shadow
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.font = `${mascot.size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, progressX + 2, mascotY + bounceOffset + 2);
  ctx.restore();
  
  // Draw mascot
  ctx.save();
  ctx.font = `${mascot.size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, progressX, mascotY + bounceOffset);
  ctx.restore();
}

export default ProgressBarCanvas;
