import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import styles from './ARSceneRecorder.module.css'

/**
 * AR场景录制页面
 * 录制现实场景视频 + AR数据（平面、光照、相机位姿）
 */
export function ARSceneRecorder() {
  const navigate = useNavigate()
  const location = useLocation()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  
  // 获取返回路径，如果没有则默认返回到ar-director
  const returnPath = location.state?.returnPath || '/ar-director'
  
  const [isRecording, setIsRecording] = useState(false)
  const [recordedTime, setRecordedTime] = useState(0)
  const [detectedPlanes, setDetectedPlanes] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [recordedVideo, setRecordedVideo] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  
  // AR数据收集
  const arDataRef = useRef({
    planes: [],
    lightEstimates: [],
    cameraPoses: [],
    startTime: null
  })
  
  // MediaRecorder
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])
  const recordingTimerRef = useRef(null)

  // 启动摄像头
  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1920, height: 1080 },
        audio: false
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('启动摄像头失败:', error)
      alert('无法访问摄像头，请检查权限设置')
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop())
    }
  }

  // 开始录制
  const startRecording = () => {
    if (!videoRef.current || !videoRef.current.srcObject) {
      alert('摄像头未就绪')
      return
    }

    // 重置数据
    recordedChunksRef.current = []
    arDataRef.current = {
      planes: [],
      lightEstimates: [],
      cameraPoses: [],
      startTime: Date.now()
    }

    // 创建MediaRecorder
    const stream = videoRef.current.srcObject
    const options = {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5000000
    }

    // 如果不支持VP9，降级到VP8
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'video/webm;codecs=vp8'
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'video/webm'
    }

    try {
      mediaRecorderRef.current = new MediaRecorder(stream, options)
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        setRecordedVideo(url)
        setShowPreview(true)
      }

      // 开始录制
      mediaRecorderRef.current.start(100) // 每100ms收集一次数据
      setIsRecording(true)
      setRecordedTime(0)

      // 计时器
      recordingTimerRef.current = setInterval(() => {
        setRecordedTime(prev => {
          const newTime = prev + 1
          // 自动停止（30秒限制）
          if (newTime >= 30) {
            stopRecording()
          }
          return newTime
        })
        
        // 收集AR数据（模拟）
        collectARData()
      }, 1000)

    } catch (error) {
      console.error('启动录制失败:', error)
      alert('录制启动失败')
    }
  }

  // 停止录制
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
    }
  }

  // 收集AR数据（模拟实现）
  const collectARData = () => {
    const now = Date.now()
    const elapsed = (now - arDataRef.current.startTime) / 1000

    // 模拟平面检测数据
    if (elapsed % 2 === 0) { // 每2秒记录一次
      arDataRef.current.planes.push({
        timestamp: elapsed,
        planes: [
          {
            id: 'floor_001',
            type: 'floor',
            center: [0, 0, 0],
            size: [2, 2]
          }
        ]
      })
    }

    // 模拟光照数据
    arDataRef.current.lightEstimates.push({
      timestamp: elapsed,
      ambientIntensity: 0.7 + Math.random() * 0.3,
      ambientColorTemperature: 5000 + Math.random() * 1000
    })

    // 更新检测到的平面显示
    setDetectedPlanes([
      { type: 'floor', count: 1 },
      { type: 'wall', count: Math.floor(Math.random() * 3) }
    ])
  }

  // 保存场景
  const saveScene = async (sceneName) => {
    if (!recordedVideo) return

    setIsSaving(true)

    try {
      // 获取视频blob
      const response = await fetch(recordedVideo)
      const videoBlob = await response.blob()

      // 创建场景数据
      const sceneData = {
        version: '1.0.0',
        metadata: {
          name: sceneName || `场景_${new Date().toLocaleString()}`,
          createdAt: new Date().toISOString(),
          duration: recordedTime
        },
        video: {
          blob: videoBlob,
          duration: recordedTime,
          width: 1920,
          height: 1080
        },
        arData: arDataRef.current
      }

      // 生成场景ID
      const sceneId = `scene_${Date.now()}`

      // 保存到本地存储（实际应用应该上传到服务器）
      const scenes = JSON.parse(localStorage.getItem('ar-director-scenes') || '[]')
      scenes.push({
        id: sceneId,
        ...sceneData.metadata,
        thumbnail: await generateThumbnail(videoBlob)
      })
      localStorage.setItem('ar-director-scenes', JSON.stringify(scenes))

      // 保存视频文件（使用IndexedDB或上传到服务器）
      await saveVideoToStorage(sceneId, videoBlob)

      alert('场景保存成功！')
      navigate('/ar-director')

    } catch (error) {
      console.error('保存场景失败:', error)
      alert('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  // 生成缩略图
  const generateThumbnail = (videoBlob) => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.src = URL.createObjectURL(videoBlob)
      video.currentTime = 1 // 第1秒的帧
      
      video.onloadeddata = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 320
        canvas.height = 180
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
    })
  }

  // 保存视频到存储
  const saveVideoToStorage = async (sceneId, blob) => {
    try {
      // 使用IndexedDB存储大文件
      const db = await openDB('AR-Director-V2', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('scenes')) {
            db.createObjectStore('scenes')
          }
        }
      })
      
      await db.put('scenes', blob, `${sceneId}_video`)
    } catch (error) {
      console.error('IndexedDB保存失败:', error)
      // 降级到localStorage存储元数据，不存储视频blob
      throw new Error('视频存储失败，可能是存储空间不足')
    }
  }

  // 重新录制
  const retake = () => {
    setRecordedVideo(null)
    setShowPreview(false)
    setRecordedTime(0)
    setDetectedPlanes([])
  }

  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={styles.container}>
      {/* 顶部导航 */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(returnPath)}>
          ← 返回
        </button>
        <h1 className={styles.title}>录制场景</h1>
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
                
                {/* AR覆盖层 */}
                <canvas
                  ref={canvasRef}
                  className={styles.arOverlay}
                />
                
                {/* 录制指示器 */}
                {isRecording && (
                  <div className={styles.recordingIndicator}>
                    <span className={styles.recordingDot}></span>
                    <span className={styles.recordingTime}>
                      {formatTime(recordedTime)}
                    </span>
                  </div>
                )}

                {/* 平面检测显示 */}
                <div className={styles.planeInfo}>
                  <div className={styles.planeTitle}>📐 检测到的平面:</div>
                  {detectedPlanes.map((plane, index) => (
                    <div key={index} className={styles.planeItem}>
                      {plane.type === 'floor' ? '🟦' : '🟥'} 
                      {plane.type === 'floor' ? '地面' : '墙面'} x{plane.count}
                    </div>
                  ))}
                  {detectedPlanes.length === 0 && (
                    <div className={styles.planeEmpty}>移动手机扫描环境...</div>
                  )}
                </div>
              </div>
            </div>

            {/* 提示文字 */}
            <div className={styles.tips}>
              <p>💡 提示: 缓慢移动手机，扫描整个场景</p>
              <p>建议录制时长: 10-30秒</p>
            </div>

            {/* 录制控制 */}
            <div className={styles.controls}>
              {!isRecording ? (
                <button 
                  className={styles.recordBtn}
                  onClick={startRecording}
                >
                  <span className={styles.recordBtnIcon}>🔴</span>
                  <span>开始录制</span>
                </button>
              ) : (
                <button 
                  className={styles.stopBtn}
                  onClick={stopRecording}
                >
                  <span className={styles.stopBtnIcon}>⏹️</span>
                  <span>停止录制</span>
                </button>
              )}
            </div>

            {/* 录制进度 */}
            {isRecording && (
              <div className={styles.progress}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${(recordedTime / 30) * 100}%` }}
                  />
                </div>
                <span className={styles.progressText}>
                  {formatTime(recordedTime)} / 00:30
                </span>
              </div>
            )}
          </>
        ) : (
          /* 预览界面 */
          <div className={styles.previewSection}>
            <h2 className={styles.previewTitle}>预览录制结果</h2>
            
            <video
              src={recordedVideo}
              className={styles.previewVideo}
              controls
              autoPlay
              loop
            />
            
            <div className={styles.previewInfo}>
              <p>时长: {formatTime(recordedTime)}</p>
              <p>分辨率: 1920x1080</p>
              <p>格式: WebM</p>
            </div>

            <div className={styles.previewActions}>
              <button 
                className={styles.retakeBtn}
                onClick={retake}
                disabled={isSaving}
              >
                🔄 重新录制
              </button>
              
              <button 
                className={styles.saveBtn}
                onClick={() => {
                  const name = prompt('请输入场景名称:', `场景_${new Date().toLocaleString()}`)
                  if (name) saveScene(name)
                }}
                disabled={isSaving}
              >
                {isSaving ? '保存中...' : '💾 保存场景'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// 简单的IndexedDB封装
function openDB(name, version, upgradeCallback) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      try {
        upgradeCallback(event.target.result)
      } catch (error) {
        console.error('Upgrade error:', error)
      }
    }
    request.onblocked = () => {
      console.warn('IndexedDB blocked')
      reject(new Error('IndexedDB blocked'))
    }
  })
}

export default ARSceneRecorder
