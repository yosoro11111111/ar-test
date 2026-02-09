/**
 * RenderEngine - 渲染引擎
 * 负责Three.js渲染、预览、导出
 */
export class RenderEngine {
  constructor() {
    this.scene = null
    this.camera = null
    this.renderer = null
    this.canvas = null
  }

  // 初始化渲染器
  init(canvas) {
    this.canvas = canvas
    // 这里初始化Three.js场景
    return true
  }

  // 渲染一帧
  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera)
    }
  }

  // 调整大小
  resize(width, height) {
    if (this.camera && this.renderer) {
      this.camera.aspect = width / height
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(width, height)
    }
  }

  // 导出帧
  exportFrame() {
    if (this.renderer) {
      return this.renderer.domElement.toDataURL('image/png')
    }
    return null
  }
}
