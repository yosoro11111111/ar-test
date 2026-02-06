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
  const shouldCaptureRef = useRef(false)
  const lastCaptureTimeRef = useRef(0)
  
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
  
  // 启动AR会话
  const startARSession = async () => {
    try {
      // 请求AR会话 - 添加dom-overlay支持
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['local-floor'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: uiContainerRef.current }
      })
      
      sessionRef.current = session
      
      // 先获取XR兼容的WebGL上下文
      const gl = canvasRef.current.getContext('webgl2', { xrCompatible: true }) 
        || canvasRef.current.getContext('webgl', { xrCompatible: true })
      
      if (!gl) {
        throw new Error('无法创建WebGL上下文')
      }
      
      // 创建渲染器，使用已有的WebGL上下文
      // preserveDrawingBuffer: true 确保可以捕获画面
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        context: gl,
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true
      })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(window.devicePixelRatio)
      rendererRef.current = renderer
      
      // 创建相机
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
      cameraRef.current = camera
      
      // 手动创建XRWebGLLayer并设置渲染状态
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
        
        // 获取渲染层
        const baseLayer = session.renderState.baseLayer
        if (baseLayer && rendererRef.current) {
          const gl = rendererRef.current.getContext()
          
          // 绑定到XR层的framebuffer进行渲染
          gl.bindFramebuffer(gl.FRAMEBUFFER, baseLayer.framebuffer)
          rendererRef.current.render(new THREE.Scene(), cameraRef.current)
          
          // 处理拍摄 - 在渲染完成后捕获
          if (shouldCaptureRef.current) {
            const now = Date.now()
            if (now - lastCaptureTimeRef.current >= CAPTURE_INTERVAL) {
              lastCaptureTimeRef.current = now
              // 从XR层读取像素数据
              captureFrameFromXR(gl, baseLayer)
            }
          }
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
    shouldCaptureRef.current = true
    lastCaptureTimeRef.current = 0
    
    setDebugInfo(`开始拍摄，每${CAPTURE_INTERVAL/1000}秒拍摄一张，共${MAX_CAPTURES}张`)
  }
  
  // 从XR层捕获帧
  const captureFrameFromXR = (gl, baseLayer) => {
    if (capturedImagesRef.current.length >= MAX_CAPTURES) {
      stopCapture()
      return
    }
    
    if (!cameraRef.current) return
    
    try {
      // 获取视口尺寸
      const viewport = baseLayer.getViewport({
        eye: 'none',
        projectionMatrix: new Float32Array(16),
        transform: { 
          inverse: { matrix: new Float32Array(16) },
          matrix: new Float32Array(16),
          orientation: new Float32Array(4),
          position: new Float32Array(3)
        }
      }) || { width: 1920, height: 1080 }
      
      const width = viewport.width || 1920
      const height = viewport.height || 1080
      
      // 读取像素数据
      const pixels = new Uint8Array(width * height * 4)
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
      
      // 创建canvas并绘制像素数据
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      const imageData = ctx.createImageData(width, height)
      
      // 翻转Y轴（WebGL和Canvas的Y轴方向相反）
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const srcIdx = ((height - 1 - y) * width + x) * 4
          const dstIdx = (y * width + x) * 4
          imageData.data[dstIdx] = pixels[srcIdx]
          imageData.data[dstIdx + 1] = pixels[srcIdx + 1]
          imageData.data[dstIdx + 2] = pixels[srcIdx + 2]
          imageData.data[dstIdx + 3] = pixels[srcIdx + 3]
        }
      }
      
      ctx.putImageData(imageData, 0, 0)
      
      // 转换为JPEG
      const jpegData = canvas.toDataURL('image/jpeg', 0.9)
      
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
        imageData: jpegData,
        cameraPosition,
        cameraRotation,
        timestamp: Date.now()
      })
      
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
    shouldCaptureRef.current = false
    
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
        
        {/* DOM Overlay 容器 - 用于在AR画面上显示UI */}
        <div 
          ref={uiContainerRef}
          className={styles.uiOverlay}
          style={{ 
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 999999,
            pointerEvents: 'auto'
          }}
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
