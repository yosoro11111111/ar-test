import React, { useRef, useEffect, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm'

// 角色系统组件
const CharacterSystem = ({ position = [0, 0, 0], rotation = [0, 0, 0], selectedFile = null }) => {
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
  const loader = useRef(null)

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
                gltf.scene.position.set(...position)
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
                console.log('普通GLTF模型加载完成')
              } catch (error) {
                console.error('加载普通GLTF模型失败:', error)
              }
            } else {
              console.log('VRM实例加载成功:', vrm)
              setVrmModel(vrm)
              
              // 设置角色位置和旋转
                try {
                  vrm.scene.position.set(...position)
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
          // 这里可以添加简单的挥手动画逻辑
          console.log('执行挥手动作')
        }
        break
      case 'dance':
        // 模拟跳舞动作
        if (characterRef.current) {
          console.log('执行跳舞动作')
        }
        break
      case 'jump':
        // 模拟跳跃动作
        if (characterRef.current) {
          console.log('执行跳跃动作')
        }
        break
      case 'sit':
        // 模拟坐下动作
        if (characterRef.current) {
          console.log('执行坐下动作')
        }
        break
      default:
        console.log('未知动作:', actionName)
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

      {/* 动作选择控制界面 */}
      {characterModel && (
        <div style={{
          position: 'absolute',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          width: '90%',
          maxWidth: '450px'
        }}>
          <button
            onClick={() => setShowAnimationSelect(!showAnimationSelect)}
            style={{
              padding: '14px 20px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '14px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '700',
              width: '100%',
              boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 12px 30px rgba(99, 102, 241, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.4)'
            }}
          >
            {showAnimationSelect ? '关闭动作选择' : '选择动作'}
          </button>

          {showAnimationSelect && (
            <div style={{
              marginTop: '16px',
              background: 'rgba(15, 23, 42, 0.9)',
              color: 'white',
              padding: '20px',
              borderRadius: '16px',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h4 style={{ 
                margin: '0 0 16px 0', 
                color: '#60a5fa',
                fontSize: '18px',
                fontWeight: '700',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
              }}>🎭 预设动作</h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                gap: '12px',
                marginBottom: '20px'
              }}>
                {presetAnimations.map((anim, index) => (
                  <button
                    key={index}
                    onClick={() => executePresetAction(anim.action)}
                    style={{
                      padding: '12px',
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(79, 70, 229, 0.2) 100%)',
                      color: 'white',
                      border: '2px solid rgba(99, 102, 241, 0.4)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.4) 0%, rgba(79, 70, 229, 0.4) 100%)'
                      e.target.style.transform = 'scale(1.08)'
                      e.target.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(79, 70, 229, 0.2) 100%)'
                      e.target.style.transform = 'scale(1)'
                      e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    {anim.name}
                  </button>
                ))}
              </div>

              {animations.length > 0 && (
                <>
                  <h4 style={{ 
                    margin: '0 0 16px 0', 
                    color: '#34d399',
                    fontSize: '18px',
                    fontWeight: '700',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                  }}>✨ 模型动画</h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: '10px',
                    marginBottom: '20px'
                  }}>
                    {animations.map((anim, index) => (
                      <button
                        key={index}
                        onClick={() => playAnimation(anim)}
                        style={{
                          padding: '10px',
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)',
                          color: 'white',
                          border: '2px solid rgba(16, 185, 129, 0.4)',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          transition: 'all 0.3s ease',
                          wordBreak: 'break-word',
                          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.4) 0%, rgba(5, 150, 105, 0.4) 100%)'
                          e.target.style.transform = 'scale(1.08)'
                          e.target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)'
                          e.target.style.transform = 'scale(1)'
                          e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)'
                        }}
                      >
                        {anim.name}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* 缩放控制 */}
              <div style={{
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h4 style={{ 
                  margin: '0 0 16px 0', 
                  color: '#fbbf24',
                  fontSize: '18px',
                  fontWeight: '700',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                }}>📏 模型缩放</h4>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}>
                  <button
                    onClick={() => handleScaleChange(-0.1)}
                    style={{
                      padding: '12px 20px',
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
                      color: 'white',
                      border: '2px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '20px',
                      fontWeight: '700',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.4) 0%, rgba(220, 38, 38, 0.4) 100%)'
                      e.target.style.transform = 'scale(1.08)'
                      e.target.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)'
                      e.target.style.transform = 'scale(1)'
                      e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    −
                  </button>
                  <div style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                    color: 'white',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '10px',
                    textAlign: 'center',
                    fontSize: '18px',
                    fontWeight: '700',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                  }}>
                    {Math.round(scale * 100)}%
                  </div>
                  <button
                    onClick={() => handleScaleChange(0.1)}
                    style={{
                      padding: '12px 20px',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)',
                      color: 'white',
                      border: '2px solid rgba(16, 185, 129, 0.4)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '20px',
                      fontWeight: '700',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.4) 0%, rgba(5, 150, 105, 0.4) 100%)'
                      e.target.style.transform = 'scale(1.08)'
                      e.target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)'
                      e.target.style.transform = 'scale(1)'
                      e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
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