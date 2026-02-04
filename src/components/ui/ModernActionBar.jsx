import React, { useState } from 'react'
import styles from '../styles/ARSystem.module.css'

/**
 * 现代化底部动作栏组件
 * 使用横向轮播替代网格布局
 */
export const ModernActionBar = ({
  isMobile,
  categories,
  actions,
  currentAction,
  searchQuery,
  onSearchChange,
  onCategorySelect,
  onActionSelect
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all')

  // 过滤动作
  const filteredActions = selectedCategory === 'all' 
    ? actions 
    : actions.filter(a => a.category === selectedCategory)

  const handleCategoryClick = (category) => {
    setSelectedCategory(category)
    onCategorySelect?.(category)
  }

  return (
    <div className={styles.actionBar}>
      {/* 搜索框 */}
      <div className={styles.searchBox}>
        <span className={styles.searchIcon}>🔍</span>
        <input 
          type="text"
          className={styles.searchInput}
          placeholder="搜索动作..."
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
      </div>

      {/* 分类标签 */}
      <div className={styles.categoryList}>
        <button 
          className={`${styles.categoryTag} ${selectedCategory === 'all' ? styles.active : ''}`}
          onClick={() => handleCategoryClick('all')}
        >
          全部
        </button>
        {categories.map(cat => (
          <button 
            key={cat}
            className={`${styles.categoryTag} ${selectedCategory === cat ? styles.active : ''}`}
            onClick={() => handleCategoryClick(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 动作轮播 */}
      <div className={styles.actionCarousel}>
        {filteredActions.map(action => (
          <button 
            key={action.id}
            className={`${styles.actionCard} ${currentAction?.id === action.id ? styles.active : ''}`}
            onClick={() => onActionSelect?.(action)}
          >
            <span className={styles.actionIcon}>{action.icon}</span>
            <span className={styles.actionName}>{action.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default ModernActionBar
