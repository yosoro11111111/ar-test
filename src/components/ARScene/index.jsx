// AR场景组件 - 包含3D场景、角色、相机等
import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Stars, Cloud } from '@react-three/drei'
import * as THREE from 'three'
import { CharacterController } from '../CharacterSystem'
import { getSceneConfig } from '../../data/scenes'

// 场景环境组件
const SceneEnvironment = ({ sceneId }) => {
  const sceneConfig = getSceneConfig(sceneId)
  const { scene } = useThree()

  useEffect(() => {
    // 设置背景
    if (sceneConfig.background) {
      // 对于渐变背景，我们使用CSS设置，这里设置雾效
      scene.fog = new THREE.Fog(
        sceneConfig.fog?.color || '#1a1a2e',
        sceneConfig.fog?.near || 10,
        sceneConfig.fog?.far || 50
      )
    }

    // 设置光照
    switch (sceneConfig.lighting) {
      case 'warm':
        scene.background = new THREE.Color('#f5f5dc')
        break
      case 'bright':
        scene.background = new THREE.Color('#87CEEB')
        break
      case 'dark':
        scene.background = new THREE.Color('#000080')
        break
      case 'dim':
        scene.background = new THREE.Color('#228B22')
        break
      default:
        scene.background = new THREE.Color('#1a1a2e')
    }
  }, [scene, sceneConfig])

  return (
    <>
      {/* 环境光 */}
      <ambientLight intensity={sceneConfig.lighting === 'dark' ? 0.3 : 0.6} />

      {/* 主光源 */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={sceneConfig.lighting === 'dark' ? 0.5 : 1}
        castShadow
      />

      {/* 补光 */}
      <pointLight
        position={[-10, 10, -10]}
        intensity={0.5}
        color={sceneConfig.lighting === 'warm' ? '#ffaa00' : '#ffffff'}
      />

      {/* 星空效果 */}
      {sceneConfig.stars && (
        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
        />
      )}

      {/* 云朵效果 */}
      {sceneConfig.lighting === 'bright' && (
        <>
          <Cloud position={[-10, 6, -10]} speed={0.2} opacity={0.4} />
          <Cloud position={[10, 8, -5]} speed={0.3} opacity={0.3} />
        </>
      )}
    </>
  )
}

// AR场景主组件
const ARScene = ({
  isMobile,
  isARMode,
  sceneId,
  characters,
  selectedCharacterIndex,
  characterPositions,
  characterScales,
  characterRotations,
  characterProps,
  currentExpression,
  onSelectCharacter,
  onUpdatePosition,
  onUpdateScale,
  onUpdateRotation,
  videoRef,
  isBoneEditing,
  showCamera,
  onLoadingProgress
}) => {
  const controlsRef = useRef()
  const [loadingStates, setLoadingStates] = useState({})

  // 处理角色加载进度
  const handleCharacterLoad = (index, progress) => {
    setLoadingStates(prev => ({
      ...prev,
      [index]: progress
    }))
    onLoadingProgress?.(index, progress)
  }

  // 相机控制
  const CameraController = () => {
    const { camera } = useThree()

    useEffect(() => {
      camera.position.set(0, 1.5, 4)
      camera.lookAt(0, 1, 0)
    }, [camera])

    return null
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1
    }}>
      {/* AR模式视频背景 */}
      {isARMode && showCamera && (
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
            zIndex: 0,
            transform: 'scaleX(-1)' // 镜像翻转
          }}
        />
      )}

      {/* 3D场景 */}
      <Canvas
        shadows
        camera={{ position: [0, 1.5, 4], fov: 50 }}
        style={{
          background: isARMode ? 'transparent' : undefined,
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
        gl={{
          alpha: isARMode,
          antialias: true,
          preserveDrawingBuffer: true
        }}
      >
        <CameraController />

        {/* 场景环境 */}
        {!isARMode && <SceneEnvironment sceneId={sceneId} />}

        {/* 控制器 */}
        <OrbitControls
          ref={controlsRef}
          enablePan={!isMobile}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={10}
          target={[0, 1, 0]}
        />

        {/* 地面 - 只在非AR模式显示 */}
        {!isARMode && (
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial
              color="#2a2a4a"
              roughness={0.8}
              metalness={0.2}
            />
          </mesh>
        )}

        {/* 角色渲染 */}
        {characters.map((character, index) => {
          if (!character) return null

          return (
            <CharacterController
              key={`character-${index}`}
              modelPath={character.path || character}
              position={characterPositions[index] || [0, 0, 0]}
              scale={characterScales[index] || 1.2}
              rotation={characterRotations[index] || [0, 0, 0]}
              isSelected={selectedCharacterIndex === index}
              onSelect={() => onSelectCharacter(index)}
              onPositionChange={(pos) => onUpdatePosition(index, pos)}
              onScaleChange={(scale) => onUpdateScale(index, scale)}
              onRotationChange={(rot) => onUpdateRotation(index, rot)}
              isMobile={isMobile}
              isBoneEditing={isBoneEditing && selectedCharacterIndex === index}
              expression={selectedCharacterIndex === index ? currentExpression : 'neutral'}
              furniture={characterProps[index]}
              onLoadProgress={(progress) => handleCharacterLoad(index, progress)}
              characterIndex={index}
            />
          )
        })}
      </Canvas>

      {/* 加载进度显示 */}
      {Object.entries(loadingStates).map(([index, progress]) => (
        progress < 100 && (
          <div
            key={`loading-${index}`}
            style={{
              position: 'absolute',
              bottom: `${80 + parseInt(index) * 40}px`,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '8px 16px',
              background: 'rgba(0,0,0,0.7)',
              borderRadius: '20px',
              color: 'white',
              fontSize: '12px',
              zIndex: 10
            }}
          >
            角色{parseInt(index) + 1}加载中: {Math.round(progress)}%
          </div>
        )
      ))}
    </div>
  )
}

export default ARScene
