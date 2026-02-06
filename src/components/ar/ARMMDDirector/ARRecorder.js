import * as THREE from 'three'

/**
 * AR Recorder - AR场景录制和回放系统
 * 
 * 功能：
 * 1. 多平面检测和追踪
 * 2. 位置计算和平面间移动
 * 3. AR场景录制（平面数据、相机位置、时间戳）
 * 4. AR场景回放
 * 5. 导入/导出AR场景文件 (.arscene)
 * 
 * 文件格式：
 * {
 *   version: '1.0',
 *   createdAt: ISOString,
 *   duration: number, // 录制时长(秒)
 *   planes: [
 *     {
 *       id: string,
 *       center: { x, y, z },
 *       normal: { x, y, z },
 *       size: { width, height },
 *       vertices: [{ x, y, z }, ...], // 平面顶点
 *       timestamp: number
 *     }
 *   ],
 *   cameraPath: [
 *     {
 *       position: { x, y, z },
 *       quaternion: { x, y, z, w },
 *       timestamp: number
 *     }
 *   ],
 *   events: [
 *     {
 *       type: 'planeDetected' | 'planeLost' | 'planeUpdated',
 *       planeId: string,
 *       timestamp: number,
 *       data: object
 *     }
 *   ]
 * }
 */

export class ARRecorder {
  constructor() {
    this.isRecording = false
    this.isPlaying = false
    this.startTime = 0
    this.recordedData = null
    this.playbackTime = 0
    this.playbackStartTime = 0
    
    // 平面数据
    this.planes = new Map() // id -> plane data
    this.planeMeshes = new Map() // id -> THREE.Mesh
    
    // 录制数据
    this.recordedPlanes = []
    this.recordedCameraPath = []
    this.recordedEvents = []
    
    // 回调
    this.onPlaneDetected = null
    this.onPlaneLost = null
    this.onPlaybackUpdate = null
    
    // 动画帧
    this.animationFrame = null
  }
  
  /**
   * 开始录制AR场景
   */
  startRecording() {
    if (this.isRecording) return
    
    this.isRecording = true
    this.startTime = performance.now()
    this.recordedPlanes = []
    this.recordedCameraPath = []
    this.recordedEvents = []
    
    console.log('AR录制开始')
    this.recordLoop()
  }
  
  /**
   * 停止录制
   */
  stopRecording() {
    if (!this.isRecording) return
    
    this.isRecording = false
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
    }
    
    const duration = (performance.now() - this.startTime) / 1000
    
