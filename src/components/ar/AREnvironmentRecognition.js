// AR环境识别模块
// 识别地面材质、光照条件、空间大小等环境特征

export class AREnvironmentRecognition {
  constructor() {
    this.groundType = 'unknown' // 地面类型: wood, tile, grass, carpet, concrete, unknown
    this.lightIntensity = 1.0 // 光照强度
    this.lightDirection = { x: 0, y: 1, z: 0 } // 光源方向
    this.spaceSize = 'medium' // 空间大小: small, medium, large
    this.detectedFeatures = [] // 检测到的特征
    this.lastAnalysisTime = 0
    this.analysisInterval = 5000 // 每5秒分析一次
  }

  // 分析环境（主入口）
  async analyzeEnvironment(session, frame, referenceSpace) {
    const now = Date.now()
    if (now - this.lastAnalysisTime < this.analysisInterval) {
      return this.getEnvironmentData()
    }
    this.lastAnalysisTime = now

    try {
      // 1. 分析光照
      await this.analyzeLighting(session, frame)

      // 2. 分析地面材质（通过摄像头图像）
      await this.analyzeGroundMaterial(session)

      // 3. 分析空间大小
      this.analyzeSpaceSize(session)

      console.log('🔍 环境分析完成:', this.getEnvironmentData())
      return this.getEnvironmentData()
    } catch (error) {
      console.warn('环境分析失败:', error)
      return this.getEnvironmentData()
    }
  }

  // 分析光照条件
  async analyzeLighting(session, frame) {
    try {
      // 使用WebXR的光照估计
      if (session.requestLightProbe) {
        const lightProbe = await session.requestLightProbe()
        if (lightProbe && frame) {
          const lightEstimate = frame.getLightEstimate(lightProbe)
          if (lightEstimate) {
            // 获取主光源方向（从球谐函数估算）
            const sh = lightEstimate.sphericalHarmonicsCoefficients
            if (sh && sh.length >= 3) {
              // 简单的方向估算
              this.lightDirection = {
                x: sh[0],
                y: Math.abs(sh[1]), // 光源通常在上方
                z: sh[2]
              }
              // 归一化
              const len = Math.sqrt(
                this.lightDirection.x ** 2 +
                this.lightDirection.y ** 2 +
                this.lightDirection.z ** 2
              )
              if (len > 0) {
                this.lightDirection.x /= len
                this.lightDirection.y /= len
                this.lightDirection.z /= len
              }
            }

            // 估算光照强度
            this.lightIntensity = lightEstimate.primaryLightIntensity?.x || 1.0
            console.log('💡 光照分析:', {
              intensity: this.lightIntensity,
              direction: this.lightDirection
            })
          }
        }
      }
    } catch (error) {
      console.warn('光照分析失败:', error)
    }
  }

  // 分析地面材质
  async analyzeGroundMaterial(session) {
    try {
      // 获取摄像头图像
      const imageData = await this.captureCameraImage(session)
      if (!imageData) {
        this.groundType = 'unknown'
        return
      }

      // 分析图像特征
      const features = this.analyzeImageFeatures(imageData)

      // 根据特征判断地面类型
      this.groundType = this.classifyGroundType(features)

      console.log('🌍 地面材质识别:', this.groundType, features)
    } catch (error) {
      console.warn('地面材质分析失败:', error)
      this.groundType = 'unknown'
    }
  }

  // 捕获摄像头图像
  async captureCameraImage(session) {
    try {
      // 尝试从WebXR会话获取摄像头图像
      // 注意：这需要浏览器支持，目前Chrome Android支持
      if (session.camera && session.camera.getCameraImage) {
        const image = await session.camera.getCameraImage()
        return image
      }

      // 备选方案：使用canvas捕获视频流
      const video = document.createElement('video')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      video.srcObject = stream
      await new Promise(resolve => {
        video.onloadedmetadata = () => {
          video.play()
          resolve()
        }
      })

      // 等待一帧
      await new Promise(resolve => setTimeout(resolve, 100))

      // 绘制到canvas
      const canvas = document.createElement('canvas')
      canvas.width = 320
      canvas.height = 240
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // 停止流
      stream.getTracks().forEach(track => track.stop())

      return ctx.getImageData(0, 0, canvas.width, canvas.height)
    } catch (error) {
      console.warn('摄像头捕获失败:', error)
      return null
    }
  }

