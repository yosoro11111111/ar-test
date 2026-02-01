import React, { useRef, useEffect, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Html, TransformControls } from '@react-three/drei'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRM, VRMLoaderPlugin, VRMHumanBoneName } from '@pixiv/three-vrm'
import { DragControls } from 'three/examples/jsm/controls/DragControls'
import { actionAnimations250, getActionAnimation, easingFunctions, poseLibrary } from '../data/actionAnimations250'
import { poseBoneData } from '../data/poseBoneData'
import { interpolateKeyframes } from '../data/mmdActions'

// MMD骨骼名称到VRM标准骨骼名称的映射
const MMD_TO_VRM_BONE_MAP = {
  // 核心骨骼
  hips: 'hips',
  spine: 'spine',
  chest: 'chest',
  upperChest: 'upperChest',
  neck: 'neck',
  head: 'head',
  
  // 左臂
  leftShoulder: 'leftShoulder',
  leftUpperArm: 'leftUpperArm',
  leftLowerArm: 'leftLowerArm',
  leftHand: 'leftHand',
  
  // 右臂
  rightShoulder: 'rightShoulder',
  rightUpperArm: 'rightUpperArm',
  rightLowerArm: 'rightLowerArm',
  rightHand: 'rightHand',
  
  // 左腿
  leftUpperLeg: 'leftUpperLeg',
  leftLowerLeg: 'leftLowerLeg',
  leftFoot: 'leftFoot',
  leftToes: 'leftToes',
  
  // 右腿
  rightUpperLeg: 'rightUpperLeg',
  rightLowerLeg: 'rightLowerLeg',
  rightFoot: 'rightFoot',
  rightToes: 'rightToes',
  
  // 手指（简化）
  leftThumbProximal: 'leftThumbProximal',
  leftThumbIntermediate: 'leftThumbIntermediate',
  leftThumbDistal: 'leftThumbDistal',
  leftIndexProximal: 'leftIndexProximal',
  leftIndexIntermediate: 'leftIndexIntermediate',
  leftIndexDistal: 'leftIndexDistal',
  leftMiddleProximal: 'leftMiddleProximal',
  leftMiddleIntermediate: 'leftMiddleIntermediate',
  leftMiddleDistal: 'leftMiddleDistal',
  leftRingProximal: 'leftRingProximal',
  leftRingIntermediate: 'leftRingIntermediate',
  leftRingDistal: 'leftRingDistal',
  leftLittleProximal: 'leftLittleProximal',
  leftLittleIntermediate: 'leftLittleIntermediate',
  leftLittleDistal: 'leftLittleDistal',
  
  rightThumbProximal: 'rightThumbProximal',
  rightThumbIntermediate: 'rightThumbIntermediate',
  rightThumbDistal: 'rightThumbDistal',
  rightIndexProximal: 'rightIndexProximal',
  rightIndexIntermediate: 'rightIndexIntermediate',
  rightIndexDistal: 'rightIndexDistal',
  rightMiddleProximal: 'rightMiddleProximal',
  rightMiddleIntermediate: 'rightMiddleIntermediate',
  rightMiddleDistal: 'rightMiddleDistal',
  rightRingProximal: 'rightRingProximal',
  rightRingIntermediate: 'rightRingIntermediate',
  rightRingDistal: 'rightRingDistal',
  rightLittleProximal: 'rightLittleProximal',
  rightLittleIntermediate: 'rightLittleIntermediate',
  rightLittleDistal: 'rightLittleDistal'
}

// ==================== 骨骼约束配置 ====================
// 限制骨骼的旋转范围，防止不自然的动作 - 大幅增加限制范围以支持MMD动作
const BONE_CONSTRAINTS = {
  // 头部
  head: { minX: -1.5, maxX: 1.5, minY: -2.0, maxY: 2.0, minZ: -1.0, maxZ: 1.0 },
  neck: { minX: -1.2, maxX: 1.2, minY: -1.5, maxY: 1.5, minZ: -0.8, maxZ: 0.8 },
  
  // 脊柱
  spine: { minX: -1.0, maxX: 1.0, minY: -1.5, maxY: 1.5, minZ: -0.8, maxZ: 0.8 },
  chest: { minX: -0.8, maxX: 0.8, minY: -1.0, maxY: 1.0, minZ: -0.5, maxZ: 0.5 },
  
  // 手臂 - 大幅增加活动范围
  leftShoulder: { minX: -2.0, maxX: 2.0, minY: -1.5, maxY: 1.5, minZ: -1.0, maxZ: 1.0 },
  leftUpperArm: { minX: -4.0, maxX: 4.0, minY: -4.0, maxY: 4.0, minZ: -3.0, maxZ: 3.0 },
  leftLowerArm: { minX: -3.0, maxX: 0.5, minY: -1.5, maxY: 1.5, minZ: -1.5, maxZ: 1.5 },
  leftHand: { minX: -1.5, maxX: 1.5, minY: -1.5, maxY: 1.5, minZ: -1.5, maxZ: 1.5 },
  
  rightShoulder: { minX: -2.0, maxX: 2.0, minY: -1.5, maxY: 1.5, minZ: -1.0, maxZ: 1.0 },
  rightUpperArm: { minX: -4.0, maxX: 4.0, minY: -4.0, maxY: 4.0, minZ: -3.0, maxZ: 3.0 },
  rightLowerArm: { minX: -3.0, maxX: 0.5, minY: -1.5, maxY: 1.5, minZ: -1.5, maxZ: 1.5 },
  rightHand: { minX: -1.5, maxX: 1.5, minY: -1.5, maxY: 1.5, minZ: -1.5, maxZ: 1.5 },
  
  // 腿部 - 大幅增加活动范围
  leftUpperLeg: { minX: -3.0, maxX: 2.0, minY: -2.0, maxY: 2.0, minZ: -1.5, maxZ: 1.5 },
  leftLowerLeg: { minX: -0.5, maxX: 3.0, minY: -1.0, maxY: 1.0, minZ: -1.0, maxZ: 1.0 },
  leftFoot: { minX: -1.5, maxX: 1.5, minY: -1.0, maxY: 1.0, minZ: -1.0, maxZ: 1.0 },
  
  rightUpperLeg: { minX: -3.0, maxX: 2.0, minY: -2.0, maxY: 2.0, minZ: -1.5, maxZ: 1.5 },
  rightLowerLeg: { minX: -0.5, maxX: 3.0, minY: -1.0, maxY: 1.0, minZ: -1.0, maxZ: 1.0 },
  rightFoot: { minX: -1.5, maxX: 1.5, minY: -1.0, maxY: 1.0, minZ: -1.0, maxZ: 1.0 },
  
  // 臀部 - 大幅增加活动范围
  hips: { minX: -1.0, maxX: 1.0, minY: -4.0, maxY: 4.0, minZ: -1.0, maxZ: 1.0 }
}

// 应用骨骼约束
function applyBoneConstraints(boneName, rotation) {
  const constraints = BONE_CONSTRAINTS[boneName]
  if (!constraints) return rotation
  
  return [
    Math.max(constraints.minX, Math.min(constraints.maxX, rotation[0])),
    Math.max(constraints.minY, Math.min(constraints.maxY, rotation[1])),
    Math.max(constraints.minZ, Math.min(constraints.maxZ, rotation[2]))
  ]
}

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
      
      {/* 移动端控制面板 - 已移至 ARSystem.jsx 中渲染 */}
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

