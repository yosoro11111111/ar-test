import React, { useEffect, useRef, useState } from 'react'
import styles from './Timeline3DPreview.module.css'

/**
 * 时间轴3D预览组件
 * 
 * 功能：
 * - 在时间轴上方显示3D场景预览
 * - 根据当前时间显示对应帧的画面
 * - 支持关键帧标记显示
 */
export function Timeline3DPreview({ 
  renderEngine, 
  currentTime, 
  project,
  width = 200,
  height = 120
}) {
  const canvasRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const rafRef = useRef(null)
  const lastCaptureTime = useRef(0)

  // 初始化预览
  useEffect(() => {
    if (!renderEngine || !canvasRef.current) return
    
    // 检查渲染引擎是否初始化完成
    if (renderEngine.renderer && renderEngine.scene && renderEngine.camera) {
      setIsReady(true)
    }
  }, [renderEngine])

  // 捕获预览画面
  useEffect(() => {
    if (!isReady || !renderEngine) return

    // 限制捕获频率，每100ms最多捕获一次
    const now = Date.now()
    if (now - lastCaptureTime.current < 100) {
      return
    }
    lastCaptureTime.current = now

    // 使用 requestAnimationFrame 确保在渲染完成后捕获
    rafRef.current = requestAnimationFrame(() => {
      try {
        // 获取主渲染器的 canvas
        const mainCanvas = renderEngine.renderer.domElement
        
        // 创建缩略图
        const thumbCanvas = document.createElement('canvas')
        thumbCanvas.width = width
        thumbCanvas.height = height
        const ctx = thumbCanvas.getContext('2d')
        
        // 绘制缩略图（保持宽高比）
        const mainAspect = mainCanvas.width / mainCanvas.height
        const thumbAspect = width / height
        
        let sx, sy, sWidth, sHeight
        if (mainAspect > thumbAspect) {
          // 主画面更宽，以高度为基准
          sHeight = mainCanvas.height
          sWidth = sHeight * thumbAspect
          sx = (mainCanvas.width - sWidth) / 2
          sy = 0
        } else {
          // 主画面更高，以宽度为基准
          sWidth = mainCanvas.width
          sHeight = sWidth / thumbAspect
          sx = 0
          sy = (mainCanvas.height - sHeight) / 2
        }
        
        ctx.drawImage(
          mainCanvas,
          sx, sy, sWidth, sHeight,
          0, 0, width, height
        )
        
        // 转换为 data URL
        const url = thumbCanvas.toDataURL('image/jpeg', 0.7)
        setPreviewUrl(url)
      } catch (error) {
        console.warn('捕获预览失败:', error)
      }
    })

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [currentTime, isReady, renderEngine, width, height])

  // 获取关键帧位置
  const getKeyframes = () => {
    if (!project?.tracks) return []
    
    const keyframes = []
    project.tracks.forEach(track => {
      if (track.clips) {
        track.clips.forEach(clip => {
          keyframes.push({
            time: clip.start,
            type: track.type,
            name: clip.name
          })
          keyframes.push({
            time: clip.end,
            type: track.type,
            name: clip.name
          })
        })
      }
    })
    
    // 去重并排序
    return keyframes
      .filter((k, i, arr) => arr.findIndex(t => t.time === k.time) === i)
      .sort((a, b) => a.time - b.time)
  }

  const keyframes = getKeyframes()
  const duration = project?.duration || 120

  return (
    <div className={styles.container} style={{ width }}>
      {/* 预览画面 */}
      <div 
        className={styles.preview}
        style={{ width, height }}
      >
        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt="3D Preview"
            className={styles.previewImage}
          />
        ) : (
          <div className={styles.placeholder}>
            <span className={styles.placeholderIcon}>🎬</span>
            <span className={styles.placeholderText}>3D预览</span>
          </div>
        )}
        
        {/* 时间显示 */}
        <div className={styles.timeOverlay}>
          {formatTime(currentTime)}
        </div>
      </div>
      
      {/* 关键帧轨道 */}
      <div className={styles.keyframeTrack}>
        {keyframes.map((kf, index) => (
          <div
            key={index}
            className={`${styles.keyframe} ${styles[kf.type]}`}
            style={{
              left: `${(kf.time / duration) * 100}%`
            }}
            title={`${kf.name} (${formatTime(kf.time)})`}
          />
        ))}
        
        {/* 当前时间指示器 */}
        <div 
          className={styles.currentTime}
          style={{
            left: `${(currentTime / duration) * 100}%`
          }}
        />
      </div>
    </div>
  )
}

// 格式化时间
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const frames = Math.floor((seconds % 1) * 30)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
}
