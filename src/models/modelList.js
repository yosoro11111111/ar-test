// 模型列表 - 使用英文名，包含标签系统
// 标签体系：
// - 来源标签：#原神 #崩坏3 #星穹铁道 #V家 等
// - 属性标签：#正太 #萝莉 #御姐 #少年 #成男 #成女
// - 性别标签：#男性 #女性
// - 性格标签：#可爱 #帅气 #冷酷 #活泼 #温柔 #成熟

const modelList = [
  // 崩坏星穹铁道角色
  { 
    name: 'Bronya', 
    filename: 'Bronya.vrm', 
    source: 'honkai',
    game: '星穹铁道',
    avatar: '❄️',
    tags: ['#星穹铁道', '#御姐', '#女性', '#冷酷', '#成熟']
  },
  { 
    name: 'Dehya', 
    filename: 'Dehya.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🔥',
    tags: ['#原神', '#成女', '#女性', '#帅气', '#活泼']
  },
  { 
    name: 'Himeko', 
    filename: 'Himeko.vrm', 
    source: 'honkai',
    game: '星穹铁道',
    avatar: '☕',
    tags: ['#星穹铁道', '#御姐', '#女性', '#成熟', '#温柔']
  },
  { 
    name: 'Katheryne', 
    filename: 'Katheryne.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🤖',
    tags: ['#原神', '#少女', '#女性', '#可爱']
  },
  { 
    name: 'Klara', 
    filename: 'Klara.vrm', 
    source: 'honkai',
    game: '星穹铁道',
    avatar: '🧸',
    tags: ['#星穹铁道', '#萝莉', '#女性', '#可爱', '#温柔']
  },
  { 
    name: 'Mimi', 
    filename: 'Mimi.vrm', 
    source: 'honkai',
    game: '星穹铁道',
    avatar: '🐱',
    tags: ['#星穹铁道', '#少女', '#女性', '#可爱', '#活泼']
  },
  { 
    name: 'Natasha', 
    filename: 'Natasha.vrm', 
    source: 'honkai',
    game: '星穹铁道',
    avatar: '💉',
    tags: ['#星穹铁道', '#御姐', '#女性', '#成熟', '#温柔']
  },
  { 
    name: 'Sampo', 
    filename: 'Sampo.vrm', 
    source: 'honkai',
    game: '星穹铁道',
    avatar: '🎩',
    tags: ['#星穹铁道', '#成男', '#男性', '#帅气', '#活泼']
  },
  { 
    name: 'Seele', 
    filename: 'Seele.vrm', 
    source: 'honkai',
    game: '星穹铁道',
    avatar: '🦋',
    tags: ['#星穹铁道', '#少女', '#女性', '#冷酷', '#帅气']
  },
  { 
    name: 'Welt', 
    filename: 'Welt.vrm', 
    source: 'honkai',
    game: '星穹铁道',
    avatar: '📚',
    tags: ['#星穹铁道', '#成男', '#男性', '#成熟', '#冷酷']
  },

  // 原神角色 - 按字母顺序
  { 
    name: 'Aether', 
    filename: 'Aether.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '⭐',
    tags: ['#原神', '#少年', '#男性', '#帅气', '#活泼']
  },
  { 
    name: 'Albedo', 
    filename: 'Albedo.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🎨',
    tags: ['#原神', '#少年', '#男性', '#温柔', '#帅气']
  },
  { 
    name: 'Albedo2', 
    filename: 'Albedo2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🎨',
    tags: ['#原神', '#少年', '#男性', '#温柔', '#帅气']
  },
  { 
    name: 'Alhaitham', 
    filename: 'Alhaitham.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '📖',
    tags: ['#原神', '#成男', '#男性', '#冷酷', '#成熟']
  },
  { 
    name: 'Amber', 
    filename: 'Amber.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🔥',
    tags: ['#原神', '#少女', '#女性', '#活泼', '#可爱']
  },
  { 
    name: 'Amber2', 
    filename: 'Amber2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🔥',
    tags: ['#原神', '#少女', '#女性', '#活泼', '#可爱']
  },
  { 
    name: 'Arataki Itto', 
    filename: 'AratakiItto.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '👹',
    tags: ['#原神', '#成男', '#男性', '#活泼', '#帅气']
  },
  { 
    name: 'Arlecchino', 
    filename: 'Arlecchino.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🎭',
    tags: ['#原神', '#成女', '#女性', '#冷酷', '#成熟']
  },
  { 
    name: 'Baizhu', 
    filename: 'Baizhu.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🐍',
    tags: ['#原神', '#成男', '#男性', '#温柔', '#成熟']
  },
  { 
    name: 'Barbara', 
    filename: 'Barbara.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '💧',
    tags: ['#原神', '#少女', '#女性', '#可爱', '#活泼']
  },
  { 
    name: 'Barbara2', 
    filename: 'Barbara2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '💧',
    tags: ['#原神', '#少女', '#女性', '#可爱', '#活泼']
  },
  { 
    name: 'Beidou', 
    filename: 'Beidou.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '⚡',
    tags: ['#原神', '#成女', '#女性', '#帅气', '#成熟']
  },
  { 
    name: 'Beidou2', 
    filename: 'Beidou2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '⚡',
    tags: ['#原神', '#成女', '#女性', '#帅气', '#成熟']
  },
  { 
    name: 'Bennett', 
    filename: 'Bennett.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🔥',
    tags: ['#原神', '#少年', '#男性', '#活泼', '#可爱']
  },
  { 
    name: 'Bennett2', 
    filename: 'Bennett2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🔥',
    tags: ['#原神', '#少年', '#男性', '#活泼', '#可爱']
  },
  { 
    name: 'Candace', 
    filename: 'Candace.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '💧',
    tags: ['#原神', '#成女', '#女性', '#成熟', '#温柔']
  },
  { 
    name: 'Celestia', 
    filename: 'Celestia.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '👁️',
    tags: ['#原神', '#御姐', '#女性', '#冷酷', '#成熟']
  },
  { 
    name: 'Chongyun', 
    filename: 'Chongyun.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '❄️',
    tags: ['#原神', '#少年', '#男性', '#可爱', '#活泼']
  },
  { 
    name: 'Chongyun2', 
    filename: 'Chongyun2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '❄️',
    tags: ['#原神', '#少年', '#男性', '#可爱', '#活泼']
  },
  { 
    name: 'Collei', 
    filename: 'Collei.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🌿',
    tags: ['#原神', '#少女', '#女性', '#可爱', '#活泼']
  },
  { 
    name: 'Dainsleif', 
    filename: 'Dainsleif.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '⭐',
    tags: ['#原神', '#成男', '#男性', '#冷酷', '#成熟']
  },
  { 
    name: 'Dainsleif2', 
    filename: 'Dainsleif2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '⭐',
    tags: ['#原神', '#成男', '#男性', '#冷酷', '#成熟']
  },
  { 
    name: 'Diluc', 
    filename: 'Diluc.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🔥',
    tags: ['#原神', '#成男', '#男性', '#冷酷', '#帅气']
  },
  { 
    name: 'Diluc2', 
    filename: 'Diluc2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🔥',
    tags: ['#原神', '#成男', '#男性', '#冷酷', '#帅气']
  },
  { 
    name: 'Diona', 
    filename: 'Diona.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🐱',
    tags: ['#原神', '#萝莉', '#女性', '#可爱', '#活泼']
  },
  { 
    name: 'Diona2', 
    filename: 'Diona2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🐱',
    tags: ['#原神', '#萝莉', '#女性', '#可爱', '#活泼']
  },
  { 
    name: 'Dori', 
    filename: 'Dori.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '💰',
    tags: ['#原神', '#萝莉', '#女性', '#可爱', '#活泼']
  },
  { 
    name: 'Dottore', 
    filename: 'Dottore.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🔬',
    tags: ['#原神', '#成男', '#男性', '#冷酷', '#成熟']
  },
  { 
    name: 'Eula', 
    filename: 'Eula.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '❄️',
    tags: ['#原神', '#成女', '#女性', '#冷酷', '#帅气']
  },
  { 
    name: 'Eula2', 
    filename: 'Eula2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '❄️',
    tags: ['#原神', '#成女', '#女性', '#冷酷', '#帅气']
  },
  { 
    name: 'Faruzan', 
    filename: 'Faruzan.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🌀',
    tags: ['#原神', '#少女', '#女性', '#活泼', '#可爱']
  },
  { 
    name: 'Fischl', 
    filename: 'Fischl.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '⚡',
    tags: ['#原神', '#少女', '#女性', '#活泼', '#可爱']
  },
  { 
    name: 'Fischl2', 
    filename: 'Fischl2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '⚡',
    tags: ['#原神', '#少女', '#女性', '#活泼', '#可爱']
  },
  { 
    name: 'Ganyu', 
    filename: 'Ganyu.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '❄️',
    tags: ['#原神', '#成女', '#女性', '#温柔', '#成熟']
  },
  { 
    name: 'Ganyu2', 
    filename: 'Ganyu2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '❄️',
    tags: ['#原神', '#成女', '#女性', '#温柔', '#成熟']
  },
  { 
    name: 'Gorou', 
    filename: 'Gorou.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🐕',
    tags: ['#原神', '#少年', '#男性', '#可爱', '#活泼']
  },
  { 
    name: 'Gorou2', 
    filename: 'Gorou2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🐕',
    tags: ['#原神', '#少年', '#男性', '#可爱', '#活泼']
  },
  { 
    name: 'Hu Tao', 
    filename: 'HuTao.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '👻',
    tags: ['#原神', '#少女', '#女性', '#活泼', '#可爱']
  },
  { 
    name: 'Jean', 
    filename: 'Jean.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '💨',
    tags: ['#原神', '#成女', '#女性', '#成熟', '#温柔']
  },
  { 
    name: 'Jean2', 
    filename: 'Jean2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '💨',
    tags: ['#原神', '#成女', '#女性', '#成熟', '#温柔']
  },
  { 
    name: 'Kaedehara Kazuha', 
    filename: 'KaedeharaKazuha.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🍁',
    tags: ['#原神', '#少年', '#男性', '#温柔', '#帅气']
  },
  { 
    name: 'Kaeya', 
    filename: 'Kaeya.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '❄️',
    tags: ['#原神', '#成男', '#男性', '#帅气', '#成熟']
  },
  { 
    name: 'Kaeya2', 
    filename: 'Kaeya2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '❄️',
    tags: ['#原神', '#成男', '#男性', '#帅气', '#成熟']
  },
  { 
    name: 'Kamisato Ayaka', 
    filename: 'KamisatoAyaka.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '❄️',
    tags: ['#原神', '#少女', '#女性', '#温柔', '#可爱']
  },
  { 
    name: 'Kamisato Ayaka2', 
    filename: 'KamisatoAyaka2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '❄️',
    tags: ['#原神', '#少女', '#女性', '#温柔', '#可爱']
  },
  { 
    name: 'Kamisato Ayato', 
    filename: 'KamisatoAyato.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '💧',
    tags: ['#原神', '#成男', '#男性', '#温柔', '#帅气']
  },
  { 
    name: 'Kaveh', 
    filename: 'Kaveh.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🏛️',
    tags: ['#原神', '#成男', '#男性', '#帅气', '#活泼']
  },
  { 
    name: 'Kazuha', 
    filename: 'Kazuha.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🍁',
    tags: ['#原神', '#少年', '#男性', '#温柔', '#帅气']
  },
  { 
    name: 'Keqing', 
    filename: 'Keqing.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '⚡',
    tags: ['#原神', '#少女', '#女性', '#帅气', '#活泼']
  },
  { 
    name: 'Keqing2', 
    filename: 'Keqing2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '⚡',
    tags: ['#原神', '#少女', '#女性', '#帅气', '#活泼']
  },
  { 
    name: 'Klee', 
    filename: 'Klee.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '💣',
    tags: ['#原神', '#萝莉', '#女性', '#活泼', '#可爱']
  },
  { 
    name: 'Kujou Sara', 
    filename: 'KujouSara.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '⚡',
    tags: ['#原神', '#成女', '#女性', '#冷酷', '#帅气']
  },
  { 
    name: 'Kujou Sara2', 
    filename: 'KujouSara2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '⚡',
    tags: ['#原神', '#成女', '#女性', '#冷酷', '#帅气']
  },
  { 
    name: 'Kuki Shinobu', 
    filename: 'KukiShinobu.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '⚡',
    tags: ['#原神', '#少女', '#女性', '#帅气', '#活泼']
  },
  { 
    name: 'La Signora', 
    filename: 'LaSignora.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '❄️',
    tags: ['#原神', '#成女', '#女性', '#冷酷', '#成熟']
  },
  { 
    name: 'Layla', 
    filename: 'Layla.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '💤',
    tags: ['#原神', '#少女', '#女性', '#可爱', '#温柔']
  },
  { 
    name: 'Lisa', 
    filename: 'Lisa.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '⚡',
    tags: ['#原神', '#成女', '#女性', '#成熟', '#温柔']
  },
  { 
    name: 'Lisa2', 
    filename: 'Lisa2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '⚡',
    tags: ['#原神', '#成女', '#女性', '#成熟', '#温柔']
  },
  { 
    name: 'Lumine', 
    filename: 'Lumine.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '⭐',
    tags: ['#原神', '#少女', '#女性', '#可爱', '#活泼']
  },
  { 
    name: 'Lumine2', 
    filename: 'Lumine2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '⭐',
    tags: ['#原神', '#少女', '#女性', '#可爱', '#活泼']
  },
  { 
    name: 'Mika', 
    filename: 'Mika.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '❄️',
    tags: ['#原神', '#少年', '#男性', '#可爱', '#活泼']
  },
  { 
    name: 'Mona', 
    filename: 'Mona.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '💧',
    tags: ['#原神', '#少女', '#女性', '#活泼', '#可爱']
  },
  { 
    name: 'Mona2', 
    filename: 'Mona2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '💧',
    tags: ['#原神', '#少女', '#女性', '#活泼', '#可爱']
  },
  { 
    name: 'Naganohara Yoimiya', 
    filename: 'NaganoharaYoimiya.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🔥',
    tags: ['#原神', '#少女', '#女性', '#活泼', '#可爱']
  },
  { 
    name: 'Naganohara Yoimiya2', 
    filename: 'NaganoharaYoimiya2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🔥',
    tags: ['#原神', '#少女', '#女性', '#活泼', '#可爱']
  },
  { 
    name: 'Nahida', 
    filename: 'Nahida.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🌿',
    tags: ['#原神', '#萝莉', '#女性', '#可爱', '#温柔']
  },
  { 
    name: 'Nilou', 
    filename: 'Nilou.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '💧',
    tags: ['#原神', '#少女', '#女性', '#可爱', '#温柔']
  },
  { 
    name: 'Ningguang', 
    filename: 'Ningguang.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '💎',
    tags: ['#原神', '#成女', '#女性', '#成熟', '#帅气']
  },
  { 
    name: 'Ningguang2', 
    filename: 'Ningguang2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '💎',
    tags: ['#原神', '#成女', '#女性', '#成熟', '#帅气']
  },
  { 
    name: 'Noelle', 
    filename: 'Noelle.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🛡️',
    tags: ['#原神', '#少女', '#女性', '#可爱', '#温柔']
  },
  { 
    name: 'Paimon', 
    filename: 'Paimon.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🍴',
    tags: ['#原神', '#萝莉', '#女性', '#活泼', '#可爱']
  },
  { 
    name: 'Qiqi', 
    filename: 'Qiqi.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '❄️',
    tags: ['#原神', '#萝莉', '#女性', '#可爱']
  },
  { 
    name: 'Qiqi2', 
    filename: 'Qiqi2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '❄️',
    tags: ['#原神', '#萝莉', '#女性', '#可爱']
  },
  { 
    name: 'Raiden Shogun', 
    filename: 'RaidenShogun.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '⚡',
    tags: ['#原神', '#成女', '#女性', '#冷酷', '#成熟']
  },
  { 
    name: 'Raiden Shogun2', 
    filename: 'RaidenShogun2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '⚡',
    tags: ['#原神', '#成女', '#女性', '#冷酷', '#成熟']
  },
  { 
    name: 'Razor', 
    filename: 'Razor.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '⚡',
    tags: ['#原神', '#少年', '#男性', '#活泼', '#帅气']
  },
  { 
    name: 'Razor2', 
    filename: 'Razor2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '⚡',
    tags: ['#原神', '#少年', '#男性', '#活泼', '#帅气']
  },
  { 
    name: 'Rosaria', 
    filename: 'Rosaria.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '❄️',
    tags: ['#原神', '#成女', '#女性', '#冷酷', '#成熟']
  },
  { 
    name: 'Rosaria2', 
    filename: 'Rosaria2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '❄️',
    tags: ['#原神', '#成女', '#女性', '#冷酷', '#成熟']
  },
  { 
    name: 'Sangonomiya Kokomi', 
    filename: 'SangonomiyaKokomi.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '💧',
    tags: ['#原神', '#少女', '#女性', '#温柔', '#可爱']
  },
  { 
    name: 'Sayu', 
    filename: 'Sayu.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🍃',
    tags: ['#原神', '#萝莉', '#女性', '#活泼', '#可爱']
  },
  { 
    name: 'Sayu2', 
    filename: 'Sayu2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🍃',
    tags: ['#原神', '#萝莉', '#女性', '#活泼', '#可爱']
  },
  { 
    name: 'Scaramouche', 
    filename: 'Scaramouche.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🌀',
    tags: ['#原神', '#少年', '#男性', '#冷酷', '#帅气']
  },
  { 
    name: 'Scaramouche2', 
    filename: 'Scaramouche2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🌀',
    tags: ['#原神', '#少年', '#男性', '#冷酷', '#帅气']
  },
  { 
    name: 'Shenhe', 
    filename: 'Shenhe.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '❄️',
    tags: ['#原神', '#成女', '#女性', '#冷酷', '#成熟']
  },
  { 
    name: 'Shenhe2', 
    filename: 'Shenhe2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '❄️',
    tags: ['#原神', '#成女', '#女性', '#冷酷', '#成熟']
  },
  { 
    name: 'Shikanoin Heizou', 
    filename: 'ShikanoinHeizou.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '💨',
    tags: ['#原神', '#少年', '#男性', '#活泼', '#帅气']
  },
  { 
    name: 'Shikanoin Heizou2', 
    filename: 'ShikanoinHeizou2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '💨',
    tags: ['#原神', '#少年', '#男性', '#活泼', '#帅气']
  },
  { 
    name: 'Sucrose', 
    filename: 'Sucrose.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🌀',
    tags: ['#原神', '#少女', '#女性', '#可爱', '#温柔']
  },
  { 
    name: 'Tartaglia', 
    filename: 'Tartaglia.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '💧',
    tags: ['#原神', '#成男', '#男性', '#帅气', '#活泼']
  },
  { 
    name: 'Tartaglia2', 
    filename: 'Tartaglia2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '💧',
    tags: ['#原神', '#成男', '#男性', '#帅气', '#活泼']
  },
  { 
    name: 'Thoma', 
    filename: 'Thoma.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🔥',
    tags: ['#原神', '#成男', '#男性', '#温柔', '#帅气']
  },
  { 
    name: 'Thoma2', 
    filename: 'Thoma2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🔥',
    tags: ['#原神', '#成男', '#男性', '#温柔', '#帅气']
  },
  { 
    name: 'Tighnari', 
    filename: 'Tighnari.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🌿',
    tags: ['#原神', '#少年', '#男性', '#温柔', '#帅气']
  },
  { 
    name: 'Tsaritsa', 
    filename: 'Tsaritsa.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '❄️',
    tags: ['#原神', '#御姐', '#女性', '#冷酷', '#成熟']
  },
  { 
    name: 'Venti', 
    filename: 'Venti.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '💨',
    tags: ['#原神', '#少年', '#男性', '#活泼', '#可爱']
  },
  { 
    name: 'Venti2', 
    filename: 'Venti2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '💨',
    tags: ['#原神', '#少年', '#男性', '#活泼', '#可爱']
  },
  { 
    name: 'Venti3', 
    filename: 'Venti3.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '💨',
    tags: ['#原神', '#少年', '#男性', '#活泼', '#可爱']
  },
  { 
    name: 'Wanderer', 
    filename: 'Wanderer.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🌀',
    tags: ['#原神', '#少年', '#男性', '#冷酷', '#帅气']
  },
  { 
    name: 'Xiangling', 
    filename: 'Xiangling.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🔥',
    tags: ['#原神', '#少女', '#女性', '#活泼', '#可爱']
  },
  { 
    name: 'Xiangling2', 
    filename: 'Xiangling2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🔥',
    tags: ['#原神', '#少女', '#女性', '#活泼', '#可爱']
  },
  { 
    name: 'Xiao', 
    filename: 'Xiao.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '👹',
    tags: ['#原神', '#少年', '#男性', '#冷酷', '#帅气']
  },
  { 
    name: 'Xiao2', 
    filename: 'Xiao2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '👹',
    tags: ['#原神', '#少年', '#男性', '#冷酷', '#帅气']
  },
  { 
    name: 'Xingqiu', 
    filename: 'Xingqiu.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '💧',
    tags: ['#原神', '#少年', '#男性', '#温柔', '#帅气']
  },
  { 
    name: 'Xingqiu2', 
    filename: 'Xingqiu2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '💧',
    tags: ['#原神', '#少年', '#男性', '#温柔', '#帅气']
  },
  { 
    name: 'Xinyan', 
    filename: 'Xinyan.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🔥',
    tags: ['#原神', '#少女', '#女性', '#活泼', '#帅气']
  },
  { 
    name: 'Xinyan2', 
    filename: 'Xinyan2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🔥',
    tags: ['#原神', '#少女', '#女性', '#活泼', '#帅气']
  },
  { 
    name: 'Yae Miko', 
    filename: 'YaeMiko.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '⚡',
    tags: ['#原神', '#成女', '#女性', '#成熟', '#帅气']
  },
  { 
    name: 'Yae Miko Alt', 
    filename: 'YaeMikoAlt.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '⚡',
    tags: ['#原神', '#成女', '#女性', '#成熟', '#帅气']
  },
  { 
    name: 'Yanfei', 
    filename: 'Yanfei.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🔥',
    tags: ['#原神', '#少女', '#女性', '#活泼', '#可爱']
  },
  { 
    name: 'Yanfei2', 
    filename: 'Yanfei2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🔥',
    tags: ['#原神', '#少女', '#女性', '#活泼', '#可爱']
  },
  { 
    name: 'Yaoyao', 
    filename: 'Yaoyao.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🌿',
    tags: ['#原神', '#萝莉', '#女性', '#可爱', '#活泼']
  },
  { 
    name: 'Yelan', 
    filename: 'Yelan.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '💧',
    tags: ['#原神', '#成女', '#女性', '#成熟', '#帅气']
  },
  { 
    name: 'Yoimiya', 
    filename: 'Yoimiya.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🔥',
    tags: ['#原神', '#少女', '#女性', '#活泼', '#可爱']
  },
  { 
    name: 'Yun Jin', 
    filename: 'YunJin.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🎭',
    tags: ['#原神', '#少女', '#女性', '#温柔', '#可爱']
  },
  { 
    name: 'Yun Jin2', 
    filename: 'YunJin2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🎭',
    tags: ['#原神', '#少女', '#女性', '#温柔', '#可爱']
  },
  { 
    name: 'Zhongli', 
    filename: 'Zhongli.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🪨',
    tags: ['#原神', '#成男', '#男性', '#成熟', '#帅气']
  },
  { 
    name: 'Zhongli2', 
    filename: 'Zhongli2.vrm', 
    source: 'genshin',
    game: '原神',
    avatar: '🪨',
    tags: ['#原神', '#成男', '#男性', '#成熟', '#帅气']
  }
];

