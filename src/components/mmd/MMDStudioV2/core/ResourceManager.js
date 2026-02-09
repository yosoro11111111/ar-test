/**
 * 资源管理器 V4
 * 
 * 功能：
 * - 从 assets.json 读取资源定义
 * - 显示可加载的资源列表
 * - 加载资源到本地
 * - 导出资源包（选择已加载的资源）
 */
export class ResourceManager {
  constructor() {
    // 可加载的资源（从 assets.json 读取）
    this.availableResources = {
      characters: [],
      props: [],
      scenes: [],
      motions: [],
      music: []
    }
    
    // 已加载的资源（用户选择加载的）
    this.loadedResources = {
      characters: [],
      props: [],
      scenes: [],
      motions: [],
      music: []
    }
    
    // 资源包
    this.resourcePacks = new Map()
  }

  /**
   * 扫描 public 文件夹获取可加载资源
   */
  async scanPublicFolder() {
    try {
      // 加载 assets.json
      const response = await fetch('/assets.json')
      if (!response.ok) {
        console.warn('无法加载 assets.json')
        return this.getEmptyResources()
      }
      
      const data = await response.json()
      console.log('加载的 assets.json:', data)
      
      // 清空之前的资源
      this.availableResources = this.getEmptyResources()
      
      this.parseAssetsJson(data)
      
      console.log('解析后的可用资源:', this.availableResources)
      console.log('角色数量:', this.availableResources.characters.length)
      console.log('道具数量:', this.availableResources.props.length)
      console.log('场景数量:', this.availableResources.scenes.length)
      console.log('动作数量:', this.availableResources.motions.length)
      
      // 返回深拷贝，避免引用问题
      return {
        characters: [...this.availableResources.characters],
        props: [...this.availableResources.props],
        scenes: [...this.availableResources.scenes],
        motions: [...this.availableResources.motions],
        music: [...this.availableResources.music]
      }
    } catch (error) {
      console.error('扫描 public 文件夹失败:', error)
      return this.getEmptyResources()
    }
  }

  /**
   * 解析 assets.json
   * 自动将绝对路径转换为相对路径，支持子目录部署
   */
  parseAssetsJson(data) {
    if (!data.categories) return

    // 辅助函数：转换路径为相对路径
    const toRelativePath = (path) => {
      if (!path) return path
      // 移除开头的斜杠，转换为相对路径
      return path.startsWith('/') ? path.substring(1) : path
    }

    // 解析角色
    if (data.categories.characters?.subCategories) {
      Object.entries(data.categories.characters.subCategories).forEach(([categoryKey, category]) => {
        if (category.items) {
          category.items.forEach((item, index) => {
            this.availableResources.characters.push({
              id: `char_${categoryKey}_${index}`,
              name: item.name || item.file,
              path: toRelativePath(item.path),
              category: category.name || categoryKey,
              categoryKey: categoryKey,
              type: 'characters',
              status: 'available',
              loaded: false,
              size: item.size
            })
          })
        }
      })
    }

    // 解析道具
    if (data.categories.props?.subCategories) {
      Object.entries(data.categories.props.subCategories).forEach(([categoryKey, category]) => {
        if (category.items) {
          category.items.forEach((item, index) => {
            this.availableResources.props.push({
              id: `prop_${categoryKey}_${index}`,
              name: item.name || item.file,
              path: toRelativePath(item.path),
              category: category.name || categoryKey,
              categoryKey: categoryKey,
              type: 'props',
              status: 'available',
              loaded: false,
              size: item.size
            })
          })
        }
      })
    }

    // 解析场景
    if (data.categories.scenes?.subCategories) {
      Object.entries(data.categories.scenes.subCategories).forEach(([categoryKey, category]) => {
        if (category.items) {
          category.items.forEach((item, index) => {
            this.availableResources.scenes.push({
              id: `scene_${categoryKey}_${index}`,
              name: item.name || item.file,
              path: toRelativePath(item.path),
              category: category.name || categoryKey,
              categoryKey: categoryKey,
              type: 'scenes',
              status: 'available',
              loaded: false,
              size: item.size
            })
          })
        }
      })
    }

    // 解析动作
    if (data.categories.motions?.subCategories) {
      Object.entries(data.categories.motions.subCategories).forEach(([categoryKey, category]) => {
        if (category.items) {
          category.items.forEach((item, index) => {
            this.availableResources.motions.push({
              id: `motion_${categoryKey}_${index}`,
              name: item.name || item.file.replace('.vrma', ''),
              path: toRelativePath(item.path),
              category: category.name || categoryKey,
              categoryKey: categoryKey,
              type: 'motions',
              status: 'available',
              loaded: false,
              duration: item.duration,
              size: item.size
            })
          })
        }
      })
    }
  }

