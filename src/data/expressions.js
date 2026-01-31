// 角色表情系统数据
export const expressions = [
  { id: 'neutral', name: '自然', icon: '😐', color: '#95A5A6', description: '默认表情' },
  { id: 'happy', name: '开心', icon: '😊', color: '#F1C40F', description: '开心微笑' },
  { id: 'laugh', name: '大笑', icon: '😄', color: '#F39C12', description: '开怀大笑' },
  { id: 'sad', name: '伤心', icon: '😢', color: '#3498DB', description: '伤心难过' },
  { id: 'cry', name: '哭泣', icon: '😭', color: '#2980B9', description: '大哭' },
  { id: 'angry', name: '生气', icon: '😠', color: '#E74C3C', description: '愤怒' },
  { id: 'surprised', name: '惊讶', icon: '😲', color: '#9B59B6', description: '惊讶' },
  { id: 'shy', name: '害羞', icon: '😳', color: '#E91E63', description: '害羞脸红' },
  { id: 'wink', name: '眨眼', icon: '😉', color: '#FF69B4', description: '眨眼' },
  { id: 'cool', name: '酷', icon: '😎', color: '#34495E', description: '戴墨镜' },
  { id: 'love', name: '爱心', icon: '😍', color: '#E91E63', description: '花痴' },
  { id: 'sleepy', name: '困倦', icon: '😴', color: '#74B9FF', description: '困倦' },
  { id: 'confused', name: '困惑', icon: '😕', color: '#A29BFE', description: '困惑' },
  { id: 'excited', name: '兴奋', icon: '🤩', color: '#FDCB6E', description: '兴奋' },
  { id: 'nervous', name: '紧张', icon: '😰', color: '#81ECEC', description: '紧张' },
  { id: 'proud', name: '自豪', icon: '😏', color: '#00B894', description: '自豪' }
]

// 表情混合形状映射 (VRM BlendShape)
export const expressionBlendShapes = {
  neutral: {},
  happy: { happy: 1.0 },
  laugh: { happy: 1.0, surprised: 0.3 },
  sad: { sad: 1.0 },
  cry: { sad: 1.0, angry: 0.2 },
  angry: { angry: 1.0 },
  surprised: { surprised: 1.0 },
  shy: { happy: 0.3, surprised: 0.2 },
  wink: { blinkLeft: 1.0 },
  cool: {}, // 需要配合墨镜道具
  love: { happy: 0.8, surprised: 0.2 },
  sleepy: { blinkLeft: 0.5, blinkRight: 0.5 },
  confused: { surprised: 0.5 },
  excited: { happy: 1.0, surprised: 0.5 },
  nervous: { surprised: 0.3 },
  proud: { happy: 0.7 }
}

// 获取表情混合形状
export const getExpressionBlendShapes = (expressionId) => {
  return expressionBlendShapes[expressionId] || expressionBlendShapes.neutral
}

// 表情分类
export const expressionCategories = [
  { id: 'all', name: '全部', icon: '🔍' },
  { id: 'positive', name: '积极', icon: '✨', expressions: ['happy', 'laugh', 'love', 'excited', 'proud'] },
  { id: 'negative', name: '消极', icon: '💧', expressions: ['sad', 'cry', 'angry', 'nervous'] },
  { id: 'surprise', name: '惊讶', icon: '⚡', expressions: ['surprised', 'confused'] },
  { id: 'cute', name: '可爱', icon: '🌸', expressions: ['shy', 'wink', 'sleepy'] }
]

export default expressions
