import React from 'react'
import { HapticFeedback } from '../../utils/hapticFeedback'

/**
 * 模式切换组件
 * 在摄像头模式和AR模式之间切换
 */
export const ModeSwitcher = ({ 
  currentMode, 
  onSwitchMode, 
  arSupported = true,
  isLoading = false 
}) => {
  const handleSwitch = (mode) => {
    if (mode === currentMode || isLoading) return
    
    HapticFeedback.modeSwitch()
    onSwitchMode(mode)
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      gap: '8px',
      background: 'rgba(0,0,0,0.6)',
      padding: '6px',
      borderRadius: '12px',
      backdropFilter: 'blur(10px)'
    }}>
      {/* 摄像头模式按钮 */}
      <button
        onClick={() => handleSwitch('camera')}
        disabled={isLoading}
        style={{
          padding: '10px 16px',
          background: currentMode === 'camera' 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
            : 'transparent',
          border: 'none',
          borderRadius: '8px',
          color: 'white',
          fontSize: '13px',
          fontWeight: 600,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.6 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s'
        }}
      >
        <span>📷</span>
        <span>摄像头</span>
      </button>

      {/* AR模式按钮 */}
      <button
        onClick={() => handleSwitch('ar')}
        disabled={isLoading || !arSupported}
        style={{
          padding: '10px 16px',
          background: currentMode === 'ar' 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
            : 'transparent',
          border: 'none',
          borderRadius: '8px',
          color: 'white',
          fontSize: '13px',
          fontWeight: 600,
          cursor: (isLoading || !arSupported) ? 'not-allowed' : 'pointer',
          opacity: (isLoading || !arSupported) ? 0.6 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s',
          position: 'relative'
        }}
      >
        <span>🥽</span>
        <span>AR模式</span>
        
        {/* AR不支持提示 */}
        {!arSupported && (
          <span style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: '#ff4757',
            color: 'white',
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '10px',
            whiteSpace: 'nowrap'
          }}>
            不支持
          </span>
        )}
      </button>

      {/* 加载指示器 */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '20px',
          height: '20px',
          border: '2px solid rgba(255,255,255,0.3)',
          borderTopColor: 'white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      )}

      <style>{`
        @keyframes spin {
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default ModeSwitcher
