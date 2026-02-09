import React from 'react'
import styles from './WelcomeScreen.module.css'

/**
 * 启动引导界面
 * 
 * 功能：
 * - 新建项目
 * - 打开项目
 * - 导入资源包
 * - 显示最近项目列表
 */
export function WelcomeScreen({ 
  recentProjects = [], 
  onNewProject, 
  onOpenProject,
  onImportResourcePack 
}) {
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={styles.container}>
      {/* Logo区域 */}
      <div className={styles.logoSection}>
        <div className={styles.logo}>🎬</div>
        <h1 className={styles.title}>MMD Studio</h1>
        <p className={styles.subtitle}>专业的MMD动画制作平台</p>
      </div>

      {/* 主操作区 */}
      <div className={styles.mainActions}>
        <button className={styles.actionCard} onClick={onNewProject}>
          <div className={styles.actionIcon}>🆕</div>
          <div className={styles.actionTitle}>新建项目</div>
          <div className={styles.actionDesc}>创建一个新的MMD动画项目</div>
        </button>

        <button className={styles.actionCard} onClick={onOpenProject}>
          <div className={styles.actionIcon}>📂</div>
          <div className={styles.actionTitle}>打开项目</div>
          <div className={styles.actionDesc}>浏览并打开已有项目</div>
        </button>

        <button className={styles.actionCard} onClick={onImportResourcePack}>
          <div className={styles.actionIcon}>📦</div>
          <div className={styles.actionTitle}>导入资源包</div>
          <div className={styles.actionDesc}>导入 .smmdpack 资源包</div>
        </button>
      </div>

      {/* 最近项目 */}
      <div className={styles.recentSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>📋 最近项目</span>
        </div>
        
        <div className={styles.recentList}>
          {recentProjects.length > 0 ? (
            recentProjects.map(project => (
              <div 
                key={project.id} 
                className={styles.recentItem}
                onClick={() => onOpenProject(project.id)}
              >
                <div className={styles.projectIcon}>🎬</div>
                <div className={styles.projectInfo}>
                  <div className={styles.projectName}>{project.name}</div>
                  <div className={styles.projectMeta}>
                    <span>时长: {Math.floor(project.duration / 60)}:{(project.duration % 60).toString().padStart(2, '0')}</span>
                    <span>•</span>
                    <span>{formatDate(project.lastModified)}</span>
                  </div>
                </div>
                <button className={styles.openBtn}>打开</button>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📭</div>
              <div className={styles.emptyText}>暂无最近项目</div>
              <div className={styles.emptySubtext}>点击"新建项目"开始创作</div>
            </div>
          )}
        </div>
      </div>

      {/* 底部信息 */}
      <div className={styles.footer}>
        <span>v2.0.0</span>
        <span className={styles.divider}>|</span>
        <span>支持 VRM 角色、VRMA 动作</span>
      </div>
    </div>
  )
}
