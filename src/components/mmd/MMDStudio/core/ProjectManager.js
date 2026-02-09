/**
 * ProjectManager - 项目管理系统
 * 负责项目的导入导出、自动保存、版本管理
 */
export class ProjectManager {
  constructor() {
    this.currentProject = null
    this.autoSaveInterval = null
    this.lastSaveTime = null
  }

  // 创建新项目
  createProject(name = '新项目') {
    return {
      id: `project_${Date.now()}`,
      name,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      duration: 120, // 默认2分钟
      background: { type: 'color', color: '#0a0a0f' },
      characters: [],
      props: [],
      scenes: [],
      tracks: [],
      settings: {
        resolution: { width: 1920, height: 1080 },
        fps: 30,
        format: 'mp4'
      }
    }
  }

  // 保存项目到本地存储
  async saveProject(project) {
    const projectData = {
      ...project,
      modifiedAt: new Date().toISOString()
    }
    
    // 保存到localStorage
    localStorage.setItem(`mmd_project_${project.id}`, JSON.stringify(projectData))
    
    // 更新项目列表
    this.updateProjectList(project)
    
    this.lastSaveTime = Date.now()
    return projectData
  }

  // 加载项目
  async loadProject(projectId) {
    const data = localStorage.getItem(`mmd_project_${projectId}`)
    if (!data) {
      throw new Error('项目不存在')
    }
    return JSON.parse(data)
  }

  // 导出项目为.ymmdpack文件
  async exportProject(project) {
    const exportData = {
      ...project,
      exportedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name}.ymmdpack`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 导入.ymmdpack项目文件
  async importProject(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const project = JSON.parse(e.target.result)
          project.id = `project_${Date.now()}` // 生成新ID
          project.importedAt = new Date().toISOString()
          resolve(project)
        } catch (error) {
          reject(new Error('项目文件格式错误'))
        }
      }
      reader.onerror = () => reject(new Error('读取文件失败'))
      reader.readAsText(file)
    })
  }

  // 获取项目列表
  getProjectList() {
    const list = localStorage.getItem('mmd_project_list')
    return list ? JSON.parse(list) : []
  }

  // 更新项目列表
  updateProjectList(project) {
    const list = this.getProjectList()
    const index = list.findIndex(p => p.id === project.id)
    
    const meta = {
      id: project.id,
      name: project.name,
      modifiedAt: project.modifiedAt,
      thumbnail: project.thumbnail
    }
    
    if (index >= 0) {
      list[index] = meta
    } else {
      list.unshift(meta)
    }
    
    localStorage.setItem('mmd_project_list', JSON.stringify(list.slice(0, 50))) // 最多保存50个项目
  }

  // 删除项目
  deleteProject(projectId) {
    localStorage.removeItem(`mmd_project_${projectId}`)
    
    const list = this.getProjectList()
    const newList = list.filter(p => p.id !== projectId)
    localStorage.setItem('mmd_project_list', JSON.stringify(newList))
  }

  // 开始自动保存
  startAutoSave(project, callback, interval = 30000) {
    this.stopAutoSave()
    this.autoSaveInterval = setInterval(() => {
      this.saveProject(project)
      if (callback) callback()
    }, interval)
  }

  // 停止自动保存
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
      this.autoSaveInterval = null
    }
  }
}
