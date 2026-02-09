# MMD Studio V2 完整实现计划

基于 MMD_STUDIO_V2_DESIGN.md 设计文档，我将一次性实现完整的MMD制作器系统。

## 实现内容

### 1. 项目引导界面 (Onboarding)
- 启动页：新建项目 / 打开项目 / 导入资源包
- 3步向导：项目信息 → 导入资源包 → 资源确认
- 最近项目列表

### 2. 主布局框架 (5区域布局)
- 顶部导航栏：菜单 + 保存/导出/设置按钮
- 左侧面板：6个资源库（角色/道具/场景/动作/音乐/特效）
- 中央预览区：Three.js + VRM渲染
- 右侧面板：属性编辑（变换/材质/动画/物理/特效）
- 底部时间轴：6大轨道类型

### 3. 左侧面板 - 6个资源库
- 角色库：按游戏分类（原神119个/崩铁7个/其他）
- 道具库：按类别分类（武器/工具/装饰）
- 场景库：多背景层管理（GLB/图片/纯色/视频）
- 动作库：200+动作，中文显示，按类别分类
- 音乐库：BGM和音效管理
- 特效库：粒子和后处理效果

### 4. 中央3D预览区
- Three.js + @pixiv/three-vrm 渲染
- VRM角色加载和动画播放
- GLB场景/道具加载
- 多角色同时渲染
- 摄像机系统（含预览窗口）
- 后处理效果（辉光/景深/色调）

### 5. 底部时间轴（6大轨道）
- 场景轨道：多背景层管理
- 角色轨道：动作/变换/材质/表情子轨道
- 道具轨道：20个内置动画
- 摄像机轨道：机位和运动
- 特效轨道：画面效果
- 音乐轨道：BGM和音效

### 6. 资源包系统 (.smmdpack)
- ZIP格式资源包导入/导出
- manifest.json清单
- IndexedDB本地存储
- 资源包管理界面

### 7. 导出功能
- MP4视频导出（MediaRecorder）
- GIF动图导出
- 帧序列导出（PNG）
- 导出设置和进度显示

## 文件创建/修改清单

### 新建文件：
1. `src/components/mmd/MMDStudio/index.jsx` - 主入口组件
2. `src/components/mmd/MMDStudio/OnboardingWizard.jsx` - 项目引导向导
3. `src/components/mmd/MMDStudio/layout/MainLayout.jsx` - 主布局
4. `src/components/mmd/MMDStudio/panels/LeftPanel.jsx` - 左侧面板
5. `src/components/mmd/MMDStudio/panels/CenterPanel.jsx` - 中央预览区
6. `src/components/mmd/MMDStudio/panels/RightPanel.jsx` - 右侧面板
7. `src/components/mmd/MMDStudio/panels/TimelinePanel.jsx` - 底部时间轴
8. `src/components/mmd/MMDStudio/modals/ResourceSelectorModal.jsx` - 资源选择器
9. `src/components/mmd/MMDStudio/modals/ExportModal.jsx` - 导出对话框
10. `src/components/mmd/MMDStudio/core/RenderEngine.js` - 渲染引擎
11. `src/components/mmd/MMDStudio/core/TimelineEngine.js` - 时间轴引擎
12. `src/components/mmd/MMDStudio/core/ResourceManager.js` - 资源管理器
13. `src/components/mmd/MMDStudio/core/ProjectManager.js` - 项目管理器

### 样式文件：
- 所有对应的 `.module.css` 文件

## 技术栈
- React 18 + Hooks
- Three.js + @pixiv/three-vrm + @pixiv/three-vrm-animation
- CSS Modules
- IndexedDB（本地存储）
- MediaRecorder API（视频导出）

## 实现顺序
1. 项目引导界面
2. 主布局框架
3. 左侧面板（6个资源库，使用真实assets.json）
4. 中央3D预览区（基础渲染）
5. 底部时间轴（6大轨道）
6. 右侧面板
7. 资源包系统
8. 导出功能
9. 验证测试

请确认此计划后，我将开始一次性实现所有功能。