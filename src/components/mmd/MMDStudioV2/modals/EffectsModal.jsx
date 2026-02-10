import React, { useState } from 'react'
import styles from './EffectsModal.module.css'

const EFFECT_TYPES = [
  { id: 'bloom', name: '辉光', icon: '✨', description: '让发光物体更加明亮' },
  { id: 'dof', name: '景深', icon: '📷', description: '模拟相机景深效果' },
  { id: 'ssao', name: '环境光遮蔽', icon: '🌑', description: '增强阴影细节' },
  { id: 'fog', name: '雾效', icon: '🌫️', description: '添加雾气效果' },
  { id: 'chromatic', name: '色差', icon: '🌈', description: '边缘色彩分离' },
  { id: 'vignette', name: '暗角', icon: '⭕', description: '四周变暗效果' },
  { id: 'filmGrain', name: '胶片颗粒', icon: '🎞️', description: '复古胶片质感' },
  { id: 'motionBlur', name: '运动模糊', icon: '💨', description: '快速移动模糊' },
]

export function EffectsModal({ project, onClose, onUpdateProject }) {
  const [activeTab, setActiveTab] = useState('groups')
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [editingEffect, setEditingEffect] = useState(null)

  const effects = project?.effects || { groups: [] }

  // 添加特效组
  const handleAddGroup = () => {
    const newGroup = {
      id: `group_${Date.now()}`,
      name: `特效组 ${effects.groups.length + 1}`,
      startTime: 0,
      endTime: 10,
      items: []
    }
    onUpdateProject({
      effects: {
        ...effects,
        groups: [...effects.groups, newGroup]
      }
    })
    setSelectedGroup(newGroup)
  }

  // 删除特效组
  const handleDeleteGroup = (groupId) => {
    onUpdateProject({
      effects: {
        ...effects,
        groups: effects.groups.filter(g => g.id !== groupId)
      }
    })
    if (selectedGroup?.id === groupId) {
      setSelectedGroup(null)
    }
  }

  // 更新特效组
  const handleUpdateGroup = (groupId, updates) => {
    onUpdateProject({
      effects: {
        ...effects,
        groups: effects.groups.map(g =>
          g.id === groupId ? { ...g, ...updates } : g
        )
      }
    })
    if (selectedGroup?.id === groupId) {
      setSelectedGroup({ ...selectedGroup, ...updates })
    }
  }

  // 添加特效到组
  const handleAddEffect = (groupId, effectType) => {
    const effectDef = EFFECT_TYPES.find(e => e.id === effectType)
    const newEffect = {
      id: `effect_${Date.now()}`,
      type: effectType,
      name: effectDef.name,
      startTime: 0,
      duration: 5,
      intensity: 0.5,
      enabled: true,
      params: getDefaultParams(effectType)
    }

    onUpdateProject({
      effects: {
        ...effects,
        groups: effects.groups.map(g =>
          g.id === groupId
            ? { ...g, items: [...g.items, newEffect] }
            : g
        )
      }
    })
  }

  // 获取默认参数
  const getDefaultParams = (type) => {
    switch (type) {
      case 'bloom':
        return { threshold: 0.8, strength: 1.5, radius: 0.5 }
      case 'dof':
        return { focus: 10, aperture: 0.1, maxBlur: 1 }
      case 'fog':
        return { color: '#ffffff', density: 0.02, near: 1, far: 100 }
      case 'ssao':
        return { radius: 0.5, intensity: 1 }
      case 'chromatic':
        return { offset: 0.005 }
      case 'vignette':
        return { intensity: 0.5, smoothness: 0.5 }
      case 'filmGrain':
        return { intensity: 0.3 }
      case 'motionBlur':
        return { intensity: 0.5 }
      default:
        return {}
    }
  }

  // 更新特效
  const handleUpdateEffect = (groupId, effectId, updates) => {
    onUpdateProject({
      effects: {
        ...effects,
        groups: effects.groups.map(g =>
          g.id === groupId
            ? {
                ...g,
                items: g.items.map(e =>
                  e.id === effectId ? { ...e, ...updates } : e
                )
              }
            : g
        )
      }
    })
  }

  // 删除特效
  const handleDeleteEffect = (groupId, effectId) => {
    onUpdateProject({
      effects: {
        ...effects,
        groups: effects.groups.map(g =>
          g.id === groupId
            ? { ...g, items: g.items.filter(e => e.id !== effectId) }
            : g
        )
      }
    })
    if (editingEffect?.id === effectId) {
      setEditingEffect(null)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>✨ 场景特效</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'groups' ? styles.active : ''}`}
            onClick={() => setActiveTab('groups')}
          >
            特效组
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'library' ? styles.active : ''}`}
            onClick={() => setActiveTab('library')}
          >
            特效库
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'groups' && (
            <div className={styles.groupsPanel}>
              <div className={styles.groupsList}>
                {effects.groups.map(group => (
                  <div
                    key={group.id}
                    className={`${styles.groupCard} ${selectedGroup?.id === group.id ? styles.selected : ''}`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div className={styles.groupHeader}>
                      <input
                        className={styles.groupName}
                        value={group.name}
                        onChange={(e) => handleUpdateGroup(group.id, { name: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        className={styles.deleteBtn}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteGroup(group.id)
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <div className={styles.groupTime}>
                      {group.startTime.toFixed(1)}s - {group.endTime.toFixed(1)}s
                    </div>
                    <div className={styles.groupEffects}>
                      {group.items.map(effect => (
                        <span
                          key={effect.id}
                          className={`${styles.effectTag} ${!effect.enabled ? styles.disabled : ''}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingEffect(effect)
                            setSelectedGroup(group)
                          }}
                        >
                          {EFFECT_TYPES.find(t => t.id === effect.type)?.icon} {effect.name}
                        </span>
                      ))}
                      {group.items.length === 0 && (
                        <span className={styles.emptyTag}>点击添加特效</span>
                      )}
                    </div>
                  </div>
                ))}
                <button className={styles.addGroupBtn} onClick={handleAddGroup}>
                  + 添加特效组
                </button>
              </div>

              {selectedGroup && (
                <div className={styles.groupEditor}>
                  <h3 className={styles.editorTitle}>编辑特效组</h3>
                  <div className={styles.timeInputs}>
                    <div className={styles.inputRow}>
                      <label>开始时间</label>
                      <input
                        type="number"
                        value={selectedGroup.startTime}
                        onChange={(e) => handleUpdateGroup(selectedGroup.id, { startTime: parseFloat(e.target.value) || 0 })}
                        step="0.1"
                      />
                      <span>s</span>
                    </div>
                    <div className={styles.inputRow}>
                      <label>结束时间</label>
                      <input
                        type="number"
                        value={selectedGroup.endTime}
                        onChange={(e) => handleUpdateGroup(selectedGroup.id, { endTime: parseFloat(e.target.value) || 0 })}
                        step="0.1"
                      />
                      <span>s</span>
                    </div>
                  </div>

                  <h4 className={styles.effectsTitle}>特效列表</h4>
                  <div className={styles.effectsList}>
                    {selectedGroup.items.map(effect => (
                      <div
                        key={effect.id}
                        className={`${styles.effectItem} ${editingEffect?.id === effect.id ? styles.editing : ''}`}
                        onClick={() => setEditingEffect(effect)}
                      >
                        <span className={styles.effectIcon}>
                          {EFFECT_TYPES.find(t => t.id === effect.type)?.icon}
                        </span>
                        <span className={styles.effectName}>{effect.name}</span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={effect.intensity}
                          onChange={(e) => handleUpdateEffect(selectedGroup.id, effect.id, { intensity: parseFloat(e.target.value) })}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          className={styles.toggleBtn}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUpdateEffect(selectedGroup.id, effect.id, { enabled: !effect.enabled })
                          }}
                        >
                          {effect.enabled ? '✓' : '✗'}
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteEffect(selectedGroup.id, effect.id)
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className={styles.addEffectSection}>
                    <h4 className={styles.effectsTitle}>添加特效</h4>
                    <div className={styles.effectTypes}>
                      {EFFECT_TYPES.map(type => (
                        <button
                          key={type.id}
                          className={styles.effectTypeBtn}
                          onClick={() => handleAddEffect(selectedGroup.id, type.id)}
                          title={type.description}
                        >
                          <span className={styles.typeIcon}>{type.icon}</span>
                          <span className={styles.typeName}>{type.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'library' && (
            <div className={styles.libraryPanel}>
              <div className={styles.effectGrid}>
                {EFFECT_TYPES.map(type => (
                  <div key={type.id} className={styles.effectCard}>
                    <div className={styles.effectIconLarge}>{type.icon}</div>
                    <h3 className={styles.effectNameLarge}>{type.name}</h3>
                    <p className={styles.effectDesc}>{type.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
