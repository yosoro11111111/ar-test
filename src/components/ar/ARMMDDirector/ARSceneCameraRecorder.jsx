import React, { useState, useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import styles from './ARSceneCameraRecorder.module.css'
import JSZip from 'jszip'

/**
 * AR场景相机录制组件 - 多平面AR检测版
 * 
 * 功能：
 * 1. 使用真实AR检测多个平面
 * 2. 检测到平面后自动拍照
 * 3. 预览多张图片，可删除不要的
 * 4. 生成真实平面数据
 * 5. 导出完整3D场景到时间轴
 */

export function ARSceneCameraRecorder({
  isOpen,
  onClose,
  onSceneRecorded
}) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const xrSessionRef = useRef(null)
  const xrRefSpaceRef = useRef(null)
  const detectedPlanesRef = useRef(new Map())
  
  const [isSupported, setIsSupported] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [capturedImages, setCapturedImages] = useState([])
  const [planes, setPlanes] = useState([])
  const [sceneName, setSceneName] = useState('')
  const [error, setError] = useState(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [step, setStep] = useState('camera') // camera, preview, edit
  const [detectedPlaneCount, setDetectedPlaneCount] = useState(0)
  const [isARDetecting, setIsARDetecting] = useState(false)

  // 检查AR支持
  useEffect(() => {
    const checkSupport = async () => {
      if (!navigator.xr) {
        setError('您的浏览器不支持WebXR')
        return false
      }
      try {
        const isSupported = await navigator.xr.isSessionSupported('immersive-ar')
        setIsSupported(isSupported)
        if (!isSupported) {
          setError('您的设备不支持AR功能')
        }
        return isSupported
      } catch {
        setError('检查AR支持失败')
        return false
      }
    }
    if (isOpen) checkSupport()
  }, [isOpen])

  // 启动AR会话
  const startARSession = async () => {
    try {
      setError(null)
      
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'plane-detection'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: document.body }
      })
      
      xrSessionRef.current = session
      
      // 设置渲染
      const canvas = canvasRef.current
      const gl = canvas.getContext('webgl2', { xrCompatible: true })
      
      const renderer = new THREE.WebGLRenderer({
        canvas,
        context: gl,
        alpha: true,
        antialias: true
      })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(window.devicePixelRatio)
      
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
      
      // 创建参考空间
      const refSpace = await session.requestReferenceSpace('local')
      xrRefSpaceRef.current = refSpace
      
      // 监听平面检测
      if (session.detectedPlanes) {
        setIsARDetecting(true)
        
        // 平面检测循环
        const detectPlanes = () => {
          if (!session.detectedPlanes) return
          
          session.detectedPlanes.forEach(plane => {
            if (!detectedPlanesRef.current.has(plane.uuid)) {
              // 新平面检测到
              detectedPlanesRef.current.set(plane.uuid, {
                plane,
                timestamp: Date.now()
              })
              
              setDetectedPlaneCount(prev => prev + 1)
              
              // 自动拍照
              captureARPhoto(plane, session, refSpace, renderer, scene, camera)
            }
          })
          
          if (isARDetecting) {
            requestAnimationFrame(detectPlanes)
          }
        }
        
        detectPlanes()
      }
      
      // 渲染循环
      const onXRFrame = (time, frame) => {
        const pose = frame.getViewerPose(refSpace)
        if (pose) {
          const view = pose.views[0]
          camera.matrix.fromArray(view.transform.matrix)
          camera.updateMatrixWorld(true)
          renderer.render(scene, camera)
        }
        session.requestAnimationFrame(onXRFrame)
      }
      
      session.requestAnimationFrame(onXRFrame)
      setIsCameraActive(true)
      
    } catch (err) {
      console.error('启动AR失败:', err)
      setError('启动AR失败: ' + err.message)
      // 降级到普通摄像头
      startNormalCamera()
    }
  }

  // 降级：普通摄像头+模拟平面检测
  const startNormalCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          setIsCameraActive(true)
          // 模拟AR平面检测
          simulateARDetection()
        }
      }
    } catch (err) {
      setError('启动摄像头失败: ' + err.message)
    }
  }

  // 模拟AR平面检测（用于不支持AR的设备）
  const simulateARDetection = () => {
    setIsARDetecting(true)
    let count = 0
    
    const detectInterval = setInterval(() => {
      if (count >= 3 || !isARDetecting) {
        clearInterval(detectInterval)
        return
      }
      
      // 模拟检测到平面
      const mockPlane = {
        uuid: `mock_plane_${count}`,
        polygon: [
          { x: -1, y: 0, z: -1 },
          { x: 1, y: 0, z: -1 },
          { x: 1, y: 0, z: 1 },
          { x: -1, y: 0, z: 1 }
        ],
        center: { x: 0, y: 0, z: -2 - count * 0.5 },
        extent: { width: 2, height: 2 }
      }
      
      setDetectedPlaneCount(prev => prev + 1)
      captureNormalPhoto(mockPlane)
      count++
    }, 2000)
  }

  // AR拍照
  const captureARPhoto = async (plane, session, refSpace, renderer, scene, camera) => {
    setIsCapturing(true)
    
    try {
      // 获取当前帧
      const baseLayer = session.renderState.baseLayer
      const frame = session.requestAnimationFrame
      
      // 创建画布捕获当前画面
      const canvas = document.createElement('canvas')
      canvas.width = renderer.domElement.width
      canvas.height = renderer.domElement.height
      const ctx = canvas.getContext('2d')
      
      // 从视频流捕获
      const video = videoRef.current
      if (video) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      }
      
      const imageData = canvas.toDataURL('image/jpeg', 0.9)
      
      // 计算平面在图片中的位置
      const imagePosition = calculatePlaneImagePosition(plane, camera, canvas)
      
      // 创建平面数据
      const planeData = {
        id: `plane_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        index: detectedPlanesRef.current.size,
        imagePosition,
        worldPosition: {
          x: plane.center?.x || 0,
          y: plane.center?.y || 0,
          z: plane.center?.z || -2
        },
        realSize: {
          width: plane.extent?.width || 2,
          height: plane.extent?.height || 2
        },
        rotation: { x: -90, y: 0, z: 0 },
        polygon: plane.polygon || []
      }
      
      setCapturedImages(prev => [...prev, {
        id: Date.now(),
        image: imageData,
        plane: planeData
      }])
      
      setPlanes(prev => [...prev, planeData])
      
    } catch (err) {
      console.error('拍照失败:', err)
    } finally {
      setIsCapturing(false)
    }
  }

  // 普通拍照
  const captureNormalPhoto = (mockPlane) => {
    if (!videoRef.current || !canvasRef.current) return
    
    setIsCapturing(true)
    
    const video = videoRef.current
    const canvas = canvasRef.current
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    const imageData = canvas.toDataURL('image/jpeg', 0.9)
    
    // 模拟平面在图片中的位置
    const imagePosition = {
      x: canvas.width / 2 - 150,
      y: canvas.height / 2 - 100,
      width: 300,
      height: 200
    }
    
    const planeData = {
      id: `plane_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      index: planes.length + 1,
      imagePosition,
      worldPosition: mockPlane.center,
      realSize: {
        width: mockPlane.extent?.width || 2,
        height: mockPlane.extent?.height || 2
      },
      rotation: { x: -90, y: 0, z: 0 },
      polygon: mockPlane.polygon
    }
    
    setCapturedImages(prev => [...prev, {
      id: Date.now(),
      image: imageData,
      plane: planeData
    }])
    
    setPlanes(prev => [...prev, planeData])
    setIsCapturing(false)
  }

  // 计算平面在图片中的位置
  const calculatePlaneImagePosition = (plane, camera, canvas) => {
    // 简化的投影计算
    const center = plane.center || { x: 0, y: 0, z: -2 }
    const extent = plane.extent || { width: 2, height: 2 }
    
    // 假设相机在 (0, 1.6, 0)，看向 -Z 方向
    const fov = 75
    const aspect = canvas.width / canvas.height
    
    // 简单的透视投影
    const distance = Math.abs(center.z)
    const visibleHeight = 2 * Math.tan((fov * Math.PI / 180) / 2) * distance
    const visibleWidth = visibleHeight * aspect
    
    const screenX = (center.x / visibleWidth + 0.5) * canvas.width
    const screenY = (0.5 - center.y / visibleHeight) * canvas.height
    
    const pixelWidth = (extent.width / visibleWidth) * canvas.width
    const pixelHeight = (extent.height / visibleHeight) * canvas.height
    
    return {
      x: screenX - pixelWidth / 2,
      y: screenY - pixelHeight / 2,
      width: pixelWidth,
      height: pixelHeight
    }
  }

  // 删除图片
  const deleteImage = (index) => {
    const newImages = capturedImages.filter((_, i) => i !== index)
    const newPlanes = planes.filter((_, i) => i !== index)
    
    // 重新编号
    newPlanes.forEach((plane, i) => {
      plane.index = i + 1
    })
    
    setCapturedImages(newImages)
    setPlanes(newPlanes)
    setDetectedPlaneCount(newPlanes.length)
  }

  // 停止AR/摄像头
  const stopCapture = () => {
    setIsARDetecting(false)
    
    if (xrSessionRef.current) {
      xrSessionRef.current.end()
      xrSessionRef.current = null
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    setIsCameraActive(false)
  }

  // 完成拍摄，进入预览
  const finishCapture = () => {
    stopCapture()
    setStep('preview')
  }

  // 导出场景
  const exportScene = async () => {
    if (capturedImages.length === 0 || planes.length === 0) {
      setError('请至少拍摄一张照片')
      return
    }
    
    setIsExporting(true)
    
    try {
      // 选择主图片（第一张）
      const mainImage = capturedImages[0].image
      const imageBase64 = mainImage.split(',')[1]
      
      // 构建场景数据
      const sceneData = {
        version: '4.0',
        type: 'ar-multi-plane-scene',
        name: sceneName || `AR多平面场景_${planes.length}个平面`,
        capturedAt: new Date().toISOString(),
        image: {
          width: canvasRef.current?.width || 1920,
          height: canvasRef.current?.height || 1080,
          format: 'jpeg'
        },
        // 所有平面数据
        planes: planes.map(p => ({
          id: p.id,
          index: p.index,
          imagePosition: p.imagePosition,
          worldPosition: p.worldPosition,
          realSize: p.realSize,
          rotation: p.rotation,
          polygon: p.polygon
        })),
        // 相机配置
        camera: {
          height: 1.6,
          fov: 75,
          position: { x: 0, y: 1.6, z: 0 }
        },
        // 场景边界
        sceneBounds: calculateSceneBounds(planes)
      }
      
      // 创建ZIP
      const zip = new JSZip()
      
      zip.file('manifest.json', JSON.stringify({
        version: '4.0',
        type: 'ar-multi-plane-scene-pack',
        createdAt: new Date().toISOString(),
        metadata: {
          name: sceneData.name,
          type: 'ar-multi-plane',
          planeCount: planes.length,
          imageCount: capturedImages.length
        }
      }, null, 2))
      
      zip.file('scene.json', JSON.stringify(sceneData, null, 2))
      zip.file('scene.jpg', imageBase64, { base64: true })
      
      // 保存所有图片
      const imagesFolder = zip.folder('images')
      capturedImages.forEach((img, index) => {
        const base64 = img.image.split(',')[1]
        imagesFolder.file(`plane_${index + 1}.jpg`, base64, { base64: true })
      })
      
      // CSV数据
      const csvHeader = 'index,id,imageX,imageY,imageWidth,imageHeight,worldX,worldY,worldZ,realWidth,realHeight,rotationX,rotationY,rotationZ\n'
      const csvData = planes.map(p => 
        `${p.index},${p.id},${p.imagePosition.x},${p.imagePosition.y},${p.imagePosition.width},${p.imagePosition.height},${p.worldPosition.x},${p.worldPosition.y},${p.worldPosition.z},${p.realSize.width},${p.realSize.height},${p.rotation.x},${p.rotation.y},${p.rotation.z}`
      ).join('\n')
      zip.file('planes.csv', csvHeader + csvData)
      
      zip.file('README.md', `# ${sceneData.name}

## 场景信息
- 平面数量: ${planes.length}
- 图片数量: ${capturedImages.length}
- 录制时间: ${sceneData.capturedAt}

## 文件说明
- scene.jpg - 主场景图片
- images/ - 所有平面图片
- scene.json - 场景配置
- planes.csv - 平面数据

## Three.js使用示例
\`\`\`javascript
const sceneData = await fetch('scene.json').then(r => r.json())
const texture = await new THREE.TextureLoader().loadAsync('scene.jpg')
scene.background = texture

// 创建所有平面
sceneData.planes.forEach(plane => {
  const geometry = new THREE.PlaneGeometry(plane.realSize.width, plane.realSize.height)
  const material = new THREE.MeshStandardMaterial({
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
      a.download = `${sceneData.name.replace(/\s+/g, '_')}.arscene4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      if (onSceneRecorded) {
        onSceneRecorded({
          ...sceneData,
          images: capturedImages.map(img => img.image)
        })
      }
      
      alert(`场景导出成功！\n包含 ${planes.length} 个平面，${capturedImages.length} 张图片`)
      
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

  // 关闭
  const handleClose = () => {
    stopCapture()
    onClose()
  }

  // 重新开始
  const restart = () => {
    setCapturedImages([])
    setPlanes([])
    setDetectedPlaneCount(0)
    detectedPlanesRef.current.clear()
    setStep('camera')
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* 头部 */}
        <div className={styles.header}>
          <h2>
            {step === 'camera' && '📷 AR多平面录制'}
            {step === 'preview' && '👁️ 预览图片'}
            {step === 'edit' && '✏️ 编辑场景'}
          </h2>
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
          {step === 'camera' && (
            // 摄像头/AR模式
            <div className={styles.cameraMode}>
              <div className={styles.videoContainer}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className={styles.video}
                />
                <canvas 
                  ref={canvasRef}
                  className={styles.arCanvas}
                  style={{ display: isCameraActive ? 'block' : 'none' }}
                />
                
                {!isCameraActive && (
                  <div className={styles.cameraPlaceholder}>
                    <button 
                      className={styles.startCameraBtn}
                      onClick={startARSession}
                      disabled={!isSupported}
                    >
                      {isSupported ? '🥽 启动AR检测' : '❌ AR不支持'}
                    </button>
                    <p className={styles.hint}>移动手机自动检测平面并拍照</p>
                  </div>
                )}
                
                {isCameraActive && (
                  <>
                    {/* AR检测状态 */}
                    <div className={styles.arStatus}>
                      <div className={styles.statusItem}>
                        <span className={styles.statusIcon}>🎯</span>
                        <span>已检测 {detectedPlaneCount} 个平面</span>
                      </div>
                      <div className={styles.statusItem}>
                        <span className={styles.statusIcon}>📸</span>
                        <span>已拍摄 {capturedImages.length} 张照片</span>
                      </div>
                    </div>
                    
                    {/* 检测指示器 */}
                    {isARDetecting && (
                      <div className={styles.detectingIndicator}>
                        <div className={styles.detectingPulse} />
                        <span>正在检测平面...</span>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {isCameraActive && (
                <div className={styles.cameraControls}>
                  <button 
                    className={styles.finishBtn}
                    onClick={finishCapture}
                    disabled={capturedImages.length === 0}
                  >
                    ✅ 完成拍摄 ({capturedImages.length}张)
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            // 预览模式
            <div className={styles.previewMode}>
              <div className={styles.previewList}>
                {capturedImages.map((img, index) => (
                  <div key={img.id} className={styles.previewItem}>
                    <img 
                      src={img.image} 
                      alt={`平面 ${index + 1}`}
                      className={styles.previewThumb}
                    />
                    <div className={styles.previewOverlay}>
                      <span className={styles.planeNumber}>{index + 1}</span>
                      <button 
                        className={styles.deleteBtn}
                        onClick={() => deleteImage(index)}
                        title="删除"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className={styles.previewInfo}>
                      <span>平面 #{index + 1}</span>
                      <span>{img.plane.realSize.width.toFixed(1)}m × {img.plane.realSize.height.toFixed(1)}m</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className={styles.previewControls}>
                <div className={styles.inputGroup}>
                  <label>场景名称</label>
                  <input
                    type="text"
                    value={sceneName}
                    onChange={(e) => setSceneName(e.target.value)}
                    placeholder="输入场景名称"
                  />
                </div>
                
                <div className={styles.buttonGroup}>
                  <button className={styles.secondaryBtn} onClick={restart}>
                    🔄 重新拍摄
                  </button>
                  <button 
                    className={styles.primaryBtn}
                    onClick={exportScene}
                    disabled={capturedImages.length === 0 || isExporting}
                  >
                    {isExporting ? '💾 导出中...' : '💾 导出场景'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部信息 */}
        <div className={styles.footer}>
          <span className={styles.info}>
            {step === 'camera' && '移动手机扫描地面，自动检测平面并拍照'}
            {step === 'preview' && `共 ${capturedImages.length} 张照片，${planes.length} 个平面`}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ARSceneCameraRecorder
