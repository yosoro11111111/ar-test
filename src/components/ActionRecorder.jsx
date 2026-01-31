import React, { useState, useRef, useCallback, useEffect } from 'react'
import './ActionRecorder.css'

// 动作录制器组件
const ActionRecorder = ({ isOpen, onClose, onPlayRecording, onPlayAction, actions, isMobile }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedActions, setRecordedActions] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingName, setRecordingName] = useState('')
  const [savedRecordings, setSavedRecordings] = useState(() => {
    const saved = localStorage.getItem('actionRecordings')
    return saved ? JSON.parse(saved) : []
  })
  const [currentTime, setCurrentTime] = useState(0)
  const recordingStartTime = useRef(null)
  const playbackTimer = useRef(null)

  // 开始录制
  const startRecording = useCallback(() => {
    setIsRecording(true)
    setRecordedActions([])
    recordingStartTime.current = Date.now()
    setCurrentTime(0)
  }, [])

  // 停止录制
  const stopRecording = useCallback(() => {
    setIsRecording(false)
    recordingStartTime.current = null
    setCurrentTime(0)
  }, [])

  // 添加动作到录制
  const addAction = useCallback((action) => {
    if (!isRecording || !recordingStartTime.current) return

    const timestamp = Date.now() - recordingStartTime.current
    setRecordedActions(prev => [...prev, {
      actionId: action.id,
      actionName: action.name,
      timestamp,
      duration: action.duration || 3000
    }])
  }, [isRecording])

  // 播放录制
  const playRecording = useCallback(async (recording = recordedActions) => {
    if (recording.length === 0 || isPlaying) return

    setIsPlaying(true)
    let currentIndex = 0

    const playNext = () => {
      if (currentIndex >= recording.length) {
        setIsPlaying(false)
        return
      }

      const item = recording[currentIndex]
      const action = actions.find(a => a.id === item.actionId)

      if (action) {
        onPlayAction?.(action)
      }

      currentIndex++
      const nextItem = recording[currentIndex]
      if (nextItem) {
        const waitTime = nextItem.timestamp - item.timestamp
        playbackTimer.current = setTimeout(playNext, Math.max(waitTime, 500))
      } else {
        setTimeout(() => setIsPlaying(false), item.duration || 3000)
      }
    }

    // 延迟开始，给用户准备时间
    playbackTimer.current = setTimeout(playNext, 500)
  }, [recordedActions, isPlaying, actions, onPlayAction])

  // 停止播放
  const stopPlayback = useCallback(() => {
    clearTimeout(playbackTimer.current)
    setIsPlaying(false)
  }, [])

  // 保存录制
  const saveRecording = useCallback(() => {
    if (recordedActions.length === 0 || !recordingName.trim()) return

    const newRecording = {
      id: Date.now(),
      name: recordingName.trim(),
      actions: recordedActions,
      createdAt: new Date().toISOString(),
      totalDuration: recordedActions[recordedActions.length - 1]?.timestamp || 0
    }

    const updated = [...savedRecordings, newRecording]
    setSavedRecordings(updated)
    localStorage.setItem('actionRecordings', JSON.stringify(updated))
    setRecordingName('')
    alert('录制已保存！')
  }, [recordedActions, recordingName, savedRecordings])

  // 删除录制
  const deleteRecording = useCallback((id) => {
    if (!window.confirm('确定要删除这个录制吗？')) return

    const updated = savedRecordings.filter(r => r.id !== id)
    setSavedRecordings(updated)
    localStorage.setItem('actionRecordings', JSON.stringify(updated))
  }, [savedRecordings])

  // 加载录制
  const loadRecording = useCallback((recording) => {
    setRecordedActions(recording.actions)
    setRecordingName(recording.name)
  }, [])

  // 清空当前录制
  const clearRecording = useCallback(() => {
    if (!window.confirm('确定要清空当前录制吗？')) return
    setRecordedActions([])
    setRecordingName('')
  }, [])

  // 格式化时间
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // 更新录制时间显示
  useEffect(() => {
    let interval
    if (isRecording) {
      interval = setInterval(() => {
        if (recordingStartTime.current) {
          setCurrentTime(Date.now() - recordingStartTime.current)
        }
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  // 清理定时器
  useEffect(() => {
    return () => {
      clearTimeout(playbackTimer.current)
    }
  }, [])

  if (!isOpen) return null

  return (
    <div className="action-recorder-overlay" onClick={onClose}>
      <div className={`action-recorder ${isMobile ? 'mobile' : ''}`} onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="recorder-header">
          <h3>🎬 动作录制器</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* 录制控制区 */}
        <div className="recording-controls">
          <div className="recording-status">
            {isRecording ? (
              <div className="recording-indicator">
                <span className="recording-dot"></span>
                <span>录制中 {formatTime(currentTime)}</span>
              </div>
            ) : isPlaying ? (
              <div className="playing-indicator">
                <span>▶ 播放中...</span>
              </div>
            ) : (
              <div className="ready-indicator">
                <span>准备就绪</span>
              </div>
            )}
          </div>

          <div className="control-buttons">
            {!isRecording ? (
              <button
                className="record-btn"
                onClick={startRecording}
                disabled={isPlaying}
              >
                🔴 开始录制
              </button>
            ) : (
              <button
                className="stop-btn"
                onClick={stopRecording}
              >
                ⏹ 停止录制
              </button>
            )}

            {recordedActions.length > 0 && !isRecording && (
              <>
                <button
                  className="play-btn"
                  onClick={() => playRecording()}
                  disabled={isPlaying}
                >
                  {isPlaying ? '⏹ 停止' : '▶ 播放'}
                </button>
                <button
                  className="clear-btn"
                  onClick={clearRecording}
                  disabled={isPlaying}
                >
                  🗑️ 清空
                </button>
              </>
            )}
          </div>
        </div>

        {/* 录制时间轴 */}
        {recordedActions.length > 0 && (
          <div className="timeline">
            <h4>录制时间轴</h4>
            <div className="timeline-track">
              {recordedActions.map((item, index) => (
                <div
                  key={index}
                  className="timeline-item"
                  style={{ left: `${(item.timestamp / 30000) * 100}%` }}
                  title={`${item.actionName} @ ${formatTime(item.timestamp)}`}
                >
                  <div className="timeline-marker"></div>
                  <span className="timeline-label">{item.actionName}</span>
                </div>
              ))}
            </div>
            <div className="timeline-actions">
              {recordedActions.map((item, index) => (
                <div key={index} className="action-item">
                  <span>{index + 1}. {item.actionName}</span>
                  <span className="timestamp">{formatTime(item.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 保存录制 */}
        {recordedActions.length > 0 && !isRecording && (
          <div className="save-section">
            <input
              type="text"
              value={recordingName}
              onChange={(e) => setRecordingName(e.target.value)}
              placeholder="输入录制名称..."
              className="recording-name-input"
            />
            <button
              className="save-btn"
              onClick={saveRecording}
              disabled={!recordingName.trim()}
            >
              💾 保存录制
            </button>
          </div>
        )}

        {/* 已保存的录制 */}
        {savedRecordings.length > 0 && (
          <div className="saved-recordings">
            <h4>已保存的录制</h4>
            <div className="recordings-list">
              {savedRecordings.map(recording => (
                <div key={recording.id} className="recording-card">
                  <div className="recording-info">
                    <span className="recording-name">{recording.name}</span>
                    <span className="recording-meta">
                      {recording.actions.length} 个动作 · {formatTime(recording.totalDuration)}
                    </span>
                  </div>
                  <div className="recording-actions">
                    <button onClick={() => loadRecording(recording)}>📂 加载</button>
                    <button onClick={() => playRecording(recording.actions)}>▶ 播放</button>
                    <button onClick={() => deleteRecording(recording.id)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <div className="recorder-help">
          <h4>💡 使用说明</h4>
          <ol>
            <li>点击"开始录制"按钮开始录制</li>
            <li>在底部动作栏点击动作，动作会被记录到时间轴</li>
            <li>点击"停止录制"结束录制</li>
            <li>可以播放预览、保存录制或重新录制</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default ActionRecorder
