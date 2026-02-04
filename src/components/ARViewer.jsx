import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'
import { VRMAnimationLoaderPlugin, createVRMAnimationClip } from '@pixiv/three-vrm-animation'
import { getAllVRMAActions, loadVRMAAction } from '../data/vrmaActions'

// AR 场景管理器
class ARSceneManager {
  constructor() {
    this.session = null
    this.renderer = null
    this.scene = null
    this.camera = null
    this.referenceSpace = null
    this.hitTestSource = null
    this.planes = new Map()
    this.detectedPlanes = []
    this.currentCharacter = null
    this.isModelLoaded = false
    this.isPlaced = false
    this.hasAttemptedPlacement = false
    this.optimalPosition = null
    this.optimalScale = 1
    
    // 动画相关
    this.mixer = null
    this.currentAnimation = null
    this.vrmaActions = []
    
    // 回调
    this.onPlaneUpdate = null
    this.onModelLoaded = null
    this.onModelPlaced = null
    this.onPositionUpdate = null
  }

  // 检查支持
  async isSupported() {
    if (!('xr' in navigator)) return false
    try {
      return await navigator.xr.isSessionSupported('immersive-ar')
    } catch {
      return false
    }
  }

  // 启动AR会话
  async start(canvas) {
    try {
      // 请求AR会话 - 不使用dom-overlay以确保相机画面正常显示
      this.session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'local-floor'],
        optionalFeatures: ['plane-detection']
      })

      // 获取WebGL上下文
      const gl = canvas.getContext('webgl2', { 
        xrCompatible: true, alpha: true, antialias: true 
      }) || canvas.getContext('webgl', { 
        xrCompatible: true, alpha: true, antialias: true 
      })

      // 创建渲染器
      this.renderer = new THREE.WebGLRenderer({
        canvas, context: gl, alpha: true, antialias: true
      })
      this.renderer.setSize(window.innerWidth, window.innerHeight)
      this.renderer.setPixelRatio(window.devicePixelRatio)
      this.renderer.xr.enabled = true
      this.renderer.shadowMap.enabled = true
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
      this.renderer.outputColorSpace = THREE.SRGBColorSpace

      // 配置XR渲染层
      const baseLayer = new XRWebGLLayer(this.session, gl)
      await this.session.updateRenderState({ 
        baseLayer, depthNear: 0.1, depthFar: 1000 
      })

      // 创建场景
      this.scene = new THREE.Scene()
      this.scene.background = null // AR模式下背景为null，显示相机画面
      
      // 设置灯光
      this.setupLighting()
      
      // 创建地面可视化
      this.createGroundVisualization()
      
      // 创建相机
      this.camera = new THREE.PerspectiveCamera(
        75, window.innerWidth / window.innerHeight, 0.1, 1000
      )

      // 获取参考空间
      this.referenceSpace = await this.session.requestReferenceSpace('local-floor')
      
      // 设置Hit Test
      const viewerSpace = await this.session.requestReferenceSpace('viewer')
      this.hitTestSource = await this.session.requestHitTestSource({
        space: viewerSpace
      })

      // 监听平面检测
      this.setupPlaneDetection()

      // 开始渲染循环
      this.render()

      return true
    } catch (error) {
      console.error('启动AR失败:', error)
      throw error
    }
  }

  // 设置灯光
  setupLighting() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    // 主方向光
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(3, 8, 5)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 2048
    dirLight.shadow.mapSize.height = 2048
    dirLight.shadow.camera.near = 0.1
    dirLight.shadow.camera.far = 30
    dirLight.shadow.bias = -0.0005
    dirLight.shadow.radius = 4
    this.scene.add(dirLight)
    this.mainLight = dirLight

    // 补光
    const fillLight = new THREE.DirectionalLight(0xe6f3ff, 0.4)
    fillLight.position.set(-3, 4, -3)
    this.scene.add(fillLight)
  }

  // 创建地面可视化
  createGroundVisualization() {
    this.groundGroup = new THREE.Group()
    
    // 扫描圆环
    const scanRingGeo = new THREE.RingGeometry(0.1, 0.12, 64)
    const scanRingMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80, transparent: true, opacity: 0.8, side: THREE.DoubleSide
    })
    this.scanRing = new THREE.Mesh(scanRingGeo, scanRingMat)
    this.scanRing.rotation.x = -Math.PI / 2
    this.scanRing.visible = false
    this.groundGroup.add(this.scanRing)
    
    // 扫描线
    const scanLineGeo = new THREE.RingGeometry(0.05, 0.06, 64)
    const scanLineMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80, transparent: true, opacity: 0.5, side: THREE.DoubleSide
    })
    this.scanLine = new THREE.Mesh(scanLineGeo, scanLineMat)
    this.scanLine.rotation.x = -Math.PI / 2
    this.scanLine.visible = false
    this.groundGroup.add(this.scanLine)
    
    // 检测到的平面可视化
    this.planeVisualizers = new THREE.Group()
    this.groundGroup.add(this.planeVisualizers)
    
    this.scene.add(this.groundGroup)
  }

  // 设置平面检测
  setupPlaneDetection() {
    if (!this.session) return
    
    this.session.addEventListener('planesdetected', (event) => {
      const planes = event.data
      this.detectedPlanes = planes
      
      // 更新平面可视化
      this.updatePlaneVisualization()
      
      // 通知外部
      this.onPlaneUpdate?.(planes)
      
      // 如果没有放置模型，计算最佳位置
      if (!this.isPlaced && planes.length > 0) {
        this.calculateOptimalPlacement()
      }
    })
  }

  // 更新平面可视化
  updatePlaneVisualization() {
    // 清除旧的平面可视化
    while(this.planeVisualizers.children.length > 0) {
      this.planeVisualizers.remove(this.planeVisualizers.children[0])
    }
    
    // 添加新的平面可视化
    this.detectedPlanes.forEach((plane, index) => {
      const geometry = new THREE.PlaneGeometry(plane.extent.width, plane.extent.height)
      const material = new THREE.MeshBasicMaterial({
        color: 0x4ade80,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide
      })
      const mesh = new THREE.Mesh(geometry, material)
      
      // 设置位置和旋转
      const pose = plane.planeSpace
      if (pose) {
        mesh.position.set(
          pose.transform.position.x,
          pose.transform.position.y,
          pose.transform.position.z
        )
        mesh.quaternion.set(
          pose.transform.orientation.x,
          pose.transform.orientation.y,
          pose.transform.orientation.z,
          pose.transform.orientation.w
        )
      }
      
      // 边界线
      const edges = new THREE.EdgesGeometry(geometry)
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x4ade80, 
        transparent: true, 
        opacity: 0.5 
      })
      const wireframe = new THREE.LineSegments(edges, lineMaterial)
      mesh.add(wireframe)
      
      this.planeVisualizers.add(mesh)
    })
  }

  // 计算最佳放置位置
  calculateOptimalPlacement() {
    if (this.detectedPlanes.length === 0) return
    
    // 选择最大的平面
    let bestPlane = this.detectedPlanes[0]
    let maxArea = bestPlane.extent.width * bestPlane.extent.height
    
    this.detectedPlanes.forEach(plane => {
      const area = plane.extent.width * plane.extent.height
      if (area > maxArea) {
        maxArea = area
        bestPlane = plane
      }
    })
    
    // 计算最佳位置（平面中心）
    const pose = bestPlane.planeSpace
    if (pose) {
      this.optimalPosition = new THREE.Vector3(
        pose.transform.position.x,
        pose.transform.position.y,
        pose.transform.position.z
      )
      
      // 根据平面大小计算最佳缩放
      const minDimension = Math.min(bestPlane.extent.width, bestPlane.extent.height)
      this.optimalScale = Math.min(1.2, Math.max(0.6, minDimension / 2))
      
      // 通知外部
      this.onPositionUpdate?.({
        position: this.optimalPosition,
        scale: this.optimalScale,
        plane: bestPlane
      })
    }
  }

  // 加载VRM模型
  async loadVRMModel(url) {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader()
      loader.register((parser) => new VRMLoaderPlugin(parser))
      
      loader.load(
        url,
        (gltf) => {
          const vrm = gltf.userData.vrm
          this.currentCharacter = vrm
          this.isModelLoaded = true
          
          // 设置阴影
          vrm.scene.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true
              child.receiveShadow = true
            }
          })
          
          // 创建动画混合器
          this.mixer = new THREE.AnimationMixer(vrm.scene)
          
          // 默认隐藏
          vrm.scene.visible = false
          this.scene.add(vrm.scene)
          
          this.onModelLoaded?.(vrm)
          resolve(vrm)
        },
        (progress) => {
          console.log('加载进度:', (progress.loaded / progress.total * 100) + '%')
        },
        (error) => {
          console.error('加载失败:', error)
          reject(error)
        }
      )
    })
  }

  // 加载VRMA动作列表
  async loadVRMAActions() {
    try {
      this.vrmaActions = await getAllVRMAActions()
      console.log('VRMA动作加载完成:', this.vrmaActions.length)
      return this.vrmaActions
    } catch (error) {
      console.error('加载VRMA动作失败:', error)
      return []
    }
  }

  // 放置模型
  placeModel() {
    console.log('尝试放置模型:', {
      hasCharacter: !!this.currentCharacter,
      hasPosition: !!this.optimalPosition,
      isPlaced: this.isPlaced
    })
    
    if (!this.currentCharacter) {
      console.warn('无法放置模型: VRM角色未加载')
      return false
    }
    
    if (!this.optimalPosition) {
      console.warn('无法放置模型: 没有放置位置')
      return false
    }
    
    const model = this.currentCharacter.scene
    
    // 设置位置
    model.position.copy(this.optimalPosition)
    model.position.y += 0.02 // 避免穿模
    
    // 设置缩放
    model.scale.setScalar(this.optimalScale)
    
    // 面向相机
    if (this.camera) {
      const angle = Math.atan2(
        this.camera.position.x - model.position.x,
        this.camera.position.z - model.position.z
      )
      model.rotation.y = angle
    }
    
    // 显示模型
    model.visible = true
    this.isPlaced = true
    
    // 播放放置动画
    this.playPlacementAnimation()
    
    // 隐藏扫描可视化
    this.scanRing.visible = false
    this.scanLine.visible = false
    
    this.onModelPlaced?.({
      position: model.position,
      scale: this.optimalScale,
      rotation: model.rotation.y
    })
    
    return true
  }

  // 播放放置动画
  playPlacementAnimation() {
    if (!this.currentCharacter) return
    
    const model = this.currentCharacter.scene
    const targetY = model.position.y
    
    // 从上方落下
    model.position.y = targetY + 0.5
    
    // 简单的落下动画
    let progress = 0
    const animate = () => {
      progress += 0.05
      if (progress >= 1) {
        model.position.y = targetY
        return
      }
      
      // 缓动函数
      const easeOut = 1 - Math.pow(1 - progress, 3)
      model.position.y = targetY + 0.5 * (1 - easeOut)
      
      requestAnimationFrame(animate)
    }
    animate()
  }

  // 播放VRMA动作
  async playAction(actionId) {
    if (!this.currentCharacter || !this.mixer) return
    
    // 查找动作
    const action = this.vrmaActions.find(a => a.id === actionId)
    if (!action) {
      console.warn('未找到动作:', actionId)
      return
    }
    
    try {
      // 停止当前动画
      if (this.currentAnimation) {
        this.currentAnimation.fadeOut(0.3)
      }
      
      // 加载VRMA动画
      const { clip } = await loadVRMAAction(action.filePath, this.currentCharacter)
      
      if (clip) {
        // 创建动画动作
        const animationAction = this.mixer.clipAction(clip)
        animationAction.reset()
        animationAction.fadeIn(0.3)
        animationAction.play()
        
        this.currentAnimation = animationAction
        console.log('播放动作:', action.name)
      }
    } catch (error) {
      console.error('播放动作失败:', error)
    }
  }

  // 更新动画
  updateAnimation(deltaTime) {
    if (this.mixer) {
      this.mixer.update(deltaTime)
    }
  }

  // 更新模型位置（根据相机移动）
  updateModelPosition() {
    if (!this.isPlaced || !this.currentCharacter || !this.camera) return
    
    const model = this.currentCharacter.scene
    const cameraPos = this.camera.position
    const modelPos = model.position
    
    // 计算距离
    const distance = cameraPos.distanceTo(modelPos)
    
    // 如果距离变化太大，微调模型位置
    if (distance > 3) {
      // 距离太远，提示用户
    } else if (distance < 0.5) {
      // 距离太近，缩小模型
      const newScale = Math.max(0.4, this.optimalScale * (distance / 1.5))
      model.scale.setScalar(newScale)
    }
  }

  // 渲染循环
  render() {
    let lastTime = 0
    let hitTestCount = 0
    let frameCount = 0
    
    const loop = (time, frame) => {
      if (!this.session) return
      
      // 计算时间差
      const deltaTime = (time - lastTime) / 1000
      lastTime = time
      
      // 获取相机姿态
      const pose = frame.getViewerPose(this.referenceSpace)
      
      // 累积帧数来更新进度（即使没有Hit Test）
      frameCount++
      if (!this.isPlaced && frameCount % 30 === 0) {
        const progress = Math.min(100, frameCount / 3)
        this.onPlaneUpdate?.([{ type: 'hit', progress }])
        
        // 进度达到100%时放置模型（只执行一次）
        if (progress >= 100 && pose && !this.hasAttemptedPlacement) {
          this.hasAttemptedPlacement = true
          
          // 如果没有最优位置，使用默认位置
          if (!this.optimalPosition) {
            // 在相机前方1.5米处放置
            const cameraPos = pose.transform.position
            const cameraQuat = pose.transform.orientation
            
            // 计算前方位置（相机朝向的负Z方向）
            const forward = new THREE.Vector3(0, 0, -1.5)
            forward.applyQuaternion(new THREE.Quaternion(
              cameraQuat.x, cameraQuat.y, cameraQuat.z, cameraQuat.w
            ))
            
            this.optimalPosition = new THREE.Vector3(
              cameraPos.x + forward.x,
              cameraPos.y + forward.y - 0.5, // 稍微下方
              cameraPos.z + forward.z
            )
            this.optimalScale = 1.0
            this.onPositionUpdate?.({
              position: this.optimalPosition,
              scale: this.optimalScale
            })
          }
          
          // 立即放置模型
          console.log('进度100%，立即放置模型')
          const placed = this.placeModel()
          console.log('放置结果:', placed)
        }
      }
      
      if (pose) {
        // Hit Test
        let hitPose = null
        try {
          const hitResults = frame.getHitTestResults(this.hitTestSource)
          
          // 更新扫描可视化
          if (!this.isPlaced && hitResults.length > 0) {
            hitPose = hitResults[0].getPose(this.referenceSpace)
            if (hitPose) {
              this.scanRing.visible = true
              this.scanLine.visible = true
              
              this.scanRing.position.set(
                hitPose.transform.position.x,
                hitPose.transform.position.y,
                hitPose.transform.position.z
              )
              this.scanLine.position.copy(this.scanRing.position)
              
              // 动画
              this.scanRing.rotation.z = time * 0.002
              const pulse = 1 + Math.sin(time * 0.008) * 0.2
              this.scanLine.scale.set(pulse, pulse, pulse)
              
              // 累积Hit Test成功次数来更新进度
              hitTestCount++
              if (hitTestCount % 10 === 0) {
                const progress = Math.min(100, hitTestCount / 5)
                this.onPlaneUpdate?.([{ type: 'hit', progress }])
              }
              
              // 如果没有放置模型，使用Hit Test位置作为放置位置
              if (!this.isPlaced && !this.optimalPosition && hitTestCount > 30) {
                this.optimalPosition = new THREE.Vector3(
                  hitPose.transform.position.x,
                  hitPose.transform.position.y,
                  hitPose.transform.position.z
                )
                this.optimalScale = 1.0
                this.onPositionUpdate?.({
                  position: this.optimalPosition,
                  scale: this.optimalScale
                })
              }
            }
          }
        } catch (e) {
          // Hit Test可能失败，忽略错误
        }

        // 更新相机
        const view = pose.views[0]
        this.camera.matrix.fromArray(view.transform.matrix)
        this.camera.matrix.decompose(
          this.camera.position, 
          this.camera.quaternion, 
          this.camera.scale
        )
        
        // 更新模型位置
        this.updateModelPosition()

        // 更新动画
        this.updateAnimation(deltaTime)

        // 绑定帧缓冲 - 必须在渲染前绑定
        const glLayer = this.session.renderState.baseLayer
        const gl = this.renderer.getContext()
        gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer)
        
        // 设置视口
        const viewport = glLayer.getViewport(view)
        gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height)
        
        // 渲染场景 - 必须在绑定帧缓冲后
        this.renderer.render(this.scene, this.camera)
      }

      this.session.requestAnimationFrame(loop)
    }

    this.session.requestAnimationFrame(loop)
  }

  // 结束会话
  async end() {
    if (this.session) {
      await this.session.end()
      this.session = null
    }
    if (this.renderer) {
      this.renderer.dispose()
      this.renderer = null
    }
    this.detectedPlanes = []
    this.isPlaced = false
    this.isModelLoaded = false
    this.currentCharacter = null
    this.mixer = null
    this.currentAnimation = null
  }
}

