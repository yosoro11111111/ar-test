import React, { useRef, useEffect, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm'
import { DragControls } from 'three/examples/jsm/controls/DragControls'

const ParticleSystem = ({ active, type, position }) => {
  const particlesRef = useRef()
  const [particles, setParticles] = useState([])

  useEffect(() => {
    if (!active) return

    const particleCount = type === 'jump' ? 30 : type === 'dance' ? 50 : type === 'happy' ? 40 : 20
    const newParticles = []

    for (let i = 0; i < particleCount; i++) {
      const posX = position && position[0] !== undefined ? position[0] + (Math.random() - 0.5) * 1.5 : (Math.random() - 0.5) * 1.5
      const posY = position && position[1] !== undefined ? position[1] + Math.random() * 1 : Math.random() * 1
      const posZ = position && position[2] !== undefined ? position[2] + (Math.random() - 0.5) * 1.5 : (Math.random() - 0.5) * 1.5
      
      newParticles.push({
        position: [posX, posY, posZ],
        velocity: [
          (Math.random() - 0.5) * 0.05,
          Math.random() * 0.08 + 0.02,
          (Math.random() - 0.5) * 0.05
        ],
        size: Math.random() * 0.08 + 0.02,
        life: 1.0,
        color: type === 'happy' ? '#fbbf24' : type === 'dance' ? '#a78bfa' : type === 'jump' ? '#60a5fa' : '#ffffff'
      })
    }

    setParticles(newParticles)
  }, [active, type, position])

  if (!active || particles.length === 0) return null

  const positions = new Float32Array(particles.length * 3)
  particles.forEach((p, i) => {
    positions[i * 3] = p.position[0]
    positions[i * 3 + 1] = p.position[1]
    positions[i * 3 + 2] = p.position[2]
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={particles[0]?.color || '#ffffff'}
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
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

const ExpressionSystem = ({ vrmModel, actionType }) => {
  useEffect(() => {
    if (!vrmModel || !vrmModel.expressionManager) return

    const setExpression = (expressionName, value) => {
      if (vrmModel.expressionManager.getExpression(expressionName)) {
        vrmModel.expressionManager.setValue(expressionName, value)
      }
    }

    switch (actionType) {
      case 'happy':
        setExpression('happy', 1)
        setExpression('aa', 0.3)
        break
      case 'sad':
        setExpression('sad', 1)
        setExpression('ee', 0.2)
        break
      case 'wave':
        setExpression('blink', 0.5)
        setExpression('u', 0.3)
        break
      case 'dance':
        setExpression('fun', 1)
        setExpression('blinkL', 0.3)
        break
      case 'jump':
        setExpression('surprised', 1)
        setExpression('ih', 0.4)
        break
      default:
        setExpression('neutral', 1)
    }

    return () => {
      if (vrmModel.expressionManager) {
        try {
          vrmModel.expressionManager.setValue('neutral', 1)
        } catch (error) {
          console.error('重置表情失败:', error)
        }
      }
    }
  }, [vrmModel, actionType])

  return null
}

const CharacterSystem = ({ position = [0, 0, 0], rotation = [0, 0, 0], selectedFile = null, onSwing = null }) => {
  const { scene, gl } = useThree()
  const characterRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false)
  const [characterModel, setCharacterModel] = useState(null)
  const [animationMixer, setAnimationMixer] = useState(null)
  const [vrmModel, setVrmModel] = useState(null)
  const [showFileInput, setShowFileInput] = useState(true)
  const [animations, setAnimations] = useState([])
  const [currentAnimation, setCurrentAnimation] = useState(null)
  const [showAnimationSelect, setShowAnimationSelect] = useState(false)
  const [scale, setScale] = useState(0.5)
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
  const loader = useRef(null)
  const dragControls = useRef(null)
  const randomModeInterval = useRef(null)
  const animationFrameRef = useRef(null)

  // 初始化加载器
  useEffect(() => {
    loader.current = new GLTFLoader()
    loader.current.register((parser) => new VRMLoaderPlugin(parser))
    // 设置跨域，确保本地文件也能正常加载
    loader.current.setCrossOrigin('anonymous')
  }, [])

  // 监听文件选择变化，自动加载模型
  useEffect(() => {
    if (selectedFile) {
      loadVRMModel(selectedFile)
    }
  }, [selectedFile])

  // 加载VRM模型
  const loadVRMModel = (file) => {
    try {
      setIsLoading(true)
      
      // 检查是否是本地模型
      if (file.localPath) {
        console.log('开始加载本地模型:', file.name, '路径:', file.localPath)
      } else {
        console.log('开始加载模型文件:', file.name, '大小:', (file.size / 1024 / 1024).toFixed(2), 'MB')
      }
      
      // 清理之前的模型
      if (characterModel) {
        try {
          scene.remove(characterModel)
          console.log('移除之前的模型')
        } catch (error) {
          console.error('移除模型失败:', error)
        }
      }
      
      // 确定模型URL
      let modelUrl
      if (file.localPath) {
        // 本地模型路径
        modelUrl = file.localPath
      } else {
        // 检查文件大小，避免加载过大的模型
        if (file.size > 100 * 1024 * 1024) { // 100MB限制
          console.error('模型文件过大，可能导致性能问题')
          setIsLoading(false)
          return
        }
        
        // 创建blob URL
        modelUrl = URL.createObjectURL(file)
        console.log('创建模型URL:', modelUrl)
      }
      
      // 加载模型
      loader.current.load(
        modelUrl,
        (gltf) => {
          try {
            console.log('GLTF加载完成:', gltf)
            
            // 清理blob URL（如果是文件对象创建的）
            if (!file.localPath) {
              try {
                URL.revokeObjectURL(modelUrl)
                console.log('清理模型URL成功')
              } catch (revokeError) {
                console.error('清理模型URL失败:', revokeError)
              }
            }
            
            // 检查VRM实例是否存在
            const vrm = gltf.userData.vrm
            if (!vrm) {
              console.error('VRM实例不存在，尝试加载普通GLTF模型')
              // 尝试作为普通GLTF模型加载
                try {
                  const modelPosition = position[1] !== 0 ? position : initialPosition
                  gltf.scene.position.set(...modelPosition)
                  gltf.scene.rotation.set(...rotation.map(r => r * Math.PI / 180))
                  gltf.scene.scale.set(scale, scale, scale)
                  scene.add(gltf.scene)
                  characterRef.current = gltf.scene
                  setCharacterModel(gltf.scene)
                  
                  // 初始化动画混合器
                  const mixer = new THREE.AnimationMixer(gltf.scene)
                  setAnimationMixer(mixer)
                  
                  // 提取动画
                  if (gltf.animations && gltf.animations.length > 0) {
                    console.log('发现动画:', gltf.animations.length, '个')
                    setAnimations(gltf.animations.map((anim, index) => ({
                      name: anim.name || `动画 ${index + 1}`,
                      animation: anim
                    })))
                  }
                  
                  // 初始化拖动控制
                  initDragControls()
                  
                  console.log('普通GLTF模型加载完成')
                } catch (error) {
                  console.error('加载普通GLTF模型失败:', error)
                }
            } else {
              console.log('VRM实例加载成功:', vrm)
              setVrmModel(vrm)
              
              // 设置角色位置和旋转
              try {
                const modelPosition = position[1] !== 0 ? position : initialPosition
                vrm.scene.position.set(...modelPosition)
                vrm.scene.rotation.set(...rotation.map(r => r * Math.PI / 180))
                vrm.scene.scale.set(scale, scale, scale)
                
                // 添加到场景
                scene.add(vrm.scene)
                characterRef.current = vrm.scene
                setCharacterModel(vrm.scene)
                
                // 初始化动画混合器
                const mixer = new THREE.AnimationMixer(vrm.scene)
                setAnimationMixer(mixer)
                
                // 提取动画
                if (gltf.animations && gltf.animations.length > 0) {
                  console.log('发现模型自带动画:', gltf.animations.length, '个')
                  const animationList = gltf.animations.map((anim, index) => ({
                    name: anim.name || `动画 ${index + 1}`,
                    animation: anim
                  }))
                  setModelAnimations(animationList)
                  console.log('动画列表:', animationList.map(a => a.name))
                }
                
                // 初始化拖动控制
                initDragControls()
                
                // 设置模型初始姿态为站立并看着用户
                if (vrm.humanoid) {
                  console.log('VRM人形骨骼存在，设置初始姿态')
                  
                  // 设置头部看向用户
                  const headBone = vrm.humanoid.getBoneNode('head')
                  if (headBone) {
                    headBone.rotation.set(0, 0, 0)
                  }
                  
                  // 设置手臂自然下垂
                  const leftArm = vrm.humanoid.getBoneNode('leftUpperArm')
                  const rightArm = vrm.humanoid.getBoneNode('rightUpperArm')
                  if (leftArm) {
                    leftArm.rotation.set(0, 0, 0.1)
                  }
                  if (rightArm) {
                    rightArm.rotation.set(0, 0, -0.1)
                  }
                  
                  // 设置身体直立
                  const spine = vrm.humanoid.getBoneNode('spine')
                  if (spine) {
                    spine.rotation.set(0, 0, 0)
                  }
                  
                  // 设置表情为中性
                  if (vrm.expressionManager) {
                    vrm.expressionManager.setValue('neutral', 1)
                  }
                }
                
                console.log('VRM模型加载完成')
              } catch (error) {
                console.error('设置VRM模型属性失败:', error)
              }
            }
            
            setIsLoading(false)
            console.log('模型加载完成，已添加到场景')
          } catch (error) {
            console.error('处理加载完成的模型失败:', error)
            // 清理blob URL（如果是文件对象创建的）
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
          // 加载进度回调
          if (progress.lengthComputable) {
            const percentComplete = (progress.loaded / progress.total) * 100
            console.log(`模型加载进度: ${percentComplete.toFixed(2)}%`)
          }
        },
        (error) => {
          console.error('模型加载失败:', error)
          // 清理blob URL（如果是文件对象创建的）
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

  // 处理文件选择
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // 更宽松的文件类型检测
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

  // 预设动作列表
  const presetAnimations = [
    { name: ' idle', action: 'idle' },
    { name: ' wave', action: 'wave' },
    { name: ' dance', action: 'dance' },
    { name: ' jump', action: 'jump' },
    { name: ' sit', action: 'sit' }
  ]

  // 播放动画
  const playAnimation = (animation) => {
    if (!animationMixer) {
      console.error('动画混合器未初始化')
      return
    }

    try {
      // 停止当前动画
      if (currentAnimation) {
        currentAnimation.stop()
      }

      // 播放新动画
      const clipAction = animationMixer.clipAction(animation.animation)
      clipAction.play()
      setCurrentAnimation(clipAction)
      console.log('播放动画:', animation.name)
    } catch (error) {
      console.error('播放动画失败:', error)
    }
  }

  // 执行预设动作
  const executePresetAction = (actionName) => {
    console.log('执行预设动作:', actionName)
    setCurrentActionType(actionName)
    
    const feedbackElement = document.createElement('div')
    feedbackElement.style.position = 'fixed'
    feedbackElement.style.top = '50%'
    feedbackElement.style.left = '50%'
    feedbackElement.style.transform = 'translate(-50%, -50%)'
    feedbackElement.style.background = 'rgba(99, 102, 241, 0.9)'
    feedbackElement.style.color = 'white'
    feedbackElement.style.padding = '12px 24px'
    feedbackElement.style.borderRadius = '20px'
    feedbackElement.style.fontSize = '14px'
    feedbackElement.style.fontWeight = '600'
    feedbackElement.style.zIndex = '9999'
    feedbackElement.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.5)'
    feedbackElement.style.backdropFilter = 'blur(10px)'
    feedbackElement.textContent = `播放动画: ${actionName}`
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
    
    playModelAnimation(actionName)
  }

  const playModelAnimation = (animationName) => {
    if (!animationMixer || modelAnimations.length === 0) {
      console.log('动画混合器未初始化或没有动画')
      return
    }
    
    const animation = modelAnimations.find(a => a.name === animationName)
    if (!animation) {
      console.log('未找到动画:', animationName)
      return
    }
    
    console.log('播放模型动画:', animationName)
    
    if (currentAnimation) {
      currentAnimation.stop()
    }
    
    const clipAction = animationMixer.clipAction(animation.animation)
    clipAction.setLoop(THREE.LoopRepeat)
    clipAction.reset()
    clipAction.fadeIn(0.3)
    clipAction.play()
    setCurrentAnimation(clipAction)
    setCurrentAnimationClip(animationName)
  }

  const animateWave = (originalPosition, originalRotation, intensity) => {
    let waveCount = 0
    const maxWaves = 3
    
    const waveAnimation = () => {
      if (waveCount >= maxWaves) {
        setTargetPosition(originalPosition)
        setTargetRotation(originalRotation)
        return
      }
      
      const phase = waveCount % 2
      if (phase === 0) {
        setTargetPosition(new THREE.Vector3(
          originalPosition.x,
          originalPosition.y + 0.3 * intensity,
          originalPosition.z
        ))
        setTargetRotation(new THREE.Euler(
          originalRotation.x,
          originalRotation.y + 0.25 * intensity,
          originalRotation.z
        ))
      } else {
        setTargetPosition(originalPosition)
        setTargetRotation(originalRotation)
      }
      
      waveCount++
      setTimeout(waveAnimation, 250 / intensity)
    }
    
    waveAnimation()
  }

  const animateDance = (originalPosition, originalRotation, intensity) => {
    let danceCount = 0
    const maxDance = 8
    
    const danceAnimation = () => {
      if (danceCount >= maxDance) {
        setTargetPosition(originalPosition)
        setTargetRotation(originalRotation)
        return
      }
      
      const phase = danceCount % 4
      const offset = 0.2 * intensity
      
      switch (phase) {
        case 0:
          setTargetPosition(new THREE.Vector3(
            originalPosition.x + offset,
            originalPosition.y + 0.4 * intensity,
            originalPosition.z
          ))
          setTargetRotation(new THREE.Euler(
            originalRotation.x,
            originalRotation.y + 0.3 * intensity,
            originalRotation.z + 0.1
          ))
          break
        case 1:
          setTargetPosition(new THREE.Vector3(
            originalPosition.x - offset,
            originalPosition.y,
            originalPosition.z
          ))
          setTargetRotation(new THREE.Euler(
            originalRotation.x,
            originalRotation.y - 0.3 * intensity,
            originalRotation.z - 0.1
          ))
          break
        case 2:
          setTargetPosition(new THREE.Vector3(
            originalPosition.x,
            originalPosition.y + 0.5 * intensity,
            originalPosition.z
          ))
          setTargetRotation(originalRotation)
          break
        case 3:
          setTargetPosition(originalPosition)
          setTargetRotation(originalRotation)
          break
      }
      
      danceCount++
      setTimeout(danceAnimation, 180 / intensity)
    }
    
    danceAnimation()
  }

  const animateJump = (originalPosition, originalRotation, intensity) => {
    setTargetPosition(new THREE.Vector3(
      originalPosition.x,
      originalPosition.y + 0.8 * intensity,
      originalPosition.z
    ))
    
    setTimeout(() => {
      setTargetPosition(originalPosition)
    }, 400 / intensity)
  }

  const animateSit = (originalPosition, originalRotation, intensity) => {
    setTargetPosition(new THREE.Vector3(
      originalPosition.x,
      originalPosition.y - 0.5 * intensity,
      originalPosition.z
    ))
    
    setTimeout(() => {
      setTargetPosition(originalPosition)
    }, 1500 / intensity)
  }

  const animateRun = (originalPosition, originalRotation, intensity) => {
    let runCount = 0
    const maxRun = 6
    
    const runAnimation = () => {
      if (runCount >= maxRun) {
        setTargetPosition(new THREE.Vector3(
          originalPosition.x + 1.2,
          originalPosition.y,
          originalPosition.z
        ))
        setTargetRotation(originalRotation)
        return
      }
      
      const phase = runCount % 2
      const offset = 0.15 * intensity
      
      if (phase === 0) {
        setTargetPosition(new THREE.Vector3(
          originalPosition.x + offset * runCount,
          originalPosition.y + 0.25 * intensity,
          originalPosition.z
        ))
      } else {
        setTargetPosition(new THREE.Vector3(
          originalPosition.x + offset * runCount,
          originalPosition.y,
          originalPosition.z
        ))
      }
      
      runCount++
      setTimeout(runAnimation, 150 / intensity)
    }
    
    runAnimation()
  }

  const animateHappy = (originalPosition, originalScale, intensity) => {
    let happyCount = 0
    const maxHappy = 5
    
    const happyAnimation = () => {
      if (happyCount >= maxHappy) {
        setTargetScale(new THREE.Vector3(1, 1, 1))
        return
      }
      
      const phase = happyCount % 2
      const scaleMultiplier = 1 + 0.08 * intensity
      
      if (phase === 0) {
        setTargetScale(new THREE.Vector3(
          scaleMultiplier,
          scaleMultiplier + 0.05,
          scaleMultiplier
        ))
      } else {
        setTargetScale(new THREE.Vector3(1, 1, 1))
      }
      
      happyCount++
      setTimeout(happyAnimation, 200 / intensity)
    }
    
    happyAnimation()
  }

  const animateSad = (originalPosition, originalRotation, intensity) => {
    setTargetPosition(new THREE.Vector3(
      originalPosition.x,
      originalPosition.y - 0.25 * intensity,
      originalPosition.z
    ))
    setTargetRotation(new THREE.Euler(
      originalRotation.x + 0.2 * intensity,
      originalRotation.y,
      originalRotation.z
    ))
    
    setTimeout(() => {
      setTargetPosition(originalPosition)
      setTargetRotation(originalRotation)
    }, 1800 / intensity)
  }

  const executeComboAction = (sequence) => {
    if (sequence.length === 0) return

    let currentIndex = 0
    const executeNext = () => {
      if (currentIndex < sequence.length) {
        executePresetAction(sequence[currentIndex])
        currentIndex++
        setTimeout(executeNext, 2000 / actionIntensity)
      }
    }
    executeNext()
  }

  const toggleRandomMode = () => {
    setIsRandomMode(!isRandomMode)
    if (!isRandomMode) {
      const actions = ['idle', 'wave', 'dance', 'jump', 'happy']
      randomModeInterval.current = setInterval(() => {
        const randomAction = actions[Math.floor(Math.random() * actions.length)]
        executePresetAction(randomAction)
      }, 3000)
    } else {
      if (randomModeInterval.current) {
        clearInterval(randomModeInterval.current)
        randomModeInterval.current = null
        executePresetAction('idle')
      }
    }
  }

  // 处理摆动动作
  const handleSwing = (swingData) => {
    if (!characterRef.current) return
    
    console.log('处理摆动动作:', swingData)
    
    const { swingX, swingY, swingZ } = swingData
    const originalPosition = characterRef.current.position.clone()
    const originalRotation = characterRef.current.rotation.clone()
    
    // 根据摆动幅度执行不同的动作
    if (swingX > 1) {
      // 左右摆动，执行挥手动作
      characterRef.current.rotation.y = originalRotation.y + (swingX * 0.1)
      setTimeout(() => {
        characterRef.current.rotation.y = originalRotation.y
      }, 300)
    } else if (swingY > 1) {
      // 上下摆动，执行跳跃动作
      characterRef.current.position.y = originalPosition.y + 0.5
      setTimeout(() => {
        characterRef.current.position.y = originalPosition.y
      }, 400)
    } else if (swingZ > 1) {
      // 旋转摆动，执行跳舞动作
      characterRef.current.rotation.z = originalRotation.z + (swingZ * 0.1)
      setTimeout(() => {
        characterRef.current.rotation.z = originalRotation.z
      }, 300)
    }
  }

  // 缩放控制
  const handleScaleChange = (delta) => {
    const newScale = Math.max(0.1, Math.min(2, scale + delta))
    setScale(newScale)
    
    // 更新模型缩放
    if (characterRef.current) {
      characterRef.current.scale.set(newScale, newScale, newScale)
    }
    
    console.log('模型缩放:', newScale)
  }

  // 初始化拖动控制
  const initDragControls = () => {
    if (!characterRef.current || !gl.domElement) return
    
    // 清理之前的拖动控制
    if (dragControls.current) {
      dragControls.current.dispose()
    }
    
    // 获取场景中的相机
    let camera = null
    scene.traverse((object) => {
      if (object.isCamera) {
        camera = object
      }
    })
    
    if (!camera) {
      console.error('未找到相机，无法初始化拖动控制')
      return
    }
    
    // 创建拖动控制
    dragControls.current = new DragControls([characterRef.current], camera, gl.domElement)
    
    // 监听拖动事件
    dragControls.current.addEventListener('dragstart', () => {
      setIsDragging(true)
      console.log('开始拖动模型')
    })
    
    dragControls.current.addEventListener('dragend', () => {
      setIsDragging(false)
      console.log('结束拖动模型')
    })
    
    console.log('拖动控制初始化完成')
  }

  // 清理拖动控制
  useEffect(() => {
    return () => {
      if (dragControls.current) {
        dragControls.current.dispose()
      }
    }
  }, [])

  // 监听摆动事件
  useEffect(() => {
    const handleSwingEvent = (event) => {
      const swingData = event.detail
      handleSwing(swingData)
    }

    const handleExecuteAction = (event) => {
      const { actionName } = event.detail
      executePresetAction(actionName)
    }

    const handleExecuteCombo = (event) => {
      const { sequence } = event.detail
      executeComboAction(sequence)
    }

    const handleToggleRandom = () => {
      toggleRandomMode()
    }

    const handleResetPosition = () => {
      if (characterRef.current) {
        characterRef.current.position.set(0, 1, -2)
        characterRef.current.rotation.set(0, 0, 0)
        characterRef.current.scale.set(scale, scale, scale)
      }
    }

    window.addEventListener('swingDetected', handleSwingEvent)
    window.addEventListener('executeAction', handleExecuteAction)
    window.addEventListener('executeCombo', handleExecuteCombo)
    window.addEventListener('toggleRandom', handleToggleRandom)
    window.addEventListener('resetPosition', handleResetPosition)
    
    return () => {
      window.removeEventListener('swingDetected', handleSwingEvent)
      window.removeEventListener('executeAction', handleExecuteAction)
      window.removeEventListener('executeCombo', handleExecuteCombo)
      window.removeEventListener('toggleRandom', handleToggleRandom)
      window.removeEventListener('resetPosition', handleResetPosition)
      
      if (randomModeInterval.current) {
        clearInterval(randomModeInterval.current)
      }
    }
  }, [])

  // 动画更新
  useFrame((state, delta) => {
    try {
      if (animationMixer && typeof animationMixer.update === 'function') {
        animationMixer.update(delta)
      }
      
      if (vrmModel && typeof vrmModel.update === 'function') {
        vrmModel.update(delta)
      }
      
      // 平滑动画系统
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
        
        // 检查动画是否完成
        if (targetPosition && targetRotation) {
          const posDiff = Math.abs(characterRef.current.position.y - targetPosition.y)
          const rotDiff = Math.abs(characterRef.current.rotation.y - targetRotation.y)
          
          if (posDiff < 0.01 && rotDiff < 0.01) {
            setIsAnimating(false)
          }
        }
      }
      
      // 添加自然的呼吸动画
      if (characterRef.current && characterRef.current.scale) {
        const breatheScale = 1 + Math.sin(Date.now() * 0.002) * 0.015
        characterRef.current.scale.y = breatheScale
      }
    } catch (error) {
      console.error('动画更新失败:', error)
    }
  })

  return (
    <>
      <DynamicBackground actionType={currentActionType} />
      <ParticleSystem 
        active={showParticles} 
        type={currentActionType} 
        position={characterRef?.current?.position || [0, 1, -2]} 
      />
      <ExpressionSystem vrmModel={vrmModel} actionType={currentActionType} />
      {isLoading && (
        <mesh position={[0, 2, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshBasicMaterial color="#646cff" />
        </mesh>
      )}
    </>
  )
}

// 角色控制器组件
export const CharacterController = ({ position, rotation, selectedFile }) => {
  return (
    <CharacterSystem position={position} rotation={rotation} selectedFile={selectedFile} />
  )
}

export default CharacterSystem