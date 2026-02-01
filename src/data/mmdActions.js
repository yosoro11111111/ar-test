// MMD动作数据生成器
// 为VRM模型生成 procedurally generated 动作数据

// 动作名称库
const actionNames = {
  basic: [
    ['站立', '👤'], ['走路', '🚶'], ['跑步', '🏃'], ['跳跃', '⬆️'],
    ['蹲下', '📉'], ['坐下', '🪑'], ['躺下', '🛌'], ['转身', '🔄'],
    ['挥手', '👋'], ['鼓掌', '👏'], ['点头', '⬇️'], ['摇头', '🙅'],
    ['张望', '👀'], ['鞠躬', '🙇'], ['伸展', '🤸'], ['平衡', '⚖️'],
    ['抬手', '✋'], ['踢腿', '🦵'], ['弯腰', '🙃'], ['侧身', '↔️'],
    ['踮脚', '🩰'], ['踏步', '👞'], ['后退', '🔙'], ['转圈', '🌀'],
    ['跨步', '🚶‍♂️'], ['耸肩', '🤷'], ['叉腰', '🕴️'], ['抱胸', '🙅‍♂️'],
    ['摸头', '🤚'], ['指向前方', '👉'], ['指向自己', '👈']
  ],
  dance: [
    ['机械舞', '🤖'], ['街舞', '🕺'], ['芭蕾', '🩰'], ['爵士舞', '🎷'],
    ['拉丁舞', '💃'], ['现代舞', '🎭'], ['民族舞', '🎎'], ['踢踏舞', '👞'],
    ['探戈', '🌹'], ['华尔兹', '🎻'], ['恰恰', '🥁'], ['伦巴', '🎺'],
    ['桑巴', '🎪'], ['弗拉明戈', '💃'], ['肚皮舞', '🧞'], ['钢管舞', '🎪'],
    ['霹雳舞', '🕺'], ['锁舞', '🔒'], [' popping', '🎤'], ['house', '🏠'],
    ['waacking', '👋'], ['voguing', '💅'], ['krump', '🦁'], ['hiphop', '🎧'],
    ['breaking', '🤸'], ['locking', '🔐'], ['jazz', '🎷'], ['contemporary', '🎨'],
    ['ballet', '🦢'], ['tap', '👠'], ['irish', '☘️'], ['salsa', '🌶️'],
    ['bachata', '🌴'], ['merengue', '🥥'], ['reggaeton', '🔥'], ['kpop', '🇰🇷'],
    ['jpop', '🇯🇵'], ['cpop', '🇨🇳'], ['anime', '🎌'], ['vocaloid', '🎤'],
    ['miku', '🎵'], ['rin', '🎶'], ['len', '🎸'], ['luka', '🎹'],
    ['meiko', '🎤'], ['kaito', '🎼'], ['gumi', '🥝'], ['ia', '🌙'],
    ['mayu', '🎀'], ['lily', '🌸'], ['gakupo', '🗡️'], ['kokone', '🎐']
  ],
  cute: [
    ['卖萌', '😊'], ['眨眼', '😉'], ['嘟嘴', '😗'], ['歪头', '🐱'],
    ['比心', '❤️'], ['飞吻', '😘'], ['害羞', '😳'], ['开心', '😄'],
    ['惊讶', '😲'], ['生气', '😠'], ['难过', '😢'], ['困惑', '😕'],
    ['期待', '✨'], ['兴奋', '🤩'], ['困倦', '😴'], ['撒娇', '🥺'],
    ['调皮', '😜'], ['可爱', '🥰'], ['甜美', '🍬'], ['活泼', '⚡'],
    ['优雅', '💎'], ['俏皮', '🎀'], ['温柔', '🌸'], ['呆萌', '🐼'],
    ['萌萌哒', '🍑'], ['卡哇伊', '🎎'], ['元气', '☀️'], ['治愈', '💊'],
    ['软萌', '🍡'], ['甜心', '🍭'], ['宝贝', '👶'], ['小可爱', '🧸'],
    ['小甜心', '🍯'], ['小天使', '👼'], ['小公主', '👑'], ['小仙女', '🧚'],
    ['小恶魔', '😈'], ['小猫咪', '🐱'], ['小兔子', '🐰'], ['小熊', '🐻'],
    ['小鹿', '🦌'], ['小鸟', '🐦'], ['小鱼', '🐠'], ['小蝴蝶', '🦋']
  ],
  cool: [
    ['酷炫', '😎'], ['帅气', '🕶️'], ['潇洒', '🌊'], ['自信', '💪'],
    ['霸气', '👑'], ['冷酷', '🧊'], ['神秘', '🌙'], ['深沉', '🌊'],
    ['淡定', '🧘'], ['从容', '🎯'], ['坚毅', '⚔️'], ['果敢', '🔥'],
    ['勇猛', '🦁'], ['无畏', '🦅'], ['高傲', '🦚'], ['优雅', '🦢'],
    ['绅士', '🎩'], ['型男', '💼'], ['潮人', '👟'], ['硬汉', '🛡️'],
    ['侠客', '⚔️'], ['忍者', '🥷'], ['武士', '⛩️'], ['骑士', '🏇'],
    ['特工', '🕵️'], ['飞行员', '✈️'], ['赛车手', '🏎️'], ['运动员', '🏆'],
    ['拳击手', '🥊'], ['武术家', '🥋'], ['舞者', '🕺'], ['歌手', '🎤'],
    ['吉他手', '🎸'], ['鼓手', '🥁'], ['DJ', '🎧'], ['说唱', '🎤'],
    ['街舞王', '🏆'], ['滑板', '🛹'], ['滑雪', '⛷️'], ['冲浪', '🏄']
  ],
  expression: [
    ['微笑', '😊'], ['大笑', '😂'], ['偷笑', '🤭'], ['坏笑', '😏'],
    ['苦笑', '😅'], ['冷笑', '😒'], ['嘲笑', '😤'], ['奸笑', '😼'],
    ['微笑', '🙂'], ['开心', '😄'], ['难过', '😢'], ['生气', '😠'],
    ['惊讶', '😲'], ['害怕', '😨'], ['厌恶', '🤢'], ['困惑', '😕'],
    ['无聊', '😑'], ['疲惫', '😫'], ['紧张', '😰'], ['放松', '😌'],
    ['专注', '🤔'], ['迷茫', '😶'], ['期待', '✨'], ['失望', '😞'],
    ['满足', '😌'], ['感激', '🙏'], ['抱歉', '🙇'], ['骄傲', '😤'],
    ['害羞', '😳'], ['尴尬', '😅'], ['无奈', '🤷'], ['愤怒', '🤬'],
    ['恐惧', '😱'], ['悲伤', '😭'], ['痛苦', '😣'], ['绝望', '😩'],
    ['希望', '🌟'], ['爱', '❤️'], ['恨', '💔'], ['嫉妒', '😒'],
    ['羡慕', '😍'], ['同情', '🥺'], ['感激', '🙏'], ['尊敬', '🙇‍♂️']
  ],
  special: [
    ['变身', '✨'], ['瞬移', '💨'], ['飞行', '🦅'], ['隐身', '👻'],
    ['分身', '👥'], ['变大', '📈'], ['变小', '📉'], ['变形', '🔄'],
    ['召唤', '🔮'], ['魔法', '✨'], ['超能力', '🦸'], ['时间停止', '⏱️'],
    ['空间转移', '🌀'], ['元素操控', '🔥'], ['治愈', '💚'], ['护盾', '🛡️'],
    ['剑气', '⚔️'], ['拳风', '👊'], ['脚踢', '🦶'], ['头槌', '🦌'],
    ['旋转', '🌪️'], ['冲刺', '💨'], ['跳跃', '⬆️'], ['翻滚', '🤸'],
    ['滑翔', '🪂'], ['攀爬', '🧗'], ['游泳', '🏊'], ['潜水', '🤿'],
    ['漂浮', '🎈'], ['坠落', '⬇️'], ['弹射', '🚀'], ['传送', '🌀'],
    ['召唤兽', '🐉'], ['机甲', '🤖'], ['武器', '⚔️'], ['道具', '🎒'],
    ['技能', '⚡'], ['必杀技', '💥'], ['终极技', '☄️'], ['觉醒', '🔥'],
    ['进化', '🦋'], ['退化', '🐛'], ['合体', '🔗'], ['分离', '✂️']
  ]
}

