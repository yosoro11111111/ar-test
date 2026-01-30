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
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          zIndex: 1000
        }}>
          加载模型中...
        </div>
      )}
      
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 0, 0, 0.8)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          zIndex: 1000
        }}>
          {error}
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
        poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f0f0f0'/%3E%3Ctext x='200' y='200' font-family='Arial' font-size='20' text-anchor='middle' dominant-baseline='middle' fill='%23666'%3E加载模型中...%3C/text%3E%3C/svg%3E"
      >
        {/* AR按钮插槽 */}
        <button
          slot="ar-button"
          style={{
            background: '#646cff',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            fontSize: '24px',
            cursor: 'pointer',
            position: 'absolute',
            bottom: '30px',
            right: '30px',
            boxShadow: '0 4px 15px rgba(100, 108, 255, 0.4)'
          }}
        >
          📱
        </button>

        {/* 加载失败时的内容 */}
        <div slot="error" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          color: 'red'
        }}>
          模型加载失败，请检查文件格式是否正确
        </div>
      </model-viewer>
    </div>
  )
}

export default ModelViewer