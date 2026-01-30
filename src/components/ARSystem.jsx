import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Stars, Cloud, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { CharacterController } from './CharacterSystem'
import modelList from '../models/modelList'

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
// ==================== 道具显示组件 ====================
const PropDisplay = ({ propId }) => {
  console.log('PropDisplay 渲染, propId:', propId)
  if (!propId || propId === 'none') return null

  const propConfigs = {
    sword: { color: '#c0c0c0', geometry: 'box', size: [0.05, 0.6, 0.05], pos: [0.25, 0.6, 0.15], rot: [0, 0, -0.5] },
    shield: { color: '#4a90d9', geometry: 'cylinder', size: [0.2, 0.2, 0.04, 16], pos: [-0.25, 0.5, 0.15], rot: [0, 0, 0] },
    wand: { color: '#9b59b6', geometry: 'cylinder', size: [0.015, 0.015, 0.4, 8], pos: [0.2, 0.6, 0.1], rot: [0.3, 0, -0.3] },
    book: { color: '#e67e22', geometry: 'box', size: [0.15, 0.2, 0.04], pos: [0.25, 0.55, 0.15], rot: [0, 0.3, 0.3] },
    flower: { color: '#ff69b4', geometry: 'sphere', size: [0.06, 16, 16], pos: [0.2, 1.35, 0.08], rot: [0, 0, 0] },
    crown: { color: '#ffd700', geometry: 'cylinder', size: [0.12, 0.1, 0.06, 16], pos: [0, 1.55, 0], rot: [0, 0, 0] },
    glasses: { color: '#34495e', geometry: 'box', size: [0.2, 0.04, 0.015], pos: [0, 1.35, 0.1], rot: [0, 0, 0] },
    hat: { color: '#2c3e50', geometry: 'cylinder', size: [0.15, 0.15, 0.12, 16], pos: [0, 1.58, 0], rot: [0, 0, 0] },
    microphone: { color: '#e74c3c', geometry: 'cylinder', size: [0.025, 0.025, 0.2, 8], pos: [0.15, 0.7, 0.15], rot: [0.4, 0, -0.15] },
    camera: { color: '#3498db', geometry: 'box', size: [0.1, 0.06, 0.08], pos: [0.2, 0.6, 0.12], rot: [0, -0.3, 0] },
    balloon: { color: '#e91e63', geometry: 'sphere', size: [0.12, 16, 16], pos: [0.25, 1.1, 0.08], rot: [0, 0, 0] },
    gift: { color: '#ff5722', geometry: 'box', size: [0.12, 0.12, 0.12], pos: [0.2, 0.25, 0.15], rot: [0, 0.5, 0] },
    umbrella: { color: '#9c27b0', geometry: 'cone', size: [0.2, 0.08, 16], pos: [-0.15, 0.9, 0.08], rot: [0.3, 0, -0.15] }
  }

  const config = propConfigs[propId]
  if (!config) return null

  const renderGeometry = () => {
    switch (config.geometry) {
      case 'box':
        return <boxGeometry args={config.size} />
      case 'cylinder':
        return <cylinderGeometry args={config.size} />
      case 'sphere':
        return <sphereGeometry args={config.size} />
      case 'cone':
        return <coneGeometry args={config.size} />
      default:
        return <boxGeometry args={config.size} />
    }
  }

  return (
    <mesh position={config.pos} rotation={config.rot}>
      {renderGeometry()}
      <meshStandardMaterial color={config.color} metalness={0.5} roughness={0.3} />
    </mesh>
  )
}

