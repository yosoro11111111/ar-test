import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette, ChromaticAberration, Glitch, Noise, Pixelation } from '@react-three/postprocessing'
import { BlendFunction, GlitchMode } from 'postprocessing'
import * as THREE from 'three'

// 相机模式
export const CameraMode = {
  ORBIT: 'orbit',
  CINEMATIC: 'cinematic',
  FOLLOW: 'follow',
  FIXED: 'fixed',
  PANORAMIC: 'panoramic',
  DRAMA: 'drama'
}

// 场景区域类型
export const ZoneType = {
  MAIN_STAGE: 'main_stage',
  BACKGROUND: 'background',
  FOREGROUND: 'foreground',
  AMBIENT: 'ambient',
  INTERACTIVE: 'interactive'
}

// 光照类型
export const LightType = {
  AMBIENT: 'ambient',
  DIRECTIONAL: 'directional',
  SPOT: 'spot',
  POINT: 'point',
  HEMISPHERE: 'hemisphere',
  RECT_AREA: 'rect_area'
}

// 高级3D场景组件
const AdvancedScene = ({
  sceneConfig = {},
  onSceneChange,
  children
}) => {
  const { scene, camera, gl } = useThree()
  const groupRef = useRef()

  // 场景状态
  const [sceneState, setSceneState] = useState({
    currentZone: ZoneType.MAIN_STAGE,
    timeOfDay: 0.5,
    weather: 'clear',
    season: 'spring',
    mood: 'neutral',
    transitionProgress: 1
  })

  // 初始化场景
  useEffect(() => {
    if (sceneConfig.environment) {
      setupEnvironment(sceneConfig.environment)
    }
    return () => {
      cleanupScene()
    }
  }, [sceneConfig])

  const setupEnvironment = useCallback((envConfig) => {
    if (!envConfig) return

    // 设置雾效
    if (envConfig.fog?.enabled) {
      scene.fog = new THREE.FogExp2(
        envConfig.fog.color || '#000000',
        envConfig.fog.density || 0.02
      )
    } else {
      scene.fog = null
    }

    // 设置环境光
    const ambientLight = scene.getObjectByName('ambientLight')
    if (ambientLight && envConfig.lighting?.ambient !== undefined) {
      ambientLight.intensity = envConfig.lighting.ambient
    }

    // 设置天空盒
    if (envConfig.background) {
      if (typeof envConfig.background === 'string') {
        scene.background = new THREE.Color(envConfig.background)
      } else if (envConfig.background.texture) {
        const textureLoader = new THREE.TextureLoader()
        textureLoader.load(envConfig.background.texture, (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping
          scene.background = texture
        })
      }
    }

    onSceneChange?.(sceneState)
  }, [scene, sceneState, onSceneChange])

  const cleanupScene = useCallback(() => {
    scene.fog = null
    scene.background = null
  }, [scene])

  return (
    <group ref={groupRef}>
      {children}
    </group>
  )
}

// 动态天空组件
const DynamicSky = ({ timeOfDay = 0.5, weather = 'clear' }) => {
  const skyRef = useRef()
  const sunRef = useRef()

  useFrame((state, delta) => {
    if (skyRef.current) {
      const hue = 0.6 + timeOfDay * 0.1
      const saturation = 0.3 + (weather === 'sunny' ? 0.3 : 0)
      const lightness = 0.1 + timeOfDay * 0.4

      skyRef.current.material.uniforms.topColor.value.setHSL(hue, saturation, lightness + 0.3)
      skyRef.current.material.uniforms.bottomColor.value.setHSL(hue, saturation, lightness)
    }

    if (sunRef.current) {
      const sunAngle = Math.PI * (timeOfDay - 0.5)
      sunRef.current.position.set(
        Math.cos(sunAngle) * 50,
        Math.sin(sunAngle) * 50,
        10
      )
    }
  })

  return (
    <group>
      <mesh ref={skyRef} position={[0, 0, -100]} scale={[200, 200, 200]}>
        <sphereGeometry args={[1, 32, 32]} />
        <shaderMaterial
          side={THREE.BackSide}
          uniforms={{
            topColor: { value: new THREE.Color('#0077ff') },
            bottomColor: { value: new THREE.Color('#ffffff') },
            offset: { value: 33 },
            exponent: { value: 0.6 }
          }}
          vertexShader={`
            varying vec3 vWorldPosition;
            void main() {
              vec4 worldPosition = modelMatrix * vec4(position, 1.0);
              vWorldPosition = worldPosition.xyz;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float offset;
            uniform float exponent;
            varying vec3 vWorldPosition;
            void main() {
              float h = normalize(vWorldPosition + offset).y;
              gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
            }
          `}
        />
      </mesh>
      <directionalLight ref={sunRef} intensity={1} castShadow />
    </group>
  )
}

