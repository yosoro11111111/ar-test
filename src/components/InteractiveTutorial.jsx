// 交互式教学组件 - 进入游戏即教
import React, { useState, useEffect, useCallback } from 'react'
import { GESTURE_TYPES, DEVICE_TYPES } from '../hooks/useUnifiedInteraction'

// 教学步骤配置
const TUTORIAL_STEPS = {
  welcome: {
    id: 'welcome',
    title: '欢迎来到AR角色展示！',
    description: '我们将教你如何使用这个应用',
    icon: '👋',
    duration: 0,
    skippable: true
  },
  
  // 基础交互教学
  basicTap: {
    id: 'basicTap',
    title: '选中角色',
    description: '单击角色可以选中它',
    icon: '👆',
    gesture: GESTURE_TYPES.TAP,
    demoAnimation: 'tap',
    mobileHint: '单指点击角色',
    desktopHint: '左键点击角色',
    duration: 5000,
    practice: true
  },
  
  basicDoubleTap: {
    id: 'basicDoubleTap',
    title: '重置视角',
    description: '双击可以重置角色位置和视角',
    icon: '👆👆',
    gesture: GESTURE_TYPES.DOUBLE_TAP,
    demoAnimation: 'doubleTap',
    mobileHint: '快速双击角色',
    desktopHint: '快速双击左键',
    duration: 5000,
    practice: true
  },
  
  basicLongPress: {
    id: 'basicLongPress',
    title: '打开菜单',
    description: '长按可以打开动作菜单',
    icon: '✋',
    gesture: GESTURE_TYPES.LONG_PRESS,
    demoAnimation: 'longPress',
    mobileHint: '按住角色500ms',
    desktopHint: '右键按住500ms',
    duration: 6000,
    practice: true
  },
  
  basicDrag: {
    id: 'basicDrag',
    title: '移动角色',
    description: '拖拽可以移动角色位置',
    icon: '🖐️',
    gesture: GESTURE_TYPES.DRAG,
    demoAnimation: 'drag',
    mobileHint: '按住并滑动',
    desktopHint: '左键按住并拖动',
    duration: 6000,
    practice: true
  },
  
  basicPinch: {
    id: 'basicPinch',
    title: '缩放角色',
    description: '捏合可以缩放角色大小',
    icon: '🤏',
    gesture: GESTURE_TYPES.PINCH,
    demoAnimation: 'pinch',
    mobileHint: '双指捏合/展开',
    desktopHint: 'Alt+滚轮缩放',
    duration: 6000,
    practice: true
  },
  
  // 模式切换教学
  modeBrowse: {
    id: 'modeBrowse',
    title: '浏览模式',
    description: '观看角色、播放动作、拍照录像',
    icon: '👁️',
    highlightElement: '.mode-browse-btn',
    duration: 4000
  },
  
  modeEdit: {
    id: 'modeEdit',
    title: '编辑模式',
    description: '调整位置、骨骼编辑、姿势调整',
    icon: '✏️',
    highlightElement: '.mode-edit-btn',
    duration: 4000
  },
  
  modeAR: {
    id: 'modeAR',
    title: 'AR模式',
    description: '将角色放入现实场景',
    icon: '📷',
    highlightElement: '.mode-ar-btn',
    duration: 4000
  },
  
  // 功能教学
  actionPanel: {
    id: 'actionPanel',
    title: '动作面板',
    description: '点击底部动作按钮播放动画',
    icon: '🎭',
    highlightElement: '.action-panel',
    duration: 5000,
    practice: true
  },
  
  toolbar: {
    id: 'toolbar',
    title: '工具栏',
    description: '右侧工具栏可以快速切换功能',
    icon: '🛠️',
    highlightElement: '.toolbar',
    duration: 4000
  },
  
  camera: {
    id: 'camera',
    title: '拍照录像',
    description: '点击相机按钮拍照或录像',
    icon: '📸',
    highlightElement: '.camera-btn',
    duration: 4000,
    practice: true
  },
  
  complete: {
    id: 'complete',
    title: '恭喜完成教程！',
    description: '你已经学会了所有基础操作，开始探索吧！',
    icon: '🎉',
    duration: 0,
    skippable: true
  }
}

