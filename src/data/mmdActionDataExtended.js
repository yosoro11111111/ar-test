// MMD动作数据扩展 - 表情、酷炫、特殊动作
import { ACTION_TYPES, EASING_TYPES } from './mmdActionData.js'

// 表情动作数据 - 30个
export const expressionActionData = {
  // 微笑
  '微笑': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 2000,
    description: '温暖微笑',
    loop: true,
    bones: {
      neck: {
        tilt: { axis: 'z', amplitude: 0.1, frequency: 0.5 },
        timing: EASING_TYPES.SINE
      },
      head: {
        tilt: { axis: 'z', amplitude: 0.08, frequency: 0.5 },
        timing: EASING_TYPES.SINE
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

  // 眨眼
  '眨眼': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 1500,
    description: '俏皮眨眼',
    bones: {
      neck: {
        tilt: { axis: 'z', amplitude: -0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        tilt: { axis: 'z', amplitude: -0.12 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        pose: { axis: 'z', amplitude: 0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 嘟嘴
  '嘟嘴': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 2000,
    description: '可爱嘟嘴',
    bones: {
      neck: {
        push: { axis: 'x', amplitude: 0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        push: { axis: 'x', amplitude: 0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        pose: { axis: 'z', amplitude: 0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        pose: { axis: 'z', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 惊讶
  '惊讶': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 1500,
    description: '惊讶表情',
    bones: {
      neck: {
        back: { axis: 'x', amplitude: -0.15 },
        timing: EASING_TYPES.EASE_OUT
      },
      head: {
        back: { axis: 'x', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_OUT
      },
      leftUpperArm: {
        raise: { axis: 'x', amplitude: -0.4 },
        timing: EASING_TYPES.EASE_OUT
      },
      rightUpperArm: {
        raise: { axis: 'x', amplitude: -0.4 },
        timing: EASING_TYPES.EASE_OUT
      }
    }
  },

  // 害羞
  '害羞': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 2500,
    description: '害羞低头',
    bones: {
      neck: {
        down: { axis: 'x', amplitude: 0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        down: { axis: 'x', amplitude: 0.4 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        hide: { axis: 'z', amplitude: 0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        hide: { axis: 'z', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 生气
  '生气': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 2000,
    description: '生气叉腰',
    bones: {
      neck: {
        forward: { axis: 'x', amplitude: -0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        forward: { axis: 'x', amplitude: -0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftShoulder: {
        angry: { axis: 'z', amplitude: 0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightShoulder: {
        angry: { axis: 'z', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        akimbo: { axis: 'z', amplitude: 0.8 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        akimbo: { axis: 'z', amplitude: -0.8 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 难过
  '难过': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 3000,
    description: '伤心难过',
    bones: {
      neck: {
        down: { axis: 'x', amplitude: 0.25 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        down: { axis: 'x', amplitude: 0.35 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      spine: {
        slump: { axis: 'x', amplitude: 0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        drop: { axis: 'z', amplitude: 0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        drop: { axis: 'z', amplitude: -0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 困惑
  '困惑': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 2500,
    description: '困惑歪头',
    loop: true,
    bones: {
      neck: {
        tilt: { axis: 'z', amplitude: 0.2, frequency: 0.8 },
        timing: EASING_TYPES.SINE
      },
      head: {
        tilt: { axis: 'z', amplitude: 0.25, frequency: 0.8 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        scratch: { axis: 'x', amplitude: -0.3, frequency: 0.8 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 调皮
  '调皮': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 2000,
    description: '调皮吐舌',
    bones: {
      neck: {
        forward: { axis: 'x', amplitude: -0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        forward: { axis: 'x', amplitude: -0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        playful: { axis: 'z', amplitude: 0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        playful: { axis: 'z', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 困倦
  '困倦': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 3000,
    description: '困倦打哈欠',
    loop: true,
    bones: {
      neck: {
        droop: { axis: 'x', amplitude: 0.15, frequency: 0.5 },
        timing: EASING_TYPES.SINE
      },
      head: {
        droop: { axis: 'x', amplitude: 0.2, frequency: 0.5 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        stretch: { axis: 'x', amplitude: -0.4, frequency: 0.5 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        stretch: { axis: 'x', amplitude: -0.4, frequency: 0.5 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 期待
  '期待': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 2500,
    description: '期待眼神',
    loop: true,
    bones: {
      neck: {
        forward: { axis: 'x', amplitude: -0.1, frequency: 1.5 },
        timing: EASING_TYPES.SINE
      },
      head: {
        forward: { axis: 'x', amplitude: -0.15, frequency: 1.5 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        clasp: { axis: 'z', amplitude: 0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        clasp: { axis: 'z', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 得意
  '得意': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 2000,
    description: '得意洋洋',
    bones: {
      neck: {
        up: { axis: 'x', amplitude: -0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        up: { axis: 'x', amplitude: -0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        proud: { axis: 'z', amplitude: 0.25 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        proud: { axis: 'z', amplitude: -0.25 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 害怕
  '害怕': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 2000,
    description: '害怕退缩',
    bones: {
      neck: {
        back: { axis: 'x', amplitude: -0.15 },
        timing: EASING_TYPES.EASE_OUT
      },
      head: {
        back: { axis: 'x', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_OUT
      },
      leftUpperArm: {
        shield: { axis: 'x', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_OUT
      },
      rightUpperArm: {
        shield: { axis: 'x', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_OUT
      }
    }
  },

  // 无语
  '无语': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 2500,
    description: '无语凝噎',
    bones: {
      neck: {
        neutral: { axis: 'x', amplitude: 0 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        tilt: { axis: 'z', amplitude: 0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        drop: { axis: 'z', amplitude: 0.05 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        drop: { axis: 'z', amplitude: -0.05 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 开心
  '开心': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 2000,
    description: '开心大笑',
    loop: true,
    bones: {
      neck: {
        back: { axis: 'x', amplitude: -0.1, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      head: {
        back: { axis: 'x', amplitude: -0.15, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        happy: { axis: 'z', amplitude: 0.3, frequency: 2 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        happy: { axis: 'z', amplitude: -0.3, frequency: 2 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 认真
  '认真': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 3000,
    description: '认真专注',
    bones: {
      neck: {
        forward: { axis: 'x', amplitude: -0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        forward: { axis: 'x', amplitude: -0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        focus: { axis: 'z', amplitude: 0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        focus: { axis: 'z', amplitude: -0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 委屈
  '委屈': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 2500,
    description: '委屈巴巴',
    bones: {
      neck: {
        down: { axis: 'x', amplitude: 0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        down: { axis: 'x', amplitude: 0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        fidget: { axis: 'z', amplitude: 0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        fidget: { axis: 'z', amplitude: -0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 坏笑
  '坏笑': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 2000,
    description: '坏笑狡黠',
    bones: {
      neck: {
        tilt: { axis: 'z', amplitude: 0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        tilt: { axis: 'z', amplitude: 0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        sly: { axis: 'z', amplitude: 0.25 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        sly: { axis: 'z', amplitude: -0.25 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 震惊
  '震惊': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 1500,
    description: '震惊失色',
    bones: {
      neck: {
        back: { axis: 'x', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_OUT
      },
      head: {
        back: { axis: 'x', amplitude: -0.25 },
        timing: EASING_TYPES.EASE_OUT
      },
      leftUpperArm: {
        shock: { axis: 'x', amplitude: -0.5 },
        timing: EASING_TYPES.EASE_OUT
      },
      rightUpperArm: {
        shock: { axis: 'x', amplitude: -0.5 },
        timing: EASING_TYPES.EASE_OUT
      }
    }
  },

  // 满足
  '满足': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 3000,
    description: '满足惬意',
    loop: true,
    bones: {
      neck: {
        back: { axis: 'x', amplitude: -0.08, frequency: 0.5 },
        timing: EASING_TYPES.SINE
      },
      head: {
        back: { axis: 'x', amplitude: -0.12, frequency: 0.5 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        content: { axis: 'z', amplitude: 0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        content: { axis: 'z', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 嫌弃
  '嫌弃': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 2000,
    description: '嫌弃撇嘴',
    bones: {
      neck: {
        back: { axis: 'x', amplitude: -0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        tilt: { axis: 'z', amplitude: 0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        dismiss: { axis: 'z', amplitude: 0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        dismiss: { axis: 'z', amplitude: -0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 崇拜
  '崇拜': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 2500,
    description: '崇拜星星眼',
    bones: {
      neck: {
        up: { axis: 'x', amplitude: -0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        up: { axis: 'x', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        admire: { axis: 'z', amplitude: 0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        admire: { axis: 'z', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 尴尬
  '尴尬': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 2000,
    description: '尴尬挠头',
    loop: true,
    bones: {
      neck: {
        tilt: { axis: 'z', amplitude: 0.1, frequency: 1 },
        timing: EASING_TYPES.SINE
      },
      head: {
        tilt: { axis: 'z', amplitude: 0.15, frequency: 1 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        scratch: { axis: 'x', amplitude: -0.5, frequency: 1 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 撒娇
  '撒娇': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 2000,
    description: '撒娇卖萌',
    loop: true,
    bones: {
      neck: {
        tilt: { axis: 'z', amplitude: 0.15, frequency: 1.5 },
        timing: EASING_TYPES.SINE
      },
      head: {
        tilt: { axis: 'z', amplitude: 0.2, frequency: 1.5 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        cute: { axis: 'z', amplitude: 0.25, frequency: 1.5 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        cute: { axis: 'z', amplitude: -0.25, frequency: 1.5 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 发呆
  '发呆': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 3000,
    description: '发呆放空',
    loop: true,
    bones: {
      neck: {
        neutral: { axis: 'x', amplitude: 0.05, frequency: 0.3 },
        timing: EASING_TYPES.SINE
      },
      head: {
        drift: { axis: 'y', amplitude: 0.1, frequency: 0.3 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        idle: { axis: 'z', amplitude: 0.05 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        idle: { axis: 'z', amplitude: -0.05 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 痛苦
  '痛苦': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 2000,
    description: '痛苦捂脸',
    bones: {
      neck: {
        down: { axis: 'x', amplitude: 0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        down: { axis: 'x', amplitude: 0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        face: { axis: 'x', amplitude: -0.6 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        face: { axis: 'x', amplitude: -0.6 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 无奈
  '无奈': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 2500,
    description: '无奈摊手',
    bones: {
      neck: {
        tilt: { axis: 'z', amplitude: 0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        tilt: { axis: 'z', amplitude: 0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftShoulder: {
        shrug: { axis: 'z', amplitude: 0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightShoulder: {
        shrug: { axis: 'z', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        spread: { axis: 'z', amplitude: 0.6 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        spread: { axis: 'z', amplitude: -0.6 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 享受
  '享受': {
    type: ACTION_TYPES.EXPRESSION,
    duration: 3000,
    description: '享受放松',
    loop: true,
    bones: {
      neck: {
        back: { axis: 'x', amplitude: -0.1, frequency: 0.5 },
        timing: EASING_TYPES.SINE
      },
      head: {
        back: { axis: 'x', amplitude: -0.15, frequency: 0.5 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        relax: { axis: 'z', amplitude: 0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        relax: { axis: 'z', amplitude: -0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  }
}

// 酷炫动作数据 - 25个
export const coolActionData = {
  // 帅气
  '帅气': {
    type: ACTION_TYPES.COOL,
    duration: 2500,
    description: '帅气pose',
    bones: {
      neck: {
        cool: { axis: 'z', amplitude: 0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        cool: { axis: 'z', amplitude: 0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        pose: { axis: 'z', amplitude: 0.4 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        pose: { axis: 'z', amplitude: -0.4 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 自信
  '自信': {
    type: ACTION_TYPES.COOL,
    duration: 2000,
    description: '自信满满',
    bones: {
      neck: {
        up: { axis: 'x', amplitude: -0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        up: { axis: 'x', amplitude: -0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        confident: { axis: 'z', amplitude: 0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        confident: { axis: 'z', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 霸气
  '霸气': {
    type: ACTION_TYPES.COOL,
    duration: 2500,
    description: '霸气侧漏',
    bones: {
      neck: {
        power: { axis: 'z', amplitude: 0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        power: { axis: 'z', amplitude: 0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftShoulder: {
        wide: { axis: 'z', amplitude: 0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightShoulder: {
        wide: { axis: 'z', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        strong: { axis: 'z', amplitude: 0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        strong: { axis: 'z', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 潇洒
  '潇洒': {
    type: ACTION_TYPES.COOL,
    duration: 3000,
    description: '潇洒自如',
    loop: true,
    bones: {
      neck: {
        free: { axis: 'y', amplitude: 0.1, frequency: 0.8 },
        timing: EASING_TYPES.SINE
      },
      head: {
        free: { axis: 'y', amplitude: 0.15, frequency: 0.8 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        easy: { axis: 'z', amplitude: 0.25, frequency: 0.8 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        easy: { axis: 'z', amplitude: -0.25, frequency: 0.8 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 冷酷
  '冷酷': {
    type: ACTION_TYPES.COOL,
    duration: 3000,
    description: '冷酷无情',
    bones: {
      neck: {
        cold: { axis: 'x', amplitude: -0.05 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        cold: { axis: 'x', amplitude: -0.08 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        still: { axis: 'z', amplitude: 0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        still: { axis: 'z', amplitude: -0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 淡定
  '淡定': {
    type: ACTION_TYPES.COOL,
    duration: 3000,
    description: '淡定从容',
    loop: true,
    bones: {
      neck: {
        calm: { axis: 'x', amplitude: 0.02, frequency: 0.3 },
        timing: EASING_TYPES.SINE
      },
      head: {
        calm: { axis: 'y', amplitude: 0.03, frequency: 0.3 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        steady: { axis: 'z', amplitude: 0.05 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        steady: { axis: 'z', amplitude: -0.05 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 专注
  '专注': {
    type: ACTION_TYPES.COOL,
    duration: 3000,
    description: '专注凝神',
    bones: {
      neck: {
        focus: { axis: 'x', amplitude: -0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        focus: { axis: 'x', amplitude: -0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        ready: { axis: 'z', amplitude: 0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        ready: { axis: 'z', amplitude: -0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 沉着
  '沉着': {
    type: ACTION_TYPES.COOL,
    duration: 2500,
    description: '沉着冷静',
    bones: {
      neck: {
        composed: { axis: 'x', amplitude: -0.05 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        composed: { axis: 'x', amplitude: -0.08 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      spine: {
        straight: { axis: 'x', amplitude: -0.05 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 英勇
  '英勇': {
    type: ACTION_TYPES.COOL,
    duration: 2000,
    description: '英勇无畏',
    bones: {
      neck: {
        brave: { axis: 'x', amplitude: -0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        brave: { axis: 'x', amplitude: -0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        hero: { axis: 'z', amplitude: 0.4 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        hero: { axis: 'z', amplitude: -0.4 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 豪迈
  '豪迈': {
    type: ACTION_TYPES.COOL,
    duration: 2500,
    description: '豪迈奔放',
    bones: {
      neck: {
        bold: { axis: 'z', amplitude: 0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        bold: { axis: 'z', amplitude: 0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftShoulder: {
        open: { axis: 'z', amplitude: 0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightShoulder: {
        open: { axis: 'z', amplitude: -0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 不羁
  '不羁': {
    type: ACTION_TYPES.COOL,
    duration: 3000,
    description: '不羁放纵',
    loop: true,
    bones: {
      neck: {
        wild: { axis: 'z', amplitude: 0.15, frequency: 0.6 },
        timing: EASING_TYPES.SINE
      },
      head: {
        wild: { axis: 'y', amplitude: 0.2, frequency: 0.6 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        free: { axis: 'z', amplitude: 0.3, frequency: 0.6 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        free: { axis: 'z', amplitude: -0.3, frequency: 0.6 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 神秘
  '神秘': {
    type: ACTION_TYPES.COOL,
    duration: 3000,
    description: '神秘莫测',
    loop: true,
    bones: {
      neck: {
        mystery: { axis: 'y', amplitude: 0.1, frequency: 0.4 },
        timing: EASING_TYPES.SINE
      },
      head: {
        mystery: { axis: 'z', amplitude: 0.08, frequency: 0.4 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        hidden: { axis: 'z', amplitude: 0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        hidden: { axis: 'z', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 高贵
  '高贵': {
    type: ACTION_TYPES.COOL,
    duration: 3000,
    description: '高贵优雅',
    bones: {
      neck: {
        noble: { axis: 'x', amplitude: -0.08 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        noble: { axis: 'x', amplitude: -0.12 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      spine: {
        elegant: { axis: 'x', amplitude: -0.05 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        grace: { axis: 'z', amplitude: 0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        grace: { axis: 'z', amplitude: -0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 孤傲
  '孤傲': {
    type: ACTION_TYPES.COOL,
    duration: 3000,
    description: '孤傲冷艳',
    bones: {
      neck: {
        proud: { axis: 'x', amplitude: -0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        proud: { axis: 'z', amplitude: 0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        aloof: { axis: 'z', amplitude: 0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        aloof: { axis: 'z', amplitude: -0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 犀利
  '犀利': {
    type: ACTION_TYPES.COOL,
    duration: 2000,
    description: '犀利眼神',
    bones: {
      neck: {
        sharp: { axis: 'x', amplitude: -0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        sharp: { axis: 'x', amplitude: -0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        keen: { axis: 'z', amplitude: 0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        keen: { axis: 'z', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 沉稳
  '沉稳': {
    type: ACTION_TYPES.COOL,
    duration: 3000,
    description: '沉稳大气',
    bones: {
      neck: {
        steady: { axis: 'x', amplitude: -0.05 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        steady: { axis: 'x', amplitude: -0.08 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      spine: {
        grounded: { axis: 'x', amplitude: 0.02 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 威严
  '威严': {
    type: ACTION_TYPES.COOL,
    duration: 2500,
    description: '威严霸气',
    bones: {
      neck: {
        majestic: { axis: 'x', amplitude: -0.08 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        majestic: { axis: 'x', amplitude: -0.12 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftShoulder: {
        wide: { axis: 'z', amplitude: 0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightShoulder: {
        wide: { axis: 'z', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 从容
  '从容': {
    type: ACTION_TYPES.COOL,
    duration: 3000,
    description: '从容不迫',
    loop: true,
    bones: {
      neck: {
        ease: { axis: 'y', amplitude: 0.05, frequency: 0.4 },
        timing: EASING_TYPES.SINE
      },
      head: {
        ease: { axis: 'z', amplitude: 0.03, frequency: 0.4 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        relaxed: { axis: 'z', amplitude: 0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        relaxed: { axis: 'z', amplitude: -0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 坚定
  '坚定': {
    type: ACTION_TYPES.COOL,
    duration: 2000,
    description: '坚定不移',
    bones: {
      neck: {
        firm: { axis: 'x', amplitude: -0.05 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        firm: { axis: 'x', amplitude: -0.08 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        strong: { axis: 'z', amplitude: 0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        strong: { axis: 'z', amplitude: -0.15 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 睿智
  '睿智': {
    type: ACTION_TYPES.COOL,
    duration: 3000,
    description: '睿智深沉',
    bones: {
      neck: {
        wise: { axis: 'x', amplitude: -0.08 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        wise: { axis: 'z', amplitude: 0.05 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        think: { axis: 'z', amplitude: 0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        think: { axis: 'z', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 洒脱
  '洒脱': {
    type: ACTION_TYPES.COOL,
    duration: 3000,
    description: '洒脱随性',
    loop: true,
    bones: {
      neck: {
        free: { axis: 'z', amplitude: 0.1, frequency: 0.5 },
        timing: EASING_TYPES.SINE
      },
      head: {
        free: { axis: 'y', amplitude: 0.08, frequency: 0.5 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        casual: { axis: 'z', amplitude: 0.2, frequency: 0.5 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        casual: { axis: 'z', amplitude: -0.2, frequency: 0.5 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 超然
  '超然': {
    type: ACTION_TYPES.COOL,
    duration: 3000,
    description: '超然物外',
    bones: {
      neck: {
        detached: { axis: 'x', amplitude: -0.05 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      head: {
        detached: { axis: 'y', amplitude: 0.03 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      leftUpperArm: {
        beyond: { axis: 'z', amplitude: 0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        beyond: { axis: 'z', amplitude: -0.1 },
        timing: EASING_TYPES.EASE_IN_OUT
      }
    }
  },

  // 淡定
  '淡定': {
    type: ACTION_TYPES.COOL,
    duration: 3000,
    description: '淡定自若',
    loop: true,
    bones: {
      neck: {
        calm: { axis: 'x', amplitude: 0.02, frequency: 0.3 },
        timing: EASING_TYPES.SINE
      },
      head: {
        calm: { axis: 'z', amplitude: 0.02, frequency: 0.3 },
        timing: EASING_TYPES.SINE
      },
      spine: {
        steady: { axis: 'x', amplitude: 0.01, frequency: 0.3 },
        timing: EASING_TYPES.SINE
      }
    }
  }
}

// 特殊动作数据 - 15个
export const specialActionData = {
  // 变身
  '变身': {
    type: ACTION_TYPES.SPECIAL,
    duration: 3000,
    description: '华丽变身',
    bones: {
      hips: {
        transform: { axis: 'y', amplitude: 0.3 },
        timing: EASING_TYPES.ELASTIC
      },
      spine: {
        power: { axis: 'x', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_OUT
      },
      leftUpperArm: {
        rise: { axis: 'x', amplitude: -0.6 },
        timing: EASING_TYPES.EASE_OUT
      },
      rightUpperArm: {
        rise: { axis: 'x', amplitude: -0.6 },
        timing: EASING_TYPES.EASE_OUT
      }
    }
  },

  // 瞬移
  '瞬移': {
    type: ACTION_TYPES.SPECIAL,
    duration: 1000,
    description: '瞬间移动',
    bones: {
      hips: {
        teleport: { axis: 'y', amplitude: 0.2 },
        timing: EASING_TYPES.EASE_IN
      },
      leftUpperArm: {
        blur: { axis: 'z', amplitude: 0.5 },
        timing: EASING_TYPES.EASE_IN
      },
      rightUpperArm: {
        blur: { axis: 'z', amplitude: -0.5 },
        timing: EASING_TYPES.EASE_IN
      }
    }
  },

  // 飞行
  '飞行': {
    type: ACTION_TYPES.SPECIAL,
    duration: 3000,
    description: '腾空飞行',
    loop: true,
    bones: {
      hips: {
        fly: { axis: 'y', amplitude: 0.5, frequency: 1 },
        timing: EASING_TYPES.SINE
      },
      spine: {
        soar: { axis: 'x', amplitude: -0.15, frequency: 1 },
        timing: EASING_TYPES.SINE
      },
      leftUpperArm: {
        wings: { axis: 'z', amplitude: 0.6, frequency: 1 },
        timing: EASING_TYPES.SINE
      },
      rightUpperArm: {
        wings: { axis: 'z', amplitude: -0.6, frequency: 1 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 隐身
  '隐身': {
    type: ACTION_TYPES.SPECIAL,
    duration: 2000,
    description: '隐身消失',
    bones: {
      hips: {
        fade: { axis: 'y', amplitude: 0.1 },
        timing: EASING_TYPES.EASE_IN
      },
      leftUpperArm: {
        vanish: { axis: 'z', amplitude: 0.3 },
        timing: EASING_TYPES.EASE_IN
      },
      rightUpperArm: {
        vanish: { axis: 'z', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_IN
      }
    }
  },

  // 分身
  '分身': {
    type: ACTION_TYPES.SPECIAL,
    duration: 2500,
    description: '分身术',
    bones: {
      hips: {
        clone: { axis: 'y', amplitude: 0.15 },
        timing: EASING_TYPES.ELASTIC
      },
      leftUpperArm: {
        multiply: { axis: 'z', amplitude: 0.4 },
        timing: EASING_TYPES.ELASTIC
      },
      rightUpperArm: {
        multiply: { axis: 'z', amplitude: -0.4 },
        timing: EASING_TYPES.ELASTIC
      }
    }
  },

  // 变大
  '变大': {
    type: ACTION_TYPES.SPECIAL,
    duration: 2000,
    description: '巨大化',
    bones: {
      hips: {
        grow: { axis: 'y', amplitude: 0.3 },
        timing: EASING_TYPES.ELASTIC
      },
      spine: {
        expand: { axis: 'x', amplitude: -0.1 },
        timing: EASING_TYPES.EASE_OUT
      },
      leftUpperArm: {
        giant: { axis: 'z', amplitude: 0.5 },
        timing: EASING_TYPES.ELASTIC
      },
      rightUpperArm: {
        giant: { axis: 'z', amplitude: -0.5 },
        timing: EASING_TYPES.ELASTIC
      }
    }
  },

  // 变小
  '变小': {
    type: ACTION_TYPES.SPECIAL,
    duration: 2000,
    description: '缩小化',
    bones: {
      hips: {
        shrink: { axis: 'y', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_IN
      },
      spine: {
        compress: { axis: 'x', amplitude: 0.1 },
        timing: EASING_TYPES.EASE_IN
      },
      leftUpperArm: {
        tiny: { axis: 'z', amplitude: 0.2 },
        timing: EASING_TYPES.EASE_IN
      },
      rightUpperArm: {
        tiny: { axis: 'z', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_IN
      }
    }
  },

  // 召唤
  '召唤': {
    type: ACTION_TYPES.SPECIAL,
    duration: 3000,
    description: '召唤魔法',
    bones: {
      leftShoulder: {
        summon: { axis: 'z', amplitude: 0.3 },
        timing: EASING_TYPES.EASE_OUT
      },
      rightShoulder: {
        summon: { axis: 'z', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_OUT
      },
      leftUpperArm: {
        cast: { axis: 'x', amplitude: -0.8 },
        timing: EASING_TYPES.EASE_OUT
      },
      rightUpperArm: {
        cast: { axis: 'x', amplitude: -0.8 },
        timing: EASING_TYPES.EASE_OUT
      },
      leftLowerArm: {
        magic: { axis: 'x', amplitude: -0.5 },
        timing: EASING_TYPES.EASE_OUT
      },
      rightLowerArm: {
        magic: { axis: 'x', amplitude: -0.5 },
        timing: EASING_TYPES.EASE_OUT
      }
    }
  },

  // 魔法
  '魔法': {
    type: ACTION_TYPES.SPECIAL,
    duration: 2500,
    description: '施放魔法',
    loop: true,
    bones: {
      rightShoulder: {
        magic: { axis: 'z', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        spell: { axis: 'x', amplitude: -0.6 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightLowerArm: {
        wand: { axis: 'y', amplitude: 0.3, frequency: 3 },
        timing: EASING_TYPES.SINE
      },
      rightHand: {
        cast: { axis: 'z', amplitude: 0.2, frequency: 3 },
        timing: EASING_TYPES.SINE
      }
    }
  },

  // 超能力
  '超能力': {
    type: ACTION_TYPES.SPECIAL,
    duration: 3000,
    description: '释放超能力',
    bones: {
      neck: {
        power: { axis: 'x', amplitude: -0.1 },
        timing: EASING_TYPES.EASE_OUT
      },
      head: {
        power: { axis: 'x', amplitude: -0.15 },
        timing: EASING_TYPES.EASE_OUT
      },
      leftUpperArm: {
        psychic: { axis: 'z', amplitude: 0.5 },
        timing: EASING_TYPES.EASE_OUT
      },
      rightUpperArm: {
        psychic: { axis: 'z', amplitude: -0.5 },
        timing: EASING_TYPES.EASE_OUT
      }
    }
  },

  // 剑气
  '剑气': {
    type: ACTION_TYPES.SPECIAL,
    duration: 2000,
    description: '挥出剑气',
    bones: {
      rightShoulder: {
        sword: { axis: 'z', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_IN_OUT
      },
      rightUpperArm: {
        slash: { axis: 'x', amplitude: -0.7 },
        timing: EASING_TYPES.EASE_OUT
      },
      rightLowerArm: {
        blade: { axis: 'z', amplitude: -0.5 },
        timing: EASING_TYPES.EASE_OUT
      },
      spine: {
        twist: { axis: 'y', amplitude: 0.3 },
        timing: EASING_TYPES.EASE_OUT
      }
    }
  },

  // 拳风
  '拳风': {
    type: ACTION_TYPES.SPECIAL,
    duration: 1500,
    description: '打出拳风',
    bones: {
      rightShoulder: {
        punch: { axis: 'z', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_IN
      },
      rightUpperArm: {
        strike: { axis: 'x', amplitude: -0.8 },
        timing: EASING_TYPES.EASE_OUT
      },
      rightLowerArm: {
        fist: { axis: 'x', amplitude: -0.3 },
        timing: EASING_TYPES.EASE_OUT
      },
      spine: {
        power: { axis: 'x', amplitude: -0.1 },
        timing: EASING_TYPES.EASE_OUT
      }
    }
  },

  // 必杀技
  '必杀技': {
    type: ACTION_TYPES.SPECIAL,
    duration: 3000,
    description: '释放必杀技',
    bones: {
      hips: {
        ultimate: { axis: 'y', amplitude: 0.2 },
        timing: EASING_TYPES.EASE_OUT
      },
      spine: {
        charge: { axis: 'x', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_OUT
      },
      leftUpperArm: {
        final: { axis: 'z', amplitude: 0.6 },
        timing: EASING_TYPES.EASE_OUT
      },
      rightUpperArm: {
        final: { axis: 'z', amplitude: -0.6 },
        timing: EASING_TYPES.EASE_OUT
      }
    }
  },

  // 觉醒
  '觉醒': {
    type: ACTION_TYPES.SPECIAL,
    duration: 3000,
    description: '力量觉醒',
    bones: {
      neck: {
        awaken: { axis: 'x', amplitude: -0.15 },
        timing: EASING_TYPES.EASE_OUT
      },
      head: {
        awaken: { axis: 'x', amplitude: -0.2 },
        timing: EASING_TYPES.EASE_OUT
      },
      spine: {
        power: { axis: 'x', amplitude: -0.15 },
        timing: EASING_TYPES.EASE_OUT
      },
      leftUpperArm: {
        surge: { axis: 'z', amplitude: 0.5 },
        timing: EASING_TYPES.EASE_OUT
      },
      rightUpperArm: {
        surge: { axis: 'z', amplitude: -0.5 },
        timing: EASING_TYPES.EASE_OUT
      }
    }
  },

  // 进化
  '进化': {
    type: ACTION_TYPES.SPECIAL,
    duration: 4000,
    description: '形态进化',
    bones: {
      hips: {
        evolve: { axis: 'y', amplitude: 0.4 },
        timing: EASING_TYPES.ELASTIC
      },
      spine: {
        transform: { axis: 'x', amplitude: -0.2 },
        timing: EASING_TYPES.ELASTIC
      },
      leftUpperArm: {
        metamorph: { axis: 'z', amplitude: 0.6 },
        timing: EASING_TYPES.ELASTIC
      },
      rightUpperArm: {
        metamorph: { axis: 'z', amplitude: -0.6 },
        timing: EASING_TYPES.ELASTIC
      }
    }
  }
}

// 导出所有扩展动作名称
export const expressionActionNames = Object.keys(expressionActionData)
export const coolActionNames = Object.keys(coolActionData)
export const specialActionNames = Object.keys(specialActionData)

// 合并所有扩展动作数据
export const extendedActionData = {
  ...expressionActionData,
  ...coolActionData,
  ...specialActionData
}

// 获取扩展动作数据
export function getExtendedActionData(actionName) {
  return extendedActionData[actionName] || null
}

export default {
  expressionActionData,
  coolActionData,
  specialActionData,
  expressionActionNames,
  coolActionNames,
  specialActionNames,
  extendedActionData,
  getExtendedActionData
}
