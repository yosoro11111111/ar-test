import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * 统一时间轴系统Hook
 * 管理时间轴轨道、播放、录制等功能
 */
export const useTimeline = (actions, playAction) => {
  // 轨道数据
  const [tracks, setTracks] = useState([])
  const [duration, setDuration] = useState(0)
  
  // 播放状态
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  
  // 录制状态
  const [isRecording, setIsRecording] = useState(false)
  
  // 播放控制
  const playIntervalRef = useRef(null)
  const lastTimeRef = useRef(0)

  // 添加轨道
  const addTrack = useCallback((action, startTime = null) => {
    const newTrack = {
      id: Date.now().toString(),
      actionId: action.id,
      actionName: action.name,
      actionIcon: action.icon,
      startTime: startTime !== null ? startTime : currentTime,
      duration: action.duration || 5000,
      data: action
    }
    
    setTracks(prev => [...prev, newTrack])
    
    // 更新总时长
    const newEndTime = newTrack.startTime + newTrack.duration
    setDuration(prev => Math.max(prev, newEndTime))
    
    return newTrack
  }, [currentTime])

  // 删除轨道
  const removeTrack = useCallback((trackId) => {
    setTracks(prev => prev.filter(t => t.id !== trackId))
  }, [])

  // 更新轨道
  const updateTrack = useCallback((trackId, updates) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, ...updates } : track
    ))
  }, [])

  // 移动轨道
  const moveTrack = useCallback((trackId, newStartTime) => {
    setTracks(prev => prev.map(track => {
      if (track.id === trackId) {
        return { ...track, startTime: newStartTime }
      }
      return track
    }))
  }, [])

  // 清空轨道
  const clearTracks = useCallback(() => {
    setTracks([])
    setDuration(0)
    setCurrentTime(0)
  }, [])

  // 开始播放
  const startPlayback = useCallback(() => {
    if (tracks.length === 0) return
    
    setIsPlaying(true)
    lastTimeRef.current = Date.now()
    
    playIntervalRef.current = setInterval(() => {
      const now = Date.now()
      const delta = (now - lastTimeRef.current) * playbackSpeed
      lastTimeRef.current = now
      
      setCurrentTime(prev => {
        const newTime = prev + delta
        
        // 检查是否有动作需要触发
        tracks.forEach(track => {
          if (track.startTime <= newTime && track.startTime > prev) {
            playAction(track.actionId)
          }
        })
        
        // 循环播放
        if (newTime >= duration) {
          return 0
        }
        
        return newTime
      })
    }, 16) // ~60fps
  }, [tracks, duration, playbackSpeed, playAction])

  // 暂停播放
  const pausePlayback = useCallback(() => {
    setIsPlaying(false)
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current)
      playIntervalRef.current = null
    }
  }, [])

  // 停止播放
  const stopPlayback = useCallback(() => {
    pausePlayback()
    setCurrentTime(0)
  }, [pausePlayback])

  // 跳转到指定时间
  seekTo = useCallback((time) => {
    setCurrentTime(Math.max(0, Math.min(time, duration)))
  }, [duration])

  // 设置播放速度
  const setSpeed = useCallback((speed) => {
    setPlaybackSpeed(Math.max(0.25, Math.min(speed, 2)))
  }, [])

  // 导出时间轴
  const exportTimeline = useCallback(() => {
    return {
      tracks,
      duration,
      exportTime: Date.now()
    }
  }, [tracks, duration])

  // 导入时间轴
  const importTimeline = useCallback((data) => {
    if (data.tracks) {
      setTracks(data.tracks)
    }
    if (data.duration) {
      setDuration(data.duration)
    }
    setCurrentTime(0)
  }, [])

  // 开始录制
  const startRecording = useCallback(() => {
    setIsRecording(true)
    // 从当前位置开始播放并录制
    if (!isPlaying) {
      startPlayback()
    }
  }, [isPlaying, startPlayback])

  // 停止录制
  const stopRecording = useCallback(() => {
    setIsRecording(false)
    pausePlayback()
  }, [pausePlayback])

  // 清理
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [])

  return {
    // 状态
    tracks,
    duration,
    currentTime,
    isPlaying,
    playbackSpeed,
    isRecording,
    
    // 轨道管理
    addTrack,
    removeTrack,
    updateTrack,
    moveTrack,
    clearTracks,
    
    // 播放控制
    startPlayback,
    pausePlayback,
    stopPlayback,
    seekTo,
    setSpeed,
    
    // 导入导出
    exportTimeline,
    importTimeline,
    
    // 录制
    startRecording,
    stopRecording
  }
}

export default useTimeline
