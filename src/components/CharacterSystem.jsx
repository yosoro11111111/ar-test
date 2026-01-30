import React, { useRef, useEffect, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm'
import { DragControls } from 'three/examples/jsm/controls/DragControls'

const ParticleSystem = ({ active, type, position }) => {
  const particlesRef = useRef()
  const [particles, setParticles] = useState([])
  const animationRef = useRef(null)

  useEffect(() => {
    if (!active) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    // 根据动作类型配置粒子
    const particleConfigs = {
      jump: { count: 40, color: '#60a5fa', speed: 0.15, spread: 2 },
      dance: { count: 60, color: '#a78bfa', speed: 0.08, spread: 1.5 },
      happy: { count: 50, color: '#fbbf24', speed: 0.1, spread: 1.8 },
      sad: { count: 30, color: '#60a5fa', speed: 0.05, spread: 1 },
      wave: { count: 25, color: '#34d399', speed: 0.12, spread: 1.2 },
      run: { count: 35, color: '#f87171', speed: 0.18, spread: 1.5 },
      sit: { count: 20, color: '#a78bfa', speed: 0.03, spread: 0.8 },
      default: { count: 30, color: '#ffffff', speed: 0.1, spread: 1.5 }
    }
    
    const config = particleConfigs[type] || particleConfigs.default
    const newParticles = []

    for (let i = 0; i < config.count; i++) {
      const angle = (Math.PI * 2 * i) / config.count
      const radius = Math.random() * config.spread
      
      const posX = position && position[0] !== undefined ? position[0] + Math.cos(angle) * radius : Math.cos(angle) * radius
      const posY = position && position[1] !== undefined ? position[1] + Math.random() * 0.5 : Math.random() * 0.5
      const posZ = position && position[2] !== undefined ? position[2] + Math.sin(angle) * radius : Math.sin(angle) * radius
      
      newParticles.push({
        position: new THREE.Vector3(posX, posY, posZ),
        velocity: new THREE.Vector3(
          Math.cos(angle) * config.speed * Math.random(),
          config.speed * (0.5 + Math.random() * 0.5),
          Math.sin(angle) * config.speed * Math.random()
        ),
        size: Math.random() * 0.1 + 0.02,
        life: 1.0,
        decay: 0.01 + Math.random() * 0.02,
        color: config.color,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1
      })
    }

    setParticles(newParticles)
    
    // 动画更新粒子
    const animate = () => {
      setParticles(prevParticles => {
        return prevParticles.map(p => {
          p.position.add(p.velocity)
          p.velocity.y -= 0.002 // 重力
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
      {particles.map((p, i) => (
        <mesh key={i} position={p.position} rotation={[0, 0, p.rotation]}>
          <planeGeometry args={[p.size, p.size]} />
          <meshBasicMaterial
            color={p.color}
            transparent
            opacity={p.life * 0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
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

const CharacterSystem = ({ position = [0, 0, 0], rotation = [0, 0, 0], selectedFile = null, onSwing = null }) => {
  const { scene, gl, camera } = useThree()
  const characterRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false)
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
  const loader = useRef(null)
  const dragControls = useRef(null)
  
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
    loader.current = new GLTFLoader()
    loader.current.register((parser) => new VRMLoaderPlugin(parser))
    loader.current.setCrossOrigin('anonymous')
  }, [])

  useEffect(() => {
    if (selectedFile) {
      loadVRMModel(selectedFile)
    }
  }, [selectedFile])

  const loadVRMModel = (file) => {
    try {
      setIsLoading(true)
      
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
      
      let modelUrl
      if (file.localPath) {
        modelUrl = file.localPath
      } else {
        if (file.size > 100 * 1024 * 1024) {
          console.error('模型文件过大，可能导致性能问题')
          setIsLoading(false)
          return
        }
        
        modelUrl = URL.createObjectURL(file)
        console.log('创建模型URL:', modelUrl)
      }
      
      loader.current.load(
        modelUrl,
        (gltf) => {
          try {
            console.log('GLTF加载完成:', gltf)
            
            if (!file.localPath) {
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
              setVrmModel(vrm)
              
              vrm.scene.position.set(0, 0, 0)
              vrm.scene.rotation.set(0, 0, 0)
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
              
              console.log('VRM模型加载完成')
            }
            
            setIsLoading(false)
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
          }
        },
        (progress) => {
          if (progress.lengthComputable) {
            const percentComplete = (progress.loaded / progress.total) * 100
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
          setIsLoading(false)
        }
      )
    } catch (error) {
      console.error('模型加载初始化失败:', error)
      setIsLoading(false)
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
  
  // 大幅度动作库
  const dramaticActions = {
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
    }
  }
  
  // 执行骨骼动画
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
    
    console.log('开始执行大幅度动作:', actionName)
    animationStartTime.current = Date.now()
    
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
      const easeProgress = 1 - Math.pow(1 - frameProgress, 3) // 缓动函数
      
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
        
        // 平滑应用到骨骼
        bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, targetX, 0.15)
        bone.rotation.y = THREE.MathUtils.lerp(bone.rotation.y, targetY, 0.15)
        bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, targetZ, 0.15)
      })
      
      // 继续动画或结束
      if (progress < 1) {
        currentBoneAnimation.current = requestAnimationFrame(animate)
      } else {
        console.log('动作完成:', actionName)
        currentBoneAnimation.current = null
        // 可选：自动返回idle
        setTimeout(() => {
          returnToIdle()
        }, 500)
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
    
    const feedbackElement = document.createElement('div')
    feedbackElement.style.position = 'fixed'
    feedbackElement.style.top = '50%'
    feedbackElement.style.left = '50%'
    feedbackElement.style.transform = 'translate(-50%, -50%)'
    feedbackElement.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    feedbackElement.style.color = 'white'
    feedbackElement.style.padding = '16px 32px'
    feedbackElement.style.borderRadius = '25px'
    feedbackElement.style.fontSize = '16px'
    feedbackElement.style.fontWeight = '700'
    feedbackElement.style.zIndex = '9999'
    feedbackElement.style.boxShadow = '0 10px 40px rgba(102, 126, 234, 0.5)'
    feedbackElement.style.backdropFilter = 'blur(10px)'
    feedbackElement.style.border = '2px solid rgba(255, 255, 255, 0.3)'
    feedbackElement.textContent = `✨ ${actionName} ✨`
    document.body.appendChild(feedbackElement)
    
    setTimeout(() => {
      feedbackElement.style.opacity = '0'
      feedbackElement.style.transition = 'opacity 0.3s ease'
      setTimeout(() => {
        document.body.removeChild(feedbackElement)
      }, 300)
    }, 800)
    
    setShowParticles(true)
    setTimeout(() => setShowParticles(false), 1500)
    
    // 检查是否是大幅度骨骼动画
    const dramaticActionNames = ['takeBook', 'somersault', 'superJump', 'spinDance', 'bigWave', 'bow', 'celebrate']
    if (dramaticActionNames.includes(actionName)) {
      // 使用骨骼动画系统
      executeBoneAnimation(actionName)
    } else {
      // 使用传统动画系统
      playModelAnimation(actionName)
    }
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
      currentAnimation.fadeOut(0.3)
    }
    
    const clipAction = animationMixer.clipAction(animation.animation)
    clipAction.setLoop(THREE.LoopRepeat)
    clipAction.reset()
    clipAction.fadeIn(0.5)
    clipAction.play()
    setCurrentAnimation(clipAction)
    setCurrentAnimationClip(animationName)
  }

  const handleTouchStart = (event) => {
    event.stopPropagation()
    touchStartTime.current = Date.now()
    
    const rect = gl.domElement.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    mouse.current.set(x, y)
    raycaster.current.setFromCamera(mouse.current, camera)
    
    if (characterRef.current) {
      const intersects = raycaster.current.intersectObject(characterRef.current, true)
      
      if (intersects.length > 0) {
        setIsTouching(true)
        setTouchPosition(intersects[0].point)
        
        setTouchFeedback({
          show: true,
          x: event.clientX,
          y: event.clientY
        })
        
        setTimeout(() => {
          setTouchFeedback({ show: false, x: 0, y: 0 })
        }, 500)
        
        if (vrmModel && vrmModel.expressionManager) {
          const expressions = ['happy', 'surprised', 'blink']
          const randomExpression = expressions[Math.floor(Math.random() * expressions.length)]
          vrmModel.expressionManager.setValue(randomExpression, 1)
          
          setTimeout(() => {
            vrmModel.expressionManager.setValue(randomExpression, 0)
          }, 800)
        }
        
        setShowParticles(true)
        setTimeout(() => setShowParticles(false), 1000)
      }
    }
  }

  const handleTouchEnd = (event) => {
    event.stopPropagation()
    const touchDuration = Date.now() - touchStartTime.current
    
    if (isTouching && touchDuration < 300) {
      const randomAnimations = modelAnimations.length > 0 ? modelAnimations : presetAnimations
      if (randomAnimations.length > 0) {
        const randomAnim = randomAnimations[Math.floor(Math.random() * randomAnimations.length)]
        executePresetAction(randomAnim.name || randomAnim.action)
      }
    }
    
    setIsTouching(false)
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
      const { actionName } = event.detail
      executePresetAction(actionName)
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

    const handleSwingDetected = (event) => {
      const { swingX, swingY, swingZ } = event.detail
      const swingMagnitude = Math.sqrt(swingX * swingX + swingY * swingY + swingZ * swingZ)
      
      const animations = modelAnimations.length > 0 ? modelAnimations : presetAnimations
      if (animations.length > 0) {
        const randomAnim = animations[Math.floor(Math.random() * animations.length)]
        executePresetAction(randomAnim.name || randomAnim.action)
      }
    }

    window.addEventListener('executeAction', handleExecuteAction)
    window.addEventListener('executeCombo', handleExecuteCombo)
    window.addEventListener('toggleRandom', handleToggleRandom)
    window.addEventListener('resetPosition', handleResetPosition)
    window.addEventListener('swingDetected', handleSwingDetected)

    return () => {
      window.removeEventListener('executeAction', handleExecuteAction)
      window.removeEventListener('executeCombo', handleExecuteCombo)
      window.removeEventListener('toggleRandom', handleToggleRandom)
      window.removeEventListener('resetPosition', handleResetPosition)
      window.removeEventListener('swingDetected', handleSwingDetected)
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
      
      if (vrmModel && typeof vrmModel.update === 'function') {
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
      
      if (characterRef.current && characterRef.current.scale) {
        breathePhase.current += delta * 2
        const breatheScale = 1 + Math.sin(breathePhase.current) * 0.012
        characterRef.current.scale.y *= breatheScale
      }
      
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
      if (vrmModel && vrmModel.humanoid && isLookingAtCamera) {
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
      if (vrmModel && vrmModel.humanoid && chibiMode) {
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
      if (followBones.current.length > 0 && characterRef.current) {
        followBones.current.forEach((boneData, index) => {
          if (boneData.bone && boneData.target) {
            const delay = boneData.delay || 0.1
            boneData.bone.position.lerp(boneData.target.position, delay)
            boneData.bone.rotation.x = THREE.MathUtils.lerp(boneData.bone.rotation.x, boneData.target.rotation.x, delay)
            boneData.bone.rotation.y = THREE.MathUtils.lerp(boneData.bone.rotation.y, boneData.target.rotation.y, delay)
            boneData.bone.rotation.z = THREE.MathUtils.lerp(boneData.bone.rotation.z, boneData.target.rotation.z, delay)
          }
        })
      }
      
      // 呼吸起伏动画 - 胸部和肩膀自然起伏（仅在idle状态时轻微呼吸）
      if (vrmModel && vrmModel.humanoid && currentActionType === 'idle') {
        try {
          const chestBone = vrmModel.humanoid.getNormalizedBoneNode('chest')
          const leftShoulder = vrmModel.humanoid.getNormalizedBoneNode('leftShoulder')
          const rightShoulder = vrmModel.humanoid.getNormalizedBoneNode('rightShoulder')
          
          const breatheTime = Date.now() * 0.001
          const breatheIntensity = 0.008 // 减小呼吸幅度
          
          if (chestBone) {
            // 胸部前后起伏
            chestBone.position.z = Math.sin(breatheTime * 2) * breatheIntensity
            chestBone.rotation.x = Math.sin(breatheTime * 2) * breatheIntensity * 0.5
          }
          
          if (leftShoulder) {
            leftShoulder.position.y = Math.sin(breatheTime * 2 + 0.2) * breatheIntensity * 0.5
          }
          
          if (rightShoulder) {
            rightShoulder.position.y = Math.sin(breatheTime * 2 + 0.2) * breatheIntensity * 0.5
          }
        } catch (error) {
          // 忽略呼吸动画错误
        }
      }
      
      // 微动作系统 - 随机小动作增加生动感（仅在idle状态下）
      if (microActionsEnabled && vrmModel && vrmModel.humanoid && currentActionType === 'idle') {
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
                // 耸肩
                const leftShoulder = vrmModel.humanoid.getNormalizedBoneNode('leftShoulder')
                const rightShoulder = vrmModel.humanoid.getNormalizedBoneNode('rightShoulder')
                if (leftShoulder && rightShoulder) {
                  leftShoulder.position.y += 0.02
                  rightShoulder.position.y += 0.02
                  setTimeout(() => {
                    if (leftShoulder) leftShoulder.position.y -= 0.02
                    if (rightShoulder) rightShoulder.position.y -= 0.02
                  }, 500)
                }
                break
              case 'weightShift':
                // 重心转移
                const hips = vrmModel.humanoid.getNormalizedBoneNode('hips')
                if (hips) {
                  hips.position.x = Math.sin(Date.now() * 0.001) * 0.02
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
      
      {touchFeedback.show && (
        <mesh position={[touchFeedback.x * 0.01, touchFeedback.y * 0.01, 2]}>
          <ringGeometry args={[0.3, 0.4, 32]} />
          <meshBasicMaterial color="white" transparent opacity={0.5} />
        </mesh>
      )}
      
      {isLoading && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshBasicMaterial color="#646cff" />
        </mesh>
      )}
    </>
  )
}

const CharacterController = ({ position = [0, 0, 0], rotation = [0, 0, 0], selectedFile = null, onSwing = null }) => {
  return (
    <group>
      <CharacterSystem 
        position={position} 
        rotation={rotation} 
        selectedFile={selectedFile} 
        onSwing={onSwing}
      />
    </group>
  )
}

export default CharacterSystem
export { CharacterController }
