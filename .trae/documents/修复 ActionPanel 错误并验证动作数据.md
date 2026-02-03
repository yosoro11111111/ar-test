## 修复计划

### 1. 修复 ActionPanel.jsx 变量初始化顺序错误
**问题**：第 55 行使用了 `loadedList`，但它在第 52 行才被定义，导致 "Cannot access 'loadedList' before initialization" 错误。

**修复方案**：
- 将 `const [loadedList, setLoadedList] = useState([])` 移到第 52 行之前（建议移到第 42 行左右，和其他 useState 一起）
- 确保 `loadedList` 在 `allActions` useMemo 之前定义

### 2. 动作数据说明
你的动作数据**已经是真实的 VRMA 格式**！数据来自：
- 文件：`/public/motion/manifest.json` 中列出了 200+ 个 `.vrma` 文件
- 类型：标准 VRM Animation 格式
- 包含：基础动作、舞蹈、战斗、表情、运动、特殊动作等

动作通过 `vrmaActions.js` 加载：
1. `fetchVRMAList()` 从 manifest.json 获取动作列表
2. `loadVRMAAction()` 使用 Three.js VRMAnimationLoaderPlugin 加载动作
3. `createVRMAnimationClip()` 将动作应用到 VRM 模型

### 3. 需要修改的文件
- `src/components/ActionPanel.jsx` - 修复变量顺序

### 4. 验证步骤
1. 修复后刷新页面
2. 打开动作面板
3. 选择动作查看是否能正确播放

确认后我将执行修复。