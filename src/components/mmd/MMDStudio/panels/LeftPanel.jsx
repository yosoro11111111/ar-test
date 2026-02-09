import React, { useState } from 'react'
import styles from './LeftPanel.module.css'
import { ResourceSelectorModal } from '../modals/ResourceSelectorModal.jsx'

export function LeftPanel({ resources, onImportResource, onAddCharacter, onAddProp, onAddScene, onAddMotion }) {
  const [activeTab, setActiveTab] = useState('characters')
  const [showSelector, setShowSelector] = useState(false)

  const tabs = [
    { id: 'characters', name: '角色', icon: '👤' },
    { id: 'props', name: '道具', icon: '📦' },
    { id: 'scenes', name: '场景', icon: '🏞️' },
    { id: 'motions', name: '动作', icon: '🎭' }
  ]

  const handleTabClick = (tabId) => {
    setActiveTab(tabId)
    // 只切换标签，不弹出选择框
  }

  const handleAddClick = () => {
    // 点击添加按钮时才弹出选择框
    setShowSelector(true)
  }

  const handleSelectResource = (resource) => {
    // 根据类型调用不同的回调
    switch (resource.type) {
      case 'characters':
        onAddCharacter(resource)
        break
      case 'props':
        if (onAddProp) onAddProp(resource)
        break
      case 'scenes':
        if (onAddScene) onAddScene(resource)
        break
      case 'motions':
        if (onAddMotion) onAddMotion(resource)
        break
      default:
        onImportResource(resource.type, [resource])
    }
  }

  const currentTab = tabs.find(t => t.id === activeTab)

  return (
    <div className={styles.container}>
      {/* 标签页 */}
      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            <span>{tab.icon}</span>
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* 资源列表 */}
      <div className={styles.content}>
        <div className={styles.sectionHeader}>
          <span>{currentTab?.name}库</span>
          <button 
            className={styles.importBtn}
            onClick={handleAddClick}
          >
            + 添加{currentTab?.name}
          </button>
        </div>

        <div className={styles.resourceList}>
          {(resources[activeTab] || []).map(item => (
            <div key={item.id} className={styles.resourceItem}>
              <div className={styles.resourceIcon}>
                {activeTab === 'characters' && '👤'}
                {activeTab === 'props' && '📦'}
                {activeTab === 'scenes' && '🏞️'}
                {activeTab === 'motions' && '🎭'}
              </div>
              <div className={styles.resourceInfo}>
                <div className={styles.resourceName}>{item.name}</div>
                <div className={styles.resourceType}>{item.type}</div>
              </div>
              {activeTab === 'characters' && (
                <button 
                  className={styles.addBtn}
                  onClick={() => onAddCharacter(item)}
                >
                  添加
                </button>
              )}
            </div>
          ))}
          
          {(resources[activeTab] || []).length === 0 && (
            <div className={styles.empty}>
              暂无{currentTab?.name}
              <br />
              点击"添加{currentTab?.name}"按钮导入
            </div>
          )}
        </div>
      </div>

      {/* 资源选择弹窗 */}
      {showSelector && (
        <ResourceSelectorModal
          type={activeTab}
          onClose={() => setShowSelector(false)}
          onSelect={handleSelectResource}
        />
      )}
    </div>
  )
}
