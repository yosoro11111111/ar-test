/**
 * 转场效果系统
 *
 * 功能：
 * - 淡入淡出
 * - 划像
 * - 溶解
 * - 擦除
 * - 自定义转场
 */

export class TransitionEffects {
  constructor() {
    this.effects = new Map()
    this.activeTransitions = new Map()

    // 内置转场效果
    this.builtinEffects = {
      fade: {
        name: '淡入淡出',
        duration: 1.0,
        shader: 'fade'
      },
      wipe: {
        name: '划像',
        duration: 1.0,
        shader: 'wipe',
        direction: 'left' // left, right, up, down
      },
      dissolve: {
        name: '溶解',
        duration: 1.0,
        shader: 'dissolve'
      },
      slide: {
        name: '滑动',
        duration: 1.0,
        shader: 'slide',
        direction: 'left'
      },
      zoom: {
        name: '缩放',
        duration: 1.0,
        shader: 'zoom',
        type: 'in' // in, out
      },
      blur: {
        name: '模糊过渡',
        duration: 1.0,
        shader: 'blur'
      },
      pixelate: {
        name: '像素化',
        duration: 1.0,
        shader: 'pixelate'
      },
      ripple: {
        name: '波纹',
        duration: 1.0,
        shader: 'ripple'
      }
    }
  }

  /**
   * 创建转场效果
   */
  createTransition(id, type, options = {}) {
    const builtin = this.builtinEffects[type]
    if (!builtin) {
      console.warn(`未知的转场类型: ${type}`)
      return null
    }

    const transition = {
      id,
      type,
      name: options.name || builtin.name,
      duration: options.duration || builtin.duration,
      easing: options.easing || 'easeInOut',
      params: { ...builtin, ...options.params }
    }

    this.effects.set(id, transition)
    return transition
  }

  /**
   * 应用转场效果
   */
  applyTransition(fromClip, toClip, transitionId, time) {
    const transition = this.effects.get(transitionId)
    if (!transition) return null

    const progress = Math.max(0, Math.min(1, time / transition.duration))
    const easedProgress = this.applyEasing(progress, transition.easing)

    const activeTransition = {
      id: `${transitionId}_${Date.now()}`,
      transition,
      fromClip,
      toClip,
      progress: easedProgress,
      isComplete: progress >= 1
    }

    this.activeTransitions.set(activeTransition.id, activeTransition)
    return activeTransition
  }

  /**
   * 更新转场进度
   */
  updateTransition(transitionId, time) {
    const active = this.activeTransitions.get(transitionId)
    if (!active) return null

    const progress = Math.max(0, Math.min(1, time / active.transition.duration))
    active.progress = this.applyEasing(progress, active.transition.easing)
    active.isComplete = progress >= 1

    return active
  }

  /**
   * 应用缓动函数
   */
  applyEasing(t, easing) {
    switch (easing) {
      case 'linear':
        return t
      case 'easeIn':
        return t * t
      case 'easeOut':
        return 1 - (1 - t) * (1 - t)
      case 'easeInOut':
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      case 'bounce':
        if (t < 1 / 2.75) {
          return 7.5625 * t * t
        } else if (t < 2 / 2.75) {
          return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
        } else if (t < 2.5 / 2.75) {
          return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
        } else {
          return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375
        }
      default:
        return t
    }
  }

  /**
   * 获取转场混合值
   */
  getBlendValue(transitionId) {
    const active = this.activeTransitions.get(transitionId)
    if (!active) return { from: 1, to: 0 }

    const progress = active.progress

    switch (active.transition.type) {
      case 'fade':
        return {
          from: 1 - progress,
          to: progress
        }
      case 'wipe':
      case 'slide':
        return {
          from: progress < 0.5 ? 1 : 0,
          to: progress >= 0.5 ? 1 : 0
        }
      default:
        return {
          from: 1 - progress,
          to: progress
        }
    }
  }

  /**
   * 获取所有内置效果
   */
  getBuiltinEffects() {
    return Object.entries(this.builtinEffects).map(([id, effect]) => ({
      id,
      ...effect
    }))
  }

  /**
   * 删除转场效果
   */
  removeTransition(id) {
    this.effects.delete(id)
    this.activeTransitions.delete(id)
  }

  /**
   * 清理已完成的转场
   */
  cleanupCompletedTransitions() {
    this.activeTransitions.forEach((active, id) => {
      if (active.isComplete) {
        this.activeTransitions.delete(id)
      }
    })
  }

  /**
   * 导出转场配置
   */
  exportTransition(id) {
    const transition = this.effects.get(id)
    if (!transition) return null

    return JSON.stringify(transition)
  }

  /**
   * 导入转场配置
   */
  importTransition(json) {
    try {
      const transition = JSON.parse(json)
      transition.id = `${transition.id}_imported_${Date.now()}`
      this.effects.set(transition.id, transition)
      return transition
    } catch (error) {
      console.error('导入转场配置失败:', error)
      return null
    }
  }

  /**
   * 清理资源
   */
  dispose() {
    this.effects.clear()
    this.activeTransitions.clear()
  }
}
