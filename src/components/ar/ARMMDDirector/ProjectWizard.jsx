import React, { useState, useEffect } from 'react'
import styles from './ProjectWizard.module.css'

const CANVAS_PRESETS = [
  { name: '16:9 横屏', width: 1920, height: 1080, ratio: '16:9' },
  { name: '9:16 竖屏', width: 1080, height: 1920, ratio: '9:16' },
  { name: '1:1 方形', width: 1080, height: 1080, ratio: '1:1' },
  { name: '4:3 传统', width: 1440, height: 1080, ratio: '4:3' },
  { name: '2:1 宽屏', width: 1920, height: 960, ratio: '2:1' },
  { name: '自定义', width: 1920, height: 1080, ratio: 'custom' }
]

const DURATION_PRESETS = [
  { name: '15秒', value: 15 },
  { name: '30秒', value: 30 },
  { name: '60秒', value: 60 },
  { name: '2分钟', value: 120 },
  { name: '5分钟', value: 300 }
]

// 模拟AR背景列表
const AR_BACKGROUNDS = [
  { id: 'ar_1', name: '客厅场景', thumbnail: '🏠', type: 'ar', date: '2024-01-15' },
  { id: 'ar_2', name: '办公室', thumbnail: '🏢', type: 'ar', date: '2024-01-14' },
  { id: 'ar_3', name: '户外公园', thumbnail: '🌳', type: 'ar', date: '2024-01-13' },
  { id: 'ar_4', name: '会议室', thumbnail: '📊', type: 'ar', date: '2024-01-12' }
]

export function ProjectWizard({ isOpen, onComplete, onCancel, onImport, onOpenARRecorder, onOpenSceneManager }) {
  const [step, setStep] = useState(1)
  const [projectName, setProjectName] = useState('')
  const [duration, setDuration] = useState(60)
  const [selectedPreset, setSelectedPreset] = useState(CANVAS_PRESETS[0])
  const [customWidth, setCustomWidth] = useState(1920)
  const [customHeight, setCustomHeight] = useState(1080)
  const [backgroundType, setBackgroundType] = useState('color')
  const [backgroundColor, setBackgroundColor] = useState('#1a1a2e')
  const [backgroundImage, setBackgroundImage] = useState(null)
  const [selectedARBackground, setSelectedARBackground] = useState(null)
  const [showARRecorder, setShowARRecorder] = useState(false)

  if (!isOpen) return null

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      // 完成 - 使用自定义尺寸或预设尺寸
      const isCustom = selectedPreset.ratio === 'custom'
      const finalWidth = isCustom ? customWidth : selectedPreset.width
      const finalHeight = isCustom ? customHeight : selectedPreset.height
      
      onComplete({
        name: projectName || '新项目',
        duration,
        canvasSettings: {
          width: finalWidth,
          height: finalHeight,
          aspectRatio: isCustom ? `${customWidth}:${customHeight}` : selectedPreset.ratio,
          pixelRatio: 1
        },
        backgroundType,
        backgroundColor,
        backgroundImage,
        arBackground: selectedARBackground
      })
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setBackgroundImage(event.target.result)
        setBackgroundType('image')
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>🎬 创建新项目</h2>
          <div className={styles.steps}>
            <div className={`${styles.step} ${step >= 1 ? styles.active : ''}`}>
              <span className={styles.stepNumber}>1</span>
              <span className={styles.stepLabel}>基本信息</span>
            </div>
            <div className={styles.stepLine} />
            <div className={`${styles.step} ${step >= 2 ? styles.active : ''}`}>
              <span className={styles.stepNumber}>2</span>
              <span className={styles.stepLabel}>画布设置</span>
            </div>
            <div className={styles.stepLine} />
            <div className={`${styles.step} ${step >= 3 ? styles.active : ''}`}>
              <span className={styles.stepNumber}>3</span>
              <span className={styles.stepLabel}>背景设置</span>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          {step === 1 && (
            <div className={styles.stepContent}>
              <div className={styles.formGroup}>
                <label>项目名称</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="输入项目名称"
                  className={styles.input}
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label>项目时长</label>
                <div className={styles.durationGrid}>
                  {DURATION_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      className={`${styles.durationBtn} ${duration === preset.value ? styles.active : ''}`}
                      onClick={() => setDuration(preset.value)}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
                <div className={styles.customDuration}>
                  <span>自定义：</span>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                    className={styles.numberInput}
                    min={1}
                    max={600}
                  />
                  <span>秒</span>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className={styles.stepContent}>
              <div className={styles.formGroup}>
                <label>画布尺寸</label>
                <div className={styles.presetGrid}>
                  {CANVAS_PRESETS.map((preset) => (
                    <button
                      key={preset.ratio}
                      className={`${styles.presetBtn} ${selectedPreset.ratio === preset.ratio ? styles.active : ''}`}
                      onClick={() => setSelectedPreset(preset)}
                    >
                      <div className={styles.presetPreview} style={{ aspectRatio: preset.width / preset.height }}>
                        <div className={styles.presetIcon}>
                          {preset.ratio === '16:9' && '🖥️'}
                          {preset.ratio === '9:16' && '📱'}
                          {preset.ratio === '1:1' && '⬜'}
                          {preset.ratio === '4:3' && '📺'}
                          {preset.ratio === '2:1' && '🎬'}
                          {preset.ratio === 'custom' && '⚙️'}
                        </div>
                      </div>
                      <div className={styles.presetInfo}>
                        <div className={styles.presetName}>{preset.name}</div>
                        <div className={styles.presetSize}>
                          {preset.ratio === 'custom' ? '自定义' : `${preset.width}×${preset.height}`}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                
                {/* 自定义尺寸输入 */}
                {selectedPreset.ratio === 'custom' && (
                  <div className={styles.customSizeInputs}>
                    <div className={styles.sizeInputGroup}>
                      <label>宽度</label>
                      <input
                        type="number"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(parseInt(e.target.value) || 1920)}
                        className={styles.sizeInput}
                        min={100}
                        max={7680}
                      />
                    </div>
                    <span className={styles.sizeSeparator}>×</span>
                    <div className={styles.sizeInputGroup}>
                      <label>高度</label>
                      <input
                        type="number"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(parseInt(e.target.value) || 1080)}
                        className={styles.sizeInput}
                        min={100}
                        max={4320}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className={styles.stepContent}>
              <div className={styles.formGroup}>
                <label>背景类型</label>
                <div className={styles.backgroundTypeGrid}>
                  <button
                    className={`${styles.typeBtn} ${backgroundType === 'color' ? styles.active : ''}`}
                    onClick={() => setBackgroundType('color')}
                  >
                    🎨 纯色背景
                  </button>
                  <button
                    className={`${styles.typeBtn} ${backgroundType === 'image' ? styles.active : ''}`}
                    onClick={() => setBackgroundType('image')}
                  >
                    🖼️ 图片背景
                  </button>
                  <button
                    className={`${styles.typeBtn} ${backgroundType === 'ar' ? styles.active : ''}`}
                    onClick={() => setBackgroundType('ar')}
                  >
                    📹 AR背景
                  </button>
                  <button
                    className={`${styles.typeBtn} ${backgroundType === 'transparent' ? styles.active : ''}`}
                    onClick={() => setBackgroundType('transparent')}
                  >
                    🔲 透明背景
                  </button>
                </div>
              </div>

              {backgroundType === 'color' && (
                <div className={styles.formGroup}>
                  <label>背景颜色</label>
                  <div className={styles.colorPicker}>
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className={styles.colorInput}
                    />
                    <input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className={styles.colorText}
                    />
                  </div>
                  <div className={styles.colorPresets}>
                    {['#1a1a2e', '#0a0a0f', '#1e3a5f', '#2d1b4e', '#0d3328', '#3d1f1f'].map((color) => (
                      <button
                        key={color}
                        className={styles.colorPreset}
                        style={{ backgroundColor: color }}
                        onClick={() => setBackgroundColor(color)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {backgroundType === 'image' && (
                <div className={styles.formGroup}>
                  <label>背景图片</label>
                  <div className={styles.imageUpload}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      id="bg-image-upload"
                      className={styles.fileInput}
                    />
                    <label htmlFor="bg-image-upload" className={styles.uploadBtn}>
                      {backgroundImage ? '🖼️ 更换图片' : '📁 选择图片'}
                    </label>
                    {backgroundImage && (
                      <div className={styles.imagePreview}>
                        <img src={backgroundImage} alt="背景预览" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {backgroundType === 'ar' && (
                <div className={styles.formGroup}>
                  <label>AR背景设置</label>
                  
                  {/* AR操作按钮 */}
                  <div className={styles.arActions}>
                    <label className={styles.arActionBtn}>
                      📁 导入AR场景
                      <input
                        type="file"
                        accept=".arpack,.arscene,.arscene2,.webxrar"
                        onChange={async (e) => {
                          const file = e.target.files[0]
                          if (file) {
                            // 动态导入ARSceneIO
                            const { importARScenePack } = await import('./ARSceneIO')
                            try {
                              const scene = await importARScenePack(file)
                              console.log('导入AR场景成功:', scene)
                              // 设置导入的场景为选中
                              setSelectedARBackground({
                                id: scene.id,
                                name: scene.name,
                                type: scene.type,
                                thumbnail: scene.data?.image || scene.arBackground?.image,
                                date: new Date().toISOString().split('T')[0],
                                ...scene
                              })
                              
                              // 如果是WebXR场景，显示提示
                              if (scene.type === 'webxr-ar') {
                                alert('WebXR场景已导入！播放时将使用真实AR模式。')
                              }
                            } catch (err) {
                              console.error('导入失败:', err)
                              alert('导入AR场景失败: ' + err.message)
                            }
                          }
                          e.target.value = ''
                        }}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <button 
                      className={styles.arActionBtn}
                      onClick={() => onOpenARRecorder && onOpenARRecorder()}
                    >
                      📹 拍摄AR场景
                    </button>
                    <button 
                      className={styles.arActionBtn}
                      onClick={() => onOpenSceneManager && onOpenSceneManager()}
                    >
                      🗺️ 选择AR场景
                    </button>
                  </div>

                  {/* AR背景列表 */}
                  <div className={styles.arBackgroundList}>
                    <div className={styles.listHeader}>
                      <span>可用AR背景</span>
                      <span className={styles.listCount}>{AR_BACKGROUNDS.length} 个</span>
                    </div>
                    <div className={styles.arList}>
                      {AR_BACKGROUNDS.map((arBg) => (
                        <div
                          key={arBg.id}
                          className={`${styles.arItem} ${selectedARBackground?.id === arBg.id ? styles.selected : ''}`}
                          onClick={() => setSelectedARBackground(arBg)}
                        >
                          <div className={styles.arThumbnail}>{arBg.thumbnail}</div>
                          <div className={styles.arInfo}>
                            <div className={styles.arName}>{arBg.name}</div>
                            <div className={styles.arDate}>{arBg.date}</div>
                          </div>
                          {selectedARBackground?.id === arBg.id && (
                            <div className={styles.arSelected}>✓</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.buttons}>
            {step > 1 ? (
              <button className={styles.backBtn} onClick={handleBack}>
                ← 上一步
              </button>
            ) : (
              <div className={styles.leftButtons}>
                <button className={styles.cancelBtn} onClick={onCancel}>
                  取消
                </button>
                <button 
                  className={styles.importBtn} 
                  onClick={() => document.getElementById('project-import').click()}
                >
                  📁 导入项目
                </button>
                <input
                  type="file"
                  id="project-import"
                  accept=".ard"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files[0]
                    if (file && onImport) {
                      onImport(file)
                    }
                    e.target.value = ''
                  }}
                />
              </div>
            )}
            <button className={styles.nextBtn} onClick={handleNext}>
              {step === 3 ? '✓ 创建项目' : '下一步 →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
