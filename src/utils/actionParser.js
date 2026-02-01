// 动作解析器 - 将动作数据转换为实际动画
import { getActionData, EASING_TYPES } from '../data/mmdActionData.js'
import { getExtendedActionData } from '../data/mmdActionDataExtended.js'

// 缓动函数
const easingFunctions = {
  [EASING_TYPES.LINEAR]: (t) => t,
  [EASING_TYPES.EASE_IN]: (t) => t * t,
  [EASING_TYPES.EASE_OUT]: (t) => 1 - (1 - t) * (1 - t),
  [EASING_TYPES.EASE_IN_OUT]: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  [EASING_TYPES.ELASTIC]: (t) => {
    const c4 = (2 * Math.PI) / 3
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4)
  },
  [EASING_TYPES.BOUNCE]: (t) => {
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
  [EASING_TYPES.SINE]: (t) => (1 - Math.cos(t * Math.PI)) / 2
}

// 获取缓动函数
function getEasingFunction(timing) {
  return easingFunctions[timing] || easingFunctions[EASING_TYPES.LINEAR]
}

// 计算骨骼变换
function calculateBoneTransform(boneData, progress) {
  const transform = {
    rotation: [0, 0, 0],
    position: [0, 0, 0]
  }

  if (!boneData) return transform

  const easing = getEasingFunction(boneData.timing || EASING_TYPES.LINEAR)
  const easedProgress = easing(progress)

  // 处理不同类型的运动
  if (boneData.rotation) {
    // 固定旋转
    transform.rotation = [...boneData.rotation]
  }

  if (boneData.position) {
    // 固定位置
    transform.position = [...boneData.position]
  }

  // 波浪运动
  if (boneData.wave) {
    const { axis, amplitude, frequency, phase = 0 } = boneData.wave
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
    const waveValue = Math.sin(progress * Math.PI * 2 * frequency + phase) * amplitude
    transform.rotation[axisIndex] = waveValue
  }

  // 摆动
  if (boneData.swing) {
    const { axis, amplitude, frequency, phase = 0 } = boneData.swing
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
    const swingValue = Math.sin(progress * Math.PI * 2 * frequency + phase) * amplitude
    transform.rotation[axisIndex] = swingValue
  }

  // 上下浮动
  if (boneData.bob) {
    const { axis, amplitude, frequency } = boneData.bob
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
    const bobValue = Math.abs(Math.sin(progress * Math.PI * frequency)) * amplitude
    transform.position[axisIndex] = bobValue
  }

  // 跳跃
  if (boneData.jump) {
    const { y, timing: jumpTiming } = boneData.jump
    const jumpEasing = getEasingFunction(jumpTiming || EASING_TYPES.EASE_OUT)
    const jumpProgress = jumpEasing(progress)
    if (Array.isArray(y)) {
      // 关键帧跳跃
      const keyframeIndex = Math.floor(progress * (y.length - 1))
      const keyframeProgress = (progress * (y.length - 1)) % 1
      const startY = y[keyframeIndex] || 0
      const endY = y[keyframeIndex + 1] || startY
      transform.position[1] = startY + (endY - startY) * keyframeProgress
    } else {
      transform.position[1] = y * Math.sin(progress * Math.PI)
    }
  }

  // 拍击
  if (boneData.clap) {
    const { axis, amplitude, frequency } = boneData.clap
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
    const clapValue = Math.abs(Math.sin(progress * Math.PI * frequency)) * amplitude
    transform.rotation[axisIndex] = clapValue
  }

  // 点头
  if (boneData.nod) {
    const { axis, amplitude, frequency } = boneData.nod
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
    const nodValue = Math.sin(progress * Math.PI * 2 * frequency) * amplitude
    transform.rotation[axisIndex] = nodValue
  }

  // 摇头
  if (boneData.shake) {
    const { axis, amplitude, frequency } = boneData.shake
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
    const shakeValue = Math.sin(progress * Math.PI * 2 * frequency) * amplitude
    transform.rotation[axisIndex] = shakeValue
  }

  // 鞠躬
  if (boneData.bow) {
    const { axis, amplitude } = boneData.bow
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
    const bowCurve = Math.sin(progress * Math.PI) * amplitude
    transform.rotation[axisIndex] = bowCurve
  }

  // 转身
  if (boneData.turn) {
    const { axis, amplitude } = boneData.turn
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
    transform.rotation[axisIndex] = amplitude * easedProgress
  }

  // 扭曲
  if (boneData.twist) {
    const { axis, amplitude, frequency } = boneData.twist
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
    const twistValue = Math.sin(progress * Math.PI * 2 * frequency) * amplitude
    transform.rotation[axisIndex] = twistValue
  }

  // 倾斜
  if (boneData.lean) {
    const { axis, amplitude } = boneData.lean
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
    transform.rotation[axisIndex] = amplitude * easedProgress
  }

  // 伸展
  if (boneData.stretch) {
    const { axis, amplitude } = boneData.stretch
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
    transform.rotation[axisIndex] = amplitude * easedProgress
  }

  // 踢腿
  if (boneData.kick) {
    const { axis, amplitude } = boneData.kick
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
    const kickCurve = Math.sin(progress * Math.PI) * amplitude
    transform.rotation[axisIndex] = kickCurve
  }

  // 步伐
  if (boneData.step) {
    const { axis, amplitude, frequency, phase = 0 } = boneData.step
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
    const stepValue = Math.sin(progress * Math.PI * 2 * frequency + phase) * amplitude
    transform.rotation[axisIndex] = stepValue
  }

  // 滑动
  if (boneData.slide) {
    const { axis, amplitude, frequency, phase = 0 } = boneData.slide
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
    const slideValue = Math.sin(progress * Math.PI * 2 * frequency + phase) * amplitude
    transform.rotation[axisIndex] = slideValue
  }

  // 旋转
  if (boneData.spin) {
    const { axis, amplitude } = boneData.spin
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
    transform.rotation[axisIndex] = amplitude * progress
  }

  // 弹跳
  if (boneData.bounce) {
    const { axis, amplitude, frequency } = boneData.bounce
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
    const bounceValue = Math.abs(Math.sin(progress * Math.PI * frequency)) * amplitude
    transform.position[axisIndex] = bounceValue
  }

  // 呼吸
  if (boneData.breathe) {
    const { axis, amplitude, frequency } = boneData.breathe
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
    const breatheValue = Math.sin(progress * Math.PI * 2 * frequency) * amplitude
    transform.rotation[axisIndex] = breatheValue
  }

  return transform
}

