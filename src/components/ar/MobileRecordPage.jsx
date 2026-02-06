import React from 'react'
import { ARSceneCameraRecorder } from './ARMMDDirector/ARSceneCameraRecorder'
import { useNavigate } from 'react-router-dom'
import styles from './MobileRecordPage.module.css'

/**
 * 手机场景录制页面
 * 独立的页面用于手机录制AR场景
 */
export function MobileRecordPage() {
  const navigate = useNavigate()

  const handleSceneRecorded = (sceneData) => {
    console.log('场景录制完成:', sceneData)
    // 可以选择跳转到MMD导演页面或保存到本地
    alert('场景录制完成！已保存到本地。')
    navigate('/ar-director/mmd')
  }

  return (
    <div className={styles.page}>
      <ARSceneCameraRecorder
        isOpen={true}
        onClose={() => navigate('/ar-director')}
        onSceneRecorded={handleSceneRecorded}
      />
    </div>
  )
}

export default MobileRecordPage
