import { useState, useRef, useEffect, useCallback } from 'react';
import type { ProgressBarConfig } from '../types';
import { formatTimeString } from '../types';
import ProgressBarCanvas from './ProgressBarCanvas';
import type { ProgressBarCanvasRef } from './ProgressBarCanvas';
import { Play, Pause, RotateCcw, Loader2, Film, Video } from 'lucide-react';
import { saveAs } from 'file-saver';

interface PreviewPanelProps {
  config: ProgressBarConfig;
}

// Helper to calculate canvas height
function calculateCanvasHeight(config: ProgressBarConfig): number {
  let height = config.height;
  
  if (config.showChapterNames && config.chapterNamePosition !== 'inside') {
    height += 35;
  }
  
  if (config.mascot.type !== 'none') {
    const mascotSpace = config.mascot.size + 10;
    if (config.mascot.position === 'above-bar' || config.mascot.position === 'below-bar') {
      height += mascotSpace;
    }
  }
  
  return height;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ config }) => {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState<'gif' | 'video' | null>(null);
  
  const canvasRef = useRef<ProgressBarCanvasRef>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedProgressRef = useRef<number>(0);

  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp - pausedProgressRef.current * config.totalDuration * 1000;
    }

    const elapsed = timestamp - startTimeRef.current;
    const duration = config.totalDuration * 1000;
    const newProgress = Math.min(elapsed / duration, 1);

    setProgress(newProgress);

    if (newProgress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setIsPlaying(false);
      startTimeRef.current = 0;
      pausedProgressRef.current = 0;
    }
  }, [config.totalDuration]);

  const play = useCallback(() => {
    if (progress >= 1) {
      setProgress(0);
      pausedProgressRef.current = 0;
    } else {
      pausedProgressRef.current = progress;
    }
    startTimeRef.current = 0;
    setIsPlaying(true);
    animationRef.current = requestAnimationFrame(animate);
  }, [animate, progress]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    pausedProgressRef.current = progress;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    startTimeRef.current = 0;
  }, [progress]);

  const reset = useCallback(() => {
    pause();
    setProgress(0);
    pausedProgressRef.current = 0;
    startTimeRef.current = 0;
  }, [pause]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Get current chapter
  const getCurrentChapter = () => {
    const currentTime = progress * config.totalDuration;
    for (let i = config.chapters.length - 1; i >= 0; i--) {
      if (currentTime >= config.chapters[i].startTime) {
        return config.chapters[i];
      }
    }
    return config.chapters[0];
  };

  const currentChapter = getCurrentChapter();

  // Export as GIF
  const exportGIF = async () => {
    setIsExporting(true);
    setExportType('gif');
    setExportProgress(0);

    try {
      const GIF = (await import('gif.js')).default;

      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: config.width,
        height: calculateCanvasHeight(config),
        workerScript: '/obsidian-/gif.worker.js',
      });

      const totalFrames = Math.min(config.totalDuration * config.fps, 300);
      const frameDelay = 1000 / config.fps;

      for (let frame = 0; frame <= totalFrames; frame++) {
        const frameProgress = frame / totalFrames;
        canvasRef.current?.renderFrame(frameProgress);

        const canvas = canvasRef.current?.getCanvas();
        if (canvas) {
          gif.addFrame(canvas, { delay: frameDelay, copy: true });
        }

        setExportProgress((frame / totalFrames) * 50);

        if (frame % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      gif.on('progress', (p: number) => {
        setExportProgress(50 + p * 50);
      });

      gif.on('finished', (blob: Blob) => {
        saveAs(blob, `progress-bar-${Date.now()}.gif`);
        setIsExporting(false);
        setExportType(null);
        setExportProgress(0);
        canvasRef.current?.renderFrame(progress);
      });

      gif.render();
    } catch (error) {
      console.error('GIF export failed:', error);
      alert('GIF 导出失败，请重试');
      setIsExporting(false);
      setExportType(null);
      setExportProgress(0);
    }
  };

  // Export as Video (WebM)
  const exportVideo = async () => {
    setIsExporting(true);
    setExportType('video');
    setExportProgress(0);

    try {
      const canvas = canvasRef.current?.getCanvas();
      if (!canvas) {
        throw new Error('Canvas not found');
      }

      // Create a temporary canvas for recording
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = config.width;
      tempCanvas.height = calculateCanvasHeight(config);
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) {
        throw new Error('Could not get canvas context');
      }

      // Check if MediaRecorder supports webm
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';

      const stream = tempCanvas.captureStream(config.fps);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5000000,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const extension = mimeType.includes('webm') ? 'webm' : 'mp4';
        saveAs(blob, `progress-bar-${Date.now()}.${extension}`);
        setIsExporting(false);
        setExportType(null);
        setExportProgress(0);
        canvasRef.current?.renderFrame(progress);
      };

      mediaRecorder.start();

      const totalFrames = config.totalDuration * config.fps;
      const frameInterval = 1000 / config.fps;

      for (let frame = 0; frame <= totalFrames; frame++) {
        const frameProgress = frame / totalFrames;
        canvasRef.current?.renderFrame(frameProgress);
        
        // Copy to temp canvas
        const sourceCanvas = canvasRef.current?.getCanvas();
        if (sourceCanvas) {
          tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
          tempCtx.drawImage(sourceCanvas, 0, 0);
        }

        setExportProgress((frame / totalFrames) * 100);

        // Wait for next frame
        await new Promise(resolve => setTimeout(resolve, frameInterval));
      }

      mediaRecorder.stop();
    } catch (error) {
      console.error('Video export failed:', error);
      alert('视频导出失败，请尝试 GIF 格式');
      setIsExporting(false);
      setExportType(null);
      setExportProgress(0);
      canvasRef.current?.renderFrame(progress);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Preview Area */}
      <div 
        className="flex-1 flex flex-col items-center justify-center p-8 rounded-2xl mb-6 min-h-[280px] relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0d0d10 0%, #131318 50%, #0a0a0d 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 0 0 1px rgba(255,255,255,0.03)',
        }}
      >
        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />
        
        {/* Current info */}
        <div className="mb-8 text-center relative z-10">
          <div className="flex items-center justify-center gap-4 mb-3">
            <span 
              className="text-3xl font-mono tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 30px rgba(129, 140, 248, 0.3)',
              }}
            >
              {formatTimeString(progress * config.totalDuration)}
            </span>
            <span className="text-gray-600 text-xl">/</span>
            <span className="text-xl font-mono text-gray-500 tracking-tight">
              {formatTimeString(config.totalDuration)}
            </span>
          </div>
          <div 
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm"
            style={{ 
              background: `linear-gradient(135deg, ${currentChapter?.color}15 0%, ${currentChapter?.color}08 100%)`,
              border: `1px solid ${currentChapter?.color}30`,
              color: currentChapter?.color,
              boxShadow: `0 0 20px ${currentChapter?.color}10`,
            }}
          >
            <div 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ 
                backgroundColor: currentChapter?.color,
                boxShadow: `0 0 8px ${currentChapter?.color}`,
              }}
            />
            {currentChapter?.name}
          </div>
        </div>

        {/* Scrollable container for wide progress bars */}
        <div 
          className="w-full overflow-x-auto pb-4 relative z-10"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#4f46e5 transparent',
          }}
        >
          <div 
            className="relative inline-block min-w-full"
            style={{
              width: config.width > 600 ? config.width : '100%',
            }}
          >
            <ProgressBarCanvas 
              ref={canvasRef}
              config={config} 
              progress={progress}
            />
          </div>
        </div>
        
        {config.width > 600 && (
          <p className="text-xs text-gray-600 mt-3 text-center flex items-center gap-2 relative z-10">
            <span className="text-gray-500">←</span>
            左右滑动查看完整进度条
            <span className="text-gray-500">→</span>
          </p>
        )}
      </div>

      {/* Progress Scrubber */}
      <div className="mb-6 px-1">
        <div className="flex items-center justify-between text-sm mb-3">
          <span 
            className="font-mono text-xs px-2 py-1 rounded bg-white/5 text-gray-400"
          >
            {Math.round(progress * 100)}%
          </span>
          <span className="text-gray-500 text-xs">
            {formatTimeString(progress * config.totalDuration)} / {formatTimeString(config.totalDuration)}
          </span>
        </div>
        <div className="relative">
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            onChange={(e) => {
              pause();
              setProgress(Number(e.target.value));
              pausedProgressRef.current = Number(e.target.value);
            }}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${progress * 100}%, #1f1f23 ${progress * 100}%, #1f1f23 100%)`,
            }}
          />
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <button
          onClick={reset}
          className="p-3.5 rounded-xl transition-all duration-200 group"
          style={{
            background: 'linear-gradient(145deg, #1f1f25 0%, #18181c 100%)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
          title="重置"
        >
          <RotateCcw className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
        </button>
        <button
          onClick={isPlaying ? pause : play}
          className="p-5 rounded-2xl transition-all duration-200 group relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
          title={isPlaying ? '暂停' : '播放'}
        >
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
            }}
          />
          {isPlaying ? (
            <Pause className="w-6 h-6 relative z-10" />
          ) : (
            <Play className="w-6 h-6 ml-0.5 relative z-10" />
          )}
        </button>
      </div>

      {/* Export Section */}
      <div className="space-y-4">
        <h4 
          className="text-xs font-semibold uppercase tracking-widest flex items-center gap-2"
          style={{ color: '#666' }}
        >
          <span className="w-8 h-px bg-gradient-to-r from-transparent to-gray-700" />
          导出
          <span className="flex-1 h-px bg-gradient-to-r from-gray-700 to-transparent" />
        </h4>
        
        {isExporting && (
          <div 
            className="rounded-xl p-5 mb-4"
            style={{
              background: 'linear-gradient(145deg, #1a1a20 0%, #141418 100%)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                <div 
                  className="absolute inset-0 blur-md"
                  style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)' }}
                />
              </div>
              <span className="text-sm text-gray-300">
                正在导出 {exportType === 'gif' ? 'GIF 动画' : '视频'}...
              </span>
            </div>
            <div 
              className="w-full rounded-full h-1.5 overflow-hidden"
              style={{ background: 'rgba(0,0,0,0.3)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{ 
                  width: `${exportProgress}%`,
                  background: 'linear-gradient(90deg, #6366f1, #818cf8)',
                  boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)',
                }}
              />
            </div>
            <div className="text-right text-xs text-gray-500 mt-2 font-mono">
              {Math.round(exportProgress)}%
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={exportGIF}
            disabled={isExporting}
            className="group flex flex-col items-center gap-3 p-5 rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #1a1a20 0%, #141418 100%)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background: 'linear-gradient(145deg, #1f1f28 0%, #18181f 100%)',
              }}
            />
            <div 
              className="p-3 rounded-xl relative z-10"
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)',
              }}
            >
              <Film className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="relative z-10 text-center">
              <span className="text-sm font-medium text-gray-200 block">GIF 动画</span>
              <span className="text-xs text-gray-500 mt-1 block">适合分享预览</span>
            </div>
          </button>
          
          <button
            onClick={exportVideo}
            disabled={isExporting}
            className="group flex flex-col items-center gap-3 p-5 rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #1a1a20 0%, #141418 100%)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background: 'linear-gradient(145deg, #1f1f28 0%, #18181f 100%)',
              }}
            />
            <div 
              className="p-3 rounded-xl relative z-10"
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)',
              }}
            >
              <Video className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="relative z-10 text-center">
              <span className="text-sm font-medium text-gray-200 block">视频</span>
              <span className="text-xs text-gray-500 mt-1 block">适合视频编辑</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;
