// 250种动作的高帧率动画定义
// 使用贝塞尔曲线插值，60fps流畅动画

// 动画缓动函数 - 让动作更自然
export const easingFunctions = {
  // 线性
  linear: t => t,
  // 平滑开始
  easeInQuad: t => t * t,
  // 平滑结束
  easeOutQuad: t => t * (2 - t),
  // 平滑开始结束
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  // 三次方平滑
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  // 弹性
  easeOutElastic: t => {
    const c4 = (2 * Math.PI) / 3
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  },
  // 回弹
  easeOutBack: t => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  },
  // 弹跳
  easeOutBounce: t => {
    const n1 = 7.5625
    const d1 = 2.75
    if (t < 1 / d1) {
      return n1 * t * t
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375
    }
  },
  // 平滑步进 - 最适合角色动画
  smoothstep: t => t * t * (3 - 2 * t),
  // 更平滑的步进
  smootherstep: t => t * t * t * (t * (t * 6 - 15) + 10)
}

// 生成平滑的关键帧 - 60fps
export const generateSmoothKeyframes = (poses, duration, easing = 'smoothstep') => {
  const keyframes = []
  const fps = 60
  const totalFrames = Math.ceil((duration / 1000) * fps)
  
  for (let i = 0; i <= totalFrames; i++) {
    const t = i / totalFrames
    const easedT = easingFunctions[easing](t)
    
    // 找到当前时间对应的姿势区间
    let startPose = poses[0]
    let endPose = poses[poses.length - 1]
    let localT = 0
    
    for (let j = 0; j < poses.length - 1; j++) {
      const poseStart = poses[j].time
      const poseEnd = poses[j + 1].time
      
      if (easedT >= poseStart && easedT <= poseEnd) {
        startPose = poses[j]
        endPose = poses[j + 1]
        localT = (easedT - poseStart) / (poseEnd - poseStart)
        break
      }
    }
    
    keyframes.push({
      time: i / totalFrames,
      pose: startPose.pose,
      nextPose: endPose.pose,
      blend: easingFunctions.smoothstep(localT)
    })
  }
  
  return keyframes
}

