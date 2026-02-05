import * as THREE from 'three'

/**
 * 简化的AR功能模块
 * 只保留兼容性好的功能：射线检测、空间音频、基础交互
 */
export class ARFeatures {
  constructor(scene, camera) {
    this.scene = scene
    this.camera = camera
    
    // 锚点系统
    this.anchors = new Map()
    
    // 射线检测
    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()
    
    // 空间音频
    this.audioContext = null
    this.audioListener = null
    this.sounds = new Map()
    
    // 多平面检测
    this.planes = new Map()
    this.wallPlanes = []
    this.ceilingPlanes = []
    
    // 回调函数
    this.onGesture = null
    this.onObjectSelected = null
    this.onPlaneDetected = null
  }

  // ========== 初始化 ==========
  async initialize(session, referenceSpace, renderer) {
    this.session = session
    this.referenceSpace = referenceSpace
    this.renderer = renderer
    
    // 初始化空间音频
    this.initSpatialAudio()
    
    // 初始化射线检测
    this.initRaycasting()
    
    console.log('🚀 AR功能模块已初始化')
  }

  // ========== 锚点持久化 ==========
  async createAnchor(position, quaternion) {
    if (!this.session) return null
    
    try {
      const anchor = await this.session.createAnchor(
        new XRRigidTransform(position, quaternion),
        this.referenceSpace
      )
      
      const anchorId = crypto.randomUUID()
      this.anchors.set(anchorId, {
        anchor,
        position: position.clone(),
        quaternion: quaternion.clone(),
        createdAt: Date.now()
      })
      
      console.log(`📍 创建锚点: ${anchorId}`)
      return anchorId
    } catch (error) {
      console.error('创建锚点失败:', error)
      return null
    }
  }

  async deleteAnchor(anchorId) {
    const anchorData = this.anchors.get(anchorId)
    if (anchorData) {
      await anchorData.anchor.delete()
      this.anchors.delete(anchorId)
      console.log(`📍 删除锚点: ${anchorId}`)
    }
  }

  getAnchorPosition(anchorId) {
    const anchorData = this.anchors.get(anchorId)
    if (!anchorData) return null
    
    const pose = this.session.getPose(anchorData.anchor.anchorSpace, this.referenceSpace)
    if (pose) {
      return new THREE.Vector3(
        pose.transform.position.x,
        pose.transform.position.y,
        pose.transform.position.z
      )
    }
    return null
  }

  // ========== 射线检测 ==========
  initRaycasting() {
    // 在AR中通过hit-test进行射线检测
  }

  async raycastFromScreen(x, y) {
    if (!this.session) return null
    
    // 使用WebXR hit-test
    const viewerSpace = await this.session.requestReferenceSpace('viewer')
    const hitTestSource = await this.session.requestHitTestSource({
      space: viewerSpace,
      offsetRay: new XRRay(
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: -1 }
      )
    })
    
    return hitTestSource
  }

  raycastAgainstObjects(normalizedX, normalizedY, objects) {
    this.pointer.x = normalizedX * 2 - 1
    this.pointer.y = -(normalizedY * 2 - 1)
    
    this.raycaster.setFromCamera(this.pointer, this.camera)
    return this.raycaster.intersectObjects(objects, true)
  }

  // ========== 空间音频 ==========
  initSpatialAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.audioListener = new THREE.AudioListener()
      this.camera.add(this.audioListener)
    } catch (error) {
      console.warn('空间音频初始化失败:', error)
    }
  }

  loadSound(name, url) {
    if (!this.audioContext) return
    
    const sound = new THREE.PositionalAudio(this.audioListener)
    
    const loader = new THREE.AudioLoader()
    loader.load(url, (buffer) => {
      sound.setBuffer(buffer)
      sound.setRefDistance(0.5)
      sound.setRolloffFactor(1)
      this.sounds.set(name, sound)
    })
    
    return sound
  }

  playSound(name, position = null) {
    const sound = this.sounds.get(name)
    if (!sound) return
    
    if (position) {
      sound.position.copy(position)
    }
    
    if (sound.isPlaying) {
      sound.stop()
    }
    sound.play()
  }

  attachSoundToObject(name, object) {
    const sound = this.sounds.get(name)
    if (sound && object) {
      object.add(sound)
    }
  }

  // ========== 多平面检测 ==========
  updatePlanes(detectedPlanes) {
    this.wallPlanes = []
    this.ceilingPlanes = []
    
    detectedPlanes.forEach((plane) => {
      const normal = plane.normal || new THREE.Vector3(0, 1, 0)
      
      // 判断平面类型
      if (Math.abs(normal.y) > 0.8) {
        if (normal.y > 0) {
          // 地面
          plane.type = 'floor'
        } else {
          // 天花板
          plane.type = 'ceiling'
          this.ceilingPlanes.push(plane)
        }
      } else {
        // 墙面
        plane.type = 'wall'
        this.wallPlanes.push(plane)
      }
    })
    
    if (this.onPlaneDetected) {
      this.onPlaneDetected({
        walls: this.wallPlanes,
        ceilings: this.ceilingPlanes
      })
    }
  }

  getNearestWall(position) {
    let nearest = null
    let minDistance = Infinity
    
    this.wallPlanes.forEach(plane => {
      const distance = position.distanceTo(plane.position)
      if (distance < minDistance) {
        minDistance = distance
        nearest = plane
      }
    })
    
    return nearest
  }

  // ========== 特效 ==========
  createSparkles(position, count = 10) {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = position.x + (Math.random() - 0.5) * 0.2
      positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * 0.2
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.2
      
      colors[i * 3] = Math.random()
      colors[i * 3 + 1] = Math.random()
      colors[i * 3 + 2] = Math.random()
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    
    const material = new THREE.PointsMaterial({
      size: 0.02,
      vertexColors: true,
      transparent: true,
      opacity: 1
    })
    
    const particles = new THREE.Points(geometry, material)
    this.scene.add(particles)
    
    // 动画
    const animate = () => {
      material.opacity -= 0.02
      particles.rotation.y += 0.1
      
      if (material.opacity <= 0) {
        this.scene.remove(particles)
        geometry.dispose()
        material.dispose()
      } else {
        requestAnimationFrame(animate)
      }
    }
    animate()
  }

  // ========== 更新循环 ==========
  update(frame, deltaTime) {
    // 基础功能不需要每帧更新
  }

  // ========== 清理 ==========
  destroy() {
    // 清理锚点
    this.anchors.forEach(async (data) => {
      await data.anchor.delete()
    })
    this.anchors.clear()
    
    // 清理音频
    if (this.audioContext) {
      this.audioContext.close()
    }
  }
}

export default ARFeatures
