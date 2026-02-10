import React, { useRef, useEffect, useState, forwardRef } from 'react'
import styles from './CenterPanel.module.css'

/**
 * 中央预览区 - 3D视口
 * 
 * 功能：
 * - Three.js渲染
 * - VRM角色显示
 * - GLB场景/道具
 * - 摄像机控制
 * - 网格显示
 * - 时间/选中信息
 */
export const CenterPanel = forwardRef(function CenterPanel({
  project,
  currentTime,
  isPlaying,
  selectedObject,
  onSelectObject,
  renderEngine,
  onAddCamera,
  viewMode,
  onChangeViewMode,
  onUndo,
  onSearch,
  isPickingPosition,
  onCanvasClick
}, ref) {
  const canvasRef = useRef(null)
  const [currentViewMode, setCurrentViewMode] = useState(viewMode || 'perspective')
  const [activeTool, setActiveTool] = useState('select') // select, move, rotate, scale

  // 将canvasRef传递给父组件
  useEffect(() => {
    if (ref) {
      ref.current = canvasRef.current
    }
  }, [ref])

  // 格式化时间显示
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const frames = Math.floor((seconds % 1) * (project?.settings?.fps || 30))
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
  }

  return (
    <div className={styles.container}>
      {/* 视口工具栏 */}
      <div className={styles.toolbar}>
        <div className={styles.toolGroup}>
          <button 
            className={`${styles.toolBtn} ${activeTool === 'select' ? styles.active : ''}`} 
            title="选择工具 (Q)"
            onClick={() => setActiveTool('select')}
          >
            🖱️
          </button>
          <button 
            className={`${styles.toolBtn} ${activeTool === 'move' ? styles.active : ''}`} 
            title="移动工具 (W)"
            onClick={() => setActiveTool('move')}
          >
            ✋
          </button>
          <button 
            className={`${styles.toolBtn} ${activeTool === 'rotate' ? styles.active : ''}`} 
            title="旋转工具 (E)"
            onClick={() => setActiveTool('rotate')}
          >
            🔄
          </button>
          <button 
            className={`${styles.toolBtn} ${activeTool === 'scale' ? styles.active : ''}`} 
            title="缩放工具 (R)"
            onClick={() => setActiveTool('scale')}
          >
            🔍
          </button>
          <div className={styles.toolSeparator} />
          <button 
            className={styles.toolBtn} 
            title="撤销 (Ctrl+Z)"
            onClick={() => onUndo?.()}
          >
            ↩️
          </button>
          <button 
            className={styles.toolBtn} 
            title="搜索 (Ctrl+F)"
            onClick={() => onSearch?.()}
          >
            🔎
          </button>
        </div>
        
        <div className={styles.viewControls}>
          <button className={styles.cameraBtn} title="添加摄像机">
            📷 添加
          </button>
          <select 
            className={styles.viewSelect}
            value={currentViewMode}
            onChange={(e) => {
              setCurrentViewMode(e.target.value)
              onChangeViewMode?.(e.target.value)
            }}
          >
            <option value="perspective">透视</option>
            <option value="orthographic">正交</option>
            <option value="camera">摄像机</option>
          </select>
        </div>
      </div>
      
      {/* 3D视口 */}
      <div className={styles.viewport}>
        <canvas
          ref={canvasRef}
          className={`${styles.canvas} ${isPickingPosition ? styles.picking : ''}`}
          onClick={onCanvasClick}
        />
        
        {/* 时间和选中信息 */}
        <div className={styles.infoOverlay}>
          <div className={styles.timeInfo}>
            <span className={styles.timeLabel}>时间</span>
            <span className={styles.timeValue}>{formatTime(currentTime)}</span>
          </div>
          {selectedObject && (
            <div className={styles.selectionInfo}>
              <span className={styles.selectionLabel}>选中</span>
              <span className={styles.selectionName}>{selectedObject.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
