import React from 'react'
import styles from '../styles/ARSystem.module.css'

/**
 * 现代化顶部状态栏组件
 * 支持AR模式和普通模式
 */
export const ModernHeader = ({
  isMobile,
  isARMode,
  isRecording,
  recordingTime,
  showSettings,
  cameraFacingMode,
  onHelp,
  onSettings,
  onToggleCamera,
  onToggleAR,
  onEnterWebXR,
  onToggleRecording
}) => {
  return (
    <header className={`${styles.header} ${isARMode ? styles.arMode : ''}`}>
      {/* Logo区域 */}
      <div className={styles.logoSection}>
        <div className={styles.logo}>🎭</div>
        <div className={styles.logoText}>
          <div className={styles.logoTitle}>AR乐园</div>
          <div className={styles.logoSubtitle}>AR Camera</div>
        </div>
      </div>

      {/* 版本标签 - 桌面端显示 */}
      {!isMobile && (
        <div className={styles.versionBadge}>
          <div className={styles.versionText}>v2.0.0</div>
          <div className={styles.versionAuthor}>by yosoro</div>
        </div>
      )}

      {/* 工具按钮组 */}
      <div className={styles.toolbar}>
        {/* 帮助按钮 */}
        <button 
          className={styles.toolButton}
          onClick={onHelp}
          title="帮助"
        >
          ❓
        </button>

        {/* 设置按钮 */}
        <button 
          className={`${styles.toolButton} ${showSettings ? styles.active : ''}`}
          onClick={onSettings}
          title="设置"
        >
          ⚙️
        </button>

        {/* 切换摄像头按钮 - 仅在AR模式显示 */}
        {isARMode && (
          <button 
            className={styles.toolButton}
            onClick={onToggleCamera}
            title={`当前: ${cameraFacingMode === 'environment' ? '后置' : '前置'}摄像头`}
          >
            🔄
          </button>
        )}

        {/* AR模式切换按钮 */}
        <button 
          className={`${styles.toolButton} ${isARMode ? styles.active : ''}`}
          onClick={onToggleAR}
          title={isARMode ? '退出AR模式' : '进入AR模式'}
        >
          {isARMode ? '📷' : '🎥'}
        </button>

        {/* WebXR AR按钮 */}
        <button 
          className={`${styles.toolButton} ${styles.arButton}`}
          onClick={onEnterWebXR}
          title="WebXR AR"
        >
          🥽
        </button>

        {/* 录制按钮 */}
        <button 
          className={`${styles.toolButton} ${isRecording ? styles.recording : ''}`}
          onClick={onToggleRecording}
          title={isRecording ? '停止录制' : '开始录制'}
        >
          {isRecording ? '⏹️' : '⏺️'}
          {isRecording && <span className={styles.recordingIndicator} />}
        </button>
      </div>
    </header>
  )
}

export default ModernHeader
