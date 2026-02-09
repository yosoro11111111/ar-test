import React, { useState } from 'react'
import styles from './ProjectWizard.module.css'

/**
 * 新建项目向导
 * 
 * 步骤：
 * 1. 项目信息（名称、描述、模板、基础设置）
 * 2. 选择可加载资源
 * 3. 确认并加载资源（带进度条）
 */
export function ProjectWizard({ onCancel, onComplete, availableResources, resourceManager }) {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState({
    current: 0,
    total: 0,
    currentResource: '',
    loadedResources: []
  })
  const [selectedResources, setSelectedResources] = useState({
    characters: [],
    props: [],
    scenes: [],
    motions: [],
    music: []
  })
  const [activeTab, setActiveTab] = useState('characters')
  const [projectConfig, setProjectConfig] = useState({
    name: '',
    description: '',
    template: 'dance',
    resolution: { width: 1920, height: 1080 },
    fps: 60,
    duration: 120,
    selectedPacks: [],
    background: { type: 'color', color: '#0a0a0f' }
  })

  const templates = [
    { id: 'blank', name: '空白项目', icon: '📄', desc: '从零开始创建' },
    { id: 'dance', name: '舞蹈MMD', icon: '💃', desc: '预设舞蹈场景' },
    { id: 'story', name: '剧情短片', icon: '🎬', desc: '多镜头叙事' },
    { id: 'custom', name: '自定义', icon: '⚙️', desc: '完全自定义' }
  ]

  const tabs = [
    { id: 'characters', name: '角色', icon: '👤' },
    { id: 'props', name: '道具', icon: '📦' },
    { id: 'scenes', name: '场景', icon: '🏞️' },
    { id: 'motions', name: '动作', icon: '🎭' }
  ]

  // 获取所有选中的资源列表
  const getAllSelectedResources = () => {
    return Object.values(selectedResources).flat()
  }

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      // 步骤3：开始加载资源
      await handleCreateProject()
    }
  }

  const handleCreateProject = async () => {
    const resourcesToLoad = getAllSelectedResources()
    
    if (resourcesToLoad.length === 0) {
      // 没有选中资源，直接完成
      onComplete(projectConfig)
      return
    }

    setIsLoading(true)
    setLoadingProgress({
      current: 0,
      total: resourcesToLoad.length,
      currentResource: resourcesToLoad[0]?.name || '',
      loadedResources: []
    })

    try {
      // 批量加载资源，带进度回调
      await resourceManager.loadResources(
        resourcesToLoad,
        // 进度回调
        (current, total, resourceName) => {
          setLoadingProgress(prev => ({
            ...prev,
            current,
            total,
            currentResource: resourceName || prev.currentResource
          }))
        },
        // 单个资源加载完成回调
        (loadedResource, current, total) => {
          setLoadingProgress(prev => ({
            ...prev,
            current,
            loadedResources: [...prev.loadedResources, loadedResource]
          }))
        }
      )

      // 加载完成，通知父组件
      onComplete(projectConfig)
    } catch (error) {
      console.error('加载资源失败:', error)
      alert('部分资源加载失败，请重试')
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (isLoading) return // 加载中不允许返回
    if (step > 1) {
      setStep(step - 1)
    } else {
      onCancel()
    }
  }

  const toggleResource = (type, resource) => {
    setSelectedResources(prev => {
      const current = prev[type]
      const exists = current.find(r => r.id === resource.id)
      
      if (exists) {
        return {
          ...prev,
          [type]: current.filter(r => r.id !== resource.id)
        }
      } else {
        return {
          ...prev,
          [type]: [...current, resource]
        }
      }
    })
  }

  const isSelected = (type, resourceId) => {
    return selectedResources[type].some(r => r.id === resourceId)
  }

  // 步骤1：项目信息
  const renderStep1 = () => (
    <div className={styles.stepContent}>
      <div className={styles.section}>
        <label className={styles.label}>项目名称</label>
        <input
          type="text"
          className={styles.input}
          value={projectConfig.name}
          onChange={(e) => setProjectConfig({ ...projectConfig, name: e.target.value })}
          placeholder="输入项目名称"
        />
      </div>

      <div className={styles.section}>
        <label className={styles.label}>项目描述</label>
        <textarea
          className={styles.textarea}
          value={projectConfig.description}
          onChange={(e) => setProjectConfig({ ...projectConfig, description: e.target.value })}
          placeholder="描述一下这个项目..."
          rows={3}
        />
      </div>

      <div className={styles.section}>
        <label className={styles.label}>选择模板</label>
        <div className={styles.templateGrid}>
          {templates.map(template => (
            <div
              key={template.id}
              className={`${styles.templateCard} ${projectConfig.template === template.id ? styles.selected : ''}`}
              onClick={() => setProjectConfig({ ...projectConfig, template: template.id })}
            >
              <div className={styles.templateIcon}>{template.icon}</div>
              <div className={styles.templateName}>{template.name}</div>
              <div className={styles.templateDesc}>{template.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>基础设置</label>
        <div className={styles.settingsGrid}>
          <div className={styles.settingItem}>
            <span>分辨率</span>
            <select
              className={styles.select}
              value={`${projectConfig.resolution.width}x${projectConfig.resolution.height}`}
              onChange={(e) => {
                const [width, height] = e.target.value.split('x').map(Number)
                setProjectConfig({ ...projectConfig, resolution: { width, height } })
              }}
            >
              <option value="1920x1080">1920x1080 (FHD)</option>
              <option value="2560x1440">2560x1440 (2K)</option>
              <option value="3840x2160">3840x2160 (4K)</option>
              <option value="1080x1920">1080x1920 (竖屏)</option>
            </select>
          </div>

          <div className={styles.settingItem}>
            <span>帧率</span>
            <select
              className={styles.select}
              value={projectConfig.fps}
              onChange={(e) => setProjectConfig({ ...projectConfig, fps: Number(e.target.value) })}
            >
              <option value={30}>30 FPS</option>
              <option value={60}>60 FPS</option>
            </select>
          </div>

          <div className={styles.settingItem}>
            <span>时长(秒)</span>
            <input
              type="number"
              className={styles.input}
              value={projectConfig.duration}
              onChange={(e) => setProjectConfig({ ...projectConfig, duration: Number(e.target.value) })}
              min={10}
              max={600}
            />
          </div>
        </div>
      </div>
    </div>
  )

  // 步骤2：选择可加载资源
  const renderStep2 = () => (
    <div className={styles.stepContent}>
      <div className={styles.sectionTitle}>选择要加载的资源</div>
      <div className={styles.resourceHint}>从以下资源中选择要在项目中使用的资源</div>
      
      {/* 资源类型标签 */}
      <div className={styles.resourceTabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.resourceTab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabName}>{tab.name}</span>
            <span className={styles.tabCount}>
              {availableResources[tab.id]?.length || 0}
            </span>
          </button>
        ))}
      </div>

      {/* 资源列表 */}
      <div className={styles.resourceList}>
        {availableResources[activeTab]?.length > 0 ? (
          availableResources[activeTab].map(resource => (
            <label key={resource.id} className={styles.resourceItem}>
              <input
                type="checkbox"
                checked={isSelected(activeTab, resource.id)}
                onChange={() => toggleResource(activeTab, resource)}
              />
              <span className={styles.resourceIcon}>{tabs.find(t => t.id === activeTab)?.icon}</span>
              <span className={styles.resourceName}>{resource.name}</span>
              <span className={styles.resourceCategory}>{resource.category}</span>
            </label>
          ))
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📭</div>
            <div className={styles.emptyText}>暂无{tabs.find(t => t.id === activeTab)?.name}资源</div>
          </div>
        )}
      </div>

      {/* 已选择摘要 */}
      <div className={styles.selectedSummary}>
        <div className={styles.summaryTitle}>已选择</div>
        <div className={styles.summaryList}>
          {Object.entries(selectedResources).map(([type, items]) => (
            items.length > 0 && (
              <div key={type} className={styles.summaryItem}>
                <span>{tabs.find(t => t.id === type)?.icon} {tabs.find(t => t.id === type)?.name}</span>
                <span>{items.length} 个</span>
              </div>
            )
          ))}
          {Object.values(selectedResources).every(arr => arr.length === 0) && (
            <div className={styles.summaryEmpty}>尚未选择任何资源</div>
          )}
        </div>
      </div>
    </div>
  )

  // 步骤3：确认并加载资源
  const renderStep3 = () => {
    const allSelected = getAllSelectedResources()
    const progress = loadingProgress.total > 0 
      ? Math.round((loadingProgress.current / loadingProgress.total) * 100) 
      : 0

    return (
      <div className={styles.stepContent}>
        {!isLoading ? (
          <>
            <div className={styles.sectionTitle}>项目配置确认</div>
            
            <div className={styles.confirmSection}>
              <div className={styles.confirmTitle}>📋 项目信息</div>
              <div className={styles.confirmItem}>
                <span>名称:</span>
                <span>{projectConfig.name || '未命名项目'}</span>
              </div>
              <div className={styles.confirmItem}>
                <span>模板:</span>
                <span>{templates.find(t => t.id === projectConfig.template)?.name}</span>
              </div>
              <div className={styles.confirmItem}>
                <span>分辨率:</span>
                <span>{projectConfig.resolution.width}x{projectConfig.resolution.height}</span>
              </div>
              <div className={styles.confirmItem}>
                <span>帧率:</span>
                <span>{projectConfig.fps} FPS</span>
              </div>
              <div className={styles.confirmItem}>
                <span>时长:</span>
                <span>{projectConfig.duration} 秒</span>
              </div>
            </div>

            <div className={styles.confirmSection}>
              <div className={styles.confirmTitle}>📦 已选资源 ({allSelected.length})</div>
              {Object.entries(selectedResources).map(([type, items]) => (
                items.length > 0 && (
                  <div key={type} className={styles.confirmResourceType}>
                    <div className={styles.confirmTypeTitle}>
                      {tabs.find(t => t.id === type)?.icon} {tabs.find(t => t.id === type)?.name} ({items.length})
                    </div>
                    <div className={styles.confirmResourceList}>
                      {items.map(item => (
                        <span key={item.id} className={styles.confirmResourceTag}>{item.name}</span>
                      ))}
                    </div>
                  </div>
                )
              ))}
              {allSelected.length === 0 && (
                <div className={styles.confirmEmpty}>未选择任何资源（可在编辑器中稍后加载）</div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingIcon}>⏳</div>
            <div className={styles.loadingTitle}>正在加载资源...</div>
            
            {/* 总进度条 */}
            <div className={styles.progressBarContainer}>
              <div 
                className={styles.progressBar} 
                style={{ width: `${progress}%` }}
              />
              <span className={styles.progressText}>{progress}%</span>
            </div>
            
            {/* 当前加载的资源 */}
            <div className={styles.loadingCurrent}>
              {loadingProgress.currentResource && (
                <>
                  正在加载: <span className={styles.loadingResourceName}>{loadingProgress.currentResource}</span>
                </>
              )}
            </div>
            
            {/* 加载统计 */}
            <div className={styles.loadingStats}>
              {loadingProgress.current} / {loadingProgress.total} 个资源
            </div>
            
            {/* 已加载资源列表 */}
            {loadingProgress.loadedResources.length > 0 && (
              <div className={styles.loadedList}>
                <div className={styles.loadedListTitle}>已加载完成:</div>
                <div className={styles.loadedItems}>
                  {loadingProgress.loadedResources.slice(-5).map((res, idx) => (
                    <span key={idx} className={styles.loadedItem}>✓ {res.name}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const stepTitles = ['项目信息', '选择资源', '确认创建']

  return (
    <div className={styles.container}>
      <div className={styles.wizard}>
        {/* 头部 */}
        <div className={styles.header}>
          <h2 className={styles.title}>新建项目</h2>
          <button className={styles.closeBtn} onClick={onCancel} disabled={isLoading}>×</button>
        </div>

        {/* 步骤指示器 */}
        <div className={styles.stepIndicator}>
          {stepTitles.map((title, index) => (
            <div
              key={index}
              className={`${styles.step} ${step === index + 1 ? styles.active : ''} ${step > index + 1 ? styles.completed : ''}`}
            >
              <div className={styles.stepNumber}>{index + 1}</div>
              <div className={styles.stepTitle}>{title}</div>
            </div>
          ))}
        </div>

        {/* 步骤内容 */}
        <div className={styles.content}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        {/* 底部按钮 */}
        <div className={styles.footer}>
          <button 
            className={styles.btnSecondary} 
            onClick={handleBack}
            disabled={isLoading}
          >
            {step === 1 ? '取消' : '上一步'}
          </button>
          <button 
            className={styles.btnPrimary} 
            onClick={handleNext}
            disabled={isLoading}
          >
            {isLoading ? '加载中...' : step === 3 ? '创建项目' : '下一步'}
          </button>
        </div>
      </div>
    </div>
  )
}
