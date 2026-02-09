/**
 * 资源分类和中文翻译
 * 
 * 为道具、动作等资源提供分类和中文显示名称
 */

// 道具分类
export const propCategories = [
  { id: 'all', name: '全部', icon: '📦' },
  { id: 'accessory', name: '配饰', icon: '💍' },
  { id: 'clothing', name: '服装', icon: '👗' },
  { id: 'weapon', name: '武器', icon: '⚔️' },
  { id: 'furniture', name: '家具', icon: '🪑' },
  { id: 'food', name: '食物', icon: '🍔' },
  { id: 'tool', name: '工具', icon: '🔧' },
  { id: 'instrument', name: '乐器', icon: '🎸' },
  { id: 'electronics', name: '电子产品', icon: '📱' },
  { id: 'nature', name: '自然', icon: '🌳' },
  { id: 'other', name: '其他', icon: '📎' }
]

// 道具名称映射（英文 -> 中文）
export const propNameMap = {
  // 配饰
  'glasses': '眼镜',
  'sunglasses': '太阳镜',
  'hat': '帽子',
  'cap': '鸭舌帽',
  'beret': '贝雷帽',
  'headphones': '耳机',
  'earrings': '耳环',
  'necklace': '项链',
  'bracelet': '手链',
  'watch': '手表',
  'ring': '戒指',
  'hairpin': '发夹',
  'ribbon': '丝带',
  'bow': '蝴蝶结',
  'crown': '皇冠',
  'mask': '面具',
  'scarf': '围巾',
  'gloves': '手套',
  'backpack': '背包',
  'bag': '手提包',
  
  // 服装
  'dress': '连衣裙',
  'skirt': '裙子',
  'shirt': '衬衫',
  't-shirt': 'T恤',
  'coat': '外套',
  'jacket': '夹克',
  'sweater': '毛衣',
  'uniform': '制服',
  'kimono': '和服',
  'cheongsam': '旗袍',
  'armor': '盔甲',
  'cape': '披风',
  'shoes': '鞋子',
  'boots': '靴子',
  'slippers': '拖鞋',
  'socks': '袜子',
  
  // 武器
  'sword': '剑',
  'katana': '武士刀',
  'knife': '刀',
  'dagger': '匕首',
  'spear': '长矛',
  'axe': '斧头',
  'hammer': '锤子',
  'bow': '弓',
  'arrow': '箭',
  'shield': '盾牌',
  'gun': '枪',
  'pistol': '手枪',
  'rifle': '步枪',
  'wand': '魔杖',
  'staff': '法杖',
  
  // 家具
  'chair': '椅子',
  'sofa': '沙发',
  'table': '桌子',
  'desk': '书桌',
  'bed': '床',
  'bookshelf': '书架',
  'lamp': '台灯',
  'clock': '时钟',
  'mirror': '镜子',
  'cushion': '靠垫',
  'curtain': '窗帘',
  'carpet': '地毯',
  
  // 食物
  'apple': '苹果',
  'banana': '香蕉',
  'orange': '橙子',
  'grape': '葡萄',
  'strawberry': '草莓',
  'cake': '蛋糕',
  'bread': '面包',
  'cookie': '饼干',
  'chocolate': '巧克力',
  'ice cream': '冰淇淋',
  'candy': '糖果',
  'lollipop': '棒棒糖',
  'popsicle': '冰棍',
  'donut': '甜甜圈',
  'pudding': '布丁',
  'tea': '茶',
  'coffee': '咖啡',
  'juice': '果汁',
  'milk': '牛奶',
  'soda': '汽水',
  'bento': '便当',
  'onigiri': '饭团',
  'ramen': '拉面',
  'sushi': '寿司',
  
  // 工具
  'umbrella': '雨伞',
  'parasol': '阳伞',
  'fan': '扇子',
  'book': '书',
  'notebook': '笔记本',
  'pen': '笔',
  'pencil': '铅笔',
  'brush': '画笔',
  'scissors': '剪刀',
  'key': '钥匙',
  'lock': '锁',
  'bottle': '瓶子',
  'cup': '杯子',
  'mug': '马克杯',
  'plate': '盘子',
  'bowl': '碗',
  'basket': '篮子',
  'box': '盒子',
  'suitcase': '行李箱',
  'ladder': '梯子',
  
  // 乐器
  'guitar': '吉他',
  'violin': '小提琴',
  'piano': '钢琴',
  'flute': '长笛',
  'drum': '鼓',
  'trumpet': '小号',
  'harp': '竖琴',
  'microphone': '麦克风',
  'mic': '麦克风',
  
  // 电子产品
  'phone': '手机',
  'smartphone': '智能手机',
  'tablet': '平板',
  'laptop': '笔记本电脑',
  'computer': '电脑',
  'camera': '相机',
  'gamepad': '游戏手柄',
  'console': '游戏机',
  'tv': '电视',
  'headset': '头戴耳机',
  'earphones': '耳机',
  'speaker': '音箱',
  'robot': '机器人',
  'drone': '无人机',
  
  // 自然
  'flower': '花',
  'rose': '玫瑰',
  'sunflower': '向日葵',
  'cherry blossom': '樱花',
  'sakura': '樱花',
  'tree': '树',
  'grass': '草',
  'rock': '石头',
  'shell': '贝壳',
  'starfish': '海星',
  'leaf': '叶子',
  'feather': '羽毛',
  'butterfly': '蝴蝶',
  'bird': '鸟',
  'cat': '猫',
  'dog': '狗',
  'rabbit': '兔子',
  'bear': '熊',
  'panda': '熊猫',
  'fish': '鱼'
}

