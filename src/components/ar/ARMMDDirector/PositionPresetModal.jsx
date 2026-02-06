import React, { useState } from 'react'
import { getPresetsByCategory, applyPositionPreset } from './positionPresets'
import styles from './PositionPresetModal.module.css'

export const PositionPresetModal = ({ isOpen, onClose, onSelect, characterPosition }) => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [previewPreset, setPreviewPreset] = useState(null)

  if (!isOpen) return null

  const presetsByCategory = getPresetsByCategory()
  const categories = ['all', ...Object.keys(presetsByCategory)]

  const filteredPresets = selectedCategory === 'all'
    ? Object.values(presetsByCategory).flat()
    : presetsByCategory[selectedCategory] || []

  const handleSelect = (presetId) => {
    const pathData = applyPositionPreset(presetId, characterPosition || { x: 0, y: 0, z: 0 })
    onSelect(presetId, pathData)
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            <span className={styles.icon}>📍</span>
            选择位置预设
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* 分类筛选 */}
        <div className={styles.categoryTabs}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`${styles.categoryTab} ${selectedCategory === cat ? styles.active : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'all' ? '全部' : cat}
            </button>
          ))}
        </div>

        {/* 预设列表 */}
        <div className={styles.presetList}>
          {filteredPresets.map((preset) => (
            <div
              key={preset.id}
              className={styles.presetItem}
              onClick={() => handleSelect(preset.id)}
              onMouseEnter={() => setPreviewPreset(preset)}
              onMouseLeave={() => setPreviewPreset(null)}
            >
              <span className={styles.presetIcon}>{preset.icon}</span>
              <div className={styles.presetInfo}>
                <span className={styles.presetName}>{preset.name}</span>
                <span className={styles.presetDesc}>{preset.description}</span>
              </div>
              <span className={styles.presetCategory}>{preset.category}</span>
            </div>
          ))}
        </div>

        {/* 预览信息 */}
        {previewPreset && (
          <div className={styles.previewInfo}>
            <div className={styles.previewTitle}>预览: {previewPreset.name}</div>
            <div className={styles.previewDesc}>{previewPreset.description}</div>
          </div>
        )}
      </div>
    </div>
  )
}
