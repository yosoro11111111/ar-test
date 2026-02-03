import React, { useEffect, useCallback } from 'react'
import { useUIStore, resetUIAutoHide, stopUIAutoHide } from '../../stores/uiStore'
import './MainLayout.css'

export const MainLayout = ({ 
  children, 
  topBar,
  bottomBar,
  floatingControls,
  sidePanel,
  isMobile = false 
}) => {
  const { 
    isUIVisible, 
    toggleUI, 
    activePanel, 
    closePanel,
    isFullscreen 
  } = useUIStore()

  // 处理用户活动，重置自动隐藏计时器
  const handleUserActivity = useCallback(() => {
    resetUIAutoHide()
  }, [])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e) => {
      // H键 - 切换UI显示/隐藏
      if (e.key === 'h' || e.key === 'H') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault()
          toggleUI()
        }
      }
      
      // ESC键 - 关闭面板
      if (e.key === 'Escape') {
        if (activePanel) {
          closePanel()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleUI, activePanel, closePanel])

  // 自动隐藏UI
  useEffect(() => {
    if (!isMobile) {
      resetUIAutoHide()
      return () => stopUIAutoHide()
    }
  }, [isMobile])

  return (
    <div 
      className={`main-layout ${isFullscreen ? 'fullscreen' : ''} ${isMobile ? 'mobile' : 'desktop'}`}
      onMouseMove={!isMobile ? handleUserActivity : undefined}
      onClick={!isMobile ? handleUserActivity : undefined}
    >
      {/* 顶部栏 - 可自动隐藏 */}
      {topBar && (
        <header 
          className={`layout-topbar ${isUIVisible ? 'visible' : 'hidden'}`}
        >
          {topBar}
        </header>
      )}

      {/* 主内容区域 - 3D场景 */}
      <main className="layout-main">
        {children}
      </main>

      {/* 悬浮控制球 */}
      {floatingControls && (
        <div 
          className={`layout-floating ${isUIVisible ? 'visible' : 'hidden'}`}
        >
          {floatingControls}
        </div>
      )}

      {/* 底部栏 */}
      {bottomBar && (
        <footer 
          className={`layout-bottombar ${isUIVisible ? 'visible' : 'hidden'}`}
        >
          {bottomBar}
        </footer>
      )}

      {/* 侧边面板 */}
      {sidePanel && activePanel && (
        <aside className={`layout-sidepanel ${activePanel ? 'open' : ''}`}>
          {sidePanel}
        </aside>
      )}

      {/* 移动端菜单遮罩 */}
      {isMobile && activePanel && (
        <div 
          className="mobile-overlay"
          onClick={closePanel}
        />
      )}

      {/* UI隐藏提示 */}
      {!isUIVisible && !isMobile && (
        <div 
          className="ui-hidden-hint"
          onClick={toggleUI}
        >
          按 H 键显示UI
        </div>
      )}
    </div>
  )
}

export default MainLayout
