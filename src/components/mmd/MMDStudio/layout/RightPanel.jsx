import React, { useState } from 'react'
import styles from './RightPanel.module.css'

/**
 * 右侧面板 - 属性编辑
 */
export function RightPanel({
  project,
  selectedCharacter,
  selectedProp,
  onUpdateProject
}) {
  const [activeSection, setActiveSection] = useState('transform')

  // 更新角色属性
  const updateCharacter = (characterId, updates) => {
    const updatedCharacters = project.characters.map(char =>
      char.id === characterId ? { ...char, ...updates } : char
    )
    onUpdateProject({ characters: updatedCharacters })
  }

  // 更新道具属性
  const updateProp = (propId, updates) => {
    const updatedProps = project.props.map(prop =>
      prop.id === propId ? { ...prop, ...updates } : prop
    )
    onUpdateProject({ props: updatedProps })
  }

  // 渲染变换控制
  const renderTransform = () => {
    const target = selectedCharacter || selectedProp
    if (!target) return <div className={styles.empty}>请选择角色或道具</div>

    const isCharacter = !!selectedCharacter
    const updateFn = isCharacter ? updateCharacter : updateProp
    const id = target.id

    return (
      <div className={styles.transformSection}>
        <h4>位置</h4>
        <div className={styles.inputGroup}>
          <label>X:</label>
          <input
            type="number"
            value={target.position?.x || 0}
            onChange={(e) => updateFn(id, {
              position: { ...target.position, x: parseFloat(e.target.value) }
            })}
            step="0.1"
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Y:</label>
          <input
            type="number"
            value={target.position?.y || 0}
            onChange={(e) => updateFn(id, {
              position: { ...target.position, y: parseFloat(e.target.value) }
            })}
            step="0.1"
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Z:</label>
          <input
            type="number"
            value={target.position?.z || 0}
            onChange={(e) => updateFn(id, {
              position: { ...target.position, z: parseFloat(e.target.value) }
            })}
            step="0.1"
          />
        </div>

        <h4>旋转</h4>
        <div className={styles.inputGroup}>
          <label>X:</label>
          <input
            type="number"
            value={target.rotation?.x || 0}
            onChange={(e) => updateFn(id, {
              rotation: { ...target.rotation, x: parseFloat(e.target.value) }
            })}
            step="0.1"
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Y:</label>
          <input
            type="number"
            value={target.rotation?.y || 0}
            onChange={(e) => updateFn(id, {
              rotation: { ...target.rotation, y: parseFloat(e.target.value) }
            })}
            step="0.1"
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Z:</label>
          <input
            type="number"
            value={target.rotation?.z || 0}
            onChange={(e) => updateFn(id, {
              rotation: { ...target.rotation, z: parseFloat(e.target.value) }
            })}
            step="0.1"
          />
        </div>

        <h4>缩放</h4>
        {isCharacter ? (
          <div className={styles.inputGroup}>
            <label>统一:</label>
            <input
              type="number"
              value={target.scale || 1}
              onChange={(e) => updateFn(id, { scale: parseFloat(e.target.value) })}
              step="0.1"
              min="0.1"
            />
          </div>
        ) : (
          <>
            <div className={styles.inputGroup}>
              <label>X:</label>
              <input
                type="number"
                value={target.scale?.x || 1}
                onChange={(e) => updateFn(id, {
                  scale: { ...target.scale, x: parseFloat(e.target.value) }
                })}
                step="0.1"
                min="0.1"
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Y:</label>
              <input
                type="number"
                value={target.scale?.y || 1}
                onChange={(e) => updateFn(id, {
                  scale: { ...target.scale, y: parseFloat(e.target.value) }
                })}
                step="0.1"
                min="0.1"
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Z:</label>
              <input
                type="number"
                value={target.scale?.z || 1}
                onChange={(e) => updateFn(id, {
                  scale: { ...target.scale, z: parseFloat(e.target.value) }
                })}
                step="0.1"
                min="0.1"
              />
            </div>
          </>
        )}
      </div>
    )
  }

  // 渲染动画控制
  const renderAnimation = () => {
    if (!selectedCharacter) return <div className={styles.empty}>请选择角色</div>

    return (
      <div className={styles.animationSection}>
        <h4>动作</h4>
        <select className={styles.select}>
          <option>选择动作...</option>
          <option>待机</option>
          <option>行走</option>
          <option>跑步</option>
          <option>舞蹈1</option>
        </select>

        <div className={styles.buttonGroup}>
          <button>▶ 播放</button>
          <button>⏸ 暂停</button>
          <button>⏹ 停止</button>
        </div>

        <div className={styles.progressBar}>
          <div className={styles.progress} style={{ width: '30%' }}></div>
        </div>

        <h4>表情</h4>
        <div className={styles.expressionGrid}>
          <button className={styles.expressionBtn}>😊</button>
          <button className={styles.expressionBtn}>😢</button>
          <button className={styles.expressionBtn}>😠</button>
          <button className={styles.expressionBtn}>😮</button>
        </div>
      </div>
    )
  }

  // 渲染材质控制
  const renderMaterial = () => {
    const target = selectedCharacter || selectedProp
    if (!target) return <div className={styles.empty}>请选择角色或道具</div>

    return (
      <div className={styles.materialSection}>
        <h4>材质</h4>
        <div className={styles.materialItem}>
          <label>颜色</label>
          <input type="color" defaultValue="#ffffff" />
        </div>
        <div className={styles.materialItem}>
          <label>透明度</label>
          <input type="range" min="0" max="1" step="0.1" defaultValue="1" />
        </div>
        <div className={styles.materialItem}>
          <label>金属度</label>
          <input type="range" min="0" max="1" step="0.1" defaultValue="0" />
        </div>
        <div className={styles.materialItem}>
          <label>粗糙度</label>
          <input type="range" min="0" max="1" step="0.1" defaultValue="0.5" />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* 标签页 */}
      <div className={styles.tabs}>
        <button
          className={activeSection === 'transform' ? styles.active : ''}
          onClick={() => setActiveSection('transform')}
        >
          📍 变换
        </button>
        <button
          className={activeSection === 'animation' ? styles.active : ''}
          onClick={() => setActiveSection('animation')}
        >
          🎭 动画
        </button>
        <button
          className={activeSection === 'material' ? styles.active : ''}
          onClick={() => setActiveSection('material')}
        >
          🎨 材质
        </button>
      </div>

      {/* 内容区 */}
      <div className={styles.content}>
        {activeSection === 'transform' && renderTransform()}
        {activeSection === 'animation' && renderAnimation()}
        {activeSection === 'material' && renderMaterial()}
      </div>
    </div>
  )
}
