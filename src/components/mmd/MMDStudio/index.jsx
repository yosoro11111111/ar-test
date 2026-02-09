import React, { useState, useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import styles from './MMDStudio.module.css'

// 核心系统
import { ProjectManager } from './core/ProjectManager.js'
import { ResourceManager } from './core/ResourceManager.js'
import { TimelineEngine } from './core/TimelineEngine.js'
import { RenderEngine } from './core/RenderEngine.js'

// 面板组件
import { LeftPanel } from './panels/LeftPanel.jsx'
import { CenterPanel } from './panels/CenterPanel.jsx'
import { RightPanel } from './panels/RightPanel.jsx'
import { TimelinePanel } from './panels/TimelinePanel.jsx'

// 弹窗组件
import { ExportModal } from './modals/ExportModal.jsx'
import { SettingsModal } from './modals/SettingsModal.jsx'

/**
 * MMD Studio - 完整的MMD制作器
 * 
 * 功能：
 * - 项目系统（导入导出.ymmdpack）
 * - 资源管理（角色、道具、场景、动作、音乐）
 * - 时间轴编辑（多轨道、片段编辑）
 * - 3D预览（Three.js渲染）
 * - 属性编辑（变换、动画、材质）
 * - 导出功能（MP4、GIF、帧序列）
 */
export function MMDStudio() {
  // ============ 核心管理器 ============
  const projectManager = useRef(new ProjectManager())
  const resourceManager = useRef(new ResourceManager())
  const timelineEngine = useRef(new TimelineEngine())
  const renderEngine = useRef(new RenderEngine())

  // ============ 项目状态 ============
  const [project, setProject] = useState({
    id: `project_${Date.now()}`,
    name: '新项目',
    duration: 120,
    background: { type: 'color', color: '#0a0a0f' },
    characters: [],
    props: [],
    tracks: [],
    settings: {
      resolution: { width: 1920, height: 1080 },
      fps: 30
    }
  })
  const [isModified, setIsModified] = useState(false)

  // ============ 播放状态 ============
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [timelineScale, setTimelineScale] = useState(1)

  // ============ 选中状态 ============
  const [selectedObject, setSelectedObject] = useState(null)
  const [selectedTrack, setSelectedTrack] = useState(null)
  const [selectedClip, setSelectedClip] = useState(null)

  // ============ 弹窗状态 ============
  const [showExportModal, setShowExportModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  // ============ 资源库 ============
  const [resources, setResources] = useState({
    characters: [],
    props: [],
    scenes: [],
    motions: [],
    music: []
  })

  // ============ 初始化 ============
  useEffect(() => {
    // 加载默认资源
    loadDefaultResources()
  }, [])

  const loadDefaultResources = async () => {
    // 从public/object加载预设道具
    const defaultProps = [
      { id: 'prop1', name: '剑', type: 'prop', path: '/object/sword.glb' },
      { id: 'prop2', name: '盾', type: 'prop', path: '/object/shield.glb' }
    ]
    setResources(prev => ({ ...prev, props: defaultProps }))
  }

  // ============ 项目操作 ============
  const handleNewProject = () => {
    if (isModified && !confirm('当前项目未保存，确定要新建项目吗？')) {
      return
    }
    setProject({
      id: `project_${Date.now()}`,
      name: '新项目',
      duration: 120,
      background: { type: 'color', color: '#0a0a0f' },
      characters: [],
      props: [],
      tracks: [],
      settings: {
        resolution: { width: 1920, height: 1080 },
        fps: 30
      }
    })
    setCurrentTime(0)
    setIsModified(false)
  }

  const handleSaveProject = async () => {
    try {
      await projectManager.current.saveProject(project)
      setIsModified(false)
      alert('项目保存成功！')
    } catch (error) {
      console.error('保存项目失败:', error)
      alert('保存失败: ' + error.message)
    }
  }

  const handleExportProject = () => {
    setShowExportModal(true)
  }

  // ============ 资源操作 ============
  const handleImportResource = async (type, files) => {
    try {
      const imported = await resourceManager.current.importResources(type, files)
      setResources(prev => ({
        ...prev,
        [type]: [...prev[type], ...imported]
      }))
    } catch (error) {
      console.error('导入资源失败:', error)
      alert('导入失败: ' + error.message)
    }
  }

  // ============ 角色操作 ============
  const handleAddCharacter = (characterResource) => {
    const newCharacter = {
      id: `char_${Date.now()}`,
      name: characterResource.name,
      modelPath: characterResource.path,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 1,
      visible: true
    }

    setProject(prev => ({
      ...prev,
      characters: [...prev.characters, newCharacter]
    }))
    setIsModified(true)
  }

  const handleRemoveCharacter = (characterId) => {
    setProject(prev => ({
      ...prev,
      characters: prev.characters.filter(c => c.id !== characterId),
      tracks: prev.tracks.filter(t => t.targetId !== characterId)
    }))
    setIsModified(true)
    if (selectedObject?.id === characterId) {
      setSelectedObject(null)
    }
  }

  // ============ 道具操作 ============
  const handleAddProp = (propResource) => {
    const newProp = {
      id: `prop_${Date.now()}`,
      name: propResource.name,
      modelPath: propResource.path,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 1,
      visible: true
    }

    setProject(prev => ({
      ...prev,
      props: [...prev.props, newProp]
    }))
    setIsModified(true)
  }

  // ============ 场景操作 ============
  const handleAddScene = (sceneResource) => {
    setProject(prev => ({
      ...prev,
      background: {
        type: 'scene',
        path: sceneResource.path,
        name: sceneResource.name
      }
    }))
    setIsModified(true)
  }

  // ============ 动作操作 ============
  const handleAddMotion = (motionResource) => {
    // 添加到资源库
    setResources(prev => ({
      ...prev,
      motions: [...prev.motions, motionResource]
    }))
    
    // 如果有选中的角色，添加动作轨道
    if (selectedObject) {
      const newTrack = {
        id: `track_${Date.now()}`,
        type: 'motion',
        targetId: selectedObject.id,
        name: `${motionResource.name}`,
        motionPath: motionResource.path,
        clips: [{
          id: `clip_${Date.now()}`,
          name: motionResource.name,
          start: currentTime,
          end: currentTime + 5 // 默认5秒
        }],
        muted: false,
        locked: false
      }

      setProject(prev => ({
        ...prev,
        tracks: [...prev.tracks, newTrack]
      }))
    }
    
    setIsModified(true)
  }

  // ============ 时间轴操作 ============
  const handleAddTrack = (type, targetId) => {
    const newTrack = {
      id: `track_${Date.now()}`,
      type,
      targetId,
      name: getTrackName(type),
      clips: [],
      muted: false,
      locked: false
    }

    setProject(prev => ({
      ...prev,
      tracks: [...prev.tracks, newTrack]
    }))
    setIsModified(true)
  }

  const getTrackName = (type) => {
    const names = {
      scene: '场景',
      character: '角色动画',
      transform: '变换',
      camera: '摄像机',
      prop: '道具',
      effect: '特效'
    }
    return names[type] || type
  }

  const handlePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (time) => {
    setCurrentTime(time)
  }

  // ============ 属性更新 ============
  const handleUpdateObject = (objectId, updates) => {
    setProject(prev => ({
      ...prev,
      characters: prev.characters.map(c =>
        c.id === objectId ? { ...c, ...updates } : c
      ),
      props: prev.props.map(p =>
        p.id === objectId ? { ...p, ...updates } : p
      )
    }))
    setIsModified(true)
  }

  const handleUpdateProject = (updates) => {
    setProject(prev => ({ ...prev, ...updates }))
    setIsModified(true)
  }

  // ============ 格式化时间 ============
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const frames = Math.floor((seconds % 1) * 30)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
  }

  return (
    <div className={styles.container}>
      {/* 顶部工具栏 */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>🎬 MMD Studio</span>
          <span className={styles.projectName}>{project.name}</span>
          {isModified && <span className={styles.modifiedIndicator}>*</span>}
        </div>
        <div className={styles.headerCenter}>
          <button className={styles.toolButton} onClick={handleNewProject}>新建</button>
          <button className={styles.toolButton} onClick={handleSaveProject}>保存</button>
          <button className={styles.toolButton} onClick={handleExportProject}>导出</button>
          <button className={styles.toolButton} onClick={() => setShowSettingsModal(true)}>设置</button>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.timeDisplay}>
            {formatTime(currentTime)} / {formatTime(project.duration)}
          </span>
        </div>
      </header>

      {/* 数据包选择栏 */}
      <div className={styles.packageBar}>
        <span>📦 当前数据包:</span>
        <select className={styles.packageSelect}>
          <option>默认资源包</option>
        </select>
        <button className={styles.importPackageButton}>+</button>
      </div>

      {/* 主编辑区 */}
      <div className={styles.editorArea}>
        {/* 左侧面板 */}
        <LeftPanel
          resources={resources}
          onImportResource={handleImportResource}
          onAddCharacter={handleAddCharacter}
          onAddProp={handleAddProp}
          onAddScene={handleAddScene}
          onAddMotion={handleAddMotion}
        />

        {/* 中央预览区 */}
        <CenterPanel
          project={project}
          currentTime={currentTime}
          selectedObject={selectedObject}
          onSelectObject={setSelectedObject}
        />

        {/* 右侧面板 */}
        <RightPanel
          selectedObject={selectedObject}
          onUpdateObject={handleUpdateObject}
        />
      </div>

      {/* 底部时间轴 */}
      <TimelinePanel
        project={project}
        currentTime={currentTime}
        isPlaying={isPlaying}
        timelineScale={timelineScale}
        onPlay={handlePlay}
        onSeek={handleSeek}
        selectedTrack={selectedTrack}
        onSelectTrack={setSelectedTrack}
      />

      {/* 导出弹窗 */}
      {showExportModal && (
        <ExportModal
          project={project}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* 设置弹窗 */}
      {showSettingsModal && (
        <SettingsModal
          project={project}
          onClose={() => setShowSettingsModal(false)}
          onUpdateProject={handleUpdateProject}
        />
      )}
    </div>
  )
}
