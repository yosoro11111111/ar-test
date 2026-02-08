import React, { useState, useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import styles from './MMDStudio.module.css'

// 核心系统
import { getProjectManager } from '../core'
import { ensureDatabase } from '../core/dbUtils'

// 组件
import { ResourceBrowser } from './components/ResourceBrowser'
import { OnboardingGuide } from './components/OnboardingGuide'

/**
 * MMD Studio - 新布局版本
 * 
 * 布局调整：
 * - 预览区域缩小到40%高度
 * - 时间轴放大到45%高度
 * - 支持多角色轨道
 */
export function MMDStudio() {
  // 项目状态
  const [project, setProject] = useState(null)
  const [isModified, setIsModified] = useState(false)
  
  // 选中的对象
  const [selectedCharacters, setSelectedCharacters] = useState([])
  const [selectedProps, setSelectedProps] = useState([])
  
  // 播放状态
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(120)
  
  // 界面状态
  const [activeLeftTab, setActiveLeftTab] = useState('characters')
  const [activeRightTab, setActiveRightTab] = useState('transform')
  const [showResourceBrowser, setShowResourceBrowser] = useState(false)
  const [expandedTracks, setExpandedTracks] = useState(new Set())
  
  // Three.js 引用
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  
  const projectManager = useRef(getProjectManager())
  
  // 初始化
  useEffect(() => {
    initThreeJS()
    createNewProject()
    ensureDatabase()
    
    return () => {
      cleanup()
    }
  }, [])
  
  // 初始化 Three.js
  const initThreeJS = () => {
    if (!canvasRef.current) return
    
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0f)
    sceneRef.current = scene
    
    const camera = new THREE.PerspectiveCamera(50, 16/9, 0.1, 1000)
    camera.position.set(0, 5, 10)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera
    
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    })
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    rendererRef.current = renderer
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 7)
    directionalLight.castShadow = true
    scene.add(directionalLight)
    
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
    scene.add(gridHelper)
    
    animate()
  }
  
  const animate = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return
    requestAnimationFrame(animate)
    rendererRef.current.render(sceneRef.current, cameraRef.current)
  }
  
  // 创建新项目
  const createNewProject = () => {
    const newProject = projectManager.current.createProject({
      name: '未命名项目',
      width: 1920,
      height: 1080,
      duration: 120
    })
    setProject(newProject)
    setIsModified(false)
  }
  
  // 添加角色
  const addCharacter = (characterData) => {
    if (!project) return
    
    const newCharacter = {
      id: Date.now().toString(),
      name: characterData.name,
      modelPath: characterData.path,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 1,
      tracks: {
        action: [],
        position: [],
        expression: []
      }
    }
    
    const updatedProject = {
      ...project,
      characters: [...project.characters, newCharacter]
    }
    
    setProject(updatedProject)
    setSelectedCharacters([newCharacter])
    setIsModified(true)
  }
  
  // 切换轨道展开状态
  const toggleTrackExpansion = (characterId) => {
    setExpandedTracks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(characterId)) {
        newSet.delete(characterId)
      } else {
        newSet.add(characterId)
      }
      return newSet
    })
  }
  
  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }
  
  // 清理
  const cleanup = () => {
    if (rendererRef.current) {
      rendererRef.current.dispose()
    }
  }
  
  if (!project) {
    return <div className={styles.container}>加载中...</div>
  }
  
  return (
    <div className={styles.container}>
      {/* 顶部工具栏 */}
      <header className={styles.header}>
        <div className={styles.logo}>🎬 MMD Studio</div>
        <div className={styles.projectInfo}>
          {project.name} {isModified && '*'}
        </div>
        <div className={styles.toolbar}>
          <button onClick={createNewProject}>新建</button>
          <button>保存</button>
          <button>导出</button>
          <button>设置</button>
        </div>
      </header>
      
      {/* 主工作区 */}
      <div className={styles.workspace}>
        {/* 左侧面板 */}
        <div className={styles.leftPanel}>
          {/* 标签页 */}
          <div className={styles.tabs}>
            {['characters', 'props', 'scenes', 'motions'].map(tab => (
              <button
                key={tab}
                className={`${styles.tab} ${activeLeftTab === tab ? styles.active : ''}`}
                onClick={() => setActiveLeftTab(tab)}
              >
                {tab === 'characters' && '👤'}
                {tab === 'props' && '📦'}
                {tab === 'scenes' && '🎬'}
                {tab === 'motions' && '🎭'}
              </button>
            ))}
          </div>
          
          {/* 资源列表 */}
          <div className={styles.resourceList}>
            <button
              className={styles.resourceItem}
              onClick={() => setShowResourceBrowser(true)}
              style={{ background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)' }}
            >
              <div className={styles.resourceIcon}>+</div>
              <div className={styles.resourceInfo}>
                <div className={styles.resourceName}>添加{activeLeftTab === 'characters' ? '角色' : '资源'}</div>
              </div>
            </button>
            
            {project.characters.map(char => (
              <div
                key={char.id}
                className={`${styles.resourceItem} ${selectedCharacters.find(c => c.id === char.id) ? styles.selected : ''}`}
                onClick={() => setSelectedCharacters([char])}
              >
                <div className={styles.resourceIcon}>👤</div>
                <div className={styles.resourceInfo}>
                  <div className={styles.resourceName}>{char.name}</div>
                  <div className={styles.resourceMeta}>角色</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* 中央预览区 */}
        <div className={styles.centerPanel}>
          <div className={styles.previewArea}>
            <div className={styles.previewContainer}>
              <div className={styles.previewHeader}>
                <span>预览</span>
                <span>1920 x 1080</span>
              </div>
              <canvas
                ref={canvasRef}
                className={styles.previewCanvas}
              />
            </div>
          </div>
          
          {/* 播放控制 */}
          <div className={styles.previewControls}>
            <button onClick={() => setCurrentTime(0)}>⏮</button>
            <button onClick={() => setCurrentTime(Math.max(0, currentTime - 1))}>⏪</button>
            <button
              className={styles.playButton}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button onClick={() => setCurrentTime(Math.min(duration, currentTime + 1))}>⏩</button>
            <button onClick={() => setCurrentTime(duration)}>⏭</button>
            <div className={styles.timeDisplay}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </div>
        
        {/* 右侧面板 */}
        <div className={styles.rightPanel}>
          {/* 标签页 */}
          <div className={styles.tabs}>
            {['transform', 'animation', 'material'].map(tab => (
              <button
                key={tab}
                className={`${styles.tab} ${activeRightTab === tab ? styles.active : ''}`}
                onClick={() => setActiveRightTab(tab)}
              >
                {tab === 'transform' && '📍'}
                {tab === 'animation' && '🎭'}
                {tab === 'material' && '🎨'}
              </button>
            ))}
          </div>
          
          {/* 属性内容 */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {selectedCharacters.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>👤</div>
                <div className={styles.emptyStateText}>选择角色查看属性</div>
              </div>
            ) : (
              <>
                {activeRightTab === 'transform' && (
                  <div className={styles.propertySection}>
                    <h4>位置</h4>
                    {['x', 'y', 'z'].map(axis => (
                      <div key={axis} className={styles.propertyRow}>
                        <label>{axis.toUpperCase()}</label>
                        <input type="number" defaultValue={0} step="0.1" />
                      </div>
                    ))}
                    
                    <h4>旋转</h4>
                    {['x', 'y', 'z'].map(axis => (
                      <div key={axis} className={styles.propertyRow}>
                        <label>{axis.toUpperCase()}</label>
                        <input type="number" defaultValue={0} step="0.1" />
                      </div>
                    ))}
                    
                    <h4>缩放</h4>
                    <div className={styles.propertyRow}>
                      <label>S</label>
                      <input type="number" defaultValue={1} step="0.1" />
                    </div>
                  </div>
                )}
                
                {activeRightTab === 'animation' && (
                  <div className={styles.propertySection}>
                    <h4>动作</h4>
                    <select style={{ width: '100%', padding: '8px', background: '#0a0a0f', border: '1px solid #2a2a35', borderRadius: '4px', color: '#fff' }}>
                      <option>选择动作...</option>
                      <option>待机</option>
                      <option>行走</option>
                      <option>跑步</option>
                    </select>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* 底部时间轴区域 */}
      <div className={styles.timelineArea}>
        <div className={styles.timelineHeader}>
          <div className={styles.timelineTitle}>⏱️ 时间轴</div>
          <div className={styles.timelineControls}>
            <button>+ 轨道</button>
            <button>🔍-</button>
            <button>🔍+</button>
          </div>
        </div>
        
        <div className={styles.timelineContent}>
          {/* 时间刻度 */}
          <div className={styles.timeRuler}>
            {Array.from({ length: 13 }, (_, i) => (
              <div
                key={i}
                className={styles.timeMarker}
                style={{ left: `${(i / 12) * 100}%` }}
              >
                {i * 10}s
              </div>
            ))}
          </div>
          
          {/* 角色轨道组 */}
          {project.characters.map(char => (
            <div key={char.id} className={styles.trackGroup}>
              <div
                className={styles.trackGroupHeader}
                onClick={() => toggleTrackExpansion(char.id)}
              >
                <span className={styles.trackGroupIcon}>👤</span>
                <span className={styles.trackGroupName}>{char.name}</span>
                <span className={`${styles.trackGroupToggle} ${expandedTracks.has(char.id) ? styles.expanded : ''}`}>
                  ▶
                </span>
              </div>
              
              {expandedTracks.has(char.id) && (
                <>
                  <div className={styles.track}>
                    <span className={styles.trackLabel}>🎭 动作</span>
                    <div className={styles.trackContent}>
                      <div className={styles.playhead} style={{ left: `${(currentTime / duration) * 100}%` }} />
                    </div>
                  </div>
                  <div className={styles.track}>
                    <span className={styles.trackLabel}>📍 位置</span>
                    <div className={styles.trackContent} />
                  </div>
                  <div className={styles.track}>
                    <span className={styles.trackLabel}>😊 表情</span>
                    <div className={styles.trackContent} />
                  </div>
                </>
              )}
            </div>
          ))}
          
          {project.characters.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>⏱️</div>
              <div className={styles.emptyStateText}>添加角色后开始编辑时间轴</div>
            </div>
          )}
        </div>
      </div>
      
      {/* 资源浏览器 */}
      {showResourceBrowser && (
        <ResourceBrowser
          type={activeLeftTab}
          onSelect={(resource) => {
            addCharacter(resource)
            setShowResourceBrowser(false)
          }}
          onClose={() => setShowResourceBrowser(false)}
        />
      )}
      
      {/* 引导 */}
      <OnboardingGuide />
    </div>
  )
}

export default MMDStudio
