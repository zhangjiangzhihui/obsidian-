import type { ProgressBarConfig } from '../types';
import { STYLE_OPTIONS } from '../types';
import { Settings, Palette, Monitor, Sparkles } from 'lucide-react';

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
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                config.style === option.value
                  ? 'bg-indigo-500/20 border-2 border-indigo-500'
                  : 'bg-[#252525] border-2 border-transparent hover:bg-[#2a2a2a]'
              }`}
            >
              <span className="text-xl w-8">{option.icon}</span>
              <span className="text-sm">{option.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Size Settings */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Monitor className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold">尺寸设置</h3>
        </div>
        <div className="space-y-4">
          <Slider
            label="宽度"
            value={config.width}
            min={200}
            max={1920}
            step={10}
            unit="px"
            onChange={(v) => updateConfig('width', v)}
          />
          <Slider
            label="高度"
            value={config.height}
            min={config.style === 'circle' ? 100 : 20}
            max={config.style === 'circle' ? 500 : 200}
            step={5}
            unit="px"
            onChange={(v) => updateConfig('height', v)}
          />
          {config.style !== 'circle' && config.style !== 'dots' && (
            <Slider
              label="圆角"
              value={config.borderRadius}
              min={0}
              max={Math.min(config.height / 2, 50)}
              unit="px"
              onChange={(v) => updateConfig('borderRadius', v)}
            />
          )}
          {config.style === 'circle' && (
            <Slider
              label="线条粗细"
              value={config.strokeWidth}
              min={4}
              max={30}
              unit="px"
              onChange={(v) => updateConfig('strokeWidth', v)}
            />
          )}
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
            label="进度颜色"
            value={config.progressColor}
            onChange={(v) => updateConfig('progressColor', v)}
          />
          {(config.style === 'gradient-line' || config.style === 'wave') && (
            <ColorPicker
              label="渐变颜色"
              value={config.secondaryColor}
              onChange={(v) => updateConfig('secondaryColor', v)}
            />
          )}
        </div>
      </section>

      {/* Animation Settings */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold">动画设置</h3>
        </div>
        <div className="space-y-4">
          <Slider
            label="时长"
            value={config.duration}
            min={1}
            max={60}
            unit="秒"
            onChange={(v) => updateConfig('duration', v)}
          />
          <Slider
            label="帧率"
            value={config.fps}
            min={10}
            max={60}
            unit="fps"
            onChange={(v) => updateConfig('fps', v)}
          />
          <div className="space-y-2">
            <label className="text-sm text-gray-300">缓动效果</label>
            <select
              value={config.animationEasing}
              onChange={(e) => updateConfig('animationEasing', e.target.value as ProgressBarConfig['animationEasing'])}
              className="w-full bg-[#252525] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="linear">线性 (Linear)</option>
              <option value="ease-in">渐入 (Ease In)</option>
              <option value="ease-out">渐出 (Ease Out)</option>
              <option value="ease-in-out">渐入渐出 (Ease In Out)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Effects */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold">效果设置</h3>
        </div>
        <div className="space-y-4">
          <Toggle
            label="发光效果"
            checked={config.glowEffect}
            onChange={(v) => updateConfig('glowEffect', v)}
          />
          <Toggle
            label="显示百分比"
            checked={config.showPercentage}
            onChange={(v) => updateConfig('showPercentage', v)}
          />
          {config.showPercentage && (
            <>
              <ColorPicker
                label="文字颜色"
                value={config.fontColor}
                onChange={(v) => updateConfig('fontColor', v)}
              />
              <Slider
                label="字体大小"
                value={config.fontSize}
                min={10}
                max={48}
                unit="px"
                onChange={(v) => updateConfig('fontSize', v)}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default SettingsPanel;
