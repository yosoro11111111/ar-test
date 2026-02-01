// 统一交互Hook - 统一处理触摸和鼠标事件
import { useRef, useCallback, useEffect, useState } from 'react'

// 交互手势类型
export const GESTURE_TYPES = {
  TAP: 'tap',           // 单击/点击
  DOUBLE_TAP: 'doubleTap', // 双击
  LONG_PRESS: 'longPress', // 长按
  DRAG: 'drag',         // 拖拽
  PINCH: 'pinch',       // 捏合/缩放
  ROTATE: 'rotate'      // 旋转
}

// 设备类型
export const DEVICE_TYPES = {
  TOUCH: 'touch',
  MOUSE: 'mouse',
  PEN: 'pen'
}

/**
 * 统一交互Hook
 * @param {Object} options - 配置选项
 * @param {Function} options.onTap - 单击回调
 * @param {Function} options.onDoubleTap - 双击回调
 * @param {Function} options.onLongPress - 长按回调
 * @param {Function} options.onDrag - 拖拽回调
 * @param {Function} options.onPinch - 捏合回调
 * @param {Function} options.onRotate - 旋转回调
 * @param {number} options.longPressDelay - 长按延迟(默认500ms)
 * @param {number} options.doubleTapDelay - 双击延迟(默认300ms)
 * @param {number} options.dragThreshold - 拖拽阈值(默认10px)
 * @param {boolean} options.preventDefault - 是否阻止默认行为(默认true)
 * @param {boolean} options.stopPropagation - 是否阻止事件冒泡(默认false)
 */
