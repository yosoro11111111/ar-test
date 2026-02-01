// MMD动作数据生成器 - 优化版
// 为VRM模型生成 procedurally generated 动作数据

// 动作名称库 - 去重并重新分类
const actionNames = {
  // 基础动作 - 30个
  basic: [
    ['站立', '👤'], ['走路', '🚶'], ['跑步', '🏃'], ['跳跃', '⬆️'],
    ['蹲下', '📉'], ['坐下', '🪑'], ['躺下', '🛌'], ['转身', '🔄'],
    ['挥手', '👋'], ['鼓掌', '👏'], ['点头', '⬇️'], ['摇头', '🙅'],
    ['张望', '👀'], ['鞠躬', '🙇'], ['伸展', '🤸'], ['平衡', '⚖️'],
    ['抬手', '✋'], ['踢腿', '🦵'], ['弯腰', '🙃'], ['侧身', '↔️'],
    ['踮脚', '🩰'], ['踏步', '👞'], ['后退', '🔙'], ['转圈', '🌀'],
    ['跨步', '🚶‍♂️'], ['耸肩', '🤷'], ['叉腰', '🕴️'], ['抱胸', '🙅‍♂️'],
    ['摸头', '🤚'], ['指向前方', '👉']
  ],
  
  // 舞蹈动作 - 统一中文名，30个
  dance: [
    ['机械舞', '🤖'], ['街舞', '🕺'], ['芭蕾', '🩰'], ['爵士舞', '🎷'],
    ['拉丁舞', '💃'], ['现代舞', '🎭'], ['民族舞', '🎎'], ['踢踏舞', '👞'],
    ['探戈', '🌹'], ['华尔兹', '🎻'], ['恰恰', '🥁'], ['伦巴', '🎺'],
    ['桑巴', '🎪'], ['弗拉明戈', '💃'], ['肚皮舞', '🧞'], ['钢管舞', '🎪'],
    ['霹雳舞', '🕺'], ['锁舞', '🔒'], ['甩手舞', '👋'], ['浩室舞', '🏠'],
    ['狂派舞', '🦁'], ['嘻哈舞', '🎧'], ['地板舞', '🤸'], ['爵士 funk', '🎷'],
    ['当代舞', '🎨'], ['天鹅舞', '🦢'], ['爱尔兰舞', '☘️'], ['萨尔萨', '🌶️'],
    ['巴恰塔', '🌴'], ['K-POP', '🇰🇷']
  ],
  
  // 表情动作 - 合并cute和expression，30个
  expression: [
    // 基础表情
    ['微笑', '😊'], ['大笑', '😂'], ['偷笑', '🤭'], ['坏笑', '😏'],
    ['害羞', '😳'], ['开心', '😄'], ['难过', '😢'], ['生气', '😠'],
    ['惊讶', '😲'], ['害怕', '😨'], ['困惑', '😕'], ['期待', '✨'],
    ['兴奋', '🤩'], ['困倦', '😴'], ['调皮', '😜'], ['可爱', '🥰'],
    // 萌系表情
    ['卖萌', '😊'], ['眨眼', '😉'], ['嘟嘴', '😗'], ['歪头', '🐱'],
    ['比心', '❤️'], ['飞吻', '😘'], ['撒娇', '🥺'], ['甜美', '🍬'],
    ['活泼', '⚡'], ['优雅', '💎'], ['俏皮', '🎀'], ['温柔', '🌸'],
    ['呆萌', '🐼'], ['元气', '☀️']
  ],
  
  // 酷炫动作 - 25个
  cool: [
    ['酷炫', '😎'], ['帅气', '🕶️'], ['潇洒', '🌊'], ['自信', '💪'],
    ['霸气', '👑'], ['冷酷', '🧊'], ['神秘', '🌙'], ['淡定', '🧘'],
    ['从容', '🎯'], ['坚毅', '⚔️'], ['果敢', '🔥'], ['勇猛', '🦁'],
    ['无畏', '🦅'], ['高傲', '🦚'], ['绅士', '🎩'], ['型男', '💼'],
    ['潮人', '👟'], ['硬汉', '🛡️'], ['侠客', '⚔️'], ['忍者', '🥷'],
    ['武士', '⛩️'], ['骑士', '🏇'], ['特工', '🕵️'], ['飞行员', '✈️'],
    ['赛车手', '🏎️']
  ],
  
  // 特殊动作 - 15个
  special: [
    ['变身', '✨'], ['瞬移', '💨'], ['飞行', '🦅'], ['隐身', '👻'],
    ['分身', '👥'], ['变大', '📈'], ['变小', '📉'], ['召唤', '🔮'],
    ['魔法', '✨'], ['超能力', '🦸'], ['剑气', '⚔️'], ['拳风', '👊'],
    ['必杀技', '💥'], ['觉醒', '🔥'], ['进化', '🦋']
  ],
  
  // 涩涩动作 - 20个
  sexy: [
    ['妩媚', '💋'], ['诱惑', '🌹'], ['撩发', '💇'], ['咬唇', '👄'],
    ['扭腰', '💃'], ['抛媚眼', '😉'], ['轻抚', '🤚'], ['依偎', '🫂'],
    ['侧身', '🌙'], ['回眸', '👀'], ['轻咬', '🦷'], ['舔唇', '👅'],
    ['抚胸', '❤️'], ['摸腿', '🦵'], ['翘臀', '🍑'], ['挺胸', '✨'],
    ['收腿', '🧘'], ['侧卧', '🛌'], ['俯卧', '😴'], ['蜷缩', '🐱']
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
    rotation: rotation || [0, 0, 0],
    position: position || null
  }
}

