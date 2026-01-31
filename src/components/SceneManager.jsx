import React, { useState, useEffect, useCallback } from 'react'
import './SceneManager.css'

// 场景管理组件 - 导入/导出/保存场景
export const SceneManager = ({
  isOpen,
  onClose,
  currentScene,
  onLoadScene,
  isMobile
}) => {
  const [savedScenes, setSavedScenes] = useState(() => {
    const saved = localStorage.getItem('savedScenes')
    return saved ? JSON.parse(saved) : []
  })
  const [activeTab, setActiveTab] = useState('saved') // saved, import, export
  const [importData, setImportData] = useState('')
  const [importError, setImportError] = useState('')
  const [sceneName, setSceneName] = useState('')
  const [selectedScene, setSelectedScene] = useState(null)

  // 保存场景列表到本地存储
  useEffect(() => {
    localStorage.setItem('savedScenes', JSON.stringify(savedScenes))
  }, [savedScenes])

  // 保存当前场景
  const saveCurrentScene = useCallback(() => {
    if (!sceneName.trim()) {
      alert('请输入场景名称')
      return
    }

    if (!currentScene) {
      alert('没有可保存的场景数据')
      return
    }

    const newScene = {
      id: Date.now().toString(),
      name: sceneName.trim(),
      data: currentScene,
      createdAt: new Date().toISOString(),
      version: '1.0'
    }

    setSavedScenes(prev => [newScene, ...prev])
    setSceneName('')
    alert('场景已保存！')
  }, [sceneName, currentScene])

  // 删除场景
  const deleteScene = useCallback((sceneId) => {
    if (window.confirm('确定要删除这个场景吗？')) {
      setSavedScenes(prev => prev.filter(s => s.id !== sceneId))
    }
  }, [])

  // 加载场景
  const loadScene = useCallback((scene) => {
    onLoadScene?.(scene.data)
    onClose()
  }, [onLoadScene, onClose])

  // 导出场景
  const exportScene = useCallback(() => {
    if (!currentScene) {
      alert('没有可导出的场景数据')
      return
    }

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: currentScene
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `scene_${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [currentScene])

  // 导入场景
  const importScene = useCallback(() => {
    setImportError('')
    
    if (!importData.trim()) {
      setImportError('请输入场景数据')
      return
    }

    try {
      const parsed = JSON.parse(importData)
      
      // 验证数据格式
      if (!parsed.data && !parsed.character) {
        setImportError('无效的场景数据格式')
        return
      }

      const sceneData = parsed.data || parsed
      
      const newScene = {
        id: Date.now().toString(),
        name: sceneData.name || `导入场景 ${new Date().toLocaleString()}`,
        data: sceneData,
        createdAt: new Date().toISOString(),
        importedAt: new Date().toISOString(),
        version: parsed.version || '1.0'
      }

      setSavedScenes(prev => [newScene, ...prev])
      setImportData('')
      setActiveTab('saved')
      alert('场景导入成功！')
    } catch (error) {
      setImportError('JSON解析错误: ' + error.message)
    }
  }, [importData])

  // 从文件导入
  const importFromFile = useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setImportData(event.target.result)
    }
    reader.readAsText(file)
  }, [])

  // 生成分享码
  const generateShareCode = useCallback((scene) => {
    const code = btoa(JSON.stringify(scene.data))
    navigator.clipboard?.writeText(code)
    alert('分享码已复制到剪贴板！')
  }, [])

  // 从分享码导入
  const importFromCode = useCallback((code) => {
    try {
      const data = JSON.parse(atob(code))
      const newScene = {
        id: Date.now().toString(),
        name: `分享场景 ${new Date().toLocaleString()}`,
        data,
        createdAt: new Date().toISOString(),
        importedAt: new Date().toISOString(),
        version: '1.0'
      }
      setSavedScenes(prev => [newScene, ...prev])
      alert('场景导入成功！')
    } catch (error) {
      alert('无效的分享码')
    }
  }, [])

  // 格式化日期
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <div className="scene-manager-overlay" onClick={onClose}>
      <div className={`scene-manager ${isMobile ? 'mobile' : ''}`} onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="scene-manager-header">
          <h2>场景管理</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* 标签页 */}
        <div className="scene-tabs">
          <button
            className={activeTab === 'saved' ? 'active' : ''}
            onClick={() => setActiveTab('saved')}
          >
            💾 已保存
          </button>
          <button
            className={activeTab === 'export' ? 'active' : ''}
            onClick={() => setActiveTab('export')}
          >
            📤 导出
          </button>
          <button
            className={activeTab === 'import' ? 'active' : ''}
            onClick={() => setActiveTab('import')}
          >
            📥 导入
          </button>
        </div>

        {/* 内容区域 */}
        <div className="scene-content">
          {/* 已保存场景 */}
          {activeTab === 'saved' && (
            <div className="saved-scenes">
              {/* 保存当前场景 */}
              <div className="save-current">
                <input
                  type="text"
                  placeholder="输入场景名称..."
                  value={sceneName}
                  onChange={(e) => setSceneName(e.target.value)}
                  className="scene-name-input"
                />
                <button
                  className="save-btn"
                  onClick={saveCurrentScene}
                  disabled={!currentScene}
                >
                  💾 保存当前场景
                </button>
              </div>

              {/* 场景列表 */}
              <div className="scenes-list">
                {savedScenes.length === 0 ? (
                  <div className="empty-scenes">
                    <span className="empty-icon">🎭</span>
                    <p>还没有保存的场景</p>
                  </div>
                ) : (
                  savedScenes.map(scene => (
                    <div
                      key={scene.id}
                      className={`scene-item ${selectedScene?.id === scene.id ? 'selected' : ''}`}
                      onClick={() => setSelectedScene(scene)}
                    >
                      <div className="scene-info">
                        <h4 className="scene-name">{scene.name}</h4>
                        <p className="scene-date">
                          {scene.importedAt ? '📥 ' : '💾 '}
                          {formatDate(scene.createdAt)}
                        </p>
                      </div>
                      <div className="scene-actions">
                        <button
                          className="action-btn load"
                          onClick={() => loadScene(scene)}
                          title="加载"
                        >
                          ▶
                        </button>
                        <button
                          className="action-btn share"
                          onClick={() => generateShareCode(scene)}
                          title="分享"
                        >
                          🔗
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => deleteScene(scene.id)}
                          title="删除"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 导出场景 */}
          {activeTab === 'export' && (
            <div className="export-section">
              <div className="export-info">
                <h3>导出当前场景</h3>
                <p>将当前场景导出为JSON文件，可以备份或分享给其他用户</p>
              </div>
              
              {currentScene && (
                <div className="scene-preview">
                  <h4>场景预览</h4>
                  <pre className="json-preview">
                    {JSON.stringify(currentScene, null, 2).slice(0, 500)}...
                  </pre>
                </div>
              )}

              <button
                className="export-btn"
                onClick={exportScene}
                disabled={!currentScene}
              >
                📤 导出为JSON文件
              </button>
            </div>
          )}

          {/* 导入场景 */}
          {activeTab === 'import' && (
            <div className="import-section">
              <div className="import-tabs">
                <button className="active">文本导入</button>
              </div>

              <div className="import-area">
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="粘贴场景JSON数据..."
                  className="import-textarea"
                />
                {importError && (
                  <p className="import-error">{importError}</p>
                )}
              </div>

              <div className="import-actions">
                <label className="file-import-btn">
                  📁 从文件导入
                  <input
                    type="file"
                    accept=".json"
                    onChange={importFromFile}
                    style={{ display: 'none' }}
                  />
                </label>
                <button
                  className="import-btn"
                  onClick={importScene}
                  disabled={!importData.trim()}
                >
                  📥 导入场景
                </button>
              </div>

              <div className="import-tips">
                <h4>💡 提示</h4>
                <ul>
                  <li>支持导入JSON格式的场景文件</li>
                  <li>可以从其他用户那里获取分享码导入</li>
                  <li>导入的场景会自动保存到"已保存"列表</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SceneManager
