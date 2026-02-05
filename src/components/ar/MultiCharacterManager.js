import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'

/**
 * 多角色管理器
 * 支持同时管理多个VRM角色，每个角色独立的动画Mixer
 */
export class MultiCharacterManager {
  constructor(scene) {
    this.scene = scene
    this.characters = new Map() // 存储所有角色
    this.selectedCharacterId = null // 当前选中的角色
    this.maxCharacters = 5 // 最大角色数
    
    // 共享资源
    this.sharedMaterials = new Map()
    this.loader = null
  }

  /**
   * 初始化加载器
   */
  initLoader() {
    if (this.loader) return
    
    this.loader = new GLTFLoader()
    this.loader.register((parser) => new VRMLoaderPlugin(parser))
  }

  /**
   * 添加角色
   * @param {string} vrmUrl - VRM模型URL
   * @param {Object} options - 配置选项
   * @returns {Promise<string>} 角色ID
   */
  async addCharacter(vrmUrl, options = {}) {
    // 检查是否超过最大角色数
    if (this.characters.size >= this.maxCharacters) {
      throw new Error(`最多只能添加${this.maxCharacters}个角色`)
    }

    this.initLoader()

    // 使用传入的ID或生成新ID
    const characterId = options.id || `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      // 加载VRM模型
      const gltf = await new Promise((resolve, reject) => {
        this.loader.load(vrmUrl, resolve, undefined, reject)
      })

      const vrm = gltf.userData.vrm
      
      // 优化模型
      VRMUtils.removeUnnecessaryVertices(gltf.scene)
      VRMUtils.combineSkeletons(gltf.scene)
      
      // 设置初始位置
      const position = options.position || { x: 0, y: 0, z: -2 }
      const rotation = options.rotation || { x: 0, y: 0, z: 0 }
      const scale = options.scale || 1

      vrm.scene.position.set(position.x, position.y, position.z)
      vrm.scene.rotation.set(rotation.x, rotation.y, rotation.z)
      vrm.scene.scale.setScalar(scale)

      // 简化材质
      this.optimizeMaterials(vrm)

      // 添加到场景
      this.scene.add(vrm.scene)

      // 创建动画Mixer
      const mixer = new THREE.AnimationMixer(vrm.scene)

      // 查找动画根节点
      const animationRoot = this.findAnimationRoot(vrm)

      // 存储角色信息
      const character = {
        id: characterId,
        vrm,
        mixer,
        animationRoot,
        name: options.name || `角色${this.characters.size + 1}`,
        color: this.getCharacterColor(this.characters.size),
        position,
        rotation,
        scale,
        currentAction: null,
        visible: true
      }

      this.characters.set(characterId, character)
      
      // 如果是第一个角色，默认选中
      if (this.characters.size === 1) {
        this.selectedCharacterId = characterId
      }

      console.log('✅ 角色添加成功:', character.name, characterId)
      return characterId

    } catch (error) {
      console.error('❌ 加载角色失败:', error)
      throw error
    }
  }

  /**
   * 移除角色
   * @param {string} characterId - 角色ID
   */
  removeCharacter(characterId) {
    const character = this.characters.get(characterId)
    if (!character) return

    // 停止动画
    if (character.mixer) {
      character.mixer.stopAllAction()
    }

    // 从场景移除
    if (character.vrm && character.vrm.scene) {
      this.scene.remove(character.vrm.scene)
      
      // 释放资源
      character.vrm.scene.traverse((obj) => {
        if (obj.isMesh) {
          if (obj.geometry) obj.geometry.dispose()
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(mat => this.disposeMaterial(mat))
            } else {
              this.disposeMaterial(obj.material)
            }
          }
        }
      })
    }

    this.characters.delete(characterId)

    // 如果删除的是选中的角色，重新选择
    if (this.selectedCharacterId === characterId) {
      const firstChar = this.characters.keys().next().value
      this.selectedCharacterId = firstChar || null
    }

    console.log('🗑️ 角色已移除:', characterId)
  }

  /**
   * 获取角色
   * @param {string} characterId - 角色ID
   */
  getCharacter(characterId) {
    return this.characters.get(characterId)
  }

  /**
   * 获取所有角色
   */
  getAllCharacters() {
    return Array.from(this.characters.values())
  }

  /**
   * 设置选中角色
   * @param {string} characterId - 角色ID
   */
  selectCharacter(characterId) {
    if (this.characters.has(characterId)) {
      this.selectedCharacterId = characterId
      console.log('👆 选中角色:', characterId)
    }
  }

  /**
   * 获取选中角色
   */
  getSelectedCharacter() {
    return this.characters.get(this.selectedCharacterId)
  }

  /**
   * 更新角色位置
   * @param {string} characterId - 角色ID
   * @param {Object} position - {x, y, z}
   */
  setCharacterPosition(characterId, position) {
    const character = this.characters.get(characterId)
    if (!character || !character.vrm) return

    character.vrm.scene.position.set(position.x, position.y, position.z)
    character.position = position
  }

  /**
   * 更新角色旋转
   * @param {string} characterId - 角色ID
   * @param {Object} rotation - {x, y, z}
   */
  setCharacterRotation(characterId, rotation) {
    const character = this.characters.get(characterId)
    if (!character || !character.vrm) return

    character.vrm.scene.rotation.set(rotation.x, rotation.y, rotation.z)
    character.rotation = rotation
  }

  /**
   * 更新角色缩放
   * @param {string} characterId - 角色ID
   * @param {number} scale - 缩放比例
   */
  setCharacterScale(characterId, scale) {
    const character = this.characters.get(characterId)
    if (!character || !character.vrm) return

    character.vrm.scene.scale.setScalar(scale)
    character.scale = scale
  }

  /**
   * 设置角色可见性
   * @param {string} characterId - 角色ID
   * @param {boolean} visible - 是否可见
   */
  setCharacterVisible(characterId, visible) {
    const character = this.characters.get(characterId)
    if (!character || !character.vrm) return

    character.vrm.scene.visible = visible
    character.visible = visible
  }

  /**
   * 播放角色动作
   * @param {string} characterId - 角色ID
   * @param {THREE.AnimationClip} clip - 动画Clip
   * @param {Object} options - 播放选项
   */
  playCharacterAction(characterId, clip, options = {}) {
    const character = this.characters.get(characterId)
    if (!character || !character.mixer) return

    const { 
      loop = true, 
      transitionDuration = 0.3,
      timeScale = 1
    } = options

    // 创建新动画
    const newAction = character.mixer.clipAction(clip, character.animationRoot)
    
    // 设置循环模式
    if (loop) {
      newAction.setLoop(THREE.LoopRepeat, Infinity)
    } else {
      newAction.setLoop(THREE.LoopOnce, 1)
      newAction.clampWhenFinished = true
    }

    // 平滑过渡
    if (character.currentAction && character.currentAction !== newAction) {
      character.currentAction.fadeOut(transitionDuration)
    }

    // 播放新动画
    newAction
      .reset()
      .setEffectiveTimeScale(timeScale)
      .setEffectiveWeight(0)
      .fadeIn(transitionDuration)
      .play()

    character.currentAction = newAction
    
    console.log('▶️ 播放动作:', character.name)
  }

  /**
   * 停止角色动画
   * @param {string} characterId - 角色ID
   * @param {number} fadeOutDuration - 淡出时间
   */
  stopCharacterAction(characterId, fadeOutDuration = 0.3) {
    const character = this.characters.get(characterId)
    if (!character || !character.currentAction) return

    character.currentAction.fadeOut(fadeOutDuration)
    character.currentAction = null
  }

  /**
   * 更新所有角色动画
   * @param {number} deltaTime - 时间差
   */
  update(deltaTime) {
    this.characters.forEach((character, id) => {
      if (!character.visible) return
      
      // 更新动画Mixer
      if (character.mixer) {
        character.mixer.update(deltaTime)
      }
      
      // 更新VRM（表情等）
      if (character.vrm) {
        character.vrm.update(deltaTime)
      }
    })
  }

  /**
   * 优化材质
   * @param {VRM} vrm - VRM对象
   */
  optimizeMaterials(vrm) {
    vrm.scene.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        // 关闭阴影
        obj.castShadow = false
        obj.receiveShadow = false
        
        // 压缩纹理
        this.compressMaterialTextures(obj.material)
      }
    })
  }

  /**
   * 压缩材质纹理
   */
  compressMaterialTextures(material) {
    const maxTextureSize = 1024
    
    const compressTexture = (texture) => {
      if (!texture || !texture.image) return
      
      const width = texture.image.width
      const height = texture.image.height
      
      if (width > maxTextureSize || height > maxTextureSize) {
        const canvas = document.createElement('canvas')
        const scale = Math.min(maxTextureSize / width, maxTextureSize / height)
        canvas.width = width * scale
        canvas.height = height * scale
        
        const ctx = canvas.getContext('2d')
        ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height)
        
        texture.image = canvas
        texture.needsUpdate = true
      }
    }
    
    const textureProperties = ['map', 'normalMap', 'roughnessMap', 'metalnessMap']
    textureProperties.forEach(prop => {
      if (material[prop]) {
        compressTexture(material[prop])
      }
    })
  }

  /**
   * 释放材质资源
   */
  disposeMaterial(material) {
    if (!material) return
    
    Object.keys(material).forEach(key => {
      const value = material[key]
      if (value && value.isTexture) {
        value.dispose()
      }
    })
    
    material.dispose()
  }

  /**
   * 查找动画根节点
   */
  findAnimationRoot(vrm) {
    let animationRoot = vrm.scene
    vrm.scene.traverse((child) => {
      if (child.name === 'G1' || child.name === 'Root' || 
          child.name === 'root' || child.name === 'Armature') {
        animationRoot = child
      }
    })
    return animationRoot
  }

  /**
   * 获取角色颜色（用于UI标识）
   */
  getCharacterColor(index) {
    const colors = [
      '#667eea', // 紫色
      '#f093fb', // 粉色
      '#4facfe', // 蓝色
      '#43e97b', // 绿色
      '#fa709a'  // 红色
    ]
    return colors[index % colors.length]
  }

  /**
   * 清理所有资源
   */
  dispose() {
    this.characters.forEach((character, id) => {
      this.removeCharacter(id)
    })
    this.characters.clear()
  }
}

export default MultiCharacterManager
