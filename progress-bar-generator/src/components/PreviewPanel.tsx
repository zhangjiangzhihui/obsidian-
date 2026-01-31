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
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0a0a0a] rounded-2xl mb-4 min-h-[250px]">
        {/* Current info */}
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-2">
            <span className="text-2xl font-mono text-indigo-400">
              {formatTimeString(progress * config.totalDuration)}
            </span>
            <span className="text-gray-500">/</span>
            <span className="text-lg font-mono text-gray-400">
              {formatTimeString(config.totalDuration)}
            </span>
          </div>
          <div 
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm"
            style={{ 
              backgroundColor: currentChapter?.color + '20',
              color: currentChapter?.color 
            }}
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: currentChapter?.color }}
            />
            {currentChapter?.name}
          </div>
        </div>

        {/* Scrollable container for wide progress bars */}
        <div 
          className="w-full overflow-x-auto pb-3"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#4f46e5 #1a1a1a',
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
          <p className="text-xs text-gray-500 mt-2 text-center">← 左右滑动查看完整进度条 →</p>
        )}
      </div>

      {/* Progress Scrubber */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
          <span>{Math.round(progress * 100)}%</span>
          <span>{formatTimeString(progress * config.totalDuration)} / {formatTimeString(config.totalDuration)}</span>
        </div>
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
          className="w-full"
        />
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={reset}
          className="p-3 rounded-xl bg-[#252525] hover:bg-[#2a2a2a] transition-colors"
          title="重置"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={isPlaying ? pause : play}
          className="p-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition-colors"
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-0.5" />
          )}
        </button>
      </div>

      {/* Export Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">导出</h4>
        
        {isExporting && (
          <div className="bg-[#252525] rounded-xl p-4 mb-3">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              <span className="text-sm">
                正在导出 {exportType === 'gif' ? 'GIF 动画' : '视频'}...
              </span>
            </div>
            <div className="w-full bg-[#1a1a1a] rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-200"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <div className="text-right text-xs text-gray-400 mt-1">
              {Math.round(exportProgress)}%
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={exportGIF}
            disabled={isExporting}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#252525] hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Film className="w-6 h-6 text-indigo-400" />
            <span className="text-sm font-medium">GIF 动画</span>
            <span className="text-xs text-gray-500">适合分享预览</span>
          </button>
          
          <button
            onClick={exportVideo}
            disabled={isExporting}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#252525] hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Video className="w-6 h-6 text-indigo-400" />
            <span className="text-sm font-medium">视频</span>
            <span className="text-xs text-gray-500">适合视频编辑</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;
