const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { execSync } = require('child_process');
const JSZip = require('jszip');
const cors = require('cors');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 确保上传和输出目录存在
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const OUTPUT_DIR = path.join(__dirname, 'outputs');
fs.ensureDirSync(UPLOAD_DIR);
fs.ensureDirSync(OUTPUT_DIR);

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.fbx') {
      cb(null, true);
    } else {
      cb(new Error('Only FBX files are allowed'));
    }
  }
});

// ヒューマノイドボーンマッピング (Mixamo -> VRM)
const humanoidBoneMapping = {
  'mixamorig:Hips': 'hips',
  'mixamorig:Spine': 'spine',
  'mixamorig:Spine1': 'chest',
  'mixamorig:Spine2': 'upperChest',
  'mixamorig:Neck': 'neck',
  'mixamorig:Head': 'head',
  'mixamorig:LeftShoulder': 'leftShoulder',
  'mixamorig:LeftArm': 'leftUpperArm',
  'mixamorig:LeftForeArm': 'leftLowerArm',
  'mixamorig:LeftHand': 'leftHand',
  'mixamorig:RightShoulder': 'rightShoulder',
  'mixamorig:RightArm': 'rightUpperArm',
  'mixamorig:RightForeArm': 'rightLowerArm',
  'mixamorig:RightHand': 'rightHand',
  'mixamorig:LeftUpLeg': 'leftUpperLeg',
  'mixamorig:LeftLeg': 'leftLowerLeg',
  'mixamorig:LeftFoot': 'leftFoot',
  'mixamorig:RightUpLeg': 'rightUpperLeg',
  'mixamorig:RightLeg': 'rightLowerLeg',
  'mixamorig:RightFoot': 'rightFoot',
  'mixamorig:LeftToeBase': 'leftToes',
  'mixamorig:RightToeBase': 'rightToes'
};

class FBXToVRMAConverter {
  constructor(fbx2gltfPath = './FBX2glTF-windows-x64.exe') {
    this.fbx2gltfPath = fbx2gltfPath;
  }

