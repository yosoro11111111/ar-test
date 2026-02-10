/**
 * 工作区管理器
 *
 * 功能：
 * - 布局保存/加载
 * - 快捷键自定义
 * - 主题切换
 * - 面板状态管理
 */

export class WorkspaceManager {
  constructor() {
    this.storageKey = 'mmd_studio_workspace'
    this.shortcutsKey = 'mmd_studio_shortcuts'
    this.themeKey = 'mmd_studio_theme'

    // 默认布局
    this.defaultLayout = {
      leftPanel: { visible: true, width: 280 },
      rightPanel: { visible: true, width: 320 },
      bottomPanel: { visible: true, height: 200 },
      timelineScale: 50
    }

    // 默认快捷键
    this.defaultShortcuts = {
      'ctrl+n': { action: 'newProject', name: '新建项目' },
      'ctrl+o': { action: 'openProject', name: '打开项目' },
      'ctrl+s': { action: 'saveProject', name: '保存项目' },
      'ctrl+z': { action: 'undo', name: '撤销' },
      'ctrl+shift+z': { action: 'redo', name: '重做' },
      'ctrl+c': { action: 'copy', name: '复制' },
      'ctrl+v': { action: 'paste', name: '粘贴' },
      'ctrl+x': { action: 'cut', name: '剪切' },
      'delete': { action: 'delete', name: '删除' },
      'ctrl+a': { action: 'selectAll', name: '全选' },
      'space': { action: 'playPause', name: '播放/暂停' },
      'ctrl+f': { action: 'search', name: '搜索' },
      'f11': { action: 'fullscreen', name: '全屏' },
      'ctrl+1': { action: 'viewModePerspective', name: '透视图' },
      'ctrl+2': { action: 'viewModeOrthographic', name: '正交视图' },
      'ctrl+3': { action: 'viewModeCamera', name: '摄像机视图' }
    }

    // 当前状态
    this.currentLayout = { ...this.defaultLayout }
    this.currentShortcuts = { ...this.defaultShortcuts }
    this.currentTheme = 'dark'

    this.isInitialized = false
  }

  /**
   * 初始化工作区管理器
   */
  init() {
    if (this.isInitialized) return

    // 从本地存储加载设置
    this.loadLayout()
    this.loadShortcuts()
    this.loadTheme()

    this.isInitialized = true
    console.log('工作区管理器初始化完成')
  }

