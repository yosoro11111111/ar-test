// 动作动画数据 - 简化版本
// 用于 CharacterSystem 的姿势库

export const poseLibrary = {
  idle: {
    name: '待机',
    boneRotations: {
      spine: { x: 0, y: 0, z: 0 },
      leftUpperArm: { x: 0, y: 0, z: 0.2 },
      rightUpperArm: { x: 0, y: 0, z: -0.2 },
      leftLowerArm: { x: 0.1, y: 0, z: 0 },
      rightLowerArm: { x: 0.1, y: 0, z: 0 }
    }
  },
  stand: {
    name: '站立',
    boneRotations: {
      spine: { x: 0, y: 0, z: 0 },
      leftUpperArm: { x: 0, y: 0, z: 0 },
      rightUpperArm: { x: 0, y: 0, z: 0 },
      leftLowerArm: { x: 0, y: 0, z: 0 },
      rightLowerArm: { x: 0, y: 0, z: 0 }
    }
  },
  wave: {
    name: '挥手',
    boneRotations: {
      rightUpperArm: { x: 0, y: 0, z: -1.5 },
      rightLowerArm: { x: 0, y: 0, z: -0.5 }
    }
  }
}

export const getActionAnimation = (actionId) => {
  return poseLibrary[actionId] || poseLibrary.idle
}

export const easingFunctions = {
  linear: t => t,
  easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeOut: t => t * (2 - t),
  easeIn: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInQuad: t => t * t,
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  smoothstep: t => t * t * (3 - 2 * t)
}

export const actionAnimations250 = []

export default {
  poseLibrary,
  getActionAnimation,
  easingFunctions,
  actionAnimations250
}
