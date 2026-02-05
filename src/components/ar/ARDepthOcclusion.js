import * as THREE from 'three'

/**
 * AR深度遮挡系统 - 使用WebXR Depth Sensing API
 * 实现虚拟物体被真实物体遮挡的效果
 */
export class ARDepthOcclusion {
  constructor() {
    this.session = null
    this.renderer = null
    this.isInitialized = false
    this.isRunning = false
    
    // 深度数据
    this.depthData = null
    this.depthWidth = 0
    this.depthHeight = 0
    this.rawValueToMeters = 0.001
    
    // 深度纹理
    this.depthTexture = null
    this.depthMaterial = null
    
    // 遮挡材质
    this.occlusionMaterial = null
    
    // 深度网格（用于CPU端深度检测）
    this.depthMesh = null
    
    // 性能优化
    this.updateInterval = 2 // 每2帧更新一次
    this.frameCount = 0
  }

  async initialize(session, renderer) {
    this.session = session
    this.renderer = renderer
    
    if (!this.session) {
      console.warn('ARDepthOcclusion: 没有可用的XR会话')
      return false
    }
    
    // 检查是否支持depth-sensing
    let supported = false
    try {
      if (typeof this.session.isFeatureEnabled === 'function') {
        supported = await this.session.isFeatureEnabled('depth-sensing')
      }
    } catch (e) {
      // 方法不存在
    }
    
    if (!supported && this.session.enabledFeatures) {
      supported = this.session.enabledFeatures.includes('depth-sensing')
    }
    
    if (!supported) {
      console.warn('ARDepthOcclusion: 设备不支持深度感知')
      return false
    }
    
    // 初始化深度材质
    this.initDepthMaterial()
    
    this.isInitialized = true
    console.log('🔍 AR深度遮挡系统已初始化')
    return true
  }

