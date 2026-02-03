## 总体目标
- 全面改用 public/motion 下的 .vrma 动作文件，弃用旧的 Mixamo FBX 动作系统。
- 重写动作面板，自动读取 VRMA 列表，文件名翻译为中文并分门别类显示。
- 在 AR 场景中集成 VRMA 播放，支持即点即播、收藏、最近使用、搜索等。

## 现状诊断
- 动作来源仍依赖 FBX：现有面板与播放均依赖 motionpack（FBX）。参考：[ActionPanel.jsx](file:///e:/project/yosoro/ar-test/src/components/ActionPanel.jsx)、[motionPackActions.js](file:///e:/project/yosoro/ar-test/src/data/motionPackActions.js)
- 项目已包含大量 VRMA：位于 [public/motion](file:///e:/project/yosoro/ar-test/public/motion)（示例：Goalkeeper Left Diving Save.vrma）。
- AR 场景未集成 VRMA 播放：当前仍围绕 FBX。参考：[ARSystem.jsx](file:///e:/project/yosoro/ar-test/src/components/ARSystem.jsx)
- 双指缩放 Hook 已有实现：可用于移动端缩放。参考：[useGesture.js](file:///e:/project/yosoro/ar-test/src/hooks/useGesture.js)

## 技术方案
- 依赖与加载
  - 新增依赖：@pixiv/three-vrm-animation，用于解析 .vrma 并创建 Clip（参考官方示例：VRMAnimationLoaderPlugin / createVRMAnimationClip）。
  - 在 ARSystem 中集成：使用 GLTFLoader 注册 VRMAnimationLoaderPlugin，加载 /motion/*.vrma，基于当前 VRM 生成 AnimationClip，交给 THREE.AnimationMixer 播放。
  - 缓存策略：按文件路径缓存已加载的 VRMA Clip，重复播放零延迟。
- 动作清单（自动读取）
  - 方案：在 public/motion 旁新增 manifest（如 public/motion/manifest.json），由构建脚本扫描 .vrma 生成；运行时拉取该 JSON 以获得完整文件列表。
  - 备选：若后续按子目录分类（如 motion/dance、motion/combat），清单可携带分类元数据。
- 中文翻译与分类
  - 翻译规则：基于词典 + 规则的英文→中文映射，保留序号与括号；未覆盖词保留英文以避免误译。
    - 词典示例：Idle→待机、Walk→走路、Run→奔跑、Jump→跳跃、Turn→转身、Crouch→下蹲、Sit→坐下、Stand→站立、Dance→舞蹈、Breakdance→霹雳舞、Capoeira→卡波埃拉、Boxing→拳击、Kick→踢腿、Punch→出拳、Sword→大剑/剑、Gun/Shot→枪/射击、Aim→瞄准、Magic/Spell→魔法/施法、Victory→胜利、Defeat→失败、Death→死亡、Happy→开心、Laugh→大笑、Clap→鼓掌、Wave→挥手、Cheer→欢呼、Agree→同意等。
  - 分类规则：关键词映射到「基础、舞蹈、战斗、表情、运动、特殊、其他」，与现有类别保持一致；若存在子目录则优先用目录分类。
- 动作面板重写（VRMA 版）
  - 数据源：读取 manifest 生成动作项（id、中文名、类别、图标、文件路径、loaded 标记）。
  - 交互：网格/列表视图、中文搜索、收藏/最近、类别统计、空态与清除筛选。
  - 性能：列表虚拟化（如仅渲染可视区）、首次打开渐进加载。
- 清理老代码
  - 删除/停用：src/data/motionPackActions.js 及其引用、FBXLoader 相关逻辑、public/motionpack 的使用路径。
  - 保留：PosePanel、StageEffects 等不依赖动作来源的模块。

## 变更文件
- package.json：添加 @pixiv/three-vrm-animation 依赖，确保 three 与 @pixiv/three-vrm 版本兼容。
- 新增 src/data/vrmaActions.js：
  - fetch /motion/manifest.json 获取全部 .vrma 列表
  - 翻译与分类函数、图标映射、缓存结构
  - loadVRMAAction(filePath, vrm) 返回 { clip, duration, meta }
- 新增 public/motion/manifest.json：包含所有 VRMA 文件名与可选分类元数据（初版从仓库扫描生成）。
- 重写 src/components/ActionPanel.jsx：改为 VRMA 动作面板（保留原交互，但数据源改为 vrmaActions）。
- 更新 src/components/ARSystem.jsx：
  - 集成 VRMAnimationLoaderPlugin + createVRMAnimationClip
  - onSelectAction 时加载/播放 VRMA Clip（支持循环/单次）
  - 绑定 useGesture 的 onPinch：缩放当前 VRM 或相机距离，实现双指放大缩小。
- 更新 src/App.jsx：
  - 将动作入口切换到新的 VRMA 面板
  - 删除强制导入旧 motionPack 的代码

## 验证与测试
- 功能验证
  - 启动开发预览，自动读取 manifest，面板展示中文名称和类别计数。
  - 选择 3 个代表性 VRMA（基础/舞蹈/战斗）即点即播，切换无报错。
  - 收藏/最近使用记录持久化（localStorage）。
- 移动端体验
  - 双指捏合缩放模型；面板在窄屏下采用移动布局；滚动与触控无冲突。
- 性能与稳定性
  - 首次打开面板渲染时间、动作切换延迟；异常文件（损坏 VRMA）容错与提示。

## 交付与清理
- 第 1 次提交：完成依赖、manifest、VRMA 面板、AR 播放与基本分类/翻译，移除 FBX 旧逻辑。
- 第 2 次提交：完善词典覆盖率与分类准确度、列表虚拟化优化、可选子目录分类支持。
- 兼容层（可选）：若需保留 FBX，后续提供统一接口适配。

—— 执行后，动作系统将全部基于 VRMA，界面以中文展示并清晰分类，移动端与桌面端均获得更好的使用体验。