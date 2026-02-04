import { useState, useCallback, useRef } from 'react'

/**
 * 统一录制系统Hook
 * 管理视频/GIF录制功能
 */
export const useRecording = (canvasRef) => {
  // 录制状态
  const [isRecording, setIsRecording] = useState(false)
  const [recordingType, setRecordingType] = useState(null) // 'video' | 'gif'
  const [recordingProgress, setRecordingProgress] = useState(0)
  const [recordingDuration, setRecordingDuration] = useState(0)
  
  // 录制器引用
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])
  const recordingStartTimeRef = useRef(0)
  const recordingTimerRef = useRef(null)

  // 开始录制
  const startRecording = useCallback(async (type = 'video', duration = 5000) => {
    if (!canvasRef.current) {
      console.warn('无法录制: 画布未初始化')
      return false
    }
    
    try {
      setRecordingType(type)
      setRecordingDuration(duration)
      setRecordingProgress(0)
      recordedChunksRef.current = []
      
      if (type === 'video') {
        // 视频录制
        const stream = canvasRef.current.captureStream(30) // 30fps
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9'
        })
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data)
          }
        }
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
          const url = URL.createObjectURL(blob)
          
          // 下载
          const a = document.createElement('a')
          a.href = url
          a.download = `ar-recording-${Date.now()}.webm`
          a.click()
          
          URL.revokeObjectURL(url)
        }
        
        mediaRecorder.start(100) // 每100ms收集数据
        mediaRecorderRef.current = mediaRecorder
        
      } else if (type === 'gif') {
        // GIF录制需要额外的库，这里先预留接口
        console.log('GIF录制需要加载额外库')
      }
      
      setIsRecording(true)
      recordingStartTimeRef.current = Date.now()
      
      // 更新进度
      recordingTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - recordingStartTimeRef.current
        const progress = Math.min(100, (elapsed / duration) * 100)
        setRecordingProgress(progress)
        
        if (elapsed >= duration) {
          stopRecording()
        }
      }, 100)
      
      return true
    } catch (error) {
      console.error('开始录制失败:', error)
      return false
    }
  }, [canvasRef])

  // 停止录制
  const stopRecording = useCallback(() => {
    if (!isRecording) return
    
    // 清除计时器
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    
    // 停止录制器
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    
    setIsRecording(false)
    setRecordingProgress(100)
    
    // 重置
    setTimeout(() => {
      setRecordingProgress(0)
      setRecordingType(null)
    }, 1000)
  }, [isRecording])

  // 暂停录制
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
    }
  }, [])

  // 恢复录制
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
    }
  }, [])

  // 拍照
  const takeScreenshot = useCallback(() => {
    if (!canvasRef.current) {
      console.warn('无法拍照: 画布未初始化')
      return null
    }
    
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png')
      
      // 下载
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `ar-screenshot-${Date.now()}.png`
      a.click()
      
      return dataUrl
    } catch (error) {
      console.error('拍照失败:', error)
      return null
    }
  }, [canvasRef])

  return {
    // 状态
    isRecording,
    recordingType,
    recordingProgress,
    recordingDuration,
    
    // 方法
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    takeScreenshot
  }
}

export default useRecording
