import React, { useState, useRef, useEffect, useCallback } from 'react'
import styles from './TimelineEditor.module.css'

/**
 * 时间轴编辑器组件
 * 支持多轨道编辑：动作轨道、位置轨道、旋转轨道
 */
export function TimelineEditor({
  characters,
  tracks,
  duration,
  currentTime,
  isPlaying,
  onPlay,
  onPause,
  onSeek,
  onAddClip,
  onDeleteClip,
  onUpdateClip,
  selectedCharacterId,
  onSelectCharacter
}) {
  const timelineRef = useRef(null)
  const [zoom, setZoom] = useState(100) // 缩放比例
  const [isDragging, setIsDragging] = useState(false)
  const [dragClip, setDragClip] = useState(null)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartTime, setDragStartTime] = useState(0)

  // 像素/秒比例
  const pixelsPerSecond = (zoom / 100) * 50

  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }

  // 时间转像素
  const timeToPixels = (time) => time * pixelsPerSecond

  // 像素转时间
  const pixelsToTime = (pixels) => pixels / pixelsPerSecond

  // 处理时间轴点击
  const handleTimelineClick = (e) => {
    if (!timelineRef.current || isDragging) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const time = Math.max(0, Math.min(duration, pixelsToTime(x)))
    onSeek(time)
  }

  // 开始拖动剪辑
  const handleClipMouseDown = (e, trackId, clipId, clip) => {
    e.stopPropagation()
    setIsDragging(true)
    setDragClip({ trackId, clipId, clip })
    setDragStartX(e.clientX)
    setDragStartTime(clip.startTime)
  }

  // 处理拖动
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !dragClip) return
      
      const deltaX = e.clientX - dragStartX
      const deltaTime = pixelsToTime(deltaX)
      const newStartTime = Math.max(0, dragStartTime + deltaTime)
      
      onUpdateClip(dragClip.trackId, dragClip.clipId, { startTime: newStartTime })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setDragClip(null)
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragClip, dragStartX, dragStartTime, pixelsPerSecond])

  // 获取轨道类型图标
  const getTrackIcon = (type) => {
    switch (type) {
      case 'action': return '🎭'
      case 'position': return '📍'
      case 'rotation': return '🔄'
      case 'scale': return '📏'
      default: return '📋'
    }
  }

  // 获取轨道类型名称
  const getTrackName = (type) => {
    switch (type) {
      case 'action': return '动作'
      case 'position': return '位置'
      case 'rotation': return '旋转'
      case 'scale': return '缩放'
      default: return '轨道'
    }
  }

  return (
    <div className={styles.container}>
      {/* 顶部工具栏 */}
      <div className={styles.toolbar}>
        <div className={styles.playbackControls}>
          <button 
            className={styles.playBtn}
            onClick={isPlaying ? onPause : onPlay}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <button 
            className={styles.stopBtn}
            onClick={() => onSeek(0)}
          >
            ⏹️
          </button>
        </div>

        <div className={styles.timeDisplay}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        <div className={styles.zoomControls}>
          <button onClick={() => setZoom(z => Math.max(50, z - 25))}>🔍-</button>
          <span>{zoom}%</span>
          <button onClick={() => setZoom(z => Math.min(200, z + 25))}>🔍+</button>
        </div>
      </div>

      {/* 时间刻度 */}
      <div className={styles.timeRuler}>
        {Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => (
          <div
            key={i}
            className={styles.timeMark}
            style={{ left: timeToPixels(i) }}
          >
            <span>{i}s</span>
          </div>
        ))}
      </div>

      {/* 轨道列表 */}
      <div className={styles.tracksContainer} ref={timelineRef}>
        {/* 播放头 */}
        <div 
          className={styles.playhead}
          style={{ left: timeToPixels(currentTime) }}
        >
          <div className={styles.playheadLine}></div>
          <div className={styles.playheadHandle}></div>
        </div>

        {/* 角色轨道 */}
        {characters.map((character) => (
          <div key={character.id} className={styles.characterSection}>
            {/* 角色标题 */}
            <div 
              className={`${styles.characterHeader} ${selectedCharacterId === character.id ? styles.selected : ''}`}
              onClick={() => onSelectCharacter(character.id)}
            >
              <div 
                className={styles.characterColor}
                style={{ backgroundColor: character.color }}
              />
              <span className={styles.characterName}>{character.name}</span>
              <button 
                className={styles.addTrackBtn}
                onClick={(e) => {
                  e.stopPropagation()
                  // 显示添加轨道菜单
                }}
              >
                +
              </button>
            </div>

            {/* 角色的轨道 */}
            {tracks
              .filter(track => track.characterId === character.id)
              .map((track) => (
                <div key={track.id} className={styles.track}>
                  {/* 轨道标题 */}
                  <div className={styles.trackHeader}>
                    <span className={styles.trackIcon}>{getTrackIcon(track.type)}</span>
                    <span className={styles.trackName}>{getTrackName(track.type)}</span>
                  </div>

                  {/* 轨道内容 */}
                  <div 
                    className={styles.trackContent}
                    onClick={handleTimelineClick}
                  >
                    {/* 网格背景 */}
                    <div className={styles.trackGrid}>
                      {Array.from({ length: Math.ceil(duration) }, (_, i) => (
                        <div 
                          key={i}
                          className={styles.gridLine}
                          style={{ left: timeToPixels(i) }}
                        />
                      ))}
                    </div>

                    {/* 剪辑片段 */}
                    {track.clips.map((clip) => (
                      <div
                        key={clip.id}
                        className={`${styles.clip} ${clip.type === 'action' ? styles.actionClip : ''}`}
                        style={{
                          left: timeToPixels(clip.startTime),
                          width: timeToPixels(clip.duration)
                        }}
                        onMouseDown={(e) => handleClipMouseDown(e, track.id, clip.id, clip)}
                      >
                        <div className={styles.clipContent}>
                          <span className={styles.clipName}>{clip.name}</span>
                          <span className={styles.clipDuration}>
                            {clip.duration.toFixed(1)}s
                          </span>
                        </div>
                        
                        {/* 调整手柄 */}
                        <div className={styles.resizeHandleLeft} />
                        <div className={styles.resizeHandleRight} />

                        {/* 删除按钮 */}
                        <button 
                          className={styles.deleteClipBtn}
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteClip(track.id, clip.id)
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}

                    {/* 添加剪辑按钮 */}
                    <button 
                      className={styles.addClipBtn}
                      onClick={(e) => {
                        e.stopPropagation()
                        onAddClip(track.id, track.type)
                      }}
                    >
                      + 添加{getTrackName(track.type)}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default TimelineEditor
