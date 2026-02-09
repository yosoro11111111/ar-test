import React, { useEffect, useRef } from 'react'
import styles from './CameraPreview.module.css'

/**
 * 摄像机预览窗口
 * 
 * 功能：
 * - 显示当前摄像机视角
 * - 支持画中画模式
 * - 显示摄像机信息
 */
export function CameraPreview({ 
  cameraClip, 
  currentTime, 
  isPlaying,
  onClose,
  onToggleFullscreen
}) {
  const canvasRef = useRef(null)
  
  // 渲染摄像机预览
  useEffect(() => {
    if (!canvasRef.current || !cameraClip) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // 清空画布
    ctx.fillStyle = '#0a0a0f'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // 绘制网格（模拟3D场景）
    ctx.strokeStyle = '#1a1a25'
    ctx.lineWidth = 1
    
    // 绘制透视网格
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    
    // 水平线
    for (let i = -5; i <= 5; i++) {
      const y = centerY + i * 30
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
    
    // 垂直线（透视）
    for (let i = -10; i <= 10; i++) {
      const x = centerX + i * 40
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(centerX + i * 10, canvas.height)
      ctx.stroke()
    }
    
    // 绘制摄像机信息
    ctx.fillStyle = '#667eea'
    ctx.font = '12px sans-serif'
    ctx.fillText(`📷 ${cameraClip.name}`, 10, 20)
    
    // 绘制位置信息
    ctx.fillStyle = '#888'
    ctx.font = '10px monospace'
    const pos = cameraClip.cameraPosition || { x: 0, y: 2, z: 5 }
    ctx.fillText(`POS: ${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`, 10, 40)
    
    const target = cameraClip.targetPosition || { x: 0, y: 1, z: 0 }
    ctx.fillText(`TGT: ${target.x.toFixed(1)}, ${target.y.toFixed(1)}, ${target.z.toFixed(1)}`, 10, 55)
    
    ctx.fillText(`FOV: ${cameraClip.fov || 60}°`, 10, 70)
    
    // 绘制中心准星
    ctx.strokeStyle = '#e94560'
    ctx.lineWidth = 2
    const crossSize = 10
    ctx.beginPath()
    ctx.moveTo(centerX - crossSize, centerY)
    ctx.lineTo(centerX + crossSize, centerY)
    ctx.moveTo(centerX, centerY - crossSize)
    ctx.lineTo(centerX, centerY + crossSize)
    ctx.stroke()
    
    // 绘制录制指示器
    if (isPlaying) {
      ctx.fillStyle = '#e94560'
      ctx.beginPath()
      ctx.arc(canvas.width - 20, 20, 6, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.fillStyle = '#fff'
      ctx.font = '10px sans-serif'
      ctx.fillText('REC', canvas.width - 50, 24)
    }
    
  }, [cameraClip, currentTime, isPlaying])
  
  if (!cameraClip) return null
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>📷 摄像机预览</span>
        <div className={styles.controls}>
          <button className={styles.controlBtn} onClick={onToggleFullscreen} title="全屏">
            ⛶
          </button>
          <button className={styles.controlBtn} onClick={onClose} title="关闭">
            ✕
          </button>
        </div>
      </div>
      
      <canvas 
        ref={canvasRef}
        className={styles.canvas}
        width={320}
        height={180}
      />
      
      <div className={styles.info}>
        <span className={styles.time}>{currentTime.toFixed(2)}s</span>
        <span className={styles.status}>{isPlaying ? '▶ 播放中' : '⏸ 已暂停'}</span>
      </div>
    </div>
  )
}
