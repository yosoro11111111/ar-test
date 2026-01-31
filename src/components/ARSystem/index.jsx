// ARSystem主组件 - 重构版
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import * as THREE from 'three'

// 导入所有组件
import {
  ActionPanel,
  CharacterManager,
  FurniturePanel,
  SceneSelector,
  ExpressionPanel,
  Toolbar,
  Tutorial,
  NotificationManager,
  ErrorBoundary,
  ARScene,
  VideoRecorder
} from '../'

// 导入所有Hooks
import {
  useLocalStorage,
  useGyroscope,
  useVoiceControl
} from '../../hooks'

// 导入数据
import {
  actionList200,
  furnitureList,
  expressions,
  scenes
} from '../../data'

// 导入模型列表
import modelList from '../../models/modelList'

// ==================== 主组件 ====================
const ARSystem = () => {
  // ========== 设备检测 ==========
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkDevice = () => setIsMobile(window.innerWidth < 768)
    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  // ========== 状态管理 ==========
  // 角色状态
  const [characters, setCharacters] = useState([null, null, null])
  const [selectedCharacterIndex, setSelectedCharacterIndex] = useState(0)
  const [characterPositions, setCharacterPositions] = useState([
    [0, 0, 0],
    [-1.5, 0, 0.5],
    [1.5, 0, 0.5]
  ])
  const [characterScales, setCharacterScales] = useState([1.2, 1.2, 1.2])
  const [characterRotations, setCharacterRotations] = useState([
    [0, 0, 0],
    [0, 0.3, 0],
    [0, -0.3, 0]
  ])
  const [characterProps, setCharacterProps] = useState([null, null, null])

  // 场景状态
  const [currentScene, setCurrentScene] = useLocalStorage('currentScene', 'default')
  const [currentExpression, setCurrentExpression] = useLocalStorage('currentExpression', 'neutral')
  
  // 动作状态
  const [currentAction, setCurrentAction] = useState('idle')
  const [isRandomMode, setIsRandomMode] = useState(false)
  
  // UI状态
  const [showTutorial, setShowTutorial] = useLocalStorage('showTutorial', true)
  const [showCharacterManager, setShowCharacterManager] = useState(false)
  const [showFurniturePanel, setShowFurniturePanel] = useState(false)
  const [showSceneSelector, setShowSceneSelector] = useState(false)
  const [showExpressionPanel, setShowExpressionPanel] = useState(false)
  const [showVideoRecorder, setShowVideoRecorder] = useState(false)
  const [isBoneEditing, setIsBoneEditing] = useState(false)
  
  // 通知
  const [notifications, setNotifications] = useState([])
  
  // AR状态
  const [isARMode, setIsARMode] = useState(false)
  const videoRef = useRef(null)

  // ========== Hooks ==========
  const {
    isSupported: gyroSupported,
    isEnabled: gyroEnabled,
    toggleGyroscope,
    detectAction
  } = useGyroscope(false)

  const {
    isSupported: voiceSupported,
    isListening: isVoiceListening,
    toggleListening: toggleVoiceListening,
    transcript
  } = useVoiceControl((command) => {
    handleVoiceCommand(command)
  })

  // ========== 通知系统 ==========
  const showNotification = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, message, type, duration }])
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  // ========== 动作执行 ==========
  const executeAction = useCallback((action) => {
    // 触发动作事件
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('executeAction', {
        detail: { action, intensity: 1 }
      }))
    }
    setCurrentAction(action)
  }, [])

  // ========== 语音命令处理 ==========
  const handleVoiceCommand = useCallback((command) => {
    showNotification(`语音: ${command.original}`, 'info')
    
    switch (command.type) {
      case 'action':
        executeAction(command.value)
        break
      case 'furniture':
        const newProps = [...characterProps]
        newProps[selectedCharacterIndex] = command.value
        setCharacterProps(newProps)
        break
      case 'expression':
        setCurrentExpression(command.value)
        break
      case 'system':
        if (command.value === 'screenshot') {
          takeScreenshot()
        } else if (command.value === 'record') {
          setShowVideoRecorder(true)
        }
        break
      default:
        showNotification('未识别的命令', 'warning')
    }
  }, [characterProps, selectedCharacterIndex, executeAction, setCurrentExpression, showNotification])

  // ========== 角色管理 ==========
  const handleAddCharacter = useCallback(() => {
    const emptyIndex = characters.findIndex(c => c === null)
    if (emptyIndex !== -1) {
      setShowCharacterManager(false)
      // 打开文件选择
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.vrm'
      input.onchange = (e) => {
        const file = e.target.files[0]
        if (file) {
          const url = URL.createObjectURL(file)
          const newCharacters = [...characters]
          newCharacters[emptyIndex] = {
            path: url,
            name: file.name.replace('.vrm', ''),
            filename: file.name
          }
          setCharacters(newCharacters)
          setSelectedCharacterIndex(emptyIndex)
          showNotification(`已添加角色: ${file.name}`, 'success')
        }
      }
      input.click()
    } else {
      showNotification('角色槽位已满 (最多3个)', 'warning')
    }
  }, [characters, showNotification])

  const handleRemoveCharacter = useCallback((index) => {
    const newCharacters = [...characters]
    newCharacters[index] = null
    setCharacters(newCharacters)
    
    // 重置该位置的属性
    const newPositions = [...characterPositions]
    const newScales = [...characterScales]
    const newRotations = [...characterRotations]
    const newProps = [...characterProps]
    
    newPositions[index] = [0, 0, 0]
    newScales[index] = 1.2
    newRotations[index] = [0, 0, 0]
    newProps[index] = null
    
    setCharacterPositions(newPositions)
    setCharacterScales(newScales)
    setCharacterRotations(newRotations)
    setCharacterProps(newProps)
    
    // 如果删除的是当前选中的，切换到其他角色
    if (selectedCharacterIndex === index) {
      const nextIndex = newCharacters.findIndex(c => c !== null)
      if (nextIndex !== -1) {
        setSelectedCharacterIndex(nextIndex)
      }
    }
  }, [characters, characterPositions, characterScales, characterRotations, characterProps, selectedCharacterIndex, showNotification])

  // ========== 截图功能 ==========
  const takeScreenshot = useCallback(() => {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      // 添加水印
      const ctx = canvas.getContext('2d')
      ctx.save()
      ctx.font = 'bold 20px Arial'
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.fillText('AR Character Studio', 20, canvas.height - 20)
      ctx.restore()
      
      const link = document.createElement('a')
      link.download = `ar-character-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      showNotification('截图已保存', 'success')
    }
  }, [showNotification])

  // ========== 旋转画布 ==========
  const rotateCanvas = useCallback(() => {
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('rotateCanvas'))
    }
  }, [])

  // ========== 陀螺仪监听 ==========
  useEffect(() => {
    if (!gyroEnabled) return
    
    const checkAction = setInterval(() => {
      const action = detectAction()
      if (action) {
        const actionMap = {
          'shake': 'shake_head',
          'leanForward': 'bow',
          'leanBack': 'surprised',
          'leanLeft': 'wave',
          'leanRight': 'wave'
        }
        const mappedAction = actionMap[action]
        if (mappedAction) {
          executeAction(mappedAction)
          showNotification(`陀螺仪触发: ${action}`, 'info')
        }
      }
    }, 800)
    
    return () => clearInterval(checkAction)
  }, [gyroEnabled, detectAction, executeAction, showNotification])

  // ========== 加载默认角色 ==========
  useEffect(() => {
    if (characters[0] === null && modelList.length > 0) {
      const defaultModel = modelList[0]
      setCharacters([{
        path: defaultModel.path,
        name: defaultModel.name,
        filename: defaultModel.filename
      }, null, null])
    }
  }, [])

  // ========== 渲染 ==========
  return (
    <ErrorBoundary isMobile={isMobile}>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: getSceneConfig(currentScene).background,
        overflow: 'hidden'
      }}>
        {/* AR场景 */}
        <ARScene
          isMobile={isMobile}
          isARMode={isARMode}
          sceneId={currentScene}
          characters={characters}
          selectedCharacterIndex={selectedCharacterIndex}
          characterPositions={characterPositions}
          characterScales={characterScales}
          characterRotations={characterRotations}
          characterProps={characterProps}
          currentExpression={currentExpression}
          onSelectCharacter={setSelectedCharacterIndex}
          onUpdatePosition={(index, pos) => {
            const newPositions = [...characterPositions]
            newPositions[index] = pos
            setCharacterPositions(newPositions)
          }}
          onUpdateScale={(index, scale) => {
            const newScales = [...characterScales]
            newScales[index] = scale
            setCharacterScales(newScales)
          }}
          onUpdateRotation={(index, rot) => {
            const newRotations = [...characterRotations]
            newRotations[index] = rot
            setCharacterRotations(newRotations)
          }}
          videoRef={videoRef}
          isBoneEditing={isBoneEditing}
          showCamera={true}
        />

        {/* 动作面板 */}
        <ActionPanel
          isMobile={isMobile}
          onExecuteAction={executeAction}
          currentAction={currentAction}
          isARMode={isARMode}
        />

        {/* 工具栏 */}
        <Toolbar
          isMobile={isMobile}
          onScreenshot={takeScreenshot}
          onToggleVideoRecorder={() => setShowVideoRecorder(true)}
          onToggleRandomMode={() => setIsRandomMode(!isRandomMode)}
          onToggleGyroscope={toggleGyroscope}
          onRotateCanvas={rotateCanvas}
          onToggleBoneEditor={() => setIsBoneEditing(!isBoneEditing)}
          onOpenFurniture={() => setShowFurniturePanel(true)}
          onOpenSceneSelector={() => setShowSceneSelector(true)}
          onOpenExpressionPanel={() => setShowExpressionPanel(true)}
          onToggleVoiceControl={toggleVoiceListening}
          onOpenCharacterManager={() => setShowCharacterManager(true)}
          isRandomMode={isRandomMode}
          gyroSupported={gyroSupported}
          gyroEnabled={gyroEnabled}
          isBoneEditing={isBoneEditing}
          voiceSupported={voiceSupported}
          isVoiceListening={isVoiceListening}
          characterProps={characterProps}
          selectedCharacterIndex={selectedCharacterIndex}
          showVideoRecorder={showVideoRecorder}
        />

        {/* 人物管理面板 */}
        {showCharacterManager && (
          <CharacterManager
            isMobile={isMobile}
            characters={characters}
            selectedCharacterIndex={selectedCharacterIndex}
            characterProps={characterProps}
            onSelectCharacter={setSelectedCharacterIndex}
            onRemoveCharacter={handleRemoveCharacter}
            onAddCharacter={handleAddCharacter}
            onOpenFurniture={(index) => {
              setSelectedCharacterIndex(index)
              setShowFurniturePanel(true)
            }}
            onClose={() => setShowCharacterManager(false)}
            showNotification={showNotification}
          />
        )}

        {/* 道具面板 */}
        {showFurniturePanel && (
          <FurniturePanel
            isMobile={isMobile}
            currentFurniture={characterProps[selectedCharacterIndex]}
            onFurnitureChange={(furnitureId) => {
              const newProps = [...characterProps]
              newProps[selectedCharacterIndex] = furnitureId
              setCharacterProps(newProps)
            }}
            onClose={() => setShowFurniturePanel(false)}
            showNotification={showNotification}
          />
        )}

        {/* 场景选择器 */}
        {showSceneSelector && (
          <SceneSelector
            isMobile={isMobile}
            currentScene={currentScene}
            onSceneChange={setCurrentScene}
            onClose={() => setShowSceneSelector(false)}
          />
        )}

        {/* 表情面板 */}
        {showExpressionPanel && (
          <ExpressionPanel
            isMobile={isMobile}
            currentExpression={currentExpression}
            onExpressionChange={setCurrentExpression}
            onClose={() => setShowExpressionPanel(false)}
          />
        )}

        {/* 录像面板 */}
        {showVideoRecorder && (
          <VideoRecorder
            isMobile={isMobile}
            onClose={() => setShowVideoRecorder(false)}
            showNotification={showNotification}
          />
        )}

        {/* 教程 */}
        {showTutorial && (
          <Tutorial
            isMobile={isMobile}
            onClose={() => setShowTutorial(false)}
          />
        )}

        {/* 通知 */}
        <NotificationManager
          notifications={notifications}
          removeNotification={removeNotification}
        />

        {/* 语音转录显示 */}
        {isVoiceListening && transcript && (
          <div style={{
            position: 'fixed',
            bottom: '200px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            background: 'rgba(231, 76, 60, 0.9)',
            borderRadius: '20px',
            color: 'white',
            fontSize: '14px',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🎤</span>
            <span>{transcript}</span>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}

export default ARSystem
