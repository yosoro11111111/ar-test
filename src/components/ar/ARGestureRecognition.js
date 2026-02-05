// AR手势识别模块 - 简化版
// 使用CDN加载MediaPipe Hands

export class ARGestureRecognition {
  constructor() {
    this.isInitialized = false
    this.isRunning = false
    this.videoElement = null
    this.canvasElement = null
    this.canvasCtx = null
    this.hands = null
    this.camera = null
    this.onGestureDetected = null
    this.gestureHistory = []
    this.lastGestureTime = 0
    this.gestureCooldown = 1000
    this.scriptLoaded = false
  }

  // 动态加载MediaPipe脚本
  async loadMediaPipeScripts() {
    if (this.scriptLoaded) return true

    return new Promise((resolve, reject) => {
      // 加载Hands脚本
      const handsScript = document.createElement('script')
      handsScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'
      handsScript.crossOrigin = 'anonymous'
      handsScript.onload = () => {
        // 加载CameraUtils脚本
        const cameraScript = document.createElement('script')
        cameraScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js'
        cameraScript.crossOrigin = 'anonymous'
        cameraScript.onload = () => {
          this.scriptLoaded = true
          resolve(true)
        }
        cameraScript.onerror = () => reject(new Error('Failed to load camera utils'))
        document.head.appendChild(cameraScript)
      }
      handsScript.onerror = () => reject(new Error('Failed to load MediaPipe Hands'))
      document.head.appendChild(handsScript)
    })
  }

