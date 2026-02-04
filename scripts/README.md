# VRM模型压缩优化工具

这个目录包含了用于压缩和优化VRM模型的工具脚本。

## 文件说明

- `optimize-vrm.js` - 基础VRM压缩脚本
- `vrm-compressor.js` - 高级VRM压缩器（带详细统计）
- `batch-optimize.js` - 批量处理脚本

## 使用方法

### 1. 单个模型压缩

```bash
# 基础压缩
node optimize-vrm.js ../models/Aether.vrm ../models/optimized/Aether.vrm

# 高级压缩（带统计信息）
node vrm-compressor.js ../models/Aether.vrm ../models/optimized/Aether.vrm

# 指定纹理尺寸和质量
node vrm-compressor.js ../models/Aether.vrm ../models/optimized/Aether.vrm --max-texture-size 512 --quality 0.8
```

### 2. 批量压缩

```bash
# 查看将要处理的文件（模拟运行）
node batch-optimize.js --dry-run

# 批量处理所有模型
node batch-optimize.js

# 指定配置
node batch-optimize.js --max-texture-size 512 --quality 0.85 --concurrent 2
```

### 3. 批量处理选项

```bash
node batch-optimize.js [options]

选项:
  --input-dir <path>      输入目录 (默认: ../models)
  --output-dir <path>     输出目录 (默认: ../models/optimized)
  --max-texture-size <n>  最大纹理尺寸 (默认: 1024)
  --quality <n>           纹理质量 0-1 (默认: 0.9)
  --concurrent <n>        并发数 (默认: 3)
  --dry-run               仅显示将要处理的文件，不实际执行
```

## 压缩效果

### 预期压缩率

| 优化项 | 原始大小 | 优化后 | 压缩比 |
|--------|----------|--------|--------|
| 纹理压缩(1024) | ~15MB | ~5MB | 66% |
| 纹理压缩(512) | ~15MB | ~2MB | 86% |
| 综合优化 | ~15MB | ~1-2MB | 85-90% |

### 质量等级

- **Low (低)**: 512px纹理，简化50%顶点，无阴影 - 适合移动端
- **Medium (中)**: 1024px纹理，简化20%顶点，有阴影 - 适合桌面端
- **High (高)**: 2048px纹理，不简化顶点，完整效果 - 适合高端设备

## 前端使用

### 使用优化后的模型

```javascript
import { useOptimizedModelLoader } from '../hooks/useOptimizedModelLoader'

function MyComponent() {
  const { 
    loadModel, 
    setQualityLevel,
    loadingState,
    QUALITY_LEVELS 
  } = useOptimizedModelLoader()

  // 设置质量等级
  setQualityLevel('low') // 或 'medium', 'high'

  // 加载模型
  const handleLoad = async () => {
    const result = await loadModel(
      { localPath: '/models/optimized/Aether.vrm' },
      {
        onProgress: (p) => console.log(`加载进度: ${p}%`),
        onComplete: (data) => console.log('加载完成', data),
        onError: (e) => console.error('加载失败', e)
      }
    )
  }
}
```

### 渐进式加载

```javascript
// 先加载低质量版本，后台加载高质量版本
const result = await loadModelProgressive(
  { localPath: '/models/Aether.vrm' },
  {
    onComplete: (data) => {
      // 先显示低质量模型
      setModel(data.scene)
    }
  }
)
```

## 注意事项

1. **动作兼容性**: 压缩脚本保留了VRM的骨骼结构和元数据，确保VRMA动作文件可以正常播放
2. **纹理质量**: 建议根据目标设备选择合适的纹理尺寸
3. **批量处理**: 处理大量模型时，建议先使用 `--dry-run` 查看将要处理的文件
4. **内存管理**: 使用 `useOptimizedModelLoader` 的 LRU 缓存自动管理内存

## 优化报告

批量处理后会生成 `optimization-report.json` 文件，包含详细的压缩统计信息。

## 故障排除

### 内存不足
- 减少 `--concurrent` 并发数
- 使用更小的 `--max-texture-size`

### 压缩后模型显示异常
- 检查原始模型是否完整
- 尝试使用 `--quality 0.95` 提高质量
- 避免使用 `--simplify` 简化几何体

### 动作播放异常
- 确保保留了VRM元数据
- 检查骨骼权重是否正确
- 使用原始VRM文件对比测试
