import React from 'react'
import styles from './AddItemModal.module.css'

/**
 * 添加选项弹窗 - 角色/场景/动作/特效四选一
 */
export function AddItemModal({ onSelect, onClose }) {
  const options = [
    { id: 'character', name: '角色', icon: '👤', color: '#667eea', desc: '添加VRM角色模型' },
    { id: 'scene', name: '场景', icon: '🗺️', color: '#4ade80', desc: '添加AR场景' },
    { id: 'action', name: '动作', icon: '🎭', color: '#f093fb', desc: '添加VRMA动作' },
    { id: 'effect', name: '特效', icon: '✨', color: '#fbbf24', desc: '添加视觉特效' },
  ]

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>➕ 添加元素</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.options}>
          {options.map(option => (
            <button
              key={option.id}
              className={styles.option}
              onClick={() => onSelect(option.id)}
              style={{ '--option-color': option.color }}
            >
              <span className={styles.optionIcon}>{option.icon}</span>
              <span className={styles.optionName}>{option.name}</span>
              <span className={styles.optionDesc}>{option.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AddItemModal
