import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useActions, useTimeline, useRecording, useCharacters } from '../hooks'
import { SharedActionPanel, RecordingControls } from './shared'
import ARSystem from './ARSystem'
import ARViewer from './ARViewer'

/**
 * 统一AR系统入口组件
 * 整合摄像头模式和AR模式，共享所有功能
 */
export const UnifiedARSystem = () => {
  // 当前模式状态
  const [mode, setMode] = useState('camera') // 'camera' | 'ar'
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showActionPanel, setShowActionPanel] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // 画布引用
  const canvasRef = useRef(null)
  
  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // 角色管理
  const {
    characters,
    selectedIndex,
    isLoading: isLoadingCharacter,
    loadCharacter,
    unloadCharacter,
    selectCharacter,
    getCurrentCharacter,
    getCurrentMixer,
    characterRefs,
    mixersRef
  } = useCharacters(3)
  
  // 动作系统
  const {
    actions,
    isLoadingActions,
    currentAction,
    isPlaying,
    favorites,
    recentActions,
    playAction,
    stopAction,
    toggleFavorite,
    isFavorite,
    getCategorizedActions,
    getFavoriteActions,
    getRecentActions,
    searchActions
  } = useActions(getCurrentCharacter(), getCurrentMixer())
  
  // 录制系统
  const {
    isRecording,
    recordingType,
    recordingProgress,
    startRecording,
    stopRecording,
    takeScreenshot
  } = useRecording(canvasRef)
  
  // 时间轴系统
  const {
    tracks,
    duration,
    currentTime,
    isPlaying: isTimelinePlaying,
    playbackSpeed,
    addTrack,
    removeTrack,
    moveTrack,
    clearTracks,
    startPlayback,
    pausePlayback,
    stopPlayback,
    seekTo,
    setSpeed
  } = useTimeline(actions, playAction)
  
  // 切换模式
  const switchMode = useCallback(async (newMode) => {
    if (newMode === mode || isTransitioning) return
    
    setIsTransitioning(true)
    
    try {
      // 保存当前状态
      const currentCharacter = getCurrentCharacter()
      
      // 切换模式
      setMode(newMode)
      
      // 如果已有角色，重新加载
      if (currentCharacter) {
        // 角色会在新模式中自动恢复
      }
    } catch (error) {
      console.error('切换模式失败:', error)
    } finally {
      setIsTransitioning(false)
    }
  }, [mode, isTransitioning, getCurrentCharacter])
  
  // 处理动作选择
  const handleActionSelect = useCallback((action) => {
    playAction(action.id)
    setShowActionPanel(false)
  }, [playAction])
  
  // 获取分类
  const categories = React.useMemo(() => {
    const cats = new Set()
    actions.forEach(a => {
      if (a.category) cats.add(a.category)
    })
    return Array.from(cats)
  }, [actions])
  
  // 渲染摄像头模式
  const renderCameraMode = () => {
    return (
      <ARSystem
        ref={canvasRef}
        unifiedMode={true}
        sharedActions={actions}
        sharedCharacters={characters}
        selectedCharacterIndex={selectedIndex}
        onCharacterSelect={selectCharacter}
        onActionExecute={playAction}
        onRecordingStart={startRecording}
        onRecordingStop={stopRecording}
        onScreenshot={takeScreenshot}
        isRecording={isRecording}
        recordingProgress={recordingProgress}
      />
    )
  }
  
  // 渲染AR模式
  const renderARMode = () => {
    // 获取当前选中角色的URL
    const currentChar = characters[selectedIndex]
    const vrmUrl = currentChar?.url || '/models/Katheryne.vrm'
    
    return (
      <ARViewer
        vrmUrl={vrmUrl}
        onClose={() => switchMode('camera')}
        onScreenshot={takeScreenshot}
        onRecord={(isRecording) => {
          if (isRecording) {
            startRecording('video', 5000)
          } else {
            stopRecording()
          }
        }}
        sharedActions={actions}
        onActionExecute={playAction}
      />
    )
  }
  
  // 模式选择器
  const ModeSelector = () => (
    <div style={{
      position: 'fixed',
      top: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      display: 'flex',
      gap: 10,
      background: 'rgba(0,0,0,0.7)',
      padding: '8px',
      borderRadius: '24px',
      backdropFilter: 'blur(10px)'
    }}>
      <button
        onClick={() => switchMode('camera')}
        style={{
          padding: '10px 20px',
          borderRadius: '20px',
          border: 'none',
          background: mode === 'camera' 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
            : 'transparent',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          transition: 'all 0.3s ease'
        }}
      >
        📷 摄像头模式
      </button>
      <button
        onClick={() => switchMode('ar')}
        style={{
          padding: '10px 20px',
          borderRadius: '20px',
          border: 'none',
          background: mode === 'ar' 
            ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)' 
            : 'transparent',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          transition: 'all 0.3s ease'
        }}
      >
        🥽 AR模式
      </button>
    </div>
  )
  
  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* 模式选择器 */}
      <ModeSelector />
      
      {/* 录制控制 - 右上角 */}
      <div style={{
        position: 'fixed',
        top: 80,
        right: 20,
        zIndex: 1000
      }}>
        <RecordingControls
          isRecording={isRecording}
          recordingProgress={recordingProgress}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onScreenshot={takeScreenshot}
          isMobile={isMobile}
        />
      </div>
      
      {/* 动作面板按钮 - 左下角 */}
      <button
        onClick={() => setShowActionPanel(!showActionPanel)}
        style={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          zIndex: 1000,
          padding: '12px 20px',
          background: showActionPanel 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
            : 'rgba(0,0,0,0.7)',
          border: 'none',
          borderRadius: '24px',
          color: 'white',
          fontSize: '14px',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        🎭 动作面板
      </button>
      
      {/* 动作面板 */}
      {showActionPanel && (
        <div style={{
          position: 'fixed',
          bottom: 80,
          left: 20,
          zIndex: 1000,
          width: isMobile ? 'calc(100vw - 40px)' : '400px',
          maxHeight: '70vh'
        }}>
          <SharedActionPanel
            actions={actions}
            categories={categories}
            currentAction={currentAction}
            favorites={favorites}
            onActionSelect={handleActionSelect}
            onFavoriteToggle={toggleFavorite}
            isLoading={isLoadingActions}
            isMobile={isMobile}
          />
        </div>
      )}
      
      {/* 模式内容 */}
      {mode === 'camera' ? renderCameraMode() : renderARMode()}
      
      {/* 过渡遮罩 */}
      {isTransitioning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '3px solid rgba(255,255,255,0.3)',
              borderTop: '3px solid #4ade80',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }} />
            <p>切换模式中...</p>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default UnifiedARSystem
