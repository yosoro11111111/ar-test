import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import JSZip from 'jszip'
import styles from './styles.module.css'
import { MultiCharacterManager } from '../MultiCharacterManager.js'
import { CharacterSelectModal } from './CharacterSelectModal'
import { CellEditModal } from './CellEditModal'
import { SettingsModal } from './SettingsModal'
import { Timeline } from './Timeline'
import { TrackTypeSelectModal } from './TrackTypeSelectModal'
import { createTrack, createClip, TRACK_TYPES } from './trackTypes'
import { loadVRMAAction } from '../../../data/vrmaActions.js'

/**
 * AR MMD Director - 新轨道系统版本
 * 
 * 支持多种轨道类型：
 * - 场景轨道（背景图片）
 * - 动作轨道（VRMA动画）
 * - 特效轨道（粒子效果）
 * - 位置控制轨道（人物移动）
 * - 音乐轨道（背景音乐）
 * - 道具轨道（3D道具）
 * - 缩放轨道（人物/背景缩放）
 */
export function ARMMDDirector() {
  const navigate = useNavigate()
  
  // Three.js引用
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const characterManagerRef = useRef(null)
  const animationFrameRef = useRef(null)
  
  // 面板状态
  const [previewOpen, setPreviewOpen] = useState(false)
  
  // 弹窗状态
  const [showCharacterModal, setShowCharacterModal] = useState(false)
  const [showCellEditModal, setShowCellEditModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showTrackTypeModal, setShowTrackTypeModal] = useState(false)
  const [selectedCharacterForTrack, setSelectedCharacterForTrack] = useState(null)
  const [editingCell, setEditingCell] = useState(null)
  
  // 项目数据
  const [project, setProject] = useState({
    id: `project_${Date.now()}`,
    name: '新项目',
    duration: 60,
    backgroundImage: null,
    characters: [],
    tracks: []
  })
  
  // 时间轴状态
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [timelineScale, setTimelineScale] = useState(1)
  
  // 初始化Three.js - 只在previewOpen变为true时初始化
  useEffect(() => {
    if (previewOpen && !rendererRef.current) {
      // 使用setTimeout确保DOM已经渲染
      setTimeout(() => {
        initThreeJS()
      }, 100)
    }
  }, [previewOpen])
  
  // 组件卸载时清理
  useEffect(() => {
    return () => cleanup()
  }, [])
  
  // 播放循环
  useEffect(() => {
    if (isPlaying && previewOpen) {
      const startTime = Date.now() - currentTime * 1000
      
      const playLoop = () => {
        const elapsed = (Date.now() - startTime) / 1000
        
        if (elapsed >= project.duration) {
          setIsPlaying(false)
          setCurrentTime(project.duration)
        } else {
          setCurrentTime(elapsed)
          updateSceneAtTime(elapsed)
          animationFrameRef.current = requestAnimationFrame(playLoop)
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(playLoop)
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, previewOpen, project.duration])
  
  // 当currentTime变化时更新场景（不播放时拖动时间轴也能看到效果）
  useEffect(() => {
    if (previewOpen && !isPlaying) {
      updateSceneAtTime(currentTime)
    }
  }, [currentTime, previewOpen, isPlaying])
  
  const initThreeJS = () => {
    if (!canvasRef.current) {
      console.error('Canvas ref is null')
      return
    }
    
    console.log('Initializing Three.js...')
    
    const scene = new THREE.Scene()
    
    if (project.backgroundImage) {
      const textureLoader = new THREE.TextureLoader()
      textureLoader.load(project.backgroundImage, (texture) => {
        scene.background = texture
      })
    } else {
      scene.background = new THREE.Color(0x1a1a2e)
    }
    
    sceneRef.current = scene
    
    // 获取canvas实际尺寸
    const canvasWidth = canvasRef.current.clientWidth || 960
    const canvasHeight = canvasRef.current.clientHeight || 540
    const aspectRatio = canvasWidth / canvasHeight
    
    const camera = new THREE.PerspectiveCamera(60, aspectRatio, 0.1, 1000)
    camera.position.set(0, 5, 10)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera
    
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: false
    })
    renderer.setSize(canvasWidth, canvasHeight)
    renderer.setClearColor(0x1a1a2e, 1)
    renderer.shadowMap.enabled = true
    rendererRef.current = renderer
    
    console.log('Background set to:', project.backgroundImage ? 'texture' : '#1a1a2e')
    
    console.log('Renderer size:', canvasWidth, canvasHeight)
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(10, 20, 10)
    dirLight.castShadow = true
    scene.add(dirLight)
    
    const gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x222222)
    scene.add(gridHelper)
    
    characterManagerRef.current = new MultiCharacterManager(scene)
    
    // 加载所有角色，并在加载完成后应用当前时间轴状态
    console.log('Loading characters:', project.characters.length)
    const loadPromises = project.characters.map(char => loadCharacter(char))
    Promise.all(loadPromises).then(() => {
      console.log('All characters loaded')
      // 角色加载完成后，立即应用当前时间的状态
      setTimeout(() => {
        console.log('Applying scene at time:', currentTime)
        updateSceneAtTime(currentTime)
      }, 500)
    })
    
    const animate = () => {
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        characterManagerRef.current?.update(0.016)
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      } else {
        console.log('Missing ref:', { 
          renderer: !!rendererRef.current, 
          scene: !!sceneRef.current, 
          camera: !!cameraRef.current 
        })
      }
      requestAnimationFrame(animate)
    }
    animate()
    console.log('Animation loop started')
  }
  
  const loadCharacter = async (charData) => {
    try {
      await characterManagerRef.current.addCharacter(charData.vrmUrl, {
        id: charData.id,
        name: charData.name,
        position: charData.initialPosition,
        rotation: charData.initialRotation,
        scale: charData.initialScale
      })
    } catch (error) {
      console.error('加载角色失败:', error)
    }
  }
  
  // 添加角色 - 兼容旧Timeline格式
  const addCharacters = (selectedCharacters) => {
    const newCharacters = selectedCharacters.map(char => ({
      id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: char.name,
      vrmUrl: char.modelUrl,
      thumbnail: char.thumbnail,
      initialPosition: { x: (Math.random() - 0.5) * 4, y: 0, z: (Math.random() - 0.5) * 4 },
      initialRotation: { x: 0, y: Math.random() * Math.PI * 2, z: 0 },
      initialScale: 1,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`
    }))

    // 为新角色创建兼容旧格式的轨道
    const newTracks = newCharacters.map(char => ({
      id: `track_${char.id}`,
      type: 'character',
      characterId: char.id,
      characterName: char.name,
      characterColor: char.color,
      scene: [],
      action: [],
      effect: [],
      scale: [],
      bgScale: []
    }))

    setProject(prev => ({
      ...prev,
      characters: [...prev.characters, ...newCharacters],
      tracks: [...prev.tracks, ...newTracks]
    }))

    if (previewOpen && characterManagerRef.current) {
      newCharacters.forEach(char => loadCharacter(char))
    }
  }

  // 打开轨道类型选择弹窗
  const openTrackTypeModal = (characterId) => {
    const character = project.characters.find(c => c.id === characterId)
    setSelectedCharacterForTrack(character)
    setShowTrackTypeModal(true)
  }

  // 添加新轨道
  const handleAddTrack = (trackType) => {
    if (!selectedCharacterForTrack) return

    const newTrack = createTrack(selectedCharacterForTrack.id, trackType)

    setProject(prev => ({
      ...prev,
      tracks: [...prev.tracks, newTrack]
    }))

    setShowTrackTypeModal(false)
    setSelectedCharacterForTrack(null)
  }
  
  // 删除角色
  const deleteCharacter = (characterId) => {
    if (!confirm('确定要删除这个角色吗？相关的轨道数据也会被删除。')) {
      return
    }

    // 从场景中移除角色
    if (characterManagerRef.current) {
      characterManagerRef.current.removeCharacter(characterId)
    }

    setProject(prev => ({
      ...prev,
      characters: prev.characters.filter(c => c.id !== characterId),
      tracks: prev.tracks.filter(t => t.characterId !== characterId)
    }))
  }

  // 删除轨道
  const deleteTrack = (trackId) => {
    if (!confirm('确定要删除这个轨道吗？')) {
      return
    }

    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.filter(t => t.id !== trackId)
    }))
  }
  
  // 添加格子到子轨道
  const addCell = (trackId, subTrackType) => {
    const newCell = {
      id: `cell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: '', // 初始为空，选择后会自动填充
      startTime: currentTime,
      duration: 5
    }
    
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => 
        track.id === trackId
          ? { ...track, [subTrackType]: [...track[subTrackType], newCell] }
          : track
      )
    }))
    
    // 打开编辑弹窗
    setEditingCell({ trackId, subTrackType, cell: newCell })
    setShowCellEditModal(true)
  }
  
  // 更新格子
  const updateCell = (trackId, subTrackType, cellId, updates) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => 
        track.id === trackId
          ? {
              ...track,
              [subTrackType]: track[subTrackType].map(cell =>
                cell.id === cellId ? { ...cell, ...updates } : cell
              )
            }
          : track
      )
    }))
  }
  
  // 删除格子
  const deleteCell = (trackId, subTrackType, cellId) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => 
        track.id === trackId
          ? { ...track, [subTrackType]: track[subTrackType].filter(cell => cell.id !== cellId) }
          : track
      )
    }))
  }
  
  // 当前播放的动作缓存，避免重复加载
  const currentActionsRef = useRef({})
  
  // 当前场景缓存，避免重复加载背景
  const currentSceneRef = useRef(null)
  
  // 更新时间轴
  const updateSceneAtTime = (time) => {
    project.tracks.forEach(track => {
      if (track.type === 'character') {
        const character = characterManagerRef.current?.getCharacter(track.characterId)
        if (!character) return
        
        // 应用场景
        const activeScene = track.scene.find(s => time >= s.startTime && time <= s.startTime + s.duration)
        
        // 应用背景（只在场景变化时更新）
        if (activeScene?.sceneId && activeScene.sceneId !== currentSceneRef.current) {
          currentSceneRef.current = activeScene.sceneId
          if (activeScene.sceneData?.imageUrl && sceneRef.current) {
            const textureLoader = new THREE.TextureLoader()
            textureLoader.load(activeScene.sceneData.imageUrl, (texture) => {
              if (sceneRef.current) {
                sceneRef.current.background = texture
                console.log('Background updated:', activeScene.name)
              }
            })
          }
        }
        
        // 应用背景缩放动画
        const activeBgScale = track.bgScale?.find(s => time >= s.startTime && time <= s.startTime + s.duration)
        if (activeBgScale && sceneRef.current?.background) {
          const progress = (time - activeBgScale.startTime) / activeBgScale.duration
          const startScale = activeBgScale.startValue ?? 1
          const endScale = activeBgScale.endValue ?? 1
          const currentScale = startScale + (endScale - startScale) * progress
          // 通过调整camera来模拟背景缩放效果
          const baseFov = 60
          const newFov = baseFov / currentScale
          cameraRef.current.fov = Math.max(20, Math.min(120, newFov))
          cameraRef.current.updateProjectionMatrix()
        }
        
        if (activeScene?.position) {
          character.vrm.scene.position.set(
            activeScene.position.x,
            activeScene.position.y,
            activeScene.position.z
          )
        }
        
        // 应用缩放动画
        const activeScale = track.scale?.find(s => time >= s.startTime && time <= s.startTime + s.duration)
        if (activeScale) {
          // 计算缩放值（支持起始值和结束值的渐变）
          const progress = (time - activeScale.startTime) / activeScale.duration
          const startScale = activeScale.startValue ?? 1
          const endScale = activeScale.endValue ?? 1
          const currentScale = startScale + (endScale - startScale) * progress
          character.vrm.scene.scale.setScalar(currentScale)
          character.vrm.scene.visible = currentScale > 0.01 // 缩放小于0.01时隐藏
        } else {
          // 没有缩放动画时恢复默认
          character.vrm.scene.scale.setScalar(1)
          character.vrm.scene.visible = true
        }
        
        // 应用动作 - 只在动作变化时加载
        const activeAction = track.action.find(a => time >= a.startTime && time <= a.startTime + a.duration)
        const actionKey = `${track.characterId}_${activeAction?.id}`
        const currentActionKey = currentActionsRef.current[track.characterId]
        
        if (activeAction?.filePath && actionKey !== currentActionKey) {
          // 动作发生变化，加载新动作
          currentActionsRef.current[track.characterId] = actionKey
          
          loadVRMAAction(activeAction.filePath, character.vrm).then(result => {
            if (result?.clip) {
              characterManagerRef.current.playCharacterAction(
                track.characterId,
                result.clip,
                { loop: true, transitionDuration: 0.3 }
              )
            }
          }).catch(err => {
            console.error('加载动作失败:', err)
          })
        } else if (!activeAction && currentActionKey) {
          // 没有动作了，停止播放
          currentActionsRef.current[track.characterId] = null
          characterManagerRef.current.stopCharacterAction?.(track.characterId)
        }
        
        // 应用特效
        const activeEffect = track.effect.find(e => time >= e.startTime && time <= e.startTime + e.duration)
        if (activeEffect) {
          // 特效逻辑
        }
      }
    })
  }
  
  // 播放/暂停
  const togglePlay = () => {
    if (!previewOpen) {
      setPreviewOpen(true)
      setTimeout(() => setIsPlaying(true), 100)
    } else {
      setIsPlaying(!isPlaying)
    }
  }
  
  // 保存项目
  const saveProject = () => {
    const projects = JSON.parse(localStorage.getItem('ar-director-projects') || '[]')
    const existingIndex = projects.findIndex(p => p.id === project.id)
    
    const projectData = {
      ...project,
      modifiedAt: new Date().toISOString()
    }
    
    if (existingIndex >= 0) {
      projects[existingIndex] = projectData
    } else {
      projects.push(projectData)
    }
    
    localStorage.setItem('ar-director-projects', JSON.stringify(projects))
    alert('项目已保存')
  }
  
  // 计算时间轴最后的时间
  const getTimelineEndTime = () => {
    let maxTime = 0
    project.tracks.forEach(track => {
      // 检查场景、动作、特效的结束时间
      ;['scene', 'action', 'effect'].forEach(key => {
        track[key]?.forEach(item => {
          const endTime = item.startTime + item.duration
          if (endTime > maxTime) maxTime = endTime
        })
      })
    })
    return Math.max(maxTime, project.duration)
  }
  
  // 导出GIF/视频/ZIP
  const [exportProgress, setExportProgress] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [exportStage, setExportStage] = useState('') // 导出阶段提示
  
  // 优化的批量渲染函数 - 使用requestAnimationFrame
  const renderFrames = async (duration, fps, onFrame) => {
    const totalFrames = Math.ceil(duration * fps)
    const frameTime = 1000 / fps
    
    return new Promise((resolve) => {
      let frameIndex = 0
      let lastTime = performance.now()
      
      const renderLoop = () => {
        const currentTime = performance.now()
        const deltaTime = currentTime - lastTime
        
        if (deltaTime >= frameTime) {
          const time = frameIndex / fps
          updateSceneAtTime(time)
          rendererRef.current.render(sceneRef.current, cameraRef.current)
          
          // 捕获帧
          const dataUrl = rendererRef.current.domElement.toDataURL('image/png')
          onFrame(dataUrl, frameIndex)
          
          frameIndex++
          lastTime = currentTime
          
          // 更新进度
          const progress = Math.round((frameIndex / totalFrames) * 100)
          setExportProgress(progress)
        }
        
        if (frameIndex < totalFrames) {
          requestAnimationFrame(renderLoop)
        } else {
          resolve()
        }
      }
      
      requestAnimationFrame(renderLoop)
    })
  }
  
  const handleExportMedia = async (type) => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
      alert('预览窗口未打开，请先打开预览')
      return
    }
    
    const fps = 30
    const duration = getTimelineEndTime()
    
    if (duration === 0) {
      alert('时间轴为空，无法导出')
      return
    }
    
    if (duration > 60) {
      if (!confirm(`导出时长为${duration.toFixed(1)}秒，超过60秒，确定要继续吗？`)) {
        return
      }
    }
    
    setIsExporting(true)
    setExportProgress(0)
    setExportStage('正在渲染帧...')
    
    // 暂停播放
    const wasPlaying = isPlaying
    setIsPlaying(false)
    
    const frames = []
    
    // 使用优化的批量渲染
    await renderFrames(duration, fps, (dataUrl) => {
      frames.push(dataUrl)
    })
    
    setExportStage('正在生成文件...')
    
    if (type === 'gif') {
      await exportGIF(frames, fps)
    } else if (type === 'video') {
      await exportVideo(frames, fps)
    } else if (type === 'zip') {
      await exportZIP(frames, fps)
    } else if (type === 'project') {
      await exportProjectZIP()
    }
    
    setIsExporting(false)
    setExportProgress(0)
    setExportStage('')
    
    // 恢复播放状态
    if (wasPlaying) {
      setIsPlaying(true)
    }
  }
  
  // 导出GIF - 使用gif.js（优化版）
  const exportGIF = async (frames, fps) => {
    try {
      const gif = new GIF({
        workers: 4, // 增加worker数量
        quality: 10,
        width: 960,
        height: 540,
        workerScript: '/gif.worker.js'
      })
      
      // 并行加载帧
      const loadFrame = (frameData) => {
        return new Promise((resolve) => {
          const img = new Image()
          img.src = frameData
          img.onload = () => {
            gif.addFrame(img, { delay: 1000 / fps })
            resolve()
          }
        })
      }
      
      // 批量加载，每10帧更新一次进度
      for (let i = 0; i < frames.length; i += 10) {
        const batch = frames.slice(i, i + 10)
        await Promise.all(batch.map(loadFrame))
        setExportProgress(Math.round(((i + batch.length) / frames.length) * 50) + 50)
      }
      
      gif.on('finished', (blob) => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = `${project.name}.gif`
        link.href = url
        link.click()
        URL.revokeObjectURL(url)
        alert('GIF导出成功！')
      })
      
      gif.render()
    } catch (error) {
      console.error('GIF导出失败:', error)
      alert('GIF导出失败: ' + error.message)
    }
  }
  
  // 导出视频 - 使用实时录制（更高效）
  const exportVideo = async (frames, fps) => {
    try {
      const canvas = rendererRef.current.domElement
      const stream = canvas.captureStream(fps)
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      })
      
      const chunks = []
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = `${project.name}.webm`
        link.href = url
        link.click()
        URL.revokeObjectURL(url)
        alert('视频导出成功！')
      }
      
      // 开始录制
      mediaRecorder.start()
      
      // 播放动画并录制
      const duration = frames.length / fps * 1000
      setTimeout(() => {
        mediaRecorder.stop()
      }, duration)
      
    } catch (error) {
      console.error('视频导出失败:', error)
      alert('视频导出失败: ' + error.message)
    }
  }
  
  // 导出帧序列ZIP
  const exportZIP = async (frames, fps) => {
    try {
      const zip = new JSZip()
      const folder = zip.folder(`${project.name}_frames`)
      
      // 添加帧图片
      for (let i = 0; i < frames.length; i++) {
        const frameData = frames[i]
        const base64Data = frameData.split(',')[1]
        folder.file(`frame_${String(i).padStart(4, '0')}.png`, base64Data, { base64: true })
        
        if (i % 10 === 0) {
          setExportProgress(Math.round((i / frames.length) * 50) + 50)
        }
      }
      
      // 添加项目信息JSON
      const projectInfo = {
        name: project.name,
        fps: fps,
        frameCount: frames.length,
        duration: frames.length / fps,
        exportedAt: new Date().toISOString()
      }
      folder.file('project_info.json', JSON.stringify(projectInfo, null, 2))
      
      // 生成ZIP
      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const link = document.createElement('a')
      link.download = `${project.name}_frames.zip`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
      alert('帧序列导出成功！')
    } catch (error) {
      console.error('ZIP导出失败:', error)
      alert('ZIP导出失败: ' + error.message)
    }
  }
  
  // 导出项目ZIP（包含所有资源）
  const exportProjectZIP = async () => {
    try {
      const zip = new JSZip()
      
      // 添加项目JSON
      zip.file('project.json', JSON.stringify(project, null, 2))
      
      // 添加场景图片
      for (const track of project.tracks) {
        for (const scene of track.scene || []) {
          if (scene.sceneData?.imageUrl) {
            try {
              const response = await fetch(scene.sceneData.imageUrl)
              const blob = await response.blob()
              zip.file(`scenes/${scene.id}.png`, blob)
            } catch (e) {
              console.warn('无法下载场景图片:', e)
            }
          }
        }
      }
      
      // 生成ZIP
      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const link = document.createElement('a')
      link.download = `${project.name}.mmdproject.zip`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
      alert('项目导出成功！')
    } catch (error) {
      console.error('项目导出失败:', error)
      alert('项目导出失败: ' + error.message)
    }
  }
  
  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (characterManagerRef.current) {
      characterManagerRef.current.dispose()
    }
    if (rendererRef.current) {
      rendererRef.current.dispose()
    }
  }
  
  return (
    <div className={styles.container}>
      {/* 顶部工具栏 */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button 
            className={styles.backBtn}
            onClick={() => navigate('/ar-director')}
            title="返回"
          >
            ←
          </button>
          <h1 className={styles.title}>AR MMD Director</h1>
        </div>
        
        <div className={styles.headerRight}>
          <button className={styles.iconBtn} onClick={saveProject} title="保存">
            💾
          </button>
          <button className={styles.iconBtn} onClick={() => setShowSettingsModal(true)} title="设置">
            ⚙️
          </button>
        </div>
      </header>
      
      {/* 主内容区 */}
      <div className={styles.main}>
        <div className={styles.centerArea}>
          {!previewOpen ? (
            <div className={styles.previewPlaceholder}>
              <button 
                className={styles.showPreviewBtn}
                onClick={() => setPreviewOpen(true)}
              >
                <span className={styles.previewIcon}>👁️</span>
                <span>点击显示预览</span>
              </button>
            </div>
          ) : (
            <div className={styles.previewContainer}>
              <div className={styles.previewHeader}>
                <span>🎬 3D 预览</span>
                <div className={styles.previewControls}>
                  <button 
                    className={styles.controlBtn}
                    onClick={() => setIsPlaying(!isPlaying)}
                    title={isPlaying ? '暂停' : '播放'}
                  >
                    {isPlaying ? '⏸️' : '▶️'}
                  </button>
                  <button 
                    className={styles.closePreviewBtn}
                    onClick={() => {
                      setPreviewOpen(false)
                      setIsPlaying(false)
                      // 清理Three.js
                      cleanup()
                      rendererRef.current = null
                      sceneRef.current = null
                      cameraRef.current = null
                      characterManagerRef.current = null
                    }}
                    title="关闭预览"
                  >
                    ✕ 关闭
                  </button>
                </div>
              </div>
              <canvas ref={canvasRef} className={styles.previewCanvas} />
              
              {/* 导出进度条 */}
              {isExporting && (
                <div className={styles.exportProgressOverlay}>
                  <div className={styles.exportProgressBox}>
                    <div className={styles.exportProgressTitle}>🎬 {exportStage || '正在导出...'}</div>
                    <div className={styles.exportProgressBar}>
                      <div 
                        className={styles.exportProgressFill} 
                        style={{ width: `${exportProgress}%` }}
                      />
                    </div>
                    <div className={styles.exportProgressText}>{exportProgress}%</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* 时间轴 */}
      <Timeline
        project={project}
        tracks={project.tracks}
        characters={project.characters}
        currentTime={currentTime}
        duration={project.duration}
        scale={timelineScale}
        onTimeChange={setCurrentTime}
        onAddCharacter={() => setShowCharacterModal(true)}
        onAddTrack={openTrackTypeModal}
        onAddCell={addCell}
        onEditCell={(trackId, cell) => {
          setEditingCell({ trackId, cell })
          setShowCellEditModal(true)
        }}
        onCellUpdate={updateCell}
        onDeleteCell={deleteCell}
        onDeleteCharacter={deleteCharacter}
        onDeleteTrack={deleteTrack}
        isPlaying={isPlaying}
        onPlayPause={togglePlay}
      />
      
      {/* 角色选择弹窗 */}
      {showCharacterModal && (
        <CharacterSelectModal
          onSelect={addCharacters}
          onClose={() => setShowCharacterModal(false)}
        />
      )}
      
      {/* 格子编辑弹窗 */}
      {showCellEditModal && (
        <CellEditModal
          trackId={editingCell?.trackId}
          subTrackType={editingCell?.subTrackType}
          cell={editingCell?.cell}
          onSave={(trackId, subTrackType, cellId, data) => {
            updateCell(trackId, subTrackType, cellId, data)
          }}
          onDelete={deleteCell}
          onClose={() => {
            setShowCellEditModal(false)
            setEditingCell(null)
          }}
        />
      )}
      
      {/* 设置弹窗 */}
      {showSettingsModal && (
        <SettingsModal
          project={project}
          onClose={() => setShowSettingsModal(false)}
          onExport={handleExportMedia}
        />
      )}

      {/* 轨道类型选择弹窗 */}
      <TrackTypeSelectModal
        isOpen={showTrackTypeModal}
        onClose={() => {
          setShowTrackTypeModal(false)
          setSelectedCharacterForTrack(null)
        }}
        onSelect={handleAddTrack}
        characterName={selectedCharacterForTrack?.name}
      />
    </div>
  )
}

export default ARMMDDirector
