import React, { useState, useEffect } from 'react'
import { getPositionPresets, applyPositionPreset, calculatePositionOnPath } from './positionPresets'
import styles from './PositionTrackEditor.module.css'

/**
 * 位置轨道编辑器
 * 用于编辑角色的移动路径
 */
export function PositionTrackEditor({ clip, onSave, onClose }) {
  const [pathData, setPathData] = useState(clip?.data?.pathData || null)
  const [selectedPreset, setSelectedPreset] = useState(clip?.data?.presetId || null)
  const [startPos, setStartPos] = useState(clip?.data?.startPos || { x: 0, y: 0, z: 0 })
  const [endPos, setEndPos] = useState(clip?.data?.endPos || { x: 0, y: 0, z: 0 })
  const [previewProgress, setPreviewProgress] = useState(0)

  const presets = getPositionPresets()

  // 应用预设
  const handleApplyPreset = (presetId) => {
    const preset = applyPositionPreset(presetId, startPos)
    if (preset) {
      setSelectedPreset(presetId)
      setPathData(preset)
      setEndPos(preset.end)
    }
  }

  // 保存
  const handleSave = () => {
    onSave({
      ...clip,
      data: {
        ...clip.data,
        presetId: selectedPreset,
        pathData,
        startPos,
        endPos
      }
    })
    onClose()
  }

  // 预览位置
  const previewPosition = pathData 
    ? calculatePositionOnPath(pathData, previewProgress / 100)
    : startPos

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            <span className={styles.icon}>📍</span>
            编辑位置路径
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          {/* 起始位置 */}
          <div className={styles.section}>
            <label className={styles.label}>起始位置</label>
            <div className={styles.positionInputs}>
              <div className={styles.inputGroup}>
                <span>X</span>
                <input
                  type="number"
                  value={startPos.x}
                  onChange={(e) => setStartPos({ ...startPos, x: parseFloat(e.target.value) || 0 })}
                  step="0.1"
                />
              </div>
              <div className={styles.inputGroup}>
                <span>Y</span>
                <input
                  type="number"
                  value={startPos.y}
                  onChange={(e) => setStartPos({ ...startPos, y: parseFloat(e.target.value) || 0 })}
                  step="0.1"
                />
              </div>
              <div className={styles.inputGroup}>
                <span>Z</span>
                <input
                  type="number"
                  value={startPos.z}
                  onChange={(e) => setStartPos({ ...startPos, z: parseFloat(e.target.value) || 0 })}
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* 位置预设 */}
          <div className={styles.section}>
            <label className={styles.label}>选择移动预设</label>
            <div className={styles.presetGrid}>
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  className={`${styles.presetItem} ${selectedPreset === preset.id ? styles.selected : ''}`}
                  onClick={() => handleApplyPreset(preset.id)}
                >
                  <span className={styles.presetIcon}>{preset.icon}</span>
                  <span className={styles.presetName}>{preset.name}</span>
                  <span className={styles.presetCategory}>{preset.category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 路径预览 */}
          {pathData && (
            <div className={styles.section}>
              <label className={styles.label}>路径预览</label>
              <div className={styles.previewArea}>
                <div className={styles.previewControls}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={previewProgress}
                    onChange={(e) => setPreviewProgress(parseInt(e.target.value))}
                    className={styles.progressSlider}
                  />
                  <span className={styles.progressValue}>{previewProgress}%</span>
                </div>
                <div className={styles.positionDisplay}>
                  <div className={styles.posItem}>
                    <span className={styles.posLabel}>X:</span>
                    <span className={styles.posValue}>{previewPosition.x.toFixed(2)}</span>
                  </div>
                  <div className={styles.posItem}>
                    <span className={styles.posLabel}>Y:</span>
                    <span className={styles.posValue}>{previewPosition.y.toFixed(2)}</span>
                  </div>
                  <div className={styles.posItem}>
                    <span className={styles.posLabel}>Z:</span>
                    <span className={styles.posValue}>{previewPosition.z.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 结束位置 */}
          <div className={styles.section}>
            <label className={styles.label}>结束位置</label>
            <div className={styles.positionInputs}>
              <div className={styles.inputGroup}>
                <span>X</span>
                <input
                  type="number"
                  value={endPos.x}
                  onChange={(e) => setEndPos({ ...endPos, x: parseFloat(e.target.value) || 0 })}
                  step="0.1"
                />
              </div>
              <div className={styles.inputGroup}>
                <span>Y</span>
                <input
                  type="number"
                  value={endPos.y}
                  onChange={(e) => setEndPos({ ...endPos, y: parseFloat(e.target.value) || 0 })}
                  step="0.1"
                />
              </div>
              <div className={styles.inputGroup}>
                <span>Z</span>
                <input
                  type="number"
                  value={endPos.z}
                  onChange={(e) => setEndPos({ ...endPos, z: parseFloat(e.target.value) || 0 })}
                  step="0.1"
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>取消</button>
          <button className={styles.saveBtn} onClick={handleSave}>
            💾 保存路径
          </button>
        </div>
      </div>
    </div>
  )
}
