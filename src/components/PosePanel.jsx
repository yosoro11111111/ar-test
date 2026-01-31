import React, { useState, useEffect, useCallback } from 'react'
import { actions as actionList250, actionCategories } from '../data/actions250'
import { poseBoneData } from '../data/poseBoneData'
import './PosePanel.css'

const PosePanel = ({ isOpen, onClose, onSelectPose, currentPose }) => {
  const [activeCategory, setActiveCategory] = useState('basic')
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

  // 姿势分类定义
  const poseCategories = [
    { id: 'basic', name: '基础', icon: '🧍', description: '站立、坐下、蹲下等基础姿势' },
    { id: 'gesture', name: '手势', icon: '✌️', description: '剪刀手、比心等手势姿势' },
    { id: 'action', name: '动作', icon: '🏃', description: '跳跃、弯腰等动作姿势' },
    { id: 'expression', name: '表情', icon: '😊', description: '开心、悲伤等表情姿势' },
    { id: 'combat', name: '战斗', icon: '⚔️', description: '攻击、防御等战斗姿势' },
    { id: 'dance', name: '舞蹈', icon: '💃', description: '舞蹈动作姿势' }
  ]

  // 获取姿势图标 - 移到 useMemo 之前
  const getPoseIcon = useCallback((name) => {
    const iconMap = {
      '自然站立': '🧍', '立正站立': '🧍‍♀️', '标准坐姿': '🪑', '平躺休息': '🛏️', '蹲下': '🏋️',
      '剪刀手': '✌️', '比心': '💕', 'OK手势': '👌', '点赞': '👍', '指方向': '👆', '抱胸': '🤜',
      '挥手(右)': '👋', '挥手(左)': '👋', '鞠躬': '🙇', '敬礼': '🫡',
      '开心': '😊', '大笑': '😂', '微笑': '😊', '害羞': '😳', '伤心': '😢', '生气': '😠', '惊讶': '😲',
      '攻击': '⚔️', '防御': '🛡️', '闪避': '💨', '瞄准': '🎯',
      '街舞': '🕺', '芭蕾': '🩰'
    }
    return iconMap[name] || '🧘'
  }, [])

  // 将poseBoneData转换为数组并添加分类
  const allPoses = React.useMemo(() => {
    const poses = []
    const categoryMap = {
      idle: 'basic', stand: 'basic', sit: 'basic', lie: 'basic', crouch: 'basic',
      pose_peace: 'gesture', pose_heart: 'gesture', pose_ok: 'gesture', pose_thumb: 'gesture', pose_point: 'gesture', pose_cross_arm: 'gesture',
      wave_right: 'action', wave_left: 'action', bow: 'action', salute: 'action',
      happy: 'expression', laugh: 'expression', smile: 'expression', shy: 'expression', sad: 'expression', angry: 'expression', surprised: 'expression',
      attack: 'combat', defend: 'combat', dodge: 'combat', aim: 'combat',
      dance: 'dance', hiphop: 'dance', ballet: 'dance'
    }

    Object.entries(poseBoneData).forEach(([id, pose]) => {
      poses.push({
        id,
        ...pose,
        category: categoryMap[id] || 'basic',
        icon: getPoseIcon(pose.name)
      })
    })

    return poses
  }, [getPoseIcon])

  // 筛选姿势
  const filteredPoses = React.useMemo(() => {
    let poses = allPoses

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
  }, [activeCategory, searchQuery, favorites, recentPoses, allPoses])

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

    // 添加 action 属性（使用 id 作为 action 名称）
    const poseWithAction = {
      ...pose,
      action: pose.id
    }

    onSelectPose?.(poseWithAction)
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
    ...poseCategories
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
              {actionList250.find(a => a.id === currentPose)?.name || '未知'}
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
