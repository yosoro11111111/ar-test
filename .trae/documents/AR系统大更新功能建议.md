## 修复Service Worker缓存问题

### 问题
sw.js 使用缓存优先策略，但缓存版本号没有随代码更新而改变，导致浏览器一直使用旧版本。

### 解决方案
更新 sw.js 中的缓存版本号，从 v2 改为 v3，强制重新缓存所有静态资源。

### 修改内容
1. 更新 CACHE_NAME: 'ar-studio-v2' → 'ar-studio-v3'
2. 更新 STATIC_CACHE: 'ar-studio-static-v2' → 'ar-studio-static-v3'
3. 更新 MODEL_CACHE: 'ar-studio-models-v2' → 'ar-studio-models-v3'
4. 更新 IMAGE_CACHE: 'ar-studio-images-v2' → 'ar-studio-images-v3'

这样浏览器会重新下载所有资源，确保看到最新版本。

确认后执行修改？