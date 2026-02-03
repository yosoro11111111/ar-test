import { useEffect, useCallback } from 'react'
import { useUIStore } from '../stores/uiStore'
import { useActionStore } from '../stores/actionStore'

export const useShortcut = ({
  onPrevAction,
  onNextAction,
  onRandomAction,
  onScreenshot,
  onSaveProject,
  onExportVideo,
  onToggleExpression,
  onTogglePose,
  favorites = [],
  expressions = [],
  characters = []
}) => {
  const {
    isPlaying,
    togglePlay,
    playbackSpeed,
    increaseSpeed,
    decreaseSpeed,
    isLooping,
    toggleLoop,
    currentAction,
    setCurrentAction
  } = useActionStore()
  
  const {
    toggleUI,
    activePanel,
    setActivePanel,
    closePanel,
    toggleFullscreen
  } = useUIStore()

  const handleKeyDown = useCallback((e) => {
    // 忽略输入框中的快捷键
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      if (e.key === 'Escape' && activePanel) {
        closePanel()
      }
      return
    }

    const key = e.key.toLowerCase()
    const isCtrl = e.ctrlKey || e.metaKey
    const isShift = e.shiftKey

    // 空格 - 播放/暂停
    if (e.code === 'Space') {
      e.preventDefault()
      togglePlay()
      return
    }

    // 方向键
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      onPrevAction?.()
      return
    }
    
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      onNextAction?.()
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      increaseSpeed()
      return
    }
    
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      decreaseSpeed()
      return
    }

    // R - 随机动作
    if (key === 'r' && !isCtrl && !isShift) {
      e.preventDefault()
      onRandomAction?.()
      return
    }

    // L - 循环播放
    if (key === 'l' && !isCtrl && !isShift) {
      e.preventDefault()
      toggleLoop()
      return
    }

    // 1-9 - 收藏动作
    if (/^[1-9]$/.test(e.key) && !isCtrl && !isShift) {
      e.preventDefault()
      const index = parseInt(e.key) - 1
      if (favorites[index]) {
        setCurrentAction(favorites[index])
      }
      return
    }

    // F - 全屏
    if (key === 'f' && !isCtrl && !isShift) {
      e.preventDefault()
      toggleFullscreen()
      return
    }

    // S - 截图
    if (key === 's' && !isCtrl && !isShift) {
      e.preventDefault()
      onScreenshot?.()
      return
    }

    // H - 隐藏UI
    if (key === 'h' && !isCtrl && !isShift) {
      e.preventDefault()
      toggleUI()
      return
    }

    // A - 动作面板
    if (key === 'a' && !isCtrl && !isShift) {
      e.preventDefault()
      if (activePanel === 'actions') {
        closePanel()
      } else {
        setActivePanel('actions')
      }
      return
    }

    // T - 时间轴
    if (key === 't' && !isCtrl && !isShift) {
      e.preventDefault()
      if (activePanel === 'timeline') {
        closePanel()
      } else {
        setActivePanel('timeline')
      }
      return
    }

    // ESC - 关闭面板
    if (e.key === 'Escape') {
      if (activePanel) {
        e.preventDefault()
        closePanel()
      }
      return
    }

    // Ctrl+S - 保存
    if (key === 's' && isCtrl && !isShift) {
      e.preventDefault()
      onSaveProject?.()
      return
    }

    // Ctrl+E - 导出
    if (key === 'e' && isCtrl && !isShift) {
      e.preventDefault()
      onExportVideo?.()
      return
    }
  }, [
    isPlaying, togglePlay, playbackSpeed, increaseSpeed, decreaseSpeed,
    isLooping, toggleLoop, currentAction, setCurrentAction,
    toggleUI, activePanel, setActivePanel, closePanel, toggleFullscreen,
    onPrevAction, onNextAction, onRandomAction, onScreenshot,
    onSaveProject, onExportVideo, favorites
  ])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export default useShortcut
