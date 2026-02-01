import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  scanMotionPackFiles, 
  loadMotionPackActions, 
  getLoadedMotionPackActions,
  motionPackCategories 
} from '../data/motionPackActions'
import './MotionPackPanel.css'

// Motion Pack 动作面板 - 使用用户的真实 FBX 动作
export const MotionPackPanel = ({ 
  isOpen, 
  onClose, 
  onSelectAction,
  isMobile 
}) => {
  const [actions, setActions] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('motionPackFavorites')
    return saved ? JSON.parse(saved) : []
  })
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [error, setError] = useState(null)
  
  const loadedRef = useRef(false)

  if (!isOpen) return null

  // 加载动作
  const loadActions = useCallback(async () => {
    if (loadedRef.current) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // 扫描文件
      const files = await scanMotionPackFiles()
      
      if (files.length === 0) {
        setError('未找到 FBX 动作文件，请确保文件放在 public/motionpack 目录中')
        setIsLoading(false)
        return
      }
      
      // 加载所有动作
      const loadedActions = await loadMotionPackActions(
        files.map(f => `/motionpack/${f}`),
        (current, total, action) => {
          setLoadingProgress((current / total) * 100)
        }
      )
      
      setActions(loadedActions)
      loadedRef.current = true
    } catch (err) {
      setError('加载动作失败: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 首次打开时加载
  useEffect(() => {
    if (isOpen && !loadedRef.current) {
      loadActions()
    }
  }, [isOpen, loadActions])

  // 过滤动作
  const getFilteredActions = () => {
    let filtered = actions

    // 按分类筛选
    if (activeCategory !== 'all') {
      filtered = filtered.filter(a => a.category === activeCategory)
    }

    // 按搜索词筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(query) ||
        a.category.toLowerCase().includes(query)
      )
    }

    // 收藏优先
    const favActions = filtered.filter(a => favorites.includes(a.id))
    const otherActions = filtered.filter(a => !favorites.includes(a.id))
    
    return [...favActions, ...otherActions]
  }

  const filteredActions = getFilteredActions()

  // 切换收藏
  const toggleFavorite = (e, actionId) => {
    e.stopPropagation()
    const newFavorites = favorites.includes(actionId)
      ? favorites.filter(id => id !== actionId)
      : [...favorites, actionId]
    setFavorites(newFavorites)
    localStorage.setItem('motionPackFavorites', JSON.stringify(newFavorites))
  }

  // 选择动作
  const handleSelectAction = (action) => {
    onSelectAction?.(action)
    onClose()
  }

  // 获取分类统计
  const getCategoryCount = (categoryId) => {
    if (categoryId === 'all') return actions.length
    return actions.filter(a => a.category === categoryId).length
  }

  // 渲染动作卡片
  const renderActionCard = (action) => {
    const isFavorite = favorites.includes(action.id)
    
    return (
      <div
        key={action.id}
        className={`motionpack-action-card ${isFavorite ? 'favorited' : ''}`}
        onClick={() => handleSelectAction(action)}
      >
        <div className="action-card-inner">
          <div className="action-icon-wrapper">
            <div className="action-icon">{action.icon}</div>
          </div>
          <div className="action-name">{action.name}</div>
          <div className="action-meta">
            <span className="category-badge">{action.category}</span>
            <span className="duration-badge">{(action.duration / 1000).toFixed(1)}s</span>
          </div>
        </div>
        
        <button 
          className={`favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={(e) => toggleFavorite(e, action.id)}
          title={isFavorite ? '取消收藏' : '收藏'}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      </div>
    )
  }

  // 渲染列表项
  const renderActionListItem = (action) => {
    const isFavorite = favorites.includes(action.id)
    
    return (
      <div
        key={action.id}
        className="motionpack-action-list-item"
        onClick={() => handleSelectAction(action)}
      >
        <div className="list-icon">{action.icon}</div>
        <div className="list-info">
          <div className="list-name">{action.name}</div>
          <div className="list-category">
            <span>{action.category}</span>
            <span className="duration">{(action.duration / 1000).toFixed(1)}s</span>
          </div>
        </div>
        <button 
          className={`list-favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={(e) => toggleFavorite(e, action.id)}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      </div>
    )
  }

  return (
    <div className="motionpack-overlay" onClick={onClose}>
      <div 
        className={`motionpack-panel ${isMobile ? 'mobile' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="panel-header">
          <div className="header-left">
            <h2>🎬 Motion Pack</h2>
            <span className="action-count">
              {filteredActions.length} / {actions.length}
            </span>
          </div>
          <div className="header-controls">
            {/* 视图切换 */}
            <div className="view-toggle">
              <button 
                className={viewMode === 'grid' ? 'active' : ''}
                onClick={() => setViewMode('grid')}
                title="网格视图"
              >
                ⊞
              </button>
              <button 
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => setViewMode('list')}
                title="列表视图"
              >
                ☰
              </button>
            </div>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
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
          {searchQuery && (
            <button 
              className="clear-search"
              onClick={() => setSearchQuery('')}
            >
              ×
            </button>
          )}
        </div>

        {/* 分类标签 */}
        <div className="category-tabs">
          {motionPackCategories.map(cat => (
            <button 
              key={cat.id}
              className={activeCategory === cat.id ? 'active' : ''}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              <span className="count">{getCategoryCount(cat.id)}</span>
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="panel-content">
          {isLoading ? (
            <div className="loading-state">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <p>正在加载动作... {Math.round(loadingProgress)}%</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
              <button className="retry-btn" onClick={loadActions}>
                重试
              </button>
            </div>
          ) : filteredActions.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🎭</span>
              <p>没有找到动作</p>
              {searchQuery && (
                <button 
                  className="clear-filter-btn"
                  onClick={() => {
                    setSearchQuery('')
                    setActiveCategory('all')
                  }}
                >
                  清除筛选
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="action-grid">
              {filteredActions.map(renderActionCard)}
            </div>
          ) : (
            <div className="action-list">
              {filteredActions.map(renderActionListItem)}
            </div>
          )}
        </div>

        {/* 底部信息 */}
        <div className="panel-footer">
          <span className="footer-info">
            使用真实 Mixamo 动作捕捉数据
          </span>
        </div>
      </div>
    </div>
  )
}

export default MotionPackPanel
