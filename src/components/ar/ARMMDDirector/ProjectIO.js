import JSZip from 'jszip'

/**
 * AR Director 项目文件格式 (.ard)
 * 
 * 文件结构:
 * project.ard (ZIP)
 *   ├── manifest.json      # 项目元数据
 *   ├── project.json       # 项目配置
 *   ├── assets/            # 资源文件
 *   │   ├── images/        # 图片资源
 *   │   ├── audio/         # 音频资源
 *   │   └── ar/            # AR录制数据
 *   └── thumbnails/        # 缩略图
 */

const PROJECT_VERSION = '1.0'

/**
 * 导出项目为 .ard 文件
 */
export async function exportProject(project) {
  const zip = new JSZip()
  
  // 1. 创建清单文件
  const manifest = {
    version: PROJECT_VERSION,
    createdAt: new Date().toISOString(),
    name: project.name,
    type: 'ar-director-project'
  }
  zip.file('manifest.json', JSON.stringify(manifest, null, 2))
  
  // 2. 收集所有资源
  const assets = {
    images: [],
    audio: []
  }
  
  // 提取背景图片
  if (project.backgroundImage && project.backgroundImage.startsWith('data:')) {
    const imageData = project.backgroundImage
    const filename = `background_${Date.now()}.png`
    assets.images.push({
      name: filename,
      data: imageData,
      originalPath: project.backgroundImage
    })
  }
  
  // 提取音乐片段中的音频
  project.tracks.forEach(track => {
    if (track.type === 'music' && track.clips) {
      track.clips.forEach(clip => {
        if (clip.data?.audioFile && clip.data.audioFile.startsWith('data:')) {
          const filename = `audio_${clip.id}.mp3`
          assets.audio.push({
            name: filename,
            data: clip.data.audioFile,
            originalPath: clip.data.audioFile,
            clipId: clip.id
          })
        }
      })
    }
  })
  
  // 3. 创建项目数据（替换资源路径）
  const projectData = JSON.parse(JSON.stringify(project))
  
  // 替换背景图片路径
  if (project.backgroundImage && project.backgroundImage.startsWith('data:')) {
    const bgAsset = assets.images.find(a => a.originalPath === project.backgroundImage)
    if (bgAsset) {
      projectData.backgroundImage = `assets/images/${bgAsset.name}`
    }
  }
  
  // 替换音频路径
  projectData.tracks.forEach(track => {
    if (track.type === 'music' && track.clips) {
      track.clips.forEach(clip => {
        if (clip.data?.audioFile && clip.data.audioFile.startsWith('data:')) {
          const audioAsset = assets.audio.find(a => a.originalPath === clip.data.audioFile)
          if (audioAsset) {
            clip.data.audioFile = `assets/audio/${audioAsset.name}`
          }
        }
      })
    }
  })
  
  zip.file('project.json', JSON.stringify(projectData, null, 2))
  
  // 4. 添加资源文件
  const assetsFolder = zip.folder('assets')
  const imagesFolder = assetsFolder.folder('images')
  const audioFolder = assetsFolder.folder('audio')
  
  // 添加图片
  for (const img of assets.images) {
    const base64Data = img.data.split(',')[1]
    imagesFolder.file(img.name, base64Data, { base64: true })
  }
  
  // 添加音频
  for (const audio of assets.audio) {
    const base64Data = audio.data.split(',')[1]
    audioFolder.file(audio.name, base64Data, { base64: true })
  }
  
  // 5. 生成 ZIP 文件
  const content = await zip.generateAsync({ type: 'blob' })
  return content
}

/**
 * 从 .ard 文件导入项目
 */
export async function importProject(file) {
  const zip = await JSZip.loadAsync(file)
  
  // 1. 验证清单
  const manifestFile = zip.file('manifest.json')
  if (!manifestFile) {
    throw new Error('无效的项目文件：缺少清单文件')
  }
  
  const manifest = JSON.parse(await manifestFile.async('text'))
  if (manifest.type !== 'ar-director-project') {
    throw new Error('无效的项目文件类型')
  }
  
  // 2. 读取项目数据
  const projectFile = zip.file('project.json')
  if (!projectFile) {
    throw new Error('无效的项目文件：缺少项目数据')
  }
  
  const projectData = JSON.parse(await projectFile.async('text'))
  
  // 3. 加载资源文件
  const assetsFolder = zip.folder('assets')
  
  // 加载图片
  const imagesFolder = assetsFolder?.folder('images')
  if (imagesFolder) {
    const imageFiles = Object.keys(imagesFolder.files).filter(path => 
      path.startsWith('assets/images/') && !path.endsWith('/')
    )
    
    for (const imagePath of imageFiles) {
      const imageFile = zip.file(imagePath)
      if (imageFile) {
        const base64Data = await imageFile.async('base64')
        const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg'
        const dataUrl = `data:${mimeType};base64,${base64Data}`
        
        // 替换项目中的路径
        const filename = imagePath.replace('assets/images/', '')
        if (projectData.backgroundImage === `assets/images/${filename}`) {
          projectData.backgroundImage = dataUrl
        }
      }
    }
  }
  
  // 加载音频
  const audioFolder = assetsFolder?.folder('audio')
  if (audioFolder) {
    const audioFiles = Object.keys(audioFolder.files).filter(path =>
      path.startsWith('assets/audio/') && !path.endsWith('/')
    )
    
    for (const audioPath of audioFiles) {
      const audioFile = zip.file(audioPath)
      if (audioFile) {
        const base64Data = await audioFile.async('base64')
        const mimeType = 'audio/mpeg'
        const dataUrl = `data:${mimeType};base64,${base64Data}`
        
        // 替换项目中的路径
        const filename = audioPath.replace('assets/audio/', '')
        projectData.tracks.forEach(track => {
          if (track.type === 'music' && track.clips) {
            track.clips.forEach(clip => {
              if (clip.data?.audioFile === `assets/audio/${filename}`) {
                clip.data.audioFile = dataUrl
              }
            })
          }
        })
      }
    }
  }
  
  // 4. 更新项目ID和名称
  projectData.id = `project_${Date.now()}`
  projectData.importedAt = new Date().toISOString()
  
  return projectData
}

/**
 * 下载文件
 */
export function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
