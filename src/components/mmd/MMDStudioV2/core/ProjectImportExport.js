/**
 * 项目导入导出管理器
 * 
 * 支持 pmmdpack 格式（高度压缩）
 * pmmdpack = Project MMD Pack
 */

import JSZip from 'jszip'

export class ProjectImportExport {
  constructor() {
    this.version = '1.0.0'
  }

  /**
   * 导出项目为 pmmdpack 格式
   * @param {Object} project - 项目数据
   * @param {Object} options - 导出选项
   * @returns {Blob} 压缩后的文件
   */
  async exportProject(project, options = {}) {
    const zip = new JSZip()
    
    // 1. 项目元数据
    const metadata = {
      version: this.version,
      exportDate: new Date().toISOString(),
      projectName: project.name,
      projectId: project.id,
      duration: project.duration,
      fps: project.fps,
      resolution: project.resolution
    }
    zip.file('metadata.json', JSON.stringify(metadata, null, 2))
    
    // 2. 项目配置
    zip.file('project.json', this.compressProjectData(project))
    
    // 3. 轨道数据
    zip.file('tracks.json', JSON.stringify(project.tracks, null, 2))
    
    // 4. 角色数据
    const charactersFolder = zip.folder('characters')
    if (project.characters) {
      project.characters.forEach((char, index) => {
        charactersFolder.file(`char_${index}.json`, JSON.stringify(char, null, 2))
      })
    }
    
    // 5. 道具数据
    const propsFolder = zip.folder('props')
    if (project.props) {
      project.props.forEach((prop, index) => {
        propsFolder.file(`prop_${index}.json`, JSON.stringify(prop, null, 2))
      })
    }
    
    // 6. 场景数据
    const scenesFolder = zip.folder('scenes')
    if (project.scenes) {
      project.scenes.forEach((scene, index) => {
        scenesFolder.file(`scene_${index}.json`, JSON.stringify(scene, null, 2))
      })
    }
    
    // 7. 资源引用清单
    const resourceManifest = this.generateResourceManifest(project)
    zip.file('resources.json', JSON.stringify(resourceManifest, null, 2))
    
    // 8. 压缩并生成文件
    const compressionLevel = options.compression || 'DEFLATE'
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: compressionLevel,
      compressionOptions: {
        level: 9 // 最高压缩级别
      }
    })
    
    return blob
  }

  /**
   * 压缩项目数据
   */
  compressProjectData(project) {
    // 移除不必要的大字段，保留核心数据
    const compressed = {
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      modifiedAt: project.modifiedAt,
      duration: project.duration,
      fps: project.fps,
      resolution: project.resolution,
      settings: project.settings,
      // 压缩轨道数据
      tracks: project.tracks.map(track => ({
        id: track.id,
        type: track.type,
        targetId: track.targetId,
        targetType: track.targetType,
        name: track.name,
        muted: track.muted,
        locked: track.locked,
        clips: track.clips.map(clip => ({
          id: clip.id,
          name: clip.name,
          type: clip.type,
          start: clip.start,
          end: clip.end,
          resourceId: clip.resourceId,
          resourcePath: clip.resourcePath,
          traits: clip.traits,
          transform: clip.transform
        }))
      })),
      // 压缩角色数据
      characters: project.characters?.map(char => ({
        id: char.id,
        name: char.name,
        modelPath: char.modelPath,
        transform: char.transform,
        traits: char.traits
      })),
      // 压缩道具数据
      props: project.props?.map(prop => ({
        id: prop.id,
        name: prop.name,
        modelPath: prop.modelPath,
        transform: prop.transform,
        traits: prop.traits
      }))
    }
    
    return JSON.stringify(compressed, null, 2)
  }

  /**
   * 生成资源引用清单
   */
  generateResourceManifest(project) {
    const resources = {
      characters: [],
      props: [],
      scenes: [],
      motions: [],
      music: []
    }
    
    // 从轨道中提取资源引用
    project.tracks?.forEach(track => {
      track.clips?.forEach(clip => {
        if (clip.resourcePath) {
          const resource = {
            id: clip.resourceId,
            name: clip.name,
            path: clip.resourcePath,
            type: clip.type
          }
          
          if (clip.type === 'motion' && !resources.motions.find(r => r.id === resource.id)) {
            resources.motions.push(resource)
          } else if (clip.type === 'prop' && !resources.props.find(r => r.id === resource.id)) {
            resources.props.push(resource)
          } else if (clip.type === 'scene' && !resources.scenes.find(r => r.id === resource.id)) {
            resources.scenes.push(resource)
          } else if (clip.type === 'music' && !resources.music.find(r => r.id === resource.id)) {
            resources.music.push(resource)
          }
        }
      })
    })
    
    // 从角色中提取
    project.characters?.forEach(char => {
      if (char.modelPath && !resources.characters.find(r => r.id === char.id)) {
        resources.characters.push({
          id: char.id,
          name: char.name,
          path: char.modelPath,
          type: 'character'
        })
      }
    })
    
    // 从道具中提取
    project.props?.forEach(prop => {
      if (prop.modelPath && !resources.props.find(r => r.id === prop.id)) {
        resources.props.push({
          id: prop.id,
          name: prop.name,
          path: prop.modelPath,
          type: 'prop'
        })
      }
    })
    
    return resources
  }

  /**
   * 导入 pmmdpack 项目
   * @param {File} file - pmmdpack 文件
   * @returns {Object} 项目数据
   */
  async importProject(file) {
    try {
      // 读取 zip 文件
      const zip = await JSZip.loadAsync(file)
      
      // 1. 读取元数据
      const metadataContent = await zip.file('metadata.json')?.async('text')
      if (!metadataContent) {
        throw new Error('无效的项目文件：缺少 metadata.json')
      }
      const metadata = JSON.parse(metadataContent)
      
      // 验证版本兼容性
      if (!this.checkVersionCompatibility(metadata.version)) {
        console.warn(`项目版本 ${metadata.version} 可能与当前版本不兼容`)
      }
      
      // 2. 读取项目配置
      const projectContent = await zip.file('project.json')?.async('text')
      if (!projectContent) {
        throw new Error('无效的项目文件：缺少 project.json')
      }
      const project = JSON.parse(projectContent)
      
      // 3. 读取轨道数据（如果存在）
      const tracksContent = await zip.file('tracks.json')?.async('text')
      if (tracksContent) {
        project.tracks = JSON.parse(tracksContent)
      }
      
      // 4. 读取角色数据
      const charactersFolder = zip.folder('characters')
      if (charactersFolder) {
        project.characters = []
        const charFiles = Object.keys(charactersFolder.files).filter(name => 
          name.startsWith('characters/') && name.endsWith('.json')
        )
        for (const fileName of charFiles) {
          const content = await zip.file(fileName)?.async('text')
          if (content) {
            project.characters.push(JSON.parse(content))
          }
        }
      }
      
      // 5. 读取道具数据
      const propsFolder = zip.folder('props')
      if (propsFolder) {
        project.props = []
        const propFiles = Object.keys(propsFolder.files).filter(name => 
          name.startsWith('props/') && name.endsWith('.json')
        )
        for (const fileName of propFiles) {
          const content = await zip.file(fileName)?.async('text')
          if (content) {
            project.props.push(JSON.parse(content))
          }
        }
      }
      
      // 6. 读取资源清单
      const resourcesContent = await zip.file('resources.json')?.async('text')
      if (resourcesContent) {
        project.resources = JSON.parse(resourcesContent)
      }
      
      // 7. 更新导入时间
      project.importedAt = new Date().toISOString()
      project.importedFrom = metadata.projectName
      
      return {
        metadata,
        project
      }
    } catch (error) {
      console.error('导入项目失败:', error)
      throw new Error('导入项目失败: ' + error.message)
    }
  }

  /**
   * 检查版本兼容性
   */
  checkVersionCompatibility(version) {
    // 简单的主版本号检查
    const currentMajor = this.version.split('.')[0]
    const fileMajor = version.split('.')[0]
    return currentMajor === fileMajor
  }

  /**
   * 下载项目文件
   * @param {Object} project - 项目数据
   * @param {string} filename - 文件名
   */
  async downloadProject(project, filename = null) {
    const blob = await this.exportProject(project)
    const name = filename || `${project.name || 'project'}_${Date.now()}.pmmdpack`
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * 验证项目文件
   */
  validateProject(project) {
    const required = ['id', 'name', 'tracks']
    const missing = required.filter(field => !project[field])
    
    if (missing.length > 0) {
      throw new Error(`项目缺少必要字段: ${missing.join(', ')}`)
    }
    
    if (!Array.isArray(project.tracks)) {
      throw new Error('项目 tracks 必须是数组')
    }
    
    return true
  }
}

// 导出单例
export const projectImportExport = new ProjectImportExport()
