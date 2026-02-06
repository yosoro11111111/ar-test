import React, { useState, useEffect } from 'react'
import styles from './CellEditModal.module.css'
import { getAllVRMActions } from '../../../data/vrmaActions'
import { getTrackTypeInfo } from './trackTypes'
import { PositionTrackEditor } from './PositionTrackEditor'

/**
 * 片段编辑弹窗 - 新版
 * 支持编辑各种类型的片段
 */
export function CellEditModal({ trackId, trackType: trackTypeProp, clip, onSave, onDelete, onClose }) {
  const [actions, setActions] = useState([])
  const [trackType, setTrackType] = useState(trackTypeProp || null)
  const [showPositionEditor, setShowPositionEditor] = useState(false)

  // 片段数据
  const [clipData, setClipData] = useState({
    id: clip?.id,
    type: clip?.type || 'clip',
    startTime: clip?.startTime || 0,
    duration: clip?.duration || 5,
    data: clip?.data || { name: '' }
  })

  // 获取轨道类型 - 必须使用传入的trackTypeProp
  useEffect(() => {
    if (trackTypeProp) {
      setTrackType(trackTypeProp)
    } else {
      console.warn('CellEditModal: trackTypeProp is required but not provided')
      setTrackType('unknown')
    }
  }, [trackTypeProp])

  // 加载动作列表
  useEffect(() => {
    if (trackType === 'action') {
      getAllVRMActions().then(list => setActions(list))
    }
  }, [trackType])

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
    onSave(trackId, clipData.id, clipData)
    onClose()
  }

  // 删除
  const handleDelete = () => {
    if (confirm('确定要删除这个片段吗？')) {
      onDelete(trackId, clipData.id)
      onClose()
    }
  }

  // 获取轨道类型信息 - 直接使用传入的trackTypeProp
  const trackTypeInfo = getTrackTypeInfo(trackTypeProp || trackType)

  // 更新数据字段
  const updateData = (key, value) => {
    setClipData(prev => ({
      ...prev,
      data: { ...prev.data, [key]: value }
    }))
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            <span className={styles.icon}>{trackTypeInfo?.icon || '📦'}</span>
            编辑{trackTypeInfo?.name || '片段'}
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          {/* 基本信息 */}
          <div className={styles.section}>
            <label className={styles.label}>名称</label>
            <input
              type="text"
              className={styles.input}
              value={clipData.data.name}
              onChange={(e) => updateData('name', e.target.value)}
              placeholder={`输入${trackTypeInfo?.name || '片段'}名称`}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.section}>
              <label className={styles.label}>开始时间 (秒)</label>
              <input
                type="number"
                className={styles.input}
                value={clipData.startTime}
                onChange={(e) => setClipData({ ...clipData, startTime: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.1"
              />
            </div>

            <div className={styles.section}>
              <label className={styles.label}>持续时间 (秒)</label>
              <input
                type="number"
                className={styles.input}
                value={clipData.duration}
                onChange={(e) => setClipData({ ...clipData, duration: parseFloat(e.target.value) || 1 })}
                min="0.5"
                step="0.5"
              />
            </div>
          </div>

          {/* 场景轨道 - 选择背景图片 */}
          {(trackTypeProp || trackType) === 'scene' && (
            <div className={styles.section}>
              <label className={styles.label}>背景场景</label>
              <div className={styles.sceneSelector}>
                <button
                  className={styles.sceneBtn}
                  onClick={() => updateData('sceneId', 'default')}
                >
                  <span className={styles.sceneIcon}>🖼️</span>
                  <span>选择场景图片</span>
                </button>
                {clipData.data.sceneId && (
                  <div className={styles.selectedScene}>
                    已选择: {clipData.data.sceneId}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 动作轨道 - 选择VRMA动作 */}
          {(trackTypeProp || trackType) === 'action' && (
            <div className={styles.section}>
              <label className={styles.label}>选择动作</label>
              <div className={styles.actionList}>
                {actions.slice(0, 20).map(action => (
                  <div
                    key={action.id}
                    className={`${styles.actionItem} ${clipData.data.actionId === action.id ? styles.selected : ''}`}
                    onClick={() => {
                      updateData('actionId', action.id)
                      updateData('actionName', action.name)
                    }}
                  >
                    <span className={styles.actionName}>{action.name}</span>
                  </div>
                ))}
                {actions.length > 20 && (
                  <div className={styles.moreHint}>
                    还有 {actions.length - 20} 个动作...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 特效轨道 - 选择特效 */}
          {(trackTypeProp || trackType) === 'effect' && (
            <div className={styles.section}>
              <label className={styles.label}>选择特效</label>
              <div className={styles.effectGrid}>
                {effectPresets.map(effect => (
                  <div
                    key={effect.id}
                    className={`${styles.effectItem} ${clipData.data.effectId === effect.id ? styles.selected : ''}`}
                    onClick={() => {
                      updateData('effectId', effect.id)
                      updateData('effectName', effect.name)
                    }}
                  >
                    <span className={styles.effectIcon}>{effect.icon}</span>
                    <span className={styles.effectName}>{effect.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 位置轨道 - 编辑路径 */}
          {(trackTypeProp || trackType) === 'position' && (
            <div className={styles.section}>
              <label className={styles.label}>移动路径</label>
              <button
                className={styles.editPathBtn}
                onClick={() => setShowPositionEditor(true)}
              >
                <span>🗺️</span>
                <span>{clipData.data.pathData ? '编辑路径' : '创建路径'}</span>
              </button>
              {clipData.data.pathData && (
                <div className={styles.pathInfo}>
                  <span>已设置路径: {clipData.data.presetId || '自定义'}</span>
                </div>
              )}
            </div>
          )}

          {/* 缩放轨道 - 设置缩放值 */}
          {(trackTypeProp || trackType) === 'scale' && (
            <div className={styles.section}>
              <label className={styles.label}>缩放比例</label>
              <div className={styles.scaleInput}>
                <input
                  type="number"
                  value={clipData.data.scale || 1}
                  onChange={(e) => updateData('scale', parseFloat(e.target.value) || 1)}
                  min="0.1"
                  max="5"
                  step="0.1"
                />
                <span>倍</span>
              </div>
            </div>
          )}

          {/* 音乐轨道 - 选择音乐 */}
          {(trackTypeProp || trackType) === 'music' && (
            <div className={styles.section}>
              <label className={styles.label}>背景音乐</label>
              <button
                className={styles.selectMusicBtn}
                onClick={() => updateData('musicId', 'default')}
              >
                <span>🎵</span>
                <span>选择音乐文件</span>
              </button>
              {clipData.data.musicId && (
                <div className={styles.selectedMusic}>
                  <span>已选择音乐</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.deleteBtn} onClick={handleDelete}>
            🗑️ 删除
          </button>
          <div className={styles.rightButtons}>
            <button className={styles.cancelBtn} onClick={onClose}>取消</button>
            <button className={styles.saveBtn} onClick={handleSave}>
              💾 保存
            </button>
          </div>
        </div>
      </div>

      {/* 位置编辑器弹窗 */}
      {showPositionEditor && (
        <PositionTrackEditor
          clip={clipData}
          onSave={(updatedClip) => {
            setClipData(updatedClip)
            setShowPositionEditor(false)
          }}
          onClose={() => setShowPositionEditor(false)}
        />
      )}
    </div>
  )
}
