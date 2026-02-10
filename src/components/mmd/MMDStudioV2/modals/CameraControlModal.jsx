import React, { useState, useEffect } from 'react'
import styles from './CameraControlModal.module.css'

export function CameraControlModal({ cameraSystem, onClose }) {
  const [activeTab, setActiveTab] = useState('presets')
  const [presets, setPresets] = useState([])
  const [trajectories, setTrajectories] = useState([])
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [selectedTrajectory, setSelectedTrajectory] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [shakeIntensity, setShakeIntensity] = useState(0.1)
  const [shakeDuration, setShakeDuration] = useState(1.0)

  useEffect(() => {
    if (cameraSystem?.current) {
      // 加载预设和轨迹
      const sys = cameraSystem.current
      setPresets(Array.from(sys.cameraPresets.values()))
      setTrajectories(Array.from(sys.trajectories.values()))
    }
  }, [cameraSystem])

  // 创建新机位预设
  const handleCreatePreset = () => {
    if (!cameraSystem?.current) return

    const sys = cameraSystem.current
    const id = `preset_${Date.now()}`
    const position = {
      x: sys.camera.position.x,
      y: sys.camera.position.y,
      z: sys.camera.position.z
    }

    // 获取当前朝向
    const lookAt = new (require('three')).Vector3(0, 0, -1)
    lookAt.applyQuaternion(sys.camera.quaternion)
    lookAt.add(sys.camera.position)

    const preset = sys.createPreset(id, `机位 ${presets.length + 1}`, position, {
      x: lookAt.x,
      y: lookAt.y,
      z: lookAt.z
    }, {
      fov: sys.camera.fov,
      transitionDuration: 1.0
    })

    setPresets([...presets, preset])
  }

  // 切换到预设
  const handleSwitchToPreset = (presetId) => {
    if (!cameraSystem?.current) return
    cameraSystem.current.switchToPreset(presetId, false)
    setSelectedPreset(presetId)
  }

  // 删除预设
  const handleDeletePreset = (presetId) => {
    if (!cameraSystem?.current) return
    cameraSystem.current.cameraPresets.delete(presetId)
    setPresets(presets.filter(p => p.id !== presetId))
    if (selectedPreset === presetId) setSelectedPreset(null)
  }

  // 创建新轨迹
  const handleCreateTrajectory = () => {
    if (!cameraSystem?.current) return

    const sys = cameraSystem.current
    const id = `trajectory_${Date.now()}`
    const trajectory = sys.createTrajectory(id, `轨迹 ${trajectories.length + 1}`, {
      duration: 10,
      loop: false
    })

    setTrajectories([...trajectories, trajectory])
  }

  // 开始录制轨迹
  const handleStartRecording = () => {
    if (!cameraSystem?.current || !selectedTrajectory) return

    setIsRecording(true)
    // 这里应该开始记录摄像机位置
    console.log('开始录制轨迹:', selectedTrajectory)
  }

  // 停止录制
  const handleStopRecording = () => {
    setIsRecording(false)
    console.log('停止录制轨迹')
  }

  // 添加轨迹点
  const handleAddTrajectoryPoint = () => {
    if (!cameraSystem?.current || !selectedTrajectory) return

    const sys = cameraSystem.current
    const position = {
      x: sys.camera.position.x,
      y: sys.camera.position.y,
      z: sys.camera.position.z
    }

    // 获取当前朝向
    const lookAt = new (require('three')).Vector3(0, 0, -1)
    lookAt.applyQuaternion(sys.camera.quaternion)
    lookAt.add(sys.camera.position)

    sys.addTrajectoryPoint(selectedTrajectory, position, {
      x: lookAt.x,
      y: lookAt.y,
      z: lookAt.z
    })

    // 刷新轨迹列表
    setTrajectories(Array.from(sys.trajectories.values()))
  }

  // 播放轨迹
  const handlePlayTrajectory = (trajectoryId) => {
    if (!cameraSystem?.current) return
    cameraSystem.current.setActiveTrajectory(trajectoryId)
  }

  // 停止轨迹
  const handleStopTrajectory = () => {
    if (!cameraSystem?.current) return
    cameraSystem.current.setActiveTrajectory(null)
  }

  // 启用镜头抖动
  const handleEnableShake = () => {
    if (!cameraSystem?.current) return
    cameraSystem.current.enableShake(shakeIntensity, shakeDuration)
  }

  // 重置摄像机
  const handleResetCamera = () => {
    if (!cameraSystem?.current) return
    cameraSystem.current.reset()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>📹 摄像机控制</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'presets' ? styles.active : ''}`}
            onClick={() => setActiveTab('presets')}
          >
            机位预设
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'trajectories' ? styles.active : ''}`}
            onClick={() => setActiveTab('trajectories')}
          >
            轨迹
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'effects' ? styles.active : ''}`}
            onClick={() => setActiveTab('effects')}
          >
            特效
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'presets' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>机位预设</h3>
                <button className={styles.addBtn} onClick={handleCreatePreset}>
                  + 保存当前机位
                </button>
              </div>

              <div className={styles.presetList}>
                {presets.map(preset => (
                  <div
                    key={preset.id}
                    className={`${styles.presetItem} ${selectedPreset === preset.id ? styles.selected : ''}`}
                    onClick={() => setSelectedPreset(preset.id)}
                  >
                    <div className={styles.presetInfo}>
                      <span className={styles.presetName}>{preset.name}</span>
                      <span className={styles.presetDetails}>
                        FOV: {preset.fov}° | 过渡: {preset.transitionDuration}s
                      </span>
                    </div>
                    <div className={styles.presetActions}>
                      <button
                        className={styles.switchBtn}
                        onClick={() => handleSwitchToPreset(preset.id)}
                      >
                        切换
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDeletePreset(preset.id)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
                {presets.length === 0 && (
                  <div className={styles.emptyState}>
                    暂无预设，点击"保存当前机位"创建
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'trajectories' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>摄像机轨迹</h3>
                <button className={styles.addBtn} onClick={handleCreateTrajectory}>
                  + 新建轨迹
                </button>
              </div>

              <div className={styles.trajectoryList}>
                {trajectories.map(trajectory => (
                  <div
                    key={trajectory.id}
                    className={`${styles.trajectoryItem} ${selectedTrajectory === trajectory.id ? styles.selected : ''}`}
                    onClick={() => setSelectedTrajectory(trajectory.id)}
                  >
                    <div className={styles.trajectoryInfo}>
                      <span className={styles.trajectoryName}>{trajectory.name}</span>
                      <span className={styles.trajectoryDetails}>
                        {trajectory.points.length} 个点 | 时长: {trajectory.duration}s
                      </span>
                    </div>
                    <div className={styles.trajectoryActions}>
                      <button
                        className={styles.playBtn}
                        onClick={() => handlePlayTrajectory(trajectory.id)}
                      >
                        播放
                      </button>
                      <button
                        className={styles.recordBtn}
                        onClick={isRecording ? handleStopRecording : handleStartRecording}
                        disabled={selectedTrajectory !== trajectory.id}
                      >
                        {isRecording ? '停止' : '录制'}
                      </button>
                    </div>
                  </div>
                ))}
                {trajectories.length === 0 && (
                  <div className={styles.emptyState}>
                    暂无轨迹，点击"新建轨迹"创建
                  </div>
                )}
              </div>

              {selectedTrajectory && (
                <div className={styles.trajectoryControls}>
                  <button className={styles.controlBtn} onClick={handleAddTrajectoryPoint}>
                    📍 添加当前位置为轨迹点
                  </button>
                  <button className={styles.controlBtn} onClick={handleStopTrajectory}>
                    ⏹️ 停止播放
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'effects' && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>镜头特效</h3>

              <div className={styles.effectGroup}>
                <h4>镜头抖动</h4>
                <div className={styles.inputRow}>
                  <label>强度</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={shakeIntensity}
                    onChange={(e) => setShakeIntensity(parseFloat(e.target.value))}
                  />
                  <span>{shakeIntensity.toFixed(1)}</span>
                </div>
                <div className={styles.inputRow}>
                  <label>时长</label>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={shakeDuration}
                    onChange={(e) => setShakeDuration(parseFloat(e.target.value))}
                  />
                  <span>{shakeDuration.toFixed(1)}s</span>
                </div>
                <button className={styles.applyBtn} onClick={handleEnableShake}>
                  启用抖动
                </button>
              </div>

              <div className={styles.effectGroup}>
                <h4>摄像机重置</h4>
                <button className={styles.resetBtn} onClick={handleResetCamera}>
                  重置到默认位置
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.doneBtn} onClick={onClose}>
            完成
          </button>
        </div>
      </div>
    </div>
  )
}
