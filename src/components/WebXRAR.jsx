import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'

// WebXR AR 管理器
export const useWebXRAR = () => {
  const [isSupported, setIsSupported] = useState(false)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [hitTestSource, setHitTestSource] = useState(null)
  const [referenceSpace, setReferenceSpace] = useState(null)
  const sessionRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const hitTestResultsRef = useRef([])
  const [placementPosition, setPlacementPosition] = useState(null)
  const [isPlaced, setIsPlaced] = useState(false)

  // 检查 WebXR 支持
  useEffect(() => {
    const checkSupport = async () => {
      if ('xr' in navigator) {
        try {
          const supported = await navigator.xr.isSessionSupported('immersive-ar')
          setIsSupported(supported)
          console.log('WebXR AR 支持:', supported)
        } catch (e) {
          console.log('WebXR 不支持:', e)
          setIsSupported(false)
        }
      } else {
        setIsSupported(false)
      }
    }
    checkSupport()
  }, [])

  // 启动 AR 会话
  const startARSession = useCallback(async (canvas) => {
    if (!isSupported) {
      alert('您的设备不支持 WebXR AR')
      return false
    }

    try {
      // 请求 AR 会话
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'local-floor'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: document.body }
      })

      sessionRef.current = session

      // 首先获取 XR 兼容的 WebGL 上下文
      const gl = canvas.getContext('webgl2', { 
        xrCompatible: true,
        alpha: true,
        antialias: true
      }) || canvas.getContext('webgl', { 
        xrCompatible: true,
        alpha: true,
        antialias: true
      })
      
      if (!gl) {
        throw new Error('无法创建 WebGL 上下文')
      }

      // 创建 WebGL 渲染器 - 使用已创建的上下文
      const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        context: gl,
        alpha: true,
        antialias: true
      })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.xr.enabled = true
      
      // 配置 XR 渲染层
      const baseLayer = new XRWebGLLayer(session, gl)
      session.updateRenderState({ 
        baseLayer,
        depthNear: 0.1,
        depthFar: 1000
      })
      
      rendererRef.current = renderer

      // 创建场景
      const scene = new THREE.Scene()
      sceneRef.current = scene

      // 创建相机 - 使用 XR 相机
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      )
      cameraRef.current = camera

      // 获取参考空间
      const refSpace = await session.requestReferenceSpace('local-floor')
      setReferenceSpace(refSpace)

      // 设置 Hit Test
      const viewerSpace = await session.requestReferenceSpace('viewer')
      const hitSource = await session.requestHitTestSource({
        space: viewerSpace
      })
      setHitTestSource(hitSource)

      // 监听会话结束
      session.addEventListener('end', () => {
        setIsSessionActive(false)
        setHitTestSource(null)
        setReferenceSpace(null)
        setPlacementPosition(null)
        setIsPlaced(false)
      })

      setIsSessionActive(true)
      console.log('AR 会话已启动')

      // 开始渲染循环
      startRenderLoop(session, renderer, scene, camera, hitSource, refSpace)

      return true
    } catch (error) {
      console.error('启动 AR 会话失败:', error)
      alert('启动 AR 失败: ' + error.message)
      return false
    }
  }, [isSupported])

  // 渲染循环
  const startRenderLoop = (session, renderer, scene, camera, hitSource, refSpace) => {
    const onXRFrame = (time, frame) => {
      if (!sessionRef.current) return

      const pose = frame.getViewerPose(refSpace)
      
      if (pose) {
        // 获取 Hit Test 结果
        const hitTestResults = frame.getHitTestResults(hitSource)
        hitTestResultsRef.current = hitTestResults

        if (hitTestResults.length > 0 && !isPlaced) {
          const hitPose = hitTestResults[0].getPose(refSpace)
          if (hitPose) {
            const position = new THREE.Vector3(
              hitPose.transform.position.x,
              hitPose.transform.position.y,
              hitPose.transform.position.z
            )
            setPlacementPosition(position)
          }
        }
        
        // 更新相机位置
        const view = pose.views[0]
        camera.matrix.fromArray(view.transform.matrix)
        camera.matrix.decompose(camera.position, camera.quaternion, camera.scale)
      }

      renderer.render(scene, camera)
      session.requestAnimationFrame(onXRFrame)
    }

    session.requestAnimationFrame(onXRFrame)
  }

  // 放置角色
  const placeCharacter = useCallback(() => {
    if (placementPosition) {
      setIsPlaced(true)
      console.log('角色放置在:', placementPosition)
      return placementPosition
    }
    return null
  }, [placementPosition])

  // 结束 AR 会话
  const endARSession = useCallback(async () => {
    if (sessionRef.current) {
      await sessionRef.current.end()
      sessionRef.current = null
    }
    if (rendererRef.current) {
      rendererRef.current.dispose()
      rendererRef.current = null
    }
    setIsSessionActive(false)
  }, [])

  return {
    isSupported,
    isSessionActive,
    placementPosition,
    isPlaced,
    startARSession,
    endARSession,
    placeCharacter,
    hitTestResults: hitTestResultsRef.current
  }
}

