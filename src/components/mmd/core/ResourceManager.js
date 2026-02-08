/**
 * 资源管理器 - 管理所有资源（角色、道具、场景、动作、音乐）
 */

const DB_NAME = 'MMDStudio'
const DB_VERSION = 3  // 增加版本号强制升级
const STORE_RESOURCES = 'resources'

class ResourceManager {
  constructor() {
    this.db = null
    this.cache = new Map()
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      
      request.onerror = () => {
        console.error('ResourceManager IndexedDB 打开失败:', request.error)
        reject(request.error)
      }
      
      request.onsuccess = () => {
        this.db = request.result
        console.log('ResourceManager IndexedDB 打开成功')
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        console.log('ResourceManager IndexedDB 升级中...')
        if (!db.objectStoreNames.contains(STORE_RESOURCES)) {
          const store = db.createObjectStore(STORE_RESOURCES, { keyPath: 'id' })
          store.createIndex('type', 'type', { unique: false })
          store.createIndex('category', 'category', { unique: false })
          console.log('ResourceManager 创建对象存储:', STORE_RESOURCES)
        }
      }
    })
  }

  async ensureDB() {
    if (!this.db) {
      await this.initDB()
    }
    return this.db
  }

  /**
   * 添加资源
   */
  async addResource(resource) {
    const id = this.generateId()
    const resourceData = {
      id,
      type: resource.type,
      name: resource.name,
      category: resource.category || 'default',
      tags: resource.tags || [],
      thumbnail: resource.thumbnail,
      addedAt: new Date().toISOString(),
      ...resource
    }

    // 如果是文件类型，存储到 IndexedDB
    if (resource.file) {
      const arrayBuffer = await resource.file.arrayBuffer()
      resourceData.data = arrayBuffer
      resourceData.size = resource.file.size
      resourceData.format = this.getFileExtension(resource.file.name)
    }

    // 保存到 IndexedDB
    await this.saveToDB(resourceData)
    
    // 创建缓存 URL
    if (resourceData.data) {
      const blob = new Blob([resourceData.data])
      resourceData.url = URL.createObjectURL(blob)
      this.cache.set(id, resourceData.url)
    }

    return resourceData
  }

  /**
   * 从文件导入资源
   */
  async importFromFile(file, type, category = 'default') {
    const resource = {
      type,
      category,
      name: file.name.replace(/\.[^/.]+$/, ''),
      file,
      size: file.size,
      format: this.getFileExtension(file.name)
    }

    return this.addResource(resource)
  }

  /**
   * 批量导入资源
   */
  async importMultiple(files, type, category = 'default') {
    const resources = []
    for (const file of files) {
      try {
        const resource = await this.importFromFile(file, type, category)
        resources.push(resource)
      } catch (error) {
        console.error('导入失败:', file.name, error)
      }
    }
    return resources
  }

  /**
   * 获取资源
   */
  async getResource(id) {
    // 先检查缓存
    if (this.cache.has(id)) {
      const resource = await this.getFromDB(id)
      if (resource) {
        resource.url = this.cache.get(id)
        return resource
      }
    }

    // 从数据库获取
    const resource = await this.getFromDB(id)
    if (resource && resource.data) {
      const blob = new Blob([resource.data])
      resource.url = URL.createObjectURL(blob)
      this.cache.set(id, resource.url)
    }
    
    return resource
  }

  /**
   * 获取资源列表
   */
  async getResources(type = null, category = null) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_RESOURCES], 'readonly')
      const store = transaction.objectStore(STORE_RESOURCES)
      const request = store.getAll()
      
      request.onsuccess = () => {
        let resources = request.result
        
        if (type) {
          resources = resources.filter(r => r.type === type)
        }
        
        if (category) {
          resources = resources.filter(r => r.category === category)
        }
        
        // 为每个资源创建 URL
        resources.forEach(resource => {
          if (resource.data && !this.cache.has(resource.id)) {
            const blob = new Blob([resource.data])
            resource.url = URL.createObjectURL(blob)
            this.cache.set(resource.id, resource.url)
          } else if (this.cache.has(resource.id)) {
            resource.url = this.cache.get(resource.id)
          }
        })
        
        resolve(resources)
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 删除资源
   */
  async deleteResource(id) {
    // 释放缓存 URL
    if (this.cache.has(id)) {
      URL.revokeObjectURL(this.cache.get(id))
      this.cache.delete(id)
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_RESOURCES], 'readwrite')
      const store = transaction.objectStore(STORE_RESOURCES)
      const request = store.delete(id)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 更新资源
   */
  async updateResource(id, updates) {
    const resource = await this.getFromDB(id)
    if (!resource) return null

    const updatedResource = {
      ...resource,
      ...updates,
      modifiedAt: new Date().toISOString()
    }

    await this.saveToDB(updatedResource)
    return updatedResource
  }

  /**
   * 搜索资源
   */
  async searchResources(query, type = null) {
    const resources = await this.getResources(type)
    const lowerQuery = query.toLowerCase()
    
    return resources.filter(r => 
      r.name.toLowerCase().includes(lowerQuery) ||
      (r.tags && r.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
    )
  }

  /**
   * 获取资源类型统计
   */
  async getResourceStats() {
    const resources = await this.getResources()
    const stats = {}
    
    resources.forEach(r => {
      stats[r.type] = (stats[r.type] || 0) + 1
    })
    
    return stats
  }

  /**
   * 保存到 IndexedDB
   */
  saveToDB(resource) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_RESOURCES], 'readwrite')
      const store = transaction.objectStore(STORE_RESOURCES)
      const request = store.put(resource)
      
      request.onsuccess = () => resolve(resource)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 从 IndexedDB 获取
   */
  getFromDB(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_RESOURCES], 'readonly')
      const store = transaction.objectStore(STORE_RESOURCES)
      const request = store.get(id)
      
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 获取文件扩展名
   */
  getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase()
  }

  /**
   * 生成唯一ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.cache.forEach(url => URL.revokeObjectURL(url))
    this.cache.clear()
  }
}

// 单例实例
let instance = null

export function getResourceManager() {
  if (!instance) {
    instance = new ResourceManager()
  }
  return instance
}

export function destroyResourceManager() {
  if (instance) {
    instance.clearCache()
    instance = null
  }
}

export default ResourceManager
