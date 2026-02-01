// 家具系统数据 - 可装备在角色身上或周围
export const furnitureCategories = [
  { id: 'none', name: '无家具', icon: '❌', color: '#666' },
  { id: 'seat', name: '座椅', icon: '🪑', color: '#8B4513' },
  { id: 'bed', name: '床铺', icon: '🛏️', color: '#4A90E2' },
  { id: 'instrument', name: '乐器', icon: '🎸', color: '#E74C3C' },
  { id: 'accessory', name: '配饰', icon: '👑', color: '#F1C40F' },
  { id: 'tool', name: '工具', icon: '🔧', color: '#95A5A6' },
  { id: 'decoration', name: '装饰', icon: '🎀', color: '#FF69B4' }
]

// 家具列表 - 包含装备位置和适配动作 (全部使用MMD动作)
export const furnitureList = [
  // 无家具
  { id: 'none', name: '无家具', icon: '❌', category: 'none', color: '#666', position: 'none', autoPose: null },
  
  // 座椅类 - 使用MMD家具动作
  { id: 'chair', name: '椅子', icon: '🪑', category: 'seat', color: '#8B4513', position: 'under', autoPose: 'mmd_furniture_0', description: '普通木椅' },
  { id: 'sofa', name: '沙发', icon: '🛋️', category: 'seat', color: '#2C3E50', position: 'under', autoPose: 'mmd_furniture_4', description: '舒适沙发' },
  { id: 'stool', name: '凳子', icon: '🪑', category: 'seat', color: '#D2691E', position: 'under', autoPose: 'mmd_furniture_0', description: '高脚凳' },
  { id: 'throne', name: '王座', icon: '👑', category: 'seat', color: '#FFD700', position: 'under', autoPose: 'mmd_furniture_4', description: '豪华王座' },
  { id: 'swing', name: '秋千', icon: '🎠', category: 'seat', color: '#E91E63', position: 'under', autoPose: 'mmd_furniture_0', description: '浪漫秋千' },
  
  // 床铺类 - 使用MMD家具动作
  { id: 'bed_single', name: '单人床', icon: '🛏️', category: 'bed', color: '#4A90E2', position: 'under', autoPose: 'mmd_furniture_2', description: '单人床' },
  { id: 'bed_double', name: '双人床', icon: '🛌', category: 'bed', color: '#9B59B6', position: 'under', autoPose: 'mmd_furniture_2', description: '双人床' },
  { id: 'hammock', name: '吊床', icon: '🏝️', category: 'bed', color: '#27AE60', position: 'under', autoPose: 'mmd_furniture_14', description: '休闲吊床' },
  { id: 'futon', name: '榻榻米', icon: '🏠', category: 'bed', color: '#E67E22', position: 'under', autoPose: 'mmd_furniture_0', description: '日式榻榻米' },
  
  // 乐器类 - 使用MMD动作
  { id: 'guitar', name: '吉他', icon: '🎸', category: 'instrument', color: '#E74C3C', position: 'hand', autoPose: 'mmd_dance_10', description: '电吉他' },
  { id: 'piano', name: '钢琴', icon: '🎹', category: 'instrument', color: '#2C3E50', position: 'front', autoPose: 'mmd_dance_10', description: '三角钢琴' },
  { id: 'violin', name: '小提琴', icon: '🎻', category: 'instrument', color: '#8E44AD', position: 'hand', autoPose: 'mmd_dance_10', description: '小提琴' },
  { id: 'drum', name: '鼓', icon: '🥁', category: 'instrument', color: '#C0392B', position: 'front', autoPose: 'mmd_dance_12', description: '架子鼓' },
  { id: 'microphone', name: '麦克风', icon: '🎤', category: 'instrument', color: '#E91E63', position: 'hand', autoPose: 'mmd_cute_14', description: '专业麦克风' },
  { id: 'flute', name: '长笛', icon: '🎵', category: 'instrument', color: '#F39C12', position: 'hand', autoPose: 'mmd_dance_10', description: '长笛' },
  
  // 配饰类 - 使用MMD帅气动作
  { id: 'crown', name: '皇冠', icon: '👑', category: 'accessory', color: '#FFD700', position: 'head', autoPose: 'mmd_cool_0', description: '金色皇冠' },
  { id: 'glasses', name: '眼镜', icon: '👓', category: 'accessory', color: '#34495E', position: 'head', autoPose: 'mmd_cool_7', description: '时尚眼镜' },
  { id: 'sunglasses', name: '墨镜', icon: '🕶️', category: 'accessory', color: '#2C3E50', position: 'head', autoPose: 'mmd_cool_8', description: '酷炫墨镜' },
  { id: 'hat_cowboy', name: '牛仔帽', icon: '🤠', category: 'accessory', color: '#8B4513', position: 'head', autoPose: 'mmd_cool_0', description: '西部牛仔帽' },
  { id: 'hat_witch', name: '巫师帽', icon: '🧙', category: 'accessory', color: '#9B59B6', position: 'head', autoPose: 'mmd_cool_10', description: '魔法巫师帽' },
  { id: 'earrings', name: '耳环', icon: '💎', category: 'accessory', color: '#1ABC9C', position: 'head', autoPose: null, description: '钻石耳环' },
  { id: 'necklace', name: '项链', icon: '📿', category: 'accessory', color: '#F1C40F', position: 'chest', autoPose: null, description: '珍珠项链' },
  { id: 'scarf', name: '围巾', icon: '🧣', category: 'accessory', color: '#E74C3C', position: 'chest', autoPose: null, description: '温暖围巾' },
  { id: 'backpack', name: '背包', icon: '🎒', category: 'accessory', color: '#3498DB', position: 'back', autoPose: null, description: '双肩背包' },
  { id: 'wings', name: '翅膀', icon: '🦋', category: 'accessory', color: '#9B59B6', position: 'back', autoPose: 'mmd_special_0', description: '天使翅膀' },
  { id: 'tail', name: '尾巴', icon: '🦊', category: 'accessory', color: '#E67E22', position: 'hips', autoPose: 'mmd_cute_11', description: '可爱尾巴' },
  { id: 'halo', name: '光环', icon: '⭕', category: 'accessory', color: '#FFD700', position: 'head', autoPose: 'mmd_special_0', description: '神圣光环' },
  
  // 工具类 - 使用MMD特殊动作
  { id: 'sword', name: '剑', icon: '⚔️', category: 'tool', color: '#95A5A6', position: 'hand', autoPose: 'mmd_special_19', description: '骑士剑' },
  { id: 'shield', name: '盾牌', icon: '🛡️', category: 'tool', color: '#3498DB', position: 'hand', autoPose: 'mmd_special_18', description: '骑士盾' },
  { id: 'wand', name: '魔杖', icon: '🪄', category: 'tool', color: '#9B59B6', position: 'hand', autoPose: 'mmd_special_1', description: '魔法杖' },
  { id: 'bow', name: '弓箭', icon: '🏹', category: 'tool', color: '#8B4513', position: 'hand', autoPose: 'mmd_special_20', description: '长弓' },
  { id: 'umbrella', name: '伞', icon: '☂️', category: 'tool', color: '#E91E63', position: 'hand', autoPose: 'mmd_cool_16', description: '花伞' },
  { id: 'book', name: '书', icon: '📖', category: 'tool', color: '#E67E22', position: 'hand', autoPose: 'mmd_furniture_6', description: '魔法书' },
  { id: 'camera', name: '相机', icon: '📷', category: 'tool', color: '#2C3E50', position: 'hand', autoPose: 'mmd_cool_3', description: '相机' },
  { id: 'phone', name: '手机', icon: '📱', category: 'tool', color: '#3498DB', position: 'hand', autoPose: 'mmd_cool_22', description: '智能手机' },
  { id: 'laptop', name: '笔记本', icon: '💻', category: 'tool', color: '#34495E', position: 'hand', autoPose: 'mmd_furniture_6', description: '笔记本电脑' },
  { id: 'broom', name: '扫帚', icon: '🧹', category: 'tool', color: '#8B4513', position: 'hand', autoPose: 'mmd_special_5', description: '飞行扫帚' },
  { id: 'fishing_rod', name: '鱼竿', icon: '🎣', category: 'tool', color: '#27AE60', position: 'hand', autoPose: 'mmd_special_21', description: '钓鱼竿' },
  { id: 'paintbrush', name: '画笔', icon: '🖌️', category: 'tool', color: '#E74C3C', position: 'hand', autoPose: 'mmd_cool_24', description: '画笔' },
  
  // 装饰类 - 使用MMD可爱动作
  { id: 'flower', name: '花', icon: '🌸', category: 'decoration', color: '#FF69B4', position: 'hand', autoPose: 'mmd_cute_4', description: '樱花' },
  { id: 'bouquet', name: '花束', icon: '💐', category: 'decoration', color: '#E91E63', position: 'hand', autoPose: 'mmd_cute_4', description: '鲜花束' },
  { id: 'rose', name: '玫瑰', icon: '🌹', category: 'decoration', color: '#C0392B', position: 'hand', autoPose: 'mmd_cute_1', description: '红玫瑰' },
  { id: 'balloon', name: '气球', icon: '🎈', category: 'decoration', color: '#E74C3C', position: 'hand', autoPose: 'mmd_cute_6', description: '彩色气球' },
  { id: 'gift', name: '礼物', icon: '🎁', category: 'decoration', color: '#E91E63', position: 'hand', autoPose: 'mmd_cute_24', description: '礼物盒' },
  { id: 'candle', name: '蜡烛', icon: '🕯️', category: 'decoration', color: '#F39C12', position: 'hand', autoPose: 'mmd_special_1', description: '蜡烛' },
  { id: 'lollipop', name: '棒棒糖', icon: '🍭', category: 'decoration', color: '#9B59B6', position: 'hand', autoPose: 'mmd_cute_0', description: '彩虹棒棒糖' },
  { id: 'ice_cream', name: '冰淇淋', icon: '🍦', category: 'decoration', color: '#F1C40F', position: 'hand', autoPose: 'mmd_cute_0', description: '甜筒' },
  { id: 'drink', name: '饮料', icon: '🥤', category: 'decoration', color: '#E67E22', position: 'hand', autoPose: 'mmd_furniture_21', description: '奶茶' },
  { id: 'fan', name: '扇子', icon: '🪭', category: 'decoration', color: '#E74C3C', position: 'hand', autoPose: 'mmd_cool_24', description: '折扇' },
  { id: 'flag', name: '旗帜', icon: '🚩', category: 'decoration', color: '#E74C3C', position: 'hand', autoPose: 'mmd_cool_4', description: '小旗帜' },
  { id: 'star_wand', name: '仙女棒', icon: '✨', category: 'decoration', color: '#FFD700', position: 'hand', autoPose: 'mmd_special_1', description: '魔法仙女棒' }
]

// 根据分类获取家具
export const getFurnitureByCategory = (categoryId) => {
  if (categoryId === 'none' || categoryId === 'all') return furnitureList
  return furnitureList.filter(f => f.category === categoryId)
}

// 搜索家具
export const searchFurniture = (query) => {
  if (!query) return furnitureList
  const lowerQuery = query.toLowerCase()
  return furnitureList.filter(f => 
    f.name.toLowerCase().includes(lowerQuery) ||
    f.description?.toLowerCase().includes(lowerQuery) ||
    f.id.toLowerCase().includes(lowerQuery)
  )
}

// 获取家具位置类型说明
export const getPositionDescription = (position) => {
  const descriptions = {
    'none': '无',
    'head': '头部',
    'chest': '胸部',
    'back': '背部',
    'hips': '臀部',
    'hand': '手中',
    'under': '身下/周围',
    'front': '前方'
  }
  return descriptions[position] || position
}

export default furnitureList
