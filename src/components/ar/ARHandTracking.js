import * as THREE from 'three'

/**
 * AR手势识别系统 - 使用WebXR Hand Tracking API
 * 支持识别: 点赞、胜利、手掌、拳头、 pointing等手势
 */
export class ARHandTracking {
  constructor() {
    this.session = null
    this.referenceSpace = null
    this.hands = new Map() // 存储左右手数据
    this.isInitialized = false
    this.isRunning = false
    this.onGestureDetected = null
    this.onHandUpdate = null
    
    // 手势历史记录（用于防抖）
    this.gestureHistory = []
    this.historySize = 5
    this.lastGestureTime = 0
    this.gestureCooldown = 500 // 手势触发间隔(ms)
    
    // 手部可视化
    this.handMeshes = new Map()
    this.jointGeometry = null
    this.jointMaterial = null
    this.boneMaterial = null
    
    // 手势定义
    this.gestures = {
      thumbs_up: '👍 点赞',
      victory: '✌️ 胜利',
      open_palm: '✋ 手掌',
      fist: '✊ 拳头',
      pointing: '☝️ 指',
      ok: '👌 OK',
      rock: '🤘 摇滚',
      pinch: '👌 捏合'
    }
  }

  async initialize(session, referenceSpace) {
    this.session = session
    this.referenceSpace = referenceSpace
    
    // 检查是否支持手部追踪
    if (!this.session) {
      console.warn('ARHandTracking: 没有可用的XR会话')
      return false
    }
    
    // 检查是否支持hand-tracking
    const supported = await this.session.isFeatureEnabled('hand-tracking') || 
                      this.session.enabledFeatures?.includes('hand-tracking')
    
    if (!supported) {
      console.warn('ARHandTracking: 设备不支持手部追踪')
      return false
    }
    
    this.isInitialized = true
    console.log('✋ AR手势识别系统已初始化')
    return true
  }

  start() {
    if (!this.isInitialized) {
      console.warn('ARHandTracking: 请先初始化')
      return false
    }
    
    this.isRunning = true
    
    // 监听手部数据
    this.setupHandTracking()
    
    console.log('✋ 手势识别已启动')
    return true
  }

  stop() {
    this.isRunning = false
    
    // 清理手部网格
    this.handMeshes.forEach((mesh) => {
      if (mesh.parent) {
        mesh.parent.remove(mesh)
      }
    })
    this.handMeshes.clear()
    this.hands.clear()
    
    console.log('✋ 手势识别已停止')
  }

  setupHandTracking() {
    // 在每一帧中处理手部数据
    // 实际处理在update方法中
  }

  update(frame) {
    if (!this.isRunning || !frame) return

    // 获取手部数据
    for (const inputSource of frame.session.inputSources) {
      if (inputSource.hand) {
        this.processHandData(inputSource, frame)
      }
    }
  }

