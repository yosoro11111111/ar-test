import React, { useState } from 'react'
import styles from './MotionGroupPanel.module.css'
import { 
  builtinMotionGroups, 
  motionGroupCategories,
  getMotionGroupsByCategory,
  searchMotionGroups,
  expandMotionGroupToClips
} from '../data/motionGroups.js'

/**
 * 动作组面板组件
 * 
 * 功能：
 * - 显示分类的动作组列表
 * - 支持搜索
 * - 可展开查看动作组内的动作序列
 * - 拖放到时间轴
 */
export function MotionGroupPanel({ onDragStart, onAddToTimeline, onCreateGroup }) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [expandedGroup, setExpandedGroup] = useState(null)

  // 获取过滤后的动作组
  const getFilteredGroups = () => {
    let groups = builtinMotionGroups
    
    // 按分类过滤
    if (selectedCategory !== 'all') {
      groups = getMotionGroupsByCategory(selectedCategory)
    }
    
    // 按关键词搜索
    if (searchKeyword.trim()) {
      groups = searchMotionGroups(searchKeyword)
    }
    
    return groups
  }

  // 处理拖拽开始
  const handleDragStart = (e, group) => {
    const dragData = {
      type: 'motionGroup',
      id: group.id,
      name: group.name,
      duration: group.duration,
      motions: group.motions
    }
    e.dataTransfer.setData('application/json', JSON.stringify(dragData))
    e.dataTransfer.effectAllowed = 'copy'
    onDragStart?.(group)
  }

  // 处理点击添加
  const handleAddClick = (group) => {
    onAddToTimeline?.(group)
  }

  // 切换展开状态
  const toggleExpand = (groupId) => {
    setExpandedGroup(expandedGroup === groupId ? null : groupId)
  }

  const filteredGroups = getFilteredGroups()

  return (
    <div className={styles.container}>
      {/* 搜索栏 */}
      <div className={styles.searchBar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="搜索动作组..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
        {searchKeyword && (
          <button 
            className={styles.clearBtn}
            onClick={() => setSearchKeyword('')}
          >
            ✕
          </button>
        )}
      </div>

      {/* 分类标签 */}
      <div className={styles.categoryTabs}>
        <button
          className={`${styles.categoryTab} ${selectedCategory === 'all' ? styles.active : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          <span className={styles.tabIcon}>📁</span>
          <span>全部</span>
        </button>
        {motionGroupCategories.map(cat => (
          <button
            key={cat.id}
            className={`${styles.categoryTab} ${selectedCategory === cat.id ? styles.active : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            <span className={styles.tabIcon}>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* 动作组列表 */}
      <div className={styles.groupList}>
        {filteredGroups.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🔍</span>
            <p>没有找到匹配的动作组</p>
          </div>
        ) : (
          filteredGroups.map(group => (
            <div
              key={group.id}
              className={styles.groupItem}
              draggable
              onDragStart={(e) => handleDragStart(e, group)}
            >
              {/* 动作组头部 */}
              <div 
                className={styles.groupHeader}
                onClick={() => toggleExpand(group.id)}
              >
                <div className={styles.groupInfo}>
                  <span className={styles.groupIcon}>
                    {motionGroupCategories.find(c => c.id === group.category)?.icon || '🎬'}
                  </span>
                  <div className={styles.groupText}>
                    <span className={styles.groupName}>{group.name}</span>
                    <span className={styles.groupDesc}>{group.description}</span>
                  </div>
                </div>
                <div className={styles.groupMeta}>
                  <span className={styles.duration}>{group.duration}秒</span>
                  <span className={styles.motionCount}>{group.motions.length}个动作</span>
                  <button 
                    className={styles.expandBtn}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleExpand(group.id)
                    }}
                  >
                    {expandedGroup === group.id ? '▼' : '▶'}
                  </button>
                </div>
              </div>

              {/* 展开的动作列表 */}
              {expandedGroup === group.id && (
                <div className={styles.motionList}>
                  {group.motions.map((motion, index) => (
                    <div key={index} className={styles.motionItem}>
                      <span className={styles.motionIndex}>{index + 1}</span>
                      <span className={styles.motionName}>{motion.name}</span>
                      <span className={styles.motionDuration}>{motion.duration}秒</span>
                      <span className={`${styles.motionType} ${styles[motion.type]}`}>
                        {getMotionTypeLabel(motion.type)}
                      </span>
                    </div>
                  ))}
                  <button 
                    className={styles.addBtn}
                    onClick={() => handleAddClick(group)}
                  >
                    ➕ 添加到时间轴
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 底部信息 */}
      <div className={styles.footer}>
        <span>共 {filteredGroups.length} 个动作组</span>
        <span className={styles.hint}>💡 拖拽到时间轴使用</span>
        {onCreateGroup && (
          <button 
            className={styles.createBtn}
            onClick={onCreateGroup}
            title="新建动作组"
          >
            ➕ 新建
          </button>
        )}
      </div>
    </div>
  )
}

// 获取动作类型标签
function getMotionTypeLabel(type) {
  const labels = {
    transition: '过渡',
    loop: '循环',
    idle: '待机',
    expression: '表情'
  }
  return labels[type] || type
}
