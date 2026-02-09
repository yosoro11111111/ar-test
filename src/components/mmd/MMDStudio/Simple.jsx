import React, { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'

// 内联样式
const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    background: '#0a0a0f',
    color: '#e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    position: 'relative',
    zIndex: 1
  },
  header: {
    display: 'flex !important',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    background: '#e94560 !important',
    borderBottom: '1px solid #2a2a35',
    flexShrink: 0,
    height: '50px',
    visibility: 'visible !important',
    opacity: '1 !important'
  },
  logo: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff'
  },
  workspace: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    gap: '12px',
    padding: '12px',
    paddingTop: 0
  },
  leftPanel: {
    width: '200px',
    background: '#15151a',
    borderRadius: '12px',
    border: '1px solid #2a2a35',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#1e1e26',
    borderBottom: '1px solid #2a2a35',
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff'
  },
  mainArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minWidth: 0
  },
  previewArea: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#15151a',
    borderRadius: '12px',
    border: '1px solid #2a2a35',
    padding: '16px',
    minHeight: 0
  },
  previewContainer: {
    width: '100%',
    height: '100%',
    background: '#0a0a0f',
    borderRadius: '8px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: '#1e1e26',
    borderBottom: '1px solid #2a2a35',
    fontSize: '12px',
    color: '#888'
  },
  previewCanvas: {
    flex: 1,
    width: '100%',
    height: '100%',
    background: '#000',
    display: 'block',
    position: 'relative !important',
    top: 'auto !important',
    left: 'auto !important'
  },
  timelineArea: {
    height: '280px',
    minHeight: '280px',
    background: '#15151a',
    borderRadius: '12px',
    border: '1px solid #2a2a35',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  timelineToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    background: '#1e1e26',
    borderBottom: '1px solid #2a2a35'
  },
  rightPanel: {
    width: '220px',
    background: '#15151a',
    borderRadius: '12px',
    border: '1px solid #2a2a35',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  button: {
    padding: '8px 16px',
    background: '#667eea',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px'
  }
}

export function Simple() {
  console.log('Simple组件已加载！')
  const canvasRef = useRef(null)
  const [characters, setCharacters] = useState([])
  
  useEffect(() => {
    console.log('Three.js初始化开始')
    if (!canvasRef.current) {
      console.log('canvas不存在')
      return
    }
    
    const canvas = canvasRef.current
    const container = canvas.parentElement
    
    // 延迟初始化，确保容器已渲染
    const initThreeJS = () => {
      const rect = container.getBoundingClientRect()
      console.log('canvas容器尺寸:', rect.width, rect.height)
      
      if (rect.width === 0 || rect.height === 0) {
        console.log('容器尺寸为0，延迟重试')
        setTimeout(initThreeJS, 100)
        return
      }
      
      try {
        // 设置canvas实际尺寸
        canvas.width = rect.width
        canvas.height = rect.height
        
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x0a0a0f)
        
        const camera = new THREE.PerspectiveCamera(50, rect.width / rect.height, 0.1, 1000)
        camera.position.set(0, 1.5, 5)
        camera.lookAt(0, 0, 0)
        
        const renderer = new THREE.WebGLRenderer({
          canvas: canvas,
          antialias: true,
          alpha: false
        })
        renderer.setSize(rect.width, rect.height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        
        // 强制重置canvas样式
        canvas.style.position = 'relative'
        canvas.style.top = 'auto'
        canvas.style.left = 'auto'
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
        scene.add(ambientLight)
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
        directionalLight.position.set(5, 10, 7)
        scene.add(directionalLight)
        
        const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
        scene.add(gridHelper)
        
        const animate = () => {
          requestAnimationFrame(animate)
          renderer.render(scene, camera)
        }
        animate()
        
        console.log('Three.js初始化完成')
      } catch (error) {
        console.error('Three.js初始化失败:', error)
      }
    }
    
    // 使用setTimeout延迟初始化
    setTimeout(initThreeJS, 100)
  }, [])
  
  const addCharacter = () => {
    setCharacters([...characters, {
      id: Date.now(),
      name: `角色 ${characters.length + 1}`
    }])
  }
  
  return (
    <div style={styles.container}>
      {/* 顶部 */}
      <header style={styles.header}>
        <span style={styles.logo}>🎬 MMD Studio</span>
        <button style={styles.button} onClick={addCharacter}>添加角色</button>
      </header>
      
      {/* 主区域 */}
      <div style={styles.workspace}>
        {/* 左侧 */}
        <div style={styles.leftPanel}>
          <div style={styles.panelHeader}>
            <span>角色</span>
            <span>{characters.length}</span>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
            {characters.map(char => (
              <div key={char.id} style={{
                padding: '10px',
                background: '#1e1e26',
                borderRadius: '8px',
                marginBottom: '8px'
              }}>
                👤 {char.name}
              </div>
            ))}
          </div>
        </div>
        
        {/* 中央 */}
        <div style={styles.mainArea}>
          {/* 预览 */}
          <div style={styles.previewArea}>
            <div style={styles.previewContainer}>
              <div style={styles.previewHeader}>
                <span>预览</span>
                <span>1920 × 1080</span>
              </div>
              <canvas ref={canvasRef} style={styles.previewCanvas} />
            </div>
          </div>
          
          {/* 时间轴 */}
          <div style={styles.timelineArea}>
            <div style={styles.timelineToolbar}>
              <span>时间轴</span>
              <button style={styles.button}>播放</button>
            </div>
            <div style={{ flex: 1, padding: '20px', color: '#666' }}>
              {characters.length === 0 ? '添加角色后开始编辑' : '时间轴内容'}
            </div>
          </div>
        </div>
        
        {/* 右侧 */}
        <div style={styles.rightPanel}>
          <div style={styles.panelHeader}>属性</div>
          <div style={{ flex: 1, padding: '20px', color: '#666' }}>
            选择角色查看属性
          </div>
        </div>
      </div>
    </div>
  )
}
