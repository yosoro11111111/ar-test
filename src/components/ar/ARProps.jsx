import React, { useState, useRef } from 'react'
import styles from './ARProps.module.css'

// 预设道具数据
const PRESET_PROPS = [
  { id: 'chair', name: '椅子', icon: '🪑', type: 'furniture', scale: 0.8 },
  { id: 'table', name: '桌子', icon: '🪜', type: 'furniture', scale: 1.0 },
  { id: 'lamp', name: '台灯', icon: '🛋️', type: 'furniture', scale: 0.6 },
  { id: 'plant', name: '盆栽', icon: '🪴', type: 'decoration', scale: 0.5 },
  { id: 'ball', name: '球', icon: '⚽', type: 'toy', scale: 0.3 },
  { id: 'box', name: '箱子', icon: '📦', type: 'container', scale: 0.7 },
  { id: 'gift', name: '礼物', icon: '🎁', type: 'decoration', scale: 0.4 },
  { id: 'cushion', name: '坐垫', icon: '🟤', type: 'furniture', scale: 0.5 },
]

export const ARProps = ({ 
  onAddProp, 
  onRemoveProp, 
  onSelectProp,
  onUpdateProp,
  placedProps,
  selectedPropId
}) => {
  const [activeCategory, setActiveCategory] = useState('all')
  const [showPanel, setShowPanel] = useState(true)

  const categories = [
    { id: 'all', name: '全部', icon: '📦' },
    { id: 'furniture', name: '家具', icon: '🪑' },
    { id: 'decoration', name: '装饰', icon: '🎨' },
    { id: 'toy', name: '玩具', icon: '🧸' },
    { id: 'container', name: '容器', icon: '📦' },
  ]

  const filteredProps = activeCategory === 'all' 
    ? PRESET_PROPS 
    : PRESET_PROPS.filter(p => p.type === activeCategory)

  const handleAddProp = (prop) => {
    const newProp = {
      id: Date.now(),
      templateId: prop.id,
      name: prop.name,
      icon: prop.icon,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: prop.scale,
      visible: true
    }
    onAddProp?.(newProp)
  }

  return (
    <div className={styles.container}>
      {/* 切换按钮 */}
      <button 
        className={styles.toggleBtn}
        onClick={() => setShowPanel(!showPanel)}
      >
        {showPanel ? '📦 关闭道具' : '📦 道具'}
      </button>

      {/* 道具面板 */}
      {showPanel && (
        <div className={styles.panel}>
          {/* 分类标签 */}
          <div className={styles.categories}>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`${styles.categoryBtn} ${activeCategory === cat.id ? styles.active : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* 道具列表 */}
          <div className={styles.propGrid}>
            {filteredProps.map(prop => (
              <button
                key={prop.id}
                className={styles.propItem}
                onClick={() => handleAddProp(prop)}
              >
                <span className={styles.propIcon}>{prop.icon}</span>
                <span className={styles.propName}>{prop.name}</span>
              </button>
            ))}
          </div>

          {/* 已放置道具列表 */}
          {placedProps && placedProps.length > 0 && (
            <div className={styles.placedProps}>
              <h4>已放置道具</h4>
              <div className={styles.placedList}>
                {placedProps.map(prop => (
                  <div 
                    key={prop.id}
                    className={`${styles.placedItem} ${selectedPropId === prop.id ? styles.selected : ''}`}
                    onClick={() => onSelectProp?.(prop)}
                  >
                    <span>{prop.icon}</span>
                    <span>{prop.name}</span>
                    <button 
                      className={styles.removeBtn}
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveProp?.(prop.id)
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ARProps
