import React, { useState, useRef, useEffect } from 'react'
import { ARScene } from './components/ARSystem'
import ModelViewer from './components/ModelViewer'
import './App.css'

function App() {
  const [showFileInput, setShowFileInput] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [modelUrl, setModelUrl] = useState(null)
  const [renderMode, setRenderMode] = useState('ar') // 'ar' 或 'model-viewer'
  const fileInputRef = useRef(null)

  // 处理文件选择
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // 更宽松的文件类型检测
      const isValidFile = file.type === 'model/gltf-binary' || 
                         file.type === 'application/octet-stream' ||
                         file.name.endsWith('.vrm') || 
                         file.name.endsWith('.glb') ||
                         file.name.endsWith('.gltf')
      
      if (isValidFile) {
        console.log('检测到有效文件:', file.name, '类型:', file.type)
        setSelectedFile(file)
        // 创建模型URL用于Model Viewer
        const url = URL.createObjectURL(file)
        setModelUrl(url)
        setIsLoading(true)
        // 模拟加载过程
        setTimeout(() => {
          setIsLoading(false)
          setShowFileInput(false)
        }, 1000)
      } else {
        alert('请选择有效的3D模型文件（支持.vrm、.glb、.gltf格式）')
      }
    }
  }

  // 清理URL对象
  useEffect(() => {
    return () => {
      if (modelUrl) {
        URL.revokeObjectURL(modelUrl)
      }
    }
  }, [modelUrl])

  // 切换渲染模式
  const toggleRenderMode = () => {
    setRenderMode(prevMode => prevMode === 'ar' ? 'model-viewer' : 'ar')
    console.log('切换渲染模式到:', renderMode === 'ar' ? 'model-viewer' : 'ar')
  }

  return (
    <div className="app-container">
      <h1>Aetheris: 幻梦之灵</h1>
      
      {/* 文件上传界面 */}
      {showFileInput && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '25px',
          borderRadius: '16px',
          zIndex: 1000,
          textAlign: 'center',
          width: '90%',
          maxWidth: '400px',
          boxSizing: 'border-box',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
        }}>
          <h3 style={{
            fontSize: '20px',
            marginBottom: '20px',
            color: '#646cff',
            fontWeight: '600'
          }}>加载VRM模型</h3>
          <p style={{
            fontSize: '16px',
            marginBottom: '25px',
            lineHeight: '1.4'
          }}>请选择一个VRM格式的模型文件（.vrm或.glb）</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".vrm,.glb,model/gltf-binary"
            onChange={handleFileChange}
            style={{
              marginTop: '10px',
              marginBottom: '10px',
              width: '100%',
              padding: '12px',
              boxSizing: 'border-box',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(100, 108, 255, 0.5)',
              borderRadius: '8px',
              color: 'white'
            }}
          />
        </div>
      )}
      
      {/* 加载指示器 */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '20px',
          borderRadius: '12px',
          zIndex: 1000,
          fontSize: '16px',
          boxShadow: '0 5px 20px rgba(0, 0, 0, 0.3)'
        }}>
          加载VRM模型中...
        </div>
      )}

      {/* 模式切换按钮 */}
      {!showFileInput && !isLoading && (
        <button
          onClick={toggleRenderMode}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            padding: '10px 16px',
            background: '#646cff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            zIndex: 1000,
            boxShadow: '0 2px 10px rgba(100, 108, 255, 0.4)'
          }}
        >
          切换到{renderMode === 'ar' ? 'Model Viewer' : 'AR模式'}
        </button>
      )}
      
      {/* 渲染内容 */}
      {!showFileInput && !isLoading && (
        renderMode === 'ar' ? (
          <ARScene selectedFile={selectedFile} />
        ) : (
          <ModelViewer modelUrl={modelUrl} />
        )
      )}
    </div>
  )
}

export default App