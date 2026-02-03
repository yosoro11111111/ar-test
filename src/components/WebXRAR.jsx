import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { ARGestureHandler } from './ARGestureHandler'
import { ARParticleSystem } from './ARParticleSystem'

// AR 核心管理器
class ARSessionManager {
  constructor() {
    this.session = null
    this.renderer = null
    this.scene = null
    this.camera = null
    this.referenceSpace = null
    this.hitTestSource = null
    this.planes = new Map()
    this.onPlaneDetected = null
    this.onPlaneLost = null
    this.placementIndicator = null
    this.shadowPlane = null
    this.particleSystem = null
    this.selectionRing = null
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

  // 启动会话
  async start(canvas) {
    try {
      // 请求AR会话，添加平面检测
      this.session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'local-floor'],
        optionalFeatures: ['dom-overlay', 'plane-detection'],
        domOverlay: { root: document.body }
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

      // 配置XR渲染层
      const baseLayer = new XRWebGLLayer(this.session, gl)
      await this.session.updateRenderState({ 
        baseLayer, depthNear: 0.1, depthFar: 1000 
      })

      // 创建场景
      this.scene = new THREE.Scene()
      
      // 添加灯光系统
      this.setupLighting()
      
      // 创建放置指示器
      this.placementIndicator = this.createPlacementIndicator()
      this.placementIndicator.visible = false
      this.scene.add(this.placementIndicator)

      // 创建地面网格
      this.groundGrid = this.createGroundGrid()
      this.groundGrid.visible = false
      this.scene.add(this.groundGrid)

      // 创建阴影接收平面
      this.shadowPlane = this.createShadowPlane()
      this.shadowPlane.visible = false
      this.scene.add(this.shadowPlane)

      // 初始化粒子系统
      this.particleSystem = new ARParticleSystem(this.scene)

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

      // 监听平面检测事件
      this.setupPlaneDetection()

      return true
    } catch (error) {
      console.error('启动AR失败:', error)
      throw error
    }
  }

