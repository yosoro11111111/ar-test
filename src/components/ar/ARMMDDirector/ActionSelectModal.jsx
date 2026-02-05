import React, { useState } from 'react'
import styles from './ActionSelectModal.module.css'

/**
 * 动作选择弹窗 - 参考App.jsx动作面板
 */
export function ActionSelectModal({ actions, onSelect, onClose }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('mmd-action-favorites')
    return saved ? JSON.parse(saved) : []
  })

  // 获取所有分类
  const categories = ['all', 'favorite', ...new Set(actions.map(a => a.category).filter(Boolean))]

  // 过滤动作
  const filteredActions = actions.filter(action => {
    const matchesSearch = action.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' 
      ? true 
      : selectedCategory === 'favorite'
        ? favorites.includes(action.id)
        : action.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // 分类名称映射
  const categoryNames = {
    all: '全部',
    favorite: '收藏',
    dance: '舞蹈',
    walk: '行走',
    run: '跑步',
    idle: '待机',
    gesture: '手势',
    expression: '表情',
    combat: '战斗',
    motion: '动作'
  }

  // 切换收藏
  const toggleFavorite = (e, actionId) => {
    e.stopPropagation()
    const newFavorites = favorites.includes(actionId)
      ? favorites.filter(id => id !== actionId)
      : [...favorites, actionId]
    setFavorites(newFavorites)
    localStorage.setItem('mmd-action-favorites', JSON.stringify(newFavorites))
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
              key={cat}
              className={`${styles.categoryTab} ${selectedCategory === cat ? styles.active : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'favorite' ? '⭐ ' : ''}
              {categoryNames[cat] || cat}
            </button>
          ))}
        </div>

        {/* 动作列表 */}
        <div className={styles.actionList}>
          {filteredActions.length > 0 ? (
            filteredActions.map(action => {
              const isFavorite = favorites.includes(action.id)
              return (
                <div
                  key={action.id}
                  className={styles.actionItem}
                  onClick={() => onSelect(action)}
                >
                  <div className={styles.actionIcon}>🎬</div>
                  <div className={styles.actionInfo}>
                    <span className={styles.actionName}>{action.name}</span>
                    <span className={styles.actionCategory}>
                      {categoryNames[action.category] || action.category}
                    </span>
                  </div>
                  <div className={styles.actionRight}>
                    <span className={styles.actionDuration}>
                      {action.duration ? `${action.duration}秒` : '循环'}
                    </span>
                    <button
                      className={`${styles.favoriteBtn} ${isFavorite ? styles.active : ''}`}
                      onClick={(e) => toggleFavorite(e, action.id)}
                    >
                      {isFavorite ? '★' : '☆'}
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className={styles.emptyState}>
              <p>未找到匹配的动作</p>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <span className={styles.resultCount}>
            共 {filteredActions.length} 个动作
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
