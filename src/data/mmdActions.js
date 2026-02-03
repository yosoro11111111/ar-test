// MMD动作工具函数

// 关键帧插值函数
export function interpolateKeyframes(keyframes, currentTime, duration) {
  if (!keyframes || keyframes.length === 0) return null
  
  // 循环时间
  const loopedTime = currentTime % duration
  
  // 找到当前时间所在的关键帧区间
  for (let i = 0; i < keyframes.length - 1; i++) {
    const currentFrame = keyframes[i]
    const nextFrame = keyframes[i + 1]
    
    if (loopedTime >= currentFrame.time && loopedTime <= nextFrame.time) {
      // 计算插值系数
      const t = (loopedTime - currentFrame.time) / (nextFrame.time - currentFrame.time)
      
      // 线性插值
      return {
        position: {
          x: currentFrame.position.x + (nextFrame.position.x - currentFrame.position.x) * t,
          y: currentFrame.position.y + (nextFrame.position.y - currentFrame.position.y) * t,
          z: currentFrame.position.z + (nextFrame.position.z - currentFrame.position.z) * t
        },
        rotation: {
          x: currentFrame.rotation.x + (nextFrame.rotation.x - currentFrame.rotation.x) * t,
          y: currentFrame.rotation.y + (nextFrame.rotation.y - currentFrame.rotation.y) * t,
          z: currentFrame.rotation.z + (nextFrame.rotation.z - currentFrame.rotation.z) * t
        }
      }
    }
  }
  
  // 返回最后一帧
  return keyframes[keyframes.length - 1]
}

export default { interpolateKeyframes }
