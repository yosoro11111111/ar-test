import React, { useState, useEffect } from 'react'
import styles from './ActionSelectModal.module.css'
import { getAllVRMActions } from '../../../data/vrmaActions'

/**
 * 动作选择弹窗 - 使用VRMA动作库
 * 参考ActionPanel实现
 */
export function ActionSelectModal({ onSelect, onClose }) {
  const [actions, setActions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('mmd-action-favorites')
    return saved ? JSON.parse(saved) : []
  })
  const [loading, setLoading] = useState(true)

  // VRMA分类
  const categories = [
    { id: 'all', name: '全部', icon: '📁' },
    { id: 'favorites', name: '收藏', icon: '⭐' },
    { id: '基础', name: '基础', icon: '👤' },
    { id: '舞蹈', name: '舞蹈', icon: '💃' },
    { id: '战斗', name: '战斗', icon: '⚔️' },
    { id: '表情', name: '表情', icon: '😊' },
    { id: '运动', name: '运动', icon: '⚽' },
    { id: '特殊', name: '特殊', icon: '✨' },
  ]

  // 加载动作
  useEffect(() => {
    setLoading(true)
    getAllVRMActions().then(list => {
      setActions(list)
      setLoading(false)
    })
  }, [])

  // 过滤动作
  const filteredActions = actions.filter(action => {
    const matchesSearch = action.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.originalName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesCategory = true
    if (selectedCategory === 'favorites') {
      matchesCategory = favorites.includes(action.id)
    } else if (selectedCategory === 'all') {
      matchesCategory = true
    } else {
      matchesCategory = action.category?.startsWith(selectedCategory)
    }
    
    return matchesSearch && matchesCategory
  })

  // 切换收藏
  const toggleFavorite = (e, actionId) => {
    e.stopPropagation()
    const newFavorites = favorites.includes(actionId)
      ? favorites.filter(id => id !== actionId)
      : [...favorites, actionId]
    setFavorites(newFavorites)
    localStorage.setItem('mmd-action-favorites', JSON.stringify(newFavorites))
  }

  // 获取分类数量
  const getCategoryCount = (catId) => {
    if (catId === 'favorites') return favorites.length
    if (catId === 'all') return actions.length
    return actions.filter(a => a.category?.startsWith(catId)).length
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>🎭 选择动作</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* 搜索框 */}
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="搜索动作..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* 分类标签 */}
        <div className={styles.categoryTabs}>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`${styles.categoryTab} ${selectedCategory === cat.id ? styles.active : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              <span className={styles.count}>{getCategoryCount(cat.id)}</span>
            </button>
          ))}
        </div>

        {/* 动作网格 */}
        <div className={styles.actionGrid}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <p>加载动作库...</p>
            </div>
          ) : filteredActions.length > 0 ? (
            filteredActions.map(action => {
              const isFavorite = favorites.includes(action.id)
              return (
                <div
                  key={action.id}
                  className={`${styles.actionCard} ${isFavorite ? styles.favorited : ''}`}
                  onClick={() => onSelect(action)}
                >
                  <div className={styles.actionIconWrapper}>
                    <span className={styles.actionIcon}>{action.icon}</span>
                  </div>
                  <div className={styles.actionInfo}>
                    <span className={styles.actionName}>{action.name}</span>
                    <span className={styles.actionCategory}>{action.category}</span>
                  </div>
                  <div className={styles.actionMeta}>
                    {action.type === 'loop' && <span className={styles.typeBadge}>循环</span>}
                    {action.type === 'once' && <span className={styles.typeBadge}>单次</span>}
                    {action.duration && (
                      <span className={styles.durationBadge}>{Math.round(action.duration / 1000)}s</span>
                    )}
                  </div>
                  <button
                    className={`${styles.favoriteBtn} ${isFavorite ? styles.active : ''}`}
                    onClick={(e) => toggleFavorite(e, action.id)}
                  >
                    {isFavorite ? '★' : '☆'}
                  </button>
                </div>
              )
            })
          ) : (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🎭</span>
              <p>未找到匹配的动作</p>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <span className={styles.resultCount}>
            共 {filteredActions.length} / {actions.length} 个动作
          </span>
          <button className={styles.cancelBtn} onClick={onClose}>
            取消
          </button>
        </div>
      </div>
    </div>
  )
}

export default ActionSelectModal
