// 录制管理器 - 处理 GIF 和视频录制

class RecordingManager {
  constructor() {
    this.mediaRecorder = null
    this.recordedChunks = []
    this.isRecording = false
    this.recordingType = null
    this.canvas = null
    this.stream = null
    this.onProgress = null
    this.onComplete = null
    this.onError = null
    this.recordingTimer = null
    this.startTime = 0
    this.frames = []
    this.outputCanvas = null
    this.outputCtx = null
    this.gifEncoder = null
  }

  async startRecording(options = {}) {
    const { type, canvas, onProgress, onComplete, onError, duration = 5000 } = options

    this.recordingType = type
    this.canvas = canvas
    this.onProgress = onProgress
    this.onComplete = onComplete
    this.onError = onError
    this.recordedChunks = []
    this.frames = []
    this.isRecording = true
    this.startTime = Date.now()

    try {
      if (type === 'video') {
        await this.startVideoRecording(duration)
      } else if (type === 'gif') {
        await this.startGIFRecording(duration)
      }

      return true
    } catch (error) {
      console.error('开始录制失败:', error)
      this.isRecording = false
      this.onError?.(error)
      return false
    }
  }

  async startVideoRecording(duration) {
    console.log('📹 开始高清视频录制，时长:', duration)

    // 获取原始 canvas 尺寸
    const originalWidth = this.canvas.width
    const originalHeight = this.canvas.height
    console.log('原始分辨率:', originalWidth, 'x', originalHeight)

    // 使用原始分辨率
    this.stream = this.canvas.captureStream(30)

    // 尝试获取摄像头 - 使用更宽松的约束
    let hasCamera = false
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      })

      // 合并视频流
      const combinedStream = new MediaStream([
        ...this.stream.getVideoTracks(),
        ...cameraStream.getAudioTracks()
      ])

      this.mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 8000000 // 8Mbps 高清
      })
      hasCamera = true
      console.log('✅ 摄像头已启用')
    } catch (err) {
      console.warn('摄像头获取失败，仅录制画面:', err.message)
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 8000000
      })
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.recordedChunks.push(event.data)
    }

    this.mediaRecorder.onstop = () => this.finishVideoRecording(hasCamera)
    this.mediaRecorder.start(100)

    this.recordingTimer = setTimeout(() => this.stopRecording(), duration)
    this.updateProgress(duration)
  }

  async startGIFRecording(duration) {
    console.log('🎞️ 开始高清 GIF 录制，时长:', duration)

    // 获取原始 canvas 尺寸
    const originalWidth = this.canvas.width
    const originalHeight = this.canvas.height
    
    // 使用更高的分辨率（但限制最大尺寸以避免内存问题）
    const maxDimension = 640
    let targetWidth = originalWidth
    let targetHeight = originalHeight
    
    if (originalWidth > maxDimension || originalHeight > maxDimension) {
      const ratio = Math.min(maxDimension / originalWidth, maxDimension / originalHeight)
      targetWidth = Math.floor(originalWidth * ratio)
      targetHeight = Math.floor(originalHeight * ratio)
    }

    console.log('录制分辨率:', targetWidth, 'x', targetHeight)

    // 创建输出 canvas
    this.outputCanvas = document.createElement('canvas')
    this.outputCanvas.width = targetWidth
    this.outputCanvas.height = targetHeight
    this.outputCtx = this.outputCanvas.getContext('2d', { willReadFrequently: true })

    // 设置帧率
    const fps = 20
    const frameInterval = 1000 / fps
    const totalFrames = Math.floor(duration / frameInterval)

    console.log('目标帧数:', totalFrames, '帧率:', fps)

    // 存储所有帧
    this.frames = []
    let frameCount = 0

    // 捕获每一帧
    const captureFrame = () => {
      if (!this.isRecording || frameCount >= totalFrames) {
        console.log('🎞️ 帧捕获完成，帧数:', this.frames.length)
        this.finishGIFRecording(fps, targetWidth, targetHeight)
        return
      }

      try {
        // 绘制高清帧
        this.outputCtx.drawImage(this.canvas, 0, 0, targetWidth, targetHeight)
        
        // 获取图像数据
        const imageData = this.outputCtx.getImageData(0, 0, targetWidth, targetHeight)
        this.frames.push(imageData.data)

        frameCount++
        this.onProgress?.((frameCount / totalFrames) * 100)

        this.recordingTimer = setTimeout(captureFrame, frameInterval)
      } catch (e) {
        console.error('捕获帧失败:', e)
        this.onError?.(e)
      }
    }

    captureFrame()
  }

  async finishGIFRecording(fps, width, height) {
    try {
      if (this.frames.length === 0) {
        this.onError?.(new Error('没有捕获到帧'))
        return
      }

      console.log('🎞️ 开始生成高清 GIF...')
      this.onProgress?.(95)

      // 使用 canvas 将帧序列转换为视频（质量更好）
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      const stream = canvas.captureStream(fps)
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000
      })

      const chunks = []
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)

        console.log('🎞️ 高清录制完成，大小:', (blob.size / 1024).toFixed(2) + 'KB')

        this.onComplete?.({
          type: 'gif',
          blob,
          url,
          filename: `recording_${Date.now()}.webm`,
          size: blob.size,
          width,
          height
        })

        this.isRecording = false
        this.frames = [] // 清理内存

        // 自动下载
        this.autoDownload(url, `recording_${Date.now()}.webm`)

        alert(`✅ 高清录制完成！已自动下载\n分辨率: ${width}x${height}\n文件大小: ${(blob.size / 1024).toFixed(2)} KB`)
      }

      mediaRecorder.start()

      // 逐帧绘制（使用 ImageData 直接绘制，保持质量）
      let frameIndex = 0
      const drawFrame = () => {
        if (frameIndex >= this.frames.length) {
          mediaRecorder.stop()
          return
        }

        const frameData = this.frames[frameIndex]
        const imageData = new ImageData(
          new Uint8ClampedArray(frameData),
          width,
          height
        )
        ctx.putImageData(imageData, 0, 0)
        frameIndex++

        setTimeout(drawFrame, 1000 / fps)
      }

      drawFrame()

    } catch (error) {
      console.error('生成失败:', error)
      this.onError?.(error)
      alert('❌ 生成失败: ' + error.message)
    }
  }

  updateProgress(duration) {
    const update = () => {
      if (!this.isRecording) return
      const elapsed = Date.now() - this.startTime
      this.onProgress?.(Math.min((elapsed / duration) * 100, 95))
      if (elapsed < duration) requestAnimationFrame(update)
    }
    update()
  }

  stopRecording() {
    if (!this.isRecording) return
    this.isRecording = false

    if (this.recordingTimer) {
      clearTimeout(this.recordingTimer)
      this.recordingTimer = null
    }

    if (this.recordingType === 'video' && this.mediaRecorder) {
      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop()
      }
      this.stream?.getTracks().forEach(track => track.stop())
    }
  }

  finishVideoRecording(hasCamera) {
    if (this.recordedChunks.length === 0) {
      this.onError?.(new Error('没有录制到数据'))
      return
    }

    const blob = new Blob(this.recordedChunks, { type: 'video/webm' })
    const url = URL.createObjectURL(blob)

    console.log('📹 视频录制完成，大小:', (blob.size / 1024 / 1024).toFixed(2) + 'MB')

    this.onComplete?.({
      type: 'video',
      blob,
      url,
      filename: `recording_${Date.now()}.webm`,
      size: blob.size,
      hasCamera
    })

    this.autoDownload(url, `recording_${Date.now()}.webm`)

    const cameraStatus = hasCamera ? '（含摄像头）' : '（仅画面）'
    alert(`✅ 高清视频录制完成！已自动下载${cameraStatus}\n文件大小: ${(blob.size / 1024 / 1024).toFixed(2)} MB`)
  }

  autoDownload(url, filename) {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  downloadFile(url, filename) {
    this.autoDownload(url, filename)
    alert(`💾 文件已下载: ${filename}`)
  }

  dispose() {
    this.stopRecording()
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    this.mediaRecorder = null
    this.canvas = null
    this.isRecording = false
    this.frames = []
    this.outputCanvas = null
    this.outputCtx = null
  }
}

export default new RecordingManager()
