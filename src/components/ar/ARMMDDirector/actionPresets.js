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

// 20个默认动作合集预设
export const DEFAULT_PRESETS = [
  {
    id: 'preset_dance_basic',
    name: '基础舞蹈合集',
    description: '包含基础舞蹈动作，适合初学者',
    actions: [
      { actionId: 'dance.vrma', actionData: { name: '舞蹈', category: 'dance' }, startTime: 0, duration: 3 },
      { actionId: 'wave.vrma', actionData: { name: '挥手', category: 'gesture' }, startTime: 3, duration: 2 },
      { actionId: 'happy.vrma', actionData: { name: '开心', category: 'emotion' }, startTime: 5, duration: 2 }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'preset_fight_combo',
    name: '战斗连击合集',
    description: '连续战斗动作组合',
    actions: [
      { actionId: 'fight.vrma', actionData: { name: '战斗', category: 'fight' }, startTime: 0, duration: 2 },
      { actionId: 'jump.vrma', actionData: { name: '跳跃', category: 'movement' }, startTime: 2, duration: 1.5 },
      { actionId: 'run.vrma', actionData: { name: '跑步', category: 'movement' }, startTime: 3.5, duration: 2 }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'preset_idle_various',
    name: '待机动作合集',
    description: '各种待机姿势',
    actions: [
      { actionId: 'idle.vrma', actionData: { name: '待机', category: 'idle' }, startTime: 0, duration: 3 },
      { actionId: 'stand.vrma', actionData: { name: '站立', category: 'idle' }, startTime: 3, duration: 2 },
      { actionId: 'sit.vrma', actionData: { name: '坐下', category: 'idle' }, startTime: 5, duration: 3 }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'preset_emotion_set',
    name: '情感表达合集',
    description: '丰富的情感表达动作',
    actions: [
      { actionId: 'happy.vrma', actionData: { name: '开心', category: 'emotion' }, startTime: 0, duration: 2 },
      { actionId: 'sad.vrma', actionData: { name: '悲伤', category: 'emotion' }, startTime: 2, duration: 2.5 },
      { actionId: 'wave.vrma', actionData: { name: '挥手', category: 'gesture' }, startTime: 4.5, duration: 1.5 }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'preset_sport_fitness',
    name: '健身运动合集',
    description: '健身相关动作',
    actions: [
      { actionId: 'run.vrma', actionData: { name: '跑步', category: 'sport' }, startTime: 0, duration: 3 },
      { actionId: 'jump.vrma', actionData: { name: '跳跃', category: 'sport' }, startTime: 3, duration: 1.5 },
      { actionId: 'walk.vrma', actionData: { name: '走路', category: 'movement' }, startTime: 4.5, duration: 2.5 }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'preset_greeting',
    name: '问候礼仪合集',
    description: '各种问候动作',
    actions: [
      { actionId: 'wave.vrma', actionData: { name: '挥手', category: 'gesture' }, startTime: 0, duration: 2 },
      { actionId: 'stand.vrma', actionData: { name: '站立', category: 'idle' }, startTime: 2, duration: 1.5 },
      { actionId: 'happy.vrma', actionData: { name: '开心', category: 'emotion' }, startTime: 3.5, duration: 2 }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'preset_walk_cycle',
    name: '行走循环合集',
    description: '各种行走方式',
    actions: [
      { actionId: 'walk.vrma', actionData: { name: '走路', category: 'movement' }, startTime: 0, duration: 3 },
      { actionId: 'run.vrma', actionData: { name: '跑步', category: 'movement' }, startTime: 3, duration: 2.5 },
      { actionId: 'idle.vrma', actionData: { name: '待机', category: 'idle' }, startTime: 5.5, duration: 2 }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'preset_performance',
    name: '表演动作合集',
    description: '舞台表演动作',
    actions: [
      { actionId: 'dance.vrma', actionData: { name: '舞蹈', category: 'dance' }, startTime: 0, duration: 4 },
      { actionId: 'happy.vrma', actionData: { name: '开心', category: 'emotion' }, startTime: 4, duration: 2 },
      { actionId: 'wave.vrma', actionData: { name: '挥手', category: 'gesture' }, startTime: 6, duration: 2 }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'preset_daily_life',
    name: '日常生活合集',
    description: '日常动作组合',
    actions: [
      { actionId: 'sit.vrma', actionData: { name: '坐下', category: 'idle' }, startTime: 0, duration: 2.5 },
      { actionId: 'stand.vrma', actionData: { name: '站立', category: 'idle' }, startTime: 2.5, duration: 1.5 },
      { actionId: 'walk.vrma', actionData: { name: '走路', category: 'movement' }, startTime: 4, duration: 3 }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'preset_action_movie',
    name: '动作电影合集',
    description: '电影风格动作',
    actions: [
      { actionId: 'fight.vrma', actionData: { name: '战斗', category: 'fight' }, startTime: 0, duration: 2.5 },
      { actionId: 'jump.vrma', actionData: { name: '跳跃', category: 'movement' }, startTime: 2.5, duration: 1.5 },
      { actionId: 'run.vrma', actionData: { name: '跑步', category: 'movement' }, startTime: 4, duration: 3 }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'preset_cute_style',
    name: '可爱风格合集',
    description: '萌系可爱动作',
    actions: [
      { actionId: 'happy.vrma', actionData: { name: '开心', category: 'emotion' }, startTime: 0, duration: 2.5 },
      { actionId: 'wave.vrma', actionData: { name: '挥手', category: 'gesture' }, startTime: 2.5, duration: 2 },
      { actionId: 'jump.vrma', actionData: { name: '跳跃', category: 'movement' }, startTime: 4.5, duration: 1.5 }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'preset_cool_style',
    name: '酷炫风格合集',
    description: '帅气酷炫动作',
    actions: [
      { actionId: 'fight.vrma', actionData: { name: '战斗', category: 'fight' }, startTime: 0, duration: 2.5 },
      { actionId: 'dance.vrma', actionData: { name: '舞蹈', category: 'dance' }, startTime: 2.5, duration: 3.5 },
      { actionId: 'run.vrma', actionData: { name: '跑步', category: 'movement' }, startTime: 6, duration: 2.5 }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'preset_relax',
    name: '放松休闲合集',
    description: '轻松休闲动作',
    actions: [
      { actionId: 'idle.vrma', actionData: { name: '待机', category: 'idle' }, startTime: 0, duration: 3.5 },
      { actionId: 'sit.vrma', actionData: { name: '坐下', category: 'idle' }, startTime: 3.5, duration: 3 },
      { actionId: 'happy.vrma', actionData: { name: '开心', category: 'emotion' }, startTime: 6.5, duration: 2 }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'preset_energetic',
    name: '活力四射合集',
    description: '充满活力的动作',
    actions: [
      { actionId: 'run.vrma', actionData: { name: '跑步', category: 'movement' }, startTime: 0, duration: 2.5 },
      { actionId: 'jump.vrma', actionData: { name: '跳跃', category: 'movement' }, startTime: 2.5, duration: 1.5 },
      { actionId: 'dance.vrma', actionData: { name: '舞蹈', category: 'dance' }, startTime: 4, duration: 4 }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'preset_sad_story',
    name: '悲伤故事合集',
    description: '情感深沉的动作',
    actions: [
      { actionId: 'sad.vrma', actionData: { name: '悲伤', category: 'emotion' }, startTime: 0, duration: 3.5 },
      { actionId: 'sit.vrma', actionData: { name: '坐下', category: 'idle' }, startTime: 3.5, duration: 2.5 },
      { actionId: 'idle.vrma', actionData: { name: '待机', category: 'idle' }, startTime: 6, duration: 3 }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'preset_celebration',
    name: '庆祝动作合集',
    description: '庆祝胜利的动作',
    actions: [
      { actionId: 'happy.vrma', actionData: { name: '开心', category: 'emotion' }, startTime: 0, duration: 2.5 },
      { actionId: 'jump.vrma', actionData: { name: '跳跃', category: 'movement' }, startTime: 2.5, duration: 1.5 },
      { actionId: 'wave.vrma', actionData: { name: '挥手', category: 'gesture' }, startTime: 4, duration: 2.5 }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'preset_training',
    name: '训练动作合集',
    description: '训练相关动作',
    actions: [
      { actionId: 'run.vrma', actionData: { name: '跑步', category: 'sport' }, startTime: 0, duration: 3 },
      { actionId: 'fight.vrma', actionData: { name: '战斗', category: 'fight' }, startTime: 3, duration: 2.5 },
      { actionId: 'jump.vrma', actionData: { name: '跳跃', category: 'sport' }, startTime: 5.5, duration: 1.5 }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'preset_street_dance',
    name: '街舞合集',
    description: '街头舞蹈动作',
    actions: [
      { actionId: 'dance.vrma', actionData: { name: '舞蹈', category: 'dance' }, startTime: 0, duration: 4 },
      { actionId: 'run.vrma', actionData: { name: '跑步', category: 'movement' }, startTime: 4, duration: 2 },
      { actionId: 'wave.vrma', actionData: { name: '挥手', category: 'gesture' }, startTime: 6, duration: 2 }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'preset_morning_routine',
    name: '晨间 routine 合集',
    description: '早晨日常动作',
    actions: [
      { actionId: 'idle.vrma', actionData: { name: '待机', category: 'idle' }, startTime: 0, duration: 2 },
      { actionId: 'stand.vrma', actionData: { name: '站立', category: 'idle' }, startTime: 2, duration: 1.5 },
      { actionId: 'walk.vrma', actionData: { name: '走路', category: 'movement' }, startTime: 3.5, duration: 2.5 },
      { actionId: 'happy.vrma', actionData: { name: '开心', category: 'emotion' }, startTime: 6, duration: 2 }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'preset_night_out',
    name: '夜间外出合集',
    description: '夜晚活动动作',
    actions: [
      { actionId: 'walk.vrma', actionData: { name: '走路', category: 'movement' }, startTime: 0, duration: 3 },
      { actionId: 'dance.vrma', actionData: { name: '舞蹈', category: 'dance' }, startTime: 3, duration: 4 },
      { actionId: 'wave.vrma', actionData: { name: '挥手', category: 'gesture' }, startTime: 7, duration: 2 }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
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
    // 如果没有数据，返回默认预设
    if (!data) {
      return DEFAULT_PRESETS
    }
    const savedPresets = JSON.parse(data)
    // 合并默认预设和用户保存的预设
    return [...DEFAULT_PRESETS, ...savedPresets.filter(p => !DEFAULT_PRESETS.find(dp => dp.id === p.id))]
  } catch (e) {
    console.error('加载预设失败:', e)
    return DEFAULT_PRESETS
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
