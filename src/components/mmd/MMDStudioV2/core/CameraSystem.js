/**
 * 摄像机系统
 *
 * 功能：
 * - 摄像机轨迹编辑
 * - 多机位切换
 * - 跟随模式
 * - 镜头抖动
 * - 景深控制
 */

export class CameraSystem {
  constructor(camera, scene) {
    this.camera = camera
    this.scene = scene
    this.THREE = null

    // 轨迹数据
    this.trajectories = new Map()
    this.activeTrajectory = null
    this.trajectoryProgress = 0

    // 机位预设
    this.cameraPresets = new Map()
    this.activePreset = null

    // 跟随目标
    this.followTarget = null
    this.followSettings = {
      enabled: false,
      smoothness: 0.1,
      offset: { x: 0, y: 2, z: 5 },
      lookAtOffset: { x: 0, y: 1, z: 0 }
    }

    // 镜头抖动
    this.shakeSettings = {
      enabled: false,
      intensity: 0.1,
      speed: 10,
      decay: 0.95
    }
    this.shakeOffset = { x: 0, y: 0, z: 0 }
    this.shakeTime = 0

    // 景深
    this.depthOfField = {
      enabled: false,
      focusDistance: 10,
      aperture: 0.1,
      maxBlur: 1.0
    }

    // 原始位置（用于恢复）
    this.originalPosition = null
    this.originalRotation = null

    this.isInitialized = false
  }

  /**
   * 初始化摄像机系统
   */
  async init() {
    if (this.isInitialized) return

    this.THREE = await import('three')

    // 保存原始状态
    this.originalPosition = this.camera.position.clone()
    this.originalRotation = this.camera.rotation.clone()

    this.isInitialized = true
    console.log('摄像机系统初始化完成')
  }

  /**
   * 创建摄像机轨迹
   */
  createTrajectory(id, name, options = {}) {
    const trajectory = {
      id,
      name,
      points: [], // 轨迹点数组
      duration: options.duration || 10,
      loop: options.loop || false,
      smoothness: options.smoothness || 0.5,
      // 可视化曲线
      curve: null,
      line: null
    }

    this.trajectories.set(id, trajectory)
    return trajectory
  }

