import JSZip from 'jszip'

/**
 * AR场景导入导出工具
 * 
 * 支持格式:
 * 1. .arpack (v1.0) - 旧版AR场景包
 * 2. .arscene2 (v2.0) - 新版真实AR场景包
 * 3. .webxrar (v2.0) - WebXR AR场景包
 * 
 * v2.0 文件结构:
 * scene.arscene2 (ZIP)
 *   ├── manifest.json      # 场景元数据
 *   ├── scene.json         # 场景数据(包含平面配置)
 *   └── scene.jpg          # 场景背景图片
 */

const ARPACK_VERSION = '1.0'
const ARSCENE2_VERSION = '2.0'

/**
 * 导出AR场景包 (v1.0 旧版)
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
 * 导出真实AR场景包 (v2.0 新版)
 * @param {Object} sceneData - 场景数据 { name, image, planes, camera }
 * @returns {Promise<Blob>} - ZIP文件Blob
 */
export async function exportRealARScene(sceneData) {
  const zip = new JSZip()
  
  // 1. 创建清单文件
  const manifest = {
    version: ARSCENE2_VERSION,
    type: 'real-ar-scene-pack',
    createdAt: new Date().toISOString(),
    metadata: {
      name: sceneData.name || '未命名场景',
      type: 'real-ar',
      planeCount: sceneData.planes?.length || 0
    }
  }
  zip.file('manifest.json', JSON.stringify(manifest, null, 2))
  
  // 2. 准备场景数据（不包含图片base64）
  const sceneJson = {
    version: sceneData.version || '2.0',
    type: sceneData.type || 'real-ar-scene',
    name: sceneData.name || '未命名场景',
    capturedAt: sceneData.capturedAt || new Date().toISOString(),
    planes: sceneData.planes || [],
    camera: sceneData.camera || { fov: 60, position: { x: 0, y: 0, z: 5 } }
  }
  zip.file('scene.json', JSON.stringify(sceneJson, null, 2))
  
  // 3. 保存图片
  if (sceneData.image) {
    const imageBase64 = sceneData.image.split(',')[1]
    zip.file('scene.jpg', imageBase64, { base64: true })
  }
  
  // 4. 生成ZIP
  const content = await zip.generateAsync({ type: 'blob' })
  return content
}

/**
 * 导入AR场景包 (自动识别版本)
 * @param {File} file - .arpack 或 .arscene2 文件
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
  
  // 根据版本处理
  if (manifest.type === 'webxr-ar-scene-pack') {
    return importWebXRARScene(zip, manifest)
  } else if (manifest.version === ARSCENE2_VERSION || 
      manifest.type === 'real-ar-scene-pack' || 
      manifest.type === 'true-ar-scene-pack') {
    return importRealARScene(zip, manifest)
  } else {
    return importLegacyARScene(zip, manifest)
  }
}

/**
 * 导入新版真实AR场景 (v2.0)
 */
