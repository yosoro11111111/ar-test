import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './AnimeSidebar.css'

// 右侧垂直标签栏组件
export const AnimeSidebar = ({
  characterName = '角色',
  characterAvatar = '👧',
  currentAction = '待机',
  onActionClick,
  onCameraClick,
  onSettingsClick,
  onPoseClick,
  onFavoritesClick,
  favorites = [],
  isMobile
}) => {
  const [activePanel, setActivePanel] = useState(null)

  // 右侧标签按钮配置
  const tagItems = [
    { id: 'actions', icon: '🎭', label: '动作', color: '#FF6B6B', onClick: onActionClick },
    { id: 'camera', icon: '📸', label: '拍照', color: '#4ECDC4', onClick: onCameraClick },
    { id: 'favorites', icon: '⭐', label: '收藏', color: '#FFD93D', badge: favorites.length, onClick: () => setActivePanel(activePanel === 'favorites' ? null : 'favorites') },
    { id: 'pose', icon: '🎨', label: '姿势', color: '#6BCB77', onClick: onPoseClick },
    { id: 'settings', icon: '⚙️', label: '设置', color: '#9B59B6', onClick: onSettingsClick }
  ]

  // 处理按钮点击
  const handleItemClick = (item) => {
    if (item.id === 'favorites') {
      setActivePanel(activePanel === 'favorites' ? null : 'favorites')
    } else {
      setActivePanel(null)
      item.onClick?.()
    }
  }

  // 收藏动作快速播放
  const handleFavoriteClick = (action) => {
    onFavoritesClick?.(action)
    setActivePanel(null)
  }

  return (
    <>
      {/* 右侧垂直标签栏 */}
      <div className="side-tag-container">
        <div className="side-tag-list">
          {tagItems.map((item) => (
            <button
              key={item.id}
              className={`side-tag-item ${activePanel === item.id ? 'active' : ''}`}
              onClick={() => handleItemClick(item)}
              style={{ '--tag-color': item.color }}
            >
              <span className="side-tag-icon">{item.icon}</span>
              <span className="side-tag-label">{item.label}</span>
              {item.badge > 0 && <span className="side-tag-badge">{item.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* 收藏面板 - 从右侧滑出 */}
      <AnimatePresence>
        {activePanel === 'favorites' && (
          <motion.div
            className="side-panel-popup"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="side-panel-header">
              <h4>⭐ 收藏的动作</h4>
              <button className="side-panel-close" onClick={() => setActivePanel(null)}>✕</button>
            </div>
            <div className="side-panel-content">
              {favorites.length === 0 ? (
                <p className="side-empty-text">还没有收藏动作哦~</p>
              ) : (
                <div className="side-favorites-grid">
                  {favorites.map((action, idx) => (
                    <button
                      key={idx}
                      className="side-favorite-card"
                      onClick={() => handleFavoriteClick(action)}
                    >
                      <span className="side-favorite-icon">{action.icon}</span>
                      <span className="side-favorite-name">{action.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 遮罩层 */}
      <AnimatePresence>
        {activePanel && (
          <motion.div
            className="side-panel-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePanel(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default AnimeSidebar
