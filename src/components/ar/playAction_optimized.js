// 优化后的playAction方法 - 将此代码替换ARViewerNew.jsx中的playAction方法

async playAction(actionId, actionsList, loopMode = true, transitionDuration = 0.3) {
  console.log('🎬 playAction called:', actionId, 'loopMode:', loopMode, 'transition:', transitionDuration)
  
  if (!this.mixer) {
    console.error('❌ Mixer not initialized')
    return
  }
  if (!this.currentCharacter) {
    console.error('❌ Character not loaded')
    return
  }

  try {
    const action = actionsList.find(a => a.id === actionId)
    if (!action) {
      console.error('❌ Action not found:', actionId)
      return
    }
    console.log('🎯 Found action:', action.name)

    let clip
    
    // 检查缓存
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
    }
    
    if (clip) {
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
    }
  } catch (error) {
    console.error('❌ playAction failed:', error)
  }
}

// 添加此方法到ARSceneManager类中
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
