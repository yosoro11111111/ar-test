# VRM模型压缩优化方案

## 项目现状分析

从代码审查中发现：
1. **模型文件**：约140个VRM模型，每个模型可能在5-30MB不等
2. **动作文件**：约400+个VRMA动作文件
3. **当前优化工具**：已有 `modelOptimizer.js` 和 `useOptimizedModelLoader.js`，但主要用于运行时优化
4. **内存问题**：模型文件过大导致加载慢、内存占用高

## 优化方案

### 阶段一：VRM模型预处理压缩（推荐优先实施）

**目标**：在不改变动作文件的前提下，大幅减小VRM模型体积

#### 1.1 创建模型压缩工具脚本

创建 `scripts/optimize-vrm.js`：
- 使用 `@pixiv/three-vrm` 加载VRM模型
- 应用以下优化：
  - **纹理压缩**：将纹理限制为1024x1024或512x512
  - **几何体简化**：使用LOD或顶点简化算法
  - **Draco压缩**：导出时使用Draco压缩GLB格式
  - **移除未使用数据**：清理扩展数据、元数据

#### 1.2 创建批量处理脚本

创建 `scripts/batch-optimize.js`：
- 遍历 `models/` 目录所有VRM文件
- 应用压缩优化
- 输出到 `models/optimized/` 目录
- 生成优化报告（压缩比、文件大小对比）

#### 1.3 预期压缩效果

| 优化项 | 原始大小 | 优化后 | 压缩比 |
|--------|----------|--------|--------|
| 纹理压缩(1024) | ~15MB | ~5MB | 66% |
| 纹理压缩(512) | ~15MB | ~2MB | 86% |
| Draco压缩 | ~5MB | ~1.5MB | 70% |
| 综合优化 | ~15MB | ~1-2MB | 85-90% |

### 阶段二：运行时动态加载优化

#### 2.1 分级加载策略

修改 `useOptimizedModelLoader.js`：
```javascript
// 添加分级加载配置
const QUALITY_LEVELS = {
  low: { textureSize: 512, simplifyRatio: 0.3 },    // 移动端/弱网
  medium: { textureSize: 1024, simplifyRatio: 0.6 }, // 默认
  high: { textureSize: 2048, simplifyRatio: 1.0 }    // 桌面端
}
```

#### 2.2 智能质量选择

根据设备性能自动选择加载质量：
- 检测 GPU 内存、设备类型
- 移动端自动使用 low 质量
- 桌面端使用 medium/high 质量

### 阶段三：内存管理优化

#### 3.1 模型缓存策略改进

```javascript
// 添加LRU缓存策略
class LRUModelCache {
  constructor(maxSize = 3) { // 最多缓存3个模型
    this.maxSize = maxSize
    this.cache = new Map()
  }
  
  // 当缓存满时，自动释放最久未使用的模型
  // 调用 dispose() 清理 Three.js 资源
}
```

#### 3.2 纹理内存管理

- 使用 `texture.dispose()` 及时释放纹理
- 限制同时加载的纹理数量
- 使用纹理图集(Texture Atlas)减少Draw Call

### 阶段四：动作文件优化（保持兼容性）

由于动作文件需要保持不变，采用以下策略：

#### 4.1 动作懒加载

```javascript
// 不预加载所有动作，按需加载
const loadAction = async (actionName) => {
  const cached = actionCache.get(actionName)
  if (cached) return cached
  
  const action = await fetch(`/motion/${actionName}.vrma`)
  actionCache.set(actionName, action)
  return action
}
```

#### 4.2 动作缓存池

- 限制同时缓存的动作数量（如最多20个）
- 使用LRU策略淘汰不常用动作

### 阶段五：CDN和分片加载

#### 5.1 模型分片加载

对于大模型，可以：
- 将模型拆分为多个LOD级别文件
- 先加载低精度版本快速显示
- 后台加载高精度版本并切换

#### 5.2 CDN加速

- 将模型文件托管到CDN
- 使用HTTP/2或HTTP/3多路复用
- 启用Gzip/Brotli压缩传输

## 实施步骤

### 第一步：创建模型压缩工具（1-2天）
1. 安装依赖：`@gltf-transform/core`, `@gltf-transform/extensions`, `draco3dgltf`
2. 创建 `scripts/optimize-vrm.js` 压缩脚本
3. 测试单个模型压缩效果

### 第二步：批量处理所有模型（1天）
1. 运行批量压缩脚本
2. 验证压缩后模型能正常加载和播放动作
3. 对比压缩前后文件大小

### 第三步：更新加载逻辑（1天）
1. 修改 `useOptimizedModelLoader.js` 支持分级加载
2. 添加设备性能检测
3. 实现智能质量选择

### 第四步：内存优化（1天）
1. 实现LRU缓存
2. 添加资源释放逻辑
3. 测试内存占用情况

### 第五步：验证和部署（1天）
1. 测试所有模型加载
2. 验证动作播放正常
3. 性能测试对比

## 预期效果

| 指标 | 优化前 | 优化后 | 改善 |
|------|--------|--------|------|
| 平均模型大小 | ~15MB | ~2MB | 87% ↓ |
| 首屏加载时间 | ~5s | ~1s | 80% ↓ |
| 内存占用 | ~500MB | ~150MB | 70% ↓ |
| 动作加载速度 | 正常 | 正常 | 无变化 |

## 代码变更文件清单

1. **新增文件**：
   - `scripts/optimize-vrm.js` - VRM压缩脚本
   - `scripts/batch-optimize.js` - 批量处理脚本
   - `src/utils/lruCache.js` - LRU缓存实现

2. **修改文件**：
   - `src/hooks/useOptimizedModelLoader.js` - 添加分级加载
   - `src/utils/modelOptimizer.js` - 增强优化功能
   - `package.json` - 添加压缩依赖

3. **生成文件**：
   - `models/optimized/*.vrm` - 压缩后的模型
   - `optimization-report.json` - 优化报告

请确认此方案后，我将开始实施具体的代码编写。