// 缓动函数
const EasingFunctions = {
  linear: t => t,
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: t => t * t * t,
  easeOutCubic: t => (--t) * t * t + 1,
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInSine: t => 1 - Math.cos(t * Math.PI / 2),
  easeOutSine: t => Math.sin(t * Math.PI / 2),
  easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2
}

// 生成骨骼数据
function createBone(rotation, position = null) {
  return {
    rotation: rotation,
    position: position
  }
}

// 生成单个动作
function generateAction(id, name, icon, category, type) {
  const duration = 2000 + Math.random() * 2000 // 2-4秒
  const loop = true
  
  // 生成关键帧
  const keyframes = []
  const frameCount = 4 + Math.floor(Math.random() * 4) // 4-7个关键帧
  
  for (let i = 0; i < frameCount; i++) {
    const progress = i / (frameCount - 1)
    const time = progress * duration
    
    // 生成骨骼数据
    const bones = generateBonesForAction(category, progress, type)
    
    keyframes.push({
      time: time,
      bones: bones,
      easing: ['easeInOutQuad', 'easeInOutSine', 'linear'][Math.floor(Math.random() * 3)]
    })
  }
  
  return {
    id: id,
    name: name,
    icon: icon,
    category: category,
    type: type,
    duration: duration,
    loop: loop,
    keyframes: keyframes
  }
}

