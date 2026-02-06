import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './SceneManagerModal.module.css'
import { exportARScenePack, importARScenePack, downloadFile, isARScenePack } from './ARSceneIO'

/**
 * 场景管理弹窗 - 管理场景列表
 * 功能：录制(AR识别平面)、导入(图片或AR包)、导出(AR包)、重命名、删除
 */
export function SceneManagerModal({ onSelect, onClose }) {
  const navigate = useNavigate()
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

  // 导出场景包 - 使用新的ARPack格式
  const exportScene = async (scene) => {
    try {
      // 使用新的ARPack格式导出
      const blob = await exportARScenePack(scene)
      downloadFile(blob, `${scene.name}.arpack`)
      console.log('场景导出成功:', scene.name)
    } catch (error) {
      console.error('导出场景失败:', error)
      alert('导出失败: ' + error.message)
    }
  }

  // 导入场景包 - 支持ARPack格式
  const importScene = async (file) => {
    try {
      let importedScene
      
      if (isARScenePack(file)) {
        // 使用新的ARPack格式导入
        importedScene = await importARScenePack(file)
      } else {
        // 兼容旧版JSON格式
        const text = await file.text()
        const packageData = JSON.parse(text)
        if (packageData.type === 'mmd-scene' && packageData.data) {
          importedScene = {
            id: `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: `${packageData.metadata?.name || '未命名场景'} (导入)`,
            type: packageData.metadata?.type || 'image',
            createdAt: new Date().toISOString(),
            data: {
              ...packageData.data,
              imageUrl: packageData.imageData || packageData.data?.imageUrl
            }
          }
        } else {
          throw new Error('无效的场景包文件')
        }
      }
      
      saveScenes([...scenes, importedScene])
      console.log('场景导入成功:', importedScene.name)
    } catch (error) {
      console.error('导入失败:', error)
      alert('导入失败：' + error.message)
    }
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

  // 录制AR场景 - 跳转到AR Director录制页面
  const recordARScene = () => {
    // 保存当前状态并跳转到录制页面，传递返回路径
    navigate('/ar-director/record', { 
      state: { returnPath: '/ar-director/mmd' }
    })
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
              accept=".arpack,.arscene,.arscene2,.webxrar,.json,.mmdscene.json"
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
                    {scene.type === 'image' ? '🖼️ 图片' : 
                     scene.type === 'webxr-ar' ? '🥽 WebXR AR' : 
                     scene.type === 'real-ar' ? '📷 真实AR' :
                     scene.type === 'true-ar' ? '📷 真实AR+' : '📹 AR场景'}
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
