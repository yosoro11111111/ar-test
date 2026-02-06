// 音乐管理器 - 处理音频播放
export class MusicManager {
  constructor() {
    this.audio = null
    this.isPlaying = false
    this.currentUrl = null
    this.volume = 1.0
    this.onTimeUpdate = null
  }

  // 加载音频
  load(url) {
    return new Promise((resolve, reject) => {
      if (this.audio) {
        this.audio.pause()
        this.audio = null
      }

      this.audio = new Audio(url)
      this.audio.volume = this.volume
      this.currentUrl = url

      this.audio.addEventListener('loadedmetadata', () => {
        resolve({
          duration: this.audio.duration,
          url: url
        })
      })

      this.audio.addEventListener('error', (e) => {
        reject(new Error('音频加载失败'))
      })

      // 时间更新回调
      this.audio.addEventListener('timeupdate', () => {
        if (this.onTimeUpdate) {
          this.onTimeUpdate(this.audio.currentTime)
        }
      })

      // 播放结束
      this.audio.addEventListener('ended', () => {
        this.isPlaying = false
      })
    })
  }

  // 播放
  play() {
    if (this.audio) {
      this.audio.play()
      this.isPlaying = true
    }
  }

  // 暂停
  pause() {
    if (this.audio) {
      this.audio.pause()
      this.isPlaying = false
    }
  }

  // 停止
  stop() {
    if (this.audio) {
      this.audio.pause()
      this.audio.currentTime = 0
      this.isPlaying = false
    }
  }

  // 设置当前时间
  setCurrentTime(time) {
    if (this.audio) {
      this.audio.currentTime = time
    }
  }

  // 设置音量
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume))
    if (this.audio) {
      this.audio.volume = this.volume
    }
  }

  // 获取当前时间
  getCurrentTime() {
    return this.audio ? this.audio.currentTime : 0
  }

  // 获取总时长
  getDuration() {
    return this.audio ? this.audio.duration : 0
  }

  // 销毁
  destroy() {
    if (this.audio) {
      this.audio.pause()
      this.audio = null
    }
    this.isPlaying = false
    this.currentUrl = null
  }
}

// 全局音乐管理器实例
let globalMusicManager = null

export const getMusicManager = () => {
  if (!globalMusicManager) {
    globalMusicManager = new MusicManager()
  }
  return globalMusicManager
}

export const destroyMusicManager = () => {
  if (globalMusicManager) {
    globalMusicManager.destroy()
    globalMusicManager = null
  }
}
