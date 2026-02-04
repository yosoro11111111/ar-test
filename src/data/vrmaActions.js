import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMAnimationLoaderPlugin, createVRMAnimationClip } from '@pixiv/three-vrm-animation'

const rawAnimationCache = new Map()
const clipCache = new Map()

const dict = new Map([
  // 基础动作
  ['idle','待机'],['stand','站立'],['standing','站立'],['sit','坐下'],['seated','坐下'],['crouch','下蹲'],['kneel','下跪'],['lie','躺下'],
  ['walk','走路'],['walking','走路'],['run','奔跑'],['running','奔跑'],['jog','慢跑'],['turn','转身'],['rotation','旋转'],['jump','跳跃'],['land','落地'],['fall','下落'],
  ['left','左'],['right','右'],['degree','度'],['from','从'],['while','同时'],['looking','观察'],['around','周围'],
  ['forward','向前'],['backward','向后'],['up','上'],['down','下'],['to','到'],['into','进入'],
  
  // 武器/战斗
  ['aim','瞄准'],['gun','持枪'],['rifle','步枪'],['pistol','手枪'],['shot','射击'],['reload','换弹'],['bow','弓箭'],['arrow','箭矢'],
  ['punch','出拳'],['jab','直拳'],['hook','勾拳'],['cross','摆拳'],['uppercut','上勾拳'],['kick','踢腿'],['roundhouse','回旋踢'],['dodge','闪避'],['evade','回避'],['block','格挡'],['attack','攻击'],
  ['sword','剑'],['stab','刺'],['bash','猛击'],['swing','挥舞'],['parry','招架'],
  ['boxing','拳击'],['fight','格斗'],['guard','防御'],
  
  // 舞蹈
  ['dance','舞蹈'],['breakdance','霹雳舞'],['salsa','萨尔萨'],['charleston','查尔斯顿'],['moonwalk','太空步'],['twerk','扭胯'],['capoeira','卡波埃拉'],
  ['ballet','芭蕾'],['belly','肚皮'],['hip','髋部'],['hop','跳'],['booty','臀部'],['step','步'],
  ['variation','变体'],['bboy','街舞男孩'],['headspin','头转'],
  
  // 表情/情绪
  ['happy','开心'],['laugh','大笑'],['smile','微笑'],['cry','哭泣'],['angry','生气'],['cheer','欢呼'],['agree','同意'],['wave','挥手'],['clap','鼓掌'],['kiss','飞吻'],['gesture','手势'],
  ['yawn','打哈欠'],['asking','询问'],['question','问题'],['rejected','被拒绝'],['threatening','威胁'],['tenderly','温柔地'],
  ['whatever','无所谓'],['pointing','指向'],['weight','重量'],['shift','转移'],
  
  // 运动
  ['golf','高尔夫'],['baseball','棒球'],['football','橄榄球'],['soccer','足球'],['basketball','篮球'],['violin','小提琴'],
  ['homerun','全垒打'],['double','二垒打'],['hit','击打'],['batter','击球手'],['catcher','捕手'],
  ['workout','锻炼'],['squat','深蹲'],['curl','卷曲'],['air','空气'],
  
  // 特殊
  ['magic','魔法'],['spell','施法'],['victory','胜利'],['defeat','失败'],['death','死亡'],['hurt','受伤'],['carried','被抱起'],
  ['aerial','空中'],['backflip','后空翻'],['freeze','定格'],['spin','旋转'],
  ['female','女性'],['male','男性'],['orc','兽人'],['ninja','忍者'],['mutant','异变'],
  ['people','人'],['shaking','摇晃'],['hands','手'],['hand','手'],['part','部分'],
  ['drop','掉落'],['hop','单脚跳'],['braced','支撑'],['hang','悬挂'],
  ['villain','反派'],['hostage','人质'],['armed','武装的'],['releasing','释放'],
  ['being','被'],['picked','捡起'],['placed','放置'],['bed','床'],
  ['arms','手臂'],['raised','举起'],['spread','展开'],['slightly','轻微地'],
  ['leg','腿'],['sweep','扫'],['foot','脚'],['rear','后'],['side','侧'],
  ['front','前'],['back','后'],['rotation','旋转'],
  ['game','游戏'],['blend','混合'],
  ['big','大的'],['vegas','维加斯'],
  ['aj','AJ'],
  ['one','一'],['two','二'],['three','三'],
  ['first','第一'],['second','第二'],
  ['variation','变体'],['var','变体'],
  ['free','自由'],
  ['another','另一个'],
  ['transition','过渡'],['ground','地面'],['moves','动作'],
  ['start','开始'],
  ['single','单个'],
  ['uprock','直立摇滚'],
  ['footwork','脚步动作'],
  ['freeze','定格'],
  ['handstand','手倒立'],
  ['pop','弹出'],
  ['fly','飞']
])

