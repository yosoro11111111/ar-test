// 模型优化工具 - 自动优化 VRM/GLB 模型性能
// 用于移动端性能优化

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter'
import { DRACOExporter } from 'three/examples/jsm/exporters/DRACOExporter'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils'

// 优化配置
const OPTIMIZATION_CONFIG = {
  // 几何体优化
  geometry: {
    // 简化比例 (0-1, 越小模型越简单)
    simplifyRatio: 0.5,
    // 移除重复顶点
    mergeVertices: true,
    // 合并材质相同的网格
    mergeMeshes: true,
    // 最大顶点数 (超过则简化)
    maxVertices: 50000,
    // 移除微小面片
    removeSmallFaces: true,
    smallFaceThreshold: 0.001
  },
  
  // 材质优化
  material: {
    // 压缩纹理
    compressTextures: true,
    // 纹理最大尺寸
    maxTextureSize: 1024,
    // 使用 KTX2 格式
    useKTX2: false,
    // 合并材质
    mergeMaterials: true,
    // 简化着色器
    simplifyShaders: true
  },
  
  // 骨骼优化
  skeleton: {
    // 最大骨骼数
    maxBones: 50,
    // 移除权重过小的骨骼影响
    weightThreshold: 0.01,
    // 合并相似骨骼
    mergeSimilarBones: true
  },
  
  // 导出配置
  export: {
    // 使用 Draco 压缩
    useDraco: true,
    // Draco 压缩级别 (0-10)
    dracoLevel: 7,
    // 二进制格式
    binary: true
  }
}

/**
 * 模型优化器类
 */
export class ModelOptimizer {
  constructor(config = {}) {
    this.config = { ...OPTIMIZATION_CONFIG, ...config }
    this.stats = {
      originalVertices: 0,
      optimizedVertices: 0,
      originalMaterials: 0,
      optimizedMaterials: 0,
      originalTextures: 0,
      optimizedTextures: 0,
      originalSize: 0,
      optimizedSize: 0
    }
  }

