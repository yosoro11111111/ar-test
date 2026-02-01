// 移动端性能管理器 - 自适应渲染质量
import { useState, useEffect, useCallback, useRef } from 'react'

// 性能等级配置
const PERFORMANCE_PROFILES = {
  high: {
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    shadowMapSize: 1024,
    maxParticles: 50,
    boneUpdateInterval: 1,
    enablePostProcessing: false,
    lodDistance: [15, 35, 70],
    targetFPS: 60,
    antialias: true
  },
  balanced: {
    pixelRatio: Math.min(window.devicePixelRatio, 1.5),
    shadowMapSize: 512,
    maxParticles: 25,
    boneUpdateInterval: 2,
    enablePostProcessing: false,
    lodDistance: [12, 28, 55],
    targetFPS: 30,
    antialias: true
  },
  low: {
    pixelRatio: 1,
    shadowMapSize: 0, // 禁用阴影
    maxParticles: 10,
    boneUpdateInterval: 3,
    enablePostProcessing: false,
    lodDistance: [8, 20, 40],
    targetFPS: 30,
    antialias: false,
    disableShadows: true,
    simplifyMaterials: true,
    maxBones: 50
  }
}

// 检测设备性能等级
function detectDevicePerformance() {
  // 检测GPU
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
  
  if (!gl) return 'low'
  
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
  let gpuTier = 'medium'
  
  if (debugInfo) {
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
    
    // 高端GPU检测
    const highEndGPUs = [
      'apple gpu', 'm1', 'm2', 'm3',
      'adreno 6', 'adreno 7',
      'mali-g7', 'mali-g8'
    ]
    
    // 低端GPU检测
    const lowEndGPUs = [
      'adreno 3', 'adreno 4', 'adreno 5',
      'mali-g5', 'mali-g4', 'mali-t',
      'powervr'
    ]
    
    const rendererLower = renderer.toLowerCase()
    
    if (highEndGPUs.some(gpu => rendererLower.includes(gpu))) {
      gpuTier = 'high'
    } else if (lowEndGPUs.some(gpu => rendererLower.includes(gpu))) {
      gpuTier = 'low'
    }
  }
  
  // 检测内存
  const memory = navigator.deviceMemory || 4
  if (memory <= 2) gpuTier = 'low'
  if (memory >= 8 && gpuTier === 'high') gpuTier = 'high'
  
  // 检测CPU核心数
  const cores = navigator.hardwareConcurrency || 4
  if (cores <= 2) gpuTier = 'low'
  
  return gpuTier
}

export function useMobilePerformance() {
  const [performanceMode, setPerformanceMode] = useState('balanced')
  const [fps, setFps] = useState(60)
  const [isThrottled, setIsThrottled] = useState(false)
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const profileRef = useRef(PERFORMANCE_PROFILES.balanced)
  
  // 初始化检测
  useEffect(() => {
    const detectedMode = detectDevicePerformance()
    setPerformanceMode(detectedMode)
    profileRef.current = PERFORMANCE_PROFILES[detectedMode]
  }, [])
  
  // FPS监控
  useEffect(() => {
    let animationId
    
    const measureFPS = () => {
      frameCountRef.current++
      const now = performance.now()
      const elapsed = now - lastTimeRef.current
      
      if (elapsed >= 1000) {
        const currentFPS = Math.round((frameCountRef.current * 1000) / elapsed)
        setFps(currentFPS)
        frameCountRef.current = 0
        lastTimeRef.current = now
        
        // 自动降级
        const targetFPS = profileRef.current.targetFPS
        if (currentFPS < targetFPS * 0.7 && performanceMode !== 'low') {
          setIsThrottled(true)
          if (currentFPS < targetFPS * 0.5) {
            const newMode = performanceMode === 'high' ? 'balanced' : 'low'
            setPerformanceMode(newMode)
            profileRef.current = PERFORMANCE_PROFILES[newMode]
          }
        } else if (currentFPS >= targetFPS * 0.9 && isThrottled) {
          setIsThrottled(false)
        }
      }
      
      animationId = requestAnimationFrame(measureFPS)
    }
    
    animationId = requestAnimationFrame(measureFPS)
    return () => cancelAnimationFrame(animationId)
  }, [performanceMode, isThrottled])
  
  // 手动设置性能模式
  const setMode = useCallback((mode) => {
    if (PERFORMANCE_PROFILES[mode]) {
      setPerformanceMode(mode)
      profileRef.current = PERFORMANCE_PROFILES[mode]
    }
  }, [])
  
  // 获取当前配置
  const getConfig = useCallback(() => {
    return profileRef.current
  }, [])
  
  // 电池状态监控
  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        const handleBatteryChange = () => {
          // 低电量时自动降低性能
          if (battery.level < 0.2 && !battery.charging && performanceMode !== 'low') {
            setPerformanceMode('low')
            profileRef.current = PERFORMANCE_PROFILES.low
          }
        }
        
        battery.addEventListener('levelchange', handleBatteryChange)
        handleBatteryChange()
        
        return () => battery.removeEventListener('levelchange', handleBatteryChange)
      })
    }
  }, [performanceMode])
  
  return {
    performanceMode,
    fps,
    isThrottled,
    config: profileRef.current,
    setMode,
    getConfig
  }
}

