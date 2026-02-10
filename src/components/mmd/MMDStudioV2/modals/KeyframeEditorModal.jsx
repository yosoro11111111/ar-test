import React, { useState, useEffect, useRef } from 'react'
import styles from './KeyframeEditorModal.module.css'

const INTERPOLATION_TYPES = [
  { id: 'linear', name: '线性', icon: '➡️' },
  { id: 'bezier', name: '贝塞尔', icon: '〰️' },
  { id: 'step', name: '阶梯', icon: '⬆️' }
]

const EASING_TYPES = [
  { id: 'linear', name: '线性' },
  { id: 'easeIn', name: '缓入' },
  { id: 'easeOut', name: '缓出' },
  { id: 'easeInOut', name: '缓入缓出' }
]

export function KeyframeEditorModal({
  animation,
  keyframeAnimation,
  currentTime,
  onClose,
  onUpdateAnimation
}) {
  const [selectedTrack, setSelectedTrack] = useState('position')
  const [selectedKeyframe, setSelectedKeyframe] = useState(null)
  const [zoom, setZoom] = useState(50) // 每秒像素数
  const [scrollX, setScrollX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const timelineRef = useRef(null)

  const tracks = animation?.tracks || { position: [], rotation: [], scale: [] }
  const duration = animation?.duration || 10

  // 获取轨道颜色
  const getTrackColor = (trackType) => {
    switch (trackType) {
      case 'position': return '#667eea'
      case 'rotation': return '#f093fb'
      case 'scale': return '#4facfe'
      default: return '#888'
    }
  }

  // 获取轨道标签
  const getTrackLabel = (trackType) => {
    switch (trackType) {
      case 'position': return '位置'
      case 'rotation': return '旋转'
      case 'scale': return '缩放'
      default: return trackType
    }
  }

  // 添加关键帧
  const handleAddKeyframe = () => {
    if (!animation || !keyframeAnimation) return

    let value
    switch (selectedTrack) {
      case 'position':
        value = { x: 0, y: 0, z: 0 }
        break
      case 'rotation':
        value = { x: 0, y: 0, z: 0 }
        break
      case 'scale':
        value = 1
        break
      default:
        value = {}
    }

    const keyframe = keyframeAnimation.addKeyframe(
      animation.id,
      selectedTrack,
      currentTime,
      value,
      { interpolation: 'bezier' }
    )

    if (keyframe) {
      onUpdateAnimation?.({ ...animation })
      setSelectedKeyframe(keyframe)
    }
  }

  // 删除关键帧
  const handleDeleteKeyframe = (keyframeId) => {
    if (!animation || !keyframeAnimation) return

    keyframeAnimation.deleteKeyframe(animation.id, selectedTrack, keyframeId)
    onUpdateAnimation?.({ ...animation })

    if (selectedKeyframe?.id === keyframeId) {
      setSelectedKeyframe(null)
    }
  }

  // 更新关键帧值
  const handleUpdateKeyframeValue = (key, value) => {
    if (!selectedKeyframe || !animation || !keyframeAnimation) return

    const numValue = parseFloat(value) || 0
    const updates = {
      value: { ...selectedKeyframe.value, [key]: numValue }
    }

    keyframeAnimation.updateKeyframe(
      animation.id,
      selectedTrack,
      selectedKeyframe.id,
      updates
    )

    onUpdateAnimation?.({ ...animation })
  }

  // 更新时间
  const handleUpdateTime = (time) => {
    if (!selectedKeyframe || !animation || !keyframeAnimation) return

    keyframeAnimation.updateKeyframe(
      animation.id,
      selectedTrack,
      selectedKeyframe.id,
      { time: parseFloat(time) || 0 }
    )

    onUpdateAnimation?.({ ...animation })
  }

  // 更新插值类型
  const handleUpdateInterpolation = (interpolation) => {
    if (!selectedKeyframe || !animation || !keyframeAnimation) return

    keyframeAnimation.updateKeyframe(
      animation.id,
      selectedTrack,
      selectedKeyframe.id,
      { interpolation }
    )

    onUpdateAnimation?.({ ...animation })
  }

  // 时间轴点击
  const handleTimelineClick = (e) => {
    if (!timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left + scrollX
    const time = x / zoom

    // 查找最近的关键帧
    const track = tracks[selectedTrack]
    const nearest = track.reduce((closest, kf) => {
      const distance = Math.abs(kf.time - time)
      if (distance < closest.distance) {
        return { keyframe: kf, distance }
      }
      return closest
    }, { keyframe: null, distance: Infinity })

    if (nearest.keyframe && nearest.distance < 0.5) {
      setSelectedKeyframe(nearest.keyframe)
    } else {
      setSelectedKeyframe(null)
    }
  }

  // 渲染时间轴
  const renderTimeline = () => {
    const track = tracks[selectedTrack] || []
    const width = Math.max(duration * zoom, 800)

    return (
      <div
        ref={timelineRef}
        className={styles.timeline}
        style={{ width: `${width}px` }}
        onClick={handleTimelineClick}
      >
        {/* 时间刻度 */}
        <div className={styles.timeRuler}>
          {Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => (
            <div
              key={i}
              className={styles.timeMark}
              style={{ left: `${i * zoom}px` }}
            >
              <span className={styles.timeLabel}>{i}s</span>
              <div className={styles.timeLine} />
            </div>
          ))}
        </div>

        {/* 关键帧 */}
        <div className={styles.keyframesTrack}>
          {track.map(keyframe => (
            <div
              key={keyframe.id}
              className={`${styles.keyframe} ${selectedKeyframe?.id === keyframe.id ? styles.selected : ''}`}
              style={{
                left: `${keyframe.time * zoom}px`,
                backgroundColor: getTrackColor(selectedTrack)
              }}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedKeyframe(keyframe)
              }}
              title={`时间: ${keyframe.time.toFixed(2)}s`}
            >
              <div className={styles.keyframeDiamond} />
            </div>
          ))}
        </div>

        {/* 当前时间指示器 */}
        <div
          className={styles.currentTimeIndicator}
          style={{ left: `${currentTime * zoom}px` }}
        />

        {/* 曲线预览 */}
        <svg className={styles.curvePreview} width={width} height="100">
          {track.length > 1 && (
            <path
              d={generateCurvePath(track, zoom)}
              fill="none"
              stroke={getTrackColor(selectedTrack)}
              strokeWidth="2"
              opacity="0.5"
            />
          )}
        </svg>
      </div>
    )
  }

  // 生成曲线路径
  const generateCurvePath = (track, zoom) => {
    if (track.length < 2) return ''

    const points = track.map(kf => ({
      x: kf.time * zoom,
      y: 50 - (kf.value.y || kf.value || 0) * 10 // 简化的Y值映射
    }))

    let path = `M ${points[0].x} ${points[0].y}`

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const cp1x = prev.x + (curr.x - prev.x) * 0.5
      const cp1y = prev.y
      const cp2x = prev.x + (curr.x - prev.x) * 0.5
      const cp2y = curr.y

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
    }

    return path
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>🎬 关键帧编辑器</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          {/* 轨道选择 */}
          <div className={styles.trackSelector}>
            {['position', 'rotation', 'scale'].map(trackType => (
              <button
                key={trackType}
                className={`${styles.trackBtn} ${selectedTrack === trackType ? styles.active : ''}`}
                onClick={() => {
                  setSelectedTrack(trackType)
                  setSelectedKeyframe(null)
                }}
                style={{
                  borderColor: selectedTrack === trackType ? getTrackColor(trackType) : undefined
                }}
              >
                <span
                  className={styles.trackDot}
                  style={{ backgroundColor: getTrackColor(trackType) }}
                />
                {getTrackLabel(trackType)}
                <span className={styles.trackCount}>
                  {tracks[trackType]?.length || 0}
                </span>
              </button>
            ))}
          </div>

          {/* 工具栏 */}
          <div className={styles.toolbar}>
            <button className={styles.addBtn} onClick={handleAddKeyframe}>
              + 添加关键帧
            </button>
            <div className={styles.zoomControls}>
              <button onClick={() => setZoom(z => Math.max(10, z - 10))}>−</button>
              <span>{zoom}px/s</span>
              <button onClick={() => setZoom(z => Math.min(200, z + 10))}>+</button>
            </div>
          </div>

          {/* 时间轴 */}
          <div className={styles.timelineContainer}>
            {renderTimeline()}
          </div>

          {/* 关键帧属性 */}
          {selectedKeyframe && (
            <div className={styles.properties}>
              <h3 className={styles.propertiesTitle}>关键帧属性</h3>

              <div className={styles.propertyRow}>
                <label>时间</label>
                <input
                  type="number"
                  step="0.01"
                  value={selectedKeyframe.time.toFixed(2)}
                  onChange={(e) => handleUpdateTime(e.target.value)}
                />
                <span>秒</span>
              </div>

              {typeof selectedKeyframe.value === 'object' ? (
                Object.keys(selectedKeyframe.value).map(key => (
                  <div key={key} className={styles.propertyRow}>
                    <label>{key.toUpperCase()}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={selectedKeyframe.value[key]}
                      onChange={(e) => handleUpdateKeyframeValue(key, e.target.value)}
                    />
                  </div>
                ))
              ) : (
                <div className={styles.propertyRow}>
                  <label>值</label>
                  <input
                    type="number"
                    step="0.01"
                    value={selectedKeyframe.value}
                    onChange={(e) => handleUpdateKeyframeValue('value', e.target.value)}
                  />
                </div>
              )}

              <div className={styles.propertyRow}>
                <label>插值</label>
                <div className={styles.interpolationButtons}>
                  {INTERPOLATION_TYPES.map(type => (
                    <button
                      key={type.id}
                      className={`${styles.interpolationBtn} ${selectedKeyframe.interpolation === type.id ? styles.active : ''}`}
                      onClick={() => handleUpdateInterpolation(type.id)}
                      title={type.name}
                    >
                      {type.icon}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className={styles.deleteKeyframeBtn}
                onClick={() => handleDeleteKeyframe(selectedKeyframe.id)}
              >
                删除关键帧
              </button>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.doneBtn} onClick={onClose}>
            完成
          </button>
        </div>
      </div>
    </div>
  )
}
