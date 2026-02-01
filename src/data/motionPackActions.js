// Motion Pack 动作系统 - 自动加载 public/motionpack 中的 FBX 动作文件
// 使用用户的真实 Mixamo 动作数据

import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import * as THREE from 'three'

// 动作缓存
const actionCache = new Map()

// FBX 加载器
const fbxLoader = new FBXLoader()

// 从文件名提取动作名称
function extractActionName(filename) {
  // 移除前缀和后缀
  let name = filename
    .replace('Mixamo_', '')
    .replace('_mixamo_Motion.Fbx', '')
    .replace(/_/g, ' ')
    .replace(/\d+/g, '')
    .trim()
  
  // 首字母大写
  return name.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
}

// 自动分类动作
function categorizeAction(filename, name) {
  const lower = filename.toLowerCase()
  
  // 基础动作
  if (lower.includes('idle') || lower.includes('stand')) return '基础'
  if (lower.includes('walk') || lower.includes('run') || lower.includes('jog')) return '基础'
  if (lower.includes('jump') || lower.includes('fall') || lower.includes('land')) return '基础'
  
  // 舞蹈动作
  if (lower.includes('dance') || lower.includes('dancing')) return '舞蹈'
  if (lower.includes('breakdance') || lower.includes('twerk') || lower.includes('macarena')) return '舞蹈'
  if (lower.includes('salsa') || lower.includes('hip hop') || lower.includes('moonwalk')) return '舞蹈'
  
  // 战斗动作
  if (lower.includes('punch') || lower.includes('kick') || lower.includes('fight')) return '战斗'
  if (lower.includes('boxing') || lower.includes('mma') || lower.includes('combat')) return '战斗'
  if (lower.includes('hit') || lower.includes('attack') || lower.includes('block')) return '战斗'
  if (lower.includes('sword') || lower.includes('gun') || lower.includes('shoot')) return '战斗'
  
  // 表情动作
  if (lower.includes('talk') || lower.includes('laugh') || lower.includes('cry')) return '表情'
  if (lower.includes('clap') || lower.includes('wave') || lower.includes('kiss')) return '表情'
  if (lower.includes('happy') || lower.includes('sad') || lower.includes('angry')) return '表情'
  
  // 运动动作
  if (lower.includes('golf') || lower.includes('baseball') || lower.includes('football')) return '运动'
  if (lower.includes('basketball') || lower.includes('soccer') || lower.includes('tennis')) return '运动'
  
  // 特殊动作
  if (lower.includes('die') || lower.includes('death') || lower.includes('hurt')) return '特殊'
  if (lower.includes('magic') || lower.includes('spell') || lower.includes('cast')) return '特殊'
  
  return '其他'
}

// 获取动作图标
function getActionIcon(category) {
  const icons = {
    '基础': '👤',
    '舞蹈': '💃',
    '战斗': '⚔️',
    '表情': '😊',
    '运动': '⚽',
    '特殊': '✨',
    '其他': '🎭'
  }
  return icons[category] || '🎭'
}

// 扫描 motionpack 目录中的动作文件
// 注意：实际文件列表需要在构建时或运行时通过 API 获取
export async function scanMotionPackFiles() {
  try {
    // 尝试通过 fetch 获取目录列表
    const response = await fetch('/motionpack/')
    if (!response.ok) throw new Error('无法读取目录')
    
    const html = await response.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const links = doc.querySelectorAll('a')
    
    const fbxFiles = []
    links.forEach(link => {
      const href = link.getAttribute('href')
      if (href && href.endsWith('.Fbx')) {
        fbxFiles.push(href)
      }
    })
    
    return fbxFiles
  } catch (error) {
    console.warn('扫描 motionpack 目录失败:', error)
    return []
  }
}

// 预定义的动作文件列表（作为备用）
// 实际使用时应该动态扫描
export const motionPackFileList = [
  // 这里会在构建时自动填充
]

// 加载单个 FBX 动作
export async function loadMotionPackAction(filePath) {
  const cacheKey = filePath
  
  // 检查缓存
  if (actionCache.has(cacheKey)) {
    return actionCache.get(cacheKey)
  }
  
  return new Promise((resolve, reject) => {
    fbxLoader.load(
      filePath,
      (fbx) => {
        if (fbx.animations && fbx.animations.length > 0) {
          const clip = fbx.animations[0]
          const filename = filePath.split('/').pop()
          const actionName = extractActionName(filename)
          const category = categorizeAction(filename, actionName)
          
          const actionData = {
            id: `motionpack_${filename.replace('.Fbx', '')}`,
            name: actionName,
            icon: getActionIcon(category),
            category: category,
            filePath: filePath,
            duration: clip.duration * 1000,
            clip: clip,
            fbx: fbx,
            source: 'motionpack'
          }
          
          // 缓存
          actionCache.set(cacheKey, actionData)
          resolve(actionData)
        } else {
          reject(new Error('FBX 文件中没有动画'))
        }
      },
      undefined,
      (error) => {
        reject(error)
      }
    )
  })
}

// 批量加载动作
export async function loadMotionPackActions(filePaths, onProgress) {
  const actions = []
  
  for (let i = 0; i < filePaths.length; i++) {
    try {
      const action = await loadMotionPackAction(filePaths[i])
      actions.push(action)
      onProgress?.(i + 1, filePaths.length, action)
    } catch (error) {
      console.warn(`加载动作失败 ${filePaths[i]}:`, error)
    }
  }
  
  return actions
}

// 获取已加载的动作列表
export function getLoadedMotionPackActions() {
  return Array.from(actionCache.values())
}

// 根据分类获取动作
export function getMotionPackActionsByCategory(category) {
  return Array.from(actionCache.values()).filter(a => a.category === category)
}

// 清除缓存
export function clearMotionPackCache() {
  actionCache.clear()
}

// 动作分类列表
export const motionPackCategories = [
  { id: 'all', name: '全部', icon: '✨' },
  { id: '基础', name: '基础', icon: '👤' },
  { id: '舞蹈', name: '舞蹈', icon: '💃' },
  { id: '战斗', name: '战斗', icon: '⚔️' },
  { id: '表情', name: '表情', icon: '😊' },
  { id: '运动', name: '运动', icon: '⚽' },
  { id: '特殊', name: '特殊', icon: '✨' },
  { id: '其他', name: '其他', icon: '🎭' }
]

// 导出默认对象
export default {
  scanMotionPackFiles,
  loadMotionPackAction,
  loadMotionPackActions,
  getLoadedMotionPackActions,
  getMotionPackActionsByCategory,
  clearMotionPackCache,
  motionPackCategories
}
