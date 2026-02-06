import React, { useRef, useState, useCallback, useMemo } from 'react'
import { TRACK_TYPES, getTrackTypeInfo } from './trackTypes'
import styles from './Timeline.module.css'

/**
 * 时间轴组件 - 新版
 * 支持灵活的轨道系统，每个角色可以有多个不同类型的轨道
 */
export function Timeline({
  project,
  tracks,
  characters,
  currentTime,
  duration,
  scale,
  onTimeChange,
  onAddCharacter,
  onAddTrack,
  onAddCell,
  onEditCell,
  onCellUpdate,
  onDeleteCell,
  onDeleteCharacter,
  onDeleteTrack,
  isPlaying,
  onPlayPause,
  onScaleChange
}) {
  const timelineRef = useRef(null)
  const [dragState, setDragState] = useState(null)
  const [resizeState, setResizeState] = useState(null)
  const [draggingCell, setDraggingCell] = useState(null)
  const [expandedCharacters, setExpandedCharacters] = useState(new Set())
  const [showTrackSelector, setShowTrackSelector] = useState(null) // characterId or null

  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }

  // 轨道类型列宽度
  const TRACK_TYPE_COL_WIDTH = 120
  // 总头部宽度（只包含轨道类型列，因为角色头部是独立的）
  const TOTAL_HEADER_WIDTH = TRACK_TYPE_COL_WIDTH

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
  const handleCellDragStart = (e, trackId, cell) => {
    e.stopPropagation()
    e.preventDefault()

    setDragState({
      trackId,
      cellId: cell.id,
      startX: e.clientX,
      initialStartTime: cell.startTime,
      duration: cell.duration
    })
    setDraggingCell(cell.id)
  }

  // 开始缩放
  const handleCellResizeStart = (e, trackId, cell) => {
    e.stopPropagation()
    e.preventDefault()

    setResizeState({
      trackId,
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

      onCellUpdate(dragState.trackId, dragState.cellId, { startTime: newStartTime })
    }

    if (resizeState) {
      const deltaX = e.clientX - resizeState.startX
      const deltaTime = deltaX / pixelsPerSecond
      const newDuration = Math.max(0.5, Math.min(duration - resizeState.initialStartTime, resizeState.initialDuration + deltaTime))

      onCellUpdate(resizeState.trackId, resizeState.cellId, { duration: newDuration })
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

  // 按角色分组轨道
  const tracksByCharacter = useMemo(() => {
    const grouped = {}
    characters.forEach(char => {
      grouped[char.id] = tracks.filter(track => track.characterId === char.id)
    })
    return grouped
  }, [tracks, characters])
  
  // 获取场景轨道（没有characterId的轨道）
  const sceneTracks = useMemo(() => {
    return tracks.filter(track => !track.characterId && track.type === 'scene')
  }, [tracks])

  // 获取单元格显示名称
  const getCellDisplayName = (cell, trackType) => {
    // 根据轨道类型显示不同的内容
    switch (trackType) {
      case 'scene':
        return cell.data?.sceneName || cell.data?.name || '选择场景'
      case 'action':
        return cell.data?.actionName || cell.data?.name || '选择动作'
      case 'effect':
        return cell.data?.effectName || cell.data?.name || '选择特效'
      case 'position':
        return cell.data?.presetId || cell.data?.name || '设置路径'
      case 'scale':
        return cell.data?.scale ? `${cell.data.scale}x` : (cell.data?.name || '设置缩放')
      case 'music':
        return cell.data?.musicName || cell.data?.name || '选择音乐'
      case 'prop':
        return cell.data?.propName || cell.data?.name || '选择道具'
      case 'bgScale':
        return cell.data?.scale ? `${cell.data.scale}x` : (cell.data?.name || '背景缩放')
      default:
        return cell.data?.name || `未命名${getTrackTypeInfo(trackType)?.name || '片段'}`
    }
  }

  return (
    <div className={styles.timelineContainer}>
      {/* 时间轴头部 */}
      <div className={styles.timelineHeader}>
        <div className={styles.headerLeft}>
          <button className={styles.addBtn} onClick={onAddCharacter} title="添加角色">
            ➕ 添加角色
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
          <button 
            className={styles.zoomBtn}
            onClick={() => onScaleChange && onScaleChange(Math.max(0.5, scale - 0.1))}
            title="缩小"
          >
            -
          </button>
          <span className={styles.zoomLevel}>{Math.round(scale * 100)}%</span>
          <button 
            className={styles.zoomBtn}
            onClick={() => onScaleChange && onScaleChange(Math.min(3, scale + 0.1))}
            title="放大"
          >
            +
          </button>
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
        {/* 场景轨道（全局轨道） */}
        {sceneTracks.length > 0 && (
          <div className={styles.sceneTracksSection}>
            {sceneTracks.map((track) => {
              const trackTypeInfo = getTrackTypeInfo(track.type)
              return (
                <div key={track.id} className={styles.trackRow}>
                  <div className={styles.trackTypeHeader}>
                    <span className={styles.trackTypeIcon}>
                      {trackTypeInfo?.icon || '📦'}
                    </span>
                    <span className={styles.trackTypeName}>
                      {trackTypeInfo?.name || track.type}
                    </span>
                    <button
                      className={styles.addCellBtn}
                      onClick={(e) => {
                        e.stopPropagation()
                        onAddCell(track.id)
                      }}
                      title={`添加${trackTypeInfo?.name || '片段'}`}
                    >
                      +
                    </button>
                  </div>
                  <div className={styles.trackLane}>
                    {track.clips?.map((clip) => (
                      <div
                        key={clip.id}
                        className={styles.cell}
                        style={{
                          left: `${timeToPixels(clip.startTime)}px`,
                          width: `${timeToPixels(clip.endTime - clip.startTime)}px`
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditCell(track.id, track.type, clip)
                        }}
                      >
                        {getCellDisplayName(clip, track.type)}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        
        {characters.length === 0 ? (
          <div className={styles.emptyTracks}>
            <p>点击 ➕ 添加角色开始创作</p>
          </div>
        ) : (
          characters.map((character) => {
            const characterTracks = tracksByCharacter[character.id] || []

            const isExpanded = expandedCharacters.has(character.id)

            return (
              <div key={character.id} className={styles.characterSection}>
                {/* 角色头部 */}
                <div className={styles.characterHeader}>
                  <button
                    className={styles.expandBtn}
                    onClick={(e) => {
                      e.stopPropagation()
                      const newExpanded = new Set(expandedCharacters)
                      if (newExpanded.has(character.id)) {
                        newExpanded.delete(character.id)
                      } else {
                        newExpanded.add(character.id)
                      }
                      setExpandedCharacters(newExpanded)
                    }}
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>
                  <div
                    className={styles.characterColor}
                    style={{ backgroundColor: character.color }}
                  />
                  <span className={styles.characterName}>
                    {character.name}
                  </span>
                  <span className={styles.trackCount}>
                    {characterTracks.length} 轨道
                  </span>
                  <button
                    className={styles.addTrackBtn}
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowTrackSelector(showTrackSelector === character.id ? null : character.id)
                    }}
                    title="添加轨道"
                  >
                    ➕
                  </button>
                  <button
                    className={styles.deleteCharacterBtn}
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteCharacter(character.id)
                    }}
                    title="删除角色"
                  >
                    🗑️
                  </button>
                </div>

                {/* 下拉轨道选择器 */}
                <div className={`${styles.trackSelectorDropdown} ${showTrackSelector === character.id ? styles.show : ''}`}>
                  <div className={styles.trackSelectorContent}>
                    <div className={styles.trackSelectorHeader}>
                      <span className={styles.trackSelectorTitle}>📋 选择轨道类型</span>
                      <button
                        className={styles.closeSelector}
                        onClick={() => setShowTrackSelector(null)}
                      >
                        ✕
                      </button>
                    </div>
                    <div className={styles.trackSelectorGrid}>
                      {Object.values(TRACK_TYPES).map((trackType) => (
                        <button
                          key={trackType.id}
                          className={styles.trackSelectorItem}
                          onClick={() => {
                            onAddTrack(character.id, trackType.id)
                            setShowTrackSelector(null)
                          }}
                          style={{ '--track-color': trackType.color }}
                        >
                          <span className={styles.trackSelectorIcon}>{trackType.icon}</span>
                          <span className={styles.trackSelectorName}>{trackType.name}</span>
                          <span className={styles.trackSelectorDesc}>{trackType.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 角色的轨道列表 - 可折叠 */}
                {isExpanded && (
                  <div className={styles.tracksList}>
                    {characterTracks.length === 0 ? (
                      <div className={styles.emptyTracksHint}>
                        点击 ➕ 添加轨道
                      </div>
                    ) : (
                      characterTracks.map((track) => {
                        const trackTypeInfo = getTrackTypeInfo(track.type)

                        return (
                          <div key={track.id} className={styles.trackRow}>
                            {/* 轨道类型头部 */}
                            <div className={styles.trackTypeHeader}>
                              <span className={styles.trackTypeIcon}>
                                {trackTypeInfo?.icon || '📦'}
                              </span>
                              <span className={styles.trackTypeName}>
                                {trackTypeInfo?.name || track.type}
                              </span>
                              <button
                                className={styles.addCellBtn}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onAddCell(track.id)
                                }}
                                title={`添加${trackTypeInfo?.name || '片段'}`}
                              >
                                +
                              </button>
                              <button
                                className={styles.deleteTrackBtn}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDeleteTrack(track.id)
                                }}
                                title="删除轨道"
                              >
                                ×
                              </button>
                            </div>

                            {/* 轨道内容区域 */}
                            <div 
                              className={styles.trackLane}
                              onDoubleClick={(e) => {
                                e.stopPropagation()
                                // 计算双击位置对应的时间
                                const rect = e.currentTarget.getBoundingClientRect()
                                const x = e.clientX - rect.left + timelineRef.current.scrollLeft - TOTAL_HEADER_WIDTH
                                const time = Math.max(0, pixelsToTime(x))
                                // 创建智能片段
                                onAddCell(track.id, { startTime: time })
                              }}
                            >
                              {track.clips?.map((clip) => (
                                <div
                                  key={clip.id}
                                  className={`${styles.clip} ${draggingCell === clip.id ? styles.dragging : ''}`}
                                  style={{
                                    left: `${timeToPixels(clip.startTime)}px`,
                                    width: `${timeToPixels(clip.duration)}px`,
                                    backgroundColor: trackTypeInfo?.color || '#667eea'
                                  }}
                                  onMouseDown={(e) => handleCellDragStart(e, track.id, clip)}
                                  onClick={(e) => {
                                    if (!dragState && !resizeState) {
                                      e.stopPropagation()
                                      onEditCell(track.id, track.type, clip)
                                    }
                                  }}
                                >
                                  <div className={styles.clipContent}>
                                    <span className={styles.clipName}>
                                      {getCellDisplayName(clip, track.type)}
                                    </span>
                                    <span className={styles.clipDuration}>{Math.round(clip.duration)}s</span>
                                  </div>
                                  {/* 删除按钮 */}
                                  <button
                                    className={styles.clipDeleteBtn}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onDeleteCell(track.id, clip.id)
                                    }}
                                  >
                                    ×
                                  </button>
                                  {/* 缩放手柄 */}
                                  <div
                                    className={styles.resizeHandle}
                                    onMouseDown={(e) => handleCellResizeStart(e, track.id, clip)}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })
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
