// 家具/道具面板组件
import React, { useState, useMemo } from 'react'
import { furnitureList, furnitureCategories, getFurnitureByCategory, searchFurniture } from '../../data/furniture'

const FurniturePanel = ({
  isMobile,
  currentFurniture,
  onFurnitureChange,
  onClose,
  showNotification
}) => {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // 筛选家具
  const filteredFurniture = useMemo(() => {
    let filtered = furnitureList

    // 分类筛选
    if (activeCategory !== 'all') {
      filtered = filtered.filter(f => f.category === activeCategory)
    }

    // 搜索筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(query) ||
        f.description?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [activeCategory, searchQuery])

  const handleFurnitureSelect = (furniture) => {
    onFurnitureChange(furniture.id)
    if (furniture.id !== 'none') {
      showNotification(`已装备: ${furniture.name}`, 'success')
      // 如果有自动姿势，延迟执行
      if (furniture.autoPose) {
        setTimeout(() => {
          // 触发动作事件
          if (window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('executeAction', {
              detail: { action: furniture.autoPose, intensity: 1 }
            }))
          }
        }, 300)
      }
    } else {
      showNotification('已移除装备', 'info')
    }
    onClose()
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
        maxWidth: '650px',
        width: '92%',
        maxHeight: '85vh',
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
            🎁 道具装备
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

        {/* 当前装备显示 */}
        {currentFurniture && currentFurniture !== 'none' && (
          <div style={{
            padding: '16px',
            background: 'linear-gradient(135deg, rgba(255, 107, 157, 0.2) 0%, rgba(196, 69, 105, 0.1) 100%)',
            borderRadius: '16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            border: '1px solid rgba(255,107,157,0.3)'
          }}>
            <div style={{
              fontSize: '40px',
              filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))'
            }}>
              {furnitureList.find(f => f.id === currentFurniture)?.icon || '🎁'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                当前装备: {furnitureList.find(f => f.id === currentFurniture)?.name}
              </div>
              <div style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '13px',
                marginTop: '4px'
              }}>
                {furnitureList.find(f => f.id === currentFurniture)?.description}
              </div>
            </div>
            <button
              onClick={() => handleFurnitureSelect({ id: 'none', name: '无' })}
              style={{
                padding: '8px 16px',
                background: 'rgba(255,107,107,0.2)',
                border: '1px solid rgba(255,107,107,0.4)',
                borderRadius: '10px',
                color: '#ff6b6b',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              卸下
            </button>
          </div>
        )}

        {/* 搜索框 */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: isMobile ? '10px 14px' : '12px 18px',
            border: '1px solid rgba(255,255,255,0.15)'
          }}>
            <span style={{ fontSize: '18px', marginRight: '10px' }}>🔍</span>
            <input
              type="text"
              placeholder="搜索道具..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: isMobile ? '14px' : '15px',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '18px',
                  cursor: 'pointer'
                }}
              >✕</button>
            )}
          </div>
          <span style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: isMobile ? '12px' : '14px',
            display: 'flex',
            alignItems: 'center'
          }}>
            {filteredFurniture.length}个
          </span>
        </div>

        {/* 分类标签 */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          overflowX: 'auto',
          padding: '4px 0'
        }}>
          {furnitureCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: isMobile ? '6px 12px' : '8px 16px',
                background: activeCategory === cat.id
                  ? `linear-gradient(135deg, ${cat.color} 0%, ${cat.color}dd 100%)`
                  : 'rgba(255,255,255,0.08)',
                border: `1px solid ${activeCategory === cat.id ? cat.color : 'rgba(255,255,255,0.15)'}`,
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

        {/* 家具网格 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? '10px' : '12px'
        }}>
          {filteredFurniture.map(furniture => (
            <button
              key={furniture.id}
              onClick={() => handleFurnitureSelect(furniture)}
              style={{
                padding: isMobile ? '12px 8px' : '16px 12px',
                background: currentFurniture === furniture.id
                  ? `linear-gradient(135deg, ${furniture.color || '#666'}60 0%, ${furniture.color || '#666'}30 100%)`
                  : 'rgba(255,255,255,0.05)',
                border: `2px solid ${currentFurniture === furniture.id ? (furniture.color || '#ff6b9d') : 'rgba(255,255,255,0.1)'}`,
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
                filter: currentFurniture === furniture.id ? 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' : 'none'
              }}>
                {furniture.icon}
              </div>
              <div style={{
                color: 'white',
                fontSize: isMobile ? '11px' : '12px',
                fontWeight: currentFurniture === furniture.id ? 'bold' : 'normal',
                textAlign: 'center'
              }}>
                {furniture.name}
              </div>
              {furniture.autoPose && (
                <div style={{
                  fontSize: '9px',
                  color: 'rgba(255,255,255,0.5)',
                  background: 'rgba(0,212,255,0.2)',
                  padding: '2px 6px',
                  borderRadius: '8px'
                }}>
                  自动姿势
                </div>
              )}
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
          💡 带有"自动姿势"标签的道具会自动调整角色姿势
        </div>
      </div>
    </div>
  )
}

export default FurniturePanel
