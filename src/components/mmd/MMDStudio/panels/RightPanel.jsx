import React from 'react'
import styles from './RightPanel.module.css'

export function RightPanel({ selectedObject, onUpdateObject }) {
  if (!selectedObject) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🎯</div>
          <div className={styles.emptyText}>选择对象以编辑属性</div>
          <div className={styles.emptySubtext}>在预览区点击角色或道具</div>
        </div>
      </div>
    )
  }

  const handlePositionChange = (axis, value) => {
    onUpdateObject(selectedObject.id, {
      position: { ...selectedObject.position, [axis]: parseFloat(value) || 0 }
    })
  }

  const handleRotationChange = (axis, value) => {
    onUpdateObject(selectedObject.id, {
      rotation: { ...selectedObject.rotation, [axis]: parseFloat(value) || 0 }
    })
  }

  const handleScaleChange = (value) => {
    onUpdateObject(selectedObject.id, { scale: parseFloat(value) || 1 })
  }

  return (
    <div className={styles.container}>
      {/* 对象信息 */}
      <div className={styles.header}>
        <div className={styles.objectIcon}>👤</div>
        <div className={styles.objectName}>{selectedObject.name}</div>
      </div>

      {/* 变换属性 */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>位置</div>
        <div className={styles.inputGroup}>
          <div className={styles.inputRow}>
            <label>X</label>
            <input
              type="number"
              value={selectedObject.position?.x || 0}
              onChange={(e) => handlePositionChange('x', e.target.value)}
              step="0.1"
            />
          </div>
          <div className={styles.inputRow}>
            <label>Y</label>
            <input
              type="number"
              value={selectedObject.position?.y || 0}
              onChange={(e) => handlePositionChange('y', e.target.value)}
              step="0.1"
            />
          </div>
          <div className={styles.inputRow}>
            <label>Z</label>
            <input
              type="number"
              value={selectedObject.position?.z || 0}
              onChange={(e) => handlePositionChange('z', e.target.value)}
              step="0.1"
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>旋转</div>
        <div className={styles.inputGroup}>
          <div className={styles.inputRow}>
            <label>X</label>
            <input
              type="number"
              value={selectedObject.rotation?.x || 0}
              onChange={(e) => handleRotationChange('x', e.target.value)}
              step="1"
            />
          </div>
          <div className={styles.inputRow}>
            <label>Y</label>
            <input
              type="number"
              value={selectedObject.rotation?.y || 0}
              onChange={(e) => handleRotationChange('y', e.target.value)}
              step="1"
            />
          </div>
          <div className={styles.inputRow}>
            <label>Z</label>
            <input
              type="number"
              value={selectedObject.rotation?.z || 0}
              onChange={(e) => handleRotationChange('z', e.target.value)}
              step="1"
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>缩放</div>
        <div className={styles.inputGroup}>
          <div className={styles.inputRow}>
            <label>统一</label>
            <input
              type="number"
              value={selectedObject.scale || 1}
              onChange={(e) => handleScaleChange(e.target.value)}
              step="0.1"
              min="0.1"
            />
          </div>
        </div>
      </div>

      {/* 可见性 */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>显示</div>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={selectedObject.visible !== false}
            onChange={(e) => onUpdateObject(selectedObject.id, { visible: e.target.checked })}
          />
          可见
        </label>
      </div>
    </div>
  )
}
