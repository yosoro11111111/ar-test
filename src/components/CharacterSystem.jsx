import React, { useRef, useEffect, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Html, TransformControls } from '@react-three/drei'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm'
import { DragControls } from 'three/examples/jsm/controls/DragControls'

// ==================== 移动端检测 Hook ====================
const useMobileDetect = () => {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])
  
  return { isMobile }
}

// ==================== 骨骼编辑可视化组件 ====================
const BoneEditor = ({ vrmModel, isEditing, onBoneChange, isMobile }) => {
  const [selectedBone, setSelectedBone] = useState(null)
  const [bones, setBones] = useState([])
  const { scene, camera } = useThree()
  
  // 主要骨骼列表
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
  
  useEffect(() => {
    if (!vrmModel?.humanoid || !isEditing) {
      return
    }
    
    // 初始化骨骼列表
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
  }, [vrmModel, isEditing])
  
  // 处理骨骼旋转
  const handleBoneRotate = (boneName, axis, delta) => {
    const bone = bones.find(b => b.name === boneName)?.bone
    if (!bone) return
    
    bone.rotation[axis] += delta
    onBoneChange?.(boneName, bone.rotation)
  }
  
  if (!isEditing || bones.length === 0) return null
  
  return (
    <>
      {/* 3D场景中的骨骼点 - 只在桌面端显示 */}
      {!isMobile && bones.map(({ name, label, color, bone }) => {
        const worldPos = new THREE.Vector3()
        bone.getWorldPosition(worldPos)
        
        return (
          <group key={name}>
            <mesh
              position={worldPos}
              onPointerDown={(e) => {
                e.stopPropagation()
                setSelectedBone(selectedBone === name ? null : name)
              }}
            >
              <sphereGeometry args={[0.05, 16, 16]} />
              <meshBasicMaterial 
                color={selectedBone === name ? '#00ff00' : color} 
                transparent
                opacity={0.9}
              />
            </mesh>
            
            {selectedBone === name && (
              <TransformControls
                object={bone}
                mode="rotate"
                size={0.5}
                showX={true}
                showY={true}
                showZ={true}
                onChange={() => {
                  onBoneChange?.(name, bone.rotation)
                }}
              />
            )}
            
            <Html position={[worldPos.x, worldPos.y + 0.1, worldPos.z]}>
              <div style={{
                background: 'rgba(0,0,0,0.8)',
                color: color,
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                userSelect: 'none',
                border: selectedBone === name ? '2px solid #00ff00' : 'none'
              }}>
                {label}
              </div>
            </Html>
          </group>
        )
      })}
      
      {/* 移动端控制面板 - 固定在屏幕底部 */}
      {isMobile && (
        <Html position={[0, 0, 0]} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <div style={{
            position: 'fixed',
            bottom: '80px',
            left: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.9)',
            borderRadius: '16px',
            padding: '12px',
            zIndex: 2000,
            pointerEvents: 'auto',
            maxHeight: '45vh',
            overflowY: 'auto',
            border: '2px solid rgba(0,212,255,0.5)',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              borderBottom: '1px solid rgba(255,255,255,0.2)',
              paddingBottom: '6px'
            }}>
              <span style={{ color: '#00d4ff', fontWeight: 'bold', fontSize: '14px' }}>
                🦴 骨骼编辑器
              </span>
              <span style={{ color: '#888', fontSize: '10px' }}>
                单指拖动旋转
              </span>
            </div>
            
            {/* 骨骼列表 - 横向滚动 */}
            <div style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              marginBottom: '10px',
              paddingBottom: '4px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              {bones.map(({ name, label, color }) => (
                <button
                  key={name}
                  onClick={() => setSelectedBone(selectedBone === name ? null : name)}
                  style={{
                    padding: '8px 12px',
                    background: selectedBone === name ? color : 'rgba(255,255,255,0.1)',
                    border: `2px solid ${selectedBone === name ? color : 'transparent'}`,
                    borderRadius: '20px',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            
            {/* 选中骨骼的控制 - 拖动区域 */}
            {selectedBone && (
              <div 
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '12px',
                  touchAction: 'none'
                }}
                onTouchStart={(e) => {
                  e.preventDefault()
                  const touch = e.touches[0]
                  const bone = bones.find(b => b.name === selectedBone)?.bone
                  if (!bone) return
                  
                  // 记录起始位置
                  bone.userData.dragStartX = touch.clientX
                  bone.userData.dragStartY = touch.clientY
                  bone.userData.startRotationX = bone.rotation.x
                  bone.userData.startRotationY = bone.rotation.y
                }}
                onTouchMove={(e) => {
                  e.preventDefault()
                  const touch = e.touches[0]
                  const bone = bones.find(b => b.name === selectedBone)?.bone
                  if (!bone || !bone.userData.dragStartX) return
                  
                  // 计算拖动距离
                  const deltaX = touch.clientX - bone.userData.dragStartX
                  const deltaY = touch.clientY - bone.userData.dragStartY
                  
                  // 根据拖动调整骨骼旋转
                  const sensitivity = 0.005
                  bone.rotation.y = bone.userData.startRotationY + deltaX * sensitivity
                  bone.rotation.x = bone.userData.startRotationX + deltaY * sensitivity
                  
                  onBoneChange?.(selectedBone, bone.rotation)
                }}
                onTouchEnd={(e) => {
                  e.preventDefault()
                  const bone = bones.find(b => b.name === selectedBone)?.bone
                  if (bone) {
                    bone.userData.dragStartX = null
                    bone.userData.dragStartY = null
                  }
                }}
              >
                <div style={{
                  color: '#fff',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  textAlign: 'center',
                  fontSize: '13px'
                }}>
                  {bones.find(b => b.name === selectedBone)?.label} - 在此区域单指拖动
                </div>
                
                {/* 显示当前旋转值 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  fontSize: '11px',
                  color: '#aaa',
                  textAlign: 'center'
                }}>
                  <div>X: {(bones.find(b => b.name === selectedBone)?.bone.rotation.x || 0).toFixed(2)}</div>
                  <div>Y: {(bones.find(b => b.name === selectedBone)?.bone.rotation.y || 0).toFixed(2)}</div>
                  <div>Z: {(bones.find(b => b.name === selectedBone)?.bone.rotation.z || 0).toFixed(2)}</div>
                </div>
                
                {/* 微调按钮 */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button
                    onClick={() => handleBoneRotate(selectedBone, 'x', -0.05)}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: '#ff6b6b',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white',
                      fontSize: '11px'
                    }}
                  >X-</button>
                  <button
                    onClick={() => handleBoneRotate(selectedBone, 'x', 0.05)}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: '#ff6b6b',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white',
                      fontSize: '11px'
                    }}
                  >X+</button>
                  <button
                    onClick={() => handleBoneRotate(selectedBone, 'y', -0.05)}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: '#4ecdc4',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white',
                      fontSize: '11px'
                    }}
                  >Y-</button>
                  <button
                    onClick={() => handleBoneRotate(selectedBone, 'y', 0.05)}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: '#4ecdc4',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white',
                      fontSize: '11px'
                    }}
                  >Y+</button>
                  <button
                    onClick={() => handleBoneRotate(selectedBone, 'z', -0.05)}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: '#45b7d1',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white',
                      fontSize: '11px'
                    }}
                  >Z-</button>
                  <button
                    onClick={() => handleBoneRotate(selectedBone, 'z', 0.05)}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: '#45b7d1',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white',
                      fontSize: '11px'
                    }}
                  >Z+</button>
                </div>
              </div>
            )}
          </div>
        </Html>
      )}
    </>
  )
}

