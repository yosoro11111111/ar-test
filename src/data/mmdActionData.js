// MMD动作特定数据定义
// 每个动作都有独特的运动模式和骨骼数据

// 动作类型定义
export const ACTION_TYPES = {
  WAVE: 'wave',           // 挥手类
  WALK: 'walk',           // 行走类
  JUMP: 'jump',           // 跳跃类
  DANCE: 'dance',         // 舞蹈类
  EXPRESSION: 'expression', // 表情类
  GESTURE: 'gesture',     // 手势类
  IDLE: 'idle',           // 待机类
  SPECIAL: 'special',     // 特殊类
  SEXY: 'sexy'            // 涩涩类
}

// 运动曲线类型
export const EASING_TYPES = {
  LINEAR: 'linear',
  EASE_IN: 'easeIn',
  EASE_OUT: 'easeOut',
  EASE_IN_OUT: 'easeInOut',
  ELASTIC: 'elastic',
  BOUNCE: 'bounce',
  SINE: 'sine'
}

// 基础动作数据 - 30个
export const basicActionData = {
  // 挥手动作
  '挥手': {
    type: ACTION_TYPES.WAVE,
    duration: 2000,
    description: '右手挥手打招呼',
    bones: {
      rightShoulder: {
        rotation: [0, 0, -0.3],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        rotation: [0, 0, -1.2],
        wave: { axis: 'z', amplitude: 0.8, frequency: 3 },
        timing: EASING_TYPES.SINE
      },
      rightLowerArm: {
        rotation: [0, 0, -0.5],
        wave: { axis: 'z', amplitude: 1.0, frequency: 3 },
        timing: EASING_TYPES.SINE
      },
      rightHand: {
        rotation: [0, 0, -0.2],
        wave: { axis: 'z', amplitude: 0.6, frequency: 3 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 走路动作
  '走路': {
    type: ACTION_TYPES.WALK,
    duration: 3000,
    description: '自然走路循环',
    loop: true,
    bones: {
      hips: {
        bob: { axis: 'y', amplitude: 0.05, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      leftUpperLeg: {
        swing: { axis: 'x', amplitude: 0.6, frequency: 2, phase: 0 },
        timing: EASING_TYPES.SINE
      },
      leftLowerLeg: {
        swing: { axis: 'x', amplitude: 0.4, frequency: 2, phase: 0.2 },
        timing: EASING_TYPES.SINE
      },
      rightUpperLeg: {
        swing: { axis: 'x', amplitude: 0.6, frequency: 2, phase: Math.PI },
        timing: EASING_TYPES.SINE
      },
      rightLowerLeg: {
        swing: { axis: 'x', amplitude: 0.4, frequency: 2, phase: Math.PI + 0.2 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        swing: { axis: 'x', amplitude: 0.3, frequency: 2, phase: Math.PI },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        swing: { axis: 'x', amplitude: 0.3, frequency: 2, phase: 0 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 跑步动作
  '跑步': {
    type: ACTION_TYPES.WALK,
    duration: 2000,
    description: '快速跑步',
    loop: true,
    bones: {
      hips: {
        bob: { axis: 'y', amplitude: 0.1, frequency: 3 },
        timing: EASING_TYPES.SINE
      },
      spine: {
        lean: { axis: 'x', amplitude: 0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperLeg: {
        swing: { axis: 'x', amplitude: 1.0, frequency: 3, phase: 0 },
        timing: EASING_TYPES.SINE
      },
      leftLowerLeg: {
        swing: { axis: 'x', amplitude: 0.8, frequency: 3, phase: 0.3 },
        timing: EASING_TYPES.SINE
      },
      rightUpperLeg: {
        swing: { axis: 'x', amplitude: 1.0, frequency: 3, phase: Math.PI },
        timing: EASING_TYPES.SINE
      },
      rightLowerLeg: {
        swing: { axis: 'x', amplitude: 0.8, frequency: 3, phase: Math.PI + 0.3 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        swing: { axis: 'x', amplitude: 0.6, frequency: 3, phase: Math.PI },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        swing: { axis: 'x', amplitude: 0.6, frequency: 3, phase: 0 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 跳跃动作
  '跳跃': {
    type: ACTION_TYPES.JUMP,
    duration: 1500,
    description: '向上跳跃',
    bones: {
      hips: {
        jump: { 
          y: [0, 0.5, 0],
          timing: EASING_TYPES.BOUNCE
        }
      },
      leftUpperLeg: {
        rotation: [0.8, 0, 0],
        timing: EASING_TYPES.EASE_OUT
      },
      rightUpperLeg: {
        rotation: [0.8, 0, 0],
        timing: EASING_TYPES.EASE_OUT
      },
      leftLowerLeg: {
        rotation: [-1.0, 0, 0],
        timing: EASING_TYPES.EASE_OUT
      },
      rightLowerLeg: {
        rotation: [-1.0, 0, 0],
        timing: EASING_TYPES.EASE_OUT
      },
      leftUpperArm: {
        rotation: [-0.5, 0, 0],
        timing: EASING_TYPES.EASE_OUT
      },
      rightUpperArm: {
        rotation: [-0.5, 0, 0],
        timing: EASING_TYPES.EASE_OUT
      }
    }
  },

  // 鼓掌动作
  '鼓掌': {
    type: ACTION_TYPES.GESTURE,
    duration: 2000,
    description: '双手鼓掌',
    bones: {
      leftShoulder: {
        rotation: [0, 0, 0.3],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightShoulder: {
        rotation: [0, 0, -0.3],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        rotation: [-1.0, 0, 0.5],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        rotation: [-1.0, 0, -0.5],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftLowerArm: {
        clap: { axis: 'x', amplitude: 0.6, frequency: 4 },
        timing: EASING_TYPES.SINE
      },
      rightLowerArm: {
        clap: { axis: 'x', amplitude: 0.6, frequency: 4 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 点头动作
  '点头': {
    type: ACTION_TYPES.GESTURE,
    duration: 1500,
    description: '点头同意',
    bones: {
      neck: {
        nod: { axis: 'x', amplitude: 0.4, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      head: {
        nod: { axis: 'x', amplitude: 0.3, frequency: 2 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 摇头动作
  '摇头': {
    type: ACTION_TYPES.GESTURE,
    duration: 2000,
    description: '摇头否定',
    bones: {
      neck: {
        shake: { axis: 'y', amplitude: 0.5, frequency: 3 },
        timing: EASING_TYPES.SINE
      },
      head: {
        shake: { axis: 'y', amplitude: 0.4, frequency: 3 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 鞠躬动作
  '鞠躬': {
    type: ACTION_TYPES.GESTURE,
    duration: 2500,
    description: '鞠躬行礼',
    bones: {
      hips: {
        bow: { axis: 'x', amplitude: 0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      spine: {
        bow: { axis: 'x', amplitude: 0.5 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      chest: {
        bow: { axis: 'x', amplitude: 0.4 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      neck: {
        bow: { axis: 'x', amplitude: 0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        bow: { axis: 'x', amplitude: 0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 坐下动作
  '坐下': {
    type: ACTION_TYPES.IDLE,
    duration: 2000,
    description: '坐下休息',
    bones: {
      hips: {
        position: [0, -0.8, 0],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperLeg: {
        rotation: [-1.2, 0, 0],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperLeg: {
        rotation: [-1.2, 0, 0],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftLowerLeg: {
        rotation: [1.5, 0, 0],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightLowerLeg: {
        rotation: [1.5, 0, 0],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      spine: {
        rotation: [0.2, 0, 0],
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 站立动作
  '站立': {
    type: ACTION_TYPES.IDLE,
    duration: 3000,
    description: '自然站立',
    loop: true,
    bones: {
      hips: {
        breathe: { axis: 'y', amplitude: 0.02, frequency: 0.5 },
        timing: EASING_TYPES.SINE
      },
      spine: {
        breathe: { axis: 'x', amplitude: 0.02, frequency: 0.5 },
        timing: EASING_TYPES.SINE
      },
      chest: {
        breathe: { axis: 'x', amplitude: 0.03, frequency: 0.5 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 蹲下动作
  '蹲下': {
    type: ACTION_TYPES.IDLE,
    duration: 1500,
    description: '蹲下',
    bones: {
      hips: {
        position: [0, -0.5, 0],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperLeg: {
        rotation: [-0.8, 0, 0],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperLeg: {
        rotation: [-0.8, 0, 0],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftLowerLeg: {
        rotation: [1.0, 0, 0],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightLowerLeg: {
        rotation: [1.0, 0, 0],
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 躺下动作
  '躺下': {
    type: ACTION_TYPES.IDLE,
    duration: 2000,
    description: '躺下休息',
    bones: {
      hips: {
        position: [0, -0.9, 0],
        rotation: [0, 0, -1.5],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      spine: {
        rotation: [0, 0, -0.2],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperLeg: {
        rotation: [-0.3, 0, 0],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperLeg: {
        rotation: [-0.3, 0, 0],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftLowerLeg: {
        rotation: [0.3, 0, 0],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightLowerLeg: {
        rotation: [0.3, 0, 0],
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 转身动作
  '转身': {
    type: ACTION_TYPES.WALK,
    duration: 2000,
    description: '转身180度',
    bones: {
      hips: {
        turn: { axis: 'y', amplitude: Math.PI },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperLeg: {
        rotation: [0.2, 0, 0],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperLeg: {
        rotation: [-0.2, 0, 0],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        rotation: [0, 0, 0.3],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        rotation: [0, 0, -0.3],
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 抬手动作
  '抬手': {
    type: ACTION_TYPES.GESTURE,
    duration: 1500,
    description: '举手提问',
    bones: {
      rightShoulder: {
        rotation: [0, 0, -0.2],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        rotation: [0, 0, -2.5],
        timing: EASING_TYPES.EASE_OUT
      },
      rightLowerArm: {
        rotation: [0, 0, -0.3],
        timing: EASING_TYPES.EASE_OUT
      },
      rightHand: {
        wave: { axis: 'z', amplitude: 0.2, frequency: 3 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 踢腿动作
  '踢腿': {
    type: ACTION_TYPES.GESTURE,
    duration: 1500,
    description: '向前踢腿',
    bones: {
      leftUpperLeg: {
        kick: { axis: 'x', amplitude: 1.0 },
        timing: EASING_TYPES.EASE_OUT
      },
      leftLowerLeg: {
        kick: { axis: 'x', amplitude: -0.8 },
        timing: EASING_TYPES.EASE_OUT
      },
      leftFoot: {
        kick: { axis: 'x', amplitude: 0.3 },
        timing: EASING_TYPES.EASE_OUT
      },
      rightUpperArm: {
        rotation: [-0.3, 0, 0],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        rotation: [0.3, 0, 0],
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 弯腰动作
  '弯腰': {
    type: ACTION_TYPES.GESTURE,
    duration: 2000,
    description: '弯腰捡东西',
    bones: {
      hips: {
        bend: { axis: 'x', amplitude: 0.6 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      spine: {
        bend: { axis: 'x', amplitude: 0.4 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      chest: {
        bend: { axis: 'x', amplitude: 0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      neck: {
        bend: { axis: 'x', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        reach: { axis: 'x', amplitude: -0.8 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        reach: { axis: 'x', amplitude: -0.8 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 侧身动作
  '侧身': {
    type: ACTION_TYPES.IDLE,
    duration: 3000,
    description: '侧身站立',
    loop: true,
    bones: {
      hips: {
        lean: { axis: 'z', amplitude: 0.2 },
        timing: EASING_TYPES.SINE
      },
      spine: {
        lean: { axis: 'z', amplitude: 0.15 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        rotation: [0, 0, 0.2],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        rotation: [0, 0, -0.2],
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 踮脚动作
  '踮脚': {
    type: ACTION_TYPES.GESTURE,
    duration: 2000,
    description: '踮脚张望',
    bones: {
      hips: {
        tiptoe: { axis: 'y', amplitude: 0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftFoot: {
        rotation: [-0.3, 0, 0],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightFoot: {
        rotation: [-0.3, 0, 0],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      neck: {
        stretch: { axis: 'x', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        stretch: { axis: 'x', amplitude: -0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 踏步动作
  '踏步': {
    type: ACTION_TYPES.WALK,
    duration: 2000,
    description: '原地踏步',
    loop: true,
    bones: {
      leftUpperLeg: {
        step: { axis: 'x', amplitude: 0.4, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      leftLowerLeg: {
        step: { axis: 'x', amplitude: 0.3, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      rightUpperLeg: {
        step: { axis: 'x', amplitude: 0.4, frequency: 2, phase: Math.PI },
        timing: EASING_TYPES.SINE
      },
      rightLowerLeg: {
        step: { axis: 'x', amplitude: 0.3, frequency: 2, phase: Math.PI },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        swing: { axis: 'x', amplitude: 0.2, frequency: 2, phase: Math.PI },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        swing: { axis: 'x', amplitude: 0.2, frequency: 2 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 后退动作
  '后退': {
    type: ACTION_TYPES.WALK,
    duration: 2500,
    description: '向后退步',
    loop: true,
    bones: {
      hips: {
        move: { axis: 'z', amplitude: -0.3 },
        timing: EASING_TYPES.SINE
      },
      leftUpperLeg: {
        swing: { axis: 'x', amplitude: 0.5, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      rightUpperLeg: {
        swing: { axis: 'x', amplitude: 0.5, frequency: 2, phase: Math.PI },
        timing: EASING_TYPES.SINE
      },
      neck: {
        look: { axis: 'x', amplitude: 0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        look: { axis: 'x', amplitude: 0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 转圈动作
  '转圈': {
    type: ACTION_TYPES.DANCE,
    duration: 3000,
    description: '原地旋转',
    loop: true,
    bones: {
      hips: {
        spin: { axis: 'y', amplitude: Math.PI * 2 },
        timing: EASING_TYPES.LINEAR
      },
      leftUpperArm: {
        rotation: [0, 0, 0.5],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        rotation: [0, 0, -0.5],
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 跨步动作
  '跨步': {
    type: ACTION_TYPES.WALK,
    duration: 2000,
    description: '大步跨越',
    bones: {
      leftUpperLeg: {
        stride: { axis: 'x', amplitude: 0.8 },
        timing: EASING_TYPES.EASE_OUT
      },
      leftLowerLeg: {
        stride: { axis: 'x', amplitude: 0.2 },
        timing: EASING_TYPES.EASE_OUT
      },
      rightUpperLeg: {
        stride: { axis: 'x', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        swing: { axis: 'x', amplitude: -0.4 },
        timing: EASING_TYPES.EASE_OUT
      },
      rightUpperArm: {
        swing: { axis: 'x', amplitude: 0.4 },
        timing: EASING_TYPES.EASE_OUT
      }
    }
  },

  // 耸肩动作
  '耸肩': {
    type: ACTION_TYPES.GESTURE,
    duration: 1500,
    description: '无奈耸肩',
    bones: {
      leftShoulder: {
        shrug: { axis: 'z', amplitude: 0.3, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      rightShoulder: {
        shrug: { axis: 'z', amplitude: -0.3, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      neck: {
        tuck: { axis: 'x', amplitude: 0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 叉腰动作
  '叉腰': {
    type: ACTION_TYPES.IDLE,
    duration: 3000,
    description: '叉腰站立',
    loop: true,
    bones: {
      leftShoulder: {
        rotation: [0, 0, 0.3],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightShoulder: {
        rotation: [0, 0, -0.3],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        rotation: [0, 0, 1.0],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        rotation: [0, 0, -1.0],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftLowerArm: {
        rotation: [0, 0, 1.5],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightLowerArm: {
        rotation: [0, 0, -1.5],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      spine: {
        lean: { axis: 'x', amplitude: 0.05 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 抱胸动作
  '抱胸': {
    type: ACTION_TYPES.IDLE,
    duration: 3000,
    description: '抱胸站立',
    loop: true,
    bones: {
      leftShoulder: {
        rotation: [0, 0, 0.2],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightShoulder: {
        rotation: [0, 0, -0.2],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        rotation: [0.5, 0.5, 0.8],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        rotation: [0.5, -0.5, -0.8],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftLowerArm: {
        rotation: [-1.5, 0, 0],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightLowerArm: {
        rotation: [-1.5, 0, 0],
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 摸头动作
  '摸头': {
    type: ACTION_TYPES.GESTURE,
    duration: 2500,
    description: '摸头思考',
    bones: {
      rightShoulder: {
        rotation: [0, 0, -0.3],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        rotation: [-1.5, 0, -0.5],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightLowerArm: {
        rotation: [-1.0, 0, 0],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightHand: {
        scratch: { axis: 'y', amplitude: 0.1, frequency: 4 },
        timing: EASING_TYPES.SINE
      },
      neck: {
        tilt: { axis: 'z', amplitude: -0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        tilt: { axis: 'z', amplitude: -0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 指向前方动作
  '指向前方': {
    type: ACTION_TYPES.GESTURE,
    duration: 2000,
    description: '手指前方',
    bones: {
      rightShoulder: {
        rotation: [0, 0, -0.2],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        rotation: [-0.5, 0, -0.3],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightLowerArm: {
        rotation: [0, 0, -0.2],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightHand: {
        point: { axis: 'x', amplitude: -0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      neck: {
        turn: { axis: 'y', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        turn: { axis: 'y', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 张望动作
  '张望': {
    type: ACTION_TYPES.GESTURE,
    duration: 3000,
    description: '四处张望',
    loop: true,
    bones: {
      neck: {
        look: { axis: 'y', amplitude: 0.6, frequency: 0.5 },
        timing: EASING_TYPES.SINE
      },
      head: {
        look: { axis: 'y', amplitude: 0.8, frequency: 0.5 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        shield: { axis: 'x', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        shield: { axis: 'x', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 伸展动作
  '伸展': {
    type: ACTION_TYPES.GESTURE,
    duration: 2500,
    description: '伸懒腰',
    bones: {
      spine: {
        stretch: { axis: 'x', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      chest: {
        stretch: { axis: 'x', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftShoulder: {
        rotation: [0, 0, 0.2],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightShoulder: {
        rotation: [0, 0, -0.2],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        stretch: { axis: 'x', amplitude: -0.5 },
        timing: EASING_TYPES.EASE_OUT
      },
      rightUpperArm: {
        stretch: { axis: 'x', amplitude: -0.5 },
        timing: EASING_TYPES.EASE_OUT
      },
      neck: {
        stretch: { axis: 'x', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 平衡动作
  '平衡': {
    type: ACTION_TYPES.IDLE,
    duration: 3000,
    description: '单脚平衡',
    loop: true,
    bones: {
      hips: {
        lean: { axis: 'z', amplitude: 0.1 },
        timing: EASING_TYPES.SINE
      },
      leftUpperLeg: {
        lift: { axis: 'x', amplitude: 0.8 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftLowerLeg: {
        bend: { axis: 'x', amplitude: -1.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        balance: { axis: 'x', amplitude: 0.3, frequency: 1 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        balance: { axis: 'x', amplitude: 0.3, frequency: 1, phase: Math.PI },
        timing: EASING_TYPES.SINE
      }
    }
  }
}

// 获取动作数据
export function getActionData(actionName) {
  return basicActionData[actionName] || null
}

// 获取动作类型
export function getActionType(actionName) {
  const data = getActionData(actionName)
  return data?.type || ACTION_TYPES.IDLE
}

// 检查动作是否可循环
export function isLoopingAction(actionName) {
  const data = getActionData(actionName)
  return data?.loop || false
}

// 导出所有动作名称
export const basicActionNames = Object.keys(basicActionData)

export default {
  ACTION_TYPES,
  EASING_TYPES,
  basicActionData,
  getActionData,
  getActionType,
  isLoopingAction,
  basicActionNames
}
