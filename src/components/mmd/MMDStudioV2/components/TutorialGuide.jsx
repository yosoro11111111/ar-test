import React, { useState, useEffect } from 'react'
import styles from './TutorialGuide.module.css'

/**
 * 引导介绍系统
 * 
 * 功能：
 * - 首次使用引导
 * - 分步骤介绍界面功能
 * - 高亮显示重要元素
 * - 可跳过和重新播放
 */

const tutorialSteps = [
  {
    id: 'welcome',
    title: '欢迎使用 MMD Studio V2',
    content: '这是一款专业的MMD动画制作工具。让我们花几分钟时间了解如何使用它。',
    target: null,
    position: 'center'
  },
  {
    id: 'topbar',
    title: '顶部工具栏',
    content: '这里是主要的操作区域。您可以新建项目、保存、导出视频，以及访问各种设置。',
    target: '.topBar',
    position: 'bottom'
  },
  {
    id: 'leftpanel',
    title: '资源面板',
    content: '在这里您可以浏览和管理所有资源：角色模型、道具、场景、动作和音乐。拖放资源到时间轴即可使用。',
    target: '.leftPanel',
    position: 'right'
  },
  {
    id: 'centerpanel',
    title: '3D 预览区',
    content: '这是主要的编辑和预览区域。您可以旋转、缩放、平移视角来查看场景。',
    target: '.centerPanel',
    position: 'left'
  },
  {
    id: 'rightpanel',
    title: '属性面板',
    content: '选中对象后，在这里可以调整位置、旋转、缩放等属性。道具还可以绑定到角色的骨骼上。',
    target: '.rightPanel',
    position: 'left'
  },
  {
    id: 'timeline',
    title: '时间轴',
    content: '这是动画制作的核心。拖放动作、场景、道具到时间轴，调整它们的开始和结束时间。点击播放按钮预览动画。',
    target: '.timelinePanel',
    position: 'top'
  },
  {
    id: 'character',
    title: '添加角色',
    content: '从左侧面板拖放角色模型到场景，然后拖放动作到角色的动作轨道。',
    target: null,
    position: 'center'
  },
  {
    id: 'prop-binding',
    title: '道具绑定',
    content: '道具可以绑定到角色的骨骼上！例如，将眼镜绑定到头部骨骼，这样角色做动作时眼镜会跟随移动。',
    target: null,
    position: 'center'
  },
  {
    id: 'scene',
    title: '场景设置',
    content: '支持纯色、图片、视频和3D场景。拖放场景资源到场景轨道即可切换背景。',
    target: null,
    position: 'center'
  },
  {
    id: 'export',
    title: '导出作品',
    content: '完成制作后，点击顶部工具栏的导出按钮，可以将作品导出为视频文件。',
    target: null,
    position: 'center'
  },
  {
    id: 'complete',
    title: '开始创作吧！',
    content: '现在您已经了解了基本操作。开始创建您的第一个MMD动画吧！',
    target: null,
    position: 'center'
  }
]

export function TutorialGuide({ onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [highlightBox, setHighlightBox] = useState(null)

  const step = tutorialSteps[currentStep]

  useEffect(() => {
    // 计算高亮区域
    if (step.target) {
      const element = document.querySelector(step.target)
      if (element) {
        const rect = element.getBoundingClientRect()
        setHighlightBox({
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16
        })
      }
    } else {
      setHighlightBox(null)
    }
  }, [currentStep, step.target])

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    setIsVisible(false)
    localStorage.setItem('mmdstudio-tutorial-completed', 'true')
    onSkip?.()
  }

  const handleComplete = () => {
    setIsVisible(false)
    localStorage.setItem('mmdstudio-tutorial-completed', 'true')
    onComplete?.()
  }

  if (!isVisible) return null

  // 计算提示框位置
  const getTooltipPosition = () => {
    if (!step.target || !highlightBox) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }
    }

    const tooltipWidth = 360
    const tooltipHeight = 200
    const gap = 20

    switch (step.position) {
      case 'bottom':
        return {
          top: highlightBox.top + highlightBox.height + gap,
          left: highlightBox.left + highlightBox.width / 2 - tooltipWidth / 2
        }
      case 'top':
        return {
          top: highlightBox.top - tooltipHeight - gap,
          left: highlightBox.left + highlightBox.width / 2 - tooltipWidth / 2
        }
      case 'left':
        return {
          top: highlightBox.top + highlightBox.height / 2 - tooltipHeight / 2,
          left: highlightBox.left - tooltipWidth - gap
        }
      case 'right':
        return {
          top: highlightBox.top + highlightBox.height / 2 - tooltipHeight / 2,
          left: highlightBox.left + highlightBox.width + gap
        }
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }
    }
  }

  const tooltipStyle = getTooltipPosition()

  return (
    <div className={styles.overlay}>
      {/* 遮罩层 */}
      <div className={styles.backdrop} />
      
      {/* 高亮框 */}
      {highlightBox && (
        <div
          className={styles.highlight}
          style={{
            top: highlightBox.top,
            left: highlightBox.left,
            width: highlightBox.width,
            height: highlightBox.height
          }}
        />
      )}

      {/* 提示框 */}
      <div
        className={`${styles.tooltip} ${styles[step.position]}`}
        style={tooltipStyle}
      >
        {/* 步骤指示器 */}
        <div className={styles.stepIndicator}>
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              className={`${styles.stepDot} ${index === currentStep ? styles.active : ''} ${index < currentStep ? styles.completed : ''}`}
            />
          ))}
        </div>

        {/* 标题 */}
        <h3 className={styles.title}>{step.title}</h3>

        {/* 内容 */}
        <p className={styles.content}>{step.content}</p>

        {/* 按钮组 */}
        <div className={styles.buttons}>
          <button
            className={styles.skipBtn}
            onClick={handleSkip}
          >
            跳过
          </button>
          
          <div className={styles.navButtons}>
            {currentStep > 0 && (
              <button
                className={styles.prevBtn}
                onClick={handlePrev}
              >
                上一步
              </button>
            )}
            <button
              className={styles.nextBtn}
              onClick={handleNext}
            >
              {currentStep === tutorialSteps.length - 1 ? '完成' : '下一步'}
            </button>
          </div>
        </div>

        {/* 步骤计数 */}
        <div className={styles.stepCount}>
          {currentStep + 1} / {tutorialSteps.length}
        </div>
      </div>
    </div>
  )
}

/**
 * 检查是否需要显示引导
 */
export function shouldShowTutorial() {
  return localStorage.getItem('mmdstudio-tutorial-completed') !== 'true'
}

/**
 * 重置引导状态（用于测试）
 */
export function resetTutorial() {
  localStorage.removeItem('mmdstudio-tutorial-completed')
}
