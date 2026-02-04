import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'
import { loadVRMAAction, getAllCategories, getAllVRMActions } from '../../data/vrmaActions'
import ARTimeline from './ARTimeline'
import ARProps from './ARProps'
import styles from './ARViewerNew.module.css'

// 内存优化的AR场景管理器类
class ARSceneManager {
  constructor() {
    this.session = null
    this.renderer = null
    this.scene = null
    this.camera = null
    this.referenceSpace = null
    this.hitTestSource = null
    this.planes = new Map()
    this.detectedPlanes = []
    this.currentCharacter = null
    this.isModelLoaded = false
    this.isPlaced = false
    this.optimalPosition = null
    this.optimalScale = 1
    this.isTracking = false
    this.mixer = null
    this.currentAnimation = null
    this.isRendering = false
    this.frameCount = 0
    this.lastFrameTime = 0
    this.targetFPS = 30 // 降低FPS以减少GPU负载
    this.frameInterval = 1000 / this.targetFPS
    this.onPlaneUpdate = null
    this.onModelLoaded = null
    this.onModelPlaced = null
    this.onPositionUpdate = null
    this.placedPlane = null
    this.mediaRecorder = null
    // 缓存几何体和材质以减少内存分配
    this.sharedGeometry = null
    this.sharedMaterial = null
    this.cornerLines = null
  }

  async isSupported() {
    if (!('xr' in navigator)) return false
    try {
      return await navigator.xr.isSessionSupported('immersive-ar')
    } catch {
      return false
    }
  }

  async start(canvas, domOverlayRoot) {
    try {
      const sessionOptions = {
        requiredFeatures: ['hit-test', 'local-floor'],
        optionalFeatures: ['plane-detection']
      }
      
      if (domOverlayRoot) {
        sessionOptions.optionalFeatures.push('dom-overlay')
        sessionOptions.domOverlay = { root: domOverlayRoot }
      }
      
      this.session = await navigator.xr.requestSession('immersive-ar', sessionOptions)

      const gl = canvas.getContext('webgl2', { 
        xrCompatible: true, alpha: true, antialias: false, // 关闭抗锯齿减少GPU负载
        powerPreference: 'low-power' // 优先使用低功耗模式
      }) || canvas.getContext('webgl', { 
        xrCompatible: true, alpha: true, antialias: false,
        powerPreference: 'low-power'
      })

      this.renderer = new THREE.WebGLRenderer({
        canvas, context: gl, alpha: true, antialias: false,
        powerPreference: 'low-power'
      })
      this.renderer.setSize(window.innerWidth, window.innerHeight)
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)) // 限制像素比
      this.renderer.xr.enabled = true
      this.renderer.shadowMap.enabled = false // 关闭阴影减少计算
      this.renderer.outputColorSpace = THREE.SRGBColorSpace

      const baseLayer = new XRWebGLLayer(this.session, gl)
      await this.session.updateRenderState({ 
        baseLayer, depthNear: 0.1, depthFar: 100 
      })

      this.scene = new THREE.Scene()
      this.scene.background = null
      
      this.setupLighting()
      this.createGroundVisualization()
      this.createCornerLines() // 添加墙角线条
      
      this.camera = new THREE.PerspectiveCamera(
        75, window.innerWidth / window.innerHeight, 0.1, 100
      )

      this.referenceSpace = await this.session.requestReferenceSpace('local-floor')
      
      const viewerSpace = await this.session.requestReferenceSpace('viewer')
      this.hitTestSource = await this.session.requestHitTestSource({
        space: viewerSpace
      })

      this.setupPlaneDetection()
      this.startRenderLoop()

