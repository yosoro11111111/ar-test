import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'
import { loadVRMAAction, getAllCategories } from '../../data/vrmaActions'
import styles from './ARViewerNew.module.css'

// 内存优化的AR场景管理器类
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
    this.optimalPosition = null
    this.optimalScale = 1
    this.isTracking = false
    this.mixer = null
    this.currentAnimation = null
    this.isRendering = false
    this.frameCount = 0
    this.lastFrameTime = 0
    this.targetFPS = 30 // 降低FPS以减少GPU负载
    this.frameInterval = 1000 / this.targetFPS
    this.onPlaneUpdate = null
    this.onModelLoaded = null
    this.onModelPlaced = null
    this.onPositionUpdate = null
    this.placedPlane = null
    this.mediaRecorder = null
    // 缓存几何体和材质以减少内存分配
    this.sharedGeometry = null
    this.sharedMaterial = null
    this.cornerLines = null
  }

  async isSupported() {
    if (!('xr' in navigator)) return false
    try {
      return await navigator.xr.isSessionSupported('immersive-ar')
    } catch {
      return false
    }
  }

  async start(canvas, domOverlayRoot) {
    try {
      const sessionOptions = {
        requiredFeatures: ['hit-test', 'local-floor'],
        optionalFeatures: ['plane-detection']
      }
      
      if (domOverlayRoot) {
        sessionOptions.optionalFeatures.push('dom-overlay')
        sessionOptions.domOverlay = { root: domOverlayRoot }
      }
      
      this.session = await navigator.xr.requestSession('immersive-ar', sessionOptions)

      const gl = canvas.getContext('webgl2', { 
        xrCompatible: true, alpha: true, antialias: false, // 关闭抗锯齿减少GPU负载
        powerPreference: 'low-power' // 优先使用低功耗模式
      }) || canvas.getContext('webgl', { 
        xrCompatible: true, alpha: true, antialias: false,
        powerPreference: 'low-power'
      })

      this.renderer = new THREE.WebGLRenderer({
        canvas, context: gl, alpha: true, antialias: false
      })
      this.renderer.setSize(window.innerWidth, window.innerHeight)
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)) // 限制像素比
      this.renderer.xr.enabled = true
      this.renderer.shadowMap.enabled = false // 关闭阴影减少计算
      this.renderer.outputColorSpace = THREE.SRGBColorSpace

      const baseLayer = new XRWebGLLayer(this.session, gl)
      await this.session.updateRenderState({ 
        baseLayer, depthNear: 0.1, depthFar: 100 
      })

      this.scene = new THREE.Scene()
      this.scene.background = null
      
      this.setupLighting()
      this.createGroundVisualization()
      this.createCornerLines() // 添加墙角线条
      
      this.camera = new THREE.PerspectiveCamera(
        75, window.innerWidth / window.innerHeight, 0.1, 100
      )

      this.referenceSpace = await this.session.requestReferenceSpace('local-floor')
      
      const viewerSpace = await this.session.requestReferenceSpace('viewer')
      this.hitTestSource = await this.session.requestHitTestSource({
        space: viewerSpace
      })

      this.setupPlaneDetection()
      this.startRenderLoop()

      return true
    } catch (error) {
      console.error('启动AR失败:', error)
      throw error
    }
  }

  setupLighting() {
    // 简化光照，只使用环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    this.scene.add(ambientLight)
  }

  createGroundVisualization() {
    this.planeVisualizers = new THREE.Group()
    this.scene.add(this.planeVisualizers)

    // 使用共享几何体和材质
    this.sharedGeometry = new THREE.RingGeometry(0.1, 0.15, 16) // 减少分段数
    this.sharedMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x4ade80, 
      transparent: true, 
      opacity: 0.6,
      side: THREE.DoubleSide
    })
    
    this.scanRing = new THREE.Mesh(this.sharedGeometry, this.sharedMaterial)
    this.scanRing.rotation.x = -Math.PI / 2
    this.scanRing.visible = false
    this.scene.add(this.scanRing)
  }

  // 创建墙角线条
  createCornerLines() {
    this.cornerLines = new THREE.Group()
    
    // 创建简单的墙角线条（L形）
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x00ffff, 
      transparent: true, 
      opacity: 0.4,
      linewidth: 1
    })
    
    // 创建几个墙角标记
    for (let i = 0; i < 4; i++) {
      const points = []
      // L形线条
      points.push(new THREE.Vector3(0, 0, 0))
      points.push(new THREE.Vector3(0.3, 0, 0))
      points.push(new THREE.Vector3(0, 0, 0))
      points.push(new THREE.Vector3(0, 0.3, 0))
      points.push(new THREE.Vector3(0, 0, 0))
      points.push(new THREE.Vector3(0, 0, 0.3))
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      const line = new THREE.LineSegments(geometry, lineMaterial)
      line.visible = false
      line.userData = { id: i }
      this.cornerLines.add(line)
    }
    
    this.scene.add(this.cornerLines)
  }

  setupPlaneDetection() {
    this.session.addEventListener('planesdetected', (event) => {
      const planes = event.data
      this.detectedPlanes = Array.from(planes)
      this.updatePlaneVisualization()
      this.updateCornerLines() // 更新墙角线条位置
      
      if (!this.isPlaced && this.detectedPlanes.length > 0) {
        this.calculateOptimalPlacement()
      }
      
      this.onPlaneUpdate?.(this.detectedPlanes)
    })
  }

  updatePlaneVisualization() {
    // 清理旧的视觉化对象
    while(this.planeVisualizers.children.length > 0) {
      const child = this.planeVisualizers.children[0]
      if (child.geometry && child.geometry !== this.sharedGeometry) {
        child.geometry.dispose()
      }
      this.planeVisualizers.remove(child)
    }

    // 只显示前3个平面以减少渲染负担
    this.detectedPlanes.slice(0, 3).forEach((plane) => {
      const geometry = new THREE.PlaneGeometry(
        plane.extent?.width || 1, 
        plane.extent?.height || 1
      )
      const material = new THREE.MeshBasicMaterial({
        color: 0x4ade80,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide
      })
      const mesh = new THREE.Mesh(geometry, material)
      
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
      
      this.planeVisualizers.add(mesh)
    })
  }

  // 更新墙角线条位置
  updateCornerLines() {
    if (!this.detectedPlanes.length) return
    
    // 在检测到的平面边缘显示墙角线条
    this.detectedPlanes.slice(0, 4).forEach((plane, index) => {
      const line = this.cornerLines.children[index]
      if (!line) return
      
      const pose = plane.planeSpace
      if (pose) {
        line.visible = true
        line.position.set(
          pose.transform.position.x,
          pose.transform.position.y,
          pose.transform.position.z
        )
        
        // 根据平面大小调整线条
        const scale = Math.min(
          (plane.extent?.width || 1) * 0.5,
          (plane.extent?.height || 1) * 0.5
        )
        line.scale.setScalar(Math.max(0.5, Math.min(2, scale)))
      }
    })
  }

  calculateOptimalPlacement() {
    if (this.detectedPlanes.length === 0) return

    let bestPlane = this.detectedPlanes[0]
    let maxArea = (bestPlane.extent?.width || 1) * (bestPlane.extent?.height || 1)
    
    this.detectedPlanes.forEach(plane => {
      const area = (plane.extent?.width || 1) * (plane.extent?.height || 1)
      if (area > maxArea) {
        maxArea = area
        bestPlane = plane
      }
    })

    const pose = bestPlane.planeSpace
    if (pose) {
      this.optimalPosition = new THREE.Vector3(
        pose.transform.position.x,
        pose.transform.position.y,
        pose.transform.position.z
      )
      
      const minDimension = Math.min(
        bestPlane.extent?.width || 2, 
        bestPlane.extent?.height || 2
      )
      this.optimalScale = Math.min(1.2, Math.max(0.5, minDimension / 2))
      
      this.placedPlane = bestPlane
      
      this.onPositionUpdate?.({
        position: this.optimalPosition,
        scale: this.optimalScale
      })
    }
  }

  startRenderLoop() {
    if (this.isRendering) return
    this.isRendering = true

    const loop = (time, frame) => {
      if (!this.session) {
        this.isRendering = false
        return
      }

      // FPS限制
      if (time - this.lastFrameTime < this.frameInterval) {
        this.session.requestAnimationFrame(loop)
        return
      }
      this.lastFrameTime = time

      const deltaTime = time - (this.lastTime || time)
      this.lastTime = time
      this.frameCount++

      if (frame) {
        const pose = frame.getViewerPose(this.referenceSpace)
        
        // 每10帧更新一次扫描环
        if (!this.isPlaced && this.frameCount % 10 === 0) {
          try {
            const hitResults = frame.getHitTestResults(this.hitTestSource)
            if (hitResults.length > 0) {
              const hitPose = hitResults[0].getPose(this.referenceSpace)
              if (hitPose) {
                this.scanRing.visible = true
                this.scanRing.position.set(
                  hitPose.transform.position.x,
                  hitPose.transform.position.y,
                  hitPose.transform.position.z
                )
              }
            }
          } catch (e) {}
        }

        if (pose) {
          const view = pose.views[0]
          this.camera.matrix.fromArray(view.transform.matrix)
          this.camera.matrix.decompose(
            this.camera.position, 
            this.camera.quaternion, 
            this.camera.scale
          )

          this.updateTracking()
          this.updateAnimation(deltaTime)

          const glLayer = this.session.renderState.baseLayer
          const gl = this.renderer.getContext()
          gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer)
          
          const viewport = glLayer.getViewport(view)
          gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height)
          
          gl.clearColor(0, 0, 0, 0)
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
          
          this.renderer.render(this.scene, this.camera)
        }
      }

      this.session.requestAnimationFrame(loop)
    }

    this.session.requestAnimationFrame(loop)
  }

  updateTracking() {
    if (!this.isTracking || !this.currentCharacter || !this.camera) return
    
    const model = this.currentCharacter.scene
    
    if (this.detectedPlanes.length > 0) {
      let bestPlane = null
      let bestScore = -1
      
      this.detectedPlanes.forEach(plane => {
        const pose = plane.planeSpace
        if (!pose) return
        
        const planePos = new THREE.Vector3(
          pose.transform.position.x,
          pose.transform.position.y,
          pose.transform.position.z
        )
        
        const distance = planePos.distanceTo(this.camera.position)
        const area = (plane.extent?.width || 1) * (plane.extent?.height || 1)
        const distanceScore = 1 - Math.abs(distance - 2) / 2
        const score = area * distanceScore
        
        if (score > bestScore) {
          bestScore = score
          bestPlane = plane
        }
      })
      
      if (bestPlane) {
        this.placedPlane = bestPlane
        const pose = bestPlane.planeSpace
        
        const targetX = pose.transform.position.x
        const targetZ = pose.transform.position.z
        const targetY = pose.transform.position.y + 0.02
        
        model.position.x += (targetX - model.position.x) * 0.1
        model.position.z += (targetZ - model.position.z) * 0.1
        model.position.y += (targetY - model.position.y) * 0.1
        
        const minDimension = Math.min(
          bestPlane.extent?.width || 2, 
          bestPlane.extent?.height || 2
        )
        const targetScale = Math.min(1.2, Math.max(0.4, minDimension / 2))
        const currentScale = model.scale.x
        const newScale = currentScale + (targetScale - currentScale) * 0.05
        model.scale.setScalar(newScale)
      }
    }
    
    if (this.camera) {
      const cameraPosition = this.camera.position
      const angle = Math.atan2(
        cameraPosition.x - model.position.x,
        cameraPosition.z - model.position.z
      )
      const currentRotation = model.rotation.y
      let deltaRotation = angle - currentRotation
      
      while (deltaRotation > Math.PI) deltaRotation -= Math.PI * 2
      while (deltaRotation < -Math.PI) deltaRotation += Math.PI * 2
      
      model.rotation.y += deltaRotation * 0.08
    }
  }

  updateAnimation(deltaTime) {
    if (this.mixer) {
      this.mixer.update(deltaTime * 0.001)
    }
  }

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
          
          // 简化材质以减少GPU负担
          vrm.scene.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = false
              child.receiveShadow = false
            }
          })
          
          this.mixer = new THREE.AnimationMixer(vrm.scene)
          
          vrm.scene.visible = false
          vrm.scene.position.set(0, 0, -1.5)
          vrm.scene.scale.setScalar(1.0)
          this.scene.add(vrm.scene)
          
          this.onModelLoaded?.(vrm)
          resolve(vrm)
        },
        undefined,
        (error) => {
          console.error('加载失败:', error)
          reject(error)
        }
      )
    })
  }

  placeModel() {
    if (!this.currentCharacter || !this.optimalPosition) return false
    
    const model = this.currentCharacter.scene
    
    model.position.copy(this.optimalPosition)
    model.position.y += 0.02
    model.scale.setScalar(this.optimalScale)
    
    if (this.camera) {
      const angle = Math.atan2(
        this.camera.position.x - model.position.x,
        this.camera.position.z - model.position.z
      )
      model.rotation.y = angle
    }
    
    model.visible = true
    this.isPlaced = true
    this.scanRing.visible = false
    
    this.playPlacementAnimation()
    
    this.onModelPlaced?.({
      position: model.position,
      scale: this.optimalScale,
      rotation: model.rotation.y
    })
    
    return true
  }

  playPlacementAnimation() {
    if (!this.currentCharacter) return
    
    const model = this.currentCharacter.scene
    const targetY = model.position.y
    
    model.position.y = targetY + 0.5
    
    const animate = () => {
      if (!this.currentCharacter) return
      const dy = targetY - model.position.y
      if (Math.abs(dy) < 0.01) {
        model.position.y = targetY
        return
      }
      model.position.y += dy * 0.1
      requestAnimationFrame(animate)
    }
    animate()
  }

  toggleTracking() {
    this.isTracking = !this.isTracking
    return this.isTracking
  }

  async playAction(actionId, actionsList) {
    if (!this.mixer || !this.currentCharacter) {
      console.warn('无法播放动作: 动画系统未初始化')
      return
    }

    try {
      if (this.currentAnimation) {
        this.currentAnimation.fadeOut(0.3)
        this.currentAnimation = null
      }

      const action = actionsList.find(a => a.id === actionId)
      if (!action) {
        console.warn('未找到动作:', actionId)
        return
      }

      const result = await loadVRMAAction(action.filePath, this.currentCharacter)
      
      if (result && result.clip) {
        this.currentAnimation = this.mixer.clipAction(result.clip)
        this.currentAnimation.fadeIn(0.3)
        this.currentAnimation.play()
      }
    } catch (error) {
      console.error('播放动作失败:', error)
    }
  }

  async end() {
    // 清理所有资源
    if (this.session) {
      await this.session.end()
      this.session = null
    }
    
    if (this.renderer) {
      this.renderer.dispose()
      this.renderer = null
    }
    
    // 清理几何体和材质
    if (this.sharedGeometry) {
      this.sharedGeometry.dispose()
      this.sharedGeometry = null
    }
    if (this.sharedMaterial) {
      this.sharedMaterial.dispose()
      this.sharedMaterial = null
    }
    
    this.detectedPlanes = []
    this.isPlaced = false
    this.isModelLoaded = false
    this.currentCharacter = null
    this.mixer = null
    this.currentAnimation = null
    this.isRendering = false
    this.placedPlane = null
    this.mediaRecorder = null
  }
}