  processHandData(inputSource, frame) {
    const hand = inputSource.hand
    const handedness = inputSource.handedness // 'left' 或 'right'
    
    // 获取手部关节数据
    const joints = {}
    const jointNames = [
      'wrist',
      'thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip',
      'index-finger-metacarpal', 'index-finger-phalanx-proximal', 'index-finger-phalanx-intermediate', 'index-finger-phalanx-distal', 'index-finger-tip',
      'middle-finger-metacarpal', 'middle-finger-phalanx-proximal', 'middle-finger-phalanx-intermediate', 'middle-finger-phalanx-distal', 'middle-finger-tip',
      'ring-finger-metacarpal', 'ring-finger-phalanx-proximal', 'ring-finger-phalanx-intermediate', 'ring-finger-phalanx-distal', 'ring-finger-tip',
      'pinky-finger-metacarpal', 'pinky-finger-phalanx-proximal', 'pinky-finger-phalanx-intermediate', 'pinky-finger-phalanx-distal', 'pinky-finger-tip'
    ]

    for (const jointName of jointNames) {
      const jointPose = frame.getJointPose(hand.get(jointName), this.referenceSpace)
      if (jointPose) {
        joints[jointName] = {
          position: jointPose.transform.position,
          orientation: jointPose.transform.orientation,
          radius: jointPose.radius
        }
      }
    }

    // 存储手部数据
    this.hands.set(handedness, {
      joints,
      handedness,
      timestamp: Date.now()
    })

    // 识别手势
    const gesture = this.recognizeGesture(joints)
    
    if (gesture && this.onGestureDetected) {
      const now = Date.now()
      
      // 添加到历史记录
      this.gestureHistory.push(gesture)
      if (this.gestureHistory.length > this.historySize) {
        this.gestureHistory.shift()
      }
      
      // 检查是否稳定识别（历史记录中超过半数相同）
      const gestureCounts = {}
      this.gestureHistory.forEach(g => {
        gestureCounts[g] = (gestureCounts[g] || 0) + 1
      })
      
      const stableGesture = Object.entries(gestureCounts)
        .find(([g, count]) => count >= this.historySize / 2)
      
      // 防抖和冷却检查
      if (stableGesture && 
          stableGesture[0] === gesture && 
          now - this.lastGestureTime > this.gestureCooldown) {
        this.lastGestureTime = now
        this.onGestureDetected({
          gesture,
          gestureName: this.gestures[gesture],
          handedness,
          joints
        })
      }
    }

    // 回调手部更新
    if (this.onHandUpdate) {
      this.onHandUpdate({
        handedness,
        joints,
        gesture
      })
    }
  }

  recognizeGesture(joints) {
    if (!joints['wrist'] || !joints['index-finger-tip']) {
      return null
    }

    // 计算手指伸展状态
    const fingerStates = {
      thumb: this.isFingerExtended(joints, 'thumb'),
      index: this.isFingerExtended(joints, 'index'),
      middle: this.isFingerExtended(joints, 'middle'),
      ring: this.isFingerExtended(joints, 'ring'),
      pinky: this.isFingerExtended(joints, 'pinky')
    }

    // 识别手势模式
    const extendedCount = Object.values(fingerStates).filter(Boolean).length

    // 👍 点赞: 拇指伸展，其他手指弯曲
    if (fingerStates.thumb && !fingerStates.index && !fingerStates.middle && 
        !fingerStates.ring && !fingerStates.pinky) {
      // 检查拇指方向（向上）
      const thumbTip = joints['thumb-tip'].position
      const thumbBase = joints['thumb-metacarpal'].position
      if (thumbTip.y > thumbBase.y) {
        return 'thumbs_up'
      }
    }

    // ✌️ 胜利: 食指和中指伸展，其他弯曲
    if (!fingerStates.thumb && fingerStates.index && fingerStates.middle && 
        !fingerStates.ring && !fingerStates.pinky) {
      return 'victory'
    }

    // ✋ 手掌: 所有手指伸展
    if (extendedCount >= 4) {
      return 'open_palm'
    }

    // ✊ 拳头: 所有手指弯曲
    if (extendedCount === 0) {
      return 'fist'
    }

    // ☝️ 指: 只有食指伸展
    if (!fingerStates.thumb && fingerStates.index && !fingerStates.middle && 
        !fingerStates.ring && !fingerStates.pinky) {
      return 'pointing'
    }

    // 👌 OK: 拇指和食指捏合，其他伸展
    if (this.isPinchGesture(joints, 'thumb', 'index') && 
        fingerStates.middle && fingerStates.ring && fingerStates.pinky) {
      return 'ok'
    }

    // 🤘 摇滚: 食指和小指伸展，其他弯曲
    if (!fingerStates.thumb && fingerStates.index && !fingerStates.middle && 
        !fingerStates.ring && fingerStates.pinky) {
      return 'rock'
    }

    // 👌 捏合: 任意两指捏合
    if (this.isPinchGesture(joints, 'thumb', 'index') ||
        this.isPinchGesture(joints, 'thumb', 'middle')) {
      return 'pinch'
    }

    return null
  }

