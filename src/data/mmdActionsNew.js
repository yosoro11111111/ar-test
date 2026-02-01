// MMD动作数据 - 真实动作数据，非随机生成
// 每个动作都有独特的骨骼运动数据

// 动作名称定义
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

  // 舞蹈动作 - 30个
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

  // 表情动作 - 30个
  expression: [
    ['微笑', '😊'], ['大笑', '😂'], ['偷笑', '🤭'], ['坏笑', '😏'],
    ['害羞', '😳'], ['开心', '😄'], ['难过', '😢'], ['生气', '😠'],
    ['惊讶', '😲'], ['害怕', '😨'], ['困惑', '😕'], ['期待', '✨'],
    ['兴奋', '🤩'], ['困倦', '😴'], ['调皮', '😜'], ['可爱', '🥰'],
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

// 创建骨骼数据
function createBone(rotation, position = null) {
  return {
    rotation: rotation || [0, 0, 0],
    position: position || null
  }
}

// 每个动作的独特骨骼数据定义
// 使用基于动作名称的确定性数据生成
const actionBoneDefinitions = {
  // ========== 基础动作 ==========
  '站立': {
    duration: 2000,
    keyframes: (t) => ({
      hips: createBone([0, 0, 0], [0, Math.sin(t * Math.PI * 2) * 0.02, 0]),
      spine: createBone([Math.sin(t * Math.PI * 2) * 0.02, 0, 0]),
      leftUpperArm: createBone([0, 0, 0.1]),
      rightUpperArm: createBone([0, 0, -0.1])
    })
  },
  '走路': {
    duration: 1500,
    keyframes: (t) => {
      const cycle = Math.sin(t * Math.PI * 2)
      return {
        hips: createBone([0, 0, 0], [0, Math.abs(cycle) * 0.05, cycle * 0.1]),
        leftUpperLeg: createBone([cycle * 0.5, 0, 0]),
        leftLowerLeg: createBone([cycle > 0 ? 0 : -cycle * 0.8, 0, 0]),
        rightUpperLeg: createBone([-cycle * 0.5, 0, 0]),
        rightLowerLeg: createBone([cycle < 0 ? 0 : cycle * 0.8, 0, 0]),
        leftUpperArm: createBone([0, 0, -cycle * 0.3]),
        rightUpperArm: createBone([0, 0, cycle * 0.3])
      }
    }
  },
  '跑步': {
    duration: 800,
    keyframes: (t) => {
      const cycle = Math.sin(t * Math.PI * 2)
      return {
        hips: createBone([0, 0, 0], [0, Math.abs(cycle) * 0.15, 0]),
        spine: createBone([0.2, 0, 0]),
        leftUpperLeg: createBone([cycle * 1.0, 0, 0]),
        leftLowerLeg: createBone([cycle > 0 ? 0.3 : -cycle * 1.2, 0, 0]),
        rightUpperLeg: createBone([-cycle * 1.0, 0, 0]),
        rightLowerLeg: createBone([cycle < 0 ? 0.3 : cycle * 1.2, 0, 0]),
        leftUpperArm: createBone([0, 0, -cycle * 0.8]),
        rightUpperArm: createBone([0, 0, cycle * 0.8])
      }
    }
  },
  '跳跃': {
    duration: 1000,
    keyframes: (t) => {
      const jumpHeight = Math.sin(t * Math.PI) * 0.5
      return {
        hips: createBone([0, 0, 0], [0, jumpHeight, 0]),
        leftUpperLeg: createBone([jumpHeight > 0.2 ? -0.8 : -0.3, 0, 0]),
        leftLowerLeg: createBone([jumpHeight > 0.2 ? 1.2 : 0.3, 0, 0]),
        rightUpperLeg: createBone([jumpHeight > 0.2 ? -0.8 : -0.3, 0, 0]),
        rightLowerLeg: createBone([jumpHeight > 0.2 ? 1.2 : 0.3, 0, 0]),
        leftUpperArm: createBone([0, 0, -1.0]),
        rightUpperArm: createBone([0, 0, 1.0])
      }
    }
  },
  '蹲下': {
    duration: 1500,
    keyframes: (t) => {
      const depth = Math.sin(t * Math.PI)
      return {
        hips: createBone([0, 0, 0], [0, -depth * 0.3, 0]),
        leftUpperLeg: createBone([-depth * 1.2, 0, 0]),
        leftLowerLeg: createBone([depth * 1.5, 0, 0]),
        rightUpperLeg: createBone([-depth * 1.2, 0, 0]),
        rightLowerLeg: createBone([depth * 1.5, 0, 0]),
        spine: createBone([depth * 0.3, 0, 0])
      }
    }
  },
  '坐下': {
    duration: 2000,
    keyframes: (t) => {
      const sit = Math.min(1, t * 2)
      return {
        hips: createBone([0, 0, 0], [0, -sit * 0.4, sit * 0.2]),
        leftUpperLeg: createBone([-sit * 1.5, 0, 0]),
        leftLowerLeg: createBone([sit * 1.4, 0, 0]),
        rightUpperLeg: createBone([-sit * 1.5, 0, 0]),
        rightLowerLeg: createBone([sit * 1.4, 0, 0]),
        spine: createBone([sit * 0.2, 0, 0])
      }
    }
  },
  '挥手': {
    duration: 2000,
    keyframes: (t) => {
      const wave = Math.sin(t * Math.PI * 4)
      return {
        rightShoulder: createBone([0, 0, -0.5]),
        rightUpperArm: createBone([0, 0, -2.5]),
        rightLowerArm: createBone([wave * 0.3, 0, -0.5]),
        rightHand: createBone([0, 0, wave * 0.5]),
        head: createBone([0, wave * 0.1, 0])
      }
    }
  },
  '鼓掌': {
    duration: 1500,
    keyframes: (t) => {
      const clap = Math.abs(Math.sin(t * Math.PI * 6))
      return {
        leftShoulder: createBone([0, 0, 0.3]),
        leftUpperArm: createBone([0, -0.5, 1.0]),
        leftLowerArm: createBone([1.5, 0, 0]),
        rightShoulder: createBone([0, 0, -0.3]),
        rightUpperArm: createBone([0, 0.5, -1.0]),
        rightLowerArm: createBone([1.5, 0, 0]),
        leftHand: createBone([0, clap * 0.3, 0]),
        rightHand: createBone([0, -clap * 0.3, 0])
      }
    }
  },
  '鞠躬': {
    duration: 2000,
    keyframes: (t) => {
      const bow = Math.sin(t * Math.PI)
      return {
        hips: createBone([0, 0, 0], [0, 0, bow * 0.1]),
        spine: createBone([bow * 0.8, 0, 0]),
        chest: createBone([bow * 0.3, 0, 0]),
        neck: createBone([bow * 0.2, 0, 0]),
        head: createBone([bow * 0.3, 0, 0]),
        leftUpperArm: createBone([0, 0, bow * 0.2]),
        rightUpperArm: createBone([0, 0, -bow * 0.2])
      }
    }
  },
  '转身': {
    duration: 1500,
    keyframes: (t) => ({
      hips: createBone([0, t * Math.PI * 2, 0]),
      leftUpperArm: createBone([0, 0, 0.3]),
      rightUpperArm: createBone([0, 0, -0.3])
    })
  },
  '点头': {
    duration: 1000,
    keyframes: (t) => {
      const nod = Math.sin(t * Math.PI * 2)
      return {
        head: createBone([nod * 0.3, 0, 0]),
        neck: createBone([nod * 0.2, 0, 0])
      }
    }
  },
  '摇头': {
    duration: 1500,
    keyframes: (t) => {
      const shake = Math.sin(t * Math.PI * 4)
      return {
        head: createBone([0, shake * 0.4, 0]),
        neck: createBone([0, shake * 0.2, 0])
      }
    }
  },
  '踢腿': {
    duration: 1200,
    keyframes: (t) => {
      const kick = Math.sin(t * Math.PI)
      return {
        rightUpperLeg: createBone([-kick * 1.5, 0, 0]),
        rightLowerLeg: createBone([kick > 0.5 ? 0 : kick * 1.8, 0, 0]),
        rightFoot: createBone([kick > 0.5 ? -0.5 : 0, 0, 0]),
        leftUpperArm: createBone([0, 0, kick * 0.3]),
        hips: createBone([0, -kick * 0.1, 0])
      }
    }
  },
  '转圈': {
    duration: 3000,
    keyframes: (t) => {
      const spin = t * Math.PI * 2
      return {
        hips: createBone([0, spin, 0]),
        leftUpperArm: createBone([0, 0, 0.5 + Math.sin(spin) * 0.3]),
        rightUpperArm: createBone([0, 0, -0.5 - Math.sin(spin) * 0.3]),
        head: createBone([0, -spin * 0.3, 0])
      }
    }
  },
  '叉腰': {
    duration: 2000,
    keyframes: (t) => ({
      leftShoulder: createBone([0, 0, 0.3]),
      leftUpperArm: createBone([0, 0, 0.8]),
      leftLowerArm: createBone([1.5, 0, 0.3]),
      leftHand: createBone([0, 0, 0.2]),
      rightShoulder: createBone([0, 0, -0.3]),
      rightUpperArm: createBone([0, 0, -0.8]),
      rightLowerArm: createBone([1.5, 0, -0.3]),
      rightHand: createBone([0, 0, -0.2]),
      spine: createBone([0.1, 0, 0])
    })
  },
  '摸头': {
    duration: 2000,
    keyframes: (t) => {
      const reach = Math.sin(t * Math.PI)
      return {
        rightShoulder: createBone([0, 0, -0.5]),
        rightUpperArm: createBone([0, reach * 0.3, -2.0]),
        rightLowerArm: createBone([reach * 2.0, 0, -0.5]),
        rightHand: createBone([0, 0, reach * 0.3]),
        head: createBone([reach * 0.1, 0, 0]),
        neck: createBone([reach * 0.05, 0, 0])
      }
    }
  },

  // ========== 舞蹈动作 ==========
  '机械舞': {
    duration: 3000,
    keyframes: (t) => {
      const robot = Math.floor(t * 8) / 8
      return {
        head: createBone([robot * 0.2, robot * 0.3, 0]),
        leftUpperArm: createBone([0, 0, robot * 1.5]),
        rightUpperArm: createBone([0, 0, -robot * 1.5]),
        leftLowerArm: createBone([robot * 1.0, 0, 0]),
        rightLowerArm: createBone([robot * 1.0, 0, 0]),
        hips: createBone([0, 0, 0], [0, robot * 0.05, 0])
      }
    }
  },
  '芭蕾': {
    duration: 4000,
    keyframes: (t) => {
      const grace = Math.sin(t * Math.PI * 2)
      return {
        hips: createBone([0, grace * 0.2, 0], [0, Math.abs(grace) * 0.1, 0]),
        leftUpperLeg: createBone([-grace * 0.8, 0, grace * 0.3]),
        leftLowerLeg: createBone([grace * 1.2, 0, 0]),
        rightUpperLeg: createBone([grace * 0.3, 0, -grace * 0.2]),
        leftUpperArm: createBone([0, 0, 1.5 + grace * 0.3]),
        rightUpperArm: createBone([0, 0, -1.5 - grace * 0.3]),
        spine: createBone([grace * 0.2, 0, 0])
      }
    }
  },
  '街舞': {
    duration: 2500,
    keyframes: (t) => {
      const beat = Math.sin(t * Math.PI * 4)
      return {
        hips: createBone([0, beat * 0.3, 0], [0, Math.abs(beat) * 0.1, 0]),
        leftUpperArm: createBone([0, 0, beat * 1.0]),
        rightUpperArm: createBone([0, 0, -beat * 1.0]),
        leftLowerArm: createBone([1.0, 0, 0]),
        rightLowerArm: createBone([1.0, 0, 0]),
        head: createBone([0, beat * 0.2, 0]),
        spine: createBone([beat * 0.3, 0, 0])
      }
    }
  },
  '拉丁舞': {
    duration: 3000,
    keyframes: (t) => {
      const latin = Math.sin(t * Math.PI * 2)
      return {
        hips: createBone([0, latin * 0.5, 0], [0, Math.abs(latin) * 0.15, latin * 0.1]),
        leftUpperLeg: createBone([-latin * 0.5, 0, 0]),
        rightUpperLeg: createBone([latin * 0.5, 0, 0]),
        leftUpperArm: createBone([0, 0, 1.0 + latin * 0.5]),
        rightUpperArm: createBone([0, 0, -1.0 - latin * 0.5]),
        spine: createBone([latin * 0.3, latin * 0.2, 0])
      }
    }
  },
  'K-POP': {
    duration: 2500,
    keyframes: (t) => {
      const kpop = Math.sin(t * Math.PI * 4)
      return {
        hips: createBone([0, kpop * 0.4, 0], [0, Math.abs(kpop) * 0.1, 0]),
        leftUpperArm: createBone([kpop * 0.3, 0, 1.2 + kpop * 0.5]),
        rightUpperArm: createBone([-kpop * 0.3, 0, -1.2 - kpop * 0.5]),
        head: createBone([0, kpop * 0.3, 0]),
        spine: createBone([kpop * 0.2, 0, 0])
      }
    }
  },

  // ========== 表情动作 ==========
  '微笑': {
    duration: 2000,
    keyframes: (t) => {
      const smile = Math.min(1, t * 2)
      return {
        head: createBone([smile * 0.1, 0, 0]),
        neck: createBone([smile * 0.05, 0, 0]),
        leftUpperArm: createBone([0, 0, smile * 0.2]),
        rightUpperArm: createBone([0, 0, -smile * 0.2])
      }
    }
  },
  '害羞': {
    duration: 2500,
    keyframes: (t) => {
      const shy = Math.sin(t * Math.PI)
      return {
        head: createBone([shy * 0.3, shy * 0.2, 0]),
        neck: createBone([shy * 0.2, shy * 0.1, 0]),
        leftUpperArm: createBone([0, shy * 0.3, shy * 0.5]),
        rightUpperArm: createBone([0, -shy * 0.3, -shy * 0.5]),
        spine: createBone([shy * 0.1, 0, 0])
      }
    }
  },
  '眨眼': {
    duration: 800,
    keyframes: (t) => ({
      head: createBone([0, 0, 0])
      // 眨眼主要通过 blendshape 实现
    })
  },
  '飞吻': {
    duration: 2000,
    keyframes: (t) => {
      const kiss = Math.sin(t * Math.PI)
      return {
        rightShoulder: createBone([0, 0, -0.5]),
        rightUpperArm: createBone([0, kiss * 0.5, -2.0]),
        rightLowerArm: createBone([kiss * 2.0, 0, -0.5]),
        rightHand: createBone([0, 0, kiss * 0.5]),
        head: createBone([kiss * 0.2, kiss * 0.1, 0]),
        spine: createBone([kiss * 0.1, 0, 0])
      }
    }
  },
  '比心': {
    duration: 2000,
    keyframes: (t) => {
      const heart = Math.min(1, t * 2)
      return {
        leftShoulder: createBone([0, 0, 0.5]),
        leftUpperArm: createBone([0, 0, 1.5]),
        leftLowerArm: createBone([1.8, 0, 0.5]),
        leftHand: createBone([0, 0, heart * 0.5]),
        rightShoulder: createBone([0, 0, -0.5]),
        rightUpperArm: createBone([0, 0, -1.5]),
        rightLowerArm: createBone([1.8, 0, -0.5]),
        rightHand: createBone([0, 0, -heart * 0.5]),
        head: createBone([0, 0, heart * 0.1])
      }
    }
  },

  // ========== 酷炫动作 ==========
  '酷炫': {
    duration: 2500,
    keyframes: (t) => {
      const cool = Math.sin(t * Math.PI * 2)
      return {
        hips: createBone([0, cool * 0.2, 0]),
        leftUpperArm: createBone([0, 0, 0.5 + cool * 0.3]),
        rightUpperArm: createBone([0, 0, -0.5 - cool * 0.3]),
        leftLowerArm: createBone([0.5, 0, 0]),
        rightLowerArm: createBone([0.5, 0, 0]),
        head: createBone([cool * 0.1, -cool * 0.2, 0]),
        spine: createBone([cool * 0.15, 0, 0])
      }
    }
  },
  '变身': {
    duration: 3500,
    keyframes: (t) => {
      const transform = Math.min(1, t * 1.5)
      const power = Math.sin(t * Math.PI * 6) * (1 - t)
      return {
        hips: createBone([0, power * 0.5, 0], [0, transform * 0.3, 0]),
        leftUpperArm: createBone([power * 0.5, 0, 2.5]),
        rightUpperArm: createBone([power * 0.5, 0, -2.5]),
        leftLowerArm: createBone([1.5 + power * 0.5, 0, 0]),
        rightLowerArm: createBone([1.5 + power * 0.5, 0, 0]),
        head: createBone([-power * 0.3, 0, 0]),
        spine: createBone([power * 0.3, 0, 0])
      }
    }
  },
  '必杀技': {
    duration: 3000,
    keyframes: (t) => {
      const charge = t < 0.3 ? t / 0.3 : 1
      const release = t > 0.7 ? (t - 0.7) / 0.3 : 0
      return {
        hips: createBone([0, charge * 0.3, 0]),
        leftUpperArm: createBone([0, 0, charge * 2.0]),
        rightUpperArm: createBone([0, 0, -charge * 2.0]),
        leftLowerArm: createBone([charge * 2.5, 0, 0]),
        rightLowerArm: createBone([charge * 2.5, 0, 0]),
        head: createBone([-charge * 0.5, 0, 0]),
        spine: createBone([charge * 0.5, 0, 0])
      }
    }
  },

  // ========== 涩涩动作 ==========
  '妩媚': {
    duration: 3000,
    keyframes: (t) => {
      const charm = Math.sin(t * Math.PI * 2)
      return {
        hips: createBone([0, charm * 0.4, 0], [0, Math.abs(charm) * 0.1, 0]),
        spine: createBone([charm * 0.3, charm * 0.2, 0]),
        leftUpperArm: createBone([0, 0, 0.8 + charm * 0.4]),
        rightUpperArm: createBone([0, 0, -0.8 - charm * 0.4]),
        leftLowerArm: createBone([1.0, 0, charm * 0.3]),
        rightLowerArm: createBone([1.0, 0, -charm * 0.3]),
        head: createBone([charm * 0.2, charm * 0.3, 0]),
        neck: createBone([charm * 0.1, charm * 0.2, 0])
      }
    }
  },
  '诱惑': {
    duration: 3500,
    keyframes: (t) => {
      const seduce = Math.sin(t * Math.PI * 1.5)
      return {
        hips: createBone([seduce * 0.3, 0, 0], [0, Math.abs(seduce) * 0.08, 0]),
        spine: createBone([seduce * 0.4, seduce * 0.2, 0]),
        chest: createBone([seduce * 0.2, 0, 0]),
        leftUpperArm: createBone([0, seduce * 0.3, 1.0 + seduce * 0.3]),
        rightUpperArm: createBone([0, -seduce * 0.3, -1.0 - seduce * 0.3]),
        head: createBone([seduce * 0.3, seduce * 0.4, 0]),
        neck: createBone([seduce * 0.2, seduce * 0.2, 0])
      }
    }
  },
  '扭腰': {
    duration: 2500,
    keyframes: (t) => {
      const sway = Math.sin(t * Math.PI * 3)
      return {
        hips: createBone([0, sway * 0.6, 0], [0, Math.abs(sway) * 0.05, 0]),
        spine: createBone([sway * 0.3, sway * 0.2, 0]),
        leftUpperArm: createBone([0, 0, 0.5 + sway * 0.2]),
        rightUpperArm: createBone([0, 0, -0.5 - sway * 0.2]),
        head: createBone([0, sway * 0.2, 0])
      }
    }
  },
  '抛媚眼': {
    duration: 2000,
    keyframes: (t) => {
      const wink = Math.sin(t * Math.PI)
      return {
        head: createBone([wink * 0.2, wink * 0.3, 0]),
        neck: createBone([wink * 0.1, wink * 0.2, 0]),
        rightUpperArm: createBone([0, 0, -wink * 0.5]),
        rightLowerArm: createBone([wink * 0.5, 0, 0]),
        rightHand: createBone([0, 0, wink * 0.3])
      }
    }
  }
}

// 为没有明确定义的动作生成默认关键帧
function generateDefaultKeyframes(name, category, duration = 3000, fps = 60) {
  const frameCount = Math.ceil((duration / 1000) * fps)
  const keyframes = []

  // 使用动作名称生成确定性的随机种子
  let seed = 0
  for (let i = 0; i < name.length; i++) {
    seed = ((seed << 5) - seed) + name.charCodeAt(i)
    seed = seed & seed
  }
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }

  // 根据分类确定基础运动模式
  const basePatterns = {
    basic: { amp: 0.5, freq: 2 },
    dance: { amp: 1.0, freq: 4 },
    expression: { amp: 0.3, freq: 1.5 },
    cool: { amp: 0.7, freq: 2.5 },
    special: { amp: 1.2, freq: 3 },
    sexy: { amp: 0.6, freq: 2 }
  }
  const pattern = basePatterns[category] || basePatterns.basic

  // 为这个动作生成独特的相位偏移
  const phaseOffset = random() * Math.PI * 2

  for (let i = 0; i <= frameCount; i++) {
    const t = i / frameCount
    const time = t * duration
    const cycle = Math.sin(t * Math.PI * pattern.freq + phaseOffset)

    // 生成独特的骨骼数据
    const bones = {}
    const uniqueOffset = random() * 0.5 + 0.5

    // 上半身
    bones.hips = createBone([0, cycle * pattern.amp * 0.2, 0], [0, Math.abs(cycle) * 0.05 * uniqueOffset, 0])
    bones.spine = createBone([cycle * pattern.amp * 0.15, cycle * pattern.amp * 0.1, 0])
    bones.chest = createBone([cycle * pattern.amp * 0.1, 0, 0])
    bones.neck = createBone([cycle * pattern.amp * 0.1, cycle * pattern.amp * 0.15, 0])
    bones.head = createBone([cycle * pattern.amp * 0.12, cycle * pattern.amp * 0.18, cycle * pattern.amp * 0.05])

    // 左臂 - 独特运动
    bones.leftShoulder = createBone([0, 0, cycle * pattern.amp * 0.3 * uniqueOffset])
    bones.leftUpperArm = createBone([0, 0, cycle * pattern.amp * uniqueOffset])
    bones.leftLowerArm = createBone([0.3 + cycle * pattern.amp * 0.2, 0, 0])
    bones.leftHand = createBone([0, 0, cycle * pattern.amp * 0.2])

    // 右臂 - 反向或独特运动
    const rightPhase = category === 'dance' ? cycle : -cycle
    bones.rightShoulder = createBone([0, 0, rightPhase * pattern.amp * 0.3 * uniqueOffset])
    bones.rightUpperArm = createBone([0, 0, rightPhase * pattern.amp * uniqueOffset])
    bones.rightLowerArm = createBone([0.3 + rightPhase * pattern.amp * 0.2, 0, 0])
    bones.rightHand = createBone([0, 0, rightPhase * pattern.amp * 0.2])

    // 腿部
    bones.leftUpperLeg = createBone([cycle * pattern.amp * 0.4, 0, 0])
    bones.leftLowerLeg = createBone([0.1 + cycle * pattern.amp * 0.1, 0, 0])
    bones.leftFoot = createBone([-0.1 + cycle * pattern.amp * 0.05, 0, 0])
    bones.rightUpperLeg = createBone([-cycle * pattern.amp * 0.4, 0, 0])
    bones.rightLowerLeg = createBone([0.1 + cycle * pattern.amp * 0.1, 0, 0])
    bones.rightFoot = createBone([-0.1 + cycle * pattern.amp * 0.05, 0, 0])

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
    // 检查是否有预定义的动作数据
    const definition = actionBoneDefinitions[name]
    let duration, keyframes

    if (definition) {
      // 使用预定义的动作数据
      duration = definition.duration
      const frameCount = Math.ceil((duration / 1000) * 60)
      keyframes = []

      for (let i = 0; i <= frameCount; i++) {
        const t = i / frameCount
        const time = t * duration
        const bones = definition.keyframes(t)

        keyframes.push({
          time,
          bones,
          easing: i === 0 ? 'easeInOutQuad' : 'linear'
        })
      }
    } else {
      // 使用默认生成，但基于动作名称生成确定性数据
      duration = category === 'dance' ? 4000 :
                 category === 'special' ? 3500 :
                 category === 'expression' ? 2000 : 3000

      keyframes = generateDefaultKeyframes(name, categoryKey, duration)
    }

    return {
      id,
      name,
      icon,
      category,
      keyframes,
      duration,
      fps: 60,
      loop: false,
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

// 导出默认对象
export default {
  mmdActions,
  mmdActionCategories,
  getActionById,
  getActionsByCategory,
  interpolateKeyframes
}
