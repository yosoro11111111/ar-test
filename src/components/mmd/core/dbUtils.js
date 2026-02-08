/**
 * 数据库工具 - 处理IndexedDB的初始化和重置
 */

const DB_NAME = 'MMDStudio'
const DB_VERSION = 4  // 再次升级以强制重建

/**
 * 删除并重新创建数据库
 */
export async function resetDatabase() {
  return new Promise((resolve, reject) => {
    // 先关闭所有连接
    const closeRequest = indexedDB.open(DB_NAME)
    closeRequest.onsuccess = () => {
      const db = closeRequest.result
      db.close()
      
      // 删除数据库
      const deleteRequest = indexedDB.deleteDatabase(DB_NAME)
      deleteRequest.onsuccess = () => {
        console.log('数据库已删除')
        resolve()
      }
      deleteRequest.onerror = () => reject(deleteRequest.error)
      deleteRequest.onblocked = () => {
        console.warn('数据库删除被阻塞，请刷新页面')
        resolve() // 继续执行
      }
    }
    closeRequest.onerror = () => {
      // 如果打开失败，直接尝试删除
      const deleteRequest = indexedDB.deleteDatabase(DB_NAME)
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => reject(deleteRequest.error)
    }
  })
}

/**
 * 打开数据库（自动创建所有存储）
 */
export async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => {
      console.error('打开数据库失败:', request.error)
      reject(request.error)
    }
    
    request.onsuccess = () => {
      const db = request.result
      console.log('数据库打开成功，版本:', db.version)
      resolve(db)
    }
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      console.log('数据库升级中，旧版本:', event.oldVersion, '新版本:', event.newVersion)
      
      // 创建项目存储
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' })
        console.log('创建存储: projects')
      }
      
      // 创建资源存储
      if (!db.objectStoreNames.contains('resources')) {
        const resourceStore = db.createObjectStore('resources', { keyPath: 'id' })
        resourceStore.createIndex('type', 'type', { unique: false })
        resourceStore.createIndex('category', 'category', { unique: false })
        console.log('创建存储: resources')
      }
      
      // 创建数据包存储
      if (!db.objectStoreNames.contains('dataPackages')) {
        db.createObjectStore('dataPackages', { keyPath: 'id' })
        console.log('创建存储: dataPackages')
      }
      
      // 创建资产存储
      if (!db.objectStoreNames.contains('assets')) {
        db.createObjectStore('assets', { keyPath: 'id' })
        console.log('创建存储: assets')
      }
    }
  })
}

/**
 * 确保数据库已初始化
 */
export async function ensureDatabase() {
  try {
    // 尝试检查存储是否存在
    const db = await openDatabase()
    const stores = ['projects', 'resources', 'dataPackages', 'assets']
    const missingStores = stores.filter(store => !db.objectStoreNames.contains(store))
    
    if (missingStores.length > 0) {
      console.warn('缺少存储:', missingStores, '需要重置数据库')
      db.close()
      await resetDatabase()
      return await openDatabase()
    }
    
    return db
  } catch (error) {
    console.error('确保数据库失败:', error)
    // 尝试重置
    await resetDatabase()
    return await openDatabase()
  }
}

/**
 * 获取存储中的所有数据
 */
export async function getAllFromStore(storeName) {
  const db = await ensureDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()
    
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * 添加数据到存储
 */
export async function addToStore(storeName, data) {
  const db = await ensureDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.put(data)
    
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * 从存储中删除数据
 */
export async function deleteFromStore(storeName, id) {
  const db = await ensureDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.delete(id)
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
