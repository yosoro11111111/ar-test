import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'
import { VRMAnimationLoaderPlugin, createVRMAnimationClip } from '@pixiv/three-vrm-animation'
import { getAllVRMAActions, loadVRMAAction, getAllCategories } from '../../data/vrmaActions'
import styles from './ARViewerNew.module.css'

// AR 场景管理器类
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
    this.isTracking = false
    this.trackingOffset = new THREE.Vector3(0, 0, -1.5)
    this.mixer = null
    this.currentAnimation = null
    this.vrmaActions = []
    this.isRendering = false
    this.frameCount = 0
    this.lastFrameTime = 0
    this.targetFPS = 60
    this.frameInterval = 1000 / this.targetFPS
    this.onPlaneUpdate = null
    this.onModelLoaded = null
    this.onModelPlaced = null
    this.onPositionUpdate = null
    this.gestureState = {
      isPinching: false,
      isDragging: false,
      lastDistance: 0,
      lastPosition: null
    }
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
        xrCompatible: true, alpha: true, antialias: true 
      }) || canvas.getContext('webgl', { 
        xrCompatible: true, alpha: true, antialias: true 
      })

      this.renderer = new THREE.WebGLRenderer({
        canvas, context: gl, alpha: true, antialias: true
      })
      this.renderer.setSize(window.innerWidth, window.innerHeight)
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      this.renderer.xr.enabled = true
      this.renderer.shadowMap.enabled = true
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
      this.renderer.outputColorSpace = THREE.SRGBColorSpace

      const baseLayer = new XRWebGLLayer(this.session, gl)
      await this.session.updateRenderState({ 
        baseLayer, depthNear: 0.1, depthFar: 1000 
      })

      this.scene = new THREE.Scene()
      this.scene.background = null
      
      this.setupLighting()
      this.createGroundVisualization()
      
      this.camera = new THREE.PerspectiveCamera(
        75, window.innerWidth / window.innerHeight, 0.1, 1000
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(5, 10, 7)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 1024
    dirLight.shadow.mapSize.height = 1024
    this.scene.add(dirLight)
  }

  createGroundVisualization() {
    this.planeVisualizers = new THREE.Group()
    this.scene.add(this.planeVisualizers)

    this.scanRing = new THREE.Mesh(
      new THREE.RingGeometry(0.1, 0.15, 32),
      new THREE.MeshBasicMaterial({ 
        color: 0x4ade80, 
        transparent: true, 
        opacity: 0.8,
        side: THREE.DoubleSide
      })
    )
    this.scanRing.rotation.x = -Math.PI / 2
    this.scanRing.visible = false
    this.scene.add(this.scanRing)

    this.scanLine = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 0.01),
      new THREE.MeshBasicMaterial({ 
        color: 0x4ade80, 
        transparent: true, 
        opacity: 0.6 
      })
    )
    this.scanLine.rotation.x = -Math.PI / 2
    this.scanLine.visible = false
    this.scene.add(this.scanLine)
  }

  setupPlaneDetection() {
    this.session.addEventListener('planesdetected', (event) => {
      const planes = event.data
      this.detectedPlanes = Array.from(planes)
      this.updatePlaneVisualization()
      
      if (!this.isPlaced && this.detectedPlanes.length > 0) {
        this.calculateOptimalPlacement()
      }
      
      this.onPlaneUpdate?.(this.detectedPlanes)
    })
  }

  updatePlaneVisualization() {
    while(this.planeVisualizers.children.length > 0) {
      this.planeVisualizers.remove(this.planeVisualizers.children[0])
    }

    this.detectedPlanes.forEach((plane) => {
      const geometry = new THREE.PlaneGeometry(
        plane.extent?.width || 1, 
        plane.extent?.height || 1
      )
      const material = new THREE.MeshBasicMaterial({
        color: 0x4ade80,
        transparent: true,
        opacity: 0.2,
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

      const edges = new THREE.EdgesGeometry(geometry)
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x4ade80, linewidth: 2 })
      const wireframe = new THREE.LineSegments(edges, lineMaterial)
      wireframe.position.copy(mesh.position)
      wireframe.quaternion.copy(mesh.quaternion)
      this.planeVisualizers.add(wireframe)
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
        
        if (!this.isPlaced && this.frameCount % 3 === 0) {
          try {
            const hitResults = frame.getHitTestResults(this.hitTestSource)
            if (hitResults.length > 0) {
              const hitPose = hitResults[0].getPose(this.referenceSpace)
              if (hitPose) {
                this.scanRing.visible = true
                this.scanLine.visible = true
                this.scanRing.position.set(
                  hitPose.transform.position.x,
                  hitPose.transform.position.y,
                  hitPose.transform.position.z
                )
                this.scanLine.position.copy(this.scanRing.position)
                this.scanRing.rotation.z = time * 0.002
                const pulse = 1 + Math.sin(time * 0.008) * 0.2
                this.scanLine.scale.set(pulse, pulse, pulse)
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

          this.updateModelPosition()
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

  updateModelPosition() {
    if (!this.currentCharacter) return
  }

  updateTracking() {
    if (!this.isTracking || !this.currentCharacter || !this.camera) return
    
    const model = this.currentCharacter.scene
    const cameraPosition = this.camera.position.clone()
    const cameraDirection = new THREE.Vector3(0, 0, -1)
    cameraDirection.applyQuaternion(this.camera.quaternion)
    
    const targetPosition = cameraPosition.clone().add(
      cameraDirection.multiplyScalar(1.5)
    )
    
    model.position.lerp(targetPosition, 0.1)
    model.lookAt(cameraPosition.x, model.position.y, cameraPosition.z)
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
          
          vrm.scene.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true
              child.receiveShadow = true
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

  placeModel() {
    if (!this.currentCharacter) {
      console.warn('无法放置模型: VRM角色未加载')
      return false
    }
    
    if (!this.optimalPosition) {
      console.warn('无法放置模型: 没有放置位置')
      return false
    }
    
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
    
    this.playPlacementAnimation()
    
    this.scanRing.visible = false
    this.scanLine.visible = false
    
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
    console.log('跟踪模式:', this.isTracking ? '开启' : '关闭')
    return this.isTracking
  }

  async loadVRMAActions() {
    try {
      this.vrmaActions = await getAllVRMAActions()
      return this.vrmaActions
    } catch (error) {
      console.error('加载VRMA动作失败:', error)
      return []
    }
  }

  async playAction(actionId) {
    if (!this.mixer || !this.currentCharacter) {
      console.warn('无法播放动作: 动画系统未初始化')
      return
    }

    try {
      if (this.currentAnimation) {
        this.currentAnimation.fadeOut(0.2)
      }

      const clip = await loadVRMAAction(actionId, this.currentCharacter)
      if (clip) {
        this.currentAnimation = this.mixer.clipAction(clip)
        this.currentAnimation.fadeIn(0.2)
        this.currentAnimation.play()
      }
    } catch (error) {
      console.error('播放动作失败:', error)
    }
  }

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
    this.isRendering = false
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
  const [showEffects, setShowEffects] = useState(false)
  const [currentEffect, setCurrentEffect] = useState(null)

  useEffect(() => {
    initAR()
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (arManagerRef.current?.session && !arManagerRef.current.isRendering) {
          arManagerRef.current.startRenderLoop()
        }
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
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
      
      const actions = await arManagerRef.current.loadVRMAActions()
      setVrmaActions(actions)
      
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
    await arManagerRef.current?.playAction(action.id)
    
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
          <button className={styles.toolButton} onClick={onScreenshot}>
            📷
          </button>
          <button 
            className={`${styles.toolButton} ${isRecording ? styles.recording : ''}`}
            onClick={() => setIsRecording(!isRecording)}
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
        </div>
      )}

      {/* 底部菜单 */}
      <div className={styles.bottomMenu}>
        {/* 展开的动作面板 */}
        {showMenu && (
          <div className={styles.actionPanel}>
            {/* 搜索框 */}
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

            {/* 分类标签 */}
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
            
            {/* 动作轮播 */}
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

        {/* 主菜单按钮 */}
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
    </div>
  )
}

export default ARViewerNew
