import React, { useState, useEffect } from 'react'
import styles from './CellEditModal.module.css'
import { getAllVRMActions } from '../../../data/vrmaActions'
import { getTrackTypeInfo } from './trackTypes'
import { PositionTrackEditor } from './PositionTrackEditor'
import { SceneManagerModal } from './SceneManagerModal'
import { ActionSelectModal } from './ActionSelectModal'
import { MusicSelectorModal } from './MusicSelectorModal'
import { PropSelectorModal } from './PropSelectorModal'
import { ActionPresetEditor } from './ActionPresetEditor'
import { CameraEditor } from './CameraEditor'
import { loadPresetsFromStorage, calculatePresetDuration } from './actionPresets'

/**
 * 片段编辑弹窗 - 新版
 * 支持编辑各种类型的片段
 */
export function CellEditModal({ trackId, trackType: trackTypeProp, clip, onSave, onDelete, onClose }) {
  const [actions, setActions] = useState([])
  const [trackType, setTrackType] = useState(trackTypeProp || null)
  const [showPositionEditor, setShowPositionEditor] = useState(false)
  const [showSceneManager, setShowSceneManager] = useState(false)
  const [showActionSelector, setShowActionSelector] = useState(false)
  const [showMusicSelector, setShowMusicSelector] = useState(false)
  const [showPropSelector, setShowPropSelector] = useState(false)
  const [showActionPresetEditor, setShowActionPresetEditor] = useState(false)
  const [showActionPresetSelector, setShowActionPresetSelector] = useState(false)
  const [showCameraEditor, setShowCameraEditor] = useState(false)
  const [savedPresets, setSavedPresets] = useState([])

  // 加载保存的预设
  useEffect(() => {
    const presets = loadPresetsFromStorage()
    setSavedPresets(presets)
  }, [showActionPresetSelector])

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
                  onClick={() => setShowSceneManager(true)}
                >
                  <span className={styles.sceneIcon}>🖼️</span>
                  <span>选择场景图片</span>
                </button>
                {clipData.data.sceneId && (
                  <div className={styles.selectedScene}>
                    已选择: {clipData.data.sceneName || clipData.data.sceneId}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 动作轨道 - 选择VRMA动作或动作预设 */}
          {(trackTypeProp || trackType) === 'action' && (
            <div className={styles.section}>
              <label className={styles.label}>选择动作</label>
              
              {/* 单个动作选择 */}
              <button
                className={styles.selectActionBtn}
                onClick={() => setShowActionSelector(true)}
              >
                <span>🎭</span>
                <span>{clipData.data.actionName || '选择单个动作'}</span>
              </button>
              
              {/* 动作预设选择 */}
              <div className={styles.presetSection}>
                <button
                  className={styles.selectPresetBtn}
                  onClick={() => setShowActionPresetSelector(true)}
                >
                  <span>📋</span>
                  <span>{clipData.data.presetName || '选择动作合集'}</span>
                </button>
                <button
                  className={styles.createPresetBtn}
                  onClick={() => setShowActionPresetEditor(true)}
                  title="创建新预设"
                >
                  ➕
                </button>
              </div>
              
              {/* 显示已选择的内容 */}
              {clipData.data.actionId && !clipData.data.presetId && (
                <div className={styles.selectedAction}>
                  <span>已选择动作: {clipData.data.actionName}</span>
                  {clipData.data.actionCategory && (
                    <span className={styles.actionCategoryBadge}>{clipData.data.actionCategory}</span>
                  )}
                </div>
              )}
              {clipData.data.presetId && (
                <div className={styles.selectedPreset}>
                  <span>已选择合集: {clipData.data.presetName}</span>
                  <span className={styles.presetInfo}>
                    {clipData.data.presetActionCount}个动作 | {clipData.data.presetDuration?.toFixed(1)}s
                  </span>
                </div>
              )}
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
                onClick={() => setShowMusicSelector(true)}
              >
                <span>🎵</span>
                <span>{clipData.data.musicName || '选择音乐文件'}</span>
              </button>
              {clipData.data.musicId && (
                <div className={styles.selectedMusic}>
                  <span>已选择: {clipData.data.musicName}</span>
                  {clipData.data.musicDuration && (
                    <span className={styles.musicDuration}>
                      {Math.round(clipData.data.musicDuration)}s
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 道具轨道 - 选择道具 */}
          {(trackTypeProp || trackType) === 'prop' && (
            <div className={styles.section}>
              <label className={styles.label}>3D道具</label>
              <button
                className={styles.selectPropBtn}
                onClick={() => setShowPropSelector(true)}
              >
                <span>📦</span>
                <span>{clipData.data.propName || '选择道具'}</span>
              </button>
              {clipData.data.propId && (
                <div className={styles.selectedProp}>
                  <span>已选择: {clipData.data.propName}</span>
                  <span className={styles.propTypeBadge}>
                    {clipData.data.propType === 'primitive' ? '基础形状' : 
                     clipData.data.propType === 'uploaded' ? '自定义模型' : '3D模型'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 背景缩放轨道 */}
          {(trackTypeProp || trackType) === 'bgScale' && (
            <div className={styles.section}>
              <label className={styles.label}>背景缩放比例</label>
              <div className={styles.bgScaleInput}>
                <input
                  type="number"
                  value={clipData.data.scale || 1}
                  onChange={(e) => updateData('scale', parseFloat(e.target.value) || 1)}
                  min="0.1"
                  max="10"
                  step="0.1"
                />
                <span>倍</span>
              </div>
              <div className={styles.bgScaleHint}>
                调整背景场景的缩放比例，1为原始大小
              </div>
            </div>
          )}

          {/* 摄像机轨道 - 关键帧编辑 */}
          {(trackTypeProp || trackType) === 'camera' && (
            <div className={styles.section}>
              <label className={styles.label}>摄像机关键帧</label>
              <button
                className={styles.editCameraBtn}
                onClick={() => setShowCameraEditor(true)}
              >
                <span>🎥</span>
                <span>{clipData.data.keyframes?.length > 0 ? '编辑关键帧' : '创建关键帧'}</span>
              </button>
              {clipData.data.keyframes?.length > 0 && (
                <div className={styles.cameraInfo}>
                  <span>已设置 {clipData.data.keyframes.length} 个关键帧</span>
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

      {/* 场景管理器弹窗 */}
      {showSceneManager && (
        <SceneManagerModal
          onSelect={(scene) => {
            updateData('sceneId', scene.id)
            updateData('sceneName', scene.name)
            updateData('sceneData', scene.data)
            setShowSceneManager(false)
          }}
          onClose={() => setShowSceneManager(false)}
        />
      )}

      {/* 动作选择器弹窗 */}
      {showActionSelector && (
        <ActionSelectModal
          onSelect={(action) => {
            updateData('actionId', action.id)
            updateData('actionName', action.name)
            updateData('actionCategory', action.category)
            updateData('actionData', action)
            setShowActionSelector(false)
          }}
          onClose={() => setShowActionSelector(false)}
        />
      )}

      {/* 音乐选择器弹窗 */}
      {showMusicSelector && (
        <MusicSelectorModal
          onSelect={(music) => {
            updateData('musicId', music.id)
            updateData('musicName', music.name)
            updateData('musicUrl', music.url)
            updateData('musicDuration', music.duration)
            updateData('musicFile', music.file)
            setShowMusicSelector(false)
          }}
          onClose={() => setShowMusicSelector(false)}
        />
      )}

      {/* 道具选择器弹窗 */}
      {showPropSelector && (
        <PropSelectorModal
          onSelect={(prop) => {
            updateData('propId', prop.id)
            updateData('propName', prop.name)
            updateData('propType', prop.type)
            updateData('propData', prop)
            setShowPropSelector(false)
          }}
          onClose={() => setShowPropSelector(false)}
        />
      )}

      {/* 动作预设编辑器 */}
      {showActionPresetEditor && (
        <ActionPresetEditor
          isOpen={showActionPresetEditor}
          onClose={() => setShowActionPresetEditor(false)}
          onSave={(preset) => {
            // 刷新预设列表
            const presets = loadPresetsFromStorage()
            setSavedPresets(presets)
          }}
        />
      )}

      {/* 动作预设选择器 */}
      {showActionPresetSelector && (
        <div className={styles.overlay} onClick={() => setShowActionPresetSelector(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
              <h3 className={styles.title}>
                <span className={styles.icon}>📋</span>
                选择动作合集
              </h3>
              <button className={styles.closeBtn} onClick={() => setShowActionPresetSelector(false)}>×</button>
            </div>
            <div className={styles.content}>
              {savedPresets.length === 0 ? (
                <div className={styles.emptyPresets}>
                  <span className={styles.emptyIcon}>📋</span>
                  <p>暂无动作合集</p>
                  <button 
                    className={styles.createPresetBtn}
                    onClick={() => {
                      setShowActionPresetSelector(false)
                      setShowActionPresetEditor(true)
                    }}
                  >
                    创建第一个合集
                  </button>
                </div>
              ) : (
                <div className={styles.presetList}>
                  {savedPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className={styles.presetItem}
                      onClick={() => {
                        // 清除单个动作选择
                        updateData('actionId', null)
                        updateData('actionName', null)
                        // 设置预设
                        updateData('presetId', preset.id)
                        updateData('presetName', preset.name)
                        updateData('presetActions', preset.actions)
                        updateData('presetActionCount', preset.actions.length)
                        updateData('presetDuration', calculatePresetDuration(preset))
                        // 更新片段时长为预设总时长
                        const duration = calculatePresetDuration(preset)
                        if (duration > 0) {
                          setClipData(prev => ({ ...prev, duration }))
                        }
                        setShowActionPresetSelector(false)
                      }}
                    >
                      <div className={styles.presetHeader}>
                        <span className={styles.presetName}>{preset.name}</span>
                        <span className={styles.presetCount}>
                          {preset.actions.length}个动作
                        </span>
                      </div>
                      {preset.description && (
                        <p className={styles.presetDesc}>{preset.description}</p>
                      )}
                      <div className={styles.presetMeta}>
                        <span>总时长: {calculatePresetDuration(preset).toFixed(1)}s</span>
                        <span>创建于: {new Date(preset.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 摄像机编辑器弹窗 */}
      {showCameraEditor && (
        <CameraEditor
          clip={clipData}
          onSave={(cameraData) => {
            updateData('keyframes', cameraData.keyframes)
            updateData('duration', cameraData.duration)
            setClipData(prev => ({ ...prev, duration: cameraData.duration }))
            setShowCameraEditor(false)
          }}
          onClose={() => setShowCameraEditor(false)}
          onStartCoordinatePicker={(mode, callback, currentValue) => {
            // 关闭 CameraEditor 和 CellEditModal，让用户在预览画面中选择
            setShowCameraEditor(false)
            onClose()
            // 通过全局事件传递坐标选择请求给父组件
            if (window.startCoordinatePicker) {
              window.startCoordinatePicker(mode, callback, currentValue)
            }
          }}
        />
      )}
    </div>
  )
}
