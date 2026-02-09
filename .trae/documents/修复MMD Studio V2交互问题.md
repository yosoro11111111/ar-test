## 问题总结

根据用户反馈和代码分析，需要解决以下4个问题：

### 1. 动作拖放提示问题
**问题**: 拖动动作到动画页签，显示"请将动作拖放到角色的动作轨道上"
**原因**: `handleDropMotion` 函数在没有找到角色或动作轨道时显示提示
**解决方案**: 修改逻辑，当拖放动作到时间轴时，自动使用第一个角色的动作轨道，而不是提示用户

### 2. 统一加号和拖放交互
**问题**: 点击人物加号和拖动人物到时间轴，应该有一致的效果
**原因**: 
- 点击"+"按钮调用 `onAddToScene` -> `handleAddToScene` -> `handleAddCharacter`
- 拖放到时间轴调用 `handleDropResourceToTimeline` -> `handleDropCharacter`
- 两个函数逻辑不一致
**解决方案**: 
- 统一两个函数的逻辑，都调用相同的底层函数
- 点击"+"和拖放都应该：添加角色到项目、创建轨道、加载3D模型到场景

### 3. 动作资源分类和中文显示
**问题**: 动作资源需要分门别类，并且显示中文
**原因**: 
- 当前分类使用英文categoryKey
- 需要映射为中文显示
**解决方案**: 
- 创建分类名称映射表（中文）
- 修改LeftPanel的分类显示逻辑
- 按分类分组显示动作资源

### 4. 修复ResourcePackModal错误
**问题**: `TypeError: resourceManager?.getLocalResources is not a function`
**原因**: ResourcePackModal中调用了不存在的方法
**解决方案**: 检查并修复ResourcePackModal中的方法调用

## 具体修改计划

### 文件1: `index.jsx`
1. 修改 `handleDropMotion` - 自动使用第一个角色的动作轨道
2. 统一 `handleAddCharacter` 和 `handleDropCharacter` 逻辑
3. 确保两者都调用 `renderEngine.current.loadVRMCharacter()`

### 文件2: `LeftPanel.jsx`
1. 添加动作分类映射表（中文）
2. 修改分类筛选逻辑，支持中文显示
3. 按分类分组显示动作资源

### 文件3: `ResourcePackModal.jsx`
1. 修复 `getLocalResources` 方法调用错误
2. 替换为正确的方法名

### 文件4: `CenterPanel.module.css`
1. 确保 `.viewport` 类已正确定义（已完成）

## 预期结果
1. ✅ 动作可以拖放到时间轴任意位置，自动分配到角色动作轨道
2. ✅ 点击"+"和拖放资源效果一致，都能加载3D模型
3. ✅ 动作资源按分类显示（舞蹈/表情/姿势等），使用中文
4. ✅ 控制台不再显示ResourcePackModal错误