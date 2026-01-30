import type { ProgressBarConfig, Chapter } from '../types';
import { STYLE_OPTIONS, PRESET_COLOR_SCHEMES } from '../types';
import { Settings, Palette, Layout, Sparkles, List, Plus, Trash2, GripVertical } from 'lucide-react';

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
    updateConfig('chapters', newChapters);
  };

  const addChapter = () => {
    const newId = Date.now().toString();
    const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];
    const newChapter: Chapter = {
      id: newId,
      name: `章节 ${config.chapters.length + 1}`,
      duration: 10,
      color: colors[config.chapters.length % colors.length],
    };
    updateConfig('chapters', [...config.chapters, newChapter]);
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

  // Normalize chapter durations to 100%
  const normalizeChapters = () => {
    const total = config.chapters.reduce((sum, ch) => sum + ch.duration, 0);
    if (total === 0) return;
    const newChapters = config.chapters.map(ch => ({
      ...ch,
      duration: Math.round((ch.duration / total) * 100),
    }));
    updateConfig('chapters', newChapters);
  };

  const totalDuration = config.chapters.reduce((sum, ch) => sum + ch.duration, 0);

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

        {/* Total duration warning */}
        {totalDuration !== 100 && (
          <div className="mb-3 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs text-yellow-400">
                总时长: {totalDuration}% (应为100%)
              </span>
              <button
                onClick={normalizeChapters}
                className="text-xs text-yellow-400 hover:text-yellow-300 underline"
              >
                自动修正
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
          {config.chapters.map((chapter) => (
            <div
              key={chapter.id}
              className="bg-[#252525] rounded-xl p-3 space-y-3"
            >
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-gray-500" />
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
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <button
                  onClick={() => removeChapter(chapter.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                  disabled={config.chapters.length <= 1}
                >
                  <Trash2 className={`w-4 h-4 ${config.chapters.length <= 1 ? 'text-gray-600' : 'text-red-400'}`} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-12">时长</span>
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={chapter.duration}
                  onChange={(e) => updateChapter(chapter.id, { duration: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-xs text-indigo-400 w-10 text-right">{chapter.duration}%</span>
              </div>
            </div>
          ))}
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
            label="视频时长"
            value={config.totalDuration}
            min={10}
            max={300}
            unit="秒"
            onChange={(v) => updateConfig('totalDuration', v)}
          />
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
