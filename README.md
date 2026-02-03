# Aetheris - AR 角色展示系统

一个基于 React + Three.js 的 VRM 角色展示平台，支持多角色管理、VRMA 动作播放、时间轴编辑、GIF/视频录制等功能。1

## ✨ 功能特性

### 🎭 核心功能

- **VRM 模型加载** - 支持加载本地或远程 VRM 格式 3D 角色模型
- **多角色管理** - 同时展示多个角色，支持拖拽调整位置
- **VRMA 动作系统** - 支持 VRMA 格式动作文件，丰富的动作库
- **时间轴编辑器** - 可视化编排动作序列，支持预设管理
- **GIF/视频录制** - 录制角色动画，支持自动下载
- **骨骼编辑** - 可视化编辑角色骨骼姿态
- **场景特效** - 支持多种舞台特效
- **底部栏折叠** - 移动端/桌面端支持菜单栏折叠

### 🎬 时间轴编辑器

- **可视化时间轴** - 添加、删除、调整动作时间和顺序
- **动作预设** - 内置常用动作组合，支持导入/导出 YMMD 格式
- **实时播放** - 播放时间轴查看效果，支持暂停/继续/停止
- **录制功能** - 录制时间轴动画为 GIF 或视频

#### 录制规格

| 格式 | 分辨率 | 帧率 | 特点 |
|------|--------|------|------|
| **GIF** | 最高 640px | 15fps | WebM 格式，自动下载 |
| **视频** | 原始分辨率 | 30fps | 高清录制，含音频 |

### 🎭 动作系统

- **平滑过渡** - 动作切换时保持当前姿态，避免突兀重置
- **分类浏览** - 动作按类别分类，方便查找
- **实时预览** - 点击即可播放动作
- **时间轴编排** - 可视化编排复杂动作序列

### 🖐️ 交互系统

- **角色拖拽** - 拖拽移动角色位置
- **视角控制** - 旋转、缩放视角
- **底部栏折叠** - 移动端底部菜单可折叠，桌面端右侧菜单可折叠

### 🛠️ 角色管理

- **多角色支持** - 同时加载多个 VRM 角色
- **位置调整** - 拖拽调整角色位置
- **姿态编辑** - 可视化骨骼编辑
- **角色切换** - 快速切换当前操作角色

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- 现代浏览器（Chrome/Firefox/Edge）
- WebGL 支持

### 安装

```bash
# 克隆项目
git clone https://github.com/yosoro11111111/ar-test.git
cd ar-test

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 构建

```bash
# 生产构建
npm run build

# 预览生产构建
npm run preview

# 部署到 GitHub Pages
npm run deploy
```

## 📖 使用指南

### 加载角色

1. 点击 "人物管理" 按钮
2. 点击 "添加角色"
3. 选择本地 VRM 文件或输入 URL
4. 等待模型加载完成

### 使用时间轴编辑器

1. 点击 "时间轴" 按钮打开编辑器
2. 切换到 "时间轴" 页签
3. 点击 "添加动作" 选择动作
4. 调整动作开始时间和持续时间
5. 点击 "播放" 预览效果
6. 切换到 "录制" 页签录制 GIF/视频

### 播放动作

1. 点击底部动作面板
2. 选择动作分类
3. 点击任意动作即可播放

### 编辑骨骼

1. 点击 "骨骼编辑" 按钮
2. 点击角色身上的骨骼点
3. 使用控件调整旋转
4. 点击 "应用到角色" 保存

### 录制动画

1. 在时间轴编辑器中添加动作
2. 切换到 "录制" 页签
3. 点击 "录制 GIF" 或 "录制视频"
4. 等待录制完成，文件自动下载

## 🏗️ 项目结构

```
ar-test/
├── src/
│   ├── components/              # React 组件
│   │   ├── ARSystem.jsx         # AR 系统主组件
│   │   ├── CharacterSystem.jsx  # 角色系统
│   │   ├── CharacterManager.jsx # 角色管理
│   │   ├── BoneEditor.jsx       # 骨骼编辑器
│   │   ├── StageEffects.jsx     # 舞台特效
│   │   ├── ActionPanel.jsx      # 动作面板
│   │   ├── PosePanel.jsx        # 姿势面板
│   │   ├── features/            # 功能组件
│   │   │   └── timeline/        # 时间轴编辑器
│   │   │       ├── TimelineEditor.jsx
│   │   │       ├── RecordingManager.js
│   │   │       └── TimelineEditor.css
│   │   ├── layout/              # 布局组件
│   │   │   ├── MainLayout.jsx
│   │   │   ├── MobileBottomNav.jsx
│   │   │   └── FloatingControlBall.jsx
│   │   └── ui/                  # UI 组件
│   │       ├── ButtonPanel.jsx
│   │       └── ShortcutHelp.jsx
│   ├── stores/                  # 状态管理 (Zustand)
│   │   ├── actionStore.js
│   │   └── uiStore.js
│   ├── data/                    # 数据文件
│   │   ├── actionPresets.js     # 动作预设
│   │   └── vrmaActions.js       # VRMA 动作数据
│   ├── utils/                   # 工具函数
│   │   └── omggif.js            # GIF 编码
│   └── App.jsx                  # 应用入口
├── public/                      # 静态资源
└── package.json
```

## 🛠️ 技术栈

- **框架**: React 18 + Vite
- **3D 渲染**: Three.js + React Three Fiber
- **VRM 支持**: @pixiv/three-vrm + @pixiv/three-vrm-animation
- **状态管理**: Zustand
- **动画**: Framer Motion
- **录制**: MediaRecorder API + omggif

## 📝 更新日志

### v2.0.0 (2025-02-03)

#### 新增
- 🎉 **时间轴编辑器** - 可视化编排动作序列
- 🎬 **GIF/视频录制** - 高清录制角色动画
- 📹 **动作预设系统** - 保存和加载常用动作组合
- 📱 **底部栏折叠** - 移动端/桌面端菜单栏折叠
- 🎞️ **VRMA 动作支持** - 完整的 VRMA 动作系统
- 🎭 **动作平滑过渡** - 动作切换时保持当前姿态

#### 优化
- 🚀 **录制性能** - 高清录制，自动下载
- 📱 **移动端适配** - 底部栏折叠优化
- 🎨 **界面优化** - 时间轴菜单集成录制功能

## 🤝 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

MIT License

## 🙏 致谢

- [Three.js](https://threejs.org/) - 3D 渲染引擎
- [@pixiv/three-vrm](https://github.com/pixiv/three-vrm) - VRM 支持
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) - React 3D 渲染

---

Made with ❤️ by Aetheris Team
