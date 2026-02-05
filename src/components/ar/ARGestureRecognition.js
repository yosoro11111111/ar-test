// AR手势识别模块
// 使用MediaPipe Hands进行手势识别

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
    this.gestureCooldown = 1000 // 手势识别冷却时间（毫秒）
  }

  // 初始化手势识别
  async initialize() {
    if (this.isInitialized) return true

    try {
      // 动态导入MediaPipe
      const { Hands } = await import('@mediapipe/hands')
      const { Camera } = await import('@mediapipe/camera_utils')

      // 创建视频元素
      this.videoElement = document.createElement('video')
      this.videoElement.style.display = 'none'
      document.body.appendChild(this.videoElement)

      // 创建canvas用于绘制
      this.canvasElement = document.createElement('canvas')
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
      `
      document.body.appendChild(this.canvasElement)
      this.canvasCtx = this.canvasElement.getContext('2d')

      // 初始化Hands
      this.hands = new Hands({
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
      this.camera = new Camera(this.videoElement, {
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
    // 绘制手部关键点
    this.canvasCtx.save()
    this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height)
    this.canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height)

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
      [0, 1], [1, 2], [2, 3], [3, 4], // 拇指
      [0, 5], [5, 6], [6, 7], [7, 8], // 食指
      [0, 9], [9, 10], [10, 11], [11, 12], // 中指
      [0, 13], [13, 14], [14, 15], [15, 16], // 无名指
      [0, 17], [17, 18], [18, 19], [19, 20], // 小指
      [5, 9], [9, 13], [13, 17] // 手掌
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
    // 计算手指状态
    const fingers = this.getFingerStates(landmarks)
    
    // 识别具体手势
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
    const fingerTips = [8, 12, 16, 20] // 食指、中指、无名指、小指指尖
    const fingerBases = [5, 9, 13, 17] // 对应指根
    
    // 检查四指（非拇指）
    for (let i = 0; i < 4; i++) {
      const tip = landmarks[fingerTips[i]]
      const base = landmarks[fingerBases[i]]
      // 如果指尖y坐标小于指根y坐标（在屏幕上方），则手指伸直
      fingers.push(tip.y < base.y)
    }
    
    // 检查拇指（特殊处理）
    const thumbTip = landmarks[4]
    const thumbBase = landmarks[2]
    fingers.push(thumbTip.x < thumbBase.x) // 拇指伸直
    
    return fingers
  }

  // 拇指向上
  isThumbsUp(fingers, landmarks) {
    const thumbTip = landmarks[4]
    const thumbBase = landmarks[2]
    const wrist = landmarks[0]
    
    return fingers[4] && // 拇指伸直
           !fingers[0] && !fingers[1] && !fingers[2] && !fingers[3] && // 其他手指弯曲
           thumbTip.y < wrist.y // 拇指在手腕上方
  }

  // 拇指向下
  isThumbsDown(fingers, landmarks) {
    const thumbTip = landmarks[4]
    const wrist = landmarks[0]
    
    return fingers[4] && // 拇指伸直
           !fingers[0] && !fingers[1] && !fingers[2] && !fingers[3] && // 其他手指弯曲
           thumbTip.y > wrist.y // 拇指在手腕下方
  }

  // 张开手掌
  isOpenPalm(fingers) {
    return fingers.every(f => f) // 所有手指都伸直
  }

  // 握拳
  isFist(fingers) {
    return fingers.every(f => !f) // 所有手指都弯曲
  }

  // 剪刀手
  isPeaceSign(fingers) {
    return fingers[0] && fingers[1] && // 食指和中指伸直
           !fingers[2] && !fingers[3] && !fingers[4] // 其他手指弯曲
  }

  // 指向
  isPointing(fingers) {
    return fingers[0] && // 食指伸直
           !fingers[1] && !fingers[2] && !fingers[3] && !fingers[4] // 其他手指弯曲
  }

  // OK手势
  isOkSign(fingers, landmarks) {
    const thumbTip = landmarks[4]
    const indexTip = landmarks[8]
    const distance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + 
      Math.pow(thumbTip.y - indexTip.y, 2)
    )
    
    return distance < 0.05 && // 拇指和食指接触
           fingers[1] && fingers[2] && fingers[3] // 其他手指伸直
  }

  // 处理识别到的手势
  handleGesture(gesture) {
    const now = Date.now()
    
    // 检查冷却时间
    if (now - this.lastGestureTime < this.gestureCooldown) return
    
    // 添加到历史记录
    this.gestureHistory.push({ gesture, time: now })
    if (this.gestureHistory.length > 10) this.gestureHistory.shift()
    
    // 检查手势是否稳定（连续识别到相同手势）
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
