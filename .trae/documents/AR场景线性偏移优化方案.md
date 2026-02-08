## 问题分析

从日志看到：

* 平面1-3在同一深度层（Y=3）

* 平面4-5在另一层（Y=6）

* 所有平面水平放置（rotation.x=-90）

* 坐标乘法放大（×20）导致变形

## 优化方案

### 1. 渲染端：改用线性偏移（加法）

**当前问题：**

```javascript
// 乘法放大导致变形
x: worldPosition.x * 20  // 0.2变成4，0.5变成10，相对距离被拉大
```

**优化后：**

```javascript
// 加法偏移保持相对位置
const X_SPACING = 3   // 每平面水平间隔3米
const Z_OFFSET = 15   // 整体前移15米
const Y_LAYER_HEIGHT = 4  // 每层高度差4米

stagePosition = {
  x: index * X_SPACING,           // 水平排列：0, 3, 6, 9, 12
  y: Math.floor(index / 2) * Y_LAYER_HEIGHT,  // 垂直分层
  z: worldPosition.z + Z_OFFSET   // 整体前移
}
```

### 2. AR拍摄端：保存关键参数

**当前保存：**

* position, rotation, size

**应该增加：**

* 相机拍摄位置（cameraPosition）

* 参考距离（referenceDistance）

* 平面锚点（anchorPoints）

* 拍摄时间戳（用于排序）

### 3. 实施步骤

1. **修改渲染代码** (`index.jsx`)

   * 改用加法偏移

   * 水平排列 + 垂直分层

2. **修改AR拍摄代码** (`WebXRARSceneRecorder.jsx`)

   * 保存相机位置

   * 保存参考距离

   * 按拍摄顺序排序平面

3. **调整相机位置**

   * 根据新的平面位置计算最佳视角

### 预期效果

* 5个平面水平排列，不重叠

* 有垂直高度差，产生3D感

* 保持AR拍摄的相对位置关系

* 相机视角能看到所有平面