// 教学流程
const TUTORIAL_FLOW = [
  'welcome',
  'basicTap',
  'basicDoubleTap',
  'basicLongPress',
  'basicDrag',
  'basicPinch',
  'modeBrowse',
  'modeEdit',
  'modeAR',
  'actionPanel',
  'toolbar',
  'camera',
  'complete'
]

// 手势演示动画组件
const GestureDemo = ({ type, deviceType }) => {
  const getDemoContent = () => {
    const isMobile = deviceType === DEVICE_TYPES.TOUCH
    
    switch (type) {
      case GESTURE_TYPES.TAP:
        return (
          <div className="gesture-demo tap-demo">
            <div className="demo-hand">
              {isMobile ? '👆' : '🖱️'}
            </div>
            <div className="demo-target">👤</div>
            <div className="demo-ripple" />
          </div>
        )
      case GESTURE_TYPES.DOUBLE_TAP:
        return (
          <div className="gesture-demo double-tap-demo">
            <div className="demo-hand">
              {isMobile ? '👆' : '🖱️'}
            </div>
            <div className="demo-target">👤</div>
            <div className="demo-ripple ripple-1" />
            <div className="demo-ripple ripple-2" />
          </div>
        )
      case GESTURE_TYPES.LONG_PRESS:
        return (
          <div className="gesture-demo long-press-demo">
            <div className="demo-hand pressing">
              {isMobile ? '✋' : '🖱️'}
            </div>
            <div className="demo-target">👤</div>
            <div className="demo-progress-ring">
              <div className="progress-fill" />
            </div>
          </div>
        )
      case GESTURE_TYPES.DRAG:
        return (
          <div className="gesture-demo drag-demo">
            <div className="demo-hand dragging">
              {isMobile ? '🖐️' : '🖱️'}
            </div>
            <div className="demo-target">👤</div>
            <div className="demo-path" />
          </div>
        )
      case GESTURE_TYPES.PINCH:
        return (
          <div className="gesture-demo pinch-demo">
            {isMobile ? (
              <>
                <div className="demo-hand left">👆</div>
                <div className="demo-hand right">👆</div>
                <div className="demo-target">👤</div>
              </>
            ) : (
              <>
                <div className="demo-key">Alt</div>
                <div className="demo-mouse">🖱️</div>
                <div className="demo-target">👤</div>
              </>
            )}
          </div>
        )
      default:
        return null
    }
  }
  
  return (
    <div className="gesture-demo-container">
      {getDemoContent()}
    </div>
  )
}

// 高亮遮罩组件
const HighlightOverlay = ({ target, onClick }) => {
  const [rect, setRect] = useState(null)
  
  useEffect(() => {
    if (target) {
      const element = document.querySelector(target)
      if (element) {
        const rect = element.getBoundingClientRect()
        setRect(rect)
      }
    }
  }, [target])
  
  if (!rect) return null
  
  return (
    <div className="highlight-overlay" onClick={onClick}>
      <div className="overlay-background" />
      <div 
        className="highlight-box"
        style={{
          left: rect.left - 8,
          top: rect.top - 8,
          width: rect.width + 16,
          height: rect.height + 16
        }}
      >
        <div className="highlight-border" />
      </div>
    </div>
  )
}

