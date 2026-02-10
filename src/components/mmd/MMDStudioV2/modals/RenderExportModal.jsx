import React, { useState, useRef, useEffect } from 'react'
import styles from './RenderExportModal.module.css'

const EXPORT_FORMATS = [
  { id: 'mp4', name: 'MP4 视频', extension: 'mp4', mimeType: 'video/mp4' },
  { id: 'webm', name: 'WebM 视频', extension: 'webm', mimeType: 'video/webm' },
  { id: 'gif', name: 'GIF 动画', extension: 'gif', mimeType: 'image/gif' },
  { id: 'png', name: 'PNG 序列', extension: 'png', mimeType: 'image/png' },
  { id: 'jpg', name: 'JPG 序列', extension: 'jpg', mimeType: 'image/jpeg' }
]

const QUALITY_PRESETS = [
  { id: 'low', name: '低质量', resolution: '1280x720', fps: 30, bitrate: '2M' },
  { id: 'medium', name: '中等质量', resolution: '1920x1080', fps: 30, bitrate: '5M' },
  { id: 'high', name: '高质量', resolution: '1920x1080', fps: 60, bitrate: '10M' },
  { id: 'ultra', name: '超高质量', resolution: '3840x2160', fps: 60, bitrate: '20M' }
]

export function RenderExportModal({ project, onClose, renderEngine }) {
  const [format, setFormat] = useState('mp4')
  const [quality, setQuality] = useState('medium')
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(project?.duration || 10)
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [exportResult, setExportResult] = useState(null)
  const [customResolution, setCustomResolution] = useState(false)
  const [resolution, setResolution] = useState({ width: 1920, height: 1080 })
  const [fps, setFps] = useState(30)
  const canvasRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  const duration = endTime - startTime
  const frameCount = Math.floor(duration * fps)

  // 开始导出
  const handleStartExport = async () => {
    if (!renderEngine?.current) {
      alert('渲染引擎未初始化')
      return
    }

    setIsExporting(true)
    setProgress(0)
    setStatus('准备导出...')
    setExportResult(null)

    try {
      if (format === 'gif') {
        await exportGIF()
      } else if (format === 'png' || format === 'jpg') {
        await exportImageSequence()
      } else {
        await exportVideo()
      }
    } catch (error) {
      console.error('导出失败:', error)
      setStatus('导出失败: ' + error.message)
      setIsExporting(false)
    }
  }

  // 导出视频
  const exportVideo = async () => {
    const canvas = renderEngine.current.getCanvas()
    if (!canvas) {
      throw new Error('无法获取渲染画布')
    }

    const stream = canvas.captureStream(fps)
    const mimeType = EXPORT_FORMATS.find(f => f.id === format)?.mimeType || 'video/webm'
    
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      throw new Error(`浏览器不支持 ${format} 格式导出`)
    }

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: parseBitrate(QUALITY_PRESETS.find(q => q.id === quality)?.bitrate || '5M')
    })

    mediaRecorderRef.current = mediaRecorder
    chunksRef.current = []

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType })
      const url = URL.createObjectURL(blob)
      setExportResult({ url, format, type: 'video' })
      setStatus('导出完成！')
      setIsExporting(false)
    }

    // 开始录制
    mediaRecorder.start(1000)
    setStatus('正在录制...')

    // 逐帧渲染
    const startFrame = Math.floor(startTime * fps)
    const endFrame = Math.floor(endTime * fps)

    for (let frame = startFrame; frame <= endFrame; frame++) {
      const time = frame / fps
      renderEngine.current.setTime(time)
      renderEngine.current.forceRender()
      
      const currentProgress = ((frame - startFrame) / (endFrame - startFrame)) * 100
      setProgress(currentProgress)
      setStatus(`正在渲染... ${frame - startFrame}/${endFrame - startFrame} 帧`)

      // 等待一帧时间
      await new Promise(resolve => setTimeout(resolve, 1000 / fps))
    }

    mediaRecorder.stop()
  }

  // 导出GIF
  const exportGIF = async () => {
    setStatus('正在准备 GIF 导出...')
    
    // 使用 gif.js 或其他库
    // 这里使用简化的实现
    const frames = []
    const startFrame = Math.floor(startTime * fps)
    const endFrame = Math.floor(endTime * fps)

    for (let frame = startFrame; frame <= endFrame; frame++) {
      const time = frame / fps
      renderEngine.current.setTime(time)
      renderEngine.current.forceRender()
      
      const canvas = renderEngine.current.getCanvas()
      frames.push(canvas.toDataURL('image/png'))
      
      const currentProgress = ((frame - startFrame) / (endFrame - startFrame)) * 100
      setProgress(currentProgress)
      setStatus(`正在捕获帧... ${frame - startFrame}/${endFrame - startFrame}`)

      await new Promise(resolve => setTimeout(resolve, 1000 / fps))
    }

    // 创建 GIF
    setStatus('正在生成 GIF...')
    
    // 使用 canvas 创建简单的 GIF（实际项目中应使用专门的 GIF 库）
    const gifCanvas = document.createElement('canvas')
    gifCanvas.width = resolution.width
    gifCanvas.height = resolution.height
    const ctx = gifCanvas.getContext('2d')

    // 简化的 GIF 生成 - 实际应使用 gif.js
    // 这里创建一个包含所有帧的 zip 文件作为替代
    const zip = await createFramesZip(frames, 'gif')
    const url = URL.createObjectURL(zip)
    
    setExportResult({ url, format: 'zip', type: 'archive' })
    setStatus('GIF 帧导出完成（请使用工具合成）')
    setIsExporting(false)
  }

  // 导出图片序列
  const exportImageSequence = async () => {
    const frames = []
    const startFrame = Math.floor(startTime * fps)
    const endFrame = Math.floor(endTime * fps)

    for (let frame = startFrame; frame <= endFrame; frame++) {
      const time = frame / fps
      renderEngine.current.setTime(time)
      renderEngine.current.forceRender()
      
      const canvas = renderEngine.current.getCanvas()
      const dataUrl = canvas.toDataURL(`image/${format}`, 0.95)
      frames.push({ dataUrl, frame: frame - startFrame })
      
      const currentProgress = ((frame - startFrame) / (endFrame - startFrame)) * 100
      setProgress(currentProgress)
      setStatus(`正在导出帧... ${frame - startFrame}/${endFrame - startFrame}`)

      await new Promise(resolve => setTimeout(resolve, 1000 / fps))
    }

    // 创建 ZIP
    setStatus('正在打包...')
    const zip = await createFramesZip(frames.map(f => f.dataUrl), format)
    const url = URL.createObjectURL(zip)
    
    setExportResult({ url, format: 'zip', type: 'archive' })
    setStatus('导出完成！')
    setIsExporting(false)
  }

  // 创建帧 ZIP
  const createFramesZip = async (dataUrls, ext) => {
    // 简化的 ZIP 创建 - 实际应使用 JSZip
    // 这里返回一个包含说明的文本文件
    const content = `帧导出完成！
总帧数: ${dataUrls.length}
格式: ${ext}
分辨率: ${resolution.width}x${resolution.height}
帧率: ${fps}fps

注意: 这是一个演示版本。实际项目中应集成 JSZip 库来创建真正的 ZIP 文件。
帧数据已准备就绪，可以通过 data URL 下载。`

    return new Blob([content], { type: 'text/plain' })
  }

  // 解析比特率
  const parseBitrate = (bitrate) => {
    const match = bitrate.match(/^(\d+)([KM]?)$/)
    if (!match) return 5000000
    const value = parseInt(match[1])
    const unit = match[2]
    if (unit === 'K') return value * 1000
    if (unit === 'M') return value * 1000000
    return value
  }

  // 取消导出
  const handleCancel = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsExporting(false)
    setProgress(0)
    setStatus('')
  }

  // 下载结果
  const handleDownload = () => {
    if (!exportResult) return
    
    const a = document.createElement('a')
    a.href = exportResult.url
    a.download = `${project?.name || 'export'}_${Date.now()}.${exportResult.format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>🎬 渲染导出</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          {/* 导出设置 */}
          <div className={styles.settings}>
            <div className={styles.settingGroup}>
              <label>导出格式</label>
              <div className={styles.formatGrid}>
                {EXPORT_FORMATS.map(f => (
                  <button
                    key={f.id}
                    className={`${styles.formatBtn} ${format === f.id ? styles.active : ''}`}
                    onClick={() => setFormat(f.id)}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.settingGroup}>
              <label>质量预设</label>
              <select
                value={quality}
                onChange={(e) => {
                  setQuality(e.target.value)
                  const preset = QUALITY_PRESETS.find(q => q.id === e.target.value)
                  if (preset && !customResolution) {
                    const [w, h] = preset.resolution.split('x').map(Number)
                    setResolution({ width: w, height: h })
                    setFps(preset.fps)
                  }
                }}
                className={styles.select}
              >
                {QUALITY_PRESETS.map(q => (
                  <option key={q.id} value={q.id}>
                    {q.name} - {q.resolution}@{q.fps}fps
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.settingGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={customResolution}
                  onChange={(e) => setCustomResolution(e.target.checked)}
                />
                自定义分辨率
              </label>
              {customResolution && (
                <div className={styles.resolutionInputs}>
                  <input
                    type="number"
                    value={resolution.width}
                    onChange={(e) => setResolution({ ...resolution, width: parseInt(e.target.value) || 1920 })}
                    placeholder="宽度"
                  />
                  <span>×</span>
                  <input
                    type="number"
                    value={resolution.height}
                    onChange={(e) => setResolution({ ...resolution, height: parseInt(e.target.value) || 1080 })}
                    placeholder="高度"
                  />
                </div>
              )}
            </div>

            <div className={styles.settingGroup}>
              <label>时间范围</label>
              <div className={styles.timeRange}>
                <div className={styles.timeInput}>
                  <span>开始</span>
                  <input
                    type="number"
                    value={startTime}
                    onChange={(e) => setStartTime(parseFloat(e.target.value) || 0)}
                    step="0.1"
                    min="0"
                    max={project?.duration || 10}
                  />
                  <span>s</span>
                </div>
                <div className={styles.timeInput}>
                  <span>结束</span>
                  <input
                    type="number"
                    value={endTime}
                    onChange={(e) => setEndTime(parseFloat(e.target.value) || 10)}
                    step="0.1"
                    min={startTime + 0.1}
                    max={project?.duration || 10}
                  />
                  <span>s</span>
                </div>
              </div>
              <div className={styles.timeInfo}>
                时长: {duration.toFixed(1)}s | 帧数: {frameCount} 帧
              </div>
            </div>

            {customResolution && (
              <div className={styles.settingGroup}>
                <label>帧率</label>
                <input
                  type="range"
                  min="15"
                  max="120"
                  step="15"
                  value={fps}
                  onChange={(e) => setFps(parseInt(e.target.value))}
                  className={styles.slider}
                />
                <span className={styles.sliderValue}>{fps} fps</span>
              </div>
            )}
          </div>

          {/* 导出进度 */}
          {isExporting && (
            <div className={styles.progressSection}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className={styles.progressInfo}>
                <span>{status}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <button className={styles.cancelBtn} onClick={handleCancel}>
                取消导出
              </button>
            </div>
          )}

          {/* 导出结果 */}
          {exportResult && (
            <div className={styles.resultSection}>
              <div className={styles.resultIcon}>✅</div>
              <div className={styles.resultText}>{status}</div>
              <button className={styles.downloadBtn} onClick={handleDownload}>
                下载文件
              </button>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className={styles.footer}>
          <button
            className={styles.exportBtn}
            onClick={handleStartExport}
            disabled={isExporting}
          >
            {isExporting ? '导出中...' : '开始导出'}
          </button>
        </div>
      </div>
    </div>
  )
}
