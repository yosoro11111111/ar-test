import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ARScene } from './components/ARSystem'
import LoadingScreen from './components/LoadingScreen'
import { MainLayout } from './components/layout/MainLayout'
import { FloatingControlBall } from './components/layout/FloatingControlBall'
import { MobileBottomNav } from './components/layout/MobileBottomNav'
import { ActionPanel } from './components/features/actions/ActionPanel'
import { CharacterSelector } from './components/features/characters/CharacterSelector'
import { TimelineEditor } from './components/features/timeline/TimelineEditor'
import { useUIStore } from './stores/uiStore'
import { useActionStore } from './stores/actionStore'
import { useShortcut } from './hooks/useShortcut'
import { ShortcutHelp } from './components/ui/ShortcutHelp'
import { getAllVRMActions } from './data/vrmaActions'
import './App.css'
import './styles/anime-theme.css'

// ==================== 移动端检测 Hook ====================
const useMobileDetect = () => {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])
  
  return { isMobile, isTablet: false, isDesktop: !isMobile }
}

// ==================== 主应用组件 ====================
function AppNew() {
  const { isMobile } = useMobileDetect()
  const { activePanel, setActivePanel, closePanel } = useUIStore()
  const { 
    currentAction, 
    setCurrentAction,
    favorites,
    addRecentAction,
    recordActionUsage
  } = useActionStore()
  
  // 状态
  const [showSplash, setShowSplash] = useState(true)
  const [showHelp, setShowHelp] = useState(false)
  const [actions, setActions] = useState([])
  const [characters, setCharacters] = useState([])
  const [currentCharacter, setCurrentCharacter] = useState(null)
  
  // 加载动作数据
  useEffect(() => {
    const loadActions = async () => {
      const actionList = await getAllVRMActions()
      setActions(actionList)
    }
    loadActions()
  }, [])
  
  // 快捷键处理函数
  const handlePrevAction = useCallback(() => {
    const currentIndex = actions.findIndex(a => a.id === currentAction?.id)
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : actions.length - 1
    if (actions[prevIndex]) {
      handleSelectAction(actions[prevIndex])
    }
  }, [actions, currentAction])
  
  const handleNextAction = useCallback(() => {
    const currentIndex = actions.findIndex(a => a.id === currentAction?.id)
    const nextIndex = currentIndex < actions.length - 1 ? currentIndex + 1 : 0
    if (actions[nextIndex]) {
      handleSelectAction(actions[nextIndex])
    }
  }, [actions, currentAction])
  
  const handleRandomAction = useCallback(() => {
    if (actions.length > 0) {
      const randomAction = actions[Math.floor(Math.random() * actions.length)]
      handleSelectAction(randomAction)
    }
  }, [actions])
  
  const handleScreenshot = useCallback(() => {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      const link = document.createElement('a')
      link.download = `ar-character-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
  }, [])
  
  // 动作选择
  const handleSelectAction = useCallback((action) => {
    setCurrentAction(action)
    addRecentAction(action)
    recordActionUsage(action.id)
    
    // 触发AR场景中的动作
    if (window.executeARAction) {
      window.executeARAction(action)
    }
  }, [setCurrentAction, addRecentAction, recordActionUsage])
  
  // 角色选择
  const handleSelectCharacter = useCallback((character) => {
    setCurrentCharacter(character)
  }, [])
  
  // 注册快捷键
  useShortcut({
    onPrevAction: handlePrevAction,
    onNextAction: handleNextAction,
    onRandomAction: handleRandomAction,
    onScreenshot: handleScreenshot,
    favorites: favorites.slice(0, 9),
  })
  
  // 渲染顶部栏
  const renderTopBar = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 20px',
      height: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '20px' }}>🌸</span>
        <span style={{ fontWeight: 700, fontSize: '16px' }}>AR角色展示</span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          onClick={() => setShowHelp(true)}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          ⌨️ 快捷键
        </button>
      </div>
    </div>
  )
  
  // 渲染底部栏（桌面端）
  const renderBottomBar = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px',
      height: '100%'
    }}>
      <CharacterSelector
        characters={characters}
        currentCharacter={currentCharacter}
        onSelectCharacter={handleSelectCharacter}
        isMobile={isMobile}
      />
    </div>
  )
  
  // 渲染悬浮控制球
  const renderFloatingControls = () => (
    <FloatingControlBall
      onPrevAction={handlePrevAction}
      onNextAction={handleNextAction}
      onExpressionClick={() => setActivePanel('expressions')}
      onPoseClick={() => setActivePanel('poses')}
      onScreenshot={handleScreenshot}
      onSettingsClick={() => setActivePanel('settings')}
      isMobile={isMobile}
    />
  )
  
  // 渲染侧边面板
  const renderSidePanel = () => {
    switch (activePanel) {
      case 'actions':
        return (
          <ActionPanel
            actions={actions}
            onActionSelect={handleSelectAction}
            isMobile={isMobile}
          />
        )
      case 'timeline':
        return (
          <TimelineEditor
            actions={actions}
          />
        )
      default:
        return null
    }
  }
  
  // 如果还在加载画面
  if (showSplash) {
    return <LoadingScreen onComplete={() => setShowSplash(false)} isMobile={isMobile} />
  }
  
  return (
    <>
      <MainLayout
        topBar={!isMobile && renderTopBar()}
        bottomBar={!isMobile && renderBottomBar()}
        floatingControls={!isMobile && renderFloatingControls()}
        sidePanel={renderSidePanel()}
        isMobile={isMobile}
      >
        {/* 3D场景 */}
        <ARScene
          currentAction={currentAction}
          currentCharacter={currentCharacter}
        />
        
        {/* 移动端底部导航 */}
        {isMobile && <MobileBottomNav />}
        
        {/* 移动端悬浮控制球 */}
        {isMobile && (
          <div style={{
            position: 'absolute',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 90
          }}>
            {renderFloatingControls()}
          </div>
        )}
      </MainLayout>
      
      {/* 快捷键帮助 */}
      <ShortcutHelp isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </>
  )
}

export default AppNew
