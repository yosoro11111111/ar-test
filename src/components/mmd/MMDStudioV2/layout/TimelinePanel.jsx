import React, { useState, useRef, useEffect } from 'react'
import styles from './TimelinePanel.module.css'
import { Timeline3DPreview } from '../components/Timeline3DPreview.jsx'

export function TimelinePanel({
  project,
  currentTime,
  isPlaying,
  timelineScale,
  onPlay,
  onStop,
  onPause,
  onSeek,
  onScaleChange,
  selectedTrack,
  selectedClip,
  onSelectTrack,
  onSelectClip,
  onUpdateClip,
  onDeleteClip,
  onDuplicateClip,
  onDropResource,
  onDeleteCharacter,
  formatTime,
  renderEngine
}) {
  const timelineRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [contextMenu, setContextMenu] = useState(null)
  const [resizingClip, setResizingClip] = useState(null)
  const [dragPreview, setDragPreview] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)

  const duration = project?.duration || 120

  // 获取轨道分组数据
  const getTrackGroups = () => {
    if (!project?.tracks) return []
    
    const groups = []
    
    // 1. 场景轴
    const sceneTrack = project.tracks.find(t => t.type === 'scene')
    if (sceneTrack) groups.push({ type: 'scene', track: sceneTrack })
    
    // 2. 摄像机轨道
    const cameraTrack = project.tracks.find(t => t.type === 'camera')
    if (cameraTrack) groups.push({ type: 'camera', track: cameraTrack })
    
    // 3. 人物分组
    const characterTracks = project.tracks.filter(t => t.targetType === 'character')
    const characterIds = [...new Set(characterTracks.map(t => t.targetId))]
    
    // 轨道类型排序顺序
    const trackTypeOrder = { motion: 0, expression: 1, prop: 2 }
    
    characterIds.forEach(charId => {
      const charTracks = characterTracks
        .filter(t => t.targetId === charId)
        .sort((a, b) => (trackTypeOrder[a.type] ?? 99) - (trackTypeOrder[b.type] ?? 99))
      
      const char = project.characters?.find(c => c.id === charId)
      if (char) {
        groups.push({
          type: 'character_group',
          characterId: charId,
          character: char,
          tracks: charTracks
        })
      }
    })
    
    // 4. 音乐轨道
    const musicTrack = project.tracks.find(t => t.type === 'music')
    if (musicTrack) groups.push({ type: 'music', track: musicTrack })
    
    return groups
  }

  // 计算时间标尺刻度 - 更精细的刻度
  const getTimeMarkers = () => {
    const markers = []
    // 根据时间轴缩放调整刻度密度
    const baseStep = duration <= 60 ? 2 : duration <= 180 ? 5 : 10
    const step = Math.max(1, Math.floor(baseStep / timelineScale))
    for (let i = 0; i <= duration; i += step) markers.push(i)
    return markers
  }

  // 处理时间轴点击
  const handleTimelineClick = (e) => {
    if (!timelineRef.current || resizingClip) return
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = Math.max(0, Math.min(percentage * duration, duration))
    onSeek(newTime)
  }

  // 处理播放头拖拽
  const handlePlayheadMouseDown = (e) => {
    e.stopPropagation()
    setIsDragging(true)
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const percentage = x / rect.width
        const newTime = Math.max(0, Math.min(percentage * duration, duration))
        onSeek(newTime)
      }
      
      if (resizingClip && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const percentage = x / rect.width
        const newTime = Math.max(0, Math.min(percentage * duration, duration))
        
        const { clip, track, edge, originalStart, originalEnd } = resizingClip
        
        if (edge === 'left') {
          const newStart = Math.min(newTime, originalEnd - 0.5)
          onUpdateClip?.(track.id, clip.id, { start: newStart, end: originalEnd })
        } else if (edge === 'right') {
          const newEnd = Math.max(newTime, originalStart + 0.5)
          onUpdateClip?.(track.id, clip.id, { start: originalStart, end: newEnd })
        }
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setResizingClip(null)
    }

    if (isDragging || resizingClip) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, resizingClip, duration, onSeek, onUpdateClip])

  // ============ 拖放处理 ============
  const handleDragOver = (e) => {
    e.preventDefault()
    // 根据拖动类型设置不同的 dropEffect
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json') || '{}')
      e.dataTransfer.dropEffect = data.type === 'clip' ? 'move' : 'copy'
      
      // 更新拖放预览位置
      if (timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const percentage = x / rect.width
        const dropTime = Math.max(0, Math.min(percentage * duration, duration))
        setDragPreview({
          time: dropTime,
          type: data.type,
          name: data.name || data.clip?.name || '资源'
        })
      }
    } catch {
      e.dataTransfer.dropEffect = 'copy'
    }
    setDragOver(true)
  }

  // 专门处理 clip 拖动的 dragOver
  const handleClipDragOver = (e, track = null) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = x / rect.width
      const dropTime = Math.max(0, Math.min(percentage * duration, duration))
      
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json') || '{}')
        if (data.type === 'clip') {
          const clipDuration = data.originalEnd - data.originalStart
          setDragPreview({
            time: dropTime,
            duration: clipDuration,
            type: 'clip',
            name: data.clip?.name || '片段'
          })
        }
      } catch {}
    }
    
    if (track) {
      setDropTarget(track.id)
    }
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
    setDragPreview(null)
    setDropTarget(null)
  }

  const handleDrop = (e, targetInfo = null) => {
    e.preventDefault()
    setDragOver(false)
    setDragPreview(null)
    setDropTarget(null)

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json') || '{}')
      if (data.type === 'clip') return
      if (!data.id) return

      if (!timelineRef.current) return
      const rect = timelineRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = x / rect.width
      const dropTime = Math.max(0, Math.min(percentage * duration, duration))

      if (targetInfo?.type === 'character_group') {
        onDropResource?.(data, dropTime, { characterId: targetInfo.characterId, autoAssign: true })
      } else {
        onDropResource?.(data, dropTime, targetInfo)
      }
    } catch (error) {
      console.error('拖放处理失败:', error)
    }
  }

  // ============ 片段操作 ============
  const handleClipClick = (e, clip, track) => {
    e.stopPropagation()
    onSelectClip(clip)
    onSelectTrack(track)
  }

  const handleClipResizeStart = (e, clip, track, edge) => {
    e.stopPropagation()
    e.preventDefault()
    setResizingClip({ clip, track, edge, originalStart: clip.start, originalEnd: clip.end })
  }

  const handleClipDragStart = (e, clip, track) => {
    e.stopPropagation()
    const dragData = { type: 'clip', clip, sourceTrackId: track.id, originalStart: clip.start, originalEnd: clip.end }
    e.dataTransfer.setData('application/json', JSON.stringify(dragData))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleClipDrop = (e, targetTrack) => {
    e.preventDefault()
    e.stopPropagation()
    setDragPreview(null)
    setDropTarget(null)

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json') || '{}')
      if (data.type !== 'clip') return

      if (!timelineRef.current) return
      const rect = timelineRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = x / rect.width
      const dropTime = Math.max(0, Math.min(percentage * duration, duration))

      const clipDuration = data.originalEnd - data.originalStart
      onUpdateClip?.(data.sourceTrackId, data.clip.id, { start: dropTime, end: dropTime + clipDuration })
    } catch (error) {
      console.error('片段移动失败:', error)
    }
  }

  // 右键菜单
  const handleContextMenu = (e, type, data) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, type, data })
  }

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  // ============ 渲染辅助函数 ============
  const getTrackIcon = (type) => {
    const icons = { scene: '🏞️', camera: '📷', character: '👤', prop: '📦', music: '🎵', motion: '🎭', expression: '😊' }
    return icons[type] || '📄'
  }

  const getClipStyle = (clip) => {
    const gap = 2 // 片段之间的间隙（像素）
    const gapPercent = (gap / timelineRef.current?.clientWidth || 1000) * 100
    const left = (clip.start / duration) * 100
    const width = ((clip.end - clip.start) / duration) * 100 - gapPercent
    return {
      left: `${left}%`,
      width: `${Math.max(0.5, width)}%`,
      marginRight: `${gapPercent}%`
    }
  }

  // 渲染轨道头部
  const renderTrackHeader = (track, isChild = false) => (
    <div
      key={`header-${track.id}`}
      className={`${styles.trackRow} ${isChild ? styles.childTrack : ''} ${selectedTrack?.id === track.id ? styles.selected : ''}`}
      onClick={() => onSelectTrack(track)}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, track)}
    >
      <div className={styles.trackHeader}>
        <span className={styles.trackIcon}>{getTrackIcon(track.type)}</span>
        <span className={styles.trackName}>{track.name}</span>
      </div>
    </div>
  )

  // 渲染轨道内容
  const renderTrackContent = (track) => {
    // 计算拖放预览位置
    const getPreviewStyle = () => {
      if (!dragPreview || dropTarget !== track.id) return null
      const left = (dragPreview.time / duration) * 100
      const width = dragPreview.duration
        ? ((dragPreview.duration / duration) * 100)
        : 5 // 默认宽度
      return {
        left: `${left}%`,
        width: `${Math.max(0.5, width)}%`
      }
    }

    const previewStyle = getPreviewStyle()

    return (
      <div
        key={`content-${track.id}`}
        className={`${styles.trackContentRow} ${selectedTrack?.id === track.id ? styles.selected : ''} ${dropTarget === track.id ? styles.dropTarget : ''}`}
        onClick={handleTimelineClick}
        onDragOver={(e) => handleClipDragOver(e, track)}
        onDrop={(e) => handleClipDrop(e, track)}
        onDragLeave={() => setDropTarget(null)}
      >
        {track.clips?.map(clip => (
          <div
            key={clip.id}
            className={`${styles.clip} ${selectedClip?.id === clip.id ? styles.selected : ''}`}
            style={getClipStyle(clip)}
            onClick={(e) => handleClipClick(e, clip, track)}
            onContextMenu={(e) => handleContextMenu(e, 'clip', { clip, track })}
            draggable
            onDragStart={(e) => handleClipDragStart(e, clip, track)}
          >
            <div className={styles.clipHandleLeft} onMouseDown={(e) => handleClipResizeStart(e, clip, track, 'left')} />
            <div className={styles.clipContent}>
              <span className={styles.clipIcon}>{getTrackIcon(track.type)}</span>
              <span className={styles.clipName}>{clip.name}</span>
              <span className={styles.clipDuration}>{(clip.end - clip.start).toFixed(1)}s</span>
            </div>
            <div className={styles.clipHandleRight} onMouseDown={(e) => handleClipResizeStart(e, clip, track, 'right')} />
          </div>
        ))}

        {/* 拖放预览 */}
        {previewStyle && (
          <div className={styles.dragPreview} style={previewStyle}>
            <span className={styles.dragPreviewName}>{dragPreview.name}</span>
            <span className={styles.dragPreviewTime}>{dragPreview.time.toFixed(1)}s</span>
          </div>
        )}
      </div>
    )
  }

  // 渲染人物分组
  const renderCharacterGroup = (group) => {
    const { character, tracks } = group
    return (
      <React.Fragment key={`char-group-${character.id}`}>
        <div
          className={`${styles.characterGroupHeader} ${selectedTrack?.targetId === character.id ? styles.selected : ''}`}
          onContextMenu={(e) => handleContextMenu(e, 'character', character)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, { type: 'character_group', characterId: character.id })}
        >
          <span className={styles.characterIcon}>👤</span>
          <span className={styles.characterName}>{character.name}</span>
          <span className={styles.characterHint}>拖放资源到此处</span>
        </div>
        {tracks.map(track => renderTrackHeader(track, true))}
      </React.Fragment>
    )
  }

  // 渲染人物分组的内容区域
  const renderCharacterGroupContent = (group) => {
    const { tracks } = group
    return (
      <React.Fragment key={`char-content-${group.characterId}`}>
        <div className={styles.characterGroupSpacer} />
        {tracks.map(track => renderTrackContent(track))}
      </React.Fragment>
    )
  }

  const trackGroups = getTrackGroups()

  return (
    <div className={styles.container}>
      {/* 工具栏 */}
      <div className={styles.toolbar}>
        <div className={styles.leftControls}>
          <div className={styles.playbackControls}>
            <button 
              className={`${styles.playBtn} ${isPlaying ? styles.playing : ''}`} 
              onClick={onPlay}
              title={isPlaying ? '暂停' : '播放'}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <button 
              className={styles.stopBtn} 
              onClick={onStop}
              title="停止"
            >
              ⏹️
            </button>
          </div>
          <span className={styles.timeDisplay}>{formatTime(currentTime)}</span>
        </div>
        
        {/* 3D预览 */}
        {renderEngine && (
          <Timeline3DPreview
            renderEngine={renderEngine}
            currentTime={currentTime}
            project={project}
            width={200}
            height={80}
          />
        )}
        
        <div className={styles.centerControls}>
          <button className={styles.toolBtn} onClick={() => onSeek(0)}>⏮️</button>
          <button className={styles.toolBtn} onClick={() => onSeek(Math.max(0, currentTime - 1))}>⏪</button>
          <button className={styles.toolBtn} onClick={() => onSeek(Math.min(duration, currentTime + 1))}>⏩</button>
        </div>
        <div className={styles.rightControls}>
          <span className={styles.scaleLabel}>缩放</span>
          <input type="range" min="0.5" max="3" step="0.1" value={timelineScale} onChange={(e) => onScaleChange(parseFloat(e.target.value))} className={styles.scaleSlider} />
        </div>
      </div>

      {/* 时间轴主体 */}
      <div className={styles.timelineBody}>
        {/* 左侧轨道列表 */}
        <div className={styles.trackList}>
          {/* 左侧时间标尺占位 */}
          <div className={styles.timeRulerPlaceholder} />
          {/* 轨道列表 */}
          <div className={styles.trackListContent}>
            {trackGroups.map(group => group.type === 'character_group' ? renderCharacterGroup(group) : renderTrackHeader(group.track))}
          </div>
        </div>

        {/* 右侧时间轴内容 */}
        <div className={styles.timelineContent}>
          {/* 时间标尺 */}
          <div className={styles.timeRuler}>
            {getTimeMarkers().map(time => (
              <div key={`ruler-${time}`} className={styles.timeMarker} style={{ left: `${(time / duration) * 100}%` }}>
                <div className={styles.markerLine} />
                <span className={styles.markerLabel}>{formatTime(time)}</span>
              </div>
            ))}
          </div>
          
          {/* 轨道内容区域 */}
          <div className={`${styles.tracksContainer} ${dragOver ? styles.dragOver : ''}`} ref={timelineRef} onClick={handleTimelineClick} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e)}>
            <div className={styles.tracksContent}>
              {/* 时间刻度网格 */}
              <div className={styles.timeGrid}>
                {getTimeMarkers().map(time => (
                  <div key={`grid-${time}`} className={styles.timeGridLine} style={{ left: `${(time / duration) * 100}%` }} />
                ))}
              </div>
              
              {trackGroups.map(group => group.type === 'character_group' ? renderCharacterGroupContent(group) : renderTrackContent(group.track))}
            </div>

            {/* 播放头 */}
            <div className={styles.playhead} style={{ left: `${(currentTime / duration) * 100}%` }} onMouseDown={handlePlayheadMouseDown}>
              <div className={styles.playheadLine} />
              <div className={styles.playheadHandle}>▲</div>
            </div>
          </div>
        </div>
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <div className={styles.contextMenu} style={{ left: contextMenu.x, top: contextMenu.y }}>
          {contextMenu.type === 'character' && (
            <button className={styles.contextMenuItem} onClick={() => { onDeleteCharacter?.(contextMenu.data.id); setContextMenu(null) }}>🗑️ 删除人物</button>
          )}
          {contextMenu.type === 'clip' && (
            <>
              <button className={styles.contextMenuItem} onClick={() => { onDuplicateClip?.(contextMenu.data.clip, contextMenu.data.track); setContextMenu(null) }}>📋 复制</button>
              <button className={styles.contextMenuItem} onClick={() => { onDeleteClip?.(contextMenu.data.clip.id, contextMenu.data.track.id); setContextMenu(null) }}>🗑️ 删除</button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
