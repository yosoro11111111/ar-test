import React, { useState } from 'react'
import styles from './RightPanel.module.css'

/**
 * 右侧面板 - 动态属性编辑
 * 
 * 根据选中对象类型显示不同的设置：
 * - 场景片段：场景设置（类型、颜色/路径、混合）
 * - 摄像机片段：摄像机设置（位置、目标、FOV、曲线）
 * - 动作片段：动作设置（速度、循环、淡入淡出）
 * - 表情片段：表情设置（强度、混合）
 * - 音乐片段：音频设置（音量、淡入淡出）
 * - 预览区角色：变换设置（位置、旋转、缩放）
 * - 道具：特质设置（绑定骨骼、跟随动作等）
 */
export function RightPanel({
  selectedObject,
  selectedClip,
  selectedTrack,
  project,
  onUpdateObject,
  onUpdateClip,
  onUpdateProject,
  onPickPosition,
  isPickingPosition
}) {
  const [activeTab, setActiveTab] = useState('transform')

  // 根据选中对象类型确定可用的标签页
  const getAvailableTabs = () => {
    if (selectedClip) {
      // 根据片段类型返回对应的标签
      const clipTabs = {
        scene: [
          { id: 'scene', name: '场景', icon: '🏞️' },
          { id: 'transform', name: '变换', icon: '🎯' }
        ],
        camera: [
          { id: 'camera', name: '摄像机', icon: '📷' },
          { id: 'transform', name: '变换', icon: '🎯' }
        ],
        motion: [
          { id: 'animation', name: '动画', icon: '🎬' }
        ],
        expression: [
          { id: 'expression', name: '表情', icon: '😊' }
        ],
        music: [
          { id: 'audio', name: '音频', icon: '🎵' }
        ],
        prop: [
          { id: 'transform', name: '变换', icon: '🎯' },
          { id: 'traits', name: '特质', icon: '⚙️' },
          { id: 'material', name: '材质', icon: '🎨' }
        ]
      }
      return clipTabs[selectedClip.type] || [{ id: 'transform', name: '变换', icon: '🎯' }]
    }
    
    if (selectedObject) {
      // 对象默认标签
      const tabs = [
        { id: 'transform', name: '变换', icon: '🎯' }
      ]
      
      // 如果是道具，添加特质设置
      if (selectedObject.type === 'prop' || selectedObject.category === 'prop') {
        tabs.push({ id: 'traits', name: '特质', icon: '⚙️' })
      }
      
      tabs.push({ id: 'material', name: '材质', icon: '🎨' })
      return tabs
    }
    
    return []
  }

  const tabs = getAvailableTabs()

  // 如果没有选中任何内容，显示空状态
  if (!selectedObject && !selectedClip) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎯</div>
          <div className={styles.emptyTitle}>选择对象或片段以编辑属性</div>
          <div className={styles.emptySubtext}>在预览区点击角色，或在时间轴点击片段</div>
        </div>
      </div>
    )
  }

  // 处理位置变化
  const handlePositionChange = (axis, value) => {
    if (!selectedObject) return
    const numValue = parseFloat(value) || 0
    onUpdateObject(selectedObject.id, {
      position: {
        ...selectedObject.position,
        [axis]: numValue
      }
    })
  }

  // 处理旋转变化
  const handleRotationChange = (axis, value) => {
    if (!selectedObject) return
    const numValue = parseFloat(value) || 0
    onUpdateObject(selectedObject.id, {
      rotation: {
        ...selectedObject.rotation,
        [axis]: numValue
      }
    })
  }

  // 处理缩放变化
  const handleScaleChange = (value) => {
    if (!selectedObject) return
    const numValue = parseFloat(value) || 1
    onUpdateObject(selectedObject.id, { scale: numValue })
  }

  // 处理片段属性更新
  const handleClipPropertyChange = (property, value) => {
    if (!selectedClip || !selectedTrack) return
    onUpdateClip(selectedTrack.id, selectedClip.id, {
      [property]: value
    })
  }

  // 处理特质设置更新
  const handleTraitsChange = (property, value) => {
    if (!selectedObject) return
    onUpdateObject(selectedObject.id, {
      traits: {
        ...selectedObject.traits,
        [property]: value
      }
    })
  }

  // ============ 渲染不同面板 ============
  
  // 处理朝向变化
  const handleOrientationChange = (axis, value) => {
    if (!selectedObject) return
    const numValue = parseFloat(value) || 0
    onUpdateObject(selectedObject.id, {
      orientation: {
        ...selectedObject.orientation,
        [axis]: numValue
      }
    })
  }

  // 变换面板
  const renderTransformPanel = () => (
    <div className={styles.panelContent}>
      {/* 位置 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>📍</span>
          <span className={styles.sectionTitle}>位置</span>
          <button
            className={`${styles.pickBtn} ${isPickingPosition ? styles.active : ''}`}
            onClick={() => onPickPosition?.()}
            title="在预览区点击选择位置"
          >
            {isPickingPosition ? '✓ 点击选择中' : '👆 选择位置'}
          </button>
        </div>
        <div className={styles.inputGroup}>
          <div className={styles.inputRow}>
            <label className={`${styles.axisLabel} ${styles.axisX}`}>X</label>
            <input
              type="number"
              className={styles.numberInput}
              value={selectedObject?.position?.x?.toFixed(2) || '0.00'}
              onChange={(e) => handlePositionChange('x', e.target.value)}
              step="0.1"
            />
          </div>
          <div className={styles.inputRow}>
            <label className={`${styles.axisLabel} ${styles.axisY}`}>Y</label>
            <input
              type="number"
              className={styles.numberInput}
              value={selectedObject?.position?.y?.toFixed(2) || '0.00'}
              onChange={(e) => handlePositionChange('y', e.target.value)}
              step="0.1"
            />
          </div>
          <div className={styles.inputRow}>
            <label className={`${styles.axisLabel} ${styles.axisZ}`}>Z</label>
            <input
              type="number"
              className={styles.numberInput}
              value={selectedObject?.position?.z?.toFixed(2) || '0.00'}
              onChange={(e) => handlePositionChange('z', e.target.value)}
              step="0.1"
            />
          </div>
        </div>
      </div>

      {/* 模型朝向 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>🧭</span>
          <span className={styles.sectionTitle}>模型朝向</span>
        </div>
        <div className={styles.inputGroup}>
          <div className={styles.inputRow}>
            <label className={`${styles.axisLabel} ${styles.axisX}`}>前向 X</label>
            <input
              type="number"
              className={styles.numberInput}
              value={selectedObject?.orientation?.x?.toFixed(2) || '0.00'}
              onChange={(e) => handleOrientationChange('x', e.target.value)}
              step="0.1"
              placeholder="模型前方向量X"
            />
          </div>
          <div className={styles.inputRow}>
            <label className={`${styles.axisLabel} ${styles.axisY}`}>前向 Y</label>
            <input
              type="number"
              className={styles.numberInput}
              value={selectedObject?.orientation?.y?.toFixed(2) || '0.00'}
              onChange={(e) => handleOrientationChange('y', e.target.value)}
              step="0.1"
              placeholder="模型前方向量Y"
            />
          </div>
          <div className={styles.inputRow}>
            <label className={`${styles.axisLabel} ${styles.axisZ}`}>前向 Z</label>
            <input
              type="number"
              className={styles.numberInput}
              value={selectedObject?.orientation?.z?.toFixed(2) || '0.00'}
              onChange={(e) => handleOrientationChange('z', e.target.value)}
              step="0.1"
              placeholder="模型前方向量Z"
            />
          </div>
        </div>
        <div className={styles.orientationPresets}>
          <button
            className={styles.presetBtn}
            onClick={() => {
              onUpdateObject(selectedObject.id, { orientation: { x: 0, y: 0, z: 1 } })
            }}
            title="面向Z轴正方向"
          >
            前
          </button>
          <button
            className={styles.presetBtn}
            onClick={() => {
              onUpdateObject(selectedObject.id, { orientation: { x: 0, y: 0, z: -1 } })
            }}
            title="面向Z轴负方向"
          >
            后
          </button>
          <button
            className={styles.presetBtn}
            onClick={() => {
              onUpdateObject(selectedObject.id, { orientation: { x: 1, y: 0, z: 0 } })
            }}
            title="面向X轴正方向"
          >
            右
          </button>
          <button
            className={styles.presetBtn}
            onClick={() => {
              onUpdateObject(selectedObject.id, { orientation: { x: -1, y: 0, z: 0 } })
            }}
            title="面向X轴负方向"
          >
            左
          </button>
        </div>
      </div>

      {/* 旋转 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>🔄</span>
          <span className={styles.sectionTitle}>旋转</span>
        </div>
        <div className={styles.inputGroup}>
          <div className={styles.inputRow}>
            <label className={`${styles.axisLabel} ${styles.axisX}`}>X</label>
            <input
              type="number"
              className={styles.numberInput}
              value={selectedObject?.rotation?.x?.toFixed(2) || '0.00'}
              onChange={(e) => handleRotationChange('x', e.target.value)}
              step="1"
            />
          </div>
          <div className={styles.inputRow}>
            <label className={`${styles.axisLabel} ${styles.axisY}`}>Y</label>
            <input
              type="number"
              className={styles.numberInput}
              value={selectedObject?.rotation?.y?.toFixed(2) || '0.00'}
              onChange={(e) => handleRotationChange('y', e.target.value)}
              step="1"
            />
          </div>
          <div className={styles.inputRow}>
            <label className={`${styles.axisLabel} ${styles.axisZ}`}>Z</label>
            <input
              type="number"
              className={styles.numberInput}
              value={selectedObject?.rotation?.z?.toFixed(2) || '0.00'}
              onChange={(e) => handleRotationChange('z', e.target.value)}
              step="1"
            />
          </div>
        </div>
      </div>

      {/* 缩放 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>📐</span>
          <span className={styles.sectionTitle}>缩放</span>
        </div>
        <div className={styles.inputGroup}>
          <div className={styles.inputRow}>
            <label className={styles.axisLabel}>统一</label>
            <input
              type="number"
              className={styles.numberInput}
              value={selectedObject?.scale?.toFixed(2) || '1.00'}
              onChange={(e) => handleScaleChange(e.target.value)}
              step="0.1"
              min="0.1"
            />
          </div>
        </div>
      </div>
    </div>
  )

  // 特质设置面板 - 用于道具
  const renderTraitsPanel = () => {
    const traits = selectedObject?.traits || {}
    
    return (
      <div className={styles.panelContent}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>🔗</span>
            <span className={styles.sectionTitle}>绑定设置</span>
          </div>
          
          <div className={styles.propertyRow}>
            <label>绑定到骨骼</label>
            <select
              value={traits.bindBone || 'none'}
              onChange={(e) => handleTraitsChange('bindBone', e.target.value)}
              className={styles.selectInput}
            >
              <option value="none">不绑定</option>
              <option value="head">头部 (Head)</option>
              <option value="neck">颈部 (Neck)</option>
              <option value="chest">胸部 (Chest)</option>
              <option value="spine">脊柱 (Spine)</option>
              <option value="leftHand">左手 (Left Hand)</option>
              <option value="rightHand">右手 (Right Hand)</option>
              <option value="leftFoot">左脚 (Left Foot)</option>
              <option value="rightFoot">右脚 (Right Foot)</option>
            </select>
          </div>
          
          {traits.bindBone && traits.bindBone !== 'none' && (
            <>
              <div className={styles.propertyRow}>
                <label>跟随动作</label>
                <button
                  className={`${styles.toggleBtn} ${traits.followMotion ? styles.active : ''}`}
                  onClick={() => handleTraitsChange('followMotion', !traits.followMotion)}
                >
                  {traits.followMotion ? '✓ 开启' : '✗ 关闭'}
                </button>
              </div>
              
              <div className={styles.propertyRow}>
                <label>保持相对位置</label>
                <button
                  className={`${styles.toggleBtn} ${traits.keepRelativePosition ? styles.active : ''}`}
                  onClick={() => handleTraitsChange('keepRelativePosition', !traits.keepRelativePosition)}
                >
                  {traits.keepRelativePosition ? '✓ 开启' : '✗ 关闭'}
                </button>
              </div>
            </>
          )}
        </div>
        
        {traits.bindBone && traits.bindBone !== 'none' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>📍</span>
              <span className={styles.sectionTitle}>位置偏移</span>
            </div>
            
            <div className={styles.inputGroup}>
              <div className={styles.inputRow}>
                <label className={`${styles.axisLabel} ${styles.axisX}`}>X</label>
                <input
                  type="number"
                  className={styles.numberInput}
                  value={traits.offset?.x?.toFixed(2) || '0.00'}
                  onChange={(e) => handleTraitsChange('offset', {
                    ...traits.offset,
                    x: parseFloat(e.target.value) || 0
                  })}
                  step="0.01"
                />
              </div>
              <div className={styles.inputRow}>
                <label className={`${styles.axisLabel} ${styles.axisY}`}>Y</label>
                <input
                  type="number"
                  className={styles.numberInput}
                  value={traits.offset?.y?.toFixed(2) || '0.00'}
                  onChange={(e) => handleTraitsChange('offset', {
                    ...traits.offset,
                    y: parseFloat(e.target.value) || 0
                  })}
                  step="0.01"
                />
              </div>
              <div className={styles.inputRow}>
                <label className={`${styles.axisLabel} ${styles.axisZ}`}>Z</label>
                <input
                  type="number"
                  className={styles.numberInput}
                  value={traits.offset?.z?.toFixed(2) || '0.00'}
                  onChange={(e) => handleTraitsChange('offset', {
                    ...traits.offset,
                    z: parseFloat(e.target.value) || 0
                  })}
                  step="0.01"
                />
              </div>
            </div>
          </div>
        )}
        
        {traits.bindBone && traits.bindBone !== 'none' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🔄</span>
              <span className={styles.sectionTitle}>旋转偏移</span>
            </div>
            
            <div className={styles.inputGroup}>
              <div className={styles.inputRow}>
                <label className={`${styles.axisLabel} ${styles.axisX}`}>X</label>
                <input
                  type="number"
                  className={styles.numberInput}
                  value={traits.rotationOffset?.x?.toFixed(2) || '0.00'}
                  onChange={(e) => handleTraitsChange('rotationOffset', {
                    ...traits.rotationOffset,
                    x: parseFloat(e.target.value) || 0
                  })}
                  step="1"
                />
              </div>
              <div className={styles.inputRow}>
                <label className={`${styles.axisLabel} ${styles.axisY}`}>Y</label>
                <input
                  type="number"
                  className={styles.numberInput}
                  value={traits.rotationOffset?.y?.toFixed(2) || '0.00'}
                  onChange={(e) => handleTraitsChange('rotationOffset', {
                    ...traits.rotationOffset,
                    y: parseFloat(e.target.value) || 0
                  })}
                  step="1"
                />
              </div>
              <div className={styles.inputRow}>
                <label className={`${styles.axisLabel} ${styles.axisZ}`}>Z</label>
                <input
                  type="number"
                  className={styles.numberInput}
                  value={traits.rotationOffset?.z?.toFixed(2) || '0.00'}
                  onChange={(e) => handleTraitsChange('rotationOffset', {
                    ...traits.rotationOffset,
                    z: parseFloat(e.target.value) || 0
                  })}
                  step="1"
                />
              </div>
            </div>
          </div>
        )}
        
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>💡</span>
            <span className={styles.sectionTitle}>说明</span>
          </div>
          <p className={styles.hintText}>
            绑定道具到骨骼后，道具会跟随骨骼移动。例如：眼镜绑定到头部，会随头部动作移动。
          </p>
        </div>
      </div>
    )
  }

  // 通用时间属性面板（所有片段类型都有）
  const renderTimeProperties = () => {
    if (!selectedClip) return null
    
    const duration = selectedClip.end - selectedClip.start
    
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>⏱️</span>
          <span className={styles.sectionTitle}>时间属性</span>
        </div>
        <div className={styles.inputGroup}>
          <div className={styles.inputRow}>
            <label className={styles.propertyLabel}>开始时间</label>
            <input
              type="number"
              className={styles.numberInput}
              value={selectedClip.start.toFixed(2)}
              onChange={(e) => {
                const newStart = parseFloat(e.target.value) || 0
                if (newStart < selectedClip.end) {
                  handleClipPropertyChange('start', newStart)
                }
              }}
              step="0.1"
              min="0"
            />
            <span className={styles.unit}>s</span>
          </div>
          <div className={styles.inputRow}>
            <label className={styles.propertyLabel}>结束时间</label>
            <input
              type="number"
              className={styles.numberInput}
              value={selectedClip.end.toFixed(2)}
              onChange={(e) => {
                const newEnd = parseFloat(e.target.value) || 0
                if (newEnd > selectedClip.start) {
                  handleClipPropertyChange('end', newEnd)
                }
              }}
              step="0.1"
              min="0"
            />
            <span className={styles.unit}>s</span>
          </div>
          <div className={styles.inputRow}>
            <label className={styles.propertyLabel}>持续时间</label>
            <input
              type="number"
              className={styles.numberInput}
              value={duration.toFixed(2)}
              onChange={(e) => {
                const newDuration = parseFloat(e.target.value) || 1
                handleClipPropertyChange('end', selectedClip.start + newDuration)
              }}
              step="0.1"
              min="0.1"
            />
            <span className={styles.unit}>s</span>
          </div>
        </div>
      </div>
    )
  }

  // 场景片段设置面板
  const renderScenePanel = () => (
    <div className={styles.panelContent}>
      {renderTimeProperties()}
      
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>🏞️</span>
          <span className={styles.sectionTitle}>场景类型</span>
        </div>
        <div className={styles.sceneTypeGrid}>
          {[
            { id: 'glb', name: '3D模型', icon: '🎲' },
            { id: 'color', name: '纯色', icon: '🎨' },
            { id: 'video', name: '视频', icon: '🎬' },
            { id: 'image', name: '图片', icon: '🖼️' }
          ].map(type => (
            <button
              key={type.id}
              className={`${styles.sceneTypeBtn} ${selectedClip?.sceneType === type.id ? styles.active : ''}`}
              onClick={() => handleClipPropertyChange('sceneType', type.id)}
            >
              <span className={styles.sceneTypeIcon}>{type.icon}</span>
              <span className={styles.sceneTypeName}>{type.name}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedClip?.sceneType === 'color' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>🎨</span>
            <span className={styles.sectionTitle}>背景颜色</span>
          </div>
          <div className={styles.colorPicker}>
            <input
              type="color"
              value={selectedClip?.color || '#0a0a0f'}
              onChange={(e) => handleClipPropertyChange('color', e.target.value)}
              className={styles.colorInput}
            />
            <span className={styles.colorValue}>{selectedClip?.color || '#0a0a0f'}</span>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>🔄</span>
          <span className={styles.sectionTitle}>混合设置</span>
        </div>
        <div className={styles.propertyRow}>
          <label>淡入时长</label>
          <input
            type="number"
            value={selectedClip?.fadeIn || 0}
            onChange={(e) => handleClipPropertyChange('fadeIn', parseFloat(e.target.value))}
            step="0.1"
            min="0"
            className={styles.propertyInput}
          />
          <span>秒</span>
        </div>
        <div className={styles.propertyRow}>
          <label>淡出时长</label>
          <input
            type="number"
            value={selectedClip?.fadeOut || 0}
            onChange={(e) => handleClipPropertyChange('fadeOut', parseFloat(e.target.value))}
            step="0.1"
            min="0"
            className={styles.propertyInput}
          />
          <span>秒</span>
        </div>
      </div>
    </div>
  )

  // 摄像机片段设置面板
  const renderCameraPanel = () => (
    <div className={styles.panelContent}>
      {renderTimeProperties()}
      
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>📷</span>
          <span className={styles.sectionTitle}>摄像机位置</span>
        </div>
        <div className={styles.inputGroup}>
          {['x', 'y', 'z'].map(axis => (
            <div key={axis} className={styles.inputRow}>
              <label className={`${styles.axisLabel} ${styles[`axis${axis.toUpperCase()}`]}`}>
                {axis.toUpperCase()}
              </label>
              <input
                type="number"
                className={styles.numberInput}
                value={selectedClip?.cameraPosition?.[axis]?.toFixed(2) || '0.00'}
                onChange={(e) => {
                  const newPos = { ...selectedClip.cameraPosition, [axis]: parseFloat(e.target.value) || 0 }
                  handleClipPropertyChange('cameraPosition', newPos)
                }}
                step="0.1"
              />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>🎯</span>
          <span className={styles.sectionTitle}>目标点</span>
        </div>
        <div className={styles.inputGroup}>
          {['x', 'y', 'z'].map(axis => (
            <div key={axis} className={styles.inputRow}>
              <label className={`${styles.axisLabel} ${styles[`axis${axis.toUpperCase()}`]}`}>
                {axis.toUpperCase()}
              </label>
              <input
                type="number"
                className={styles.numberInput}
                value={selectedClip?.targetPosition?.[axis]?.toFixed(2) || '0.00'}
                onChange={(e) => {
                  const newTarget = { ...selectedClip.targetPosition, [axis]: parseFloat(e.target.value) || 0 }
                  handleClipPropertyChange('targetPosition', newTarget)
                }}
                step="0.1"
              />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>👁️</span>
          <span className={styles.sectionTitle}>视角</span>
        </div>
        <div className={styles.propertyRow}>
          <label>FOV</label>
          <input
            type="range"
            value={selectedClip?.fov || 60}
            onChange={(e) => handleClipPropertyChange('fov', parseInt(e.target.value))}
            min="10"
            max="120"
            className={styles.sliderInput}
          />
          <span>{selectedClip?.fov || 60}°</span>
        </div>
        <div className={styles.propertyRow}>
          <label>移动曲线</label>
          <select
            value={selectedClip?.curve || 'linear'}
            onChange={(e) => handleClipPropertyChange('curve', e.target.value)}
            className={styles.selectInput}
          >
            <option value="linear">线性</option>
            <option value="easeIn">缓入</option>
            <option value="easeOut">缓出</option>
            <option value="easeInOut">缓入缓出</option>
          </select>
        </div>
      </div>
    </div>
  )

  // 动作片段设置面板
  const renderAnimationPanel = () => (
    <div className={styles.panelContent}>
      {renderTimeProperties()}
      
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>🎬</span>
          <span className={styles.sectionTitle}>动作设置</span>
        </div>
        
        <div className={styles.propertyRow}>
          <label>播放速度</label>
          <input
            type="range"
            value={(selectedClip?.speed || 1) * 100}
            onChange={(e) => handleClipPropertyChange('speed', parseInt(e.target.value) / 100)}
            min="25"
            max="200"
            className={styles.sliderInput}
          />
          <span>{(selectedClip?.speed || 1).toFixed(2)}x</span>
        </div>

        <div className={styles.propertyRow}>
          <label>循环播放</label>
          <button
            className={`${styles.toggleBtn} ${selectedClip?.loop ? styles.active : ''}`}
            onClick={() => handleClipPropertyChange('loop', !selectedClip?.loop)}
          >
            {selectedClip?.loop ? '✓ 开启' : '✗ 关闭'}
          </button>
        </div>

        <div className={styles.propertyRow}>
          <label>淡入时长</label>
          <input
            type="number"
            value={selectedClip?.fadeIn || 0.3}
            onChange={(e) => handleClipPropertyChange('fadeIn', parseFloat(e.target.value))}
            step="0.1"
            min="0"
            className={styles.propertyInput}
          />
          <span>秒</span>
        </div>

        <div className={styles.propertyRow}>
          <label>淡出时长</label>
          <input
            type="number"
            value={selectedClip?.fadeOut || 0.3}
            onChange={(e) => handleClipPropertyChange('fadeOut', parseFloat(e.target.value))}
            step="0.1"
            min="0"
            className={styles.propertyInput}
          />
          <span>秒</span>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>📊</span>
          <span className={styles.sectionTitle}>片段信息</span>
        </div>
        <div className={styles.infoRow}>
          <span>开始时间:</span>
          <span>{selectedClip?.start?.toFixed(2)}s</span>
        </div>
        <div className={styles.infoRow}>
          <span>结束时间:</span>
          <span>{selectedClip?.end?.toFixed(2)}s</span>
        </div>
        <div className={styles.infoRow}>
          <span>时长:</span>
          <span>{((selectedClip?.end || 0) - (selectedClip?.start || 0)).toFixed(2)}s</span>
        </div>
      </div>
    </div>
  )

  // 音频片段设置面板
  const renderAudioPanel = () => (
    <div className={styles.panelContent}>
      {renderTimeProperties()}
      
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>🎵</span>
          <span className={styles.sectionTitle}>音频设置</span>
        </div>
        
        <div className={styles.propertyRow}>
          <label>音量</label>
          <input
            type="range"
            value={(selectedClip?.volume || 1) * 100}
            onChange={(e) => handleClipPropertyChange('volume', parseInt(e.target.value) / 100)}
            min="0"
            max="100"
            className={styles.sliderInput}
          />
          <span>{Math.round((selectedClip?.volume || 1) * 100)}%</span>
        </div>

        <div className={styles.propertyRow}>
          <label>淡入时长</label>
          <input
            type="number"
            value={selectedClip?.fadeIn || 0}
            onChange={(e) => handleClipPropertyChange('fadeIn', parseFloat(e.target.value))}
            step="0.1"
            min="0"
            className={styles.propertyInput}
          />
          <span>秒</span>
        </div>

        <div className={styles.propertyRow}>
          <label>淡出时长</label>
          <input
            type="number"
            value={selectedClip?.fadeOut || 0}
            onChange={(e) => handleClipPropertyChange('fadeOut', parseFloat(e.target.value))}
            step="0.1"
            min="0"
            className={styles.propertyInput}
          />
          <span>秒</span>
        </div>
      </div>
    </div>
  )

  // 渲染当前选中的面板
  const renderPanel = () => {
    const panelMap = {
      transform: renderTransformPanel,
      traits: renderTraitsPanel,
      scene: renderScenePanel,
      camera: renderCameraPanel,
      animation: renderAnimationPanel,
      audio: renderAudioPanel
    }
    
    const renderFn = panelMap[activeTab] || renderTransformPanel
    return renderFn()
  }

  return (
    <div className={styles.container}>
      {/* 选中对象信息 - 压缩显示 */}
      {(selectedObject || selectedClip) && (
        <div className={styles.objectHeader}>
          <span className={styles.objectIcon}>
            {selectedClip ? (
              selectedClip.type === 'scene' ? '🏞️' :
              selectedClip.type === 'camera' ? '📷' :
              selectedClip.type === 'motion' ? '🎭' :
              selectedClip.type === 'music' ? '🎵' : '📄'
            ) : '👤'}
          </span>
          <div className={styles.objectInfo}>
            <span className={styles.objectName}>
              {selectedClip?.name || selectedObject?.name || '未命名'}
            </span>
            <span className={styles.objectType}>
              {selectedClip?.type || selectedObject?.category || '对象'}
            </span>
          </div>
        </div>
      )}

      {/* 标签页 - 图标化 */}
      {tabs.length > 0 && (
        <div className={styles.tabs}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
              title={tab.name}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
            </button>
          ))}
        </div>
      )}

      {/* 面板内容 */}
      <div className={styles.content}>
        {renderPanel()}
      </div>
    </div>
  )
}
