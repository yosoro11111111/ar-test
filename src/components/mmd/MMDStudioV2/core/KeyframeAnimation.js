/**
 * 关键帧动画系统
 *
 * 功能：
 * - 关键帧编辑（位置、旋转、缩放）
 * - 贝塞尔曲线插值
 * - 动画层管理
 * - 动画混合
 * - 反向动力学(IK)
 */

export class KeyframeAnimation {
  constructor() {
    this.animations = new Map() // 存储所有动画数据
    this.animationLayers = new Map() // 动画层
    this.ikSolvers = new Map() // IK求解器

    this.isPlaying = false
    this.currentTime = 0
    this.duration = 0

    // 默认插值类型
    this.defaultInterpolation = 'bezier' // 'linear', 'bezier', 'step'
  }

  /**
   * 创建新动画
   */
  createAnimation(id, targetId, targetType) {
    const animation = {
      id,
      targetId,
      targetType, // 'character', 'prop', 'camera'
      duration: 10,
      tracks: {
        position: [],
        rotation: [],
        scale: []
      },
      createdAt: Date.now()
    }

    this.animations.set(id, animation)
    return animation
  }

  /**
   * 添加关键帧
   */
  addKeyframe(animationId, trackType, time, value, options = {}) {
    const animation = this.animations.get(animationId)
    if (!animation) return null

    const keyframe = {
      id: `kf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      time,
      value: { ...value }, // 克隆值
      interpolation: options.interpolation || this.defaultInterpolation,
      easing: options.easing || 'easeInOut',
      // 贝塞尔曲线控制点
      inTangent: options.inTangent || { x: 0.33, y: 0 },
      outTangent: options.outTangent || { x: 0.66, y: 0 }
    }

    const track = animation.tracks[trackType]
    if (!track) return null

    // 插入到正确位置（按时间排序）
    const insertIndex = track.findIndex(kf => kf.time > time)
    if (insertIndex === -1) {
      track.push(keyframe)
    } else {
      track.splice(insertIndex, 0, keyframe)
    }

    // 更新动画时长
    this.updateDuration(animationId)

    return keyframe
  }

  /**
   * 更新关键帧
   */
  updateKeyframe(animationId, trackType, keyframeId, updates) {
    const animation = this.animations.get(animationId)
    if (!animation) return false

    const track = animation.tracks[trackType]
    if (!track) return false

    const keyframe = track.find(kf => kf.id === keyframeId)
    if (!keyframe) return false

    Object.assign(keyframe, updates)

    // 如果时间改变，重新排序
    if (updates.time !== undefined && updates.time !== keyframe.time) {
      track.sort((a, b) => a.time - b.time)
      this.updateDuration(animationId)
    }

    return true
  }

  /**
   * 删除关键帧
   */
  deleteKeyframe(animationId, trackType, keyframeId) {
    const animation = this.animations.get(animationId)
    if (!animation) return false

    const track = animation.tracks[trackType]
    if (!track) return false

    const index = track.findIndex(kf => kf.id === keyframeId)
    if (index === -1) return false

    track.splice(index, 1)
    this.updateDuration(animationId)

    return true
  }

  /**
   * 更新动画时长
   */
  updateDuration(animationId) {
    const animation = this.animations.get(animationId)
    if (!animation) return

    let maxTime = 0
    Object.values(animation.tracks).forEach(track => {
      track.forEach(kf => {
        if (kf.time > maxTime) maxTime = kf.time
      })
    })

    animation.duration = maxTime
  }

  /**
   * 获取关键帧值（插值计算）
   */
  getValueAtTime(animationId, trackType, time) {
    const animation = this.animations.get(animationId)
    if (!animation) return null

    const track = animation.tracks[trackType]
    if (!track || track.length === 0) return null

    // 找到前后关键帧
    const nextIndex = track.findIndex(kf => kf.time >= time)

    if (nextIndex === -1) {
      // 超过最后一个关键帧
      return track[track.length - 1].value
    }

    if (nextIndex === 0) {
      // 在第一个关键帧之前
      return track[0].value
    }

    const prevKeyframe = track[nextIndex - 1]
    const nextKeyframe = track[nextIndex]

    // 计算插值系数
    const t = (time - prevKeyframe.time) / (nextKeyframe.time - prevKeyframe.time)

    // 根据插值类型计算值
    switch (prevKeyframe.interpolation) {
      case 'linear':
        return this.interpolateLinear(prevKeyframe.value, nextKeyframe.value, t)
      case 'bezier':
        return this.interpolateBezier(
          prevKeyframe.value,
          nextKeyframe.value,
          t,
          prevKeyframe.outTangent,
          nextKeyframe.inTangent
        )
      case 'step':
        return prevKeyframe.value
      default:
        return this.interpolateLinear(prevKeyframe.value, nextKeyframe.value, t)
    }
  }

  /**
   * 线性插值
   */
  interpolateLinear(value1, value2, t) {
    const result = {}
    for (const key in value1) {
      if (typeof value1[key] === 'number') {
        result[key] = value1[key] + (value2[key] - value1[key]) * t
      } else {
        result[key] = value1[key]
      }
    }
    return result
  }

  /**
   * 贝塞尔曲线插值
   */
  interpolateBezier(value1, value2, t, outTangent, inTangent) {
    // 三次贝塞尔曲线
    const bezierT = this.solveCubicBezier(t, outTangent.x, inTangent.x)
    return this.interpolateLinear(value1, value2, bezierT)
  }

  /**
   * 求解三次贝塞尔曲线
   */
  solveCubicBezier(t, p1, p2) {
    // 简化的贝塞尔求解
    const mt = 1 - t
    return 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t
  }

  /**
   * 创建动画层
   */
  createAnimationLayer(id, name, options = {}) {
    const layer = {
      id,
      name,
      weight: options.weight || 1.0,
      enabled: options.enabled !== false,
      additive: options.additive || false,
      animations: [], // 该层包含的动画
      mask: options.mask || null // 骨骼遮罩
    }

    this.animationLayers.set(id, layer)
    return layer
  }

  /**
   * 添加动画到层
   */
  addAnimationToLayer(layerId, animationId) {
    const layer = this.animationLayers.get(layerId)
    if (!layer) return false

    if (!layer.animations.includes(animationId)) {
      layer.animations.push(animationId)
    }

    return true
  }

  /**
   * 设置层权重
   */
  setLayerWeight(layerId, weight) {
    const layer = this.animationLayers.get(layerId)
    if (!layer) return false

    layer.weight = Math.max(0, Math.min(1, weight))
    return true
  }

  /**
   * 启用/禁用层
   */
  setLayerEnabled(layerId, enabled) {
    const layer = this.animationLayers.get(layerId)
    if (!layer) return false

    layer.enabled = enabled
    return true
  }

  /**
   * 混合多层动画
   */
  blendAnimations(time) {
    const blendedResults = new Map()

    // 按优先级排序层
    const sortedLayers = Array.from(this.animationLayers.values())
      .filter(layer => layer.enabled)
      .sort((a, b) => (a.priority || 0) - (b.priority || 0))

    sortedLayers.forEach(layer => {
      layer.animations.forEach(animationId => {
        const animation = this.animations.get(animationId)
        if (!animation) return

        const result = this.evaluateAnimation(animationId, time)
        if (!result) return

        const targetId = animation.targetId
        const existing = blendedResults.get(targetId)

        if (!existing) {
          blendedResults.set(targetId, {
            ...result,
            weight: layer.weight
          })
        } else {
          // 混合值
          blendedResults.set(targetId, this.blendValues(existing, result, layer.weight))
        }
      })
    })

    return blendedResults
  }

  /**
   * 评估动画在给定时间的值
   */
  evaluateAnimation(animationId, time) {
    const animation = this.animations.get(animationId)
    if (!animation) return null

    const result = {
      position: this.getValueAtTime(animationId, 'position', time),
      rotation: this.getValueAtTime(animationId, 'rotation', time),
      scale: this.getValueAtTime(animationId, 'scale', time)
    }

    return result
  }

  /**
   * 混合两个值
   */
  blendValues(value1, value2, weight) {
    const result = { weight: Math.max(value1.weight, weight) }

    if (value1.position && value2.position) {
      result.position = {
        x: value1.position.x * (1 - weight) + value2.position.x * weight,
        y: value1.position.y * (1 - weight) + value2.position.y * weight,
        z: value1.position.z * (1 - weight) + value2.position.z * weight
      }
    }

    if (value1.rotation && value2.rotation) {
      result.rotation = {
        x: value1.rotation.x * (1 - weight) + value2.rotation.x * weight,
        y: value1.rotation.y * (1 - weight) + value2.rotation.y * weight,
        z: value1.rotation.z * (1 - weight) + value2.rotation.z * weight
      }
    }

    if (value1.scale && value2.scale) {
      result.scale = value1.scale * (1 - weight) + value2.scale * weight
    }

    return result
  }

  /**
   * 创建IK求解器
   */
  createIKSolver(id, targetBone, effectorBone, iterations = 10) {
    const solver = {
      id,
      targetBone,
      effectorBone,
      iterations,
      enabled: true,
      chain: [], // IK链
      poleTarget: null // 极向目标（膝盖/肘部方向）
    }

    this.ikSolvers.set(id, solver)
    return solver
  }

  /**
   * 求解IK
   */
  solveIK(solverId, targetPosition) {
    const solver = this.ikSolvers.get(solverId)
    if (!solver || !solver.enabled) return null

    // 简化的CCD IK算法
    // 实际实现需要访问骨骼系统
    console.log('求解IK:', solverId, '目标位置:', targetPosition)

    return {
      position: targetPosition,
      rotation: { x: 0, y: 0, z: 0 }
    }
  }

  /**
   * 设置IK极向目标
   */
  setIKPoleTarget(solverId, polePosition) {
    const solver = this.ikSolvers.get(solverId)
    if (!solver) return false

    solver.poleTarget = polePosition
    return true
  }

  /**
   * 导出动画数据
   */
  exportAnimation(animationId) {
    const animation = this.animations.get(animationId)
    if (!animation) return null

    return JSON.stringify(animation, null, 2)
  }

  /**
   * 导入动画数据
   */
  importAnimation(jsonData) {
    try {
      const animation = JSON.parse(jsonData)
      animation.id = `${animation.id}_imported_${Date.now()}`
      this.animations.set(animation.id, animation)
      return animation
    } catch (error) {
      console.error('导入动画失败:', error)
      return null
    }
  }

  /**
   * 清理
   */
  dispose() {
    this.animations.clear()
    this.animationLayers.clear()
    this.ikSolvers.clear()
  }
}
