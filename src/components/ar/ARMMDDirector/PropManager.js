// 道具管理器 - 处理3D道具的加载和管理
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export class PropManager {
  constructor(scene) {
    this.scene = scene
    this.props = new Map() // 存储所有道具
    this.loader = new GLTFLoader()
  }

  // 加载道具
  async loadProp(propId, url, options = {}) {
    try {
      // 如果已存在，先移除
      if (this.props.has(propId)) {
        this.removeProp(propId)
      }

      const gltf = await this.loader.loadAsync(url)
      const prop = gltf.scene

      // 应用选项
      if (options.position) {
        prop.position.set(options.position.x, options.position.y, options.position.z)
      }
      if (options.rotation) {
        prop.rotation.set(options.rotation.x, options.rotation.y, options.rotation.z)
      }
      if (options.scale) {
        prop.scale.setScalar(options.scale)
      }

      // 启用阴影
      prop.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })

      // 添加到场景
      this.scene.add(prop)
      
      // 存储引用
      this.props.set(propId, {
        mesh: prop,
        url: url,
        options: options
      })

      return { success: true, prop: prop }
    } catch (error) {
      console.error('加载道具失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 移除道具
  removeProp(propId) {
    const propData = this.props.get(propId)
    if (propData) {
      this.scene.remove(propData.mesh)
      
      // 清理资源
      propData.mesh.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose()
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose())
            } else {
              child.material.dispose()
            }
          }
        }
      })
      
      this.props.delete(propId)
    }
  }

  // 更新道具位置
  updatePropPosition(propId, position) {
    const propData = this.props.get(propId)
    if (propData && propData.mesh) {
      propData.mesh.position.set(position.x, position.y, position.z)
      propData.options.position = position
    }
  }

  // 更新道具旋转
  updatePropRotation(propId, rotation) {
    const propData = this.props.get(propId)
    if (propData && propData.mesh) {
      propData.mesh.rotation.set(rotation.x, rotation.y, rotation.z)
      propData.options.rotation = rotation
    }
  }

  // 更新道具缩放
  updatePropScale(propId, scale) {
    const propData = this.props.get(propId)
    if (propData && propData.mesh) {
      propData.mesh.scale.setScalar(scale)
      propData.options.scale = scale
    }
  }

  // 获取道具
  getProp(propId) {
    return this.props.get(propId)
  }

  // 获取所有道具
  getAllProps() {
    return Array.from(this.props.entries())
  }

  // 清除所有道具
  clearAllProps() {
    this.props.forEach((propData, propId) => {
      this.removeProp(propId)
    })
  }

  // 销毁
  destroy() {
    this.clearAllProps()
    this.scene = null
    this.loader = null
  }
}

// 预设道具库
export const PRESET_PROPS = {
  cube: {
    id: 'cube',
    name: '立方体',
    description: '简单的立方体',
    createGeometry: () => new THREE.BoxGeometry(1, 1, 1)
  },
  sphere: {
    id: 'sphere',
    name: '球体',
    description: '完美的球体',
    createGeometry: () => new THREE.SphereGeometry(0.5, 32, 32)
  },
  cylinder: {
    id: 'cylinder',
    name: '圆柱体',
    description: '圆柱体',
    createGeometry: () => new THREE.CylinderGeometry(0.5, 0.5, 1, 32)
  },
  cone: {
    id: 'cone',
    name: '圆锥体',
    description: '圆锥体',
    createGeometry: () => new THREE.ConeGeometry(0.5, 1, 32)
  },
  torus: {
    id: 'torus',
    name: '圆环',
    description: '圆环形状',
    createGeometry: () => new THREE.TorusGeometry(0.5, 0.2, 16, 100)
  },
  plane: {
    id: 'plane',
    name: '平面',
    description: '地面平面',
    createGeometry: () => new THREE.PlaneGeometry(2, 2)
  }
}

// 创建预设道具
export const createPresetProp = (scene, propId, options = {}) => {
  const preset = PRESET_PROPS[propId]
  if (!preset) return null

  const geometry = preset.createGeometry()
  const material = new THREE.MeshStandardMaterial({
    color: options.color || 0x808080,
    roughness: 0.7,
    metalness: 0.3
  })
  
  const mesh = new THREE.Mesh(geometry, material)
  
  // 应用变换
  if (options.position) {
    mesh.position.set(options.position.x, options.position.y, options.position.z)
  }
  if (options.rotation) {
    mesh.rotation.set(options.rotation.x, options.rotation.y, options.rotation.z)
  }
  if (options.scale) {
    mesh.scale.setScalar(options.scale)
  }
  
  // 启用阴影
  mesh.castShadow = true
  mesh.receiveShadow = true
  
  scene.add(mesh)
  
  return {
    mesh,
    preset,
    options
  }
}
