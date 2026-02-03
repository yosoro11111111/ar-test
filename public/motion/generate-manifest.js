const fs = require('fs');
const path = require('path');

const motionDir = __dirname;
const files = fs.readdirSync(motionDir)
  .filter(f => f.endsWith('.vrma'))
  .sort();

const manifest = {
  version: 1,
  basePath: '/motion/',
  totalFiles: files.length,
  files: files
};

fs.writeFileSync(
  path.join(motionDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);

console.log(`✅ Manifest generated with ${files.length} files`);
