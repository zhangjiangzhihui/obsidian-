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
      return config.height + 35; // Extra space for labels
    };

    const getBarY = () => {
      if (!config.showChapterNames) return 0;
      if (config.chapterNamePosition === 'above') return 35;
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

// Modern Style - Text on bar
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

    // Draw chapter section background
    ctx.save();
    roundRect(ctx, 0, barY, width, height, borderRadius);
    ctx.clip();
    
    // Chapter background with subtle color
    ctx.fillStyle = hexToRgba(chapter.color || config.progressColor, 0.1);
    ctx.fillRect(xOffset, barY, chapterWidth, height);

    // Draw filled progress
    if (fillWidth > 0) {
      const gradient = ctx.createLinearGradient(xOffset, 0, xOffset + fillWidth, 0);
      gradient.addColorStop(0, chapter.color || config.progressColor);
      gradient.addColorStop(1, lightenColor(chapter.color || config.progressColor, 15));
      
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
      ctx.fillStyle = hexToRgba('#ffffff', 0.4);
      ctx.fillRect(xOffset + chapterWidth - 1, barY + 6, 2, height - 12);
    }

    // Draw chapter name ON the bar
    if (showChapterNames) {
      const isActive = currentChapter?.index === index;
      const centerX = xOffset + chapterWidth / 2;
      const maxTextWidth = chapterWidth - 20;
      
      ctx.font = `${getFontWeight(isActive ? 'bold' : config.fontWeight)} ${config.fontSize}px Inter, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const displayText = truncateText(ctx, chapter.name, maxTextWidth);
      
      if (chapterNamePosition === 'above') {
        // Text above bar
        ctx.fillStyle = isActive ? config.textColor : hexToRgba(config.textColor, 0.6);
        ctx.fillText(displayText, centerX, 14);
        
        // Small indicator triangle
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
        // Text inside bar - with background for readability
        const textMetrics = ctx.measureText(displayText);
        const textWidth = textMetrics.width + 16;
        const textHeight = config.fontSize + 8;
        const textX = centerX - textWidth / 2;
        const textY = barY + (height - textHeight) / 2;
        
        // Text background pill
        const isFilled = fillWidth >= chapterWidth / 2;
        ctx.fillStyle = isFilled 
          ? hexToRgba('#000000', 0.3)
          : hexToRgba(chapter.color || config.progressColor, 0.15);
        roundRect(ctx, textX, textY, textWidth, textHeight, textHeight / 2);
        ctx.fill();
        
        // Text
        ctx.fillStyle = isFilled ? '#ffffff' : hexToRgba(config.textColor, 0.9);
        if (isActive) {
          ctx.shadowColor = isFilled ? 'rgba(0,0,0,0.5)' : chapter.color || config.progressColor;
          ctx.shadowBlur = 4;
        }
        ctx.fillText(displayText, centerX, barY + height / 2);
        ctx.shadowBlur = 0;
      } else {
        // Text below bar
        ctx.fillStyle = isActive ? config.textColor : hexToRgba(config.textColor, 0.6);
        ctx.fillText(displayText, centerX, barY + height + 20);
      }
    }

    xOffset += chapterWidth;
  });

  // Draw time code on the right
  if (config.showTimeCode && chapterNamePosition !== 'inside') {
    const currentTime = progress * config.totalDuration;
    const timeText = `${formatTime(currentTime)} / ${formatTime(config.totalDuration)}`;
    
    ctx.font = `500 ${config.fontSize - 2}px Inter, monospace`;
    ctx.fillStyle = hexToRgba(config.textColor, 0.7);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(timeText, width - 12, barY + height / 2);
  }

  // Draw progress indicator dot
  const progressX = progress * width;
  if (progressX > 0 && progressX < width) {
    // Outer glow
    if (config.glowEffect) {
      ctx.beginPath();
      ctx.arc(progressX, barY + height / 2, 10, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(currentChapter?.chapter.color || config.progressColor, 0.3);
      ctx.fill();
    }
    
    // White dot
    ctx.beginPath();
    ctx.arc(progressX, barY + height / 2, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    
    // Colored center
    ctx.beginPath();
    ctx.arc(progressX, barY + height / 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = currentChapter?.chapter.color || config.progressColor;
    ctx.fill();
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
  
  const barHeight = chapterNamePosition === 'inside' ? height : height * 0.5;
  const barYOffset = chapterNamePosition === 'inside' ? barY : barY + (height - barHeight) / 2;

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

  chapters.forEach((chapter) => {
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

    xOffset += chapterWidth;
  });

  ctx.restore();

  // Draw chapter names
  if (showChapterNames) {
    xOffset = 0;
    chapters.forEach((chapter, index) => {
      const chapterWidth = (chapter.duration / 100) * width;
      const isActive = currentChapter?.index === index;
      const centerX = xOffset + chapterWidth / 2;
      const maxTextWidth = chapterWidth - 16;
      
      ctx.font = `${getFontWeight(isActive ? 'bold' : config.fontWeight)} ${config.fontSize}px Inter, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const displayText = truncateText(ctx, chapter.name, maxTextWidth);
      
      if (chapterNamePosition === 'above') {
        ctx.fillStyle = isActive ? chapter.color || config.textColor : hexToRgba(config.textColor, 0.5);
        ctx.fillText(displayText, centerX, barY + 10);
      } else if (chapterNamePosition === 'inside') {
        const chapterEnd = (xOffset + chapterWidth) / width;
        const isFilled = progress >= chapterEnd;
        ctx.fillStyle = isFilled ? '#ffffff' : hexToRgba(config.textColor, 0.7);
        ctx.fillText(displayText, centerX, barYOffset + barHeight / 2);
      } else {
        ctx.fillStyle = isActive ? chapter.color || config.textColor : hexToRgba(config.textColor, 0.5);
        ctx.fillText(displayText, centerX, barY + height - 5);
      }

      // Small dot divider
      if (index < chapters.length - 1) {
        ctx.beginPath();
        ctx.arc(xOffset + chapterWidth, barYOffset + barHeight / 2, 3, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(config.textColor, 0.3);
        ctx.fill();
      }

      xOffset += chapterWidth;
    });
  }
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
  ctx.fillStyle = '#0a0a12';
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.fill();
  
  // Animated border glow
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

    // Subtle glow background for each section
    ctx.fillStyle = hexToRgba(color, 0.05);
    ctx.fillRect(xOffset, barY, chapterWidth, height);

    if (fillWidth > 0) {
      // Multiple glow layers for neon effect
      ctx.shadowColor = color;
      ctx.shadowBlur = 25;
      ctx.fillStyle = hexToRgba(color, 0.6);
      ctx.fillRect(xOffset, barY, fillWidth, height);
      
      ctx.shadowBlur = 12;
      ctx.fillStyle = color;
      ctx.fillRect(xOffset, barY + height * 0.25, fillWidth, height * 0.5);
      
      // Bright center line
      ctx.shadowBlur = 8;
      ctx.fillStyle = lightenColor(color, 30);
      ctx.fillRect(xOffset, barY + height * 0.4, fillWidth, height * 0.2);
      
      ctx.shadowBlur = 0;
    }

    // Draw chapter name with neon glow
    if (showChapterNames) {
      const isActive = currentChapter?.index === index;
      const centerX = xOffset + chapterWidth / 2;
      const maxTextWidth = chapterWidth - 16;
      
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

    // Neon divider line
    if (index < chapters.length - 1) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 5;
      ctx.fillStyle = hexToRgba('#ffffff', 0.3);
      ctx.fillRect(xOffset + chapterWidth - 1, barY + 10, 2, height - 20);
      ctx.shadowBlur = 0;
    }

    xOffset += chapterWidth;
  });

  ctx.restore();
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
  glassGradient.addColorStop(0, hexToRgba('#ffffff', 0.18));
  glassGradient.addColorStop(0.4, hexToRgba('#ffffff', 0.08));
  glassGradient.addColorStop(0.6, hexToRgba('#ffffff', 0.05));
  glassGradient.addColorStop(1, hexToRgba('#ffffff', 0.12));
  
  ctx.fillStyle = glassGradient;
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.fill();
  
  // Glass border
  ctx.strokeStyle = hexToRgba('#ffffff', 0.25);
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
      // Glass-like fill gradient
      const fillGradient = ctx.createLinearGradient(0, barY, 0, barY + height);
      fillGradient.addColorStop(0, hexToRgba(color, 0.95));
      fillGradient.addColorStop(0.3, hexToRgba(color, 0.8));
      fillGradient.addColorStop(0.7, hexToRgba(color, 0.75));
      fillGradient.addColorStop(1, hexToRgba(color, 0.85));
      
      ctx.fillStyle = fillGradient;
      ctx.fillRect(xOffset, barY, fillWidth, height);
      
      // Top highlight
      ctx.fillStyle = hexToRgba('#ffffff', 0.35);
      ctx.fillRect(xOffset, barY, fillWidth, height * 0.35);
    }

    // Chapter name
    if (showChapterNames) {
      const isActive = currentChapter?.index === index;
      const centerX = xOffset + chapterWidth / 2;
      const maxTextWidth = chapterWidth - 16;
      
      ctx.font = `${getFontWeight(isActive ? 'bold' : config.fontWeight)} ${config.fontSize}px Inter, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const displayText = truncateText(ctx, chapter.name, maxTextWidth);
      
      if (chapterNamePosition === 'above') {
        ctx.fillStyle = isActive ? config.textColor : hexToRgba(config.textColor, 0.6);
        ctx.fillText(displayText, centerX, 14);
      } else if (chapterNamePosition === 'inside') {
        // Text with shadow for glass effect
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

    // Glass divider
    if (index < chapters.length - 1) {
      const divX = xOffset + chapterWidth;
      ctx.fillStyle = hexToRgba('#ffffff', 0.35);
      ctx.fillRect(divX - 1, barY + 6, 1, height - 12);
      ctx.fillStyle = hexToRgba('#000000', 0.15);
      ctx.fillRect(divX, barY + 6, 1, height - 12);
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
  const { width, height, chapters, borderRadius, backgroundColor, showChapterNames, chapterNamePosition } = config;
  
  // Background
  ctx.fillStyle = backgroundColor;
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.fill();

  let xOffset = 0;
  const currentChapter = getChapterAtProgress(chapters, progress);
  const progressX = progress * width;

  ctx.save();
  roundRect(ctx, 0, barY, width, height, borderRadius);
  ctx.clip();

  // Create smooth gradient across all chapters
  if (progressX > 0) {
    const fullGradient = ctx.createLinearGradient(0, 0, progressX, 0);
    let gradientOffset = 0;
    
    chapters.forEach((chapter) => {
      const chapterRatio = chapter.duration / 100;
      const color = chapter.color || config.progressColor;
      
      // Add gradient stops for smooth transition
      if (gradientOffset > 0) {
        fullGradient.addColorStop(Math.max(0, gradientOffset - 0.01), color);
      }
      fullGradient.addColorStop(gradientOffset, color);
      gradientOffset += chapterRatio;
      if (gradientOffset < 1) {
        fullGradient.addColorStop(Math.min(1, gradientOffset), color);
      }
    });

    if (config.glowEffect) {
      ctx.shadowColor = chapters[0]?.color || config.progressColor;
      ctx.shadowBlur = config.glowIntensity;
    }
    
    ctx.fillStyle = fullGradient;
    ctx.fillRect(0, barY, progressX, height);
    
    // Top highlight
    ctx.shadowBlur = 0;
    ctx.fillStyle = hexToRgba('#ffffff', 0.2);
    ctx.fillRect(0, barY, progressX, height * 0.4);
  }

  // Chapter markers and names
  xOffset = 0;
  chapters.forEach((chapter, index) => {
    const chapterWidth = (chapter.duration / 100) * width;

    if (showChapterNames) {
      const isActive = currentChapter?.index === index;
      const centerX = xOffset + chapterWidth / 2;
      const maxTextWidth = chapterWidth - 20;
      
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

    // Diamond divider
    if (index < chapters.length - 1) {
      const divX = xOffset + chapterWidth;
      ctx.save();
      ctx.translate(divX, barY + height / 2);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = hexToRgba('#ffffff', 0.5);
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    }

    xOffset += chapterWidth;
  });

  ctx.restore();

  // Progress indicator
  if (progressX > 0 && progressX < width) {
    const headColor = currentChapter?.chapter.color || config.progressColor;
    
    // Glow
    if (config.glowEffect) {
      ctx.beginPath();
      ctx.arc(progressX, barY + height / 2, 12, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(headColor, 0.3);
      ctx.fill();
    }
    
    // White outer ring
    ctx.beginPath();
    ctx.arc(progressX, barY + height / 2, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    
    // Colored center
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