  // 设置灯光
  setupLighting() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambientLight)

    // 主方向光（模拟阳光）
    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(5, 10, 7)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 2048
    dirLight.shadow.mapSize.height = 2048
    dirLight.shadow.camera.near = 0.1
    dirLight.shadow.camera.far = 50
    dirLight.shadow.bias = -0.001
    this.scene.add(dirLight)
    this.mainLight = dirLight

    // 补光
    const fillLight = new THREE.DirectionalLight(0x99ccff, 0.3)
    fillLight.position.set(-5, 3, -5)
    this.scene.add(fillLight)
  }

  // 创建放置指示器
  createPlacementIndicator() {
    const group = new THREE.Group()
    
    // 外圆环
    const ringGeo = new THREE.RingGeometry(0.15, 0.2, 32)
    const ringMat = new THREE.MeshBasicMaterial({ 
      color: 0x4ade80, transparent: true, opacity: 0.8, side: THREE.DoubleSide
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = -Math.PI / 2
    group.add(ring)

    // 内圆点
    const dotGeo = new THREE.CircleGeometry(0.05, 32)
    const dotMat = new THREE.MeshBasicMaterial({ 
      color: 0x4ade80, transparent: true, opacity: 0.6
    })
    const dot = new THREE.Mesh(dotGeo, dotMat)
    dot.rotation.x = -Math.PI / 2
    dot.position.y = 0.001
    group.add(dot)

    // 四个方向箭头
    for (let i = 0; i < 4; i++) {
      const arrowGeo = new THREE.ConeGeometry(0.03, 0.1, 8)
      const arrowMat = new THREE.MeshBasicMaterial({ 
        color: 0x4ade80, transparent: true, opacity: 0.7
      })
      const arrow = new THREE.Mesh(arrowGeo, arrowMat)
      arrow.rotation.x = Math.PI
      arrow.rotation.z = (Math.PI / 2) * i
      arrow.position.set(
        Math.sin((Math.PI / 2) * i) * 0.25,
        0.05,
        Math.cos((Math.PI / 2) * i) * 0.25
      )
      group.add(arrow)
    }

    return group
  }

  // 创建地面网格
  createGroundGrid() {
    const gridHelper = new THREE.GridHelper(10, 20, 0x4ade80, 0x2d3748)
    gridHelper.material.transparent = true
    gridHelper.material.opacity = 0.3
    return gridHelper
  }

  // 创建阴影接收平面
  createShadowPlane() {
    const geometry = new THREE.PlaneGeometry(10, 10)
    const material = new THREE.ShadowMaterial({ opacity: 0.3 })
    const plane = new THREE.Mesh(geometry, material)
    plane.rotation.x = -Math.PI / 2
    plane.receiveShadow = true
    return plane
  }

  // 设置平面检测
  setupPlaneDetection() {
    if (!this.session) return
    
    // 监听平面检测事件
    this.session.addEventListener('planesdetected', (event) => {
      const detectedPlanes = event.data
      
      detectedPlanes.forEach(plane => {
        if (!this.planes.has(plane.planeSpace)) {
          // 新平面
          this.planes.set(plane.planeSpace, plane)
          this.onPlaneDetected?.(plane)
        }
      })

      // 检查消失的平面
      this.planes.forEach((plane, space) => {
        if (!detectedPlanes.find(p => p.planeSpace === space)) {
          this.planes.delete(space)
          this.onPlaneLost?.(plane)
        }
      })
    })
  }

  // 渲染循环
  render(onFrame) {
    const loop = (time, frame) => {
      if (!this.session) return

      const pose = frame.getViewerPose(this.referenceSpace)
      
      if (pose) {
        // Hit Test
        const hitResults = frame.getHitTestResults(this.hitTestSource)
        
        // 更新放置指示器
        if (hitResults.length > 0) {
          const hitPose = hitResults[0].getPose(this.referenceSpace)
          if (hitPose) {
            this.placementIndicator.visible = true
            this.placementIndicator.position.set(
              hitPose.transform.position.x,
              hitPose.transform.position.y,
              hitPose.transform.position.z
            )
            // 浮动动画
            this.placementIndicator.position.y += Math.sin(time * 0.005) * 0.01
            
            // 更新地面网格和阴影平面
            this.groundGrid.position.copy(this.placementIndicator.position)
            this.groundGrid.visible = true
            this.shadowPlane.position.copy(this.placementIndicator.position)
            this.shadowPlane.visible = true
            
            onFrame?.({
              hasHit: true,
              position: this.placementIndicator.position.clone(),
              hitResults
            })
          }
        } else {
          this.placementIndicator.visible = false
          this.groundGrid.visible = false
          this.shadowPlane.visible = false
          onFrame?.({ hasHit: false })
        }

        // 更新相机
        const view = pose.views[0]
        this.camera.matrix.fromArray(view.transform.matrix)
        this.camera.matrix.decompose(
          this.camera.position, 
          this.camera.quaternion, 
          this.camera.scale
        )

        // 绑定帧缓冲
        const glLayer = this.session.renderState.baseLayer
        const gl = this.renderer.getContext()
        gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer)
        
        // 设置视口
        const viewport = glLayer.getViewport(view)
        gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height)
      }

      // 更新环境光
      this.updateEnvironmentLighting()
      
      // 更新动画
      this.updateAnimations()
      
      // 更新粒子系统
      if (this.particleSystem) {
        this.particleSystem.update()
        
        // 更新选中光环
        if (this.selectionRing) {
          this.particleSystem.updateSelectionRing(this.selectionRing, time)
        }
      }

      this.renderer.render(this.scene, this.camera)
      this.session.requestAnimationFrame(loop)
    }

    this.session.requestAnimationFrame(loop)
  }

  // 更新环境光照
  updateEnvironmentLighting() {
    // 这里可以根据环境光传感器数据调整灯光
    // 简化版本：根据时间调整
    const hour = new Date().getHours()
    let intensity = 1
    
    if (hour >= 6 && hour < 18) {
      // 白天
      intensity = 1
      this.mainLight.color.setHex(0xffffff)
    } else if (hour >= 18 && hour < 20) {
      // 黄昏
      intensity = 0.7
      this.mainLight.color.setHex(0xffaa77)
    } else {
      // 夜晚
      intensity = 0.4
      this.mainLight.color.setHex(0x8899ff)
    }
    
    this.mainLight.intensity = intensity
  }

  // 放置角色
  placeCharacter(character, position) {
    if (!this.scene) return null

    // 创建角色容器
    const characterGroup = new THREE.Group()
    characterGroup.position.copy(position)
    characterGroup.userData.isCharacter = true
    characterGroup.userData.characterId = Date.now()
    
    // 这里应该加载实际的VRM模型
    // 简化版本：创建一个占位体
    const geometry = new THREE.CapsuleGeometry(0.3, 1.5, 4, 8)
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x667eea,
      roughness: 0.5,
      metalness: 0.1
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.y = 0.9
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData.isCharacter = true
    characterGroup.add(mesh)

    // 添加选择框
    const boxGeo = new THREE.BoxGeometry(0.8, 2, 0.8)
    const boxMat = new THREE.MeshBasicMaterial({ 
      color: 0x4ade80, 
      wireframe: true,
      transparent: true,
      opacity: 0
    })
    const selectionBox = new THREE.Mesh(boxGeo, boxMat)
    selectionBox.position.y = 1
    selectionBox.name = 'selectionBox'
    characterGroup.add(selectionBox)

    // 添加动作状态
    characterGroup.userData.currentAction = null
    characterGroup.userData.isPlayingAction = false

    this.scene.add(characterGroup)
    
    // 播放放置特效
    if (this.particleSystem) {
      this.particleSystem.createPlacementEffect(position)
    }
    
    // 隐藏放置指示器
    this.placementIndicator.visible = false

    return characterGroup
  }

  // 设置选中角色
  setSelectedCharacter(character) {
    // 移除之前的光环
    if (this.selectionRing) {
      this.scene.remove(this.selectionRing.mesh)
      this.selectionRing = null
    }
    
    // 创建新的光环
    if (character && this.particleSystem) {
      this.selectionRing = this.particleSystem.createSelectionRing(character.position)
    }
  }

  // 更新选中光环位置
  updateSelectionRingPosition(position) {
    if (this.selectionRing) {
      this.selectionRing.mesh.position.copy(position)
    }
  }

  // 播放动作
  playAction(character, actionName) {
    if (!character) return
    
    console.log('播放动作:', actionName)
    
    // 停止当前动作
    this.stopAction(character)
    
    // 这里应该加载并播放实际的VRMA动作
    // 简化版本：根据动作类型播放不同的动画
    character.userData.currentAction = actionName
    character.userData.isPlayingAction = true
    
    // 创建简单的动画效果
    this.createSimpleAnimation(character, actionName)
    
    // 播放动作特效
    if (this.particleSystem) {
      const position = character.position
      if (actionName.includes('jump') || actionName.includes('Jump')) {
        // 跳跃特效延迟播放（落地时）
        setTimeout(() => {
          this.particleSystem.createJumpEffect(position)
        }, 300)
      } else if (actionName.includes('dance') || actionName.includes('Dance')) {
        // 跳舞特效
        this.particleSystem.createDanceEffect(position)
        // 持续产生音符
        character.userData.danceInterval = setInterval(() => {
          if (character.userData.isPlayingAction && 
              character.userData.animationType === 'dance') {
            this.particleSystem.createDanceEffect(character.position)
          } else {
            clearInterval(character.userData.danceInterval)
          }
        }, 1000)
      }
    }
  }

  // 停止动作
  stopAction(character) {
    if (!character) return
    
    // 清除动画
    if (character.userData.animationMixer) {
      character.userData.animationMixer.stopAllAction()
    }
    
    character.userData.currentAction = null
    character.userData.isPlayingAction = false
  }

  // 创建简单动画（占位）
  createSimpleAnimation(character, actionName) {
    // 根据动作类型创建不同的动画
    const mesh = character.children.find(child => child.geometry && child.geometry.type === 'CapsuleGeometry')
    if (!mesh) return

    let animationType = 'idle'
    
    if (actionName.includes('wave') || actionName.includes('Wave')) {
      animationType = 'wave'
    } else if (actionName.includes('jump') || actionName.includes('Jump')) {
      animationType = 'jump'
    } else if (actionName.includes('dance') || actionName.includes('Dance')) {
      animationType = 'dance'
    } else if (actionName.includes('bow') || actionName.includes('Bow')) {
      animationType = 'bow'
    }

    // 存储动画类型
    character.userData.animationType = animationType
    character.userData.animationStartTime = Date.now()
  }

  // 更新动画
  updateAnimations() {
    const characters = this.scene.children.filter(child => child.userData.isCharacter)
    
    characters.forEach(character => {
      if (!character.userData.isPlayingAction) return
      
      const mesh = character.children.find(child => child.geometry && child.geometry.type === 'CapsuleGeometry')
      if (!mesh) return
      
      const elapsed = (Date.now() - character.userData.animationStartTime) / 1000
      const animationType = character.userData.animationType
      
      switch (animationType) {
        case 'wave':
          // 挥手动画
          mesh.rotation.z = Math.sin(elapsed * 10) * 0.3
          break
        case 'jump':
          // 跳跃动画
          mesh.position.y = 0.9 + Math.abs(Math.sin(elapsed * 5)) * 0.5
          break
        case 'dance':
          // 跳舞动画
          mesh.rotation.y = Math.sin(elapsed * 3) * 0.5
          mesh.position.y = 0.9 + Math.sin(elapsed * 8) * 0.1
          break
        case 'bow':
          // 鞠躬动画
          const bowPhase = Math.min(1, elapsed / 0.5)
          if (bowPhase < 0.5) {
            mesh.rotation.x = bowPhase * 2 * 0.5
          } else {
            mesh.rotation.x = (1 - bowPhase) * 2 * 0.5
          }
          if (elapsed > 1) {
            this.stopAction(character)
            mesh.rotation.x = 0
          }
          break
        default:
          // 呼吸动画
          mesh.scale.y = 1 + Math.sin(elapsed * 2) * 0.02
          break
      }
    })
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
    this.planes.clear()
  }
}