// ==================== 可拖拽角色组件 ====================
const DraggableCharacter = ({ position, index, isSelected, character, characterScale, actionIntensity, onPositionChange, propId }) => {
  const groupRef = useRef()
  const [isDragging, setIsDragging] = useState(false)
  const { camera, gl } = useThree()
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())
  const offset = useRef(new THREE.Vector3())

  const handlePointerDown = (e) => {
    if (!isSelected) return // 只有选中的人物可以拖拽
    e.stopPropagation()
    setIsDragging(true)
    gl.domElement.setPointerCapture(e.pointerId)

    // 计算拖拽偏移
    raycaster.current.setFromCamera(e.pointer, camera)
    const intersectPoint = new THREE.Vector3()
    raycaster.current.ray.intersectPlane(dragPlane.current, intersectPoint)
    offset.current.subVectors(intersectPoint, new THREE.Vector3(...position))
  }

  const handlePointerMove = (e) => {
    if (!isDragging || !isSelected) return
    e.stopPropagation()

    raycaster.current.setFromCamera(e.pointer, camera)
    const intersectPoint = new THREE.Vector3()
    raycaster.current.ray.intersectPlane(dragPlane.current, intersectPoint)

    const newPosition = intersectPoint.sub(offset.current)
    onPositionChange(index, [newPosition.x, position[1], newPosition.z])
  }

  const handlePointerUp = (e) => {
    if (!isDragging) return
    setIsDragging(false)
    gl.domElement.releasePointerCapture(e.pointerId)
  }

  const fileToLoad = character.file || character

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* 选中人物的蓝色边缘光效果 */}
      {isSelected && (
        <>
          {/* 底部光环 */}
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.6, 0.8, 32]} />
            <meshBasicMaterial color="#00d4ff" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
          {/* 内部光环 */}
          <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.4, 0.55, 32]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>
          {/* 垂直光柱 */}
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.3, 0.5, 1.6, 16, 1, true]} />
            <meshBasicMaterial color="#00d4ff" transparent opacity={0.15} side={THREE.DoubleSide} />
          </mesh>
          {/* 顶部光点 */}
          <mesh position={[0, 1.7, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.8} />
          </mesh>
          {/* 拖拽提示 - 选中时显示 */}
          <mesh position={[0, 2.0, 0]}>
            <planeGeometry args={[0.8, 0.2]} />
            <meshBasicMaterial color="#00d4ff" transparent opacity={0.3} />
          </mesh>
        </>
      )}
      <CharacterController
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        selectedFile={fileToLoad}
        scale={characterScale * (isSelected ? 1.1 : 0.9)}
        actionIntensity={actionIntensity}
      />
      {/* 道具显示在角色身上 */}
      <PropDisplay propId={propId} />
    </group>
  )
}

