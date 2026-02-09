import React, { useState, useMemo, useEffect } from 'react'
import styles from './LeftPanel.module.css'
import { MotionGroupPanel } from '../components/MotionGroupPanel.jsx'

/**
 * 左侧面板 - 资源库 V3
 * 
 * 功能：
 * - 显示可加载的资源（从 public 扫描）
 * - 显示已加载的资源
 * - 加载/卸载资源
 * - 分类筛选
 * - 动作组系统
 */
export function LeftPanel({
  availableResources,
  loadedResources,
  project,
  onLoadResource,
  onUnloadResource,
  onAddToScene,
  resourceManager
}) {
  const [activeTab, setActiveTab] = useState('characters')
  const [viewMode, setViewMode] = useState('available') // 'available', 'loaded'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedResources, setSelectedResources] = useState(new Set())
  
  // 纯色场景颜色选择器状态
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [selectedColor, setSelectedColor] = useState('#0a0a1a')
  const [colorSceneName, setColorSceneName] = useState('纯色场景')

  // 调试：监听资源变化
  useEffect(() => {
    console.log('LeftPanel - availableResources:', availableResources)
    console.log('LeftPanel - loadedResources:', loadedResources)
    console.log('LeftPanel - activeTab:', activeTab)
    console.log('LeftPanel - current tab resources:', availableResources[activeTab])
  }, [availableResources, loadedResources, activeTab])

  const tabs = [
    { id: 'characters', name: '角色', icon: '👤', tooltip: '角色' },
    { id: 'props', name: '道具', icon: '📦', tooltip: '道具' },
    { id: 'scenes', name: '场景', icon: '🏞️', tooltip: '场景' },
    { id: 'motions', name: '动作', icon: '🎭', tooltip: '动作' },
    { id: 'motionGroups', name: '动作组', icon: '🎬', tooltip: '动作组' },
    { id: 'music', name: '音乐', icon: '🎵', tooltip: '音乐' },
    { id: 'effects', name: '特效', icon: '✨', tooltip: '特效' }
  ]

  // 分类名称映射表（英文/其他 -> 中文）
  const categoryNameMap = {
    'all': '全部',
    'dance': '舞蹈',
    'expression': '表情',
    'pose': '姿势',
    'idle': '待机',
    'walk': '行走',
    'run': '跑步',
    'jump': '跳跃',
    'attack': '攻击',
    'skill': '技能',
    'emotion': '情绪',
    'greeting': '问候',
    'default': '默认',
    'import': '导入',
    'other': '其他',
    'genshin': '原神',
    'honkai': '崩坏',
    'zzz': '绝区零',
    'starRail': '星穹铁道',
    'wuwa': '鸣潮',
    'original': '原创',
    'fanmade': '同人',
    'official': '官方',
    'custom': '自定义'
  }

  // 获取分类的显示名称
  const getCategoryDisplayName = (category) => {
    if (!category || category === 'all') return '全部'
    return categoryNameMap[category] || category
  }

  // 获取分类列表 - 使用 useMemo 缓存
  const categories = useMemo(() => {
    const categories = new Set(['all'])
    const resources = viewMode === 'available' ? availableResources : loadedResources
    resources[activeTab]?.forEach(item => {
      if (item.category) categories.add(item.category)
    })
    return Array.from(categories).map(cat => ({
      id: cat,
      name: getCategoryDisplayName(cat)
    }))
  }, [availableResources, loadedResources, activeTab, viewMode])

  // 获取当前显示的资源 - 使用 useMemo 缓存
  const currentResources = useMemo(() => {
    const resources = viewMode === 'available' ? availableResources : loadedResources
    let result = resources[activeTab] || []
    
    // 分类筛选
    if (selectedCategory !== 'all') {
      result = result.filter(r => r.category === selectedCategory)
    }
    
    // 搜索筛选
    if (searchQuery) {
      result = result.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    return result
  }, [availableResources, loadedResources, activeTab, viewMode, selectedCategory, searchQuery])

  // 处理资源选择
  const toggleResourceSelection = (resourceId) => {
    setSelectedResources(prev => {
      const newSet = new Set(prev)
      if (newSet.has(resourceId)) {
        newSet.delete(resourceId)
      } else {
        newSet.add(resourceId)
      }
      return newSet
    })
  }

  // 全选
  const selectAll = () => {
    setSelectedResources(new Set(currentResources.map(r => r.id)))
  }

  // 清空选择
  const clearSelection = () => {
    setSelectedResources(new Set())
  }

  // 批量加载
  const handleBatchLoad = async () => {
    const toLoad = currentResources.filter(r => selectedResources.has(r.id))
    for (const resource of toLoad) {
      await onLoadResource?.(resource)
    }
    setSelectedResources(new Set())
  }

  // 获取导入文件类型
  const getImportAcceptTypes = (tab) => {
    const types = {
      characters: '.vrm,.glb,.gltf',
      props: '.glb,.gltf,.obj,.fbx',
      scenes: '.glb,.gltf,.jpg,.jpeg,.png,.mp4,.webm,.mov',
      motions: '.vmd,.bvh,.fbx',
      music: '.mp3,.wav,.ogg,.m4a,.aac',
      effects: '.json'
    }
    return types[tab] || '*'
  }

  // 处理导入文件
  const handleImportFiles = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    console.log('导入文件:', files.map(f => f.name))
    
    // 为每个文件创建资源对象
    const importedResources = files.map(file => ({
      id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      file: file.name,
      path: URL.createObjectURL(file),
      type: activeTab,
      category: '导入',
      status: 'imported',
      loaded: false,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      fileObject: file // 保存文件对象供后续使用
    }))

    // 添加到已加载资源列表
    for (const resource of importedResources) {
      await onLoadResource?.(resource)
    }

    // 清空选择
    setSelectedResources(new Set())
    
    // 重置文件输入
    e.target.value = ''
  }

  // 处理单个资源拖拽开始
  const handleDragStart = (e, item) => {
    console.log('LeftPanel: 开始拖拽', item)
    const dragData = {
      ...item,
      sourceType: activeTab,
      sourceView: viewMode,
      isBatch: false
    }
    console.log('LeftPanel: 拖拽数据', dragData)
    e.dataTransfer.setData('application/json', JSON.stringify(dragData))
    e.dataTransfer.effectAllowed = 'copy'
    
    // 添加拖拽时的视觉反馈
    e.target.classList.add(styles.dragging)
  }

  // 处理批量拖拽开始
  const handleBatchDragStart = (e) => {
    if (selectedResources.size === 0) return
    
    const selectedItems = currentResources.filter(r => selectedResources.has(r.id))
    const dragData = {
      items: selectedItems,
      sourceType: activeTab,
      sourceView: viewMode,
      isBatch: true,
      count: selectedItems.length
    }
    e.dataTransfer.setData('application/json', JSON.stringify(dragData))
    e.dataTransfer.effectAllowed = 'copy'
  }

  // 处理拖拽结束
  const handleDragEnd = (e) => {
    e.target.classList.remove(styles.dragging)
  }

  // 渲染资源卡片
  const renderResourceCard = (item) => {
    const isSelected = selectedResources.has(item.id)
    const isLoaded = item.loaded || item.status === 'loaded'
    
    const icons = {
      characters: '👤',
      props: '📦',
      scenes: '🏞️',
      motions: '🎭',
      music: '🎵'
    }

    return (
      <div 
        key={item.id} 
        className={`${styles.resourceCard} ${isSelected ? styles.selected : ''} ${isLoaded ? styles.loaded : ''}`}
        draggable={true}
        onDragStart={(e) => handleDragStart(e, item)}
        onDragEnd={handleDragEnd}
      >
        {/* 选择框 */}
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleResourceSelection(item.id)}
          />
        </label>

        {/* 图标 */}
        <div className={styles.resourcePreview}>
          <span className={styles.resourceIcon}>{icons[activeTab]}</span>
          {isLoaded && <span className={styles.loadedBadge}>✓</span>}
        </div>

        {/* 信息 */}
        <div className={styles.resourceInfo}>
          <div className={styles.resourceName}>{item.name}</div>
          <div className={styles.resourceMeta}>
            <span className={styles.categoryTag}>{getCategoryDisplayName(item.category) || '默认'}</span>
            {item.packName && <span className={styles.packBadge}>{item.packName}</span>}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className={styles.resourceActions}>
          {viewMode === 'available' ? (
            isLoaded ? (
              <>
                <button 
                  className={styles.actionBtn}
                  onClick={() => onAddToScene?.(item, activeTab)}
                  title="添加到场景"
                >
                  +
                </button>
                <button 
                  className={`${styles.actionBtn} ${styles.loadedBtn}`}
                  onClick={() => onUnloadResource?.(item.id, activeTab)}
                  title="卸载"
                >
                  ✕
                </button>
              </>
            ) : (
              <button 
                className={styles.actionBtn}
                onClick={() => onAddToScene?.(item, activeTab)}
                title="添加到场景"
              >
                +
              </button>
            )
          ) : (
            <>
              <button 
                className={styles.actionBtn}
                onClick={() => onAddToScene?.(item, activeTab)}
                title="添加到场景"
              >
                +
              </button>
              <button 
                className={`${styles.actionBtn} ${styles.unloadBtn}`}
                onClick={() => onUnloadResource?.(item.id, activeTab)}
                title="卸载"
              >
                🗑️
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // 处理特效拖动开始
  const handleEffectDragStart = (e, effect, category) => {
    const dragData = {
      id: `effect_${effect}`,
      name: effect,
      type: 'effect',
      category: category,
      sourceType: 'effects',
      sourceView: viewMode
    }
    e.dataTransfer.setData('application/json', JSON.stringify(dragData))
    e.dataTransfer.effectAllowed = 'copy'
  }

  // 处理纯色场景拖拽
  const handleColorSceneDragStart = (e) => {
    const dragData = {
      id: `color_scene_${selectedColor}`,
      name: colorSceneName,
      type: 'color_scene',
      color: selectedColor,
      sourceType: 'scenes',
      sourceView: viewMode
    }
    e.dataTransfer.setData('application/json', JSON.stringify(dragData))
    e.dataTransfer.effectAllowed = 'copy'
  }

  // 渲染纯色场景创建器
  const renderColorSceneCreator = () => (
    <div className={styles.resourceList}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>纯色场景</div>
        
        {/* 颜色预览和选择 */}
        <div className={styles.colorSceneCreator}>
          <div 
            className={styles.colorPreview}
            style={{ backgroundColor: selectedColor }}
            draggable
            onDragStart={handleColorSceneDragStart}
          >
            <span className={styles.colorPreviewText}>{colorSceneName}</span>
            <span className={styles.colorPreviewHint}>拖拽到时间轴</span>
          </div>
          
          {/* 颜色选择 */}
          <div className={styles.colorInputRow}>
            <label className={styles.colorLabel}>颜色</label>
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className={styles.colorPicker}
            />
            <input
              type="text"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className={styles.colorTextInput}
              placeholder="#000000"
            />
          </div>
          
          {/* 场景名称 */}
          <div className={styles.colorInputRow}>
            <label className={styles.colorLabel}>名称</label>
            <input
              type="text"
              value={colorSceneName}
              onChange={(e) => setColorSceneName(e.target.value)}
              className={styles.colorNameInput}
              placeholder="输入场景名称"
            />
          </div>
          
          {/* 预设颜色 */}
          <div className={styles.colorPresets}>
            <label className={styles.colorLabel}>预设</label>
            <div className={styles.presetGrid}>
              {[
                '#000000', '#ffffff', '#1a1a1a', '#0a0a1a',
                '#1a0a0a', '#0a1a0a', '#0a1a1a', '#1a1a0a',
                '#ff0000', '#00ff00', '#0000ff', '#ffff00',
                '#ff00ff', '#00ffff', '#ff69b4', '#8b00ff'
              ].map(color => (
                <button
                  key={color}
                  className={styles.presetBtn}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // 渲染特效列表
  const renderEffectList = () => (
    <div className={styles.resourceList}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>粒子特效</div>
        <div className={styles.effectGrid}>
          {['雪花', '花瓣', '星光', '火焰', '雨滴', '落叶'].map(effect => (
            <div
              key={effect}
              className={styles.effectBtn}
              draggable
              onDragStart={(e) => handleEffectDragStart(e, effect, 'particle')}
            >
              {effect}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>后处理</div>
        <div className={styles.effectGrid}>
          {['辉光', '景深', '模糊', '色调', '暗角'].map(effect => (
            <div
              key={effect}
              className={styles.effectBtn}
              draggable
              onDragStart={(e) => handleEffectDragStart(e, effect, 'postprocess')}
            >
              {effect}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>天气</div>
        <div className={styles.effectGrid}>
          {['雨', '雪', '雾', '云', '雷'].map(effect => (
            <div
              key={effect}
              className={styles.effectBtn}
              draggable
              onDragStart={(e) => handleEffectDragStart(e, effect, 'weather')}
            >
              {effect}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className={styles.container}>
      {/* 标签页 - 只显示图标 */}
      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => {
              setActiveTab(tab.id)
              setSelectedCategory('all')
              setSearchQuery('')
              setSelectedResources(new Set())
            }}
            title={tab.tooltip}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
          </button>
        ))}
      </div>

      {/* 视图切换 */}
      <div className={styles.viewToggle}>
        <button
          className={`${styles.viewBtn} ${viewMode === 'available' ? styles.active : ''}`}
          onClick={() => {
            setViewMode('available')
            setSelectedResources(new Set())
          }}
        >
          可加载
          <span className={styles.countBadge}>
            {availableResources[activeTab]?.length || 0}
          </span>
        </button>
        <button
          className={`${styles.viewBtn} ${viewMode === 'loaded' ? styles.active : ''}`}
          onClick={() => {
            setViewMode('loaded')
            setSelectedResources(new Set())
          }}
        >
          已加载
          <span className={styles.countBadge}>
            {loadedResources[activeTab]?.length || 0}
          </span>
        </button>
      </div>

      {/* 搜索和筛选 */}
      <div className={styles.toolbar}>
        <div className={styles.searchRow}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder={`搜索...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          {/* 导入按钮 */}
          <button 
            className={styles.importBtn}
            onClick={() => document.getElementById(`import-${activeTab}`).click()}
            title="导入本地文件"
          >
            📁
          </button>
          <input
            id={`import-${activeTab}`}
            type="file"
            className={styles.hiddenInput}
            accept={getImportAcceptTypes(activeTab)}
            multiple
            onChange={handleImportFiles}
          />
        </div>
        
        {categories.length > 1 && (
          <div className={styles.categoryFilter}>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`${styles.categoryBtn} ${selectedCategory === cat.id ? styles.active : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 批量操作栏 */}
      {viewMode === 'available' && selectedResources.size > 0 && (
        <div 
          className={styles.batchBar}
          draggable
          onDragStart={handleBatchDragStart}
        >
          <span className={styles.batchText}>
            已选择 {selectedResources.size} 个
          </span>
          <div className={styles.batchActions}>
            <button className={styles.batchBtn} onClick={selectAll}>
              全选
            </button>
            <button className={styles.batchBtn} onClick={clearSelection}>
              清空
            </button>
            <button className={styles.batchBtnPrimary} onClick={handleBatchLoad}>
              批量加载
            </button>
          </div>
          <div className={styles.batchDragHint}>
            拖拽到时间轴
          </div>
        </div>
      )}

      {/* 内容区 */}
      <div className={styles.content}>
        {activeTab === 'motionGroups' ? (
          <MotionGroupPanel
            onDragStart={(group) => {
              console.log('开始拖拽动作组:', group)
            }}
            onAddToTimeline={(group) => {
              console.log('添加动作组到时间轴:', group)
            }}
          />
        ) : activeTab === 'effects' ? (
          renderEffectList()
        ) : activeTab === 'scenes' && viewMode === 'available' ? (
          <>
            {renderColorSceneCreator()}
            {currentResources.length > 0 && (
              <div className={styles.resourceList} style={{ marginTop: 16 }}>
                <div className={styles.sectionTitle}>场景模型</div>
                {currentResources.map(renderResourceCard)}
              </div>
            )}
          </>
        ) : currentResources.length > 0 ? (
          <div className={styles.resourceList}>
            {currentResources.map(renderResourceCard)}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              {viewMode === 'available' ? '📭' : '📦'}
            </div>
            <div className={styles.emptyText}>
              {viewMode === 'available' 
                ? `暂无${tabs.find(t => t.id === activeTab)?.name}资源`
                : `尚未加载${tabs.find(t => t.id === activeTab)?.name}`
              }
            </div>
            {viewMode === 'available' && (
              <div className={styles.emptySubtext}>
                将资源放入 public 文件夹后刷新
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