// 根据动作分类生成骨骼数据
function generateBonesForAction(category, progress, type) {
  const bones = {}
  
  // 基础呼吸节奏
  const breathCycle = Math.sin(progress * Math.PI * 2)
  const actionCycle = Math.sin(progress * Math.PI * 4) // 更快的动作节奏
  
  // 动作强度（0.5-1.0）
  const intensity = 0.5 + Math.random() * 0.5
  
  // 根据分类调整运动模式
  switch(category) {
    case '舞蹈':
      // 舞蹈：全身大幅度运动
      bones.hips = createBone([0, actionCycle * 0.1, 0], [0, Math.abs(actionCycle) * 0.05, 0])
      bones.spine = createBone([actionCycle * 0.1, 0, actionCycle * 0.05])
      bones.chest = createBone([actionCycle * 0.08, 0, actionCycle * 0.08])
      bones.neck = createBone([actionCycle * 0.05, actionCycle * 0.08, 0])
      bones.head = createBone([actionCycle * 0.08, actionCycle * 0.1, actionCycle * 0.03])
      // 左臂完整链
      bones.leftShoulder = createBone([0, 0, actionCycle * 0.1])
      bones.leftUpperArm = createBone([0, 0, actionCycle * 0.8 * intensity])
      bones.leftLowerArm = createBone([actionCycle * 0.3, 0, actionCycle * 0.2])
      bones.leftHand = createBone([0, 0, actionCycle * 0.15])
      // 右臂完整链
      bones.rightShoulder = createBone([0, 0, -actionCycle * 0.1])
      bones.rightUpperArm = createBone([0, 0, -actionCycle * 0.8 * intensity])
      bones.rightLowerArm = createBone([actionCycle * 0.3, 0, -actionCycle * 0.2])
      bones.rightHand = createBone([0, 0, -actionCycle * 0.15])
      // 左腿完整链
      bones.leftUpperLeg = createBone([actionCycle * 0.5 * intensity, 0, 0])
      bones.leftLowerLeg = createBone([actionCycle > 0 ? actionCycle * 0.8 : 0.1, 0, 0])
      bones.leftFoot = createBone([actionCycle > 0 ? -actionCycle * 0.3 : -0.1, 0, 0])
      // 右腿完整链
      bones.rightUpperLeg = createBone([-actionCycle * 0.5 * intensity, 0, 0])
      bones.rightLowerLeg = createBone([actionCycle > 0 ? actionCycle * 0.8 : 0.1, 0, 0])
      bones.rightFoot = createBone([actionCycle > 0 ? -actionCycle * 0.3 : -0.1, 0, 0])
      break
      
    case '可爱':
      // 可爱：上半身为主，小幅度
      bones.hips = createBone([0, 0, 0], [0, breathCycle * 0.02, 0])
      bones.spine = createBone([breathCycle * 0.05, 0, 0])
      bones.chest = createBone([breathCycle * 0.03, 0, 0])
      bones.neck = createBone([breathCycle * 0.05, breathCycle * 0.05, 0])
      bones.head = createBone([breathCycle * 0.1, breathCycle * 0.1, 0])
      // 左臂完整链
      bones.leftShoulder = createBone([0, 0, breathCycle * 0.05])
      bones.leftUpperArm = createBone([0, 0, 0.3 + breathCycle * 0.2])
      bones.leftLowerArm = createBone([0.5 + breathCycle * 0.1, 0, 0])
      bones.leftHand = createBone([0, 0, breathCycle * 0.1])
      // 右臂完整链
      bones.rightShoulder = createBone([0, 0, -breathCycle * 0.05])
      bones.rightUpperArm = createBone([0, 0, -0.3 - breathCycle * 0.2])
      bones.rightLowerArm = createBone([0.5 + breathCycle * 0.1, 0, 0])
      bones.rightHand = createBone([0, 0, -breathCycle * 0.1])
      // 腿部自然站立
      bones.leftUpperLeg = createBone([0, 0, 0])
      bones.leftLowerLeg = createBone([0.1, 0, 0])
      bones.leftFoot = createBone([-0.1, 0, 0])
      bones.rightUpperLeg = createBone([0, 0, 0])
      bones.rightLowerLeg = createBone([0.1, 0, 0])
      bones.rightFoot = createBone([-0.1, 0, 0])
      break
      
    case '帅气':
      // 帅气：有力度的动作
      bones.hips = createBone([0, 0, actionCycle * 0.05])
      bones.spine = createBone([actionCycle * 0.08, 0, 0])
      bones.chest = createBone([actionCycle * 0.05, 0, 0])
      bones.neck = createBone([actionCycle * 0.03, 0, 0])
      bones.head = createBone([actionCycle * 0.05, actionCycle * 0.03, 0])
      // 左臂完整链
      bones.leftShoulder = createBone([0, 0, 0.1 + actionCycle * 0.1])
      bones.leftUpperArm = createBone([actionCycle * 0.2, 0, 0.5 + actionCycle * 0.2])
      bones.leftLowerArm = createBone([0.3 + actionCycle * 0.2, 0, 0])
      bones.leftHand = createBone([0, 0, actionCycle * 0.1])
      // 右臂完整链
      bones.rightShoulder = createBone([0, 0, -0.1 - actionCycle * 0.1])
      bones.rightUpperArm = createBone([actionCycle * 0.2, 0, -0.5 - actionCycle * 0.2])
      bones.rightLowerArm = createBone([0.3 + actionCycle * 0.2, 0, 0])
      bones.rightHand = createBone([0, 0, -actionCycle * 0.1])
      // 腿部
      bones.leftUpperLeg = createBone([0, 0, 0.1])
      bones.leftLowerLeg = createBone([0.2, 0, 0])
      bones.leftFoot = createBone([-0.15, 0, 0])
      bones.rightUpperLeg = createBone([0, 0, -0.1])
      bones.rightLowerLeg = createBone([0.2, 0, 0])
      bones.rightFoot = createBone([-0.15, 0, 0])
      break
      
    case '表情':
      // 表情：头部和手臂
      bones.hips = createBone([0, 0, 0])
      bones.spine = createBone([breathCycle * 0.02, 0, 0])
      bones.chest = createBone([breathCycle * 0.01, 0, 0])
      bones.neck = createBone([breathCycle * 0.1, breathCycle * 0.15, 0])
      bones.head = createBone([breathCycle * 0.15, breathCycle * 0.2, breathCycle * 0.05])
      // 左臂完整链
      bones.leftShoulder = createBone([0, 0, breathCycle * 0.05])
      bones.leftUpperArm = createBone([0, 0, breathCycle * 0.3])
      bones.leftLowerArm = createBone([breathCycle * 0.2, 0, 0])
      bones.leftHand = createBone([0, 0, breathCycle * 0.1])
      // 右臂完整链
      bones.rightShoulder = createBone([0, 0, -breathCycle * 0.05])
      bones.rightUpperArm = createBone([0, 0, -breathCycle * 0.3])
      bones.rightLowerArm = createBone([breathCycle * 0.2, 0, 0])
      bones.rightHand = createBone([0, 0, -breathCycle * 0.1])
      // 腿部自然
      bones.leftUpperLeg = createBone([0, 0, 0])
      bones.leftLowerLeg = createBone([0.1, 0, 0])
      bones.leftFoot = createBone([-0.1, 0, 0])
      bones.rightUpperLeg = createBone([0, 0, 0])
      bones.rightLowerLeg = createBone([0.1, 0, 0])
      bones.rightFoot = createBone([-0.1, 0, 0])
      break
      
    case '特殊':
      // 特殊：夸张动作
      bones.hips = createBone([actionCycle * 0.2, 0, 0], [0, Math.abs(actionCycle) * 0.1, 0])
      bones.spine = createBone([actionCycle * 0.15, actionCycle * 0.1, actionCycle * 0.1])
      bones.chest = createBone([actionCycle * 0.12, 0, actionCycle * 0.15])
      bones.neck = createBone([actionCycle * 0.1, actionCycle * 0.08, 0])
      bones.head = createBone([actionCycle * 0.12, actionCycle * 0.1, actionCycle * 0.05])
      // 左臂完整链
      bones.leftShoulder = createBone([actionCycle * 0.2, 0, actionCycle * 0.2])
      bones.leftUpperArm = createBone([actionCycle * 0.5, 0, actionCycle * 1.0 * intensity])
      bones.leftLowerArm = createBone([actionCycle * 0.4, 0, actionCycle * 0.3])
      bones.leftHand = createBone([0, 0, actionCycle * 0.2])
      // 右臂完整链
      bones.rightShoulder = createBone([actionCycle * 0.2, 0, -actionCycle * 0.2])
      bones.rightUpperArm = createBone([actionCycle * 0.5, 0, -actionCycle * 1.0 * intensity])
      bones.rightLowerArm = createBone([actionCycle * 0.4, 0, -actionCycle * 0.3])
      bones.rightHand = createBone([0, 0, -actionCycle * 0.2])
      // 左腿完整链
      bones.leftUpperLeg = createBone([actionCycle * 0.8 * intensity, 0, 0])
      bones.leftLowerLeg = createBone([actionCycle > 0 ? actionCycle * 1.2 : 0.2, 0, 0])
      bones.leftFoot = createBone([actionCycle > 0 ? -actionCycle * 0.5 : -0.2, 0, 0])
      // 右腿完整链
      bones.rightUpperLeg = createBone([-actionCycle * 0.8 * intensity, 0, 0])
      bones.rightLowerLeg = createBone([actionCycle > 0 ? actionCycle * 1.2 : 0.2, 0, 0])
      bones.rightFoot = createBone([actionCycle > 0 ? -actionCycle * 0.5 : -0.2, 0, 0])
      break
      
    default:
      // 基础：自然动作
      bones.hips = createBone([0, 0, 0], [0, breathCycle * 0.015, 0])
      bones.spine = createBone([breathCycle * 0.03, 0, 0])
      bones.chest = createBone([breathCycle * 0.04, 0, 0])
      bones.neck = createBone([breathCycle * 0.02, 0, 0])
      bones.head = createBone([breathCycle * 0.015, breathCycle * 0.02, 0])
      // 左臂完整链
      bones.leftShoulder = createBone([0, 0, breathCycle * 0.02])
      bones.leftUpperArm = createBone([0, 0, breathCycle * 0.1 + 0.1])
      bones.leftLowerArm = createBone([0.2 + breathCycle * 0.05, 0, 0])
      bones.leftHand = createBone([0, 0, breathCycle * 0.05])
      // 右臂完整链
      bones.rightShoulder = createBone([0, 0, -breathCycle * 0.02])
      bones.rightUpperArm = createBone([0, 0, -breathCycle * 0.1 - 0.1])
      bones.rightLowerArm = createBone([0.2 + breathCycle * 0.05, 0, 0])
      bones.rightHand = createBone([0, 0, -breathCycle * 0.05])
      // 腿部自然
      bones.leftUpperLeg = createBone([0, 0, 0])
      bones.leftLowerLeg = createBone([0.1, 0, 0])
      bones.leftFoot = createBone([-0.1, 0, 0])
      bones.rightUpperLeg = createBone([0, 0, 0])
      bones.rightLowerLeg = createBone([0.1, 0, 0])
      bones.rightFoot = createBone([-0.1, 0, 0])
  }
  
  return bones
}