  /**
   * 加载资源
   */
  async loadResource(resource) {
    try {
      // 标记为已加载
      resource.status = 'loaded'
      resource.loaded = true
      resource.loadedAt = new Date().toISOString()
      
      // 添加到已加载列表
      const type = resource.type
      if (!this.loadedResources[type].find(r => r.id === resource.id)) {
        this.loadedResources[type].push({ ...resource })
      }
      
      // 在可加载列表中标记
      const availIndex = this.availableResources[type].findIndex(r => r.id === resource.id)
      if (availIndex > -1) {
        this.availableResources[type][availIndex].status = 'loaded'
        this.availableResources[type][availIndex].loaded = true
      }
      
      return resource
    } catch (error) {
      console.error(`加载资源失败: ${resource.name}`, error)
      throw error
    }
  }

  /**
   * 批量加载资源（带进度回调）
   * @param {Array} resources - 资源列表
   * @param {Function} onProgress - 进度回调 (current, total, resourceName)
   * @param {Function} onResourceLoaded - 单个资源加载完成回调
   */
  async loadResources(resources, onProgress, onResourceLoaded) {
    const results = []
    const total = resources.length
    
    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i]
      try {
        // 通知进度
        onProgress?.(i, total, resource.name)
        
        // 模拟加载延迟（实际项目中这里是真实的资源加载）
        await this.simulateLoading(resource)
        
        const loaded = await this.loadResource(resource)
        results.push(loaded)
        
        // 通知单个资源加载完成
        onResourceLoaded?.(loaded, i + 1, total)
      } catch (error) {
        console.error(`加载资源失败: ${resource.name}`, error)
      }
    }
    
    // 最终进度
    onProgress?.(total, total, null)
    return results
  }
  
  /**
   * 模拟资源加载（实际项目中删除此方法）
   */
  async simulateLoading(resource) {
    // 根据资源大小模拟加载时间
    const size = parseFloat(resource.size) || 10
    const delay = Math.min(size * 10, 500) // 最大500ms
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * 卸载资源
   */
  unloadResource(resourceId, type) {
    // 从已加载列表移除
    this.loadedResources[type] = this.loadedResources[type].filter(r => r.id !== resourceId)
    
    // 在可加载列表中标记为未加载
    const resource = this.availableResources[type].find(r => r.id === resourceId)
    if (resource) {
      resource.status = 'available'
      resource.loaded = false
    }
  }

  /**
   * 获取可加载的资源
   */
  getAvailableResources() {
    return {
      characters: [...this.availableResources.characters],
      props: [...this.availableResources.props],
      scenes: [...this.availableResources.scenes],
      motions: [...this.availableResources.motions],
      motionGroups: [...(this.availableResources.motionGroups || [])],
      music: [...this.availableResources.music],
      models: [...(this.availableResources.models || [])]
    }
  }

  /**
   * 获取已加载的资源
   */
  getLoadedResources() {
    return {
      characters: [...this.loadedResources.characters],
      props: [...this.loadedResources.props],
      scenes: [...this.loadedResources.scenes],
      motions: [...this.loadedResources.motions],
      music: [...this.loadedResources.music]
    }
  }

  /**
   * 按分类获取可加载资源
   */
  getAvailableResourcesByCategory(type, category) {
    if (category === 'all') {
      return this.availableResources[type] || []
    }
    return (this.availableResources[type] || []).filter(r => 
      r.category === category || r.categoryKey === category
    )
  }

  /**
   * 按分类获取已加载资源
   */
  getLoadedResourcesByCategory(type, category) {
    if (category === 'all') {
      return this.loadedResources[type] || []
    }
    return (this.loadedResources[type] || []).filter(r => 
      r.category === category || r.categoryKey === category
    )
  }

  /**
   * 获取分类列表
   */
  getCategories(type) {
    const categories = new Map()
    this.availableResources[type]?.forEach(r => {
      if (r.category && !categories.has(r.category)) {
        categories.set(r.category, r.categoryKey || r.category)
      }
    })
    return Array.from(categories.entries()).map(([name, key]) => ({
      id: key,
      name: name
    }))
  }

  /**
   * 导出资源包（包含实际文件内容）
   */
  async exportResourcePack(packName, selectedResources) {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    
    // 创建资源包元数据
    const packMeta = {
      name: packName,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      type: 'smmdpack',
      resources: {}
    }
    
    let fileCount = 0
    
    // 遍历所有选中的资源类型
    for (const [type, items] of Object.entries(selectedResources)) {
      if (!Array.isArray(items) || items.length === 0) continue
      
      packMeta.resources[type] = []
      
      // 为每种资源类型创建文件夹
      const typeFolder = zip.folder(type)
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const fileName = item.path ? item.path.split('/').pop() : `${item.id || i}.bin`
        const uniqueFileName = `${i}_${fileName}`
        
        try {
          // 读取文件内容
          if (item.path) {
            console.log(`正在读取文件: ${item.path}`)
            const response = await fetch(item.path)
            if (!response.ok) {
              console.warn(`无法读取文件: ${item.path}`)
              continue
            }
            
            const blob = await response.blob()
            typeFolder.file(uniqueFileName, blob)
            fileCount++
            
            // 保存资源元数据（不包含完整路径）
            packMeta.resources[type].push({
              ...item,
              packFileName: uniqueFileName,
              originalPath: item.path,
              size: blob.size
            })
          }
        } catch (error) {
          console.error(`读取文件失败 ${item.path}:`, error)
        }
      }
    }
    
    // 添加元数据文件
    zip.file('pack.json', JSON.stringify(packMeta, null, 2))
    
    console.log(`资源包创建完成: ${packName}, 包含 ${fileCount} 个文件`)
    
    // 生成 zip 文件
    const content = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    })
    
    return { blob: content, meta: packMeta }
  }

  /**
   * 导入资源包（包含实际文件内容）
   */
  async importResourcePack(packFile) {
    const JSZip = (await import('jszip')).default
    
    try {
      // 读取 zip 文件
      const zip = await JSZip.loadAsync(packFile)
      
      // 读取元数据
      const packJson = await zip.file('pack.json').async('string')
      const packMeta = JSON.parse(packJson)
      
      console.log('解析资源包:', packMeta.name, '资源类型:', Object.keys(packMeta.resources || {}))
      
      if (!packMeta.name || !packMeta.resources) {
        throw new Error('无效的资源包格式: 缺少 name 或 resources 字段')
      }
      
      const packId = `pack_${Date.now()}`
      let addedCount = 0
      const extractedFiles = new Map()
      
      // 提取所有文件并创建 Blob URL
      for (const [type, items] of Object.entries(packMeta.resources)) {
        if (!Array.isArray(items)) continue
        
        console.log(`导入 ${type}: ${items.length} 个资源`)
        
        for (const item of items) {
          if (item.packFileName) {
            const filePath = `${type}/${item.packFileName}`
            const file = zip.file(filePath)
            
            if (file) {
              // 提取文件内容为 Blob
              const fileBlob = await file.async('blob')
              const blobUrl = URL.createObjectURL(fileBlob)
              extractedFiles.set(item.packFileName, blobUrl)
              
              // 更新资源路径为 Blob URL
              item.path = blobUrl
              item.packId = packId
              item.isExtracted = true
            }
          }
          
          // 添加到可用资源列表
          if (this.availableResources[type]) {
            this.availableResources[type].push({
              ...item,
              id: `${packId}_${type}_${addedCount}`,
              packId: packId,
              packName: packMeta.name,
              status: 'available',
              loaded: false
            })
            addedCount++
          } else {
            console.warn(`未知的资源类型: ${type}，跳过`)
          }
        }
      }
      
      // 保存资源包信息
      this.resourcePacks.set(packId, {
        ...packMeta,
        extractedFiles,
        importTime: new Date().toISOString()
      })
      
      console.log(`资源包导入完成: ${packMeta.name}, 共添加 ${addedCount} 个资源`)
      
      return {
        id: packId,
        ...packMeta,
        addedCount
      }
    } catch (error) {
      console.error('导入资源包失败:', error)
      throw error
    }
  }

  /**
   * 获取资源统计
   */
  getStats() {
    return {
      available: {
        characters: this.availableResources.characters.length,
        props: this.availableResources.props.length,
        scenes: this.availableResources.scenes.length,
        motions: this.availableResources.motions.length,
        music: this.availableResources.music.length,
        total: Object.values(this.availableResources).flat().length
      },
      loaded: {
        characters: this.loadedResources.characters.length,
        props: this.loadedResources.props.length,
        scenes: this.loadedResources.scenes.length,
        motions: this.loadedResources.motions.length,
        music: this.loadedResources.music.length,
        total: Object.values(this.loadedResources).flat().length
      },
      packs: this.resourcePacks.size
    }
  }

  /**
   * 获取已加载的资源包列表
   */
  getLoadedPacks() {
    return Array.from(this.resourcePacks.entries()).map(([id, pack]) => ({
      id,
      ...pack
    }))
  }

  /**
   * 获取空资源对象
   */
  getEmptyResources() {
    return {
      characters: [],
      props: [],
      scenes: [],
      motions: [],
      music: []
    }
  }

  /**
   * 重置
   */
  reset() {
    this.availableResources = this.getEmptyResources()
    this.loadedResources = this.getEmptyResources()
    this.resourcePacks.clear()
  }
}
