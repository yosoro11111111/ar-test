
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import JSZip from 'jszip'
import styles from './styles.module.css'
import { MultiCharacterManager } from '../MultiCharacterManager.js'
import { CharacterSelectModal } from './CharacterSelectModal'
import { CellEditModal } from './CellEditModal'
import { SettingsModal } from './SettingsModal'
import { Timeline } from './Timeline'
import { TrackTypeSelectModal } from './TrackTypeSelectModal'
import { createTrack, createClip, TRACK_TYPES } from './trackTypes'
import { loadVRMAAction } from '../../../data/vrmaActions.js'
import { calculatePositionOnPath } from './positionPresets'
import { getMusicManager, destroyMusicManager } from './MusicManager'
import { PropManager, createPresetProp } from './PropManager'
import { EffectManager, PRESET_EFFECTS } from './EffectManager'
import { ProjectWizard } from './ProjectWizard'
import { QuickActions } from './QuickActions'
import { exportProject, importProject, downloadFile } from './ProjectIO'
import { ARSceneRecorder } from './ARSceneRecorder'
import { RealARSceneRecorder } from './RealARSceneRecorder'
import { TrueARSceneRecorder } from './TrueARSceneRecorder'
import { WebXRARSceneRecorder } from './WebXRARSceneRecorder'
import { WebXRARPlayer } from './WebXRARPlayer'
import { ARScenePreview } from './ARScenePreview'
import { ARSceneCameraRecorder } from './ARSceneCameraRecorder'
import { SceneManagerModal } from './SceneManagerModal'

/**
 * AR MMD Director - 新轨道系统版本
 * 
 * 支持多种轨道类型：
 * - 场景轨道（背景图片）
 * - 动作轨道（VRMA动画）
 * - 特效轨道（粒子效果）
 * - 位置控制轨道（人物移动）
 * - 音乐轨道（背景音乐）
 * - 道具轨道（3D道具）
 * - 缩放轨道（人物/背景缩放）
 */