// 批量生成所有动作
const generatedActions = []

// 生成基础动作 (30个)
actionNames.basic.forEach(([name, icon], index) => {
  try {
    const action = generateAction(
      `mmd_basic_${index}`,
      name,
      icon,
      '基础',
      'basic'
    )
    // 验证动作数据
    if (action && action.keyframes && action.keyframes.length > 0) {
      generatedActions.push(action)
    } else {
      console.warn(`⚠️ 动作生成失败: ${name}`)
    }
  } catch (error) {
    console.error(`❌ 生成动作失败 ${name}:`, error)
  }
})

// 生成舞蹈动作 (50个)
actionNames.dance.forEach(([name, icon], index) => {
  try {
    const action = generateAction(
      `mmd_dance_${index}`,
      name,
      icon,
      '舞蹈',
      'dance'
    )
    if (action && action.keyframes && action.keyframes.length > 0) {
      generatedActions.push(action)
    }
  } catch (error) {
    console.error(`❌ 生成动作失败 ${name}:`, error)
  }
})

// 生成可爱动作 (40个)
actionNames.cute.forEach(([name, icon], index) => {
  try {
    const action = generateAction(
      `mmd_cute_${index}`,
      name,
      icon,
      '可爱',
      'cute'
    )
    if (action && action.keyframes && action.keyframes.length > 0) {
      generatedActions.push(action)
    }
  } catch (error) {
    console.error(`❌ 生成动作失败 ${name}:`, error)
  }
})

