import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// 交互类型常量
export const InteractionType = {
  TAP: 'tap',
  DOUBLE_TAP: 'double_tap',
  LONG_PRESS: 'long_press',
  SWIPE_UP: 'swipe_up',
  SWIPE_DOWN: 'swipe_down',
  SWIPE_LEFT: 'swipe_left',
  SWIPE_RIGHT: 'swipe_right',
  DRAG: 'drag',
  PINCH: 'pinch',
  SHAKE: 'shake',
  PET: 'pet',
  POKE: 'poke',
  TICKLE: 'tickle'
}

// 角色反应状态
const ReactionState = {
  IDLE: 'idle',
  HAPPY: 'happy',
  SURPRISED: 'surprised',
  EMBARRASSED: 'embarrassed',
  ANNOYED: 'annoyed',
  SHY: 'shy',
  PLEASANT: 'pleasant',
  DISPLEASED: 'displeased',
  EXCITED: 'excited',
  SLEEPY: 'sleepy'
}

// 真实交互系统
const RealisticInteractionSystem = ({
  characterRef,
  onInteraction,
  onReactionChange,
  enableHaptic = true,
  enableSound = true,
  enablePhysics = true,
  intimacyLevel = 0,
  characterConfig = {}
}) => {
  const { scene, camera, gl } = useThree()

  // 交互状态
  const [interactionState, setInteractionState] = useState({
    type: null,
    intensity: 0,
    position: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    duration: 0,
    isActive: false
  })

  // 角色反应状态
  const [reactionState, setReactionState] = useState({
    current: ReactionState.IDLE,
    intensity: 0,
    blendShape: {},
    animation: 'idle',
    transitionProgress: 1
  })

  // 物理状态
  const physicsState = useRef({
    velocity: new THREE.Vector3(),
    angularVelocity: new THREE.Vector3(),
    position: new THREE.Vector3(),
    rotation: new THREE.Euler(),
    targetPosition: new THREE.Vector3(),
    damping: 0.95,
    stiffness: 0.15,
    mass: 1.0,
    isPhysicsActive: false
  })

  // 触摸历史
  const touchHistory = useRef({
    activeTouches: new Map(),
    lastTapTime: 0,
    lastTapPosition: new THREE.Vector2(),
    swipeStart: new THREE.Vector2(),
    pinchStartDistance: 0,
    totalRubDistance: 0,
    rubStartTime: 0
  })

  // 疲劳系统
  const fatigueState = useRef({
    totalInteractions: 0,
    lastInteractionTime: Date.now(),
    interactionCooldown: 500,
    patience: 100,
    maxPatience: 100,
    fatigueAccumulation: 0,
    fatigueThreshold: 50
  })

  // 声音播放器
  const soundPlayer = useRef({
    context: null,
    buffers: new Map(),
    lastPlayTime: 0
  })

  // 初始化音频上下文
  useEffect(() => {
    if (enableSound && !soundPlayer.current.context) {
      try {
        soundPlayer.current.context = new (window.AudioContext || window.webkitAudioContext)()
      } catch (e) {
        console.warn('Web Audio API not supported')
      }
    }

    return () => {
      if (soundPlayer.current.context) {
        soundPlayer.current.context.close()
      }
    }
  }, [enableSound])

  // 播放交互声音
  const playInteractionSound = useCallback((type, intensity) => {
    if (!enableSound || !soundPlayer.current.context) return

    const now = Date.now()
    if (now - soundPlayer.current.lastPlayTime < 100) return
    soundPlayer.current.lastPlayTime = now

    const context = soundPlayer.current.context
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(context.destination)

    const baseFreq = {
      tap: 800,
      double_tap: 1000,
      pet: 600,
      tickle: 400,
      poke: 1200,
      swipe: 500
    }[type] || 600

    oscillator.frequency.setValueAtTime(baseFreq + intensity * 200, context.currentTime)
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.1 * intensity, context.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15)

    oscillator.start(context.currentTime)
    oscillator.stop(context.currentTime + 0.15)
  }, [enableSound])

  // 触觉反馈
  const triggerHaptic = useCallback((pattern, intensity = 1) => {
    if (!enableHaptic || !navigator.vibrate) return

    const patterns = {
      light: [5],
      medium: [15],
      heavy: [30, 20, 30],
      tap: [3],
      pet: [8, 15, 8],
      tickle: [5, 5, 5, 5, 5],
      swipe: [10],
      warning: [50, 30, 50]
    }

    const selected = patterns[pattern] || [10]
    const duration = selected.reduce((a, b) => a + b, 0) * intensity

    if (duration < 500) {
      navigator.vibrate(selected.map(t => Math.round(t * intensity)))
    }
  }, [enableHaptic])

  // 计算交互强度
  const calculateIntensity = useCallback((touchData) => {
    const speed = touchData.velocity || 0
    const pressure = touchData.pressure || 0.5
    const area = touchData.area || 1

    return Math.min(1, (speed * 0.01 + pressure * 0.5 + area * 0.3))
  }, [])

  // 确定交互类型
  const determineInteractionType = useCallback((touchData, timestamp) => {
    const history = touchHistory.current
    const timeSinceLastTap = timestamp - history.lastTapTime
    const distanceSinceLastTap = touchData.position.distanceTo(history.lastTapPosition)

    // 双击检测
    if (timeSinceLastTap < 300 && distanceSinceLastTap < 50) {
      return { type: InteractionType.DOUBLE_TAP, intensity: 1.0 }
    }

    // 长按检测
    if (timestamp - history.rubStartTime > 800 && history.totalRubDistance < 20) {
      return { type: InteractionType.LONG_PRESS, intensity: 0.6 }
    }

    // 揉搓检测（持续时间长，移动距离大）
    if (timestamp - history.rubStartTime > 200 && history.totalRubDistance > 50) {
      return { type: InteractionType.TICKLE, intensity: Math.min(1, history.totalRubDistance / 100) }
    }

    // 滑动检测
    const swipeDistance = history.swipeStart.distanceTo(touchData.position)
    const swipeDuration = timestamp - history.swipeStartTime

    if (swipeDistance > 100 && swipeDuration < 500) {
      const direction = new THREE.Vector2().subVectors(touchData.position, history.swipeStart).normalize()
      const angle = Math.atan2(direction.y, direction.x)

      if (angle > -Math.PI / 4 && angle <= Math.PI / 4) {
        return { type: InteractionType.SWIPE_RIGHT, intensity: swipeDistance / 200 }
      } else if (angle > Math.PI / 4 && angle <= 3 * Math.PI / 4) {
        return { type: InteractionType.SWIPE_UP, intensity: swipeDistance / 200 }
      } else if (angle > -3 * Math.PI / 4 && angle <= -Math.PI / 4) {
        return { type: InteractionType.SWIPE_DOWN, intensity: swipeDistance / 200 }
      } else {
        return { type: InteractionType.SWIPE_LEFT, intensity: swipeDistance / 200 }
      }
    }

    // 点击检测
    if (swipeDistance < 20 && swipeDuration < 200) {
      return { type: InteractionType.TAP, intensity: 0.5 }
    }

    return { type: null, intensity: 0 }
  }, [])

  // 生成角色反应
  const generateReaction = useCallback((interactionType, intensity, intimacy) => {
    const reactions = {
      [InteractionType.TAP]: {
        base: ReactionState.SURPRISED,
        intensity: intensity * 0.5,
        duration: 300,
        animations: ['blink', 'look_around']
      },
      [InteractionType.DOUBLE_TAP]: {
        base: ReactionState.HAPPY,
        intensity: intensity * 0.8,
        duration: 500,
        animations: ['wave', 'smile']
      },
      [InteractionType.LONG_PRESS]: {
        base: ReactionState.ANNOYED,
        intensity: Math.min(1, intensity + 0.3),
        duration: 800,
        animations: ['fidget', 'look_away']
      },
      [InteractionType.SWIPE_LEFT]:
      [InteractionType.SWIPE_RIGHT]: {
        base: ReactionState.DISPLEASED,
        intensity: intensity * 0.6,
        duration: 400,
        animations: ['brush_off', 'shake_head']
      },
      [InteractionType.SWIPE_UP]: {
        base: ReactionState.EXCITED,
        intensity: intensity * 0.7,
        duration: 600,
        animations: ['jump', 'arms_up']
      },
      [InteractionType.SWIPE_DOWN]: {
        base: ReactionState.SLEEPY,
        intensity: intensity * 0.4,
        duration: 400,
        animations: ['yawn', 'droopy_eyes']
      },
      [InteractionType.TICKLE]: {
        base: ReactionState.HAPPY,
        intensity: Math.min(1, intensity + intimacy * 0.3),
        duration: 200,
        animations: ['laugh', 'squirm', 'smile']
      },
      [InteractionType.PET]: {
        base: ReactionState.PLEASANT,
        intensity: Math.min(1, intensity + intimacy * 0.2),
        duration: 150,
        animations: ['close_eyes', 'lean_in']
      },
      [InteractionType.POKE]: {
        base: ReactionState.SURPRISED,
        intensity: intensity * 0.7,
        duration: 350,
        animations: ['blink', 'focus']
      }
    }

    const reaction = reactions[interactionType] || reactions[InteractionType.TAP]

    // 根据亲密程度调整反应
    let adjustedReaction = { ...reaction }
    if (intimacy > 0.5) {
      if (reaction.base === ReactionState.SURPRISED) {
        adjustedReaction.base = ReactionState.SHY
      } else if (reaction.base === ReactionState.ANNOYED) {
        adjustedReaction.base = ReactionState.PLEASANT
      }
    }

    return adjustedReaction
  }, [])

  // 应用物理效果
  const applyPhysics = useCallback((deltaTime) => {
    if (!enablePhysics) return

    const physics = physicsState.current
    if (!physics.isPhysicsActive) return

    const springForce = new THREE.Vector3()
      .subVectors(physics.targetPosition, physics.position)
      .multiplyScalar(physics.stiffness)

    const dampingForce = physics.velocity.clone().multiplyScalar(1 - physics.damping)

    const acceleration = springForce.sub(dampingForce).divideScalar(physics.mass)

    physics.velocity.add(acceleration.multiplyScalar(deltaTime * 60))
    physics.position.add(physics.velocity.clone().multiplyScalar(deltaTime * 60))

    if (characterRef?.current) {
      characterRef.current.position.copy(physics.position)
    }
  }, [characterRef, enablePhysics])

  // 更新疲劳度
  const updateFatigue = useCallback((interactionType) => {
    const fatigue = fatigueState.current
    const now = Date.now()

    if (now - fatigue.lastInteractionTime < fatigue.interactionCooldown) {
      return false
    }

    fatigue.lastInteractionTime = now
    fatigue.totalInteractions++

    const fatigueRate = {
      [InteractionType.TAP]: 1,
      [InteractionType.DOUBLE_TAP]: 2,
      [InteractionType.LONG_PRESS]: 5,
      [InteractionType.TICKLE]: 8,
      [InteractionType.SWIPE_UP]: 3,
      [InteractionType.SWIPE_DOWN]: 2,
      [InteractionType.SWIPE_LEFT]: 3,
      [InteractionType.SWIPE_RIGHT]: 3
    }[interactionType] || 1

    fatigue.fatigueAccumulation += fatigueRate

    if (fatigue.fatigueAccumulation > fatigue.fatigueThreshold) {
      fatigue.patience = Math.max(0, fatigue.patience - 10)
      fatigue.fatigueAccumulation = 0
    }

    return fatigue.patience > 0
  }, [])

  // 处理触摸事件
  const handleTouchStart = useCallback((event) => {
    event.preventDefault()

    const now = Date.now()
    const history = touchHistory.current

    for (const touch of event.touches) {
      history.activeTouches.set(touch.identifier, {
        position: new THREE.Vector2(touch.clientX, touch.clientY),
        startPosition: new THREE.Vector2(touch.clientX, touch.clientY),
        startTime: now,
        velocity: 0,
        pressure: touch.force || 0.5,
        area: touch.radius || 1
      })

      // 如果是单指，更新揉搓起始时间
      if (event.touches.length === 1) {
        history.rubStartTime = now
        history.totalRubDistance = 0
      }

      // 如果是双指，计算捏合起始距离
      if (event.touches.length === 2) {
        const t1 = history.activeTouches.get(event.touches[0].identifier)
        const t2 = history.activeTouches.get(event.touches[1].identifier)
        if (t1 && t2) {
          history.pinchStartDistance = t1.position.distanceTo(t2.position)
        }
      }
    }
  }, [])

  const handleTouchMove = useCallback((event) => {
    event.preventDefault()

    const now = Date.now()
    const history = touchHistory.current

    for (const touch of event.touches) {
      const touchData = history.activeTouches.get(touch.identifier)
      if (!touchData) continue

      const newPosition = new THREE.Vector2(touch.clientX, touch.clientY)
      touchData.velocity = newPosition.distanceTo(touchData.position) / (now - (touchData.lastMoveTime || now - 16))
      touchData.position.copy(newPosition)
      touchData.lastMoveTime = now
      touchData.pressure = touch.force || touchData.pressure
      touchData.area = touch.radius || touchData.area

      // 更新揉搓距离
      if (event.touches.length === 1) {
        history.totalRubDistance += touchData.velocity
      }
    }
  }, [])

  const handleTouchEnd = useCallback((event) => {
    event.preventDefault()

    const now = Date.now()
    const history = touchHistory.current

    for (const touch of event.changedTouches) {
      const touchData = history.activeTouches.get(touch.identifier)
      if (!touchData) continue

      const interaction = determineInteractionType(touchData, now)

      if (interaction.type && updateFatigue(interaction.type)) {
        setInteractionState({
          type: interaction.type,
          intensity: interaction.intensity,
          position: new THREE.Vector3(touchData.position.x, touchData.position.y, 0),
          direction: new THREE.Vector3().subVectors(
            touchData.position,
            touchData.startPosition
          ).normalize(),
          duration: now - touchData.startTime,
          isActive: true
        })

        // 触发反馈
        triggerHaptic(interaction.type === InteractionType.TICKLE ? 'tickle' : 'medium', interaction.intensity)
        playInteractionSound(interaction.type, interaction.intensity)

        // 生成角色反应
        const reaction = generateReaction(interaction.type, interaction.intensity, intimacyLevel)

        setReactionState(prev => ({
          current: reaction.base,
          intensity: reaction.intensity,
          blendShape: generateBlendShapes(reaction.base, reaction.intensity),
          animation: reaction.animations[0],
          transitionProgress: 0
        }))

        // 回调
        onInteraction?.({
          type: interaction.type,
          intensity: interaction.intensity,
          position: touchData.position,
          timestamp: now
        })

        onReactionChange?.(reaction)
      }

      history.activeTouches.delete(touch.identifier)
    }

    // 重置揉搓状态
    if (event.touches.length === 0) {
      history.totalRubDistance = 0
    }
  }, [determineInteractionType, updateFatigue, triggerHaptic, playInteractionSound, generateReaction, onInteraction, onReactionChange, intimacyLevel])

  // 处理鼠标事件
  const handleMouseDown = useCallback((event) => {
    const now = Date.now()
    const history = touchHistory.current

    history.activeTouches.set('mouse', {
      position: new THREE.Vector2(event.clientX, event.clientY),
      startPosition: new THREE.Vector2(event.clientX, event.clientY),
      startTime: now,
      velocity: 0,
      pressure: 0.8,
      area: 1.5
    })

    history.rubStartTime = now
    history.swipeStart = new THREE.Vector2(event.clientX, event.clientY)
    history.swipeStartTime = now
  }, [])

  const handleMouseMove = useCallback((event) => {
    const history = touchHistory.current
    const touchData = history.activeTouches.get('mouse')

    if (touchData) {
      touchData.velocity = Math.sqrt(
        Math.pow(event.movementX, 2) + Math.pow(event.movementY, 2)
      )
      touchData.position.set(event.clientX, event.clientY)
      history.totalRubDistance += touchData.velocity
    }
  }, [])

  const handleMouseUp = useCallback((event) => {
    const now = Date.now()
    const history = touchHistory.current
    const touchData = history.activeTouches.get('mouse')

    if (touchData) {
      const interaction = determineInteractionType(touchData, now)

      if (interaction.type && updateFatigue(interaction.type)) {
        setInteractionState({
          type: interaction.type,
          intensity: interaction.intensity,
          position: new THREE.Vector3(touchData.position.x, touchData.position.y, 0),
          direction: new THREE.Vector3().subVectors(
            touchData.position,
            touchData.startPosition
          ).normalize(),
          duration: now - touchData.startTime,
          isActive: true
        })

        triggerHaptic('tap', interaction.intensity)
        playInteractionSound(interaction.type, interaction.intensity)

        const reaction = generateReaction(interaction.type, interaction.intensity, intimacyLevel)

        setReactionState(prev => ({
          current: reaction.base,
          intensity: reaction.intensity,
          blendShape: generateBlendShapes(reaction.base, reaction.intensity),
          animation: reaction.animations[0],
          transitionProgress: 0
        }))

        onInteraction?.({
          type: interaction.type,
          intensity: interaction.intensity,
          position: touchData.position,
          timestamp: now
        })

        onReactionChange?.(reaction)
      }

      history.activeTouches.delete('mouse')
    }
  }, [determineInteractionType, updateFatigue, triggerHaptic, playInteractionSound, generateReaction, onInteraction, onReactionChange, intimacyLevel])

  // 生成表情混合形状
  const generateBlendShapes = useCallback((reaction, intensity) => {
    const blendShapes = {
      [ReactionState.IDLE]: { eyeOpen: 1, mouthOpen: 0, browRaise: 0, cheekPuff: 0 },
      [ReactionState.HAPPY]: { eyeOpen: 0.8, mouthOpen: 0.4, browRaise: 0.3, cheekPuff: 0.2 },
      [ReactionState.SURPRISED]: { eyeOpen: 1, mouthOpen: 0.6, browRaise: 0.8, cheekPuff: 0 },
      [ReactionState.EMBARRASSED]: { eyeOpen: 0.9, mouthOpen: 0.2, browRaise: 0.5, cheekPuff: 0.4 },
      [ReactionState.ANNOYED]: { eyeOpen: 0.6, mouthOpen: 0.1, browRaise: 0, cheekPuff: 0.1 },
      [ReactionState.SHY]: { eyeOpen: 0.7, mouthOpen: 0.15, browRaise: 0.6, cheekPuff: 0.5 },
      [ReactionState.PLEASANT]: { eyeOpen: 0.85, mouthOpen: 0.3, browRaise: 0.4, cheekPuff: 0.2 },
      [ReactionState.DISPLEASED]: { eyeOpen: 0.7, mouthOpen: 0.1, browRaise: 0.2, cheekPuff: 0 },
      [ReactionState.EXCITED]: { eyeOpen: 0.95, mouthOpen: 0.5, browRaise: 0.7, cheekPuff: 0.3 },
      [ReactionState.SLEEPY]: { eyeOpen: 0.2, mouthOpen: 0.3, browRaise: 0.1, cheekPuff: 0 }
    }

    const baseShape = blendShapes[reaction] || blendShapes[ReactionState.IDLE]

    return Object.fromEntries(
      Object.entries(baseShape).map(([key, value]) => [
        key,
        value * (0.5 + intensity * 0.5)
      ])
    )
  }, [])

  // 帧更新
  useFrame((state, delta) => {
    applyPhysics(delta)

    // 过渡动画
    if (reactionState.transitionProgress < 1) {
      setReactionState(prev => ({
        ...prev,
        transitionProgress: Math.min(1, prev.transitionProgress + delta * 3)
      }))
    }

    // 自动恢复空闲状态
    if (reactionState.current !== ReactionState.IDLE) {
      const timeSinceInteraction = Date.now() - fatigueState.current.lastInteractionTime
      if (timeSinceInteraction > 2000) {
        setReactionState(prev => ({
          ...prev,
          current: ReactionState.IDLE,
          intensity: Math.max(0, prev.intensity - delta * 0.5),
          transitionProgress: 0
        }))
      }
    }
  })

  // 事件监听
  useEffect(() => {
    const canvas = gl.domElement

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false })
    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [gl, handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown, handleMouseMove, handleMouseUp])

  // 获取当前反应状态
  const getReactionState = useCallback(() => ({
    ...reactionState,
    blendShapes: generateBlendShapes(reactionState.current, reactionState.intensity),
    fatigue: {
      patience: fatigueState.current.patience,
      maxPatience: fatigueState.current.maxPatience,
      totalInteractions: fatigueState.current.totalInteractions
    }
  }), [reactionState, generateBlendShapes])

  return {
    interactionState,
    reactionState: getReactionState(),
    triggerHaptic,
    playInteractionSound,
    updateFatigue
  }
}

// 交互控制器组件
export const InteractionController = ({
  characterRef,
  onInteraction,
  onReactionChange,
  enableHaptic = true,
  enableSound = true,
  enablePhysics = true,
  intimacyLevel = 0,
  characterConfig = {}
}) => {
  const system = RealisticInteractionSystem({
    characterRef,
    onInteraction,
    onReactionChange,
    enableHaptic,
    enableSound,
    enablePhysics,
    intimacyLevel,
    characterConfig
  })

  return null
}

export default RealisticInteractionSystem
