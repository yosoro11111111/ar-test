import React, { useState, useEffect } from 'react'
import styles from './ResourceBrowser.module.css'

/**
 * 资源浏览器 - 扫描并显示public文件夹中的资源
 */
export function ResourceBrowser({ onSelect, type, onClose }) {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid') // grid | list

  // 资源路径配置
  const resourceConfig = {
    characters: {
      path: '/models/',
      extensions: ['.vrm'],
      icon: '👤',
      defaultThumbnail: '/icons/character.png'
    },
    props: {
      path: '/object/',
      extensions: ['.glb', '.gltf'],
      icon: '📦',
      defaultThumbnail: '/icons/prop.png'
    },
    scenes: {
      path: '/scene/',
      extensions: ['.glb', '.gltf', '.mp4', '.webm', '.jpg', '.png'],
      icon: '🎬',
      defaultThumbnail: '/icons/scene.png'
    },
    motions: {
      path: '/motion/',
      extensions: ['.vrma', '.bvh'],
      icon: '🎭',
      defaultThumbnail: '/icons/motion.png'
    },
    music: {
      path: '/music/',
      extensions: ['.mp3', '.wav', '.ogg'],
      icon: '🎵',
      defaultThumbnail: '/icons/music.png'
    }
  }

  useEffect(() => {
    scanResources()
  }, [type])

  const scanResources = async () => {
    setLoading(true)
    try {
      const config = resourceConfig[type]
      if (!config) {
        setResources([])
        return
      }

      // 尝试加载manifest.json
      let files = []
      try {
        const response = await fetch('/manifest.json')
        if (response.ok) {
          const manifest = await response.json()
          files = manifest[type] || []
        }
      } catch (e) {
        console.log('manifest.json 不存在，使用默认扫描')
      }

      // 如果没有manifest，使用硬编码的资源列表（实际项目中应该由后端提供）
      if (files.length === 0) {
        files = await scanDirectory(config.path, config.extensions)
      }

      // 处理资源列表
      const processedResources = files.map((file, index) => ({
        id: `${type}-${index}`,
        name: formatFileName(file.name || file),
        fileName: file.name || file,
        path: `${config.path}${file.name || file}`,
        size: file.size || 0,
        type: type,
        extension: (file.name || file).split('.').pop().toLowerCase(),
        thumbnail: file.thumbnail || null,
        icon: config.icon
      }))

      setResources(processedResources)
    } catch (error) {
      console.error('扫描资源失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 扫描目录 - 获取public文件夹下的文件列表
  const scanDirectory = async (path, extensions) => {
    try {
      // 尝试从后端API获取文件列表
      // 由于前端无法直接读取文件系统，我们需要一个API端点
      // 这里先使用硬编码的完整文件列表
      
      const fileLists = {
        '/models/': [
          'Aether.vrm', 'Albedo1.vrm', 'Albedo2.vrm', 'Alhaitham.vrm', 'Amber.vrm', 'Amber2.vrm',
          'AratakiItto.vrm', 'Arlecchino.vrm', 'Baizhu.vrm', 'Barbara.vrm', 'Barbara2.vrm',
          'Beidou.vrm', 'Beidou2.vrm', 'Bennett.vrm', 'Bennett2.vrm', 'Bronya.vrm', 'Candace.vrm',
          'Celestia.vrm', 'Chongyun.vrm', 'Chongyun2.vrm', 'Collei.vrm', 'Dainsleif1.vrm',
          'Dainsleif2.vrm', 'Dehya.vrm', 'Diluc1.vrm', 'Diluc2.vrm', 'Diona1.vrm', 'Diona2.vrm',
          'Dori.vrm', 'Dottore.vrm', 'Eula1.vrm', 'Eula2.vrm', 'Faruzan.vrm', 'Fischl1.vrm',
          'Fischl2.vrm', 'Ganyu1.vrm', 'Ganyu2.vrm', 'Gorou1.vrm', 'Gorou2.vrm', 'Himeko.vrm',
          'HuTao.vrm', 'Jean1.vrm', 'Jean2.vrm', 'KaedeharaKazuha.vrm', 'Kaeya1.vrm', 'Kaeya2.vrm',
          'KamisatoAyaka.vrm', 'KamisatoAyaka2.vrm', 'KamisatoAyato.vrm', 'Katheryne.vrm',
          'Kaveh.vrm', 'Kazuha.vrm', 'Keqing1.vrm', 'Keqing2.vrm', 'Klara.vrm', 'Klee.vrm',
          'KujouSara.vrm', 'KujouSara2.vrm', 'KukiShinobu.vrm', 'LaSignora.vrm', 'Layla.vrm',
          'Lisa.vrm', 'Lisa2.vrm', 'Lumine.vrm', 'Lumine2.vrm', 'Mika.vrm', 'Mimi.vrm',
          'Mona.vrm', 'Mona2.vrm', 'NaganoharaYoimiya.vrm', 'NaganoharaYoimiya2.vrm',
          'Nahida.vrm', 'Natasha.vrm', 'Nilou.vrm', 'Ningguang.vrm', 'Ningguang2.vrm',
          'Noelle.vrm', 'Paimon.vrm', 'Qiqi.vrm', 'Qiqi2.vrm', 'RaidenShogun.vrm',
          'RaidenShogun2.vrm', 'Razor.vrm', 'Razor2.vrm', 'Rosaria.vrm', 'Rosaria2.vrm',
          'Sampo.vrm', 'SangonomiyaKokomi.vrm', 'Sayu.vrm', 'Sayu2.vrm', 'Scaramouche.vrm',
          'Scaramouche2.vrm', 'Seele.vrm', 'Shenhe.vrm', 'Shenhe2.vrm', 'ShikanoinHeizou.vrm',
          'ShikanoinHeizou2.vrm', 'Sucrose.vrm', 'Tartaglia.vrm', 'Tartaglia2.vrm',
          'Thoma.vrm', 'Thoma2.vrm', 'Tighnari.vrm', 'Tsaritsa.vrm', 'Venti.vrm',
          'Venti2.vrm', 'Venti3.vrm', 'Wanderer.vrm', 'Welt.vrm', 'Xiangling.vrm',
          'Xiangling2.vrm', 'Xiao.vrm', 'Xiao2.vrm', 'Xingqiu.vrm', 'Xingqiu2.vrm',
          'Xinyan.vrm', 'Xinyan2.vrm', 'YaeMiko.vrm', 'YaeMikoAlt.vrm', 'Yanfei.vrm',
          'Yanfei2.vrm', 'Yaoyao.vrm', 'Yelan.vrm', 'YunJin.vrm', 'YunJin2.vrm',
          'Zhongli.vrm', 'Zhongli2.vrm', 'aili.vrm'
        ],
        '/object/': [
          '3D Glasses.glb', 'Arrow.glb', 'Basketball.glb', 'Basketball (Circuit Drone).glb',
          'Basketball (Silver).glb', 'Batman Toy.glb', 'Batwing Toy.glb', 'Beanbag Chair.glb',
          'Big Present.glb', 'Bow and Arrow.glb', 'Bubble Gun.glb', 'Button.glb',
          'Campfire.glb', 'Cardboard Box.glb', 'Cardboard Box (Small).glb', 'Clock.glb',
          'Corvette.glb', 'Disintegration Pistol.glb', 'Hoop.glb',
          'Illudium Q-36 Explosive Space Modulator.glb', 'Keyboard.glb', 'Lantern.glb',
          'Martian Flugelhorn.glb', 'Marvin Flag.glb', 'Mogwai Chest.glb', 'Music Note A.glb',
          'Music Note B.glb', 'Popcorn Box.glb', 'Popcorn.glb', 'Presents (Small).glb',
          'Presents.glb', 'Sharpie.glb', 'Spaceship.glb', 'Time Space Gun.glb',
          'Toast-on-a-Stick.glb', 'Treble Clef.glb', 'TV.glb', 'Ultimatum Answerer.glb',
          'Umbrella.glb'
        ],
        '/scene/': ['test.glb'],
        '/motion/': [
          'Zombie Walking.vrma', 'Zombie Running.vrma', 'Walking Forward With Bow.vrma',
          'Male Standard Walk.vrma', 'Female Run Forward.vrma', 'Dancing The Twerk.vrma',
          'Boxing Idle.vrma', 'Capoeira Step.vrma', 'Female Idle.vrma',
          'Male Standing Idle 01.vrma', 'Neutral Idle.vrma', 'Happy Idle Variation 2.vrma'
        ]
      }
      
      return fileLists[path] || []
    } catch (error) {
      console.error('扫描目录失败:', error)
      return []
    }
  }

  const formatFileName = (filename) => {
    return filename
      .replace(/\.[^/.]+$/, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/\d+$/, '')
      .trim()
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleSelect = (resource) => {
    setSelectedId(resource.id)
    onSelect(resource)
  }

  const filteredResources = resources.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getTypeName = () => {
    const names = {
      characters: '角色',
      props: '道具',
      scenes: '场景',
      motions: '动作',
      music: '音乐'
    }
    return names[type] || '资源'
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <span className={styles.typeIcon}>{resourceConfig[type]?.icon}</span>
            <h2>选择{getTypeName()}</h2>
            <span className={styles.count}>{filteredResources.length} 个文件</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* 工具栏 */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="搜索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.viewToggle}>
            <button
              className={viewMode === 'grid' ? styles.active : ''}
              onClick={() => setViewMode('grid')}
              title="网格视图"
            >
              ⊞
            </button>
            <button
              className={viewMode === 'list' ? styles.active : ''}
              onClick={() => setViewMode('list')}
              title="列表视图"
            >
              ☰
            </button>
          </div>
        </div>

        {/* 内容区 */}
        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>正在扫描文件夹...</p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📂</div>
              <p>暂无{getTypeName()}</p>
              <span>请将文件放入 public/{resourceConfig[type]?.path} 目录</span>
            </div>
          ) : viewMode === 'grid' ? (
            <div className={styles.grid}>
              {filteredResources.map(resource => (
                <div
                  key={resource.id}
                  className={`${styles.card} ${selectedId === resource.id ? styles.selected : ''}`}
                  onClick={() => handleSelect(resource)}
                >
                  <div className={styles.thumbnail}>
                    {resource.thumbnail ? (
                      <img src={resource.thumbnail} alt={resource.name} />
                    ) : (
                      <div className={styles.placeholder}>
                        <span className={styles.fileIcon}>{resource.icon}</span>
                      </div>
                    )}
                    <div className={styles.fileType}>{resource.extension.toUpperCase()}</div>
                  </div>
                  <div className={styles.info}>
                    <div className={styles.name} title={resource.name}>{resource.name}</div>
                    <div className={styles.meta}>
                      {resource.size > 0 && formatFileSize(resource.size)}
                    </div>
                  </div>
                  {selectedId === resource.id && (
                    <div className={styles.checkmark}>✓</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.list}>
              {filteredResources.map(resource => (
                <div
                  key={resource.id}
                  className={`${styles.listItem} ${selectedId === resource.id ? styles.selected : ''}`}
                  onClick={() => handleSelect(resource)}
                >
                  <span className={styles.listIcon}>{resource.icon}</span>
                  <div className={styles.listInfo}>
                    <div className={styles.listName}>{resource.name}</div>
                    <div className={styles.listMeta}>
                      {resource.extension.toUpperCase()}
                      {resource.size > 0 && ` · ${formatFileSize(resource.size)}`}
                    </div>
                  </div>
                  {selectedId === resource.id && (
                    <span className={styles.listCheck}>✓</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className={styles.footer}>
          <span className={styles.path}>路径: public{resourceConfig[type]?.path?.replace(/^\//, '')}</span>
          <button className={styles.refreshBtn} onClick={scanResources}>
            🔄 刷新
          </button>
        </div>
      </div>
    </div>
  )
}
