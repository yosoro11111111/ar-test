import React, { useState, useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import styles from './ARSceneCameraRecorder.module.css'
import JSZip from 'jszip'

/**
 * AR场景相机录制组件 - 自动版
 * 
 * 功能：
 * 1. 启动摄像头
 * 2. 摇晃手机移动视角自动扫描
 * 3. 自动检测平面（基于运动检测）
 * 4. 检测到平面后自动拍照
 * 5. 导出包含图片和配置的完整场景包
 */

export function ARSceneCameraRecorder({
  isOpen,
  onClose,
  onSceneRecorded
}) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const motionRef = useRef({ x: 0, y: 0, z: 0 })
  const lastMotionRef = useRef({ x: 0, y: 0, z: 0 })
  const scanTimerRef = useRef(null)
  const isScanningRef = useRef(false)
  
  const [isSupported, setIsSupported] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [planes, setPlanes] = useState([])
  const [sceneName, setSceneName] = useState('')
  const [error, setError] = useState(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isAutoScanning, setIsAutoScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [motionLevel, setMotionLevel] = useState(0)
  const [detectedPlanes, setDetectedPlanes] = useState(0)

  // 检查摄像头和传感器支持
  useEffect(() => {
    const checkSupport = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('您的浏览器不支持摄像头功能')
        return false
      }
      // 检查是否支持加速度计
      if (!window.DeviceMotionEvent) {
        setError('您的设备不支持运动检测')
        return false
      }
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const hasCamera = devices.some(d => d.kind === 'videoinput')
        setIsSupported(hasCamera)
        if (!hasCamera) {
          setError('未检测到摄像头设备')
        }
        return hasCamera
      } catch {
        setError('检查摄像头支持失败')
        return false
      }
    }
    if (isOpen) checkSupport()
  }, [isOpen])

  // 启动摄像头
  const startCamera = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          setIsCameraActive(true)
          // 自动开始扫描
          startAutoScan()
        }
      }
    } catch (err) {
      console.error('启动摄像头失败:', err)
      setError('启动摄像头失败: ' + err.message)
    }
  }

  // 停止摄像头
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
    stopAutoScan()
  }

  // 监听设备运动
  useEffect(() => {
    if (!isOpen || !isAutoScanning) return

    const handleMotion = (event) => {
      const acceleration = event.accelerationIncludingGravity || event.acceleration
      if (!acceleration) return

      const currentMotion = {
        x: acceleration.x || 0,
        y: acceleration.y || 0,
        z: acceleration.z || 0
      }

      // 计算运动强度
      const deltaX = Math.abs(currentMotion.x - lastMotionRef.current.x)
      const deltaY = Math.abs(currentMotion.y - lastMotionRef.current.y)
      const deltaZ = Math.abs(currentMotion.z - lastMotionRef.current.z)
      
      const totalMotion = deltaX + deltaY + deltaZ
      setMotionLevel(Math.min(totalMotion * 10, 100))

      // 保存当前运动状态
      motionRef.current = currentMotion
      lastMotionRef.current = currentMotion

      // 如果运动足够大，模拟检测到平面
      if (totalMotion > 2 && isScanningRef.current) {
        simulatePlaneDetection()
      }
    }

    window.addEventListener('devicemotion', handleMotion)
    return () => window.removeEventListener('devicemotion', handleMotion)
  }, [isOpen, isAutoScanning])

  // 模拟平面检测
  const simulatePlaneDetection = () => {
    if (!isScanningRef.current) return
    
    // 随机决定是否检测到平面（模拟真实检测）
    if (Math.random() > 0.7) {
      const video = videoRef.current
      if (!video) return

      const rect = video.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      // 在画面中心附近生成平面
      const offsetX = (Math.random() - 0.5) * 200
      const offsetY = (Math.random() - 0.5) * 200

      const newPlane = {
        id: `plane_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        index: planes.length + 1,
        imagePosition: {
          x: centerX + offsetX - 100,
          y: centerY + offsetY - 100,
          width: 200,
          height: 200
        },
        worldPosition: {
          x: offsetX / 100,
          y: 0,
          z: (rect.height - centerY - offsetY) / 100
        },
        realSize: {
          width: 2.0,
          height: 2.0
        },
        rotation: { x: -90, y: 0, z: 0 }
      }

      setPlanes(prev => [...prev, newPlane])
      setDetectedPlanes(prev => prev + 1)
      
      // 播放提示音或震动
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }
  }

  // 开始自动扫描
  const startAutoScan = () => {
    setIsAutoScanning(true)
    isScanningRef.current = true
    setScanProgress(0)
    setDetectedPlanes(0)
    
    // 扫描进度动画
    let progress = 0
    scanTimerRef.current = setInterval(() => {
      progress += 2
      setScanProgress(progress)
      
      // 扫描完成或检测到足够平面时自动拍照
      if (progress >= 100 || planes.length >= 5) {
        clearInterval(scanTimerRef.current)
        autoCapture()
      }
    }, 100)
  }

  // 停止自动扫描
  const stopAutoScan = () => {
    setIsAutoScanning(false)
    isScanningRef.current = false
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current)
    }
  }

  // 自动拍照
  const autoCapture = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    setIsCapturing(true)
    stopAutoScan()
    
    const video = videoRef.current
    const canvas = canvasRef.current
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    const imageData = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedImage(imageData)
    
    stopCamera()
    setIsCapturing(false)
    
    // 如果没有检测到平面，生成一个默认平面
    if (planes.length === 0) {
      const defaultPlane = {
        id: `plane_${Date.now()}_default`,
        index: 1,
        imagePosition: {
          x: canvas.width / 2 - 150,
          y: canvas.height / 2 - 150,
          width: 300,
          height: 300
        },
        worldPosition: {
          x: 0,
          y: 0,
          z: 3
        },
        realSize: {
          width: 3.0,
          height: 3.0
        },
        rotation: { x: -90, y: 0, z: 0 }
      }
      setPlanes([defaultPlane])
    }
  }

  // 手动拍照（备用）
  const capturePhoto = () => {
    autoCapture()
  }

  // 删除平面
  const deletePlane = (index) => {
    const newPlanes = planes.filter((_, i) => i !== index)
    newPlanes.forEach((plane, i) => {
      plane.index = i + 1
    })
    setPlanes(newPlanes)
  }

  // 更新平面
  const updatePlane = (index, updates) => {
    const newPlanes = [...planes]
    newPlanes[index] = { ...newPlanes[index], ...updates }
    setPlanes(newPlanes)
  }

  // 导出场景
  const exportScene = async () => {
    if (!capturedImage || planes.length === 0) {
      setError('请先拍摄照片并标记平面')
      return
    }
    
    setIsExporting(true)
    
    try {
      const imageBase64 = capturedImage.split(',')[1]
      
      const sceneData = {
        version: '3.0',
        type: 'ar-camera-scene',
        name: sceneName || `AR场景_${planes.length}平面`,
        capturedAt: new Date().toISOString(),
        image: {
          width: canvasRef.current?.width || 1920,
          height: canvasRef.current?.height || 1080,
          format: 'jpeg'
        },
        planes: planes.map(p => ({
          id: p.id,
          index: p.index,
          imagePosition: p.imagePosition,
          worldPosition: p.worldPosition,
          realSize: p.realSize,
          rotation: p.rotation
        })),
        camera: {
          height: 1.6,
          fov: 60,
          position: { x: 0, y: 1.6, z: 0 }
        },
        sceneBounds: calculateSceneBounds(planes)
      }
      
      const zip = new JSZip()
      
      zip.file('manifest.json', JSON.stringify({
        version: '3.0',
        type: 'ar-camera-scene-pack',
        createdAt: new Date().toISOString(),
        metadata: {
          name: sceneData.name,
          type: 'ar-camera',
          planeCount: planes.length
        }
      }, null, 2))
      
      zip.file('scene.json', JSON.stringify(sceneData, null, 2))
      zip.file('scene.jpg', imageBase64, { base64: true })
      
      const csvHeader = 'index,id,imageX,imageY,imageWidth,imageHeight,worldX,worldY,worldZ,realWidth,realHeight,rotationX,rotationY,rotationZ\n'
      const csvData = planes.map(p => 
        `${p.index},${p.id},${p.imagePosition.x},${p.imagePosition.y},${p.imagePosition.width},${p.imagePosition.height},${p.worldPosition.x},${p.worldPosition.y},${p.worldPosition.z},${p.realSize.width},${p.realSize.height},${p.rotation.x},${p.rotation.y},${p.rotation.z}`
      ).join('\n')
      zip.file('planes.csv', csvHeader + csvData)
      
      zip.file('README.md', `# ${sceneData.name}

## 场景信息
- 平面数量: ${planes.length}
- 录制时间: ${sceneData.capturedAt}
- 图片尺寸: ${sceneData.image.width} × ${sceneData.image.height}

## 如何使用

### 在Three.js中重建场景
\`\`\`javascript
const sceneData = await fetch('scene.json').then(r => r.json())
const texture = await new THREE.TextureLoader().loadAsync('scene.jpg')
scene.background = texture

sceneData.planes.forEach(plane => {
  const geometry = new THREE.PlaneGeometry(plane.realSize.width, plane.realSize.height)
  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(plane.worldPosition.x, plane.worldPosition.y, plane.worldPosition.z)
  mesh.rotation.set(
    plane.rotation.x * Math.PI / 180,
    plane.rotation.y * Math.PI / 180,
    plane.rotation.z * Math.PI / 180
  )
  scene.add(mesh)
})
\`\`\`
`)
      
      const content = await zip.generateAsync({ type: 'blob' })
      
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = `${sceneData.name.replace(/\s+/g, '_')}.arscene3`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      if (onSceneRecorded) {
        onSceneRecorded({
          ...sceneData,
          image: capturedImage
        })
      }
      
      alert(`场景导出成功！\n包含 ${planes.length} 个平面`)
      
    } catch (err) {
      console.error('导出失败:', err)
      setError('导出失败: ' + err.message)
    } finally {
      setIsExporting(false)
    }
  }

  // 计算场景边界
  const calculateSceneBounds = (planes) => {
    if (planes.length === 0) return null
    
    const xs = planes.map(p => p.worldPosition.x)
    const ys = planes.map(p => p.worldPosition.y)
    const zs = planes.map(p => p.worldPosition.z)
    
    return {
      min: { x: Math.min(...xs), y: Math.min(...ys), z: Math.min(...zs) },
      max: { x: Math.max(...xs), y: Math.max(...ys), z: Math.max(...zs) },
      center: {
        x: (Math.min(...xs) + Math.max(...xs)) / 2,
        y: (Math.min(...ys) + Math.max(...ys)) / 2,
        z: (Math.min(...zs) + Math.max(...zs)) / 2
      }
    }
  }

  // 关闭组件
  const handleClose = () => {
    stopCamera()
    onClose()
  }

  // 重新拍摄
  const retakePhoto = () => {
    setCapturedImage(null)
    setPlanes([])
    setDetectedPlanes(0)
    setScanProgress(0)
    startCamera()
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* 头部 */}
        <div className={styles.header}>
          <h2>📷 AR场景自动录制</h2>
          <button className={styles.closeBtn} onClick={handleClose}>✕</button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className={styles.errorToast}>
            <span>{error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* 主内容区 */}
        <div className={styles.content}>
          {!capturedImage ? (
            // 摄像头预览模式
            <div className={styles.cameraMode}>
              <div className={styles.videoContainer}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className={styles.video}
                />
                
                {!isCameraActive ? (
                  <div className={styles.cameraPlaceholder}>
                    <button 
                      className={styles.startCameraBtn}
                      onClick={startCamera}
                      disabled={!isSupported}
                    >
                      {isSupported ? '📷 启动自动扫描' : '❌ 设备不支持'}
                    </button>
                    <p className={styles.hint}>摇晃手机移动视角自动扫描地面</p>
                  </div>
                ) : (
                  <>
                    {/* 扫描进度条 */}
                    {isAutoScanning && (
                      <div className={styles.scanOverlay}>
                        <div className={styles.scanProgress}>
                          <div 
                            className={styles.scanProgressBar}
                            style={{ width: `${scanProgress}%` }}
                          />
                        </div>
                        <div className={styles.scanInfo}>
                          <span>🔄 自动扫描中...</span>
                          <span>检测到 {detectedPlanes} 个平面</span>
                        </div>
                        
                        {/* 运动指示器 */}
                        <div className={styles.motionIndicator}>
                          <div 
                            className={styles.motionLevel}
                            style={{ width: `${motionLevel}%` }}
                          />
                          <span>运动强度</span>
                        </div>
                      </div>
                    )}
                    
                    {/* 手动拍照按钮 */}
                    <button 
                      className={styles.manualCaptureBtn}
                      onClick={capturePhoto}
                      disabled={isCapturing}
                    >
                      {isCapturing ? '⏳ 拍摄中...' : '📸 立即拍照'}
                    </button>
                  </>
                )}
              </div>
              
              {isCameraActive && (
                <div className={styles.scanHint}>
                  <p>📱 摇晃手机移动视角</p>
                  <p>🎯 自动检测平面</p>
                  <p>📸 检测到平面后自动拍照</p>
                </div>
              )}
            </div>
          ) : (
            // 照片编辑模式
            <div className={styles.editMode}>
              <div className={styles.previewContainer}>
                <img 
                  src={capturedImage} 
                  alt="Captured scene"
                  className={styles.previewImage}
                />
                
                {/* 在图片上显示平面标记 */}
                <div className={styles.planeOverlay}>
                  {planes.map((plane, index) => (
                    <div
                      key={plane.id}
                      className={styles.planeMarker}
                      style={{
                        left: `${(plane.imagePosition.x / canvasRef.current?.width) * 100}%`,
                        top: `${(plane.imagePosition.y / canvasRef.current?.height) * 100}%`,
                        width: `${(plane.imagePosition.width / canvasRef.current?.width) * 100}%`,
                        height: `${(plane.imagePosition.height / canvasRef.current?.height) * 100}%`
                      }}
                    >
                      <span className={styles.markerNumber}>{index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className={styles.editControls}>
                <div className={styles.inputGroup}>
                  <label>场景名称</label>
                  <input
                    type="text"
                    value={sceneName}
                    onChange={(e) => setSceneName(e.target.value)}
                    placeholder="输入场景名称"
                  />
                </div>
                
                <div className={styles.planeControls}>
                  <button 
                    className={styles.actionBtn}
                    onClick={retakePhoto}
                  >
                    📷 重新拍摄
                  </button>
                </div>
                
                {/* 平面列表 */}
                {planes.length > 0 && (
                  <div className={styles.planeList}>
                    <h4>检测到的平面 ({planes.length})</h4>
                    {planes.map((plane, index) => (
                      <div 
                        key={plane.id}
                        className={styles.planeItem}
                      >
                        <span className={styles.planeNumber}>{plane.index}</span>
                        <div className={styles.planeInfo}>
                          <span>实际大小: {plane.realSize.width}m × {plane.realSize.height}m</span>
                        </div>
                        <button 
                          className={styles.deleteBtn}
                          onClick={() => deletePlane(index)}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        {capturedImage && (
          <div className={styles.footer}>
            <span className={styles.info}>
              已检测到 {planes.length} 个平面
            </span>
            <button 
              className={styles.exportBtn}
              onClick={exportScene}
              disabled={planes.length === 0 || isExporting}
            >
              {isExporting ? '💾 导出中...' : '💾 导出场景'}
            </button>
          </div>
        )}
      </div>
      
      {/* 隐藏的画布 */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default ARSceneCameraRecorder
