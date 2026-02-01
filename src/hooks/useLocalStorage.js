// Simple localStorage hook
import { useState, useEffect, useCallback } from 'react'

export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.log(error)
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.log(error)
    }
  }

  return [storedValue, setValue]
}

export const useAppSettings = () => {
  const [settings, setSettings] = useLocalStorage('ar-character-settings', {
    showFPS: true,
    showDebug: false,
    showGrid: false,
    quality: 'high',
    shadows: true,
    antialias: true,
    language: 'zh-CN',
    theme: 'dark',
    cameraPosition: { x: 0, y: 1.5, z: 3 },
    cameraTarget: { x: 0, y: 1, z: 0 },
    defaultHeight: 0.8,
    defaultScale: 1,
    soundEnabled: true,
    volume: 0.5,
    analyticsEnabled: false,
    crashReports: true
  })

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const resetSettings = () => {
    setSettings({
      showFPS: true,
      showDebug: false,
      showGrid: false,
      quality: 'high',
      shadows: true,
      antialias: true,
      language: 'zh-CN',
      theme: 'dark',
      cameraPosition: { x: 0, y: 1.5, z: 3 },
      cameraTarget: { x: 0, y: 1, z: 0 },
      defaultHeight: 0.8,
      defaultScale: 1,
      soundEnabled: true,
      volume: 0.5,
      analyticsEnabled: false,
      crashReports: true
    })
  }

  return { settings, updateSetting, resetSettings, setSettings }
}

export const useCharacterData = () => {
  const [characters, setCharacters] = useLocalStorage('ar-character-list', [])
  const [currentCharacter, setCurrentCharacter] = useLocalStorage('ar-current-character', null)

  const addCharacter = (character) => {
    const newChar = { 
      ...character, 
      id: Date.now().toString(), 
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString() 
    }
    setCharacters(prev => [...prev, newChar])
    return newChar
  }

  const updateCharacter = (id, updates) => {
    setCharacters(prev => prev.map(char => 
      char.id === id ? { ...char, ...updates, updatedAt: new Date().toISOString() } : char
    ))
  }

  const deleteCharacter = (id) => {
    setCharacters(prev => prev.filter(char => char.id !== id))
    if (currentCharacter?.id === id) setCurrentCharacter(null)
  }

  const selectCharacter = (character) => {
    setCurrentCharacter(character)
    setCharacters(prev => prev.map(char => ({ ...char, selected: char.id === character.id })))
  }

  return { 
    characters, 
    currentCharacter, 
    addCharacter, 
    updateCharacter, 
    deleteCharacter, 
    selectCharacter 
  }
}

export const useCacheManager = () => {
  const clearAllCache = () => {
    Object.keys(localStorage).forEach(key => {
      if (key !== 'ar-character-settings') localStorage.removeItem(key)
    })
    sessionStorage.clear()
    return true
  }

  const getCacheSize = () => {
    let total = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length * 2
      }
    }
    return (total / 1024 / 1024).toFixed(2) + ' MB'
  }

  return { clearAllCache, getCacheSize }
}