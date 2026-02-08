import JSZip from 'jszip'

/**
 * 数据包管理器 - 处理 .smmdpack 格式的数据包
 */

const DB_NAME = 'MMDStudio'
const DB_VERSION = 3  // 增加版本号强制升级
const STORE_DATA_PACKAGES = 'dataPackages'

class DataPackageManager {
  constructor() {
    this.db = null
    this.packages = new Map()
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      
      request.onerror = () => {
        console.error('DataPackageManager IndexedDB 打开失败:', request.error)
        reject(request.error)
      }
      
      request.onsuccess = () => {
        this.db = request.result
        console.log('DataPackageManager IndexedDB 打开成功')
        this.loadAllPackages().then(resolve).catch(reject)
      }
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        console.log('DataPackageManager IndexedDB 升级中...')
        if (!db.objectStoreNames.contains(STORE_DATA_PACKAGES)) {
          db.createObjectStore(STORE_DATA_PACKAGES, { keyPath: 'id' })
          console.log('DataPackageManager 创建对象存储:', STORE_DATA_PACKAGES)
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
   * 导入数据包
   */
  async importPackage(file) {
    const zip = await JSZip.loadAsync(file)
    
    // 读取 manifest
    const manifestContent = await zip.file('manifest.json').async('text')
    const manifest = JSON.parse(manifestContent)
    
    const packageId = this.generateId()
    const dataPackage = {
      id: packageId,
      name: manifest.name,
      description: manifest.description,
      author: manifest.author,
      version: manifest.version,
      createdAt: manifest.createdAt,
      importedAt: new Date().toISOString(),
      manifest,
      data: file,
      categories: manifest.categories || {}
    }
    
    // 保存到 IndexedDB
    await this.saveToDB(dataPackage)
    
    // 缓存到内存
    this.packages.set(packageId, dataPackage)
    
    return dataPackage
  }

  /**
   * 获取数据包列表
   */
  async getPackageList() {
    const packages = []
    for (const [id, pkg] of this.packages) {
      packages.push({
        id,
        name: pkg.name,
        description: pkg.description,
        author: pkg.author,
        importedAt: pkg.importedAt,
        categories: Object.keys(pkg.categories || {})
      })
    }
    return packages
  }

  /**
   * 获取数据包详情
   */
  async getPackage(packageId) {
    if (this.packages.has(packageId)) {
      return this.packages.get(packageId)
    }
    
    const pkg = await this.getFromDB(packageId)
    if (pkg) {
      this.packages.set(packageId, pkg)
      return pkg
    }
    
    return null
  }

  /**
   * 从数据包获取资源
   */
  async getResourceFromPackage(packageId, category, resourceName) {
    const pkg = await this.getPackage(packageId)
    if (!pkg) return null
    
    const zip = await JSZip.loadAsync(pkg.data)
    const resourcePath = `${category}/${resourceName}`
    const file = zip.file(resourcePath)
    
    if (!file) return null
    
    const blob = await file.async('blob')
    return {
      name: resourceName,
      path: resourcePath,
      blob,
      url: URL.createObjectURL(blob)
    }
  }

  /**
   * 获取数据包中的所有资源
   */
  async getAllResourcesFromPackage(packageId, category) {
    const pkg = await this.getPackage(packageId)
    if (!pkg || !pkg.categories[category]) return []
    
    const zip = await JSZip.loadAsync(pkg.data)
    const resources = []
    
    for (const resourceInfo of pkg.categories[category]) {
      const file = zip.file(resourceInfo.file)
      if (file) {
        const blob = await file.async('blob')
        resources.push({
          ...resourceInfo,
          blob,
          url: URL.createObjectURL(blob),
          packageId
        })
      }
    }
    
    return resources
  }

  /**
   * 删除数据包
   */
  async deletePackage(packageId) {
    this.packages.delete(packageId)
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_DATA_PACKAGES], 'readwrite')
      const store = transaction.objectStore(STORE_DATA_PACKAGES)
      const request = store.delete(packageId)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 创建数据包
   */
  async createPackage(name, description, author, categories) {
    const zip = new JSZip()
    
    const manifest = {
      version: '1.0',
      type: 'smmd-data-package',
      name,
      description,
      author,
      createdAt: new Date().toISOString(),
      categories
    }
    
    zip.file('manifest.json', JSON.stringify(manifest, null, 2))
    
    // 添加资源文件
    for (const [category, resources] of Object.entries(categories)) {
      for (const resource of resources) {
        if (resource.file) {
          zip.file(`${category}/${resource.fileName || resource.name}`, resource.file)
        }
      }
    }
    
    const blob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE'
    })
    
    return {
      name: `${name}.smmdpack`,
      blob,
      size: blob.size
    }
  }

  /**
   * 加载所有数据包到内存
   */
  async loadAllPackages() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_DATA_PACKAGES], 'readonly')
      const store = transaction.objectStore(STORE_DATA_PACKAGES)
      const request = store.getAll()
      
      request.onsuccess = () => {
        for (const pkg of request.result) {
          this.packages.set(pkg.id, pkg)
        }
        resolve()
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 保存到 IndexedDB
   */
  saveToDB(dataPackage) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_DATA_PACKAGES], 'readwrite')
      const store = transaction.objectStore(STORE_DATA_PACKAGES)
      const request = store.put(dataPackage)
      
      request.onsuccess = () => resolve(dataPackage)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 从 IndexedDB 获取
   */
  getFromDB(packageId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_DATA_PACKAGES], 'readonly')
      const store = transaction.objectStore(STORE_DATA_PACKAGES)
      const request = store.get(packageId)
      
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 生成唯一ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// 单例实例
let instance = null

export function getDataPackageManager() {
  if (!instance) {
    instance = new DataPackageManager()
  }
  return instance
}

export function destroyDataPackageManager() {
  instance = null
}

export default DataPackageManager
