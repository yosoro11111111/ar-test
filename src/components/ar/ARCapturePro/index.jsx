import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './styles.module.css'

/**
 * AR Capture Pro - 专业级AR场景采集器（横屏版）
 * 
 * 功能：
 * 1. 实时摄像头预览 + AR平面检测覆盖
 * 2. 显示检测到的平面列表和统计
 * 3. 录制视频并自动检测平面
 * 4. 录入完成后编辑平面信息（重命名、删除）
 * 5. 场景重命名和保存
 */
export function ARCapturePro() {
  const navigate = useNavigate()
  
  // 视频和canvas引用
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  
  // 状态管理
  const [isRecording, setIsRecording] = useState(false)
  const [recordTime, setRecordTime] = useState(0)
  const [detectedPlanes, setDetectedPlanes] = useState([])
  const [capturedFrame, setCapturedFrame] = useState(null)
  const [showEditor, setShowEditor] = useState(false)
  const [sceneName, setSceneName] = useState('')
  const [editingPlane, setEditingPlane] = useState(null)
  
  // 用于存储最新的平面数据（解决闭包问题）
  const planesRef = useRef([])
  
  useEffect(() => {
    planesRef.current = detectedPlanes
  }, [detectedPlanes])
  
  // 启动摄像头
  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])
  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1920, height: 1080 },
        audio: false
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('摄像头启动失败:', error)
    }
  }
  
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop())
    }
  }
  
  // 开始录制
  const startRecording = () => {
    setIsRecording(true)
    setRecordTime(0)
    setDetectedPlanes([])
    
    // 模拟AR平面检测
    let time = 0
    const interval = setInterval(() => {
      time += 0.5
      setRecordTime(time)
      
      // 模拟检测到平面
      if (time === 2) detectPlane('floor', '地面')
      if (time === 4) detectPlane('wall', '墙面1')
      if (time === 6) detectPlane('wall', '墙面2')
      
      if (time >= 10) {
        clearInterval(interval)
        finishRecording()
      }
    }, 500)
  }
  
  // 检测平面
  const detectPlane = (type, defaultName) => {
    const newPlane = {
      id: `plane_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      name: defaultName,
      position: { x: 0, y: type === 'floor' ? 0 : 1.5, z: 0 },
      rotation: { x: type === 'floor' ? -Math.PI / 2 : 0, y: 0, z: 0 },
      size: { 
        width: 3 + Math.random() * 2, 
        height: type === 'floor' ? 4 + Math.random() * 2 : 2.5 + Math.random() 
      },
      color: type === 'floor' ? '#4a90d9' : '#d94a4a'
    }
    
    setDetectedPlanes(prev => [...prev, newPlane])
  }
  
  // 完成录制
  const finishRecording = () => {
    setIsRecording(false)
    
    // 捕获当前帧作为缩略图
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      canvasRef.current.width = 1280
      canvasRef.current.height = 720
      ctx.drawImage(videoRef.current, 0, 0, 1280, 720)
      
      // 绘制检测到的平面覆盖
      planesRef.current.forEach(plane => {
        ctx.strokeStyle = plane.color
        ctx.lineWidth = 4
        ctx.strokeRect(320, 240, 640, 480)
        
        ctx.fillStyle = plane.color + '40'
        ctx.fillRect(320, 240, 640, 480)
        
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 24px sans-serif'
        ctx.fillText(plane.name, 330, 270)
      })
      
      setCapturedFrame(canvasRef.current.toDataURL('image/jpeg', 0.9))
    }
    
    setSceneName(`场景_${new Date().toLocaleString()}`)
    setShowEditor(true)
  }
  
  // 更新平面名称
  const updatePlaneName = (planeId, newName) => {
    setDetectedPlanes(prev => 
      prev.map(p => p.id === planeId ? { ...p, name: newName } : p)
    )
    setEditingPlane(null)
  }
  
  // 删除平面
  const deletePlane = (planeId) => {
    setDetectedPlanes(prev => prev.filter(p => p.id !== planeId))
  }
  
  // 保存场景
  const saveScene = () => {
    const sceneData = {
      id: `scene_${Date.now()}`,
      name: sceneName,
      thumbnail: capturedFrame,
      createdAt: new Date().toISOString(),
      environment: {
        planes: detectedPlanes
      }
    }
    
    const scenes = JSON.parse(localStorage.getItem('ar-director-scenes') || '[]')
    scenes.push(sceneData)
    localStorage.setItem('ar-director-scenes', JSON.stringify(scenes))
    
    // 跳转到场景管理器
    navigate('/ar-director/manager')
  }
  
  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  return (
    <div className={styles.container}>
      {!showEditor ? (
        // 录制界面
        <>
          {/* 顶部栏 */}
          <header className={styles.header}>
            <button className={styles.backBtn} onClick={() => navigate('/ar-director')}>
              ← 返回
            </button>
            <h1 className={styles.title}>📹 AR 场景采集</h1>
            <button className={styles.settingsBtn}>⚙️</button>
          </header>
          
          {/* 主内容区 */}
          <main className={styles.main}>
            {/* 左侧：摄像头预览 */}
            <div className={styles.previewSection}>
              <div className={styles.videoContainer}>
                <video 
                  ref={videoRef}
                  className={styles.video}
                  autoPlay
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                {/* AR平面覆盖显示 */}
                <div className={styles.arOverlay}>
                  {detectedPlanes.map(plane => (
                    <div 
                      key={plane.id}
                      className={styles.planeOverlay}
                      style={{
                        borderColor: plane.color,
                        backgroundColor: plane.color + '20'
                      }}
                    >
                      <span className={styles.planeLabel}>{plane.name}</span>
                      <span className={styles.planeSize}>
                        {plane.size.width.toFixed(1)}m × {plane.size.height.toFixed(1)}m
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* 录制状态 */}
                {isRecording && (
                  <div className={styles.recordingIndicator}>
                    <span className={styles.recordingDot} />
                    <span className={styles.recordingTime}>{formatTime(recordTime)}</span>
                  </div>
                )}
              </div>
              
              {/* 提示信息 */}
              <div className={styles.hint}>
                {isRecording 
                  ? '📍 缓慢移动设备，让系统自动检测更多平面...' 
                  : '点击"开始录制"按钮开始采集场景'}
              </div>
            </div>
            
            {/* 右侧：统计和控制 */}
            <div className={styles.controlSection}>
              {/* 检测统计 */}
              <div className={styles.statsCard}>
                <h3>📊 检测统计</h3>
                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{detectedPlanes.length}</span>
                    <span className={styles.statLabel}>已检测平面</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>
                      {detectedPlanes.filter(p => p.type === 'floor').length}
                    </span>
                    <span className={styles.statLabel}>地面</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>
                      {detectedPlanes.filter(p => p.type === 'wall').length}
                    </span>
                    <span className={styles.statLabel}>墙面</span>
                  </div>
                </div>
              </div>
              
              {/* 平面列表 */}
              <div className={styles.planesCard}>
                <h3>📋 平面列表</h3>
                <div className={styles.planesList}>
                  {detectedPlanes.map(plane => (
                    <div key={plane.id} className={styles.planeItem}>
                      <div 
                        className={styles.planeColor}
                        style={{ backgroundColor: plane.color }}
                      />
                      <span className={styles.planeName}>{plane.name}</span>
                      <span className={styles.planeCheck}>✓</span>
                    </div>
                  ))}
                  {detectedPlanes.length === 0 && (
                    <div className={styles.emptyPlanes}>暂无检测到的平面</div>
                  )}
                </div>
              </div>
              
              {/* 操作按钮 */}
              <div className={styles.actionButtons}>
                {!isRecording ? (
                  <button className={styles.recordBtn} onClick={startRecording}>
                    <span className={styles.recordIcon}>⏺️</span>
                    <span>开始录制</span>
                  </button>
                ) : (
                  <button className={styles.stopBtn} onClick={finishRecording}>
                    <span className={styles.stopIcon}>⏹️</span>
                    <span>停止录制</span>
                  </button>
                )}
              </div>
            </div>
          </main>
        </>
      ) : (
        // 编辑界面
        <>
          {/* 顶部栏 */}
          <header className={styles.header}>
            <button className={styles.backBtn} onClick={() => setShowEditor(false)}>
              ← 返回录制
            </button>
            <h1 className={styles.title}>✏️ 编辑场景信息</h1>
            <button className={styles.saveBtn} onClick={saveScene}>
              💾 保存场景
            </button>
          </header>
          
          {/* 主内容区 */}
          <main className={styles.main}>
            {/* 左侧：预览图 */}
            <div className={styles.previewSection}>
              <div className={styles.capturePreview}>
                {capturedFrame && (
                  <img src={capturedFrame} alt="场景预览" className={styles.captureImage} />
                )}
              </div>
            </div>
            
            {/* 右侧：编辑面板 */}
            <div className={styles.editorSection}>
              {/* 场景名称 */}
              <div className={styles.editorCard}>
                <h3>📝 场景名称</h3>
                <input 
                  type="text"
                  value={sceneName}
                  onChange={(e) => setSceneName(e.target.value)}
                  className={styles.nameInput}
                  placeholder="输入场景名称"
                />
              </div>
              
              {/* 平面管理 */}
              <div className={styles.editorCard}>
                <h3>📋 平面管理 ({detectedPlanes.length}个)</h3>
                <div className={styles.planesEditorList}>
                  {detectedPlanes.map(plane => (
                    <div key={plane.id} className={styles.planeEditorItem}>
                      <div 
                        className={styles.planeEditorColor}
                        style={{ backgroundColor: plane.color }}
                      />
                      
                      {editingPlane === plane.id ? (
                        <input
                          type="text"
                          defaultValue={plane.name}
                          onBlur={(e) => updatePlaneName(plane.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updatePlaneName(plane.id, e.target.value)
                            }
                          }}
                          autoFocus
                          className={styles.planeNameInput}
                        />
                      ) : (
                        <span className={styles.planeEditorName}>{plane.name}</span>
                      )}
                      
                      <span className={styles.planeEditorSize}>
                        {plane.size.width.toFixed(1)}m × {plane.size.height.toFixed(1)}m
                      </span>
                      
                      <div className={styles.planeEditorActions}>
                        <button 
                          className={styles.editBtn}
                          onClick={() => setEditingPlane(plane.id)}
                        >
                          ✏️
                        </button>
                        <button 
                          className={styles.deleteBtn}
                          onClick={() => deletePlane(plane.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 场景信息 */}
              <div className={styles.editorCard}>
                <h3>📊 场景信息</h3>
                <div className={styles.infoList}>
                  <div className={styles.infoItem}>
                    <span>创建时间:</span>
                    <span>{new Date().toLocaleString()}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span>平面数量:</span>
                    <span>{detectedPlanes.length} 个</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span>录制时长:</span>
                    <span>{formatTime(recordTime)}</span>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </>
      )}
    </div>
  )
}

export default ARCapturePro
