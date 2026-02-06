import React, { useState, useEffect } from 'react'
import styles from './SettingsModal.module.css'

/**
 * 设置弹窗 - 项目设置、导出功能
 */
export function SettingsModal({ project, onClose, onExport }) {
  const [projectName, setProjectName] = useState(project?.name || '新项目')
  const [duration, setDuration] = useState(project?.duration || 60)
  const [showExportOptions, setShowExportOptions] = useState(false)

  // 保存设置
  const saveSettings = () => {
    // 更新项目名称和时长
    const projects = JSON.parse(localStorage.getItem('ar-director-projects') || '[]')
    const updatedProjects = projects.map(p =>
      p.id === project.id
        ? { ...p, name: projectName, duration, modifiedAt: new Date().toISOString() }
        : p
    )
    localStorage.setItem('ar-director-projects', JSON.stringify(updatedProjects))
    onClose()
  }

  // 导出项目为JSON文件
  const exportProject = () => {
    const exportData = {
      version: '1.0',
      type: 'mmd-project',
      createdAt: new Date().toISOString(),
      project: {
        ...project,
        name: projectName,
        duration
      }
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName.replace(/\s+/g, '_')}_project.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 导入项目
  const importProject = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        if (data.type === 'mmd-project' && data.project) {
          // 保存到localStorage
          const projects = JSON.parse(localStorage.getItem('ar-director-projects') || '[]')
          const importedProject = {
            ...data.project,
            id: `project_${Date.now()}`, // 新ID避免冲突
            importedAt: new Date().toISOString()
          }
          projects.push(importedProject)
          localStorage.setItem('ar-director-projects', JSON.stringify(projects))
          alert('项目导入成功！')
          window.location.reload()
        } else {
          alert('无效的项目文件')
        }
      } catch (error) {
        alert('文件解析失败')
      }
    }
    reader.readAsText(file)
  }

  // 导出GIF/视频
  const handleExportMedia = (type) => {
    onExport?.(type)
    setShowExportOptions(false)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>⚙️ 设置</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.content}>
          {/* 项目设置 */}
          <div className={styles.section}>
            <h3>📋 项目设置</h3>
            <div className={styles.formGroup}>
              <label>项目名称</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>总时长 (秒)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={10}
                max={300}
                className={styles.input}
              />
            </div>
          </div>

          {/* 导出选项 */}
          <div className={styles.section}>
            <h3>📤 导出</h3>
            <div className={styles.exportButtons}>
              <button className={styles.exportBtn} onClick={() => setShowExportOptions(!showExportOptions)}>
                🎬 导出媒体
              </button>
              <button className={styles.exportBtn} onClick={exportProject}>
                📦 导出项目文件
              </button>
            </div>

            {showExportOptions && (
              <div className={styles.exportOptions}>
                <button className={styles.mediaBtn} onClick={() => handleExportMedia('gif')}>
                  🎞️ 导出 GIF
                </button>
                <button className={styles.mediaBtn} onClick={() => handleExportMedia('video')}>
                  🎥 导出视频
                </button>
                <button className={styles.mediaBtn} onClick={() => handleExportMedia('zip')}>
                  🖼️ 导出帧序列 (ZIP)
                </button>
                <button className={styles.mediaBtn} onClick={() => handleExportMedia('project')}>
                  📦 导出完整项目 (ZIP)
                </button>
              </div>
            )}
          </div>

          {/* 导入选项 */}
          <div className={styles.section}>
            <h3>📥 导入</h3>
            <label className={styles.importBtn}>
              📂 导入项目文件
              <input
                type="file"
                accept=".json"
                onChange={importProject}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* 项目信息 */}
          <div className={styles.section}>
            <h3>📊 项目信息</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span>角色数量</span>
                <span>{project?.characters?.length || 0}</span>
              </div>
              <div className={styles.infoItem}>
                <span>场景数量</span>
                <span>{project?.scenes?.length || 0}</span>
              </div>
              <div className={styles.infoItem}>
                <span>轨道数量</span>
                <span>{project?.tracks?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>取消</button>
          <button className={styles.saveBtn} onClick={saveSettings}>保存设置</button>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
