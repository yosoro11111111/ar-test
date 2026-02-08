import React, { useState, useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import styles from './MMDStudio.module.css'

// 核心系统
import { getProjectManager, getResourceManager, getDataPackageManager } from '../core'

// 布局组件
import { LeftPanel } from './layout/LeftPanel'
import { CenterPanel } from './layout/CenterPanel'
import { RightPanel } from './layout/RightPanel'
import { BottomPanel } from './layout/BottomPanel'

// 引导组件
import { OnboardingGuide, FirstTimeTips } from './components/OnboardingGuide'

/**
 * MMD Studio - 主组件
 * 
 * 新架构的MMD制作器，支持：
 * - 项目导入导出（.ymmdpack）
 * - 数据包系统（.smmdpack）
 * - 视频/图片/GLB场景
 * - GLB道具和动画
 * - 简化的时间轴
 */
export function MMDStudio() {
  // 核心管理器
  const projectManager = useRef(getProjectManager())
  const resourceManager = useRef(getResourceManager())
  const dataPackageManager = useRef(getDataPackageManager())

  // 项目状态
  const [project, setProject] = useState(null)
  const [isModified, setIsModified] = useState(false)

  // 界面状态
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [selectedProp, setSelectedProp] = useState(null)
  const [selectedTrack, setSelectedTrack] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activePanel, setActivePanel] = useState('resource') // resource, property

  // Three.js 引用
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const animationFrameRef = useRef(null)

  // 初始化
  useEffect(() => {
    initThreeJS()
    createNewProject()
    
    return () => {
      cleanup()
    }
  }, [])

  // 初始化 Three.js
  const initThreeJS = () => {
    if (!canvasRef.current) return

    // 场景
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    sceneRef.current = scene

    // 相机
    const camera = new THREE.PerspectiveCamera(
      50,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 5, 10)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // 渲染器
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    })
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight)
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

    // 开始渲染循环
    animate()
  }

  // 渲染循环
  const animate = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return
    
    animationFrameRef.current = requestAnimationFrame(animate)
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

  // 保存项目
  const saveProject = async () => {
    if (!project) return
    await projectManager.current.saveProject(project)
    setIsModified(false)
  }

  // 导出项目
  const exportProject = async () => {
    if (!project) return
    const result = await projectManager.current.exportProject(project)
    
    // 下载文件
    const url = URL.createObjectURL(result.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 导入项目
  const importProject = async (file) => {
    try {
      const importedProject = await projectManager.current.importProject(file)
      setProject(importedProject)
      setIsModified(false)
    } catch (error) {
      console.error('导入项目失败:', error)
      alert('导入项目失败: ' + error.message)
    }
  }

  // 更新项目
  const updateProject = (updates) => {
    const updated = projectManager.current.updateProject(updates)
    if (updated) {
      setProject({ ...updated })
      setIsModified(true)
    }
  }

  // 添加角色
  const addCharacter = (characterData) => {
    if (!project) return
    
    const newCharacter = {
      id: Date.now().toString(),
      name: characterData.name || '新角色',
      modelPath: characterData.modelPath,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 1,
      ...characterData
    }
    
    updateProject({
      characters: [...project.characters, newCharacter]
    })
    
    setSelectedCharacter(newCharacter)
  }

  // 添加道具
  const addProp = (propData) => {
    if (!project) return
    
    const newProp = {
      id: Date.now().toString(),
      name: propData.name || '新道具',
      modelPath: propData.modelPath,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      ...propData
    }
    
    updateProject({
      props: [...project.props, newProp]
    })
    
    setSelectedProp(newProp)
  }

  // 更新时间轴
  const updateTimeline = (timelineData) => {
    updateProject({
      timeline: { ...project.timeline, ...timelineData }
    })
  }

  // 播放控制
  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  // 清理
  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (rendererRef.current) {
      rendererRef.current.dispose()
    }
  }

  if (!project) {
    return <div className={styles.loading}>加载中...</div>
  }

  return (
    <div className={styles.container}>
      {/* 顶部工具栏 */}
      <header className={styles.header}>
        <div className={styles.logo}>🎬 MMD Studio</div>
        <div className={styles.projectInfo}>
          <span className={styles.projectName}>
            {project.name} {isModified && '*'}
          </span>
        </div>
        <div className={styles.toolbar}>
          <button onClick={createNewProject}>新建</button>
          <button onClick={saveProject}>保存</button>
          <button onClick={exportProject}>导出</button>
          <label className={styles.fileInput}>
            导入
            <input
              type="file"
              accept=".ymmdpack"
              onChange={(e) => e.target.files?.[0] && importProject(e.target.files[0])}
              hidden
            />
          </label>
        </div>
      </header>

      {/* 主内容区 */}
      <div className={styles.mainContent}>
        {/* 左侧面板 */}
        <LeftPanel
          project={project}
          onAddCharacter={addCharacter}
          onAddProp={addProp}
          onSelectCharacter={setSelectedCharacter}
          onSelectProp={setSelectedProp}
          selectedCharacter={selectedCharacter}
          selectedProp={selectedProp}
        />

        {/* 中央预览区 */}
        <CenterPanel
          canvasRef={canvasRef}
          project={project}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          onTimeChange={setCurrentTime}
        />

        {/* 右侧面板 */}
        <RightPanel
          project={project}
          selectedCharacter={selectedCharacter}
          selectedProp={selectedProp}
          onUpdateProject={updateProject}
        />
      </div>

      {/* 底部时间轴 */}
      <BottomPanel
        project={project}
        currentTime={currentTime}
        isPlaying={isPlaying}
        onTimeChange={setCurrentTime}
        onTogglePlay={togglePlay}
        onUpdateTimeline={updateTimeline}
        selectedTrack={selectedTrack}
        onSelectTrack={setSelectedTrack}
      />

      {/* 新用户引导 */}
      <OnboardingGuide />

      {/* 首次使用提示 */}
      <FirstTimeTips />
    </div>
  )
}

export default MMDStudio
