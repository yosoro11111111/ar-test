import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { useActionStore } from '../../../stores/actionStore'
import { getAllVRMAActions } from '../../../data/vrmaActions'
import { actionPresets, downloadPreset, readPresetFromFile } from '../../../data/actionPresets'
import RecordingManager from './RecordingManager'
import './TimelineEditor.css'

export const TimelineEditor = ({ onClose, onExecuteAction, isMobile, onPause, onResume, onStop }) => {
  // 获取所有动作
  const [actions, setActions] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  useEffect(() => {
    const loadActions = async () => {
      try {
        const actionList = await getAllVRMAActions()
        setActions(actionList)
      } catch (error) {
        console.error('加载动作失败:', error)
      }
    }
    loadActions()
  }, [])

  const {
    timeline,
    addTrack,
    updateTrack,
    removeTrack,
    setCurrentTime,
    isPlaying,
    setPlaying,
  } = useActionStore()
  
  const [zoom, setZoom] = useState(1)
  const [selectedTrack, setSelectedTrack] = useState(null)
  const [showActionSelector, setShowActionSelector] = useState(false)
  const [customPresets, setCustomPresets] = useState(() => {
    const saved = localStorage.getItem('customActionPresets')
    return saved ? JSON.parse(saved) : []
  })
  const [activeTab, setActiveTab] = useState('timeline')
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // 播放控制
  const [isPaused, setIsPaused] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState(null) // { current, total, fileName }
  const [isPreloading, setIsPreloading] = useState(false)
  const [preloadedActions, setPreloadedActions] = useState(new Set())
  
  // 录制控制
  const [isRecording, setIsRecording] = useState(false)
  const [recordingType, setRecordingType] = useState(null) // 'gif' 或 'video'
  const [recordingProgress, setRecordingProgress] = useState(0)
  const [showRecordingDialog, setShowRecordingDialog] = useState(false)
  const [recordingResult, setRecordingResult] = useState(null)
  
  const playbackRef = useRef(null)
  const timelineRef = useRef(null)
  const pausedTimeRef = useRef(0)
  const playedTracksRef = useRef(new Set())
  
  // 计算总时长 - 提前定义
  const totalDuration = useMemo(() => {
    if (timeline.tracks.length === 0) return 0
    return Math.max(...timeline.tracks.map(t => t.startTime + t.duration))
  }, [timeline.tracks])
  
  // 停止播放 - 提前定义，供其他函数使用
  const stopPlayback = useCallback(() => {
    setIsPaused(false)
    setPlaying(false)
    setCurrentTime(0)
    pausedTimeRef.current = 0
    playedTracksRef.current.clear()
    clearInterval(playbackRef.current)
    // 通知父组件停止
    onStop?.()
  }, [setPlaying, setCurrentTime, onStop])
  
  // 开始录制
  const startRecording = useCallback(async (type) => {
    // 获取 canvas
    const canvas = window.arCanvas || document.querySelector('canvas')
    if (!canvas) {
      alert('无法获取画布，请确保3D场景已加载')
      return
    }
    
    if (timeline.tracks.length === 0) {
      alert('请先添加动作到时间轴')
      return
    }
    
    // 设置录制状态
    setRecordingType(type)
    setIsRecording(true)
    setRecordingProgress(0)
    
    // 先预加载所有动作
    if (!isPreloading) {
      await preloadVRMAFiles(timeline.tracks)
    }
    
    // 隐藏时间轴
    setIsCollapsed(true)
    
    // 延迟一下让UI隐藏
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 开始播放时间轴
    setIsPaused(false)
    setPlaying(true)
    
    // 延迟一下等动作开始播放
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 显示录制对话框
    setShowRecordingDialog(true)
    
    // 开始录制
    const success = await RecordingManager.startRecording({
      type,
      canvas: canvas,
      duration: totalDuration || 5000,
      onProgress: (percent) => {
        setRecordingProgress(percent)
      },
      onComplete: (result) => {
        setRecordingResult(result)
        setIsRecording(false)
        // 停止播放
        stopPlayback()
      },
      onError: (error) => {
        console.error('录制失败:', error)
        alert('录制失败: ' + error.message)
        setIsRecording(false)
        setIsCollapsed(false)
        stopPlayback()
      }
    })
    
    if (!success) {
      setIsRecording(false)
      setIsCollapsed(false)
      stopPlayback()
    }
  }, [timeline.tracks, isPreloading, totalDuration, setPlaying, stopPlayback])
  
  // 停止录制
  const stopRecording = useCallback(() => {
    RecordingManager.stopRecording()
    setIsRecording(false)
  }, [])
  
  // 下载录制文件
  const downloadRecording = useCallback(() => {
    if (recordingResult) {
      RecordingManager.downloadFile(recordingResult.url, recordingResult.filename)
    }
  }, [recordingResult])
  
  // 关闭录制对话框
  const closeRecordingDialog = useCallback(() => {
    setShowRecordingDialog(false)
    setRecordingResult(null)
    setRecordingProgress(0)
    setIsCollapsed(false)
  }, [])

  // 合并预设和自定义预设
  const allPresets = useMemo(() => [...actionPresets, ...customPresets], [customPresets])

  // 获取动作分类
  const categories = useMemo(() => {
    const cats = new Set(actions.map(a => a.category?.split('-')[0] || '其他'))
    return ['all', ...Array.from(cats)]
  }, [actions])

  // 过滤动作
  const filteredActions = useMemo(() => {
    return actions.filter(action => {
      const matchesSearch = action.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || 
        (action.category?.includes(selectedCategory))
      return matchesSearch && matchesCategory
    })
  }, [actions, searchQuery, selectedCategory])

  // 预加载 VRMA 文件
  const preloadVRMAFiles = useCallback(async (tracks) => {
    setIsPreloading(true)
    setLoadingStatus({ current: 0, total: tracks.length, fileName: '' })
    
    const loaded = new Set()
    
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i]
      const fileName = track.data?.filePath?.replace('/motion/', '') || 
                       track.data?.id?.replace('vrma_', '') + '.vrma'
      
      setLoadingStatus({ 
        current: i + 1, 
        total: tracks.length, 
        fileName: track.name 
      })
      
      try {
        // 检查是否已缓存
        if (!preloadedActions.has(fileName)) {
          const response = await fetch(`/motion/${fileName}`)
          if (response.ok) {
            const data = await response.json()
            loaded.add(fileName)
            console.log(`✅ 预加载完成: ${fileName}`)
          }
        }
      } catch (error) {
        console.warn(`⚠️ 预加载失败: ${fileName}`, error)
      }
      
      // 小延迟让UI更新
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    setPreloadedActions(prev => new Set([...prev, ...loaded]))
    setIsPreloading(false)
    setLoadingStatus(null)
    
    return loaded
  }, [preloadedActions])

  // 播放时间轴
  const startPlayback = useCallback(async () => {
    if (timeline.tracks.length === 0) {
      alert('请先添加动作到时间轴')
      return
    }
    
    // 先预加载
    if (!isPaused) {
      await preloadVRMAFiles(timeline.tracks)
    }
    
    setIsPaused(false)
    setPlaying(true)
    
    // 移动端播放后关闭时间轴
    if (isMobile) {
      setTimeout(() => onClose?.(), 500)
    }
  }, [timeline.tracks, isPaused, preloadVRMAFiles, setPlaying, isMobile, onClose])

  // 暂停播放
  const pausePlayback = useCallback(() => {
    setIsPaused(true)
    setPlaying(false)
    pausedTimeRef.current = timeline.currentTime
    clearInterval(playbackRef.current)
    // 通知父组件暂停
    onPause?.()
  }, [setPlaying, timeline.currentTime, onPause])

  // 继续播放
  const resumePlayback = useCallback(async () => {
    setIsPaused(false)
    setPlaying(true)
    // 通知父组件继续
    onResume?.()
    
    // 移动端播放后关闭时间轴
    if (isMobile) {
      setTimeout(() => onClose?.(), 500)
    }
  }, [setPlaying, onResume, isMobile, onClose])

  // 播放循环
  useEffect(() => {
    if (isPlaying && !isPaused) {
      const startTime = Date.now() - timeline.currentTime
      
      playbackRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime
        const duration = totalDuration || 30000
        
        if (elapsed >= duration) {
          // 播放结束
          stopPlayback()
          playedTracksRef.current.clear() // 清除已播放记录
          
          // 移动端播放结束后关闭时间轴
          if (isMobile) {
            setTimeout(() => onClose?.(), 500)
          }
        } else {
          setCurrentTime(elapsed)
          // 检查是否有动作需要触发（按顺序，只触发一次）
          timeline.tracks.forEach(track => {
            // 只在动作开始时间点触发，且只触发一次
            if (elapsed >= track.startTime && 
                elapsed < track.startTime + 150 && 
                !playedTracksRef.current.has(track.id)) {
              playedTracksRef.current.add(track.id)
              onExecuteAction?.(track.data)
            }
          })
        }
      }, 50) // 更频繁的检查
    } else {
      clearInterval(playbackRef.current)
    }
    
    return () => clearInterval(playbackRef.current)
  }, [isPlaying, isPaused, totalDuration, timeline.tracks, timeline.currentTime, setCurrentTime, stopPlayback, onExecuteAction, isMobile, onClose])

  // 重置播放时清除已播放记录
  useEffect(() => {
    if (!isPlaying && !isPaused) {
      playedTracksRef.current.clear()
    }
  }, [isPlaying, isPaused])

  // 添加动作到时间轴 - 选择后不关闭弹窗
  const [addedActionName, setAddedActionName] = useState(null)
  
  const addActionToTimeline = useCallback((action, startTime = timeline.currentTime) => {
    const newTrack = {
      id: Date.now().toString(),
      type: 'action',
      name: action.name,
      actionId: action.id,
      startTime,
      duration: action.duration || 5000,
      data: action
    }
    addTrack(newTrack)
    // 不关闭弹窗，允许连续添加
    
    // 显示添加成功提示
    setAddedActionName(action.name)
    setTimeout(() => setAddedActionName(null), 1500)
    
    // 移动端添加后关闭时间轴
    if (isMobile) {
      setTimeout(() => onClose?.(), 300)
    }
  }, [addTrack, timeline.currentTime, isMobile, onClose])

  // 应用预设到时间轴
  const applyPreset = useCallback((preset) => {
    // 清除现有轨道
    timeline.tracks.forEach(track => removeTrack(track.id))
    
    // 添加预设中的动作
    preset.actions.forEach((action, index) => {
      setTimeout(() => {
        // 构建正确的文件路径
        // 优先使用 fileName，否则从 actionId 提取
        const fileName = action.fileName || action.actionId.replace('vrma_', '')
        const filePath = `/motion/${fileName}.vrma`
        
        addTrack({
          id: `preset_${Date.now()}_${index}`,
          type: 'action',
          name: action.name,
          actionId: action.actionId,
          startTime: action.startTime,
          duration: action.duration,
          data: { 
            id: action.actionId, 
            name: action.name, 
            duration: action.duration,
            filePath: filePath
          }
        })
      }, index * 50)
    })
    
    setActiveTab('timeline')
    
    // 移动端应用后关闭
    if (isMobile) {
      setTimeout(() => onClose?.(), 500)
    }
  }, [addTrack, removeTrack, timeline.tracks, isMobile, onClose])

  // 上移轨道
  const moveTrackUp = useCallback((trackId) => {
    const index = timeline.tracks.findIndex(t => t.id === trackId)
    if (index > 0) {
      const newTracks = [...timeline.tracks]
      const temp = newTracks[index]
      newTracks[index] = newTracks[index - 1]
      newTracks[index - 1] = temp
      // 更新顺序但不改变时间
      newTracks.forEach((track, i) => {
        updateTrack(track.id, { order: i })
      })
    }
  }, [timeline.tracks, updateTrack])

  // 下移轨道
  const moveTrackDown = useCallback((trackId) => {
    const index = timeline.tracks.findIndex(t => t.id === trackId)
    if (index < timeline.tracks.length - 1) {
      const newTracks = [...timeline.tracks]
      const temp = newTracks[index]
      newTracks[index] = newTracks[index + 1]
      newTracks[index + 1] = temp
      newTracks.forEach((track, i) => {
        updateTrack(track.id, { order: i })
      })
    }
  }, [timeline.tracks, updateTrack])

  // 复制轨道
  const duplicateTrack = useCallback((track) => {
    const newTrack = {
      ...track,
      id: Date.now().toString(),
      startTime: track.startTime + track.duration + 500 // 在原动作后500ms
    }
    addTrack(newTrack)
  }, [addTrack])

  // 删除轨道
  const deleteTrack = useCallback((trackId) => {
    removeTrack(trackId)
    if (selectedTrack === trackId) {
      setSelectedTrack(null)
    }
  }, [removeTrack, selectedTrack])

  // 导出当前时间轴为预设 - 保存真实vrma文件名
  const exportCurrentTimeline = useCallback(() => {
    const preset = {
      id: `custom_${Date.now()}`,
      name: `自定义预设 ${customPresets.length + 1}`,
      description: '从时间轴导出的自定义预设',
      tags: ['自定义', '导出'],
      actions: timeline.tracks.map(track => {
        // 提取真实的vrma文件名
        const fileName = track.data?.filePath?.replace('/motion/', '').replace('.vrma', '') ||
                         track.actionId.replace('vrma_', '')
        return {
          actionId: track.actionId,
          fileName: fileName, // 保存真实文件名
          name: track.name,
          startTime: track.startTime,
          duration: track.duration
        }
      })
    }
    
    const updatedPresets = [...customPresets, preset]
    setCustomPresets(updatedPresets)
    localStorage.setItem('customActionPresets', JSON.stringify(updatedPresets))
    downloadPreset(preset)
  }, [timeline.tracks, customPresets])

  // 导入预设文件
  const handleImportPreset = useCallback(async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    try {
      const preset = await readPresetFromFile(file)
      const updatedPresets = [...customPresets, preset]
      setCustomPresets(updatedPresets)
      localStorage.setItem('customActionPresets', JSON.stringify(updatedPresets))
      alert(`成功导入预设: ${preset.name}`)
    } catch (error) {
      alert('导入失败: ' + error.message)
    }
    
    e.target.value = ''
  }, [customPresets])

  // 调整轨道时间
  const handleTrackTimeChange = useCallback((trackId, newStartTime) => {
    updateTrack(trackId, { startTime: Math.max(0, newStartTime) })
  }, [updateTrack])

  // 调整轨道时长
  const handleTrackDurationChange = useCallback((trackId, newDuration) => {
    updateTrack(trackId, { duration: Math.max(1000, newDuration) })
  }, [updateTrack])

  // 获取选中的轨道
  const selectedTrackData = useMemo(() => {
    return timeline.tracks.find(t => t.id === selectedTrack)
  }, [timeline.tracks, selectedTrack])

  if (isCollapsed) {
    return (
      <div className={`timeline-editor-collapsed ${isMobile ? 'mobile' : ''}`}>
        <button 
          className="expand-btn"
          onClick={() => setIsCollapsed(false)}
          title="展开时间轴"
        >
          ⏱️ {isMobile ? '' : '时间轴'}
        </button>
      </div>
    )
  }

  return (
    <div className={`timeline-editor-tabbed ${isMobile ? 'mobile' : ''}`}>
      {/* 折叠按钮 */}
      <button 
        className="collapse-btn"
        onClick={() => setIsCollapsed(true)}
        title="折叠时间轴"
      >
        {isMobile ? '▼' : '✕'}
      </button>

      {/* 页签导航 */}
      <div className="timeline-tabs">
        <button 
          className={`timeline-tab ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          ⏱️ 时间轴
        </button>
        <button 
          className={`timeline-tab ${activeTab === 'presets' ? 'active' : ''}`}
          onClick={() => setActiveTab('presets')}
        >
          📋 样板
        </button>
        <button 
          className={`timeline-tab ${activeTab === 'record' ? 'active' : ''}`}
          onClick={() => setActiveTab('record')}
        >
          📹 录制
        </button>
      </div>

      {/* 时间轴内容 */}
      {activeTab === 'timeline' && (
        <div className="timeline-content">
          {/* 工具栏 - 统一按钮大小 */}
          <div className="timeline-toolbar-compact">
            {/* 播放/暂停/停止按钮 */}
            {isPlaying ? (
              <button 
                className="tool-btn-compact playing"
                onClick={pausePlayback}
                title="暂停"
              >
                ⏸️
              </button>
            ) : (
              <button 
                className={`tool-btn-compact ${isPaused ? 'paused' : ''}`}
                onClick={isPaused ? resumePlayback : startPlayback}
                disabled={timeline.tracks.length === 0 || isPreloading}
                title={isPaused ? '继续' : '播放'}
              >
                {isPreloading ? '⏳' : (isPaused ? '▶️' : '▶️')}
              </button>
            )}
            
            <button 
              className="tool-btn-compact"
              onClick={stopPlayback}
              disabled={!isPlaying && !isPaused}
              title="停止"
            >
              ⏹️
            </button>
            
            <span className="time-display-compact">
              {formatTime(timeline.currentTime)}
              {isPaused && <span className="pause-indicator"> (暂停)</span>}
            </span>
            
            <div className="toolbar-spacer" />
            
            <button 
              className="tool-btn-compact add-btn"
              onClick={() => setShowActionSelector(true)}
              title="添加动作"
            >
              ➕
            </button>
            
            {!isMobile && (
              <>
                <button 
                  className="tool-btn-compact export-btn"
                  onClick={exportCurrentTimeline}
                  title="导出"
                >
                  💾
                </button>
                <label className="tool-btn-compact import-btn" title="导入">
                  📥
                  <input
                    type="file"
                    accept=".ymmd"
                    style={{ display: 'none' }}
                    onChange={handleImportPreset}
                  />
                </label>
              </>
            )}
          </div>

          {/* 加载状态显示 */}
          {isPreloading && loadingStatus && (
            <div className="loading-status-bar">
              <div className="loading-progress">
                <div 
                  className="loading-progress-bar" 
                  style={{ width: `${(loadingStatus.current / loadingStatus.total) * 100}%` }}
                />
              </div>
              <span className="loading-text">
                预加载中... {loadingStatus.current}/{loadingStatus.total} - {loadingStatus.fileName}
              </span>
            </div>
          )}

          {/* 轨道列表 */}
          <div className="timeline-tracks-area" ref={timelineRef}>
            {timeline.tracks.length === 0 ? (
              <div className="empty-timeline-compact">
                <p>点击 ➕ 添加动作</p>
                <p>或切换到"样板"选择预设</p>
              </div>
            ) : (
              <div className="tracks-list">
                {timeline.tracks.map((track, index) => (
                  <div 
                    key={track.id}
                    className={`track-compact ${selectedTrack === track.id ? 'selected' : ''}`}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      setSelectedTrack(track.id);
                    }}
                  >
                    <div className="track-main">
                      <span className="track-number">{index + 1}</span>
                      <span className="track-name-compact">{track.name}</span>
                      <div className="track-time-controls">
                        <input
                          type="number"
                          value={Math.round(track.startTime / 100) / 10}
                          onChange={(e) => handleTrackTimeChange(track.id, parseFloat(e.target.value) * 1000)}
                          onClick={(e) => e.stopPropagation()}
                          min="0"
                          step="0.1"
                        />
                        <span>s</span>
                        <input
                          type="number"
                          value={Math.round(track.duration / 100) / 10}
                          onChange={(e) => handleTrackDurationChange(track.id, parseFloat(e.target.value) * 1000)}
                          onClick={(e) => e.stopPropagation()}
                          min="0.1"
                          step="0.1"
                        />
                        <span>s</span>
                      </div>
                    </div>
                    
                    {/* 选中后的操作按钮 - 统一大小 */}
                    {selectedTrack === track.id && (
                      <div className="track-actions-bar">
                        <button 
                          className="track-action-btn"
                          onPointerDown={(e) => { e.stopPropagation(); moveTrackUp(track.id) }}
                          disabled={index === 0}
                          title="上移"
                        >
                          ↑
                        </button>
                        <button 
                          className="track-action-btn"
                          onPointerDown={(e) => { e.stopPropagation(); moveTrackDown(track.id) }}
                          disabled={index === timeline.tracks.length - 1}
                          title="下移"
                        >
                          ↓
                        </button>
                        <button 
                          className="track-action-btn"
                          onPointerDown={(e) => { e.stopPropagation(); duplicateTrack(track) }}
                          title="复制"
                        >
                          📋
                        </button>
                        <button 
                          className="track-action-btn delete"
                          onPointerDown={(e) => { e.stopPropagation(); deleteTrack(track.id) }}
                          title="删除"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 预设内容 */}
      {activeTab === 'presets' && (
        <div className="presets-content">
          <div className="presets-grid">
            {allPresets.map((preset) => (
              <div
                key={preset.id}
                className="preset-card"
                onClick={() => applyPreset(preset)}
              >
                <div className="preset-card-header">
                  <span className="preset-card-name">{preset.name}</span>
                  <span className="preset-card-count">{preset.actions.length}</span>
                </div>
                <p className="preset-card-desc">{preset.description}</p>
                <button 
                  className="apply-preset-btn-compact"
                  onClick={(e) => {
                    e.stopPropagation()
                    applyPreset(preset)
                  }}
                >
                  应用
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 录制内容 */}
      {activeTab === 'record' && (
        <div className="record-content">
          <div className="record-info">
            <h3>📹 录制功能</h3>
            <p>录制 3D 场景和动作，保存为 GIF 或视频文件</p>
            {timeline.tracks.length === 0 ? (
              <p className="record-warning">⚠️ 请先添加动作到时间轴</p>
            ) : (
              <p className="record-ready">✅ 已就绪，共 {timeline.tracks.length} 个动作</p>
            )}
          </div>
          
          <div className="record-buttons">
            <button 
              className="record-btn gif"
              onClick={() => startRecording('gif')}
              disabled={isRecording || timeline.tracks.length === 0}
            >
              <span className="record-icon">🎞️</span>
              <span className="record-label">录制 GIF</span>
              <span className="record-desc">适合分享表情包</span>
            </button>
            
            <button 
              className="record-btn video"
              onClick={() => startRecording('video')}
              disabled={isRecording || timeline.tracks.length === 0}
            >
              <span className="record-icon">🎥</span>
              <span className="record-label">录制视频</span>
              <span className="record-desc">WebM 格式高清视频</span>
            </button>
          </div>
          
          <div className="record-tips">
            <h4>💡 使用提示</h4>
            <ul>
              <li>录制前会自动预加载所有动作</li>
              <li>录制时会隐藏时间轴界面</li>
              <li>GIF 适合短片段，视频适合长片段</li>
              <li>录制完成后可下载文件</li>
            </ul>
          </div>
        </div>
      )}

      {/* 添加成功提示 */}
      {addedActionName && (
        <div className="action-added-toast">
          ✅ 已添加: {addedActionName}
        </div>
      )}

      {/* 动作选择器弹窗 - 优化版本 */}
      {showActionSelector && (
        <div className="action-selector-overlay" onClick={() => setShowActionSelector(false)}>
          <div className={`action-selector-modal-compact ${isMobile ? 'mobile' : ''}`} onClick={e => e.stopPropagation()}>
            <div className="selector-header-compact">
              <h4>添加动作</h4>
              <button onClick={() => setShowActionSelector(false)}>✕</button>
            </div>
            
            {/* 搜索和分类 */}
            <div className="selector-filters">
              <input
                type="text"
                className="selector-search"
                placeholder="搜索动作..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select 
                className="selector-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">全部分类</option>
                {categories.filter(c => c !== 'all').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className={`selector-actions-compact ${isMobile ? 'mobile' : ''}`}>
              {filteredActions.length === 0 ? (
                <div className="no-actions">没有找到匹配的动作</div>
              ) : (
                filteredActions.map((action) => (
                  <button
                    key={action.id}
                    className="selector-action-btn-compact"
                    onClick={() => addActionToTimeline(action)}
                    title={action.category}
                  >
                    <span>{action.icon || '🎭'}</span>
                    <span>{action.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 录制对话框 */}
      {showRecordingDialog && (
        <div className="recording-overlay" onClick={closeRecordingDialog}>
          <div className={`recording-modal ${isMobile ? 'mobile' : ''}`} onClick={e => e.stopPropagation()}>
            <div className="recording-header">
              <h4>
                {recordingType === 'gif' ? '🎞️ 录制GIF' : '🎥 录制视频'}
              </h4>
              {!isRecording && (
                <button onClick={closeRecordingDialog}>✕</button>
              )}
            </div>
            
            <div className="recording-content">
              {isRecording ? (
                <>
                  <div className="recording-progress">
                    <div 
                      className="recording-progress-bar" 
                      style={{ width: `${recordingProgress}%` }}
                    />
                  </div>
                  <p className="recording-status">
                    录制中... {Math.round(recordingProgress)}%
                  </p>
                  <button 
                    className="recording-stop-btn"
                    onClick={stopRecording}
                  >
                    ⏹️ 停止录制
                  </button>
                </>
              ) : recordingResult ? (
                <>
                  <div className="recording-success">
                    <span className="success-icon">✅</span>
                    <p>录制完成！</p>
                    <p className="file-info">
                      文件: {recordingResult.filename}
                    </p>
                  </div>
                  <div className="recording-actions">
                    <button 
                      className="recording-download-btn"
                      onClick={downloadRecording}
                    >
                      💾 下载文件
                    </button>
                    <button 
                      className="recording-close-btn"
                      onClick={closeRecordingDialog}
                    >
                      关闭
                    </button>
                  </div>
                </>
              ) : (
                <p>准备就绪</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 格式化时间
function formatTime(ms) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  const remainingMs = Math.floor((ms % 1000) / 10)
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${remainingMs.toString().padStart(2, '0')}`
}

export default TimelineEditor
