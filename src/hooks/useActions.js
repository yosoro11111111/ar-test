import { useState, useCallback, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { getAllVRMActions, loadVRMAAction } from '../data/vrmaActions'

/**
 * 统一动作系统Hook
 * 管理动作加载、播放、收藏等功能
 */
export const useActions = (vrmModel, mixer) => {
  // 动作列表
  const [actions, setActions] = useState([])
  const [isLoadingActions, setIsLoadingActions] = useState(false)
  
  // 当前动作
  const [currentAction, setCurrentAction] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  
  // 收藏和最近使用
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('ar-favorite-actions')
    return saved ? JSON.parse(saved) : []
  })
  const [recentActions, setRecentActions] = useState([])
  
  // 当前动画
  const currentAnimationRef = useRef(null)
  const animationClipsRef = useRef(new Map())

  // 加载动作列表
  const loadActions = useCallback(async () => {
    setIsLoadingActions(true)
    try {
      const actionList = await getAllVRMActions()
      setActions(actionList)
    } catch (error) {
      console.error('加载动作列表失败:', error)
    } finally {
      setIsLoadingActions(false)
    }
  }, [])

  // 播放动作
  const playAction = useCallback(async (actionId) => {
    if (!vrmModel || !mixer) {
      console.warn('无法播放动作: VRM模型或动画混合器未初始化')
      return false
    }
    
    const action = actions.find(a => a.id === actionId)
    if (!action) {
      console.warn('未找到动作:', actionId)
      return false
    }
    
    try {
      // 停止当前动画
      if (currentAnimationRef.current) {
        currentAnimationRef.current.fadeOut(0.3)
      }
      
      // 检查缓存
      let clip = animationClipsRef.current.get(actionId)
      
      if (!clip) {
        // 加载新动作
        const result = await loadVRMAAction(action.filePath, vrmModel)
        clip = result?.clip
        if (clip) {
          animationClipsRef.current.set(actionId, clip)
        }
      }
      
      if (clip) {
        // 创建动画动作
        const animationAction = mixer.clipAction(clip)
        animationAction.reset()
        animationAction.fadeIn(0.3)
        animationAction.play()
        
        currentAnimationRef.current = animationAction
        setCurrentAction(action)
        setIsPlaying(true)
        
        // 添加到最近使用
        setRecentActions(prev => {
          const filtered = prev.filter(id => id !== actionId)
          return [actionId, ...filtered].slice(0, 10)
        })
        
        return true
      }
    } catch (error) {
      console.error('播放动作失败:', error)
    }
    
    return false
  }, [actions, vrmModel, mixer])

  // 停止动作
  const stopAction = useCallback(() => {
    if (currentAnimationRef.current) {
      currentAnimationRef.current.fadeOut(0.3)
      currentAnimationRef.current = null
    }
    setIsPlaying(false)
  }, [])

  // 切换收藏
  const toggleFavorite = useCallback((actionId) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(actionId)
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
      localStorage.setItem('ar-favorite-actions', JSON.stringify(newFavorites))
      return newFavorites
    })
  }, [])

  // 检查是否收藏
  const isFavorite = useCallback((actionId) => {
    return favorites.includes(actionId)
  }, [favorites])

  // 获取分类后的动作
  const getCategorizedActions = useCallback(() => {
    const categories = {}
    
    actions.forEach(action => {
      const category = action.category || '其他'
      if (!categories[category]) {
        categories[category] = []
      }
      categories[category].push(action)
    })
    
    return categories
  }, [actions])

  // 获取收藏的动作
  const getFavoriteActions = useCallback(() => {
    return actions.filter(action => favorites.includes(action.id))
  }, [actions, favorites])

  // 获取最近使用的动作
  const getRecentActions = useCallback(() => {
    return recentActions
      .map(id => actions.find(a => a.id === id))
      .filter(Boolean)
  }, [actions, recentActions])

  // 搜索动作
  const searchActions = useCallback((query) => {
    if (!query) return actions
    const lowerQuery = query.toLowerCase()
    return actions.filter(action => 
      action.name.toLowerCase().includes(lowerQuery) ||
      action.category?.toLowerCase().includes(lowerQuery)
    )
  }, [actions])

  // 初始加载
  useEffect(() => {
    loadActions()
  }, [loadActions])

  // 清理
  useEffect(() => {
    return () => {
      if (currentAnimationRef.current) {
        currentAnimationRef.current.stop()
      }
      animationClipsRef.current.clear()
    }
  }, [])

  return {
    // 状态
    actions,
    isLoadingActions,
    currentAction,
    isPlaying,
    favorites,
    recentActions,
    
    // 方法
    loadActions,
    playAction,
    stopAction,
    toggleFavorite,
    isFavorite,
    getCategorizedActions,
    getFavoriteActions,
    getRecentActions,
    searchActions
  }
}

export default useActions
