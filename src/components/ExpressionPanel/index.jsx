// 表情面板组件
import React, { useState } from 'react'
import { expressions, expressionCategories, getExpressionBlendShapes } from '../../data/expressions'

const ExpressionPanel = ({ isMobile, currentExpression, onExpressionChange, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('all')

  // 筛选表情
  const filteredExpressions = activeCategory === 'all'
    ? expressions
    : expressions.filter(exp => {
        const category = expressionCategories.find(c => c.id === activeCategory)
        return category?.expressions?.includes(exp.id)
      })

  const handleExpressionSelect = (expressionId) => {
    onExpressionChange(expressionId)
    // 不关闭面板，允许多次选择
  }

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
        maxWidth: '500px',
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
            😊 表情选择
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

        {/* 当前表情显示 */}
        <div style={{
          padding: '16px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '16px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '8px'
          }}>
            {expressions.find(e => e.id === currentExpression)?.icon || '😐'}
          </div>
          <div style={{
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            {expressions.find(e => e.id === currentExpression)?.name || '自然'}
          </div>
        </div>

        {/* 分类标签 */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          overflowX: 'auto',
          padding: '4px 0'
        }}>
          {expressionCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: isMobile ? '6px 12px' : '8px 16px',
                background: activeCategory === cat.id
                  ? 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)'
                  : 'rgba(255,255,255,0.08)',
                border: `1px solid ${activeCategory === cat.id ? '#ff6b9d' : 'rgba(255,255,255,0.15)'}`,
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

        {/* 表情网格 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(4, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? '10px' : '12px'
        }}>
          {filteredExpressions.map(expression => (
            <button
              key={expression.id}
              onClick={() => handleExpressionSelect(expression.id)}
              style={{
                padding: isMobile ? '12px 8px' : '16px 12px',
                background: currentExpression === expression.id
                  ? `linear-gradient(135deg, ${expression.color}60 0%, ${expression.color}30 100%)`
                  : 'rgba(255,255,255,0.05)',
                border: `2px solid ${currentExpression === expression.id ? expression.color : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '14px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                fontSize: isMobile ? '28px' : '32px',
                filter: currentExpression === expression.id ? 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' : 'none'
              }}>
                {expression.icon}
              </div>
              <div style={{
                color: 'white',
                fontSize: isMobile ? '11px' : '12px',
                fontWeight: currentExpression === expression.id ? 'bold' : 'normal'
              }}>
                {expression.name}
              </div>
            </button>
          ))}
        </div>

        {/* 提示 */}
        <div style={{
          marginTop: '20px',
          padding: '12px',
          background: 'rgba(0,212,255,0.1)',
          borderRadius: '10px',
          border: '1px solid rgba(0,212,255,0.2)',
          color: 'rgba(255,255,255,0.7)',
          fontSize: isMobile ? '11px' : '12px',
          textAlign: 'center'
        }}>
          💡 点击表情即可应用到角色，部分表情需要角色支持BlendShape
        </div>
      </div>
    </div>
  )
}

export default ExpressionPanel
