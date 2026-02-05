import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import styles from './styles.module.css'
import { MultiCharacterManager } from '../MultiCharacterManager.js'
import { CharacterSelectModal } from './CharacterSelectModal'
import { CellEditModal } from './CellEditModal'
import { SettingsModal } from './SettingsModal'
import { Timeline } from './Timeline'
import { loadVRMAAction } from '../../../data/vrmaActions.js'

/**
 * AR MMD Director - 三轨道版本
 * 
 * 每个角色有3条子轨道：
 * - 场景轨道（绿色）
 * - 动作轨道（粉色）
 * - 特效轨道（黄色）
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
      preserveDrawingBuffer: true
    })
    renderer.setSize(canvasWidth, canvasHeight)
    renderer.shadowMap.enabled = true
    rendererRef.current = renderer
    
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
  
  // 添加角色 - 创建3条子轨道
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
    
    setProject(prev => ({
      ...prev,
      characters: [...prev.characters, ...newCharacters],
      tracks: [
        ...prev.tracks,
        ...newCharacters.map(char => ({
          id: `track_${char.id}`,
          type: 'character',
          characterId: char.id,
          characterName: char.name,
          characterColor: char.color,
          scene: [],
          action: [],
          effect: []
        }))
      ]
    }))
    
    if (previewOpen && characterManagerRef.current) {
      newCharacters.forEach(char => loadCharacter(char))
    }
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
  
  // 更新时间轴
  const updateSceneAtTime = (time) => {
    project.tracks.forEach(track => {
      if (track.type === 'character') {
        const character = characterManagerRef.current?.getCharacter(track.characterId)
        if (!character) return
        
        // 应用场景
        const activeScene = track.scene.find(s => time >= s.startTime && time <= s.startTime + s.duration)
        if (activeScene?.position) {
          character.vrm.scene.position.set(
            activeScene.position.x,
            activeScene.position.y,
            activeScene.position.z
          )
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
            </div>
          )}
        </div>
      </div>
      
      {/* 时间轴 */}
      <Timeline
        tracks={project.tracks}
        currentTime={currentTime}
        duration={project.duration}
        scale={timelineScale}
        onTimeChange={setCurrentTime}
        onAddCharacter={() => setShowCharacterModal(true)}
        onAddCell={addCell}
        onEditCell={(trackId, subTrackType, cell) => {
          setEditingCell({ trackId, subTrackType, cell })
          setShowCellEditModal(true)
        }}
        onCellUpdate={updateCell}
        onDeleteCell={deleteCell}
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
        />
      )}
    </div>
  )
}

export default ARMMDDirector