  async convert(inputPath, outputPath, framerate = 30) {
    try {
      console.log(`Converting ${inputPath} to ${outputPath}...`);
      
      // Step 1: FBXをglTFに変換
      const tempGltfPath = path.join(path.dirname(outputPath), `temp_${Date.now()}.gltf`);
      await this.convertFBXToGLTF(inputPath, tempGltfPath);
      
      // Step 2: glTFファイルを読み込み
      const gltfData = await fs.readJson(tempGltfPath);
      
      // Step 3: アニメーション時間を詳細分析して修正
      const enhancedGltfData = this.enhanceAnimationTiming(gltfData, parseInt(framerate));
      
      // Step 4: バイナリファイルを埋め込み
      const embeddedGltfData = await this.embedBinaryData(enhancedGltfData, path.dirname(tempGltfPath));
      
      // Step 5: VRMA形式に変換
      const vrmaData = this.convertToVRMAWithTiming(embeddedGltfData);
      
      // Step 6: VRMAファイルとして保存
      await fs.writeJson(outputPath, vrmaData, { spaces: 2 });
      
      // Step 7: 一時ファイルを削除
      await this.cleanupTempFiles([tempGltfPath]);
      
      console.log(`Successfully converted to ${outputPath}`);
      return { success: true, outputPath };
    } catch (error) {
      console.error('Conversion failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async convertFBXToGLTF(inputPath, outputPath) {
    const fbx2gltfFullPath = path.resolve(this.fbx2gltfPath);
    const outputDir = path.dirname(outputPath);
    const outputName = path.basename(outputPath, '.gltf');
    
    const command = `"${fbx2gltfFullPath}" -i "${inputPath}" -o "${path.join(outputDir, outputName)}" --embed`;
    console.log(`Executing: ${command}`);
    
    try {
      execSync(command, { stdio: 'pipe' });
      
      const actualOutputPath = path.join(outputDir, `${outputName}_out`, `${outputName}.gltf`);
      if (await fs.pathExists(actualOutputPath)) {
        await fs.move(actualOutputPath, outputPath);
        await fs.remove(path.join(outputDir, `${outputName}_out`));
      }
    } catch (error) {
      console.log('Embed failed, trying normal conversion...');
      await this.convertFBXToGLTFNormal(inputPath, outputPath);
    }
  }

  async convertFBXToGLTFNormal(inputPath, outputPath) {
    const fbx2gltfFullPath = path.resolve(this.fbx2gltfPath);
    const outputDir = path.dirname(outputPath);
    const outputName = path.basename(outputPath, '.gltf');
    
    const command = `"${fbx2gltfFullPath}" -i "${inputPath}" -o "${path.join(outputDir, outputName)}"`;
    
    try {
      execSync(command, { stdio: 'pipe' });
      
      const actualOutputPath = path.join(outputDir, `${outputName}_out`, `${outputName}.gltf`);
      if (await fs.pathExists(actualOutputPath)) {
        await fs.move(actualOutputPath, outputPath);
        const actualBinPath = path.join(outputDir, `${outputName}_out`, 'buffer.bin');
        const targetBinPath = path.join(outputDir, `${outputName}.bin`);
        if (await fs.pathExists(actualBinPath)) {
          await fs.move(actualBinPath, targetBinPath);
        }
        await fs.remove(path.join(outputDir, `${outputName}_out`));
      }
    } catch (error) {
      throw new Error(`FBX2glTF conversion failed: ${error.message}`);
    }
  }

  enhanceAnimationTiming(gltfData, framerate) {
    if (!gltfData.animations || gltfData.animations.length === 0) {
      return gltfData;
    }

    let maxDuration = 0;
    
    gltfData.animations.forEach((animation) => {
      if (animation.samplers && gltfData.accessors) {
        animation.samplers.forEach((sampler) => {
          if (sampler.input !== undefined && gltfData.accessors[sampler.input]) {
            const timeAccessor = gltfData.accessors[sampler.input];
            if (timeAccessor.type === 'SCALAR' && timeAccessor.max && timeAccessor.max.length > 0) {
              const endTime = timeAccessor.max[0];
              if (endTime > maxDuration) {
                maxDuration = endTime;
              }
            }
          }
        });
      }
    });

    if (!gltfData.extras) {
      gltfData.extras = {};
    }
    
    gltfData.extras.animationMetadata = {
      maxDuration: maxDuration,
      framerate: framerate,
      frameCount: Math.ceil(maxDuration * framerate),
      calculatedAt: new Date().toISOString()
    };

    return gltfData;
  }

  async embedBinaryData(gltfData, gltfDir) {
    if (!gltfData.buffers || gltfData.buffers.length === 0) {
      return gltfData;
    }

    for (let i = 0; i < gltfData.buffers.length; i++) {
      const buffer = gltfData.buffers[i];
      
      if (buffer.uri && !buffer.uri.startsWith('data:')) {
        const bufferPath = path.join(gltfDir, buffer.uri);
        
        if (await fs.pathExists(bufferPath)) {
          const bufferData = await fs.readFile(bufferPath);
          const base64Data = bufferData.toString('base64');
          const dataUri = `data:application/octet-stream;base64,${base64Data}`;
          gltfData.buffers[i].uri = dataUri;
        }
      }
    }

    return gltfData;
  }

  convertToVRMAWithTiming(gltfData) {
    let animationDuration = 5.0;
    
    if (gltfData.extras && gltfData.extras.animationMetadata) {
      animationDuration = gltfData.extras.animationMetadata.maxDuration;
    }

    const vrmaData = {
      asset: gltfData.asset,
      scene: gltfData.scene,
      scenes: gltfData.scenes,
      nodes: gltfData.nodes,
      animations: this.processAnimationsWithTiming(gltfData.animations, animationDuration),
      accessors: gltfData.accessors,
      bufferViews: gltfData.bufferViews,
      buffers: gltfData.buffers,
      samplers: gltfData.samplers,
      extensionsUsed: ['VRMC_vrm_animation'],
      extensions: {
        'VRMC_vrm_animation': {
          specVersion: '1.0',
          humanoid: {
            humanBones: this.generateHumanBones(gltfData)
          },
          meta: {
            duration: animationDuration,
            frameCount: gltfData.extras?.animationMetadata?.frameCount || 0,
            framerate: gltfData.extras?.animationMetadata?.framerate || 30
          }
        }
      }
    };

    if (gltfData.materials) vrmaData.materials = gltfData.materials;
    if (gltfData.meshes) vrmaData.meshes = gltfData.meshes;
    if (gltfData.skins) vrmaData.skins = gltfData.skins;
    if (gltfData.textures) vrmaData.textures = gltfData.textures;
    if (gltfData.images) vrmaData.images = gltfData.images;

    return vrmaData;
  }

  processAnimationsWithTiming(animations, duration) {
    if (!animations || animations.length === 0) {
      return [];
    }

    return animations.map((animation, index) => ({
      name: animation.name || `VRMAnimation${index}`,
      channels: animation.channels,
      samplers: animation.samplers,
      extras: {
        duration: duration,
        vrmAnimationMetadata: {
          calculatedDuration: duration,
          originalName: animation.name
        }
      }
    }));
  }

  generateHumanBones(gltfData) {
    const humanBones = {};
    
    if (!gltfData.nodes) {
      return humanBones;
    }

    gltfData.nodes.forEach((node, index) => {
      if (node.name && humanoidBoneMapping[node.name]) {
        const vrmBoneName = humanoidBoneMapping[node.name];
        humanBones[vrmBoneName] = { node: index };
      }
    });

    return humanBones;
  }

  async cleanupTempFiles(filePaths) {
    for (const filePath of filePaths) {
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
      }
      const binPath = filePath.replace(/\.gltf$/, '.bin');
      if (await fs.pathExists(binPath)) {
        await fs.remove(binPath);
      }
    }
  }
}

// API 路由

// 上传并转换多个 FBX 文件
app.post('/api/convert', upload.array('files'), async (req, res) => {
  try {
    const files = req.files;
    const framerate = req.body.framerate || 30;
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const converter = new FBXToVRMAConverter();
    const results = [];
    const sessionDir = path.join(OUTPUT_DIR, `session_${Date.now()}`);
    await fs.ensureDir(sessionDir);

    for (const file of files) {
      const outputFileName = path.basename(file.originalname, '.fbx') + '.vrma';
      const outputPath = path.join(sessionDir, outputFileName);
      
      const result = await converter.convert(file.path, outputPath, framerate);
      results.push({
        originalName: file.originalname,
        outputName: outputFileName,
        ...result
      });
    }

    // 创建 ZIP 文件
    const zip = new JSZip();
    const vrmaFiles = results.filter(r => r.success);
    
    for (const file of vrmaFiles) {
      const fileData = await fs.readFile(file.outputPath);
      zip.file(file.outputName, fileData);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const zipFileName = `vrma_files_${Date.now()}.zip`;
    const zipPath = path.join(sessionDir, zipFileName);
    await fs.writeFile(zipPath, zipBuffer);

    res.json({
      success: true,
      results: results,
      zipFile: zipFileName,
      downloadUrl: `/api/download/${path.basename(sessionDir)}/${zipFileName}`
    });

  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 下载 ZIP 文件
app.get('/api/download/:sessionId/:filename', async (req, res) => {
  try {
    const { sessionId, filename } = req.params;
    const filePath = path.join(OUTPUT_DIR, sessionId, filename);
    
    if (await fs.pathExists(filePath)) {
      res.download(filePath, filename);
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 清理旧文件（可选）
app.post('/api/cleanup', async (req, res) => {
  try {
    const sessionId = req.body.sessionId;
    if (sessionId) {
      const sessionDir = path.join(OUTPUT_DIR, sessionId);
      if (await fs.pathExists(sessionDir)) {
        await fs.remove(sessionDir);
      }
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`FBX to VRMA Converter Server running on http://localhost:${PORT}`);
});

module.exports = { FBXToVRMAConverter };
