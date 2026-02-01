// MobileDock.jsx - 底部Dock栏组件
// 赛博朋克风格，简洁的四个功能入口

import React from 'react'

export const MobileDock = ({ 
  onActionClick,
  onCameraClick, 
  onSettingsClick,
  onEffectsClick,
  activePanel,
  isMobile
}) => {
  const buttons = [
    { 
      id: 'actions', 
      icon: '🎭', 
      label: '动作',
      onClick: onActionClick,
      color: '#00d4ff'
    },
    { 
      id: 'camera', 
      icon: '📸', 
      label: '拍照',
      onClick: onCameraClick,
      color: '#ec4899'
    },
    { 
      id: 'settings', 
      icon: '⚙️', 
      label: '设置',
      onClick: onSettingsClick,
      color: '#a855f7'
    },
    { 
      id: 'effects', 
      icon: '✨', 
      label: '特效',
      onClick: onEffectsClick,
      color: '#ffd700'
    }
  ]

  return (
    <div className="mobile-dock">
      {buttons.map(button => (
        <button
          key={button.id}
          className={`dock-button ${activePanel === button.id ? 'active' : ''}`}
          onClick={button.onClick}
          style={{
            '--glow-color': button.color
          }}
        >
          <span className="icon">{button.icon}</span>
          <span className="label">{button.label}</span>
        </button>
      ))}
    </div>
  )
}

export default MobileDock
