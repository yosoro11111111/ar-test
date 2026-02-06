import JSZip from 'jszip'

/**
 * AR场景导入导出工具
 * 
 * 文件格式: .arpack (ZIP压缩包)
 * 
 * 文件结构:
 * scene.arpack (ZIP)
 *   ├── manifest.json      # 场景元数据
 *   ├── scene.json         # 场景数据
 *   └── assets/            # 资源文件
 *       ├── image.png      # 场景图片(如果有)
 *       └── ar/            # AR录制数据
 *           └── data.json
 */

const ARPACK_VERSION = '1.0'

/**
 * 导出AR场景包
 * @param {Object} scene - 场景对象 { id, name, type, data }
 * @returns {Promise<Blob>} - ZIP文件Blob
 */
export async function exportARScenePack(scene) {
  const zip = new JSZip()
  
  // 1. 创建清单文件
  const manifest = {
    version: ARPACK_VERSION,
    createdAt: new Date().toISOString(),
    type: 'ar-scene-pack',
    metadata: {
      name: scene.name,
      id: scene.id,
      sceneType: scene.type, // 'image' | 'ar'
      createdAt: scene.createdAt
    }
  }
  zip.file('manifest.json', JSON.stringify(manifest, null, 2))
  
  // 2. 准备场景数据
  const sceneData = {
    ...scene.data,
    // 如果有图片且是base64，提取出来单独存储
    imageUrl: undefined
  }
  
  // 3. 处理图片资源
  const assetsFolder = zip.folder('assets')
  
  if (scene.type === 'image' && scene.data?.imageUrl) {
    if (scene.data.imageUrl.startsWith('data:')) {
      // base64图片，提取并保存
      const base64Data = scene.data.imageUrl.split(',')[1]
      const mimeType = scene.data.imageUrl.match(/data:([^;]+)/)?.[1] || 'image/png'
      const ext = mimeType.split('/')[1] || 'png'
      assetsFolder.file(`image.${ext}`, base64Data, { base64: true })
      sceneData.imagePath = `assets/image.${ext}`
    } else {
      // URL图片，保留路径
      sceneData.imageUrl = scene.data.imageUrl
    }
  }
  
  // 4. 处理AR数据
  if (scene.type === 'ar' && scene.data?.arData) {
    const arFolder = assetsFolder.folder('ar')
    arFolder.file('data.json', JSON.stringify(scene.data.arData, null, 2))
    sceneData.arDataPath = 'assets/ar/data.json'
    sceneData.arData = undefined // 不重复存储
  }
  
  // 5. 保存场景数据
  zip.file('scene.json', JSON.stringify(sceneData, null, 2))
  
  // 6. 生成ZIP
  const content = await zip.generateAsync({ type: 'blob' })
  return content
}

/**
 * 导入AR场景包
 * @param {File} file - .arpack文件
 * @returns {Promise<Object>} - 场景对象
 */
export async function importARScenePack(file) {
  const zip = await JSZip.loadAsync(file)
  
  // 1. 验证清单
  const manifestFile = zip.file('manifest.json')
  if (!manifestFile) {
    throw new Error('无效的场景包：缺少清单文件')
  }
  
  const manifest = JSON.parse(await manifestFile.async('text'))
  if (manifest.type !== 'ar-scene-pack') {
    throw new Error('无效的场景包类型')
  }
  
  // 2. 读取场景数据
  const sceneFile = zip.file('scene.json')
  if (!sceneFile) {
    throw new Error('无效的场景包：缺少场景数据')
  }
  
  const sceneData = JSON.parse(await sceneFile.async('text'))
  
  // 3. 加载图片资源
  if (sceneData.imagePath) {
    const imageFile = zip.file(sceneData.imagePath)
    if (imageFile) {
      const base64Data = await imageFile.async('base64')
      const ext = sceneData.imagePath.split('.').pop()
      const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
      sceneData.imageUrl = `data:${mimeType};base64,${base64Data}`
      delete sceneData.imagePath
    }
  }
  
  // 4. 加载AR数据
  if (sceneData.arDataPath) {
    const arFile = zip.file(sceneData.arDataPath)
    if (arFile) {
      const arData = JSON.parse(await arFile.async('text'))
      sceneData.arData = arData
      delete sceneData.arDataPath
    }
  }
  
  // 5. 构建场景对象
  const scene = {
    id: `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: `${manifest.metadata?.name || '未命名场景'} (导入)`,
    type: manifest.metadata?.sceneType || 'image',
    createdAt: new Date().toISOString(),
    importedAt: new Date().toISOString(),
    data: sceneData
  }
  
  return scene
}

/**
 * 下载文件
 * @param {Blob} blob - 文件内容
 * @param {string} filename - 文件名
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

/**
 * 验证文件是否为AR场景包
 * @param {File} file - 文件对象
 * @returns {boolean}
 */
export function isARScenePack(file) {
  return file.name.endsWith('.arpack') || file.name.endsWith('.arscene')
}
