import React, { useState } from 'react'
import styles from './Modal.module.css'

export function SettingsModal({ project, onClose, onUpdateProject }) {
  const [settings, setSettings] = useState({
    name: project.name,
    duration: project.duration,
    fps: project.settings.fps,
    width: project.settings.resolution.width,
    height: project.settings.resolution.height
  })

  const handleSave = () => {
    onUpdateProject({
      name: settings.name,
      duration: parseInt(settings.duration),
      settings: {
        ...project.settings,
        fps: parseInt(settings.fps),
        resolution: {
          width: parseInt(settings.width),
          height: parseInt(settings.height)
        }
      }
    })
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>项目设置</h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <label className={styles.label}>项目名称</label>
            <input
              className={styles.input}
              type="text"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
            />
          </div>

          <div className={styles.section}>
            <label className={styles.label}>时长 (秒)</label>
            <input
              className={styles.input}
              type="number"
              min="1"
              max="600"
              value={settings.duration}
              onChange={(e) => setSettings({ ...settings, duration: e.target.value })}
            />
          </div>

          <div className={styles.section}>
            <label className={styles.label}>帧率 (FPS)</label>
            <select
              className={styles.select}
              value={settings.fps}
              onChange={(e) => setSettings({ ...settings, fps: e.target.value })}
            >
              <option value="24">24 FPS (电影)</option>
              <option value="30">30 FPS (标准)</option>
              <option value="60">60 FPS (流畅)</option>
            </select>
          </div>

          <div className={styles.section}>
            <label className={styles.label}>分辨率</label>
            <div className={styles.resolutionInputs}>
              <input
                className={styles.input}
                type="number"
                value={settings.width}
                onChange={(e) => setSettings({ ...settings, width: e.target.value })}
                placeholder="宽度"
              />
              <span>×</span>
              <input
                className={styles.input}
                type="number"
                value={settings.height}
                onChange={(e) => setSettings({ ...settings, height: e.target.value })}
                placeholder="高度"
              />
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>取消</button>
          <button className={styles.confirmBtn} onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  )
}
