// 位置预设系统 - 20种位移模式
export const POSITION_PRESETS = {
  // 基础移动
  LINEAR_FORWARD: {
    id: 'linear_forward',
    name: '直线前进',
    category: '基础',
    icon: '➡️',
    description: '沿Z轴直线前进',
    getPath: (startPos, distance = 5) => ({
      start: startPos,
      end: { ...startPos, z: startPos.z + distance },
      pathType: 'linear'
    })
  },
  LINEAR_BACKWARD: {
    id: 'linear_backward',
    name: '直线后退',
    category: '基础',
    icon: '⬅️',
    description: '沿Z轴直线后退',
    getPath: (startPos, distance = 5) => ({
      start: startPos,
      end: { ...startPos, z: startPos.z - distance },
      pathType: 'linear'
    })
  },
  LINEAR_LEFT: {
    id: 'linear_left',
    name: '向左移动',
    category: '基础',
    icon: '⬅️',
    description: '沿X轴向左移动',
    getPath: (startPos, distance = 5) => ({
      start: startPos,
      end: { ...startPos, x: startPos.x - distance },
      pathType: 'linear'
    })
  },
  LINEAR_RIGHT: {
    id: 'linear_right',
    name: '向右移动',
    category: '基础',
    icon: '➡️',
    description: '沿X轴向右移动',
    getPath: (startPos, distance = 5) => ({
      start: startPos,
      end: { ...startPos, x: startPos.x + distance },
      pathType: 'linear'
    })
  },

  // 圆形运动
  CIRCLE_CLOCKWISE: {
    id: 'circle_clockwise',
    name: '顺时针圆周',
    category: '圆形',
    icon: '↻',
    description: '顺时针圆形运动',
    getPath: (startPos, radius = 3) => ({
      start: startPos,
      end: startPos,
      pathType: 'circle',
      center: { x: startPos.x, y: startPos.y, z: startPos.z - radius },
      radius,
      direction: 'clockwise'
    })
  },
  CIRCLE_COUNTER: {
    id: 'circle_counter',
    name: '逆时针圆周',
    category: '圆形',
    icon: '↺',
    description: '逆时针圆形运动',
    getPath: (startPos, radius = 3) => ({
      start: startPos,
      end: startPos,
      pathType: 'circle',
      center: { x: startPos.x, y: startPos.y, z: startPos.z - radius },
      radius,
      direction: 'counter'
    })
  },

  // 8字形
  EIGHT_HORIZONTAL: {
    id: 'eight_horizontal',
    name: '水平8字',
    category: '8字形',
    icon: '∞',
    description: '水平方向8字形运动',
    getPath: (startPos, scale = 3) => ({
      start: startPos,
      end: startPos,
      pathType: 'eight',
      scale,
      plane: 'horizontal'
    })
  },
  EIGHT_VERTICAL: {
    id: 'eight_vertical',
    name: '垂直8字',
    category: '8字形',
    icon: '∞',
    description: '垂直方向8字形运动',
    getPath: (startPos, scale = 3) => ({
      start: startPos,
      end: startPos,
      pathType: 'eight',
      scale,
      plane: 'vertical'
    })
  },

  // 方形运动
  SQUARE_CLOCKWISE: {
    id: 'square_clockwise',
    name: '顺时针方形',
    category: '方形',
    icon: '□',
    description: '顺时针方形路径',
    getPath: (startPos, size = 4) => ({
      start: startPos,
      end: startPos,
      pathType: 'square',
      size,
      direction: 'clockwise'
    })
  },
  SQUARE_COUNTER: {
    id: 'square_counter',
    name: '逆时针方形',
    category: '方形',
    icon: '□',
    description: '逆时针方形路径',
    getPath: (startPos, size = 4) => ({
      start: startPos,
      end: startPos,
      pathType: 'square',
      size,
      direction: 'counter'
    })
  },

  // 三角形
  TRIANGLE_CLOCKWISE: {
    id: 'triangle_clockwise',
    name: '顺时针三角',
    category: '多边形',
    icon: '△',
    description: '顺时针三角形路径',
    getPath: (startPos, size = 4) => ({
      start: startPos,
      end: startPos,
      pathType: 'triangle',
      size,
      direction: 'clockwise'
    })
  },
  TRIANGLE_COUNTER: {
    id: 'triangle_counter',
    name: '逆时针三角',
    category: '多边形',
    icon: '△',
    description: '逆时针三角形路径',
    getPath: (startPos, size = 4) => ({
      start: startPos,
      end: startPos,
      pathType: 'triangle',
      size,
      direction: 'counter'
    })
  },

  // 波浪运动
  WAVE_HORIZONTAL: {
    id: 'wave_horizontal',
    name: '水平波浪',
    category: '波浪',
    icon: '〰️',
    description: '水平方向波浪运动',
    getPath: (startPos, amplitude = 2, cycles = 2) => ({
      start: startPos,
      end: { ...startPos, z: startPos.z + 10 },
      pathType: 'wave',
      amplitude,
      cycles,
      direction: 'horizontal'
    })
  },
  WAVE_VERTICAL: {
    id: 'wave_vertical',
    name: '垂直波浪',
    category: '波浪',
    icon: '〰️',
    description: '垂直方向波浪运动',
    getPath: (startPos, amplitude = 2, cycles = 2) => ({
      start: startPos,
      end: { ...startPos, z: startPos.z + 10 },
      pathType: 'wave',
      amplitude,
      cycles,
      direction: 'vertical'
    })
  },

  // 螺旋运动
  SPIRAL_UP: {
    id: 'spiral_up',
    name: '向上螺旋',
    category: '螺旋',
    icon: '🌀',
    description: '向上螺旋上升',
    getPath: (startPos, radius = 3, height = 5) => ({
      start: startPos,
      end: { ...startPos, y: startPos.y + height },
      pathType: 'spiral',
      radius,
      height,
      direction: 'up'
    })
  },
  SPIRAL_DOWN: {
    id: 'spiral_down',
    name: '向下螺旋',
    category: '螺旋',
    icon: '🌀',
    description: '向下螺旋下降',
    getPath: (startPos, radius = 3, height = 5) => ({
      start: startPos,
      end: { ...startPos, y: startPos.y - height },
      pathType: 'spiral',
      radius,
      height,
      direction: 'down'
    })
  },

  // 往返运动
  PING_PONG_X: {
    id: 'ping_pong_x',
    name: 'X轴往返',
    category: '往返',
    icon: '↔️',
    description: 'X轴方向来回运动',
    getPath: (startPos, distance = 4) => ({
      start: startPos,
      end: { ...startPos, x: startPos.x + distance },
      pathType: 'pingpong',
      axis: 'x'
    })
  },
  PING_PONG_Z: {
    id: 'ping_pong_z',
    name: 'Z轴往返',
    category: '往返',
    icon: '↕️',
    description: 'Z轴方向来回运动',
    getPath: (startPos, distance = 4) => ({
      start: startPos,
      end: { ...startPos, z: startPos.z + distance },
      pathType: 'pingpong',
      axis: 'z'
    })
  },

  // 弧线
  ARC_LEFT: {
    id: 'arc_left',
    name: '向左弧线',
    category: '弧线',
    icon: '⌒',
    description: '向左弧形移动',
    getPath: (startPos, radius = 4) => ({
      start: startPos,
      end: { x: startPos.x - radius, y: startPos.y, z: startPos.z + radius },
      pathType: 'arc',
      direction: 'left',
      radius
    })
  },
  ARC_RIGHT: {
    id: 'arc_right',
    name: '向右弧线',
    category: '弧线',
    icon: '⌒',
    description: '向右弧形移动',
    getPath: (startPos, radius = 4) => ({
      start: startPos,
      end: { x: startPos.x + radius, y: startPos.y, z: startPos.z + radius },
      pathType: 'arc',
      direction: 'right',
      radius
    })
  }
}

