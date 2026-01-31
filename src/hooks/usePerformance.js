import { useRef, useCallback, useEffect, useState } from 'react'
import * as THREE from 'three'

// 性能优化Hook - 包含懒加载、内存管理、LOD等功能
export const usePerformance = () => {
  const loadedModelsRef = useRef(new Map())
  const textureCacheRef = useRef(new Map())
  const geometryCacheRef = useRef(new Map())
  const disposeQueueRef = useRef([])
  const [performanceMode, setPerformanceMode] = useState('balanced') // 'high', 'balanced', 'low'
  const [fps, setFps] = useState(60)
  const fpsRef = useRef(60)
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())

  // 检测设备性能
  const detectDevicePerformance = useCallback(() => {
    const memory = navigator.deviceMemory || 4
    const cores = navigator.hardwareConcurrency || 4
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    if (isMobile && (memory < 4 || cores < 4)) {
      return 'low'
    } else if (memory >= 8 && cores >= 6 && !isMobile) {
      return 'high'
    }
    return 'balanced'
  }, [])

  // 初始化性能模式
  useEffect(() => {
    const detectedMode = detectDevicePerformance()
    setPerformanceMode(detectedMode)
    console.log(`[性能] 检测到设备性能模式: ${detectedMode}`)
  }, [detectDevicePerformance])

  // FPS监控
  useEffect(() => {
    let animationId
    const measureFps = () => {
      frameCountRef.current++
      const currentTime = performance.now()
      const delta = currentTime - lastTimeRef.current
      
      if (delta >= 1000) {
        const currentFps = Math.round((frameCountRef.current * 1000) / delta)
        fpsRef.current = currentFps
        setFps(currentFps)
        frameCountRef.current = 0
        lastTimeRef.current = currentTime
        
        // 根据FPS自动调整性能模式
        if (currentFps < 20 && performanceMode !== 'low') {
          console.log(`[性能] FPS过低(${currentFps})，切换到节能模式`)
          setPerformanceMode('low')
        }
      }
      
      animationId = requestAnimationFrame(measureFps)
    }
    
    animationId = requestAnimationFrame(measureFps)
    return () => cancelAnimationFrame(animationId)
  }, [performanceMode])

  // 懒加载模型
  const loadModelLazy = useCallback(async (modelPath, loader) => {
    // 检查缓存
    if (loadedModelsRef.current.has(modelPath)) {
      console.log(`[性能] 从缓存加载模型: ${modelPath}`)
      return loadedModelsRef.current.get(modelPath)
    }

    // 检查是否在加载中
    if (loadedModelsRef.current.has(`loading:${modelPath}`)) {
      console.log(`[性能] 等待模型加载中: ${modelPath}`)
      return loadedModelsRef.current.get(`loading:${modelPath}`)
    }

    // 创建加载Promise
    const loadPromise = new Promise(async (resolve, reject) => {
      try {
        console.log(`[性能] 开始懒加载模型: ${modelPath}`)
        const model = await loader.loadAsync(modelPath)
        
        // 根据性能模式优化模型
        optimizeModel(model, performanceMode)
        
        loadedModelsRef.current.set(modelPath, model)
        loadedModelsRef.current.delete(`loading:${modelPath}`)
        console.log(`[性能] 模型加载完成: ${modelPath}`)
        resolve(model)
      } catch (error) {
        loadedModelsRef.current.delete(`loading:${modelPath}`)
        reject(error)
      }
    })

    loadedModelsRef.current.set(`loading:${modelPath}`, loadPromise)
    return loadPromise
  }, [performanceMode])

  // 优化模型
  const optimizeModel = useCallback((model, mode) => {
    if (!model) return

    model.traverse((child) => {
      if (child.isMesh) {
        // 根据性能模式调整材质
        if (mode === 'low') {
          // 低性能模式：简化材质
          if (child.material) {
            child.material.roughness = 0.8
            child.material.metalness = 0.1
            child.material.envMapIntensity = 0.5
          }
          
          // 降低几何体复杂度
          if (child.geometry) {
            const count = child.geometry.attributes.position.count
            if (count > 10000) {
              console.log(`[性能] 简化几何体: ${count} -> 10000顶点`)
              // 这里可以添加几何体简化逻辑
            }
          }
        }

        // 启用视锥体剔除
        child.frustumCulled = true
        
        // 优化阴影
        if (mode === 'low') {
          child.castShadow = false
          child.receiveShadow = false
        }
      }
    })
  }, [])

  // 纹理缓存和压缩
  const loadTextureOptimized = useCallback(async (texturePath, loader) => {
    if (textureCacheRef.current.has(texturePath)) {
      return textureCacheRef.current.get(texturePath)
    }

    try {
      const texture = await loader.loadAsync(texturePath)
      
      // 根据性能模式调整纹理质量
      if (performanceMode === 'low') {
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.anisotropy = 1
      } else if (performanceMode === 'balanced') {
        texture.minFilter = THREE.LinearMipMapLinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.anisotropy = 4
      } else {
        texture.minFilter = THREE.LinearMipMapLinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.anisotropy = 16
      }

      textureCacheRef.current.set(texturePath, texture)
      return texture
    } catch (error) {
      console.error(`[性能] 纹理加载失败: ${texturePath}`, error)
      return null
    }
  }, [performanceMode])

  // 卸载模型并释放内存
  const unloadModel = useCallback((modelPath) => {
    const model = loadedModelsRef.current.get(modelPath)
    if (model) {
      console.log(`[性能] 卸载模型: ${modelPath}`)
      
      // 遍历释放资源
      model.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) {
            child.geometry.dispose()
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => disposeMaterial(mat))
            } else {
              disposeMaterial(child.material)
            }
          }
        }
      })
      
      loadedModelsRef.current.delete(modelPath)
    }
  }, [])

  // 释放材质资源
  const disposeMaterial = (material) => {
    if (!material) return
    
    // 释放纹理
    Object.keys(material).forEach(key => {
      const value = material[key]
      if (value && value.isTexture) {
        value.dispose()
      }
    })
    
    material.dispose()
  }

  // 批量卸载不常用模型
  const cleanupUnusedModels = useCallback((keepPaths = []) => {
    console.log(`[性能] 清理未使用的模型，保留: ${keepPaths.length}个`)
    
    const pathsToRemove = []
    loadedModelsRef.current.forEach((value, key) => {
      if (!key.startsWith('loading:') && !keepPaths.includes(key)) {
        pathsToRemove.push(key)
      }
    })
    
    pathsToRemove.forEach(path => unloadModel(path))
    console.log(`[性能] 已清理 ${pathsToRemove.length} 个模型`)
  }, [unloadModel])

  // 内存监控
  const getMemoryInfo = useCallback(() => {
    const info = {
      loadedModels: loadedModelsRef.current.size,
      cachedTextures: textureCacheRef.current.size,
      cachedGeometries: geometryCacheRef.current.size,
      fps: fpsRef.current,
      performanceMode
    }
    
    // 如果浏览器支持内存API
    if (performance.memory) {
      info.usedJSHeapSize = Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB'
      info.totalJSHeapSize = Math.round(performance.memory.totalJSHeapSize / 1048576) + ' MB'
    }
    
    return info
  }, [performanceMode])

  // 强制垃圾回收建议（实际GC由浏览器控制）
  const suggestGarbageCollection = useCallback(() => {
    // 清理缓存
    textureCacheRef.current.forEach((texture, path) => {
      if (!loadedModelsRef.current.has(path)) {
        texture.dispose()
        textureCacheRef.current.delete(path)
      }
    })
    
    geometryCacheRef.current.forEach((geometry, path) => {
      if (!loadedModelsRef.current.has(path)) {
        geometry.dispose()
        geometryCacheRef.current.delete(path)
      }
    })
    
    console.log('[性能] 建议浏览器进行垃圾回收')
    
    // 尝试触发GC（仅在部分浏览器有效）
    if (window.gc) {
      window.gc()
    }
  }, [])

  // 组件卸载时清理所有资源
  useEffect(() => {
    return () => {
      console.log('[性能] 清理所有资源')
      loadedModelsRef.current.forEach((model, path) => {
        if (!path.startsWith('loading:')) {
          unloadModel(path)
        }
      })
      textureCacheRef.current.forEach(texture => texture.dispose())
      geometryCacheRef.current.forEach(geometry => geometry.dispose())
    }
  }, [unloadModel])

  return {
    performanceMode,
    setPerformanceMode,
    fps,
    loadModelLazy,
    unloadModel,
    loadTextureOptimized,
    cleanupUnusedModels,
    getMemoryInfo,
    suggestGarbageCollection,
    optimizeModel
  }
}

