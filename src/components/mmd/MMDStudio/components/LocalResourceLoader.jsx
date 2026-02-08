import React, { useState, useEffect } from 'react'
import styles from './LocalResourceLoader.module.css'

/**
 * 本地资源加载器 - 从 public 文件夹加载资源
 */
export function LocalResourceLoader({ onLoad, type }) {
  const [resources, setResources] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingId, setLoadingId] = useState(null)
  const [progress, setProgress] = useState(0)

  // 资源路径配置
  const resourcePaths = {
    characters: '/models/',
    props: '/object/',
    scenes: '/scene/',
    motions: '/motion/',
    music: '/music/'
  }

  // 预设资源列表（实际项目中可以从JSON文件加载）
  const presetResources = {
    characters: [
      { id: 'char1', name: '角色1', file: 'character1.vrm', thumbnail: '/thumbnails/char1.jpg' },
      { id: 'char2', name: '角色2', file: 'character2.vrm', thumbnail: '/thumbnails/char2.jpg' },
    ],
    props: [
      { id: 'sword', name: '剑', file: 'sword.glb', thumbnail: '/thumbnails/sword.jpg' },
      { id: 'shield', name: '盾', file: 'shield.glb', thumbnail: '/thumbnails/shield.jpg' },
      { id: 'chair', name: '椅子', file: 'chair.glb', thumbnail: '/thumbnails/chair.jpg' },
      { id: 'table', name: '桌子', file: 'table.glb', thumbnail: '/thumbnails/table.jpg' },
    ],
    scenes: [
      { id: 'room', name: '房间', file: 'room.glb', thumbnail: '/thumbnails/room.jpg' },
      { id: 'stage', name: '舞台', file: 'stage.glb', thumbnail: '/thumbnails/stage.jpg' },
    ],
    motions: [
      { id: 'idle', name: '待机', file: 'idle.vrma', thumbnail: '/thumbnails/idle.jpg' },
      { id: 'walk', name: '走路', file: 'walk.vrma', thumbnail: '/thumbnails/walk.jpg' },
      { id: 'run', name: '跑步', file: 'run.vrma', thumbnail: '/thumbnails/run.jpg' },
    ]
  }

  useEffect(() => {
    // 加载资源列表
    const loadResourceList = async () => {
      setIsLoading(true)
      try {
        // 这里可以从JSON文件加载，现在使用预设
        const list = presetResources[type] || []
        setResources(list)
      } catch (error) {
        console.error('加载资源列表失败:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadResourceList()
  }, [type])

  const loadResource = async (resource) => {
    setLoadingId(resource.id)
    setProgress(0)

    try {
      const basePath = resourcePaths[type] || '/'
      const fullPath = `${basePath}${resource.file}`

      // 模拟进度（实际加载时可以用XMLHttpRequest获取真实进度）
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 20 + 10
        })
      }, 100)

      // 预加载资源以验证存在
      const response = await fetch(fullPath, { method: 'HEAD' })
      
      clearInterval(progressInterval)
      setProgress(100)

      if (response.ok) {
        onLoad({
          ...resource,
          path: fullPath
        })
      } else {
        throw new Error('资源不存在')
      }
    } catch (error) {
      console.error('加载资源失败:', error)
      alert(`加载失败: ${resource.name}`)
    } finally {
      setTimeout(() => {
        setLoadingId(null)
        setProgress(0)
      }, 500)
    }
  }

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
    <div className={styles.container}>
      {/* 标题 */}
      <div className={styles.header}>
        <h3>选择{getTypeName()}</h3>
        <span className={styles.count}>{resources.length} 个可用</span>
      </div>

      {/* 资源网格 */}
      <div className={styles.grid}>
        {resources.map(resource => (
          <div
            key={resource.id}
            className={`${styles.card} ${loadingId === resource.id ? styles.loading : ''}`}
            onClick={() => loadResource(resource)}
          >
            {/* 缩略图 */}
            <div className={styles.thumbnail}>
              {resource.thumbnail ? (
                <img src={resource.thumbnail} alt={resource.name} />
              ) : (
                <div className={styles.placeholder}>
                  {type === 'characters' && '👤'}
                  {type === 'props' && '📦'}
                  {type === 'scenes' && '🎬'}
                  {type === 'motions' && '🎭'}
                  {type === 'music' && '🎵'}
                </div>
              )}
              
              {/* 加载遮罩 */}
              {loadingId === resource.id && (
                <div className={styles.overlay}>
                  <div className={styles.spinner} />
                  <span className={styles.percent}>{Math.round(progress)}%</span>
                </div>
              )}
            </div>

            {/* 信息 */}
            <div className={styles.info}>
              <span className={styles.name}>{resource.name}</span>
              <span className={styles.type}>{resource.file.split('.').pop().toUpperCase()}</span>
            </div>

            {/* 选中标记 */}
            <div className={styles.checkmark}>✓</div>
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {resources.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📂</div>
          <p>暂无可用{getTypeName()}</p>
          <span>请将文件放入 public/{resourcePaths[type]} 目录</span>
        </div>
      )}
    </div>
  )
}

/**
 * 本地资源加载对话框
 */
export function LocalResourceDialog({ isOpen, onClose, onLoad, type, title }) {
  if (!isOpen) return null

  return (
    <div className={styles.dialogOverlay} onClick={onClose}>
      <div className={styles.dialog} onClick={e => e.stopPropagation()}>
        <div className={styles.dialogHeader}>
          <h3>{title || '选择资源'}</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.dialogContent}>
          <LocalResourceLoader onLoad={onLoad} type={type} />
        </div>
      </div>
    </div>
  )
}
