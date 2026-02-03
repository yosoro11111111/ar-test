import React, { useState, useEffect, useCallback, useRef } from 'react'
import { getAllVRMAActions, loadVRMAAction } from '../data/vrmaActions'
import './ActionPanel.css'

// VRMA 分类定义
const vrmaCategories = [
  { id: '基础', name: '基础动作', icon: '👤' },
  { id: '舞蹈', name: '舞蹈动作', icon: '💃' },
  { id: '战斗', name: '战斗动作', icon: '⚔️' },
  { id: '表情', name: '表情动作', icon: '😊' },
  { id: '运动', name: '运动动作', icon: '⚽' },
  { id: '特殊', name: '特殊动作', icon: '✨' },
  { id: '其他', name: '其他动作', icon: '🎭' }
]

// 动作面板组件 - 优化版本
// 支持全屏显示、立即切换动作、更好的视觉反馈
// VERSION: 2024-02-02-002 - VRMA Edition

console.log('🎭 ActionPanel.jsx 模块加载 - VRMA Edition')

export const ActionPanel = ({ 
  isOpen, 
  onClose, 
  onSelectAction, 
  currentAction,
  isMobile,
  isFullscreen = false,
  onToggleFullscreen
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
  const [playingAction, setPlayingAction] = useState(null)
  const [viewMode, setViewMode] = useState('grid')
  const [loadedList, setLoadedList] = useState([])
  const gridRef = useRef(null)

  // 监听当前动作变化
  useEffect(() => {
    if (currentAction) {
      setPlayingAction(currentAction.id)
    }
  }, [currentAction])

  const allActions = React.useMemo(() => {
    if (!isOpen) return []
    return loadedList
  }, [isOpen, loadedList])

  useEffect(() => {
    let mounted = true
    if (isOpen) {
      getAllVRMAActions().then(list => {
        if (mounted) setLoadedList(list)
      })
    }
    return () => { mounted = false }
  }, [isOpen])

  // 过滤动作
  const filteredActions = React.useMemo(() => {
    let filtered = loadedList

    if (activeCategory === 'favorites') {
      filtered = allActions.filter(a => favorites.includes(a.id))
    } else if (activeCategory === 'recent') {
      filtered = recentActions.map(id => allActions.find(a => a.id === id)).filter(Boolean)
    } else if (activeCategory !== 'all') {
      filtered = loadedList.filter(a => a.category === activeCategory)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = loadedList.filter(a => 
        a.name.toLowerCase().includes(query) ||
        a.category.toLowerCase().includes(query)
      ).filter(a => 
        activeCategory === 'all' || 
        activeCategory === 'favorites' && favorites.includes(a.id) ||
        activeCategory === 'recent' && recentActions.includes(a.id) ||
        a.category === activeCategory
      )
    }

    return filtered
  }, [loadedList, activeCategory, favorites, recentActions, searchQuery])

  // 处理动作选择 - 立即切换
  const handleSelectAction = useCallback(async (action) => {
    console.log('🎯 ActionPanel 选择动作:', action.name, action.id)
    
    // 立即停止当前动作，开始新动作
    setPlayingAction(action.id)
    
    // 添加到最近使用
    const newRecent = [action.id, ...recentActions.filter(id => id !== action.id)].slice(0, 10)
    setRecentActions(newRecent)
    localStorage.setItem('recentActions', JSON.stringify(newRecent))
    
    if (!action.loaded && action.filePath) {
      try {
        const vrmModel = window.vrmModels && Object.values(window.vrmModels)[0]
        const loadedAction = await loadVRMAAction(action.filePath, vrmModel)
        const fullAction = { ...action, ...loadedAction, loaded: true }
        onSelectAction?.(fullAction, { immediate: true })
      } catch (error) {
        onSelectAction?.(action, { immediate: true })
      }
    } else {
      onSelectAction?.(action, { immediate: true })
    }
  }, [onSelectAction, recentActions])

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
    if (categoryId === 'all') return loadedList.length
    return loadedList.filter(a => a.category === categoryId).length
  }

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return
      
      if (e.key === 'Escape') {
        onClose()
      }
      
      // 数字键快速选择分类
      if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1
        const categories = ['all', 'favorites', 'recent', ...vrmaCategories.map(c => c.id)]
        if (categories[index]) {
          setActiveCategory(categories[index])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // 渲染动作卡片
  const renderActionCard = (action) => {
    const isPlaying = playingAction === action.id
    const isFavorite = favorites.includes(action.id)
    
    return (
      <div
        key={action.id}
        className={`action-card ${isPlaying ? 'playing' : ''} ${isFavorite ? 'favorited' : ''}`}
        onClick={() => handleSelectAction(action)}
        data-action-id={action.id}
      >
        <div className="action-card-inner">
          <div className="action-icon-wrapper">
            <div className="action-icon">{action.icon}</div>
            {isPlaying && (
              <div className="playing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>
          <div className="action-name">{action.name}</div>
          <div className="action-meta">
            {action.type === 'loop' && <span className="type-badge loop">循环</span>}
            {action.type === 'once' && <span className="type-badge once">单次</span>}
            {action.type === 'pose' && <span className="type-badge pose">姿势</span>}
            {action.duration && (
              <span className="duration-badge">{Math.round(action.duration / 1000)}s</span>
            )}
          </div>
        </div>
        
        <button 
          className={`favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={(e) => toggleFavorite(e, action.id)}
          title={isFavorite ? '取消收藏' : '收藏'}
        >
          {isFavorite ? '★' : '☆'}
        </button>
        
        {isPlaying && <div className="playing-border"></div>}
      </div>
    )
  }

  // 渲染列表项
  const renderActionListItem = (action) => {
    const isPlaying = playingAction === action.id
    const isFavorite = favorites.includes(action.id)
    const category = vrmaCategories.find(c => c.id === action.category)
    
    return (
      <div
        key={action.id}
        className={`action-list-item ${isPlaying ? 'playing' : ''}`}
        onClick={() => handleSelectAction(action)}
      >
        <div className="list-icon">{action.icon}</div>
        <div className="list-info">
          <div className="list-name">{action.name}</div>
          <div className="list-category">
            {category && <span style={{ color: category.color }}>{category.name}</span>}
          </div>
        </div>
        <div className="list-meta">
          {action.type === 'loop' && <span className="type-badge loop">循环</span>}
          {action.type === 'once' && <span className="type-badge once">单次</span>}
          {action.type === 'pose' && <span className="type-badge pose">姿势</span>}
        </div>
        <button 
          className={`list-favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={(e) => toggleFavorite(e, action.id)}
        >
          {isFavorite ? '★' : '☆'}
        </button>
        {isPlaying && (
          <div className="list-playing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className={`action-panel-overlay ${isFullscreen ? 'fullscreen' : ''}`} onClick={onClose}>
      <div 
        className={`action-panel ${isMobile ? 'mobile' : ''} ${isFullscreen ? 'fullscreen' : ''} view-${viewMode}`} 
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="panel-header">
          <div className="header-left">
            <h2>动作库 [VRMA]</h2>
            <span className="action-count">{filteredActions.length} / {loadedList.length}</span>
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
            
            {/* 全屏切换 */}
            {onToggleFullscreen && (
              <button 
                className="fullscreen-btn"
                onClick={onToggleFullscreen}
                title={isFullscreen ? '退出全屏' : '全屏'}
              >
                {isFullscreen ? '⤓' : '⤢'}
              </button>
            )}
            
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* 搜索 */}
        <div className="panel-search">
          <input
            type="text"
            placeholder="搜索动作... (支持拼音首字母)"
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
            <span>⭐ 收藏</span>
            <span className="count">{getCategoryCount('favorites')}</span>
          </button>
          <button 
            className={activeCategory === 'recent' ? 'active' : ''}
            onClick={() => setActiveCategory('recent')}
          >
            <span>🕐 最近</span>
            <span className="count">{getCategoryCount('recent')}</span>
          </button>
          {['基础','舞蹈','战斗','表情','运动','特殊','其他'].map(id => {
            const cat = { id, name: id, icon: id === '基础' ? '👤' : id === '舞蹈' ? '💃' : id === '战斗' ? '⚔️' : id === '表情' ? '😊' : id === '运动' ? '⚽' : id === '特殊' ? '✨' : '🎭' }
            return (
            <button 
              key={id}
              className={activeCategory === cat.id ? 'active' : ''}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              <span className="count">{getCategoryCount(cat.id)}</span>
            </button>
            )
          })}
        </div>

        {/* 动作区域 */}
        <div className="panel-content">
          {viewMode === 'grid' ? (
            <div className="action-grid" ref={gridRef}>
              {filteredActions.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🎭</span>
                  <p>没有找到相关动作</p>
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
              ) : (
                filteredActions.map(renderActionCard)
              )}
            </div>
          ) : (
            <div className="action-list" ref={gridRef}>
              {filteredActions.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🎭</span>
                  <p>没有找到相关动作</p>
                </div>
              ) : (
                filteredActions.map(renderActionListItem)
              )}
            </div>
          )}
        </div>

        {/* 底部信息 */}
        <div className="panel-footer">
          <div className="footer-left">
            <span className="hotkey-hint">
              快捷键: 1-9 切换分类 | ESC 关闭 | 点击立即播放
            </span>
          </div>
          <div className="footer-right">
            {currentAction && (
              <span className="current-action">
                当前: {currentAction.icon} {currentAction.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActionPanel
