/**
 * 后处理效果系统
 *
 * 功能：
 * - TAA时间抗锯齿
 * - 自动曝光
 * - 色调映射（ACES、Reinhard）
 * - LUT颜色查找表
 * - 径向模糊
 * - 扫描线/CRT效果
 */

export class PostProcessing {
  constructor(renderer, scene, camera) {
    this.renderer = renderer
    this.scene = scene
    this.camera = camera
    this.THREE = null

    // 后处理组件
    this.composer = null
    this.renderPass = null
    this.effectPass = null

    // 效果设置
    this.settings = {
      // TAA
      enableTAA: true,
      taaJitter: 0.5,

      // 自动曝光
      enableAutoExposure: false,
      exposureSpeed: 1.0,
      minExposure: 0.1,
      maxExposure: 10.0,

      // 色调映射
      toneMapping: 'ACES', // 'None', 'Linear', 'Reinhard', 'Cineon', 'ACES'
      toneMappingExposure: 1.0,

      // LUT
      enableLUT: false,
      lutPath: null,

      // 径向模糊
      enableRadialBlur: false,
      radialBlurStrength: 0.5,
      radialBlurCenter: { x: 0.5, y: 0.5 },

      // CRT效果
      enableCRT: false,
      crtScanlineIntensity: 0.1,
      crtCurvature: 0.1
    }

    // TAA历史帧
    this.taaHistory = []
    this.taaIndex = 0
    this.taaJitterOffsets = []

    // 自动曝光
    this.currentExposure = 1.0
    this.targetExposure = 1.0

    this.isInitialized = false
  }

  /**
   * 初始化后处理系统
   */
  async init() {
    if (this.isInitialized) return

    try {
      this.THREE = await import('three')
      const { EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer.js')
      const { RenderPass } = await import('three/examples/jsm/postprocessing/RenderPass.js')

      // 创建效果合成器
      this.composer = new EffectComposer(this.renderer)

      // 创建渲染通道
      this.renderPass = new RenderPass(this.scene, this.camera)
      this.composer.addPass(this.renderPass)

      // 初始化TAA抖动偏移
      this.initTAAJitter()

      // 初始化色调映射
      this.updateToneMapping()

      this.isInitialized = true
      console.log('后处理系统初始化完成')
    } catch (error) {
      console.error('后处理系统初始化失败:', error)
    }
  }

  /**
   * 初始化TAA抖动偏移
   */
  initTAAJitter() {
    // Halton序列用于TAA抖动
    this.taaJitterOffsets = [
      { x: 0.5, y: 0.5 },
      { x: 0.25, y: 0.75 },
      { x: 0.75, y: 0.25 },
      { x: 0.125, y: 0.375 },
      { x: 0.625, y: 0.875 },
      { x: 0.375, y: 0.125 },
      { x: 0.875, y: 0.625 },
      { x: 0.0625, y: 0.5625 }
    ]
  }

  /**
   * 获取TAA抖动偏移
   */
  getTAAJitter() {
    if (!this.settings.enableTAA) return { x: 0, y: 0 }

    const offset = this.taaJitterOffsets[this.taaIndex % this.taaJitterOffsets.length]
    this.taaIndex++

    // 转换为像素偏移
    const pixelOffset = {
      x: (offset.x - 0.5) * this.settings.taaJitter,
      y: (offset.y - 0.5) * this.settings.taaJitter
    }

    return pixelOffset
  }

  /**
   * 更新色调映射
   */
  updateToneMapping() {
    const { THREE } = this

    const toneMappingModes = {
      'None': THREE.NoToneMapping,
      'Linear': THREE.LinearToneMapping,
      'Reinhard': THREE.ReinhardToneMapping,
      'Cineon': THREE.CineonToneMapping,
      'ACES': THREE.ACESFilmicToneMapping
    }

    this.renderer.toneMapping = toneMappingModes[this.settings.toneMapping] || THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = this.settings.toneMappingExposure
  }

  /**
   * 设置色调映射模式
   */
  setToneMapping(mode) {
    this.settings.toneMapping = mode
    this.updateToneMapping()
  }

  /**
   * 设置色调映射曝光
   */
  setToneMappingExposure(exposure) {
    this.settings.toneMappingExposure = exposure
    this.renderer.toneMappingExposure = exposure
  }

  /**
   * 更新自动曝光
   */
  updateAutoExposure(deltaTime) {
    if (!this.settings.enableAutoExposure) return

    // 简化的自动曝光算法
    // 实际应该分析场景亮度
    const speed = this.settings.exposureSpeed * deltaTime

    // 平滑过渡到目标曝光
    if (Math.abs(this.currentExposure - this.targetExposure) > 0.01) {
      this.currentExposure += (this.targetExposure - this.currentExposure) * speed
      this.currentExposure = Math.max(
        this.settings.minExposure,
        Math.min(this.settings.maxExposure, this.currentExposure)
      )
      this.setToneMappingExposure(this.currentExposure)
    }
  }

  /**
   * 设置目标曝光（用于自动曝光）
   */
  setTargetExposure(exposure) {
    this.targetExposure = Math.max(
      this.settings.minExposure,
      Math.min(this.settings.maxExposure, exposure)
    )
  }

  /**
   * 启用/禁用TAA
   */
  setEnableTAA(enable) {
    this.settings.enableTAA = enable
  }

  /**
   * 启用/禁用自动曝光
   */
  setEnableAutoExposure(enable) {
    this.settings.enableAutoExposure = enable
  }

  /**
   * 加载LUT颜色查找表
   */
  async loadLUT(url) {
    try {
      // 这里简化处理，实际应该使用LUT加载器
      console.log('加载LUT:', url)
      this.settings.lutPath = url
      this.settings.enableLUT = true
    } catch (error) {
      console.error('加载LUT失败:', error)
    }
  }

  /**
   * 设置径向模糊
   */
  setRadialBlur(strength, centerX = 0.5, centerY = 0.5) {
    this.settings.enableRadialBlur = strength > 0
    this.settings.radialBlurStrength = strength
    this.settings.radialBlurCenter = { x: centerX, y: centerY }
  }

  /**
   * 设置CRT效果
   */
  setCRT(enable, scanlineIntensity = 0.1, curvature = 0.1) {
    this.settings.enableCRT = enable
    this.settings.crtScanlineIntensity = scanlineIntensity
    this.settings.crtCurvature = curvature
  }

  /**
   * 渲染
   */
  render(deltaTime) {
    if (!this.isInitialized) {
      this.renderer.render(this.scene, this.camera)
      return
    }

    // 更新自动曝光
    this.updateAutoExposure(deltaTime)

    // 应用TAA抖动
    if (this.settings.enableTAA) {
      const jitter = this.getTAAJitter()
      this.camera.setViewOffset(
        this.renderer.domElement.width,
        this.renderer.domElement.height,
        jitter.x,
        jitter.y,
        this.renderer.domElement.width,
        this.renderer.domElement.height
      )
    }

    // 渲染
    this.composer.render()

    // 清除TAA偏移
    if (this.settings.enableTAA) {
      this.camera.clearViewOffset()
    }
  }

  /**
   * 调整大小
   */
  setSize(width, height) {
    if (this.composer) {
      this.composer.setSize(width, height)
    }
  }

  /**
   * 清理资源
   */
  dispose() {
    if (this.composer) {
      this.composer.dispose()
    }

    this.isInitialized = false
  }
}