// 移动端LOD管理
export function useMobileLOD(performanceMode) {
  const getLODLevel = useCallback((distance) => {
    const config = PERFORMANCE_PROFILES[performanceMode] || PERFORMANCE_PROFILES.balanced
    const distances = config.lodDistance
    
    if (distance < distances[0]) return 0
    if (distance < distances[1]) return 1
    if (distance < distances[2]) return 2
    return 3
  }, [performanceMode])
  
  const getLODConfig = useCallback((level) => {
    const configs = {
      0: { geometry: 'full', material: 'full', shadows: true },
      1: { geometry: 'full', material: 'simple', shadows: true },
      2: { geometry: 'simplified', material: 'simple', shadows: false },
      3: { geometry: 'billboard', material: 'sprite', shadows: false }
    }
    return configs[level] || configs[0]
  }, [])
  
  return { getLODLevel, getLODConfig }
}

// 内存管理
export function useMemoryManager() {
  const memoryRef = useRef({
    textures: new Set(),
    geometries: new Set(),
    actions: new Map()
  })
  
  const addTexture = useCallback((texture) => {
    memoryRef.current.textures.add(texture)
  }, [])
  
  const removeTexture = useCallback((texture) => {
    if (texture) {
      texture.dispose()
      memoryRef.current.textures.delete(texture)
    }
  }, [])
  
  const addGeometry = useCallback((geometry) => {
    memoryRef.current.geometries.add(geometry)
  }, [])
  
  const removeGeometry = useCallback((geometry) => {
    if (geometry) {
      geometry.dispose()
      memoryRef.current.geometries.delete(geometry)
    }
  }, [])
  
  const cacheAction = useCallback((actionId, actionData) => {
    // LRU缓存，最多10个
    if (memoryRef.current.actions.size >= 10) {
      const firstKey = memoryRef.current.actions.keys().next().value
      const oldAction = memoryRef.current.actions.get(firstKey)
      if (oldAction?.clip) oldAction.clip.dispose()
      memoryRef.current.actions.delete(firstKey)
    }
    memoryRef.current.actions.set(actionId, actionData)
  }, [])
  
  const getCachedAction = useCallback((actionId) => {
    const action = memoryRef.current.actions.get(actionId)
    if (action) {
      // 移动到末尾（最近使用）
      memoryRef.current.actions.delete(actionId)
      memoryRef.current.actions.set(actionId, action)
    }
    return action
  }, [])
  
  const clearAll = useCallback(() => {
    memoryRef.current.textures.forEach(t => t.dispose())
    memoryRef.current.geometries.forEach(g => g.dispose())
    memoryRef.current.actions.forEach(a => {
      if (a?.clip) a.clip.dispose()
    })
    memoryRef.current.textures.clear()
    memoryRef.current.geometries.clear()
    memoryRef.current.actions.clear()
  }, [])
  
  return {
    addTexture,
    removeTexture,
    addGeometry,
    removeGeometry,
    cacheAction,
    getCachedAction,
    clearAll
  }
}

export default useMobilePerformance
