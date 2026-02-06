import React, { useState, useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import styles from './WebXRARSceneRecorder.module.css'
import JSZip from 'jszip'

/**
 * WebXR AR场景录制组件 - 修复版
 * 
 * 功能：
 * 1. 自动检测并记录所有地面平面
 * 2. 持续检测，不会停止
 * 3. 导出包含完整3D场景数据
 */

export function WebXRARSceneRecorder({
  isOpen,
  onClose,
  onSceneRecorded
}) {
  const canvasRef = useRef(null)
  const sessionRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const referenceSpaceRef = useRef(null)
  const hitTestSourceRef = useRef(null)
  const planesRef = useRef([])
  const detectedPlanesRef = useRef(new Map())
  const frameCountRef = useRef(0)
  const isAutoDetectingRef = useRef(false)
  const planeCountRef = useRef(0) // 使用ref跟踪平面数量
  
  const [isSupported, setIsSupported] = useState(false)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [planes, setPlanes] = useState([])
  const [sceneName, setSceneName] = useState('')
  const [error, setError] = useState(null)
  const [showInstructions, setShowInstructions] = useState(true)
  const [isAutoDetecting, setIsAutoDetecting] = useState(false)
  const [detectedCount, setDetectedCount] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')
  
  // 同步状态到ref
  useEffect(() => {
    isAutoDetectingRef.current = isAutoDetecting
  }, [isAutoDetecting])
  
  useEffect(() => {
    planeCountRef.current = planes.length
  }, [planes])

  // 检查WebXR支持
  useEffect(() => {
    const checkSupport = async () => {
      if (!('xr' in navigator)) {
        setError('您的浏览器不支持WebXR，请使用Chrome Android')
        return false
      }
      try {
        const supported = await navigator.xr.isSessionSupported('immersive-ar')
        setIsSupported(supported)
        if (!supported) {
          setError('您的设备不支持AR功能，需要支持ARCore的Android设备')
        }
        return supported
      } catch {
        setError('检查WebXR支持失败')
        return false
      }
    }
    if (isOpen) checkSupport()
  }, [isOpen])

  // 启动WebXR会话
  const startARSession = async () => {
    if (!canvasRef.current || !isSupported) return
    
    setError(null)
    setDebugInfo('正在启动AR...')
    
    try {
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'local-floor'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: document.getElementById('ar-overlay') }
      })
      
      sessionRef.current = session
      
      const gl = canvasRef.current.getContext('webgl2', { 
        xrCompatible: true, alpha: true, antialias: true 
      }) || canvasRef.current.getContext('webgl', { 
        xrCompatible: true, alpha: true, antialias: true 
      })
      
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        context: gl,
        alpha: true,
        antialias: true
      })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.xr.enabled = true
      renderer.shadowMap.enabled = true
      rendererRef.current = renderer
      
      const baseLayer = new XRWebGLLayer(session, gl)
      await session.updateRenderState({ 
        baseLayer, 
        depthNear: 0.1, 
        depthFar: 1000 
      })
      
      const scene = new THREE.Scene()
      sceneRef.current = scene
      
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      scene.add(ambientLight)
      
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
      dirLight.position.set(3, 8, 5)
      dirLight.castShadow = true
      scene.add(dirLight)
      
      const camera = new THREE.PerspectiveCamera(
        75, window.innerWidth / window.innerHeight, 0.1, 1000
      )
      cameraRef.current = camera
      
      const referenceSpace = await session.requestReferenceSpace('local-floor')
      referenceSpaceRef.current = referenceSpace
      
      const viewerSpace = await session.requestReferenceSpace('viewer')
      const hitTestSource = await session.requestHitTestSource({ space: viewerSpace })
      hitTestSourceRef.current = hitTestSource
      
      setIsSessionActive(true)
      frameCountRef.current = 0
      renderLoop(session, renderer, scene, camera, referenceSpace, hitTestSource)
      
    } catch (err) {
      console.error('启动AR失败:', err)
      setError('启动AR失败: ' + err.message)
      setDebugInfo('启动失败: ' + err.message)
    }
  }

  // 渲染循环
  const renderLoop = (session, renderer, scene, camera, referenceSpace, hitTestSource) => {
    const loop = (time, frame) => {
      if (!session || session !== sessionRef.current) return
      
      const pose = frame.getViewerPose(referenceSpace)
      
      if (pose) {
        frameCountRef.current++
        
        const view = pose.views[0]
        const glLayer = session.renderState.baseLayer
        
        const gl = renderer.getContext()
        gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer)
        
        const viewport = glLayer.getViewport(view)
        gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height)
        
        camera.matrix.fromArray(view.transform.matrix)
        camera.matrix.decompose(camera.position, camera.quaternion, camera.scale)
        
        // Hit Test - 自动检测地面
        let hitResults = []
        let hasHit = false
        let hitPos = null
        
        try {
          hitResults = frame.getHitTestResults(hitTestSource)
          hasHit = hitResults.length > 0
        } catch (e) {
          console.log('Hit test error:', e)
        }
        
        if (hasHit) {
          const hitPose = hitResults[0].getPose(referenceSpace)
          if (hitPose) {
            hitPos = hitPose.transform.position
            
            // 自动检测模式：记录新平面
            if (isAutoDetectingRef.current) {
              // 使用更小的网格（0.3米）来检测更多平面
              const gridSize = 0.3
              const key = `${Math.floor(hitPos.x / gridSize)},${Math.floor(hitPos.y / gridSize)},${Math.floor(hitPos.z / gridSize)}`
              
              if (!detectedPlanesRef.current.has(key)) {
                console.log('Adding new plane at:', hitPos.x.toFixed(2), hitPos.y.toFixed(2), hitPos.z.toFixed(2))
                addDetectedPlane(hitPos)
                detectedPlanesRef.current.set(key, true)
              }
            }
          }
        }
        
        // 每60帧更新状态
        if (frameCountRef.current % 60 === 0) {
          if (isAutoDetectingRef.current) {
            if (hasHit && hitPos) {
              setDebugInfo(`检测中... 已发现 ${planeCountRef.current} 个平面 | 当前: x=${hitPos.x.toFixed(1)}, y=${hitPos.y.toFixed(1)}, z=${hitPos.z.toFixed(1)}`)
            } else {
              setDebugInfo(`检测中... 已发现 ${planeCountRef.current} 个平面 | 请将手机对准地面`)
            }
          } else {
            setDebugInfo('点击"开始检测"自动记录地面')
          }
        }
        
        renderer.render(scene, camera)
      }
      
      session.requestAnimationFrame(loop)
    }
    
    session.requestAnimationFrame(loop)
  }

  // 添加检测到的平面
  const addDetectedPlane = (position) => {
    if (!sceneRef.current) return
    
    const currentCount = planeCountRef.current
    
    const planeId = `plane_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const planeData = {
      id: planeId,
      type: 'floor',
      position: { 
        x: parseFloat(position.x.toFixed(3)), 
        y: parseFloat(position.y.toFixed(3)), 
        z: parseFloat(position.z.toFixed(3)) 
      },
      rotation: { x: -90, y: 0, z: 0 },
      size: { width: 2, height: 2 }
    }
    
    // 创建可视化平面
    const geometry = new THREE.PlaneGeometry(planeData.size.width, planeData.size.height)
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(position)
    mesh.rotation.x = THREE.MathUtils.degToRad(planeData.rotation.x)
    
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
    ctx.fillText(`${currentCount + 1}`, 64, 44)
    
    const texture = new THREE.CanvasTexture(canvas)
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture })
    const sprite = new THREE.Sprite(spriteMaterial)
    sprite.position.y = 0.6
    sprite.scale.set(0.8, 0.4, 1)
    mesh.add(sprite)
    
    sceneRef.current.add(mesh)
    planeData.mesh = mesh
    
    const newPlanes = [...planesRef.current, planeData]
    planesRef.current = newPlanes
    setPlanes(newPlanes)
    setDetectedCount(newPlanes.length)
    
    console.log(`Plane ${currentCount + 1} added, total: ${newPlanes.length}`)
  }

  // 删除指定平面
  const removePlane = (index) => {
    const plane = planesRef.current[index]
    if (plane.mesh && sceneRef.current) {
      sceneRef.current.remove(plane.mesh)
    }
    
    const newPlanes = planesRef.current.filter((_, i) => i !== index)
    // 重新编号
    newPlanes.forEach((p, i) => {
      if (p.mesh) {
        const sprite = p.mesh.children.find(c => c.type === 'Sprite')
        if (sprite && sprite.material.map) {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          canvas.width = 128
          canvas.height = 64
          ctx.fillStyle = '#00ff88'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.fillStyle = '#000'
          ctx.font = 'bold 32px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(`${i + 1}`, 64, 44)
          
          const texture = new THREE.CanvasTexture(canvas)
          sprite.material.map.dispose()
          sprite.material.map = texture
          sprite.material.needsUpdate = true
        }
      }
    })
    
    planesRef.current = newPlanes
    setPlanes(newPlanes)
    setDetectedCount(newPlanes.length)
    
    // 从检测记录中移除该位置
    const removedPlane = planes[index]
    if (removedPlane) {
      const gridSize = 0.3
      const key = `${Math.floor(removedPlane.position.x / gridSize)},${Math.floor(removedPlane.position.y / gridSize)},${Math.floor(removedPlane.position.z / gridSize)}`
      detectedPlanesRef.current.delete(key)
    }
  }

  // 开始/停止自动检测
  const toggleAutoDetect = () => {
    if (isAutoDetecting) {
      setIsAutoDetecting(false)
      setDebugInfo(`检测完成！共发现 ${planesRef.current.length} 个平面`)
    } else {
      setIsAutoDetecting(true)
      setDebugInfo('开始自动检测地面...')
    }
  }

  // 清除所有平面
  const clearAllPlanes = () => {
    planesRef.current.forEach(plane => {
      if (plane.mesh && sceneRef.current) {
        sceneRef.current.remove(plane.mesh)
      }
    })
    planesRef.current = []
    setPlanes([])
    detectedPlanesRef.current.clear()
    setDetectedCount(0)
    setDebugInfo('已清除所有平面')
  }

  // 导出场景 - 包含完整的3D重建数据
  const exportScene = async () => {
    if (planesRef.current.length === 0) {
      setError('请先检测至少一个平面')
      return
    }
    
    setIsExporting(true)
    
    try {
      const currentPlanes = planesRef.current
      
      // 构建完整的3D场景数据
      const sceneData = {
        version: '2.0',
        type: 'webxr-ar-scene',
        name: sceneName || `WebXR场景_${currentPlanes.length}平面`,
        capturedAt: new Date().toISOString(),
        // 平面数据 - 用于重建3D场景
        planes: currentPlanes.map((p, index) => ({
          id: p.id,
          index: index + 1, // 序号
          type: p.type,
          position: p.position, // {x, y, z}
          rotation: p.rotation, // {x, y, z}
          size: p.size, // {width, height}
          // 完整的变换矩阵数据
          transform: {
            translation: [p.position.x, p.position.y, p.position.z],
            rotation: [p.rotation.x, p.rotation.y, p.rotation.z],
            scale: [1, 1, 1]
          }
        })),
        // 场景元数据
        sceneBounds: calculateSceneBounds(currentPlanes),
        // 相机配置
        camera: { 
          fov: 75, 
          position: { x: 0, y: 1.6, z: 0 }, // 假设人眼高度1.6米
          target: { x: 0, y: 0, z: -3 }
        },
        // WebXR配置
        webxrData: {
          referenceSpace: 'local-floor',
          features: ['hit-test'],
          gridSize: 0.3
        },
        // 3D重建说明
        reconstruction: {
          method: 'hit-test-sampling',
          description: '通过WebXR hit-test在真实环境中采样的地面平面',
          planeSpacing: 0.3, // 采样间隔0.3米
          totalSamples: detectedPlanesRef.current.size
        }
      }
      
      // 同时生成一个可以直接使用的Three.js场景配置
      const threeJsScene = {
        metadata: {
          version: 4.5,
          type: 'Object',
          generator: 'WebXRARRecorder'
        },
        scene: {
          type: 'Scene',
          children: currentPlanes.map((p, index) => ({
            type: 'Mesh',
            name: `Plane_${index + 1}`,
            geometry: {
              type: 'PlaneGeometry',
              width: p.size.width,
              height: p.size.height
            },
            material: {
              type: 'MeshBasicMaterial',
              color: 0x00ff88,
              transparent: true,
              opacity: 0.3
            },
            position: [p.position.x, p.position.y, p.position.z],
            rotation: [p.rotation.x * Math.PI / 180, p.rotation.y * Math.PI / 180, p.rotation.z * Math.PI / 180]
          }))
        }
      }
      
      const zip = new JSZip()
      
      // manifest.json
      zip.file('manifest.json', JSON.stringify({
        version: '2.0',
        type: 'webxr-ar-scene-pack',
        createdAt: new Date().toISOString(),
        metadata: { 
          name: sceneData.name, 
          type: 'webxr-ar', 
          planeCount: currentPlanes.length 
        }
      }, null, 2))
      
      // scene.json - 主要场景数据
      zip.file('scene.json', JSON.stringify(sceneData, null, 2))
      
      // threejs-scene.json - Three.js可直接加载的场景
      zip.file('threejs-scene.json', JSON.stringify(threeJsScene, null, 2))
      
      // planes.csv - 便于查看的CSV格式
      const csvHeader = 'index,id,type,x,y,z,rotationX,rotationY,rotationZ,width,height\n'
      const csvData = currentPlanes.map((p, i) => 
        `${i+1},${p.id},${p.type},${p.position.x},${p.position.y},${p.position.z},${p.rotation.x},${p.rotation.y},${p.rotation.z},${p.size.width},${p.size.height}`
      ).join('\n')
      zip.file('planes.csv', csvHeader + csvData)
      
      // README.md - 使用说明
      zip.file('README.md', `# ${sceneData.name}

## 场景信息
- 平面数量: ${currentPlanes.length}
- 录制时间: ${sceneData.capturedAt}
- 采样间隔: 0.3米

## 文件说明

### scene.json
主要场景数据，包含所有平面的位置、旋转、大小信息。

### threejs-scene.json
Three.js场景配置文件，可直接导入Three.js编辑器。

### planes.csv
CSV格式的平面数据，便于在Excel或其他工具中查看。

## 如何使用

### 在Three.js中重建场景
\`\`\`javascript
import * as THREE from 'three'

// 加载scene.json
const sceneData = await fetch('scene.json').then(r => r.json())

// 重建场景
const scene = new THREE.Scene()

sceneData.planes.forEach(plane => {
  const geometry = new THREE.PlaneGeometry(plane.size.width, plane.size.height)
  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(plane.position.x, plane.position.y, plane.position.z)
  mesh.rotation.set(
    plane.rotation.x * Math.PI / 180,
    plane.rotation.y * Math.PI / 180,
    plane.rotation.z * Math.PI / 180
  )
  scene.add(mesh)
})
\`\`\`

### 放置3D模型
在检测到的平面上放置模型：
\`\`\`javascript
// 使用第一个平面的位置
const firstPlane = sceneData.planes[0]
model.position.set(
  firstPlane.position.x,
  firstPlane.position.y + 1, // 在平面上方1米
  firstPlane.position.z
)
\`\`\`
`)
      
      const content = await zip.generateAsync({ type: 'blob' })
      
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = `${sceneData.name.replace(/\s+/g, '_')}.webxrar`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      if (onSceneRecorded) {
        onSceneRecorded(sceneData)
      }
      
      alert(`场景导出成功！\n包含 ${currentPlanes.length} 个平面\n文件名: ${sceneData.name.replace(/\s+/g, '_')}.webxrar\n\n导出的文件包含:\n- scene.json (场景数据)\n- threejs-scene.json (Three.js场景)\n- planes.csv (CSV数据)\n- README.md (使用说明)`)
      
    } catch (err) {
      console.error('导出失败:', err)
      setError('导出失败: ' + err.message)
    } finally {
      setIsExporting(false)
    }
  }
  
  // 计算场景边界
  const calculateSceneBounds = (planes) => {
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

  // 结束会话
  const endSession = () => {
    if (sessionRef.current) {
      sessionRef.current.end()
      sessionRef.current = null
    }
    
    if (rendererRef.current) {
      rendererRef.current.dispose()
      rendererRef.current = null
    }
    
    planesRef.current = []
    detectedPlanesRef.current.clear()
    setPlanes([])
    setIsSessionActive(false)
    setIsAutoDetecting(false)
    isAutoDetectingRef.current = false
    setDebugInfo('')
  }

  // 关闭组件
  const handleClose = () => {
    endSession()
    onClose()
  }

  useEffect(() => {
    return () => {
      endSession()
    }
  }, [])

  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      <canvas ref={canvasRef} className={styles.arCanvas} />
      
      <div id="ar-overlay" className={styles.arOverlay}>
        {/* 顶部栏 */}
        <div className={styles.topBar}>
          <button className={styles.closeBtn} onClick={handleClose}>✕</button>
          <div className={styles.info}>
            <span>平面: {detectedCount}</span>
            {isAutoDetecting && (
              <span className={styles.detecting}>🔍 检测中</span>
            )}
          </div>
          {!isSessionActive && (
            <button 
              className={styles.startBtn}
              onClick={startARSession}
              disabled={!isSupported}
            >
              启动AR
            </button>
          )}
        </div>
        
        {/* 调试信息 */}
        {isSessionActive && debugInfo && (
          <div className={styles.debugInfo}>
            {debugInfo}
          </div>
        )}
        
        {/* 错误提示 */}
        {error && (
          <div className={styles.errorToast}>
            <span>{error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}
        
        {/* 使用说明 */}
        {showInstructions && isSessionActive && (
          <div className={styles.instructions}>
            <h3>📖 使用说明</h3>
            <ol>
              <li>点击"开始检测"自动扫描地面</li>
              <li>缓慢移动手机扫描不同区域</li>
              <li>系统自动记录发现的平面</li>
              <li>在列表中删除不需要的平面</li>
              <li>点击"导出"保存完整场景</li>
            </ol>
            <button onClick={() => setShowInstructions(false)}>我知道了</button>
          </div>
        )}
        
        {/* 平面列表 */}
        {isSessionActive && planes.length > 0 && (
          <div className={styles.planeList}>
            <h4>检测到的平面 ({planes.length})</h4>
            <div className={styles.planeItems}>
              {planes.map((plane, index) => (
                <div key={plane.id} className={styles.planeItem}>
                  <span>平面 {index + 1}</span>
                  <button 
                    className={styles.deleteBtn}
                    onClick={() => removePlane(index)}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 底部控制面板 */}
        {isSessionActive && (
          <div className={styles.controlPanel}>
            <div className={styles.inputGroup}>
              <input
                type="text"
                value={sceneName}
                onChange={(e) => setSceneName(e.target.value)}
                placeholder="场景名称"
                className={styles.sceneInput}
              />
            </div>
            
            <div className={styles.actionButtons}>
              <button 
                className={`${styles.actionBtn} ${isAutoDetecting ? styles.active : ''}`}
                onClick={toggleAutoDetect}
              >
                {isAutoDetecting ? '⏹️ 停止检测' : '🔍 开始检测'}
              </button>
              
              <button 
                className={styles.actionBtn}
                onClick={clearAllPlanes}
                disabled={planes.length === 0}
              >
                🗑️ 清除全部
              </button>
              
              <button 
                className={`${styles.actionBtn} ${styles.export}`}
                onClick={exportScene}
                disabled={planes.length === 0 || isExporting}
              >
                {isExporting ? '💾 导出中...' : '💾 导出'}
              </button>
            </div>
          </div>
        )}
        
        {/* 不支持提示 */}
        {!isSupported && !error && (
          <div className={styles.notSupported}>
            <h3>⚠️ 设备不支持</h3>
            <p>需要支持WebXR的AR设备</p>
            <p>Android: Chrome + ARCore</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default WebXRARSceneRecorder