// AR查看器组件
export const ARViewer = ({ 
  vrmUrl,
  onClose,
  onScreenshot,
  onRecord
}) => {
  const canvasRef = useRef(null)
  const arManagerRef = useRef(null)
  
  const [isStarting, setIsStarting] = useState(true)
  const [scanProgress, setScanProgress] = useState(0)
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [isPlaced, setIsPlaced] = useState(false)
  const [isScanning, setIsScanning] = useState(true)
  const [detectedPlanes, setDetectedPlanes] = useState([])
  const [showMenu, setShowMenu] = useState(false)
  const [currentAction, setCurrentAction] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [vrmaActions, setVrmaActions] = useState([])

  useEffect(() => {
    initAR()
    return () => {
      arManagerRef.current?.end()
    }
  }, [])

  const initAR = async () => {
    if (!canvasRef.current) return
    
    arManagerRef.current = new ARSceneManager()
    
    // 设置回调
    arManagerRef.current.onPlaneUpdate = (planes) => {
      setDetectedPlanes(planes)
      // 支持平面检测和Hit Test两种进度更新
      let progress = 0
      if (planes.length > 0 && planes[0].type === 'hit') {
        // Hit Test进度
        progress = Math.min(100, planes[0].progress)
        setScanProgress(progress)
        console.log('扫描进度:', progress)
      } else {
        // 平面检测进度
        progress = Math.min(100, planes.length * 20)
        setScanProgress(progress)
        console.log('平面检测进度:', progress, '平面数:', planes.length)
      }
      
      // 进度达到100%时自动放置（由渲染循环处理）
      // 这里只更新UI状态
      if (progress >= 100 && !isPlaced) {
        console.log('进度100%，准备放置模型')
      }
    }
    
    arManagerRef.current.onModelLoaded = () => {
      setIsModelLoaded(true)
    }
    
    arManagerRef.current.onModelPlaced = () => {
      setIsPlaced(true)
      setIsStarting(false)
      setIsScanning(false)
    }
    
    arManagerRef.current.onPositionUpdate = (data) => {
      // 可以在这里显示位置预览
    }
    
    try {
      // 启动AR
      await arManagerRef.current.start(canvasRef.current)
      
      // 加载VRMA动作列表
      const actions = await arManagerRef.current.loadVRMAActions()
      setVrmaActions(actions.slice(0, 12)) // 只取前12个动作显示
      
      // 加载VRM模型
      console.log('开始加载VRM模型, URL:', vrmUrl)
      if (vrmUrl) {
        try {
          await arManagerRef.current.loadVRMModel(vrmUrl)
          console.log('VRM模型加载成功')
        } catch (error) {
          console.error('VRM模型加载失败:', error)
        }
      } else {
        console.warn('没有提供VRM模型URL，尝试使用默认模型')
        // 尝试加载默认模型
        const defaultUrl = '/models/Katheryne.vrm'
        try {
          await arManagerRef.current.loadVRMModel(defaultUrl)
          console.log('默认VRM模型加载成功')
        } catch (error) {
          console.error('默认VRM模型加载失败:', error)
        }
      }
      
      // 等待平面检测完成后自动放置
      setTimeout(() => {
        if (arManagerRef.current.optimalPosition) {
          arManagerRef.current.placeModel()
        }
      }, 3000)
      
    } catch (error) {
      console.error('AR初始化失败:', error)
    }
  }

  const handleAction = async (actionId) => {
    setCurrentAction(actionId)
    await arManagerRef.current?.playAction(actionId)
  }

  const handleScreenshot = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png')
      onScreenshot?.(dataUrl)
    }
  }

  const handleRecord = () => {
    setIsRecording(!isRecording)
    onRecord?.(!isRecording)
  }

  const handleClose = async () => {
    await arManagerRef.current?.end()
    onClose?.()
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10000,
      background: 'black'
    }}>
      {/* AR画布 */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />

      {/* 顶部工具栏 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
        pointerEvents: 'none'
      }}>
        <button
          onClick={handleClose}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            pointerEvents: 'auto',
            backdropFilter: 'blur(10px)'
          }}
        >
          ✕
        </button>

        <div style={{ display: 'flex', gap: '12px', pointerEvents: 'auto' }}>
          <button
            onClick={handleScreenshot}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)'
            }}
          >
            📷
          </button>
          <button
            onClick={handleRecord}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: isRecording 
                ? 'rgba(239, 68, 68, 0.8)' 
                : 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)'
            }}
          >
            {isRecording ? '⏹️' : '📹'}
          </button>
        </div>
      </div>

      {/* 扫描进度 */}
      {isScanning && !isPlaced && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{
            width: '200px',
            height: '4px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '2px',
            overflow: 'hidden',
            marginBottom: '12px'
          }}>
            <div style={{
              width: `${scanProgress}%`,
              height: '100%',
              background: '#4ade80',
              borderRadius: '2px',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <p style={{ color: 'white', fontSize: '14px', margin: 0 }}>
            {scanProgress > 0 
              ? `扫描进度 ${Math.round(scanProgress)}%` 
              : '正在扫描地面...'}
          </p>
        </div>
      )}

      {/* 底部菜单 */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '20px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
        pointerEvents: 'none'
      }}>
        {/* 动作面板 */}
        {showMenu && vrmaActions.length > 0 && (
          <div style={{
            background: 'rgba(0,0,0,0.7)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '16px',
            backdropFilter: 'blur(10px)',
            pointerEvents: 'auto',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px'
            }}>
              {vrmaActions.map(action => (
                <button
                  key={action.id}
                  onClick={() => handleAction(action.id)}
                  style={{
                    padding: '10px 6px',
                    background: currentAction === action.id
                      ? 'rgba(74, 222, 128, 0.3)'
                      : 'rgba(255,255,255,0.1)',
                    border: `1px solid ${currentAction === action.id ? '#4ade80' : 'rgba(255,255,255,0.2)'}`,
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={action.name}
                >
                  <span style={{ fontSize: '20px' }}>{action.icon}</span>
                  <span style={{ 
                    maxWidth: '100%', 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>{action.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 主菜单按钮 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          pointerEvents: 'auto'
        }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              padding: '14px 28px',
              background: showMenu 
                ? 'rgba(74, 222, 128, 0.3)' 
                : 'rgba(255,255,255,0.2)',
              border: `1px solid ${showMenu ? '#4ade80' : 'rgba(255,255,255,0.3)'}`,
              borderRadius: '28px',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>🎭</span>
            <span>动作 ({vrmaActions.length})</span>
          </button>

          <button
            onClick={() => arManagerRef.current?.placeModel()}
            disabled={isPlaced}
            style={{
              padding: '14px 28px',
              background: isPlaced 
                ? 'rgba(74, 222, 128, 0.3)' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '28px',
              color: 'white',
              fontSize: '16px',
              cursor: isPlaced ? 'default' : 'pointer',
              opacity: isPlaced ? 0.6 : 1
            }}
          >
            <span>{isPlaced ? '✓ 已放置' : '🎯 放置'}</span>
          </button>
        </div>
      </div>

      {/* 录制指示器 */}
      {isRecording && (
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(239, 68, 68, 0.8)',
          padding: '8px 16px',
          borderRadius: '20px',
          pointerEvents: 'none'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            background: 'white',
            borderRadius: '50%',
            animation: 'pulse 1s infinite'
          }} />
          <span style={{ color: 'white', fontSize: '14px' }}>录制中</span>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

export default ARViewer