  // 分析图像特征
  analyzeImageFeatures(imageData) {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height

    // 采样底部区域（地面部分）
    const sampleHeight = Math.floor(height * 0.3) // 底部30%
    const startY = height - sampleHeight

    let totalR = 0, totalG = 0, totalB = 0
    let brightness = 0
    let edgeCount = 0
    let variance = 0

    const pixels = []

    // 采样像素
    for (let y = startY; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const idx = (y * width + x) * 4
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]

        totalR += r
        totalG += g
        totalB += b

        const gray = (r + g + b) / 3
        brightness += gray
        pixels.push(gray)

        // 简单的边缘检测
        if (x > 0 && y > startY) {
          const prevIdx = (y * width + (x - 4)) * 4
          const prevGray = (data[prevIdx] + data[prevIdx + 1] + data[prevIdx + 2]) / 3
          if (Math.abs(gray - prevGray) > 30) {
            edgeCount++
          }
        }
      }
    }

    const sampleCount = pixels.length
    const avgR = totalR / sampleCount
    const avgG = totalG / sampleCount
    const avgB = totalB / sampleCount
    const avgBrightness = brightness / sampleCount

    // 计算方差（纹理粗糙度）
    const avgPixel = avgBrightness
    variance = pixels.reduce((sum, p) => sum + (p - avgPixel) ** 2, 0) / sampleCount

    return {
      avgColor: { r: avgR, g: avgG, b: avgB },
      brightness: avgBrightness,
      edgeDensity: edgeCount / sampleCount,
      textureVariance: variance,
      hue: this.rgbToHue(avgR, avgG, avgB)
    }
  }

  // RGB转色相
  rgbToHue(r, g, b) {
    r /= 255
    g /= 255
    b /= 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const diff = max - min

    if (diff === 0) return 0

    let hue = 0
    if (max === r) {
      hue = ((g - b) / diff) % 6
    } else if (max === g) {
      hue = (b - r) / diff + 2
    } else {
      hue = (r - g) / diff + 4
    }

    return hue * 60
  }

  // 分类地面类型
  classifyGroundType(features) {
    const { avgColor, brightness, edgeDensity, textureVariance, hue } = features

    // 木地板：暖色调，中等亮度，有纹理
    if (hue > 20 && hue < 50 && brightness > 60 && brightness < 150 && textureVariance > 100) {
      return 'wood'
    }

    // 草地：绿色，中等亮度
    if (hue > 80 && hue < 160 && avgColor.g > avgColor.r && avgColor.g > avgColor.b) {
      return 'grass'
    }

    // 瓷砖：冷色调，高亮度，低纹理，可能有规则边缘
    if (brightness > 120 && textureVariance < 200 && edgeDensity > 0.05) {
      return 'tile'
    }

    // 地毯：低亮度，高纹理方差
    if (brightness < 100 && textureVariance > 300) {
      return 'carpet'
    }

    // 混凝土：灰色，中等亮度，低纹理
    if (Math.abs(avgColor.r - avgColor.g) < 20 &&
        Math.abs(avgColor.g - avgColor.b) < 20 &&
        textureVariance < 150) {
      return 'concrete'
    }

    return 'unknown'
  }

  // 分析空间大小
  analyzeSpaceSize(session) {
    try {
      // 使用检测到的平面估算空间大小
      if (session.planes) {
        const planes = Array.from(session.planes)
        let totalArea = 0

        planes.forEach(plane => {
          if (plane.extent) {
            totalArea += plane.extent.width * plane.extent.height
          }
        })

        // 根据总面积分类
        if (totalArea < 2) {
          this.spaceSize = 'small'
        } else if (totalArea < 8) {
          this.spaceSize = 'medium'
        } else {
          this.spaceSize = 'large'
        }

        console.log('📏 空间大小分析:', this.spaceSize, '面积:', totalArea.toFixed(2), 'm²')
      }
    } catch (error) {
      console.warn('空间大小分析失败:', error)
    }
  }

  // 获取环境数据
  getEnvironmentData() {
    return {
      groundType: this.groundType,
      lightIntensity: this.lightIntensity,
      lightDirection: this.lightDirection,
      spaceSize: this.spaceSize,
      detectedFeatures: this.detectedFeatures
    }
  }

  // 根据环境推荐动作
  recommendActions() {
    const recommendations = []

    // 根据地面类型推荐
    const groundActions = {
      wood: ['跳舞', '走路', '滑步'],
      grass: ['跳跃', '奔跑', '翻滚'],
      carpet: ['坐下', '躺下', '休息'],
      tile: ['滑行', '旋转', '滑冰'],
      concrete: ['走路', '站立', '运动'],
      unknown: ['待机', '站立']
    }

    // 根据空间大小推荐
    const spaceActions = {
      small: ['挥手', '跳跃', '原地转圈'],
      medium: ['走路', '转身', '舞蹈'],
      large: ['奔跑', '大跳', '翻滚']
    }

    recommendations.push(...(groundActions[this.groundType] || groundActions.unknown))
    recommendations.push(...spaceActions[this.spaceSize])

    // 去重
    return [...new Set(recommendations)]
  }

  // 销毁
  destroy() {
    this.groundType = 'unknown'
    this.detectedFeatures = []
  }
}

export default AREnvironmentRecognition
