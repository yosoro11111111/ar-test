import React, { useState, useEffect } from 'react'
import './CharacterManager.css'

// 人物管理组件
export const CharacterManager = ({ 
  isOpen, 
  onClose, 
  characters, 
  currentCharacter, 
  onSelect, 
  onCreate, 
  onDelete, 
  onEdit,
  onReorder,
  isMobile 
}) => {
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [showConfirmDelete, setShowConfirmDelete] = useState(null)
  const [draggedItem, setDraggedItem] = useState(null)

  if (!isOpen) return null

  // 过滤人物
  const filteredCharacters = characters.filter(char => {
    const matchesSearch = char.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         char.path?.toLowerCase().includes(searchQuery.toLowerCase())
    if (activeTab === 'all') return matchesSearch
    if (activeTab === 'selected') return matchesSearch && char.selected
    if (activeTab === 'custom') return matchesSearch && char.isCustom
    return matchesSearch
  })

  // 处理编辑
  const handleEdit = (char) => {
    setEditingId(char.id)
    setEditName(char.name || char.path)
  }

  const handleSaveEdit = (char) => {
    onEdit?.(char.id, { name: editName })
    setEditingId(null)
    setEditName('')
  }

  // 拖拽排序
  const handleDragStart = (e, char) => {
    setDraggedItem(char)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, targetChar) => {
    e.preventDefault()
    if (!draggedItem || draggedItem.id === targetChar.id) return
  }

  const handleDrop = (e, targetChar) => {
    e.preventDefault()
    if (!draggedItem || draggedItem.id === targetChar.id) return
    
    const newOrder = [...characters]
    const draggedIndex = newOrder.findIndex(c => c.id === draggedItem.id)
    const targetIndex = newOrder.findIndex(c => c.id === targetChar.id)
    
    newOrder.splice(draggedIndex, 1)
    newOrder.splice(targetIndex, 0, draggedItem)
    
    onReorder?.(newOrder)
    setDraggedItem(null)
  }

  return (
    <div className="character-manager-overlay" onClick={onClose}>
      <div className="character-manager" onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="manager-header">
          <h2>人物管理</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* 搜索栏 */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="搜索人物..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        {/* 标签页 */}
        <div className="manager-tabs">
          <button 
            className={activeTab === 'all' ? 'active' : ''}
            onClick={() => setActiveTab('all')}
          >
            全部 ({characters.length})
          </button>
          <button 
            className={activeTab === 'selected' ? 'active' : ''}
            onClick={() => setActiveTab('selected')}
          >
            已选 ({characters.filter(c => c.selected).length})
          </button>
          <button 
            className={activeTab === 'custom' ? 'active' : ''}
            onClick={() => setActiveTab('custom')}
          >
            自定义 ({characters.filter(c => c.isCustom).length})
          </button>
        </div>

        {/* 工具栏 */}
        <div className="manager-toolbar">
          <button className="toolbar-btn primary" onClick={onCreate}>
            <span>+</span> 新建人物
          </button>
          <button className="toolbar-btn" onClick={() => onReorder?.(characters)}>
            <span>⇅</span> 排序
          </button>
        </div>

        {/* 人物列表 */}
        <div className="character-list">
          {filteredCharacters.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">👤</span>
              <p>暂无人物</p>
              <button className="create-btn" onClick={onCreate}>
                创建第一个人物
              </button>
            </div>
          ) : (
            filteredCharacters.map((char, index) => (
              <div
                key={char.id}
                className={`character-item ${char.selected ? 'selected' : ''} ${char.id === currentCharacter?.id ? 'current' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, char)}
                onDragOver={(e) => handleDragOver(e, char)}
                onDrop={(e) => handleDrop(e, char)}
              >
                {/* 序号 */}
                <div className="item-index">{index + 1}</div>

                {/* 头像 */}
                <div className="item-avatar">
                  {char.thumbnail ? (
                    <img src={char.thumbnail} alt={char.name} />
                  ) : (
                    <span className="avatar-placeholder">🎭</span>
                  )}
                </div>

                {/* 信息 */}
                <div className="item-info">
                  {editingId === char.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleSaveEdit(char)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(char)}
                      autoFocus
                      className="edit-input"
                    />
                  ) : (
                    <>
                      <h3 className="item-name">{char.name || `人物 ${index + 1}`}</h3>
                      <p className="item-path">{char.path}</p>
                    </>
                  )}
                  <div className="item-tags">
                    {char.isCustom && <span className="tag custom">自定义</span>}
                    {char.selected && <span className="tag selected">已选中</span>}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="item-actions">
                  <button 
                    className={`action-btn select ${char.selected ? 'active' : ''}`}
                    onClick={() => onSelect?.(char)}
                    title={char.selected ? '取消选择' : '选择'}
                  >
                    {char.selected ? '✓' : '○'}
                  </button>
                  <button 
                    className="action-btn edit"
                    onClick={() => handleEdit(char)}
                    title="编辑"
                  >
                    ✎
                  </button>
                  <button 
                    className="action-btn delete"
                    onClick={() => setShowConfirmDelete(char.id)}
                    title="删除"
                  >
                    🗑
                  </button>
                </div>

                {/* 删除确认 */}
                {showConfirmDelete === char.id && (
                  <div className="delete-confirm">
                    <p>确定删除此人物?</p>
                    <button onClick={() => { onDelete?.(char.id); setShowConfirmDelete(null); }}>
                      确定
                    </button>
                    <button onClick={() => setShowConfirmDelete(null)}>
                      取消
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* 底部统计 */}
        <div className="manager-footer">
          <span>共 {characters.length} 个人物</span>
          <span>已选 {characters.filter(c => c.selected).length} 个</span>
        </div>
      </div>
    </div>
  )
}

export default CharacterManager