  // 初始化手势识别
  async initialize() {
    if (this.isInitialized) return true

    try {
      // 加载MediaPipe脚本
      await this.loadMediaPipeScripts()

      // 等待全局对象可用
      if (!window.Hands || !window.Camera) {
        throw new Error('MediaPipe not loaded')
      }

      // 创建视频元素
      this.videoElement = document.createElement('video')
      this.videoElement.style.display = 'none'
      document.body.appendChild(this.videoElement)

      // 创建canvas用于绘制
      this.canvasElement = document.createElement('canvas')
      this.canvasElement.width = 160
      this.canvasElement.height = 120
      this.canvasElement.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        width: 160px;
        height: 120px;
        border-radius: 8px;
        z-index: 10000;
        opacity: 0.7;
        pointer-events: none;
        background: rgba(0,0,0,0.5);
      `
      document.body.appendChild(this.canvasElement)
      this.canvasCtx = this.canvasElement.getContext('2d')

      // 初始化Hands
      this.hands = new window.Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        }
      })

      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
      })

      this.hands.onResults(this.onResults.bind(this))

      // 初始化相机
      this.camera = new window.Camera(this.videoElement, {
        onFrame: async () => {
          if (this.isRunning) {
            await this.hands.send({ image: this.videoElement })
          }
        },
        width: 320,
        height: 240
      })

      this.isInitialized = true
      console.log('✅ 手势识别初始化成功')
      return true
    } catch (error) {
      console.error('❌ 手势识别初始化失败:', error)
      return false
    }
  }

  // 处理识别结果
  onResults(results) {
    this.canvasCtx.save()
    this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height)
    
    // 绘制视频帧
    if (results.image) {
      this.canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height)
    }

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0]
      
      // 绘制手部骨架
      this.drawHand(landmarks)
      
      // 识别手势
      const gesture = this.recognizeGesture(landmarks)
      if (gesture) {
        this.handleGesture(gesture)
      }
    }
    
    this.canvasCtx.restore()
  }

  // 绘制手部
  drawHand(landmarks) {
    const ctx = this.canvasCtx
    const width = this.canvasElement.width
    const height = this.canvasElement.height

    // 绘制连接线
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [5, 9], [9, 13], [13, 17]
    ]

    ctx.strokeStyle = '#00d4ff'
    ctx.lineWidth = 2

    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start]
      const endPoint = landmarks[end]
      ctx.beginPath()
      ctx.moveTo(startPoint.x * width, startPoint.y * height)
      ctx.lineTo(endPoint.x * width, endPoint.y * height)
      ctx.stroke()
    })

    // 绘制关键点
    landmarks.forEach((point, index) => {
      ctx.beginPath()
      ctx.arc(point.x * width, point.y * height, 3, 0, 2 * Math.PI)
      ctx.fillStyle = index === 0 ? '#ff4444' : '#00ff88'
      ctx.fill()
    })
  }

  // 识别手势
  recognizeGesture(landmarks) {
    const fingers = this.getFingerStates(landmarks)
    
    if (this.isThumbsUp(fingers, landmarks)) return 'thumbs_up'
    if (this.isThumbsDown(fingers, landmarks)) return 'thumbs_down'
    if (this.isOpenPalm(fingers)) return 'open_palm'
    if (this.isFist(fingers)) return 'fist'
    if (this.isPeaceSign(fingers)) return 'peace'
    if (this.isPointing(fingers)) return 'pointing'
    if (this.isOkSign(fingers, landmarks)) return 'ok'
    
    return null
  }

  // 获取手指状态
  getFingerStates(landmarks) {
    const fingers = []
    const fingerTips = [8, 12, 16, 20]
    const fingerBases = [5, 9, 13, 17]
    
    for (let i = 0; i < 4; i++) {
      const tip = landmarks[fingerTips[i]]
      const base = landmarks[fingerBases[i]]
      fingers.push(tip.y < base.y)
    }
    
    const thumbTip = landmarks[4]
    const thumbBase = landmarks[2]
    fingers.push(thumbTip.x < thumbBase.x)
    
    return fingers
  }

  isThumbsUp(fingers, landmarks) {
    const thumbTip = landmarks[4]
    const wrist = landmarks[0]
    return fingers[4] && !fingers[0] && !fingers[1] && !fingers[2] && !fingers[3] && thumbTip.y < wrist.y
  }

  isThumbsDown(fingers, landmarks) {
    const thumbTip = landmarks[4]
    const wrist = landmarks[0]
    return fingers[4] && !fingers[0] && !fingers[1] && !fingers[2] && !fingers[3] && thumbTip.y > wrist.y
  }

  isOpenPalm(fingers) {
    return fingers.every(f => f)
  }

  isFist(fingers) {
    return fingers.every(f => !f)
  }

  isPeaceSign(fingers) {
    return fingers[0] && fingers[1] && !fingers[2] && !fingers[3] && !fingers[4]
  }

  isPointing(fingers) {
    return fingers[0] && !fingers[1] && !fingers[2] && !fingers[3] && !fingers[4]
  }

  isOkSign(fingers, landmarks) {
    const thumbTip = landmarks[4]
    const indexTip = landmarks[8]
    const distance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + 
      Math.pow(thumbTip.y - indexTip.y, 2)
    )
    return distance < 0.05 && fingers[1] && fingers[2] && fingers[3]
  }

  // 处理识别到的手势
  handleGesture(gesture) {
    const now = Date.now()
    if (now - this.lastGestureTime < this.gestureCooldown) return
    
    this.gestureHistory.push({ gesture, time: now })
    if (this.gestureHistory.length > 10) this.gestureHistory.shift()
    
    const recentGestures = this.gestureHistory.slice(-3)
    const isStable = recentGestures.every(g => g.gesture === gesture)
    
    if (isStable) {
      this.lastGestureTime = now
      console.log('👋 识别到手势:', gesture)
      
      if (this.onGestureDetected) {
        this.onGestureDetected(gesture)
      }
    }
  }

  // 开始识别
  async start() {
    if (!this.isInitialized) {
      const success = await this.initialize()
      if (!success) return false
    }

    try {
      await this.camera.start()
      this.isRunning = true
      console.log('✅ 手势识别已启动')
      return true
    } catch (error) {
      console.error('❌ 启动手势识别失败:', error)
      return false
    }
  }

  // 停止识别
  stop() {
    this.isRunning = false
    if (this.camera) {
      this.camera.stop()
    }
    console.log('⏹️ 手势识别已停止')
  }

  // 销毁
  destroy() {
    this.stop()
    if (this.videoElement) {
      this.videoElement.remove()
    }
    if (this.canvasElement) {
      this.canvasElement.remove()
    }
    this.isInitialized = false
  }
}

export default ARGestureRecognition
