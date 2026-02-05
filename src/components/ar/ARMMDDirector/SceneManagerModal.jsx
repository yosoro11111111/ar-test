import React, { useState, useEffect } from 'react'
import styles from './SceneManagerModal.module.css'

/**
 * 场景管理弹窗 - 管理场景列表
 * 功能：录制(AR识别平面)、导入(图片或AR包)、导出(AR包)、重命名、删除
 */
export function SceneManagerModal({ onSelect, onClose }) {
  const [scenes, setScenes] = useState(() => {
    const saved = localStorage.getItem('mmd-scenes')
    return saved ? JSON.parse(saved) : []
  })
  const [selectedScene, setSelectedScene] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingName, setEditingName] = useState(null)
  const [newName, setNewName] = useState('')

  // 保存场景列表到本地存储
  const saveScenes = (newScenes) => {
    setScenes(newScenes)
    localStorage.setItem('mmd-scenes', JSON.stringify(newScenes))
  }

  // 创建新场景
  const createScene = (name, type, data) => {
    const newScene = {
      id: `scene_${Date.now()}`,
      name: name || `场景 ${scenes.length + 1}`,
      type: type, // 'image' | 'ar'
      data: data, // { imageUrl, position, planes }
      createdAt: new Date().toISOString()
    }
    saveScenes([...scenes, newScene])
    setShowCreateModal(false)
  }

  // 删除场景
  const deleteScene = (sceneId) => {
    saveScenes(scenes.filter(s => s.id !== sceneId))
    if (selectedScene?.id === sceneId) {
      setSelectedScene(null)
    }
  }

  // 重命名场景
  const renameScene = (sceneId, name) => {
    saveScenes(scenes.map(s => 
      s.id === sceneId ? { ...s, name } : s
    ))
    setEditingName(null)
  }

  // 导出场景包
  const exportScene = (scene) => {
    const scenePackage = {
      version: '1.0',
      type: 'mmd-scene',
      data: scene
    }
    const blob = new Blob([JSON.stringify(scenePackage, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${scene.name}.mmdscene.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 导入场景包
  const importScene = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const packageData = JSON.parse(e.target.result)
        if (packageData.type === 'mmd-scene' && packageData.data) {
          const importedScene = {
            ...packageData.data,
            id: `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: `${packageData.data.name} (导入)`
          }
          saveScenes([...scenes, importedScene])
        } else {
          alert('无效的场景包文件')
        }
      } catch (error) {
        alert('导入失败：文件格式错误')
      }
    }
    reader.readAsText(file)
  }

  // 导入图片作为场景
  const importImageAsScene = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      createScene(
        file.name.replace(/\.[^/.]+$/, ''),
        'image',
        { imageUrl: e.target.result }
      )
    }
    reader.readAsDataURL(file)
  }

  // 录制AR场景（模拟）
  const recordARScene = () => {
    // 这里应该打开AR录制界面
    alert('AR录制功能：请使用AR Director的录制功能创建场景')
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>🗺️ 场景管理</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* 操作按钮 */}
        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={recordARScene}>
            📹 录制AR
          </button>
          <label className={styles.actionBtn}>
            🖼️ 导入图片
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && importImageAsScene(e.target.files[0])}
              style={{ display: 'none' }}
            />
          </label>
          <label className={styles.actionBtn}>
            📦 导入场景包
            <input
              type="file"
              accept=".json,.mmdscene.json"
              onChange={(e) => e.target.files?.[0] && importScene(e.target.files[0])}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {/* 场景列表 */}
        <div className={styles.sceneList}>
          {scenes.length === 0 ? (
            <div className={styles.empty}>
              <span>🗺️</span>
              <p>暂无场景</p>
              <p>点击上方按钮创建或导入</p>
            </div>
          ) : (
            scenes.map(scene => (
              <div
                key={scene.id}
                className={`${styles.sceneItem} ${selectedScene?.id === scene.id ? styles.selected : ''}`}
                onClick={() => setSelectedScene(scene)}
              >
                <div className={styles.scenePreview}>
                  {scene.type === 'image' && scene.data?.imageUrl ? (
                    <img src={scene.data.imageUrl} alt={scene.name} />
                  ) : (
                    <span>🗺️</span>
                  )}
                </div>
                
                <div className={styles.sceneInfo}>
                  {editingName === scene.id ? (
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onBlur={() => renameScene(scene.id, newName)}
                      onKeyDown={(e) => e.key === 'Enter' && renameScene(scene.id, newName)}
                      autoFocus
                    />
                  ) : (
                    <span className={styles.sceneName}>{scene.name}</span>
                  )}
                  <span className={styles.sceneType}>
                    {scene.type === 'image' ? '🖼️ 图片' : '📹 AR场景'}
                  </span>
                </div>

                <div className={styles.sceneActions}>
                  <button
                    className={styles.iconBtn}
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingName(scene.id)
                      setNewName(scene.name)
                    }}
                    title="重命名"
                  >
                    ✏️
                  </button>
                  <button
                    className={styles.iconBtn}
                    onClick={(e) => {
                      e.stopPropagation()
                      exportScene(scene)
                    }}
                    title="导出"
                  >
                    💾
                  </button>
                  <button
                    className={`${styles.iconBtn} ${styles.delete}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`确定删除场景 "${scene.name}" 吗？`)) {
                        deleteScene(scene.id)
                      }
                    }}
                    title="删除"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 底部按钮 */}
        <div className={styles.footer}>
          <span className={styles.count}>共 {scenes.length} 个场景</span>
          <div className={styles.rightBtns}>
            <button className={styles.cancelBtn} onClick={onClose}>取消</button>
            <button
              className={styles.selectBtn}
              onClick={() => {
                if (selectedScene) {
                  onSelect(selectedScene)
                  onClose()
                }
              }}
              disabled={!selectedScene}
            >
              选择场景
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SceneManagerModal
