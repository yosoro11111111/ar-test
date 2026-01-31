// 场景选择器组件
import React, { useState } from 'react'
import { scenes, sceneCategories, getSceneConfig } from '../../data/scenes'

const SceneSelector = ({ isMobile, currentScene, onSceneChange, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('all')

  // 筛选场景
  const filteredScenes = activeCategory === 'all'
    ? scenes
    : scenes.filter(scene => {
        const category = sceneCategories.find(c => c.id === activeCategory)
        return category?.scenes?.includes(scene.id)
      })

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2500,
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
        borderRadius: '24px',
        padding: isMobile ? '20px' : '32px',
        maxWidth: '600px',
        width: '92%',
        maxHeight: '80vh',
        overflow: 'auto',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 25px 80px rgba(0,0,0,0.6)'
      }}>
        {/* 标题栏 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            color: 'white',
            margin: 0,
            fontSize: isMobile ? '20px' : '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            🎨 选择场景
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer'
            }}
          >×</button>
        </div>

        {/* 分类标签 */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          overflowX: 'auto',
          padding: '4px 0'
        }}>
          {sceneCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: isMobile ? '6px 12px' : '8px 16px',
                background: activeCategory === cat.id
                  ? 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)'
                  : 'rgba(255,255,255,0.08)',
                border: `1px solid ${activeCategory === cat.id ? '#00d4ff' : 'rgba(255,255,255,0.15)'}`,
                borderRadius: '14px',
                color: 'white',
                fontSize: isMobile ? '12px' : '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* 场景网格 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: isMobile ? '10px' : '16px'
        }}>
          {filteredScenes.map(scene => (
            <button
              key={scene.id}
              onClick={() => {
                onSceneChange(scene.id)
                onClose()
              }}
              style={{
                padding: isMobile ? '16px 12px' : '20px 16px',
                background: currentScene === scene.id
                  ? `linear-gradient(135deg, ${scene.color}60 0%, ${scene.color}30 100%)`
                  : 'rgba(255,255,255,0.05)',
                border: `2px solid ${currentScene === scene.id ? scene.color : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '16px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                fontSize: isMobile ? '32px' : '40px',
                filter: currentScene === scene.id ? 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' : 'none'
              }}>
                {scene.icon}
              </div>
              <div style={{
                color: 'white',
                fontSize: isMobile ? '13px' : '15px',
                fontWeight: currentScene === scene.id ? 'bold' : 'normal'
              }}>
                {scene.name}
              </div>
              <div style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: isMobile ? '10px' : '11px'
              }}>
                {scene.description}
              </div>
              {currentScene === scene.id && (
                <div style={{
                  marginTop: '4px',
                  padding: '4px 10px',
                  background: scene.color,
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  当前场景
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SceneSelector
