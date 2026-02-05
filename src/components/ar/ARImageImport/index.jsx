import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './styles.module.css'

/**
 * AR Image Import - 图片导入界面
 * 
 * 功能：
 * 1. 上传图片作为背景
 * 2. 设置场景名称
 * 3. 创建虚拟平面（基于图片）
 * 4. 保存为场景
 */
export function ARImageImport() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  
  const [selectedImage, setSelectedImage] = useState(null)
  const [sceneName, setSceneName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })

  // 处理文件选择
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      processImage(file)
    }
  }

  // 处理拖拽
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      processImage(file)
    }
  }

  // 处理图片
  const processImage = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        setSelectedImage(e.target.result)
        setImageSize({ width: img.width, height: img.height })
        if (!sceneName) {
          setSceneName(file.name.replace(/\.[^/.]+$/, ''))
        }
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  // 保存场景
  const saveScene = () => {
    if (!selectedImage || !sceneName.trim()) {
      alert('请选择图片并输入场景名称')
      return
    }

    // 计算平面尺寸（基于图片比例）
    const aspectRatio = imageSize.width / imageSize.height
    const planeWidth = Math.min(10, aspectRatio * 5)
    const planeHeight = Math.min(5, 10 / aspectRatio)

    const sceneData = {
      id: `scene_${Date.now()}`,
      name: sceneName,
      thumbnail: selectedImage,
      createdAt: new Date().toISOString(),
      type: 'image', // 标记为图片场景
      imageUrl: selectedImage,
      imageSize: imageSize,
      environment: {
        planes: [{
          id: `plane_${Date.now()}`,
          type: 'image',
          name: '背景平面',
          position: { x: 0, y: 0, z: -2 },
          rotation: { x: 0, y: 0, z: 0 },
          size: { width: planeWidth, height: planeHeight },
          color: '#4a90d9',
          imageUrl: selectedImage
        }]
      }
    }

    const scenes = JSON.parse(localStorage.getItem('ar-director-scenes') || '[]')
    scenes.push(sceneData)
    localStorage.setItem('ar-director-scenes', JSON.stringify(scenes))

    // 跳转到场景管理器
    navigate('/ar-director/manager')
  }

  return (
    <div className={styles.container}>
      {/* 顶部栏 */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/ar-director')}>
          ← 返回
        </button>
        <h1 className={styles.title}>🖼️ 图片导入</h1>
        <div className={styles.headerSpacer}></div>
      </header>

      {/* 主内容区 */}
      <main className={styles.main}>
        {/* 左侧：图片上传 */}
        <div className={styles.uploadSection}>
          <h2 className={styles.sectionTitle}>选择图片</h2>
          
          <div 
            className={`${styles.dropZone} ${isDragging ? styles.dragging : ''} ${selectedImage ? styles.hasImage : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className={styles.fileInput}
            />
            
            {selectedImage ? (
              <img src={selectedImage} alt="Selected" className={styles.previewImage} />
            ) : (
              <div className={styles.dropContent}>
                <span className={styles.dropIcon}>📁</span>
                <p className={styles.dropText}>点击或拖拽图片到此处</p>
                <p className={styles.dropSubtext}>支持 JPG、PNG、WebP 格式</p>
              </div>
            )}
          </div>

          {selectedImage && (
            <button 
              className={styles.changeImageBtn}
              onClick={() => fileInputRef.current?.click()}
            >
              🔄 更换图片
            </button>
          )}
        </div>

        {/* 右侧：场景设置 */}
        <div className={styles.settingsSection}>
          <h2 className={styles.sectionTitle}>场景设置</h2>
          
          <div className={styles.settingsCard}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>场景名称</label>
              <input
                type="text"
                value={sceneName}
                onChange={(e) => setSceneName(e.target.value)}
                placeholder="输入场景名称"
                className={styles.textInput}
              />
            </div>

            {selectedImage && (
              <div className={styles.imageInfo}>
                <h3 className={styles.infoTitle}>📊 图片信息</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>尺寸</span>
                    <span className={styles.infoValue}>{imageSize.width} × {imageSize.height}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>比例</span>
                    <span className={styles.infoValue}>{(imageSize.width / imageSize.height).toFixed(2)}:1</span>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.hintBox}>
              <h4>💡 提示</h4>
              <p>导入的图片将作为3D场景的背景平面，您可以在时间轴编辑器中添加角色和动作。</p>
            </div>
          </div>

          <div className={styles.actionButtons}>
            <button 
              className={styles.saveBtn}
              onClick={saveScene}
              disabled={!selectedImage || !sceneName.trim()}
            >
              💾 保存场景
            </button>
            <button 
              className={styles.cancelBtn}
              onClick={() => navigate('/ar-director')}
            >
              取消
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ARImageImport
