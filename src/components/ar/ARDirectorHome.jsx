import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './ARDirectorHome.module.css'

/**
 * AR Director 首页
 * 提供大大的AR录制按钮，进入场景录制流程
 */
export function ARDirectorHome() {
  const navigate = useNavigate()
  const [recentProjects, setRecentProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // 加载最近项目
  useEffect(() => {
    loadRecentProjects()
  }, [])

  const loadRecentProjects = async () => {
    try {
      // 从本地存储加载最近项目
      const projects = JSON.parse(localStorage.getItem('ar-director-projects') || '[]')
      setRecentProjects(projects.slice(0, 3)) // 只显示最近3个
    } catch (e) {
      console.warn('加载最近项目失败:', e)
    } finally {
      setIsLoading(false)
    }
  }

  // 开始新的场景采集 - 进入新的采集器
  const startSceneCapture = () => {
    navigate('/ar-director/capture-pro')
  }

  // 打开项目
  const openProject = (projectId) => {
    if (projectId) {
      navigate(`/ar-director/edit/${projectId}`)
    } else {
      // 新项目
      const newProjectId = `project_${Date.now()}`
      navigate(`/ar-director/edit/${newProjectId}`)
    }
  }

  // 打开场景库
  const openSceneLibrary = () => {
    navigate('/ar-director/scenes')
  }

  // 打开教程
  const openTutorial = () => {
    navigate('/ar-director/tutorial')
  }

  return (
    <div className={styles.container}>
      {/* 顶部导航 */}
      <header className={styles.header}>
        <h1 className={styles.title}>AR Director</h1>
        <button className={styles.settingsBtn} title="设置">
          ⚙️
        </button>
      </header>

      {/* 主内容区 */}
      <main className={styles.main}>
        {/* 宣传区域 */}
        <div className={styles.heroSection}>
          <div className={styles.heroVisual}>
            <div className={styles.arPreview}>
              <div className={styles.arIcon}>🎬</div>
              <div className={styles.arText}>让现实与虚拟完美融合</div>
            </div>
          </div>
        </div>

        {/* 功能按钮区域 */}
        <div className={styles.featuresSection}>
          <button 
            className={styles.featureBtn}
            onClick={startSceneCapture}
          >
            <span className={styles.featureIcon}>📹</span>
            <span className={styles.featureName}>录制场景</span>
            <span className={styles.featureDesc}>AR检测平面并录制</span>
          </button>
          
          <button 
            className={styles.featureBtn}
            onClick={() => navigate('/ar-director/manager')}
          >
            <span className={styles.featureIcon}>📂</span>
            <span className={styles.featureName}>场景库</span>
            <span className={styles.featureDesc}>管理所有场景</span>
          </button>
          
          <button 
            className={styles.featureBtn}
            onClick={() => navigate('/ar-director/import-image')}
          >
            <span className={styles.featureIcon}>🖼️</span>
            <span className={styles.featureName}>图片导入</span>
            <span className={styles.featureDesc}>直接导入图片作为背景</span>
          </button>
          
          <button 
            className={styles.featureBtn}
            onClick={() => navigate('/ar-director/mmd')}
          >
            <span className={styles.featureIcon}>🎬</span>
            <span className={styles.featureName}>MMD导演</span>
            <span className={styles.featureDesc}>专业时间轴编辑器</span>
          </button>
        </div>

        {/* 最近项目 */}
        <div className={styles.recentProjects}>
          <h2 className={styles.sectionTitle}>最近项目</h2>
          {isLoading ? (
            <div className={styles.loading}>加载中...</div>
          ) : recentProjects.length > 0 ? (
            <div className={styles.projectList}>
              {recentProjects.map((project) => (
                <div 
                  key={project.id} 
                  className={styles.projectCard}
                  onClick={() => openProject(project.id)}
                >
                  <div className={styles.projectThumbnail}>
                    {project.thumbnail ? (
                      <img src={project.thumbnail} alt={project.name} />
                    ) : (
                      <div className={styles.projectPlaceholder}>🎬</div>
                    )}
                  </div>
                  <div className={styles.projectInfo}>
                    <h3 className={styles.projectName}>{project.name}</h3>
                    <p className={styles.projectTime}>
                      {formatTimeAgo(project.modifiedAt)}
                    </p>
                  </div>
                  <button className={styles.continueBtn}>继续编辑</button>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>还没有项目，点击上方AR录制按钮开始创作吧！</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// 格式化时间
function formatTimeAgo(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}

export default ARDirectorHome
