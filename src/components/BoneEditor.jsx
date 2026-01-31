import React, { useState } from 'react'
import './BoneEditor.css'

const boneList = [
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

  if (!isOpen) return null

  const handleSliderChange = (value) => {
    if (!selectedBone) return

    const newValues = {
      ...boneValues,
      [selectedBone]: {
        rotation: { x: value, y: value, z: value },
        position: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      }
    }

    setBoneValues(newValues)
    onBoneChange?.(selectedBone, 'rotation', 'x', parseFloat(value))
  }

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

  const getCurrentValue = () => {
    if (!selectedBone) return 0
    return boneValues[selectedBone]?.rotation?.x || 0
  }

  return (
    <div className="bone-editor-overlay" onClick={onClose}>
      <div className={`bone-editor ${isMobile ? 'mobile' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="editor-header">
          <h2>骨骼编辑器</h2>
          <div className="header-actions">
            <button className="action-btn" onClick={onClose}>确定</button>
          </div>
        </div>

        <div className="editor-body mobile-simple">
          {selectedBone ? (
            <>
              <div className="selected-bone-header">
                <button className="back-btn" onClick={() => setSelectedBone(null)}>←</button>
                <h4>{boneList.find(b => b.name === selectedBone)?.label || selectedBone}</h4>
              </div>

              <div className="single-slider-container">
                <div className="slider-info">
                  <span className="axis-label">旋转角度</span>
                  <span className="value">{getCurrentValue().toFixed(1)}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={getCurrentValue()}
                  onChange={(e) => handleSliderChange(e.target.value)}
                  className="single-slider"
                />
                <div className="slider-range">
                  <span>-180°</span>
                  <span>0°</span>
                  <span>180°</span>
                </div>
              </div>

              <button className="reset-single-btn" onClick={resetCurrentBone}>
                重置
              </button>
            </>
          ) : (
            <div className="bone-list-simple">
              <h3>选择骨骼</h3>
              <div className="bone-grid">
                {boneList.map(bone => (
                  <button
                    key={bone.name}
                    className="bone-item"
                    onClick={() => setSelectedBone(bone.name)}
                    style={{ '--bone-color': bone.color }}
                  >
                    <span className="bone-dot" style={{ background: bone.color }} />
                    <span className="bone-label">{bone.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BoneEditor
