import React from 'react'
import styles from './TimelinePanel.module.css'

export function TimelinePanel({
  project,
  currentTime,
  isPlaying,
  timelineScale,
  onPlay,
  onSeek,
  selectedTrack,
  onSelectTrack
}) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const frames = Math.floor((seconds % 1) * 30)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
  }

  return (
    <div className={styles.container}>
      {/* 工具栏 */}
      <div className={styles.toolbar}>
        <div className={styles.playbackControls}>
          <button className={styles.playBtn} onClick={onPlay}>
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <button className={styles.controlBtn}>⏮️</button>
          <button className={styles.controlBtn}>⏭️</button>
        </div>

        <div className={styles.timeDisplay}>
          {formatTime(currentTime)} / {formatTime(project.duration)}
        </div>

        <div className={styles.zoomControls}>
          <button className={styles.zoomBtn}>-</button>
          <span>{Math.round(timelineScale * 100)}%</span>
          <button className={styles.zoomBtn}>+</button>
        </div>
      </div>

      {/* 时间轴内容 */}
      <div className={styles.timelineContent}>
        {/* 时间标尺 */}
        <div className={styles.timeRuler}>
          {Array.from({ length: Math.ceil(project.duration / 5) + 1 }, (_, i) => (
            <div
              key={i}
              className={styles.timeMarker}
              style={{ left: `${(i * 5 / project.duration) * 100}%` }}
            >
              {i * 5}s
            </div>
          ))}
          {/* 播放头 */}
          <div
            className={styles.playhead}
            style={{ left: `${(currentTime / project.duration) * 100}%` }}
          />
        </div>

        {/* 轨道列表 */}
        <div className={styles.tracksList}>
          {project.tracks.length === 0 ? (
            <div className={styles.emptyTracks}>
              <div className={styles.emptyIcon}>🎬</div>
              <div>暂无轨道</div>
              <div className={styles.emptySubtext}>添加角色后将自动创建动画轨道</div>
            </div>
          ) : (
            project.tracks.map(track => (
              <div
                key={track.id}
                className={`${styles.track} ${selectedTrack?.id === track.id ? styles.selected : ''}`}
                onClick={() => onSelectTrack(track)}
              >
                <div className={styles.trackHeader}>
                  <span className={styles.trackIcon}>
                    {track.type === 'character' && '👤'}
                    {track.type === 'prop' && '📦'}
                    {track.type === 'camera' && '📷'}
                    {track.type === 'effect' && '✨'}
                  </span>
                  <span className={styles.trackName}>{track.name}</span>
                  <div className={styles.trackControls}>
                    <button className={styles.trackBtn}>
                      {track.muted ? '🔇' : '🔊'}
                    </button>
                  </div>
                </div>
                <div className={styles.trackTimeline}>
                  {track.clips.map(clip => (
                    <div
                      key={clip.id}
                      className={styles.clip}
                      style={{
                        left: `${(clip.start / project.duration) * 100}%`,
                        width: `${((clip.end - clip.start) / project.duration) * 100}%`
                      }}
                    >
                      {clip.name}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
