// 右侧工具栏组件
import React from 'react'

const Toolbar = ({
  isMobile,
  onScreenshot,
  onToggleVideoRecorder,
  onToggleRandomMode,
  onToggleGyroscope,
  onRotateCanvas,
  onToggleBoneEditor,
  onOpenFurniture,
  onOpenSceneSelector,
  onOpenExpressionPanel,
  onToggleVoiceControl,
  onOpenCharacterManager,
  // 状态
  isRandomMode,
  gyroSupported,
  gyroEnabled,
  isBoneEditing,
  voiceSupported,
  isVoiceListening,
  characterProps,
  selectedCharacterIndex,
  showVideoRecorder
}) => {
  const buttonStyle = (active, color = '#00d4ff') => ({
    width: isMobile ? '48px' : '56px',
    height: isMobile ? '48px' : '56px',
    borderRadius: '16px',
    background: active
      ? `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`
      : 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
    border: active ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: isMobile ? '20px' : '24px',
    cursor: 'pointer',
    color: 'white',
    transition: 'all 0.3s ease',
    boxShadow: active ? `0 0 20px ${color}66` : 'none',
    position: 'relative'
  })

  return (
    <div style={{
      position: 'fixed',
      right: isMobile ? '10px' : '20px',
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '10px' : '14px',
      zIndex: 100
    }}>
      {/* 人物管理按钮 */}
      <button
        onClick={onOpenCharacterManager}
        style={buttonStyle(false, '#ff6b9d')}
        title="人物管理"
      >
        👥
      </button>

      {/* 截图按钮 */}
      <button
        onClick={onScreenshot}
        style={buttonStyle(false)}
        title="截图"
      >
        📸
      </button>

      {/* 录像按钮 */}
      <button
        onClick={onToggleVideoRecorder}
        style={buttonStyle(showVideoRecorder, '#ff6b6b')}
        title="录像"
      >
        🎥
      </button>

      {/* 随机动作按钮 */}
      <button
        onClick={onToggleRandomMode}
        style={buttonStyle(isRandomMode, '#00d4ff')}
        title="随机动作"
      >
        🎲
      </button>

      {/* 家具按钮 */}
      <button
        onClick={onOpenFurniture}
        style={{
          ...buttonStyle(false, '#8B4513'),
          position: 'relative'
        }}
        title="道具"
      >
        🏠
        {characterProps[selectedCharacterIndex] && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '14px',
            height: '14px',
            background: '#00d4ff',
            borderRadius: '50%',
            border: '2px solid rgba(30, 41, 59, 0.9)'
          }} />
        )}
      </button>

      {/* 场景按钮 */}
      <button
        onClick={onOpenSceneSelector}
        style={buttonStyle(false, '#9b59b6')}
        title="场景"
      >
        🎨
      </button>

      {/* 表情按钮 */}
      <button
        onClick={onOpenExpressionPanel}
        style={buttonStyle(false, '#ff6b9d')}
        title="表情"
      >
        😊
      </button>

      {/* 旋转按钮 */}
      <button
        onClick={onRotateCanvas}
        style={buttonStyle(false)}
        title="旋转视角"
      >
        🔄
      </button>

      {/* 陀螺仪按钮 */}
      {gyroSupported && (
        <button
          onClick={onToggleGyroscope}
          style={buttonStyle(gyroEnabled, '#9b59b6')}
          title={gyroEnabled ? '关闭陀螺仪' : '开启陀螺仪'}
        >
          📱
        </button>
      )}

      {/* 语音控制按钮 */}
      {voiceSupported && (
        <button
          onClick={onToggleVoiceControl}
          style={buttonStyle(isVoiceListening, '#e74c3c')}
          title={isVoiceListening ? '停止语音' : '语音控制'}
        >
          🎤
        </button>
      )}

      {/* 骨骼编辑按钮 */}
      <button
        onClick={onToggleBoneEditor}
        style={buttonStyle(isBoneEditing, '#00d4ff')}
        title="骨骼编辑"
      >
        🦴
      </button>
    </div>
  )
}

export default Toolbar
