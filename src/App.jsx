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
    <div className="app-container" style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
      position: 'relative'
    }}>
      {/* 背景装饰 */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
        zIndex: 0
      }} />
      
      {/* 文件上传界面 */}
      {showFileInput && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(15, 23, 42, 0.95)',
          color: 'white',
          padding: '35px',
          borderRadius: '24px',
          zIndex: 1000,
          textAlign: 'center',
          width: '95%',
          maxWidth: '500px',
          boxSizing: 'border-box',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px',
            animation: 'float 3s ease-in-out infinite'
          }}>✨</div>
          <h3 style={{
            fontSize: '24px',
            marginBottom: '16px',
            color: '#60a5fa',
            fontWeight: '700',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>AR模型系统</h3>
          <p style={{
            fontSize: '16px',
            marginBottom: '30px',
            lineHeight: '1.5',
            color: 'rgba(255, 255, 255, 0.8)',
            maxWidth: '400px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>选择一个VRM格式的模型文件，或从本地模型库中选择</p>
          
          {/* 文件上传区域 */}
          <div style={{
            marginBottom: '24px',
            position: 'relative'
          }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".vrm,.glb,model/gltf-binary"
              onChange={handleFileChange}
              style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                opacity: '0',
                cursor: 'pointer',
                zIndex: '2'
              }}
            />
            <div style={{
              padding: '40px 20px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '2px dashed rgba(96, 165, 250, 0.5)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              zIndex: '1'
            }}>
              <div style={{
                fontSize: '32px',
                marginBottom: '12px'
              }}>📁</div>
              <p style={{
                margin: '0',
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>点击或拖拽文件到此处上传</p>
              <p style={{
                margin: '8px 0 0 0',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>支持 .vrm, .glb, .gltf 格式</p>
            </div>
          </div>
          
          <button
            onClick={openModelSelect}
            style={{
              padding: '16px 24px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              width: '100%',
              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 12px 30px rgba(16, 185, 129, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)'
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
          background: 'rgba(15, 23, 42, 0.95)',
          color: 'white',
          padding: '30px',
          borderRadius: '24px',
          zIndex: 1000,
          width: '95%',
          maxWidth: '600px',
          maxHeight: '85vh',
          boxSizing: 'border-box',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{
              fontSize: '24px',
              color: '#60a5fa',
              fontWeight: '700',
              margin: 0,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}>选择模型</h3>
            <button
              onClick={closeModelSelect}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.4)'
              }}
            >
              关闭
            </button>
          </div>
          <div style={{
            maxHeight: 'calc(85vh - 150px)',
            overflowY: 'auto',
            paddingRight: '15px',
            marginBottom: '16px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '16px'
            }}>
              {modelList.map((model, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectLocalModel(model)}
                  style={{
                    padding: '16px',
                    background: 'rgba(96, 165, 250, 0.15)',
                    color: 'white',
                    border: '2px solid rgba(96, 165, 250, 0.4)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    textAlign: 'center',
                    minHeight: '90px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(96, 165, 250, 0.3)'
                    e.target.style.transform = 'scale(1.08)'
                    e.target.style.boxShadow = '0 8px 25px rgba(96, 165, 250, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(96, 165, 250, 0.15)'
                    e.target.style.transform = 'scale(1)'
                    e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    fontSize: '10px',
                    background: 'rgba(96, 165, 250, 0.2)',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    color: '#93c5fd'
                  }}>Model {index + 1}</div>
                  <div style={{
                    position: 'relative',
                    zIndex: 1
                  }}>{model.name}</div>
                </button>
              ))}
            </div>
          </div>
          <div style={{
            marginTop: '20px',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.6)',
            textAlign: 'center',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{fontSize: '18px', marginBottom: '8px', color: '#60a5fa'}}>🧸</div>
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
          background: 'rgba(15, 23, 42, 0.95)',
          color: 'white',
          padding: '30px',
          borderRadius: '20px',
          zIndex: 1000,
          fontSize: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center',
          minWidth: '200px'
        }}>
          <div style={{
            fontSize: '32px',
            marginBottom: '16px',
            animation: 'spin 2s linear infinite'
          }}>🔄</div>
          <p style={{
            margin: 0,
            color: '#60a5fa',
            fontWeight: '600'
          }}>加载中...</p>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>正在加载模型资源</p>
        </div>
      )}

      {/* 模式切换按钮 */}
      {!showFileInput && !isLoading && (
        <button
          onClick={toggleRenderMode}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            padding: '14px 20px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            zIndex: 1000,
            boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)'
            e.target.style.boxShadow = '0 12px 30px rgba(99, 102, 241, 0.5)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.4)'
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