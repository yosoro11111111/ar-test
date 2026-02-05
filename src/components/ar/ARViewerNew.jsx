import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'
import { loadVRMAAction, getAllCategories, getAllVRMActions } from '../../data/vrmaActions'
import ARTimeline from './ARTimeline'
import ARProps from './ARProps'
// 简化版手势识别类
class ARGestureRecognition {
  constructor() {
    this.isInitialized = false
    this.isRunning = false
    this.onGestureDetected = null
  }

  async start() {
    console.log('✋ 简化版手势识别已启动')
    this.isInitialized = true
    this.isRunning = true
    return true
  }

  stop() {
    console.log('✋ 简化版手势识别已停止')
    this.isRunning = false
  }

  destroy() {
    this.stop()
    this.isInitialized = false
  }
}
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
    this.targetFPS = 60 // 匹配设备刷新率（60Hz手机）
    this.frameInterval = 1000 / this.targetFPS
    this.onPlaneUpdate = null
    this.onModelLoaded = null
    this.onModelPlaced = null
    this.onPositionUpdate = null
    this.placedPlane = null
    this.mediaRecorder = null
    this.isFollowing = false // 跟随模式
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
    
    // 创建AR网格地面
    this.createARGrid()
    
    // 创建网格纹理用于平面显示
    this.createGridTexture()
  }
  
  // 创建AR网格地面
  createARGrid() {
    // 创建网格辅助线
    const gridHelper = new THREE.GridHelper(10, 20, 0x00d4ff, 0x00d4ff)
    gridHelper.material.opacity = 0.3
    gridHelper.material.transparent = true
    gridHelper.position.y = 0.01
    gridHelper.visible = false
    this.scene.add(gridHelper)
    this.arGrid = gridHelper
    
    // 创建坐标轴
    const axesHelper = new THREE.AxesHelper(0.5)
    axesHelper.visible = false
    this.scene.add(axesHelper)
    this.arAxes = axesHelper
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
      console.log('🔍 Setting up plane detection...')
      console.log('Session features:', this.session.enabledFeatures)
      console.log('Session planes:', this.session.planes)
      
      // 检查是否支持原生平面检测（Google Chrome/Android）
      let supportsPlaneDetection = false
      
      // 方法1: 检查 enabledFeatures
      if (this.session.enabledFeatures && typeof this.session.enabledFeatures.has === 'function') {
        supportsPlaneDetection = this.session.enabledFeatures.has('plane-detection')
        console.log('Enabled features check:', supportsPlaneDetection)
      }
      
      // 方法2: 检查 featurePolicy (Chrome 90+)
      if (!supportsPlaneDetection && this.session.featurePolicy) {
        supportsPlaneDetection = true // 假设支持，通过事件监听验证
        console.log('Feature policy check: assuming support')
      }
      
      // 方法3: 尝试直接添加事件监听器（Chrome会自动处理）
      if (!supportsPlaneDetection) {
        try {
          this.session.addEventListener('planesdetected', () => {})
          this.session.removeEventListener('planesdetected', () => {})
          supportsPlaneDetection = true
          console.log('Event listener check: supported')
        } catch (e) {
          supportsPlaneDetection = false
          console.log('Event listener check: not supported')
        }
      }
      
      if (supportsPlaneDetection) {
        console.log('✅ Device supports native plane detection')
        
        // 设置平面检测事件监听
        this.session.addEventListener('planesdetected', (event) => {
          try {
            console.log('📦 Planes detected event:', event)
            const planes = event.data
            console.log('Planes count:', planes ? planes.size : 0)
            
            if (planes && planes.size > 0) {
              this.detectedPlanes = Array.from(planes).map(plane => {
                console.log('Plane:', plane)
                // 转换XRPlane为统一格式
                return {
                  planeSpace: plane,
                  extent: plane.extent || { width: 1, height: 1 },
                  center: plane.center || { x: 0, y: 0, z: 0 }
                }
              })
              
              this.updatePlaneVisualization()
              this.updateCornerLines()
              
              if (!this.isPlaced && this.detectedPlanes.length > 0) {
                this.calculateOptimalPlacement()
              }
              
              this.onPlaneUpdate?.(this.detectedPlanes)
            }
          } catch (err) {
            console.warn('Plane detection event error:', err)
          }
        })
        
        // Chrome特定：尝试获取现有平面
        if (this.session.planes) {
          const existingPlanes = Array.from(this.session.planes)
          console.log('Existing planes:', existingPlanes.length)
          if (existingPlanes.length > 0) {
            this.detectedPlanes = existingPlanes.map(plane => ({
              planeSpace: plane,
              extent: plane.extent || { width: 1, height: 1 },
              center: plane.center || { x: 0, y: 0, z: 0 }
            }))
            this.updatePlaneVisualization()
          }
        }
      } else {
        console.log('⚠️ Native plane detection not supported, using hit-test fallback')
        this.useHitTestFallback = true
        this.initHitTestPlaneDetection()
      }
    } catch (error) {
      console.error('Plane detection setup failed:', error)
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
      if (!this.hitTestSource) {
        console.warn('No hitTestSource available')
        return
      }
      
      const hitResults = frame.getHitTestResults(this.hitTestSource)
      console.log('Hit-test results:', hitResults.length)
      
      if (hitResults.length > 0) {
        const hitPose = hitResults[0].getPose(this.referenceSpace)
        if (hitPose) {
          const position = new THREE.Vector3(
            hitPose.transform.position.x,
            hitPose.transform.position.y,
            hitPose.transform.position.z
          )
          
          console.log('Hit position:', position.x.toFixed(2), position.y.toFixed(2), position.z.toFixed(2))
          
          // 添加采样点
          this.addHitTestSample(position, hitPose)
          
          // 更新扫描环位置
          this.scanRing.visible = true
          this.scanRing.position.copy(position)
          
          // 检测平面
          this.detectPlanesFromSamples()
        }
      } else {
        // 没有hit结果，隐藏扫描环
        this.scanRing.visible = false
      }
    } catch (e) {
      console.error('Hit-test fallback error:', e)
    }
  }
  
  // 仅用于扫描环位置的hit-test更新（不用于平面检测）
  updateScanRingFromHitTest(frame) {
    if (!this.hitTestSource) return
    
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
          
          // 更新扫描环位置
          this.scanRing.visible = true
          this.scanRing.position.copy(position)
          
          // 保存位置用于放置
          this.optimalPosition = position.clone()
          this.optimalScale = 1.0
        }
      } else {
        this.scanRing.visible = false
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

    // 显示检测到的平面（最多3个，减少GPU负载）
    this.detectedPlanes.slice(0, 3).forEach((plane, index) => {
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

      // 移除FPS限制，让WebXR自己控制帧率
      // 这可以避免60Hz设备上的闪烁问题
      const deltaTime = time - (this.lastTime || time)
      this.lastTime = time
      this.frameCount++

      if (frame) {
        this.frame = frame // 保存frame引用
        const pose = frame.getViewerPose(this.referenceSpace)
        
        // 扫描环位置更新 - 使用hit-test检测地面（每3帧更新一次，优化性能）
        // 扫描环始终显示（放置后也显示，方便重新放置）
        if (this.frameCount % 3 === 0) {
          try {
            if (this.hitTestSource) {
              const hitResults = frame.getHitTestResults(this.hitTestSource)
              if (hitResults.length > 0) {
                const hitPose = hitResults[0].getPose(this.referenceSpace)
                if (hitPose) {
                  const position = new THREE.Vector3(
                    hitPose.transform.position.x,
                    hitPose.transform.position.y,
                    hitPose.transform.position.z
                  )
                  
                  // 更新扫描环位置
                  this.scanRing.visible = true
                  this.scanRing.position.copy(position)
                  
                  // 更新AR网格位置
                  if (this.arGrid) {
                    this.arGrid.visible = true
                    this.arGrid.position.set(position.x, position.y + 0.01, position.z)
                  }
                  if (this.arAxes) {
                    this.arAxes.visible = true
                    this.arAxes.position.copy(position)
                  }
                  
                  // 保存位置用于放置
                  this.optimalPosition = position.clone()
                  this.optimalScale = 1.0
                }
              } else {
                this.scanRing.visible = false
                if (this.arGrid) this.arGrid.visible = false
                if (this.arAxes) this.arAxes.visible = false
              }
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
          this.updateFollowing() // 更新跟随
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
    // 恢复跟踪功能：模型会跟随相机移动，但使用性能优化
    if (!this.isTracking || !this.currentCharacter || !this.camera) return
    
    const model = this.currentCharacter.scene
    const camera = this.camera
    
    // 初始化跟踪状态
    if (!this.targetPosition) {
      this.targetPosition = model.position.clone()
      this.lastCameraPosition = camera.position.clone()
      this.isMoving = false
    }
    
    // 检测相机是否显著移动（超过0.5米）
    const cameraMoved = this.lastCameraPosition.distanceTo(camera.position) > 0.5
    
    if (!cameraMoved) {
      return // 相机移动不大，不更新
    }
    
    // 更新相机位置记录
    this.lastCameraPosition.copy(camera.position)
    
    // 计算新的目标位置（相机前方2米）
    const cameraForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
    const targetPos = camera.position.clone().add(cameraForward.multiplyScalar(2.0))
    targetPos.y = model.position.y // 保持Y轴不变
    
    // 只有当目标位置显著变化时才更新
    const targetChanged = this.targetPosition.distanceTo(targetPos) > 0.3
    
    if (targetChanged) {
      this.targetPosition.copy(targetPos)
      this.isMoving = true
    }
    
    // 平滑移动到目标位置
    if (this.isMoving) {
      const distanceToTarget = model.position.distanceTo(this.targetPosition)
      
      if (distanceToTarget > 0.05) {
        // 使用lerp平滑移动
        const lerpFactor = 0.05 // 较慢的移动速度，更平滑
        model.position.lerp(this.targetPosition, lerpFactor)
      } else {
        // 到达目标，停止移动
        this.isMoving = false
      }
    }
    
    // 更新旋转（人物面向相机）
    const dx = camera.position.x - model.position.x
    const dz = camera.position.z - model.position.z
    const targetRotation = Math.atan2(dx, dz)
    
    let rotDiff = targetRotation - model.rotation.y
    while (rotDiff > Math.PI) rotDiff -= Math.PI * 2
    while (rotDiff < -Math.PI) rotDiff += Math.PI * 2
    
    // 平滑旋转
    if (Math.abs(rotDiff) > 0.05) {
      model.rotation.y += rotDiff * 0.05
    }
  }

  updateAnimation(deltaTime) {
    // 更新动画混合器
    if (this.mixer) {
      // 使用固定时间步长，确保动画流畅
      const fixedDelta = 16.666 * 0.001 // 60fps
      this.mixer.update(fixedDelta)
      console.log('🎬 动画更新:', fixedDelta)
    }
  }

  // 跟随模式 - 模型随摄像头移动（优化版）
  updateFollowing() {
    if (!this.isFollowing || !this.isPlaced || !this.currentCharacter || !this.camera) return
    
    // 每2帧更新一次，减少性能消耗
    if (this.frameCount % 2 !== 0) return
    
    try {
      const hitResults = this.frame?.getHitTestResults(this.hitTestSource)
      if (hitResults && hitResults.length > 0) {
        const hitPose = hitResults[0].getPose(this.referenceSpace)
        if (hitPose) {
          const targetPosition = new THREE.Vector3(
            hitPose.transform.position.x,
            hitPose.transform.position.y + 0.02, // 保持地面高度
            hitPose.transform.position.z
          )
          
          const model = this.currentCharacter.scene
          
          // 计算距离
          const distance = model.position.distanceTo(targetPosition)
          
          // 阈值控制：只有移动超过0.1米才更新
          if (distance > 0.1) {
            // 使用lerp平滑插值，0.08的系数保证平滑但响应及时
            model.position.lerp(targetPosition, 0.08)
            
            // 限制最大跟随距离（3米），超过则瞬移
            if (distance > 3) {
              model.position.copy(targetPosition)
            }
          }
          
          // 平滑旋转：让模型面向摄像头
          const cameraPos = this.camera.position
          const dx = cameraPos.x - model.position.x
          const dz = cameraPos.z - model.position.z
          const targetRotation = Math.atan2(dx, dz)
          
          // 计算最短旋转角度
          let rotDiff = targetRotation - model.rotation.y
          while (rotDiff > Math.PI) rotDiff -= Math.PI * 2
          while (rotDiff < -Math.PI) rotDiff += Math.PI * 2
          
          // 平滑旋转，0.05的系数保证自然
          if (Math.abs(rotDiff) > 0.1) {
            model.rotation.y += rotDiff * 0.05
          }
        }
      }
    } catch (e) {}
  }

  // 截图功能 - 优化版
  takeScreenshot() {
    try {
      if (!this.renderer || !this.renderer.domElement) {
        console.warn('无法截图: 渲染器未就绪')
        return null
      }
      
      const canvas = this.renderer.domElement
      console.log('📷 截图尺寸:', canvas.width, 'x', canvas.height)
      
      // 直接从canvas获取数据URL
      const dataURL = canvas.toDataURL('image/png')
      console.log('📷 截图数据大小:', Math.round(dataURL.length * 3 / 4 / 1024), 'KB')
      
      // 创建下载链接
      const link = document.createElement('a')
      link.download = `AR截图_${new Date().getTime()}.png`
      link.href = dataURL
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log('✅ 截图已保存')
      return dataURL
    } catch (error) {
      console.error('截图失败:', error)
      return null
    }
  }

  // 录制功能 - 优化版
  startRecording() {
    try {
      if (!this.renderer || !this.renderer.domElement) {
        console.warn('无法录制: 渲染器未就绪')
        return false
      }
      
      const canvas = this.renderer.domElement
      console.log('🎥 开始录制，尺寸:', canvas.width, 'x', canvas.height)
      
      const stream = canvas.captureStream(30) // 30fps
      
      // 使用更兼容的MIME类型
      const mimeType = this.getSupportedMimeType()
      console.log('🎥 使用MIME类型:', mimeType)
      
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
      })
      
      this.recordedChunks = []
      this.recordingStartTime = Date.now()
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data)
          console.log('🎥 收到数据块:', event.data.size, 'bytes')
        }
      }
      
      this.mediaRecorder.onstop = () => {
        const duration = Date.now() - this.recordingStartTime
        console.log('🎥 录制结束，时长:', duration, 'ms')
        console.log('🎥 数据块数量:', this.recordedChunks.length)
        
        if (this.recordedChunks.length === 0) {
          console.error('❌ 录制失败: 没有数据')
          return
        }
        
        try {
          const blob = new Blob(this.recordedChunks, { type: mimeType })
          console.log('🎥 生成Blob大小:', Math.round(blob.size / 1024), 'KB')
          
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.download = `AR录制_${new Date().getTime()}.webm`
          link.href = url
          link.style.display = 'none'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          // 释放URL
          setTimeout(() => URL.revokeObjectURL(url), 1000)
          
          console.log('✅ 录制已保存')
        } catch (error) {
          console.error('❌ 录制保存失败:', error)
        }
      }
      
      this.mediaRecorder.onerror = (error) => {
        console.error('❌ 录制器错误:', error)
      }
      
      this.mediaRecorder.start()
      console.log('✅ 开始录制')
      return true
    } catch (error) {
      console.error('录制失败:', error)
      return false
    }
  }
  
  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      console.log('⏹️ 停止录制')
      this.mediaRecorder.stop()
    }
  }
  
  // 获取支持的MIME类型
  getSupportedMimeType() {
    const options = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ]
    
    for (const option of options) {
      if (MediaRecorder.isTypeSupported(option)) {
        return option
      }
    }
    
    return 'video/webm'
  }
  
  // 重置视角
  resetCamera() {
    if (this.session && this.camera) {
      // 重置相机位置到初始状态
      this.camera.position.set(0, 0, 0)
      this.camera.rotation.set(0, 0, 0)
      console.log('🔄 视角已重置')
    }
  }

  // 截图功能 - 使用Three.js渲染器直接截图
  captureScreenshot() {
    if (!this.renderer || !this.scene || !this.camera) {
      console.warn('无法截图: 渲染器、场景或相机未就绪')
      return null
    }

    try {
      // 方法1: 使用Three.js渲染器直接截图（最可靠）
      const originalRenderTarget = this.renderer.getRenderTarget()
      
      // 创建一个新的渲染目标
      const renderTarget = new THREE.WebGLRenderTarget(
        this.renderer.domElement.width,
        this.renderer.domElement.height,
        { preserveDrawingBuffer: true }
      )
      
      // 渲染到目标
      this.renderer.setRenderTarget(renderTarget)
      this.renderer.render(this.scene, this.camera)
      
      // 读取像素
      const buffer = new Uint8Array(
        this.renderer.domElement.width * this.renderer.domElement.height * 4
      )
      this.renderer.readRenderTargetPixels(
        renderTarget,
        0,
        0,
        this.renderer.domElement.width,
        this.renderer.domElement.height,
        buffer
      )
      
      // 创建canvas
      const canvas = document.createElement('canvas')
      canvas.width = this.renderer.domElement.width
      canvas.height = this.renderer.domElement.height
      const ctx = canvas.getContext('2d')
      const imageData = ctx.createImageData(canvas.width, canvas.height)
      
      // 复制像素数据（需要翻转Y轴）
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const srcIdx = ((canvas.height - 1 - y) * canvas.width + x) * 4
          const dstIdx = (y * canvas.width + x) * 4
          imageData.data[dstIdx] = buffer[srcIdx]
          imageData.data[dstIdx + 1] = buffer[srcIdx + 1]
          imageData.data[dstIdx + 2] = buffer[srcIdx + 2]
          imageData.data[dstIdx + 3] = buffer[srcIdx + 3]
        }
      }
      
      ctx.putImageData(imageData, 0, 0)
      
      // 恢复原始渲染目标
      this.renderer.setRenderTarget(originalRenderTarget)
      
      console.log('✅ 截图捕获成功:', canvas.width, 'x', canvas.height)
      return canvas.toDataURL('image/png')
    } catch (error) {
      console.error('截图失败:', error)
      return null
    }
  }

  async loadVRMModel(url, onProgress) {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader()
      loader.register((parser) => new VRMLoaderPlugin(parser))
      
      loader.load(
        url,
        (gltf) => {
          const vrm = gltf.userData.vrm
          this.currentCharacter = vrm
          this.isModelLoaded = true
          
          console.log('VRM loaded:', vrm)
          console.log('VRM humanoid:', vrm.humanoid)
          console.log('VRM scene:', vrm.scene)
          
          // 禁用VRM的lookAt功能，防止自动更新导致抖动
          if (vrm.lookAt) {
            vrm.lookAt.enabled = false
          }
          
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
        (progress) => {
          // 进度回调
          if (progress.lengthComputable) {
            const percent = (progress.loaded / progress.total) * 100
            onProgress?.(percent)
          }
        },
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
      // 计算模型到相机的角度，让模型正面对着相机
      const dx = this.camera.position.x - model.position.x
      const dz = this.camera.position.z - model.position.z
      const angle = Math.atan2(dx, dz)
      // 添加Math.PI让模型转身面对相机（而不是背对）
      model.rotation.y = angle + Math.PI
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
    
    // 初始化跟踪状态
    if (this.isTracking && this.currentCharacter) {
      this.targetPosition = this.currentCharacter.scene.position.clone()
      this.lastCameraPosition = this.camera.position.clone()
      this.isMoving = false
      console.log('✅ 跟踪已开启')
    } else {
      console.log('⏹️ 跟踪已关闭')
    }
    
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
    console.log('🎬 playAction called:', actionId)
    
    if (!this.mixer) {
      console.error('❌ Mixer not initialized')
      return
    }
    if (!this.currentCharacter) {
      console.error('❌ Character not loaded')
      return
    }

    try {
      // 停止当前动画
      if (this.currentAnimation) {
        console.log('⏹️ Stopping current animation')
        this.currentAnimation.fadeOut(0.2)
        this.currentAnimation.stop()
      }

      const action = actionsList.find(a => a.id === actionId)
      if (!action) {
        console.error('❌ Action not found:', actionId)
        return
      }
      console.log('🎯 Found action:', action.name, 'path:', action.filePath)

      let clip
      
      // 检查缓存
      if (this.actionCache.has(actionId)) {
        console.log('📦 Using cached clip')
        clip = this.actionCache.get(actionId)
      } else {
        // 异步加载
        console.log('📥 Loading action from:', action.filePath)
        const result = await loadVRMAAction(action.filePath, this.currentCharacter)
        console.log('📥 Load result:', result)
        if (result && result.clip) {
          clip = result.clip
          this.actionCache.set(actionId, clip)
          console.log('✅ Clip cached')
        } else {
          console.error('❌ No clip in load result')
        }
      }
      
      if (clip) {
        console.log('▶️ Creating clip action, duration:', clip.duration)
        
        // 停止之前的动画
        if (this.currentAnimation) {
          this.currentAnimation.fadeOut(0.2)
          this.currentAnimation.stop()
        }
        
        // 查找模型内部的G1节点（动画骨骼根节点）
        let animationRoot = this.currentCharacter.scene
        this.currentCharacter.scene.traverse((child) => {
          if (child.name === 'G1' || child.name === 'Root' || child.name === 'root') {
            animationRoot = child
            console.log('🦴 找到动画根节点:', child.name)
          }
        })
        
        // 使用找到的动画根节点创建动画
        this.currentAnimation = this.mixer.clipAction(clip, animationRoot)
        
        // 重置动画
        this.currentAnimation.reset()
        
        // 确保动画循环播放
        this.currentAnimation.setLoop(THREE.LoopRepeat, Infinity)
        
        // 直接播放（不使用fadeIn，减少延迟）
        this.currentAnimation.play()
        
        console.log('✅ Playing action:', action.name)
        console.log('Animation root:', animationRoot.name)
        console.log('Mixer:', this.mixer)
      } else {
        console.error('❌ No clip to play')
      }
    } catch (error) {
      console.error('❌ playAction failed:', error)
      console.error('Stack:', error.stack)
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
  const [guideText, setGuideText] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [currentAction, setCurrentAction] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isTracking, setIsTracking] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [isGestureEnabled, setIsGestureEnabled] = useState(false)
  const [lastGesture, setLastGesture] = useState(null)
  const [modelLoadingProgress, setModelLoadingProgress] = useState(0)
  const [isModelLoading, setIsModelLoading] = useState(false)
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
      
      // 6. 不再自动放置，等待用户手动放置
      // 使用React状态显示提示
      console.log('👆 请对准地面，点击放置按钮放置模型')
      setGuideText('👆 请对准地面，点击放置按钮')
      setTimeout(() => setGuideText(''), 3000)
      
    } catch (error) {
      console.error('❌ AR初始化失败:', error)
      console.error('错误堆栈:', error.stack)
    }
  }

  const handleAction = async (action) => {
    setCurrentAction(action.id)
    
    // 显示动作播放提示
    const toast = document.createElement('div')
    toast.style.cssText = `
      position: fixed;
      bottom: 120px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 212, 255, 0.9);
      color: #000;
      padding: 12px 24px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      z-index: 10000;
      animation: fadeInOut 2s ease;
    `
    toast.textContent = `正在播放: ${action.name}`
    document.body.appendChild(toast)
    
    setTimeout(() => toast.remove(), 2000)
    
    await arManagerRef.current?.playAction(action.id, vrmaActions)
    
    const newRecent = [action, ...recentActions.filter(a => a.id !== action.id)].slice(0, 10)
    setRecentActions(newRecent)
    localStorage.setItem('ar-recent', JSON.stringify(newRecent))
  }

  // 处理手势动作
  const handleGestureAction = async (gesture) => {
    console.log('👋 手势触发动作:', gesture)
    
    // 手势映射到动作
    const gestureActionMap = {
      'thumbs_up': 'vrma_Stand Cheer (1)',
      'thumbs_down': 'vrma_Stand Disappointed (1)',
      'open_palm': 'vrma_Stand Greeting (1)',
      'fist': 'vrma_Stand Fight Ready (1)',
      'peace': 'vrma_Stand Victory (1)',
      'pointing': 'vrma_Stand Pointing (1)',
      'ok': 'vrma_Stand Agree (1)'
    }
    
    const actionId = gestureActionMap[gesture]
    if (actionId && vrmaActions.length > 0) {
      const action = vrmaActions.find(a => a.id === actionId)
      if (action) {
        setGuideText(`👋 手势: ${gesture} -> ${action.name}`)
        setTimeout(() => setGuideText(''), 2000)
        await handleAction(action)
      }
    }
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
      
      {/* 引导提示 */}
      {guideText && (
        <div style={{
          position: 'fixed',
          top: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 212, 255, 0.95)',
          color: '#000',
          padding: '16px 32px',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: 600,
          zIndex: 999999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          pointerEvents: 'none'
        }}>
          {guideText}
        </div>
      )}
      
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
                
                // 显示截图成功提示
                const toast = document.createElement('div')
                toast.style.cssText = `
                  position: fixed;
                  top: 80px;
                  left: 50%;
                  transform: translateX(-50%);
                  background: rgba(74, 222, 128, 0.9);
                  color: #000;
                  padding: 12px 24px;
                  border-radius: 20px;
                  font-size: 14px;
                  font-weight: 600;
                  z-index: 10000;
                `
                toast.textContent = '✅ 截图已保存'
                document.body.appendChild(toast)
                setTimeout(() => toast.remove(), 2000)
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
                    
                    // 显示截图成功提示
                    const toast = document.createElement('div')
                    toast.style.cssText = `
                      position: fixed;
                      top: 80px;
                      left: 50%;
                      transform: translateX(-50%);
                      background: rgba(74, 222, 128, 0.9);
                      color: #000;
                      padding: 12px 24px;
                      border-radius: 20px;
                      font-size: 14px;
                      font-weight: 600;
                      z-index: 10000;
                    `
                    toast.textContent = '✅ 截图已保存'
                    document.body.appendChild(toast)
                    setTimeout(() => toast.remove(), 2000)
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
                // 方法1: 尝试使用Canvas录制（适用于AR场景）
                try {
                  const canvas = canvasRef.current
                  if (!canvas) {
                    throw new Error('Canvas not found')
                  }
                  
                  // 检查浏览器是否支持Canvas录制
                  let mimeType = 'video/webm;codecs=vp9'
                  if (!MediaRecorder.isTypeSupported(mimeType)) {
                    console.warn('VP9 not supported, trying VP8')
                    mimeType = 'video/webm;codecs=vp8'
                  }
                  
                  // 获取Canvas的MediaStream
                  const stream = canvas.captureStream(30) // 30fps
                  
                  const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: mimeType,
                    videoBitsPerSecond: 5000000 // 5Mbps
                  })
                  
                  const chunks = []
                  
                  mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                      chunks.push(e.data)
                      console.log('📹 Recording chunk:', e.data.size, 'bytes')
                    }
                  }
                  
                  mediaRecorder.onstop = () => {
                    console.log('📹 Recording stopped, chunks:', chunks.length)
                    if (chunks.length === 0) {
                      console.error('No recording data')
                      return
                    }
                    
                    const blob = new Blob(chunks, { type: 'video/webm' })
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.download = `ar-recording-${Date.now()}.webm`
                    link.href = url
                    link.click()
                    
                    // 显示保存成功提示
                    const toast = document.createElement('div')
                    toast.style.cssText = `
                      position: fixed;
                      top: 80px;
                      left: 50%;
                      transform: translateX(-50%);
                      background: rgba(74, 222, 128, 0.9);
                      color: #000;
                      padding: 12px 24px;
                      border-radius: 20px;
                      font-size: 14px;
                      font-weight: 600;
                      z-index: 10000;
                    `
                    toast.textContent = `✅ 录制已保存 (${(blob.size / 1024 / 1024).toFixed(1)}MB)`
                    document.body.appendChild(toast)
                    setTimeout(() => toast.remove(), 3000)
                    
                    console.log('✅ Recording saved:', (blob.size / 1024 / 1024).toFixed(2), 'MB')
                  }
                  
                  mediaRecorder.onerror = (e) => {
                    console.error('MediaRecorder error:', e)
                    setIsRecording(false)
                  }
                  
                  // 开始录制，每100ms收集一次数据
                  mediaRecorder.start(100)
                  arManagerRef.current.mediaRecorder = mediaRecorder
                  
                  // 显示录制中提示
                  const toast = document.createElement('div')
                  toast.style.cssText = `
                    position: fixed;
                    top: 80px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(239, 68, 68, 0.9);
                    color: #fff;
                    padding: 12px 24px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 600;
                    z-index: 10000;
                  `
                  toast.textContent = '🔴 录制中... 再次点击停止'
                  toast.id = 'recording-toast'
                  document.body.appendChild(toast)
                  
                  console.log('📹 Canvas recording started')
                } catch (err) {
                  console.error('Canvas recording failed:', err)
                  
                  // 方法2: 回退到屏幕录制
                  tryScreenRecording()
                }
              } else {
                // 停止录制
                if (arManagerRef.current?.mediaRecorder) {
                  arManagerRef.current.mediaRecorder.stop()
                }
                
                // 移除录制中提示
                const toast = document.getElementById('recording-toast')
                if (toast) toast.remove()
              }
              
              onRecord?.(newRecordingState)
              
              // 屏幕录制备用方案
              function tryScreenRecording() {
                console.log('Trying screen recording fallback...')
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
                    console.log('✅ Screen recording saved')
                  }
                  
                  mediaRecorder.start()
                  arManagerRef.current.mediaRecorder = mediaRecorder
                  arManagerRef.current.recordStream = stream
                }).catch(err => {
                  console.error('Screen recording failed:', err)
                  const toast = document.createElement('div')
                  toast.style.cssText = `
                    position: fixed;
                    top: 80px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(239, 68, 68, 0.9);
                    color: #fff;
                    padding: 12px 24px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 600;
                    z-index: 10000;
                  `
                  toast.textContent = '❌ 录制功能不可用'
                  document.body.appendChild(toast)
                  setTimeout(() => toast.remove(), 3000)
                  setIsRecording(false)
                })
              }
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

          <button
            className={`${styles.mainButton} ${isPlaced ? styles.placed : ''}`}
            onClick={() => {
              if (arManagerRef.current) {
                if (arManagerRef.current.optimalPosition) {
                  setIsPlaced(false)
                  arManagerRef.current.isPlaced = false
                  setTimeout(() => {
                    arManagerRef.current.placeModel()
                    setIsPlaced(true)
                  }, 100)
                } else {
                  setGuideText('⚠️ 请对准地面移动手机')
                  setTimeout(() => setGuideText(''), 2000)
                }
              }
            }}
          >
            <span>📍</span>
            <span>{isPlaced ? '重新放置' : '放置'}</span>
          </button>

          <button
            className={`${styles.mainButton} ${showSettings ? styles.active : ''}`}
            onClick={() => setShowSettings(!showSettings)}
          >
            <span>⚙️</span>
            <span>设置</span>
          </button>
        </div>
      </div>

      {/* 右侧可折叠工具栏 */}
      <div className={styles.rightToolbar}>
        <button
          className={styles.toolButton}
          onClick={() => {
            console.log('📷 截图按钮点击')
            console.log('  arManagerRef.current:', arManagerRef.current)
            console.log('  renderer:', arManagerRef.current?.renderer)
            console.log('  domElement:', arManagerRef.current?.renderer?.domElement)
            
            if (!arManagerRef.current) {
              console.error('❌ arManagerRef.current 为 null')
              setGuideText('❌ AR管理器未初始化')
              setTimeout(() => setGuideText(''), 2000)
              return
            }
            
            if (!arManagerRef.current.renderer) {
              console.error('❌ renderer 为 null')
              setGuideText('❌ 渲染器未就绪')
              setTimeout(() => setGuideText(''), 2000)
              return
            }
            
            if (typeof arManagerRef.current.takeScreenshot !== 'function') {
              console.error('❌ takeScreenshot 方法不存在')
              console.log('  可用方法:', Object.keys(arManagerRef.current).filter(k => typeof arManagerRef.current[k] === 'function'))
              setGuideText('❌ 截图方法未找到')
              setTimeout(() => setGuideText(''), 2000)
              return
            }
            
            try {
              arManagerRef.current.takeScreenshot()
              setGuideText('✅ 截图成功')
            } catch (error) {
              console.error('❌ 截图失败:', error)
              setGuideText('❌ 截图失败: ' + error.message)
            }
            setTimeout(() => setGuideText(''), 2000)
          }}
          title="截图"
        >
          📷
        </button>
        <button
          className={`${styles.toolButton} ${isRecording ? styles.recording : ''}`}
          onClick={() => {
            console.log('📹 录制按钮点击')
            console.log('  arManagerRef.current:', arManagerRef.current)
            console.log('  isRecording:', isRecording)
            
            if (!arManagerRef.current) {
              console.error('❌ arManagerRef.current 为 null')
              setGuideText('❌ AR管理器未初始化')
              setTimeout(() => setGuideText(''), 2000)
              return
            }
            
            const newRecording = !isRecording
            setIsRecording(newRecording)
            
            try {
              if (newRecording) {
                console.log('▶️ 开始录制')
                if (typeof arManagerRef.current.startRecording !== 'function') {
                  console.error('❌ startRecording 方法不存在')
                  setGuideText('❌ 录制方法未找到')
                  setIsRecording(false)
                  setTimeout(() => setGuideText(''), 2000)
                  return
                }
                arManagerRef.current.startRecording()
                setGuideText('🔴 录制中...')
              } else {
                console.log('⏹️ 停止录制')
                if (typeof arManagerRef.current.stopRecording === 'function') {
                  arManagerRef.current.stopRecording()
                }
                setGuideText('✅ 录制已保存')
              }
            } catch (error) {
              console.error('❌ 录制失败:', error)
              setGuideText('❌ 录制失败: ' + error.message)
              setIsRecording(false)
            }
            setTimeout(() => setGuideText(''), 2000)
          }}
          title={isRecording ? '停止录制' : '开始录制'}
        >
          {isRecording ? '⏹️' : '📹'}
        </button>
        <button
          className={styles.toolButton}
          onClick={() => {
            if (arManagerRef.current?.session) {
              // 切换手电筒
              const session = arManagerRef.current.session
              if (session.requestLightProbe) {
                setGuideText('🔦 手电筒功能开发中')
                setTimeout(() => setGuideText(''), 1500)
              }
            }
          }}
          title="手电筒"
        >
          🔦
        </button>
        <button
          className={styles.toolButton}
          onClick={() => {
            if (arManagerRef.current) {
              arManagerRef.current.resetCamera()
              setGuideText('🔄 视角已重置')
              setTimeout(() => setGuideText(''), 1500)
            }
          }}
          title="重置视角"
        >
          🔄
        </button>
        <button
          className={styles.toolButton}
          onClick={() => {
            setShowHelp(!showHelp)
          }}
          title="帮助"
        >
          ❓
        </button>
        <button
          className={`${styles.toolButton} ${isGestureEnabled ? styles.active : ''}`}
          onClick={async () => {
            console.log('✋ 手势识别按钮点击')
            console.log('  arManagerRef.current:', arManagerRef.current)
            console.log('  isGestureEnabled:', isGestureEnabled)
            console.log('  ARGestureRecognition:', ARGestureRecognition)
            
            if (!arManagerRef.current) {
              console.error('❌ arManagerRef.current 为 null')
              setGuideText('❌ AR管理器未初始化')
              setTimeout(() => setGuideText(''), 2000)
              return
            }
            
            const newState = !isGestureEnabled
            setIsGestureEnabled(newState)

            try {
              if (newState) {
                console.log('▶️ 启用手势识别')
                
                if (!arManagerRef.current.gestureRecognition) {
                  console.log('🆕 创建手势识别实例')
                  if (!ARGestureRecognition) {
                    console.error('❌ ARGestureRecognition 未定义')
                    setGuideText('❌ 手势识别库未加载')
                    setIsGestureEnabled(false)
                    setTimeout(() => setGuideText(''), 2000)
                    return
                  }
                  arManagerRef.current.gestureRecognition = new ARGestureRecognition()
                  arManagerRef.current.gestureRecognition.onGestureDetected = (gesture) => {
                    console.log('👋 检测到手势:', gesture)
                    setLastGesture(gesture)
                    handleGestureAction(gesture)
                  }
                }
                
                console.log('🚀 启动手势识别...')
                const success = await arManagerRef.current.gestureRecognition.start()
                if (success) {
                  setGuideText('👋 手势识别已开启')
                } else {
                  console.error('❌ 手势识别启动失败')
                  setGuideText('❌ 手势识别启动失败')
                  setIsGestureEnabled(false)
                }
              } else {
                console.log('⏹️ 关闭手势识别')
                arManagerRef.current?.gestureRecognition?.stop()
                setGuideText('👋 手势识别已关闭')
              }
            } catch (error) {
              console.error('❌ 手势识别错误:', error)
              setGuideText('❌ 手势识别错误: ' + error.message)
              setIsGestureEnabled(false)
            }
            setTimeout(() => setGuideText(''), 2000)
          }}
          title="手势识别"
        >
          ✋
        </button>
        <button
          className={`${styles.toolButton} ${isFollowing ? styles.active : ''}`}
          onClick={() => {
            const newFollowing = !isFollowing
            setIsFollowing(newFollowing)
            if (arManagerRef.current) {
              arManagerRef.current.isFollowing = newFollowing
            }
            setGuideText(newFollowing ? '🔒 跟随模式已开启' : '🔓 跟随模式已关闭')
            setTimeout(() => setGuideText(''), 1500)
          }}
          title="跟随模式"
        >
          {isFollowing ? '🔒' : '🔓'}
        </button>
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
