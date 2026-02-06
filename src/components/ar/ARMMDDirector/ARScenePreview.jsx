import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import styles from './ARScenePreview.module.css'

/**
 * AR场景预览组件
 * 
 * 功能：
 * 1. 在普通浏览器中预览WebXR录制的3D场景
 * 2. 显示所有检测到的平面
 * 3. 支持轨道控制器查看场景
 * 4. 可以放置MMD角色预览效果
 */

export function ARScenePreview({
  sceneData,
  width = 800,
  height = 600,
  showGrid = true,
  showPlanes = true,
  characters = [],
  onPlaneClick
}) {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const controlsRef = useRef(null)
  const planesGroupRef = useRef(null)
  const charactersGroupRef = useRef(null)
  const raycasterRef = useRef(new THREE.Raycaster())
  const mouseRef = useRef(new THREE.Vector2())
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPlane, setSelectedPlane] = useState(null)
  const [sceneInfo, setSceneInfo] = useState(null)

  // 初始化Three.js场景
  useEffect(() => {
    if (!containerRef.current || !sceneData) return

    try {
      setIsLoading(true)
      
      // 创建场景
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x1a1a2e)
      sceneRef.current = scene

      // 创建相机
      const camera = new THREE.PerspectiveCamera(
        60,
        width / height,
        0.1,
        1000
      )
      camera.position.set(5, 5, 5)
      camera.lookAt(0, 0, 0)
      cameraRef.current = camera

      // 创建渲染器
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(width, height)
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      containerRef.current.appendChild(renderer.domElement)
      rendererRef.current = renderer

      // 添加控制器
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.05
      controls.maxPolarAngle = Math.PI / 2 - 0.1 // 防止相机到地面以下
      controlsRef.current = controls

      // 添加灯光
      setupLighting(scene)

      // 添加网格
      if (showGrid) {
        const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
        scene.add(gridHelper)
      }

      // 创建平面组
      const planesGroup = new THREE.Group()
      planesGroup.name = 'planes'
      scene.add(planesGroup)
      planesGroupRef.current = planesGroup

      // 创建角色组
      const charactersGroup = new THREE.Group()
      charactersGroup.name = 'characters'
      scene.add(charactersGroup)
      charactersGroupRef.current = charactersGroup

      // 加载场景数据
      loadSceneData(sceneData)

      // 添加鼠标点击事件
      renderer.domElement.addEventListener('click', handleClick)

      // 开始渲染循环
      const animate = () => {
        requestAnimationFrame(animate)
        controls.update()
        renderer.render(scene, camera)
      }
      animate()

      setIsLoading(false)

      return () => {
        renderer.domElement.removeEventListener('click', handleClick)
        renderer.dispose()
        containerRef.current?.removeChild(renderer.domElement)
      }
    } catch (err) {
      console.error('初始化预览失败:', err)
      setError('初始化预览失败: ' + err.message)
      setIsLoading(false)
    }
  }, [sceneData, width, height])

  // 设置灯光
  const setupLighting = (scene) => {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    // 主方向光
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(10, 20, 10)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 2048
    dirLight.shadow.mapSize.height = 2048
    scene.add(dirLight)

    // 补光
    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3)
    fillLight.position.set(-10, 10, -10)
    scene.add(fillLight)
  }

  // 加载场景数据
  const loadSceneData = (data) => {
    if (!data || !planesGroupRef.current) return

    // 解析场景数据
    const planes = data.planes || []
    const bounds = data.sceneBounds || calculateBounds(planes)
    
    setSceneInfo({
      planeCount: planes.length,
      bounds: bounds,
      capturedAt: data.capturedAt,
      name: data.name || '未命名场景'
    })

    // 清除现有平面
    while (planesGroupRef.current.children.length > 0) {
      const child = planesGroupRef.current.children[0]
      child.geometry?.dispose()
      child.material?.dispose()
      planesGroupRef.current.remove(child)
    }

    // 创建平面
    if (showPlanes && planes.length > 0) {
      planes.forEach((planeData, index) => {
        createPlaneMesh(planeData, index)
      })

      // 调整相机位置以查看整个场景
      if (bounds && cameraRef.current && controlsRef.current) {
        const center = bounds.center || { x: 0, y: 0, z: 0 }
        const size = Math.max(
          bounds.size?.x || 5,
          bounds.size?.y || 5,
          bounds.size?.z || 5
        )
        
        cameraRef.current.position.set(
          center.x + size * 0.8,
          center.y + size * 0.8,
          center.z + size * 0.8
        )
        cameraRef.current.lookAt(center.x, center.y, center.z)
        controlsRef.current.target.set(center.x, center.y, center.z)
        controlsRef.current.update()
      }
    }
  }

  // 计算场景边界
  const calculateBounds = (planes) => {
    if (planes.length === 0) return null

    const xs = planes.map(p => p.position.x)
    const ys = planes.map(p => p.position.y)
    const zs = planes.map(p => p.position.z)

    return {
      min: { x: Math.min(...xs), y: Math.min(...ys), z: Math.min(...zs) },
      max: { x: Math.max(...xs), y: Math.max(...ys), z: Math.max(...zs) },
      center: {
        x: (Math.min(...xs) + Math.max(...xs)) / 2,
        y: (Math.min(...ys) + Math.max(...ys)) / 2,
        z: (Math.min(...zs) + Math.max(...zs)) / 2
      },
      size: {
        x: Math.max(...xs) - Math.min(...xs),
        y: Math.max(...ys) - Math.min(...ys),
        z: Math.max(...zs) - Math.min(...zs)
      }
    }
  }

  // 创建平面网格
  const createPlaneMesh = (planeData, index) => {
    const { position, rotation, size, id } = planeData
    
    const group = new THREE.Group()
    group.userData = { planeId: id, planeIndex: index, planeData }

    // 平面几何体
    const geometry = new THREE.PlaneGeometry(
      size?.width || 2,
      size?.height || 2
    )
    
    // 平面材质
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.4,
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
    group.add(mesh)

    // 边框
    const edges = new THREE.EdgesGeometry(geometry)
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x00ff88,
      linewidth: 2
    })
    const wireframe = new THREE.LineSegments(edges, lineMaterial)
    mesh.add(wireframe)

    // 序号标签
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
    sprite.position.set(position.x, position.y + 0.5, position.z)
    sprite.scale.set(0.6, 0.3, 1)
    group.add(sprite)

    // 选中状态的高亮框
    const highlightGeometry = new THREE.PlaneGeometry(
      (size?.width || 2) + 0.1,
      (size?.height || 2) + 0.1
    )
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    })
    const highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial)
    highlightMesh.position.copy(mesh.position)
    highlightMesh.rotation.copy(mesh.rotation)
    highlightMesh.position.y += 0.001 // 稍微抬高避免z-fighting
    highlightMesh.name = 'highlight'
    group.add(highlightMesh)

    planesGroupRef.current.add(group)
  }

  // 处理点击事件
  const handleClick = (event) => {
    if (!rendererRef.current || !cameraRef.current || !planesGroupRef.current) return

    const rect = rendererRef.current.domElement.getBoundingClientRect()
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
    
    const intersects = raycasterRef.current.intersectObjects(
      planesGroupRef.current.children,
      true
    )

    if (intersects.length > 0) {
      // 找到点击的平面组
      let target = intersects[0].object
      while (target.parent && target.parent !== planesGroupRef.current) {
        target = target.parent
      }

      const planeData = target.userData?.planeData
      const planeIndex = target.userData?.planeIndex

      if (planeData) {
        setSelectedPlane({ index: planeIndex, data: planeData })
        highlightPlane(target)
        
        if (onPlaneClick) {
          onPlaneClick(planeData, planeIndex)
        }
      }
    } else {
      setSelectedPlane(null)
      clearHighlight()
    }
  }

  // 高亮平面
  const highlightPlane = (planeGroup) => {
    clearHighlight()
    
    const highlight = planeGroup.getObjectByName('highlight')
    if (highlight) {
      highlight.material.opacity = 0.3
    }
  }

  // 清除高亮
  const clearHighlight = () => {
    if (!planesGroupRef.current) return
    
    planesGroupRef.current.children.forEach(group => {
      const highlight = group.getObjectByName('highlight')
      if (highlight) {
        highlight.material.opacity = 0
      }
    })
  }

  // 更新角色位置
  useEffect(() => {
    if (!charactersGroupRef.current || !sceneData?.planes) return

    // 清除现有角色
    while (charactersGroupRef.current.children.length > 0) {
      charactersGroupRef.current.remove(charactersGroupRef.current.children[0])
    }

    // 添加角色标记（简化版本，显示为立方体）
    characters.forEach((char, index) => {
      const plane = sceneData.planes[index % sceneData.planes.length]
      if (!plane) return

      const geometry = new THREE.BoxGeometry(0.3, 0.8, 0.3)
      const material = new THREE.MeshStandardMaterial({ 
        color: char.color || 0xff6b6b 
      })
      const mesh = new THREE.Mesh(geometry, material)
      
      mesh.position.set(
        plane.position.x,
        plane.position.y + 0.4,
        plane.position.z
      )
      mesh.castShadow = true
      
      // 添加角色名称标签
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = 256
      canvas.height = 64
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(char.name || `角色${index + 1}`, 128, 40)
      
      const texture = new THREE.CanvasTexture(canvas)
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture })
      const sprite = new THREE.Sprite(spriteMaterial)
      sprite.position.y = 0.8
      sprite.scale.set(1.2, 0.3, 1)
      mesh.add(sprite)
      
      charactersGroupRef.current.add(mesh)
    })
  }, [characters, sceneData])

  return (
    <div className={styles.previewContainer} style={{ width, height }}>
      {isLoading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>加载3D场景...</span>
        </div>
      )}
      
      {error && (
        <div className={styles.error}>
          <span>❌ {error}</span>
        </div>
      )}
      
      <div ref={containerRef} className={styles.canvasContainer} />
      
      {sceneInfo && (
        <div className={styles.info}>
          <h4>{sceneInfo.name}</h4>
          <p>平面数量: {sceneInfo.planeCount}</p>
          {sceneInfo.bounds && (
            <p>场景范围: {sceneInfo.bounds.size.x.toFixed(1)}m × {sceneInfo.bounds.size.z.toFixed(1)}m</p>
          )}
        </div>
      )}
      
      {selectedPlane && (
        <div className={styles.selectedInfo}>
          <h4>选中平面 #{selectedPlane.index + 1}</h4>
          <p>位置: ({selectedPlane.data.position.x.toFixed(2)}, {selectedPlane.data.position.y.toFixed(2)}, {selectedPlane.data.position.z.toFixed(2)})</p>
          <p>大小: {selectedPlane.data.size.width}m × {selectedPlane.data.size.height}m</p>
        </div>
      )}
      
      <div className={styles.controls}>
        <button 
          className={styles.controlBtn}
          onClick={() => {
            if (controlsRef.current) {
              controlsRef.current.reset()
            }
          }}
        >
          重置视角
        </button>
      </div>
    </div>
  )
}

export default ARScenePreview
