import React, { useRef, useEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

// 特色功能系统组件
const FeatureSystem = () => {
  const { scene, camera } = useThree()
  const [isPortalActive, setIsPortalActive] = useState(false)
  const [portalPosition, setPortalPosition] = useState([0, 0, -3])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isMorningReminder, setIsMorningReminder] = useState(false)
  const [isNightMode, setIsNightMode] = useState(false)
  const portalRef = useRef(null)

  // 生活同步系统
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date())
    }

    const interval = setInterval(updateTime, 60000) // 每分钟更新一次时间

    return () => clearInterval(interval)
  }, [])

  // 检查时间并触发相应的功能
  useEffect(() => {
    const hours = currentTime.getHours()
    const minutes = currentTime.getMinutes()

    // 早上7:30提醒
    if (hours === 7 && minutes === 30) {
      setIsMorningReminder(true)
      // 模拟推送语音消息
      setTimeout(() => {
        setIsMorningReminder(false)
      }, 5000)
    }

    // 晚上11:00切换到夜间模式
    if (hours === 23 && minutes === 0) {
      setIsNightMode(true)
    } else if (hours === 6 && minutes === 0) {
      setIsNightMode(false)
    }
  }, [currentTime])

  // 创建AR门户
  const createPortal = () => {
    setIsPortalActive(true)
    
    // 创建门户几何体
    if (!portalRef.current) {
      const portalGeometry = new THREE.PlaneGeometry(3, 5)
      const portalMaterial = new THREE.MeshBasicMaterial({
        color: '#96ceb4',
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      })
      const portal = new THREE.Mesh(portalGeometry, portalMaterial)
      
      // 设置门户位置
      portal.position.set(...portalPosition)
      portal.rotation.y = Math.PI
      
      // 添加到场景
      scene.add(portal)
      portalRef.current = portal
    }
  }

  // 关闭AR门户
  const closePortal = () => {
    setIsPortalActive(false)
    
    // 从场景中移除门户
    if (portalRef.current) {
      scene.remove(portalRef.current)
      portalRef.current = null
    }
  }

  return (
    <>
      {/* AR门户 */}
      {isPortalActive && portalRef.current && (
        <>
          {/* 门户背景 */}
          <mesh position={[portalPosition[0], portalPosition[1], portalPosition[2] - 0.1]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[3, 5]} />
            <meshBasicMaterial color="#2d3436" side={THREE.DoubleSide} />
          </mesh>
          
          {/* 门户效果 */}
          <mesh position={portalPosition} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[3, 5]} />
            <meshBasicMaterial 
              color="#96ceb4" 
              transparent 
              opacity={0.8} 
              side={THREE.DoubleSide} 
            />
          </mesh>
        </>
      )}
    </>
  )
}

// 特色功能控制器组件
export const FeatureController = () => {
  return (
    <FeatureSystem />
  )
}

export default FeatureSystem