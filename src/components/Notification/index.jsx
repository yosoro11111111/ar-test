// 通知组件
import React, { useEffect, useState } from 'react'

const Notification = ({ message, type = 'info', onClose, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // 等待淡出动画完成
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const colors = {
    info: { bg: '#00d4ff', icon: 'ℹ️' },
    success: { bg: '#00b894', icon: '✅' },
    warning: { bg: '#fdcb6e', icon: '⚠️' },
    error: { bg: '#ff6b6b', icon: '❌' }
  }

  const { bg, icon } = colors[type] || colors.info

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: `translateX(-50%) translateY(${isVisible ? 0 : '-20px'})`,
      padding: '14px 24px',
      background: 'rgba(30, 41, 59, 0.95)',
      borderRadius: '14px',
      border: `2px solid ${bg}`,
      boxShadow: `0 8px 32px ${bg}40`,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      zIndex: 9999,
      opacity: isVisible ? 1 : 0,
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(10px)'
    }}>
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <span style={{
        color: 'white',
        fontSize: '15px',
        fontWeight: '500'
      }}>
        {message}
      </span>
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(onClose, 300)
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.6)',
          fontSize: '18px',
          cursor: 'pointer',
          padding: '0 4px'
        }}
      >
        ✕
      </button>
    </div>
  )
}

// 通知管理器组件
export const NotificationManager = ({ notifications, removeNotification }) => {
  return (
    <>
      {notifications.map((notif) => (
        <Notification
          key={notif.id}
          message={notif.message}
          type={notif.type}
          onClose={() => removeNotification(notif.id)}
          duration={notif.duration}
        />
      ))}
    </>
  )
}

export default Notification
