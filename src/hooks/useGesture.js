import { useEffect, useRef, useCallback, useState } from 'react'

// 手势控制 Hook - 支持移动端和桌面端
export const useGesture = (options = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onTap,
    onDoubleTap,
    onLongPress,
    threshold = 50, // 滑动阈值
    longPressDelay = 500, // 长按延迟
    doubleTapDelay = 300 // 双击延迟
  } = options

  const [gesture, setGesture] = useState(null)
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 })
  const touchEndRef = useRef({ x: 0, y: 0, time: 0 })
  const longPressTimerRef = useRef(null)
  const lastTapRef = useRef(0)
  const pinchStartRef = useRef(null)

  // 处理触摸开始
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }

    // 检测双指缩放
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      pinchStartRef.current = distance
    }

    // 设置长按定时器
    longPressTimerRef.current = setTimeout(() => {
      setGesture({ type: 'longpress', x: touch.clientX, y: touch.clientY })
      onLongPress?.({ x: touch.clientX, y: touch.clientY })
    }, longPressDelay)
  }, [longPressDelay, onLongPress])

  // 处理触摸移动
  const handleTouchMove = useCallback((e) => {
    // 清除长按定时器
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    // 处理双指缩放
    if (e.touches.length === 2 && pinchStartRef.current) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const scale = distance / pinchStartRef.current
      setGesture({ type: 'pinch', scale })
      onPinch?.({ scale })
    }
  }, [onPinch])

  // 处理触摸结束
  const handleTouchEnd = useCallback((e) => {
    // 清除长按定时器
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    const touch = e.changedTouches[0]
    touchEndRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }

    const deltaX = touchEndRef.current.x - touchStartRef.current.x
    const deltaY = touchEndRef.current.y - touchStartRef.current.y
    const deltaTime = touchEndRef.current.time - touchStartRef.current.time

    // 检测点击/双击
    if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
      const now = Date.now()
      if (now - lastTapRef.current < doubleTapDelay) {
        setGesture({ type: 'doubletap', x: touch.clientX, y: touch.clientY })
        onDoubleTap?.({ x: touch.clientX, y: touch.clientY })
        lastTapRef.current = 0
      } else {
        setGesture({ type: 'tap', x: touch.clientX, y: touch.clientY })
        onTap?.({ x: touch.clientX, y: touch.clientY })
        lastTapRef.current = now
      }
      return
    }

    // 检测滑动方向
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 水平滑动
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          setGesture({ type: 'swiperight', distance: deltaX })
          onSwipeRight?.({ distance: deltaX, duration: deltaTime })
        } else {
          setGesture({ type: 'swipeleft', distance: Math.abs(deltaX) })
          onSwipeLeft?.({ distance: Math.abs(deltaX), duration: deltaTime })
        }
      }
    } else {
      // 垂直滑动
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          setGesture({ type: 'swipedown', distance: deltaY })
          onSwipeDown?.({ distance: deltaY, duration: deltaTime })
        } else {
          setGesture({ type: 'swipeup', distance: Math.abs(deltaY) })
          onSwipeUp?.({ distance: Math.abs(deltaY), duration: deltaTime })
        }
      }
    }

    pinchStartRef.current = null
  }, [threshold, doubleTapDelay, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, onDoubleTap])

  // 处理鼠标事件（桌面端）
  const handleMouseDown = useCallback((e) => {
    touchStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    }

    longPressTimerRef.current = setTimeout(() => {
      setGesture({ type: 'longpress', x: e.clientX, y: e.clientY })
      onLongPress?.({ x: e.clientX, y: e.clientY })
    }, longPressDelay)
  }, [longPressDelay, onLongPress])

  const handleMouseMove = useCallback((e) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const handleMouseUp = useCallback((e) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    touchEndRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    }

    const deltaX = touchEndRef.current.x - touchStartRef.current.x
    const deltaY = touchEndRef.current.y - touchStartRef.current.y
    const deltaTime = touchEndRef.current.time - touchStartRef.current.time

    if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
      const now = Date.now()
      if (now - lastTapRef.current < doubleTapDelay) {
        setGesture({ type: 'doubletap', x: e.clientX, y: e.clientY })
        onDoubleTap?.({ x: e.clientX, y: e.clientY })
        lastTapRef.current = 0
      } else {
        setGesture({ type: 'tap', x: e.clientX, y: e.clientY })
        onTap?.({ x: e.clientX, y: e.clientY })
        lastTapRef.current = now
      }
    }
  }, [threshold, doubleTapDelay, onTap, onDoubleTap])

  // 绑定事件
  useEffect(() => {
    const element = options.elementRef?.current || document

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })
    element.addEventListener('mousedown', handleMouseDown)
    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseup', handleMouseUp)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('mousedown', handleMouseDown)
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown, handleMouseMove, handleMouseUp, options.elementRef])

  return gesture
}

