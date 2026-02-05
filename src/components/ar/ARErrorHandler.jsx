import React from 'react'
import { HapticFeedback } from '../../utils/hapticFeedback'

/**
 * AR错误处理组件
 * 提供友好的错误提示和回退选项
 */
export const ARErrorHandler = ({ error, onSwitchMode, onRetry }) => {
  // 错误类型和对应的提示信息
  const errorMessages = {
    'NotSupportedError': {
      title: '设备不支持AR',
      message: '您的设备或浏览器不支持WebXR AR功能。',
      icon: '📱',
      action: '切换到摄像头模式',
      actionType: 'switch'
    },
    'SecurityError': {
      title: '需要权限',
      message: '请允许摄像头权限以使用AR功能。',
      icon: '🔒',
      action: '重试',
      actionType: 'retry'
    },
    'NotAllowedError': {
      title: '权限被拒绝',
      message: '摄像头权限被拒绝。请在浏览器设置中允许摄像头访问。',
      icon: '🚫',
      action: '切换到摄像头模式',
      actionType: 'switch'
    },
    'AbortError': {
      title: '用户取消',
      message: 'AR会话被用户取消。',
      icon: '✋',
      action: '重试',
      actionType: 'retry'
    },
    'TimeoutError': {
      title: '连接超时',
      message: 'AR初始化超时，请检查网络连接后重试。',
      icon: '⏱️',
      action: '重试',
      actionType: 'retry'
    },
    'default': {
      title: 'AR初始化失败',
      message: error?.message || '未知错误，请重试或切换到摄像头模式。',
      icon: '⚠️',
      action: '切换到摄像头模式',
      actionType: 'switch'
    }
  }

  const errorInfo = errorMessages[error?.name] || errorMessages.default

  const handleAction = () => {
    HapticFeedback.medium()
    if (errorInfo.actionType === 'switch') {
      onSwitchMode?.('camera')
    } else {
      onRetry?.()
    }
  }

  const handleSecondaryAction = () => {
    HapticFeedback.light()
    if (errorInfo.actionType === 'switch') {
      onRetry?.()
    } else {
      onSwitchMode?.('camera')
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderRadius: '20px',
        padding: '32px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        {/* 错误图标 */}
        <div style={{
          fontSize: '64px',
          marginBottom: '16px'
        }}>
          {errorInfo.icon}
        </div>

        {/* 错误标题 */}
        <h2 style={{
          color: 'white',
          margin: '0 0 12px 0',
          fontSize: '24px',
          fontWeight: 600
        }}>
          {errorInfo.title}
        </h2>

        {/* 错误信息 */}
        <p style={{
          color: 'rgba(255,255,255,0.7)',
          margin: '0 0 24px 0',
          fontSize: '14px',
          lineHeight: 1.6
        }}>
          {errorInfo.message}
        </p>

        {/* 主要操作按钮 */}
        <button
          onClick={handleAction}
          style={{
            width: '100%',
            padding: '14px 24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '12px',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.02)'
            e.target.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)'
            e.target.style.boxShadow = 'none'
          }}
        >
          {errorInfo.action}
        </button>

        {/* 次要操作按钮 */}
        <button
          onClick={handleSecondaryAction}
          style={{
            width: '100%',
            padding: '14px 24px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '12px',
            color: 'rgba(255,255,255,0.8)',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.1)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent'
          }}
        >
          {errorInfo.actionType === 'switch' ? '重试' : '切换到摄像头模式'}
        </button>

        {/* 技术支持信息 */}
        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.5)'
        }}>
          <p style={{ margin: '0 0 4px 0' }}>
            错误代码: {error?.name || 'Unknown'}
          </p>
          <p style={{ margin: 0 }}>
            如果问题持续存在，请尝试刷新页面
          </p>
        </div>
      </div>
    </div>
  )
}

export default ARErrorHandler
