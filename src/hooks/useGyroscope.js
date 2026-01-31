// 陀螺仪控制Hook - 用于根据设备方向控制角色
import { useState, useEffect, useRef, useCallback } from 'react'

export const useGyroscope = (enabled = true) => {
  const [orientation, setOrientation] = useState({
    alpha: 0, // Z轴旋转 (0-360)
    beta: 0,  // X轴旋转 (-180 to 180) - 前后倾斜
    gamma: 0  // Y轴旋转 (-90 to 90) - 左右倾斜
  })
  const [isSupported, setIsSupported] = useState(false)
  const [isEnabled, setIsEnabled] = useState(enabled)
  const [permissionStatus, setPermissionStatus] = useState('prompt') // 'prompt', 'granted', 'denied'
  
  const smoothingFactor = useRef(0.1)
  const currentOrientation = useRef({ alpha: 0, beta: 0, gamma: 0 })
  const lastUpdateTime = useRef(Date.now())
  const rafId = useRef(null)

  // 请求陀螺仪权限（iOS 13+ 需要）
  const requestPermission = useCallback(async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission()
        setPermissionStatus(permission)
        return permission === 'granted'
      } catch (error) {
        console.error('请求陀螺仪权限失败:', error)
        return false
      }
    }
    return true
  }, [])

  // 处理方向变化
  const handleOrientation = useCallback((event) => {
    if (!isEnabled) return
    
    const now = Date.now()
    const deltaTime = now - lastUpdateTime.current
    
    // 限制更新频率到30fps
    if (deltaTime < 33) return
    lastUpdateTime.current = now

    const newOrientation = {
      alpha: event.alpha || 0,
      beta: Math.max(-90, Math.min(90, event.beta || 0)),
      gamma: Math.max(-90, Math.min(90, event.gamma || 0))
    }

    // 平滑插值
    currentOrientation.current = {
      alpha: currentOrientation.current.alpha + 
        (newOrientation.alpha - currentOrientation.current.alpha) * smoothingFactor.current,
      beta: currentOrientation.current.beta + 
        (newOrientation.beta - currentOrientation.current.beta) * smoothingFactor.current,
      gamma: currentOrientation.current.gamma + 
        (newOrientation.gamma - currentOrientation.current.gamma) * smoothingFactor.current
    }

    setOrientation({ ...currentOrientation.current })
  }, [isEnabled])

  // 启用/禁用陀螺仪
  const toggleGyroscope = useCallback(async () => {
    if (!isEnabled) {
      const granted = await requestPermission()
      if (granted) {
        setIsEnabled(true)
      }
    } else {
      setIsEnabled(false)
    }
  }, [isEnabled, requestPermission])

  // 设置平滑系数
  const setSmoothing = useCallback((factor) => {
    smoothingFactor.current = Math.max(0.01, Math.min(1, factor))
  }, [])

  // 重置方向
  const resetOrientation = useCallback(() => {
    currentOrientation.current = { alpha: 0, beta: 0, gamma: 0 }
    setOrientation({ alpha: 0, beta: 0, gamma: 0 })
  }, [])

  useEffect(() => {
    // 检查是否支持陀螺仪
    if (window.DeviceOrientationEvent) {
      setIsSupported(true)
      
      // 添加事件监听
      window.addEventListener('deviceorientation', handleOrientation, true)
      
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation, true)
        if (rafId.current) {
          cancelAnimationFrame(rafId.current)
        }
      }
    } else {
      setIsSupported(false)
    }
  }, [handleOrientation])

  // 计算角色应该有的旋转和倾斜
  const getCharacterTransform = useCallback(() => {
    // beta: -90(向前) 到 90(向后) -> 映射到角色前后倾斜
    // gamma: -90(向左) 到 90(向右) -> 映射到角色左右倾斜
    
    const maxTiltAngle = 30 // 最大倾斜角度
    
    // 前后倾斜 (绕X轴)
    const tiltX = (orientation.beta / 90) * maxTiltAngle
    
    // 左右倾斜 (绕Z轴)
    const tiltZ = (orientation.gamma / 90) * maxTiltAngle
    
    // 旋转 (绕Y轴) - 基于alpha
    const rotationY = orientation.alpha
    
    return {
      tiltX, // 前后倾斜角度
      tiltZ, // 左右倾斜角度
      rotationY, // 旋转角度
      raw: orientation // 原始数据
    }
  }, [orientation])

  // 检测特定动作
  const detectAction = useCallback(() => {
    const { beta, gamma } = orientation
    const absBeta = Math.abs(beta)
    const absGamma = Math.abs(gamma)
    
    // 检测摇晃
    if (absBeta > 60 || absGamma > 60) {
      return 'shake'
    }
    
    // 检测前倾
    if (beta > 45) {
      return 'leanForward'
    }
    
    // 检测后倾
    if (beta < -45) {
      return 'leanBack'
    }
    
    // 检测左倾
    if (gamma < -45) {
      return 'leanLeft'
    }
    
    // 检测右倾
    if (gamma > 45) {
      return 'leanRight'
    }
    
    return null
  }, [orientation])

  return {
    orientation,
    isSupported,
    isEnabled,
    permissionStatus,
    toggleGyroscope,
    requestPermission,
    setSmoothing,
    resetOrientation,
    getCharacterTransform,
    detectAction
  }
}

export default useGyroscope
