// 移动端适配工具

// 检测设备类型
export const detectDevice = () => {
  const ua = navigator.userAgent
  const width = window.innerWidth
  
  return {
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || width < 768,
    isTablet: /iPad|Android(?!.*Mobile)/i.test(ua) || (width >= 768 && width < 1024),
    isDesktop: width >= 1024,
    isIOS: /iPad|iPhone|iPod/.test(ua),
    isAndroid: /Android/.test(ua),
    isWeChat: /MicroMessenger/.test(ua)
  }
}

// 视口适配
export const setupViewport = () => {
  const meta = document.querySelector('meta[name="viewport"]')
  if (!meta) {
    const newMeta = document.createElement('meta')
    newMeta.name = 'viewport'
    newMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
    document.head.appendChild(newMeta)
  } else {
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
  }
}

// 禁止双击缩放
export const preventDoubleTapZoom = () => {
  let lastTouchEnd = 0
  document.addEventListener('touchend', (e) => {
    const now = Date.now()
    if (now - lastTouchEnd <= 300) {
      e.preventDefault()
    }
    lastTouchEnd = now
  }, { passive: false })
}

// 禁止橡皮筋效果（iOS）
export const preventBounce = () => {
  document.body.addEventListener('touchmove', (e) => {
    if (e.target === document.body) {
      e.preventDefault()
    }
  }, { passive: false })
}

// 适配刘海屏
export const adaptNotch = () => {
  const style = document.createElement('style')
  style.textContent = `
    .safe-area-top {
      padding-top: env(safe-area-inset-top);
    }
    .safe-area-bottom {
      padding-bottom: env(safe-area-inset-bottom);
    }
    .safe-area-left {
      padding-left: env(safe-area-inset-left);
    }
    .safe-area-right {
      padding-right: env(safe-area-inset-right);
    }
  `
  document.head.appendChild(style)
}

// 屏幕方向锁定
export const lockOrientation = async (orientation = 'portrait') => {
  if (screen.orientation && screen.orientation.lock) {
    try {
      await screen.orientation.lock(orientation)
      return true
    } catch (e) {
      console.warn('屏幕方向锁定失败:', e)
      return false
    }
  }
  return false
}

// 全屏模式
export const requestFullscreen = async () => {
  const element = document.documentElement
  
  if (element.requestFullscreen) {
    await element.requestFullscreen()
  } else if (element.webkitRequestFullscreen) {
    await element.webkitRequestFullscreen()
  } else if (element.mozRequestFullScreen) {
    await element.mozRequestFullScreen()
  } else if (element.msRequestFullscreen) {
    await element.msRequestFullscreen()
  }
}

// 退出全屏
export const exitFullscreen = async () => {
  if (document.exitFullscreen) {
    await document.exitFullscreen()
  } else if (document.webkitExitFullscreen) {
    await document.webkitExitFullscreen()
  } else if (document.mozCancelFullScreen) {
    await document.mozCancelFullScreen()
  } else if (document.msExitFullscreen) {
    await document.msExitFullscreen()
  }
}

// 震动反馈
export const vibrate = (pattern = 50) => {
  if (navigator.vibrate) {
    navigator.vibrate(pattern)
  }
}

// 获取电池信息
export const getBatteryInfo = async () => {
  if ('getBattery' in navigator) {
    try {
      const battery = await navigator.getBattery()
      return {
        level: battery.level * 100,
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime
      }
    } catch (e) {
      console.warn('获取电池信息失败:', e)
      return null
    }
  }
  return null
}

// 网络状态
export const getNetworkStatus = () => {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  
  return {
    online: navigator.onLine,
    type: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || 0,
    rtt: connection?.rtt || 0
  }
}

// 性能监控
export const monitorPerformance = () => {
  const perfData = {
    // 页面加载时间
    loadTime: performance.timing?.loadEventEnd - performance.timing?.navigationStart,
    // DOM 准备时间
    domReady: performance.timing?.domContentLoadedEventEnd - performance.timing?.navigationStart,
    // 首次绘制
    firstPaint: 0,
    // 首次内容绘制
    firstContentfulPaint: 0
  }
  
  // 获取 Paint 时间
  const paintEntries = performance.getEntriesByType('paint')
  paintEntries.forEach(entry => {
    if (entry.name === 'first-paint') {
      perfData.firstPaint = entry.startTime
    }
    if (entry.name === 'first-contentful-paint') {
      perfData.firstContentfulPaint = entry.startTime
    }
  })
  
  return perfData
}

// 触摸优化
export const optimizeTouch = () => {
  // 禁用默认的触摸行为
  document.addEventListener('touchstart', () => {}, { passive: true })
  
  // 优化点击延迟
  const style = document.createElement('style')
  style.textContent = `
    * {
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
  `
  document.head.appendChild(style)
}

// 软键盘处理
export const handleKeyboard = () => {
  const originalHeight = window.innerHeight
  
  window.addEventListener('resize', () => {
    const currentHeight = window.innerHeight
    const isKeyboardOpen = currentHeight < originalHeight * 0.8
    
    if (isKeyboardOpen) {
      document.body.classList.add('keyboard-open')
    } else {
      document.body.classList.remove('keyboard-open')
    }
  })
}

// 初始化所有移动端适配
export const initMobileAdapter = () => {
  setupViewport()
  preventDoubleTapZoom()
  preventBounce()
  adaptNotch()
  optimizeTouch()
  handleKeyboard()
  
  // 添加设备类型标记
  const device = detectDevice()
  const classes = [
    device.isMobile ? 'mobile' : 'desktop'
  ]
  if (device.isTablet) classes.push('tablet')
  if (device.isIOS) classes.push('ios')
  if (device.isAndroid) classes.push('android')
  
  document.body.classList.add(...classes)
  
  return device
}

// 响应式断点
export const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400
}

// 监听屏幕尺寸变化
export const watchScreenSize = (callback) => {
  const handleResize = () => {
    const width = window.innerWidth
    let size = 'xs'
    
    if (width >= breakpoints.xxl) size = 'xxl'
    else if (width >= breakpoints.xl) size = 'xl'
    else if (width >= breakpoints.lg) size = 'lg'
    else if (width >= breakpoints.md) size = 'md'
    else if (width >= breakpoints.sm) size = 'sm'
    
    callback({
      width,
      height: window.innerHeight,
      size,
      isPortrait: width < window.innerHeight,
      devicePixelRatio: window.devicePixelRatio
    })
  }
  
  window.addEventListener('resize', handleResize)
  handleResize() // 立即执行一次
  
  return () => window.removeEventListener('resize', handleResize)
}

export default {
  detectDevice,
  setupViewport,
  preventDoubleTapZoom,
  preventBounce,
  adaptNotch,
  lockOrientation,
  requestFullscreen,
  exitFullscreen,
  vibrate,
  getBatteryInfo,
  getNetworkStatus,
  monitorPerformance,
  optimizeTouch,
  handleKeyboard,
  initMobileAdapter,
  breakpoints,
  watchScreenSize
}
