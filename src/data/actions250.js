// 姿势数据 - 用于 PosePanel
// 简化版本，只保留基础姿势

export const actionCategories = [
  { id: 'basic', name: '基础', icon: '🧍' },
  { id: 'gesture', name: '手势', icon: '✌️' },
  { id: 'action', name: '动作', icon: '🏃' },
  { id: 'expression', name: '表情', icon: '😊' },
  { id: 'combat', name: '战斗', icon: '⚔️' },
  { id: 'dance', name: '舞蹈', icon: '💃' }
]

export const actions = [
  // 基础姿势
  { id: 'idle', name: '待机', category: 'basic', icon: '🧍', duration: 0 },
  { id: 'stand', name: '站立', category: 'basic', icon: '🧍', duration: 0 },
  { id: 'sit', name: '坐下', category: 'basic', icon: '🪑', duration: 0 },
  { id: 'crouch', name: '蹲下', category: 'basic', icon: '🏃', duration: 0 },
  { id: 'lie', name: '躺下', category: 'basic', icon: '🛌', duration: 0 },
  
  // 手势
  { id: 'wave', name: '挥手', category: 'gesture', icon: '👋', duration: 2000 },
  { id: 'peace', name: '剪刀手', category: 'gesture', icon: '✌️', duration: 0 },
  { id: 'heart', name: '比心', category: 'gesture', icon: '❤️', duration: 0 },
  { id: 'point', name: '指向', category: 'gesture', icon: '👉', duration: 0 },
  { id: 'salute', name: '敬礼', category: 'gesture', icon: '🫡', duration: 0 },
  
  // 动作
  { id: 'walk', name: '行走', category: 'action', icon: '🚶', duration: 2000 },
  { id: 'run', name: '奔跑', category: 'action', icon: '🏃', duration: 2000 },
  { id: 'jump', name: '跳跃', category: 'action', icon: '⬆️', duration: 1000 },
  { id: 'bend', name: '弯腰', category: 'action', icon: '🙇', duration: 0 },
  
  // 表情姿势
  { id: 'happy', name: '开心', category: 'expression', icon: '😊', duration: 0 },
  { id: 'sad', name: '悲伤', category: 'expression', icon: '😢', duration: 0 },
  { id: 'angry', name: '生气', category: 'expression', icon: '😠', duration: 0 },
  { id: 'surprised', name: '惊讶', category: 'expression', icon: '😲', duration: 0 },
  
  // 战斗姿势
  { id: 'attack', name: '攻击', category: 'combat', icon: '👊', duration: 1000 },
  { id: 'defend', name: '防御', category: 'combat', icon: '🛡️', duration: 0 },
  { id: 'dodge', name: '闪避', category: 'combat', icon: '💨', duration: 800 },
  
  // 舞蹈姿势
  { id: 'dance1', name: '舞蹈1', category: 'dance', icon: '💃', duration: 5000 },
  { id: 'dance2', name: '舞蹈2', category: 'dance', icon: '🕺', duration: 5000 }
]

export default actions
