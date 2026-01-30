import { useState } from 'react';
import type { ProgressBarConfig, Chapter } from './types';
import { DEFAULT_CONFIG } from './types';
import SettingsPanel from './components/SettingsPanel';
import PreviewPanel from './components/PreviewPanel';
import { Sparkles, Menu, X } from 'lucide-react';

// Preset configurations
const PRESETS: { name: string; config: Partial<ProgressBarConfig> }[] = [
  {
    name: '教程视频',
    config: {
      style: 'modern',
      chapters: [
        { id: '1', name: '前言', duration: 10, color: '#6366f1' },
        { id: '2', name: '准备工作', duration: 15, color: '#8b5cf6' },
        { id: '3', name: '核心教程', duration: 50, color: '#a855f7' },
        { id: '4', name: '总结', duration: 15, color: '#d946ef' },
        { id: '5', name: '彩蛋', duration: 10, color: '#ec4899' },
      ],
    },
  },
  {
    name: 'Vlog',
    config: {
      style: 'gradient',
      chapters: [
        { id: '1', name: '开场', duration: 15, color: '#f97316' },
        { id: '2', name: 'Part 1', duration: 30, color: '#fb923c' },
        { id: '3', name: 'Part 2', duration: 35, color: '#fbbf24' },
        { id: '4', name: '结尾', duration: 20, color: '#facc15' },
      ],
    },
  },
  {
    name: '游戏视频',
    config: {
      style: 'neon',
      chapters: [
        { id: '1', name: 'INTRO', duration: 10, color: '#06b6d4' },
        { id: '2', name: 'GAMEPLAY', duration: 60, color: '#0ea5e9' },
        { id: '3', name: 'HIGHLIGHTS', duration: 20, color: '#3b82f6' },
        { id: '4', name: 'OUTRO', duration: 10, color: '#6366f1' },
      ],
      backgroundColor: '#0a0a0f',
    },
  },
  {
    name: '产品评测',
    config: {
      style: 'glass',
      chapters: [
        { id: '1', name: '外观', duration: 20, color: '#10b981' },
        { id: '2', name: '性能', duration: 30, color: '#14b8a6' },
        { id: '3', name: '体验', duration: 30, color: '#06b6d4' },
        { id: '4', name: '总结', duration: 20, color: '#0ea5e9' },
      ],
    },
  },
  {
    name: '音乐MV',
    config: {
      style: 'gradient',
      chapters: [
        { id: '1', name: '前奏', duration: 15, color: '#e11d48' },
        { id: '2', name: '主歌', duration: 25, color: '#f43f5e' },
        { id: '3', name: '副歌', duration: 30, color: '#fb7185' },
        { id: '4', name: '间奏', duration: 10, color: '#fda4af' },
        { id: '5', name: '尾声', duration: 20, color: '#fecdd3' },
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
      chapters: preset.config.chapters as Chapter[],
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
                <p className="text-xs text-gray-400 hidden sm:block">为视频创作者打造的章节进度条工具</p>
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
