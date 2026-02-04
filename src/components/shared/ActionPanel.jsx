import React, { useState, useCallback } from 'react'

/**
 * 共享动作面板组件
 * 在摄像头模式和AR模式中都可用
 */
export const SharedActionPanel = ({
  actions,
  categories,
  currentAction,
  favorites,
  onActionSelect,
  onFavoriteToggle,
  isLoading,
  isMobile = false
}) => {
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'favorites' | 'recent'
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // 过滤动作
  const filteredActions = React.useMemo(() => {
    let result = actions

    // 按标签过滤
    if (activeTab === 'favorites') {
      result = actions.filter(a => favorites.includes(a.id))
    }

    // 按分类过滤
    if (selectedCategory) {
      result = result.filter(a => a.category === selectedCategory)
    }

    // 按搜索词过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(a => 
        a.name.toLowerCase().includes(query) ||
        a.category?.toLowerCase().includes(query)
      )
    }

    return result
  }, [actions, activeTab, favorites, selectedCategory, searchQuery])

  // 渲染动作按钮
  const renderActionButton = useCallback((action) => {
    const isActive = currentAction?.id === action.id
    const isFav = favorites.includes(action.id)

    return (
      <button
        key={action.id}
        onClick={() => onActionSelect(action)}
        style={{
          padding: isMobile ? '8px 6px' : '12px 8px',
          background: isActive 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
            : 'rgba(255,255,255,0.1)',
          border: `1px solid ${isActive ? '#667eea' : 'rgba(255,255,255,0.2)'}`,
          borderRadius: '10px',
          color: 'white',
          fontSize: isMobile ? '11px' : '12px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          position: 'relative',
          transition: 'all 0.2s ease'
        }}
      >
        <span style={{ fontSize: isMobile ? '20px' : '24px' }}>{action.icon}</span>
        <span style={{ 
          maxWidth: '100%', 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>{action.name}</span>
        
        {/* 收藏按钮 */}
        <span
          onClick={(e) => {
            e.stopPropagation()
            onFavoriteToggle(action.id)
          }}
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            fontSize: '12px',
            opacity: isFav ? 1 : 0.3,
            cursor: 'pointer'
          }}
        >
          {isFav ? '★' : '☆'}
        </span>
      </button>
    )
  }, [currentAction, favorites, onActionSelect, onFavoriteToggle, isMobile])

  return (
    <div style={{
      background: 'rgba(0,0,0,0.85)',
      borderRadius: '16px',
      padding: isMobile ? '12px' : '16px',
      backdropFilter: 'blur(10px)',
      maxHeight: isMobile ? '60vh' : '70vh',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {/* 标题 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, color: 'white', fontSize: '16px' }}>
          🎭 动作面板
        </h3>
        {isLoading && (
          <span style={{ color: '#667eea', fontSize: '12px' }}>加载中...</span>
        )}
      </div>

      {/* 标签切换 */}
      <div style={{
        display: 'flex',
        gap: '8px'
      }}>
        {[
          { id: 'all', label: '全部', icon: '📋' },
          { id: 'favorites', label: '收藏', icon: '★' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '8px',
              background: activeTab === tab.id 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* 搜索框 */}
      <input
        type="text"
        placeholder="搜索动作..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(255,255,255,0.1)',
          color: 'white',
          fontSize: '14px',
          outline: 'none'
        }}
      />

      {/* 分类筛选 */}
      {categories && categories.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          maxHeight: '60px',
          overflowY: 'auto'
        }}>
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              padding: '4px 10px',
              background: selectedCategory === null 
                ? '#667eea' 
                : 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            全部
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '4px 10px',
                background: selectedCategory === cat 
                  ? '#667eea' 
                  : 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* 动作网格 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(4, 1fr)' : 'repeat(5, 1fr)',
        gap: '8px',
        overflowY: 'auto',
        maxHeight: isMobile ? '200px' : '300px',
        padding: '4px'
      }}>
        {filteredActions.map(renderActionButton)}
      </div>

      {/* 统计 */}
      <div style={{
        textAlign: 'center',
        color: 'rgba(255,255,255,0.5)',
        fontSize: '12px',
        paddingTop: '8px',
        borderTop: '1px solid rgba(255,255,255,0.1)'
      }}>
        共 {filteredActions.length} 个动作
      </div>
    </div>
  )
}

export default SharedActionPanel
