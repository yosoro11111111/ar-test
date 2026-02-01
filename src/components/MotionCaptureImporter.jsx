import React, { useState, useCallback } from 'react'
import { motionCaptureLoader, MixamoActions } from '../utils/motionCaptureLoader'
import './MotionCaptureImporter.css'

// 动作捕捉数据导入组件
export const MotionCaptureImporter = ({ 
  isOpen, 
  onClose, 
  onImportAction,
  isMobile 
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [importedActions, setImportedActions] = useState([])
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('upload') // 'upload' | 'mixamo'

  if (!isOpen) return null

  // 处理文件拖放
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    await processFiles(files)
  }, [])

  // 处理文件选择
  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files)
    await processFiles(files)
  }, [])

  // 处理文件
  const processFiles = async (files) => {
    const validExtensions = ['.bvh', '.fbx', '.glb', '.gltf']
    const animationFiles = files.filter(file => 
      validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
    )

    if (animationFiles.length === 0) {
      setError('请选择有效的动画文件 (.bvh, .fbx, .glb, .gltf)')
      return
    }

    setIsLoading(true)
    setError(null)
    const imported = []

    for (let i = 0; i < animationFiles.length; i++) {
      const file = animationFiles[i]
      setLoadingProgress((i / animationFiles.length) * 100)

      try {
        const animationData = await motionCaptureLoader.load(file)
        imported.push({
          ...animationData,
          id: `imported_${Date.now()}_${i}`,
          icon: '🎬',
          category: '导入',
          fileName: file.name
        })
      } catch (err) {
        console.error(`导入失败 ${file.name}:`, err)
        setError(`导入失败: ${file.name} - ${err.message}`)
      }
    }

    setImportedActions(prev => [...prev, ...imported])
    setIsLoading(false)
    setLoadingProgress(0)
  }

  // 使用导入的动作
  const handleUseAction = (action) => {
    onImportAction?.(action)
    onClose()
  }

  // 删除导入的动作
  const handleDeleteAction = (actionId) => {
    setImportedActions(prev => prev.filter(a => a.id !== actionId))
  }

  // 打开 Mixamo 网站
  const openMixamo = () => {
    window.open('https://www.mixamo.com', '_blank')
  }

  return (
    <div className="motion-capture-overlay" onClick={onClose}>
      <div 
        className={`motion-capture-panel ${isMobile ? 'mobile' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="panel-header">
          <h2>🎬 动作捕捉导入</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* 标签页 */}
        <div className="panel-tabs">
          <button 
            className={activeTab === 'upload' ? 'active' : ''}
            onClick={() => setActiveTab('upload')}
          >
            📁 上传文件
          </button>
          <button 
            className={activeTab === 'mixamo' ? 'active' : ''}
            onClick={() => setActiveTab('mixamo')}
          >
            🌐 Mixamo
          </button>
        </div>

        {/* 上传标签页 */}
        {activeTab === 'upload' && (
          <div className="upload-section">
            {/* 拖放区域 */}
            <div 
              className={`drop-zone ${isDragging ? 'dragging' : ''} ${isLoading ? 'loading' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isLoading ? (
                <div className="loading-indicator">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${loadingProgress}%` }}
                    />
                  </div>
                  <p>正在导入... {Math.round(loadingProgress)}%</p>
                </div>
              ) : (
                <>
                  <div className="drop-icon">📂</div>
                  <p>拖放动画文件到这里</p>
                  <p className="sub-text">或</p>
                  <label className="file-input-label">
                    <input 
                      type="file" 
                      accept=".bvh,.fbx,.glb,.gltf"
                      multiple
                      onChange={handleFileSelect}
                      hidden
                    />
                    <span>选择文件</span>
                  </label>
                  <p className="file-types">
                    支持: .bvh, .fbx, .glb, .gltf
                  </p>
                </>
              )}
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            {/* 导入的动作列表 */}
            {importedActions.length > 0 && (
              <div className="imported-actions">
                <h3>已导入的动作 ({importedActions.length})</h3>
                <div className="actions-list">
                  {importedActions.map(action => (
                    <div key={action.id} className="action-item">
                      <div className="action-info">
                        <span className="action-icon">🎬</span>
                        <div className="action-details">
                          <span className="action-name">{action.name}</span>
                          <span className="action-meta">
                            {action.source.toUpperCase()} | 
                            {(action.duration / 1000).toFixed(1)}s | 
                            {action.fps}fps
                          </span>
                        </div>
                      </div>
                      <div className="action-actions">
                        <button 
                          className="use-btn"
                          onClick={() => handleUseAction(action)}
                        >
                          使用
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteAction(action.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mixamo 标签页 */}
        {activeTab === 'mixamo' && (
          <div className="mixamo-section">
            <div className="mixamo-intro">
              <h3>🎭 Mixamo - 免费动作库</h3>
              <p>
                Mixamo 是 Adobe 旗下的免费动作捕捉数据库，提供 2500+ 专业动作。
                所有动作都基于真实动作捕捉数据。
              </p>
              <button className="open-mixamo-btn" onClick={openMixamo}>
                访问 Mixamo 网站
              </button>
            </div>

            <div className="mixamo-categories">
              {Object.entries(MixamoActions).map(([category, actions]) => (
                <div key={category} className="category-section">
                  <h4>
                    {category === 'basic' && '基础动作'}
                    {category === 'dance' && '舞蹈动作'}
                    {category === 'combat' && '战斗动作'}
                    {category === 'expression' && '表情动作'}
                  </h4>
                  <div className="action-links">
                    {actions.map(action => (
                      <a 
                        key={action.id}
                        href={action.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-link"
                      >
                        <span>{action.name}</span>
                        <span className="link-icon">↗️</span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mixamo-instructions">
              <h4>📖 使用说明</h4>
              <ol>
                <li>访问 Mixamo 网站并登录 Adobe 账号（免费）</li>
                <li>搜索需要的动作（如 "walk", "run", "dance"）</li>
                <li>选择动作并下载 FBX 格式（不带皮肤）</li>
                <li>回到本页面，在"上传文件"标签页导入下载的 FBX 文件</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MotionCaptureImporter
