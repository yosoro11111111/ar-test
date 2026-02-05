import React, { useState, useEffect } from 'react'
import styles from './CellEditModal.module.css'
import { getAllVRMActions } from '../../../data/vrmaActions'

/**
 * 格子编辑弹窗 - 根据子轨道类型编辑对应内容
 */
export function CellEditModal({ trackId, subTrackType, cell, onSave, onDelete, onClose }) {
  const [actions, setActions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('mmd-action-favorites')
    return saved ? JSON.parse(saved) : []
  })
  
  // 格子数据
  const [cellData, setCellData] = useState({
    id: cell?.id,
    name: cell?.name || '',
    startTime: cell?.startTime || 0,
    duration: cell?.duration || 5,
    ...cell
  })

  // 加载动作
  useEffect(() => {
    if (subTrackType === 'action') {
      getAllVRMActions().then(list => setActions(list))
    }
  }, [subTrackType])

  // 场景预设
  const scenePresets = [
    { id: 'default', name: '默认', position: { x: 0, y: 0, z: 0 } },
    { id: 'left', name: '左侧', position: { x: -2, y: 0, z: 0 } },
    { id: 'right', name: '右侧', position: { x: 2, y: 0, z: 0 } },
    { id: 'front', name: '前方', position: { x: 0, y: 0, z: 2 } },
    { id: 'back', name: '后方', position: { x: 0, y: 0, z: -2 } },
    { id: 'center', name: '中心', position: { x: 0, y: 0, z: 0 } },
  ]

  // 特效预设
  const effectPresets = [
    { id: 'none', name: '无', icon: '❌' },
    { id: 'sakura', name: '樱花', icon: '🌸' },
    { id: 'snow', name: '雪花', icon: '❄️' },
    { id: 'rain', name: '雨滴', icon: '🌧️' },
    { id: 'sparkle', name: '星光', icon: '✨' },
    { id: 'fire', name: '火焰', icon: '🔥' },
    { id: 'magic', name: '魔法', icon: '🔮' },
    { id: 'heart', name: '爱心', icon: '💖' },
  ]

  // 保存
  const handleSave = () => {
    onSave(trackId, subTrackType, cellData.id, cellData)
    onClose()
  }

  // 删除
  const handleDelete = () => {
    onDelete(trackId, subTrackType, cellData.id)
    onClose()
  }

  // 选择动作
  const selectAction = (action) => {
    setCellData(prev => ({
      ...prev,
      name: action.name,
      filePath: action.filePath,
      duration: action.duration ? action.duration / 1000 : 5
    }))
  }

  // 选择场景
  const selectScene = (scene) => {
    setCellData(prev => ({
      ...prev,
      name: scene.name,
      position: scene.position
    }))
  }

  // 选择特效
  const selectEffect = (effect) => {
    setCellData(prev => ({
      ...prev,
      name: effect.name,
      effectId: effect.id,
      icon: effect.icon
    }))
  }

  // 切换收藏
  const toggleFavorite = (e, actionId) => {
    e.stopPropagation()
    const newFavorites = favorites.includes(actionId)
      ? favorites.filter(id => id !== actionId)
      : [...favorites, actionId]
    setFavorites(newFavorites)
    localStorage.setItem('mmd-action-favorites', JSON.stringify(newFavorites))
  }

  // 过滤动作
  const filteredActions = actions.filter(action => 
    action.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 根据类型渲染不同内容
  const renderContent = () => {
    switch(subTrackType) {
      case 'action':
        return (
          <div className={styles.actionPanel}>
            <input
              type="text"
              placeholder="搜索动作..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <div className={styles.itemGrid}>
              {filteredActions.map(action => {
                const isSelected = cellData.filePath === action.filePath
                const isFavorite = favorites.includes(action.id)
                return (
                  <div
                    key={action.id}
                    className={`${styles.itemCard} ${isSelected ? styles.selected : ''}`}
                    onClick={() => selectAction(action)}
                  >
                    <span className={styles.itemIcon}>{action.icon}</span>
                    <span className={styles.itemName}>{action.name}</span>
                    <button
                      className={`${styles.favBtn} ${isFavorite ? styles.active : ''}`}
                      onClick={(e) => toggleFavorite(e, action.id)}
                    >
                      {isFavorite ? '★' : '☆'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      
      case 'scene':
        return (
          <div className={styles.scenePanel}>
            <div className={styles.itemGrid}>
              {scenePresets.map(scene => {
                const isSelected = cellData.position?.x === scene.position.x && 
                                  cellData.position?.z === scene.position.z
                return (
                  <div
                    key={scene.id}
                    className={`${styles.itemCard} ${isSelected ? styles.selected : ''}`}
                    onClick={() => selectScene(scene)}
                  >
                    <span className={styles.itemIcon}>🗺️</span>
                    <span className={styles.itemName}>{scene.name}</span>
                    <span className={styles.itemMeta}>
                      x:{scene.position.x} z:{scene.position.z}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      
      case 'effect':
        return (
          <div className={styles.effectPanel}>
            <div className={styles.itemGrid}>
              {effectPresets.map(effect => {
                const isSelected = cellData.effectId === effect.id
                return (
                  <div
                    key={effect.id}
                    className={`${styles.itemCard} ${isSelected ? styles.selected : ''}`}
                    onClick={() => selectEffect(effect)}
                  >
                    <span className={styles.itemIcon}>{effect.icon}</span>
                    <span className={styles.itemName}>{effect.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  const getTitle = () => {
    switch(subTrackType) {
      case 'action': return '🎭 选择动作'
      case 'scene': return '🗺️ 选择场景'
      case 'effect': return '✨ 选择特效'
      default: return '编辑'
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{getTitle()}</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* 时间设置 */}
        <div className={styles.timeSettings}>
          <div className={styles.timeField}>
            <label>开始时间 (秒)</label>
            <input
              type="number"
              value={cellData.startTime}
              onChange={(e) => setCellData(prev => ({ ...prev, startTime: Number(e.target.value) }))}
              min={0}
              step={0.1}
            />
          </div>
          <div className={styles.timeField}>
            <label>时长 (秒)</label>
            <input
              type="number"
              value={cellData.duration}
              onChange={(e) => setCellData(prev => ({ ...prev, duration: Number(e.target.value) }))}
              min={0.5}
              step={0.5}
            />
          </div>
        </div>

        {/* 名称编辑 */}
        <div className={styles.nameField}>
          <label>名称</label>
          <input
            type="text"
            value={cellData.name}
            onChange={(e) => setCellData(prev => ({ ...prev, name: e.target.value }))}
            placeholder={`输入${subTrackType === 'scene' ? '场景' : subTrackType === 'action' ? '动作' : '特效'}名称`}
          />
        </div>

        {/* 内容区域 */}
        <div className={styles.content}>
          {renderContent()}
        </div>

        {/* 底部按钮 */}
        <div className={styles.footer}>
          <button className={styles.deleteBtn} onClick={handleDelete}>
            🗑️ 删除
          </button>
          <div className={styles.rightBtns}>
            <button className={styles.cancelBtn} onClick={onClose}>取消</button>
            <button className={styles.saveBtn} onClick={handleSave}>保存</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CellEditModal
