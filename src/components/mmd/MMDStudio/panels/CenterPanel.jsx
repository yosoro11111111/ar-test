import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'
import styles from './CenterPanel.module.css'

export function CenterPanel({ 
  project, 
  currentTime, 
  selectedObject, 
  onSelectObject 
}) {
  const canvasRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)

  // 初始化Three.js
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
    const camera = new THREE.PerspectiveCamera(
      50,
      rect.width / rect.height,
      0.1,
      1000
    )
    camera.position.set(0, 1.5, 5)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // 渲染器
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false
    })
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

    // 强制设置canvas样式
    canvas.style.position = 'relative'
    canvas.style.width = '100%'
    canvas.style.height = '100%'

    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    // 处理窗口大小变化
    const handleResize = () => {
      const newRect = container.getBoundingClientRect()
      camera.aspect = newRect.width / newRect.height
      camera.updateProjectionMatrix()
      renderer.setSize(newRect.width, newRect.height)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
    }
  }, [])

  return (
    <div className={styles.container}>
      {/* 工具栏 */}
      <div className={styles.toolbar}>
        <div className={styles.toolGroup}>
          <button className={styles.toolBtn}>🖱️ 选择</button>
          <button className={styles.toolBtn}>✋ 平移</button>
          <button className={styles.toolBtn}>🔍 缩放</button>
        </div>
        <div className={styles.viewInfo}>
          {project.settings.resolution.width} × {project.settings.resolution.height}
        </div>
      </div>

      {/* 预览画布 */}
      <div className={styles.canvasContainer}>
        <canvas ref={canvasRef} className={styles.canvas} />
        
        {/* 覆盖层信息 */}
        <div className={styles.overlay}>
          <div className={styles.timeInfo}>
            {formatTime(currentTime)} / {formatTime(project.duration)}
          </div>
          <div className={styles.objectInfo}>
            {selectedObject ? `选中: ${selectedObject.name}` : '未选择对象'}
          </div>
        </div>
      </div>

      {/* 底部工具 */}
      <div className={styles.bottomBar}>
        <div className={styles.viewModes}>
          <button className={styles.viewBtn}>透视</button>
          <button className={styles.viewBtn}>正交</button>
          <button className={styles.viewBtn}>摄像机</button>
        </div>
        <div className={styles.gridToggle}>
          <label>
            <input type="checkbox" defaultChecked />
            显示网格
          </label>
        </div>
      </div>
    </div>
  )
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const frames = Math.floor((seconds % 1) * 30)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
}
