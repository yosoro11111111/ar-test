import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import * as THREE from 'three'
import styles from './ARSceneRecorderNew.module.css'

/**
 * AR场景录制页面 - 新版
 * 与MMD场景集成，支持虚实结合拍摄
 */
export function ARSceneRecorderNew() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // 获取返回路径和MMD项目数据
  const returnPath = location.state?.returnPath || '/ar-director/mmd'
  const mmdProject = location.state?.mmdProject || null
  
  // 视频和AR引用
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  
  // 状态
  const [isRecording, setIsRecording] = useState(false)
  const [recordedTime, setRecordedTime] = useState(0)
  const [showMMDPreview, setShowMMDPreview] = useState(true)
  const [mmdOpacity, setMmdOpacity] = useState(0.7)
  const [isSaving, setIsSaving] = useState(false)
  const [recordedVideo, setRecordedVideo] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  
  // MediaRecorder
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])
  const recordingTimerRef = useRef(null)
  const streamRef = useRef(null)

  // 启动摄像头和Three.js
  useEffect(() => {
    initAR()
    return () => {
      stopCamera()
      if (rendererRef.current) {
        rendererRef.current.dispose()
      }
    }
  }, [])

  const initAR = async () => {
    try {
      // 启动摄像头
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', 
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: true
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // 初始化Three.js
      initThreeJS()
      
    } catch (error) {
      console.error('启动AR失败:', error)
      setCameraError('无法访问摄像头，请检查权限设置')
    }
  }

  const initThreeJS = () => {
    if (!canvasRef.current || !videoRef.current) return

    const canvas = canvasRef.current
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    // 场景
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // 相机
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.set(0, 1.6, 3)
    cameraRef.current = camera

    // 渲染器
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    rendererRef.current = renderer

    // 灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 7)
    scene.add(directionalLight)

    // 如果有MMD项目，加载场景预览
    if (mmdProject) {
      loadMMDScene(scene, mmdProject)
    }

    // 开始渲染循环
    animate()
  }

  const loadMMDScene = (scene, project) => {
    // 创建简单的MMD场景预览
    // 这里可以加载实际的MMD模型和场景
    
    // 添加地面网格
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
    gridHelper.position.y = 0
    scene.add(gridHelper)

    // 添加示例角色（立方体代替）
    project.characters?.forEach((char, index) => {
      const geometry = new THREE.BoxGeometry(0.5, 1.8, 0.3)
      const material = new THREE.MeshStandardMaterial({ 
        color: char.color || 0x00ff00,
        transparent: true,
        opacity: 0.8
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(
        char.initialPosition?.x || (index - 1) * 2,
        0.9,
        char.initialPosition?.z || 0
      )
      mesh.name = `character_${char.id}`
      scene.add(mesh)
    })
  }

  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return

    requestAnimationFrame(animate)
    rendererRef.current.render(sceneRef.current, cameraRef.current)
  }, [])

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
  }

  // 开始录制
  const startRecording = () => {
    if (!streamRef.current) {
      alert('摄像头未就绪')
      return
    }

    recordedChunksRef.current = []

    const options = {
      mimeType: 'video/webm;codecs=vp9,opus',
      videoBitsPerSecond: 8000000
    }

    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'video/webm;codecs=vp8,opus'
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'video/webm'
    }

    try {
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options)
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        setRecordedVideo({ url, blob })
        setShowPreview(true)
      }

      mediaRecorderRef.current.start(100)
      setIsRecording(true)
      setRecordedTime(0)

      // 录制计时器
      recordingTimerRef.current = setInterval(() => {
        setRecordedTime(prev => {
          if (prev >= 60) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)

    } catch (error) {
      console.error('录制失败:', error)
      alert('录制启动失败: ' + error.message)
    }
  }

  // 停止录制
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(recordingTimerRef.current)
    }
  }

  // 保存到MMD项目
  const saveToProject = async () => {
    if (!recordedVideo) return

    setIsSaving(true)
    
    try {
      // 保存到内存存储
      const sceneId = `ar_scene_${Date.now()}`
      
      if (!window.arDirectorVideos) {
        window.arDirectorVideos = {}
      }
      
      window.arDirectorVideos[`${sceneId}_video`] = {
        url: recordedVideo.url,
        blob: recordedVideo.blob,
        timestamp: Date.now(),
        type: 'ar-recording',
        duration: recordedTime
      }

      // 返回MMD界面并传递场景数据
      navigate(returnPath, {
        state: {
          newScene: {
            id: sceneId,
            name: `AR录制 ${new Date().toLocaleString()}`,
            videoUrl: recordedVideo.url,
            duration: recordedTime,
            type: 'ar-recording'
          }
        }
      })

    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  // 下载视频
  const downloadVideo = () => {
    if (!recordedVideo) return
    
    const link = document.createElement('a')
    link.href = recordedVideo.url
    link.download = `ar-recording-${Date.now()}.webm`
    link.click()
  }

  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (cameraError) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>📷</div>
        <h2>摄像头访问失败</h2>
        <p>{cameraError}</p>
        <button onClick={() => navigate(returnPath)}>返回</button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* 顶部导航 */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(returnPath)}>
          ← 返回
        </button>
        <h1 className={styles.title}>AR场景录制</h1>
        <div className={styles.placeholder}></div>
      </div>

      {/* 主预览区域 */}
      <div className={styles.previewArea}>
        {/* 摄像头视频 */}
        <video
          ref={videoRef}
          className={styles.video}
          autoPlay
          playsInline
          muted
        />
        
        {/* Three.js AR叠加层 */}
        {showMMDPreview && (
          <canvas
            ref={canvasRef}
            className={styles.arCanvas}
            style={{ opacity: mmdOpacity }}
          />
        )}

        {/* 录制指示器 */}
        {isRecording && (
          <div className={styles.recordingIndicator}>
            <span className={styles.recordingDot}></span>
            <span className={styles.recordingTime}>{formatTime(recordedTime)}</span>
          </div>
        )}

        {/* MMD场景信息 */}
        {mmdProject && (
          <div className={styles.mmdInfo}>
            <span className={styles.mmdBadge}>MMD场景</span>
            <span className={styles.mmdName}>{mmdProject.name}</span>
          </div>
        )}
      </div>

      {/* 控制面板 */}
      <div className={styles.controls}>
        {/* MMD预览控制 */}
        <div className={styles.controlSection}>
          <label className={styles.controlLabel}>MMD场景叠加</label>
          <div className={styles.controlRow}>
            <button
              className={`${styles.toggleBtn} ${showMMDPreview ? styles.active : ''}`}
              onClick={() => setShowMMDPreview(!showMMDPreview)}
            >
              {showMMDPreview ? '👁️ 显示' : '🚫 隐藏'}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={mmdOpacity}
              onChange={(e) => setMmdOpacity(parseFloat(e.target.value))}
              className={styles.opacitySlider}
            />
            <span className={styles.opacityValue}>{Math.round(mmdOpacity * 100)}%</span>
          </div>
        </div>

        {/* 录制控制 */}
        <div className={styles.controlSection}>
          <label className={styles.controlLabel}>录制控制</label>
          <div className={styles.recordControls}>
            {!isRecording ? (
              <button
                className={styles.recordBtn}
                onClick={startRecording}
                disabled={!streamRef.current}
              >
                🔴 开始录制
              </button>
            ) : (
              <button
                className={styles.stopBtn}
                onClick={stopRecording}
              >
                ⏹️ 停止录制 ({formatTime(recordedTime)})
              </button>
            )}
          </div>
          <div className={styles.recordHint}>
            最长录制60秒
          </div>
        </div>
      </div>

      {/* 预览弹窗 */}
      {showPreview && recordedVideo && (
        <div className={styles.previewModal}>
          <div className={styles.previewContent}>
            <h3>录制预览</h3>
            <video
              src={recordedVideo.url}
              controls
              className={styles.previewVideo}
            />
            <div className={styles.previewActions}>
              <button
                className={styles.retakeBtn}
                onClick={() => {
                  setShowPreview(false)
                  setRecordedVideo(null)
                }}
              >
                🔄 重新录制
              </button>
              <button
                className={styles.downloadBtn}
                onClick={downloadVideo}
              >
                💾 下载视频
              </button>
              <button
                className={styles.saveBtn}
                onClick={saveToProject}
                disabled={isSaving}
              >
                {isSaving ? '保存中...' : '✅ 保存到项目'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
