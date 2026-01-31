import React, { useState, useEffect } from 'react'
import './StageEffectsPanel.css'

// 舞台效果调整面板
export const StageEffectsPanel = ({
  isOpen,
  onClose,
  onEffectChange,
  currentEffects,
  isMobile
}) => {
  const defaultEffects = {
    particles: {
      enabled: false,
      type: 'snow',
      intensity: 50
    },
    filter: {
      enabled: false,
      type: 'none',
      intensity: 50
    },
    quality: 'high',
    renderEffects: {
      outline: false,
      outlineColor: '#00d4ff',
      outlineIntensity: 50,
      bloom: false,
      bloomIntensity: 50,
      shadows: true,
      shadowQuality: 'high'
    },
    stickers: []
  }

  const [effects, setEffects] = useState(() => {
    if (!currentEffects) return defaultEffects
    return {
      particles: { ...defaultEffects.particles, ...currentEffects.particles },
      filter: { ...defaultEffects.filter, ...currentEffects.filter },
      quality: currentEffects.quality || defaultEffects.quality,
      renderEffects: { ...defaultEffects.renderEffects, ...currentEffects.renderEffects },
      stickers: currentEffects.stickers || defaultEffects.stickers
    }
  })

  const [activeTab, setActiveTab] = useState('effects') // effects, filter, render, stickers

  // 更新效果
  const updateEffect = (category, key, value) => {
    const newEffects = {
      ...effects,
      [category]: {
        ...effects[category],
        [key]: value
      }
    }
    setEffects(newEffects)
    onEffectChange?.(newEffects)
  }

  // 添加贴纸
  const addSticker = (type) => {
    const newSticker = {
      id: Date.now(),
      type,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0
    }
    setEffects(prev => ({
      ...prev,
      stickers: [...prev.stickers, newSticker]
    }))
  }

  // 移除贴纸
  const removeSticker = (id) => {
    setEffects(prev => ({
      ...prev,
      stickers: prev.stickers.filter(s => s.id !== id)
    }))
  }

  const particleTypes = [
    { id: 'snow', name: '雪花', icon: '❄️' },
    { id: 'rain', name: '雨滴', icon: '🌧️' },
    { id: 'stars', name: '星星', icon: '⭐' },
    { id: 'fireflies', name: '萤火虫', icon: '✨' },
    { id: 'petals', name: '花瓣', icon: '🌸' },
    { id: 'bubbles', name: '气泡', icon: '🫧' }
  ]

  const filterTypes = [
    { id: 'none', name: '无', color: 'transparent' },
    { id: 'warm', name: '暖色', color: '#ff9f43' },
    { id: 'cool', name: '冷色', color: '#54a0ff' },
    { id: 'vintage', name: '复古', color: '#d4a574' },
    { id: 'noir', name: '黑白', color: '#2d3436' },
    { id: 'dreamy', name: '梦幻', color: '#a29bfe' },
    { id: 'sunset', name: '日落', color: '#ff6b6b' },
    { id: 'cyber', name: '赛博', color: '#00d4ff' }
  ]

  const stickerTypes = [
    { id: 'heart', icon: '❤️' },
    { id: 'star', icon: '⭐' },
    { id: 'flower', icon: '🌸' },
    { id: 'music', icon: '🎵' },
    { id: 'sparkle', icon: '✨' },
    { id: 'cloud', icon: '☁️' },
    { id: 'moon', icon: '🌙' },
    { id: 'sun', icon: '☀️' }
  ]

  if (!isOpen) return null

  return (
    <div className="stage-effects-overlay" onClick={onClose}>
      <div className={`stage-effects-panel ${isMobile ? 'mobile' : ''}`} onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="stage-effects-header">
          <h2>舞台效果</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* 标签页 */}
        <div className="effects-tabs">
          <button
            className={activeTab === 'effects' ? 'active' : ''}
            onClick={() => setActiveTab('effects')}
          >
            ✨ 特效
          </button>
          <button
            className={activeTab === 'filter' ? 'active' : ''}
            onClick={() => setActiveTab('filter')}
          >
            🎨 滤镜
          </button>
          <button
            className={activeTab === 'render' ? 'active' : ''}
            onClick={() => setActiveTab('render')}
          >
            🎭 渲染
          </button>
          <button
            className={activeTab === 'stickers' ? 'active' : ''}
            onClick={() => setActiveTab('stickers')}
          >
            🏷️ 贴纸
          </button>
        </div>

        {/* 内容区域 */}
        <div className="effects-content">
          {/* 特效 */}
          {activeTab === 'effects' && (
            <div className="effects-section">
              <div className="effect-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={effects.particles.enabled}
                    onChange={(e) => updateEffect('particles', 'enabled', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-text">启用粒子特效</span>
                </label>
              </div>

              {effects.particles.enabled && (
                <>
                  <div className="effect-types">
                    <label>特效类型</label>
                    <div className="type-grid">
                      {particleTypes.map(type => (
                        <button
                          key={type.id}
                          className={effects.particles.type === type.id ? 'active' : ''}
                          onClick={() => updateEffect('particles', 'type', type.id)}
                        >
                          <span className="type-icon">{type.icon}</span>
                          <span className="type-name">{type.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="effect-slider">
                    <label>强度</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={effects.particles.intensity}
                      onChange={(e) => updateEffect('particles', 'intensity', parseInt(e.target.value))}
                    />
                    <span>{effects.particles.intensity}%</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 滤镜 */}
          {activeTab === 'filter' && (
            <div className="effects-section">
              <div className="effect-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={effects.filter.enabled}
                    onChange={(e) => updateEffect('filter', 'enabled', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-text">启用滤镜</span>
                </label>
              </div>

              {effects.filter.enabled && (
                <>
                  <div className="filter-grid">
                    {filterTypes.map(filter => (
                      <button
                        key={filter.id}
                        className={effects.filter.type === filter.id ? 'active' : ''}
                        onClick={() => updateEffect('filter', 'type', filter.id)}
                        style={{ '--filter-color': filter.color }}
                      >
                        <div className="filter-preview" style={{ background: filter.color }}></div>
                        <span>{filter.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="effect-slider">
                    <label>强度</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={effects.filter.intensity}
                      onChange={(e) => updateEffect('filter', 'intensity', parseInt(e.target.value))}
                    />
                    <span>{effects.filter.intensity}%</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 渲染 */}
          {activeTab === 'render' && (
            <div className="effects-section">
              <div className="quality-selector">
                <label>渲染质量</label>
                <div className="quality-options">
                  {['low', 'medium', 'high', 'ultra'].map(q => (
                    <button
                      key={q}
                      className={effects.quality === q ? 'active' : ''}
                      onClick={() => {
                        setEffects(prev => ({ ...prev, quality: q }))
                        onEffectChange?.({ ...effects, quality: q })
                      }}
                    >
                      {q === 'low' && '低'}
                      {q === 'medium' && '中'}
                      {q === 'high' && '高'}
                      {q === 'ultra' && '极致'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="render-effects">
                <div className="effect-toggle">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={effects.renderEffects.outline}
                      onChange={(e) => updateEffect('renderEffects', 'outline', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-text">轮廓光</span>
                  </label>
                </div>

                {effects.renderEffects.outline && (
                  <div className="outline-options">
                    <input
                      type="color"
                      value={effects.renderEffects.outlineColor}
                      onChange={(e) => updateEffect('renderEffects', 'outlineColor', e.target.value)}
                    />
                    <div className="effect-slider">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={effects.renderEffects.outlineIntensity}
                        onChange={(e) => updateEffect('renderEffects', 'outlineIntensity', parseInt(e.target.value))}
                      />
                      <span>{effects.renderEffects.outlineIntensity}%</span>
                    </div>
                  </div>
                )}

                <div className="effect-toggle">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={effects.renderEffects.bloom}
                      onChange={(e) => updateEffect('renderEffects', 'bloom', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-text">辉光效果</span>
                  </label>
                </div>

                {effects.renderEffects.bloom && (
                  <div className="effect-slider">
                    <label>辉光强度</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={effects.renderEffects.bloomIntensity}
                      onChange={(e) => updateEffect('renderEffects', 'bloomIntensity', parseInt(e.target.value))}
                    />
                    <span>{effects.renderEffects.bloomIntensity}%</span>
                  </div>
                )}

                <div className="effect-toggle">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={effects.renderEffects.shadows}
                      onChange={(e) => updateEffect('renderEffects', 'shadows', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-text">阴影</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 贴纸 */}
          {activeTab === 'stickers' && (
            <div className="effects-section">
              <div className="sticker-types">
                <label>选择贴纸</label>
                <div className="sticker-grid">
                  {stickerTypes.map(sticker => (
                    <button
                      key={sticker.id}
                      onClick={() => addSticker(sticker.id)}
                    >
                      {sticker.icon}
                    </button>
                  ))}
                </div>
              </div>

              {effects.stickers.length > 0 && (
                <div className="active-stickers">
                  <label>已添加 ({effects.stickers.length})</label>
                  <div className="stickers-list">
                    {effects.stickers.map(sticker => (
                      <div key={sticker.id} className="sticker-item">
                        <span>{stickerTypes.find(s => s.id === sticker.type)?.icon}</span>
                        <button onClick={() => removeSticker(sticker.id)}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StageEffectsPanel