// 获取所有预设列表
export const getPositionPresets = () => {
  return Object.values(POSITION_PRESETS).map(preset => ({
    id: preset.id,
    name: preset.name,
    category: preset.category,
    icon: preset.icon,
    description: preset.description
  }))
}

// 获取分类后的预设
export const getPresetsByCategory = () => {
  const presets = getPositionPresets()
  const categories = {}
  
  presets.forEach(preset => {
    if (!categories[preset.category]) {
      categories[preset.category] = []
    }
    categories[preset.category].push(preset)
  })
  
  return categories
}

// 应用预设
export const applyPositionPreset = (presetId, startPos, params = {}) => {
  const preset = POSITION_PRESETS[presetId]
  if (!preset) return null
  
  return preset.getPath(startPos, ...Object.values(params))
}

// 计算路径上的位置
export const calculatePositionOnPath = (pathData, progress) => {
  const { start, end, pathType } = pathData
  const t = Math.max(0, Math.min(1, progress))
  
  switch (pathType) {
    case 'linear':
      return {
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
        z: start.z + (end.z - start.z) * t
      }
    
    case 'circle': {
      const { center, radius, direction } = pathData
      const angle = (direction === 'clockwise' ? 1 : -1) * t * Math.PI * 2
      return {
        x: center.x + Math.sin(angle) * radius,
        y: start.y,
        z: center.z + Math.cos(angle) * radius
      }
    }
    
    case 'eight': {
      const { scale, plane } = pathData
      const angle = t * Math.PI * 2
      if (plane === 'horizontal') {
        return {
          x: start.x + Math.sin(angle) * scale,
          y: start.y,
          z: start.z + Math.sin(angle * 2) * scale * 0.5
        }
      } else {
        return {
          x: start.x + Math.sin(angle) * scale,
          y: start.y + Math.sin(angle * 2) * scale * 0.5,
          z: start.z
        }
      }
    }
    
    case 'wave': {
      const { amplitude, cycles, direction } = pathData
      const mainAxis = direction === 'horizontal' ? 'x' : 'y'
      return {
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t + (mainAxis === 'y' ? Math.sin(t * Math.PI * 2 * cycles) * amplitude : 0),
        z: start.z + (end.z - start.z) * t + (mainAxis === 'x' ? Math.sin(t * Math.PI * 2 * cycles) * amplitude : 0)
      }
    }
    
    case 'spiral': {
      const { radius, height, direction } = pathData
      const angle = t * Math.PI * 4
      const yOffset = (direction === 'up' ? 1 : -1) * t * height
      return {
        x: start.x + Math.cos(angle) * radius,
        y: start.y + yOffset,
        z: start.z + Math.sin(angle) * radius
      }
    }
    
    default:
      return {
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
        z: start.z + (end.z - start.z) * t
      }
  }
}
