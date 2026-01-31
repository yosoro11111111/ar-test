// 姿势库 - 包含所有200+动作所需的姿势定义
// 这个文件包含所有骨骼姿势数据，供动作系统使用

export const poseLibrary = {
  // ========== 基础姿势 ==========
  idle: {
    hips: { x: 0, y: 0, z: 0 },
    spine: { x: 0.02, y: 0, z: 0 },
    chest: { x: 0.03, y: 0, z: 0 },
    neck: { x: 0.02, y: 0, z: 0 },
    head: { x: 0.05, y: 0, z: 0 },
    leftShoulder: { x: 0, y: 0, z: 0 },
    rightShoulder: { x: 0, y: 0, z: 0 },
    leftUpperArm: { x: 0.1, y: 0, z: 0.15 },
    rightUpperArm: { x: 0.1, y: 0, z: -0.15 },
    leftLowerArm: { x: 0.15, y: 0, z: 0 },
    rightLowerArm: { x: 0.15, y: 0, z: 0 },
    leftHand: { x: 0, y: 0, z: 0 },
    rightHand: { x: 0, y: 0, z: 0 },
    leftUpperLeg: { x: -0.05, y: 0, z: 0 },
    rightUpperLeg: { x: -0.05, y: 0, z: 0 },
    leftLowerLeg: { x: 0.1, y: 0, z: 0 },
    rightLowerLeg: { x: 0.1, y: 0, z: 0 },
    leftFoot: { x: 0.05, y: 0, z: 0 },
    rightFoot: { x: 0.05, y: 0, z: 0 }
  },

  // 呼吸姿势
  idleBreathe1: {
    spine: { x: 0.05, y: 0, z: 0 },
    chest: { x: 0.08, y: 0, z: 0 },
    head: { x: -0.02, y: 0, z: 0 }
  },

  // ========== 行走姿势 ==========
  walk1: {
    leftUpperLeg: { x: -0.25, y: 0, z: 0 },
    rightUpperLeg: { x: 0.25, y: 0, z: 0 },
    leftLowerLeg: { x: 0.1, y: 0, z: 0 },
    rightLowerLeg: { x: 0.3, y: 0, z: 0 },
    spine: { x: 0.03, y: 0, z: 0 }
  },
  walk2: {
    leftUpperLeg: { x: 0.25, y: 0, z: 0 },
    rightUpperLeg: { x: -0.25, y: 0, z: 0 },
    leftLowerLeg: { x: 0.3, y: 0, z: 0 },
    rightLowerLeg: { x: 0.1, y: 0, z: 0 },
    spine: { x: 0.03, y: 0, z: 0 }
  },
  walk3: {
    leftUpperLeg: { x: 0.25, y: 0, z: 0 },
    rightUpperLeg: { x: -0.25, y: 0, z: 0 },
    leftLowerLeg: { x: 0.3, y: 0, z: 0 },
    rightLowerLeg: { x: 0.1, y: 0, z: 0 },
    spine: { x: 0.03, y: 0, z: 0 }
  },
  walk4: {
    leftUpperLeg: { x: -0.25, y: 0, z: 0 },
    rightUpperLeg: { x: 0.25, y: 0, z: 0 },
    leftLowerLeg: { x: 0.1, y: 0, z: 0 },
    rightLowerLeg: { x: 0.3, y: 0, z: 0 },
    spine: { x: 0.03, y: 0, z: 0 }
  },

  // ========== 奔跑姿势 ==========
  run1: {
    leftUpperLeg: { x: -0.6, y: 0, z: 0 },
    rightUpperLeg: { x: 0.6, y: 0, z: 0 },
    leftLowerLeg: { x: 0.8, y: 0, z: 0 },
    rightLowerLeg: { x: 0.2, y: 0, z: 0 },
    leftUpperArm: { x: -0.8, y: 0, z: 0.3 },
    rightUpperArm: { x: 0.8, y: 0, z: -0.3 },
    spine: { x: 0.1, y: 0, z: 0 }
  },
  run2: {
    leftUpperLeg: { x: -0.3, y: 0, z: 0 },
    rightUpperLeg: { x: 0.3, y: 0, z: 0 },
    leftLowerLeg: { x: 0.5, y: 0, z: 0 },
    rightLowerLeg: { x: 0.5, y: 0, z: 0 },
    leftUpperArm: { x: -0.4, y: 0, z: 0.3 },
    rightUpperArm: { x: 0.4, y: 0, z: -0.3 },
    spine: { x: 0.05, y: 0, z: 0 }
  },
  run3: {
    leftUpperLeg: { x: 0.6, y: 0, z: 0 },
    rightUpperLeg: { x: -0.6, y: 0, z: 0 },
    leftLowerLeg: { x: 0.2, y: 0, z: 0 },
    rightLowerLeg: { x: 0.8, y: 0, z: 0 },
    leftUpperArm: { x: 0.8, y: 0, z: 0.3 },
    rightUpperArm: { x: -0.8, y: 0, z: -0.3 },
    spine: { x: 0.1, y: 0, z: 0 }
  },
  run4: {
    leftUpperLeg: { x: 0.3, y: 0, z: 0 },
    rightUpperLeg: { x: -0.3, y: 0, z: 0 },
    leftLowerLeg: { x: 0.5, y: 0, z: 0 },
    rightLowerLeg: { x: 0.5, y: 0, z: 0 },
    leftUpperArm: { x: 0.4, y: 0, z: 0.3 },
    rightUpperArm: { x: -0.4, y: 0, z: -0.3 },
    spine: { x: 0.05, y: 0, z: 0 }
  },

  // ========== 跳跃姿势 ==========
  crouchDeep: {
    hips: { x: 0, y: -0.5, z: 0 },
    leftUpperLeg: { x: -1.2, y: 0, z: 0 },
    rightUpperLeg: { x: -1.2, y: 0, z: 0 },
    leftLowerLeg: { x: 1.5, y: 0, z: 0 },
    rightLowerLeg: { x: 1.5, y: 0, z: 0 },
    spine: { x: 0.3, y: 0, z: 0 }
  },
  jumpUp: {
    hips: { x: 0, y: 0.5, z: 0 },
    leftUpperLeg: { x: -0.4, y: 0, z: 0 },
    rightUpperLeg: { x: -0.4, y: 0, z: 0 },
    leftLowerLeg: { x: 0.8, y: 0, z: 0 },
    rightLowerLeg: { x: 0.8, y: 0, z: 0 },
    leftUpperArm: { x: -2.0, y: 0, z: 0.5 },
    rightUpperArm: { x: -2.0, y: 0, z: -0.5 },
    spine: { x: -0.1, y: 0, z: 0 }
  },
  airPose: {
    hips: { x: 0, y: 0.8, z: 0 },
    leftUpperLeg: { x: -0.2, y: 0, z: 0 },
    rightUpperLeg: { x: -0.2, y: 0, z: 0 },
    leftLowerLeg: { x: 0.4, y: 0, z: 0 },
    rightLowerLeg: { x: 0.4, y: 0, z: 0 },
    leftUpperArm: { x: -1.5, y: 0, z: 0.8 },
    rightUpperArm: { x: -1.5, y: 0, z: -0.8 },
    spine: { x: -0.05, y: 0, z: 0 }
  },
  fallDown: {
    hips: { x: 0, y: 0.3, z: 0 },
    leftUpperLeg: { x: -0.1, y: 0, z: 0 },
    rightUpperLeg: { x: -0.1, y: 0, z: 0 },
    leftLowerLeg: { x: 0.2, y: 0, z: 0 },
    rightLowerLeg: { x: 0.2, y: 0, z: 0 },
    leftUpperArm: { x: -0.5, y: 0, z: 0.3 },
    rightUpperArm: { x: -0.5, y: 0, z: -0.3 },
    spine: { x: 0.05, y: 0, z: 0 }
  },
  land: {
    hips: { x: 0, y: -0.2, z: 0 },
    leftUpperLeg: { x: -0.6, y: 0, z: 0 },
    rightUpperLeg: { x: -0.6, y: 0, z: 0 },
    leftLowerLeg: { x: 1.0, y: 0, z: 0 },
    rightLowerLeg: { x: 1.0, y: 0, z: 0 },
    leftUpperArm: { x: -0.3, y: 0, z: 0.5 },
    rightUpperArm: { x: -0.3, y: 0, z: -0.5 },
    spine: { x: 0.2, y: 0, z: 0 }
  },

  // ========== 坐姿 ==========
  sitPose: {
    hips: { x: -0.3, y: 0, z: 0 },
    spine: { x: 0.1, y: 0, z: 0 },
    chest: { x: 0.05, y: 0, z: 0 },
    neck: { x: 0.03, y: 0, z: 0 },
    head: { x: 0.05, y: 0, z: 0 },
    leftShoulder: { x: 0, y: 0, z: 0 },
    rightShoulder: { x: 0, y: 0, z: 0 },
    leftUpperArm: { x: 0.05, y: 0, z: 0.1 },
    rightUpperArm: { x: 0.05, y: 0, z: -0.1 },
    leftLowerArm: { x: 0.25, y: 0, z: 0 },
    rightLowerArm: { x: 0.25, y: 0, z: 0 },
    leftHand: { x: 0, y: 0, z: 0 },
    rightHand: { x: 0, y: 0, z: 0 },
    leftUpperLeg: { x: -1.2, y: 0, z: 0 },
    rightUpperLeg: { x: -1.2, y: 0, z: 0 },
    leftLowerLeg: { x: 0, y: 0, z: 0 },
    rightLowerLeg: { x: 0, y: 0, z: 0 },
    leftFoot: { x: 0, y: 0, z: 0 },
    rightFoot: { x: 0, y: 0, z: 0 }
  },
  sitRelax: {
    hips: { x: -0.4, y: 0, z: 0 },
    spine: { x: 0.15, y: 0, z: 0 },
    chest: { x: 0.08, y: 0, z: 0 },
    leftUpperLeg: { x: -1.3, y: 0, z: 0 },
    rightUpperLeg: { x: -1.3, y: 0, z: 0 },
    leftLowerLeg: { x: 0.2, y: 0, z: 0 },
    rightLowerLeg: { x: 0.2, y: 0, z: 0 },
    leftUpperArm: { x: 0.1, y: 0, z: 0.2 },
    rightUpperArm: { x: 0.1, y: 0, z: -0.2 }
  },

  // ========== 躺姿 ==========
  liePose: {
    hips: { x: -1.57, y: 0, z: 0 },
    spine: { x: 0, y: 0, z: 0 },
    leftUpperLeg: { x: -0.1, y: 0, z: 0 },
    rightUpperLeg: { x: -0.1, y: 0, z: 0 },
    leftLowerLeg: { x: 0.1, y: 0, z: 0 },
    rightLowerLeg: { x: 0.1, y: 0, z: 0 },
    leftUpperArm: { x: 0, y: 0, z: 0.3 },
    rightUpperArm: { x: 0, y: 0, z: -0.3 }
  },
  lieRelax: {
    hips: { x: -1.57, y: 0, z: 0 },
    spine: { x: 0.05, y: 0, z: 0 },
    leftUpperLeg: { x: -0.2, y: 0, z: 0.1 },
    rightUpperLeg: { x: -0.2, y: 0, z: -0.1 },
    leftLowerLeg: { x: 0.2, y: 0, z: 0 },
    rightLowerLeg: { x: 0.2, y: 0, z: 0 },
    leftUpperArm: { x: 0.1, y: 0, z: 0.4 },
    rightUpperArm: { x: 0.1, y: 0, z: -0.4 }
  },

  // ========== 立正姿势 ==========
  standAttention: {
    hips: { x: 0, y: 0, z: 0 },
    spine: { x: 0, y: 0, z: 0 },
    chest: { x: 0, y: 0, z: 0 },
    leftUpperArm: { x: 0, y: 0, z: 0.1 },
    rightUpperArm: { x: 0, y: 0, z: -0.1 },
    leftLowerArm: { x: 0, y: 0, z: 0 },
    rightLowerArm: { x: 0, y: 0, z: 0 },
    leftUpperLeg: { x: 0, y: 0, z: 0 },
    rightUpperLeg: { x: 0, y: 0, z: 0 }
  },
  standAttentionBreathe: {
    hips: { x: 0, y: 0.02, z: 0 },
    spine: { x: 0.02, y: 0, z: 0 },
    chest: { x: 0.05, y: 0, z: 0 }
  },

  // ========== 蹲伏姿势 ==========
  crouchPose: {
    hips: { x: 0.4, y: -0.3, z: 0 },
    leftUpperLeg: { x: -1.0, y: 0, z: 0 },
    rightUpperLeg: { x: -1.0, y: 0, z: 0 },
    leftLowerLeg: { x: 1.3, y: 0, z: 0 },
    rightLowerLeg: { x: 1.3, y: 0, z: 0 },
    spine: { x: 0.15, y: 0, z: 0 }
  },
  crouchLookLeft: {
    hips: { x: 0.4, y: -0.3, z: 0 },
    spine: { x: 0.15, y: 0.3, z: 0 },
    head: { x: 0, y: 0.4, z: 0 },
    leftUpperLeg: { x: -1.0, y: 0, z: 0 },
    rightUpperLeg: { x: -1.0, y: 0, z: 0 },
    leftLowerLeg: { x: 1.3, y: 0, z: 0 },
    rightLowerLeg: { x: 1.3, y: 0, z: 0 }
  },
  crouchLookRight: {
    hips: { x: 0.4, y: -0.3, z: 0 },
    spine: { x: 0.15, y: -0.3, z: 0 },
    head: { x: 0, y: -0.4, z: 0 },
    leftUpperLeg: { x: -1.0, y: 0, z: 0 },
    rightUpperLeg: { x: -1.0, y: 0, z: 0 },
    leftLowerLeg: { x: 1.3, y: 0, z: 0 },
    rightLowerLeg: { x: 1.3, y: 0, z: 0 }
  },

  // ========== 爬行姿势 ==========
  crawl1: {
    hips: { x: 0.5, y: -0.4, z: 0 },
    leftUpperArm: { x: -0.5, y: 0, z: 0.5 },
    rightUpperArm: { x: -0.2, y: 0, z: -0.3 },
    leftLowerArm: { x: -0.8, y: 0, z: 0 },
    rightLowerArm: { x: -0.3, y: 0, z: 0 },
    leftUpperLeg: { x: -0.8, y: 0, z: 0 },
    rightUpperLeg: { x: -0.5, y: 0, z: 0 },
    leftLowerLeg: { x: 1.2, y: 0, z: 0 },
    rightLowerLeg: { x: 1.0, y: 0, z: 0 },
    spine: { x: 0.1, y: 0, z: 0 }
  },
  crawl2: {
    hips: { x: 0.5, y: -0.4, z: 0 },
    leftUpperArm: { x: -0.3, y: 0, z: 0.3 },
    rightUpperArm: { x: -0.5, y: 0, z: -0.5 },
    leftLowerArm: { x: -0.3, y: 0, z: 0 },
    rightLowerArm: { x: -0.8, y: 0, z: 0 },
    leftUpperLeg: { x: -0.5, y: 0, z: 0 },
    rightUpperLeg: { x: -0.8, y: 0, z: 0 },
    leftLowerLeg: { x: 1.0, y: 0, z: 0 },
    rightLowerLeg: { x: 1.2, y: 0, z: 0 },
    spine: { x: 0.1, y: 0, z: 0 }
  },
  crawl3: {
    hips: { x: 0.5, y: -0.4, z: 0 },
    leftUpperArm: { x: -0.2, y: 0, z: 0.3 },
    rightUpperArm: { x: -0.3, y: 0, z: -0.3 },
    leftLowerArm: { x: -0.3, y: 0, z: 0 },
    rightLowerArm: { x: -0.3, y: 0, z: 0 },
    leftUpperLeg: { x: -0.6, y: 0, z: 0 },
    rightUpperLeg: { x: -0.6, y: 0, z: 0 },
    leftLowerLeg: { x: 1.1, y: 0, z: 0 },
    rightLowerLeg: { x: 1.1, y: 0, z: 0 },
    spine: { x: 0.1, y: 0, z: 0 }
  },
  crawl4: {
    hips: { x: 0.5, y: -0.4, z: 0 },
    leftUpperArm: { x: -0.4, y: 0, z: 0.4 },
    rightUpperArm: { x: -0.4, y: 0, z: -0.4 },
    leftLowerArm: { x: -0.5, y: 0, z: 0 },
    rightLowerArm: { x: -0.5, y: 0, z: 0 },
    leftUpperLeg: { x: -0.7, y: 0, z: 0 },
    rightUpperLeg: { x: -0.7, y: 0, z: 0 },
    leftLowerLeg: { x: 1.15, y: 0, z: 0 },
    rightLowerLeg: { x: 1.15, y: 0, z: 0 },
    spine: { x: 0.1, y: 0, z: 0 }
  },

  // ========== 攀爬姿势 ==========
  climb1: {
    leftUpperArm: { x: -1.8, y: 0, z: 0.3 },
    rightUpperArm: { x: -1.2, y: 0, z: -0.3 },
    leftLowerArm: { x: -0.5, y: 0, z: 0 },
    rightLowerArm: { x: -0.3, y: 0, z: 0 },
    leftUpperLeg: { x: -0.8, y: 0, z: 0 },
    rightUpperLeg: { x: -0.5, y: 0, z: 0 },
    leftLowerLeg: { x: 1.0, y: 0, z: 0 },
    rightLowerLeg: { x: 0.8, y: 0, z: 0 },
    spine: { x: 0.1, y: 0, z: 0 }
  },
  climb2: {
    leftUpperArm: { x: -1.5, y: 0, z: 0.3 },
    rightUpperArm: { x: -1.5, y: 0, z: -0.3 },
    leftLowerArm: { x: -0.4, y: 0, z: 0 },
    rightLowerArm: { x: -0.4, y: 0, z: 0 },
    leftUpperLeg: { x: -0.6, y: 0, z: 0 },
    rightUpperLeg: { x: -0.6, y: 0, z: 0 },
    leftLowerLeg: { x: 0.9, y: 0, z: 0 },
    rightLowerLeg: { x: 0.9, y: 0, z: 0 },
    spine: { x: 0.05, y: 0, z: 0 }
  },
  climb3: {
    leftUpperArm: { x: -1.2, y: 0, z: 0.3 },
    rightUpperArm: { x: -1.8, y: 0, z: -0.3 },
    leftLowerArm: { x: -0.3, y: 0, z: 0 },
    rightLowerArm: { x: -0.5, y: 0, z: 0 },
    leftUpperLeg: { x: -0.5, y: 0, z: 0 },
    rightUpperLeg: { x: -0.8, y: 0, z: 0 },
    leftLowerLeg: { x: 0.8, y: 0, z: 0 },
    rightLowerLeg: { x: 1.0, y: 0, z: 0 },
    spine: { x: 0.1, y: 0, z: 0 }
  },
  climb4: {
    leftUpperArm: { x: -1.5, y: 0, z: 0.3 },
    rightUpperArm: { x: -1.5, y: 0, z: -0.3 },
    leftLowerArm: { x: -0.4, y: 0, z: 0 },
    rightLowerArm: { x: -0.4, y: 0, z: 0 },
    leftUpperLeg: { x: -0.6, y: 0, z: 0 },
    rightUpperLeg: { x: -0.6, y: 0, z: 0 },
    leftLowerLeg: { x: 0.9, y: 0, z: 0 },
    rightLowerLeg: { x: 0.9, y: 0, z: 0 },
    spine: { x: 0.05, y: 0, z: 0 }
  },

  // ========== 游泳姿势 ==========
  swim1: {
    leftUpperArm: { x: -2.2, y: 0, z: 0.8 },
    rightUpperArm: { x: -0.5, y: 0, z: -0.3 },
    leftLowerArm: { x: -0.2, y: 0, z: 0 },
    rightLowerArm: { x: -0.8, y: 0, z: 0 },
    leftUpperLeg: { x: -0.2, y: 0, z: 0.3 },
    rightUpperLeg: { x: -0.1, y: 0, z: 0 },
    leftLowerLeg: { x: 0.2, y: 0, z: 0 },
    rightLowerLeg: { x: 0.1, y: 0, z: 0 },
    spine: { x: -0.3, y: 0, z: 0 },
    head: { x: -0.4, y: 0, z: 0 }
  },
  swim2: {
    leftUpperArm: { x: -1.5, y: 0, z: 0 },
    rightUpperArm: { x: -1.5, y: 0, z: 0 },
    leftLowerArm: { x: -0.5, y: 0, z: 0 },
    rightLowerArm: { x: -0.5, y: 0, z: 0 },
    leftUpperLeg: { x: -0.1, y: 0, z: 0 },
    rightUpperLeg: { x: -0.1, y: 0, z: 0 },
    leftLowerLeg: { x: 0.1, y: 0, z: 0 },
    rightLowerLeg: { x: 0.1, y: 0, z: 0 },
    spine: { x: -0.2, y: 0, z: 0 },
    head: { x: -0.3, y: 0, z: 0 }
  },
  swim3: {
    leftUpperArm: { x: -0.5, y: 0, z: 0.3 },
    rightUpperArm: { x: -2.2, y: 0, z: -0.8 },
    leftLowerArm: { x: -0.8, y: 0, z: 0 },
    rightLowerArm: { x: -0.2, y: 0, z: 0 },
    leftUpperLeg: { x: -0.1, y: 0, z: 0 },
    rightUpperLeg: { x: -0.2, y: 0, z: -0.3 },
    leftLowerLeg: { x: 0.1, y: 0, z: 0 },
    rightLowerLeg: { x: 0.2, y: 0, z: 0 },
    spine: { x: -0.3, y: -0.1, z: 0 },
    head: { x: -0.4, y: 0, z: 0 }
  },
  swim4: {
    leftUpperArm: { x: -1.5, y: 0, z: 0 },
    rightUpperArm: { x: -1.5, y: 0, z: 0 },
    leftLowerArm: { x: -0.5, y: 0, z: 0 },
    rightLowerArm: { x: -0.5, y: 0, z: 0 },
    leftUpperLeg: { x: -0.1, y: 0, z: 0 },
    rightUpperLeg: { x: -0.1, y: 0, z: 0 },
    leftLowerLeg: { x: 0.1, y: 0, z: 0 },
    rightLowerLeg: { x: 0.1, y: 0, z: 0 },
    spine: { x: -0.2, y: 0, z: 0 },
    head: { x: -0.3, y: 0, z: 0 }
  },

  // ========== 飞行姿势 ==========
  fly1: {
    hips: { x: 0.3, y: 0.5, z: 0 },
    leftUpperArm: { x: -2.5, y: 0, z: 0.3 },
    rightUpperArm: { x: -2.5, y: 0, z: -0.3 },
    leftLowerArm: { x: -0.3, y: 0, z: 0 },
    rightLowerArm: { x: -0.3, y: 0, z: 0 },
    leftUpperLeg: { x: -0.2, y: 0, z: 0 },
    rightUpperLeg: { x: -0.2, y: 0, z: 0 },
    spine: { x: -0.2, y: 0, z: 0 },
    head: { x: -0.1, y: 0, z: 0 }
  },
  fly2: {
    hips: { x: 0.2, y: 0.4, z: 0 },
    leftUpperArm: { x: -2.3, y: 0, z: 0.5 },
    rightUpperArm: { x: -2.3, y: 0, z: -0.5 },
    leftLowerArm: { x: -0.2, y: 0, z: 0 },
    rightLowerArm: { x: -0.2, y: 0, z: 0 },
    leftUpperLeg: { x: -0.3, y: 0, z: 0.1 },
    rightUpperLeg: { x: -0.3, y: 0, z: -0.1 },
    spine: { x: -0.15, y: 0, z: 0 },
    head: { x: -0.05, y: 0, z: 0 }
  },
  fly3: {
    hips: { x: 0.25, y: 0.45, z: 0 },
    leftUpperArm: { x: -2.4, y: 0, z: 0.4 },
    rightUpperArm: { x: -2.4, y: 0, z: -0.4 },
    leftLowerArm: { x: -0.25, y: 0, z: 0 },
    rightLowerArm: { x: -0.25, y: 0, z: 0 },
    leftUpperLeg: { x: -0.25, y: 0, z: 0.05 },
    rightUpperLeg: { x: -0.25, y: 0, z: -0.05 },
    spine: { x: -0.18, y: 0, z: 0 },
    head: { x: -0.08, y: 0, z: 0 }
  },

  // ========== 问候姿势 ==========
  greetStart: {
    leftUpperArm: { x: -0.3, y: 0, z: 0.8 },
    rightUpperArm: { x: -0.3, y: 0, z: -0.8 },
    leftLowerArm: { x: -0.8, y: 0, z: 0 },
    rightLowerArm: { x: -0.8, y: 0, z: 0 },
    head: { x: 0, y: 0.1, z: 0 }
  },
  greetWave1: {
    leftUpperArm: { x: -0.5, y: 0, z: 1.0 },
    rightUpperArm: { x: -0.3, y: 0, z: -0.8 },
    leftLowerArm: { x: -0.6, y: 0, z: 0.3 },
    rightLowerArm: { x: -0.8, y: 0, z: 0 },
    head: { x: 0, y: 0.2, z: 0 }
  },
  greetWave2: {
    leftUpperArm: { x: -0.5, y: 0, z: 1.0 },
    rightUpperArm: { x: -0.3, y: 0, z: -0.8 },
    leftLowerArm: { x: -0.6, y: 0, z: -0.3 },
    rightLowerArm: { x: -0.8, y: 0, z: 0 },
    head: { x: 0, y: 0.2, z: 0 }
  },

  // ========== 挥手姿势 ==========
  wave1: {
    leftUpperArm: { x: -0.8, y: 0, z: 1.2 },
    leftLowerArm: { x: -0.5, y: 0, z: 0 },
    rightUpperArm: { x: 0.1, y: 0, z: -0.2 },
    rightLowerArm: { x: 0.15, y: 0, z: 0 },
    head: { x: 0, y: -0.1, z: 0 }
  },
  wave2: {
    leftUpperArm: { x: -0.8, y: 0, z: 1.2 },
    leftLowerArm: { x: -0.5, y: 0, z: 0.4 },
    rightUpperArm: { x: 0.1, y: 0, z: -0.2 },
    rightLowerArm: { x: 0.15, y: 0, z: 0 },
    head: { x: 0, y: -0.1, z: 0 }
  },
  wave3: {
    leftUpperArm: { x: -0.8, y: 0, z: 1.2 },
    leftLowerArm: { x: -0.5, y: 0, z: -0.4 },
    rightUpperArm: { x: 0.1, y: 0, z: -0.2 },
    rightLowerArm: { x: 0.15, y: 0, z: 0 },
    head: { x: 0, y: -0.1, z: 0 }
  },

  // ========== 鼓掌姿势 ==========
  clap1: {
    leftUpperArm: { x: -0.2, y: 0, z: 0.6 },
    rightUpperArm: { x: -0.2, y: 0, z: -0.6 },
    leftLowerArm: { x: -1.0, y: 0, z: 0 },
    rightLowerArm: { x: -1.0, y: 0, z: 0 },
    leftHand: { x: 0, y: 0, z: 0.1 },
    rightHand: { x: 0, y: 0, z: -0.1 }
  },
  clap2: {
    leftUpperArm: { x: -0.2, y: 0, z: 0.4 },
    rightUpperArm: { x: -0.2, y: 0, z: -0.4 },
    leftLowerArm: { x: -0.9, y: 0, z: 0 },
    rightLowerArm: { x: -0.9, y: 0, z: 0 },
    leftHand: { x: 0, y: 0, z: -0.1 },
    rightHand: { x: 0, y: 0, z: 0.1 }
  },

  // ========== 鞠躬姿势 ==========
  bowStart: {
    spine: { x: 0.3, y: 0, z: 0 },
    chest: { x: 0.4, y: 0, z: 0 },
    head: { x: 0.5, y: 0, z: 0 },
    leftUpperArm: { x: 0, y: 0, z: 0.3 },
    rightUpperArm: { x: 0, y: 0, z: -0.3 }
  },
  bowDeep: {
    spine: { x: 0.5, y: 0, z: 0 },
    chest: { x: 0.6, y: 0, z: 0 },
    head: { x: 0.7, y: 0, z: 0 },
    leftUpperArm: { x: 0.1, y: 0, z: 0.3 },
    rightUpperArm: { x: 0.1, y: 0, z: -0.3 }
  },
  bowHold: {
    spine: { x: 0.5, y: 0, z: 0 },
    chest: { x: 0.6, y: 0, z: 0 },
    head: { x: 0.7, y: 0, z: 0 },
    leftUpperArm: { x: 0.1, y: 0, z: 0.3 },
    rightUpperArm: { x: 0.1, y: 0, z: -0.3 }
  },

  // ========== 敬礼姿势 ==========
  saluteStart: {
    rightUpperArm: { x: -1.0, y: 0, z: -0.8 },
    rightLowerArm: { x: -1.2, y: 0, z: 0 },
    rightHand: { x: 0, y: 0, z: 0 },
    head: { x: 0, y: -0.1, z: 0 }
  },
  saluteHold: {
    rightUpperArm: { x: -0.8, y: 0.3, z: -0.6 },
    rightLowerArm: { x: -1.0, y: 0, z: 0 },
    rightHand: { x: 0, y: 0, z: 0 },
    head: { x: 0, y: -0.1, z: 0 }
  },

  // ========== 握手姿势 ==========
  handshakeReach: {
    rightUpperArm: { x: -0.5, y: 0, z: -0.6 },
    rightLowerArm: { x: -0.8, y: 0, z: 0 },
    rightHand: { x: 0, y: 0, z: 0 },
    head: { x: 0, y: -0.2, z: 0 }
  },
  handshakeGrip: {
    rightUpperArm: { x: -0.4, y: 0, z: -0.5 },
    rightLowerArm: { x: -0.6, y: 0, z: 0 },
    rightHand: { x: 0, y: 0, z: -0.2 },
    head: { x: 0, y: -0.2, z: 0 }
  },
  handshakeShake1: {
    rightUpperArm: { x: -0.4, y: 0, z: -0.5 },
    rightLowerArm: { x: -0.6, y: 0.2, z: 0 },
    rightHand: { x: 0, y: 0, z: -0.2 },
    head: { x: 0, y: -0.2, z: 0 }
  },
  handshakeShake2: {
    rightUpperArm: { x: -0.4, y: 0, z: -0.5 },
    rightLowerArm: { x: -0.6, y: -0.2, z: 0 },
    rightHand: { x: 0, y: 0, z: -0.2 },
    head: { x: 0, y: -0.2, z: 0 }
  },

  // ========== 思考姿势 ==========
  thinkPose: {
    rightUpperArm: { x: -0.8, y: 0, z: -0.3 },
    rightLowerArm: { x: -1.0, y: 0, z: 0 },
    rightHand: { x: 0, y: 0, z: 0 },
    head: { x: 0.1, y: 0.1, z: 0 },
    spine: { x: 0.05, y: 0, z: 0 }
  },
  thinkLookUp: {
    head: { x: -0.3, y: 0, z: 0 },
    rightUpperArm: { x: -0.8, y: 0, z: -0.3 },
    rightLowerArm: { x: -1.0, y: 0, z: 0 },
    rightHand: { x: 0, y: 0, z: 0 },
    spine: { x: -0.05, y: 0, z: 0 }
  },
  thinkLookDown: {
    head: { x: 0.3, y: 0, z: 0 },
    rightUpperArm: { x: -0.8, y: 0, z: -0.3 },
    rightLowerArm: { x: -1.0, y: 0, z: 0 },
    rightHand: { x: 0, y: 0, z: 0 },
    spine: { x: 0.05, y: 0, z: 0 }
  }
}

// 导出所有姿势
export default poseLibrary
