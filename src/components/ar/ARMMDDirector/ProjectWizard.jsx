import React, { useState } from 'react'
import styles from './ProjectWizard.module.css'

const CANVAS_PRESETS = [
  { name: '16:9 横屏', width: 1920, height: 1080, ratio: '16:9' },
  { name: '9:16 竖屏', width: 1080, height: 1920, ratio: '9:16' },
  { name: '1:1 方形', width: 1080, height: 1080, ratio: '1:1' },
  { name: '4:3 传统', width: 1440, height: 1080, ratio: '4:3' },
  { name: '2:1 宽屏', width: 1920, height: 960, ratio: '2:1' }
]

const DURATION_PRESETS = [
  { name: '15秒', value: 15 },
  { name: '30秒', value: 30 },
  { name: '60秒', value: 60 },
  { name: '2分钟', value: 120 },
  { name: '5分钟', value: 300 }
]

export function ProjectWizard({ isOpen, onComplete, onCancel }) {
  const [step, setStep] = useState(1)
  const [projectName, setProjectName] = useState('')
  const [duration, setDuration] = useState(60)
  const [selectedPreset, setSelectedPreset] = useState(CANVAS_PRESETS[0])
  const [backgroundType, setBackgroundType] = useState('color')
  const [backgroundColor, setBackgroundColor] = useState('#1a1a2e')
  const [backgroundImage, setBackgroundImage] = useState(null)

  if (!isOpen) return null

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      // 完成
      onComplete({
        name: projectName || '新项目',
        duration,
        canvasSettings: {
          width: selectedPreset.width,
          height: selectedPreset.height,
          aspectRatio: selectedPreset.ratio,
          pixelRatio: 1
        },
        backgroundType,
        backgroundColor,
        backgroundImage
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
                        </div>
                      </div>
                      <div className={styles.presetInfo}>
                        <div className={styles.presetName}>{preset.name}</div>
                        <div className={styles.presetSize}>{preset.width}×{preset.height}</div>
                      </div>
                    </button>
                  ))}
                </div>
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
              <button className={styles.cancelBtn} onClick={onCancel}>
                取消
              </button>
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