// 动作分类
export const motionCategories = [
  { id: 'all', name: '全部', icon: '🎭' },
  { id: 'idle', name: '待机', icon: '🧍' },
  { id: 'walk', name: '行走', icon: '🚶' },
  { id: 'run', name: '跑步', icon: '🏃' },
  { id: 'dance', name: '舞蹈', icon: '💃' },
  { id: 'emote', name: '表情', icon: '😊' },
  { id: 'action', name: '动作', icon: '👋' },
  { id: 'fight', name: '战斗', icon: '⚔️' },
  { id: 'performance', name: '表演', icon: '🎬' },
  { id: 'sports', name: '运动', icon: '⚽' },
  { id: 'daily', name: '日常', icon: '🏠' }
]

// 动作名称映射（英文 -> 中文）
export const motionNameMap = {
  // 待机
  'idle': '待机',
  'idle1': '待机1',
  'idle2': '待机2',
  'idle3': '待机3',
  'stand': '站立',
  'sit': '坐下',
  'sit idle': '坐姿待机',
  'sleep': '睡觉',
  'sleep idle': '睡眠待机',
  'lie down': '躺下',
  'relax': '放松',
  'rest': '休息',
  'wait': '等待',
  'think': '思考',
  
  // 行走
  'walk': '走路',
  'walk forward': '向前走',
  'walk backward': '向后走',
  'walk left': '向左走',
  'walk right': '向右走',
  'walk cycle': '走路循环',
  'step': '迈步',
  'step forward': '向前迈步',
  'step back': '向后迈步',
  'turn left': '左转',
  'turn right': '右转',
  'turn around': '转身',
  
  // 跑步
  'run': '跑步',
  'run forward': '向前跑',
  'run backward': '向后跑',
  'sprint': '冲刺',
  'jog': '慢跑',
  'run cycle': '跑步循环',
  'dash': '疾跑',
  
  // 舞蹈
  'dance': '舞蹈',
  'dance1': '舞蹈1',
  'dance2': '舞蹈2',
  'dance3': '舞蹈3',
  'dance4': '舞蹈4',
  'dance5': '舞蹈5',
  'waltz': '华尔兹',
  'ballet': '芭蕾',
  'hip hop': '街舞',
  'idol dance': '偶像舞蹈',
  'moe dance': '萌舞',
  'para para': 'ParaPara',
  
  // 表情
  'happy': '开心',
  'joy': '喜悦',
  'smile': '微笑',
  'laugh': '大笑',
  'sad': '伤心',
  'cry': '哭泣',
  'angry': '生气',
  'mad': '愤怒',
  'surprised': '惊讶',
  'shocked': '震惊',
  'shy': '害羞',
  'embarrassed': '尴尬',
  'confused': '困惑',
  'scared': '害怕',
  'fear': '恐惧',
  'disgusted': '厌恶',
  'love': '喜爱',
  'blink': '眨眼',
  'wink': '眨眼（单）',
  'nod': '点头',
  'shake head': '摇头',
  
  // 动作
  'wave': '挥手',
  'greet': '问候',
  'hello': '你好',
  'bye': '再见',
  'goodbye': '告别',
  'bow': '鞠躬',
  'salute': '敬礼',
  'clap': '鼓掌',
  'cheer': '欢呼',
  'jump': '跳跃',
  'hop': '单脚跳',
  'crouch': '蹲下',
  'kneel': '跪下',
  'fall': '摔倒',
  'get up': '起身',
  'stretch': '伸展',
  'yawn': '打哈欠',
  'sneeze': '打喷嚏',
  'cough': '咳嗽',
  'eat': '吃',
  'drink': '喝',
  'read': '阅读',
  'write': '写字',
  'draw': '画画',
  'take photo': '拍照',
  'selfie': '自拍',
  'use phone': '使用手机',
  'point': '指向',
  'look': '看',
  'look around': '环顾',
  'look up': '向上看',
  'look down': '向下看',
  
  // 战斗
  'attack': '攻击',
  'punch': '拳击',
  'kick': '踢腿',
  'slash': '斩击',
  'stab': '刺击',
  'shoot': '射击',
  'aim': '瞄准',
  'reload': '换弹',
  'block': '格挡',
  'dodge': '闪避',
  'roll': '翻滚',
  'hit': '受击',
  'damage': '受伤',
  'die': '死亡',
  'knockdown': '击倒',
  'get up fight': '起身（战斗）',
  'victory': '胜利',
  'win': '获胜',
  'draw weapon': '拔武器',
  'sheath weapon': '收武器',
  'ready stance': '战斗姿势',
  'guard': '防御',
  'counter': '反击',
  'combo': '连击',
  'special': '必杀技',
  
  // 表演
  'sing': '唱歌',
  'play instrument': '演奏乐器',
  'act': '表演',
  'pose': '姿势',
  'model pose': '模特姿势',
  'curtsy': '屈膝礼',
  'kneel respect': '跪拜',
  'pray': '祈祷',
  'meditate': '冥想',
  'magic': '施法',
  'cast spell': '释放魔法',
  'summon': '召唤',
  'transform': '变身',
  
  // 运动
  'swim': '游泳',
  'dive': '潜水',
  'climb': '攀爬',
  'crawl': '爬行',
  'fly': '飞行',
  'glide': '滑翔',
  'swing': '摇摆',
  'slide': '滑行',
  'throw': '投掷',
  'catch': '接住',
  'kick ball': '踢球',
  'shoot ball': '投篮',
  'swing bat': '挥棒',
  'serve': '发球',
  'volley': '扣球',
  'gymnastics': '体操',
  'cartwheel': '侧手翻',
  'backflip': '后空翻',
  'frontflip': '前空翻',
  'handstand': '倒立',
  
  // 日常
  'open door': '开门',
  'close door': '关门',
  'knock': '敲门',
  'sit chair': '坐椅子',
  'stand chair': '从椅子站起',
  'lie bed': '躺在床上',
  'get up bed': '从床上起来',
  'pick up': '捡起',
  'put down': '放下',
  'push': '推',
  'pull': '拉',
  'lift': '举起',
  'carry': '搬运',
  'hold': '拿着',
  'give': '给予',
  'receive': '接收',
  'hug': '拥抱',
  'handshake': '握手',
  'high five': '击掌',
  'pat': '拍',
  'pet': '抚摸',
  'wash': '洗',
  'clean': '清洁',
  'cook': '烹饪',
  'work': '工作',
  'type': '打字',
  'operate': '操作'
}

