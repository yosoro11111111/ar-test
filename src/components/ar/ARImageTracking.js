import * as THREE from 'three'

/**
 * AR图像追踪系统 - 使用WebXR Image Tracking API
 * 支持识别特定图片并在其上显示虚拟内容
 */
export class ARImageTracking {
  constructor() {
    this.session = null
    this.referenceSpace = null
    this.isInitialized = false
    this.isRunning = false
    
    // 追踪的图像
    this.trackedImages = new Map() // imageName -> { image, width, height, trackedObject }
    this.imageTrackers = new Map() // imageName -> XRImageTrackingResult
    
    // 回调函数
    this.onImageDetected = null
    this.onImageLost = null
    this.onImageUpdate = null
    
    // 可视化
    this.debugVisuals = new Map()
    this.showDebugVisuals = true
  }

  /**
   * 初始化图像追踪
   * @param {XRSession} session - WebXR会话
   * @param {XRReferenceSpace} referenceSpace - 参考空间
   * @param {Array} imageTargets - 要追踪的图像配置数组
   *   [{ name: 'marker1', image: ImageBitmap, width: 0.2 }, ...]
   */
  async initialize(session, referenceSpace, imageTargets = []) {
    this.session = session
    this.referenceSpace = referenceSpace
    
    if (!this.session) {
      console.warn('ARImageTracking: 没有可用的XR会话')
      return false
    }
    
    // 检查是否支持image-tracking
    const supported = await this.session.isFeatureEnabled('image-tracking') ||
                      this.session.enabledFeatures?.includes('image-tracking')
    
    if (!supported) {
      console.warn('ARImageTracking: 设备不支持图像追踪')
      return false
    }
    
    // 设置要追踪的图像
    if (imageTargets.length > 0) {
      await this.setTrackingImages(imageTargets)
    }
    
    this.isInitialized = true
    console.log('🖼️ AR图像追踪系统已初始化')
    return true
  }

  /**
   * 设置要追踪的图像
   */
  async setTrackingImages(imageTargets) {
    if (!this.session) return false
    
    // 准备图像追踪配置
    const trackingImages = []
    
    for (const target of imageTargets) {
      if (!target.image || !target.name) {
        console.warn('ARImageTracking: 图像配置缺少必要字段', target)
        continue
      }
      
      trackingImages.push({
        image: target.image,
        widthInMeters: target.width || 0.2
      })
      
      // 存储图像信息
      this.trackedImages.set(target.name, {
        name: target.name,
        image: target.image,
        width: target.width || 0.2,
        height: target.height || target.width || 0.2,
        trackedObject: target.trackedObject || null,
        isDetected: false,
        position: new THREE.Vector3(),
        quaternion: new THREE.Quaternion(),
        confidence: 0
      })
    }
    
    try {
      // 更新会话的追踪图像
      await this.session.updateTrackingImages(trackingImages)
      console.log(`🖼️ 已设置 ${trackingImages.length} 个追踪图像`)
      return true
    } catch (error) {
      console.error('ARImageTracking: 设置追踪图像失败', error)
      return false
    }
  }

  start() {
    if (!this.isInitialized) {
      console.warn('ARImageTracking: 请先初始化')
      return false
    }
    
    this.isRunning = true
    console.log('🖼️ 图像追踪已启动')
    return true
  }

  stop() {
    this.isRunning = false
    
    // 清理可视化
    this.debugVisuals.forEach((visual) => {
      if (visual.parent) {
        visual.parent.remove(visual)
      }
    })
    this.debugVisuals.clear()
    
    console.log('🖼️ 图像追踪已停止')
  }

  /**
   * 更新图像追踪状态
   */
  update(frame) {
    if (!this.isRunning || !frame) return
    
    // 获取图像追踪结果
    const results = frame.getImageTrackingResults()
    
    if (!results) return
    
    // 处理每个追踪结果
    for (const result of results) {
      const index = result.index
      const imageName = Array.from(this.trackedImages.keys())[index]
      
      if (!imageName) continue
      
      const imageData = this.trackedImages.get(imageName)
      if (!imageData) continue
      
      // 获取图像姿态
      const pose = frame.getPose(result.imageSpace, this.referenceSpace)
      
      if (pose) {
        const wasDetected = imageData.isDetected
        imageData.isDetected = true
        imageData.position.set(
          pose.transform.position.x,
          pose.transform.position.y,
          pose.transform.position.z
        )
        imageData.quaternion.set(
          pose.transform.orientation.x,
          pose.transform.orientation.y,
          pose.transform.orientation.z,
          pose.transform.orientation.w
        )
        imageData.confidence = result.trackingState === 'tracked' ? 1.0 : 0.5
        
        // 首次检测到
        if (!wasDetected && this.onImageDetected) {
          this.onImageDetected({
            name: imageName,
            position: imageData.position.clone(),
            quaternion: imageData.quaternion.clone(),
            width: imageData.width,
            height: imageData.height
          })
        }
        
        // 更新回调
        if (this.onImageUpdate) {
          this.onImageUpdate({
            name: imageName,
            position: imageData.position.clone(),
            quaternion: imageData.quaternion.clone(),
            confidence: imageData.confidence,
            trackingState: result.trackingState
          })
        }
        
        // 更新关联的3D对象
        if (imageData.trackedObject) {
          this.updateTrackedObject(imageData)
        }
        
        // 更新可视化
        if (this.showDebugVisuals) {
          this.updateDebugVisual(imageName, imageData)
        }
      } else {
        // 丢失追踪
        if (imageData.isDetected) {
          imageData.isDetected = false
          imageData.confidence = 0
          
          if (this.onImageLost) {
            this.onImageLost({ name: imageName })
          }
          
          // 隐藏可视化
          const visual = this.debugVisuals.get(imageName)
          if (visual) {
            visual.visible = false
          }
        }
      }
    }
  }

