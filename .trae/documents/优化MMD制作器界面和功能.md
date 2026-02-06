## 方案概述

加入摄像机设定确实需要较大改动，但这是值得的，因为摄像机是视频制作的核心。

***

## 一、摄像机系统（核心改动）

### 1. 摄像机轨道类型

新增 `camera` 轨道类型，支持：

* **关键帧动画**：位置、旋转、FOV的关键帧插值

* **预设机位**：前/后/左/右/顶/45度角等快速选择

* **跟随模式**：自动跟随角色移动

* **轨道模式**：围绕角色旋转拍摄

### 2. 摄像机控制器

```javascript
// 新增 CameraController 组件
- 实时预览摄像机运动
- 支持鼠标拖拽调整机位
- 显示摄像机视锥辅助线
- 多摄像机切换（主摄/辅摄）
```

### 3. 摄像机编辑界面

* 时间轴上显示摄像机关键帧

* 关键帧编辑器（位置XYZ、旋转XYZ、FOV、景深）

* 曲线编辑器调整运动缓动

***

## 二、界面优化（之前的需求）

### 1. 添加轨道下拉动画

* 平滑展开/收起动画

* 毛玻璃背景效果

* 图标+文字轨道类型选择

### 2. 预览界面修复

* 修复缩放按钮显示

* 添加画布分辨率设置

* 默认缩小到20%

### 3. 位置路径画布选择

* 点击画布设置坐标点

* 实时路径预览

***

## 三、专业功能增强

### 1. 时间轴增强

* 关键帧标记

* 片段复制/粘贴

* 多选批量操作

* 撤销/重做（Ctrl+Z/Y）

### 2. 渲染设置

* 分辨率预设（480p/720p/1080p/4K）

* 帧率选择（24/30/60fps）

* 输出格式（MP4/WebM/GIF）

* 码率设置

### 3. 音效系统

* 多音轨支持

* 音量包络线编辑

* 淡入淡出效果

### 4. 特效系统

* 粒子效果（樱花、雪花、星光）

* 后处理效果（Bloom、景深、色调映射）

* 灯光控制

***

## 四、改动评估

### 需要修改的文件：

1. `index.jsx` - 添加摄像机轨道处理
2. `Timeline.jsx` - 添加摄像机关键帧显示
3. `trackTypes.js` - 添加camera类型
4. `CellEditModal.jsx` - 添加摄像机编辑器
5. 新增 `CameraController.jsx` - 摄像机控制组件
6. 新增 `CameraEditor.jsx` - 摄像机编辑界面
7. 新增 `RenderSettings.jsx` - 渲染设置面板

### 改动复杂度：⭐⭐⭐⭐（4/5）

* 摄像机系统需要重构预览渲染逻辑

* 需要添加关键帧插值算法

* 需要同步更新轨道数据结构

### 预计工作量：2-3天

***

## 五、实施建议

**方案A：分阶段实施（推荐）**

1. 第一阶段：界面优化 + 基础摄像机（1天）
2. 第二阶段：摄像机关键帧动画（1天）
3. 第三阶段：渲染设置 + 特效（1天）

**方案B：一次性完成**

* 全部功能一起开发（2-3天）

* 风险较高，但功能完整

***

## 六、技术要点

### 摄像机关键帧插值

```javascript
// 示例：摄像机位置插值
const interpolateCamera = (time, keyframes) => {
  const prev = findPrevKeyframe(time, keyframes)
  const next = findNextKeyframe(time, keyframes)
  const t = (time - prev.time) / (next.time - prev.time)
  
  // 支持多种缓动函数
  const easedT = easingFunctions[prev.easing](t)
  
  return {
    position: lerpVector3(prev.position, next.position, easedT),
    rotation: slerpQuaternion(prev.rotation, next.rotation, easedT),
    fov: lerp(prev.fov, next.fov, easedT)
  }
}
```

### 轨道数据结构扩展

```javascript
// 新增摄像机片段数据
{
  type: 'camera',
  clips: [{
    data: {
      keyframes: [
        { time: 0, position: {...}, rotation: {...}, fov: 60 },
        { time: 5, position: {...}, rotation: {...}, fov: 45 }
      ],
      easing: 'easeInOut'
    }
  }]
}
```

***

**请确认采用哪个方案，我将开始实施。**
