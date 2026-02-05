import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as THREE from 'three'
import styles from './styles.module.css'
import { MultiCharacterManager } from '../MultiCharacterManager.js'
import { loadVRMAAction } from '../../../data/vrmaActions.js'
import { actions as vrmaActions } from '../../../data/actions250.js'

/**
 * ARExportPro - 专业级导出界面（横屏版）
 * 
 * 功能：
 * 1. 左侧：导出设置面板（格式、分辨率、帧率、质量）
 * 2. 右侧：3D预览窗口 + 渲染进度 + 结果预览
 * 3. 支持视频和GIF导出
 */
export function ARExportPro() {
  const navigate = useNavigate()
  const { sceneId } = useParams()
  
  // Three.js引用
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const characterManagerRef = useRef(null)
  
  // 项目数据
  const [project, setProject] = useState(null)
  const [scene, setScene] = useState(null)
  const [characters, setCharacters] = useState([])
  const [tracks, setTracks] = useState([])
  const [duration, setDuration] = useState(30)
  
  // 导出设置
  const [exportFormat, setExportFormat] = useState('video')
  const [resolution, setResolution] = useState('1080p')
  const [fps, setFps] = useState(30)
  const [quality, setQuality] = useState('high')
  
  // 渲染状态
  const [isRendering, setIsRendering] = useState(false)
  const [renderProgress, setRenderProgress] = useState(0)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [totalFrames, setTotalFrames] = useState(0)
  const [renderTime, setRenderTime] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState(0)
  const [renderedBlob, setRenderedBlob] = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  // 初始化
  useEffect(() => {
    initThreeJS()
    loadProject()
    return () => cleanup()
  }, [])

  const initThreeJS = () => {
    if (!canvasRef.current) return
    
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    sceneRef.current = scene
    
    const camera = new THREE.PerspectiveCamera(60, 16/9, 0.1, 100)
    camera.position.set(0, 1.6, 3)
    cameraRef.current = camera
    
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      preserveDrawingBuffer: true
    })
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    rendererRef.current = renderer
    
    // 灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 7)
    scene.add(directionalLight)
    
    // 网格
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
    scene.add(gridHelper)
    
    // 角色管理器
    characterManagerRef.current = new MultiCharacterManager(scene)
  }

  const loadProject = async () => {
    try {
      // 加载场景数据
      const scenes = JSON.parse(localStorage.getItem('ar-director-scenes') || '[]')
      const currentScene = scenes.find(s => s.id === sceneId)
      
      if (currentScene) {
        setScene(currentScene)
        if (currentScene.environment?.planes) {
          visualizePlanes(currentScene.environment.planes)
        }
      }
      
      // 加载项目数据
      const projects = JSON.parse(localStorage.getItem('ar-director-projects') || '[]')
      const currentProject = projects.find(p => p.id === sceneId)
      
      if (currentProject) {
        setProject(currentProject)
        setDuration(currentProject.duration || 30)
        setTracks(currentProject.tracks || [])
        
        // 加载角色
        if (currentProject.characters?.length > 0) {
          for (const charData of currentProject.characters) {
            await loadCharacter(charData)
          }
        }
      }
    } catch (error) {
      console.error('加载项目失败:', error)
    }
  }

  const visualizePlanes = (planes) => {
    if (!sceneRef.current) return
    
    planes.forEach(plane => {
      const geometry = new THREE.PlaneGeometry(plane.size.width, plane.size.height)
      const material = new THREE.MeshBasicMaterial({
        color: plane.color || '#4a90d9',
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
      })
      
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(plane.position.x, plane.position.y, plane.position.z)
      mesh.rotation.set(plane.rotation.x, plane.rotation.y, plane.rotation.z)
      sceneRef.current.add(mesh)
    })
  }

  const loadCharacter = async (charData) => {
    try {
      const characterId = await characterManagerRef.current.addCharacter(charData.vrmUrl, {
        name: charData.name,
        position: charData.initialPosition,
        rotation: charData.initialRotation,
        scale: charData.initialScale
      })
      
      const character = characterManagerRef.current.getCharacter(characterId)
      setCharacters(prev => [...prev, character])
    } catch (error) {
      console.error('加载角色失败:', error)
    }
  }

  // 开始渲染
  const startRender = async () => {
    setIsRendering(true)
    setRenderProgress(0)
    setRenderedBlob(null)
    setShowPreview(false)
    
    const startTime = Date.now()
    
    try {
      if (exportFormat === 'video') {
        await renderVideo(startTime)
      } else {
        await renderGIF(startTime)
      }
      
      const elapsed = (Date.now() - startTime) / 1000
      setRenderTime(elapsed)
    } catch (error) {
      console.error('渲染失败:', error)
      alert('渲染失败: ' + error.message)
    } finally {
      setIsRendering(false)
    }
  }

  // 渲染视频
  const renderVideo = async (startTime) => {
    const { width, height } = getResolution()
    rendererRef.current.setSize(width, height)
    
    const stream = canvasRef.current.captureStream(fps)
    const mimeType = getSupportedMimeType()
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: getBitrate()
    })
    
    const chunks = []
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType })
      setRenderedBlob(blob)
      setShowPreview(true)
    }
    
    mediaRecorder.start(100)
    
    const totalFramesCount = Math.floor(duration * fps)
    setTotalFrames(totalFramesCount)
    
    for (let i = 0; i < totalFramesCount; i++) {
      const time = i / fps
      setCurrentFrame(i)
      setRenderProgress((i / totalFramesCount) * 100)
      
      await updateSceneAtTime(time)
      rendererRef.current.render(sceneRef.current, cameraRef.current)
      
      const elapsed = (Date.now() - startTime) / 1000
      const avgTimePerFrame = elapsed / (i + 1)
      const remainingFrames = totalFramesCount - i - 1
      setEstimatedTime(avgTimePerFrame * remainingFrames)
      
      await new Promise(resolve => setTimeout(resolve, 1000 / fps))
    }
    
    mediaRecorder.stop()
  }

  // 渲染GIF
  const renderGIF = async (startTime) => {
    const { width, height } = getResolution()
    const gifWidth = Math.min(width, 480)
    const gifHeight = Math.floor(gifWidth * (height / width))
    
    rendererRef.current.setSize(gifWidth, gifHeight)
    
    const frames = []
    const totalFramesCount = Math.floor(duration * fps)
    setTotalFrames(totalFramesCount)
    
    for (let i = 0; i < totalFramesCount; i++) {
      const time = i / fps
      setCurrentFrame(i)
      setRenderProgress((i / totalFramesCount) * 50)
      
      await updateSceneAtTime(time)
      rendererRef.current.render(sceneRef.current, cameraRef.current)
      
      const canvas = document.createElement('canvas')
      canvas.width = gifWidth
      canvas.height = gifHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(canvasRef.current, 0, 0, gifWidth, gifHeight)
      
      frames.push(canvas)
      
      const elapsed = (Date.now() - startTime) / 1000
      const avgTimePerFrame = elapsed / (i + 1)
      const remainingFrames = totalFramesCount - i - 1
      setEstimatedTime(avgTimePerFrame * remainingFrames)
    }
    
    // 使用gif.js编码
    setRenderProgress(50)
    const gif = new window.GIF({
      workers: 2,
      quality: quality === 'high' ? 10 : 20,
      width: gifWidth,
      height: gifHeight
    })
    
    frames.forEach((frame, index) => {
      gif.addFrame(frame, { delay: 1000 / fps })
      if (index % 10 === 0) {
        setRenderProgress(50 + (index / frames.length) * 50)
      }
    })
    
    gif.on('finished', (blob) => {
      setRenderedBlob(blob)
      setShowPreview(true)
      setRenderProgress(100)
    })
    
    gif.render()
  }

  // 更新场景到指定时间
  const updateSceneAtTime = async (time) => {
    tracks.forEach(track => {
      const activeClips = track.clips?.filter(clip => 
        time >= clip.startTime && time <= clip.startTime + clip.duration
      )
      
      activeClips?.forEach(clip => {
        if (track.type === 'action' && clip.actionId) {
          const character = characterManagerRef.current?.getCharacter(track.characterId)
          if (character) {
            const action = vrmaActions.find(a => a.id === clip.actionId)
            if (action) {
              loadVRMAAction(action.filePath, character.vrm).then(result => {
                if (result?.clip) {
                  characterManagerRef.current.playCharacterAction(
                    track.characterId,
                    result.clip,
                    { loop: true, transitionDuration: 0.3 }
                  )
                }
              })
            }
          }
        }
      })
    })
    
    characterManagerRef.current?.update(1 / fps)
  }

  // 获取分辨率
  const getResolution = () => {
    switch (resolution) {
      case '720p': return { width: 1280, height: 720 }
      case '1080p': return { width: 1920, height: 1080 }
      case '4k': return { width: 3840, height: 2160 }
      default: return { width: 1920, height: 1080 }
    }
  }

  // 获取支持的MIME类型
  const getSupportedMimeType = () => {
    const types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ]
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type
    }
    return 'video/webm'
  }

  // 获取码率
  const getBitrate = () => {
    switch (quality) {
      case 'standard': return 5000000
      case 'high': return 10000000
      case 'lossless': return 50000000
      default: return 10000000
    }
  }

  // 下载文件
  const downloadFile = () => {
    if (!renderedBlob) return
    
    const url = URL.createObjectURL(renderedBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project?.name || scene?.name || 'export'}.${exportFormat === 'video' ? 'webm' : 'gif'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const cleanup = () => {
    if (characterManagerRef.current) {
      characterManagerRef.current.dispose()
    }
    if (rendererRef.current) {
      rendererRef.current.dispose()
    }
  }

  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={styles.container}>
      {/* 顶部栏 */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <h1 className={styles.title}>🎬 导出项目</h1>
        <div className={styles.projectInfo}>
          {project?.name || scene?.name || '未命名项目'}
        </div>
      </header>

      {/* 主内容区 */}
      <main className={styles.main}>
        {/* 左侧设置面板 */}
        <aside className={styles.settingsPanel}>
          <h2 className={styles.panelTitle}>导出设置</h2>
          
          {/* 格式选择 */}
          <div className={styles.settingGroup}>
            <label className={styles.settingLabel}>导出格式</label>
            <div className={styles.formatOptions}>
              <button 
                className={`${styles.formatBtn} ${exportFormat === 'video' ? styles.active : ''}`}
                onClick={() => setExportFormat('video')}
                disabled={isRendering}
              >
                <span className={styles.formatIcon}>🎬</span>
                <div className={styles.formatInfo}>
                  <span className={styles.formatName}>视频</span>
                  <span className={styles.formatDesc}>MP4/WebM 格式</span>
                </div>
              </button>
              <button 
                className={`${styles.formatBtn} ${exportFormat === 'gif' ? styles.active : ''}`}
                onClick={() => setExportFormat('gif')}
                disabled={isRendering}
              >
                <span className={styles.formatIcon}>🎞️</span>
                <div className={styles.formatInfo}>
                  <span className={styles.formatName}>GIF</span>
                  <span className={styles.formatDesc}>动画图片</span>
                </div>
              </button>
            </div>
          </div>

          {/* 分辨率 */}
          <div className={styles.settingGroup}>
            <label className={styles.settingLabel}>分辨率</label>
            <select 
              className={styles.select}
              value={resolution} 
              onChange={(e) => setResolution(e.target.value)}
              disabled={isRendering}
            >
              <option value="720p">720P (1280×720)</option>
              <option value="1080p">1080P (1920×1080)</option>
              <option value="4k">4K (3840×2160)</option>
            </select>
          </div>

          {/* 帧率 */}
          <div className={styles.settingGroup}>
            <label className={styles.settingLabel}>帧率</label>
            <div className={styles.radioGroup}>
              {[24, 30, 60].map(f => (
                <label key={f} className={`${styles.radioLabel} ${fps === f ? styles.active : ''}`}>
                  <input
                    type="radio"
                    value={f}
                    checked={fps === f}
                    onChange={() => setFps(f)}
                    disabled={isRendering}
                  />
                  <span>{f}fps</span>
                </label>
              ))}
            </div>
          </div>

          {/* 质量 */}
          <div className={styles.settingGroup}>
            <label className={styles.settingLabel}>质量</label>
            <div className={styles.qualityOptions}>
              {['standard', 'high', 'lossless'].map(q => (
                <button
                  key={q}
                  className={`${styles.qualityBtn} ${quality === q ? styles.active : ''}`}
                  onClick={() => setQuality(q)}
                  disabled={isRendering}
                >
                  {q === 'standard' && '标准'}
                  {q === 'high' && '高清'}
                  {q === 'lossless' && '无损'}
                </button>
              ))}
            </div>
          </div>

          {/* 项目信息 */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>📊 项目信息</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>时长</span>
                <span className={styles.infoValue}>{duration} 秒</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>总帧数</span>
                <span className={styles.infoValue}>{Math.floor(duration * fps)} 帧</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>预估大小</span>
                <span className={styles.infoValue}>~{((duration * getBitrate() / 8 / 1024 / 1024)).toFixed(0)} MB</span>
              </div>
            </div>
          </div>

          {/* 开始渲染按钮 */}
          {!isRendering && !showPreview && (
            <button className={styles.renderBtn} onClick={startRender}>
              <span className={styles.renderIcon}>▶️</span>
              <span>开始渲染</span>
            </button>
          )}
        </aside>

        {/* 右侧预览区 */}
        <div className={styles.previewSection}>
          <div className={styles.canvasContainer}>
            <canvas ref={canvasRef} className={styles.canvas} />
            
            {/* 渲染进度覆盖层 */}
            {isRendering && (
              <div className={styles.renderOverlay}>
                <div className={styles.progressCard}>
                  <div className={styles.progressCircle}>
                    <svg viewBox="0 0 100 100">
                      <circle className={styles.progressBg} cx="50" cy="50" r="45" />
                      <circle 
                        className={styles.progressFill} 
                        cx="50" cy="50" r="45"
                        style={{
                          strokeDasharray: `${2 * Math.PI * 45}`,
                          strokeDashoffset: `${2 * Math.PI * 45 * (1 - renderProgress / 100)}`
                        }}
                      />
                    </svg>
                    <span className={styles.progressPercent}>{Math.round(renderProgress)}%</span>
                  </div>
                  
                  <div className={styles.progressDetails}>
                    <p className={styles.progressText}>正在渲染... {currentFrame}/{totalFrames} 帧</p>
                    <div className={styles.timeInfo}>
                      <span>⏱️ 已用: {formatTime(renderTime)}</span>
                      <span>⏳ 剩余: {formatTime(estimatedTime)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 渲染完成预览 */}
            {showPreview && renderedBlob && (
              <div className={styles.previewOverlay}>
                <div className={styles.previewCard}>
                  <h3 className={styles.previewTitle}>✅ 渲染完成！</h3>
                  {exportFormat === 'video' ? (
                    <video 
                      src={URL.createObjectURL(renderedBlob)} 
                      controls 
                      className={styles.previewVideo}
                    />
                  ) : (
                    <img 
                      src={URL.createObjectURL(renderedBlob)} 
                      alt="GIF Preview" 
                      className={styles.previewImage}
                    />
                  )}
                  <div className={styles.previewActions}>
                    <button className={styles.downloadBtn} onClick={downloadFile}>
                      💾 下载文件
                    </button>
                    <button 
                      className={styles.reRenderBtn} 
                      onClick={() => {
                        setShowPreview(false)
                        setRenderedBlob(null)
                      }}
                    >
                      🔄 重新渲染
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default ARExportPro
