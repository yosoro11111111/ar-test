#!/bin/bash

# 构建项目
echo "Building project..."
npm run build

# 进入构建目录
cd dist

# 初始化git仓库
git init
git add .
git commit -m "Deploy to GitHub Pages"

# 推送到GitHub Pages
git push -f https://github.com/yosoro11111111/ar-test.git master:gh-pages

# 回到项目根目录
cd ..

echo "Deployment completed!"
echo "Your site should be available at: https://yosoro11111111.github.io/ar-test/"
