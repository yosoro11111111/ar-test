import React, { useState, useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import styles from './WebXRARPlayer.module.css'

/**
 * WebXR AR MMD播放器
 * 
 * 功能：
 * 1. 启动WebXR AR会话
 * 2. 加载录制的场景数据（平面位置）
 * 3. 在真实平面上放置MMD角色
 * 4. 播放MMD动作
 * 5. 支持多角色、时间轴控制
 */

export function WebXRARPlayer({
  isOpen,
  onClose,
  sceneData,
  project,
  currentTime = 0,
  isPlaying = false
}) {
  const canvasRef = useRef(null)
  const sessionRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const referenceSpaceRef = useRef(null)
  const hitTestSourceRef = useRef(null)
  const charactersRef = useRef(new Map())
  const mixerRef = useRef(null)
  const clockRef = useRef(new THREE.Clock())
  const animationFrameRef = useRef(null)
  
  const [isSupported, setIsSupported] = useState(false)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [placedCharacters, setPlacedCharacters] = useState(0)
  const [showPlacementUI, setShowPlacementUI] = useState(true)

  // 检查WebXR支持
  useEffect(() => {
    const checkSupport = async () => {
      if (!('xr' in navigator)) {
        setError('浏览器不支持WebXR')
        return false
      }
      try {
        const supported = await navigator.xr.isSessionSupported('immersive-ar')
        setIsSupported(supported)
        return supported
      } catch {
        setError('检查WebXR支持失败')
        return false
      }
    }
    if (isOpen) checkSupport()
  }, [isOpen])

  // 启动WebXR会话
  const startARSession = async () => {
    if (!canvasRef.current || !isSupported) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'local-floor'],
        optionalFeatures: ['plane-detection', 'dom-overlay'],
        domOverlay: { root: document.getElementById('ar-player-overlay') }
      })
      
      sessionRef.current = session
      
      // 获取WebGL上下文
      const gl = canvasRef.current.getContext('webgl2', { 
        xrCompatible: true, alpha: true, antialias: true 
      }) || canvasRef.current.getContext('webgl', { 
        xrCompatible: true, alpha: true, antialias: true 
      })
      
      // 创建渲染器
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        context: gl,
        alpha: true,
        antialias: true
      })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.xr.enabled = true
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      rendererRef.current = renderer
      
      // 配置XR渲染层
      const baseLayer = new XRWebGLLayer(session, gl)
      await session.updateRenderState({ 
        baseLayer, 
        depthNear: 0.1, 
        depthFar: 1000 
      })
      
      // 创建场景
      const scene = new THREE.Scene()
      sceneRef.current = scene
      
      // 添加灯光
      setupLighting(scene)
      
      // 创建相机
      const camera = new THREE.PerspectiveCamera(
        75, window.innerWidth / window.innerHeight, 0.1, 1000
      )
      cameraRef.current = camera
      
      // 获取参考空间
      const referenceSpace = await session.requestReferenceSpace('local-floor')
      referenceSpaceRef.current = referenceSpace
      
      // 设置Hit Test
      const viewerSpace = await session.requestReferenceSpace('viewer')
      const hitTestSource = await session.requestHitTestSource({ space: viewerSpace })
      hitTestSourceRef.current = hitTestSource
      
      // 如果有录制的场景数据，加载平面标记
      if (sceneData?.planes) {
        loadScenePlanes(scene, sceneData.planes)
      }
      
      // 加载角色
      if (project?.characters) {
        await loadCharacters(scene, project.characters, sceneData?.planes)
      }
      
      // 开始渲染循环
      setIsSessionActive(true)
      setIsLoading(false)
      renderLoop(session, renderer, scene, camera, referenceSpace, hitTestSource)
      
    } catch (err) {
      console.error('启动AR失败:', err)
      setError('启动AR失败: ' + err.message)
      setIsLoading(false)
    }
  }

  // 设置灯光
  const setupLighting = (scene) => {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    
    // 主方向光（模拟自然光）
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(3, 8, 5)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 2048
    dirLight.shadow.mapSize.height = 2048
    dirLight.shadow.camera.near = 0.1
    dirLight.shadow.camera.far = 30
    scene.add(dirLight)
    
    // 补光
    const fillLight = new THREE.DirectionalLight(0xe6f3ff, 0.4)
    fillLight.position.set(-3, 4, -3)
    scene.add(fillLight)
  }

  // 加载场景平面标记
  const loadScenePlanes = (scene, planes) => {
    planes.forEach((planeData, index) => {
      // 创建平面可视化
      const geometry = new THREE.PlaneGeometry(planeData.size.width, planeData.size.height)
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(
        planeData.position.x,
        planeData.position.y,
        planeData.position.z
      )
      mesh.rotation.set(
        THREE.MathUtils.degToRad(planeData.rotation.x),
        THREE.MathUtils.degToRad(planeData.rotation.y),
        THREE.MathUtils.degToRad(planeData.rotation.z)
      )
      
      // 添加边框
      const edges = new THREE.EdgesGeometry(geometry)
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff88 })
      const wireframe = new THREE.LineSegments(edges, lineMaterial)
      mesh.add(wireframe)
      
      // 添加标签
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = 128
      canvas.height = 64
      ctx.fillStyle = '#00ff88'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#000'
      ctx.font = 'bold 32px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`${index + 1}`, 64, 44)
      
      const texture = new THREE.CanvasTexture(canvas)
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture })
      const sprite = new THREE.Sprite(spriteMaterial)
      sprite.position.y = 0.6
      sprite.scale.set(0.8, 0.4, 1)
      mesh.add(sprite)
      
      scene.add(mesh)
      
      // 创建阴影接收平面
      const shadowGeometry = new THREE.PlaneGeometry(planeData.size.width, planeData.size.height)
      const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.3 })
      const shadowPlane = new THREE.Mesh(shadowGeometry, shadowMaterial)
      shadowPlane.position.copy(mesh.position)
      shadowPlane.rotation.copy(mesh.rotation)
      shadowPlane.receiveShadow = true
      scene.add(shadowPlane)
    })
  }

  // 加载角色
  const loadCharacters = async (scene, characters, planes) => {
    const loader = new GLTFLoader()
    
    for (let i = 0; i < characters.length; i++) {
      const char = characters[i]
      
      try {
        // 加载VRM模型
        const gltf = await new Promise((resolve, reject) => {
          loader.load(char.modelUrl, resolve, undefined, reject)
        })
        
        const vrm = gltf.userData.vrm
        if (!vrm) continue
        
        // 设置角色位置
        if (planes && planes[i % planes.length]) {
          const plane = planes[i % planes.length]
          vrm.scene.position.set(
            plane.position.x,
            plane.position.y + 1, // 站在平面上方
            plane.position.z
          )
        } else {
          // 默认位置
          vrm.scene.position.set(0, 0, -2)
        }
        
        vrm.scene.scale.set(1, 1, 1)
        vrm.scene.castShadow = true
        
        scene.add(vrm.scene)
        charactersRef.current.set(char.id, { vrm, character: char })
        
      } catch (err) {
        console.error('加载角色失败:', char.name, err)
      }
    }
    
    setPlacedCharacters(charactersRef.current.size)
  }

  // 渲染循环
  const renderLoop = (session, renderer, scene, camera, referenceSpace, hitTestSource) => {
    const loop = (time, frame) => {
      if (!session || session !== sessionRef.current) return
      
      const pose = frame.getViewerPose(referenceSpace)
      
      if (pose) {
        // 更新相机
        const view = pose.views[0]
        camera.matrix.fromArray(view.transform.matrix)
        camera.matrix.decompose(camera.position, camera.quaternion, camera.scale)
        
        // 绑定帧缓冲
        const glLayer = session.renderState.baseLayer
        const gl = renderer.getContext()
        gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer)
        
        // 设置视口
        const viewport = glLayer.getViewport(view)
        gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height)
        
        // 更新动画
        if (isPlaying && mixerRef.current) {
          const delta = clockRef.current.getDelta()
          mixerRef.current.update(delta)
        }
        
        // 更新VRM
        charactersRef.current.forEach(({ vrm }) => {
          if (vrm) {
            vrm.update(time)
          }
        })
      }
      
      renderer.render(scene, camera)
      animationFrameRef.current = session.requestAnimationFrame(loop)
    }
    
    animationFrameRef.current = session.requestAnimationFrame(loop)
  }

  // 播放动作
  const playAction = (characterId, actionData) => {
    const charData = charactersRef.current.get(characterId)
    if (!charData || !charData.vrm) return
    
    // 这里可以集成MMD动作播放
    // 使用现有的动作系统
    console.log('播放动作:', characterId, actionData)
  }

  // 结束会话
  const endSession = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    if (sessionRef.current) {
      sessionRef.current.end()
      sessionRef.current = null
    }
    
    if (rendererRef.current) {
      rendererRef.current.dispose()
      rendererRef.current = null
    }
    
    charactersRef.current.clear()
    setIsSessionActive(false)
  }

  // 关闭组件
  const handleClose = () => {
    endSession()
    onClose()
  }

  useEffect(() => {
    return () => {
      endSession()
    }
  }, [])

  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      {/* WebXR Canvas */}
      <canvas ref={canvasRef} className={styles.arCanvas} />
      
      {/* DOM Overlay UI */}
      <div id="ar-player-overlay" className={styles.arOverlay}>
        {/* 顶部栏 */}
        <div className={styles.topBar}>
          <button className={styles.closeBtn} onClick={handleClose}>✕</button>
          <div className={styles.info}>
            <span>角色: {placedCharacters}</span>
            {isPlaying && <span className={styles.playing}>▶ 播放中</span>}
          </div>
          {!isSessionActive && (
            <button 
              className={styles.startBtn}
              onClick={startARSession}
              disabled={!isSupported || isLoading}
            >
              {isLoading ? '加载中...' : '启动AR'}
            </button>
          )}
        </div>
        
        {/* 错误提示 */}
        {error && (
          <div className={styles.errorToast}>
            <span>{error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}
        
        {/* 加载中 */}
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner}></div>
            <p>加载AR场景...</p>
          </div>
        )}
        
        {/* 放置提示 */}
        {showPlacementUI && isSessionActive && placedCharacters === 0 && (
          <div className={styles.placementTip}>
            <h3>📍 放置角色</h3>
            <p>移动手机寻找平面</p>
            <p>点击屏幕放置角色</p>
            <button onClick={() => setShowPlacementUI(false)}>我知道了</button>
          </div>
        )}
        
        {/* 播放控制 */}
        {isSessionActive && (
          <div className={styles.controls}>
            <button 
              className={styles.controlBtn}
              onClick={() => {}}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <div className={styles.timeDisplay}>
              {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}
            </div>
          </div>
        )}
        
        {/* 不支持提示 */}
        {!isSupported && !error && (
          <div className={styles.notSupported}>
            <h3>⚠️ 设备不支持</h3>
            <p>需要支持WebXR的AR设备</p>
            <p>Android: Chrome + ARCore</p>
            <p>iOS: Safari 15+ + ARKit</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default WebXRARPlayer
