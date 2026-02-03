import React from 'react'
import { useUIStore } from '../../stores/uiStore'
import { useActionStore } from '../../stores/actionStore'
import './MobileBottomNav.css'

export const MobileBottomNav = () => {
  const { activePanel, setActivePanel, closePanel } = useUIStore()
  const { isPlaying, togglePlay } = useActionStore()

  const navItems = [
    { id: 'actions', icon: '🎭', label: '动作' },
    { id: 'play', icon: isPlaying ? '⏸️' : '▶️', label: isPlaying ? '暂停' : '播放' },
    { id: 'expressions', icon: '😊', label: '表情' },
    { id: 'settings', icon: '⚙️', label: '设置' },
  ]

  const handleClick = (item) => {
    if (item.id === 'play') {
      togglePlay()
    } else if (activePanel === item.id) {
      closePanel()
    } else {
      setActivePanel(item.id)
    }
  }

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${activePanel === item.id ? 'active' : ''}`}
          onClick={() => handleClick(item)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

export default MobileBottomNav
