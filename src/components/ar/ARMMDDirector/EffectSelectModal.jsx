import React, { useState } from 'react'
import styles from './EffectSelectModal.module.css'

/**
 * 特效选择弹窗 - 空框架，预留功能
 */
export function EffectSelectModal({ onSelect, onClose }) {
  const [searchTerm, setSearchTerm] = useState('')
  
  // 预留特效列表
  const effects = [
    { id: 'particle_1', name: '樱花飘落', type: 'particle', icon: '🌸', desc: '粉色樱花粒子效果' },
    { id: 'particle_2', name: '星光闪烁', type: 'particle', icon: '✨', desc: '金色星光粒子效果' },
    { id: 'particle_3', name: '雪花飘落', type: 'particle', icon: '❄️', desc: '白色雪花粒子效果' },
    { id: 'light_1', name: '聚光灯', type: 'light', icon: '🔦', desc: '舞台聚光灯效果' },
    { id: 'light_2', name: '彩虹光', type: 'light', icon: '🌈', desc: '七彩渐变光效' },
    { id: 'filter_1', name: '梦幻滤镜', type: 'filter', icon: '💫', desc: '柔光梦幻效果' },
    { id: 'filter_2', name: '复古滤镜', type: 'filter', icon: '📷', desc: '复古胶片效果' },
    { id: 'filter_3', name: '黑白滤镜', type: 'filter', icon: '⚫', desc: '经典黑白效果' },
  ]
  
  const filteredEffects = effects.filter(effect =>
    effect.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    effect.desc.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const getTypeName = (type) => {
    const names = { particle: '粒子', light: '灯光', filter: '滤镜' }
    return names[type] || type
  }
  
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>✨ 选择特效</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="搜索特效..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.effectList}>
          {filteredEffects.length > 0 ? (
            filteredEffects.map(effect => (
              <div
                key={effect.id}
                className={styles.effectItem}
                onClick={() => {
                  onSelect(effect)
                  onClose()
                }}
              >
                <div className={styles.effectIcon}>{effect.icon}</div>
                <div className={styles.effectInfo}>
                  <span className={styles.effectName}>{effect.name}</span>
                  <span className={styles.effectDesc}>{effect.desc}</span>
                </div>
                <span className={styles.effectType}>{getTypeName(effect.type)}</span>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <p>暂无特效</p>
              <p>特效功能开发中...</p>
            </div>
          )}
        </div>
        
        <div className={styles.footer}>
          <span className={styles.hint}>💡 点击特效添加到时间轴</span>
          <button className={styles.cancelBtn} onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  )
}

export default EffectSelectModal
