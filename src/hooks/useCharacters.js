import { useState, useCallback, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'

/**
 * 统一角色管理Hook
 * 管理多角色加载、切换、位置等功能
 */
export const useCharacters = (maxCount = 3) => {
  // 角色列表
  const [characters, setCharacters] = useState(Array(maxCount).fill(null))
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  
  // 角色引用（用于3D场景）
  const characterRefs = useRef(Array(maxCount).fill(null))
  const mixersRef = useRef(Array(maxCount).fill(null))

  // 加载角色
  const loadCharacter = useCallback(async (index, url) => {
    if (index < 0 || index >= maxCount) {
      console.warn('角色索引超出范围:', index)
      return false
    }
    
    setIsLoading(true)
    try {
      const loader = new GLTFLoader()
      loader.register((parser) => new VRMLoaderPlugin(parser))
      
      const gltf = await new Promise((resolve, reject) => {
        loader.load(url, resolve, undefined, reject)
      })
      
      const vrm = gltf.userData.vrm
      
      // 设置阴影
      vrm.scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      
      // 创建动画混合器
      const mixer = new THREE.AnimationMixer(vrm.scene)
      
      // 保存引用
      characterRefs.current[index] = vrm
      mixersRef.current[index] = mixer
      
      // 更新状态
      setCharacters(prev => {
        const newCharacters = [...prev]
        newCharacters[index] = {
          url,
          name: vrm.meta?.name || `角色${index + 1}`,
          loaded: true
        }
        return newCharacters
      })
      
      return vrm
    } catch (error) {
      console.error('加载角色失败:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [maxCount])

  // 卸载角色
  const unloadCharacter = useCallback((index) => {
    if (index < 0 || index >= maxCount) return
    
    // 清理引用
    if (characterRefs.current[index]) {
      characterRefs.current[index] = null
    }
    if (mixersRef.current[index]) {
      mixersRef.current[index] = null
    }
    
    // 更新状态
    setCharacters(prev => {
      const newCharacters = [...prev]
      newCharacters[index] = null
      return newCharacters
    })
  }, [maxCount])

  // 切换选中角色
  const selectCharacter = useCallback((index) => {
    if (index >= 0 && index < maxCount) {
      setSelectedIndex(index)
    }
  }, [maxCount])

  // 获取当前角色
  const getCurrentCharacter = useCallback(() => {
    return characterRefs.current[selectedIndex]
  }, [selectedIndex])

  // 获取当前混合器
  const getCurrentMixer = useCallback(() => {
    return mixersRef.current[selectedIndex]
  }, [selectedIndex])

  // 获取所有已加载的角色
  const getLoadedCharacters = useCallback(() => {
    return characters.map((char, index) => ({
      ...char,
      index,
      vrm: characterRefs.current[index],
      mixer: mixersRef.current[index]
    })).filter(char => char.loaded)
  }, [characters])

  // 更新角色位置
  const updateCharacterPosition = useCallback((index, position) => {
    const vrm = characterRefs.current[index]
    if (vrm && vrm.scene) {
      vrm.scene.position.copy(position)
    }
  }, [])

  // 更新角色旋转
  const updateCharacterRotation = useCallback((index, rotation) => {
    const vrm = characterRefs.current[index]
    if (vrm && vrm.scene) {
      vrm.scene.rotation.y = rotation
    }
  }, [])

  // 更新角色缩放
  const updateCharacterScale = useCallback((index, scale) => {
    const vrm = characterRefs.current[index]
    if (vrm && vrm.scene) {
      vrm.scene.scale.setScalar(scale)
    }
  }, [])

  // 显示/隐藏角色
  const setCharacterVisible = useCallback((index, visible) => {
    const vrm = characterRefs.current[index]
    if (vrm && vrm.scene) {
      vrm.scene.visible = visible
    }
  }, [])

  // 获取下一个空位
  const getNextEmptySlot = useCallback(() => {
    return characters.findIndex(char => char === null)
  }, [characters])

  // 是否有空位
  const hasEmptySlot = useCallback(() => {
    return characters.some(char => char === null)
  }, [characters])

  return {
    // 状态
    characters,
    selectedIndex,
    isLoading,
    maxCount,
    
    // 引用
    characterRefs,
    mixersRef,
    
    // 方法
    loadCharacter,
    unloadCharacter,
    selectCharacter,
    getCurrentCharacter,
    getCurrentMixer,
    getLoadedCharacters,
    updateCharacterPosition,
    updateCharacterRotation,
    updateCharacterScale,
    setCharacterVisible,
    getNextEmptySlot,
    hasEmptySlot
  }
}

export default useCharacters
