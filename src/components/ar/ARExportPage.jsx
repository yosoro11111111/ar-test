import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as THREE from 'three'
import styles from './ARExportPage.module.css'
import { MultiCharacterManager } from './MultiCharacterManager.js'
import { loadVRMAAction } from '../../data/vrmaActions.js'
import { actions as vrmaActions } from '../../data/actions250.js'

/**
 * AR渲染导出页面
 * 第三步：渲染生成视频/GIF
 */
export function ARExportPage() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  
  // Three.js相关
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const characterManagerRef = useRef(null)
  
  // 项目数据
  const [project, setProject] = useState(null)
  const [characters, setCharacters] = useState([])
  const [tracks, setTracks] = useState([])
  const [scenePlanes, setScenePlanes] = useState([])
  const [duration, setDuration] = useState(30)
  
  // 导出设置
  const [exportFormat, setExportFormat] = useState('video') // video | gif
  const [resolution, setResolution] = useState('1080p') // 720p | 1080p | 4k
  const [fps, setFps] = useState(30) // 24 | 30 | 60
  const [quality, setQuality] = useState('high') // standard | high | lossless
  
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
    console.log('🎬 [ARExport] 组件挂载，项目ID:', projectId)
    initThreeJS()
    loadProject()
    
    return () => {
      console.log('🧹 [ARExport] 组件卸载')
      cleanup()
    }
  }, [])

  const initThreeJS = () => {
    console.log('🎨 [ARExport] 初始化Three.js')
    if (!canvasRef.current) {
      console.error('❌ [ARExport] canvasRef.current 为null')
      return
    }
    
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    sceneRef.current = scene
    
    const camera = new THREE.PerspectiveCamera(
      60,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      100
    )
    camera.position.set(0, 1.6, 0)
    cameraRef.current = camera
    
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      preserveDrawingBuffer: true // 需要保留缓冲区用于截图
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
    
    console.log('✅ [ARExport] Three.js初始化完成')
  }

  const loadProject = async () => {
    console.log('📂 [ARExport] 加载项目数据')
    try {
      // 加载场景数据
      const scenes = JSON.parse(localStorage.getItem('ar-director-scenes') || '[]')
      const currentScene = scenes.find(s => s.id === projectId)
      
      if (currentScene?.environment?.planes) {
        console.log('🎯 [ARExport] 加载场景平面:', currentScene.environment.planes.length, '个')
        setScenePlanes(currentScene.environment.planes)
        visualizePlanes(currentScene.environment.planes)
      }
      
      // 加载项目数据
      const projects = JSON.parse(localStorage.getItem('ar-director-projects') || '[]')
      const currentProject = projects.find(p => p.id === projectId)
      
      if (currentProject) {
        console.log('✅ [ARExport] 找到项目:', currentProject.name)
        setProject(currentProject)
        setDuration(currentProject.duration || 30)
        setTracks(currentProject.tracks || [])
        
        // 加载角色
        if (currentProject.characters?.length > 0) {
          console.log('👥 [ARExport] 加载', currentProject.characters.length, '个角色')
          for (const charData of currentProject.characters) {
            await loadCharacter(charData)
          }
        }
      } else {
        console.warn('⚠️ [ARExport] 未找到项目')
      }
    } catch (error) {
      console.error('❌ [ARExport] 加载项目失败:', error)
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
      
      const edges = new THREE.EdgesGeometry(geometry)
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: plane.color || '#4a90d9',
        linewidth: 2 
      })
      const wireframe = new THREE.LineSegments(edges, lineMaterial)
      mesh.add(wireframe)
      
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
      
      // 预加载动作
      if (charData.actions) {
        for (const actionId of charData.actions) {
          const action = vrmaActions.find(a => a.id === actionId)
          if (action) {
            const result = await loadVRMAAction(action.filePath, character.vrm)
            if (result?.clip) {
              characterManagerRef.current.playCharacterAction(characterId, result.clip, {
                loop: true,
                transitionDuration: 0.3
              })
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ [ARExport] 加载角色失败:', error)
    }
  }

  // 开始渲染
  const startRender = async () => {
    console.log('🎬 [ARExport] 开始渲染')
    console.log('🎬 [ARExport] 导出格式:', exportFormat)
    console.log('🎬 [ARExport] 分辨率:', resolution)
    console.log('🎬 [ARExport] 帧率:', fps)
    console.log('🎬 [ARExport] 质量:', quality)
    
    setIsRendering(true)
    setRenderProgress(0)
    setRenderedBlob(null)
    setShowPreview(false)
    
    const startTime = Date.now()
    
    try {
      if (exportFormat === 'video') {
        await renderVideo()
      } else {
        await renderGIF()
      }
      
      const elapsed = (Date.now() - startTime) / 1000
      console.log('✅ [ARExport] 渲染完成，耗时:', elapsed.toFixed(2), '秒')
      setRenderTime(elapsed)
    } catch (error) {
      console.error('❌ [ARExport] 渲染失败:', error)
      alert('渲染失败: ' + error.message)
    } finally {
      setIsRendering(false)
    }
  }

  // 渲染视频
  const renderVideo = async () => {
    console.log('🎥 [ARExport] 开始渲染视频')
    
    // 获取分辨率
    const { width, height } = getResolution()
    console.log('🎥 [ARExport] 渲染分辨率:', width, 'x', height)
    
    // 设置渲染器尺寸
    rendererRef.current.setSize(width, height)
    
    // 创建MediaRecorder
    const stream = canvasRef.current.captureStream(fps)
    const mimeType = getSupportedMimeType()
    console.log('🎥 [ARExport] 使用编码格式:', mimeType)
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: getBitrate()
    })
    
    const chunks = []
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data)
        console.log('📦 [ARExport] 收到视频数据块，大小:', e.data.size)
      }
    }
    
    mediaRecorder.onstop = () => {
      console.log('🎥 [ARExport] MediaRecorder停止')
      const blob = new Blob(chunks, { type: mimeType })
      console.log('✅ [ARExport] 视频Blob创建成功，大小:', (blob.size / 1024 / 1024).toFixed(2), 'MB')
      setRenderedBlob(blob)
      setShowPreview(true)
    }
    
    // 开始录制
    mediaRecorder.start(100)
    console.log('🎥 [ARExport] MediaRecorder开始录制')
    
    // 逐帧渲染
    const totalFramesCount = Math.floor(duration * fps)
    setTotalFrames(totalFramesCount)
    console.log('🎥 [ARExport] 总帧数:', totalFramesCount)
    
    for (let i = 0; i < totalFramesCount; i++) {
      const time = i / fps
      setCurrentFrame(i)
      setRenderProgress((i / totalFramesCount) * 100)
      
      // 更新场景状态
      await updateSceneAtTime(time)
      
      // 渲染帧
      rendererRef.current.render(sceneRef.current, cameraRef.current)
      
      // 更新预估时间
      const elapsed = (Date.now() - startTime) / 1000
      const avgTimePerFrame = elapsed / (i + 1)
      const remainingFrames = totalFramesCount - i - 1
      setEstimatedTime(avgTimePerFrame * remainingFrames)
      
      // 每30帧输出一次日志
      if (i % 30 === 0) {
        console.log(`🎥 [ARExport] 渲染进度: ${i}/${totalFramesCount} (${((i/totalFramesCount)*100).toFixed(1)}%)`)
      }
      
      // 等待下一帧
      await new Promise(resolve => setTimeout(resolve, 1000 / fps))
    }
    
    // 停止录制
    mediaRecorder.stop()
    console.log('🎥 [ARExport] 视频渲染完成')
  }

  // 渲染GIF
  const renderGIF = async () => {
    console.log('🎞️ [ARExport] 开始渲染GIF')
    
    const { width, height } = getResolution()
    const gifWidth = Math.min(width, 480) // GIF限制尺寸
    const gifHeight = Math.floor(gifWidth * (height / width))
    
    console.log('🎞️ [ARExport] GIF尺寸:', gifWidth, 'x', gifHeight)
    
    rendererRef.current.setSize(gifWidth, gifHeight)
    
    // 收集帧
    const frames = []
    const totalFramesCount = Math.floor(duration * fps)
    setTotalFrames(totalFramesCount)
    
    console.log('🎞️ [ARExport] 收集帧数据，总数:', totalFramesCount)
    
    for (let i = 0; i < totalFramesCount; i++) {
      const time = i / fps
      setCurrentFrame(i)
      setRenderProgress((i / totalFramesCount) * 50) // 前50%用于收集帧
      
      // 更新场景
      await updateSceneAtTime(time)
      
      // 渲染
      rendererRef.current.render(sceneRef.current, cameraRef.current)
      
      // 获取像素数据
      const pixels = new Uint8Array(gifWidth * gifHeight * 4)
      rendererRef.current.readRenderTargetPixels(
        new THREE.WebGLRenderTarget(gifWidth, gifHeight),
        0, 0, gifWidth, gifHeight,
        pixels
      )
      
      frames.push({
        pixels,
        delay: 100 / fps // 百分之一秒
      })
      
      // 更新预估时间
      const elapsed = (Date.now() - startTime) / 1000
      const avgTimePerFrame = elapsed / (i + 1)
      const remainingFrames = totalFramesCount - i - 1
      setEstimatedTime(avgTimePerFrame * remainingFrames)
      
      if (i % 30 === 0) {
        console.log(`🎞️ [ARExport] 帧收集进度: ${i}/${totalFramesCount}`)
      }
    }
    
    console.log('✅ [ARExport] 帧收集完成，开始编码GIF')
    
    // 编码GIF
    setRenderProgress(50)
    const gifBlob = await encodeGIF(frames, gifWidth, gifHeight, (progress) => {
      setRenderProgress(50 + progress * 0.5)
    })
    
    console.log('✅ [ARExport] GIF编码完成，大小:', (gifBlob.size / 1024).toFixed(2), 'KB')
    setRenderedBlob(gifBlob)
    setShowPreview(true)
  }

  // 编码GIF
  const encodeGIF = async (frames, width, height, onProgress) => {
    console.log('🎞️ [ARExport] encodeGIF() 开始')
    
    // 使用gif.js库
    const gif = new window.GIF({
      workers: 2,
      quality: quality === 'high' ? 10 : 20,
      width,
      height,
      workerScript: '/gif.worker.js'
    })
    
    return new Promise((resolve, reject) => {
      gif.on('finished', (blob) => {
        console.log('🎞️ [ARExport] GIF编码完成')
        resolve(blob)
      })
      
      gif.on('progress', (progress) => {
        onProgress?.(progress)
      })
      
      // 添加帧
      frames.forEach((frame, index) => {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        
        const imageData = new ImageData(
          new Uint8ClampedArray(frame.pixels),
          width,
          height
        )
        ctx.putImageData(imageData, 0, 0)
        
        gif.addFrame(canvas, { delay: frame.delay })
        
        if (index % 10 === 0) {
          console.log(`🎞️ [ARExport] GIF添加帧: ${index}/${frames.length}`)
        }
      })
      
      console.log('🎞️ [ARExport] 开始渲染GIF')
      gif.render()
    })
  }

  // 更新场景到指定时间
  const updateSceneAtTime = async (time) => {
    // 更新角色动画
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
    
    // 更新角色动画Mixer
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
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
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
    a.download = `${project?.name || 'export'}.${exportFormat === 'video' ? 'webm' : 'gif'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    console.log('💾 [ARExport] 文件已下载')
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
      {/* 顶部导航 */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <h1 className={styles.title}>导出项目</h1>
        <div className={styles.headerInfo}>
          {project?.name}
        </div>
      </header>

      {/* 主内容 */}
      <main className={styles.main}>
        {/* 左侧设置面板 */}
        <aside className={styles.settingsPanel}>
          <h2>导出设置</h2>
          
          {/* 格式选择 */}
          <div className={styles.settingGroup}>
            <label>导出格式</label>
            <div className={styles.formatOptions}>
              <button 
                className={`${styles.formatBtn} ${exportFormat === 'video' ? styles.active : ''}`}
                onClick={() => setExportFormat('video')}
              >
                <span>🎬</span>
                <span>视频 (MP4/WebM)</span>
              </button>
              <button 
                className={`${styles.formatBtn} ${exportFormat === 'gif' ? styles.active : ''}`}
                onClick={() => setExportFormat('gif')}
              >
                <span>🎞️</span>
                <span>GIF 动画</span>
              </button>
            </div>
          </div>

          {/* 分辨率 */}
          <div className={styles.settingGroup}>
            <label>分辨率</label>
            <select 
              value={resolution} 
              onChange={(e) => setResolution(e.target.value)}
              disabled={isRendering}
            >
              <option value="720p">720P (1280x720)</option>
              <option value="1080p">1080P (1920x1080)</option>
              <option value="4k">4K (3840x2160) - Pro版</option>
            </select>
          </div>

          {/* 帧率 */}
          <div className={styles.settingGroup}>
            <label>帧率</label>
            <select 
              value={fps} 
              onChange={(e) => setFps(Number(e.target.value))}
              disabled={isRendering}
            >
              <option value={24}>24fps (电影感)</option>
              <option value={30}>30fps (标准)</option>
              <option value={60}>60fps (流畅)</option>
            </select>
          </div>

          {/* 质量 */}
          <div className={styles.settingGroup}>
            <label>质量</label>
            <select 
              value={quality} 
              onChange={(e) => setQuality(e.target.value)}
              disabled={isRendering}
            >
              <option value="standard">标准 (5Mbps)</option>
              <option value="high">高 (10Mbps)</option>
              <option value="lossless">无损 (50Mbps) - Pro版</option>
            </select>
          </div>

          {/* 项目信息 */}
          <div className={styles.projectInfo}>
            <div className={styles.infoRow}>
              <span>时长:</span>
              <span>{duration} 秒</span>
            </div>
            <div className={styles.infoRow}>
              <span>总帧数:</span>
              <span>{Math.floor(duration * fps)} 帧</span>
            </div>
            <div className={styles.infoRow}>
              <span>预估大小:</span>
              <span>~{((duration * getBitrate() / 8 / 1024 / 1024)).toFixed(0)} MB</span>
            </div>
          </div>

          {/* 开始渲染按钮 */}
          {!isRendering && !showPreview && (
            <button className={styles.renderBtn} onClick={startRender}>
              🎬 开始渲染
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
                <div className={styles.renderProgress}>
                  <div className={styles.progressRing}>
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
                  
                  <div className={styles.progressInfo}>
                    <p>正在渲染... {currentFrame}/{totalFrames} 帧</p>
                    <p>已用时间: {formatTime(renderTime)}</p>
                    <p>预计剩余: {formatTime(estimatedTime)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 渲染完成预览 */}
            {showPreview && renderedBlob && (
              <div className={styles.previewOverlay}>
                <h3>渲染完成！</h3>
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
                  <button className={styles.reRenderBtn} onClick={() => setShowPreview(false)}>
                    🔄 重新渲染
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default ARExportPage
