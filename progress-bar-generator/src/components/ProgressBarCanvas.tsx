import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import type { ProgressBarConfig } from '../types';

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
  'ease-in': (t: number) => t * t,
  'ease-out': (t: number) => t * (2 - t),
  'ease-in-out': (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};

export const ProgressBarCanvas = forwardRef<ProgressBarCanvasRef, ProgressBarCanvasProps>(
  ({ config, progress }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const renderFrame = (currentProgress: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Apply easing
      const easedProgress = easingFunctions[config.animationEasing](currentProgress);

      // Clear canvas
      ctx.clearRect(0, 0, config.width, config.height);

      // Render based on style
      switch (config.style) {
        case 'line':
          renderLineProgress(ctx, config, easedProgress);
          break;
        case 'gradient-line':
          renderGradientLineProgress(ctx, config, easedProgress);
          break;
        case 'circle':
          renderCircleProgress(ctx, config, easedProgress);
          break;
        case 'wave':
          renderWaveProgress(ctx, config, easedProgress);
          break;
        case 'dots':
          renderDotsProgress(ctx, config, easedProgress);
          break;
      }

      // Render percentage if enabled
      if (config.showPercentage) {
        renderPercentage(ctx, config, easedProgress);
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
        height={config.height}
        className="max-w-full h-auto"
        style={{ imageRendering: 'crisp-edges' }}
      />
    );
  }
);

ProgressBarCanvas.displayName = 'ProgressBarCanvas';

// Line progress bar renderer
function renderLineProgress(
  ctx: CanvasRenderingContext2D,
  config: ProgressBarConfig,
  progress: number
) {
  const { width, height, backgroundColor, progressColor, borderRadius, glowEffect } = config;

  // Background
  ctx.fillStyle = backgroundColor;
  roundRect(ctx, 0, 0, width, height, borderRadius);
  ctx.fill();

  // Progress
  const progressWidth = width * progress;
  if (progressWidth > 0) {
    if (glowEffect) {
      ctx.shadowColor = progressColor;
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    ctx.fillStyle = progressColor;
    roundRect(ctx, 0, 0, progressWidth, height, borderRadius);
    ctx.fill();

    ctx.shadowBlur = 0;
  }
}

// Gradient line progress bar renderer
function renderGradientLineProgress(
  ctx: CanvasRenderingContext2D,
  config: ProgressBarConfig,
  progress: number
) {
  const { width, height, backgroundColor, progressColor, secondaryColor, borderRadius, glowEffect } = config;

  // Background
  ctx.fillStyle = backgroundColor;
  roundRect(ctx, 0, 0, width, height, borderRadius);
  ctx.fill();

  // Progress with gradient
  const progressWidth = width * progress;
  if (progressWidth > 0) {
    const gradient = ctx.createLinearGradient(0, 0, progressWidth, 0);
    gradient.addColorStop(0, progressColor);
    gradient.addColorStop(1, secondaryColor);

    if (glowEffect) {
      ctx.shadowColor = progressColor;
      ctx.shadowBlur = 15;
    }

    ctx.fillStyle = gradient;
    roundRect(ctx, 0, 0, progressWidth, height, borderRadius);
    ctx.fill();

    ctx.shadowBlur = 0;
  }
}

// Circle progress bar renderer
function renderCircleProgress(
  ctx: CanvasRenderingContext2D,
  config: ProgressBarConfig,
  progress: number
) {
  const { width, height, backgroundColor, progressColor, strokeWidth, glowEffect } = config;

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - strokeWidth;

  // Background circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = backgroundColor;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Progress arc
  if (progress > 0) {
    if (glowEffect) {
      ctx.shadowColor = progressColor;
      ctx.shadowBlur = 15;
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    ctx.strokeStyle = progressColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.shadowBlur = 0;
  }
}

// Wave progress bar renderer
function renderWaveProgress(
  ctx: CanvasRenderingContext2D,
  config: ProgressBarConfig,
  progress: number
) {
  const { width, height, backgroundColor, progressColor, secondaryColor, borderRadius, glowEffect } = config;

  // Background
  ctx.fillStyle = backgroundColor;
  roundRect(ctx, 0, 0, width, height, borderRadius);
  ctx.fill();

  // Clip to rounded rect
  ctx.save();
  roundRect(ctx, 0, 0, width, height, borderRadius);
  ctx.clip();

  const progressWidth = width * progress;
  const waveHeight = height * 0.3;
  const waveLength = 50;
  const time = progress * Math.PI * 4;

  if (progressWidth > 0) {
    if (glowEffect) {
      ctx.shadowColor = progressColor;
      ctx.shadowBlur = 10;
    }

    // Draw wave
    ctx.beginPath();
    ctx.moveTo(0, height);

    for (let x = 0; x <= progressWidth; x++) {
      const y = height / 2 + Math.sin((x / waveLength) * Math.PI * 2 + time) * waveHeight;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(progressWidth, height);
    ctx.lineTo(0, height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, progressWidth, 0);
    gradient.addColorStop(0, progressColor);
    gradient.addColorStop(1, secondaryColor);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Second wave layer
    ctx.beginPath();
    ctx.moveTo(0, height);

    for (let x = 0; x <= progressWidth; x++) {
      const y = height / 2 + Math.sin((x / waveLength) * Math.PI * 2 + time + Math.PI) * (waveHeight * 0.6);
      ctx.lineTo(x, y);
    }

    ctx.lineTo(progressWidth, height);
    ctx.lineTo(0, height);
    ctx.closePath();

    ctx.fillStyle = progressColor + '80';
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

// Dots progress bar renderer
function renderDotsProgress(
  ctx: CanvasRenderingContext2D,
  config: ProgressBarConfig,
  progress: number
) {
  const { width, height, backgroundColor, progressColor, glowEffect } = config;

  const dotRadius = Math.min(height / 3, 10);
  const dotSpacing = dotRadius * 3;
  const numDots = Math.floor(width / dotSpacing);
  const startX = (width - (numDots - 1) * dotSpacing) / 2;
  const centerY = height / 2;

  const activeDots = Math.floor(numDots * progress);

  for (let i = 0; i < numDots; i++) {
    const x = startX + i * dotSpacing;
    const isActive = i < activeDots;

    if (isActive && glowEffect) {
      ctx.shadowColor = progressColor;
      ctx.shadowBlur = 10;
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    ctx.arc(x, centerY, isActive ? dotRadius : dotRadius * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? progressColor : backgroundColor;
    ctx.fill();
  }

  ctx.shadowBlur = 0;
}

// Render percentage text
function renderPercentage(
  ctx: CanvasRenderingContext2D,
  config: ProgressBarConfig,
  progress: number
) {
  const { width, height, fontColor, fontSize, style } = config;

  ctx.font = `bold ${fontSize}px Inter, -apple-system, sans-serif`;
  ctx.fillStyle = fontColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const percentage = Math.round(progress * 100) + '%';

  if (style === 'circle') {
    ctx.fillText(percentage, width / 2, height / 2);
  } else {
    ctx.fillText(percentage, width / 2, height / 2);
  }
}

// Helper function to draw rounded rectangle
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

export default ProgressBarCanvas;
