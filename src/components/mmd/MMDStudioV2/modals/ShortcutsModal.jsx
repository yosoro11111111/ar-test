import React from 'react'
import styles from './ShortcutsModal.module.css'

const shortcuts = [
  { category: '文件', items: [
    { key: 'Ctrl+N', desc: '新建项目' },
    { key: 'Ctrl+S', desc: '保存项目' },
    { key: 'Ctrl+O', desc: '打开项目' },
    { key: 'Ctrl+E', desc: '导出项目' },
  ]},
  { category: '编辑', items: [
    { key: 'Ctrl+Z', desc: '撤销' },
    { key: 'Ctrl+Y', desc: '重做' },
    { key: 'Ctrl+C', desc: '复制' },
    { key: 'Ctrl+X', desc: '剪切' },
    { key: 'Ctrl+V', desc: '粘贴' },
    { key: 'Ctrl+A', desc: '全选' },
    { key: 'Delete', desc: '删除' },
  ]},
  { category: '视图', items: [
    { key: 'F11', desc: '全屏' },
    { key: 'Q', desc: '选择工具' },
    { key: 'W', desc: '移动工具' },
    { key: 'E', desc: '旋转工具' },
    { key: 'R', desc: '缩放工具' },
  ]},
  { category: '播放', items: [
    { key: 'Space', desc: '播放/暂停' },
    { key: '←', desc: '上一帧' },
    { key: '→', desc: '下一帧' },
    { key: 'Home', desc: '跳到开头' },
    { key: 'End', desc: '跳到结尾' },
  ]},
]

export function ShortcutsModal({ onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>⌨️ 快捷键</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.content}>
          {shortcuts.map((group, idx) => (
            <div key={idx} className={styles.group}>
              <h3 className={styles.category}>{group.category}</h3>
              <div className={styles.shortcutList}>
                {group.items.map((item, i) => (
                  <div key={i} className={styles.shortcutItem}>
                    <kbd className={styles.key}>{item.key}</kbd>
                    <span className={styles.desc}>{item.desc}</span>
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
