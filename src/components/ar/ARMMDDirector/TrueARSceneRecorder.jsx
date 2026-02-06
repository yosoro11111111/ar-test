import React, { useState, useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import styles from './TrueARSceneRecorder.module.css'
import JSZip from 'jszip'

/**
 * 真实AR场景录制组件 - 修复版
 * 
 * 修复内容：
 * 1. 修复画面闪烁问题 - 使用CSS叠加而不是Canvas叠加
 * 2. 添加完整的错误提示
 * 3. 优化移动端适配
 * 4. 修复黑屏问题
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
  
  const [stream, setStream] = useState(null)
  const [planes, setPlanes] = useState([])
  const [selectedPlane, setSelectedPlane] = useState(null)
  const [isPlacing, setIsPlacing] = useState(false)
  const [sceneName, setSceneName] = useState('')
  const [cameraFacing, setCameraFacing] = useState('environment')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState('init') // init -> camera -> placing -> export
  const [showPreview, setShowPreview] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)

  // 显示错误提示
  const showError = useCallback((message) => {
    setError(message)
    // 3秒后自动清除错误
    setTimeout(() => setError(null), 5000)
  }, [])

  // 初始化摄像头
  const initCamera = useCallback(async () => {
    if (!isOpen) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('您的浏览器不支持摄像头访问，请使用Chrome、Safari或Edge浏览器')
      }
      
      // 检查是否HTTPS或localhost
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        throw new Error('摄像头功能需要在HTTPS环境下运行')
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
        
        // 等待视频准备就绪
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('摄像头启动超时，请检查权限设置'))
          }, 10000)
          
          videoRef.current.onloadedmetadata = () => {
            clearTimeout(timeout)
            resolve()
          }
          
          videoRef.current.onerror = () => {
            clearTimeout(timeout)
            reject(new Error('视频加载失败'))
          }
        })
        
        await videoRef.current.play()
        setCameraReady(true)
        setStep('placing')
      }
    } catch (err) {
      console.error('摄像头访问失败:', err)
      let errorMsg = '无法访问摄像头'
      
      if (err.name === 'NotAllowedError') {
        errorMsg = '摄像头权限被拒绝，请在浏览器设置中允许摄像头访问'
      } else if (err.name === 'NotFoundError') {
        errorMsg = '未找到摄像头设备'
      } else if (err.name === 'NotReadableError') {
        errorMsg = '摄像头被其他应用占用'
      } else if (err.message) {
        errorMsg = err.message
      }
      
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

  // 组件挂载时启动摄像头
  useEffect(() => {
    if (isOpen) {
      setStep('init')
      initCamera()
    }
    return () => {
      stopCamera()
      cleanupThreeJS()
    }
  }, [isOpen, initCamera, stopCamera])

  // 初始化Three.js - 在视频上方叠加3D内容
  useEffect(() => {
    if (!cameraReady || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!container) return
    
    // 获取容器尺寸
    const width = container.clientWidth
    const height = container.clientHeight
    
    // 场景
    const scene = new THREE.Scene()
    sceneRef.current = scene
    
    // 相机
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    camera.position.set(0, 0, 0)
    cameraRef.current = camera
    
    // 渲染器 - 透明背景，叠加在视频上
    const renderer = new THREE.WebGLRenderer({ 
      canvas,
      alpha: true, 
      antialias: true,
      preserveDrawingBuffer: true
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // 限制像素比以提高性能
    renderer.setClearColor(0x000000, 0)
    rendererRef.current = renderer
    
    // 灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(0, 10, 10)
    scene.add(dirLight)
    
    // 创建参考平面
    const planeGeometry = new THREE.PlaneGeometry(100, 100)
    const planeMaterial = new THREE.MeshBasicMaterial({ 
      visible: false,
      transparent: true,
      opacity: 0
    })
    const referencePlane = new THREE.Mesh(planeGeometry, planeMaterial)
    referencePlane.position.z = -3
    referencePlane.name = 'referencePlane'
    scene.add(referencePlane)
    
    // 渲染循环
    let lastTime = 0
    const animate = (time) => {
      if (!rendererRef.current) return
      
      // 限制帧率为30fps以节省电量
      if (time - lastTime < 33) {
        animationFrameRef.current = requestAnimationFrame(animate)
        return
      }
      lastTime = time
      
      renderer.render(scene, camera)
      animationFrameRef.current = requestAnimationFrame(animate)
    }
    animate(0)
    
    // 处理窗口大小变化
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

  // 清理Three.js
  const cleanupThreeJS = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    // 清理所有平面
    planesRef.current.forEach(plane => {
      if (plane.mesh && plane.mesh.geometry) {
        plane.mesh.geometry.dispose()
        if (plane.mesh.material) {
          if (Array.isArray(plane.mesh.material)) {
            plane.mesh.material.forEach(m => m.dispose())
          } else {
            plane.mesh.material.dispose()
          }
        }
      }
    })
    
    if (rendererRef.current) {
      rendererRef.current.dispose()
      rendererRef.current = null
    }
    
    sceneRef.current = null
    cameraRef.current = null
    planesRef.current = []
    setPlanes([])
    setSelectedPlane(null)
  }

  // 处理画布点击 - 放置平面
  const handleCanvasClick = (event) => {
    if (!isPlacing || !cameraRef.current || !rendererRef.current || !sceneRef.current) return
    
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
      const point = intersects[0].point
      addPlaneAtPosition(point)
    }
  }

  // 在指定位置添加平面
  const addPlaneAtPosition = (position) => {
    if (!sceneRef.current) return
    
    const planeId = `plane_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const planeData = {
      id: planeId,
      type: 'floor',
      position: { 
        x: parseFloat(position.x.toFixed(3)), 
        y: parseFloat(position.y.toFixed(3)), 
        z: parseFloat(position.z.toFixed(3)) 
      },
      rotation: { x: -90, y: 0, z: 0 },
      size: { width: 2, height: 2 }
    }
    
    // 创建可视化平面
    const geometry = new THREE.PlaneGeometry(planeData.size.width, planeData.size.height)
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      depthTest: false
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(planeData.position.x, planeData.position.y, planeData.position.z)
    mesh.rotation.x = THREE.MathUtils.degToRad(planeData.rotation.x)
    mesh.renderOrder = 999
    
    // 添加边框
    const edges = new THREE.EdgesGeometry(geometry)
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x00ff88, 
      linewidth: 3,
      depthTest: false
    })
    const wireframe = new THREE.LineSegments(edges, lineMaterial)
    wireframe.renderOrder = 1000
    mesh.add(wireframe)
    
    // 添加中心点
    const dotGeometry = new THREE.SphereGeometry(0.05, 16, 16)
    const dotMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      depthTest: false
    })
    const dot = new THREE.Mesh(dotGeometry, dotMaterial)
    dot.renderOrder = 1001
    mesh.add(dot)
    
    // 添加序号标签
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.width = 128
    canvas.height = 64
    context.fillStyle = 'rgba(0, 255, 136, 0.9)'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = '#000'
    context.font = 'bold 32px Arial'
    context.textAlign = 'center'
    context.fillText(`${planes.length + 1}`, canvas.width / 2, 44)
    
    const texture = new THREE.CanvasTexture(canvas)
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: texture,
      depthTest: false
    })
    const sprite = new THREE.Sprite(spriteMaterial)
    sprite.position.y = 0.5
    sprite.scale.set(0.8, 0.4, 1)
    sprite.renderOrder = 1002
    mesh.add(sprite)
    
    sceneRef.current.add(mesh)
    
    const newPlanes = [...planes, { ...planeData, mesh }]
    setPlanes(newPlanes)
    planesRef.current = newPlanes
    setIsPlacing(false)
  }

  // 删除平面
  const removePlane = (planeId) => {
    const plane = planes.find(p => p.id === planeId)
    if (plane && plane.mesh && sceneRef.current) {
      sceneRef.current.remove(plane.mesh)
      // 清理资源
      if (plane.mesh.geometry) plane.mesh.geometry.dispose()
      if (plane.mesh.material) {
        if (Array.isArray(plane.mesh.material)) {
          plane.mesh.material.forEach(m => m.dispose())
        } else {
          plane.mesh.material.dispose()
        }
      }
    }
    
    const newPlanes = planes.filter(p => p.id !== planeId)
    // 重新编号
    newPlanes.forEach((p, index) => {
      if (p.mesh) {
        const sprite = p.mesh.children.find(c => c.type === 'Sprite')
        if (sprite && sprite.material.map) {
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          canvas.width = 128
          canvas.height = 64
          context.fillStyle = 'rgba(0, 255, 136, 0.9)'
          context.fillRect(0, 0, canvas.width, canvas.height)
          context.fillStyle = '#000'
          context.font = 'bold 32px Arial'
          context.textAlign = 'center'
          context.fillText(`${index + 1}`, canvas.width / 2, 44)
          
          const texture = new THREE.CanvasTexture(canvas)
          sprite.material.map.dispose()
          sprite.material.map = texture
          sprite.material.needsUpdate = true
        }
      }
    })
    
    setPlanes(newPlanes)
    planesRef.current = newPlanes
    setSelectedPlane(null)
  }

  // 更新平面大小
  const updatePlaneSize = (planeId, width, height) => {
    const plane = planes.find(p => p.id === planeId)
    if (!plane || !plane.mesh) return
    
    plane.mesh.geometry.dispose()
    plane.mesh.geometry = new THREE.PlaneGeometry(width, height)
    
    const wireframe = plane.mesh.children.find(c => c.type === 'LineSegments')
    if (wireframe) {
      wireframe.geometry.dispose()
      wireframe.geometry = new THREE.EdgesGeometry(plane.mesh.geometry)
    }
    
    const newPlanes = planes.map(p => 
      p.id === planeId 
        ? { ...p, size: { width, height } }
        : p
    )
    setPlanes(newPlanes)
    planesRef.current = newPlanes
  }

  // 更新平面位置
  const updatePlanePosition = (planeId, axis, value) => {
    const plane = planes.find(p => p.id === planeId)
    if (!plane || !plane.mesh) return
    
    const newPosition = { ...plane.position, [axis]: parseFloat(value) }
    plane.mesh.position.set(newPosition.x, newPosition.y, newPosition.z)
    
    const newPlanes = planes.map(p => 
      p.id === planeId 
        ? { ...p, position: newPosition }
        : p
    )
    setPlanes(newPlanes)
    planesRef.current = newPlanes
  }

  // 录制并导出
  const stopRecordingAndExport = async () => {
    if (planes.length === 0) {
      showError('请至少标记一个平面')
      return
    }
    
    try {
      const video = videoRef.current
      if (!video || !video.videoWidth) {
        showError('摄像头未准备好')
        return
      }
      
      // 捕获当前画面
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      const capturedImage = canvas.toDataURL('image/jpeg', 0.9)
      
      // 准备场景数据
      const sceneData = {
        version: '2.0',
        type: 'true-ar-scene',
        name: sceneName || `AR场景_${new Date().toLocaleString()}`,
        capturedAt: new Date().toISOString(),
        image: capturedImage,
        planes: planes.map(p => ({
          id: p.id,
          type: p.type,
          position: p.position,
          rotation: p.rotation,
          size: p.size
        })),
        camera: {
          fov: 60,
          position: { x: 0, y: 0, z: 0 },
          facing: cameraFacing
        },
        referenceDistance: 3
      }
      
      // 创建ZIP包
      const zip = new JSZip()
      zip.file('manifest.json', JSON.stringify({
        version: '2.0',
        type: 'true-ar-scene-pack',
        createdAt: new Date().toISOString(),
        metadata: {
          name: sceneData.name,
          type: 'true-ar',
          planeCount: planes.length
        }
      }, null, 2))
      
      zip.file('scene.json', JSON.stringify(sceneData, null, 2))
      
      const imageBase64 = capturedImage.split(',')[1]
      zip.file('scene.jpg', imageBase64, { base64: true })
      
      const content = await zip.generateAsync({ type: 'blob' })
      
      // 下载
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = `${sceneData.name.replace(/\s+/g, '_')}.arscene2`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      if (onSceneRecorded) {
        onSceneRecorded(sceneData)
      }
      
      setStep('export')
      setShowPreview(true)
      
    } catch (err) {
      console.error('导出失败:', err)
      showError('导出失败: ' + err.message)
    }
  }

  // 切换摄像头
  const switchCamera = () => {
    setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment')
    stopCamera()
    cleanupThreeJS()
    setCameraReady(false)
    setStep('init')
    setTimeout(() => {
      initCamera()
    }, 100)
  }

  // 重置
  const reset = () => {
    planes.forEach(p => {
      if (p.mesh && sceneRef.current) {
        sceneRef.current.remove(p.mesh)
      }
    })
    setPlanes([])
    planesRef.current = []
    setSelectedPlane(null)
    setIsPlacing(false)
    setStep('placing')
    setShowPreview(false)
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* 头部 */}
        <div className={styles.header}>
          <h2>🎬 AR场景录制</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className={styles.errorBanner}>
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* 主内容区 */}
        <div className={styles.content}>
          {/* AR视图区 - 视频+Canvas叠加 */}
          <div className={styles.arViewArea} ref={containerRef}>
            {/* 视频层 */}
            <video
              ref={videoRef}
              className={styles.video}
              autoPlay
              playsInline
              muted
              onClick={handleCanvasClick}
            />
            
            {/* Three.js Canvas叠加层 */}
            {cameraReady && (
              <canvas
                ref={canvasRef}
                className={styles.arCanvas}
                onClick={handleCanvasClick}
              />
            )}
            
            {/* 加载中 */}
            {isLoading && (
              <div className={styles.loadingOverlay}>
                <div className={styles.spinner}></div>
                <p>正在启动摄像头...</p>
              </div>
            )}
            
            {/* 完成预览 */}
            {step === 'export' && showPreview && (
              <div className={styles.previewOverlay}>
                <div className={styles.previewContent}>
                  <h3>✅ 录制完成！</h3>
                  <p>已导出: {(sceneName || 'AR场景').replace(/\s+/g, '_')}.arscene2</p>
                  <p>包含 {planes.length} 个平面</p>
                </div>
              </div>
            )}
          </div>

          {/* 控制面板 */}
          <div className={styles.controls}>
            {/* 场景名称 */}
            <div className={styles.formGroup}>
              <label>场景名称</label>
              <input
                type="text"
                value={sceneName}
                onChange={(e) => setSceneName(e.target.value)}
                placeholder="输入场景名称"
                className={styles.input}
                disabled={step === 'export'}
              />
            </div>

            {/* 平面列表 */}
            {planes.length > 0 && (
              <div className={styles.planeList}>
                <h4>已标记平面 ({planes.length})</h4>
                {planes.map((plane, index) => (
                  <div 
                    key={plane.id}
                    className={`${styles.planeItem} ${selectedPlane === plane.id ? styles.selected : ''}`}
                    onClick={() => setSelectedPlane(plane.id)}
                  >
                    <span>平面 {index + 1}</span>
                    <button 
                      className={styles.deleteBtn}
                      onClick={(e) => {
                        e.stopPropagation()
                        removePlane(plane.id)
                      }}
                      disabled={step === 'export'}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 选中平面编辑 */}
            {selectedPlane && step !== 'export' && (
              <div className={styles.planeEditor}>
                <h4>编辑平面</h4>
                {(() => {
                  const plane = planes.find(p => p.id === selectedPlane)
                  if (!plane) return null
                  return (
                    <>
                      <div className={styles.formRow}>
                        <label>宽度</label>
                        <input
                          type="number"
                          value={plane.size.width}
                          onChange={(e) => updatePlaneSize(plane.id, parseFloat(e.target.value), plane.size.height)}
                          step="0.1"
                          min="0.1"
                          className={styles.numberInput}
                        />
                      </div>
                      <div className={styles.formRow}>
                        <label>高度</label>
                        <input
                          type="number"
                          value={plane.size.height}
                          onChange={(e) => updatePlaneSize(plane.id, plane.size.width, parseFloat(e.target.value))}
                          step="0.1"
                          min="0.1"
                          className={styles.numberInput}
                        />
                      </div>
                      <div className={styles.formRow}>
                        <label>距离</label>
                        <input
                          type="number"
                          value={plane.position.z}
                          onChange={(e) => updatePlanePosition(plane.id, 'z', e.target.value)}
                          step="0.1"
                          className={styles.numberInput}
                        />
                      </div>
                    </>
                  )
                })()}
              </div>
            )}

            {/* 使用说明 */}
            <div className={styles.instructions}>
              <h4>📖 使用说明</h4>
              <ol>
                <li>确保摄像头对准场景</li>
                <li>点击"添加平面"</li>
                <li>点击画面放置平面</li>
                <li>调整大小和位置</li>
                <li>点击"录制并导出"</li>
              </ol>
            </div>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className={styles.footer}>
          {step !== 'export' ? (
            <div className={styles.actionControls}>
              <button 
                className={styles.switchBtn} 
                onClick={switchCamera}
                disabled={isLoading}
              >
                🔄 切换摄像头
              </button>
              <button 
                className={`${styles.placeBtn} ${isPlacing ? styles.active : ''}`}
                onClick={() => setIsPlacing(!isPlacing)}
                disabled={!cameraReady || isLoading}
              >
                {isPlacing ? '✓ 点击放置' : '➕ 添加平面'}
              </button>
              <button 
                className={styles.resetBtn} 
                onClick={reset}
                disabled={isLoading}
              >
                🔄 重置
              </button>
              <button 
                className={styles.exportBtn}
                onClick={stopRecordingAndExport}
                disabled={!cameraReady || planes.length === 0 || isLoading}
              >
                🎬 录制并导出
              </button>
            </div>
          ) : (
            <div className={styles.exportControls}>
              <button className={styles.newBtn} onClick={reset}>
                🎬 录制新场景
              </button>
              <button className={styles.closeBtn2} onClick={onClose}>
                关闭
              </button>
            </div>
          )}
        </div>

        {/* 提示信息 */}
        {isPlacing && (
          <div className={styles.tip}>
            💡 点击画面放置平面
          </div>
        )}
      </div>
    </div>
  )
}

export default TrueARSceneRecorder