export function useUnifiedInteraction(options = {}) {
  const {
    onTap,
    onDoubleTap,
    onLongPress,
    onDrag,
    onPinch,
    onRotate,
    longPressDelay = 500,
    doubleTapDelay = 300,
    dragThreshold = 10,
    preventDefault = true,
    stopPropagation = false
  } = options

  // 状态
  const [isPressed, setIsPressed] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [gestureState, setGestureState] = useState(null)

  // 引用
  const touchState = useRef({
    startTime: 0,
    startPos: { x: 0, y: 0 },
    lastTapTime: 0,
    isLongPress: false,
    longPressTimer: null,
    touches: [],
    deviceType: null
  })

  const dragState = useRef({
    startPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 },
    delta: { x: 0, y: 0 }
  })

  const pinchState = useRef({
    startDistance: 0,
    startScale: 1,
    currentScale: 1
  })

  // 获取事件位置
  const getEventPos = useCallback((e) => {
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        deviceType: DEVICE_TYPES.TOUCH
      }
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      return {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
        deviceType: DEVICE_TYPES.TOUCH
      }
    } else {
      return {
        x: e.clientX,
        y: e.clientY,
        deviceType: e.pointerType === 'touch' ? DEVICE_TYPES.TOUCH : 
                    e.pointerType === 'pen' ? DEVICE_TYPES.PEN : DEVICE_TYPES.MOUSE
      }
    }
  }, [])

  // 获取双指距离
  const getPinchDistance = useCallback((touches) => {
    if (touches.length < 2) return 0
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  // 处理按下
  const handlePointerDown = useCallback((e) => {
    if (stopPropagation) e.stopPropagation()
    if (preventDefault && e.cancelable) e.preventDefault()

    const pos = getEventPos(e)
    const now = Date.now()
    const touches = e.touches || [e]

    // 更新状态
    touchState.current.startTime = now
    touchState.current.startPos = { x: pos.x, y: pos.y }
    touchState.current.isLongPress = false
    touchState.current.touches = touches
    touchState.current.deviceType = pos.deviceType

    setIsPressed(true)
    setGestureState({
      type: GESTURE_TYPES.TAP,
      phase: 'start',
      deviceType: pos.deviceType,
      position: { x: pos.x, y: pos.y }
    })

    // 检测双击
    if (now - touchState.current.lastTapTime < doubleTapDelay) {
      // 双击触发
      onDoubleTap?.({
        type: GESTURE_TYPES.DOUBLE_TAP,
        position: { x: pos.x, y: pos.y },
        deviceType: pos.deviceType,
        originalEvent: e
      })
      touchState.current.lastTapTime = 0
      clearTimeout(touchState.current.longPressTimer)
      return
    }

    touchState.current.lastTapTime = now

    // 设置长按定时器
    touchState.current.longPressTimer = setTimeout(() => {
      touchState.current.isLongPress = true
      setGestureState({
        type: GESTURE_TYPES.LONG_PRESS,
        phase: 'active',
        deviceType: pos.deviceType,
        position: { x: pos.x, y: pos.y }
      })
      onLongPress?.({
        type: GESTURE_TYPES.LONG_PRESS,
        position: { x: pos.x, y: pos.y },
        deviceType: pos.deviceType,
        originalEvent: e
      })
    }, longPressDelay)

    // 初始化拖拽状态
    dragState.current.startPos = { x: pos.x, y: pos.y }
    dragState.current.currentPos = { x: pos.x, y: pos.y }
    dragState.current.delta = { x: 0, y: 0 }

    // 双指缩放初始化
    if (touches.length === 2) {
      pinchState.current.startDistance = getPinchDistance(touches)
      pinchState.current.startScale = pinchState.current.currentScale
    }
  }, [getEventPos, getPinchDistance, onDoubleTap, onLongPress, longPressDelay, doubleTapDelay, preventDefault, stopPropagation])

  // 处理移动
  const handlePointerMove = useCallback((e) => {
    if (stopPropagation) e.stopPropagation()
    if (preventDefault && e.cancelable) e.preventDefault()

    const pos = getEventPos(e)
    const touches = e.touches || [e]
    const startPos = touchState.current.startPos

    // 计算移动距离
    const dx = pos.x - startPos.x
    const dy = pos.y - startPos.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // 如果移动超过阈值，取消长按
    if (distance > dragThreshold && touchState.current.longPressTimer) {
      clearTimeout(touchState.current.longPressTimer)
      touchState.current.longPressTimer = null
    }

    // 处理拖拽
    if (distance > dragThreshold) {
      if (!isDragging) {
        setIsDragging(true)
        setGestureState({
          type: GESTURE_TYPES.DRAG,
          phase: 'start',
          deviceType: pos.deviceType,
          position: { x: pos.x, y: pos.y },
          delta: { x: dx, y: dy }
        })
      }

      // 更新拖拽状态
      dragState.current.currentPos = { x: pos.x, y: pos.y }
      dragState.current.delta = { x: dx, y: dy }

      onDrag?.({
        type: GESTURE_TYPES.DRAG,
        phase: 'move',
        position: { x: pos.x, y: pos.y },
        startPosition: dragState.current.startPos,
        delta: { x: dx, y: dy },
        deviceType: pos.deviceType,
        originalEvent: e
      })
    }

    // 处理双指缩放
    if (touches.length === 2 && pinchState.current.startDistance > 0) {
      const currentDistance = getPinchDistance(touches)
      const scale = (currentDistance / pinchState.current.startDistance) * pinchState.current.startScale
      pinchState.current.currentScale = scale

      setGestureState({
        type: GESTURE_TYPES.PINCH,
        phase: 'move',
        deviceType: DEVICE_TYPES.TOUCH,
        scale: scale,
        deltaScale: scale / pinchState.current.startScale
      })

      onPinch?.({
        type: GESTURE_TYPES.PINCH,
        scale: scale,
        deltaScale: scale / pinchState.current.startScale,
        deviceType: DEVICE_TYPES.TOUCH,
        originalEvent: e
      })
    }
  }, [getEventPos, getPinchDistance, onDrag, onPinch, isDragging, dragThreshold, preventDefault, stopPropagation])

  // 处理释放
  const handlePointerUp = useCallback((e) => {
    if (stopPropagation) e.stopPropagation()
    if (preventDefault && e.cancelable) e.preventDefault()

    const pos = getEventPos(e)
    const now = Date.now()
    const duration = now - touchState.current.startTime

    // 清除长按定时器
    if (touchState.current.longPressTimer) {
      clearTimeout(touchState.current.longPressTimer)
      touchState.current.longPressTimer = null
    }

    // 如果不是长按且不是拖拽，触发单击
    if (!touchState.current.isLongPress && !isDragging && duration < longPressDelay) {
      onTap?.({
        type: GESTURE_TYPES.TAP,
        position: { x: pos.x, y: pos.y },
        deviceType: pos.deviceType,
        originalEvent: e
      })
      setGestureState({
        type: GESTURE_TYPES.TAP,
        phase: 'end',
        deviceType: pos.deviceType,
        position: { x: pos.x, y: pos.y }
      })
    }

    // 结束拖拽
    if (isDragging) {
      onDrag?.({
        type: GESTURE_TYPES.DRAG,
        phase: 'end',
        position: { x: pos.x, y: pos.y },
        startPosition: dragState.current.startPos,
        delta: dragState.current.delta,
        deviceType: pos.deviceType,
        originalEvent: e
      })
    }

    // 重置状态
    setIsPressed(false)
    setIsDragging(false)
    touchState.current.isLongPress = false
    touchState.current.touches = []
  }, [getEventPos, onTap, onDrag, isDragging, longPressDelay, preventDefault, stopPropagation])

  // 处理取消
  const handlePointerCancel = useCallback((e) => {
    if (touchState.current.longPressTimer) {
      clearTimeout(touchState.current.longPressTimer)
      touchState.current.longPressTimer = null
    }
    setIsPressed(false)
    setIsDragging(false)
    touchState.current.isLongPress = false
    touchState.current.touches = []
  }, [])

  // 处理滚轮缩放（桌面端）
  const handleWheel = useCallback((e) => {
    if (preventDefault && e.cancelable) e.preventDefault()

    // Alt + 滚轮 = 缩放
    if (e.altKey) {
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const newScale = pinchState.current.currentScale * delta
      pinchState.current.currentScale = Math.max(0.3, Math.min(3.0, newScale))

      onPinch?.({
        type: GESTURE_TYPES.PINCH,
        scale: pinchState.current.currentScale,
        deltaScale: delta,
        deviceType: DEVICE_TYPES.MOUSE,
        originalEvent: e
      })
    }
  }, [onPinch, preventDefault])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (touchState.current.longPressTimer) {
        clearTimeout(touchState.current.longPressTimer)
      }
    }
  }, [])

  // 返回事件处理器和状态
  return {
    // 事件处理器
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      onTouchStart: handlePointerDown,
      onTouchMove: handlePointerMove,
      onTouchEnd: handlePointerUp,
      onTouchCancel: handlePointerCancel,
      onMouseDown: handlePointerDown,
      onMouseMove: handlePointerMove,
      onMouseUp: handlePointerUp,
      onMouseLeave: handlePointerCancel,
      onWheel: handleWheel
    },
    // 状态
    state: {
      isPressed,
      isDragging,
      gestureState,
      deviceType: touchState.current.deviceType
    },
    // 数据
    data: {
      dragDelta: dragState.current.delta,
      scale: pinchState.current.currentScale
    }
  }
}

