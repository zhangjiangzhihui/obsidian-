import { useState } from 'react';
import type { ProgressBarConfig } from './types';
import { DEFAULT_CONFIG } from './types';
import SettingsPanel from './components/SettingsPanel';
import PreviewPanel from './components/PreviewPanel';
import { Sparkles, Github, Menu, X } from 'lucide-react';

function App() {
  const [config, setConfig] = useState<ProgressBarConfig>(DEFAULT_CONFIG);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
                <h1 className="text-lg font-bold">进度条生成器</h1>
                <p className="text-xs text-gray-400 hidden sm:block">为视频创作者打造的进度条素材生成工具</p>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm text-gray-400 hover:text-white"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </a>
            </nav>
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
        <span className="text-xs text-gray-400 mr-2">快速预设:</span>
        <button
          onClick={() => setConfig({
            ...DEFAULT_CONFIG,
            style: 'line',
            progressColor: '#6366f1',
            backgroundColor: '#1a1a1a',
          })}
          className="px-3 py-1 rounded-full text-xs bg-[#252525] hover:bg-[#2a2a2a] transition-colors"
        >
          极简
        </button>
        <button
          onClick={() => setConfig({
            ...DEFAULT_CONFIG,
            style: 'gradient-line',
            progressColor: '#f43f5e',
            secondaryColor: '#fb923c',
            glowEffect: true,
          })}
          className="px-3 py-1 rounded-full text-xs bg-[#252525] hover:bg-[#2a2a2a] transition-colors"
        >
          霓虹
        </button>
        <button
          onClick={() => setConfig({
            ...DEFAULT_CONFIG,
            style: 'circle',
            width: 200,
            height: 200,
            strokeWidth: 12,
            progressColor: '#10b981',
            showPercentage: true,
            fontSize: 32,
          })}
          className="px-3 py-1 rounded-full text-xs bg-[#252525] hover:bg-[#2a2a2a] transition-colors"
        >
          圆形
        </button>
        <button
          onClick={() => setConfig({
            ...DEFAULT_CONFIG,
            style: 'wave',
            height: 80,
            progressColor: '#0ea5e9',
            secondaryColor: '#38bdf8',
          })}
          className="px-3 py-1 rounded-full text-xs bg-[#252525] hover:bg-[#2a2a2a] transition-colors"
        >
          波浪
        </button>
        <button
          onClick={() => setConfig({
            ...DEFAULT_CONFIG,
            style: 'dots',
            height: 60,
            progressColor: '#a855f7',
          })}
          className="px-3 py-1 rounded-full text-xs bg-[#252525] hover:bg-[#2a2a2a] transition-colors"
        >
          点阵
        </button>
      </div>
    </div>
  );
}

export default App;
