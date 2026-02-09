import React, { useState, useEffect } from 'react'
import styles from './ResourcePackModal.module.css'

/**
 * 资源包管理弹窗 V2
 *
 * 功能：
 * - 显示本地资源（public文件夹）
 * - 显示已加载的资源包
 * - 导入新资源包
 * - 导出资源包
 * - 多资源包管理
 */
export function ResourcePackModal({ 
  onClose, 
  onImport, 
  onExport,
  resourceManager,
  currentProject 
}) {
  const [activeTab, setActiveTab] = useState('local') // 'local', 'packs', 'export'
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [loadedPacks, setLoadedPacks] = useState([])
  const [localStats, setLocalStats] = useState(null)
  const [selectedResources, setSelectedResources] = useState({
    characters: [],
    props: [],
    scenes: [],
    motions: [],
    motionGroups: [],
    music: [],
    models: []
  })
  const [exportPackName, setExportPackName] = useState('')
  const [showExportConfirm, setShowExportConfirm] = useState(false)

  // 加载数据
  useEffect(() => {
    if (resourceManager) {
      setLoadedPacks(resourceManager.getLoadedPacks())
      setLocalStats(resourceManager.getStats())
    }
  }, [resourceManager])

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileSelect = (file) => {
    if (file.name.endsWith('.smmdpack')) {
      setSelectedFile(file)
    } else {
      alert('请选择 .smmdpack 格式的资源包文件')
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      alert('请先选择文件')
      return
    }
    if (!resourceManager) {
      alert('资源管理器未初始化')
      return
    }
    
    console.log('导入文件:', selectedFile, '类型:', typeof selectedFile, '是否为File:', selectedFile instanceof File)

    try {
      const pack = await resourceManager.importResourcePack(selectedFile)
      setLoadedPacks(resourceManager.getLoadedPacks())
      setLocalStats(resourceManager.getStats())
      onImport?.(pack)
      setSelectedFile(null)
      alert(`资源包 "${pack.name}" 导入成功！`)
    } catch (error) {
      console.error('导入失败:', error)
      alert('导入失败: ' + error.message)
    }
  }

  const handleRemovePack = (packId) => {
    if (!resourceManager) return
    
    if (confirm('确定要移除这个资源包吗？项目中的资源引用可能会失效。')) {
      resourceManager.removeResourcePack(packId)
      setLoadedPacks(resourceManager.getLoadedPacks())
      setLocalStats(resourceManager.getStats())
    }
  }

  const handleToggleResource = (type, resource) => {
    setSelectedResources(prev => {
      const current = prev[type]
      const exists = current.some(r => r.id === resource.id)
      
      if (exists) {
        return {
          ...prev,
          [type]: current.filter(r => r.id !== resource.id)
        }
      } else {
        return {
          ...prev,
          [type]: [...current, resource]
        }
      }
    })
  }

  const handleExport = async () => {
    if (!exportPackName.trim()) {
      alert('请输入资源包名称')
      return
    }

    const hasResources = Object.values(selectedResources).some(arr => arr && arr.length > 0)
    if (!hasResources) {
      alert('请至少选择一种资源')
      return
    }

    try {
      console.log('开始导出资源包:', exportPackName)
      console.log('选择的资源:', selectedResources)
      
      // 统计选择的资源数量
      const stats = {}
      Object.entries(selectedResources).forEach(([type, items]) => {
        if (items && items.length > 0) {
          stats[type] = items.length
        }
      })
      console.log('资源统计:', stats)
      
      if (!resourceManager) {
        alert('资源管理器未初始化')
        return
      }
      
      // 显示导出中提示
      const exportBtn = document.activeElement
      const originalText = exportBtn?.textContent
      if (exportBtn) exportBtn.textContent = '导出中...'
      
      // 导出资源包（包含实际文件）
      const { blob, meta } = await resourceManager.exportResourcePack(exportPackName, selectedResources)
      
      if (exportBtn) exportBtn.textContent = originalText
      
      console.log('导出的资源包大小:', (blob.size / 1024 / 1024).toFixed(2), 'MB')
      console.log('导出的资源:', meta)
      
      // 下载文件
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${exportPackName}.smmdpack`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      alert(`资源包导出成功！\n包含 ${Object.values(stats).reduce((a, b) => a + b, 0)} 个资源\n文件大小: ${(blob.size / 1024 / 1024).toFixed(2)} MB`)
    } catch (error) {
      console.error('导出资源包失败:', error)
      alert('导出失败: ' + error.message)
    }
  }

  const selectAllResources = (type) => {
    const resources = resourceManager?.getAvailableResources()[type] || []
    setSelectedResources(prev => ({
      ...prev,
      [type]: [...resources]
    }))
  }

  const clearSelection = (type) => {
    setSelectedResources(prev => ({
      ...prev,
      [type]: []
    }))
  }

  const tabs = [
    { id: 'local', name: '本地资源', icon: '📁' },
    { id: 'packs', name: '资源包', icon: '📦' },
    { id: 'export', name: '导出资源', icon: '📤' }
  ]

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.large}`} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>资源包管理</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* 标签页 */}
        <div className={styles.tabs}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabName}>{tab.name}</span>
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {/* 本地资源标签 */}
          {activeTab === 'local' && (
            <div className={styles.tabContent}>
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionTitle}>本地资源统计</span>
                  <span className={styles.sectionSubtitle}>从 public 文件夹加载</span>
                </div>
                
                {localStats && localStats.local && (
                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                      <span className={styles.statIcon}>👤</span>
                      <span className={styles.statValue}>{localStats.local.characters || 0}</span>
                      <span className={styles.statLabel}>角色</span>
                    </div>
                    <div className={styles.statCard}>
                      <span className={styles.statIcon}>📦</span>
                      <span className={styles.statValue}>{localStats.local.props || 0}</span>
                      <span className={styles.statLabel}>道具</span>
                    </div>
                    <div className={styles.statCard}>
                      <span className={styles.statIcon}>🏞️</span>
                      <span className={styles.statValue}>{localStats.local.scenes || 0}</span>
                      <span className={styles.statLabel}>场景</span>
                    </div>
                    <div className={styles.statCard}>
                      <span className={styles.statIcon}>🎭</span>
                      <span className={styles.statValue}>{localStats.local.motions || 0}</span>
                      <span className={styles.statLabel}>动作</span>
                    </div>
                    <div className={styles.statCard}>
                      <span className={styles.statIcon}>🎬</span>
                      <span className={styles.statValue}>{localStats.local.motionGroups || 0}</span>
                      <span className={styles.statLabel}>动作组</span>
                    </div>
                    <div className={styles.statCard}>
                      <span className={styles.statIcon}>🎵</span>
                      <span className={styles.statValue}>{localStats.local.music || 0}</span>
                      <span className={styles.statLabel}>音乐</span>
                    </div>
                    <div className={styles.statCard}>
                      <span className={styles.statIcon}>🧊</span>
                      <span className={styles.statValue}>{localStats.local.models || 0}</span>
                      <span className={styles.statLabel}>模型</span>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.infoBox}>
                <div className={styles.infoTitle}>💡 提示</div>
                <p>本地资源会自动从 public 文件夹加载，无需网络连接。</p>
                <p>将资源文件放入 public 文件夹的对应子目录后，刷新页面即可看到。</p>
              </div>
            </div>
          )}

          {/* 资源包标签 */}
          {activeTab === 'packs' && (
            <div className={styles.tabContent}>
              {/* 已加载的资源包 */}
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionTitle}>已加载的资源包</span>
                  <span className={styles.badge}>{loadedPacks.length}</span>
                </div>
                
                {loadedPacks.length > 0 ? (
                  <div className={styles.packList}>
                    {loadedPacks.map(pack => (
                      <div key={pack.id} className={styles.packItem}>
                        <div className={styles.packIconLarge}>📦</div>
                        <div className={styles.packInfo}>
                          <div className={styles.packName}>{pack.name}</div>
                          <div className={styles.packMeta}>
                            <span>v{pack.version}</span>
                            <span>•</span>
                            <span>{new Date(pack.importedAt).toLocaleDateString()}</span>
                          </div>
                          <div className={styles.packResources}>
                            {pack.characters?.length > 0 && <span>👤 {pack.characters.length}</span>}
                            {pack.props?.length > 0 && <span>📦 {pack.props.length}</span>}
                            {pack.scenes?.length > 0 && <span>🏞️ {pack.scenes.length}</span>}
                            {pack.motions?.length > 0 && <span>🎭 {pack.motions.length}</span>}
                            {pack.music?.length > 0 && <span>🎵 {pack.music.length}</span>}
                          </div>
                        </div>
                        <button 
                          className={styles.removeBtn}
                          onClick={() => handleRemovePack(pack.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📭</div>
                    <div className={styles.emptyText}>暂无已加载的资源包</div>
                  </div>
                )}
              </div>

              {/* 导入区域 */}
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionTitle}>导入资源包</span>
                </div>
                
                <div
                  className={`${styles.dropZone} ${isDragging ? styles.dragging : ''} ${selectedFile ? styles.hasFile : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept=".smmdpack"
                    onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
                    style={{ display: 'none' }}
                    id="packFileInput"
                  />

                  {selectedFile ? (
                    <div className={styles.fileSelected}>
                      <div className={styles.fileIcon}>📄</div>
                      <div className={styles.fileName}>{selectedFile.name}</div>
                      <div className={styles.fileSize}>
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                      <div className={styles.fileActions}>
                        <button
                          className={styles.btnSecondary}
                          onClick={() => setSelectedFile(null)}
                        >
                          移除
                        </button>
                        <button
                          className={styles.btnPrimary}
                          onClick={handleImport}
                        >
                          导入
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={styles.dropIcon}>📁</div>
                      <div className={styles.dropText}>
                        拖拽资源包文件到此处
                      </div>
                      <div className={styles.dropSubtext}>
                        或 <label htmlFor="packFileInput" className={styles.browseLink}>浏览文件</label>
                      </div>
                      <div className={styles.dropHint}>
                        支持 .smmdpack 格式
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 导出资源标签 */}
          {activeTab === 'export' && (
            <div className={styles.tabContent}>
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionTitle}>选择要导出的资源</span>
                </div>

                {/* 资源类型选择 */}
                {['characters', 'props', 'scenes', 'motions', 'motionGroups', 'music', 'models'].map(type => {
                  const typeNames = {
                    characters: '角色',
                    props: '道具',
                    scenes: '场景',
                    motions: '动作',
                    motionGroups: '动作组',
                    music: '音乐',
                    models: '模型'
                  }
                  const typeIcons = {
                    characters: '👤',
                    props: '📦',
                    scenes: '🏞️',
                    motions: '🎭',
                    motionGroups: '🎬',
                    music: '🎵',
                    models: '🧊'
                  }
                  const resources = resourceManager?.getAvailableResources()[type] || []
                  const selected = selectedResources[type] || []

                  return (
                    <div key={type} className={styles.resourceTypeSection}>
                      <div className={styles.resourceTypeHeader}>
                        <span className={styles.resourceTypeIcon}>{typeIcons[type]}</span>
                        <span className={styles.resourceTypeName}>{typeNames[type]}</span>
                        <span className={styles.resourceCount}>
                          已选择 {selected?.length || 0} / {resources?.length || 0}
                        </span>
                        <div className={styles.resourceActions}>
                          <button 
                            className={styles.actionLink}
                            onClick={() => selectAllResources(type)}
                          >
                            全选
                          </button>
                          <button 
                            className={styles.actionLink}
                            onClick={() => clearSelection(type)}
                          >
                            清空
                          </button>
                        </div>
                      </div>
                      
                      {resources.length > 0 ? (
                        <div className={styles.resourceGrid}>
                          {resources.map(resource => (
                            <label 
                              key={resource.id} 
                              className={`${styles.resourceCheckbox} ${selected.some(r => r.id === resource.id) ? styles.selected : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={selected.some(r => r.id === resource.id)}
                                onChange={() => handleToggleResource(type, resource)}
                              />
                              <span className={styles.resourceName}>{resource.name}</span>
                              {resource.packName && (
                                <span className={styles.resourcePack}>{resource.packName}</span>
                              )}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.emptyHint}>暂无资源</div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* 导出设置 */}
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionTitle}>导出设置</span>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>资源包名称</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={exportPackName}
                    onChange={(e) => setExportPackName(e.target.value)}
                    placeholder="输入资源包名称"
                  />
                </div>

                <div className={styles.exportSummary}>
                  <div className={styles.summaryTitle}>导出摘要</div>
                  <div className={styles.summaryList}>
                    {Object.entries(selectedResources).map(([type, items]) => (
                      items && items.length > 0 && (
                        <div key={type} className={styles.summaryItem}>
                          <span>{type === 'characters' ? '👤 角色' : 
                                 type === 'props' ? '📦 道具' :
                                 type === 'scenes' ? '🏞️ 场景' :
                                 type === 'motions' ? '🎭 动作' :
                                 type === 'motionGroups' ? '🎬 动作组' :
                                 type === 'models' ? '🧊 模型' : '🎵 音乐'}</span>
                          <span>{items.length} 个</span>
                        </div>
                      )
                    ))}
                    {Object.values(selectedResources).every(arr => !arr || arr.length === 0) && (
                      <div className={styles.summaryEmpty}>未选择任何资源</div>
                    )}
                  </div>
                </div>

                <button 
                  className={styles.btnPrimaryLarge}
                  onClick={handleExport}
                  disabled={Object.values(selectedResources).every(arr => !arr || arr.length === 0) || !exportPackName.trim()}
                >
                  📤 导出资源包
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.btnSecondary} onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
