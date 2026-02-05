import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './ARSceneSelector.module.css'

/**
 * AR场景选择界面
 * 点击"AR录制"后进入，提供新建、导入、退出选项
 */
export function ARSceneSelector() {
  const navigate = useNavigate()
  const [savedScenes, setSavedScenes] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // 加载已保存的场景
  useEffect(() => {
    loadSavedScenes()
  }, [])

  const loadSavedScenes = () => {
    try {
      const scenes = JSON.parse(localStorage.getItem('ar-director-scenes') || '[]')
      // 按创建时间倒序排列
      setSavedScenes(scenes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
    } catch (error) {
      console.error('加载场景失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 新建画面
  const handleNewScene = () => {
    navigate('/ar-director/capture')
  }

  // 导入已有场景
  const handleImportScene = (sceneId) => {
    navigate(`/ar-director/edit/${sceneId}`)
  }

  // 返回主菜单
  const handleBackToMenu = () => {
    navigate('/ar-director')
  }

  // 删除场景
  const handleDeleteScene = (e, sceneId) => {
    e.stopPropagation()
    if (confirm('确定要删除这个场景吗？')) {
      const scenes = JSON.parse(localStorage.getItem('ar-director-scenes') || '[]')
      const filtered = scenes.filter(s => s.id !== sceneId)
      localStorage.setItem('ar-director-scenes', JSON.stringify(filtered))
      loadSavedScenes()
    }
  }

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={styles.container}>
      {/* 顶部导航 */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={handleBackToMenu}>
          ← 返回
        </button>
        <h1 className={styles.title}>📁 场景管理</h1>
        <div className={styles.headerSpacer}></div>
      </header>

      {/* 主内容 */}
      <main className={styles.main}>
        {/* 新建画面按钮 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>创建新场景</h2>
          <button className={styles.newSceneBtn} onClick={handleNewScene}>
            <div className={styles.newSceneIcon}>➕</div>
            <div className={styles.newSceneText}>
              <span className={styles.newSceneMain}>新建画面</span>
              <span className={styles.newSceneSub}>创建全新的AR场景</span>
            </div>
          </button>
        </section>

        {/* 已有场景列表 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            导入已有场景
            <span className={styles.sceneCount}>({savedScenes.length})</span>
          </h2>
          
          {isLoading ? (
            <div className={styles.loading}>加载中...</div>
          ) : savedScenes.length > 0 ? (
            <div className={styles.scenesGrid}>
              {savedScenes.map(scene => (
                <div 
                  key={scene.id}
                  className={styles.sceneCard}
                  onClick={() => handleImportScene(scene.id)}
                >
                  <div className={styles.sceneThumbnailWrapper}>
                    {scene.thumbnail ? (
                      <img 
                        src={scene.thumbnail} 
                        alt={scene.name}
                        className={styles.sceneThumbnail}
                      />
                    ) : (
                      <div className={styles.scenePlaceholder}>
                        <span>🖼️</span>
                      </div>
                    )}
                    <div className={styles.sceneOverlay}>
                      <span className={styles.importText}>点击导入</span>
                    </div>
                  </div>
                  <div className={styles.sceneInfo}>
                    <h3 className={styles.sceneName}>{scene.name}</h3>
                    <p className={styles.sceneDate}>{formatDate(scene.createdAt)}</p>
                    <p className={styles.sceneStats}>
                      {scene.environment?.planes?.length || 0} 个平面
                    </p>
                  </div>
                  <button 
                    className={styles.deleteBtn}
                    onClick={(e) => handleDeleteScene(e, scene.id)}
                    title="删除场景"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📂</div>
              <p className={styles.emptyText}>暂无保存的场景</p>
              <p className={styles.emptySub}>点击上方"新建画面"创建第一个场景</p>
            </div>
          )}
        </section>

        {/* 底部退出按钮 */}
        <section className={styles.section}>
          <button className={styles.exitBtn} onClick={handleBackToMenu}>
            ← 返回主菜单
          </button>
        </section>
      </main>
    </div>
  )
}

export default ARSceneSelector
