import React, { useState, useRef, useCallback } from 'react'
import './ShareCardGenerator.css'

// 通知组件
const Notification = ({ message, type = 'info', onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const colors = {
    info: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    success: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    warning: 'linear-gradient(135deg, #ffd93d 0%, #ffb347 100%)',
    error: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)'
  }

  return (
    <div style={{
      position: 'fixed',
      top: '90px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '14px 28px',
      background: colors[type],
      borderRadius: '16px',
      color: 'white',
      fontWeight: '600',
      fontSize: '15px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      zIndex: 9999,
      animation: 'slideDown 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }}>
      <span>{type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
      <span>{message}</span>
    </div>
  )
}

// 分享卡片生成器
const ShareCardGenerator = ({ isOpen, onClose, canvasRef, characters, currentAction, isMobile }) => {
  const [cardStyle, setCardStyle] = useState('default')
  const [cardTitle, setCardTitle] = useState('我的AR拍照')
  const [cardSubtitle, setCardSubtitle] = useState('Created with AR Camera')
  const [cardLines, setCardLines] = useState(['', '']) // 多行文字，初始2行
  const [showQRCode, setShowQRCode] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [notification, setNotification] = useState(null)
  const canvasRef2 = useRef(null)

  // 显示通知
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }, [])

  // 卡片样式预设
  const cardStyles = [
    { id: 'default', name: '默认', icon: '🎨', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 'minimal', name: '极简', icon: '⬜', bg: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', textColor: '#333' },
    { id: 'dark', name: '暗黑', icon: '⬛', bg: 'linear-gradient(135deg, #232526 0%, #414345 100%)' },
    { id: 'sunset', name: '日落', icon: '🌅', bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { id: 'ocean', name: '海洋', icon: '🌊', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { id: 'forest', name: '森林', icon: '🌲', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { id: 'sakura', name: '樱花', icon: '🌸', bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
    { id: 'cyber', name: '赛博', icon: '👾', bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }
  ]

  // 生成分享卡片
  const generateCard = useCallback(async () => {
    setIsGenerating(true)
    
    try {
      // 获取3D画布
      const canvas3D = canvasRef?.current?.domElement || document.querySelector('canvas[data-engine]')
      if (!canvas3D) {
        throw new Error('3D画布未找到')
      }

      // 创建卡片画布
      const cardCanvas = document.createElement('canvas')
      const ctx = cardCanvas.getContext('2d')
      
      // 设置卡片尺寸 (1080x1920 - 适合手机分享)
      const width = 1080
      const height = 1920
      cardCanvas.width = width
      cardCanvas.height = height

      const style = cardStyles.find(s => s.id === cardStyle)
      const textColor = style?.textColor || '#ffffff'

      // 绘制背景
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      if (style?.bg) {
        // 解析渐变
        const bg = style.bg
        if (bg.includes('gradient')) {
          gradient.addColorStop(0, '#667eea')
          gradient.addColorStop(1, '#764ba2')
          ctx.fillStyle = gradient
        } else {
          ctx.fillStyle = bg
        }
      } else {
        ctx.fillStyle = '#1a1a2e'
      }
      ctx.fillRect(0, 0, width, height)

      // 绘制3D场景（居中）- 保持原始比例
      const sceneSize = Math.min(width, height * 0.6)
      const sceneX = (width - sceneSize) / 2
      const sceneY = height * 0.15
      
      // 计算保持比例的绘制尺寸
      const canvas3DAspect = canvas3D.width / canvas3D.height
      let drawWidth, drawHeight, offsetX, offsetY
      
      if (canvas3DAspect > 1) {
        // 3D画布更宽
        drawWidth = sceneSize
        drawHeight = sceneSize / canvas3DAspect
        offsetX = sceneX
        offsetY = sceneY + (sceneSize - drawHeight) / 2
      } else {
        // 3D画布更高
        drawHeight = sceneSize
        drawWidth = sceneSize * canvas3DAspect
        offsetX = sceneX + (sceneSize - drawWidth) / 2
        offsetY = sceneY
      }
      
      // 添加圆角矩形裁剪
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(sceneX, sceneY, sceneSize, sceneSize, 30)
      ctx.clip()
      
      // 绘制背景色（填充空白区域）
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(sceneX, sceneY, sceneSize, sceneSize)
      
      // 绘制3D场景，保持比例
      ctx.drawImage(canvas3D, offsetX, offsetY, drawWidth, drawHeight)
      ctx.restore()

      // 添加装饰边框
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.roundRect(sceneX - 8, sceneY - 8, sceneSize + 16, sceneSize + 16, 38)
      ctx.stroke()

      // 绘制标题
      ctx.fillStyle = textColor
      ctx.font = 'bold 72px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = 10
      ctx.fillText(cardTitle, width / 2, sceneY + sceneSize + 100)

      // 绘制副标题
      ctx.font = '36px Arial, sans-serif'
      ctx.fillStyle = textColor === '#ffffff' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)'
      ctx.fillText(cardSubtitle, width / 2, sceneY + sceneSize + 160)

      // 绘制多行内容
      let currentY = sceneY + sceneSize + 210
      const lineHeight = 45
      const validLines = cardLines.filter(line => line.trim() !== '')
      
      if (validLines.length > 0) {
        ctx.font = '32px Arial, sans-serif'
        ctx.fillStyle = textColor === '#ffffff' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)'
        
        validLines.forEach((line) => {
          ctx.fillText(line, width / 2, currentY)
          currentY += lineHeight
        })
      }

      // 绘制角色信息
      if (characters && characters.length > 0) {
        const activeCharacters = characters.filter(c => c)
        if (activeCharacters.length > 0) {
          ctx.font = '28px Arial, sans-serif'
          ctx.fillStyle = textColor === '#ffffff' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)'
          const charNames = activeCharacters.map(c => c.name).join(' · ')
          ctx.fillText(`角色: ${charNames}`, width / 2, currentY + 20)
          currentY += 50
        }
      }

      // 绘制动作信息
      if (currentAction) {
        ctx.font = '24px Arial, sans-serif'
        ctx.fillStyle = textColor === '#ffffff' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.2)'
        ctx.fillText(`动作: ${currentAction}`, width / 2, currentY + 20)
      }

      // 绘制底部信息
      const bottomY = height - 150
      
      // 分隔线
      ctx.strokeStyle = textColor === '#ffffff' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(100, bottomY - 50)
      ctx.lineTo(width - 100, bottomY - 50)
      ctx.stroke()

      // App 名称
      ctx.font = 'bold 40px Arial, sans-serif'
      ctx.fillStyle = textColor
      ctx.fillText('🎭 AR Character', width / 2, bottomY)

      // 日期
      ctx.font = '24px Arial, sans-serif'
      ctx.fillStyle = textColor === '#ffffff' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)'
      ctx.fillText(new Date().toLocaleDateString('zh-CN'), width / 2, bottomY + 40)

      // 生成预览图
      const dataUrl = cardCanvas.toDataURL('image/png', 0.9)
      setPreviewUrl(dataUrl)
      
      showNotification('分享卡片生成成功！', 'success')
    } catch (error) {
      console.error('生成卡片失败:', error)
      showNotification('生成卡片失败: ' + error.message, 'error')
    } finally {
      setIsGenerating(false)
    }
  }, [canvasRef, cardStyle, cardTitle, cardSubtitle, cardLines, characters, currentAction])

  // 下载卡片
  const downloadCard = useCallback(() => {
    if (!previewUrl) return
    
    const a = document.createElement('a')
    a.href = previewUrl
    a.download = `ar-share-card-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    showNotification('卡片已下载！', 'success')
  }, [previewUrl])

  // 复制到剪贴板
  const copyToClipboard = useCallback(async () => {
    if (!previewUrl) return
    
    try {
      const response = await fetch(previewUrl)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      showNotification('卡片已复制到剪贴板！', 'success')
    } catch (error) {
      showNotification('复制失败，请手动下载', 'error')
    }
  }, [previewUrl])

  if (!isOpen) return null

  return (
    <>
      {/* 通知 */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <div className="share-card-overlay" onClick={onClose}>
      <div className={`share-card-panel ${isMobile ? 'mobile' : ''}`} onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="share-card-header">
          <h3>🎨 分享卡片生成器</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* 样式选择 */}
        <div className="style-section">
          <h4>选择卡片样式</h4>
          <div className="style-grid">
            {cardStyles.map(style => (
              <button
                key={style.id}
                className={`style-btn ${cardStyle === style.id ? 'active' : ''}`}
                onClick={() => setCardStyle(style.id)}
                style={{ background: style.bg }}
              >
                <span className="style-icon">{style.icon}</span>
                <span className="style-name">{style.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 文字编辑 - 多行支持 */}
        <div className="text-section">
          <h4>编辑卡片文字</h4>
          <input
            type="text"
            value={cardTitle}
            onChange={(e) => setCardTitle(e.target.value)}
            placeholder="卡片标题"
            className="text-input"
          />
          <input
            type="text"
            value={cardSubtitle}
            onChange={(e) => setCardSubtitle(e.target.value)}
            placeholder="副标题"
            className="text-input"
          />
          
          {/* 多行文字输入 */}
          <div className="multi-line-section">
            <h5>卡片内容（最多5行）</h5>
            {cardLines.map((line, index) => (
              <input
                key={index}
                type="text"
                value={line}
                onChange={(e) => {
                  const newLines = [...cardLines]
                  newLines[index] = e.target.value
                  setCardLines(newLines)
                }}
                placeholder={`第${index + 1}行`}
                className="text-input line-input"
              />
            ))}
            
            {/* 添加/删除行按钮 */}
            <div className="line-controls">
              {cardLines.length < 5 && (
                <button
                  className="add-line-btn"
                  onClick={() => setCardLines([...cardLines, ''])}
                >
                  ➕ 添加一行
                </button>
              )}
              {cardLines.length > 2 && (
                <button
                  className="remove-line-btn"
                  onClick={() => setCardLines(cardLines.slice(0, -1))}
                >
                  ➖ 删除一行
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 选项 */}
        <div className="options-section">
          <label className="option-label">
            <input
              type="checkbox"
              checked={showQRCode}
              onChange={(e) => setShowQRCode(e.target.checked)}
            />
            <span>显示二维码</span>
          </label>
        </div>

        {/* 生成按钮 */}
        <button
          className="generate-btn"
          onClick={generateCard}
          disabled={isGenerating}
        >
          {isGenerating ? '⏳ 生成中...' : '✨ 生成卡片'}
        </button>

        {/* 预览 */}
        {previewUrl && (
          <div className="preview-section">
            <h4>预览</h4>
            <div className="preview-container">
              <img src={previewUrl} alt="分享卡片预览" className="preview-image" />
            </div>
            <div className="action-buttons">
              <button className="download-btn" onClick={downloadCard}>
                💾 下载卡片
              </button>
              <button className="copy-btn" onClick={copyToClipboard}>
                📋 复制到剪贴板
              </button>
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <div className="help-section">
          <h4>💡 使用说明</h4>
          <ul>
            <li>选择喜欢的卡片样式</li>
            <li>编辑标题和副标题</li>
            <li>点击生成卡片</li>
            <li>下载或复制分享</li>
          </ul>
        </div>
      </div>
    </div>
    </>
  )
}

export default ShareCardGenerator
