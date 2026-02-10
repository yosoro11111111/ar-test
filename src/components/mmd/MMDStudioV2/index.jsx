import React, { useState, useEffect, useRef, useCallback } from 'react'
import styles from './MMDStudioV2.module.css'

// 子组件
import { TopBar } from './layout/TopBar.jsx'
import { LeftPanel } from './layout/LeftPanel.jsx'
import { CenterPanel } from './layout/CenterPanel.jsx'
import { RightPanel } from './layout/RightPanel.jsx'
import { TimelinePanel } from './layout/TimelinePanel.jsx'
import { WelcomeScreen } from './screens/WelcomeScreen.jsx'
import { ProjectWizard } from './screens/ProjectWizard.jsx'


// 弹窗
import { ExportModal } from './modals/ExportModal.jsx'
import { SettingsModal } from './modals/SettingsModal.jsx'
import { ResourcePackModal } from './modals/ResourcePackModal.jsx'
import { ShortcutsModal } from './modals/ShortcutsModal.jsx'
import { AboutModal } from './modals/AboutModal.jsx'

// 引导系统
import { TutorialGuide, shouldShowTutorial } from './components/TutorialGuide.jsx'

// 核心管理器
import { ProjectManager } from './core/ProjectManager.js'
import { ResourceManager } from './core/ResourceManager.js'
import { TimelineEngine } from './core/TimelineEngine.js'
import { RenderEngine } from './core/RenderEngine.js'
import { projectImportExport } from './core/ProjectImportExport.js'

/**
 * MMD Studio V2 - 完整的MMD制作器
 * 
 * 基于设计文档实现：
 * - 5区域布局：顶部导航、左侧面板、中央预览、右侧面板、底部时间轴
 * - 启动引导界面
 * - 新建项目向导
 * - 资源包系统
 * - 多轨道时间轴
 * - 属性编辑
 */