  /**
   * 加载模型
   */
  async loadModel(file) {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader()
      const url = URL.createObjectURL(file)
      
      loader.load(
        url,
        (gltf) => {
          URL.revokeObjectURL(url)
          resolve(gltf)
        },
        undefined,
        (error) => {
          URL.revokeObjectURL(url)
          reject(error)
        }
      )
    })
  }

  /**
   * 优化模型
   */
  async optimize(gltf) {
    const scene = gltf.scene.clone()
    
    // 统计原始数据
    this.collectStats(scene, 'original')
    
    // 1. 优化几何体
    await this.optimizeGeometry(scene)
    
    // 2. 优化材质
    await this.optimizeMaterials(scene)
    
    // 3. 优化骨骼
    await this.optimizeSkeleton(scene)
    
    // 4. 清理场景
    this.cleanupScene(scene)
    
    // 统计优化后数据
    this.collectStats(scene, 'optimized')
    
    return scene
  }

  /**
   * 优化几何体
   */
  async optimizeGeometry(scene) {
    const meshes = []
    
    scene.traverse((obj) => {
      if (obj.isMesh && obj.geometry) {
        meshes.push(obj)
      }
    })

    // 按材质分组
    const materialGroups = new Map()
    
    meshes.forEach(mesh => {
      const materialId = mesh.material.uuid
      if (!materialGroups.has(materialId)) {
        materialGroups.set(materialId, [])
      }
      materialGroups.get(materialId).push(mesh)
    })

    // 合并相同材质的网格
    if (this.config.geometry.mergeMeshes) {
      for (const [materialId, meshGroup] of materialGroups) {
        if (meshGroup.length > 1) {
          await this.mergeMeshGroup(meshGroup)
        }
      }
    }

    // 简化每个网格
    meshes.forEach(mesh => {
      if (mesh.geometry) {
        this.simplifyGeometry(mesh)
      }
    })
  }

  /**
   * 合并网格组
   */
  async mergeMeshGroup(meshes) {
    const geometries = []
    const materials = []
    
    meshes.forEach(mesh => {
      if (mesh.geometry) {
        // 应用世界变换
        const geometry = mesh.geometry.clone()
        geometry.applyMatrix4(mesh.matrixWorld)
        geometries.push(geometry)
        materials.push(mesh.material)
      }
    })

    if (geometries.length > 1) {
      try {
        const mergedGeometry = mergeGeometries(geometries)
        const mergedMesh = new THREE.Mesh(mergedGeometry, materials[0])
        
        // 复制第一个mesh的变换
        mergedMesh.position.copy(meshes[0].position)
        mergedMesh.rotation.copy(meshes[0].rotation)
        mergedMesh.scale.copy(meshes[0].scale)
        
        // 替换原mesh
        const parent = meshes[0].parent
        if (parent) {
          meshes.forEach(mesh => parent.remove(mesh))
          parent.add(mergedMesh)
        }
      } catch (error) {
        console.warn('合并网格失败:', error)
      }
    }
  }

  /**
   * 简化几何体
   */
  simplifyGeometry(mesh) {
    const geometry = mesh.geometry
    
    // 检查顶点数
    const vertexCount = geometry.attributes.position.count
    
    if (vertexCount > this.config.geometry.maxVertices) {
      // 使用简化算法 (这里使用简单的顶点合并)
      this.decimateGeometry(geometry)
    }

    // 移除重复顶点
    if (this.config.geometry.mergeVertices) {
      this.mergeDuplicateVertices(geometry)
    }

    // 计算法线和切线
    geometry.computeVertexNormals()
    
    // 释放内存
    geometry.dispose()
  }

  /**
   * 几何体减面 (简化)
   */
  decimateGeometry(geometry) {
    const positions = geometry.attributes.position.array
    const ratio = this.config.geometry.simplifyRatio
    
    // 简单的顶点采样简化
    const newCount = Math.floor(positions.length / 3 * ratio) * 3
    const newPositions = new Float32Array(newCount)
    
    // 每隔一定间隔采样
    const step = Math.floor(positions.length / newCount)
    for (let i = 0, j = 0; i < newCount && j < positions.length; i++, j += step) {
      newPositions[i] = positions[j]
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3))
    
    // 更新其他属性
    if (geometry.attributes.normal) {
      const normals = geometry.attributes.normal.array
      const newNormals = new Float32Array(newCount)
      for (let i = 0, j = 0; i < newCount && j < normals.length; i++, j += step) {
        newNormals[i] = normals[j]
      }
      geometry.setAttribute('normal', new THREE.BufferAttribute(newNormals, 3))
    }
    
    if (geometry.attributes.uv) {
      const uvs = geometry.attributes.uv.array
      const newUVs = new Float32Array(newCount / 3 * 2)
      const stepUV = Math.floor(uvs.length / newUVs.length)
      for (let i = 0, j = 0; i < newUVs.length && j < uvs.length; i++, j += stepUV) {
        newUVs[i] = uvs[j]
      }
      geometry.setAttribute('uv', new THREE.BufferAttribute(newUVs, 2))
    }
  }

  /**
   * 合并重复顶点
   */
  mergeDuplicateVertices(geometry) {
    const positions = geometry.attributes.position.array
    const tolerance = 0.0001
    const uniqueVertices = []
    const indexMap = new Map()
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const y = positions[i + 1]
      const z = positions[i + 2]
      
      // 查找相似顶点
      let found = false
      for (let j = 0; j < uniqueVertices.length; j++) {
        const v = uniqueVertices[j]
        if (Math.abs(v.x - x) < tolerance &&
            Math.abs(v.y - y) < tolerance &&
            Math.abs(v.z - z) < tolerance) {
          indexMap.set(i / 3, j)
          found = true
          break
        }
      }
      
      if (!found) {
        indexMap.set(i / 3, uniqueVertices.length)
        uniqueVertices.push({ x, y, z })
      }
    }
    
    // 重建几何体
    const newPositions = new Float32Array(uniqueVertices.length * 3)
    uniqueVertices.forEach((v, i) => {
      newPositions[i * 3] = v.x
      newPositions[i * 3 + 1] = v.y
      newPositions[i * 3 + 2] = v.z
    })
    
    geometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3))
  }

  /**
   * 优化材质
   */
  async optimizeMaterials(scene) {
    const materials = new Set()
    const textures = new Set()
    
    scene.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => materials.add(m))
        } else {
          materials.add(obj.material)
        }
      }
    })

    // 优化每个材质
    for (const material of materials) {
      await this.optimizeMaterial(material, textures)
    }

    // 合并相似材质
    if (this.config.material.mergeMaterials) {
      this.mergeSimilarMaterials(scene, materials)
    }
  }

  /**
   * 优化单个材质
   */
  async optimizeMaterial(material, textures) {
    // 简化材质属性
    if (this.config.material.simplifyShaders) {
      // 禁用复杂效果
      material.roughness = Math.max(material.roughness, 0.3)
      material.metalness = Math.min(material.metalness, 0.7)
      
      // 移除不必要的贴图
      if (material.aoMap && !material.aoMapIntensity) {
        material.aoMap = null
      }
      
      // 简化法线贴图
      if (material.normalMap && material.normalScale) {
        material.normalScale.set(1, 1)
      }
    }

    // 优化纹理
    const textureProps = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap']
    
    for (const prop of textureProps) {
      if (material[prop]) {
        await this.optimizeTexture(material[prop])
        textures.add(material[prop])
      }
    }
  }

  /**
   * 优化纹理
   */
  async optimizeTexture(texture) {
    if (!texture.image) return

    const maxSize = this.config.material.maxTextureSize
    
    // 检查是否需要缩放
    if (texture.image.width > maxSize || texture.image.height > maxSize) {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // 计算新尺寸
      let newWidth = texture.image.width
      let newHeight = texture.image.height
      
      if (newWidth > maxSize || newHeight > maxSize) {
        if (newWidth > newHeight) {
          newHeight = Math.round(newHeight * (maxSize / newWidth))
          newWidth = maxSize
        } else {
          newWidth = Math.round(newWidth * (maxSize / newHeight))
          newHeight = maxSize
        }
      }
      
      canvas.width = newWidth
      canvas.height = newHeight
      
      // 绘制缩放后的图像
      ctx.drawImage(texture.image, 0, 0, newWidth, newHeight)
      
      // 更新纹理
      texture.image = canvas
      texture.needsUpdate = true
    }

    // 优化纹理参数
    texture.anisotropy = 4
    
    // 如果不是透明纹理，使用 RGB 格式
    if (!texture.format || texture.format === THREE.RGBAFormat) {
      // 保持 RGBA 以支持透明度
    }
  }

  /**
   * 合并相似材质
   */
  mergeSimilarMaterials(scene, materials) {
    const materialMap = new Map()
    
    materials.forEach(material => {
      const key = this.getMaterialKey(material)
      if (!materialMap.has(key)) {
        materialMap.set(key, material)
      }
    })
    
    // 替换相似材质
    scene.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material = obj.material.map(m => {
            const key = this.getMaterialKey(m)
            return materialMap.get(key) || m
          })
        } else {
          const key = this.getMaterialKey(obj.material)
          const sharedMaterial = materialMap.get(key)
          if (sharedMaterial && sharedMaterial !== obj.material) {
            obj.material = sharedMaterial
          }
        }
      }
    })
  }

  /**
   * 获取材质唯一键
   */
  getMaterialKey(material) {
    return `${material.type}_${material.color?.getHexString()}_${material.map?.uuid}_${material.roughness}_${material.metalness}`
  }

  /**
   * 优化骨骼
   */
  async optimizeSkeleton(scene) {
    scene.traverse((obj) => {
      if (obj.isSkinnedMesh && obj.skeleton) {
        this.optimizeSkeletonWeights(obj)
      }
    })
  }

  /**
   * 优化骨骼权重
   */
  optimizeSkeletonWeights(mesh) {
    const skeleton = mesh.skeleton
    const geometry = mesh.geometry
    
    if (!geometry.attributes.skinWeight || !geometry.attributes.skinIndex) return

    const weights = geometry.attributes.skinWeight.array
    const indices = geometry.attributes.skinIndex.array
    
    // 限制每个顶点的骨骼影响数
    const maxInfluences = 4
    
    for (let i = 0; i < weights.length; i += 4) {
      // 收集权重
      const boneWeights = []
      for (let j = 0; j < 4; j++) {
        if (weights[i + j] > this.config.skeleton.weightThreshold) {
          boneWeights.push({
            index: indices[i + j],
            weight: weights[i + j]
          })
        }
      }
      
      // 按权重排序
      boneWeights.sort((a, b) => b.weight - a.weight)
      
      // 只保留前 maxInfluences 个
      const topWeights = boneWeights.slice(0, maxInfluences)
      
      // 重新归一化权重
      const totalWeight = topWeights.reduce((sum, w) => sum + w.weight, 0)
      
      // 重置权重
      for (let j = 0; j < 4; j++) {
        if (j < topWeights.length) {
          weights[i + j] = topWeights[j].weight / totalWeight
          indices[i + j] = topWeights[j].index
        } else {
          weights[i + j] = 0
          indices[i + j] = 0
        }
      }
    }
    
    geometry.attributes.skinWeight.needsUpdate = true
    geometry.attributes.skinIndex.needsUpdate = true
  }

  /**
   * 清理场景
   */
  cleanupScene(scene) {
    scene.traverse((obj) => {
      // 移除空对象
      if (obj.children.length === 0 && !obj.isMesh && !obj.isLight && !obj.isCamera) {
        if (obj.parent) {
          obj.parent.remove(obj)
        }
      }
      
      // 清理用户数据
      if (obj.userData) {
        delete obj.userData.gltfExtensions
      }
    })
  }

  /**
   * 收集统计信息
   */
  collectStats(scene, type) {
    let vertices = 0
    let materials = new Set()
    let textures = new Set()
    
    scene.traverse((obj) => {
      if (obj.isMesh && obj.geometry) {
        vertices += obj.geometry.attributes.position?.count || 0
        
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => materials.add(m.uuid))
          } else {
            materials.add(obj.material.uuid)
          }
        }
      }
    })
    
    this.stats[`${type}Vertices`] = vertices
    this.stats[`${type}Materials`] = materials.size
    this.stats[`${type}Textures`] = textures.size
  }

  /**
   * 导出优化后的模型
   */
  async export(scene, filename = 'optimized-model') {
    const exporter = new GLTFExporter()
    
    const options = {
      binary: this.config.export.binary,
      forcePowerOfTwoTextures: true,
      maxTextureSize: this.config.material.maxTextureSize
    }
    
    return new Promise((resolve, reject) => {
      exporter.parse(
        scene,
        (gltf) => {
          // 创建 Blob
          const blob = new Blob([gltf], { type: 'application/octet-stream' })
          
          // 创建下载链接
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${filename}.glb`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          
          this.stats.optimizedSize = blob.size
          resolve(blob)
        },
        (error) => {
          reject(error)
        },
        options
      )
    })
  }

  /**
   * 获取优化统计
   */
  getStats() {
    const vertexReduction = ((1 - this.stats.optimizedVertices / this.stats.originalVertices) * 100).toFixed(1)
    const sizeReduction = this.stats.originalSize > 0 
      ? ((1 - this.stats.optimizedSize / this.stats.originalSize) * 100).toFixed(1)
      : 0
    
    return {
      ...this.stats,
      vertexReduction: `${vertexReduction}%`,
      sizeReduction: `${sizeReduction}%`,
      materialReduction: this.stats.originalMaterials - this.stats.optimizedMaterials
    }
  }
}

/**
 * 快速优化模型 (简化版)
 */
export async function quickOptimizeModel(file, options = {}) {
  const optimizer = new ModelOptimizer({
    geometry: {
      simplifyRatio: options.quality === 'high' ? 0.8 : 0.5,
      maxVertices: options.maxVertices || 30000
    },
    material: {
      maxTextureSize: options.maxTextureSize || 1024
    }
  })
  
  // 加载模型
  const gltf = await optimizer.loadModel(file)
  
  // 优化
  const optimizedScene = await optimizer.optimize(gltf)
  
  // 导出
  await optimizer.export(optimizedScene, file.name.replace(/\.[^/.]+$/, '') + '_optimized')
  
  return optimizer.getStats()
}

/**
 * 批量优化模型
 */
export async function batchOptimizeModels(files, onProgress) {
  const results = []
  
  for (let i = 0; i < files.length; i++) {
    try {
      const stats = await quickOptimizeModel(files[i])
      results.push({ file: files[i].name, success: true, stats })
    } catch (error) {
      results.push({ file: files[i].name, success: false, error: error.message })
    }
    
    onProgress?.(i + 1, files.length)
  }
  
  return results
}

export default {
  ModelOptimizer,
  quickOptimizeModel,
  batchOptimizeModels,
  OPTIMIZATION_CONFIG
}
