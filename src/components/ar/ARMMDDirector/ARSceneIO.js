import JSZip from 'jszip'

/**
 * AR场景导入导出工具 - 仅支持 .arcjpack 格式
 * 
 * .arcjpack 文件结构:
 *   ├── manifest.json      # 场景元数据
 *   ├── scene.json         # 场景数据(包含多平面配置)
 *   ├── scene.jpg          # 场景背景图片
 *   └── images/            # 所有平面图片
 */

/**
 * 导出AR场景包 - arcjpack 格式
 * @param {Object} scene - 场景对象
 * @returns {Promise<Blob>} - ZIP文件Blob
 */
export async function exportARScenePack(scene) {
  const zip = new JSZip()
  
  // 1. 创建清单文件
  const manifest = {
    version: '4.0',
    type: 'arcjpack',
    format: 'ar-cinematic-pack',
    createdAt: new Date().toISOString(),
    metadata: {
      name: scene.name,
      type: 'ar-multi-plane',
      planeCount: scene.data?.planes?.length || 0
    }
  }
  zip.file('manifest.json', JSON.stringify(manifest, null, 2))
  
  // 2. 准备场景数据
  const sceneData = {
    version: '4.0',
    type: 'ar-multi-plane-scene',
    format: 'arcjpack',
    name: scene.name,
    capturedAt: scene.createdAt || new Date().toISOString(),
    planes: scene.data?.planes || [],
    camera: scene.data?.camera,
    sceneBounds: scene.data?.sceneBounds,
    renderConfig: scene.data?.renderConfig
  }
  zip.file('scene.json', JSON.stringify(sceneData, null, 2))
  
  // 3. 添加场景图片
  if (scene.data?.image) {
    const imageData = scene.data.image
    if (imageData.startsWith('data:')) {
      const base64Data = imageData.split(',')[1]
      zip.file('scene.jpg', base64Data, { base64: true })
    }
  }
  
  // 4. 添加平面图片
  if (scene.data?.planeImages && scene.data.planeImages.length > 0) {
    const imagesFolder = zip.folder('images')
    scene.data.planeImages.forEach((imgData, index) => {
      if (imgData.startsWith('data:')) {
        const base64Data = imgData.split(',')[1]
        imagesFolder.file(`plane_${index}.jpg`, base64Data, { base64: true })
      }
    })
  }
  
  // 5. 生成ZIP文件
  return await zip.generateAsync({ type: 'blob' })
}

/**
 * 导入AR场景包 - 仅支持 .arcjpack 格式
 * @param {File} file - 场景包文件
 * @returns {Promise<Object>} - 场景对象
 */
export async function importARScenePack(file) {
  // 1. 读取ZIP文件
  const zip = await JSZip.loadAsync(file)
  
  // 2. 读取清单文件
  const manifestFile = zip.file('manifest.json')
  if (!manifestFile) {
    throw new Error('无效的场景包：缺少清单文件')
  }
  
  const manifest = JSON.parse(await manifestFile.async('text'))
  
  // 只支持 arcjpack 格式
  if (manifest.type !== 'arcjpack' && manifest.format !== 'ar-cinematic-pack') {
    throw new Error('不支持的文件格式，请使用 .arcjpack 文件')
  }
  
  return importARCJPackScene(zip, manifest)
}

/**
 * 导入ARCJPack场景 - 专门用于时间轴和MMD渲染
 */
