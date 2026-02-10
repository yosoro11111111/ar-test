/**
 * 缩略图生成系统
 *
 * 功能：
 * - 3D模型缩略图生成
 * - 动作预览缩略图
 * - 场景预览缩略图
 * - 缩略图缓存管理
 */

export class ThumbnailGenerator {
  constructor() {
    this.cache = new Map()
    this.maxCacheSize = 100
    this.canvas = null
    this.ctx = null
    this.isInitialized = false
  }

  /**
   * 初始化缩略图生成器
   */
  async init() {
    if (this.isInitialized) return

    // 创建离屏canvas
    this.canvas = document.createElement('canvas')
    this.canvas.width = 128
    this.canvas.height = 128
    this.ctx = this.canvas.getContext('2d')

    this.isInitialized = true
    console.log('缩略图生成器初始化完成')
  }

  /**
   * 生成3D模型缩略图
   */
  async generateModelThumbnail(modelUrl, options = {}) {
    const cacheKey = `model_${modelUrl}`
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      const THREE = await import('three')
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')

      // 创建临时场景
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x1a1a25)

      // 添加灯光
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(5, 10, 7)
      scene.add(directionalLight)

      // 加载模型
      const loader = new GLTFLoader()
      const gltf = await loader.loadAsync(modelUrl)
      const model = gltf.scene

