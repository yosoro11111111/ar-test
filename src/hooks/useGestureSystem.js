import { useState, useCallback, useRef, useEffect } from 'react'

// 手势系统 Hook
// 支持：单击、长按、双击、单指滑动、双指滑动、双指捏合
export const useGestureSystem = ({
  onTap,
  onLongPress,
  onDoubleTap,
  onSinglePan,
  onDoublePan,
  onPinch,
  longPressDelay = 500,
  doubleTapDelay = 300
}) => {
  const [gestureState, setGestureState] = useState({
    isPressed: false,
    isLongPressed: false,
    touchCount: 0,
    isPinching: false
  })

  const touchStartTime = useRef(0)
  const touchStartPos = useRef({ x: 0, y: 0 })
  const lastTapTime = useRef(0)
  const longPressTimer = useRef(null)
  const initialPinchDistance = useRef(0)
  const initialPinchScale = useRef(1)
  const touchPositions = useRef([])

  // 计算两点距离
  const getDistance = (p1, p2) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
  }

  // 计算两点中心
  const getCenter = (p1, p2) => ({
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  })

  // 处理触摸开始
  const handleTouchStart = useCallback((e) => {
    e.preventDefault()
    const touches = e.touches
    const now = Date.now()
    touchPositions.current = Array.from(touches).map(t => ({
      x: t.clientX,
      y: t.clientY,
      id: t.identifier
    }))

    setGestureState(prev => ({
      ...prev,
      isPressed: true,
      touchCount: touches.length
    }))

    if (touches.length === 1) {
      // 单指
      touchStartTime.current = now
      touchStartPos.current = { x: touches[0].clientX, y: touches[0].clientY }

      // 检测双击
      if (now - lastTapTime.current < doubleTapDelay) {
        onDoubleTap?.({ x: touches[0].clientX, y: touches[0].clientY })
        lastTapTime.current = 0
        return
      }
      lastTapTime.current = now

      // 设置长按定时器
      longPressTimer.current = setTimeout(() => {
        setGestureState(prev => ({ ...prev, isLongPressed: true }))
        onLongPress?.({
          x: touches[0].clientX,
          y: touches[0].clientY,
          type: 'start'
        })
      }, longPressDelay)
    } else if (touches.length === 2) {
      // 双指
      clearTimeout(longPressTimer.current)
      initialPinchDistance.current = getDistance(
        { x: touches[0].clientX, y: touches[0].clientY },
        { x: touches[1].clientX, y: touches[1].clientY }
      )
      setGestureState(prev => ({ ...prev, isPinching: true }))
    }
  }, [onDoubleTap, onLongPress, longPressDelay, doubleTapDelay])

  // 处理触摸移动
  const handleTouchMove = useCallback((e) => {
    e.preventDefault()
    const touches = e.touches

    if (touches.length === 1 && gestureState.isPressed && !gestureState.isLongPressed) {
      // 单指移动 - 检测是否移动超过阈值
      const dx = touches[0].clientX - touchStartPos.current.x
      const dy = touches[0].clientY - touchStartPos.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 10) {
        clearTimeout(longPressTimer.current)
      }

      onSinglePan?.({
        dx,
        dy,
        x: touches[0].clientX,
        y: touches[0].clientY,
        startX: touchStartPos.current.x,
        startY: touchStartPos.current.y
      })
    } else if (touches.length === 2 && gestureState.isPinching) {
      // 双指移动或缩放
      const currentDistance = getDistance(
        { x: touches[0].clientX, y: touches[0].clientY },
        { x: touches[1].clientX, y: touches[1].clientY }
      )
      const scale = currentDistance / initialPinchDistance.current
      const center = getCenter(
        { x: touches[0].clientX, y: touches[0].clientY },
        { x: touches[1].clientX, y: touches[1].clientY }
      )

      // 计算双指中心移动
      const prevCenter = getCenter(
        touchPositions.current[0],
        touchPositions.current[1]
      )
      const dx = center.x - prevCenter.x
      const dy = center.y - prevCenter.y

      onPinch?.({ scale, center, dx, dy })
      onDoublePan?.({ dx, dy, center })
    }

    // 更新位置
    touchPositions.current = Array.from(touches).map(t => ({
      x: t.clientX,
      y: t.clientY,
      id: t.identifier
    }))
  }, [gestureState, onSinglePan, onPinch, onDoublePan])

  // 处理触摸结束
  const handleTouchEnd = useCallback((e) => {
    e.preventDefault()
    const now = Date.now()
    const touchDuration = now - touchStartTime.current

    clearTimeout(longPressTimer.current)

    if (gestureState.isLongPressed) {
      // 长按结束
      onLongPress?.({ type: 'end' })
    } else if (e.changedTouches.length === 1 && gestureState.touchCount === 1 && touchDuration < longPressDelay) {
      // 单击（不是长按，不是双击）
      const touch = e.changedTouches[0]
      const dx = touch.clientX - touchStartPos.current.x
      const dy = touch.clientY - touchStartPos.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < 10 && now - lastTapTime.current > doubleTapDelay) {
        onTap?.({ x: touch.clientX, y: touch.clientY })
      }
    }

    setGestureState({
      isPressed: false,
      isLongPressed: false,
      touchCount: 0,
      isPinching: false
    })
  }, [gestureState, onTap, onLongPress, longPressDelay, doubleTapDelay])

  // 清理
  useEffect(() => {
    return () => {
      clearTimeout(longPressTimer.current)
    }
  }, [])

  return {
    gestureState,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  }
}