// 生成帅气动作 (30个)
actionNames.cool.forEach(([name, icon], index) => {
  try {
    const action = generateAction(
      `mmd_cool_${index}`,
      name,
      icon,
      '帅气',
      'cool'
    )
    if (action && action.keyframes && action.keyframes.length > 0) {
      generatedActions.push(action)
    }
  } catch (error) {
    console.error(`❌ 生成动作失败 ${name}:`, error)
  }
})

// 生成表情动作 (25个)
actionNames.expression.forEach(([name, icon], index) => {
  try {
    const action = generateAction(
      `mmd_expression_${index}`,
      name,
      icon,
      '表情',
      'expression'
    )
    if (action && action.keyframes && action.keyframes.length > 0) {
      generatedActions.push(action)
    }
  } catch (error) {
    console.error(`❌ 生成动作失败 ${name}:`, error)
  }
})

// 生成特殊动作 (25个)
actionNames.special.forEach(([name, icon], index) => {
  try {
    const action = generateAction(
      `mmd_special_${index}`,
      name,
      icon,
      '特殊',
      'special'
    )
    if (action && action.keyframes && action.keyframes.length > 0) {
      generatedActions.push(action)
    }
  } catch (error) {
    console.error(`❌ 生成动作失败 ${name}:`, error)
  }
})