// ==================== 增强版粒子系统 ====================
const ParticleSystem = ({ active, type, position }) => {
  const particlesRef = useRef()
  const [particles, setParticles] = useState([])
  const animationRef = useRef(null)
  const frameCount = useRef(0)

  useEffect(() => {
    if (!active) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    // 增强版粒子配置 - 根据动作类型定制
    const particleConfigs = {
      // 大幅度动作的特殊粒子效果
      takeBook: { 
        count: 80, 
        colors: ['#ff6b6b', '#feca57', '#ff9ff3', '#54a0ff'], 
        speed: 0.2, 
        spread: 2.5,
        shape: 'star',
        gravity: -0.001, // 向上飘
        sizeRange: [0.05, 0.15]
      },
      somersault: { 
        count: 100, 
        colors: ['#48dbfb', '#0abde3', '#006ba6', '#c7ecee'], 
        speed: 0.25, 
        spread: 3,
        shape: 'circle',
        gravity: 0.005,
        sizeRange: [0.08, 0.2]
      },
      superJump: { 
        count: 120, 
        colors: ['#ff9f43', '#ee5a24', '#f368e0', '#ff6b6b', '#ffd93d'], 
        speed: 0.3, 
        spread: 3.5,
        shape: 'burst',
        gravity: 0.008,
        sizeRange: [0.1, 0.25]
      },
      spinDance: { 
        count: 90, 
        colors: ['#a29bfe', '#6c5ce7', '#fd79a8', '#e17055', '#fdcb6e'], 
        speed: 0.18, 
        spread: 2.8,
        shape: 'diamond',
        gravity: 0.002,
        sizeRange: [0.06, 0.18]
      },
      bigWave: { 
        count: 70, 
        colors: ['#00b894', '#00cec9', '#55efc4', '#81ecec'], 
        speed: 0.22, 
        spread: 2.2,
        shape: 'heart',
        gravity: -0.002,
        sizeRange: [0.08, 0.2]
      },
      bow: { 
        count: 60, 
        colors: ['#fdcb6e', '#e17055', '#d63031', '#fab1a0'], 
        speed: 0.12, 
        spread: 1.8,
        shape: 'flower',
        gravity: -0.001,
        sizeRange: [0.05, 0.12]
      },
      celebrate: { 
        count: 150, 
        colors: ['#fd79a8', '#fdcb6e', '#6c5ce7', '#00b894', '#ff6b6b', '#ffd93d'], 
        speed: 0.35, 
        spread: 4,
        shape: 'confetti',
        gravity: 0.01,
        sizeRange: [0.1, 0.3]
      },
      // 基础动作
      jump: { count: 50, colors: ['#60a5fa', '#3b82f6', '#2563eb'], speed: 0.18, spread: 2.2, shape: 'circle', gravity: 0.003, sizeRange: [0.05, 0.12] },
      dance: { count: 70, colors: ['#a78bfa', '#8b5cf6', '#7c3aed'], speed: 0.12, spread: 1.8, shape: 'star', gravity: 0.002, sizeRange: [0.06, 0.15] },
      happy: { count: 60, colors: ['#fbbf24', '#f59e0b', '#d97706'], speed: 0.15, spread: 2, shape: 'heart', gravity: -0.001, sizeRange: [0.08, 0.18] },
      sad: { count: 40, colors: ['#60a5fa', '#3b82f6', '#1d4ed8'], speed: 0.06, spread: 1.2, shape: 'tear', gravity: 0.008, sizeRange: [0.04, 0.1] },
      wave: { count: 45, colors: ['#34d399', '#10b981', '#059669'], speed: 0.15, spread: 1.5, shape: 'wave', gravity: 0.001, sizeRange: [0.05, 0.12] },
      run: { count: 55, colors: ['#f87171', '#ef4444', '#dc2626'], speed: 0.22, spread: 2, shape: 'dash', gravity: 0.004, sizeRange: [0.06, 0.14] },
      sit: { count: 30, colors: ['#a78bfa', '#8b5cf6'], speed: 0.04, spread: 1, shape: 'circle', gravity: 0.001, sizeRange: [0.04, 0.1] },
      default: { count: 40, colors: ['#ffffff', '#f0f0f0', '#e0e0e0'], speed: 0.12, spread: 1.5, shape: 'circle', gravity: 0.002, sizeRange: [0.05, 0.12] }
    }
    
    const config = particleConfigs[type] || particleConfigs.default
    const newParticles = []

    for (let i = 0; i < config.count; i++) {
      const angle = (Math.PI * 2 * i) / config.count + Math.random() * 0.5
      const radius = Math.random() * config.spread
      
      const posX = position && position[0] !== undefined ? position[0] + Math.cos(angle) * radius : Math.cos(angle) * radius
      const posY = position && position[1] !== undefined ? position[1] + Math.random() * 0.8 : Math.random() * 0.8
      const posZ = position && position[2] !== undefined ? position[2] + Math.sin(angle) * radius : Math.sin(angle) * radius
      
      // 根据形状设置不同的初始速度
      let velocityX, velocityY, velocityZ
      const speed = config.speed * (0.7 + Math.random() * 0.6)
      
      switch (config.shape) {
        case 'burst':
          velocityX = Math.cos(angle) * speed * 1.5
          velocityY = speed * (1 + Math.random())
          velocityZ = Math.sin(angle) * speed * 1.5
          break
        case 'confetti':
          velocityX = (Math.random() - 0.5) * speed * 2
          velocityY = speed * (0.5 + Math.random())
          velocityZ = (Math.random() - 0.5) * speed * 2
          break
        default:
          velocityX = Math.cos(angle) * speed
          velocityY = speed * (0.3 + Math.random() * 0.7)
          velocityZ = Math.sin(angle) * speed
      }
      
      newParticles.push({
        position: new THREE.Vector3(posX, posY, posZ),
        velocity: new THREE.Vector3(velocityX, velocityY, velocityZ),
        initialVelocity: new THREE.Vector3(velocityX, velocityY, velocityZ),
        size: config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]),
        life: 1.0,
        decay: 0.008 + Math.random() * 0.012,
        color: config.colors[Math.floor(Math.random() * config.colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        shape: config.shape,
        gravity: config.gravity,
        oscillation: Math.random() * Math.PI * 2,
        oscillationSpeed: 2 + Math.random() * 3
      })
    }

    setParticles(newParticles)
    frameCount.current = 0
    
    // 动画更新粒子
    const animate = () => {
      frameCount.current++
      
      setParticles(prevParticles => {
        return prevParticles.map(p => {
          // 根据形状应用不同的运动逻辑
          switch (p.shape) {
            case 'wave':
              p.position.x += p.velocity.x + Math.sin(frameCount.current * 0.1 + p.oscillation) * 0.02
              p.position.y += p.velocity.y
              p.position.z += p.velocity.z
              break
            case 'confetti':
              p.position.x += p.velocity.x + Math.sin(frameCount.current * 0.05 + p.oscillation) * 0.01
              p.position.y += p.velocity.y
              p.position.z += p.velocity.z + Math.cos(frameCount.current * 0.05 + p.oscillation) * 0.01
              p.rotation += p.rotationSpeed * 2
              break
            case 'heart':
              p.position.x += p.velocity.x * 0.5
              p.position.y += p.velocity.y + Math.sin(frameCount.current * 0.08) * 0.015
              p.position.z += p.velocity.z * 0.5
              break
            default:
              p.position.add(p.velocity)
          }
          
          // 应用重力/浮力
          p.velocity.y += p.gravity
          
          // 空气阻力
          p.velocity.x *= 0.98
          p.velocity.z *= 0.98
          
          // 更新生命周期
          p.life -= p.decay
          p.rotation += p.rotationSpeed
          
          return p
        }).filter(p => p.life > 0)
      })
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [active, type, position])

  if (!active || particles.length === 0) return null

  return (
    <group>
      {particles.map((p, i) => {
        // 根据形状渲染不同的几何体
        let geometry
        switch (p.shape) {
          case 'star':
            return (
              <mesh key={i} position={p.position} rotation={[0, 0, p.rotation]}>
                <octahedronGeometry args={[p.size, 0]} />
                <meshBasicMaterial
                  color={p.color}
                  transparent
                  opacity={p.life * 0.9}
                />
              </mesh>
            )
          case 'diamond':
            return (
              <mesh key={i} position={p.position} rotation={[p.rotation, p.rotation, 0]}>
                <tetrahedronGeometry args={[p.size, 0]} />
                <meshBasicMaterial
                  color={p.color}
                  transparent
                  opacity={p.life * 0.85}
                />
              </mesh>
            )
          case 'heart':
            return (
              <mesh key={i} position={p.position} rotation={[0, 0, p.rotation]}>
                <sphereGeometry args={[p.size, 8, 8]} />
                <meshBasicMaterial
                  color={p.color}
                  transparent
                  opacity={p.life * 0.9}
                />
              </mesh>
            )
          case 'confetti':
            return (
              <mesh key={i} position={p.position} rotation={[p.rotation, p.rotation * 0.5, p.rotation * 0.3]}>
                <boxGeometry args={[p.size * 0.3, p.size, p.size * 0.1]} />
                <meshBasicMaterial
                  color={p.color}
                  transparent
                  opacity={p.life * 0.95}
                />
              </mesh>
            )
          default:
            return (
              <mesh key={i} position={p.position} rotation={[0, 0, p.rotation]}>
                <planeGeometry args={[p.size, p.size]} />
                <meshBasicMaterial
                  color={p.color}
                  transparent
                  opacity={p.life * 0.8}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )
        }
      })}
    </group>
  )
}

const DynamicBackground = ({ actionType }) => {
  const meshRef = useRef()
  const { scene } = useThree()

  useEffect(() => {
    if (!meshRef.current) return

    let color
    switch (actionType) {
      case 'dance':
        color = new THREE.Color('#4c1d95')
        break
      case 'happy':
        color = new THREE.Color('#065f46')
        break
      case 'sad':
        color = new THREE.Color('#1e3a8a')
        break
      case 'jump':
        color = new THREE.Color('#7c2d12')
        break
      case 'wave':
        color = new THREE.Color('#0f766e')
        break
      default:
        color = new THREE.Color('#0f172a')
    }

    meshRef.current.material.color = color
  }, [actionType])

  return (
    <mesh ref={meshRef} position={[0, 0, -5]}>
      <planeGeometry args={[20, 15]} />
      <meshBasicMaterial
        color="#0f172a"
        transparent
        opacity={0.3}
      />
    </mesh>
  )
}

const ExpressionSystem = ({ vrmModel, actionType, intensity = 1.0, isPlaying = true }) => {
  const [expressionProgress, setExpressionProgress] = useState(0)
  const expressionRef = useRef(null)
  
  useEffect(() => {
    if (!vrmModel || !vrmModel.expressionManager) return
    
    let animationId = null
    let startTime = Date.now()
    
    const setExpression = (expressionName, value, duration = 300) => {
      if (vrmModel.expressionManager.getExpression(expressionName)) {
        // 使用平滑过渡
        const startValue = vrmModel.expressionManager.getValue(expressionName) || 0
        const startTime = Date.now()
        
        const animate = () => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / duration, 1)
          // 使用缓动函数
          const easeProgress = 1 - Math.pow(1 - progress, 3)
          const currentValue = startValue + (value - startValue) * easeProgress
          
          vrmModel.expressionManager.setValue(expressionName, currentValue * intensity)
          
          if (progress < 1) {
            animationId = requestAnimationFrame(animate)
          }
        }
        
        animate()
      }
    }
    
    const resetAllExpressions = (duration = 500) => {
      const expressions = ['happy', 'sad', 'angry', 'relaxed', 'surprised', 'neutral', 'aa', 'ih', 'ou', 'ee', 'oh']
      expressions.forEach(expr => {
        if (vrmModel.expressionManager.getExpression(expr)) {
          setExpression(expr, 0, duration)
        }
      })
    }

    // 表情配置系统 - 更丰富的表情组合
    const expressionConfigs = {
      happy: {
        primary: { name: 'happy', value: 0.8, delay: 0 },
        secondary: [
          { name: 'aa', value: 0.4, delay: 100 },
          { name: 'relaxed', value: 0.3, delay: 200 }
        ],
        duration: 2000
      },
      sad: {
        primary: { name: 'sad', value: 0.9, delay: 0 },
        secondary: [
          { name: 'ee', value: 0.3, delay: 150 },
          { name: 'relaxed', value: 0.2, delay: 300 }
        ],
        duration: 2500
      },
      wave: {
        primary: { name: 'happy', value: 0.6, delay: 0 },
        secondary: [
          { name: 'blink', value: 0.7, delay: 200 },
          { name: 'u', value: 0.4, delay: 400 }
        ],
        duration: 1500
      },
      dance: {
        primary: { name: 'fun', value: 1, delay: 0 },
        secondary: [
          { name: 'aa', value: 0.5, delay: 100 },
          { name: 'blinkL', value: 0.6, delay: 300 },
          { name: 'blinkR', value: 0.6, delay: 500 }
        ],
        duration: 3000
      },
      jump: {
        primary: { name: 'surprised', value: 1, delay: 0 },
        secondary: [
          { name: 'ih', value: 0.6, delay: 100 },
          { name: 'oh', value: 0.4, delay: 300 }
        ],
        duration: 1200
      },
      run: {
        primary: { name: 'angry', value: 0.5, delay: 0 },
        secondary: [
          { name: 'ee', value: 0.4, delay: 100 },
          { name: 'oh', value: 0.3, delay: 200 }
        ],
        duration: 2000
      },
      sit: {
        primary: { name: 'relaxed', value: 0.8, delay: 0 },
        secondary: [
          { name: 'neutral', value: 0.5, delay: 200 }
        ],
        duration: 3000
      },
      idle: {
        primary: { name: 'neutral', value: 1, delay: 0 },
        secondary: [],
        duration: 1000
      }
    }

    const config = expressionConfigs[actionType] || expressionConfigs.idle
    
    if (isPlaying) {
      // 先重置所有表情
      resetAllExpressions(300)
      
      // 应用主表情
      setTimeout(() => {
        setExpression(config.primary.name, config.primary.value, 400)
      }, config.primary.delay)
      
      // 应用次要表情
      config.secondary.forEach(expr => {
        setTimeout(() => {
          setExpression(expr.name, expr.value, 300)
        }, expr.delay)
      })
      
      // 设置表情持续时间后自动淡出
      const fadeOutTimer = setTimeout(() => {
        if (actionType !== 'idle') {
          resetAllExpressions(800)
          setTimeout(() => {
            setExpression('neutral', 1, 500)
          }, 800)
        }
      }, config.duration)
      
      return () => {
        clearTimeout(fadeOutTimer)
        if (animationId) {
          cancelAnimationFrame(animationId)
        }
      }
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [vrmModel, actionType, intensity, isPlaying])

  return null
}

const CharacterSystem = ({ position = [0, 0, 0], rotation = [0, 0, 0], selectedFile = null, onSwing = null, isBoneEditing = false, onBoneChange = null }) => {
  const { isMobile } = useMobileDetect()
  const { scene, gl, camera } = useThree()
  const characterRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [characterModel, setCharacterModel] = useState(null)
  const [animationMixer, setAnimationMixer] = useState(null)
  const [vrmModel, setVrmModel] = useState(null)
  const [showFileInput, setShowFileInput] = useState(true)
  const [animations, setAnimations] = useState([])
  const [currentAnimation, setCurrentAnimation] = useState(null)
  const [showAnimationSelect, setShowAnimationSelect] = useState(false)
  const [scale, setScale] = useState(1.0)
  const [isDragging, setIsDragging] = useState(false)
  const [initialPosition, setInitialPosition] = useState([0, 0, 0])
  const [currentActionType, setCurrentActionType] = useState('idle')
  const [showParticles, setShowParticles] = useState(false)
  const [actionIntensity, setActionIntensity] = useState(1.0)
  const [isComboMode, setIsComboMode] = useState(false)
  const [comboSequence, setComboSequence] = useState([])
  const [isRandomMode, setIsRandomMode] = useState(false)
  const [animationProgress, setAnimationProgress] = useState(0)
  const [targetPosition, setTargetPosition] = useState(null)
  const [targetRotation, setTargetRotation] = useState(null)
  const [targetScale, setTargetScale] = useState(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [modelAnimations, setModelAnimations] = useState([])
  const [currentAnimationClip, setCurrentAnimationClip] = useState(null)
  const [isTouching, setIsTouching] = useState(false)
  const [touchPosition, setTouchPosition] = useState(new THREE.Vector3())
  const [canvasRotation, setCanvasRotation] = useState(0)
  const loader = useRef(null)
  const dragControls = useRef(null)
  const loadRetryCount = useRef(0)
  const maxRetries = 3
  
  // 骨骼动画系统引用
  const boneAnimationRef = useRef(null)
  const currentBoneAnimation = useRef(null)
  const animationStartTime = useRef(0)
  const initialBoneRotations = useRef(new Map())
  const randomModeInterval = useRef(null)
  const animationFrameRef = useRef(null)
  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())
  const touchStartTime = useRef(0)
  const longPressTimer = useRef(null)
  const isLongPress = useRef(false)
  const touchStartPos = useRef({ x: 0, y: 0 })
  const [touchRipple, setTouchRipple] = useState({ show: false, x: 0, y: 0, scale: 0 })
  
  // 视线追踪系统
  const [lookAtTarget, setLookAtTarget] = useState(new THREE.Vector3(0, 1.5, 5))
  const [isLookingAtCamera, setIsLookingAtCamera] = useState(true)
  const lookAtSmoothness = useRef(0.1)
  const currentLookAt = useRef(new THREE.Vector3(0, 1.5, 5))
  
  // 物理模拟系统
  const [physicsEnabled, setPhysicsEnabled] = useState(true)
  const velocity = useRef(new THREE.Vector3(0, 0, 0))
  const angularVelocity = useRef(new THREE.Vector3(0, 0, 0))
  const gravity = useRef(-9.8)
  const groundLevel = useRef(0)
  const isGrounded = useRef(true)
  
  // 性能监控系统
  const [fps, setFps] = useState(60)
  const frameCount = useRef(0)
  const lastTime = useRef(Date.now())
  const [memoryUsage, setMemoryUsage] = useState(0)

  const [optimalScale, setOptimalScale] = useState(1.0)
  const [optimalCameraPosition, setOptimalCameraPosition] = useState([0, 0, 3])
  
  // 动画混合权重系统
  const [animationWeights, setAnimationWeights] = useState({})
  const [blendTree, setBlendTree] = useState({
    idle: 1.0,
    walk: 0,
    run: 0,
    dance: 0
  })
  const [actionQueue, setActionQueue] = useState([])
  const [isProcessingQueue, setIsProcessingQueue] = useState(false)

  const ambientLightRef = useRef()
  const directionalLightRef = useRef()
  const pointLightRef = useRef()

  const breathePhase = useRef(0)
  const blinkPhase = useRef(0)
  
  // Q版变形系统 - 让角色更可爱
  const [chibiMode, setChibiMode] = useState(false)
  const chibiScale = useRef({ head: 1.3, body: 0.8, limbs: 0.7 })
  
  // 弹性骨骼系统 - 果冻般柔软感
  const springBones = useRef([])
  const [springPhysicsEnabled, setSpringPhysicsEnabled] = useState(true)
  
  // 惯性跟随系统 - 头发衣服延迟跟随
  const followBones = useRef([])
  const followTargets = useRef(new Map())
  
  // 微动作系统 - 随机小动作
  const [microActionsEnabled, setMicroActionsEnabled] = useState(true)
  const lastMicroActionTime = useRef(0)
  const microActionInterval = useRef(3000 + Math.random() * 2000)
  
  // 情感状态机
  const [emotionState, setEmotionState] = useState('neutral')
  const emotionTimer = useRef(null)
  
  // 口型同步
  const [lipSyncEnabled, setLipSyncEnabled] = useState(true)
  const lipSyncValue = useRef(0)
  
  // 耳朵尾巴物理
  const earBones = useRef([])
  const tailBones = useRef([])
  
  // 手部姿态
  const [handGesture, setHandGesture] = useState('relax')
  
  // 脚步IK
  const footIKEnabled = useRef(true)
  const leftFootTarget = useRef(new THREE.Vector3())
  const rightFootTarget = useRef(new THREE.Vector3())

  const [touchFeedback, setTouchFeedback] = useState({ show: false, x: 0, y: 0 })

  useEffect(() => {
    try {
      loader.current = new GLTFLoader()
      loader.current.register((parser) => new VRMLoaderPlugin(parser))
      loader.current.setCrossOrigin('anonymous')
      console.log('GLTFLoader 初始化成功')
    } catch (error) {
      console.error('GLTFLoader 初始化失败:', error)
    }
  }, [])

  useEffect(() => {
    if (selectedFile) {
      loadVRMModel(selectedFile)
    }
  }, [selectedFile])

  const loadVRMModel = (file) => {
    try {
      setIsLoading(true)
      setLoadingProgress(0)
      
      // 调试日志
      console.log('loadVRMModel 被调用:', file)
      console.log('file 类型:', typeof file)
      console.log('file.constructor:', file?.constructor?.name)
      console.log('file.localPath:', file?.localPath)
      console.log('file.name:', file?.name)
      console.log('file.size:', file?.size)
      
      if (file.localPath) {
        console.log('开始加载本地模型:', file.name, '路径:', file.localPath)
      } else {
        console.log('开始加载模型文件:', file.name, '大小:', (file.size / 1024 / 1024).toFixed(2), 'MB')
      }
      
      if (characterModel) {
        try {
          scene.remove(characterModel)
          console.log('移除之前的模型')
        } catch (error) {
          console.error('移除模型失败:', error)
        }
      }
      
      // 检查 loader 是否已初始化
      if (!loader.current) {
        console.error('GLTFLoader 未初始化，等待初始化完成...')
        setTimeout(() => loadVRMModel(file), 500)
        return
      }

      let modelUrl
      const isLocalFile = !!file.localPath

      console.log('isLocalFile:', isLocalFile)

      if (isLocalFile) {
        modelUrl = file.localPath
        console.log('使用本地模型路径:', modelUrl)
      } else {
        console.log('使用 createObjectURL 创建模型 URL')
        // 检查文件大小（仅对上传的文件）
        const fileSize = file.size || 0

        // 对于本地文件，跳过大小检查
        if (fileSize > 100 * 1024 * 1024) {
          console.error('模型文件过大，可能导致性能问题')
          setIsLoading(false)
          setLoadingProgress(0)
          return
        }

        modelUrl = URL.createObjectURL(file)
        console.log('创建模型URL:', modelUrl, '文件大小:', (fileSize / 1024 / 1024).toFixed(2), 'MB')
      }

      console.log('开始调用 loader.current.load...')
      loader.current.load(
        modelUrl,
        (gltf) => {
          try {
            console.log('GLTF加载完成:', gltf)
            
            if (!isLocalFile) {
              try {
                URL.revokeObjectURL(modelUrl)
                console.log('清理模型URL成功')
              } catch (revokeError) {
                console.error('清理模型URL失败:', revokeError)
              }
            }
            
            const vrm = gltf.userData.vrm
            if (!vrm) {
              console.error('VRM实例不存在，尝试加载普通GLTF模型')
              try {
                gltf.scene.position.set(0, 0, 0)
                gltf.scene.rotation.set(0, 0, 0)
                gltf.scene.scale.set(1, 1, 1)
                scene.add(gltf.scene)
                characterRef.current = gltf.scene
                setCharacterModel(gltf.scene)
                
                const mixer = new THREE.AnimationMixer(gltf.scene)
                setAnimationMixer(mixer)
                
                if (gltf.animations && gltf.animations.length > 0) {
                  console.log('发现动画:', gltf.animations.length, '个')
                  setAnimations(gltf.animations.map((anim, index) => ({
                    name: anim.name || `动画 ${index + 1}`,
                    animation: anim
                  })))
                }
                
                optimizeModelDisplay(gltf.scene)
                initDragControls()
                
                console.log('普通GLTF模型加载完成')
              } catch (error) {
                console.error('加载普通GLTF模型失败:', error)
              }
            } else {
              console.log('VRM实例加载成功:', vrm)
              console.log('VRM结构:', Object.keys(vrm))
              console.log('VRM.humanoid:', vrm.humanoid)
              setVrmModel(vrm)
              
              vrm.scene.position.set(0, 0, 0)
              vrm.scene.rotation.set(0, Math.PI, 0) // 旋转180度，让模型面对用户
              vrm.scene.scale.set(1, 1, 1)
              
              scene.add(vrm.scene)
              characterRef.current = vrm.scene
              setCharacterModel(vrm.scene)
              
              const mixer = new THREE.AnimationMixer(vrm.scene)
              setAnimationMixer(mixer)
              
              if (gltf.animations && gltf.animations.length > 0) {
                console.log('发现模型自带动画:', gltf.animations.length, '个')
                const animationList = gltf.animations.map((anim, index) => ({
                  name: anim.name || `动画 ${index + 1}`,
                  animation: anim
                }))
                setModelAnimations(animationList)
                console.log('动画列表:', animationList.map(a => a.name))
              }
              
              initDragControls()
              optimizeModelDisplay(vrm.scene)
              setInitialPose(vrm)
              
              // 修复VRM材质显示问题
              vrm.scene.traverse((obj) => {
                if (obj.isMesh && obj.material) {
                  // 确保材质正确更新
                  obj.material.needsUpdate = true
                  
                  // 修复黑色材质问题 - 针对 VRM/MToon 材质
                  if (obj.material.isMToonMaterial) {
                    // VRM MToon 材质特殊处理
                    if (obj.material.color) {
                      console.log('MToon材质颜色:', obj.material.color)
                    }
                    // 确保 MToon 材质正确渲染
                    obj.material.needsUpdate = true
                  } else if (obj.material.isMeshStandardMaterial || obj.material.isMeshLambertMaterial) {
                    // 标准材质处理
                    if (obj.material.color && obj.material.color.r === 0 && obj.material.color.g === 0 && obj.material.color.b === 0) {
                      obj.material.color.setHex(0xffffff)
                    }
                    // 增加自发光让模型更亮
                    if (!obj.material.emissive) {
                      obj.material.emissive = new THREE.Color(0x222222)
                    }
                  }
                  
                  // 确保材质接受光照
                  obj.material.needsUpdate = true
                  
                  // 如果是透明材质，确保渲染顺序正确
                  if (obj.material.transparent) {
                    obj.material.depthWrite = false
                    obj.renderOrder = 1
                  }
                }
              })
              
              console.log('VRM模型加载完成')
            }
            
            setIsLoading(false)
            setLoadingProgress(100)
            console.log('模型加载完成，已添加到场景')
          } catch (error) {
            console.error('处理加载完成的模型失败:', error)
            if (!file.localPath) {
              try {
                URL.revokeObjectURL(modelUrl)
              } catch (revokeError) {
                console.error('清理模型URL失败:', revokeError)
              }
            }
            setIsLoading(false)
            setLoadingProgress(0)
            loadRetryCount.current = 0 // 重置重试计数器
          }
        },
        (progress) => {
          if (progress.lengthComputable) {
            const percentComplete = (progress.loaded / progress.total) * 100
            setLoadingProgress(percentComplete)
            console.log(`模型加载进度: ${percentComplete.toFixed(2)}%`)
          }
        },
        (error) => {
          console.error('模型加载失败:', error)
          if (!file.localPath) {
            try {
              URL.revokeObjectURL(modelUrl)
              console.log('清理模型URL成功')
            } catch (revokeError) {
              console.error('清理模型URL失败:', revokeError)
            }
          }
          
          // 重试机制
          if (loadRetryCount.current < maxRetries) {
            loadRetryCount.current++
            console.log(`模型加载失败，第 ${loadRetryCount.current} 次重试...`)
            setTimeout(() => {
              loadVRMModel(file)
            }, 1000 * loadRetryCount.current)
          } else {
            console.error('模型加载失败，已达到最大重试次数')
            setIsLoading(false)
            setLoadingProgress(0)
            loadRetryCount.current = 0
          }
        }
      )
    } catch (error) {
      console.error('模型加载初始化失败:', error)
      
      // 重试机制
      if (loadRetryCount.current < maxRetries) {
        loadRetryCount.current++
        console.log(`模型加载初始化失败，第 ${loadRetryCount.current} 次重试...`)
        setTimeout(() => {
          loadVRMModel(file)
        }, 1000 * loadRetryCount.current)
      } else {
        console.error('模型加载初始化失败，已达到最大重试次数')
        setIsLoading(false)
        setLoadingProgress(0)
        loadRetryCount.current = 0
      }
    }
  }

  const optimizeModelDisplay = (model) => {
    const box = new THREE.Box3().setFromObject(model)
    const size = new THREE.Vector3()
    box.getSize(size)
    
    console.log('模型尺寸:', size)
    
    const maxDimension = Math.max(size.x, size.y, size.z)
    const targetSize = 1.6 // 稍微大一点，让角色更清晰
    const optimalScaleValue = targetSize / maxDimension
    
    console.log('最佳缩放:', optimalScaleValue)
    setOptimalScale(optimalScaleValue)
    
    model.scale.set(optimalScaleValue, optimalScaleValue, optimalScaleValue)
    
    const center = new THREE.Vector3()
    box.getCenter(center)
    
    // 水平居中
    model.position.x = -center.x * optimalScaleValue
    // 垂直位置：让脚底站在地面上 (y=0)
    model.position.y = -box.min.y * optimalScaleValue
    // 前后位置：让角色站在场景中央偏前一点
    model.position.z = -center.z * optimalScaleValue + 0.5 // 稍微向前
    
    console.log('模型位置:', model.position)
    
    // 相机位置：让角色在画面中央，稍微俯视
    const cameraDistance = maxDimension * optimalScaleValue * 2.2
    const cameraHeight = size.y * optimalScaleValue * 0.5 // 相机高度在角色腰部偏上
    
    setOptimalCameraPosition([0, cameraHeight, cameraDistance])
    
    // 平滑移动相机到最佳位置
    const targetCameraPos = new THREE.Vector3(0, cameraHeight, cameraDistance)
    const targetLookAt = new THREE.Vector3(0, size.y * optimalScaleValue * 0.4, 0) // 看向角色胸部位置
    
    // 使用动画平滑过渡
    const startPos = camera.position.clone()
    const startTime = Date.now()
    const duration = 1000 // 1秒过渡
    
    const animateCamera = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // 使用缓动函数
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      
      camera.position.lerpVectors(startPos, targetCameraPos, easeProgress)
      camera.lookAt(targetLookAt)
      
      if (progress < 1) {
        requestAnimationFrame(animateCamera)
      }
    }
    
    animateCamera()
    
    console.log('相机位置:', camera.position)
    
    // 设置光照，让角色更明亮可爱
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = 0.7
    }
    if (directionalLightRef.current) {
      directionalLightRef.current.position.set(3, 8, 5)
      directionalLightRef.current.intensity = 1.0
    }
    if (pointLightRef.current) {
      pointLightRef.current.position.set(-3, 4, 3)
      pointLightRef.current.intensity = 0.6
      pointLightRef.current.color = new THREE.Color('#fff5e6') // 暖色调
    }
    
    // 添加边缘光，让角色更立体
    const rimLight = new THREE.SpotLight(0xffffff, 0.5)
    rimLight.position.set(0, 5, -5)
    rimLight.lookAt(0, 1, 0)
    scene.add(rimLight)
  }

  const setInitialPose = (vrm) => {
    if (vrm.humanoid) {
      console.log('VRM人形骨骼存在，设置初始姿态 - 站立并看向用户')
      
      // 头部 - 稍微向下看，营造可爱的感觉
      const headBone = vrm.humanoid.getBoneNode('head')
      if (headBone) {
        headBone.rotation.set(0.1, 0, 0) // 稍微低头
      }
      
      // 脖子 - 自然状态
      const neckBone = vrm.humanoid.getBoneNode('neck')
      if (neckBone) {
        neckBone.rotation.set(0, 0, 0)
      }
      
      // 手臂 - 自然下垂，稍微向外张开，不要张开双手
      const leftArm = vrm.humanoid.getBoneNode('leftUpperArm')
      const rightArm = vrm.humanoid.getBoneNode('rightUpperArm')
      const leftLowerArm = vrm.humanoid.getBoneNode('leftLowerArm')
      const rightLowerArm = vrm.humanoid.getBoneNode('rightLowerArm')
      const leftHand = vrm.humanoid.getBoneNode('leftHand')
      const rightHand = vrm.humanoid.getBoneNode('rightHand')
      
      if (leftArm) {
        leftArm.rotation.set(0, 0, 0.15) // 稍微向外
      }
      if (rightArm) {
        rightArm.rotation.set(0, 0, -0.15) // 稍微向外
      }
      if (leftLowerArm) {
        leftLowerArm.rotation.set(0.1, 0, 0) // 轻微弯曲
      }
      if (rightLowerArm) {
        rightLowerArm.rotation.set(0.1, 0, 0) // 轻微弯曲
      }
      if (leftHand) {
        leftHand.rotation.set(0, 0, 0)
      }
      if (rightHand) {
        rightHand.rotation.set(0, 0, 0)
      }
      
      // 脊柱 - 挺直站立
      const spine = vrm.humanoid.getBoneNode('spine')
      if (spine) {
        spine.rotation.set(0, 0, 0)
      }
      
      // 胸部 - 自然挺胸
      const chest = vrm.humanoid.getBoneNode('chest')
      if (chest) {
        chest.rotation.set(-0.05, 0, 0) // 轻微挺胸
      }
      
      // 臀部 - 水平
      const hips = vrm.humanoid.getBoneNode('hips')
      if (hips) {
        hips.rotation.set(0, 0, 0)
        // 设置初始高度，让脚站在地面上
        hips.position.y = 0
      }
      
      // 腿部 - 站立姿势
      const leftLeg = vrm.humanoid.getBoneNode('leftUpperLeg')
      const rightLeg = vrm.humanoid.getBoneNode('rightUpperLeg')
      const leftLowerLeg = vrm.humanoid.getBoneNode('leftLowerLeg')
      const rightLowerLeg = vrm.humanoid.getBoneNode('rightLowerLeg')
      const leftFoot = vrm.humanoid.getBoneNode('leftFoot')
      const rightFoot = vrm.humanoid.getBoneNode('rightFoot')
      
      if (leftLeg) {
        leftLeg.rotation.set(0, 0, 0)
      }
      if (rightLeg) {
        rightLeg.rotation.set(0, 0, 0)
      }
      if (leftLowerLeg) {
        leftLowerLeg.rotation.set(0.1, 0, 0) // 膝盖轻微弯曲，更自然
      }
      if (rightLowerLeg) {
        rightLowerLeg.rotation.set(0.1, 0, 0)
      }
      if (leftFoot) {
        leftFoot.rotation.set(0, 0, 0)
      }
      if (rightFoot) {
        rightFoot.rotation.set(0, 0, 0)
      }
      
      // 肩膀 - 自然放松
      const leftShoulder = vrm.humanoid.getBoneNode('leftShoulder')
      const rightShoulder = vrm.humanoid.getBoneNode('rightShoulder')
      if (leftShoulder) {
        leftShoulder.rotation.set(0, 0, 0)
      }
      if (rightShoulder) {
        rightShoulder.rotation.set(0, 0, 0)
      }
      
      // 设置表情为自然微笑
      if (vrm.expressionManager) {
        vrm.expressionManager.setValue('neutral', 0.8)
        vrm.expressionManager.setValue('happy', 0.2) // 轻微微笑
      }
      
      vrm.scene.updateMatrixWorld(true)
      
      console.log('初始姿态设置完成 - 角色站立并看向用户')
    }
  }

  const initDragControls = () => {
    if (!characterRef.current) return

    const draggableObjects = []
    characterRef.current.traverse((child) => {
      if (child.isMesh) {
        draggableObjects.push(child)
      }
    })

    if (draggableObjects.length > 0) {
      try {
        if (dragControls.current) {
          dragControls.current.dispose()
        }

        dragControls.current = new DragControls(draggableObjects, camera, gl.domElement)

        dragControls.current.addEventListener('dragstart', () => {
          setIsDragging(true)
          if (camera && camera.userData.orbitControls) {
            camera.userData.orbitControls.enabled = false
          }
        })

        dragControls.current.addEventListener('dragend', () => {
          setIsDragging(false)
          if (camera && camera.userData.orbitControls) {
            camera.userData.orbitControls.enabled = true
          }
        })

        console.log('拖动控制初始化完成')
      } catch (error) {
        console.error('初始化拖动控制失败:', error)
      }
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const isValidFile = file.type === 'model/gltf-binary' || 
                         file.type === 'application/octet-stream' ||
                         file.name.endsWith('.vrm') || 
                         file.name.endsWith('.glb') ||
                         file.name.endsWith('.gltf')
      
      if (isValidFile) {
        console.log('检测到有效文件:', file.name, '类型:', file.type)
        loadVRMModel(file)
      } else {
        alert('请选择有效的3D模型文件（支持.vrm、.glb、.gltf格式）')
      }
    }
  }

  const presetAnimations = [
    { name: ' idle', action: 'idle' },
    { name: ' wave', action: 'wave' },
    { name: ' dance', action: 'dance' },
    { name: ' jump', action: 'jump' },
    { name: ' sit', action: 'sit' }
  ]

  const playAnimation = (animation) => {
    if (!animationMixer) {
      console.error('动画混合器未初始化')
      return
    }

    try {
      if (currentAnimation) {
        currentAnimation.stop()
      }

      const clipAction = animationMixer.clipAction(animation.animation)
      clipAction.play()
      setCurrentAnimation(clipAction)
      console.log('播放动画:', animation.name)
    } catch (error) {
      console.error('播放动画失败:', error)
    }
  }

  // ==================== 程序化骨骼动画系统 ====================
  
  // 保存骨骼初始旋转
  const saveInitialBoneRotations = () => {
    if (!vrmModel || !vrmModel.humanoid) return
    
    initialBoneRotations.current.clear()
    const boneNames = [
      'hips', 'spine', 'chest', 'neck', 'head',
      'leftShoulder', 'leftUpperArm', 'leftLowerArm', 'leftHand',
      'rightShoulder', 'rightUpperArm', 'rightLowerArm', 'rightHand',
      'leftUpperLeg', 'leftLowerLeg', 'leftFoot',
      'rightUpperLeg', 'rightLowerLeg', 'rightFoot'
    ]
    
    boneNames.forEach(boneName => {
      const bone = vrmModel.humanoid.getBoneNode(boneName)
      if (bone) {
        initialBoneRotations.current.set(boneName, bone.rotation.clone())
      }
    })
  }
  
  // 骨骼动画插值函数
  const lerpBoneRotation = (bone, targetRotation, alpha) => {
    if (!bone) return
    bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, targetRotation.x, alpha)
    bone.rotation.y = THREE.MathUtils.lerp(bone.rotation.y, targetRotation.y, alpha)
    bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, targetRotation.z, alpha)
  }
  
  // 大幅度动作库（包含基础动作和特殊动作）
  const dramaticActions = {
    // 基础动作
    idle: {
      duration: 1000,
      keyframes: [
        { time: 0, pose: 'idle' },
        { time: 1, pose: 'idle' }
      ]
    },
    wave: {
      duration: 2000,
      keyframes: [
        { time: 0, pose: 'idle' },
        { time: 0.1, pose: 'armUp' },
        { time: 0.3, pose: 'waveLeft' },
        { time: 0.5, pose: 'waveRight' },
        { time: 0.7, pose: 'waveLeft' },
        { time: 0.9, pose: 'armUp' },
        { time: 1, pose: 'idle' }
      ]
    },
    dance: {
      duration: 3000,
      keyframes: [
        { time: 0, pose: 'idle' },
        { time: 0.1, pose: 'armsOut' },
        { time: 0.25, pose: 'spin1' },
        { time: 0.5, pose: 'spin2' },
        { time: 0.75, pose: 'spin3' },
        { time: 0.9, pose: 'armsOut' },
        { time: 1, pose: 'idle' }
      ]
    },
    jump: {
      duration: 1500,
      keyframes: [
        { time: 0, pose: 'idle' },
        { time: 0.1, pose: 'crouch' },
        { time: 0.3, pose: 'jumpUp' },
        { time: 0.6, pose: 'fallDown' },
        { time: 0.8, pose: 'land' },
        { time: 1, pose: 'idle' }
      ]
    },
    sit: {
      duration: 1500,
      keyframes: [
        { time: 0, pose: 'idle' },
        { time: 0.3, pose: 'crouchDeep' },
        { time: 0.6, pose: 'sitPose' },
        { time: 1, pose: 'sitPose' }
      ]
    },
    // 表情动作
    happy: {
      duration: 1500,
      keyframes: [
        { time: 0, pose: 'idle' },
        { time: 0.2, pose: 'armsUp' },
        { time: 0.8, pose: 'armsUp' },
        { time: 1, pose: 'idle' }
      ]
    },
    sad: {
      duration: 2000,
      keyframes: [
        { time: 0, pose: 'idle' },
        { time: 0.3, pose: 'sadPose' },
        { time: 0.7, pose: 'sadPose' },
        { time: 1, pose: 'idle' }
      ]
    },
    angry: {
      duration: 1500,
      keyframes: [
        { time: 0, pose: 'idle' },
        { time: 0.2, pose: 'angryPose' },
        { time: 0.8, pose: 'angryPose' },
        { time: 1, pose: 'idle' }
      ]
    },
    surprise: {
      duration: 1500,
      keyframes: [
        { time: 0, pose: 'idle' },
        { time: 0.1, pose: 'surprisePose' },
        { time: 0.8, pose: 'surprisePose' },
        { time: 1, pose: 'idle' }
      ]
    },
    love: {
      duration: 2000,
      keyframes: [
        { time: 0, pose: 'idle' },
        { time: 0.2, pose: 'lovePose' },
        { time: 0.8, pose: 'lovePose' },
        { time: 1, pose: 'idle' }
      ]
    },
    sleep: {
      duration: 2000,
      keyframes: [
        { time: 0, pose: 'idle' },
        { time: 0.3, pose: 'sleepPose' },
        { time: 1, pose: 'sleepPose' }
      ]
    },
    // 日常动作
    eat: {
      duration: 2000,
      keyframes: [
        { time: 0, pose: 'idle' },
        { time: 0.2, pose: 'eatStart' },
        { time: 0.5, pose: 'eatBite' },
        { time: 0.8, pose: 'eatChew' },
        { time: 1, pose: 'idle' }
      ]
    },
    read: {
      duration: 2000,
      keyframes: [
        { time: 0, pose: 'idle' },
        { time: 0.3, pose: 'holdBook' },
        { time: 0.7, pose: 'readPose' },
        { time: 1, pose: 'holdBook' }
      ]
    },
    sing: {
      duration: 2000,
      keyframes: [
        { time: 0, pose: 'idle' },
        { time: 0.2, pose: 'singPose' },
        { time: 0.8, pose: 'singPose' },
        { time: 1, pose: 'idle' }
      ]
    },
    photo: {
      duration: 2000,
      keyframes: [
        { time: 0, pose: 'idle' },
        { time: 0.2, pose: 'photoPose' },
        { time: 0.8, pose: 'photoPose' },
        { time: 1, pose: 'idle' }
      ]
    },
    // 从书架拿书 - 大幅度伸手动作
    takeBook: {
      duration: 3000,
      keyframes: [
        { time: 0, pose: 'idle' },
        { time: 0.2, pose: 'reachUpStart' },
        { time: 0.5, pose: 'reachUpHigh' },
        { time: 0.7, pose: 'grabBook' },
        { time: 0.8, pose: 'pullBook' },
        { time: 1.0, pose: 'holdBook' }
      ]
    },
    // 翻跟头
    somersault: {
      duration: 2000,
      keyframes: [
        { time: 0, pose: 'idle' },
        { time: 0.15, pose: 'crouch' },
        { time: 0.3, pose: 'jumpBack' },
        { time: 0.5, pose: 'tuck' },
        { time: 0.7, pose: 'unfold' },
        { time: 0.85, pose: 'land' },
        { time: 1.0, pose: 'idle' }
      ]
    },
    // 超级跳跃
    superJump: {
      duration: 2500,
      keyframes: [
        { time: 0, pose: 'idle' },
        { time: 0.1, pose: 'crouchDeep' },
        { time: 0.25, pose: 'jumpUp' },
        { time: 0.5, pose: 'airPose' },
        { time: 0.75, pose: 'fallDown' },
        { time: 0.9, pose: 'land' },
        { time: 1.0, pose: 'idle' }
      ]
    },
    // 旋转舞蹈
    spinDance: {
      duration: 3000,
      keyframes: [
        { time: 0, pose: 'idle' },
        { time: 0.1, pose: 'armsOut' },
        { time: 0.25, pose: 'spin1' },
        { time: 0.5, pose: 'spin2' },
        { time: 0.75, pose: 'spin3' },
        { time: 0.9, pose: 'armsOut' },
        { time: 1.0, pose: 'idle' }
      ]
    },
    // 大挥手
    bigWave: {
      duration: 2000,
      keyframes: [
        { time: 0, pose: 'idle' },
        { time: 0.1, pose: 'armUp' },
        { time: 0.3, pose: 'waveLeft' },
        { time: 0.5, pose: 'waveRight' },
        { time: 0.7, pose: 'waveLeft' },
        { time: 0.9, pose: 'armUp' },
        { time: 1.0, pose: 'idle' }
      ]
    },
    // 鞠躬
    bow: {
      duration: 2000,
      keyframes: [
        { time: 0, pose: 'idle' },
        { time: 0.2, pose: 'bowStart' },
        { time: 0.5, pose: 'bowDeep' },
        { time: 0.8, pose: 'bowStart' },
        { time: 1.0, pose: 'idle' }
      ]
    },
    // 庆祝动作
    celebrate: {
      duration: 3000,
      keyframes: [
        { time: 0, pose: 'idle' },
        { time: 0.1, pose: 'armsUp' },
        { time: 0.3, pose: 'jump1' },
        { time: 0.5, pose: 'jump2' },
        { time: 0.7, pose: 'jump3' },
        { time: 0.9, pose: 'armsUp' },
        { time: 1.0, pose: 'idle' }
      ]
    }
  }
  
  // 姿势定义
  const poses = {
    idle: {
      spine: { x: 0, y: 0, z: 0 },
      chest: { x: -0.05, y: 0, z: 0 },
      head: { x: 0.1, y: 0, z: 0 },
      leftUpperArm: { x: 0, y: 0, z: 0.15 },
      rightUpperArm: { x: 0, y: 0, z: -0.15 },
      leftLowerArm: { x: 0.1, y: 0, z: 0 },
      rightLowerArm: { x: 0.1, y: 0, z: 0 },
      leftHand: { x: 0, y: 0, z: 0 },
      rightHand: { x: 0, y: 0, z: 0 },
      leftUpperLeg: { x: 0, y: 0, z: 0 },
      rightUpperLeg: { x: 0, y: 0, z: 0 },
      leftLowerLeg: { x: 0.1, y: 0, z: 0 },
      rightLowerLeg: { x: 0.1, y: 0, z: 0 }
    },
    // 拿书动作姿势
    reachUpStart: {
      spine: { x: -0.2, y: 0, z: 0 },
      chest: { x: -0.1, y: 0, z: 0 },
      rightUpperArm: { x: 0, y: 0, z: -2.5 },
      rightLowerArm: { x: 0, y: 0, z: 0 },
      head: { x: -0.3, y: 0, z: 0 }
    },
    reachUpHigh: {
      spine: { x: -0.4, y: 0, z: 0 },
      chest: { x: -0.2, y: 0, z: 0 },
      rightUpperArm: { x: -2.8, y: 0.5, z: -0.5 },
      rightLowerArm: { x: -0.5, y: 0, z: 0 },
      head: { x: -0.5, y: 0, z: 0 }
    },
    grabBook: {
      spine: { x: -0.4, y: 0, z: 0 },
      rightUpperArm: { x: -2.8, y: 0.3, z: -0.3 },
      rightLowerArm: { x: -0.3, y: 0, z: 0 },
      rightHand: { x: 0, y: 0, z: -0.5 }
    },
    pullBook: {
      spine: { x: -0.2, y: 0, z: 0 },
      rightUpperArm: { x: -2.0, y: 0, z: -0.5 },
      rightLowerArm: { x: -1.0, y: 0, z: 0 },
      head: { x: 0, y: 0.3, z: 0 }
    },
    holdBook: {
      spine: { x: 0, y: 0, z: 0 },
      rightUpperArm: { x: -0.5, y: 0, z: -0.8 },
      rightLowerArm: { x: -1.5, y: 0, z: 0 },
      leftUpperArm: { x: 0, y: 0, z: 0.8 },
      leftLowerArm: { x: -1.0, y: 0, z: 0 }
    },
    // 翻跟头姿势
    crouch: {
      hips: { x: 0, y: -0.3, z: 0 },
      leftUpperLeg: { x: -1.2, y: 0, z: 0 },
      rightUpperLeg: { x: -1.2, y: 0, z: 0 },
      leftLowerLeg: { x: 2.0, y: 0, z: 0 },
      rightLowerLeg: { x: 2.0, y: 0, z: 0 },
      spine: { x: 0.3, y: 0, z: 0 }
    },
    jumpBack: {
      hips: { x: 0.5, y: 0.5, z: 0 },
      leftUpperLeg: { x: -0.8, y: 0, z: 0 },
      rightUpperLeg: { x: -0.8, y: 0, z: 0 },
      spine: { x: -0.5, y: 0, z: 0 }
    },
    tuck: {
      hips: { x: 1.5, y: 1.0, z: 0 },
      leftUpperLeg: { x: -2.0, y: 0, z: 0 },
      rightUpperLeg: { x: -2.0, y: 0, z: 0 },
      leftLowerLeg: { x: 2.5, y: 0, z: 0 },
      rightLowerLeg: { x: 2.5, y: 0, z: 0 },
      leftUpperArm: { x: 0, y: 0, z: 2.0 },
      rightUpperArm: { x: 0, y: 0, z: -2.0 },
      spine: { x: 0.5, y: 0, z: 0 }
    },
    unfold: {
      hips: { x: 0.5, y: 0.3, z: 0 },
      leftUpperLeg: { x: -0.5, y: 0, z: 0 },
      rightUpperLeg: { x: -0.5, y: 0, z: 0 },
      spine: { x: -0.2, y: 0, z: 0 }
    },
    land: {
      hips: { x: 0, y: -0.2, z: 0 },
      leftUpperLeg: { x: -0.8, y: 0, z: 0 },
      rightUpperLeg: { x: -0.8, y: 0, z: 0 },
      leftLowerLeg: { x: 1.5, y: 0, z: 0 },
      rightLowerLeg: { x: 1.5, y: 0, z: 0 }
    },
    // 超级跳跃姿势
    crouchDeep: {
      hips: { x: 0, y: -0.5, z: 0 },
      leftUpperLeg: { x: -1.5, y: 0, z: 0 },
      rightUpperLeg: { x: -1.5, y: 0, z: 0 },
      leftLowerLeg: { x: 2.2, y: 0, z: 0 },
      rightLowerLeg: { x: 2.2, y: 0, z: 0 },
      spine: { x: 0.4, y: 0, z: 0 },
      leftUpperArm: { x: 0, y: 0, z: 2.5 },
      rightUpperArm: { x: 0, y: 0, z: -2.5 }
    },
    jumpUp: {
      hips: { x: 0, y: 2.0, z: 0 },
      leftUpperLeg: { x: -0.3, y: 0, z: 0 },
      rightUpperLeg: { x: -0.3, y: 0, z: 0 },
      leftLowerLeg: { x: 0.5, y: 0, z: 0 },
      rightLowerLeg: { x: 0.5, y: 0, z: 0 },
      leftUpperArm: { x: -2.5, y: 0, z: 0.5 },
      rightUpperArm: { x: -2.5, y: 0, z: -0.5 },
      spine: { x: -0.2, y: 0, z: 0 }
    },
    airPose: {
      hips: { x: 0, y: 2.5, z: 0 },
      leftUpperLeg: { x: -0.5, y: 0, z: 0.3 },
      rightUpperLeg: { x: -0.5, y: 0, z: -0.3 },
      leftUpperArm: { x: -2.0, y: 0.5, z: 1.0 },
      rightUpperArm: { x: -2.0, y: -0.5, z: -1.0 },
      spine: { x: 0.1, y: 0, z: 0 }
    },
    fallDown: {
      hips: { x: 0, y: 1.0, z: 0 },
      leftUpperLeg: { x: -0.3, y: 0, z: 0 },
      rightUpperLeg: { x: -0.3, y: 0, z: 0 },
      leftUpperArm: { x: 0.5, y: 0, z: 0.5 },
      rightUpperArm: { x: 0.5, y: 0, z: -0.5 }
    },
    // 旋转舞蹈姿势
    armsOut: {
      leftUpperArm: { x: 0, y: 0, z: 1.8 },
      rightUpperArm: { x: 0, y: 0, z: -1.8 },
      leftLowerArm: { x: 0, y: 0, z: 0 },
      rightLowerArm: { x: 0, y: 0, z: 0 },
      spine: { x: 0, y: 0, z: 0 }
    },
    spin1: {
      hips: { x: 0, y: 0.5, z: 0 },
      spine: { x: 0, y: 2.0, z: 0 },
      leftUpperArm: { x: 0.5, y: 0.5, z: 1.5 },
      rightUpperArm: { x: -0.5, y: -0.5, z: -1.5 },
      leftUpperLeg: { x: -0.3, y: 0, z: 0.2 },
      rightUpperLeg: { x: -0.5, y: 0, z: -0.2 }
    },
    spin2: {
      hips: { x: 0, y: 0.5, z: 0 },
      spine: { x: 0, y: 4.0, z: 0 },
      leftUpperArm: { x: 0, y: 1.0, z: 1.5 },
      rightUpperArm: { x: 0, y: -1.0, z: -1.5 }
    },
    spin3: {
      hips: { x: 0, y: 0.3, z: 0 },
      spine: { x: 0, y: 6.0, z: 0 },
      leftUpperArm: { x: -0.5, y: 0.5, z: 1.5 },
      rightUpperArm: { x: 0.5, y: -0.5, z: -1.5 },
      leftUpperLeg: { x: -0.5, y: 0, z: 0 },
      rightUpperLeg: { x: -0.3, y: 0, z: 0 }
    },
    // 大挥手姿势
    armUp: {
      rightUpperArm: { x: 0, y: 0, z: -2.8 },
      rightLowerArm: { x: 0, y: 0, z: 0 },
      spine: { x: 0, y: 0.2, z: 0 }
    },
    waveLeft: {
      rightUpperArm: { x: 0, y: 0, z: -2.5 },
      rightLowerArm: { x: 0, y: 0, z: -0.8 },
      head: { x: 0, y: -0.3, z: 0 }
    },
    waveRight: {
      rightUpperArm: { x: 0, y: 0, z: -2.5 },
      rightLowerArm: { x: 0, y: 0, z: 0.8 },
      head: { x: 0, y: 0.3, z: 0 }
    },
    // 鞠躬姿势
    bowStart: {
      spine: { x: 0.3, y: 0, z: 0 },
      chest: { x: 0.4, y: 0, z: 0 },
      head: { x: 0.5, y: 0, z: 0 },
      leftUpperArm: { x: 0, y: 0, z: 0.3 },
      rightUpperArm: { x: 0, y: 0, z: -0.3 }
    },
    bowDeep: {
      spine: { x: 0.8, y: 0, z: 0 },
      chest: { x: 0.8, y: 0, z: 0 },
      head: { x: 0.8, y: 0, z: 0 },
      leftUpperArm: { x: 0.2, y: 0, z: 0.5 },
      rightUpperArm: { x: 0.2, y: 0, z: -0.5 },
      leftUpperLeg: { x: -0.3, y: 0, z: 0 },
      rightUpperLeg: { x: -0.3, y: 0, z: 0 }
    },
    // 庆祝姿势
    armsUp: {
      leftUpperArm: { x: -2.8, y: 0, z: 0.3 },
      rightUpperArm: { x: -2.8, y: 0, z: -0.3 },
      leftLowerArm: { x: -0.3, y: 0, z: 0 },
      rightLowerArm: { x: -0.3, y: 0, z: 0 },
      spine: { x: -0.1, y: 0, z: 0 },
      head: { x: -0.2, y: 0, z: 0 }
    },
    jump1: {
      hips: { x: 0, y: 0.8, z: 0 },
      leftUpperLeg: { x: -0.5, y: 0, z: 0 },
      rightUpperLeg: { x: -0.5, y: 0, z: 0 },
      leftLowerLeg: { x: 1.0, y: 0, z: 0 },
      rightLowerLeg: { x: 1.0, y: 0, z: 0 },
      leftUpperArm: { x: -2.5, y: 0.5, z: 0.5 },
      rightUpperArm: { x: -2.5, y: -0.5, z: -0.5 }
    },
    jump2: {
      hips: { x: 0, y: 1.2, z: 0 },
      leftUpperLeg: { x: -0.8, y: 0, z: 0.2 },
      rightUpperLeg: { x: -0.8, y: 0, z: -0.2 },
      leftUpperArm: { x: -2.8, y: 0, z: 1.0 },
      rightUpperArm: { x: -2.8, y: 0, z: -1.0 }
    },
    jump3: {
      hips: { x: 0, y: 0.8, z: 0 },
      leftUpperLeg: { x: -0.5, y: 0, z: 0 },
      rightUpperLeg: { x: -0.5, y: 0, z: 0 },
      leftUpperArm: { x: -2.5, y: -0.5, z: 0.5 },
      rightUpperArm: { x: -2.5, y: 0.5, z: -0.5 }
    },
    // 表情姿势
    sadPose: {
      spine: { x: 0.2, y: 0, z: 0 },
      chest: { x: 0.1, y: 0, z: 0 },
      head: { x: 0.3, y: 0, z: 0 },
      leftUpperArm: { x: 0, y: 0, z: 0.1 },
      rightUpperArm: { x: 0, y: 0, z: -0.1 }
    },
    angryPose: {
      spine: { x: -0.1, y: 0, z: 0 },
      chest: { x: -0.1, y: 0, z: 0 },
      head: { x: -0.1, y: 0, z: 0 },
      leftUpperArm: { x: 0, y: 0, z: 0.5 },
      rightUpperArm: { x: 0, y: 0, z: -0.5 }
    },
    surprisePose: {
      spine: { x: -0.2, y: 0, z: 0 },
      chest: { x: -0.1, y: 0, z: 0 },
      head: { x: -0.3, y: 0, z: 0 },
      leftUpperArm: { x: -1.5, y: 0, z: 1.0 },
      rightUpperArm: { x: -1.5, y: 0, z: -1.0 }
    },
    lovePose: {
      spine: { x: -0.1, y: 0, z: 0 },
      chest: { x: -0.1, y: 0, z: 0 },
      head: { x: -0.2, y: 0, z: 0 },
      leftUpperArm: { x: -1.0, y: 0.5, z: 0.8 },
      rightUpperArm: { x: -1.0, y: -0.5, z: -0.8 },
      leftLowerArm: { x: -1.0, y: 0, z: 0 },
      rightLowerArm: { x: -1.0, y: 0, z: 0 }
    },
    sleepPose: {
      hips: { x: 0, y: -0.8, z: 0 },
      spine: { x: 0.3, y: 0, z: 0 },
      chest: { x: 0.2, y: 0, z: 0 },
      head: { x: 0.5, y: 0, z: 0 },
      leftUpperLeg: { x: -1.0, y: 0, z: 0 },
      rightUpperLeg: { x: -1.0, y: 0, z: 0 },
      leftLowerLeg: { x: 1.5, y: 0, z: 0 },
      rightLowerLeg: { x: 1.5, y: 0, z: 0 },
      leftUpperArm: { x: 0, y: 0, z: 0.5 },
      rightUpperArm: { x: 0, y: 0, z: -0.5 }
    },
    // 日常姿势
    sitPose: {
      hips: { x: 0, y: -0.8, z: 0 },
      leftUpperLeg: { x: -1.2, y: 0, z: 0 },
      rightUpperLeg: { x: -1.2, y: 0, z: 0 },
      leftLowerLeg: { x: 1.8, y: 0, z: 0 },
      rightLowerLeg: { x: 1.8, y: 0, z: 0 },
      spine: { x: 0.1, y: 0, z: 0 }
    },
    eatStart: {
      rightUpperArm: { x: -1.5, y: 0, z: -0.5 },
      rightLowerArm: { x: -1.5, y: 0, z: 0 },
      head: { x: -0.1, y: 0, z: 0 }
    },
    eatBite: {
      rightUpperArm: { x: -1.5, y: 0, z: -0.3 },
      rightLowerArm: { x: -2.0, y: 0, z: 0 },
      head: { x: 0.1, y: 0, z: 0 }
    },
    eatChew: {
      rightUpperArm: { x: -1.0, y: 0, z: -0.5 },
      rightLowerArm: { x: -1.0, y: 0, z: 0 },
      head: { x: 0.05, y: 0, z: 0 }
    },
    readPose: {
      spine: { x: -0.2, y: 0, z: 0 },
      chest: { x: -0.1, y: 0, z: 0 },
      head: { x: -0.3, y: 0, z: 0 },
      leftUpperArm: { x: -0.5, y: 0.3, z: 0.8 },
      rightUpperArm: { x: -0.5, y: -0.3, z: -0.8 },
      leftLowerArm: { x: -1.0, y: 0, z: 0 },
      rightLowerArm: { x: -1.0, y: 0, z: 0 }
    },
    singPose: {
      spine: { x: -0.1, y: 0, z: 0 },
      chest: { x: -0.1, y: 0, z: 0 },
      head: { x: -0.2, y: 0, z: 0 },
      leftUpperArm: { x: -1.0, y: 0, z: 0.5 },
      rightUpperArm: { x: -1.5, y: 0, z: -0.5 },
      rightLowerArm: { x: -0.5, y: 0, z: 0 }
    },
    photoPose: {
      rightUpperArm: { x: -1.5, y: 0, z: -0.8 },
      rightLowerArm: { x: -1.0, y: 0, z: 0 },
      head: { x: -0.1, y: -0.2, z: 0 },
      spine: { x: -0.05, y: 0.1, z: 0 }
    }
  }
  
  // ==================== 优化版骨骼动画系统 ====================
  
  // 高级缓动函数
  const easingFunctions = {
    // 平滑开始和结束
    smooth: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    // 弹性效果
    elastic: (t) => {
      const c4 = (2 * Math.PI) / 3
      return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4)
    },
    // 回弹效果
    bounce: (t) => {
      const n1 = 7.5625
      const d1 = 2.75
      if (t < 1 / d1) {
        return n1 * t * t
      } else if (t < 2 / d1) {
        return n1 * (t -= 1.5 / d1) * t + 0.75
      } else if (t < 2.5 / d1) {
        return n1 * (t -= 2.25 / d1) * t + 0.9375
      } else {
        return n1 * (t -= 2.625 / d1) * t + 0.984375
      }
    },
    // 三次方缓动
    cubic: (t) => 1 - Math.pow(1 - t, 3),
    // 五次方缓动（更平滑）
    quint: (t) => 1 - Math.pow(1 - t, 5),
    // 指数缓动
    expo: (t) => t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2
  }
  
  // 骨骼速度追踪（用于惯性效果）
  const boneVelocities = useRef(new Map())
  
  // 执行骨骼动画（优化版）
  const executeBoneAnimation = (actionName) => {
    if (!vrmModel || !vrmModel.humanoid) {
      console.log('VRM模型未加载，无法执行骨骼动画')
      return
    }
    
    // 停止当前动画
    if (currentBoneAnimation.current) {
      cancelAnimationFrame(currentBoneAnimation.current)
    }
    
    // 保存初始姿势
    if (initialBoneRotations.current.size === 0) {
      saveInitialBoneRotations()
    }
    
    const action = dramaticActions[actionName]
    if (!action) {
      console.log('未找到动作:', actionName)
      return
    }
    
    console.log('开始执行优化版大幅度动作:', actionName)
    animationStartTime.current = Date.now()
    
    // 初始化骨骼速度
    boneVelocities.current.clear()
    
    const animate = () => {
      const elapsed = Date.now() - animationStartTime.current
      const progress = Math.min(elapsed / action.duration, 1)
      
      // 找到当前和下一个关键帧
      let currentKeyframe = action.keyframes[0]
      let nextKeyframe = action.keyframes[action.keyframes.length - 1]
      
      for (let i = 0; i < action.keyframes.length - 1; i++) {
        if (progress >= action.keyframes[i].time && progress <= action.keyframes[i + 1].time) {
          currentKeyframe = action.keyframes[i]
          nextKeyframe = action.keyframes[i + 1]
          break
        }
      }
      
      // 计算关键帧之间的插值
      const frameDuration = nextKeyframe.time - currentKeyframe.time
      const frameProgress = frameDuration > 0 ? (progress - currentKeyframe.time) / frameDuration : 0
      
      // 根据动作类型选择缓动函数
      let easeProgress
      if (actionName === 'somersault' || actionName === 'superJump') {
        // 翻跟头和大跳用弹性缓动
        easeProgress = easingFunctions.elastic(frameProgress)
      } else if (actionName === 'celebrate') {
        // 庆祝用回弹缓动
        easeProgress = easingFunctions.bounce(frameProgress)
      } else if (actionName === 'spinDance') {
        // 旋转舞用平滑缓动
        easeProgress = easingFunctions.smooth(frameProgress)
      } else {
        // 其他用五次方缓动
        easeProgress = easingFunctions.quint(frameProgress)
      }
      
      // 应用姿势
      const currentPose = poses[currentKeyframe.pose] || poses.idle
      const nextPose = poses[nextKeyframe.pose] || poses.idle
      
      // 合并姿势（插值）
      const allBones = new Set([...Object.keys(currentPose), ...Object.keys(nextPose)])
      
      allBones.forEach(boneName => {
        const bone = vrmModel.humanoid.getBoneNode(boneName)
        if (!bone) return
        
        const currentRot = currentPose[boneName] || { x: 0, y: 0, z: 0 }
        const nextRot = nextPose[boneName] || { x: 0, y: 0, z: 0 }
        const initialRot = initialBoneRotations.current.get(boneName) || { x: 0, y: 0, z: 0 }
        
        // 插值计算目标旋转
        const targetX = initialRot.x + THREE.MathUtils.lerp(currentRot.x, nextRot.x, easeProgress)
        const targetY = initialRot.y + THREE.MathUtils.lerp(currentRot.y, nextRot.y, easeProgress)
        const targetZ = initialRot.z + THREE.MathUtils.lerp(currentRot.z, nextRot.z, easeProgress)
        
        // 获取或初始化速度
        if (!boneVelocities.current.has(boneName)) {
          boneVelocities.current.set(boneName, { x: 0, y: 0, z: 0 })
        }
        const velocity = boneVelocities.current.get(boneName)
        
        // 计算目标速度（用于惯性）
        const deltaX = targetX - bone.rotation.x
        const deltaY = targetY - bone.rotation.y
        const deltaZ = targetZ - bone.rotation.z
        
        // 更新速度（带阻尼）
        velocity.x = velocity.x * 0.8 + deltaX * 0.2
        velocity.y = velocity.y * 0.8 + deltaY * 0.2
        velocity.z = velocity.z * 0.8 + deltaZ * 0.2
        
        // 应用速度和位置（提高响应速度到0.6，更快响应）
        const lerpFactor = 0.6
        bone.rotation.x += velocity.x * lerpFactor
        bone.rotation.y += velocity.y * lerpFactor
        bone.rotation.z += velocity.z * lerpFactor
      })
      
      // 继续动画或结束
      if (progress < 1) {
        currentBoneAnimation.current = requestAnimationFrame(animate)
      } else {
        console.log('动作完成:', actionName)
        currentBoneAnimation.current = null
        // 自动返回idle，延迟更短
        setTimeout(() => {
          returnToIdleSmooth()
        }, 300)
      }
    }
    
    animate()
  }
  
  // 平滑返回待机姿势（优化版）
  const returnToIdleSmooth = () => {
    if (!vrmModel || !vrmModel.humanoid) return
    
    const startTime = Date.now()
    const duration = 800 // 缩短返回时间
    
    // 记录起始姿势
    const startRotations = new Map()
    initialBoneRotations.current.forEach((rot, boneName) => {
      const bone = vrmModel.humanoid.getBoneNode(boneName)
      if (bone) {
        startRotations.set(boneName, bone.rotation.clone())
      }
    })
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = easingFunctions.smooth(progress)
      
      initialBoneRotations.current.forEach((initialRot, boneName) => {
        const bone = vrmModel.humanoid.getBoneNode(boneName)
        if (!bone) return
        
        const startRot = startRotations.get(boneName)
        if (!startRot) return
        
        // 从当前姿势平滑过渡到初始姿势（提高速度到0.2）
        bone.rotation.x = THREE.MathUtils.lerp(startRot.x, initialRot.x, easeProgress * 0.2)
        bone.rotation.y = THREE.MathUtils.lerp(startRot.y, initialRot.y, easeProgress * 0.2)
        bone.rotation.z = THREE.MathUtils.lerp(startRot.z, initialRot.z, easeProgress * 0.2)
      })
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    animate()
  }
  
  // 返回待机姿势
  const returnToIdle = () => {
    if (!vrmModel || !vrmModel.humanoid) return
    
    const startTime = Date.now()
    const duration = 1000
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      
      initialBoneRotations.current.forEach((initialRot, boneName) => {
        const bone = vrmModel.humanoid.getBoneNode(boneName)
        if (!bone) return
        
        // 从当前姿势平滑过渡到初始姿势
        bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, initialRot.x, easeProgress * 0.1)
        bone.rotation.y = THREE.MathUtils.lerp(bone.rotation.y, initialRot.y, easeProgress * 0.1)
        bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, initialRot.z, easeProgress * 0.1)
      })
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    animate()
  }

  const executePresetAction = (actionName) => {
    console.log('执行预设动作:', actionName)
    setCurrentActionType(actionName)
    
    // 立即显示视觉反馈 - 更快的响应
    const feedbackElement = document.createElement('div')
    feedbackElement.style.position = 'fixed'
    feedbackElement.style.top = '50%'
    feedbackElement.style.left = '50%'
    feedbackElement.style.transform = 'translate(-50%, -50%) scale(0.8)'
    feedbackElement.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    feedbackElement.style.color = 'white'
    feedbackElement.style.padding = '12px 24px'
    feedbackElement.style.borderRadius = '20px'
    feedbackElement.style.fontSize = '14px'
    feedbackElement.style.fontWeight = '700'
    feedbackElement.style.zIndex = '9999'
    feedbackElement.style.boxShadow = '0 8px 32px rgba(102, 126, 234, 0.4)'
    feedbackElement.style.backdropFilter = 'blur(10px)'
    feedbackElement.style.border = '2px solid rgba(255, 255, 255, 0.3)'
    feedbackElement.style.transition = 'all 0.15s ease'
    feedbackElement.textContent = `✨ ${actionName} ✨`
    document.body.appendChild(feedbackElement)
    
    // 立即执行动画
    requestAnimationFrame(() => {
      feedbackElement.style.transform = 'translate(-50%, -50%) scale(1)'
    })
    
    // 快速消失
    setTimeout(() => {
      feedbackElement.style.opacity = '0'
      feedbackElement.style.transform = 'translate(-50%, -50%) scale(0.8)'
      setTimeout(() => {
        if (feedbackElement.parentNode) {
          document.body.removeChild(feedbackElement)
        }
      }, 150)
    }, 400)
    
    // 立即显示粒子效果
    setShowParticles(true)
    setTimeout(() => setShowParticles(false), 800)
    
    // 使用骨骼动画系统执行所有动作
    // VRM模型通常没有自带动画，所以使用程序化骨骼动画
    executeBoneAnimation(actionName)
  }

  const playModelAnimation = (animationName) => {
    if (!animationMixer || modelAnimations.length === 0) {
      console.log('动画混合器未初始化或没有动画')
      return
    }
    
    const animation = modelAnimations.find(a => a.name === animationName)
    if (!animation) {
      console.log('未找到动画:', animationName, '，播放待机动画')
      const idleAnimation = modelAnimations.find(a => a.name.toLowerCase().includes('idle'))
      if (idleAnimation) {
        playModelAnimation(idleAnimation.name)
      } else {
        console.warn('未找到待机动画，模型将保持当前状态')
      }
      return
    }
    
    console.log('播放模型动画:', animationName)
    
    if (currentAnimation) {
      currentAnimation.fadeOut(0.1) // 更快的淡出
    }
    
    const clipAction = animationMixer.clipAction(animation.animation)
    clipAction.setLoop(THREE.LoopRepeat)
    clipAction.reset()
    clipAction.fadeIn(0.15) // 更快的淡入，立即响应
    clipAction.play()
    setCurrentAnimation(clipAction)
    setCurrentAnimationClip(animationName)
  }

  const handleTouchStart = (event) => {
    event.stopPropagation()
    touchStartTime.current = Date.now()
    isLongPress.current = false
    
    const rect = gl.domElement.getBoundingClientRect()
    const clientX = event.clientX || (event.touches && event.touches[0].clientX)
    const clientY = event.clientY || (event.touches && event.touches[0].clientY)
    const x = ((clientX - rect.left) / rect.width) * 2 - 1
    const y = -((clientY - rect.top) / rect.height) * 2 + 1
    
    touchStartPos.current = { x: clientX, y: clientY }
    
    mouse.current.set(x, y)
    raycaster.current.setFromCamera(mouse.current, camera)
    
    if (characterRef.current) {
      const intersects = raycaster.current.intersectObject(characterRef.current, true)
      
      if (intersects.length > 0) {
        setIsTouching(true)
        setTouchPosition(intersects[0].point)
        
        // 显示触摸涟漪效果
        setTouchRipple({
          show: true,
          x: clientX,
          y: clientY,
          scale: 0
        })
        
        // 涟漪动画
        let scale = 0
        const rippleAnimation = setInterval(() => {
          scale += 0.1
          setTouchRipple(prev => ({ ...prev, scale }))
          if (scale >= 1.5) {
            clearInterval(rippleAnimation)
            setTimeout(() => {
              setTouchRipple({ show: false, x: 0, y: 0, scale: 0 })
            }, 200)
          }
        }, 30)
        
        // 设置长按定时器（500ms）
        longPressTimer.current = setTimeout(() => {
          isLongPress.current = true
          // 长按触发特殊动作
          if (vrmModel && vrmModel.expressionManager) {
            vrmModel.expressionManager.setValue('happy', 1)
            // 触发跳跃动作
            executePresetAction('jump')
          }
          // 显示长按反馈
          setTouchFeedback({
            show: true,
            x: clientX,
            y: clientY,
            type: 'longpress'
          })
        }, 500)
        
        // 短按反馈 - 表情变化
        if (vrmModel && vrmModel.expressionManager) {
          const expressions = ['happy', 'surprised', 'blink']
          const randomExpression = expressions[Math.floor(Math.random() * expressions.length)]
          vrmModel.expressionManager.setValue(randomExpression, 0.5)
          
          setTimeout(() => {
            if (!isLongPress.current) {
              vrmModel.expressionManager.setValue(randomExpression, 0)
            }
          }, 600)
        }
        
        setShowParticles(true)
        setTimeout(() => setShowParticles(false), 1000)
      }
    }
  }

  const handleTouchEnd = (event) => {
    event.stopPropagation()
    const touchDuration = Date.now() - touchStartTime.current
    
    // 清除长按定时器
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    
    // 如果不是长按，则触发点击动作
    if (isTouching && !isLongPress.current && touchDuration < 500) {
      const randomAnimations = modelAnimations.length > 0 ? modelAnimations : presetAnimations
      if (randomAnimations.length > 0) {
        const randomAnim = randomAnimations[Math.floor(Math.random() * randomAnimations.length)]
        executePresetAction(randomAnim.name || randomAnim.action)
      }
    }
    
    // 长按结束时重置表情
    if (isLongPress.current && vrmModel && vrmModel.expressionManager) {
      vrmModel.expressionManager.setValue('happy', 0)
    }
    
    setIsTouching(false)
    setTouchFeedback({ show: false, x: 0, y: 0, type: null })
  }

  const handleTouchMove = (event) => {
    event.stopPropagation()
    
    const rect = gl.domElement.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    mouse.current.set(x, y)
    
    // 更新视线目标到鼠标位置
    if (isLookingAtCamera) {
      raycaster.current.setFromCamera(mouse.current, camera)
      const targetDistance = 5
      const target = new THREE.Vector3()
      raycaster.current.ray.at(targetDistance, target)
      setLookAtTarget(target)
    }
    
    if (isTouching && characterRef.current) {
      raycaster.current.setFromCamera(mouse.current, camera)
      const intersects = raycaster.current.intersectObject(characterRef.current, true)
      
      if (intersects.length > 0) {
        setTouchPosition(intersects[0].point)
      }
    }
  }

  useEffect(() => {
    const canvas = gl.domElement
    canvas.addEventListener('mousedown', handleTouchStart)
    canvas.addEventListener('mouseup', handleTouchEnd)
    canvas.addEventListener('mousemove', handleTouchMove)
    canvas.addEventListener('touchstart', handleTouchStart)
    canvas.addEventListener('touchend', handleTouchEnd)
    canvas.addEventListener('touchmove', handleTouchMove)

    return () => {
      canvas.removeEventListener('mousedown', handleTouchStart)
      canvas.removeEventListener('mouseup', handleTouchEnd)
      canvas.removeEventListener('mousemove', handleTouchMove)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchend', handleTouchEnd)
      canvas.removeEventListener('touchmove', handleTouchMove)
    }
  }, [characterRef.current, vrmModel])

  useEffect(() => {
    const handleExecuteAction = (event) => {
      const { action, actionName } = event.detail
      // 支持 action 或 actionName 两种参数名
      const targetAction = action || actionName
      if (targetAction) {
        executePresetAction(targetAction)
      }
    }

    const handleExecuteCombo = (event) => {
      const { sequence } = event.detail
      executeCombo(sequence)
    }

    const handleToggleRandom = () => {
      toggleRandomMode()
    }

    const handleResetPosition = () => {
      if (characterRef.current) {
        characterRef.current.position.set(0, 0, 0)
        characterRef.current.rotation.set(0, 0, 0)
        characterRef.current.scale.set(optimalScale, optimalScale, optimalScale)
      }
    }

    // 摇晃检测功能已禁用 - 避免模型跟随陀螺仪摇晃
    // const handleSwingDetected = (event) => {
    //   const { swingX, swingY, swingZ } = event.detail
    //   const swingMagnitude = Math.sqrt(swingX * swingX + swingY * swingY + swingZ * swingZ)
    //   
    //   const animations = modelAnimations.length > 0 ? modelAnimations : presetAnimations
    //   if (animations.length > 0) {
    //     const randomAnim = animations[Math.floor(Math.random() * animations.length)]
    //     executePresetAction(randomAnim.name || randomAnim.action)
    //   }
    // }

    const handleRotateCanvas = (event) => {
      const { rotation } = event.detail
      setCanvasRotation(rotation)
      if (characterRef.current) {
        characterRef.current.rotation.y = rotation * (Math.PI / 180)
      }
    }

    window.addEventListener('executeAction', handleExecuteAction)
    window.addEventListener('executeCombo', handleExecuteCombo)
    window.addEventListener('toggleRandom', handleToggleRandom)
    window.addEventListener('resetPosition', handleResetPosition)
    window.addEventListener('rotateCanvas', handleRotateCanvas)
    // window.addEventListener('swingDetected', handleSwingDetected)

    return () => {
      window.removeEventListener('executeAction', handleExecuteAction)
      window.removeEventListener('executeCombo', handleExecuteCombo)
      window.removeEventListener('toggleRandom', handleToggleRandom)
      window.removeEventListener('resetPosition', handleResetPosition)
      window.removeEventListener('rotateCanvas', handleRotateCanvas)
      // window.removeEventListener('swingDetected', handleSwingDetected)
    }
  }, [modelAnimations, optimalScale])

  const executeCombo = (sequence) => {
    console.log('执行连招:', sequence)
    setIsComboMode(true)
    setComboSequence(sequence)
    
    let index = 0
    const playNext = () => {
      if (index < sequence.length) {
        executePresetAction(sequence[index])
        index++
        setTimeout(playNext, 2000)
      } else {
        setIsComboMode(false)
        setComboSequence([])
      }
    }
    
    playNext()
  }

  const toggleRandomMode = () => {
    setIsRandomMode(!isRandomMode)
    
    if (!isRandomMode) {
      if (randomModeInterval.current) {
        clearInterval(randomModeInterval.current)
      }
      
      const animations = modelAnimations.length > 0 ? modelAnimations : presetAnimations
      if (animations.length > 0) {
        randomModeInterval.current = setInterval(() => {
          const randomAnim = animations[Math.floor(Math.random() * animations.length)]
          executePresetAction(randomAnim.name || randomAnim.action)
        }, 3000)
      }
    } else {
      if (randomModeInterval.current) {
        clearInterval(randomModeInterval.current)
      }
    }
  }

  useEffect(() => {
    return () => {
      if (randomModeInterval.current) {
        clearInterval(randomModeInterval.current)
      }
    }
  }, [])

  useFrame((state, delta) => {
    try {
      if (animationMixer && typeof animationMixer.update === 'function') {
        animationMixer.update(delta)
      }
      
      // VRM update 会覆盖骨骼动画，所以在执行骨骼动画时跳过
      if (vrmModel && typeof vrmModel.update === 'function' && !currentBoneAnimation.current) {
        vrmModel.update(delta)
      }
      
      if (characterRef.current && isAnimating) {
        const smoothFactor = 0.15
        
        if (targetPosition) {
          characterRef.current.position.x += (targetPosition.x - characterRef.current.position.x) * smoothFactor
          characterRef.current.position.y += (targetPosition.y - characterRef.current.position.y) * smoothFactor
          characterRef.current.position.z += (targetPosition.z - characterRef.current.position.z) * smoothFactor
        }
        
        if (targetRotation) {
          characterRef.current.rotation.x += (targetRotation.x - characterRef.current.rotation.x) * smoothFactor
          characterRef.current.rotation.y += (targetRotation.y - characterRef.current.rotation.y) * smoothFactor
          characterRef.current.rotation.z += (targetRotation.z - characterRef.current.rotation.z) * smoothFactor
        }
        
        if (targetScale) {
          characterRef.current.scale.x += (targetScale.x - characterRef.current.scale.x) * smoothFactor
          characterRef.current.scale.y += (targetScale.y - characterRef.current.scale.y) * smoothFactor
          characterRef.current.scale.z += (targetScale.z - characterRef.current.scale.z) * smoothFactor
        }
        
        if (targetPosition && targetRotation) {
          const posDiff = Math.abs(characterRef.current.position.y - targetPosition.y)
          const rotDiff = Math.abs(characterRef.current.rotation.y - targetRotation.y)
          
          if (posDiff < 0.01 && rotDiff < 0.01) {
            setIsAnimating(false)
          }
        }
      }
      
      // 呼吸动画暂时禁用，避免干扰骨骼动画
      // if (characterRef.current && characterRef.current.scale) {
      //   breathePhase.current += delta * 2
      //   const breatheScale = 1 + Math.sin(breathePhase.current) * 0.012
      //   characterRef.current.scale.y *= breatheScale
      // }
      
      // 智能自动眨眼系统
      if (vrmModel && vrmModel.expressionManager) {
        blinkPhase.current += delta
        
        // 基于动作的眨眼频率调整
        let blinkFrequency = 0.5 // 默认频率
        let blinkDuration = 150 // 默认持续时间
        
        switch (currentActionType) {
          case 'dance':
            blinkFrequency = 0.8 // 跳舞时眨眼更快
            blinkDuration = 100
            break
          case 'surprised':
          case 'jump':
            blinkFrequency = 0.1 // 惊讶时几乎不眨眼
            blinkDuration = 200
            break
          case 'sad':
            blinkFrequency = 0.3 // 悲伤时眨眼较慢
            blinkDuration = 250
            break
          case 'happy':
            blinkFrequency = 0.6 // 开心时眨眼较快
            blinkDuration = 120
            break
          default:
            blinkFrequency = 0.5
        }
        
        // 使用正弦波生成自然的眨眼节奏
        const blinkTrigger = Math.sin(blinkPhase.current * blinkFrequency)
        if (blinkTrigger > 0.985) {
          // 平滑的眨眼动画
          const startTime = Date.now()
          const animateBlink = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / (blinkDuration / 2), 1)
            
            if (progress < 0.5) {
              // 闭眼
              vrmModel.expressionManager.setValue('blink', progress * 2)
            } else {
              // 睁眼
              vrmModel.expressionManager.setValue('blink', 2 - progress * 2)
            }
            
            if (progress < 1) {
              requestAnimationFrame(animateBlink)
            } else {
              vrmModel.expressionManager.setValue('blink', 0)
            }
          }
          animateBlink()
        }
        
        // 随机眨眼增加自然感
        if (Math.random() < 0.001) {
          vrmModel.expressionManager.setValue('blink', 1)
          setTimeout(() => {
            if (vrmModel.expressionManager) {
              vrmModel.expressionManager.setValue('blink', 0)
            }
          }, 100)
        }
      }
      
      if (isTouching && characterRef.current) {
        characterRef.current.rotation.y += 0.02
      }
      
      // 视线追踪系统 - 让角色看向相机或鼠标位置
      // 在执行骨骼动画时禁用，避免冲突
      if (vrmModel && vrmModel.humanoid && isLookingAtCamera && !currentBoneAnimation.current) {
        try {
          // 平滑插值当前视线目标
          currentLookAt.current.lerp(lookAtTarget, lookAtSmoothness.current)
          
          // 获取头部骨骼
          const headBone = vrmModel.humanoid.getNormalizedBoneNode('head')
          if (headBone) {
            // 计算看向目标的方向
            const targetPos = currentLookAt.current.clone()
            const headPos = new THREE.Vector3()
            headBone.getWorldPosition(headPos)
            
            // 限制头部旋转角度
            const lookDirection = targetPos.sub(headPos).normalize()
            const yaw = Math.atan2(lookDirection.x, lookDirection.z)
            const pitch = Math.asin(lookDirection.y)
            
            // 限制角度范围
            const maxYaw = Math.PI / 4 // 45度
            const maxPitch = Math.PI / 6 // 30度
            
            const clampedYaw = Math.max(-maxYaw, Math.min(maxYaw, yaw))
            const clampedPitch = Math.max(-maxPitch, Math.min(maxPitch, pitch))
            
            // 平滑应用旋转
            headBone.rotation.y = THREE.MathUtils.lerp(headBone.rotation.y, clampedYaw, 0.1)
            headBone.rotation.x = THREE.MathUtils.lerp(headBone.rotation.x, -clampedPitch, 0.1)
          }
          
          // 脊柱也跟随轻微转动
          const spineBone = vrmModel.humanoid.getNormalizedBoneNode('spine')
          if (spineBone) {
            const spineYaw = Math.atan2(
              currentLookAt.current.x - characterRef.current.position.x,
              currentLookAt.current.z - characterRef.current.position.z
            ) * 0.3 // 脊柱转动幅度较小
            spineBone.rotation.y = THREE.MathUtils.lerp(spineBone.rotation.y, spineYaw, 0.05)
          }
        } catch (error) {
          // 忽略视线追踪错误
        }
      }
      
      // 物理模拟系统
      if (physicsEnabled && characterRef.current && currentActionType === 'jump') {
        // 应用重力
        if (!isGrounded.current) {
          velocity.current.y += gravity.current * delta
          characterRef.current.position.add(velocity.current.clone().multiplyScalar(delta))
          
          // 地面碰撞检测
          if (characterRef.current.position.y <= groundLevel.current) {
            characterRef.current.position.y = groundLevel.current
            velocity.current.y = 0
            isGrounded.current = true
            
            // 着陆效果
            setShowParticles(true)
            setTimeout(() => setShowParticles(false), 500)
          }
        }
      }
      
      // Q版变形系统 - 实时调整骨骼比例
      // 在执行骨骼动画时禁用，避免冲突
      if (vrmModel && vrmModel.humanoid && chibiMode && !currentBoneAnimation.current) {
        try {
          const headBone = vrmModel.humanoid.getNormalizedBoneNode('head')
          const neckBone = vrmModel.humanoid.getNormalizedBoneNode('neck')
          const chestBone = vrmModel.humanoid.getNormalizedBoneNode('chest')
          
          if (headBone) {
            // 头部放大1.3倍
            const targetHeadScale = chibiScale.current.head
            headBone.scale.setScalar(THREE.MathUtils.lerp(headBone.scale.x, targetHeadScale, 0.1))
          }
          
          if (neckBone) {
            // 脖子缩短
            neckBone.scale.y = THREE.MathUtils.lerp(neckBone.scale.y, 0.7, 0.1)
          }
          
          if (chestBone) {
            // 身体稍微缩小变圆
            chestBone.scale.x = THREE.MathUtils.lerp(chestBone.scale.x, 1.1, 0.1)
            chestBone.scale.z = THREE.MathUtils.lerp(chestBone.scale.z, 1.1, 0.1)
            chestBone.scale.y = THREE.MathUtils.lerp(chestBone.scale.y, 0.9, 0.1)
          }
          
          // 缩短四肢
          const leftUpperArm = vrmModel.humanoid.getNormalizedBoneNode('leftUpperArm')
          const rightUpperArm = vrmModel.humanoid.getNormalizedBoneNode('rightUpperArm')
          const leftLowerArm = vrmModel.humanoid.getNormalizedBoneNode('leftLowerArm')
          const rightLowerArm = vrmModel.humanoid.getNormalizedBoneNode('rightLowerArm')
          
          ;[leftUpperArm, rightUpperArm, leftLowerArm, rightLowerArm].forEach(bone => {
            if (bone) {
              bone.scale.y = THREE.MathUtils.lerp(bone.scale.y, chibiScale.current.limbs, 0.1)
            }
          })
        } catch (error) {
          // 忽略Q版变形错误
        }
      }
      
      // 弹性骨骼系统 - 果冻般柔软感
      if (springPhysicsEnabled && vrmModel && vrmModel.springBoneManager) {
        try {
          vrmModel.springBoneManager.update(delta * 2) // 加速模拟以获得更Q弹的效果
        } catch (error) {
          // 忽略弹性骨骼错误
        }
      }
      
      // 惯性跟随系统 - 头发衣服延迟跟随
      // 注意：只修改rotation，不修改position，避免身体部位分离
      if (followBones.current.length > 0 && characterRef.current) {
        followBones.current.forEach((boneData, index) => {
          if (boneData.bone && boneData.target) {
            const delay = boneData.delay || 0.1
            // 只修改rotation，不修改position
            boneData.bone.rotation.x = THREE.MathUtils.lerp(boneData.bone.rotation.x, boneData.target.rotation.x, delay)
            boneData.bone.rotation.y = THREE.MathUtils.lerp(boneData.bone.rotation.y, boneData.target.rotation.y, delay)
            boneData.bone.rotation.z = THREE.MathUtils.lerp(boneData.bone.rotation.z, boneData.target.rotation.z, delay)
          }
        })
      }
      
      // 呼吸起伏动画 - 胸部和肩膀自然起伏（仅在idle状态时轻微呼吸，且不在骨骼动画时）
      // 注意：只修改rotation，不修改position，避免身体部位分离
      if (vrmModel && vrmModel.humanoid && currentActionType === 'idle' && !currentBoneAnimation.current) {
        try {
          const chestBone = vrmModel.humanoid.getNormalizedBoneNode('chest')
          const leftShoulder = vrmModel.humanoid.getNormalizedBoneNode('leftShoulder')
          const rightShoulder = vrmModel.humanoid.getNormalizedBoneNode('rightShoulder')

          const breatheTime = Date.now() * 0.001
          const breatheIntensity = 0.005 // 减小呼吸幅度

          if (chestBone) {
            // 只修改rotation，不修改position
            chestBone.rotation.x = Math.sin(breatheTime * 2) * breatheIntensity * 0.3
          }

          if (leftShoulder) {
            // 只修改rotation，不修改position
            leftShoulder.rotation.z = Math.sin(breatheTime * 2 + 0.2) * breatheIntensity * 0.3
          }

          if (rightShoulder) {
            // 只修改rotation，不修改position
            rightShoulder.rotation.z = -Math.sin(breatheTime * 2 + 0.2) * breatheIntensity * 0.3
          }
        } catch (error) {
          // 忽略呼吸动画错误
        }
      }
      
      // 微动作系统 - 随机小动作增加生动感（仅在idle状态下，且不在骨骼动画时）
      if (microActionsEnabled && vrmModel && vrmModel.humanoid && currentActionType === 'idle' && !currentBoneAnimation.current) {
        const now = Date.now()
        if (now - lastMicroActionTime.current > microActionInterval.current) {
          lastMicroActionTime.current = now
          microActionInterval.current = 4000 + Math.random() * 6000 // 4-10秒随机间隔，减少频率
          
          // 随机选择微动作
          const microActions = ['earWiggle', 'headTilt', 'shoulderShrug', 'weightShift']
          const randomAction = microActions[Math.floor(Math.random() * microActions.length)]
          
          try {
            switch (randomAction) {
              case 'earWiggle':
                // 耳朵抖动（如果有）
                if (earBones.current.length > 0) {
                  earBones.current.forEach(ear => {
                    if (ear) {
                      ear.rotation.z = Math.sin(Date.now() * 0.02) * 0.05 // 减小幅度
                    }
                  })
                }
                break
              case 'headTilt':
                // 头部轻微倾斜
                const head = vrmModel.humanoid.getNormalizedBoneNode('head')
                if (head) {
                  head.rotation.z = (Math.random() - 0.5) * 0.05 // 减小幅度
                  setTimeout(() => {
                    if (head) head.rotation.z = 0
                  }, 1000)
                }
                break
              case 'shoulderShrug':
                // 耸肩 - 只修改rotation，不修改position
                const leftShoulder = vrmModel.humanoid.getNormalizedBoneNode('leftShoulder')
                const rightShoulder = vrmModel.humanoid.getNormalizedBoneNode('rightShoulder')
                if (leftShoulder && rightShoulder) {
                  leftShoulder.rotation.z = 0.1
                  rightShoulder.rotation.z = -0.1
                  setTimeout(() => {
                    if (leftShoulder) leftShoulder.rotation.z = 0
                    if (rightShoulder) rightShoulder.rotation.z = 0
                  }, 500)
                }
                break
              case 'weightShift':
                // 重心转移 - 只修改rotation，不修改position
                const hips = vrmModel.humanoid.getNormalizedBoneNode('hips')
                if (hips) {
                  hips.rotation.z = Math.sin(Date.now() * 0.001) * 0.02
                }
                break
            }
          } catch (error) {
            // 忽略微动作错误
          }
        }
      }
      
      // 口型同步系统
      if (lipSyncEnabled && vrmModel && vrmModel.expressionManager) {
        // 根据动作类型调整口型
        let targetLipValue = 0
        switch (currentActionType) {
          case 'happy':
          case 'dance':
            targetLipValue = 0.3 + Math.sin(Date.now() * 0.01) * 0.2
            break
          case 'sad':
            targetLipValue = 0.1
            break
          case 'surprised':
          case 'jump':
            targetLipValue = 0.6
            break
          default:
            targetLipValue = 0
        }
        
        lipSyncValue.current = THREE.MathUtils.lerp(lipSyncValue.current, targetLipValue, 0.1)
        
        try {
          vrmModel.expressionManager.setValue('aa', lipSyncValue.current)
        } catch (error) {
          // 忽略口型同步错误
        }
      }
      
      // 耳朵尾巴物理模拟
      if (earBones.current.length > 0 || tailBones.current.length > 0) {
        const time = Date.now() * 0.001
        
        earBones.current.forEach((ear, index) => {
          if (ear) {
            // 耳朵根据动作摆动
            const swayAmount = currentActionType === 'happy' ? 0.15 : 0.05
            const swaySpeed = currentActionType === 'dance' ? 8 : 3
            ear.rotation.z = Math.sin(time * swaySpeed + index) * swayAmount
            ear.rotation.x = Math.cos(time * swaySpeed * 0.7) * swayAmount * 0.5
          }
        })
        
        tailBones.current.forEach((tail, index) => {
          if (tail) {
            // 尾巴摆动
            const tailSway = currentActionType === 'happy' ? 0.3 : 0.1
            tail.rotation.y = Math.sin(time * 4 + index * 0.5) * tailSway
            tail.rotation.x = Math.sin(time * 3) * tailSway * 0.3
          }
        })
      }
      
      // 性能监控系统
      frameCount.current++
      const currentTime = Date.now()
      if (currentTime - lastTime.current >= 1000) {
        setFps(frameCount.current)
        frameCount.current = 0
        lastTime.current = currentTime
        
        // 内存使用监控
        if (performance && performance.memory) {
          setMemoryUsage(Math.round(performance.memory.usedJSHeapSize / 1048576))
        }
      }
    } catch (error) {
      console.error('动画更新失败:', error)
    }
  })

  return (
    <>
      <ambientLight ref={ambientLightRef} intensity={0.5} />
      <directionalLight ref={directionalLightRef} position={[5, 10, 7.5]} intensity={1.0} castShadow />
      <pointLight ref={pointLightRef} position={[-5, 5, 5]} intensity={0.6} color="#ffecd2" />
      <pointLight position={[0, -5, 5]} intensity={0.3} color="#fcb69f" />
      
      <DynamicBackground actionType={currentActionType} />
      <ParticleSystem 
        active={showParticles} 
        type={currentActionType} 
        position={characterRef?.current?.position || [0, 0, 0]} 
      />
      <ExpressionSystem vrmModel={vrmModel} actionType={currentActionType} />
      
      {/* 骨骼编辑器 */}
      <BoneEditor 
        vrmModel={vrmModel} 
        isEditing={isBoneEditing} 
        onBoneChange={onBoneChange}
        isMobile={isMobile}
      />
      
      {touchFeedback.show && (
        <mesh position={[touchFeedback.x * 0.01, touchFeedback.y * 0.01, 2]}>
          <ringGeometry args={[0.3, 0.4, 32]} />
          <meshBasicMaterial color="white" transparent opacity={0.5} />
        </mesh>
      )}
      
      {/* 加载进度条 */}
      {isLoading && (
        <Html 
          center
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            padding: isMobile ? '20px 24px' : '24px 32px',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
            borderRadius: '16px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(255, 107, 157, 0.3)',
            backdropFilter: 'blur(20px)',
            minWidth: isMobile ? '200px' : '280px'
          }}>
            <div style={{
              fontSize: isMobile ? '14px' : '18px',
              fontWeight: '700',
              color: 'white',
              marginBottom: '4px',
              textAlign: 'center'
            }}>
              🎭 加载模型中...
            </div>
            
            {/* 进度条容器 */}
            <div style={{
              width: isMobile ? '160px' : '240px',
              height: '10px',
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '5px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{
                width: `${loadingProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #ff6b9d 0%, #c44569 50%, #ff6b9d 100%)',
                borderRadius: '5px',
                transition: 'width 0.3s ease-out',
                boxShadow: '0 0 15px rgba(255, 107, 157, 0.6)'
              }} />
            </div>
            
            {/* 进度百分比 */}
            <div style={{
              fontSize: isMobile ? '16px' : '20px',
              fontWeight: 'bold',
              color: '#ff6b9d',
              textShadow: '0 0 10px rgba(255, 107, 157, 0.5)'
            }}>
              {loadingProgress.toFixed(0)}%
            </div>
            
            {/* 加载动画 */}
            <div style={{
              display: 'flex',
              gap: '6px',
              marginTop: '8px'
            }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
                    animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
                    boxShadow: '0 0 10px rgba(255, 107, 157, 0.5)'
                  }}
                />
              ))}
            </div>
          </div>
          
          <style>{`
            @keyframes bounce {
              0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
              40% { transform: scale(1); opacity: 1; }
          `}</style>
        </Html>
      )}
    </>
  )
}

const CharacterController = ({ position = [0, 0, 0], rotation = [0, 0, 0], selectedFile = null, onSwing = null, isBoneEditing = false, onBoneChange = null }) => {
  return (
    <group>
      <CharacterSystem 
        position={position} 
        rotation={rotation} 
        selectedFile={selectedFile} 
        onSwing={onSwing}
        isBoneEditing={isBoneEditing}
        onBoneChange={onBoneChange}
      />
    </group>
  )
}

export default CharacterSystem
export { CharacterController }
