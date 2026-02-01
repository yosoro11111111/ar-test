// 动作捕捉数据加载器
// 支持从 Mixamo、BVH、FBX 等格式导入真实动作数据

import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

// BVH 文件解析器
export class BVHParser {
  constructor() {
    this.bones = []
    this.frames = []
    this.frameTime = 0
  }

  parse(bvhText) {
    const lines = bvhText.split('\n')
    let currentBone = null
    let inMotion = false
    let channelIndex = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (line.startsWith('ROOT') || line.startsWith('JOINT')) {
        const boneName = line.split(' ')[1]
        currentBone = {
          name: this.normalizeBoneName(boneName),
          originalName: boneName,
          parent: this.bones.length > 0 ? this.bones[this.bones.length - 1] : null,
          offset: [0, 0, 0],
          channels: [],
          children: []
        }
        this.bones.push(currentBone)
      } else if (line.startsWith('OFFSET')) {
        const parts = line.split(' ').slice(1).map(Number)
        if (currentBone) {
          currentBone.offset = parts
        }
      } else if (line.startsWith('CHANNELS')) {
        const parts = line.split(' ')
        const channelCount = parseInt(parts[1])
        for (let j = 0; j < channelCount; j++) {
          currentBone.channels.push({
            type: parts[2 + j],
            index: channelIndex++
          })
        }
      } else if (line === 'MOTION') {
        inMotion = true
      } else if (inMotion && line.startsWith('Frames:')) {
        this.frameCount = parseInt(line.split(':')[1])
      } else if (inMotion && line.startsWith('Frame Time:')) {
        this.frameTime = parseFloat(line.split(':')[1])
      } else if (inMotion && line && !isNaN(line[0])) {
        // 动作数据行
        const values = line.split(' ').map(Number)
        this.frames.push(values)
      }
    }

    return this.convertToKeyframes()
  }

  // 标准化骨骼名称以匹配 VRM 命名
  normalizeBoneName(name) {
    const boneMap = {
      'Hips': 'hips',
      'Spine': 'spine',
      'Spine1': 'chest',
      'Spine2': 'upperChest',
      'Neck': 'neck',
      'Head': 'head',
      'LeftShoulder': 'leftShoulder',
      'LeftArm': 'leftUpperArm',
      'LeftForeArm': 'leftLowerArm',
      'LeftHand': 'leftHand',
      'RightShoulder': 'rightShoulder',
      'RightArm': 'rightUpperArm',
      'RightForeArm': 'rightLowerArm',
      'RightHand': 'rightHand',
      'LeftUpLeg': 'leftUpperLeg',
      'LeftLeg': 'leftLowerLeg',
      'LeftFoot': 'leftFoot',
      'LeftToeBase': 'leftToes',
      'RightUpLeg': 'rightUpperLeg',
      'RightLeg': 'rightLowerLeg',
      'RightFoot': 'rightFoot',
      'RightToeBase': 'rightToes'
    }
    return boneMap[name] || name.toLowerCase()
  }

  // 转换为关键帧格式
  convertToKeyframes() {
    const keyframes = []
    const fps = Math.round(1 / this.frameTime)

    for (let i = 0; i < this.frames.length; i++) {
      const frame = this.frames[i]
      const time = i * this.frameTime * 1000 // 转换为毫秒
      const bones = {}

      this.bones.forEach(bone => {
        const rotation = [0, 0, 0]
        const position = [0, 0, 0]

        bone.channels.forEach(channel => {
          const value = frame[channel.index]
          switch (channel.type) {
            case 'Xposition': position[0] = value * 0.01; break
            case 'Yposition': position[1] = value * 0.01; break
            case 'Zposition': position[2] = value * 0.01; break
            case 'Xrotation': rotation[0] = value * Math.PI / 180; break
            case 'Yrotation': rotation[1] = value * Math.PI / 180; break
            case 'Zrotation': rotation[2] = value * Math.PI / 180; break
          }
        })

        bones[bone.name] = {
          rotation,
          position: bone.name === 'hips' ? position : null
        }
      })

      keyframes.push({
        time,
        bones,
        easing: 'linear'
      })
    }

    return {
      keyframes,
      duration: this.frames.length * this.frameTime * 1000,
      fps,
      boneCount: this.bones.length
    }
  }
}

