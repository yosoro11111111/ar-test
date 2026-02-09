/**
 * 项目管理器
 * 
 * 功能：
 * - 创建新项目
 * - 保存/加载项目
 * - 管理最近项目列表
 * - 项目元数据管理
 */
export class ProjectManager {
  constructor() {
    this.storageKey = 'mmd_studio_projects'
    this.recentKey = 'mmd_studio_recent'
  }

  /**
   * 创建新项目
   */
  createProject(config) {
    const project = {
      id: `proj_${Date.now()}`,
      name: config.name || '未命名项目',
      description: config.description || '',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: '2.0.0',
      
      // 项目设置
      settings: {
        resolution: config.resolution || { width: 1920, height: 1080 },
        fps: config.fps || 60,
        duration: config.duration || 120,
        background: config.background || { type: 'color', color: '#0a0a0f' }
      },
      
      // 场景内容
      characters: [],
      props: [],
      scenes: [],
      backgroundLayers: [],
      
      // 时间轴 - 添加默认轨道
      tracks: [
        {
          id: `track_scene_${Date.now()}`,
          type: 'scene',
          name: '场景',
          clips: [],
          muted: false,
          locked: false
        },
        {
          id: `track_music_${Date.now() + 1}`,
          type: 'music',
          name: '音乐',
          clips: [],
          muted: false,
          locked: false
        }
      ],
      
      // 资源引用
      resources: {
        characters: [],
        props: [],
        scenes: [],
        motions: [],
        music: [],
        effects: []
      }
    }

    return project
  }

  /**
   * 保存项目
   */
  async saveProject(project) {
    try {
      // 更新最后修改时间
      project.lastModified = new Date().toISOString()
      
      // 保存到本地存储
      const projects = this.getAllProjects()
      projects[project.id] = project
      localStorage.setItem(this.storageKey, JSON.stringify(projects))
      
      // 更新最近项目列表
      this.addToRecent(project.id)
      
      return true
    } catch (error) {
      console.error('保存项目失败:', error)
      throw error
    }
  }

  /**
   * 加载项目
   */
  async loadProject(projectId) {
    try {
      const projects = this.getAllProjects()
      const project = projects[projectId]
      
      if (!project) {
        throw new Error('项目不存在')
      }
      
      // 更新最近项目列表
      this.addToRecent(projectId)
      
      return project
    } catch (error) {
      console.error('加载项目失败:', error)
      throw error
    }
  }

  /**
   * 删除项目
   */
  async deleteProject(projectId) {
    try {
      const projects = this.getAllProjects()
      delete projects[projectId]
      localStorage.setItem(this.storageKey, JSON.stringify(projects))
      
      // 从最近列表中移除
      this.removeFromRecent(projectId)
      
      return true
    } catch (error) {
      console.error('删除项目失败:', error)
      throw error
    }
  }

  /**
   * 获取所有项目
   */
  getAllProjects() {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : {}
    } catch (error) {
      console.error('获取项目列表失败:', error)
      return {}
    }
  }

  /**
   * 获取最近项目列表
   */
  async getRecentProjects() {
    try {
      const recentIds = this.getRecentIds()
      const projects = this.getAllProjects()
      
      return recentIds
        .map(id => projects[id])
        .filter(project => project !== undefined)
        .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
    } catch (error) {
      console.error('获取最近项目失败:', error)
      return []
    }
  }

  /**
   * 获取最近项目ID列表
   */
  getRecentIds() {
    try {
      const data = localStorage.getItem(this.recentKey)
      return data ? JSON.parse(data) : []
    } catch (error) {
      return []
    }
  }

  /**
   * 添加到最近列表
   */
  addToRecent(projectId) {
    try {
      let recent = this.getRecentIds()
      
      // 移除已存在的
      recent = recent.filter(id => id !== projectId)
      
      // 添加到开头
      recent.unshift(projectId)
      
      // 限制数量
      recent = recent.slice(0, 10)
      
      localStorage.setItem(this.recentKey, JSON.stringify(recent))
    } catch (error) {
      console.error('更新最近列表失败:', error)
    }
  }

  /**
   * 从最近列表移除
   */
  removeFromRecent(projectId) {
    try {
      let recent = this.getRecentIds()
      recent = recent.filter(id => id !== projectId)
      localStorage.setItem(this.recentKey, JSON.stringify(recent))
    } catch (error) {
      console.error('移除最近项目失败:', error)
    }
  }

  /**
   * 导出项目为JSON
   */
  exportProject(project) {
    return JSON.stringify(project, null, 2)
  }

  /**
   * 从JSON导入项目
   */
  importProject(jsonString) {
    try {
      const project = JSON.parse(jsonString)
      
      // 验证项目结构
      if (!project.name || !project.settings) {
        throw new Error('无效的项目文件')
      }
      
      // 生成新ID
      project.id = `proj_${Date.now()}`
      project.createdAt = new Date().toISOString()
      project.lastModified = new Date().toISOString()
      
      return project
    } catch (error) {
      console.error('导入项目失败:', error)
      throw error
    }
  }
}
