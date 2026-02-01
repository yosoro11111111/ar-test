// Motion Pack 动作系统 - 自动加载 public/motionpack 中的 FBX 动作文件
// 使用用户的真实 Mixamo 动作数据

import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import * as THREE from 'three'

// 动作缓存
const actionCache = new Map()

// FBX 加载器
const fbxLoader = new FBXLoader()

// 预定义的动作文件列表（从目录扫描获取）
// 这些文件名对应 public/motionpack/ 目录下的 FBX 文件
const MOTION_PACK_FILES = [
  'Mixamo_walking_mixamo_Motion.Fbx',
  'Mixamo_running_mixamo_Motion.Fbx',
  'Mixamo_idle_mixamo_Motion.Fbx',
  'Mixamo_jumping_mixamo_Motion.Fbx',
  'Mixamo_dancing_mixamo_Motion.Fbx',
  'Mixamo_punching_mixamo_Motion.Fbx',
  'Mixamo_kicking_mixamo_Motion.Fbx',
  'Mixamo_waving_mixamo_Motion.Fbx',
  'Mixamo_clapping_mixamo_Motion.Fbx',
  'Mixamo_laughing_mixamo_Motion.Fbx',
  'Mixamo_talking_mixamo_Motion.Fbx',
  'Mixamo_bowing_mixamo_Motion.Fbx',
  'Mixamo_sitting_mixamo_Motion.Fbx',
  'Mixamo_standing_mixamo_Motion.Fbx',
  'Mixamo_turning_mixamo_Motion.Fbx',
  'Mixamo_crouching_mixamo_Motion.Fbx',
  'Mixamo_hip_hop_dancing_mixamo_Motion.Fbx',
  'Mixamo_salsa_dancing_mixamo_Motion.Fbx',
  'Mixamo_breakdance_mixamo_Motion.Fbx',
  'Mixamo_boxing_mixamo_Motion.Fbx',
  'Mixamo_sword_slash_mixamo_Motion.Fbx',
  'Mixamo_golf_swing_mixamo_Motion.Fbx',
  'Mixamo_baseball_pitch_mixamo_Motion.Fbx',
  'Mixamo_basketball_dribble_mixamo_Motion.Fbx',
  'Mixamo_victory_mixamo_Motion.Fbx',
  'Mixamo_defeat_mixamo_Motion.Fbx',
  'Mixamo_death_mixamo_Motion.Fbx',
  'Mixamo_hurt_mixamo_Motion.Fbx',
  'Mixamo_spell_cast_mixamo_Motion.Fbx',
  'Mixamo_magic_attack_mixamo_Motion.Fbx'
]

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

// 获取所有动作（使用预定义列表）
export function getAllMotionPackActions() {
  return MOTION_PACK_FILES.map(filename => {
    const actionName = extractActionName(filename)
    const category = categorizeAction(filename, actionName)
    
    return {
      id: `motionpack_${filename.replace('.Fbx', '')}`,
      name: actionName,
      icon: getActionIcon(category),
      category: category,
      filePath: `/motionpack/${filename}`,
      source: 'motionpack',
      // 标记为未加载
      loaded: false
    }
  })
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
  loadMotionPackAction,
  loadMotionPackActions,
  getAllMotionPackActions,
  getLoadedMotionPackActions,
  getMotionPackActionsByCategory,
  clearMotionPackCache,
  motionPackCategories,
  MOTION_PACK_FILES
}
