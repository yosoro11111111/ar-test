// 动作预设系统 - 引用现有动作文件
// import manifest from '../../../public/motion/manifest.json'

// 模拟manifest数据（因为实际文件可能不存在）
const manifest = {
  files: [
    'idle.vrma',
    'walk.vrma',
    'run.vrma',
    'jump.vrma',
    'dance.vrma',
    'wave.vrma',
    'sit.vrma',
    'stand.vrma',
    'happy.vrma',
    'sad.vrma'
  ]
}

// 解析动作文件名，提取动作信息
const parseActionName = (filename) => {
  // 移除.vrma后缀和序号
  const baseName = filename
    .replace('.vrma', '')
    .replace(/\s*\(\d+\)\s*$/, '')
    .trim()

  // 分类关键词
  const categories = {
    dance: ['dance', 'dancing', 'ballet', 'hip hop', 'bellydance', 'bboy', 'breakdance'],
    fight: ['punch', 'kick', 'boxing', 'fight', 'block', 'attack', 'combat'],
    sport: ['baseball', 'workout', 'squat', 'running', 'jump', 'sprint'],
    gesture: ['gesture', 'pointing', 'shaking hands', 'whatever', 'asking'],
    idle: ['idle', 'standing', 'waiting'],
    movement: ['turn', 'walk', 'run', 'move', 'roll', 'rotation'],
    emotion: ['happy', 'angry', 'tenderly', 'threatening', 'rejected'],
    action: ['aiming', 'shooting', 'blocking', 'catching', 'holding']
  }

  const lowerName = baseName.toLowerCase()
  const matchedCategories = []

  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some(kw => lowerName.includes(kw))) {
      matchedCategories.push(cat)
    }
  }

  return {
    id: filename,
    filename,
    name: baseName,
    category: matchedCategories[0] || 'other',
    categories: matchedCategories,
    url: `/motion/${encodeURIComponent(filename)}`
  }
}

// 获取所有动作列表
export const getAllActions = () => {
  return manifest.files.map(parseActionName)
}

// 按分类获取动作
export const getActionsByCategory = () => {
  const actions = getAllActions()
  const categories = {}

  actions.forEach(action => {
    const cat = action.category
    if (!categories[cat]) {
      categories[cat] = []
    }
    // 去重 - 只保留基础名称
    const exists = categories[cat].find(a => a.name === action.name)
    if (!exists) {
      categories[cat].push(action)
    }
  })

  return categories
}

// 搜索动作
export const searchActions = (query) => {
  if (!query) return getAllActions()

  const lowerQuery = query.toLowerCase()
  return getAllActions().filter(action =>
    action.name.toLowerCase().includes(lowerQuery) ||
    action.categories.some(cat => cat.includes(lowerQuery))
  )
}

// 动作预设数据结构
export const createActionPreset = (name, description = '') => ({
  id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  name,
  description,
  actions: [], // { actionId, actionData, startTime, duration, transition }
  createdAt: Date.now(),
  updatedAt: Date.now()
})

// 添加动作到预设
export const addActionToPreset = (preset, action, startTime = 0, duration = null) => {
  const actionDuration = duration || action.duration || 2

  return {
    ...preset,
    actions: [
      ...preset.actions,
      {
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        actionId: action.id,
        actionData: action,
        startTime,
        duration: actionDuration,
        transition: 'fade' // fade, immediate, blend
      }
    ],
    updatedAt: Date.now()
  }
}

// 从预设中移除动作
export const removeActionFromPreset = (preset, actionInstanceId) => {
  return {
    ...preset,
    actions: preset.actions.filter(a => a.id !== actionInstanceId),
    updatedAt: Date.now()
  }
}

// 重新排序预设中的动作
export const reorderPresetActions = (preset, newOrder) => {
  return {
    ...preset,
    actions: newOrder.map(id => preset.actions.find(a => a.id === id)),
    updatedAt: Date.now()
  }
}

// 计算预设总时长
export const calculatePresetDuration = (preset) => {
  if (!preset.actions.length) return 0

  let maxEndTime = 0
  preset.actions.forEach(action => {
    const endTime = action.startTime + action.duration
    if (endTime > maxEndTime) {
      maxEndTime = endTime
    }
  })

  return maxEndTime
}

// 自动排列动作时间（顺序播放）
export const autoArrangeActions = (preset, gap = 0.5) => {
  let currentTime = 0
  const arrangedActions = preset.actions.map(action => {
    const arranged = {
      ...action,
      startTime: currentTime
    }
    currentTime += action.duration + gap
    return arranged
  })

  return {
    ...preset,
    actions: arrangedActions,
    updatedAt: Date.now()
  }
}

// 预设分类标签
export const PRESET_TAGS = [
  { id: 'dance', name: '舞蹈', icon: '💃', color: '#f093fb' },
  { id: 'fight', name: '战斗', icon: '🥊', color: '#fa709a' },
  { id: 'sport', name: '运动', icon: '⚽', color: '#4facfe' },
  { id: 'gesture', name: '手势', icon: '👋', color: '#43e97b' },
  { id: 'idle', name: '待机', icon: '🧍', color: '#a8edea' },
  { id: 'movement', name: '移动', icon: '🏃', color: '#fee140' },
  { id: 'emotion', name: '情感', icon: '😊', color: '#d299c2' },
  { id: 'action', name: '动作', icon: '🎯', color: '#667eea' },
  { id: 'other', name: '其他', icon: '📦', color: '#888' }
]

// 本地存储预设
const STORAGE_KEY = 'mmd_action_presets'

export const savePresetsToStorage = (presets) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
  } catch (e) {
    console.error('保存预设失败:', e)
  }
}

export const loadPresetsFromStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    console.error('加载预设失败:', e)
    return []
  }
}

// 导出预设为JSON
export const exportPresetToJSON = (preset) => {
  return JSON.stringify(preset, null, 2)
}

// 从JSON导入预设
export const importPresetFromJSON = (jsonString) => {
  try {
    const preset = JSON.parse(jsonString)
    // 验证必要字段
    if (!preset.name || !Array.isArray(preset.actions)) {
      throw new Error('无效的预设格式')
    }
    // 重新生成ID
    return {
      ...preset,
      id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  } catch (e) {
    console.error('导入预设失败:', e)
    return null
  }
}
