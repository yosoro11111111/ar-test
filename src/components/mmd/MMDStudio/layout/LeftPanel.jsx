import React, { useState, useEffect } from 'react'
import styles from './LeftPanel.module.css'
import { ResourceBrowser } from '../components/ResourceBrowser.jsx'
import { ensureDatabase } from '../../core/dbUtils.js'

/**
 * 左侧面板 - 资源库
 * 
 * 包含：角色、道具、场景、动作、音乐
 */
export function LeftPanel({
  project,
  onAddCharacter,
  onAddProp,
  onSelectCharacter,
  onSelectProp,
  selectedCharacter,
  selectedProp
}) {
  const [activeTab, setActiveTab] = useState('characters')
  const [searchQuery, setSearchQuery] = useState('')
  const [resources, setResources] = useState([])
  const [dataPackages, setDataPackages] = useState([])
  const [isImporting, setIsImporting] = useState(false)
  const [showNetworkDialog, setShowNetworkDialog] = useState(false)

  // 初始化数据库
  useEffect(() => {
    const init = async () => {
      try {
        // 确保数据库已初始化
        await ensureDatabase()
        console.log('数据库初始化成功')
      } catch (error) {
        console.error('初始化失败:', error)
      }
    }
    
    init()
  }, [])

  const getResourceTypeByTab = (tab) => {
    switch (tab) {
      case 'characters': return 'vrm'
      case 'props': return 'glb'
      case 'scenes': return 'glb'
      case 'motions': return 'vrma'
      case 'music': return 'mp3'
      default: return null
    }
  }

  // 获取文件接受的类型
  const getAcceptTypes = () => {
    switch (activeTab) {
      case 'characters': return '.vrm'
      case 'props': return '.glb,.gltf'
      case 'scenes': return '.glb,.gltf,.mp4,.webm,.jpg,.jpeg,.png'
      case 'motions': return '.vrma,.bvh'
      case 'music': return '.mp3,.wav,.ogg'
      default: return '*'
    }
  }

  // 导入资源
  const handleImport = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setIsImporting(true)
    try {
      const type = getResourceTypeByTab(activeTab)
      await resourceManager.importMultiple(files, type)
      await loadResources()
      alert(`成功导入 ${files.length} 个文件`)
    } catch (error) {
      console.error('导入失败:', error)
      alert('导入失败: ' + error.message)
    } finally {
      setIsImporting(false)
    }
  }

  // 处理本地资源加载
  const handleLocalLoad = (resource) => {
    if (activeTab === 'characters') {
      onAddCharacter({
        name: resource.name,
        modelPath: resource.path,
        isLocalResource: true,
        resourceId: resource.id
      })
    } else if (activeTab === 'props') {
      onAddProp({
        name: resource.name,
        modelPath: resource.path,
        isLocalResource: true,
        resourceId: resource.id
      })
    }
    
    setShowNetworkDialog(false)
    alert(`已加载: ${resource.name}`)
  }

  // 搜索资源
  const handleSearch = async (e) => {
    const query = e.target.value
    setSearchQuery(query)
    
    if (query.trim()) {
      const type = getResourceTypeByTab(activeTab)
      const res = await resourceManager.searchResources(query, type)
      setResources(res)
    } else {
      loadResources()
    }
  }

  // 添加角色到场景
  const handleAddCharacter = (resource) => {
    onAddCharacter({
      name: resource.name,
      modelPath: resource.url || resource.path,
      resourceId: resource.id
    })
  }

  // 添加道具到场景
  const handleAddProp = (resource) => {
    onAddProp({
      name: resource.name,
      modelPath: resource.url || resource.path,
      resourceId: resource.id
    })
  }

  // 渲染资源列表
  const renderResourceList = () => {
    const filtered = resources.filter(r => 
      r.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
      <div className={styles.resourceList}>
        {filtered.map(resource => (
          <div
            key={resource.id}
            className={styles.resourceItem}
            onClick={() => {
              if (activeTab === 'characters') handleAddCharacter(resource)
              else if (activeTab === 'props') handleAddProp(resource)
            }}
          >
            <div className={styles.resourceThumbnail}>
              {resource.thumbnail ? (
                <img src={resource.thumbnail} alt={resource.name} />
              ) : (
                <div className={styles.placeholder}>📦</div>
              )}
            </div>
            <div className={styles.resourceInfo}>
              <div className={styles.resourceName}>{resource.name}</div>
              <div className={styles.resourceMeta}>
                {resource.format} · {(resource.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
            <button className={styles.addButton}>+</button>
          </div>
        ))}
        
        {filtered.length === 0 && (
          <div className={styles.emptyState}>
            暂无资源，点击导入按钮添加
          </div>
        )}
      </div>
    )
  }

  // 渲染项目中的角色/道具
  const renderProjectItems = () => {
    if (activeTab === 'characters') {
      return (
        <div className={styles.projectItems}>
          <h4>场景中的角色</h4>
          {project.characters.map(char => (
            <div
              key={char.id}
              className={`${styles.projectItem} ${selectedCharacter?.id === char.id ? styles.selected : ''}`}
              onClick={() => onSelectCharacter(char)}
            >
              <span className={styles.itemIcon}>👤</span>
              <span className={styles.itemName}>{char.name}</span>
            </div>
          ))}
          {project.characters.length === 0 && (
            <div className={styles.emptyState}>场景中还没有角色</div>
          )}
        </div>
      )
    }
    
    if (activeTab === 'props') {
      return (
        <div className={styles.projectItems}>
          <h4>场景中的道具</h4>
          {project.props.map(prop => (
            <div
              key={prop.id}
              className={`${styles.projectItem} ${selectedProp?.id === prop.id ? styles.selected : ''}`}
              onClick={() => onSelectProp(prop)}
            >
              <span className={styles.itemIcon}>📦</span>
              <span className={styles.itemName}>{prop.name}</span>
            </div>
          ))}
          {project.props.length === 0 && (
            <div className={styles.emptyState}>场景中还没有道具</div>
          )}
        </div>
      )
    }
    
    return null
  }

  return (
    <div className={styles.container}>
      {/* 标签页 */}
      <div className={styles.tabs}>
        <button
          className={activeTab === 'characters' ? styles.active : ''}
          onClick={() => setActiveTab('characters')}
        >
          👤 角色
        </button>
        <button
          className={activeTab === 'props' ? styles.active : ''}
          onClick={() => setActiveTab('props')}
        >
          📦 道具
        </button>
        <button
          className={activeTab === 'scenes' ? styles.active : ''}
          onClick={() => setActiveTab('scenes')}
        >
          🎬 场景
        </button>
        <button
          className={activeTab === 'motions' ? styles.active : ''}
          onClick={() => setActiveTab('motions')}
        >
          🎭 动作
        </button>
        <button
          className={activeTab === 'music' ? styles.active : ''}
          onClick={() => setActiveTab('music')}
        >
          🎵 音乐
        </button>
      </div>

      {/* 搜索和导入 */}
      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="搜索..."
          value={searchQuery}
          onChange={handleSearch}
          className={styles.searchInput}
        />
        <div className={styles.buttonGroup}>
          <button
            className={styles.selectButton}
            onClick={() => setShowNetworkDialog(true)}
            title="选择资源"
          >
            📂 选择{getTabName(activeTab)}
          </button>
          <label className={styles.importButton} title="导入到资源库">
            {isImporting ? '导入中...' : '+ 导入'}
            <input
              type="file"
              multiple
              accept={getAcceptTypes()}
              onChange={handleImport}
              hidden
              disabled={isImporting}
            />
          </label>
        </div>
      </div>

      {/* 项目中的项 */}
      {renderProjectItems()}

      {/* 资源库 */}
      <div className={styles.resourceSection}>
        <h4>资源库</h4>
        {renderResourceList()}
      </div>

      {/* 数据包 */}
      {dataPackages.length > 0 && (
        <div className={styles.dataPackages}>
          <h4>数据包</h4>
          {dataPackages.map(pkg => (
            <div key={pkg.id} className={styles.packageItem}>
              <span className={styles.packageIcon}>📦</span>
              <span className={styles.packageName}>{pkg.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* 资源浏览器 */}
      {showNetworkDialog && (
        <ResourceBrowser
          onSelect={handleLocalLoad}
          type={activeTab}
          onClose={() => setShowNetworkDialog(false)}
        />
      )}
    </div>
  )
}

function getTabName(tab) {
  const names = {
    characters: '角色',
    props: '道具',
    scenes: '场景',
    motions: '动作',
    music: '音乐'
  }
  return names[tab] || '资源'
}
