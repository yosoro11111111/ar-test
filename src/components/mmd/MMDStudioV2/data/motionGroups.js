/**
 * 动作组系统
 * 
 * 内置50个动作组，每个动作组包含一系列动作序列
 * 动作组可以拖放到时间轴上，自动展开为多个动作片段
 */

// 动作组分类
export const motionGroupCategories = [
  { id: 'daily', name: '日常动作', icon: '🚶' },
  { id: 'dance', name: '舞蹈动作', icon: '💃' },
  { id: 'emote', name: '表情动作', icon: '😊' },
  { id: 'performance', name: '表演动作', icon: '🎭' },
  { id: 'sports', name: '运动动作', icon: '⚽' },
  { id: 'combat', name: '战斗动作', icon: '⚔️' },
  { id: 'idle', name: '待机动作', icon: '🧍' },
  { id: 'interaction', name: '交互动作', icon: '🤝' }
]

// 内置50个动作组
export const builtinMotionGroups = [
  // ========== 日常动作 ==========
  {
    id: 'group_walk_cycle',
    name: '走路循环',
    category: 'daily',
    description: '自然的走路动作序列',
    duration: 8,
    motions: [
      { name: '起步', duration: 1, type: 'transition' },
      { name: '走路左', duration: 1, type: 'loop' },
      { name: '走路右', duration: 1, type: 'loop' },
      { name: '走路左', duration: 1, type: 'loop' },
      { name: '走路右', duration: 1, type: 'loop' },
      { name: '走路左', duration: 1, type: 'loop' },
      { name: '走路右', duration: 1, type: 'loop' },
      { name: '收步', duration: 1, type: 'transition' }
    ]
  },
  {
    id: 'group_run_cycle',
    name: '跑步循环',
    category: 'daily',
    description: '轻快的跑步动作序列',
    duration: 6,
    motions: [
      { name: '起跑', duration: 0.5, type: 'transition' },
      { name: '跑步', duration: 5, type: 'loop' },
      { name: '减速', duration: 0.5, type: 'transition' }
    ]
  },
  {
    id: 'group_sit_stand',
    name: '坐下站起',
    category: 'daily',
    description: '从站立到坐下再站起的完整动作',
    duration: 6,
    motions: [
      { name: '准备坐下', duration: 1, type: 'transition' },
      { name: '坐下', duration: 1.5, type: 'transition' },
      { name: '坐姿待机', duration: 2, type: 'idle' },
      { name: '起身', duration: 1.5, type: 'transition' }
    ]
  },
  {
    id: 'group_turn_around',
    name: '转身动作',
    category: 'daily',
    description: '向左转和向右转',
    duration: 4,
    motions: [
      { name: '左转准备', duration: 0.5, type: 'transition' },
      { name: '左转', duration: 1, type: 'transition' },
      { name: '停顿', duration: 0.5, type: 'idle' },
      { name: '右转', duration: 1, type: 'transition' },
      { name: '回正', duration: 1, type: 'transition' }
    ]
  },
  {
    id: 'group_bow_greet',
    name: '鞠躬问候',
    category: 'daily',
    description: '礼貌的鞠躬动作',
    duration: 4,
    motions: [
      { name: '准备', duration: 0.5, type: 'transition' },
      { name: '鞠躬', duration: 1.5, type: 'transition' },
      { name: '保持', duration: 1, type: 'idle' },
      { name: '起身', duration: 1, type: 'transition' }
    ]
  },
  {
    id: 'group_wave_hand',
    name: '挥手告别',
    category: 'daily',
    description: '友好的挥手动作',
    duration: 3,
    motions: [
      { name: '抬手', duration: 0.5, type: 'transition' },
      { name: '挥手', duration: 2, type: 'loop' },
      { name: '放下', duration: 0.5, type: 'transition' }
    ]
  },
  {
    id: 'group_clap_hands',
    name: '鼓掌动作',
    category: 'daily',
    description: '热情的鼓掌',
    duration: 4,
    motions: [
      { name: '准备', duration: 0.5, type: 'transition' },
      { name: '鼓掌', duration: 3, type: 'loop' },
      { name: '结束', duration: 0.5, type: 'transition' }
    ]
  },

  // ========== 舞蹈动作 ==========
  {
    id: 'group_dance_basic',
    name: '基础舞蹈',
    category: 'dance',
    description: '简单的舞蹈动作组合',
    duration: 16,
    motions: [
      { name: '准备姿势', duration: 1, type: 'transition' },
      { name: '手臂摆动', duration: 3, type: 'loop' },
      { name: '转身', duration: 2, type: 'transition' },
      { name: '侧步', duration: 3, type: 'loop' },
      { name: '手部动作', duration: 3, type: 'loop' },
      { name: '结束姿势', duration: 2, type: 'transition' },
      { name: '谢幕', duration: 2, type: 'transition' }
    ]
  },
  {
    id: 'group_dance_idol',
    name: '偶像舞蹈',
    category: 'dance',
    description: '活力满满的偶像风格舞蹈',
    duration: 20,
    motions: [
      { name: '开场姿势', duration: 2, type: 'transition' },
      { name: '活力跳跃', duration: 4, type: 'loop' },
      { name: '手指比心', duration: 2, type: 'transition' },
      { name: '旋转', duration: 3, type: 'transition' },
      { name: '挥手互动', duration: 4, type: 'loop' },
      { name: '最终姿势', duration: 3, type: 'transition' },
      { name: '飞吻', duration: 2, type: 'transition' }
    ]
  },
  {
    id: 'group_dance_elegant',
    name: '优雅舞蹈',
    category: 'dance',
    description: '优雅的芭蕾风格舞蹈',
    duration: 18,
    motions: [
      { name: '起始姿势', duration: 2, type: 'transition' },
      { name: '手臂舒展', duration: 4, type: 'loop' },
      { name: '踮脚旋转', duration: 3, type: 'transition' },
      { name: '裙摆飘动', duration: 4, type: 'loop' },
      { name: '结束姿势', duration: 3, type: 'transition' },
      { name: '行礼', duration: 2, type: 'transition' }
    ]
  },
  {
    id: 'group_dance_hiphop',
    name: '街舞风格',
    category: 'dance',
    description: '帅气的街舞动作',
    duration: 15,
    motions: [
      { name: '准备', duration: 1, type: 'transition' },
      { name: '律动', duration: 3, type: 'loop' },
      { name: '地板动作', duration: 3, type: 'transition' },
      { name: '起身', duration: 1, type: 'transition' },
      { name: '手势', duration: 3, type: 'loop' },
      { name: '结束', duration: 2, type: 'transition' }
    ]
  },
  {
    id: 'group_dance_waltz',
    name: '华尔兹',
    category: 'dance',
    description: '经典的华尔兹舞步',
    duration: 24,
    motions: [
      { name: '邀请姿势', duration: 2, type: 'transition' },
      { name: '前进', duration: 4, type: 'loop' },
      { name: '旋转', duration: 4, type: 'transition' },
      { name: '后退', duration: 4, type: 'loop' },
      { name: '侧步', duration: 4, type: 'loop' },
      { name: '结束姿势', duration: 4, type: 'transition' },
      { name: '行礼', duration: 2, type: 'transition' }
    ]
  },
  {
    id: 'group_dance_moe',
    name: '萌系舞蹈',
    category: 'dance',
    description: '可爱的萌系舞蹈',
    duration: 15,
    motions: [
      { name: '猫爪姿势', duration: 2, type: 'transition' },
      { name: '猫爪动作', duration: 3, type: 'loop' },
      { name: '转圈', duration: 2, type: 'transition' },
      { name: '跳跃', duration: 2, type: 'transition' },
      { name: '摇尾巴', duration: 3, type: 'loop' },
      { name: '结束', duration: 2, type: 'transition' }
    ]
  },

  // ========== 表情动作 ==========
  {
    id: 'group_happy_set',
    name: '开心表情组',
    category: 'emote',
    description: '一系列开心的表情和动作',
    duration: 8,
    motions: [
      { name: '微笑', duration: 1, type: 'expression' },
      { name: '开心点头', duration: 1.5, type: 'transition' },
      { name: '双手合十', duration: 1.5, type: 'transition' },
      { name: '跳跃', duration: 1, type: 'transition' },
      { name: '转圈', duration: 2, type: 'transition' },
      { name: '挥手', duration: 1, type: 'loop' }
    ]
  },
  {
    id: 'group_sad_set',
    name: '伤心表情组',
    category: 'emote',
    description: '表达伤心的动作组合',
    duration: 8,
    motions: [
      { name: '低头', duration: 1.5, type: 'transition' },
      { name: '擦眼泪', duration: 2, type: 'loop' },
      { name: '抽泣', duration: 2, type: 'loop' },
      { name: '抬头', duration: 1.5, type: 'transition' },
      { name: '深呼吸', duration: 1, type: 'transition' }
    ]
  },
  {
    id: 'group_angry_set',
    name: '生气表情组',
    category: 'emote',
    description: '表达愤怒的动作',
    duration: 7,
    motions: [
      { name: '叉腰', duration: 1, type: 'transition' },
      { name: '跺脚', duration: 2, type: 'loop' },
      { name: '指向前方', duration: 1.5, type: 'transition' },
      { name: '抱胸', duration: 1.5, type: 'transition' },
      { name: '扭头', duration: 1, type: 'transition' }
    ]
  },
  {
    id: 'group_surprised_set',
    name: '惊讶表情组',
    category: 'emote',
    description: '惊讶和震惊的动作',
    duration: 6,
    motions: [
      { name: '后仰', duration: 0.5, type: 'transition' },
      { name: '捂嘴', duration: 1, type: 'transition' },
      { name: '瞪眼', duration: 2, type: 'idle' },
      { name: '指向前方', duration: 1, type: 'transition' },
      { name: '恢复正常', duration: 1.5, type: 'transition' }
    ]
  },
  {
    id: 'group_shy_set',
    name: '害羞表情组',
    category: 'emote',
    description: '害羞和腼腆的动作',
    duration: 8,
    motions: [
      { name: '低头', duration: 1, type: 'transition' },
      { name: '手指纠缠', duration: 2, type: 'loop' },
      { name: '偷看', duration: 1.5, type: 'transition' },
      { name: '捂脸', duration: 2, type: 'transition' },
      { name: '摇头', duration: 1.5, type: 'transition' }
    ]
  },
  {
    id: 'group_think_set',
    name: '思考表情组',
    category: 'emote',
    description: '思考和疑惑的动作',
    duration: 8,
    motions: [
      { name: '托腮', duration: 1.5, type: 'transition' },
      { name: '思考', duration: 3, type: 'loop' },
      { name: '点头', duration: 1, type: 'transition' },
      { name: '恍然大悟', duration: 1.5, type: 'transition' },
      { name: '指向上方', duration: 1, type: 'transition' }
    ]
  },

  // ========== 表演动作 ==========
  {
    id: 'group_sing_performance',
    name: '歌唱表演',
    category: 'performance',
    description: '舞台歌唱表演动作',
    duration: 20,
    motions: [
      { name: '登场', duration: 2, type: 'transition' },
      { name: '拿麦克风', duration: 1, type: 'transition' },
      { name: '演唱', duration: 8, type: 'loop' },
      { name: '互动', duration: 4, type: 'loop' },
      { name: '高音姿势', duration: 3, type: 'transition' },
      { name: '谢幕', duration: 2, type: 'transition' }
    ]
  },
  {
    id: 'group_play_instrument',
    name: '乐器演奏',
    category: 'performance',
    description: '演奏乐器的动作',
    duration: 18,
    motions: [
      { name: '准备乐器', duration: 2, type: 'transition' },
      { name: '调整姿势', duration: 1, type: 'transition' },
      { name: '演奏', duration: 12, type: 'loop' },
      { name: '结束姿势', duration: 2, type: 'transition' },
      { name: '行礼', duration: 1, type: 'transition' }
    ]
  },
  {
    id: 'group_act_dramatic',
    name: '戏剧表演',
    category: 'performance',
    description: '戏剧化的表演动作',
    duration: 15,
    motions: [
      { name: '独白姿势', duration: 2, type: 'transition' },
      { name: '情感表达', duration: 4, type: 'loop' },
      { name: '指向观众', duration: 2, type: 'transition' },
      { name: '跪地', duration: 2, type: 'transition' },
      { name: '仰望', duration: 3, type: 'idle' },
      { name: '起身', duration: 2, type: 'transition' }
    ]
  },
  {
    id: 'group_magic_show',
    name: '魔术表演',
    category: 'performance',
    description: '魔术师表演动作',
    duration: 12,
    motions: [
      { name: '展示双手', duration: 1, type: 'transition' },
      { name: '变出物品', duration: 2, type: 'transition' },
      { name: '展示', duration: 2, type: 'loop' },
      { name: '消失', duration: 2, type: 'transition' },
      { name: '鞠躬', duration: 1, type: 'transition' },
      { name: '飞吻', duration: 1, type: 'transition' }
    ]
  },

  // ========== 运动动作 ==========
  {
    id: 'group_jump_rope',
    name: '跳绳动作',
    category: 'sports',
    description: '跳绳运动',
    duration: 10,
    motions: [
      { name: '准备', duration: 1, type: 'transition' },
      { name: '摇绳', duration: 0.5, type: 'loop' },
      { name: '跳跃', duration: 8, type: 'loop' },
      { name: '停止', duration: 0.5, type: 'transition' }
    ]
  },
  {
    id: 'group_shoot_basketball',
    name: '投篮动作',
    category: 'sports',
    description: '篮球投篮',
    duration: 5,
    motions: [
      { name: '运球', duration: 1.5, type: 'loop' },
      { name: '起跳', duration: 1, type: 'transition' },
      { name: '投篮', duration: 1.5, type: 'transition' },
      { name: '落地', duration: 0.5, type: 'transition' },
      { name: '庆祝', duration: 0.5, type: 'transition' }
    ]
  },
  {
    id: 'group_serve_tennis',
    name: '网球发球',
    category: 'sports',
    description: '网球发球动作',
    duration: 4,
    motions: [
      { name: '准备', duration: 1, type: 'transition' },
      { name: '抛球', duration: 0.5, type: 'transition' },
      { name: '挥拍', duration: 1, type: 'transition' },
      { name: '随挥', duration: 1, type: 'transition' },
      { name: '回位', duration: 0.5, type: 'transition' }
    ]
  },
  {
    id: 'group_swim_style',
    name: '游泳动作',
    category: 'sports',
    description: '自由泳动作',
    duration: 8,
    motions: [
      { name: '准备', duration: 1, type: 'transition' },
      { name: '划水', duration: 6, type: 'loop' },
      { name: '停止', duration: 1, type: 'transition' }
    ]
  },
  {
    id: 'group_yoga_pose',
    name: '瑜伽姿势',
    category: 'sports',
    description: '瑜伽动作组合',
    duration: 20,
    motions: [
      { name: '山式', duration: 2, type: 'idle' },
      { name: '前屈', duration: 3, type: 'transition' },
      { name: '平板', duration: 3, type: 'idle' },
      { name: '上犬', duration: 2, type: 'transition' },
      { name: '下犬', duration: 3, type: 'idle' },
      { name: '站立', duration: 2, type: 'transition' },
      { name: '树式', duration: 3, type: 'idle' },
      { name: '放松', duration: 2, type: 'transition' }
    ]
  },

  // ========== 战斗动作 ==========
  {
    id: 'group_sword_attack',
    name: '剑术攻击',
    category: 'combat',
    description: '剑术攻击动作',
    duration: 6,
    motions: [
      { name: '拔剑', duration: 1, type: 'transition' },
      { name: '斩击', duration: 1, type: 'transition' },
      { name: '回旋斩', duration: 1.5, type: 'transition' },
      { name: '突刺', duration: 1, type: 'transition' },
      { name: '收剑', duration: 1.5, type: 'transition' }
    ]
  },
  {
    id: 'group_martial_arts',
    name: '武术动作',
    category: 'combat',
    description: '中国武术动作',
    duration: 10,
    motions: [
      { name: '起势', duration: 1.5, type: 'transition' },
      { name: '马步', duration: 2, type: 'idle' },
      { name: '冲拳', duration: 1, type: 'transition' },
      { name: '踢腿', duration: 1, type: 'transition' },
      { name: '旋转', duration: 2, type: 'transition' },
      { name: '收势', duration: 2.5, type: 'transition' }
    ]
  },
  {
    id: 'group_dodge_roll',
    name: '闪避翻滚',
    category: 'combat',
    description: '战斗闪避动作',
    duration: 4,
    motions: [
      { name: '预警', duration: 0.5, type: 'transition' },
      { name: '侧闪', duration: 1, type: 'transition' },
      { name: '翻滚', duration: 1.5, type: 'transition' },
      { name: '起身', duration: 0.5, type: 'transition' },
      { name: '战斗姿势', duration: 0.5, type: 'transition' }
    ]
  },
  {
    id: 'group_archery',
    name: '弓箭射击',
    category: 'combat',
    description: '射箭动作',
    duration: 5,
    motions: [
      { name: '取箭', duration: 0.5, type: 'transition' },
      { name: '搭箭', duration: 0.5, type: 'transition' },
      { name: '拉弓', duration: 1.5, type: 'transition' },
      { name: '瞄准', duration: 1.5, type: 'idle' },
      { name: '放箭', duration: 0.5, type: 'transition' },
      { name: '收弓', duration: 0.5, type: 'transition' }
    ]
  },

  // ========== 待机动作 ==========
  {
    id: 'group_idle_normal',
    name: '普通待机',
    category: 'idle',
    description: '自然的待机动作',
    duration: 12,
    motions: [
      { name: '呼吸', duration: 4, type: 'loop' },
      { name: '看周围', duration: 2, type: 'transition' },
      { name: '调整姿势', duration: 1.5, type: 'transition' },
      { name: '继续呼吸', duration: 4.5, type: 'loop' }
    ]
  },
  {
    id: 'group_idle_nervous',
    name: '紧张待机',
    category: 'idle',
    description: '紧张的等待动作',
    duration: 8,
    motions: [
      { name: '踱步', duration: 3, type: 'loop' },
      { name: '看手表', duration: 1.5, type: 'transition' },
      { name: '叹气', duration: 1, type: 'transition' },
      { name: '继续踱步', duration: 2.5, type: 'loop' }
    ]
  },
  {
    id: 'group_idle_relaxed',
    name: '放松待机',
    category: 'idle',
    description: '放松的休息动作',
    duration: 15,
    motions: [
      { name: '伸懒腰', duration: 2, type: 'transition' },
      { name: '放松站立', duration: 5, type: 'loop' },
      { name: '打哈欠', duration: 2, type: 'transition' },
      { name: '揉眼睛', duration: 1.5, type: 'transition' },
      { name: '继续放松', duration: 4.5, type: 'loop' }
    ]
  },
  {
    id: 'group_idle_cold',
    name: '寒冷待机',
    category: 'idle',
    description: '感到寒冷的待机',
    duration: 8,
    motions: [
      { name: '抱臂', duration: 1, type: 'transition' },
      { name: '发抖', duration: 4, type: 'loop' },
      { name: '哈气', duration: 1.5, type: 'transition' },
      { name: '搓手', duration: 1.5, type: 'loop' }
    ]
  },

  // ========== 交互动作 ==========
  {
    id: 'group_handshake',
    name: '握手动作',
    category: 'interaction',
    description: '友好的握手',
    duration: 4,
    motions: [
      { name: '伸手', duration: 1, type: 'transition' },
      { name: '握手', duration: 2, type: 'loop' },
      { name: '收回', duration: 1, type: 'transition' }
    ]
  },
  {
    id: 'group_high_five',
    name: '击掌动作',
    category: 'interaction',
    description: '开心的击掌',
    duration: 3,
    motions: [
      { name: '举手', duration: 0.5, type: 'transition' },
      { name: '击掌', duration: 0.5, type: 'transition' },
      { name: '庆祝', duration: 1.5, type: 'transition' },
      { name: '放下', duration: 0.5, type: 'transition' }
    ]
  },
  {
    id: 'group_hug',
    name: '拥抱动作',
    category: 'interaction',
    description: '温暖的拥抱',
    duration: 5,
    motions: [
      { name: '张开双臂', duration: 1, type: 'transition' },
      { name: '拥抱', duration: 2.5, type: 'idle' },
      { name: '分开', duration: 1, type: 'transition' },
      { name: '微笑', duration: 0.5, type: 'expression' }
    ]
  },
  {
    id: 'group_point_show',
    name: '指向展示',
    category: 'interaction',
    description: '指向某物展示',
    duration: 6,
    motions: [
      { name: '转身', duration: 1, type: 'transition' },
      { name: '指向', duration: 0.5, type: 'transition' },
      { name: '保持指向', duration: 3, type: 'idle' },
      { name: '收回', duration: 0.5, type: 'transition' },
      { name: '回身', duration: 1, type: 'transition' }
    ]
  },
  {
    id: 'group_take_photo',
    name: '拍照姿势',
    category: 'interaction',
    description: '各种拍照姿势',
    duration: 10,
    motions: [
      { name: '剪刀手', duration: 2, type: 'transition' },
      { name: '保持', duration: 1, type: 'idle' },
      { name: '比心', duration: 2, type: 'transition' },
      { name: '保持', duration: 1, type: 'idle' },
      { name: '眨眼', duration: 0.5, type: 'expression' },
      { name: '飞吻', duration: 1.5, type: 'transition' },
      { name: '结束', duration: 1, type: 'transition' }
    ]
  },
  {
    id: 'group_selfie',
    name: '自拍动作',
    category: 'interaction',
    description: '自拍姿势组合',
    duration: 8,
    motions: [
      { name: '拿手机', duration: 1, type: 'transition' },
      { name: '找角度', duration: 2, type: 'loop' },
      { name: '嘟嘴', duration: 1.5, type: 'expression' },
      { name: '眨眼', duration: 1, type: 'expression' },
      { name: '查看照片', duration: 1.5, type: 'transition' },
      { name: '放下手机', duration: 1, type: 'transition' }
    ]
  },

  // ========== 特殊动作 ==========
  {
    id: 'group_sleep_wake',
    name: '睡觉醒来',
    category: 'daily',
    description: '从睡觉到醒来的完整动作',
    duration: 12,
    motions: [
      { name: '躺下', duration: 1.5, type: 'transition' },
      { name: '睡觉', duration: 4, type: 'loop' },
      { name: '翻身', duration: 1.5, type: 'transition' },
      { name: '打哈欠', duration: 2, type: 'transition' },
      { name: '坐起', duration: 2, type: 'transition' },
      { name: '揉眼睛', duration: 1, type: 'transition' }
    ]
  },
  {
    id: 'group_eat_meal',
    name: '用餐动作',
    category: 'daily',
    description: '吃饭的动作序列',
    duration: 15,
    motions: [
      { name: '拿餐具', duration: 1, type: 'transition' },
      { name: '取食物', duration: 1, type: 'transition' },
      { name: '送入口中', duration: 1, type: 'transition' },
      { name: '咀嚼', duration: 2, type: 'loop' },
      { name: '重复用餐', duration: 8, type: 'loop' },
      { name: '擦嘴', duration: 1, type: 'transition' },
      { name: '放下餐具', duration: 1, type: 'transition' }
    ]
  },
  {
    id: 'group_read_book',
    name: '阅读动作',
    category: 'daily',
    description: '看书的动作',
    duration: 20,
    motions: [
      { name: '拿书', duration: 1, type: 'transition' },
      { name: '翻开', duration: 1, type: 'transition' },
      { name: '阅读', duration: 12, type: 'loop' },
      { name: '翻页', duration: 1, type: 'transition' },
      { name: '继续阅读', duration: 3, type: 'loop' },
      { name: '合上书', duration: 1, type: 'transition' },
      { name: '放下', duration: 1, type: 'transition' }
    ]
  },
  {
    id: 'group_use_phone',
    name: '使用手机',
    category: 'daily',
    description: '看手机的动作',
    duration: 10,
    motions: [
      { name: '掏出手机', duration: 1, type: 'transition' },
      { name: '解锁', duration: 1, type: 'transition' },
      { name: '滑动', duration: 6, type: 'loop' },
      { name: '收起手机', duration: 2, type: 'transition' }
    ]
  },
  {
    id: 'group_knock_door',
    name: '敲门等待',
    category: 'daily',
    description: '敲门和等待',
    duration: 8,
    motions: [
      { name: '抬手', duration: 0.5, type: 'transition' },
      { name: '敲门', duration: 1.5, type: 'loop' },
      { name: '等待', duration: 3, type: 'idle' },
      { name: '再敲门', duration: 1, type: 'loop' },
      { name: '放下手', duration: 0.5, type: 'transition' },
      { name: '等待回应', duration: 1.5, type: 'idle' }
    ]
  },
  {
    id: 'group_open_door',
    name: '开门进入',
    category: 'daily',
    description: '开门和进入',
    duration: 6,
    motions: [
      { name: '伸手', duration: 0.5, type: 'transition' },
      { name: '转动把手', duration: 1, type: 'transition' },
      { name: '推门', duration: 1, type: 'transition' },
      { name: '进入', duration: 2, type: 'transition' },
      { name: '关门', duration: 1.5, type: 'transition' }
    ]
  },
  {
    id: 'group_salute_military',
    name: '军礼',
    category: 'performance',
    description: '标准的军礼',
    duration: 4,
    motions: [
      { name: '立正', duration: 1, type: 'transition' },
      { name: '抬手', duration: 1, type: 'transition' },
      { name: '保持敬礼', duration: 1.5, type: 'idle' },
      { name: '放下', duration: 0.5, type: 'transition' }
    ]
  },
  {
    id: 'group_curtsy',
    name: '屈膝礼',
    category: 'performance',
    description: '优雅的屈膝礼',
    duration: 5,
    motions: [
      { name: '提裙', duration: 1, type: 'transition' },
      { name: '屈膝', duration: 1.5, type: 'transition' },
      { name: '保持', duration: 1, type: 'idle' },
      { name: '起身', duration: 1, type: 'transition' },
      { name: '放下裙摆', duration: 0.5, type: 'transition' }
    ]
  }
]

