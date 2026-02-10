import React, { useState, useEffect } from 'react'
import styles from './LightingSettingsModal.module.css'

const TONE_MAPPING_MODES = [
  { id: 'None', name: '无' },
  { id: 'Linear', name: '线性' },
  { id: 'Reinhard', name: 'Reinhard' },
  { id: 'Cineon', name: 'Cineon' },
  { id: 'ACES', name: 'ACES Filmic' }
]

const SHADOW_QUALITIES = [
  { id: 'low', name: '低', description: '1024px, 2级联' },
  { id: 'medium', name: '中', description: '2048px, 3级联' },
  { id: 'high', name: '高', description: '2048px, 4级联' },
  { id: 'ultra', name: '超高', description: '4096px, 4级联' }
]

export function LightingSettingsModal({ renderEngine, onClose }) {
  const [settings, setSettings] = useState({
    // HDR
    enableHDR: true,
    ambientIntensity: 0.4,

    // CSM阴影
    enableCSM: true,
    shadowQuality: 'high',

    // 后处理
    enableTAA: true,
    taaJitter: 0.5,
    toneMapping: 'ACES',
    toneMappingExposure: 1.0,
    enableAutoExposure: false,
    autoExposureSpeed: 1.0,

    // 体积光
    enableVolumetric: false,
    volumetricIntensity: 0.5,

    // 反射
    enableReflection: false
  })

  const [volumetricLights, setVolumetricLights] = useState([])
  const [reflectionProbes, setReflectionProbes] = useState([])
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    if (renderEngine?.current?.advancedLighting) {
      const lighting = renderEngine.current.advancedLighting
      setSettings({
        enableHDR: lighting.settings.enableHDR,
        ambientIntensity: lighting.settings.ambientIntensity,
        enableCSM: lighting.settings.enableCSM,
        shadowQuality: lighting.settings.shadowQuality,
        enableReflection: lighting.settings.enableReflection
      })
    }

    if (renderEngine?.current?.postProcessing) {
      const pp = renderEngine.current.postProcessing
      setSettings(prev => ({
        ...prev,
        enableTAA: pp.settings.enableTAA,
        taaJitter: pp.settings.taaJitter,
        toneMapping: pp.settings.toneMapping,
        toneMappingExposure: pp.settings.toneMappingExposure,
        enableAutoExposure: pp.settings.enableAutoExposure,
        autoExposureSpeed: pp.settings.exposureSpeed
      }))
    }
  }, [renderEngine])

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))

    // 实时应用设置
    if (renderEngine?.current) {
      const engine = renderEngine.current

      if (key === 'enableHDR' || key === 'ambientIntensity') {
        if (engine.advancedLighting) {
          if (key === 'ambientIntensity') {
            engine.advancedLighting.setAmbientIntensity(value)
          }
        }
      }

      if (key === 'shadowQuality') {
        if (engine.advancedLighting) {
          engine.advancedLighting.setShadowQuality(value)
        }
      }

      if (key === 'toneMapping') {
        if (engine.postProcessing) {
          engine.postProcessing.setToneMapping(value)
        }
      }

      if (key === 'toneMappingExposure') {
        if (engine.postProcessing) {
          engine.postProcessing.setToneMappingExposure(value)
        }
      }

      if (key === 'enableTAA') {
        if (engine.postProcessing) {
          engine.postProcessing.setEnableTAA(value)
        }
      }

      if (key === 'enableAutoExposure') {
        if (engine.postProcessing) {
          engine.postProcessing.setEnableAutoExposure(value)
        }
      }
    }
  }

  const handleAddVolumetricLight = () => {
    if (renderEngine?.current?.advancedLighting) {
      const id = `volumetric_${Date.now()}`
      renderEngine.current.advancedLighting.addVolumetricLight(
        id,
        { x: 5, y: 10, z: 5 },
        { intensity: 1, color: 0xffffff }
      )
      setVolumetricLights(prev => [...prev, { id, name: `体积光 ${prev.length + 1}` }])
    }
  }

  const handleAddReflectionProbe = () => {
    if (renderEngine?.current?.advancedLighting) {
      const id = `probe_${Date.now()}`
      renderEngine.current.advancedLighting.addReflectionProbe(
        id,
        { x: 0, y: 2, z: 0 },
        10
      )
      setReflectionProbes(prev => [...prev, { id, name: `反射探针 ${prev.length + 1}` }])
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>💡 光照设置</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'general' ? styles.active : ''}`}
            onClick={() => setActiveTab('general')}
          >
            常规
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'shadows' ? styles.active : ''}`}
            onClick={() => setActiveTab('shadows')}
          >
            阴影
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'postprocess' ? styles.active : ''}`}
            onClick={() => setActiveTab('postprocess')}
          >
            后处理
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'advanced' ? styles.active : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            高级
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'general' && (
            <div className={styles.settingsGroup}>
              <div className={styles.settingItem}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={settings.enableHDR}
                    onChange={(e) => handleSettingChange('enableHDR', e.target.checked)}
                  />
                  启用HDR环境光照
                </label>
                <p className={styles.settingDesc}>使用基于物理的环境光照，提供更真实的反射和照明</p>
              </div>

              <div className={styles.settingItem}>
                <label>环境光强度</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.ambientIntensity}
                  onChange={(e) => handleSettingChange('ambientIntensity', parseFloat(e.target.value))}
                  className={styles.slider}
                />
                <span className={styles.value}>{settings.ambientIntensity.toFixed(1)}</span>
              </div>

              <div className={styles.settingItem}>
                <label>色调映射</label>
                <select
                  value={settings.toneMapping}
                  onChange={(e) => handleSettingChange('toneMapping', e.target.value)}
                  className={styles.select}
                >
                  {TONE_MAPPING_MODES.map(mode => (
                    <option key={mode.id} value={mode.id}>{mode.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.settingItem}>
                <label>曝光</label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={settings.toneMappingExposure}
                  onChange={(e) => handleSettingChange('toneMappingExposure', parseFloat(e.target.value))}
                  className={styles.slider}
                />
                <span className={styles.value}>{settings.toneMappingExposure.toFixed(1)}</span>
              </div>
            </div>
          )}

          {activeTab === 'shadows' && (
            <div className={styles.settingsGroup}>
              <div className={styles.settingItem}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={settings.enableCSM}
                    onChange={(e) => handleSettingChange('enableCSM', e.target.checked)}
                  />
                  启用级联阴影(CSM)
                </label>
                <p className={styles.settingDesc}>使用级联阴影贴图提供更精确的大范围阴影</p>
              </div>

              <div className={styles.settingItem}>
                <label>阴影质量</label>
                <div className={styles.qualityGrid}>
                  {SHADOW_QUALITIES.map(quality => (
                    <button
                      key={quality.id}
                      className={`${styles.qualityBtn} ${settings.shadowQuality === quality.id ? styles.active : ''}`}
                      onClick={() => handleSettingChange('shadowQuality', quality.id)}
                    >
                      <span className={styles.qualityName}>{quality.name}</span>
                      <span className={styles.qualityDesc}>{quality.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'postprocess' && (
            <div className={styles.settingsGroup}>
              <div className={styles.settingItem}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={settings.enableTAA}
                    onChange={(e) => handleSettingChange('enableTAA', e.target.checked)}
                  />
                  启用TAA时间抗锯齿
                </label>
                <p className={styles.settingDesc}>减少锯齿和闪烁，提供更平滑的画面</p>
              </div>

              {settings.enableTAA && (
                <div className={styles.settingItem}>
                  <label>TAA抖动强度</label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={settings.taaJitter}
                    onChange={(e) => handleSettingChange('taaJitter', parseFloat(e.target.value))}
                    className={styles.slider}
                  />
                  <span className={styles.value}>{settings.taaJitter.toFixed(1)}</span>
                </div>
              )}

              <div className={styles.settingItem}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={settings.enableAutoExposure}
                    onChange={(e) => handleSettingChange('enableAutoExposure', e.target.checked)}
                  />
                  启用自动曝光
                </label>
                <p className={styles.settingDesc}>根据场景亮度自动调整曝光</p>
              </div>

              {settings.enableAutoExposure && (
                <div className={styles.settingItem}>
                  <label>曝光适应速度</label>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={settings.autoExposureSpeed}
                    onChange={(e) => handleSettingChange('autoExposureSpeed', parseFloat(e.target.value))}
                    className={styles.slider}
                  />
                  <span className={styles.value}>{settings.autoExposureSpeed.toFixed(1)}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className={styles.settingsGroup}>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>体积光</h3>
                <div className={styles.settingItem}>
                  <button className={styles.addBtn} onClick={handleAddVolumetricLight}>
                    + 添加体积光
                  </button>
                </div>
                {volumetricLights.length > 0 && (
                  <div className={styles.itemList}>
                    {volumetricLights.map(light => (
                      <div key={light.id} className={styles.item}>
                        <span>{light.name}</span>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => {
                            if (renderEngine?.current?.advancedLighting) {
                              renderEngine.current.advancedLighting.removeVolumetricLight(light.id)
                            }
                            setVolumetricLights(prev => prev.filter(l => l.id !== light.id))
                          }}
                        >
                          删除
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>反射探针</h3>
                <div className={styles.settingItem}>
                  <button className={styles.addBtn} onClick={handleAddReflectionProbe}>
                    + 添加反射探针
                  </button>
                </div>
                {reflectionProbes.length > 0 && (
                  <div className={styles.itemList}>
                    {reflectionProbes.map(probe => (
                      <div key={probe.id} className={styles.item}>
                        <span>{probe.name}</span>
                        <button
                          className={styles.updateBtn}
                          onClick={() => {
                            if (renderEngine?.current?.advancedLighting) {
                              renderEngine.current.advancedLighting.updateReflectionProbe(probe.id)
                            }
                          }}
                        >
                          更新
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => {
                            if (renderEngine?.current?.advancedLighting) {
                              renderEngine.current.advancedLighting.removeReflectionProbe(probe.id)
                            }
                            setReflectionProbes(prev => prev.filter(p => p.id !== probe.id))
                          }}
                        >
                          删除
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.applyBtn} onClick={onClose}>
            完成
          </button>
        </div>
      </div>
    </div>
  )
}
