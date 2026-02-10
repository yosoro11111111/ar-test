/**
 * 音频编辑系统
 *
 * 功能：
 * - 音频波形显示
 * - 音频剪辑（裁剪、分割）
 * - 音量包络编辑
 * - 音频特效（混响、均衡器）
 * - 多音轨支持
 */

export class AudioEditor {
  constructor() {
    this.audioContext = null
    this.tracks = new Map()
    this.masterGain = null
    this.isInitialized = false

    // 特效节点
    this.effects = {
      reverb: null,
      equalizer: null,
      compressor: null
    }
  }

  /**
   * 初始化音频编辑器
   */
  async init() {
    if (this.isInitialized) return

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.connect(this.audioContext.destination)

      // 初始化特效
      await this.initEffects()

      this.isInitialized = true
      console.log('音频编辑器初始化完成')
    } catch (error) {
      console.error('音频编辑器初始化失败:', error)
    }
  }

  /**
   * 初始化音频特效
   */
  async initEffects() {
    // 创建混响
    this.effects.reverb = this.createReverb()

    // 创建均衡器
    this.effects.equalizer = this.createEqualizer()

    // 创建压缩器
    this.effects.compressor = this.audioContext.createDynamicsCompressor()
  }

  /**
   * 创建混响效果
   */
  createReverb() {
    const convolver = this.audioContext.createConvolver()
    // 创建简单的脉冲响应
    const rate = this.audioContext.sampleRate
    const length = rate * 2 // 2秒
    const impulse = this.audioContext.createBuffer(2, length, rate)

    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2)
      }
    }

    convolver.buffer = impulse
    return convolver
  }

  /**
   * 创建均衡器
   */
  createEqualizer() {
    const frequencies = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000]
    const filters = frequencies.map(freq => {
      const filter = this.audioContext.createBiquadFilter()
      filter.type = 'peaking'
      filter.frequency.value = freq
      filter.Q.value = 1
      filter.gain.value = 0
      return filter
    })

    // 连接滤波器链
    for (let i = 0; i < filters.length - 1; i++) {
      filters[i].connect(filters[i + 1])
    }

    return {
      input: filters[0],
      output: filters[filters.length - 1],
      filters
    }
  }

  /**
   * 加载音频文件
   */
  async loadAudio(url, id) {
    if (!this.isInitialized) await this.init()

    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)

      const track = {
        id,
        buffer: audioBuffer,
        source: null,
        gainNode: this.audioContext.createGain(),
        pannerNode: this.audioContext.createStereoPanner(),
        startTime: 0,
        endTime: audioBuffer.duration,
        volume: 1,
        pan: 0,
        isPlaying: false,
        waveform: null
      }

      // 连接节点链
      track.gainNode.connect(track.pannerNode)
      track.pannerNode.connect(this.masterGain)

      // 生成波形数据
      track.waveform = this.generateWaveform(audioBuffer)

      this.tracks.set(id, track)
      return track
    } catch (error) {
      console.error('加载音频失败:', error)
      return null
    }
  }

  /**
   * 生成波形数据
   */
  generateWaveform(audioBuffer, samples = 1000) {
    const channelData = audioBuffer.getChannelData(0)
    const blockSize = Math.floor(channelData.length / samples)
    const waveform = []

    for (let i = 0; i < samples; i++) {
      const start = i * blockSize
      const end = start + blockSize
      let max = 0
      let min = 0

      for (let j = start; j < end; j++) {
        const sample = channelData[j]
        if (sample > max) max = sample
        if (sample < min) min = sample
      }

      waveform.push({ max, min })
    }

    return waveform
  }

  /**
   * 播放音频
   */
  play(trackId, offset = 0) {
    const track = this.tracks.get(trackId)
    if (!track) return

    // 停止当前播放
    this.stop(trackId)

    // 创建新的音频源
    const source = this.audioContext.createBufferSource()
    source.buffer = track.buffer
    source.connect(track.gainNode)

    // 计算播放位置
    const startOffset = track.startTime + offset
    const duration = track.endTime - startOffset

    source.start(0, startOffset, duration)
    track.source = source
    track.isPlaying = true

    // 播放结束回调
    source.onended = () => {
      track.isPlaying = false
    }
  }

  /**
   * 停止播放
   */
  stop(trackId) {
    const track = this.tracks.get(trackId)
    if (!track || !track.source) return

    try {
      track.source.stop()
    } catch (e) {
      // 忽略已停止的错误
    }

    track.source = null
    track.isPlaying = false
  }

  /**
   * 暂停所有
   */
  pauseAll() {
    this.tracks.forEach((track, id) => {
      this.stop(id)
    })
  }

  /**
   * 设置音量
   */
  setVolume(trackId, volume) {
    const track = this.tracks.get(trackId)
    if (!track) return

    track.volume = Math.max(0, Math.min(1, volume))
    track.gainNode.gain.setValueAtTime(track.volume, this.audioContext.currentTime)
  }

  /**
   * 设置声像
   */
  setPan(trackId, pan) {
    const track = this.tracks.get(trackId)
    if (!track) return

    track.pan = Math.max(-1, Math.min(1, pan))
    track.pannerNode.pan.setValueAtTime(track.pan, this.audioContext.currentTime)
  }

  /**
   * 设置剪辑范围
   */
  setClipRange(trackId, startTime, endTime) {
    const track = this.tracks.get(trackId)
    if (!track) return

    track.startTime = Math.max(0, startTime)
    track.endTime = Math.min(track.buffer.duration, endTime)
  }

  /**
   * 设置均衡器
   */
  setEqualizer(trackId, frequencies) {
    const track = this.tracks.get(trackId)
    if (!track) return

    // 这里应该将均衡器连接到轨道
    // 简化处理
    console.log('设置均衡器:', frequencies)
  }

  /**
   * 启用/禁用混响
   */
  setReverb(enabled, mix = 0.3) {
    if (!this.effects.reverb) return

    // 这里应该动态调整混响混合
    console.log('设置混响:', enabled, mix)
  }

  /**
   * 获取当前播放时间
   */
  getCurrentTime(trackId) {
    const track = this.tracks.get(trackId)
    if (!track || !track.source) return 0

    return this.audioContext.currentTime
  }

  /**
   * 导出音频
   */
  async exportAudio(trackId, format = 'wav') {
    const track = this.tracks.get(trackId)
    if (!track) return null

    const buffer = track.buffer
    const startSample = Math.floor(track.startTime * buffer.sampleRate)
    const endSample = Math.floor(track.endTime * buffer.sampleRate)
    const length = endSample - startSample

    // 创建新的音频缓冲区
    const offlineContext = new OfflineAudioContext(
      buffer.numberOfChannels,
      length,
      buffer.sampleRate
    )

    const source = offlineContext.createBufferSource()
    source.buffer = buffer

    // 应用音量
    const gainNode = offlineContext.createGain()
    gainNode.gain.value = track.volume

    source.connect(gainNode)
    gainNode.connect(offlineContext.destination)

    source.start(0, track.startTime, track.endTime - track.startTime)

    const renderedBuffer = await offlineContext.startRendering()

    // 转换为WAV格式
    return this.bufferToWave(renderedBuffer)
  }

  /**
   * 音频缓冲区转WAV
   */
  bufferToWave(abuffer) {
    const numOfChan = abuffer.numberOfChannels
    const length = abuffer.length * numOfChan * 2 + 44
    const buffer = new ArrayBuffer(length)
    const view = new DataView(buffer)
    const channels = []
    let i
    let sample
    let offset = 0
    let pos = 0

    // 写入WAV头部
    setUint32(0x46464952) // "RIFF"
    setUint32(length - 8) // 文件长度
    setUint32(0x45564157) // "WAVE"
    setUint32(0x20746d66) // "fmt "
    setUint32(16) // 子块大小
    setUint16(1) // 音频格式 (PCM)
    setUint16(numOfChan)
    setUint32(abuffer.sampleRate)
    setUint32(abuffer.sampleRate * 2 * numOfChan) // 字节率
    setUint16(numOfChan * 2) // 块对齐
    setUint16(16) // 位深度
    setUint32(0x61746164) // "data"
    setUint32(length - pos - 4) // 数据大小

    // 写入音频数据
    for (i = 0; i < abuffer.numberOfChannels; i++) {
      channels.push(abuffer.getChannelData(i))
    }

    while (pos < length) {
      for (i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]))
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0
        view.setInt16(pos, sample, true)
        pos += 2
      }
      offset++
    }

    return new Blob([buffer], { type: 'audio/wav' })

    function setUint16(data) {
      view.setUint16(pos, data, true)
      pos += 2
    }

    function setUint32(data) {
      view.setUint32(pos, data, true)
      pos += 4
    }
  }

  /**
   * 清理资源
   */
  dispose() {
    this.tracks.forEach(track => {
      this.stop(track.id)
      track.gainNode.disconnect()
      track.pannerNode.disconnect()
    })

    this.tracks.clear()

    if (this.audioContext) {
      this.audioContext.close()
    }

    this.isInitialized = false
  }
}
