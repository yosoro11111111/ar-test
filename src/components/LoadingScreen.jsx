import React, { useState, useEffect } from 'react'
import './LoadingScreen.css'

// 开屏加载组件 - 美化版
export const LoadingScreen = ({ onComplete, isMobile }) => {
  const [progress, setProgress] = useState(0)
  const [currentText, setCurrentText] = useState(0)
  const [showEnter, setShowEnter] = useState(false)

  const loadingTexts = [
    '正在初始化3D引擎...',
    '正在加载模型资源...',
    '正在准备骨骼系统...',
    '正在优化渲染管线...',
    '即将完成...'
  ]

  useEffect(() => {
    // 进度条动画
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setShowEnter(true)
          return 100
        }
        // 非线性增长，模拟真实加载
        const increment = Math.random() * 8 + 2
        return Math.min(prev + increment, 100)
      })
    }, 100)

    // 文字轮播
    const textInterval = setInterval(() => {
      setCurrentText(prev => (prev + 1) % loadingTexts.length)
    }, 800)

    return () => {
      clearInterval(interval)
      clearInterval(textInterval)
    }
  }, [])

  const handleEnter = () => {
    onComplete()
  }

  return (
    <div className="loading-screen">
      {/* 动态背景 */}
      <div className="loading-bg">
        <div className="gradient-orb orb-1" />
        <div className="gradient-orb orb-2" />
        <div className="gradient-orb orb-3" />
      </div>

      {/* 粒子效果 */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* 主内容 */}
      <div className="loading-content">
        {/* Logo区域 */}
        <div className="logo-container">
          <div className="logo-ring ring-1" />
          <div className="logo-ring ring-2" />
          <div className="logo-ring ring-3" />
          <div className="logo">🌸</div>
        </div>

        {/* 标题 */}
        <h1 className="loading-title">AR乐园</h1>
        <p className="loading-subtitle">AR PARADISE SYSTEM</p>

        {/* 进度区域 */}
        <div className="progress-container">
          {/* 圆形进度条 */}
          <div className="circular-progress">
            <svg viewBox="0 0 100 100">
              <circle
                className="progress-bg"
                cx="50"
                cy="50"
                r="45"
              />
              <circle
                className="progress-bar"
                cx="50"
                cy="50"
                r="45"
                style={{
                  strokeDasharray: `${2 * Math.PI * 45}`,
                  strokeDashoffset: `${2 * Math.PI * 45 * (1 - progress / 100)}`
                }}
              />
            </svg>
            <div className="progress-text">{Math.floor(progress)}%</div>
          </div>

          {/* 加载文字 */}
          <div className="loading-text-container">
            <p className="loading-text">{loadingTexts[currentText]}</p>
          </div>
        </div>

        {/* 进入按钮区域 */}
        {showEnter && (
          <div className="enter-buttons">
            <button className="enter-button" onClick={handleEnter}>
              <span>进入体验</span>
              <div className="button-glow" />
            </button>
            <button className="mmd-button" onClick={() => window.location.href = '/ar-director/mmd'}>
              <span>🎬 MMD导演</span>
              <div className="button-glow" />
            </button>
            <button className="mobile-record-button" onClick={() => window.location.href = '/ar-director/record'}>
              <span>📷 AR全景相机</span>
              <div className="button-glow" />
            </button>
          </div>
        )}
      </div>

      {/* 版本号 */}
      <div className="version">v2.0.0</div>
    </div>
  )
}

export default LoadingScreen
