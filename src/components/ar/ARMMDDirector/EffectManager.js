// 特效管理器 - 处理粒子效果
import * as THREE from 'three'

export class EffectManager {
  constructor(scene) {
    this.scene = scene
    this.effects = new Map()
    this.particleSystems = new Map()
  }

  // 创建粒子系统
  createParticleSystem(effectId, options = {}) {
    const {
      count = 100,
      color = 0xffffff,
      size = 0.1,
      position = { x: 0, y: 0, z: 0 },
      velocity = { x: 0, y: 1, z: 0 },
      spread = 1,
      lifetime = 2
    } = options

    // 创建粒子几何体
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const lifetimes = new Float32Array(count)
    const initialLifetimes = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // 初始位置
      positions[i * 3] = position.x + (Math.random() - 0.5) * spread
      positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * spread
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * spread

      // 速度
      velocities[i * 3] = velocity.x + (Math.random() - 0.5) * 0.5
      velocities[i * 3 + 1] = velocity.y + (Math.random() - 0.5) * 0.5
      velocities[i * 3 + 2] = velocity.z + (Math.random() - 0.5) * 0.5

      // 生命周期
      lifetimes[i] = lifetime * Math.random()
      initialLifetimes[i] = lifetimes[i]
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1))
    geometry.setAttribute('initialLifetime', new THREE.BufferAttribute(initialLifetimes, 1))

    // 创建粒子材质
    const material = new THREE.PointsMaterial({
      color: color,
      size: size,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    const particleSystem = new THREE.Points(geometry, material)
    particleSystem.position.set(position.x, position.y, position.z)
    
    this.scene.add(particleSystem)
    
    this.particleSystems.set(effectId, {
      mesh: particleSystem,
      geometry: geometry,
      material: material,
      options: options,
      active: true
    })

    return particleSystem
  }

  // 更新粒子系统
  update(deltaTime) {
    this.particleSystems.forEach((system, effectId) => {
      if (!system.active) return

      const geometry = system.geometry
      const positions = geometry.attributes.position.array
      const velocities = geometry.attributes.velocity.array
      const lifetimes = geometry.attributes.lifetime.array
      const initialLifetimes = geometry.attributes.initialLifetime.array
      const count = lifetimes.length

      let activeParticles = 0

      for (let i = 0; i < count; i++) {
        // 更新生命周期
        lifetimes[i] -= deltaTime

        if (lifetimes[i] > 0) {
          // 更新位置
          positions[i * 3] += velocities[i * 3] * deltaTime
          positions[i * 3 + 1] += velocities[i * 3 + 1] * deltaTime
          positions[i * 3 + 2] += velocities[i * 3 + 2] * deltaTime
          activeParticles++
        } else {
          // 重置粒子
          lifetimes[i] = initialLifetimes[i]
          positions[i * 3] = system.options.position?.x || 0 + (Math.random() - 0.5) * (system.options.spread || 1)
          positions[i * 3 + 1] = system.options.position?.y || 0 + (Math.random() - 0.5) * (system.options.spread || 1)
          positions[i * 3 + 2] = system.options.position?.z || 0 + (Math.random() - 0.5) * (system.options.spread || 1)
        }
      }

      geometry.attributes.position.needsUpdate = true
      geometry.attributes.lifetime.needsUpdate = true

      // 更新透明度
      const opacity = Math.min(1, activeParticles / count)
      system.material.opacity = opacity * 0.8
    })
  }

  // 移除特效
  removeEffect(effectId) {
    const system = this.particleSystems.get(effectId)
    if (system) {
      this.scene.remove(system.mesh)
      system.geometry.dispose()
      system.material.dispose()
      this.particleSystems.delete(effectId)
    }
  }

  // 清除所有特效
  clearAllEffects() {
    this.particleSystems.forEach((system, effectId) => {
      this.removeEffect(effectId)
    })
  }

  // 销毁
  destroy() {
    this.clearAllEffects()
    this.scene = null
  }
}

// 预设特效
export const PRESET_EFFECTS = {
  sparkles: {
    id: 'sparkles',
    name: '闪光',
    description: '闪烁的星光效果',
    options: {
      count: 50,
      color: 0xffff00,
      size: 0.05,
      velocity: { x: 0, y: 0.5, z: 0 },
      spread: 2,
      lifetime: 1.5
    }
  },
  fire: {
    id: 'fire',
    name: '火焰',
    description: '火焰粒子效果',
    options: {
      count: 100,
      color: 0xff4400,
      size: 0.1,
      velocity: { x: 0, y: 2, z: 0 },
      spread: 0.5,
      lifetime: 1
    }
  },
  smoke: {
    id: 'smoke',
    name: '烟雾',
    description: '上升的烟雾',
    options: {
      count: 80,
      color: 0x888888,
      size: 0.15,
      velocity: { x: 0, y: 1, z: 0 },
      spread: 1,
      lifetime: 3
    }
  },
  magic: {
    id: 'magic',
    name: '魔法',
    description: '魔法光点',
    options: {
      count: 60,
      color: 0x00ffff,
      size: 0.08,
      velocity: { x: 0, y: 1, z: 0 },
      spread: 1.5,
      lifetime: 2
    }
  },
  hearts: {
    id: 'hearts',
    name: '爱心',
    description: '飘浮的爱心',
    options: {
      count: 30,
      color: 0xff69b4,
      size: 0.12,
      velocity: { x: 0, y: 0.8, z: 0 },
      spread: 1,
      lifetime: 2.5
    }
  },
  snow: {
    id: 'snow',
    name: '雪花',
    description: '飘落的雪花',
    options: {
      count: 150,
      color: 0xffffff,
      size: 0.06,
      velocity: { x: 0, y: -1, z: 0 },
      spread: 5,
      lifetime: 4
    }
  }
}

// 创建预设特效
export const createPresetEffect = (scene, effectId, options = {}) => {
  const preset = PRESET_EFFECTS[effectId]
  if (!preset) return null

  const mergedOptions = { ...preset.options, ...options }
  
  const effectManager = new EffectManager(scene)
  effectManager.createParticleSystem(effectId, mergedOptions)
  
  return effectManager
}
