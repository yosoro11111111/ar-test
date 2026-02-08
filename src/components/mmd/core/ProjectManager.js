import JSZip from 'jszip'

/**
 * 项目管理器 - 处理 .ymmdpack 格式的导入导出
 */

const DB_NAME = 'MMDStudio'
const DB_VERSION = 3  // 增加版本号强制升级
const STORE_PROJECTS = 'projects'
const STORE_ASSETS = 'assets'
const STORE_RESOURCES = 'resources'
const STORE_DATA_PACKAGES = 'dataPackages'

class ProjectManager {
  constructor() {
    this.db = null
    this.currentProject = null
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      
      request.onerror = () => {
        console.error('IndexedDB 打开失败:', request.error)
        reject(request.error)
      }
      
      request.onsuccess = () => {
        this.db = request.result
        console.log('IndexedDB 打开成功')
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        console.log('IndexedDB 升级中...')
        
        // 创建所有需要的对象存储
        if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
          db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' })
          console.log('创建对象存储:', STORE_PROJECTS)
        }
        if (!db.objectStoreNames.contains(STORE_ASSETS)) {
          db.createObjectStore(STORE_ASSETS, { keyPath: 'id' })
          console.log('创建对象存储:', STORE_ASSETS)
        }
        if (!db.objectStoreNames.contains(STORE_RESOURCES)) {
          const resourceStore = db.createObjectStore(STORE_RESOURCES, { keyPath: 'id' })
          resourceStore.createIndex('type', 'type', { unique: false })
          resourceStore.createIndex('category', 'category', { unique: false })
          console.log('创建对象存储:', STORE_RESOURCES)
        }
        if (!db.objectStoreNames.contains(STORE_DATA_PACKAGES)) {
          db.createObjectStore(STORE_DATA_PACKAGES, { keyPath: 'id' })
          console.log('创建对象存储:', STORE_DATA_PACKAGES)
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
   * 创建新项目
   */
  createProject(config = {}) {
    const project = {
      id: this.generateId(),
      name: config.name || '未命名项目',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      version: '1.0',
      type: 'ymmd-project',
      
      // 画布设置
      canvas: {
        width: config.width || 1920,
        height: config.height || 1080,
        fps: config.fps || 30,
        duration: config.duration || 120
      },
      
      // 场景设置
      scene: {
        type: 'color',
        color: '#1a1a2e'
      },
      
      // 资源列表
      assets: [],
      
      // 角色列表
      characters: [],
      
      // 道具列表
      props: [],
      
      // 时间轴数据
      timeline: {
        tracks: [],
        clips: []
      },
      
      // 摄像机数据
      camera: {
        position: { x: 0, y: 5, z: 10 },
        target: { x: 0, y: 0, z: 0 },
        fov: 50
      }
    }
    
    this.currentProject = project
    return project
  }

  /**
   * 导出项目为 .ymmdpack
   */
  async exportProject(project, options = {}) {
    const zip = new JSZip()
    
    // 分离本地引用和嵌入资源
    const localAssets = []
    const embeddedAssets = []
    
    for (const asset of project.assets) {
      if (asset.refType === 'local') {
        localAssets.push(asset)
      } else if (asset.refType === 'embedded') {
        embeddedAssets.push(asset)
      }
    }
    
    // 创建 manifest
    const manifest = {
      version: '1.0',
      type: 'ymmd-project',
      name: project.name,
      createdAt: project.createdAt,
      modifiedAt: new Date().toISOString(),
      canvas: project.canvas,
      scene: project.scene,
      camera: project.camera,
      assets: project.assets.map(a => ({
        id: a.id,
        type: a.type,
        name: a.name,
        refType: a.refType,
        path: a.refType === 'embedded' ? `assets/${a.id}.${a.format}` : a.localPath,
        format: a.format,
        size: a.size
      })),
      characters: project.characters,
      props: project.props,
      timeline: project.timeline
    }
    
    zip.file('manifest.json', JSON.stringify(manifest, null, 2))
    
    // 添加嵌入的资源
    for (const asset of embeddedAssets) {
      if (asset.data) {
        const blob = asset.data instanceof Blob 
          ? asset.data 
          : new Blob([asset.data])
        zip.file(`assets/${asset.id}.${asset.format}`, blob)
      }
    }
    
    // 生成缩略图（如果有）
    if (options.thumbnail) {
      zip.file('thumbnail.jpg', options.thumbnail)
    }
    
    // 生成 zip
    const blob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    })
    
    return {
      blob,
      name: `${project.name}.ymmdpack`,
      size: blob.size,
      localAssetCount: localAssets.length,
      embeddedAssetCount: embeddedAssets.length
    }
  }

