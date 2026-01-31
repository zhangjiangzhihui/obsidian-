import { useState } from 'react';
import type { ProgressBarConfig, Chapter } from '../types';
import { STYLE_OPTIONS, PRESET_COLOR_SCHEMES, MASCOT_OPTIONS, formatTimeString, parseTimeString, getChapterDuration } from '../types';
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
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <label className="text-sm text-gray-300">{label}</label>
      <span className="text-sm font-medium text-indigo-400">
        {value}{unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full"
    />
  </div>
);

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between">
    <label className="text-sm text-gray-300">{label}</label>
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-10 rounded-lg cursor-pointer"
      />
      <span className="text-xs font-mono text-gray-400 uppercase">{value}</span>
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
    <label className="text-sm text-gray-300">{label}</label>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
        checked ? 'bg-indigo-500' : 'bg-gray-600'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
          checked ? 'translate-x-7' : 'translate-x-1'
        }`}
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
      className="w-16 bg-[#1a1a1a] border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-indigo-500 font-mono"
    />
  );
};

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

  const applyColorScheme = (colors: string[]) => {
    const newChapters = config.chapters.map((ch, i) => ({
      ...ch,
      color: colors[i % colors.length],
    }));
    updateConfig('chapters', newChapters);
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
    <div className="bg-[#1a1a1a] rounded-2xl p-6 space-y-6 h-full overflow-y-auto">
      {/* Style Selection */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold">样式选择</h3>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {STYLE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => updateConfig('style', option.value)}
              className={`flex flex-col items-start p-3 rounded-xl transition-all duration-200 ${
                config.style === option.value
                  ? 'bg-indigo-500/20 border-2 border-indigo-500'
                  : 'bg-[#252525] border-2 border-transparent hover:bg-[#2a2a2a]'
              }`}
            >
              <span className="text-sm font-medium">{option.label}</span>
              <span className="text-xs text-gray-400">{option.description}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Video Duration */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold">视频时长</h3>
        </div>
        <div className="bg-[#252525] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-300">总时长</span>
            <div className="flex items-center gap-2">
              <TimeInput
                value={config.totalDuration}
                onChange={handleTotalDurationChange}
              />
              <span className="text-xs text-gray-500">({config.totalDuration}秒)</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            输入格式: 分:秒 (如 2:30) 或 秒数 (如 150)
          </p>
        </div>
      </section>

      {/* Chapter Editor */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <List className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold">章节设置</h3>
          </div>
          <button
            onClick={addChapter}
            className="p-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 transition-colors"
            title="添加章节"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
          </button>
        </div>

        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
          {config.chapters.map((chapter, index) => {
            const duration = getChapterDuration(config.chapters, index, config.totalDuration);
            
            return (
              <div
                key={chapter.id}
                className="bg-[#252525] rounded-xl p-3 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: chapter.color }}
                  />
                  <input
                    type="text"
                    value={chapter.name}
                    onChange={(e) => updateChapter(chapter.id, { name: e.target.value })}
                    className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="章节名称"
                  />
                  <input
                    type="color"
                    value={chapter.color || '#6366f1'}
                    onChange={(e) => updateChapter(chapter.id, { color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer flex-shrink-0"
                  />
                  <button
                    onClick={() => removeChapter(chapter.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors flex-shrink-0"
                    disabled={config.chapters.length <= 1}
                  >
                    <Trash2 className={`w-4 h-4 ${config.chapters.length <= 1 ? 'text-gray-600' : 'text-red-400'}`} />
                  </button>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-14">开始时间</span>
                    <TimeInput
                      value={chapter.startTime}
                      onChange={(seconds) => updateChapter(chapter.id, { startTime: seconds })}
                      max={config.totalDuration - 1}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="text-xs">时长</span>
                    <span className="text-xs font-mono text-indigo-400">{formatTimeString(duration)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Color Schemes */}
        <div className="mt-4">
          <span className="text-xs text-gray-400 mb-2 block">快速配色</span>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLOR_SCHEMES.map((scheme) => (
              <button
                key={scheme.name}
                onClick={() => applyColorScheme(scheme.colors)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#252525] hover:bg-[#2a2a2a] transition-colors"
                title={scheme.name}
              >
                {scheme.colors.slice(0, 4).map((color, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Display Settings */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Layout className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold">显示设置</h3>
        </div>
        <div className="space-y-4">
          <Toggle
            label="显示章节名称"
            checked={config.showChapterNames}
            onChange={(v) => updateConfig('showChapterNames', v)}
          />
          {config.showChapterNames && (
            <div className="space-y-2">
              <label className="text-sm text-gray-300">名称位置</label>
              <div className="grid grid-cols-3 gap-2">
                {(['above', 'inside', 'below'] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => updateConfig('chapterNamePosition', pos)}
                    className={`px-3 py-2 rounded-lg text-xs transition-colors ${
                      config.chapterNamePosition === pos
                        ? 'bg-indigo-500 text-white'
                        : 'bg-[#252525] text-gray-400 hover:bg-[#2a2a2a]'
                    }`}
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
        <div className="flex items-center gap-2 mb-4">
          <Cat className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold">萌宠设置</h3>
        </div>
        
        {/* Mascot Type Selection */}
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {MASCOT_OPTIONS.map((option) => (
              <button
                key={option.type}
                onClick={() => updateConfig('mascot', { ...config.mascot, type: option.type })}
                className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                  config.mascot.type === option.type
                    ? 'bg-indigo-500/20 border-2 border-indigo-500'
                    : 'bg-[#252525] border-2 border-transparent hover:bg-[#2a2a2a]'
                }`}
                title={option.label}
              >
                <span className="text-xl">{option.emoji}</span>
                <span className="text-[10px] text-gray-400 mt-1">{option.label}</span>
              </button>
            ))}
          </div>

          {/* Custom Emoji Input */}
          {config.mascot.type === 'custom' && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-300">自定义</span>
              <input
                type="text"
                value={config.mascot.customEmoji}
                onChange={(e) => updateConfig('mascot', { ...config.mascot, customEmoji: e.target.value })}
                className="w-20 bg-[#252525] border border-gray-700 rounded-lg px-3 py-2 text-center text-xl focus:outline-none focus:border-indigo-500"
                placeholder="😀"
              />
            </div>
          )}

          {config.mascot.type !== 'none' && (
            <>
              {/* Mascot Position */}
              <div className="space-y-2">
                <label className="text-sm text-gray-300">位置</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['above-bar', 'on-bar', 'below-bar'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => updateConfig('mascot', { ...config.mascot, position: pos })}
                      className={`px-3 py-2 rounded-lg text-xs transition-colors ${
                        config.mascot.position === pos
                          ? 'bg-indigo-500 text-white'
                          : 'bg-[#252525] text-gray-400 hover:bg-[#2a2a2a]'
                      }`}
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
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold">尺寸设置</h3>
        </div>
        <div className="space-y-4">
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
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold">颜色设置</h3>
        </div>
        <div className="space-y-4">
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
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold">动画设置</h3>
        </div>
        <div className="space-y-4">
          <Slider
            label="帧率"
            value={config.fps}
            min={15}
            max={60}
            unit="fps"
            onChange={(v) => updateConfig('fps', v)}
          />
          <div className="space-y-2">
            <label className="text-sm text-gray-300">缓动效果</label>
            <select
              value={config.animationEasing}
              onChange={(e) => updateConfig('animationEasing', e.target.value as ProgressBarConfig['animationEasing'])}
              className="w-full bg-[#252525] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
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
