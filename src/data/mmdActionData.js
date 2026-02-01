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

// 涩涩动作数据 - 20个
export const sexyActionData = {
  // 妩媚动作
  '妩媚': {
    type: ACTION_TYPES.SEXY,
    duration: 3000,
    description: '妩媚姿态展示',
    loop: true,
    bones: {
      hips: {
        sway: { axis: 'z', amplitude: 0.15, frequency: 1 },
        timing: EASING_TYPES.SINE
      },
      spine: {
        curve: { axis: 'z', amplitude: 0.1, frequency: 1 },
        timing: EASING_TYPES.SINE
      },
      chest: {
        breathe: { axis: 'x', amplitude: 0.04, frequency: 0.8 },
        timing: EASING_TYPES.SINE
      },
      neck: {
        tilt: { axis: 'z', amplitude: 0.2, frequency: 0.5 },
        timing: EASING_TYPES.SINE
      },
      head: {
        tilt: { axis: 'z', amplitude: 0.15, frequency: 0.5 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        pose: { axis: 'z', amplitude: 0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        pose: { axis: 'z', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 诱惑动作
  '诱惑': {
    type: ACTION_TYPES.SEXY,
    duration: 2500,
    description: '诱惑姿态',
    loop: true,
    bones: {
      hips: {
        circle: { axis: 'y', amplitude: 0.3, frequency: 0.8 },
        timing: EASING_TYPES.SINE
      },
      spine: {
        arch: { axis: 'x', amplitude: -0.2, frequency: 0.8 },
        timing: EASING_TYPES.SINE
      },
      chest: {
        forward: { axis: 'x', amplitude: 0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      neck: {
        stretch: { axis: 'x', amplitude: -0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        caress: { axis: 'x', amplitude: -0.4, frequency: 1.5 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        caress: { axis: 'x', amplitude: -0.4, frequency: 1.5, phase: Math.PI },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 撩发动作
  '撩发': {
    type: ACTION_TYPES.SEXY,
    duration: 2000,
    description: '撩动头发',
    bones: {
      rightShoulder: {
        rotation: [0, 0, -0.3],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        lift: { axis: 'x', amplitude: -1.2 },
        timing: EASING_TYPES.EASE_OUT
      },
      rightLowerArm: {
        bend: { axis: 'x', amplitude: -1.0 },
        timing: EASING_TYPES.EASE_OUT
      },
      rightHand: {
        flick: { axis: 'y', amplitude: 0.3, frequency: 3 },
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

  // 咬唇动作
  '咬唇': {
    type: ACTION_TYPES.SEXY,
    duration: 1500,
    description: '轻咬嘴唇',
    bones: {
      neck: {
        tilt: { axis: 'x', amplitude: 0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        tilt: { axis: 'x', amplitude: 0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        touch: { axis: 'x', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        touch: { axis: 'x', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 扭腰动作
  '扭腰': {
    type: ACTION_TYPES.SEXY,
    duration: 2000,
    description: '扭动腰部',
    loop: true,
    bones: {
      hips: {
        twist: { axis: 'y', amplitude: 0.4, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      spine: {
        wave: { axis: 'z', amplitude: 0.15, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      chest: {
        counter: { axis: 'y', amplitude: -0.2, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        swing: { axis: 'z', amplitude: 0.2, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        swing: { axis: 'z', amplitude: -0.2, frequency: 2 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 抛媚眼动作
  '抛媚眼': {
    type: ACTION_TYPES.SEXY,
    duration: 2000,
    description: '抛媚眼',
    bones: {
      neck: {
        turn: { axis: 'y', amplitude: 0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        turn: { axis: 'y', amplitude: 0.4 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        pose: { axis: 'z', amplitude: 0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        wink: { axis: 'z', amplitude: -0.3, frequency: 2 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 轻抚动作
  '轻抚': {
    type: ACTION_TYPES.SEXY,
    duration: 3000,
    description: '轻抚身体',
    loop: true,
    bones: {
      leftUpperArm: {
        stroke: { axis: 'x', amplitude: -0.5, frequency: 1 },
        timing: EASING_TYPES.SINE
      },
      leftLowerArm: {
        stroke: { axis: 'x', amplitude: -0.8, frequency: 1 },
        timing: EASING_TYPES.SINE
      },
      leftHand: {
        caress: { axis: 'y', amplitude: 0.2, frequency: 1.5 },
        timing: EASING_TYPES.SINE
      },
      spine: {
        arch: { axis: 'x', amplitude: -0.1, frequency: 1 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 依偎动作
  '依偎': {
    type: ACTION_TYPES.SEXY,
    duration: 3000,
    description: '依偎姿态',
    loop: true,
    bones: {
      spine: {
        lean: { axis: 'x', amplitude: 0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      chest: {
        forward: { axis: 'x', amplitude: 0.08 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      neck: {
        tilt: { axis: 'z', amplitude: 0.25 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        rest: { axis: 'z', amplitude: 0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        hold: { axis: 'z', amplitude: 0.4 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        hold: { axis: 'z', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 侧身动作
  '侧身': {
    type: ACTION_TYPES.SEXY,
    duration: 2500,
    description: '侧身展示',
    loop: true,
    bones: {
      hips: {
        pose: { axis: 'z', amplitude: 0.25 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      spine: {
        curve: { axis: 'z', amplitude: 0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      chest: {
        turn: { axis: 'y', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      neck: {
        turn: { axis: 'y', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        turn: { axis: 'y', amplitude: -0.4 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        pose: { axis: 'z', amplitude: 0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        pose: { axis: 'z', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 回眸动作
  '回眸': {
    type: ACTION_TYPES.SEXY,
    duration: 2000,
    description: '回眸一笑',
    bones: {
      hips: {
        turn: { axis: 'y', amplitude: 0.5 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      spine: {
        twist: { axis: 'y', amplitude: 0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      chest: {
        turn: { axis: 'y', amplitude: 0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      neck: {
        turn: { axis: 'y', amplitude: -0.6 },
        timing: EASING_TYPES.EASE_OUT
      },
      head: {
        turn: { axis: 'y', amplitude: -0.8 },
        timing: EASING_TYPES.EASE_OUT
      },
      leftUpperArm: {
        pose: { axis: 'z', amplitude: 0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 轻咬动作
  '轻咬': {
    type: ACTION_TYPES.SEXY,
    duration: 1500,
    description: '轻咬手指',
    bones: {
      rightShoulder: {
        rotation: [0, 0, -0.2],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        lift: { axis: 'x', amplitude: -0.8 },
        timing: EASING_TYPES.EASE_OUT
      },
      rightLowerArm: {
        bend: { axis: 'x', amplitude: -1.2 },
        timing: EASING_TYPES.EASE_OUT
      },
      rightHand: {
        bite: { axis: 'y', amplitude: 0.1, frequency: 4 },
        timing: EASING_TYPES.SINE
      },
      neck: {
        tilt: { axis: 'x', amplitude: 0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 舔唇动作
  '舔唇': {
    type: ACTION_TYPES.SEXY,
    duration: 1800,
    description: '舔嘴唇',
    bones: {
      neck: {
        stretch: { axis: 'x', amplitude: -0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        tilt: { axis: 'x', amplitude: -0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        pose: { axis: 'z', amplitude: 0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        pose: { axis: 'z', amplitude: -0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 抚胸动作
  '抚胸': {
    type: ACTION_TYPES.SEXY,
    duration: 2500,
    description: '轻抚胸口',
    bones: {
      leftShoulder: {
        rotation: [0, 0, 0.2],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        lift: { axis: 'x', amplitude: -0.6 },
        timing: EASING_TYPES.EASE_OUT
      },
      leftLowerArm: {
        bend: { axis: 'x', amplitude: -1.0 },
        timing: EASING_TYPES.EASE_OUT
      },
      leftHand: {
        caress: { axis: 'y', amplitude: 0.15, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      spine: {
        arch: { axis: 'x', amplitude: -0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 摸腿动作
  '摸腿': {
    type: ACTION_TYPES.SEXY,
    duration: 3000,
    description: '轻抚腿部',
    loop: true,
    bones: {
      rightShoulder: {
        rotation: [0, 0, -0.3],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        reach: { axis: 'x', amplitude: -0.4 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightLowerArm: {
        stroke: { axis: 'x', amplitude: -0.3, frequency: 1 },
        timing: EASING_TYPES.SINE
      },
      rightHand: {
        glide: { axis: 'y', amplitude: 0.2, frequency: 1 },
        timing: EASING_TYPES.SINE
      },
      spine: {
        bend: { axis: 'x', amplitude: 0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 翘臀动作
  '翘臀': {
    type: ACTION_TYPES.SEXY,
    duration: 2000,
    description: '翘起臀部',
    loop: true,
    bones: {
      hips: {
        arch: { axis: 'x', amplitude: -0.25, frequency: 1.5 },
        timing: EASING_TYPES.SINE
      },
      spine: {
        arch: { axis: 'x', amplitude: -0.2, frequency: 1.5 },
        timing: EASING_TYPES.SINE
      },
      chest: {
        forward: { axis: 'x', amplitude: 0.1, frequency: 1.5 },
        timing: EASING_TYPES.SINE
      },
      leftUpperLeg: {
        pose: { axis: 'x', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperLeg: {
        pose: { axis: 'x', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 挺胸动作
  '挺胸': {
    type: ACTION_TYPES.SEXY,
    duration: 2000,
    description: '挺起胸膛',
    loop: true,
    bones: {
      spine: {
        arch: { axis: 'x', amplitude: -0.15, frequency: 1.2 },
        timing: EASING_TYPES.SINE
      },
      chest: {
        forward: { axis: 'x', amplitude: 0.12, frequency: 1.2 },
        timing: EASING_TYPES.SINE
      },
      neck: {
        stretch: { axis: 'x', amplitude: -0.1, frequency: 1.2 },
        timing: EASING_TYPES.SINE
      },
      leftShoulder: {
        back: { axis: 'x', amplitude: -0.1, frequency: 1.2 },
        timing: EASING_TYPES.SINE
      },
      rightShoulder: {
        back: { axis: 'x', amplitude: -0.1, frequency: 1.2 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 收腿动作
  '收腿': {
    type: ACTION_TYPES.SEXY,
    duration: 3000,
    description: '收腿坐姿',
    loop: true,
    bones: {
      hips: {
        position: [0, -0.7, 0],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperLeg: {
        close: { axis: 'z', amplitude: 0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperLeg: {
        close: { axis: 'z', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftLowerLeg: {
        bend: { axis: 'x', amplitude: 1.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightLowerLeg: {
        bend: { axis: 'x', amplitude: 1.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      spine: {
        curve: { axis: 'z', amplitude: 0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 侧卧动作
  '侧卧': {
    type: ACTION_TYPES.SEXY,
    duration: 3000,
    description: '侧卧姿态',
    loop: true,
    bones: {
      hips: {
        position: [0, -0.8, 0],
        rotation: [0, 0, -1.4],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      spine: {
        curve: { axis: 'z', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperLeg: {
        pose: { axis: 'x', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperLeg: {
        pose: { axis: 'x', amplitude: 0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        support: { axis: 'x', amplitude: -0.5 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        rest: { axis: 'z', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 俯卧动作
  '俯卧': {
    type: ACTION_TYPES.SEXY,
    duration: 3000,
    description: '俯卧姿态',
    loop: true,
    bones: {
      hips: {
        position: [0, -0.9, 0],
        rotation: [1.5, 0, 0],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      spine: {
        arch: { axis: 'x', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      chest: {
        lift: { axis: 'x', amplitude: -0.15, frequency: 0.8 },
        timing: EASING_TYPES.SINE
      },
      neck: {
        stretch: { axis: 'x', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        rest: { axis: 'x', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        rest: { axis: 'x', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperLeg: {
        lift: { axis: 'x', amplitude: -0.3, frequency: 0.8 },
        timing: EASING_TYPES.SINE
      },
      rightUpperLeg: {
        lift: { axis: 'x', amplitude: -0.3, frequency: 0.8, phase: Math.PI },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 蜷缩动作
  '蜷缩': {
    type: ACTION_TYPES.SEXY,
    duration: 3000,
    description: '蜷缩姿态',
    loop: true,
    bones: {
      hips: {
        position: [0, -0.6, 0],
        rotation: [0, 0, 0.3],
        timing: EASING_TYPES.EASE_IN_OUT
      },
      spine: {
        curl: { axis: 'x', amplitude: 0.4 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      chest: {
        tuck: { axis: 'x', amplitude: 0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      neck: {
        tuck: { axis: 'x', amplitude: 0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        bow: { axis: 'x', amplitude: 0.4 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        hug: { axis: 'z', amplitude: 0.5 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        hug: { axis: 'z', amplitude: -0.5 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperLeg: {
        curl: { axis: 'x', amplitude: 0.8 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperLeg: {
        curl: { axis: 'x', amplitude: 0.8 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftLowerLeg: {
        bend: { axis: 'x', amplitude: 1.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightLowerLeg: {
        bend: { axis: 'x', amplitude: 1.2 },
        timing: EASING_TYPES.EASE_IN_OUT
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
export const sexyActionNames = Object.keys(sexyActionData)

// 舞蹈动作数据 - 30个
export const danceActionData = {
  // 街舞
  '街舞': {
    type: ACTION_TYPES.DANCE,
    duration: 4000,
    description: '街头舞蹈风格',
    loop: true,
    bones: {
      hips: {
        bounce: { axis: 'y', amplitude: 0.1, frequency: 4 },
        timing: EASING_TYPES.SINE
      },
      spine: {
        wave: { axis: 'z', amplitude: 0.2, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        pop: { axis: 'z', amplitude: 0.8, frequency: 4 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        pop: { axis: 'z', amplitude: -0.8, frequency: 4, phase: Math.PI },
        timing: EASING_TYPES.SINE
      },
      leftLowerArm: {
        lock: { axis: 'x', amplitude: -0.5 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightLowerArm: {
        lock: { axis: 'x', amplitude: -0.5 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 芭蕾
  '芭蕾': {
    type: ACTION_TYPES.DANCE,
    duration: 5000,
    description: '优雅芭蕾舞',
    loop: true,
    bones: {
      hips: {
        rise: { axis: 'y', amplitude: 0.15, frequency: 0.8 },
        timing: EASING_TYPES.SINE
      },
      spine: {
        arch: { axis: 'x', amplitude: -0.15, frequency: 0.8 },
        timing: EASING_TYPES.SINE
      },
      leftUpperLeg: {
        extend: { axis: 'x', amplitude: 0.6, frequency: 0.8 },
        timing: EASING_TYPES.SINE
      },
      leftLowerLeg: {
        point: { axis: 'x', amplitude: 0.8, frequency: 0.8 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        grace: { axis: 'z', amplitude: 0.6, frequency: 0.8 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        grace: { axis: 'z', amplitude: -0.6, frequency: 0.8, phase: Math.PI },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 机械舞
  '机械舞': {
    type: ACTION_TYPES.DANCE,
    duration: 3000,
    description: '机械风格舞蹈',
    loop: true,
    bones: {
      hips: {
        robot: { axis: 'y', amplitude: 0.05, frequency: 3 },
        timing: EASING_TYPES.LINEAR
      },
      spine: {
        segments: [
          { rotation: [0.1, 0, 0], time: 0.2 },
          { rotation: [-0.1, 0, 0], time: 0.4 },
          { rotation: [0, 0, 0], time: 0.6 }
        ],
        timing: EASING_TYPES.LINEAR
      },
      leftUpperArm: {
        robot: { axis: 'z', amplitude: 0.5, frequency: 3 },
        timing: EASING_TYPES.LINEAR
      },
      rightUpperArm: {
        robot: { axis: 'z', amplitude: -0.5, frequency: 3 },
        timing: EASING_TYPES.LINEAR
      }
    }
  },

  // 霹雳舞
  '霹雳舞': {
    type: ACTION_TYPES.DANCE,
    duration: 3500,
    description: '霹雳地板动作',
    loop: true,
    bones: {
      hips: {
        spin: { axis: 'y', amplitude: Math.PI * 2, frequency: 1 },
        timing: EASING_TYPES.LINEAR
      },
      spine: {
        twist: { axis: 'y', amplitude: 0.3, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        support: { axis: 'x', amplitude: -0.8 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        swing: { axis: 'z', amplitude: 0.6, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      leftUpperLeg: {
        kick: { axis: 'x', amplitude: 0.5, frequency: 2 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 爵士舞
  '爵士舞': {
    type: ACTION_TYPES.DANCE,
    duration: 3000,
    description: '爵士风格舞蹈',
    loop: true,
    bones: {
      hips: {
        sass: { axis: 'z', amplitude: 0.25, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      spine: {
        roll: { axis: 'x', amplitude: 0.2, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      chest: {
        pop: { axis: 'x', amplitude: 0.1, frequency: 4 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        jazz: { axis: 'z', amplitude: 0.7, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        jazz: { axis: 'z', amplitude: -0.7, frequency: 2, phase: Math.PI },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 拉丁舞
  '拉丁舞': {
    type: ACTION_TYPES.DANCE,
    duration: 3000,
    description: '热情拉丁舞',
    loop: true,
    bones: {
      hips: {
        cuban: { axis: 'z', amplitude: 0.3, frequency: 3 },
        timing: EASING_TYPES.SINE
      },
      spine: {
        roll: { axis: 'z', amplitude: 0.15, frequency: 3 },
        timing: EASING_TYPES.SINE
      },
      leftUpperLeg: {
        step: { axis: 'x', amplitude: 0.4, frequency: 3 },
        timing: EASING_TYPES.SINE
      },
      rightUpperLeg: {
        step: { axis: 'x', amplitude: 0.4, frequency: 3, phase: Math.PI },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        hold: { axis: 'z', amplitude: 0.4 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        hold: { axis: 'z', amplitude: -0.4 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 现代舞
  '现代舞': {
    type: ACTION_TYPES.DANCE,
    duration: 4000,
    description: '现代自由舞蹈',
    loop: true,
    bones: {
      spine: {
        flow: { axis: 'x', amplitude: 0.3, frequency: 0.5 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        flow: { axis: 'x', amplitude: -0.6, frequency: 0.5 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        flow: { axis: 'x', amplitude: -0.6, frequency: 0.5, phase: Math.PI },
        timing: EASING_TYPES.SINE
      },
      neck: {
        release: { axis: 'x', amplitude: 0.2, frequency: 0.5 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 踢踏舞
  '踢踏舞': {
    type: ACTION_TYPES.DANCE,
    duration: 2500,
    description: '节奏踢踏舞',
    loop: true,
    bones: {
      hips: {
        tap: { axis: 'y', amplitude: 0.05, frequency: 6 },
        timing: EASING_TYPES.SINE
      },
      leftUpperLeg: {
        tap: { axis: 'x', amplitude: 0.3, frequency: 6 },
        timing: EASING_TYPES.SINE
      },
      leftLowerLeg: {
        tap: { axis: 'x', amplitude: 0.4, frequency: 6 },
        timing: EASING_TYPES.SINE
      },
      rightUpperLeg: {
        tap: { axis: 'x', amplitude: 0.3, frequency: 6, phase: Math.PI },
        timing: EASING_TYPES.SINE
      },
      rightLowerLeg: {
        tap: { axis: 'x', amplitude: 0.4, frequency: 6, phase: Math.PI },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        swing: { axis: 'x', amplitude: 0.2, frequency: 3 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        swing: { axis: 'x', amplitude: 0.2, frequency: 3 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 摇摆舞
  '摇摆舞': {
    type: ACTION_TYPES.DANCE,
    duration: 3000,
    description: '复古摇摆舞',
    loop: true,
    bones: {
      hips: {
        swing: { axis: 'z', amplitude: 0.2, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      spine: {
        swing: { axis: 'z', amplitude: 0.15, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        swing: { axis: 'z', amplitude: 0.5, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        swing: { axis: 'z', amplitude: -0.5, frequency: 2, phase: Math.PI },
        timing: EASING_TYPES.SINE
      },
      leftLowerArm: {
        swing: { axis: 'x', amplitude: -0.3, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      rightLowerArm: {
        swing: { axis: 'x', amplitude: -0.3, frequency: 2 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 探戈
  '探戈': {
    type: ACTION_TYPES.DANCE,
    duration: 3500,
    description: '激情探戈',
    loop: true,
    bones: {
      hips: {
        sharp: { axis: 'z', amplitude: 0.25, frequency: 1.5 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      spine: {
        sharp: { axis: 'z', amplitude: 0.2, frequency: 1.5 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperLeg: {
        sharp: { axis: 'x', amplitude: 0.5, frequency: 1.5 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperLeg: {
        sharp: { axis: 'x', amplitude: 0.5, frequency: 1.5, phase: Math.PI },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        frame: { axis: 'z', amplitude: 0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        frame: { axis: 'z', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 华尔兹
  '华尔兹': {
    type: ACTION_TYPES.DANCE,
    duration: 4000,
    description: '优雅华尔兹',
    loop: true,
    bones: {
      hips: {
        rise: { axis: 'y', amplitude: 0.08, frequency: 1 },
        timing: EASING_TYPES.SINE
      },
      spine: {
        sway: { axis: 'z', amplitude: 0.1, frequency: 1 },
        timing: EASING_TYPES.SINE
      },
      leftUpperLeg: {
        sweep: { axis: 'x', amplitude: 0.3, frequency: 1 },
        timing: EASING_TYPES.SINE
      },
      rightUpperLeg: {
        sweep: { axis: 'x', amplitude: 0.3, frequency: 1, phase: Math.PI },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        frame: { axis: 'z', amplitude: 0.4 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        frame: { axis: 'z', amplitude: -0.4 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 桑巴
  '桑巴': {
    type: ACTION_TYPES.DANCE,
    duration: 2500,
    description: '热情桑巴',
    loop: true,
    bones: {
      hips: {
        roll: { axis: 'z', amplitude: 0.3, frequency: 3 },
        timing: EASING_TYPES.SINE
      },
      spine: {
        roll: { axis: 'z', amplitude: 0.2, frequency: 3 },
        timing: EASING_TYPES.SINE
      },
      leftUpperLeg: {
        bounce: { axis: 'x', amplitude: 0.4, frequency: 3 },
        timing: EASING_TYPES.SINE
      },
      rightUpperLeg: {
        bounce: { axis: 'x', amplitude: 0.4, frequency: 3, phase: Math.PI },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        shake: { axis: 'z', amplitude: 0.5, frequency: 3 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        shake: { axis: 'z', amplitude: -0.5, frequency: 3 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 恰恰
  '恰恰': {
    type: ACTION_TYPES.DANCE,
    duration: 2500,
    description: '轻快恰恰',
    loop: true,
    bones: {
      hips: {
        cha: { axis: 'z', amplitude: 0.2, frequency: 4 },
        timing: EASING_TYPES.SINE
      },
      leftUpperLeg: {
        cha: { axis: 'x', amplitude: 0.3, frequency: 4 },
        timing: EASING_TYPES.SINE
      },
      rightUpperLeg: {
        cha: { axis: 'x', amplitude: 0.3, frequency: 4, phase: Math.PI },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        cha: { axis: 'z', amplitude: 0.4, frequency: 4 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        cha: { axis: 'z', amplitude: -0.4, frequency: 4 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 伦巴
  '伦巴': {
    type: ACTION_TYPES.DANCE,
    duration: 4000,
    description: '浪漫伦巴',
    loop: true,
    bones: {
      hips: {
        slow: { axis: 'z', amplitude: 0.25, frequency: 1.2 },
        timing: EASING_TYPES.SINE
      },
      spine: {
        wave: { axis: 'x', amplitude: 0.15, frequency: 1.2 },
        timing: EASING_TYPES.SINE
      },
      leftUpperLeg: {
        slow: { axis: 'x', amplitude: 0.35, frequency: 1.2 },
        timing: EASING_TYPES.SINE
      },
      rightUpperLeg: {
        slow: { axis: 'x', amplitude: 0.35, frequency: 1.2, phase: Math.PI },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        slow: { axis: 'z', amplitude: 0.3, frequency: 1.2 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        slow: { axis: 'z', amplitude: -0.3, frequency: 1.2 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 弗拉明戈
  '弗拉明戈': {
    type: ACTION_TYPES.DANCE,
    duration: 3000,
    description: '西班牙弗拉明戈',
    loop: true,
    bones: {
      hips: {
        sharp: { axis: 'z', amplitude: 0.2, frequency: 2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      spine: {
        proud: { axis: 'x', amplitude: -0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        flamenco: { axis: 'z', amplitude: 0.6, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        flamenco: { axis: 'z', amplitude: -0.6, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      leftLowerArm: {
        wrist: { axis: 'y', amplitude: 0.4, frequency: 4 },
        timing: EASING_TYPES.SINE
      },
      rightLowerArm: {
        wrist: { axis: 'y', amplitude: -0.4, frequency: 4 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 草裙舞
  '草裙舞': {
    type: ACTION_TYPES.DANCE,
    duration: 3000,
    description: '夏威夷草裙舞',
    loop: true,
    bones: {
      hips: {
        hula: { axis: 'z', amplitude: 0.3, frequency: 1.5 },
        timing: EASING_TYPES.SINE
      },
      spine: {
        hula: { axis: 'z', amplitude: 0.2, frequency: 1.5 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        hula: { axis: 'z', amplitude: 0.4, frequency: 1.5 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        hula: { axis: 'z', amplitude: -0.4, frequency: 1.5 },
        timing: EASING_TYPES.SINE
      },
      neck: {
        hula: { axis: 'y', amplitude: 0.15, frequency: 1.5 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 印度舞
  '印度舞': {
    type: ACTION_TYPES.DANCE,
    duration: 3500,
    description: '印度古典舞',
    loop: true,
    bones: {
      neck: {
        indian: { axis: 'x', amplitude: 0.15, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      head: {
        indian: { axis: 'y', amplitude: 0.2, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        mudra: { axis: 'z', amplitude: 0.5, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        mudra: { axis: 'z', amplitude: -0.5, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      leftLowerArm: {
        mudra: { axis: 'x', amplitude: -0.4, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      rightLowerArm: {
        mudra: { axis: 'x', amplitude: -0.4, frequency: 2 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 钢管舞
  '钢管舞': {
    type: ACTION_TYPES.DANCE,
    duration: 4000,
    description: '钢管舞蹈',
    loop: true,
    bones: {
      hips: {
        pole: { axis: 'y', amplitude: 0.3, frequency: 1 },
        timing: EASING_TYPES.SINE
      },
      spine: {
        arch: { axis: 'x', amplitude: -0.3, frequency: 1 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        grip: { axis: 'z', amplitude: 0.4 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        grip: { axis: 'z', amplitude: -0.4 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperLeg: {
        wrap: { axis: 'x', amplitude: 0.5, frequency: 1 },
        timing: EASING_TYPES.SINE
      },
      rightUpperLeg: {
        wrap: { axis: 'x', amplitude: 0.5, frequency: 1, phase: Math.PI },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 迪斯科
  '迪斯科': {
    type: ACTION_TYPES.DANCE,
    duration: 2500,
    description: '复古迪斯科',
    loop: true,
    bones: {
      hips: {
        disco: { axis: 'z', amplitude: 0.25, frequency: 3 },
        timing: EASING_TYPES.SINE
      },
      spine: {
        disco: { axis: 'z', amplitude: 0.15, frequency: 3 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        point: { axis: 'z', amplitude: 0.7, frequency: 3 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        point: { axis: 'z', amplitude: -0.7, frequency: 3 },
        timing: EASING_TYPES.SINE
      },
      leftLowerArm: {
        point: { axis: 'x', amplitude: -0.5, frequency: 3 },
        timing: EASING_TYPES.SINE
      },
      rightLowerArm: {
        point: { axis: 'x', amplitude: -0.5, frequency: 3 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 锁舞
  '锁舞': {
    type: ACTION_TYPES.DANCE,
    duration: 2000,
    description: 'Locking锁舞',
    loop: true,
    bones: {
      hips: {
        lock: { axis: 'y', amplitude: 0.1, frequency: 4 },
        timing: EASING_TYPES.LINEAR
      },
      leftUpperArm: {
        lock: { axis: 'z', amplitude: 0.6, frequency: 4 },
        timing: EASING_TYPES.LINEAR
      },
      rightUpperArm: {
        lock: { axis: 'z', amplitude: -0.6, frequency: 4 },
        timing: EASING_TYPES.LINEAR
      },
      leftLowerArm: {
        lock: { axis: 'x', amplitude: -0.4, frequency: 4 },
        timing: EASING_TYPES.LINEAR
      },
      rightLowerArm: {
        lock: { axis: 'x', amplitude: -0.4, frequency: 4 },
        timing: EASING_TYPES.LINEAR
      }
    }
  },

  // 浩室舞
  '浩室舞': {
    type: ACTION_TYPES.DANCE,
    duration: 2500,
    description: 'House浩室舞',
    loop: true,
    bones: {
      hips: {
        house: { axis: 'y', amplitude: 0.08, frequency: 4 },
        timing: EASING_TYPES.SINE
      },
      leftUpperLeg: {
        jack: { axis: 'x', amplitude: 0.3, frequency: 4 },
        timing: EASING_TYPES.SINE
      },
      rightUpperLeg: {
        jack: { axis: 'x', amplitude: 0.3, frequency: 4, phase: Math.PI },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        jack: { axis: 'z', amplitude: 0.4, frequency: 4 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        jack: { axis: 'z', amplitude: -0.4, frequency: 4 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 雷鬼舞
  '雷鬼舞': {
    type: ACTION_TYPES.DANCE,
    duration: 3000,
    description: 'Reggae雷鬼舞',
    loop: true,
    bones: {
      hips: {
        reggae: { axis: 'z', amplitude: 0.2, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      spine: {
        reggae: { axis: 'z', amplitude: 0.15, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        chill: { axis: 'z', amplitude: 0.3, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        chill: { axis: 'z', amplitude: -0.3, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      neck: {
        chill: { axis: 'y', amplitude: 0.1, frequency: 2 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 尊巴
  '尊巴': {
    type: ACTION_TYPES.DANCE,
    duration: 2500,
    description: 'Zumba尊巴',
    loop: true,
    bones: {
      hips: {
        zumba: { axis: 'z', amplitude: 0.3, frequency: 3 },
        timing: EASING_TYPES.SINE
      },
      leftUpperLeg: {
        zumba: { axis: 'x', amplitude: 0.4, frequency: 3 },
        timing: EASING_TYPES.SINE
      },
      rightUpperLeg: {
        zumba: { axis: 'x', amplitude: 0.4, frequency: 3, phase: Math.PI },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        zumba: { axis: 'z', amplitude: 0.5, frequency: 3 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        zumba: { axis: 'z', amplitude: -0.5, frequency: 3 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 曳步舞
  '曳步舞': {
    type: ACTION_TYPES.DANCE,
    duration: 2000,
    description: 'Shuffle曳步舞',
    loop: true,
    bones: {
      hips: {
        shuffle: { axis: 'y', amplitude: 0.05, frequency: 5 },
        timing: EASING_TYPES.SINE
      },
      leftUpperLeg: {
        slide: { axis: 'x', amplitude: 0.4, frequency: 5 },
        timing: EASING_TYPES.SINE
      },
      leftLowerLeg: {
        slide: { axis: 'x', amplitude: 0.5, frequency: 5 },
        timing: EASING_TYPES.SINE
      },
      rightUpperLeg: {
        slide: { axis: 'x', amplitude: 0.4, frequency: 5, phase: Math.PI },
        timing: EASING_TYPES.SINE
      },
      rightLowerLeg: {
        slide: { axis: 'x', amplitude: 0.5, frequency: 5, phase: Math.PI },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        swing: { axis: 'x', amplitude: 0.2, frequency: 5 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        swing: { axis: 'x', amplitude: 0.2, frequency: 5 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 鬼步舞
  '鬼步舞': {
    type: ACTION_TYPES.DANCE,
    duration: 2000,
    description: 'Ghost Step鬼步舞',
    loop: true,
    bones: {
      hips: {
        ghost: { axis: 'y', amplitude: 0.1, frequency: 4 },
        timing: EASING_TYPES.SINE
      },
      leftUpperLeg: {
        ghost: { axis: 'x', amplitude: 0.5, frequency: 4 },
        timing: EASING_TYPES.SINE
      },
      leftLowerLeg: {
        ghost: { axis: 'x', amplitude: 0.6, frequency: 4 },
        timing: EASING_TYPES.SINE
      },
      rightUpperLeg: {
        ghost: { axis: 'x', amplitude: 0.5, frequency: 4, phase: Math.PI },
        timing: EASING_TYPES.SINE
      },
      rightLowerLeg: {
        ghost: { axis: 'x', amplitude: 0.6, frequency: 4, phase: Math.PI },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        float: { axis: 'z', amplitude: 0.3, frequency: 4 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        float: { axis: 'z', amplitude: -0.3, frequency: 4 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 骑马舞
  '骑马舞': {
    type: ACTION_TYPES.DANCE,
    duration: 3000,
    description: '江南Style骑马舞',
    loop: true,
    bones: {
      hips: {
        horse: { axis: 'y', amplitude: 0.15, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      leftUpperLeg: {
        horse: { axis: 'x', amplitude: 0.4, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      rightUpperLeg: {
        horse: { axis: 'x', amplitude: 0.4, frequency: 2, phase: Math.PI },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        reins: { axis: 'z', amplitude: 0.5, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        reins: { axis: 'z', amplitude: -0.5, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      leftLowerArm: {
        reins: { axis: 'x', amplitude: -0.3, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      rightLowerArm: {
        reins: { axis: 'x', amplitude: -0.3, frequency: 2 },
        timing: EASING_TYPES.SINE
      }
    }
  }
}

// 合并所有动作数据
export const allActionData = {
  ...basicActionData,
  ...sexyActionData,
  ...danceActionData
}

// 获取任意动作数据（包括涩涩动作）
export function getActionData(actionName) {
  return allActionData[actionName] || null
}

export default {
  ACTION_TYPES,
  EASING_TYPES,
  basicActionData,
  sexyActionData,
  allActionData,
  getActionData,
  getActionType,
  isLoopingAction,
  basicActionNames,
  sexyActionNames
}
