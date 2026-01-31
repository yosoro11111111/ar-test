// 分步引导组件
import React, { useState } from 'react'

const Tutorial = ({ isMobile, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      icon: '👆',
      title: '点击选中',
      desc: '点击角色可以选中/取消选中，选中后角色会有蓝色光环显示',
      color: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)'
    },
    {
      icon: '👆👆',
      title: '双指移动',
      desc: '选中角色后，使用双指滑动可以移动角色位置',
      color: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)'
    },
    {
      icon: '🤏',
      title: '双指缩放',
      desc: '双指捏合可以放大或缩小角色尺寸',
      color: 'linear-gradient(135deg, #ffd93d 0%, #ffb347 100%)'
    },
    {
      icon: '🎬',
      title: '动作面板',
      desc: '底部动作栏可以触发各种动作，支持搜索和收藏',
      color: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'
    },
    {
      icon: '🎁',
      title: '道具装备',
      desc: '右侧工具栏可以给角色装备各种道具和家具',
      color: 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)'
    },
    {
      icon: '📸',
      title: '拍照录像',
      desc: '支持截图和视频录制，保存精彩瞬间',
      color: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)'
    }
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onClose()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const step = steps[currentStep]

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      backdropFilter: 'blur(20px)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.98) 0%, rgba(22, 33, 62, 0.98) 100%)',
        borderRadius: '32px',
        padding: isMobile ? '24px' : '40px',
        maxWidth: '480px',
        width: '90%',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 进度指示器 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'rgba(255,255,255,0.1)'
        }}>
          <div style={{
            height: '100%',
            width: `${((currentStep + 1) / steps.length) * 100}%`,
            background: 'linear-gradient(90deg, #ff6b9d, #00d4ff)',
            transition: 'width 0.3s ease'
          }} />
        </div>

        {/* 步骤指示点 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '24px',
          marginTop: '8px'
        }}>
          {steps.map((_, index) => (
            <div
              key={index}
              style={{
                width: index === currentStep ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: index === currentStep
                  ? 'linear-gradient(90deg, #ff6b9d, #00d4ff)'
                  : index < currentStep ? '#00d4ff' : 'rgba(255,255,255,0.2)',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>

        {/* 图标 */}
        <div style={{
          width: isMobile ? '100px' : '120px',
          height: isMobile ? '100px' : '120px',
          borderRadius: '50%',
          background: step.color,
          margin: '0 auto 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isMobile ? '48px' : '60px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
        }}>
          {step.icon}
        </div>

        {/* 标题 */}
        <h2 style={{
          color: 'white',
          fontSize: isMobile ? '24px' : '28px',
          textAlign: 'center',
          marginBottom: '12px',
          fontWeight: 'bold'
        }}>
          {step.title}
        </h2>

        {/* 描述 */}
        <p style={{
          color: 'rgba(255,255,255,0.8)',
          fontSize: isMobile ? '15px' : '17px',
          textAlign: 'center',
          lineHeight: 1.6,
          marginBottom: '32px'
        }}>
          {step.desc}
        </p>

        {/* 按钮组 */}
        <div style={{
          display: 'flex',
          gap: '12px'
        }}>
          {currentStep > 0 && (
            <button
              onClick={prevStep}
              style={{
                flex: 1,
                padding: isMobile ? '14px' : '16px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '14px',
                color: 'white',
                fontSize: isMobile ? '15px' : '16px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              上一步
            </button>
          )}
          <button
            onClick={nextStep}
            style={{
              flex: 1,
              padding: isMobile ? '14px' : '16px',
              background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
              border: 'none',
              borderRadius: '14px',
              color: 'white',
              fontSize: isMobile ? '15px' : '16px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {currentStep === steps.length - 1 ? '开始使用' : '下一步'}
          </button>
        </div>

        {/* 跳过按钮 */}
        <button
          onClick={onClose}
          style={{
            display: 'block',
            margin: '16px auto 0',
            padding: '8px 16px',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          跳过引导
        </button>
      </div>
    </div>
  )
}

export default Tutorial
