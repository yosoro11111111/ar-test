import React from 'react'
import styles from './QuickActions.module.css'

const QUICK_ACTIONS = [
  { id: 'character', icon: '🎭', label: '角色', color: '#667eea' },
  { id: 'action', icon: '🏃', label: '动作', color: '#f093fb' },
  { id: 'camera', icon: '🎥', label: '摄像机', color: '#4facfe' },
  { id: 'effect', icon: '✨', label: '特效', color: '#43e97b' },
  { id: 'music', icon: '🎵', label: '音乐', color: '#fa709a' },
  { id: 'prop', icon: '📦', label: '道具', color: '#fee140' },
  { id: 'position', icon: '📍', label: '位置', color: '#30cfd0' },
  { id: 'background', icon: '🖼️', label: '背景', color: '#a8edea' },
]

export function QuickActions({ onAction, hasCharacters }) {
  const handleAction = (actionId) => {
    // 如果没有角色，除了角色按钮外都提示先添加角色
    if (!hasCharacters && actionId !== 'character') {
      alert('请先添加角色！')
      return
    }
    onAction(actionId)
  }

  return (
    <div className={styles.container}>
      <div className={styles.title}>快速添加</div>
      <div className={styles.actions}>
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            className={styles.actionBtn}
            onClick={() => handleAction(action.id)}
            style={{ '--action-color': action.color }}
            title={action.label}
          >
            <span className={styles.icon}>{action.icon}</span>
            <span className={styles.label}>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