async function importRealARScene(zip, manifest) {
  // 1. 读取场景数据
  const sceneFile = zip.file('scene.json')
  if (!sceneFile) {
    throw new Error('无效的场景包：缺少场景数据')
  }
  
  const sceneData = JSON.parse(await sceneFile.async('text'))
  
  // 2. 加载图片
  const imageFile = zip.file('scene.jpg') || zip.file('scene.png')
  if (imageFile) {
    const base64Data = await imageFile.async('base64')
    const ext = imageFile.name.split('.').pop()
    const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
    sceneData.image = `data:${mimeType};base64,${base64Data}`
  }
  
  // 3. 构建场景对象
  const isTrueAR = sceneData.type === 'true-ar-scene' || manifest.type === 'true-ar-scene-pack'
  const sceneType = isTrueAR ? 'true-ar' : 'real-ar'
  
  const scene = {
    id: `${sceneType}_scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: `${manifest.metadata?.name || sceneData.name || '真实AR场景'} (导入)`,
    type: sceneType,
    createdAt: new Date().toISOString(),
    importedAt: new Date().toISOString(),
    data: sceneData,
    // 兼容旧版格式
    backgroundType: sceneType,
    arBackground: {
      id: sceneData.id || `ar_${Date.now()}`,
      name: sceneData.name || '真实AR场景',
      type: sceneType,
      image: sceneData.image,
      planes: sceneData.planes || [],
      camera: sceneData.camera,
      referenceDistance: sceneData.referenceDistance || 3
    }
  }
  
  return scene
}

/**
 * 导入旧版AR场景 (v1.0)
 */
async function importLegacyARScene(zip, manifest) {
  if (manifest.type !== 'ar-scene-pack') {
    throw new Error('无效的场景包类型')
  }
  
  // 1. 读取场景数据
  const sceneFile = zip.file('scene.json')
  if (!sceneFile) {
    throw new Error('无效的场景包：缺少场景数据')
  }
  
  const sceneData = JSON.parse(await sceneFile.async('text'))
  
  // 2. 加载图片资源
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
  
  // 3. 加载AR数据
  if (sceneData.arDataPath) {
    const arFile = zip.file(sceneData.arDataPath)
    if (arFile) {
      const arData = JSON.parse(await arFile.async('text'))
      sceneData.arData = arData
      delete sceneData.arDataPath
    }
  }
  
  // 4. 构建场景对象
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
  return file.name.endsWith('.arpack') || 
         file.name.endsWith('.arscene') || 
         file.name.endsWith('.arscene2') ||
         file.name.endsWith('.webxrar')
}

/**
 * 获取场景缩略图
 * @param {Object} scene - 场景对象
 * @returns {string|null} - 缩略图URL
 */
export function getSceneThumbnail(scene) {
  if (!scene) return null
  
  // 真实AR场景
  if (scene.type === 'real-ar' || scene.backgroundType === 'real-ar') {
    return scene.data?.image || scene.arBackground?.image || null
  }
  
  // 图片场景
  if (scene.type === 'image' && scene.data?.imageUrl) {
    return scene.data.imageUrl
  }
  
  // AR场景
  if (scene.type === 'ar' && scene.data?.thumbnail) {
    return scene.data.thumbnail
  }
  
  return null
}

/**
 * 导入WebXR AR场景
 */
async function importWebXRARScene(zip, manifest) {
  const sceneFile = zip.file('scene.json')
  if (!sceneFile) {
    throw new Error('无效的场景包：缺少场景数据')
  }
  
  const sceneData = JSON.parse(await sceneFile.async('text'))
  
  const scene = {
    id: `webxr_scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: `${manifest.metadata?.name || sceneData.name || 'WebXR AR场景'} (导入)`,
    type: 'webxr-ar',
    createdAt: new Date().toISOString(),
    importedAt: new Date().toISOString(),
    data: sceneData,
    backgroundType: 'webxr-ar',
    arBackground: {
      id: sceneData.id || `webxr_${Date.now()}`,
      name: sceneData.name || 'WebXR AR场景',
      type: 'webxr-ar',
      planes: sceneData.planes || [],
      camera: sceneData.camera,
      webxrData: sceneData.webxrData || {}
    }
  }
  
  return scene
}

/**
 * 转换真实AR场景为项目背景格式
 * @param {Object} realARScene - 真实AR场景对象
 * @returns {Object} - 项目背景格式
 */
export function convertRealARToProjectBackground(realARScene) {
  if (!realARScene) return null
  
  const data = realARScene.data || {}
  const sceneType = realARScene.type || 'real-ar'
  
  return {
    id: realARScene.id,
    name: realARScene.name,
    type: sceneType,
    backgroundType: sceneType,
    image: data.image,
    planes: data.planes || [],
    camera: data.camera || { fov: 60, position: { x: 0, y: 0, z: 5 } },
    webxrData: data.webxrData,
    arData: {
      version: data.version || '2.0',
      type: data.type || 'real-ar-scene',
      capturedAt: data.capturedAt,
      planes: data.planes || []
    }
  }
}
