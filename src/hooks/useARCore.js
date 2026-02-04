import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * 统一AR核心Hook
 * 管理AR系统的核心状态，被摄像头模式和AR模式共享
 */
export const useARCore = () => {
  // 当前模式
  const [mode, setMode] = useState('camera') // 'camera' | 'ar'
  
  // 系统状态
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // 扫描状态
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  
  // 放置状态
  const [isPlaced, setIsPlaced] = useState(false)
  const [placementPosition, setPlacementPosition] = useState(null)
  
  // 录制状态
  const [isRecording, setIsRecording] = useState(false)
  const [recordingProgress, setRecordingProgress] = useState(0)
  
  // 画布引用
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  // 初始化
  const initialize = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // 通用初始化逻辑
      setIsInitialized(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 切换模式
  const switchMode = useCallback(async (newMode) => {
    if (newMode === mode) return
    
    setIsLoading(true)
    try {
      // 清理当前模式
      if (mode === 'camera') {
        // 清理摄像头资源
      } else if (mode === 'ar') {
        // 清理AR资源
      }
      
      setMode(newMode)
      setIsPlaced(false)
      setScanProgress(0)
      
      // 初始化新模式
      await initialize()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [mode, initialize])

  // 开始扫描
  const startScanning = useCallback(() => {
    setIsScanning(true)
    setScanProgress(0)
  }, [])

  // 更新扫描进度
  const updateScanProgress = useCallback((progress) => {
    setScanProgress(Math.min(100, progress))
  }, [])

  // 完成扫描
  const completeScanning = useCallback(() => {
    setIsScanning(false)
    setScanProgress(100)
  }, [])

  // 放置模型
  const placeModel = useCallback((position) => {
    setPlacementPosition(position)
    setIsPlaced(true)
    setIsScanning(false)
  }, [])

  // 重置放置
  const resetPlacement = useCallback(() => {
    setIsPlaced(false)
    setPlacementPosition(null)
  }, [])

  // 开始录制
  const startRecording = useCallback(() => {
    setIsRecording(true)
    setRecordingProgress(0)
  }, [])

  // 更新录制进度
  const updateRecordingProgress = useCallback((progress) => {
    setRecordingProgress(progress)
  }, [])

  // 停止录制
  const stopRecording = useCallback(() => {
    setIsRecording(false)
    setRecordingProgress(0)
  }, [])

  // 清理资源
  const cleanup = useCallback(() => {
    setIsInitialized(false)
    setIsScanning(false)
    setIsPlaced(false)
    setIsRecording(false)
    setScanProgress(0)
    setRecordingProgress(0)
    setError(null)
  }, [])

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    // 状态
    mode,
    isInitialized,
    isLoading,
    error,
    isScanning,
    scanProgress,
    isPlaced,
    placementPosition,
    isRecording,
    recordingProgress,
    
    // 引用
    canvasRef,
    containerRef,
    
    // 方法
    initialize,
    switchMode,
    startScanning,
    updateScanProgress,
    completeScanning,
    placeModel,
    resetPlacement,
    startRecording,
    updateRecordingProgress,
    stopRecording,
    cleanup
  }
}

export default useARCore