/**
 * 长按进度Hook
 * @param {boolean} isPressing - 是否正在按下
 * @param {number} duration - 长按持续时间(默认500ms)
 * @returns {number} 进度(0-100)
 */
export function useLongPressProgress(isPressing, duration = 500) {
  const [progress, setProgress] = useState(0)
  const animationRef = useRef(null)

  useEffect(() => {
    if (!isPressing) {
      setProgress(0)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    const startTime = Date.now()

    const updateProgress = () => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min(100, (elapsed / duration) * 100)
      setProgress(newProgress)

      if (newProgress < 100) {
        animationRef.current = requestAnimationFrame(updateProgress)
      }
    }

    animationRef.current = requestAnimationFrame(updateProgress)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPressing, duration])

  return progress
}

/**
 * 双击检测Hook
 * @param {number} delay - 双击间隔(默认300ms)
 * @returns {Object} { onClick, isDoubleClick }
 */
export function useDoubleClick(delay = 300) {
  const [isDoubleClick, setIsDoubleClick] = useState(false)
  const lastClickTime = useRef(0)
  const timerRef = useRef(null)

  const onClick = useCallback((callback) => {
    const now = Date.now()

    if (now - lastClickTime.current < delay) {
      // 双击
      setIsDoubleClick(true)
      lastClickTime.current = 0
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      callback?.(true)
    } else {
      // 单击
      setIsDoubleClick(false)
      lastClickTime.current = now
      timerRef.current = setTimeout(() => {
        callback?.(false)
      }, delay)
    }
  }, [delay])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return { onClick, isDoubleClick }
}

/**
 * 触摸涟漪效果Hook
 * @returns {Object} { ripples, createRipple, clearRipples }
 */
export function useTouchRipple() {
  const [ripples, setRipples] = useState([])
  const idCounter = useRef(0)

  const createRipple = useCallback((x, y, color = 'rgba(255, 255, 255, 0.3)') => {
    const id = ++idCounter.current
    const newRipple = { id, x, y, color, timestamp: Date.now() }
    setRipples(prev => [...prev, newRipple])

    // 自动移除
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id))
    }, 600)
  }, [])

  const clearRipples = useCallback(() => {
    setRipples([])
  }, [])

  return { ripples, createRipple, clearRipples }
}

// 导出默认对象
export default {
  useUnifiedInteraction,
  useLongPressProgress,
  useDoubleClick,
  useTouchRipple,
  GESTURE_TYPES,
  DEVICE_TYPES
}