// 骨骼链配置 - 避免重复定义
const BONE_CHAIN = {
  // 上半身骨骼链
  upperBody: ['hips', 'spine', 'chest', 'neck', 'head'],
  // 左臂骨骼链
  leftArm: ['leftShoulder', 'leftUpperArm', 'leftLowerArm', 'leftHand'],
  // 右臂骨骼链
  rightArm: ['rightShoulder', 'rightUpperArm', 'rightLowerArm', 'rightHand'],
  // 左腿骨骼链
  leftLeg: ['leftUpperLeg', 'leftLowerLeg', 'leftFoot'],
  // 右腿骨骼链
  rightLeg: ['rightUpperLeg', 'rightLowerLeg', 'rightFoot']
}

// 动作配置 - 参数化定义
const ACTION_CONFIG = {
  basic: {
    intensity: 1.0,
    frequency: 2,
    description: '基础动作，幅度适中'
  },
  dance: {
    intensity: 3.0,
    frequency: 4,
    description: '舞蹈动作，大幅度运动'
  },
  expression: {
    intensity: 0.5,
    frequency: 1,
    description: '表情动作，小幅度细腻'
  },
  cool: {
    intensity: 1.5,
    frequency: 2,
    description: '酷炫动作，有力度感'
  },
  special: {
    intensity: 2.5,
    frequency: 3,
    description: '特殊动作，夸张效果'
  },
  sexy: {
    intensity: 1.2,
    frequency: 1.5,
    description: '涩涩动作，妩媚诱惑'
  }
}

// 生成动作骨骼数据 - 重构后的统一函数
function generateBonesForAction(category, actionCycle, intensity = 1.0) {
  const bones = {}
  const config = ACTION_CONFIG[category] || ACTION_CONFIG.basic
  const baseIntensity = config.intensity * intensity
  
  // 根据分类生成不同的骨骼数据
  switch(category) {
    case 'dance':
      // 舞蹈：全身大幅度运动
      generateDanceBones(bones, actionCycle, baseIntensity)
      break
      
    case 'expression':
      // 表情：上半身为主，小幅度
      generateExpressionBones(bones, actionCycle, baseIntensity)
      break
      
    case 'cool':
      // 酷炫：有力度感的动作
      generateCoolBones(bones, actionCycle, baseIntensity)
      break
      
    case 'special':
      // 特殊：夸张效果
      generateSpecialBones(bones, actionCycle, baseIntensity)
      break
      
    case 'sexy':
      // 涩涩：妩媚诱惑
      generateSexyBones(bones, actionCycle, baseIntensity)
      break
      
    default:
      // 基础：自然动作
      generateBasicBones(bones, actionCycle, baseIntensity)
  }
  
  return bones
}