function translateName(name) {
  const base = name.replace(/\s+\(\d+\)\s*$/,'')
  const words = base.split(/[\s\-_/]+/)
  const mapped = words.map(w=>{
    const k = w.toLowerCase()
    return dict.get(k) || w
  })
  const joined = mapped.join('').replace(/并且|和/g,'与')
  const suffix = name.match(/\(\d+\)/)?.[0] || ''
  return suffix ? `${joined} ${suffix}` : joined
}

// 更细致的分类系统
const categoryRules = [
  // 基础动作 - 细分
  { pattern: /idle|stand(ing)?$/, category: '基础-待机', icon: '🧍' },
  { pattern: /walk(ing)?|step/, category: '基础-行走', icon: '🚶' },
  { pattern: /run(ning)?|jog(ging)?|sprint/, category: '基础-跑步', icon: '🏃' },
  { pattern: /jump(ing)?|leap|hop/, category: '基础-跳跃', icon: '🦘' },
  { pattern: /turn(ing)?|rotation|pivot/, category: '基础-转身', icon: '🔄' },
  { pattern: /crouch(ing)?|kneel(ing)?/, category: '基础-蹲跪', icon: '🧎' },
  { pattern: /sit(ting)?|seat(ed)?/, category: '基础-坐下', icon: '🪑' },
  { pattern: /fall(ing)?|land(ing)?|drop/, category: '基础-落地', icon: '⬇️' },
  
  // 舞蹈 - 细分
  { pattern: /breakdance|bboy|headspin|freeze|pop/, category: '舞蹈-街舞', icon: '🕺' },
  { pattern: /salsa|tango|waltz|ballroom/, category: '舞蹈-社交舞', icon: '💃' },
  { pattern: /belly|twerk|hip/, category: '舞蹈-肚皮舞', icon: '👯' },
  { pattern: /ballet|pointe|plié/, category: '舞蹈-芭蕾', icon: '🩰' },
  { pattern: /capoeira/, category: '舞蹈-卡波耶拉', icon: '🤸' },
  { pattern: /dance|dancing|shuffle|moonwalk|charleston/, category: '舞蹈-其他', icon: '🎵' },
  
  // 战斗 - 细分
  { pattern: /punch|jab|hook|cross|uppercut|strike/, category: '战斗-拳击', icon: '🥊' },
  { pattern: /kick|roundhouse|sidekick|frontkick/, category: '战斗-踢腿', icon: '🦵' },
  { pattern: /dodge|evade|avoid|duck|weave/, category: '战斗-闪避', icon: '💨' },
  { pattern: /block|guard|defend|parry/, category: '战斗-防御', icon: '🛡️' },
  { pattern: /sword|slash|stab|swing.*sword|greatsword/, category: '战斗-剑术', icon: '⚔️' },
  { pattern: /gun|rifle|pistol|shoot|aim|fire|reload/, category: '战斗-枪械', icon: '🔫' },
  { pattern: /bow|arrow|archer/, category: '战斗-弓箭', icon: '🏹' },
  { pattern: /mma|muay|thai|knee|elbow/, category: '战斗-MMA', icon: '🥋' },
  { pattern: /attack|hit|hurt|damage|fight|combat/, category: '战斗-其他', icon: '👊' },
  
  // 表情/情绪
  { pattern: /wave|gesture|point|beckon/, category: '表情-手势', icon: '👋' },
  { pattern: /clap|applaud|cheer/, category: '表情-鼓掌', icon: '👏' },
  { pattern: /laugh|smile|happy|joy|cheerful/, category: '表情-开心', icon: '😄' },
  { pattern: /cry|sad|tear|depress/, category: '表情-悲伤', icon: '😢' },
  { pattern: /angry|mad|fury|rage/, category: '表情-愤怒', icon: '😠' },
  { pattern: /kiss|hug|embrace|affection/, category: '表情-亲密', icon: '💋' },
  { pattern: /think|ponder|wonder/, category: '表情-思考', icon: '🤔' },
  { pattern: /shrug|whatever|dunno/, category: '表情-无奈', icon: '🤷' },
  { pattern: /salute|respect|honor/, category: '表情-敬礼', icon: '🫡' },
  { pattern: /yes|nod|agree|approve/, category: '表情-同意', icon: '👍' },
  { pattern: /no|shake.*head|disagree|reject/, category: '表情-拒绝', icon: '👎' },
  
  // 运动 - 细分
  { pattern: /golf|swing.*club/, category: '运动-高尔夫', icon: '🏌️' },
  { pattern: /baseball|bat|pitch|catch/, category: '运动-棒球', icon: '⚾' },
  { pattern: /football|soccer|kick.*ball|goal/, category: '运动-足球', icon: '⚽' },
  { pattern: /basketball|dunk|shoot.*hoop/, category: '运动-篮球', icon: '🏀' },
  { pattern: /tennis|swing.*racket/, category: '运动-网球', icon: '🎾' },
  { pattern: /volleyball|spike/, category: '运动-排球', icon: '🏐' },
  { pattern: /box(ing)?|mma|fight/, category: '运动-格斗', icon: '🥊' },
  { pattern: /swim|dive|float/, category: '运动-游泳', icon: '🏊' },
  { pattern: /climb|hang|pull.*up/, category: '运动-攀爬', icon: '🧗' },
  { pattern: /workout|exercise|fitness|gym|squat|pushup|pullup/, category: '运动-健身', icon: '💪' },
  
  // 特殊/其他
  { pattern: /magic|spell|cast|conjure|wizard|witch/, category: '特殊-魔法', icon: '✨' },
  { pattern: /victory|win|celebrate|triumph/, category: '特殊-胜利', icon: '🏆' },
  { pattern: /defeat|lose|fail|surrender/, category: '特殊-失败', icon: '❌' },
  { pattern: /death|die|dead|kill|murder/, category: '特殊-死亡', icon: '💀' },
  { pattern: /hurt|injur|pain|damage|hit/, category: '特殊-受伤', icon: '🤕' },
  { pattern: /drink|eat|consume|chew/, category: '特殊-饮食', icon: '🍽️' },
  { pattern: /sleep|rest|nap|lie.*down/, category: '特殊-休息', icon: '😴' },
  { pattern: /carry|lift|hold|grab|pick/, category: '特殊-搬运', icon: '🏋️' },
  { pattern: /push|pull|drag/, category: '特殊-推拉', icon: '🔄' },
  { pattern: /open|close|door/, category: '特殊-开关', icon: '🚪' },
  { pattern: /type|write|draw|paint/, category: '特殊-书写', icon: '✍️' },
  { pattern: /phone|call|talk.*phone/, category: '特殊-电话', icon: '📱' },
  { pattern: /photo|camera|selfie/, category: '特殊-拍照', icon: '📷' },
  { pattern: /music|dance|play.*instrument|violin|guitar|piano/, category: '特殊-音乐', icon: '🎵' },
  { pattern: /drive|car|vehicle|steer/, category: '特殊-驾驶', icon: '🚗' },
  { pattern: /fly|float|levitate|hover/, category: '特殊-飞行', icon: '🦅' },
  { pattern: /sneak|stealth|hide|crouch.*walk/, category: '特殊-潜行', icon: '🥷' },
  { pattern: /zombie|monster|creature|mutant/, category: '特殊-怪物', icon: '🧟' },
  { pattern: /ninja|samurai|martial/, category: '特殊-武术', icon: '🥷' },
]

