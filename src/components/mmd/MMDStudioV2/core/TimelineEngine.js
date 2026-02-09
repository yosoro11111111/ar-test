/**
 * 时间轴引擎
 * 
 * 功能：
 * - 播放控制
 * - 关键帧插值
 * - 动画混合
 * - 时间更新
 */
export class TimelineEngine {
  constructor() {
    this.currentTime = 0
    this.isPlaying = false
    this.duration = 120
    this.fps = 60
    this.playbackRate = 1
    
    this.listeners = new Set()
    this.animationFrameId = null
    this.lastFrameTime = 0
  }

  /**
   * 添加监听器
   */
  addListener(callback) {
    this.listeners.add(callback)
  }

  /**
   * 移除监听器
   */
  removeListener(callback) {
    this.listeners.delete(callback)
  }

  /**
   * 通知所有监听器
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentTime)
      } catch (error) {
        console.error('时间轴监听器错误:', error)
      }
    })
  }

  /**
   * 播放
   */
  play() {
    if (this.isPlaying) return
    
    this.isPlaying = true
    this.lastFrameTime = performance.now()
    this.tick()
  }

  /**
   * 暂停
   */
  pause() {
    this.isPlaying = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  /**
   * 停止
   */
  stop() {
    this.pause()
    this.currentTime = 0
    this.notifyListeners()
  }

  /**
   * 跳转到指定时间
   */
  seek(time) {
    this.currentTime = Math.max(0, Math.min(time, this.duration))
    this.notifyListeners()
  }

  /**
   * 前进一帧
   */
  nextFrame() {
    const frameTime = 1 / this.fps
    this.seek(this.currentTime + frameTime)
  }

  /**
   * 后退一帧
   */
  prevFrame() {
    const frameTime = 1 / this.fps
    this.seek(this.currentTime - frameTime)
  }

  /**
   * 跳转到开头
   */
  goToStart() {
    this.seek(0)
  }

  /**
   * 跳转到结尾
   */
  goToEnd() {
    this.seek(this.duration)
  }

  /**
   * 设置播放速度
   */
  setPlaybackRate(rate) {
    this.playbackRate = Math.max(0.1, Math.min(rate, 3))
  }

  /**
   * 动画循环
   */
  tick() {
    if (!this.isPlaying) return

    const currentTime = performance.now()
    const deltaTime = (currentTime - this.lastFrameTime) / 1000
    this.lastFrameTime = currentTime

    // 更新时间
    this.currentTime += deltaTime * this.playbackRate

    // 循环或停止
    if (this.currentTime >= this.duration) {
      this.currentTime = this.duration
      this.pause()
    }

    // 通知监听器
    this.notifyListeners()

    // 继续下一帧
    this.animationFrameId = requestAnimationFrame(() => this.tick())
  }

  /**
   * 获取当前帧数
   */
  getCurrentFrame() {
    return Math.floor(this.currentTime * this.fps)
  }

  /**
   * 设置持续时间
   */
  setDuration(duration) {
    this.duration = Math.max(1, duration)
    if (this.currentTime > this.duration) {
      this.currentTime = this.duration
    }
  }

  /**
   * 设置帧率
   */
  setFps(fps) {
    this.fps = Math.max(1, Math.min(fps, 120))
  }

  /**
   * 获取当前时间点的关键帧
   */
  getKeyframesAtTime(trackId, time) {
    // 这里可以实现关键帧查询逻辑
    return []
  }

  /**
   * 插值计算
   */
  interpolate(startValue, endValue, t, easing = 'linear') {
    switch (easing) {
      case 'linear':
        return startValue + (endValue - startValue) * t
      case 'easeIn':
        return startValue + (endValue - startValue) * (t * t)
      case 'easeOut':
        return startValue + (endValue - startValue) * (1 - (1 - t) * (1 - t))
      case 'easeInOut':
        return startValue + (endValue - startValue) * (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
      default:
        return startValue + (endValue - startValue) * t
    }
  }

  /**
   * 销毁
   */
  dispose() {
    this.pause()
    this.listeners.clear()
  }
}
