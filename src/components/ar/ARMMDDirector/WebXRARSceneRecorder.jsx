import React, { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'
import styles from './WebXRARSceneRecorder.module.css'
import JSZip from 'jszip'

/**
 * AR全景拍摄组件 - 使用WebXR AR
 */

export function WebXRARSceneRecorder({
  isOpen,
  onClose,
  onSceneRecorded
}) {
  const canvasRef = useRef(null)
  const sessionRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const captureIntervalRef = useRef(null)
  const capturedImagesRef = useRef([])
  
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedCount, setCapturedCount] = useState(0)
  const [sceneName, setSceneName] = useState('')
  const [error, setError] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')
  
  const MAX_CAPTURES = 20
  const CAPTURE_INTERVAL = 500
  
  // 启动AR会话
  const startARSession = async () => {
    try {
      // 请求AR会话
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['local-floor']
      })
      
      sessionRef.current = session
      
      // 创建渲染器
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        alpha: true,
        antialias: true
      })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(window.devicePixelRatio)
      rendererRef.current = renderer
      
      // 创建相机
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
      cameraRef.current = camera
      
      // 手动创建XRWebGLLayer并设置渲染状态
      const gl = renderer.getContext()
      const baseLayer = new XRWebGLLayer(session, gl)
      
      await session.updateRenderState({
        baseLayer: baseLayer
      })
      
      // 设置参考空间
      const referenceSpace = await session.requestReferenceSpace('local-floor')
      
      // 启动渲染循环
      const onXRFrame = (time, frame) => {
        if (!sessionRef.current) return
        
        const pose = frame.getViewerPose(referenceSpace)
        if (pose && cameraRef.current) {
          const view = pose.views[0]
          cameraRef.current.matrix.fromArray(view.transform.matrix)
          cameraRef.current.matrix.decompose(
            cameraRef.current.position,
            cameraRef.current.quaternion,
            cameraRef.current.scale
          )
        }
        
        // 渲染
        if (rendererRef.current) {
          rendererRef.current.render(new THREE.Scene(), cameraRef.current)
        }
        
        session.requestAnimationFrame(onXRFrame)
      }
      
      session.requestAnimationFrame(onXRFrame)
      
      setIsSessionActive(true)
      setDebugInfo('AR会话已启动，点击"开始拍摄"')
      
    } catch (err) {
      console.error('启动AR会话失败:', err)
      setError('AR启动失败: ' + err.message)
    }
  }
  
  // 开始拍摄
  const startCapture = () => {
    if (!isSessionActive) {
      setError('请先启动AR相机')
      return
    }
    
    setIsCapturing(true)
    setCapturedCount(0)
    capturedImagesRef.current = []
    
    setDebugInfo(`开始拍摄，每${CAPTURE_INTERVAL/1000}秒拍摄一张，共${MAX_CAPTURES}张`)
    
    captureIntervalRef.current = setInterval(() => {
      captureFrame()
    }, CAPTURE_INTERVAL)
  }
  
  // 拍摄单帧
  const captureFrame = () => {
    if (capturedImagesRef.current.length >= MAX_CAPTURES) {
      stopCapture()
      return
    }
    
    if (!rendererRef.current || !cameraRef.current) return
    
    // 捕获当前画面
    const canvas = rendererRef.current.domElement
    const imageData = canvas.toDataURL('image/jpeg', 0.9)
    
    // 记录相机位置
    const cameraPosition = {
      x: cameraRef.current.position.x,
      y: cameraRef.current.position.y,
      z: cameraRef.current.position.z
    }
    
    const cameraRotation = {
      x: cameraRef.current.rotation.x,
      y: cameraRef.current.rotation.y,
      z: cameraRef.current.rotation.z
    }
    
    capturedImagesRef.current.push({
      index: capturedImagesRef.current.length,
      imageData,
      cameraPosition,
      cameraRotation,
      timestamp: Date.now()
    })
    
    setCapturedCount(capturedImagesRef.current.length)
    setDebugInfo(`已拍摄 ${capturedImagesRef.current.length}/${MAX_CAPTURES} 张`)
    
    if (capturedImagesRef.current.length >= MAX_CAPTURES) {
      stopCapture()
    }
  }
  
  // 停止拍摄
  const stopCapture = () => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current)
      captureIntervalRef.current = null
    }
    
    setIsCapturing(false)
    setDebugInfo(`拍摄完成！共${capturedImagesRef.current.length}张图片`)
  }
  
  // 导出场景
  const exportScene = async () => {
    if (capturedImagesRef.current.length === 0) {
      setError('请先拍摄图片')
      return
    }
    
    setIsExporting(true)
    
    try {
      const capturedImages = capturedImagesRef.current
      
      // 计算场景中心点
      const centerX = capturedImages.reduce((sum, img) => sum + img.cameraPosition.x, 0) / capturedImages.length
      const centerY = capturedImages.reduce((sum, img) => sum + img.cameraPosition.y, 0) / capturedImages.length
      const centerZ = capturedImages.reduce((sum, img) => sum + img.cameraPosition.z, 0) / capturedImages.length
      
      // 构建平面数据
      const SCALE_FACTOR = 3
      const planes = capturedImages.map((img, index) => {
        const relativeX = (img.cameraPosition.x - centerX) * SCALE_FACTOR
        const relativeY = (img.cameraPosition.y - centerY) * SCALE_FACTOR
        const relativeZ = (img.cameraPosition.z - centerZ) * SCALE_FACTOR
        
        return {
          id: `capture_${index}`,
          index: index + 1,
          type: 'camera-capture',
          worldPosition: { x: relativeX, y: relativeY, z: relativeZ },
          rotation: {
            x: img.cameraRotation.x * 180 / Math.PI,
            y: img.cameraRotation.y * 180 / Math.PI,
            z: img.cameraRotation.z * 180 / Math.PI
          },
          realSize: { width: 2, height: 2 },
          cameraPosition: img.cameraPosition,
          cameraRotation: img.cameraRotation,
          timestamp: img.timestamp
        }
      })
      
      // 构建场景数据
      const sceneData = {
        version: '5.0',
        type: 'ar-panorama-scene',
        format: 'arcjpack',
        name: sceneName || `AR全景场景_${capturedImages.length}张`,
        capturedAt: new Date().toISOString(),
        captureMethod: 'webxr-ar',
        captureInterval: CAPTURE_INTERVAL,
        totalCaptures: capturedImages.length,
        planes,
        sceneBounds: {
          center: { x: 0, y: 0, z: 0 },
          size: {
            width: Math.max(...planes.map(p => Math.abs(p.worldPosition.x))) * 2 + 4,
            height: Math.max(...planes.map(p => Math.abs(p.worldPosition.y))) * 2 + 4,
            depth: Math.max(...planes.map(p => Math.abs(p.worldPosition.z))) * 2 + 4
          }
        },
        camera: {
          position: { x: 0, y: 5, z: 15 },
          lookAt: { x: 0, y: 0, z: 0 }
        },
        renderConfig: {
          layout: 'panorama',
          scaleFactor: SCALE_FACTOR,
          description: '全景拍摄布局，根据相机移动轨迹排列'
        }
      }
      
      // 创建ZIP文件
      const zip = new JSZip()
      
      zip.file('manifest.json', JSON.stringify({
        version: '5.0',
        type: 'arcjpack',
        format: 'ar-cinematic-pack',
        createdAt: new Date().toISOString(),
        metadata: {
          name: sceneData.name,
          type: 'ar-panorama',
          planeCount: capturedImages.length,
          layout: 'panorama'
        }
      }, null, 2))
      
      zip.file('scene.json', JSON.stringify(sceneData, null, 2))
      
      const imagesFolder = zip.folder('images')
      capturedImages.forEach((img, index) => {
        if (img.imageData.startsWith('data:')) {
          const base64Data = img.imageData.split(',')[1]
          imagesFolder.file(`capture_${index}.jpg`, base64Data, { base64: true })
        }
      })
      
      const content = await zip.generateAsync({ type: 'blob' })
      
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
      
      alert(`场景导出成功！\n包含 ${capturedImages.length} 张图片`)
      
    } catch (err) {
      console.error('导出失败:', err)
      setError('导出失败: ' + err.message)
    } finally {
      setIsExporting(false)
    }
  }
  
  // 关闭AR会话
  const closeARSession = () => {
    stopCapture()
    
    if (rendererRef.current) {
      rendererRef.current.setAnimationLoop(null)
      rendererRef.current.dispose()
      rendererRef.current = null
    }
    
    if (sessionRef.current) {
      sessionRef.current.end()
      sessionRef.current = null
    }
    
    setIsSessionActive(false)
    setCapturedCount(0)
    capturedImagesRef.current = []
    
    onClose()
  }
  
  if (!isOpen) return null
  
  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <canvas 
          ref={canvasRef} 
          className={styles.arCanvas}
        />
        
        <div className={styles.controls}>
          <h2>📷 AR全景拍摄</h2>
          
          {error && (
            <div className={styles.error}>{error}</div>
          )}
          
          <div className={styles.inputGroup}>
            <label>场景名称:</label>
            <input
              type="text"
              value={sceneName}
              onChange={(e) => setSceneName(e.target.value)}
              placeholder="输入场景名称"
            />
          </div>
          
          <div className={styles.status}>
            <p>状态: {isSessionActive ? '🟢 AR已连接' : '🔴 未连接'}</p>
            <p>已拍摄: {capturedCount}/{MAX_CAPTURES} 张</p>
            <p className={styles.debug}>{debugInfo}</p>
          </div>
          
          <div className={styles.buttons}>
            {!isSessionActive ? (
              <button 
                className={styles.primaryBtn}
                onClick={startARSession}
              >
                启动AR相机
              </button>
            ) : (
              <>
                {!isCapturing ? (
                  <button 
                    className={styles.primaryBtn}
                    onClick={startCapture}
                    disabled={capturedCount >= MAX_CAPTURES}
                  >
                    开始拍摄
                  </button>
                ) : (
                  <button 
                    className={styles.dangerBtn}
                    onClick={stopCapture}
                  >
                    停止拍摄
                  </button>
                )}
                
                <button 
                  className={styles.secondaryBtn}
                  onClick={exportScene}
                  disabled={capturedCount === 0 || isExporting}
                >
                  {isExporting ? '导出中...' : '导出场景'}
                </button>
              </>
            )}
            
            <button 
              className={styles.closeBtn}
              onClick={closeARSession}
            >
              关闭
            </button>
          </div>
          
          <div className={styles.instructions}>
            <h3>使用说明:</h3>
            <ol>
              <li>点击"启动AR相机"</li>
              <li>允许摄像头和AR权限</li>
              <li>点击"开始拍摄"开始自动拍摄</li>
              <li>缓慢移动相机，每0.5秒自动拍摄一张</li>
              <li>拍摄{MAX_CAPTURES}张后自动停止</li>
              <li>点击"导出场景"保存</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
