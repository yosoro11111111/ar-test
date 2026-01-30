@echo off

echo Building project...
npm run build

echo Entering dist directory...
cd dist

echo Initializing git repository...
git init
git add .
git commit -m "Deploy to GitHub Pages"

echo Pushing to GitHub Pages...
git push -f https://github.com/yosoro11111111/ar-test.git master:gh-pages

echo Returning to project root...
cd ..

echo Deployment completed!
echo Your site should be available at: https://yosoro11111111.github.io/ar-test/