// FBX 动画提取器
export class FBXAnimationExtractor {
  static extract(animationClip, skeleton) {
    const keyframes = []
    const tracks = animationClip.tracks
    const duration = animationClip.duration * 1000 // 转换为毫秒
    const fps = 30 // 默认帧率

    // 采样帧
    const frameCount = Math.ceil(duration / 1000 * fps)
    
    for (let i = 0; i <= frameCount; i++) {
      const time = (i / frameCount) * animationClip.duration
      const timeMs = time * 1000
      const bones = {}

      tracks.forEach(track => {
        const boneName = this.normalizeTrackName(track.name)
        if (!bones[boneName]) {
          bones[boneName] = { rotation: [0, 0, 0], position: null }
        }

        // 采样轨道值
        if (track.name.includes('.quaternion')) {
          const quaternion = new THREE.Quaternion()
          track.getValueAtTime(time, quaternion)
          const euler = new THREE.Euler().setFromQuaternion(quaternion)
          bones[boneName].rotation = [euler.x, euler.y, euler.z]
        } else if (track.name.includes('.position')) {
          const position = new THREE.Vector3()
          track.getValueAtTime(time, position)
          bones[boneName].position = [position.x, position.y, position.z]
        }
      })

      keyframes.push({
        time: timeMs,
        bones,
        easing: 'linear'
      })
    }

    return {
      keyframes,
      duration,
      fps,
      trackCount: tracks.length
    }
  }

  static normalizeTrackName(trackName) {
    const name = trackName.split('.')[0]
    const boneMap = {
      'mixamorig:Hips': 'hips',
      'mixamorig:Spine': 'spine',
      'mixamorig:Spine1': 'chest',
      'mixamorig:Spine2': 'upperChest',
      'mixamorig:Neck': 'neck',
      'mixamorig:Head': 'head',
      'mixamorig:LeftShoulder': 'leftShoulder',
      'mixamorig:LeftArm': 'leftUpperArm',
      'mixamorig:LeftForeArm': 'leftLowerArm',
      'mixamorig:LeftHand': 'leftHand',
      'mixamorig:RightShoulder': 'rightShoulder',
      'mixamorig:RightArm': 'rightUpperArm',
      'mixamorig:RightForeArm': 'rightLowerArm',
      'mixamorig:RightHand': 'rightHand',
      'mixamorig:LeftUpLeg': 'leftUpperLeg',
      'mixamorig:LeftLeg': 'leftLowerLeg',
      'mixamorig:LeftFoot': 'leftFoot',
      'mixamorig:RightUpLeg': 'rightUpperLeg',
      'mixamorig:RightLeg': 'rightLowerLeg',
      'mixamorig:RightFoot': 'rightFoot'
    }
    return boneMap[name] || name.toLowerCase()
  }
}

// 动作捕捉加载器
export class MotionCaptureLoader {
  constructor() {
    this.fbxLoader = new FBXLoader()
    this.gltfLoader = new GLTFLoader()
    this.bvhParser = new BVHParser()
  }

