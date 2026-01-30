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
  const randomModeInterval = useRef(null)
  const animationFrameRef = useRef(null)
  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())
  const touchStartTime = useRef(0)

  const [optimalScale, setOptimalScale] = useState(1.0)
  const [optimalCameraPosition, setOptimalCameraPosition] = useState([0, 0, 3])

  const ambientLightRef = useRef()
  const directionalLightRef = useRef()
  const pointLightRef = useRef()

  const breathePhase = useRef(0)
  const blinkPhase = useRef(0)

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
    const targetSize = 1.5
    const optimalScaleValue = targetSize / maxDimension
    
    console.log('最佳缩放:', optimalScaleValue)
    setOptimalScale(optimalScaleValue)
    
    model.scale.set(optimalScaleValue, optimalScaleValue, optimalScaleValue)
    
    const center = new THREE.Vector3()
    box.getCenter(center)
    
    model.position.x = -center.x * optimalScaleValue
    model.position.y = -box.min.y * optimalScaleValue
    model.position.z = -center.z * optimalScaleValue
    
    console.log('模型位置:', model.position)
    
    const cameraDistance = maxDimension * optimalScaleValue * 2.5
    setOptimalCameraPosition([0, size.y * optimalScaleValue * 0.6, cameraDistance])
    
    camera.position.set(0, size.y * optimalScaleValue * 0.6, cameraDistance)
    camera.lookAt(0, size.y * optimalScaleValue * 0.5, 0)
    
    console.log('相机位置:', camera.position)
    
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = 0.6
    }
    if (directionalLightRef.current) {
      directionalLightRef.current.position.set(5, 10, 7.5)
      directionalLightRef.current.intensity = 1.2
    }
    if (pointLightRef.current) {
      pointLightRef.current.position.set(-5, 5, 5)
      pointLightRef.current.intensity = 0.8
    }
  }

  const setInitialPose = (vrm) => {
    if (vrm.humanoid) {
      console.log('VRM人形骨骼存在，设置初始姿态')
      
      const headBone = vrm.humanoid.getBoneNode('head')
      if (headBone) {
        headBone.rotation.set(0, 0, 0)
      }
      
      const leftArm = vrm.humanoid.getBoneNode('leftUpperArm')
      const rightArm = vrm.humanoid.getBoneNode('rightUpperArm')
      if (leftArm) {
        leftArm.rotation.set(0, 0, 0.1)
      }
      if (rightArm) {
        rightArm.rotation.set(0, 0, -0.1)
      }
      
      const spine = vrm.humanoid.getBoneNode('spine')
      if (spine) {
        spine.rotation.set(0, 0, 0)
      }
      
      const hips = vrm.humanoid.getBoneNode('hips')
      if (hips) {
        hips.rotation.set(0, 0, 0)
      }
      
      const leftLeg = vrm.humanoid.getBoneNode('leftUpperLeg')
      const rightLeg = vrm.humanoid.getBoneNode('rightUpperLeg')
      if (leftLeg) {
        leftLeg.rotation.set(0, 0, 0)
      }
      if (rightLeg) {
        rightLeg.rotation.set(0, 0, 0)
      }
      
      if (vrm.expressionManager) {
        vrm.expressionManager.setValue('neutral', 1)
      }
      
      vrm.scene.updateMatrixWorld(true)
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
    
    if (isTouching && characterRef.current) {
      const rect = gl.domElement.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      
      mouse.current.set(x, y)
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
      
      if (vrmModel && vrmModel.expressionManager) {
        blinkPhase.current += delta
        
        if (Math.sin(blinkPhase.current * 0.5) > 0.98) {
          vrmModel.expressionManager.setValue('blink', 1)
          setTimeout(() => {
            if (vrmModel.expressionManager) {
              vrmModel.expressionManager.setValue('blink', 0)
            }
          }, 150)
        }
      }
      
      if (isTouching && characterRef.current) {
        characterRef.current.rotation.y += 0.02
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
        <div style={{
          position: 'fixed',
          left: touchFeedback.x,
          top: touchFeedback.y,
          transform: 'translate(-50%, -50%)',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none',
          animation: 'ripple 0.5s ease-out forwards'
        }} />
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
