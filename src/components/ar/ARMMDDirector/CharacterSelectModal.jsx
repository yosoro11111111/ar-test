import React, { useState, useEffect } from 'react'
import styles from './CharacterSelectModal.module.css'
import modelList from '../../../models/modelList'

/**
 * 角色选择弹窗 - 网格布局，支持多选，参考App.jsx模型选择
 */
export function CharacterSelectModal({ onSelect, onClose }) {
  const [savedCharacters, setSavedCharacters] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [activeTab, setActiveTab] = useState('library') // 'library' | 'saved'

  // 加载已保存的角色
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedCharacters') || '[]')
    setSavedCharacters(saved)
  }, [])

  // 所有标签
  const allTags = ['#原神', '#星穹铁道', '#崩坏3', '#正太', '#萝莉', '#御姐', '#少年', '#成男', '#成女']

  // 过滤模型列表
  const filteredModels = modelList.filter(model => {
    const matchesSearch = model.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.filename?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(tag => model.tags?.includes(tag))
    return matchesSearch && matchesTags
  })

  // 切换标签
  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  // 切换选择
  const toggleSelect = (charId, charData) => {
    setSelectedIds(prev => {
      const exists = prev.find(item => item.id === charId)
      if (exists) {
        return prev.filter(item => item.id !== charId)
      } else {
        return [...prev, { id: charId, ...charData }]
      }
    })
  }

  // 确认选择
  const confirmSelect = () => {
    onSelect(selectedIds)
    onClose()
  }

  // 获取主题颜色
  const getThemeColor = (index) => {
    const colors = [
      { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', accent: '#a78bfa' },
      { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', accent: '#f472b6' },
      { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', accent: '#60a5fa' },
      { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', accent: '#34d399' },
      { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', accent: '#fbbf24' },
    ]
    return colors[index % colors.length]
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>👤 选择角色</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* 标签页切换 */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'library' ? styles.active : ''}`}
            onClick={() => setActiveTab('library')}
          >
            📚 角色库
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'saved' ? styles.active : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            💾 我的角色 ({savedCharacters.length})
          </button>
        </div>

        {/* 搜索框 */}
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="搜索角色..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* 标签筛选 */}
        <div className={styles.tagsContainer}>
          <div className={styles.tags}>
            {allTags.map(tag => (
              <button
                key={tag}
                className={`${styles.tag} ${selectedTags.includes(tag) ? styles.active : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 角色网格 */}
        <div className={styles.characterGrid}>
          {activeTab === 'library' ? (
            filteredModels.length > 0 ? (
              filteredModels.map((model, index) => {
                const theme = getThemeColor(index)
                const isSelected = selectedIds.find(item => item.id === model.filename)
                return (
                  <div
                    key={index}
                    className={`${styles.characterCard} ${isSelected ? styles.selected : ''}`}
                    onClick={() => toggleSelect(model.filename, {
                      name: model.name,
                      modelUrl: `/models/${model.filename}`,
                      thumbnail: null
                    })}
                    style={{ background: theme.bg }}
                  >
                    <div className={styles.cardOverlay} />
                    <div className={styles.characterAvatar}>
                      {model.avatar || ['🌸', '⭐', '🌙', '💫', '🎀'][index % 5]}
                    </div>
                    <div className={styles.characterInfo}>
                      <span className={styles.characterName}>{model.name}</span>
                      <span className={styles.characterNo}>NO.{String(index + 1).padStart(2, '0')}</span>
                    </div>
                    {isSelected && (
                      <div className={styles.checkmark}>✓</div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className={styles.emptyState}>
                <p>未找到匹配的角色</p>
              </div>
            )
          ) : (
            savedCharacters.length > 0 ? (
              savedCharacters.map((char, index) => {
                const theme = getThemeColor(index)
                const isSelected = selectedIds.find(item => item.id === char.id)
                return (
                  <div
                    key={char.id}
                    className={`${styles.characterCard} ${isSelected ? styles.selected : ''}`}
                    onClick={() => toggleSelect(char.id, {
                      name: char.name,
                      modelUrl: char.modelUrl || char.path,
                      thumbnail: char.thumbnail
                    })}
                    style={{ background: theme.bg }}
                  >
                    <div className={styles.cardOverlay} />
                    <div className={styles.characterAvatar}>
                      {char.thumbnail ? (
                        <img src={char.thumbnail} alt={char.name} />
                      ) : (
                        char.name?.charAt(0) || '?'
                      )}
                    </div>
                    <div className={styles.characterInfo}>
                      <span className={styles.characterName}>{char.name}</span>
                      <span className={styles.characterNo}>自定义角色</span>
                    </div>
                    {isSelected && (
                      <div className={styles.checkmark}>✓</div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className={styles.emptyState}>
                <p>暂无保存的角色</p>
                <p>在AR体验中上传角色后会显示在这里</p>
              </div>
            )
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
