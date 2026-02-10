import React, { useRef, useEffect, useState } from 'react'
import styles from './AudioWaveform.module.css'

export function AudioWaveform({
  waveform,
  duration,
  currentTime,
  startTime = 0,
  endTime,
  onSeek,
  onClipChange,
  isPlaying,
  trackId
}) {
  const canvasRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragTarget, setDragTarget] = useState(null) // 'start', 'end', 'playhead'
  const [clipStart, setClipStart] = useState(startTime)
  const [clipEnd, setClipEnd] = useState(endTime || duration)

  const totalDuration = endTime || duration

  // 绘制波形
  useEffect(() => {
    if (!canvasRef.current || !waveform) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    // 清空画布
    ctx.fillStyle = '#1a1a25'
    ctx.fillRect(0, 0, width, height)

    if (waveform.length === 0) return

    const barWidth = width / waveform.length
    const centerY = height / 2

    // 绘制波形
    ctx.fillStyle = '#667eea'
    waveform.forEach((sample, i) => {
      const x = i * barWidth
      const barHeight = (sample.max - sample.min) * height * 0.8
      const y = centerY - barHeight / 2

      ctx.fillRect(x, y, barWidth - 1, barHeight)
    })

    // 绘制剪辑区域背景
    const startX = (clipStart / totalDuration) * width
    const endX = (clipEnd / totalDuration) * width

    // 左侧暗区
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, startX, height)

    // 右侧暗区
    ctx.fillRect(endX, 0, width - endX, height)

    // 绘制剪辑边界线
    ctx.strokeStyle = '#4ade80'
    ctx.lineWidth = 2

    // 开始线
    ctx.beginPath()
    ctx.moveTo(startX, 0)
    ctx.lineTo(startX, height)
    ctx.stroke()

    // 结束线
    ctx.beginPath()
    ctx.moveTo(endX, 0)
    ctx.lineTo(endX, height)
    ctx.stroke()

    // 绘制播放头
    const playheadX = (currentTime / totalDuration) * width
    ctx.strokeStyle = '#ff6464'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(playheadX, 0)
    ctx.lineTo(playheadX, height)
    ctx.stroke()

    // 播放头三角形
    ctx.fillStyle = '#ff6464'
    ctx.beginPath()
    ctx.moveTo(playheadX - 6, 0)
    ctx.lineTo(playheadX + 6, 0)
    ctx.lineTo(playheadX, 8)
    ctx.closePath()
    ctx.fill()

  }, [waveform, currentTime, clipStart, clipEnd, totalDuration])

  // 处理鼠标按下
  const handleMouseDown = (e) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = canvasRef.current.width
    const time = (x / width) * totalDuration

    // 判断是否点击在剪辑边界附近
    const startX = (clipStart / totalDuration) * width
    const endX = (clipEnd / totalDuration) * width
    const threshold = 10

    if (Math.abs(x - startX) < threshold) {
      setDragTarget('start')
    } else if (Math.abs(x - endX) < threshold) {
      setDragTarget('end')
    } else {
      setDragTarget('playhead')
      onSeek?.(Math.max(clipStart, Math.min(clipEnd, time)))
    }

    setIsDragging(true)
  }

  // 处理鼠标移动
  const handleMouseMove = (e) => {
    if (!isDragging || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = canvasRef.current.width
    const time = Math.max(0, Math.min(totalDuration, (x / width) * totalDuration))

    if (dragTarget === 'start') {
      const newStart = Math.min(time, clipEnd - 0.1)
      setClipStart(newStart)
      onClipChange?.(newStart, clipEnd)
    } else if (dragTarget === 'end') {
      const newEnd = Math.max(time, clipStart + 0.1)
      setClipEnd(newEnd)
      onClipChange?.(clipStart, newEnd)
    } else if (dragTarget === 'playhead') {
      onSeek?.(Math.max(clipStart, Math.min(clipEnd, time)))
    }
  }

  // 处理鼠标释放
  const handleMouseUp = () => {
    setIsDragging(false)
    setDragTarget(null)
  }

  // 处理点击
  const handleClick = (e) => {
    if (isDragging) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = canvasRef.current.width
    const time = (x / width) * totalDuration

    onSeek?.(Math.max(clipStart, Math.min(clipEnd, time)))
  }

  return (
    <div className={styles.container}>
      <canvas
        ref={canvasRef}
        className={styles.waveform}
        width={800}
        height={100}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
      />

      <div className={styles.timeMarkers}>
        <span className={styles.timeMarker}>{formatTime(0)}</span>
        <span className={styles.timeMarker}>{formatTime(totalDuration / 2)}</span>
        <span className={styles.timeMarker}>{formatTime(totalDuration)}</span>
      </div>

      <div className={styles.clipInfo}>
        <span className={styles.clipRange}>
          剪辑: {formatTime(clipStart)} - {formatTime(clipEnd)}
        </span>
        <span className={styles.duration}>
          时长: {formatTime(clipEnd - clipStart)}
        </span>
      </div>
    </div>
  )
}

// 格式化时间
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
}
