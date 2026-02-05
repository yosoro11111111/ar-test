import React, { useState, useEffect, useRef } from 'react'
import styles from './SceneMapModal.module.css'

/**
 * 场景地图弹窗 - 2D地图视图，支持多选场景和新建场景
 */
export function SceneMapModal({ onSelect, onClose }) {
  const [scenes, setScenes] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  // 新建场景状态
  const [newSceneName, setNewSceneName] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordTime, setRecordTime] = useState(0)
  const [detectedPlanes, setDetectedPlanes] = useState([])
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  
  // 加载场景库
  useEffect(() => {
    const savedScenes = JSON.parse(localStorage.getItem('ar-director-scenes') || '[]')
    setScenes(savedScenes)
  }, [])
  
  // 启动摄像头
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('摄像头启动失败:', error)
      alert('摄像头启动失败')
    }
  }
  
  // 停止摄像头
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }
  
  // 开始录制/检测
  const startRecording = () => {
    setIsRecording(true)
    setRecordTime(0)
    setDetectedPlanes([])
    startCamera()
    
    // 模拟检测
    let time = 0
    const interval = setInterval(() => {
      time += 0.5
      setRecordTime(time)
      
      if (time === 2) detectPlane('floor', '地面')
      if (time === 4) detectPlane('wall', '墙面')
      
      if (time >= 6) {
        clearInterval(interval)
        finishRecording()
      }
    }, 500)
  }
  
  // 检测平面
  const detectPlane = (type, name) => {
    const newPlane = {
      id: `plane_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      name,
      position: { x: 0, y: type === 'floor' ? 0 : 1.5, z: 0 },
      size: { width: 3 + Math.random() * 2, height: type === 'floor' ? 4 : 2.5 }
    }
    setDetectedPlanes(prev => [...prev, newPlane])
  }
  
  // 完成录制
  const finishRecording = () => {
    setIsRecording(false)
    stopCamera()
    
    // 捕获缩略图
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      canvasRef.current.width = 320
      canvasRef.current.height = 240
      ctx.drawImage(videoRef.current, 0, 0, 320, 240)
      
      const thumbnail = canvasRef.current.toDataURL('image/jpeg', 0.8)
      
      // 创建场景
      const sceneData = {
        id: `scene_${Date.now()}`,
        name: newSceneName || `场景_${new Date().toLocaleTimeString()}`,
        thumbnail,
        createdAt: new Date().toISOString(),
        environment: { planes: detectedPlanes }
      }
      
      const updatedScenes = [...scenes, sceneData]
      setScenes(updatedScenes)
      localStorage.setItem('ar-director-scenes', JSON.stringify(updatedScenes))
      
      // 自动选择新场景
      setSelectedIds(prev => [...prev, sceneData.id])
      
      // 重置
      setShowCreateModal(false)
      setNewSceneName('')
      setDetectedPlanes([])
    }
  }
  
  // 切换选择
  const toggleSelect = (sceneId) => {
    setSelectedIds(prev => 
      prev.includes(sceneId)
        ? prev.filter(id => id !== sceneId)
        : [...prev, sceneId]
    )
  }
  
  // 确认选择
  const confirmSelect = () => {
    const selected = scenes.filter(scene => selectedIds.includes(scene.id))
    onSelect(selected)
    onClose()
  }
  
  // 过滤场景
  const filteredScenes = scenes.filter(scene => 
    scene.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // 计算场景位置
  const getScenePosition = (index, total) => {
    const angle = (index / Math.max(total, 1)) * Math.PI * 2
    const radius = 30
    return {
      left: 50 + Math.cos(angle) * radius,
      top: 50 + Math.sin(angle) * radius
    }
  }
  
  const formatTime = (seconds) => {
    const secs = Math.floor(seconds % 60)
    return `0:${secs.toString().padStart(2, '0')}`
  }
  
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {!showCreateModal ? (
          <>
            <div className={styles.header}>
              <h2>🗺️ 选择场景</h2>
              <button className={styles.closeBtn} onClick={onClose}>✕</button>
            </div>
            
            <div className={styles.searchBox}>
              <input
                type="text"
                placeholder="搜索场景..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            
            <div className={styles.mapContainer}>
              {filteredScenes.length > 0 ? (
                <div className={styles.mapView}>
                  <div className={styles.mapGrid} />
                  {filteredScenes.map((scene, index) => {
                    const pos = getScenePosition(index, filteredScenes.length)
                    const isSelected = selectedIds.includes(scene.id)
                    return (
                      <div
                        key={scene.id}
                        className={`${styles.mapMarker} ${isSelected ? styles.selected : ''}`}
                        style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
                        onClick={() => toggleSelect(scene.id)}
                      >
                        <div className={styles.markerDot}>
                          {isSelected ? '✓' : index + 1}
                        </div>
                        <div className={styles.markerInfo}>
                          {scene.thumbnail && <img src={scene.thumbnail} alt={scene.name} />}
                          <span>{scene.name}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>暂无场景</p>
                  <p>点击"新建场景"创建第一个场景</p>
                </div>
              )}
            </div>
            
            <div className={styles.sceneList}>
              {filteredScenes.map((scene, index) => (
                <div
                  key={scene.id}
                  className={`${styles.sceneItem} ${selectedIds.includes(scene.id) ? styles.selected : ''}`}
                  onClick={() => toggleSelect(scene.id)}
                >
                  <span className={styles.sceneNumber}>{index + 1}</span>
                  {scene.thumbnail && <img src={scene.thumbnail} alt={scene.name} className={styles.sceneThumb} />}
                  <span className={styles.sceneName}>{scene.name}</span>
                  {selectedIds.includes(scene.id) && <span className={styles.sceneCheck}>✓</span>}
                </div>
              ))}
            </div>
            
            <div className={styles.footer}>
              <button className={styles.createBtn} onClick={() => setShowCreateModal(true)}>
                ➕ 新建场景
              </button>
              <div className={styles.footerRight}>
                <span className={styles.selectedCount}>已选择 {selectedIds.length} 个</span>
                <button className={styles.cancelBtn} onClick={onClose}>取消</button>
                <button className={styles.confirmBtn} onClick={confirmSelect} disabled={selectedIds.length === 0}>
                  确认添加
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={styles.header}>
              <h2>📹 新建场景</h2>
              <button className={styles.closeBtn} onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            
            <div className={styles.createContent}>
              <div className={styles.videoSection}>
                <video ref={videoRef} className={styles.video} autoPlay playsInline muted />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                {isRecording && (
                  <div className={styles.recordingIndicator}>
                    <span className={styles.recordingDot} />
                    <span>{formatTime(recordTime)}</span>
                  </div>
                )}
                
                <div className={styles.planesOverlay}>
                  {detectedPlanes.map((plane, i) => (
                    <div key={plane.id} className={styles.planeBadge}>
                      {plane.name}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className={styles.createControls}>
                <input
                  type="text"
                  placeholder="场景名称"
                  value={newSceneName}
                  onChange={(e) => setNewSceneName(e.target.value)}
                  className={styles.nameInput}
                />
                
                <div className={styles.detectedInfo}>
                  <span>已检测平面: {detectedPlanes.length}</span>
                </div>
                
                {!isRecording ? (
                  <button className={styles.recordBtn} onClick={startRecording}>
                    ⏺️ 开始检测
                  </button>
                ) : (
                  <button className={styles.stopBtn} onClick={finishRecording}>
                    ⏹️ 完成
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default SceneMapModal
