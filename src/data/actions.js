// 100种动作数据 - 分类整理
export const actionCategories = [
  { id: 'basic', name: '基础', icon: '🚶', color: '#4ecdc4' },
  { id: 'emotion', name: '情绪', icon: '😊', color: '#ff6b6b' },
  { id: 'combat', name: '战斗', icon: '⚔️', color: '#ff9f43' },
  { id: 'dance', name: '舞蹈', icon: '💃', color: '#feca57' },
  { id: 'daily', name: '日常', icon: '🍽️', color: '#48dbfb' }
]

// 100种动作
export const actions = [
  // ========== 基础动作 (20种) ==========
  { id: 'idle', name: '待机', icon: '😌', category: 'basic', type: 'loop' },
  { id: 'walk', name: '行走', icon: '🚶', category: 'basic', type: 'loop' },
  { id: 'run', name: '奔跑', icon: '🏃', category: 'basic', type: 'loop' },
  { id: 'jump', name: '跳跃', icon: '⬆️', category: 'basic', type: 'once' },
  { id: 'sit', name: '坐下', icon: '🪑', category: 'basic', type: 'pose' },
  { id: 'lie', name: '躺下', icon: '🛏️', category: 'basic', type: 'pose' },
  { id: 'stand', name: '站立', icon: '🧍', category: 'basic', type: 'pose' },
  { id: 'crouch', name: '蹲下', icon: '🏋️', category: 'basic', type: 'pose' },
  { id: 'crawl', name: '爬行', icon: '🐛', category: 'basic', type: 'loop' },
  { id: 'climb', name: '攀爬', icon: '🧗', category: 'basic', type: 'loop' },
  { id: 'swim', name: '游泳', icon: '🏊', category: 'basic', type: 'loop' },
  { id: 'fly', name: '飞行', icon: '🦅', category: 'basic', type: 'loop' },
  { id: 'greet', name: '打招呼', icon: '👋', category: 'basic', type: 'once' },
  { id: 'wave', name: '挥手', icon: '👋', category: 'basic', type: 'loop' },
  { id: 'clap', name: '鼓掌', icon: '👏', category: 'basic', type: 'loop' },
  { id: 'bow', name: '鞠躬', icon: '🙇', category: 'basic', type: 'once' },
  { id: 'salute', name: '敬礼', icon: '🫡', category: 'basic', type: 'pose' },
  { id: 'handshake', name: '握手', icon: '🤝', category: 'basic', type: 'once' },
  { id: 'think', name: '思考', icon: '🤔', category: 'basic', type: 'pose' },
  { id: 'observe', name: '观察', icon: '👀', category: 'basic', type: 'loop' },

  // ========== 情绪表情 (20种) ==========
  { id: 'happy', name: '开心', icon: '😄', category: 'emotion', type: 'pose' },
  { id: 'laugh', name: '大笑', icon: '😂', category: 'emotion', type: 'loop' },
  { id: 'smile', name: '微笑', icon: '😊', category: 'emotion', type: 'pose' },
  { id: 'shy', name: '害羞', icon: '😳', category: 'emotion', type: 'pose' },
  { id: 'naughty', name: '调皮', icon: '😜', category: 'emotion', type: 'pose' },
  { id: 'sad', name: '伤心', icon: '😢', category: 'emotion', type: 'pose' },
  { id: 'cry', name: '哭泣', icon: '😭', category: 'emotion', type: 'loop' },
  { id: 'grievance', name: '委屈', icon: '🥺', category: 'emotion', type: 'pose' },
  { id: 'disappointed', name: '失望', icon: '😞', category: 'emotion', type: 'pose' },
  { id: 'depressed', name: '沮丧', icon: '😔', category: 'emotion', type: 'pose' },
  { id: 'angry', name: '生气', icon: '😠', category: 'emotion', type: 'pose' },
  { id: 'furious', name: '愤怒', icon: '😡', category: 'emotion', type: 'pose' },
  { id: 'irritable', name: '暴躁', icon: '🤬', category: 'emotion', type: 'pose' },
  { id: 'tsundere', name: '傲娇', icon: '😤', category: 'emotion', type: 'pose' },
  { id: 'indifferent', name: '冷漠', icon: '😒', category: 'emotion', type: 'pose' },
  { id: 'surprised', name: '惊讶', icon: '😲', category: 'emotion', type: 'once' },
  { id: 'shocked', name: '震惊', icon: '😱', category: 'emotion', type: 'once' },
  { id: 'scared', name: '害怕', icon: '😨', category: 'emotion', type: 'pose' },
  { id: 'nervous', name: '紧张', icon: '😰', category: 'emotion', type: 'loop' },
  { id: 'confused', name: '困惑', icon: '😕', category: 'emotion', type: 'pose' },

  // ========== 战斗动作 (20种) ==========
  { id: 'attack', name: '攻击', icon: '⚔️', category: 'combat', type: 'once' },
  { id: 'defend', name: '防御', icon: '🛡️', category: 'combat', type: 'pose' },
  { id: 'dodge', name: '闪避', icon: '💨', category: 'combat', type: 'once' },
  { id: 'block', name: '格挡', icon: '🛡️', category: 'combat', type: 'pose' },
  { id: 'hit', name: '受击', icon: '💥', category: 'combat', type: 'once' },
  { id: 'draw', name: '拔剑', icon: '🗡️', category: 'combat', type: 'once' },
  { id: 'sheath', name: '收剑', icon: '⚔️', category: 'combat', type: 'once' },
  { id: 'aim', name: '瞄准', icon: '🎯', category: 'combat', type: 'pose' },
  { id: 'shoot', name: '射击', icon: '🔫', category: 'combat', type: 'once' },
  { id: 'reload', name: '装填', icon: '🔋', category: 'combat', type: 'once' },
  { id: 'cast', name: '施法', icon: '✨', category: 'combat', type: 'once' },
  { id: 'chant', name: '吟唱', icon: '🎵', category: 'combat', type: 'loop' },
  { id: 'summon', name: '召唤', icon: '🔮', category: 'combat', type: 'once' },
  { id: 'transform', name: '变身', icon: '🦸', category: 'combat', type: 'once' },
  { id: 'burst', name: '爆发', icon: '💥', category: 'combat', type: 'once' },
  { id: 'victory', name: '胜利', icon: '🏆', category: 'combat', type: 'pose' },
  { id: 'defeat', name: '失败', icon: '💀', category: 'combat', type: 'pose' },
  { id: 'provoke', name: '挑衅', icon: '😤', category: 'combat', type: 'once' },
  { id: 'taunt', name: '嘲讽', icon: '😏', category: 'combat', type: 'once' },
  { id: 'alert', name: '警戒', icon: '👁️', category: 'combat', type: 'loop' },

  // ========== 舞蹈动作 (20种) ==========
  { id: 'hiphop', name: '街舞', icon: '🕺', category: 'dance', type: 'loop' },
  { id: 'ballet', name: '芭蕾', icon: '🩰', category: 'dance', type: 'loop' },
  { id: 'latin', name: '拉丁', icon: '💃', category: 'dance', type: 'loop' },
  { id: 'jazz', name: '爵士', icon: '🎷', category: 'dance', type: 'loop' },
  { id: 'modern', name: '现代舞', icon: '🎭', category: 'dance', type: 'loop' },
  { id: 'otaku', name: '宅舞', icon: '🎌', category: 'dance', type: 'loop' },
  { id: 'finger', name: '手势舞', icon: '👌', category: 'dance', type: 'loop' },
  { id: 'robot', name: '机械舞', icon: '🤖', category: 'dance', type: 'loop' },
  { id: 'breakdance', name: '霹雳舞', icon: '🌀', category: 'dance', type: 'loop' },
  { id: 'pole', name: '钢管舞', icon: '🎪', category: 'dance', type: 'loop' },
  { id: 'duet', name: '双人舞', icon: '👯', category: 'dance', type: 'loop' },
  { id: 'group', name: '群舞', icon: '👥', category: 'dance', type: 'loop' },
  { id: 'solo', name: '独舞', icon: '🕴️', category: 'dance', type: 'loop' },
  { id: 'backup', name: '伴舞', icon: '💫', category: 'dance', type: 'loop' },
  { id: 'lead', name: '领舞', icon: '⭐', category: 'dance', type: 'loop' },
  { id: 'spin', name: '旋转', icon: '🌪️', category: 'dance', type: 'loop' },
  { id: 'leap', name: '跳跃', icon: '🦘', category: 'dance', type: 'once' },
  { id: 'slide', name: '滑步', icon: '🛹', category: 'dance', type: 'loop' },
  { id: 'freeze', name: '定格', icon: '🧊', category: 'dance', type: 'pose' },
  { id: 'finish', name: '收尾', icon: '🎬', category: 'dance', type: 'once' },

  // ========== 日常动作 (20种) ==========
  { id: 'eat', name: '吃饭', icon: '🍚', category: 'daily', type: 'loop' },
  { id: 'drink', name: '喝水', icon: '🥤', category: 'daily', type: 'once' },
  { id: 'sleep', name: '睡觉', icon: '😴', category: 'daily', type: 'pose' },
  { id: 'wake', name: '起床', icon: '🌅', category: 'daily', type: 'once' },
  { id: 'wash', name: '洗漱', icon: '🧼', category: 'daily', type: 'loop' },
  { id: 'read', name: '看书', icon: '📖', category: 'daily', type: 'loop' },
  { id: 'write', name: '写字', icon: '✍️', category: 'daily', type: 'loop' },
  { id: 'draw', name: '画画', icon: '🎨', category: 'daily', type: 'loop' },
  { id: 'play_piano', name: '弹琴', icon: '🎹', category: 'daily', type: 'loop' },
  { id: 'sing', name: '唱歌', icon: '🎤', category: 'daily', type: 'loop' },
  { id: 'phone', name: '打电话', icon: '📱', category: 'daily', type: 'loop' },
  { id: 'play_phone', name: '玩手机', icon: '📲', category: 'daily', type: 'loop' },
  { id: 'photo', name: '拍照', icon: '📸', category: 'daily', type: 'once' },
  { id: 'selfie', name: '自拍', icon: '🤳', category: 'daily', type: 'pose' },
  { id: 'live', name: '直播', icon: '📺', category: 'daily', type: 'loop' },
  { id: 'shop', name: '购物', icon: '🛍️', category: 'daily', type: 'loop' },
  { id: 'cook', name: '做饭', icon: '🍳', category: 'daily', type: 'loop' },
  { id: 'clean', name: '打扫', icon: '🧹', category: 'daily', type: 'loop' },
  { id: 'exercise', name: '运动', icon: '🏋️', category: 'daily', type: 'loop' },
  { id: 'rest', name: '休息', icon: '🛋️', category: 'daily', type: 'pose' }
]

