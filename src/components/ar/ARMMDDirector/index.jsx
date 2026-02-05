import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import styles from './styles.module.css'
import { MultiCharacterManager } from '../MultiCharacterManager.js'
import { CharacterSelectModal } from './CharacterSelectModal'
import { ActionSelectModal } from './ActionSelectModal'
import { SceneMapModal } from './SceneMapModal'
import { EffectSelectModal } from './EffectSelectModal'
import { SettingsModal } from './SettingsModal'
import { Timeline } from './Timeline'
import { actions as vrmaActions } from '../../../data/actions250.js'
import { loadVRMAAction } from '../../../data/vrmaActions.js'

/**
 * AR MMD Director - 简化版MMD风格AR导演系统
 * 
 * 操作流程：
 * 1. 点击时间轴+号 -> 选择角色
 * 2. 角色轨道显示在列表中
 * 3. 点击角色轨道后的+号 -> 选择场景/动作/特效
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
  const [showActionModal, setShowActionModal] = useState(false)
  const [showSceneModal, setShowSceneModal] = useState(false)
  const [showEffectModal, setShowEffectModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showAddContentModal, setShowAddContentModal] = useState(false)
  const [selectedTrackForContent, setSelectedTrackForContent] = useState(null)
  
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
          clips: []
        }))
      ]
    }))
    
    if (previewOpen && characterManagerRef.current) {
      newCharacters.forEach(char => loadCharacter(char))
    }
  }
  
  // 添加场景到角色
  const addSceneToCharacter = (selectedScenes) => {
    if (!selectedTrackForContent) return
    
    const sceneClips = selectedScenes.map((scene, index) => ({
      id: `clip_scene_${Date.now()}_${index}`,
      type: 'scene',
      sceneId: scene.id,
      sceneName: scene.name,
      startTime: currentTime + index * 10,
      duration: 10,
      position: scene.position || { x: 0, y: 0, z: 0 }
    }))
    
    setProject(prev => ({
      ...prev,
      scenes: [...prev.scenes, ...selectedScenes],
      tracks: prev.tracks.map(track => 
        track.id === selectedTrackForContent
          ? { ...track, clips: [...track.clips, ...sceneClips] }
          : track
      )
    }))
    
    setShowSceneModal(false)
    setSelectedTrackForContent(null)
  }
  
  // 添加动作到角色
  const addActionToCharacter = (action) => {
    if (!selectedTrackForContent) return
    
    const newClip = {
      id: `clip_action_${Date.now()}`,
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
        track.id === selectedTrackForContent
          ? { ...track, clips: [...track.clips, newClip] }
          : track
      )
    }))
    
    setShowActionModal(false)
    setSelectedTrackForContent(null)
  }
  
  // 添加特效到角色
  const addEffectToCharacter = (effect) => {
    if (!selectedTrackForContent) return
    
    const newClip = {
      id: `clip_effect_${Date.now()}`,
      type: 'effect',
      effectId: effect.id,
      effectName: effect.name,
      startTime: currentTime,
      duration: 5
    }
    
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => 
        track.id === selectedTrackForContent
          ? { ...track, clips: [...track.clips, newClip] }
          : track
      )
    }))
    
    setShowEffectModal(false)
    setSelectedTrackForContent(null)
  }
  
  // 处理时间轴片段更新（拖拽、缩放）
  const handleClipUpdate = (trackId, clipId, updates) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => 
        track.id === trackId
          ? {
              ...track,
              clips: track.clips.map(clip =>
                clip.id === clipId ? { ...clip, ...updates } : clip
              )
            }
          : track
      )
    }))
  }
  
  // 更新时间轴位置
  const updateSceneAtTime = (time) => {
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
      
      {/* 主内容区 - 只保留预览 */}
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
      
      {/* 时间轴 */}
      <Timeline
        tracks={project.tracks}
        currentTime={currentTime}
        duration={project.duration}
        scale={timelineScale}
        onTimeChange={setCurrentTime}
        onTrackSelect={setSelectedTrackId}
        onAddCharacter={() => setShowCharacterModal(true)}
        onAddContent={(trackId) => {
          setSelectedTrackForContent(trackId)
          setShowAddContentModal(true)
        }}
        onClipUpdate={handleClipUpdate}
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
      
      {/* 添加内容选择弹窗（场景/动作/特效） */}
      {showAddContentModal && (
        <div className={styles.overlay} onClick={() => setShowAddContentModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.header}>
              <h2>➕ 添加内容</h2>
              <button className={styles.closeBtn} onClick={() => setShowAddContentModal(false)}>✕</button>
            </div>
            <div className={styles.options}>
              <button
                className={styles.option}
                onClick={() => {
                  setShowAddContentModal(false)
                  setShowSceneModal(true)
                }}
                style={{ '--option-color': '#4ade80' }}
              >
                <span className={styles.optionIcon}>🗺️</span>
                <span className={styles.optionName}>场景</span>
                <span className={styles.optionDesc}>添加AR场景</span>
              </button>
              <button
                className={styles.option}
                onClick={() => {
                  setShowAddContentModal(false)
                  setShowActionModal(true)
                }}
                style={{ '--option-color': '#f093fb' }}
              >
                <span className={styles.optionIcon}>🎭</span>
                <span className={styles.optionName}>动作</span>
                <span className={styles.optionDesc}>添加VRMA动作</span>
              </button>
              <button
                className={styles.option}
                onClick={() => {
                  setShowAddContentModal(false)
                  setShowEffectModal(true)
                }}
                style={{ '--option-color': '#fbbf24' }}
              >
                <span className={styles.optionIcon}>✨</span>
                <span className={styles.optionName}>特效</span>
                <span className={styles.optionDesc}>添加视觉特效</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 场景选择弹窗 */}
      {showSceneModal && (
        <SceneMapModal
          onSelect={addSceneToCharacter}
          onClose={() => {
            setShowSceneModal(false)
            setSelectedTrackForContent(null)
          }}
        />
      )}
      
      {/* 动作选择弹窗 */}
      {showActionModal && (
        <ActionSelectModal
          actions={vrmaActions}
          onSelect={addActionToCharacter}
          onClose={() => {
            setShowActionModal(false)
            setSelectedTrackForContent(null)
          }}
        />
      )}
      
      {/* 特效选择弹窗 */}
      {showEffectModal && (
        <EffectSelectModal
          onSelect={addEffectToCharacter}
          onClose={() => {
            setShowEffectModal(false)
            setSelectedTrackForContent(null)
          }}
        />
      )}
      
      {/* 设置弹窗 */}
      {showSettingsModal && (
        <SettingsModal
          project={project}
          onClose={() => setShowSettingsModal(false)}
          onExport={(type) => {
            alert(`${type === 'gif' ? 'GIF' : '视频'}导出功能开发中...`)
          }}
        />
      )}
    </div>
  )
}

export default ARMMDDirector