      return true
    } catch (error) {
      console.error('启动AR失败:', error)
      throw error
    }
  }

  setupLighting() {
    // 简化光照，只使用环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    this.scene.add(ambientLight)
  }

  createGroundVisualization() {
    this.planeVisualizers = new THREE.Group()
    this.scene.add(this.planeVisualizers)

    // 创建扫描环
    this.sharedGeometry = new THREE.RingGeometry(0.1, 0.15, 16)
    this.sharedMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x4ade80, 
      transparent: true, 
      opacity: 0.8,
      side: THREE.DoubleSide
    })
    
    this.scanRing = new THREE.Mesh(this.sharedGeometry, this.sharedMaterial)
    this.scanRing.rotation.x = -Math.PI / 2
    this.scanRing.visible = false
    this.scene.add(this.scanRing)
    
    // 创建网格纹理用于平面显示
    this.createGridTexture()
  }
  
  // 创建网格纹理
  createGridTexture() {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    
    // 透明背景
    ctx.fillStyle = 'rgba(74, 222, 128, 0.1)'
    ctx.fillRect(0, 0, 256, 256)
    
    // 绘制网格线
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.6)'
    ctx.lineWidth = 3
    
    // 外边框
    ctx.strokeRect(0, 0, 256, 256)
    
    // 内部网格
    ctx.lineWidth = 1
    for (let i = 0; i <= 256; i += 32) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, 256)
      ctx.stroke()
      
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(256, i)
      ctx.stroke()
    }
    
    this.gridTexture = new THREE.CanvasTexture(canvas)
    this.gridTexture.wrapS = THREE.RepeatWrapping
    this.gridTexture.wrapT = THREE.RepeatWrapping
  }

  // 创建墙角线条
  createCornerLines() {
    this.cornerLines = new THREE.Group()
    
    // 创建简单的墙角线条（L形）
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x00ffff, 
      transparent: true, 
      opacity: 0.4,
      linewidth: 1
    })
    
    // 创建几个墙角标记
    for (let i = 0; i < 4; i++) {
      const points = []
      // L形线条
      points.push(new THREE.Vector3(0, 0, 0))
      points.push(new THREE.Vector3(0.3, 0, 0))
      points.push(new THREE.Vector3(0, 0, 0))
      points.push(new THREE.Vector3(0, 0.3, 0))
      points.push(new THREE.Vector3(0, 0, 0))
      points.push(new THREE.Vector3(0, 0, 0.3))
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      const line = new THREE.LineSegments(geometry, lineMaterial)
      line.visible = false
      line.userData = { id: i }
      this.cornerLines.add(line)
    }
    
    this.scene.add(this.cornerLines)
  }

  setupPlaneDetection() {
    try {
      // 检查是否支持原生平面检测
      let supportsPlaneDetection = false
      
      if (this.session.enabledFeatures && typeof this.session.enabledFeatures.has === 'function') {
        supportsPlaneDetection = this.session.enabledFeatures.has('plane-detection')
      }
      
      if (supportsPlaneDetection) {
        console.log('✅ 设备支持原生平面检测')
        this.session.addEventListener('planesdetected', (event) => {
          const planes = event.data
          this.detectedPlanes = Array.from(planes)
          this.updatePlaneVisualization()
          this.updateCornerLines()
          
          if (!this.isPlaced && this.detectedPlanes.length > 0) {
            this.calculateOptimalPlacement()
          }
          
          this.onPlaneUpdate?.(this.detectedPlanes)
        })
      } else {
        console.log('⚠️ 设备不支持原生平面检测，使用智能hit-test平面检测')
        this.useHitTestFallback = true
        // 初始化hit-test平面检测
        this.initHitTestPlaneDetection()
      }
    } catch (error) {
      console.error('平面检测设置失败:', error)
      this.useHitTestFallback = true
      this.initHitTestPlaneDetection()
    }
  }
  
  // 智能hit-test平面检测 - 通过多帧采样检测平面
  initHitTestPlaneDetection() {
    // 存储采样点
    this.hitTestSamples = []
    this.maxSamples = 30 // 最大采样点数
    this.planeDetectionThreshold = 0.1 // 平面检测阈值（米）
  }
  
  // 使用hit-test的备用平面检测
  updateHitTestFallback(frame) {
    if (!this.useHitTestFallback || !frame || this.isPlaced) return
    
    try {
      const hitResults = frame.getHitTestResults(this.hitTestSource)
      if (hitResults.length > 0) {
        const hitPose = hitResults[0].getPose(this.referenceSpace)
        if (hitPose) {
          const position = new THREE.Vector3(
            hitPose.transform.position.x,
            hitPose.transform.position.y,
            hitPose.transform.position.z
          )
          
          // 添加采样点
          this.addHitTestSample(position, hitPose)
          
          // 更新扫描环位置
          this.scanRing.visible = true
          this.scanRing.position.copy(position)
          
          // 检测平面
          this.detectPlanesFromSamples()
        }
      }
    } catch (e) {}
  }
  
  // 添加hit-test采样点
  addHitTestSample(position, pose) {
    // 检查是否与现有点太接近
    const tooClose = this.hitTestSamples.some(sample => 
      sample.position.distanceTo(position) < 0.05
    )
    
    if (!tooClose) {
      this.hitTestSamples.push({
        position: position.clone(),
        pose: pose,
        timestamp: Date.now()
      })
      
      // 限制采样点数量
      if (this.hitTestSamples.length > this.maxSamples) {
        this.hitTestSamples.shift()
      }
    }
  }
  
  // 从采样点检测平面
  detectPlanesFromSamples() {
    if (this.hitTestSamples.length < 10) return // 需要足够采样点
    
    // 使用简单的聚类算法检测平面
    const planes = []
    const used = new Set()
    
    for (let i = 0; i < this.hitTestSamples.length; i++) {
      if (used.has(i)) continue
      
      const sample = this.hitTestSamples[i]
      const cluster = [sample]
      
      // 找到同一平面的点（Y坐标相近）
      for (let j = i + 1; j < this.hitTestSamples.length; j++) {
        if (used.has(j)) continue
        
        const other = this.hitTestSamples[j]
        const yDiff = Math.abs(sample.position.y - other.position.y)
        
        if (yDiff < this.planeDetectionThreshold) {
          cluster.push(other)
          used.add(j)
        }
      }
      
      // 如果聚类有足够点，创建平面
      if (cluster.length >= 5) {
        const center = this.calculateClusterCenter(cluster)
        const extent = this.calculateClusterExtent(cluster)
        
        planes.push({
          planeSpace: cluster[0].pose,
          extent: extent,
          center: center,
          samples: cluster.length
        })
      }
    }
    
    // 更新检测到的平面
    if (planes.length > 0) {
      this.detectedPlanes = planes
      this.updatePlaneVisualization()
      
      if (!this.isPlaced) {
        this.calculateOptimalPlacement()
      }
      
      this.onPlaneUpdate?.(this.detectedPlanes)
    }
  }
  
  // 计算聚类中心
  calculateClusterCenter(cluster) {
    const center = new THREE.Vector3()
    cluster.forEach(sample => center.add(sample.position))
    center.divideScalar(cluster.length)
    return center
  }
  
  // 计算聚类范围
  calculateClusterExtent(cluster) {
    let minX = Infinity, maxX = -Infinity
    let minZ = Infinity, maxZ = -Infinity
    
    cluster.forEach(sample => {
      minX = Math.min(minX, sample.position.x)
      maxX = Math.max(maxX, sample.position.x)
      minZ = Math.min(minZ, sample.position.z)
      maxZ = Math.max(maxZ, sample.position.z)
    })
    
    return {
      width: Math.max(0.5, maxX - minX),
      height: Math.max(0.5, maxZ - minZ)
    }
  }

  updatePlaneVisualization() {
    // 清理旧的视觉化对象
    while(this.planeVisualizers.children.length > 0) {
      const child = this.planeVisualizers.children[0]
      if (child.geometry && child.geometry !== this.sharedGeometry) {
        child.geometry.dispose()
      }
      this.planeVisualizers.remove(child)
    }

    // 显示所有检测到的平面（最多6个）
    this.detectedPlanes.slice(0, 6).forEach((plane, index) => {
      const width = plane.extent?.width || 1
      const height = plane.extent?.height || 1
      
      // 创建平面网格
      const geometry = new THREE.PlaneGeometry(width, height)
      
      // 使用网格纹理
      const material = new THREE.MeshBasicMaterial({
        map: this.gridTexture,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        depthWrite: false
      })
      
      // 调整纹理重复
      if (this.gridTexture) {
        this.gridTexture.repeat.set(width * 2, height * 2)
      }
      
      const mesh = new THREE.Mesh(geometry, material)
      
      // 添加边框
      const edges = new THREE.EdgesGeometry(geometry)
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x4ade80, 
        linewidth: 3,
        transparent: true,
        opacity: 0.9
      })
      const border = new THREE.LineSegments(edges, lineMaterial)
      
      const pose = plane.planeSpace
      if (pose) {
        mesh.position.set(
          pose.transform.position.x,
          pose.transform.position.y,
          pose.transform.position.z
        )
        mesh.quaternion.set(
          pose.transform.orientation.x,
          pose.transform.orientation.y,
          pose.transform.orientation.z,
          pose.transform.orientation.w
        )
        
        border.position.copy(mesh.position)
        border.quaternion.copy(mesh.quaternion)
      }
      
      // 添加平面索引标识
      const isBestPlane = index === 0
      if (isBestPlane) {
        // 最佳平面使用更亮的颜色
        mesh.material.color = new THREE.Color(0x22c55e)
        lineMaterial.color = new THREE.Color(0x22c55e)
      }
      
      this.planeVisualizers.add(mesh)
      this.planeVisualizers.add(border)
    })
  }

  // 更新墙角线条位置
  updateCornerLines() {
    if (!this.detectedPlanes.length) return
    
    // 在检测到的平面边缘显示墙角线条
    this.detectedPlanes.slice(0, 4).forEach((plane, index) => {
      const line = this.cornerLines.children[index]
      if (!line) return
      
      const pose = plane.planeSpace
      if (pose) {
        line.visible = true
        line.position.set(
          pose.transform.position.x,
          pose.transform.position.y,
          pose.transform.position.z
        )
        
        // 根据平面大小调整线条
        const scale = Math.min(
          (plane.extent?.width || 1) * 0.5,
          (plane.extent?.height || 1) * 0.5
        )
        line.scale.setScalar(Math.max(0.5, Math.min(2, scale)))
      }
    })
  }

  calculateOptimalPlacement() {
    if (this.detectedPlanes.length === 0) return

    let bestPlane = this.detectedPlanes[0]
    let maxArea = (bestPlane.extent?.width || 1) * (bestPlane.extent?.height || 1)
    
    this.detectedPlanes.forEach(plane => {
      const area = (plane.extent?.width || 1) * (plane.extent?.height || 1)
      if (area > maxArea) {
        maxArea = area
        bestPlane = plane
      }
    })

    const pose = bestPlane.planeSpace
    if (pose) {
      this.optimalPosition = new THREE.Vector3(
        pose.transform.position.x,
        pose.transform.position.y,
        pose.transform.position.z
      )
      
      const minDimension = Math.min(
        bestPlane.extent?.width || 2, 
        bestPlane.extent?.height || 2
      )
      this.optimalScale = Math.min(1.2, Math.max(0.5, minDimension / 2))
      
      this.placedPlane = bestPlane
      
      this.onPositionUpdate?.({
        position: this.optimalPosition,
        scale: this.optimalScale
      })
    }
  }

  startRenderLoop() {
    if (this.isRendering) return
    this.isRendering = true

    const loop = (time, frame) => {
      if (!this.session) {
        this.isRendering = false
        return
      }

      // FPS限制
      if (time - this.lastFrameTime < this.frameInterval) {
        this.session.requestAnimationFrame(loop)
        return
      }
      this.lastFrameTime = time

      const deltaTime = time - (this.lastTime || time)
      this.lastTime = time
      this.frameCount++

      if (frame) {
        const pose = frame.getViewerPose(this.referenceSpace)
        
        // 使用hit-test备用方案
        if (this.useHitTestFallback && !this.isPlaced) {
          this.updateHitTestFallback(frame)
          this.updatePlaneVisualization()
          this.updateCornerLines()
        }
        
        // 更新扫描环位置（使用平滑插值）
        if (!this.isPlaced && !this.useHitTestFallback) {
          try {
            // 每5帧检测一次hit-test，但每帧都更新位置
            if (this.frameCount % 5 === 0) {
              const hitResults = frame.getHitTestResults(this.hitTestSource)
              if (hitResults.length > 0) {
                const hitPose = hitResults[0].getPose(this.referenceSpace)
                if (hitPose) {
                  // 保存目标位置，使用平滑插值
                  if (!this.scanRingTargetPos) {
                    this.scanRingTargetPos = new THREE.Vector3()
                  }
                  this.scanRingTargetPos.set(
                    hitPose.transform.position.x,
                    hitPose.transform.position.y,
                    hitPose.transform.position.z
                  )
                  this.scanRing.visible = true
                  this.lastHitTestTime = Date.now()
                }
              }
            }
            
            // 扫描环直接设置位置，不使用平滑移动
            if (this.scanRingTargetPos && this.scanRing.visible) {
              this.scanRing.position.copy(this.scanRingTargetPos)
            }
            
            // 如果超过500ms没有hit-test结果，隐藏扫描环
            if (this.lastHitTestTime && Date.now() - this.lastHitTestTime > 500) {
              this.scanRing.visible = false
            }
          } catch (e) {}
        }

        if (pose) {
          const view = pose.views[0]
          this.camera.matrix.fromArray(view.transform.matrix)
          this.camera.matrix.decompose(
            this.camera.position, 
            this.camera.quaternion, 
            this.camera.scale
          )

          this.updateTracking()
          this.updateAnimation(deltaTime)

          const glLayer = this.session.renderState.baseLayer
          const gl = this.renderer.getContext()
          
          // 绑定WebXR framebuffer
          gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer)
          
          const viewport = glLayer.getViewport(view)
          gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height)
          
          // 使用Three.js渲染（会自动处理clear）
          this.renderer.render(this.scene, this.camera)
        }
      }

      this.session.requestAnimationFrame(loop)
    }

    this.session.requestAnimationFrame(loop)
  }

  updateTracking() {
    // 完全禁用所有自动更新，模型放置后完全固定
    // 不更新位置，不更新旋转
    if (!this.isTracking || !this.currentCharacter || !this.camera) return
    
    // 跟踪模式已禁用，不做任何更新
    // 模型位置完全由 placeModel() 设置，之后不再改变
  }

  updateAnimation(deltaTime) {
    // 更新动画混合器
    if (this.mixer) {
      this.mixer.update(deltaTime * 0.001)
    }
  }

  // 截图功能 - 在渲染循环中调用
  captureScreenshot() {
    if (!this.renderer || !this.session) {
      console.warn('无法截图: 渲染器或会话未就绪')
      return null
    }

    try {
      const gl = this.renderer.getContext()
      const baseLayer = this.session.renderState.baseLayer
      
      if (!baseLayer) {
        console.warn('无法截图: 没有baseLayer')
        return null
      }

      const framebuffer = baseLayer.framebuffer
      const width = gl.drawingBufferWidth
      const height = gl.drawingBufferHeight

      // 读取像素数据
      const pixels = new Uint8Array(width * height * 4)
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)

      // 创建canvas并绘制
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      const imageData = ctx.createImageData(width, height)

      // 翻转Y轴（WebGL坐标系与Canvas不同）
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const srcIdx = ((height - 1 - y) * width + x) * 4
          const dstIdx = (y * width + x) * 4
          imageData.data[dstIdx] = pixels[srcIdx]
          imageData.data[dstIdx + 1] = pixels[srcIdx + 1]
          imageData.data[dstIdx + 2] = pixels[srcIdx + 2]
          imageData.data[dstIdx + 3] = pixels[srcIdx + 3]
        }
      }

      ctx.putImageData(imageData, 0, 0)
      
      console.log('✅ 截图捕获成功')
      return canvas.toDataURL('image/png')
    } catch (error) {
      console.error('截图失败:', error)
      return null
    }
  }

  async loadVRMModel(url) {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader()
      loader.register((parser) => new VRMLoaderPlugin(parser))
      
      loader.load(
        url,
        (gltf) => {
          const vrm = gltf.userData.vrm
          this.currentCharacter = vrm
          this.isModelLoaded = true
          
          // 简化材质以减少GPU负担
          vrm.scene.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = false
              child.receiveShadow = false
            }
          })
          
          this.mixer = new THREE.AnimationMixer(vrm.scene)
          
          vrm.scene.visible = false
          vrm.scene.position.set(0, 0, -1.5)
          vrm.scene.scale.setScalar(1.0)
          this.scene.add(vrm.scene)
          
          this.onModelLoaded?.(vrm)
          resolve(vrm)
        },
        undefined,
        (error) => {
          console.error('加载失败:', error)
          reject(error)
        }
      )
    })
  }

  placeModel() {
    if (!this.currentCharacter || !this.optimalPosition) return false
    
    const model = this.currentCharacter.scene
    
    model.position.copy(this.optimalPosition)
    model.position.y += 0.02
    model.scale.setScalar(this.optimalScale)
    
    if (this.camera) {
      const angle = Math.atan2(
        this.camera.position.x - model.position.x,
        this.camera.position.z - model.position.z
      )
      model.rotation.y = angle
    }
    
    model.visible = true
    this.isPlaced = true
    this.scanRing.visible = false
    
    this.playPlacementAnimation()
    
    this.onModelPlaced?.({
      position: model.position,
      scale: this.optimalScale,
      rotation: model.rotation.y
    })
    
    return true
  }

  playPlacementAnimation() {
    // 禁用下落动画，避免与跟随模式冲突
    // 模型直接显示在目标位置
    console.log('✅ 模型已放置')
  }

  toggleTracking() {
    this.isTracking = !this.isTracking
    return this.isTracking
  }

  // 预加载动作缓存
  actionCache = new Map()
  
  // 预加载常用动作
  async preloadActions(actionsList, count = 5) {
    if (!this.currentCharacter) return
    
    const actionsToPreload = actionsList.slice(0, count)
    
    for (const action of actionsToPreload) {
      if (this.actionCache.has(action.id)) continue
      
      try {
        const result = await loadVRMAAction(action.filePath, this.currentCharacter)
        if (result && result.clip) {
          this.actionCache.set(action.id, result.clip)
          console.log('✅ 预加载动作:', action.name)
        }
      } catch (e) {
        console.warn('预加载失败:', action.name)
      }
    }
  }

  async playAction(actionId, actionsList) {
    console.log('🎬 playAction 被调用:', actionId)
    
    if (!this.mixer) {
      console.warn('❌ 无法播放动作: mixer 未初始化')
      return
    }
    if (!this.currentCharacter) {
      console.warn('❌ 无法播放动作: currentCharacter 未初始化')
      return
    }

    try {
      // 停止当前动画
      if (this.currentAnimation) {
        console.log('⏹️ 停止当前动画')
        this.currentAnimation.fadeOut(0.2)
        this.currentAnimation.stop()
      }

      const action = actionsList.find(a => a.id === actionId)
      if (!action) {
        console.warn('❌ 未找到动作:', actionId)
        return
      }
      
      console.log('🎯 找到动作:', action.name, '文件:', action.filePath)

      let clip
      
      // 检查缓存
      if (this.actionCache.has(actionId)) {
        console.log('📦 使用缓存的动作')
        clip = this.actionCache.get(actionId)
      } else {
        // 异步加载
        console.log('📥 加载动作文件:', action.filePath)
        const result = await loadVRMAAction(action.filePath, this.currentCharacter)
        console.log('📥 加载结果:', result)
        if (result && result.clip) {
          clip = result.clip
          this.actionCache.set(actionId, clip)
          console.log('✅ 动作已缓存')
        } else {
          console.warn('❌ 加载动作失败，没有 clip')
        }
      }
      
      if (clip) {
        console.log('▶️ 创建动画 action')
        this.currentAnimation = this.mixer.clipAction(clip)
        this.currentAnimation.reset()
        this.currentAnimation.fadeIn(0.2)
        this.currentAnimation.play()
        console.log('✅ 播放动作成功:', action.name)
      } else {
        console.warn('❌ 没有 clip 可播放')
      }
    } catch (error) {
      console.error('❌ 播放动作失败:', error)
      console.error('错误堆栈:', error.stack)
    }
  }

  async end() {
    // 清理所有资源
    if (this.session) {
      await this.session.end()
      this.session = null
    }
    
    if (this.renderer) {
      this.renderer.dispose()
      this.renderer = null
    }
    
    // 清理几何体和材质
    if (this.sharedGeometry) {
      this.sharedGeometry.dispose()
      this.sharedGeometry = null
    }
    if (this.sharedMaterial) {
      this.sharedMaterial.dispose()
      this.sharedMaterial = null
    }
    
    this.detectedPlanes = []
    this.isPlaced = false
    this.isModelLoaded = false
    this.currentCharacter = null
    this.mixer = null
    this.currentAnimation = null
    this.isRendering = false
    this.placedPlane = null
    this.mediaRecorder = null
  }
}

