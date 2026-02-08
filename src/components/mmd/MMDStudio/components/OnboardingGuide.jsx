import React, { useState, useEffect } from 'react'
import styles from './OnboardingGuide.module.css'

/**
 * 新用户引导组件
 */
export function OnboardingGuide({ onComplete }) {
  const [step, setStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 检查是否已看过引导
    const hasSeenGuide = localStorage.getItem('mmd-studio-guide-seen')
    if (!hasSeenGuide) {
      setIsVisible(true)
    }
  }, [])

  const steps = [
    {
      title: '欢迎使用 MMD Studio',
      content: '这是一个全新的MMD制作工具，让你可以轻松创建3D动画。',
      icon: '🎬',
      position: 'center'
    },
    {
      title: '选择角色',
      content: '在左侧资源面板，点击"选择文件"按钮选择VRM角色文件，或从资源库中选择。',
      icon: '👤',
      position: 'left'
    },
    {
      title: '添加道具',
      content: '切换到"道具"标签，可以添加GLB格式的道具模型到场景中。',
      icon: '📦',
      position: 'left'
    },
    {
      title: '设置场景',
      content: '选择视频、图片或GLB作为背景场景。',
      icon: '🎬',
      position: 'left'
    },
    {
      title: '编辑动画',
      content: '在底部时间轴添加动作片段，调整角色位置和摄像机。',
      icon: '⏱️',
      position: 'bottom'
    },
    {
      title: '导出作品',
      content: '完成后可以导出为视频、GIF或项目文件。',
      icon: '💾',
      position: 'center'
    }
  ]

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem('mmd-studio-guide-seen', 'true')
    setIsVisible(false)
    onComplete?.()
  }

  const handleSkip = () => {
    handleComplete()
  }

  if (!isVisible) return null

  const currentStep = steps[step]

  return (
    <div className={styles.overlay}>
      <div className={styles.guideContainer}>
        {/* 步骤指示器 */}
        <div className={styles.stepIndicator}>
          {steps.map((_, index) => (
            <div
              key={index}
              className={`${styles.stepDot} ${index === step ? styles.active : ''} ${index < step ? styles.completed : ''}`}
            />
          ))}
        </div>

        {/* 内容区 */}
        <div className={styles.content}>
          <div className={styles.icon}>{currentStep.icon}</div>
          <h2 className={styles.title}>{currentStep.title}</h2>
          <p className={styles.description}>{currentStep.content}</p>
        </div>

        {/* 按钮区 */}
        <div className={styles.buttons}>
          <button
            className={styles.skipButton}
            onClick={handleSkip}
          >
            跳过
          </button>
          
          <div className={styles.navButtons}>
            {step > 0 && (
              <button
                className={styles.prevButton}
                onClick={handlePrev}
              >
                ← 上一步
              </button>
            )}
            
            <button
              className={styles.nextButton}
              onClick={handleNext}
            >
              {step === steps.length - 1 ? '开始使用' : '下一步 →'}
            </button>
          </div>
        </div>

        {/* 步骤计数 */}
        <div className={styles.stepCount}>
          {step + 1} / {steps.length}
        </div>
      </div>
    </div>
  )
}

/**
 * 提示气泡组件
 */
export function Tooltip({ children, content, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div
      className={styles.tooltipWrapper}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`${styles.tooltip} ${styles[position]}`}>
          {content}
        </div>
      )}
    </div>
  )
}

/**
 * 首次使用提示
 */
export function FirstTimeTips() {
  const [tips, setTips] = useState([
    { id: 1, text: '💡 按 Ctrl+S 快速保存项目', shown: false },
    { id: 2, text: '💡 拖拽文件到窗口可直接导入', shown: false },
    { id: 3, text: '💡 右键点击片段可快速编辑', shown: false },
    { id: 4, text: '💡 使用滚轮缩放时间轴', shown: false },
  ])

  const [currentTip, setCurrentTip] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length)
    }, 10000)

    return () => clearInterval(interval)
  }, [tips.length])

  const handleClose = () => {
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className={styles.tipsContainer}>
      <div className={styles.tipContent}>
        {tips[currentTip].text}
      </div>
      <button className={styles.closeTip} onClick={handleClose}>×</button>
    </div>
  )
}
