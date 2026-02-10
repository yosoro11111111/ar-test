/**
 * 高级光照系统
 * 
 * 功能：
 * - HDR环境光照
 * - 级联阴影贴图(CSM)
 * - 体积光/上帝光
 * - 反射探针
 * - 全局光照
 */

export class AdvancedLighting {
  constructor(scene, renderer, camera) {
    this.scene = scene
    this.renderer = renderer
    this.camera = camera
    this.THREE = null

    // 光照系统组件
    this.lights = new Map()
    this.reflectionProbes = new Map()
    this.environmentMap = null
    this.csm = null // 级联阴影
    this.volumetricLights = new Map()

    // 光照设置
    this.settings = {
      enableHDR: true,
      enableCSM: true,
      enableVolumetric: true,
      enableReflection: true,
      shadowQuality: 'high', // low, medium, high, ultra
      exposure: 1.0,
      ambientIntensity: 0.4
    }

    this.isInitialized = false
  }

  /**
   * 初始化高级光照系统
   */
  async init() {
    if (this.isInitialized) return

    try {
      this.THREE = await import('three')

      // 初始化级联阴影
      if (this.settings.enableCSM) {
        await this.initCSM()
      }

      // 初始化环境光照
      if (this.settings.enableHDR) {
        await this.initHDRLighting()
      }

      this.isInitialized = true
      console.log('高级光照系统初始化完成')
    } catch (error) {
      console.error('高级光照系统初始化失败:', error)
    }
  }

  /**
   * 初始化级联阴影贴图(CSM)
   */
  async initCSM() {
    try {
      const { CSM } = await import('three/examples/jsm/csm/CSM.js')
      const { CSMHelper } = await import('three/examples/jsm/csm/CSMHelper.js')

      this.csm = new CSM({
        maxFar: 100,
        cascades: 4,
        mode: 'practical',
        parent: this.scene,
        shadowMapSize: 2048,
        lightDirection: new this.THREE.Vector3(1, -1, -1).normalize(),
        camera: this.camera
      })

      // 配置阴影质量
      const qualitySettings = {
        low: { mapSize: 1024, cascades: 2 },
        medium: { mapSize: 2048, cascades: 3 },
        high: { mapSize: 2048, cascades: 4 },
        ultra: { mapSize: 4096, cascades: 4 }
      }

      const settings = qualitySettings[this.settings.shadowQuality] || qualitySettings.high
      this.csm.shadowMap.setSize(settings.mapSize, settings.mapSize)

      console.log('CSM级联阴影初始化完成')
    } catch (error) {
      console.warn('CSM初始化失败，使用标准阴影:', error)
      this.settings.enableCSM = false
    }
  }

  /**
   * 初始化HDR环境光照
   */
  async initHDRLighting() {
    try {
      const { RGBELoader } = await import('three/examples/jsm/loaders/RGBELoader.js')
      const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js')

      // 创建默认室内环境
      const environment = new RoomEnvironment()
      const pmremGenerator = new this.THREE.PMREMGenerator(this.renderer)
      pmremGenerator.compileEquirectangularShader()

      this.environmentMap = pmremGenerator.fromScene(environment).texture
      this.scene.environment = this.environmentMap

      // 设置环境光强度
      this.scene.environmentIntensity = this.settings.ambientIntensity

      environment.dispose()
      pmremGenerator.dispose()

      console.log('HDR环境光照初始化完成')
    } catch (error) {
      console.warn('HDR环境光照初始化失败:', error)
      this.settings.enableHDR = false
    }
  }

  /**
   * 加载HDR环境贴图
   */
  async loadHDREnvironment(url) {
    try {
      const { RGBELoader } = await import('three/examples/jsm/loaders/RGBELoader.js')

      const loader = new RGBELoader()
      const texture = await loader.loadAsync(url)

      texture.mapping = this.THREE.EquirectangularReflectionMapping

      const pmremGenerator = new this.THREE.PMREMGenerator(this.renderer)
      pmremGenerator.compileEquirectangularShader()

      this.environmentMap = pmremGenerator.fromEquirectangular(texture).texture
      this.scene.environment = this.environmentMap

      // 可选：设置背景
      // this.scene.background = this.environmentMap

      pmremGenerator.dispose()
      texture.dispose()

      console.log('HDR环境贴图加载完成:', url)
    } catch (error) {
      console.error('加载HDR环境贴图失败:', error)
    }
  }