// AR查看器组件
export const ARViewerNew = ({ 
  vrmUrl,
  onClose,
  onScreenshot,
  onRecord
}) => {
  const canvasRef = useRef(null)
  const domOverlayRef = useRef(null)
  const arManagerRef = useRef(null)
  
  const [isStarting, setIsStarting] = useState(true)
  const [scanProgress, setScanProgress] = useState(0)
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [isPlaced, setIsPlaced] = useState(false)
  const [isScanning, setIsScanning] = useState(true)
  const [detectedPlanes, setDetectedPlanes] = useState([])
  const [showMenu, setShowMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [currentAction, setCurrentAction] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isTracking, setIsTracking] = useState(false)
  const [vrmaActions, setVrmaActions] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [searchQuery, setSearchQuery] = useState('')
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ar-favorites') || '[]')
    } catch {
      return []
    }
  })
  const [recentActions, setRecentActions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ar-recent') || '[]')
    } catch {
      return []
    }
  })
  const [modelScale, setModelScale] = useState(1.0)
  const [showTimeline, setShowTimeline] = useState(false)
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false)
  const [placedProps, setPlacedProps] = useState([])
  const [selectedPropId, setSelectedPropId] = useState(null)
  const [showProps, setShowProps] = useState(false)
  
  // 使用ref来跟踪组件挂载状态，供异步函数使用
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    let isMounted = true
    
    const startAR = async () => {
      if (!isMounted) return
      await initAR()
    }
    
    startAR()
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (arManagerRef.current?.session && !arManagerRef.current.isRendering) {
          arManagerRef.current.startRenderLoop()
        }
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      isMounted = false
      isMountedRef.current = false
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      arManagerRef.current?.end()
    }
  }, [])

  const initAR = async () => {
    if (!canvasRef.current) return
    
    arManagerRef.current = new ARSceneManager()
    
    arManagerRef.current.onPlaneUpdate = (planes) => {
      setDetectedPlanes(planes)
    }
    
    // 扫描进度计时器 - 3秒后自动完成扫描
    let scanStartTime = Date.now()
    const scanTimer = setInterval(() => {
      if (!isMountedRef.current) {
        clearInterval(scanTimer)
        return
      }
      
      const elapsed = Date.now() - scanStartTime
      const timeProgress = Math.min(100, (elapsed / 3000) * 100)
      
      // 取平面检测进度和时间进度的最大值
      const planeProgress = Math.min(100, arManagerRef.current.detectedPlanes?.length * 20 || 0)
      const finalProgress = Math.max(timeProgress, planeProgress)
      setScanProgress(finalProgress)
      
      // 3秒后自动完成扫描
      if (elapsed >= 3000) {
        clearInterval(scanTimer)
        setScanProgress(100)
      }
    }, 100)
    
    arManagerRef.current.onModelLoaded = () => {
      setIsModelLoaded(true)
    }
    
    arManagerRef.current.onModelPlaced = () => {
      setIsPlaced(true)
      setIsStarting(false)
      setIsScanning(false)
    }
    
    arManagerRef.current.onPositionUpdate = (data) => {
      setModelScale(data.scale)
    }
    
    try {
      // 1. 启动AR会话
      await arManagerRef.current.start(canvasRef.current, domOverlayRef.current)
      console.log('✅ AR会话启动成功')
      
      // 2. 加载分类
      try {
        const cats = getAllCategories()
        setCategories(['全部', ...cats])
        console.log('✅ 分类加载成功:', cats.length, '个分类')
      } catch (e) {
        console.error('❌ 分类加载失败:', e)
        setCategories(['全部'])
      }
      
      // 3. 加载动作列表（在模型加载前就开始）
      try {
        console.log('🎬 开始加载动作列表...')
        const actions = await getAllVRMActions()
        console.log('✅ 动作加载成功:', actions.length, '个动作')
        setVrmaActions(actions)
      } catch (e) {
        console.error('❌ 加载动作失败:', e)
        console.error('错误详情:', e.message, e.stack)
        // 使用备用动作列表 - 使用实际存在的文件
        setVrmaActions([
          { id: 'idle', name: '擦汗待机', icon: '🧍', category: '基础', filePath: '/motion/Wiping Sweat Idle.vrma' },
          { id: 'walk', name: '行走', icon: '🚶', category: '基础', filePath: '/motion/Walking From Standing.vrma' },
          { id: 'run', name: '奔跑', icon: '🏃', category: '基础', filePath: '/motion/Zombie Running.vrma' },
          { id: 'wave', name: '挥手', icon: '👋', category: '基础', filePath: '/motion/Waving With Both Hands.vrma' },
          { id: 'dance', name: '街舞', icon: '💃', category: '舞蹈', filePath: '/motion/Waving The Arms Hip Hop Dance.vrma' },
          { id: 'attack', name: '攻击', icon: '⚔️', category: '战斗', filePath: '/motion/Zombie Attack With Right Hand.vrma' },
        ])
      }
      
      // 4. 加载VRM模型
      const url = vrmUrl || `${window.location.origin}/models/Katheryne.vrm`
      console.log('🎭 开始加载模型:', url)
      await arManagerRef.current.loadVRMModel(url)
      console.log('✅ 模型加载成功')
      
      // 5. 模型加载完成后预加载动作
      if (vrmaActions.length > 0 && arManagerRef.current?.currentCharacter) {
        console.log('🔄 开始预加载动作...')
        arManagerRef.current.preloadActions(vrmaActions, 5)
      }
      
      // 6. 放置模型
      setTimeout(() => {
        if (arManagerRef.current.optimalPosition) {
          arManagerRef.current.placeModel()
        } else {
          arManagerRef.current.optimalPosition = new THREE.Vector3(0, 0, -1.5)
          arManagerRef.current.optimalScale = 1.0
          arManagerRef.current.placeModel()
        }
      }, 2000)
      
    } catch (error) {
      console.error('❌ AR初始化失败:', error)
      console.error('错误堆栈:', error.stack)
    }
  }

  const handleAction = async (action) => {
    setCurrentAction(action.id)
    await arManagerRef.current?.playAction(action.id, vrmaActions)
    
    const newRecent = [action, ...recentActions.filter(a => a.id !== action.id)].slice(0, 10)
    setRecentActions(newRecent)
    localStorage.setItem('ar-recent', JSON.stringify(newRecent))
  }

  const toggleFavorite = (action) => {
    const isFav = favorites.includes(action.id)
    const newFavorites = isFav 
      ? favorites.filter(id => id !== action.id)
      : [...favorites, action.id]
    setFavorites(newFavorites)
    localStorage.setItem('ar-favorites', JSON.stringify(newFavorites))
  }

  const handleToggleTracking = () => {
    const newState = arManagerRef.current?.toggleTracking()
    setIsTracking(newState)
  }

  const filteredActions = useMemo(() => {
    let actions = vrmaActions
    
    if (selectedCategory !== '全部') {
      actions = actions.filter(a => a.category === selectedCategory)
    }
    
    if (searchQuery) {
      actions = actions.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    return actions
  }, [vrmaActions, selectedCategory, searchQuery])

  return (
    <div ref={domOverlayRef} className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
      
      {/* 顶部工具栏 */}
      <div className={styles.header}>
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>
        
        <div className={styles.headerActions}>
          <button 
            className={styles.toolButton} 
            onClick={() => {
              // 使用ARManager的截图功能
              const dataUrl = arManagerRef.current?.captureScreenshot()
              if (dataUrl) {
                const link = document.createElement('a')
                link.download = `ar-screenshot-${Date.now()}.png`
                link.href = dataUrl
                link.click()
                console.log('✅ 截图已保存')
              } else {
                console.warn('截图失败，请重试')
                // 备用方案：尝试使用canvas直接截图
                try {
                  const canvas = canvasRef.current
                  if (canvas) {
                    const dataUrl = canvas.toDataURL('image/png')
                    const link = document.createElement('a')
                    link.download = `ar-screenshot-${Date.now()}.png`
                    link.href = dataUrl
                    link.click()
                  }
                } catch (e) {
                  console.error('备用截图也失败:', e)
                }
              }
              onScreenshot?.()
            }}
          >
            📷
          </button>
          <button 
            className={`${styles.toolButton} ${isRecording ? styles.recording : ''}`}
            onClick={() => {
              const newRecordingState = !isRecording
              setIsRecording(newRecordingState)
              
              if (newRecordingState) {
                // 使用屏幕录制API
                try {
                  navigator.mediaDevices.getDisplayMedia({
                    video: { 
                      displaySurface: 'browser',
                      width: { ideal: 1920 },
                      height: { ideal: 1080 }
                    },
                    audio: false
                  }).then(stream => {
                    const mediaRecorder = new MediaRecorder(stream, {
                      mimeType: 'video/webm;codecs=vp9'
                    })
                    const chunks = []
                    
                    mediaRecorder.ondataavailable = (e) => {
                      if (e.data.size > 0) chunks.push(e.data)
                    }
                    
                    mediaRecorder.onstop = () => {
                      const blob = new Blob(chunks, { type: 'video/webm' })
                      const url = URL.createObjectURL(blob)
                      const link = document.createElement('a')
                      link.download = `ar-recording-${Date.now()}.webm`
                      link.href = url
                      link.click()
                      console.log('✅ 录制已保存')
                    }
                    
                    mediaRecorder.start()
                    arManagerRef.current.mediaRecorder = mediaRecorder
                    arManagerRef.current.recordStream = stream
                  }).catch(err => {
                    console.error('获取屏幕流失败:', err)
                  })
                } catch (err) {
                  console.error('录制启动失败:', err)
                }
              } else {
                // 停止录制
                if (arManagerRef.current?.mediaRecorder) {
                  arManagerRef.current.mediaRecorder.stop()
                }
                // 停止屏幕流
                if (arManagerRef.current?.recordStream) {
                  arManagerRef.current.recordStream.getTracks().forEach(track => track.stop())
                }
              }
              
              onRecord?.(newRecordingState)
            }}
          >
            {isRecording ? '⏹️' : '📹'}
          </button>
        </div>
      </div>

      {/* 扫描进度 */}
      {isScanning && !isPlaced && (
        <div className={styles.scanIndicator}>
          <div className={styles.scanAnimation}>
            <div className={styles.scanRing}></div>
            <div className={styles.scanRing}></div>
            <div className={styles.scanRing}></div>
            <div className={styles.scanIcon}>📱</div>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${scanProgress}%` }}
            />
          </div>
          <p className={styles.scanText}>
            {scanProgress > 0 ? `扫描进度 ${Math.round(scanProgress)}%` : '正在扫描地面...'}
          </p>
          <p className={styles.scanHint}>移动设备以扫描地面</p>
        </div>
      )}

      {/* 底部菜单 */}
      <div className={styles.bottomMenu}>
        {showMenu && (
          <div className={styles.actionPanel}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="搜索动作..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  className={styles.clearSearch}
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </button>
              )}
            </div>

            <div className={styles.categoryList}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`${styles.categoryTag} ${selectedCategory === cat ? styles.active : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <div className={styles.actionCarousel}>
              {filteredActions.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.5)', padding: '20px', textAlign: 'center' }}>
                  暂无动作数据 (vrmaActions: {vrmaActions.length})
                </div>
              ) : (
                filteredActions.slice(0, 20).map(action => (
                  <button
                    key={action.id}
                    className={`${styles.actionCard} ${currentAction === action.id ? styles.active : ''}`}
                    onClick={() => handleAction(action)}
                  >
                    <span className={styles.actionIcon}>{action.icon}</span>
                    <span className={styles.actionName}>{action.name}</span>
                    <button 
                      className={`${styles.favoriteBtn} ${favorites.includes(action.id) ? styles.favorited : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(action)
                      }}
                    >
                      {favorites.includes(action.id) ? '★' : '☆'}
                    </button>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        <div className={styles.mainButtons}>
          <button
            className={`${styles.mainButton} ${showMenu ? styles.active : ''}`}
            onClick={() => setShowMenu(!showMenu)}
          >
            <span>🎭</span>
            <span>动作</span>
          </button>

          <button
            className={`${styles.mainButton} ${isTracking ? styles.active : ''}`}
            onClick={handleToggleTracking}
            title="让模型保持在平面上并面向你"
          >
            <span>🎯</span>
            <span>跟随</span>
          </button>

          <button
            className={`${styles.mainButton} ${showSettings ? styles.active : ''}`}
            onClick={() => setShowSettings(!showSettings)}
          >
            <span>⚙️</span>
            <span>设置</span>
          </button>

          <button
            className={`${styles.mainButton} ${isPlaced ? styles.placed : ''}`}
            onClick={() => arManagerRef.current?.placeModel()}
            disabled={isPlaced}
          >
            <span>{isPlaced ? '✓' : '📍'}</span>
            <span>{isPlaced ? '已放置' : '放置'}</span>
          </button>

          <button
            className={`${styles.mainButton} ${showTimeline ? styles.active : ''}`}
            onClick={() => setShowTimeline(!showTimeline)}
          >
            <span>⏱️</span>
            <span>时间轴</span>
          </button>

          <button
            className={`${styles.mainButton} ${showProps ? styles.active : ''}`}
            onClick={() => setShowProps(!showProps)}
          >
            <span>📦</span>
            <span>道具</span>
          </button>
        </div>
      </div>

      {/* 录制指示器 */}
      {isRecording && (
        <div className={styles.recordingIndicator}>
          <div className={styles.recordingDot} />
          <span>录制中</span>
        </div>
      )}

      {/* 设置面板 */}
      {showSettings && (
        <div className={styles.settingsOverlay} onClick={() => setShowSettings(false)}>
          <div className={styles.settingsPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.settingsHeader}>
              <h3 className={styles.settingsTitle}>AR设置</h3>
              <button className={styles.closeSettings} onClick={() => setShowSettings(false)}>
                ✕
              </button>
            </div>
            
            <div className={styles.settingsSection}>
              <h4 className={styles.settingsSectionTitle}>模型</h4>
              <div className={styles.settingItem}>
                <span className={styles.settingLabel}>模型缩放</span>
                <div className={styles.settingControl}>
                  <input
                    type="range"
                    className={styles.slider}
                    min="0.3"
                    max="2"
                    step="0.1"
                    value={modelScale}
                    onChange={(e) => {
                      const scale = parseFloat(e.target.value)
                      setModelScale(scale)
                      if (arManagerRef.current?.currentCharacter) {
                        arManagerRef.current.currentCharacter.scene.scale.setScalar(scale)
                      }
                    }}
                  />
                  <span className={styles.settingValue}>{modelScale.toFixed(1)}x</span>
                </div>
              </div>
            </div>

            <div className={styles.settingsSection}>
              <h4 className={styles.settingsSectionTitle}>跟踪</h4>
              <div className={styles.settingItem}>
                <span className={styles.settingLabel}>自动跟随</span>
                <button
                  className={`${styles.toggle} ${isTracking ? styles.active : ''}`}
                  onClick={handleToggleTracking}
                >
                  <div className={styles.toggleKnob}></div>
                </button>
              </div>
            </div>

            <div className={styles.settingsSection}>
              <h4 className={styles.settingsSectionTitle}>信息</h4>
              <div className={styles.settingItem}>
                <span className={styles.settingLabel}>检测到的平面</span>
                <span className={styles.settingValue}>{detectedPlanes.length}</span>
              </div>
              <div className={styles.settingItem}>
                <span className={styles.settingLabel}>模型已放置</span>
                <span className={styles.settingValue}>{isPlaced ? '是' : '否'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 时间轴 */}
      {showTimeline && (
        <ARTimeline
          actions={vrmaActions}
          onPlayAction={handleAction}
          currentAction={currentAction}
          isPlaying={isTimelinePlaying}
          onPlayStateChange={setIsTimelinePlaying}
        />
      )}

      {/* 道具系统 */}
      {showProps && (
        <ARProps
          placedProps={placedProps}
          selectedPropId={selectedPropId}
          onAddProp={(prop) => {
            // 在模型附近或检测到的平面上放置道具
            let spawnPosition = { x: 0, y: 0, z: 0 }
            
            if (arManagerRef.current?.currentCharacter?.scene) {
              const modelPos = arManagerRef.current.currentCharacter.scene.position
              // 在模型前方随机位置
              spawnPosition = {
                x: modelPos.x + (Math.random() - 0.5) * 1.5,
                y: modelPos.y,
                z: modelPos.z + 0.5 + Math.random() * 0.5
              }
            } else if (arManagerRef.current?.detectedPlanes?.length > 0) {
              // 在第一个检测到的平面上
              const plane = arManagerRef.current.detectedPlanes[0]
              const pose = plane.planeSpace
              if (pose) {
                spawnPosition = {
                  x: pose.transform.position.x + (Math.random() - 0.5) * 0.5,
                  y: pose.transform.position.y + 0.1,
                  z: pose.transform.position.z + (Math.random() - 0.5) * 0.5
                }
              }
            }
            
            const newProp = {
              ...prop,
              position: spawnPosition
            }
            
            setPlacedProps([...placedProps, newProp])
            
            // 在场景中创建道具3D对象
            if (arManagerRef.current?.scene) {
              // 根据道具类型创建不同的几何体
              let geometry
              switch (prop.templateId) {
                case 'chair':
                  geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3)
                  break
                case 'table':
                  geometry = new THREE.BoxGeometry(0.5, 0.4, 0.5)
                  break
                case 'lamp':
                  geometry = new THREE.CylinderGeometry(0.1, 0.15, 0.4, 8)
                  break
                case 'plant':
                  geometry = new THREE.SphereGeometry(0.15, 8, 8)
                  break
                case 'ball':
                  geometry = new THREE.SphereGeometry(0.1, 16, 16)
                  break
                case 'box':
                  geometry = new THREE.BoxGeometry(0.25, 0.25, 0.25)
                  break
                case 'gift':
                  geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2)
                  break
                case 'cushion':
                  geometry = new THREE.CylinderGeometry(0.15, 0.15, 0.08, 16)
                  break
                default:
                  geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2)
              }
              
              // 根据道具类型设置不同颜色和材质
              let color, secondaryColor
              switch (prop.templateId) {
                case 'chair':
                  color = 0x8B4513 // 棕色（木头）
                  secondaryColor = 0xA0522D
                  break
                case 'table':
                  color = 0xDEB887 // 米色（木头）
                  secondaryColor = 0xF5DEB3
                  break
                case 'lamp':
                  color = 0xFFD700 // 金色
                  secondaryColor = 0xFFA500
                  break
                case 'plant':
                  color = 0x228B22 // 绿色
                  secondaryColor = 0x32CD32
                  break
                case 'ball':
                  color = 0xFF6347 // 红色
                  secondaryColor = 0xFF4500
                  break
                case 'box':
                  color = 0x8B7355 // 棕色（纸箱）
                  secondaryColor = 0xA0826D
                  break
                case 'gift':
                  color = 0xFF69B4 // 粉色
                  secondaryColor = 0xFF1493
                  break
                case 'cushion':
                  color = 0x4169E1 // 蓝色
                  secondaryColor = 0x6495ED
                  break
                default:
                  color = 0x808080 // 灰色
                  secondaryColor = 0xA9A9A9
              }
              
              // 使用StandardMaterial代替BasicMaterial，更有质感
              const material = new THREE.MeshStandardMaterial({ 
                color: color,
                roughness: 0.7,
                metalness: 0.1,
                transparent: true,
                opacity: 0.9
              })
              
              const mesh = new THREE.Mesh(geometry, material)
              mesh.position.set(
                spawnPosition.x,
                spawnPosition.y,
                spawnPosition.z
              )
              mesh.scale.setScalar(prop.scale)
              mesh.castShadow = false
              mesh.receiveShadow = false
              mesh.userData = { propId: prop.id, propTemplateId: prop.templateId }
              
              // 添加边框使其更明显
              const edges = new THREE.EdgesGeometry(geometry)
              const lineMaterial = new THREE.LineBasicMaterial({ color: secondaryColor, linewidth: 2 })
              const border = new THREE.LineSegments(edges, lineMaterial)
              mesh.add(border)
              
              // 添加简单的动画效果
              mesh.userData.originalY = spawnPosition.y
              mesh.userData.floatOffset = Math.random() * Math.PI * 2
              
              arManagerRef.current.scene.add(mesh)
              console.log('✅ 道具已创建:', prop.name, '位置:', spawnPosition)
            }
          }}
          onRemoveProp={(propId) => {
            setPlacedProps(placedProps.filter(p => p.id !== propId))
            // 从场景中移除
            if (arManagerRef.current?.scene) {
              const mesh = arManagerRef.current.scene.children.find(
                c => c.userData?.propId === propId
              )
              if (mesh) {
                arManagerRef.current.scene.remove(mesh)
                console.log('🗑️ 道具已移除:', propId)
              }
            }
          }}
          onSelectProp={(prop) => {
            setSelectedPropId(prop.id)
            console.log('📦 选中道具:', prop.name)
          }}
        />
      )}
    </div>
  )
}

export default ARViewerNew