  /**
   * 导入 .ymmdpack 项目
   */
  async importProject(file) {
    const zip = await JSZip.loadAsync(file)
    
    // 读取 manifest
    const manifestContent = await zip.file('manifest.json').async('text')
    const manifest = JSON.parse(manifestContent)
    
    // 提取嵌入的资源
    const assets = []
    for (const assetInfo of manifest.assets) {
      if (assetInfo.refType === 'embedded') {
        const assetPath = `assets/${assetInfo.id}.${assetInfo.format}`
        const assetFile = zip.file(assetPath)
        if (assetFile) {
          const blob = await assetFile.async('blob')
          assets.push({
            ...assetInfo,
            data: blob,
            url: URL.createObjectURL(blob)
          })
        }
      } else {
        assets.push(assetInfo)
      }
    }
    
    // 重建项目
    const project = {
      ...manifest,
      assets,
      id: this.generateId(),
      importedAt: new Date().toISOString()
    }
    
    this.currentProject = project
    return project
  }

  /**
   * 保存项目到 IndexedDB
   */
  async saveProject(project) {
    project.modifiedAt = new Date().toISOString()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_PROJECTS], 'readwrite')
      const store = transaction.objectStore(STORE_PROJECTS)
      const request = store.put(project)
      
      request.onsuccess = () => resolve(project)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 从 IndexedDB 加载项目
   */
  async loadProject(projectId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_PROJECTS], 'readonly')
      const store = transaction.objectStore(STORE_PROJECTS)
      const request = store.get(projectId)
      
      request.onsuccess = () => {
        this.currentProject = request.result
        resolve(request.result)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 获取所有项目列表
   */
  async getProjectList() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_PROJECTS], 'readonly')
      const store = transaction.objectStore(STORE_PROJECTS)
      const request = store.getAll()
      
      request.onsuccess = () => {
        const projects = request.result.map(p => ({
          id: p.id,
          name: p.name,
          createdAt: p.createdAt,
          modifiedAt: p.modifiedAt,
          thumbnail: p.thumbnail
        }))
        resolve(projects)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 删除项目
   */
  async deleteProject(projectId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_PROJECTS], 'readwrite')
      const store = transaction.objectStore(STORE_PROJECTS)
      const request = store.delete(projectId)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 获取当前项目
   */
  getCurrentProject() {
    return this.currentProject
  }

  /**
   * 设置当前项目
   */
  setCurrentProject(project) {
    this.currentProject = project
  }

  /**
   * 更新项目数据
   */
  updateProject(updates) {
    if (!this.currentProject) return null
    
    this.currentProject = {
      ...this.currentProject,
      ...updates,
      modifiedAt: new Date().toISOString()
    }
    
    return this.currentProject
  }

  /**
   * 添加资源到项目
   */
  addAsset(asset) {
    if (!this.currentProject) return null
    
    const newAsset = {
      id: this.generateId(),
      ...asset,
      addedAt: new Date().toISOString()
    }
    
    this.currentProject.assets.push(newAsset)
    return newAsset
  }

  /**
   * 从项目移除资源
   */
  removeAsset(assetId) {
    if (!this.currentProject) return null
    
    this.currentProject.assets = this.currentProject.assets.filter(
      a => a.id !== assetId
    )
    
    return this.currentProject
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

export function getProjectManager() {
  if (!instance) {
    instance = new ProjectManager()
  }
  return instance
}

export function destroyProjectManager() {
  instance = null
}

export default ProjectManager
