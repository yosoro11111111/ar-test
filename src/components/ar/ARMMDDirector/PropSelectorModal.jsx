import React, { useState, useRef } from 'react'
import styles from './PropSelectorModal.module.css'

// 预设道具列表
const PRESET_PROPS = [
  { id: 'box', name: '盒子', icon: '📦', type: 'primitive', shape: 'box' },
  { id: 'sphere', name: '球体', icon: '⚪', type: 'primitive', shape: 'sphere' },
  { id: 'cylinder', name: '圆柱', icon: '🛢️', type: 'primitive', shape: 'cylinder' },
  { id: 'cone', name: '圆锥', icon: '🔺', type: 'primitive', shape: 'cone' },
  { id: 'torus', name: '圆环', icon: '⭕', type: 'primitive', shape: 'torus' },
  { id: 'chair', name: '椅子', icon: '🪑', type: 'model' },
  { id: 'table', name: '桌子', icon: '🪑', type: 'model' },
  { id: 'tree', name: '树', icon: '🌳', type: 'model' },
  { id: 'rock', name: '石头', icon: '🪨', type: 'model' },
  { id: 'flower', name: '花', icon: '🌸', type: 'model' },
]

/**
 * 道具选择器弹窗
 */
export function PropSelectorModal({ onSelect, onClose }) {
  const [selectedProp, setSelectedProp] = useState(null)
  const [uploadedModel, setUploadedModel] = useState(null)
  const fileInputRef = useRef(null)

  // 处理文件上传
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setUploadedModel({
        id: `uploaded_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        type: 'uploaded',
        url: url,
        file: file
      })
      setSelectedProp(null)
    }
  }

  // 确认选择
  const handleConfirm = () => {
    const prop = selectedProp || uploadedModel
    if (prop) {
      onSelect({
        ...prop,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 1
      })
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>📦 选择道具</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.content}>
          {/* 上传自定义模型 */}
          <div className={styles.uploadSection}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".glb,.gltf,.obj,.fbx"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button
              className={styles.uploadBtn}
              onClick={() => fileInputRef.current?.click()}
            >
              <span className={styles.uploadIcon}>📁</span>
              <span className={styles.uploadText}>
                {uploadedModel ? '更换模型' : '上传自定义模型'}
              </span>
              <span className={styles.uploadHint}>
                支持 GLB, GLTF, OBJ, FBX 格式
              </span>
            </button>
          </div>

          {/* 已上传的模型 */}
          {uploadedModel && (
            <div className={styles.uploadedInfo}>
              <span className={styles.fileIcon}>📦</span>
              <span className={styles.fileName}>{uploadedModel.name}</span>
            </div>
          )}

          {/* 预设道具网格 */}
          <div className={styles.sectionTitle}>预设道具</div>
          <div className={styles.propGrid}>
            {PRESET_PROPS.map(prop => (
              <div
                key={prop.id}
                className={`${styles.propItem} ${selectedProp?.id === prop.id ? styles.selected : ''}`}
                onClick={() => {
                  setSelectedProp(prop)
                  setUploadedModel(null)
                }}
              >
                <span className={styles.propIcon}>{prop.icon}</span>
                <span className={styles.propName}>{prop.name}</span>
                <span className={styles.propType}>
                  {prop.type === 'primitive' ? '基础形状' : '3D模型'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            取消
          </button>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={!selectedProp && !uploadedModel}
          >
            确认选择
          </button>
        </div>
      </div>
    </div>
  )
}

export default PropSelectorModal
