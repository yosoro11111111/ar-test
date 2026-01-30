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
      console.log('开始加载模型文件:', file.name, '大小:', (file.size / 1024 / 1024).toFixed(2), 'MB')
      
      // 清理之前的模型
      if (characterModel) {
        try {
          scene.remove(characterModel)
          console.log('移除之前的模型')
        } catch (error) {
          console.error('移除模型失败:', error)
        }
      }
      
      // 检查文件大小，避免加载过大的模型
      if (file.size > 100 * 1024 * 1024) { // 100MB限制
        console.error('模型文件过大，可能导致性能问题')
        setIsLoading(false)
        return
      }
      
      // 创建blob URL
      const blobUrl = URL.createObjectURL(file)
      console.log('创建模型URL:', blobUrl)
      
      // 直接使用URL.createObjectURL，不需要FileReader
      loader.current.load(
        blobUrl,
        (gltf) => {
          try {
            console.log('GLTF加载完成:', gltf)
            
            // 清理blob URL
            URL.revokeObjectURL(blobUrl)
            console.log('清理模型URL成功')
            
            // 检查VRM实例是否存在
            const vrm = gltf.userData.vrm
            if (!vrm) {
              console.error('VRM实例不存在，尝试加载普通GLTF模型')
              // 尝试作为普通GLTF模型加载
              try {
                gltf.scene.position.set(...position)
                gltf.scene.rotation.set(...rotation.map(r => r * Math.PI / 180))
                gltf.scene.scale.set(0.5, 0.5, 0.5)
                scene.add(gltf.scene)
                characterRef.current = gltf.scene
                setCharacterModel(gltf.scene)
                
                // 初始化动画混合器
                const mixer = new THREE.AnimationMixer(gltf.scene)
                setAnimationMixer(mixer)
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
                vrm.scene.scale.set(0.5, 0.5, 0.5)
                
                // 添加到场景
                scene.add(vrm.scene)
                characterRef.current = vrm.scene
                setCharacterModel(vrm.scene)
                
                // 初始化动画混合器
                const mixer = new THREE.AnimationMixer(vrm.scene)
                setAnimationMixer(mixer)
                console.log('VRM模型加载完成')
              } catch (error) {
                console.error('设置VRM模型属性失败:', error)
              }
            }
            
            setIsLoading(false)
            console.log('模型加载完成，已添加到场景')
          } catch (error) {
            console.error('处理加载完成的模型失败:', error)
            // 清理blob URL
            try {
              URL.revokeObjectURL(blobUrl)
            } catch (revokeError) {
              console.error('清理模型URL失败:', revokeError)
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
          // 清理blob URL
          try {
            URL.revokeObjectURL(blobUrl)
            console.log('清理模型URL成功')
          } catch (revokeError) {
            console.error('清理模型URL失败:', revokeError)
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