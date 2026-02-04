import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Stars, Cloud, useTexture, Html } from '@react-three/drei'
import * as THREE from 'three'
import { CharacterController } from './CharacterSystem'
import modelList from '../models/modelList'
import StageEffects from './StageEffects'
import StageEffectsPanel from './StageEffectsPanel'
import SceneManager from './SceneManager'
import PosePanel from './PosePanel'
import { loadVRMAAction, getAllVRMAActions, getAllCategories } from '../data/vrmaActions'
import { poseBoneData } from '../data/poseBoneData'
import { sceneTemplates, getSceneTemplate } from '../data/sceneTemplates'
import { furnitureList, furnitureCategories, getFurnitureByCategory, searchFurniture } from '../data/furniture'
import { useGyroscope } from '../hooks/useGyroscope'
import { useVoiceControl } from '../hooks/useVoiceControl'
import ARViewer from './ar/ARViewerNew'

// 导入现代化UI组件
import ModernHeader from './ui/ModernHeader'
import ModernActionBar from './ui/ModernActionBar'
import styles from './styles/ARSystem.module.css'

// ==================== 分步引导组件 ====================
const TutorialGuide = ({ isMobile, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0)
  
  const steps = [
    {
      icon: '👋',
      title: '欢迎使用',
      desc: '简单实用的AR角色展示应用。右侧标签栏可快速访问所有功能。',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      demo: 'pulse'
    },
    {
      icon: '🤏',
      title: '双指缩放',
      desc: '使用双指捏合手势来放大或缩小角色。这是唯一的必需手势操作。',
      color: 'linear-gradient(135deg, #ffd93d 0%, #ffb347 100%)',
      demo: 'pinch-zoom'
    },
    {
      icon: '🎭',
      title: '动作面板',
      desc: '点击右侧"动作"标签打开动作面板，选择动作让角色表演。',
      color: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
      demo: 'action-panel'
    },
    {
      icon: '📸',
      title: '拍照分享',
      desc: '点击"拍照"标签可截取精彩瞬间，保存到相册或分享给朋友。',
      color: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
      demo: 'tools'
    },
    {
      icon: '⭐',
      title: '收藏动作',
      desc: '喜欢的动作可以收藏，在"收藏"标签中快速找到并使用。',
      color: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
      demo: 'pulse'
    },
    {
      icon: '🎨',
      title: '姿势系统',
      desc: '点击"姿势"标签打开姿势面板，让角色摆出各种造型。',
      color: 'linear-gradient(135deg, #6BCB77 0%, #4CAF50 100%)',
      demo: 'pulse'
    },
    {
      icon: '⚙️',
      title: '设置选项',
      desc: '在"设置"中可以调整角色大小、透明度等参数，定制你的体验。',
      color: 'linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%)',
      demo: 'pulse'
    }
  ]
  
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onClose()
    }
  }
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  const step = steps[currentStep]
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      backdropFilter: 'blur(20px)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.98) 0%, rgba(22, 33, 62, 0.98) 100%)',
        borderRadius: '32px',
        padding: isMobile ? '24px' : '40px',
        maxWidth: '480px',
        width: '90%',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 进度指示器 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'rgba(255,255,255,0.1)'
        }}>
          <div style={{
            height: '100%',
            width: `${((currentStep + 1) / steps.length) * 100}%`,
            background: 'linear-gradient(90deg, #ff6b9d 0%, #00d4ff 100%)',
            transition: 'width 0.5s ease'
          }} />
        </div>
        
        {/* 步骤指示点 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '24px',
          marginTop: '8px'
        }}>
          {steps.map((_, index) => (
            <div
              key={index}
              style={{
                width: index === currentStep ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: index === currentStep 
                  ? 'linear-gradient(135deg, #ff6b9d 0%, #00d4ff 100%)'
                  : index < currentStep ? '#00d4ff' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
        
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >×</button>
        
        {/* 演示动画区域 */}
        <div style={{
          width: '100%',
          height: isMobile ? '160px' : '200px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* 背景装饰 */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: step.color,
            opacity: 0.1
          }} />
          
          {/* 动态演示 */}
          <div style={{
            width: isMobile ? '80px' : '100px',
            height: isMobile ? '80px' : '100px',
            borderRadius: '50%',
            background: step.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '40px' : '50px',
            animation: step.demo === 'single-tap' ? 'tapPulse 1.5s ease-in-out infinite' :
                      step.demo === 'two-finger-move' ? 'moveLeftRight 2s ease-in-out infinite' :
                      step.demo === 'pinch-zoom' ? 'pinchZoom 2s ease-in-out infinite' :
                      step.demo === 'action-panel' ? 'slideUp 1.5s ease-in-out infinite' :
                      'pulse 2s ease-in-out infinite',
            boxShadow: `0 0 40px ${step.color.includes('ff6b9d') ? 'rgba(255,107,157,0.5)' : 
                       step.color.includes('00d4ff') ? 'rgba(0,212,255,0.5)' :
                       step.color.includes('ffd93d') ? 'rgba(255,217,61,0.5)' :
                       step.color.includes('a855f7') ? 'rgba(168,85,247,0.5)' :
                       'rgba(34,211,238,0.5)'}`
          }}>
            {step.icon}
          </div>
          
          {/* 手势指示 */}
          {step.demo === 'single-tap' && (
            <div style={{
              position: 'absolute',
              width: '30px',
              height: '30px',
              border: '2px solid white',
              borderRadius: '50%',
              animation: 'ripple 1.5s ease-out infinite'
            }} />
          )}
          
          {step.demo === 'two-finger-move' && (
            <>
              <div style={{
                position: 'absolute',
                width: '20px',
                height: '20px',
                background: 'white',
                borderRadius: '50%',
                left: '30%',
                animation: 'fingerMove 2s ease-in-out infinite'
              }} />
              <div style={{
                position: 'absolute',
                width: '20px',
                height: '20px',
                background: 'white',
                borderRadius: '50%',
                right: '30%',
                animation: 'fingerMove 2s ease-in-out infinite reverse'
              }} />
            </>
          )}
        </div>
        
        {/* 内容 */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{
            color: 'white',
            margin: '0 0 12px 0',
            fontSize: isMobile ? '22px' : '26px',
            fontWeight: 'bold'
          }}>
            {step.title}
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.7)',
            margin: 0,
            fontSize: isMobile ? '14px' : '15px',
            lineHeight: '1.6'
          }}>
            {step.desc}
          </p>
        </div>
        
        {/* 按钮组 */}
        <div style={{
          display: 'flex',
          gap: '12px'
        }}>
          {currentStep > 0 && (
            <button
              onClick={prevStep}
              style={{
                flex: 1,
                padding: '14px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '14px',
                color: 'white',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              上一步
            </button>
          )}
          <button
            onClick={nextStep}
            style={{
              flex: currentStep === 0 ? 1 : 2,
              padding: '14px',
              background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
              border: 'none',
              borderRadius: '14px',
              color: 'white',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 24px rgba(255, 107, 157, 0.4)'
            }}
          >
            {currentStep === steps.length - 1 ? '开始游戏 🎮' : '下一步 →'}
          </button>
        </div>
        
        {/* 跳过按钮 */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: '12px',
            padding: '10px',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          跳过教程
        </button>
      </div>
      
      {/* 动画样式 */}
      <style>{`
        @keyframes tapPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.9); }
        }
        @keyframes moveLeftRight {
          0%, 100% { transform: translateX(-20px); }
          50% { transform: translateX(20px); }
        }
        @keyframes pinchZoom {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
        @keyframes slideUp {
          0%, 100% { transform: translateY(10px); opacity: 0.7; }
          50% { transform: translateY(-10px); opacity: 1; }
        }
        @keyframes ripple {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes fingerMove {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(40px); }
        }
        @keyframes longPress {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.95); opacity: 0.8; }
        }
        @keyframes playlistSlide {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(20px); }
        }
      `}</style>
    </div>
  )
}

// ==================== 移动端调试日志 Hook ====================
const useDebugLog = () => {
  const [logs, setLogs] = useState([])
  
  const addLog = useCallback((message) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev.slice(-19), `[${timestamp}] ${message}`])
  }, [])
  
  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])
  
  return { logs, addLog, clearLogs }
}

// ==================== 位置控制面板组件 ====================
const PositionControlPanel = ({ 
  isOpen, 
  onClose, 
  characterPositions, 
  onPositionChange, 
  selectedCharacterIndex,
  isMobile 
}) => {
  const [controlMode, setControlMode] = useState('drag') // drag, joystick, precise
  const [joystickActive, setJoystickActive] = useState(false)
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 })
  const joystickRef = useRef(null)
  
  if (!isOpen) return null

  const currentPos = characterPositions[selectedCharacterIndex] || [0, 0, 0]

  // 方式1: 直接拖拽（在3D场景中）
  const renderDragMode = () => (
    <div style={{
      padding: '20px',
      background: 'rgba(0,212,255,0.1)',
      borderRadius: '16px',
      border: '2px solid rgba(0,212,255,0.3)',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>👆</div>
      <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '8px' }}>
        直接拖拽模式
      </div>
      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
        在3D场景中直接点击并拖动角色<br/>
        角色会跟随手指/鼠标移动
      </div>
    </div>
  )

  // 方式2: 虚拟摇杆
  const handleJoystickStart = (e) => {
    e.preventDefault()
    setJoystickActive(true)
    updateJoystickPosition(e)
  }

  const handleJoystickMove = (e) => {
    if (!joystickActive) return
    e.preventDefault()
    updateJoystickPosition(e)
  }

  const handleJoystickEnd = () => {
    setJoystickActive(false)
    setJoystickPos({ x: 0, y: 0 })
  }

  const updateJoystickPosition = (e) => {
    const touch = e.touches ? e.touches[0] : e
    const rect = joystickRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    let x = touch.clientX - centerX
    let y = touch.clientY - centerY
    
    // 限制在圆形范围内
    const maxRadius = 60
    const distance = Math.sqrt(x * x + y * y)
    if (distance > maxRadius) {
      x = (x / distance) * maxRadius
      y = (y / distance) * maxRadius
    }
    
    setJoystickPos({ x, y })
    
    // 更新角色位置
    const sensitivity = 0.02
    onPositionChange(selectedCharacterIndex, [
      currentPos[0] + x * sensitivity,
      currentPos[1],
      currentPos[2] + y * sensitivity
    ])
  }

  const renderJoystickMode = () => (
    <div style={{
      padding: '20px',
      background: 'rgba(102,126,234,0.1)',
      borderRadius: '16px',
      border: '2px solid rgba(102,126,234,0.3)',
      textAlign: 'center'
    }}>
      <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '16px' }}>
        虚拟摇杆控制
      </div>
      <div
        ref={joystickRef}
        style={{
          width: '150px',
          height: '150px',
          margin: '0 auto',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          position: 'relative',
          border: '3px solid rgba(102,126,234,0.5)',
          touchAction: 'none'
        }}
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        onMouseDown={handleJoystickStart}
        onMouseMove={handleJoystickMove}
        onMouseUp={handleJoystickEnd}
        onMouseLeave={handleJoystickEnd}
      >
        <div style={{
          width: '50px',
          height: '50px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '50%',
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${joystickPos.x}px), calc(-50% + ${joystickPos.y}px))`,
          boxShadow: '0 4px 15px rgba(102,126,234,0.5)',
          transition: joystickActive ? 'none' : 'transform 0.2s ease'
        }} />
      </div>
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '12px' }}>
        拖动摇杆移动角色
      </div>
    </div>
  )

  // 方式3: 精确数值输入
  const renderPreciseMode = () => (
    <div style={{
      padding: '20px',
      background: 'rgba(255,107,107,0.1)',
      borderRadius: '16px',
      border: '2px solid rgba(255,107,107,0.3)'
    }}>
      <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>
        精确数值控制
      </div>
      {['X', 'Y', 'Z'].map((axis, idx) => (
        <div key={axis} style={{ marginBottom: '16px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ 
              color: axis === 'X' ? '#ff6b6b' : axis === 'Y' ? '#4ecdc4' : '#45b7d1',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              {axis} 轴
            </span>
            <span style={{ color: 'white', fontSize: '14px' }}>
              {currentPos[idx].toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={-5}
            max={5}
            step={0.1}
            value={currentPos[idx]}
            onChange={(e) => {
              const newPos = [...currentPos]
              newPos[idx] = parseFloat(e.target.value)
              onPositionChange(selectedCharacterIndex, newPos)
            }}
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '4px',
              background: 'rgba(255,255,255,0.1)',
              outline: 'none',
              WebkitAppearance: 'none'
            }}
          />
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginTop: '8px',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => {
                const newPos = [...currentPos]
                newPos[idx] = Math.max(-5, newPos[idx] - 0.5)
                onPositionChange(selectedCharacterIndex, newPos)
              }}
              style={{
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              -0.5
            </button>
            <button
              onClick={() => {
                const newPos = [...currentPos]
                newPos[idx] = 0
                onPositionChange(selectedCharacterIndex, newPos)
              }}
              style={{
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              重置
            </button>
            <button
              onClick={() => {
                const newPos = [...currentPos]
                newPos[idx] = Math.min(5, newPos[idx] + 0.5)
                onPositionChange(selectedCharacterIndex, newPos)
              }}
              style={{
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              +0.5
            </button>
          </div>
        </div>
      ))}
    </div>
  )

  const modes = [
    { id: 'drag', name: '拖拽', icon: '👆', color: '#00d4ff' },
    { id: 'joystick', name: '摇杆', icon: '🎮', color: '#667eea' },
    { id: 'precise', name: '精确', icon: '📐', color: '#ff6b6b' }
  ]

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
      zIndex: 2000,
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
        borderRadius: '24px',
        padding: isMobile ? '20px' : '32px',
        maxWidth: '500px',
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
          marginBottom: '24px'
        }}>
          <div>
            <h2 style={{ 
              color: 'white', 
              margin: 0, 
              fontSize: isMobile ? '20px' : '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              📍 位置控制
              <span style={{
                fontSize: isMobile ? '12px' : '14px',
                color: 'rgba(255,255,255,0.6)',
                fontWeight: 'normal'
              }}>
                角色{selectedCharacterIndex + 1}
              </span>
            </h2>
          </div>
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
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >×</button>
        </div>

        {/* 模式选择 */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '24px',
          justifyContent: 'center'
        }}>
          {modes.map(mode => (
            <button
              key={mode.id}
              onClick={() => setControlMode(mode.id)}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: controlMode === mode.id 
                  ? `linear-gradient(135deg, ${mode.color} 0%, ${mode.color}dd 100%)`
                  : 'rgba(255,255,255,0.1)',
                border: `2px solid ${controlMode === mode.id ? mode.color : 'transparent'}`,
                borderRadius: '12px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.3s ease'
              }}
            >
              <span style={{ fontSize: '24px' }}>{mode.icon}</span>
              <span>{mode.name}</span>
            </button>
          ))}
        </div>

        {/* 控制区域 */}
        {controlMode === 'drag' && renderDragMode()}
        {controlMode === 'joystick' && renderJoystickMode()}
        {controlMode === 'precise' && renderPreciseMode()}

        {/* 当前位置显示 */}
        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-around'
        }}>
          {['X', 'Y', 'Z'].map((axis, idx) => (
            <div key={axis} style={{ textAlign: 'center' }}>
              <div style={{ 
                color: axis === 'X' ? '#ff6b6b' : axis === 'Y' ? '#4ecdc4' : '#45b7d1',
                fontSize: '12px',
                marginBottom: '4px'
              }}>
                {axis}
              </div>
              <div style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
                {currentPos[idx].toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* 快捷操作 */}
        <div style={{
          marginTop: '20px',
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={() => onPositionChange(selectedCharacterIndex, [0, 0, 0])}
            style={{
              flex: 1,
              padding: '12px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '10px',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            🎯 回到中心
          </button>
          <button
            onClick={() => {
              const positions = [[-1.5, 0, 0], [0, 0, 0], [1.5, 0, 0]]
              onPositionChange(selectedCharacterIndex, positions[selectedCharacterIndex])
            }}
            style={{
              flex: 1,
              padding: '12px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '10px',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            🔄 默认位置
          </button>
        </div>
      </div>
    </div>
  )
}

// ==================== 移动端骨骼拖动组件（支持触摸和鼠标） ====================
const MobileBoneDragger = ({ bone, onBoneChange, onClose }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [panelPos, setPanelPos] = useState({ x: window.innerWidth / 2 - 140, y: window.innerHeight / 2 - 100 })
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  
  if (!bone?.bone) return null

  // 面板拖动 - 触摸
  const handleTouchStart = (e) => {
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({ x: touch.clientX - panelPos.x, y: touch.clientY - panelPos.y })
  }

  const handleTouchMove = (e) => {
    if (!isDragging) return
    e.preventDefault()
    const touch = e.touches[0]
    setPanelPos({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // 面板拖动 - 鼠标
  const handleMouseDown = (e) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - panelPos.x, y: e.clientY - panelPos.y })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    setPanelPos({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // 骨骼旋转 - 触摸
  const handleRotateStart = (e) => {
    const touch = e.touches[0]
    bone.bone.userData.rotateStartX = touch.clientX
    bone.bone.userData.rotateStartY = touch.clientY
    bone.bone.userData.startRotX = bone.bone.rotation.x
    bone.bone.userData.startRotY = bone.bone.rotation.y
  }

  const handleRotateMove = (e) => {
    e.preventDefault()
    const touch = e.touches[0]
    if (!bone.bone.userData.rotateStartX) return
    
    const deltaX = touch.clientX - bone.bone.userData.rotateStartX
    const deltaY = touch.clientY - bone.bone.userData.rotateStartY
    
    // 限制旋转角度在 ±90度 范围内
    const MAX_ROTATION = Math.PI / 2
    const newRotY = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, 
      bone.bone.userData.startRotY + deltaX * 0.01))
    const newRotX = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, 
      bone.bone.userData.startRotX + deltaY * 0.01))
    
    bone.bone.rotation.y = newRotY
    bone.bone.rotation.x = newRotX
    
    onBoneChange?.(bone.name, bone.bone.rotation)
    // 强制刷新
    setRotation({ x: newRotX, y: newRotY })
  }

  // 骨骼旋转 - 鼠标
  const handleRotateMouseDown = (e) => {
    bone.bone.userData.rotateStartX = e.clientX
    bone.bone.userData.rotateStartY = e.clientY
    bone.bone.userData.startRotX = bone.bone.rotation.x
    bone.bone.userData.startRotY = bone.bone.rotation.y
    bone.bone.userData.isRotating = true
  }

  const handleRotateMouseMove = (e) => {
    if (!bone.bone.userData.isRotating) return
    
    const deltaX = e.clientX - bone.bone.userData.rotateStartX
    const deltaY = e.clientY - bone.bone.userData.rotateStartY
    
    // 限制旋转角度在 ±90度 范围内
    const MAX_ROTATION = Math.PI / 2
    const newRotY = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, 
      bone.bone.userData.startRotY + deltaX * 0.01))
    const newRotX = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, 
      bone.bone.userData.startRotX + deltaY * 0.01))
    
    bone.bone.rotation.y = newRotY
    bone.bone.rotation.x = newRotX
    
    onBoneChange?.(bone.name, bone.bone.rotation)
    setRotation({ x: newRotX, y: newRotY })
  }

  const handleRotateMouseUp = () => {
    bone.bone.userData.isRotating = false
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: panelPos.x,
        top: panelPos.y,
        width: '280px',
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,50,0.95) 100%)',
        borderRadius: '20px',
        padding: '16px',
        zIndex: 10000,
        border: `3px solid ${bone.color}`,
        boxShadow: `0 8px 32px ${bone.color}50`,
        touchAction: 'none'
      }}
    >
      {/* 拖动标题栏 */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 0',
          borderBottom: `2px solid ${bone.color}50`,
          marginBottom: '12px',
          cursor: 'move',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>✋</span>
          <span style={{ color: bone.color, fontWeight: 'bold', fontSize: '16px' }}>
            {bone.label}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer'
          }}
        >
          ×
        </button>
      </div>

      {/* 拖动旋转区域 */}
      <div
        onTouchStart={handleRotateStart}
        onTouchMove={handleRotateMove}
        onTouchEnd={() => { bone.bone.userData.rotateStartX = null }}
        onMouseDown={handleRotateMouseDown}
        onMouseMove={handleRotateMouseMove}
        onMouseUp={handleRotateMouseUp}
        onMouseLeave={handleRotateMouseUp}
        style={{
          background: `radial-gradient(circle, ${bone.color}30 0%, transparent 70%)`,
          borderRadius: '16px',
          padding: '40px 20px',
          textAlign: 'center',
          touchAction: 'none',
          border: `2px dashed ${bone.color}60`,
          cursor: 'grab',
          userSelect: 'none'
        }}
      >
        <div style={{ fontSize: '40px', marginBottom: '8px' }}>🔄</div>
        <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>
          在此区域拖动旋转
        </div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '8px' }}>
          左右拖动 = 水平旋转<br/>
          上下拖动 = 垂直旋转
        </div>
        {/* 显示当前旋转角度 */}
        <div style={{ 
          color: bone.color, 
          fontSize: '11px', 
          marginTop: '8px',
          fontFamily: 'monospace'
        }}>
          X: {(rotation.x * 180 / Math.PI).toFixed(1)}° | Y: {(rotation.y * 180 / Math.PI).toFixed(1)}°
        </div>
      </div>

      {/* 重置按钮 */}
      <button
        onClick={() => {
          bone.bone.rotation.set(0, 0, 0)
          onBoneChange?.(bone.name, bone.bone.rotation)
        }}
        style={{
          width: '100%',
          marginTop: '12px',
          padding: '12px',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '10px',
          color: 'white',
          fontSize: '14px',
          cursor: 'pointer'
        }}
      >
        🔄 重置旋转
      </button>
    </div>
  )
}

// ==================== 骨骼编辑器组件 (支持桌面端和移动端) ====================
const BoneEditor = ({ characters, selectedCharacterIndex, onBoneChange, isMobile }) => {
  const [selectedBone, setSelectedBone] = useState(null)
  const [bones, setBones] = useState([])
  const [hasVRM, setHasVRM] = useState(false)
  
  const character = characters[selectedCharacterIndex]
  // 尝试多种可能的属性名来获取模型标识
  const selectedFile = character?.path || character?.localPath || character?.filename || character?.name
  
  const mainBones = [
    { name: 'head', label: '头部', color: '#ff6b6b' },
    { name: 'neck', label: '颈部', color: '#ff9f43' },
    { name: 'chest', label: '胸部', color: '#feca57' },
    { name: 'spine', label: '脊柱', color: '#48dbfb' },
    { name: 'hips', label: '臀部', color: '#54a0ff' },
    { name: 'leftShoulder', label: '左肩', color: '#5f27cd' },
    { name: 'rightShoulder', label: '右肩', color: '#5f27cd' },
    { name: 'leftUpperArm', label: '左上臂', color: '#00d2d3' },
    { name: 'rightUpperArm', label: '右上臂', color: '#00d2d3' },
    { name: 'leftLowerArm', label: '左前臂', color: '#1dd1a1' },
    { name: 'rightLowerArm', label: '右前臂', color: '#1dd1a1' },
    { name: 'leftHand', label: '左手', color: '#ff9ff3' },
    { name: 'rightHand', label: '右手', color: '#ff9ff3' },
    { name: 'leftUpperLeg', label: '左大腿', color: '#ff6b6b' },
    { name: 'rightUpperLeg', label: '右大腿', color: '#ff6b6b' },
    { name: 'leftLowerLeg', label: '左小腿', color: '#feca57' },
    { name: 'rightLowerLeg', label: '右小腿', color: '#feca57' },
    { name: 'leftFoot', label: '左脚', color: '#48dbfb' },
    { name: 'rightFoot', label: '右脚', color: '#48dbfb' },
  ]
  
  // 从 window.vrmModels 获取 VRM 模型
  useEffect(() => {
    const checkVRM = () => {
      const vrmModel = window.vrmModels?.[selectedFile]
      if (vrmModel?.humanoid) {
        setHasVRM(true)
        const boneList = []
        mainBones.forEach(({ name, label, color }) => {
          try {
            const bone = vrmModel.humanoid.getNormalizedBoneNode(name)
            if (bone) {
              boneList.push({ name, label, color, bone })
            }
          } catch (e) {
            // 忽略错误
          }
        })
        setBones(boneList)
      } else {
        setHasVRM(false)
        setBones([])
      }
    }
    
    checkVRM()
    // 每秒检查一次，等待 VRM 加载完成
    const interval = setInterval(checkVRM, 1000)
    return () => clearInterval(interval)
  }, [selectedFile])
  
  const handleBoneRotate = (boneName, axis, delta) => {
    const bone = bones.find(b => b.name === boneName)?.bone
    if (!bone) return
    
    bone.rotation[axis] += delta
    onBoneChange?.(boneName, bone.rotation)
  }
  
  if (!character) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        background: 'rgba(0,0,0,0.95)',
        borderRadius: '20px 20px 0 0',
        padding: '20px',
        zIndex: 9999,
        border: '2px solid rgba(0,212,255,0.5)',
        borderBottom: 'none',
        boxShadow: '0 -4px 30px rgba(0,0,0,0.7)',
        textAlign: 'center',
        color: '#888'
      }}>
        <div style={{ color: '#00d4ff', fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
          🦴 骨骼编辑器
        </div>
        <div>请先选择或加载一个角色</div>
      </div>
    )
  }
  
  return (
    <div style={{
      position: 'fixed',
      bottom: isMobile ? '0' : 'auto',
      top: isMobile ? 'auto' : '80px',
      left: isMobile ? '0' : '20px',
      right: isMobile ? '0' : 'auto',
      width: isMobile ? 'auto' : '320px',
      maxHeight: isMobile ? '80vh' : 'calc(100vh - 100px)',
      background: 'rgba(0,0,0,0.95)',
      borderRadius: isMobile ? '20px 20px 0 0' : '16px',
      padding: isMobile ? '16px 16px 120px 16px' : '20px',
      zIndex: 9999,
      border: '2px solid rgba(0,212,255,0.5)',
      borderBottom: isMobile ? 'none' : '2px solid rgba(0,212,255,0.5)',
      boxShadow: '0 -4px 30px rgba(0,0,0,0.7)',
      overflowY: 'auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        borderBottom: '2px solid rgba(255,255,255,0.2)',
        paddingBottom: '10px'
      }}>
        <span style={{ color: '#00d4ff', fontWeight: 'bold', fontSize: '16px' }}>
          🦴 骨骼编辑器
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#888', fontSize: '12px' }}>
            {!hasVRM ? '加载中...' : `${bones.length}个骨骼`}
          </span>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('closeBoneEditor'))}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '18px',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="关闭骨骼编辑器"
          >
            ×
          </button>
        </div>
      </div>
      
      {/* 加载提示 */}
      {!hasVRM && (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          color: '#888'
        }}>
          <div style={{ marginBottom: '10px' }}>⏳ 等待 VRM 模型加载...</div>
          <div style={{ fontSize: '12px' }}>请稍候，模型加载完成后即可编辑骨骼</div>
        </div>
      )}
      
      {/* 骨骼列表 - 网格布局 */}
      {hasVRM && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          marginBottom: '12px'
        }}>
          {bones.map(({ name, label, color }) => (
            <button
              key={name}
              onClick={() => setSelectedBone(selectedBone === name ? null : name)}
              style={{
                padding: '10px 4px',
                background: selectedBone === name ? color : 'rgba(255,255,255,0.1)',
                border: `2px solid ${selectedBone === name ? color : 'transparent'}`,
                borderRadius: '8px',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      
      {/* 选中骨骼的控制 - 移动端简化版拖动弹框 */}
      {selectedBone && (
        <MobileBoneDragger
          bone={bones.find(b => b.name === selectedBone)}
          onBoneChange={onBoneChange}
          onClose={() => setSelectedBone(null)}
        />
      )}
    </div>
  )
}

// ==================== 移动端检测 Hook ====================
const useMobileDetect = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  return { isMobile, isTablet, isDesktop: !isMobile && !isTablet }
}

// ==================== 滤镜CSS生成函数 ====================
const getFilterCSS = (filter) => {
  if (!filter?.enabled) return 'none'

  const intensity = (filter.intensity || 50) / 100

  switch (filter.type) {
    case 'warm':
      return `sepia(${intensity * 0.5}) saturate(${1 + intensity * 0.3}) hue-rotate(-10deg) brightness(${1 + intensity * 0.1})`
    case 'cool':
      return `saturate(${1 + intensity * 0.2}) hue-rotate(${intensity * 20}deg) brightness(${1 + intensity * 0.05})`
    case 'vintage':
      return `sepia(${intensity * 0.8}) contrast(${1 + intensity * 0.2}) brightness(${1 - intensity * 0.1}) saturate(${1 - intensity * 0.3})`
    case 'noir':
      return `grayscale(${intensity}) contrast(${1 + intensity * 0.5}) brightness(${1 - intensity * 0.1})`
    case 'dreamy':
      return `saturate(${1 + intensity * 0.4}) brightness(${1 + intensity * 0.15}) contrast(${1 - intensity * 0.1}) blur(${intensity * 2}px)`
    case 'sunset':
      return `sepia(${intensity * 0.4}) saturate(${1 + intensity * 0.5}) hue-rotate(-${intensity * 30}deg) brightness(${1 + intensity * 0.1})`
    case 'cyber':
      return `saturate(${1 + intensity * 0.8}) hue-rotate(${intensity * 40}deg) contrast(${1 + intensity * 0.3}) brightness(${1 + intensity * 0.1})`
    default:
      return 'none'
  }
}

// ==================== 1. 粒子背景系统 ====================
const ParticleField = ({ enabled = false, type = 'snow' }) => {
  const particlesRef = useRef()
  const particleCount = enabled ? 200 : 0
  
  // 根据粒子类型设置颜色
  const particleColors = {
    snow: '#ffffff',
    rain: '#54a0ff',
    stars: '#ffd700',
    fireflies: '#7bed9f',
    petals: '#ff9ecd',
    bubbles: '#00d4ff'
  }
  
  const positions = useMemo(() => {
    if (!enabled) return new Float32Array(0)
    const pos = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20
    }
    return pos
  }, [enabled, particleCount])
  
  useFrame((state) => {
    if (particlesRef.current && enabled) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05
      particlesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1
    }
  })
  
  if (!enabled) return null
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={particleColors[type] || particleColors.snow}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

// ==================== 2. 动态背景渐变 ====================
const DynamicBackground = () => {
  const meshRef = useRef()
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.time.value = state.clock.elapsedTime
    }
  })
  
  const shaderMaterial = useMemo(() => ({
    uniforms: {
      time: { value: 0 },
      color1: { value: new THREE.Color('#ff9ecd') },
      color2: { value: new THREE.Color('#7c3aed') },
      color3: { value: new THREE.Color('#4facfe') }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 color1;
      uniform vec3 color2;
      uniform vec3 color3;
      varying vec2 vUv;
      
      void main() {
        float noise = sin(vUv.x * 10.0 + time) * cos(vUv.y * 10.0 + time * 0.5) * 0.5 + 0.5;
        vec3 color = mix(color1, color2, vUv.y + sin(time * 0.3) * 0.2);
        color = mix(color, color3, noise * 0.3);
        gl_FragColor = vec4(color, 1.0);
      }
    `
  }), [])
  
  return (
    <mesh ref={meshRef} position={[0, 0, -10]}>
      <planeGeometry args={[30, 20]} />
      <shaderMaterial {...shaderMaterial} />
    </mesh>
  )
}

