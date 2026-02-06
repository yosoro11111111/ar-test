import React, { useState, useEffect, useMemo } from 'react'
import {
  getAllActions,
  getActionsByCategory,
  searchActions,
  createActionPreset,
  addActionToPreset,
  removeActionFromPreset,
  autoArrangeActions,
  calculatePresetDuration,
  savePresetsToStorage,
  loadPresetsFromStorage,
  PRESET_TAGS
} from './actionPresets'
import styles from './ActionPresetEditor.module.css'

export const ActionPresetEditor = ({ isOpen, onClose, onSave, initialPreset = null }) => {
  const [preset, setPreset] = useState(initialPreset || createActionPreset('新预设'))
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showActionSelector, setShowActionSelector] = useState(false)

  // 获取动作列表
  const actionsByCategory = useMemo(() => getActionsByCategory(), [])
  const allActions = useMemo(() => getAllActions(), [])

  const filteredActions = useMemo(() => {
    if (searchQuery) {
      return searchActions(searchQuery)
    }
    if (selectedCategory === 'all') {
      return allActions
    }
    return actionsByCategory[selectedCategory] || []
  }, [searchQuery, selectedCategory, actionsByCategory, allActions])

  // 添加动作到预设
  const handleAddAction = (action) => {
    const startTime = calculatePresetDuration(preset)
    const newPreset = addActionToPreset(preset, action, startTime)
    setPreset(newPreset)
  }

  // 移除动作
  const handleRemoveAction = (actionInstanceId) => {
    const newPreset = removeActionFromPreset(preset, actionInstanceId)
    setPreset(newPreset)
  }

  // 自动排列
  const handleAutoArrange = () => {
    const newPreset = autoArrangeActions(preset)
    setPreset(newPreset)
  }

  // 保存预设
  const handleSave = () => {
    savePresetsToStorage([...loadPresetsFromStorage(), preset])
    onSave(preset)
    onClose()
  }

  if (!isOpen) return null

  const totalDuration = calculatePresetDuration(preset)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            <span className={styles.icon}>🎭</span>
            动作预设编辑器
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          {/* 预设信息 */}
          <div className={styles.presetInfo}>
            <input
              type="text"
              className={styles.nameInput}
              value={preset.name}
              onChange={(e) => setPreset({ ...preset, name: e.target.value })}
              placeholder="预设名称"
            />
            <textarea
              className={styles.descInput}
              value={preset.description}
              onChange={(e) => setPreset({ ...preset, description: e.target.value })}
              placeholder="预设描述（可选）"
            />
            <div className={styles.durationInfo}>
              总时长: {totalDuration.toFixed(1)}秒 | 动作数: {preset.actions.length}
            </div>
          </div>

          {/* 动作列表 */}
          <div className={styles.actionList}>
            <div className={styles.sectionHeader}>
              <span>已添加动作</span>
              <div className={styles.actionButtons}>
                <button className={styles.arrangeBtn} onClick={handleAutoArrange}>
                  🔄 自动排列
                </button>
                <button className={styles.addBtn} onClick={() => setShowActionSelector(true)}>
                  ➕ 添加动作
                </button>
              </div>
            </div>

            {preset.actions.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>🎭</span>
                <span>还没有添加动作</span>
                <button onClick={() => setShowActionSelector(true)}>添加第一个动作</button>
              </div>
            ) : (
              <div className={styles.actionsContainer}>
                {preset.actions.map((action, index) => (
                  <div key={action.id} className={styles.actionItem}>
                    <span className={styles.actionIndex}>{index + 1}</span>
                    <div className={styles.actionInfo}>
                      <span className={styles.actionName}>{action.actionData.name}</span>
                      <span className={styles.actionTime}>
                        {action.startTime.toFixed(1)}s - {(action.startTime + action.duration).toFixed(1)}s
                      </span>
                    </div>
                    <button
                      className={styles.removeBtn}
                      onClick={() => handleRemoveAction(action.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 动作选择器 */}
          {showActionSelector && (
            <div className={styles.actionSelector}>
              <div className={styles.selectorHeader}>
                <input
                  type="text"
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索动作..."
                />
                <button className={styles.closeSelector} onClick={() => setShowActionSelector(false)}>
                  完成
                </button>
              </div>

              <div className={styles.categoryTabs}>
                <button
                  className={`${styles.categoryTab} ${selectedCategory === 'all' ? styles.active : ''}`}
                  onClick={() => setSelectedCategory('all')}
                >
                  全部
                </button>
                {PRESET_TAGS.map(tag => (
                  <button
                    key={tag.id}
                    className={`${styles.categoryTab} ${selectedCategory === tag.id ? styles.active : ''}`}
                    onClick={() => setSelectedCategory(tag.id)}
                    style={{ '--tag-color': tag.color }}
                  >
                    {tag.icon} {tag.name}
                  </button>
                ))}
              </div>

              <div className={styles.availableActions}>
                {filteredActions.slice(0, 50).map(action => (
                  <div
                    key={action.id}
                    className={styles.availableAction}
                    onClick={() => handleAddAction(action)}
                  >
                    <span className={styles.actionIcon}>
                      {PRESET_TAGS.find(t => t.id === action.category)?.icon || '📦'}
                    </span>
                    <span className={styles.actionName}>{action.name}</span>
                    <span className={styles.addIcon}>+</span>
                  </div>
                ))}
                {filteredActions.length > 50 && (
                  <div className={styles.moreActions}>
                    还有 {filteredActions.length - 50} 个动作...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>取消</button>
          <button className={styles.saveBtn} onClick={handleSave}>
            💾 保存预设
          </button>
        </div>
      </div>
    </div>
  )
}
