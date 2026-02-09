import React from 'react'

export function Test() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: '#0a0a0f',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ 
        padding: '20px', 
        background: '#15151a',
        borderBottom: '1px solid #333'
      }}>
        <h1>测试标题</h1>
      </div>
      <div style={{ 
        flex: 1, 
        display: 'flex',
        padding: '20px',
        gap: '20px'
      }}>
        <div style={{ 
          width: '200px', 
          background: '#1a1a2e',
          borderRadius: '8px',
          padding: '20px'
        }}>
          左侧面板
        </div>
        <div style={{ 
          flex: 1, 
          background: '#1a1a2e',
          borderRadius: '8px',
          padding: '20px'
        }}>
          中央区域
        </div>
        <div style={{ 
          width: '200px', 
          background: '#1a1a2e',
          borderRadius: '8px',
          padding: '20px'
        }}>
          右侧面板
        </div>
      </div>
      <div style={{ 
        height: '200px', 
        background: '#1a1a2e',
        borderTop: '1px solid #333',
        padding: '20px'
      }}>
        底部时间轴
      </div>
    </div>
  )
}