  /**
   * 添加轨迹点
   */
  addTrajectoryPoint(trajectoryId, position, lookAt, time) {
    const trajectory = this.trajectories.get(trajectoryId)
    if (!trajectory) return null

    const point = {
      id: `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: { ...position },
      lookAt: lookAt ? { ...lookAt } : null,
      time: time !== undefined ? time : trajectory.points.length,
      easing: 'easeInOut'
    }

    // 按时间排序插入
    const insertIndex = trajectory.points.findIndex(p => p.time > point.time)
    if (insertIndex === -1) {
      trajectory.points.push(point)
    } else {
      trajectory.points.splice(insertIndex, 0, point)
    }

    // 更新曲线
    this.updateTrajectoryCurve(trajectoryId)

    return point
  }

  /**
   * 更新轨迹曲线
   */
  updateTrajectoryCurve(trajectoryId) {
    const trajectory = this.trajectories.get(trajectoryId)
    if (!trajectory || trajectory.points.length < 2) return

    // 创建平滑曲线
    const points = trajectory.points.map(p =>
      new this.THREE.Vector3(p.position.x, p.position.y, p.position.z)
    )

    trajectory.curve = new this.THREE.CatmullRomCurve3(points)
    trajectory.curve.curveType = 'catmullrom'
    trajectory.curve.tension = trajectory.smoothness

    // 创建可视化线条
    if (trajectory.line) {
      this.scene.remove(trajectory.line)
    }

    const curvePoints = trajectory.curve.getPoints(100)
    const geometry = new this.THREE.BufferGeometry().setFromPoints(curvePoints)
    const material = new this.THREE.LineBasicMaterial({
      color: 0x667eea,
      linewidth: 2
    })

    trajectory.line = new this.THREE.Line(geometry, material)
    trajectory.line.userData.isTrajectory = true
    this.scene.add(trajectory.line)
  }

  /**
   * 删除轨迹点
   */
  removeTrajectoryPoint(trajectoryId, pointId) {
    const trajectory = this.trajectories.get(trajectoryId)
    if (!trajectory) return false

    const index = trajectory.points.findIndex(p => p.id === pointId)
    if (index === -1) return false

    trajectory.points.splice(index, 1)
    this.updateTrajectoryCurve(trajectoryId)

    return true
  }

  /**
   * 设置活动轨迹
   */
  setActiveTrajectory(trajectoryId) {
    if (trajectoryId === null) {
      this.activeTrajectory = null
      return
    }

    const trajectory = this.trajectories.get(trajectoryId)
    if (trajectory) {
      this.activeTrajectory = trajectory
      this.trajectoryProgress = 0
    }
  }

  /**
   * 获取轨迹上的位置和朝向
   */
  getTrajectoryPosition(trajectoryId, t) {
    const trajectory = this.trajectories.get(trajectoryId)
    if (!trajectory || !trajectory.curve) return null

    // 确保 t 在 0-1 范围内
    t = Math.max(0, Math.min(1, t))

    const position = trajectory.curve.getPointAt(t)

    // 计算朝向
    let lookAt = null
    if (trajectory.points.length > 0) {
      // 找到最近的两个点进行插值
      const pointIndex = Math.floor(t * (trajectory.points.length - 1))
      const pointT = t * (trajectory.points.length - 1) - pointIndex

      const point1 = trajectory.points[pointIndex]
      const point2 = trajectory.points[Math.min(pointIndex + 1, trajectory.points.length - 1)]

      if (point1.lookAt && point2.lookAt) {
        lookAt = new this.THREE.Vector3(
          point1.lookAt.x + (point2.lookAt.x - point1.lookAt.x) * pointT,
          point1.lookAt.y + (point2.lookAt.y - point1.lookAt.y) * pointT,
          point1.lookAt.z + (point2.lookAt.z - point1.lookAt.z) * pointT
        )
      } else if (point1.lookAt) {
        lookAt = new this.THREE.Vector3(point1.lookAt.x, point1.lookAt.y, point1.lookAt.z)
      }
    }

    return { position, lookAt }
  }

  /**
   * 创建机位预设
   */
  createPreset(id, name, position, lookAt, options = {}) {
    const preset = {
      id,
      name,
      position: { ...position },
      lookAt: lookAt ? { ...lookAt } : { x: 0, y: 1, z: 0 },
      fov: options.fov || 60,
      transitionDuration: options.transitionDuration || 1.0,
      depthOfField: options.depthOfField || null
    }

    this.cameraPresets.set(id, preset)
    return preset
  }

  /**
   * 切换到机位预设
   */
  switchToPreset(presetId, immediate = false) {
    const preset = this.cameraPresets.get(presetId)
    if (!preset) return false

    this.activePreset = preset

    if (immediate) {
      // 立即切换
      this.camera.position.set(preset.position.x, preset.position.y, preset.position.z)
      this.camera.lookAt(preset.lookAt.x, preset.lookAt.y, preset.lookAt.z)
      this.camera.fov = preset.fov
      this.camera.updateProjectionMatrix()
    } else {
      // 平滑过渡（需要在 update 中处理）
      this.targetPosition = new this.THREE.Vector3(preset.position.x, preset.position.y, preset.position.z)
      this.targetLookAt = new this.THREE.Vector3(preset.lookAt.x, preset.lookAt.y, preset.lookAt.z)
      this.targetFov = preset.fov
      this.transitionStartTime = Date.now()
      this.transitionDuration = preset.transitionDuration * 1000
      this.startPosition = this.camera.position.clone()
      this.startRotation = this.camera.rotation.clone()
      this.startFov = this.camera.fov
    }

    // 应用景深设置
    if (preset.depthOfField) {
      this.depthOfField = { ...preset.depthOfField }
    }

    return true
  }

  /**
   * 设置跟随目标
   */
  setFollowTarget(target, options = {}) {
    this.followTarget = target

    if (options.offset) {
      this.followSettings.offset = { ...options.offset }
    }
    if (options.lookAtOffset) {
      this.followSettings.lookAtOffset = { ...options.lookAtOffset }
    }
    if (options.smoothness !== undefined) {
      this.followSettings.smoothness = options.smoothness
    }
  }

  /**
   * 启用/禁用跟随
   */
  setFollowEnabled(enabled) {
    this.followSettings.enabled = enabled
  }

  /**
   * 启用镜头抖动
   */
  enableShake(intensity = 0.1, duration = 1.0) {
    this.shakeSettings.enabled = true
    this.shakeSettings.intensity = intensity
    this.shakeTime = duration
  }

  /**
   * 禁用镜头抖动
   */
  disableShake() {
    this.shakeSettings.enabled = false
    this.shakeOffset = { x: 0, y: 0, z: 0 }
  }

  /**
   * 更新镜头抖动
   */
  updateShake(deltaTime) {
    if (!this.shakeSettings.enabled) return

    if (this.shakeTime > 0) {
      this.shakeTime -= deltaTime

      // 生成随机抖动
      const intensity = this.shakeSettings.intensity * (this.shakeTime > 0 ? 1 : 0)
      this.shakeOffset.x = (Math.random() - 0.5) * intensity
      this.shakeOffset.y = (Math.random() - 0.5) * intensity
      this.shakeOffset.z = (Math.random() - 0.5) * intensity * 0.5

      // 应用抖动
      this.camera.position.x += this.shakeOffset.x
      this.camera.position.y += this.shakeOffset.y
      this.camera.position.z += this.shakeOffset.z
    } else {
      this.disableShake()
    }
  }

  /**
   * 更新跟随
   */
  updateFollow(deltaTime) {
    if (!this.followSettings.enabled || !this.followTarget) return

    const target = this.followTarget
    const settings = this.followSettings

    // 计算目标位置
    const targetPosition = new this.THREE.Vector3(
      target.position.x + settings.offset.x,
      target.position.y + settings.offset.y,
      target.position.z + settings.offset.z
    )

    // 平滑跟随
    this.camera.position.lerp(targetPosition, settings.smoothness)

    // 计算朝向
    const lookAtPosition = new this.THREE.Vector3(
      target.position.x + settings.lookAtOffset.x,
      target.position.y + settings.lookAtOffset.y,
      target.position.z + settings.lookAtOffset.z
    )

    this.camera.lookAt(lookAtPosition)
  }

  /**
   * 更新轨迹动画
   */
  updateTrajectory(deltaTime, totalTime) {
    if (!this.activeTrajectory) return

    const trajectory = this.activeTrajectory

    // 计算进度
    if (trajectory.duration > 0) {
      this.trajectoryProgress += deltaTime / trajectory.duration

      if (trajectory.loop) {
        this.trajectoryProgress = this.trajectoryProgress % 1
      } else {
        this.trajectoryProgress = Math.min(1, this.trajectoryProgress)
      }
    }

    // 获取位置和朝向
    const result = this.getTrajectoryPosition(trajectory.id, this.trajectoryProgress)
    if (result) {
      this.camera.position.copy(result.position)
      if (result.lookAt) {
        this.camera.lookAt(result.lookAt)
      }
    }
  }

  /**
   * 更新机位过渡
   */
  updateTransition() {
    if (!this.targetPosition || !this.activePreset) return

    const elapsed = Date.now() - this.transitionStartTime
    const progress = Math.min(1, elapsed / this.transitionDuration)

    // 使用缓动函数
    const eased = this.easeInOutCubic(progress)

    // 插值位置
    this.camera.position.lerpVectors(this.startPosition, this.targetPosition, eased)

    // 插值FOV
    this.camera.fov = this.startFov + (this.targetFov - this.startFov) * eased
    this.camera.updateProjectionMatrix()

    // 插值朝向（简化处理）
    if (this.targetLookAt) {
      const currentLookAt = new this.THREE.Vector3(0, 0, -1)
      currentLookAt.applyQuaternion(this.camera.quaternion)
      currentLookAt.add(this.camera.position)

      currentLookAt.lerp(this.targetLookAt, eased)
      this.camera.lookAt(currentLookAt)
    }

    // 过渡完成
    if (progress >= 1) {
      this.targetPosition = null
      this.targetLookAt = null
    }
  }

  /**
   * 缓动函数
   */
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  /**
   * 主更新函数
   */
  update(deltaTime, totalTime) {
    if (!this.isInitialized) return

    // 优先级：轨迹 > 过渡 > 跟随
    if (this.activeTrajectory) {
      this.updateTrajectory(deltaTime, totalTime)
    } else if (this.targetPosition) {
      this.updateTransition()
    } else if (this.followSettings.enabled) {
      this.updateFollow(deltaTime)
    }

    // 镜头抖动最后应用
    this.updateShake(deltaTime)
  }

  /**
   * 显示/隐藏轨迹可视化
   */
  setTrajectoryVisible(trajectoryId, visible) {
    const trajectory = this.trajectories.get(trajectoryId)
    if (trajectory && trajectory.line) {
      trajectory.line.visible = visible
    }
  }

  /**
   * 显示所有轨迹
   */
  showAllTrajectories() {
    this.trajectories.forEach((trajectory, id) => {
      this.setTrajectoryVisible(id, true)
    })
  }

  /**
   * 隐藏所有轨迹
   */
  hideAllTrajectories() {
    this.trajectories.forEach((trajectory, id) => {
      this.setTrajectoryVisible(id, false)
    })
  }

  /**
   * 重置摄像机
   */
  reset() {
    if (this.originalPosition && this.originalRotation) {
      this.camera.position.copy(this.originalPosition)
      this.camera.rotation.copy(this.originalRotation)
    }

    this.activeTrajectory = null
    this.activePreset = null
    this.followTarget = null
    this.followSettings.enabled = false
    this.disableShake()
  }

  /**
   * 清理资源
   */
  dispose() {
    // 清理轨迹可视化
    this.trajectories.forEach(trajectory => {
      if (trajectory.line) {
        this.scene.remove(trajectory.line)
        trajectory.line.geometry.dispose()
        trajectory.line.material.dispose()
      }
    })

    this.trajectories.clear()
    this.cameraPresets.clear()

    this.isInitialized = false
  }
}
