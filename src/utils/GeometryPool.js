import * as THREE from 'three'

/**
 * 几何体对象池 - 复用几何体以减少内存分配
 */
export class GeometryPool {
  constructor() {
    this.pools = new Map()
    this.maxPoolSize = 10 // 每种类型最多保留10个
  }

  /**
   * 获取平面几何体
   */
  getPlaneGeometry(width, height) {
    const key = `plane_${width.toFixed(2)}_${height.toFixed(2)}`
    return this.getFromPool(key, () => new THREE.PlaneGeometry(width, height))
  }

  /**
   * 获取边框几何体
   */
  getEdgesGeometry(geometry) {
    const key = `edges_${geometry.uuid || 'unknown'}`
    return this.getFromPool(key, () => new THREE.EdgesGeometry(geometry))
  }

  /**
   * 获取圆环几何体（扫描环）
   */
  getRingGeometry(innerRadius, outerRadius, segments) {
    const key = `ring_${innerRadius}_${outerRadius}_${segments}`
    return this.getFromPool(key, () => new THREE.RingGeometry(innerRadius, outerRadius, segments))
  }

  /**
   * 从池中获取对象
   */
  getFromPool(key, factory) {
    if (!this.pools.has(key)) {
      this.pools.set(key, [])
    }
    
    const pool = this.pools.get(key)
    
    // 如果有可用的，直接返回
    if (pool.length > 0) {
      const item = pool.pop()
      // 重置对象状态
      if (item.isMesh) {
        item.visible = true
        item.position.set(0, 0, 0)
        item.rotation.set(0, 0, 0)
        item.scale.set(1, 1, 1)
      }
      return item
    }
    
    // 池中没有，创建新的
    return factory()
  }

  /**
   * 释放几何体回池中
   */
  release(geometry) {
    if (!geometry) return
    
    const key = this.getKey(geometry)
    if (!key) {
      // 无法识别类型，直接销毁
      geometry.dispose()
      return
    }
    
    if (!this.pools.has(key)) {
      this.pools.set(key, [])
    }
    
    const pool = this.pools.get(key)
    
    // 池满了就销毁，否则放回池中
    if (pool.length >= this.maxPoolSize) {
      geometry.dispose()
    } else {
      // 隐藏对象，准备复用
      if (geometry.isMesh) {
        geometry.visible = false
      }
      pool.push(geometry)
    }
  }

  /**
   * 获取几何体的key
   */
  getKey(geometry) {
    if (geometry.type === 'PlaneGeometry' && geometry.parameters) {
      const { width, height } = geometry.parameters
      return `plane_${width.toFixed(2)}_${height.toFixed(2)}`
    }
    if (geometry.type === 'RingGeometry' && geometry.parameters) {
      const { innerRadius, outerRadius, thetaSegments } = geometry.parameters
      return `ring_${innerRadius}_${outerRadius}_${thetaSegments}`
    }
    if (geometry.type === 'EdgesGeometry') {
      return `edges_${geometry.uuid || 'unknown'}`
    }
    return null
  }

  /**
   * 清空所有池
   */
  clear() {
    this.pools.forEach((pool) => {
      pool.forEach((item) => {
        if (item.dispose) {
          item.dispose()
        }
      })
    })
    this.pools.clear()
  }

  /**
   * 获取池的统计信息
   */
  getStats() {
    const stats = {}
    this.pools.forEach((pool, key) => {
      stats[key] = pool.length
    })
    return stats
  }
}

// 导出单例实例
export const geometryPool = new GeometryPool()
export default geometryPool