      // 计算包围盒并居中
      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())

      model.position.sub(center)

      // 缩放以适应视图
      const maxDim = Math.max(size.x, size.y, size.z)
      const scale = 2 / maxDim
      model.scale.setScalar(scale)

      scene.add(model)

      // 创建渲染器
      const renderer = new THREE.WebGLRenderer({ 
        canvas: this.canvas,
        antialias: true,
        alpha: true
      })
      renderer.setSize(128, 128)
      renderer.setPixelRatio(1)

      // 创建相机
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
      camera.position.set(3, 2, 3)
      camera.lookAt(0, 0, 0)

      // 渲染
      renderer.render(scene, camera)

      // 获取缩略图数据
      const thumbnail = this.canvas.toDataURL('image/png')

      // 清理
      renderer.dispose()
      scene.clear()

      // 缓存
      this.addToCache(cacheKey, thumbnail)

      return thumbnail
    } catch (error) {
      console.error('生成模型缩略图失败:', error)
      return this.generatePlaceholderThumbnail('model')
    }
  }

  /**
   * 生成VRM角色缩略图
   */
  async generateVRMThumbnail(vrmUrl) {
    const cacheKey = `vrm_${vrmUrl}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      // VRM缩略图生成（简化版）
      // 实际应该使用VRMLoader加载并渲染
      const thumbnail = await this.generateModelThumbnail(vrmUrl)
      this.addToCache(cacheKey, thumbnail)
      return thumbnail
    } catch (error) {
      console.error('生成VRM缩略图失败:', error)
      return this.generatePlaceholderThumbnail('character')
    }
  }

  /**
   * 生成场景缩略图
   */
  async generateSceneThumbnail(sceneUrl) {
    const cacheKey = `scene_${sceneUrl}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      const thumbnail = await this.generateModelThumbnail(sceneUrl)
      this.addToCache(cacheKey, thumbnail)
      return thumbnail
    } catch (error) {
      console.error('生成场景缩略图失败:', error)
      return this.generatePlaceholderThumbnail('scene')
    }
  }

  /**
   * 生成动作缩略图（显示动画帧序列）
   */
  async generateMotionThumbnail(motionUrl) {
    const cacheKey = `motion_${motionUrl}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      // 创建动画预览图
      this.ctx.fillStyle = '#1a1a25'
      this.ctx.fillRect(0, 0, 128, 128)

      // 绘制简单的动画图标
      this.ctx.strokeStyle = '#667eea'
      this.ctx.lineWidth = 3
      this.ctx.beginPath()
      
      // 绘制人物轮廓
      this.ctx.arc(64, 40, 15, 0, Math.PI * 2) // 头
      this.ctx.moveTo(64, 55)
      this.ctx.lineTo(64, 90) // 身体
      this.ctx.moveTo(64, 65)
      this.ctx.lineTo(40, 80) // 左臂
      this.ctx.moveTo(64, 65)
      this.ctx.lineTo(88, 80) // 右臂
      this.ctx.moveTo(64, 90)
      this.ctx.lineTo(45, 115) // 左腿
      this.ctx.moveTo(64, 90)
      this.ctx.lineTo(83, 115) // 右腿
      
      this.ctx.stroke()

      // 添加播放图标
      this.ctx.fillStyle = 'rgba(102, 126, 234, 0.8)'
      this.ctx.beginPath()
      this.ctx.moveTo(100, 100)
      this.ctx.lineTo(115, 108)
      this.ctx.lineTo(100, 116)
      this.ctx.closePath()
      this.ctx.fill()

      const thumbnail = this.canvas.toDataURL('image/png')
      this.addToCache(cacheKey, thumbnail)
      
      return thumbnail
    } catch (error) {
      console.error('生成动作缩略图失败:', error)
      return this.generatePlaceholderThumbnail('motion')
    }
  }

  /**
   * 生成道具缩略图
   */
  async generatePropThumbnail(propUrl) {
    const cacheKey = `prop_${propUrl}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      const thumbnail = await this.generateModelThumbnail(propUrl)
      this.addToCache(cacheKey, thumbnail)
      return thumbnail
    } catch (error) {
      console.error('生成道具缩略图失败:', error)
      return this.generatePlaceholderThumbnail('prop')
    }
  }

  /**
   * 生成占位符缩略图
   */
  generatePlaceholderThumbnail(type) {
    const colors = {
      model: '#667eea',
      character: '#f093fb',
      scene: '#4facfe',
      motion: '#43e97b',
      prop: '#fa709a',
      music: '#fee140'
    }

    const color = colors[type] || '#667eea'
    
    this.ctx.fillStyle = '#1a1a25'
    this.ctx.fillRect(0, 0, 128, 128)

    // 绘制渐变背景
    const gradient = this.ctx.createLinearGradient(0, 0, 128, 128)
    gradient.addColorStop(0, color + '40')
    gradient.addColorStop(1, color + '10')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, 128, 128)

    // 绘制图标
    this.ctx.fillStyle = color
    this.ctx.font = '40px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    
    const icons = {
      model: '🎲',
      character: '👤',
      scene: '🏞️',
      motion: '🎭',
      prop: '📦',
      music: '🎵'
    }
    
    this.ctx.fillText(icons[type] || '📄', 64, 64)

    return this.canvas.toDataURL('image/png')
  }

  /**
   * 生成图片缩略图
   */
  async generateImageThumbnail(imageUrl) {
    const cacheKey = `image_${imageUrl}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        // 计算裁剪区域
        const size = Math.min(img.width, img.height)
        const x = (img.width - size) / 2
        const y = (img.height - size) / 2

        // 绘制缩略图
        this.ctx.drawImage(img, x, y, size, size, 0, 0, 128, 128)

        const thumbnail = this.canvas.toDataURL('image/png')
        this.addToCache(cacheKey, thumbnail)
        resolve(thumbnail)
      }

      img.onerror = () => {
        reject(new Error('加载图片失败'))
      }

      img.src = imageUrl
    })
  }

  /**
   * 添加到缓存
   */
  addToCache(key, thumbnail) {
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, thumbnail)
  }

  /**
   * 获取缓存的缩略图
   */
  getCachedThumbnail(key) {
    return this.cache.get(key)
  }

  /**
   * 检查是否有缓存
   */
  hasCachedThumbnail(key) {
    return this.cache.has(key)
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear()
    console.log('缩略图缓存已清除')
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      usage: (this.cache.size / this.maxCacheSize * 100).toFixed(1) + '%'
    }
  }

  /**
   * 批量生成缩略图
   */
  async generateThumbnailsBatch(resources, onProgress) {
    const results = []
    const total = resources.length

    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i]
      let thumbnail

      try {
        switch (resource.type) {
          case 'character':
            thumbnail = await this.generateVRMThumbnail(resource.url)
            break
          case 'scene':
            thumbnail = await this.generateSceneThumbnail(resource.url)
            break
          case 'prop':
            thumbnail = await this.generatePropThumbnail(resource.url)
            break
          case 'motion':
            thumbnail = await this.generateMotionThumbnail(resource.url)
            break
          case 'music':
            thumbnail = this.generatePlaceholderThumbnail('music')
            break
          default:
            thumbnail = this.generatePlaceholderThumbnail('model')
        }

        results.push({
          id: resource.id,
          thumbnail
        })

        // 报告进度
        if (onProgress) {
          onProgress({
            current: i + 1,
            total,
            percentage: ((i + 1) / total * 100).toFixed(0)
          })
        }
      } catch (error) {
        console.error(`生成资源 ${resource.id} 的缩略图失败:`, error)
        results.push({
          id: resource.id,
          thumbnail: this.generatePlaceholderThumbnail(resource.type)
        })
      }
    }

    return results
  }

  /**
   * 清理资源
   */
  dispose() {
    this.clearCache()
    this.canvas = null
    this.ctx = null
    this.isInitialized = false
  }
}
