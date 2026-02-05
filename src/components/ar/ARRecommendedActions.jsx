import React from 'react'
import styles from './ARRecommendedActions.module.css'

/**
 * 推荐动作卡片组件
 * 显示基于环境识别的推荐动作，点击可播放
 */
export function ARRecommendedActions({ actions, onActionClick, environmentData }) {
  if (!actions || actions.length === 0) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.icon}>🎭</span>
          <span className={styles.title}>推荐动作</span>
        </div>
        <div className={styles.empty}>
          <span>暂无推荐</span>
        </div>
      </div>
    )
  }

  // 根据地面类型获取动作图标
  const getActionIcon = (actionName) => {
    const iconMap = {
      '跳舞': '💃',
      '走路': '🚶',
      '滑步': '🕺',
      '跳跃': '🦘',
      '奔跑': '🏃',
      '翻滚': '🤸',
      '坐下': '🪑',
      '躺下': '🛌',
      '休息': '😴',
      '滑行': '⛸️',
      '旋转': '🌪️',
      '滑冰': '⛸️',
      '站立': '🧍',
      '运动': '💪',
      '欢呼': '🎉',
      '胜利': '✌️'
    }
    return iconMap[actionName] || '🎭'
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.icon}>🎭</span>
        <span className={styles.title}>推荐动作</span>
        {environmentData && (
          <span className={styles.groundBadge}>
            {environmentData.groundType === 'wood' && '🪵'}
            {environmentData.groundType === 'tile' && '⬜'}
            {environmentData.groundType === 'grass' && '🌱'}
            {environmentData.groundType === 'carpet' && '🧶'}
            {environmentData.groundType === 'concrete' && '🪨'}
            {environmentData.groundType === 'unknown' && '❓'}
          </span>
        )}
      </div>
      
      <div className={styles.actionsList}>
        {actions.slice(0, 5).map((action, index) => (
          <button
            key={index}
            className={styles.actionBtn}
            onClick={() => onActionClick && onActionClick(action)}
            title={`播放: ${action}`}
          >
            <span className={styles.actionIcon}>{getActionIcon(action)}</span>
            <span className={styles.actionName}>{action}</span>
            <span className={styles.playIcon}>▶️</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default ARRecommendedActions
