import React, { useState, useRef, useEffect } from 'react'
import { ARScene } from './components/ARSystem'
import ModelViewer from './components/ModelViewer'
import modelList from './models/modelList'
import './App.css'

// ==================== 移动端检测 Hook ====================
const useMobileDetect = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
    }
    
    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])
  
  return { isMobile, isTablet, isDesktop: !isMobile && !isTablet }
}

// ==================== 启动画面组件 ====================
const SplashScreen = ({ onComplete, isMobile }) => {
  const [progress, setProgress] = useState(0)
  const [showText, setShowText] = useState(false)
  
  useEffect(() => {
    // 文字渐显
    setTimeout(() => setShowText(true), 300)
    
    // 进度条动画
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(onComplete, 500)
          return 100
        }
        return prev + Math.random() * 15 + 5
      })
    }, 150)
    
    return () => clearInterval(interval)
  }, [onComplete])
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      overflow: 'hidden'
    }}>
      {/* 动态背景粒子 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(255,182,193,0.2) 0%, transparent 40%)
        `,
        animation: 'gradientShift 8s ease-in-out infinite'
      }} />
      
      {/* 浮动装饰 */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: `${20 + i * 10}px`,
            height: `${20 + i * 10}px`,
            borderRadius: '50%',
            background: `rgba(255, 255, 255, ${0.1 - i * 0.01})`,
            left: `${10 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
            animation: `float${i % 3} ${3 + i * 0.5}s ease-in-out infinite`,
            filter: 'blur(2px)'
          }} />
        ))}
      </div>
      
      {/* Logo区域 */}
      <div style={{
        position: 'relative',
        marginBottom: '40px',
        opacity: showText ? 1 : 0,
        transform: showText ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        {/* 外圈光环 */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: isMobile ? '140px' : '200px',
          height: isMobile ? '140px' : '200px',
          borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.3)',
          animation: 'pulse 2s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: isMobile ? '120px' : '180px',
          height: isMobile ? '120px' : '180px',
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.2)',
          animation: 'pulse 2s ease-in-out infinite 0.5s'
        }} />
        
        {/* 主Logo */}
        <div style={{
          fontSize: isMobile ? '56px' : '80px',
          filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.3))',
          animation: 'bounce 2s ease-in-out infinite'
        }}>
          🌸
        </div>
      </div>
      
      {/* 标题 */}
      <h1 style={{
        fontSize: isMobile ? '32px' : '42px',
        fontWeight: '800',
        color: 'white',
        margin: '0 0 10px 0',
        textShadow: '0 4px 20px rgba(0,0,0,0.3)',
        opacity: showText ? 1 : 0,
        transform: showText ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s',
        letterSpacing: '2px'
      }}>
        AETHERIS
      </h1>
      
      <p style={{
        fontSize: isMobile ? '12px' : '16px',
        color: 'rgba(255,255,255,0.8)',
        margin: '0 0 50px 0',
        opacity: showText ? 1 : 0,
        transform: showText ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s',
        letterSpacing: isMobile ? '4px' : '8px'
      }}>
        AR MODEL SYSTEM
      </p>
      
      {/* 进度条 */}
      <div style={{
        width: isMobile ? '200px' : '280px',
        height: '6px',
        background: 'rgba(255,255,255,0.2)',
        borderRadius: '3px',
        overflow: 'hidden',
        opacity: showText ? 1 : 0,
        transform: showText ? 'scaleX(1)' : 'scaleX(0)',
        transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s'
      }}>
        <div style={{
          width: `${Math.min(progress, 100)}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '3px',
          transition: 'width 0.3s ease-out',
          boxShadow: '0 0 20px rgba(240, 147, 251, 0.5)'
        }} />
      </div>
      
      <p style={{
        fontSize: '12px',
        color: 'rgba(255,255,255,0.6)',
        marginTop: '15px',
        opacity: showText ? 1 : 0,
        transition: 'opacity 0.5s ease 0.4s'
      }}>
        加载中... {Math.min(Math.round(progress), 100)}%
      </p>
      
      {/* CSS动画 */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.8; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float0 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes float1 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-180deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(90deg); }
        }
        @keyframes gradientShift {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ==================== 二次元角色卡片组件 ====================
const CharacterCard = ({ model, index, onSelect, isSelected, isMobile }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  
  // 根据角色名生成颜色主题
  const getThemeColor = (name) => {
    const colors = [
      { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', accent: '#a78bfa' },
      { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', accent: '#f472b6' },
      { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', accent: '#60a5fa' },
      { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', accent: '#34d399' },
      { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', accent: '#fbbf24' },
      { bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', accent: '#f9a8d4' },
    ]
    return colors[index % colors.length]
  }
  
  const theme = getThemeColor(model.name)
  
  return (
    <div
      onClick={() => onSelect(model)}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      onTouchStart={() => isMobile && setIsPressed(true)}
      onTouchEnd={() => isMobile && setIsPressed(false)}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '3/4',
        borderRadius: isMobile ? '16px' : '20px',
        overflow: 'hidden',
        cursor: 'pointer',
        transform: isMobile 
          ? (isPressed ? 'scale(0.95)' : 'scale(1)')
          : (isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)'),
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: isHovered || isPressed
          ? `0 20px 40px rgba(0,0,0,0.3), 0 0 30px ${theme.accent}40`
          : '0 10px 30px rgba(0,0,0,0.2)',
        background: theme.bg,
      }}
    >
      {/* 卡片背景装饰 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 30% 20%, rgba(255,255,255,0.3) 0%, transparent 50%),
          radial-gradient(circle at 70% 80%, rgba(255,255,255,0.2) 0%, transparent 40%)
        `,
        opacity: isHovered ? 1 : 0.7,
        transition: 'opacity 0.3s ease'
      }} />
      
      {/* 角色立绘占位区 */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '70%',
        aspectRatio: '1',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.2)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: isMobile ? '36px' : '48px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        border: '2px solid rgba(255,255,255,0.3)'
      }}>
        {model.avatar || ['🌸', '⭐', '🌙', '💫', '🎀', '💎'][index % 6]}
      </div>
      
      {/* 角色名称 */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: isMobile ? '12px' : '20px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
      }}>
        <h3 style={{
          margin: 0,
          fontSize: isMobile ? '13px' : '16px',
          fontWeight: '700',
          color: 'white',
          textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          letterSpacing: '1px'
        }}>
          {model.name}
        </h3>
        <p style={{
          margin: '5px 0 0 0',
          fontSize: isMobile ? '9px' : '11px',
          color: 'rgba(255,255,255,0.8)',
          letterSpacing: '2px'
        }}>
          CHARACTER {String(index + 1).padStart(2, '0')}
        </p>
      </div>
      
      {/* 选中标记 */}
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: '#10b981',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.5)',
          animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
          ✓
        </div>
      )}
      
      {/* 悬停光效 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
        transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)',
        transition: 'transform 0.6s ease'
      }} />
      
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

function App() {
  const { isMobile, isTablet } = useMobileDetect()
  const [showSplash, setShowSplash] = useState(true)
  const [showFileInput, setShowFileInput] = useState(true)
  const [showModelSelect, setShowModelSelect] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [modelUrl, setModelUrl] = useState(null)
  const [selectedModelIndex, setSelectedModelIndex] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const fileInputRef = useRef(null)

  // 处理文件选择
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const isValidFile = file.type === 'model/gltf-binary' || 
                         file.type === 'application/octet-stream' ||
                         file.name.endsWith('.vrm') || 
                         file.name.endsWith('.glb') ||
                         file.name.endsWith('.gltf')
      
      if (isValidFile) {
        console.log('检测到有效文件:', file.name, '类型:', file.type)
        setSelectedFile(file)
        const url = URL.createObjectURL(file)
        setModelUrl(url)
        setIsLoading(true)
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

  // 处理本地模型选择
  const handleSelectLocalModel = async (model, index) => {
    console.log('选择本地模型:', model.name, '文件:', model.filename)
    setIsLoading(true)
    setLoadError(null)
    setSelectedModelIndex(index)
    
    const modelPath = `/models/${model.filename}`
    console.log('模型路径:', modelPath)
    
    try {
      // 检查文件是否存在
      const response = await fetch(modelPath, { method: 'HEAD' })
      if (!response.ok) {
        throw new Error(`模型文件不存在: ${modelPath}`)
      }
      
      // 获取文件大小
      const fileSize = response.headers.get('content-length') || 0
      console.log('模型文件大小:', (fileSize / 1024 / 1024).toFixed(2), 'MB')
      
      // 创建一个包含实际内容的 Blob（至少要有一些内容）
      const dummyContent = new Uint8Array(1)
      dummyContent[0] = 0
      const blob = new Blob([dummyContent], { type: 'model/gltf-binary' })
      
      const modelFile = new File([blob], model.filename, { 
        type: 'model/gltf-binary',
        lastModified: Date.now()
      })
      // 添加自定义属性
      modelFile.localPath = modelPath
      
      setSelectedFile(modelFile)
      setModelUrl(modelPath)
      
      // 延迟关闭加载界面，让ARScene有时间初始化
      setTimeout(() => {
        setIsLoading(false)
        setShowModelSelect(false)
        setShowFileInput(false)
      }, 1200)
    } catch (error) {
      console.error('模型加载失败:', error)
      setLoadError(`加载失败: ${model.name}`)
      setIsLoading(false)
      setSelectedModelIndex(null)
      
      // 3秒后清除错误信息
      setTimeout(() => setLoadError(null), 3000)
    }
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
    setSelectedModelIndex(null)
  }

  return (
    <div className="app-container" style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      position: 'relative'
    }}>
      {/* 启动画面 */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} isMobile={isMobile} />}
      
      {/* 背景装饰 */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(102, 126, 234, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(240, 147, 251, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(118, 75, 162, 0.1) 0%, transparent 60%)
        `,
        zIndex: 0
      }} />
      
      {/* 文件上传界面 */}
      {showFileInput && !showSplash && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(20, 20, 35, 0.95)',
          color: 'white',
          padding: '40px',
          borderRadius: '30px',
          zIndex: 1000,
          textAlign: 'center',
          width: '95%',
          maxWidth: '480px',
          boxSizing: 'border-box',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          animation: 'fadeInUp 0.6s ease-out'
        }}>
          <style>{`
            @keyframes fadeInUp {
              from { opacity: 0; transform: translate(-50%, -40%); }
              to { opacity: 1; transform: translate(-50%, -50%); }
            }
          `}</style>
          
          {/* Logo */}
          <div style={{
            width: isMobile ? '70px' : '90px',
            height: isMobile ? '70px' : '90px',
            margin: '0 auto 25px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '32px' : '40px',
            boxShadow: '0 10px 40px rgba(102, 126, 234, 0.4)',
            animation: 'float 3s ease-in-out infinite'
          }}>
            🌸
          </div>
          
          <h3 style={{
            fontSize: isMobile ? '24px' : '28px',
            marginBottom: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #f093fb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '800',
            letterSpacing: '1px'
          }}>
            AETHERIS
          </h3>
          
          <p style={{
            fontSize: isMobile ? '12px' : '14px',
            marginBottom: '35px',
            lineHeight: '1.6',
            color: 'rgba(255, 255, 255, 0.6)',
            letterSpacing: '3px'
          }}>
            AR MODEL SYSTEM
          </p>
          
          {/* 文件上传区域 */}
          <div style={{
            marginBottom: '20px',
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
              padding: '35px 25px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '2px dashed rgba(102, 126, 234, 0.4)',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              zIndex: '1'
            }}>
              <div style={{
                fontSize: '36px',
                marginBottom: '12px',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
              }}>📁</div>
              <p style={{
                margin: '0 0 8px 0',
                fontSize: '15px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: '500'
              }}>点击或拖拽文件到此处</p>
              <p style={{
                margin: 0,
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.4)'
              }}>支持 .vrm .glb .gltf 格式</p>
            </div>
          </div>
          
          {/* 分隔线 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '25px 0',
            color: 'rgba(255,255,255,0.3)',
            fontSize: '12px'
          }}>
            <div style={{flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)'}} />
            <span style={{padding: '0 15px'}}>OR</span>
            <div style={{flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)'}} />
          </div>
          
          <button
            onClick={openModelSelect}
            style={{
              padding: isMobile ? '14px 24px' : '16px 28px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '14px',
              cursor: 'pointer',
              fontSize: isMobile ? '14px' : '15px',
              fontWeight: '700',
              width: '100%',
              boxShadow: '0 8px 25px rgba(240, 147, 251, 0.4)',
              transition: 'all 0.3s ease',
              letterSpacing: '1px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px)'
              e.target.style.boxShadow = '0 12px 35px rgba(240, 147, 251, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 8px 25px rgba(240, 147, 251, 0.4)'
            }}
          >
            ✨ 从角色库选择
          </button>
        </div>
      )}

      {/* 模型选择界面 - 二次元卡片风格 */}
      {showModelSelect && !showSplash && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(20, 20, 35, 0.98)',
          color: 'white',
          padding: isMobile ? '20px' : '35px',
          borderRadius: isMobile ? '20px' : '30px',
          zIndex: 1000,
          width: '95%',
          maxWidth: '900px',
          maxHeight: '90vh',
          boxSizing: 'border-box',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          animation: 'fadeInUp 0.5s ease-out'
        }}>
          {/* 标题栏 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: isMobile ? '20px' : '30px',
            paddingBottom: isMobile ? '15px' : '20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div>
              <h3 style={{
                fontSize: isMobile ? '22px' : '26px',
                background: 'linear-gradient(135deg, #667eea 0%, #f093fb 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: '800',
                margin: '0 0 5px 0',
                letterSpacing: '1px'
              }}>
                选择角色
              </h3>
              <p style={{
                margin: 0,
                fontSize: isMobile ? '10px' : '12px',
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '2px'
              }}>
                SELECT YOUR CHARACTER
              </p>
            </div>
            <button
              onClick={closeModelSelect}
              style={{
                padding: isMobile ? '8px 16px' : '10px 20px',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: isMobile ? '12px' : '13px',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(239, 68, 68, 0.3)'
                e.target.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(239, 68, 68, 0.2)'
                e.target.style.transform = 'scale(1)'
              }}
            >
              {isMobile ? '✕' : '✕ 关闭'}
            </button>
          </div>
          
          {/* 角色卡片网格 */}
          <div style={{
            maxHeight: 'calc(90vh - 200px)',
            overflowY: 'auto',
            paddingRight: '10px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile 
                ? 'repeat(3, 1fr)' 
                : 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: isMobile ? '12px' : '20px',
              padding: '5px'
            }}>
              {modelList.map((model, index) => (
                <CharacterCard
                  key={index}
                  model={model}
                  index={index}
                  onSelect={(m) => handleSelectLocalModel(m, index)}
                  isSelected={selectedModelIndex === index}
                  isMobile={isMobile}
                />
              ))}
            </div>
          </div>
          
          {/* 底部信息 */}
          <div style={{
            marginTop: isMobile ? '20px' : '25px',
            paddingTop: isMobile ? '15px' : '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <p style={{
              margin: 0,
              fontSize: isMobile ? '12px' : '13px',
              color: 'rgba(255,255,255,0.5)'
            }}>
              <span style={{color: '#f093fb', fontWeight: '700'}}>{modelList.length}</span> 个角色可用
            </p>
            <div style={{
              display: 'flex',
              gap: '10px',
              fontSize: isMobile ? '16px' : '20px'
            }}>
              <span>🌸</span>
              <span>⭐</span>
              <span>🌙</span>
            </div>
          </div>
        </div>
      )}

      {/* 加载中界面 */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: isMobile ? '35px' : '50px',
          borderRadius: '24px',
          zIndex: 2000,
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{
            width: isMobile ? '50px' : '70px',
            height: isMobile ? '50px' : '70px',
            margin: '0 auto 25px',
            borderRadius: '50%',
            border: '4px solid rgba(102, 126, 234, 0.2)',
            borderTop: '4px solid #667eea',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{
            fontSize: isMobile ? '16px' : '18px',
            fontWeight: '600',
            margin: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #f093fb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            加载模型中...
          </p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* 错误提示 */}
      {loadError && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(239, 68, 68, 0.95)',
          color: 'white',
          padding: isMobile ? '12px 20px' : '15px 30px',
          borderRadius: '12px',
          zIndex: 3000,
          fontSize: isMobile ? '14px' : '16px',
          fontWeight: '600',
          boxShadow: '0 10px 30px rgba(239, 68, 68, 0.4)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          ⚠️ {loadError}
          <style>{`
            @keyframes slideDown {
              from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
              to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* AR场景 */}
      {!showFileInput && selectedFile && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 100
        }}>
          <ARScene modelFile={selectedFile} />
        </div>
      )}
    </div>
  )
}

export default App
