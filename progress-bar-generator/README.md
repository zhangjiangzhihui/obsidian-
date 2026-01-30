# 章节进度条生成器 | Chapter Progress Bar Generator

为视频创作者打造的**章节进度条**素材生成工具。轻松创建带有章节标记和名称的精美视频进度条动画。

![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Vite](https://img.shields.io/badge/Vite-7-purple)

## 在线体验

🔗 **[立即使用](https://zhangjiangzhihui.github.io/obsidian-/)**

## 功能特性

### 多种精美样式

- **现代风格** - 简洁现代，渐变高亮
- **极简风格** - 纯净简约，突出内容
- **霓虹风格** - 赛博朋克，发光效果
- **玻璃风格** - 毛玻璃质感，通透
- **渐变风格** - 彩虹渐变，活力四射

### 章节管理

- 自由添加/删除章节
- 自定义章节名称和时长占比
- 为每个章节设置独立颜色
- 快速配色方案一键应用
- 自动修正时长百分比

### 显示选项

- 章节名称位置：上方 / 内部 / 下方
- 分隔线显示开关
- 时间码显示
- 发光效果及强度调节

### 导出功能

- **PNG 序列** - 打包为 ZIP，适合 Premiere/After Effects/达芬奇
- **GIF 动画** - 方便快速预览和分享
- **单帧导出** - 导出当前帧为 PNG 图片

### 场景预设

底部工具栏提供 5 种常用场景预设：

- **教程视频** - 前言/准备/核心/总结/彩蛋
- **Vlog** - 开场/Part 1/Part 2/结尾
- **游戏视频** - INTRO/GAMEPLAY/HIGHLIGHTS/OUTRO
- **产品评测** - 外观/性能/体验/总结
- **音乐MV** - 前奏/主歌/副歌/间奏/尾声

## 快速开始

### 安装依赖

```bash
cd progress-bar-generator
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 使用指南

1. **选择样式** - 在左侧选择喜欢的进度条视觉风格
2. **编辑章节** - 添加章节，设置名称、时长占比和颜色
3. **调整显示** - 设置名称位置、分隔线、时间码等
4. **预览效果** - 点击播放按钮预览完整动画
5. **导出素材** - 选择合适的格式导出

### 在视频编辑软件中使用

1. 导出 PNG 序列（推荐）
2. 在 PR/AE/达芬奇中导入图片序列
3. 设置帧率与导出时一致（默认 30fps）
4. 将进度条放置在视频上层

## 技术栈

- **React 18** - 用户界面
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **Canvas API** - 进度条渲染
- **gif.js** - GIF 生成
- **JSZip** - PNG 序列打包
- **Lucide React** - 图标库

## 许可证

MIT License
