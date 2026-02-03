// AR 粒子特效系统
import * as THREE from 'three'

export class ARParticleSystem {
  constructor(scene) {
    this.scene = scene
    this.particles = []
  }

  // 创建放置特效 - 从地面向上爆发
  createPlacementEffect(position) {
    const particleCount = 30
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const velocities = []
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    
    const color1 = new THREE.Color(0x4ade80) // 绿色
    const color2 = new THREE.Color(0x667eea) // 紫色
    
    for (let i = 0; i < particleCount; i++) {
      // 初始位置（地面）
      positions[i * 3] = position.x + (Math.random() - 0.5) * 0.5
      positions[i * 3 + 1] = position.y
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.5
      
      // 向上爆发的速度
      const angle = Math.random() * Math.PI * 2
      const speed = 0.02 + Math.random() * 0.03
      velocities.push({
        x: Math.cos(angle) * speed * 0.3,
        y: speed,
        z: Math.sin(angle) * speed * 0.3
      })
      
      // 颜色渐变
      const mixedColor = color1.clone().lerp(color2, Math.random())
      colors[i * 3] = mixedColor.r
      colors[i * 3 + 1] = mixedColor.g
      colors[i * 3 + 2] = mixedColor.b
      
      sizes[i] = 0.02 + Math.random() * 0.03
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    
    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending
    })
    
    const particles = new THREE.Points(geometry, material)
    this.scene.add(particles)
    
