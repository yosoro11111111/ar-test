// 错误边界组件
import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
    
    // 可以在这里发送错误报告到服务器
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      const { isMobile } = this.props
      
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: isMobile ? '20px' : '40px'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '24px',
            padding: isMobile ? '30px' : '50px',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{
              fontSize: isMobile ? '60px' : '80px',
              marginBottom: '20px'
            }}>
              😵
            </div>
            
            <h2 style={{
              color: 'white',
              fontSize: isMobile ? '22px' : '28px',
              marginBottom: '16px',
              fontWeight: 'bold'
            }}>
              出错了
            </h2>
            
            <p style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: isMobile ? '14px' : '16px',
              marginBottom: '24px',
              lineHeight: 1.6
            }}>
              应用遇到了一些问题，请尝试刷新页面或重置应用。
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                textAlign: 'left',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                <p style={{
                  color: '#ff6b6b',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  margin: 0
                }}>
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: isMobile ? 'wrap' : 'nowrap'
            }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: isMobile ? '12px 24px' : '14px 32px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: isMobile ? '14px' : '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                🔄 重试
              </button>
              
              <button
                onClick={this.handleReload}
                style={{
                  padding: isMobile ? '12px 24px' : '14px 32px',
                  background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: isMobile ? '14px' : '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: 'bold'
                }}
              >
                🔄 刷新页面
              </button>
            </div>

            <div style={{
              marginTop: '24px',
              padding: '12px',
              background: 'rgba(0,212,255,0.1)',
              borderRadius: '10px',
              border: '1px solid rgba(0,212,255,0.2)'
            }}>
              <p style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '12px',
                margin: 0
              }}>
                💡 如果问题持续存在，请清除浏览器缓存后重试
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
