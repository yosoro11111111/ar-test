import React, { useRef, useState, useCallback, useEffect } from 'react'
import './VideoRecorder.css'

// 视频录制组件 - 支持录制3D模型和摄像头画面
// 重构版本：添加倒计时功能，录制时UI自动隐藏
export const VideoRecorder = ({ 
  isOpen, 
  onClose, 
  canvasRef, 
  videoRef,
  isMobile,
  onRecordingStart,
  onRecordingStop
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordedVideos, setRecordedVideos] = useState(() => {
    const saved = localStorage.getItem('ar-recorded-videos')
    return saved ? JSON.parse(saved) : []
  })
  const [quality, setQuality] = useState('1080p')
  const [includeAudio, setIncludeAudio] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [countdown, setCountdown] = useState(0)
  const [showUI, setShowUI] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])
  const timerRef = useRef(null)
  const countdownRef = useRef(null)
  const streamRef = useRef(null)
  const pauseTimeRef = useRef(0)

  // 保存录制历史到本地存储
  useEffect(() => {
    localStorage.setItem('ar-recorded-videos', JSON.stringify(recordedVideos))
  }, [recordedVideos])

  // 获取分辨率设置
  const getResolution = () => {
    switch(quality) {
      case '720p': return { width: 1280, height: 720 }
      case '1080p': return { width: 1920, height: 1080 }
      case '4K': return { width: 3840, height: 2160 }
      default: return { width: 1920, height: 1080 }
    }
  }

  // 创建合成画布流
  const createCompositeStream = async () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const { width, height } = getResolution()
    
    canvas.width = width
    canvas.height = height
    
    // 获取Three.js画布 - 从 glRef 获取实际渲染的画布
    let threeCanvas = null
    
    // 首先尝试从 canvasRef 获取 domElement (React Three Fiber 的 gl 对象)
    if (canvasRef?.current?.domElement) {
      threeCanvas = canvasRef.current.domElement
    } else if (canvasRef?.current instanceof HTMLCanvasElement) {
      // canvasRef 直接是 canvas 元素
      threeCanvas = canvasRef.current
    }
    
    // 如果还是没有，尝试从 DOM 查找 Three.js canvas
    if (!threeCanvas) {
      threeCanvas = document.querySelector('canvas[data-engine]') || 
                   document.querySelector('.r3f-canvas') ||
                   document.querySelector('canvas[style*="display: block"]') ||
                   document.querySelector('canvas')
    }
    
    const video = videoRef?.current
    
    if (!threeCanvas) {
      console.error('可用的canvas:', {
        canvasRef: canvasRef?.current,
        queryCanvas: document.querySelector('canvas[data-engine]'),
        allCanvas: document.querySelectorAll('canvas')
      })
      throw new Error('3D画布未找到，请确保模型已加载')
    }
    
    console.log('找到Three.js画布:', threeCanvas, '尺寸:', threeCanvas.width, 'x', threeCanvas.height)

    // 绘制循环
    const drawFrame = () => {
      // 清空画布
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, width, height)
      
      // 绘制视频背景（如果有）
      if (video && video.readyState >= 2 && video.videoWidth > 0) {
        const videoAspect = video.videoWidth / video.videoHeight
        const canvasAspect = width / height
        
        let drawWidth, drawHeight, offsetX, offsetY
        
        if (videoAspect > canvasAspect) {
          drawHeight = height
          drawWidth = height * videoAspect
          offsetX = (width - drawWidth) / 2
          offsetY = 0
        } else {
          drawWidth = width
          drawHeight = width / videoAspect
          offsetX = 0
          offsetY = (height - drawHeight) / 2
        }
        
        ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight)
      }
      
      // 绘制3D模型（叠加在视频上方）- 保持原始比例
      const threeCanvasAspect = threeCanvas.width / threeCanvas.height
      const outputAspect = width / height
      
      let modelDrawWidth, modelDrawHeight, modelOffsetX, modelOffsetY
      
      if (threeCanvasAspect > outputAspect) {
        // 3D画布更宽，以宽度为基准
        modelDrawWidth = width
        modelDrawHeight = width / threeCanvasAspect
        modelOffsetX = 0
        modelOffsetY = (height - modelDrawHeight) / 2
      } else {
        // 3D画布更高，以高度为基准
        modelDrawHeight = height
        modelDrawWidth = height * threeCanvasAspect
        modelOffsetX = (width - modelDrawWidth) / 2
        modelOffsetY = 0
      }
      
      ctx.drawImage(threeCanvas, modelOffsetX, modelOffsetY, modelDrawWidth, modelDrawHeight)
      
      // 添加水印
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.font = '24px Arial'
      ctx.fillText('AR Character', 20, height - 20)
      
      // 添加录制时间
      if (isRecording && !isPaused) {
        const timeStr = formatTime(recordingTime)
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)'
        ctx.beginPath()
        ctx.arc(40, 40, 10, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'white'
        ctx.font = 'bold 32px Arial'
        ctx.fillText(timeStr, 60, 50)
      }
      
      requestAnimationFrame(drawFrame)
    }
    
    drawFrame()
    
    // 捕获画布流
    const canvasStream = canvas.captureStream(30) // 30fps
    
    // 如果有音频，合并音频流
    if (includeAudio && video && video.srcObject) {
      const audioTracks = video.srcObject.getAudioTracks()
      if (audioTracks.length > 0) {
        const audioStream = new MediaStream(audioTracks)
        audioStream.getTracks().forEach(track => {
          canvasStream.addTrack(track)
        })
      }
    }
    
    return canvasStream
  }

  // 开始倒计时
  const startCountdown = useCallback(() => {
    setCountdown(3)
    setShowUI(false) // 隐藏UI
    
    let count = 3
    countdownRef.current = setInterval(() => {
      count -= 1
      setCountdown(count)
      
      if (count <= 0) {
        clearInterval(countdownRef.current)
        setCountdown(0)
        startRecording()
      }
    }, 1000)
  }, [])

  // 开始录制
  const startRecording = async () => {
    try {
      const stream = await createCompositeStream()
      streamRef.current = stream
      
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4'
      ]
      
      let selectedMimeType = ''
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type
          break
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType || 'video/webm',
        videoBitsPerSecond: quality === '4K' ? 50000000 : quality === '1080p' ? 25000000 : 8000000
      })
      
      mediaRecorderRef.current = mediaRecorder
      recordedChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { 
          type: selectedMimeType || 'video/webm' 
        })
        const url = URL.createObjectURL(blob)
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        
        const newVideo = {
          id: Date.now(),
          url,
          blob,
          timestamp,
          duration: recordingTime,
          quality,
          size: (blob.size / 1024 / 1024).toFixed(2) + ' MB'
        }
        
        setRecordedVideos(prev => [newVideo, ...prev])
        setPreviewUrl(url)
        setShowPreview(true)
        setShowUI(true) // 显示UI
        
        // 停止所有流
        stream.getTracks().forEach(track => track.stop())
        
        // 回调
        onRecordingStop?.(newVideo)
      }
      
      mediaRecorder.start(1000) // 每秒收集一次数据
      setIsRecording(true)
      setRecordingTime(0)
      
      // 回调
      onRecordingStart?.()
      
      // 计时器
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (error) {
      console.error('录制失败:', error)
      alert('录制失败: ' + error.message)
      setShowUI(true) // 出错时显示UI
    }
  }

  // 停止录制
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRecording])

  // 暂停/继续录制
  const togglePause = useCallback(() => {
    if (!mediaRecorderRef.current) return
    
    if (isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      // 恢复计时
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } else {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      // 暂停计时
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isPaused])

  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 下载视频
  const downloadVideo = (video) => {
    const a = document.createElement('a')
    a.href = video.url
    a.download = `AR-Recording-${video.timestamp}.webm`
    a.click()
  }

  // 删除视频
  const deleteVideo = (id) => {
    setRecordedVideos(prev => {
      const video = prev.find(v => v.id === id)
      if (video) {
        URL.revokeObjectURL(video.url)
      }
      return prev.filter(v => v.id !== id)
    })
  }

  // 清理
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
      }
    }
  }, [])

  // 录制中的悬浮控制按钮
  const RecordingControls = () => {
    if (!isRecording || showUI) return null
    
    return (
      <div className="recording-floating-controls">
        <div className="recording-status">
          <span className="recording-dot"></span>
          <span className="recording-time">{formatTime(recordingTime)}</span>
        </div>
        <div className="recording-buttons">
          <button 
            className="control-btn pause"
            onClick={togglePause}
            title={isPaused ? '继续' : '暂停'}
          >
            {isPaused ? '▶️' : '⏸️'}
          </button>
          <button 
            className="control-btn stop"
            onClick={stopRecording}
            title="停止录制"
          >
            ⏹️
          </button>
        </div>
      </div>
    )
  }

  // 倒计时覆盖层
  const CountdownOverlay = () => {
    if (countdown === 0) return null
    
    return (
      <div className="countdown-overlay">
        <div className="countdown-number">{countdown}</div>
        <div className="countdown-text">准备录制...</div>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <>
      {/* 倒计时覆盖层 */}
      <CountdownOverlay />
      
      {/* 录制中悬浮控制 */}
      <RecordingControls />
      
      {/* 主面板 - 录制时隐藏 */}
      {showUI && (
        <div className="recorder-overlay" onClick={onClose}>
          <div className={`recorder-panel ${isMobile ? 'mobile' : ''}`} onClick={e => e.stopPropagation()}>
            {/* 头部 */}
            <div className="recorder-header">
              <h2>🎬 视频录制</h2>
              <button className="close-btn" onClick={onClose}>×</button>
            </div>

            {/* 设置区域 */}
            <div className="recorder-settings">
              <div className="setting-group">
                <label>分辨率:</label>
                <select value={quality} onChange={(e) => setQuality(e.target.value)}>
                  <option value="720p">720p (HD)</option>
                  <option value="1080p">1080p (Full HD)</option>
                  <option value="4K">4K (Ultra HD)</option>
                </select>
              </div>
              
              <div className="setting-group">
                <label>
                  <input 
                    type="checkbox" 
                    checked={includeAudio}
                    onChange={(e) => setIncludeAudio(e.target.checked)}
                  />
                  包含音频
                </label>
              </div>
            </div>

            {/* 录制控制 */}
            <div className="recorder-controls">
              {!isRecording ? (
                <button className="record-btn start" onClick={startCountdown}>
                  <span className="record-icon">🔴</span>
                  <span>开始录制 (3秒倒计时)</span>
                </button>
              ) : (
                <div className="recording-active-controls">
                  <button className="record-btn pause" onClick={togglePause}>
                    <span>{isPaused ? '▶️ 继续' : '⏸️ 暂停'}</span>
                  </button>
                  <button className="record-btn stop" onClick={stopRecording}>
                    <span className="record-icon">⏹️</span>
                    <span>停止录制 ({formatTime(recordingTime)})</span>
                  </button>
                </div>
              )}
            </div>

            {/* 录制提示 */}
            {isRecording && (
              <div className="recording-indicator">
                <span className={`recording-dot ${isPaused ? 'paused' : ''}`}></span>
                <span>{isPaused ? '已暂停' : '正在录制...'} {formatTime(recordingTime)}</span>
              </div>
            )}

            {/* 预览区域 */}
            {showPreview && previewUrl && (
              <div className="preview-section">
                <h3>最新录制</h3>
                <video 
                  src={previewUrl} 
                  controls 
                  className="preview-video"
                />
                <div className="preview-actions">
                  <button onClick={() => downloadVideo(recordedVideos[0])}>
                    💾 下载
                  </button>
                  <button onClick={() => setShowPreview(false)}>
                    关闭预览
                  </button>
                </div>
              </div>
            )}

            {/* 录制历史 */}
            {recordedVideos.length > 0 && (
              <div className="video-history">
                <h3>录制历史 ({recordedVideos.length})</h3>
                <div className="video-list">
                  {recordedVideos.map((video, index) => (
                    <div key={video.id} className="video-item">
                      <div className="video-info">
                        <span className="video-number">#{recordedVideos.length - index}</span>
                        <span className="video-time">{formatTime(video.duration)}</span>
                        <span className="video-quality">{video.quality}</span>
                        <span className="video-size">{video.size}</span>
                      </div>
                      <div className="video-actions">
                        <button onClick={() => downloadVideo(video)}>下载</button>
                        <button onClick={() => deleteVideo(video.id)}>删除</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 使用说明 */}
            <div className="recorder-help">
              <h4>📖 使用说明</h4>
              <ul>
                <li>点击"开始录制"后会有3秒倒计时</li>
                <li>倒计时结束后UI自动隐藏，开始录制</li>
                <li>录制过程中可点击悬浮按钮暂停/停止</li>
                <li>支持720p/1080p/4K三种分辨率</li>
                <li>可选择是否录制音频</li>
                <li>录制文件为WebM格式，可在浏览器中播放</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default VideoRecorder