// ==================== 9. 3D场景内容 ====================
const ARContent = ({ characters, selectedCharacterIndex, characterScale, actionIntensity, isARMode, characterPositions, onPositionChange, characterProps }) => {
  return (
    <>
      {/* AR模式下不显示背景特效，避免挡住摄像头画面 */}
      {!isARMode && (
        <>
          <ParticleField />
          <DynamicBackground />
          <FloatingDecorations />
        </>
      )}
      
      {/* 渲染所有已加载的角色 */}
      {characters.map((character, index) => {
        if (!character) return null
        
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
              characterScale={characterScale}
              actionIntensity={actionIntensity}
              onPositionChange={onPositionChange}
              propId={propId}
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
  const [showHelp, setShowHelp] = useState(true) // 默认显示帮助
  const [comboCount, setComboCount] = useState(0)
  const [showCombo, setShowCombo] = useState(false)
  
  // 画布旋转状态
  const [canvasRotation, setCanvasRotation] = useState(0)
  const [isRotating, setIsRotating] = useState(false)
  
  // 角色位置状态 - 支持拖拽移动
  const [characterPositions, setCharacterPositions] = useState([
    [-1.5, 0, 0],  // 角色0初始位置
    [0, 0, 0],     // 角色1初始位置
    [1.5, 0, 0]    // 角色2初始位置
  ])

  // 道具列表
  const propList = [
    { id: 'none', name: '无道具', icon: '❌', color: '#666' },
    { id: 'sword', name: '剑', icon: '⚔️', color: '#silver' },
    { id: 'shield', name: '盾牌', icon: '🛡️', color: '#4a90d9' },
    { id: 'wand', name: '魔杖', icon: '🪄', color: '#9b59b6' },
    { id: 'book', name: '书', icon: '📖', color: '#e67e22' },
    { id: 'flower', name: '花', icon: '🌸', color: '#ff69b4' },
    { id: 'crown', name: '皇冠', icon: '👑', color: '#ffd700' },
    { id: 'glasses', name: '眼镜', icon: '👓', color: '#34495e' },
    { id: 'hat', name: '帽子', icon: '🎩', color: '#2c3e50' },
    { id: 'microphone', name: '麦克风', icon: '🎤', color: '#e74c3c' },
    { id: 'camera', name: '相机', icon: '📷', color: '#3498db' },
    { id: 'balloon', name: '气球', icon: '🎈', color: '#e91e63' },
    { id: 'gift', name: '礼物', icon: '🎁', color: '#ff5722' },
    { id: 'umbrella', name: '伞', icon: '☂️', color: '#9c27b0' }
  ]

  // 角色道具状态 - 每个角色可以选择一个道具
  const [characterProps, setCharacterProps] = useState([null, null, null])
  const [showPropSelect, setShowPropSelect] = useState(false)
  const [propTargetCharacter, setPropTargetCharacter] = useState(0)

  // 动作列表 - 包含基础动作和大幅度复杂动作
  const actionList = [
    // 基础动作
    { name: '待机', action: 'idle', icon: '😌', category: 'basic' },
    { name: '挥手', action: 'wave', icon: '👋', category: 'basic' },
    { name: '跳舞', action: 'dance', icon: '💃', category: 'basic' },
    { name: '跳跃', action: 'jump', icon: '⬆️', category: 'basic' },
    { name: '坐下', action: 'sit', icon: '🪑', category: 'basic' },
    { name: '奔跑', action: 'run', icon: '🏃', category: 'basic' },
    // 表情动作
    { name: '开心', action: 'happy', icon: '😄', category: 'emotion' },
    { name: '伤心', action: 'sad', icon: '😢', category: 'emotion' },
    { name: '生气', action: 'angry', icon: '😠', category: 'emotion' },
    { name: '惊讶', action: 'surprise', icon: '😲', category: 'emotion' },
    { name: '爱心', action: 'love', icon: '😍', category: 'emotion' },
    { name: '睡觉', action: 'sleep', icon: '😴', category: 'emotion' },
    // 日常动作
    { name: '吃东西', action: 'eat', icon: '🍰', category: 'daily' },
    { name: '看书', action: 'read', icon: '📖', category: 'daily' },
    { name: '唱歌', action: 'sing', icon: '🎤', category: 'daily' },
    { name: '拍照', action: 'photo', icon: '📸', category: 'daily' },
    // 大幅度特殊动作 ⭐
    { name: '拿书', action: 'takeBook', icon: '📚', category: 'dramatic', highlight: true },
    { name: '翻跟头', action: 'somersault', icon: '🤸', category: 'dramatic', highlight: true },
    { name: '大跳跃', action: 'superJump', icon: '🚀', category: 'dramatic', highlight: true },
    { name: '旋转舞', action: 'spinDance', icon: '🌪️', category: 'dramatic', highlight: true },
    { name: '大挥手', action: 'bigWave', icon: '👋✨', category: 'dramatic', highlight: true },
    { name: '鞠躬', action: 'bow', icon: '🙇', category: 'dramatic', highlight: true },
    { name: '庆祝', action: 'celebrate', icon: '🎉', category: 'dramatic', highlight: true },
    // 系统动作
    { name: '连击', action: 'combo', icon: '✨', category: 'system' },
    { name: '随机', action: 'random', icon: '🎲', category: 'system' }
  ]

  // 显示通知
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type })
  }, [])

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

  // 执行动作 - 立即响应
  const executeAction = useCallback((action) => {
    // 立即 dispatch 事件，让角色先动起来
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('executeAction', { detail: { action, intensity: actionIntensity } }))
    }
    
    // 同时更新 UI 状态
    setCurrentAction(action)
    
    if (action === 'combo') {
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
  }, [actionIntensity])

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

  // 拍照
  const takePhoto = useCallback(() => {
    try {
      // 获取3D画布元素
      const canvas3D = document.querySelector('canvas')
      const video = videoRef.current

      if (!canvas3D) {
        showNotification('3D场景未就绪', 'error')
        return
      }

      // 创建合成画布
      const compositeCanvas = document.createElement('canvas')
      const ctx = compositeCanvas.getContext('2d')

      // 设置画布尺寸
      const width = window.innerWidth
      const height = window.innerHeight
      compositeCanvas.width = width
      compositeCanvas.height = height

      // 如果在AR模式下，先绘制摄像头画面
      if (isARMode && video && video.readyState >= 2) {
        // 计算视频绘制尺寸（保持比例填充屏幕）
        const videoRatio = video.videoWidth / video.videoHeight
        const screenRatio = width / height
        let drawWidth, drawHeight, drawX, drawY

        if (videoRatio > screenRatio) {
          drawHeight = height
          drawWidth = height * videoRatio
          drawX = (width - drawWidth) / 2
          drawY = 0
        } else {
          drawWidth = width
          drawHeight = width / videoRatio
          drawX = 0
          drawY = (height - drawHeight) / 2
        }

        ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight)
      } else {
        // 非AR模式下填充黑色背景
        ctx.fillStyle = '#0f172a'
        ctx.fillRect(0, 0, width, height)
      }

      // 绘制3D场景（带透明通道）
      ctx.drawImage(canvas3D, 0, 0, width, height)

      // 添加水印
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.font = '16px Arial'
      ctx.fillText('AR Photo - ' + new Date().toLocaleString(), 20, height - 20)

      // 下载图片
      compositeCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ar-photo-${Date.now()}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        showNotification('拍照成功!已保存模型和背景', 'success')
      })
    } catch (error) {
      console.error('拍照失败:', error)
      showNotification('拍照失败', 'error')
    }
  }, [showNotification, isARMode])

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

      {/* 3D画布 - AR模式下背景透明 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        background: isARMode ? 'transparent' : 'linear-gradient(to bottom, #0f172a 0%, #1e293b 100%)'
      }}>
        <Canvas gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }} style={{ background: 'transparent' }}>
          <PerspectiveCamera makeDefault position={[0, 0.8, 2.5]} fov={50} />
          <ambientLight intensity={0.8} />
          <spotLight position={[5, 10, 5]} intensity={1.2} castShadow />
          <directionalLight position={[0, 5, 0]} intensity={0.6} />
          
          <ARContent 
            characters={characters}
            selectedCharacterIndex={selectedCharacterIndex}
            characterScale={characterScale}
            actionIntensity={actionIntensity}
            isARMode={isARMode}
            characterPositions={characterPositions}
            characterProps={characterProps}
            onPositionChange={(index, newPos) => {
              setCharacterPositions(prev => {
                const updated = [...prev]
                updated[index] = newPos
                return updated
              })
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
          gap: isMobile ? '8px' : '12px'
        }}>
          <TechButton
            onClick={() => setShowSettings(!showSettings)}
            active={showSettings}
            size="small"
            isMobile={isMobile}
          >
            ⚙️
          </TechButton>

          <TechButton
            onClick={toggleSwingMode}
            active={isSwingMode}
            size="small"
            isMobile={isMobile}
          >
            📱
          </TechButton>

          <TechButton
            onClick={toggleCamera}
            size="small"
            isMobile={isMobile}
          >
            🔄
          </TechButton>

          <TechButton
            onClick={() => setIsARMode(!isARMode)}
            active={!isARMode}
            size="small"
            isMobile={isMobile}
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
        left: isMobile ? '8px' : '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '8px' : '16px',
        zIndex: 100,
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.6) 100%)',
        padding: isMobile ? '10px' : '20px',
        borderRadius: isMobile ? '16px' : '28px',
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
            isMobile={isMobile}
          />
        ))}

        <button
          onClick={() => setShowModelSelect(true)}
          style={{
            width: isMobile ? '40px' : '70px',
            height: isMobile ? '40px' : '70px',
            borderRadius: isMobile ? '14px' : '22px',
            background: 'linear-gradient(135deg, rgba(255, 158, 205, 0.3) 0%, rgba(255, 107, 157, 0.3) 100%)',
            border: '2px dashed rgba(255, 184, 208, 0.5)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '20px' : '28px',
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

      {/* 道具选择弹窗 */}
      {showPropSelect && (
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
              marginBottom: '16px'
            }}>
              <h2 style={{ color: 'white', margin: 0, fontSize: '24px' }}>选择道具</h2>
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

            {/* 选择目标角色 */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '12px', fontSize: '14px' }}>选择要给哪个角色：</p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {[0, 1, 2].map(index => (
                  <button
                    key={index}
                    onClick={() => setPropTargetCharacter(index)}
                    style={{
                      padding: '10px 20px',
                      background: propTargetCharacter === index
                        ? 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)'
                        : 'rgba(255,255,255,0.1)',
                      border: `2px solid ${propTargetCharacter === index ? '#ff6b9d' : 'rgba(255,255,255,0.2)'}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: propTargetCharacter === index ? 'bold' : 'normal'
                    }}
                  >
                    角色 {index + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* 道具列表 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: '12px'
            }}>
              {propList.map((prop) => (
                <button
                  key={prop.id}
                  onClick={() => {
                    setCharacterProps(prev => {
                      const updated = [...prev]
                      updated[propTargetCharacter] = prop.id === 'none' ? null : prop.id
                      return updated
                    })
                    setShowPropSelect(false)
                    showNotification(`给角色${propTargetCharacter + 1}装备了${prop.name}`, 'success')
                  }}
                  style={{
                    padding: '16px',
                    background: characterProps[propTargetCharacter] === prop.id || (prop.id === 'none' && !characterProps[propTargetCharacter])
                      ? `linear-gradient(135deg, ${prop.color}40 0%, ${prop.color}20 100%)`
                      : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    border: `2px solid ${characterProps[propTargetCharacter] === prop.id || (prop.id === 'none' && !characterProps[propTargetCharacter]) ? prop.color : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                    color: 'white'
                  }}
                >
                  <div style={{ fontSize: '36px' }}>{prop.icon}</div>
                  <div style={{ fontSize: '12px', fontWeight: '600' }}>{prop.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 游戏帮助弹窗 */}
      {showHelp && (
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
            borderRadius: '32px',
            padding: isMobile ? '24px' : '40px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '85vh',
            overflow: 'auto',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 25px 80px rgba(0,0,0,0.6)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                color: 'white',
                margin: 0,
                fontSize: isMobile ? '20px' : '28px',
                background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>🎮 游戏帮助</h2>
              <button
                onClick={() => setShowHelp(false)}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 操作1：点击 */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                padding: '16px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  flexShrink: 0
                }}>👆</div>
                <div>
                  <h3 style={{ color: 'white', margin: '0 0 6px 0', fontSize: '16px' }}>点击</h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: '13px', lineHeight: '1.5' }}>
                    点击角色可以选中/取消选中，选中后角色会有蓝色光环。点击角色还可以触发互动反馈
                  </p>
                </div>
              </div>

              {/* 操作2：双指滑动 */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                padding: '16px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  flexShrink: 0
                }}>👆👆</div>
                <div>
                  <h3 style={{ color: 'white', margin: '0 0 6px 0', fontSize: '16px' }}>双指滑动</h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: '13px', lineHeight: '1.5' }}>
                    选中角色后，使用双指滑动可以移动角色位置。双指捏合可以缩放角色大小
                  </p>
                </div>
              </div>

              {/* 操作3：长按 */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                padding: '16px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #ffd93d 0%, #ffb347 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  flexShrink: 0
                }}>⏱️</div>
                <div>
                  <h3 style={{ color: 'white', margin: '0 0 6px 0', fontSize: '16px' }}>长按</h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: '13px', lineHeight: '1.5' }}>
                    长按角色可以触发特殊动作或表情，松开手指后动作结束
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              style={{
                width: '100%',
                marginTop: '24px',
                padding: '16px',
                background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
                border: 'none',
                borderRadius: '16px',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 24px rgba(255, 107, 157, 0.4)'
              }}
            >
              开始游戏 🎮
            </button>
          </div>
        </div>
      )}

      {/* 右侧控制按钮 */}
      <div style={{
        position: 'absolute',
        right: isMobile ? '8px' : '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '8px' : '16px',
        zIndex: 100,
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.6) 100%)',
        padding: isMobile ? '10px' : '20px',
        borderRadius: isMobile ? '16px' : '28px',
        backdropFilter: 'blur(15px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <TechButton onClick={takePhoto} size={isMobile ? 'small' : 'medium'} isMobile={isMobile}>📸</TechButton>

        <TechButton
          onClick={isRecording ? stopRecording : startRecording}
          active={isRecording}
          size={isMobile ? 'small' : 'medium'}
          isMobile={isMobile}
        >
          {isRecording ? '⏹️' : '🎥'}
        </TechButton>

        {isRecording && (
          <div style={{
            position: 'absolute',
            right: isMobile ? '60px' : '90px',
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
            color: 'white',
            padding: isMobile ? '4px 10px' : '8px 16px',
            borderRadius: '20px',
            fontSize: isMobile ? '12px' : '14px',
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
          size={isMobile ? 'small' : 'medium'}
          isMobile={isMobile}
        >
          🎲
        </TechButton>

        {/* 道具选择按钮 */}
        <TechButton
          onClick={() => {
            setPropTargetCharacter(selectedCharacterIndex)
            setShowPropSelect(true)
          }}
          active={showPropSelect}
          size={isMobile ? 'small' : 'medium'}
          isMobile={isMobile}
        >
          🎁
        </TechButton>

        {/* 旋转画布按钮 */}
        <TechButton
          onClick={rotateCanvas}
          active={isRotating}
          size={isMobile ? 'small' : 'medium'}
          isMobile={isMobile}
        >
          🔄
        </TechButton>
      </div>

      {/* 底部动作栏 */}
      <div style={{
        position: 'absolute',
        bottom: isMobile ? '8px' : '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: isMobile ? '6px' : '12px',
        zIndex: 100,
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%)',
        padding: isMobile ? '8px 12px' : '16px 24px',
        borderRadius: isMobile ? '20px' : '32px',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
        maxWidth: isMobile ? '85vw' : '90vw',
        overflowX: 'auto'
      }}>
        {actionList.map((item, index) => (
          <ActionButton
            key={item.action}
            item={item}
            index={index}
            isActive={currentAction === item.action}
            onClick={() => executeAction(item.action)}
            isMobile={isMobile}
          />
        ))}
      </div>
      
      {/* 隐藏的画布 */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default ARScene
