import React, { useState, useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import styles from './TrueARSceneRecorder.module.css'
import JSZip from 'jszip'

/**
 * 真实AR场景录制组件 - 手机简化版
 * 
 * 简化设计：
 * 1. 全屏摄像头画面
 * 2. 底部悬浮操作按钮
 * 3. 可折叠的控制面板
 * 4. 支持滑动操作
 */

export function TrueARSceneRecorder({
  isOpen,
  onClose,
  onSceneRecorded
}) {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const planesRef = useRef([])
  const animationFrameRef = useRef(null)
  const touchStartY = useRef(0)
  
  const [stream, setStream] = useState(null)
  const [planes, setPlanes] = useState([])
  const [isPlacing, setIsPlacing] = useState(false)
  const [sceneName, setSceneName] = useState('')
  const [cameraFacing, setCameraFacing] = useState('environment')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // 显示错误提示
  const showError = useCallback((message) => {
    setError(message)
    setTimeout(() => setError(null), 4000)
  }, [])

  // 初始化摄像头
  const initCamera = useCallback(async () => {
    if (!isOpen) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('浏览器不支持摄像头')
      }
      
      const constraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('启动超时')), 10000)
          videoRef.current.onloadedmetadata = () => {
            clearTimeout(timeout)
            resolve()
          }
        })
        
        await videoRef.current.play()
        setCameraReady(true)
      }
    } catch (err) {
      console.error('摄像头错误:', err)
      let errorMsg = '无法访问摄像头'
      if (err.name === 'NotAllowedError') errorMsg = '请允许摄像头权限'
      else if (err.name === 'NotFoundError') errorMsg = '未找到摄像头'
      else if (err.message) errorMsg = err.message
      showError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [cameraFacing, isOpen, showError])

  // 停止摄像头
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setCameraReady(false)
  }, [stream])

  useEffect(() => {
    if (isOpen) {
      initCamera()
    }
    return () => {
      stopCamera()
      cleanupThreeJS()
    }
  }, [isOpen, initCamera, stopCamera])

  // 初始化Three.js
  useEffect(() => {
    if (!cameraReady || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!container) return
    
    const width = container.clientWidth
    const height = container.clientHeight
    
    const scene = new THREE.Scene()
    sceneRef.current = scene
    
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    camera.position.set(0, 0, 0)
    cameraRef.current = camera
    
    const renderer = new THREE.WebGLRenderer({ 
      canvas,
      alpha: true, 
      antialias: true,
      preserveDrawingBuffer: true
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    rendererRef.current = renderer
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(0, 10, 10)
    scene.add(dirLight)
    
    // 参考平面
    const planeGeometry = new THREE.PlaneGeometry(100, 100)
    const planeMaterial = new THREE.MeshBasicMaterial({ visible: false })
    const referencePlane = new THREE.Mesh(planeGeometry, planeMaterial)
    referencePlane.position.z = -3
    referencePlane.name = 'referencePlane'
    scene.add(referencePlane)
    
    // 渲染循环 - 15fps节省电量
    let lastTime = 0
    const animate = (time) => {
      if (!rendererRef.current) return
      if (time - lastTime < 66) {
        animationFrameRef.current = requestAnimationFrame(animate)
        return
      }
      lastTime = time
      renderer.render(scene, camera)
      animationFrameRef.current = requestAnimationFrame(animate)
    }
    animate(0)
    
    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return
      const newWidth = container.clientWidth
      const newHeight = container.clientHeight
      cameraRef.current.aspect = newWidth / newHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(newWidth, newHeight)
    }
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [cameraReady])

  const cleanupThreeJS = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    planesRef.current.forEach(plane => {
      if (plane.mesh?.geometry) plane.mesh.geometry.dispose()
    })
    
    if (rendererRef.current) {
      rendererRef.current.dispose()
      rendererRef.current = null
    }
    
    sceneRef.current = null
    cameraRef.current = null
    planesRef.current = []
    setPlanes([])
  }

  // 点击放置平面
  const handleCanvasClick = (event) => {
    if (!isPlacing || !cameraRef.current || !sceneRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    const mouse = new THREE.Vector2(x, y)
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, cameraRef.current)
    
    const referencePlane = sceneRef.current.getObjectByName('referencePlane')
    if (!referencePlane) return
    
    const intersects = raycaster.intersectObject(referencePlane)
    
    if (intersects.length > 0) {
      addPlaneAtPosition(intersects[0].point)
    }
  }

  // 触摸放置平面
  const handleTouch = (e) => {
    if (!isPlacing || !cameraRef.current || !sceneRef.current) return
    e.preventDefault()
    
    const touch = e.touches[0] || e.changedTouches[0]
    const rect = canvasRef.current.getBoundingClientRect()
    const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((touch.clientY - rect.top) / rect.height) * 2 + 1
    
    const mouse = new THREE.Vector2(x, y)
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, cameraRef.current)
    
    const referencePlane = sceneRef.current.getObjectByName('referencePlane')
    if (!referencePlane) return
    
    const intersects = raycaster.intersectObject(referencePlane)
    
    if (intersects.length > 0) {
      addPlaneAtPosition(intersects[0].point)
    }
  }

  const addPlaneAtPosition = (position) => {
    if (!sceneRef.current) return
    
    const planeId = `plane_${Date.now()}`
    
    const planeData = {
      id: planeId,
      type: 'floor',
      position: { 
        x: parseFloat(position.x.toFixed(2)), 
        y: parseFloat(position.y.toFixed(2)), 
        z: parseFloat(position.z.toFixed(2)) 
      },
      rotation: { x: -90, y: 0, z: 0 },
      size: { width: 2, height: 2 }
    }
    
    // 创建平面
    const geometry = new THREE.PlaneGeometry(planeData.size.width, planeData.size.height)
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      depthTest: false
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(planeData.position.x, planeData.position.y, planeData.position.z)
    mesh.rotation.x = THREE.MathUtils.degToRad(planeData.rotation.x)
    mesh.renderOrder = 999
    
    // 边框
    const edges = new THREE.EdgesGeometry(geometry)
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff88, depthTest: false })
    const wireframe = new THREE.LineSegments(edges, lineMaterial)
    wireframe.renderOrder = 1000
    mesh.add(wireframe)
    
    // 标签
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
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthTest: false })
    const sprite = new THREE.Sprite(spriteMaterial)
    sprite.position.y = 0.6
    sprite.scale.set(0.8, 0.4, 1)
    sprite.renderOrder = 1001
    mesh.add(sprite)
    
    sceneRef.current.add(mesh)
    
    const newPlanes = [...planes, { ...planeData, mesh }]
    setPlanes(newPlanes)
    planesRef.current = newPlanes
    setIsPlacing(false)
  }

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

  // 切换摄像头
  const switchCamera = () => {
    setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment')
    stopCamera()
    cleanupThreeJS()
    setCameraReady(false)
    setTimeout(initCamera, 100)
  }

  // 导出场景
  const exportScene = async () => {
    if (planes.length === 0) {
      showError('请先标记平面')
      return
    }
    
    try {
      const video = videoRef.current
      if (!video?.videoWidth) {
        showError('摄像头未就绪')
        return
      }
      
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      const capturedImage = canvas.toDataURL('image/jpeg', 0.9)
      
      const sceneData = {
        version: '2.0',
        type: 'true-ar-scene',
        name: sceneName || `AR场景_${planes.length}平面`,
        capturedAt: new Date().toISOString(),
        image: capturedImage,
        planes: planes.map(p => ({
          id: p.id,
          type: p.type,
          position: p.position,
          rotation: p.rotation,
          size: p.size
        })),
        camera: { fov: 60, position: { x: 0, y: 0, z: 0 }, facing: cameraFacing },
        referenceDistance: 3
      }
      
      const zip = new JSZip()
      zip.file('manifest.json', JSON.stringify({
        version: '2.0',
        type: 'true-ar-scene-pack',
        createdAt: new Date().toISOString(),
        metadata: { name: sceneData.name, type: 'true-ar', planeCount: planes.length }
      }, null, 2))
      
      zip.file('scene.json', JSON.stringify(sceneData, null, 2))
      zip.file('scene.jpg', capturedImage.split(',')[1], { base64: true })
      
      const content = await zip.generateAsync({ type: 'blob' })
      
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = `${sceneData.name.replace(/\s+/g, '_')}.arscene2`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      if (onSceneRecorded) onSceneRecorded(sceneData)
      setShowPreview(true)
      
    } catch (err) {
      showError('导出失败: ' + err.message)
    }
  }

  // 重置
  const reset = () => {
    planes.forEach(p => {
      if (p.mesh && sceneRef.current) sceneRef.current.remove(p.mesh)
    })
    setPlanes([])
    planesRef.current = []
    setIsPlacing(false)
    setShowPreview(false)
  }

  // 处理滑动显示控制面板
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e) => {
    const touchY = e.touches[0].clientY
    const diff = touchStartY.current - touchY
    
    // 向上滑动超过50px显示控制面板
    if (diff > 50 && !showControls) {
      setShowControls(true)
    }
    // 向下滑动超过50px隐藏控制面板
    if (diff < -50 && showControls) {
      setShowControls(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      {/* 全屏AR视图 */}
      <div 
        className={styles.arContainer} 
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <video
          ref={videoRef}
          className={styles.video}
          autoPlay
          playsInline
          muted
        />
        
        {cameraReady && (
          <canvas
            ref={canvasRef}
            className={styles.arCanvas}
            onClick={handleCanvasClick}
            onTouchEnd={handleTouch}
          />
        )}
        
        {/* 加载中 */}
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner}></div>
            <p>启动摄像头...</p>
          </div>
        )}
        
        {/* 错误提示 */}
        {error && (
          <div className={styles.errorToast}>
            <span>{error}</span>
          </div>
        )}
        
        {/* 顶部信息栏 */}
        <div className={styles.topBar}>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
          <div className={styles.planeCount}>平面: {planes.length}</div>
          <button className={styles.switchBtn} onClick={switchCamera}>🔄</button>
        </div>
        
        {/* 放置模式提示 */}
        {isPlacing && (
          <div className={styles.placingTip}>
            点击画面放置平面
          </div>
        )}
        
        {/* 完成提示 */}
        {showPreview && (
          <div className={styles.successOverlay}>
            <div className={styles.successContent}>
              <h3>✅ 录制完成!</h3>
              <p>已保存 {planes.length} 个平面</p>
              <button onClick={() => setShowPreview(false)}>确定</button>
            </div>
          </div>
        )}
        
        {/* 滑动提示 */}
        {!showControls && !isPlacing && (
          <div className={styles.swipeHint}>
            ↑ 上滑打开控制面板
          </div>
        )}
      </div>
      
      {/* 底部控制面板 */}
      <div className={`${styles.controlPanel} ${showControls ? styles.show : ''}`}>
        <div className={styles.dragHandle} onClick={() => setShowControls(!showControls)}>
          <div className={styles.dragBar}></div>
        </div>
        
        {/* 场景名称 */}
        <div className={styles.inputGroup}>
          <input
            type="text"
            value={sceneName}
            onChange={(e) => setSceneName(e.target.value)}
            placeholder="场景名称"
            className={styles.sceneInput}
          />
        </div>
        
        {/* 操作按钮 */}
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
            ➖ 删除平面
          </button>
          
          <button 
            className={styles.actionBtn}
            onClick={reset}
          >
            🔄 重置
          </button>
          
          <button 
            className={`${styles.actionBtn} ${styles.export}`}
            onClick={exportScene}
            disabled={planes.length === 0}
          >
            💾 导出
          </button>
        </div>
        
        {/* 说明 */}
        <div className={styles.helpText}>
          点击下方按钮添加平面，点击画面放置
        </div>
      </div>
    </div>
  )
}

export default TrueARSceneRecorder
