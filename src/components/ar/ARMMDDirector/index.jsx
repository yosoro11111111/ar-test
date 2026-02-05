import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import styles from './styles.module.css'
import { MultiCharacterManager } from '../MultiCharacterManager.js'
import { CharacterSelectModal } from './CharacterSelectModal'
import { ActionSelectModal } from './ActionSelectModal'
import { SceneMapModal } from './SceneMapModal'
import { Timeline } from './Timeline'
import { actions as vrmaActions } from '../../../data/actions250.js'
import { loadVRMAAction } from '../../../data/vrmaActions.js'

/**
 * AR MMD Director - MMD风格AR导演系统
 * 
 * 核心功能：
 * 1. 清爽可折叠界面
 * 2. 弹窗式角色/动作/场景选择
 * 3. 长时间轴编辑（多轨道）
 * 4. AR地图定位（场景位置）
 * 5. 可隐藏预览窗口
 * 6. 真实位移计算
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
  
  // 面板折叠状态
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(false)
  
  // 弹窗状态
  const [showCharacterModal, setShowCharacterModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [showSceneModal, setShowSceneModal] = useState(false)
  const [actionTarget, setActionTarget] = useState(null) // { characterId, trackId }
  
  // 项目数据
  const [project, setProject] = useState({
    id: `project_${Date.now()}`,
    name: '新项目',
    duration: 60,
    scenes: [],
    characters: [],
    tracks: []
  })
  
  // 时间轴状态
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedTrackId, setSelectedTrackId] = useState(null)
  const [timelineScale, setTimelineScale] = useState(1)
  
  // 初始化Three.js
  useEffect(() => {
    if (previewOpen) {
      initThreeJS()
    }
    return () => cleanup()
  }, [previewOpen])
  
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
  
  const initThreeJS = () => {
    if (!canvasRef.current) return
    
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    sceneRef.current = scene
    
    const camera = new THREE.PerspectiveCamera(60, 16/9, 0.1, 1000)
    camera.position.set(0, 5, 10)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera
    
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true
    })
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight)
    renderer.shadowMap.enabled = true
    rendererRef.current = renderer
    
    // 灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(10, 20, 10)
    dirLight.castShadow = true
    scene.add(dirLight)
    
    // 网格地面
    const gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x222222)
    scene.add(gridHelper)
    
    // 角色管理器
    characterManagerRef.current = new MultiCharacterManager(scene)
    
    // 加载现有角色
    project.characters.forEach(char => {
      loadCharacter(char)
    })
    
    // 渲染循环
    const animate = () => {
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        characterManagerRef.current?.update(0.016)
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
      requestAnimationFrame(animate)
    }
    animate()
  }
  
  // 加载角色
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
  
  // 添加角色
  const addCharacters = (selectedCharacters) => {
    const newCharacters = selectedCharacters.map(char => ({
      id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: char.name,
      vrmUrl: char.modelUrl,
      thumbnail: char.thumbnail,
      initialPosition: { x: 0, y: 0, z: 0 },
      initialRotation: { x: 0, y: 0, z: 0 },
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
          clips: []
        }))
      ]
    }))
    
    // 如果在预览模式，加载角色
    if (previewOpen && characterManagerRef.current) {
      newCharacters.forEach(char => loadCharacter(char))
    }
  }
  
  // 添加场景到时间轴
  const addScenesToTimeline = (selectedScenes) => {
    const newScenes = selectedScenes.map((scene, index) => ({
      ...scene,
      timelinePosition: currentTime + index * 10 // 每个场景间隔10秒
    }))
    
    setProject(prev => ({
      ...prev,
      scenes: [...prev.scenes, ...newScenes]
    }))
    
    // 创建场景轨道片段
    const sceneClips = newScenes.map(scene => ({
      id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'scene',
      sceneId: scene.id,
      sceneName: scene.name,
      startTime: scene.timelinePosition,
      duration: 10,
      position: scene.position || { x: 0, y: 0, z: 0 }
    }))
    
    // 添加或更新场景轨道
    setProject(prev => {
      const existingSceneTrack = prev.tracks.find(t => t.type === 'scene')
      if (existingSceneTrack) {
        return {
          ...prev,
          tracks: prev.tracks.map(t => 
            t.type === 'scene' 
              ? { ...t, clips: [...t.clips, ...sceneClips] }
              : t
          )
        }
      } else {
        return {
          ...prev,
          tracks: [
            ...prev.tracks,
            {
              id: 'track_scene',
              type: 'scene',
              name: '场景',
              clips: sceneClips
            }
          ]
        }
      }
    })
  }
  
  // 添加动作到时间轴
  const addActionToTimeline = (action) => {
    if (!actionTarget) return
    
    const newClip = {
      id: `clip_${Date.now()}`,
      type: 'action',
      actionId: action.id,
      actionName: action.name,
      startTime: currentTime,
      duration: action.duration || 5,
      filePath: action.filePath
    }
    
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => 
        track.id === actionTarget.trackId
          ? { ...track, clips: [...track.clips, newClip] }
          : track
      )
    }))
    
    setShowActionModal(false)
    setActionTarget(null)
  }
  
  // 更新时间轴位置
  const updateSceneAtTime = (time) => {
    // 更新角色动作
    project.tracks.forEach(track => {
      if (track.type === 'character') {
        const activeClips = track.clips.filter(clip => 
          time >= clip.startTime && time <= clip.startTime + clip.duration
        )
        
        activeClips.forEach(clip => {
          if (clip.type === 'action') {
            const character = characterManagerRef.current?.getCharacter(track.characterId)
            if (character && clip.filePath) {
              loadVRMAAction(clip.filePath, character.vrm).then(result => {
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
        })
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
            className={styles.menuBtn}
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          >
            {leftPanelOpen ? '◀' : '▶'}
          </button>
          <h1 className={styles.title}>AR MMD Director</h1>
        </div>
        
        <div className={styles.headerRight}>
          <button className={styles.iconBtn} onClick={saveProject} title="保存">
            💾
          </button>
          <button className={styles.iconBtn} title="设置">
            ⚙️
          </button>
        </div>
      </header>
      
      {/* 主内容区 */}
      <div className={styles.main}>
        {/* 左侧面板 - 场景地图 */}
        {leftPanelOpen && (
          <aside className={styles.leftPanel}>
            <div className={styles.panelHeader}>
              <h3>🗺️ 场景地图</h3>
              <button 
                className={styles.addBtn}
                onClick={() => setShowSceneModal(true)}
              >
                ➕
              </button>
            </div>
            
            <div className={styles.sceneMap}>
              {project.scenes.length === 0 ? (
                <div className={styles.emptyMap}>
                  <p>点击 ➕ 添加场景</p>
                  <p>场景将显示在地图上</p>
                </div>
              ) : (
                <div className={styles.mapContent}>
                  {project.scenes.map((scene, index) => (
                    <div 
                      key={scene.id}
                      className={styles.mapScene}
                      style={{
                        left: `${(scene.position?.x || 0) * 10 + 50}%`,
                        top: `${(scene.position?.z || 0) * 10 + 50}%`
                      }}
                    >
                      <div className={styles.mapSceneDot}>
                        {index + 1}
                      </div>
                      <span className={styles.mapSceneName}>{scene.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className={styles.sceneList}>
              <h4>已选场景 ({project.scenes.length})</h4>
              {project.scenes.map((scene, index) => (
                <div key={scene.id} className={styles.sceneListItem}>
                  <span className={styles.sceneNumber}>{index + 1}</span>
                  <span className={styles.sceneListName}>{scene.name}</span>
                </div>
              ))}
            </div>
          </aside>
        )}
        
        {/* 中央预览区 */}
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
                <span>3D 预览</span>
                <button 
                  className={styles.hidePreviewBtn}
                  onClick={() => setPreviewOpen(false)}
                >
                  ✕
                </button>
              </div>
              <canvas ref={canvasRef} className={styles.previewCanvas} />
            </div>
          )}
        </div>
      </div>
      
      {/* 底部工具栏 */}
      <div className={styles.bottomToolbar}>
        <button 
          className={styles.toolbarBtn}
          onClick={() => setShowCharacterModal(true)}
        >
          <span>👤</span>
          <span>角色</span>
        </button>
        
        <button 
          className={styles.toolbarBtn}
          onClick={() => setShowSceneModal(true)}
        >
          <span>🗺️</span>
          <span>场景</span>
        </button>
        
        <button 
          className={styles.toolbarBtn}
          onClick={() => {
            if (project.tracks.length > 0) {
              setActionTarget({
                trackId: project.tracks[0].id,
                characterId: project.tracks[0].characterId
              })
              setShowActionModal(true)
            } else {
              alert('请先添加角色')
            }
          }}
        >
          <span>🎭</span>
          <span>动作</span>
        </button>
        
        <button className={styles.toolbarBtn}>
          <span>✨</span>
          <span>特效</span>
        </button>
        
        <div className={styles.toolbarDivider} />
        
        <button 
          className={`${styles.playBtn} ${isPlaying ? styles.playing : ''}`}
          onClick={togglePlay}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
      </div>
      
      {/* 时间轴 */}
      <Timeline
        tracks={project.tracks}
        currentTime={currentTime}
        duration={project.duration}
        scale={timelineScale}
        onTimeChange={setCurrentTime}
        onTrackSelect={setSelectedTrackId}
        onAddAction={(trackId, characterId) => {
          setActionTarget({ trackId, characterId })
          setShowActionModal(true)
        }}
      />
      
      {/* 弹窗 */}
      {showCharacterModal && (
        <CharacterSelectModal
          onSelect={addCharacters}
          onClose={() => setShowCharacterModal(false)}
        />
      )}
      
      {showActionModal && (
        <ActionSelectModal
          actions={vrmaActions}
          onSelect={addActionToTimeline}
          onClose={() => {
            setShowActionModal(false)
            setActionTarget(null)
          }}
        />
      )}
      
      {showSceneModal && (
        <SceneMapModal
          onSelect={addScenesToTimeline}
          onClose={() => setShowSceneModal(false)}
        />
      )}
    </div>
  )
}

export default ARMMDDirector