// 解析动作数据生成关键帧
export function parseActionToKeyframes(actionName, fps = 30) {
  // 尝试从基础数据获取
  let actionData = getActionData(actionName)
  
  // 如果基础数据没有，尝试从扩展数据获取
  if (!actionData) {
    actionData = getExtendedActionData(actionName)
  }

  if (!actionData) {
    console.warn(`动作 "${actionName}" 未找到`)
    return null
  }

  const { duration, bones, loop = false } = actionData
  const totalFrames = Math.ceil((duration / 1000) * fps)
  const keyframes = []

  for (let i = 0; i <= totalFrames; i++) {
    const progress = i / totalFrames
    const frame = {
      time: (i / fps) * 1000, // 毫秒
      bones: {}
    }

    // 计算每个骨骼的变换
    for (const [boneName, boneData] of Object.entries(bones)) {
      frame.bones[boneName] = calculateBoneTransform(boneData, progress)
    }

    keyframes.push(frame)
  }

  return {
    name: actionName,
    duration,
    loop,
    fps,
    keyframes,
    totalFrames: keyframes.length
  }
}

// 获取动作在特定时间点的骨骼状态
export function getActionPoseAtTime(actionName, time) {
  const keyframes = parseActionToKeyframes(actionName)
  if (!keyframes) return null

  const { duration, keyframes: frames } = keyframes
  
  // 循环处理
  let adjustedTime = time % duration
  if (adjustedTime < 0) adjustedTime += duration

  // 找到对应的关键帧
  const progress = adjustedTime / duration
  const frameIndex = Math.floor(progress * (frames.length - 1))
  const nextFrameIndex = Math.min(frameIndex + 1, frames.length - 1)
  const frameProgress = (progress * (frames.length - 1)) % 1

  const currentFrame = frames[frameIndex]
  const nextFrame = frames[nextFrameIndex]

  // 插值计算
  const pose = { bones: {} }
  for (const boneName of Object.keys(currentFrame.bones)) {
    const current = currentFrame.bones[boneName]
    const next = nextFrame.bones[boneName]

    pose.bones[boneName] = {
      rotation: current.rotation.map((v, i) => v + (next.rotation[i] - v) * frameProgress),
      position: current.position.map((v, i) => v + (next.position[i] - v) * frameProgress)
    }
  }

  return pose
}

// 批量解析多个动作
export function parseMultipleActions(actionNames, fps = 30) {
  const results = {}
  for (const name of actionNames) {
    const keyframes = parseActionToKeyframes(name, fps)
    if (keyframes) {
      results[name] = keyframes
    }
  }
  return results
}

// 获取所有可用动作名称
export function getAllActionNames() {
  const { basicActionNames, sexyActionNames } = require('../data/mmdActionData.js')
  const { expressionActionNames, coolActionNames, specialActionNames } = require('../data/mmdActionDataExtended.js')
  
  return [
    ...basicActionNames,
    ...sexyActionNames,
    ...expressionActionNames,
    ...coolActionNames,
    ...specialActionNames
  ]
}

// 获取动作分类
export function getActionCategories() {
  return {
    基础: require('../data/mmdActionData.js').basicActionNames,
    涩涩: require('../data/mmdActionData.js').sexyActionNames,
    舞蹈: require('../data/mmdActionData.js').danceActionNames,
    表情: require('../data/mmdActionDataExtended.js').expressionActionNames,
    酷炫: require('../data/mmdActionDataExtended.js').coolActionNames,
    特殊: require('../data/mmdActionDataExtended.js').specialActionNames
  }
}

// 预缓存常用动作
const actionCache = new Map()

export function getCachedAction(actionName, fps = 30) {
  const cacheKey = `${actionName}_${fps}`
  
  if (actionCache.has(cacheKey)) {
    return actionCache.get(cacheKey)
  }

  const action = parseActionToKeyframes(actionName, fps)
  if (action) {
    actionCache.set(cacheKey, action)
  }
  
  return action
}

// 清除缓存
export function clearActionCache() {
  actionCache.clear()
}

// 导出默认对象
export default {
  parseActionToKeyframes,
  getActionPoseAtTime,
  parseMultipleActions,
  getAllActionNames,
  getActionCategories,
  getCachedAction,
  clearActionCache,
  easingFunctions
}
