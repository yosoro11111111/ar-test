import React, { useState, useEffect } from 'react'
import styles from './CameraEditor.module.css'

// 预设机位
const CAMERA_PRESETS = {
  front: { name: '正面', position: { x: 0, y: 2, z: 8 }, target: { x: 0, y: 1, z: 0 } },
  back: { name: '背面', position: { x: 0, y: 2, z: -8 }, target: { x: 0, y: 1, z: 0 } },
  left: { name: '左侧', position: { x: -8, y: 2, z: 0 }, target: { x: 0, y: 1, z: 0 } },
  right: { name: '右侧', position: { x: 8, y: 2, z: 0 }, target: { x: 0, y: 1, z: 0 } },
  top: { name: '顶部', position: { x: 0, y: 12, z: 0 }, target: { x: 0, y: 0, z: 0 } },
  isometric: { name: '等角', position: { x: 8, y: 8, z: 8 }, target: { x: 0, y: 0, z: 0 } },
  lowAngle: { name: '低角度', position: { x: 0, y: 0.5, z: 6 }, target: { x: 0, y: 2, z: 0 } },
  highAngle: { name: '高角度', position: { x: 0, y: 10, z: 6 }, target: { x: 0, y: 0, z: 0 } }
}

// 缓动函数选项
const EASING_OPTIONS = [
  { value: 'linear', name: '线性', icon: '➡️' },
  { value: 'easeIn', name: '缓入', icon: '📈' },
  { value: 'easeOut', name: '缓出', icon: '📉' },
  { value: 'easeInOut', name: '缓入缓出', icon: '📊' },
  { value: 'bounce', name: '弹跳', icon: '⚡' }
]

