import React, { useState, useRef, useEffect } from 'react'
import { ARScene } from './components/ARSystem'
import ModelViewer from './components/ModelViewer'
import modelList from './models/modelList'
import './App.css'

function App() {
  const [showFileInput, setShowFileInput] = useState(true)
  const [showModelSelect, setShowModelSelect] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [modelUrl, setModelUrl] = useState(null)
  const [renderMode, setRenderMode] = useState('ar') // 'ar' 或 'model-viewer'
  const [localModels, setLocalModels] = useState([])
  const [showLocalModels, setShowLocalModels] = useState(false)
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

  // 处理本地模型选择
  const handleLocalModelSelect = (model) => {
    console.log('选择本地模型:', model.name)
    setIsLoading(true)
    
    // 创建本地模型对象
    const localModel = {
      name: model.name,
      localPath: `/models/${model.filename}`,
      // 添加必要的属性，使其与文件对象结构兼容
      type: 'model/gltf-binary',
      size: 0 // 本地模型不需要大小
    }
    
    setSelectedFile(localModel)
    setModelUrl(`/models/${model.filename}`)
    
    setTimeout(() => {
      setIsLoading(false)
      setShowFileInput(false)
      setShowModelSelect(false)
    }, 1000)
  }

  // 显示本地模型选择界面
  const showLocalModelSelect = () => {
    setShowModelSelect(true)
  }

  // 隐藏本地模型选择界面
  const hideLocalModelSelect = () => {
    setShowModelSelect(false)
  }

  // 从本地模型库选择模型
  const handleSelectLocalModel = (model) => {
    console.log('选择本地模型:', model.name, '文件:', model.filename)
    setIsLoading(true)
    
    // 创建本地模型的URL
    const modelPath = `/models/${model.filename}`
    console.log('模型路径:', modelPath)
    
    // 模拟加载过程
    setTimeout(() => {
      // 创建一个虚拟的File对象，用于传递给ARScene
      const virtualFile = new File([''], model.filename, { type: 'model/gltf-binary' })
      virtualFile.localPath = modelPath
      
      setSelectedFile(virtualFile)
      setModelUrl(modelPath)
      setIsLoading(false)
      setShowModelSelect(false)
      setShowFileInput(false)
    }, 1000)
  }

  // 打开模型选择界面
  const openModelSelect = () => {
    setShowFileInput(false)
    setShowModelSelect(true)
  }

  // 关闭模型选择界面
  const closeModelSelect = () => {
    setShowModelSelect(false)
    setShowFileInput(true)
  }

  return (
    <div className="app-container" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* 文件上传界面 */}
      {showFileInput && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '30px',
          borderRadius: '20px',
          zIndex: 1000,
          textAlign: 'center',
          width: '95%',
          maxWidth: '500px',
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
              marginBottom: '20px',
              width: '100%',
              padding: '12px',
              boxSizing: 'border-box',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(100, 108, 255, 0.5)',
              borderRadius: '8px',
              color: 'white'
            }}
          />
          <button
            onClick={openModelSelect}
            style={{
              padding: '12px 24px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              width: '100%',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.3s ease'
            }}
          >
            从本地模型库选择
          </button>
        </div>
      )}

      {/* 模型选择界面 */}
      {showModelSelect && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.95)',
          color: 'white',
          padding: '25px',
          borderRadius: '16px',
          zIndex: 1000,
          width: '95%',
          maxWidth: '500px',
          maxHeight: '80vh',
          boxSizing: 'border-box',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{
              fontSize: '20px',
              color: '#646cff',
              fontWeight: '600',
              margin: 0
            }}>选择模型</h3>
            <button
              onClick={closeModelSelect}
              style={{
                padding: '8px 16px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              关闭
            </button>
          </div>
          <div style={{
            maxHeight: 'calc(80vh - 120px)',
            overflowY: 'auto',
            paddingRight: '10px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '12px'
            }}>
              {modelList.map((model, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectLocalModel(model)}
                  style={{
                    padding: '12px',
                    background: 'rgba(100, 108, 255, 0.2)',
                    color: 'white',
                    border: '2px solid rgba(100, 108, 255, 0.5)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    textAlign: 'center',
                    minHeight: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(100, 108, 255, 0.4)'
                    e.target.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(100, 108, 255, 0.2)'
                    e.target.style.transform = 'scale(1)'
                  }}
                >
                  {model.name}
                </button>
              ))}
            </div>
          </div>
          <div style={{
            marginTop: '20px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center'
          }}>
            共 {modelList.length} 个模型可供选择
          </div>
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