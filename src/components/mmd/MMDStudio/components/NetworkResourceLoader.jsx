import React, { useState } from 'react'
import styles from './NetworkResourceLoader.module.css'

/**
 * 网络资源加载器 - 从网络加载资源并显示进度
 */
export function NetworkResourceLoader({ onLoad, type }) {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  // 预设资源URL（示例）
  const presetResources = {
    characters: [
      { name: '角色1', url: 'https://example.com/characters/char1.vrm' },
      { name: '角色2', url: 'https://example.com/characters/char2.vrm' },
    ],
    props: [
      { name: '剑', url: 'https://example.com/props/sword.glb' },
      { name: '盾', url: 'https://example.com/props/shield.glb' },
    ],
    scenes: [
      { name: '房间', url: 'https://example.com/scenes/room.glb' },
      { name: '舞台', url: 'https://example.com/scenes/stage.glb' },
    ],
    motions: [
      { name: '舞蹈1', url: 'https://example.com/motions/dance1.vrma' },
      { name: '待机', url: 'https://example.com/motions/idle.vrma' },
    ]
  }

  const loadFromNetwork = async (resourceUrl) => {
    setIsLoading(true)
    setProgress(0)
    setError(null)

    try {
      // 使用 XMLHttpRequest 获取进度
      const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        
        xhr.open('GET', resourceUrl, true)
        xhr.responseType = 'blob'
        
        xhr.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100
            setProgress(percentComplete)
          }
        }
        
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(xhr.response)
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`))
          }
        }
        
        xhr.onerror = () => reject(new Error('网络请求失败'))
        xhr.ontimeout = () => reject(new Error('请求超时'))
        
        xhr.send()
      })

      // 创建本地URL
      const localUrl = URL.createObjectURL(blob)
      
      // 获取文件名
      const fileName = resourceUrl.split('/').pop() || 'unknown'
      
      onLoad({
        name: fileName.replace(/\.[^/.]+$/, ''),
        url: localUrl,
        blob: blob,
        size: blob.size,
        originalUrl: resourceUrl
      })
      
      setProgress(100)
      setTimeout(() => {
        setIsLoading(false)
        setProgress(0)
        setUrl('')
      }, 500)
      
    } catch (err) {
      console.error('加载失败:', err)
      setError(err.message)
      setIsLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (url.trim()) {
      loadFromNetwork(url.trim())
    }
  }

  const handlePresetClick = (preset) => {
    setUrl(preset.url)
    loadFromNetwork(preset.url)
  }

  return (
    <div className={styles.container}>
      {/* URL输入 */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="url"
          placeholder="输入资源URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className={styles.input}
          disabled={isLoading}
        />
        <button
          type="submit"
          className={styles.loadButton}
          disabled={isLoading || !url.trim()}
        >
          {isLoading ? '加载中...' : '加载'}
        </button>
      </form>

      {/* 进度条 */}
      {isLoading && (
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={styles.progressText}>{Math.round(progress)}%</span>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className={styles.error}>
          ❌ {error}
        </div>
      )}

      {/* 预设资源 */}
      <div className={styles.presetSection}>
        <h4>推荐资源</h4>
        <div className={styles.presetList}>
          {(presetResources[type] || []).map((preset, index) => (
            <button
              key={index}
              className={styles.presetButton}
              onClick={() => handlePresetClick(preset)}
              disabled={isLoading}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* 说明 */}
      <div className={styles.help}>
        <p>💡 支持格式：</p>
        <ul>
          <li>角色: .vrm</li>
          <li>道具: .glb, .gltf</li>
          <li>场景: .glb, .gltf, .mp4</li>
          <li>动作: .vrma</li>
        </ul>
      </div>
    </div>
  )
}

/**
 * 网络资源加载对话框
 */
export function NetworkResourceDialog({ isOpen, onClose, onLoad, type, title }) {
  if (!isOpen) return null

  return (
    <div className={styles.dialogOverlay}>
      <div className={styles.dialog}>
        <div className={styles.dialogHeader}>
          <h3>{title || '从网络加载'}</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.dialogContent}>
          <NetworkResourceLoader onLoad={onLoad} type={type} />
        </div>
      </div>
    </div>
  )
}
