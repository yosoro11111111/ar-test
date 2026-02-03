// 动作样板预设数据
// 使用实际存在的 VRMA 文件名 - 经过验证

export const actionPresets = [
  {
    id: 'preset_001',
    name: '基础待机组合',
    description: '包含多种待机姿势的循环组合',
    tags: ['基础', '待机', '循环'],
    actions: [
      { actionId: 'vrma_Standing Idle', name: '站立待机', fileName: 'Standing Idle', startTime: 0, duration: 3000 },
      { actionId: 'vrma_Standing Idle (1)', name: '站立待机2', fileName: 'Standing Idle (1)', startTime: 3000, duration: 3000 },
      { actionId: 'vrma_Standing Idle (2)', name: '站立待机3', fileName: 'Standing Idle (2)', startTime: 6000, duration: 3000 },
    ]
  },
  {
    id: 'preset_002',
    name: '走路循环',
    description: '自然走路动作循环',
    tags: ['基础', '行走', '循环'],
    actions: [
      { actionId: 'vrma_Walking From Standing', name: '走路', fileName: 'Walking From Standing', startTime: 0, duration: 2000 },
      { actionId: 'vrma_Walking From Standing (1)', name: '走路2', fileName: 'Walking From Standing (1)', startTime: 2000, duration: 2000 },
      { actionId: 'vrma_Walking From Standing (2)', name: '走路3', fileName: 'Walking From Standing (2)', startTime: 4000, duration: 2000 },
    ]
  },
  {
    id: 'preset_003',
    name: '跑步冲刺',
    description: '从慢跑到冲刺的过渡',
    tags: ['基础', '跑步', '过渡'],
    actions: [
      { actionId: 'vrma_Walking From Standing', name: '起步', fileName: 'Walking From Standing', startTime: 0, duration: 2000 },
      { actionId: 'vrma_Walking Backwards', name: '后退', fileName: 'Walking Backwards', startTime: 2000, duration: 2000 },
      { actionId: 'vrma_Walking Backwards (1)', name: '冲刺', fileName: 'Walking Backwards (1)', startTime: 4000, duration: 3000 },
    ]
  },
  {
    id: 'preset_004',
    name: '舞蹈串烧',
    description: '多种舞蹈动作组合',
    tags: ['舞蹈', '组合', '表演'],
    actions: [
      { actionId: 'vrma_Waving The Arms Hip Hop Dance', name: '街舞', fileName: 'Waving The Arms Hip Hop Dance', startTime: 0, duration: 5000 },
      { actionId: 'vrma_Breakdance Brooklyn Style Uprocking', name: '霹雳舞', fileName: 'Breakdance Brooklyn Style Uprocking', startTime: 5000, duration: 6000 },
      { actionId: 'vrma_Female Salsa Dancing', name: '萨尔萨', fileName: 'Female Salsa Dancing', startTime: 11000, duration: 5000 },
    ]
  },
  {
    id: 'preset_005',
    name: '战斗准备',
    description: '战斗前的准备动作序列',
    tags: ['战斗', '准备', '姿势'],
    actions: [
      { actionId: 'vrma_Standing Idle', name: '待机', fileName: 'Standing Idle', startTime: 0, duration: 1000 },
      { actionId: 'vrma_Warrior Stretching Idle', name: '准备', fileName: 'Warrior Stretching Idle', startTime: 1000, duration: 2000 },
      { actionId: 'vrma_Warrior Stretching Idle (1)', name: '战斗姿态', fileName: 'Warrior Stretching Idle (1)', startTime: 3000, duration: 3000 },
    ]
  },
  {
    id: 'preset_006',
    name: '拳击组合',
    description: '连续拳击动作',
    tags: ['战斗', '拳击', '连击'],
    actions: [
      { actionId: 'vrma_Vexed Shaking Of The Fist', name: '出拳', fileName: 'Vexed Shaking Of The Fist', startTime: 0, duration: 800 },
      { actionId: 'vrma_Vexed Shaking Of The Fist (1)', name: '直拳', fileName: 'Vexed Shaking Of The Fist (1)', startTime: 800, duration: 800 },
      { actionId: 'vrma_Vertical Elbow And Solar Plexus Strike', name: '上勾拳', fileName: 'Vertical Elbow And Solar Plexus Strike', startTime: 1600, duration: 1000 },
    ]
  },
  {
    id: 'preset_007',
    name: '跳跃组合',
    description: '多种跳跃动作',
    tags: ['基础', '跳跃', '组合'],
    actions: [
      { actionId: 'vrma_Jumping From Action Idle', name: '跳跃待机', fileName: 'Jumping From Action Idle', startTime: 0, duration: 1500 },
      { actionId: 'vrma_Jumping From Action Idle (1)', name: '跳跃待机2', fileName: 'Jumping From Action Idle (1)', startTime: 1500, duration: 1500 },
      { actionId: 'vrma_Jumping From Action Idle (2)', name: '跳跃待机3', fileName: 'Jumping From Action Idle (2)', startTime: 3000, duration: 1500 },
    ]
  },
  {
    id: 'preset_008',
    name: '转身观察',
    description: '观察周围环境的转身动作',
    tags: ['基础', '转身', '观察'],
    actions: [
      { actionId: 'vrma_Turning 90 Degrees Left', name: '左转90度', fileName: 'Turning 90 Degrees Left', startTime: 0, duration: 1500 },
      { actionId: 'vrma_Standing Idle Looking Around', name: '观察', fileName: 'Standing Idle Looking Around', startTime: 1500, duration: 2000 },
      { actionId: 'vrma_Turning 90 Degrees Right', name: '右转90度', fileName: 'Turning 90 Degrees Right', startTime: 3500, duration: 1500 },
    ]
  },
  {
    id: 'preset_009',
    name: '坐下休息',
    description: '从站立到坐下的休息序列',
    tags: ['基础', '坐下', '休息'],
    actions: [
      { actionId: 'vrma_Standing Idle', name: '待机', fileName: 'Standing Idle', startTime: 0, duration: 1000 },
      { actionId: 'vrma_Walking From Standing', name: '下蹲', fileName: 'Walking From Standing', startTime: 1000, duration: 1500 },
      { actionId: 'vrma_Walking While Drunk', name: '坐下', fileName: 'Walking While Drunk', startTime: 2500, duration: 5000 },
    ]
  },
  {
    id: 'preset_010',
    name: '街舞表演',
    description: '完整的街舞表演序列',
    tags: ['舞蹈', '街舞', '表演'],
    actions: [
      { actionId: 'vrma_Waving The Arms Hip Hop Dance', name: '街舞', fileName: 'Waving The Arms Hip Hop Dance', startTime: 0, duration: 6000 },
      { actionId: 'vrma_Breakdance Brooklyn Style Uprocking', name: '霹雳舞', fileName: 'Breakdance Brooklyn Style Uprocking', startTime: 6000, duration: 5000 },
      { actionId: 'vrma_Waving The Arms Hip Hop Dance (1)', name: '街舞变体', fileName: 'Waving The Arms Hip Hop Dance (1)', startTime: 11000, duration: 4000 },
    ]
  },
  {
    id: 'preset_011',
    name: '社交舞组合',
    description: '优雅的社交舞蹈',
    tags: ['舞蹈', '社交', '优雅'],
    actions: [
      { actionId: 'vrma_Female Salsa Dancing', name: '萨尔萨', fileName: 'Female Salsa Dancing', startTime: 0, duration: 5000 },
      { actionId: 'vrma_Salsa Dancing Side To Side', name: '萨尔萨2', fileName: 'Salsa Dancing Side To Side', startTime: 5000, duration: 6000 },
      { actionId: 'vrma_Salsa Dancing Up And Back', name: '萨尔萨3', fileName: 'Salsa Dancing Up And Back', startTime: 11000, duration: 5000 },
    ]
  },
  {
    id: 'preset_012',
    name: '情绪表达',
    description: '多种情绪表达动作',
    tags: ['表情', '情绪', '表达'],
    actions: [
      { actionId: 'vrma_Waving With Both Hands', name: '挥手', fileName: 'Waving With Both Hands', startTime: 0, duration: 3000 },
      { actionId: 'vrma_Waving With Both Hands (1)', name: '哭泣', fileName: 'Waving With Both Hands (1)', startTime: 3000, duration: 3000 },
      { actionId: 'vrma_Vexed Shaking Of The Fist', name: '生气', fileName: 'Vexed Shaking Of The Fist', startTime: 6000, duration: 3000 },
    ]
  },
  {
    id: 'preset_013',
    name: '武器展示',
    description: '武器相关的动作展示',
    tags: ['战斗', '武器', '展示'],
    actions: [
      { actionId: 'vrma_Walking Right While Aiming With Bow', name: '瞄准', fileName: 'Walking Right While Aiming With Bow', startTime: 0, duration: 2000 },
      { actionId: 'vrma_Walking Forward With Bow', name: '射击', fileName: 'Walking Forward With Bow', startTime: 2000, duration: 1000 },
      { actionId: 'vrma_Walking Right With Bow', name: '换弹', fileName: 'Walking Right With Bow', startTime: 3000, duration: 2000 },
    ]
  },
  {
    id: 'preset_014',
    name: '剑术表演',
    description: '剑术动作组合',
    tags: ['战斗', '剑术', '表演'],
    actions: [
      { actionId: 'vrma_Withdrawing A Sword', name: '持剑', fileName: 'Withdrawing A Sword', startTime: 0, duration: 1500 },
      { actionId: 'vrma_Two Handed Sword Combo Attack', name: '挥剑', fileName: 'Two Handed Sword Combo Attack', startTime: 1500, duration: 1500 },
      { actionId: 'vrma_Two Handed Sword Combo Attack (1)', name: '格挡', fileName: 'Two Handed Sword Combo Attack (1)', startTime: 3000, duration: 1500 },
    ]
  },
  {
    id: 'preset_015',
    name: '运动热身',
    description: '运动前的热身动作',
    tags: ['运动', '热身', '准备'],
    actions: [
      { actionId: 'vrma_Warrior Stretching Idle', name: '伸展', fileName: 'Warrior Stretching Idle', startTime: 0, duration: 3000 },
      { actionId: 'vrma_Warrior Stretching Idle (1)', name: '热身', fileName: 'Warrior Stretching Idle (1)', startTime: 3000, duration: 4000 },
      { actionId: 'vrma_Warrior Stretching Idle (2)', name: '准备', fileName: 'Warrior Stretching Idle (2)', startTime: 7000, duration: 2000 },
    ]
  },
  {
    id: 'preset_016',
    name: '魔法施放',
    description: '魔法施放动作序列',
    tags: ['特殊', '魔法', '施法'],
    actions: [
      { actionId: 'vrma_Two Handed Casting Spell Fowards', name: '魔法', fileName: 'Two Handed Casting Spell Fowards', startTime: 0, duration: 3000 },
      { actionId: 'vrma_Two Handed Casting Spell Fowards (1)', name: '施法', fileName: 'Two Handed Casting Spell Fowards (1)', startTime: 3000, duration: 2000 },
      { actionId: 'vrma_Two Handed Casting Spell Towards Ground', name: '咒语', fileName: 'Two Handed Casting Spell Towards Ground', startTime: 5000, duration: 3000 },
    ]
  },
  {
    id: 'preset_017',
    name: '特技动作',
    description: '高难度特技动作',
    tags: ['特殊', '特技', '高难度'],
    actions: [
      { actionId: 'vrma_Jumping Backwards Dodge', name: '后跳闪避', fileName: 'Jumping Backwards Dodge', startTime: 0, duration: 2000 },
      { actionId: 'vrma_Jumping Backwards Dodge (1)', name: '翻滚', fileName: 'Jumping Backwards Dodge (1)', startTime: 2000, duration: 1500 },
      { actionId: 'vrma_Jumping Away To Avoid Explosion', name: '闪避', fileName: 'Jumping Away To Avoid Explosion', startTime: 3500, duration: 1500 },
    ]
  },
  {
    id: 'preset_018',
    name: '日常动作',
    description: '日常生活中的常见动作',
    tags: ['基础', '日常', '生活'],
    actions: [
      { actionId: 'vrma_Waving With Both Hands', name: '挥手', fileName: 'Waving With Both Hands', startTime: 0, duration: 2000 },
      { actionId: 'vrma_Wiping Sweat Idle', name: '擦汗', fileName: 'Wiping Sweat Idle', startTime: 2000, duration: 2000 },
      { actionId: 'vrma_Turning Head To The Side In A Cocky Manner', name: '转头', fileName: 'Turning Head To The Side In A Cocky Manner', startTime: 4000, duration: 2000 },
    ]
  },
  {
    id: 'preset_019',
    name: '表演谢幕',
    description: '表演结束时的谢幕动作',
    tags: ['表演', '谢幕', '结束'],
    actions: [
      { actionId: 'vrma_2 People Shaking Hands Part 1 -  Female', name: '鞠躬', fileName: '2 People Shaking Hands Part 1 -  Female', startTime: 0, duration: 2000 },
      { actionId: 'vrma_Waving With Both Hands', name: '挥手', fileName: 'Waving With Both Hands', startTime: 2000, duration: 3000 },
      { actionId: 'vrma_Standing Idle', name: '待机', fileName: 'Standing Idle', startTime: 5000, duration: 2000 },
    ]
  },
  {
    id: 'preset_020',
    name: '综合展示',
    description: '多种动作类型的综合展示',
    tags: ['综合', '展示', '多样'],
    actions: [
      { actionId: 'vrma_Standing Idle', name: '待机', fileName: 'Standing Idle', startTime: 0, duration: 2000 },
      { actionId: 'vrma_Walking From Standing', name: '走路', fileName: 'Walking From Standing', startTime: 2000, duration: 3000 },
      { actionId: 'vrma_Waving The Arms Hip Hop Dance', name: '舞蹈', fileName: 'Waving The Arms Hip Hop Dance', startTime: 5000, duration: 5000 },
      { actionId: 'vrma_Jumping From Action Idle', name: '跳跃', fileName: 'Jumping From Action Idle', startTime: 10000, duration: 2000 },
    ]
  },
]

