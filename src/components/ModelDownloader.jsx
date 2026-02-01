import React, { useState, useEffect, useCallback } from 'react'
import './ModelDownloader.css'

/**
 * 模型下载与Tag系统
 * 
 * 功能:
 * - 从VRoid Hub或其他来源下载模型
 * - 自动提取模型Tag
 * - 按Tag筛选模型
 * - 本地模型管理
 */

// 预设模型库
const PRESET_MODELS = [
  {
    id: 'preset_001',
    name: '可爱萝莉',
    url: '/models/loli.vrm',
    thumbnail: '/thumbnails/loli.png',
    tags: ['萝莉', '可爱', '长发', '双马尾', '粉色', '学生服'],
    source: 'preset',
    size: '15MB'
  },
  {
    id: 'preset_002',
    name: '帅气少年',
    url: '/models/shota.vrm',
    thumbnail: '/thumbnails/shota.png',
    tags: ['正太', '帅气', '短发', '黑色', '制服'],
    source: 'preset',
    size: '12MB'
  },
  {
    id: 'preset_003',
    name: '成熟女性',
    url: '/models/lady.vrm',
    thumbnail: '/thumbnails/lady.png',
    tags: ['成熟', '长发', '职业装', '眼镜', '优雅'],
    source: 'preset',
    size: '18MB'
  },
  {
    id: 'preset_004',
    name: '兽耳少女',
    url: '/models/kemono.vrm',
    thumbnail: '/thumbnails/kemono.png',
    tags: ['兽耳', '尾巴', '可爱', '和服', '粉色'],
    source: 'preset',
    size: '16MB'
  },
  {
    id: 'preset_005',
    name: '魔法少女',
    url: '/models/magical.vrm',
    thumbnail: '/thumbnails/magical.png',
    tags: ['魔法少女', '可爱', '双马尾', '裙子', '华丽'],
    source: 'preset',
    size: '20MB'
  },
  {
    id: 'preset_006',
    name: '运动少年',
    url: '/models/sports.vrm',
    thumbnail: '/thumbnails/sports.png',
    tags: ['运动', '帅气', '短发', '活力', 'T恤'],
    source: 'preset',
    size: '14MB'
  }
]

// 所有可用Tag分类
const TAG_CATEGORIES = [
  {
    id: 'style',
    name: '风格',
    tags: ['可爱', '帅气', '成熟', '优雅', '活力', '冷酷', '温柔']
  },
  {
    id: 'appearance',
    name: '外观',
    tags: ['长发', '短发', '双马尾', '单马尾', '卷发', '直发', '眼镜', '兽耳', '尾巴', '角']
  },
  {
    id: 'color',
    name: '颜色',
    tags: ['粉色', '蓝色', '黑色', '白色', '金色', '银色', '红色', '紫色', '绿色']
  },
  {
    id: 'clothing',
    name: '服装',
    tags: ['学生服', '制服', '和服', '裙子', '西装', '运动服', '休闲装', '职业装', '华丽']
  },
  {
    id: 'type',
    name: '类型',
    tags: ['萝莉', '正太', '少女', '少年', '御姐', '大叔']
  }
]

// 从VRM文件提取Tag (模拟)
const extractTagsFromVRM = (file) => {
  return new Promise((resolve) => {
    // 实际实现需要解析VRM文件的JSON元数据
    // 这里模拟提取过程
    setTimeout(() => {
      const mockTags = ['自定义', '上传', 'VRM']
      resolve(mockTags)
    }, 500)
  })
}

// 真实模型网站配置
const MODEL_WEBSITES = [
  {
    id: 'vroid_hub',
    name: 'VRoid Hub',
    url: 'https://hub.vroid.com',
    description: '官方VRM模型分享平台',
    icon: '🎨',
    color: '#00D4FF'
  },
  {
    id: 'booth',
    name: 'BOOTH',
    url: 'https://booth.pm',
    description: '创作者市场，有大量VRM模型',
    icon: '🛒',
    color: '#FC4D50'
  },
  {
    id: 'niconi_solid',
    name: 'ニコニ立体',
    url: 'https://3d.nicovideo.jp',
    description: 'niconico的3D模型平台',
    icon: '🎬',
    color: '#FF9900'
  },
  {
    id: 'sketchfab',
    name: 'Sketchfab',
    url: 'https://sketchfab.com',
    description: '全球3D模型平台',
    icon: '🎭',
    color: '#1CAAD9'
  },
  {
    id: 'vrm_poses',
    name: 'VRM Poses',
    url: 'https://vrm-poses.vercel.app',
    description: 'VRM姿势和模型资源',
    icon: '🤸',
    color: '#9C27B0'
  }
]

