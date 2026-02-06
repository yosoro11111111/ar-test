import React from 'react'
import { WebXRARSceneRecorder } from './ARMMDDirector/WebXRARSceneRecorder'
import { useNavigate } from 'react-router-dom'
import styles from './MobileRecordPage.module.css'

/**
 * 手机场景录制页面
 * 使用新的AR全景相机录制场景
 */
export function MobileRecordPage() {
  const navigate = useNavigate()

  const handleSceneRecorded = (sceneData) => {
    console.log('场景录制完成:', sceneData)
    alert('场景录制完成！文件已下载，请到MMD导演页面导入。')
    // 录制完成后留在当前页面，让用户手动关闭
  }

  return (
    <div className={styles.page}>
      <WebXRARSceneRecorder
        isOpen={true}
        onClose={() => navigate('/ar-director')}
        onSceneRecorded={handleSceneRecorded}
      />
    </div>
  )
}

export default MobileRecordPage