// 高级灯光系统
const AdvancedLighting = ({
  config = {},
  timeOfDay = 0.5,
  enableShadows = true
}) => {
  const ambientRef = useRef()
  const mainRef = useRef()
  const fillRef = useRef()
  const backRef = useRef()
  const rimRef = useRef()

  useFrame(() => {
    const sunAngle = Math.PI * (timeOfDay - 0.5)
    const sunHeight = Math.sin(sunAngle)

    if (ambientRef.current) {
      const nightIntensity = Math.max(0.1, sunHeight * 0.5 + 0.3)
      ambientRef.current.intensity = config.ambientIntensity || 0.5 * nightIntensity
    }

    if (mainRef.current) {
      mainRef.current.position.set(
        Math.cos(sunAngle) * 10,
        Math.max(2, sunHeight * 10),
        Math.sin(sunAngle) * 5
      )
      const dayIntensity = Math.max(0.3, sunHeight + 0.3)
      mainRef.current.intensity = (config.mainIntensity || 1) * dayIntensity
    }

    if (fillRef.current) {
      fillRef.current.intensity = (config.fillIntensity || 0.3) * (sunHeight + 0.5)
    }

    if (backRef.current) {
      backRef.current.intensity = (config.backIntensity || 0.4) * (1 - sunHeight * 0.5)
    }

    if (rimRef.current) {
      rimRef.current.intensity = config.rimIntensity || 0.6
    }
  })

  return (
    <group>
      <ambientLight ref={ambientRef} intensity={0.4} color="#b4c6e0" />

      <directionalLight
        ref={mainRef}
        intensity={1}
        color={timeOfDay > 0.3 && timeOfDay < 0.7 ? '#fff5e6' : '#ffe4c4'}
        castShadow={enableShadows}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      <directionalLight
        ref={fillRef}
        position={[-5, 3, 5]}
        intensity={0.3}
        color="#c4d4e0"
      />

      <directionalLight
        ref={backRef}
        position={[0, 5, -10]}
        intensity={0.4}
        color="#ffe4c4"
      />

      <spotLight
        ref={rimRef}
        position={[0, 8, -5]}
        angle={0.5}
        penumbra={0.5}
        intensity={0.6}
        color="#ffffff"
        castShadow={enableShadows}
      />
    </group>
  )
}