console.log(`✅ 成功生成 ${generatedActions.length} 个MMD动作`)

// 导出动作数据
export const mmdActions = generatedActions

// 按分类获取动作
export function getActionsByCategory(category) {
  return mmdActions.filter(action => action.category === category)
}

// 根据ID获取动作
export function getActionById(id) {
  return mmdActions.find(action => action.id === id)
}

// 获取所有动作分类
export function getCategories() {
  return ['基础', '舞蹈', '可爱', '帅气', '表情', '特殊']
}

// 简单的四元数类（用于避免万向节锁）
class SimpleQuaternion {
  constructor(x = 0, y = 0, z = 0, w = 1) {
    this.x = x
    this.y = y
    this.z = z
    this.w = w
  }
  
  // 从欧拉角创建四元数
  static fromEuler(euler) {
    const [x, y, z] = euler
    const cx = Math.cos(x * 0.5)
    const sx = Math.sin(x * 0.5)
    const cy = Math.cos(y * 0.5)
    const sy = Math.sin(y * 0.5)
    const cz = Math.cos(z * 0.5)
    const sz = Math.sin(z * 0.5)
    
    return new SimpleQuaternion(
      sx * cy * cz - cx * sy * sz,
      cx * sy * cz + sx * cy * sz,
      cx * cy * sz - sx * sy * cz,
      cx * cy * cz + sx * sy * sz
    )
  }
  
  // 转换为欧拉角
  toEuler() {
    const { x, y, z, w } = this
    
    const sinr_cosp = 2 * (w * x + y * z)
    const cosr_cosp = 1 - 2 * (x * x + y * y)
    const roll = Math.atan2(sinr_cosp, cosr_cosp)
    
    const sinp = 2 * (w * y - z * x)
    const pitch = Math.abs(sinp) >= 1 ? Math.sign(sinp) * Math.PI / 2 : Math.asin(sinp)
    
    const siny_cosp = 2 * (w * z + x * y)
    const cosy_cosp = 1 - 2 * (y * y + z * z)
    const yaw = Math.atan2(siny_cosp, cosy_cosp)
    
    return [roll, pitch, yaw]
  }
  
