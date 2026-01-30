import { useState } from 'react';
import type { ProgressBarConfig, Chapter } from './types';
import { DEFAULT_CONFIG } from './types';
import SettingsPanel from './components/SettingsPanel';
import PreviewPanel from './components/PreviewPanel';
import { Sparkles, Menu, X } from 'lucide-react';

// Preset configurations with timestamps
const PRESETS: { name: string; config: Partial<ProgressBarConfig> & { chapters: Chapter[], totalDuration: number } }[] = [
  {
    name: '教程视频',
    config: {
      style: 'modern',
      totalDuration: 600, // 10 minutes
      chapters: [
        { id: '1', name: '前言', startTime: 0, color: '#6366f1' },
        { id: '2', name: '准备工作', startTime: 60, color: '#8b5cf6' },
        { id: '3', name: '核心教程', startTime: 150, color: '#a855f7' },
        { id: '4', name: '实战演练', startTime: 360, color: '#d946ef' },
        { id: '5', name: '总结', startTime: 540, color: '#ec4899' },
      ],
    },
  },
  {
    name: 'Vlog',
    config: {
      style: 'gradient',
      totalDuration: 480, // 8 minutes
      chapters: [
        { id: '1', name: '开场', startTime: 0, color: '#f97316' },
        { id: '2', name: '上午', startTime: 45, color: '#fb923c' },
        { id: '3', name: '下午', startTime: 180, color: '#fbbf24' },
        { id: '4', name: '晚上', startTime: 330, color: '#facc15' },
        { id: '5', name: '结尾', startTime: 420, color: '#eab308' },
      ],
    },
  },
  {
    name: '游戏视频',
    config: {
      style: 'neon',
      totalDuration: 900, // 15 minutes
      chapters: [
        { id: '1', name: 'INTRO', startTime: 0, color: '#06b6d4' },
        { id: '2', name: 'GAMEPLAY', startTime: 30, color: '#0ea5e9' },
        { id: '3', name: 'BOSS战', startTime: 480, color: '#3b82f6' },
        { id: '4', name: 'HIGHLIGHTS', startTime: 720, color: '#6366f1' },
        { id: '5', name: 'OUTRO', startTime: 840, color: '#8b5cf6' },
      ],
      backgroundColor: '#0a0a0f',
    },
  },
  {
    name: '产品评测',
    config: {
      style: 'glass',
      totalDuration: 720, // 12 minutes
      chapters: [
        { id: '1', name: '开箱', startTime: 0, color: '#10b981' },
        { id: '2', name: '外观', startTime: 90, color: '#14b8a6' },
        { id: '3', name: '性能测试', startTime: 240, color: '#06b6d4' },
        { id: '4', name: '使用体验', startTime: 420, color: '#0ea5e9' },
        { id: '5', name: '购买建议', startTime: 600, color: '#3b82f6' },
      ],
    },
  },
  {
    name: '音乐MV',
    config: {
      style: 'gradient',
      totalDuration: 240, // 4 minutes
      chapters: [
        { id: '1', name: '前奏', startTime: 0, color: '#e11d48' },
        { id: '2', name: '主歌A', startTime: 20, color: '#f43f5e' },
        { id: '3', name: '副歌', startTime: 70, color: '#fb7185' },
        { id: '4', name: '主歌B', startTime: 110, color: '#fda4af' },
        { id: '5', name: '高潮', startTime: 150, color: '#f43f5e' },
        { id: '6', name: '尾声', startTime: 200, color: '#fecdd3' },
      ],
      glowEffect: true,
      glowIntensity: 25,
    },
  },
];

function App() {
  const [config, setConfig] = useState<ProgressBarConfig>(DEFAULT_CONFIG);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setConfig({
      ...config,
      ...preset.config,
    });
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0f0f0f]/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold">章节进度条生成器</h1>
                <p className="text-xs text-gray-400 hidden sm:block">使用时间戳定义章节，导出视频进度条素材</p>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-40 bg-[#0f0f0f]" style={{ top: '64px' }}>
          <div className="p-4 h-full overflow-y-auto">
            <SettingsPanel config={config} onChange={setConfig} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-120px)]">
          {/* Settings Panel - Desktop */}
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 overflow-hidden">
            <SettingsPanel config={config} onChange={setConfig} />
          </aside>

          {/* Preview Panel */}
          <section className="lg:col-span-8 xl:col-span-9 bg-[#1a1a1a] rounded-2xl p-6">
            <PreviewPanel config={config} />
          </section>
        </div>
      </main>

      {/* Presets Quick Access */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 hidden sm:flex items-center gap-2 bg-[#1a1a1a] rounded-full px-4 py-2 shadow-xl border border-gray-800">
        <span className="text-xs text-gray-400 mr-2">场景预设:</span>
        {PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => applyPreset(preset)}
            className="px-3 py-1 rounded-full text-xs bg-[#252525] hover:bg-[#2a2a2a] transition-colors whitespace-nowrap"
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