// AR查看器组件
export const ARViewerNew = ({ 
  vrmUrl,
  onClose,
  onScreenshot,
  onRecord
}) => {
  const canvasRef = useRef(null)
  const domOverlayRef = useRef(null)
  const arManagerRef = useRef(null)
  
  const [isStarting, setIsStarting] = useState(true)
  const [scanProgress, setScanProgress] = useState(0)
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [isPlaced, setIsPlaced] = useState(false)
  const [isScanning, setIsScanning] = useState(true)
  const [detectedPlanes, setDetectedPlanes] = useState([])
  const [showMenu, setShowMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [currentAction, setCurrentAction] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isTracking, setIsTracking] = useState(false)
  const [vrmaActions, setVrmaActions] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [searchQuery, setSearchQuery] = useState('')
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ar-favorites') || '[]')
    } catch {
      return []
    }
  })
  const [recentActions, setRecentActions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ar-recent') || '[]')
    } catch {
      return []
    }
  })
  const [modelScale, setModelScale] = useState(1.0)

  useEffect(() => {
    let isMounted = true
    
    const startAR = async () => {
      if (!isMounted) return
      await initAR()
    }
    
    startAR()
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (arManagerRef.current?.session && !arManagerRef.current.isRendering) {
          arManagerRef.current.startRenderLoop()
        }
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      isMounted = false
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      arManagerRef.current?.end()
    }
  }, [])

  const initAR = async () => {
    if (!canvasRef.current) return
    
    arManagerRef.current = new ARSceneManager()
    
    arManagerRef.current.onPlaneUpdate = (planes) => {
      setDetectedPlanes(planes)
      const progress = Math.min(100, planes.length * 20)
      setScanProgress(progress)
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
      setModelScale(data.scale)
    }
    
    try {
      await arManagerRef.current.start(canvasRef.current, domOverlayRef.current)
      
      // 延迟加载动作以减少初始内存使用
      setTimeout(async () => {
        try {
          const { getAllVRMAActions } = await import('../../data/vrmaActions')
          const actions = await getAllVRMAActions()
          setVrmaActions(actions)
        } catch (e) {
          console.error('加载动作失败:', e)
        }
      }, 3000)
      
      const cats = getAllCategories()
      setCategories(['全部', ...cats])
      
      const url = vrmUrl || `${window.location.origin}/models/Katheryne.vrm`
      await arManagerRef.current.loadVRMModel(url)
      
      setTimeout(() => {
        if (arManagerRef.current.optimalPosition) {
          arManagerRef.current.placeModel()
        } else {
          arManagerRef.current.optimalPosition = new THREE.Vector3(0, 0, -1.5)
          arManagerRef.current.optimalScale = 1.0
          arManagerRef.current.placeModel()
        }
      }, 2000)
      
    } catch (error) {
      console.error('AR初始化失败:', error)
    }
  }

  const handleAction = async (action) => {
    setCurrentAction(action.id)
    await arManagerRef.current?.playAction(action.id, vrmaActions)
    
    const newRecent = [action, ...recentActions.filter(a => a.id !== action.id)].slice(0, 10)
    setRecentActions(newRecent)
    localStorage.setItem('ar-recent', JSON.stringify(newRecent))
  }

  const toggleFavorite = (action) => {
    const isFav = favorites.includes(action.id)
    const newFavorites = isFav 
      ? favorites.filter(id => id !== action.id)
      : [...favorites, action.id]
    setFavorites(newFavorites)
    localStorage.setItem('ar-favorites', JSON.stringify(newFavorites))
  }

  const handleToggleTracking = () => {
    const newState = arManagerRef.current?.toggleTracking()
    setIsTracking(newState)
  }

  const filteredActions = useMemo(() => {
    let actions = vrmaActions
    
    if (selectedCategory !== '全部') {
      actions = actions.filter(a => a.category === selectedCategory)
    }
    
    if (searchQuery) {
      actions = actions.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    return actions
  }, [vrmaActions, selectedCategory, searchQuery])

  return (
    <div ref={domOverlayRef} className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
      
      {/* 顶部工具栏 */}
      <div className={styles.header}>
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>
        
        <div className={styles.headerActions}>
          <button 
            className={styles.toolButton} 
            onClick={() => {
              if (canvasRef.current) {
                try {
                  const dataUrl = canvasRef.current.toDataURL('image/png')
                  const link = document.createElement('a')
                  link.download = `ar-screenshot-${Date.now()}.png`
                  link.href = dataUrl
                  link.click()
                } catch (err) {
                  console.error('截图失败:', err)
                }
              }
              onScreenshot?.()
            }}
          >
            📷
          </button>
          <button 
            className={`${styles.toolButton} ${isRecording ? styles.recording : ''}`}
            onClick={() => {
              const newRecordingState = !isRecording
              setIsRecording(newRecordingState)
              
              if (newRecordingState) {
                if (canvasRef.current && canvasRef.current.captureStream) {
                  const stream = canvasRef.current.captureStream(30)
                  const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: 'video/webm;codecs=vp9'
                  })
                  const chunks = []
                  
                  mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) chunks.push(e.data)
                  }
                  
                  mediaRecorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'video/webm' })
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.download = `ar-recording-${Date.now()}.webm`
                    link.href = url
                    link.click()
                  }
                  
                  mediaRecorder.start()
                  arManagerRef.current.mediaRecorder = mediaRecorder
                }
              } else {
                if (arManagerRef.current?.mediaRecorder) {
                  arManagerRef.current.mediaRecorder.stop()
                }
              }
              
              onRecord?.(newRecordingState)
            }}
          >
            {isRecording ? '⏹️' : '📹'}
          </button>
        </div>
      </div>

      {/* 扫描进度 */}
      {isScanning && !isPlaced && (
        <div className={styles.scanIndicator}>
          <div className={styles.scanAnimation}>
            <div className={styles.scanRing}></div>
            <div className={styles.scanRing}></div>
            <div className={styles.scanRing}></div>
            <div className={styles.scanIcon}>📱</div>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${scanProgress}%` }}
            />
          </div>
          <p className={styles.scanText}>
            {scanProgress > 0 ? `扫描进度 ${Math.round(scanProgress)}%` : '正在扫描地面...'}
          </p>
          <p className={styles.scanHint}>移动设备以扫描地面</p>
        </div>
      )}

      {/* 底部菜单 */}
      <div className={styles.bottomMenu}>
        {showMenu && (
          <div className={styles.actionPanel}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="搜索动作..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  className={styles.clearSearch}
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </button>
              )}
            </div>

            <div className={styles.categoryList}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`${styles.categoryTag} ${selectedCategory === cat ? styles.active : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <div className={styles.actionCarousel}>
              {filteredActions.slice(0, 20).map(action => (
                <button
                  key={action.id}
                  className={`${styles.actionCard} ${currentAction === action.id ? styles.active : ''}`}
                  onClick={() => handleAction(action)}
                >
                  <span className={styles.actionIcon}>{action.icon}</span>
                  <span className={styles.actionName}>{action.name}</span>
                  <button 
                    className={`${styles.favoriteBtn} ${favorites.includes(action.id) ? styles.favorited : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(action)
                    }}
                  >
                    {favorites.includes(action.id) ? '★' : '☆'}
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.mainButtons}>
          <button
            className={`${styles.mainButton} ${showMenu ? styles.active : ''}`}
            onClick={() => setShowMenu(!showMenu)}
          >
            <span>🎭</span>
            <span>动作</span>
          </button>

          <button
            className={`${styles.mainButton} ${isTracking ? styles.active : ''}`}
            onClick={handleToggleTracking}
            title="让模型保持在平面上并面向你"
          >
            <span>🎯</span>
            <span>跟随</span>
          </button>

          <button
            className={`${styles.mainButton} ${showSettings ? styles.active : ''}`}
            onClick={() => setShowSettings(!showSettings)}
          >
            <span>⚙️</span>
            <span>设置</span>
          </button>

          <button
            className={`${styles.mainButton} ${isPlaced ? styles.placed : ''}`}
            onClick={() => arManagerRef.current?.placeModel()}
            disabled={isPlaced}
          >
            <span>{isPlaced ? '✓' : '📍'}</span>
            <span>{isPlaced ? '已放置' : '放置'}</span>
          </button>
        </div>
      </div>

      {/* 录制指示器 */}
      {isRecording && (
        <div className={styles.recordingIndicator}>
          <div className={styles.recordingDot} />
          <span>录制中</span>
        </div>
      )}

      {/* 设置面板 */}
      {showSettings && (
        <div className={styles.settingsOverlay} onClick={() => setShowSettings(false)}>
          <div className={styles.settingsPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.settingsHeader}>
              <h3 className={styles.settingsTitle}>AR设置</h3>
              <button className={styles.closeSettings} onClick={() => setShowSettings(false)}>
                ✕
              </button>
            </div>
            
            <div className={styles.settingsSection}>
              <h4 className={styles.settingsSectionTitle}>模型</h4>
              <div className={styles.settingItem}>
                <span className={styles.settingLabel}>模型缩放</span>
                <div className={styles.settingControl}>
                  <input
                    type="range"
                    className={styles.slider}
                    min="0.3"
                    max="2"
                    step="0.1"
                    value={modelScale}
                    onChange={(e) => {
                      const scale = parseFloat(e.target.value)
                      setModelScale(scale)
                      if (arManagerRef.current?.currentCharacter) {
                        arManagerRef.current.currentCharacter.scene.scale.setScalar(scale)
                      }
                    }}
                  />
                  <span className={styles.settingValue}>{modelScale.toFixed(1)}x</span>
                </div>
              </div>
            </div>

            <div className={styles.settingsSection}>
              <h4 className={styles.settingsSectionTitle}>跟踪</h4>
              <div className={styles.settingItem}>
                <span className={styles.settingLabel}>自动跟随</span>
                <button
                  className={`${styles.toggle} ${isTracking ? styles.active : ''}`}
                  onClick={handleToggleTracking}
                >
                  <div className={styles.toggleKnob}></div>
                </button>
              </div>
            </div>

            <div className={styles.settingsSection}>
              <h4 className={styles.settingsSectionTitle}>信息</h4>
              <div className={styles.settingItem}>
                <span className={styles.settingLabel}>检测到的平面</span>
                <span className={styles.settingValue}>{detectedPlanes.length}</span>
              </div>
              <div className={styles.settingItem}>
                <span className={styles.settingLabel}>模型已放置</span>
                <span className={styles.settingValue}>{isPlaced ? '是' : '否'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ARViewerNew