export function ARMMDDirector() {
  const navigate = useNavigate()
  
  // Three.js引用
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const characterManagerRef = useRef(null)
  const propManagerRef = useRef(null)
  const effectManagerRef = useRef(null)
  const animationFrameRef = useRef(null)
  
  // 摄像机预览引用
  const cameraPreviewRef = useRef(null)
  const cameraPreviewRendererRef = useRef(null)
  const cameraPreviewCameraRef = useRef(null)
  
  // 预览控制
  const [previewScale, setPreviewScale] = useState(1) // 画布显示缩放
  const [cameraZoom, setCameraZoom] = useState(1.5) // 摄像机缩放 (0.1-3.0)，默认1.5让人物更大
  const [characterScale, setCharacterScale] = useState(2.0)
  const previewContainerRef = useRef(null)
  
  // 坐标选择模式
  const [coordinatePickerMode, setCoordinatePickerMode] = useState(null) // 'position' | 'target' | null
  const coordinatePickerCallbackRef = useRef(null)
  const [pickerPreviewPosition, setPickerPreviewPosition] = useState({ x: 0, y: 0, z: 0 })
  
  // 注册全局坐标选择函数
  useEffect(() => {
    window.startCoordinatePicker = (mode, callback, currentValue) => {
      setCoordinatePickerMode(mode)
      coordinatePickerCallbackRef.current = callback
      if (currentValue) {
        setPickerPreviewPosition(currentValue)
      } else {
        setPickerPreviewPosition({ x: 0, y: 0, z: 0 })
      }
    }
    return () => {
      delete window.startCoordinatePicker
    }
  }, [])
  
  // 画布设置
  const [canvasSettings, setCanvasSettings] = useState({
    width: 1920,
    height: 1080,
    aspectRatio: '16:9',
    pixelRatio: 1
  })
  const [showCanvasSettings, setShowCanvasSettings] = useState(false)
  
  // 面板状态
  const [previewOpen, setPreviewOpen] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showProjectWizard, setShowProjectWizard] = useState(true) // 默认显示项目向导
  const [showSceneManager, setShowSceneManager] = useState(false) // 场景管理器
  
  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(isMobileDevice)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // 弹窗状态
  const [showCharacterModal, setShowCharacterModal] = useState(false)
  const [showCellEditModal, setShowCellEditModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showTrackTypeModal, setShowTrackTypeModal] = useState(false)
  const [selectedCharacterForTrack, setSelectedCharacterForTrack] = useState(null)
  const [editingCell, setEditingCell] = useState(null)
  const [copiedClips, setCopiedClips] = useState([])
  
  // AR录制状态
  const [showARRecorder, setShowARRecorder] = useState(false)
  const [arSceneData, setARSceneData] = useState(null)
  
  // 手机场景录制状态
  const [showMobileRecorder, setShowMobileRecorder] = useState(false)
  
  // WebXR AR播放器状态
  const [showWebXRPlayer, setShowWebXRPlayer] = useState(false)
  const [webXRSceneData, setWebXRSceneData] = useState(null)
  
  // 项目数据
  const [project, setProject] = useState({
    id: `project_${Date.now()}`,
    name: '新项目',
    duration: 60,
    backgroundImage: null,
    characters: [],
    tracks: []
  })
  
  // 检测是否有摄像机轨道
  const hasCameraTrack = useMemo(() => {
    return project.tracks.some(track => track.type === 'camera')
  }, [project.tracks])
  
  // 时间轴状态
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [timelineScale, setTimelineScale] = useState(1)
  
  // 撤销/重做历史
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const maxHistorySteps = 50
  
  // 保存项目状态到历史
  const saveToHistory = useCallback((newProject) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(JSON.parse(JSON.stringify(newProject)))
      if (newHistory.length > maxHistorySteps) {
        newHistory.shift()
      }
      return newHistory
    })
    setHistoryIndex(prev => Math.min(prev + 1, maxHistorySteps - 1))
  }, [historyIndex])
  
  // 撤销
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setProject(JSON.parse(JSON.stringify(history[newIndex])))
    }
  }, [history, historyIndex])
  
  // 重做
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setProject(JSON.parse(JSON.stringify(history[newIndex])))
    }
  }, [history, historyIndex])
  
  // 初始化历史
  useEffect(() => {
    if (history.length === 0) {
      saveToHistory(project)
    }
  }, [])
  
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
  
  // 播放循环 - 使用 performance.now() 提高精度
  useEffect(() => {
    if (isPlaying && previewOpen) {
      const startTime = performance.now() - currentTime * 1000
      const endTime = getTimelineEndTime() // 获取时间轴最大时间
      
      const playLoop = () => {
        const elapsed = (performance.now() - startTime) / 1000
        
        if (elapsed >= endTime) {
          // 到达时间轴末尾，停止播放并返回0秒
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
  
  // 当currentTime变化时更新场景（不播放时拖动时间轴也能看到效果）
  useEffect(() => {
    if (previewOpen && !isPlaying) {
      updateSceneAtTime(currentTime)
    }
  }, [currentTime, previewOpen, isPlaying])

  // 初始化摄像机预览（当hasCameraTrack变化时）
  useEffect(() => {
    if (!hasCameraTrack || !cameraPreviewRef.current || !sceneRef.current) return

    // 延迟初始化以确保canvas已经渲染
    const timer = setTimeout(() => {
      const previewWidth = cameraPreviewRef.current.clientWidth || 400
      const previewHeight = cameraPreviewRef.current.clientHeight || 300
      const previewAspect = previewWidth / previewHeight

      // 创建摄像机预览相机
      const cameraPreviewCamera = new THREE.PerspectiveCamera(60, previewAspect, 0.1, 1000)
      cameraPreviewCamera.position.set(0, 5, 10)
      cameraPreviewCamera.lookAt(0, 0, 0)
      cameraPreviewCameraRef.current = cameraPreviewCamera

      // 创建摄像机预览渲染器
      const cameraPreviewRenderer = new THREE.WebGLRenderer({
        canvas: cameraPreviewRef.current,
        antialias: true,
        preserveDrawingBuffer: false,
        alpha: false
      })
      cameraPreviewRenderer.setSize(previewWidth, previewHeight)
      cameraPreviewRenderer.setClearColor(0x1a1a2e, 1)
      cameraPreviewRendererRef.current = cameraPreviewRenderer

      console.log('Camera preview initialized:', previewWidth, previewHeight)
    }, 100)

    return () => {
      clearTimeout(timer)
      if (cameraPreviewRendererRef.current) {
        cameraPreviewRendererRef.current.dispose()
        cameraPreviewRendererRef.current = null
      }
    }
  }, [hasCameraTrack])

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
    // 使用cameraZoom调整摄像机位置，值越小摄像机越近，人物显示越大
    const baseDistance = 10
    const distance = baseDistance / cameraZoom
    camera.position.set(0, 5, distance)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera
    
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: false
    })
    renderer.setSize(canvasWidth, canvasHeight)
    renderer.setClearColor(0x1a1a2e, 1)
    renderer.shadowMap.enabled = true
    rendererRef.current = renderer
    
    console.log('Background set to:', project.backgroundImage ? 'texture' : '#1a1a2e')
    
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
    
    // 初始化道具管理器
    propManagerRef.current = new PropManager(scene)
    
    // 初始化特效管理器
    effectManagerRef.current = new EffectManager(scene)
    
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
        effectManagerRef.current?.update(0.016)
        
        // 渲染主画布（舞台画面）
        rendererRef.current.render(sceneRef.current, cameraRef.current)
        
        // 渲染摄像机预览画布（如果有摄像机轨道）
        if (hasCameraTrack && cameraPreviewRendererRef.current && cameraPreviewCameraRef.current) {
          cameraPreviewRendererRef.current.render(sceneRef.current, cameraPreviewCameraRef.current)
        }
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
  
  // 监听cameraZoom变化，更新摄像机位置
  useEffect(() => {
    if (cameraRef.current) {
      const baseDistance = 10
      const distance = baseDistance / cameraZoom
      cameraRef.current.position.z = distance
    }
  }, [cameraZoom])
  
  // 处理画布点击选择坐标
  const handleCanvasClickForCoordinate = (e) => {
    console.log('Coordinate picker clicked')
    if (!cameraRef.current) {
      console.warn('Camera not available')
      return
    }
    
    const canvas = canvasRef.current
    if (!canvas) {
      console.warn('Canvas not available')
      return
    }
    
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    
    console.log('Mouse normalized:', { x, y })
    
    try {
      // 创建射线
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera({ x, y }, cameraRef.current)
      
      // 与地面平面 (y=0) 相交
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
      const target = new THREE.Vector3()
      const intersected = raycaster.ray.intersectPlane(plane, target)
      
      console.log('Intersection result:', intersected, 'Target:', target)
      
      if (intersected) {
        const newPosition = {
          x: target.x,
          y: target.y,
          z: target.z
        }
        console.log('Setting picker position:', newPosition)
        setPickerPreviewPosition(newPosition)
      } else {
        // 如果没有相交，使用一个默认的地面位置
        console.warn('No intersection with ground plane, using default')
        // 根据相机方向计算一个默认位置
        const distance = 10
        const newPosition = {
          x: cameraRef.current.position.x + cameraRef.current.getWorldDirection(new THREE.Vector3()).x * distance,
          y: 0,
          z: cameraRef.current.position.z + cameraRef.current.getWorldDirection(new THREE.Vector3()).z * distance
        }
        setPickerPreviewPosition(newPosition)
      }
    } catch (error) {
      console.error('Error in coordinate picker:', error)
    }
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
  
  // 获取场景中的可用平面位置
  const getScenePlanePositions = () => {
    const sceneTracks = project.tracks.filter(t => t.type === 'scene')
    const positions = []
    
    sceneTracks.forEach(track => {
      track.clips?.forEach(clip => {
        const sceneData = clip.data?.sceneData
        if (sceneData?.type === 'arcjpack' && sceneData.mmdRenderConfig?.characterPlacement?.validPlanes) {
          sceneData.mmdRenderConfig.characterPlacement.validPlanes.forEach(plane => {
            positions.push({
              planeIndex: plane.planeIndex,
              worldPosition: plane.worldPosition,
              anchorPoints: plane.anchorPoints || []
            })
          })
        }
      })
    })
    
    return positions
  }
  
  // 添加角色 - 自动放置到场景平面上
  const addCharacters = (selectedCharacters) => {
    // 获取场景平面位置
    const planePositions = getScenePlanePositions()
    console.log('可用平面位置:', planePositions)
    
    const newCharacters = selectedCharacters.map((char, index) => {
      let position
      
      // 如果有场景平面，将角色放置到平面上
      if (planePositions.length > 0) {
        // 循环使用可用平面
        const planeIndex = index % planePositions.length
        const plane = planePositions[planeIndex]
        const worldPos = plane.worldPosition
        
        // 在平面中心位置，稍微抬高一点（避免穿模）
        position = {
          x: worldPos.x,
          y: worldPos.y + 0.05, // 抬高5cm
          z: worldPos.z
        }
        
        console.log(`角色 ${char.name} 放置到平面 ${plane.planeIndex}:`, position)
      } else {
        // 没有场景平面时使用默认位置
        position = { 
          x: (Math.random() - 0.5) * 4, 
          y: 0, 
          z: (Math.random() - 0.5) * 4 
        }
      }
      
      return {
        id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: char.name,
        vrmUrl: char.modelUrl,
        thumbnail: char.thumbnail,
        initialPosition: position,
        initialRotation: { x: 0, y: Math.random() * Math.PI * 2, z: 0 },
        initialScale: 1,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        // 记录放置的平面信息
        placedOnPlane: planePositions.length > 0 ? planePositions[index % planePositions.length].planeIndex : null
      }
    })

    // 只添加角色，不创建默认轨道
    setProject(prev => ({
      ...prev,
      characters: [...prev.characters, ...newCharacters]
    }))

    if (previewOpen && characterManagerRef.current) {
      newCharacters.forEach(char => loadCharacter(char))
    }
  }

  // 添加新轨道 - 直接添加，不需要弹窗
  const handleAddTrack = (characterId, trackType) => {
    const newTrack = createTrack(characterId, trackType)

    setProject(prev => ({
      ...prev,
      tracks: [...prev.tracks, newTrack]
    }))
  }
  
  // 删除角色
  const deleteCharacter = (characterId) => {
    if (!confirm('确定要删除这个角色吗？相关的轨道数据也会被删除。')) {
      return
    }

    // 从场景中移除角色
    if (characterManagerRef.current) {
      characterManagerRef.current.removeCharacter(characterId)
    }

    setProject(prev => ({
      ...prev,
      characters: prev.characters.filter(c => c.id !== characterId),
      tracks: prev.tracks.filter(t => t.characterId !== characterId)
    }))
  }

  // 删除轨道
  const deleteTrack = (trackId) => {
    if (!confirm('确定要删除这个轨道吗？')) {
      return
    }

    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.filter(t => t.id !== trackId)
    }))
  }
  
  // 添加片段到轨道 - 智能片段创建
  const addCell = (trackId, options = {}) => {
    // 获取轨道类型
    const track = project.tracks.find(t => t.id === trackId)
    const trackType = track?.type || 'unknown'
    
    // 智能默认设置
    const startTime = options.startTime !== undefined ? options.startTime : currentTime
    let defaultDuration = 5
    let defaultData = { name: '' }
    
    // 根据轨道类型设置智能默认值
    switch(trackType) {
      case 'action':
        defaultDuration = 3
        defaultData = { 
          name: '动作片段',
          actionId: null,
          actionName: '',
          actionData: null,
          loop: true 
        }
        break
      case 'camera':
        defaultDuration = 5
        defaultData = {
          name: '摄像机片段',
          keyframes: [
            { time: 0, position: { x: 0, y: 5, z: 10 }, target: { x: 0, y: 0, z: 0 }, fov: 60, easing: 'linear' },
            { time: 5, position: { x: 0, y: 5, z: 10 }, target: { x: 0, y: 0, z: 0 }, fov: 60, easing: 'linear' }
          ]
        }
        break
      case 'music':
        defaultDuration = project.duration - startTime
        defaultData = { name: '音乐片段', audioFile: null }
        break
      case 'effect':
        defaultDuration = 2
        defaultData = { name: '特效片段', effectType: 'sparkle' }
        break
      case 'position':
        defaultDuration = 3
        defaultData = { 
          name: '位置片段',
          pathType: 'linear',
          points: [{ x: 0, z: 0 }, { x: 2, z: 0 }]
        }
        break
      case 'prop':
        defaultDuration = project.duration - startTime
        defaultData = { name: '道具片段', propId: null }
        break
      case 'scene':
        defaultDuration = project.duration - startTime
        defaultData = { name: '场景片段', backgroundImage: null }
        break
      case 'characterScale':
      case 'backgroundScale':
        defaultDuration = 3
        defaultData = { name: '缩放片段', startScale: 1, endScale: 1.5 }
        break
    }
    
    const newClip = {
      id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'clip',
      startTime,
      duration: options.duration || defaultDuration,
      data: { ...defaultData, ...options.data }
    }

    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track =>
        track.id === trackId
          ? { ...track, clips: [...(track.clips || []), newClip] }
          : track
      )
    }))

    // 保存到历史
    saveToHistory(project)

    // 打开编辑弹窗 - 传入trackType
    setEditingCell({ trackId, trackType, cell: newClip })
    setShowCellEditModal(true)
  }

  // 更新片段
  const updateCell = (trackId, clipId, updates) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track =>
        track.id === trackId
          ? {
              ...track,
              clips: (track.clips || []).map(clip =>
                clip.id === clipId ? { ...clip, ...updates } : clip
              )
            }
          : track
      )
    }))
  }

  // 删除片段
  const deleteCell = (trackId, clipId) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track =>
        track.id === trackId
          ? { ...track, clips: (track.clips || []).filter(clip => clip.id !== clipId) }
          : track
      )
    }))
  }
  
  // 复制选中的片段
  const copySelectedClips = () => {
    if (!editingCell) return
    
    const track = project.tracks.find(t => t.id === editingCell.trackId)
    if (!track) return
    
    const clip = track.clips?.find(c => c.id === editingCell.cell.id)
    if (!clip) return
    
    // 深拷贝片段数据
    const copiedClip = JSON.parse(JSON.stringify(clip))
    copiedClip.id = `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    setCopiedClips([copiedClip])
  }
  
  // 粘贴片段
  const pasteClips = () => {
    if (copiedClips.length === 0) return
    
    // 粘贴到当前选中的轨道，如果没有选中则粘贴到第一个轨道
    let targetTrackId = editingCell?.trackId
    if (!targetTrackId && project.tracks.length > 0) {
      targetTrackId = project.tracks[0].id
    }
    if (!targetTrackId) return
    
    const newClips = copiedClips.map(clip => ({
      ...JSON.parse(JSON.stringify(clip)),
      id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: currentTime
    }))
    
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track =>
        track.id === targetTrackId
          ? { ...track, clips: [...(track.clips || []), ...newClips] }
          : track
      )
    }))
    
    // 保存到历史
    saveToHistory(project)
  }
  
  // 当前播放的动作缓存，避免重复加载
  const currentActionsRef = useRef({})
  
  // 当前场景缓存，避免重复加载背景
  const currentSceneRef = useRef(null)
  
  // 更新时间轴
  const updateSceneAtTime = (time) => {
    if (!characterManagerRef.current) return
    
    // 按轨道类型分组处理
    const tracksByType = {}
    project.tracks.forEach(track => {
      if (!tracksByType[track.type]) {
        tracksByType[track.type] = []
      }
      tracksByType[track.type].push(track)
    })
    
    // 处理场景轨道 - 应用背景
    const sceneTracks = tracksByType['scene'] || []
    sceneTracks.forEach(track => {
      const activeClip = track.clips?.find(clip => 
        time >= clip.startTime && time <= clip.startTime + clip.duration
      )
      
      if (activeClip?.data?.sceneData && sceneRef.current) {
        const sceneData = activeClip.data.sceneData
        
        // 处理图片背景
        if (sceneData.imageUrl) {
          const textureLoader = new THREE.TextureLoader()
          textureLoader.load(sceneData.imageUrl, (texture) => {
            if (sceneRef.current) {
              sceneRef.current.background = texture
            }
          })
        }
        // 处理真实AR场景背景 (real-ar 或 true-ar)
        else if ((sceneData.type === 'real-ar' || sceneData.type === 'true-ar') && sceneData.image) {
          const textureLoader = new THREE.TextureLoader()
          textureLoader.load(sceneData.image, (texture) => {
            if (sceneRef.current) {
              sceneRef.current.background = texture
            }
          })
        }
        // 处理AR相机场景 - 显示图片背景+3D平面
        else if (sceneData.type === 'ar-camera' && sceneData.image) {
          // 清除之前的AR场景平面
          const existingARPlanes = sceneRef.current.getObjectByName('ar-camera-planes')
          if (existingARPlanes) {
            sceneRef.current.remove(existingARPlanes)
          }
          
          // 加载背景图片
          const textureLoader = new THREE.TextureLoader()
          textureLoader.load(sceneData.image, (texture) => {
            if (sceneRef.current) {
              sceneRef.current.background = texture
            }
          })
          
          // 创建3D平面组
          if (sceneData.planes && sceneData.planes.length > 0) {
            const planesGroup = new THREE.Group()
            planesGroup.name = 'ar-camera-planes'
            
            sceneData.planes.forEach((planeData, index) => {
              const { worldPosition, realSize, rotation } = planeData
              
              // 创建平面几何体
              const geometry = new THREE.PlaneGeometry(
                realSize?.width || 2,
                realSize?.height || 2
              )
              
              // 平面材质
              const material = new THREE.MeshStandardMaterial({
                color: 0x00ff88,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide,
                roughness: 0.8,
                metalness: 0.1
              })
              
              const mesh = new THREE.Mesh(geometry, material)
              mesh.position.set(worldPosition.x, worldPosition.y, worldPosition.z)
              mesh.rotation.set(
                (rotation?.x || -90) * Math.PI / 180,
                (rotation?.y || 0) * Math.PI / 180,
                (rotation?.z || 0) * Math.PI / 180
              )
              mesh.castShadow = true
              mesh.receiveShadow = true
              
              // 添加边框
              const edges = new THREE.EdgesGeometry(geometry)
              const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff88 })
              const wireframe = new THREE.LineSegments(edges, lineMaterial)
              mesh.add(wireframe)
              
              // 添加序号标签
              const canvas = document.createElement('canvas')
              const ctx = canvas.getContext('2d')
              canvas.width = 128
              canvas.height = 64
              ctx.fillStyle = '#00ff88'
              ctx.fillRect(0, 0, canvas.width, canvas.height)
              ctx.fillStyle = '#000'
              ctx.font = 'bold 32px Arial'
              ctx.textAlign = 'center'
              ctx.fillText(`${index + 1}`, 64, 44)
              
              const texture = new THREE.CanvasTexture(canvas)
              const spriteMaterial = new THREE.SpriteMaterial({ map: texture })
              const sprite = new THREE.Sprite(spriteMaterial)
              sprite.position.y = 0.6
              sprite.scale.set(0.8, 0.4, 1)
              mesh.add(sprite)
              
              planesGroup.add(mesh)
            })
            
            sceneRef.current.add(planesGroup)
          }
        }
        // 处理ARCJPack场景 - 时间轴和MMD预览专用
        else if (sceneData.type === 'arcjpack' && sceneData.image) {
          // 清除之前的场景
          const existingScene = sceneRef.current.getObjectByName('arcjpack-scene')
          if (existingScene) {
            sceneRef.current.remove(existingScene)
          }
          
          // 加载背景图片
          const textureLoader = new THREE.TextureLoader()
          textureLoader.load(sceneData.image, (texture) => {
            if (sceneRef.current) {
              sceneRef.current.background = texture
            }
          })
          
          // 创建场景组
          const sceneGroup = new THREE.Group()
          sceneGroup.name = 'arcjpack-scene'
          
          // 获取MMD渲染配置
          const mmdConfig = sceneData.mmdRenderConfig || {}
          const planes = mmdConfig.planes3D || sceneData.planes || []
          
          // 创建多平面3D环境
          if (planes.length > 0) {
            const planesGroup = new THREE.Group()
            planesGroup.name = 'mmd-planes'
            
            // 计算场景边界和中心
            const sceneBounds = sceneData.sceneBounds
            let targetPosition, lookAtPosition
            
            if (sceneBounds && sceneBounds.center) {
              // 使用场景边界计算最佳相机位置
              const center = sceneBounds.center
              const size = sceneBounds.size || { width: 4, height: 4, depth: 4 }
              const maxDim = Math.max(size.width, size.height, size.depth)
              
              // 根据场景大小计算相机距离
              const distance = maxDim * 1.5
              
              targetPosition = {
                x: center.x + distance * 0.5,
                y: center.y + distance * 0.8,
                z: center.z + distance
              }
              lookAtPosition = center
              
              console.log('根据场景边界调整相机:', { center, size, distance })
            } else if (planes.length > 0) {
              // 计算所有平面的中心
              const centerX = planes.reduce((sum, p) => sum + p.worldPosition.x, 0) / planes.length
              const centerY = planes.reduce((sum, p) => sum + p.worldPosition.y, 0) / planes.length
              const centerZ = planes.reduce((sum, p) => sum + p.worldPosition.z, 0) / planes.length
              
              targetPosition = {
                x: centerX + 3,
                y: centerY + 4,
                z: centerZ + 5
              }
              lookAtPosition = { x: centerX, y: centerY, z: centerZ }
              
              console.log('根据平面中心调整相机:', lookAtPosition)
            }
            
            // 应用相机位置
            if (targetPosition && cameraRef.current) {
              cameraRef.current.position.set(
                targetPosition.x,
                targetPosition.y,
                targetPosition.z
              )
              cameraRef.current.lookAt(
                lookAtPosition.x,
                lookAtPosition.y,
                lookAtPosition.z
              )
            }
            // 如果没有计算出来，使用保存的相机配置
            else {
              const camera = mmdConfig.camera || sceneData.camera
              if (camera && camera.position && cameraRef.current) {
                cameraRef.current.position.set(
                  camera.position.x,
                  camera.position.y,
                  camera.position.z
                )
                const lookAt = camera.lookAt || { x: 0, y: 0, z: 0 }
                cameraRef.current.lookAt(lookAt.x, lookAt.y, lookAt.z)
              }
            }
            
            planes.forEach((planeData, index) => {
              const { worldPosition, realSize, rotation, polygon } = planeData
              
              // 创建平面几何体
              let geometry
              if (polygon && polygon.length >= 3) {
                const shape = new THREE.Shape()
                shape.moveTo(polygon[0].x, polygon[0].z)
                for (let i = 1; i < polygon.length; i++) {
                  shape.lineTo(polygon[i].x, polygon[i].z)
                }
                shape.closePath()
                geometry = new THREE.ShapeGeometry(shape)
              } else {
                geometry = new THREE.PlaneGeometry(
                  realSize?.width || 2,
                  realSize?.height || 2
                )
              }
              
              // 获取平面图片
              const planeImage = sceneData.planeImages?.[index]
              
              // 创建材质 - 如果有图片则使用图片纹理
              let material
              if (planeImage) {
                // 加载平面图片作为纹理
                const textureLoader = new THREE.TextureLoader()
                const texture = textureLoader.load(planeImage)
                texture.wrapS = THREE.ClampToEdgeWrapping
                texture.wrapT = THREE.ClampToEdgeWrapping
                
                material = new THREE.MeshStandardMaterial({
                  map: texture,
                  transparent: true,
                  opacity: 0.95,
                  side: THREE.DoubleSide,
                  roughness: 0.8,
                  metalness: 0.1
                })
              } else {
                // 备用：使用彩色材质
                const colors = [0x00ff88, 0x4488ff, 0xff6b6b, 0xffd93d, 0x6bcf7f, 0x9b59b6]
                const color = colors[index % colors.length]
                material = new THREE.MeshStandardMaterial({
                  color: color,
                  transparent: true,
                  opacity: 0.35,
                  side: THREE.DoubleSide,
                  roughness: 0.6,
                  metalness: 0.2
                })
              }
              
              const mesh = new THREE.Mesh(geometry, material)
              mesh.position.set(worldPosition.x, worldPosition.y, worldPosition.z)
              mesh.rotation.set(
                (rotation?.x || -90) * Math.PI / 180,
                (rotation?.y || 0) * Math.PI / 180,
                (rotation?.z || 0) * Math.PI / 180
              )
              mesh.castShadow = true
              mesh.receiveShadow = true
              mesh.userData = { 
                isPlane: true, 
                planeIndex: index,
                anchorPoints: planeData.anchorPoints || [],
                hasTexture: !!planeImage
              }
              
              // 边框（仅在无纹理时显示，或半透明）
              const colors = [0x00ff88, 0x4488ff, 0xff6b6b, 0xffd93d, 0x6bcf7f, 0x9b59b6]
              const edgeColor = planeImage ? 0xffffff : colors[index % colors.length]
              const edges = new THREE.EdgesGeometry(geometry)
              const lineMaterial = new THREE.LineBasicMaterial({ 
                color: edgeColor,
                transparent: true,
                opacity: planeImage ? 0.3 : 0.8
              })
              const wireframe = new THREE.LineSegments(edges, lineMaterial)
              mesh.add(wireframe)
              
              // 序号标签（仅在无纹理时显示）
              if (!planeImage) {
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                canvas.width = 128
                canvas.height = 64
                ctx.fillStyle = '#' + colors[index % colors.length].toString(16).padStart(6, '0')
                ctx.fillRect(0, 0, canvas.width, canvas.height)
                ctx.fillStyle = '#000'
                ctx.font = 'bold 32px Arial'
                ctx.textAlign = 'center'
                ctx.fillText(`${index + 1}`, 64, 44)
                
                const texture = new THREE.CanvasTexture(canvas)
                const spriteMaterial = new THREE.SpriteMaterial({ map: texture })
                const sprite = new THREE.Sprite(spriteMaterial)
                sprite.position.y = 0.8
                sprite.scale.set(1, 0.5, 1)
                mesh.add(sprite)
              }
              
              planesGroup.add(mesh)
            })
            
            sceneGroup.add(planesGroup)
          }
          
          // 添加光照
          const lighting = mmdConfig.lighting || {}
          
          // 环境光 - 提供基础照明
          const ambientLight = new THREE.AmbientLight(
            lighting.ambient?.color || 0xffffff,
            lighting.ambient?.intensity || 0.5
          )
          sceneGroup.add(ambientLight)
          
          // 主光源（平行光）- 模拟太阳光
          const dirLight = new THREE.DirectionalLight(
            lighting.directional?.color || 0xffffff,
            lighting.directional?.intensity || 1.0
          )
          const dirPos = lighting.directional?.position || { x: 8, y: 12, z: 8 }
          dirLight.position.set(dirPos.x, dirPos.y, dirPos.z)
          
          // 配置高质量阴影
          dirLight.castShadow = true
          dirLight.shadow.mapSize.width = 2048
          dirLight.shadow.mapSize.height = 2048
          dirLight.shadow.camera.near = 0.5
          dirLight.shadow.camera.far = 50
          
          // 根据场景大小调整阴影范围
          const arcjpackSceneBounds = sceneData.sceneBounds
          if (arcjpackSceneBounds && arcjpackSceneBounds.size) {
            const shadowSize = Math.max(arcjpackSceneBounds.size.width, arcjpackSceneBounds.size.depth) * 0.8
            dirLight.shadow.camera.left = -shadowSize
            dirLight.shadow.camera.right = shadowSize
            dirLight.shadow.camera.top = shadowSize
            dirLight.shadow.camera.bottom = -shadowSize
          } else {
            dirLight.shadow.camera.left = -10
            dirLight.shadow.camera.right = 10
            dirLight.shadow.camera.top = 10
            dirLight.shadow.camera.bottom = -10
          }
          
          dirLight.shadow.bias = -0.0005
          sceneGroup.add(dirLight)
          
          // 补光 - 减少阴影区域的黑暗
          const fillLight = new THREE.DirectionalLight(
            lighting.fill?.color || 0xccccff,
            lighting.fill?.intensity || 0.3
          )
          fillLight.position.set(-5, 5, -5)
          sceneGroup.add(fillLight)
          
          // 添加地面网格（辅助）
          const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
          gridHelper.position.y = 0.01
          sceneGroup.add(gridHelper)
          
          sceneRef.current.add(sceneGroup)
          
          console.log('ARCJPack场景加载完成:', {
            planes: planes.length,
            camera: mmdConfig.camera,
            characterPlacement: mmdConfig.characterPlacement
          })
        }
        // 处理AR多平面场景 - 真实多平面3D环境
        else if (sceneData.type === 'ar-multi-plane' && sceneData.image) {
          // 清除之前的AR场景平面
          const existingARPlanes = sceneRef.current.getObjectByName('ar-multi-planes')
          if (existingARPlanes) {
            sceneRef.current.remove(existingARPlanes)
          }
          
          // 加载背景图片
          const textureLoader = new THREE.TextureLoader()
          textureLoader.load(sceneData.image, (texture) => {
            if (sceneRef.current) {
              sceneRef.current.background = texture
            }
          })
          
          // 创建多平面3D环境
          if (sceneData.planes && sceneData.planes.length > 0) {
            const planesGroup = new THREE.Group()
            planesGroup.name = 'ar-multi-planes'
            
            // 计算场景中心，用于调整相机位置
            const bounds = sceneData.sceneBounds
            if (bounds && bounds.center) {
              // 调整相机位置以查看整个场景
              if (cameraRef.current) {
                cameraRef.current.position.set(
                  bounds.center.x,
                  bounds.center.y + 3,
                  bounds.center.z + 5
                )
                cameraRef.current.lookAt(bounds.center.x, bounds.center.y, bounds.center.z)
              }
            }
            
            sceneData.planes.forEach((planeData, index) => {
              const { worldPosition, realSize, rotation, polygon } = planeData
              
              // 创建平面几何体
              let geometry
              if (polygon && polygon.length >= 3) {
                // 使用多边形创建自定义形状
                const shape = new THREE.Shape()
                shape.moveTo(polygon[0].x, polygon[0].z)
                for (let i = 1; i < polygon.length; i++) {
                  shape.lineTo(polygon[i].x, polygon[i].z)
                }
                shape.closePath()
                geometry = new THREE.ShapeGeometry(shape)
              } else {
                // 使用矩形
                geometry = new THREE.PlaneGeometry(
                  realSize?.width || 2,
                  realSize?.height || 2
                )
              }
              
              // 平面材质 - 使用不同颜色区分不同平面
              const colors = [0x00ff88, 0x4488ff, 0xff6b6b, 0xffd93d, 0x6bcf7f, 0x9b59b6]
              const color = colors[index % colors.length]
              
              const material = new THREE.MeshStandardMaterial({
                color: color,
                transparent: true,
                opacity: 0.4,
                side: THREE.DoubleSide,
                roughness: 0.6,
                metalness: 0.2
              })
              
              const mesh = new THREE.Mesh(geometry, material)
              mesh.position.set(worldPosition.x, worldPosition.y, worldPosition.z)
              mesh.rotation.set(
                (rotation?.x || -90) * Math.PI / 180,
                (rotation?.y || 0) * Math.PI / 180,
                (rotation?.z || 0) * Math.PI / 180
              )
              mesh.castShadow = true
              mesh.receiveShadow = true
              
              // 添加边框
              const edges = new THREE.EdgesGeometry(geometry)
              const lineMaterial = new THREE.LineBasicMaterial({ color: color, linewidth: 2 })
              const wireframe = new THREE.LineSegments(edges, lineMaterial)
              mesh.add(wireframe)
              
              // 添加序号标签
              const canvas = document.createElement('canvas')
              const ctx = canvas.getContext('2d')
              canvas.width = 128
              canvas.height = 64
              ctx.fillStyle = '#' + color.toString(16).padStart(6, '0')
              ctx.fillRect(0, 0, canvas.width, canvas.height)
              ctx.fillStyle = '#000'
              ctx.font = 'bold 32px Arial'
              ctx.textAlign = 'center'
              ctx.fillText(`${index + 1}`, 64, 44)
              
              const texture = new THREE.CanvasTexture(canvas)
              const spriteMaterial = new THREE.SpriteMaterial({ map: texture })
              const sprite = new THREE.Sprite(spriteMaterial)
              sprite.position.y = 0.8
              sprite.scale.set(1, 0.5, 1)
              mesh.add(sprite)
              
              planesGroup.add(mesh)
            })
            
            sceneRef.current.add(planesGroup)
            
            // 添加环境光和平行光
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
            sceneRef.current.add(ambientLight)
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
            directionalLight.position.set(5, 10, 5)
            directionalLight.castShadow = true
            sceneRef.current.add(directionalLight)
          }
        }
        // 处理WebXR AR场景 - 渲染3D平面
        else if (sceneData.type === 'webxr-ar' && sceneData.planes) {
          // 清除之前的AR场景平面
          const existingARPlanes = sceneRef.current.getObjectByName('webxr-ar-planes')
          if (existingARPlanes) {
            sceneRef.current.remove(existingARPlanes)
          }
          
          // 创建新的AR场景平面组
          const planesGroup = new THREE.Group()
          planesGroup.name = 'webxr-ar-planes'
          
          // 渲染每个平面
          sceneData.planes.forEach((planeData, index) => {
            const { position, rotation, size } = planeData
            
            // 创建平面几何体
            const geometry = new THREE.PlaneGeometry(
              size?.width || 2,
              size?.height || 2
            )
            
            // 平面材质
            const material = new THREE.MeshStandardMaterial({
              color: 0x00ff88,
              transparent: true,
              opacity: 0.3,
              side: THREE.DoubleSide,
              roughness: 0.8,
              metalness: 0.1
            })
            
            const mesh = new THREE.Mesh(geometry, material)
            mesh.position.set(position.x, position.y, position.z)
            mesh.rotation.set(
              (rotation?.x || -90) * Math.PI / 180,
              (rotation?.y || 0) * Math.PI / 180,
              (rotation?.z || 0) * Math.PI / 180
            )
            mesh.castShadow = true
            mesh.receiveShadow = true
            
            // 添加边框
            const edges = new THREE.EdgesGeometry(geometry)
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff88 })
            const wireframe = new THREE.LineSegments(edges, lineMaterial)
            mesh.add(wireframe)
            
            // 添加序号标签
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            canvas.width = 128
            canvas.height = 64
            ctx.fillStyle = '#00ff88'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.fillStyle = '#000'
            ctx.font = 'bold 32px Arial'
            ctx.textAlign = 'center'
            ctx.fillText(`${index + 1}`, 64, 44)
            
            const texture = new THREE.CanvasTexture(canvas)
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture })
            const sprite = new THREE.Sprite(spriteMaterial)
            sprite.position.y = 0.6
            sprite.scale.set(0.8, 0.4, 1)
            mesh.add(sprite)
            
            planesGroup.add(mesh)
          })
          
          sceneRef.current.add(planesGroup)
          
          // 设置深色背景以突出3D场景
          if (!sceneRef.current.background || sceneRef.current.background instanceof THREE.Color) {
            sceneRef.current.background = new THREE.Color(0x1a1a2e)
          }
        }
        // 处理纯色背景
        else if (sceneData.type === 'color' && sceneData.color) {
          sceneRef.current.background = new THREE.Color(sceneData.color)
        }
      }
    })
    
    // 处理背景缩放轨道
    const bgScaleTracks = tracksByType['bgScale'] || []
    bgScaleTracks.forEach(track => {
      const activeClip = track.clips?.find(clip => 
        time >= clip.startTime && time <= clip.startTime + clip.duration
      )
      
      if (activeClip?.data?.scale && cameraRef.current) {
        const baseFov = 60
        const newFov = baseFov / activeClip.data.scale
        cameraRef.current.fov = Math.max(20, Math.min(120, newFov))
        cameraRef.current.updateProjectionMatrix()
      }
    })
    
    // 处理角色相关轨道
    project.characters.forEach(char => {
      const character = characterManagerRef.current.getCharacter(char.id)
      if (!character || !character.vrm) return
      
      // 获取该角色的所有轨道
      const charTracks = project.tracks.filter(t => t.characterId === char.id)
      
      // 处理位置轨道
      const positionTrack = charTracks.find(t => t.type === 'position')
      if (positionTrack) {
        const activeClip = positionTrack.clips?.find(clip => 
          time >= clip.startTime && time <= clip.startTime + clip.duration
        )
        
        if (activeClip?.data?.pathData) {
          const path = activeClip.data.pathData
          const progress = (time - activeClip.startTime) / activeClip.duration
          
          // 使用路径计算函数
          const position = calculatePositionOnPath(path, progress)
          if (position) {
            character.vrm.scene.position.set(position.x, position.y, position.z)
          }
        }
      }
      
      // 处理缩放轨道
      const scaleTrack = charTracks.find(t => t.type === 'scale')
      if (scaleTrack) {
        const activeClip = scaleTrack.clips?.find(clip => 
          time >= clip.startTime && time <= clip.startTime + clip.duration
        )
        
        if (activeClip?.data?.scale) {
          const scale = activeClip.data.scale * characterScale
          character.vrm.scene.scale.setScalar(scale)
        } else {
          character.vrm.scene.scale.setScalar(characterScale)
        }
      } else {
        // 没有缩放轨道时使用默认缩放
        character.vrm.scene.scale.setScalar(characterScale)
      }
      
      // 处理动作轨道
      const actionTracks = charTracks.filter(t => t.type === 'action')
      console.log('角色动作轨道:', char.id, '轨道数:', actionTracks.length, '所有轨道:', charTracks.map(t => t.type))
      
      actionTracks.forEach(track => {
        console.log('检查动作轨道:', track.id, 'clips:', track.clips?.length)
        const activeClip = track.clips?.find(clip => 
          time >= clip.startTime && time <= clip.startTime + clip.duration
        )
        
        console.log('当前时间:', time, '活跃片段:', activeClip?.id)
        console.log('片段完整数据:', JSON.stringify(activeClip?.data, null, 2))
        
        if (activeClip?.data?.actionData) {
          const actionKey = `${char.id}_${activeClip.id}`
          const currentActionKey = currentActionsRef.current[char.id]
          
          console.log('动作片段激活:', actionKey, '当前:', currentActionKey, '数据:', activeClip.data.actionData)
          
          if (actionKey !== currentActionKey) {
            currentActionsRef.current[char.id] = actionKey
            
            // 使用actionData中的信息播放动作
            const actionData = activeClip.data.actionData
            const filePath = actionData.filePath || actionData.url
            console.log('加载动作:', filePath)
            
            if (filePath && character.vrm) {
              loadVRMAAction(filePath, character.vrm).then(result => {
                console.log('动作加载结果:', result)
                if (result?.clip) {
                  characterManagerRef.current.playCharacterAction(
                    char.id,
                    result.clip,
                    { loop: true, transitionDuration: 0.3 }
                  )
                  console.log('动作播放成功:', char.id)
                }
              }).catch(err => {
                console.error('加载动作失败:', err)
              })
            } else {
              console.warn('缺少filePath或vrm:', { filePath, hasVrm: !!character.vrm })
            }
          }
        } else if (activeClip) {
          console.log('片段没有actionData:', activeClip.data)
        }
      })
      
      // 处理特效轨道
      const effectTracks = charTracks.filter(t => t.type === 'effect')
      effectTracks.forEach(track => {
        const activeClip = track.clips?.find(clip => 
          time >= clip.startTime && time <= clip.startTime + clip.duration
        )
        
        if (activeClip?.data?.effectId && effectManagerRef.current) {
          const effectId = activeClip.data.effectId
          const existingEffect = effectManagerRef.current.particleSystems.get(effectId)
          
          if (!existingEffect) {
            // 创建特效
            const preset = PRESET_EFFECTS[effectId]
            if (preset) {
              const options = {
                ...preset.options,
                position: activeClip.data.position || { x: 0, y: 1, z: 0 }
              }
              effectManagerRef.current.createParticleSystem(effectId, options)
            }
          }
        }
      })
    })
    
    // 处理音乐轨道
    const musicTracks = tracksByType['music'] || []
    musicTracks.forEach(track => {
      const activeClip = track.clips?.find(clip => 
        time >= clip.startTime && time <= clip.startTime + clip.duration
      )
      
      if (activeClip?.data?.audioUrl) {
        const musicManager = getMusicManager()
        
        // 如果音频未加载或需要切换，加载新音频
        if (musicManager.currentUrl !== activeClip.data.audioUrl) {
          musicManager.load(activeClip.data.audioUrl).then(() => {
            if (isPlaying) {
              musicManager.play()
            }
          }).catch(err => {
            console.error('音乐加载失败:', err)
          })
        }
        
        // 同步时间
        const clipTime = time - activeClip.startTime
        if (Math.abs(musicManager.getCurrentTime() - clipTime) > 0.03) {
          musicManager.setCurrentTime(clipTime)
        }
      }
    })
    
    // 处理摄像机轨道
    const cameraTracks = tracksByType['camera'] || []
    cameraTracks.forEach(track => {
      const activeClip = track.clips?.find(clip => 
        time >= clip.startTime && time <= clip.startTime + clip.duration
      )
      
      if (activeClip?.data?.keyframes && cameraRef.current) {
        const keyframes = activeClip.data.keyframes
        if (keyframes.length === 0) return
        
        // 计算片段内的时间进度
        const clipTime = time - activeClip.startTime
        const clipDuration = activeClip.duration
        const progress = Math.max(0, Math.min(1, clipTime / clipDuration))
        
        // 找到当前时间所在的关键帧区间
        let startKeyframe = keyframes[0]
        let endKeyframe = keyframes[keyframes.length - 1]
        let localProgress = 0
        
        for (let i = 0; i < keyframes.length - 1; i++) {
          const kf1 = keyframes[i]
          const kf2 = keyframes[i + 1]
          const kf1Time = (kf1.time / clipDuration) * clipDuration
          const kf2Time = (kf2.time / clipDuration) * clipDuration
          
          if (clipTime >= kf1Time && clipTime <= kf2Time) {
            startKeyframe = kf1
            endKeyframe = kf2
            localProgress = (clipTime - kf1Time) / (kf2Time - kf1Time)
            break
          }
        }
        
        // 应用缓动函数
        const easing = startKeyframe.easing || 'linear'
        const easedProgress = applyEasing(localProgress, easing)
        
        // 插值计算摄像机位置
        const position = {
          x: startKeyframe.position.x + (endKeyframe.position.x - startKeyframe.position.x) * easedProgress,
          y: startKeyframe.position.y + (endKeyframe.position.y - startKeyframe.position.y) * easedProgress,
          z: startKeyframe.position.z + (endKeyframe.position.z - startKeyframe.position.z) * easedProgress
        }
        
        // 插值计算目标点
        const target = {
          x: startKeyframe.target.x + (endKeyframe.target.x - startKeyframe.target.x) * easedProgress,
          y: startKeyframe.target.y + (endKeyframe.target.y - startKeyframe.target.y) * easedProgress,
          z: startKeyframe.target.z + (endKeyframe.target.z - startKeyframe.target.z) * easedProgress
        }
        
        // 插值计算FOV
        const fov = startKeyframe.fov + (endKeyframe.fov - startKeyframe.fov) * easedProgress
        
        // 应用摄像机设置
        cameraRef.current.position.set(position.x, position.y, position.z)
        cameraRef.current.lookAt(target.x, target.y, target.z)
        cameraRef.current.fov = fov
        cameraRef.current.updateProjectionMatrix()
        
        // 同时更新摄像机预览相机
        if (cameraPreviewCameraRef.current) {
          cameraPreviewCameraRef.current.position.set(position.x, position.y, position.z)
          cameraPreviewCameraRef.current.lookAt(target.x, target.y, target.z)
          cameraPreviewCameraRef.current.fov = fov
          cameraPreviewCameraRef.current.updateProjectionMatrix()
        }
      }
    })
    
    // 处理道具轨道
    const propTracks = tracksByType['prop'] || []
    propTracks.forEach(track => {
      const activeClip = track.clips?.find(clip => 
        time >= clip.startTime && time <= clip.startTime + clip.duration
      )
      
      if (activeClip?.data?.propId && propManagerRef.current) {
        const propId = activeClip.data.propId
        const existingProp = propManagerRef.current.getProp(propId)
        
        if (!existingProp) {
          // 创建预设道具
          const options = activeClip.data.propOptions || {}
          createPresetProp(sceneRef.current, propId, options)
        }
      }
    })
  }
  
  // 缓动函数
  const applyEasing = (t, easing) => {
    switch (easing) {
      case 'easeIn':
        return t * t
      case 'easeOut':
        return 1 - (1 - t) * (1 - t)
      case 'easeInOut':
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      case 'bounce':
        const n1 = 7.5625
        const d1 = 2.75
        if (t < 1 / d1) {
          return n1 * t * t
        } else if (t < 2 / d1) {
          return n1 * (t -= 1.5 / d1) * t + 0.75
        } else if (t < 2.5 / d1) {
          return n1 * (t -= 2.25 / d1) * t + 0.9375
        } else {
          return n1 * (t -= 2.625 / d1) * t + 0.984375
        }
      case 'linear':
      default:
        return t
    }
  }
  
  // 播放/暂停
  const togglePlay = () => {
    if (!previewOpen) {
      setPreviewOpen(true)
      setTimeout(() => setIsPlaying(true), 100)
    } else {
      const newPlayingState = !isPlaying
      setIsPlaying(newPlayingState)
      
      // 同步音乐播放状态
      const musicManager = getMusicManager()
      if (newPlayingState) {
        musicManager.play()
      } else {
        musicManager.pause()
      }
    }
  }
  
  // 保存项目
  const saveProject = useCallback(() => {
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
    return true
  }, [project])
  
  // 自动保存
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (project.tracks.length > 0 || project.characters.length > 0) {
        saveProject()
        console.log('项目已自动保存')
      }
    }, 30000) // 每30秒自动保存
    
    return () => clearInterval(autoSaveInterval)
  }, [project, saveProject])
  
  // 计算时间轴最后的时间
  const getTimelineEndTime = () => {
    let maxTime = 0
    project.tracks.forEach(track => {
      // 检查所有轨道的clips
      if (track.clips) {
        track.clips.forEach(clip => {
          const endTime = clip.startTime + clip.duration
          if (endTime > maxTime) maxTime = endTime
        })
      }
    })
    return Math.max(maxTime, project.duration)
  }
  
  // 键盘快捷键 - 放在所有依赖函数定义之后
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 如果在输入框中，不处理快捷键
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      
      if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
          case 'z':
            e.preventDefault()
            if (e.shiftKey) {
              redo()
            } else {
              undo()
            }
            break
          case 's':
            e.preventDefault()
            saveProject()
            break
          case 'c':
            if (e.shiftKey) {
              e.preventDefault()
              copySelectedClips()
            }
            break
          case 'v':
            if (e.shiftKey) {
              e.preventDefault()
              pasteClips()
            }
            break
        }
      } else {
        switch(e.key) {
          case ' ':
            e.preventDefault()
            togglePlay()
            break
          case 'Delete':
          case 'Backspace':
            if (editingCell) {
              e.preventDefault()
              deleteCell(editingCell.trackId, editingCell.cell.id)
            }
            break
          case 'ArrowLeft':
            e.preventDefault()
            setCurrentTime(prev => Math.max(0, prev - 0.1))
            break
          case 'ArrowRight':
            e.preventDefault()
            setCurrentTime(prev => Math.min(project.duration, prev + 0.1))
            break
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, saveProject, togglePlay, editingCell, deleteCell, project.duration])
  
  // 导出GIF/视频/ZIP
  const [exportProgress, setExportProgress] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [exportStage, setExportStage] = useState('') // 导出阶段提示
  
  // 优化的批量渲染函数 - 使用requestAnimationFrame
  const renderFrames = async (duration, fps, onFrame) => {
    const totalFrames = Math.ceil(duration * fps)
    const frameTime = 1000 / fps
    
    return new Promise((resolve) => {
      let frameIndex = 0
      let lastTime = performance.now()
      
      const renderLoop = () => {
        const currentTime = performance.now()
        const deltaTime = currentTime - lastTime
        
        if (deltaTime >= frameTime) {
          const time = frameIndex / fps
          updateSceneAtTime(time)
          rendererRef.current.render(sceneRef.current, cameraRef.current)
          
          // 捕获帧
          const dataUrl = rendererRef.current.domElement.toDataURL('image/png')
          onFrame(dataUrl, frameIndex)
          
          frameIndex++
          lastTime = currentTime
          
          // 更新进度
          const progress = Math.round((frameIndex / totalFrames) * 100)
          setExportProgress(progress)
        }
        
        if (frameIndex < totalFrames) {
          requestAnimationFrame(renderLoop)
        } else {
          resolve()
        }
      }
      
      requestAnimationFrame(renderLoop)
    })
  }
  
  const handleExportMedia = async (type) => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
      alert('预览窗口未打开，请先打开预览')
      return
    }
    
    const fps = 30
    const duration = getTimelineEndTime()
    
    if (duration === 0) {
      alert('时间轴为空，无法导出')
      return
    }
    
    if (duration > 60) {
      if (!confirm(`导出时长为${duration.toFixed(1)}秒，超过60秒，确定要继续吗？`)) {
        return
      }
    }
    
    setIsExporting(true)
    setExportProgress(0)
    setExportStage('正在渲染帧...')
    
    // 暂停播放
    const wasPlaying = isPlaying
    setIsPlaying(false)
    
    const frames = []
    
    // 使用优化的批量渲染
    await renderFrames(duration, fps, (dataUrl) => {
      frames.push(dataUrl)
    })
    
    setExportStage('正在生成文件...')
    
    if (type === 'gif') {
      await exportGIF(frames, fps)
    } else if (type === 'video') {
      await exportVideo(frames, fps)
    } else if (type === 'zip') {
      await exportZIP(frames, fps)
    } else if (type === 'project') {
      await exportProjectZIP()
    }
    
    setIsExporting(false)
    setExportProgress(0)
    setExportStage('')
    
    // 恢复播放状态
    if (wasPlaying) {
      setIsPlaying(true)
    }
  }
  
  // 导出GIF - 使用gif.js（优化版）
  const exportGIF = async (frames, fps) => {
    try {
      const gif = new GIF({
        workers: 4, // 增加worker数量
        quality: 10,
        width: 960,
        height: 540,
        workerScript: '/gif.worker.js'
      })
      
      // 并行加载帧
      const loadFrame = (frameData) => {
        return new Promise((resolve) => {
          const img = new Image()
          img.src = frameData
          img.onload = () => {
            gif.addFrame(img, { delay: 1000 / fps })
            resolve()
          }
        })
      }
      
      // 批量加载，每10帧更新一次进度
      for (let i = 0; i < frames.length; i += 10) {
        const batch = frames.slice(i, i + 10)
        await Promise.all(batch.map(loadFrame))
        setExportProgress(Math.round(((i + batch.length) / frames.length) * 50) + 50)
      }
      
      gif.on('finished', (blob) => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = `${project.name}.gif`
        link.href = url
        link.click()
        URL.revokeObjectURL(url)
        alert('GIF导出成功！')
      })
      
      gif.render()
    } catch (error) {
      console.error('GIF导出失败:', error)
      alert('GIF导出失败: ' + error.message)
    }
  }
  
  // 导出视频 - 使用实时录制（更高效）
  const exportVideo = async (frames, fps) => {
    try {
      const canvas = rendererRef.current.domElement
      const stream = canvas.captureStream(fps)
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      })
      
      const chunks = []
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = `${project.name}.webm`
        link.href = url
        link.click()
        URL.revokeObjectURL(url)
        alert('视频导出成功！')
      }
      
      // 开始录制
      mediaRecorder.start()
      
      // 播放动画并录制
      const duration = frames.length / fps * 1000
      setTimeout(() => {
        mediaRecorder.stop()
      }, duration)
      
    } catch (error) {
      console.error('视频导出失败:', error)
      alert('视频导出失败: ' + error.message)
    }
  }
  
  // 导出帧序列ZIP
  const exportZIP = async (frames, fps) => {
    try {
      const zip = new JSZip()
      const folder = zip.folder(`${project.name}_frames`)
      
      // 添加帧图片
      for (let i = 0; i < frames.length; i++) {
        const frameData = frames[i]
        const base64Data = frameData.split(',')[1]
        folder.file(`frame_${String(i).padStart(4, '0')}.png`, base64Data, { base64: true })
        
        if (i % 10 === 0) {
          setExportProgress(Math.round((i / frames.length) * 50) + 50)
        }
      }
      
      // 添加项目信息JSON
      const projectInfo = {
        name: project.name,
        fps: fps,
        frameCount: frames.length,
        duration: frames.length / fps,
        exportedAt: new Date().toISOString()
      }
      folder.file('project_info.json', JSON.stringify(projectInfo, null, 2))
      
      // 生成ZIP
      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const link = document.createElement('a')
      link.download = `${project.name}_frames.zip`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
      alert('帧序列导出成功！')
    } catch (error) {
      console.error('ZIP导出失败:', error)
      alert('ZIP导出失败: ' + error.message)
    }
  }
  
  // 导出项目ZIP（包含所有资源）
  const exportProjectZIP = async () => {
    try {
      const zip = new JSZip()
      
      // 添加项目JSON
      zip.file('project.json', JSON.stringify(project, null, 2))
      
      // 添加场景图片
      for (const track of project.tracks) {
        for (const scene of track.scene || []) {
          if (scene.sceneData?.imageUrl) {
            try {
              const response = await fetch(scene.sceneData.imageUrl)
              const blob = await response.blob()
              zip.file(`scenes/${scene.id}.png`, blob)
            } catch (e) {
              console.warn('无法下载场景图片:', e)
            }
          }
        }
      }
      
      // 生成ZIP
      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const link = document.createElement('a')
      link.download = `${project.name}.mmdproject.zip`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
      alert('项目导出成功！')
    } catch (error) {
      console.error('项目导出失败:', error)
      alert('项目导出失败: ' + error.message)
    }
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
  
  // 处理项目向导完成
  const handleProjectWizardComplete = (wizardData) => {
    const newProject = {
      ...project,
      name: wizardData.name,
      duration: wizardData.duration,
      backgroundImage: wizardData.backgroundType === 'image' ? wizardData.backgroundImage : null
    }
    
    // 根据背景类型创建对应的场景轨道
    if (wizardData.backgroundType === 'image' && wizardData.backgroundImage) {
      // 创建图片背景场景轨道
      const sceneTrack = createTrack(null, 'scene')
      sceneTrack.clips = [{
        ...createClip('scene', 0, wizardData.duration),
        data: {
          name: '背景图片',
          sceneId: 'bg_image',
          sceneData: {
            imageUrl: wizardData.backgroundImage,
            type: 'image'
          }
        }
      }]
      newProject.tracks = [sceneTrack, ...newProject.tracks]
    } else if (wizardData.backgroundType === 'ar' && wizardData.arBackground) {
      // 创建AR背景场景轨道
      const sceneTrack = createTrack(null, 'scene')
      
      // 判断AR场景类型
      const arType = wizardData.arBackground.type || wizardData.arBackground.backgroundType || 'ar'
      const isArcjpack = arType === 'arcjpack'
      const isRealAR = arType === 'real-ar' || arType === 'true-ar' || arType === 'webxr-ar'
      const isWebXR = arType === 'webxr-ar'
      
      // 获取场景数据
      const sceneData = wizardData.arBackground.data || wizardData.arBackground
      
      sceneTrack.clips = [{
        ...createClip('scene', 0, wizardData.duration),
        data: {
          name: wizardData.arBackground.name,
          sceneId: wizardData.arBackground.id,
          sceneData: isArcjpack ? {
            // arcjpack 类型直接使用 data 中的数据
            ...sceneData,
            type: 'arcjpack'
          } : {
            type: arType,
            arData: wizardData.arBackground,
            thumbnail: wizardData.arBackground.thumbnail || sceneData.image,
            // 真实AR场景特有数据
            image: isRealAR ? (sceneData.image || wizardData.arBackground.image) : null,
            planes: isRealAR ? (sceneData.planes || wizardData.arBackground.planes) : null,
            camera: isRealAR ? (sceneData.camera || wizardData.arBackground.camera) : null,
            referenceDistance: wizardData.arBackground.referenceDistance || 3,
            // WebXR特有数据
            webxrData: isWebXR ? (sceneData.webxrData || wizardData.arBackground.webxrData) : null
          }
        }
      }]
      newProject.tracks = [sceneTrack, ...newProject.tracks]
    } else if (wizardData.backgroundType === 'color') {
      // 创建纯色背景场景轨道
      const sceneTrack = createTrack(null, 'scene')
      sceneTrack.clips = [{
        ...createClip('scene', 0, wizardData.duration),
        data: {
          name: '纯色背景',
          sceneId: 'bg_color',
          sceneData: {
            color: wizardData.backgroundColor,
            type: 'color'
          }
        }
      }]
      newProject.tracks = [sceneTrack, ...newProject.tracks]
    }
    
    setProject(newProject)
    setCanvasSettings(wizardData.canvasSettings)
    setShowProjectWizard(false)
    
    // 保存到历史
    saveToHistory(newProject)
    
    // AR背景时自动打开角色选择
    if (wizardData.backgroundType === 'ar' && wizardData.arBackground) {
      setTimeout(() => {
        setShowCharacterModal(true)
      }, 300)
    }
  }
  
  // 处理项目导入
  const handleProjectImport = async (file) => {
    try {
      const importedProject = await importProject(file)
      setProject(importedProject)
      setCanvasSettings(importedProject.canvasSettings || canvasSettings)
      setShowProjectWizard(false)
      alert('项目导入成功！')
    } catch (error) {
      console.error('项目导入失败:', error)
      alert('项目导入失败: ' + error.message)
    }
  }
  
  // 导出项目为 .ard 文件
  const handleExportProject = async () => {
    try {
      const blob = await exportProject(project)
      downloadFile(blob, `${project.name}.ard`)
      alert('项目导出成功！')
    } catch (error) {
      console.error('项目导出失败:', error)
      alert('项目导出失败: ' + error.message)
    }
  }
  
  return (
    <div className={styles.container}>
      {/* 项目向导 */}
      {showProjectWizard && (
        <ProjectWizard
          isOpen={showProjectWizard}
          onComplete={handleProjectWizardComplete}
          onCancel={() => setShowProjectWizard(false)}
          onImport={handleProjectImport}
          onOpenARRecorder={() => {
            setShowProjectWizard(false)
            setShowARRecorder(true)
          }}
          onOpenSceneManager={() => {
            setShowProjectWizard(false)
            setShowSceneManager(true)
          }}
        />
      )}
      
      {/* 顶部工具栏 - 简化版 */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button 
            className={styles.backBtn}
            onClick={() => navigate('/ar-director')}
            title="返回"
          >
            ←
          </button>
          <div className={styles.projectInfo}>
            <h1 className={styles.title}>{project.name}</h1>
            <span className={styles.projectMeta}>{canvasSettings.width}×{canvasSettings.height} | {project.duration}秒</span>
          </div>
        </div>
        
        <div className={styles.headerCenter}>
          {/* 快速添加按钮组 */}
          <div className={styles.quickAddGroup}>
            <button 
              className={styles.quickAddBtn} 
              onClick={() => setShowCharacterModal(true)}
              title="添加角色"
            >
              🎭 <span>角色</span>
            </button>
            <button 
              className={styles.quickAddBtn} 
              onClick={() => setShowTrackTypeModal(true)}
              title="添加轨道"
            >
              ➕ <span>轨道</span>
            </button>
          </div>
        </div>
        
        <div className={styles.headerRight}>
          <button className={styles.iconBtn} onClick={undo} title="撤销 (Ctrl+Z)" disabled={historyIndex <= 0}>
            ↩️
          </button>
          <button className={styles.iconBtn} onClick={redo} title="重做 (Ctrl+Shift+Z)" disabled={historyIndex >= history.length - 1}>
            ↪️
          </button>
          <div className={styles.divider} />
          <button className={styles.iconBtn} onClick={saveProject} title="保存 (Ctrl+S)">
            💾
          </button>
          <button 
            className={`${styles.iconBtn} ${styles.exportBtn}`} 
            onClick={handleExportProject}
            title="导出项目 (.ard)"
          >
            📤
          </button>
        </div>
      </header>
      
      {/* 移动端预览按钮 */}
      {isMobile && (
        <div className={styles.mobilePreviewBtnContainer}>
          <button 
            className={styles.mobilePreviewBtn}
            onClick={() => {
              setShowPreviewModal(true)
              setPreviewOpen(true)
            }}
          >
            <span>👁️</span>
            <span>打开预览</span>
          </button>
        </div>
      )}
      
      {/* 预览区域 - 在时间轴上方 - 桌面端显示，移动端隐藏 */}
      <div className={`${styles.previewArea} ${isMobile ? styles.hidden : ''}`}>
        {!previewOpen ? (
          <div className={styles.previewPlaceholder}>
            <button 
              className={styles.showPreviewBtn}
              onClick={() => setPreviewOpen(true)}
            >
              <span className={styles.previewIcon}>👁️</span>
              <span>点击预览</span>
            </button>
          </div>
        ) : (
          <div className={styles.dualPreviewContainer}>
            {/* 舞台画面预览 */}
            <div 
              className={styles.stagePreviewContainer}
              style={{ 
                flex: hasCameraTrack ? '1' : 'none',
                width: hasCameraTrack ? 'auto' : '100%'
              }}
            >
              <div className={styles.previewHeader}>
                <div className={styles.previewTitle}>
                  <span>🎬 舞台画面</span>
                  <span className={styles.canvasResolution}>
                    {canvasSettings.width}×{canvasSettings.height}
                  </span>
                </div>
                <div className={styles.previewControls}>
                  {/* 画布设置按钮 */}
                  <button 
                    className={styles.settingsBtn}
                    onClick={() => setShowCanvasSettings(true)}
                    title="画布设置"
                  >
                    ⚙️ 画布
                  </button>
                  
                  {/* 摄像机缩放控制 - 调整视角远近 */}
                  <div className={styles.zoomControls}>
                    <span className={styles.zoomLabel}>视角:</span>
                    <button 
                      className={styles.zoomBtn}
                      onClick={() => setCameraZoom(Math.max(0.1, cameraZoom - 0.1))}
                      title="拉远视角"
                    >
                      🎥➖
                    </button>
                    <span className={styles.zoomValue}>{cameraZoom.toFixed(1)}x</span>
                    <button 
                      className={styles.zoomBtn}
                      onClick={() => setCameraZoom(Math.min(3, cameraZoom + 0.1))}
                      title="拉近视角"
                    >
                      🎥➕
                    </button>
                  </div>
                  
                  {/* 角色缩放控制 - 调整人物模型大小 */}
                  <div className={styles.zoomControls}>
                    <span className={styles.zoomLabel}>人物:</span>
                    <button 
                      className={styles.zoomBtn}
                      onClick={() => setCharacterScale(Math.max(0.5, characterScale - 0.1))}
                      title="缩小人物模型"
                    >
                      👤➖
                    </button>
                    <span className={styles.zoomValue}>{characterScale.toFixed(1)}x</span>
                    <button 
                      className={styles.zoomBtn}
                      onClick={() => setCharacterScale(Math.min(5, characterScale + 0.1))}
                      title="放大人物模型"
                    >
                      👤➕
                    </button>
                  </div>
                  
                  <div className={styles.controlDivider} />
                  
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
                      cleanup()
                      rendererRef.current = null
                      sceneRef.current = null
                      cameraRef.current = null
                      characterManagerRef.current = null
                    }}
                    title="退出预览"
                  >
                    ✕ 退出
                  </button>
                </div>
              </div>
              <div className={styles.canvasWrapper}>
                <canvas 
                  ref={canvasRef} 
                  className={`${styles.previewCanvas} ${coordinatePickerMode ? styles.pickerMode : ''}`}
                  onClick={coordinatePickerMode ? handleCanvasClickForCoordinate : undefined}
                />
                
                {/* 坐标选择模式覆盖层 */}
                {coordinatePickerMode && (
                  <div className={styles.coordinatePickerOverlay}>
                    <div className={styles.pickerInfo}>
                      <span className={styles.pickerTitle}>
                        {coordinatePickerMode === 'position' ? '📷 选择摄像机位置' : '🎯 选择目标点'}
                      </span>
                      <span className={styles.pickerCoords}>
                        X: {(pickerPreviewPosition?.x ?? 0).toFixed(1)} Y: {(pickerPreviewPosition?.y ?? 0).toFixed(1)} Z: {(pickerPreviewPosition?.z ?? 0).toFixed(1)}
                      </span>
                    </div>
                    <div className={styles.pickerActions}>
                      <button 
                        className={styles.pickerConfirmBtn}
                        onClick={() => {
                          if (coordinatePickerCallbackRef.current) {
                            coordinatePickerCallbackRef.current(pickerPreviewPosition)
                          }
                          setCoordinatePickerMode(null)
                          coordinatePickerCallbackRef.current = null
                        }}
                      >
                        ✓ 确认选择
                      </button>
                      <button 
                        className={styles.pickerCancelBtn}
                        onClick={() => {
                          setCoordinatePickerMode(null)
                          coordinatePickerCallbackRef.current = null
                        }}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* 摄像机画面预览 - 只有添加了摄像机轨道才显示 */}
            {hasCameraTrack && (
              <div className={styles.cameraPreviewContainer}>
                <div className={styles.previewHeader}>
                  <div className={styles.previewTitle}>
                    <span>📷 摄像机画面</span>
                  </div>
                </div>
                <div className={styles.canvasWrapper}>
                  <canvas 
                    ref={cameraPreviewRef}
                    className={styles.previewCanvas}
                  />
                </div>
              </div>
            )}
            
            {/* 导出进度条 */}
            {isExporting && (
              <div className={styles.exportProgressOverlay}>
                <div className={styles.exportProgressBox}>
                  <div className={styles.exportProgressTitle}>🎬 {exportStage || '正在导出...'}</div>
                  <div className={styles.exportProgressBar}>
                    <div 
                      className={styles.exportProgressFill} 
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                  <div className={styles.exportProgressText}>{exportProgress}%</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 主工作区 - 左侧快捷操作 + 时间轴 */}
      <div className={styles.workspace}>
        {/* 左侧快捷操作栏 */}
        <QuickActions
          hasCharacters={project.characters.length > 0}
          onAction={(actionId) => {
            switch(actionId) {
              case 'character':
                setShowCharacterModal(true)
                break
              case 'action':
              case 'camera':
              case 'effect':
              case 'music':
              case 'prop':
              case 'position':
              case 'background':
                // 创建对应类型的轨道
                const trackType = actionId === 'background' ? 'scene' : actionId
                const trackName = {
                  action: '动作轨道',
                  camera: '摄像机轨道',
                  effect: '特效轨道',
                  music: '音乐轨道',
                  prop: '道具轨道',
                  position: '位置轨道',
                  scene: '场景轨道'
                }[trackType] || '新轨道'
                
                const newTrack = createTrack(trackType, trackName)
                setProject(prev => ({
                  ...prev,
                  tracks: [...prev.tracks, newTrack]
                }))
                break
              case 'ar':
                // 打开AR录制
                setShowARRecorder(true)
                break
            }
          }}
        />
        
        {/* 时间轴 */}
        <Timeline
          project={project}
          tracks={project.tracks}
          characters={project.characters}
          currentTime={currentTime}
          duration={project.duration}
          scale={timelineScale}
          onTimeChange={setCurrentTime}
          onAddCharacter={() => setShowCharacterModal(true)}
          onAddTrack={handleAddTrack}
          onAddCell={addCell}
          onEditCell={(trackId, trackType, cell) => {
            setEditingCell({ trackId, trackType, cell })
            setShowCellEditModal(true)
          }}
          onCellUpdate={updateCell}
          onDeleteCell={deleteCell}
          onDeleteCharacter={deleteCharacter}
          onDeleteTrack={deleteTrack}
          isPlaying={isPlaying}
          onPlayPause={togglePlay}
          onScaleChange={setTimelineScale}
        />
      </div>
      
      {/* 移动端预览弹窗 */}
      {showPreviewModal && isMobile && (
        <div className={styles.mobilePreviewModal}>
          <div className={styles.mobilePreviewHeader}>
            <span>🎬 3D 预览</span>
            <button 
              className={styles.closeMobilePreview}
              onClick={() => {
                setShowPreviewModal(false)
                setPreviewOpen(false)
                setIsPlaying(false)
                cleanup()
              }}
            >
              ✕
            </button>
          </div>
          <div className={styles.mobilePreviewContent}>
            <canvas 
              ref={canvasRef} 
              className={styles.mobilePreviewCanvas}
              onClick={coordinatePickerMode ? handleCanvasClickForCoordinate : undefined}
            />
            
            {/* 坐标选择模式覆盖层 */}
            {coordinatePickerMode && (
              <div className={styles.coordinatePickerOverlay}>
                <div className={styles.pickerInfo}>
                  <span className={styles.pickerTitle}>
                    {coordinatePickerMode === 'position' ? '📷 选择摄像机位置' : '🎯 选择目标点'}
                  </span>
                  <span className={styles.pickerCoords}>
                    X: {(pickerPreviewPosition?.x ?? 0).toFixed(1)} Y: {(pickerPreviewPosition?.y ?? 0).toFixed(1)} Z: {(pickerPreviewPosition?.z ?? 0).toFixed(1)}
                  </span>
                </div>
                <div className={styles.pickerActions}>
                  <button 
                    className={styles.pickerConfirmBtn}
                    onClick={() => {
                      if (coordinatePickerCallbackRef.current) {
                        coordinatePickerCallbackRef.current(pickerPreviewPosition)
                      }
                      setCoordinatePickerMode(null)
                      coordinatePickerCallbackRef.current = null
                    }}
                  >
                    ✓ 确认
                  </button>
                  <button 
                    className={styles.pickerCancelBtn}
                    onClick={() => {
                      setCoordinatePickerMode(null)
                      coordinatePickerCallbackRef.current = null
                    }}
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className={styles.mobilePreviewControls}>
            <button 
              className={styles.mobileControlBtn}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <span className={styles.mobileTimeDisplay}>
              {currentTime.toFixed(1)}s / {project.duration}s
            </span>
          </div>
        </div>
      )}
      
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
          trackType={editingCell?.trackType}
          clip={editingCell?.cell}
          onSave={(trackId, clipId, data) => {
            updateCell(trackId, clipId, data)
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
          onExport={handleExportMedia}
        />
      )}

      {/* 轨道类型选择弹窗 */}
      <TrackTypeSelectModal
        isOpen={showTrackTypeModal}
        onClose={() => {
          setShowTrackTypeModal(false)
          setSelectedCharacterForTrack(null)
        }}
        onSelect={handleAddTrack}
        characterName={selectedCharacterForTrack?.name}
      />

      {/* 画布设置弹窗 */}
      {showCanvasSettings && (
        <div className={styles.modalOverlay} onClick={() => setShowCanvasSettings(false)}>
          <div className={styles.canvasSettingsModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>🎨 画布设置</h3>
              <button className={styles.closeBtn} onClick={() => setShowCanvasSettings(false)}>✕</button>
            </div>
            <div className={styles.modalContent}>
              {/* 分辨率预设 */}
              <div className={styles.settingSection}>
                <label className={styles.settingLabel}>分辨率预设</label>
                <div className={styles.resolutionPresets}>
                  {[
                    { name: '480p', width: 854, height: 480 },
                    { name: '720p', width: 1280, height: 720 },
                    { name: '1080p', width: 1920, height: 1080 },
                    { name: '4K', width: 3840, height: 2160 },
                    { name: '手机竖屏', width: 1080, height: 1920 },
                    { name: '正方形', width: 1080, height: 1080 }
                  ].map(preset => (
                    <button
                      key={preset.name}
                      className={`${styles.resolutionBtn} ${canvasSettings.width === preset.width && canvasSettings.height === preset.height ? styles.active : ''}`}
                      onClick={() => setCanvasSettings({ ...canvasSettings, width: preset.width, height: preset.height })}
                    >
                      <span className={styles.resolutionName}>{preset.name}</span>
                      <span className={styles.resolutionValue}>{preset.width}×{preset.height}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 自定义分辨率 */}
              <div className={styles.settingSection}>
                <label className={styles.settingLabel}>自定义分辨率</label>
                <div className={styles.customResolution}>
                  <div className={styles.inputGroup}>
                    <label>宽度</label>
                    <input
                      type="number"
                      value={canvasSettings.width}
                      onChange={(e) => setCanvasSettings({ ...canvasSettings, width: parseInt(e.target.value) || 1920 })}
                      min="100"
                      max="7680"
                    />
                  </div>
                  <span className={styles.resolutionX}>×</span>
                  <div className={styles.inputGroup}>
                    <label>高度</label>
                    <input
                      type="number"
                      value={canvasSettings.height}
                      onChange={(e) => setCanvasSettings({ ...canvasSettings, height: parseInt(e.target.value) || 1080 })}
                      min="100"
                      max="4320"
                    />
                  </div>
                </div>
              </div>

              {/* 像素比 */}
              <div className={styles.settingSection}>
                <label className={styles.settingLabel}>像素比 (DPR)</label>
                <div className={styles.pixelRatioOptions}>
                  {[0.5, 1, 1.5, 2].map(ratio => (
                    <button
                      key={ratio}
                      className={`${styles.pixelRatioBtn} ${canvasSettings.pixelRatio === ratio ? styles.active : ''}`}
                      onClick={() => setCanvasSettings({ ...canvasSettings, pixelRatio: ratio })}
                    >
                      {ratio}x
                    </button>
                  ))}
                </div>
              </div>

              {/* 提示 */}
              <div className={styles.settingHint}>
                💡 提示：较高的分辨率会增加渲染时间和内存占用
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.confirmBtn} onClick={() => setShowCanvasSettings(false)}>
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AR场景录制弹窗 */}
      {showARRecorder && (
        <WebXRARSceneRecorder
          isOpen={showARRecorder}
          onClose={() => setShowARRecorder(false)}
          onSceneRecorded={(sceneData) => {
            setARSceneData(sceneData)
            // 将WebXR场景数据关联到项目
            console.log('WebXR场景录制完成:', sceneData)
            // 可以在这里自动添加到场景列表
          }}
        />
      )}

      {/* 手机场景录制弹窗 */}
      {showMobileRecorder && (
        <ARSceneCameraRecorder
          isOpen={showMobileRecorder}
          onClose={() => setShowMobileRecorder(false)}
          onSceneRecorded={(sceneData) => {
            console.log('手机场景录制完成:', sceneData)
            // 自动创建场景轨道
            const sceneTrack = createTrack(null, 'scene')
            sceneTrack.clips = [{
              ...createClip('scene', 0, project.duration),
              data: {
                name: sceneData.name,
                sceneId: `arcamera_${Date.now()}`,
                sceneData: {
                  type: 'ar-camera',
                  image: sceneData.image,
                  planes: sceneData.planes,
                  camera: sceneData.camera
                }
              }
            }]
            setProject(prev => ({
              ...prev,
              tracks: [sceneTrack, ...prev.tracks]
            }))
            setShowMobileRecorder(false)
            alert('场景已添加到时间轴！')
          }}
        />
      )}

      {/* WebXR AR播放器 */}
      {showWebXRPlayer && (
        <WebXRARPlayer
          isOpen={showWebXRPlayer}
          onClose={() => setShowWebXRPlayer(false)}
          sceneData={webXRSceneData}
          project={project}
          currentTime={currentTime}
          isPlaying={isPlaying}
        />
      )}

      {/* 场景管理弹窗 */}
      {showSceneManager && (
        <SceneManagerModal
          onSelect={(scene) => {
            // 处理选择的场景 - 添加到时间轴
            console.log('选择场景:', scene)
            
            // 创建场景轨道
            const sceneTrack = createTrack(null, 'scene')
            sceneTrack.clips = [{
              ...createClip('scene', 0, project.duration),
              data: {
                name: scene.name,
                sceneId: scene.id || `scene_${Date.now()}`,
                sceneData: scene.data || scene
              }
            }]
            
            setProject(prev => ({
              ...prev,
              tracks: [sceneTrack, ...prev.tracks]
            }))
            
            setShowSceneManager(false)
            alert('场景已添加到时间轴！')
          }}
          onClose={() => setShowSceneManager(false)}
        />
      )}
    </div>
  )
}

export default ARMMDDirector
