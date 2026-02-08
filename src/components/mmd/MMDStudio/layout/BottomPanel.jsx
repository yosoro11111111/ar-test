import React, { useState, useRef, useEffect } from 'react'
import styles from './BottomPanel.module.css'

/**
 * 底部面板 - 时间轴
 */
export function BottomPanel({
  project,
  currentTime,
  isPlaying,
  onTimeChange,
  onTogglePlay,
  onUpdateTimeline,
  selectedTrack,
  onSelectTrack
}) {
  const timelineRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)

  const duration = project?.canvas?.duration || 120
  const tracks = project?.timeline?.tracks || []
  const clips = project?.timeline?.clips || []

  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 时间转像素
  const timeToPixels = (time) => {
    return (time / duration) * 100 * scale
  }

  // 像素转时间
  const pixelsToTime = (pixels) => {
    return (pixels / (100 * scale)) * duration
  }

  // 处理时间轴点击
  const handleTimelineClick = (e) => {
    if (!timelineRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const time = pixelsToTime(x)
    onTimeChange(Math.max(0, Math.min(time, duration)))
  }

  // 缩放控制
  const handleZoomIn = () => {
    setScale(Math.min(scale * 1.2, 5))
  }

  const handleZoomOut = () => {
    setScale(Math.max(scale / 1.2, 0.2))
  }

  // 渲染轨道
  const renderTracks = () => {
    return (
      <div className={styles.tracks}>
        {project.characters.map((char, index) => (
          <div key={char.id} className={styles.track}>
            <div className={styles.trackHeader}>
              <span className={styles.trackIcon}>👤</span>
              <span className={styles.trackName}>{char.name}</span>
              <button className={styles.trackToggle}>▼</button>
            </div>
            <div className={styles.trackContent}>
              {/* 动作轨道 */}
              <div className={styles.subTrack}>
                <span className={styles.subTrackLabel}>🎭 动作</span>
                <div className={styles.clipContainer}>
                  {renderClips(char.id, 'action')}
                </div>
              </div>
              {/* 位置轨道 */}
              <div className={styles.subTrack}>
                <span className={styles.subTrackLabel}>📍 位置</span>
                <div className={styles.clipContainer}>
                  {renderClips(char.id, 'position')}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {project.props.map(prop => (
          <div key={prop.id} className={styles.track}>
            <div className={styles.trackHeader}>
              <span className={styles.trackIcon}>📦</span>
              <span className={styles.trackName}>{prop.name}</span>
            </div>
            <div className={styles.trackContent}>
              <div className={styles.subTrack}>
                <span className={styles.subTrackLabel}>📍 位置</span>
                <div className={styles.clipContainer}>
                  {renderClips(prop.id, 'position')}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // 渲染片段
  const renderClips = (targetId, type) => {
    const targetClips = clips.filter(c => c.targetId === targetId && c.type === type)
    
    return targetClips.map(clip => (
      <div
        key={clip.id}
        className={styles.clip}
        style={{
          left: `${timeToPixels(clip.startTime)}%`,
          width: `${timeToPixels(clip.duration)}%`
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelectTrack(clip)
        }}
      >
        <div className={styles.clipContent}>
          {clip.name || '未命名'}
        </div>
        <div className={styles.clipResizeLeft} />
        <div className={styles.clipResizeRight} />
      </div>
    ))
  }

  // 渲染时间刻度
  const renderTimeRuler = () => {
    const markers = []
    const step = duration > 60 ? 10 : 5
    
    for (let i = 0; i <= duration; i += step) {
      markers.push(
        <div
          key={i}
          className={styles.timeMarker}
          style={{ left: `${timeToPixels(i)}%` }}
        >
          <div className={styles.markerLine} />
          <div className={styles.markerLabel}>{formatTime(i)}</div>
        </div>
      )
    }
    
    return <div className={styles.timeRuler}>{markers}</div>
  }

  return (
    <div className={styles.container}>
      {/* 时间轴控制 */}
      <div className={styles.controls}>
        <div className={styles.playbackButtons}>
          <button onClick={() => onTimeChange(0)}>⏮</button>
          <button onClick={onTogglePlay} className={styles.playButton}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button onClick={() => onTimeChange(duration)}>⏭</button>
        </div>
        
        <div className={styles.timeDisplay}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        
        <div className={styles.zoomControls}>
          <button onClick={handleZoomOut}>🔍-</button>
          <span>{Math.round(scale * 100)}%</span>
          <button onClick={handleZoomIn}>🔍+</button>
        </div>
      </div>

      {/* 时间轴 */}
      <div className={styles.timelineWrapper}>
        {renderTimeRuler()}
        
        <div
          ref={timelineRef}
          className={styles.timeline}
          onClick={handleTimelineClick}
        >
          {/* 播放头 */}
          <div
            className={styles.playhead}
            style={{ left: `${timeToPixels(currentTime)}%` }}
          />
          
          {/* 轨道 */}
          {renderTracks()}
        </div>
      </div>
    </div>
  )
}
