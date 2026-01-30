import React, { useRef, useEffect, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm'
import { DragControls } from 'three/examples/jsm/controls/DragControls'

// 角色系统组件
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
  const [scale, setScale] = useState(0.5) // 默认缩放比例
  const [isDragging, setIsDragging] = useState(false)
  const [initialPosition, setInitialPosition] = useState([0, 1, -2]) // 设置初始高度为1
  const loader = useRef(null)
  const dragControls = useRef(null)

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
                  console.log('发现动画:', gltf.animations.length, '个')
                  setAnimations(gltf.animations.map((anim, index) => ({
                    name: anim.name || `动画 ${index + 1}`,
                    animation: anim
                  })))
                }
                
                // 初始化拖动控制
                initDragControls()
                
                // 尝试设置模型初始姿态为站立
                if (vrm.humanoid) {
                  console.log('VRM人形骨骼存在，尝试设置初始姿态')
                  // 这里可以设置具体的骨骼姿态
                  // 例如：vrm.humanoid.getBoneNode('Head').rotation.set(0, 0, 0)
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
    
    // 根据动作名称执行不同的操作
    switch (actionName) {
      case 'idle':
        // 恢复到 idle 状态
        if (currentAnimation) {
          currentAnimation.stop()
          setCurrentAnimation(null)
        }
        break
      case 'wave':
        // 模拟挥手动作
        if (characterRef.current) {
          console.log('执行挥手动作')
          // 添加明显的挥手动画
          const originalPosition = characterRef.current.position.clone()
          let waveCount = 0
          const waveInterval = setInterval(() => {
            if (waveCount < 3) {
              // 大幅度挥手
              characterRef.current.position.y = originalPosition.y + 0.3
              setTimeout(() => {
                characterRef.current.position.y = originalPosition.y
              }, 200)
              waveCount++
            } else {
              clearInterval(waveInterval)
            }
          }, 400)
        }
        break
      case 'dance':
        // 模拟跳舞动作
        if (characterRef.current) {
          console.log('执行跳舞动作')
          // 添加明显的跳舞动画
          const originalPosition = characterRef.current.position.clone()
          let danceCount = 0
          const danceInterval = setInterval(() => {
            if (danceCount < 10) {
              // 大幅度跳舞动作
              if (danceCount % 2 === 0) {
                characterRef.current.position.y = originalPosition.y + 0.5
                characterRef.current.position.x = originalPosition.x + 0.2
              } else {
                characterRef.current.position.y = originalPosition.y
                characterRef.current.position.x = originalPosition.x - 0.2
              }
              danceCount++
            } else {
              characterRef.current.position.set(originalPosition.x, originalPosition.y, originalPosition.z)
              clearInterval(danceInterval)
            }
          }, 300)
        }
        break
      case 'jump':
        // 模拟跳跃动作
        if (characterRef.current) {
          console.log('执行跳跃动作')
          // 添加明显的跳跃动画
          const originalPosition = characterRef.current.position.clone()
          let jumpCount = 0
          const jumpInterval = setInterval(() => {
            if (jumpCount < 3) {
              // 大幅度跳跃
              characterRef.current.position.y = originalPosition.y + 0.8
              setTimeout(() => {
                characterRef.current.position.y = originalPosition.y
              }, 400)
              jumpCount++
            } else {
              clearInterval(jumpInterval)
            }
          }, 600)
        }
        break
      case 'sit':
        // 模拟坐下动作
        if (characterRef.current) {
          console.log('执行坐下动作')
          // 添加明显的坐下动画
          const originalPosition = characterRef.current.position.clone()
          // 坐下
          characterRef.current.position.y = originalPosition.y - 0.5
          // 2秒后站起来
          setTimeout(() => {
            characterRef.current.position.y = originalPosition.y
          }, 2000)
        }
        break
      default:
        console.log('未知动作:', actionName)
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
    
    // 创建拖动控制
    dragControls.current = new DragControls([characterRef.current], gl.domElement, gl.domElement)
    
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

    // 监听动作执行事件
    const handleExecuteAction = (event) => {
      const { actionName } = event.detail
      executePresetAction(actionName)
    }

    window.addEventListener('swingDetected', handleSwingEvent)
    window.addEventListener('executeAction', handleExecuteAction)
    return () => {
      window.removeEventListener('swingDetected', handleSwingEvent)
      window.removeEventListener('executeAction', handleExecuteAction)
    }
  }, [])

  // 动画更新
  useFrame((state, delta) => {
    try {
      if (animationMixer && typeof animationMixer.update === 'function') {
        animationMixer.update(delta)
      }
      
      // 更新VRM
      if (vrmModel && typeof vrmModel.update === 'function') {
        vrmModel.update(delta)
      }
      
      // 添加简单的呼吸动画
      if (characterRef.current && characterRef.current.scale) {
        characterRef.current.scale.y = 1 + Math.sin(Date.now() * 0.001) * 0.02
      }
    } catch (error) {
      console.error('动画更新失败:', error)
    }
  })

  return (
    <>
      {isLoading && (
        <mesh position={[0, 2, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshBasicMaterial color="#646cff" />
        </mesh>
      )}
      
      {/* 外部UI控件 */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        width: '90%',
        maxWidth: '400px'
      }}>
        {/* 动作选择界面 */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          padding: '12px',
          borderRadius: '12px',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '12px'
        }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            {presetAnimations.map((anim, index) => (
              <button
                key={index}
                onClick={() => executePresetAction(anim.action)}
                style={{
                  padding: '8px 12px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)'
                  e.target.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)'
                  e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)'
                }}
              >
                {anim.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* 缩放控制界面 */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          padding: '12px',
          borderRadius: '12px',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <button
              onClick={() => handleScaleChange(-0.1)}
              style={{
                padding: '8px 12px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)'
                e.target.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)'
                e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)'
              }}
            >
              −
            </button>
            <div style={{
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              minWidth: '60px',
              textAlign: 'center'
            }}>
              大小: {(scale * 100).toFixed(0)}%
            </div>
            <button
              onClick={() => handleScaleChange(0.1)}
              style={{
                padding: '8px 12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)'
                e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)'
                e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)'
              }}
            >
              +
            </button>
          </div>
        </div>
      </div>
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