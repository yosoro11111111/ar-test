import React, { useState } from 'react'
import styles from './ActionSelectModal.module.css'

/**
 * 动作选择弹窗 - 分类浏览+搜索
 */
export function ActionSelectModal({ actions, onSelect, onClose }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  // 获取所有分类
  const categories = ['all', ...new Set(actions.map(a => a.category))]
  
  // 过滤动作
  const filteredActions = actions.filter(action => {
    const matchesSearch = action.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || action.category === selectedCategory
    return matchesSearch && matchesCategory
  })
  
  // 分类名称映射
  const categoryNames = {
    all: '全部',
    dance: '舞蹈',
    walk: '行走',
    run: '跑步',
    idle: '待机',
    gesture: '手势',
    expression: '表情',
    combat: '战斗'
  }
  
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>🎭 选择动作</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="搜索动作..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.categoryTabs}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`${styles.categoryTab} ${selectedCategory === cat ? styles.active : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {categoryNames[cat] || cat}
            </button>
          ))}
        </div>
        
        <div className={styles.actionList}>
          {filteredActions.length > 0 ? (
            filteredActions.map(action => (
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
                <span className={styles.actionDuration}>
                  {action.duration ? `${action.duration}秒` : '循环'}
                </span>
              </div>
            ))
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
