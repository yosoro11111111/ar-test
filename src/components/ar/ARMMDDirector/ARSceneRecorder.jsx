import React, { useState, useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import styles from './ARSceneRecorder.module.css'
import { getARRecorder } from './ARRecorder'

/**
 * AR场景录制组件
 * 
 * 功能：
 * 1. 启动AR会话（WebXR）
 * 2. 多平面检测和可视化
 * 3. 录制AR场景（平面数据、相机位姿）
 * 4. 回放AR场景
 * 5. 导出/导入AR场景文件
 */

export function ARSceneRecorder({ 
  isOpen, 
  onClose, 
  onSceneRecorded,
  existingScene = null 
}) {
  const canvasRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const arRecorderRef = useRef(null)
  const planeMeshesRef = useRef(new Map())
  
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [detectedPlanes, setDetectedPlanes] = useState([])
  const [arSupported, setArSupported] = useState(false)
  const [error, setError] = useState(null)
  
  // 初始化AR录制器
  useEffect(() => {
    arRecorderRef.current = getARRecorder()
    
    // 检查AR支持
    checkARSupport()
    
    return () => {
      if (arRecorderRef.current) {
        arRecorderRef.current.dispose()
      }
    }
  }, [])
  
  // 检查WebXR支持
  const checkARSupport = async () => {
    if (!navigator.xr) {
      setError('您的浏览器不支持WebXR')
      return
    }
    
    try {
      const supported = await navigator.xr.isSessionSupported('immersive-ar')
      setArSupported(supported)
      if (!supported) {
        setError('您的设备不支持AR功能')
      }
    } catch (e) {
      setError('无法检测AR支持: ' + e.message)
    }
  }
  
  // 初始化Three.js场景
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    
    // 创建场景
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    sceneRef.current = scene
    
    // 创建相机
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    camera.position.set(0, 1.6, 3)
    cameraRef.current = camera
    
    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true,
      alpha: true 
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    rendererRef.current = renderer
    
    // 添加灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(5, 10, 5)
    scene.add(dirLight)
    
    // 添加网格地面
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
    scene.add(gridHelper)
    
    // 动画循环
    let animationId
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      
      // 更新录制时间
      if (isRecording && arRecorderRef.current) {
        const elapsed = (performance.now() - arRecorderRef.current.startTime) / 1000
        setRecordingTime(elapsed)
        
        // 记录相机位姿
        arRecorderRef.current.recordCameraPose(
          camera.position,
          camera.quaternion
        )
      }
      
      // 更新回放
      if (isPlaying && arRecorderRef.current?.recordedData) {
        const elapsed = (performance.now() - arRecorderRef.current.playbackStartTime) / 1000
        setPlaybackTime(elapsed)
      }
      
      renderer.render(scene, camera)
    }
    animate()
    
    // 处理窗口大小变化
    const handleResize = () => {
      if (!canvasRef.current || !cameraRef.current || !rendererRef.current) return
      const newWidth = canvasRef.current.clientWidth
      const newHeight = canvasRef.current.clientHeight
      cameraRef.current.aspect = newWidth / newHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(newWidth, newHeight)
    }
    window.addEventListener('resize', handleResize)
    
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
    }
  }, [isOpen, isRecording, isPlaying])
  
  // 模拟平面检测（在没有WebXR的设备上）
  const simulatePlaneDetection = useCallback(() => {
    if (!sceneRef.current) return
    
    // 创建几个模拟平面
    const mockPlanes = [
      { id: 'plane_1', center: { x: 0, y: 0, z: 0 }, normal: { x: 0, y: 1, z: 0 }, size: { width: 2, height: 2 } },
      { id: 'plane_2', center: { x: 2, y: 0.5, z: -1 }, normal: { x: 0, y: 1, z: 0 }, size: { width: 1.5, height: 1.5 } },
      { id: 'plane_3', center: { x: -1.5, y: -0.3, z: 1 }, normal: { x: 0, y: 1, z: 0 }, size: { width: 1, height: 1 } }
    ]
    
    mockPlanes.forEach(planeData => {
      addPlaneVisual(planeData)
      
      if (arRecorderRef.current?.isRecording) {
        arRecorderRef.current.recordPlaneEvent('planeDetected', planeData)
      }
    })
    
    setDetectedPlanes(mockPlanes)
  }, [])
  
  // 添加平面可视化
  const addPlaneVisual = (planeData) => {
    if (!sceneRef.current || planeMeshesRef.current.has(planeData.id)) return
    
    const geometry = new THREE.PlaneGeometry(planeData.size.width, planeData.size.height)
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(planeData.center.x, planeData.center.y, planeData.center.z)
    
    // 根据法向量旋转
    const normal = new THREE.Vector3(planeData.normal.x, planeData.normal.y, planeData.normal.z)
    const up = new THREE.Vector3(0, 1, 0)
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal)
    mesh.setRotationFromQuaternion(quaternion)
    
    // 添加边框
    const edges = new THREE.EdgesGeometry(geometry)
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff88, linewidth: 2 })
    const wireframe = new THREE.LineSegments(edges, lineMaterial)
    mesh.add(wireframe)
    
    // 添加标签
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.width = 256
    canvas.height = 64
    context.fillStyle = 'rgba(0, 255, 136, 0.8)'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = '#000'
    context.font = 'bold 24px Arial'
    context.textAlign = 'center'
    context.fillText(planeData.id, canvas.width / 2, 40)
    
    const texture = new THREE.CanvasTexture(canvas)
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture })
    const sprite = new THREE.Sprite(spriteMaterial)
    sprite.position.y = 0.3
    sprite.scale.set(1, 0.25, 1)
    mesh.add(sprite)
    
    sceneRef.current.add(mesh)
    planeMeshesRef.current.set(planeData.id, mesh)
  }
  
  // 开始录制
  const startRecording = () => {
    if (!arRecorderRef.current) return
    
    // 清除之前的平面
    planeMeshesRef.current.forEach(mesh => {
      sceneRef.current?.remove(mesh)
    })
    planeMeshesRef.current.clear()
    setDetectedPlanes([])
    
    arRecorderRef.current.startRecording()
    setIsRecording(true)
    setRecordingTime(0)
    
    // 模拟平面检测
    setTimeout(() => {
      simulatePlaneDetection()
    }, 1000)
  }
  
  // 停止录制
  const stopRecording = () => {
    if (!arRecorderRef.current) return
    
    const recordedData = arRecorderRef.current.stopRecording()
    setIsRecording(false)
    
    if (recordedData && onSceneRecorded) {
      onSceneRecorded(recordedData)
    }
  }
  
  // 开始回放
  const startPlayback = () => {
    if (!arRecorderRef.current?.recordedData) return
    
    // 清除平面
    planeMeshesRef.current.forEach(mesh => {
      sceneRef.current?.remove(mesh)
    })
    planeMeshesRef.current.clear()
    
    arRecorderRef.current.startPlayback(
      arRecorderRef.current.recordedData,
      (update) => {
        // 更新相机位置
        if (update.cameraPose && cameraRef.current) {
          cameraRef.current.position.copy(update.cameraPose.position)
          cameraRef.current.quaternion.copy(update.cameraPose.quaternion)
        }
        
        // 更新平面
        update.planes.forEach(plane => {
          if (!planeMeshesRef.current.has(plane.id)) {
            addPlaneVisual(plane)
          }
        })
        
        // 移除不再活跃的平面
        planeMeshesRef.current.forEach((mesh, id) => {
          if (!update.planes.find(p => p.id === id)) {
            sceneRef.current?.remove(mesh)
            planeMeshesRef.current.delete(id)
          }
        })
        
        setDetectedPlanes(update.planes)
      }
    )
    
    setIsPlaying(true)
    setPlaybackTime(0)
  }
  
  // 停止回放
  const stopPlayback = () => {
    if (!arRecorderRef.current) return
    
    arRecorderRef.current.stopPlayback()
    setIsPlaying(false)
  }
  
  // 导出AR场景
  const exportARScene = () => {
    if (!arRecorderRef.current?.recordedData) {
      alert('没有可导出的AR场景')
      return
    }
    
    try {
      const { blob, filename } = arRecorderRef.current.exportARScene()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('导出失败: ' + error.message)
    }
  }
  
  // 导入AR场景
  const importARScene = async (file) => {
    if (!arRecorderRef.current) return
    
    try {
      await arRecorderRef.current.importARScene(file)
      alert('AR场景导入成功！')
    } catch (error) {
      alert('导入失败: ' + error.message)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>🎥 AR场景录制</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        
        <div className={styles.content}>
          {/* AR预览区域 */}
          <div className={styles.previewArea}>
            <canvas ref={canvasRef} className={styles.arCanvas} />
            
            {/* 状态覆盖层 */}
            <div className={styles.statusOverlay}>
              {isRecording && (
                <div className={styles.recordingIndicator}>
                  <span className={styles.recordingDot} />
                  录制中 {recordingTime.toFixed(1)}s
                </div>
              )}
              {isPlaying && (
                <div className={styles.playbackIndicator}>
                  回放中 {playbackTime.toFixed(1)}s
                </div>
              )}
              <div className={styles.planeCount}>
                检测到 {detectedPlanes.length} 个平面
              </div>
            </div>
          </div>
          
          {/* 控制面板 */}
          <div className={styles.controls}>
            {/* 录制控制 */}
            <div className={styles.controlSection}>
              <h3>录制控制</h3>
              <div className={styles.buttonGroup}>
                {!isRecording ? (
                  <button 
                    className={styles.recordBtn}
                    onClick={startRecording}
                    disabled={!arSupported}
                  >
                    🔴 开始录制
                  </button>
                ) : (
                  <button 
                    className={styles.stopBtn}
                    onClick={stopRecording}
                  >
                    ⏹️ 停止录制
                  </button>
                )}
              </div>
            </div>
            
            {/* 回放控制 */}
            <div className={styles.controlSection}>
              <h3>回放控制</h3>
              <div className={styles.buttonGroup}>
                {!isPlaying ? (
                  <button 
                    className={styles.playBtn}
                    onClick={startPlayback}
                    disabled={!arRecorderRef.current?.recordedData}
                  >
                    ▶️ 播放
                  </button>
                ) : (
                  <button 
                    className={styles.stopBtn}
                    onClick={stopPlayback}
                  >
                    ⏹️ 停止
                  </button>
                )}
              </div>
            </div>
            
            {/* 导入导出 */}
            <div className={styles.controlSection}>
              <h3>导入导出</h3>
              <div className={styles.buttonGroup}>
                <button 
                  className={styles.exportBtn}
                  onClick={exportARScene}
                  disabled={!arRecorderRef.current?.recordedData}
                >
                  📤 导出场景
                </button>
                <label className={styles.importBtn}>
                  📁 导入场景
                  <input
                    type="file"
                    accept=".arscene"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) importARScene(file)
                      e.target.value = ''
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
            
            {/* 检测到的平面列表 */}
            <div className={styles.controlSection}>
              <h3>检测到的平面</h3>
              <div className={styles.planeList}>
                {detectedPlanes.length === 0 ? (
                  <p className={styles.emptyText}>暂无检测到的平面</p>
                ) : (
                  detectedPlanes.map(plane => (
                    <div key={plane.id} className={styles.planeItem}>
                      <span className={styles.planeId}>{plane.id}</span>
                      <span className={styles.planeSize}>
                        {plane.size.width.toFixed(2)}m × {plane.size.height.toFixed(2)}m
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        
        {error && (
          <div className={styles.errorMessage}>
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  )
}
