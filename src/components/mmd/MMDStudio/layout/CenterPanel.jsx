import React from 'react'
import styles from './CenterPanel.module.css'

/**
 * 中央面板 - 3D预览区
 */
export function CenterPanel({
  canvasRef,
  project,
  currentTime,
  isPlaying,
  onTogglePlay,
  onTimeChange
}) {
  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }

  return (
    <div className={styles.container}>
      {/* 工具栏 */}
      <div className={styles.toolbar}>
        <div className={styles.toolGroup}>
          <button className={styles.toolButton} title="选择">🔍</button>
          <button className={styles.toolButton} title="移动">↔️</button>
          <button className={styles.toolButton} title="旋转">🔄</button>
          <button className={styles.toolButton} title="缩放">🔍</button>
        </div>
        <div className={styles.toolGroup}>
          <button className={styles.toolButton} title="摄像机">📹</button>
        </div>
        <div className={styles.toolGroup}>
          <button className={styles.toolButton} title="网格">⬜</button>
          <button className={styles.toolButton} title="辅助线">➕</button>
        </div>
      </div>

      {/* 3D画布 */}
      <div className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
        />
        
        {/* 覆盖信息 */}
        <div className={styles.overlay}>
          <div className={styles.coordinates}>
            坐标: 0, 0, 0
          </div>
          <div className={styles.fps}>
            FPS: 60
          </div>
        </div>
      </div>

      {/* 播放控制 */}
      <div className={styles.playbackControls}>
        <button onClick={() => onTimeChange(0)}>⏮</button>
        <button onClick={() => onTimeChange(Math.max(0, currentTime - 1))}>⏪</button>
        <button onClick={onTogglePlay} className={styles.playButton}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button onClick={() => onTimeChange(Math.min(project?.canvas?.duration || 120, currentTime + 1))}>⏩</button>
        <button onClick={() => onTimeChange(project?.canvas?.duration || 120)}>⏭</button>
        
        <div className={styles.timeDisplay}>
          {formatTime(currentTime)} / {formatTime(project?.canvas?.duration || 120)}
        </div>
      </div>
    </div>
  )
}
