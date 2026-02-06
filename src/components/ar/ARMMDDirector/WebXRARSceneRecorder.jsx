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
      
      // 使用AR真实位置关系计算舞台坐标
      // 1. 找到第一个平面作为参考点（原点）
      const referencePlane = currentPlanes[0]
      const refPos = referencePlane.position
      
      // 2. 计算所有平面相对于参考点的位置（放大坐标以便观察）
      const SCALE_FACTOR = 5  // 放大5倍，让偏差更明显
      const Z_OFFSET = 10     // 整体前移，避免负数Z
      
      const stagePlanes = currentPlanes.map((p, index) => {
        // 计算相对位置（相对于第一个平面）
        const relativeX = (p.position.x - refPos.x) * SCALE_FACTOR
        const relativeY = (p.position.y - refPos.y) * SCALE_FACTOR  // 保持Y方向偏差
        const relativeZ = (p.position.z - refPos.z) * SCALE_FACTOR + Z_OFFSET
        
        // 计算相对旋转（相对于第一个平面）
        const relativeRotX = p.rotation.x - refPos.x
        const relativeRotY = p.rotation.y - refPos.y
        const relativeRotZ = p.rotation.z - refPos.z
        
        return {
          id: p.id,
          index: index + 1,
          type: p.type,
          // 原始AR坐标
          originalPosition: p.position,
          originalRotation: p.rotation,
          originalSize: p.size,
          // 相对位置（AR偏差）
          relativePosition: {
            x: (p.position.x - refPos.x),
            y: (p.position.y - refPos.y),
            z: (p.position.z - refPos.z)
          },
          // 舞台坐标（放大后的相对位置）
          worldPosition: { 
            x: relativeX, 
            y: relativeY, 
            z: relativeZ 
          },
          realSize: p.size,
          rotation: { 
            x: relativeRotX, 
            y: relativeRotY, 
            z: relativeRotZ 
          },
          // 锚点（用于角色放置）
          anchorPoints: [
            { id: `${p.id}_center`, name: '中心', type: 'center', position: { x: 0, y: 0, z: 0 } },
            { id: `${p.id}_corner_1`, name: '左上角', type: 'corner', position: { x: -p.size.width/2, y: 0, z: -p.size.height/2 } },
            { id: `${p.id}_corner_2`, name: '右上角', type: 'corner', position: { x: p.size.width/2, y: 0, z: -p.size.height/2 } },
            { id: `${p.id}_corner_3`, name: '左下角', type: 'corner', position: { x: -p.size.width/2, y: 0, z: p.size.height/2 } },
            { id: `${p.id}_corner_4`, name: '右下角', type: 'corner', position: { x: p.size.width/2, y: 0, z: p.size.height/2 } }
          ],
          planeIndex: index
        }
      })
      
      // 构建 .arcjpack 格式的场景数据
      const sceneData = {
        version: '4.0',
        type: 'ar-multi-plane-scene',
        format: 'arcjpack',
        name: sceneName || `AR多平面场景_${currentPlanes.length}个平面`,
        capturedAt: new Date().toISOString(),
        // 使用舞台坐标的平面数据
        planes: stagePlanes,
        // 场景边界（基于AR实际位置）
        sceneBounds: {
          center: {
            x: stagePlanes.reduce((sum, p) => sum + p.worldPosition.x, 0) / stagePlanes.length,
            y: stagePlanes.reduce((sum, p) => sum + p.worldPosition.y, 0) / stagePlanes.length,
            z: stagePlanes.reduce((sum, p) => sum + p.worldPosition.z, 0) / stagePlanes.length
          },
          size: {
            width: Math.max(...stagePlanes.map(p => Math.abs(p.worldPosition.x))) * 2 + 4,
            height: Math.max(...stagePlanes.map(p => Math.abs(p.worldPosition.y))) * 2 + 4,
            depth: Math.max(...stagePlanes.map(p => Math.abs(p.worldPosition.z))) * 2 + 4
          }
        },
        // 相机配置（用于3D渲染）
        camera: {
          position: { 
            x: 15, 
            y: 10, 
            z: 30 
          },
          lookAt: { 
            x: 0, 
            y: 0, 
            z: Z_OFFSET 
          }
        },
        // 渲染配置
        renderConfig: {
          layout: 'ar-relative',
          scaleFactor: SCALE_FACTOR,
          zOffset: Z_OFFSET,
          description: 'AR相对位置布局，保持真实空间关系'
        },
        // 保留原始AR数据
        arData: {
          originalPlanes: currentPlanes.map((p, index) => ({
            id: p.id,
            position: p.position,
            rotation: p.rotation,
            size: p.size,
            timestamp: Date.now() + index
          })),
          captureInfo: {
            method: 'webxr-hit-test',
            referenceSpace: 'local-floor',
            planeCount: currentPlanes.length
          }
        }
      }
      
      // 创建ZIP文件（.arcjpack格式）
      const zip = new JSZip()
      
      // 1. manifest.json
      zip.file('manifest.json', JSON.stringify({
        version: '4.0',
        type: 'arcjpack',
        format: 'ar-cinematic-pack',
        createdAt: new Date().toISOString(),
        metadata: {
          name: sceneData.name,
          type: 'ar-multi-plane',
          planeCount: currentPlanes.length,
          layout: 'linear-offset'
        }
      }, null, 2))
      
      // 2. scene.json - 主要场景数据（包含舞台坐标）
      zip.file('scene.json', JSON.stringify(sceneData, null, 2))
      
      // 3. 捕获场景截图作为背景（如果有）
      // 注意：这里需要实际捕获图片，暂时跳过
      
      // 4. 创建空的images文件夹（用于后续添加平面图片）
      zip.folder('images')
      
      // 生成ZIP文件
      const content = await zip.generateAsync({ type: 'blob' })
      
      // 下载文件
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = `${sceneData.name.replace(/\s+/g, '_')}.arcjpack`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      if (onSceneRecorded) {
        onSceneRecorded(sceneData)
      }
      
      alert(`场景导出成功！\n包含 ${currentPlanes.length} 个平面\n文件名: ${sceneData.name.replace(/\s+/g, '_')}.arcjpack\n\n布局信息:\n- 水平间隔: ${X_SPACING}米\n- 垂直分层: ${Y_LAYER_HEIGHT}米\n- 整体前移: ${Z_OFFSET}米`)
      
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
