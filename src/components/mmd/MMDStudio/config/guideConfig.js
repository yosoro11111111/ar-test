/**
 * 引导配置 - 可自定义引导步骤
 */

// 默认引导配置
export const defaultGuideConfig = {
  enabled: true,
  storageKey: 'mmd-studio-guide-seen',
  steps: [
    {
      id: 'welcome',
      title: '欢迎使用 MMD Studio',
      content: '这是一个全新的MMD制作工具，让你可以轻松创建3D动画。',
      icon: '🎬',
      position: 'center'
    },
    {
      id: 'character',
      title: '选择角色',
      content: '在左侧资源面板，点击"网络资源"按钮从网络加载VRM角色，或从资源库中选择。',
      icon: '👤',
      position: 'left'
    },
    {
      id: 'prop',
      title: '添加道具',
      content: '切换到"道具"标签，可以添加GLB格式的道具模型到场景中。',
      icon: '📦',
      position: 'left'
    },
    {
      id: 'scene',
      title: '设置场景',
      content: '选择视频、图片或GLB作为背景场景。',
      icon: '🎬',
      position: 'left'
    },
    {
      id: 'timeline',
      title: '编辑动画',
      content: '在底部时间轴添加动作片段，调整角色位置和摄像机。',
      icon: '⏱️',
      position: 'bottom'
    },
    {
      id: 'export',
      title: '导出作品',
      content: '完成后可以导出为视频、GIF或项目文件。',
      icon: '💾',
      position: 'center'
    }
  ]
}

// 网络资源配置
export const networkResourceConfig = {
  // 预设资源URL
  presets: {
    characters: [
      { name: '示例角色1', url: 'https://example.com/characters/sample1.vrm' },
      { name: '示例角色2', url: 'https://example.com/characters/sample2.vrm' },
    ],
    props: [
      { name: '剑', url: 'https://example.com/props/sword.glb' },
      { name: '盾', url: 'https://example.com/props/shield.glb' },
      { name: '椅子', url: 'https://example.com/props/chair.glb' },
    ],
    scenes: [
      { name: '简单房间', url: 'https://example.com/scenes/simple_room.glb' },
      { name: '舞台', url: 'https://example.com/scenes/stage.glb' },
    ],
    motions: [
      { name: '待机', url: 'https://example.com/motions/idle.vrma' },
      { name: '走路', url: 'https://example.com/motions/walk.vrma' },
      { name: '跑步', url: 'https://example.com/motions/run.vrma' },
    ]
  },
  
  // 支持的最大文件大小 (MB)
  maxFileSize: 100,
  
  // 超时时间 (毫秒)
  timeout: 30000,
  
  // 允许的文件类型
  allowedTypes: {
    characters: ['.vrm'],
    props: ['.glb', '.gltf'],
    scenes: ['.glb', '.gltf', '.mp4', '.webm', '.jpg', '.jpeg', '.png'],
    motions: ['.vrma', '.bvh'],
    music: ['.mp3', '.wav', '.ogg']
  }
}

// 提示配置
export const tipsConfig = {
  enabled: true,
  interval: 10000, // 切换间隔 (毫秒)
  tips: [
    { id: 1, text: '💡 按 Ctrl+S 快速保存项目' },
    { id: 2, text: '💡 从网络加载资源时会有进度条显示' },
    { id: 3, text: '💡 右键点击片段可快速编辑' },
    { id: 4, text: '💡 使用滚轮缩放时间轴' },
    { id: 5, text: '💡 支持导入 .ymmdpack 项目文件' },
    { id: 6, text: '💡 可以导出为视频、GIF或帧序列' },
  ]
}

// 从localStorage加载配置
export function loadGuideConfig() {
  try {
    const saved = localStorage.getItem('mmd-studio-guide-config')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('加载引导配置失败:', e)
  }
  return defaultGuideConfig
}

// 保存配置到localStorage
export function saveGuideConfig(config) {
  try {
    localStorage.setItem('mmd-studio-guide-config', JSON.stringify(config))
  } catch (e) {
    console.error('保存引导配置失败:', e)
  }
}

// 重置引导状态（重新显示引导）
export function resetGuideStatus() {
  localStorage.removeItem(defaultGuideConfig.storageKey)
}

// 检查是否应该显示引导
export function shouldShowGuide() {
  const config = loadGuideConfig()
  if (!config.enabled) return false
  
  const hasSeen = localStorage.getItem(config.storageKey)
  return !hasSeen
}
