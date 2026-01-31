import React, { useState } from 'react'
import { sceneTemplates, getSceneCategories } from '../data/sceneTemplates'
import './SceneTemplatePanel.css'

// 场景模板选择面板
const SceneTemplatePanel = ({ isOpen, onClose, onSelectTemplate, currentTemplate, isMobile }) => {
  const [activeCategory, setActiveCategory] = useState('all')
  const [hoveredTemplate, setHoveredTemplate] = useState(null)

  const categories = getSceneCategories()

  // 筛选模板
  const filteredTemplates = React.useMemo(() => {
    if (activeCategory === 'all') return sceneTemplates

    const categoryMap = {
      'nature': ['sunset', 'beach', 'forest', 'snow', 'sakura'],
      'urban': ['city', 'studio', 'concert'],
      'fantasy': ['night', 'space'],
      'indoor': ['default', 'cafe']
    }

    const templateIds = categoryMap[activeCategory] || []
    return sceneTemplates.filter(t => templateIds.includes(t.id))
  }, [activeCategory])

  if (!isOpen) return null

  return (
    <div className="scene-template-overlay" onClick={onClose}>
      <div className={`scene-template-panel ${isMobile ? 'mobile' : ''}`} onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="scene-template-header">
          <h3>🎨 场景模板</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* 分类筛选 */}
        <div className="category-tabs">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
            </button>
          ))}
        </div>

        {/* 模板网格 */}
        <div className="templates-grid">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className={`template-card ${currentTemplate === template.id ? 'active' : ''}`}
              onClick={() => {
                onSelectTemplate(template)
                onClose()
              }}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
              style={{
                background: template.background
              }}
            >
              {/* 选中标记 */}
              {currentTemplate === template.id && (
                <div className="selected-badge">✓</div>
              )}

              {/* 模板内容 */}
              <div className="template-content">
                <span className="template-icon">{template.icon}</span>
                <span className="template-name">{template.name}</span>
              </div>

              {/* 悬停详情 */}
              {hoveredTemplate === template.id && (
                <div className="template-details">
                  <p className="template-description">{template.description}</p>
                  <div className="template-features">
                    {template.effects.particles && <span className="feature-tag">✨ 特效</span>}
                    {template.effects.bloom && <span className="feature-tag">🌟 光晕</span>}
                    {template.effects.fog && <span className="feature-tag">🌫️ 雾气</span>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 当前场景信息 */}
        {currentTemplate && (
          <div className="current-scene-info">
            <h4>当前场景</h4>
            {(() => {
              const template = sceneTemplates.find(t => t.id === currentTemplate)
              return template ? (
                <div className="current-scene-card">
                  <span className="scene-icon">{template.icon}</span>
                  <div className="scene-details">
                    <span className="scene-name">{template.name}</span>
                    <span className="scene-desc">{template.description}</span>
                  </div>
                </div>
              ) : null
            })()}
          </div>
        )}

        {/* 使用说明 */}
        <div className="template-help">
          <h4>💡 使用说明</h4>
          <ul>
            <li>点击场景卡片即可切换场景</li>
            <li>不同场景有不同的灯光和特效</li>
            <li>场景设置会自动保存</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default SceneTemplatePanel
