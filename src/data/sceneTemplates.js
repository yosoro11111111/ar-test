// 场景模板数据
export const sceneTemplates = [
  {
    id: 'default',
    name: '默认',
    icon: '🏠',
    description: '简洁的默认场景',
    background: 'transparent',
    lighting: {
      ambient: 2.0,
      directional: 1.5,
      spot: 0.5
    },
    effects: {
      particles: false,
      fog: false,
      bloom: false
    },
    camera: {
      position: [0, 0.8, 2.5],
      fov: 50
    }
  },
  {
    id: 'studio',
    name: '摄影棚',
    icon: '📸',
    description: '专业摄影棚灯光',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    lighting: {
      ambient: 1.5,
      directional: 2.0,
      spot: 1.0,
      rim: 0.8
    },
    effects: {
      particles: false,
      fog: false,
      bloom: true
    },
    camera: {
      position: [0, 1, 3],
      fov: 45
    }
  },
  {
    id: 'sunset',
    name: '日落',
    icon: '🌅',
    description: '温暖的日落氛围',
    background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #ff9ff3 100%)',
    lighting: {
      ambient: 1.2,
      directional: 1.0,
      spot: 0.3,
      color: '#ff6b6b'
    },
    effects: {
      particles: false,
      fog: true,
      fogColor: '#ff9ff3',
      bloom: false
    },
    camera: {
      position: [0, 0.8, 2.5],
      fov: 50
    }
  },
  {
    id: 'night',
    name: '夜晚',
    icon: '🌙',
    description: '静谧的夜晚星空',
    background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #16213e 100%)',
    lighting: {
      ambient: 0.5,
      directional: 0.3,
      spot: 0.8,
      stars: true
    },
    effects: {
      particles: true,
      particleType: 'stars',
      fog: false,
      bloom: true
    },
    camera: {
      position: [0, 0.8, 2.5],
      fov: 50
    }
  },
  {
    id: 'beach',
    name: '海滩',
    icon: '🏖️',
    description: '阳光明媚的海滩',
    background: 'linear-gradient(135deg, #48dbfb 0%, #0abde3 50%, #feca57 100%)',
    lighting: {
      ambient: 2.5,
      directional: 2.0,
      spot: 0.5,
      color: '#feca57'
    },
    effects: {
      particles: true,
      particleType: 'bubbles',
      fog: false,
      bloom: false
    },
    camera: {
      position: [0, 0.6, 2.5],
      fov: 55
    }
  },
  {
    id: 'forest',
    name: '森林',
    icon: '🌲',
    description: '神秘的森林深处',
    background: 'linear-gradient(135deg, #1e3c1e 0%, #2d5a2d 50%, #1a2f1a 100%)',
    lighting: {
      ambient: 0.8,
      directional: 0.6,
      spot: 0.4,
      color: '#2ecc71'
    },
    effects: {
      particles: true,
      particleType: 'fireflies',
      fog: true,
      fogColor: '#1a2f1a',
      bloom: false
    },
    camera: {
      position: [0, 0.8, 2.5],
      fov: 50
    }
  },
  {
    id: 'city',
    name: '城市',
    icon: '🏙️',
    description: '霓虹闪烁的都市',
    background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #2c3e50 100%)',
    lighting: {
      ambient: 1.0,
      directional: 0.8,
      spot: 1.2,
      neon: true
    },
    effects: {
      particles: true,
      particleType: 'neon',
      fog: true,
      fogColor: '#34495e',
      bloom: true
    },
    camera: {
      position: [0, 1, 3],
      fov: 45
    }
  },
  {
    id: 'snow',
    name: '雪景',
    icon: '❄️',
    description: '浪漫的雪景',
    background: 'linear-gradient(135deg, #e8f4f8 0%, #d4e5ed 50%, #c8dce8 100%)',
    lighting: {
      ambient: 2.0,
      directional: 1.8,
      spot: 0.3,
      color: '#ffffff'
    },
    effects: {
      particles: true,
      particleType: 'snow',
      fog: true,
      fogColor: '#e8f4f8',
      bloom: false
    },
    camera: {
      position: [0, 0.8, 2.5],
      fov: 50
    }
  },
  {
    id: 'sakura',
    name: '樱花',
    icon: '🌸',
    description: '粉色樱花飘落',
    background: 'linear-gradient(135deg, #ffb7c5 0%, #ffc0cb 50%, #ffd1dc 100%)',
    lighting: {
      ambient: 1.8,
      directional: 1.2,
      spot: 0.5,
      color: '#ffb7c5'
    },
    effects: {
      particles: true,
      particleType: 'petals',
      fog: false,
      bloom: true
    },
    camera: {
      position: [0, 0.8, 2.5],
      fov: 50
    }
  },
  {
    id: 'concert',
    name: '演唱会',
    icon: '🎤',
    description: '炫酷的舞台灯光',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    lighting: {
      ambient: 0.3,
      directional: 0.2,
      spot: 2.0,
      stage: true
    },
    effects: {
      particles: true,
      particleType: 'confetti',
      fog: true,
      fogColor: '#1a1a2e',
      bloom: true
    },
    camera: {
      position: [0, 1.2, 4],
      fov: 40
    }
  },
  {
    id: 'cafe',
    name: '咖啡厅',
    icon: '☕',
    description: '温馨的咖啡厅',
    background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 50%, #cd853f 100%)',
    lighting: {
      ambient: 1.2,
      directional: 0.8,
      spot: 0.6,
      warm: true
    },
    effects: {
      particles: true,
      particleType: 'steam',
      fog: false,
      bloom: false
    },
    camera: {
      position: [0, 0.8, 2.2],
      fov: 50
    }
  },
  {
    id: 'space',
    name: '太空',
    icon: '🚀',
    description: '浩瀚的宇宙星空',
    background: 'linear-gradient(135deg, #000000 0%, #1a1a3e 50%, #0f0f23 100%)',
    lighting: {
      ambient: 0.3,
      directional: 0.2,
      spot: 0.5,
      stars: true
    },
    effects: {
      particles: true,
      particleType: 'stars',
      fog: false,
      bloom: true
    },
    camera: {
      position: [0, 0.8, 3],
      fov: 60
    }
  }
]

// 获取场景模板
export const getSceneTemplate = (id) => {
  return sceneTemplates.find(template => template.id === id)
}

// 获取所有场景模板分类
export const getSceneCategories = () => {
  return [
    { id: 'all', name: '全部', icon: '📋' },
    { id: 'nature', name: '自然', icon: '🌿' },
    { id: 'urban', name: '城市', icon: '🏙️' },
    { id: 'fantasy', name: '幻想', icon: '✨' },
    { id: 'indoor', name: '室内', icon: '🏠' }
  ]
}

export default sceneTemplates