// 粒子系统
const ParticleSystem = ({
  type = 'dust',
  count = 100,
  color = '#ffffff',
  speed = 0.1,
  size = 0.05,
  area = [10, 10, 10]
}) => {
  const pointsRef = useRef()
  const velocitiesRef = useRef([])

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    velocitiesRef.current = []

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * area[0]
      positions[i * 3 + 1] = (Math.random() - 0.5) * area[1]
      positions[i * 3 + 2] = (Math.random() - 0.5) * area[2]

      velocitiesRef.current.push({
        x: (Math.random() - 0.5) * speed,
        y: (Math.random() - 0.5) * speed * 0.5,
        z: (Math.random() - 0.5) * speed
      })

      const particleColor = new THREE.Color(color)
      colors[i * 3] = particleColor.r
      colors[i * 3 + 1] = particleColor.g
      colors[i * 3 + 2] = particleColor.b
    }

    return { positions, colors }
  }, [count, color, speed, area])

  useFrame((state, delta) => {
    if (!pointsRef.current) return

    const positions = pointsRef.current.geometry.attributes.position.array

    for (let i = 0; i < count; i++) {
      positions[i * 3] += velocitiesRef.current[i].x * delta
      positions[i * 3 + 1] += velocitiesRef.current[i].y * delta + delta * 0.2
      positions[i * 3 + 2] += velocitiesRef.current[i].z * delta

      if (positions[i * 3 + 1] > area[1] / 2) {
        positions[i * 3 + 1] = -area[1] / 2
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

// 樱花粒子
const SakuraParticles = ({ count = 50 }) => {
  const groupRef = useRef()
  const petalsRef = useRef([])

  const petals = useMemo(() => {
    return new Array(count).fill(null).map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 15,
        Math.random() * 10 + 5,
        (Math.random() - 0.5) * 10
      ],
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
      velocity: [
        (Math.random() - 0.5) * 0.02,
        -Math.random() * 0.02 - 0.01,
        (Math.random() - 0.5) * 0.02
      ],
      rotationSpeed: [
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      ],
      scale: 0.1 + Math.random() * 0.15
    }))
  }, [count])

  useFrame((state, delta) => {
    if (!groupRef.current) return

    groupRef.current.children.forEach((petal, i) => {
      const petalData = petals[i]

      petal.position.x += petalData.velocity.x
      petal.position.y += petalData.velocity.y
      petal.position.z += petalData.velocity.z

      petal.rotation.x += petalData.rotationSpeed.x
      petal.rotation.y += petalData.rotationSpeed.y
      petal.rotation.z += petalData.rotationSpeed.z

      if (petal.position.y < -5) {
        petal.position.y = 10
        petal.position.x = (Math.random() - 0.5) * 15
        petal.position.z = (Math.random() - 0.5) * 10
      }
    })
  })

  return (
    <group ref={groupRef}>
      {petals.map((petal, i) => (
        <mesh
          key={i}
          position={petal.position}
          rotation={petal.rotation}
          scale={[petal.scale, petal.scale, 0.1]}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial
            color="#ffb7c5"
            side={THREE.DoubleSide}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  )
}

// 星空背景
const StarField = ({ count = 500, radius = 100 }) => {
  const starsRef = useRef()

  const stars = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = radius * (0.8 + Math.random() * 0.2)

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      sizes[i] = 0.5 + Math.random() * 1.5

      const brightness = 0.5 + Math.random() * 0.5
      colors[i * 3] = brightness
      colors[i * 3 + 1] = brightness
      colors[i * 3 + 2] = brightness * (0.9 + Math.random() * 0.1)
    }

    return { positions, sizes, colors }
  }, [count, radius])

  useFrame((state, delta) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += delta * 0.01
    }
  })

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={stars.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={stars.sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={stars.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.5}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

// 电影级相机控制器
const CinematicCamera = ({
  mode = CameraMode.ORBIT,
  targetRef,
  autoRotate = true,
  rotationSpeed = 0.2,
  shakeIntensity = 0
}) => {
  const { camera } = useThree()
  const initialPosition = useRef(new THREE.Vector3())
  const shakeOffset = useRef(new THREE.Vector3())

  useEffect(() => {
    initialPosition.current.copy(camera.position)
  }, [])

  useFrame((state, delta) => {
    if (shakeIntensity > 0) {
      shakeOffset.current.set(
        (Math.random() - 0.5) * shakeIntensity,
        (Math.random() - 0.5) * shakeIntensity,
        (Math.random() - 0.5) * shakeIntensity * 0.5
      )
    } else {
      shakeOffset.current.set(0, 0, 0)
    }

    if (mode === CameraMode.CINEMATIC && autoRotate) {
      const time = state.clock.elapsedTime
      camera.position.x = initialPosition.current.x + Math.sin(time * rotationSpeed) * 0.3
      camera.position.z = initialPosition.current.z + Math.cos(time * rotationSpeed) * 0.3
      camera.lookAt(0, 1, 0)
    }

    if (mode === CameraMode.DRAMA) {
      camera.position.add(shakeOffset.current)
    }
  })

  return null
}

// 场景转换效果
const SceneTransition = ({ progress = 0, type = 'fade' }) => {
  const meshRef = useRef()

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.material.opacity = 1 - progress
    }
  })

  if (progress >= 1) return null

  return (
    <mesh ref={meshRef} position={[0, 0, 5]} scale={[20, 15, 1]}>
      <planeGeometry />
      <meshBasicMaterial
        color="#000000"
        transparent
        opacity={1 - progress}
      />
    </mesh>
  )
}

// 后期处理效果
const PostProcessingEffects = ({
  bloom = true,
  vignette = true,
  chromaticAberration = false,
  noise = false,
  pixelation = false,
  bloomIntensity = 0.5,
  vignetteIntensity = 0.4
}) => {
  return (
    <EffectComposer>
      {bloom && (
        <Bloom
          intensity={bloomIntensity}
          luminanceThreshold={0.8}
          luminanceSmoothing={0.9}
        />
      )}
      {vignette && (
        <Vignette
          offset={0.3}
          darkness={vignetteIntensity}
          blendFunction={BlendFunction.NORMAL}
        />
      )}
      {chromaticAberration && (
        <ChromaticAberration
          offset={[0.002, 0.002]}
          blendFunction={BlendFunction.NORMAL}
        />
      )}
      {noise && (
        <Noise
          premultiply
          blendFunction={BlendFunction.OVERLAY}
          opacity={0.1}
        />
      )}
      {pixelation && (
        <Pixelation
          granularity={4}
        />
      )}
    </EffectComposer>
  )
}

