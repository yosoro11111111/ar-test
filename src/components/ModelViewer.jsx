import React, { useRef, useEffect, useState } from 'react'

// Model Viewer组件
const ModelViewer = ({ modelUrl, onARStatusChange }) => {
  const modelViewerRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (modelViewerRef.current) {
      // 监听模型加载完成
      const handleLoad = () => {
        setIsLoading(false)
        setError(null)
        console.log('Model Viewer: 模型加载完成')
      }

      // 监听加载错误
      const handleError = (event) => {
        setIsLoading(false)
        setError('模型加载失败')
        console.error('Model Viewer: 模型加载失败:', event.detail)
      }

      // 监听AR状态变化
      const handleARStatusChange = (event) => {
        const status = event.detail.status
        console.log('Model Viewer: AR状态变化:', status)
        if (onARStatusChange) {
          onARStatusChange(status)
        }
      }

      // 添加事件监听器
      const viewer = modelViewerRef.current
      viewer.addEventListener('load', handleLoad)
      viewer.addEventListener('error', handleError)
      viewer.addEventListener('ar-status', handleARStatusChange)

      // 清理函数
      return () => {
        viewer.removeEventListener('load', handleLoad)
        viewer.removeEventListener('error', handleError)
        viewer.removeEventListener('ar-status', handleARStatusChange)
      }
    }
  }, [onARStatusChange])

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(15, 23, 42, 0.9)',
          color: 'white',
          padding: '30px',
          borderRadius: '16px',
          zIndex: 1000,
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{fontSize: '48px', marginBottom: '20px', animation: 'spin 2s linear infinite'}}>🔄</div>
          <h3 style={{fontSize: '20px', marginBottom: '8px', color: '#60a5fa', fontWeight: '700', textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'}}>加载模型中...</h3>
          <p style={{color: '#93c5fd', fontSize: '14px', margin: 0}}>请稍候，正在准备3D模型</p>
        </div>
      )}
      
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(15, 23, 42, 0.9)',
          color: 'white',
          padding: '30px',
          borderRadius: '16px',
          zIndex: 1000,
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(239, 68, 68, 0.4)'
        }}>
          <div style={{fontSize: '48px', marginBottom: '20px'}}>❌</div>
          <h3 style={{fontSize: '20px', marginBottom: '8px', color: '#fca5a5', fontWeight: '700', textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'}}>{error}</h3>
          <p style={{color: '#fecaca', fontSize: '14px', margin: 0}}>请检查文件格式是否正确</p>
        </div>
      )}

      <model-viewer
        ref={modelViewerRef}
        src={modelUrl}
        ar
        camera-controls
        touch-action="pan-y"
        style={{ width: '100%', height: '100%' }}
        alt="3D模型"
        poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%231e3a8a'/%3E%3Ctext x='200' y='200' font-family='Arial' font-size='20' text-anchor='middle' dominant-baseline='middle' fill='%2360a5fa'%3E加载模型中...%3C/text%3E%3C/svg%3E"
      >
        {/* AR按钮插槽 */}
        <button
          slot="ar-button"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '70px',
            height: '70px',
            fontSize: '28px',
            cursor: 'pointer',
            position: 'absolute',
            bottom: '30px',
            right: '30px',
            boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)'
            e.target.style.boxShadow = '0 12px 30px rgba(99, 102, 241, 0.5)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)'
            e.target.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.4)'
          }}
        >
          📱
        </button>

        {/* 加载失败时的内容 */}
        <div slot="error" style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          color: 'white',
          padding: '40px'
        }}>
          <div style={{fontSize: '64px', marginBottom: '20px'}}>❌</div>
          <h3 style={{fontSize: '24px', marginBottom: '12px', color: '#fca5a5', fontWeight: '700'}}>模型加载失败</h3>
          <p style={{color: '#fecaca', fontSize: '16px', textAlign: 'center', maxWidth: '400px'}}>请检查文件格式是否正确，支持的格式包括.vrm、.glb和.gltf</p>
        </div>
      </model-viewer>
    </div>
  )
}

export default ModelViewer