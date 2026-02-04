## 统一AR系统架构方案

### 核心设计理念
构建一个统一的AR系统，让摄像头模式和AR模式共享所有核心功能（动作、时间轴、录制等），只在渲染层做模式区分。

### 架构层次
1. **统一入口** - UnifiedARSystem.jsx（模式切换）
2. **共享Hook层** - useActions, useTimeline, useRecording等
3. **统一UI组件** - ActionPanel, TimelineEditor, RecordingControls
4. **模式特定渲染** - CameraARView, WebXRARView

### 实现阶段
- 阶段1：核心抽象层（2-3天）
- 阶段2：UI组件统一（2-3天）
- 阶段3：模式适配层（2-3天）
- 阶段4：测试优化（1-2天）

### 关键技术
- 状态管理：Zustand + Context
- 3D渲染：Three.js
- 动画系统：VRMA标准
- 录制：MediaRecorder

### 预期效果
- 功能一致性：两个模式功能完全相同
- 代码复用率：70%+
- 维护成本：大幅降低

请确认后我开始实现。