// 动作面板组件 - 包含200种动作、搜索、收藏、最近使用
import React, { useState, useMemo, useCallback } from 'react'
import { actions as actionList200, actionCategories } from '../../data/actions200'
import useLocalStorage from '../../hooks/useLocalStorage'

const ActionPanel = ({ 
  isMobile, 
  onExecuteAction, 
  currentAction,
  isARMode 
}) => {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFavorites, setShowFavorites] = useState(false)
  const [favoriteActions, setFavoriteActions] = useLocalStorage('favoriteActions', [])
  const [recentActions, setRecentActions] = useLocalStorage('recentActions', [])

  // 转换动作数据
  const actionList = useMemo(() => {
    return actionList200.map(action => ({
      name: action.name,
      action: action.id,
      icon: action.icon,
      category: action.category,
      type: action.type,
      highlight: action.category === 'combat' || action.category === 'dance' || action.category === 'special'
    }))
  }, [])

  // 切换收藏
  const toggleFavorite = useCallback((actionId, e) => {
    e.stopPropagation()
    setFavoriteActions(prev => {
      if (prev.includes(actionId)) {
        return prev.filter(id => id !== actionId)
      }
      return [...prev, actionId]
    })
  }, [setFavoriteActions])

  // 执行动作并记录
  const handleExecute = useCallback((actionId) => {
    onExecuteAction(actionId)
    // 添加到最近使用
    setRecentActions(prev => {
      const filtered = prev.filter(id => id !== actionId)
      return [actionId, ...filtered].slice(0, 10)
    })
  }, [onExecuteAction, setRecentActions])

  // 筛选动作
  const filteredActions = useMemo(() => {
    let filtered = actionList

    // 收藏模式
    if (showFavorites) {
      filtered = filtered.filter(action => favoriteActions.includes(action.action))
    }
    // 分类筛选
    else if (activeCategory !== 'all') {
      filtered = filtered.filter(action => action.category === activeCategory)
    }

    // 搜索筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(action =>
        action.name.toLowerCase().includes(query) ||
        action.action.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [actionList, activeCategory, searchQuery, showFavorites, favoriteActions])

  // 最近使用的动作
  const recentActionItems = useMemo(() => {
    return recentActions
      .map(id => actionList.find(a => a.action === id))
      .filter(Boolean)
      .slice(0, 5)
  }, [recentActions, actionList])

  return (
    <div style={{
      position: 'fixed',
      bottom: isMobile ? '8px' : '16px',
      left: isMobile ? '8px' : '16px',
      right: isMobile ? '70px' : '90px',
      zIndex: 100
    }}>
      {/* 最近使用 */}
      {recentActionItems.length > 0 && !searchQuery && !showFavorites && (
        <div style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '8px',
          overflowX: 'auto',
          padding: '4px'
        }}>
          <span style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: isMobile ? '11px' : '12px',
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'nowrap'
          }}>最近:</span>
          {recentActionItems.map((action, index) => (
            <button
              key={`recent-${action.action}`}
              onClick={() => handleExecute(action.action)}
              style={{
                padding: isMobile ? '4px 8px' : '6px 10px',
                background: 'rgba(0,212,255,0.2)',
                border: '1px solid rgba(0,212,255,0.4)',
                borderRadius: '10px',
                color: 'white',
                fontSize: isMobile ? '10px' : '11px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>{action.icon}</span>
              <span>{action.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* 搜索框 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '8px',
        alignItems: 'center'
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: isMobile ? '6px 12px' : '8px 16px',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <span style={{ fontSize: '16px', marginRight: '8px' }}>🔍</span>
          <input
            type="text"
            placeholder="搜索动作..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: isMobile ? '13px' : '14px',
              outline: 'none',
              width: '100%'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '0 4px'
              }}
            >✕</button>
          )}
        </div>

        {/* 收藏切换按钮 */}
        <button
          onClick={() => setShowFavorites(!showFavorites)}
          style={{
            padding: isMobile ? '8px 12px' : '10px 14px',
            background: showFavorites
              ? 'linear-gradient(135deg, #ffd93d 0%, #ffb347 100%)'
              : 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '16px',
            color: 'white',
            fontSize: isMobile ? '12px' : '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span>{showFavorites ? '⭐' : '☆'}</span>
          <span>{favoriteActions.length}</span>
        </button>

        <span style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: isMobile ? '11px' : '12px',
          whiteSpace: 'nowrap'
        }}>
          {filteredActions.length}个
        </span>
      </div>

      {/* 分类标签 */}
      {!showFavorites && (
        <div style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '8px',
          overflowX: 'auto',
          padding: '4px'
        }}>
          {actionCategories.filter(cat => cat.id !== 'all').map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(activeCategory === category.id ? 'all' : category.id)}
              style={{
                padding: isMobile ? '5px 10px' : '6px 12px',
                background: activeCategory === category.id
                  ? `linear-gradient(135deg, ${category.color} 0%, ${category.color}dd 100%)`
                  : 'rgba(255,255,255,0.08)',
                border: `1px solid ${activeCategory === category.id ? category.color : 'rgba(255,255,255,0.15)'}`,
                borderRadius: '16px',
                color: 'white',
                fontSize: isMobile ? '10px' : '11px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: activeCategory === category.id
                  ? `0 0 10px ${category.color}66`
                  : 'none'
              }}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* 动作按钮网格 */}
      <div style={{
        display: 'flex',
        gap: isMobile ? '6px' : '10px',
        overflowX: 'auto',
        padding: isMobile ? '8px' : '12px',
        background: isARMode
          ? 'linear-gradient(135deg, rgba(26, 26, 46, 0.5) 0%, rgba(22, 33, 62, 0.6) 100%)'
          : 'linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: isMobile ? '16px' : '20px',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: isARMode
          ? '0 4px 16px rgba(0,0,0,0.2)'
          : '0 8px 32px rgba(0,0,0,0.4)'
      }}>
        {filteredActions.map((item) => (
          <button
            key={item.action}
            onClick={() => handleExecute(item.action)}
            style={{
              minWidth: isMobile ? '60px' : '80px',
              padding: isMobile ? '10px 8px' : '14px 12px',
              background: currentAction === item.action
                ? 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)'
                : 'rgba(255,255,255,0.08)',
              border: currentAction === item.action
                ? '2px solid #ff6b9d'
                : '2px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
          >
            {/* 收藏按钮 */}
            <span
              onClick={(e) => toggleFavorite(item.action, e)}
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                fontSize: '10px',
                cursor: 'pointer',
                opacity: favoriteActions.includes(item.action) ? 1 : 0.3
              }}
            >
              {favoriteActions.includes(item.action) ? '⭐' : '☆'}
            </span>

            <div style={{
              fontSize: isMobile ? '20px' : '24px',
              filter: currentAction === item.action ? 'drop-shadow(0 0 8px rgba(255,255,255,0.8))' : 'none',
              transition: 'all 0.3s ease'
            }}>
              {item.icon}
            </div>
            <div style={{
              fontSize: isMobile ? '10px' : '11px',
              color: 'white',
              fontWeight: currentAction === item.action ? '700' : '500',
              whiteSpace: 'nowrap',
              textShadow: currentAction === item.action ? '0 0 10px rgba(255,255,255,0.5)' : 'none'
            }}>
              {item.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default ActionPanel
