import React from 'react'

/**
 * 共享录制控制组件
 */
export const RecordingControls = ({
  isRecording,
  recordingProgress,
  onStartRecording,
  onStopRecording,
  onScreenshot,
  isMobile = false
}) => {
  return (
    <div style={{
      display: 'flex',
      gap: '10px',
      alignItems: 'center'
    }}>
      {/* 截图按钮 */}
      <button
        onClick={onScreenshot}
        disabled={isRecording}
        style={{
          width: isMobile ? '40px' : '44px',
          height: isMobile ? '40px' : '44px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.3)',
          color: 'white',
          fontSize: '20px',
          cursor: isRecording ? 'not-allowed' : 'pointer',
          opacity: isRecording ? 0.5 : 1,
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="截图"
      >
        📷
      </button>

      {/* 录制按钮 */}
      <button
        onClick={isRecording ? onStopRecording : () => onStartRecording('video', 5000)}
        style={{
          width: isMobile ? '50px' : '56px',
          height: isMobile ? '50px' : '56px',
          borderRadius: '50%',
          background: isRecording 
            ? 'rgba(239, 68, 68, 0.8)' 
            : 'rgba(255,255,255,0.2)',
          border: `2px solid ${isRecording ? '#ef4444' : 'rgba(255,255,255,0.3)'}`,
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
        title={isRecording ? '停止录制' : '开始录制'}
      >
        {isRecording ? '⏹️' : '⏺️'}
        
        {/* 录制指示器 */}
        {isRecording && (
          <div style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '12px',
            height: '12px',
            background: '#ef4444',
            borderRadius: '50%',
            animation: 'pulse 1s infinite'
          }} />
        )}
      </button>

      {/* 录制进度 */}
      {isRecording && (
        <div style={{
          width: '100px',
          height: '4px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${recordingProgress}%`,
            height: '100%',
            background: '#ef4444',
            borderRadius: '2px',
            transition: 'width 0.1s linear'
          }} />
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}

export default RecordingControls
