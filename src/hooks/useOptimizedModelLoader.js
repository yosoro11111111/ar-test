import { useRef, useCallback, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'

/**
 * 质量等级配置
 */
const QUALITY_LEVELS = {
  low: {
    textureSize: 512,
    simplifyRatio: 0.5,
    maxBones: 32,
    shadowQuality: 'low',
    anisotropy: 1
  },
  medium: {
    textureSize: 1024,
    simplifyRatio: 0.8,
    maxBones: 64,
    shadowQuality: 'medium',
    anisotropy: 4
  },
  high: {
    textureSize: 2048,
    simplifyRatio: 1.0,
    maxBones: 128,
    shadowQuality: 'high',
    anisotropy: 16
  }
}

/**
 * LRU缓存实现
 */
class LRUModelCache {
  constructor(maxSize = 3) {
    this.maxSize = maxSize
    this.cache = new Map()
    this.accessOrder = []
  }

  get(key) {
    const item = this.cache.get(key)
    if (item) {
      // 更新访问顺序
      this.accessOrder = this.accessOrder.filter(k => k !== key)
      this.accessOrder.push(key)
      return item
    }
    return null
  }

  set(key, value) {
    // 如果已存在，先移除
    if (this.cache.has(key)) {
      this.accessOrder = this.accessOrder.filter(k => k !== key)
    }

    // 如果达到最大容量，移除最久未使用的
    while (this.cache.size >= this.maxSize && this.accessOrder.length > 0) {
      const oldestKey = this.accessOrder.shift()
      const oldestItem = this.cache.get(oldestKey)
      if (oldestItem) {
        this.disposeModel(oldestItem)
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, value)
    this.accessOrder.push(key)
  }

  disposeModel(item) {
    if (item.vrm?.scene) {
      item.vrm.scene.traverse((obj) => {
        if (obj.isMesh) {
          if (obj.geometry) obj.geometry.dispose()
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(m => this.disposeMaterial(m))
            } else {
              this.disposeMaterial(obj.material)
            }
          }
        }
      })
    }
  }

  disposeMaterial(material) {
    const textureProps = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'lightMap']
    textureProps.forEach(prop => {
      if (material[prop]) {
        material[prop].dispose()
      }
    })
    material.dispose()
  }

  clear() {
    this.cache.forEach(item => this.disposeModel(item))
    this.cache.clear()
    this.accessOrder = []
  }

  size() {
    return this.cache.size
  }
}

/**
 * 检测设备性能
 */
function detectDevicePerformance() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const isLowEnd = navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4
  
  if (isMobile && isLowEnd) return 'low'
  if (isMobile) return 'medium'
  return 'high'
}

/**
 * 优化的模型加载Hook
 * 功能：
 * 1. 模型缓存 - LRU缓存避免重复加载
 * 2. 分级加载 - 根据设备性能选择不同质量
 * 3. 渐进式加载 - 先显示低精度，再加载高精度
 * 4. 内存管理 - 自动清理未使用的模型
 */