// 3D场景手势控制器 Hook
export const useSceneGestureController = ({
  camera,
  target,
  onCharacterSelect,
  onCharacterMove,
  onCharacterRotate,
  onCharacterScale
}) => {
  const [mode, setMode] = useState('view') // view, move, rotate, scale
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const cameraRef = useRef(camera)
  const targetRef = useRef(target)

  // 视角旋转
  const rotateView = useCallback((dx, dy) => {
    if (!cameraRef.current || !targetRef.current) return
    
    const sensitivity = 0.005
    const spherical = new (window.THREE?.Spherical || class Spherical {
      constructor(radius, phi, theta) {
        this.radius = radius
        this.phi = phi
        this.theta = theta
      }
    })()
    
    // 简化的相机旋转逻辑
    const offset = {
      x: cameraRef.current.position.x - targetRef.current.x,
      y: cameraRef.current.position.y - targetRef.current.y,
      z: cameraRef.current.position.z - targetRef.current.z
    }
    
    // 水平旋转
    const theta = Math.atan2(offset.x, offset.z) - dx * sensitivity
    // 垂直旋转
    const phi = Math.acos(offset.y / Math.sqrt(offset.x ** 2 + offset.y ** 2 + offset.z ** 2)) - dy * sensitivity
    
    const radius = Math.sqrt(offset.x ** 2 + offset.y ** 2 + offset.z ** 2)
    const clampedPhi = Math.max(0.1, Math.min(Math.PI - 0.1, phi))
    
    cameraRef.current.position.x = targetRef.current.x + radius * Math.sin(clampedPhi) * Math.sin(theta)
    cameraRef.current.position.y = targetRef.current.y + radius * Math.cos(clampedPhi)
    cameraRef.current.position.z = targetRef.current.z + radius * Math.sin(clampedPhi) * Math.cos(theta)
    
    cameraRef.current.lookAt(targetRef.current.x, targetRef.current.y, targetRef.current.z)
  }, [])

  // 视角缩放
  const zoomView = useCallback((scale) => {
    if (!cameraRef.current || !targetRef.current) return
    
    const direction = {
      x: cameraRef.current.position.x - targetRef.current.x,
      y: cameraRef.current.position.y - targetRef.current.y,
      z: cameraRef.current.position.z - targetRef.current.z
    }
    
    const distance = Math.sqrt(direction.x ** 2 + direction.y ** 2 + direction.z ** 2)
    const newDistance = Math.max(1, Math.min(20, distance * (2 - scale)))
    const ratio = newDistance / distance
    
    cameraRef.current.position.x = targetRef.current.x + direction.x * ratio
    cameraRef.current.position.y = targetRef.current.y + direction.y * ratio
    cameraRef.current.position.z = targetRef.current.z + direction.z * ratio
  }, [])

  // 视角平移
  const panView = useCallback((dx, dy) => {
    if (!cameraRef.current) return
    
    const sensitivity = 0.01
    const right = { x: 1, y: 0, z: 0 }
    const up = { x: 0, y: 1, z: 0 }
    
    targetRef.current.x -= (right.x * dx + up.x * dy) * sensitivity
    targetRef.current.y -= (right.y * dx + up.y * dy) * sensitivity
    targetRef.current.z -= (right.z * dx + up.z * dy) * sensitivity
    
    cameraRef.current.position.x -= (right.x * dx + up.x * dy) * sensitivity
    cameraRef.current.position.y -= (right.y * dx + up.y * dy) * sensitivity
    cameraRef.current.position.z -= (right.z * dx + up.z * dy) * sensitivity
  }, [])

  const gestureHandlers = useGestureSystem({
    onTap: (pos) => {
      onCharacterSelect?.(pos)
    },
    onLongPress: (data) => {
      if (data.type === 'start') {
        setMode('move')
      }
    },
    onDoubleTap: () => {
      // 重置视角
      if (cameraRef.current && targetRef.current) {
        cameraRef.current.position.set(0, 1.5, 3)
        targetRef.current = { x: 0, y: 1, z: 0 }
        cameraRef.current.lookAt(0, 1, 0)
      }
    },
    onSinglePan: (data) => {
      if (mode === 'view') {
        rotateView(data.dx, data.dy)
      } else if (mode === 'move' && selectedCharacter) {
        onCharacterMove?.(selectedCharacter, data.dx * 0.01, -data.dy * 0.01)
      }
    },
    onDoublePan: (data) => {
      panView(data.dx, data.dy)
    },
    onPinch: (data) => {
      if (mode === 'view') {
        zoomView(data.scale)
      } else if (mode === 'scale' && selectedCharacter) {
        onCharacterScale?.(selectedCharacter, data.scale)
      }
    }
  })

  return {
    mode,
    setMode,
    selectedCharacter,
    setSelectedCharacter,
    gestureHandlers
  }
}

export default useGestureSystem
