import React, { useState, useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import styles from './ARSceneCameraRecorder.module.css'
import JSZip from 'jszip'

/**
 * AR场景相机录制组件
 * 
 * 功能：
 * 1. 启动摄像头拍摄场景照片
 * 2. 在照片上标记平面位置
 * 3. 记录平面在2D图像上的位置和3D空间位置
 * 4. 导出包含图片和配置的完整场景包
 */

export function ARSceneCameraRecorder({
  isOpen,
  onClose,
  onSceneRecorded
}) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const previewCanvasRef = useRef(null)
  const streamRef = useRef(null)
  
  const [isSupported, setIsSupported] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [planes, setPlanes] = useState([])
  const [sceneName, setSceneName] = useState('')
  const [error, setError] = useState(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedPlane, setSelectedPlane] = useState(null)
  const [isAddingPlane, setIsAddingPlane] = useState(false)

  // 检查摄像头支持
  useEffect(() => {
    const checkSupport = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('您的浏览器不支持摄像头功能')
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
          facingMode: 'environment', // 优先使用后置摄像头
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
  }

  // 拍摄照片
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    setIsCapturing(true)
    
    const video = videoRef.current
    const canvas = canvasRef.current
    
    // 设置画布尺寸为视频实际尺寸
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    
    // 绘制视频帧到画布
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // 转换为图片数据
    const imageData = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedImage(imageData)
    
    // 停止摄像头
    stopCamera()
    
    setIsCapturing(false)
  }

  // 在预览画布上绘制平面标记
  const drawPlanesOnPreview = useCallback(() => {
    if (!previewCanvasRef.current || !capturedImage) return
    
    const canvas = previewCanvasRef.current
    const ctx = canvas.getContext('2d')
    
    // 加载图片
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      
      // 绘制背景图片
      ctx.drawImage(img, 0, 0)
      
      // 绘制每个平面标记
      planes.forEach((plane, index) => {
        const { x, y, width, height } = plane.imagePosition
        
        // 绘制矩形框
        ctx.strokeStyle = selectedPlane === index ? '#ffff00' : '#00ff88'
        ctx.lineWidth = 4
        ctx.strokeRect(x, y, width, height)
        
        // 绘制填充（半透明）
        ctx.fillStyle = selectedPlane === index ? 'rgba(255, 255, 0, 0.2)' : 'rgba(0, 255, 136, 0.2)'
        ctx.fillRect(x, y, width, height)
        
        // 绘制序号标签背景
        ctx.fillStyle = selectedPlane === index ? '#ffff00' : '#00ff88'
        ctx.fillRect(x, y - 30, 40, 30)
        
        // 绘制序号文字
        ctx.fillStyle = '#000'
        ctx.font = 'bold 20px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${index + 1}`, x + 20, y - 15)
        
        // 绘制尺寸信息
        ctx.fillStyle = '#fff'
        ctx.font = '14px Arial'
        ctx.textAlign = 'left'
        ctx.fillText(
          `${plane.realSize.width.toFixed(2)}m × ${plane.realSize.height.toFixed(2)}m`,
          x + 5,
          y + height - 5
        )
      })
    }
    img.src = capturedImage
  }, [capturedImage, planes, selectedPlane])

  // 当平面或选中状态改变时重绘
  useEffect(() => {
    drawPlanesOnPreview()
  }, [drawPlanesOnPreview])

  // 处理画布点击 - 添加或选择平面
  const handleCanvasClick = (e) => {
    if (!isAddingPlane || !previewCanvasRef.current) return
    
    const canvas = previewCanvasRef.current
    const rect = canvas.getBoundingClientRect()
    
    // 计算点击位置在画布上的实际坐标
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    
    // 默认平面尺寸（米）
    const defaultWidth = 2.0
    const defaultHeight = 2.0
    
    // 默认像素尺寸
    const defaultPixelWidth = 200
    const defaultPixelHeight = 200
    
    const newPlane = {
      id: `plane_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      index: planes.length + 1,
      imagePosition: {
        x: x - defaultPixelWidth / 2,
        y: y - defaultPixelHeight / 2,
        width: defaultPixelWidth,
        height: defaultPixelHeight
      },
      // 3D空间位置（假设相机高度1.6米，地面在y=0）
      worldPosition: {
        x: (x - canvas.width / 2) / 100, // 简化的坐标转换
        y: 0,
        z: (canvas.height - y) / 100
      },
      realSize: {
        width: defaultWidth,
        height: defaultHeight
      },
      rotation: { x: -90, y: 0, z: 0 }
    }
    
    setPlanes([...planes, newPlane])
    setIsAddingPlane(false)
  }

  // 更新平面位置
  const updatePlanePosition = (index, updates) => {
    const newPlanes = [...planes]
    newPlanes[index] = { ...newPlanes[index], ...updates }
    setPlanes(newPlanes)
  }

  // 更新平面像素位置
  const updatePlaneImagePosition = (index, imagePosition) => {
    const newPlanes = [...planes]
    newPlanes[index].imagePosition = { ...newPlanes[index].imagePosition, ...imagePosition }
    setPlanes(newPlanes)
  }

  // 删除平面
  const deletePlane = (index) => {
    const newPlanes = planes.filter((_, i) => i !== index)
    // 重新编号
    newPlanes.forEach((plane, i) => {
      plane.index = i + 1
    })
    setPlanes(newPlanes)
    if (selectedPlane === index) {
      setSelectedPlane(null)
    }
  }

  // 导出场景
  const exportScene = async () => {
    if (!capturedImage || planes.length === 0) {
      setError('请先拍摄照片并标记至少一个平面')
      return
    }
    
    setIsExporting(true)
    
    try {
      // 提取图片base64数据
      const imageBase64 = capturedImage.split(',')[1]
      
      // 构建场景数据
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
        // 平面数据
        planes: planes.map(p => ({
          id: p.id,
          index: p.index,
          imagePosition: p.imagePosition,
          worldPosition: p.worldPosition,
          realSize: p.realSize,
          rotation: p.rotation
        })),
        // 相机配置
        camera: {
          height: 1.6, // 假设相机高度1.6米
          fov: 60,
          position: { x: 0, y: 1.6, z: 0 }
        },
        // 场景边界
        sceneBounds: calculateSceneBounds(planes)
      }
      
      // 创建ZIP文件
      const zip = new JSZip()
      
      // manifest.json
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
      
      // scene.json - 场景配置
      zip.file('scene.json', JSON.stringify(sceneData, null, 2))
      
      // scene.jpg - 场景图片
      zip.file('scene.jpg', imageBase64, { base64: true })
      
      // planes.csv - 平面数据
      const csvHeader = 'index,id,imageX,imageY,imageWidth,imageHeight,worldX,worldY,worldZ,realWidth,realHeight,rotationX,rotationY,rotationZ\n'
      const csvData = planes.map(p => 
        `${p.index},${p.id},${p.imagePosition.x},${p.imagePosition.y},${p.imagePosition.width},${p.imagePosition.height},${p.worldPosition.x},${p.worldPosition.y},${p.worldPosition.z},${p.realSize.width},${p.realSize.height},${p.rotation.x},${p.rotation.y},${p.rotation.z}`
      ).join('\n')
      zip.file('planes.csv', csvHeader + csvData)
      
      // README.md
      zip.file('README.md', `# ${sceneData.name}

## 场景信息
- 平面数量: ${planes.length}
- 录制时间: ${sceneData.capturedAt}
- 图片尺寸: ${sceneData.image.width} × ${sceneData.image.height}

## 文件说明

### scene.jpg
场景照片，作为AR背景使用。

### scene.json
场景配置文件，包含所有平面的位置、大小信息。

### planes.csv
CSV格式的平面数据，便于在Excel中查看。

## 如何使用

### 在Three.js中重建场景
\`\`\`javascript
// 加载场景
const sceneData = await fetch('scene.json').then(r => r.json())
const texture = await new THREE.TextureLoader().loadAsync('scene.jpg')

// 设置背景
scene.background = texture

// 创建平面
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
      
      // 生成ZIP文件
      const content = await zip.generateAsync({ type: 'blob' })
      
      // 下载文件
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = `${sceneData.name.replace(/\s+/g, '_')}.arscene3`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      if (onSceneRecorded) {
        onSceneRecorded(sceneData)
      }
      
      alert(`场景导出成功！\n包含 ${planes.length} 个平面\n文件名: ${sceneData.name.replace(/\s+/g, '_')}.arscene3`)
      
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
    setSelectedPlane(null)
    startCamera()
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* 头部 */}
        <div className={styles.header}>
          <h2>📷 AR场景相机录制</h2>
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
                {!isCameraActive && (
                  <div className={styles.cameraPlaceholder}>
                    <button 
                      className={styles.startCameraBtn}
                      onClick={startCamera}
                      disabled={!isSupported}
                    >
                      {isSupported ? '📷 启动摄像头' : '❌ 摄像头不可用'}
                    </button>
                  </div>
                )}
              </div>
              
              {isCameraActive && (
                <div className={styles.cameraControls}>
                  <button 
                    className={styles.captureBtn}
                    onClick={capturePhoto}
                    disabled={isCapturing}
                  >
                    {isCapturing ? '⏳ 拍摄中...' : '📸 拍摄照片'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            // 照片编辑模式
            <div className={styles.editMode}>
              <div className={styles.previewContainer}>
                <canvas
                  ref={previewCanvasRef}
                  className={styles.previewCanvas}
                  onClick={handleCanvasClick}
                  style={{ cursor: isAddingPlane ? 'crosshair' : 'default' }}
                />
                
                {isAddingPlane && (
                  <div className={styles.addingHint}>
                    点击画面添加平面标记
                  </div>
                )}
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
                    className={`${styles.actionBtn} ${isAddingPlane ? styles.active : ''}`}
                    onClick={() => setIsAddingPlane(!isAddingPlane)}
                  >
                    {isAddingPlane ? '❌ 取消添加' : '➕ 添加平面'}
                  </button>
                  
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
                    <h4>已标记平面 ({planes.length})</h4>
                    {planes.map((plane, index) => (
                      <div 
                        key={plane.id}
                        className={`${styles.planeItem} ${selectedPlane === index ? styles.selected : ''}`}
                        onClick={() => setSelectedPlane(selectedPlane === index ? null : index)}
                      >
                        <span className={styles.planeNumber}>{plane.index}</span>
                        <div className={styles.planeInfo}>
                          <span>位置: ({plane.imagePosition.x.toFixed(0)}, {plane.imagePosition.y.toFixed(0)})</span>
                          <span>大小: {plane.realSize.width}m × {plane.realSize.height}m</span>
                        </div>
                        <button 
                          className={styles.deleteBtn}
                          onClick={(e) => {
                            e.stopPropagation()
                            deletePlane(index)
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* 选中平面的详细设置 */}
                {selectedPlane !== null && planes[selectedPlane] && (
                  <div className={styles.planeSettings}>
                    <h4>平面 #{planes[selectedPlane].index} 设置</h4>
                    
                    <div className={styles.settingRow}>
                      <label>像素 X</label>
                      <input
                        type="number"
                        value={planes[selectedPlane].imagePosition.x}
                        onChange={(e) => updatePlaneImagePosition(selectedPlane, { x: parseFloat(e.target.value) })}
                      />
                    </div>
                    
                    <div className={styles.settingRow}>
                      <label>像素 Y</label>
                      <input
                        type="number"
                        value={planes[selectedPlane].imagePosition.y}
                        onChange={(e) => updatePlaneImagePosition(selectedPlane, { y: parseFloat(e.target.value) })}
                      />
                    </div>
                    
                    <div className={styles.settingRow}>
                      <label>像素宽度</label>
                      <input
                        type="number"
                        value={planes[selectedPlane].imagePosition.width}
                        onChange={(e) => updatePlaneImagePosition(selectedPlane, { width: parseFloat(e.target.value) })}
                      />
                    </div>
                    
                    <div className={styles.settingRow}>
                      <label>像素高度</label>
                      <input
                        type="number"
                        value={planes[selectedPlane].imagePosition.height}
                        onChange={(e) => updatePlaneImagePosition(selectedPlane, { height: parseFloat(e.target.value) })}
                      />
                    </div>
                    
                    <div className={styles.settingRow}>
                      <label>实际宽度(m)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={planes[selectedPlane].realSize.width}
                        onChange={(e) => updatePlanePosition(selectedPlane, { 
                          realSize: { ...planes[selectedPlane].realSize, width: parseFloat(e.target.value) }
                        })}
                      />
                    </div>
                    
                    <div className={styles.settingRow}>
                      <label>实际高度(m)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={planes[selectedPlane].realSize.height}
                        onChange={(e) => updatePlanePosition(selectedPlane, { 
                          realSize: { ...planes[selectedPlane].realSize, height: parseFloat(e.target.value) }
                        })}
                      />
                    </div>
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
              {planes.length > 0 ? `已标记 ${planes.length} 个平面` : '请点击"添加平面"标记地面位置'}
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
      
      {/* 隐藏的画布用于处理图片 */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default ARSceneCameraRecorder