// React Hook
export const useWebXRAR = () => {
  const [isSupported, setIsSupported] = useState(false)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [placementPosition, setPlacementPosition] = useState(null)
  const [isPlaced, setIsPlaced] = useState(false)
  const [placedCharacters, setPlacedCharacters] = useState([])
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const arManagerRef = useRef(null)

  useEffect(() => {
    arManagerRef.current = new ARSessionManager()
    arManagerRef.current.isSupported().then(setIsSupported)
  }, [])

  const startAR = useCallback(async (canvas) => {
    if (!arManagerRef.current) return false
    
    try {
      await arManagerRef.current.start(canvas)
      setIsSessionActive(true)
      
      arManagerRef.current.render((data) => {
        if (data.hasHit) {
          setPlacementPosition(data.position)
        }
      })
      
      return true
    } catch (error) {
      console.error('启动AR失败:', error)
      return false
    }
  }, [])

  const placeCharacter = useCallback((character) => {
    if (!arManagerRef.current || !placementPosition) return null
    
    const characterGroup = arManagerRef.current.placeCharacter(
      character, 
      placementPosition
    )
    
    if (characterGroup) {
      setPlacedCharacters(prev => [...prev, characterGroup])
      setIsPlaced(true)
      return placementPosition
    }
    return null
  }, [placementPosition])

  const endAR = useCallback(async () => {
    if (arManagerRef.current) {
      await arManagerRef.current.end()
      setIsSessionActive(false)
      setPlacementPosition(null)
      setIsPlaced(false)
      setPlacedCharacters([])
      setSelectedCharacter(null)
    }
  }, [])

  // 选择角色
  const selectCharacter = useCallback((character) => {
    // 取消之前的选择
    placedCharacters.forEach(char => {
      const box = char.getObjectByName('selectionBox')
      if (box) box.material.opacity = 0
    })
    
    // 选中新角色
    if (character) {
      const box = character.getObjectByName('selectionBox')
      if (box) box.material.opacity = 0.5
      setSelectedCharacter(character)
      
      // 创建选中光环
      if (arManagerRef.current) {
        arManagerRef.current.setSelectedCharacter(character)
      }
    } else {
      setSelectedCharacter(null)
      
      // 移除选中光环
      if (arManagerRef.current) {
        arManagerRef.current.setSelectedCharacter(null)
      }
    }
  }, [placedCharacters])

  // 移动角色
  const moveCharacter = useCallback((character, newPosition) => {
    if (character) {
      character.position.copy(newPosition)
      
      // 更新选中光环位置
      if (arManagerRef.current && selectedCharacter === character) {
        arManagerRef.current.updateSelectionRingPosition(newPosition)
      }
    }
  }, [selectedCharacter])

  // 缩放角色
  const scaleCharacter = useCallback((character, scale) => {
    if (character) {
      character.scale.setScalar(scale)
    }
  }, [])

  // 旋转角色
  const rotateCharacter = useCallback((character, rotation) => {
    if (character) {
      character.rotation.y = rotation
    }
  }, [])

  // 播放动作
  const playCharacterAction = useCallback((character, actionName) => {
    if (arManagerRef.current && character) {
      arManagerRef.current.playAction(character, actionName)
    }
  }, [])

  // 停止动作
  const stopCharacterAction = useCallback((character) => {
    if (arManagerRef.current && character) {
      arManagerRef.current.stopAction(character)
    }
  }, [])

  return {
    isSupported,
    isSessionActive,
    placementPosition,
    isPlaced,
    placedCharacters,
    selectedCharacter,
    startAR,
    endAR,
    placeCharacter,
    selectCharacter,
    moveCharacter,
    scaleCharacter,
    rotateCharacter,
    playCharacterAction,
    stopCharacterAction,
    arManager: arManagerRef.current
  }
}

