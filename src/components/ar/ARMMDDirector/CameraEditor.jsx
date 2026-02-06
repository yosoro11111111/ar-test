import React, { useState, useEffect, useRef, useCallback } from 'react'
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
  const [showCoordinatePicker, setShowCoordinatePicker] = useState(false)
  const [pickerMode, setPickerMode] = useState('position') // 'position' 或 'target'
  const [pickerView, setPickerView] = useState('top') // 'top', 'front', 'side'

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

  // 处理坐标选择器中的点击
  const handleCoordinatePickerClick = (coord) => {
    if (pickerMode === 'position') {
      updateKeyframe(selectedKeyframeIndex, { position: coord })
    } else {
      updateKeyframe(selectedKeyframeIndex, { target: coord })
    }
    setShowCoordinatePicker(false)
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
                <div className={styles.groupHeader}>
                  <label className={styles.groupLabel}>📷 摄像机位置</label>
                  <button 
                    className={styles.pickCoordBtn}
                    onClick={() => {
                      setPickerMode('position')
                      setShowCoordinatePicker(true)
                    }}
                  >
                    🖱️ 点击选择
                  </button>
                </div>
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
                <div className={styles.groupHeader}>
                  <label className={styles.groupLabel}>🎯 目标点</label>
                  <button 
                    className={styles.pickCoordBtn}
                    onClick={() => {
                      setPickerMode('target')
                      setShowCoordinatePicker(true)
                    }}
                  >
                    🖱️ 点击选择
                  </button>
                </div>
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

      {/* 坐标选择器弹窗 */}
      {showCoordinatePicker && (
        <CoordinatePicker
          mode={pickerMode}
          currentValue={pickerMode === 'position' ? selectedKeyframe?.position : selectedKeyframe?.target}
          onSelect={handleCoordinatePickerClick}
          onClose={() => setShowCoordinatePicker(false)}
        />
      )}
    </div>
  )
}