    this.particles.push({
      mesh: particles,
      velocities,
      life: 1.0,
      type: 'placement'
    })
  }

  // 创建选中光环
  createSelectionRing(position) {
    const group = new THREE.Group()
    group.position.copy(position)
    
    // 外环
    const ringGeo = new THREE.RingGeometry(0.4, 0.45, 32)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.01
    group.add(ring)
    
    // 内环（旋转）
    const innerRingGeo = new THREE.RingGeometry(0.35, 0.38, 32)
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0x667eea,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    })
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat)
    innerRing.rotation.x = -Math.PI / 2
    innerRing.position.y = 0.02
    group.add(innerRing)
    
    // 垂直光环
    const verticalRingGeo = new THREE.RingGeometry(0.5, 0.52, 32)
    const verticalRingMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    })
    const verticalRing = new THREE.Mesh(verticalRingGeo, verticalRingMat)
    verticalRing.position.y = 1
    group.add(verticalRing)
    
    this.scene.add(group)
    
    return {
      mesh: group,
      innerRing,
      verticalRing,
      type: 'selection'
    }
  }

  // 创建跳跃特效 - 落地时的灰尘
  createJumpEffect(position) {
    const particleCount = 20
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const velocities = []
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = position.x
      positions[i * 3 + 1] = position.y
      positions[i * 3 + 2] = position.z
      
      // 向外扩散
      const angle = Math.random() * Math.PI * 2
      const speed = 0.01 + Math.random() * 0.02
      velocities.push({
        x: Math.cos(angle) * speed,
        y: Math.random() * 0.01,
        z: Math.sin(angle) * speed
      })
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    
    const material = new THREE.PointsMaterial({
      color: 0xcccccc,
      size: 0.03,
      transparent: true,
      opacity: 0.6
    })
    
    const particles = new THREE.Points(geometry, material)
    this.scene.add(particles)
    
    this.particles.push({
      mesh: particles,
      velocities,
      life: 0.8,
      type: 'dust'
    })
  }

  // 创建跳舞特效 - 音符
  createDanceEffect(position) {
    const notes = ['♪', '♫', '♬', '♩']
    const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf9ca24, 0xf0932b]
    
    for (let i = 0; i < 3; i++) {
      const noteGeo = new THREE.PlaneGeometry(0.15, 0.15)
      const canvas = document.createElement('canvas')
      canvas.width = 64
      canvas.height = 64
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#' + colors[Math.floor(Math.random() * colors.length)].toString(16).padStart(6, '0')
      ctx.font = '48px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(notes[Math.floor(Math.random() * notes.length)], 32, 32)
      
      const texture = new THREE.CanvasTexture(canvas)
      const noteMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      })
      
      const note = new THREE.Mesh(noteGeo, noteMat)
      note.position.set(
        position.x + (Math.random() - 0.5) * 0.5,
        position.y + 1.5 + Math.random() * 0.5,
        position.z + (Math.random() - 0.5) * 0.5
      )
      note.userData.velocity = {
        y: 0.005 + Math.random() * 0.005,
        x: (Math.random() - 0.5) * 0.002,
        z: (Math.random() - 0.5) * 0.002
      }
      note.userData.rotationSpeed = (Math.random() - 0.5) * 0.1
      
      this.scene.add(note)
      
      this.particles.push({
        mesh: note,
        life: 1.5,
        type: 'note'
      })
    }
  }

  // 创建脚步粒子
  createFootstepEffect(position, isLeft) {
    const geometry = new THREE.PlaneGeometry(0.15, 0.25)
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    
    // 绘制脚印
    ctx.fillStyle = 'rgba(200, 200, 200, 0.5)'
    ctx.beginPath()
    ctx.ellipse(32, 40, 15, 25, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(32, 90, 12, 20, 0, 0, Math.PI * 2)
    ctx.fill()
    
    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    })
    
    const footprint = new THREE.Mesh(geometry, material)
    footprint.position.copy(position)
    footprint.position.y = 0.01
    footprint.rotation.x = -Math.PI / 2
    footprint.rotation.z = isLeft ? -0.2 : 0.2
    
    this.scene.add(footprint)
    
    this.particles.push({
      mesh: footprint,
      life: 2.0,
      type: 'footstep'
    })
  }

  // 更新所有粒子
  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i]
      particle.life -= 0.016 // 约60fps
      
      if (particle.life <= 0) {
        // 移除粒子
        this.scene.remove(particle.mesh)
        if (particle.mesh.geometry) particle.mesh.geometry.dispose()
        if (particle.mesh.material) {
          if (particle.mesh.material.map) particle.mesh.material.map.dispose()
          particle.mesh.material.dispose()
        }
        this.particles.splice(i, 1)
        continue
      }
      
      // 根据类型更新
      switch (particle.type) {
        case 'placement':
        case 'dust':
          // 更新位置
          const positions = particle.mesh.geometry.attributes.position.array
          for (let j = 0; j < particle.velocities.length; j++) {
            positions[j * 3] += particle.velocities[j].x
            positions[j * 3 + 1] += particle.velocities[j].y
            positions[j * 3 + 2] += particle.velocities[j].z
            
            // 重力
            particle.velocities[j].y -= 0.001
          }
          particle.mesh.geometry.attributes.position.needsUpdate = true
          particle.mesh.material.opacity = particle.life
          break
          
        case 'note':
          particle.mesh.position.y += particle.mesh.userData.velocity.y
          particle.mesh.position.x += particle.mesh.userData.velocity.x
          particle.mesh.position.z += particle.mesh.userData.velocity.z
          particle.mesh.rotation.y += particle.mesh.userData.rotationSpeed
          particle.mesh.material.opacity = particle.life / 1.5
          break
          
        case 'footstep':
          particle.mesh.material.opacity = (particle.life / 2.0) * 0.5
          break
      }
    }
  }

  // 更新选中光环
  updateSelectionRing(selectionRing, time) {
    if (!selectionRing) return
    
    // 内环旋转
    selectionRing.innerRing.rotation.z = time * 0.002
    
    // 垂直光环缩放
    const scale = 1 + Math.sin(time * 0.003) * 0.1
    selectionRing.verticalRing.scale.set(scale, scale, scale)
    
    // 整体上下浮动
    selectionRing.mesh.position.y = Math.sin(time * 0.002) * 0.02
  }

  // 清除所有粒子
  clear() {
    this.particles.forEach(particle => {
      this.scene.remove(particle.mesh)
      if (particle.mesh.geometry) particle.mesh.geometry.dispose()
      if (particle.mesh.material) {
        if (particle.mesh.material.map) particle.mesh.material.map.dispose()
        particle.mesh.material.dispose()
      }
    })
    this.particles = []
  }
}

export default ARParticleSystem
