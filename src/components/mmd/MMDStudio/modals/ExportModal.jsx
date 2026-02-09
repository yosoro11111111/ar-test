import React, { useState } from 'react'
import styles from './Modal.module.css'

export function ExportModal({ project, onClose }) {
  const [format, setFormat] = useState('mp4')
  const [quality, setQuality] = useState('high')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    // 模拟导出过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsExporting(false)
    alert('导出完成！')
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>导出项目</h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <label className={styles.label}>导出格式</label>
            <div className={styles.options}>
              <label className={styles.radio}>
                <input
                  type="radio"
                  value="mp4"
                  checked={format === 'mp4'}
                  onChange={(e) => setFormat(e.target.value)}
                />
                <span>MP4视频</span>
              </label>
              <label className={styles.radio}>
                <input
                  type="radio"
                  value="gif"
                  checked={format === 'gif'}
                  onChange={(e) => setFormat(e.target.value)}
                />
                <span>GIF动图</span>
              </label>
              <label className={styles.radio}>
                <input
                  type="radio"
                  value="frames"
                  checked={format === 'frames'}
                  onChange={(e) => setFormat(e.target.value)}
                />
                <span>帧序列</span>
              </label>
            </div>
          </div>

          <div className={styles.section}>
            <label className={styles.label}>导出质量</label>
            <select
              className={styles.select}
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
            >
              <option value="low">低 (720p)</option>
              <option value="medium">中 (1080p)</option>
              <option value="high">高 (1440p)</option>
              <option value="ultra">超清 (4K)</option>
            </select>
          </div>

          <div className={styles.info}>
            <div>分辨率: {project.settings.resolution.width} × {project.settings.resolution.height}</div>
            <div>帧率: {project.settings.fps} FPS</div>
            <div>时长: {project.duration} 秒</div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>取消</button>
          <button
            className={styles.confirmBtn}
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? '导出中...' : '开始导出'}
          </button>
        </div>
      </div>
    </div>
  )
}