// 场景分类
export const sceneCategories = [
  { id: 'all', name: '全部', icon: '🏞️' },
  { id: 'color', name: '纯色', icon: '🎨' },
  { id: 'indoor', name: '室内', icon: '🏠' },
  { id: 'outdoor', name: '室外', icon: '🌳' },
  { id: 'nature', name: '自然', icon: '🏔️' },
  { id: 'urban', name: '城市', icon: '🏙️' },
  { id: 'fantasy', name: '幻想', icon: '🏰' },
  { id: 'stage', name: '舞台', icon: '🎪' }
]

// 场景名称映射
export const sceneNameMap = {
  // 室内
  'room': '房间',
  'bedroom': '卧室',
  'living room': '客厅',
  'kitchen': '厨房',
  'bathroom': '浴室',
  'classroom': '教室',
  'office': '办公室',
  'library': '图书馆',
  'gym': '体育馆',
  'stage': '舞台',
  'theater': '剧场',
  'concert hall': '音乐厅',
  'studio': '工作室',
  'shop': '商店',
  'cafe': '咖啡厅',
  'restaurant': '餐厅',
  'hospital': '医院',
  'temple': '寺庙',
  'church': '教堂',
  'castle interior': '城堡内部',
  'dungeon': '地牢',
  
  // 室外
  'street': '街道',
  'park': '公园',
  'garden': '花园',
  'playground': '游乐场',
  'school yard': '校园',
  'courtyard': '庭院',
  'alley': '小巷',
  'plaza': '广场',
  'market': '市场',
  'harbor': '港口',
  'beach': '海滩',
  'pool': '游泳池',
  
  // 自然
  'forest': '森林',
  'woods': '树林',
  'jungle': '丛林',
  'meadow': '草地',
  'field': '田野',
  'hill': '小山',
  'mountain': '山',
  'cave': '洞穴',
  'desert': '沙漠',
  'snowfield': '雪地',
  'river': '河流',
  'lake': '湖泊',
  'waterfall': '瀑布',
  'ocean': '海洋',
  'island': '岛屿',
  'sky': '天空',
  'sunset': '日落',
  'night sky': '夜空',
  'starry sky': '星空',
  'aurora': '极光',
  
  // 城市
  'city': '城市',
  'downtown': '市中心',
  'suburbs': '郊区',
  'highway': '高速公路',
  'bridge': '桥',
  'tower': '塔',
  'skyscraper': '摩天大楼',
  'ruins': '废墟',
  'factory': '工厂',
  'station': '车站',
  'airport': '机场',
  'construction site': '工地',
  
  // 幻想
  'fantasy': '幻想世界',
  'castle': '城堡',
  'palace': '宫殿',
  'tower magic': '魔法塔',
  'floating island': '浮空岛',
  'space': '太空',
  'cyberspace': '赛博空间',
  'dream': '梦境',
  'heaven': '天堂',
  'hell': '地狱',
  'underwater': '水下',
  'crystal cave': '水晶洞穴'
}

