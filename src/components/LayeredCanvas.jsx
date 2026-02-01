import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Stars, Cloud, Html } from '@react-three/drei'
import * as THREE from 'three'

/**
 * 分层画布系统
 * 
 * 架构:
 * - BackgroundLayer: 背景层 (渐变、场景模板、粒子效果)
 * - ModelLayer: 模型层 (VRM角色、家具、道具) - 录像/拍照只捕获这层
 * - EffectsLayer: 特效层 (滤镜、后期处理)
 * - UILayer: UI层 (控制面板)
 */

// ==================== 背景层组件 ====================
export const BackgroundLayer = ({ 
  isARMode, 
  videoRef, 
  stageEffects,
  showParticles,
  particleType
}) => {
  if (isARMode) {
    return (
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
    )
  }

  // 非AR模式 - 显示渐变背景
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 0,
      background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #16213e 100%)'
    }}>
      {/* 背景粒子效果 */}
      <BackgroundParticles 
        enabled={showParticles} 
        type={particleType}
        effects={stageEffects}
      />
    </div>
  )
}

// 背景粒子系统
const BackgroundParticles = ({ enabled, type, effects }) => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const particlesRef = useRef([])

  useEffect(() => {
    if (!enabled || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // 初始化粒子
    const particleCount = effects?.particles?.intensity ? effects.particles.intensity * 2 : 100
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: Math.random() * 0.5 + 0.2,
      opacity: Math.random() * 0.5 + 0.2
    }))

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particlesRef.current.forEach(p => {
        // 更新位置
        p.x += p.speedX
        p.y += p.speedY

        // 边界检查
        if (p.y > canvas.height) {
          p.y = 0
          p.x = Math.random() * canvas.width
        }
        if (p.x > canvas.width) p.x = 0
        if (p.x < 0) p.x = canvas.width

        // 绘制粒子
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`
        ctx.fill()
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [enabled, type, effects])

  if (!enabled) return null

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }}
    />
  )
}

// ==================== 模型层组件 ====================
export const ModelLayer = ({
  children,
  glRef,
  onCreated,
  isARMode,
  stageEffects
}) => {
  return (
    <div 
      id="model-canvas-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1,
        background: 'transparent',
        filter: stageEffects?.filter?.enabled ? getFilterCSS(stageEffects.filter) : 'none',
        transition: 'filter 0.3s ease'
      }}
    >
      <Canvas
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true
        }}
        style={{ background: 'transparent' }}
        onCreated={({ gl, scene, camera }) => {
          glRef.current = gl
          if (onCreated) onCreated({ gl, scene, camera })
        }}
        dpr={window.devicePixelRatio}
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
        
        {/* AR模式下的特效 - 使用additive混合 */}
        {isARMode && stageEffects?.particles?.enabled && (
          <AREffects effects={stageEffects} />
        )}
        
        {children}
        
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
  )
}

// AR模式特效 - 使用additive混合不遮挡视频
const AREffects = ({ effects }) => {
  const groupRef = useRef()
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1
    }
  })

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

// ==================== 录像捕获工具 ====================
export const captureModelLayer = (canvas) => {
  if (!canvas) return null
  
  try {
    // 只捕获模型层，背景透明
    const dataURL = canvas.toDataURL('image/png')
    return dataURL
  } catch (e) {
    console.error('捕获失败:', e)
    return null
  }
}

export const startModelRecording = (canvas, onDataAvailable) => {
  if (!canvas) return null

  try {
    const stream = canvas.captureStream(60)
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5000000
    })

    const chunks = []
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data)
        if (onDataAvailable) {
          onDataAvailable(e.data)
        }
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      return blob
    }

    return { mediaRecorder, stream }
  } catch (e) {
    console.error('录制初始化失败:', e)
    return null
  }
}
