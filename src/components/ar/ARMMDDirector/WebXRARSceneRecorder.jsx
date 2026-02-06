import React, { useState, useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import styles from './WebXRARSceneRecorder.module.css'
import JSZip from 'jszip'

/**
 * AR全景拍摄组件 - 支持WebXR AR和普通摄像头
 * 
 * 功能：
 * 1. 优先使用WebXR AR模式（支持6DoF追踪）
 * 2. 不支持时使用普通摄像头（手动移动）
 * 3. 每0.5秒自动拍摄一张图片
 * 4. 记录每张图片的位置
 * 5. 拍摄20张图片后自动停止
 * 6. 根据位置拼接3D场景
 */

export function WebXRARSceneRecorder({
  isOpen,
  onClose,
  onSceneRecorded
}) {
  const canvasRef = useRef(null)
  const videoRef = useRef(null)
  const sessionRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const referenceSpaceRef = useRef(null)
  const captureIntervalRef = useRef(null)
  const capturedImagesRef = useRef([])
  const streamRef = useRef(null)
  const mockCameraRef = useRef({ x: 0, y: 0, z: 0 })
  
  const [isSupported, setIsSupported] = useState(false)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedCount, setCapturedCount] = useState(0)
  const [sceneName, setSceneName] = useState('')
  const [error, setError] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')
  const [useNormalCamera, setUseNormalCamera] = useState(false)
  
  const MAX_CAPTURES = 20
  const CAPTURE_INTERVAL = 500 // 0.5秒
  
  // 检查支持情况
  useEffect(() => {
    if (!isOpen) return
    
    const checkSupport = async () => {
      // 检查WebXR支持
      if (navigator.xr) {
        try {
          const isARSupported = await navigator.xr.isSessionSupported('immersive-ar')
          setIsSupported(isARSupported)
        } catch (err) {
          setIsSupported(false)
        }
      } else {
        setIsSupported(false)
      }
    }
    
    checkSupport()
  }, [isOpen])
  
  // 启动普通摄像头
  const startNormalCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      
      setUseNormalCamera(true)
      setIsSessionActive(true)
      setDebugInfo('摄像头已启动，点击"开始拍摄"')
      
    } catch (err) {
      console.error('启动摄像头失败:', err)
      setError('启动摄像头失败: ' + err.message)
    }
  }
  
  // 启动AR会话
  const startARSession = async () => {
    try {
      // 请求AR会话
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['local-floor'],
        optionalFeatures: ['dom-overlay', 'camera-access'],
        domOverlay: { root: document.body }
      })
      
      sessionRef.current = session
      
      // 创建Three.js场景
      const scene = new THREE.Scene()
      sceneRef.current = scene
      
      // 创建相机
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
      cameraRef.current = camera
      
      // 创建渲染器 - 使用alpha通道让AR背景透过来
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true
      })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.autoClear = false
      rendererRef.current = renderer
      
      // 设置参考空间
      const referenceSpace = await session.requestReferenceSpace('local-floor')
      referenceSpaceRef.current = referenceSpace
      
      // 启动渲染循环
      session.requestAnimationFrame(onXRFrame)
      
      setIsSessionActive(true)
      setUseNormalCamera(false)
      setDebugInfo('AR会话已启动，点击"开始拍摄"')
      
    } catch (err) {
      console.error('启动AR会话失败:', err)
      setError('AR启动失败: ' + err.message + '，请确保使用支持AR的浏览器（Chrome Android）并允许摄像头权限')
    }
  }
  
  // XR渲染帧
  const onXRFrame = (time, frame) => {
    if (!sessionRef.current) return
    
    const session = frame.session
    const referenceSpace = referenceSpaceRef.current
    
    // 获取相机姿态
    const pose = frame.getViewerPose(referenceSpace)
    
    if (pose && cameraRef.current) {
      // 更新Three.js相机
      const view = pose.views[0]
      cameraRef.current.matrix.fromArray(view.transform.matrix)
      cameraRef.current.matrix.decompose(
        cameraRef.current.position,
        cameraRef.current.quaternion,
        cameraRef.current.scale
      )
    }
    
    // 渲染场景
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current)
    }
    
    // 继续下一帧
    session.requestAnimationFrame(onXRFrame)
  }
  
  // 开始拍摄
  const startCapture = () => {
    if (!isSessionActive) {
      setError('请先启动摄像头')
      return
    }
    
    setIsCapturing(true)
    setCapturedCount(0)
    capturedImagesRef.current = []
    mockCameraRef.current = { x: 0, y: 0, z: 0 }
    
    setDebugInfo(`开始拍摄，每${CAPTURE_INTERVAL/1000}秒拍摄一张，共${MAX_CAPTURES}张`)
    
    // 设置定时拍摄
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
    
    let imageData
    let cameraPosition
    let cameraRotation
    
    if (useNormalCamera && videoRef.current) {
      // 使用普通摄像头拍摄
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth || 1280
      canvas.height = videoRef.current.videoHeight || 720
      const ctx = canvas.getContext('2d')
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
      imageData = canvas.toDataURL('image/jpeg', 0.9)
      
      // 模拟相机位置（根据拍摄顺序排列成弧形）
      const angle = (capturedImagesRef.current.length / MAX_CAPTURES) * Math.PI * 2
      const radius = 5
      mockCameraRef.current = {
        x: Math.cos(angle) * radius,
        y: 0,
        z: Math.sin(angle) * radius
      }
      
      cameraPosition = { ...mockCameraRef.current }
      cameraRotation = { x: 0, y: -angle * 180 / Math.PI, z: 0 }
      
    } else if (rendererRef.current && cameraRef.current) {
      // 使用WebXR拍摄
      const canvas = rendererRef.current.domElement
      imageData = canvas.toDataURL('image/jpeg', 0.9)
      
      cameraPosition = {
        x: cameraRef.current.position.x,
        y: cameraRef.current.position.y,
        z: cameraRef.current.position.z
      }
      
      cameraRotation = {
        x: cameraRef.current.rotation.x,
        y: cameraRef.current.rotation.y,
        z: cameraRef.current.rotation.z
      }
    } else {
      return
    }
    
    // 保存图片和位置
    capturedImagesRef.current.push({
      index: capturedImagesRef.current.length,
      imageData,
      cameraPosition,
      cameraRotation,
      timestamp: Date.now()
    })
    
    setCapturedCount(capturedImagesRef.current.length)
    setDebugInfo(`已拍摄 ${capturedImagesRef.current.length}/${MAX_CAPTURES} 张`)
    
    // 检查是否完成
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
      
      // 构建平面数据（每张图片作为一个平面，面向相机）
      const SCALE_FACTOR = 3 // 放大坐标
      const planes = capturedImages.map((img, index) => {
        // 计算相对位置（相对于场景中心）
        const relativeX = (img.cameraPosition.x - centerX) * SCALE_FACTOR
        const relativeY = (img.cameraPosition.y - centerY) * SCALE_FACTOR
        const relativeZ = (img.cameraPosition.z - centerZ) * SCALE_FACTOR
        
        return {
          id: `capture_${index}`,
          index: index + 1,
          type: 'camera-capture',
          // 舞台坐标（放大后的相对位置）
          worldPosition: {
            x: relativeX,
            y: relativeY,
            z: relativeZ
          },
          // 平面朝向相机
          rotation: {
            x: img.cameraRotation.x * 180 / Math.PI,
            y: img.cameraRotation.y * 180 / Math.PI,
            z: img.cameraRotation.z * 180 / Math.PI
          },
          realSize: { width: 2, height: 2 }, // 默认2x2米
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
        captureMethod: useNormalCamera ? 'normal-camera' : 'webxr-ar',
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
      
      // 1. manifest.json
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
      
      // 2. scene.json
      zip.file('scene.json', JSON.stringify(sceneData, null, 2))
      
      // 3. 添加图片
      const imagesFolder = zip.folder('images')
      capturedImages.forEach((img, index) => {
        if (img.imageData.startsWith('data:')) {
          const base64Data = img.imageData.split(',')[1]
          imagesFolder.file(`capture_${index}.jpg`, base64Data, { base64: true })
        }
      })
      
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
      
      alert(`场景导出成功！\n包含 ${capturedImages.length} 张图片\n文件名: ${sceneData.name.replace(/\s+/g, '_')}.arcjpack`)
      
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
    
    // 停止普通摄像头
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    // 停止WebXR会话
    if (sessionRef.current) {
      sessionRef.current.end()
      sessionRef.current = null
    }
    
    if (rendererRef.current) {
      rendererRef.current.dispose()
      rendererRef.current = null
    }
    
    setIsSessionActive(false)
    setUseNormalCamera(false)
    setCapturedCount(0)
    capturedImagesRef.current = []
    
    onClose()
  }
  
  if (!isOpen) return null
  
  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        {/* 视频元素（普通摄像头模式） */}
        {useNormalCamera && (
          <video 
            ref={videoRef}
            className={styles.video}
            autoPlay
            playsInline
            muted
          />
        )}
        
        {/* AR画布（WebXR模式） */}
        <canvas 
          ref={canvasRef} 
          className={styles.arCanvas}
          style={{ display: useNormalCamera ? 'none' : 'block' }}
        />
        
        {/* UI控制面板 */}
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
            <p>状态: {isSessionActive ? (useNormalCamera ? '📹 普通摄像头' : '🟢 AR模式') : '🔴 未连接'}</p>
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
              <li>点击"启动AR相机"（需要支持AR的浏览器）</li>
              <li>允许摄像头和AR权限</li>
              <li>点击"开始拍摄"开始自动拍摄</li>
              <li>缓慢移动相机，每0.5秒自动拍摄一张</li>
              <li>拍摄{MAX_CAPTURES}张后自动停止</li>
              <li>点击"导出场景"保存</li>
            </ol>
            <p style={{color: '#ff6b6b', fontSize: '12px', marginTop: '8px'}}>
              注意：需要使用Chrome Android浏览器，并确保设备支持ARCore
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
