import React, { useState } from 'react'
import styles from './Modal.module.css'

/**
 * 设置弹窗
 *
 * 功能：
 * - 项目设置
 * - 渲染设置
 * - 快捷键设置
 * - 自动保存设置
 */
export function SettingsModal({ project, onClose, onUpdateProject }) {
  const [activeTab, setActiveTab] = useState('project')

  const tabs = [
    { id: 'project', name: '项目', icon: '📁' },
    { id: 'render', name: '渲染', icon: '🎨' },
    { id: 'shortcuts', name: '快捷键', icon: '⌨️' },
    { id: 'autosave', name: '自动保存', icon: '💾' }
  ]

  const renderProjectTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.formGroup}>
        <label className={styles.label}>项目名称</label>
        <input
          type="text"
          className={styles.input}
          defaultValue={project?.name}
          onChange={(e) => onUpdateProject?.({ name: e.target.value })}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>项目描述</label>
        <textarea
          className={styles.textarea}
          rows={3}
          defaultValue={project?.description}
          onChange={(e) => onUpdateProject?.({ description: e.target.value })}
        />
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.label}>帧率</label>
          <select className={styles.select} defaultValue={project?.settings?.fps || 60}>
            <option value={30}>30 FPS</option>
            <option value={60}>60 FPS</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>时长 (秒)</label>
          <input
            type="number"
            className={styles.input}
            defaultValue={project?.settings?.duration || 120}
            min={10}
            max={600}
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.label}>宽度</label>
          <input
            type="number"
            className={styles.input}
            defaultValue={project?.settings?.resolution?.width || 1920}
            step={2}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>高度</label>
          <input
            type="number"
            className={styles.input}
            defaultValue={project?.settings?.resolution?.height || 1080}
            step={2}
          />
        </div>
      </div>
    </div>
  )

  const renderRenderTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>渲染质量</div>
        <div className={styles.radioGroup}>
          <label className={styles.radio}>
            <input type="radio" name="quality" value="low" />
            <span>低 - 快速预览</span>
          </label>
          <label className={styles.radio}>
            <input type="radio" name="quality" value="medium" defaultChecked />
            <span>中 - 平衡</span>
          </label>
          <label className={styles.radio}>
            <input type="radio" name="quality" value="high" />
            <span>高 - 最佳质量</span>
          </label>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>后处理效果</div>
        <label className={styles.checkbox}>
          <input type="checkbox" defaultChecked />
          <span>抗锯齿 (MSAA)</span>
        </label>
        <label className={styles.checkbox}>
          <input type="checkbox" />
          <span>辉光效果 (Bloom)</span>
        </label>
        <label className={styles.checkbox}>
          <input type="checkbox" />
          <span>景深 (Depth of Field)</span>
        </label>
        <label className={styles.checkbox}>
          <input type="checkbox" />
          <span>环境光遮蔽 (AO)</span>
        </label>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>阴影</div>
        <label className={styles.checkbox}>
          <input type="checkbox" defaultChecked />
          <span>启用阴影</span>
        </label>
        <div className={styles.formGroup}>
          <label className={styles.label}>阴影质量</label>
          <select className={styles.select}>
            <option>低 (1024)</option>
            <option>中 (2048)</option>
            <option>高 (4096)</option>
          </select>
        </div>
      </div>
    </div>
  )

  const renderShortcutsTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.shortcutsList}>
        {[
          { action: '新建项目', shortcut: 'Ctrl + N' },
          { action: '打开项目', shortcut: 'Ctrl + O' },
          { action: '保存项目', shortcut: 'Ctrl + S' },
          { action: '导出', shortcut: 'Ctrl + E' },
          { action: '撤销', shortcut: 'Ctrl + Z' },
          { action: '重做', shortcut: 'Ctrl + Y' },
          { action: '复制', shortcut: 'Ctrl + C' },
          { action: '粘贴', shortcut: 'Ctrl + V' },
          { action: '删除', shortcut: 'Delete' },
          { action: '播放/暂停', shortcut: 'Space' },
          { action: '前进一帧', shortcut: '→' },
          { action: '后退一帧', shortcut: '←' },
          { action: '跳到开头', shortcut: 'Home' },
          { action: '跳到结尾', shortcut: 'End' }
        ].map((item, index) => (
          <div key={index} className={styles.shortcutItem}>
            <span className={styles.shortcutAction}>{item.action}</span>
            <kbd className={styles.shortcutKey}>{item.shortcut}</kbd>
          </div>
        ))}
      </div>
    </div>
  )

  const renderAutosaveTab = () => (
    <div className={styles.tabContent}>
      <label className={styles.checkbox}>
        <input type="checkbox" defaultChecked />
        <span>启用自动保存</span>
      </label>

      <div className={styles.formGroup}>
        <label className={styles.label}>自动保存间隔</label>
        <select className={styles.select}>
          <option>1 分钟</option>
          <option>5 分钟</option>
          <option>10 分钟</option>
          <option>15 分钟</option>
        </select>
      </div>

      <div className={styles.infoBox}>
        <p>自动保存的文件将存储在浏览器本地存储中。</p>
        <p>建议定期手动保存重要项目。</p>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'project': return renderProjectTab()
      case 'render': return renderRenderTab()
      case 'shortcuts': return renderShortcutsTab()
      case 'autosave': return renderAutosaveTab()
      default: return null
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.large}`} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>设置</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.tabs}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabName}>{tab.name}</span>
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {renderContent()}
        </div>

        <div className={styles.footer}>
          <button className={styles.btnSecondary} onClick={onClose}>
            取消
          </button>
          <button className={styles.btnPrimary} onClick={onClose}>
            保存设置
          </button>
        </div>
      </div>
    </div>
  )
}
