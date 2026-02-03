import React, { useState, useEffect } from 'react'
import './ButtonPanel.css'

export const ButtonPanel = ({
  onCharacterManager,
  onScreenshot,
  onStageEffects,
  onTimeline,
  onHelp,
  isMobile,
  onActionDrop
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // 从 localStorage 读取折叠状态
  useEffect(() => {
    const saved = localStorage.getItem('buttonPanelCollapsed')
    if (saved) {
      setIsCollapsed(saved === 'true')
    }
  }, [])

  // 保存折叠状态
  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('buttonPanelCollapsed', String(newState))
  }

  const buttons = [
    { id: 'character', icon: '👤', label: '人物管理', onClick: onCharacterManager },
    { id: 'screenshot', icon: '📷', label: '截图', onClick: onScreenshot },
    { id: 'effects', icon: '✨', label: '特效', onClick: onStageEffects },
    { id: 'timeline', icon: '⏱️', label: '时间轴', onClick: onTimeline, isDropTarget: true },
    { id: 'help', icon: '❓', label: '帮助', onClick: onHelp },
  ]

  const handleDragOver = (e, btn) => {
    if (btn.isDropTarget) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
      setIsDragOver(true)
    }
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e, btn) => {
    if (btn.isDropTarget) {
      e.preventDefault()
      setIsDragOver(false)
      const actionData = e.dataTransfer.getData('action')
      if (actionData) {
        const action = JSON.parse(actionData)
        onActionDrop?.(action)
      }
    }
  }

  // 移动端折叠状态
  if (isMobile && isCollapsed) {
    return (
      <button 
        className="panel-expand-btn mobile"
        onClick={toggleCollapse}
        title="展开菜单"
      >
        ▲
      </button>
    )
  }

  // 桌面端折叠状态
  if (!isMobile && isCollapsed) {
    return (
      <button 
        className="panel-expand-btn desktop"
        onClick={toggleCollapse}
        title="展开菜单"
      >
        ◀
      </button>
    )
  }

  if (isMobile) {
    return (
      <div className="button-panel-mobile">
        <button 
          className="panel-collapse-btn mobile"
          onClick={toggleCollapse}
          title="收起菜单"
        >
          ▼
        </button>
        {buttons.map((btn) => (
          <button
            key={btn.id}
            className={`panel-btn-mobile ${btn.isDropTarget ? 'drop-target' : ''} ${btn.isDropTarget && isDragOver ? 'drag-over' : ''}`}
            onClick={btn.onClick}
            onDragOver={(e) => handleDragOver(e, btn)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, btn)}
          >
            <span className="btn-icon">{btn.icon}</span>
            <span className="btn-label">{btn.label}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="button-panel">
      <button 
        className="panel-collapse-btn desktop"
        onClick={toggleCollapse}
        title="收起菜单"
      >
        ▶
      </button>
      {buttons.map((btn) => (
        <button
          key={btn.id}
          className={`panel-btn ${btn.isDropTarget ? 'drop-target' : ''} ${btn.isDropTarget && isDragOver ? 'drag-over' : ''}`}
          onClick={btn.onClick}
          title={btn.isDropTarget ? `${btn.label} (可拖放动作)` : btn.label}
          onDragOver={(e) => handleDragOver(e, btn)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, btn)}
        >
          <span className="btn-icon">{btn.icon}</span>
          <span className="btn-label">{btn.label}</span>
          {btn.isDropTarget && <span className="drop-hint">拖放</span>}
        </button>
      ))}
    </div>
  )
}

export default ButtonPanel
