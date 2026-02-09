import React, { useState } from 'react'
import styles from './MotionCategorySelector.module.css'
import { motionCategories } from '../data/resourceCategories.js'

/**
 * 动作分类选择器
 * 
 * 功能：
 * - 显示前3个分类
 * - 下拉按钮显示所有分类
 * - 中文显示
 */
export function MotionCategorySelector({ selectedCategory, onSelectCategory }) {
  const [showDropdown, setShowDropdown] = useState(false)
  
  // 前3个分类
  const visibleCategories = motionCategories.slice(0, 4)
  // 剩余分类
  const moreCategories = motionCategories.slice(4)
  
  const handleSelect = (categoryId) => {
    onSelectCategory(categoryId)
    setShowDropdown(false)
  }
  
  return (
    <div className={styles.container}>
      {/* 可见分类 */}
      <div className={styles.visibleCategories}>
        {visibleCategories.map(cat => (
          <button
            key={cat.id}
            className={`${styles.categoryBtn} ${selectedCategory === cat.id ? styles.active : ''}`}
            onClick={() => handleSelect(cat.id)}
            title={cat.name}
          >
            <span className={styles.categoryIcon}>{cat.icon}</span>
            <span className={styles.categoryName}>{cat.name}</span>
          </button>
        ))}
      </div>
      
      {/* 更多下拉按钮 */}
      <div className={styles.dropdownContainer}>
        <button
          className={`${styles.moreBtn} ${showDropdown ? styles.open : ''}`}
          onClick={() => setShowDropdown(!showDropdown)}
          title="更多分类"
        >
          <span className={styles.moreIcon}>▼</span>
        </button>
        
        {/* 下拉菜单 */}
        {showDropdown && (
          <div className={styles.dropdown}>
            {moreCategories.map(cat => (
              <button
                key={cat.id}
                className={`${styles.dropdownItem} ${selectedCategory === cat.id ? styles.active : ''}`}
                onClick={() => handleSelect(cat.id)}
              >
                <span className={styles.dropdownIcon}>{cat.icon}</span>
                <span className={styles.dropdownName}>{cat.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
