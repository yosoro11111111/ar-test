import React, { useState, useEffect } from 'react'
import './BoneEditor.css'

// 骨骼编辑器组件
export const BoneEditor = ({ 
  isOpen, 
  onClose, 
  bones, 
  onBoneChange,
  vrmModel,
  isMobile 
}) => {
  const [selectedBone, setSelectedBone] = useState(null)
  const [boneValues, setBoneValues] = useState({})
  const [activeTab, setActiveTab] = useState('rotation')
  const [savedPoses, setSavedPoses] = useState(() => {
    const saved = localStorage.getItem('savedPoses')
    return saved ? JSON.parse(saved) : []
  })

  if (!isOpen) return null

  // 骨骼列表
  const boneList = bones || [
    { name: 'hips', label: '臀部', color: '#ff6b6b' },
    { name: 'spine', label: '脊柱', color: '#4ecdc4' },
    { name: 'chest', label: '胸部', color: '#45b7d1' },
    { name: 'neck', label: '颈部', color: '#96ceb4' },
    { name: 'head', label: '头部', color: '#feca57' },
    { name: 'leftShoulder', label: '左肩', color: '#ff9ff3' },
    { name: 'leftUpperArm', label: '左上臂', color: '#ff9ff3' },
    { name: 'leftLowerArm', label: '左前臂', color: '#ff9ff3' },
    { name: 'leftHand', label: '左手', color: '#ff9ff3' },
    { name: 'rightShoulder', label: '右肩', color: '#54a0ff' },
    { name: 'rightUpperArm', label: '右上臂', color: '#54a0ff' },
    { name: 'rightLowerArm', label: '右前臂', color: '#54a0ff' },
    { name: 'rightHand', label: '右手', color: '#54a0ff' },
    { name: 'leftUpperLeg', label: '左大腿', color: '#5f27cd' },
    { name: 'leftLowerLeg', label: '左小腿', color: '#5f27cd' },
    { name: 'leftFoot', label: '左脚', color: '#5f27cd' },
    { name: 'rightUpperLeg', label: '右大腿', color: '#00d2d3' },
    { name: 'rightLowerLeg', label: '右小腿', color: '#00d2d3' },
    { name: 'rightFoot', label: '右脚', color: '#00d2d3' }
  ]

  // 处理滑块变化
  const handleSliderChange = (axis, value) => {
    if (!selectedBone) return
    
    const newValues = {
      ...boneValues,
      [selectedBone]: {
        ...boneValues[selectedBone],
        [activeTab]: {
          ...boneValues[selectedBone]?.[activeTab],
          [axis]: parseFloat(value)
        }
      }
    }
    
    setBoneValues(newValues)
    onBoneChange?.(selectedBone, activeTab, axis, parseFloat(value))
  }

  // 重置当前骨骼
  const resetCurrentBone = () => {
    if (!selectedBone) return
    
    const newValues = {
      ...boneValues,
      [selectedBone]: {
        rotation: { x: 0, y: 0, z: 0 },
        position: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      }
    }
    
    setBoneValues(newValues)
    onBoneChange?.(selectedBone, 'reset')
  }

  // 重置所有骨骼
  const resetAllBones = () => {
    setBoneValues({})
    onBoneChange?.('all', 'reset')
  }

  // 保存姿势
  const savePose = () => {
    const poseName = prompt('请输入姿势名称:')
    if (!poseName) return
    
    const newPose = {
      id: Date.now(),
      name: poseName,
      values: { ...boneValues },
      timestamp: new Date().toISOString()
    }
    
    const updatedPoses = [...savedPoses, newPose]
    setSavedPoses(updatedPoses)
    localStorage.setItem('savedPoses', JSON.stringify(updatedPoses))
  }

  // 加载姿势
  const loadPose = (pose) => {
    setBoneValues(pose.values)
    onBoneChange?.('load', pose.values)
  }

  // 删除姿势
  const deletePose = (poseId) => {
    const updatedPoses = savedPoses.filter(p => p.id !== poseId)
    setSavedPoses(updatedPoses)
    localStorage.setItem('savedPoses', JSON.stringify(updatedPoses))
  }

  // 获取当前值
  const getCurrentValue = (axis) => {
    if (!selectedBone) return 0
    return boneValues[selectedBone]?.[activeTab]?.[axis] || 0
  }

  return (
    <div className="bone-editor-overlay" onClick={onClose}>
      <div className={`bone-editor ${isMobile ? 'mobile' : ''}`} onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="editor-header">
          <h2>骨骼编辑器</h2>
          <div className="header-actions">
            <button className="action-btn" onClick={savePose} title="保存姿势">
              💾
            </button>
            <button className="action-btn" onClick={resetAllBones} title="重置全部">
              🔄
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="editor-body">
          {/* 左侧骨骼列表 */}
          <div className="bone-list">
            <h3>选择骨骼</h3>
            <div className="bone-grid">
              {boneList.map(bone => (
                <button
                  key={bone.name}
                  className={`bone-item ${selectedBone === bone.name ? 'active' : ''}`}
                  onClick={() => setSelectedBone(bone.name)}
                  style={{ '--bone-color': bone.color }}
                >
                  <span className="bone-dot" style={{ background: bone.color }} />
                  <span className="bone-label">{bone.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 右侧控制面板 */}
          <div className="control-panel">
            {selectedBone ? (
              <>
                {/* 当前骨骼信息 */}
                <div className="selected-bone-info">
                  <h4>
                    {boneList.find(b => b.name === selectedBone)?.label || selectedBone}
                  </h4>
                  <button className="reset-btn" onClick={resetCurrentBone}>
                    重置
                  </button>
                </div>

                {/* 标签页 */}
                <div className="control-tabs">
                  <button 
                    className={activeTab === 'rotation' ? 'active' : ''}
                    onClick={() => setActiveTab('rotation')}
                  >
                    旋转
                  </button>
                  <button 
                    className={activeTab === 'position' ? 'active' : ''}
                    onClick={() => setActiveTab('position')}
                  >
                    位置
                  </button>
                  <button 
                    className={activeTab === 'scale' ? 'active' : ''}
                    onClick={() => setActiveTab('scale')}
                  >
                    缩放
                  </button>
                </div>

                {/* 滑块控制 */}
                <div className="sliders-container">
                  {['x', 'y', 'z'].map(axis => (
                    <div key={axis} className="slider-group">
                      <div className="slider-label">
                        <span className={`axis-${axis}`}>{axis.toUpperCase()}</span>
                        <span className="value">{getCurrentValue(axis).toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min={activeTab === 'scale' ? 0.1 : -180}
                        max={activeTab === 'scale' ? 3 : 180}
                        step={activeTab === 'scale' ? 0.1 : 1}
                        value={getCurrentValue(axis)}
                        onChange={(e) => handleSliderChange(axis, e.target.value)}
                        className="slider"
                      />
                      <div className="slider-marks">
                        <span>{activeTab === 'scale' ? '0.1' : '-180'}</span>
                        <span>{activeTab === 'scale' ? '1.5' : '0'}</span>
                        <span>{activeTab === 'scale' ? '3' : '180'}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 快捷操作 */}
                <div className="quick-actions">
                  <button onClick={() => handleSliderChange('x', 0)}>X归零</button>
                  <button onClick={() => handleSliderChange('y', 0)}>Y归零</button>
                  <button onClick={() => handleSliderChange('z', 0)}>Z归零</button>
                </div>
              </>
            ) : (
              <div className="no-selection">
                <span className="placeholder-icon">🦴</span>
                <p>请从左侧选择一个骨骼进行编辑</p>
              </div>
            )}

            {/* 已保存的姿势 */}
            {savedPoses.length > 0 && (
              <div className="saved-poses">
                <h4>已保存的姿势</h4>
                <div className="pose-list">
                  {savedPoses.map(pose => (
                    <div key={pose.id} className="pose-item">
                      <span className="pose-name">{pose.name}</span>
                      <div className="pose-actions">
                        <button onClick={() => loadPose(pose)}>加载</button>
                        <button onClick={() => deletePose(pose.id)}>删除</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BoneEditor