// 音乐分类
export const musicCategories = [
  { id: 'all', name: '全部', icon: '🎵' },
  { id: 'pop', name: '流行', icon: '🎤' },
  { id: 'rock', name: '摇滚', icon: '🎸' },
  { id: 'classical', name: '古典', icon: '🎻' },
  { id: 'jazz', name: '爵士', icon: '🎷' },
  { id: 'electronic', name: '电子', icon: '🎹' },
  { id: 'folk', name: '民谣', icon: '🪕' },
  { id: 'anime', name: '动漫', icon: '🎌' },
  { id: 'game', name: '游戏', icon: '🎮' },
  { id: 'vocaloid', name: 'Vocaloid', icon: '🎤' }
]

// 角色分类
export const characterCategories = [
  { id: 'all', name: '全部', icon: '👤' },
  { id: 'human', name: '人类', icon: '👫' },
  { id: 'anime', name: '动漫', icon: '🎌' },
  { id: 'fantasy', name: '幻想', icon: '🧝' },
  { id: 'animal', name: '动物', icon: '🐾' },
  { id: 'robot', name: '机器人', icon: '🤖' },
  { id: 'monster', name: '怪物', icon: '👹' }
]

/**
 * 获取资源的中文名称
 * @param {string} name - 英文名称
 * @param {string} type - 资源类型
 * @returns {string} 中文名称
 */