// ==================== 3. 浮动装饰元素 ====================
const FloatingDecorations = () => {
  const groupRef = useRef()
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        child.position.y = Math.sin(state.clock.elapsedTime + i) * 0.3
        child.rotation.y += 0.01
        child.rotation.z = Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.1
      })
    }
  })
  
  return (
    <group ref={groupRef}>
      {[...Array(8)].map((_, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(i * Math.PI * 0.25) * 3,
            Math.sin(i * 0.5) * 0.5,
            Math.sin(i * Math.PI * 0.25) * 3 - 2
          ]}
        >
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial
            color={['#ff9ecd', '#ffd93d', '#4facfe', '#a8e6cf'][i % 4]}
            emissive={['#ff9ecd', '#ffd93d', '#4facfe', '#a8e6cf'][i % 4]}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  )
}

// ==================== 4. 角色卡槽组件（优化版） ====================
const CharacterSlot = ({ character, index, onSelect, onRemove, isSelected, isMobile }) => {
  const [isPressed, setIsPressed] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  
  // 缩小角色按钮尺寸
  const slotSize = isMobile ? { width: '40px', height: '40px' } : { width: '70px', height: '70px' }
  const fontSize = isMobile ? '16px' : '24px'
  
  return (
    <div
      onClick={() => onSelect(index)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onMouseEnter={() => character && setShowPreview(true)}
      style={{
        ...slotSize,
        borderRadius: '28px',
        background: isSelected 
          ? 'linear-gradient(135deg, #ff9ecd 0%, #ff6b9d 50%, #c44569 100%)' 
          : 'linear-gradient(145deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)',
        border: isSelected 
          ? '3px solid #ffb8d0' 
          : '2px solid rgba(255, 255, 255, 0.4)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        position: 'relative',
        boxShadow: isSelected 
          ? '0 10px 40px rgba(255, 107, 157, 0.7), inset 0 2px 16px rgba(255, 255, 255, 0.5), 0 0 0 4px rgba(255, 184, 208, 0.4)' 
          : '0 8px 24px rgba(0, 0, 0, 0.25), inset 0 2px 10px rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(15px)',
        transform: isPressed ? 'scale(0.9) translateY(6px)' : 'scale(1) translateY(0)',
        overflow: 'hidden'
      }}
    >
      {/* 流光效果 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
        animation: isSelected ? 'shimmer 2s infinite' : 'none'
      }} />
      
      {character ? (
        <>
          <div style={{ 
            fontSize: '40px',
            filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.4))',
            animation: isSelected ? 'bounce 1.5s ease-in-out infinite' : 'float 3s ease-in-out infinite',
            transform: 'scale(1.2)',
            zIndex: 1
          }}>🌸</div>
          
          {/* 选中指示器 */}
          {isSelected && (
            <div style={{
              position: 'absolute',
              top: '-10px',
              right: '-10px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ffd93d 0%, #ff6b6b 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              boxShadow: '0 4px 16px rgba(255, 217, 61, 0.6)',
              animation: 'pulse 1.2s ease-in-out infinite',
              zIndex: 2
            }}>⭐</div>
          )}
          
          {/* 删除按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove(index)
            }}
            style={{
              position: 'absolute',
              top: '-10px',
              left: '-10px',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
              color: 'white',
              border: '3px solid white',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(238, 90, 111, 0.6)',
              transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
              fontWeight: 'bold',
              zIndex: 2
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.3) rotate(180deg)'
              e.target.style.boxShadow = '0 6px 30px rgba(238, 90, 111, 0.8)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1) rotate(0deg)'
              e.target.style.boxShadow = '0 4px 20px rgba(238, 90, 111, 0.6)'
            }}
          >
            ×
          </button>
          
          {/* 预览提示 */}
          {showPreview && !isSelected && (
            <div style={{
              position: 'absolute',
              bottom: '-30px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '11px',
              whiteSpace: 'nowrap',
              zIndex: 10,
              animation: 'fadeIn 0.3s ease'
            }}>
              {character.name}
            </div>
          )}
        </>
      ) : (
        <div style={{ 
          fontSize: '44px', 
          opacity: 0.7,
          filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.3))',
          animation: 'float 3s ease-in-out infinite'
        }}>💫</div>
      )}
    </div>
  )
}

// ==================== 4.5 工具栏按钮组件（带悬停提示和动画） ====================
const ToolbarButton = ({ onClick, disabled, icon, gradient, shadowColor, isActive, isMobile, label, badge, badgeColor, pulse }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        style={{
          width: isMobile ? '48px' : '56px',
          height: isMobile ? '48px' : '56px',
          borderRadius: '16px',
          background: isActive ? gradient : 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
          border: isActive 
            ? `2px solid ${shadowColor.replace('0.5', '1')}` 
            : '1px solid rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isMobile ? '22px' : '26px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          color: 'white',
          transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          boxShadow: isActive 
            ? `0 4px 20px ${shadowColor}, 0 0 30px ${shadowColor.replace('0.5', '0.3')}`
            : isHovered 
              ? `0 6px 25px ${shadowColor}, 0 0 20px ${shadowColor.replace('0.5', '0.2')}`
              : '0 2px 10px rgba(0, 0, 0, 0.2)',
          transform: isPressed ? 'scale(0.9)' : isHovered ? 'scale(1.05)' : 'scale(1)',
          opacity: disabled ? 0.5 : 1,
          animation: pulse ? 'pulse-glow 1.5s infinite' : 'none',
          position: 'relative'
        }}
      >
        {icon}
        {/* 徽章提示 */}
        {badge && (
          <span style={{
            position: 'absolute',
            top: '-3px',
            right: '-3px',
            width: '14px',
            height: '14px',
            background: badgeColor || '#00d4ff',
            borderRadius: '50%',
            border: '2px solid rgba(30, 41, 59, 0.9)',
            fontSize: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold'
          }}>
            {badge}
          </span>
        )}
      </button>
      
      {/* 悬停提示 */}
      <div style={{
        position: 'absolute',
        right: isMobile ? '55px' : '65px',
        top: '50%',
        transform: `translateY(-50%) ${isHovered ? 'translateX(0)' : 'translateX(10px)'}`,
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
        padding: '6px 12px',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.2)',
        color: 'white',
        fontSize: '12px',
        fontWeight: '600',
        whiteSpace: 'nowrap',
        opacity: isHovered ? 1 : 0,
        pointerEvents: 'none',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000
      }}>
        {label}
        {/* 小三角箭头 */}
        <div style={{
          position: 'absolute',
          right: '-6px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: 0,
          height: 0,
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          borderLeft: '6px solid rgba(255,255,255,0.2)'
        }} />
      </div>
    </div>
  )
}

