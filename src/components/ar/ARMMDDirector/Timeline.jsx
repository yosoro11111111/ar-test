import React, { useRef, useState, useCallback } from 'react'
import styles from './Timeline.module.css'

/**
 * 时间轴组件 - 支持拖拽调整位置、缩放调整时间
 */
export function Timeline({ 
  tracks, 
  currentTime, 
  duration, 
  scale, 
  onTimeChange,
  onTrackSelect,
  onAddClick,
  onClipUpdate,
  isPlaying,
  onPlayPause
}) {
  const timelineRef = useRef(null)
  const [dragState, setDragState] = useState(null)
  const [resizeState, setResizeState] = useState(null)
  
  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }
  
  // 时间轴点击
  const handleTimelineClick = (e) => {
    if (!timelineRef.current || dragState || resizeState) return
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - 150 // 减去轨道头部宽度
    if (x < 0) return
    const time = (x / (rect.width - 150)) * duration
    onTimeChange(Math.max(0, Math.min(time, duration)))
  }
  
  // 开始拖拽片段
  const handleClipDragStart = (e, trackId, clipId, startTime, duration) => {
    e.stopPropagation()
    setDragState({
      trackId,
      clipId,
      startX: e.clientX,
      initialStartTime: startTime,
      duration
    })
  }
  
  // 开始缩放片段
  const handleClipResizeStart = (e, trackId, clipId, startTime, duration) => {
    e.stopPropagation()
    setResizeState({
      trackId,
      clipId,
      startX: e.clientX,
      initialStartTime: startTime,
      initialDuration: duration
    })
  }
  
  // 鼠标移动处理
  const handleMouseMove = useCallback((e) => {
    if (!timelineRef.current) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const timelineWidth = rect.width - 150
    const pixelsPerSecond = timelineWidth / duration
    
    // 处理拖拽
    if (dragState) {
      const deltaX = e.clientX - dragState.startX
      const deltaTime = deltaX / pixelsPerSecond
      const newStartTime = Math.max(0, Math.min(duration - dragState.duration, dragState.initialStartTime + deltaTime))
      
      onClipUpdate(dragState.trackId, dragState.clipId, { startTime: newStartTime })
    }
    
    // 处理缩放
    if (resizeState) {
      const deltaX = e.clientX - resizeState.startX
      const deltaTime = deltaX / pixelsPerSecond
      const newDuration = Math.max(0.5, Math.min(duration - resizeState.initialStartTime, resizeState.initialDuration + deltaTime))
      
      onClipUpdate(resizeState.trackId, resizeState.clipId, { duration: newDuration })
    }
  }, [dragState, resizeState, duration, onClipUpdate])
  
  // 鼠标释放处理
  const handleMouseUp = useCallback(() => {
    setDragState(null)
    setResizeState(null)
  }, [])
  
  // 生成时间刻度
  const generateTicks = () => {
    const ticks = []
    const step = Math.max(5, Math.floor(duration / 20))
    for (let i = 0; i <= duration; i += step) {
      ticks.push(i)
    }
    return ticks
  }
  
  // 获取轨道颜色
  const getTrackColor = (track) => {
    if (track.type === 'character') return track.characterColor || '#667eea'
    if (track.type === 'scene') return '#4ade80'
    if (track.type === 'effect') return '#f472b6'
    return '#888'
  }
  
  return (
    <div className={styles.timelineContainer}>
      {/* 时间轴头部 */}
      <div className={styles.timelineHeader}>
        <div className={styles.headerLeft}>
          <button className={styles.addBtn} onClick={onAddClick} title="添加元素">
            ➕
          </button>
          <button 
            className={`${styles.playBtn} ${isPlaying ? styles.playing : ''}`}
            onClick={onPlayPause}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
        </div>
        
        <div className={styles.timeDisplay}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        
        <div className={styles.timelineControls}>
          <button className={styles.zoomBtn}>-</button>
          <span className={styles.zoomLevel}>{Math.round(scale * 100)}%</span>
          <button className={styles.zoomBtn}>+</button>
        </div>
      </div>
      
      {/* 时间刻度 */}
      <div className={styles.timeRuler}>
        {generateTicks().map(tick => (
          <div 
            key={tick}
            className={styles.tick}
            style={{ left: `${150 + (tick / duration) * (timelineRef.current?.clientWidth - 150 || 0)}px` }}
          >
            <span>{tick}s</span>
          </div>
        ))}
      </div>
      
      {/* 轨道列表 */}
      <div 
        className={styles.tracksContainer} 
        ref={timelineRef} 
        onClick={handleTimelineClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {tracks.length === 0 ? (
          <div className={styles.emptyTracks}>
            <p>点击 ➕ 添加角色、场景、动作或特效</p>
          </div>
        ) : (
          tracks.map(track => (
            <div key={track.id} className={styles.track}>
              {/* 轨道头部 */}
              <div className={styles.trackHeader}>
                <div 
                  className={styles.trackColor}
                  style={{ backgroundColor: getTrackColor(track) }}
                />
                <span className={styles.trackName}>
                  {track.characterName || track.name || '未命名'}
                </span>
              </div>
              
              {/* 轨道内容 */}
              <div className={styles.trackLane}>
                {track.clips?.map(clip => (
                  <div
                    key={clip.id}
                    className={`${styles.clip} ${styles[clip.type]}`}
                    style={{
                      left: `${150 + (clip.startTime / duration) * 100}%`,
                      width: `${(clip.duration / duration) * 100}%`
                    }}
                    onMouseDown={(e) => handleClipDragStart(e, track.id, clip.id, clip.startTime, clip.duration)}
                  >
                    <span className={styles.clipName}>
                      {clip.actionName || clip.sceneName || clip.effectName || clip.name}
                    </span>
                    {/* 缩放手柄 */}
                    <div 
                      className={styles.resizeHandle}
                      onMouseDown={(e) => handleClipResizeStart(e, track.id, clip.id, clip.startTime, clip.duration)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        
        {/* 播放头 */}
        <div 
          className={styles.playhead}
          style={{ left: `${150 + (currentTime / duration) * (timelineRef.current?.clientWidth - 150 || 0)}px` }}
        >
          <div className={styles.playheadLine} />
          <div className={styles.playheadHandle} />
        </div>
      </div>
    </div>
  )
}

export default Timeline
