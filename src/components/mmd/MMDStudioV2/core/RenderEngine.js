/**
 * 渲染引擎
 * 
 * 功能：
 * - Three.js场景管理
 * - VRM角色渲染
 * - GLB场景/道具渲染
 * - 摄像机控制
 * - 后处理效果
 */
export class RenderEngine {
  constructor(canvas) {
    this.canvas = canvas
    this.scene = null
    this.camera = null
    this.renderer = null
    this.controls = null
    
    this.characters = new Map()
    this.props = new Map()
    this.scenes = new Map()
    
    this.isInitialized = false
    this.animationFrameId = null
    
    // 模型缓存系统
    this.modelCache = new Map()
    this.textureCache = new Map()
    this.maxCacheSize = 50 // 最大缓存数量
    
    // 加载队列
    this.loadQueue = []
    this.isLoading = false
    this.maxConcurrentLoads = 2 // 最大并发加载数
    
    // 性能优化设置
    this.performanceSettings = {
      enableShadows: true,
      enableAntialias: true,
      maxTextureSize: 2048,
      lodDistance: [10, 30, 100], // LOD切换距离
      frustumCulled: true
    }
  }

  /**
   * 初始化渲染引擎
   */
  async init() {
    if (this.isInitialized) return

    try {
      // 动态导入Three.js
      const THREE = await import('three')
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js')
      
      this.THREE = THREE

      // 创建场景
      this.scene = new THREE.Scene()
      this.scene.background = new THREE.Color(0x0a0a0f)

      // 创建摄像机
      const aspect = this.canvas.clientWidth / this.canvas.clientHeight
      this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000)
      this.camera.position.set(0, 1.5, 3)

      // 创建渲染器
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true
      })
      this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight)
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      this.renderer.shadowMap.enabled = true
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

      // 创建控制器
      this.controls = new OrbitControls(this.camera, this.canvas)
      this.controls.enableDamping = true
      this.controls.dampingFactor = 0.05
      this.controls.target.set(0, 1, 0)

      // 添加灯光
      this.setupLights()

      // 添加网格
      this.addGrid()

      // 开始渲染循环
      this.startRenderLoop()

      // 监听窗口大小变化
      window.addEventListener('resize', this.handleResize.bind(this))

      this.isInitialized = true
      console.log('渲染引擎初始化完成')
    } catch (error) {
      console.error('渲染引擎初始化失败:', error)
      throw error
    }
  }

  /**
   * 设置灯光
   */
  setupLights() {
    const { THREE } = this

    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    this.scene.add(ambientLight)

    // 主光源
    const mainLight = new THREE.DirectionalLight(0xffffff, 1)
    mainLight.position.set(5, 10, 5)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    this.scene.add(mainLight)

    // 补光
    const fillLight = new THREE.DirectionalLight(0x667eea, 0.3)
    fillLight.position.set(-5, 5, -5)
    this.scene.add(fillLight)

    // 轮廓光
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.5)
    rimLight.position.set(0, 5, -5)
    this.scene.add(rimLight)
  }

  /**
   * 添加网格
   */
  addGrid() {
    const { THREE } = this
    
    const gridHelper = new THREE.GridHelper(20, 20, 0x3a3a4a, 0x2a2a3a)
    this.scene.add(gridHelper)

    // 添加坐标轴
    const axesHelper = new THREE.AxesHelper(1)
    this.scene.add(axesHelper)
  }

  /**
   * 获取缓存的模型
   */
  getCachedModel(url) {
    const cached = this.modelCache.get(url)
    if (cached) {
      cached.lastAccessed = Date.now()
      return cached.model.clone()
    }
    return null
  }
  
  /**
   * 缓存模型
   */
  cacheModel(url, model) {
    // 如果缓存已满，移除最久未使用的
    if (this.modelCache.size >= this.maxCacheSize) {
      let oldestUrl = null
      let oldestTime = Infinity
      this.modelCache.forEach((value, key) => {
        if (value.lastAccessed < oldestTime) {
          oldestTime = value.lastAccessed
          oldestUrl = key
        }
      })
      if (oldestUrl) {
        this.modelCache.delete(oldestUrl)
      }
    }
    
    this.modelCache.set(url, {
      model: model.clone(),
      lastAccessed: Date.now()
    })
  }
  
  /**
   * 优化模型（降低多边形数、压缩纹理）
   */
  optimizeModel(model) {
    model.traverse((child) => {
      if (child.isMesh) {
        // 启用视锥体剔除
        child.frustumCulled = this.performanceSettings.frustumCulled
        
        // 优化材质
        if (child.material) {
          // 如果材质有纹理，限制纹理大小
          if (child.material.map) {
            const texture = child.material.map
            if (texture.image) {
              const maxSize = this.performanceSettings.maxTextureSize
              if (texture.image.width > maxSize || texture.image.height > maxSize) {
                // 标记需要压缩（实际压缩需要在加载时处理）
                texture.userData.needsCompression = true
              }
            }
          }
          
          // 合并相似材质
          child.material.precision = 'mediump'
        }
        
        // 如果模型面数过高，可以考虑简化（这里仅作标记）
        if (child.geometry && child.geometry.attributes.position) {
          const vertexCount = child.geometry.attributes.position.count
          if (vertexCount > 50000) {
            console.warn('模型面数过高:', child.name, '顶点数:', vertexCount)
          }
        }
      }
    })
  }

  /**
   * 加载VRM角色（带缓存）
   */
  async loadVRMCharacter(url, id) {
    try {
      // 检查缓存
      const cached = this.getCachedModel(url)
      if (cached) {
        console.log('使用缓存的VRM模型:', url)
        const vrm = cached.userData?.vrm
        if (vrm) {
          vrm.scene.position.set(0, 0, 0)
          this.scene.add(vrm.scene)
          this.characters.set(id, vrm)
          return vrm
        }
      }
      
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
      const { VRMLoaderPlugin } = await import('@pixiv/three-vrm')

      const loader = new GLTFLoader()
      loader.register((parser) => new VRMLoaderPlugin(parser))

      const gltf = await loader.loadAsync(url)
      const vrm = gltf.userData.vrm

      // 优化模型
      this.optimizeModel(vrm.scene)
      
      // 设置VRM
      vrm.scene.position.set(0, 0, 0)
      vrm.scene.castShadow = this.performanceSettings.enableShadows
      vrm.scene.receiveShadow = this.performanceSettings.enableShadows

      // 添加到场景
      this.scene.add(vrm.scene)
      this.characters.set(id, vrm)
      
      // 缓存模型
      this.cacheModel(url, vrm.scene)

      return vrm
    } catch (error) {
      console.error('加载VRM角色失败:', error)
      throw error
    }
  }

  /**
   * 加载GLB模型（道具/场景）带缓存
   */
  async loadGLBModel(url, id, type = 'prop') {
    try {
      // 检查文件扩展名
      const extension = url.split('.').pop().toLowerCase()
      const validExtensions = ['glb', 'gltf', 'vrm']
      
      if (!validExtensions.includes(extension)) {
        console.warn(`跳过非模型文件: ${url} (扩展名: ${extension})`)
        return null
      }
      
      // 检查缓存
      const cached = this.getCachedModel(url)
      if (cached) {
        console.log('使用缓存的GLB模型:', url)
        const model = cached
        model.castShadow = this.performanceSettings.enableShadows
        model.receiveShadow = this.performanceSettings.enableShadows
        
        this.scene.add(model)
        if (type === 'prop') {
          this.props.set(id, model)
        } else {
          this.scenes.set(id, model)
        }
        return model
      }
      
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
      
      const loader = new GLTFLoader()
      const gltf = await loader.loadAsync(url)

      const model = gltf.scene
      
      // 优化模型
      this.optimizeModel(model)
      
      model.castShadow = this.performanceSettings.enableShadows
      model.receiveShadow = this.performanceSettings.enableShadows

      // 添加到场景
      this.scene.add(model)

      if (type === 'prop') {
        this.props.set(id, model)
      } else {
        this.scenes.set(id, model)
      }
      
      // 缓存模型
      this.cacheModel(url, model)

      return model
    } catch (error) {
      console.error('加载GLB模型失败:', error)
      throw error
    }
  }

  /**
   * 移除角色
   */
  removeCharacter(id) {
    const character = this.characters.get(id)
    if (character) {
      this.scene.remove(character.scene)
      this.characters.delete(id)
    }
  }

  /**
   * 移除道具
   */
  removeProp(id) {
    const prop = this.props.get(id)
    if (prop) {
      this.scene.remove(prop)
      this.props.delete(id)
    }
  }

  /**
   * 更新对象变换
   */
  updateObjectTransform(id, type, transform) {
    let object
    if (type === 'character') {
      object = this.characters.get(id)?.scene
    } else if (type === 'prop') {
      object = this.props.get(id)
    }

    if (object) {
      if (transform.position) {
        object.position.set(
          transform.position.x,
          transform.position.y,
          transform.position.z
        )
      }
      if (transform.rotation) {
        object.rotation.set(
          transform.rotation.x * Math.PI / 180,
          transform.rotation.y * Math.PI / 180,
          transform.rotation.z * Math.PI / 180
        )
      }
      if (transform.scale) {
        object.scale.setScalar(transform.scale)
      }
      if (transform.visible !== undefined) {
        object.visible = transform.visible
      }
    }
  }

  /**
   * 设置背景
   */
  setBackground(type, value) {
    if (!this.THREE || !this.scene) {
      console.warn('渲染引擎未初始化，无法设置背景')
      return
    }
    
    if (type === 'color') {
      this.scene.background = new this.THREE.Color(value)
      // 清除图片背景纹理
      if (this.backgroundTexture) {
        this.backgroundTexture.dispose()
        this.backgroundTexture = null
      }
    } else if (type === 'image') {
      // 加载背景图片
      const textureLoader = new this.THREE.TextureLoader()
      textureLoader.load(value, (texture) => {
        // 设置纹理填充模式为覆盖整个背景
        texture.mapping = this.THREE.EquirectangularReflectionMapping
        
        // 计算合适的显示比例
        const canvasAspect = this.canvas.clientWidth / this.canvas.clientHeight
        
        // 根据图片和画布的比例调整纹理显示
        const imageAspect = texture.image.width / texture.image.height
        
        if (imageAspect > canvasAspect) {
          // 图片更宽，以高度为基准
          texture.repeat.set(canvasAspect / imageAspect, 1)
          texture.offset.set((1 - canvasAspect / imageAspect) / 2, 0)
        } else {
          // 图片更高，以宽度为基准
          texture.repeat.set(1, imageAspect / canvasAspect)
          texture.offset.set(0, (1 - imageAspect / canvasAspect) / 2)
        }
        
        texture.colorSpace = this.THREE.SRGBColorSpace
        this.scene.background = texture
        this.backgroundTexture = texture
      }, undefined, (error) => {
        console.error('加载背景图片失败:', error)
      })
    }
  }

  /**
   * 播放动作
   */
  playMotion(characterId, motionUrl, startTime = 0) {
    const character = this.characters.get(characterId)
    if (!character) {
      console.warn('角色不存在:', characterId)
      return
    }

    // 这里应该加载并播放动作
    // 简化版：记录当前播放的动作和时间
    this.currentMotion = {
      characterId,
      motionUrl,
      startTime,
      isPlaying: true
    }
    
    console.log('播放动作:', motionUrl, '角色:', characterId)
  }

  /**
   * 停止动作
   */
  stopMotion(characterId) {
    if (this.currentMotion && this.currentMotion.characterId === characterId) {
      this.currentMotion.isPlaying = false
    }
  }

  /**
   * 更新角色动作
   * 使用 AnimationMixer 播放动画
   */
  updateCharacterMotion(character, clip, clipTime, progress) {
    if (!character) {
      console.warn('updateCharacterMotion: character 为空')
      return
    }
    
    console.log('更新动作:', clip.name, '角色:', character.name || 'unknown', '时间:', clipTime.toFixed(2))

    try {
      // 确保有动画混合器
      if (!character.mixer) {
        console.log('创建AnimationMixer')
        character.mixer = new this.THREE.AnimationMixer(character.scene)
      }

      // 如果动作还没加载，加载它
      if (!this.loadedMotions) this.loadedMotions = new Map()
      
      if (!this.loadedMotions.has(clip.id) && clip.resourcePath) {
        console.log('动作未加载，开始加载:', clip.id, '路径:', clip.resourcePath)
        // 异步加载动作文件
        this.loadVRMAAction(clip.resourcePath, clip.id, character)
        return
      }

      const motionData = this.loadedMotions.get(clip.id)
      if (!motionData || !motionData.clip) {
        console.warn('动作数据为空:', clip.id, 'motionData:', motionData)
        return
      }
      
      console.log('动作数据已加载:', clip.id, '类型:', motionData.type, '时长:', motionData.duration)

      // 如果当前没有播放这个动作，开始播放
      if (character.currentActionClip !== clip.id) {
        console.log('切换到新动作:', clip.id)
        this.playActionOnCharacter(character, motionData, clip.id)
      }

      // 更新动画时间
      if (character.currentAction) {
        const motionDuration = motionData.duration / 1000 || (clip.end - clip.start)
        let localTime = clipTime % motionDuration
        
        if (!clip.loop && clipTime > motionDuration) {
          localTime = motionDuration
        }
        
        // 设置动画时间
        character.currentAction.time = localTime
        character.mixer.update(0) // 强制更新
        
        if (Math.floor(clipTime * 10) % 30 === 0) {
          console.log('动作时间更新:', clip.name, 'localTime:', localTime.toFixed(2), 'weight:', character.currentAction.getEffectiveWeight())
        }
      } else {
        console.warn('没有currentAction')
      }
    } catch (error) {
      console.warn('更新角色动作失败:', error)
    }
  }

  /**
   * 在角色上播放动作
   */
  playActionOnCharacter(character, motionData, clipId) {
    try {
      const { clip } = motionData
      
      // 查找动画根节点
      let animationRoot = character.scene
      character.scene.traverse((child) => {
        if (child.name === 'G1' || child.name === 'Root' || child.name === 'root' || child.name === 'Armature') {
          animationRoot = child
        }
      })
      
      // 停止当前动作
      if (character.currentAction) {
        character.currentAction.stop()
      }
      
      // 创建动画动作
      const action = character.mixer.clipAction(clip, animationRoot)
      
      // 设置循环模式
      action.setLoop(this.THREE.LoopRepeat, Infinity)
      action.clampWhenFinished = false
      
      // 直接播放，不使用淡入淡出
      action
        .reset()
        .setEffectiveTimeScale(1)
        .setEffectiveWeight(1)
        .play()
      
      character.currentAction = action
      character.currentActionClip = clipId
      
      console.log('开始播放动作:', clipId, '权重:', action.getEffectiveWeight(), 'tracks:', clip.tracks.length)
      
      // 检查动画 tracks 是否能找到对应的骨骼
      let matchedTracks = 0
      clip.tracks.forEach(track => {
        const boneName = track.name.split('.')[0]
        character.scene.traverse((child) => {
          if (child.name === boneName || child.name.includes(boneName)) {
            matchedTracks++
          }
        })
      })
      console.log('匹配的 tracks:', matchedTracks, '/', clip.tracks.length)
    } catch (error) {
      console.error('播放动作失败:', error)
    }
  }

  /**
   * 加载VRMA动作 - 使用AR模式的正确方法
   */
  async loadVRMAAction(filePath, clipId, vrm) {
    try {
      console.log('加载VRMA动作:', filePath, 'VRM:', vrm ? '有' : '无')
      
      // 动态导入
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
      const { VRMAnimationLoaderPlugin, createVRMAnimationClip } = await import('@pixiv/three-vrm-animation')
      
      console.log('模块导入成功')
      
      // 使用 GLTFLoader + VRMAnimationLoaderPlugin 加载
      const loader = new GLTFLoader()
      loader.register((parser) => new VRMAnimationLoaderPlugin(parser))
      
      console.log('开始加载GLTF...')
      const gltf = await new Promise((resolve, reject) => {
        loader.load(filePath, resolve, undefined, reject)
      })
      
      console.log('GLTF加载成功:', gltf)
      
      // 检查是否有 VRMAnimation 数据
      const vrmAnimations = gltf.userData?.vrmAnimations
      
      console.log('vrmAnimations:', vrmAnimations, '长度:', vrmAnimations?.length)
      
      if (vrmAnimations && vrmAnimations.length > 0) {
        const vrmAnimation = vrmAnimations[0]
        console.log('✅ VRMA 动画加载成功:', filePath)
        
        if (vrm) {
          console.log('创建动画剪辑...')
          const clip = createVRMAnimationClip(vrmAnimation, vrm)
          console.log('动画剪辑创建成功:', clip.name, '时长:', clip.duration, 'tracks:', clip.tracks.length)
          
          if (!this.loadedMotions) this.loadedMotions = new Map()
          this.loadedMotions.set(clipId, { 
            clip, 
            duration: clip.duration * 1000, 
            filePath,
            type: 'vrma'
          })
          console.log('✅ 动画数据存储成功:', clipId)
        } else {
          console.warn('没有VRM对象，无法创建动画剪辑')
        }
      } else if (gltf.animations && gltf.animations.length > 0) {
        // 使用标准动画
        console.log('📁 加载标准动画:', filePath)
        const clip = gltf.animations[0]
        console.log('标准动画:', clip.name, '时长:', clip.duration, 'tracks:', clip.tracks.length)
        
        if (!this.loadedMotions) this.loadedMotions = new Map()
        this.loadedMotions.set(clipId, { 
          clip, 
          duration: clip.duration * 1000, 
          filePath,
          type: 'standard'
        })
        console.log('✅ 标准动画存储成功:', clipId)
      } else {
        console.error('文件中没有找到动画数据:', 'vrmAnimations:', vrmAnimations, 'animations:', gltf.animations)
        throw new Error('文件中没有找到动画数据')
      }
    } catch (error) {
      console.error('❌ 加载动画失败:', filePath, error.message, error.stack)
      // 尝试作为标准GLB动画加载
      this.loadStandardAnimation(filePath, clipId)
    }
  }

  /**
   * 加载标准动画（备用方案）
   */
  async loadStandardAnimation(filePath, clipId) {
    try {
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
      const loader = new GLTFLoader()
      const gltf = await loader.loadAsync(filePath)
      
      if (gltf.animations && gltf.animations.length > 0) {
        const clip = gltf.animations[0]
        if (!this.loadedMotions) this.loadedMotions = new Map()
        this.loadedMotions.set(clipId, { 
          clip, 
          duration: clip.duration * 1000, 
          filePath,
          type: 'standard'
        })
        console.log('📁 标准动画加载成功:', clipId)
      }
    } catch (error) {
      console.error('❌ 标准动画加载也失败:', error)
    }
  }

  /**
   * 加载动作文件
   */
  async loadMotionFile(url, clipId) {
    try {
      console.log('加载动作文件:', url, 'clipId:', clipId)
      
      // 确保路径是绝对路径
      let fullUrl = url
      if (!url.startsWith('http') && !url.startsWith('/')) {
        fullUrl = '/' + url
      }
      
      console.log('完整动作路径:', fullUrl)
      
      // 根据文件扩展名选择加载器
      const ext = fullUrl.split('.').pop()?.toLowerCase()
      
      if (ext === 'vrma') {
        // VRMA格式 (VRM Animation)
        await this.loadVRMA(fullUrl, clipId)
      } else if (ext === 'vmd') {
        // VMD格式 (MMD动作)
        await this.loadVMD(fullUrl, clipId)
      } else if (ext === 'bvh') {
        // BVH格式
        await this.loadBVH(fullUrl, clipId)
      } else if (ext === 'glb' || ext === 'gltf') {
        // GLB格式也作为动作加载
        await this.loadVRMAWithGLTF(fullUrl, clipId)
      } else {
        console.warn('不支持的动作格式:', ext, 'URL:', fullUrl)
        // 尝试用GLTF加载
        await this.loadVRMAWithGLTF(fullUrl, clipId)
      }
    } catch (error) {
      console.error('加载动作文件失败:', error)
    }
  }

  /**
   * 加载VRMA动作
   */
  async loadVRMA(url, clipId) {
    try {
      // 尝试不同的导入方式
      let VRMAnimationLoader
      try {
        const module = await import('@pixiv/three-vrm-animation')
        VRMAnimationLoader = module.VRMAnimationLoader || module.default
      } catch (e) {
        console.warn('@pixiv/three-vrm-animation 导入失败，尝试备用方案')
        // 使用GLTFLoader作为备用
        return this.loadVRMAWithGLTF(url, clipId)
      }
      
      if (!VRMAnimationLoader) {
        return this.loadVRMAWithGLTF(url, clipId)
      }
      
      const loader = new VRMAnimationLoader()
      const vrmAnimation = await loader.loadAsync(url)
      
      // 存储动作数据
      if (!this.loadedMotions) this.loadedMotions = new Map()
      this.loadedMotions.set(clipId, {
        type: 'vrma',
        duration: vrmAnimation.duration || 5,
        animation: vrmAnimation,
        getPoseAtTime: (time) => {
          // 从VRMA中提取指定时间的姿态
          if (vrmAnimation.humanoidAnimation) {
            return this.extractVRMAPose(vrmAnimation, time)
          }
          return null
        }
      })
      
      console.log('VRMA动作加载完成:', clipId, '时长:', vrmAnimation.duration)
    } catch (error) {
      console.error('加载VRMA失败:', error)
      // 使用备用方案
      return this.loadVRMAWithGLTF(url, clipId)
    }
  }
  
  /**
   * 使用GLTFLoader加载VRMA（备用方案）
   */
  async loadVRMAWithGLTF(url, clipId) {
    try {
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
      
      const loader = new GLTFLoader()
      const gltf = await loader.loadAsync(url)
      
      // VRMA文件作为GLB加载
      const animation = gltf.animations[0]
      
      if (!this.loadedMotions) this.loadedMotions = new Map()
      this.loadedMotions.set(clipId, {
        type: 'vrma-gltf',
        duration: animation ? animation.duration : 5,
        animation: gltf,
        getPoseAtTime: (time) => {
          // 从GLTF动画中提取姿态
          return this.extractGLTFAnimationPose(gltf, time)
        }
      })
      
      console.log('VRMA(GLTF)动作加载完成:', clipId)
    } catch (error) {
      console.error('VRMA备用加载也失败:', error)
    }
  }
  
  /**
   * 从VRMA提取姿态
   */
  extractVRMAPose(vrmAnimation, time) {
    const pose = {}
    
    // 简化实现：从VRMA动画数据中提取
    if (vrmAnimation.humanoidAnimation && vrmAnimation.humanoidAnimation.rotations) {
      const rotations = vrmAnimation.humanoidAnimation.rotations
      
      // 根据时间获取旋转值
      for (const [boneName, track] of Object.entries(rotations)) {
        if (track.times && track.values) {
          // 找到当前时间的值
          let index = 0
          for (let i = 0; i < track.times.length - 1; i++) {
            if (track.times[i] <= time && track.times[i + 1] >= time) {
              index = i * 3
              break
            }
          }
          
          pose[boneName] = {
            x: track.values[index] || 0,
            y: track.values[index + 1] || 0,
            z: track.values[index + 2] || 0
          }
        }
      }
    }
    
    return pose
  }
  
  /**
   * 从GLTF动画提取姿态
   */
  extractGLTFAnimationPose(gltf, time) {
    const pose = {}
    
    if (gltf.animations && gltf.animations[0]) {
      const animation = gltf.animations[0]
      
      animation.tracks.forEach(track => {
        const boneName = track.name.split('.')[0]
        
        if (track.times && track.values) {
          // 找到当前时间的值
          let index = 0
          for (let i = 0; i < track.times.length - 1; i++) {
            if (track.times[i] <= time && track.times[i + 1] >= time) {
              const t = (time - track.times[i]) / (track.times[i + 1] - track.times[i])
              index = i * 3
              
              // 插值
              pose[boneName] = {
                x: track.values[index] + (track.values[index + 3] - track.values[index]) * t,
                y: track.values[index + 1] + (track.values[index + 4] - track.values[index + 1]) * t,
                z: track.values[index + 2] + (track.values[index + 5] - track.values[index + 2]) * t
              }
              break
            }
          }
        }
      })
    }
    
    return pose
  }

  /**
   * 加载VMD动作
   */
  async loadVMD(url, clipId) {
    try {
      console.log('尝试加载VMD:', url)
      
      // VMD加载需要MMDLoader
      let MMDLoader
      try {
        const module = await import('three/examples/jsm/loaders/MMDLoader.js')
        MMDLoader = module.MMDLoader
      } catch (e) {
        console.warn('MMDLoader 导入失败，使用备用方案')
        // VMD格式比较复杂，暂时用GLTF作为备用
        return this.loadVRMAWithGLTF(url, clipId)
      }
      
      if (!MMDLoader) {
        return this.loadVRMAWithGLTF(url, clipId)
      }
      
      const loader = new MMDLoader()
      
      // VMDLoader 可能没有 loadVMDAsync 方法，使用普通 load
      const vmdData = await new Promise((resolve, reject) => {
        loader.load(url, (data) => resolve(data), undefined, (err) => reject(err))
      })
      
      if (!this.loadedMotions) this.loadedMotions = new Map()
      this.loadedMotions.set(clipId, {
        type: 'vmd',
        duration: vmdData.duration || 10,
        animation: vmdData,
        getPoseAtTime: (time) => {
          return this.extractVMDPose(vmdData, time)
        }
      })
      
      console.log('VMD动作加载完成:', clipId)
    } catch (error) {
      console.error('加载VMD失败:', error)
      // 使用GLTF作为备用
      return this.loadVRMAWithGLTF(url, clipId)
    }
  }

  /**
   * 加载BVH动作
   */
  async loadBVH(url, clipId) {
    try {
      console.log('尝试加载BVH:', url)
      
      let BVHLoader
      try {
        const module = await import('three/examples/jsm/loaders/BVHLoader.js')
        BVHLoader = module.BVHLoader
      } catch (e) {
        console.warn('BVHLoader 导入失败，使用备用方案')
        return this.loadVRMAWithGLTF(url, clipId)
      }
      
      if (!BVHLoader) {
        return this.loadVRMAWithGLTF(url, clipId)
      }
      
      const loader = new BVHLoader()
      const bvhData = await loader.loadAsync(url)
      
      if (!this.loadedMotions) this.loadedMotions = new Map()
      this.loadedMotions.set(clipId, {
        type: 'bvh',
        duration: bvhData.clip?.duration || 10,
        animation: bvhData,
        getPoseAtTime: (time) => {
          return this.extractBVHPose(bvhData, time)
        }
      })
      
      console.log('BVH动作加载完成:', clipId)
    } catch (error) {
      console.error('加载BVH失败:', error)
      return this.loadVRMAWithGLTF(url, clipId)
    }
  }

  /**
   * 从VMD数据提取姿态
   */
  extractVMDPose(vmdData, time) {
    // 简化实现：根据时间插值计算骨骼旋转
    // 实际实现需要解析VMD的骨骼关键帧数据
    const pose = {}
    
    if (vmdData.bones) {
      vmdData.bones.forEach(bone => {
        const keyframes = bone.keyframes
        if (!keyframes || keyframes.length === 0) return
        
        // 找到当前时间前后的关键帧
        let prevFrame = keyframes[0]
        let nextFrame = keyframes[keyframes.length - 1]
        
        for (let i = 0; i < keyframes.length - 1; i++) {
          if (keyframes[i].frameNum <= time && keyframes[i + 1].frameNum >= time) {
            prevFrame = keyframes[i]
            nextFrame = keyframes[i + 1]
            break
          }
        }
        
        // 线性插值
        const t = (time - prevFrame.frameNum) / (nextFrame.frameNum - prevFrame.frameNum)
        pose[bone.name] = {
          x: prevFrame.rotation[0] + (nextFrame.rotation[0] - prevFrame.rotation[0]) * t,
          y: prevFrame.rotation[1] + (nextFrame.rotation[1] - prevFrame.rotation[1]) * t,
          z: prevFrame.rotation[2] + (nextFrame.rotation[2] - prevFrame.rotation[2]) * t
        }
      })
    }
    
    return pose
  }

  /**
   * 从BVH数据提取姿态
   */
  extractBVHPose(bvhData, time) {
    // BVH姿态提取
    const pose = {}
    
    if (bvhData.clip && bvhData.clip.tracks) {
      bvhData.clip.tracks.forEach(track => {
        const boneName = track.name.split('.')[0]
        const values = track.values
        const times = track.times
        
        // 找到当前时间对应的值
        let index = 0
        for (let i = 0; i < times.length - 1; i++) {
          if (times[i] <= time && times[i + 1] >= time) {
            index = i * 3
            break
          }
        }
        
        pose[boneName] = {
          x: values[index] || 0,
          y: values[index + 1] || 0,
          z: values[index + 2] || 0
        }
      })
    }
    
    return pose
  }

  /**
   * 标准化骨骼名称
   */
  normalizeBoneName(name) {
    // VRM标准骨骼名称映射 (VRM 0.0 和 1.0 规范)
    const boneMap = {
      // 日文名称
      '全ての親': 'hips',
      'センター': 'hips',
      '下半身': 'leftUpperLeg',
      '上半身': 'spine',
      '上半身2': 'chest',
      '首': 'neck',
      '頭': 'head',
      '左肩': 'leftShoulder',
      '左腕': 'leftUpperArm',
      '左ひじ': 'leftLowerArm',
      '左手首': 'leftHand',
      '右肩': 'rightShoulder',
      '右腕': 'rightUpperArm',
      '右ひじ': 'rightLowerArm',
      '右手首': 'rightHand',
      '左足': 'leftUpperLeg',
      '左ひざ': 'leftLowerLeg',
      '左足首': 'leftFoot',
      '右足': 'rightUpperLeg',
      '右ひざ': 'rightLowerLeg',
      '右足首': 'rightFoot',
      '左親指': 'leftThumbProximal',
      '左人指': 'leftIndexProximal',
      '左中指': 'leftMiddleProximal',
      '左薬指': 'leftRingProximal',
      '左小指': 'leftLittleProximal',
      '右親指': 'rightThumbProximal',
      '右人指': 'rightIndexProximal',
      '右中指': 'rightMiddleProximal',
      '右薬指': 'rightRingProximal',
      '右小指': 'rightLittleProximal',
      
      // 英文名称 (GLTF/VRM 标准)
      'Hips': 'hips',
      'Spine': 'spine',
      'Chest': 'chest',
      'UpperChest': 'upperChest',
      'Neck': 'neck',
      'Head': 'head',
      'LeftShoulder': 'leftShoulder',
      'LeftUpperArm': 'leftUpperArm',
      'LeftLowerArm': 'leftLowerArm',
      'LeftHand': 'leftHand',
      'RightShoulder': 'rightShoulder',
      'RightUpperArm': 'rightUpperArm',
      'RightLowerArm': 'rightLowerArm',
      'RightHand': 'rightHand',
      'LeftUpperLeg': 'leftUpperLeg',
      'LeftLowerLeg': 'leftLowerLeg',
      'LeftFoot': 'leftFoot',
      'RightUpperLeg': 'rightUpperLeg',
      'RightLowerLeg': 'rightLowerLeg',
      'RightFoot': 'rightFoot',
      'LeftToes': 'leftToes',
      'RightToes': 'rightToes',
      'LeftEye': 'leftEye',
      'RightEye': 'rightEye',
      'Jaw': 'jaw',
      
      // 小写变体
      'hips': 'hips',
      'spine': 'spine',
      'chest': 'chest',
      'neck': 'neck',
      'head': 'head',
      'leftShoulder': 'leftShoulder',
      'leftUpperArm': 'leftUpperArm',
      'leftLowerArm': 'leftLowerArm',
      'leftHand': 'leftHand',
      'rightShoulder': 'rightShoulder',
      'rightUpperArm': 'rightUpperArm',
      'rightLowerArm': 'rightLowerArm',
      'rightHand': 'rightHand',
      'leftUpperLeg': 'leftUpperLeg',
      'leftLowerLeg': 'leftLowerLeg',
      'leftFoot': 'leftFoot',
      'rightUpperLeg': 'rightUpperLeg',
      'rightLowerLeg': 'rightLowerLeg',
      'rightFoot': 'rightFoot',
      
      // Mixamo 格式映射到 VRM
      'mixamorigHips': 'hips',
      'mixamorigSpine': 'spine',
      'mixamorigSpine1': 'chest',
      'mixamorigSpine2': 'upperChest',
      'mixamorigNeck': 'neck',
      'mixamorigHead': 'head',
      'mixamorigLeftShoulder': 'leftShoulder',
      'mixamorigLeftArm': 'leftUpperArm',
      'mixamorigLeftForeArm': 'leftLowerArm',
      'mixamorigLeftHand': 'leftHand',
      'mixamorigRightShoulder': 'rightShoulder',
      'mixamorigRightArm': 'rightUpperArm',
      'mixamorigRightForeArm': 'rightLowerArm',
      'mixamorigRightHand': 'rightHand',
      'mixamorigLeftUpLeg': 'leftUpperLeg',
      'mixamorigLeftLeg': 'leftLowerLeg',
      'mixamorigLeftFoot': 'leftFoot',
      'mixamorigLeftToeBase': 'leftToes',
      'mixamorigRightUpLeg': 'rightUpperLeg',
      'mixamorigRightLeg': 'rightLowerLeg',
      'mixamorigRightFoot': 'rightFoot',
      'mixamorigRightToeBase': 'rightToes',
      // Mixamo 手指
      'mixamorigLeftHandThumb1': 'leftThumbProximal',
      'mixamorigLeftHandThumb2': 'leftThumbIntermediate',
      'mixamorigLeftHandThumb3': 'leftThumbDistal',
      'mixamorigLeftHandIndex1': 'leftIndexProximal',
      'mixamorigLeftHandIndex2': 'leftIndexIntermediate',
      'mixamorigLeftHandIndex3': 'leftIndexDistal',
      'mixamorigLeftHandMiddle1': 'leftMiddleProximal',
      'mixamorigLeftHandMiddle2': 'leftMiddleIntermediate',
      'mixamorigLeftHandMiddle3': 'leftMiddleDistal',
      'mixamorigLeftHandRing1': 'leftRingProximal',
      'mixamorigLeftHandRing2': 'leftRingIntermediate',
      'mixamorigLeftHandRing3': 'leftRingDistal',
      'mixamorigLeftHandPinky1': 'leftLittleProximal',
      'mixamorigLeftHandPinky2': 'leftLittleIntermediate',
      'mixamorigLeftHandPinky3': 'leftLittleDistal',
      'mixamorigRightHandThumb1': 'rightThumbProximal',
      'mixamorigRightHandThumb2': 'rightThumbIntermediate',
      'mixamorigRightHandThumb3': 'rightThumbDistal',
      'mixamorigRightHandIndex1': 'rightIndexProximal',
      'mixamorigRightHandIndex2': 'rightIndexIntermediate',
      'mixamorigRightHandIndex3': 'rightIndexDistal',
      'mixamorigRightHandMiddle1': 'rightMiddleProximal',
      'mixamorigRightHandMiddle2': 'rightMiddleIntermediate',
      'mixamorigRightHandMiddle3': 'rightMiddleDistal',
      'mixamorigRightHandRing1': 'rightRingProximal',
      'mixamorigRightHandRing2': 'rightRingIntermediate',
      'mixamorigRightHandRing3': 'rightRingDistal',
      'mixamorigRightHandPinky1': 'rightLittleProximal',
      'mixamorigRightHandPinky2': 'rightLittleIntermediate',
      'mixamorigRightHandPinky3': 'rightLittleDistal'
    }
    
    const normalized = boneMap[name] || name
    return normalized
  }

  /**
   * 同步对象属性到3D场景
   */
  syncObjectProperties(project) {
    if (!project) return
    
    // 同步角色属性
    if (project.characters) {
      project.characters.forEach(char => {
        const character = this.characters.get(char.id)
        if (character && character.scene) {
          // 应用位置
          if (char.transform?.position) {
            character.scene.position.set(
              char.transform.position.x || 0,
              char.transform.position.y || 0,
              char.transform.position.z || 0
            )
          }
          // 应用旋转
          if (char.transform?.rotation) {
            character.scene.rotation.set(
              (char.transform.rotation.x || 0) * Math.PI / 180,
              (char.transform.rotation.y || 0) * Math.PI / 180,
              (char.transform.rotation.z || 0) * Math.PI / 180
            )
          }
          // 应用缩放
          if (char.transform?.scale !== undefined) {
            const scale = char.transform.scale || 1
            character.scene.scale.setScalar(scale)
          }
          // 应用可见性
          if (char.transform?.visible !== undefined) {
            character.scene.visible = char.transform.visible
          }
        }
      })
    }
    
    // 同步道具属性
    if (project.props) {
      project.props.forEach(prop => {
        const propModel = this.props.get(prop.id)
        if (propModel) {
          // 应用位置
          if (prop.transform?.position) {
            propModel.position.set(
              prop.transform.position.x || 0,
              prop.transform.position.y || 0,
              prop.transform.position.z || 0
            )
          }
          // 应用旋转
          if (prop.transform?.rotation) {
            propModel.rotation.set(
              (prop.transform.rotation.x || 0) * Math.PI / 180,
              (prop.transform.rotation.y || 0) * Math.PI / 180,
              (prop.transform.rotation.z || 0) * Math.PI / 180
            )
          }
          // 应用缩放
          if (prop.transform?.scale !== undefined) {
            const scale = prop.transform.scale || 1
            propModel.scale.setScalar(scale)
          }
          // 应用可见性
          if (prop.transform?.visible !== undefined) {
            propModel.visible = prop.transform.visible
          }
        }
      })
    }
  }

  /**
   * 更新动画（根据时间轴时间）
   */
  updateAnimation(currentTime, project) {
    if (!project || !project.tracks) return

    let hasActiveScene = false
    let hasActiveMotion = false

    // 同步所有对象属性
    this.syncObjectProperties(project)

    // 遍历所有轨道，更新动画
    project.tracks.forEach(track => {
      // 处理动作轨道
      if (track.type === 'motion' && track.clips) {
        const activeClip = track.clips.find(clip => 
          currentTime >= clip.start && currentTime <= clip.end
        )
        
        if (activeClip) {
          hasActiveMotion = true
          const character = this.characters.get(track.targetId)
          if (character) {
            const clipTime = currentTime - activeClip.start
            const progress = clipTime / (activeClip.end - activeClip.start)
            
            // 实际更新VRM动作
            this.updateCharacterMotion(character, activeClip, clipTime, progress)
            
            if (Math.floor(currentTime * 10) % 10 === 0) {
              console.log('动作播放中:', activeClip.name, '角色:', track.targetId, '进度:', progress.toFixed(2))
            }
          } else {
            console.warn('动作轨道找不到角色:', track.targetId)
          }
        }
      }
      
      // 处理场景轨道
      if (track.type === 'scene' && track.clips) {
        const activeClip = track.clips.find(clip => 
          currentTime >= clip.start && currentTime <= clip.end
        )
        
        if (activeClip) {
          hasActiveScene = true
          if (!this.currentScene || this.currentScene.id !== activeClip.id) {
            console.log('切换到场景:', activeClip.name, '时间:', currentTime)
            this.loadSceneFromClip(activeClip)
          }
        } else {
          if (this.currentScene) {
            this.clearScene()
          }
        }
      }
      
      // 处理道具轨道
      if (track.type === 'prop' && track.clips) {
        const activeClip = track.clips.find(clip => 
          currentTime >= clip.start && currentTime <= clip.end
        )
        
        if (activeClip) {
          if (!this.currentProps) this.currentProps = new Map()
          
          if (!this.currentProps.has(activeClip.id)) {
            this.loadPropFromClip(activeClip, track.targetId)
          }
        }
        
        // 隐藏不在当前时间的道具
        if (this.currentProps) {
          this.currentProps.forEach((propData, clipId) => {
            const isActive = track.clips.some(clip => 
              clip.id === clipId && currentTime >= clip.start && currentTime <= clip.end
            )
            if (propData.model) {
              propData.model.visible = isActive
            }
          })
        }
      }
      
      // 处理表情轨道
      if (track.type === 'expression' && track.clips) {
        const activeClip = track.clips.find(clip => 
          currentTime >= clip.start && currentTime <= clip.end
        )
        
        if (activeClip) {
          const character = this.characters.get(track.targetId)
          if (character) {
            this.applyExpression(character, activeClip.expressionType || activeClip.name)
          }
        }
      }
      
      // 处理摄像机轨道
      if (track.type === 'camera' && track.clips) {
        const activeClip = track.clips.find(clip => 
          currentTime >= clip.start && currentTime <= clip.end
        )
        
        if (activeClip && activeClip.cameraData) {
          this.updateCameraFromClip(activeClip, currentTime)
        }
      }
      
      // 处理音乐轨道（音频播放控制）
      if (track.type === 'music' && track.clips) {
        const activeClip = track.clips.find(clip => 
          currentTime >= clip.start && currentTime <= clip.end
        )
        
        if (activeClip) {
          if (!this.currentMusic || this.currentMusic.id !== activeClip.id) {
            this.playMusicFromClip(activeClip)
          }
        } else {
          if (this.currentMusic) {
            this.stopMusic()
          }
        }
      }
    })
  }
  
  /**
   * 加载道具
   */
  async loadPropFromClip(clip, targetId) {
    try {
      if (!clip.resourcePath) return
      
      console.log('加载道具:', clip.name, '目标角色:', targetId, '特质:', clip.traits)
      
      const propModel = await this.loadGLBModel(clip.resourcePath, clip.id, 'prop')
      
      // 获取特质设置
      const traits = clip.traits || {}
      
      // 如果有目标角色，将道具绑定到角色
      if (targetId) {
        const character = this.characters.get(targetId)
        if (character && character.scene) {
          // 如果设置了骨骼绑定
          if (traits.bindBone && traits.bindBone !== 'none') {
            // 绑定到指定骨骼
            this.bindPropToBone(propModel, character, traits)
          } else {
            // 直接附加到角色根节点
            character.scene.add(propModel)
            propModel.position.set(0, 0, 0)
          }
        }
      }
      
      if (!this.currentProps) this.currentProps = new Map()
      this.currentProps.set(clip.id, { 
        model: propModel, 
        targetId,
        traits: traits,
        originalPosition: propModel.position.clone(),
        originalRotation: propModel.rotation.clone()
      })
    } catch (error) {
      console.error('加载道具失败:', error)
    }
  }
  
  /**
   * 绑定道具到角色骨骼
   */
  bindPropToBone(propModel, character, traits) {
    const boneName = traits.bindBone
    
    // VRM骨骼名称映射
    const boneMap = {
      'head': ['head', 'Head', 'J_AHead', '頭'],
      'neck': ['neck', 'Neck', 'J_Neck', '首'],
      'chest': ['chest', 'Chest', 'upperChest', 'UpperChest', 'J_Spine2', '上半身2'],
      'spine': ['spine', 'Spine', 'J_Spine', 'J_Spine1', '上半身'],
      'leftHand': ['leftHand', 'LeftHand', 'J_L_Hand', '左手首'],
      'rightHand': ['rightHand', 'RightHand', 'J_R_Hand', '右手首'],
      'leftFoot': ['leftFoot', 'LeftFoot', 'J_L_Foot', '左足首'],
      'rightFoot': ['rightFoot', 'RightFoot', 'J_R_Foot', '右足首'],
      'leftEye': ['leftEye', 'LeftEye', 'J_L_Eye', '左目'],
      'rightEye': ['rightEye', 'RightEye', 'J_R_Eye', '右目']
    }
    
    const possibleNames = boneMap[boneName] || [boneName]
    let targetBone = null
    
    // 在角色中查找骨骼
    character.scene.traverse((child) => {
      if (possibleNames.includes(child.name) || 
          possibleNames.some(name => child.name.toLowerCase().includes(name.toLowerCase()))) {
        targetBone = child
      }
    })
    
    if (targetBone) {
      // 将道具附加到骨骼
      targetBone.add(propModel)
      
      // 应用位置偏移
      const offset = traits.positionOffset || { x: 0, y: 0, z: 0 }
      propModel.position.set(offset.x || 0, offset.y || 0, offset.z || 0)
      
      // 应用旋转偏移
      const rotationOffset = traits.rotationOffset || { x: 0, y: 0, z: 0 }
      propModel.rotation.set(
        (rotationOffset.x || 0) * Math.PI / 180,
        (rotationOffset.y || 0) * Math.PI / 180,
        (rotationOffset.z || 0) * Math.PI / 180
      )
      
      console.log('✅ 道具绑定到骨骼:', boneName, '骨骼对象:', targetBone.name, '位置偏移:', offset)
      
      // 存储绑定信息用于后续更新
      propModel.userData.bindInfo = {
        bone: targetBone,
        character: character,
        traits: traits,
        followMotion: traits.followMotion !== false, // 默认跟随动作
        keepRelativePosition: traits.keepRelativePosition !== false // 默认保持相对位置
      }
    } else {
      console.warn('❌ 未找到骨骼:', boneName, '尝试的别名:', possibleNames)
      // 回退到根节点
      character.scene.add(propModel)
      propModel.position.set(0, 0, 0)
    }
  }
  
  /**
   * 更新道具绑定（在动画更新时调用）
   */
  updatePropBindings() {
    if (!this.currentProps) return
    
    this.currentProps.forEach((propData, clipId) => {
      const { model, traits } = propData
      if (!model || !model.userData.bindInfo) return
      
      const bindInfo = model.userData.bindInfo
      
      // 如果设置了跟随动作，道具会自动跟随骨骼
      // 这里可以添加额外的逻辑，如根据动作调整道具位置
      if (bindInfo.followMotion && bindInfo.character) {
        // 道具已经绑定到骨骼，骨骼运动会自动带动道具
        // 可以在这里添加额外的动态调整
      }
    })
  }
  
  /**
   * 更新道具特质
   */
  updatePropTraits(propId, newTraits) {
    const propData = this.currentProps?.get(propId)
    if (!propData) return
    
    const { model, targetId } = propData
    if (!model) return
    
    // 如果绑定骨骼发生变化，需要重新绑定
    const oldTraits = propData.traits || {}
    if (newTraits.bindBone !== oldTraits.bindBone) {
      // 从当前父节点移除
      if (model.parent) {
        const worldPos = new this.THREE.Vector3()
        const worldQuat = new this.THREE.Quaternion()
        const worldScale = new this.THREE.Vector3()
        model.matrixWorld.decompose(worldPos, worldQuat, worldScale)
        
        model.parent.remove(model)
        this.scene.add(model)
        model.position.copy(worldPos)
        model.quaternion.copy(worldQuat)
        model.scale.copy(worldScale)
      }
      
      // 重新绑定
      if (targetId && newTraits.bindBone && newTraits.bindBone !== 'none') {
        const character = this.characters.get(targetId)
        if (character) {
          this.bindPropToBone(model, character, newTraits)
        }
      }
    } else {
      // 只更新位置和旋转偏移
      const bindInfo = model.userData.bindInfo
      if (bindInfo) {
        const offset = newTraits.positionOffset || { x: 0, y: 0, z: 0 }
        model.position.set(offset.x || 0, offset.y || 0, offset.z || 0)
        
        const rotationOffset = newTraits.rotationOffset || { x: 0, y: 0, z: 0 }
        model.rotation.set(
          (rotationOffset.x || 0) * Math.PI / 180,
          (rotationOffset.y || 0) * Math.PI / 180,
          (rotationOffset.z || 0) * Math.PI / 180
        )
        
        bindInfo.traits = newTraits
        bindInfo.followMotion = newTraits.followMotion !== false
        bindInfo.keepRelativePosition = newTraits.keepRelativePosition !== false
      }
    }
    
    // 更新存储的特质
    propData.traits = newTraits
  }
  
  /**
   * 应用表情
   */
  applyExpression(character, expressionName) {
    // VRM表情控制
    if (character && character.expressionManager) {
      try {
        // 重置所有表情
        character.expressionManager.clearExpressions()
        
        // 应用新表情
        const expressionMap = {
          '开心': 'happy',
          '伤心': 'sad',
          '生气': 'angry',
          '惊讶': 'surprised',
          '眨眼': 'blink'
        }
        
        const vrmExpression = expressionMap[expressionName] || expressionName.toLowerCase()
        character.expressionManager.setValue(vrmExpression, 1.0)
        
        console.log('应用表情:', expressionName)
      } catch (error) {
        console.warn('应用表情失败:', error)
      }
    }
  }
  
  /**
   * 更新摄像机
   */
  updateCameraFromClip(clip, currentTime) {
    if (!clip.cameraData || !this.camera) return
    
    const { position, target, fov } = clip.cameraData
    
    // 计算片段内进度（用于插值）
    const clipTime = currentTime - clip.start
    const duration = clip.end - clip.start
    const progress = Math.min(clipTime / duration, 1)
    
    // 如果有起始和结束位置，进行插值
    if (clip.cameraData.startPosition && clip.cameraData.endPosition) {
      this.camera.position.lerpVectors(
        new this.THREE.Vector3(...clip.cameraData.startPosition),
        new this.THREE.Vector3(...clip.cameraData.endPosition),
        progress
      )
    } else if (position) {
      this.camera.position.set(position.x, position.y, position.z)
    }
    
    if (target) {
      this.controls.target.set(target.x, target.y, target.z)
    }
    
    if (fov) {
      this.camera.fov = fov
      this.camera.updateProjectionMatrix()
    }
    
    this.controls.update()
  }
  
  /**
   * 播放音乐
   */
  playMusicFromClip(clip) {
    try {
      if (!clip.resourcePath) return
      
      // 停止当前音乐
      this.stopMusic()
      
      console.log('播放音乐:', clip.name)
      
      // 创建音频元素
      const audio = new Audio(clip.resourcePath)
      audio.loop = clip.loop !== false
      audio.volume = clip.volume || 1.0
      
      // 如果已经在片段中间，跳到对应位置
      if (this.currentTime && this.currentTime > clip.start) {
        audio.currentTime = this.currentTime - clip.start
      }
      
      audio.play()
      
      this.currentMusic = {
        id: clip.id,
        audio: audio,
        startTime: clip.start
      }
    } catch (error) {
      console.error('播放音乐失败:', error)
    }
  }
  
  /**
   * 停止音乐
   */
  stopMusic() {
    if (this.currentMusic && this.currentMusic.audio) {
      this.currentMusic.audio.pause()
      this.currentMusic.audio.currentTime = 0
      this.currentMusic = null
    }
  }
  
  /**
   * 从片段加载场景
   */
  async loadSceneFromClip(clip) {
    try {
      // 如果已经有场景，先清除
      if (this.currentScene) {
        this.clearScene()
      }
      
      console.log('加载场景:', clip.name, '类型:', clip.sceneType, '路径:', clip.resourcePath, '颜色:', clip.color)
      
      if (clip.sceneType === 'color') {
        // 纯色背景
        const color = clip.color || '#0a0a0f'
        console.log('设置纯色背景:', color)
        this.setBackground('color', color)
        this.currentScene = { id: clip.id, type: 'color', color: color }
        console.log('纯色背景设置完成')
      } else if (clip.sceneType === 'image') {
        // 图片背景
        console.log('开始加载图片背景:', clip.resourcePath)
        if (clip.resourcePath) {
          // 检查文件扩展名
          const ext = clip.resourcePath.split('.').pop()?.toLowerCase()
          const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'jfif', 'bmp']
          
          if (imageExts.includes(ext)) {
            console.log('图片格式支持:', ext)
            try {
              await this.setBackgroundImage(clip.resourcePath)
              this.currentScene = { id: clip.id, type: 'image', path: clip.resourcePath }
              console.log('图片背景加载完成')
            } catch (err) {
              console.error('图片背景加载失败:', err)
            }
          } else {
            console.warn('不支持的图片格式:', ext)
          }
        } else {
          console.warn('图片路径为空')
        }
      } else if (clip.sceneType === 'video') {
        // 视频背景
        if (clip.resourcePath) {
          await this.setBackgroundVideo(clip.resourcePath)
          this.currentScene = { id: clip.id, type: 'video', path: clip.resourcePath }
        }
      } else if (clip.sceneType === 'glb' || clip.sceneType === 'gltf') {
        // 3D场景模型
        if (clip.resourcePath) {
          const sceneModel = await this.loadGLBModel(clip.resourcePath, clip.id, 'scene')
          this.currentScene = { id: clip.id, type: '3d', model: sceneModel }
        }
      }
    } catch (error) {
      console.error('加载场景失败:', error)
      // 加载失败时恢复默认背景
      this.setBackground('color', '#0a0a0f')
    }
  }
  
  /**
   * 设置图片背景
   */
  async setBackgroundImage(url) {
    return new Promise((resolve, reject) => {
      const { THREE } = this
      const textureLoader = new THREE.TextureLoader()
      
      textureLoader.load(
        url,
        (texture) => {
          // 设置纹理参数
          texture.colorSpace = THREE.SRGBColorSpace
          texture.minFilter = THREE.LinearFilter
          texture.magFilter = THREE.LinearFilter
          
          // 计算合适的显示比例
          const canvasAspect = this.canvas.clientWidth / this.canvas.clientHeight
          const imageAspect = texture.image.width / texture.image.height
          
          if (imageAspect > canvasAspect) {
            texture.repeat.set(canvasAspect / imageAspect, 1)
            texture.offset.set((1 - canvasAspect / imageAspect) / 2, 0)
          } else {
            texture.repeat.set(1, imageAspect / canvasAspect)
            texture.offset.set(0, (1 - imageAspect / canvasAspect) / 2)
          }
          
          this.scene.background = texture
          this.backgroundTexture = texture
          console.log('图片背景加载成功:', url)
          resolve(texture)
        },
        undefined,
        (error) => {
          console.error('图片背景加载失败:', url, error)
          reject(error)
        }
      )
    })
  }
  
  /**
   * 设置视频背景
   */
  async setBackgroundVideo(url) {
    return new Promise((resolve, reject) => {
      const { THREE } = this
      
      // 创建视频元素
      const video = document.createElement('video')
      video.src = url
      video.loop = true
      video.muted = true
      video.playsInline = true
      video.crossOrigin = 'anonymous'
      
      video.addEventListener('loadeddata', () => {
        const texture = new THREE.VideoTexture(video)
        texture.colorSpace = THREE.SRGBColorSpace
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        
        this.scene.background = texture
        this.backgroundVideo = video
        this.backgroundTexture = texture
        
        video.play()
        console.log('视频背景加载成功:', url)
        resolve(texture)
      })
      
      video.addEventListener('error', (error) => {
        console.error('视频背景加载失败:', url, error)
        reject(error)
      })
      
      video.load()
    })
  }
  
  /**
   * 清除当前场景
   */
  clearScene() {
    if (this.currentScene) {
      if (this.currentScene.type === '3d' && this.currentScene.model) {
        this.scene.remove(this.currentScene.model)
      }
      this.currentScene = null
    }
    // 重置背景为纯色，但不影响角色
    if (this.THREE && this.scene) {
      this.scene.background = new this.THREE.Color('#0a0a0f')
    }
    // 清除图片纹理
    if (this.backgroundTexture) {
      this.backgroundTexture.dispose()
      this.backgroundTexture = null
    }
  }

  /**
   * 渲染循环
   */
  startRenderLoop() {
    // 防止多重渲染循环
    if (this.animationFrameId) {
      console.log('渲染循环已在运行，跳过重复启动')
      return
    }
    
    console.log('启动渲染循环')
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate)

      // 更新控制器
      if (this.controls) {
        this.controls.update()
      }

      // 更新VRM
      this.characters.forEach(vrm => {
        if (vrm.update) {
          vrm.update(1 / 60)
        }
        // 更新VRM动画混合器
        if (vrm.mixer) {
          vrm.mixer.update(1 / 60)
        }
      })
      
      // 更新道具绑定（跟随骨骼运动）
      this.updatePropBindings()

      // 渲染
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera)
      }
    }

    animate()
  }

  /**
   * 强制渲染一帧（用于模型加载后立即显示）
   */
  forceRender() {
    if (this.renderer && this.scene && this.camera && this.canvas) {
      console.log('强制渲染一帧，当前角色数:', this.characters.size)
      
      // 确保尺寸正确
      const width = this.canvas.clientWidth
      const height = this.canvas.clientHeight
      console.log('Canvas尺寸:', width, 'x', height)
      
      if (width > 0 && height > 0) {
        if (this.camera.isPerspectiveCamera) {
          this.camera.aspect = width / height
          this.camera.updateProjectionMatrix()
        }
        this.renderer.setSize(width, height)
      }
      
      // 更新控制器
      if (this.controls) {
        this.controls.update()
      }
      
      // 更新VRM
      this.characters.forEach((vrm, id) => {
        console.log('更新角色:', id)
        if (vrm.update) {
          vrm.update(0)
        }
        if (vrm.mixer) {
          vrm.mixer.update(0)
        }
        // 确保角色在场景中
        if (vrm.scene && !this.scene.children.includes(vrm.scene)) {
          console.log('重新添加角色到场景:', id)
          this.scene.add(vrm.scene)
        }
      })
      
      // 渲染场景
      this.renderer.render(this.scene, this.camera)
      console.log('强制渲染完成')
    } else {
      console.warn('强制渲染失败: 渲染器未初始化', {
        renderer: !!this.renderer,
        scene: !!this.scene,
        camera: !!this.camera,
        canvas: !!this.canvas
      })
    }
  }

  /**
   * 切换视图模式
   */
  setViewMode(mode) {
    if (!this.camera || !this.canvas) return
    
    const width = this.canvas.clientWidth
    const height = this.canvas.clientHeight
    const aspect = width / height
    
    // 保存当前位置和朝向
    const position = this.camera.position.clone()
    const target = this.controls ? this.controls.target.clone() : new THREE.Vector3(0, 1, 0)
    
    switch (mode) {
      case 'orthographic':
        // 切换到正交相机
        const frustumSize = 3
        this.camera = new THREE.OrthographicCamera(
          frustumSize * aspect / -2,
          frustumSize * aspect / 2,
          frustumSize / 2,
          frustumSize / -2,
          0.1,
          1000
        )
        break
        
      case 'camera':
        // 切换到场景摄像机（如果有）
        if (this.sceneCamera) {
          this.camera = this.sceneCamera
        } else {
          // 没有场景摄像机时，保持透视但提示
          console.warn('没有可用的场景摄像机')
          this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000)
        }
        break
        
      case 'perspective':
      default:
        // 切换到透视相机
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000)
        break
    }
    
    // 恢复位置和朝向
    this.camera.position.copy(position)
    if (this.controls) {
      this.controls.object = this.camera
      this.controls.target.copy(target)
      this.controls.update()
    }
    
    this.currentViewMode = mode
    console.log('视图模式切换到:', mode)
  }

  /**
   * 处理窗口大小变化
   */
  handleResize() {
    if (!this.canvas || !this.camera || !this.renderer) return

    const width = this.canvas.clientWidth
    const height = this.canvas.clientHeight

    if (this.camera.isPerspectiveCamera) {
      this.camera.aspect = width / height
    } else if (this.camera.isOrthographicCamera) {
      const frustumSize = 3
      const aspect = width / height
      this.camera.left = frustumSize * aspect / -2
      this.camera.right = frustumSize * aspect / 2
      this.camera.top = frustumSize / 2
      this.camera.bottom = frustumSize / -2
    }
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(width, height)
  }

  /**
   * 销毁
   */
  dispose() {
    // 停止渲染循环
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }

    // 移除事件监听
    window.removeEventListener('resize', this.handleResize.bind(this))

    // 清理场景
    if (this.scene) {
      this.scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose()
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose())
          } else {
            object.material.dispose()
          }
        }
      })
    }

    // 清理渲染器
    if (this.renderer) {
      this.renderer.dispose()
    }

    // 清理控制器
    if (this.controls) {
      this.controls.dispose()
    }

    this.isInitialized = false
  }
}
