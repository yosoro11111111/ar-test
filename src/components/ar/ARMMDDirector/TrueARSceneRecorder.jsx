import React, { useState, useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import styles from './TrueARSceneRecorder.module.css'
import JSZip from 'jszip'

/**
 * 真实AR场景录制组件
 * 
 * 功能：
 * 1. 使用摄像头作为AR背景
 * 2. 手动标记3D平面位置（点击放置）
 * 3. 实时预览3D平面在真实场景中的位置
 * 4. 录制场景数据（图片+平面位置+相机参数）
 * 5. 导出.arscene2文件
 * 
 * 技术方案：
 * - 摄像头画面作为背景
 * - Three.js渲染3D平面叠加在视频上
 * - 用户点击画面放置平面
 * - 记录平面相对于相机的3D位置
 */

export function TrueARSceneRecorder({
  isOpen,
  onClose,
  onSceneRecorded
}) {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const planesRef = useRef([])
  const raycasterRef = useRef(new THREE.Raycaster())
  const mouseRef = useRef(new THREE.Vector2())
  
  const [stream, setStream] = useState(null)
  const [planes, setPlanes] = useState([])
  const [selectedPlane, setSelectedPlane] = useState(null)
  const [isPlacing, setIsPlacing] = useState(false)
  const [sceneName, setSceneName] = useState('')
  const [cameraFacing, setCameraFacing] = useState('environment')
  const [error, setError] = useState(null)
  const [step, setStep] = useState('camera') // camera -> placing -> export
  const [isRecording, setIsRecording] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

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
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
          // 视频加载完成后初始化Three.js
          initThreeJS()
        }
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
    return () => {
      stopCamera()
      cleanupThreeJS()
    }
  }, [isOpen, initCamera, stopCamera])

  // 初始化Three.js
  const initThreeJS = () => {
    const container = containerRef.current
    const video = videoRef.current
    if (!container || !video) return
    
    // 获取视频尺寸
    const videoWidth = video.videoWidth || 1280
    const videoHeight = video.videoHeight || 720
    
    // 场景
    const scene = new THREE.Scene()
    sceneRef.current = scene
    
    // 相机 - 使用透视相机，FOV与摄像头匹配
    const camera = new THREE.PerspectiveCamera(60, videoWidth / videoHeight, 0.1, 1000)
    camera.position.set(0, 0, 0) // 相机在原点
    cameraRef.current = camera
    
    // 渲染器 - 透明背景
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      preserveDrawingBuffer: true
    })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0x000000, 0) // 透明背景
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer
    
    // 灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(0, 10, 10)
    scene.add(dirLight)
    
    // 创建一个不可见的参考平面，用于射线检测
    // 这个平面位于相机前方固定距离
    const planeGeometry = new THREE.PlaneGeometry(100, 100)
    const planeMaterial = new THREE.MeshBasicMaterial({ 
      visible: false,
      transparent: true,
      opacity: 0
    })
    const referencePlane = new THREE.Mesh(planeGeometry, planeMaterial)
    referencePlane.position.z = -3 // 默认在相机前方3米处
    referencePlane.name = 'referencePlane'
    scene.add(referencePlane)
    
    // 添加点击事件监听
    renderer.domElement.addEventListener('click', handleCanvasClick)
    renderer.domElement.style.cursor = 'crosshair'
    
    // 渲染循环
    const animate = () => {
      if (!rendererRef.current) return
      requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()
    
    // 处理窗口大小变化
    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return
      const width = container.clientWidth
      const height = container.clientHeight
      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(width, height)
    }
    window.addEventListener('resize', handleResize)
    
    setStep('placing')
  }

  // 清理Three.js
  const cleanupThreeJS = () => {
    if (rendererRef.current) {
      rendererRef.current.domElement.removeEventListener('click', handleCanvasClick)
      rendererRef.current.dispose()
      if (rendererRef.current.domElement.parentNode) {
        rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement)
      }
      rendererRef.current = null
    }
    sceneRef.current = null
    cameraRef.current = null
    planesRef.current = []
    setPlanes([])
  }

  // 处理画布点击 - 放置平面
  const handleCanvasClick = (event) => {
    if (!isPlacing || !cameraRef.current || !rendererRef.current || !sceneRef.current) return
    
    const rect = rendererRef.current.domElement.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    mouseRef.current.set(x, y)
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
    
    // 射线与参考平面相交
    const referencePlane = sceneRef.current.getObjectByName('referencePlane')
    if (!referencePlane) return
    
    const intersects = raycasterRef.current.intersectObject(referencePlane)
    
    if (intersects.length > 0) {
      const point = intersects[0].point
      addPlaneAtPosition(point)
    }
  }

  // 在指定位置添加平面
  const addPlaneAtPosition = (position) => {
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
      depthTest: false // 确保平面始终可见
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(planeData.position.x, planeData.position.y, planeData.position.z)
    mesh.rotation.x = THREE.MathUtils.degToRad(planeData.rotation.x)
    mesh.renderOrder = 999 // 确保在最上层
    
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
    
    // 添加中心点标记
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
    
    console.log('添加平面:', planeData)
  }

  // 删除平面
  const removePlane = (planeId) => {
    const plane = planes.find(p => p.id === planeId)
    if (plane && plane.mesh && sceneRef.current) {
      sceneRef.current.remove(plane.mesh)
    }
    
    const newPlanes = planes.filter(p => p.id !== planeId)
    // 重新编号
    newPlanes.forEach((p, index) => {
      if (p.mesh) {
        const sprite = p.mesh.children.find(c => c.type === 'Sprite')
        if (sprite) {
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
    
    // 更新几何体
    plane.mesh.geometry.dispose()
    plane.mesh.geometry = new THREE.PlaneGeometry(width, height)
    
    // 更新边框
    const wireframe = plane.mesh.children.find(c => c.type === 'LineSegments')
    if (wireframe) {
      wireframe.geometry.dispose()
      wireframe.geometry = new THREE.EdgesGeometry(plane.mesh.geometry)
    }
    
    // 更新数据
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

  // 开始录制
  const startRecording = () => {
    setIsRecording(true)
    setShowPreview(false)
    console.log('开始AR场景录制')
  }

  // 停止录制并导出
  const stopRecordingAndExport = async () => {
    if (planes.length === 0) {
      alert('请至少标记一个平面')
      return
    }
    
    setIsRecording(false)
    
    // 捕获当前画面
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // 将3D平面也绘制到图片上（可选）
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current)
      ctx.drawImage(rendererRef.current.domElement, 0, 0, canvas.width, canvas.height)
    }
    
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
      referenceDistance: 3 // 参考平面距离
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
    
    // 保存图片
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
    setShowPreview(true)
    
    console.log('AR场景录制完成:', sceneData)
  }

  // 切换摄像头
  const switchCamera = () => {
    setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment')
    stopCamera()
    cleanupThreeJS()
    setTimeout(() => {
      initCamera()
    }, 100)
  }

  // 重置
  const reset = () => {
    // 清除所有平面
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
          <h2>🎬 真实AR场景录制</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* 步骤指示器 */}
        <div className={styles.steps}>
          <div className={`${styles.step} ${step === 'camera' || step === 'placing' ? styles.active : ''}`}>
            <span className={styles.stepNumber}>1</span>
            <span>AR拍摄</span>
          </div>
          <div className={styles.stepLine} />
          <div className={`${styles.step} ${step === 'export' ? styles.active : ''}`}>
            <span className={styles.stepNumber}>2</span>
            <span>导出完成</span>
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
          {/* AR视图区 */}
          <div className={styles.arViewArea} ref={containerRef}>
            <video
              ref={videoRef}
              className={styles.video}
              autoPlay
              playsInline
              muted
            />
            {step === 'export' && showPreview && (
              <div className={styles.previewOverlay}>
                <div className={styles.previewContent}>
                  <h3>✅ 场景录制完成！</h3>
                  <p>已导出 {sceneName || 'AR场景'}.arscene2</p>
                  <p>包含 {planes.length} 个平面标记</p>
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
                        <label>距离(Z)</label>
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

            {/* 说明 */}
            <div className={styles.instructions}>
              <h4>📖 使用说明</h4>
              <ol>
                <li>确保摄像头对准要录制的场景</li>
                <li>点击"添加平面"按钮</li>
                <li>在画面上点击放置平面</li>
                <li>调整平面大小和位置</li>
                <li>点击"录制并导出"保存</li>
              </ol>
            </div>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className={styles.footer}>
          {step !== 'export' ? (
            <div className={styles.actionControls}>
              <button className={styles.switchBtn} onClick={switchCamera}>
                🔄 切换摄像头
              </button>
              <button 
                className={`${styles.placeBtn} ${isPlacing ? styles.active : ''}`}
                onClick={() => setIsPlacing(!isPlacing)}
              >
                {isPlacing ? '✓ 点击画面放置' : '➕ 添加平面'}
              </button>
              <button className={styles.resetBtn} onClick={reset}>
                🔄 重置
              </button>
              <button 
                className={styles.exportBtn}
                onClick={stopRecordingAndExport}
                disabled={planes.length === 0}
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
            💡 点击画面放置平面，用于确定角色在AR场景中的位置
          </div>
        )}
      </div>
    </div>
  )
}

export default TrueARSceneRecorder
