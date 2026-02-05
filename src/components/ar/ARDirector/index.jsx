import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as THREE from 'three'
import styles from './styles.module.css'
import { MultiCharacterManager } from '../MultiCharacterManager.js'
import { actions as vrmaActions } from '../../../data/actions250.js'
import { loadVRMAAction } from '../../../data/vrmaActions.js'

/**
 * AR Director - 专业级时间轴导演（横屏版）
 * 
 * 核心功能：
 * 1. 左侧边栏：场景选择 + 角色管理 + 动作库 + 特效
 * 2. 中间上方：3D预览窗口 + 播放控制
 * 3. 中间下方：多轨道时间轴（角色动作、特效、相机）
 */
export function ARDirector() {
  const navigate = useNavigate()
  const { sceneId } = useParams()
  
  // Three.js引用
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const characterManagerRef = useRef(null)
  
  // 场景数据
  const [scene, setScene] = useState(null)
  const [characters, setCharacters] = useState([])
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  
  // 时间轴数据
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(30)
  const [isPlaying, setIsPlaying] = useState(false)
  const [tracks, setTracks] = useState([])
  
  // 弹窗状态
  const [showCharacterLibrary, setShowCharacterLibrary] = useState(false)
  const [showActionLibrary, setShowActionLibrary] = useState(false)
  const [showEffectPanel, setShowEffectPanel] = useState(false)
  const [actionTarget, setActionTarget] = useState(null)
  
  // 初始化
  useEffect(() => {
    initThreeJS()
    loadScene()
    return () => cleanup()
  }, [])
  
  // 动画循环
  useEffect(() => {
    let animationId
    const animate = () => {
      if (isPlaying) {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false)
            return duration
          }
          return prev + 0.016
        })
      }
      
      if (characterManagerRef.current) {
        characterManagerRef.current.update(0.016)
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
      
      animationId = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(animationId)
  }, [isPlaying])
  
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
      antialias: true
    })
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight)
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
  
  const loadScene = () => {
    const scenes = JSON.parse(localStorage.getItem('ar-director-scenes') || '[]')
    const currentScene = scenes.find(s => s.id === sceneId)
    
    if (currentScene) {
      setScene(currentScene)
      
      // 加载平面
      if (currentScene.environment?.planes) {
        currentScene.environment.planes.forEach(plane => {
          const geometry = new THREE.PlaneGeometry(plane.size.width, plane.size.height)
          const material = new THREE.MeshBasicMaterial({
            color: plane.color,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
          })
          const mesh = new THREE.Mesh(geometry, material)
          mesh.position.set(plane.position.x, plane.position.y, plane.position.z)
          mesh.rotation.set(plane.rotation.x, plane.rotation.y, plane.rotation.z)
          sceneRef.current.add(mesh)
        })
      }
    }
  }
  
  // 添加角色
  const addCharacter = async (vrmUrl, options = {}) => {
    try {
      const charId = await characterManagerRef.current.addCharacter(vrmUrl, {
        position: { x: 0, y: 0, z: 0 },
        ...options
      })
      
      const newCharacter = {
        id: charId,
        name: options.name || `角色${characters.length + 1}`,
        vrmUrl,
        tracks: []
      }
      
      setCharacters(prev => [...prev, newCharacter])
      setSelectedCharacter(newCharacter.id)
      
      // 添加角色轨道
      setTracks(prev => [...prev, {
        id: `track_${charId}`,
        type: 'character',
        characterId: charId,
        characterName: newCharacter.name,
        clips: []
      }])
    } catch (error) {
      console.error('添加角色失败:', error)
    }
  }
  
  // 添加动作到时间轴
  const addActionToTimeline = async (action) => {
    if (!actionTarget) return
    
    const character = characterManagerRef.current.getCharacter(actionTarget.characterId)
    if (!character) return
    
    try {
      const result = await loadVRMAAction(action.filePath, character.vrm)
      if (result?.clip) {
        // 播放预览
        characterManagerRef.current.playCharacterAction(actionTarget.characterId, result.clip, {
          loop: false,
          transitionDuration: 0.3
        })
        
        // 添加到轨道
        setTracks(prev => prev.map(track => {
          if (track.id === actionTarget.trackId) {
            return {
              ...track,
              clips: [...track.clips, {
                id: `clip_${Date.now()}`,
                actionId: action.id,
                actionName: action.name,
                startTime: currentTime,
                duration: result.clip.duration || 3,
                clip: result.clip
              }]
            }
          }
          return track
        }))
      }
    } catch (error) {
      console.error('加载动作失败:', error)
    }
    
    setShowActionLibrary(false)
    setActionTarget(null)
  }
  
  // 删除角色
  const removeCharacter = (charId) => {
    characterManagerRef.current.removeCharacter(charId)
    setCharacters(prev => prev.filter(c => c.id !== charId))
    setTracks(prev => prev.filter(t => t.characterId !== charId))
    if (selectedCharacter === charId) {
      setSelectedCharacter(null)
    }
  }
  
  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }
  
  const cleanup = () => {
    if (characterManagerRef.current) {
      characterManagerRef.current.dispose()
    }
    if (rendererRef.current) {
      rendererRef.current.dispose()
    }
  }
  
  return (
    <div className={styles.container}>
      {/* 顶部栏 */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/ar-director/manager')}>
          ← 返回
        </button>
        <div className={styles.projectInfo}>
          <h1 className={styles.projectName}>{scene?.name || '未命名项目'}</h1>
          <span className={styles.sceneInfo}>{scene?.environment?.planes?.length || 0} 个平面</span>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.actionBtn}>💾 保存</button>
          <button className={styles.actionBtn}>👁️ 预览</button>
          <button className={styles.exportBtn}>🎬 导出</button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className={styles.main}>
        {/* 左侧边栏 */}
        <aside className={styles.sidebar}>
          {/* 场景信息 */}
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>📐 场景</h3>
            <div className={styles.sceneCard}>
              {scene?.thumbnail && (
                <img src={scene.thumbnail} alt={scene.name} className={styles.sceneThumb} />
              )}
              <span className={styles.sceneName}>{scene?.name}</span>
            </div>
          </div>
          
          {/* 角色管理 */}
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>👤 角色</h3>
            <button 
              className={styles.addBtn}
              onClick={() => setShowCharacterLibrary(true)}
            >
              ➕ 添加角色
            </button>
            <div className={styles.characterList}>
              {characters.map(char => (
                <div 
                  key={char.id}
                  className={`${styles.characterItem} ${selectedCharacter === char.id ? styles.selected : ''}`}
                  onClick={() => setSelectedCharacter(char.id)}
                >
                  <span className={styles.characterIcon}>👤</span>
                  <span className={styles.characterName}>{char.name}</span>
                  <button 
                    className={styles.removeBtn}
                    onClick={(e) => {
                      e.stopPropagation()
                      removeCharacter(char.id)
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {/* 动作库 */}
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>🎭 动作库</h3>
            <input 
              type="text" 
              placeholder="搜索动作..."
              className={styles.searchInput}
            />
            <div className={styles.actionGrid}>
              {vrmaActions.slice(0, 8).map(action => (
                <div 
                  key={action.id}
                  className={styles.actionItem}
                  onClick={() => {
                    if (selectedCharacter) {
                      setActionTarget({
                        trackId: `track_${selectedCharacter}`,
                        characterId: selectedCharacter
                      })
                      addActionToTimeline(action)
                    }
                  }}
                >
                  <span className={styles.actionIcon}>🎬</span>
                  <span className={styles.actionName}>{action.name}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* 中间区域 */}
        <div className={styles.centerArea}>
          {/* 3D预览 */}
          <div className={styles.viewport}>
            <canvas ref={canvasRef} className={styles.canvas} />
            
            {/* 播放控制 */}
            <div className={styles.playbackControls}>
              <div className={styles.timeDisplay}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
              <div className={styles.controlButtons}>
                <button onClick={() => setCurrentTime(0)}>⏮️</button>
                <button onClick={() => setCurrentTime(Math.max(0, currentTime - 1))}>⏪</button>
                <button 
                  className={styles.playBtn}
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </button>
                <button onClick={() => setCurrentTime(Math.min(duration, currentTime + 1))}>⏩</button>
                <button onClick={() => setCurrentTime(duration)}>⏭️</button>
              </div>
            </div>
          </div>
          
          {/* 时间轴 */}
          <div className={styles.timeline}>
            <div className={styles.timelineHeader}>
              <span className={styles.timelineTitle}>📍 时间轴</span>
              <div className={styles.timelineTools}>
                <button>🔍+</button>
                <button>🔍-</button>
                <button>🎯适应</button>
              </div>
            </div>
            
            <div className={styles.timelineTracks}>
              {tracks.map(track => (
                <div key={track.id} className={styles.track}>
                  <div className={styles.trackHeader}>
                    <span className={styles.trackName}>{track.characterName}</span>
                    <button 
                      className={styles.addClipBtn}
                      onClick={() => {
                        setActionTarget({
                          trackId: track.id,
                          characterId: track.characterId
                        })
                        setShowActionLibrary(true)
                      }}
                    >
                      ➕
                    </button>
                  </div>
                  <div className={styles.trackLane}>
                    <div className={styles.timeRuler}>
                      {Array.from({ length: 7 }, (_, i) => (
                        <span key={i}>{i * 5}s</span>
                      ))}
                    </div>
                    {track.clips.map(clip => (
                      <div 
                        key={clip.id}
                        className={styles.clip}
                        style={{
                          left: `${(clip.startTime / duration) * 100}%`,
                          width: `${(clip.duration / duration) * 100}%`
                        }}
                      >
                        <span>{clip.actionName}</span>
                      </div>
                    ))}
                    {/* 播放头 */}
                    <div 
                      className={styles.playhead}
                      style={{ left: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              
              {tracks.length === 0 && (
                <div className={styles.emptyTracks}>
                  <p>暂无角色轨道</p>
                  <p>点击左侧"添加角色"开始创作</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 角色库弹窗 */}
      {showCharacterLibrary && (
        <div className={styles.modalOverlay} onClick={() => setShowCharacterLibrary(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>👤 选择角色</h3>
            <div className={styles.characterGrid}>
              {(() => {
                const savedChars = JSON.parse(localStorage.getItem('savedCharacters') || '[]')
                return savedChars.length > 0 ? (
                  savedChars.map(char => (
                    <div 
                      key={char.id}
                      className={styles.characterCard}
                      onClick={() => {
                        addCharacter(char.modelUrl, { name: char.name })
                        setShowCharacterLibrary(false)
                      }}
                    >
                      <img 
                        src={char.thumbnail || '/default-character.png'} 
                        alt={char.name}
                      />
                      <span>{char.name}</span>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyModal}>
                    <p>暂无保存的角色</p>
                    <p>请先在人物库中创建角色</p>
                  </div>
                )
              })()}
            </div>
            <button className={styles.closeBtn} onClick={() => setShowCharacterLibrary(false)}>
              取消
            </button>
          </div>
        </div>
      )}

      {/* 动作库弹窗 */}
      {showActionLibrary && (
        <div className={styles.modalOverlay} onClick={() => setShowActionLibrary(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>🎭 选择动作</h3>
            <input 
              type="text" 
              placeholder="搜索动作..."
              className={styles.searchInput}
            />
            <div className={styles.actionList}>
              {vrmaActions.map(action => (
                <div 
                  key={action.id}
                  className={styles.actionRow}
                  onClick={() => addActionToTimeline(action)}
                >
                  <span className={styles.actionIcon}>🎬</span>
                  <div className={styles.actionInfo}>
                    <span className={styles.actionName}>{action.name}</span>
                    <span className={styles.actionCategory}>{action.category}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className={styles.closeBtn} onClick={() => setShowActionLibrary(false)}>
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ARDirector
