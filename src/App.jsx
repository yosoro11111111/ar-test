import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ARScene } from './components/ARSystem'
import ModelViewer from './components/ModelViewer'
import LoadingScreen from './components/LoadingScreen'
import CharacterManager from './components/CharacterManager'
import ActionPanel from './components/ActionPanel'
import BoneEditor from './components/BoneEditor'
import PlaylistPanel from './components/PlaylistPanel'
import StageEffectsPanel from './components/StageEffectsPanel'
import SceneManager from './components/SceneManager'
import PosePanel from './components/PosePanel'
import { useAppSettings, useCharacterData, useCacheManager } from './hooks/useLocalStorage'
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

// ==================== 角色卡片组件 ====================
const CharacterCard = ({ model, index, onSelect, isSelected, isMobile }) => {
  const [isHovered, setIsHovered] = useState(false)
  
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
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '3/4',
        borderRadius: isMobile ? '12px' : '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: isHovered
          ? `0 15px 30px rgba(0,0,0,0.3), 0 0 20px ${theme.accent}40`
          : '0 8px 20px rgba(0,0,0,0.2)',
        background: theme.bg,
      }}
    >
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
      
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '60%',
        aspectRatio: '1',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.2)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: isMobile ? '28px' : '36px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        border: '2px solid rgba(255,255,255,0.3)'
      }}>
        {model.avatar || ['🌸', '⭐', '🌙', '💫', '🎀', '💎'][index % 6]}
      </div>
      
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: isMobile ? '10px' : '16px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
      }}>
        <h3 style={{
          margin: 0,
          fontSize: isMobile ? '12px' : '14px',
          fontWeight: '700',
          color: 'white',
          textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          letterSpacing: '1px'
        }}>
          {model.name}
        </h3>
        <p style={{
          margin: '4px 0 0 0',
          fontSize: isMobile ? '8px' : '10px',
          color: 'rgba(255,255,255,0.8)',
          letterSpacing: '1px'
        }}>
          NO.{String(index + 1).padStart(2, '0')}
        </p>
      </div>
      
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: '#10b981',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.5)',
          animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
          ✓
        </div>
      )}
      
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

