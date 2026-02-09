import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

const renderApp = () => {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    console.error('找不到root元素')
    return
  }
  
  console.log('开始渲染React应用')
  
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          {/* 移除独立的MMD路由，统一在App组件内管理 */}
          <Route path="/mmd" element={<Navigate to="/" replace />} />
          <Route path="/studio" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
  )
  
  console.log('React应用渲染完成')
}

// 确保DOM已加载
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp)
} else {
  renderApp()
}