// 导出 ymmd 格式
export function exportToYMMD(preset) {
  const ymmdData = {
    version: '1.0',
    format: 'ymmd',
    metadata: {
      name: preset.name,
      description: preset.description,
      tags: preset.tags,
      created: new Date().toISOString(),
    },
    timeline: {
      duration: preset.actions.reduce((sum, a) => Math.max(sum, a.startTime + a.duration), 0),
      tracks: preset.actions.map((action, index) => ({
        id: `track_${index}`,
        name: action.name,
        actionId: action.actionId,
        fileName: action.fileName,
        startTime: action.startTime,
        duration: action.duration,
      }))
    }
  }
  return JSON.stringify(ymmdData, null, 2)
}

// 导入 ymmd 格式
export function importFromYMMD(ymmdString) {
  try {
    const data = JSON.parse(ymmdString)
    if (data.format !== 'ymmd') {
      throw new Error('Invalid format: not a YMMD file')
    }
    return {
      id: `imported_${Date.now()}`,
      name: data.metadata?.name || '导入的预设',
      description: data.metadata?.description || '',
      tags: data.metadata?.tags || [],
      actions: data.timeline?.tracks?.map(track => ({
        actionId: track.actionId,
        fileName: track.fileName,
        name: track.name,
        startTime: track.startTime,
        duration: track.duration,
      })) || []
    }
  } catch (error) {
    console.error('导入 YMMD 失败:', error)
    return null
  }
}

// 下载预设为 ymmd 文件
export function downloadPreset(preset) {
  const content = exportToYMMD(preset)
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${preset.name.replace(/\s+/g, '_')}.ymmd`
  a.click()
  URL.revokeObjectURL(url)
}

// 从文件读取预设
export function readPresetFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const preset = importFromYMMD(e.target.result)
      if (preset) {
        resolve(preset)
      } else {
        reject(new Error('Invalid YMMD file'))
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}
