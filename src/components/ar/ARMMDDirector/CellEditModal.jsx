import React, { useState, useEffect } from 'react'
import styles from './CellEditModal.module.css'
import { getAllVRMActions } from '../../../data/vrmaActions'
import { SceneManagerModal } from './SceneManagerModal'
import { ActionSelectModal } from './ActionSelectModal'

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
  const [showSceneManager, setShowSceneManager] = useState(false)
  const [showActionSelect, setShowActionSelect] = useState(false)
  
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
      name: action.name, // 自动填充动作名称
      filePath: action.filePath,
      duration: action.duration ? action.duration / 1000 : 5
    }))
  }

  // 选择场景 - 从场景管理器
  const selectScene = (scene) => {
    setCellData(prev => ({
      ...prev,
      name: scene.name, // 自动填充场景名称
      sceneId: scene.id,
      sceneData: scene.data, // 保存完整场景数据
      position: scene.data?.position || { x: 0, y: 0, z: 0 }
    }))
  }

  // 选择特效
  const selectEffect = (effect) => {
    setCellData(prev => ({
      ...prev,
      name: effect.name, // 自动填充特效名称
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
            <button 
              className={styles.manageSceneBtn}
              onClick={() => setShowActionSelect(true)}
            >
              🎭 打开动作库
            </button>
            {cellData.filePath && (
              <div className={styles.selectedScene}>
                <span>已选择: {cellData.name}</span>
              </div>
            )}
          </div>
        )
      
      case 'scene':
        return (
          <div className={styles.scenePanel}>
            <button 
              className={styles.manageSceneBtn}
              onClick={() => setShowSceneManager(true)}
            >
              🗺️ 打开场景管理器
            </button>
            {cellData.sceneId && (
              <div className={styles.selectedScene}>
                <span>已选择: {cellData.name}</span>
                {cellData.sceneData?.imageUrl && (
                  <img src={cellData.sceneData.imageUrl} alt={cellData.name} />
                )}
              </div>
            )}
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
      
      case 'scale':
        return (
          <div className={styles.scalePanel}>
            <div className={styles.scaleField}>
              <label>起始缩放值</label>
              <input
                type="number"
                value={cellData.startValue ?? 1}
                onChange={(e) => setCellData(prev => ({ ...prev, startValue: Number(e.target.value) }))}
                min={0}
                max={5}
                step={0.1}
              />
              <small>0 = 隐藏, 1 = 正常, 2 = 双倍</small>
            </div>
            <div className={styles.scaleField}>
              <label>结束缩放值</label>
              <input
                type="number"
                value={cellData.endValue ?? 1}
                onChange={(e) => setCellData(prev => ({ ...prev, endValue: Number(e.target.value) }))}
                min={0}
                max={5}
                step={0.1}
              />
              <small>设置起始和结束值实现渐变效果</small>
            </div>
          </div>
        )
      
      case 'bgScale':
        return (
          <div className={styles.scalePanel}>
            <div className={styles.scaleField}>
              <label>起始缩放值</label>
              <input
                type="number"
                value={cellData.startValue ?? 1}
                onChange={(e) => setCellData(prev => ({ ...prev, startValue: Number(e.target.value) }))}
                min={0.1}
                max={3}
                step={0.1}
              />
              <small>0.5 = 缩小, 1 = 正常, 2 = 放大</small>
            </div>
            <div className={styles.scaleField}>
              <label>结束缩放值</label>
              <input
                type="number"
                value={cellData.endValue ?? 1}
                onChange={(e) => setCellData(prev => ({ ...prev, endValue: Number(e.target.value) }))}
                min={0.1}
                max={3}
                step={0.1}
              />
              <small>通过调整视角模拟背景缩放</small>
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
      case 'scale': return '🔍 人物缩放设置'
      case 'bgScale': return '🖼️ 背景缩放设置'
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

        {/* 名称编辑 - 显示已选择的内容名称 */}
        <div className={styles.nameField}>
          <label>
            已选择: {subTrackType === 'scene' ? '🗺️ 场景' : subTrackType === 'action' ? '🎭 动作' : '✨ 特效'}
          </label>
          <input
            type="text"
            value={cellData.name}
            onChange={(e) => setCellData(prev => ({ ...prev, name: e.target.value }))}
            placeholder={cellData.name ? '' : `点击上方选择${subTrackType === 'scene' ? '场景' : subTrackType === 'action' ? '动作' : '特效'}`}
            readOnly={subTrackType !== 'scene'} // 场景可以手动编辑，动作和特效从库中选择
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

      {/* 场景管理弹窗 */}
      {showSceneManager && (
        <SceneManagerModal
          onSelect={selectScene}
          onClose={() => setShowSceneManager(false)}
        />
      )}
      
      {/* 动作选择弹窗 */}
      {showActionSelect && (
        <ActionSelectModal
          onSelect={(action) => {
            selectAction(action)
            setShowActionSelect(false)
          }}
          onClose={() => setShowActionSelect(false)}
        />
      )}
    </div>
  )
}

export default CellEditModal
