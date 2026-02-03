import React from 'react'
import './ShortcutHelp.css'

export const ShortcutHelp = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const shortcuts = [
    { category: '播放控制', items: [
      { key: '空格', desc: '播放/暂停' },
      { key: '← →', desc: '上一个/下一个动作' },
      { key: '↑ ↓', desc: '加快/减慢速度' },
      { key: 'R', desc: '随机动作' },
      { key: 'L', desc: '循环播放开关' },
    ]},
    { category: '快速切换', items: [
      { key: '1-9', desc: '快速切换收藏动作' },
      { key: 'Tab', desc: '切换角色' },
    ]},
    { category: '界面控制', items: [
      { key: 'F', desc: '全屏切换' },
      { key: 'S', desc: '截图' },
      { key: 'H', desc: '隐藏/显示UI' },
      { key: 'A', desc: '动作面板' },
      { key: 'T', desc: '时间轴' },
      { key: 'ESC', desc: '关闭面板' },
    ]},
    { category: '高级功能', items: [
      { key: 'Ctrl+S', desc: '保存项目' },
      { key: 'Ctrl+E', desc: '导出视频' },
      { key: 'Ctrl+Z', desc: '撤销' },
      { key: 'Ctrl+Shift+Z', desc: '重做' },
    ]},
  ]

  return (
    <div className="shortcut-help-overlay" onClick={onClose}>
      <div className="shortcut-help-modal" onClick={e => e.stopPropagation()}>
        <div className="shortcut-help-header">
          <h2>快捷键一览</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="shortcut-help-content">
          {shortcuts.map((group, index) => (
            <div key={index} className="shortcut-group">
              <h3>{group.category}</h3>
              <div className="shortcut-list">
                {group.items.map((item, i) => (
                  <div key={i} className="shortcut-item">
                    <kbd>{item.key}</kbd>
                    <span>{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ShortcutHelp