  /**
   * 更新追踪的3D对象位置和旋转
   */
  updateTrackedObject(imageData) {
    if (!imageData.trackedObject) return
    
    imageData.trackedObject.position.copy(imageData.position)
    imageData.trackedObject.quaternion.copy(imageData.quaternion)
    imageData.trackedObject.visible = imageData.isDetected
  }

  /**
   * 创建调试可视化（在检测到的图像上显示边框）
   */
  createDebugVisual(scene, imageName) {
    const imageData = this.trackedImages.get(imageName)
    if (!imageData) return null
    
    const group = new THREE.Group()
    
    // 创建边框
    const borderGeometry = new THREE.PlaneGeometry(imageData.width, imageData.height)
    const borderMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    })
    const border = new THREE.Mesh(borderGeometry, borderMaterial)
    group.add(border)
    
    // 创建角点标记
    const cornerGeometry = new THREE.SphereGeometry(0.01, 8, 8)
    const cornerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    
    const corners = [
      { x: -imageData.width/2, y: imageData.height/2 },
      { x: imageData.width/2, y: imageData.height/2 },
      { x: imageData.width/2, y: -imageData.height/2 },
      { x: -imageData.width/2, y: -imageData.height/2 }
    ]
    
    corners.forEach(corner => {
      const marker = new THREE.Mesh(cornerGeometry, cornerMaterial)
      marker.position.set(corner.x, corner.y, 0.001)
      group.add(marker)
    })
    
    // 添加坐标轴
    const axesHelper = new THREE.AxesHelper(0.1)
    group.add(axesHelper)
    
    group.visible = false
    scene.add(group)
    
    this.debugVisuals.set(imageName, group)
    return group
  }

  /**
   * 更新调试可视化
   */
  updateDebugVisual(imageName, imageData) {
    let visual = this.debugVisuals.get(imageName)
    
    if (!visual) {
      // 需要在scene中创建，这里简化处理
      return
    }
    
    visual.position.copy(imageData.position)
    visual.quaternion.copy(imageData.quaternion)
    visual.visible = true
    
    // 根据置信度改变颜色
    const border = visual.children[0]
    if (border) {
      if (imageData.confidence >= 1.0) {
        border.material.color.setHex(0x00ff00) // 绿色 - 高置信度
      } else if (imageData.confidence >= 0.5) {
        border.material.color.setHex(0xffff00) // 黄色 - 中置信度
      } else {
        border.material.color.setHex(0xff0000) // 红色 - 低置信度
      }
    }
  }

  /**
   * 绑定3D对象到图像
   */
  bindObjectToImage(imageName, object) {
    const imageData = this.trackedImages.get(imageName)
    if (!imageData) {
      console.warn(`ARImageTracking: 未找到图像 ${imageName}`)
      return false
    }
    
    imageData.trackedObject = object
    
    // 设置初始位置和旋转
    object.position.copy(imageData.position)
    object.quaternion.copy(imageData.quaternion)
    object.visible = imageData.isDetected
    
    return true
  }

  /**
   * 解绑图像的对象
   */
  unbindObjectFromImage(imageName) {
    const imageData = this.trackedImages.get(imageName)
    if (imageData) {
      imageData.trackedObject = null
    }
  }

  /**
   * 获取图像追踪状态
   */
  getImageStatus(imageName) {
    return this.trackedImages.get(imageName)
  }

  /**
   * 获取所有追踪中的图像
   */
  getAllTrackedImages() {
    const tracked = []
    this.trackedImages.forEach((data, name) => {
      if (data.isDetected) {
        tracked.push({
          name,
          position: data.position.clone(),
          quaternion: data.quaternion.clone(),
          confidence: data.confidence
        })
      }
    })
    return tracked
  }

  /**
   * 创建默认追踪图像（用于测试）
   */
  static async createDefaultMarker(text = 'AR', size = 256) {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    
    // 白色背景
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, size, size)
    
    // 黑色边框
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 10
    ctx.strokeRect(10, 10, size - 20, size - 20)
    
    // 内部图案（提高识别度）
    ctx.fillStyle = 'black'
    const patternSize = size / 4
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if ((i + j) % 2 === 0) {
          ctx.fillRect(
            30 + i * patternSize,
            30 + j * patternSize,
            patternSize - 10,
            patternSize - 10
          )
        }
      }
    }
    
    // 文字
    ctx.fillStyle = 'red'
    ctx.font = `bold ${size / 4}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, size / 2, size / 2)
    
    // 转换为ImageBitmap
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
    const imageBitmap = await createImageBitmap(blob)
    
    return imageBitmap
  }

  /**
   * 从URL加载图像
   */
  static async loadImageFromURL(url) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        createImageBitmap(img).then(resolve).catch(reject)
      }
      img.onerror = reject
      img.src = url
    })
  }

  destroy() {
    this.stop()
    this.trackedImages.clear()
    this.isInitialized = false
    this.session = null
    this.referenceSpace = null
  }
}

export default ARImageTracking
