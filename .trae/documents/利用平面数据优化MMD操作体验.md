## 问题分析
AR多平面录制界面显示两个数为0，无法检测平面。

## 根本原因
1. `detectPlanes` 函数中使用了 `isARDetecting` 状态，但这是闭包，捕获的是旧值
2. 当 `isARDetecting` 变化时，函数内部的判断条件不会更新
3. 导致检测循环可能在第一次运行后就停止了

## 修复方案
1. 使用 `useRef` 存储 `isARDetectingRef` 来跟踪检测状态
2. 在 `startARSession` 和 `stopCapture` 中更新 ref
3. `detectPlanes` 函数中使用 ref 而不是 state

## 其他改进
1. 添加更详细的错误提示
2. 确保视频流正确显示
3. 添加调试日志

## 修改文件
- `ARSceneCameraRecorder.jsx`

需要确认修复方案吗？