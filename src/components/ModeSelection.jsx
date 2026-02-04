import React, { useState, useEffect } from 'react'
import styles from './ModeSelection.module.css'

// 检测AR支持
const checkARSupport = async () => {
  if (!('xr' in navigator)) {
    return { supported: false, reason: '浏览器不支持WebXR' }
  }
  
  try {
    const isSupported = await navigator.xr.isSessionSupported('immersive-ar')
    if (!isSupported) {
      return { supported: false, reason: '设备不支持AR模式' }
    }
    return { supported: true, reason: '' }
  } catch (error) {
    return { supported: false, reason: '检测AR支持时出错' }
  }
}

export const ModeSelection = ({ character, onSelectCamera, onSelectAR, onClose }) => {
  const [arSupport, setArSupport] = useState({ checking: true, supported: false, reason: '' })
  const [showARWarning, setShowARWarning] = useState(false)

  useEffect(() => {
    const checkSupport = async () => {
      const result = await checkARSupport()
      setArSupport({
        checking: false,
        supported: result.supported,
        reason: result.reason
      })
    }
    checkSupport()
  }, [])

  const handleARClick = () => {
    if (!arSupport.supported) {
      setShowARWarning(true)
      setTimeout(() => setShowARWarning(false), 3000)
      return
    }
    onSelectAR()
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        {/* 角色预览 */}
        <div className={styles.characterPreview}>
          <div className={styles.characterImage}>
            {character?.thumbnail ? (
              <img src={character.thumbnail} alt={character.name} />
            ) : (
              <div className={styles.characterPlaceholder}>🎭</div>
            )}
          </div>
          <h2 className={styles.characterName}>{character?.name || '角色'}</h2>
          <p className={styles.characterDesc}>已准备好！请选择进入模式</p>
        </div>

        {/* 模式选择按钮 */}
        <div className={styles.buttonContainer}>
          {/* 摄像头模式按钮 */}
          <button 
            className={`${styles.modeButton} ${styles.cameraButton}`}
            onClick={onSelectCamera}
          >
            <div className={styles.buttonIcon}>📷</div>
            <div className={styles.buttonContent}>
              <span className={styles.buttonTitle}>摄像头模式</span>
              <span className={styles.buttonDesc}>使用摄像头作为背景</span>
            </div>
            <div className={styles.buttonGlow}></div>
          </button>

          {/* AR模式按钮 */}
          <button 
            className={`${styles.modeButton} ${styles.arButton} ${
              arSupport.checking ? styles.checking : ''
            } ${arSupport.supported ? styles.supported : styles.unsupported}`}
            onClick={handleARClick}
            disabled={arSupport.checking}
          >
            <div className={styles.buttonIcon}>
              {arSupport.checking ? '⏳' : arSupport.supported ? '🥽' : '🚫'}
            </div>
            <div className={styles.buttonContent}>
              <span className={styles.buttonTitle}>
                {arSupport.checking ? '检测中...' : 'AR模式'}
              </span>
              <span className={styles.buttonDesc}>
                {arSupport.checking 
                  ? '正在检测设备支持...' 
                  : arSupport.supported 
                    ? '沉浸式增强现实体验' 
                    : '设备不支持AR模式'}
              </span>
            </div>
            {/* AR支持时的特效 */}
            {arSupport.supported && (
              <>
                <div className={styles.arGlow}></div>
                <div className={styles.arParticles}>
                  <span></span><span></span><span></span><span></span>
                </div>
              </>
            )}
          </button>
        </div>

        {/* AR不支持提示 */}
        {showARWarning && (
          <div className={styles.warningPopup}>
            <span className={styles.warningIcon}>⚠️</span>
            <span className={styles.warningText}>{arSupport.reason}</span>
          </div>
        )}

        {/* 关闭按钮 */}
        <button className={styles.closeButton} onClick={onClose}>
          ✕ 重新选择角色
        </button>
      </div>
    </div>
  )
}

export default ModeSelection