// 地面系统
const GroundSystem = ({
  type = 'plane',
  texture = null,
  color = '#2a2a3a',
  roughness = 0.8,
  metalness = 0.2,
  receiveShadow = true
}) => {
  const meshRef = useRef()

  return (
    <group>
      <mesh
        ref={meshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow={receiveShadow}
      >
        <planeGeometry args={[50, 50, 32, 32]} />
        <meshStandardMaterial
          color={color}
          roughness={roughness}
          metalness={metalness}
        />
      </mesh>
      <gridHelper args={[50, 50, '#3a3a4a', '#2a2a3a']} position={[0, 0, 0]} />
    </group>
  )
}

// 交互式道具
const InteractiveProp = ({
  position = [0, 0, 0],
  scale = [1, 1, 1],
  geometry = 'box',
  color = '#ff6b6b',
  onClick,
  onHover
}) => {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)

  const handlePointerOver = useCallback((e) => {
    e.stopPropagation()
    setHovered(true)
    onHover?.(true)
    document.body.style.cursor = 'pointer'
  }, [onHover])

  const handlePointerOut = useCallback((e) => {
    setHovered(false)
    onHover?.(false)
    document.body.style.cursor = 'default'
  }, [onHover])

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    onClick?.()
  }, [onClick])

  const GeometryComponent = {
    box: <boxGeometry />,
    sphere: <sphereGeometry args={[0.5, 32, 32]} />,
    cylinder: <cylinderGeometry args={[0.3, 0.3, 1, 32]} />,
    torus: <torusGeometry args={[0.4, 0.15, 16, 32]} />
  }[geometry] || <boxGeometry />

  useFrame((state, delta) => {
    if (meshRef.current && hovered) {
      meshRef.current.rotation.y += delta
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={hovered ? scale.map(s => s * 1.1) : scale}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      castShadow
    >
      {GeometryComponent}
      <meshStandardMaterial
        color={hovered ? '#ff8e8e' : color}
        metalness={0.3}
        roughness={0.4}
      />
    </mesh>
  )
}

// 区域系统
const ZoneManager = ({ zones = [], currentZone, onZoneChange }) => {
  return (
    <group>
      {zones.map((zone, index) => (
        <group key={zone.id}>
          {zone.type === ZoneType.BACKGROUND && (
            <mesh position={zone.position} scale={zone.scale}>
              <planeGeometry args={[20, 12]} />
              <meshBasicMaterial
                color={zone.color || '#1a1a2e'}
                transparent
                opacity={zone.opacity || 0.5}
              />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

// 场景配置预设
export const ScenePresets = {
  cinematic: {
    name: '电影感',
    icon: '🎬',
    camera: { position: [0, 1.5, 4], fov: 35 },
    lighting: {
      ambientIntensity: 0.3,
      mainIntensity: 1.2,
      fillIntensity: 0.2,
      rimIntensity: 0.8
    },
    effects: { bloom: true, vignette: true, chromaticAberration: true },
    background: '#0a0a15'
  },
  dreamy: {
    name: '梦幻',
    icon: '✨',
    camera: { position: [0, 1.2, 3], fov: 45 },
    lighting: {
      ambientIntensity: 0.6,
      mainIntensity: 0.8,
      fillIntensity: 0.4,
      rimIntensity: 0.5
    },
    effects: { bloom: true, vignette: false, chromaticAberration: true },
    background: '#1a1a3e'
  },
  studio: {
    name: '摄影棚',
    icon: '📸',
    camera: { position: [0, 1, 3], fov: 40 },
    lighting: {
      ambientIntensity: 0.5,
      mainIntensity: 1.5,
      fillIntensity: 0.5,
      rimIntensity: 1.0
    },
    effects: { bloom: true, vignette: true, chromaticAberration: false },
    background: '#151520'
  },
  nature: {
    name: '自然',
    icon: '🌿',
    camera: { position: [0, 1.3, 3.5], fov: 50 },
    lighting: {
      ambientIntensity: 0.7,
      mainIntensity: 1.0,
      fillIntensity: 0.4,
      rimIntensity: 0.4
    },
    effects: { bloom: false, vignette: true, chromaticAberration: false },
    background: '#1a2f1a'
  },
  neon: {
    name: '霓虹',
    icon: '🌃',
    camera: { position: [0, 1.2, 3.5], fov: 45 },
    lighting: {
      ambientIntensity: 0.2,
      mainIntensity: 0.8,
      fillIntensity: 0.3,
      rimIntensity: 1.2
    },
    effects: { bloom: true, vignette: true, chromaticAberration: true, noise: true },
    background: '#0a0a15'
  },
  minimal: {
    name: '极简',
    icon: '◻️',
    camera: { position: [0, 1, 3], fov: 50 },
    lighting: {
      ambientIntensity: 0.8,
      mainIntensity: 0.6,
      fillIntensity: 0.3,
      rimIntensity: 0.3
    },
    effects: { bloom: false, vignette: false, chromaticAberration: false },
    background: '#f0f0f0'
  }
}

// 主场景组件
const MainScene = ({
  config = ScenePresets.cinematic,
  showParticles = true,
  particleType = 'dust',
  showGround = true,
  showSky = true,
  showLighting = true,
  enablePostProcessing = true,
  children
}) => {
  return (
    <>
      {showSky && <DynamicSky timeOfDay={0.5} weather="clear" />}
      {showLighting && <AdvancedLighting config={config.lighting} />}
      {showGround && <GroundSystem type="plane" color="#2a2a3a" />}
      {showParticles && (
        particleType === 'sakura' ? <SakuraParticles count={50} /> :
        particleType === 'stars' ? <StarField count={300} /> :
        <ParticleSystem type={particleType} count={100} color="#ffffff" />
      )}
      {enablePostProcessing && <PostProcessingEffects {...config.effects} />}
      <CinematicCamera mode={CameraMode.CINEMATIC} autoRotate={false} />
      {children}
    </>
  )
}

// 场景面板组件
const ScenePanel = ({
  isOpen,
  onClose,
  currentConfig,
  onConfigChange
}) => {
  const [activeTab, setActiveTab] = useState('presets')
  const [customConfig, setCustomConfig] = useState(currentConfig || ScenePresets.cinematic)

  if (!isOpen) return null

  const handlePresetSelect = (presetKey) => {
    const preset = ScenePresets[presetKey]
    setCustomConfig(preset)
    onConfigChange?.(preset)
  }

  const handleLightingChange = (key, value) => {
    const newConfig = {
      ...customConfig,
      lighting: { ...customConfig.lighting, [key]: value }
    }
    setCustomConfig(newConfig)
    onConfigChange?.(newConfig)
  }

  const handleEffectToggle = (effect) => {
    const newConfig = {
      ...customConfig,
      effects: { ...customConfig.effects, [effect]: !customConfig.effects[effect] }
    }
    setCustomConfig(newConfig)
    onConfigChange?.(newConfig)
  }

  return (
    <div className="scene-panel-overlay">
      <div className="scene-panel">
        <div className="scene-panel-header">
          <h3>🎨 高级场景设置</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="scene-tabs">
          {['presets', 'lighting', 'effects', 'camera'].map(tab => (
            <button
              key={tab}
              className={activeTab === tab ? 'active' : ''}
              onClick={() => setActiveTab(tab)}
            >
              {{
                presets: '场景预设',
                lighting: '灯光',
                effects: '特效',
                camera: '相机'
              }[tab]}
            </button>
          ))}
        </div>

        <div className="scene-panel-content">
          {activeTab === 'presets' && (
            <div className="presets-grid">
              {Object.entries(ScenePresets).map(([key, preset]) => (
                <div
                  key={key}
                  className={`preset-card ${customConfig.name === preset.name ? 'active' : ''}`}
                  onClick={() => handlePresetSelect(key)}
                >
                  <span className="preset-icon">{preset.icon}</span>
                  <span className="preset-name">{preset.name}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'lighting' && (
            <div className="lighting-controls">
              <div className="control-group">
                <label>环境光强度</label>
                <input
                  type="range" min="0" max="1" step="0.1"
                  value={customConfig.lighting?.ambientIntensity || 0.5}
                  onChange={(e) => handleLightingChange('ambientIntensity', parseFloat(e.target.value))}
                />
              </div>
              <div className="control-group">
                <label>主光强度</label>
                <input
                  type="range" min="0" max="2" step="0.1"
                  value={customConfig.lighting?.mainIntensity || 1}
                  onChange={(e) => handleLightingChange('mainIntensity', parseFloat(e.target.value))}
                />
              </div>
              <div className="control-group">
                <label>补光强度</label>
                <input
                  type="range" min="0" max="1" step="0.1"
                  value={customConfig.lighting?.fillIntensity || 0.3}
                  onChange={(e) => handleLightingChange('fillIntensity', parseFloat(e.target.value))}
                />
              </div>
              <div className="control-group">
                <label>轮廓光强度</label>
                <input
                  type="range" min="0" max="1.5" step="0.1"
                  value={customConfig.lighting?.rimIntensity || 0.5}
                  onChange={(e) => handleLightingChange('rimIntensity', parseFloat(e.target.value))}
                />
              </div>
            </div>
          )}

          {activeTab === 'effects' && (
            <div className="effects-controls">
              {['bloom', 'vignette', 'chromaticAberration', 'noise', 'pixelation'].map(effect => (
                <div key={effect} className="effect-toggle">
                  <label>
                    <input
                      type="checkbox"
                      checked={customConfig.effects?.[effect] || false}
                      onChange={() => handleEffectToggle(effect)}
                    />
                    <span className="toggle-slider"></span>
                    <span>{{
                      bloom: '辉光效果',
                      vignette: '暗角效果',
                      chromaticAberration: '色差效果',
                      noise: '噪点效果',
                      pixelation: '像素化效果'
                    }[effect]}</span>
                  </label>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'camera' && (
            <div className="camera-controls">
              <div className="control-group">
                <label>视角位置</label>
                <div className="camera-presets">
                  <button onClick={() => onConfigChange?.({ ...customConfig, camera: { position: [0, 1.5, 4], fov: 35 } })}>
                    正面
                  </button>
                  <button onClick={() => onConfigChange?.({ ...customConfig, camera: { position: [3, 2, 3], fov: 45 } })}>
                    侧面
                  </button>
                  <button onClick={() => onConfigChange?.({ ...customConfig, camera: { position: [0, 3, 5], fov: 50 } })}>
                    俯视
                  </button>
                  <button onClick={() => onConfigChange?.({ ...customConfig, camera: { position: [-2, 1, 2], fov: 40 } })}>
                    斜视
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .scene-panel-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3000;
          backdrop-filter: blur(10px);
        }

        .scene-panel {
          background: linear-gradient(135deg, rgba(26, 26, 46, 0.98) 0%, rgba(22, 33, 62, 0.98) 100%);
          border-radius: 24px;
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
          overflow: hidden;
        }

        .scene-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .scene-panel-header h3 {
          margin: 0;
          color: white;
          font-size: 20px;
        }

        .close-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .close-btn:hover {
          background: rgba(255, 107, 107, 0.5);
          transform: rotate(90deg);
        }

        .scene-tabs {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          overflow-x: auto;
        }

        .scene-tabs button {
          padding: 10px 16px;
          border-radius: 10px;
          border: none;
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .scene-tabs button:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .scene-tabs button.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .scene-panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .presets-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .preset-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .preset-card:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-4px);
        }

        .preset-card.active {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.15);
        }

        .preset-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .preset-name {
          color: white;
          font-size: 13px;
          font-weight: 500;
        }

        .lighting-controls,
        .effects-controls,
        .camera-controls {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .control-group label {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
        }

        .control-group input[type="range"] {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.1);
          outline: none;
          -webkit-appearance: none;
        }

        .control-group input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          cursor: pointer;
        }

        .effect-toggle {
          display: flex;
          align-items: center;
        }

        .effect-toggle label {
          display: flex;
          align-items: center;
          gap: 12px;
          color: white;
          cursor: pointer;
        }

        .effect-toggle input {
          display: none;
        }

        .toggle-slider {
          width: 48px;
          height: 26px;
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.1);
          position: relative;
          transition: all 0.3s ease;
        }

        .toggle-slider::after {
          content: '';
          position: absolute;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: white;
          top: 2px;
          left: 2px;
          transition: all 0.3s ease;
        }

        .effect-toggle input:checked + .toggle-slider {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .effect-toggle input:checked + .toggle-slider::after {
          left: 24px;
        }

        .camera-presets {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .camera-presets button {
          padding: 12px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: white;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .camera-presets button:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: #667eea;
        }
      `}</style>
    </div>
  )
}

export {
  AdvancedScene,
  DynamicSky,
  AdvancedLighting,
  ParticleSystem,
  SakuraParticles,
  StarField,
  CinematicCamera,
  SceneTransition,
  PostProcessingEffects,
  GroundSystem,
  InteractiveProp,
  ZoneManager,
  MainScene,
  ScenePanel
}

export default MainScene
