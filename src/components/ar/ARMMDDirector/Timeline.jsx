import React, { useRef, useState } from 'react'
import styles from './Timeline.module.css'

/**
 * 时间轴组件 - 多轨道编辑
 */
export function Timeline({ 
  tracks, 
  currentTime, 
  duration, 
  scale, 
  onTimeChange,
  onTrackSelect,
  onAddAction 
}) {
  const timelineRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  
  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }
  
  // 时间轴点击
  const handleTimelineClick = (e) => {
    if (!timelineRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const time = (x / rect.width) * duration
    onTimeChange(Math.max(0, Math.min(time, duration)))
  }
  
  // 生成时间刻度
  const generateTicks = () => {
    const ticks = []
    const step = 5 // 每5秒一个刻度
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
            style={{ left: `${(tick / duration) * 100}%` }}
          >
            <span>{tick}s</span>
          </div>
        ))}
      </div>
      
      {/* 轨道列表 */}
      <div className={styles.tracksContainer} ref={timelineRef} onClick={handleTimelineClick}>
        {tracks.length === 0 ? (
          <div className={styles.emptyTracks}>
            <p>点击底部"角色"按钮添加角色</p>
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
                <button 
                  className={styles.addClipBtn}
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddAction?.(track.id, track.characterId)
                  }}
                >
                  +
                </button>
              </div>
              
              {/* 轨道内容 */}
              <div className={styles.trackLane}>
                {track.clips?.map(clip => (
                  <div
                    key={clip.id}
                    className={`${styles.clip} ${styles[clip.type]}`}
                    style={{
                      left: `${(clip.startTime / duration) * 100}%`,
                      width: `${(clip.duration / duration) * 100}%`
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className={styles.clipName}>
                      {clip.actionName || clip.sceneName || clip.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        
        {/* 播放头 */}
        <div 
          className={styles.playhead}
          style={{ left: `${(currentTime / duration) * 100}%` }}
        >
          <div className={styles.playheadLine} />
          <div className={styles.playheadHandle} />
        </div>
      </div>
    </div>
  )
}

export default Timeline
