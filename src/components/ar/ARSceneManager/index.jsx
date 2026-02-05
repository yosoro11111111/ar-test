import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './styles.module.css'

/**
 * AR Scene Manager - 场景库管理器（横屏版）
 * 
 * 功能：
 * 1. 显示所有保存的场景（网格布局）
 * 2. 场景选择、编辑、删除
 * 3. 场景预览和信息展示
 * 4. 进入时间轴编辑器
 */
export function ARSceneManager() {
  const navigate = useNavigate()
  
  const [scenes, setScenes] = useState([])
  const [selectedScene, setSelectedScene] = useState(null)
  const [editingScene, setEditingScene] = useState(null)
  const [newName, setNewName] = useState('')

  // 加载场景列表
  useEffect(() => {
    loadScenes()
  }, [])

  const loadScenes = () => {
    const savedScenes = JSON.parse(localStorage.getItem('ar-director-scenes') || '[]')
    setScenes(savedScenes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
    if (savedScenes.length > 0 && !selectedScene) {
      setSelectedScene(savedScenes[0])
    }
  }

  // 选择场景
  const handleSelectScene = (scene) => {
    setSelectedScene(scene)
    setEditingScene(null)
  }

  // 重命名场景
  const handleRename = (sceneId) => {
    if (!newName.trim()) return
    
    const updatedScenes = scenes.map(s => 
      s.id === sceneId ? { ...s, name: newName } : s
    )
    localStorage.setItem('ar-director-scenes', JSON.stringify(updatedScenes))
    setScenes(updatedScenes)
    
    if (selectedScene?.id === sceneId) {
      setSelectedScene({ ...selectedScene, name: newName })
    }
    setEditingScene(null)
    setNewName('')
  }

  // 重命名平面
  const handleRenamePlane = (planeId, name) => {
    if (!name.trim()) {
      setEditingScene(null)
      return
    }
    
    const updatedScenes = scenes.map(s => {
      if (s.id === selectedScene.id) {
        return {
          ...s,
          environment: {
            ...s.environment,
            planes: s.environment.planes.map(p => 
              p.id === planeId ? { ...p, name } : p
            )
          }
        }
      }
      return s
    })
    
    localStorage.setItem('ar-director-scenes', JSON.stringify(updatedScenes))
    setScenes(updatedScenes)
    
    const updatedSelected = updatedScenes.find(s => s.id === selectedScene.id)
    setSelectedScene(updatedSelected)
    setEditingScene(null)
    setNewName('')
  }

  // 删除场景
  const handleDelete = (sceneId) => {
    if (!confirm('确定要删除这个场景吗？')) return
    
    const filtered = scenes.filter(s => s.id !== sceneId)
    localStorage.setItem('ar-director-scenes', JSON.stringify(filtered))
    setScenes(filtered)
    
    if (selectedScene?.id === sceneId) {
      setSelectedScene(filtered[0] || null)
    }
  }

  // 进入时间轴编辑器
  const enterTimeline = () => {
    if (selectedScene) {
      navigate(`/ar-director/director/${selectedScene.id}`)
    }
  }

  // 格式化日期
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={styles.container}>
      {/* 顶部栏 */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/ar-director')}>
          ← 返回
        </button>
        <h1 className={styles.title}>🎨 场景库管理</h1>
        <button className={styles.newBtn} onClick={() => navigate('/ar-director/capture-pro')}>
          ➕ 新建场景
        </button>
      </header>

      {/* 主内容区 */}
      <main className={styles.main}>
        {/* 左侧：场景网格 */}
        <div className={styles.scenesSection}>
          <h2 className={styles.sectionTitle}>
            📂 我的场景
            <span className={styles.count}>({scenes.length})</span>
          </h2>
          
          <div className={styles.scenesGrid}>
            {scenes.map(scene => (
              <div
                key={scene.id}
                className={`${styles.sceneCard} ${selectedScene?.id === scene.id ? styles.selected : ''}`}
                onClick={() => handleSelectScene(scene)}
              >
                <div className={styles.thumbnailWrapper}>
                  {scene.thumbnail ? (
                    <img src={scene.thumbnail} alt={scene.name} className={styles.thumbnail} />
                  ) : (
                    <div className={styles.placeholder}>🖼️</div>
                  )}
                  {selectedScene?.id === scene.id && (
                    <div className={styles.selectedBadge}>✓</div>
                  )}
                </div>
                
                <div className={styles.sceneInfo}>
                  {editingScene === scene.id ? (
                    <input
                      type="text"
                      defaultValue={scene.name}
                      onChange={(e) => setNewName(e.target.value)}
                      onBlur={() => handleRename(scene.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRename(scene.id)}
                      autoFocus
                      className={styles.nameInput}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <h3 className={styles.sceneName}>{scene.name}</h3>
                  )}
                  <p className={styles.sceneDate}>{formatDate(scene.createdAt)}</p>
                  <p className={styles.sceneStats}>
                    {scene.environment?.planes?.length || 0} 个平面
                  </p>
                </div>
                
                <div className={styles.sceneActions}>
                  <button 
                    className={styles.actionBtn}
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingScene(scene.id)
                      setNewName(scene.name)
                    }}
                  >
                    ✏️
                  </button>
                  <button 
                    className={`${styles.actionBtn} ${styles.delete}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(scene.id)
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
            
            {scenes.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📂</div>
                <p>暂无保存的场景</p>
                <button 
                  className={styles.createFirstBtn}
                  onClick={() => navigate('/ar-director/capture-pro')}
                >
                  创建第一个场景
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 右侧：场景预览 */}
        <div className={styles.previewSection}>
          {selectedScene ? (
            <>
              <h2 className={styles.sectionTitle}>📋 场景详情</h2>
              
              <div className={styles.previewCard}>
                <div className={styles.previewImageWrapper}>
                  {selectedScene.thumbnail ? (
                    <img 
                      src={selectedScene.thumbnail} 
                      alt={selectedScene.name}
                      className={styles.previewImage}
                    />
                  ) : (
                    <div className={styles.previewPlaceholder}>🖼️</div>
                  )}
                </div>
                
                <div className={styles.previewInfo}>
                  <h3 className={styles.previewName}>{selectedScene.name}</h3>
                  <p className={styles.previewDate}>
                    创建时间: {formatDate(selectedScene.createdAt)}
                  </p>
                </div>
                
                {/* 平面列表 */}
                <div className={styles.planesList}>
                  <h4>检测到的平面 ({selectedScene.environment?.planes?.length || 0}):</h4>
                  {selectedScene.environment?.planes?.map((plane, index) => (
                    <div key={plane.id} className={styles.planeItem}>
                      <div className={styles.planeThumbnail}>
                        {selectedScene.planeThumbnails?.[index] ? (
                          <img 
                            src={selectedScene.planeThumbnails[index]} 
                            alt={plane.name}
                            className={styles.planeThumbImg}
                          />
                        ) : (
                          <div 
                            className={styles.planeColorThumb}
                            style={{ backgroundColor: plane.color }}
                          />
                        )}
                      </div>
                      <div className={styles.planeInfo}>
                        {editingScene === `plane_${plane.id}` ? (
                          <input
                            type="text"
                            defaultValue={plane.name}
                            onChange={(e) => setNewName(e.target.value)}
                            onBlur={() => handleRenamePlane(plane.id, newName)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRenamePlane(plane.id, e.target.value)}
                            autoFocus
                            className={styles.planeNameInput}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span 
                            className={styles.planeName}
                            onClick={() => {
                              setEditingScene(`plane_${plane.id}`)
                              setNewName(plane.name)
                            }}
                            title="点击重命名"
                          >
                            {plane.name} ✏️
                          </span>
                        )}
                        <span className={styles.planeSize}>
                          {plane.size.width.toFixed(1)}m × {plane.size.height.toFixed(1)}m
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* 操作按钮 */}
                <div className={styles.previewActions}>
                  <button className={styles.enterBtn} onClick={enterTimeline}>
                    🎬 进入时间轴编辑器
                  </button>
                  <button 
                    className={styles.editInfoBtn}
                    onClick={() => {
                      setEditingScene(selectedScene.id)
                      setNewName(selectedScene.name)
                    }}
                  >
                    ✏️ 编辑信息
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.noSelection}>
              <div className={styles.noSelectionIcon}>👆</div>
              <p>请从左侧选择一个场景</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default ARSceneManager
