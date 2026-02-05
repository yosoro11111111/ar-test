import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './SceneManagerModal.module.css'

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

  // 导出场景包 - 包含高清图片和JSON数据
  const exportScene = async (scene) => {
    try {
      // 创建场景包数据结构
      const scenePackage = {
        version: '1.0',
        type: 'mmd-scene',
        metadata: {
          name: scene.name,
          id: scene.id,
          type: scene.type,
          createdAt: scene.createdAt,
          exportedAt: new Date().toISOString()
        },
        data: {
          ...scene.data,
          // 不包含imageUrl，单独处理图片
          imageUrl: undefined
        }
      }

      // 如果是图片类型场景，需要下载图片并打包
      if (scene.type === 'image' && scene.data?.imageUrl) {
        // 获取图片数据
        const response = await fetch(scene.data.imageUrl)
        const imageBlob = await response.blob()
        
        // 转换为base64
        const reader = new FileReader()
        const imageBase64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(imageBlob)
        })
        
        // 将图片数据包含在JSON中
        scenePackage.imageData = imageBase64
      }

      // 导出为JSON文件
      const jsonBlob = new Blob([JSON.stringify(scenePackage, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(jsonBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${scene.name}.mmdscene.json`
      a.click()
      URL.revokeObjectURL(url)
      
      console.log('场景导出成功:', scene.name)
    } catch (error) {
      console.error('导出场景失败:', error)
      alert('导出失败: ' + error.message)
    }
  }

  // 导入场景包 - 支持包含图片数据的场景包
  const importScene = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const packageData = JSON.parse(e.target.result)
        if (packageData.type === 'mmd-scene' && packageData.data) {
          const importedScene = {
            id: `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: `${packageData.metadata?.name || '未命名场景'} (导入)`,
            type: packageData.metadata?.type || 'image',
            createdAt: new Date().toISOString(),
            data: {
              ...packageData.data,
              // 如果有图片数据，使用图片数据
              imageUrl: packageData.imageData || packageData.data?.imageUrl
            }
          }
          saveScenes([...scenes, importedScene])
          console.log('场景导入成功:', importedScene.name)
        } else {
          alert('无效的场景包文件')
        }
      } catch (error) {
        console.error('导入失败:', error)
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
