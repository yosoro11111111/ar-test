import React, { useState, useRef, useCallback } from 'react'
import { useUIStore } from '../../../stores/uiStore'
import './CharacterSelector.css'

export const CharacterSelector = ({
  characters = [],
  currentCharacter,
  onSelectCharacter,
  onAddCharacter,
  onEditCharacter,
  onDeleteCharacter,
  isMobile = false
}) => {
  const { setActivePanel, closePanel } = useUIStore()
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [showMenu, setShowMenu] = useState(null)
  const scrollRef = useRef(null)

  // 处理角色选择
  const handleSelect = (character) => {
    onSelectCharacter?.(character)
    if (isMobile) {
      closePanel()
    }
  }

  // 处理拖拽开始
  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  // 处理拖拽结束
  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  // 处理拖拽经过
  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    // 这里可以实现拖拽排序逻辑
  }

  // 处理长按（移动端）
  const handleLongPress = (e, character, index) => {
    e.preventDefault()
    setShowMenu({ character, index, x: e.clientX, y: e.clientY })
  }

  // 滚动控制
  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 200
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className={`character-selector ${isMobile ? 'mobile' : 'desktop'}`}>
      {/* 左滚动按钮 */}
      {!isMobile && characters.length > 5 && (
        <button 
          className="scroll-btn left"
          onClick={() => scroll('left')}
        >
          ◀
        </button>
      )}

      {/* 角色列表 */}
      <div 
        className="character-list"
        ref={scrollRef}
      >
        {characters.map((character, index) => (
          <div
            key={character.id}
            className={`character-item ${
              currentCharacter?.id === character.id ? 'active' : ''
            } ${draggedIndex === index ? 'dragging' : ''}`}
            onClick={() => handleSelect(character)}
            onContextMenu={(e) => handleLongPress(e, character, index)}
            draggable={!isMobile}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onTouchStart={(e) => {
              // 移动端长按检测
              const timer = setTimeout(() => {
                handleLongPress(e, character, index)
              }, 500)
              e.target.addEventListener('touchend', () => {
                clearTimeout(timer)
              }, { once: true })
            }}
          >
            <div className="character-avatar">
              {character.avatar ? (
                <img src={character.avatar} alt={character.name} />
              ) : (
                <div className="avatar-placeholder">
                  {character.name?.charAt(0) || '?'}
                </div>
              )}
              {currentCharacter?.id === character.id && (
                <div className="active-indicator" />
              )}
            </div>
            <span className="character-name">{character.name}</span>
          </div>
        ))}

        {/* 添加按钮 */}
        <div 
          className="character-item add-btn"
          onClick={() => {
            if (isMobile) {
              setActivePanel('characters')
            } else {
              onAddCharacter?.()
            }
          }}
        >
          <div className="character-avatar">
            <span className="add-icon">+</span>
          </div>
          <span className="character-name">添加</span>
        </div>
      </div>

      {/* 右滚动按钮 */}
      {!isMobile && characters.length > 5 && (
        <button 
          className="scroll-btn right"
          onClick={() => scroll('right')}
        >
          ▶
        </button>
      )}

      {/* 上下文菜单 */}
      {showMenu && (
        <>
          <div 
            className="context-menu-overlay"
            onClick={() => setShowMenu(null)}
          />
          <div 
            className="context-menu"
            style={{
              left: showMenu.x,
              top: showMenu.y
            }}
          >
            <button 
              className="menu-item"
              onClick={() => {
                onEditCharacter?.(showMenu.character)
                setShowMenu(null)
              }}
            >
              ✏️ 编辑
            </button>
            <button 
              className="menu-item delete"
              onClick={() => {
                onDeleteCharacter?.(showMenu.character)
                setShowMenu(null)
              }}
            >
              🗑️ 删除
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default CharacterSelector
