import React, { useRef, useState, useCallback } from 'react'
import styles from './Timeline.module.css'

/**
 * 时间轴组件 - 每个角色3条子轨道（场景/动作/特效）
 */
export function Timeline({ 
  tracks, 
  currentTime, 
  duration, 
  scale, 
  onTimeChange,
  onAddCharacter,
  onAddCell,
  onEditCell,
  onCellUpdate,
  onDeleteCell,
  onDeleteCharacter,
  isPlaying,
  onPlayPause
}) {
  const timelineRef = useRef(null)
  const [dragState, setDragState] = useState(null)
  const [resizeState, setResizeState] = useState(null)
  const [draggingCell, setDraggingCell] = useState(null)
  
  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }
  
  // 总头部宽度 = 角色头部(200) + 子轨道头部(120)
  const TOTAL_HEADER_WIDTH = 320
  
  // 获取时间轴宽度
  const getTimelineWidth = () => {
    if (!timelineRef.current) return 0
    return timelineRef.current.clientWidth - TOTAL_HEADER_WIDTH
  }
  
  // 时间转像素
  const timeToPixels = (time) => {
    return (time / duration) * getTimelineWidth()
  }
  
  // 像素转时间
  const pixelsToTime = (pixels) => {
    return (pixels / getTimelineWidth()) * duration
  }
  
  // 时间轴点击
  const handleTimelineClick = (e) => {
    if (!timelineRef.current || dragState || resizeState) return
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - TOTAL_HEADER_WIDTH
    if (x < 0) return
    const time = pixelsToTime(x)
    onTimeChange(Math.max(0, Math.min(time, duration)))
  }
  
  // 开始拖拽
  const handleCellDragStart = (e, trackId, subTrackType, cell) => {
    e.stopPropagation()
    e.preventDefault()
    
    setDragState({
      trackId,
      subTrackType,
      cellId: cell.id,
      startX: e.clientX,
      initialStartTime: cell.startTime,
      duration: cell.duration
    })
    setDraggingCell(cell.id)
  }
  
  // 开始缩放
  const handleCellResizeStart = (e, trackId, subTrackType, cell) => {
    e.stopPropagation()
    e.preventDefault()
    
    setResizeState({
      trackId,
      subTrackType,
      cellId: cell.id,
      startX: e.clientX,
      initialStartTime: cell.startTime,
      initialDuration: cell.duration
    })
  }
  
  // 鼠标移动
  const handleMouseMove = useCallback((e) => {
    if (!timelineRef.current) return
    
    const timelineWidth = getTimelineWidth()
    const pixelsPerSecond = timelineWidth / duration
    
    if (dragState) {
      const deltaX = e.clientX - dragState.startX
      const deltaTime = deltaX / pixelsPerSecond
      const newStartTime = Math.max(0, Math.min(duration - dragState.duration, dragState.initialStartTime + deltaTime))
      
      onCellUpdate(dragState.trackId, dragState.subTrackType, dragState.cellId, { startTime: newStartTime })
    }
    
    if (resizeState) {
      const deltaX = e.clientX - resizeState.startX
      const deltaTime = deltaX / pixelsPerSecond
      const newDuration = Math.max(0.5, Math.min(duration - resizeState.initialStartTime, resizeState.initialDuration + deltaTime))
      
      onCellUpdate(resizeState.trackId, resizeState.subTrackType, resizeState.cellId, { duration: newDuration })
    }
  }, [dragState, resizeState, duration, onCellUpdate])
  
  // 鼠标释放
  const handleMouseUp = useCallback(() => {
    setDragState(null)
    setResizeState(null)
    setDraggingCell(null)
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
  
  // 获取子轨道颜色
  const getSubTrackColor = (type) => {
    switch(type) {
      case 'scene': return '#4ade80'
      case 'action': return '#f093fb'
      case 'effect': return '#fbbf24'
      default: return '#667eea'
    }
  }
  
  // 获取子轨道图标
  const getSubTrackIcon = (type) => {
    switch(type) {
      case 'scene': return '🗺️'
      case 'action': return '🎭'
      case 'effect': return '✨'
      case 'scale': return '🔍'
      case 'bgScale': return '🖼️'
      default: return ''
    }
  }
  
  return (
    <div className={styles.timelineContainer}>
      {/* 时间轴头部 */}
      <div className={styles.timelineHeader}>
        <div className={styles.headerLeft}>
          <button className={styles.addBtn} onClick={onAddCharacter} title="添加角色">
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
            style={{ left: `${TOTAL_HEADER_WIDTH + timeToPixels(tick)}px` }}
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
            <p>点击 ➕ 添加角色</p>
          </div>
        ) : (
          tracks.map((track) => (
            <div key={track.id} className={styles.characterTrack}>
              {/* 角色头部 */}
              <div className={styles.characterHeader}>
                <div 
                  className={styles.trackColor}
                  style={{ backgroundColor: track.characterColor }}
                />
                <span className={styles.trackName}>
                  {track.characterName}
                </span>
                <button 
                  className={styles.deleteCharacterBtn}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteCharacter(track.characterId)
                  }}
                  title="删除角色"
                >
                  🗑️
                </button>
              </div>
              
              {/* 5条子轨道 */}
              <div className={styles.subTracks}>
                {['scene', 'action', 'effect', 'scale', 'bgScale'].map((subTrackType) => (
                  <div key={subTrackType} className={styles.subTrack}>
                    {/* 子轨道头部 */}
                    <div className={styles.subTrackHeader}>
                      <span className={styles.subTrackIcon}>{getSubTrackIcon(subTrackType)}</span>
                      <span className={styles.subTrackName}>
                        {subTrackType === 'scene' ? '场景' : 
                         subTrackType === 'action' ? '动作' : 
                         subTrackType === 'effect' ? '特效' :
                         subTrackType === 'scale' ? '人物缩放' : '背景缩放'}
                      </span>
                      <button 
                        className={styles.subTrackAddBtn}
                        onClick={(e) => {
                          e.stopPropagation()
                          onAddCell(track.id, subTrackType)
                        }}
                        title={`添加${subTrackType === 'scene' ? '场景' : 
                                 subTrackType === 'action' ? '动作' : 
                                 subTrackType === 'effect' ? '特效' :
                                 subTrackType === 'scale' ? '人物缩放' : '背景缩放'}`}
                      >
                        +
                      </button>
                    </div>
                    
                    {/* 子轨道内容 */}
                    <div className={styles.subTrackLane}>
                      {track[subTrackType]?.map((cell) => (
                        <div
                          key={cell.id}
                          className={`${styles.cell} ${draggingCell === cell.id ? styles.dragging : ''}`}
                          style={{
                            left: `${timeToPixels(cell.startTime)}px`,
                            width: `${timeToPixels(cell.duration)}px`,
                            backgroundColor: getSubTrackColor(subTrackType)
                          }}
                          onMouseDown={(e) => handleCellDragStart(e, track.id, subTrackType, cell)}
                          onClick={(e) => {
                            if (!dragState && !resizeState) {
                              e.stopPropagation()
                              onEditCell(track.id, subTrackType, cell)
                            }
                          }}
                        >
                          <div className={styles.cellContent}>
                            <span className={styles.cellName}>
                              {cell.name || `未命名${subTrackType === 'scene' ? '场景' : subTrackType === 'action' ? '动作' : '特效'}`}
                            </span>
                            <span className={styles.cellDuration}>{Math.round(cell.duration)}s</span>
                          </div>
                          
                          {/* 删除按钮 */}
                          <button 
                            className={styles.cellDeleteBtn}
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteCell(track.id, subTrackType, cell.id)
                            }}
                          >
                            ×
                          </button>
                          
                          {/* 缩放手柄 */}
                          <div 
                            className={styles.resizeHandle}
                            onMouseDown={(e) => handleCellResizeStart(e, track.id, subTrackType, cell)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        
        {/* 播放头 */}
        <div 
          className={styles.playhead}
          style={{ left: `${TOTAL_HEADER_WIDTH + timeToPixels(currentTime)}px` }}
        >
          <div className={styles.playheadLine} />
          <div className={styles.playheadHandle} />
        </div>
      </div>
    </div>
  )
}

export default Timeline
