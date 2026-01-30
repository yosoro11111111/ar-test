import React, { useRef, useEffect, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// 交互系统组件
const InteractionSystem = ({ characterRef }) => {
  const { scene, camera, gl } = useThree()
  const [interactionType, setInteractionType] = useState(null)
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now())
  const [isHapticActive, setIsHapticActive] = useState(false)
  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())
  const touchStart = useRef({ x: 0, y: 0 })
  const touchEnd = useRef({ x: 0, y: 0 })

  // 检测点击事件
  useEffect(() => {
    const handleMouseDown = (event) => {
      // 计算鼠标位置
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1
      
      // 更新射线
      raycaster.current.setFromCamera(mouse.current, camera)
      
      // 检测与角色的交互
      const intersects = raycaster.current.intersectObjects(scene.children, true)
      
      if (intersects.length > 0) {
        // 检测到与角色的交互
        setInteractionType('tap')
        setLastInteractionTime(Date.now())
        
        // 触发触觉反馈
        triggerHapticFeedback('light')
        
        // 模拟角色反应
        simulateCharacterReaction('tap')
      }
    }

    const handleTouchStart = (event) => {
      if (event.touches.length > 0) {
        touchStart.current.x = event.touches[0].clientX
        touchStart.current.y = event.touches[0].clientY
      }
    }

    const handleTouchMove = (event) => {
      if (event.touches.length > 0) {
        touchEnd.current.x = event.touches[0].clientX
        touchEnd.current.y = event.touches[0].clientY
        
        // 计算滑动距离
        const distance = Math.sqrt(
          Math.pow(touchEnd.current.x - touchStart.current.x, 2) +
          Math.pow(touchEnd.current.y - touchStart.current.y, 2)
        )
        
        if (distance > 50) {
          // 检测到滑动
          setInteractionType('swipe')
          setLastInteractionTime(Date.now())
          
          // 触发触觉反馈
          triggerHapticFeedback('medium')
          
          // 模拟角色反应
          simulateCharacterReaction('swipe')
        }
      }
    }

    const handleTouchEnd = (event) => {
      // 计算触摸时间
      const touchTime = event.timeStamp - event.touches[0]?.timeStamp || 0
      
      if (touchTime > 500) {
        // 检测到长按（揉搓）
        setInteractionType('rub')
        setLastInteractionTime(Date.now())
        
        // 触发触觉反馈
        triggerHapticFeedback('heavy')
        
        // 模拟角色反应
        simulateCharacterReaction('rub')
      }
    }

    // 添加事件监听器
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      // 移除事件监听器
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [scene, camera])

  // 触发触觉反馈
  const triggerHapticFeedback = (intensity) => {
    // 检查设备是否支持触觉反馈
    if ('vibrate' in navigator) {
      setIsHapticActive(true)
      
      switch (intensity) {
        case 'light':
          navigator.vibrate(10)
          break
        case 'medium':
          navigator.vibrate(50)
          break
        case 'heavy':
          navigator.vibrate([100, 50, 100])
          break
        default:
          break
      }
      
      setTimeout(() => setIsHapticActive(false), 1000)
    }
  }

  // 模拟角色反应
  const simulateCharacterReaction = (type) => {
    // 这里根据交互类型触发不同的角色反应
    console.log(`Character reaction to ${type} interaction`)
    
    // 实际项目中会触发对应的动画和音效
    switch (type) {
      case 'tap':
        // 角色眨眼，短促语音
        break
      case 'rub':
        // 角色眯眼，持续微震
        break
      case 'swipe':
        // 拨开角色头发，发丝自然反弹
        break
      default:
        break
    }
  }

  // 检查长时间未交互
  useEffect(() => {
    const checkInactivity = () => {
      const now = Date.now()
      const timeSinceLastInteraction = now - lastInteractionTime
      
      // 如果超过24小时未交互
      if (timeSinceLastInteraction > 24 * 60 * 60 * 1000) {
        // 角色表现出委屈或埋怨的开场动作
        console.log('Character shows委屈 or 埋怨 reaction')
      }
    }

    checkInactivity()
  }, [lastInteractionTime])

  // 注意：HTML元素已经移到Canvas外部
  return null
}

// 交互控制器组件
export const InteractionController = ({ characterRef }) => {
  return (
    <InteractionSystem characterRef={characterRef} />
  )
}

export default InteractionSystem