import React, { useRef, useEffect, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm'
import { DragControls } from 'three/examples/jsm/controls/DragControls'

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