import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import styles from './AIDirectorPage.module.css'
import { MultiCharacterManager } from './MultiCharacterManager.js'
import { loadVRMAAction } from '../../data/vrmaActions.js'
import { actions as vrmaActions } from '../../data/actions250.js'

/**
 * AI Director 页面
 * 智能导演模式：AI自动生成场景、角色动作和镜头
 */
export function AIDirectorPage() {
  const navigate = useNavigate()
  
  // Three.js相关
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const characterManagerRef = useRef(null)
  
  // AI生成状态
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState('')
  const [generationProgress, setGenerationProgress] = useState(0)
  
  // 场景描述输入
  const [scenePrompt, setScenePrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('casual')
  const [characterCount, setCharacterCount] = useState(1)
  const [duration, setDuration] = useState(15)
  
  // 生成的场景数据
  const [generatedScene, setGeneratedScene] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // 初始化
  useEffect(() => {
    console.log('🤖 [AIDirector] 组件挂载')
    initThreeJS()
    
    return () => {
      console.log('🧹 [AIDirector] 组件卸载')
      cleanup()
    }
  }, [])

  const initThreeJS = () => {
    console.log('🎨 [AIDirector] 初始化Three.js')
    if (!canvasRef.current) {
      console.error('❌ [AIDirector] canvasRef.current 为null')
      return
    }
    
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    sceneRef.current = scene
    
    const camera = new THREE.PerspectiveCamera(
      60,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      100
    )
    camera.position.set(0, 1.6, 0)
    cameraRef.current = camera
    
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    })
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight)
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
    
    // 角色管理器
    characterManagerRef.current = new MultiCharacterManager(scene)
    
    // 开始渲染循环
    startRenderLoop()
    console.log('✅ [AIDirector] Three.js初始化完成')
  }

  const startRenderLoop = () => {
    const loop = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return
      
      if (characterManagerRef.current) {
        characterManagerRef.current.update(0.016)
      }
      
      rendererRef.current.render(sceneRef.current, cameraRef.current)
      requestAnimationFrame(loop)
    }
    loop()
  }

  // AI生成场景
  const generateScene = async () => {
    console.log('🤖 [AIDirector] 开始AI生成场景')
    console.log('🤖 [AIDirector] 场景描述:', scenePrompt)
    console.log('🤖 [AIDirector] 风格:', selectedStyle)
    console.log('🤖 [AIDirector] 角色数:', characterCount)
    console.log('🤖 [AIDirector] 时长:', duration, '秒')
    
    setIsGenerating(true)
    setGenerationProgress(0)
    
    try {
      // Step 1: 分析场景描述
      setGenerationStep('正在分析场景描述...')
      await simulateDelay(1000)
      setGenerationProgress(10)
      
      // Step 2: 生成环境
      setGenerationStep('正在生成3D环境...')
      await generateEnvironment()
      setGenerationProgress(30)
      
      // Step 3: 生成角色
      setGenerationStep('正在创建角色...')
      await generateCharacters()
      setGenerationProgress(50)
      
      // Step 4: 生成动作序列
      setGenerationStep('正在编排动作...')
      await generateActions()
      setGenerationProgress(70)
      
      // Step 5: 生成镜头运动
      setGenerationStep('正在设计镜头...')
      await generateCameraMovement()
      setGenerationProgress(90)
      
      // Step 6: 完成
      setGenerationStep('生成完成！')
      setGenerationProgress(100)
      
      console.log('✅ [AIDirector] AI生成完成')
      
      // 保存生成的场景
      const sceneData = {
        id: `ai_scene_${Date.now()}`,
        prompt: scenePrompt,
        style: selectedStyle,
        duration,
        createdAt: new Date().toISOString()
      }
      setGeneratedScene(sceneData)
      
      // 保存到localStorage
      const aiScenes = JSON.parse(localStorage.getItem('ar-director-ai-scenes') || '[]')
      aiScenes.push(sceneData)
      localStorage.setItem('ar-director-ai-scenes', JSON.stringify(aiScenes))
      
    } catch (error) {
      console.error('❌ [AIDirector] 生成失败:', error)
      alert('生成失败: ' + error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  // 生成环境
  const generateEnvironment = async () => {
    console.log('🎯 [AIDirector] 生成环境')
    
    // 根据描述生成不同的环境
    const environments = {
      casual: [
        { id: 'floor', type: 'floor', name: '地面', position: { x: 0, y: 0, z: 0 }, size: { width: 10, height: 10 }, color: '#4a90d9' }
      ],
      stage: [
        { id: 'stage', type: 'floor', name: '舞台', position: { x: 0, y: 0.5, z: 0 }, size: { width: 6, height: 4 }, color: '#8b4513' },
        { id: 'floor', type: 'floor', name: '地面', position: { x: 0, y: 0, z: 0 }, size: { width: 12, height: 8 }, color: '#333333' }
      ],
      street: [
        { id: 'sidewalk', type: 'floor', name: '人行道', position: { x: 0, y: 0.1, z: 0 }, size: { width: 4, height: 10 }, color: '#808080' },
        { id: 'road', type: 'floor', name: '马路', position: { x: 0, y: 0, z: 0 }, size: { width: 10, height: 10 }, color: '#2c2c2c' }
      ]
    }
    
    const selectedEnv = environments[selectedStyle] || environments.casual
    
    // 在场景中创建平面
    selectedEnv.forEach(plane => {
      const geometry = new THREE.PlaneGeometry(plane.size.width, plane.size.height)
      const material = new THREE.MeshBasicMaterial({
        color: plane.color,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      })
      
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(plane.position.x, plane.position.y, plane.position.z)
      mesh.rotation.x = -Math.PI / 2
      
      const edges = new THREE.EdgesGeometry(geometry)
      const lineMaterial = new THREE.LineBasicMaterial({ color: plane.color, linewidth: 2 })
      const wireframe = new THREE.LineSegments(edges, lineMaterial)
      mesh.add(wireframe)
      
      sceneRef.current.add(mesh)
    })
    
    await simulateDelay(500)
  }

  // 生成角色
  const generateCharacters = async () => {
    console.log('👥 [AIDirector] 生成', characterCount, '个角色')
    
    // 使用默认VRM模型（实际应用中可以随机选择或根据描述选择）
    const defaultVRM = '/models/default.vrm'
    
    for (let i = 0; i < characterCount; i++) {
      const position = {
        x: (i - (characterCount - 1) / 2) * 2,
        y: 0.01,
        z: -2
      }
      
      try {
        const characterId = await characterManagerRef.current.addCharacter(defaultVRM, {
          name: `角色${i + 1}`,
          position,
          scale: 1
        })
        
        console.log(`👤 [AIDirector] 角色${i + 1}创建成功:`, characterId)
      } catch (error) {
        console.warn(`⚠️ [AIDirector] 角色${i + 1}创建失败:`, error)
        // 创建占位符
        createPlaceholderCharacter(position, i)
      }
    }
    
    await simulateDelay(800)
  }

  // 创建占位符角色（当VRM加载失败时）
  const createPlaceholderCharacter = (position, index) => {
    const geometry = new THREE.CapsuleGeometry(0.3, 1.5, 4, 8)
    const material = new THREE.MeshBasicMaterial({ color: 0x667eea })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(position.x, position.y + 0.9, position.z)
    sceneRef.current.add(mesh)
  }

  // 生成动作
  const generateActions = async () => {
    console.log('🎬 [AIDirector] 生成动作序列')
    
    const characters = characterManagerRef.current.getAllCharacters()
    
    // 为每个角色随机分配动作
    characters.forEach((character, index) => {
      // 随机选择动作
      const randomActions = vrmaActions
        .filter(a => a.category === 'dance' || a.category === 'idle')
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
      
      console.log(`🎬 [AIDirector] 角色${index + 1}动作:`, randomActions.map(a => a.name).join(', '))
      
      // 播放第一个动作
      if (randomActions.length > 0) {
        const action = randomActions[0]
        loadVRMAAction(action.filePath, character.vrm).then(result => {
          if (result?.clip) {
            characterManagerRef.current.playCharacterAction(character.id, result.clip, {
              loop: true,
              transitionDuration: 0.3
            })
          }
        })
      }
    })
    
    await simulateDelay(1000)
  }

  // 生成镜头运动
  const generateCameraMovement = async () => {
    console.log('📷 [AIDirector] 生成镜头运动')
    
    // 简单的镜头运动示例
    const cameraPositions = [
      { x: 0, y: 1.6, z: 0 },
      { x: 3, y: 2, z: 3 },
      { x: -3, y: 2, z: 3 },
      { x: 0, y: 3, z: 5 }
    ]
    
    console.log('📷 [AIDirector] 镜头位置:', cameraPositions.length, '个')
    
    await simulateDelay(500)
  }

  // 模拟延迟
  const simulateDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  // 预览场景
  const previewScene = () => {
    setIsPlaying(!isPlaying)
    console.log(isPlaying ? '⏸️ [AIDirector] 暂停预览' : '▶️ [AIDirector] 开始预览')
  }

  // 导出到时间轴编辑器
  const exportToEditor = () => {
    if (!generatedScene) return
    
    console.log('🚀 [AIDirector] 导出到时间轴编辑器:', generatedScene.id)
    navigate(`/ar-director/edit/${generatedScene.id}`)
  }

  // 重新生成
  const regenerate = () => {
    console.log('🔄 [AIDirector] 重新生成')
    setGeneratedScene(null)
    setGenerationProgress(0)
    
    // 清理场景
    if (sceneRef.current) {
      // 移除所有子对象（保留灯光和网格）
      const objectsToRemove = []
      sceneRef.current.traverse((child) => {
        if (child.isMesh && child.geometry.type !== 'GridHelper') {
          objectsToRemove.push(child)
        }
      })
      objectsToRemove.forEach(obj => sceneRef.current.remove(obj))
    }
    
    // 清理角色
    if (characterManagerRef.current) {
      characterManagerRef.current.dispose()
      characterManagerRef.current = new MultiCharacterManager(sceneRef.current)
    }
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
      {/* 顶部导航 */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/ar-director')}>
          ← 返回
        </button>
        <h1 className={styles.title}>🤖 AI Director</h1>
        <div className={styles.headerInfo}>智能导演模式</div>
      </header>

      {/* 主内容 */}
      <main className={styles.main}>
        {/* 左侧控制面板 */}
        <aside className={styles.controlPanel}>
          {!generatedScene ? (
            <>
              <h2>描述你的场景</h2>
              
              {/* 场景描述输入 */}
              <div className={styles.inputGroup}>
                <label>场景描述</label>
                <textarea
                  value={scenePrompt}
                  onChange={(e) => setScenePrompt(e.target.value)}
                  placeholder="例如：一群年轻人在城市街头跳舞..."
                  rows={4}
                  disabled={isGenerating}
                />
              </div>

              {/* 风格选择 */}
              <div className={styles.inputGroup}>
                <label>场景风格</label>
                <div className={styles.styleOptions}>
                  {[
                    { id: 'casual', name: '休闲', icon: '🏠' },
                    { id: 'stage', name: '舞台', icon: '🎭' },
                    { id: 'street', name: '街头', icon: '🌆' },
                    { id: 'nature', name: '自然', icon: '🌲' }
                  ].map(style => (
                    <button
                      key={style.id}
                      className={`${styles.styleBtn} ${selectedStyle === style.id ? styles.active : ''}`}
                      onClick={() => setSelectedStyle(style.id)}
                      disabled={isGenerating}
                    >
                      <span>{style.icon}</span>
                      <span>{style.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 角色数量 */}
              <div className={styles.inputGroup}>
                <label>角色数量</label>
                <div className={styles.numberSelector}>
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      className={`${styles.numberBtn} ${characterCount === num ? styles.active : ''}`}
                      onClick={() => setCharacterCount(num)}
                      disabled={isGenerating}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* 时长 */}
              <div className={styles.inputGroup}>
                <label>视频时长</label>
                <select 
                  value={duration} 
                  onChange={(e) => setDuration(Number(e.target.value))}
                  disabled={isGenerating}
                >
                  <option value={10}>10秒</option>
                  <option value={15}>15秒</option>
                  <option value={30}>30秒</option>
                  <option value={60}>60秒</option>
                </select>
              </div>

              {/* 生成按钮 */}
              <button 
                className={styles.generateBtn}
                onClick={generateScene}
                disabled={isGenerating || !scenePrompt.trim()}
              >
                {isGenerating ? (
                  <>
                    <span className={styles.spinner}></span>
                    <span>生成中...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>AI生成场景</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <h2>生成完成！</h2>
              
              <div className={styles.sceneInfo}>
                <p><strong>场景描述:</strong> {generatedScene.prompt}</p>
                <p><strong>风格:</strong> {generatedScene.style}</p>
                <p><strong>时长:</strong> {generatedScene.duration}秒</p>
              </div>

              <div className={styles.actionButtons}>
                <button className={styles.previewBtn} onClick={previewScene}>
                  {isPlaying ? '⏸️ 暂停' : '▶️ 预览'}
                </button>
                <button className={styles.exportBtn} onClick={exportToEditor}>
                  🎬 导出到编辑器
                </button>
                <button className={styles.regenerateBtn} onClick={regenerate}>
                  🔄 重新生成
                </button>
              </div>
            </>
          )}
        </aside>

        {/* 右侧预览区 */}
        <div className={styles.previewSection}>
          <div className={styles.canvasContainer}>
            <canvas ref={canvasRef} className={styles.canvas} />
            
            {/* 生成进度覆盖层 */}
            {isGenerating && (
              <div className={styles.generationOverlay}>
                <div className={styles.generationProgress}>
                  <div className={styles.progressRing}>
                    <svg viewBox="0 0 100 100">
                      <circle className={styles.progressBg} cx="50" cy="50" r="45" />
                      <circle 
                        className={styles.progressFill}
                        cx="50" cy="50" r="45"
                        style={{
                          strokeDasharray: `${2 * Math.PI * 45}`,
                          strokeDashoffset: `${2 * Math.PI * 45 * (1 - generationProgress / 100)}`
                        }}
                      />
                    </svg>
                    <span className={styles.progressPercent}>{Math.round(generationProgress)}%</span>
                  </div>
                  <p className={styles.progressStep}>{generationStep}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default AIDirectorPage