// 主要教学组件
export const InteractiveTutorial = ({ 
  isOpen, 
  onComplete, 
  onSkip,
  deviceType = DEVICE_TYPES.TOUCH 
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isPracticing, setIsPracticing] = useState(false)
  const [practiceCompleted, setPracticeCompleted] = useState(false)
  const [showHint, setShowHint] = useState(false)
  
  const currentStepId = TUTORIAL_FLOW[currentStepIndex]
  const currentStep = TUTORIAL_STEPS[currentStepId]
  
  // 下一步
  const handleNext = useCallback(() => {
    if (currentStepIndex < TUTORIAL_FLOW.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
      setIsPracticing(false)
      setPracticeCompleted(false)
      setShowHint(false)
    } else {
      onComplete?.()
    }
  }, [currentStepIndex, onComplete])
  
  // 上一步
  const handlePrev = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
      setIsPracticing(false)
      setPracticeCompleted(false)
      setShowHint(false)
    }
  }, [currentStepIndex])
  
  // 跳过
  const handleSkip = useCallback(() => {
    onSkip?.()
  }, [onSkip])
  
  // 开始练习
  const handleStartPractice = useCallback(() => {
    setIsPracticing(true)
    setShowHint(true)
  }, [])
  
  // 完成练习
  const handlePracticeComplete = useCallback(() => {
    setPracticeCompleted(true)
    setIsPracticing(false)
  }, [])
  
  // 自动下一步（非练习步骤）
  useEffect(() => {
    if (!currentStep.practice && currentStep.duration > 0) {
      const timer = setTimeout(handleNext, currentStep.duration)
      return () => clearTimeout(timer)
    }
  }, [currentStep, handleNext])
  
  if (!isOpen) return null
  
  const isMobile = deviceType === DEVICE_TYPES.TOUCH
  
  return (
    <div className="interactive-tutorial">
      {/* 高亮遮罩 */}
      {currentStep.highlightElement && (
        <HighlightOverlay 
          target={currentStep.highlightElement}
          onClick={handleNext}
        />
      )}
      
      {/* 教学内容卡片 */}
      <div className={`tutorial-card ${currentStep.highlightElement ? 'floating' : ''}`}>
        {/* 进度条 */}
        <div className="tutorial-progress">
          <div 
            className="progress-bar"
            style={{ width: `${((currentStepIndex + 1) / TUTORIAL_FLOW.length) * 100}%` }}
          />
          <span className="progress-text">
            {currentStepIndex + 1} / {TUTORIAL_FLOW.length}
          </span>
        </div>
        
        {/* 图标 */}
        <div className="tutorial-icon">{currentStep.icon}</div>
        
        {/* 标题 */}
        <h3 className="tutorial-title">{currentStep.title}</h3>
        
        {/* 描述 */}
        <p className="tutorial-description">{currentStep.description}</p>
        
        {/* 手势演示 */}
        {currentStep.gesture && (
          <GestureDemo type={currentStep.gesture} deviceType={deviceType} />
        )}
        
        {/* 设备提示 */}
        {showHint && (
          <div className="device-hint">
            <div className="hint-label">
              {isMobile ? '📱 移动端' : '💻 桌面端'}
            </div>
            <div className="hint-text">
              {isMobile ? currentStep.mobileHint : currentStep.desktopHint}
            </div>
          </div>
        )}
        
        {/* 练习状态 */}
        {isPracticing && (
          <div className="practice-area">
            <div className="practice-text">
              请尝试操作...
            </div>
            <button 
              className="btn-skip-practice"
              onClick={handlePracticeComplete}
            >
              跳过练习
            </button>
          </div>
        )}
        
        {practiceCompleted && (
          <div className="practice-complete">
            ✅ 练习完成！
          </div>
        )}
        
        {/* 按钮组 */}
        <div className="tutorial-buttons">
          {/* 跳过按钮 */}
          {currentStep.skippable && (
            <button 
              className="btn-skip"
              onClick={handleSkip}
            >
              跳过教程
            </button>
          )}
          
          {/* 上一步按钮 */}
          {currentStepIndex > 0 && (
            <button 
              className="btn-prev"
              onClick={handlePrev}
            >
              上一步
            </button>
          )}
          
          {/* 练习/下一步按钮 */}
          {currentStep.practice && !isPracticing && !practiceCompleted ? (
            <button 
              className="btn-practice"
              onClick={handleStartPractice}
            >
              开始练习
            </button>
          ) : (
            <button 
              className="btn-next"
              onClick={handleNext}
              disabled={currentStep.practice && !practiceCompleted}
            >
              {currentStepIndex === TUTORIAL_FLOW.length - 1 ? '完成' : '下一步'}
            </button>
          )}
        </div>
      </div>
      
      {/* 底部手势提示 */}
      {currentStep.gesture && (
        <div className="gesture-hint-bar">
          <div className="hint-item">
            <span className="hint-icon">
              {isMobile ? '👆' : '🖱️'}
            </span>
            <span className="hint-label">单击选中</span>
          </div>
          <div className="hint-item">
            <span className="hint-icon">
              {isMobile ? '👆👆' : '🖱️🖱️'}
            </span>
            <span className="hint-label">双击重置</span>
          </div>
          <div className="hint-item">
            <span className="hint-icon">
              {isMobile ? '✋' : '🖱️'}
            </span>
            <span className="hint-label">长按菜单</span>
          </div>
          <div className="hint-item">
            <span className="hint-icon">
              {isMobile ? '🖐️' : '🖱️'}
            </span>
            <span className="hint-label">拖拽移动</span>
          </div>
          <div className="hint-item">
            <span className="hint-icon">
              {isMobile ? '🤏' : '⚙️'}
            </span>
            <span className="hint-label">缩放大小</span>
          </div>
        </div>
      )}
    </div>
  )
}

