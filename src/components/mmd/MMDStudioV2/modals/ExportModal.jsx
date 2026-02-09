import React, { useState, useEffect, useRef } from 'react'
import styles from './Modal.module.css'

/**
 * 导出弹窗
 *
 * 功能：
 * - 选择导出格式（MP4/WebM/PNG序列/GIF）
 * - 设置导出参数（质量/分辨率/帧率/码率）
 * - 选择导出范围（全部/片段）
 * - 显示导出进度（带详细日志）
 * - 后台渲染支持
 */
export function ExportModal({ project, onClose, renderEngine }) {
  const [format, setFormat] = useState('mp4')
  const [quality, setQuality] = useState('high')
  const [resolution, setResolution] = useState('1080p')
  const [fps, setFps] = useState(60)
  const [bitrate, setBitrate] = useState('10M')
  const [exportRange, setExportRange] = useState('full') // 'full' | 'selection'
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(project?.duration || 120)
  
  // 导出状态
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [totalFrames, setTotalFrames] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState(0)
  const [logs, setLogs] = useState([])
  const [exportStatus, setExportStatus] = useState('') // 'preparing' | 'rendering' | 'encoding' | 'completed'
  
  const logsRef = useRef(null)
  const exportStartTimeRef = useRef(null)

  const formats = [
    { id: 'mp4', name: 'MP4视频', icon: '🎬', desc: 'H.264编码，兼容性最好' },
    { id: 'webm', name: 'WebM视频', icon: '🌐', desc: 'VP9编码，适合网页播放' },
    { id: 'png', name: 'PNG序列', icon: '🖼️', desc: '无损图片序列，适合后期' },
    { id: 'gif', name: 'GIF动图', icon: '🎞️', desc: '适合简单动画预览' }
  ]

  const qualities = [
    { id: 'low', name: '低质量', desc: '文件小，适合预览', bitrate: '2M' },
    { id: 'medium', name: '中等质量', desc: '平衡质量与大小', bitrate: '5M' },
    { id: 'high', name: '高质量', desc: '最佳画质', bitrate: '10M' },
    { id: 'ultra', name: '超高质量', desc: '专业级渲染', bitrate: '20M' }
  ]

  const resolutions = [
    { id: '720p', name: '1280 × 720', desc: 'HD', width: 1280, height: 720 },
    { id: '1080p', name: '1920 × 1080', desc: 'Full HD', width: 1920, height: 1080 },
    { id: '1440p', name: '2560 × 1440', desc: '2K', width: 2560, height: 1440 },
    { id: '2160p', name: '3840 × 2160', desc: '4K', width: 3840, height: 2160 }
  ]

  const bitrates = [
    { id: '2M', name: '2 Mbps', desc: '适合预览' },
    { id: '5M', name: '5 Mbps', desc: '标准质量' },
    { id: '10M', name: '10 Mbps', desc: '高质量' },
    { id: '20M', name: '20 Mbps', desc: '超高质量' },
    { id: '50M', name: '50 Mbps', desc: '专业级' }
  ]

  // 自动滚动日志到底部
  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight
    }
  }, [logs])

  // 添加日志
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { time: timestamp, message, type }])
  }

  // 计算预计文件大小
  const getEstimatedFileSize = () => {
    const res = resolutions.find(r => r.id === resolution)
    const duration = exportRange === 'full' 
      ? (project?.duration || 120) 
      : (endTime - startTime)
    const bitrateValue = parseInt(bitrate) * 1000000 // bps
    const bytes = (bitrateValue * duration) / 8
    const mb = bytes / 1024 / 1024
    
    if (mb < 1024) {
      return `~${mb.toFixed(0)} MB`
    } else {
      return `~${(mb / 1024).toFixed(1)} GB`
    }
  }

  // 计算预计时间
  const getEstimatedTime = () => {
    const duration = exportRange === 'full' 
      ? (project?.duration || 120) 
      : (endTime - startTime)
    const totalFrames = duration * fps
    // 假设每帧渲染时间 100ms（实际应该根据复杂度动态计算）
    const estimatedSeconds = (totalFrames * 0.1) / 60 // 分钟
    
    if (estimatedSeconds < 1) {
      return '< 1 分钟'
    } else if (estimatedSeconds < 60) {
      return `~${Math.round(estimatedSeconds)} 分钟`
    } else {
      return `~${(estimatedSeconds / 60).toFixed(1)} 小时`
    }
  }

  // 开始导出
  const handleExport = async () => {
    setIsExporting(true)
    setProgress(0)
    setExportStatus('preparing')
    setLogs([])
    exportStartTimeRef.current = Date.now()

    const duration = exportRange === 'full' 
      ? (project?.duration || 120) 
      : (endTime - startTime)
    const total = Math.floor(duration * fps)
    setTotalFrames(total)
    setCurrentFrame(0)

    addLog('开始准备导出...', 'info')
    addLog(`格式: ${formats.find(f => f.id === format)?.name}`, 'info')
    addLog(`分辨率: ${resolutions.find(r => r.id === resolution)?.name}`, 'info')
    addLog(`帧率: ${fps} FPS`, 'info')
    addLog(`导出范围: ${startTime.toFixed(1)}s - ${endTime.toFixed(1)}s`, 'info')
    addLog(`总帧数: ${total}`, 'info')

    // 模拟导出过程
    setTimeout(() => {
      setExportStatus('rendering')
      addLog('开始渲染...', 'success')
      simulateExport(total)
    }, 500)
  }

  // 模拟导出进度
  const simulateExport = (total) => {
    let frame = 0
    const batchSize = 5 // 每批处理5帧

    const processBatch = () => {
      if (frame >= total) {
        // 导出完成
        setExportStatus('completed')
        setProgress(100)
        addLog('导出完成！', 'success')
        return
      }

      // 处理一批帧
      for (let i = 0; i < batchSize && frame < total; i++) {
        frame++
      }

      const currentProgress = Math.round((frame / total) * 100)
      setProgress(currentProgress)
      setCurrentFrame(frame)

      // 更新时间和估计
      const elapsed = (Date.now() - exportStartTimeRef.current) / 1000
      setElapsedTime(elapsed)
      
      if (frame > 0) {
        const fps_rate = frame / elapsed
        const remaining = (total - frame) / fps_rate
        setEstimatedTime(remaining)
      }

      // 添加日志（每10%添加一次）
      if (currentProgress % 10 === 0 && currentProgress > 0) {
        addLog(`渲染进度: ${currentProgress}% (${frame}/${total} 帧)`, 'info')
      }

      // 继续下一批
      requestAnimationFrame(processBatch)
    }

    processBatch()
  }

  // 取消导出
  const handleCancel = () => {
    if (isExporting) {
      if (confirm('确定要取消导出吗？')) {
        addLog('导出已取消', 'warning')
        setIsExporting(false)
        onClose()
      }
    } else {
      onClose()
    }
  }

  // 格式化时间
  const formatDuration = (seconds) => {
    if (seconds < 60) {
      return `${Math.round(seconds)}秒`
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}分${Math.round(seconds % 60)}秒`
    } else {
      const hours = Math.floor(seconds / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      return `${hours}小时${mins}分`
    }
  }

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={`${styles.modal} ${isExporting ? styles.large : ''}`} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isExporting ? '正在导出...' : '导出项目'}
          </h2>
          <button className={styles.closeBtn} onClick={handleCancel} disabled={isExporting && exportStatus !== 'completed'}>×</button>
        </div>

        <div className={styles.content}>
          {isExporting ? (
            <div className={styles.exportingContainer}>
              {/* 进度概览 */}
              <div className={styles.exportOverview}>
                <div className={styles.exportStatusIcon}>
                  {exportStatus === 'preparing' && '⚙️'}
                  {exportStatus === 'rendering' && '🎬'}
                  {exportStatus === 'encoding' && '🔄'}
                  {exportStatus === 'completed' && '✅'}
                </div>
                <div className={styles.exportStatusText}>
                  {exportStatus === 'preparing' && '准备中...'}
                  {exportStatus === 'rendering' && '正在渲染...'}
                  {exportStatus === 'encoding' && '正在编码...'}
                  {exportStatus === 'completed' && '导出完成！'}
                </div>
              </div>

              {/* 进度条 */}
              <div className={styles.progressSection}>
                <div className={styles.progressBarLarge}>
                  <div 
                    className={styles.progressFillLarge} 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className={styles.progressInfo}>
                  <span className={styles.progressPercent}>{progress}%</span>
                  <span className={styles.progressFrames}>
                    {currentFrame} / {totalFrames} 帧
                  </span>
                </div>
              </div>

              {/* 时间统计 */}
              <div className={styles.timeStats}>
                <div className={styles.timeStat}>
                  <span className={styles.timeLabel}>已用时间</span>
                  <span className={styles.timeValue}>{formatDuration(elapsedTime)}</span>
                </div>
                <div className={styles.timeStat}>
                  <span className={styles.timeLabel}>预计剩余</span>
                  <span className={styles.timeValue}>
                    {estimatedTime > 0 ? formatDuration(estimatedTime) : '计算中...'}
                  </span>
                </div>
                <div className={styles.timeStat}>
                  <span className={styles.timeLabel}>渲染速度</span>
                  <span className={styles.timeValue}>
                    {elapsedTime > 0 ? (currentFrame / elapsedTime).toFixed(1) : '0'} FPS
                  </span>
                </div>
              </div>

              {/* 日志输出 */}
              <div className={styles.logsSection}>
                <div className={styles.logsHeader}>导出日志</div>
                <div className={styles.logsContainer} ref={logsRef}>
                  {logs.map((log, index) => (
                    <div key={index} className={`${styles.logLine} ${styles[log.type]}`}>
                      <span className={styles.logTime}>[{log.time}]</span>
                      <span className={styles.logMessage}>{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 完成按钮 */}
              {exportStatus === 'completed' && (
                <div className={styles.completedActions}>
                  <button className={styles.btnSecondary} onClick={onClose}>
                    关闭
                  </button>
                  <button className={styles.btnPrimary} onClick={() => alert('打开文件位置')}>
                    打开文件位置
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* 导出格式 */}
              <div className={styles.section}>
                <label className={styles.sectionLabel}>导出格式</label>
                <div className={styles.formatGrid}>
                  {formats.map(f => (
                    <button
                      key={f.id}
                      className={`${styles.formatCard} ${format === f.id ? styles.selected : ''}`}
                      onClick={() => setFormat(f.id)}
                    >
                      <span className={styles.formatIcon}>{f.icon}</span>
                      <span className={styles.formatName}>{f.name}</span>
                      <span className={styles.formatDesc}>{f.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 导出质量 */}
              <div className={styles.section}>
                <label className={styles.sectionLabel}>导出质量</label>
                <div className={styles.qualityList}>
                  {qualities.map(q => (
                    <button
                      key={q.id}
                      className={`${styles.qualityItem} ${quality === q.id ? styles.selected : ''}`}
                      onClick={() => {
                        setQuality(q.id)
                        setBitrate(q.bitrate)
                      }}
                    >
                      <span className={styles.qualityName}>{q.name}</span>
                      <span className={styles.qualityDesc}>{q.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 分辨率 */}
              <div className={styles.section}>
                <label className={styles.sectionLabel}>分辨率</label>
                <select
                  className={styles.select}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                >
                  {resolutions.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.desc})
                    </option>
                  ))}
                </select>
              </div>

              {/* 帧率 */}
              <div className={styles.section}>
                <label className={styles.sectionLabel}>帧率</label>
                <div className={styles.fpsOptions}>
                  {[30, 60].map(f => (
                    <button
                      key={f}
                      className={`${styles.fpsBtn} ${fps === f ? styles.selected : ''}`}
                      onClick={() => setFps(f)}
                    >
                      {f} FPS
                    </button>
                  ))}
                </div>
              </div>

              {/* 码率（仅视频格式） */}
              {format !== 'png' && format !== 'gif' && (
                <div className={styles.section}>
                  <label className={styles.sectionLabel}>视频码率</label>
                  <select
                    className={styles.select}
                    value={bitrate}
                    onChange={(e) => setBitrate(e.target.value)}
                  >
                    {bitrates.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} - {b.desc}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 导出范围 */}
              <div className={styles.section}>
                <label className={styles.sectionLabel}>导出范围</label>
                <div className={styles.rangeOptions}>
                  <button
                    className={`${styles.rangeBtn} ${exportRange === 'full' ? styles.selected : ''}`}
                    onClick={() => setExportRange('full')}
                  >
                    全部 ({project?.duration || 120}秒)
                  </button>
                  <button
                    className={`${styles.rangeBtn} ${exportRange === 'selection' ? styles.selected : ''}`}
                    onClick={() => setExportRange('selection')}
                  >
                    自定义范围
                  </button>
                </div>
                
                {exportRange === 'selection' && (
                  <div className={styles.rangeInputs}>
                    <div className={styles.rangeInput}>
                      <label>开始</label>
                      <input
                        type="number"
                        value={startTime}
                        onChange={(e) => setStartTime(Math.max(0, parseFloat(e.target.value) || 0))}
                        min={0}
                        max={endTime}
                        step={0.1}
                      />
                      <span>秒</span>
                    </div>
                    <div className={styles.rangeSeparator}>~</div>
                    <div className={styles.rangeInput}>
                      <label>结束</label>
                      <input
                        type="number"
                        value={endTime}
                        onChange={(e) => setEndTime(Math.min(project?.duration || 120, parseFloat(e.target.value) || 0))}
                        min={startTime}
                        max={project?.duration || 120}
                        step={0.1}
                      />
                      <span>秒</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 导出信息 */}
              <div className={styles.infoBox}>
                <div className={styles.infoRow}>
                  <span>预计文件大小:</span>
                  <span className={styles.infoValue}>{getEstimatedFileSize()}</span>
                </div>
                <div className={styles.infoRow}>
                  <span>预计导出时间:</span>
                  <span className={styles.infoValue}>{getEstimatedTime()}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {!isExporting && (
          <div className={styles.footer}>
            <button className={styles.btnSecondary} onClick={handleCancel}>
              取消
            </button>
            <button
              className={styles.btnPrimary}
              onClick={handleExport}
            >
              开始导出
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