// 坐标选择器组件
function CoordinatePicker({ mode, currentValue, onSelect, onClose }) {
  const canvasRef = useRef(null)
  const [view, setView] = useState('top') // top, front, side
  const [scale, setScale] = useState(20) // 像素/单位
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedPoint, setSelectedPoint] = useState({ x: 0, y: 0, z: 0 })

  // 世界坐标范围
  const WORLD_SIZE = 20 // -10 到 10

  // 将世界坐标转换为画布坐标
  const worldToCanvas = (worldX, worldY) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const centerX = canvas.width / 2 + offset.x
    const centerY = canvas.height / 2 + offset.y
    
    return {
      x: centerX + worldX * scale,
      y: centerY - worldY * scale // Y轴翻转
    }
  }

  // 将画布坐标转换为世界坐标
  const canvasToWorld = (canvasX, canvasY) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const centerX = canvas.width / 2 + offset.x
    const centerY = canvas.height / 2 + offset.y
    
    return {
      x: (canvasX - centerX) / scale,
      y: (centerY - canvasY) / scale
    }
  }

  // 绘制网格和坐标轴
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height
    
    // 清空画布
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, width, height)
    
    const centerX = width / 2 + offset.x
    const centerY = height / 2 + offset.y
    
    // 绘制网格
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    
    // 垂直线
    for (let x = -WORLD_SIZE; x <= WORLD_SIZE; x += 1) {
      const canvasX = centerX + x * scale
      ctx.beginPath()
      ctx.moveTo(canvasX, 0)
      ctx.lineTo(canvasX, height)
      ctx.stroke()
    }
    
    // 水平线
    for (let y = -WORLD_SIZE; y <= WORLD_SIZE; y += 1) {
      const canvasY = centerY - y * scale
      ctx.beginPath()
      ctx.moveTo(0, canvasY)
      ctx.lineTo(width, canvasY)
      ctx.stroke()
    }
    
    // 绘制坐标轴
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    
    // X轴
    ctx.beginPath()
    ctx.moveTo(0, centerY)
    ctx.lineTo(width, centerY)
    ctx.stroke()
    
    // Y轴
    ctx.beginPath()
    ctx.moveTo(centerX, 0)
    ctx.lineTo(centerX, height)
    ctx.stroke()
    
    // 绘制原点
    ctx.fillStyle = '#ff6b6b'
    ctx.beginPath()
    ctx.arc(centerX, centerY, 4, 0, Math.PI * 2)
    ctx.fill()
    
    // 绘制刻度标签
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    
    for (let x = -WORLD_SIZE; x <= WORLD_SIZE; x += 2) {
      if (x === 0) continue
      const canvasX = centerX + x * scale
      ctx.fillText(x.toString(), canvasX, centerY + 15)
    }
    
    ctx.textAlign = 'right'
    for (let y = -WORLD_SIZE; y <= WORLD_SIZE; y += 2) {
      if (y === 0) continue
      const canvasY = centerY - y * scale
      ctx.fillText(y.toString(), centerX - 8, canvasY + 3)
    }
    
    // 绘制当前选择的点
    let pointX, pointY, label
    if (view === 'top') {
      pointX = selectedPoint.x
      pointY = selectedPoint.z
      label = `X: ${selectedPoint.x.toFixed(1)}, Z: ${selectedPoint.z.toFixed(1)}`
    } else if (view === 'front') {
      pointX = selectedPoint.x
      pointY = selectedPoint.y
      label = `X: ${selectedPoint.x.toFixed(1)}, Y: ${selectedPoint.y.toFixed(1)}`
    } else {
      pointX = selectedPoint.z
      pointY = selectedPoint.y
      label = `Z: ${selectedPoint.z.toFixed(1)}, Y: ${selectedPoint.y.toFixed(1)}`
    }
    
    const canvasPoint = worldToCanvas(pointX, pointY)
    
    // 绘制点
    ctx.fillStyle = mode === 'position' ? '#4facfe' : '#43e97b'
    ctx.beginPath()
    ctx.arc(canvasPoint.x, canvasPoint.y, 8, 0, Math.PI * 2)
    ctx.fill()
    
    // 绘制外圈
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(canvasPoint.x, canvasPoint.y, 10, 0, Math.PI * 2)
    ctx.stroke()
    
    // 绘制标签
    ctx.fillStyle = '#fff'
    ctx.font = '12px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(label, canvasPoint.x + 15, canvasPoint.y - 10)
    
    // 绘制视图标签
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.font = '14px Arial'
    ctx.textAlign = 'left'
    const viewNames = { top: '俯视图 (X-Z平面)', front: '正视图 (X-Y平面)', side: '侧视图 (Z-Y平面)' }
    ctx.fillText(viewNames[view], 10, 25)
  }, [view, scale, offset, selectedPoint, mode])

  // 初始化画布大小
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    canvas.width = 600
    canvas.height = 400
    
    // 初始化选中点
    if (currentValue) {
      setSelectedPoint({
        x: currentValue.x || 0,
        y: currentValue.y || 0,
        z: currentValue.z || 0
      })
    }
  }, [currentValue])

  // 绘制
  useEffect(() => {
    draw()
  }, [draw])

  // 处理画布点击
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const worldPos = canvasToWorld(x, y)
    
    if (view === 'top') {
      setSelectedPoint(prev => ({ ...prev, x: worldPos.x, z: worldPos.y }))
    } else if (view === 'front') {
      setSelectedPoint(prev => ({ ...prev, x: worldPos.x, y: worldPos.y }))
    } else {
      setSelectedPoint(prev => ({ ...prev, z: worldPos.x, y: worldPos.y }))
    }
  }

  // 处理滚轮缩放
  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(prev => Math.max(5, Math.min(100, prev * delta)))
  }

  // 确认选择
  const handleConfirm = () => {
    onSelect({
      x: selectedPoint.x,
      y: selectedPoint.y,
      z: selectedPoint.z
    })
  }

  return (
    <div className={styles.coordinatePickerOverlay} onClick={onClose}>
      <div className={styles.coordinatePicker} onClick={e => e.stopPropagation()}>
        <div className={styles.pickerHeader}>
          <h4>
            {mode === 'position' ? '📷 选择摄像机位置' : '🎯 选择目标点'}
          </h4>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        
        <div className={styles.pickerToolbar}>
          <div className={styles.viewButtons}>
            <button 
              className={`${styles.viewBtn} ${view === 'top' ? styles.active : ''}`}
              onClick={() => setView('top')}
            >
              俯视
            </button>
            <button 
              className={`${styles.viewBtn} ${view === 'front' ? styles.active : ''}`}
              onClick={() => setView('front')}
            >
              正视
            </button>
            <button 
              className={`${styles.viewBtn} ${view === 'side' ? styles.active : ''}`}
              onClick={() => setView('side')}
            >
              侧视
            </button>
          </div>
          
          <div className={styles.zoomControls}>
            <button onClick={() => setScale(prev => Math.max(5, prev * 0.8))}>➖</button>
            <span>{Math.round(scale)}px/单位</span>
            <button onClick={() => setScale(prev => Math.min(100, prev * 1.2))}>➕</button>
          </div>
        </div>
        
        <div className={styles.canvasContainer}>
          <canvas
            ref={canvasRef}
            className={styles.coordinateCanvas}
            onClick={handleCanvasClick}
            onWheel={handleWheel}
          />
        </div>
        
        <div className={styles.pickerInfo}>
          <div className={styles.coordDisplay}>
            <span>X: {(selectedPoint?.x ?? 0).toFixed(2)}</span>
            <span>Y: {(selectedPoint?.y ?? 0).toFixed(2)}</span>
            <span>Z: {(selectedPoint?.z ?? 0).toFixed(2)}</span>
          </div>
          <p className={styles.hint}>💡 点击画布选择坐标，滚轮缩放，当前为{view === 'top' ? '俯视图' : view === 'front' ? '正视图' : '侧视图'}</p>
        </div>
        
        <div className={styles.pickerFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>取消</button>
          <button className={styles.confirmBtn} onClick={handleConfirm}>
            ✓ 确认选择
          </button>
        </div>
      </div>
    </div>
  )
}
