import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// 舞台效果组件 - 在非AR模式下显示
export const StageEffects = ({ effects }) => {
  const groupRef = useRef()
  const particlesRef = useRef([])

  // 获取粒子类型和配置
  const { type = 'snow', intensity = 50, speed = 1.0 } = effects?.particles || {}

  // 粒子颜色配置
  const colors = useMemo(() => ({
    snow: '#ffffff',
    rain: '#54a0ff',
    stars: '#ffd700',
    fireflies: '#7bed9f',
    petals: '#ff9ecd',
    bubbles: '#00d4ff',
    confetti: '#ff6b6b'
  }), [])

  // 粒子数量
  const particleCount = useMemo(() => Math.min(Math.floor(intensity * 2), 200), [intensity])

  // 初始化粒子数据
  const particlesData = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 20, // X: -10 到 10
        Math.random() * 10 + 5,     // Y: 5 到 15（从上方开始）
        (Math.random() - 0.5) * 10 - 2 // Z: -7 到 3（在模型周围）
      ],
      velocity: [
        (Math.random() - 0.5) * 0.02 * speed, // X速度
        -(Math.random() * 0.05 + 0.02) * speed, // Y速度（向下）
        (Math.random() - 0.5) * 0.02 * speed  // Z速度
      ],
      size: 0.03 + Math.random() * 0.05,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      opacity: 0.4 + Math.random() * 0.4
    }))
  }, [particleCount, speed])

  // 动画更新
  useFrame((state, delta) => {
    if (!groupRef.current) return

    particlesRef.current.forEach((mesh, i) => {
      if (!mesh) return

      const data = particlesData[i]
      
      // 更新位置
      mesh.position.x += data.velocity[0]
      mesh.position.y += data.velocity[1]
      mesh.position.z += data.velocity[2]

      // 根据类型添加特殊效果
      if (type === 'snow' || type === 'rain') {
        // 雪花和雨滴：左右摇摆
        mesh.position.x += Math.sin(state.clock.elapsedTime + i) * 0.001
      } else if (type === 'fireflies') {
        // 萤火虫：随机飘动
        mesh.position.x += Math.sin(state.clock.elapsedTime * 2 + i) * 0.002
        mesh.position.z += Math.cos(state.clock.elapsedTime * 1.5 + i) * 0.002
      } else if (type === 'petals') {
        // 花瓣：旋转下落
        mesh.rotation.x += data.rotationSpeed
        mesh.rotation.y += data.rotationSpeed * 0.5
        mesh.position.x += Math.sin(state.clock.elapsedTime + i * 0.5) * 0.003
      } else if (type === 'bubbles') {
        // 气泡：向上飘
        mesh.position.y += Math.abs(data.velocity[1]) * 0.5
        mesh.position.x += Math.sin(state.clock.elapsedTime + i) * 0.002
      } else if (type === 'confetti') {
        // 彩带：旋转下落
        mesh.rotation.x += data.rotationSpeed * 2
        mesh.rotation.z += data.rotationSpeed * 2
      }

      // 重置超出范围的粒子
      if (mesh.position.y < -2 || mesh.position.y > 15) {
        mesh.position.y = type === 'bubbles' ? -2 : 12
        mesh.position.x = (Math.random() - 0.5) * 20
        mesh.position.z = (Math.random() - 0.5) * 10 - 2
      }
    })

    // 整体缓慢旋转
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.02
  })

  // 获取粒子几何体
  const getGeometry = (particleType) => {
    switch (particleType) {
      case 'snow':
        return <sphereGeometry args={[1, 6, 6]} />
      case 'rain':
        return <cylinderGeometry args={[0.1, 0.1, 1, 4]} />
      case 'stars':
        return <octahedronGeometry args={[1, 0]} />
      case 'petals':
        return <planeGeometry args={[1, 1]} />
      case 'confetti':
        return <planeGeometry args={[1, 0.3]} />
      default:
        return <sphereGeometry args={[1, 6, 6]} />
    }
  }

  const color = colors[type] || colors.snow

  return (
    <group ref={groupRef}>
      {particlesData.map((data, i) => (
        <mesh
          key={data.id}
          ref={(el) => { particlesRef.current[i] = el }}
          position={data.position}
          scale={[data.size, data.size, data.size]}
        >
          {getGeometry(type)}
          <meshBasicMaterial
            color={color}
            transparent
            opacity={data.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

export default StageEffects