export function getChineseName(name, type = 'prop') {
  if (!name) return ''
  
  const lowerName = name.toLowerCase()
  let map = {}
  
  switch (type) {
    case 'prop':
    case 'props':
      map = propNameMap
      break
    case 'motion':
    case 'motions':
      map = motionNameMap
      break
    case 'scene':
    case 'scenes':
      map = sceneNameMap
      break
    default:
      map = propNameMap
  }
  
  // 直接匹配
  if (map[lowerName]) {
    return map[lowerName]
  }
  
  // 尝试去除扩展名后匹配
  const nameWithoutExt = lowerName.replace(/\.[^/.]+$/, '')
  if (map[nameWithoutExt]) {
    return map[nameWithoutExt]
  }
  
  // 尝试部分匹配
  for (const [key, value] of Object.entries(map)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return value
    }
  }
  
  // 返回原名称
  return name
}

/**
 * 自动分类资源
 * @param {string} name - 资源名称
 * @param {string} type - 资源类型
 * @returns {string} 分类ID
 */
export function autoCategorize(name, type = 'prop') {
  if (!name) return 'other'
  
  const lowerName = name.toLowerCase()
  
  if (type === 'prop' || type === 'props') {
    // 检查道具分类
    for (const [key, value] of Object.entries(propNameMap)) {
      if (lowerName.includes(key)) {
        // 根据中文名称判断分类
        if (value.includes('镜') || value.includes('帽') || value.includes('饰') || 
            value.includes('包') || value.includes('巾') || value.includes('套')) {
          return 'accessory'
        }
        if (value.includes('服') || value.includes('衣') || value.includes('裙') || 
            value.includes('鞋') || value.includes('袜')) {
          return 'clothing'
        }
        if (value.includes('剑') || value.includes('刀') || value.includes('枪') || 
            value.includes('弓') || value.includes('盾') || value.includes('杖')) {
          return 'weapon'
        }
        if (value.includes('椅') || value.includes('桌') || value.includes('床') || 
            value.includes('柜') || value.includes('灯')) {
          return 'furniture'
        }
        if (value.includes('食') || value.includes('果') || value.includes('糕') || 
            value.includes('茶') || value.includes('饭') || value.includes('面')) {
          return 'food'
        }
        if (value.includes('琴') || value.includes('鼓') || value.includes('笛') || 
            value.includes('吉他') || value.includes('钢琴')) {
          return 'instrument'
        }
        if (value.includes('机') || value.includes('脑') || value.includes('话') || 
            value.includes('视') || value.includes('器')) {
          return 'electronics'
        }
      }
    }
    return 'other'
  }
  
  if (type === 'motion' || type === 'motions') {
    for (const [key, value] of Object.entries(motionNameMap)) {
      if (lowerName.includes(key)) {
        if (value.includes('待') || value.includes('站') || value.includes('坐') || value.includes('睡')) {
          return 'idle'
        }
        if (value.includes('走') || value.includes('步')) {
          return 'walk'
        }
        if (value.includes('跑')) {
          return 'run'
        }
        if (value.includes('舞')) {
          return 'dance'
        }
        if (value.includes('表') || value.includes('情')) {
          return 'emote'
        }
        if (value.includes('击') || value.includes('打') || value.includes('踢') || value.includes('斗')) {
          return 'fight'
        }
        if (value.includes('演') || value.includes('唱') || value.includes('奏')) {
          return 'performance'
        }
        if (value.includes('泳') || value.includes('爬') || value.includes('跳') || value.includes('翻')) {
          return 'sports'
        }
        return 'action'
      }
    }
    return 'action'
  }
  
  return 'other'
}
