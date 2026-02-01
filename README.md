# 🎭 AR角色展示系统

一个基于 React + Three.js 的 AR 角色展示平台，支持 VRM 模型加载、MMD 动作播放、骨骼编辑和交互式教程。

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB.svg)
![Three.js](https://img.shields.io/badge/Three.js-r160-000000.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ 功能特性

### 🎨 核心功能

- **VRM 模型支持** - 加载和展示 VRM 格式的 3D 角色模型
- **MMD 动作系统** - 150+ 个精心设计的动作，支持 6 大分类
- **AR 模式** - 支持 WebXR 的增强现实体验
- **骨骼编辑器** - 可视化编辑角色骨骼，支持 19 个关键骨骼
- **播放列表** - 创建和播放自定义动作序列

### 🎬 MMD 动作系统

#### 动作分类（150个动作）

| 分类 | 数量 | 描述 |
|------|------|------|
| 🎭 **基础动作** | 30个 | 挥手、鞠躬、跳跃、转身等日常动作 |
| 💃 **舞蹈动作** | 30个 | 流行舞蹈、宅舞、街舞等 |
| 😊 **表情动作** | 30个 | 开心、害羞、眨眼、飞吻等表情 |
| 😎 **帅气动作** | 25个 | 战斗姿势、变身、拔刀等酷炫动作 |
| ✨ **特殊动作** | 15个 | 魔法、飞行、变身等特殊效果 |
| 💕 **涩涩动作** | 20个 | 性感、诱惑、妩媚等成熟向动作 |

#### 动作特点

- **非随机生成** - 每个动作都有独特的骨骼运动数据
- **流畅过渡** - 支持 7 种缓动函数（线性、缓入、缓出、弹性、弹跳等）
- **精确控制** - 可调节播放速度、循环模式、混合权重
- **实时预览** - 即时查看动作效果

### 🖐️ 交互系统

#### 手势支持

| 手势 | 移动端 | 桌面端 | 功能 |
|------|--------|--------|------|
| **单击** | 单指点击 | 鼠标左键 | 选择、触发动作 |
| **双击** | 双指快速点击 | 双击 | 切换模式、特殊动作 |
| **长按** | 按住不放 | 右键按住 | 打开菜单、连续动作 |
| **拖动** | 单指滑动 | 左键拖动 | 旋转视角、移动角色 |
| **捏合** | 双指缩放 | 滚轮 | 缩放视角 |
| **旋转** | 双指旋转 | Shift+拖动 | 旋转角色 |

#### 三种交互模式

1. **浏览模式** 🎯
   - 单击：播放随机动作
   - 双击：切换动作分类
   - 长按：打开动作面板
   - 拖动：旋转视角

2. **编辑模式** ✏️
   - 单击：选择骨骼
   - 拖动：调整骨骼位置
   - 双击：重置骨骼
   - 捏合：缩放视图

3. **AR 模式** 📱
   - 单击：放置角色
   - 拖动：移动角色位置
   - 捏合：缩放角色
   - 长按：打开 AR 菜单

### 🎓 交互式教程

首次进入应用时，系统会自动启动交互式教程：

- **13步引导流程** - 从基础操作到高级功能
- **手势演示** - 动画展示每种手势的操作方式
- **实践练习** - 在引导中实际操作学习
- **设备适配** - 自动检测移动端/桌面端显示相应提示
- **随时重学** - 设置中可随时重新启动教程

### 🛠️ 骨骼编辑器

- **19个可编辑骨骼** - 头部、躯干、四肢、手指等
- **可视化操控** - 3D 控件直接操作
- **实时预览** - 即时查看调整效果
- **撤销/重做** - 支持操作历史
- **预设姿势** - 快速应用常用姿势

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0
- 现代浏览器（Chrome/Firefox/Safari/Edge）
- WebGL 支持

### 安装

```bash
# 克隆项目
git clone https://github.com/yourusername/ar-character-system.git
cd ar-character-system

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
```

## 📖 使用指南

### 加载角色

1. 点击右上角的 "+" 按钮
2. 选择本地 VRM 文件或输入 URL
3. 等待模型加载完成

### 播放动作

1. 点击底部动作面板
2. 选择动作分类标签
3. 点击任意动作即可播放
4. 使用播放列表创建动作序列

### 编辑骨骼

1. 切换到编辑模式
2. 点击角色身上的骨骼点
3. 使用 3D 控件调整位置/旋转
4. 点击保存或重置

### AR 模式

1. 点击 AR 按钮进入 AR 模式
2. 允许摄像头权限
3. 点击屏幕放置角色
4. 使用手势调整角色位置和大小

## 🏗️ 项目结构

```
ar-character-system/
├── src/
│   ├── components/          # React 组件
│   │   ├── ARSystem.jsx     # AR 系统主组件
│   │   ├── CharacterSystem.jsx  # 角色系统
│   │   ├── MMDActionPanel.jsx   # 动作面板
│   │   ├── BoneEditor.jsx       # 骨骼编辑器
│   │   ├── PlaylistPanel.jsx    # 播放列表
│   │   ├── InteractiveTutorial.jsx  # 交互教程
│   │   └── ...
│   ├── hooks/               # 自定义 Hooks
│   │   ├── useVRM.js        # VRM 模型管理
│   │   ├── useMMD.js        # MMD 动作管理
│   │   ├── useUnifiedInteraction.js  # 统一交互
│   │   └── ...
│   ├── data/                # 数据文件
│   │   ├── mmdActionData.js         # 基础动作数据
│   │   └── mmdActionDataExtended.js # 扩展动作数据
│   ├── utils/               # 工具函数
│   │   ├── actionParser.js  # 动作解析器
│   │   ├── vrmLoader.js     # VRM 加载器
│   │   └── ...
│   ├── styles/              # 样式文件
│   └── App.jsx              # 应用入口
├── public/                  # 静态资源
├── docs/                    # 文档
└── package.json
```

## 🛠️ 技术栈

- **框架**: React 18 + Vite
- **3D 渲染**: Three.js + React Three Fiber
- **VRM 支持**: @pixiv/three-vrm
- **动画**: @pixiv/three-vrm-animation
- **UI 组件**: Material-UI
- **状态管理**: Zustand
- **手势识别**: 自定义 Pointer Events 实现

## 📝 更新日志

### v2.0.0 (2024-XX-XX)

#### 新增
- 🎉 全新 MMD 动作系统，150个独特动作
- 🎓 交互式新手教程，13步引导流程
- 💕 新增涩涩动作分类，20个性感动作
- 🖐️ 统一交互系统，支持6种手势
- 📱 移动端手势优化

#### 修复
- 修复 MMD 播放位置错误
- 修复触摸模式冲突
- 修复播放列表无法播放
- 修复骨骼编辑器滑动问题
- 修复鼠标交互逻辑

#### 优化
- 动作数据驱动化，非随机生成
- 交互系统重构，支持 Pointer Events
- 移动端适配优化
- 性能优化

## 🤝 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Three.js](https://threejs.org/) - 3D 渲染引擎
- [@pixiv/three-vrm](https://github.com/pixiv/three-vrm) - VRM 支持
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) - React 3D 渲染

## 📮 联系方式

如有问题或建议，欢迎提交 Issue 或联系开发者。

---

Made with ❤️ by AR Character System Team
