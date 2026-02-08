import React, { useState, useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import styles from './MMDStudio.module.css'

// 核心系统
import { getProjectManager } from '../core'
import { ensureDatabase } from '../core/dbUtils'

// 组件
import { ResourceBrowser } from './components/ResourceBrowser'

/**
 * MMD Studio - 完整版
 * 
 * 参考 ARMMDDirector 设计
 * - 预览区域可调整大小
 * - 完整的时间轴系统
 * - 多角色支持
 * - 轨道编辑
 */
export function MMDStudio() {
  // ============ 项目状态 ============
  const [project, setProject] = useState({
    id: `project_${Date.now()}`,
    name: '新项目',
    duration: 120,
    characters: [],
    tracks: [],
    backgroundImage: null
  })
  const [isModified, setIsModified] = useState(false)
  
  // ============ 预览状态 ============
  const [previewOpen, setPreviewOpen] = useState(true)
  const [canvasSettings, setCanvasSettings] = useState({
    width: 1920,
    height: 1080,
    aspectRatio: '16:9'
  })
  
  // ============ 播放状态 ============
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [timelineScale, setTimelineScale] = useState(1)
  
  // ============ 选中状态 ============
  const [selectedCharacterId, setSelectedCharacterId] = useState(null)
  const [selectedTrackId, setSelectedTrackId] = useState(null)
  const [selectedCellId, setSelectedCellId] = useState(null)
  
  // ============ 界面状态 ============
  const [showResourceBrowser, setShowResourceBrowser] = useState(false)
  const [resourceBrowserType, setResourceBrowserType] = useState('characters')
  const [expandedCharacters, setExpandedCharacters] = useState(new Set())
  const [showTrackSelector, setShowTrackSelector] = useState(null)
  
  // ============ Three.js 引用 ============
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const animationFrameRef = useRef(null)
  const characterModelsRef = useRef(new Map())
  
  const projectManager = useRef(getProjectManager())
  
  // ============ 初始化 ============
  useEffect(() => {
    ensureDatabase()
    if (previewOpen) {
      setTimeout(initThreeJS, 100)
    }
    return () => cleanup()
  }, [previewOpen])
  
  // ============ 播放循环 ============
  useEffect(() => {
    if (isPlaying && previewOpen) {
      const startTime = performance.now() - currentTime * 1000
      const endTime = project.duration
      
      const playLoop = () => {
        const elapsed = (performance.now() - startTime) / 1000
        
        if (elapsed >= endTime) {
          setIsPlaying(false)
          setCurrentTime(0)
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
  
  // 时间轴拖动时更新场景
  useEffect(() => {
    if (previewOpen && !isPlaying) {
      updateSceneAtTime(currentTime)
    }
  }, [currentTime, previewOpen, isPlaying])
  
  // ============ Three.js 初始化 ============
  const initThreeJS = () => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0f)
    sceneRef.current = scene
    
    const camera = new THREE.PerspectiveCamera(50, rect.width / rect.height, 0.1, 1000)
    camera.position.set(0, 1.5, 5)
    camera.lookAt(0, 1, 0)
    cameraRef.current = camera
    
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true
    })
    renderer.setSize(rect.width, rect.height)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    rendererRef.current = renderer
    
    // 灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 7)
    directionalLight.castShadow = true
    scene.add(directionalLight)
    
    // 网格
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
    scene.add(gridHelper)
    
    // 加载已有角色
    project.characters.forEach(char => loadCharacterModel(char))
    
    animate()
  }
  
  const animate = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return
    requestAnimationFrame(animate)
    rendererRef.current.render(sceneRef.current, cameraRef.current)
  }
  
  // ============ 角色管理 ============
  const loadCharacterModel = (character) => {
    if (!sceneRef.current || characterModelsRef.current.has(character.id)) return
    
    const loader = new GLTFLoader()
    loader.load(
      character.modelPath,
      (gltf) => {
        const model = gltf.scene
        model.position.set(
          character.position?.x || 0,
          character.position?.y || 0,
          character.position?.z || 0
        )
        model.scale.setScalar(character.scale || 1)
        model.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })
        sceneRef.current.add(model)
        characterModelsRef.current.set(character.id, model)
      },
      undefined,
      (error) => {
        console.error('加载角色失败:', error)
      }
    )
  }
  
  const updateSceneAtTime = (time) => {
    // 更新角色动画和位置
    project.tracks.forEach(track => {
      const cell = track.clips?.find(c => time >= c.startTime && time < c.startTime + c.duration)
      if (cell && characterModelsRef.current.has(track.characterId)) {
        const model = characterModelsRef.current.get(track.characterId)
        // 这里可以添加动画混合
      }
    })
  }
  
  // ============ 项目操作 ============
  const addCharacter = (resource) => {
    const newCharacter = {
      id: `char_${Date.now()}`,
      name: resource.name,
      modelPath: resource.path,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 1
    }
    
    const updatedProject = {
      ...project,
      characters: [...project.characters, newCharacter]
    }
    
    setProject(updatedProject)
    setSelectedCharacterId(newCharacter.id)
    setIsModified(true)
    
    // 加载模型
    if (sceneRef.current) {
      loadCharacterModel(newCharacter)
    }
    
    // 自动展开
    setExpandedCharacters(prev => new Set([...prev, newCharacter.id]))
  }
  
  const deleteCharacter = (characterId) => {
    const updatedProject = {
      ...project,
      characters: project.characters.filter(c => c.id !== characterId),
      tracks: project.tracks.filter(t => t.characterId !== characterId)
    }
    setProject(updatedProject)
    
    // 移除模型
    if (characterModelsRef.current.has(characterId)) {
      const model = characterModelsRef.current.get(characterId)
      sceneRef.current?.remove(model)
      characterModelsRef.current.delete(characterId)
    }
    
    if (selectedCharacterId === characterId) {
      setSelectedCharacterId(null)
    }
  }
  
  // ============ 轨道管理 ============
  const addTrack = (characterId, trackType) => {
    const newTrack = {
      id: `track_${Date.now()}`,
      characterId,
      type: trackType,
      name: getTrackTypeName(trackType),
      clips: []
    }
    
    const updatedProject = {
      ...project,
      tracks: [...project.tracks, newTrack]
    }
    
    setProject(updatedProject)
    setShowTrackSelector(null)
    setIsModified(true)
  }
  
  const getTrackTypeName = (type) => {
    const names = {
      action: '动作',
      position: '位置',
      expression: '表情',
      camera: '摄像机'
    }
    return names[type] || type
  }
  
  // ============ 片段操作 ============
  const addCell = (trackId, startTime) => {
    const track = project.tracks.find(t => t.id === trackId)
    if (!track) return
    
    const newCell = {
      id: `cell_${Date.now()}`,
      startTime,
      duration: 5,
      name: '新片段'
    }
    
    const updatedProject = {
      ...project,
      tracks: project.tracks.map(t =>
        t.id === trackId
          ? { ...t, clips: [...(t.clips || []), newCell] }
          : t
      )
    }
    
    setProject(updatedProject)
    setIsModified(true)
  }
  
  // ============ 工具函数 ============
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }
  
  const toggleCharacterExpansion = (characterId) => {
    setExpandedCharacters(prev => {
      const newSet = new Set(prev)
      if (newSet.has(characterId)) {
        newSet.delete(characterId)
      } else {
        newSet.add(characterId)
      }
      return newSet
    })
  }
  
  const getCharacterTracks = (characterId) => {
    return project.tracks.filter(t => t.characterId === characterId)
  }
  
  // ============ 清理 ============
  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (rendererRef.current) {
      rendererRef.current.dispose()
    }
    characterModelsRef.current.clear()
  }
  
  // ============ 渲染 ============
  return (
    <div className={styles.container}>
      {/* 顶部工具栏 */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>🎬 MMD Studio</span>
          <div className={styles.projectInfo}>
            <span className={styles.projectName}>{project.name}</span>
            {isModified && <span className={styles.modifiedIndicator}>*</span>}
          </div>
        </div>
        
        <div className={styles.headerCenter}>
          <button
            className={styles.quickAddBtn}
            onClick={() => {
              setResourceBrowserType('characters')
              setShowResourceBrowser(true)
            }}
          >
            <span>👤</span>
            <span>添加角色</span>
          </button>
          <button
            className={styles.quickAddBtn}
            onClick={() => {
              setResourceBrowserType('props')
              setShowResourceBrowser(true)
            }}
          >
            <span>📦</span>
            <span>添加道具</span>
          </button>
          <button
            className={styles.quickAddBtn}
            onClick={() => {
              setResourceBrowserType('scenes')
              setShowResourceBrowser(true)
            }}
          >
            <span>🎬</span>
            <span>设置场景</span>
          </button>
        </div>
        
        <div className={styles.headerRight}>
          <button className={styles.iconBtn} title="撤销">↩</button>
          <button className={styles.iconBtn} title="重做">↪</button>
          <div className={styles.divider} />
          <button className={styles.iconBtn} title="设置">⚙</button>
          <button className={styles.iconBtn} title="导出">💾</button>
        </div>
      </header>
      
      {/* 主工作区 */}
      <div className={styles.workspace}>
        {/* 左侧角色列表 */}
        <div className={styles.characterPanel}>
          <div className={styles.panelHeader}>
            <span>角色</span>
            <span className={styles.count}>{project.characters.length}</span>
          </div>
          <div className={styles.characterList}>
            {project.characters.map(char => (
              <div
                key={char.id}
                className={`${styles.characterItem} ${selectedCharacterId === char.id ? styles.selected : ''}`}
                onClick={() => setSelectedCharacterId(char.id)}
              >
                <span className={styles.characterIcon}>👤</span>
                <span className={styles.characterName}>{char.name}</span>
                <button
                  className={styles.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteCharacter(char.id)
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            {project.characters.length === 0 && (
              <div className={styles.emptyHint}>
                点击上方"添加角色"按钮
              </div>
            )}
          </div>
        </div>
        
        {/* 中央预览和时间轴 */}
        <div className={styles.mainArea}>
          {/* 预览区域 */}
          {previewOpen && (
            <div className={styles.previewArea}>
              <div className={styles.previewContainer}>
                <div className={styles.previewHeader}>
                  <span>预览</span>
                  <span>{canvasSettings.width} × {canvasSettings.height}</span>
                </div>
                <canvas
                  ref={canvasRef}
                  className={styles.previewCanvas}
                />
              </div>
            </div>
          )}
          
          {/* 时间轴区域 */}
          <div className={styles.timelineArea}>
            {/* 时间轴控制栏 */}
            <div className={styles.timelineToolbar}>
              <div className={styles.playbackControls}>
                <button onClick={() => setCurrentTime(0)}>⏮</button>
                <button
                  className={styles.playBtn}
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? '⏸' : '▶'}
                </button>
                <button onClick={() => setCurrentTime(project.duration)}>⏭</button>
                <span className={styles.timeDisplay}>
                  {formatTime(currentTime)} / {formatTime(project.duration)}
                </span>
              </div>
              
              <div className={styles.timelineZoom}>
                <button onClick={() => setTimelineScale(Math.max(0.5, timelineScale - 0.1))}>🔍-</button>
                <span>{Math.round(timelineScale * 100)}%</span>
                <button onClick={() => setTimelineScale(Math.min(3, timelineScale + 0.1))}>🔍+</button>
              </div>
            </div>
            
            {/* 时间轴内容 */}
            <div className={styles.timelineContent}>
              {/* 时间刻度 */}
              <div className={styles.timeRuler}>
                {Array.from({ length: Math.ceil(project.duration / 10) + 1 }, (_, i) => (
                  <div
                    key={i}
                    className={styles.timeMarker}
                    style={{ left: `${(i * 10 / project.duration) * 100 * timelineScale}%` }}
                  >
                    {formatTime(i * 10)}
                  </div>
                ))}
              </div>
              
              {/* 角色轨道组 */}
              {project.characters.map(char => (
                <div key={char.id} className={styles.trackGroup}>
                  {/* 角色头部 */}
                  <div
                    className={styles.trackGroupHeader}
                    onClick={() => toggleCharacterExpansion(char.id)}
                  >
                    <span className={styles.trackGroupIcon}>👤</span>
                    <span className={styles.trackGroupName}>{char.name}</span>
                    <button
                      className={styles.addTrackBtn}
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowTrackSelector(char.id)
                      }}
                    >
                      + 轨道
                    </button>
                    <span className={`${styles.expandIcon} ${expandedCharacters.has(char.id) ? styles.expanded : ''}`}>
                      ▶
                    </span>
                  </div>
                  
                  {/* 轨道列表 */}
                  {expandedCharacters.has(char.id) && (
                    <div className={styles.tracksList}>
                      {getCharacterTracks(char.id).map(track => (
                        <div key={track.id} className={styles.track}>
                          <div className={styles.trackLabel}>{track.name}</div>
                          <div className={styles.trackTimeline}>
                            <div
                              className={styles.playhead}
                              style={{ left: `${(currentTime / project.duration) * 100}%` }}
                            />
                            {track.clips?.map(cell => (
                              <div
                                key={cell.id}
                                className={`${styles.cell} ${selectedCellId === cell.id ? styles.selected : ''}`}
                                style={{
                                  left: `${(cell.startTime / project.duration) * 100}%`,
                                  width: `${(cell.duration / project.duration) * 100}%`
                                }}
                                onClick={() => setSelectedCellId(cell.id)}
                              >
                                {cell.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      {/* 添加轨道按钮 */}
                      {showTrackSelector === char.id && (
                        <div className={styles.trackSelector}>
                          {['action', 'position', 'expression'].map(type => (
                            <button
                              key={type}
                              onClick={() => addTrack(char.id, type)}
                            >
                              {getTrackTypeName(type)}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {getCharacterTracks(char.id).length === 0 && (
                        <div className={styles.emptyTracks}>
                          点击"+ 轨道"添加动画轨道
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {project.characters.length === 0 && (
                <div className={styles.emptyTimeline}>
                  <div className={styles.emptyIcon}>⏱️</div>
                  <div>添加角色后开始编辑时间轴</div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 右侧属性面板 */}
        <div className={styles.propertyPanel}>
          <div className={styles.panelHeader}>属性</div>
          {selectedCharacterId ? (
            <div className={styles.propertyContent}>
              {(() => {
                const char = project.characters.find(c => c.id === selectedCharacterId)
                if (!char) return null
                return (
                  <>
                    <div className={styles.propertySection}>
                      <h4>位置</h4>
                      {['x', 'y', 'z'].map(axis => (
                        <div key={axis} className={styles.propertyRow}>
                          <label>{axis.toUpperCase()}</label>
                          <input
                            type="number"
                            value={char.position?.[axis] || 0}
                            step="0.1"
                            onChange={(e) => {
                              const updatedProject = {
                                ...project,
                                characters: project.characters.map(c =>
                                  c.id === char.id
                                    ? { ...c, position: { ...c.position, [axis]: parseFloat(e.target.value) } }
                                    : c
                                )
                              }
                              setProject(updatedProject)
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div className={styles.propertySection}>
                      <h4>旋转</h4>
                      {['x', 'y', 'z'].map(axis => (
                        <div key={axis} className={styles.propertyRow}>
                          <label>{axis.toUpperCase()}</label>
                          <input
                            type="number"
                            value={char.rotation?.[axis] || 0}
                            step="0.1"
                            onChange={(e) => {
                              const updatedProject = {
                                ...project,
                                characters: project.characters.map(c =>
                                  c.id === char.id
                                    ? { ...c, rotation: { ...c.rotation, [axis]: parseFloat(e.target.value) } }
                                    : c
                                )
                              }
                              setProject(updatedProject)
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div className={styles.propertySection}>
                      <h4>缩放</h4>
                      <div className={styles.propertyRow}>
                        <label>S</label>
                        <input
                          type="number"
                          value={char.scale || 1}
                          step="0.1"
                          min="0.1"
                          onChange={(e) => {
                            const updatedProject = {
                              ...project,
                              characters: project.characters.map(c =>
                                c.id === char.id
                                  ? { ...c, scale: parseFloat(e.target.value) }
                                  : c
                              )
                            }
                            setProject(updatedProject)
                          }}
                        />
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          ) : (
            <div className={styles.emptyProperty}>
              <div className={styles.emptyIcon}>👤</div>
              <div>选择角色查看属性</div>
            </div>
          )}
        </div>
      </div>
      
      {/* 资源浏览器 */}
      {showResourceBrowser && (
        <ResourceBrowser
          type={resourceBrowserType}
          onSelect={(resource) => {
            if (resourceBrowserType === 'characters') {
              addCharacter(resource)
            }
            setShowResourceBrowser(false)
          }}
          onClose={() => setShowResourceBrowser(false)}
        />
      )}
    </div>
  )
}

export default MMDStudio
