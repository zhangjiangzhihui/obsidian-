import { useState } from 'react';
import type { ProgressBarConfig, Chapter } from '../types';
import { STYLE_OPTIONS, MASCOT_OPTIONS, formatTimeString, parseTimeString, getChapterDuration } from '../types';
import { Settings, Palette, Layout, Sparkles, List, Plus, Trash2, Clock, Cat } from 'lucide-react';

interface SettingsPanelProps {
  config: ProgressBarConfig;
  onChange: (config: ProgressBarConfig) => void;
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, step = 1, unit = '', onChange }) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <label className="text-sm text-gray-400">{label}</label>
      <span 
        className="text-xs font-mono px-2 py-1 rounded"
        style={{ 
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)',
          color: '#a5b4fc'
        }}
      >
        {value}{unit}
      </span>
    </div>
    <div className="relative">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((value - min) / (max - min)) * 100}%, #252530 ${((value - min) / (max - min)) * 100}%, #252530 100%)`,
        }}
      />
    </div>
  </div>
);

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between group">
    <label className="text-sm text-gray-400">{label}</label>
    <div className="flex items-center gap-3">
      <div 
        className="relative"
        style={{ 
          padding: '2px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg cursor-pointer"
          style={{ 
            border: 'none',
            background: value,
          }}
        />
      </div>
      <span 
        className="text-xs font-mono text-gray-500 uppercase tracking-wide"
        style={{ minWidth: '60px' }}
      >
        {value}
      </span>
    </div>
  </div>
);

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Toggle: React.FC<ToggleProps> = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between">
    <label className="text-sm text-gray-400">{label}</label>
    <button
      onClick={() => onChange(!checked)}
      className="relative w-12 h-6 rounded-full transition-all duration-300"
      style={{
        background: checked 
          ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
          : 'linear-gradient(135deg, #2a2a32 0%, #1f1f25 100%)',
        boxShadow: checked 
          ? '0 2px 10px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
          : 'inset 0 1px 3px rgba(0,0,0,0.3)',
      }}
    >
      <span
        className="absolute top-1 w-4 h-4 rounded-full transition-all duration-300"
        style={{
          left: checked ? '28px' : '4px',
          background: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  </div>
);

// Time input component
interface TimeInputProps {
  value: number;
  onChange: (seconds: number) => void;
  max?: number;
}

const TimeInput: React.FC<TimeInputProps> = ({ value, onChange, max }) => {
  const [inputValue, setInputValue] = useState(formatTimeString(value));
  
  const handleBlur = () => {
    let seconds = parseTimeString(inputValue);
    if (max !== undefined && seconds > max) {
      seconds = max;
    }
    if (seconds < 0) seconds = 0;
    onChange(seconds);
    setInputValue(formatTimeString(seconds));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <input
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder="0:00"
      className="w-16 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none font-mono transition-all duration-200"
      style={{
        background: 'linear-gradient(145deg, #18181c 0%, #1a1a1e 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        color: '#e5e7eb',
      }}
    />
  );
};

// Section header component
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-3 mb-5">
    <div 
      className="p-2 rounded-lg"
      style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)',
      }}
    >
      {icon}
    </div>
    <h3 className="text-base font-semibold text-gray-200">{title}</h3>
  </div>
);

