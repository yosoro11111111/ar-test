// 扫描 motionpack 目录中的所有 FBX 文件并生成动作列表
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const motionpackDir = path.join(__dirname, '../public/motionpack');
const outputFile = path.join(__dirname, '../src/data/motionPackFiles.json');

// 读取所有 FBX 文件
function scanMotionFiles() {
  const files = fs.readdirSync(motionpackDir)
    .filter(file => file.endsWith('.Fbx') || file.endsWith('.fbx'))
    .sort();
  
  console.log(`找到 ${files.length} 个动作文件`);
  
  // 保存到 JSON 文件
  fs.writeFileSync(outputFile, JSON.stringify(files, null, 2));
  
  console.log(`动作列表已保存到: ${outputFile}`);
  
  // 按首字母分组统计
  const groups = {};
  files.forEach(file => {
    const firstLetter = file.charAt(0).toUpperCase();
    if (!groups[firstLetter]) groups[firstLetter] = 0;
    groups[firstLetter]++;
  });
  
  console.log('\n按首字母分布:');
  Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([letter, count]) => {
      console.log(`  ${letter}: ${count} 个文件`);
    });
  
  return files;
}

// 生成动作分类统计
function generateStats(files) {
  const categories = {
    '基础': ['idle', 'walk', 'run', 'jump', 'stand', 'sit', 'crouch', 'turn', 'bow', 'breathing'],
    '舞蹈': ['dance', 'dancing', 'breakdance', 'hip hop', 'salsa', 'capoeira', 'cartwheel', 'can can', 'belly', 'booty', 'bboy', 'brooklyn', 'uprock', 'freeze', 'footwork', 'swipes', '1990', 'chicken', 'catwalk', 'macarena', 'moonwalk', 'house', 'jazz', 'twerk'],
    '战斗': ['punch', 'kick', 'fight', 'boxing', 'mma', 'combat', 'hit', 'attack', 'block', 'sword', 'gun', 'shoot', 'aim', 'stab', 'bash', 'assassination', 'bayonet', 'jab', 'cross', 'body', 'evade', 'armada', 'chapa', 'bencao', 'au', 'hook', 'elbow', 'sweep', 'slam', 'hurricane'],
    '表情': ['talk', 'laugh', 'cry', 'clap', 'wave', 'kiss', 'happy', 'sad', 'angry', 'cheer', 'agree', 'acknowledge', 'annoyed', 'bored', 'cocky', 'bashful', 'beckon', 'call', 'blow', 'excited', 'disappointed', 'insult'],
    '运动': ['golf', 'baseball', 'football', 'basketball', 'soccer', 'tennis', 'burpee', 'crunch', 'squat', 'bicycle', 'air', 'batter', 'pitch', 'umpire', 'dribble', 'header', 'hike'],
    '特殊': ['die', 'death', 'hurt', 'magic', 'spell', 'cast', 'victory', 'defeat', 'strangled', 'electrocuted', 'carried', 'carry', 'backflip', 'big', 'fall', 'dying', 'knocked', 'injured'],
    '其他': []
  };
  
  const stats = {};
  Object.keys(categories).forEach(cat => stats[cat] = 0);
  
  files.forEach(file => {
    const lowerFile = file.toLowerCase();
    let categorized = false;
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (category === '其他') continue;
      
      for (const keyword of keywords) {
        if (lowerFile.includes(keyword)) {
          stats[category]++;
          categorized = true;
          break;
        }
      }
      if (categorized) break;
    }
    
    if (!categorized) {
      stats['其他']++;
    }
  });
  
  console.log('\n动作分类统计:');
  Object.entries(stats)
    .sort(([,a], [,b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`  ${category}: ${count} 个`);
    });
}

// 主函数
function main() {
  console.log('正在扫描动作文件...\n');
  const files = scanMotionFiles();
  generateStats(files);
}

main();
