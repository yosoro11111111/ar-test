import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as THREE from 'three'
import styles from './ARTimelineEditorPage.module.css'
import { TimelineEditor } from './TimelineEditor.jsx'
import { MultiCharacterManager } from './MultiCharacterManager.js'
import { loadVRMAAction } from '../../data/vrmaActions.js'
import { actions as vrmaActions } from '../../data/actions250.js'

/**
 * AR时间轴编辑器页面
 * 整合多角色管理、时间轴编辑、AR预览
 */
export function ARTimelineEditorPage() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  
  // Three.js相关
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const characterManagerRef = useRef(null)
  const animationFrameRef = useRef(null)
  
  // 项目数据
  const [project, setProject] = useState(null)
  const [characters, setCharacters] = useState([])
  const [tracks, setTracks] = useState([])
  const [duration, setDuration] = useState(30)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedCharacterId, setSelectedCharacterId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showActionLibrary, setShowActionLibrary] = useState(false)
  const [actionLibraryTarget, setActionLibraryTarget] = useState(null)
  const [showCharacterLibrary, setShowCharacterLibrary] = useState(false)

  // 场景平面数据
  const [scenePlanes, setScenePlanes] = useState([])
  const [sceneInfo, setSceneInfo] = useState(null) // 存储场景信息（名称、缩略图等）
  const planeMeshesRef = useRef([])

  // 初始化Three.js场景
  useEffect(() => {
    console.log('🎬 [TimelineEditor] 组件挂载，开始初始化')
    console.log('🎬 [TimelineEditor] 项目ID:', projectId)
    initThreeJS()
    loadProject()
    
    return () => {
      console.log('🧹 [TimelineEditor] 组件卸载，清理资源')
      cleanup()
    }
  }, [])

  const initThreeJS = () => {
    console.log('🎨 [TimelineEditor] initThreeJS() 开始调用')
    
    if (!canvasRef.current) {
      console.error('❌ [TimelineEditor] canvasRef.current 为null')
      return
    }
    
    console.log('🎨 [TimelineEditor] Canvas尺寸:', canvasRef.current.clientWidth, 'x', canvasRef.current.clientHeight)
    
    // 场景
    console.log('🎨 [TimelineEditor] 创建Three.js场景')
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    sceneRef.current = scene
    
    // 相机
    console.log('🎨 [TimelineEditor] 创建相机')
    const camera = new THREE.PerspectiveCamera(
      60,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      100
    )
    camera.position.set(0, 1.6, 0)
    cameraRef.current = camera
    console.log('🎨 [TimelineEditor] 相机位置:', camera.position)
    
    // 渲染器
    console.log('🎨 [TimelineEditor] 创建WebGL渲染器')
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    })
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    rendererRef.current = renderer
    console.log('🎨 [TimelineEditor] 渲染器像素比:', renderer.getPixelRatio())
    
    // 灯光
    console.log('🎨 [TimelineEditor] 添加灯光')
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 7)
    scene.add(directionalLight)
    
    // 网格
    console.log('🎨 [TimelineEditor] 添加网格辅助线')
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
    scene.add(gridHelper)
    
    // 角色管理器
    console.log('🎨 [TimelineEditor] 初始化MultiCharacterManager')
    characterManagerRef.current = new MultiCharacterManager(scene)
    
    // 开始渲染循环
    console.log('🎨 [TimelineEditor] 启动渲染循环')
    startRenderLoop()
    console.log('✅ [TimelineEditor] Three.js初始化完成')
  }

  const startRenderLoop = () => {
    const loop = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return
      
      // 更新角色动画
      if (characterManagerRef.current) {
        characterManagerRef.current.update(0.016)
      }
      
      rendererRef.current.render(sceneRef.current, cameraRef.current)
      animationFrameRef.current = requestAnimationFrame(loop)
    }
    loop()
  }

  const loadProject = async () => {
    console.log('📂 [TimelineEditor] loadProject() 开始调用')
    
    try {
      setIsLoading(true)
      console.log('⏳ [TimelineEditor] 设置加载状态为true')
      
      // 从本地存储加载项目
      console.log('📂 [TimelineEditor] 从localStorage加载项目数据')
      const projects = JSON.parse(localStorage.getItem('ar-director-projects') || '[]')
      console.log('📊 [TimelineEditor] 找到', projects.length, '个项目')
      
      const currentProject = projects.find(p => p.id === projectId)
      console.log(currentProject ? '✅ [TimelineEditor] 找到当前项目' : '⚠️ [TimelineEditor] 未找到项目，将创建新项目')
      
      // 加载场景数据（平面信息）
      console.log('📂 [TimelineEditor] 从localStorage加载场景数据')
      const scenes = JSON.parse(localStorage.getItem('ar-director-scenes') || '[]')
      console.log('📊 [TimelineEditor] 找到', scenes.length, '个场景')
      
      const currentScene = scenes.find(s => s.id === projectId)
      console.log(currentScene ? '✅ [TimelineEditor] 找到场景数据' : '⚠️ [TimelineEditor] 未找到场景数据')
      
      if (currentScene && currentScene.environment) {
        console.log('🎯 [TimelineEditor] 加载场景平面数据')
        console.log('📊 [TimelineEditor] 场景平面数:', currentScene.environment.planes?.length || 0)
        
        // 加载场景平面数据
        setScenePlanes(currentScene.environment.planes || [])
        // 在3D场景中显示平面
        visualizePlanes(currentScene.environment.planes || [])
        
        // 加载场景信息（名称、缩略图）
        setSceneInfo({
          name: currentScene.name || '未命名场景',
          thumbnail: currentScene.thumbnail,
          createdAt: currentScene.createdAt
        })
      }
      
      if (currentProject) {
        console.log('✅ [TimelineEditor] 加载现有项目:', currentProject.name)
        setProject(currentProject)
        setDuration(currentProject.duration || 30)
        console.log('📊 [TimelineEditor] 项目时长:', currentProject.duration || 30, '秒')
        
        // 加载角色
        if (currentProject.characters && currentProject.characters.length > 0) {
          console.log('👥 [TimelineEditor] 加载', currentProject.characters.length, '个角色')
          for (const charData of currentProject.characters) {
            console.log('👤 [TimelineEditor] 加载角色:', charData.name)
            await addCharacter(charData.vrmUrl, {
              name: charData.name,
              position: charData.initialPosition,
              rotation: charData.initialRotation,
              scale: charData.initialScale
            })
          }
        } else {
          console.log('⚠️ [TimelineEditor] 项目中没有角色')
        }
        
        // 加载轨道
        if (currentProject.tracks && currentProject.tracks.length > 0) {
          console.log('🎬 [TimelineEditor] 加载', currentProject.tracks.length, '个轨道')
          setTracks(currentProject.tracks)
        } else {
          console.log('⚠️ [TimelineEditor] 项目中没有轨道')
        }
      } else {
        // 新项目
        console.log('🆕 [TimelineEditor] 创建新项目')
        const newProject = {
          id: projectId || `project_${Date.now()}`,
          name: '新项目',
          duration: 30,
          characters: [],
          tracks: []
        }
        setProject(newProject)
        console.log('🆕 [TimelineEditor] 新项目ID:', newProject.id)
        
        // 如果没有场景数据，创建默认地面
        if (!currentScene) {
          console.log('🎯 [TimelineEditor] 创建默认地面')
          const defaultPlanes = [{
            id: 'default_floor',
            type: 'floor',
            name: '地面',
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: -Math.PI / 2, y: 0, z: 0 },
            size: { width: 10, height: 10 },
            color: '#4a90d9'
          }]
          setScenePlanes(defaultPlanes)
          visualizePlanes(defaultPlanes)
        }
      }
      
      console.log('✅ [TimelineEditor] 项目加载完成')
    } catch (error) {
      console.error('❌ [TimelineEditor] 加载项目失败:', error)
      console.error('❌ [TimelineEditor] 错误堆栈:', error.stack)
    } finally {
      setIsLoading(false)
      console.log('⏳ [TimelineEditor] 设置加载状态为false')
    }
  }
  
  // 可视化场景平面
  const visualizePlanes = (planes) => {
    console.log('🎯 [TimelineEditor] visualizePlanes() 开始调用')
    console.log('📊 [TimelineEditor] 需要可视化的平面数:', planes.length)
    
    if (!sceneRef.current) {
      console.warn('⚠️ [TimelineEditor] sceneRef.current 为null，无法可视化平面')
      return
    }
    
    // 清除旧的平面显示
    console.log('🧹 [TimelineEditor] 清除旧的平面显示，数量:', planeMeshesRef.current.length)
    planeMeshesRef.current.forEach((mesh, index) => {
      sceneRef.current.remove(mesh)
      console.log('🧹 [TimelineEditor] 移除平面mesh #', index)
    })
    planeMeshesRef.current = []
    
    // 创建新的平面显示
    console.log('🎨 [TimelineEditor] 创建新的平面显示')
    planes.forEach((plane, index) => {
      console.log(`🎨 [TimelineEditor] 创建平面 #${index}:`, plane.name, `(类型: ${plane.type})`)
      
      const geometry = new THREE.PlaneGeometry(plane.size.width, plane.size.height)
      const material = new THREE.MeshBasicMaterial({
        color: plane.color || '#4a90d9',
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      })
      
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(plane.position.x, plane.position.y, plane.position.z)
      mesh.rotation.set(plane.rotation.x, plane.rotation.y, plane.rotation.z)
      
      console.log(`📍 [TimelineEditor] 平面位置:`, plane.position)
      console.log(`📐 [TimelineEditor] 平面尺寸:`, plane.size)
      
      // 添加边框
      const edges = new THREE.EdgesGeometry(geometry)
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: plane.color || '#4a90d9',
        linewidth: 2 
      })
      const wireframe = new THREE.LineSegments(edges, lineMaterial)
      mesh.add(wireframe)
      
      sceneRef.current.add(mesh)
      planeMeshesRef.current.push(mesh)
      console.log(`✅ [TimelineEditor] 平面 #${index} 添加到场景`)
    })
    
    console.log('✅ [TimelineEditor] 平面可视化完成，总数:', planeMeshesRef.current.length)
  }

  const addCharacter = async (vrmUrl, options = {}) => {
    console.log('👤 [TimelineEditor] addCharacter() 开始调用')
    console.log('👤 [TimelineEditor] VRM URL:', vrmUrl?.substring(0, 50) + '...')
    console.log('👤 [TimelineEditor] 选项:', options)
    
    if (!characterManagerRef.current) {
      console.error('❌ [TimelineEditor] characterManagerRef.current 为null')
      return
    }
    
    try {
      // 如果没有指定位置，自动放置到第一个地面平面上
      if (!options.position && scenePlanes.length > 0) {
        console.log('🎯 [TimelineEditor] 未指定位置，尝试自动放置到地面')
        console.log('📊 [TimelineEditor] 可用平面数:', scenePlanes.length)
        
        const floorPlane = scenePlanes.find(p => p.type === 'floor')
        if (floorPlane) {
          // 放置到平面中心，稍微抬高一点（避免穿模）
          options.position = {
            x: floorPlane.position.x,
            y: floorPlane.position.y + 0.01, // 稍微抬高
            z: floorPlane.position.z
          }
          console.log('🎯 [TimelineEditor] 自动放置到地面:', floorPlane.name)
          console.log('📍 [TimelineEditor] 放置位置:', options.position)
        } else {
          console.warn('⚠️ [TimelineEditor] 未找到地面平面')
        }
      } else if (options.position) {
        console.log('📍 [TimelineEditor] 使用指定位置:', options.position)
      } else {
        console.warn('⚠️ [TimelineEditor] 没有可用平面且未指定位置')
      }
      
      console.log('⏳ [TimelineEditor] 开始加载VRM模型...')
      const characterId = await characterManagerRef.current.addCharacter(vrmUrl, options)
      console.log('✅ [TimelineEditor] 角色加载成功，ID:', characterId)
      
      const character = characterManagerRef.current.getCharacter(characterId)
      console.log('👤 [TimelineEditor] 角色信息:', character?.name)
      
      setCharacters(prev => {
        const newChars = [...prev, character]
        console.log('📊 [TimelineEditor] 角色列表更新，总数:', newChars.length)
        return newChars
      })
      
      // 自动创建动作轨道
      console.log('🎬 [TimelineEditor] 创建动作轨道')
      const actionTrack = {
        id: `track_${Date.now()}_action`,
        characterId,
        type: 'action',
        clips: []
      }
      
      setTracks(prev => {
        const newTracks = [...prev, actionTrack]
        console.log('📊 [TimelineEditor] 轨道列表更新，总数:', newTracks.length)
        return newTracks
      })
      
      // 选中第一个角色
      if (!selectedCharacterId) {
        console.log('👆 [TimelineEditor] 自动选中新角色')
        setSelectedCharacterId(characterId)
      }
      
      console.log('✅ [TimelineEditor] addCharacter() 完成')
      return characterId
    } catch (error) {
      console.error('❌ [TimelineEditor] 添加角色失败:', error)
      console.error('❌ [TimelineEditor] 错误堆栈:', error.stack)
      alert('添加角色失败: ' + error.message)
    }
  }
  
  // 将角色放置到指定平面
  const placeCharacterOnPlane = (characterId, planeId) => {
    const plane = scenePlanes.find(p => p.id === planeId)
    if (!plane || !characterManagerRef.current) return
    
    const position = {
      x: plane.position.x,
      y: plane.position.y + 0.01,
      z: plane.position.z
    }
    
    characterManagerRef.current.setCharacterPosition(characterId, position)
    
    // 更新本地状态
    setCharacters(prev => prev.map(char => 
      char.id === characterId 
        ? { ...char, position }
        : char
    ))
    
    console.log(`✅ 角色已放置到 ${plane.name}`)
  }

  const removeCharacter = (characterId) => {
    if (!characterManagerRef.current) return
    
    characterManagerRef.current.removeCharacter(characterId)
    setCharacters(prev => prev.filter(c => c.id !== characterId))
    setTracks(prev => prev.filter(t => t.characterId !== characterId))
    
    if (selectedCharacterId === characterId) {
      setSelectedCharacterId(null)
    }
  }

  const handlePlay = () => {
    setIsPlaying(true)
    playTimeline()
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  const playTimeline = async () => {
    const startTime = Date.now() - currentTime * 1000
    
    const playLoop = () => {
      if (!isPlaying) return
      
      const elapsed = (Date.now() - startTime) / 1000
      setCurrentTime(Math.min(elapsed, duration))
      
      // 更新角色状态
      updateCharactersAtTime(elapsed)
      
      if (elapsed < duration) {
        requestAnimationFrame(playLoop)
      } else {
        setIsPlaying(false)
      }
    }
    
    playLoop()
  }

  const updateCharactersAtTime = (time) => {
    tracks.forEach(track => {
      const activeClips = track.clips.filter(clip => 
        time >= clip.startTime && time <= clip.startTime + clip.duration
      )
      
      activeClips.forEach(clip => {
        if (track.type === 'action' && clip.actionId) {
          // 播放动作
          playCharacterAction(track.characterId, clip.actionId)
        }
      })
    })
  }

  const playCharacterAction = async (characterId, actionId) => {
    const character = characterManagerRef.current?.getCharacter(characterId)
    if (!character) return
    
    const action = vrmaActions.find(a => a.id === actionId)
    if (!action) return
    
    try {
      const result = await loadVRMAAction(action.filePath, character.vrm)
      if (result?.clip) {
        characterManagerRef.current.playCharacterAction(characterId, result.clip, {
          loop: true,
          transitionDuration: 0.3
        })
      }
    } catch (error) {
      console.error('播放动作失败:', error)
    }
  }

  const handleSeek = (time) => {
    setCurrentTime(time)
    updateCharactersAtTime(time)
  }

  const handleAddClip = (trackId, type) => {
    if (type === 'action') {
      // 显示动作库
      setActionLibraryTarget({ trackId, type })
      setShowActionLibrary(true)
    }
  }

  const handleSelectAction = (action) => {
    if (!actionLibraryTarget) return
    
    const newClip = {
      id: `clip_${Date.now()}`,
      name: action.name,
      actionId: action.id,
      startTime: currentTime,
      duration: 5, // 默认5秒
      type: 'action'
    }
    
    setTracks(prev => prev.map(track => 
      track.id === actionLibraryTarget.trackId
        ? { ...track, clips: [...track.clips, newClip] }
        : track
    ))
    
    setShowActionLibrary(false)
    setActionLibraryTarget(null)
  }

  const handleDeleteClip = (trackId, clipId) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId
        ? { ...track, clips: track.clips.filter(c => c.id !== clipId) }
        : track
    ))
  }

  const handleUpdateClip = (trackId, clipId, updates) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId
        ? {
            ...track,
            clips: track.clips.map(clip => 
              clip.id === clipId ? { ...clip, ...updates } : clip
            )
          }
        : track
    ))
  }

  const saveProject = () => {
    const projectData = {
      ...project,
      characters: characters.map(c => ({
        id: c.id,
        name: c.name,
        vrmUrl: c.vrmUrl,
        initialPosition: c.position,
        initialRotation: c.rotation,
        initialScale: c.scale
      })),
      tracks,
      duration,
      modifiedAt: new Date().toISOString()
    }
    
    const projects = JSON.parse(localStorage.getItem('ar-director-projects') || '[]')
    const existingIndex = projects.findIndex(p => p.id === projectData.id)
    
    if (existingIndex >= 0) {
      projects[existingIndex] = projectData
    } else {
      projects.push(projectData)
    }
    
    localStorage.setItem('ar-director-projects', JSON.stringify(projects))
    alert('项目已保存！')
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

  if (isLoading) {
    return <div className={styles.loading}>加载中...</div>
  }

  return (
    <div className={styles.container}>
      {/* 顶部导航 */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/ar-director')}>
          ← 返回
        </button>
        <h1 className={styles.title}>{project?.name || '新项目'}</h1>
        <div className={styles.headerActions}>
          <button className={styles.saveBtn} onClick={saveProject}>
            💾 保存
          </button>
          <button 
            className={styles.exportBtn}
            onClick={() => navigate(`/ar-director/export/${projectId}`)}
          >
            🎬 导出
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <div className={styles.main}>
        {/* 左侧工具栏 */}
        <aside className={styles.sidebar}>
          {/* 场景信息 */}
          <div className={styles.toolSection}>
            <h3>📐 场景信息</h3>
            {sceneInfo && (
              <div className={styles.sceneInfoCard}>
                {sceneInfo.thumbnail && (
                  <img 
                    src={sceneInfo.thumbnail} 
                    alt={sceneInfo.name}
                    className={styles.sceneThumbnail}
                  />
                )}
                <span className={styles.sceneName}>{sceneInfo.name}</span>
              </div>
            )}
            <div className={styles.planesList}>
              {scenePlanes.map(plane => (
                <div 
                  key={plane.id}
                  className={styles.planeItem}
                  onClick={() => {
                    if (selectedCharacterId) {
                      placeCharacterOnPlane(selectedCharacterId, plane.id)
                    }
                  }}
                >
                  <div 
                    className={styles.planeColor}
                    style={{ backgroundColor: plane.color }}
                  />
                  <span className={styles.planeName}>{plane.name}</span>
                  <span className={styles.planeType}>
                    {plane.type === 'floor' ? '🟦' : '🟥'}
                  </span>
                </div>
              ))}
            </div>
            <p className={styles.planeHint}>
              {selectedCharacterId 
                ? '点击平面可将角色放置到该位置' 
                : '先选择角色，再点击平面放置'}
            </p>
          </div>

          <div className={styles.toolSection}>
            <h3>角色</h3>
            <button 
              className={styles.toolBtn}
              onClick={() => setShowCharacterLibrary(true)}
            >
              <span>👤</span>
              <span>添加角色</span>
            </button>
            
            <div className={styles.characterList}>
              {characters.map(char => (
                <div 
                  key={char.id}
                  className={`${styles.characterItem} ${selectedCharacterId === char.id ? styles.selected : ''}`}
                  onClick={() => setSelectedCharacterId(char.id)}
                >
                  <div 
                    className={styles.characterColor}
                    style={{ backgroundColor: char.color }}
                  />
                  <span>{char.name}</span>
                  <button 
                    className={styles.removeCharBtn}
                    onClick={(e) => {
                      e.stopPropagation()
                      removeCharacter(char.id)
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.toolSection}>
            <h3>工具</h3>
            <button className={styles.toolBtn}>
              <span>📷</span>
              <span>相机设置</span>
            </button>
            <button className={styles.toolBtn}>
              <span>✨</span>
              <span>特效</span>
            </button>
            <button className={styles.toolBtn}>
              <span>🎵</span>
              <span>音乐</span>
            </button>
          </div>
        </aside>

        {/* 中间预览区 */}
        <div className={styles.previewSection}>
          <div className={styles.canvasContainer}>
            <canvas ref={canvasRef} className={styles.canvas} />
            
            {/* 时间码显示 */}
            <div className={styles.timecode}>
              {formatTime(currentTime)}
            </div>
          </div>
        </div>
      </div>

      {/* 底部时间轴 */}
      <div className={styles.timelineSection}>
        <TimelineEditor
          characters={characters}
          tracks={tracks}
          duration={duration}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onPause={handlePause}
          onSeek={handleSeek}
          onAddClip={handleAddClip}
          onDeleteClip={handleDeleteClip}
          onUpdateClip={handleUpdateClip}
          selectedCharacterId={selectedCharacterId}
          onSelectCharacter={setSelectedCharacterId}
        />
      </div>

      {/* 角色库弹窗 */}
      {showCharacterLibrary && (
        <div className={styles.modalOverlay} onClick={() => setShowCharacterLibrary(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>选择角色</h3>
            <div className={styles.characterLibraryList}>
              {(() => {
                const savedCharacters = JSON.parse(localStorage.getItem('savedCharacters') || '[]')
                return savedCharacters.length > 0 ? (
                  savedCharacters.map(char => (
                    <div 
                      key={char.id}
                      className={styles.characterLibraryItem}
                      onClick={() => {
                        addCharacter(char.modelUrl, { name: char.name })
                        setShowCharacterLibrary(false)
                      }}
                    >
                      <img 
                        src={char.thumbnail || '/default-character.png'} 
                        alt={char.name}
                        className={styles.characterLibraryThumb}
                      />
                      <span className={styles.characterLibraryName}>{char.name}</span>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>
                    <p>暂无保存的角色</p>
                    <p>请先在人物库中创建角色</p>
                  </div>
                )
              })()}
            </div>
            <button 
              className={styles.closeModalBtn}
              onClick={() => setShowCharacterLibrary(false)}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 动作库弹窗 */}
      {showActionLibrary && (
        <div className={styles.modalOverlay} onClick={() => setShowActionLibrary(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>选择动作</h3>
            <div className={styles.actionList}>
              {vrmaActions.map(action => (
                <div 
                  key={action.id}
                  className={styles.actionItem}
                  onClick={() => handleSelectAction(action)}
                >
                  <span className={styles.actionIcon}>🎭</span>
                  <div className={styles.actionInfo}>
                    <span className={styles.actionName}>{action.name}</span>
                    <span className={styles.actionCategory}>{action.category}</span>
                  </div>
                </div>
              ))}
            </div>
            <button 
              className={styles.closeModalBtn}
              onClick={() => setShowActionLibrary(false)}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// 格式化时间
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
}

export default ARTimelineEditorPage