  initDepthMaterial() {
    // 创建深度遮挡材质
    // 使用深度纹理进行深度测试
    this.occlusionMaterial = new THREE.ShaderMaterial({
      uniforms: {
        depthTexture: { value: null },
        cameraNear: { value: 0.1 },
        cameraFar: { value: 100.0 },
        resolution: { value: new THREE.Vector2(1, 1) },
        viewMatrixInverse: { value: new THREE.Matrix4() },
        projectionMatrixInverse: { value: new THREE.Matrix4() }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec4 vProjected;
        
        void main() {
          vUv = uv;
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          vProjected = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_Position = vProjected;
        }
      `,
      fragmentShader: `
        uniform sampler2D depthTexture;
        uniform float cameraNear;
        uniform float cameraFar;
        uniform vec2 resolution;
        uniform mat4 viewMatrixInverse;
        uniform mat4 projectionMatrixInverse;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec4 vProjected;
        
        // 将深度值转换为线性深度
        float readDepth(sampler2D depthSampler, vec2 coord) {
          float depth = texture2D(depthSampler, coord).r;
          return depth;
        }
        
        void main() {
          // 计算NDC坐标
          vec2 ndc = vProjected.xy / vProjected.w * 0.5 + 0.5;
          
          // 读取深度纹理
          float sceneDepth = readDepth(depthTexture, ndc);
          
          // 计算当前片段的深度
          float currentDepth = gl_FragCoord.z;
          
          // 如果场景深度小于当前深度（真实物体更近），则丢弃片段
          if (sceneDepth < currentDepth - 0.001) {
            discard;
          }
          
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
      `,
      transparent: true,
      depthWrite: true,
      depthTest: true
    })
  }

  start() {
    if (!this.isInitialized) {
      console.warn('ARDepthOcclusion: 请先初始化')
      return false
    }
    
    this.isRunning = true
    console.log('🔍 深度遮挡已启动')
    return true
  }

  stop() {
    this.isRunning = false
    
    // 清理资源
    if (this.depthTexture) {
      this.depthTexture.dispose()
      this.depthTexture = null
    }
    
    console.log('🔍 深度遮挡已停止')
  }

  update(frame) {
    if (!this.isRunning || !frame) return
    
    this.frameCount++
    if (this.frameCount % this.updateInterval !== 0) return
    
    // 获取深度信息
    const depthInfo = frame.getDepthInformation(this.session.renderState.baseLayer)
    
    if (!depthInfo) return
    
    // 更新深度数据
    this.depthData = depthInfo.data
    this.depthWidth = depthInfo.width
    this.depthHeight = depthInfo.height
    this.rawValueToMeters = depthInfo.rawValueToMeters
    
    // 更新深度纹理
    this.updateDepthTexture()
  }

  updateDepthTexture() {
    if (!this.depthData) return
    
    // 创建或更新深度纹理
    if (!this.depthTexture) {
      this.depthTexture = new THREE.DataTexture(
        this.depthData,
        this.depthWidth,
        this.depthHeight,
        THREE.LuminanceFormat,
        THREE.UnsignedShortType
      )
      this.depthTexture.minFilter = THREE.NearestFilter
      this.depthTexture.magFilter = THREE.NearestFilter
      this.depthTexture.wrapS = THREE.ClampToEdgeWrapping
      this.depthTexture.wrapT = THREE.ClampToEdgeWrapping
      this.depthTexture.needsUpdate = true
    } else {
      this.depthTexture.image.data = this.depthData
      this.depthTexture.needsUpdate = true
    }
  }

  // 获取指定屏幕坐标处的深度值（米）
  getDepthAtScreen(x, y) {
    if (!this.depthData || !this.depthWidth || !this.depthHeight) return null
    
    // 转换为深度图坐标
    const depthX = Math.floor(x * this.depthWidth)
    const depthY = Math.floor(y * this.depthHeight)
    
    if (depthX < 0 || depthX >= this.depthWidth || 
        depthY < 0 || depthY >= this.depthHeight) {
      return null
    }
    
    const index = depthY * this.depthWidth + depthX
    const rawValue = this.depthData[index]
    
    return rawValue * this.rawValueToMeters
  }

  // 获取世界坐标处的深度值
  getDepthAtWorld(position) {
    if (!this.camera) return null
    
    // 将世界坐标投影到屏幕坐标
    const projected = position.clone().project(this.camera)
    
    // 转换为0-1范围
    const x = (projected.x + 1) / 2
    const y = (projected.y + 1) / 2
    
    return this.getDepthAtScreen(x, y)
  }

  // 检查虚拟物体是否被真实物体遮挡
  isOccluded(objectPosition, objectRadius = 0.1) {
    if (!this.camera) return false
    
    // 将物体位置投影到屏幕
    const projected = objectPosition.clone().project(this.camera)
    const x = (projected.x + 1) / 2
    const y = (projected.y + 1) / 2
    
    // 检查中心点和周围几个点的深度
    const checkPoints = [
      { x, y },
      { x: x - 0.02, y },
      { x: x + 0.02, y },
      { x, y: y - 0.02 },
      { x, y: y + 0.02 }
    ]
    
    for (const point of checkPoints) {
      const sceneDepth = this.getDepthAtScreen(point.x, point.y)
      if (sceneDepth !== null && sceneDepth < projected.z - objectRadius) {
        return true
      }
    }
    
    return false
  }

  // 创建深度遮挡网格（用于复杂物体）
  createOcclusionMesh(geometry) {
    if (!this.occlusionMaterial) return null
    
    const mesh = new THREE.Mesh(geometry, this.occlusionMaterial.clone())
    mesh.renderOrder = -1 // 确保先渲染
    return mesh
  }

  // 应用深度遮挡到物体
  applyOcclusion(object) {
    if (!this.occlusionMaterial || !this.depthTexture) return
    
    // 更新材质uniforms
    this.occlusionMaterial.uniforms.depthTexture.value = this.depthTexture
    this.occlusionMaterial.uniforms.resolution.value.set(
      this.depthWidth,
      this.depthHeight
    )
    
    if (this.camera) {
      this.occlusionMaterial.uniforms.viewMatrixInverse.value.copy(
        this.camera.matrixWorld
      )
      this.occlusionMaterial.uniforms.projectionMatrixInverse.value.copy(
        this.camera.projectionMatrixInverse
      )
    }
  }

  // CPU端深度检测（用于简单场景）
  checkDepthCPU(worldPosition) {
    if (!this.camera || !this.depthData) return false
    
    // 投影到屏幕空间
    const projected = worldPosition.clone().project(this.camera)
    const screenX = Math.floor((projected.x * 0.5 + 0.5) * this.depthWidth)
    const screenY = Math.floor((-projected.y * 0.5 + 0.5) * this.depthHeight)
    
    if (screenX < 0 || screenX >= this.depthWidth ||
        screenY < 0 || screenY >= this.depthHeight) {
      return false
    }
    
    // 读取深度值
    const index = screenY * this.depthWidth + screenX
    const depthValue = this.depthData[index] * this.rawValueToMeters
    
    // 将NDC深度转换为线性深度
    const linearDepth = this.camera.near * this.camera.far / 
      (this.camera.far - projected.z * (this.camera.far - this.camera.near))
    
    // 如果场景深度小于物体深度，则被遮挡
    return depthValue < linearDepth
  }

  // 设置相机引用
  setCamera(camera) {
    this.camera = camera
  }

  // 获取深度可视化（用于调试）
  getDepthVisualization() {
    if (!this.depthData) return null
    
    // 创建canvas显示深度图
    const canvas = document.createElement('canvas')
    canvas.width = this.depthWidth
    canvas.height = this.depthHeight
    const ctx = canvas.getContext('2d')
    const imageData = ctx.createImageData(this.depthWidth, this.depthHeight)
    
    for (let i = 0; i < this.depthData.length; i++) {
      const depth = this.depthData[i] * this.rawValueToMeters
      const intensity = Math.min(255, Math.max(0, depth * 50))
      
      imageData.data[i * 4] = intensity
      imageData.data[i * 4 + 1] = intensity
      imageData.data[i * 4 + 2] = intensity
      imageData.data[i * 4 + 3] = 255
    }
    
    ctx.putImageData(imageData, 0, 0)
    return canvas
  }

  destroy() {
    this.stop()
    
    if (this.occlusionMaterial) {
      this.occlusionMaterial.dispose()
      this.occlusionMaterial = null
    }
    
    this.isInitialized = false
    this.session = null
    this.renderer = null
  }
}

export default ARDepthOcclusion