/**
 * 根据分类获取动作组
 */
export function getMotionGroupsByCategory(categoryId) {
  return builtinMotionGroups.filter(group => group.category === categoryId)
}

/**
 * 获取所有动作组分类
 */
export function getMotionGroupCategories() {
  return motionGroupCategories
}

/**
 * 根据ID获取动作组
 */
export function getMotionGroupById(groupId) {
  return builtinMotionGroups.find(group => group.id === groupId)
}

/**
 * 搜索动作组
 */
export function searchMotionGroups(keyword) {
  const lowerKeyword = keyword.toLowerCase()
  return builtinMotionGroups.filter(group => 
    group.name.toLowerCase().includes(lowerKeyword) ||
    group.description.toLowerCase().includes(lowerKeyword)
  )
}

/**
 * 将动作组展开为时间轴片段
 * @param {Object} group - 动作组
 * @param {number} startTime - 开始时间
 * @returns {Array} 片段数组
 */
export function expandMotionGroupToClips(group, startTime = 0) {
  const clips = []
  let currentTime = startTime
  
  group.motions.forEach((motion, index) => {
    clips.push({
      id: `clip_${group.id}_${index}_${Date.now()}`,
      name: motion.name,
      type: 'motion',
      start: currentTime,
      end: currentTime + motion.duration,
      motionType: motion.type,
      groupId: group.id,
      groupName: group.name
    })
    currentTime += motion.duration
  })
  
  return clips
}