  isFingerExtended(joints, fingerName) {
    const fingerMap = {
      thumb: ['thumb-metacarpal', 'thumb-tip'],
      index: ['index-finger-metacarpal', 'index-finger-tip'],
      middle: ['middle-finger-metacarpal', 'middle-finger-tip'],
      ring: ['ring-finger-metacarpal', 'ring-finger-tip'],
      pinky: ['pinky-finger-metacarpal', 'pinky-finger-tip']
    }

    const [baseName, tipName] = fingerMap[fingerName]
    const base = joints[baseName]
    const tip = joints[tipName]
    const wrist = joints['wrist']

    if (!base || !tip || !wrist) return false

    // 计算指尖到手腕的距离 vs 指根到手腕的距离
    const tipToWrist = this.distance(tip.position, wrist.position)
    const baseToWrist = this.distance(base.position, wrist.position)

    // 如果指尖距离明显大于指根距离，认为手指伸展
    return tipToWrist > baseToWrist * 1.3
  }

  isPinchGesture(joints, finger1, finger2) {
    const fingerTips = {
      thumb: 'thumb-tip',
      index: 'index-finger-tip',
      middle: 'middle-finger-tip',
      ring: 'ring-finger-tip',
      pinky: 'pinky-finger-tip'
    }

    const tip1 = joints[fingerTips[finger1]]
    const tip2 = joints[fingerTips[finger2]]

    if (!tip1 || !tip2) return false

    const distance = this.distance(tip1.position, tip2.position)
    
    // 捏合距离阈值（米）
    return distance < 0.02
  }

  distance(pos1, pos2) {
    const dx = pos1.x - pos2.x
    const dy = pos1.y - pos2.y
    const dz = pos1.z - pos2.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  // 创建手部可视化（可选）
  createHandVisualization(scene, handedness) {
    if (this.handMeshes.has(handedness)) return

    const handGroup = new THREE.Group()
    handGroup.name = `hand-${handedness}`

    // 创建关节几何体和材质
    if (!this.jointGeometry) {
      this.jointGeometry = new THREE.SphereGeometry(1, 8, 8)
      this.jointMaterial = new THREE.MeshBasicMaterial({ 
        color: handedness === 'left' ? 0x00ff00 : 0x0000ff,
        transparent: true,
        opacity: 0.6
      })
      this.boneMaterial = new THREE.LineBasicMaterial({ 
        color: handedness === 'left' ? 0x00ff00 : 0x0000ff,
        transparent: true,
        opacity: 0.4
      })
    }

    // 创建关节网格（25个关节）
    const joints = []
    for (let i = 0; i < 25; i++) {
      const joint = new THREE.Mesh(this.jointGeometry, this.jointMaterial.clone())
      joint.visible = false
      handGroup.add(joint)
      joints.push(joint)
    }

    scene.add(handGroup)
    this.handMeshes.set(handedness, { group: handGroup, joints })
  }

  // 更新手部可视化
  updateHandVisualization(handedness, joints) {
    const handMesh = this.handMeshes.get(handedness)
    if (!handMesh) return

    const jointNames = Object.keys(joints)
    jointNames.forEach((name, index) => {
      if (handMesh.joints[index] && joints[name]) {
        const joint = joints[name]
        handMesh.joints[index].position.set(
          joint.position.x,
          joint.position.y,
          joint.position.z
        )
        handMesh.joints[index].scale.setScalar(joint.radius || 0.01)
        handMesh.joints[index].visible = true
      }
    })
  }

  // 获取手部位置（用于交互）
  getHandPosition(handedness = 'right') {
    const hand = this.hands.get(handedness)
    if (!hand || !hand.joints['index-finger-tip']) return null

    return hand.joints['index-finger-tip'].position
  }

  // 获取捏合位置（拇指和食指中点）
  getPinchPosition(handedness = 'right') {
    const hand = this.hands.get(handedness)
    if (!hand) return null

    const thumb = hand.joints['thumb-tip']
    const index = hand.joints['index-finger-tip']

    if (!thumb || !index) return null

    return {
      x: (thumb.position.x + index.position.x) / 2,
      y: (thumb.position.y + index.position.y) / 2,
      z: (thumb.position.z + index.position.z) / 2
    }
  }

  destroy() {
    this.stop()
    this.isInitialized = false
    this.session = null
    this.referenceSpace = null
  }
}

export default ARHandTracking
