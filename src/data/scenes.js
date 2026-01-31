// 场景/背景系统数据
export const scenes = [
  {
    id: 'default',
    name: '默认',
    icon: '⬜',
    color: '#1a1a2e',
    description: '默认深色背景',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    lighting: 'neutral',
    fog: { color: '#1a1a2e', near: 10, far: 50 }
  },
  {
    id: 'room',
    name: '房间',
    icon: '🏠',
    color: '#8B4513',
    description: '温馨房间',
    background: 'linear-gradient(135deg, #f5f5dc 0%, #deb887 100%)',
    lighting: 'warm',
    fog: { color: '#f5f5dc', near: 15, far: 60 }
  },
  {
    id: 'beach',
    name: '海滩',
    icon: '🏖️',
    color: '#FFD700',
    description: '阳光海滩',
    background: 'linear-gradient(135deg, #87CEEB 0%, #FFD700 50%, #FF8C00 100%)',
    lighting: 'bright',
    fog: { color: '#87CEEB', near: 20, far: 80 }
  },
  {
    id: 'forest',
    name: '森林',
    icon: '🌲',
    color: '#228B22',
    description: '神秘森林',
    background: 'linear-gradient(135deg, #228B22 0%, #006400 100%)',
    lighting: 'dim',
    fog: { color: '#228B22', near: 10, far: 40 }
  },
  {
    id: 'space',
    name: '太空',
    icon: '🚀',
    color: '#000080',
    description: '浩瀚星空',
    background: 'linear-gradient(135deg, #000080 0%, #4B0082 50%, #000000 100%)',
    lighting: 'dark',
    fog: { color: '#000080', near: 5, far: 30 },
    stars: true
  },
  {
    id: 'sunset',
    name: '日落',
    icon: '🌅',
    color: '#FF6347',
    description: '美丽日落',
    background: 'linear-gradient(135deg, #FF6347 0%, #FF8C00 50%, #FFD700 100%)',
    lighting: 'warm',
    fog: { color: '#FF6347', near: 15, far: 70 }
  },
  {
    id: 'city',
    name: '城市',
    icon: '🏙️',
    color: '#4A5568',
    description: '繁华都市',
    background: 'linear-gradient(135deg, #2D3748 0%, #4A5568 50%, #718096 100%)',
    lighting: 'neutral',
    fog: { color: '#4A5568', near: 10, far: 50 }
  },
  {
    id: 'snow',
    name: '雪地',
    icon: '❄️',
    color: '#E0FFFF',
    description: '冰雪世界',
    background: 'linear-gradient(135deg, #E0FFFF 0%, #B0E0E6 50%, #87CEEB 100%)',
    lighting: 'bright',
    fog: { color: '#E0FFFF', near: 10, far: 40 }
  },
  {
    id: 'cherry',
    name: '樱花',
    icon: '🌸',
    color: '#FFB6C1',
    description: '樱花树下',
    background: 'linear-gradient(135deg, #FFB6C1 0%, #FFC0CB 50%, #FFE4E1 100%)',
    lighting: 'soft',
    fog: { color: '#FFB6C1', near: 15, far: 60 },
    particles: 'petals'
  },
  {
    id: 'night',
    name: '夜晚',
    icon: '🌙',
    color: '#191970',
    description: '宁静夜晚',
    background: 'linear-gradient(135deg, #191970 0%, #000080 50%, #4B0082 100%)',
    lighting: 'dark',
    fog: { color: '#191970', near: 5, far: 35 },
    stars: true
  },
  {
    id: 'cafe',
    name: '咖啡厅',
    icon: '☕',
    color: '#8B4513',
    description: '温馨咖啡厅',
    background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #CD853F 100%)',
    lighting: 'warm',
    fog: { color: '#8B4513', near: 12, far: 45 }
  },
  {
    id: 'stage',
    name: '舞台',
    icon: '🎭',
    color: '#800080',
    description: '聚光灯舞台',
    background: 'linear-gradient(135deg, #2D0040 0%, #4B0082 50%, #800080 100%)',
    lighting: 'spotlight',
    fog: { color: '#2D0040', near: 8, far: 40 }
  }
]

// 场景分类
export const sceneCategories = [
  { id: 'all', name: '全部', icon: '🔍' },
  { id: 'nature', name: '自然', icon: '🌿', scenes: ['beach', 'forest', 'sunset', 'snow', 'cherry'] },
  { id: 'urban', name: '城市', icon: '🏢', scenes: ['room', 'city', 'cafe', 'stage'] },
  { id: 'fantasy', name: '幻想', icon: '✨', scenes: ['space', 'night'] }
]

// 获取场景配置
export const getSceneConfig = (sceneId) => {
  return scenes.find(s => s.id === sceneId) || scenes[0]
}

export default scenes