// 模型LOD管理Hook
export const useLODManager = () => {
  const lodLevelsRef = useRef(new Map())

  // 创建LOD级别
  const createLODLevels = useCallback((model, distances = [10, 25, 50]) => {
    if (!model) return null

    const lod = new THREE.LOD()
    
    // 高细节级别（原始模型）
    lod.addLevel(model.clone(), 0)
    
    // 中细节级别
    const mediumDetail = model.clone()
    simplifyGeometry(mediumDetail, 0.5)
    lod.addLevel(mediumDetail, distances[0])
    
    // 低细节级别
    const lowDetail = model.clone()
    simplifyGeometry(lowDetail, 0.25)
    lod.addLevel(lowDetail, distances[1])
    
    // 最低细节（ billboard 或简单几何体）
    const lowestDetail = createBillboard(model)
    lod.addLevel(lowestDetail, distances[2])
    
    lodLevelsRef.current.set(model.uuid, lod)
    return lod
  }, [])

  // 简化几何体（示例实现）
  const simplifyGeometry = (object, ratio) => {
    object.traverse((child) => {
      if (child.isMesh && child.geometry) {
        // 这里可以集成真正的几何体简化算法
        // 如 @gltf-transform/functions 的 simplify 功能
        child.geometry = child.geometry.clone()
      }
    })
  }

  // 创建Billboard（远处用）
  const createBillboard = (model) => {
    // 创建一个简单的平面代替复杂模型
    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.8
    })
    return new THREE.Mesh(geometry, material)
  }

  // 更新LOD（在动画循环中调用）
  const updateLOD = useCallback((camera) => {
    lodLevelsRef.current.forEach((lod) => {
      lod.update(camera)
    })
  }, [])

  return {
    createLODLevels,
    updateLOD
  }
}

// 资源预加载Hook
export const usePreloader = () => {
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const queueRef = useRef([])

  // 添加资源到预加载队列
  const addToQueue = useCallback((resources) => {
    queueRef.current.push(...resources)
  }, [])

  // 开始预加载
  const startPreloading = useCallback(async (loader) => {
    if (queueRef.current.length === 0) return
    
    setIsLoading(true)
    setProgress(0)
    
    const total = queueRef.current.length
    let loaded = 0
    
    const loadPromises = queueRef.current.map(async (resource) => {
      try {
        await loader.loadAsync(resource)
        loaded++
        setProgress(Math.round((loaded / total) * 100))
      } catch (error) {
        console.error(`[预加载] 失败: ${resource}`, error)
      }
    })
    
    await Promise.all(loadPromises)
    setIsLoading(false)
    queueRef.current = []
  }, [])

  return {
    progress,
    isLoading,
    addToQueue,
    startPreloading
  }
}

export default usePerformance