export function MMDStudioV2() {
  // ============ 应用状态 ============
  const [appState, setAppState] = useState('editor') // 'welcome', 'wizard', 'editor'
  
  // ============ 核心管理器 ============
  const projectManager = useRef(new ProjectManager())
  const resourceManager = useRef(new ResourceManager())
  const timelineEngine = useRef(new TimelineEngine())
  const renderEngine = useRef(null)
  const canvasRef = useRef(null)

  // ============ 项目状态 ============
  const [project, setProject] = useState(null)
  const [isModified, setIsModified] = useState(false)
  const [recentProjects, setRecentProjects] = useState([])

  // ============ 播放状态 ============
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [timelineScale, setTimelineScale] = useState(1.5)

  // ============ 选中状态 ============
  const [selectedObject, setSelectedObject] = useState(null)
  const [selectedTrack, setSelectedTrack] = useState(null)
  const [selectedClip, setSelectedClip] = useState(null)

  // ============ 弹窗状态 ============
  const [showExportModal, setShowExportModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showResourcePackModal, setShowResourcePackModal] = useState(false)
  const [showSearchPanel, setShowSearchPanel] = useState(false)
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)
  const [showDocumentationModal, setShowDocumentationModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [isPickingPosition, setIsPickingPosition] = useState(false)

  
  // 面板显示状态
  const [showLeftPanel, setShowLeftPanel] = useState(true)
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [showTimeline, setShowTimeline] = useState(true)
  
  // 视图模式
  const [viewMode, setViewMode] = useState('perspective')
  
  // 选择状态
  // 已在第62-64行声明
  
  // ============ 引导系统 ============
  const [showTutorial, setShowTutorial] = useState(false)

  // ============ 资源库 ============
  const [availableResources, setAvailableResources] = useState({
    characters: [],
    props: [],
    scenes: [],
    motions: [],
    music: []
  })
  const [loadedResources, setLoadedResources] = useState({
    characters: [],
    props: [],
    scenes: [],
    motions: [],
    music: []
  })

  // ============ 初始化 ============  
  useEffect(() => {
    console.log('MMDStudioV2: 初始化开始')
    // 加载最近项目列表
    loadRecentProjects()
    // 加载默认资源
    loadDefaultResources()
    
    // 检查是否需要显示引导
    // const needsTutorial = shouldShowTutorial()
    // if (needsTutorial) {
    //   // 延迟显示引导，等界面完全加载
    //   setTimeout(() => {
    //     setShowTutorial(true)
    //   }, 1000)
    // }
    
    // 自动创建默认项目（用于测试新时间轴）
    console.log('MMDStudioV2: 创建默认项目')
    const defaultProject = projectManager.current.createProject({
      name: '测试项目',
      duration: 120,
      fps: 30,
      resolution: { width: 1920, height: 1080 }
    })
    console.log('MMDStudioV2: 默认项目创建成功', defaultProject)
    setProject(defaultProject)
    setAppState('editor')
    console.log('MMDStudioV2: 初始化完成')
  }, [])

  // 初始化渲染引擎
  useEffect(() => {
    console.log('检查渲染引擎初始化:', {
      appState,
      hasCanvas: !!canvasRef.current,
      hasRenderEngine: !!renderEngine.current
    })
    
    if (appState === 'editor' && canvasRef.current && !renderEngine.current) {
      console.log('开始初始化渲染引擎')
      renderEngine.current = new RenderEngine(canvasRef.current)
      renderEngine.current.init()
      console.log('渲染引擎初始化完成')
    }
    
    return () => {
      if (renderEngine.current) {
        renderEngine.current.dispose()
        renderEngine.current = null
      }
    }
  }, [appState, canvasRef.current])

  const loadRecentProjects = async () => {
    const projects = await projectManager.current.getRecentProjects()
    setRecentProjects(projects)
  }

  const loadDefaultResources = async () => {
    try {
      // 扫描 public 文件夹获取可加载资源
      const available = await resourceManager.current.scanPublicFolder()
      console.log('加载到的资源:', available)
      setAvailableResources(available)
    } catch (error) {
      console.error('加载资源失败:', error)
    }
  }

  // ============ 项目操作 ============
  const handleNewProject = () => {
    if (project && isModified) {
      if (!confirm('当前项目未保存，确定要新建项目吗？')) {
        return
      }
    }
    setAppState('wizard')
  }

  const handleCreateProject = (projectConfig) => {
    const newProject = projectManager.current.createProject(projectConfig)
    setProject(newProject)
    setCurrentTime(0)
    setIsModified(false)
    setAppState('editor')
  }

  const handleOpenProject = async (projectId) => {
    try {
      const loadedProject = await projectManager.current.loadProject(projectId)
      setProject(loadedProject)
      setCurrentTime(0)
      setIsModified(false)
      setAppState('editor')
    } catch (error) {
      console.error('打开项目失败:', error)
      alert('打开项目失败: ' + error.message)
    }
  }

  const handleSaveProject = async () => {
    if (!project) return
    try {
      await projectManager.current.saveProject(project)
      setIsModified(false)
      alert('项目保存成功！')
    } catch (error) {
      console.error('保存项目失败:', error)
      alert('保存失败: ' + error.message)
    }
  }

  // 计算项目实际持续时间（根据时间轴上最后一个片段的结束时间）
  const calculateProjectDuration = () => {
    if (!project || !project.tracks) return project?.duration || 120
    
    let maxEndTime = 0
    project.tracks.forEach(track => {
      if (track.clips && track.clips.length > 0) {
        track.clips.forEach(clip => {
          if (clip.end > maxEndTime) {
            maxEndTime = clip.end
          }
        })
      }
    })
    
    // 如果没有片段，使用默认持续时间
    return maxEndTime > 0 ? Math.ceil(maxEndTime) : (project?.duration || 120)
  }

  const handleExportProject = () => {
    // 更新项目持续时间为实际时间
    const actualDuration = calculateProjectDuration()
    if (actualDuration !== project.duration) {
      setProject(prev => ({
        ...prev,
        duration: actualDuration
      }))
    }
    setShowExportModal(true)
  }

  const handleImportProject = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      
      try {
        const text = await file.text()
        const importedProject = JSON.parse(text)
        setProject(importedProject)
        setIsModified(true)
        alert('项目导入成功！')
      } catch (error) {
        alert('导入失败: ' + error.message)
      }
    }
    input.click()
  }

  const handleExportResourcePack = () => {
    setShowResourcePackModal(true)
  }

  // ============ 编辑操作 ============
  const [clipboard, setClipboard] = useState(null)
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const MAX_HISTORY = 50

  // 保存历史记录
  const saveHistory = useCallback(() => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(JSON.parse(JSON.stringify(project)))
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift()
      }
      return newHistory
    })
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1))
  }, [project, historyIndex])

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setProject(JSON.parse(JSON.stringify(history[newIndex])))
      console.log('撤销操作')
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setProject(JSON.parse(JSON.stringify(history[newIndex])))
      console.log('重做操作')
    }
  }

  const handleCopy = () => {
    if (selectedClip) {
      setClipboard({
        type: 'clip',
        data: JSON.parse(JSON.stringify(selectedClip))
      })
      console.log('复制片段:', selectedClip.name)
    } else if (selectedObject) {
      setClipboard({
        type: 'object',
        data: JSON.parse(JSON.stringify(selectedObject))
      })
      console.log('复制对象:', selectedObject.name)
    }
  }

  const handlePaste = () => {
    if (!clipboard) return

    if (clipboard.type === 'clip') {
      // 粘贴片段到当前时间
      const newClip = {
        ...clipboard.data,
        id: `clip_${Date.now()}`,
        start: currentTime,
        end: currentTime + (clipboard.data.end - clipboard.data.start)
      }

      if (selectedTrack) {
        setProject(prev => ({
          ...prev,
          tracks: prev.tracks.map(t =>
            t.id === selectedTrack.id
              ? { ...t, clips: [...t.clips, newClip] }
              : t
          )
        }))
        console.log('粘贴片段:', newClip.name)
      }
    } else if (clipboard.type === 'object') {
      // 粘贴对象
      const newObject = {
        ...clipboard.data,
        id: `${clipboard.data.id}_copy_${Date.now()}`,
        name: `${clipboard.data.name} (复制)`
      }

      if (clipboard.data.type === 'character') {
        setProject(prev => ({
          ...prev,
          characters: [...(prev.characters || []), newObject]
        }))
      } else {
        setProject(prev => ({
          ...prev,
          props: [...(prev.props || []), newObject]
        }))
      }
      console.log('粘贴对象:', newObject.name)
    }

    setIsModified(true)
  }

  const handleCut = () => {
    if (selectedClip) {
      // 复制到剪贴板
      setClipboard({
        type: 'clip',
        data: JSON.parse(JSON.stringify(selectedClip))
      })
      // 删除原片段
      handleDeleteClip(selectedClip.id, selectedTrack.id)
      console.log('剪切片段:', selectedClip.name)
    } else if (selectedObject) {
      // 复制到剪贴板
      setClipboard({
        type: 'object',
        data: JSON.parse(JSON.stringify(selectedObject))
      })
      // 删除原对象
      handleDelete()
      console.log('剪切对象:', selectedObject.name)
    }
  }

  const handleDelete = () => {
    if (selectedClip && selectedTrack) {
      handleDeleteClip(selectedClip.id, selectedTrack.id)
    } else if (selectedObject) {
      // 根据对象类型删除
      if (selectedObject.type === 'character' || project.characters?.find(c => c.id === selectedObject.id)) {
        handleDeleteCharacter(selectedObject.id)
      } else {
        // 删除道具
        setProject(prev => ({
          ...prev,
          props: prev.props?.filter(p => p.id !== selectedObject.id) || []
        }))
        // 删除对应的轨道
        setProject(prev => ({
          ...prev,
          tracks: prev.tracks.filter(t => t.targetId !== selectedObject.id)
        }))
      }
      setSelectedObject(null)
      setIsModified(true)
      console.log('删除对象:', selectedObject.name)
    }
  }

  const handleSelectAll = () => {
    // 根据当前上下文选择所有
    if (selectedTrack) {
      // 选择轨道上所有片段
      const clips = selectedTrack.clips
      if (clips.length > 0) {
        setSelectedClip(clips[0])
        console.log('全选: 选中轨道上', clips.length, '个片段')
      }
    } else if (project?.characters?.length > 0) {
      // 选择所有角色
      setSelectedObject(project.characters[0])
      console.log('全选: 选中', project.characters.length, '个角色')
    }
  }

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault()
            if (e.shiftKey) {
              handleRedo()
            } else {
              handleUndo()
            }
            break
          case 'c':
            e.preventDefault()
            handleCopy()
            break
          case 'x':
            e.preventDefault()
            handleCut()
            break
          case 'v':
            e.preventDefault()
            handlePaste()
            break
          case 'a':
            e.preventDefault()
            handleSelectAll()
            break
          case 's':
            e.preventDefault()
            handleSaveProject()
            break
          case 'n':
            e.preventDefault()
            handleNewProject()
            break
          case 'o':
            e.preventDefault()
            handleOpenProject()
            break
        }
      } else if (e.key === 'Delete') {
        // 删除选中的片段或对象
        if (selectedClip && selectedTrack) {
          handleDeleteClip(selectedClip.id, selectedTrack.id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedClip, selectedTrack, selectedObject, clipboard, currentTime, project])

  // ============ 视图操作 ============
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  // ============ 渲染操作 ============
  const handlePreviewRender = () => {
    console.log('预览渲染')
    setIsPlaying(true)
  }

  const handleFinalRender = () => {
    console.log('最终渲染')
    setShowExportModal(true)
  }

  // 切换视图模式
  const handleChangeViewMode = (mode) => {
    setViewMode(mode)
    if (renderEngine.current) {
      renderEngine.current.setViewMode(mode)
    }
  }

  // ============ 资源操作 ============
  const handleImportResource = async (type, files) => {
    try {
      const imported = await resourceManager.current.importResources(type, files)
      setResources(prev => ({
        ...prev,
        [type]: [...prev[type], ...imported]
      }))
      setIsModified(true)
    } catch (error) {
      console.error('导入资源失败:', error)
      alert('导入失败: ' + error.message)
    }
  }

  const handleImportResourcePack = async (pack) => {
    try {
      // pack 已经由 ResourcePackModal 导入完成，这里只需要更新状态
      console.log('资源包导入完成:', pack)
      
      // 重新获取可用资源列表
      if (resourceManager.current) {
        setAvailableResources({ ...resourceManager.current.getAvailableResources() })
        setLoadedResources({ ...resourceManager.current.getLoadedResources() })
      }
      
      // 计算资源数量
      const characters = pack.resources?.characters?.length || 0
      const props = pack.resources?.props?.length || 0
      const scenes = pack.resources?.scenes?.length || 0
      const motions = pack.resources?.motions?.length || 0
      
      alert(`资源包导入成功！\n角色: ${characters}\n道具: ${props}\n场景: ${scenes}\n动作: ${motions}`)
    } catch (error) {
      console.error('导入资源包失败:', error)
      alert('导入资源包失败: ' + error.message)
    }
  }

  // ============ 角色操作 ============
  const handleAddCharacter = async (characterResource) => {
    const characterId = `char_${Date.now()}`
    const newCharacter = {
      id: characterId,
      name: characterResource.name,
      modelPath: characterResource.path,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 1,
      visible: true,
      category: characterResource.category || '其他'
    }

    setProject(prev => ({
      ...prev,
      characters: [...prev.characters, newCharacter]
    }))
    
    // 创建角色轨道组（动作轨道 + 表情轨道 + 道具绑定轨道）
    const tracks = []
    const baseTime = Date.now()
    
    // 动作轨道
    tracks.push({
      id: `track_motion_${baseTime}`,
      type: 'motion',
      targetId: characterId,
      targetType: 'character',
      name: `${characterResource.name} - 动作`,
      clips: [],
      muted: false,
      locked: false,
      expanded: true
    })
    
    // 表情轨道
    tracks.push({
      id: `track_expr_${baseTime + 1}`,
      type: 'expression',
      targetId: characterId,
      targetType: 'character',
      name: `${characterResource.name} - 表情`,
      clips: [],
      muted: false,
      locked: false,
      expanded: false
    })
    
    // 道具绑定轨道
    tracks.push({
      id: `track_prop_${baseTime + 2}`,
      type: 'prop',
      targetId: characterId,
      targetType: 'character',
      name: `${characterResource.name} - 道具`,
      clips: [],
      muted: false,
      locked: false,
      expanded: false
    })
    
    setProject(prev => ({
      ...prev,
      tracks: [...prev.tracks, ...tracks]
    }))
    
    // 加载3D模型到场景中
    if (renderEngine.current && characterResource.path) {
      console.log('正在加载角色模型:', characterResource.path);
      
      // 使用 async/await 确保调用 forceRender
      (async () => {
        try {
          await renderEngine.current.loadVRMCharacter(characterResource.path, characterId)
          console.log('角色模型加载完成:', characterResource.name)
          
          // 延迟一帧确保模型已添加到场景
          requestAnimationFrame(() => {
            if (renderEngine.current && renderEngine.current.forceRender) {
              console.log('调用forceRender')
              renderEngine.current.forceRender()
            }
          })
        } catch (error) {
          console.error('加载角色模型失败:', error)
          alert('加载角色模型失败: ' + error.message)
        }
      })()
    }
    
    setSelectedObject(newCharacter)
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
  const handleAddProp = async (propResource) => {
    const propId = `prop_${Date.now()}`
    const clipId = `clip_${Date.now()}`
    const newProp = {
      id: propId,
      name: propResource.name,
      modelPath: propResource.path,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 1,
      visible: true,
      category: propResource.category || '其他'
    }

    setProject(prev => ({
      ...prev,
      props: [...prev.props, newProp]
    }))
    
    // 自动创建道具轨道，并添加一个默认clip用于存储绑定设置
    const defaultTraits = {
      bindBone: 'none',
      followMotion: true,
      keepRelativePosition: true,
      positionOffset: { x: 0, y: 0, z: 0 },
      rotationOffset: { x: 0, y: 0, z: 0 }
    }
    
    const newTrack = {
      id: `track_${Date.now()}`,
      type: 'prop',
      targetId: propId,
      targetType: 'prop',
      name: `${newProp.name}`,
      clips: [{
        id: clipId,
        name: propResource.name,
        type: 'prop',
        resourceId: propResource.id,
        resourcePath: propResource.path,
        start: 0,
        end: project?.duration || 120,
        propId: propId,
        traits: defaultTraits
      }],
      muted: false,
      locked: false,
      expanded: false
    }
    
    setProject(prev => ({
      ...prev,
      tracks: [...prev.tracks, newTrack]
    }))
    
    // 加载3D模型到场景中
    if (renderEngine.current && propResource.path) {
      console.log('正在加载道具模型:', propResource.path);
      
      // 使用 async/await 确保调用 forceRender
      (async () => {
        try {
          await renderEngine.current.loadGLBModel(propResource.path, propId, 'prop')
          console.log('道具模型加载完成:', newProp.name)
          
          // 延迟一帧确保模型已添加到场景
          requestAnimationFrame(() => {
            if (renderEngine.current && renderEngine.current.forceRender) {
              console.log('调用forceRender')
              renderEngine.current.forceRender()
            }
          })
        } catch (error) {
          console.error('加载道具模型失败:', error)
          alert('加载道具模型失败: ' + error.message)
        }
      })()
    }
    
    setSelectedObject(newProp)
    setIsModified(true)
  }

  // ============ 场景操作 ============
  const handleAddScene = (sceneResource) => {
    // 查找或创建场景轨道
    let sceneTrack = project.tracks.find(t => t.type === 'scene')
    
    if (!sceneTrack) {
      sceneTrack = {
        id: `track_scene_${Date.now()}`,
        type: 'scene',
        name: '场景',
        clips: [],
        muted: false,
        locked: false
      }
      
      setProject(prev => ({
        ...prev,
        tracks: [sceneTrack, ...prev.tracks]
      }))
    }
    
    // 判断场景类型
    let sceneType = 'glb'
    let sceneData = {}
    
    if (sceneResource.type === 'color_scene') {
      sceneType = 'color'
      sceneData = { color: sceneResource.color }
    } else if (sceneResource.path?.match(/\.(jpg|jpeg|png|webp)$/i)) {
      sceneType = 'image'
    } else if (sceneResource.path?.match(/\.(mp4|webm|mov)$/i)) {
      sceneType = 'video'
    }
    
    // 添加场景片段到当前时间位置
    const newClip = {
      id: `clip_${Date.now()}`,
      name: sceneResource.name,
      type: 'scene',
      resourceId: sceneResource.id,
      resourcePath: sceneResource.path,
      start: currentTime,
      end: currentTime + 10,
      sceneType: sceneType,
      ...sceneData
    }
    
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => 
        t.type === 'scene' 
          ? { ...t, clips: [...t.clips, newClip] }
          : t
      )
    }))
    
    // 立即加载场景到3D视图
    if (renderEngine.current) {
      // 使用 async/await 确保调用 forceRender
      (async () => {
        await renderEngine.current.loadSceneFromClip(newClip)
        
        // 延迟一帧确保场景已加载
        requestAnimationFrame(() => {
          if (renderEngine.current && renderEngine.current.forceRender) {
            console.log('调用forceRender')
            renderEngine.current.forceRender()
          }
        })
      })()
    }
    
    setIsModified(true)
  }

  const handleUpdateBackground = (updates) => {
    setProject(prev => ({
      ...prev,
      background: { ...prev.background, ...updates }
    }))
    setIsModified(true)
  }

  // ============ 资源加载操作 ============
  const handleLoadResource = async (resource) => {
    try {
      await resourceManager.current.loadResource(resource)
      // 更新状态
      setAvailableResources({ ...resourceManager.current.getAvailableResources() })
      setLoadedResources({ ...resourceManager.current.getLoadedResources() })
    } catch (error) {
      console.error('加载资源失败:', error)
      alert('加载资源失败: ' + error.message)
    }
  }

  const handleUnloadResource = (resourceId, type) => {
    resourceManager.current.unloadResource(resourceId, type)
    // 更新状态
    setAvailableResources({ ...resourceManager.current.getAvailableResources() })
    setLoadedResources({ ...resourceManager.current.getLoadedResources() })
  }

  const handleAddToScene = (resource, type) => {
    switch (type) {
      case 'characters':
        handleAddCharacter(resource)
        break
      case 'props':
        handleAddProp(resource)
        break
      case 'scenes':
        handleAddScene(resource)
        break
      case 'motions':
        handleAddMotion(resource)
        break
      default:
        break
    }
  }

  // ============ 动作操作 ============
  const handleAddMotion = (motionResource, targetId = null) => {
    const target = targetId || selectedObject?.id
    if (!target) {
      alert('请先选择一个角色')
      return
    }

    // 找到或创建角色的动作轨道
    let track = project.tracks.find(t => t.targetId === target && t.type === 'motion')
    
    if (!track) {
      track = {
        id: `track_${Date.now()}`,
        type: 'motion',
        targetId: target,
        targetType: 'character',
        name: '动作',
        clips: [],
        muted: false,
        locked: false,
        expanded: true
      }
      setProject(prev => ({
        ...prev,
        tracks: [...prev.tracks, track]
      }))
    }

    // 添加动作片段
    const newClip = {
      id: `clip_${Date.now()}`,
      name: motionResource.name,
      type: 'motion',
      motionPath: motionResource.path,
      start: currentTime,
      end: currentTime + (motionResource.duration || 5),
      loop: false,
      speed: 1,
      fadeIn: 0.3,
      fadeOut: 0.3
    }

    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => 
        t.id === track.id 
          ? { ...t, clips: [...t.clips, newClip] }
          : t
      )
    }))
    
    // 自动加载动作到角色
    const character = project.characters.find(c => c.id === target)
    if (character && renderEngine.current && motionResource.path) {
      console.log('自动加载动作:', motionResource.name, '到角色:', character.name);
      
      // 使用 async/await 确保调用 forceRender
      (async () => {
        try {
          await renderEngine.current.loadMotionFile(motionResource.path, newClip.id)
          console.log('动作加载成功:', motionResource.name)
          
          // 延迟一帧确保动作已应用
          requestAnimationFrame(() => {
            if (renderEngine.current && renderEngine.current.forceRender) {
              console.log('调用forceRender')
              renderEngine.current.forceRender()
            }
          })
        } catch (err) {
          console.error('动作加载失败:', err)
          alert(`动作 "${motionResource.name}" 加载失败: ${err.message}`)
        }
      })()
    }
    
    setIsModified(true)
  }

  // ============ 拖放资源到时间轴（第二次优化） ============
  const handleDropResourceToTimeline = (resource, dropTime, targetInfo = null) => {
    console.log('拖放资源到时间轴:', resource, '时间:', dropTime, '目标:', targetInfo)
    
    const sourceType = resource.sourceType || resource.type
    
    // 如果拖放到人物分组区域，自动识别轨道类型
    if (targetInfo?.autoAssign && targetInfo?.characterId) {
      handleDropToCharacterGroup(resource, dropTime, targetInfo.characterId)
      return
    }
    
    // 根据资源类型处理
    switch (sourceType) {
      case 'characters':
        handleDropCharacter(resource, dropTime)
        break
      case 'props':
        handleDropProp(resource, dropTime, targetInfo)
        break
      case 'scenes':
        handleDropScene(resource, dropTime)
        break
      case 'motions':
        handleDropMotion(resource, dropTime, targetInfo)
        break
      case 'motionGroup':
        handleDropMotionGroup(resource, dropTime, targetInfo)
        break
      case 'music':
        handleDropMusic(resource, dropTime)
        break
      case 'camera':
        handleDropCamera(resource, dropTime)
        break
      case 'effect':
        handleDropEffect(resource, dropTime)
        break
      default:
        console.warn('未知资源类型:', sourceType)
    }
  }
  
  // 拖放到人物分组区域 - 自动识别轨道类型
  const handleDropToCharacterGroup = (resource, dropTime, characterId) => {
    const sourceType = resource.sourceType || resource.type
    
    switch (sourceType) {
      case 'motions':
        // 自动放入动作轨道
        handleDropMotion(resource, dropTime, { targetId: characterId })
        break
      case 'props':
        // 自动放入道具轨道
        handleDropProp(resource, dropTime, { targetId: characterId, targetType: 'character' })
        break
      default:
        console.warn('该资源类型不能拖放到人物分组:', sourceType)
    }
  }

  // 拖放角色 - 创建角色轨道组
  const handleDropCharacter = (resource, dropTime) => {
    console.log('拖放角色:', resource)
    const characterId = `char_${Date.now()}`
    
    // 添加角色到项目
    const newCharacter = {
      id: characterId,
      name: resource.name,
      modelPath: resource.path,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 1,
      visible: true
    }
    
    setProject(prev => ({
      ...prev,
      characters: [...(prev.characters || []), newCharacter]
    }))
    
    // 创建角色轨道组（动作轨道 + 表情轨道 + 道具绑定轨道）
    const tracks = []
    
    // 动作轨道
    tracks.push({
      id: `track_motion_${Date.now()}`,
      type: 'motion',
      targetId: characterId,
      targetType: 'character',
      name: `${resource.name} - 动作`,
      clips: [],
      muted: false,
      locked: false
    })
    
    // 表情轨道
    tracks.push({
      id: `track_expr_${Date.now() + 1}`,
      type: 'expression',
      targetId: characterId,
      targetType: 'character',
      name: `${resource.name} - 表情`,
      clips: [],
      muted: false,
      locked: false
    })
    
    // 道具绑定轨道
    tracks.push({
      id: `track_prop_${Date.now() + 2}`,
      type: 'prop',
      targetId: characterId,
      targetType: 'character',
      name: `${resource.name} - 道具`,
      clips: [],
      muted: false,
      locked: false
    })
    
    setProject(prev => ({
      ...prev,
      tracks: [...prev.tracks, ...tracks]
    }))
    
    setSelectedObject(newCharacter)
    setIsModified(true)
    
    // 加载资源到3D场景
    if (resource.sourceView === 'available') {
      handleLoadResource(resource)
    }
    
    // 加载角色模型到3D场景
    if (renderEngine.current && resource.path) {
      console.log('加载角色到3D场景:', resource.name, resource.path);
      
      // 使用 async/await 确保调用 forceRender
      (async () => {
        try {
          await renderEngine.current.loadVRMCharacter(resource.path, characterId)
          console.log('角色加载成功:', resource.name)
          
          // 延迟一帧确保模型已添加到场景
          requestAnimationFrame(() => {
            if (renderEngine.current && renderEngine.current.forceRender) {
              console.log('调用forceRender')
              renderEngine.current.forceRender()
            }
          })
        } catch (err) {
          console.error('角色加载失败:', err)
        }
      })()
    } else {
      console.log('无法加载角色:', {
        hasRenderEngine: !!renderEngine.current,
        hasPath: !!resource.path
      })
    }
  }

  // 拖放道具
  const handleDropProp = async (resource, dropTime, targetInfo) => {
    // 如果拖放到角色道具轨道，则绑定到角色
    let targetCharacterId = null
    
    // 默认特质设置
    const defaultTraits = {
      bindBone: 'none',
      followMotion: true,
      keepRelativePosition: true,
      positionOffset: { x: 0, y: 0, z: 0 },
      rotationOffset: { x: 0, y: 0, z: 0 }
    }
    
    if (targetInfo) {
      // 支持新的目标信息格式
      if (targetInfo.targetId && targetInfo.targetType === 'character') {
        targetCharacterId = targetInfo.targetId
      } else if (typeof targetInfo === 'string') {
        // 兼容旧的轨道ID格式
        const targetTrack = project.tracks.find(t => t.id === targetInfo)
        if (targetTrack && targetTrack.targetType === 'character') {
          targetCharacterId = targetTrack.targetId
        }
      }
      
      if (targetCharacterId) {
        // 找到该角色的道具轨道
        const propTrack = project.tracks.find(t => 
          t.type === 'prop' && t.targetId === targetCharacterId
        )
        
        if (propTrack) {
          const newClip = {
            id: `clip_${Date.now()}`,
            name: resource.name,
            type: 'prop',
            resourceId: resource.id,
            resourcePath: resource.path,
            start: dropTime,
            end: dropTime + 5,
            attachedTo: targetCharacterId,
            traits: defaultTraits
          }
          
          setProject(prev => ({
            ...prev,
            tracks: prev.tracks.map(t => 
              t.id === propTrack.id 
                ? { ...t, clips: [...t.clips, newClip] }
                : t
            )
          }))
          
          setIsModified(true)
          return
        }
      }
    }
    
    // 创建独立道具轨道
    const propId = `prop_${Date.now()}`
    
    const newProp = {
      id: propId,
      name: resource.name,
      modelPath: resource.path,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 1,
      visible: true,
      traits: defaultTraits
    }
    
    setProject(prev => ({
      ...prev,
      props: [...(prev.props || []), newProp]
    }))
    
    // 创建独立道具轨道
    const newTrack = {
      id: `track_${Date.now()}`,
      type: 'prop',
      targetId: propId,
      targetType: 'prop',
      name: resource.name,
      clips: [{
        id: `clip_${Date.now()}`,
        name: resource.name,
        type: 'prop',
        resourceId: resource.id,
        resourcePath: resource.path,
        start: dropTime,
        end: dropTime + 5,
        propId: propId,
        traits: defaultTraits
      }],
      muted: false,
      locked: false
    }
    
    setProject(prev => ({
      ...prev,
      tracks: [...prev.tracks, newTrack]
    }))
    
    // 加载3D模型到场景中
    if (renderEngine.current && resource.path) {
      console.log('正在加载道具模型:', resource.name, resource.path);
      
      // 使用 async/await 确保调用 forceRender
      (async () => {
        try {
          await renderEngine.current.loadGLBModel(resource.path, propId, 'prop')
          console.log('道具模型加载成功:', resource.name)
          
          // 延迟一帧确保模型已添加到场景
          requestAnimationFrame(() => {
            if (renderEngine.current && renderEngine.current.forceRender) {
              console.log('调用forceRender')
              renderEngine.current.forceRender()
            }
          })
        } catch (err) {
          console.error('道具加载失败:', err)
          alert('道具加载失败: ' + err.message)
        }
      })()
    }
    
    setSelectedObject(newProp)
    setIsModified(true)
  }

  // 拖放特效 - 添加到特效轨道
  const handleDropEffect = (resource, dropTime) => {
    // 查找或创建特效轨道
    let effectTrack = project.tracks.find(t => t.type === 'effect')
    
    if (!effectTrack) {
      effectTrack = {
        id: `track_effect_${Date.now()}`,
        type: 'effect',
        name: '特效',
        clips: [],
        muted: false,
        locked: false
      }
      
      setProject(prev => ({
        ...prev,
        tracks: [effectTrack, ...prev.tracks]
      }))
    }
    
    // 添加特效片段
    const newClip = {
      id: `clip_${Date.now()}`,
      name: resource.name,
      type: 'effect',
      category: resource.category,
      start: dropTime,
      end: dropTime + 5,
      intensity: 1
    }
    
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => 
        t.type === 'effect' 
          ? { ...t, clips: [...t.clips, newClip] }
          : t
      )
    }))
    
    setIsModified(true)
    console.log('添加特效:', resource.name)
  }

  // 拖放场景 - 添加到场景轨道
  const handleDropScene = (resource, dropTime) => {
    // 查找或创建场景轨道
    let sceneTrack = project.tracks.find(t => t.type === 'scene')
    
    if (!sceneTrack) {
      sceneTrack = {
        id: `track_scene_${Date.now()}`,
        type: 'scene',
        name: '场景',
        clips: [],
        muted: false,
        locked: false
      }
      
      setProject(prev => ({
        ...prev,
        tracks: [sceneTrack, ...prev.tracks]
      }))
    }
    
    // 判断场景类型
    let sceneType = 'glb'
    let sceneData = {}
    
    if (resource.type === 'color_scene') {
      sceneType = 'color'
      sceneData = { color: resource.color }
    } else if (resource.path?.match(/\.(jpg|jpeg|png|webp)$/i)) {
      sceneType = 'image'
    } else if (resource.path?.match(/\.(mp4|webm|mov)$/i)) {
      sceneType = 'video'
    }
    
    // 添加场景片段
    const newClip = {
      id: `clip_${Date.now()}`,
      name: resource.name,
      type: 'scene',
      resourceId: resource.id,
      resourcePath: resource.path,
      start: dropTime,
      end: dropTime + 10,
      sceneType: sceneType,
      ...sceneData
    }
    
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => 
        t.type === 'scene' 
          ? { ...t, clips: [...t.clips, newClip] }
          : t
      )
    }))
    
    // 立即加载场景到3D视图
    if (renderEngine.current) {
      // 使用 async/await 确保调用 forceRender
      (async () => {
        await renderEngine.current.loadSceneFromClip(newClip)
        
        // 延迟一帧确保场景已加载
        requestAnimationFrame(() => {
          if (renderEngine.current && renderEngine.current.forceRender) {
            console.log('调用forceRender')
            renderEngine.current.forceRender()
          }
        })
      })()
    }
    
    setIsModified(true)
  }

  // 拖放动作 - 必须放到角色的动作轨道
  const handleDropMotion = (resource, dropTime, targetInfo) => {
    let targetCharacterId = null
    let motionTrack = null
    
    if (targetInfo) {
      // 支持新的目标信息格式（characterId）
      if (targetInfo.targetId) {
        targetCharacterId = targetInfo.targetId
        motionTrack = project.tracks.find(t => 
          t.type === 'motion' && t.targetId === targetCharacterId
        )
      } else if (typeof targetInfo === 'string') {
        // 兼容旧的轨道ID格式
        const targetTrack = project.tracks.find(t => t.id === targetInfo)
        if (targetTrack && targetTrack.type === 'motion') {
          motionTrack = targetTrack
        }
      }
    }
    
    // 如果没有找到动作轨道，检查是否有角色
    if (!motionTrack) {
      const characterTracks = project.tracks.filter(t => t.targetType === 'character')
      
      if (characterTracks.length === 0) {
        // 没有角色，提示用户先添加角色
        alert('请先添加一个角色，然后再拖放动作')
        return
      }
      
      // 有角色但没有指定，使用第一个角色的动作轨道，如果没有则自动创建
      const firstCharTrack = characterTracks.find(t => t.type === 'motion')
      if (firstCharTrack) {
        motionTrack = firstCharTrack
      } else {
        // 自动为第一个角色创建动作轨道
        const firstCharacter = project.characters[0]
        if (firstCharacter) {
          motionTrack = {
            id: `track_${Date.now()}`,
            type: 'motion',
            targetId: firstCharacter.id,
            targetType: 'character',
            name: `${firstCharacter.name} - 动作`,
            clips: [],
            muted: false,
            locked: false,
            expanded: true
          }
          // 先添加轨道到项目
          setProject(prev => ({
            ...prev,
            tracks: [...prev.tracks, motionTrack]
          }))
        } else {
          alert('请先添加一个角色，然后再拖放动作')
          return
        }
      }
    }
    
    // 添加动作片段
    const newClip = {
      id: `clip_${Date.now()}`,
      name: resource.name,
      type: 'motion',
      resourceId: resource.id,
      resourcePath: resource.path,
      start: dropTime,
      end: dropTime + (resource.duration || 5),
      loop: false,
      speed: 1,
      fadeIn: 0.3,
      fadeOut: 0.3
    }
    
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => 
        t.id === motionTrack.id 
          ? { ...t, clips: [...t.clips, newClip] }
          : t
      )
    }))
    
    setIsModified(true)
  }
  
  // 拖放动作组 - 展开为多个动作片段
  const handleDropMotionGroup = (resource, dropTime, targetInfo) => {
    let targetCharacterId = null
    let motionTrack = null
    
    if (targetInfo) {
      if (targetInfo.targetId) {
        targetCharacterId = targetInfo.targetId
        motionTrack = project.tracks.find(t => 
          t.type === 'motion' && t.targetId === targetCharacterId
        )
      } else if (typeof targetInfo === 'string') {
        const targetTrack = project.tracks.find(t => t.id === targetInfo)
        if (targetTrack && targetTrack.type === 'motion') {
          motionTrack = targetTrack
        }
      }
    }
    
    // 如果没有找到动作轨道，检查是否有角色
    if (!motionTrack) {
      const characterTracks = project.tracks.filter(t => t.targetType === 'character')
      
      if (characterTracks.length === 0) {
        alert('请先添加一个角色，然后再拖放动作组')
        return
      }
      
      const firstCharTrack = characterTracks.find(t => t.type === 'motion')
      if (firstCharTrack) {
        motionTrack = firstCharTrack
      } else {
        alert('请将动作组拖放到角色的动作轨道上')
        return
      }
    }
    
    // 导入动作组展开函数
    import('./data/motionGroups.js').then(({ expandMotionGroupToClips }) => {
      // 展开动作组为多个片段
      const clips = expandMotionGroupToClips(resource, dropTime)
      
      console.log('动作组展开为片段:', clips)
      
      setProject(prev => ({
        ...prev,
        tracks: prev.tracks.map(t => 
          t.id === motionTrack.id 
            ? { ...t, clips: [...t.clips, ...clips] }
            : t
        )
      }))
      
      setIsModified(true)
    })
  }

  // 拖放音乐 - 添加到音乐轨道
  const handleDropMusic = (resource, dropTime) => {
    // 查找或创建音乐轨道
    let musicTrack = project.tracks.find(t => t.type === 'music')
    
    if (!musicTrack) {
      musicTrack = {
        id: `track_music_${Date.now()}`,
        type: 'music',
        name: '音乐',
        clips: [],
        muted: false,
        locked: false
      }
      
      setProject(prev => ({
        ...prev,
        tracks: [...prev.tracks, musicTrack]
      }))
    }
    
    // 添加音乐片段
    const newClip = {
      id: `clip_${Date.now()}`,
      name: resource.name,
      type: 'music',
      resourceId: resource.id,
      resourcePath: resource.path,
      start: dropTime,
      end: dropTime + (resource.duration || 180),
      volume: 1,
      fadeIn: 0,
      fadeOut: 0
    }
    
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => 
        t.type === 'music' 
          ? { ...t, clips: [...t.clips, newClip] }
          : t
      )
    }))
    
    setIsModified(true)
  }

  // 删除人物及其所有轨道
  const handleDeleteCharacter = (characterId) => {
    if (!confirm('确定要删除这个人物吗？这将同时删除该人物的所有轨道和片段。')) {
      return
    }
    
    setProject(prev => ({
      ...prev,
      characters: prev.characters.filter(c => c.id !== characterId),
      tracks: prev.tracks.filter(t => t.targetId !== characterId)
    }))
    
    if (selectedObject?.id === characterId) {
      setSelectedObject(null)
    }
    
    setIsModified(true)
  }

  // 拖放摄像机 - 添加到摄像机轨道
  const handleDropCamera = (resource, dropTime) => {
    // 查找或创建摄像机轨道
    let cameraTrack = project.tracks.find(t => t.type === 'camera')
    
    if (!cameraTrack) {
      cameraTrack = {
        id: `track_camera_${Date.now()}`,
        type: 'camera',
        name: '摄像机',
        clips: [],
        muted: false,
        locked: false
      }
      
      // 摄像机轨道放在场景轨道之后
      setProject(prev => {
        const sceneIndex = prev.tracks.findIndex(t => t.type === 'scene')
        const insertIndex = sceneIndex >= 0 ? sceneIndex + 1 : 0
        const newTracks = [...prev.tracks]
        newTracks.splice(insertIndex, 0, cameraTrack)
        return { ...prev, tracks: newTracks }
      })
    }
    
    // 添加摄像机片段
    const newClip = {
      id: `clip_${Date.now()}`,
      name: resource.name,
      type: 'camera',
      resourceId: resource.id,
      resourcePath: resource.path,
      start: dropTime,
      end: dropTime + 5,
      cameraPosition: { x: 0, y: 2, z: 5 },
      targetPosition: { x: 0, y: 1, z: 0 },
      fov: 60,
      curve: 'linear'
    }
    
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => 
        t.type === 'camera' 
          ? { ...t, clips: [...t.clips, newClip] }
          : t
      )
    }))
    
    setIsModified(true)
  }

  // 为选中的人物添加摄像机
  const handleAddCameraForSelected = () => {
    if (!selectedObject) {
      alert('请先选择一个人物')
      return
    }
    
    // 查找或创建摄像机轨道
    let cameraTrack = project.tracks.find(t => t.type === 'camera')
    
    if (!cameraTrack) {
      cameraTrack = {
        id: `track_camera_${Date.now()}`,
        type: 'camera',
        name: '摄像机',
        clips: [],
        muted: false,
        locked: false
      }
      
      // 摄像机轨道放在场景轨道之后
      setProject(prev => {
        const sceneIndex = prev.tracks.findIndex(t => t.type === 'scene')
        const insertIndex = sceneIndex >= 0 ? sceneIndex + 1 : 0
        const newTracks = [...prev.tracks]
        newTracks.splice(insertIndex, 0, cameraTrack)
        return { ...prev, tracks: newTracks }
      })
    }
    
    // 获取选中人物的位置
    const charPos = selectedObject.position || { x: 0, y: 0, z: 0 }
    
    // 添加摄像机片段，自动对准选中角色
    const newClip = {
      id: `clip_${Date.now()}`,
      name: `${selectedObject.name} - 摄像机`,
      type: 'camera',
      start: currentTime,
      end: currentTime + 5,
      cameraPosition: { 
        x: charPos.x + 2, 
        y: charPos.y + 1.5, 
        z: charPos.z + 3 
      },
      targetPosition: { 
        x: charPos.x, 
        y: charPos.y + 1, 
        z: charPos.z 
      },
      fov: 60,
      curve: 'linear',
      targetCharacterId: selectedObject.id
    }
    
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => 
        t.type === 'camera' 
          ? { ...t, clips: [...t.clips, newClip] }
          : t
      )
    }))
    
    // 自动选中摄像机片段
    const cameraTrackUpdated = project.tracks.find(t => t.type === 'camera') || cameraTrack
    setSelectedTrack(cameraTrackUpdated)
    setSelectedClip(newClip)
    setIsModified(true)
    
    console.log('已为', selectedObject.name, '添加摄像机')
  }

  // 复制片段
  const handleDuplicateClip = (clip, track) => {
    const newClip = {
      ...clip,
      id: `clip_${Date.now()}`,
      start: clip.end,
      end: clip.end + (clip.end - clip.start)
    }
    
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => 
        t.id === track.id 
          ? { ...t, clips: [...t.clips, newClip] }
          : t
      )
    }))
    
    // 时间轴变化后，立即更新3D渲染
    if (renderEngine.current) {
      setTimeout(() => {
        renderEngine.current.updateAnimation(currentTime, project)
      }, 0)
    }
    
    setIsModified(true)
  }

  // 获取当前时间点的摄像机片段
  const getCurrentCameraClip = () => {
    if (!project?.tracks) return null
    
    const cameraTrack = project.tracks.find(t => t.type === 'camera')
    if (!cameraTrack?.clips) return null
    
    // 找到当前时间所在的摄像机片段
    return cameraTrack.clips.find(clip => 
      currentTime >= clip.start && currentTime <= clip.end
    ) || cameraTrack.clips[0]
  }

  // ============ 时间轴操作 ============
  const handleAddTrack = (type, targetId) => {
    const trackNames = {
      scene: '场景',
      character: '角色动画',
      motion: '动作',
      transform: '变换',
      camera: '摄像机',
      prop: '道具',
      effect: '特效',
      music: '音乐'
    }

    const newTrack = {
      id: `track_${Date.now()}`,
      type,
      targetId,
      targetType: type,
      name: trackNames[type] || type,
      clips: [],
      muted: false,
      locked: false,
      expanded: false
    }

    setProject(prev => ({
      ...prev,
      tracks: [...prev.tracks, newTrack]
    }))
    setIsModified(true)
  }

  // ============ 播放控制 ============
  // 使用 isPlaying state (已在第58行定义)
  
  const handlePlay = () => {
    if (!isPlaying) {
      setIsPlaying(true)
    } else {
      setIsPlaying(false)
    }
  }
  
  const handleStop = () => {
    setIsPlaying(false)
    setCurrentTime(0)
  }
  
  const handlePause = () => {
    if (isPlaying) {
      setIsPlaying(false)
    }
  }
  
  // 播放循环
  useEffect(() => {
    let animationFrameId
    let lastTime = performance.now()
    
    const playLoop = (currentTimeMs) => {
      if (!isPlaying) return
      
      const deltaTime = (currentTimeMs - lastTime) / 1000
      lastTime = currentTimeMs
      
      setCurrentTime(prev => {
        const newTime = prev + deltaTime
        const duration = calculateProjectDuration()
        
        // 循环播放
        if (newTime >= duration) {
          return 0
        }
        return newTime
      })
      
      animationFrameId = requestAnimationFrame(playLoop)
    }
    
    if (isPlaying) {
      lastTime = performance.now()
      animationFrameId = requestAnimationFrame(playLoop)
    }
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [isPlaying, project?.duration])
  
  // 更新3D渲染（根据时间轴时间）
  useEffect(() => {
    if (renderEngine.current && project) {
      renderEngine.current.updateAnimation(currentTime, project)
    }
  }, [currentTime, project])

  const handleSeek = (time) => {
    const duration = calculateProjectDuration()
    setCurrentTime(Math.max(0, Math.min(time, duration)))
  }

  const handleAddClip = (trackId, clipData) => {
    const newClip = {
      id: `clip_${Date.now()}`,
      ...clipData,
      start: currentTime,
      end: currentTime + (clipData.duration || 5)
    }

    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => 
        t.id === trackId 
          ? { ...t, clips: [...t.clips, newClip] }
          : t
      )
    }))
    
    // 时间轴变化后，立即更新3D渲染
    if (renderEngine.current) {
      setTimeout(() => {
        renderEngine.current.updateAnimation(currentTime, project)
      }, 0)
    }
    setIsModified(true)
  }

  const handleUpdateClip = (trackId, clipId, updates) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => 
        t.id === trackId 
          ? { 
              ...t, 
              clips: t.clips.map(c => 
                c.id === clipId ? { ...c, ...updates } : c
              )
            }
          : t
      )
    }))
    setIsModified(true)
    
    // 时间轴变化后，立即更新3D渲染
    if (renderEngine.current) {
      // 使用 setTimeout 确保状态更新后再渲染
      setTimeout(() => {
        renderEngine.current.updateAnimation(currentTime, project)
      }, 0)
    }
  }

  const handleDeleteClip = (clipId, trackId) => {
    console.log('删除片段:', clipId, '从轨道:', trackId)
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => 
        t.id === trackId 
          ? { ...t, clips: t.clips.filter(c => c.id !== clipId) }
          : t
      )
    }))
    setIsModified(true)
    // 清除选中的片段
    if (selectedClip?.id === clipId) {
      setSelectedClip(null)
    }
    
    // 时间轴变化后，立即更新3D渲染
    if (renderEngine.current) {
      setTimeout(() => {
        renderEngine.current.updateAnimation(currentTime, project)
      }, 0)
    }
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

    // 如果更新的是道具的特质，同步到clip和渲染引擎
    if (updates.traits) {
      setProject(prev => ({
        ...prev,
        tracks: prev.tracks.map(t => {
          if (t.type === 'prop' && t.clips?.some(c => c.propId === objectId)) {
            return {
              ...t,
              clips: t.clips.map(c =>
                c.propId === objectId
                  ? { ...c, traits: { ...c.traits, ...updates.traits } }
                  : c
              )
            }
          }
          return t
        })
      }))

      // 同步到渲染引擎
      if (renderEngine.current) {
        const propTrack = project?.tracks?.find(t =>
          t.type === 'prop' && t.clips?.some(c => c.propId === objectId)
        )
        if (propTrack) {
          const clip = propTrack.clips.find(c => c.propId === objectId)
          if (clip) {
            const updatedTraits = { ...clip.traits, ...updates.traits }
            renderEngine.current.updatePropTraits(clip.id, updatedTraits)
          }
        }
      }
    }

    // 同步transform更新到渲染引擎
    if (updates.transform && renderEngine.current) {
      const object = project?.characters?.find(c => c.id === objectId) ||
                     project?.props?.find(p => p.id === objectId)
      if (object) {
        renderEngine.current.updateObjectTransform(
          objectId,
          object.type,
          updates.transform
        )
      }
    }

    // 同步位置、旋转、缩放更新到渲染引擎
    if ((updates.position || updates.rotation || updates.scale) && renderEngine.current) {
      const object = project?.characters?.find(c => c.id === objectId) ||
                     project?.props?.find(p => p.id === objectId)
      if (object) {
        const transform = {
          position: updates.position || object.position,
          rotation: updates.rotation || object.rotation,
          scale: updates.scale !== undefined ? updates.scale : object.scale
        }
        renderEngine.current.updateObjectTransform(
          objectId,
          object.type || 'prop',
          transform
        )
        // 立即强制渲染
        requestAnimationFrame(() => {
          renderEngine.current?.forceRender()
        })
      }
    }

    // 同步朝向更新到渲染引擎
    if (updates.orientation && renderEngine.current) {
      const object = project?.characters?.find(c => c.id === objectId) ||
                     project?.props?.find(p => p.id === objectId)
      if (object) {
        renderEngine.current.updateObjectOrientation?.(objectId, updates.orientation)
        // 立即强制渲染
        requestAnimationFrame(() => {
          renderEngine.current?.forceRender()
        })
      }
    }
  }

  // 处理位置选择
  const handlePickPosition = () => {
    setIsPickingPosition(!isPickingPosition)
    console.log(isPickingPosition ? '取消位置选择模式' : '进入位置选择模式')
  }

  // 处理画布点击（用于位置选择）
  const handleCanvasClick = (event) => {
    if (!isPickingPosition || !renderEngine.current || !selectedObject) return

    // 获取点击位置
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // 使用渲染引擎的射线检测获取世界坐标
    const worldPosition = renderEngine.current.getWorldPositionFromScreen?.(x, y)

    if (worldPosition) {
      // 更新对象位置
      handleUpdateObject(selectedObject.id, {
        position: worldPosition
      })
      console.log('选择位置:', worldPosition)
    }

    // 退出位置选择模式
    setIsPickingPosition(false)
  }

  const handleUpdateProject = (updates) => {
    setProject(prev => ({ ...prev, ...updates }))
    setIsModified(true)
  }

  // ============ 格式化时间 ============
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const frames = Math.floor((seconds % 1) * (project?.settings?.fps || 30))
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
  }

  // ============ 项目导入导出 ============
  const handleExportProjectFile = async () => {
    if (!project) return
    
    try {
      await projectImportExport.downloadProject(project, `${project.name}.pmmdpack`)
      console.log('项目导出成功')
    } catch (error) {
      console.error('项目导出失败:', error)
      alert('项目导出失败: ' + error.message)
    }
  }

  const handleImportProjectFile = async (file) => {
    try {
      const { project: importedProject } = await projectImportExport.importProject(file)
      
      // 验证项目
      projectImportExport.validateProject(importedProject)
      
      // 设置项目
      setProject(importedProject)
      setIsModified(true)
      setAppState('editor')
      
      console.log('项目导入成功:', importedProject.name)
      alert(`项目 "${importedProject.name}" 导入成功！`)
    } catch (error) {
      console.error('项目导入失败:', error)
      alert('项目导入失败: ' + error.message)
    }
  }

  // ============ 渲染 ============
  
  // 欢迎界面
  if (appState === 'welcome') {
    return (
      <WelcomeScreen
        recentProjects={recentProjects}
        onNewProject={handleNewProject}
        onOpenProject={handleOpenProject}
        onImportResourcePack={() => setShowResourcePackModal(true)}
      />
    )
  }

  // 新建项目向导
  if (appState === 'wizard') {
    return (
      <ProjectWizard
        onCancel={() => setAppState('welcome')}
        onComplete={handleCreateProject}
        availableResources={availableResources}
        loadedResources={loadedResources}
        resourceManager={resourceManager.current}
      />
    )
  }

  // 主编辑器
  console.log('MMDStudioV2: 渲染主编辑器，project状态:', project)
  if (!project) {
    console.log('MMDStudioV2: project为null，渲染加载中...')
    return <div className={styles.loading}>加载中...</div>
  }

  return (
    <div className={styles.container}>
      {/* 顶部导航栏 */}
      <TopBar
        project={project}
        isModified={isModified}
        currentTime={currentTime}
        formatTime={formatTime}
        onNewProject={handleNewProject}
        onSaveProject={handleSaveProject}
        onExportProject={handleExportProject}
        onOpenProject={handleOpenProject}
        onImportProject={handleImportProject}
        onOpenSettings={() => setShowSettingsModal(true)}
        onImportResourcePack={() => setShowResourcePackModal(true)}
        onExportResourcePack={handleExportResourcePack}

        onUndo={handleUndo}
        onRedo={handleRedo}
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
        onDelete={handleDelete}
        onSelectAll={handleSelectAll}
        onToggleFullscreen={handleToggleFullscreen}
        onToggleLeftPanel={() => setShowLeftPanel(!showLeftPanel)}
        onToggleRightPanel={() => setShowRightPanel(!showRightPanel)}
        onToggleTimeline={() => setShowTimeline(!showTimeline)}
        onChangeViewMode={handleChangeViewMode}
        onPreviewRender={handlePreviewRender}
        onFinalRender={handleFinalRender}
        showLeftPanel={showLeftPanel}
        showRightPanel={showRightPanel}
        showTimeline={showTimeline}
        viewMode={viewMode}
        onShowShortcuts={() => setShowShortcutsModal(true)}
        onShowDocumentation={() => setShowDocumentationModal(true)}
        onShowAbout={() => setShowAboutModal(true)}
      />

      {/* 主编辑区 */}
      <div className={styles.editorArea}>
        {/* 左侧面板 - 资源库 */}
        {showLeftPanel && (
          <LeftPanel
            availableResources={availableResources}
            loadedResources={loadedResources}
            project={project}
            onLoadResource={handleLoadResource}
            onUnloadResource={handleUnloadResource}
            onAddToScene={handleAddToScene}
            resourceManager={resourceManager.current}
          />
        )}

        {/* 中央预览区 */}
        <CenterPanel
          ref={canvasRef}
          project={project}
          currentTime={currentTime}
          isPlaying={isPlaying}
          selectedObject={selectedObject}
          onSelectObject={setSelectedObject}
          renderEngine={renderEngine}
          onAddCamera={handleAddCameraForSelected}
          viewMode={viewMode}
          onChangeViewMode={handleChangeViewMode}
          onUndo={handleUndo}
          onSearch={() => setShowSearchPanel(true)}
          isPickingPosition={isPickingPosition}
          onCanvasClick={handleCanvasClick}
        />

        {/* 右侧面板 - 属性编辑 */}
        {showRightPanel && (
          <RightPanel
            selectedObject={selectedObject}
            selectedClip={selectedClip}
            selectedTrack={selectedTrack}
            project={project}
            onUpdateObject={handleUpdateObject}
            onUpdateClip={handleUpdateClip}
            onUpdateProject={handleUpdateProject}
            onPickPosition={handlePickPosition}
            isPickingPosition={isPickingPosition}
          />
        )}
      </div>

      {/* 底部时间轴 */}
      {showTimeline && (
        <TimelinePanel
          project={project}
          currentTime={currentTime}
          isPlaying={isPlaying}
          timelineScale={timelineScale}
          onPlay={handlePlay}
          onStop={handleStop}
          onPause={handlePause}
          onSeek={handleSeek}
          onScaleChange={setTimelineScale}
          selectedTrack={selectedTrack}
          onSelectTrack={setSelectedTrack}
          selectedClip={selectedClip}
          onSelectClip={setSelectedClip}
          onAddTrack={handleAddTrack}
          onAddClip={handleAddClip}
          onUpdateClip={handleUpdateClip}
          onDeleteClip={handleDeleteClip}
          onDuplicateClip={handleDuplicateClip}
          onDeleteCharacter={handleDeleteCharacter}
          formatTime={formatTime}
          onDropResource={handleDropResourceToTimeline}
          renderEngine={renderEngine.current}
        />
      )}

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

      {/* 资源包弹窗 */}
      {showResourcePackModal && (
        <ResourcePackModal
          onClose={() => setShowResourcePackModal(false)}
          onImport={handleImportResourcePack}
          resourceManager={resourceManager.current}
          currentProject={project}
        />
      )}

      {/* 快捷键弹窗 */}
      {showShortcutsModal && (
        <ShortcutsModal
          onClose={() => setShowShortcutsModal(false)}
        />
      )}

      {/* 关于弹窗 */}
      {showAboutModal && (
        <AboutModal
          onClose={() => setShowAboutModal(false)}
        />
      )}

      {/* 引导系统 */}
      {showTutorial && (
        <TutorialGuide
          onComplete={() => setShowTutorial(false)}
          onSkip={() => setShowTutorial(false)}
        />
      )}
    </div>
  )
}