// WebXR AR 组件
export const WebXRAR = ({ 
  character, 
  onPositionChange,
  onClose,
  isMobile 
}) => {
  const canvasRef = useRef(null)
  const {
    isSupported,
    isSessionActive,
    placementPosition,
    isPlaced,
    startARSession,
    endARSession,
    placeCharacter
  } = useWebXRAR()

  const [isStarting, setIsStarting] = useState(false)

  // 启动 AR
  const handleStartAR = async () => {
    if (!canvasRef.current) return
    setIsStarting(true)
    const success = await startARSession(canvasRef.current)
    setIsStarting(false)
  }

  // 放置角色
  const handlePlace = () => {
    const pos = placeCharacter()
    if (pos && onPositionChange) {
      onPositionChange([pos.x, pos.y, pos.z])
    }
  }

  // 关闭 AR
  const handleClose = async () => {
    await endARSession()
    onClose?.()
  }

  if (!isSupported) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      }}>
        <div style={{
          background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)',
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>📱</div>
          <h2 style={{ color: 'white', marginBottom: '16px' }}>设备不支持</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '24px' }}>
            您的设备或浏览器不支持 WebXR AR 功能。请使用支持 WebXR 的浏览器（如 Chrome Android）或更新您的设备。
          </p>
          <button
            onClick={handleClose}
            style={{
              padding: '12px 32px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            关闭
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10000,
      background: 'black'
    }}>
      {/* AR Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />

      {/* UI 覆盖层 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px'
      }}>
        {/* 顶部提示 */}
        <div style={{
          background: 'rgba(0,0,0,0.6)',
          padding: '16px 24px',
          borderRadius: '12px',
          textAlign: 'center',
          pointerEvents: 'auto'
        }}>
          {!isSessionActive ? (
            <p style={{ color: 'white', margin: 0 }}>点击"启动 AR"开始体验</p>
          ) : !isPlaced ? (
            <p style={{ color: 'white', margin: 0 }}>
              {placementPosition 
                ? '检测到平面！点击"放置角色"将角色放在此处'
                : '移动设备扫描地面，寻找可放置区域...'}
            </p>
          ) : (
            <p style={{ color: '#4ade80', margin: 0 }}>✅ 角色已放置</p>
          )}
        </div>

        {/* 底部按钮 */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          pointerEvents: 'auto'
        }}>
          {!isSessionActive ? (
            <button
              onClick={handleStartAR}
              disabled={isStarting}
              style={{
                padding: '16px 32px',
                background: isStarting 
                  ? 'rgba(255,255,255,0.2)' 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: isStarting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
              }}
            >
              {isStarting ? '启动中...' : '🚀 启动 AR'}
            </button>
          ) : (
            <>
              {!isPlaced && placementPosition && (
                <button
                  onClick={handlePlace}
                  style={{
                    padding: '16px 32px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  ✓ 放置角色
                </button>
              )}
              <button
                onClick={handleClose}
                style={{
                  padding: '16px 32px',
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '18px',
                  cursor: 'pointer'
                }}
              >
                ✕ 退出 AR
              </button>
            </>
          )}
        </div>
      </div>

      {/* 放置指示器 */}
      {isSessionActive && !isPlaced && placementPosition && (
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '60px',
          height: '60px',
          border: '3px solid #4ade80',
          borderRadius: '50%',
          boxShadow: '0 0 20px rgba(74, 222, 128, 0.5)',
          animation: 'pulse 1.5s infinite'
        }} />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

export default WebXRAR
