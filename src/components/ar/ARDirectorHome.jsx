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

  // 开始新的场景录制
  const startSceneRecording = () => {
    navigate('/ar-director/record')
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

        {/* 大大的AR录制按钮 */}
        <div className={styles.recordSection}>
          <button 
            className={styles.recordButton}
            onClick={startSceneRecording}
            title="开始录制AR场景"
          >
            <div className={styles.recordButtonInner}>
              <span className={styles.recordIcon}>📹</span>
              <span className={styles.recordText}>AR录制</span>
              <span className={styles.recordSubtext}>点击开始创作</span>
            </div>
            <div className={styles.recordPulse}></div>
          </button>
        </div>

        {/* 快捷操作 */}
        <div className={styles.quickActions}>
          <button className={styles.actionBtn} onClick={openSceneLibrary}>
            <span className={styles.actionIcon}>🎭</span>
            <span className={styles.actionText}>场景库</span>
          </button>
          <button className={styles.actionBtn} onClick={openTutorial}>
            <span className={styles.actionIcon}>📚</span>
            <span className={styles.actionText}>教程</span>
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