  /**
   * 添加体积光/上帝光
   */
  addVolumetricLight(id, position, options = {}) {
    const {
      color = 0xffffff,
      intensity = 1,
      angle = Math.PI / 6,
      penumbra = 0.1,
      decay = 2,
      distance = 100,
      volumetricIntensity = 0.5
    } = options

    // 创建聚光灯
    const spotLight = new this.THREE.SpotLight(color, intensity)
    spotLight.position.copy(position)
    spotLight.angle = angle
    spotLight.penumbra = penumbra
    spotLight.decay = decay
    spotLight.distance = distance
    spotLight.castShadow = true

    // 设置阴影参数
    spotLight.shadow.mapSize.width = 1024
    spotLight.shadow.mapSize.height = 1024
    spotLight.shadow.camera.near = 0.5
    spotLight.shadow.camera.far = 500
    spotLight.shadow.bias = -0.001

    // 创建目标点
    const target = new this.THREE.Object3D()
    target.position.set(0, 0, 0)
    this.scene.add(target)
    spotLight.target = target

    this.scene.add(spotLight)

    // 存储体积光信息
    this.volumetricLights.set(id, {
      light: spotLight,
      target,
      intensity: volumetricIntensity,
      enabled: true
    })

    console.log('体积光添加完成:', id)
    return spotLight
  }

  /**
   * 添加反射探针
   */
  addReflectionProbe(id, position, size = 10) {
    const probe = {
      id,
      position: position.clone(),
      size,
      renderTarget: null,
      cubeCamera: null,
      influence: new this.THREE.Sphere(position, size)
    }

    // 创建立方体相机用于捕获反射
    const cubeRenderTarget = new this.THREE.WebGLCubeRenderTarget(256, {
      format: this.THREE.RGBAFormat,
      generateMipmaps: true,
      minFilter: this.THREE.LinearMipmapLinearFilter
    })

    const cubeCamera = new this.THREE.CubeCamera(0.1, 1000, cubeRenderTarget)
    cubeCamera.position.copy(position)

    probe.renderTarget = cubeRenderTarget
    probe.cubeCamera = cubeCamera

    this.reflectionProbes.set(id, probe)

    console.log('反射探针添加完成:', id)
    return probe
  }

  /**
   * 更新反射探针
   */
  updateReflectionProbe(id) {
    const probe = this.reflectionProbes.get(id)
    if (!probe) return

    // 临时隐藏角色和道具，只捕获场景
    const hiddenObjects = []
    this.scene.traverse((child) => {
      if (child.isMesh && !child.userData.isScene) {
        if (child.visible) {
          hiddenObjects.push(child)
          child.visible = false
        }
      }
    })

    // 捕获环境
    probe.cubeCamera.update(this.renderer, this.scene)

    // 恢复可见性
    hiddenObjects.forEach(obj => {
      obj.visible = true
    })

    console.log('反射探针更新完成:', id)
  }

  /**
   * 设置曝光
   */
  setExposure(value) {
    this.settings.exposure = value
    this.renderer.toneMappingExposure = value
  }

  /**
   * 设置阴影质量
   */
  setShadowQuality(quality) {
    this.settings.shadowQuality = quality
    if (this.csm) {
      const qualitySettings = {
        low: { mapSize: 1024, cascades: 2 },
        medium: { mapSize: 2048, cascades: 3 },
        high: { mapSize: 2048, cascades: 4 },
        ultra: { mapSize: 4096, cascades: 4 }
      }

      const settings = qualitySettings[quality] || qualitySettings.high
      this.csm.shadowMap.setSize(settings.mapSize, settings.mapSize)
    }
  }

  /**
   * 更新CSM（每帧调用）
   */
  updateCSM() {
    if (this.csm) {
      this.csm.update()
    }
  }

  /**
   * 设置环境光强度
   */
  setAmbientIntensity(intensity) {
    this.settings.ambientIntensity = intensity
    this.scene.environmentIntensity = intensity
  }

  /**
   * 移除体积光
   */
  removeVolumetricLight(id) {
    const volumetric = this.volumetricLights.get(id)
    if (volumetric) {
      this.scene.remove(volumetric.light)
      this.scene.remove(volumetric.target)
      this.volumetricLights.delete(id)
    }
  }

  /**
   * 移除反射探针
   */
  removeReflectionProbe(id) {
    const probe = this.reflectionProbes.get(id)
    if (probe) {
      probe.renderTarget.dispose()
      this.reflectionProbes.delete(id)
    }
  }

  /**
   * 清理资源
   */
  dispose() {
    // 清理体积光
    this.volumetricLights.forEach((volumetric, id) => {
      this.removeVolumetricLight(id)
    })

    // 清理反射探针
    this.reflectionProbes.forEach((probe, id) => {
      this.removeReflectionProbe(id)
    })

    // 清理CSM
    if (this.csm) {
      this.csm.dispose()
    }

    // 清理环境贴图
    if (this.environmentMap) {
      this.environmentMap.dispose()
    }

    this.isInitialized = false
  }
}
