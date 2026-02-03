import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useActionStore } from '../../../stores/actionStore'
import { useUIStore } from '../../../stores/uiStore'
import './ActionPanel.css'

export const ActionPanel = ({ 
  actions = [], 
  onActionSelect,
  isMobile = false 
}) => {
  const { 
    favorites, 
    recentActions, 
    addFavorite, 
    removeFavorite,
    addRecentAction,
    recordActionUsage,
    currentAction 
  } = useActionStore()
  
  const { closePanel } = useUIStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [previewAction, setPreviewAction] = useState(null)
  const previewTimerRef = useRef(null)

  // 分类列表
  const categories = useMemo(() => {
    const cats = new Map()
    actions.forEach(action => {
      if (!cats.has(action.category)) {
        cats.set(action.category, { count: 0, icon: action.icon })
      }
      cats.get(action.category).count++
    })
    return [
      { id: 'all', name: '全部', icon: '✨', count: actions.length },
      { id: 'favorites', name: '收藏', icon: '⭐', count: favorites.length },
      { id: 'recent', name: '最近', icon: '📜', count: recentActions.length },
      ...Array.from(cats.entries()).map(([cat, data]) => ({
        id: cat,
        name: cat,
        icon: data.icon,
        count: data.count
      }))
    ]
  }, [actions, favorites.length, recentActions.length])

  // 过滤动作
  const filteredActions = useMemo(() => {
    let filtered = actions
    
    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(action => 
        action.name.toLowerCase().includes(query) ||
        action.category.toLowerCase().includes(query)
      )
    }
    
    // 分类过滤
    if (activeCategory === 'favorites') {
      const favIds = new Set(favorites.map(f => f.id))
      filtered = filtered.filter(action => favIds.has(action.id))
    } else if (activeCategory === 'recent') {
      const recentIds = new Set(recentActions.map(r => r.id))
      filtered = filtered.filter(action => recentIds.has(action.id))
    } else if (activeCategory !== 'all') {
      filtered = filtered.filter(action => action.category === activeCategory)
    }
    
    return filtered
  }, [actions, searchQuery, activeCategory, favorites, recentActions])

  // 处理动作选择
  const handleActionClick = useCallback((action) => {
    onActionSelect?.(action)
    addRecentAction(action)
    recordActionUsage(action.id)
    if (isMobile) {
      closePanel()
    }
  }, [onActionSelect, addRecentAction, recordActionUsage, isMobile, closePanel])

  // 处理收藏
  const handleFavoriteToggle = useCallback((e, action) => {
    e.stopPropagation()
    const isFav = favorites.some(f => f.id === action.id)
    if (isFav) {
      removeFavorite(action.id)
    } else {
      addFavorite(action)
    }
  }, [favorites, addFavorite, removeFavorite])

  // 预览功能
  const handleMouseEnter = useCallback((action) => {
    previewTimerRef.current = setTimeout(() => {
      setPreviewAction(action)
    }, 500)
  }, [])

  const handleMouseLeave = useCallback(() => {
    clearTimeout(previewTimerRef.current)
    setPreviewAction(null)
  }, [])

  // 随机选择
  const handleRandom = useCallback(() => {
    if (filteredActions.length > 0) {
      const randomAction = filteredActions[Math.floor(Math.random() * filteredActions.length)]
      handleActionClick(randomAction)
    }
  }, [filteredActions, handleActionClick])

  return (
    <div className={`action-panel ${isMobile ? 'mobile' : 'desktop'}`}>
      {/* 搜索栏 */}
      <div className="action-panel-header">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="搜索动作..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button 
              className="clear-search"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>
        
        <div className="header-actions">
          <button 
            className="header-btn"
            onClick={handleRandom}
            title="随机动作"
          >
            🎲
          </button>
          <button 
            className={`header-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            title="切换视图"
          >
            {viewMode === 'grid' ? '☰' : '⊞'}
          </button>
          {isMobile && (
            <button 
              className="header-btn close"
              onClick={closePanel}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 分类标签 */}
      <div className="category-tabs">
        <div className="category-scroll">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              <span className="tab-icon">{category.icon}</span>
              <span className="tab-name">{category.name}</span>
              <span className="tab-count">({category.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 动作列表 */}
      <div className={`action-list ${viewMode}`}>
        {filteredActions.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <p>未找到匹配的动作</p>
          </div>
        ) : (
          filteredActions.map(action => (
            <div
              key={action.id}
              className={`action-item ${currentAction?.id === action.id ? 'active' : ''}`}
              onClick={() => handleActionClick(action)}
              onMouseEnter={() => handleMouseEnter(action)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="action-icon">{action.icon}</div>
              <div className="action-info">
                <span className="action-name">{action.name}</span>
                <span className="action-category">{action.category}</span>
              </div>
              <button
                className={`favorite-btn ${favorites.some(f => f.id === action.id) ? 'active' : ''}`}
                onClick={(e) => handleFavoriteToggle(e, action)}
              >
                {favorites.some(f => f.id === action.id) ? '★' : '☆'}
              </button>
              
              {/* 预览窗口 */}
              {previewAction?.id === action.id && !isMobile && (
                <div className="action-preview">
                  <div className="preview-content">
                    <span className="preview-icon">{action.icon}</span>
                    <span className="preview-text">预览: {action.name}</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 底部信息 */}
      <div className="action-panel-footer">
        <span>共 {filteredActions.length} 个动作</span>
        {activeCategory !== 'all' && (
          <button 
            className="clear-filter"
            onClick={() => setActiveCategory('all')}
          >
            清除筛选
          </button>
        )}
      </div>
    </div>
  )
}

export default ActionPanel
