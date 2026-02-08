import React, { useState, useEffect } from 'react'
import styles from './ResourceBrowser.module.css'

/**
 * 资源浏览器 - 扫描并显示public文件夹中的资源
 */
export function ResourceBrowser({ onSelect, type, onClose }) {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid') // grid | list

  // 资源路径配置
  const resourceConfig = {
    characters: {
      path: '/models/',
      extensions: ['.vrm'],
      icon: '👤',
      defaultThumbnail: '/icons/character.png'
    },
    props: {
      path: '/object/',
      extensions: ['.glb', '.gltf'],
      icon: '📦',
      defaultThumbnail: '/icons/prop.png'
    },
    scenes: {
      path: '/scene/',
      extensions: ['.glb', '.gltf', '.mp4', '.webm', '.jpg', '.png'],
      icon: '🎬',
      defaultThumbnail: '/icons/scene.png'
    },
    motions: {
      path: '/motion/',
      extensions: ['.vrma', '.bvh'],
      icon: '🎭',
      defaultThumbnail: '/icons/motion.png'
    },
    music: {
      path: '/music/',
      extensions: ['.mp3', '.wav', '.ogg'],
      icon: '🎵',
      defaultThumbnail: '/icons/music.png'
    }
  }

  useEffect(() => {
    scanResources()
  }, [type])

  const scanResources = async () => {
    setLoading(true)
    try {
      const config = resourceConfig[type]
      if (!config) {
        setResources([])
        return
      }

      // 尝试加载manifest.json
      let files = []
      try {
        const response = await fetch('/manifest.json')
        if (response.ok) {
          const manifest = await response.json()
          files = manifest[type] || []
        }
      } catch (e) {
        console.log('manifest.json 不存在，使用默认扫描')
      }

      // 如果没有manifest，使用硬编码的资源列表（实际项目中应该由后端提供）
      if (files.length === 0) {
        files = await scanDirectory(config.path, config.extensions)
      }

      // 处理资源列表
      const processedResources = files.map((file, index) => ({
        id: `${type}-${index}`,
        name: formatFileName(file.name || file),
        fileName: file.name || file,
        path: `${config.path}${file.name || file}`,
        size: file.size || 0,
        type: type,
        extension: (file.name || file).split('.').pop().toLowerCase(),
        thumbnail: file.thumbnail || null,
        icon: config.icon
      }))

      setResources(processedResources)
    } catch (error) {
      console.error('扫描资源失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 模拟扫描目录（实际应该由后端API提供）
  const scanDirectory = async (path, extensions) => {
    // 这里我们使用一个简化的方法：尝试获取一些已知的文件
    // 在实际项目中，这应该是一个后端API调用
    
    // 对于道具，我们知道有一些文件
    if (path === '/object/') {
      return [
        'Umbrella.glb',
        'TV.glb',
        'Presents.glb',
        'Popcorn.glb',
        'Lantern.glb',
        'Keyboard.glb',
        'Clock.glb',
        'Campfire.glb',
        'Bow and Arrow.glb',
        'Basketball.glb'
      ]
    }
    
    // 对于场景
    if (path === '/scene/') {
      return ['test.glb']
    }
    
    // 对于动作，返回一些示例
    if (path === '/motion/') {
      return [
        'Zombie Walking.vrma',
        'Zombie Running.vrma',
        'Walking Forward With Bow.vrma',
        'Male Standard Walk.vrma',
        'Female Run Forward.vrma',
        'Dancing The Twerk.vrma',
        'Boxing Idle.vrma',
        'Capoeira Step.vrma'
      ]
    }
    
    return []
  }

  const formatFileName = (filename) => {
    return filename
      .replace(/\.[^/.]+$/, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/\d+$/, '')
      .trim()
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleSelect = (resource) => {
    setSelectedId(resource.id)
    onSelect(resource)
  }

  const filteredResources = resources.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getTypeName = () => {
    const names = {
      characters: '角色',
      props: '道具',
      scenes: '场景',
      motions: '动作',
      music: '音乐'
    }
    return names[type] || '资源'
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <span className={styles.typeIcon}>{resourceConfig[type]?.icon}</span>
            <h2>选择{getTypeName()}</h2>
            <span className={styles.count}>{filteredResources.length} 个文件</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* 工具栏 */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="搜索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.viewToggle}>
            <button
              className={viewMode === 'grid' ? styles.active : ''}
              onClick={() => setViewMode('grid')}
              title="网格视图"
            >
              ⊞
            </button>
            <button
              className={viewMode === 'list' ? styles.active : ''}
              onClick={() => setViewMode('list')}
              title="列表视图"
            >
              ☰
            </button>
          </div>
        </div>

        {/* 内容区 */}
        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>正在扫描文件夹...</p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📂</div>
              <p>暂无{getTypeName()}</p>
              <span>请将文件放入 public/{resourceConfig[type]?.path} 目录</span>
            </div>
          ) : viewMode === 'grid' ? (
            <div className={styles.grid}>
              {filteredResources.map(resource => (
                <div
                  key={resource.id}
                  className={`${styles.card} ${selectedId === resource.id ? styles.selected : ''}`}
                  onClick={() => handleSelect(resource)}
                >
                  <div className={styles.thumbnail}>
                    {resource.thumbnail ? (
                      <img src={resource.thumbnail} alt={resource.name} />
                    ) : (
                      <div className={styles.placeholder}>
                        <span className={styles.fileIcon}>{resource.icon}</span>
                      </div>
                    )}
                    <div className={styles.fileType}>{resource.extension.toUpperCase()}</div>
                  </div>
                  <div className={styles.info}>
                    <div className={styles.name} title={resource.name}>{resource.name}</div>
                    <div className={styles.meta}>
                      {resource.size > 0 && formatFileSize(resource.size)}
                    </div>
                  </div>
                  {selectedId === resource.id && (
                    <div className={styles.checkmark}>✓</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.list}>
              {filteredResources.map(resource => (
                <div
                  key={resource.id}
                  className={`${styles.listItem} ${selectedId === resource.id ? styles.selected : ''}`}
                  onClick={() => handleSelect(resource)}
                >
                  <span className={styles.listIcon}>{resource.icon}</span>
                  <div className={styles.listInfo}>
                    <div className={styles.listName}>{resource.name}</div>
                    <div className={styles.listMeta}>
                      {resource.extension.toUpperCase()}
                      {resource.size > 0 && ` · ${formatFileSize(resource.size)}`}
                    </div>
                  </div>
                  {selectedId === resource.id && (
                    <span className={styles.listCheck}>✓</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className={styles.footer}>
          <span className={styles.path}>路径: public{resourceConfig[type]?.path?.replace(/^\//, '')}</span>
          <button className={styles.refreshBtn} onClick={scanResources}>
            🔄 刷新
          </button>
        </div>
      </div>
    </div>
  )
}
