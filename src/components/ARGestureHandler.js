// AR 手势处理器
import * as THREE from 'three'

export class ARGestureHandler {
  constructor(arManager) {
    this.arManager = arManager
    this.canvas = null
    this.raycaster = new THREE.Raycaster()
    this.touches = new Map()
    this.longPressTimer = null
    this.isDragging = false
    this.isScaling = false
    this.isRotating = false
    this.selectedCharacter = null
    this.dragPlane = null
    this.lastTouchDistance = 0
    this.lastTouchAngle = 0
    this.lastTouchCenter = new THREE.Vector2()
    
    // 回调函数
    this.onCharacterSelect = null
    this.onCharacterMove = null
    this.onCharacterScale = null
    this.onCharacterRotate = null
    this.onLongPress = null
    this.onTap = null
  }

  // 初始化手势监听
  init(canvas) {
    this.canvas = canvas
    
    // 触摸事件
    canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false })
    canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
    canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false })
    canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false })
    
    // 鼠标事件（桌面端调试）
    canvas.addEventListener('mousedown', this.handleMouseDown.bind(this))
    canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
    canvas.addEventListener('mouseup', this.handleMouseUp.bind(this))
    canvas.addEventListener('wheel', this.handleWheel.bind(this))
    
    // 创建拖拽平面
    this.createDragPlane()
  }

  // 创建拖拽平面
  createDragPlane() {
    const geometry = new THREE.PlaneGeometry(100, 100)
    const material = new THREE.MeshBasicMaterial({ 
      visible: false,
      transparent: true,
      opacity: 0
    })
    this.dragPlane = new THREE.Mesh(geometry, material)
    this.dragPlane.rotation.x = -Math.PI / 2
    this.dragPlane.name = 'dragPlane'
  }

  // 获取触摸在屏幕上的位置
  getTouchPosition(touch) {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: ((touch.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((touch.clientY - rect.top) / rect.height) * 2 + 1
    }
  }

  // 射线检测
  raycast(screenPos, objects) {
    if (!this.arManager.camera) return []
    
    this.raycaster.setFromCamera(screenPos, this.arManager.camera)
    return this.raycaster.intersectObjects(objects, true)
  }

  // 处理触摸开始
  handleTouchStart(event) {
    event.preventDefault()
    
    const touches = event.touches
    
    // 存储触摸点
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i]
      const pos = this.getTouchPosition(touch)
      this.touches.set(touch.identifier, {
        startPos: pos,
        currentPos: pos,
        startTime: Date.now()
      })
    }

    if (touches.length === 1) {
      // 单指 - 可能是点击或拖拽
      this.handleSingleTouchStart(touches[0])
    } else if (touches.length === 2) {
      // 双指 - 缩放或旋转
      this.handleTwoTouchStart(touches)
    }
  }

  // 单指触摸开始
  handleSingleTouchStart(touch) {
    const pos = this.getTouchPosition(touch)
    
    // 检测是否点击了角色
    const characters = this.arManager.scene.children.filter(
      child => child.userData.isCharacter
    )
    const intersects = this.raycast(pos, characters)
    
    if (intersects.length > 0) {
      // 点击了角色
      const clickedCharacter = intersects[0].object.parent || intersects[0].object
      this.selectedCharacter = clickedCharacter
      this.onCharacterSelect?.(clickedCharacter)
      
      // 设置长按定时器
      this.longPressTimer = setTimeout(() => {
        this.onLongPress?.(clickedCharacter, pos)
      }, 500)
      
      // 准备拖拽
      this.isDragging = true
      this.addDragPlaneToScene()
    } else {
      // 点击了空白处
      this.selectedCharacter = null
      this.onCharacterSelect?.(null)
    }
  }

  // 双指触摸开始
  handleTwoTouchStart(touches) {
    // 取消长按
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
    
    this.isDragging = false
    
    const touch1 = this.getTouchPosition(touches[0])
    const touch2 = this.getTouchPosition(touches[1])
    
    // 计算初始距离和角度
    this.lastTouchDistance = this.getDistance(touch1, touch2)
    this.lastTouchAngle = this.getAngle(touch1, touch2)
    this.lastTouchCenter = this.getCenter(touch1, touch2)
    
    // 检测操作类型
    if (this.selectedCharacter) {
      this.isScaling = true
      this.isRotating = true
    }
  }

  // 处理触摸移动
  handleTouchMove(event) {
    event.preventDefault()
    
    const touches = event.touches
    
    // 更新触摸点位置
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i]
      const touchData = this.touches.get(touch.identifier)
      if (touchData) {
        touchData.currentPos = this.getTouchPosition(touch)
      }
    }

    if (touches.length === 1 && this.isDragging && this.selectedCharacter) {
      // 单指拖拽
      this.handleDrag(touches[0])
    } else if (touches.length === 2) {
      // 双指缩放/旋转
      this.handlePinchAndRotate(touches)
    }
    
    // 如果移动距离超过阈值，取消长按
    if (this.longPressTimer && touches.length > 0) {
      const touchData = this.touches.get(touches[0].identifier)
      if (touchData) {
        const moveDistance = this.getDistance(touchData.startPos, touchData.currentPos)
        if (moveDistance > 0.05) {
          clearTimeout(this.longPressTimer)
          this.longPressTimer = null
        }
      }
    }
  }

  // 处理拖拽
  handleDrag(touch) {
    if (!this.selectedCharacter || !this.dragPlane) return
    
    const pos = this.getTouchPosition(touch)
    
    // 射线检测拖拽平面
    const intersects = this.raycast(pos, [this.dragPlane])
    
    if (intersects.length > 0) {
      const newPosition = intersects[0].point
      // 保持Y轴高度不变
      newPosition.y = this.selectedCharacter.position.y
      this.selectedCharacter.position.copy(newPosition)
      this.onCharacterMove?.(this.selectedCharacter, newPosition)
    }
  }

  // 处理双指缩放和旋转
  handlePinchAndRotate(touches) {
    if (!this.selectedCharacter) return
    
    const touch1 = this.getTouchPosition(touches[0])
    const touch2 = this.getTouchPosition(touches[1])
    
    const currentDistance = this.getDistance(touch1, touch2)
    const currentAngle = this.getAngle(touch1, touch2)
    
    // 缩放
    if (this.isScaling && this.lastTouchDistance > 0) {
      const scaleDelta = currentDistance / this.lastTouchDistance
      const currentScale = this.selectedCharacter.scale.x
      const newScale = Math.max(0.5, Math.min(3, currentScale * scaleDelta))
      this.selectedCharacter.scale.setScalar(newScale)
      this.onCharacterScale?.(this.selectedCharacter, newScale)
    }
    
    // 旋转
    if (this.isRotating) {
      const angleDelta = currentAngle - this.lastTouchAngle
      this.selectedCharacter.rotation.y += angleDelta
      this.onCharacterRotate?.(this.selectedCharacter, this.selectedCharacter.rotation.y)
    }
    
    this.lastTouchDistance = currentDistance
    this.lastTouchAngle = currentAngle
    this.lastTouchCenter = this.getCenter(touch1, touch2)
  }

  // 处理触摸结束
  handleTouchEnd(event) {
    event.preventDefault()
    
    const changedTouches = event.changedTouches
    
    for (let i = 0; i < changedTouches.length; i++) {
      const touch = changedTouches[i]
      const touchData = this.touches.get(touch.identifier)
      
      if (touchData) {
        const duration = Date.now() - touchData.startTime
        const moveDistance = this.getDistance(touchData.startPos, touchData.currentPos)
        
        // 检测点击（短按且移动距离小）
        if (duration < 300 && moveDistance < 0.05 && !this.isDragging) {
          this.onTap?.(touchData.currentPos)
        }
        
        this.touches.delete(touch.identifier)
      }
    }
    
    // 重置状态
    if (event.touches.length === 0) {
      this.isDragging = false
      this.isScaling = false
      this.isRotating = false
      this.lastTouchDistance = 0
      
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer)
        this.longPressTimer = null
      }
      
      this.removeDragPlaneFromScene()
    }
  }

  // 鼠标事件处理（桌面端调试）
  handleMouseDown(event) {
    const mockTouch = {
      identifier: 'mouse',
      clientX: event.clientX,
      clientY: event.clientY
    }
    this.handleTouchStart({ 
      touches: [mockTouch], 
      preventDefault: () => {} 
    })
  }

  handleMouseMove(event) {
    const mockTouch = {
      identifier: 'mouse',
      clientX: event.clientX,
      clientY: event.clientY
    }
    this.handleTouchMove({ 
      touches: [mockTouch], 
      preventDefault: () => {} 
    })
  }

  handleMouseUp(event) {
    const mockTouch = {
      identifier: 'mouse',
      clientX: event.clientX,
      clientY: event.clientY
    }
    this.handleTouchEnd({ 
      changedTouches: [mockTouch],
      touches: [],
      preventDefault: () => {} 
    })
  }

  handleWheel(event) {
    if (!this.selectedCharacter) return
    
    event.preventDefault()
    const delta = event.deltaY > 0 ? 0.9 : 1.1
    const currentScale = this.selectedCharacter.scale.x
    const newScale = Math.max(0.5, Math.min(3, currentScale * delta))
    this.selectedCharacter.scale.setScalar(newScale)
    this.onCharacterScale?.(this.selectedCharacter, newScale)
  }

  // 添加拖拽平面到场景
  addDragPlaneToScene() {
    if (this.selectedCharacter && this.dragPlane && this.arManager.scene) {
      // 将拖拽平面放在角色脚下
      this.dragPlane.position.set(
        this.selectedCharacter.position.x,
        this.selectedCharacter.position.y,
        this.selectedCharacter.position.z
      )
      this.arManager.scene.add(this.dragPlane)
    }
  }

  // 从场景移除拖拽平面
  removeDragPlaneFromScene() {
    if (this.dragPlane && this.arManager.scene) {
      this.arManager.scene.remove(this.dragPlane)
    }
  }

  // 工具函数
  getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
  }

  getAngle(p1, p2) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x)
  }

  getCenter(p1, p2) {
    return new THREE.Vector2((p1.x + p2.x) / 2, (p1.y + p2.y) / 2)
  }

  // 销毁
  dispose() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
    }
    this.touches.clear()
    this.removeDragPlaneFromScene()
  }
}

export default ARGestureHandler