export const useOptimizedModelLoader = () => {
  // 模型缓存
  const modelCache = useRef(new LRUModelCache(3))
  // 加载队列
  const loadQueue = useRef([])
  // 是否正在加载
  const isLoading = useRef(false)
  // GLTF加载器
  const loaderRef = useRef(null)
  // 当前质量等级
  const qualityLevelRef = useRef(detectDevicePerformance())
  // 加载状态
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    progress: 0,
    currentModel: null,
    quality: qualityLevelRef.current
  })

  // 初始化加载器
  const initLoader = useCallback(() => {
    if (!loaderRef.current) {
      loaderRef.current = new GLTFLoader()
      loaderRef.current.register((parser) => new VRMLoaderPlugin(parser))
      loaderRef.current.setCrossOrigin('anonymous')
      console.log('GLTFLoader 初始化成功，质量等级:', qualityLevelRef.current)
    }
    return loaderRef.current
  }, [])

  // 生成缓存key
  const getCacheKey = useCallback((file, quality = qualityLevelRef.current) => {
    const baseKey = file.localPath || file.name || String(file)
    return `${baseKey}@${quality}`
  }, [])

  // 清理模型缓存
  const clearModelCache = useCallback(() => {
    modelCache.current.clear()
    console.log('模型缓存已清理')
  }, [])

  // 从缓存获取模型
  const getFromCache = useCallback((file, quality = qualityLevelRef.current) => {
    const key = getCacheKey(file, quality)
    const cached = modelCache.current.get(key)
    if (cached) {
      console.log('从缓存加载模型:', key)
      return cached
    }
    return null
  }, [getCacheKey])

  // 添加到缓存
  const addToCache = useCallback((file, data, quality = qualityLevelRef.current) => {
    const key = getCacheKey(file, quality)
    modelCache.current.set(key, {
      ...data,
      timestamp: Date.now(),
      accessCount: 1,
      quality
    })
    console.log('模型已缓存:', key, '缓存大小:', modelCache.current.size())
  }, [getCacheKey])

  // 设置质量等级
  const setQualityLevel = useCallback((level) => {
    if (QUALITY_LEVELS[level]) {
      qualityLevelRef.current = level
      setLoadingState(prev => ({ ...prev, quality: level }))
      console.log('质量等级已设置为:', level)
    }
  }, [])

  // 加载单个模型
  const loadModel = useCallback(async (file, options = {}) => {
    const { 
      onProgress, 
      onComplete, 
      onError,
      useCache = true,
      priority = 0,
      quality = qualityLevelRef.current
    } = options

    // 检查缓存
    if (useCache) {
      const cached = getFromCache(file, quality)
      if (cached) {
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
        priority,
        quality
      })
      
      // 按优先级排序
      loadQueue.current.sort((a, b) => b.priority - a.priority)
      
      // 开始处理队列
      processQueue()
    })
  }, [getFromCache])

  // 处理加载队列
  const processQueue = useCallback(async () => {
    if (isLoading.current || loadQueue.current.length === 0) return
    
    isLoading.current = true
    const { file, options, resolve, reject, quality } = loadQueue.current.shift()
    const { onProgress, onComplete, onError } = options

    setLoadingState({
      isLoading: true,
      progress: 0,
      currentModel: file.name || 'Unknown',
      quality
    })

    try {
      const loader = initLoader()
      const result = await loadModelInternal(loader, file, quality, (progress) => {
        setLoadingState(prev => ({
          ...prev,
          progress: progress
        }))
        onProgress?.(progress)
      })

      // 添加到缓存
      addToCache(file, result, quality)

      setLoadingState({
        isLoading: false,
        progress: 100,
        currentModel: null,
        quality
      })

      onComplete?.(result)
      resolve(result)
    } catch (error) {
      console.error('模型加载失败:', error)
      setLoadingState({
        isLoading: false,
        progress: 0,
        currentModel: null,
        quality
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
  const loadModelInternal = useCallback((loader, file, quality, onProgress) => {
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
              optimizeVRM(vrm, quality)
              
              resolve({
                vrm,
                gltf,
                scene: vrm.scene,
                animations: gltf.animations || [],
                isVRM: true,
                quality
              })
            } else {
              // 普通GLTF模型
              optimizeGLTF(gltf.scene, quality)
              
              resolve({
                vrm: null,
                gltf,
                scene: gltf.scene,
                animations: gltf.animations || [],
                isVRM: false,
                quality
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
  const optimizeVRM = (vrm, quality) => {
    if (!vrm?.scene) return

    const config = QUALITY_LEVELS[quality] || QUALITY_LEVELS.medium

    // 设置默认变换
    vrm.scene.position.set(0, 0, 0)
    vrm.scene.rotation.set(0, Math.PI, 0)
    vrm.scene.scale.set(1, 1, 1)

    // 遍历优化材质
    vrm.scene.traverse((obj) => {
      if (obj.isMesh) {
        // 启用视锥体剔除
        obj.frustumCulled = true
        
        // 根据质量等级调整
        if (quality === 'low') {
          // 低质量：禁用阴影
          obj.castShadow = false
          obj.receiveShadow = false
        } else {
          obj.castShadow = true
          obj.receiveShadow = true
        }
        
        if (obj.material) {
          // 确保材质更新
          obj.material.needsUpdate = true
          
          // 优化MToon材质
          if (obj.material.isMToonMaterial) {
            // 限制纹理各向异性
            if (obj.material.map) {
              obj.material.map.anisotropy = config.anisotropy
            }
            
            // 低质量模式简化材质
            if (quality === 'low') {
              // 禁用复杂效果
              if (obj.material.normalMap) {
                obj.material.normalMap = null
              }
              if (obj.material.shadeTexture) {
                obj.material.shadeTexture = null
              }
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
              obj.material.map.anisotropy = config.anisotropy
            }
            
            // 低质量模式简化
            if (quality === 'low') {
              // 降低粗糙度/金属度贴图精度
              if (obj.material.roughnessMap) {
                obj.material.roughnessMap = null
              }
              if (obj.material.metalnessMap) {
                obj.material.metalnessMap = null
              }
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

    console.log(`VRM模型优化完成 [质量: ${quality}]`)
  }

  // 优化GLTF模型
  const optimizeGLTF = (scene, quality) => {
    if (!scene) return

    const config = QUALITY_LEVELS[quality] || QUALITY_LEVELS.medium

    scene.position.set(0, 0, 0)
    scene.rotation.set(0, 0, 0)
    scene.scale.set(1, 1, 1)

    scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.frustumCulled = true
        
        if (quality === 'low') {
          obj.castShadow = false
          obj.receiveShadow = false
        }
        
        if (obj.material) {
          obj.material.needsUpdate = true
          
          if (obj.material.map) {
            obj.material.map.anisotropy = config.anisotropy
          }
        }
      }
    })

    console.log(`GLTF模型优化完成 [质量: ${quality}]`)
  }

  // 预加载模型
  const preloadModels = useCallback(async (files, quality = qualityLevelRef.current) => {
    console.log('开始预加载', files.length, '个模型 [质量:', quality, ']')
    const results = []
    
    for (const file of files) {
      try {
        const result = await loadModel(file, { useCache: true, priority: 1, quality })
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
    return {
      size: modelCache.current.size(),
      maxSize: 3,
      quality: qualityLevelRef.current
    }
  }, [])

  // 渐进式加载（先低质量，后高质量）
  const loadModelProgressive = useCallback(async (file, options = {}) => {
    const { onProgress, onComplete, onError } = options
    
    // 首先尝试从缓存获取高质量版本
    const highQualityCache = getFromCache(file, 'high')
    if (highQualityCache) {
      onComplete?.(highQualityCache)
      return highQualityCache
    }
    
    // 检查是否有低质量缓存
    const lowQualityCache = getFromCache(file, 'low')
    if (lowQualityCache) {
      // 先返回低质量
      onComplete?.(lowQualityCache)
      
      // 后台加载高质量
      loadModel(file, { 
        ...options, 
        quality: 'high',
        priority: 0 
      }).then(highQuality => {
        // 可以在这里切换模型
        console.log('高质量模型加载完成，可以切换')
      })
      
      return lowQualityCache
    }
    
    // 直接加载
    return loadModel(file, options)
  }, [getFromCache, loadModel])

  return {
    loadModel,
    loadModelProgressive,
    preloadModels,
    clearModelCache,
    getCacheStats,
    setQualityLevel,
    loadingState,
    initLoader,
    QUALITY_LEVELS
  }
}

export default useOptimizedModelLoader
