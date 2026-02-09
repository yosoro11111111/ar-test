/**
 * 自动生成 assets.json 脚本
 * 扫描 public 目录，自动识别所有资源文件
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '../public');
const OUTPUT_FILE = path.join(__dirname, '../public/assets.json');

// 文件扩展名分类
const FILE_TYPES = {
  characters: ['.vrm', '.glb', '.gltf'],
  props: ['.glb', '.gltf', '.obj', '.fbx'],
  scenes: ['.glb', '.gltf', '.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm', '.mov'],
  motions: ['.vmd', '.bvh', '.fbx', '.vrma'],
  music: ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'],
  effects: ['.json']
};

// 目录映射（目录名 -> 资源类型）
const DIR_MAPPING = {
  'models': 'characters',
  'model': 'characters',
  'object': 'props',
  'objects': 'props',
  'prop': 'props',
  'props': 'props',
  'scene': 'scenes',
  'scenes': 'scenes',
  'motion': 'motions',
  'motions': 'motions',
  'music': 'music',
  'musics': 'music',
  'audio': 'music',
  'sound': 'music',
  'effect': 'effects',
  'effects': 'effects'
};

// 角色名称关键词分类
const CHARACTER_CATEGORIES = {
  genshin: {
    keywords: ['Aether', 'Albedo', 'Amber', 'Arataki', 'Arlecchino', 'Baizhu', 'Barbara', 'Beidou', 'Bennett', 
               'Candace', 'Chongyun', 'Collei', 'Dehya', 'Diluc', 'Diona', 'Dori', 'Eula', 'Faruzan', 
               'Fischl', 'Ganyu', 'Gorou', 'HuTao', 'Jean', 'Kaedehara', 'Kaeya', 'Kamisato', 'Kaveh',
               'Keqing', 'Klee', 'Kujou', 'Kuki', 'Layla', 'Lisa', 'Lumine', 'Mika', 'Mona', 'Naganohara',
               'Nahida', 'Nilou', 'Ningguang', 'Noelle', 'Paimon', 'Qiqi', 'Raiden', 'Razor', 'Rosaria',
               'Sangonomiya', 'Sayu', 'Scaramouche', 'Shenhe', 'Shikanoin', 'Sucrose', 'Tartaglia', 
               'Thoma', 'Tighnari', 'Venti', 'Wanderer', 'Xiangling', 'Xiao', 'Xingqiu', 'Xinyan',
               'Yae', 'Yanfei', 'Yaoyao', 'Yelan', 'Yun', 'Zhongli'],
    name: '原神',
    icon: '🎮'
  },
  hsr: {
    keywords: ['Bronya', 'Himeko', 'Klara', 'Natasha', 'Sampo', 'Seele', 'Welt', 'aili', 'Stelle', 'Caelus'],
    name: '崩坏：星穹铁道',
    icon: '🚂'
  },
  other: {
    keywords: [],
    name: '其他',
    icon: '📦'
  }
};

// 递归扫描目录
function scanDirectory(dir, baseDir = dir) {
  const results = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 递归扫描子目录
        results.push(...scanDirectory(fullPath, baseDir));
      } else {
        const ext = path.extname(item).toLowerCase();
        const relativePath = '/' + path.relative(baseDir, fullPath).replace(/\\/g, '/');
        const parentDir = path.basename(path.dirname(fullPath)).toLowerCase();
        
        results.push({
          name: path.basename(item, ext),
          file: item,
          path: relativePath,
          ext: ext,
          size: `${(stat.size / (1024 * 1024)).toFixed(1)} MB`,
          fullPath: fullPath,
          parentDir: parentDir
        });
      }
    }
  } catch (error) {
    console.error(`扫描目录失败: ${dir}`, error.message);
  }
  
  return results;
}

// 判断角色分类
function getCharacterCategory(filename) {
  const nameWithoutExt = path.basename(filename, path.extname(filename));
  
  for (const [category, rule] of Object.entries(CHARACTER_CATEGORIES)) {
    if (category === 'other') continue;
    
    for (const keyword of rule.keywords) {
      if (nameWithoutExt.toLowerCase().includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  
  return 'other';
}

// 分类文件
function categorizeFiles(files) {
  const categorized = {
    characters: [],
    props: [],
    scenes: [],
    motions: [],
    music: [],
    effects: []
  };
  
  for (const file of files) {
    // 首先根据父目录名判断
    let typeFromDir = DIR_MAPPING[file.parentDir];
    
    if (typeFromDir) {
      categorized[typeFromDir].push(file);
      continue;
    }
    
    // 如果目录名无法判断，根据文件扩展名判断
    for (const [type, extensions] of Object.entries(FILE_TYPES)) {
      if (extensions.includes(file.ext)) {
        categorized[type].push(file);
        break;
      }
    }
  }
  
  return categorized;
}

// 生成 assets.json
function generateAssetsJson() {
  console.log('开始扫描 public 目录...');
  
  // 扫描整个 public 目录
  const allFiles = scanDirectory(PUBLIC_DIR);
  console.log(`找到 ${allFiles.length} 个文件`);
  
  // 分类文件
  const categorized = categorizeFiles(allFiles);
  
  // 按角色分类
  const characterCategories = {
    genshin: [],
    hsr: [],
    other: []
  };
  
  for (const char of categorized.characters) {
    const category = getCharacterCategory(char.file);
    characterCategories[category].push({
      name: char.name,
      file: char.file,
      path: char.path,
      size: char.size
    });
  }
  
  // 构建 assets.json 结构
  const assetsJson = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString().split('T')[0],
    categories: {
      characters: {
        name: '角色',
        icon: '👤',
        path: '/models',
        extensions: FILE_TYPES.characters,
        subCategories: {}
      },
      props: {
        name: '道具',
        icon: '📦',
        path: '/object',
        extensions: FILE_TYPES.props,
        subCategories: {
          all: {
            name: '全部道具',
            icon: '📦',
            items: categorized.props.map(f => ({ name: f.name, file: f.file, path: f.path, size: f.size }))
          }
        }
      },
      scenes: {
        name: '场景',
        icon: '🏞️',
        path: '/scene',
        extensions: FILE_TYPES.scenes,
        subCategories: {
          all: {
            name: '全部场景',
            icon: '🏞️',
            items: categorized.scenes.map(f => ({ name: f.name, file: f.file, path: f.path, size: f.size }))
          }
        }
      },
      motions: {
        name: '动作',
        icon: '🎭',
        path: '/motion',
        extensions: FILE_TYPES.motions,
        subCategories: {
          all: {
            name: '全部动作',
            icon: '🎭',
            items: categorized.motions.map(f => ({ name: f.name, file: f.file, path: f.path, size: f.size }))
          }
        }
      },
      music: {
        name: '音乐',
        icon: '🎵',
        path: '/music',
        extensions: FILE_TYPES.music,
        subCategories: {
          all: {
            name: '全部音乐',
            icon: '🎵',
            items: categorized.music.map(f => ({ name: f.name, file: f.file, path: f.path, size: f.size }))
          }
        }
      },
      effects: {
        name: '特效',
        icon: '✨',
        path: '/effects',
        extensions: FILE_TYPES.effects,
        subCategories: {
          all: {
            name: '全部特效',
            icon: '✨',
            items: categorized.effects.map(f => ({ name: f.name, file: f.file, path: f.path, size: f.size }))
          }
        }
      }
    }
  };
  
  // 填充角色数据
  for (const [categoryKey, items] of Object.entries(characterCategories)) {
    if (items.length > 0) {
      const rule = CHARACTER_CATEGORIES[categoryKey];
      assetsJson.categories.characters.subCategories[categoryKey] = {
        name: rule.name,
        icon: rule.icon,
        items: items
      };
    }
  }
  
  // 写入文件
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(assetsJson, null, 2), 'utf8');
  
  console.log('assets.json 生成完成！');
  console.log(`- 角色: ${categorized.characters.length} 个`);
  console.log(`  - 原神: ${characterCategories.genshin.length} 个`);
  console.log(`  - 星穹铁道: ${characterCategories.hsr.length} 个`);
  console.log(`  - 其他: ${characterCategories.other.length} 个`);
  console.log(`- 道具: ${categorized.props.length} 个`);
  console.log(`- 场景: ${categorized.scenes.length} 个`);
  console.log(`- 动作: ${categorized.motions.length} 个`);
  console.log(`- 音乐: ${categorized.music.length} 个`);
  console.log(`- 特效: ${categorized.effects.length} 个`);
  console.log(`输出文件: ${OUTPUT_FILE}`);
}

// 执行生成
generateAssetsJson();