// ==================== 5. 动作按钮组件（优化版） ====================
const ActionButton = ({ item, index, onClick, isActive, isMobile }) => {
  const [isPressed, setIsPressed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  
  // 移动端尺寸调整 - 增大按钮尺寸
  const buttonSize = isMobile ? {
    minWidth: item.highlight ? '85px' : '70px',
    height: item.highlight ? '70px' : '60px',
    fontSize: item.highlight ? '28px' : '24px',
    labelSize: '11px',
    borderRadius: '14px'
  } : {
    minWidth: item.highlight ? '130px' : '110px',
    height: item.highlight ? '100px' : '90px',
    fontSize: item.highlight ? '40px' : '32px',
    labelSize: item.highlight ? '14px' : '12px',
    borderRadius: '24px'
  }
  
  const handleClick = useCallback(() => {
    if (cooldown > 0) return
    onClick()
    setCooldown(100)
    const timer = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 5) {
          clearInterval(timer)
          return 0
        }
        return prev - 5
      })
    }, 50)
  }, [onClick, cooldown])
  
  const getActionTheme = (action) => {
    const themes = {
      // 基础动作
      idle: { bg: 'linear-gradient(135deg, #a8e6cf 0%, #7fcdcd 100%)', icon: '😌' },
      wave: { bg: 'linear-gradient(135deg, #ffd93d 0%, #ffb347 100%)', icon: '👋' },
      dance: { bg: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)', icon: '💃' },
      jump: { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', icon: '⬆️' },
      sit: { bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', icon: '🪑' },
      run: { bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', icon: '🏃' },
      // 表情动作
      happy: { bg: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', icon: '😄' },
      sad: { bg: 'linear-gradient(135deg, #a8caba 0%, #5d4e75 100%)', icon: '😢' },
      angry: { bg: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)', icon: '😠' },
      surprise: { bg: 'linear-gradient(135deg, #c471ed 0%, #f64f59 100%)', icon: '😲' },
      love: { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', icon: '😍' },
      sleep: { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', icon: '😴' },
      // 日常动作
      eat: { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', icon: '🍰' },
      read: { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', icon: '📖' },
      sing: { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', icon: '🎤' },
      photo: { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', icon: '📸' },
      // 大幅度特殊动作 - 更炫酷的渐变
      takeBook: { bg: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #ff9ff3 100%)', icon: '📚', highlight: true },
      somersault: { bg: 'linear-gradient(135deg, #48dbfb 0%, #0abde3 50%, #006ba6 100%)', icon: '🤸', highlight: true },
      superJump: { bg: 'linear-gradient(135deg, #ff9f43 0%, #ee5a24 50%, #f368e0 100%)', icon: '🚀', highlight: true },
      spinDance: { bg: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 50%, #fd79a8 100%)', icon: '🌪️', highlight: true },
      bigWave: { bg: 'linear-gradient(135deg, #00b894 0%, #00cec9 50%, #55efc4 100%)', icon: '👋✨', highlight: true },
      bow: { bg: 'linear-gradient(135deg, #fdcb6e 0%, #e17055 50%, #d63031 100%)', icon: '🙇', highlight: true },
      celebrate: { bg: 'linear-gradient(135deg, #fd79a8 0%, #fdcb6e 50%, #6c5ce7 100%)', icon: '🎉', highlight: true },
      // 系统动作
      combo: { bg: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)', icon: '✨' },
      random: { bg: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)', icon: '🎲' }
    }
    return themes[action] || themes.idle
  }
  
  const theme = getActionTheme(item.action)
  const isFirst = index === 0
  
  return (
    <button
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => { setIsPressed(false); setIsHovered(false) }}
      onMouseEnter={() => setIsHovered(true)}
      disabled={cooldown > 0}
      style={{
        minWidth: buttonSize.minWidth,
        height: buttonSize.height,
        background: isActive
          ? 'linear-gradient(135deg, #ff9ecd 0%, #ff6b9d 50%, #c44569 100%)'
          : isFirst 
            ? 'linear-gradient(135deg, #ff9ecd 0%, #ff6b9d 50%, #c44569 100%)' 
            : theme.bg,
        border: isActive || isFirst 
          ? '3px solid #ffb8d0' 
          : item.highlight 
            ? '3px solid #ffd93d' 
            : '2px solid rgba(255,255,255,0.3)',
        borderRadius: buttonSize.borderRadius,
        cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        color: 'white',
        boxShadow: isActive || isFirst
          ? '0 10px 40px rgba(255, 107, 157, 0.7), inset 0 2px 16px rgba(255, 255, 255, 0.5), 0 0 0 4px rgba(255, 184, 208, 0.4)' 
          : item.highlight
            ? '0 12px 40px rgba(255, 217, 61, 0.5), inset 0 2px 16px rgba(255, 255, 255, 0.4), 0 0 0 4px rgba(255, 217, 61, 0.3)'
            : '0 8px 24px rgba(0, 0, 0, 0.25), inset 0 2px 10px rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(15px)',
        transform: isPressed ? 'scale(0.9) translateY(6px)' : isHovered ? 'scale(1.15) translateY(-10px) rotate(-2deg)' : 'scale(1) translateY(0)',
        position: 'relative',
        overflow: 'hidden',
        opacity: cooldown > 0 ? 0.6 : 1,
        animation: item.highlight ? 'pulse 2s ease-in-out infinite' : 'none'
      }}
    >
      {/* 冷却遮罩 */}
      {cooldown > 0 && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${cooldown}%`,
          background: 'rgba(0,0,0,0.3)',
          transition: 'height 0.05s linear'
        }} />
      )}
      
      {/* 流光效果 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
        animation: (isActive || isFirst) ? 'shimmer 1.5s infinite' : 'none'
      }} />
      
      <div style={{ 
        fontSize: buttonSize.fontSize, 
        filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.4))',
        animation: isHovered ? 'bounce 0.5s ease-in-out infinite' : item.highlight ? 'pulse 1.5s ease-in-out infinite' : 'none',
        transform: item.highlight ? 'scale(1.25)' : 'scale(1.15)',
        zIndex: 1
      }}>{theme.icon}</div>
      
      <div style={{ 
        fontSize: buttonSize.labelSize, 
        fontWeight: '800', 
        textAlign: 'center', 
        textShadow: '0 2px 6px rgba(0, 0, 0, 0.5)',
        letterSpacing: '0.8px',
        zIndex: 1,
        color: item.highlight ? '#ffd93d' : 'white'
      }}>{item.name}</div>
      
      {/* 激活指示器 */}
      {(isActive || isFirst) && (
        <div style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ffd93d 0%, #ff6b6b 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          boxShadow: '0 3px 12px rgba(255, 217, 61, 0.6)',
          animation: 'pulse 1.2s ease-in-out infinite',
          zIndex: 2
        }}>⭐</div>
      )}
      
      {/* 大幅度动作特殊标识 */}
      {item.highlight && !isActive && !isFirst && (
        <div style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ffd93d 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          boxShadow: '0 2px 8px rgba(255, 107, 107, 0.6)',
          animation: 'pulse 1.5s ease-in-out infinite',
          zIndex: 2
        }}>✨</div>
      )}
    </button>
  )
}

// ==================== 6. 科技按钮组件（优化版） ====================
const TechButton = ({ children, onClick, style, active = false, size = 'medium', badge, isMobile }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  
  const sizeStyles = isMobile ? {
    small: { width: '32px', height: '32px', fontSize: '12px' },
    medium: { width: '40px', height: '40px', fontSize: '16px' },
    large: { width: '48px', height: '48px', fontSize: '20px' }
  } : {
    small: { width: '44px', height: '44px', fontSize: '18px' },
    medium: { width: '52px', height: '52px', fontSize: '20px' },
    large: { width: '60px', height: '60px', fontSize: '24px' }
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false) }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        ...sizeStyles[size],
        borderRadius: '50%',
        background: active 
          ? 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)' 
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.08) 100%)',
        color: 'white',
        border: active ? '3px solid #ffb8d0' : '2px solid rgba(255, 255, 255, 0.3)',
        cursor: 'pointer',
        boxShadow: active 
          ? '0 8px 32px rgba(255, 107, 157, 0.6), inset 0 2px 12px rgba(255, 255, 255, 0.4)' 
          : '0 6px 20px rgba(0, 0, 0, 0.25), inset 0 2px 8px rgba(255, 255, 255, 0.2)',
        transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(15px)',
        transform: isPressed ? 'scale(0.9) translateY(4px)' : isHovered ? 'scale(1.15) translateY(-6px)' : 'scale(1)',
        position: 'relative',
        ...style
      }}
    >
      {children}
      
      {/* 徽章 */}
      {badge && (
        <div style={{
          position: 'absolute',
          top: '-5px',
          right: '-5px',
          minWidth: '22px',
          height: '22px',
          borderRadius: '11px',
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 6px',
          boxShadow: '0 3px 12px rgba(238, 90, 111, 0.5)',
          animation: 'pulse 1.5s ease-in-out infinite'
        }}>{badge}</div>
      )}
      
      {/* 波纹效果 */}
      {isPressed && (
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.3)',
          animation: 'ripple 0.6s ease-out',
          pointerEvents: 'none'
        }} />
      )}
    </button>
  )
}

// ==================== 7. 滑块组件 ====================
const Slider = ({ value, onChange, min, max, label, icon }) => {
  const [localValue, setLocalValue] = useState(value)
  const [isDragging, setIsDragging] = useState(false)
  const sliderRef = useRef(null)
  
  // 同步外部值到本地
  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value)
    }
  }, [value, isDragging])
  
  // 实时更新
  const handleChange = useCallback((e) => {
    const newValue = parseFloat(e.target.value)
    setLocalValue(newValue)
    onChange(newValue)
  }, [onChange])
  
  // 计算进度百分比
  const progress = ((localValue - min) / (max - min)) * 100
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '12px 16px',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
      borderRadius: '20px',
      border: '1px solid rgba(255,255,255,0.2)',
      backdropFilter: 'blur(10px)',
      transition: isDragging ? 'transform 0.1s ease' : 'none',
      transform: isDragging ? 'scale(1.02)' : 'scale(1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        fontWeight: '600',
        color: 'white'
      }}>
        <span>{icon}</span>
        <span>{label}</span>
        <span style={{ 
          marginLeft: 'auto', 
          opacity: isDragging ? 1 : 0.8,
          color: isDragging ? '#00d4ff' : 'white',
          transition: 'all 0.2s ease',
          fontWeight: isDragging ? '700' : '600'
        }}>{localValue.toFixed(2)}</span>
      </div>
      
      <div style={{ position: 'relative', width: '100%', height: '8px' }}>
        {/* 进度条背景 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100%',
          borderRadius: '4px',
          background: 'rgba(255,255,255,0.2)',
          overflow: 'hidden'
        }}>
          {/* 进度条填充 */}
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: isDragging 
              ? 'linear-gradient(90deg, #00d4ff 0%, #0099cc 100%)' 
              : 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            transition: isDragging ? 'none' : 'width 0.1s ease',
            borderRadius: '4px'
          }} />
        </div>
        
        {/* 实际input */}
        <input
          ref={sliderRef}
          type="range"
          min={min}
          max={max}
          step={0.01}
          value={localValue}
          onChange={handleChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => isDragging && setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
            WebkitAppearance: 'none',
            appearance: 'none',
            margin: 0
          }}
        />
      </div>
    </div>
  )
}

// ==================== 8. 通知组件 ====================
const Notification = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])
  
  const colors = {
    info: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    success: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    warning: 'linear-gradient(135deg, #ffd93d 0%, #ffb347 100%)',
    error: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)'
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: '90px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '14px 28px',
      background: colors[type],
      borderRadius: '16px',
      color: 'white',
      fontSize: '14px',
      fontWeight: '600',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      zIndex: 9999,
      animation: 'slideDown 0.4s ease, fadeOut 0.4s ease 2.6s',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }}>
      <span>{type === 'success' ? '✓' : type === 'error' ? '✗' : type === 'warning' ? '⚠' : 'ℹ'}</span>
      {message}
    </div>
  )
}

// ==================== 9. 3D场景内容 ====================
// ==================== 增强版家具显示组件 ====================
const PropDisplay = ({ propId, onInteract, characterIndex }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const meshRef = useRef()
  const floatRef = useRef(0)
  
  console.log('PropDisplay 渲染, propId:', propId)
  if (!propId || propId === 'none') return null

  // 导入家具数据
  const furniture = furnitureList.find(f => f.id === propId)
  if (!furniture) {
    console.warn('未找到家具:', propId)
    return null
  }

  // 获取交互动作名称 - 使用MMD动作
  const getInteractAction = () => {
    // 优先使用家具定义的MMD动作
    if (furniture.autoPose && furniture.autoPose.startsWith('mmd_')) {
      return furniture.autoPose
    }
    
    // 默认MMD动作映射
    const categoryActions = {
      seat: 'mmd_furniture_0',      // 坐下
      bed: 'mmd_furniture_2',       // 躺下
      instrument: 'mmd_dance_10',   // 演奏
      tool: 'mmd_cool_0',           // 使用工具
      accessory: 'mmd_cool_3',      // 装备
      decoration: 'mmd_cute_4'      // 拿装饰
    }
    return categoryActions[furniture.category] || 'mmd_idle'
  }

  // 获取交互按钮位置和颜色
  const getInteractButtonConfig = () => {
    const configs = {
      seat: { pos: [0, 0.6, 0.5], color: '#4CAF50', label: '坐', icon: '🪑' },
      bed: { pos: [0, 0.4, 1.0], color: '#9C27B0', label: '躺', icon: '🛏️' },
      instrument: { pos: [0.8, 0.6, 0.4], color: '#FF5722', label: '演奏', icon: '🎵' },
      tool: { pos: [0.5, 0.7, 0.3], color: '#2196F3', label: '使用', icon: '🔧' },
      accessory: { pos: [0, 1.9, 0.3], color: '#FFD700', label: '装备', icon: '✨' },
      decoration: { pos: [0.4, 0.8, 0.3], color: '#E91E63', label: '拿', icon: '🎀' }
    }
    return configs[furniture.category] || { pos: [0, 0.6, 0.4], color: '#757575', label: '用', icon: '👆' }
  }

  // 增强的3D家具模型配置
  const getFurnitureConfig = (furniture) => {
    const { id, category, position, color } = furniture
    
    const configs = {
      // 座椅类 - 更精细的模型
      chair: { 
        type: 'chair', color: color || '#8B4513',
        seatHeight: 0.25, backHeight: 0.5, width: 0.45
      },
      sofa: { 
        type: 'sofa', color: color || '#2C3E50',
        width: 0.8, height: 0.35, depth: 0.5
      },
      stool: { 
        type: 'stool', color: color || '#D2691E',
        height: 0.5, radius: 0.15
      },
      throne: { 
        type: 'throne', color: color || '#FFD700',
        width: 0.6, height: 0.7
      },
      swing: { 
        type: 'swing', color: color || '#E91E63',
        width: 0.5, height: 0.4
      },
      
      // 床铺类
      bed_single: { 
        type: 'bed', color: color || '#4A90E2',
        width: 0.8, length: 1.5, height: 0.25
      },
      bed_double: { 
        type: 'bed', color: color || '#9B59B6',
        width: 1.2, length: 1.5, height: 0.25
      },
      hammock: { 
        type: 'hammock', color: color || '#27AE60',
        width: 0.6, length: 1.2
      },
      futon: { 
        type: 'futon', color: color || '#E67E22',
        width: 0.8, length: 0.8, height: 0.08
      },
      
      // 乐器类
      guitar: { 
        type: 'guitar', color: color || '#E74C3C',
        scale: 1
      },
      piano: { 
        type: 'piano', color: color || '#2C3E50',
        width: 1.0, height: 0.4, depth: 0.5
      },
      violin: { 
        type: 'violin', color: color || '#8E44AD',
        scale: 1
      },
      drum: { 
        type: 'drum', color: color || '#C0392B',
        radius: 0.25, height: 0.4
      },
      microphone: { 
        type: 'microphone', color: color || '#E91E63',
        scale: 1
      },
      flute: { 
        type: 'flute', color: color || '#F39C12',
        scale: 1
      },
      
      // 配饰类
      crown: { type: 'crown', color: color || '#FFD700', scale: 1 },
      glasses: { type: 'glasses', color: color || '#34495E', scale: 1 },
      sunglasses: { type: 'sunglasses', color: color || '#2C3E50', scale: 1 },
      hat_cowboy: { type: 'hat', color: color || '#8B4513', scale: 1 },
      hat_witch: { type: 'witch_hat', color: color || '#9B59B6', scale: 1 },
      earrings: { type: 'earrings', color: color || '#1ABC9C', scale: 1 },
      necklace: { type: 'necklace', color: color || '#F1C40F', scale: 1 },
      scarf: { type: 'scarf', color: color || '#E74C3C', scale: 1 },
      backpack: { type: 'backpack', color: color || '#3498DB', scale: 1 },
      wings: { type: 'wings', color: color || '#9B59B6', scale: 1 },
      tail: { type: 'tail', color: color || '#E67E22', scale: 1 },
      halo: { type: 'halo', color: color || '#FFD700', scale: 1 },
      
      // 工具类
      sword: { type: 'sword', color: color || '#95A5A6', scale: 1 },
      shield: { type: 'shield', color: color || '#3498DB', scale: 1 },
      wand: { type: 'wand', color: color || '#9B59B6', scale: 1 },
      bow: { type: 'bow', color: color || '#8B4513', scale: 1 },
      umbrella: { type: 'umbrella', color: color || '#E91E63', scale: 1 },
      book: { type: 'book', color: color || '#E67E22', scale: 1 },
      camera: { type: 'camera', color: color || '#2C3E50', scale: 1 },
      phone: { type: 'phone', color: color || '#3498DB', scale: 1 },
      laptop: { type: 'laptop', color: color || '#34495E', scale: 1 },
      broom: { type: 'broom', color: color || '#8B4513', scale: 1 },
      fishing_rod: { type: 'fishing_rod', color: color || '#27AE60', scale: 1 },
      paintbrush: { type: 'paintbrush', color: color || '#E74C3C', scale: 1 },
      
      // 装饰类
      flower: { type: 'flower', color: color || '#FF69B4', scale: 1 },
      bouquet: { type: 'bouquet', color: color || '#E91E63', scale: 1 },
      rose: { type: 'rose', color: color || '#C0392B', scale: 1 },
      balloon: { type: 'balloon', color: color || '#E74C3C', scale: 1 },
      gift: { type: 'gift', color: color || '#E91E63', scale: 1 },
      candle: { type: 'candle', color: color || '#F39C12', scale: 1 },
      lollipop: { type: 'lollipop', color: color || '#9B59B6', scale: 1 },
      ice_cream: { type: 'ice_cream', color: color || '#F1C40F', scale: 1 },
      drink: { type: 'drink', color: color || '#E67E22', scale: 1 },
      fan: { type: 'fan', color: color || '#E74C3C', scale: 1 },
      flag: { type: 'flag', color: color || '#E74C3C', scale: 1 },
      star_wand: { type: 'star_wand', color: color || '#FFD700', scale: 1 }
    }
    
    return configs[id] || { 
      type: 'default', color: color || '#cccccc', scale: 1
    }
  }

  const config = getFurnitureConfig(furniture)
  const interactConfig = getInteractButtonConfig()
  const interactAction = getInteractAction()

  // 处理交互点击
  const handleInteractClick = (e) => {
    e.stopPropagation()
    setIsAnimating(true)
    console.log('家具交互:', furniture.name, '动作:', interactAction)
    if (onInteract) {
      onInteract(interactAction, furniture, characterIndex)
    }
    setTimeout(() => setIsAnimating(false), 500)
  }

  // 渲染家具模型
  const renderFurniture = () => {
    const baseMaterial = (
      <meshStandardMaterial 
        color={config.color} 
        metalness={0.4} 
        roughness={0.3}
        emissive={config.color}
        emissiveIntensity={isHovered ? 0.3 : 0.1}
      />
    )

    switch (config.type) {
      case 'chair':
        return (
          <group>
            {/* 座椅面 */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[config.width, 0.08, config.width]} />
              {baseMaterial}
            </mesh>
            {/* 靠背 */}
            <mesh position={[0, config.backHeight/2 - 0.04, -config.width/2 + 0.04]}>
              <boxGeometry args={[config.width, config.backHeight, 0.08]} />
              {baseMaterial}
            </mesh>
            {/* 四条腿 */}
            {[[-1,-1], [1,-1], [-1,1], [1,1]].map(([x, z], i) => (
              <mesh key={i} position={[x * config.width/3, -config.seatHeight/2, z * config.width/3]}>
                <cylinderGeometry args={[0.03, 0.02, config.seatHeight, 8]} />
                <meshStandardMaterial color={config.color} metalness={0.5} roughness={0.4} />
              </mesh>
            ))}
          </group>
        )
      
      case 'sofa':
        return (
          <group>
            {/* 座椅 */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[config.width, config.height, config.depth]} />
              {baseMaterial}
            </mesh>
            {/* 靠背 */}
            <mesh position={[0, config.height/2 + 0.15, -config.depth/2 + 0.05]}>
              <boxGeometry args={[config.width, 0.3, 0.1]} />
              {baseMaterial}
            </mesh>
            {/* 扶手 */}
            <mesh position={[-config.width/2 + 0.08, config.height/2 + 0.05, 0]}>
              <boxGeometry args={[0.16, 0.2, config.depth]} />
              {baseMaterial}
            </mesh>
            <mesh position={[config.width/2 - 0.08, config.height/2 + 0.05, 0]}>
              <boxGeometry args={[0.16, 0.2, config.depth]} />
              {baseMaterial}
            </mesh>
          </group>
        )
      
      case 'stool':
        return (
          <group>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[config.radius, config.radius, config.height, 16]} />
              {baseMaterial}
            </mesh>
            {/* 凳腿 */}
            {[[-1,-1], [1,-1], [-1,1], [1,1]].map(([x, z], i) => (
              <mesh key={i} position={[x * 0.1, -config.height/2, z * 0.1]}>
                <cylinderGeometry args={[0.02, 0.015, config.height, 8]} />
                <meshStandardMaterial color={config.color} metalness={0.5} roughness={0.4} />
              </mesh>
            ))}
          </group>
        )
      
      case 'throne':
        return (
          <group>
            {/* 座椅 */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[config.width, 0.15, config.width]} />
              {baseMaterial}
            </mesh>
            {/* 高靠背 */}
            <mesh position={[0, config.height/2, -config.width/2 + 0.05]}>
              <boxGeometry args={[config.width, config.height, 0.1]} />
              {baseMaterial}
            </mesh>
            {/* 扶手 */}
            <mesh position={[-config.width/2 + 0.08, config.height/4, 0]}>
              <boxGeometry args={[0.16, config.height/2, config.width]} />
              {baseMaterial}
            </mesh>
            <mesh position={[config.width/2 - 0.08, config.height/4, 0]}>
              <boxGeometry args={[0.16, config.height/2, config.width]} />
              {baseMaterial}
            </mesh>
            {/* 装饰 */}
            <mesh position={[0, config.height - 0.05, -config.width/2 + 0.15]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        )
      
      case 'bed':
        return (
          <group>
            {/* 床垫 */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[config.width, config.height, config.length]} />
              {baseMaterial}
            </mesh>
            {/* 枕头 */}
            <mesh position={[0, config.height/2 + 0.06, -config.length/2 + 0.25]}>
              <boxGeometry args={[config.width * 0.6, 0.12, 0.25]} />
              <meshStandardMaterial color="#ffffff" roughness={0.8} />
            </mesh>
            {/* 被子 */}
            <mesh position={[0, config.height/2 + 0.04, config.length/4]}>
              <boxGeometry args={[config.width + 0.02, 0.08, config.length/2]} />
              <meshStandardMaterial color={config.color} roughness={0.9} />
            </mesh>
          </group>
        )
      
      case 'guitar':
        return (
          <group position={[0.2, 0.5, 0.15]} rotation={[0, 0, -0.3]}>
            {/* 琴身 */}
            <mesh position={[0, -0.1, 0]}>
              <boxGeometry args={[0.18, 0.22, 0.05]} />
              {baseMaterial}
            </mesh>
            {/* 琴颈 */}
            <mesh position={[0, 0.15, 0]}>
              <boxGeometry args={[0.04, 0.3, 0.03]} />
              <meshStandardMaterial color="#5D4037" />
            </mesh>
            {/* 琴弦 */}
            <mesh position={[0, 0.1, 0.03]}>
              <boxGeometry args={[0.12, 0.001, 0.001]} />
              <meshStandardMaterial color="#silver" metalness={0.9} />
            </mesh>
          </group>
        )
      
      case 'crown':
        return (
          <group position={[0, 1.58, 0]}>
            {/* 皇冠底座 */}
            <mesh>
              <cylinderGeometry args={[0.11, 0.1, 0.06, 16]} />
              {baseMaterial}
            </mesh>
            {/* 皇冠尖 */}
            {[0, 1, 2, 3, 4].map((i) => (
              <mesh key={i} position={[Math.sin(i * Math.PI * 2 / 5) * 0.08, 0.08, Math.cos(i * Math.PI * 2 / 5) * 0.08]}>
                <coneGeometry args={[0.015, 0.06, 8]} />
                <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.1} />
              </mesh>
            ))}
            {/* 宝石 */}
            <mesh position={[0, 0.02, 0.1]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color="#E74C3C" metalness={0.8} roughness={0.1} />
            </mesh>
          </group>
        )
      
      case 'wings':
        return (
          <group position={[0, 1.1, -0.12]}>
            {/* 左翼 */}
            <mesh position={[-0.25, 0, 0]} rotation={[0, 0, 0.3]}>
              <boxGeometry args={[0.4, 0.35, 0.03]} />
              {baseMaterial}
            </mesh>
            {/* 右翼 */}
            <mesh position={[0.25, 0, 0]} rotation={[0, 0, -0.3]}>
              <boxGeometry args={[0.4, 0.35, 0.03]} />
              {baseMaterial}
            </mesh>
            {/* 羽毛装饰 */}
            {[-0.35, -0.25, -0.15, 0.15, 0.25, 0.35].map((x, i) => (
              <mesh key={i} position={[x, -0.2, 0.02]}>
                <boxGeometry args={[0.08, 0.15, 0.01]} />
                <meshStandardMaterial color={config.color} transparent opacity={0.8} />
              </mesh>
            ))}
          </group>
        )
      
      case 'sword':
        return (
          <group position={[0.25, 0.6, 0.15]} rotation={[0, 0, -0.5]}>
            {/* 剑刃 */}
            <mesh position={[0, 0.2, 0]}>
              <boxGeometry args={[0.03, 0.4, 0.01]} />
              <meshStandardMaterial color="#C0C0C0" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* 剑柄 */}
            <mesh position={[0, -0.05, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.15, 8]} />
              <meshStandardMaterial color="#8B4513" />
            </mesh>
            {/* 护手 */}
            <mesh position={[0, 0.02, 0]}>
              <boxGeometry args={[0.1, 0.02, 0.03]} />
              <meshStandardMaterial color="#FFD700" metalness={0.8} />
            </mesh>
          </group>
        )
      
      case 'flower':
        return (
          <group position={[0.2, 0.6, 0.1]}>
            {/* 花茎 */}
            <mesh position={[0, -0.1, 0]}>
              <cylinderGeometry args={[0.005, 0.005, 0.2, 8]} />
              <meshStandardMaterial color="#27AE60" />
            </mesh>
            {/* 花瓣 */}
            {[0, 1, 2, 3, 4].map((i) => (
              <mesh key={i} position={[Math.sin(i * Math.PI * 2 / 5) * 0.03, 0.05, Math.cos(i * Math.PI * 2 / 5) * 0.03]}>
                <sphereGeometry args={[0.025, 8, 8]} />
                <meshStandardMaterial color={config.color} />
              </mesh>
            ))}
            {/* 花心 */}
            <mesh position={[0, 0.05, 0]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color="#FFD700" />
            </mesh>
          </group>
        )
      
      default:
        return (
          <mesh position={[0.2, 0.5, 0.1]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            {baseMaterial}
          </mesh>
        )
    }
  }

  return (
    <group 
      ref={meshRef}
      onPointerOver={(e) => {
        e.stopPropagation()
        setIsHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        setIsHovered(false)
        document.body.style.cursor = 'auto'
      }}
      onClick={handleInteractClick}
    >
      {/* 家具主体 */}
      {renderFurniture()}
      
      {/* 悬浮提示 - 仅在悬停时显示 */}
      {isHovered && (
        <group position={interactConfig.pos}>
          {/* 发光圆环 */}
          <mesh rotation={[Math.PI/2, 0, 0]}>
            <ringGeometry args={[0.15, 0.18, 32]} />
            <meshBasicMaterial color={interactConfig.color} transparent opacity={0.6} />
          </mesh>
          {/* 交互图标 */}
          <Html center>
            <div style={{
              background: `linear-gradient(135deg, ${interactConfig.color} 0%, ${interactConfig.color}dd 100%)`,
              padding: '6px 12px',
              borderRadius: '12px',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              boxShadow: `0 4px 15px ${interactConfig.color}50`,
              animation: 'pulse 1s infinite',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>{interactConfig.icon}</span>
              <span>{interactConfig.label}</span>
            </div>
          </Html>
        </group>
      )}
      
      {/* 点击动画效果 */}
      {isAnimating && (
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial color={interactConfig.color} transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  )
}

// ==================== 可拖拽角色组件 ====================
const DraggableCharacter = ({ position, index, isSelected, character, characterScale, actionIntensity, onPositionChange, propId, isBoneEditing, onBoneChange, onPropInteract, onSelect, opacity = 1.0, mmdCurrentAction = null, mmdActionStartTime = 0, isInteractMode = false, onInteract = null, onMMDActionComplete = null }) => {
  const groupRef = useRef()
  const [isDragging, setIsDragging] = useState(false)
  const [isLongPress, setIsLongPress] = useState(false)
  const { camera, gl } = useThree()
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())
  const offset = useRef(new THREE.Vector3())
  
  // 触摸状态管理（仅用于双指缩放）
  const touchState = useRef({
    startTime: 0,
    startDistance: 0,
    startScale: characterScale,
    touches: [],
    isPinching: false
  })

  // 简单交互：点击选中，拖拽移动
  const handlePointerDown = (e) => {
    e.stopPropagation()
    
    // 选中角色
    onSelect?.(index)
    
    // 开始拖拽
    setIsDragging(true)
    gl.domElement.setPointerCapture(e.pointerId)

    // 计算拖拽偏移
    raycaster.current.setFromCamera(e.pointer, camera)
    const intersectPoint = new THREE.Vector3()
    raycaster.current.ray.intersectPlane(dragPlane.current, intersectPoint)
    offset.current.subVectors(intersectPoint, new THREE.Vector3(...position))
  }

  const handlePointerMove = (e) => {
    if (!isDragging) return
    e.stopPropagation()

    raycaster.current.setFromCamera(e.pointer, camera)
    const intersectPoint = new THREE.Vector3()
    raycaster.current.ray.intersectPlane(dragPlane.current, intersectPoint)

    const newPosition = intersectPoint.sub(offset.current)
    onPositionChange(index, [newPosition.x, position[1], newPosition.z])
  }

  const handlePointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false)
      gl.domElement.releasePointerCapture(e.pointerId)
    }
  }
  
  // 处理触摸事件（用于双指缩放）
  const handleTouchStart = (e) => {
    const touches = e.touches
    touchState.current.touches = touches
    touchState.current.startTime = Date.now()
    
    if (touches.length === 2) {
      // 双指触摸，准备缩放
      touchState.current.isPinching = true
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      touchState.current.startDistance = Math.sqrt(dx * dx + dy * dy)
      touchState.current.startScale = characterScale
      e.stopPropagation()
    }
  }
  
  const handleTouchMove = (e) => {
    const touches = e.touches
    
    if (touches.length === 2 && touchState.current.isPinching) {
      // 双指缩放
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (touchState.current.startDistance > 0) {
        const scale = (distance / touchState.current.startDistance) * touchState.current.startScale
        const clampedScale = Math.max(0.3, Math.min(3.0, scale))
        
        // 触发缩放事件
        window.dispatchEvent(new CustomEvent('characterScaleChange', {
          detail: { index, scale: clampedScale }
        }))
      }
      e.stopPropagation()
    }
  }
  
  const handleTouchEnd = (e) => {
    touchState.current.isPinching = false
    touchState.current.touches = e.touches
  }

  const fileToLoad = character.file || character

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 选中人物的蓝色边缘光效果 */}
      {isSelected && (
        <>
          {/* 底部光环 */}
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.6, 0.8, 32]} />
            <meshBasicMaterial color="#00d4ff" transparent opacity={0.6 * opacity} side={THREE.DoubleSide} />
          </mesh>
          {/* 内部光环 */}
          <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.4, 0.55, 32]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.4 * opacity} side={THREE.DoubleSide} />
          </mesh>
          {/* 顶部光点 */}
          <mesh position={[0, 1.7, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.8 * opacity} />
          </mesh>
          {/* 拖拽提示 - 选中时显示 */}
          <mesh position={[0, 2.0, 0]}>
            <planeGeometry args={[0.8, 0.2]} />
            <meshBasicMaterial color="#00d4ff" transparent opacity={0.3 * opacity} />
          </mesh>
        </>
      )}
      <group visible={opacity > 0.01}>
        <CharacterController
          index={index}
          position={[0, 0, 0]}
          rotation={[0, 0, 0]}
          selectedFile={fileToLoad}
          scale={characterScale * (isSelected ? 1.1 : 0.9)}
          actionIntensity={actionIntensity}
          isBoneEditing={isBoneEditing && isSelected}
          onBoneChange={onBoneChange}
          opacity={opacity}
          mmdCurrentAction={mmdCurrentAction}
          mmdActionStartTime={mmdActionStartTime}
          isInteractMode={isInteractMode}
          onInteract={onInteract}
          onMMDActionComplete={onMMDActionComplete}
        />
      </group>
      {/* 道具显示在角色身上 */}
      <PropDisplay 
        propId={propId} 
        onInteract={onPropInteract}
        characterIndex={index}
      />
    </group>
  )
}

// ==================== AR模式特效组件 ====================
const AREffects = ({ effects }) => {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1
    }
  })

  if (!effects?.particles?.enabled) return null

  const particleCount = effects.particles?.intensity ? Math.floor(effects.particles.intensity * 2) : 50
  const type = effects.particles?.type || 'snow'

  const colors = {
    snow: '#ffffff',
    rain: '#54a0ff',
    stars: '#ffd700',
    fireflies: '#7bed9f',
    petals: '#ff9ecd',
    bubbles: '#00d4ff'
  }

  return (
    <group ref={groupRef}>
      {Array.from({ length: particleCount }).map((_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 10,
            Math.random() * 5,
            (Math.random() - 0.5) * 5 - 2
          ]}
        >
          <sphereGeometry args={[0.02 + Math.random() * 0.03, 8, 8]} />
          <meshBasicMaterial
            color={colors[type] || colors.snow}
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  )
}

// ==================== 9. 3D场景内容 ====================
const ARContent = ({ characters, selectedCharacterIndex, characterScale, actionIntensity, isARMode, characterPositions, onPositionChange, characterProps, isBoneEditing, onBoneChange, onPropInteract, onSelectCharacter, showParticles, particleType, modelVisibility, modelOpacity, stageEffects, mmdCurrentActions, mmdActionStartTimes, isInteractMode, handleCharacterInteract }) => {
  return (
    <>
      {/* 层级1: 背景特效（AR模式下不显示，避免挡住摄像头） */}
      {!isARMode && (
        <>
          <ParticleField enabled={showParticles} type={particleType} />
          <DynamicBackground />
          <FloatingDecorations />
        </>
      )}

      {/* 层级2: 舞台效果（在背景之后，模型之前） */}
      {stageEffects?.particles?.enabled && (
        <StageEffects effects={stageEffects} />
      )}

      {/* 层级3: AR模式下的特效（additive混合） */}
      {isARMode && <AREffects effects={stageEffects} />}

      {/* 层级4: 渲染所有已加载的角色（最前面） */}
      {characters.map((character, index) => {
        if (!character) return null
        // 如果模型被隐藏，不渲染
        if (!modelVisibility?.[index]) return null

        const isSelected = index === selectedCharacterIndex
        const position = characterPositions[index] || [-1.5 + index * 1.5, 0, 0]
        const propId = characterProps?.[index]

        return (
          <group key={index}>
            <DraggableCharacter
              index={index}
              position={position}
              isSelected={isSelected}
              character={character}
              characterScale={characterScale[index]}
              actionIntensity={actionIntensity[index]}
              onPositionChange={onPositionChange}
              propId={propId}
              isBoneEditing={isBoneEditing}
              onBoneChange={onBoneChange}
              onPropInteract={onPropInteract}
              onSelect={onSelectCharacter}
              opacity={modelOpacity?.[index] ?? 1.0}
              mmdCurrentAction={mmdCurrentActions?.[index]}
              mmdActionStartTime={mmdActionStartTimes?.[index]}
              isInteractMode={isInteractMode}
              onInteract={handleCharacterInteract}
              onMMDActionComplete={(charIndex) => {
                // MMD动作完成，清除该角色的动作状态
                console.log('✅ MMD动作完成，角色', charIndex, '恢复到idle状态')
              }}
            />
          </group>
        )
      })}
    </>
  )
}

// ==================== 主组件 ====================
export const ARScene = ({ selectedFile }) => {
  const { isMobile, isTablet } = useMobileDetect()
  const { logs, addLog, clearLogs } = useDebugLog()
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  // 工具栏分组折叠状态
  const [toolbarGroups, setToolbarGroups] = useState({
    main: true,      // 主要功能默认展开
    appearance: false, // 外观功能默认折叠
    system: false    // 系统功能默认折叠
  })
  const [quickAccessPinned, setQuickAccessPinned] = useState(() => {
    const saved = localStorage.getItem('quickAccessPinned')
    return saved ? JSON.parse(saved) : ['动作', '姿势', '特效', '设置']
  })
  // 工具栏滑动状态
  const [toolbarOffsetY, setToolbarOffsetY] = useState(0)
  const [isToolbarDragging, setIsToolbarDragging] = useState(false)
  const toolbarRef = useRef(null)
  const toolbarDragStartY = useRef(0)
  const toolbarDragStartOffsetY = useRef(0)
  const [isARMode, setIsARMode] = useState(false)
  const [isWebXRARMode, setIsWebXRARMode] = useState(false)
  const videoRef = useRef(null)
  const [cameraFacingMode, setCameraFacingMode] = useState('environment')
  const streamRef = useRef(null)
  const canvasRef = useRef(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const recordingTimerRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])
  const [isSwingMode, setIsSwingMode] = useState(false)
  const lastGyroDataRef = useRef({ x: 0, y: 0, z: 0 })
  const swingThreshold = 0.5
  const [characters, setCharacters] = useState([null, null, null])
  const [selectedCharacterIndex, setSelectedCharacterIndex] = useState(0)
  const [showModelSelect, setShowModelSelect] = useState(false)

  // 将 selectedFile 加载到 characters 中
  useEffect(() => {
    if (selectedFile) {
      const url = selectedFile.localPath || URL.createObjectURL(selectedFile)
      setCharacters(prev => {
        const newCharacters = [...prev]
        newCharacters[0] = {
          url: url,
          name: selectedFile.name || '角色1',
          filename: selectedFile.name
        }
        return newCharacters
      })
    }
  }, [selectedFile])
  const [characterScale, setCharacterScale] = useState([1.2, 1.2, 1.2])
  const [actionIntensity, setActionIntensity] = useState([1.0, 1.0, 1.0])
  const [settingsTargetIndex, setSettingsTargetIndex] = useState(0)

  // 模型精度和显示设置（按角色）
  const [modelQuality, setModelQuality] = useState(() => {
    const saved = localStorage.getItem('modelQuality')
    return saved ? JSON.parse(saved) : [1.0, 1.0, 1.0] // 1.0 = 高质量
  })
  const [modelVisibility, setModelVisibility] = useState(() => {
    const saved = localStorage.getItem('modelVisibility')
    return saved ? JSON.parse(saved) : [true, true, true]
  })
  const [modelOpacity, setModelOpacity] = useState(() => {
    const saved = localStorage.getItem('modelOpacity')
    return saved ? JSON.parse(saved) : [1.0, 1.0, 1.0]
  })
  const [isRandomMode, setIsRandomMode] = useState(false)
  const [currentAction, setCurrentAction] = useState('idle')
  // MMD动作系统状态 - 始终使用MMD动作
  const useMMDActions = true
  const [mmdActiveCategory, setMmdActiveCategory] = useState('all')
  // VRMA动作列表
  const [vrmaActions, setVrmaActions] = useState([])
  // 动作分类 - 动态生成
  const actionCategories = useMemo(() => {
    const categories = [
      { id: 'all', name: '全部', icon: '✨', color: '#00d4ff' }
    ]
    
    // 从所有动作中提取分类
    const cats = new Map()
    vrmaActions.forEach(action => {
      if (!cats.has(action.category)) {
        cats.set(action.category, { count: 0, icon: action.icon })
      }
      cats.get(action.category).count++
    })
    
    // 按分类名称排序
    const sortedCats = Array.from(cats.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    
    // 为每个分类分配颜色
    const colors = ['#4facfe', '#ff6b9d', '#ff4757', '#ffa502', '#2ed573', '#a29bfe', '#ff6348', '#7bed9f', '#70a1ff', '#5352ed', '#ff9ff3', '#feca57']
    sortedCats.forEach(([cat, data], index) => {
      const mainCat = cat.split('-')[0]
      const colorMap = {
        '基础': '#4facfe',
        '舞蹈': '#ff6b9d',
        '战斗': '#ff4757',
        '表情': '#ffa502',
        '运动': '#2ed573',
        '特殊': '#a29bfe',
        '其他': '#747d8c'
      }
      categories.push({
        id: cat,
        name: cat,
        icon: data.icon,
        color: colorMap[mainCat] || colors[index % colors.length],
        count: data.count
      })
    })
    
    return categories
  }, [vrmaActions])
  
  // 分类滚动位置
  const [categoryScrollPos, setCategoryScrollPos] = useState(0)
  const categoryContainerRef = useRef(null)
  // MMD动作状态 - 每个角色独立
  const [mmdCurrentActions, setMmdCurrentActions] = useState([null, null, null])
  const [mmdActionStartTimes, setMmdActionStartTimes] = useState([0, 0, 0])
  // MMD动作循环播放状态 - 存储正在循环播放的动作ID
  const [loopingMMDActions, setLoopingMMDActions] = useState(new Set())
  const [notification, setNotification] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  // 编辑/预览模式切换 - 防止移动端误操作
  const [isEditMode, setIsEditMode] = useState(true)
  // 交互模式 - 触摸不同部位播放不同动画
  const [isInteractMode, setIsInteractMode] = useState(false)
  // 视角模式 - free/follow/fixed
  const [cameraMode, setCameraMode] = useState('free')
  // 表情面板显示状态
  const [showExpressionPanel, setShowExpressionPanel] = useState(false)
  // 检查是否首次访问
  const [showHelp, setShowHelp] = useState(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial')
    return !hasSeenTutorial // 如果未看过教程，默认显示
  })
  const [comboCount, setComboCount] = useState(0)
  const [showCombo, setShowCombo] = useState(false)
  
  // 拍照倒计时状态
  const [photoCountdown, setPhotoCountdown] = useState(0)
  const [isCountingDown, setIsCountingDown] = useState(false)
  const glRef = useRef(null)
  
  // 画布旋转状态
  const [canvasRotation, setCanvasRotation] = useState(0)
  const [isRotating, setIsRotating] = useState(false)
  
  // 骨骼编辑模式
  const [isBoneEditing, setIsBoneEditing] = useState(false)
  
  // 角色位置状态 - 支持拖拽移动（三个人左右排列，第一个人在中间）
  // Y坐标-0.3表示人物站在地面上（原来0是漂浮的）
  const [characterPositions, setCharacterPositions] = useState([
    [0, -0.3, 0],      // 角色0初始位置（中间，主角位置）- 基准位置
    [-3, -0.3, 0],     // 角色1初始位置（左边3米）- 只有X不同
    [3, -0.3, 0]       // 角色2初始位置（右边3米）- 只有X不同
  ])

  // 家具搜索状态
  const [furnitureSearchQuery, setFurnitureSearchQuery] = useState('')
  const [activeFurnitureCategory, setActiveFurnitureCategory] = useState('all')

  // 角色道具状态 - 每个角色可以选择一个道具
  const [characterProps, setCharacterProps] = useState([null, null, null])
  const [showPropSelect, setShowPropSelect] = useState(false)
  const [propTargetCharacter, setPropTargetCharacter] = useState(0)
  


  // 舞台效果面板状态
  const [showStageEffects, setShowStageEffects] = useState(false)
  const [showParticles, setShowParticles] = useState(false)
  const [particleType, setParticleType] = useState('snow')
  const [stageEffects, setStageEffects] = useState(() => {
    const saved = localStorage.getItem('stageEffects')
    return saved ? JSON.parse(saved) : {
      particles: { enabled: false, type: 'snow', intensity: 50 },
      filter: { enabled: false, type: 'none', intensity: 50 },
      quality: 'high',
      renderEffects: {
        outline: false,
        outlineColor: '#00d4ff',
        outlineIntensity: 50,
        bloom: false,
        bloomIntensity: 50,
        shadows: true,
        shadowQuality: 'high'
      },
      stickers: []
    }
  })

  // 场景管理面板状态
  const [showSceneManager, setShowSceneManager] = useState(false)

  // 姿势面板状态
  const [showPosePanel, setShowPosePanel] = useState(false)

  // 语音控制状态
  const [showVoiceControl, setShowVoiceControl] = useState(false)

  // 人物管理面板状态
  const [showCharacterManager, setShowCharacterManager] = useState(false)
  const [characterSearchQuery, setCharacterSearchQuery] = useState('')
  
  // 玩家自定义标签系统 - 存储在localStorage
  const [playerCustomTags, setPlayerCustomTags] = useState(() => {
    const saved = localStorage.getItem('playerCustomTags')
    return saved ? JSON.parse(saved) : {}
  })
  const [editingCharacterTags, setEditingCharacterTags] = useState(null)
  const [newTagInput, setNewTagInput] = useState('')

  // 陀螺仪控制（暂时禁用）
  const gyroSupported = false
  const gyroEnabled = false
  const toggleGyroscope = () => {}
  const getCharacterTransform = () => ({ x: 0, y: 0, z: 0 })
  const detectAction = () => null
  
  // 监听陀螺仪动作（暂时禁用）
  // useEffect(() => {
  //   if (!gyroEnabled) return
  //   
  //   const checkAction = setInterval(() => {
  //     const action = detectAction()
  //     if (action) {
  //       console.log('陀螺仪检测到动作:', action)
  //       // 可以根据检测到的动作触发相应动画
  //       // executeAction(action)
  //     }
  //   }, 500)
  //   
  //   return () => clearInterval(checkAction)
  // }, [gyroEnabled, detectAction])
  
  // 监听角色缩放变化事件（双指缩放）
  useEffect(() => {
    const handleScaleChange = (e) => {
      const { index, scale } = e.detail
      if (index !== undefined && scale !== undefined) {
        setCharacterScale(prev => {
          const updated = [...prev]
          updated[index] = scale
          return updated
        })
      }
    }
    
    window.addEventListener('characterScaleChange', handleScaleChange)
    return () => window.removeEventListener('characterScaleChange', handleScaleChange)
  }, [])

  // MMD动作循环播放逻辑
  useEffect(() => {
    if (loopingMMDActions.size === 0) return
    
    const checkLoopInterval = setInterval(() => {
      const currentAction = mmdCurrentActions[selectedCharacterIndex]
      const startTime = mmdActionStartTimes[selectedCharacterIndex]
      
      if (currentAction && startTime > 0 && loopingMMDActions.has(currentAction.id)) {
        const elapsed = Date.now() - startTime
        const duration = currentAction.duration || 3000
        
        // 如果动作即将结束（剩余不到100ms），重新触发
        if (elapsed >= duration - 100) {
          console.log('🔄 循环播放动作:', currentAction.name)
          setMmdActionStartTimes(prev => {
            const updated = [...prev]
            updated[selectedCharacterIndex] = Date.now()
            return updated
          })
        }
      }
    }, 100) // 每100ms检查一次
    
    return () => clearInterval(checkLoopInterval)
  }, [loopingMMDActions, mmdCurrentActions, mmdActionStartTimes, selectedCharacterIndex])

  // 动作搜索状态
  const [actionSearchQuery, setActionSearchQuery] = useState('')

  // 加载VRMA动作列表
  useEffect(() => {
    getAllVRMAActions().then(actions => {
      console.log('✅ 加载VRMA动作:', actions.length)
      setVrmaActions(actions)
    }).catch(err => {
      console.error('❌ 加载VRMA动作失败:', err)
    })
  }, [])

  // 根据分类和搜索筛选动作
  const filteredActions = useMemo(() => {
    let filtered = vrmaActions
    
    // 按分类筛选
    if (mmdActiveCategory !== 'all') {
      filtered = filtered.filter(a => a.category === mmdActiveCategory)
    }
    
    // 按搜索词筛选
    if (actionSearchQuery) {
      const query = actionSearchQuery.toLowerCase()
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }, [vrmaActions, mmdActiveCategory, actionSearchQuery])

  // 显示通知
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type })
  }, [])

  // 工具栏滑动事件处理 - 改进版：滑到底部固定在底部，滑到顶部固定在顶部
  const handleToolbarTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    toolbarDragStartY.current = touch.clientY
    toolbarDragStartOffsetY.current = toolbarOffsetY
    setIsToolbarDragging(true)
  }, [toolbarOffsetY])

  const handleToolbarTouchMove = useCallback((e) => {
    if (!isToolbarDragging) return
    e.preventDefault()
    const touch = e.touches[0]
    const deltaY = touch.clientY - toolbarDragStartY.current
    const buttonHeight = isMobile ? 64 : 72 // 按钮高度 + gap
    const totalButtons = 14 // 总按钮数
    const visibleButtons = 7 // 可见按钮数
    const maxOffset = -(totalButtons - visibleButtons) * buttonHeight // 最大向上偏移
    
    const newOffsetY = Math.min(0, Math.max(maxOffset, toolbarDragStartOffsetY.current + deltaY))
    setToolbarOffsetY(newOffsetY)
  }, [isToolbarDragging, isMobile])

  const handleToolbarTouchEnd = useCallback(() => {
    setIsToolbarDragging(false)
    const buttonHeight = isMobile ? 64 : 72
    const totalButtons = 14
    const visibleButtons = 7
    const maxOffset = -(totalButtons - visibleButtons) * buttonHeight
    
    // 判断滑动方向和位置
    const currentOffset = toolbarOffsetY
    const threshold = buttonHeight / 2 // 吸附阈值
    
    // 如果接近底部（偏移量接近0），固定在顶部
    if (currentOffset > -threshold) {
      setToolbarOffsetY(0)
    } 
    // 如果接近顶部（偏移量接近maxOffset），固定在底部
    else if (currentOffset < maxOffset + threshold) {
      setToolbarOffsetY(maxOffset)
    }
    // 否则吸附到最近的按钮位置
    else {
      const snapOffset = Math.round(currentOffset / buttonHeight) * buttonHeight
      setToolbarOffsetY(Math.max(maxOffset, Math.min(0, snapOffset)))
    }
  }, [toolbarOffsetY, isMobile])

  // 鼠标事件处理（桌面端）
  const handleToolbarMouseDown = useCallback((e) => {
    toolbarDragStartY.current = e.clientY
    toolbarDragStartOffsetY.current = toolbarOffsetY
    setIsToolbarDragging(true)
  }, [toolbarOffsetY])

  const handleToolbarMouseMove = useCallback((e) => {
    if (!isToolbarDragging) return
    e.preventDefault()
    const deltaY = e.clientY - toolbarDragStartY.current
    const buttonHeight = isMobile ? 64 : 72
    const totalButtons = 14
    const visibleButtons = 7
    const maxOffset = -(totalButtons - visibleButtons) * buttonHeight
    
    const newOffsetY = Math.min(0, Math.max(maxOffset, toolbarDragStartOffsetY.current + deltaY))
    setToolbarOffsetY(newOffsetY)
  }, [isToolbarDragging, isMobile])

  const handleToolbarMouseUp = useCallback(() => {
    if (!isToolbarDragging) return
    setIsToolbarDragging(false)
    const buttonHeight = isMobile ? 64 : 72
    const totalButtons = 14
    const visibleButtons = 7
    const maxOffset = -(totalButtons - visibleButtons) * buttonHeight
    
    const currentOffset = toolbarOffsetY
    const threshold = buttonHeight / 2
    
    if (currentOffset > -threshold) {
      setToolbarOffsetY(0)
    } else if (currentOffset < maxOffset + threshold) {
      setToolbarOffsetY(maxOffset)
    } else {
      const snapOffset = Math.round(currentOffset / buttonHeight) * buttonHeight
      setToolbarOffsetY(Math.max(maxOffset, Math.min(0, snapOffset)))
    }
  }, [toolbarOffsetY, isMobile, isToolbarDragging])

  // 监听 selectedFile 变化，自动加载模型
  useEffect(() => {
    if (selectedFile) {
      console.log('ARScene 接收到 selectedFile:', selectedFile)
      // 将 selectedFile 转换为 model 对象
      const model = {
        name: selectedFile.name?.replace('.vrm', '') || 'Unknown',
        filename: selectedFile.name,
        file: selectedFile
      }
      // 添加到当前选中的角色槽位
      setCharacters(prev => {
        const newCharacters = [...prev]
        newCharacters[selectedCharacterIndex] = model
        return newCharacters
      })
      showNotification(`已加载角色: ${model.name}`, 'success')
    }
  }, [selectedFile, selectedCharacterIndex, showNotification])

  // 执行MMD动作（用于交互模式等）- 先定义以避免循环依赖
  const executeMMDAction = useCallback((action, characterIndex) => {
    if (!action) return
    
    setMmdCurrentActions(prev => {
      const updated = [...prev]
      updated[characterIndex] = action
      return updated
    })
    setMmdActionStartTimes(prev => {
      const updated = [...prev]
      updated[characterIndex] = Date.now()
      return updated
    })
    setCurrentAction(action.id)
    showNotification(`角色${characterIndex + 1} MMD动作: ${action.name}`, 'success')
  }, [showNotification])

  // 执行动作 - 立即响应
  const executeAction = useCallback(async (action) => {
    console.log('🔥 executeAction 被调用:', action)
    
    // 处理动作对象或动作ID
    let actionId = typeof action === 'object' ? action.id : action
    let actionData = typeof action === 'object' ? action : null
    
    console.log('🔥 处理后的 actionId:', actionId)
    console.log('🔥 是否是 vrma:', actionId && actionId.startsWith('vrma_'))
    
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('executeAction', { detail: { action: actionId, actionName: actionId, intensity: actionIntensity[selectedCharacterIndex], characterIndex: selectedCharacterIndex } }))
    }

    if (actionId && actionId.startsWith('vrma_')) {
      try {
        // 如果没有动作数据，从vrmaActions中查找
        if (!actionData) {
          actionData = vrmaActions.find(a => a.id === actionId)
        }
        if (!actionData || !actionData.filePath) {
          console.error('❌ 找不到动作数据或filePath:', actionId)
          showNotification(`动作加载失败: ${actionId}`, 'error')
          return
        }
        const character = characters[selectedCharacterIndex]
        const key = character?.filename || character?.file?.name
        const vrm = (key && window.vrmModels?.[key]) || (window.vrmModels && Object.values(window.vrmModels)[0])
        if (!vrm) {
          console.error('❌ 没有可用的VRM模型')
          showNotification('请先加载角色模型', 'error')
          return
        }
        const loaded = await loadVRMAAction(actionData.filePath, vrm)
        if (!loaded || !loaded.clip) {
          console.error('❌ 加载VRMA动作失败:', actionData.filePath)
          showNotification(`动作加载失败: ${actionData.name}`, 'error')
          return
        }
        
        // 使用现有的 mixer 或创建新的
        let mixer = window.vrmaMixer
        if (!mixer) {
          mixer = new THREE.AnimationMixer(vrm.scene)
          window.vrmaMixer = mixer
        }
        
        // 停止之前的动作，但保持当前姿态
        const prevAction = mixer._actions[0]
        
        const clipAction = mixer.clipAction(loaded.clip)
        
        // 如果有之前的动作，进行平滑过渡
        if (prevAction && prevAction !== clipAction) {
          // 停止之前的动作
          prevAction.stop()
          // 新动作从当前姿态开始（不重置）
          clipAction.setLoop(THREE.LoopRepeat, Infinity).play()
        } else {
          // 第一个动作或相同动作
          clipAction.reset().setLoop(THREE.LoopRepeat, Infinity).play()
        }
        
        console.log('✅ VRMA 动画开始播放:', actionData.name, '时长:', loaded.duration, 'ms')
        showNotification(`角色${selectedCharacterIndex + 1}: ${actionData.name}`, 'success')
        setCurrentAction(actionId)
        return
      } catch (e) {
        console.error('VRMA 播放失败', e)
        showNotification('动作播放失败', 'error')
      }
    }

    setCurrentAction(actionId)

    if (actionId === 'combo') {
      setComboCount(prev => {
        const newCount = prev + 1
        if (newCount >= 3) {
          setShowCombo(true)
          setTimeout(() => setShowCombo(false), 2000)
        }
        return newCount
      })
    } else {
      setComboCount(0)
    }
  }, [actionIntensity, selectedCharacterIndex, useMMDActions, showNotification, executeMMDAction])

  // 切换摆动模式
  const toggleSwingMode = useCallback(() => {
    setIsSwingMode(prev => {
      const newState = !prev
      showNotification(newState ? '摆动模式已开启' : '摆动模式已关闭', 'info')
      return newState
    })
  }, [showNotification])

  // 切换随机模式
  const toggleRandomMode = useCallback(() => {
    setIsRandomMode(prev => {
      const newState = !prev
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('toggleRandom', { detail: { enabled: newState } }))
      }
      showNotification(newState ? '随机模式已开启' : '随机模式已关闭', 'info')
      return newState
    })
  }, [showNotification])

  // 暴露全局函数供 App.jsx 调用
  useEffect(() => {
    window.executeARAction = (action) => {
      console.log('🎬 执行AR动作:', action?.name || action?.id || action)
      console.log('动作对象:', action)
      if (action && typeof action === 'object') {
        executeAction(action)
      } else {
        console.error('❌ 无效的动作对象:', action)
      }
    }
    
    // 暂停动画
    window.arSystem = {
      pauseAnimation: () => {
        if (window.vrmaMixer) {
          window.vrmaMixer.timeScale = 0
          console.log('⏸️ 动画已暂停')
        }
      },
      resumeAnimation: () => {
        if (window.vrmaMixer) {
          window.vrmaMixer.timeScale = 1
          console.log('▶️ 动画已继续')
        }
      },
      stopAnimation: () => {
        if (window.vrmaMixer) {
          window.vrmaMixer.stopAllAction()
          console.log('⏹️ 动画已停止')
        }
      }
    }
    
    console.log('✅ AR动作全局函数已注册')
    
    return () => {
      delete window.executeARAction
      delete window.arSystem
    }
  }, [executeAction])

  // 自动保存场景状态
  useEffect(() => {
    const autoSave = () => {
      const sceneState = {
        characters: characters.map((char, idx) => char ? {
          ...char,
          position: characterPositions[idx],
          scale: characterScale,
          prop: characterProps?.[idx]
        } : null),
        characterScale,
        actionIntensity,
        currentAction,
        isARMode,
        timestamp: Date.now()
      }
      localStorage.setItem('autoSavedScene', JSON.stringify(sceneState))
      console.log('场景已自动保存')
    }

    // 每30秒自动保存一次
    const interval = setInterval(autoSave, 30000)

    // 页面卸载前保存
    window.addEventListener('beforeunload', autoSave)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', autoSave)
    }
  }, [characters, characterPositions, characterScale, actionIntensity, currentAction, isARMode, characterProps])

  // 加载自动保存的场景
  useEffect(() => {
    const loadAutoSaved = () => {
      const saved = localStorage.getItem('autoSavedScene')
      if (saved) {
        try {
          const sceneState = JSON.parse(saved)
          // 检查保存时间是否在24小时内
          if (Date.now() - sceneState.timestamp < 24 * 60 * 60 * 1000) {
            console.log('发现自动保存的场景:', sceneState)
            // 可以在这里添加恢复逻辑
          }
        } catch (e) {
          console.error('加载自动保存场景失败:', e)
        }
      }
    }
    loadAutoSaved()
  }, [])

  // 语音控制（暂时禁用）
  const isListening = false
  const transcript = ''
  const voiceError = null
  const isVoiceSupported = false
  const toggleListening = () => {}
  
  // useVoiceControl({
  //   onCommand: (action, text) => {
  //     console.log('语音指令:', action, '原文:', text)
  //     executeAction(action)
  //     showNotification(`语音指令: ${text}`, 'success')
  //   },
  //   enabled: showVoiceControl
  // })

  // 旋转画布
  const rotateCanvas = useCallback(() => {
    setIsRotating(true)
    setCanvasRotation(prev => {
      const newRotation = prev + 45 // 每次旋转45度
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('rotateCanvas', { detail: { rotation: newRotation } }))
      }
      return newRotation
    })
    showNotification('画布已旋转', 'info')
    setTimeout(() => setIsRotating(false), 500)
  }, [showNotification])

  // 添加角色
  const addCharacter = useCallback((index, model) => {
    // 为模型添加本地路径，用于从模型列表加载
    const modelWithPath = {
      ...model,
      localPath: `/models/${model.filename}`
    }
    setCharacters(prev => {
      const newCharacters = [...prev]
      newCharacters[index] = modelWithPath
      return newCharacters
    })
    setShowModelSelect(false)
    showNotification(`已添加角色: ${model.name}`, 'success')
  }, [showNotification])

  // 移除角色
  const removeCharacter = useCallback((index) => {
    setCharacters(prev => {
      const newCharacters = [...prev]
      newCharacters[index] = null
      return newCharacters
    })
    showNotification('角色已移除', 'info')
  }, [showNotification])

  // 拍照 - 带倒计时
  const takePhoto = useCallback(() => {
    if (isCountingDown) return
    
    // 开始倒计时
    setIsCountingDown(true)
    setPhotoCountdown(3)
    
    const countdownInterval = setInterval(() => {
      setPhotoCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          // 倒计时结束，执行拍照
          setTimeout(() => {
            capturePhoto()
            setIsCountingDown(false)
            setPhotoCountdown(0)
          }, 500)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [isCountingDown])
  
  // 实际拍照函数
  const capturePhoto = useCallback(() => {
    try {
      // 临时禁用特效，只保留模型
      const originalShowParticles = showParticles
      const originalStageEffects = { ...stageEffects }
      
      // 禁用粒子效果
      setShowParticles(false)
      // 禁用后期处理效果
      setStageEffects(prev => ({
        ...prev,
        bloom: false,
        particles: { ...prev.particles, enabled: false }
      }))
      
      addLog('📸 拍照模式：已禁用特效')
      
      // 获取3D画布 - 使用多种方式尝试
      let canvas3D = null
      
      // 方式1: 通过 glRef
      if (glRef.current?.domElement) {
        canvas3D = glRef.current.domElement
      }
      
      // 方式2: 通过 querySelector 查找 canvas
      if (!canvas3D) {
        canvas3D = document.querySelector('canvas')
      }
      
      // 方式3: 查找所有 canvas 并选择最大的那个（通常是3D场景）
      if (!canvas3D) {
        const canvases = document.querySelectorAll('canvas')
        let maxArea = 0
        canvases.forEach(c => {
          const area = c.width * c.height
          if (area > maxArea) {
            maxArea = area
            canvas3D = c
          }
        })
      }
      
      const video = videoRef.current

      if (!canvas3D) {
        showNotification('3D场景未就绪', 'error')
        addLog('错误: 无法找到3D画布')
        // 恢复特效
        setShowParticles(originalShowParticles)
        setStageEffects(originalStageEffects)
        return
      }

      // 判断是否应该使用摄像头画面（视频就绪且有流）
      const hasVideoStream = video && video.readyState >= 2 && video.videoWidth > 0 && streamRef.current
      
      addLog(`3D画布: ${canvas3D.width}x${canvas3D.height}`)
      addLog(`视频状态: ${video?.readyState}, 尺寸: ${video?.videoWidth}x${video?.videoHeight}`)
      addLog(`有视频流: ${hasVideoStream}, 流状态: ${streamRef.current ? '存在' : '不存在'}`)

      // 创建合成画布 - 使用视频的实际分辨率
      const compositeCanvas = document.createElement('canvas')
      const ctx = compositeCanvas.getContext('2d')

      // 设置画布尺寸 - 使用视频的实际分辨率或屏幕分辨率
      let width, height
      if (hasVideoStream) {
        width = video.videoWidth
        height = video.videoHeight
      } else {
        width = window.innerWidth
        height = window.innerHeight
      }
      compositeCanvas.width = width
      compositeCanvas.height = height
      
      addLog(`开始拍照: ${width}x${height}`)

      // 如果有视频流，先绘制摄像头画面
      if (hasVideoStream) {
        try {
          // 直接绘制视频，保持原始比例
          ctx.drawImage(video, 0, 0, width, height)
          addLog('✅ 摄像头画面已绘制')
          
          // 验证是否绘制成功 - 检查画布是否有内容
          const imageData = ctx.getImageData(0, 0, 1, 1)
          addLog(`像素检查: R=${imageData.data[0]}, G=${imageData.data[1]}, B=${imageData.data[2]}`)
        } catch (drawError) {
          addLog(`❌ 绘制视频失败: ${drawError.message}`)
          // 如果绘制失败，使用黑色背景
          ctx.fillStyle = '#000000'
          ctx.fillRect(0, 0, width, height)
        }
      } else {
        // 没有视频流时使用渐变背景
        addLog('⚠️ 无视频流，使用背景')
        const gradient = ctx.createLinearGradient(0, 0, width, height)
        gradient.addColorStop(0, '#1a1a2e')
        gradient.addColorStop(0.5, '#16213e')
        gradient.addColorStop(1, '#0f3460')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)
      }

      // 绘制3D场景（带透明通道）
      // 保持原始比例，避免模型变形
      const canvas3DAspect = canvas3D.width / canvas3D.height
      const outputAspect = width / height
      
      let drawWidth, drawHeight, offsetX, offsetY
      
      if (canvas3DAspect > outputAspect) {
        // 3D画布更宽，以宽度为基准
        drawWidth = width
        drawHeight = width / canvas3DAspect
        offsetX = 0
        offsetY = (height - drawHeight) / 2
      } else {
        // 3D画布更高，以高度为基准
        drawHeight = height
        drawWidth = height * canvas3DAspect
        offsetX = (width - drawWidth) / 2
        offsetY = 0
      }
      
      ctx.drawImage(canvas3D, offsetX, offsetY, drawWidth, drawHeight)
      addLog(`3D场景已绘制: ${drawWidth}x${drawHeight} at (${offsetX}, ${offsetY})`)

      // 添加精美水印
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.font = 'bold 24px Arial'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 10
      ctx.fillText('📸 AR Photo', 20, height - 30)
      
      ctx.font = '16px Arial'
      ctx.fillText(new Date().toLocaleString(), 20, height - 60)

      // 下载高清图片
      compositeCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ar-photo-${Date.now()}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        showNotification('📸 AR乐园照片已保存！', 'success')
        
        // 恢复特效
        setShowParticles(originalShowParticles)
        setStageEffects(originalStageEffects)
        addLog('✅ 特效已恢复')
      }, 'image/png', 0.95)
    } catch (error) {
      console.error('拍照失败:', error)
      showNotification('拍照失败，请重试', 'error')
      // 恢复特效
      setShowParticles(originalShowParticles)
      setStageEffects(originalStageEffects)
    }
  }, [showNotification, isARMode, showParticles, stageEffects])

  // 开始录像
  const startRecording = useCallback(() => {
    if (!streamRef.current) {
      showNotification('摄像头未就绪', 'error')
      return
    }

    try {
      // 临时禁用特效，只保留模型
      const originalShowParticles = showParticles
      const originalStageEffects = { ...stageEffects }
      setShowParticles(false)
      setStageEffects(prev => ({
        ...prev,
        bloom: false,
        particles: { ...prev.particles, enabled: false }
      }))
      
      // 保存原始状态用于恢复
      window.recordingOriginalEffects = {
        showParticles: originalShowParticles,
        stageEffects: originalStageEffects
      }
      
      const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' })
      mediaRecorderRef.current = mediaRecorder
      recordedChunksRef.current = []
      setRecordingTime(0)

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ar-video-${Date.now()}.webm`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        showNotification('录像已保存!', 'success')
      }

      mediaRecorder.start()
      setIsRecording(true)
      recordingTimerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000)
      showNotification('开始录像', 'info')
    } catch (error) {
      showNotification('录像失败', 'error')
    }
  }, [showNotification])

  // 停止录像
  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current) return
    
    mediaRecorderRef.current.stop()
    setIsRecording(false)
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    
    // 恢复特效
    if (window.recordingOriginalEffects) {
      setShowParticles(window.recordingOriginalEffects.showParticles)
      setStageEffects(window.recordingOriginalEffects.stageEffects)
      delete window.recordingOriginalEffects
    }
  }, [])

  // 格式化时间
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // 切换摄像头
  const toggleCamera = useCallback(async () => {
    const newMode = cameraFacingMode === 'environment' ? 'user' : 'environment'
    setCameraFacingMode(newMode)
    showNotification(`切换到${newMode === 'environment' ? '后置' : '前置'}摄像头`, 'info')
    
    // 停止当前视频流
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    // 重新初始化摄像头
    if (isARMode && videoRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: newMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        })
        streamRef.current = stream
        videoRef.current.srcObject = stream
        videoRef.current.play()
      } catch (err) {
        console.error('切换摄像头失败:', err)
        showNotification('切换摄像头失败', 'error')
      }
    }
  }, [cameraFacingMode, isARMode, showNotification])

  // 陀螺仪监听 - 已禁用，避免模型跟随手机陀螺仪移动
  // useEffect(() => {
  //   if (!isSwingMode || !window.DeviceOrientationEvent) return
  //   
  //   const handleOrientation = (event) => {
  //     const { alpha, beta, gamma } = event
  //     const gyroData = { x: beta, y: gamma, z: alpha }
  //     
  //     const swingX = Math.abs(gyroData.x - lastGyroDataRef.current.x)
  //     const swingY = Math.abs(gyroData.y - lastGyroDataRef.current.y)
  //     const swingZ = Math.abs(gyroData.z - lastGyroDataRef.current.z)
  //     
  //     if (swingX > swingThreshold || swingY > swingThreshold || swingZ > swingThreshold) {
  //       if (window.dispatchEvent) {
  //         window.dispatchEvent(new CustomEvent('swingDetected', { detail: { swingX, swingY, swingZ } }))
  //       }
  //     }
  //     lastGyroDataRef.current = gyroData
  //   }
  //   
  //   window.addEventListener('deviceorientation', handleOrientation)
  //   return () => window.removeEventListener('deviceorientation', handleOrientation)
  // }, [isSwingMode])

  // 摄像头初始化
  useEffect(() => {
    if (!isARMode) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
      if (videoRef.current) videoRef.current.srcObject = null
      return
    }
    
    const initCamera = async () => {
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          showNotification('浏览器不支持摄像头', 'error')
          setIsARMode(false)
          return
        }
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop())
        }
        
        console.log('正在请求摄像头权限...')
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: cameraFacingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        })
        console.log('摄像头权限获取成功，轨道数:', stream.getVideoTracks().length)
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          console.log('视频流已设置到video元素')
          // 确保视频开始播放
          videoRef.current.onloadedmetadata = () => {
            console.log('视频元数据加载完成，准备播放')
            videoRef.current.play().then(() => {
              console.log('视频播放成功')
            }).catch(e => {
              console.error('视频播放失败:', e)
              showNotification('视频播放失败，请刷新页面重试', 'error')
            })
          }
          videoRef.current.onerror = (e) => {
            console.error('视频元素错误:', e)
          }
        } else {
          console.error('videoRef.current 不存在')
        }
      } catch (err) {
        showNotification('摄像头权限被拒绝', 'error')
        setIsARMode(false)
      }
    }
    
    initCamera()
  }, [isARMode, cameraFacingMode, showNotification])

  // 自动启动AR模式
  useEffect(() => {
    if (selectedFile) {
      const timer = setTimeout(() => setIsARMode(true), 500)
      return () => clearTimeout(timer)
    }
  }, [selectedFile])

  // 监听关闭骨骼编辑器事件
  useEffect(() => {
    const handleCloseBoneEditor = () => {
      setIsBoneEditing(false)
    }
    window.addEventListener('closeBoneEditor', handleCloseBoneEditor)
    return () => window.removeEventListener('closeBoneEditor', handleCloseBoneEditor)
  }, [])

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* 全局CSS动画 */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0) scale(1.2); }
          50% { transform: translateY(-10px) scale(1.2); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        @keyframes slideDown {
          from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes ripple {
          from { transform: scale(0.8); opacity: 1; }
          to { transform: scale(2); opacity: 0; }
        }
        @keyframes comboPop {
          0% { transform: scale(0) rotate(-10deg); }
          50% { transform: scale(1.2) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes countdownPulse {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes glow {
          from { box-shadow: 0 0 20px rgba(0, 212, 255, 0.4); }
          to { box-shadow: 0 0 40px rgba(0, 212, 255, 0.8), 0 0 60px rgba(255, 107, 157, 0.4); }
        }
        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(255, 107, 107, 0.5), 0 0 40px rgba(255, 107, 107, 0.3);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 30px rgba(255, 107, 107, 0.8), 0 0 60px rgba(255, 107, 107, 0.5);
            transform: scale(1.05);
          }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ff9ecd 0%, #ff6b9d 100%);
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(255, 107, 157, 0.5);
        }
        /* 设置面板滚动条样式 */
        .settings-scroll-container::-webkit-scrollbar {
          width: 6px;
        }
        .settings-scroll-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .settings-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .settings-scroll-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
      
      {/* AR视频背景 - 确保在底层 */}
      {isARMode && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          backgroundColor: '#000',
          overflow: 'hidden'
        }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            webkit-playsinline="true"
            x5-playsinline="true"
            disablePictureInPicture
            disableRemotePlayback
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              minWidth: '100%',
              minHeight: '100%',
              width: 'auto',
              height: 'auto',
              transform: 'translate(-50%, -50%)',
              objectFit: 'cover',
              display: 'block'
            }}
          />
        </div>
      )}

      {/* 3D画布 - 扩大至全屏 */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1,
        background: isARMode ? 'transparent' : 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #16213e 100%)',
        // 应用滤镜效果
        filter: stageEffects?.filter?.enabled ? getFilterCSS(stageEffects.filter) : 'none',
        transition: 'filter 0.3s ease'
      }}>
        <Canvas 
          gl={{ 
            alpha: true, 
            antialias: true, 
            powerPreference: "high-performance",
            preserveDrawingBuffer: true
          }} 
          style={{ background: 'transparent' }}
          onCreated={({ gl }) => { 
            glRef.current = gl
            console.log('Canvas created')
            // 暴露 canvas 给父组件
            if (gl.domElement) {
              window.arCanvas = gl.domElement
            }
          }}
        >
          <PerspectiveCamera makeDefault position={[0, 0.8, 2.5]} fov={50} />
          <ambientLight intensity={2.0} />
          <hemisphereLight intensity={1.5} groundColor="#444444" />
          <spotLight position={[5, 10, 5]} intensity={2.0} castShadow />
          <directionalLight position={[0, 5, 0]} intensity={1.5} />
          <directionalLight position={[-5, 5, 5]} intensity={1.0} color="#ffffff" />
          <directionalLight position={[5, 5, -5]} intensity={0.8} color="#ffecd2" />
          <pointLight position={[0, 3, 3]} intensity={1.5} color="#ffffff" distance={10} />
          <pointLight position={[-3, 3, 0]} intensity={1.0} color="#e0f7fa" distance={8} />
          
          <ARContent 
            characters={characters}
            selectedCharacterIndex={selectedCharacterIndex}
            characterScale={characterScale}
            actionIntensity={actionIntensity}
            isARMode={isARMode}
            characterPositions={characterPositions}
            characterProps={characterProps}
            isBoneEditing={isBoneEditing}
            showParticles={showParticles}
            particleType={particleType}
            modelVisibility={modelVisibility}
            modelOpacity={modelOpacity}
            stageEffects={stageEffects}
            mmdCurrentActions={mmdCurrentActions}
            mmdActionStartTimes={mmdActionStartTimes}
            onBoneChange={(boneName, rotation) => {
              console.log('骨骼变化:', boneName, rotation)
            }}
            onPositionChange={(index, newPos) => {
              setCharacterPositions(prev => {
                const updated = [...prev]
                updated[index] = newPos
                return updated
              })
            }}
            onPropInteract={(action, furniture) => {
              console.log('家具交互:', action, furniture)
              // 触发动作
              executeAction(action)
              // 显示通知
              showNotification(`${furniture.name}: ${action}`, 'success')
            }}
            onSelectCharacter={(index) => {
              setSelectedCharacterIndex(index)
              setSettingsTargetIndex(index)
            }}
            handleCharacterInteract={(index, bodyPart, actionId, touchPoint) => {
              console.log(`角色${index}被触摸了${bodyPart}，播放动作${actionId}`)
              // 播放对应的MMD动作
              const action = getActionById(actionId)
              if (action) {
                executeMMDAction(action, index)
                showNotification(`触摸了${bodyPart}：${action.name}`, 'success')
              }
            }}
          />
          
          {/* OrbitControls - 移动端始终启用，AR模式下也可以调整模型位置 */}
          <OrbitControls
            enablePan={true}
            enableRotate={!isARMode}
            enableZoom={true}
            minDistance={1}
            maxDistance={5}
            target={[0, 0.6, 0]}
            maxPolarAngle={Math.PI / 1.8}
            touches={{
              ONE: THREE.TOUCH.ROTATE,
              TWO: THREE.TOUCH.DOLLY_PAN
            }}
          />
        </Canvas>
      </div>
      
      {/* 通知 */}
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      
      {/* 连击显示 */}
      {showCombo && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '72px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #ffd93d 0%, #ff6b6b 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 4px 20px rgba(255, 217, 61, 0.5)',
          animation: 'comboPop 0.5s ease',
          zIndex: 9999,
          pointerEvents: 'none'
        }}>
          x{comboCount} COMBO!
        </div>
      )}
      
      {/* 拍照倒计时显示 */}
      {isCountingDown && photoCountdown > 0 && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.9) 0%, rgba(255, 107, 157, 0.9) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '80px',
          fontWeight: 'bold',
          color: 'white',
          textShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 10000,
          animation: 'countdownPulse 1s ease-in-out',
          boxShadow: '0 0 60px rgba(0, 212, 255, 0.6)'
        }}>
          {photoCountdown}
        </div>
      )}
      
      {/* 现代化顶部状态栏 */}
      <ModernHeader
        isMobile={isMobile}
        isARMode={isARMode}
        isRecording={isRecording}
        recordingTime={recordingTime}
        showSettings={showSettings}
        cameraFacingMode={cameraFacingMode}
        onHelp={() => setShowHelp(true)}
        onSettings={() => setShowSettings(!showSettings)}
        onToggleCamera={toggleCamera}
        onToggleAR={() => setIsARMode(!isARMode)}
        onEnterWebXR={() => setIsWebXRARMode(true)}
        onToggleRecording={isRecording ? stopRecording : startRecording}
      />

      {/* 设置面板 - 仅在编辑模式显示 */}
      {showSettings && isEditMode && (
        <div style={{
          position: 'absolute',
          top: '85px',
          right: '20px',
          width: isMobile ? 'calc(100vw - 40px)' : '320px',
          maxWidth: '400px',
          maxHeight: isMobile ? 'calc(100vh - 120px)' : '70vh',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
          borderRadius: '24px',
          padding: '20px',
          zIndex: 1001,
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          animation: 'slideDown 0.3s ease',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚙️</span> 设置
            </div>
            <button
              onClick={() => setShowSettings(false)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >×</button>
          </div>

          <div style={{
            display: 'flex',
            gap: '6px',
            marginBottom: '16px',
            padding: '8px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px'
          }}>
            {[0, 1, 2].map(idx => {
              const hasCharacter = characters[idx] !== null
              return (
                <button
                  key={idx}
                  onClick={() => setSettingsTargetIndex(idx)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: settingsTargetIndex === idx
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'transparent',
                    color: hasCharacter ? 'white' : 'rgba(255,255,255,0.3)',
                    fontSize: '12px',
                    cursor: hasCharacter ? 'pointer' : 'not-allowed',
                    opacity: hasCharacter ? 1 : 0.5,
                    transition: 'all 0.2s ease'
                  }}
                >
                  角色{idx + 1}
                  {!hasCharacter && ' (空)'}
                </button>
              )
            })}
          </div>

          {/* 可滚动内容区域 */}
          <div className="settings-scroll-container" style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingRight: '8px',
            marginRight: '-8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.3) transparent'
          }}>
            {/* 角色位置调整 */}
            <div style={{
              padding: '12px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                fontSize: '13px',
                color: 'rgba(255,255,255,0.9)'
              }}>
                <span>📍</span>
                <span>角色位置</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* X轴位置 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', width: '20px' }}>X</span>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.1"
                    value={characterPositions[settingsTargetIndex]?.[0] || 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value)
                      setCharacterPositions(prev => {
                        const updated = [...prev]
                        updated[settingsTargetIndex] = [val, updated[settingsTargetIndex][1], updated[settingsTargetIndex][2]]
                        return updated
                      })
                    }}
                    style={{ flex: 1, height: '4px' }}
                  />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', width: '40px', textAlign: 'right' }}>
                    {characterPositions[settingsTargetIndex]?.[0]?.toFixed(1) || 0}
                  </span>
                </div>
                {/* Y轴位置 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', width: '20px' }}>Y</span>
                  <input
                    type="range"
                    min="-5"
                    max="5"
                    step="0.1"
                    value={characterPositions[settingsTargetIndex]?.[1] || 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value)
                      setCharacterPositions(prev => {
                        const updated = [...prev]
                        updated[settingsTargetIndex] = [updated[settingsTargetIndex][0], val, updated[settingsTargetIndex][2]]
                        return updated
                      })
                    }}
                    style={{ flex: 1, height: '4px' }}
                  />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', width: '40px', textAlign: 'right' }}>
                    {characterPositions[settingsTargetIndex]?.[1]?.toFixed(1) || 0}
                  </span>
                </div>
                {/* Z轴位置 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', width: '20px' }}>Z</span>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.1"
                    value={characterPositions[settingsTargetIndex]?.[2] || 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value)
                      setCharacterPositions(prev => {
                        const updated = [...prev]
                        updated[settingsTargetIndex] = [updated[settingsTargetIndex][0], updated[settingsTargetIndex][1], val]
                        return updated
                      })
                    }}
                    style={{ flex: 1, height: '4px' }}
                  />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', width: '40px', textAlign: 'right' }}>
                    {characterPositions[settingsTargetIndex]?.[2]?.toFixed(1) || 0}
                  </span>
                </div>
              </div>
              {/* 重置位置按钮 */}
              <button
                onClick={() => {
                  const defaultPositions = [
                    [0, -0.3, 0],
                    [-3, -0.3, 0],
                    [3, -0.3, 0]
                  ]
                  setCharacterPositions(prev => {
                    const updated = [...prev]
                    updated[settingsTargetIndex] = defaultPositions[settingsTargetIndex]
                    return updated
                  })
                }}
                style={{
                  marginTop: '8px',
                  width: '100%',
                  padding: '6px 12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
              >
                🔄 重置位置
              </button>
            </div>

            {/* 角色旋转控制 */}
            <div style={{
              padding: '12px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                fontSize: '13px',
                color: 'rgba(255,255,255,0.9)'
              }}>
                <span>🔄</span>
                <span>快速旋转</span>
              </div>
              
              {/* 旋转按钮网格 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                marginBottom: '12px'
              }}>
                {[
                  { angle: 0, label: '正面', icon: '⬆️' },
                  { angle: 90, label: '右面', icon: '➡️' },
                  { angle: 180, label: '背面', icon: '⬇️' },
                  { angle: 270, label: '左面', icon: '⬅️' },
                  { angle: 45, label: '右前', icon: '↗️' },
                  { angle: 135, label: '右后', icon: '↘️' },
                  { angle: 225, label: '左后', icon: '↙️' },
                  { angle: 315, label: '左前', icon: '↖️' }
                ].map(({ angle, label, icon }) => (
                  <button
                    key={angle}
                    onClick={() => {
                      // 触发角色旋转事件
                      window.dispatchEvent(new CustomEvent('rotateCharacter', {
                        detail: { index: settingsTargetIndex, angle: (angle * Math.PI) / 180 }
                      }))
                      showNotification(`角色${settingsTargetIndex + 1} 旋转到 ${label}`, 'success')
                    }}
                    style={{
                      padding: '10px 4px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.15)'
                      e.target.style.transform = 'scale(1.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.08)'
                      e.target.style.transform = 'scale(1)'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* 对称旋转按钮 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px'
              }}>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('rotateCharacter', {
                      detail: { index: settingsTargetIndex, angle: Math.PI }
                    }))
                    showNotification(`角色${settingsTargetIndex + 1} 旋转180度（面对我）`, 'success')
                  }}
                  style={{
                    padding: '10px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  👤 面对我 (180°)
                </button>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('rotateCharacter', {
                      detail: { index: settingsTargetIndex, angle: 0 }
                    }))
                    showNotification(`角色${settingsTargetIndex + 1} 重置旋转`, 'success')
                  }}
                  style={{
                    padding: '10px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                >
                  🔄 重置旋转
                </button>
              </div>
            </div>

            {/* 预留的10个预设位置 */}
            <div style={{
              padding: '12px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                fontSize: '13px',
                color: 'rgba(255,255,255,0.9)'
              }}>
                <span>📍</span>
                <span>预设位置 (预留)</span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '8px'
              }}>
                {Array.from({ length: 10 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => showNotification(`预设位置 ${i + 1} 功能预留`, 'info')}
                    style={{
                      padding: '12px 4px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px dashed rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: '11px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.1)'
                      e.target.style.color = 'rgba(255,255,255,0.8)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.05)'
                      e.target.style.color = 'rgba(255,255,255,0.5)'
                    }}
                  >
                    预设{i + 1}
                  </button>
                ))}
              </div>
            </div>

            <Slider
              value={characterScale[settingsTargetIndex]}
              onChange={(val) => {
                setCharacterScale(prev => {
                  const updated = [...prev]
                  updated[settingsTargetIndex] = val
                  return updated
                })
              }}
              min={0.5}
              max={2.0}
              label="角色大小"
              icon="📏"
            />

            <Slider
              value={actionIntensity[settingsTargetIndex]}
              onChange={(val) => {
                setActionIntensity(prev => {
                  const updated = [...prev]
                  updated[settingsTargetIndex] = val
                  return updated
                })
              }}
              min={0.5}
              max={2.0}
              label="动作强度"
              icon="💪"
            />

            {/* 模型精度设置 */}
            <div style={{
              padding: '12px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                fontSize: '13px',
                color: 'rgba(255,255,255,0.9)'
              }}>
                <span>🎯</span>
                <span>模型精度</span>
              </div>
              <div style={{
                display: 'flex',
                gap: '6px'
              }}>
                {[
                  { id: 0.5, name: '低', desc: '性能优先' },
                  { id: 0.75, name: '中', desc: '平衡' },
                  { id: 1.0, name: '高', desc: '画质优先' }
                ].map(quality => (
                  <button
                    key={quality.id}
                    onClick={() => {
                      setModelQuality(prev => {
                        const updated = [...prev]
                        updated[settingsTargetIndex] = quality.id
                        localStorage.setItem('modelQuality', JSON.stringify(updated))
                        return updated
                      })
                      showNotification(`模型精度已设置为: ${quality.name}`, 'success')
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: 'none',
                      background: modelQuality[settingsTargetIndex] === quality.id
                        ? 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)'
                        : 'rgba(255,255,255,0.1)',
                      color: 'white',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>{quality.name}</div>
                    <div style={{ fontSize: '10px', opacity: 0.7 }}>{quality.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 模型显示设置 */}
            <div style={{
              padding: '12px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                fontSize: '13px',
                color: 'rgba(255,255,255,0.9)'
              }}>
                <span>👁️</span>
                <span>模型显示</span>
              </div>

              {/* 显示/隐藏切换 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>显示模型</span>
                <button
                  onClick={() => {
                    setModelVisibility(prev => {
                      const updated = [...prev]
                      updated[settingsTargetIndex] = !updated[settingsTargetIndex]
                      localStorage.setItem('modelVisibility', JSON.stringify(updated))
                      return updated
                    })
                  }}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    border: 'none',
                    background: modelVisibility[settingsTargetIndex]
                      ? 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)'
                      : 'rgba(255,255,255,0.2)',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    left: modelVisibility[settingsTargetIndex] ? '22px' : '2px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'white',
                    transition: 'all 0.2s ease'
                  }}/>
                </button>
              </div>

              {/* 透明度滑块 */}
              <div style={{ opacity: modelVisibility[settingsTargetIndex] ? 1 : 0.5 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px'
                }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>透明度</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                    {Math.round(modelOpacity[settingsTargetIndex] * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={modelOpacity[settingsTargetIndex]}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    setModelOpacity(prev => {
                      const updated = [...prev]
                      updated[settingsTargetIndex] = val
                      localStorage.setItem('modelOpacity', JSON.stringify(updated))
                      return updated
                    })
                  }}
                  disabled={!modelVisibility[settingsTargetIndex]}
                  style={{
                    width: '100%',
                    height: '4px',
                    borderRadius: '2px',
                    background: 'rgba(255,255,255,0.2)',
                    outline: 'none',
                    WebkitAppearance: 'none',
                    cursor: modelVisibility[settingsTargetIndex] ? 'pointer' : 'not-allowed'
                  }}
                />
              </div>
            </div>

            {/* 快速操作提示 */}
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: 'rgba(0, 212, 255, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(0, 212, 255, 0.2)'
            }}>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.8)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <span>💡</span>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>操作提示</div>
                  <div style={{ opacity: 0.7, lineHeight: '1.5' }}>
                    • 拖拽角色可移动位置<br/>
                    • 使用姿势面板切换动作<br/>
                    • 双指捏合可缩放角色
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 左侧人物管理按钮 */}
      <div style={{
        position: 'absolute',
        left: isMobile ? '8px' : '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 100
      }}>
        <button
          onClick={() => setShowCharacterManager(true)}
          style={{
            width: isMobile ? '50px' : '70px',
            height: isMobile ? '50px' : '70px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
            border: '3px solid rgba(255,255,255,0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '24px' : '32px',
            color: 'white',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 20px rgba(196, 69, 105, 0.5)',
            position: 'relative'
          }}
        >
          👥
          {/* 角色数量徽章 */}
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: '#00d4ff',
            color: 'white',
            fontSize: isMobile ? '10px' : '12px',
            fontWeight: 'bold',
            padding: '2px 6px',
            borderRadius: '10px',
            minWidth: '18px'
          }}>
            {characters.filter(c => c !== null).length}/3
          </span>
        </button>
      </div>

      {/* 模型选择弹窗 */}
      {showModelSelect && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
            borderRadius: '32px',
            padding: '32px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{ color: 'white', margin: 0, fontSize: '24px' }}>选择角色</h2>
              <button
                onClick={() => setShowModelSelect(false)}
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

            {/* 标签快捷筛选 */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '16px'
            }}>
              {['#原神', '#星穹铁道', '#崩坏3', '#V家', '#正太', '#萝莉', '#御姐', '#少年', '#成男', '#成女', '#男性', '#女性'].map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    const cleanTag = tag.replace('#', '')
                    if (characterSearchQuery.includes(cleanTag)) {
                      setCharacterSearchQuery(characterSearchQuery.replace(cleanTag, '').replace('#', '').trim())
                    } else {
                      setCharacterSearchQuery(cleanTag)
                    }
                  }}
                  style={{
                    padding: '6px 12px',
                    background: characterSearchQuery && 
                      (modelList.some(m => m.tags?.some(t => t.toLowerCase().includes(characterSearchQuery.toLowerCase()))) ||
                       characterSearchQuery.toLowerCase() === tag.replace('#', '').toLowerCase())
                      ? 'linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: 'white',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '16px'
            }}>
              {modelList
                .filter(model => {
                  if (!characterSearchQuery.trim()) return true
                  const query = characterSearchQuery.toLowerCase()
                  // 支持标签搜索 (#开头的)
                  if (query.startsWith('#')) {
                    return model.tags?.some(tag => tag.toLowerCase().includes(query))
                  }
                  // 支持名称和标签搜索
                  return model.name.toLowerCase().includes(query) ||
                         model.game?.toLowerCase().includes(query) ||
                         model.tags?.some(tag => tag.toLowerCase().includes(query))
                })
                .map((model, index) => (
                <button
                  key={index}
                  onClick={() => addCharacter(selectedCharacterIndex, model)}
                  style={{
                    padding: '16px',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    border: '2px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.3s ease',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0,212,255,0.5)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {/* 游戏来源标识 */}
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    fontSize: '16px'
                  }}>
                    {model.avatar || '🌸'}
                  </div>
                  
                  {/* 角色预览图/图标 */}
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(157,0,255,0.2) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '36px',
                    border: '2px solid rgba(255,255,255,0.2)'
                  }}>
                    {model.avatar || '👤'}
                  </div>
                  
                  {/* 角色名称 */}
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    {model.name}
                  </div>
                  
                  {/* 游戏来源 */}
                  <div style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.6)',
                    background: 'rgba(255,255,255,0.1)',
                    padding: '2px 8px',
                    borderRadius: '10px'
                  }}>
                    {model.game || '未知'}
                  </div>
                  
                  {/* 标签展示 */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    justifyContent: 'center',
                    marginTop: '4px'
                  }}>
                    {model.tags?.slice(0, 3).map((tag, i) => (
                      <span key={i} style={{
                        fontSize: '10px',
                        color: 'rgba(255,255,255,0.5)',
                        background: 'rgba(255,255,255,0.08)',
                        padding: '2px 6px',
                        borderRadius: '8px'
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 家具选择弹窗 */}
      {showPropSelect && (
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
          zIndex: 2000,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
            borderRadius: '24px',
            padding: isMobile ? '20px' : '32px',
            maxWidth: '700px',
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
              <div>
                <h2 style={{ 
                  color: 'white', 
                  margin: 0, 
                  fontSize: isMobile ? '20px' : '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  🏠 选择家具/道具
                  <span style={{
                    fontSize: isMobile ? '12px' : '14px',
                    color: 'rgba(255,255,255,0.6)',
                    fontWeight: 'normal'
                  }}>
                    角色{propTargetCharacter + 1}
                  </span>
                </h2>
              </div>
              <button
                onClick={() => setShowPropSelect(false)}
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

            {/* 搜索框 */}
            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '16px'
            }}>
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '14px',
                padding: isMobile ? '10px 14px' : '12px 16px',
                border: '1px solid rgba(255,255,255,0.15)'
              }}>
                <span style={{ fontSize: '16px', marginRight: '8px' }}>🔍</span>
                <input
                  type="text"
                  placeholder="搜索家具..."
                  value={furnitureSearchQuery}
                  onChange={(e) => setFurnitureSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontSize: isMobile ? '13px' : '14px',
                    outline: 'none'
                  }}
                />
                {furnitureSearchQuery && (
                  <button
                    onClick={() => setFurnitureSearchQuery('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: '16px',
                      cursor: 'pointer'
                    }}
                  >✕</button>
                )}
              </div>
            </div>

            {/* 分类标签 */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '16px',
              overflowX: 'auto',
              padding: '4px 0'
            }}>
              <button
                onClick={() => setActiveFurnitureCategory('all')}
                style={{
                  padding: isMobile ? '6px 12px' : '8px 14px',
                  background: activeFurnitureCategory === 'all'
                    ? 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)'
                    : 'rgba(255,255,255,0.08)',
                  border: `1px solid ${activeFurnitureCategory === 'all' ? '#00d4ff' : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: '14px',
                  color: 'white',
                  fontSize: isMobile ? '11px' : '12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                全部
              </button>
              {furnitureCategories.filter(c => c.id !== 'none').map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveFurnitureCategory(cat.id)}
                  style={{
                    padding: isMobile ? '6px 12px' : '8px 14px',
                    background: activeFurnitureCategory === cat.id
                      ? `linear-gradient(135deg, ${cat.color} 0%, ${cat.color}dd 100%)`
                      : 'rgba(255,255,255,0.08)',
                    border: `1px solid ${activeFurnitureCategory === cat.id ? cat.color : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: '14px',
                    color: 'white',
                    fontSize: isMobile ? '11px' : '12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* 家具列表 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
              gap: isMobile ? '8px' : '12px',
              maxHeight: '50vh',
              overflowY: 'auto',
              padding: '4px'
            }}>
              {/* 无家具选项 */}
              <button
                onClick={() => {
                  setCharacterProps(prev => {
                    const updated = [...prev]
                    updated[propTargetCharacter] = null
                    return updated
                  })
                  setShowPropSelect(false)
                  showNotification(`已清除角色${propTargetCharacter + 1}的家具`, 'info')
                }}
                style={{
                  padding: isMobile ? '12px 8px' : '16px 12px',
                  background: !characterProps[propTargetCharacter]
                    ? 'linear-gradient(135deg, #ff6b6b40 0%, #ff6b6b20 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
                  border: `2px solid ${!characterProps[propTargetCharacter] ? '#ff6b6b' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ fontSize: isMobile ? '28px' : '32px' }}>❌</div>
                <div style={{ 
                  fontSize: isMobile ? '10px' : '11px', 
                  fontWeight: '600',
                  color: 'white'
                }}>无家具</div>
              </button>

              {/* 家具选项 */}
              {(furnitureSearchQuery.trim()
                ? searchFurniture(furnitureSearchQuery)
                : activeFurnitureCategory === 'all'
                  ? furnitureList.filter(f => f.id !== 'none')
                  : getFurnitureByCategory(activeFurnitureCategory)
              ).map((furniture) => (
                <button
                  key={furniture.id}
                  onClick={() => {
                    setCharacterProps(prev => {
                      const updated = [...prev]
                      updated[propTargetCharacter] = furniture.id
                      return updated
                    })
                    setShowPropSelect(false)
                    showNotification(`给角色${propTargetCharacter + 1}装备了${furniture.name}`, 'success')

                    // 家具与人物无缝对接 - 根据家具类型调整角色位置和姿势
                    if (furniture.category === 'seat') {
                      // 座椅类 - 角色坐下，调整高度到座椅表面
                      setCharacterPositions(prev => {
                        const updated = [...prev]
                        const currentPos = updated[propTargetCharacter] || [0, 0, 0]
                        // 座椅高度约0.5米
                        updated[propTargetCharacter] = [currentPos[0], 0.25, currentPos[2]]
                        return updated
                      })
                      // 自动触发坐姿（MMD动作）
                      setTimeout(() => {
                        executeAction('mmd_sit')
                      }, 200)
                    } else if (furniture.category === 'bed') {
                      // 床铺类 - 角色躺下
                      setCharacterPositions(prev => {
                        const updated = [...prev]
                        const currentPos = updated[propTargetCharacter] || [0, 0, 0]
                        // 床高度约0.3米
                        updated[propTargetCharacter] = [currentPos[0], 0.15, currentPos[2]]
                        return updated
                      })
                      // 自动触发躺姿（MMD动作）
                      setTimeout(() => {
                        executeAction('mmd_idle')
                      }, 200)
                    } else if (furniture.position === 'hand') {
                      // 手持物品 - 调整手部位置（MMD动作）
                      setTimeout(() => {
                        executeAction('mmd_wave')
                      }, 200)
                    }

                    // 如果家具有自动姿势，触发该姿势（MMD动作）
                    if (furniture.autoPose) {
                      setTimeout(() => {
                        // 将旧的动作ID映射到MMD动作
                        const mmdActionMap = {
                          'sit': 'mmd_sit',
                          'stand': 'mmd_stand',
                          'walk': 'mmd_walk',
                          'run': 'mmd_run',
                          'jump': 'mmd_jump',
                          'wave': 'mmd_wave',
                          'clap': 'mmd_clap'
                        }
                        const mmdActionId = mmdActionMap[furniture.autoPose] || furniture.autoPose
                        executeAction(mmdActionId)
                      }, 300)
                    }
                  }}
                  style={{
                    padding: isMobile ? '12px 8px' : '16px 12px',
                    background: characterProps[propTargetCharacter] === furniture.id
                      ? `linear-gradient(135deg, ${furniture.color}50 0%, ${furniture.color}30 100%)`
                      : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
                    border: `2px solid ${characterProps[propTargetCharacter] === furniture.id ? furniture.color : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ fontSize: isMobile ? '28px' : '32px' }}>{furniture.icon}</div>
                  <div style={{ 
                    fontSize: isMobile ? '10px' : '11px', 
                    fontWeight: '600',
                    color: 'white',
                    textAlign: 'center'
                  }}>{furniture.name}</div>
                  {furniture.autoPose && (
                    <div style={{
                      fontSize: '9px',
                      color: furniture.color,
                      background: `${furniture.color}30`,
                      padding: '2px 6px',
                      borderRadius: '8px'
                    }}>
                      自动姿势
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* 底部提示 */}
            <div style={{
              marginTop: '16px',
              padding: '16px',
              background: 'linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(102,126,234,0.15) 100%)',
              borderRadius: '14px',
              border: '1px solid rgba(0,212,255,0.3)',
              color: 'rgba(255,255,255,0.9)',
              fontSize: isMobile ? '11px' : '12px',
              textAlign: 'center',
              lineHeight: '1.6'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '6px', color: '#00d4ff' }}>💡 家具使用指南</div>
              <div>• 点击家具可直接触发交互动作</div>
              <div>• 座椅类会自动调整角色为坐姿</div>
              <div>• 床铺类会自动调整角色为躺姿</div>
              <div>• 乐器类可触发演奏动作</div>
            </div>
          </div>
        </div>
      )}

      {/* 人物管理面板 */}
      {showCharacterManager && (
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
          zIndex: 3000,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
            borderRadius: '24px',
            padding: isMobile ? '20px' : '32px',
            maxWidth: '700px',
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
              marginBottom: '24px'
            }}>
              <div>
                <h2 style={{ 
                  color: 'white', 
                  margin: 0, 
                  fontSize: isMobile ? '20px' : '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  👥 人物管理
                  <span style={{
                    fontSize: isMobile ? '12px' : '14px',
                    color: 'rgba(255,255,255,0.6)',
                    fontWeight: 'normal'
                  }}>
                    ({characters.filter(c => c !== null).length}/3)
                  </span>
                </h2>
              </div>
              <button
                onClick={() => setShowCharacterManager(false)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >×</button>
            </div>

            {/* 搜索框 */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '24px'
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
                  placeholder="搜索角色..."
                  value={characterSearchQuery}
                  onChange={(e) => setCharacterSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontSize: isMobile ? '14px' : '15px',
                    outline: 'none'
                  }}
                />
                {characterSearchQuery && (
                  <button
                    onClick={() => setCharacterSearchQuery('')}
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
              <button
                onClick={() => {
                  setShowCharacterManager(false)
                  setShowModelSelect(true)
                }}
                disabled={characters.filter(c => c !== null).length >= 3}
                style={{
                  padding: isMobile ? '10px 16px' : '12px 24px',
                  background: characters.filter(c => c !== null).length >= 3 
                    ? 'rgba(255,255,255,0.1)' 
                    : 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
                  border: 'none',
                  borderRadius: '16px',
                  color: 'white',
                  fontSize: isMobile ? '13px' : '15px',
                  fontWeight: '600',
                  cursor: characters.filter(c => c !== null).length >= 3 ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  opacity: characters.filter(c => c !== null).length >= 3 ? 0.5 : 1
                }}
              >
                + 添加角色
              </button>
            </div>

            {/* 角色列表 */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {[0, 1, 2].filter((index) => {
                // 搜索过滤
                if (!characterSearchQuery.trim()) return true
                const character = characters[index]
                if (!character) return false
                
                const query = characterSearchQuery.toLowerCase()
                const characterKey = character.filename || character.name || `character_${index}`
                const customTags = playerCustomTags[characterKey] || []
                
                // 搜索角色名称
                const nameMatch = (character.name || character.filename || '').toLowerCase().includes(query)
                // 搜索预设标签
                const presetTagsMatch = character.tags?.some(tag => tag.toLowerCase().includes(query))
                // 搜索玩家自定义标签
                const customTagsMatch = customTags.some(tag => tag.toLowerCase().includes(query))
                
                return nameMatch || presetTagsMatch || customTagsMatch
              }).map((index) => {
                const character = characters[index]
                const isSelected = selectedCharacterIndex === index
                
                return (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: isMobile ? '14px' : '18px',
                      background: isSelected 
                        ? 'linear-gradient(135deg, rgba(255, 107, 157, 0.25) 0%, rgba(196, 69, 105, 0.15) 100%)'
                        : 'rgba(255,255,255,0.05)',
                      borderRadius: '16px',
                      border: isSelected 
                        ? '2px solid #ff6b9d' 
                        : '2px solid rgba(255,255,255,0.1)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {/* 角色序号 */}
                    <div style={{
                      width: isMobile ? '36px' : '44px',
                      height: isMobile ? '36px' : '44px',
                      borderRadius: '50%',
                      background: character 
                        ? 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)' 
                        : 'rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isMobile ? '16px' : '20px',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {character ? '🌸' : (index + 1)}
                    </div>

                    {/* 角色信息 */}
                    <div style={{ flex: 1 }}>
                      {character ? (
                        <>
                          <div style={{
                            color: 'white',
                            fontSize: isMobile ? '15px' : '17px',
                            fontWeight: '600',
                            marginBottom: '4px'
                          }}>
                            {character.name || character.filename?.replace('.vrm', '') || `角色${index + 1}`}
                            {isSelected && (
                              <span style={{
                                marginLeft: '8px',
                                fontSize: '12px',
                                color: '#ff6b9d',
                                background: 'rgba(255,107,157,0.2)',
                                padding: '2px 8px',
                                borderRadius: '10px'
                              }}>当前选中</span>
                            )}
                          </div>
                          <div style={{
                            color: 'rgba(255,255,255,0.5)',
                            fontSize: isMobile ? '12px' : '13px',
                            marginBottom: '6px'
                          }}>
                            {characterProps[index] 
                              ? `装备: ${furnitureList.find(f => f.id === characterProps[index])?.name || '未知'}` 
                              : '无装备'}
                          </div>
                          {/* 玩家自定义标签显示 */}
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px',
                            alignItems: 'center'
                          }}>
                            {(() => {
                              const characterKey = character.filename || character.name || `character_${index}`
                              const tags = playerCustomTags[characterKey] || []
                              return (
                                <>
                                  {tags.map((tag, tagIndex) => (
                                    <span key={tagIndex} style={{
                                      fontSize: '10px',
                                      color: 'rgba(255,255,255,0.7)',
                                      background: 'rgba(0,212,255,0.2)',
                                      padding: '2px 6px',
                                      borderRadius: '8px',
                                      border: '1px solid rgba(0,212,255,0.3)'
                                    }}>
                                      #{tag}
                                    </span>
                                  ))}
                                  <button
                                    onClick={() => setEditingCharacterTags(index)}
                                    style={{
                                      fontSize: '10px',
                                      color: 'rgba(255,255,255,0.5)',
                                      background: 'rgba(255,255,255,0.1)',
                                      padding: '2px 8px',
                                      borderRadius: '8px',
                                      border: 'none',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {tags.length > 0 ? '✏️ 编辑' : '+ 添加标签'}
                                  </button>
                                </>
                              )
                            })()}
                          </div>
                        </>
                      ) : (
                        <div style={{
                          color: 'rgba(255,255,255,0.4)',
                          fontSize: isMobile ? '14px' : '16px'
                        }}>
                          空槽位 - 点击添加角色
                        </div>
                      )}
                    </div>

                    {/* 操作按钮 */}
                    <div style={{
                      display: 'flex',
                      gap: '8px'
                    }}>
                      {character ? (
                        <>
                          <button
                            onClick={() => {
                              setSelectedCharacterIndex(index)
                              setSettingsTargetIndex(index)
                              setShowCharacterManager(false)
                            }}
                            style={{
                              padding: isMobile ? '8px 12px' : '10px 16px',
                              background: isSelected 
                                ? 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)' 
                                : 'rgba(255,255,255,0.1)',
                              border: 'none',
                              borderRadius: '10px',
                              color: 'white',
                              fontSize: isMobile ? '12px' : '13px',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            {isSelected ? '已选中' : '选择'}
                          </button>
                          <button
                            onClick={() => {
                              setPropTargetCharacter(index)
                              setShowPropSelect(true)
                            }}
                            style={{
                              padding: isMobile ? '8px 12px' : '10px 16px',
                              background: 'rgba(255,255,255,0.1)',
                              border: 'none',
                              borderRadius: '10px',
                              color: 'white',
                              fontSize: isMobile ? '12px' : '13px',
                              cursor: 'pointer'
                            }}
                          >
                            🎁 道具
                          </button>
                          <button
                            onClick={() => {
                              removeCharacter(index)
                              showNotification(`已删除角色${index + 1}`, 'info')
                            }}
                            style={{
                              padding: isMobile ? '8px 12px' : '10px 16px',
                              background: 'rgba(255,107,107,0.2)',
                              border: 'none',
                              borderRadius: '10px',
                              color: '#ff6b6b',
                              fontSize: isMobile ? '12px' : '13px',
                              cursor: 'pointer'
                            }}
                          >
                            🗑️
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedCharacterIndex(index)
                            setShowCharacterManager(false)
                            setShowModelSelect(true)
                          }}
                          style={{
                            padding: isMobile ? '8px 16px' : '10px 20px',
                            background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
                            border: 'none',
                            borderRadius: '10px',
                            color: 'white',
                            fontSize: isMobile ? '12px' : '14px',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          + 添加
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 标签编辑弹窗 */}
            {editingCharacterTags !== null && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 4000,
                backdropFilter: 'blur(5px)'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
                  borderRadius: '20px',
                  padding: isMobile ? '20px' : '28px',
                  maxWidth: '400px',
                  width: '85%',
                  border: '1px solid rgba(255,255,255,0.15)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{
                      color: 'white',
                      margin: 0,
                      fontSize: isMobile ? '18px' : '20px'
                    }}>
                      🏷️ 编辑标签
                    </h3>
                    <button
                      onClick={() => {
                        setEditingCharacterTags(null)
                        setNewTagInput('')
                      }}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        color: 'white',
                        fontSize: '20px',
                        cursor: 'pointer'
                      }}
                    >×</button>
                  </div>
                  
                  {(() => {
                    const character = characters[editingCharacterTags]
                    const characterKey = character?.filename || character?.name || `character_${editingCharacterTags}`
                    const currentTags = playerCustomTags[characterKey] || []
                    
                    return (
                      <>
                        <div style={{
                          color: 'rgba(255,255,255,0.7)',
                          fontSize: '14px',
                          marginBottom: '16px'
                        }}>
                          为 <strong style={{ color: '#00d4ff' }}>{character?.name || `角色${editingCharacterTags + 1}`}</strong> 添加标签
                        </div>
                        
                        {/* 当前标签 */}
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '8px',
                          marginBottom: '16px',
                          minHeight: '40px'
                        }}>
                          {currentTags.length === 0 ? (
                            <span style={{
                              color: 'rgba(255,255,255,0.4)',
                              fontSize: '13px'
                            }}>暂无标签</span>
                          ) : (
                            currentTags.map((tag, idx) => (
                              <span key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                color: 'white',
                                background: 'rgba(0,212,255,0.3)',
                                padding: '4px 10px',
                                borderRadius: '12px'
                              }}>
                                #{tag}
                                <button
                                  onClick={() => {
                                    const newTags = currentTags.filter((_, i) => i !== idx)
                                    const newCustomTags = { ...playerCustomTags, [characterKey]: newTags }
                                    setPlayerCustomTags(newCustomTags)
                                    localStorage.setItem('playerCustomTags', JSON.stringify(newCustomTags))
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'rgba(255,255,255,0.7)',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    padding: '0 2px'
                                  }}
                                >×</button>
                              </span>
                            ))
                          )}
                        </div>
                        
                        {/* 添加新标签 */}
                        <div style={{
                          display: 'flex',
                          gap: '8px',
                          marginBottom: '16px'
                        }}>
                          <input
                            type="text"
                            placeholder="输入标签名称..."
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && newTagInput.trim()) {
                                const tag = newTagInput.trim().replace(/^#/, '')
                                if (!currentTags.includes(tag)) {
                                  const newTags = [...currentTags, tag]
                                  const newCustomTags = { ...playerCustomTags, [characterKey]: newTags }
                                  setPlayerCustomTags(newCustomTags)
                                  localStorage.setItem('playerCustomTags', JSON.stringify(newCustomTags))
                                  setNewTagInput('')
                                }
                              }
                            }}
                            style={{
                              flex: 1,
                              padding: '10px 14px',
                              background: 'rgba(255,255,255,0.1)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: '10px',
                              color: 'white',
                              fontSize: '14px',
                              outline: 'none'
                            }}
                          />
                          <button
                            onClick={() => {
                              if (newTagInput.trim()) {
                                const tag = newTagInput.trim().replace(/^#/, '')
                                if (!currentTags.includes(tag)) {
                                  const newTags = [...currentTags, tag]
                                  const newCustomTags = { ...playerCustomTags, [characterKey]: newTags }
                                  setPlayerCustomTags(newCustomTags)
                                  localStorage.setItem('playerCustomTags', JSON.stringify(newCustomTags))
                                  setNewTagInput('')
                                }
                              }
                            }}
                            disabled={!newTagInput.trim()}
                            style={{
                              padding: '10px 16px',
                              background: newTagInput.trim() 
                                ? 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)' 
                                : 'rgba(255,255,255,0.1)',
                              border: 'none',
                              borderRadius: '10px',
                              color: 'white',
                              fontSize: '14px',
                              cursor: newTagInput.trim() ? 'pointer' : 'not-allowed'
                            }}
                          >
                            添加
                          </button>
                        </div>
                        
                        {/* 快捷标签建议 */}
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px'
                        }}>
                          {['主角', '辅助', '输出', '治疗', '坦克', '法师', '战士', '射手'].map(suggestion => (
                            <button
                              key={suggestion}
                              onClick={() => {
                                if (!currentTags.includes(suggestion)) {
                                  const newTags = [...currentTags, suggestion]
                                  const newCustomTags = { ...playerCustomTags, [characterKey]: newTags }
                                  setPlayerCustomTags(newCustomTags)
                                  localStorage.setItem('playerCustomTags', JSON.stringify(newCustomTags))
                                }
                              }}
                              disabled={currentTags.includes(suggestion)}
                              style={{
                                padding: '4px 10px',
                                background: currentTags.includes(suggestion) 
                                  ? 'rgba(255,255,255,0.05)' 
                                  : 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '12px',
                                color: currentTags.includes(suggestion) ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)',
                                fontSize: '12px',
                                cursor: currentTags.includes(suggestion) ? 'not-allowed' : 'pointer'
                              }}
                            >
                              + {suggestion}
                            </button>
                          ))}
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            )}

            {/* 底部提示 */}
            <div style={{
              marginTop: '20px',
              padding: '14px',
              background: 'rgba(0,212,255,0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(0,212,255,0.2)',
              color: 'rgba(255,255,255,0.7)',
              fontSize: isMobile ? '12px' : '13px',
              textAlign: 'center'
            }}>
              💡 提示：点击"选择"切换到该角色，点击"道具"给角色装备物品，点击"🗑️"删除角色
            </div>
          </div>
        </div>
      )}

      {/* 分步引导式游戏帮助 */}
      {showHelp && (
        <TutorialGuide
          isMobile={isMobile}
          onClose={() => {
            setShowHelp(false)
            localStorage.setItem('hasSeenTutorial', 'true')
          }}
        />
      )}

      {/* 调试面板 - 显示日志 */}
      {isMobile && showDebugPanel && (
        <div style={{
          position: 'fixed',
          top: '100px',
          left: '10px',
          right: '10px',
          maxHeight: '40vh',
          background: 'rgba(0,0,0,0.95)',
          borderRadius: '12px',
          padding: '12px',
          zIndex: 9999,
          overflowY: 'auto',
          border: '2px solid #ff6b6b',
          fontFamily: 'monospace',
          fontSize: '11px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
            borderBottom: '1px solid rgba(255,255,255,0.2)',
            paddingBottom: '8px'
          }}>
            <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>🐛 调试日志</span>
            <button
              onClick={clearLogs}
              style={{
                padding: '4px 8px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              清除
            </button>
          </div>
          {logs.length === 0 ? (
            <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
              暂无日志
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ color: '#0f0', marginBottom: '4px', wordBreak: 'break-all' }}>
                {log}
              </div>
            ))
          )}
        </div>
      )}

      {/* 骨骼编辑模式提示 */}
      {isBoneEditing && (
        <div style={{
          position: 'fixed',
          top: isMobile ? '80px' : '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.9) 0%, rgba(0, 153, 204, 0.9) 100%)',
          padding: isMobile ? '8px 16px' : '12px 24px',
          borderRadius: '20px',
          color: 'white',
          fontSize: isMobile ? '12px' : '14px',
          fontWeight: 'bold',
          zIndex: 1001,
          boxShadow: '0 4px 20px rgba(0, 212, 255, 0.5)',
          animation: 'slideDown 0.3s ease'
        }}>
          🦴 骨骼编辑模式 - 点击骨骼控制点进行调整
        </div>
      )}

      {/* 骨骼编辑器面板 - 支持桌面端和移动端 */}
      {isBoneEditing && (
        <BoneEditor 
          characters={characters}
          selectedCharacterIndex={selectedCharacterIndex}
          onBoneChange={(boneName, rotation) => {
            console.log('骨骼变化:', boneName, rotation)
          }}
          isMobile={isMobile}
        />
      )}

      {/* 全新底部动作栏 - 分类标签式 - 占满屏幕宽度 */}
      <div style={{
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        zIndex: 100,
        padding: isMobile ? '8px 12px 16px 12px' : '16px 24px 24px 24px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)'
      }}>
        {/* 动作搜索框 */}
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
              value={actionSearchQuery}
              onChange={(e) => setActionSearchQuery(e.target.value)}
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
            {actionSearchQuery && (
              <button
                onClick={() => setActionSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '16px',
                  cursor: 'pointer',
                  padding: '0 4px'
                }}
              >
                ✕
              </button>
            )}
          </div>
          <span style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: isMobile ? '11px' : '12px',
            whiteSpace: 'nowrap'
          }}>
            {filteredActions.length}个动作
          </span>
        </div>

        {/* 动作分类标签 - MMD分类 */}
        {/* 分类标签栏 - 带左右滑动 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
          padding: '4px'
        }}>
          {/* 左滑动按钮 */}
          <button
            onClick={() => {
              if (categoryContainerRef.current) {
                categoryContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' })
              }
            }}
            style={{
              padding: '6px 8px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            ◀
          </button>
          
          {/* 分类标签容器 */}
          <div 
            ref={categoryContainerRef}
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              padding: '4px',
              flex: 1,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {actionCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setMmdActiveCategory(mmdActiveCategory === category.id ? 'all' : category.id)}
                style={{
                  padding: isMobile ? '5px 10px' : '6px 12px',
                  background: mmdActiveCategory === category.id
                    ? `linear-gradient(135deg, ${category.color} 0%, ${category.color}dd 100%)`
                    : 'rgba(255,255,255,0.08)',
                  border: `1px solid ${mmdActiveCategory === category.id ? category.color : 'rgba(255,255,255,0.15)'}`,
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
                  boxShadow: mmdActiveCategory === category.id
                    ? `0 0 10px ${category.color}66`
                    : 'none',
                  flexShrink: 0
                }}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
                {category.count && (
                  <span style={{
                    fontSize: '9px',
                    opacity: 0.8,
                    marginLeft: '2px'
                  }}>({category.count})</span>
                )}
              </button>
            ))}
          </div>
          
          {/* 右滑动按钮 */}
          <button
            onClick={() => {
              if (categoryContainerRef.current) {
                categoryContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' })
              }
            }}
            style={{
              padding: '6px 8px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            ▶
          </button>
        </div>

        {/* 动作按钮网格 */}
        <div id="mmd-action-panel" style={{
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
          {filteredActions.map((item, index) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <button
                onClick={() => {
                  // MMD动作 - 使用executeAction函数，传入完整的动作对象
                  executeAction(item)
                }}
                style={{
                  minWidth: isMobile ? '60px' : '80px',
                  padding: isMobile ? '10px 8px' : '14px 12px',
                  background: currentAction === item.id
                    ? 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)'
                    : 'rgba(255,255,255,0.08)',
                  border: currentAction === item.id
                    ? '2px solid #ff6b9d'
                    : '2px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: currentAction === item.id
                    ? '0 0 20px rgba(255, 107, 157, 0.4)'
                    : 'none'
                }}
              >
                <span style={{ fontSize: isMobile ? '20px' : '24px' }}>{item.icon}</span>
                <span style={{
                  fontSize: isMobile ? '10px' : '11px',
                  color: 'white',
                  fontWeight: '600',
                  whiteSpace: 'nowrap'
                }}>{item.name}</span>
              </button>
              {/* 循环播放按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const newLooping = new Set(loopingMMDActions)
                  if (newLooping.has(item.id)) {
                    newLooping.delete(item.id)
                    showNotification(`停止循环: ${item.name}`, 'info')
                  } else {
                    newLooping.add(item.id)
                    showNotification(`循环播放: ${item.name}`, 'success')
                    // 立即开始播放
                    executeAction(item)
                  }
                  setLoopingMMDActions(newLooping)
                }}
                style={{
                  width: isMobile ? '24px' : '28px',
                  height: isMobile ? '24px' : '28px',
                  borderRadius: '50%',
                  background: loopingMMDActions.has(item.id)
                    ? 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)'
                    : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isMobile ? '12px' : '14px',
                  transition: 'all 0.2s ease'
                }}
                title={loopingMMDActions.has(item.id) ? '点击停止循环' : '点击循环播放'}
              >
                {loopingMMDActions.has(item.id) ? '🔁' : '▶️'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 语音识别状态显示 */}
      {isListening && (
        <div style={{
          position: 'absolute',
          top: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, rgba(231, 76, 60, 0.9) 0%, rgba(192, 57, 43, 0.9) 100%)',
          padding: isMobile ? '10px 20px' : '15px 30px',
          borderRadius: '30px',
          color: 'white',
          fontSize: isMobile ? '14px' : '16px',
          fontWeight: '600',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 4px 20px rgba(231, 76, 60, 0.4)',
          animation: 'fadeInDown 0.3s ease'
        }}>
          <span style={{ fontSize: '20px' }}>🎙️</span>
          <span>正在聆听...</span>
          {transcript && (
            <span style={{
              marginLeft: '10px',
              padding: '4px 12px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '15px',
              fontSize: '14px'
            }}>{transcript}</span>
          )}
        </div>
      )}

      {/* 舞台效果面板 - 仅在编辑模式显示 */}
      <StageEffectsPanel
        isOpen={showStageEffects && isEditMode}
        onClose={() => setShowStageEffects(false)}
        isMobile={isMobile}
        onEffectChange={(effects) => {
          console.log('舞台效果更新:', effects)
          // 应用特效到场景
          if (effects.particles?.enabled) {
            setShowParticles(true)
            setParticleType(effects.particles.type)
          } else {
            setShowParticles(false)
          }
          // 保存完整效果状态
          setStageEffects(effects)
          // 保存效果设置到本地存储
          localStorage.setItem('stageEffects', JSON.stringify(effects))
        }}
        currentEffects={stageEffects}
      />

      {/* 场景管理面板 */}
      <SceneManager
        isOpen={showSceneManager}
        onClose={() => setShowSceneManager(false)}
        isMobile={isMobile}
      />

      {/* 姿势面板 - 仅在编辑模式显示 */}
      <PosePanel
        isOpen={showPosePanel && isEditMode}
        onClose={() => setShowPosePanel(false)}
        onSelectPose={(pose, options) => {
          console.log('选择姿势:', pose)
          // 直接应用姿势的骨骼旋转
          const poseData = poseBoneData[pose.id] || pose
          if (poseData && poseData.bones) {
            // 派发事件让CharacterSystem应用姿势
            window.dispatchEvent(new CustomEvent('applyPose', {
              detail: {
                poseId: pose.id,
                poseData: poseData,
                duration: poseData.duration || 500,
                loop: poseData.loop || false
              }
            }))
            setCurrentAction(pose.id)
          } else {
            // 如果没有骨骼数据，回退到执行动作
            const actionName = pose.action || pose.id
            executeAction(actionName)
            setCurrentAction(actionName)
          }
        }}
        currentPose={currentAction}
      />

      {/* AR Viewer 模式 */}
      {isWebXRARMode && (
        <ARViewer
          vrmUrl={characters[selectedCharacterIndex]?.url}
          onClose={() => setIsWebXRARMode(false)}
          onPositionChange={(position) => {
            // 更新角色位置
            const newPositions = [...characterPositions]
            newPositions[selectedCharacterIndex] = position
            setCharacterPositions(newPositions)
          }}
        />
      )}

    </div>
  )
}

export default ARScene
