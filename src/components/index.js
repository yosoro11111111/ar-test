// 组件导出 - 清理后的核心组件
export { default as ARSystem } from './ARSystem'
export { default as CharacterSystem } from './CharacterSystem'
export { default as LoadingScreen } from './LoadingScreen'
export { default as CharacterManager } from './CharacterManager'
export { default as ActionPanel } from './ActionPanel'
export { default as StageEffectsPanel } from './StageEffectsPanel'
export { default as SceneManager } from './SceneManager'
export { default as PosePanel } from './PosePanel'
export { default as AnimeSidebar } from './AnimeSidebar'

// ARSystem 依赖的组件
export { default as VideoRecorder } from './VideoRecorder'
export { default as PlaylistPanel } from './PlaylistPanel'
export { default as ActionRecorder } from './ActionRecorder'
export { default as SceneTemplatePanel } from './SceneTemplatePanel'
export { default as ShareCardGenerator } from './ShareCardGenerator'
export { default as ModelDownloader } from './ModelDownloader'

// 数据导出
export { furnitureList, furnitureCategories } from '../data/furniture'
export { 
  fetchVRMAList,
  getAllVRMAActions,
  loadVRMAAction,
  clearVRMACache
} from '../data/vrmaActions'
