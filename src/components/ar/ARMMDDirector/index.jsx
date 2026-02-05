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
import { AddItemModal } from './AddItemModal'
import { Timeline } from './Timeline'
import { actions as vrmaActions } from '../../../data/actions250.js'
import { loadVRMAAction } from '../../../data/vrmaActions.js'

/**
 * AR MMD Director - 简化版MMD风格AR导演系统
 * 
 * 核心功能：
 * 1. 极简界面，只保留时间轴
 * 2. 时间轴+号弹出添加选项
 * 3. 支持拖拽调整位置、缩放调整时间
 * 4. 使用VRMA动作库
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
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCharacterModal, setShowCharacterModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [showSceneModal, setShowSceneModal] = useState(false)
  const [showEffectModal, setShowEffectModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [actionTarget, setActionTarget] = useState(null)
  
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
  
  // 添加场景到时间轴
  const addScenesToTimeline = (selectedScenes) => {
    const newScenes = selectedScenes.map((scene, index) => ({
      ...scene,
      timelinePosition: currentTime + index * 10
    }))
    
    setProject(prev => ({
      ...prev,
      scenes: [...prev.scenes, ...newScenes]
    }))
    
    const sceneClips = newScenes.map(scene => ({
      id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'scene',
      sceneId: scene.id,
      sceneName: scene.name,
      startTime: scene.timelinePosition,
      duration: 10,
      position: scene.position || { x: 0, y: 0, z: 0 }
    }))
    
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
        onAddClick={() => setShowAddModal(true)}
        onClipUpdate={handleClipUpdate}
        isPlaying={isPlaying}
        onPlayPause={togglePlay}
      />
      
      {/* 添加选项弹窗 */}
      {showAddModal && (
        <AddItemModal
          onSelect={(type) => {
            setShowAddModal(false)
            switch(type) {
              case 'character':
                setShowCharacterModal(true)
                break
              case 'scene':
                setShowSceneModal(true)
                break
              case 'action':
                if (project.tracks.filter(t => t.type === 'character').length > 0) {
                  const charTrack = project.tracks.find(t => t.type === 'character')
                  setActionTarget({
                    trackId: charTrack.id,
                    characterId: charTrack.characterId
                  })
                  setShowActionModal(true)
                } else {
                  alert('请先添加角色')
                }
                break
              case 'effect':
                setShowEffectModal(true)
                break
            }
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}
      
      {/* 其他弹窗 */}
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
      
      {showEffectModal && (
        <EffectSelectModal
          onSelect={(effect) => {
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
              tracks: [
                ...prev.tracks,
                {
                  id: `track_effect_${Date.now()}`,
                  type: 'effect',
                  name: effect.name,
                  clips: [newClip]
                }
              ]
            }))
            setShowEffectModal(false)
          }}
          onClose={() => setShowEffectModal(false)}
        />
      )}
      
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