export function CameraEditor({ clip, onSave, onClose }) {
  const [keyframes, setKeyframes] = useState(clip?.data?.keyframes || [])
  const [selectedKeyframeIndex, setSelectedKeyframeIndex] = useState(0)
  const [duration, setDuration] = useState(clip?.duration || 5)

  // 添加关键帧
  const addKeyframe = () => {
    const lastKeyframe = keyframes[keyframes.length - 1]
    const newKeyframe = {
      time: lastKeyframe ? Math.min(lastKeyframe.time + 1, duration) : 0,
      position: { ...lastKeyframe?.position } || { x: 0, y: 5, z: 10 },
      target: { ...lastKeyframe?.target } || { x: 0, y: 0, z: 0 },
      fov: lastKeyframe?.fov || 60,
      easing: 'linear'
    }
    setKeyframes([...keyframes, newKeyframe].sort((a, b) => a.time - b.time))
    setSelectedKeyframeIndex(keyframes.length)
  }

  // 删除关键帧
  const deleteKeyframe = (index) => {
    if (keyframes.length <= 1) return
    const newKeyframes = keyframes.filter((_, i) => i !== index)
    setKeyframes(newKeyframes)
    setSelectedKeyframeIndex(Math.min(selectedKeyframeIndex, newKeyframes.length - 1))
  }

  // 更新关键帧
  const updateKeyframe = (index, updates) => {
    const newKeyframes = [...keyframes]
    newKeyframes[index] = { ...newKeyframes[index], ...updates }
    setKeyframes(newKeyframes.sort((a, b) => a.time - b.time))
  }

  // 应用预设机位
  const applyPreset = (presetKey) => {
    const preset = CAMERA_PRESETS[presetKey]
    if (!preset) return
    
    const newKeyframes = [{
      time: 0,
      position: { ...preset.position },
      target: { ...preset.target },
      fov: 60,
      easing: 'linear'
    }]
    setKeyframes(newKeyframes)
    setSelectedKeyframeIndex(0)
  }

  // 保存
  const handleSave = () => {
    onSave({
      keyframes: keyframes.map(kf => ({
        ...kf,
        time: Math.max(0, Math.min(duration, kf.time))
      })),
      duration
    })
    onClose()
  }

  const selectedKeyframe = keyframes[selectedKeyframeIndex]

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>🎥 摄像机编辑器</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.content}>
          {/* 预设机位 */}
          <div className={styles.section}>
            <label className={styles.sectionLabel}>快速预设</label>
            <div className={styles.presetsGrid}>
              {Object.entries(CAMERA_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  className={styles.presetBtn}
                  onClick={() => applyPreset(key)}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* 时长设置 */}
          <div className={styles.section}>
            <label className={styles.sectionLabel}>片段时长 (秒)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseFloat(e.target.value) || 5)}
              min="0.5"
              max="60"
              step="0.5"
              className={styles.durationInput}
            />
          </div>

          {/* 关键帧列表 */}
          <div className={styles.section}>
            <div className={styles.keyframeHeader}>
              <label className={styles.sectionLabel}>关键帧</label>
              <button className={styles.addKeyframeBtn} onClick={addKeyframe}>
                ➕ 添加关键帧
              </button>
            </div>
            
            <div className={styles.keyframeList}>
              {keyframes.map((kf, index) => (
                <div
                  key={index}
                  className={`${styles.keyframeItem} ${index === selectedKeyframeIndex ? styles.active : ''}`}
                  onClick={() => setSelectedKeyframeIndex(index)}
                >
                  <span className={styles.keyframeIndex}>#{index + 1}</span>
                  <span className={styles.keyframeTime}>{kf.time.toFixed(1)}s</span>
                  <span className={styles.keyframeEasing}>{EASING_OPTIONS.find(e => e.value === kf.easing)?.icon}</span>
                  {keyframes.length > 1 && (
                    <button
                      className={styles.deleteKeyframeBtn}
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteKeyframe(index)
                      }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 关键帧编辑 */}
          {selectedKeyframe && (
            <div className={styles.section}>
              <label className={styles.sectionLabel}>编辑关键帧 #{selectedKeyframeIndex + 1}</label>
              
              {/* 时间 */}
              <div className={styles.inputRow}>
                <label>时间 (秒)</label>
                <input
                  type="number"
                  value={selectedKeyframe.time}
                  onChange={(e) => updateKeyframe(selectedKeyframeIndex, { time: parseFloat(e.target.value) || 0 })}
                  min="0"
                  max={duration}
                  step="0.1"
                />
              </div>

              {/* 缓动 */}
              <div className={styles.inputRow}>
                <label>缓动</label>
                <select
                  value={selectedKeyframe.easing}
                  onChange={(e) => updateKeyframe(selectedKeyframeIndex, { easing: e.target.value })}
                >
                  {EASING_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 摄像机位置 */}
              <div className={styles.inputGroup}>
                <label className={styles.groupLabel}>📷 摄像机位置</label>
                <div className={styles.vectorInput}>
                  <div className={styles.vectorField}>
                    <span className={styles.axisLabel}>X</span>
                    <input
                      type="number"
                      value={selectedKeyframe.position.x}
                      onChange={(e) => updateKeyframe(selectedKeyframeIndex, {
                        position: { ...selectedKeyframe.position, x: parseFloat(e.target.value) || 0 }
                      })}
                      step="0.1"
                    />
                  </div>
                  <div className={styles.vectorField}>
                    <span className={styles.axisLabel}>Y</span>
                    <input
                      type="number"
                      value={selectedKeyframe.position.y}
                      onChange={(e) => updateKeyframe(selectedKeyframeIndex, {
                        position: { ...selectedKeyframe.position, y: parseFloat(e.target.value) || 0 }
                      })}
                      step="0.1"
                    />
                  </div>
                  <div className={styles.vectorField}>
                    <span className={styles.axisLabel}>Z</span>
                    <input
                      type="number"
                      value={selectedKeyframe.position.z}
                      onChange={(e) => updateKeyframe(selectedKeyframeIndex, {
                        position: { ...selectedKeyframe.position, z: parseFloat(e.target.value) || 0 }
                      })}
                      step="0.1"
                    />
                  </div>
                </div>
              </div>

              {/* 目标点 */}
              <div className={styles.inputGroup}>
                <label className={styles.groupLabel}>🎯 目标点</label>
                <div className={styles.vectorInput}>
                  <div className={styles.vectorField}>
                    <span className={styles.axisLabel}>X</span>
                    <input
                      type="number"
                      value={selectedKeyframe.target.x}
                      onChange={(e) => updateKeyframe(selectedKeyframeIndex, {
                        target: { ...selectedKeyframe.target, x: parseFloat(e.target.value) || 0 }
                      })}
                      step="0.1"
                    />
                  </div>
                  <div className={styles.vectorField}>
                    <span className={styles.axisLabel}>Y</span>
                    <input
                      type="number"
                      value={selectedKeyframe.target.y}
                      onChange={(e) => updateKeyframe(selectedKeyframeIndex, {
                        target: { ...selectedKeyframe.target, y: parseFloat(e.target.value) || 0 }
                      })}
                      step="0.1"
                    />
                  </div>
                  <div className={styles.vectorField}>
                    <span className={styles.axisLabel}>Z</span>
                    <input
                      type="number"
                      value={selectedKeyframe.target.z}
                      onChange={(e) => updateKeyframe(selectedKeyframeIndex, {
                        target: { ...selectedKeyframe.target, z: parseFloat(e.target.value) || 0 }
                      })}
                      step="0.1"
                    />
                  </div>
                </div>
              </div>

              {/* FOV */}
              <div className={styles.inputRow}>
                <label>视野 (FOV)</label>
                <input
                  type="range"
                  value={selectedKeyframe.fov}
                  onChange={(e) => updateKeyframe(selectedKeyframeIndex, { fov: parseInt(e.target.value) })}
                  min="20"
                  max="120"
                />
                <span className={styles.valueDisplay}>{selectedKeyframe.fov}°</span>
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>取消</button>
          <button className={styles.saveBtn} onClick={handleSave}>💾 保存</button>
        </div>
      </div>
    </div>
  )
}
