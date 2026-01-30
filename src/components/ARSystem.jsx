import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Stars, Cloud, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { CharacterController } from './CharacterSystem'
import modelList from '../models/modelList'

// ==================== 1. 粒子背景系统 ====================
const ParticleField = () => {
  const particlesRef = useRef()
  const particleCount = 200
  
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20
    }
    return pos
  }, [])
  
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05
      particlesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1
    }
  })
  
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
        color="#ff9ecd"
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
const CharacterSlot = ({ character, index, onSelect, onRemove, isSelected }) => {
  const [isPressed, setIsPressed] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  
  return (
    <div
      onClick={() => onSelect(index)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onMouseEnter={() => character && setShowPreview(true)}
      style={{
        width: '90px',
        height: '90px',
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

// ==================== 5. 动作按钮组件（优化版） ====================
const ActionButton = ({ item, index, onClick, isActive }) => {
  const [isPressed, setIsPressed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  
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
      idle: { bg: 'linear-gradient(135deg, #a8e6cf 0%, #7fcdcd 100%)', icon: '😌' },
      wave: { bg: 'linear-gradient(135deg, #ffd93d 0%, #ffb347 100%)', icon: '👋' },
      dance: { bg: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)', icon: '💃' },
      jump: { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', icon: '⬆️' },
      sit: { bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', icon: '🪑' },
      run: { bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', icon: '🏃' },
      happy: { bg: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', icon: '😄' },
      sad: { bg: 'linear-gradient(135deg, #a8caba 0%, #5d4e75 100%)', icon: '😢' },
      angry: { bg: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)', icon: '😠' },
      surprise: { bg: 'linear-gradient(135deg, #c471ed 0%, #f64f59 100%)', icon: '😲' },
      love: { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', icon: '😍' },
      sleep: { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', icon: '😴' },
      eat: { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', icon: '🍰' },
      read: { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', icon: '📖' },
      sing: { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', icon: '🎤' },
      photo: { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', icon: '📸' },
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
        minWidth: '110px',
        height: '90px',
        background: isActive
          ? 'linear-gradient(135deg, #ff9ecd 0%, #ff6b9d 50%, #c44569 100%)'
          : isFirst 
            ? 'linear-gradient(135deg, #ff9ecd 0%, #ff6b9d 50%, #c44569 100%)' 
            : theme.bg,
        border: isActive || isFirst ? '3px solid #ffb8d0' : '2px solid rgba(255,255,255,0.3)',
        borderRadius: '24px',
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
          : '0 8px 24px rgba(0, 0, 0, 0.25), inset 0 2px 10px rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(15px)',
        transform: isPressed ? 'scale(0.9) translateY(6px)' : isHovered ? 'scale(1.1) translateY(-8px) rotate(-2deg)' : 'scale(1) translateY(0)',
        position: 'relative',
        overflow: 'hidden',
        opacity: cooldown > 0 ? 0.6 : 1
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
        fontSize: '32px', 
        filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.4))',
        animation: isHovered ? 'bounce 0.5s ease-in-out infinite' : 'none',
        transform: 'scale(1.15)',
        zIndex: 1
      }}>{theme.icon}</div>
      
      <div style={{ 
        fontSize: '12px', 
        fontWeight: '800', 
        textAlign: 'center', 
        textShadow: '0 2px 6px rgba(0, 0, 0, 0.5)',
        letterSpacing: '0.8px',
        zIndex: 1
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
    </button>
  )
}

// ==================== 6. 科技按钮组件（优化版） ====================
const TechButton = ({ children, onClick, style, active = false, size = 'medium', badge }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  
  const sizeStyles = {
    small: { width: '50px', height: '50px', fontSize: '20px' },
    medium: { width: '60px', height: '60px', fontSize: '24px' },
    large: { width: '70px', height: '70px', fontSize: '28px' }
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
  const [isDragging, setIsDragging] = useState(false)
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '12px 16px',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
      borderRadius: '20px',
      border: '1px solid rgba(255,255,255,0.2)',
      backdropFilter: 'blur(10px)'
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
        <span style={{ marginLeft: 'auto', opacity: 0.8 }}>{value.toFixed(1)}</span>
      </div>
      
      <input
        type="range"
        min={min}
        max={max}
        step={0.1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        style={{
          width: '100%',
          height: '8px',
          borderRadius: '4px',
          background: 'rgba(255,255,255,0.2)',
          outline: 'none',
          cursor: 'pointer',
          WebkitAppearance: 'none',
          appearance: 'none'
        }}
      />
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
const ARContent = ({ characters, selectedCharacterIndex, characterScale, actionIntensity }) => {
  return (
    <>
      <ParticleField />
      <DynamicBackground />
      <FloatingDecorations />
      
      {/* 渲染所有已加载的角色 */}
      {characters.map((character, index) => {
        if (!character) return null
        
        // 根据索引设置不同位置
        const positions = [
          [-1.5, 0, 0],  // 左边
          [0, 0, 0],     // 中间
          [1.5, 0, 0]    // 右边
        ]
        
        const isSelected = index === selectedCharacterIndex
        
        return (
          <group key={index}>
            <CharacterController 
              position={positions[index]} 
              rotation={[0, 0, 0]} 
              selectedFile={character}
              scale={characterScale * (isSelected ? 1.1 : 0.9)} // 选中的角色稍大
              actionIntensity={actionIntensity}
            />
          </group>
        )
      })}
    </>
  )
}

// ==================== 主组件 ====================
export const ARScene = ({ selectedFile }) => {
  const [isARMode, setIsARMode] = useState(false)
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
  const [characterScale, setCharacterScale] = useState(1.0)
  const [actionIntensity, setActionIntensity] = useState(1.0)
  const [isRandomMode, setIsRandomMode] = useState(false)
  const [currentAction, setCurrentAction] = useState('idle')
  const [notification, setNotification] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [comboCount, setComboCount] = useState(0)
  const [showCombo, setShowCombo] = useState(false)

  // 动作列表
  const actionList = [
    { name: '待机', action: 'idle', icon: '😌' },
    { name: '挥手', action: 'wave', icon: '👋' },
    { name: '跳舞', action: 'dance', icon: '💃' },
    { name: '跳跃', action: 'jump', icon: '⬆️' },
    { name: '坐下', action: 'sit', icon: '🪑' },
    { name: '奔跑', action: 'run', icon: '🏃' },
    { name: '开心', action: 'happy', icon: '😄' },
    { name: '伤心', action: 'sad', icon: '😢' },
    { name: '生气', action: 'angry', icon: '😠' },
    { name: '惊讶', action: 'surprise', icon: '😲' },
    { name: '爱心', action: 'love', icon: '😍' },
    { name: '睡觉', action: 'sleep', icon: '😴' },
    { name: '吃东西', action: 'eat', icon: '🍰' },
    { name: '看书', action: 'read', icon: '📖' },
    { name: '唱歌', action: 'sing', icon: '🎤' },
    { name: '拍照', action: 'photo', icon: '📸' },
    { name: '连击', action: 'combo', icon: '✨' },
    { name: '随机', action: 'random', icon: '🎲' }
  ]

  // 显示通知
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type })
  }, [])

  // 执行动作
  const executeAction = useCallback((action) => {
    setCurrentAction(action)
    
    if (action === 'combo') {
      setComboCount(prev => {
        const newCount = prev + 1
        if (newCount >= 3) {
          setShowCombo(true)
          setTimeout(() => setShowCombo(false), 2000)
          showNotification(`连击 x${newCount}!`, 'success')
        }
        return newCount
      })
    } else {
      setComboCount(0)
    }
    
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('executeAction', { detail: { action, intensity: actionIntensity } }))
    }
    
    showNotification(`执行动作: ${actionList.find(a => a.action === action)?.name || action}`, 'success')
  }, [actionIntensity, showNotification])

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

  // 添加角色
  const addCharacter = useCallback((index, model) => {
    setCharacters(prev => {
      const newCharacters = [...prev]
      newCharacters[index] = model
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

  // 拍照
  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      showNotification('摄像头未就绪', 'error')
      return
    }

    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      const ctx = canvas.getContext('2d')

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ar-photo-${Date.now()}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        showNotification('拍照成功!', 'success')
      })
    } catch (error) {
      showNotification('拍照失败', 'error')
    }
  }, [showNotification])

  // 开始录像
  const startRecording = useCallback(() => {
    if (!streamRef.current) {
      showNotification('摄像头未就绪', 'error')
      return
    }

    try {
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
  }, [])

  // 格式化时间
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // 切换摄像头
  const toggleCamera = useCallback(() => {
    setCameraFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
    showNotification('切换摄像头', 'info')
  }, [showNotification])

  // 陀螺仪监听
  useEffect(() => {
    if (!isSwingMode || !window.DeviceOrientationEvent) return
    
    const handleOrientation = (event) => {
      const { alpha, beta, gamma } = event
      const gyroData = { x: beta, y: gamma, z: alpha }
      
      const swingX = Math.abs(gyroData.x - lastGyroDataRef.current.x)
      const swingY = Math.abs(gyroData.y - lastGyroDataRef.current.y)
      const swingZ = Math.abs(gyroData.z - lastGyroDataRef.current.z)
      
      if (swingX > swingThreshold || swingY > swingThreshold || swingZ > swingThreshold) {
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('swingDetected', { detail: { swingX, swingY, swingZ } }))
        }
      }
      lastGyroDataRef.current = gyroData
    }
    
    window.addEventListener('deviceorientation', handleOrientation)
    return () => window.removeEventListener('deviceorientation', handleOrientation)
  }, [isSwingMode])

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
        
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraFacingMode } })
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
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
      `}</style>
      
      {/* AR视频背景 */}
      {isARMode && (
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0
          }}
        />
      )}

      {/* 3D画布 */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: 1,
        background: isARMode ? 'transparent' : 'linear-gradient(to bottom, #0f172a 0%, #1e293b 100%)'
      }}>
        <Canvas gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}>
          <PerspectiveCamera makeDefault position={[0, 0.8, 2.5]} fov={50} />
          <ambientLight intensity={0.8} />
          <spotLight position={[5, 10, 5]} intensity={1.2} castShadow />
          <directionalLight position={[0, 5, 0]} intensity={0.6} />
          
          <ARContent 
            characters={characters}
            selectedCharacterIndex={selectedCharacterIndex}
            characterScale={characterScale}
            actionIntensity={actionIntensity}
          />
          
          {!isARMode && (
            <OrbitControls 
              enablePan={false} 
              minDistance={1}
              maxDistance={5}
              target={[0, 0.6, 0]}
              maxPolarAngle={Math.PI / 1.8}
            />
          )}
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
      
      {/* 顶部导航栏 */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        height: '75px',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(124, 58, 237, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        boxShadow: '0 4px 30px rgba(139, 92, 246, 0.4)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '45px',
            height: '45px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #ff9ecd 0%, #ff6b9d 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 4px 15px rgba(255, 107, 157, 0.5)'
          }}>🌸</div>
          <div>
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}>AR虚拟角色</div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.8)'
            }}>Interactive Character System</div>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <TechButton 
            onClick={() => setShowSettings(!showSettings)} 
            active={showSettings}
            size="small"
          >
            ⚙️
          </TechButton>
          
          <TechButton 
            onClick={toggleSwingMode} 
            active={isSwingMode}
            size="small"
          >
            📱
          </TechButton>
          
          <TechButton 
            onClick={toggleCamera}
            size="small"
          >
            🔄
          </TechButton>
          
          <TechButton 
            onClick={() => setIsARMode(!isARMode)}
            active={!isARMode}
            size="small"
          >
            {isARMode ? '📷' : '🎥'}
          </TechButton>
        </div>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div style={{
          position: 'absolute',
          top: '85px',
          right: '20px',
          width: '280px',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
          borderRadius: '24px',
          padding: '20px',
          zIndex: 1001,
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          animation: 'slideDown 0.3s ease'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚙️</span> 设置
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Slider
              value={characterScale}
              onChange={setCharacterScale}
              min={0.5}
              max={2.0}
              label="角色大小"
              icon="📏"
            />
            
            <Slider
              value={actionIntensity}
              onChange={setActionIntensity}
              min={0.5}
              max={2.0}
              label="动作强度"
              icon="💪"
            />
          </div>
        </div>
      )}
      
      {/* 左侧角色选择区 */}
      <div style={{
        position: 'absolute',
        left: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        zIndex: 100,
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.6) 100%)',
        padding: '20px',
        borderRadius: '28px',
        backdropFilter: 'blur(15px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        {[0, 1, 2].map((index) => (
          <CharacterSlot
            key={index}
            index={index}
            character={characters[index]}
            isSelected={selectedCharacterIndex === index}
            onSelect={setSelectedCharacterIndex}
            onRemove={removeCharacter}
          />
        ))}
        
        <button
          onClick={() => setShowModelSelect(true)}
          style={{
            width: '90px',
            height: '90px',
            borderRadius: '28px',
            background: 'linear-gradient(135deg, rgba(255, 158, 205, 0.3) 0%, rgba(255, 107, 157, 0.3) 100%)',
            border: '2px dashed rgba(255, 184, 208, 0.5)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            color: 'white',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)'
          }}
        >
          +
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
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '16px'
            }}>
              {modelList.map((model, index) => (
                <button
                  key={index}
                  onClick={() => addCharacter(selectedCharacterIndex, model)}
                  style={{
                    padding: '20px',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    border: '2px solid rgba(255,255,255,0.1)',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.3s ease',
                    color: 'white'
                  }}
                >
                  <div style={{ fontSize: '48px' }}>🌸</div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>{model.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* 右侧控制按钮 */}
      <div style={{
        position: 'absolute',
        right: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        zIndex: 100,
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.6) 100%)',
        padding: '20px',
        borderRadius: '28px',
        backdropFilter: 'blur(15px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <TechButton onClick={takePhoto} size="medium">📸</TechButton>
        
        <TechButton 
          onClick={isRecording ? stopRecording : startRecording} 
          active={isRecording}
          size="medium"
        >
          {isRecording ? '⏹️' : '🎥'}
        </TechButton>
        
        {isRecording && (
          <div style={{
            position: 'absolute',
            right: '90px',
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            animation: 'pulse 1s ease-in-out infinite'
          }}>
            ● {formatTime(recordingTime)}
          </div>
        )}
        
        <TechButton 
          onClick={toggleRandomMode} 
          active={isRandomMode}
          size="medium"
        >
          🎲
        </TechButton>
      </div>

      {/* 底部动作栏 */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '12px',
        zIndex: 100,
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%)',
        padding: '16px 24px',
        borderRadius: '32px',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
        maxWidth: '90vw',
        overflowX: 'auto'
      }}>
        {actionList.map((item, index) => (
          <ActionButton
            key={item.action}
            item={item}
            index={index}
            isActive={currentAction === item.action}
            onClick={() => executeAction(item.action)}
          />
        ))}
      </div>
      
      {/* 隐藏的画布 */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default ARScene
