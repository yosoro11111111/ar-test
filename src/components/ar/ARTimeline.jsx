import React, { useState, useRef, useEffect, useCallback } from 'react'
import styles from './ARTimeline.module.css'

// 时间轴节点
const TimelineNode = ({ node, isSelected, onClick, onDurationChange }) => {
  return (
    <div 
      className={`${styles.node} ${isSelected ? styles.selected : ''}`}
      style={{ 
        left: `${node.startTime * 10}px`,
        width: `${node.duration * 10}px`
      }}
      onClick={onClick}
    >
      <div className={styles.nodeContent}>
        <span className={styles.nodeIcon}>{node.action.icon}</span>
        <span className={styles.nodeName}>{node.action.name}</span>
      </div>
      <div 
        className={styles.resizeHandle}
        onMouseDown={(e) => {
          e.stopPropagation()
          onDurationChange(node.id, e)
        }}
      />
    </div>
  )
}

export const ARTimeline = ({ 
  actions, 
  onPlayAction,
  currentAction,
  isPlaying,
  onPlayStateChange
}) => {
  const [nodes, setNodes] = useState([])
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(10)
  const [isLooping, setIsLooping] = useState(false)
  const [scale, setScale] = useState(1)
  const timelineRef = useRef(null)
  const playIntervalRef = useRef(null)

  // 添加动作到时间轴
  const addNode = (action) => {
    const lastNode = nodes[nodes.length - 1]
    const startTime = lastNode ? lastNode.startTime + lastNode.duration : 0
    
    const newNode = {
      id: Date.now(),
      action,
      startTime,
      duration: 2, // 默认2秒
      transitionTime: 0.3
    }
    
    setNodes([...nodes, newNode])
    setTotalDuration(Math.max(totalDuration, startTime + 2 + 2))
  }

  // 删除节点
  const removeNode = (nodeId) => {
    setNodes(nodes.filter(n => n.id !== nodeId))
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null)
    }
  }

  // 调整节点时长
  const handleDurationChange = useCallback((nodeId, e) => {
    const startX = e.clientX
    const node = nodes.find(n => n.id === nodeId)
    const startDuration = node.duration
    
    const handleMouseMove = (e) => {
      const deltaX = (e.clientX - startX) / 10 / scale
      const newDuration = Math.max(0.5, startDuration + deltaX)
      
      setNodes(nodes.map(n => 
        n.id === nodeId ? { ...n, duration: newDuration } : n
      ))
    }
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [nodes, scale])

  // 播放时间轴
  const play = () => {
    if (isPlaying) return
    
    onPlayStateChange(true)
    let time = currentTime
    
    playIntervalRef.current = setInterval(() => {
      time += 0.1
      setCurrentTime(time)
      
      // 检查是否需要播放动作
      const activeNode = nodes.find(n => 
        time >= n.startTime && 
        time < n.startTime + n.duration &&
        !n.played
      )
      
      if (activeNode) {
        onPlayAction(activeNode.action)
        activeNode.played = true
      }
      
      // 检查是否结束
      if (time >= totalDuration) {
        if (isLooping) {
          time = 0
          nodes.forEach(n => n.played = false)
        } else {
          pause()
        }
      }
    }, 100)
  }

  // 暂停
  const pause = () => {
    onPlayStateChange(false)
    clearInterval(playIntervalRef.current)
  }

  // 停止
  const stop = () => {
    pause()
    setCurrentTime(0)
    nodes.forEach(n => n.played = false)
  }

  // 清理
  useEffect(() => {
    return () => {
      clearInterval(playIntervalRef.current)
    }
  }, [])

  return (
    <div className={styles.container}>
      {/* 控制栏 */}
      <div className={styles.controls}>
        <div className={styles.playControls}>
          <button 
            className={styles.controlBtn}
            onClick={isPlaying ? pause : play}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <button className={styles.controlBtn} onClick={stop}>
            ⏹️
          </button>
          <button 
            className={`${styles.controlBtn} ${isLooping ? styles.active : ''}`}
            onClick={() => setIsLooping(!isLooping)}
          >
            🔁
          </button>
        </div>
        
        <div className={styles.timeDisplay}>
          {currentTime.toFixed(1)}s / {totalDuration}s
        </div>
        
        <div className={styles.zoomControls}>
          <button 
            className={styles.controlBtn}
            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
          >
            -
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button 
            className={styles.controlBtn}
            onClick={() => setScale(s => Math.min(2, s + 0.1))}
          >
            +
          </button>
        </div>
      </div>

      {/* 时间轴 */}
      <div className={styles.timelineWrapper}>
        {/* 时间刻度 */}
        <div className={styles.ruler}>
          {Array.from({ length: Math.ceil(totalDuration) + 1 }, (_, i) => (
            <div 
              key={i} 
              className={styles.tick}
              style={{ left: `${i * 10 * scale}px` }}
            >
              <span>{i}s</span>
            </div>
          ))}
        </div>
        
        {/* 时间轴轨道 */}
        <div 
          ref={timelineRef}
          className={styles.track}
          style={{ width: `${totalDuration * 10 * scale + 200}px` }}
        >
          {/* 播放头 */}
          <div 
            className={styles.playhead}
            style={{ left: `${currentTime * 10 * scale}px` }}
          />
          
          {/* 节点 */}
          {nodes.map(node => (
            <TimelineNode
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              onClick={() => setSelectedNodeId(node.id)}
              onDurationChange={handleDurationChange}
            />
          ))}
        </div>
      </div>

      {/* 动作库 */}
      <div className={styles.actionLibrary}>
        <h4>动作库</h4>
        <div className={styles.actionList}>
          {actions.slice(0, 20).map(action => (
            <button
              key={action.id}
              className={styles.actionItem}
              onClick={() => addNode(action)}
            >
              <span>{action.icon}</span>
              <span>{action.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 节点详情 */}
      {selectedNodeId && (
        <div className={styles.nodeDetails}>
          {(() => {
            const node = nodes.find(n => n.id === selectedNodeId)
            return node ? (
              <>
                <h4>{node.action.name}</h4>
                <div className={styles.detailRow}>
                  <label>开始时间:</label>
                  <input 
                    type="number" 
                    value={node.startTime}
                    step="0.1"
                    onChange={(e) => {
                      const newTime = parseFloat(e.target.value)
                      setNodes(nodes.map(n => 
                        n.id === selectedNodeId 
                          ? { ...n, startTime: newTime }
                          : n
                      ))
                    }}
                  />
                </div>
                <div className={styles.detailRow}>
                  <label>持续时间:</label>
                  <input 
                    type="number" 
                    value={node.duration}
                    step="0.1"
                    min="0.5"
                    onChange={(e) => {
                      const newDuration = parseFloat(e.target.value)
                      setNodes(nodes.map(n => 
                        n.id === selectedNodeId 
                          ? { ...n, duration: newDuration }
                          : n
                      ))
                    }}
                  />
                </div>
                <button 
                  className={styles.deleteBtn}
                  onClick={() => removeNode(selectedNodeId)}
                >
                  删除节点
                </button>
              </>
            ) : null
          })()}
        </div>
      )}
    </div>
  )
}

export default ARTimeline
