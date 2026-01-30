import React, { useRef, useEffect, useState } from 'react'

// 深度养成系统组件
const NurturingSystem = () => {
  // 五维感知模型状态
  const [characterStats, setCharacterStats] = useState({
    heartRate: 75, // 心率，正常范围60-100
    energy: 80, // 饱食度/精力，0-100
    mood: 70, // 情绪值，0-100
    resonanceXP: 0, // 共鸣经验
    memoryCapacity: 10 // 记忆容量，随等级提升
  })
  
  const [level, setLevel] = useState(1) // 角色等级
  const [levelTitle, setLevelTitle] = useState('陌生访客') // 等级称号

  // 等级与称号映射
  const levelTitles = [
    { min: 1, max: 10, title: '陌生访客' },
    { min: 11, max: 30, title: '熟稔友人' },
    { min: 31, max: 60, title: '亲密伙伴' },
    { min: 61, max: 90, title: '灵魂共鸣' },
    { min: 91, max: 100, title: '终身契约' }
  ]

  // 更新等级和称号
  useEffect(() => {
    const calculateLevel = () => {
      // 简单的等级计算，每100点经验升1级
      const newLevel = Math.floor(characterStats.resonanceXP / 100) + 1
      setLevel(newLevel)
      
      // 更新等级称号
      const title = levelTitles.find(t => newLevel >= t.min && newLevel <= t.max)
      if (title) {
        setLevelTitle(title.title)
      }
    }

    calculateLevel()
  }, [characterStats.resonanceXP])

  // 模拟属性变化
  useEffect(() => {
    const interval = setInterval(() => {
      setCharacterStats(prev => ({
        ...prev,
        // 心率随机波动
        heartRate: Math.max(60, Math.min(100, prev.heartRate + (Math.random() - 0.5) * 5)),
        // 精力缓慢下降
        energy: Math.max(0, prev.energy - 0.1),
        // 情绪值随机波动
        mood: Math.max(0, Math.min(100, prev.mood + (Math.random() - 0.5) * 2))
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // 增加共鸣经验
  const addResonanceXP = (amount) => {
    setCharacterStats(prev => ({
      ...prev,
      resonanceXP: prev.resonanceXP + amount
    }))
  }

  // 增加精力
  const addEnergy = (amount) => {
    setCharacterStats(prev => ({
      ...prev,
      energy: Math.min(100, prev.energy + amount)
    }))
  }

  // 增加情绪值
  const addMood = (amount) => {
    setCharacterStats(prev => ({
      ...prev,
      mood: Math.min(100, prev.mood + amount)
    }))
  }

  // 渲染属性条
  const renderStatBar = (label, value, min, max, color) => {
    const percentage = ((value - min) / (max - min)) * 100
    
    return (
      <div className="stat-item">
        <div className="stat-label">
          <span>{label}</span>
          <span>{value}</span>
        </div>
        <div className="stat-bar-container">
          <div 
            className="stat-bar" 
            style={{ 
              width: `${percentage}%`,
              backgroundColor: color
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="nurturing-system">
      <div className="character-info">
        <h3>角色状态</h3>
        <div className="level-info">
          <span className="level">等级: {level}</span>
          <span className="level-title">称号: {levelTitle}</span>
        </div>
      </div>
      
      <div className="stats-container">
        {renderStatBar('心率', Math.round(characterStats.heartRate), 60, 100, '#ff6b6b')}
        {renderStatBar('精力', Math.round(characterStats.energy), 0, 100, '#4ecdc4')}
        {renderStatBar('情绪', Math.round(characterStats.mood), 0, 100, '#45b7d1')}
        {renderStatBar('共鸣经验', characterStats.resonanceXP, 0, 100, '#96ceb4')}
        {renderStatBar('记忆容量', characterStats.memoryCapacity, 0, 50, '#ffeaa7')}
      </div>
      
      <div className="interaction-buttons">
        <button onClick={() => addResonanceXP(10)}>互动</button>
        <button onClick={() => addEnergy(20)}>喂食</button>
        <button onClick={() => addMood(15)}>安抚</button>
      </div>

      <style jsx>{`
        .nurturing-system {
          position: absolute;
          bottom: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 20px;
          border-radius: 10px;
          width: 300px;
          z-index: 1000;
        }
        
        .character-info h3 {
          margin-top: 0;
          margin-bottom: 15px;
          text-align: center;
        }
        
        .level-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          font-size: 14px;
        }
        
        .stats-container {
          margin-bottom: 20px;
        }
        
        .stat-item {
          margin-bottom: 15px;
        }
        
        .stat-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 12px;
        }
        
        .stat-bar-container {
          width: 100%;
          height: 10px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 5px;
          overflow: hidden;
        }
        
        .stat-bar {
          height: 100%;
          border-radius: 5px;
          transition: width 0.3s ease;
        }
        
        .interaction-buttons {
          display: flex;
          gap: 10px;
          justify-content: center;
        }
        
        .interaction-buttons button {
          padding: 8px 16px;
          border: none;
          border-radius: 5px;
          background: #646cff;
          color: white;
          cursor: pointer;
          font-size: 12px;
        }
        
        .interaction-buttons button:hover {
          background: #535bf2;
        }
      `}</style>
    </div>
  )
}

export default NurturingSystem