  /**
   * 保存布局
   */
  saveLayout(layout) {
    if (layout) {
      this.currentLayout = { ...this.currentLayout, ...layout }
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.currentLayout))
      console.log('布局已保存')
    } catch (error) {
      console.error('保存布局失败:', error)
    }
  }

  /**
   * 加载布局
   */
  loadLayout() {
    try {
      const saved = localStorage.getItem(this.storageKey)
      if (saved) {
        this.currentLayout = { ...this.defaultLayout, ...JSON.parse(saved) }
      }
    } catch (error) {
      console.error('加载布局失败:', error)
      this.currentLayout = { ...this.defaultLayout }
    }

    return this.currentLayout
  }

  /**
   * 重置布局
   */
  resetLayout() {
    this.currentLayout = { ...this.defaultLayout }
    this.saveLayout()
    return this.currentLayout
  }

  /**
   * 更新面板状态
   */
  updatePanel(panelName, updates) {
    if (this.currentLayout[panelName]) {
      this.currentLayout[panelName] = {
        ...this.currentLayout[panelName],
        ...updates
      }
      this.saveLayout()
    }
  }

  /**
   * 切换面板可见性
   */
  togglePanel(panelName) {
    if (this.currentLayout[panelName]) {
      this.currentLayout[panelName].visible = !this.currentLayout[panelName].visible
      this.saveLayout()
    }
  }

  /**
   * 保存快捷键
   */
  saveShortcuts(shortcuts) {
    if (shortcuts) {
      this.currentShortcuts = { ...shortcuts }
    }

    try {
      localStorage.setItem(this.shortcutsKey, JSON.stringify(this.currentShortcuts))
      console.log('快捷键已保存')
    } catch (error) {
      console.error('保存快捷键失败:', error)
    }
  }

  /**
   * 加载快捷键
   */
  loadShortcuts() {
    try {
      const saved = localStorage.getItem(this.shortcutsKey)
      if (saved) {
        this.currentShortcuts = { ...this.defaultShortcuts, ...JSON.parse(saved) }
      }
    } catch (error) {
      console.error('加载快捷键失败:', error)
      this.currentShortcuts = { ...this.defaultShortcuts }
    }

    return this.currentShortcuts
  }

  /**
   * 重置快捷键
   */
  resetShortcuts() {
    this.currentShortcuts = { ...this.defaultShortcuts }
    this.saveShortcuts()
    return this.currentShortcuts
  }

  /**
   * 设置快捷键
   */
  setShortcut(key, action, name) {
    // 检查是否与其他快捷键冲突
    if (this.currentShortcuts[key] && this.currentShortcuts[key].action !== action) {
      console.warn(`快捷键 ${key} 已被 ${this.currentShortcuts[key].name} 使用`)
      return false
    }

    this.currentShortcuts[key] = { action, name }
    this.saveShortcuts()
    return true
  }

  /**
   * 删除快捷键
   */
  removeShortcut(key) {
    delete this.currentShortcuts[key]
    this.saveShortcuts()
  }

  /**
   * 获取快捷键
   */
  getShortcut(action) {
    return Object.entries(this.currentShortcuts).find(
      ([, value]) => value.action === action
    )?.[0]
  }

  /**
   * 获取所有快捷键
   */
  getAllShortcuts() {
    return Object.entries(this.currentShortcuts).map(([key, value]) => ({
      key,
      ...value
    }))
  }

  /**
   * 保存主题
   */
  saveTheme(theme) {
    this.currentTheme = theme

    try {
      localStorage.setItem(this.themeKey, theme)
      console.log('主题已保存:', theme)
    } catch (error) {
      console.error('保存主题失败:', error)
    }
  }

  /**
   * 加载主题
   */
  loadTheme() {
    try {
      const saved = localStorage.getItem(this.themeKey)
      if (saved) {
        this.currentTheme = saved
      }
    } catch (error) {
      console.error('加载主题失败:', error)
      this.currentTheme = 'dark'
    }

    return this.currentTheme
  }

  /**
   * 设置主题
   */
  setTheme(theme) {
    this.currentTheme = theme
    this.saveTheme(theme)

    // 应用主题到文档
    document.documentElement.setAttribute('data-theme', theme)

    return theme
  }

  /**
   * 获取当前主题
   */
  getTheme() {
    return this.currentTheme
  }

  /**
   * 切换主题
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark'
    return this.setTheme(newTheme)
  }

  /**
   * 导出工作区配置
   */
  exportWorkspace() {
    const workspace = {
      layout: this.currentLayout,
      shortcuts: this.currentShortcuts,
      theme: this.currentTheme,
      exportedAt: new Date().toISOString()
    }

    return JSON.stringify(workspace, null, 2)
  }

  /**
   * 导入工作区配置
   */
  importWorkspace(json) {
    try {
      const workspace = JSON.parse(json)

      if (workspace.layout) {
        this.currentLayout = { ...this.defaultLayout, ...workspace.layout }
        this.saveLayout()
      }

      if (workspace.shortcuts) {
        this.currentShortcuts = { ...this.defaultShortcuts, ...workspace.shortcuts }
        this.saveShortcuts()
      }

      if (workspace.theme) {
        this.setTheme(workspace.theme)
      }

      console.log('工作区配置已导入')
      return true
    } catch (error) {
      console.error('导入工作区配置失败:', error)
      return false
    }
  }

  /**
   * 清理所有设置
   */
  clearAll() {
    try {
      localStorage.removeItem(this.storageKey)
      localStorage.removeItem(this.shortcutsKey)
      localStorage.removeItem(this.themeKey)

      this.currentLayout = { ...this.defaultLayout }
      this.currentShortcuts = { ...this.defaultShortcuts }
      this.currentTheme = 'dark'

      console.log('所有设置已清除')
      return true
    } catch (error) {
      console.error('清除设置失败:', error)
      return false
    }
  }

  /**
   * 获取设置摘要
   */
  getSummary() {
    return {
      layout: this.currentLayout,
      shortcuts: Object.keys(this.currentShortcuts).length,
      theme: this.currentTheme,
      storageUsed: this.getStorageSize()
    }
  }

  /**
   * 获取存储大小
   */
  getStorageSize() {
    try {
      let size = 0
      size += localStorage.getItem(this.storageKey)?.length || 0
      size += localStorage.getItem(this.shortcutsKey)?.length || 0
      size += localStorage.getItem(this.themeKey)?.length || 0
      return `${(size / 1024).toFixed(2)} KB`
    } catch {
      return '0 KB'
    }
  }
}