// 快速提示组件
export const QuickHint = ({ 
  gesture, 
  message, 
  duration = 2000,
  onClose 
}) => {
  const [visible, setVisible] = useState(true)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onClose?.()
    }, duration)
    
    return () => clearTimeout(timer)
  }, [duration, onClose])
  
  if (!visible) return null
  
  const gestureIcons = {
    [GESTURE_TYPES.TAP]: '👆',
    [GESTURE_TYPES.DOUBLE_TAP]: '👆👆',
    [GESTURE_TYPES.LONG_PRESS]: '✋',
    [GESTURE_TYPES.DRAG]: '🖐️',
    [GESTURE_TYPES.PINCH]: '🤏'
  }
  
  return (
    <div className="quick-hint">
      <div className="hint-icon">{gestureIcons[gesture]}</div>
      <div className="hint-message">{message}</div>
    </div>
  )
}

// 手势提示条组件
export const GestureHintBar = ({ visible = true }) => {
  if (!visible) return null
  
  return (
    <div className="gesture-hint-bar fixed">
      <div className="hint-item">
        <span className="hint-icon">👆</span>
        <span className="hint-label">单击选中</span>
      </div>
      <div className="hint-item">
        <span className="hint-icon">👆👆</span>
        <span className="hint-label">双击重置</span>
      </div>
      <div className="hint-item">
        <span className="hint-icon">✋</span>
        <span className="hint-label">长按菜单</span>
      </div>
      <div className="hint-item">
        <span className="hint-icon">🖐️</span>
        <span className="hint-label">拖拽移动</span>
      </div>
      <div className="hint-item">
        <span className="hint-icon">🤏</span>
        <span className="hint-label">缩放大小</span>
      </div>
    </div>
  )
}

// 长按进度指示器组件
export const LongPressIndicator = ({ 
  progress, 
  x, 
  y, 
  visible 
}) => {
  if (!visible) return null
  
  return (
    <div 
      className="long-press-indicator"
      style={{ left: x, top: y }}
    >
      <div className="progress-ring">
        <svg viewBox="0 0 36 36">
          <path
            className="progress-bg"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="progress-fill"
            strokeDasharray={`${progress}, 100`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="progress-icon">✋</div>
      </div>
    </div>
  )
}

// 导出默认对象
export default {
  InteractiveTutorial,
  QuickHint,
  GestureHintBar,
  LongPressIndicator,
  TUTORIAL_STEPS,
  TUTORIAL_FLOW
}