async function importARCJPackScene(zip, manifest) {
  // 1. 读取场景数据
  const sceneFile = zip.file('scene.json')
  if (!sceneFile) {
    throw new Error('无效的ARCJPack：缺少场景数据')
  }
  
  const sceneData = JSON.parse(await sceneFile.async('text'))
  
  // 2. 加载场景图片
  const imageFile = zip.file('scene.jpg') || zip.file('scene.png')
  let imageDataUrl = null
  
  if (imageFile) {
    const base64Data = await imageFile.async('base64')
    const ext = imageFile.name.split('.').pop()
    const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
    imageDataUrl = `data:${mimeType};base64,${base64Data}`
  }
  
  // 3. 加载所有平面图片
  const planeImages = []
  const imagesFolder = zip.folder('images')
  if (imagesFolder) {
    // 直接通过文件名获取每个图片
    for (let i = 0; i < 10; i++) {
      const fileName = `plane_${i}.jpg`
      const imgFile = imagesFolder.file(fileName)
      if (imgFile) {
        console.log(`找到图片文件: ${fileName}`)
        
        // 使用 arraybuffer 读取，然后手动转换为 base64
        const arrayBuffer = await imgFile.async('arraybuffer')
        const bytes = new Uint8Array(arrayBuffer)
        let binary = ''
        for (let j = 0; j < bytes.byteLength; j++) {
          binary += String.fromCharCode(bytes[j])
        }
        const base64Data = btoa(binary)
        
        console.log(`图片[${i}] ${fileName} base64长度:`, base64Data.length)
        console.log(`图片[${i}] ${fileName} base64前100字符:`, base64Data.substring(0, 100))
        
        planeImages[i] = `data:image/jpeg;base64,${base64Data}`
      }
    }
  }
  console.log('加载的平面图片数量:', planeImages.length)
  // 检查每个图片的内容是否不同
  planeImages.forEach((img, i) => {
    console.log(`planeImages[${i}] 长度:`, img.length, '前100字符:', img.substring(0, 100))
  })
  
  // 4. 构建时间轴兼容的场景对象
  const scene = {
    id: `arcjpack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: `${manifest.metadata?.name || sceneData.name || 'AR场景'} (导入)`,
    type: 'arcjpack',
    format: 'ar-cinematic-pack',
    createdAt: new Date().toISOString(),
    importedAt: new Date().toISOString(),
    // 时间轴渲染数据
    data: {
      ...sceneData,
      type: 'arcjpack',  // 确保类型正确
      image: imageDataUrl,
      planeImages,
      // MMD渲染配置
      mmdRenderConfig: {
        // 背景设置
        background: {
          type: 'image',
          image: imageDataUrl,
          enable3DPlanes: true
        },
        // 3D平面设置
        planes3D: sceneData.planes || [],
        // 相机设置
        camera: sceneData.camera || {
          position: { x: 0, y: 3, z: 5 },
          lookAt: { x: 0, y: 0, z: 0 }
        },
        // 光照设置
        lighting: {
          ambient: { color: 0xffffff, intensity: 0.6 },
          directional: { color: 0xffffff, intensity: 0.8, position: { x: 5, y: 10, z: 5 } }
        },
        // 阴影设置
        shadows: {
          enabled: true,
          type: 'PCFSoftShadowMap'
        },
        // MMD角色放置配置
        characterPlacement: {
          // 可以放置角色的平面
          validPlanes: sceneData.planes?.map((p, i) => ({
            planeIndex: i,
            worldPosition: p.worldPosition,
            anchorPoints: p.anchorPoints || []
          })) || [],
          // 默认角色位置（第一个平面的中心）
          defaultPosition: sceneData.planes?.[0]?.worldPosition || { x: 0, y: 0, z: 0 }
        }
      }
    },
    // 背景类型
    backgroundType: 'arcjpack',
    // AR背景数据（用于预览）
    arBackground: {
      id: sceneData.id || `arcjpack_${Date.now()}`,
      name: sceneData.name || 'AR场景',
      type: 'arcjpack',
      image: imageDataUrl,
      planeImages,
      planes: sceneData.planes || [],
      camera: sceneData.camera,
      sceneBounds: sceneData.sceneBounds,
      renderConfig: sceneData.renderConfig,
      imageDimensions: sceneData.image
    },
    // 时间轴轨道数据
    timelineData: {
      // 场景轨道配置
      sceneTrack: {
        type: 'scene',
        background: imageDataUrl,
        planes3D: sceneData.planes || [],
        camera: sceneData.camera
      },
      // 角色可以使用的平面
      validPlacementPlanes: sceneData.planes?.map((p, i) => ({
        planeIndex: i,
        name: `平面 ${i + 1}`,
        worldPosition: p.worldPosition,
        realSize: p.realSize,
        anchorPoints: p.anchorPoints || []
      })) || []
    }
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
  return file.name.endsWith('.arcjpack')
}

/**
 * 获取场景缩略图
 * @param {Object} scene - 场景对象
 * @returns {string|null} - 缩略图URL
 */
export function getSceneThumbnail(scene) {
  if (!scene) return null
  
  // arcjpack 场景
  if (scene.type === 'arcjpack') {
    return scene.data?.image || scene.arBackground?.image || null
  }
  
  return null
}

/**
 * 转换场景为项目背景格式
 * @param {Object} scene - 场景对象
 * @returns {Object} - 项目背景格式
 */
export function convertSceneToProjectBackground(scene) {
  if (!scene) return null
  
  if (scene.type === 'arcjpack') {
    return {
      id: scene.id,
      name: scene.name,
      type: 'arcjpack',
      backgroundType: 'arcjpack',
      image: scene.data?.image,
      planes: scene.data?.planes || [],
      camera: scene.data?.camera,
      sceneBounds: scene.data?.sceneBounds,
      mmdRenderConfig: scene.data?.mmdRenderConfig,
      timelineData: scene.timelineData
    }
  }
  
  return null
}
