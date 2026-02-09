import React from 'react'

/**
 * 测试组件 - 用于验证React渲染是否正常工作
 */
export function TestComponent() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#0a0a0f', 
      color: '#e0e0e0', 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      {/* 顶部导航栏 */}
      <div style={{ 
        height: '48px', 
        backgroundColor: '#151520', 
        borderBottom: '1px solid #2a2a3a', 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 16px' 
      }}>
        <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>测试组件 - MMD Studio V2</h1>
      </div>
      
      {/* 主编辑区 */}
      <div style={{ flex: 1, display: 'flex' }}>
        {/* 左侧面板 */}
        <div style={{ 
          width: '280px', 
          backgroundColor: '#151520', 
          borderRight: '1px solid #2a2a3a', 
          padding: '16px' 
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '14px' }}>左侧面板</h2>
          <p>这是左侧面板的内容</p>
        </div>
        
        {/* 中央预览区 */}
        <div style={{ 
          flex: 1, 
          backgroundColor: '#0a0a0f', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <h2>中央预览区</h2>
        </div>
        
        {/* 右侧面板 */}
        <div style={{ 
          width: '280px', 
          backgroundColor: '#151520', 
          borderLeft: '1px solid #2a2a3a', 
          padding: '16px' 
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '14px' }}>右侧面板</h2>
          <p>这是右侧面板的内容</p>
        </div>
      </div>
      
      {/* 底部时间轴 */}
      <div style={{ 
        height: '120px', 
        backgroundColor: '#151520', 
        borderTop: '1px solid #2a2a3a', 
        padding: '16px' 
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '14px' }}>底部时间轴</h2>
        <p>这是时间轴的内容</p>
      </div>
    </div>
  )
}
