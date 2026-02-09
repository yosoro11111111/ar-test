import React, { useState, useRef, useEffect } from 'react'
import styles from './TopBar.module.css'

/**
 * 顶部导航栏
 * 
 * 功能：
 * - 项目名显示
 * - 菜单（文件、编辑、视图、渲染、帮助）
 * - 快捷操作（保存、导出、设置）
 * - 时间显示
 * - 资源包选择
 */
export function TopBar({
  project,
  isModified,
  currentTime,
  formatTime,
  onNewProject,
  onSaveProject,
  onExportProject,
  onOpenSettings,
  onImportResourcePack,
  onToggleCameraPreview,
  showCameraPreview,
  onOpenProject,
  onImportProject,
  onExportResourcePack,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onToggleFullscreen,
  onToggleLeftPanel,
  onToggleRightPanel,
  onToggleTimeline,
  onChangeViewMode,
  onPreviewRender,
  onFinalRender
}) {
  const [activeMenu, setActiveMenu] = useState(null)
  const menuRef = useRef(null)

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const menuItems = [
    { id: 'file', label: '文件', items: [
      { label: '新建项目', shortcut: 'Ctrl+N', action: onNewProject },
      { label: '打开项目', shortcut: 'Ctrl+O', action: onOpenProject },
      { label: '导入项目', action: onImportProject },
      { type: 'separator' },
      { label: '保存项目', shortcut: 'Ctrl+S', action: onSaveProject },
      { type: 'separator' },
      { label: '导入资源包', action: onImportResourcePack },
      { label: '导出资源包', action: onExportResourcePack },
      { type: 'separator' },
      { label: '导出项目', shortcut: 'Ctrl+E', action: onExportProject },
    ]},
    { id: 'edit', label: '编辑', items: [
      { label: '撤销', shortcut: 'Ctrl+Z', action: onUndo },
      { label: '重做', shortcut: 'Ctrl+Y', action: onRedo },
      { type: 'separator' },
      { label: '复制', shortcut: 'Ctrl+C', action: onCopy },
      { label: '剪切', shortcut: 'Ctrl+X', action: () => {} },
      { label: '粘贴', shortcut: 'Ctrl+V', action: onPaste },
      { type: 'separator' },
      { label: '删除', shortcut: 'Delete', action: () => {} },
      { label: '全选', shortcut: 'Ctrl+A', action: () => {} },
    ]},
    { id: 'view', label: '视图', items: [
      { label: '透视图', action: () => onChangeViewMode?.('perspective'), icon: '🔍' },
      { label: '正交视图', action: () => onChangeViewMode?.('orthographic'), icon: '📐' },
      { label: '摄像机视图', action: () => onChangeViewMode?.('camera'), icon: '📷' },
      { type: 'separator' },
      { label: '左侧面板', action: onToggleLeftPanel, checkable: true },
      { label: '右侧面板', action: onToggleRightPanel, checkable: true },
      { label: '时间轴', action: onToggleTimeline, checkable: true },
      { type: 'separator' },
      { label: '全屏', shortcut: 'F11', action: onToggleFullscreen },
    ]},
    { id: 'render', label: '渲染', items: [
      { label: '预览渲染', action: onPreviewRender, icon: '👁️' },
      { label: '最终渲染', action: onFinalRender, icon: '🎬' },
      { type: 'separator' },
      { label: '渲染设置', action: onOpenSettings, icon: '⚙️' },
    ]},
    { id: 'help', label: '帮助', items: [
      { label: '快捷键', action: () => {}, shortcut: '?' },
      { label: '使用文档', action: () => {} },
      { type: 'separator' },
      { label: '关于 MMD Studio', action: () => {} },
    ]},
  ]

  return (
    <header className={styles.container} style={{ background: 'linear-gradient(180deg, #151520 0%, #12121a 100%)' }}>
      {/* 左侧：Logo和项目信息 */}
      <div className={styles.leftSection}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🎬</span>
          <span className={styles.logoText}>MMD Studio</span>
        </div>
        
        <div className={styles.projectInfo}>
          <span className={styles.projectName}>{project?.name || '未命名项目'}</span>
          {isModified && <span className={styles.modifiedIndicator}>*</span>}
        </div>
      </div>

      {/* 中间：菜单栏 */}
      <div className={styles.menuBar} ref={menuRef}>
        {menuItems.map(menu => (
          <div 
            key={menu.id} 
            className={`${styles.menuItem} ${activeMenu === menu.id ? styles.active : ''}`}
            onMouseEnter={() => setActiveMenu(menu.id)}
          >
            <button 
              className={styles.menuBtn}
              onClick={() => setActiveMenu(activeMenu === menu.id ? null : menu.id)}
            >
              {menu.label}
            </button>
            
            {/* 下拉菜单 */}
            {activeMenu === menu.id && (
              <div className={styles.dropdown}>
                {menu.items.map((item, index) => (
                  item.type === 'separator' ? (
                    <div key={index} className={styles.separator} />
                  ) : (
                    <button
                      key={index}
                      className={styles.dropdownItem}
                      onClick={() => {
                        item.action?.()
                        setActiveMenu(null)
                      }}
                    >
                      <span className={styles.itemIcon}>{item.icon || ''}</span>
                      <span className={styles.itemLabel}>{item.label}</span>
                      {item.shortcut && (
                        <span className={styles.shortcut}>{item.shortcut}</span>
                      )}
                    </button>
                  )
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 右侧：工具栏和时间 */}
      <div className={styles.rightSection}>
        {/* 资源包管理按钮 */}
        <button 
          className={styles.importBtn}
          onClick={onImportResourcePack}
          title="资源包管理"
        >
          📦
        </button>

        <div className={styles.divider} />

        {/* 快捷操作 */}
        <div className={styles.quickActions}>
          <button 
            className={styles.actionBtn}
            onClick={onSaveProject}
            title="保存项目 (Ctrl+S)"
          >
            💾
          </button>
          <button 
            className={styles.actionBtn}
            onClick={onExportProject}
            title="导出 (Ctrl+E)"
          >
            📤
          </button>
          <button 
            className={styles.actionBtn}
            onClick={onOpenSettings}
            title="设置"
          >
            ⚙️
          </button>
          <button 
            className={`${styles.actionBtn} ${showCameraPreview ? styles.active : ''}`}
            onClick={onToggleCameraPreview}
            title="摄像机预览"
          >
            📷
          </button>
        </div>

        <div className={styles.divider} />

        {/* 时间显示 */}
        <div className={styles.timeDisplay}>
          <span className={styles.timeCurrent}>{formatTime(currentTime)}</span>
          <span className={styles.timeSeparator}>/</span>
          <span className={styles.timeTotal}>{formatTime(project?.duration || 120)}</span>
        </div>
      </div>
    </header>
  )
}