function categorize(filename) {
  const s = filename.toLowerCase()
  for (const rule of categoryRules) {
    if (rule.pattern.test(s)) {
      return rule.category
    }
  }
  return '其他'
}

function iconFor(category) {
  for (const rule of categoryRules) {
    if (rule.category === category) {
      return rule.icon
    }
  }
  return '🎭'
}

// 获取所有分类
export function getAllCategories() {
  const categories = new Set(categoryRules.map(r => r.category))
  categories.add('其他')
  return Array.from(categories)
}

export async function fetchVRMAList() {
  const res = await fetch('/motion/manifest.json')
  const json = await res.json()
  const base = json.basePath || '/motion/'
  return json.files.map(f=>({ filename: f, filePath: `${base}${f}` }))
}

export async function getAllVRMActions() {
  const list = await fetchVRMAList()
  return list.map(({ filename, filePath })=>{
    const zh = translateName(filename.replace(/\.vrma$/i,''))
    const cat = categorize(filename)
    return {
      id: `vrma_${filename.replace(/\.vrma$/i,'')}`,
      name: zh,
      icon: iconFor(cat),
      category: cat,
      filePath,
      source: 'vrma',
      loaded: false
    }
  })
}

export async function loadVRMAAction(filePath, vrm) {
  const raw = rawAnimationCache.get(filePath)
  if (raw && vrm) {
    const clip = createVRMAnimationClip(raw, vrm)
    return { clip, duration: clip.duration * 1000, filePath }
  }
  const cachedClip = clipCache.get(filePath)
  if (cachedClip) return cachedClip
  // 使用 GLTFLoader + VRMAnimationLoaderPlugin 加载
  const loader = new GLTFLoader()
  loader.register((parser) => new VRMAnimationLoaderPlugin(parser))
  
  try {
    const gltf = await new Promise((resolve, reject) => loader.load(filePath, resolve, undefined, reject))
    
    // 检查是否有 VRMAnimation 数据 (由 VRMAnimationLoaderPlugin 解析)
    // 注意: VRMAnimationLoaderPlugin 设置的是 vrmAnimations (复数数组)
    const vrmAnimations = gltf.userData?.vrmAnimations
    
    if (vrmAnimations && vrmAnimations.length > 0) {
      const vrmAnimation = vrmAnimations[0] // 取第一个动画
      console.log('✅ VRMA 动画加载成功:', filePath, '动画数:', vrmAnimations.length)
      rawAnimationCache.set(filePath, vrmAnimation)
      
      if (vrm) {
        const clip = createVRMAnimationClip(vrmAnimation, vrm)
        const data = { clip, duration: clip.duration * 1000, filePath }
        clipCache.set(filePath, data)
        return data
      }
      return { filePath }
    }
    
    // 如果没有 VRMAnimation，尝试使用标准动画
    if (gltf.animations && gltf.animations.length > 0) {
      console.log('📁 加载标准动画文件:', filePath, '动画数:', gltf.animations.length)
      const clip = gltf.animations[0]
      const data = { clip, duration: clip.duration * 1000, filePath, isStandardAnimation: true }
      clipCache.set(filePath, data)
      return data
    }
    
    throw new Error('文件中没有找到动画数据')
  } catch (error) {
    console.error('❌ 加载动画失败:', filePath, error.message)
    throw error
  }
}

export function clearVRMACache() {
  rawAnimationCache.clear()
  clipCache.clear()
}

export default {
  fetchVRMAList,
  getAllVRMAActions,
  loadVRMAAction,
  clearVRMACache
}