  // 球面插值
  slerp(target, t) {
    let dot = this.x * target.x + this.y * target.y + this.z * target.z + this.w * target.w
    
    if (dot < 0) {
      dot = -dot
      target = new SimpleQuaternion(-target.x, -target.y, -target.z, -target.w)
    }
    
    if (dot > 0.9995) {
      const result = new SimpleQuaternion(
        this.x + t * (target.x - this.x),
        this.y + t * (target.y - this.y),
        this.z + t * (target.z - this.z),
        this.w + t * (target.w - this.w)
      )
      const len = Math.sqrt(result.x * result.x + result.y * result.y + result.z * result.z + result.w * result.w)
      return new SimpleQuaternion(result.x / len, result.y / len, result.z / len, result.w / len)
    }
    
    const theta_0 = Math.acos(dot)
    const theta = theta_0 * t
    const sin_theta = Math.sin(theta)
    const sin_theta_0 = Math.sin(theta_0)
    
    const s0 = Math.cos(theta) - dot * sin_theta / sin_theta_0
    const s1 = sin_theta / sin_theta_0
    
    return new SimpleQuaternion(
      this.x * s0 + target.x * s1,
      this.y * s0 + target.y * s1,
      this.z * s0 + target.z * s1,
      this.w * s0 + target.w * s1
    )
  }
}

// 插值函数 - 使用简单的线性插值（更稳定）
export function interpolateKeyframes(action, elapsedTime) {
  // 验证输入
  if (!action || !action.keyframes || action.keyframes.length === 0) {
    console.warn('⚠️ interpolateKeyframes: 无效的动作数据')
    return {}
  }
  
  const { keyframes, duration, loop } = action
  
  // 计算当前时间位置
  let currentTime = elapsedTime
  if (loop) {
    currentTime = elapsedTime % duration
  } else {
    if (elapsedTime >= duration) {
      // 返回最后一帧
      return keyframes[keyframes.length - 1].bones
    }
  }
  
  // 找到当前时间所在的关键帧区间
  let prevFrame = keyframes[0]
  let nextFrame = keyframes[keyframes.length - 1]
  
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (currentTime >= keyframes[i].time && currentTime <= keyframes[i + 1].time) {
      prevFrame = keyframes[i]
      nextFrame = keyframes[i + 1]
      break
    }
  }
  
  // 计算插值比例
  const frameDuration = nextFrame.time - prevFrame.time
  const t = frameDuration > 0 ? (currentTime - prevFrame.time) / frameDuration : 0
  
  // 应用缓动函数
  const easingFn = EasingFunctions[prevFrame.easing] || EasingFunctions.easeInOutQuad
  const easedT = easingFn(Math.max(0, Math.min(1, t)))
  
  // 插值所有骨骼
  const result = {}
  const allBoneNames = new Set([
    ...Object.keys(prevFrame.bones || {}),
    ...Object.keys(nextFrame.bones || {})
  ])
  
  allBoneNames.forEach(boneName => {
    const prevBone = prevFrame.bones?.[boneName]
    const nextBone = nextFrame.bones?.[boneName]
    
    if (!prevBone && !nextBone) return
    
    const bone = {}
    
    // 插值位置 - 使用线性插值
    if (prevBone?.position || nextBone?.position) {
      const prevPos = prevBone?.position || [0, 0, 0]
      const nextPos = nextBone?.position || prevPos
      bone.position = [
        prevPos[0] + (nextPos[0] - prevPos[0]) * easedT,
        prevPos[1] + (nextPos[1] - prevPos[1]) * easedT,
        prevPos[2] + (nextPos[2] - prevPos[2]) * easedT
      ]
    }
    
    // 插值旋转 - 使用简单的线性插值（更稳定）
    if (prevBone?.rotation || nextBone?.rotation) {
      const prevRot = prevBone?.rotation || [0, 0, 0]
      const nextRot = nextBone?.rotation || prevRot
      
      // 简单的线性插值（对于大多数MMD动作已经足够）
      bone.rotation = [
        prevRot[0] + (nextRot[0] - prevRot[0]) * easedT,
        prevRot[1] + (nextRot[1] - prevRot[1]) * easedT,
        prevRot[2] + (nextRot[2] - prevRot[2]) * easedT
      ]
    }
    
    result[boneName] = bone
  })
  
  return result
}

// 导出辅助函数
export { generateAction, createBone, EasingFunctions }