const CharacterSystem = ({ index = 0, position = [0, 0, 0], rotation = [0, 0, 0], selectedFile = null, onSwing = null, isBoneEditing = false, onBoneChange = null, scale: externalScale = 1.0, actionIntensity: externalActionIntensity = 1.0, opacity: externalOpacity = 1.0, mmdCurrentAction = null, mmdActionStartTime = 0, isInteractMode = false, onInteract = null }) => {
  const { isMobile } = useMobileDetect()
  const { scene, gl, camera, clock } = useThree()
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
  const [scale, setScale] = useState(externalScale)
  const [isDragging, setIsDragging] = useState(false)
  const [initialPosition, setInitialPosition] = useState([0, 0, 0])
  const [currentActionType, setCurrentActionType] = useState('idle')
  // MMD动作基础位置偏移 - 保存角色当前位置作为基础
  const mmdBasePosition = useRef(position)
  const mmdInitialHipsPosition = useRef(null)
  const mmdPreviousAction = useRef(null)
  const mmdInitialBoneRotations = useRef(new Map())
  // 骨骼查找缓存 - 避免每帧都查找骨骼
  const boneCache = useRef(new Map())
  const lastCacheClearTime = useRef(0)
  // 动画平滑滤波 - 减少抖动（减少到5帧历史）
  const boneRotationHistory = useRef(new Map())
  const bonePositionHistory = useRef(new Map())
  const HISTORY_LENGTH = 5 // 减少到5帧，平衡平滑度和灵敏度
  // 物理惯性模拟
  const boneVelocities = useRef(new Map())
  const boneLastRotations = useRef(new Map())
  // 动画混合权重
  const blendWeight = useRef(1.0)
  const targetBlendWeight = useRef(1.0)
  // 低通滤波器系数（0-1，越大越平滑但延迟越高）
  const SMOOTHING_FACTOR = 0.4
  const [showParticles, setShowParticles] = useState(false)
  const [actionIntensity, setActionIntensity] = useState(externalActionIntensity)
  const [opacity, setOpacity] = useState(externalOpacity)
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
  const [currentLoadedFile, setCurrentLoadedFile] = useState(null)
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

  // 监听外部 scale 变化
  useEffect(() => {
    setScale(externalScale)
    if (characterRef.current && optimalScale) {
      const finalScale = optimalScale * externalScale
      characterRef.current.scale.set(finalScale, finalScale, finalScale)
    }
  }, [externalScale, optimalScale])

  // 监听外部 actionIntensity 变化
  useEffect(() => {
    setActionIntensity(externalActionIntensity)
  }, [externalActionIntensity])

  // 监听MMD动作变化
  useEffect(() => {
    if (mmdCurrentAction) {
      console.log('🎯 CharacterSystem 收到MMD动作:', mmdCurrentAction.name, 'ID:', mmdCurrentAction.id)
      console.log('⏰ 动作开始时间:', mmdActionStartTime)
    } else {
      console.log('🎯 CharacterSystem MMD动作已清除')
    }
  }, [mmdCurrentAction, mmdActionStartTime])

  // 监听角色旋转事件
  useEffect(() => {
    const handleRotateCharacter = (e) => {
      const { index: targetIndex, angle } = e.detail
      if (targetIndex === index && characterRef.current) {
        // 应用旋转
        characterRef.current.rotation.y = angle
        console.log(`🔄 角色${index} 旋转到 ${(angle * 180 / Math.PI).toFixed(0)}度`)
      }
    }
    
    window.addEventListener('rotateCharacter', handleRotateCharacter)
    return () => window.removeEventListener('rotateCharacter', handleRotateCharacter)
  }, [index])

  useEffect(() => {
    if (selectedFile) {
      // 检查是否已经加载了相同的文件，避免重复加载
      const fileIdentifier = selectedFile.name || selectedFile.localPath || selectedFile
      const currentFileIdentifier = currentLoadedFile?.name || currentLoadedFile?.localPath || currentLoadedFile
      
      if (fileIdentifier !== currentFileIdentifier) {
        loadVRMModel(selectedFile)
        setCurrentLoadedFile(selectedFile)
      } else {
        console.log('模型文件已加载，跳过重复加载:', fileIdentifier)
      }
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
          console.log('准备加载新模型，清理之前的模型引用')
          // 由于模型现在通过React Three Fiber渲染，不需要从场景中移除
          // 只需要清理引用即可
        } catch (error) {
          console.error('清理模型失败:', error)
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
              
              // 调试：输出所有可用的骨骼名称
              if (vrm.humanoid) {
                console.log('=== VRM骨骼名称列表 ===')
                console.log('VRMHumanBoneName:', VRMHumanBoneName)
                const humanBones = vrm.humanoid.humanBones
                if (humanBones) {
                  Object.entries(humanBones).forEach(([key, value]) => {
                    console.log(`骨骼: ${key} -> ${value?.node?.name || 'no node'}`)
                  })
                }
                console.log('=== 骨骼名称列表结束 ===')
              }
              
              setVrmModel(vrm)
              
              // 将 vrm 模型暴露到 window，供移动端骨骼编辑器使用
              window.vrmModels = window.vrmModels || {}
              // 使用文件名作为 key，确保 MobileBoneEditor 可以通过 character.path 找到
              const modelKey = file.name || file.localPath || selectedFile
              window.vrmModels[modelKey] = vrm
              console.log('VRM 模型已暴露到 window.vrmModels:', modelKey)
              
              vrm.scene.position.set(0, 0, 0)
              vrm.scene.rotation.set(0, Math.PI, 0) // 旋转180度，让模型面对用户
              vrm.scene.scale.set(1, 1, 1)
              
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
      console.log('VRM人形骨骼存在，设置初始姿态 - 自然站立并看向镜头')
      
      // 使用优化的idle姿势作为初始姿态
      const initialPose = {
        head: { x: 0.05, y: 0, z: 0 },
        neck: { x: 0.02, y: 0, z: 0 },
        leftUpperArm: { x: 0.1, y: 0, z: 0.15 },
        rightUpperArm: { x: 0.1, y: 0, z: -0.15 },
        leftLowerArm: { x: 0.15, y: 0, z: 0 },
        rightLowerArm: { x: 0.15, y: 0, z: 0 },
        leftHand: { x: 0, y: 0, z: 0 },
        rightHand: { x: 0, y: 0, z: 0 },
        spine: { x: 0.02, y: 0, z: 0 },
        chest: { x: 0.03, y: 0, z: 0 },
        hips: { x: 0, y: 0, z: 0 },
        leftUpperLeg: { x: -0.05, y: 0, z: 0 },
        rightUpperLeg: { x: -0.05, y: 0, z: 0 },
        leftLowerLeg: { x: 0.1, y: 0, z: 0 },
        rightLowerLeg: { x: 0.1, y: 0, z: 0 },
        leftFoot: { x: 0.05, y: 0, z: 0 },
        rightFoot: { x: 0.05, y: 0, z: 0 },
        leftShoulder: { x: 0, y: 0, z: 0 },
        rightShoulder: { x: 0, y: 0, z: 0 }
      }
      
      // 应用初始姿势到骨骼
      Object.entries(initialPose).forEach(([boneName, rotation]) => {
        const bone = vrm.humanoid.getNormalizedBoneNode(boneName)
        if (bone) {
          bone.rotation.set(rotation.x, rotation.y, rotation.z)
        }
      })
      
      // 设置表情为自然微笑
      if (vrm.expressionManager) {
        try {
          vrm.expressionManager.setValue('neutral', 0.8)
          vrm.expressionManager.setValue('happy', 0.2)
          console.log('✅ 表情设置成功')
        } catch (e) {
          console.warn('⚠️ 表情设置失败:', e.message)
        }
      } else {
        console.log('ℹ️ VRM模型没有expressionManager，跳过表情设置')
      }
      
      vrm.scene.updateMatrixWorld(true)
      
      console.log('初始姿态设置完成 - 角色自然站立并看向用户')
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
      const bone = vrmModel.humanoid.getNormalizedBoneNode(boneName)
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
      duration: 2000,
      loop: true, // 保持坐姿循环
      keyframes: [
        { time: 0, pose: 'idle' },
        { time: 0.2, pose: 'crouchDeep' },
        { time: 0.5, pose: 'sitPose' },
        { time: 1, pose: 'sitPose' }
      ]
    },
    lie: {
      duration: 2000,
      loop: true,
      keyframes: [
        { time: 0, pose: 'idle' },
        { time: 0.3, pose: 'crouchDeep' },
        { time: 0.6, pose: 'liePose' },
        { time: 1, pose: 'liePose' }
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
  
  // 姿势定义 - 优化版（基于VRM标准骨骼结构）
  // 注意：VRM骨骼旋转使用弧度，范围通常在 -PI 到 PI 之间
  // x: 俯仰（前后倾斜），y: 偏航（左右转动），z: 翻滚（左右倾斜）
  const poses = {
    // 待机姿势 - 自然放松站立
    idle: {
      spine: { x: 0.02, y: 0, z: 0 },           // 脊柱轻微前倾
      chest: { x: 0.03, y: 0, z: 0 },           // 胸部轻微挺起
      head: { x: 0.05, y: 0, z: 0 },            // 头部轻微前倾看镜头
      neck: { x: 0.02, y: 0, z: 0 },            // 颈部自然
      leftUpperArm: { x: 0.1, y: 0, z: 0.15 },  // 手臂自然下垂，稍微外展
      rightUpperArm: { x: 0.1, y: 0, z: -0.15 },
      leftLowerArm: { x: 0.15, y: 0, z: 0 },    // 前臂轻微弯曲
      rightLowerArm: { x: 0.15, y: 0, z: 0 },
      leftHand: { x: 0, y: 0, z: 0 },
      rightHand: { x: 0, y: 0, z: 0 },
      leftUpperLeg: { x: -0.05, y: 0, z: 0 },   // 腿部几乎伸直
      rightUpperLeg: { x: -0.05, y: 0, z: 0 },
      leftLowerLeg: { x: 0.1, y: 0, z: 0 },     // 膝盖轻微弯曲
      rightLowerLeg: { x: 0.1, y: 0, z: 0 },
      leftFoot: { x: 0.05, y: 0, z: 0 },        // 脚自然放置
      rightFoot: { x: 0.05, y: 0, z: 0 }
    },
    // 拿书动作姿势 - 优化幅度
    reachUpStart: {
      spine: { x: -0.1, y: 0, z: 0 },           // 脊柱轻微后仰
      chest: { x: -0.05, y: 0, z: 0 },
      rightUpperArm: { x: -1.2, y: 0.3, z: -0.3 }, // 手臂抬起（约70度）
      rightLowerArm: { x: -0.3, y: 0, z: 0 },   // 前臂轻微弯曲
      head: { x: -0.15, y: 0, z: 0 }            // 抬头看
    },
    reachUpHigh: {
      spine: { x: -0.15, y: 0, z: 0 },
      chest: { x: -0.08, y: 0, z: 0 },
      rightUpperArm: { x: -2.0, y: 0.4, z: -0.2 }, // 手臂高举（约115度）
      rightLowerArm: { x: -0.2, y: 0, z: 0 },
      head: { x: -0.2, y: 0, z: 0 }
    },
    grabBook: {
      spine: { x: -0.1, y: 0, z: 0 },
      rightUpperArm: { x: -1.8, y: 0.2, z: -0.2 },
      rightLowerArm: { x: -0.4, y: 0, z: 0 },
      rightHand: { x: 0, y: 0, z: -0.2 }        // 手腕轻微弯曲
    },
    pullBook: {
      spine: { x: -0.05, y: 0, z: 0 },
      rightUpperArm: { x: -1.0, y: 0, z: -0.3 },
      rightLowerArm: { x: -0.8, y: 0, z: 0 },
      head: { x: 0, y: 0.15, z: 0 }             // 轻微转头
    },
    holdBook: {
      spine: { x: 0, y: 0, z: 0 },
      rightUpperArm: { x: -0.3, y: 0, z: -0.4 }, // 手臂前伸持书
      rightLowerArm: { x: -0.8, y: 0, z: 0 },
      leftUpperArm: { x: -0.2, y: 0, z: 0.4 },  // 另一只手辅助
      leftLowerArm: { x: -0.6, y: 0, z: 0 }
    },
    // 翻跟头姿势 - 优化幅度
    crouch: {
      hips: { x: 0.3, y: 0, z: 0 },             // 臀部下沉（通过旋转而非位移）
      leftUpperLeg: { x: -0.8, y: 0, z: 0 },    // 大腿抬起（约45度）
      rightUpperLeg: { x: -0.8, y: 0, z: 0 },
      leftLowerLeg: { x: 1.2, y: 0, z: 0 },     // 小腿弯曲（约70度）
      rightLowerLeg: { x: 1.2, y: 0, z: 0 },
      spine: { x: 0.2, y: 0, z: 0 }             // 脊柱前倾
    },
    jumpBack: {
      hips: { x: 0.3, y: 0, z: 0 },
      leftUpperLeg: { x: -0.5, y: 0, z: 0 },
      rightUpperLeg: { x: -0.5, y: 0, z: 0 },
      spine: { x: -0.3, y: 0, z: 0 }
    },
    tuck: {
      hips: { x: 0.8, y: 0, z: 0 },             // 身体蜷缩
      leftUpperLeg: { x: -1.3, y: 0, z: 0 },    // 大腿抬起（约75度）
      rightUpperLeg: { x: -1.3, y: 0, z: 0 },
      leftLowerLeg: { x: 1.5, y: 0, z: 0 },     // 小腿弯曲（约85度）
      rightLowerLeg: { x: 1.5, y: 0, z: 0 },
      leftUpperArm: { x: 0, y: 0, z: 1.2 },     // 手臂环抱（约70度）
      rightUpperArm: { x: 0, y: 0, z: -1.2 },
      spine: { x: 0.3, y: 0, z: 0 }
    },
    unfold: {
      hips: { x: 0.2, y: 0, z: 0 },
      leftUpperLeg: { x: -0.3, y: 0, z: 0 },
      rightUpperLeg: { x: -0.3, y: 0, z: 0 },
      spine: { x: -0.1, y: 0, z: 0 }
    },
    land: {
      hips: { x: 0.1, y: 0, z: 0 },
      leftUpperLeg: { x: -0.5, y: 0, z: 0 },
      rightUpperLeg: { x: -0.5, y: 0, z: 0 },
      leftLowerLeg: { x: 0.8, y: 0, z: 0 },
      rightLowerLeg: { x: 0.8, y: 0, z: 0 }
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
    // 日常姿势 - 优化版
    sitPose: {
      // 坐姿：通过旋转模拟坐下，而不是直接位移hips
      hips: { x: -0.8, y: 0, z: 0 },            // 臀部向后旋转（约45度）
      leftUpperLeg: { x: -1.0, y: 0, z: 0.05 }, // 大腿抬起（约57度）
      rightUpperLeg: { x: -1.0, y: 0, z: -0.05 },
      leftLowerLeg: { x: 1.0, y: 0, z: 0 },     // 小腿弯曲（约57度）
      rightLowerLeg: { x: 1.0, y: 0, z: 0 },
      leftFoot: { x: 0.2, y: 0, z: 0 },         // 脚自然放置
      rightFoot: { x: 0.2, y: 0, z: 0 },
      spine: { x: 0.15, y: 0, z: 0 },           // 脊柱稍微前倾
      chest: { x: 0.05, y: 0, z: 0 },
      leftUpperArm: { x: 0.3, y: 0, z: 0.2 },   // 手臂自然放在腿上
      rightUpperArm: { x: 0.3, y: 0, z: -0.2 },
      leftLowerArm: { x: 0.4, y: 0, z: 0 },
      rightLowerArm: { x: 0.4, y: 0, z: 0 }
    },
    // 躺姿 - 优化版
    liePose: {
      hips: { x: -1.4, y: 0, z: 0 },            // 臀部几乎平躺（约80度）
      spine: { x: 0.1, y: 0, z: 0 },            // 脊柱稍微弯曲
      chest: { x: 0.05, y: 0, z: 0 },
      head: { x: 0.1, y: 0, z: 0 },             // 头部稍微抬起
      neck: { x: 0.05, y: 0, z: 0 },
      leftUpperLeg: { x: -0.2, y: 0, z: 0.1 },  // 大腿几乎伸直
      rightUpperLeg: { x: -0.2, y: 0, z: -0.1 },
      leftLowerLeg: { x: 0.3, y: 0, z: 0 },     // 小腿轻微弯曲
      rightLowerLeg: { x: 0.3, y: 0, z: 0 },
      leftFoot: { x: 0.1, y: 0, z: 0 },
      rightFoot: { x: 0.1, y: 0, z: 0 },
      leftUpperArm: { x: 0, y: 0, z: 0.4 },     // 手臂自然放在身体两侧
      rightUpperArm: { x: 0, y: 0, z: -0.4 },
      leftLowerArm: { x: 0.2, y: 0, z: 0 },
      rightLowerArm: { x: 0.2, y: 0, z: 0 }
    },
    // 吃饭姿势 - 优化幅度
    eatStart: {
      rightUpperArm: { x: -0.8, y: 0.2, z: -0.3 }, // 手臂抬起（约45度）
      rightLowerArm: { x: -0.8, y: 0, z: 0 },      // 前臂弯曲（约45度）
      head: { x: -0.05, y: 0, z: 0 },              // 轻微低头
      spine: { x: 0.05, y: 0, z: 0 }
    },
    eatBite: {
      rightUpperArm: { x: -0.7, y: 0.2, z: -0.2 },
      rightLowerArm: { x: -1.2, y: 0, z: 0 },      // 前臂更多弯曲（约70度）
      head: { x: 0.05, y: 0, z: 0 },               // 轻微抬头
      spine: { x: 0.02, y: 0, z: 0 }
    },
    eatChew: {
      rightUpperArm: { x: -0.5, y: 0.1, z: -0.3 },
      rightLowerArm: { x: -0.6, y: 0, z: 0 },
      head: { x: 0.02, y: 0, z: 0 },
      spine: { x: 0.03, y: 0, z: 0 }
    },
    // 阅读姿势 - 优化
    readPose: {
      spine: { x: -0.1, y: 0, z: 0 },              // 轻微前倾
      chest: { x: -0.05, y: 0, z: 0 },
      head: { x: -0.15, y: 0, z: 0 },              // 低头看书（约8度）
      neck: { x: -0.1, y: 0, z: 0 },
      leftUpperArm: { x: -0.3, y: 0.2, z: 0.4 },   // 手臂前伸持书
      rightUpperArm: { x: -0.3, y: -0.2, z: -0.4 },
      leftLowerArm: { x: -0.6, y: 0, z: 0 },
      rightLowerArm: { x: -0.6, y: 0, z: 0 }
    },
    // 唱歌姿势 - 优化
    singPose: {
      spine: { x: -0.05, y: 0, z: 0 },
      chest: { x: 0.1, y: 0, z: 0 },               // 挺胸
      head: { x: -0.1, y: 0, z: 0 },               // 稍微抬头
      neck: { x: -0.05, y: 0, z: 0 },
      leftUpperArm: { x: -0.6, y: 0, z: 0.3 },     // 一只手拿麦克风
      rightUpperArm: { x: -1.0, y: 0, z: -0.3 },   // 另一只手自然
      rightLowerArm: { x: -0.4, y: 0, z: 0 }
    },
    // 拍照姿势 - 优化
    photoPose: {
      rightUpperArm: { x: -0.8, y: 0, z: -0.5 },   // 手臂抬起拿相机
      rightLowerArm: { x: -0.6, y: 0, z: 0 },
      rightHand: { x: 0, y: 0, z: 0 },
      head: { x: -0.05, y: -0.1, z: 0 },           // 轻微歪头
      spine: { x: 0, y: 0.05, z: 0 },              // 轻微转身
      leftUpperArm: { x: 0.1, y: 0, z: 0.2 }       // 另一只手自然
    },
    // 攻击姿势 - 优化幅度
    attackPose: {
      leftUpperArm: { x: -1.0, y: 0.3, z: 0.3 },   // 手臂前伸（约57度）
      rightUpperArm: { x: -1.0, y: -0.3, z: -0.3 },
      leftLowerArm: { x: -0.8, y: 0, z: 0 },       // 前臂弯曲（约45度）
      rightLowerArm: { x: -0.8, y: 0, z: 0 },
      spine: { x: -0.1, y: 0, z: 0 },              // 身体前倾
      hips: { x: 0.1, y: 0, z: 0 },
      leftUpperLeg: { x: -0.2, y: 0, z: 0 },       // 腿部稳定
      rightUpperLeg: { x: -0.3, y: 0, z: 0 }
    },
    // 防御姿势 - 优化
    defendPose: {
      leftUpperArm: { x: -0.4, y: 0.3, z: 0.8 },   // 手臂交叉防御
      rightUpperArm: { x: -0.4, y: -0.3, z: -0.8 },
      leftLowerArm: { x: -0.8, y: 0, z: 0 },
      rightLowerArm: { x: -0.8, y: 0, z: 0 },
      spine: { x: -0.05, y: 0, z: 0 },
      head: { x: 0.05, y: 0, z: 0 }                // 稍微低头
    },
    // 魔法姿势 - 优化
    magicPose: {
      leftUpperArm: { x: -1.2, y: 0.3, z: 0.2 },   // 手臂举起（约70度）
      rightUpperArm: { x: -1.2, y: -0.3, z: -0.2 },
      leftLowerArm: { x: -0.3, y: 0, z: 0 },       // 前臂轻微弯曲
      rightLowerArm: { x: -0.3, y: 0, z: 0 },
      spine: { x: -0.05, y: 0, z: 0 },
      head: { x: -0.1, y: 0, z: 0 },               // 稍微抬头
      chest: { x: 0.05, y: 0, z: 0 }
    },
    magicCast: {
      leftUpperArm: { x: -1.5, y: 0.2, z: 0.3 },   // 手臂高举（约86度）
      rightUpperArm: { x: -1.5, y: -0.2, z: -0.3 },
      leftLowerArm: { x: -0.2, y: 0, z: 0 },
      rightLowerArm: { x: -0.2, y: 0, z: 0 },
      spine: { x: -0.1, y: 0, z: 0 },
      head: { x: -0.15, y: 0, z: 0 },
      chest: { x: 0.08, y: 0, z: 0 }
    },
    // 思考姿势 - 优化
    thinkPose: {
      rightUpperArm: { x: -0.8, y: 0, z: -0.4 },   // 手臂抬起（约45度）
      rightLowerArm: { x: -0.8, y: 0, z: 0 },      // 前臂弯曲（约45度）
      rightHand: { x: 0, y: 0, z: 0 },
      head: { x: 0.15, y: 0.2, z: 0 },             // 歪头思考
      neck: { x: 0.1, y: 0.15, z: 0 },
      spine: { x: 0.05, y: 0, z: 0 }
    },
    // 行走姿势 - 优化
    walk1: {
      leftUpperLeg: { x: -0.25, y: 0, z: 0 },      // 腿部摆动（约14度）
      rightUpperLeg: { x: 0.25, y: 0, z: 0 },
      leftLowerLeg: { x: 0.3, y: 0, z: 0 },        // 膝盖弯曲（约17度）
      rightLowerLeg: { x: 0.05, y: 0, z: 0 },
      leftUpperArm: { x: 0.2, y: 0, z: 0.1 },      // 手臂自然摆动
      rightUpperArm: { x: -0.2, y: 0, z: -0.1 },
      spine: { x: 0.03, y: 0, z: 0 }               // 轻微起伏
    },
    walk2: {
      leftUpperLeg: { x: 0.25, y: 0, z: 0 },
      rightUpperLeg: { x: -0.25, y: 0, z: 0 },
      leftLowerLeg: { x: 0.05, y: 0, z: 0 },
      rightLowerLeg: { x: 0.3, y: 0, z: 0 },
      leftUpperArm: { x: -0.2, y: 0, z: 0.1 },
      rightUpperArm: { x: 0.2, y: 0, z: -0.1 },
      spine: { x: 0.03, y: 0, z: 0 }
    },
    // 通用动作姿势 - 优化
    genericAction: {
      leftUpperArm: { x: -0.6, y: 0, z: 0.3 },     // 适中的手臂抬起
      rightUpperArm: { x: -0.6, y: 0, z: -0.3 },
      leftLowerArm: { x: -0.4, y: 0, z: 0 },
      rightLowerArm: { x: -0.4, y: 0, z: 0 },
      spine: { x: -0.05, y: 0, z: 0 },
      head: { x: 0.02, y: 0, z: 0 }
    },
    
    // 从 poseLibrary 导入的姿势
    ...poseLibrary
  }
  
  // ==================== 优化版骨骼动画系统 ====================
  
  // 本地缓动函数（用于特定效果）
  const localEasingFunctions = {
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
  
  // 生成通用动作 - 为未定义的动作创建默认动画
  const generateGenericAction = (actionName) => {
    // 根据动作名称关键词判断类型
    const name = actionName.toLowerCase()
    
    // 坐姿类动作
    if (name.includes('sit') || name.includes('seat')) {
      return {
        duration: 1500,
        keyframes: [
          { time: 0, pose: 'idle' },
          { time: 0.3, pose: 'crouchDeep' },
          { time: 0.6, pose: 'sitPose' },
          { time: 1, pose: 'sitPose' }
        ]
      }
    }
    
    // 躺卧类动作
    if (name.includes('lie') || name.includes('sleep') || name.includes('bed')) {
      return {
        duration: 2000,
        keyframes: [
          { time: 0, pose: 'idle' },
          { time: 0.3, pose: 'crouchDeep' },
          { time: 0.6, pose: 'sleepPose' },
          { time: 1, pose: 'sleepPose' }
        ]
      }
    }
    
    // 挥手类动作
    if (name.includes('wave') || name.includes('hello') || name.includes('greet')) {
      return {
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
      }
    }
    
    // 跳跃类动作
    if (name.includes('jump') || name.includes('hop') || name.includes('leap')) {
      return {
        duration: 1500,
        keyframes: [
          { time: 0, pose: 'idle' },
          { time: 0.1, pose: 'crouch' },
          { time: 0.3, pose: 'jumpUp' },
          { time: 0.6, pose: 'fallDown' },
          { time: 0.8, pose: 'land' },
          { time: 1, pose: 'idle' }
        ]
      }
    }
    
    // 舞蹈类动作
    if (name.includes('dance') || name.includes('spin') || name.includes('twirl')) {
      return {
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
      }
    }
    
    // 攻击/战斗类动作
    if (name.includes('attack') || name.includes('punch') || name.includes('kick') || name.includes('fight')) {
      return {
        duration: 1200,
        keyframes: [
          { time: 0, pose: 'idle' },
          { time: 0.2, pose: 'angryPose' },
          { time: 0.4, pose: 'attackPose' },
          { time: 0.7, pose: 'attackPose' },
          { time: 1, pose: 'idle' }
        ]
      }
    }
    
    // 防御类动作
    if (name.includes('defend') || name.includes('block') || name.includes('shield') || name.includes('guard')) {
      return {
        duration: 1500,
        keyframes: [
          { time: 0, pose: 'idle' },
          { time: 0.3, pose: 'defendPose' },
          { time: 0.7, pose: 'defendPose' },
          { time: 1, pose: 'idle' }
        ]
      }
    }
    
    // 情绪类 - 开心
    if (name.includes('happy') || name.includes('joy') || name.includes('smile') || name.includes('laugh')) {
      return {
        duration: 1500,
        keyframes: [
          { time: 0, pose: 'idle' },
          { time: 0.2, pose: 'armsUp' },
          { time: 0.8, pose: 'armsUp' },
          { time: 1, pose: 'idle' }
        ]
      }
    }
    
    // 情绪类 - 悲伤
    if (name.includes('sad') || name.includes('cry') || name.includes('tear')) {
      return {
        duration: 2000,
        keyframes: [
          { time: 0, pose: 'idle' },
          { time: 0.3, pose: 'sadPose' },
          { time: 0.7, pose: 'sadPose' },
          { time: 1, pose: 'idle' }
        ]
      }
    }
    
    // 情绪类 - 生气
    if (name.includes('angry') || name.includes('mad') || name.includes('rage')) {
      return {
        duration: 1500,
        keyframes: [
          { time: 0, pose: 'idle' },
          { time: 0.2, pose: 'angryPose' },
          { time: 0.8, pose: 'angryPose' },
          { time: 1, pose: 'idle' }
        ]
      }
    }
    
    // 情绪类 - 惊讶
    if (name.includes('surprise') || name.includes('shock') || name.includes('amaze')) {
      return {
        duration: 1500,
        keyframes: [
          { time: 0, pose: 'idle' },
          { time: 0.1, pose: 'surprisePose' },
          { time: 0.8, pose: 'surprisePose' },
          { time: 1, pose: 'idle' }
        ]
      }
    }
    
    // 情绪类 - 爱心/喜欢
    if (name.includes('love') || name.includes('like') || name.includes('heart')) {
      return {
        duration: 2000,
        keyframes: [
          { time: 0, pose: 'idle' },
          { time: 0.2, pose: 'lovePose' },
          { time: 0.8, pose: 'lovePose' },
          { time: 1, pose: 'idle' }
        ]
      }
    }
    
    // 演奏/音乐类动作
    if (name.includes('play') || name.includes('music') || name.includes('sing') || name.includes('piano') || name.includes('guitar') || name.includes('instrument')) {
      return {
        duration: 2000,
        keyframes: [
          { time: 0, pose: 'idle' },
          { time: 0.2, pose: 'singPose' },
          { time: 0.8, pose: 'singPose' },
          { time: 1, pose: 'idle' }
        ]
      }
    }
    
    // 阅读/学习类动作
    if (name.includes('read') || name.includes('study') || name.includes('book')) {
      return {
        duration: 2000,
        keyframes: [
          { time: 0, pose: 'idle' },
          { time: 0.3, pose: 'holdBook' },
          { time: 0.7, pose: 'readPose' },
          { time: 1, pose: 'holdBook' }
        ]
      }
    }
    
    // 拍照类动作
    if (name.includes('photo') || name.includes('camera') || name.includes('pose')) {
      return {
        duration: 2000,
        keyframes: [
          { time: 0, pose: 'idle' },
          { time: 0.2, pose: 'photoPose' },
          { time: 0.8, pose: 'photoPose' },
          { time: 1, pose: 'idle' }
        ]
      }
    }
    
    // 鞠躬/礼貌类动作
    if (name.includes('bow') || name.includes('thanks') || name.includes('respect')) {
      return {
        duration: 2000,
        keyframes: [
          { time: 0, pose: 'idle' },
          { time: 0.2, pose: 'bowStart' },
          { time: 0.5, pose: 'bowDeep' },
          { time: 0.8, pose: 'bowStart' },
          { time: 1.0, pose: 'idle' }
        ]
      }
    }
    
    // 飞行/漂浮类动作
    if (name.includes('fly') || name.includes('float') || name.includes('air') || name.includes('hover')) {
      return {
        duration: 2000,
        keyframes: [
          { time: 0, pose: 'idle' },
          { time: 0.3, pose: 'airPose' },
          { time: 0.7, pose: 'airPose' },
          { time: 1, pose: 'idle' }
        ]
      }
    }
    
    // 行走/移动类动作
    if (name.includes('walk') || name.includes('run') || name.includes('move') || name.includes('go')) {
      return {
        duration: 1500,
        keyframes: [
          { time: 0, pose: 'idle' },
          { time: 0.25, pose: 'walk1' },
          { time: 0.5, pose: 'walk2' },
          { time: 0.75, pose: 'walk1' },
          { time: 1, pose: 'idle' }
        ]
      }
    }
    
    // 吃喝类动作
    if (name.includes('eat') || name.includes('drink') || name.includes('food')) {
      return {
        duration: 2000,
        keyframes: [
          { time: 0, pose: 'idle' },
          { time: 0.2, pose: 'eatStart' },
          { time: 0.5, pose: 'eatBite' },
          { time: 0.8, pose: 'eatChew' },
          { time: 1, pose: 'idle' }
        ]
      }
    }
    
    // 庆祝/欢呼类动作
    if (name.includes('celebrate') || name.includes('cheer') || name.includes('victory') || name.includes('win')) {
      return {
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
    
    // 思考/疑惑类动作
    if (name.includes('think') || name.includes('wonder') || name.includes('confuse')) {
      return {
        duration: 2000,
        keyframes: [
          { time: 0, pose: 'idle' },
          { time: 0.3, pose: 'thinkPose' },
          { time: 0.7, pose: 'thinkPose' },
          { time: 1, pose: 'idle' }
        ]
      }
    }
    
    // 特殊/魔法类动作
    if (name.includes('magic') || name.includes('cast') || name.includes('spell') || name.includes('special') || name.includes('transform') || name.includes('teleport')) {
      return {
        duration: 2500,
        keyframes: [
          { time: 0, pose: 'idle' },
          { time: 0.2, pose: 'magicPose' },
          { time: 0.5, pose: 'magicCast' },
          { time: 0.8, pose: 'magicPose' },
          { time: 1, pose: 'idle' }
        ]
      }
    }
    
    // 默认通用动作 - 简单的举手动作
    return {
      duration: 1500,
      keyframes: [
        { time: 0, pose: 'idle' },
        { time: 0.3, pose: 'genericAction' },
        { time: 0.7, pose: 'genericAction' },
        { time: 1, pose: 'idle' }
      ]
    }
  }
  
  // 执行骨骼动画（专业版 - 60fps高帧率，支持动画融合和平滑过渡）
  const executeBoneAnimation = (actionName) => {
    if (!vrmModel || !vrmModel.humanoid) {
      console.log('VRM模型未加载，无法执行骨骼动画')
      return
    }

    // 立即停止当前动画并清除状态
    if (currentBoneAnimation.current) {
      cancelAnimationFrame(currentBoneAnimation.current)
      currentBoneAnimation.current = null
    }

    // 清除所有正在进行的动画状态
    boneVelocities.current.clear()

    // 保存初始姿势（如果还没保存）
    if (initialBoneRotations.current.size === 0) {
      saveInitialBoneRotations()
    }

    // 优先使用新的250种动作系统
    let action = getActionAnimation(actionName)

    // 如果新系统没有，尝试使用旧系统
    if (!action && dramaticActions[actionName]) {
      action = dramaticActions[actionName]
    }

    // 如果都找不到，使用通用动作生成
    if (!action) {
      console.log('使用通用动作处理:', actionName)
      action = generateGenericAction(actionName)
    }

    console.log('执行动作:', actionName, '持续时间:', action.duration, 'ms', 'FPS:', action.fps || 60)

    // 记录当前姿势作为起始姿势（用于平滑过渡）
    const startPose = new Map()
    const boneNames = [
      'hips', 'spine', 'chest', 'neck', 'head',
      'leftShoulder', 'leftUpperArm', 'leftLowerArm', 'leftHand',
      'rightShoulder', 'rightUpperArm', 'rightLowerArm', 'rightHand',
      'leftUpperLeg', 'leftLowerLeg', 'leftFoot',
      'rightUpperLeg', 'rightLowerLeg', 'rightFoot'
    ]
    
    boneNames.forEach(boneName => {
      const bone = vrmModel.humanoid.getNormalizedBoneNode(boneName)
      if (bone) {
        startPose.set(boneName, {
          x: bone.rotation.x,
          y: bone.rotation.y,
          z: bone.rotation.z
        })
      }
    })

    // 重置动画开始时间
    animationStartTime.current = Date.now()
    
    // 动画参数 - 60fps高帧率
    const targetFPS = action.fps || 60
    const frameInterval = 1000 / targetFPS
    const maxLoops = action.loop ? Infinity : 1
    const blendInDuration = 200 // 更快的淡入时间（毫秒）
    const blendOutDuration = action.loop ? 0 : 250 // 非循环动作淡出时间
    
    let frameCount = 0
    let lastFrameTime = Date.now()
    let accumulatedTime = 0
    
    // 获取缓动函数
    const easingFunc = easingFunctions[action.easing] || easingFunctions.smoothstep
    
    const animate = () => {
      const now = Date.now()
      const deltaTime = now - lastFrameTime
      lastFrameTime = now
      accumulatedTime += deltaTime
      
      // 固定时间步长更新，确保60fps
      while (accumulatedTime >= frameInterval) {
        accumulatedTime -= frameInterval
        
        const elapsed = now - animationStartTime.current
        const loopDuration = action.duration
        const currentLoopProgress = (elapsed % loopDuration) / loopDuration
        const totalProgress = Math.min(elapsed / (loopDuration * maxLoops), 1)
        
        // 计算淡入淡出权重 - 使用更平滑的曲线
        let blendWeight = 1
        if (elapsed < blendInDuration) {
          // 淡入阶段 - 使用easeOut
          blendWeight = easingFunctions['easeOutQuad'](elapsed / blendInDuration)
        } else if (!action.loop && totalProgress > 0.85) {
          // 淡出阶段（仅非循环动作）
          const fadeOutProgress = (totalProgress - 0.85) / 0.15
          blendWeight = 1 - easingFunctions['easeInOutQuad'](fadeOutProgress)
        }
        
        // 找到当前和下一个关键帧
        let currentKeyframe = action.keyframes[0]
        let nextKeyframe = action.keyframes[action.keyframes.length - 1]
        
        for (let i = 0; i < action.keyframes.length - 1; i++) {
          if (currentLoopProgress >= action.keyframes[i].time && 
              currentLoopProgress <= action.keyframes[i + 1].time) {
            currentKeyframe = action.keyframes[i]
            nextKeyframe = action.keyframes[i + 1]
            break
          }
        }
        
        // 计算关键帧之间的插值 - 使用动作指定的缓动函数
        const frameDuration = nextKeyframe.time - currentKeyframe.time
        const frameProgress = frameDuration > 0 ? 
          (currentLoopProgress - currentKeyframe.time) / frameDuration : 0
        
        // 应用缓动函数
        const easeProgress = easingFunc(frameProgress)
        
        // 获取姿势 - 优先使用新的姿势库
        const currentPose = poseLibrary[currentKeyframe.pose] || poses[currentKeyframe.pose] || poses.idle
        const nextPose = poseLibrary[nextKeyframe.pose] || poses[nextKeyframe.pose] || poses.idle
        
        // 合并姿势
        const allBones = new Set([...Object.keys(currentPose), ...Object.keys(nextPose)])
        
        allBones.forEach(boneName => {
          const bone = vrmModel.humanoid.getNormalizedBoneNode(boneName)
          if (!bone) return
          
          const currentRot = currentPose[boneName] || { x: 0, y: 0, z: 0 }
          const nextRot = nextPose[boneName] || { x: 0, y: 0, z: 0 }
          const startRot = startPose.get(boneName) || { x: 0, y: 0, z: 0 }
          
          // 计算目标姿势（关键帧插值）
          const targetPoseX = THREE.MathUtils.lerp(currentRot.x, nextRot.x, easeProgress)
          const targetPoseY = THREE.MathUtils.lerp(currentRot.y, nextRot.y, easeProgress)
          const targetPoseZ = THREE.MathUtils.lerp(currentRot.z, nextRot.z, easeProgress)
          
          // 融合起始姿势和目标姿势（动画融合）
          const finalX = THREE.MathUtils.lerp(startRot.x, targetPoseX, blendWeight)
          const finalY = THREE.MathUtils.lerp(startRot.y, targetPoseY, blendWeight)
          const finalZ = THREE.MathUtils.lerp(startRot.z, targetPoseZ, blendWeight)
          
          // 平滑应用到骨骼 - 使用更高的平滑因子使动作更流畅
          const smoothFactor = 0.6
          bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, finalX, smoothFactor)
          bone.rotation.y = THREE.MathUtils.lerp(bone.rotation.y, finalY, smoothFactor)
          bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, finalZ, smoothFactor)
        })
        
        frameCount++
        
        // 检查动画是否结束（非循环动作）
        if (!action.loop && totalProgress >= 1) {
          console.log('动作完成:', actionName, '总帧数:', frameCount, '平均FPS:', (frameCount / (elapsed / 1000)).toFixed(1))
          currentBoneAnimation.current = null
          
          // 非循环动作返回待机
          setTimeout(() => {
            returnToIdleSmooth()
          }, 50)
          return
        }
      }
      
      // 强制更新 VRM 模型
      if (vrmModel && typeof vrmModel.update === 'function') {
        vrmModel.update(0)
      }
      
      // 继续动画循环
      if (action.loop || (Date.now() - animationStartTime.current) < action.duration * maxLoops) {
        currentBoneAnimation.current = requestAnimationFrame(animate)
      } else {
        currentBoneAnimation.current = null
      }
    }
    
    // 开始动画循环
    currentBoneAnimation.current = requestAnimationFrame(animate)
  }
  
  // 平滑返回待机姿势（极速版）
  const returnToIdleSmooth = () => {
    if (!vrmModel || !vrmModel.humanoid) return
    
    const startTime = Date.now()
    const duration = 400 // 更快的返回时间
    
    // 记录起始姿势
    const startRotations = new Map()
    initialBoneRotations.current.forEach((rot, boneName) => {
      const bone = vrmModel.humanoid.getNormalizedBoneNode(boneName)
      if (bone) {
        startRotations.set(boneName, bone.rotation.clone())
      }
    })
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = localEasingFunctions.smooth(progress)
      
      initialBoneRotations.current.forEach((initialRot, boneName) => {
        const bone = vrmModel.humanoid.getNormalizedBoneNode(boneName)
        if (!bone) return
        
        const startRot = startRotations.get(boneName)
        if (!startRot) return
        
        // 从当前姿势平滑过渡到初始姿势（直接插值）
        bone.rotation.x = THREE.MathUtils.lerp(startRot.x, initialRot.x, easeProgress)
        bone.rotation.y = THREE.MathUtils.lerp(startRot.y, initialRot.y, easeProgress)
        bone.rotation.z = THREE.MathUtils.lerp(startRot.z, initialRot.z, easeProgress)
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
        const bone = vrmModel.humanoid.getNormalizedBoneNode(boneName)
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

    // 更新视线目标 - 让角色看向鼠标/手指位置
    if (characterRef.current && isLookingAtCamera) {
      // 将屏幕坐标转换为3D世界坐标
      const vector = new THREE.Vector3(x, y, 0.5)
      vector.unproject(camera)
      const dir = vector.sub(camera.position).normalize()
      const distance = -camera.position.z / dir.z
      const pos = camera.position.clone().add(dir.multiplyScalar(distance))
      // 设置视线目标，稍微抬高一点（眼睛高度）
      setLookAtTarget(new THREE.Vector3(pos.x, pos.y + 1.5, pos.z + 5))
    }
    
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
        
        // 交互模式：根据触摸部位播放不同动画
        if (isInteractMode && intersects.length > 0) {
          const touchPoint = intersects[0].point
          const localY = touchPoint.y - position[1] // 相对于角色位置的Y坐标
          
          // 根据Y坐标判断触摸部位
          let bodyPart = ''
          let actionId = ''
          
          if (localY > 1.4) {
            bodyPart = '头部'
            actionId = 'mmd_expression_0' // 摸头动画
          } else if (localY > 0.8) {
            bodyPart = '身体'
            actionId = 'mmd_basic_4' // 摸身体动画
          } else if (localY > 0.3) {
            bodyPart = '手部'
            actionId = 'mmd_basic_8' // 摸手动画
          } else {
            bodyPart = '腿部'
            actionId = 'mmd_basic_16' // 摸腿动画
          }
          
          // 触发交互回调
          if (onInteract) {
            onInteract(index, bodyPart, actionId, touchPoint)
          }
          
          // 显示部位反馈
          setTouchFeedback({
            show: true,
            x: clientX,
            y: clientY,
            type: 'interact',
            message: `触摸了${bodyPart}`
          })
          
          setTimeout(() => {
            setTouchFeedback({ show: false, x: 0, y: 0, type: null })
          }, 1000)
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

  // 移除全局事件监听，改为在组件级别处理点击
  // 这样可以避免阻止父组件的点击事件
  useEffect(() => {
    // 不再在canvas上添加全局事件监听
    // 点击事件通过React Three Fiber的onPointerDown等属性处理
    return () => {
      // 清理函数
    }
  }, [])

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

    // 处理来自设置面板的姿势预设动作
    const handleCharacterAction = (event) => {
      const { action, actionName } = event.detail
      console.log('执行姿势预设:', action, actionName)
      executePresetAction(action)
    }

    window.addEventListener('executeAction', handleExecuteAction)
    window.addEventListener('executeCombo', handleExecuteCombo)
    window.addEventListener('toggleRandom', handleToggleRandom)
    window.addEventListener('resetPosition', handleResetPosition)
    window.addEventListener('rotateCanvas', handleRotateCanvas)
    window.addEventListener('execute-character-action', handleCharacterAction)
    // window.addEventListener('swingDetected', handleSwingDetected)

    return () => {
      window.removeEventListener('executeAction', handleExecuteAction)
      window.removeEventListener('executeCombo', handleExecuteCombo)
      window.removeEventListener('toggleRandom', handleToggleRandom)
      window.removeEventListener('resetPosition', handleResetPosition)
      window.removeEventListener('rotateCanvas', handleRotateCanvas)
      window.removeEventListener('execute-character-action', handleCharacterAction)
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
    // 骨骼编辑模式时暂停其他动画更新
    // 注意：MMD动作播放时不应该被currentBoneAnimation阻塞
    if (isBoneEditing) {
      return
    }
    
    try {
      // 模型透明度处理
      if (vrmModel && vrmModel.scene) {
        vrmModel.scene.traverse((obj) => {
          if (obj.isMesh && obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(mat => {
                mat.transparent = true
                mat.opacity = opacity
                mat.needsUpdate = true
              })
            } else {
              obj.material.transparent = true
              obj.material.opacity = opacity
              obj.material.needsUpdate = true
            }
          }
        })
      }
      
      // MMD动作系统处理
      // 帧率检测
      const now = Date.now()
      if (!window.mmdFrameStats) {
        window.mmdFrameStats = { lastTime: now, frameCount: 0, fps: 0 }
      }
      window.mmdFrameStats.frameCount++
      if (now - window.mmdFrameStats.lastTime >= 1000) {
        window.mmdFrameStats.fps = window.mmdFrameStats.frameCount
        console.log('📊 FPS:', window.mmdFrameStats.fps)
        window.mmdFrameStats.frameCount = 0
        window.mmdFrameStats.lastTime = now
      }
      
      const canPlayMMD = mmdCurrentAction && vrmModel && vrmModel.humanoid && mmdActionStartTime > 0
      
      // 限制MMD更新频率，避免过于频繁的更新导致抖动
      if (!window.mmdLastUpdateTime) window.mmdLastUpdateTime = 0
      const timeSinceLastUpdate = now - window.mmdLastUpdateTime
      const minUpdateInterval = 16 // 约60fps，每16ms更新一次
      
      if (canPlayMMD && timeSinceLastUpdate >= minUpdateInterval) {
        window.mmdLastUpdateTime = now
        const currentTime = Date.now()
        const elapsedTime = currentTime - mmdActionStartTime
        
        // 检测MMD更新频率
        if (!window.mmdUpdateStats) {
          window.mmdUpdateStats = { lastTime: currentTime, updateCount: 0, updatesPerSecond: 0 }
        }
        window.mmdUpdateStats.updateCount++
        if (currentTime - window.mmdUpdateStats.lastTime >= 1000) {
          window.mmdUpdateStats.updatesPerSecond = window.mmdUpdateStats.updateCount
          console.log('🎬 MMD更新频率:', window.mmdUpdateStats.updatesPerSecond, '次/秒')
          window.mmdUpdateStats.updateCount = 0
          window.mmdUpdateStats.lastTime = currentTime
        }
        
        // 动作开始时保存初始状态并执行过渡
        if (elapsedTime < 100) {
          // 保存角色的基础位置（来自props）
          mmdBasePosition.current = position
          
          // 获取hips的初始位置
          const hipsBone = vrmModel.humanoid.getNormalizedBoneNode('hips') || 
                          vrmModel.scene.getObjectByName('hips') ||
                          vrmModel.scene.getObjectByName('J_Bip_C_Hips')
          if (hipsBone) {
            mmdInitialHipsPosition.current = hipsBone.position.clone()
          }
          
          // 保存所有骨骼的初始旋转（用于动作过渡）
          if (!mmdPreviousAction.current || mmdPreviousAction.current.id !== mmdCurrentAction.id) {
            mmdInitialBoneRotations.current.clear()
            Object.keys(MMD_TO_VRM_BONE_MAP).forEach(boneName => {
              const vrmBoneName = MMD_TO_VRM_BONE_MAP[boneName] || boneName
              let bone = null
              
              if (typeof vrmModel.humanoid.getNormalizedBoneNode === 'function') {
                bone = vrmModel.humanoid.getNormalizedBoneNode(vrmBoneName)
              }
              if (!bone && typeof vrmModel.humanoid.getBone === 'function') {
                const boneRef = vrmModel.humanoid.getBone(vrmBoneName)
                if (boneRef && boneRef.node) bone = boneRef.node
              }
              
              if (bone) {
                mmdInitialBoneRotations.current.set(boneName, bone.rotation.clone())
              }
            })
            mmdPreviousAction.current = mmdCurrentAction
            console.log('🔄 动作切换，保存初始骨骼状态:', mmdCurrentAction.name)
          }
        }
        
        // 计算过渡因子（前300ms为过渡期）
        const transitionDuration = 300
        const transitionFactor = Math.min(elapsedTime / transitionDuration, 1.0)
        
        // 调试日志 - 每500ms输出一次
        if (elapsedTime % 500 < 50) {
          console.log('🎬 MMD动作播放中:', mmdCurrentAction.name, '已用时间:', elapsedTime + 'ms', 'vrmModel:', !!vrmModel, 'humanoid:', !!vrmModel.humanoid)
        }
        
        // 应用MMD动作（interpolateKeyframes内部已经处理了循环）
        let boneData
        try {
          boneData = interpolateKeyframes(mmdCurrentAction, elapsedTime)
        } catch (error) {
          console.error('❌ interpolateKeyframes 错误:', error)
          boneData = {}
        }
        
        // 调试日志 - 每2秒输出一次避免刷屏
        if (elapsedTime < 100 || elapsedTime % 2000 < 50) {
          console.log('🎭 MMD动作播放中:', mmdCurrentAction.name, '骨骼数量:', Object.keys(boneData).length, '已用时间:', elapsedTime + 'ms')
          
          // 输出第一个骨骼的数据作为示例
          const firstBoneName = Object.keys(boneData)[0]
          if (firstBoneName) {
            const firstBone = boneData[firstBoneName]
            console.log('📋 示例骨骼数据:', firstBoneName, {
              旋转: firstBone.rotation?.map(v => v.toFixed(3)),
              位置: firstBone.position?.map(v => v.toFixed(3))
            })
          }
        }
        
        // 检查boneData是否有效
        if (!boneData || Object.keys(boneData).length === 0) {
          console.warn('⚠️ boneData为空或无效')
          return
        }
        
        // 应用骨骼变换
        let updatedBoneCount = 0
        let missingBoneCount = 0
        
        Object.entries(boneData).forEach(([boneName, transform]) => {
          // 将MMD骨骼名称映射到VRM标准骨骼名称
          const vrmBoneName = MMD_TO_VRM_BONE_MAP[boneName] || boneName
          
          // 尝试从缓存获取骨骼
          const cacheKey = `${vrmBoneName}_${boneName}`
          let bone = boneCache.current.get(cacheKey)
          
          // 如果缓存中没有，或者每5秒清理一次缓存，重新查找
          const currentTime = Date.now()
          if (!bone || (currentTime - lastCacheClearTime.current > 5000)) {
            if (currentTime - lastCacheClearTime.current > 5000) {
              boneCache.current.clear()
              lastCacheClearTime.current = currentTime
            }
            
            // 方式1: 使用getRawBoneNode方法（VRM 1.0原始骨骼，不会被自动重置）
            if (typeof vrmModel.humanoid.getRawBoneNode === 'function') {
              bone = vrmModel.humanoid.getRawBoneNode(vrmBoneName)
            }
            
            // 方式2: 使用getNormalizedBoneNode方法（VRM 1.0归一化骨骼，会被自动重置，不推荐用于MMD）
            if (!bone && typeof vrmModel.humanoid.getNormalizedBoneNode === 'function') {
              bone = vrmModel.humanoid.getNormalizedBoneNode(vrmBoneName)
            }
            
            // 方式3: 使用getBone方法（VRM 0.x兼容，但已弃用）
            if (!bone && typeof vrmModel.humanoid.getBone === 'function') {
              try {
                const boneRef = vrmModel.humanoid.getBone(vrmBoneName)
                if (boneRef && boneRef.node) {
                  bone = boneRef.node
                }
              } catch (e) {
                // getBone已弃用，忽略错误
              }
            }
            
            // 方式4: 直接从场景中查找（备用方案）
            if (!bone && vrmModel.scene) {
              // 尝试多种可能的命名格式
              const possibleNames = [
                vrmBoneName,
                `J_Bip_C_${vrmBoneName}`,
                `J_Sec_${vrmBoneName}`,
                boneName,
                `J_Bip_C_${boneName}`,
                `J_Sec_${boneName}`,
                // 添加更多可能的命名格式
                vrmBoneName.toLowerCase(),
                vrmBoneName.toUpperCase(),
                `j_bip_c_${vrmBoneName.toLowerCase()}`,
                `j_sec_${vrmBoneName.toLowerCase()}`
              ]
              
              for (const name of possibleNames) {
                bone = vrmModel.scene.getObjectByName(name)
                if (bone) break
              }
              
              // 如果还是找不到，尝试遍历场景查找包含骨骼名称的对象
              if (!bone) {
                vrmModel.scene.traverse((obj) => {
                  if (!bone && obj.name && obj.name.toLowerCase().includes(vrmBoneName.toLowerCase())) {
                    bone = obj
                  }
                })
              }
            }
            
            // 将找到的骨骼存入缓存
            if (bone) {
              boneCache.current.set(cacheKey, bone)
            }
          }
          
          if (bone) {
            updatedBoneCount++
            
            // 应用旋转（MMD动作主要使用旋转）
            if (transform.rotation && Array.isArray(transform.rotation)) {
              // 直接应用旋转，只进行坐标系转换
              const [rx, ry, rz] = transform.rotation
              
              // 调试日志：记录旋转值变化（只记录leftUpperArm作为示例）
              if (boneName === 'leftUpperArm' && Math.random() < 0.05) {
                console.log('🦴 骨骼更新:', boneName, {
                  输入旋转: [rx.toFixed(3), ry.toFixed(3), rz.toFixed(3)],
                  应用旋转: [rx.toFixed(3), (-ry).toFixed(3), rz.toFixed(3)],
                  当前旋转: [bone.rotation.x.toFixed(3), bone.rotation.y.toFixed(3), bone.rotation.z.toFixed(3)]
                })
              }
              
              // MMD到Three.js坐标系转换：Y轴旋转需要取反
              bone.rotation.set(rx, -ry, rz, 'XYZ')
            }
            
            // 应用位置（如果有）- 使用相对偏移，基于模型当前位置
            if (transform.position && Array.isArray(transform.position)) {
              const [px, py, pz] = transform.position
              // 只对特定骨骼应用位置变化（如hips）
              if (boneName === 'hips' || vrmBoneName === 'hips') {
                // 使用模型的当前位置（position prop）作为基准，加上MMD动作的偏移
                // 这样即使模型被移动，动作也会跟随模型
                bone.position.set(
                  position[0] + px,
                  position[1] + py,
                  position[2] + pz
                )
              }
            }
          } else {
            missingBoneCount++
            // 调试日志 - 只在动作开始时输出，且只输出一次
            if (elapsedTime < 200 && !boneCache.current.has(`missing_${boneName}`)) {
              console.log('⚠️ 无法找到骨骼:', boneName, '->', vrmBoneName, '(将跳过此骨骼)')
              boneCache.current.set(`missing_${boneName}`, true)
            }
          }
        })
        
        // 调试日志 - 每500ms输出一次统计
        if (elapsedTime % 500 < 50) {
          console.log('📊 MMD骨骼更新统计:', '成功:', updatedBoneCount, '失败:', missingBoneCount, '总计:', Object.keys(boneData).length)
        }
      }
      
      // VRM update 会覆盖骨骼动画，所以在执行MMD动作时跳过
      if (vrmModel && typeof vrmModel.update === 'function') {
        if (!mmdCurrentAction) {
          vrmModel.update(delta)
        } else {
          // 调试：检测MMD动作播放时VRM update是否被跳过
          if (Math.random() < 0.01) {
            console.log('⏭️ VRM update被跳过（MMD动作播放中）')
          }
          // 关键修复：即使跳过vrmModel.update()，也要更新VRM的其他系统（如blendShape），但不更新骨骼
          if (vrmModel.expressionManager) {
            vrmModel.expressionManager.update(delta)
          }
        }
      }
      
      // 关键修复：禁用VRM humanoid的自动归一化，防止覆盖我们的骨骼设置
      if (mmdCurrentAction && vrmModel && vrmModel.humanoid) {
        // 保存humanoid的原始状态
        if (!window.humanoidStateSaved) {
          window.originalHumanoidUpdate = vrmModel.humanoid.update
          window.humanoidStateSaved = true
        }
        // 禁用humanoid更新
        vrmModel.humanoid.update = () => {}
      } else if (!mmdCurrentAction && vrmModel && vrmModel.humanoid && window.originalHumanoidUpdate) {
        // 恢复humanoid更新
        vrmModel.humanoid.update = window.originalHumanoidUpdate
      }
      
      // animationMixer 更新 - 在MMD动作之后执行，避免覆盖
      if (animationMixer && typeof animationMixer.update === 'function') {
        if (!mmdCurrentAction) {
          animationMixer.update(delta)
        } else {
          // 调试：检测MMD动作播放时animationMixer是否被跳过
          if (Math.random() < 0.01) {
            console.log('⏭️ animationMixer被跳过（MMD动作播放中）')
          }
        }
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
      // 在执行骨骼动画时禁用，避免冲突
      if (followBones.current.length > 0 && characterRef.current && !currentBoneAnimation.current) {
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
      // 在执行骨骼动画时禁用，避免冲突
      if ((earBones.current.length > 0 || tailBones.current.length > 0) && !currentBoneAnimation.current) {
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
      
      {/* 渲染VRM模型 - 通过React Three Fiber的正常渲染流程 */}
      {characterModel && (
        <primitive object={characterModel} />
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

const CharacterController = ({ position = [0, 0, 0], rotation = [0, 0, 0], selectedFile = null, onSwing = null, isBoneEditing = false, onBoneChange = null, scale = 1.0, actionIntensity = 1.0, opacity = 1.0, mmdCurrentAction = null, mmdActionStartTime = 0 }) => {
  return (
    <group scale={[scale, scale, scale]}>
      <CharacterSystem 
        position={position} 
        rotation={rotation} 
        selectedFile={selectedFile} 
        onSwing={onSwing}
        isBoneEditing={isBoneEditing}
        onBoneChange={onBoneChange}
        scale={scale}
        actionIntensity={actionIntensity}
        opacity={opacity}
        mmdCurrentAction={mmdCurrentAction}
        mmdActionStartTime={mmdActionStartTime}
      />
    </group>
  )
}

export default CharacterSystem
export { CharacterController }
