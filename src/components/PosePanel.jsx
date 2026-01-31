import React, { useState, useEffect, useCallback } from 'react'
import { actions as actionList200, actionCategories } from '../data/actions200'
import './PosePanel.css'

const PosePanel = ({ isOpen, onClose, onSelectPose, currentPose }) => {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('poseFavorites')
    return saved ? JSON.parse(saved) : []
  })
  const [recentPoses, setRecentPoses] = useState(() => {
    const saved = localStorage.getItem('recentPoses')
    return saved ? JSON.parse(saved) : []
  })
  const [isPlaying, setIsPlaying] = useState(true)
  const [previewPose, setPreviewPose] = useState(null)

  // 筛选姿势
  const filteredPoses = React.useMemo(() => {
    let poses = actionList200

    // 只显示适合作为姿势的动作（静态或慢速动作）
    poses = poses.filter(action => 
      action.type === 'static' || 
      action.category === 'pose' ||
      action.category === 'expression'
    )

    // 按分类筛选
    if (activeCategory !== 'all' && activeCategory !== 'favorites' && activeCategory !== 'recent') {
      poses = poses.filter(pose => pose.category === activeCategory)
    }

    // 收藏筛选
    if (activeCategory === 'favorites') {
      poses = poses.filter(pose => favorites.includes(pose.id))
    }

    // 最近使用筛选
    if (activeCategory === 'recent') {
      poses = poses.filter(pose => recentPoses.includes(pose.id))
        .sort((a, b) => recentPoses.indexOf(a.id) - recentPoses.indexOf(b.id))
    }

    // 搜索筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      poses = poses.filter(pose =>
        pose.name.toLowerCase().includes(query) ||
        pose.description?.toLowerCase().includes(query)
      )
    }

    return poses
  }, [activeCategory, searchQuery, favorites, recentPoses])

  // 切换收藏
  const toggleFavorite = useCallback((poseId, e) => {
    e.stopPropagation()
    setFavorites(prev => {
      const newFavorites = prev.includes(poseId)
        ? prev.filter(id => id !== poseId)
        : [...prev, poseId]
      localStorage.setItem('poseFavorites', JSON.stringify(newFavorites))
      return newFavorites
    })
  }, [])

  // 选择姿势
  const handleSelectPose = useCallback((pose) => {
    // 添加到最近使用
    setRecentPoses(prev => {
      const newRecent = [pose.id, ...prev.filter(id => id !== pose.id)].slice(0, 10)
      localStorage.setItem('recentPoses', JSON.stringify(newRecent))
      return newRecent
    })

    onSelectPose?.(pose)
  }, [onSelectPose])

  // 预览姿势
  const handlePreviewPose = useCallback((pose) => {
    setPreviewPose(pose)
    if (isPlaying) {
      onSelectPose?.(pose, { preview: true })
    }
  }, [isPlaying, onSelectPose])

  // 分类选项
  const categories = [
    { id: 'all', name: '全部', icon: '📋' },
    { id: 'favorites', name: '收藏', icon: '⭐' },
    { id: 'recent', name: '最近', icon: '🕐' },
    ...actionCategories.filter(c => c.id !== 'all')
  ]

  if (!isOpen) return null

  return (
    <div className="pose-panel-overlay" onClick={onClose}>
      <div className="pose-panel" onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="pose-panel-header">
          <div className="header-title">
            <span className="title-icon">🎭</span>
            <span className="title-text">姿势库</span>
            <span className="pose-count">{filteredPoses.length}个姿势</span>
          </div>
          <div className="header-controls">
            <button
              className={`play-toggle ${isPlaying ? 'playing' : ''}`}
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? '暂停预览' : '开始预览'}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* 搜索栏 */}
        <div className="pose-search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="搜索姿势..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>
              ×
            </button>
          )}
        </div>

        {/* 分类标签 */}
        <div className="pose-categories">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              <span className="tab-icon">{category.icon}</span>
              <span className="tab-name">{category.name}</span>
            </button>
          ))}
        </div>

        {/* 姿势网格 */}
        <div className="pose-grid">
          {filteredPoses.map((pose, index) => (
            <div
              key={pose.id}
              className={`pose-card ${currentPose === pose.id ? 'active' : ''} ${previewPose?.id === pose.id ? 'preview' : ''}`}
              onClick={() => handleSelectPose(pose)}
              onMouseEnter={() => handlePreviewPose(pose)}
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              <div className="pose-icon">{pose.icon}</div>
              <div className="pose-name">{pose.name}</div>
              <div className="pose-category">{pose.category}</div>

              {/* 收藏按钮 */}
              <button
                className={`favorite-btn ${favorites.includes(pose.id) ? 'active' : ''}`}
                onClick={(e) => toggleFavorite(pose.id, e)}
              >
                {favorites.includes(pose.id) ? '★' : '☆'}
              </button>

              {/* 播放指示器 */}
              {currentPose === pose.id && isPlaying && (
                <div className="playing-indicator">
                  <span className="wave"></span>
                  <span className="wave"></span>
                  <span className="wave"></span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 当前姿势信息 */}
        {currentPose && (
          <div className="current-pose-info">
            <div className="info-label">当前姿势</div>
            <div className="info-name">
              {actionList200.find(a => a.id === currentPose)?.name || '未知'}
            </div>
          </div>
        )}

        {/* 底部提示 */}
        <div className="pose-panel-footer">
          <div className="footer-tip">
            <span className="tip-icon">💡</span>
            <span className="tip-text">
              悬停预览姿势，点击应用。姿势会持续播放直到切换。
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PosePanel