// 简化的滑动手势 Hook
export const useSwipe = (onSwipe, options = {}) => {
  const { direction = 'horizontal', threshold = 50 } = options
  const touchStart = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const element = options.element || document

    const handleStart = (e) => {
      const touch = e.touches ? e.touches[0] : e
      touchStart.current = { x: touch.clientX, y: touch.clientY }
    }

    const handleEnd = (e) => {
      const touch = e.changedTouches ? e.changedTouches[0] : e
      const deltaX = touch.clientX - touchStart.current.x
      const deltaY = touch.clientY - touchStart.current.y

      if (direction === 'horizontal' && Math.abs(deltaX) > threshold) {
        onSwipe(deltaX > 0 ? 'right' : 'left')
      } else if (direction === 'vertical' && Math.abs(deltaY) > threshold) {
        onSwipe(deltaY > 0 ? 'down' : 'up')
      }
    }

    element.addEventListener('touchstart', handleStart, { passive: true })
    element.addEventListener('touchend', handleEnd, { passive: true })
    element.addEventListener('mousedown', handleStart)
    element.addEventListener('mouseup', handleEnd)

    return () => {
      element.removeEventListener('touchstart', handleStart)
      element.removeEventListener('touchend', handleEnd)
      element.removeEventListener('mousedown', handleStart)
      element.removeEventListener('mouseup', handleEnd)
    }
  }, [onSwipe, direction, threshold, options.element])
}

// 摇一摇检测 Hook
export const useShake = (onShake, options = {}) => {
  const { threshold = 15, cooldown = 1000 } = options
  const lastShake = useRef(0)
  const lastAcceleration = useRef({ x: 0, y: 0, z: 0 })

  useEffect(() => {
    const handleMotion = (e) => {
      const acceleration = e.accelerationIncludingGravity
      if (!acceleration) return

      const deltaX = Math.abs(acceleration.x - lastAcceleration.current.x)
      const deltaY = Math.abs(acceleration.y - lastAcceleration.current.y)
      const deltaZ = Math.abs(acceleration.z - lastAcceleration.current.z)

      const totalDelta = deltaX + deltaY + deltaZ

      if (totalDelta > threshold) {
        const now = Date.now()
        if (now - lastShake.current > cooldown) {
          lastShake.current = now
          onShake()
        }
      }

      lastAcceleration.current = {
        x: acceleration.x,
        y: acceleration.y,
        z: acceleration.z
      }
    }

    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion)
      return () => window.removeEventListener('devicemotion', handleMotion)
    }
  }, [onShake, threshold, cooldown])
}

// 陀螺仪控制 Hook
export const useGyroscope = (onChange, options = {}) => {
  const { sensitivity = 1 } = options

  useEffect(() => {
    const handleOrientation = (e) => {
      onChange({
        alpha: e.alpha * sensitivity, // Z轴旋转
        beta: e.beta * sensitivity,   // X轴旋转
        gamma: e.gamma * sensitivity  // Y轴旋转
      })
    }

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation)
      return () => window.removeEventListener('deviceorientation', handleOrientation)
    }
  }, [onChange, sensitivity])
}

export default useGesture