// 获取所有标签
export const getAllTags = () => {
  const tags = new Set()
  modelList.forEach(model => {
    model.tags?.forEach(tag => tags.add(tag))
  })
  return Array.from(tags).sort()
}

// 根据标签搜索模型
export const searchModelsByTags = (searchTags) => {
  if (!searchTags || searchTags.length === 0) return modelList
  
  return modelList.filter(model => {
    return searchTags.every(tag => model.tags?.includes(tag))
  })
}

// 根据标签和名称搜索
export const searchModels = (query) => {
  if (!query) return modelList
  
  const lowerQuery = query.toLowerCase()
  const isTagSearch = query.startsWith('#')
  
  if (isTagSearch) {
    const searchTag = query
    return modelList.filter(model => 
      model.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }
  
  return modelList.filter(model => 
    model.name.toLowerCase().includes(lowerQuery) ||
    model.filename.toLowerCase().includes(lowerQuery) ||
    model.game?.toLowerCase().includes(lowerQuery) ||
    model.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

// 获取标签分类
export const getTagCategories = () => {
  const tags = getAllTags()
  return {
    games: tags.filter(t => ['#原神', '#星穹铁道', '#崩坏3', '#V家'].includes(t)),
    attributes: tags.filter(t => ['#正太', '#萝莉', '#御姐', '#少年', '#成男', '#成女'].includes(t)),
    genders: tags.filter(t => ['#男性', '#女性'].includes(t)),
    personalities: tags.filter(t => ['#可爱', '#帅气', '#冷酷', '#活泼', '#温柔', '#成熟'].includes(t))
  }
}

export default modelList;