    this.recordedData = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      duration: duration,
      planes: this.recordedPlanes,
      cameraPath: this.recordedCameraPath,
      events: this.recordedEvents
    }
    
    console.log('AR录制完成', this.recordedData)
    return this.recordedData
  }
  
  /**
   * 录制循环
   */
  recordLoop() {
    if (!this.isRecording) return
    
    const timestamp = (performance.now() - this.startTime) / 1000
    
    // 录制相机路径 (30fps)
    if (this.recordedCameraPath.length === 0 || 
        timestamp - this.recordedCameraPath[this.recordedCameraPath.length - 1].timestamp >= 1/30) {
      // 这里需要从外部传入相机数据
    }
    
    this.animationFrame = requestAnimationFrame(() => this.recordLoop())
  }
  
  /**
   * 记录相机位置
   */
  recordCameraPose(position, quaternion) {
    if (!this.isRecording) return
    
    const timestamp = (performance.now() - this.startTime) / 1000
    
    this.recordedCameraPath.push({
      position: { x: position.x, y: position.y, z: position.z },
      quaternion: { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w },
      timestamp
    })
  }
  
  /**
   * 记录平面检测事件
   */
  recordPlaneEvent(type, planeData) {
    if (!this.isRecording) return
    
    const timestamp = (performance.now() - this.startTime) / 1000
    
    const event = {
      type,
      planeId: planeData.id,
      timestamp,
      data: { ...planeData }
    }
    
    this.recordedEvents.push(event)
    
    // 如果是新平面，记录到planes数组
    if (type === 'planeDetected') {
      this.recordedPlanes.push({
        ...planeData,
        firstSeen: timestamp
      })
    }
  }
  
  /**
   * 开始回放
   */
  startPlayback(arSceneData, onUpdate) {
    if (this.isPlaying) this.stopPlayback()
    
    this.recordedData = arSceneData
    this.isPlaying = true
    this.playbackStartTime = performance.now()
    this.onPlaybackUpdate = onUpdate
    
    console.log('AR回放开始', arSceneData)
    this.playbackLoop()
  }
  
  /**
   * 停止回放
   */
  stopPlayback() {
    this.isPlaying = false
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
    }
    console.log('AR回放停止')
  }
  
  /**
   * 回放循环
   */
  playbackLoop() {
    if (!this.isPlaying) return
    
    const elapsed = (performance.now() - this.playbackStartTime) / 1000
    
    if (elapsed > this.recordedData.duration) {
      this.stopPlayback()
      return
    }
    
    // 获取当前时刻的相机位置
    const cameraPose = this.getCameraPoseAtTime(elapsed)
    
    // 获取当前活跃的平面
    const activePlanes = this.getActivePlanesAtTime(elapsed)
    
    // 触发更新回调
    if (this.onPlaybackUpdate) {
      this.onPlaybackUpdate({
        time: elapsed,
        cameraPose,
        planes: activePlanes,
        events: this.getEventsAtTime(elapsed)
      })
    }
    
    this.animationFrame = requestAnimationFrame(() => this.playbackLoop())
  }
  
  /**
   * 获取指定时间的相机位置
   */
  getCameraPoseAtTime(time) {
    const { cameraPath } = this.recordedData
    if (cameraPath.length === 0) return null
    
    // 找到前后两个关键帧
    let prev = cameraPath[0]
    let next = cameraPath[cameraPath.length - 1]
    
    for (let i = 0; i < cameraPath.length - 1; i++) {
      if (cameraPath[i].timestamp <= time && cameraPath[i + 1].timestamp >= time) {
        prev = cameraPath[i]
        next = cameraPath[i + 1]
        break
      }
    }
    
    // 插值
    const t = (time - prev.timestamp) / (next.timestamp - prev.timestamp)
    
    return {
      position: this.lerpVector(prev.position, next.position, t),
      quaternion: this.slerpQuaternion(prev.quaternion, next.quaternion, t)
    }
  }
  
  /**
   * 获取指定时间的活跃平面
   */
  getActivePlanesAtTime(time) {
    const activePlanes = []
    
    for (const event of this.recordedData.events) {
      if (event.timestamp > time) break
      
      if (event.type === 'planeDetected' || event.type === 'planeUpdated') {
        const existingIndex = activePlanes.findIndex(p => p.id === event.planeId)
        if (existingIndex >= 0) {
          activePlanes[existingIndex] = event.data
        } else {
          activePlanes.push(event.data)
        }
      } else if (event.type === 'planeLost') {
        const index = activePlanes.findIndex(p => p.id === event.planeId)
        if (index >= 0) {
          activePlanes.splice(index, 1)
        }
      }
    }
    
    return activePlanes
  }
  
  /**
   * 获取指定时间的事件
   */
  getEventsAtTime(time) {
    return this.recordedData.events.filter(e => 
      Math.abs(e.timestamp - time) < 0.1
    )
  }
  
  /**
   * 向量线性插值
   */
  lerpVector(a, b, t) {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      z: a.z + (b.z - a.z) * t
    }
  }
  
  /**
   * 四元数球面插值
   */
  slerpQuaternion(a, b, t) {
    // 简化的slerp实现
    const dot = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w
    
    if (dot > 0.9995) {
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        z: a.z + (b.z - a.z) * t,
        w: a.w + (b.w - a.w) * t
      }
    }
    
    const theta0 = Math.acos(Math.abs(dot))
    const theta = theta0 * t
    
    const sinTheta = Math.sin(theta)
    const sinTheta0 = Math.sin(theta0)
    
    const s0 = Math.cos(theta) - dot * sinTheta / sinTheta0
    const s1 = sinTheta / sinTheta0
    
    return {
      x: a.x * s0 + b.x * s1,
      y: a.y * s0 + b.y * s1,
      z: a.z * s0 + b.z * s1,
      w: a.w * s0 + b.w * s1
    }
  }
  
  /**
   * 计算平面上的位置
   */
  calculatePositionOnPlane(plane, localPosition) {
    // 将局部坐标转换为世界坐标
    const center = new THREE.Vector3(plane.center.x, plane.center.y, plane.center.z)
    const normal = new THREE.Vector3(plane.normal.x, plane.normal.y, plane.normal.z)
    
    // 创建平面的局部坐标系
    const up = new THREE.Vector3(0, 1, 0)
    if (Math.abs(normal.dot(up)) > 0.99) {
      up.set(1, 0, 0)
    }
    
    const right = new THREE.Vector3().crossVectors(normal, up).normalize()
    const forward = new THREE.Vector3().crossVectors(right, normal).normalize()
    
    // 计算世界位置
    const worldPos = center.clone()
    worldPos.add(right.multiplyScalar(localPosition.x))
    worldPos.add(forward.multiplyScalar(localPosition.z))
    worldPos.add(normal.multiplyScalar(localPosition.y))
    
    return worldPos
  }
  
  /**
   * 计算两个平面之间的转换
   */
  calculatePlaneTransition(fromPlane, toPlane, progress) {
    const fromPos = new THREE.Vector3(fromPlane.center.x, fromPlane.center.y, fromPlane.center.z)
    const toPos = new THREE.Vector3(toPlane.center.x, toPlane.center.y, toPlane.center.z)
    
    // 计算高度差
    const heightDiff = toPos.y - fromPos.y
    
    // 创建弧形路径
    const midPos = fromPos.clone().lerp(toPos, 0.5)
    midPos.y += Math.abs(heightDiff) * 0.5 + 0.5 // 添加弧形高度
    
    // 二次贝塞尔曲线
    const t = progress
    const invT = 1 - t
    
    const position = new THREE.Vector3()
    position.x = invT * invT * fromPos.x + 2 * invT * t * midPos.x + t * t * toPos.x
    position.y = invT * invT * fromPos.y + 2 * invT * t * midPos.y + t * t * toPos.y
    position.z = invT * invT * fromPos.z + 2 * invT * t * midPos.z + t * t * toPos.z
    
    // 计算朝向
    const lookAt = fromPos.clone().lerp(toPos, t + 0.1)
    
    return { position, lookAt }
  }
  
  /**
   * 导出AR场景
   */
  exportARScene() {
    if (!this.recordedData) {
      throw new Error('没有可导出的AR场景数据')
    }
    
    const dataStr = JSON.stringify(this.recordedData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    
    return {
      blob,
      filename: `ar_scene_${Date.now()}.arscene`
    }
  }
  
  /**
   * 导入AR场景
   */
  importARScene(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          
          // 验证版本
          if (data.version !== '1.0') {
            throw new Error(`不支持的AR场景版本: ${data.version}`)
          }
          
          this.recordedData = data
          resolve(data)
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('读取文件失败'))
      reader.readAsText(file)
    })
  }
  
  /**
   * 清理
   */
  dispose() {
    this.stopRecording()
    this.stopPlayback()
    
    this.planes.clear()
    this.planeMeshes.clear()
    
    this.recordedData = null
    this.recordedPlanes = []
    this.recordedCameraPath = []
    this.recordedEvents = []
  }
}

// 单例模式
let instance = null

export function getARRecorder() {
  if (!instance) {
    instance = new ARRecorder()
  }
  return instance
}

export function destroyARRecorder() {
  if (instance) {
    instance.dispose()
    instance = null
  }
}
