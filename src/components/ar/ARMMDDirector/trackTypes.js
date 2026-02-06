// 轨道类型定义
export const TRACK_TYPES = {
  // 场景轨道 - 背景图片
  SCENE: {
    id: 'scene',
    name: '场景',
    icon: '🗺️',
    color: '#667eea',
    description: '设置背景场景图片'
  },
  // 动作轨道 - VRMA动画
  ACTION: {
    id: 'action',
    name: '动作',
    icon: '🎭',
    color: '#f093fb',
    description: '播放VRMA动作动画'
  },
  // 特效轨道 - 粒子效果
  EFFECT: {
    id: 'effect',
    name: '特效',
    icon: '✨',
    color: '#4facfe',
    description: '添加粒子特效'
  },
  // 位置控制轨道 - 人物移动
  POSITION: {
    id: 'position',
    name: '位置控制',
    icon: '📍',
    color: '#43e97b',
    description: '控制人物移动路径'
  },
  // 音乐轨道 - 背景音乐
  MUSIC: {
    id: 'music',
    name: '音乐',
    icon: '🎵',
    color: '#fa709a',
    description: '添加背景音乐'
  },
  // 道具轨道 - 3D道具
  PROP: {
    id: 'prop',
    name: '道具',
    icon: '📦',
    color: '#fee140',
    description: '添加3D道具'
  },
  // 缩放轨道 - 人物缩放
  SCALE: {
    id: 'scale',
    name: '人物缩放',
    icon: '🔍',
    color: '#a8edea',
    description: '调整人物大小'
  },
  // 背景缩放轨道
  BG_SCALE: {
    id: 'bgScale',
    name: '背景缩放',
    icon: '🖼️',
    color: '#d299c2',
    description: '调整背景视角'
  },
  // 摄像机轨道 - 关键帧动画
  CAMERA: {
    id: 'camera',
    name: '摄像机',
    icon: '🎥',
    color: '#ff6b6b',
    description: '摄像机运动和关键帧'
  }
}

// 轨道数据结构模板
export const createTrack = (characterId, type) => ({
  id: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  characterId,
  type,
  clips: [], // 统一使用clips数组存储片段
  createdAt: Date.now()
})

// 片段数据结构模板
export const createClip = (type, startTime = 0, duration = 2) => {
  const baseClip = {
    id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    startTime,
    duration,
    createdAt: Date.now()
  }

  switch (type) {
    case 'scene':
      return {
        ...baseClip,
        data: {
          sceneId: null,
          sceneData: null,
          name: ''
        }
      }
    case 'action':
      return {
        ...baseClip,
        data: {
          actionId: null,
          actionData: null,
          name: ''
        }
      }
    case 'effect':
      return {
        ...baseClip,
        data: {
          effectId: null,
          effectData: null,
          name: ''
        }
      }
    case 'position':
      return {
        ...baseClip,
        data: {
          startPosition: { x: 0, y: 0, z: 0 },
          endPosition: { x: 0, y: 0, z: 0 },
          pathType: 'linear', // linear, bezier, circle
          rotation: { x: 0, y: 0, z: 0 },
          lookAt: null // 看向的目标位置
        }
      }
    case 'music':
      return {
        ...baseClip,
        data: {
          musicId: null,
          musicUrl: null,
          name: '',
          volume: 1.0,
          loop: false
        }
      }
    case 'prop':
      return {
        ...baseClip,
        data: {
          propId: null,
          propType: null,
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        }
      }
    case 'scale':
      return {
        ...baseClip,
        data: {
          startScale: 1,
          endScale: 1
        }
      }
    case 'bgScale':
      return {
        ...baseClip,
        data: {
          startScale: 1,
          endScale: 1
        }
      }
    case 'camera':
      return {
        ...baseClip,
        data: {
          keyframes: [
            {
              time: 0,
              position: { x: 0, y: 5, z: 10 },
              target: { x: 0, y: 0, z: 0 },
              fov: 60,
              easing: 'linear'
            }
          ],
          preset: null // 预设机位: front, back, left, right, top, isometric
        }
      }
    default:
      return baseClip
  }
}

// 获取轨道类型列表（用于UI显示）
export const getTrackTypeList = () => {
  return Object.values(TRACK_TYPES)
}

// 获取轨道类型信息
export const getTrackTypeInfo = (typeId) => {
  if (!typeId) return null
  return TRACK_TYPES[typeId.toUpperCase()] || null
}
