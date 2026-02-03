import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useUIStore } from '../../stores/uiStore'
import { useActionStore } from '../../stores/actionStore'
import './FloatingControlBall.css'

export const FloatingControlBall = ({ 
  onPrevAction, 
  onNextAction, 
  onExpressionClick,
  onPoseClick,
  onScreenshot,
  onSettingsClick,
  isMobile = false 
}) => {
  const { 
    isPlaying, 
    togglePlay, 
    playbackSpeed, 
    increaseSpeed, 
    decreaseSpeed,
    isLooping,
    toggleLoop 
  } = useActionStore()
  
  const { floatingToolbarPos, updateToolbarPos } = useUIStore()
  
  const [isDragging, setIsDragging] = useState(false)
  const [showSpeedIndicator, setShowSpeedIndicator] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState(null)
  const ballRef = useRef(null)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const posStartRef = useRef({ x: 0, y: 0 })

  // 拖拽逻辑
  const handleMouseDown = useCallback((e) => {
    if (isMobile) return
    
    setIsDragging(true)
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    posStartRef.current = { ...floatingToolbarPos }
    
    // 长按计时器
    const timer = setTimeout(() => {
      // 长按可以显示更多选项
    }, 500)
    setLongPressTimer(timer)
  }, [floatingToolbarPos, isMobile])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || isMobile) return
    
    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y
    
    const newX = Math.max(0, Math.min(window.innerWidth - 100, posStartRef.current.x + dx))
    const newY = Math.max(0, Math.min(window.innerHeight - 100, posStartRef.current.y + dy))
    
    updateToolbarPos({ x: newX, y: newY })
    
    // 清除长按计时器
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }, [isDragging, floatingToolbarPos, longPressTimer, isMobile])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    
    // 吸附到边缘
    const { x, y } = floatingToolbarPos
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    
    let snapX = x
    let snapY = y
    
    // 水平吸附
    if (x < centerX) {
      snapX = x < 50 ? 20 : x
    } else {
      snapX = x > window.innerWidth - 150 ? window.innerWidth - 120 : x
    }
    
    // 垂直吸附
    if (y < centerY) {
      snapY = y < 50 ? 80 : y
    } else {
      snapY = y > window.innerHeight - 150 ? window.innerHeight - 120 : y
    }
    
    if (snapX !== x || snapY !== y) {
      updateToolbarPos({ x: snapX, y: snapY })
    }
  }, [floatingToolbarPos, longPressTimer])

  // 全局鼠标事件
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // 速度调节显示
  const handleSpeedChange = (direction) => {
    if (direction === 'up') {
      increaseSpeed()
    } else {
      decreaseSpeed()
    }
    setShowSpeedIndicator(true)
    setTimeout(() => setShowSpeedIndicator(false), 1000)
  }

  // 移动端简化版
  if (isMobile) {
    return (
      <div className="floating-control-ball mobile">
        <button 
          className="control-btn prev"
          onClick={onPrevAction}
          aria-label="上一个动作"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </button>
        
        <button 
          className={`control-btn play ${isPlaying ? 'playing' : ''}`}
          onClick={togglePlay}
          aria-label={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>
        
        <button 
          className="control-btn next"
          onClick={onNextAction}
          aria-label="下一个动作"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </button>
      </div>
    )
  }

  // 桌面端完整版
  return (
    <div 
      ref={ballRef}
      className={`floating-control-ball ${isDragging ? 'dragging' : ''}`}
      style={{ 
        left: floatingToolbarPos.x, 
        top: floatingToolbarPos.y 
      }}
      onMouseDown={handleMouseDown}
    >
      {/* 上 - 上一个动作 */}
      <button 
        className="control-btn up"
        onClick={(e) => {
          e.stopPropagation()
          onPrevAction?.()
        }}
        onMouseDown={(e) => e.stopPropagation()}
        aria-label="上一个动作"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
        </svg>
      </button>
      
      {/* 中排 */}
      <div className="control-row">
        {/* 左 - 减速 */}
        <button 
          className="control-btn left"
          onClick={(e) => {
            e.stopPropagation()
            handleSpeedChange('down')
          }}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="减速"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
          </svg>
          <span className="speed-label">{playbackSpeed.toFixed(1)}x</span>
        </button>
        
        {/* 中心 - 播放/暂停 */}
        <button 
          className={`control-btn center ${isPlaying ? 'playing' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            togglePlay()
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => {
            e.stopPropagation()
            // 双击停止并重置
          }}
          aria-label={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>
        
        {/* 右 - 加速 */}
        <button 
          className="control-btn right"
          onClick={(e) => {
            e.stopPropagation()
            handleSpeedChange('up')
          }}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="加速"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
          </svg>
        </button>
      </div>
      
      {/* 下 - 下一个动作 */}
      <button 
        className="control-btn down"
        onClick={(e) => {
          e.stopPropagation()
          onNextAction?.()
        }}
        onMouseDown={(e) => e.stopPropagation()}
        aria-label="下一个动作"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
        </svg>
      </button>
      
      {/* 外围快捷按钮 */}
      <div className="outer-buttons">
        <button 
          className="outer-btn expression"
          onClick={(e) => {
            e.stopPropagation()
            onExpressionClick?.()
          }}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="表情"
        >
          😊
        </button>
        <button 
          className="outer-btn pose"
          onClick={(e) => {
            e.stopPropagation()
            onPoseClick?.()
          }}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="姿势"
        >
          🎭
        </button>
        <button 
          className="outer-btn screenshot"
          onClick={(e) => {
            e.stopPropagation()
            onScreenshot?.()
          }}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="截图"
        >
          📷
        </button>
        <button 
          className="outer-btn settings"
          onClick={(e) => {
            e.stopPropagation()
            onSettingsClick?.()
          }}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="设置"
        >
          ⚙️
        </button>
      </div>
      
      {/* 速度指示器 */}
      {showSpeedIndicator && (
        <div className="speed-indicator">
          {playbackSpeed.toFixed(1)}x
        </div>
      )}
      
      {/* 循环播放指示器 */}
      {isLooping && (
        <div className="loop-indicator">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
          </svg>
        </div>
      )}
    </div>
  )
}

export default FloatingControlBall