// 舞蹈动作骨骼生成
function generateDanceBones(bones, actionCycle, intensity) {
  // 下半身 - 大幅度运动
  bones.hips = createBone([0, actionCycle * 0.5, 0], [0, Math.abs(actionCycle) * 0.2, 0])
  bones.spine = createBone([actionCycle * 0.4, 0, actionCycle * 0.2])
  bones.chest = createBone([actionCycle * 0.3, 0, actionCycle * 0.3])
  
  // 头部 - 跟随节奏
  bones.neck = createBone([actionCycle * 0.3, actionCycle * 0.4, 0])
  bones.head = createBone([actionCycle * 0.4, actionCycle * 0.5, actionCycle * 0.2])
  
  // 左臂 - 大幅度摆动
  bones.leftShoulder = createBone([0, 0, actionCycle * 0.5])
  bones.leftUpperArm = createBone([0, 0, actionCycle * 2.5 * intensity])
  bones.leftLowerArm = createBone([actionCycle * 1.0, 0, actionCycle * 0.8])
  bones.leftHand = createBone([0, 0, actionCycle * 0.6])
  
  // 右臂 - 大幅度摆动（反向）
  bones.rightShoulder = createBone([0, 0, -actionCycle * 0.5])
  bones.rightUpperArm = createBone([0, 0, -actionCycle * 2.5 * intensity])
  bones.rightLowerArm = createBone([actionCycle * 1.0, 0, -actionCycle * 0.8])
  bones.rightHand = createBone([0, 0, -actionCycle * 0.6])
  
  // 左腿 - 配合节奏
  bones.leftUpperLeg = createBone([actionCycle * 1.5 * intensity, 0, 0])
  bones.leftLowerLeg = createBone([actionCycle > 0 ? actionCycle * 2.0 : 0.3, 0, 0])
  bones.leftFoot = createBone([actionCycle > 0 ? -actionCycle * 0.8 : -0.3, 0, 0])
  
  // 右腿 - 配合节奏（反向）
  bones.rightUpperLeg = createBone([-actionCycle * 1.5 * intensity, 0, 0])
  bones.rightLowerLeg = createBone([actionCycle > 0 ? actionCycle * 2.0 : 0.3, 0, 0])
  bones.rightFoot = createBone([actionCycle > 0 ? -actionCycle * 0.8 : -0.3, 0, 0])
}

// 表情动作骨骼生成
function generateExpressionBones(bones, actionCycle, intensity) {
  // 下半身 - 保持稳定
  bones.hips = createBone([0, 0, 0], [0, Math.abs(actionCycle) * 0.05, 0])
  bones.spine = createBone([actionCycle * 0.1, 0, 0])
  bones.chest = createBone([actionCycle * 0.08, 0, 0])
  
  // 头部 - 细腻表情
  bones.neck = createBone([actionCycle * 0.15, actionCycle * 0.2, 0])
  bones.head = createBone([actionCycle * 0.2, actionCycle * 0.25, actionCycle * 0.1])
  
  // 左臂 - 小幅手势
  bones.leftShoulder = createBone([0, 0, actionCycle * 0.15])
  bones.leftUpperArm = createBone([0, 0, actionCycle * 0.5 * intensity + 0.2])
  bones.leftLowerArm = createBone([0.3 + actionCycle * 0.2, 0, 0])
  bones.leftHand = createBone([0, 0, actionCycle * 0.2])
  
  // 右臂 - 小幅手势
  bones.rightShoulder = createBone([0, 0, -actionCycle * 0.15])
  bones.rightUpperArm = createBone([0, 0, -actionCycle * 0.5 * intensity - 0.2])
  bones.rightLowerArm = createBone([0.3 + actionCycle * 0.2, 0, 0])
  bones.rightHand = createBone([0, 0, -actionCycle * 0.2])
  
  // 腿部 - 自然站立
  bones.leftUpperLeg = createBone([0, 0, 0])
  bones.leftLowerLeg = createBone([0.1, 0, 0])
  bones.leftFoot = createBone([-0.1, 0, 0])
  bones.rightUpperLeg = createBone([0, 0, 0])
  bones.rightLowerLeg = createBone([0.1, 0, 0])
  bones.rightFoot = createBone([-0.1, 0, 0])
}

