import re

# 读取文件
with open('src/components/ar/ARViewerNew.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 修改playAction方法签名（已修改，跳过）

# 2. 移除开头的停止动画代码（已修改，跳过）

# 3. 修改加载部分
old_loading = """      // 检查缓存
      if (this.actionCache.has(actionId)) {
        console.log('📦 Using cached clip')
        clip = this.actionCache.get(actionId)
      } else {
        // 异步加载
        console.log('📥 Loading action from:', action.filePath)
        const result = await loadVRMAction(action.filePath, this.currentCharacter)
        console.log('📥 Load result:', result)
        if (result && result.clip) {
          clip = result.clip
          this.setActionCache(actionId, clip)
          console.log('✅ Clip cached')
        } else {
          console.error('❌ No clip in load result')
        }
      }"""

new_loading = """      // 检查缓存
      if (this.actionCache.has(actionId)) {
        console.log('📦 Using cached clip')
        clip = this.actionCache.get(actionId)
      } else {
        // 异步加载
        console.log('📥 Loading action:', action.name)
        const loadStartTime = Date.now()
        const result = await loadVRMAction(action.filePath, this.currentCharacter)
        console.log(`📥 Loaded in ${Date.now() - loadStartTime}ms`)
        
        if (result && result.clip) {
          clip = result.clip
          this.setActionCache(actionId, clip)
          console.log('✅ Clip cached')
        } else {
          console.error('❌ Failed to load clip')
          return
        }
      }"""

content = content.replace(old_loading, new_loading)

# 4. 修改if (clip)部分
old_clip_section = """      if (clip) {
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
        
        // 设置动画权重为1（完全影响）
        this.currentAnimation.weight = 1
        
        // 根据播放模式设置循环
        if (loopMode) {
          this.currentAnimation.setLoop(THREE.LoopRepeat, Infinity)
          console.log('🔁 循环播放模式')
        } else {
          this.currentAnimation.setLoop(THREE.LoopOnce, 1)
          // 监听动画完成事件
          this.currentAnimation.clampWhenFinished = true
          console.log('▶️ 单次播放模式')
        }
        
        // 直接播放（不使用fadeIn，减少延迟）
        this.currentAnimation.play()
        
        console.log('✅ Playing action:', action.name)
        console.log('Animation root:', animationRoot.name || 'scene')
        console.log('Animation weight:', this.currentAnimation.weight)
        console.log('Animation time:', this.currentAnimation.time)
        console.log('Mixer time:', this.mixer.time)
      } else {
        console.error('❌ No clip to play')
      }"""

new_clip_section = """      if (clip) {
        console.log('▶️ Playing with smooth transition')
        
        // 使用缓存的动画根节点
        const animationRoot = this.cachedAnimationRoot || this.findAnimationRoot()
        
        // 创建新动画
        const newAction = this.mixer.clipAction(clip, animationRoot)
        
        // 设置循环模式
        if (loopMode) {
          newAction.setLoop(THREE.LoopRepeat, Infinity)
        } else {
          newAction.setLoop(THREE.LoopOnce, 1)
          newAction.clampWhenFinished = true
        }
        
        // 平滑过渡：旧动画淡出，新动画淡入
        if (this.currentAnimation && this.currentAnimation !== newAction) {
          this.currentAnimation.fadeOut(transitionDuration)
        }
        
        // 新动画从0权重淡入
        newAction
          .reset()
          .setEffectiveTimeScale(1)
          .setEffectiveWeight(0)
          .fadeIn(transitionDuration)
          .play()
        
        this.currentAnimation = newAction
        console.log('✅ Smooth transition started:', action.name)
      }"""

content = content.replace(old_clip_section, new_clip_section)

# 5. 添加findAnimationRoot方法（在end()方法之前）
find_animation_root_method = """
  // 查找并缓存动画根节点
  findAnimationRoot() {
    if (this.cachedAnimationRoot) {
      return this.cachedAnimationRoot
    }
    
    let animationRoot = this.currentCharacter.scene
    this.currentCharacter.scene.traverse((child) => {
      if (child.name === 'G1' || child.name === 'Root' || child.name === 'root' || child.name === 'Armature') {
        animationRoot = child
      }
    })
    
    this.cachedAnimationRoot = animationRoot
    console.log('🦴 Cached animation root:', animationRoot.name || 'scene')
    return animationRoot
  }

  async end() {"""

content = content.replace('\n  async end() {', find_animation_root_method)

# 6. 在constructor中添加cachedAnimationRoot
old_constructor = """    this.onGestureDetected = null // 手势检测回调
    this.onImageTracked = null // 图像追踪回调
  }"""

new_constructor = """    this.onGestureDetected = null // 手势检测回调
    this.onImageTracked = null // 图像追踪回调
    this.cachedAnimationRoot = null // 缓存动画根节点
  }"""

content = content.replace(old_constructor, new_constructor)

# 写入文件
with open('src/components/ar/ARViewerNew.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ AR优化完成！")
print("\n主要优化：")
print("1. 添加fadeIn/fadeOut平滑过渡（300ms）")
print("2. 缓存动画根节点，避免重复遍历")
print("3. 优化加载日志，显示加载时间")
print("4. 失败时提前return，避免后续错误")
