import React, { useState, useEffect } from 'react'
import { actions, actionCategories, getActionsByCategory, searchActions } from '../data/actions'
import './ActionPanel.css'

// 动作面板组件
export const ActionPanel = ({ 
  isOpen, 
  onClose, 
  onSelectAction, 
  currentAction,
  isMobile 
}) => {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('actionFavorites')
    return saved ? JSON.parse(saved) : []
  })
  const [recentActions, setRecentActions] = useState(() => {
    const saved = localStorage.getItem('recentActions')
    return saved ? JSON.parse(saved) : []
  })

  if (!isOpen) return null

  // 过滤动作
  const getFilteredActions = () => {
    let filtered = actions

    if (activeCategory === 'favorites') {
      filtered = actions.filter(a => favorites.includes(a.id))
    } else if (activeCategory === 'recent') {
      filtered = recentActions.map(id => actions.find(a => a.id === id)).filter(Boolean)
    } else if (activeCategory !== 'all') {
      filtered = getActionsByCategory(activeCategory)
    }

    if (searchQuery) {
      filtered = searchActions(searchQuery).filter(a => 
        activeCategory === 'all' || 
        activeCategory === 'favorites' && favorites.includes(a.id) ||
        activeCategory === 'recent' && recentActions.includes(a.id) ||
        a.category === activeCategory
      )
    }

    return filtered
  }

  const filteredActions = getFilteredActions()

  // 添加到最近使用
  const handleSelectAction = (action) => {
    const newRecent = [action.id, ...recentActions.filter(id => id !== action.id)].slice(0, 10)
    setRecentActions(newRecent)
    localStorage.setItem('recentActions', JSON.stringify(newRecent))
    onSelectAction?.(action)
  }

  // 切换收藏
  const toggleFavorite = (e, actionId) => {
    e.stopPropagation()
    const newFavorites = favorites.includes(actionId)
      ? favorites.filter(id => id !== actionId)
      : [...favorites, actionId]
    setFavorites(newFavorites)
    localStorage.setItem('actionFavorites', JSON.stringify(newFavorites))
  }

  // 获取分类统计
  const getCategoryCount = (categoryId) => {
    if (categoryId === 'favorites') return favorites.length
    if (categoryId === 'recent') return recentActions.length
    if (categoryId === 'all') return actions.length
    return getActionsByCategory(categoryId).length
  }

  return (
    <div className="action-panel-overlay" onClick={onClose}>
      <div className={`action-panel ${isMobile ? 'mobile' : ''}`} onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="panel-header">
          <h2>动作库</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* 搜索 */}
        <div className="panel-search">
          <input
            type="text"
            placeholder="搜索动作..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        {/* 分类标签 */}
        <div className="category-tabs">
          <button 
            className={activeCategory === 'all' ? 'active' : ''}
            onClick={() => setActiveCategory('all')}
          >
            <span>全部</span>
            <span className="count">{getCategoryCount('all')}</span>
          </button>
          <button 
            className={activeCategory === 'favorites' ? 'active' : ''}
            onClick={() => setActiveCategory('favorites')}
          >
            <span>⭐</span>
            <span className="count">{getCategoryCount('favorites')}</span>
          </button>
          <button 
            className={activeCategory === 'recent' ? 'active' : ''}
            onClick={() => setActiveCategory('recent')}
          >
            <span>🕐</span>
            <span className="count">{getCategoryCount('recent')}</span>
          </button>
          {actionCategories.map(cat => (
            <button 
              key={cat.id}
              className={activeCategory === cat.id ? 'active' : ''}
              onClick={() => setActiveCategory(cat.id)}
              style={activeCategory === cat.id ? { background: cat.color } : {}}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              <span className="count">{getCategoryCount(cat.id)}</span>
            </button>
          ))}
        </div>

        {/* 动作网格 */}
        <div className="action-grid">
          {filteredActions.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🎭</span>
              <p>没有找到相关动作</p>
            </div>
          ) : (
            filteredActions.map(action => (
              <div
                key={action.id}
                className={`action-card ${currentAction?.id === action.id ? 'active' : ''}`}
                onClick={() => handleSelectAction(action)}
              >
                <div className="action-icon">{action.icon}</div>
                <div className="action-name">{action.name}</div>
                <div className="action-type">
                  {action.type === 'loop' && <span className="type-badge loop">循环</span>}
                  {action.type === 'once' && <span className="type-badge once">单次</span>}
                  {action.type === 'pose' && <span className="type-badge pose">姿势</span>}
                </div>
                <button 
                  className={`favorite-btn ${favorites.includes(action.id) ? 'active' : ''}`}
                  onClick={(e) => toggleFavorite(e, action.id)}
                >
                  {favorites.includes(action.id) ? '★' : '☆'}
                </button>
              </div>
            ))
          )}
        </div>

        {/* 底部统计 */}
        <div className="panel-footer">
          <span>共 {actions.length} 种动作</span>
          <span>当前显示 {filteredActions.length} 个</span>
        </div>
      </div>
    </div>
  )
}

export default ActionPanel
