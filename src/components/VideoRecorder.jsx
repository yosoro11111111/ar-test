import React, { useRef, useState, useCallback, useEffect } from 'react'
import './VideoRecorder.css'

// 视频录制组件 - 支持录制3D模型和摄像头画面
export const VideoRecorder = ({ 
  isOpen, 
  onClose, 
  canvasRef, 
  videoRef,
  isMobile 
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordedVideos, setRecordedVideos] = useState([])
  const [quality, setQuality] = useState('1080p')
  const [includeAudio, setIncludeAudio] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])
  const timerRef = useRef(null)
  const streamRef = useRef(null)

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
    
    // 获取Three.js画布
    const threeCanvas = canvasRef?.current
    const video = videoRef?.current
    
    if (!threeCanvas) {
      throw new Error('3D画布未找到')
    }

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
      
      // 绘制3D模型（叠加在视频上方）
      ctx.drawImage(threeCanvas, 0, 0, width, height)
      
      // 添加水印
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.font = '24px Arial'
      ctx.fillText('AR Character', 20, height - 20)
      
      // 添加录制时间
      if (isRecording) {
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
        
        // 停止所有流
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start(1000) // 每秒收集一次数据
      setIsRecording(true)
      setRecordingTime(0)
      
      // 计时器
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (error) {
      console.error('录制失败:', error)
      alert('录制失败: ' + error.message)
    }
  }

  // 停止录制
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

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
      recordedVideos.forEach(video => {
        URL.revokeObjectURL(video.url)
      })
    }
  }, [])

  if (!isOpen) return null

  return (
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
            <button className="record-btn start" onClick={startRecording}>
              <span className="record-icon">🔴</span>
              <span>开始录制</span>
            </button>
          ) : (
            <button className="record-btn stop" onClick={stopRecording}>
              <span className="record-icon">⏹️</span>
              <span>停止录制 ({formatTime(recordingTime)})</span>
            </button>
          )}
        </div>

        {/* 录制提示 */}
        {isRecording && (
          <div className="recording-indicator">
            <span className="recording-dot"></span>
            <span>正在录制... {formatTime(recordingTime)}</span>
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
            <li>录制会同时捕获摄像头画面和3D模型</li>
            <li>支持720p/1080p/4K三种分辨率</li>
            <li>可选择是否录制音频</li>
            <li>录制文件为WebM格式，可在浏览器中播放</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default VideoRecorder