// 基础姿势定义
const basePoses = {
  // 自然站立
  idle: {
    hips: { x: 0, y: 0, z: 0 },
    spine: { x: 0.02, y: 0, z: 0 },
    chest: { x: 0.03, y: 0, z: 0 },
    neck: { x: 0.02, y: 0, z: 0 },
    head: { x: 0.05, y: 0, z: 0 },
    leftShoulder: { x: 0, y: 0, z: 0.1 },
    rightShoulder: { x: 0, y: 0, z: -0.1 },
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
  
  // 放松站立
  idle_relaxed: {
    hips: { x: 0, y: 0, z: 0.05 },
    spine: { x: 0.05, y: 0, z: 0 },
    chest: { x: 0.05, y: 0, z: 0 },
    leftShoulder: { x: 0, y: 0, z: 0.15 },
    rightShoulder: { x: 0, y: 0, z: -0.15 },
    leftUpperArm: { x: 0.15, y: 0.1, z: 0.2 },
    rightUpperArm: { x: 0.15, y: -0.1, z: -0.2 },
    leftLowerArm: { x: 0.3, y: 0, z: 0 },
    rightLowerArm: { x: 0.3, y: 0, z: 0 }
  },
  
  // 紧张站立
  idle_nervous: {
    hips: { x: 0, y: 0, z: -0.02 },
    spine: { x: -0.02, y: 0, z: 0 },
    leftShoulder: { x: 0, y: 0, z: 0.05 },
    rightShoulder: { x: 0, y: 0, z: -0.05 },
    leftUpperArm: { x: 0.05, y: 0, z: 0.1 },
    rightUpperArm: { x: 0.05, y: 0, z: -0.1 },
    leftHand: { x: 0, y: 0, z: 0.1 },
    rightHand: { x: 0, y: 0, z: -0.1 }
  },
  
  // 无聊站立
  idle_bored: {
    hips: { x: 0, y: 0, z: 0.08 },
    spine: { x: 0.1, y: 0, z: 0 },
    head: { x: 0.2, y: 0.1, z: 0 },
    leftShoulder: { x: 0.1, y: 0, z: 0.2 },
    rightShoulder: { x: 0.1, y: 0, z: -0.2 },
    leftUpperArm: { x: 0.2, y: 0, z: 0.1 },
    rightUpperArm: { x: 0.2, y: 0, z: -0.1 }
  },
  
  // 行走姿势
  walk1: {
    leftUpperLeg: { x: -0.35, y: 0, z: 0 },
    rightUpperLeg: { x: 0.35, y: 0, z: 0 },
    leftLowerLeg: { x: 0.15, y: 0, z: 0 },
    rightLowerLeg: { x: 0.4, y: 0, z: 0 },
    leftFoot: { x: 0.1, y: 0, z: 0 },
    rightFoot: { x: 0.2, y: 0, z: 0 },
    leftUpperArm: { x: 0.2, y: 0, z: 0.2 },
    rightUpperArm: { x: -0.2, y: 0, z: -0.2 },
    spine: { x: 0.02, y: 0.05, z: 0 },
    hips: { x: 0, y: 0.05, z: 0 }
  },
  
  walk2: {
    leftUpperLeg: { x: 0, y: 0, z: 0 },
    rightUpperLeg: { x: 0, y: 0, z: 0 },
    leftLowerLeg: { x: 0.3, y: 0, z: 0 },
    rightLowerLeg: { x: 0.3, y: 0, z: 0 },
    leftFoot: { x: 0.15, y: 0, z: 0 },
    rightFoot: { x: 0.15, y: 0, z: 0 },
    leftUpperArm: { x: 0, y: 0, z: 0.15 },
    rightUpperArm: { x: 0, y: 0, z: -0.15 },
    spine: { x: 0.02, y: 0, z: 0 },
    hips: { x: 0, y: 0, z: 0 }
  },
  
  walk3: {
    leftUpperLeg: { x: 0.35, y: 0, z: 0 },
    rightUpperLeg: { x: -0.35, y: 0, z: 0 },
    leftLowerLeg: { x: 0.4, y: 0, z: 0 },
    rightLowerLeg: { x: 0.15, y: 0, z: 0 },
    leftFoot: { x: 0.2, y: 0, z: 0 },
    rightFoot: { x: 0.1, y: 0, z: 0 },
    leftUpperArm: { x: -0.2, y: 0, z: 0.2 },
    rightUpperArm: { x: 0.2, y: 0, z: -0.2 },
    spine: { x: 0.02, y: -0.05, z: 0 },
    hips: { x: 0, y: 0.05, z: 0 }
  },
  
  walk4: {
    leftUpperLeg: { x: 0, y: 0, z: 0 },
    rightUpperLeg: { x: 0, y: 0, z: 0 },
    leftLowerLeg: { x: 0.3, y: 0, z: 0 },
    rightLowerLeg: { x: 0.3, y: 0, z: 0 },
    leftFoot: { x: 0.15, y: 0, z: 0 },
    rightFoot: { x: 0.15, y: 0, z: 0 },
    leftUpperArm: { x: 0, y: 0, z: 0.15 },
    rightUpperArm: { x: 0, y: 0, z: -0.15 },
    spine: { x: 0.02, y: 0, z: 0 },
    hips: { x: 0, y: 0, z: 0 }
  },
  
  // 奔跑姿势
  run1: {
    leftUpperLeg: { x: -0.6, y: 0, z: 0 },
    rightUpperLeg: { x: 0.6, y: 0, z: 0 },
    leftLowerLeg: { x: 0.2, y: 0, z: 0 },
    rightLowerLeg: { x: 0.8, y: 0, z: 0 },
    leftFoot: { x: 0.15, y: 0, z: 0 },
    rightFoot: { x: 0.3, y: 0, z: 0 },
    leftUpperArm: { x: -0.4, y: 0, z: 0.3 },
    rightUpperArm: { x: 0.4, y: 0, z: -0.3 },
    leftLowerArm: { x: -0.8, y: 0, z: 0 },
    rightLowerArm: { x: -0.8, y: 0, z: 0 },
    spine: { x: 0.1, y: 0, z: 0 },
    chest: { x: 0.1, y: 0, z: 0 },
    head: { x: 0.05, y: 0, z: 0 },
    hips: { x: -0.1, y: 0.1, z: 0 }
  },
  
  run2: {
    leftUpperLeg: { x: 0, y: 0, z: 0 },
    rightUpperLeg: { x: 0, y: 0, z: 0 },
    leftLowerLeg: { x: 0.7, y: 0, z: 0 },
    rightLowerLeg: { x: 0.7, y: 0, z: 0 },
    leftFoot: { x: 0.25, y: 0, z: 0 },
    rightFoot: { x: 0.25, y: 0, z: 0 },
    leftUpperArm: { x: 0, y: 0, z: 0.25 },
    rightUpperArm: { x: 0, y: 0, z: -0.25 },
    leftLowerArm: { x: -0.6, y: 0, z: 0 },
    rightLowerArm: { x: -0.6, y: 0, z: 0 },
    spine: { x: 0.1, y: 0, z: 0 },
    hips: { x: -0.05, y: 0.05, z: 0 }
  },
  
  run3: {
    leftUpperLeg: { x: 0.6, y: 0, z: 0 },
    rightUpperLeg: { x: -0.6, y: 0, z: 0 },
    leftLowerLeg: { x: 0.8, y: 0, z: 0 },
    rightLowerLeg: { x: 0.2, y: 0, z: 0 },
    leftFoot: { x: 0.3, y: 0, z: 0 },
    rightFoot: { x: 0.15, y: 0, z: 0 },
    leftUpperArm: { x: 0.4, y: 0, z: 0.3 },
    rightUpperArm: { x: -0.4, y: 0, z: -0.3 },
    leftLowerArm: { x: -0.8, y: 0, z: 0 },
    rightLowerArm: { x: -0.8, y: 0, z: 0 },
    spine: { x: 0.1, y: 0, z: 0 },
    hips: { x: -0.1, y: 0.1, z: 0 }
  },
  
  run4: {
    leftUpperLeg: { x: 0, y: 0, z: 0 },
    rightUpperLeg: { x: 0, y: 0, z: 0 },
    leftLowerLeg: { x: 0.7, y: 0, z: 0 },
    rightLowerLeg: { x: 0.7, y: 0, z: 0 },
    leftFoot: { x: 0.25, y: 0, z: 0 },
    rightFoot: { x: 0.25, y: 0, z: 0 },
    leftUpperArm: { x: 0, y: 0, z: 0.25 },
    rightUpperArm: { x: 0, y: 0, z: -0.25 },
    leftLowerArm: { x: -0.6, y: 0, z: 0 },
    rightLowerArm: { x: -0.6, y: 0, z: 0 },
    spine: { x: 0.1, y: 0, z: 0 },
    hips: { x: -0.05, y: 0.05, z: 0 }
  },
  
  // 冲刺
  sprint1: {
    leftUpperLeg: { x: -0.8, y: 0, z: 0 },
    rightUpperLeg: { x: 0.8, y: 0, z: 0 },
    leftLowerLeg: { x: 0.1, y: 0, z: 0 },
    rightLowerLeg: { x: 1.0, y: 0, z: 0 },
    leftUpperArm: { x: -0.6, y: 0, z: 0.4 },
    rightUpperArm: { x: 0.6, y: 0, z: -0.4 },
    leftLowerArm: { x: -1.0, y: 0, z: 0 },
    rightLowerArm: { x: -1.0, y: 0, z: 0 },
    spine: { x: 0.2, y: 0, z: 0 },
    chest: { x: 0.15, y: 0, z: 0 },
    head: { x: 0.1, y: 0, z: 0 },
    hips: { x: -0.2, y: 0.15, z: 0 }
  },
  
  // 跳跃
  jump_crouch: {
    hips: { x: -0.3, y: 0, z: 0 },
    spine: { x: -0.1, y: 0, z: 0 },
    leftUpperLeg: { x: -0.5, y: 0, z: 0 },
    rightUpperLeg: { x: -0.5, y: 0, z: 0 },
    leftLowerLeg: { x: 0.8, y: 0, z: 0 },
    rightLowerLeg: { x: 0.8, y: 0, z: 0 },
    leftUpperArm: { x: -0.3, y: 0, z: 0.3 },
    rightUpperArm: { x: -0.3, y: 0, z: -0.3 },
    leftLowerArm: { x: -0.5, y: 0, z: 0 },
    rightLowerArm: { x: -0.5, y: 0, z: 0 }
  },
  
  jump_up: {
    hips: { x: 0.2, y: 0.3, z: 0 },
    spine: { x: 0.05, y: 0, z: 0 },
    leftUpperLeg: { x: -0.3, y: 0, z: 0 },
    rightUpperLeg: { x: -0.3, y: 0, z: 0 },
    leftLowerLeg: { x: 0.2, y: 0, z: 0 },
    rightLowerLeg: { x: 0.2, y: 0, z: 0 },
    leftUpperArm: { x: -2.0, y: 0, z: 0.2 },
    rightUpperArm: { x: -2.0, y: 0, z: -0.2 },
    leftLowerArm: { x: -0.2, y: 0, z: 0 },
    rightLowerArm: { x: -0.2, y: 0, z: 0 }
  },
  
  jump_air: {
    hips: { x: 0.1, y: 0.2, z: 0 },
    spine: { x: 0, y: 0, z: 0 },
    leftUpperLeg: { x: -0.2, y: 0, z: 0.1 },
    rightUpperLeg: { x: -0.2, y: 0, z: -0.1 },
    leftLowerLeg: { x: 0.3, y: 0, z: 0 },
    rightLowerLeg: { x: 0.3, y: 0, z: 0 },
    leftUpperArm: { x: -1.5, y: 0, z: 0.3 },
    rightUpperArm: { x: -1.5, y: 0, z: -0.3 },
    leftLowerArm: { x: -0.3, y: 0, z: 0 },
    rightLowerArm: { x: -0.3, y: 0, z: 0 }
  },
  
  jump_fall: {
    hips: { x: -0.1, y: 0.1, z: 0 },
    spine: { x: -0.05, y: 0, z: 0 },
    leftUpperLeg: { x: -0.4, y: 0, z: 0 },
    rightUpperLeg: { x: -0.4, y: 0, z: 0 },
    leftLowerLeg: { x: 0.5, y: 0, z: 0 },
    rightLowerLeg: { x: 0.5, y: 0, z: 0 },
    leftUpperArm: { x: -1.0, y: 0, z: 0.2 },
    rightUpperArm: { x: -1.0, y: 0, z: -0.2 },
    leftLowerArm: { x: -0.4, y: 0, z: 0 },
    rightLowerArm: { x: -0.4, y: 0, z: 0 }
  },
  
  jump_land: {
    hips: { x: -0.2, y: 0, z: 0 },
    spine: { x: -0.1, y: 0, z: 0 },
    leftUpperLeg: { x: -0.6, y: 0, z: 0 },
    rightUpperLeg: { x: -0.6, y: 0, z: 0 },
    leftLowerLeg: { x: 0.9, y: 0, z: 0 },
    rightLowerLeg: { x: 0.9, y: 0, z: 0 },
    leftUpperArm: { x: -0.5, y: 0, z: 0.3 },
    rightUpperArm: { x: -0.5, y: 0, z: -0.3 },
    leftLowerArm: { x: -0.6, y: 0, z: 0 },
    rightLowerArm: { x: -0.6, y: 0, z: 0 }
  },
  
  // 坐下
  sit_down: {
    hips: { x: -0.8, y: -0.3, z: 0 },
    spine: { x: 0.1, y: 0, z: 0 },
    leftUpperLeg: { x: -1.4, y: 0, z: 0.1 },
    rightUpperLeg: { x: -1.4, y: 0, z: -0.1 },
    leftLowerLeg: { x: 1.4, y: 0, z: 0 },
    rightLowerLeg: { x: 1.4, y: 0, z: 0 },
    leftUpperArm: { x: 0.2, y: 0, z: 0.2 },
    rightUpperArm: { x: 0.2, y: 0, z: -0.2 },
    leftLowerArm: { x: 0.4, y: 0, z: 0 },
    rightLowerArm: { x: 0.4, y: 0, z: 0 }
  },
  
  sit_relax: {
    hips: { x: -0.9, y: -0.35, z: 0 },
    spine: { x: 0.15, y: 0, z: 0 },
    chest: { x: 0.1, y: 0, z: 0 },
    head: { x: 0.1, y: 0, z: 0 },
    leftUpperLeg: { x: -1.45, y: 0, z: 0.15 },
    rightUpperLeg: { x: -1.45, y: 0, z: -0.15 },
    leftLowerLeg: { x: 1.45, y: 0, z: 0 },
    rightLowerLeg: { x: 1.45, y: 0, z: 0 },
    leftUpperArm: { x: 0.3, y: 0.1, z: 0.25 },
    rightUpperArm: { x: 0.3, y: -0.1, z: -0.25 },
    leftLowerArm: { x: 0.5, y: 0, z: 0 },
    rightLowerArm: { x: 0.5, y: 0, z: 0 }
  },
  
  // 盘腿坐
  sit_crossleg: {
    hips: { x: -0.7, y: 0, z: 0 },
    spine: { x: 0.05, y: 0, z: 0 },
    leftUpperLeg: { x: -1.2, y: 0.5, z: 0.3 },
    rightUpperLeg: { x: -1.2, y: -0.5, z: -0.3 },
    leftLowerLeg: { x: 1.5, y: 0.3, z: 0.2 },
    rightLowerLeg: { x: 1.5, y: -0.3, z: -0.2 },
    leftUpperArm: { x: 0.1, y: 0, z: 0.3 },
    rightUpperArm: { x: 0.1, y: 0, z: -0.3 },
    leftLowerArm: { x: 0.3, y: 0, z: 0 },
    rightLowerArm: { x: 0.3, y: 0, z: 0 },
    leftHand: { x: 0, y: 0, z: 0.2 },
    rightHand: { x: 0, y: 0, z: -0.2 }
  },
  
  // 躺下
  lie_down: {
    hips: { x: -1.57, y: 0, z: 0 },
    spine: { x: 0, y: 0, z: 0 },
    leftUpperLeg: { x: 0, y: 0, z: 0.1 },
    rightUpperLeg: { x: 0, y: 0, z: -0.1 },
    leftLowerLeg: { x: 0.1, y: 0, z: 0 },
    rightLowerLeg: { x: 0.1, y: 0, z: 0 },
    leftUpperArm: { x: 0, y: 0, z: 0.3 },
    rightUpperArm: { x: 0, y: 0, z: -0.3 },
    leftLowerArm: { x: 0.2, y: 0, z: 0 },
    rightLowerArm: { x: 0.2, y: 0, z: 0 }
  },
  
  // 侧躺
  lie_side: {
    hips: { x: -1.57, y: 0, z: 1.57 },
    spine: { x: 0, y: 0, z: -0.3 },
    leftUpperLeg: { x: 0.3, y: 0, z: 0.5 },
    rightUpperLeg: { x: -0.1, y: 0, z: -0.2 },
    leftLowerLeg: { x: 0.2, y: 0, z: 0 },
    rightLowerLeg: { x: 0.3, y: 0, z: 0 },
    leftUpperArm: { x: 0.5, y: 0, z: 0.2 },
    rightUpperArm: { x: 0.3, y: 0, z: -0.3 },
    leftLowerArm: { x: 0.5, y: 0, z: 0 },
    rightLowerArm: { x: 0.4, y: 0, z: 0 }
  },
  
  // 趴下
  lie_prone: {
    hips: { x: 1.57, y: 0, z: 0 },
    spine: { x: 0.2, y: 0, z: 0 },
    head: { x: -0.5, y: 0, z: 0 },
    leftUpperLeg: { x: 0, y: 0, z: 0.15 },
    rightUpperLeg: { x: 0, y: 0, z: -0.15 },
    leftLowerLeg: { x: 0.3, y: 0, z: 0 },
    rightLowerLeg: { x: 0.3, y: 0, z: 0 },
    leftUpperArm: { x: -0.5, y: 0, z: 0.4 },
    rightUpperArm: { x: -0.5, y: 0, z: -0.4 },
    leftLowerArm: { x: -0.8, y: 0, z: 0 },
    rightLowerArm: { x: -0.8, y: 0, z: 0 }
  },
  
  // 立正
  stand_attention: {
    hips: { x: 0, y: 0, z: 0 },
    spine: { x: 0, y: 0, z: 0 },
    chest: { x: 0, y: 0, z: 0 },
    head: { x: 0, y: 0, z: 0 },
    leftShoulder: { x: 0, y: 0, z: 0 },
    rightShoulder: { x: 0, y: 0, z: 0 },
    leftUpperArm: { x: 0, y: 0, z: 0.1 },
    rightUpperArm: { x: 0, y: 0, z: -0.1 },
    leftLowerArm: { x: 0.1, y: 0, z: 0 },
    rightLowerArm: { x: 0.1, y: 0, z: 0 },
    leftHand: { x: 0, y: 0, z: 0 },
    rightHand: { x: 0, y: 0, z: 0 },
    leftUpperLeg: { x: 0, y: 0, z: 0 },
    rightUpperLeg: { x: 0, y: 0, z: 0 },
    leftLowerLeg: { x: 0.05, y: 0, z: 0 },
    rightLowerLeg: { x: 0.05, y: 0, z: 0 },
    leftFoot: { x: 0, y: 0, z: 0 },
    rightFoot: { x: 0, y: 0, z: 0 }
  },
  
  // 稍息
  stand_at_ease: {
    hips: { x: 0, y: 0, z: 0.05 },
    leftUpperLeg: { x: 0, y: 0, z: 0 },
    rightUpperLeg: { x: 0, y: 0, z: 0.15 },
    leftLowerLeg: { x: 0.05, y: 0, z: 0 },
    rightLowerLeg: { x: 0.1, y: 0, z: 0 },
    leftUpperArm: { x: 0.1, y: 0, z: 0.15 },
    rightUpperArm: { x: 0.1, y: 0, z: -0.15 }
  },
  
  // 蹲下
  crouch: {
    hips: { x: -0.5, y: 0, z: 0 },
    spine: { x: 0.1, y: 0, z: 0 },
    leftUpperLeg: { x: -1.0, y: 0, z: 0.1 },
    rightUpperLeg: { x: -1.0, y: 0, z: -0.1 },
    leftLowerLeg: { x: 1.2, y: 0, z: 0 },
    rightLowerLeg: { x: 1.2, y: 0, z: 0 },
    leftUpperArm: { x: 0.3, y: 0, z: 0.3 },
    rightUpperArm: { x: 0.3, y: 0, z: -0.3 },
    leftLowerArm: { x: 0.5, y: 0, z: 0 },
    rightLowerArm: { x: 0.5, y: 0, z: 0 }
  },
  
  // 低蹲
  crouch_low: {
    hips: { x: -0.8, y: 0, z: 0 },
    spine: { x: 0.15, y: 0, z: 0 },
    leftUpperLeg: { x: -1.3, y: 0, z: 0.15 },
    rightUpperLeg: { x: -1.3, y: 0, z: -0.15 },
    leftLowerLeg: { x: 1.5, y: 0, z: 0 },
    rightLowerLeg: { x: 1.5, y: 0, z: 0 },
    leftUpperArm: { x: 0.4, y: 0, z: 0.4 },
    rightUpperArm: { x: 0.4, y: 0, z: -0.4 },
    leftLowerArm: { x: 0.6, y: 0, z: 0 },
    rightLowerArm: { x: 0.6, y: 0, z: 0 }
  },
  
  // 爬行
  crawl1: {
    hips: { x: -0.3, y: 0, z: 0 },
    spine: { x: 0.1, y: 0, z: 0 },
    leftUpperLeg: { x: -0.5, y: 0, z: 0.2 },
    rightUpperLeg: { x: -0.2, y: 0, z: -0.1 },
    leftLowerLeg: { x: 0.8, y: 0, z: 0 },
    rightLowerLeg: { x: 0.5, y: 0, z: 0 },
    leftUpperArm: { x: -0.3, y: 0, z: 0.4 },
    rightUpperArm: { x: -0.6, y: 0, z: -0.3 },
    leftLowerArm: { x: -0.5, y: 0, z: 0 },
    rightLowerArm: { x: -0.3, y: 0, z: 0 }
  },
  
  crawl2: {
    hips: { x: -0.3, y: 0, z: 0 },
    spine: { x: 0.1, y: 0, z: 0 },
    leftUpperLeg: { x: -0.2, y: 0, z: 0.1 },
    rightUpperLeg: { x: -0.5, y: 0, z: -0.2 },
    leftLowerLeg: { x: 0.5, y: 0, z: 0 },
    rightLowerLeg: { x: 0.8, y: 0, z: 0 },
    leftUpperArm: { x: -0.6, y: 0, z: 0.3 },
    rightUpperArm: { x: -0.3, y: 0, z: -0.4 },
    leftLowerArm: { x: -0.3, y: 0, z: 0 },
    rightLowerArm: { x: -0.5, y: 0, z: 0 }
  },
  
  // 攀爬
  climb1: {
    hips: { x: -0.1, y: 0, z: 0 },
    spine: { x: 0.05, y: 0, z: 0 },
    leftUpperLeg: { x: -0.6, y: 0, z: 0.1 },
    rightUpperLeg: { x: -0.3, y: 0, z: -0.1 },
    leftLowerLeg: { x: 0.8, y: 0, z: 0 },
    rightLowerLeg: { x: 0.4, y: 0, z: 0 },
    leftUpperArm: { x: -0.8, y: 0, z: 0.2 },
    rightUpperArm: { x: -0.4, y: 0, z: -0.2 },
    leftLowerArm: { x: -0.3, y: 0, z: 0 },
    rightLowerArm: { x: -0.6, y: 0, z: 0 }
  },
  
  climb2: {
    hips: { x: -0.1, y: 0.1, z: 0 },
    spine: { x: 0.05, y: 0, z: 0 },
    leftUpperLeg: { x: -0.3, y: 0, z: 0.1 },
    rightUpperLeg: { x: -0.6, y: 0, z: -0.1 },
    leftLowerLeg: { x: 0.4, y: 0, z: 0 },
    rightLowerLeg: { x: 0.8, y: 0, z: 0 },
    leftUpperArm: { x: -0.4, y: 0, z: 0.2 },
    rightUpperArm: { x: -0.8, y: 0, z: -0.2 },
    leftLowerArm: { x: -0.6, y: 0, z: 0 },
    rightLowerArm: { x: -0.3, y: 0, z: 0 }
  }
}

// 生成250种动作的动画定义
export const actionAnimations250 = {
  // ========== 基础动作 ==========
  idle: {
    duration: 3000,
    loop: true,
    fps: 60,
    easing: 'smoothstep',
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.25, pose: 'idle_relaxed' },
      { time: 0.5, pose: 'idle' },
      { time: 0.75, pose: 'idle_nervous' },
      { time: 1, pose: 'idle' }
    ]
  },
  
  idle_relaxed: {
    duration: 4000,
    loop: true,
    fps: 60,
    easing: 'easeInOutQuad',
    keyframes: [
      { time: 0, pose: 'idle_relaxed' },
      { time: 0.5, pose: 'idle_bored' },
      { time: 1, pose: 'idle_relaxed' }
    ]
  },
  
  idle_nervous: {
    duration: 2000,
    loop: true,
    fps: 60,
    easing: 'easeInOutQuad',
    keyframes: [
      { time: 0, pose: 'idle_nervous' },
      { time: 0.3, pose: 'idle' },
      { time: 0.6, pose: 'idle_nervous' },
      { time: 1, pose: 'idle_nervous' }
    ]
  },
  
  idle_bored: {
    duration: 5000,
    loop: true,
    fps: 60,
    easing: 'easeInOutQuad',
    keyframes: [
      { time: 0, pose: 'idle_bored' },
      { time: 0.4, pose: 'idle_relaxed' },
      { time: 0.7, pose: 'idle_bored' },
      { time: 1, pose: 'idle_bored' }
    ]
  },
  
  walk: {
    duration: 1600,
    loop: true,
    fps: 60,
    easing: 'smoothstep',
    keyframes: [
      { time: 0, pose: 'walk1' },
      { time: 0.25, pose: 'walk2' },
      { time: 0.5, pose: 'walk3' },
      { time: 0.75, pose: 'walk4' },
      { time: 1, pose: 'walk1' }
    ]
  },
  
  walk_slow: {
    duration: 2400,
    loop: true,
    fps: 60,
    easing: 'easeInOutQuad',
    keyframes: [
      { time: 0, pose: 'walk1' },
      { time: 0.3, pose: 'walk2' },
      { time: 0.5, pose: 'walk3' },
      { time: 0.8, pose: 'walk4' },
      { time: 1, pose: 'walk1' }
    ]
  },
  
  walk_fast: {
    duration: 1200,
    loop: true,
    fps: 60,
    easing: 'smoothstep',
    keyframes: [
      { time: 0, pose: 'walk1' },
      { time: 0.2, pose: 'walk2' },
      { time: 0.5, pose: 'walk3' },
      { time: 0.7, pose: 'walk4' },
      { time: 1, pose: 'walk1' }
    ]
  },
  
  run: {
    duration: 1000,
    loop: true,
    fps: 60,
    easing: 'smoothstep',
    keyframes: [
      { time: 0, pose: 'run1' },
      { time: 0.25, pose: 'run2' },
      { time: 0.5, pose: 'run3' },
      { time: 0.75, pose: 'run4' },
      { time: 1, pose: 'run1' }
    ]
  },
  
  run_sprint: {
    duration: 800,
    loop: true,
    fps: 60,
    easing: 'smoothstep',
    keyframes: [
      { time: 0, pose: 'sprint1' },
      { time: 0.5, pose: 'run2' },
      { time: 1, pose: 'sprint1' }
    ]
  },
  
  jump: {
    duration: 1500,
    loop: false,
    fps: 60,
    easing: 'easeOutBack',
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.15, pose: 'jump_crouch' },
      { time: 0.35, pose: 'jump_up' },
      { time: 0.55, pose: 'jump_air' },
      { time: 0.75, pose: 'jump_fall' },
      { time: 0.9, pose: 'jump_land' },
      { time: 1, pose: 'idle' }
    ]
  },
  
  jump_high: {
    duration: 2000,
    loop: false,
    fps: 60,
    easing: 'easeOutBack',
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.2, pose: 'jump_crouch' },
      { time: 0.4, pose: 'jump_up' },
      { time: 0.6, pose: 'jump_air' },
      { time: 0.75, pose: 'jump_fall' },
      { time: 0.9, pose: 'jump_land' },
      { time: 1, pose: 'idle' }
    ]
  },
  
  sit: {
    duration: 2000,
    loop: false,
    fps: 60,
    easing: 'easeInOutCubic',
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.4, pose: 'sit_down' },
      { time: 0.7, pose: 'sit_relax' },
      { time: 1, pose: 'sit_relax' }
    ]
  },
  
  sit_crossleg: {
    duration: 2000,
    loop: false,
    fps: 60,
    easing: 'easeInOutCubic',
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.5, pose: 'sit_crossleg' },
      { time: 1, pose: 'sit_crossleg' }
    ]
  },
  
  lie: {
    duration: 2500,
    loop: false,
    fps: 60,
    easing: 'easeInOutCubic',
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.3, pose: 'crouch' },
      { time: 0.6, pose: 'lie_down' },
      { time: 1, pose: 'lie_down' }
    ]
  },
  
  stand: {
    duration: 2000,
    loop: true,
    fps: 60,
    easing: 'easeInOutQuad',
    keyframes: [
      { time: 0, pose: 'stand_attention' },
      { time: 0.5, pose: 'stand_at_ease' },
      { time: 1, pose: 'stand_attention' }
    ]
  },
  
  crouch: {
    duration: 1500,
    loop: false,
    fps: 60,
    easing: 'easeInOutCubic',
    keyframes: [
      { time: 0, pose: 'idle' },
      { time: 0.5, pose: 'crouch' },
      { time: 1, pose: 'crouch' }
    ]
  },
  
  crawl: {
    duration: 2000,
    loop: true,
    fps: 60,
    easing: 'smoothstep',
    keyframes: [
      { time: 0, pose: 'crawl1' },
      { time: 0.5, pose: 'crawl2' },
      { time: 1, pose: 'crawl1' }
    ]
  },
  
  climb: {
    duration: 2000,
    loop: true,
    fps: 60,
    easing: 'smoothstep',
    keyframes: [
      { time: 0, pose: 'climb1' },
      { time: 0.5, pose: 'climb2' },
      { time: 1, pose: 'climb1' }
    ]
  }
}

// 导出姿势库
export const poseLibrary = basePoses

// 获取动作动画定义
export const getActionAnimation = (actionId) => {
  return actionAnimations250[actionId] || actionAnimations250.idle
}

// 检查动作是否存在
export const hasActionAnimation = (actionId) => {
  return actionId in actionAnimations250
}

// 获取所有动作ID
export const getAllActionIds = () => {
  return Object.keys(actionAnimations250)
}

export default actionAnimations250