// 静态姿势预设
export const posePresets = [
  { id: 'stand_normal', name: '标准站立', category: 'standing' },
  { id: 'stand_relaxed', name: '放松站立', category: 'standing' },
  { id: 'stand_confident', name: '自信站立', category: 'standing' },
  { id: 'stand_attention', name: '立正', category: 'standing' },
  { id: 'stand_cross_arm', name: '抱胸', category: 'standing' },
  { id: 'stand_hand_hip', name: '叉腰', category: 'standing' },
  { id: 'stand_back_hand', name: '背手', category: 'standing' },
  { id: 'sit_normal', name: '标准坐姿', category: 'sitting' },
  { id: 'sit_relax', name: '放松坐姿', category: 'sitting' },
  { id: 'sit_cross_leg', name: '盘腿坐', category: 'sitting' },
  { id: 'sit_kneel', name: '跪坐', category: 'sitting' },
  { id: 'sit_leg_up', name: '翘腿', category: 'sitting' },
  { id: 'hand_peace', name: '剪刀手', category: 'gesture' },
  { id: 'hand_heart', name: '比心', category: 'gesture' },
  { id: 'hand_ok', name: 'OK', category: 'gesture' },
  { id: 'hand_thumb', name: '点赞', category: 'gesture' },
  { id: 'hand_point', name: '指方向', category: 'gesture' },
  { id: 'face_wink', name: '眨眼', category: 'expression' },
  { id: 'face_pout', name: '嘟嘴', category: 'expression' },
  { id: 'face_tongue', name: '吐舌', category: 'expression' }
]

// 根据分类获取动作
export const getActionsByCategory = (categoryId) => {
  return actions.filter(action => action.category === categoryId)
}

// 搜索动作
export const searchActions = (keyword) => {
  if (!keyword) return actions
  const lowerKeyword = keyword.toLowerCase()
  return actions.filter(action => 
    action.name.toLowerCase().includes(lowerKeyword) ||
    action.id.toLowerCase().includes(lowerKeyword)
  )
}

export default actions
