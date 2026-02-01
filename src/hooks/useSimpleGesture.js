// 简化手势系统 - 只保留双指缩放和移动
import { useState, useEffect, useCallback, useRef } from 'react'

// 获取两点距离
function getDistance(touch1, touch2) {
  const dx = touch1.clientX - touch2.clientX
  const dy = touch1.clientY - touch2.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

// 获取两点中心
function getCenter(touch1, touch2) {
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2
  }
}

// 获取中心点移动差值
function getCenterDelta(prevTouches, currentTouches) {
  const prevCenter = getCenter(prevTouches[0], prevTouches[1])
  const currentCenter = getCenter(currentTouches[0], currentTouches[1])
  return {
    x: currentCenter.x - prevCenter.x,
    y: currentCenter.y - prevCenter.y
  }
}

/**
 * 简化手势Hook - 只支持三种核心手势
 * @param {Object} options
 * @param {Function} options.onRotate - 单指拖拽旋转视角 (dx, dy)
 * @param {Function} options.onZoom - 双指捏合缩放 (scale, delta)
 * @param {Function} options.onPan - 双指拖拽平移 (dx, dy)
 * @param {boolean} options.enabled - 是否启用
 * @param {number} options.rotateSensitivity - 旋转灵敏度 (默认1)
 * @param {number} options.zoomSensitivity - 缩放灵敏度 (默认1)
 * @param {number} options.panSensitivity - 平移灵敏度 (默认1)
 */
