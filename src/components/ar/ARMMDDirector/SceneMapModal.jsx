import React, { useState, useEffect } from 'react'
import styles from './SceneMapModal.module.css'

/**
 * 场景地图弹窗 - 2D地图视图，支持多选场景
 */
export function SceneMapModal({ onSelect, onClose }) {
  const [scenes, setScenes] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  
  // 加载场景库
  useEffect(() => {
    const savedScenes = JSON.parse(localStorage.getItem('ar-director-scenes') || '[]')
    setScenes(savedScenes)
  }, [])
  
  // 切换选择
  const toggleSelect = (sceneId) => {
    setSelectedIds(prev => 
      prev.includes(sceneId)
        ? prev.filter(id => id !== sceneId)
        : [...prev, sceneId]
    )
  }
  
  // 确认选择
  const confirmSelect = () => {
    const selected = scenes.filter(scene => selectedIds.includes(scene.id))
    onSelect(selected)
    onClose()
  }
  
  // 过滤场景
  const filteredScenes = scenes.filter(scene => 
    scene.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // 计算场景在地图上的位置（简化版）
  const getScenePosition = (index, total) => {
    const angle = (index / total) * Math.PI * 2
    const radius = 30 // 百分比
    return {
      left: 50 + Math.cos(angle) * radius,
      top: 50 + Math.sin(angle) * radius
    }
  }
  
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>🗺️ 选择场景</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="搜索场景..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.mapContainer}>
          {filteredScenes.length > 0 ? (
            <div className={styles.mapView}>
              {/* 地图背景网格 */}
              <div className={styles.mapGrid} />
              
              {/* 场景标记 */}
              {filteredScenes.map((scene, index) => {
                const pos = getScenePosition(index, filteredScenes.length)
                const isSelected = selectedIds.includes(scene.id)
                
                return (
                  <div
                    key={scene.id}
                    className={`${styles.mapMarker} ${isSelected ? styles.selected : ''}`}
                    style={{
                      left: `${pos.left}%`,
                      top: `${pos.top}%`
                    }}
                    onClick={() => toggleSelect(scene.id)}
                  >
                    <div className={styles.markerDot}>
                      {isSelected ? '✓' : index + 1}
                    </div>
                    <div className={styles.markerInfo}>
                      {scene.thumbnail && (
                        <img src={scene.thumbnail} alt={scene.name} />
                      )}
                      <span>{scene.name}</span>
                    </div>
                  </div>
                )
              })}
              
              {/* 连接线（显示场景间关系） */}
              {selectedIds.length > 1 && (
                <svg className={styles.connections}>
                  {selectedIds.map((id, i) => {
                    if (i === selectedIds.length - 1) return null
                    const scene1 = filteredScenes.find(s => s.id === id)
                    const scene2 = filteredScenes.find(s => s.id === selectedIds[i + 1])
                    if (!scene1 || !scene2) return null
                    
                    const idx1 = filteredScenes.indexOf(scene1)
                    const idx2 = filteredScenes.indexOf(scene2)
                    const pos1 = getScenePosition(idx1, filteredScenes.length)
                    const pos2 = getScenePosition(idx2, filteredScenes.length)
                    
                    return (
                      <line
                        key={`${id}-${selectedIds[i + 1]}`}
                        x1={`${pos1.left}%`}
                        y1={`${pos1.top}%`}
                        x2={`${pos2.left}%`}
                        y2={`${pos2.top}%`}
                        stroke="#667eea"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                      />
                    )
                  })}
                </svg>
              )}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>暂无场景</p>
              <p>请先在场景库中创建场景</p>
            </div>
          )}
        </div>
        
        {/* 场景列表（底部） */}
        <div className={styles.sceneList}>
          {filteredScenes.map((scene, index) => (
            <div
              key={scene.id}
              className={`${styles.sceneItem} ${selectedIds.includes(scene.id) ? styles.selected : ''}`}
              onClick={() => toggleSelect(scene.id)}
            >
              <span className={styles.sceneNumber}>{index + 1}</span>
              {scene.thumbnail && (
                <img src={scene.thumbnail} alt={scene.name} className={styles.sceneThumb} />
              )}
              <span className={styles.sceneName}>{scene.name}</span>
              {selectedIds.includes(scene.id) && (
                <span className={styles.sceneCheck}>✓</span>
              )}
            </div>
          ))}
        </div>
        
        <div className={styles.footer}>
          <span className={styles.selectedCount}>
            已选择 {selectedIds.length} 个场景
          </span>
          <div className={styles.footerButtons}>
            <button className={styles.cancelBtn} onClick={onClose}>
              取消
            </button>
            <button 
              className={styles.confirmBtn}
              onClick={confirmSelect}
              disabled={selectedIds.length === 0}
            >
              确认添加
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SceneMapModal
