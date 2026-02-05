import React, { useState, useEffect } from 'react'
import styles from './CharacterSelectModal.module.css'

/**
 * 角色选择弹窗 - 网格布局，支持多选
 */
export function CharacterSelectModal({ onSelect, onClose }) {
  const [characters, setCharacters] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  
  // 加载角色库
  useEffect(() => {
    const savedChars = JSON.parse(localStorage.getItem('savedCharacters') || '[]')
    setCharacters(savedChars)
  }, [])
  
  // 切换选择
  const toggleSelect = (charId) => {
    setSelectedIds(prev => 
      prev.includes(charId)
        ? prev.filter(id => id !== charId)
        : [...prev, charId]
    )
  }
  
  // 确认选择
  const confirmSelect = () => {
    const selected = characters.filter(char => selectedIds.includes(char.id))
    onSelect(selected)
    onClose()
  }
  
  // 过滤角色
  const filteredChars = characters.filter(char => 
    char.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>👤 选择角色</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="搜索角色..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.characterGrid}>
          {filteredChars.length > 0 ? (
            filteredChars.map(char => (
              <div
                key={char.id}
                className={`${styles.characterCard} ${selectedIds.includes(char.id) ? styles.selected : ''}`}
                onClick={() => toggleSelect(char.id)}
              >
                <div className={styles.characterThumb}>
                  {char.thumbnail ? (
                    <img src={char.thumbnail} alt={char.name} />
                  ) : (
                    <div className={styles.placeholder}>🎭</div>
                  )}
                  {selectedIds.includes(char.id) && (
                    <div className={styles.checkmark}>✓</div>
                  )}
                </div>
                <span className={styles.characterName}>{char.name}</span>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <p>暂无角色</p>
              <p>请先在人物库中创建角色</p>
            </div>
          )}
        </div>
        
        <div className={styles.footer}>
          <span className={styles.selectedCount}>
            已选择 {selectedIds.length} 个角色
          </span>
          <div className={styles.footerButtons}>
            <button className={styles.cancelBtn} onClick={onClose}>
              取消
            </button>
            <button 
              className={styles.confirmBtn}
              onClick={confirmSelect}
              disabled={selectedIds.length === 0}
            >
              确认添加
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CharacterSelectModal
