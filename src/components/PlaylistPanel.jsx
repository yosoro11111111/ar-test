import React, { useState, useEffect, useCallback, useRef } from 'react'
import './PlaylistPanel.css'

// 播放列表面板组件
export const PlaylistPanel = ({
  isOpen,
  onClose,
  actions,
  onPlayAction,
  isMobile
}) => {
  const [playlist, setPlaylist] = useState(() => {
    const saved = localStorage.getItem('actionPlaylist')
    return saved ? JSON.parse(saved) : []
  })
  const [playlistName, setPlaylistName] = useState('我的播放列表')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isLooping, setIsLooping] = useState(false)
  const [isShuffling, setIsShuffling] = useState(false)
  const [showActionSelector, setShowActionSelector] = useState(false)
  const [draggedItem, setDraggedItem] = useState(null)
  const playTimer = useRef(null)

  // 保存播放列表
  useEffect(() => {
    localStorage.setItem('actionPlaylist', JSON.stringify(playlist))
  }, [playlist])

  // 添加动作到播放列表
  const addToPlaylist = useCallback((action) => {
    setPlaylist(prev => [...prev, {
      id: Date.now(),
      actionId: action.id,
      name: action.name,
      icon: action.icon,
      delay: 2000, // 默认延时2秒
      duration: action.duration || 3000
    }])
  }, [])

  // 从播放列表移除
  const removeFromPlaylist = useCallback((itemId) => {
    setPlaylist(prev => prev.filter(item => item.id !== itemId))
  }, [])

  // 更新延时
  const updateDelay = useCallback((itemId, delay) => {
    setPlaylist(prev => prev.map(item =>
      item.id === itemId ? { ...item, delay } : item
    ))
  }, [])

  // 拖拽排序
  const handleDragStart = (e, item) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, targetItem) => {
    e.preventDefault()
    if (!draggedItem || draggedItem.id === targetItem.id) return
  }

  const handleDrop = (e, targetItem) => {
    e.preventDefault()
    if (!draggedItem || draggedItem.id === targetItem.id) return

    const newPlaylist = [...playlist]
    const draggedIndex = newPlaylist.findIndex(item => item.id === draggedItem.id)
    const targetIndex = newPlaylist.findIndex(item => item.id === targetItem.id)

    newPlaylist.splice(draggedIndex, 1)
    newPlaylist.splice(targetIndex, 0, draggedItem)

    setPlaylist(newPlaylist)
    setDraggedItem(null)
  }

  // 播放播放列表
  const playPlaylist = useCallback(async () => {
    if (playlist.length === 0 || isPlaying) return

    setIsPlaying(true)
    setCurrentIndex(0)

    const playNext = async (index) => {
      if (index >= playlist.length) {
        if (isLooping) {
          setCurrentIndex(0)
          playNext(0)
        } else {
          setIsPlaying(false)
          setCurrentIndex(-1)
        }
        return
      }

      const item = playlist[index]
      setCurrentIndex(index)

      // 播放动作
      const action = actions.find(a => a.id === item.actionId)
      if (action) {
        onPlayAction?.(action)
      }

      // 等待动作完成 + 延时
      const waitTime = (item.duration || 3000) + item.delay
      playTimer.current = setTimeout(() => {
        if (isShuffling) {
          const nextIndex = Math.floor(Math.random() * playlist.length)
          playNext(nextIndex)
        } else {
          playNext(index + 1)
        }
      }, waitTime)
    }

    playNext(0)
  }, [playlist, isPlaying, isLooping, isShuffling, actions, onPlayAction])

  // 停止播放
  const stopPlaylist = useCallback(() => {
    clearTimeout(playTimer.current)
    setIsPlaying(false)
    setCurrentIndex(-1)
  }, [])

  // 清空播放列表
  const clearPlaylist = useCallback(() => {
    if (window.confirm('确定要清空播放列表吗？')) {
      stopPlaylist()
      setPlaylist([])
    }
  }, [stopPlaylist])

  // 保存播放列表
  const savePlaylist = useCallback(() => {
    const savedLists = JSON.parse(localStorage.getItem('savedPlaylists') || '[]')
    savedLists.push({
      id: Date.now(),
      name: playlistName,
      items: playlist,
      createdAt: new Date().toISOString()
    })
    localStorage.setItem('savedPlaylists', JSON.stringify(savedLists))
    alert('播放列表已保存！')
  }, [playlist, playlistName])

  // 格式化时间显示
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000)
    return `${seconds}s`
  }

  if (!isOpen) return null

  return (
    <div className="playlist-panel-overlay" onClick={onClose}>
      <div className={`playlist-panel ${isMobile ? 'mobile' : ''}`} onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="playlist-header">
          <input
            type="text"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            className="playlist-name-input"
            placeholder="播放列表名称"
          />
          <div className="header-actions">
            <button className="icon-btn" onClick={savePlaylist} title="保存">
              💾
            </button>
            <button className="icon-btn" onClick={clearPlaylist} title="清空">
              🗑️
            </button>
            <button className="icon-btn close" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        {/* 播放控制 */}
        <div className="playback-controls">
          <button
            className={`control-btn ${isPlaying ? 'active' : ''}`}
            onClick={isPlaying ? stopPlaylist : playPlaylist}
          >
            {isPlaying ? '⏹ 停止' : '▶ 播放'}
          </button>
          <button
            className={`control-btn toggle ${isLooping ? 'active' : ''}`}
            onClick={() => setIsLooping(!isLooping)}
            title="循环播放"
          >
            🔁
          </button>
          <button
            className={`control-btn toggle ${isShuffling ? 'active' : ''}`}
            onClick={() => setIsShuffling(!isShuffling)}
            title="随机播放"
          >
            🔀
          </button>
        </div>

        {/* 播放列表 */}
        <div className="playlist-content">
          {playlist.length === 0 ? (
            <div className="empty-playlist">
              <span className="empty-icon">🎵</span>
              <p>播放列表为空</p>
              <button
                className="add-action-btn"
                onClick={() => setShowActionSelector(true)}
              >
                + 添加动作
              </button>
            </div>
          ) : (
            <>
              <div className="playlist-items">
                {playlist.map((item, index) => (
                  <div
                    key={item.id}
                    className={`playlist-item ${currentIndex === index ? 'playing' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragOver={(e) => handleDragOver(e, item)}
                    onDrop={(e) => handleDrop(e, item)}
                  >
                    <div className="item-number">{index + 1}</div>
                    <div className="item-icon">{item.icon}</div>
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                    </div>
                    <div className="item-delay">
                      <span>延时</span>
                      <input
                        type="range"
                        min="0"
                        max="10000"
                        step="100"
                        value={item.delay}
                        onChange={(e) => updateDelay(item.id, parseInt(e.target.value))}
                        className="delay-slider"
                      />
                      <span className="delay-value">{formatTime(item.delay)}</span>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => removeFromPlaylist(item.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="add-action-btn"
                onClick={() => setShowActionSelector(true)}
              >
                + 添加动作
              </button>
            </>
          )}
        </div>

        {/* 底部统计 */}
        <div className="playlist-footer">
          <span>共 {playlist.length} 个动作</span>
          <span>
            总时长: {formatTime(playlist.reduce((sum, item) =>
              sum + (item.duration || 3000) + item.delay, 0))}
          </span>
        </div>
      </div>

      {/* 动作选择器 */}
      {showActionSelector && (
        <div className="action-selector-overlay" onClick={() => setShowActionSelector(false)}>
          <div className="action-selector" onClick={e => e.stopPropagation()}>
            <div className="selector-header">
              <h3>选择动作</h3>
              <button onClick={() => setShowActionSelector(false)}>×</button>
            </div>
            <div className="action-grid">
              {actions.map(action => (
                <div
                  key={action.id}
                  className="action-option"
                  onClick={() => {
                    addToPlaylist(action)
                    setShowActionSelector(false)
                  }}
                >
                  <span className="option-icon">{action.icon}</span>
                  <span className="option-name">{action.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlaylistPanel
