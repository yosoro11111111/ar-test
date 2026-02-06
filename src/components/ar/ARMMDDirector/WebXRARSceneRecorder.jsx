import React, { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'
import styles from './WebXRARSceneRecorder.module.css'
import JSZip from 'jszip'

/**
 * AR全景拍摄组件 - AR追踪位置 + 普通摄像头拍摄画面
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
  const cameraRef = useRef(null)
  const streamRef = useRef(null)
  const capturedImagesRef = useRef([])
  const lastCaptureTimeRef = useRef(0)
  const isCapturingRef = useRef(false)
  const imageCaptureRef = useRef(null)
  
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedCount, setCapturedCount] = useState(0)
  const [sceneName, setSceneName] = useState('')
  const [error, setError] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')
  
  const MAX_CAPTURES = 20
  const CAPTURE_INTERVAL = 500
  
  // UI容器ref
  const uiContainerRef = useRef(null)
  
  // 启动AR会话和普通摄像头
  const startARSession = async () => {
    try {
      // 1. 先启动普通摄像头
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
        
        // 创建 ImageCapture 对象（如果支持）
        try {
          const track = stream.getVideoTracks()[0]
          if (track && typeof ImageCapture !== 'undefined') {
            imageCaptureRef.current = new ImageCapture(track)
            console.log('ImageCapture 已创建')
          }
        } catch (e) {
          console.log('ImageCapture 不支持:', e)
        }
      }
      
      // 2. 请求AR会话（用于追踪位置）
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['local-floor'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: uiContainerRef.current }
      })
      
      sessionRef.current = session
      
      // 3. 创建渲染器（用于AR追踪）
      const gl = canvasRef.current.getContext('webgl2', { xrCompatible: true }) 
        || canvasRef.current.getContext('webgl', { xrCompatible: true })
      
      if (!gl) {
        throw new Error('无法创建WebGL上下文')
      }
      
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        context: gl,
        alpha: true,
        antialias: true
      })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(window.devicePixelRatio)
      rendererRef.current = renderer
      
      // 4. 创建相机
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
      cameraRef.current = camera
      
      // 5. 设置XR渲染
      const baseLayer = new XRWebGLLayer(session, gl)
      await session.updateRenderState({ baseLayer })
      
      // 6. 设置参考空间并启动渲染循环
      const referenceSpace = await session.requestReferenceSpace('local-floor')
      
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
        
        session.requestAnimationFrame(onXRFrame)
      }
      
      session.requestAnimationFrame(onXRFrame)
      
      setIsSessionActive(true)
      setDebugInfo('AR和摄像头已启动，点击"开始拍摄"')
      
    } catch (err) {
      console.error('启动失败:', err)
      setError('启动失败: ' + err.message)
    }
  }
  
  // 开始拍摄
  const startCapture = () => {
    if (!isSessionActive) {
      setError('请先启动AR相机')
      return
    }
    
    setIsCapturing(true)
    isCapturingRef.current = true
    setCapturedCount(0)
    capturedImagesRef.current = []
    lastCaptureTimeRef.current = 0
    
    setDebugInfo(`开始拍摄，每${CAPTURE_INTERVAL/1000}秒拍摄一张，共${MAX_CAPTURES}张\n请移动相机拍摄不同角度`)

    // 使用 requestAnimationFrame 循环来拍摄，确保捕获到最新帧
    const captureLoop = () => {
      if (!isCapturingRef.current || capturedImagesRef.current.length >= MAX_CAPTURES) {
        return
      }
      
      const now = Date.now()
      if (now - lastCaptureTimeRef.current >= CAPTURE_INTERVAL) {
        captureFrame(now)
      }
      
      requestAnimationFrame(captureLoop)
    }
    
    requestAnimationFrame(captureLoop)
  }
  
  // 拍摄单帧 - 从普通摄像头捕获
  const captureFrame = async (now) => {
    if (capturedImagesRef.current.length >= MAX_CAPTURES) {
      stopCapture()
      return
    }
    
    if (!videoRef.current || !cameraRef.current) return
    
    // 获取当前相机位置
    const currentPosition = {
      x: cameraRef.current.position.x,
      y: cameraRef.current.position.y,
      z: cameraRef.current.position.z
    }
    
    try {
      let imageData
      
      // 优先使用 ImageCapture API 获取最新帧
      if (imageCaptureRef.current) {
        try {
          const bitmap = await imageCaptureRef.current.grabFrame()
          const canvas = document.createElement('canvas')
          canvas.width = bitmap.width
          canvas.height = bitmap.height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(bitmap, 0, 0)
          
          // 添加时间戳水印
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
          ctx.font = '30px Arial'
          ctx.fillText(new Date().toISOString(), 20, 50)
          
          imageData = canvas.toDataURL('image/jpeg', 0.9)
          console.log('使用 ImageCapture 拍摄')
        } catch (e) {
          console.log('ImageCapture 失败，使用视频元素:', e)
          imageCaptureRef.current = null
        }
      }
      
      // 如果 ImageCapture 失败，使用视频元素
      if (!imageData) {
        const video = videoRef.current
        
        // 确保视频已经准备好并且有数据
        if (video.readyState < 2 || video.paused) {
          console.log('视频未准备好或已暂停，跳过')
          return
        }
        
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 1920
        canvas.height = video.videoHeight || 1080
        const ctx = canvas.getContext('2d')
        
        // 绘制当前视频帧
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // 添加时间戳水印
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.font = '30px Arial'
        ctx.fillText(new Date().toISOString(), 20, 50)
        
        imageData = canvas.toDataURL('image/jpeg', 0.9)
        console.log('使用视频元素拍摄')
      }
      
      // 记录AR相机位置
      const cameraPosition = { ...currentPosition }
      
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
        timestamp: now
      })
      
      // 更新最后拍摄时间
      lastCaptureTimeRef.current = now
      
      setCapturedCount(capturedImagesRef.current.length)
      setDebugInfo(`已拍摄 ${capturedImagesRef.current.length}/${MAX_CAPTURES} 张`)
      
      if (capturedImagesRef.current.length >= MAX_CAPTURES) {
        stopCapture()
      }
    } catch (err) {
      console.error('捕获帧失败:', err)
      setDebugInfo('捕获失败: ' + err.message)
    }
  }
  
  // 停止拍摄
  const stopCapture = () => {
    isCapturingRef.current = false
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
        captureMethod: 'ar-camera-hybrid',
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
          description: '全景拍摄布局，AR追踪位置+摄像头拍摄画面'
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
    setCapturedCount(0)
    capturedImagesRef.current = []
    
    onClose()
  }
  
  if (!isOpen) return null
  
  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        {/* 普通摄像头视频 */}
        <video 
          ref={videoRef}
          className={styles.video}
          autoPlay
          playsInline
          muted
        />
        
        {/* AR画布（隐藏，只用于追踪） */}
        <canvas 
          ref={canvasRef} 
          className={styles.arCanvas}
          style={{ display: 'none' }}
        />
        
        {/* DOM Overlay 容器 */}
        <div 
          ref={uiContainerRef}
          className={styles.uiOverlay}
        >
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
    </div>
  )
}
