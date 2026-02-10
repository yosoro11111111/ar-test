import React from 'react'
import styles from './AboutModal.module.css'

export function AboutModal({ onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>关于 MMD Studio</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🎬</span>
            <span className={styles.logoText}>MMD Studio</span>
          </div>
          
          <div className={styles.version}>
            <span className={styles.versionLabel}>版本</span>
            <span className={styles.versionNumber}>v2.0.0</span>
          </div>
          
          <p className={styles.description}>
            MMD Studio 是一个基于 Web 的 3D 动画制作平台，支持 VRM 角色、GLB 场景和动作编辑。
          </p>
          
          <div className={styles.features}>
            <h3 className={styles.sectionTitle}>主要功能</h3>
            <ul className={styles.featureList}>
              <li>🎭 VRM 角色导入和编辑</li>
              <li>🏞️ GLB 场景和道具支持</li>
              <li>🎬 时间轴动画编辑</li>
              <li>🎵 音频同步</li>
              <li>📷 多摄像机支持</li>
              <li>✨ 特效系统</li>
            </ul>
          </div>
          
          <div className={styles.tech}>
            <h3 className={styles.sectionTitle}>技术栈</h3>
            <div className={styles.techList}>
              <span className={styles.techItem}>React</span>
              <span className={styles.techItem}>Three.js</span>
              <span className={styles.techItem}>@pixiv/three-vrm</span>
              <span className={styles.techItem}>Vite</span>
            </div>
          </div>
          
          <div className={styles.footer}>
            <p className={styles.copyright}>
              © 2024 MMD Studio. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
