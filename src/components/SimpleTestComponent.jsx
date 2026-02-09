import React, { useEffect } from 'react'

/**
 * 简单测试组件 - 用于验证React渲染是否正常工作
 */
export function SimpleTestComponent() {
  useEffect(() => {
    console.log('SimpleTestComponent: 初始化开始')
    
    // 模拟一些异步操作
    setTimeout(() => {
      console.log('SimpleTestComponent: 模拟异步操作完成')
    }, 1000)
    
    console.log('SimpleTestComponent: 初始化完成')
  }, [])

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#0a0a0f', 
      color: '#e0e0e0', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center' 
    }}>
      <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>简单测试组件</h1>
      <p style={{ margin: 0, fontSize: '16px', textAlign: 'center' }}>这是一个简单的测试组件，用于验证React渲染是否正常工作。</p>
      <p style={{ margin: 0, fontSize: '14px', textAlign: 'center', marginTop: '8px', color: '#667eea' }}>如果您能看到这个组件，说明React渲染正常工作。</p>
      <p style={{ margin: 0, fontSize: '14px', textAlign: 'center', marginTop: '8px', color: '#667eea' }}>请检查浏览器控制台，看看是否有来自这个组件的console.log语句。</p>
    </div>
  )
}
