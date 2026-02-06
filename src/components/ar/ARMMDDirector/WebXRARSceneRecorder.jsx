import React, { useState, useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import styles from './WebXRARSceneRecorder.module.css'
import JSZip from 'jszip'

/**
 * WebXR AR场景录制组件
 * 
 * 使用WebXR API实现真正的AR场景录制：
 * 1. 启动WebXR AR会话
 * 2. 自动检测真实世界的平面
 * 3. 点击放置角色位置标记
 * 4. 保存平面数据和场景配置
 * 5. 导出.webxrar场景文件
 */

export function WebXRARSceneRecorder({
  isOpen,
  onClose,
  onSceneRecorded
}) {
  const canvasRef = useRef(null)
  const sessionRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const referenceSpaceRef = useRef(null)
  const hitTestSourceRef = useRef(null)
  const planesRef = useRef([])
  const placementIndicatorRef = useRef(null)
  
  const [isSupported, setIsSupported] = useState(false)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [planes, setPlanes] = useState([])
  const [isPlacing, setIsPlacing] = useState(false)
  const [sceneName, setSceneName] = useState('')
  const [error, setError] = useState(null)
  const [showInstructions, setShowInstructions] = useState(true)
  const [detectedPlanes, setDetectedPlanes] = useState(0)

  // 检查WebXR支持
  useEffect(() => {
    const checkSupport = async () => {
      if (!('xr' in navigator)) {
        setError('您的浏览器不支持WebXR，请使用Chrome Android或Safari iOS 15+')
        return
      }
      try {
        const supported = await navigator.xr.isSessionSupported('immersive-ar')
        setIsSupported(supported)
        if (!supported) {
          setError('您的设备不支持AR功能，需要支持ARCore的Android设备或ARKit的iOS设备')
        }
      } catch (err) {
        setError('检查WebXR支持失败: ' + err.message)
      }
    }
    if (isOpen) checkSupport()
  }, [isOpen])

  // 启动WebXR会话
  const startARSession = async () => {
    if (!canvasRef.current || !isSupported) return
    
    try {
      // 请求AR会话
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'local-floor'],
        optionalFeatures: ['plane-detection', 'dom-overlay'],
        domOverlay: { root: document.getElementById('ar-overlay') }
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
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      scene.add(ambientLight)
      
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
      dirLight.position.set(3, 8, 5)
      dirLight.castShadow = true
      scene.add(dirLight)
      
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
      
      // 创建放置指示器
      placementIndicatorRef.current = createPlacementIndicator()
      placementIndicatorRef.current.visible = false
      scene.add(placementIndicatorRef.current)
      
      // 监听平面检测
      setupPlaneDetection(session)
      
      // 开始渲染循环
      setIsSessionActive(true)
      renderLoop(session, renderer, scene, camera, referenceSpace, hitTestSource)
      
    } catch (err) {
      console.error('启动AR失败:', err)
      setError('启动AR失败: ' + err.message)
    }
  }

  // 创建放置指示器
  const createPlacementIndicator = () => {
    const group = new THREE.Group()
    
    // 外圆环
    const ringGeo = new THREE.RingGeometry(0.12, 0.14, 64)
    const ringMat = new THREE.MeshBasicMaterial({ 
      color: 0x00ff88, 
      transparent: true, 
      opacity: 0.9, 
      side: THREE.DoubleSide 
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = -Math.PI / 2
    group.add(ring)
    
    // 中心点
    const dotGeo = new THREE.CircleGeometry(0.04, 32)
    const dotMat = new THREE.MeshBasicMaterial({ 
      color: 0x00ff88, 
      transparent: true, 
      opacity: 0.9 
    })
    const dot = new THREE.Mesh(dotGeo, dotMat)
    dot.rotation.x = -Math.PI / 2
    dot.position.y = 0.001
    group.add(dot)
    
    return group
  }

  // 设置平面检测
  const setupPlaneDetection = (session) => {
    if (!session) return
    
    session.addEventListener('planesdetected', (event) => {
      const detectedPlanes = event.data
      setDetectedPlanes(detectedPlanes.length)
      
      detectedPlanes.forEach(plane => {
        // 可以在这里可视化检测到的平面
        console.log('检测到平面:', plane)
      })
    })
  }

  // 渲染循环
  const renderLoop = (session, renderer, scene, camera, referenceSpace, hitTestSource) => {
    const loop = (time, frame) => {
      if (!session || session !== sessionRef.current) return
      
      const pose = frame.getViewerPose(referenceSpace)
      
      if (pose) {
        // Hit Test
        const hitResults = frame.getHitTestResults(hitTestSource)
        
        if (hitResults.length > 0) {
          const hitPose = hitResults[0].getPose(referenceSpace)
          if (hitPose && placementIndicatorRef.current) {
            placementIndicatorRef.current.visible = true
            placementIndicatorRef.current.position.set(
              hitPose.transform.position.x,
              hitPose.transform.position.y,
              hitPose.transform.position.z
            )
          }
        } else if (placementIndicatorRef.current) {
          placementIndicatorRef.current.visible = false
        }
        
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
      }
      
      renderer.render(scene, camera)
      session.requestAnimationFrame(loop)
    }
    
    session.requestAnimationFrame(loop)
  }

  // 处理选择/放置
  const handleSelect = useCallback(() => {
    if (!isPlacing || !placementIndicatorRef.current || !placementIndicatorRef.current.visible) return
    
    const position = placementIndicatorRef.current.position.clone()
    
    const planeData = {
      id: `plane_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'floor',
      position: { 
        x: parseFloat(position.x.toFixed(3)), 
        y: parseFloat(position.y.toFixed(3)), 
        z: parseFloat(position.z.toFixed(3)) 
      },
      rotation: { x: -90, y: 0, z: 0 },
      size: { width: 2, height: 2 }
    }
    
    // 在场景中创建可视化平面
    if (sceneRef.current) {
      const geometry = new THREE.PlaneGeometry(planeData.size.width, planeData.size.height)
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.copy(position)
      mesh.rotation.x = THREE.MathUtils.degToRad(planeData.rotation.x)
      
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
      ctx.fillText(`${planes.length + 1}`, 64, 44)
      
      const texture = new THREE.CanvasTexture(canvas)
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture })
      const sprite = new THREE.Sprite(spriteMaterial)
      sprite.position.y = 0.6
      sprite.scale.set(0.8, 0.4, 1)
      mesh.add(sprite)
      
      sceneRef.current.add(mesh)
      planeData.mesh = mesh
    }
    
    const newPlanes = [...planes, planeData]
    setPlanes(newPlanes)
    planesRef.current = newPlanes
    setIsPlacing(false)
  }, [isPlacing, planes])

  // 监听select事件（点击屏幕）
  useEffect(() => {
    const session = sessionRef.current
    if (!session) return
    
    const onSelect = () => handleSelect()
    session.addEventListener('select', onSelect)
    
    return () => {
      session.removeEventListener('select', onSelect)
    }
  }, [handleSelect])

  // 删除最后一个平面
  const removeLastPlane = () => {
    if (planes.length === 0) return
    const lastPlane = planes[planes.length - 1]
    if (lastPlane.mesh && sceneRef.current) {
      sceneRef.current.remove(lastPlane.mesh)
    }
    const newPlanes = planes.slice(0, -1)
    setPlanes(newPlanes)
    planesRef.current = newPlanes
  }

  // 导出场景
  const exportScene = async () => {
    if (planes.length === 0) {
      setError('请先标记至少一个平面')
      return
    }
    
    try {
      const sceneData = {
        version: '2.0',
        type: 'webxr-ar-scene',
        name: sceneName || `WebXR场景_${planes.length}平面`,
        capturedAt: new Date().toISOString(),
        planes: planes.map(p => ({
          id: p.id,
          type: p.type,
          position: p.position,
          rotation: p.rotation,
          size: p.size
        })),
        camera: { fov: 75, position: { x: 0, y: 0, z: 0 } },
        webxrData: {
          referenceSpace: 'local-floor',
          features: ['hit-test', 'plane-detection']
        }
      }
      
      const zip = new JSZip()
      zip.file('manifest.json', JSON.stringify({
        version: '2.0',
        type: 'webxr-ar-scene-pack',
        createdAt: new Date().toISOString(),
        metadata: { name: sceneData.name, type: 'webxr-ar', planeCount: planes.length }
      }, null, 2))
      
      zip.file('scene.json', JSON.stringify(sceneData, null, 2))
      
      const content = await zip.generateAsync({ type: 'blob' })
      
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = `${sceneData.name.replace(/\s+/g, '_')}.webxrar`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      if (onSceneRecorded) onSceneRecorded(sceneData)
      
    } catch (err) {
      setError('导出失败: ' + err.message)
    }
  }

  // 结束会话
  const endSession = () => {
    if (sessionRef.current) {
      sessionRef.current.end()
      sessionRef.current = null
    }
    if (rendererRef.current) {
      rendererRef.current.dispose()
      rendererRef.current = null
    }
    setIsSessionActive(false)
    setPlanes([])
    planesRef.current = []
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
      <div id="ar-overlay" className={styles.arOverlay}>
        {/* 顶部栏 */}
        <div className={styles.topBar}>
          <button className={styles.closeBtn} onClick={handleClose}>✕</button>
          <div className={styles.info}>
            <span>平面: {planes.length}</span>
            <span>检测: {detectedPlanes}</span>
          </div>
          {!isSessionActive && (
            <button 
              className={styles.startBtn}
              onClick={startARSession}
              disabled={!isSupported}
            >
              启动AR
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
        
        {/* 使用说明 */}
        {showInstructions && isSessionActive && (
          <div className={styles.instructions}>
            <h3>📖 使用说明</h3>
            <ol>
              <li>移动手机扫描周围环境</li>
              <li>点击"添加平面"按钮</li>
              <li>将绿色圆圈对准地面</li>
              <li>点击屏幕放置平面</li>
              <li>完成后点击"导出"</li>
            </ol>
            <button onClick={() => setShowInstructions(false)}>我知道了</button>
          </div>
        )}
        
        {/* 放置模式提示 */}
        {isPlacing && (
          <div className={styles.placingTip}>
            对准地面，点击屏幕放置
          </div>
        )}
        
        {/* 底部控制面板 */}
        {isSessionActive && (
          <div className={styles.controlPanel}>
            <div className={styles.inputGroup}>
              <input
                type="text"
                value={sceneName}
                onChange={(e) => setSceneName(e.target.value)}
                placeholder="场景名称"
                className={styles.sceneInput}
              />
            </div>
            
            <div className={styles.actionButtons}>
              <button 
                className={`${styles.actionBtn} ${isPlacing ? styles.active : ''}`}
                onClick={() => setIsPlacing(!isPlacing)}
              >
                {isPlacing ? '✓ 点击放置' : '➕ 添加平面'}
              </button>
              
              <button 
                className={styles.actionBtn}
                onClick={removeLastPlane}
                disabled={planes.length === 0}
              >
                ➖ 删除
              </button>
              
              <button 
                className={`${styles.actionBtn} ${styles.export}`}
                onClick={exportScene}
                disabled={planes.length === 0}
              >
                💾 导出
              </button>
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

export default WebXRARSceneRecorder
