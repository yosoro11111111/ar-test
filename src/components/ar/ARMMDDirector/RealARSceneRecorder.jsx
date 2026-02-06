import React, { useState, useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import styles from './RealARSceneRecorder.module.css'
import JSZip from 'jszip'

/**
 * 真实AR场景录制组件
 * 
 * 功能：
 * 1. 摄像头背景显示
 * 2. 拍照捕获场景
 * 3. 手动标记3D平面位置
 * 4. 保存场景配置（图片+JSON）
 * 5. 打包导出.arscene2文件
 */

export function RealARSceneRecorder({
  isOpen,
  onClose,
  onSceneRecorded
}) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const planesRef = useRef([])
  
  const [stream, setStream] = useState(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [planes, setPlanes] = useState([])
  const [selectedPlane, setSelectedPlane] = useState(null)
  const [isPlacing, setIsPlacing] = useState(false)
  const [sceneName, setSceneName] = useState('')
  const [cameraFacing, setCameraFacing] = useState('environment')
  const [error, setError] = useState(null)
  const [step, setStep] = useState('camera') // camera -> capture -> mark -> export

  // 初始化摄像头
  const initCamera = useCallback(async () => {
    try {
      const constraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      
      setError(null)
    } catch (err) {
      console.error('摄像头访问失败:', err)
      setError('无法访问摄像头，请确保已授予权限并使用HTTPS')
    }
  }, [cameraFacing])

  // 停止摄像头
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }, [stream])

  // 组件挂载时启动摄像头
  useEffect(() => {
    if (isOpen) {
      initCamera()
    }
    return () => stopCamera()
  }, [isOpen, initCamera, stopCamera])

  // 拍照
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // 设置canvas尺寸为视频尺寸
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // 绘制视频帧
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // 转换为图片
    const imageData = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedImage(imageData)
    setStep('mark')
    
    // 停止摄像头
    stopCamera()
    
    // 初始化Three.js场景用于标记
    initThreeJS(canvas.width, canvas.height)
  }

  // 初始化Three.js
  const initThreeJS = (width, height) => {
    const container = containerRef.current
    if (!container) return
    
    // 场景
    const scene = new THREE.Scene()
    sceneRef.current = scene
    
    // 相机
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    camera.position.set(0, 0, 5)
    cameraRef.current = camera
    
    // 渲染器
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer
    
    // 灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(5, 10, 5)
    scene.add(dirLight)
    
    // 渲染循环
    const animate = () => {
      if (!rendererRef.current) return
      requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()
    
    // 点击事件监听
    renderer.domElement.addEventListener('click', handleCanvasClick)
  }

  // 处理画布点击 - 放置平面
  const handleCanvasClick = (event) => {
    if (!isPlacing || !cameraRef.current || !rendererRef.current) return
    
    const rect = rendererRef.current.domElement.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    // 射线检测
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current)
    
    // 在相机前方创建一个虚拟平面用于射线检测
    const planeGeometry = new THREE.PlaneGeometry(100, 100)
    const planeMaterial = new THREE.MeshBasicMaterial({ visible: false })
    const virtualPlane = new THREE.Mesh(planeGeometry, planeMaterial)
    virtualPlane.position.z = -3
    sceneRef.current.add(virtualPlane)
    
    const intersects = raycaster.intersectObject(virtualPlane)
    sceneRef.current.remove(virtualPlane)
    
    if (intersects.length > 0) {
      const point = intersects[0].point
      addPlane(point)
    }
  }

  // 添加平面
  const addPlane = (position) => {
    const planeId = `plane_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const planeData = {
      id: planeId,
      type: 'floor',
      position: { x: position.x, y: position.y, z: position.z },
      rotation: { x: -90, y: 0, z: 0 },
      size: { width: 2, height: 2 },
      screenPosition: { x: 0.5, y: 0.5 }
    }
    
    // 创建可视化平面
    const geometry = new THREE.PlaneGeometry(planeData.size.width, planeData.size.height)
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(planeData.position.x, planeData.position.y, planeData.position.z)
    mesh.rotation.x = THREE.MathUtils.degToRad(planeData.rotation.x)
    
    // 添加边框
    const edges = new THREE.EdgesGeometry(geometry)
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff88, linewidth: 3 })
    const wireframe = new THREE.LineSegments(edges, lineMaterial)
    mesh.add(wireframe)
    
    // 添加标签
    const labelDiv = document.createElement('div')
    labelDiv.className = styles.planeLabel
    labelDiv.textContent = `平面 ${planes.length + 1}`
    
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
    }
    
    const newPlanes = planes.filter(p => p.id !== planeId)
    setPlanes(newPlanes)
    planesRef.current = newPlanes
    setSelectedPlane(null)
  }

  // 更新平面大小
  const updatePlaneSize = (planeId, width, height) => {
    const plane = planes.find(p => p.id === planeId)
    if (!plane || !plane.mesh) return
    
    // 更新几何体
    plane.mesh.geometry.dispose()
    plane.mesh.geometry = new THREE.PlaneGeometry(width, height)
    
    // 更新边框
    plane.mesh.children[0].geometry.dispose()
    plane.mesh.children[0].geometry = new THREE.EdgesGeometry(plane.mesh.geometry)
    
    // 更新数据
    const newPlanes = planes.map(p => 
      p.id === planeId 
        ? { ...p, size: { width, height } }
        : p
    )
    setPlanes(newPlanes)
    planesRef.current = newPlanes
  }

  // 导出场景
  const exportScene = async () => {
    if (!capturedImage || planes.length === 0) {
      alert('请先拍照并标记至少一个平面')
      return
    }
    
    const sceneData = {
      version: '2.0',
      type: 'real-ar-scene',
      name: sceneName || '未命名场景',
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
        position: { x: 0, y: 0, z: 5 }
      }
    }
    
    // 创建ZIP包
    const zip = new JSZip()
    zip.file('manifest.json', JSON.stringify({
      version: '2.0',
      type: 'real-ar-scene-pack',
      createdAt: new Date().toISOString(),
      metadata: {
        name: sceneData.name,
        type: 'real-ar',
        planeCount: planes.length
      }
    }, null, 2))
    
    zip.file('scene.json', JSON.stringify(sceneData, null, 2))
    
    // 提取图片并保存
    const imageBase64 = capturedImage.split(',')[1]
    zip.file('scene.jpg', imageBase64, { base64: true })
    
    // 生成ZIP
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
    
    // 回调
    if (onSceneRecorded) {
      onSceneRecorded(sceneData)
    }
    
    setStep('export')
  }

  // 切换摄像头
  const switchCamera = () => {
    setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment')
    stopCamera()
    setTimeout(initCamera, 100)
  }

  // 清理
  useEffect(() => {
    return () => {
      stopCamera()
      if (rendererRef.current) {
        rendererRef.current.dispose()
        if (rendererRef.current.domElement.parentNode) {
          rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement)
        }
      }
    }
  }, [])

  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* 头部 */}
        <div className={styles.header}>
          <h2>📷 真实AR场景录制</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* 步骤指示器 */}
        <div className={styles.steps}>
          <div className={`${styles.step} ${step === 'camera' ? styles.active : ''}`}>
            <span className={styles.stepNumber}>1</span>
            <span>拍摄场景</span>
          </div>
          <div className={styles.stepLine} />
          <div className={`${styles.step} ${step === 'mark' ? styles.active : ''}`}>
            <span className={styles.stepNumber}>2</span>
            <span>标记平面</span>
          </div>
          <div className={styles.stepLine} />
          <div className={`${styles.step} ${step === 'export' ? styles.active : ''}`}>
            <span className={styles.stepNumber}>3</span>
            <span>导出</span>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {/* 主内容区 */}
        <div className={styles.content}>
          {/* 摄像头/图片显示区 */}
          <div className={styles.viewArea} ref={containerRef}>
            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  className={styles.video}
                  autoPlay
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </>
            ) : (
              <img 
                src={capturedImage} 
                alt="Captured scene" 
                className={styles.capturedImage}
              />
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
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 选中平面编辑 */}
            {selectedPlane && (
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
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className={styles.footer}>
          {!capturedImage ? (
            <div className={styles.cameraControls}>
              <button className={styles.switchBtn} onClick={switchCamera}>
                🔄 切换摄像头
              </button>
              <button className={styles.captureBtn} onClick={capturePhoto}>
                📷 拍照
              </button>
            </div>
          ) : (
            <div className={styles.markControls}>
              <button 
                className={`${styles.placeBtn} ${isPlacing ? styles.active : ''}`}
                onClick={() => setIsPlacing(!isPlacing)}
              >
                {isPlacing ? '✓ 点击画面放置' : '➕ 添加平面'}
              </button>
              <button className={styles.retakeBtn} onClick={() => {
                setCapturedImage(null)
                setPlanes([])
                planesRef.current = []
                setStep('camera')
                initCamera()
              }}>
                🔄 重拍
              </button>
              <button 
                className={styles.exportBtn}
                onClick={exportScene}
                disabled={planes.length === 0}
              >
                💾 导出场景
              </button>
            </div>
          )}
        </div>

        {/* 提示信息 */}
        {isPlacing && (
          <div className={styles.tip}>
            💡 点击画面放置平面，用于角色站立的位置
          </div>
        )}
      </div>
    </div>
  )
}

export default RealARSceneRecorder
