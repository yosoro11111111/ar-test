import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import styles from './ARSceneCapture.module.css'

/**
 * AR场景采集页面
 * 采集环境数据：平面位置、光照、相机位姿
 * 用于后续在时间轴中将角色放置在真实平面上
 */
export function ARSceneCapture() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const videoRef = useRef(null)
  
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureProgress, setCaptureProgress] = useState(0)
  const [detectedPlanes, setDetectedPlanes] = useState([])
  const [capturedData, setCapturedData] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  
  // 场景数据
  const sceneDataRef = useRef({
    planes: [],
    lightEstimate: null,
    cameraPose: null,
    captureTime: null,
    thumbnail: null
  })

  // 启动摄像头
  useEffect(() => {
    console.log('🎬 [ARSceneCapture] 组件挂载，开始初始化')
    startCamera()
    return () => {
      console.log('🧹 [ARSceneCapture] 组件卸载，清理资源')
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    console.log('📷 [ARSceneCapture] startCamera() 开始调用')
    try {
      console.log('📷 [ARSceneCapture] 请求摄像头权限...')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 },
        audio: false
      })
      
      console.log('✅ [ARSceneCapture] 摄像头权限获取成功')
      console.log('📊 [ARSceneCapture] 视频轨道:', stream.getVideoTracks().length, '个')
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        console.log('✅ [ARSceneCapture] 视频流已绑定到video元素')
      } else {
        console.warn('⚠️ [ARSceneCapture] videoRef.current 为null')
      }
      
      // 开始模拟平面检测
      console.log('🔍 [ARSceneCapture] 开始平面检测')
      startPlaneDetection()
    } catch (error) {
      console.error('❌ [ARSceneCapture] 启动摄像头失败:', error)
      console.error('❌ [ARSceneCapture] 错误详情:', error.message)
      alert('无法访问摄像头，请检查权限设置')
    }
  }

  const stopCamera = () => {
    console.log('🛑 [ARSceneCapture] stopCamera() 开始调用')
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      console.log('🛑 [ARSceneCapture] 停止', tracks.length, '个媒体轨道')
      tracks.forEach(track => track.stop())
      console.log('✅ [ARSceneCapture] 摄像头已停止')
    } else {
      console.warn('⚠️ [ARSceneCapture] 没有活动的摄像头流需要停止')
    }
  }

  // 模拟平面检测（实际应用中使用WebXR的plane-detection）
  const startPlaneDetection = () => {
    console.log('🔍 [ARSceneCapture] startPlaneDetection() 开始调用')
    // 模拟检测到平面
    const mockPlanes = [
      {
        id: 'plane_floor',
        type: 'floor',
        name: '地面',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: -Math.PI / 2, y: 0, z: 0 },
        size: { width: 4, height: 4 },
        polygon: [
          { x: -2, y: 0, z: -2 },
          { x: 2, y: 0, z: -2 },
          { x: 2, y: 0, z: 2 },
          { x: -2, y: 0, z: 2 }
        ],
        color: '#4a90d9'
      }
    ]
    
    console.log('✅ [ARSceneCapture] 初始平面检测完成，发现', mockPlanes.length, '个平面')
    console.log('📊 [ARSceneCapture] 平面详情:', mockPlanes.map(p => `${p.name}(${p.type})`).join(', '))
    
    setDetectedPlanes(mockPlanes)
  }

  // 开始采集场景数据
  const startCapture = () => {
    console.log('📸 [ARSceneCapture] startCapture() 开始调用')
    console.log('📸 [ARSceneCapture] 当前已检测平面数:', detectedPlanes.length)
    
    setIsCapturing(true)
    setCaptureProgress(0)
    
    console.log('⏱️ [ARSceneCapture] 开始采集计时器')
    
    // 模拟采集过程
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setCaptureProgress(progress)
      console.log('⏱️ [ARSceneCapture] 采集进度:', progress + '%')
      
      // 模拟检测到更多平面
      if (progress === 30) {
        console.log('🔍 [ARSceneCapture] 进度30%，检测到新平面: 墙面1')
        setDetectedPlanes(prev => {
          const newPlanes = [
            ...prev,
            {
              id: 'plane_wall_1',
              type: 'wall',
              name: '墙面1',
              position: { x: 0, y: 1.5, z: -3 },
              rotation: { x: 0, y: 0, z: 0 },
              size: { width: 4, height: 3 },
              polygon: [
                { x: -2, y: 0, z: 0 },
                { x: 2, y: 0, z: 0 },
                { x: 2, y: 3, z: 0 },
                { x: -2, y: 3, z: 0 }
              ],
              color: '#d94a4a'
            }
          ]
          console.log('📊 [ARSceneCapture] 当前平面总数:', newPlanes.length)
          return newPlanes
        })
      }
      
      if (progress === 60) {
        console.log('🔍 [ARSceneCapture] 进度60%，检测到新平面: 墙面2')
        setDetectedPlanes(prev => {
          const newPlanes = [
            ...prev,
            {
              id: 'plane_wall_2',
              type: 'wall',
              name: '墙面2',
              position: { x: 3, y: 1.5, z: 0 },
              rotation: { x: 0, y: -Math.PI / 2, z: 0 },
              size: { width: 4, height: 3 },
              polygon: [
                { x: 0, y: 0, z: -2 },
                { x: 0, y: 0, z: 2 },
                { x: 0, y: 3, z: 2 },
                { x: 0, y: 3, z: -2 }
              ],
              color: '#d94a4a'
            }
          ]
          console.log('📊 [ARSceneCapture] 当前平面总数:', newPlanes.length)
          return newPlanes
        })
      }
      
      if (progress >= 100) {
        console.log('✅ [ARSceneCapture] 采集进度100%，完成采集')
        clearInterval(interval)
        finishCapture()
      }
    }, 200)
  }

  // 完成采集
  const finishCapture = async () => {
    console.log('🏁 [ARSceneCapture] finishCapture() 开始调用')
    console.log('📊 [ARSceneCapture] 最终检测到的平面数:', detectedPlanes.length)
    
    // 生成缩略图
    console.log('🖼️ [ARSceneCapture] 开始生成缩略图')
    const thumbnail = await generateThumbnail()
    console.log('✅ [ARSceneCapture] 缩略图生成完成:', thumbnail ? '成功' : '失败')
    
    // 保存场景数据
    console.log('💾 [ARSceneCapture] 开始构建场景数据对象')
    const sceneData = {
      version: '1.0.0',
      metadata: {
        name: `场景_${new Date().toLocaleString()}`,
        createdAt: new Date().toISOString(),
        thumbnail
      },
      environment: {
        planes: detectedPlanes.map(plane => ({
          id: plane.id,
          type: plane.type,
          name: plane.name,
          position: plane.position,
          rotation: plane.rotation,
          size: plane.size,
          polygon: plane.polygon
        })),
        lightEstimate: {
          ambientIntensity: 0.8,
          ambientColorTemperature: 5500,
          primaryLightDirection: { x: 0.5, y: 1, z: 0.3 },
          primaryLightIntensity: 1.0
        },
        cameraPose: {
          position: { x: 0, y: 1.6, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          fov: 60
        }
      }
    }
    
    console.log('📦 [ARSceneCapture] 场景数据构建完成:')
    console.log('   - 版本:', sceneData.version)
    console.log('   - 平面数:', sceneData.environment.planes.length)
    console.log('   - 创建时间:', sceneData.metadata.createdAt)
    
    sceneDataRef.current = sceneData
    setCapturedData(sceneData)
    setIsCapturing(false)
    setShowPreview(true)
    console.log('✅ [ARSceneCapture] 采集完成，显示预览界面')
  }

  // 生成缩略图
  const generateThumbnail = () => {
    console.log('🖼️ [ARSceneCapture] generateThumbnail() 开始调用')
    return new Promise((resolve) => {
      if (!videoRef.current) {
        console.warn('⚠️ [ARSceneCapture] videoRef.current 为null，无法生成缩略图')
        resolve(null)
        return
      }
      
      const canvas = document.createElement('canvas')
      canvas.width = 320
      canvas.height = 180
      const ctx = canvas.getContext('2d')
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
      
      // 绘制检测到的平面示意
      ctx.strokeStyle = '#4a90d9'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(80, 120)
      ctx.lineTo(240, 120)
      ctx.lineTo(260, 140)
      ctx.lineTo(60, 140)
      ctx.closePath()
      ctx.stroke()
      
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    })
  }

  // 保存场景
  const saveScene = (sceneName) => {
    console.log('💾 [ARSceneCapture] saveScene() 开始调用')
    console.log('💾 [ARSceneCapture] 场景名称:', sceneName)
    
    const sceneData = {
      ...sceneDataRef.current,
      metadata: {
        ...sceneDataRef.current.metadata,
        name: sceneName || sceneDataRef.current.metadata.name
      }
    }
    
    // 生成场景ID
    const sceneId = `scene_${Date.now()}`
    console.log('🆔 [ARSceneCapture] 生成场景ID:', sceneId)
    
    // 保存到本地存储
    console.log('💾 [ARSceneCapture] 保存到localStorage...')
    const scenes = JSON.parse(localStorage.getItem('ar-director-scenes') || '[]')
    console.log('📊 [ARSceneCapture] 当前已有场景数:', scenes.length)
    
    scenes.push({
      id: sceneId,
      ...sceneData.metadata,
      environment: sceneData.environment
    })
    localStorage.setItem('ar-director-scenes', JSON.stringify(scenes))
    console.log('✅ [ARSceneCapture] 场景保存成功')
    console.log('📊 [ARSceneCapture] 保存后场景总数:', scenes.length)
    
    // 跳转到时间轴编辑器
    console.log('🚀 [ARSceneCapture] 跳转到时间轴编辑器:', `/ar-director/edit/${sceneId}`)
    navigate(`/ar-director/edit/${sceneId}`)
  }

  // 重新采集
  const retake = () => {
    setCapturedData(null)
    setShowPreview(false)
    setCaptureProgress(0)
    setDetectedPlanes([
      {
        id: 'plane_floor',
        type: 'floor',
        name: '地面',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: -Math.PI / 2, y: 0, z: 0 },
        size: { width: 4, height: 4 },
        polygon: [
          { x: -2, y: 0, z: -2 },
          { x: 2, y: 0, z: -2 },
          { x: 2, y: 0, z: 2 },
          { x: -2, y: 0, z: 2 }
        ],
        color: '#4a90d9'
      }
    ])
  }

  // 渲染3D平面预览
  const renderPlanePreview = () => {
    if (!canvasRef.current || detectedPlanes.length === 0) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // 绘制背景
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // 绘制网格
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, canvas.height)
      ctx.stroke()
    }
    for (let i = 0; i < canvas.height; i += 40) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(canvas.width, i)
      ctx.stroke()
    }
    
    // 绘制检测到的平面
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const scale = 40 // 1米 = 40像素
    
    detectedPlanes.forEach(plane => {
      ctx.save()
      
      // 绘制平面
      ctx.fillStyle = plane.color + '40' // 25%透明度
      ctx.strokeStyle = plane.color
      ctx.lineWidth = 2
      
      ctx.beginPath()
      if (plane.polygon && plane.polygon.length > 0) {
        const first = plane.polygon[0]
        ctx.moveTo(
          centerX + first.x * scale,
          centerY - first.z * scale
        )
        
        for (let i = 1; i < plane.polygon.length; i++) {
          const point = plane.polygon[i]
          ctx.lineTo(
            centerX + point.x * scale,
            centerY - point.z * scale
          )
        }
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      
      // 绘制平面名称
      ctx.fillStyle = '#fff'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(
        plane.name,
        centerX + plane.position.x * scale,
        centerY - plane.position.z * scale
      )
      
      ctx.restore()
    })
    
    // 绘制相机位置
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2)
    ctx.fill()
    
    // 绘制相机朝向
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(centerX, centerY - 30)
    ctx.stroke()
  }

  // 当平面变化时重绘
  useEffect(() => {
    renderPlanePreview()
  }, [detectedPlanes])

  return (
    <div className={styles.container}>
      {/* 顶部导航 */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/ar-director')}>
          ← 返回
        </button>
        <h1 className={styles.title}>采集场景</h1>
        <button className={styles.skipBtn} onClick={() => navigate('/ar-director/edit/new')}>
          跳过
        </button>
      </header>

      {/* 主内容 */}
      <main className={styles.main}>
        {!showPreview ? (
          <>
            {/* 摄像头预览 */}
            <div className={styles.cameraSection}>
              <div className={styles.cameraContainer}>
                <video
                  ref={videoRef}
                  className={styles.cameraVideo}
                  autoPlay
                  playsInline
                  muted
                />
                
                {/* 平面覆盖层 */}
                <div className={styles.planeOverlay}>
                  {detectedPlanes.map(plane => (
                    <div
                      key={plane.id}
                      className={`${styles.planeMarker} ${styles[plane.type]}`}
                      style={{
                        left: `${50 + plane.position.x * 10}%`,
                        top: `${50 - plane.position.z * 10}%`,
                        width: `${plane.size.width * 10}%`,
                        height: `${plane.size.height * 10}%`
                      }}
                    >
                      <span className={styles.planeLabel}>{plane.name}</span>
                    </div>
                  ))}
                </div>

                {/* 采集进度 */}
                {isCapturing && (
                  <div className={styles.captureProgress}>
                    <div className={styles.progressRing}>
                      <svg viewBox="0 0 100 100">
                        <circle
                          className={styles.progressBg}
                          cx="50"
                          cy="50"
                          r="45"
                        />
                        <circle
                          className={styles.progressFill}
                          cx="50"
                          cy="50"
                          r="45"
                          style={{
                            strokeDasharray: `${2 * Math.PI * 45}`,
                            strokeDashoffset: `${2 * Math.PI * 45 * (1 - captureProgress / 100)}`
                          }}
                        />
                      </svg>
                      <span className={styles.progressText}>{captureProgress}%</span>
                    </div>
                    <p className={styles.progressLabel}>正在采集环境数据...</p>
                  </div>
                )}
              </div>
            </div>

            {/* 检测到的平面列表 */}
            <div className={styles.planesSection}>
              <h3>📐 检测到的平面 ({detectedPlanes.length})</h3>
              <div className={styles.planesList}>
                {detectedPlanes.map(plane => (
                  <div key={plane.id} className={styles.planeCard}>
                    <div 
                      className={styles.planeColor}
                      style={{ backgroundColor: plane.color }}
                    />
                    <div className={styles.planeInfo}>
                      <span className={styles.planeName}>{plane.name}</span>
                      <span className={styles.planeSize}>
                        {plane.size.width.toFixed(1)}m × {plane.size.height.toFixed(1)}m
                      </span>
                    </div>
                    <span className={styles.planeType}>
                      {plane.type === 'floor' ? '🟦 地面' : '🟥 墙面'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 提示 */}
            <div className={styles.tips}>
              <p>💡 缓慢移动手机，让系统检测更多平面</p>
              <p>检测到的平面将用于放置角色</p>
            </div>

            {/* 控制按钮 */}
            <div className={styles.controls}>
              {!isCapturing ? (
                <button className={styles.captureBtn} onClick={startCapture}>
                  <span className={styles.captureIcon}>📷</span>
                  <span>开始采集</span>
                </button>
              ) : (
                <button className={styles.capturingBtn} disabled>
                  <span className={styles.spinner}></span>
                  <span>采集中...</span>
                </button>
              )}
            </div>
          </>
        ) : (
          /* 预览界面 */
          <div className={styles.previewSection}>
            <h2 className={styles.previewTitle}>场景采集完成</h2>
            
            {/* 3D平面预览 */}
            <div className={styles.preview3D}>
              <canvas 
                ref={canvasRef}
                width={320}
                height={240}
                className={styles.previewCanvas}
              />
              <p className={styles.previewLabel}>检测到的平面布局</p>
            </div>

            {/* 场景信息 */}
            <div className={styles.sceneInfo}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>平面数量:</span>
                <span className={styles.infoValue}>{detectedPlanes.length} 个</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>地面:</span>
                <span className={styles.infoValue}>
                  {detectedPlanes.filter(p => p.type === 'floor').length} 个
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>墙面:</span>
                <span className={styles.infoValue}>
                  {detectedPlanes.filter(p => p.type === 'wall').length} 个
                </span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className={styles.previewActions}>
              <button className={styles.retakeBtn} onClick={retake}>
                🔄 重新采集
              </button>
              <button 
                className={styles.useSceneBtn}
                onClick={() => {
                  const name = prompt('请输入场景名称:', capturedData?.metadata?.name)
                  if (name) saveScene(name)
                }}
              >
                ✨ 使用此场景
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default ARSceneCapture
