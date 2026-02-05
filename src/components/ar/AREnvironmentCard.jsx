import React from 'react'
import styles from './AREnvironmentCard.module.css'

/**
 * 环境识别卡片组件
 * 显示地面材质、空间大小、光照强度等环境信息
 */
export function AREnvironmentCard({ environmentData, onRefresh }) {
  if (!environmentData) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.icon}>🌍</span>
          <span className={styles.title}>环境识别</span>
        </div>
        <div className={styles.loading}>
          <span className={styles.spinner}>⟳</span>
          <span>分析环境中...</span>
        </div>
      </div>
    )
  }

  const { groundType, spaceSize, lightIntensity } = environmentData

  // 地面类型显示配置
  const groundTypeConfig = {
    wood: { icon: '🪵', label: '木地板', color: '#8B4513' },
    tile: { icon: '⬜', label: '瓷砖', color: '#E0E0E0' },
    grass: { icon: '🌱', label: '草地', color: '#4CAF50' },
    carpet: { icon: '🧶', label: '地毯', color: '#FF9800' },
    concrete: { icon: '🪨', label: '水泥', color: '#9E9E9E' },
    unknown: { icon: '❓', label: '未知', color: '#757575' }
  }

  // 空间大小显示配置
  const spaceSizeConfig = {
    small: { icon: '📦', label: '小空间', desc: '< 2m²' },
    medium: { icon: '🏠', label: '中等空间', desc: '2-8m²' },
    large: { icon: '🏢', label: '大空间', desc: '> 8m²' }
  }

  const ground = groundTypeConfig[groundType] || groundTypeConfig.unknown
  const space = spaceSizeConfig[spaceSize] || spaceSizeConfig.medium

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.icon}>🌍</span>
        <span className={styles.title}>环境识别</span>
        {onRefresh && (
          <button className={styles.refreshBtn} onClick={onRefresh} title="重新识别">
            🔄
          </button>
        )}
      </div>
      
      <div className={styles.content}>
        {/* 地面材质 */}
        <div className={styles.item}>
          <span className={styles.itemIcon} style={{ color: ground.color }}>
            {ground.icon}
          </span>
          <div className={styles.itemInfo}>
            <span className={styles.itemLabel}>地面材质</span>
            <span className={styles.itemValue}>{ground.label}</span>
          </div>
        </div>

        {/* 空间大小 */}
        <div className={styles.item}>
          <span className={styles.itemIcon}>{space.icon}</span>
          <div className={styles.itemInfo}>
            <span className={styles.itemLabel}>空间大小</span>
            <span className={styles.itemValue}>{space.label}</span>
          </div>
        </div>

        {/* 光照强度 */}
        <div className={styles.item}>
          <span className={styles.itemIcon}>💡</span>
          <div className={styles.itemInfo}>
            <span className={styles.itemLabel}>光照强度</span>
            <div className={styles.lightBar}>
              <div 
                className={styles.lightFill} 
                style={{ width: `${Math.min(100, lightIntensity * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AREnvironmentCard
