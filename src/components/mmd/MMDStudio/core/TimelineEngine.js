/**
 * TimelineEngine - 时间轴引擎
 * 管理播放、时间轴、片段编辑
 */
export class TimelineEngine {
  constructor() {
    this.currentTime = 0
    this.duration = 120
    this.isPlaying = false
    this.fps = 30
    this.tracks = []
  }

  // 播放
  play() {
    this.isPlaying = true
  }

  // 暂停
  pause() {
    this.isPlaying = false
  }

  // 停止
  stop() {
    this.isPlaying = false
    this.currentTime = 0
  }

  // 跳转到指定时间
  seek(time) {
    this.currentTime = Math.max(0, Math.min(time, this.duration))
  }

  // 添加轨道
  addTrack(track) {
    this.tracks.push(track)
  }

  // 删除轨道
  removeTrack(trackId) {
    this.tracks = this.tracks.filter(t => t.id !== trackId)
  }

  // 获取当前时间点的所有片段
  getClipsAtTime(time) {
    const clips = []
    this.tracks.forEach(track => {
      track.clips.forEach(clip => {
        if (time >= clip.start && time <= clip.end) {
          clips.push({ ...clip, trackId: track.id })
        }
      })
    })
    return clips
  }
}