// WebXR AR 组件
export const WebXRAR = ({ 
  character, 
  onPositionChange,
  onClose,
  isMobile 
}) => {
  const canvasRef = useRef(null)
  const gestureHandlerRef = useRef(null)
  const {
    isSupported,
    isSessionActive,
    placementPosition,
    isPlaced,
    placedCharacters,
    selectedCharacter,
    startAR,
    endAR,
    placeCharacter,
    selectCharacter,
    moveCharacter,
    scaleCharacter,
    rotateCharacter,
    playCharacterAction,
    stopCharacterAction,
    arManager
  } = useWebXRAR()

  const [isStarting, setIsStarting] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [showActionPanel, setShowActionPanel] = useState(false)
  const [showGestureHint, setShowGestureHint] = useState(true)

  // 启动AR
  const handleStartAR = async () => {
    if (!canvasRef.current) return
    setIsStarting(true)
    const success = await startAR(canvasRef.current)
    setIsStarting(false)
    if (success) {
      setShowControls(true)
      // 初始化手势处理器
      initGestureHandler()
      
      // 自动放置角色到合适位置
      autoPlaceCharacter()
    }
  }
  
  // 自动放置角色 - 优化位置和大小
  const autoPlaceCharacter = useCallback(() => {
    // 等待平面检测
    const checkAndPlace = () => {
      if (placementPosition && !isPlaced && arManager) {
        // 直接调用 ARManager 的 placeCharacter 获取角色引用
        const placedChar = arManager.placeCharacter(character, placementPosition)
        
        if (placedChar) {
          // 添加到列表
          setPlacedCharacters(prev => [...prev, placedChar])
          setIsPlaced(true)
          
          // 1. 调整大小为合适比例 (0.8x - 适合AR观看)
          const optimalScale = 0.8
          placedChar.scale.setScalar(optimalScale)
          setScale(optimalScale)
          
          // 2. 调整朝向 - 面向相机
          if (arManager.camera) {
            const cameraPos = arManager.camera.position
            const characterPos = placedChar.position
            const angle = Math.atan2(
              cameraPos.x - characterPos.x,
              cameraPos.z - characterPos.z
            )
            placedChar.rotation.y = angle
            setRotation(angle)
          }
          
          // 3. 稍微调整位置到视野中心
          placedChar.position.y += 0.02 // 稍微抬高避免穿模
          
          // 4. 自动选中并播放待机动作
          setTimeout(() => {
            selectCharacter(placedChar)
            playCharacterAction(placedChar, 'idle')
          }, 300)
          
          if (onPositionChange) {
            onPositionChange([
              placedChar.position.x,
              placedChar.position.y,
              placedChar.position.z
            ])
          }
        }
      } else if (!isPlaced) {
        // 继续等待
        setTimeout(checkAndPlace, 500)
      }
    }
    
    // 1.5秒后开始尝试放置（给用户一点准备时间）
    setTimeout(checkAndPlace, 1500)
  }, [placementPosition, isPlaced, arManager, character, onPositionChange, selectCharacter, playCharacterAction])

  // 初始化手势处理器
  const initGestureHandler = () => {
    if (!arManager || !canvasRef.current) return
    
    gestureHandlerRef.current = new ARGestureHandler(arManager)
    gestureHandlerRef.current.init(canvasRef.current)
    
    // 设置回调
    gestureHandlerRef.current.onCharacterSelect = (character) => {
      selectCharacter(character)
      if (character) {
        setShowActionPanel(true)
        setScale(character.scale.x)
        setRotation(character.rotation.y)
      } else {
        setShowActionPanel(false)
      }
    }
    
    gestureHandlerRef.current.onCharacterMove = (character, position) => {
      moveCharacter(character, position)
    }
    
    gestureHandlerRef.current.onCharacterScale = (character, newScale) => {
      setScale(newScale)
    }
    
    gestureHandlerRef.current.onCharacterRotate = (character, newRotation) => {
      setRotation(newRotation)
    }
    
    gestureHandlerRef.current.onLongPress = (character, pos) => {
      // 长按显示菜单
      setShowActionPanel(true)
    }
    
    gestureHandlerRef.current.onTap = (pos) => {
      // 点击空白处取消选择
      if (!selectedCharacter) {
        setShowActionPanel(false)
      }
    }
    
    // 3秒后隐藏手势提示
    setTimeout(() => setShowGestureHint(false), 3000)
  }

  // 放置角色
  const handlePlace = () => {
    const pos = placeCharacter(character)
    if (pos && onPositionChange) {
      onPositionChange([pos.x, pos.y, pos.z])
    }
  }

  // 处理缩放
  const handleScale = (delta) => {
    const newScale = Math.max(0.5, Math.min(3, scale + delta))
    setScale(newScale)
    if (selectedCharacter) {
      scaleCharacter(selectedCharacter, newScale)
    } else if (placedCharacters.length > 0) {
      scaleCharacter(placedCharacters[placedCharacters.length - 1], newScale)
    }
  }

  // 处理旋转
  const handleRotate = (delta) => {
    const newRotation = rotation + delta
    setRotation(newRotation)
    if (selectedCharacter) {
      rotateCharacter(selectedCharacter, newRotation)
    } else if (placedCharacters.length > 0) {
      rotateCharacter(placedCharacters[placedCharacters.length - 1], newRotation)
    }
  }

  // 关闭AR
  const handleClose = async () => {
    await endAR()
    onClose?.()
  }

  if (!isSupported) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.9)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 10000
      }}>
        <div style={{
          background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)',
          padding: '40px', borderRadius: '20px', textAlign: 'center', maxWidth: '400px'
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>📱</div>
          <h2 style={{ color: 'white', marginBottom: '16px' }}>设备不支持</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '24px' }}>
            您的设备或浏览器不支持 WebXR AR 功能。
          </p>
          <button onClick={handleClose} style={{
            padding: '12px 32px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none', borderRadius: '10px', color: 'white', fontSize: '16px', cursor: 'pointer'
          }}>关闭</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, background: 'transparent'
    }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* UI 覆盖层 */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        pointerEvents: 'none', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '20px'
      }}>
        {/* 顶部提示 */}
        <div style={{
          background: 'rgba(0,0,0,0.6)', padding: '16px 24px',
          borderRadius: '12px', textAlign: 'center', pointerEvents: 'auto'
        }}>
          {!isSessionActive ? (
            <p style={{ color: 'white', margin: 0 }}>点击"启动 AR"开始体验</p>
          ) : !isPlaced ? (
            <p style={{ color: 'white', margin: 0 }}>
              {placementPosition 
                ? '✅ 检测到平面！点击"放置角色"'
                : '🔄 移动设备扫描地面...'}
            </p>
          ) : (
            <p style={{ color: '#4ade80', margin: 0 }}>
              ✅ 已放置 {placedCharacters.length} 个角色
            </p>
          )}
        </div>

        {/* 手势提示 */}
        {isSessionActive && showGestureHint && (
          <div style={{
            background: 'rgba(0,0,0,0.7)', padding: '12px 20px',
            borderRadius: '12px', pointerEvents: 'auto', marginBottom: '12px'
          }}>
            <p style={{ color: 'white', margin: 0, fontSize: '14px', textAlign: 'center' }}>
              👆 点击选择角色 | ✋ 拖拽移动 | 🤏 双指缩放/旋转 | ⏱️ 长按菜单
            </p>
          </div>
        )}

        {/* 动作面板 */}
        {showActionPanel && selectedCharacter && (
          <div style={{
            background: 'rgba(0,0,0,0.8)', padding: '16px', borderRadius: '12px',
            pointerEvents: 'auto', marginBottom: '12px', maxHeight: '200px', overflowY: 'auto'
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: '8px',
              marginBottom: '12px'
            }}>
              {['wave', 'jump', 'dance', 'bow', 'idle', 'stop'].map(action => (
                <button
                  key={action}
                  onClick={() => {
                    if (action === 'stop') {
                      stopCharacterAction(selectedCharacter)
                    } else {
                      playCharacterAction(selectedCharacter, action)
                    }
                  }}
                  style={{
                    padding: '10px 8px',
                    background: action === 'stop' 
                      ? 'rgba(239, 68, 68, 0.8)' 
                      : 'rgba(59, 130, 246, 0.8)',
                    border: 'none', borderRadius: '8px',
                    color: 'white', fontSize: '12px', cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {action === 'wave' && '👋 挥手'}
                  {action === 'jump' && '⬆️ 跳跃'}
                  {action === 'dance' && '💃 跳舞'}
                  {action === 'bow' && '🙇 鞠躬'}
                  {action === 'idle' && '😌 待机'}
                  {action === 'stop' && '⏹️ 停止'}
                </button>
              ))}
            </div>
            
            {/* 变换控制 */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {/* 缩放控制 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'white', fontSize: '14px' }}>大小:</span>
                <button onClick={() => handleScale(-0.1)} style={{
                  padding: '8px 16px', background: 'rgba(255,255,255,0.2)',
                  border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer'
                }}>-</button>
                <span style={{ color: 'white', minWidth: '40px', textAlign: 'center' }}>
                  {scale.toFixed(1)}x
                </span>
                <button onClick={() => handleScale(0.1)} style={{
                  padding: '8px 16px', background: 'rgba(255,255,255,0.2)',
                  border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer'
                }}>+</button>
              </div>

              {/* 旋转控制 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'white', fontSize: '14px' }}>旋转:</span>
                <button onClick={() => handleRotate(-Math.PI / 8)} style={{
                  padding: '8px 16px', background: 'rgba(255,255,255,0.2)',
                  border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer'
                }}>↺</button>
                <button onClick={() => handleRotate(Math.PI / 8)} style={{
                  padding: '8px 16px', background: 'rgba(255,255,255,0.2)',
                  border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer'
                }}>↻</button>
              </div>
            </div>
          </div>
        )}

        {/* 底部按钮 */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', pointerEvents: 'auto' }}>
          {!isSessionActive ? (
            <button onClick={handleStartAR} disabled={isStarting} style={{
              padding: '16px 32px',
              background: isStarting ? 'rgba(255,255,255,0.2)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none', borderRadius: '12px', color: 'white', fontSize: '18px', fontWeight: 'bold',
              cursor: isStarting ? 'not-allowed' : 'pointer'
            }}>{isStarting ? '启动中...' : '🚀 启动 AR'}</button>
          ) : (
            <>
              {!isPlaced && placementPosition && (
                <button onClick={handlePlace} style={{
                  padding: '16px 32px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none', borderRadius: '12px', color: 'white', fontSize: '18px', fontWeight: 'bold',
                  cursor: 'pointer'
                }}>✓ 放置角色</button>
              )}
              {isPlaced && (
                <button onClick={handlePlace} style={{
                  padding: '16px 32px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: 'none', borderRadius: '12px', color: 'white', fontSize: '18px', fontWeight: 'bold',
                  cursor: 'pointer'
                }}>+ 再放置一个</button>
              )}
              <button onClick={handleClose} style={{
                padding: '16px 32px', background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)', borderRadius: '12px',
                color: 'white', fontSize: '18px', cursor: 'pointer'
              }}>✕ 退出 AR</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default WebXRAR
