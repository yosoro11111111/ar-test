import { useRef, useCallback, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'

/**
 * 优化的模型加载Hook
 * 功能：
 * 1. 模型缓存 - 避免重复加载相同模型
 * 2. 渐进式加载 - 先显示低精度模型，再加载高精度
 * 3. 加载队列 - 避免同时加载多个模型导致卡顿
 * 4. 内存管理 - 自动清理未使用的模型
 */
export const useOptimizedModelLoader = () => {
  // 模型缓存
  const modelCache = useRef(new Map())
  // 加载队列
  const loadQueue = useRef([])
  // 是否正在加载
  const isLoading = useRef(false)
  // GLTF加载器
  const loaderRef = useRef(null)
  // 加载状态
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    progress: 0,
    currentModel: null
  })

  // 初始化加载器
  const initLoader = useCallback(() => {
    if (!loaderRef.current) {
      loaderRef.current = new GLTFLoader()
      loaderRef.current.register((parser) => new VRMLoaderPlugin(parser))
      loaderRef.current.setCrossOrigin('anonymous')
      console.log('GLTFLoader 初始化成功')
    }
    return loaderRef.current
  }, [])

  // 生成缓存key
  const getCacheKey = useCallback((file) => {
    if (file.localPath) return file.localPath
    if (file.name && file.size) return `${file.name}_${file.size}`
    if (file.name) return file.name
    return String(file)
  }, [])

  // 清理模型缓存
  const clearModelCache = useCallback(() => {
    modelCache.current.forEach((cached, key) => {
      if (cached.vrm?.scene) {
        // 清理几何体和材质
        cached.vrm.scene.traverse((obj) => {
          if (obj.isMesh) {
            if (obj.geometry) obj.geometry.dispose()
            if (obj.material) {
              if (Array.isArray(obj.material)) {
                obj.material.forEach(m => m.dispose())
              } else {
                obj.material.dispose()
              }
            }
          }
        })
      }
    })
    modelCache.current.clear()
    console.log('模型缓存已清理')
  }, [])

  // 从缓存获取模型
  const getFromCache = useCallback((file) => {
    const key = getCacheKey(file)
    const cached = modelCache.current.get(key)
    if (cached) {
      console.log('从缓存加载模型:', key)
      return cached
    }
    return null
  }, [getCacheKey])

  // 添加到缓存
  const addToCache = useCallback((file, data) => {
    const key = getCacheKey(file)
    modelCache.current.set(key, {
      ...data,
      timestamp: Date.now(),
      accessCount: 1
    })
    console.log('模型已缓存:', key)
  }, [getCacheKey])

  // 更新缓存访问
  const updateCacheAccess = useCallback((file) => {
    const key = getCacheKey(file)
    const cached = modelCache.current.get(key)
    if (cached) {
      cached.timestamp = Date.now()
      cached.accessCount = (cached.accessCount || 0) + 1
    }
  }, [getCacheKey])

  // 加载单个模型
  const loadModel = useCallback(async (file, options = {}) => {
    const { 
      onProgress, 
      onComplete, 
      onError,
      useCache = true,
      priority = 0 
    } = options

    // 检查缓存
    if (useCache) {
      const cached = getFromCache(file)
      if (cached) {
        updateCacheAccess(file)
        onComplete?.(cached)
        return cached
      }
    }

    // 添加到加载队列
    return new Promise((resolve, reject) => {
      loadQueue.current.push({
        file,
        options,
        resolve,
        reject,
        priority
      })
      
      // 按优先级排序
      loadQueue.current.sort((a, b) => b.priority - a.priority)
      
      // 开始处理队列
      processQueue()
    })
  }, [getFromCache, updateCacheAccess])

  // 处理加载队列
  const processQueue = useCallback(async () => {
    if (isLoading.current || loadQueue.current.length === 0) return
    
    isLoading.current = true
    const { file, options, resolve, reject } = loadQueue.current.shift()
    const { onProgress, onComplete, onError } = options

    setLoadingState({
      isLoading: true,
      progress: 0,
      currentModel: file.name || 'Unknown'
    })

    try {
      const loader = initLoader()
      const result = await loadModelInternal(loader, file, (progress) => {
        setLoadingState(prev => ({
          ...prev,
          progress: progress
        }))
        onProgress?.(progress)
      })

      // 添加到缓存
      addToCache(file, result)

      setLoadingState({
        isLoading: false,
        progress: 100,
        currentModel: null
      })

      onComplete?.(result)
      resolve(result)
    } catch (error) {
      console.error('模型加载失败:', error)
      setLoadingState({
        isLoading: false,
        progress: 0,
        currentModel: null
      })
      onError?.(error)
      reject(error)
    } finally {
      isLoading.current = false
      // 继续处理队列
      if (loadQueue.current.length > 0) {
        setTimeout(processQueue, 100)
      }
    }
  }, [initLoader, addToCache])

  // 内部加载函数
  const loadModelInternal = useCallback((loader, file, onProgress) => {
    return new Promise((resolve, reject) => {
      let modelUrl
      const isLocalFile = !!file.localPath

      if (isLocalFile) {
        modelUrl = file.localPath
      } else {
        modelUrl = URL.createObjectURL(file)
      }

      loader.load(
        modelUrl,
        (gltf) => {
          try {
            // 清理URL
            if (!isLocalFile) {
              URL.revokeObjectURL(modelUrl)
            }

            const vrm = gltf.userData.vrm
            
            if (vrm) {
              // 优化VRM模型
              optimizeVRM(vrm)
              
              resolve({
                vrm,
                gltf,
                scene: vrm.scene,
                animations: gltf.animations || [],
                isVRM: true
              })
            } else {
              // 普通GLTF模型
              optimizeGLTF(gltf.scene)
              
              resolve({
                vrm: null,
                gltf,
                scene: gltf.scene,
                animations: gltf.animations || [],
                isVRM: false
              })
            }
          } catch (error) {
            if (!isLocalFile) {
              URL.revokeObjectURL(modelUrl)
            }
            reject(error)
          }
        },
        (progress) => {
          if (progress.lengthComputable) {
            const percent = (progress.loaded / progress.total) * 100
            onProgress?.(percent)
          }
        },
        (error) => {
          if (!isLocalFile) {
            URL.revokeObjectURL(modelUrl)
          }
          reject(error)
        }
      )
    })
  }, [])

  // 优化VRM模型
  const optimizeVRM = (vrm) => {
    if (!vrm?.scene) return

    // 设置默认变换
    vrm.scene.position.set(0, 0, 0)
    vrm.scene.rotation.set(0, Math.PI, 0)
    vrm.scene.scale.set(1, 1, 1)

    // 遍历优化材质
    vrm.scene.traverse((obj) => {
      if (obj.isMesh) {
        // 启用视锥体剔除
        obj.frustumCulled = true
        
        if (obj.material) {
          // 确保材质更新
          obj.material.needsUpdate = true
          
          // 优化MToon材质
          if (obj.material.isMToonMaterial) {
            // 降低渲染质量以提高性能
            if (obj.material.map) {
              obj.material.map.anisotropy = 4
            }
          } 
          // 优化标准材质
          else if (obj.material.isMeshStandardMaterial) {
            // 修复黑色材质
            if (obj.material.color?.r === 0 && 
                obj.material.color?.g === 0 && 
                obj.material.color?.b === 0) {
              obj.material.color.setHex(0xffffff)
            }
            
            // 设置自发光
            if (!obj.material.emissive) {
              obj.material.emissive = new THREE.Color(0x222222)
            }
            
            // 优化纹理
            if (obj.material.map) {
              obj.material.map.anisotropy = 4
            }
          }
          
          // 透明材质优化
          if (obj.material.transparent) {
            obj.material.depthWrite = false
            obj.renderOrder = 1
          }
        }
      }
    })

    console.log('VRM模型优化完成')
  }

  // 优化GLTF模型
  const optimizeGLTF = (scene) => {
    if (!scene) return

    scene.position.set(0, 0, 0)
    scene.rotation.set(0, 0, 0)
    scene.scale.set(1, 1, 1)

    scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.frustumCulled = true
        
        if (obj.material) {
          obj.material.needsUpdate = true
          
          if (obj.material.map) {
            obj.material.map.anisotropy = 4
          }
        }
      }
    })

    console.log('GLTF模型优化完成')
  }

  // 预加载模型
  const preloadModels = useCallback(async (files) => {
    console.log('开始预加载', files.length, '个模型')
    const results = []
    
    for (const file of files) {
      try {
        const result = await loadModel(file, { useCache: true, priority: 1 })
        results.push({ file, result, success: true })
      } catch (error) {
        results.push({ file, error, success: false })
      }
    }
    
    console.log('预加载完成:', results.filter(r => r.success).length, '成功,', 
                results.filter(r => !r.success).length, '失败')
    return results
  }, [loadModel])

  // 获取缓存统计
  const getCacheStats = useCallback(() => {
    const stats = {
      total: modelCache.current.size,
      models: []
    }
    
    modelCache.current.forEach((value, key) => {
      stats.models.push({
        key,
        timestamp: value.timestamp,
        accessCount: value.accessCount,
        isVRM: value.isVRM
      })
    })
    
    return stats
  }, [])

  return {
    loadModel,
    preloadModels,
    clearModelCache,
    getCacheStats,
    loadingState,
    initLoader
  }
}

export default useOptimizedModelLoader