// 酷炫动作骨骼生成
function generateCoolBones(bones, actionCycle, intensity) {
  // 下半身 - 稳定有力
  bones.hips = createBone([0, actionCycle * 0.3, 0], [0, Math.abs(actionCycle) * 0.1, 0])
  bones.spine = createBone([actionCycle * 0.25, 0, 0])
  bones.chest = createBone([actionCycle * 0.2, 0, 0])
  
  // 头部 - 自信姿态
  bones.neck = createBone([actionCycle * 0.2, actionCycle * 0.15, 0])
  bones.head = createBone([actionCycle * 0.15, actionCycle * 0.2, 0])
  
  // 左臂 - 有力动作
  bones.leftShoulder = createBone([0, 0, actionCycle * 0.3])
  bones.leftUpperArm = createBone([0, 0, actionCycle * 1.2 * intensity])
  bones.leftLowerArm = createBone([0.6 + actionCycle * 0.3, 0, 0])
  bones.leftHand = createBone([0, 0, actionCycle * 0.4])
  
  // 右臂 - 有力动作
  bones.rightShoulder = createBone([0, 0, -actionCycle * 0.3])
  bones.rightUpperArm = createBone([0, 0, -actionCycle * 1.2 * intensity])
  bones.rightLowerArm = createBone([0.6 + actionCycle * 0.3, 0, 0])
  bones.rightHand = createBone([0, 0, -actionCycle * 0.4])
  
  // 腿部 - 稳定站姿
  bones.leftUpperLeg = createBone([actionCycle * 0.4, 0, 0])
  bones.leftLowerLeg = createBone([0.2 + actionCycle * 0.15, 0, 0])
  bones.leftFoot = createBone([-0.2 + actionCycle * 0.1, 0, 0])
  bones.rightUpperLeg = createBone([-actionCycle * 0.4, 0, 0])
  bones.rightLowerLeg = createBone([0.2 + actionCycle * 0.15, 0, 0])
  bones.rightFoot = createBone([-0.2 + actionCycle * 0.1, 0, 0])
}

// 特殊动作骨骼生成
function generateSpecialBones(bones, actionCycle, intensity) {
  // 全身夸张动作
  bones.hips = createBone([0, actionCycle * 0.8, 0], [0, Math.abs(actionCycle) * 0.3, 0])
  bones.spine = createBone([actionCycle * 0.6, 0, actionCycle * 0.3])
  bones.chest = createBone([actionCycle * 0.5, 0, actionCycle * 0.4])
  
  // 头部 - 夸张表情
  bones.neck = createBone([actionCycle * 0.5, actionCycle * 0.6, 0])
  bones.head = createBone([actionCycle * 0.6, actionCycle * 0.7, actionCycle * 0.3])
  
  // 左臂 - 夸张动作
  bones.leftShoulder = createBone([0, 0, actionCycle * 0.8])
  bones.leftUpperArm = createBone([0, 0, actionCycle * 2.0 * intensity])
  bones.leftLowerArm = createBone([actionCycle * 1.2, 0, actionCycle * 0.6])
  bones.leftHand = createBone([0, 0, actionCycle * 0.8])
  
  // 右臂 - 夸张动作
  bones.rightShoulder = createBone([0, 0, -actionCycle * 0.8])
  bones.rightUpperArm = createBone([0, 0, -actionCycle * 2.0 * intensity])
  bones.rightLowerArm = createBone([actionCycle * 1.2, 0, -actionCycle * 0.6])
  bones.rightHand = createBone([0, 0, -actionCycle * 0.8])
  
  // 腿部 - 配合动作
  bones.leftUpperLeg = createBone([actionCycle * 1.0, 0, 0])
  bones.leftLowerLeg = createBone([0.4 + actionCycle * 0.4, 0, 0])
  bones.leftFoot = createBone([-0.4 + actionCycle * 0.2, 0, 0])
  bones.rightUpperLeg = createBone([-actionCycle * 1.0, 0, 0])
  bones.rightLowerLeg = createBone([0.4 + actionCycle * 0.4, 0, 0])
  bones.rightFoot = createBone([-0.4 + actionCycle * 0.2, 0, 0])
}