const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onChange }) => {
  const updateConfig = <K extends keyof ProgressBarConfig>(
    key: K,
    value: ProgressBarConfig[K]
  ) => {
    onChange({ ...config, [key]: value });
  };

  const updateChapter = (id: string, updates: Partial<Chapter>) => {
    const newChapters = config.chapters.map(ch =>
      ch.id === id ? { ...ch, ...updates } : ch
    );
    // Sort by start time
    newChapters.sort((a, b) => a.startTime - b.startTime);
    updateConfig('chapters', newChapters);
  };

  const addChapter = () => {
    const newId = Date.now().toString();
    const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];
    
    // Find a good start time (middle of the timeline or after last chapter)
    const lastChapter = config.chapters[config.chapters.length - 1];
    const newStartTime = lastChapter 
      ? Math.min(lastChapter.startTime + 30, config.totalDuration - 10)
      : 0;
    
    const newChapter: Chapter = {
      id: newId,
      name: `章节 ${config.chapters.length + 1}`,
      startTime: newStartTime,
      color: colors[config.chapters.length % colors.length],
    };
    
    const newChapters = [...config.chapters, newChapter].sort((a, b) => a.startTime - b.startTime);
    updateConfig('chapters', newChapters);
  };

  const removeChapter = (id: string) => {
    if (config.chapters.length <= 1) return;
    updateConfig('chapters', config.chapters.filter(ch => ch.id !== id));
  };

  // Handle total duration change
  const handleTotalDurationChange = (newDuration: number) => {
    // Adjust chapters that exceed the new duration
    const adjustedChapters = config.chapters.map(ch => ({
      ...ch,
      startTime: Math.min(ch.startTime, newDuration - 1),
    }));
    onChange({
      ...config,
      totalDuration: newDuration,
      chapters: adjustedChapters,
    });
  };

  return (
    <div 
      className="rounded-2xl p-6 space-y-8 h-full overflow-y-auto"
      style={{
        background: 'linear-gradient(145deg, #141418 0%, #111114 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      {/* Style Selection */}
      <section>
        <SectionHeader 
          icon={<Sparkles className="w-4 h-4 text-indigo-400" />} 
          title="样式选择" 
        />
        <div className="grid grid-cols-1 gap-2">
          {STYLE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => updateConfig('style', option.value)}
              className="flex flex-col items-start p-4 rounded-xl transition-all duration-300 text-left"
              style={{
                background: config.style === option.value
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)'
                  : 'linear-gradient(145deg, #1a1a1e 0%, #161619 100%)',
                border: config.style === option.value
                  ? '1px solid rgba(99, 102, 241, 0.4)'
                  : '1px solid rgba(255,255,255,0.03)',
                boxShadow: config.style === option.value
                  ? '0 0 20px rgba(99, 102, 241, 0.1)'
                  : 'none',
              }}
            >
              <span className="text-sm font-medium text-gray-200">{option.label}</span>
              <span className="text-xs text-gray-500 mt-1">{option.description}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Video Duration */}
      <section>
        <SectionHeader 
          icon={<Clock className="w-4 h-4 text-indigo-400" />} 
          title="视频时长" 
        />
        <div 
          className="rounded-xl p-4"
          style={{
            background: 'linear-gradient(145deg, #1a1a1e 0%, #161619 100%)',
            border: '1px solid rgba(255,255,255,0.03)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">总时长</span>
            <div className="flex items-center gap-3">
              <TimeInput
                value={config.totalDuration}
                onChange={handleTotalDurationChange}
              />
              <span className="text-xs text-gray-600 font-mono">({config.totalDuration}s)</span>
            </div>
          </div>
          <p className="text-xs text-gray-600">
            输入格式: 分:秒 (如 2:30) 或 秒数 (如 150)
          </p>
        </div>
      </section>

      {/* Chapter Editor */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)',
              }}
            >
              <List className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-200">章节设置</h3>
          </div>
          <button
            onClick={addChapter}
            className="p-2.5 rounded-xl transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
            }}
            title="添加章节"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
          </button>
        </div>

        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
          {config.chapters.map((chapter, index) => {
            const duration = getChapterDuration(config.chapters, index, config.totalDuration);
            
            return (
              <div
                key={chapter.id}
                className="rounded-xl p-4 space-y-3 transition-all duration-200"
                style={{
                  background: 'linear-gradient(145deg, #1a1a1e 0%, #161619 100%)',
                  border: '1px solid rgba(255,255,255,0.03)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ 
                      backgroundColor: chapter.color,
                      boxShadow: `0 0 0 2px #1a1a1e, 0 0 0 4px ${chapter.color}40`,
                    }}
                  />
                  <input
                    type="text"
                    value={chapter.name}
                    onChange={(e) => updateChapter(chapter.id, { name: e.target.value })}
                    className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none transition-all duration-200"
                    style={{
                      background: 'linear-gradient(145deg, #141416 0%, #18181b 100%)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      color: '#e5e7eb',
                    }}
                    placeholder="章节名称"
                  />
                  <div 
                    className="relative"
                    style={{ 
                      padding: '1px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    }}
                  >
                    <input
                      type="color"
                      value={chapter.color || '#6366f1'}
                      onChange={(e) => updateChapter(chapter.id, { color: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer flex-shrink-0"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <button
                    onClick={() => removeChapter(chapter.id)}
                    className="p-2 rounded-lg transition-all duration-200 flex-shrink-0"
                    style={{
                      background: config.chapters.length <= 1 ? 'transparent' : 'rgba(239, 68, 68, 0.1)',
                      opacity: config.chapters.length <= 1 ? 0.3 : 1,
                    }}
                    disabled={config.chapters.length <= 1}
                  >
                    <Trash2 className={`w-4 h-4 ${config.chapters.length <= 1 ? 'text-gray-600' : 'text-red-400'}`} />
                  </button>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">开始</span>
                    <TimeInput
                      value={chapter.startTime}
                      onChange={(seconds) => updateChapter(chapter.id, { startTime: seconds })}
                      max={config.totalDuration - 1}
                    />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(99, 102, 241, 0.08)' }}>
                    <span className="text-xs text-gray-500">时长</span>
                    <span className="text-xs font-mono text-indigo-400">{formatTimeString(duration)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </section>

      {/* Display Settings */}
      <section>
        <SectionHeader 
          icon={<Layout className="w-4 h-4 text-indigo-400" />} 
          title="显示设置" 
        />
        <div className="space-y-5">
          <Toggle
            label="显示章节名称"
            checked={config.showChapterNames}
            onChange={(v) => updateConfig('showChapterNames', v)}
          />
          {config.showChapterNames && (
            <div className="space-y-3">
              <label className="text-sm text-gray-400">名称位置</label>
              <div className="grid grid-cols-3 gap-2">
                {(['above', 'inside', 'below'] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => updateConfig('chapterNamePosition', pos)}
                    className="px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200"
                    style={{
                      background: config.chapterNamePosition === pos
                        ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                        : 'linear-gradient(145deg, #1a1a1e 0%, #161619 100%)',
                      color: config.chapterNamePosition === pos ? '#ffffff' : '#9ca3af',
                      border: config.chapterNamePosition === pos
                        ? '1px solid transparent'
                        : '1px solid rgba(255,255,255,0.03)',
                      boxShadow: config.chapterNamePosition === pos
                        ? '0 2px 10px rgba(99, 102, 241, 0.3)'
                        : 'none',
                    }}
                  >
                    {pos === 'above' ? '上方' : pos === 'inside' ? '内部' : '下方'}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Toggle
            label="显示分隔线"
            checked={config.showChapterDividers}
            onChange={(v) => updateConfig('showChapterDividers', v)}
          />
          <Toggle
            label="显示时间码"
            checked={config.showTimeCode}
            onChange={(v) => updateConfig('showTimeCode', v)}
          />
        </div>
      </section>

      {/* Mascot Settings */}
      <section>
        <SectionHeader 
          icon={<Cat className="w-4 h-4 text-indigo-400" />} 
          title="萌宠设置" 
        />
        
        {/* Mascot Type Selection */}
        <div className="space-y-5">
          <div className="grid grid-cols-5 gap-2">
            {MASCOT_OPTIONS.map((option) => (
              <button
                key={option.type}
                onClick={() => updateConfig('mascot', { ...config.mascot, type: option.type })}
                className="flex flex-col items-center p-3 rounded-xl transition-all duration-200"
                style={{
                  background: config.mascot.type === option.type
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)'
                    : 'linear-gradient(145deg, #1a1a1e 0%, #161619 100%)',
                  border: config.mascot.type === option.type
                    ? '1px solid rgba(99, 102, 241, 0.4)'
                    : '1px solid rgba(255,255,255,0.03)',
                }}
                title={option.label}
              >
                <span className="text-xl">{option.emoji}</span>
                <span className="text-[10px] text-gray-500 mt-1.5">{option.label}</span>
              </button>
            ))}
          </div>

          {/* Custom Emoji Input */}
          {config.mascot.type === 'custom' && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">自定义</span>
              <input
                type="text"
                value={config.mascot.customEmoji}
                onChange={(e) => updateConfig('mascot', { ...config.mascot, customEmoji: e.target.value })}
                className="w-20 rounded-xl px-3 py-3 text-center text-xl focus:outline-none transition-all duration-200"
                style={{
                  background: 'linear-gradient(145deg, #1a1a1e 0%, #161619 100%)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
                placeholder="😀"
              />
            </div>
          )}

          {config.mascot.type !== 'none' && (
            <>
              {/* Mascot Position */}
              <div className="space-y-3">
                <label className="text-sm text-gray-400">位置</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['above-bar', 'on-bar', 'below-bar'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => updateConfig('mascot', { ...config.mascot, position: pos })}
                      className="px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200"
                      style={{
                        background: config.mascot.position === pos
                          ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                          : 'linear-gradient(145deg, #1a1a1e 0%, #161619 100%)',
                        color: config.mascot.position === pos ? '#ffffff' : '#9ca3af',
                        border: config.mascot.position === pos
                          ? '1px solid transparent'
                          : '1px solid rgba(255,255,255,0.03)',
                        boxShadow: config.mascot.position === pos
                          ? '0 2px 10px rgba(99, 102, 241, 0.3)'
                          : 'none',
                      }}
                    >
                      {pos === 'above-bar' ? '上方' : pos === 'on-bar' ? '进度条上' : '下方'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mascot Size */}
              <Slider
                label="大小"
                value={config.mascot.size}
                min={20}
                max={60}
                unit="px"
                onChange={(v) => updateConfig('mascot', { ...config.mascot, size: v })}
              />

            </>
          )}
        </div>
      </section>

      {/* Size Settings */}
      <section>
        <SectionHeader 
          icon={<Settings className="w-4 h-4 text-indigo-400" />} 
          title="尺寸设置" 
        />
        <div className="space-y-5">
          <Slider
            label="宽度"
            value={config.width}
            min={400}
            max={1920}
            step={10}
            unit="px"
            onChange={(v) => updateConfig('width', v)}
          />
          <Slider
            label="高度"
            value={config.height}
            min={40}
            max={120}
            step={5}
            unit="px"
            onChange={(v) => updateConfig('height', v)}
          />
          <Slider
            label="圆角"
            value={config.borderRadius}
            min={0}
            max={30}
            unit="px"
            onChange={(v) => updateConfig('borderRadius', v)}
          />
          <Slider
            label="字体大小"
            value={config.fontSize}
            min={10}
            max={20}
            unit="px"
            onChange={(v) => updateConfig('fontSize', v)}
          />
        </div>
      </section>

      {/* Color Settings */}
      <section>
        <SectionHeader 
          icon={<Palette className="w-4 h-4 text-indigo-400" />} 
          title="颜色设置" 
        />
        <div className="space-y-5">
          <ColorPicker
            label="背景颜色"
            value={config.backgroundColor}
            onChange={(v) => updateConfig('backgroundColor', v)}
          />
          <ColorPicker
            label="文字颜色"
            value={config.textColor}
            onChange={(v) => updateConfig('textColor', v)}
          />
        </div>
      </section>

      {/* Animation Settings */}
      <section>
        <SectionHeader 
          icon={<Sparkles className="w-4 h-4 text-indigo-400" />} 
          title="动画设置" 
        />
        <div className="space-y-5">
          <Slider
            label="帧率"
            value={config.fps}
            min={15}
            max={60}
            unit="fps"
            onChange={(v) => updateConfig('fps', v)}
          />
          <div className="space-y-3">
            <label className="text-sm text-gray-400">缓动效果</label>
            <select
              value={config.animationEasing}
              onChange={(e) => updateConfig('animationEasing', e.target.value as ProgressBarConfig['animationEasing'])}
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-200"
              style={{
                background: 'linear-gradient(145deg, #1a1a1e 0%, #161619 100%)',
                border: '1px solid rgba(255,255,255,0.05)',
                color: '#e5e7eb',
              }}
            >
              <option value="linear">线性</option>
              <option value="ease-in">渐入</option>
              <option value="ease-out">渐出</option>
              <option value="ease-in-out">渐入渐出</option>
            </select>
          </div>
          <Toggle
            label="发光效果"
            checked={config.glowEffect}
            onChange={(v) => updateConfig('glowEffect', v)}
          />
          {config.glowEffect && (
            <Slider
              label="发光强度"
              value={config.glowIntensity}
              min={5}
              max={40}
              onChange={(v) => updateConfig('glowIntensity', v)}
            />
          )}
        </div>
      </section>
    </div>
  );
};

export default SettingsPanel;