export function useSimpleGesture({
  onRotate,
  onZoom,
  onPan,
  enabled = true,
  rotateSensitivity = 1,
  zoomSensitivity = 1,
  panSensitivity = 1
}) {
  const touchState = useRef({
    touches: [],
    startDistance: 0,
    startScale: 1,
    isPinching: false,
    isPanning: false,
    lastTouchTime: 0
  })

  const [gestureState, setGestureState] = useState({
    isDragging: false,
    isZooming: false,
    isPanning: false
  })

  // 阻止默认触摸行为（防止页面滚动和缩放）
  useEffect(() => {
    if (!enabled) return

    const preventDefault = (e) => {
      // 阻止所有触摸的默认行为
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    }

    document.addEventListener('touchmove', preventDefault, { passive: false })
    document.addEventListener('gesturestart', preventDefault)
    document.addEventListener('gesturechange', preventDefault)
    document.addEventListener('gestureend', preventDefault)

    return () => {
      document.removeEventListener('touchmove', preventDefault)
      document.removeEventListener('gesturestart', preventDefault)
      document.removeEventListener('gesturechange', preventDefault)
      document.removeEventListener('gestureend', preventDefault)
    }
  }, [enabled])

  // 触摸开始
  const handleTouchStart = useCallback((e) => {
    if (!enabled) return

    const touches = Array.from(e.touches)
    touchState.current.touches = touches
    touchState.current.lastTouchTime = Date.now()

    if (touches.length === 2) {
      // 双指初始化
      const distance = getDistance(touches[0], touches[1])
      touchState.current.startDistance = distance
      touchState.current.isPinching = true
      touchState.current.isPanning = false
      
      setGestureState(prev => ({ ...prev, isZooming: true }))
    } else if (touches.length === 1) {
      // 单指开始
      setGestureState(prev => ({ ...prev, isDragging: true }))
    }
  }, [enabled])

  // 触摸移动
  const handleTouchMove = useCallback((e) => {
    if (!enabled) return
    e.preventDefault()

    const touches = Array.from(e.touches)
    const prevTouches = touchState.current.touches

    if (touches.length === 1 && prevTouches.length === 1) {
      // 单指拖拽 -> 旋转视角
      const dx = (touches[0].clientX - prevTouches[0].clientX) * rotateSensitivity
      const dy = (touches[0].clientY - prevTouches[0].clientY) * rotateSensitivity
      
      onRotate?.({ 
        dx, 
        dy, 
        deltaX: dx, 
        deltaY: dy,
        clientX: touches[0].clientX,
        clientY: touches[0].clientY
      })
      
    } else if (touches.length === 2 && prevTouches.length === 2) {
      const currentDistance = getDistance(touches[0], touches[1])
      const prevDistance = touchState.current.startDistance || currentDistance
      
      // 计算距离变化比例
      const scale = currentDistance / prevDistance
      const distanceDelta = Math.abs(currentDistance - prevDistance)
      
      // 计算中心点移动
      const centerDelta = getCenterDelta(prevTouches, touches)
      const centerMovement = Math.sqrt(centerDelta.x * centerDelta.x + centerDelta.y * centerDelta.y)
      
      // 判断是捏合还是平移
      // 如果距离变化大，是捏合缩放；如果中心点移动大，是平移
      const PINCH_THRESHOLD = 10
      const PAN_THRESHOLD = 5
      
      if (distanceDelta > PINCH_THRESHOLD && !touchState.current.isPanning) {
        // 捏合缩放
        const delta = scale - 1
        onZoom?.({ 
          scale, 
          delta: delta * zoomSensitivity,
          distance: currentDistance,
          center: getCenter(touches[0], touches[1])
        })
        
        touchState.current.startDistance = currentDistance
        setGestureState(prev => ({ ...prev, isZooming: true, isPanning: false }))
        
      } else if (centerMovement > PAN_THRESHOLD && !touchState.current.isPinching) {
        // 双指平移
        touchState.current.isPanning = true
        
        onPan?.({ 
          dx: centerDelta.x * panSensitivity, 
          dy: centerDelta.y * panSensitivity,
          center: getCenter(touches[0], touches[1])
        })
        
        setGestureState(prev => ({ ...prev, isPanning: true, isZooming: false }))
      }
    }

    touchState.current.touches = touches
  }, [enabled, onRotate, onZoom, onPan, rotateSensitivity, zoomSensitivity, panSensitivity])

  // 触摸结束
  const handleTouchEnd = useCallback((e) => {
    const touches = Array.from(e.touches)
    touchState.current.touches = touches

    if (touches.length < 2) {
      touchState.current.isPinching = false
      touchState.current.isPanning = false
      touchState.current.startDistance = 0
    }

    if (touches.length === 0) {
      setGestureState({
        isDragging: false,
        isZooming: false,
        isPanning: false
      })
    }
  }, [])

  // 触摸取消
  const handleTouchCancel = useCallback((e) => {
    touchState.current.touches = []
    touchState.current.isPinching = false
    touchState.current.isPanning = false
    touchState.current.startDistance = 0
    
    setGestureState({
      isDragging: false,
      isZooming: false,
      isPanning: false
    })
  }, [])

  // 禁用其他所有点击和触摸事件
  const handleClick = useCallback((e) => {
    if (!enabled) return
    // 阻止所有点击事件
    e.preventDefault()
    e.stopPropagation()
  }, [enabled])

  const handleDoubleClick = useCallback((e) => {
    if (!enabled) return
    e.preventDefault()
    e.stopPropagation()
  }, [enabled])

  const handleContextMenu = useCallback((e) => {
    if (!enabled) return
    e.preventDefault()
    e.stopPropagation()
  }, [enabled])

  const handleMouseDown = useCallback((e) => {
    if (!enabled) return
    // 桌面端鼠标支持
    if (e.button === 0) {
      // 左键按下 - 模拟单指
      const mockTouch = {
        clientX: e.clientX,
        clientY: e.clientY
      }
      touchState.current.touches = [mockTouch]
      setGestureState(prev => ({ ...prev, isDragging: true }))
    }
  }, [enabled])

  const handleMouseMove = useCallback((e) => {
    if (!enabled) return
    if (touchState.current.touches.length === 1) {
      // 鼠标拖拽
      const prevTouch = touchState.current.touches[0]
      const dx = (e.clientX - prevTouch.clientX) * rotateSensitivity
      const dy = (e.clientY - prevTouch.clientY) * rotateSensitivity
      
      onRotate?.({ dx, dy, deltaX: dx, deltaY: dy, clientX: e.clientX, clientY: e.clientY })
      
      touchState.current.touches = [{ clientX: e.clientX, clientY: e.clientY }]
    }
  }, [enabled, onRotate, rotateSensitivity])

  const handleMouseUp = useCallback(() => {
    touchState.current.touches = []
    setGestureState(prev => ({ ...prev, isDragging: false }))
  }, [])

  const handleWheel = useCallback((e) => {
    if (!enabled) return
    e.preventDefault()
    
    // 鼠标滚轮模拟缩放
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    onZoom?.({ scale: 1 + delta, delta: delta * zoomSensitivity })
  }, [enabled, onZoom, zoomSensitivity])

  return {
    gestureState,
    handlers: {
      // 触摸事件
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
      // 鼠标事件（桌面端支持）
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
      onWheel: handleWheel,
      // 禁用其他交互
      onClick: handleClick,
      onDoubleClick: handleDoubleClick,
      onContextMenu: handleContextMenu
    }
  }
}

// 手势状态指示器组件
export function GestureIndicator({ gestureState, isMobile }) {
  if (!gestureState.isDragging && !gestureState.isZooming && !gestureState.isPanning) {
    return null
  }

  return (
    <div className="gesture-indicator">
      {gestureState.isDragging && (
        <div className="gesture-hint rotate">
          <span className="icon">🔄</span>
          <span>旋转视角</span>
        </div>
      )}
      {gestureState.isZooming && (
        <div className="gesture-hint zoom">
          <span className="icon">🔍</span>
          <span>缩放</span>
        </div>
      )}
      {gestureState.isPanning && (
        <div className="gesture-hint pan">
          <span className="icon">✋</span>
          <span>移动</span>
        </div>
      )}
    </div>
  )
}

export default useSimpleGesture