// 涩涩动作骨骼生成
function generateSexyBones(bones, actionCycle, intensity) {
  // 下半身 - 妩媚姿态
  bones.hips = createBone([0, actionCycle * 0.3, 0], [0, Math.abs(actionCycle) * 0.15, 0])
  bones.spine = createBone([actionCycle * 0.25, 0, actionCycle * 0.15])
  bones.chest = createBone([actionCycle * 0.2, 0, actionCycle * 0.2])

  // 头部 - 诱惑表情
  bones.neck = createBone([actionCycle * 0.2, actionCycle * 0.3, 0])
  bones.head = createBone([actionCycle * 0.15, actionCycle * 0.25, actionCycle * 0.1])

  // 左臂 - 妩媚手势
  bones.leftShoulder = createBone([0, 0, actionCycle * 0.4])
  bones.leftUpperArm = createBone([0, 0, actionCycle * 1.0 * intensity])
  bones.leftLowerArm = createBone([0.5 + actionCycle * 0.3, 0, actionCycle * 0.4])
  bones.leftHand = createBone([0, 0, actionCycle * 0.5])

  // 右臂 - 妩媚手势
  bones.rightShoulder = createBone([0, 0, -actionCycle * 0.4])
  bones.rightUpperArm = createBone([0, 0, -actionCycle * 1.0 * intensity])
  bones.rightLowerArm = createBone([0.5 + actionCycle * 0.3, 0, -actionCycle * 0.4])
  bones.rightHand = createBone([0, 0, -actionCycle * 0.5])

  // 腿部 - 诱惑姿态
  bones.leftUpperLeg = createBone([actionCycle * 0.5, 0, 0])
  bones.leftLowerLeg = createBone([0.25 + actionCycle * 0.2, 0, 0])
  bones.leftFoot = createBone([-0.25 + actionCycle * 0.1, 0, 0])
  bones.rightUpperLeg = createBone([-actionCycle * 0.5, 0, 0])
  bones.rightLowerLeg = createBone([0.25 + actionCycle * 0.2, 0, 0])
  bones.rightFoot = createBone([-0.25 + actionCycle * 0.1, 0, 0])
}

// 基础动作骨骼生成
function generateBasicBones(bones, actionCycle, intensity) {
  // 自然动作，幅度适中
  bones.hips = createBone([0, actionCycle * 0.2, 0], [0, Math.abs(actionCycle) * 0.08, 0])
  bones.spine = createBone([actionCycle * 0.15, 0, 0])
  bones.chest = createBone([actionCycle * 0.12, 0, 0])
  
  // 头部 - 自然转动
  bones.neck = createBone([actionCycle * 0.1, actionCycle * 0.15, 0])
  bones.head = createBone([actionCycle * 0.12, actionCycle * 0.18, 0])
  
  // 左臂 - 自然摆动
  bones.leftShoulder = createBone([0, 0, actionCycle * 0.2])
  bones.leftUpperArm = createBone([0, 0, actionCycle * 0.8 * intensity])
  bones.leftLowerArm = createBone([0.4 + actionCycle * 0.2, 0, 0])
  bones.leftHand = createBone([0, 0, actionCycle * 0.25])
  
  // 右臂 - 自然摆动
  bones.rightShoulder = createBone([0, 0, -actionCycle * 0.2])
  bones.rightUpperArm = createBone([0, 0, -actionCycle * 0.8 * intensity])
  bones.rightLowerArm = createBone([0.4 + actionCycle * 0.2, 0, 0])
  bones.rightHand = createBone([0, 0, -actionCycle * 0.25])
  
  // 腿部 - 自然站立/行走
  bones.leftUpperLeg = createBone([actionCycle * 0.3, 0, 0])
  bones.leftLowerLeg = createBone([0.15 + actionCycle * 0.1, 0, 0])
  bones.leftFoot = createBone([-0.15 + actionCycle * 0.05, 0, 0])
  bones.rightUpperLeg = createBone([-actionCycle * 0.3, 0, 0])
  bones.rightLowerLeg = createBone([0.15 + actionCycle * 0.1, 0, 0])
  bones.rightFoot = createBone([-0.15 + actionCycle * 0.05, 0, 0])
}

