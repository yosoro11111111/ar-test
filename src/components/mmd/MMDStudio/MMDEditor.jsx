import React, { useState, useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import styles from './MMDEditor.module.css'

// 轨道类型
const TRACK_TYPES = {
  ACTION: 'action',
  POSITION: 'position',
  EXPRESSION: 'expression'
}

// 创建轨道
const createTrack = (characterId, type) => {
  const id = `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const names = {
    [TRACK_TYPES.ACTION]: '动作',
    [TRACK_TYPES.POSITION]: '位置',
    [TRACK_TYPES.EXPRESSION]: '表情'
  }
  return {
    id,
    characterId,
    type,
    name: names[type] || type,
    clips: []
  }
}

// 创建片段
const createClip = (trackType, data) => {
  const id = `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const defaults = {
    [TRACK_TYPES.ACTION]: { duration: 5, actionName: '待机' },
    [TRACK_TYPES.POSITION]: { duration: 3, x: 0, y: 0, z: 0 },
    [TRACK_TYPES.EXPRESSION]: { duration: 2, expression: '正常' }
  }
  return {
    id,
    startTime: 0,
    ...defaults[trackType],
    ...data
  }
}

export function MMDEditor() {
  // ============ 项目状态 ============
  const [project, setProject] = useState({
    id: `project_${Date.now()}`,
    name: '新项目',
    duration: 120,
    characters: [],
    tracks: []
  })
  
  // ============ 播放状态 ============
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [timelineScale, setTimelineScale] = useState(1)
  
  // ============ 选中状态 ============
  const [selectedCharacterId, setSelectedCharacterId] = useState(null)
  const [selectedTrackId, setSelectedTrackId] = useState(null)
  const [selectedClipId, setSelectedClipId] = useState(null)
  const [expandedCharacters, setExpandedCharacters] = useState(new Set())
  
  // ============ Three.js ============
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const characterModelsRef = useRef(new Map())
  const animationFrameRef = useRef(null)
  
  // ============ 初始化Three.js ============
  useEffect(() => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const container = canvas.parentElement
    const rect = container.getBoundingClientRect()
    
    // 场景
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0f)
    sceneRef.current = scene
    
    // 相机
    const camera = new THREE.PerspectiveCamera(50, rect.width / rect.height, 0.1, 1000)
    camera.position.set(0, 1.5, 5)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera
    
    // 渲染器
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setSize(rect.width, rect.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
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
    
    // 动画循环
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()
    
    // 强制重置canvas样式
    canvas.style.position = 'relative'
    canvas.style.top = 'auto'
    canvas.style.left = 'auto'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      renderer.dispose()
    }
  }, [])
  
  // ============ 播放控制 ============
  useEffect(() => {
    if (isPlaying) {
      const startTime = performance.now() - currentTime * 1000
      const playLoop = () => {
        const elapsed = (performance.now() - startTime) / 1000
        if (elapsed >= project.duration) {
          setIsPlaying(false)
          setCurrentTime(0)
        } else {
          setCurrentTime(elapsed)
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
  }, [isPlaying, project.duration])
  
  // ============ 角色管理 ============
  const addCharacter = useCallback(() => {
    const id = `char_${Date.now()}`
    const newChar = {
      id,
      name: `角色 ${project.characters.length + 1}`,
      model: null,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 1
    }
    setProject(prev => ({
      ...prev,
      characters: [...prev.characters, newChar]
    }))
    setSelectedCharacterId(id)
    setExpandedCharacters(prev => new Set([...prev, id]))
  }, [project.characters.length])
  
  const deleteCharacter = useCallback((charId) => {
    setProject(prev => ({
      ...prev,
      characters: prev.characters.filter(c => c.id !== charId),
      tracks: prev.tracks.filter(t => t.characterId !== charId)
    }))
    if (selectedCharacterId === charId) {
      setSelectedCharacterId(null)
    }
  }, [selectedCharacterId])
  
  const updateCharacter = useCallback((charId, updates) => {
    setProject(prev => ({
      ...prev,
      characters: prev.characters.map(c =>
        c.id === charId ? { ...c, ...updates } : c
      )
    }))
  }, [])
  
  // ============ 轨道管理 ============
  const addTrack = useCallback((charId, type) => {
    const track = createTrack(charId, type)
    setProject(prev => ({
      ...prev,
      tracks: [...prev.tracks, track]
    }))
  }, [])
  
  const addClip = useCallback((trackId, data) => {
    const track = project.tracks.find(t => t.id === trackId)
    if (!track) return
    
    const clip = createClip(track.type, data)
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t =>
        t.id === trackId
          ? { ...t, clips: [...t.clips, clip] }
          : t
      )
    }))
  }, [project.tracks])
  
  // ============ 渲染 ============
  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <div className={styles.viewport}>
          <canvas ref={canvasRef} className={styles.canvas} />
        </div>
        <div className={styles.timeline}>
          Timeline
        </div>
      </div>
    </div>
  )
}