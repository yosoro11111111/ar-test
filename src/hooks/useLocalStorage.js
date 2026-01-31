import { useState, useEffect, useCallback } from 'react'

// LocalStorage Hook - 用于数据持久化
export const useLocalStorage = (key, initialValue) => {
  // 获取初始值
  const readValue = useCallback(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  }, [initialValue, key])

  const [storedValue, setStoredValue] = useState(readValue)

  // 返回一个包装版本的 useState setter，它会持久化到 localStorage
  const setValue = useCallback((value) => {
    try {
      // 允许 value 是一个函数
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
        // 触发自定义事件，用于跨标签页同步
        window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(valueToStore) }))
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  // 监听其他标签页的变化
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === key && event.newValue) {
        setStoredValue(JSON.parse(event.newValue))
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  // 移除存储的值
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
    }
  }, [initialValue, key])

  return [storedValue, setValue, removeValue]
}

// 应用设置 Hook
export const useAppSettings = () => {
  const [settings, setSettings, removeSettings] = useLocalStorage('ar-character-settings', {
    // 显示设置
    showFPS: true,
    showDebug: false,
    showGrid: false,
    
    // 性能设置
    quality: 'high', // low, medium, high
    shadows: true,
    antialias: true,
    
    // 界面设置
    language: 'zh-CN',
    theme: 'dark',
    
    // 相机设置
    cameraPosition: { x: 0, y: 1.5, z: 3 },
    cameraTarget: { x: 0, y: 1, z: 0 },
    
    // 角色默认设置
    defaultHeight: 0.8, // 80%
    defaultScale: 1,
    
    // 音频设置
    soundEnabled: true,
    volume: 0.5,
    
    // 隐私设置
    analyticsEnabled: false,
    crashReports: true
  })

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }, [setSettings])

  const resetSettings = useCallback(() => {
    removeSettings()
  }, [removeSettings])

  return { settings, updateSetting, resetSettings, setSettings }
}

// 角色数据 Hook
export const useCharacterData = () => {
  const [characters, setCharacters, removeCharacters] = useLocalStorage('ar-character-list', [])
  const [currentCharacter, setCurrentCharacter] = useLocalStorage('ar-current-character', null)

  const addCharacter = useCallback((character) => {
    const newChar = {
      ...character,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setCharacters(prev => [...prev, newChar])
    return newChar
  }, [setCharacters])

  const updateCharacter = useCallback((id, updates) => {
    setCharacters(prev => prev.map(char => 
      char.id === id 
        ? { ...char, ...updates, updatedAt: new Date().toISOString() }
        : char
    ))
  }, [setCharacters])

  const deleteCharacter = useCallback((id) => {
    setCharacters(prev => prev.filter(char => char.id !== id))
    if (currentCharacter?.id === id) {
      setCurrentCharacter(null)
    }
  }, [setCharacters, currentCharacter, setCurrentCharacter])

  const selectCharacter = useCallback((character) => {
    setCurrentCharacter(character)
    // 更新选中状态
    setCharacters(prev => prev.map(char => ({
      ...char,
      selected: char.id === character.id
    })))
  }, [setCurrentCharacter, setCharacters])

  const reorderCharacters = useCallback((newOrder) => {
    setCharacters(newOrder)
  }, [setCharacters])

  return {
    characters,
    currentCharacter,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    selectCharacter,
    reorderCharacters,
    removeCharacters
  }
}

// 收藏动作 Hook
export const useFavoriteActions = () => {
  const [favorites, setFavorites, removeFavorites] = useLocalStorage('ar-favorite-actions', [])

  const addFavorite = useCallback((actionId) => {
    setFavorites(prev => [...new Set([...prev, actionId])])
  }, [setFavorites])

  const removeFavorite = useCallback((actionId) => {
    setFavorites(prev => prev.filter(id => id !== actionId))
  }, [setFavorites])

  const toggleFavorite = useCallback((actionId) => {
    setFavorites(prev => 
      prev.includes(actionId) 
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    )
  }, [setFavorites])

  const isFavorite = useCallback((actionId) => {
    return favorites.includes(actionId)
  }, [favorites])

  return { favorites, addFavorite, removeFavorite, toggleFavorite, isFavorite, removeFavorites }
}

// 最近使用 Hook
export const useRecentActions = (maxItems = 10) => {
  const [recent, setRecent, removeRecent] = useLocalStorage('ar-recent-actions', [])

  const addRecent = useCallback((actionId) => {
    setRecent(prev => {
      const filtered = prev.filter(id => id !== actionId)
      return [actionId, ...filtered].slice(0, maxItems)
    })
  }, [setRecent, maxItems])

  const clearRecent = useCallback(() => {
    setRecent([])
  }, [setRecent])

  return { recent, addRecent, clearRecent, removeRecent }
}

// 保存的姿势 Hook
export const useSavedPoses = () => {
  const [poses, setPoses, removePoses] = useLocalStorage('ar-saved-poses', [])

  const savePose = useCallback((name, boneData) => {
    const newPose = {
      id: Date.now().toString(),
      name,
      boneData,
      createdAt: new Date().toISOString()
    }
    setPoses(prev => [...prev, newPose])
    return newPose
  }, [setPoses])

  const deletePose = useCallback((poseId) => {
    setPoses(prev => prev.filter(pose => pose.id !== poseId))
  }, [setPoses])

  const updatePose = useCallback((poseId, updates) => {
    setPoses(prev => prev.map(pose => 
      pose.id === poseId 
        ? { ...pose, ...updates, updatedAt: new Date().toISOString() }
        : pose
    ))
  }, [setPoses])

  return { poses, savePose, deletePose, updatePose, removePoses }
}

// 缓存管理 Hook
export const useCacheManager = () => {
  const clearAllCache = useCallback(() => {
    // 清除 localStorage
    const keysToKeep = ['ar-character-settings'] // 保留设置
    const allKeys = Object.keys(localStorage)
    
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key)
      }
    })

    // 清除 sessionStorage
    sessionStorage.clear()

    // 清除缓存的模型数据
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName)
        })
      })
    }

    return true
  }, [])

  const getCacheSize = useCallback(() => {
    let totalSize = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length * 2 // UTF-16
      }
    }
    return (totalSize / 1024 / 1024).toFixed(2) + ' MB'
  }, [])

  return { clearAllCache, getCacheSize }
}

export default useLocalStorage
