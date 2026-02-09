import React, { useState, useEffect } from 'react'
import styles from './ResourceSelectorModal.module.css'

// 资源分类配置
const RESOURCE_CATEGORIES = {
  characters: [
    { id: 'all', name: '全部', icon: '📁' },
    { id: 'vrm', name: 'VRM角色', icon: '👤' },
    { id: 'glb', name: 'GLB模型', icon: '📦' }
  ],
  props: [
    { id: 'all', name: '全部', icon: '📁' },
    { id: 'weapon', name: '武器', icon: '⚔️' },
    { id: 'tool', name: '工具', icon: '🔧' },
    { id: 'other', name: '其他', icon: '📦' }
  ],
  scenes: [
    { id: 'all', name: '全部', icon: '📁' },
    { id: 'indoor', name: '室内', icon: '🏠' },
    { id: 'outdoor', name: '室外', icon: '🌳' },
    { id: 'stage', name: '舞台', icon: '🎭' }
  ],
  motions: [
    { id: 'all', name: '全部', icon: '📁' },
    { id: 'idle', name: '待机', icon: '🧍' },
    { id: 'walk', name: '行走', icon: '🚶' },
    { id: 'run', name: '跑步', icon: '🏃' },
    { id: 'dance', name: '舞蹈', icon: '💃' },
    { id: 'action', name: '动作', icon: '⚔️' }
  ]
}

// 模拟资源数据
const MOCK_RESOURCES = {
  characters: [
    { name: 'Alicia.vrm', path: '/models/Alicia.vrm', size: '15.2 MB', category: 'vrm' },
    { name: 'Miku.vrm', path: '/models/Miku.vrm', size: '12.8 MB', category: 'vrm' },
    { name: 'Rin.vrm', path: '/models/Rin.vrm', size: '11.5 MB', category: 'vrm' },
    { name: 'Len.vrm', path: '/models/Len.vrm', size: '11.3 MB', category: 'vrm' },
    { name: 'Cube.glb', path: '/models/Cube.glb', size: '2.1 MB', category: 'glb' }
  ],
  props: [
    { name: 'sword.glb', path: '/object/sword.glb', size: '2.1 MB', category: 'weapon' },
    { name: 'shield.glb', path: '/object/shield.glb', size: '1.8 MB', category: 'weapon' },
    { name: 'staff.glb', path: '/object/staff.glb', size: '3.2 MB', category: 'weapon' },
    { name: 'bow.glb', path: '/object/bow.glb', size: '2.5 MB', category: 'weapon' },
    { name: 'hammer.glb', path: '/object/hammer.glb', size: '1.9 MB', category: 'tool' }
  ],
  scenes: [
    { name: 'stage.glb', path: '/scene/stage.glb', size: '25.6 MB', category: 'stage' },
    { name: 'concert_hall.glb', path: '/scene/concert_hall.glb', size: '45.2 MB', category: 'indoor' },
    { name: 'outdoor.glb', path: '/scene/outdoor.glb', size: '32.1 MB', category: 'outdoor' },
    { name: 'theater.glb', path: '/scene/theater.glb', size: '38.5 MB', category: 'stage' }
  ],
  motions: [
    { name: 'Idle.vrma', path: '/motion/Idle.vrma', size: '156 KB', category: 'idle' },
    { name: 'Walk.vrma', path: '/motion/Walk.vrma', size: '234 KB', category: 'walk' },
    { name: 'Run.vrma', path: '/motion/Run.vrma', size: '189 KB', category: 'run' },
    { name: 'Jump.vrma', path: '/motion/Jump.vrma', size: '145 KB', category: 'action' },
    { name: 'Dance.vrma', path: '/motion/Dance.vrma', size: '567 KB', category: 'dance' },
    { name: 'Female Walk Forward.vrma', path: '/motion/Female Walk Forward.vrma', size: '234 KB', category: 'walk' },
    { name: 'Female Run Forward.vrma', path: '/motion/Female Run Forward.vrma', size: '189 KB', category: 'run' },
    { name: 'Boxing Idle.vrma', path: '/motion/Boxing Idle.vrma', size: '156 KB', category: 'idle' }
  ]
}

const RESOURCE_EXTENSIONS = {
  characters: ['.vrm', '.glb', '.gltf'],
  props: ['.glb', '.gltf'],
  scenes: ['.glb', '.gltf'],
  motions: ['.vrma', '.bvh']
}

export function ResourceSelectorModal({ type, onClose, onSelect }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const typeNames = {
    characters: '角色',
    props: '道具',
    scenes: '场景',
    motions: '动作'
  }

  const typeIcons = {
    characters: '👤',
    props: '📦',
    scenes: '🏞️',
    motions: '🎭'
  }

  useEffect(() => {
    loadResources()
  }, [type])

  const loadResources = async () => {
    setLoading(true)
    try {
      // 使用模拟数据
      setFiles(MOCK_RESOURCES[type] || [])
    } catch (error) {
      console.error('加载资源失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 按分类和搜索词过滤
  const filteredFiles = files.filter(file => {
    const matchesCategory = activeCategory === 'all' || file.category === activeCategory
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleSelect = (file) => {
    onSelect({
      id: `${type}_${Date.now()}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      type,
      path: file.path,
      size: file.size,
      category: file.category
    })
    onClose()
  }

  const handleImportLocal = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = RESOURCE_EXTENSIONS[type].join(',')
    input.onchange = (e) => {
      if (e.target.files.length > 0) {
        Array.from(e.target.files).forEach(file => {
          onSelect({
            id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: file.name.replace(/\.[^/.]+$/, ''),
            type,
            file: file,
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
          })
        })
        onClose()
      }
    }
    input.click()
  }

  const categories = RESOURCE_CATEGORIES[type] || []

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>
            <span className={styles.icon}>{typeIcons[type]}</span>
            选择{typeNames[type]}
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder={`搜索${typeNames[type]}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* 分类标签 */}
        <div className={styles.categoryTabs}>
          {categories.map(category => (
            <button
              key={category.id}
              className={`${styles.categoryTab} ${activeCategory === category.id ? styles.active : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              加载中...
            </div>
          ) : (
            <>
              <div className={styles.fileList}>
                {filteredFiles.map((file, index) => (
                  <div
                    key={index}
                    className={styles.fileItem}
                    onClick={() => handleSelect(file)}
                  >
                    <div className={styles.fileIcon}>{typeIcons[type]}</div>
                    <div className={styles.fileInfo}>
                      <div className={styles.fileName}>{file.name}</div>
                      <div className={styles.fileMeta}>
                        <span className={styles.fileSize}>{file.size}</span>
                        <span className={styles.fileCategory}>
                          {categories.find(c => c.id === file.category)?.name || file.category}
                        </span>
                      </div>
                    </div>
                    <button className={styles.selectBtn}>选择</button>
                  </div>
                ))}
                
                {filteredFiles.length === 0 && (
                  <div className={styles.empty}>
                    没有找到匹配的{typeNames[type]}
                  </div>
                )}
              </div>

              <div className={styles.divider}>
                <span>或</span>
              </div>

              <button className={styles.importBtn} onClick={handleImportLocal}>
                📁 从本地导入{typeNames[type]}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