// ==================== 主应用组件 ====================
function App() {
  const { isMobile } = useMobileDetect()
  const { settings, updateSetting, resetSettings } = useAppSettings()
  const { characters, currentCharacter, addCharacter, updateCharacter, deleteCharacter, selectCharacter, reorderCharacters } = useCharacterData()
  const { clearAllCache, getCacheSize } = useCacheManager()

  // 状态管理
  const [showSplash, setShowSplash] = useState(true)
  const [showFileInput, setShowFileInput] = useState(true)
  const [showModelSelect, setShowModelSelect] = useState(false)
  const [showCharacterManager, setShowCharacterManager] = useState(false)
  const [showActionPanel, setShowActionPanel] = useState(false)
  const [showBoneEditor, setShowBoneEditor] = useState(false)
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [showStageEffects, setShowStageEffects] = useState(false)
  const [showSceneManager, setShowSceneManager] = useState(false)
  const [showPosePanel, setShowPosePanel] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)
  const [modelUrl, setModelUrl] = useState(null)
  const [selectedModelIndex, setSelectedModelIndex] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [currentAction, setCurrentAction] = useState(null)
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false)

  const fileInputRef = useRef(null)

  const allTags = ['#原神', '#星穹铁道', '#崩坏3', '#正太', '#萝莉', '#御姐', '#少年', '#成男', '#成女', '#男性', '#女性', '#可爱', '#帅气', '#冷酷', '#活泼', '#温柔', '#成熟']

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const filteredModelList = modelList.filter(model => {
    const matchesSearch = model.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          model.filename?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTags = selectedTags.length === 0 ||
                        selectedTags.every(tag => model.tags?.includes(tag))
    return matchesSearch && matchesTags
  })

  // 处理文件选择
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const isValidFile = file.name.endsWith('.vrm') || 
                         file.name.endsWith('.glb') ||
                         file.name.endsWith('.gltf')
      
      if (isValidFile) {
        processModelFile(file)
      } else {
        alert('请上传 .vrm 格式的文件')
      }
    }
  }

  // 处理模型文件
  const processModelFile = async (file, isLocal = false) => {
    setIsLoading(true)
    setLoadingProgress(0)
    
    // 模拟加载进度
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 15 + 5
      })
    }, 200)
    
    try {
      const url = isLocal ? file : URL.createObjectURL(file)
      setSelectedFile(file)
      setModelUrl(url)
      
      // 添加到人物列表
      const newChar = addCharacter({
        name: file.name.replace('.vrm', ''),
        path: isLocal ? file : file.name,
        isCustom: !isLocal,
        thumbnail: null
      })
      
      selectCharacter(newChar)
      
      setTimeout(() => {
        clearInterval(progressInterval)
        setLoadingProgress(100)
        setTimeout(() => {
          setIsLoading(false)
          setShowFileInput(false)
          setShowModelSelect(false)
        }, 300)
      }, 1500)
    } catch (error) {
      console.error('模型处理失败:', error)
      setLoadError('模型加载失败')
      clearInterval(progressInterval)
      setIsLoading(false)
      setTimeout(() => setLoadError(null), 3000)
    }
  }

  // 选择本地模型
  const handleSelectLocalModel = (model, index) => {
    setSelectedModelIndex(index)
    const modelPath = `/models/${model.filename}`
    
    // 创建虚拟文件对象
    const dummyContent = new Uint8Array(1)
    dummyContent[0] = 0
    const blob = new Blob([dummyContent], { type: 'model/gltf-binary' })
    const modelFile = new File([blob], model.filename, { 
      type: 'model/gltf-binary',
      lastModified: Date.now()
    })
    modelFile.localPath = modelPath
    
    processModelFile(modelFile, true)
  }

  // 更新/重置应用
  const handleUpdate = () => {
    clearAllCache()
    resetSettings()
    window.location.reload()
  }

  // 处理动作选择
  const handleSelectAction = (action) => {
    setCurrentAction(action)
    setShowActionPanel(false)
    // 这里可以触发AR场景中的动作
  }

  // 处理骨骼变化
  const handleBoneChange = (boneName, type, axis, value) => {
    // 这里可以更新VRM模型的骨骼
    console.log('Bone change:', boneName, type, axis, value)
  }

  // 拖拽上传
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.name.endsWith('.vrm')) {
        processModelFile(file)
      } else {
        alert('请上传 .vrm 格式的文件')
      }
    }
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
      {showSplash && (
        <LoadingScreen onComplete={() => setShowSplash(false)} isMobile={isMobile} />
      )}
      
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
          padding: isMobile ? '30px 20px' : '40px',
          borderRadius: '24px',
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
            width: isMobile ? '60px' : '80px',
            height: isMobile ? '60px' : '80px',
            margin: '0 auto 20px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '28px' : '36px',
            boxShadow: '0 10px 40px rgba(102, 126, 234, 0.4)',
            animation: 'float 3s ease-in-out infinite'
          }}>
            🌸
          </div>
          
          <h3 style={{
            fontSize: isMobile ? '22px' : '26px',
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #667eea 0%, #f093fb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '800',
            letterSpacing: '1px'
          }}>
            AR拍照
          </h3>
          
          <p style={{
            fontSize: isMobile ? '11px' : '13px',
            marginBottom: '30px',
            lineHeight: '1.6',
            color: 'rgba(255, 255, 255, 0.6)',
            letterSpacing: '2px'
          }}>
            AR CAMERA SYSTEM
          </p>
          
          {/* 文件上传区域 */}
          <div 
            style={{
              marginBottom: '20px',
              position: 'relative'
            }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".vrm"
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
              padding: isMobile ? '25px 20px' : '35px 25px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '2px dashed rgba(102, 126, 234, 0.4)',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              zIndex: '1'
            }}>
              <div style={{
                fontSize: '32px',
                marginBottom: '10px',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
              }}>📁</div>
              <p style={{
                margin: '0 0 6px 0',
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: '500'
              }}>点击或拖拽文件到此处</p>
              <p style={{
                margin: 0,
                fontSize: '12px',
                color: '#667eea',
                fontWeight: '600'
              }}>仅支持 .vrm 格式</p>
            </div>
          </div>
          
          {/* 分隔线 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '20px 0',
            color: 'rgba(255,255,255,0.3)',
            fontSize: '12px'
          }}>
            <div style={{flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)'}} />
            <span style={{padding: '0 15px'}}>OR</span>
            <div style={{flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)'}} />
          </div>
          
          <button
            onClick={() => setShowModelSelect(true)}
            style={{
              padding: isMobile ? '12px 20px' : '14px 24px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '700',
              width: '100%',
              boxShadow: '0 8px 25px rgba(240, 147, 251, 0.4)',
              transition: 'all 0.3s ease',
              letterSpacing: '1px'
            }}
          >
            ✨ 从角色库选择
          </button>

          {/* 底部工具栏 */}
          <div style={{
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <button
              onClick={() => setShowUpdateConfirm(true)}
              style={{
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.6)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.3s ease'
              }}
            >
              🔄 更新
            </button>
            {characters.length > 0 && (
              <button
                onClick={() => setShowCharacterManager(true)}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(102, 126, 234, 0.2)',
                  color: '#667eea',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all 0.3s ease'
                }}
              >
                👥 管理 ({characters.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* 模型选择界面 */}
      {showModelSelect && !showSplash && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(20, 20, 35, 0.98)',
          color: 'white',
          padding: isMobile ? '16px' : '30px',
          borderRadius: '24px',
          zIndex: 1000,
          width: '95%',
          maxWidth: '800px',
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
            marginBottom: isMobile ? '16px' : '24px',
            paddingBottom: isMobile ? '12px' : '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div>
              <h3 style={{
                fontSize: isMobile ? '20px' : '24px',
                background: 'linear-gradient(135deg, #667eea 0%, #f093fb 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: '800',
                margin: '0 0 4px 0',
                letterSpacing: '1px'
              }}>
                选择角色
              </h3>
              <p style={{
                margin: 0,
                fontSize: isMobile ? '10px' : '11px',
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '2px'
              }}>
                SELECT YOUR CHARACTER
              </p>
            </div>
            <button
              onClick={() => setShowModelSelect(false)}
              style={{
                padding: '8px 16px',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
            >
              ✕ 关闭
            </button>
          </div>

          {/* 搜索栏 */}
          <div style={{
            marginBottom: isMobile ? '12px' : '16px'
          }}>
            <input
              type="text"
              placeholder="搜索角色..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: isMobile ? '10px 14px' : '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 标签筛选 */}
          <div style={{
            marginBottom: isMobile ? '16px' : '20px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.5)',
                fontWeight: '600'
              }}>
                标签筛选
              </span>
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  style={{
                    padding: '4px 10px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}
                >
                  清除
                </button>
              )}
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px'
            }}>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  style={{
                    padding: isMobile ? '4px 8px' : '5px 10px',
                    borderRadius: isMobile ? '6px' : '8px',
                    border: 'none',
                    background: selectedTags.includes(tag)
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'rgba(255,255,255,0.05)',
                    color: selectedTags.includes(tag) ? 'white' : 'rgba(255,255,255,0.6)',
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: selectedTags.includes(tag) ? '600' : '400'
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          {/* 角色卡片网格 */}
          <div style={{
            maxHeight: 'calc(90vh - 200px)',
            overflowY: 'auto',
            paddingRight: '8px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile 
                ? 'repeat(3, 1fr)' 
                : 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: isMobile ? '10px' : '16px',
              padding: '4px'
            }}>
              {filteredModelList.map((model, index) => (
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
            
            {filteredModelList.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: 'rgba(255,255,255,0.5)'
              }}>
                <p>没有找到匹配的角色</p>
              </div>
            )}
          </div>
          
          {/* 底部信息 */}
          <div style={{
            marginTop: isMobile ? '16px' : '20px',
            paddingTop: isMobile ? '12px' : '16px',
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
              <span style={{color: '#f093fb', fontWeight: '700'}}>{filteredModelList.length}</span> 个角色
            </p>
          </div>
        </div>
      )}

      {/* 人物管理器 */}
      <CharacterManager
        isOpen={showCharacterManager}
        onClose={() => setShowCharacterManager(false)}
        characters={characters}
        currentCharacter={currentCharacter}
        onSelect={selectCharacter}
        onCreate={() => setShowFileInput(true)}
        onDelete={deleteCharacter}
        onEdit={updateCharacter}
        onReorder={reorderCharacters}
        isMobile={isMobile}
      />

      {/* 动作面板 */}
      <ActionPanel
        isOpen={showActionPanel}
        onClose={() => setShowActionPanel(false)}
        onSelectAction={handleSelectAction}
        currentAction={currentAction}
        isMobile={isMobile}
      />

      {/* 骨骼编辑器 */}
      <BoneEditor
        isOpen={showBoneEditor}
        onClose={() => setShowBoneEditor(false)}
        onBoneChange={handleBoneChange}
        isMobile={isMobile}
      />

      {/* 播放列表面板 */}
      <PlaylistPanel
        isOpen={showPlaylist}
        onClose={() => setShowPlaylist(false)}
        onPlayAction={handleSelectAction}
        isMobile={isMobile}
      />

      {/* 舞台效果面板 */}
      <StageEffectsPanel
        isOpen={showStageEffects}
        onClose={() => setShowStageEffects(false)}
        isMobile={isMobile}
      />

      {/* 场景管理面板 */}
      <SceneManager
        isOpen={showSceneManager}
        onClose={() => setShowSceneManager(false)}
        isMobile={isMobile}
      />

      {/* 姿势面板 */}
      <PosePanel
        isOpen={showPosePanel}
        onClose={() => setShowPosePanel(false)}
        onSelectPose={handleSelectAction}
        currentPose={currentAction?.id}
      />

      {/* 加载中界面 - 带进度条 */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.95)',
          color: 'white',
          padding: isMobile ? '30px' : '40px',
          borderRadius: '24px',
          zIndex: 2000,
          textAlign: 'center',
          minWidth: isMobile ? '200px' : '280px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
        }}>
          {/* 圆形进度 */}
          <div style={{
            width: isMobile ? '80px' : '100px',
            height: isMobile ? '80px' : '100px',
            margin: '0 auto 20px',
            position: 'relative'
          }}>
            <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="6"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                style={{
                  strokeDasharray: `${2 * Math.PI * 45}`,
                  strokeDashoffset: `${2 * Math.PI * 45 * (1 - loadingProgress / 100)}`,
                  transition: 'stroke-dashoffset 0.3s ease'
                }}
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#667eea" />
                  <stop offset="100%" stopColor="#764ba2" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: isMobile ? '20px' : '24px',
              fontWeight: '700'
            }}>
              {Math.round(loadingProgress)}%
            </div>
          </div>
          
          <p style={{
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: '600',
            margin: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #f093fb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            加载模型中...
          </p>
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

      {/* 更新确认弹窗 */}
      {showUpdateConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 5000
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            padding: '30px',
            borderRadius: '20px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
            <h3 style={{ color: 'white', margin: '0 0 12px 0' }}>确认更新?</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 24px 0', fontSize: '14px' }}>
              这将清除所有缓存数据并重新加载应用
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowUpdateConfirm(false)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                取消
              </button>
              <button
                onClick={handleUpdate}
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                确认更新
              </button>
            </div>
          </div>
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
          <ARScene 
            selectedFile={selectedFile} 
            defaultHeight={settings.defaultHeight}
            onOpenCharacterManager={() => setShowCharacterManager(true)}
            onOpenActionPanel={() => setShowActionPanel(true)}
            onOpenBoneEditor={() => setShowBoneEditor(true)}
          />
        </div>
      )}
    </div>
  )
}

export default App
