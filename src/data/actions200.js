// 200种动作数据 - 完整版
export const actionCategories = [
  { id: 'all', name: '全部', icon: '🔍', color: '#666' },
  { id: 'basic', name: '基础', icon: '🚶', color: '#4ecdc4' },
  { id: 'emotion', name: '情绪', icon: '😊', color: '#ff6b6b' },
  { id: 'combat', name: '战斗', icon: '⚔️', color: '#ff9f43' },
  { id: 'dance', name: '舞蹈', icon: '💃', color: '#feca57' },
  { id: 'daily', name: '日常', icon: '🍽️', color: '#48dbfb' },
  { id: 'pose', name: '姿势', icon: '🧍', color: '#a29bfe' },
  { id: 'social', name: '社交', icon: '🤝', color: '#fd79a8' },
  { id: 'sport', name: '运动', icon: '⚽', color: '#00b894' },
  { id: 'profession', name: '职业', icon: '👔', color: '#e17055' },
  { id: 'special', name: '特殊', icon: '✨', color: '#6c5ce7' }
]

// 200种动作
export const actions = [
  // ========== 基础动作 (20种) ==========
  { id: 'idle', name: '待机', icon: '😌', category: 'basic', type: 'loop', description: '自然站立' },
  { id: 'walk', name: '行走', icon: '🚶', category: 'basic', type: 'loop', description: '正常走路' },
  { id: 'run', name: '奔跑', icon: '🏃', category: 'basic', type: 'loop', description: '快速奔跑' },
  { id: 'jump', name: '跳跃', icon: '⬆️', category: 'basic', type: 'once', description: '向上跳跃' },
  { id: 'sit', name: '坐下', icon: '🪑', category: 'basic', type: 'pose', description: '标准坐姿' },
  { id: 'lie', name: '躺下', icon: '🛏️', category: 'basic', type: 'pose', description: '平躺休息' },
  { id: 'stand', name: '站立', icon: '🧍', category: 'basic', type: 'pose', description: '立正站立' },
  { id: 'crouch', name: '蹲下', icon: '🏋️', category: 'basic', type: 'pose', description: '蹲下姿势' },
  { id: 'crawl', name: '爬行', icon: '🐛', category: 'basic', type: 'loop', description: '匍匐前进' },
  { id: 'climb', name: '攀爬', icon: '🧗', category: 'basic', type: 'loop', description: '向上攀爬' },
  { id: 'swim', name: '游泳', icon: '🏊', category: 'basic', type: 'loop', description: '自由泳' },
  { id: 'fly', name: '飞行', icon: '🦅', category: 'basic', type: 'loop', description: '空中飞行' },
  { id: 'greet', name: '打招呼', icon: '👋', category: 'basic', type: 'once', description: '挥手致意' },
  { id: 'wave', name: '挥手', icon: '👋', category: 'basic', type: 'loop', description: '持续挥手' },
  { id: 'clap', name: '鼓掌', icon: '👏', category: 'basic', type: 'loop', description: '拍手鼓掌' },
  { id: 'bow', name: '鞠躬', icon: '🙇', category: 'basic', type: 'once', description: '弯腰鞠躬' },
  { id: 'salute', name: '敬礼', icon: '🫡', category: 'basic', type: 'pose', description: '军礼' },
  { id: 'handshake', name: '握手', icon: '🤝', category: 'basic', type: 'once', description: '握手动作' },
  { id: 'think', name: '思考', icon: '🤔', category: 'basic', type: 'pose', description: '思考姿势' },
  { id: 'observe', name: '观察', icon: '👀', category: 'basic', type: 'loop', description: '四处张望' },

  // ========== 情绪表情 (20种) ==========
  { id: 'happy', name: '开心', icon: '😄', category: 'emotion', type: 'pose', description: '开心表情' },
  { id: 'laugh', name: '大笑', icon: '😂', category: 'emotion', type: 'loop', description: '捧腹大笑' },
  { id: 'smile', name: '微笑', icon: '😊', category: 'emotion', type: 'pose', description: '温柔微笑' },
  { id: 'shy', name: '害羞', icon: '😳', category: 'emotion', type: 'pose', description: '害羞低头' },
  { id: 'naughty', name: '调皮', icon: '😜', category: 'emotion', type: 'pose', description: '吐舌调皮' },
  { id: 'sad', name: '伤心', icon: '😢', category: 'emotion', type: 'pose', description: '伤心低头' },
  { id: 'cry', name: '哭泣', icon: '😭', category: 'emotion', type: 'loop', description: '大哭' },
  { id: 'grievance', name: '委屈', icon: '🥺', category: 'emotion', type: 'pose', description: '委屈表情' },
  { id: 'disappointed', name: '失望', icon: '😞', category: 'emotion', type: 'pose', description: '失望叹气' },
  { id: 'depressed', name: '沮丧', icon: '😔', category: 'emotion', type: 'pose', description: '沮丧无力' },
  { id: 'angry', name: '生气', icon: '😠', category: 'emotion', type: 'pose', description: '愤怒表情' },
  { id: 'furious', name: '愤怒', icon: '😡', category: 'emotion', type: 'pose', description: '暴怒' },
  { id: 'irritable', name: '暴躁', icon: '🤬', category: 'emotion', type: 'pose', description: '暴躁跺脚' },
  { id: 'tsundere', name: '傲娇', icon: '😤', category: 'emotion', type: 'pose', description: '傲娇扭头' },
  { id: 'indifferent', name: '冷漠', icon: '😒', category: 'emotion', type: 'pose', description: '冷漠无视' },
  { id: 'surprised', name: '惊讶', icon: '😲', category: 'emotion', type: 'once', description: '吃惊表情' },
  { id: 'shocked', name: '震惊', icon: '😱', category: 'emotion', type: 'once', description: '震惊捂嘴' },
  { id: 'scared', name: '害怕', icon: '😨', category: 'emotion', type: 'pose', description: '恐惧颤抖' },
  { id: 'nervous', name: '紧张', icon: '😰', category: 'emotion', type: 'loop', description: '紧张冒汗' },
  { id: 'confused', name: '困惑', icon: '😕', category: 'emotion', type: 'pose', description: '困惑挠头' },

  // ========== 战斗动作 (20种) ==========
  { id: 'attack', name: '攻击', icon: '⚔️', category: 'combat', type: 'once', description: '挥剑攻击' },
  { id: 'defend', name: '防御', icon: '🛡️', category: 'combat', type: 'pose', description: '举盾防御' },
  { id: 'dodge', name: '闪避', icon: '💨', category: 'combat', type: 'once', description: '侧身闪避' },
  { id: 'block', name: '格挡', icon: '🛡️', category: 'combat', type: 'pose', description: '武器格挡' },
  { id: 'hit', name: '受击', icon: '💥', category: 'combat', type: 'once', description: '被击中' },
  { id: 'draw', name: '拔剑', icon: '🗡️', category: 'combat', type: 'once', description: '拔剑出鞘' },
  { id: 'sheath', name: '收剑', icon: '⚔️', category: 'combat', type: 'once', description: '收剑入鞘' },
  { id: 'aim', name: '瞄准', icon: '🎯', category: 'combat', type: 'pose', description: '举枪瞄准' },
  { id: 'shoot', name: '射击', icon: '🔫', category: 'combat', type: 'once', description: '开枪射击' },
  { id: 'reload', name: '装填', icon: '🔋', category: 'combat', type: 'once', description: '换弹夹' },
  { id: 'cast', name: '施法', icon: '✨', category: 'combat', type: 'once', description: '释放魔法' },
  { id: 'chant', name: '吟唱', icon: '🎵', category: 'combat', type: 'loop', description: '魔法吟唱' },
  { id: 'summon', name: '召唤', icon: '🔮', category: 'combat', type: 'once', description: '召唤生物' },
  { id: 'transform', name: '变身', icon: '🦸', category: 'combat', type: 'once', description: '变身强化' },
  { id: 'burst', name: '爆发', icon: '💥', category: 'combat', type: 'once', description: '能量爆发' },
  { id: 'victory', name: '胜利', icon: '🏆', category: 'combat', type: 'pose', description: '胜利姿势' },
  { id: 'defeat', name: '失败', icon: '💀', category: 'combat', type: 'pose', description: '战败跪地' },
  { id: 'provoke', name: '挑衅', icon: '😤', category: 'combat', type: 'once', description: '挑衅对手' },
  { id: 'taunt', name: '嘲讽', icon: '😏', category: 'combat', type: 'once', description: '嘲讽敌人' },
  { id: 'alert', name: '警戒', icon: '👁️', category: 'combat', type: 'loop', description: '战斗警戒' },

  // ========== 舞蹈动作 (20种) ==========
  { id: 'hiphop', name: '街舞', icon: '🕺', category: 'dance', type: 'loop', description: '嘻哈街舞' },
  { id: 'ballet', name: '芭蕾', icon: '🩰', category: 'dance', type: 'loop', description: '芭蕾舞' },
  { id: 'latin', name: '拉丁', icon: '💃', category: 'dance', type: 'loop', description: '拉丁舞' },
  { id: 'jazz', name: '爵士', icon: '🎷', category: 'dance', type: 'loop', description: '爵士舞' },
  { id: 'modern', name: '现代舞', icon: '🎭', category: 'dance', type: 'loop', description: '现代舞' },
  { id: 'otaku', name: '宅舞', icon: '🎌', category: 'dance', type: 'loop', description: '二次元宅舞' },
  { id: 'finger', name: '手势舞', icon: '👌', category: 'dance', type: 'loop', description: '手指舞蹈' },
  { id: 'robot', name: '机械舞', icon: '🤖', category: 'dance', type: 'loop', description: 'Popping' },
  { id: 'breakdance', name: '霹雳舞', icon: '🌀', category: 'dance', type: 'loop', description: 'Breaking' },
  { id: 'pole', name: '钢管舞', icon: '🎪', category: 'dance', type: 'loop', description: '钢管舞' },
  { id: 'duet', name: '双人舞', icon: '👯', category: 'dance', type: 'loop', description: '双人配合' },
  { id: 'group', name: '群舞', icon: '👥', category: 'dance', type: 'loop', description: '团体舞蹈' },
  { id: 'solo', name: '独舞', icon: '🕴️', category: 'dance', type: 'loop', description: '个人表演' },
  { id: 'backup', name: '伴舞', icon: '💫', category: 'dance', type: 'loop', description: '伴舞动作' },
  { id: 'lead', name: '领舞', icon: '⭐', category: 'dance', type: 'loop', description: '领舞动作' },
  { id: 'spin', name: '旋转', icon: '🌪️', category: 'dance', type: 'loop', description: '连续旋转' },
  { id: 'leap', name: '跳跃', icon: '🦘', category: 'dance', type: 'once', description: '舞蹈跳跃' },
  { id: 'slide', name: '滑步', icon: '🛹', category: 'dance', type: 'loop', description: '太空步' },
  { id: 'freeze', name: '定格', icon: '🧊', category: 'dance', type: 'pose', description: '定格姿势' },
  { id: 'finish', name: '收尾', icon: '🎬', category: 'dance', type: 'once', description: '结束动作' },

  // ========== 日常动作 (20种) ==========
  { id: 'eat', name: '吃饭', icon: '🍚', category: 'daily', type: 'loop', description: '用餐' },
  { id: 'drink', name: '喝水', icon: '🥤', category: 'daily', type: 'once', description: '喝水' },
  { id: 'sleep', name: '睡觉', icon: '😴', category: 'daily', type: 'pose', description: '睡觉' },
  { id: 'wake', name: '起床', icon: '🌅', category: 'daily', type: 'once', description: '伸懒腰' },
  { id: 'wash', name: '洗漱', icon: '🧼', category: 'daily', type: 'loop', description: '洗脸' },
  { id: 'read', name: '看书', icon: '📖', category: 'daily', type: 'loop', description: '阅读' },
  { id: 'write', name: '写字', icon: '✍️', category: 'daily', type: 'loop', description: '书写' },
  { id: 'draw', name: '画画', icon: '🎨', category: 'daily', type: 'loop', description: '绘画' },
  { id: 'play_piano', name: '弹琴', icon: '🎹', category: 'daily', type: 'loop', description: '弹钢琴' },
  { id: 'sing', name: '唱歌', icon: '🎤', category: 'daily', type: 'loop', description: '唱歌' },
  { id: 'phone', name: '打电话', icon: '📱', category: 'daily', type: 'loop', description: '通话' },
  { id: 'play_phone', name: '玩手机', icon: '📲', category: 'daily', type: 'loop', description: '看手机' },
  { id: 'photo', name: '拍照', icon: '📸', category: 'daily', type: 'once', description: '拍照' },
  { id: 'selfie', name: '自拍', icon: '🤳', category: 'daily', type: 'pose', description: '自拍姿势' },
  { id: 'live', name: '直播', icon: '📺', category: 'daily', type: 'loop', description: '直播互动' },
  { id: 'shop', name: '购物', icon: '🛍️', category: 'daily', type: 'loop', description: '逛街' },
  { id: 'cook', name: '做饭', icon: '🍳', category: 'daily', type: 'loop', description: '烹饪' },
  { id: 'clean', name: '打扫', icon: '🧹', category: 'daily', type: 'loop', description: '打扫卫生' },
  { id: 'exercise', name: '运动', icon: '🏋️', category: 'daily', type: 'loop', description: '健身' },
  { id: 'rest', name: '休息', icon: '🛋️', category: 'daily', type: 'pose', description: '休息放松' },

  // ========== 姿势动作 (20种) ==========
  { id: 'pose_peace', name: '剪刀手', icon: '✌️', category: 'pose', type: 'pose', description: 'V字手势' },
  { id: 'pose_heart', name: '比心', icon: '❤️', category: 'pose', type: 'pose', description: '爱心手势' },
  { id: 'pose_ok', name: 'OK', icon: '👌', category: 'pose', type: 'pose', description: 'OK手势' },
  { id: 'pose_thumb', name: '点赞', icon: '👍', category: 'pose', type: 'pose', description: '竖起大拇指' },
  { id: 'pose_point', name: '指方向', icon: '👉', category: 'pose', type: 'pose', description: '指向' },
  { id: 'pose_cross_arm', name: '抱胸', icon: '💪', category: 'pose', type: 'pose', description: '双臂交叉' },
  { id: 'pose_hand_hip', name: '叉腰', icon: '🕺', category: 'pose', type: 'pose', description: '单手叉腰' },
  { id: 'pose_back_hand', name: '背手', icon: '🙃', category: 'pose', type: 'pose', description: '双手背后' },
  { id: 'pose_kneel', name: '跪姿', icon: '🧎', category: 'pose', type: 'pose', description: '单膝跪地' },
  { id: 'pose_squat', name: '深蹲', icon: '🏋️', category: 'pose', type: 'pose', description: '深蹲姿势' },
  { id: 'pose_split', name: '一字马', icon: '🤸', category: 'pose', type: 'pose', description: '横叉' },
  { id: 'pose_bridge', name: '下腰', icon: '🌉', category: 'pose', type: 'pose', description: '拱桥' },
  { id: 'pose_handstand', name: '倒立', icon: '🙃', category: 'pose', type: 'pose', description: '单手倒立' },
  { id: 'pose_wink', name: '眨眼', icon: '😉', category: 'pose', type: 'pose', description: '眨眼' },
  { id: 'pose_pout', name: '嘟嘴', icon: '😗', category: 'pose', type: 'pose', description: '嘟嘴' },
  { id: 'pose_tongue', name: '吐舌', icon: '😛', category: 'pose', type: 'pose', description: '吐舌头' },
  { id: 'pose_cute', name: '卖萌', icon: '🥺', category: 'pose', type: 'pose', description: '可爱姿势' },
  { id: 'pose_cool', name: '耍酷', icon: '😎', category: 'pose', type: 'pose', description: '戴墨镜' },
  { id: 'pose_elegant', name: '优雅', icon: '💃', category: 'pose', type: 'pose', description: '优雅姿势' },
  { id: 'pose_power', name: '力量', icon: '💪', category: 'pose', type: 'pose', description: '展示肌肉' },

  // ========== 社交动作 (20种) ==========
  { id: 'social_hug', name: '拥抱', icon: '🤗', category: 'social', type: 'once', description: '张开双臂拥抱' },
  { id: 'social_kiss', name: '飞吻', icon: '😘', category: 'social', type: 'once', description: '送飞吻' },
  { id: 'social_highfive', name: '击掌', icon: '🙌', category: 'social', type: 'once', description: '高举击掌' },
  { id: 'social_cheer', name: '加油', icon: '🎉', category: 'social', type: 'loop', description: '加油打气' },
  { id: 'social_comfort', name: '安慰', icon: '🫂', category: 'social', type: 'once', description: '拍肩安慰' },
  { id: 'social_guide', name: '引导', icon: '👈', category: 'social', type: 'pose', description: '指引方向' },
  { id: 'social_invite', name: '邀请', icon: '🤝', category: 'social', type: 'pose', description: '伸手邀请' },
  { id: 'social_refuse', name: '拒绝', icon: '🙅', category: 'social', type: 'once', description: '摆手拒绝' },
  { id: 'social_agree', name: '同意', icon: '🙆', category: 'social', type: 'once', description: '点头同意' },
  { id: 'social_beg', name: '请求', icon: '🙏', category: 'social', type: 'pose', description: '双手合十' },
  { id: 'social_apologize', name: '道歉', icon: '🙇', category: 'social', type: 'once', description: '鞠躬道歉' },
  { id: 'social_thank', name: '感谢', icon: '🙏', category: 'social', type: 'once', description: '表示感谢' },
  { id: 'social_congratulate', name: '祝贺', icon: '🎊', category: 'social', type: 'once', description: '祝贺动作' },
  { id: 'social_mourn', name: '默哀', icon: '🕯️', category: 'social', type: 'pose', description: '低头默哀' },
  { id: 'social_respect', name: '尊敬', icon: '🙇', category: 'social', type: 'pose', description: '表达敬意' },
  { id: 'social_welcome', name: '欢迎', icon: '👐', category: 'social', type: 'once', description: '张开双臂欢迎' },
  { id: 'social_goodbye', name: '告别', icon: '👋', category: 'social', type: 'once', description: '挥手告别' },
  { id: 'social_introduce', name: '介绍', icon: '👤', category: 'social', type: 'pose', description: '介绍手势' },
  { id: 'social_listen', name: '倾听', icon: '👂', category: 'social', type: 'pose', description: '侧耳倾听' },
  { id: 'social_secret', name: '保密', icon: '🤫', category: 'social', type: 'pose', description: '嘘手势' },

  // ========== 运动动作 (20种) ==========
  { id: 'sport_pushup', name: '俯卧撑', icon: '💪', category: 'sport', type: 'loop', description: '俯卧撑' },
  { id: 'sport_situp', name: '仰卧起坐', icon: '🏋️', category: 'sport', type: 'loop', description: '腹肌训练' },
  { id: 'sport_squat', name: '深蹲', icon: '🦵', category: 'sport', type: 'loop', description: '腿部训练' },
  { id: 'sport_lunge', name: '弓步', icon: '🦵', category: 'sport', type: 'pose', description: '弓步蹲' },
  { id: 'sport_plank', name: '平板支撑', icon: '📏', category: 'sport', type: 'pose', description: '核心训练' },
  { id: 'sport_yoga', name: '瑜伽', icon: '🧘', category: 'sport', type: 'pose', description: '瑜伽姿势' },
  { id: 'sport_meditation', name: '冥想', icon: '🧘', category: 'sport', type: 'pose', description: '打坐冥想' },
  { id: 'sport_stretch', name: '拉伸', icon: '🤸', category: 'sport', type: 'loop', description: '伸展运动' },
  { id: 'sport_warmup', name: '热身', icon: '🔥', category: 'sport', type: 'loop', description: '热身运动' },
  { id: 'sport_boxing', name: '拳击', icon: '🥊', category: 'sport', type: 'loop', description: '打拳' },
  { id: 'sport_kick', name: '踢腿', icon: '🦶', category: 'sport', type: 'once', description: '高踢腿' },
  { id: 'sport_throw', name: '投掷', icon: '🎯', category: 'sport', type: 'once', description: '投掷动作' },
  { id: 'sport_catch', name: '接球', icon: '🏈', category: 'sport', type: 'once', description: '接球姿势' },
  { id: 'sport_dribble', name: '运球', icon: '🏀', category: 'sport', type: 'loop', description: '篮球运球' },
  { id: 'sport_shoot', name: '投篮', icon: '🏀', category: 'sport', type: 'once', description: '投篮动作' },
  { id: 'soccer_dribble', name: '带球', icon: '⚽', category: 'sport', type: 'loop', description: '足球带球' },
  { id: 'soccer_shoot', name: '射门', icon: '⚽', category: 'sport', type: 'once', description: '射门动作' },
  { id: 'tennis_serve', name: '发球', icon: '🎾', category: 'sport', type: 'once', description: '网球发球' },
  { id: 'golf_swing', name: '挥杆', icon: '🏌️', category: 'sport', type: 'once', description: '高尔夫挥杆' },
  { id: 'skiing', name: '滑雪', icon: '⛷️', category: 'sport', type: 'loop', description: '滑雪姿势' },

  // ========== 职业动作 (20种) ==========
  { id: 'profession_doctor', name: '医生', icon: '👨‍⚕️', category: 'profession', type: 'pose', description: '医生检查' },
  { id: 'profession_nurse', name: '护士', icon: '👩‍⚕️', category: 'profession', type: 'pose', description: '护士护理' },
  { id: 'profession_teacher', name: '教师', icon: '👨‍🏫', category: 'profession', type: 'pose', description: '讲课' },
  { id: 'profession_student', name: '学生', icon: '👨‍🎓', category: 'profession', type: 'pose', description: '举手回答' },
  { id: 'profession_chef', name: '厨师', icon: '👨‍🍳', category: 'profession', type: 'loop', description: '烹饪' },
  { id: 'profession_waiter', name: '服务员', icon: '💁', category: 'profession', type: 'pose', description: '端盘子' },
  { id: 'profession_police', name: '警察', icon: '👮', category: 'profession', type: 'pose', description: '指挥交通' },
  { id: 'profession_firefighter', name: '消防员', icon: '👨‍🚒', category: 'profession', type: 'pose', description: '灭火姿势' },
  { id: 'profession_driver', name: '司机', icon: '🚗', category: 'profession', type: 'pose', description: '驾驶' },
  { id: 'profession_pilot', name: '飞行员', icon: '✈️', category: 'profession', type: 'pose', description: '开飞机' },
  { id: 'profession_sailor', name: '水手', icon: '⚓', category: 'profession', type: 'pose', description: '掌舵' },
  { id: 'profession_farmer', name: '农民', icon: '👨‍🌾', category: 'profession', type: 'loop', description: '耕作' },
  { id: 'profession_worker', name: '工人', icon: '👷', category: 'profession', type: 'loop', description: '施工' },
  { id: 'profession_scientist', name: '科学家', icon: '👨‍🔬', category: 'profession', type: 'pose', description: '做实验' },
  { id: 'profession_artist', name: '艺术家', icon: '👨‍🎨', category: 'profession', type: 'loop', description: '创作' },
  { id: 'profession_musician', name: '音乐家', icon: '👨‍🎤', category: 'profession', type: 'loop', description: '演奏' },
  { id: 'profession_dancer', name: '舞蹈家', icon: '💃', category: 'profession', type: 'loop', description: '专业舞蹈' },
  { id: 'profession_athlete', name: '运动员', icon: '🏃', category: 'profession', type: 'pose', description: '准备起跑' },
  { id: 'profession_judge', name: '法官', icon: '⚖️', category: 'profession', type: 'pose', description: '敲法槌' },
  { id: 'profession_magic', name: '魔术师', icon: '🎩', category: 'profession', type: 'once', description: '变魔术' },

  // ========== 特殊动作 (20种) ==========
  { id: 'special_transform', name: '变身', icon: '🦸', category: 'special', type: 'once', description: '超级赛亚人' },
  { id: 'special_fly', name: '飞行', icon: '🦅', category: 'special', type: 'loop', description: '空中飞行' },
  { id: 'special_teleport', name: '瞬移', icon: '✨', category: 'special', type: 'once', description: '瞬间移动' },
  { id: 'special_invisible', name: '隐身', icon: '👻', category: 'special', type: 'once', description: '透明消失' },
  { id: 'special_clone', name: '分身', icon: '👥', category: 'special', type: 'once', description: '影分身' },
  { id: 'special_giant', name: '变大', icon: '🦕', category: 'special', type: 'once', description: '巨大化' },
  { id: 'special_shrink', name: '变小', icon: '🐜', category: 'special', type: 'once', description: '缩小' },
  { id: 'special_time_stop', name: '时停', icon: '⏱️', category: 'special', type: 'pose', description: '时间停止' },
  { id: 'special_rewind', name: '回溯', icon: '⏪', category: 'special', type: 'once', description: '时间倒流' },
  { id: 'special_portal', name: '传送门', icon: '🌀', category: 'special', type: 'once', description: '开启传送门' },
  { id: 'special_aura', name: '气场', icon: '🔥', category: 'special', type: 'loop', description: '爆发气场' },
  { id: 'special_charge', name: '蓄力', icon: '⚡', category: 'special', type: 'loop', description: '能量蓄力' },
  { id: 'special_heal', name: '治愈', icon: '💚', category: 'special', type: 'loop', description: '恢复魔法' },
  { id: 'special_shield', name: '护盾', icon: '🛡️', category: 'special', type: 'pose', description: '能量护盾' },
  { id: 'special_frozen', name: '冰冻', icon: '🧊', category: 'special', type: 'pose', description: '被冰冻' },
  { id: 'special_burn', name: '燃烧', icon: '🔥', category: 'special', type: 'loop', description: '火焰包围' },
  { id: 'special_electric', name: '电击', icon: '⚡', category: 'special', type: 'loop', description: '雷电环绕' },
  { id: 'special_poison', name: '中毒', icon: '☠️', category: 'special', type: 'loop', description: '中毒状态' },
  { id: 'special_sleep', name: '沉睡', icon: '💤', category: 'special', type: 'pose', description: '魔法沉睡' },
  { id: 'special_revive', name: '复活', icon: '✨', category: 'special', type: 'once', description: '满血复活' }
]

// 根据分类获取动作
export const getActionsByCategory = (categoryId) => {
  if (categoryId === 'all') return actions
  return actions.filter(action => action.category === categoryId)
}

// 搜索动作
export const searchActions = (query) => {
  if (!query) return actions
  const lowerQuery = query.toLowerCase()
  return actions.filter(action => 
    action.name.toLowerCase().includes(lowerQuery) ||
    action.description.toLowerCase().includes(lowerQuery) ||
    action.id.toLowerCase().includes(lowerQuery)
  )
}

// 获取动作总数
export const getTotalActionsCount = () => actions.length

// 获取分类统计
export const getCategoryStats = () => {
  return actionCategories.map(cat => ({
    ...cat,
    count: cat.id === 'all' ? actions.length : actions.filter(a => a.category === cat.id).length
  }))
}

export default actions