// 在线模型库（模拟从网站获取的数据）
const ONLINE_MODELS = [
  {
    id: 'online_001',
    name: 'VRoid官方示例模型A',
    url: 'https://hub.vroid.com/download/12345',
    thumbnail: 'https://hub.vroid.com/images/model_a.png',
    tags: ['官方', '示例', '女性', '短发'],
    source: 'vroid_hub',
    size: '8MB',
    external: true,
    downloadUrl: 'https://hub.vroid.com/download/12345.vrm'
  },
  {
    id: 'online_002',
    name: 'VRoid官方示例模型B',
    url: 'https://hub.vroid.com/download/12346',
    thumbnail: 'https://hub.vroid.com/images/model_b.png',
    tags: ['官方', '示例', '男性', '短发'],
    source: 'vroid_hub',
    size: '8MB',
    external: true,
    downloadUrl: 'https://hub.vroid.com/download/12346.vrm'
  }
]

export const ModelDownloader = ({
  isOpen,
  onClose,
  onSelectModel,
  isMobile
}) => {
  const [activeTab, setActiveTab] = useState('library') // library, online, websites, upload, tags
  const [models, setModels] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState({})
  const [uploadedModels, setUploadedModels] = useState(() => {
    const saved = localStorage.getItem('uploadedModels')
    return saved ? JSON.parse(saved) : []
  })
  const [selectedWebsite, setSelectedWebsite] = useState(null)

  // 加载模型库
  useEffect(() => {
    if (isOpen) {
      loadModels()
    }
  }, [isOpen])

  const loadModels = async () => {
    setLoading(true)
    // 合并预设模型、在线模型和上传的模型
    const allModels = [...PRESET_MODELS, ...ONLINE_MODELS, ...uploadedModels]
    setModels(allModels)
    setLoading(false)
  }

  // 打开外部网站
  const openExternalWebsite = (website) => {
    window.open(website.url, '_blank')
  }

  // 下载外部模型
  const downloadExternalModel = async (model) => {
    if (model.external && model.downloadUrl) {
      // 打开下载链接
      window.open(model.downloadUrl, '_blank')
      showNotification(`正在跳转到 ${model.source} 下载页面`, 'info')
    } else {
      // 本地模型直接下载
      await downloadModel(model)
    }
  }

  // 根据Tag筛选模型
  const filteredModels = useCallback(() => {
    let result = models

    // 按搜索词筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(model => 
        model.name.toLowerCase().includes(query) ||
        model.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // 按Tag筛选
    if (selectedTags.length > 0) {
      result = result.filter(model => 
        selectedTags.some(tag => model.tags.includes(tag))
      )
    }

    return result
  }, [models, searchQuery, selectedTags])

  // 下载模型
  const downloadModel = async (model) => {
    setDownloadProgress(prev => ({ ...prev, [model.id]: 0 }))
    
    // 模拟下载进度
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(r => setTimeout(r, 100))
      setDownloadProgress(prev => ({ ...prev, [model.id]: i }))
    }

    // 完成下载
    setDownloadProgress(prev => ({ ...prev, [model.id]: 100 }))
    
    // 添加到已下载
    const downloaded = JSON.parse(localStorage.getItem('downloadedModels') || '[]')
    if (!downloaded.find(m => m.id === model.id)) {
      downloaded.push(model)
      localStorage.setItem('downloadedModels', JSON.stringify(downloaded))
    }

    // 选择模型
    onSelectModel?.(model)
  }

  // 上传本地模型
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !file.name.endsWith('.vrm')) {
      alert('请选择VRM格式的文件')
      return
    }

    setLoading(true)
    
    // 提取Tag
    const extractedTags = await extractTagsFromVRM(file)
    
    // 创建模型对象
    const newModel = {
      id: `upload_${Date.now()}`,
      name: file.name.replace('.vrm', ''),
      url: URL.createObjectURL(file),
      thumbnail: '/thumbnails/default.png',
      tags: extractedTags,
      source: 'upload',
      size: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
      file: file
    }

    // 保存到本地存储
    const updated = [...uploadedModels, newModel]
    setUploadedModels(updated)
    localStorage.setItem('uploadedModels', JSON.stringify(updated))
    
    // 刷新模型列表
    setModels(prev => [...prev, newModel])
    setLoading(false)
    
    alert('模型上传成功！')
  }

  // 切换Tag选择
  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  // 清除所有筛选
  const clearFilters = () => {
    setSelectedTags([])
    setSearchQuery('')
  }

  if (!isOpen) return null

  const displayModels = filteredModels()

  return (
    <div className="model-downloader-overlay" onClick={onClose}>
      <div 
        className={`model-downloader-panel ${isMobile ? 'mobile' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="model-downloader-header">
          <h2>模型库</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* 标签页 */}
        <div className="model-downloader-tabs">
          <button
            className={activeTab === 'library' ? 'active' : ''}
            onClick={() => setActiveTab('library')}
          >
            📚 本地模型
          </button>
          <button
            className={activeTab === 'websites' ? 'active' : ''}
            onClick={() => setActiveTab('websites')}
          >
            🌐 模型网站
          </button>
          <button
            className={activeTab === 'tags' ? 'active' : ''}
            onClick={() => setActiveTab('tags')}
          >
            🏷️ Tag筛选
          </button>
          <button
            className={activeTab === 'upload' ? 'active' : ''}
            onClick={() => setActiveTab('upload')}
          >
            ⬆️ 上传模型
          </button>
        </div>

        {/* 搜索栏 */}
        {activeTab === 'library' && (
          <div className="model-search-bar">
            <input
              type="text"
              placeholder="搜索模型名称或Tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>
        )}

        {/* 内容区域 */}
        <div className="model-downloader-content">
          {/* 模型库 */}
          {activeTab === 'library' && (
            <>
              {/* 已选Tag显示 */}
              {selectedTags.length > 0 && (
                <div className="selected-tags">
                  <span>已选Tag:</span>
                  {selectedTags.map(tag => (
                    <span key={tag} className="tag-chip">
                      {tag}
                      <button onClick={() => toggleTag(tag)}>×</button>
                    </span>
                  ))}
                  <button className="clear-btn" onClick={clearFilters}>
                    清除全部
                  </button>
                </div>
              )}

              {/* 模型列表 */}
              {loading ? (
                <div className="loading">加载中...</div>
              ) : displayModels.length > 0 ? (
                <div className="models-grid">
                  {displayModels.map(model => (
                    <div key={model.id} className="model-card">
                      <div className="model-thumbnail">
                        {model.thumbnail ? (
                          <img src={model.thumbnail} alt={model.name} />
                        ) : (
                          <div className="placeholder">🎭</div>
                        )}
                        <span className="model-source">
                          {model.source === 'preset' ? '预设' : '上传'}
                        </span>
                      </div>
                      <div className="model-info">
                        <h3>{model.name}</h3>
                        <p className="model-size">{model.size}</p>
                        <div className="model-tags">
                          {model.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="tag">{tag}</span>
                          ))}
                          {model.tags.length > 3 && (
                            <span className="more-tags">+{model.tags.length - 3}</span>
                          )}
                        </div>
                      </div>
                      <div className="model-actions">
                        {downloadProgress[model.id] !== undefined && downloadProgress[model.id] < 100 ? (
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${downloadProgress[model.id]}%` }}
                            />
                            <span>{downloadProgress[model.id]}%</span>
                          </div>
                        ) : (
                          <button 
                            className="download-btn"
                            onClick={() => downloadModel(model)}
                          >
                            {downloadProgress[model.id] === 100 ? '✓ 已下载' : '⬇️ 下载'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-results">
                  <span>😕</span>
                  <p>没有找到匹配的模型</p>
                  <button onClick={clearFilters}>清除筛选</button>
                </div>
              )}
            </>
          )}

          {/* 模型网站 */}
          {activeTab === 'websites' && (
            <div className="websites-section">
              <div className="websites-intro">
                <p>🔗 点击下方网站访问更多VRM模型资源</p>
              </div>
              <div className="websites-grid">
                {MODEL_WEBSITES.map(website => (
                  <div
                    key={website.id}
                    className="website-card"
                    onClick={() => openExternalWebsite(website)}
                    style={{ borderColor: website.color }}
                  >
                    <div className="website-icon" style={{ color: website.color }}>
                      {website.icon}
                    </div>
                    <div className="website-info">
                      <h3>{website.name}</h3>
                      <p>{website.description}</p>
                    </div>
                    <div className="website-arrow">→</div>
                  </div>
                ))}
              </div>
              <div className="websites-tip">
                <p>💡 提示：在网站下载VRM模型后，可以使用"上传模型"功能导入</p>
              </div>
            </div>
          )}

          {/* Tag筛选 */}
          {activeTab === 'tags' && (
            <div className="tags-filter">
              {TAG_CATEGORIES.map(category => (
                <div key={category.id} className="tag-category">
                  <h3>{category.name}</h3>
                  <div className="tags-list">
                    {category.tags.map(tag => (
                      <button
                        key={tag}
                        className={selectedTags.includes(tag) ? 'active' : ''}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 上传模型 */}
          {activeTab === 'upload' && (
            <div className="upload-section">
              <div className="upload-area">
                <input
                  type="file"
                  accept=".vrm"
                  onChange={handleFileUpload}
                  id="vrm-upload"
                  hidden
                />
                <label htmlFor="vrm-upload" className="upload-label">
                  <span className="upload-icon">📁</span>
                  <span className="upload-text">点击或拖拽上传VRM模型</span>
                  <span className="upload-hint">支持 .vrm 格式，最大 50MB</span>
                </label>
              </div>

              {/* 已上传模型列表 */}
              {uploadedModels.length > 0 && (
                <div className="uploaded-models">
                  <h3>已上传的模型</h3>
                  <div className="models-list">
                    {uploadedModels.map(model => (
                      <div key={model.id} className="uploaded-model-item">
                        <span>{model.name}</span>
                        <div className="item-actions">
                          <button onClick={() => onSelectModel?.(model)}>
                            使用
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={() => {
                              const updated = uploadedModels.filter(m => m.id !== model.id)
                              setUploadedModels(updated)
                              localStorage.setItem('uploadedModels', JSON.stringify(updated))
                              setModels(prev => prev.filter(m => m.id !== model.id))
                            }}
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ModelDownloader
