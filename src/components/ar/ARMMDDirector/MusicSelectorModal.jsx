import React, { useState, useRef } from 'react'
import styles from './MusicSelectorModal.module.css'

/**
 * 音乐选择器弹窗
 * 支持选择本地音乐文件
 */
export function MusicSelectorModal({ onSelect, onClose }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)
  const fileInputRef = useRef(null)

  // 处理文件选择
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('audio/')) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      // 自动播放预览
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play()
          setIsPlaying(true)
        }
      }, 100)
    }
  }

  // 切换播放/暂停
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // 确认选择
  const handleConfirm = () => {
    if (selectedFile && previewUrl) {
      onSelect({
        id: `music_${Date.now()}`,
        name: selectedFile.name.replace(/\.[^/.]+$/, ''),
        file: selectedFile,
        url: previewUrl,
        duration: audioRef.current?.duration || 0
      })
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>🎵 选择音乐</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.content}>
          {/* 文件选择 */}
          <div className={styles.uploadArea}>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              className={styles.uploadBtn}
              onClick={() => fileInputRef.current?.click()}
            >
              <span className={styles.uploadIcon}>📁</span>
              <span className={styles.uploadText}>
                {selectedFile ? '更换音乐文件' : '点击选择音乐文件'}
              </span>
              <span className={styles.uploadHint}>
                支持 MP3, WAV, OGG 格式
              </span>
            </button>
          </div>

          {/* 已选择的文件 */}
          {selectedFile && (
            <div className={styles.fileInfo}>
              <div className={styles.fileIcon}>🎵</div>
              <div className={styles.fileDetails}>
                <span className={styles.fileName}>{selectedFile.name}</span>
                <span className={styles.fileSize}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>
          )}

          {/* 音频预览 */}
          {previewUrl && (
            <div className={styles.previewSection}>
              <audio
                ref={audioRef}
                src={previewUrl}
                onEnded={() => setIsPlaying(false)}
                style={{ display: 'none' }}
              />
              <button
                className={styles.playBtn}
                onClick={togglePlay}
              >
                <span className={styles.playIcon}>
                  {isPlaying ? '⏸️' : '▶️'}
                </span>
                <span>{isPlaying ? '暂停预览' : '播放预览'}</span>
              </button>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            取消
          </button>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={!selectedFile}
          >
            确认选择
          </button>
        </div>
      </div>
    </div>
  )
}

export default MusicSelectorModal