// 生成关键帧
function generateKeyframes(category, duration = 3000, fps = 60) {
  const keyframes = []
  const frameCount = Math.ceil((duration / 1000) * fps)
  const intensity = 0.5 + Math.random() * 0.5
  
  for (let i = 0; i <= frameCount; i++) {
    const t = i / frameCount
    const time = t * duration
    
    // 使用正弦波创建循环动作
    const actionCycle = Math.sin(t * Math.PI * 2)
    
    const bones = generateBonesForAction(category, actionCycle, intensity)
    
    keyframes.push({
      time,
      bones,
      easing: i === 0 ? 'easeInOutQuad' : 'linear'
    })
  }
  
  return keyframes
}

// 生成单个动作
function generateAction(id, name, icon, category, categoryKey) {
  try {
    const duration = category === 'dance' ? 4000 : 
                     category === 'special' ? 3500 : 
                     category === 'expression' ? 2000 : 3000
    
    const keyframes = generateKeyframes(categoryKey, duration)
    
    return {
      id,
      name,
      icon,
      category,
      keyframes,
      duration,
      fps: 60,
      loop: false, // 默认不循环，播放一遍后停止
      intensity: 1.0
    }
  } catch (error) {
    console.error(`生成动作失败 ${name}:`, error)
    return null
  }
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
    if (action && action.keyframes && action.keyframes.length > 0) {
      generatedActions.push(action)
    }
  } catch (error) {
    console.error(`生成动作失败 ${name}:`, error)
  }
})

// 生成舞蹈动作 (30个)
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
    console.error(`生成动作失败 ${name}:`, error)
  }
})

// 生成表情动作 (30个)
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
    console.error(`生成动作失败 ${name}:`, error)
  }
})

// 生成酷炫动作 (25个)
actionNames.cool.forEach(([name, icon], index) => {
  try {
    const action = generateAction(
      `mmd_cool_${index}`,
      name,
      icon,
      '酷炫',
      'cool'
    )
    if (action && action.keyframes && action.keyframes.length > 0) {
      generatedActions.push(action)
    }
  } catch (error) {
    console.error(`生成动作失败 ${name}:`, error)
  }
})

// 生成特殊动作 (15个)
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
    console.error(`生成动作失败 ${name}:`, error)
  }
})

// 生成涩涩动作 (20个)
actionNames.sexy.forEach(([name, icon], index) => {
  try {
    const action = generateAction(
      `mmd_sexy_${index}`,
      name,
      icon,
      '涩涩',
      'sexy'
    )
    if (action && action.keyframes && action.keyframes.length > 0) {
      generatedActions.push(action)
    }
  } catch (error) {
    console.error(`生成动作失败 ${name}:`, error)
  }
})

// 导出动作列表
export const mmdActions = generatedActions

// 动作分类
export const mmdActionCategories = [
  { id: 'all', name: '全部', icon: '✨' },
  { id: '基础', name: '基础', icon: '👤' },
  { id: '舞蹈', name: '舞蹈', icon: '💃' },
  { id: '表情', name: '表情', icon: '😊' },
  { id: '酷炫', name: '酷炫', icon: '😎' },
  { id: '特殊', name: '特殊', icon: '✨' },
  { id: '涩涩', name: '涩涩', icon: '💋', color: '#ff69b4' }
]

// 根据ID获取动作
export function getActionById(actionId) {
  return mmdActions.find(action => action.id === actionId)
}

// 根据分类获取动作
export function getActionsByCategory(category) {
  if (category === 'all') return mmdActions
  return mmdActions.filter(action => action.category === category)
}

// 插值函数 - 使用简单的线性插值（更稳定）
export function interpolateKeyframes(action, elapsedTime) {
  // 验证输入
  if (!action) {
    console.warn('⚠️ interpolateKeyframes: action为空')
    return {}
  }
  
  if (!action.keyframes || action.keyframes.length === 0) {
    console.warn('⚠️ interpolateKeyframes: 关键帧为空', action.id, action.name)
    return {}
  }
  
  if (!action.duration || action.duration <= 0) {
    console.warn('⚠️ interpolateKeyframes: 无效的duration', action.id, action.duration)
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

// 默认导出
export default {
  mmdActions,
  mmdActionCategories,
  getActionById,
  getActionsByCategory,
  interpolateKeyframes
}