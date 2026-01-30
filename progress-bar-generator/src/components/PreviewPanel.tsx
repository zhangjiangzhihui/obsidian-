import { useState, useRef, useEffect, useCallback } from 'react';
import type { ProgressBarConfig } from '../types';
import ProgressBarCanvas from './ProgressBarCanvas';
import type { ProgressBarCanvasRef } from './ProgressBarCanvas';
import { Play, Pause, RotateCcw, Loader2, Image, Film, FileArchive } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface PreviewPanelProps {
  config: ProgressBarConfig;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ config }) => {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState<'png' | 'gif' | null>(null);
  
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

  // Get current chapter name
  const getCurrentChapter = () => {
    let accumulated = 0;
    for (const chapter of config.chapters) {
      accumulated += chapter.duration / 100;
      if (progress <= accumulated) {
        return chapter.name;
      }
    }
    return config.chapters[config.chapters.length - 1]?.name || '';
  };

  // Export as PNG sequence
  const exportPNGSequence = async () => {
    setIsExporting(true);
    setExportType('png');
    setExportProgress(0);

    const zip = new JSZip();
    const totalFrames = config.totalDuration * config.fps;

    try {
      for (let frame = 0; frame <= totalFrames; frame++) {
        const frameProgress = frame / totalFrames;
        canvasRef.current?.renderFrame(frameProgress);

        const canvas = canvasRef.current?.getCanvas();
        if (canvas) {
          const dataUrl = canvas.toDataURL('image/png');
          const base64Data = dataUrl.split(',')[1];
          const paddedFrame = String(frame).padStart(5, '0');
          zip.file(`frame_${paddedFrame}.png`, base64Data, { base64: true });
        }

        setExportProgress((frame / totalFrames) * 100);
        
        if (frame % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `chapter-progress-bar-${Date.now()}.zip`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
      setExportType(null);
      setExportProgress(0);
      canvasRef.current?.renderFrame(progress);
    }
  };

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
        height: config.showChapterNames && config.chapterNamePosition !== 'inside' ? config.height + 30 : config.height,
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
        saveAs(blob, `chapter-progress-bar-${Date.now()}.gif`);
        setIsExporting(false);
        setExportType(null);
        setExportProgress(0);
        canvasRef.current?.renderFrame(progress);
      });

      gif.render();
    } catch (error) {
      console.error('GIF export failed:', error);
      alert('GIF 导出失败，将导出为 PNG 序列');
      setIsExporting(false);
      setExportType(null);
      exportPNGSequence();
    }
  };

  // Export single frame
  const exportCurrentFrame = () => {
    const canvas = canvasRef.current?.getCanvas();
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `chapter-progress-${Math.round(progress * 100)}%-${Date.now()}.png`);
        }
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Preview Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0a0a0a] rounded-2xl mb-4 min-h-[300px]">
        {/* Current chapter indicator */}
        <div className="mb-6 text-center">
          <span className="text-xs text-gray-500 uppercase tracking-wider">当前章节</span>
          <h3 className="text-xl font-semibold text-white mt-1">{getCurrentChapter()}</h3>
        </div>

        <div 
          className="relative"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        >
          {/* Checkerboard background */}
          <div 
            className="absolute inset-0 rounded-lg opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #333 25%, transparent 25%),
                linear-gradient(-45deg, #333 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #333 75%),
                linear-gradient(-45deg, transparent 75%, #333 75%)
              `,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            }}
          />
          <ProgressBarCanvas 
            ref={canvasRef}
            config={config} 
            progress={progress}
          />
        </div>

        {/* Chapter visualization */}
        <div className="mt-6 flex items-center gap-1 flex-wrap justify-center">
          {config.chapters.map((chapter, index) => {
            let accumulated = 0;
            for (let i = 0; i <= index; i++) {
              accumulated += config.chapters[i].duration / 100;
            }
            const isActive = progress >= (accumulated - chapter.duration / 100) && progress < accumulated;
            const isPast = progress >= accumulated;
            
            return (
              <div
                key={chapter.id}
                className={`px-3 py-1 rounded-full text-xs transition-all ${
                  isActive 
                    ? 'scale-110 font-medium' 
                    : isPast 
                    ? 'opacity-60' 
                    : 'opacity-40'
                }`}
                style={{
                  backgroundColor: isActive ? chapter.color : 'transparent',
                  border: `2px solid ${chapter.color}`,
                  color: isActive ? '#fff' : chapter.color,
                }}
              >
                {chapter.name}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Scrubber */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
          <span>{Math.round(progress * 100)}%</span>
          <span>{formatTime(progress * config.totalDuration)} / {formatTime(config.totalDuration)}</span>
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
        <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">导出选项</h4>
        
        {isExporting && (
          <div className="bg-[#252525] rounded-xl p-4 mb-3">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              <span className="text-sm">
                正在导出 {exportType === 'gif' ? 'GIF' : 'PNG 序列'}...
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

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={exportCurrentFrame}
            disabled={isExporting}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#252525] hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Image className="w-6 h-6 text-indigo-400" />
            <span className="text-xs">当前帧</span>
          </button>
          
          <button
            onClick={exportPNGSequence}
            disabled={isExporting}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#252525] hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileArchive className="w-6 h-6 text-indigo-400" />
            <span className="text-xs">PNG 序列</span>
          </button>
          
          <button
            onClick={exportGIF}
            disabled={isExporting}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#252525] hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Film className="w-6 h-6 text-indigo-400" />
            <span className="text-xs">GIF 动画</span>
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-2">
          PNG 序列适合 Premiere/After Effects/达芬奇，GIF 适合快速预览
        </p>
      </div>
    </div>
  );
};

export default PreviewPanel;