  // 加载 BVH 文件
  async loadBVH(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const bvhText = e.target.result
          const animationData = this.bvhParser.parse(bvhText)
          resolve({
            ...animationData,
            name: file.name.replace('.bvh', ''),
            source: 'bvh',
            format: 'motion-capture'
          })
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  // 加载 FBX 动画
  async loadFBX(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      this.fbxLoader.load(
        url,
        (fbx) => {
          URL.revokeObjectURL(url)
          
          if (fbx.animations && fbx.animations.length > 0) {
            const clip = fbx.animations[0]
            const animationData = FBXAnimationExtractor.extract(clip, fbx)
            resolve({
              ...animationData,
              name: file.name.replace('.fbx', ''),
              source: 'fbx',
              format: 'motion-capture',
              originalClip: clip
            })
          } else {
            reject(new Error('FBX 文件中没有动画数据'))
          }
        },
        undefined,
        (error) => {
          URL.revokeObjectURL(url)
          reject(error)
        }
      )
    })
  }

  // 加载 GLTF/GLB 动画
  async loadGLTF(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      this.gltfLoader.load(
        url,
        (gltf) => {
          URL.revokeObjectURL(url)
          
          if (gltf.animations && gltf.animations.length > 0) {
            const clip = gltf.animations[0]
            const animationData = FBXAnimationExtractor.extract(clip, gltf.scene)
            resolve({
              ...animationData,
              name: file.name.replace(/\.(glb|gltf)$/, ''),
              source: 'gltf',
              format: 'motion-capture',
              originalClip: clip
            })
          } else {
            reject(new Error('GLTF 文件中没有动画数据'))
          }
        },
        undefined,
        (error) => {
          URL.revokeObjectURL(url)
          reject(error)
        }
      )
    })
  }

  // 自动检测格式并加载
  async load(file) {
    const extension = file.name.toLowerCase().split('.').pop()
    
    switch (extension) {
      case 'bvh':
        return this.loadBVH(file)
      case 'fbx':
        return this.loadFBX(file)
      case 'glb':
      case 'gltf':
        return this.loadGLTF(file)
      default:
        throw new Error(`不支持的文件格式: ${extension}`)
    }
  }
}

// Mixamo 动作预设库
export const MixamoActions = {
  // 基础动作
  basic: [
    { id: 'mixamo_walk', name: '走路', url: 'https://www.mixamo.com/#/?page=1&query=walk' },
    { id: 'mixamo_run', name: '跑步', url: 'https://www.mixamo.com/#/?page=1&query=run' },
    { id: 'mixamo_idle', name: '待机', url: 'https://www.mixamo.com/#/?page=1&query=idle' },
    { id: 'mixamo_jump', name: '跳跃', url: 'https://www.mixamo.com/#/?page=1&query=jump' },
    { id: 'mixamo_wave', name: '挥手', url: 'https://www.mixamo.com/#/?page=1&query=wave' }
  ],
  
  // 舞蹈动作
  dance: [
    { id: 'mixamo_dance', name: '舞蹈', url: 'https://www.mixamo.com/#/?page=1&query=dance' },
    { id: 'mixamo_hiphop', name: '街舞', url: 'https://www.mixamo.com/#/?page=1&query=hip+hop' },
    { id: 'mixamo_salsa', name: '萨尔萨', url: 'https://www.mixamo.com/#/?page=1&query=salsa' }
  ],
  
  // 战斗动作
  combat: [
    { id: 'mixamo_punch', name: '拳击', url: 'https://www.mixamo.com/#/?page=1&query=punch' },
    { id: 'mixamo_kick', name: '踢腿', url: 'https://www.mixamo.com/#/?page=1&query=kick' },
    { id: 'mixamo_sword', name: '剑术', url: 'https://www.mixamo.com/#/?page=1&query=sword' }
  ],
  
  // 表情动作
  expression: [
    { id: 'mixamo_talk', name: '说话', url: 'https://www.mixamo.com/#/?page=1&query=talk' },
    { id: 'mixamo_laugh', name: '大笑', url: 'https://www.mixamo.com/#/?page=1&query=laugh' },
    { id: 'mixamo_clap', name: '鼓掌', url: 'https://www.mixamo.com/#/?page=1&query=clap' }
  ]
}

// 导出默认实例
export const motionCaptureLoader = new MotionCaptureLoader()

export default {
  MotionCaptureLoader,
  BVHParser,
  FBXAnimationExtractor,
  MixamoActions,
  motionCaptureLoader
}
