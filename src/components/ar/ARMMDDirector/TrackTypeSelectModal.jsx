import React from 'react'
import { TRACK_TYPES } from './trackTypes'
import styles from './TrackTypeSelectModal.module.css'

export const TrackTypeSelectModal = ({ isOpen, onClose, onSelect, characterName }) => {
  if (!isOpen) return null

  const trackTypes = Object.values(TRACK_TYPES)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            <span className={styles.icon}>➕</span>
            添加轨道
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {characterName && (
          <div className={styles.characterInfo}>
            为 <span className={styles.characterName}>{characterName}</span> 添加轨道
          </div>
        )}

        <div className={styles.trackList}>
          {trackTypes.map((trackType) => (
            <div
              key={trackType.id}
              className={styles.trackItem}
              onClick={() => onSelect(trackType.id)}
              style={{ '--track-color': trackType.color }}
            >
              <span className={styles.trackIcon}>{trackType.icon}</span>
              <div className={styles.trackInfo}>
                <span className={styles.trackName}>{trackType.name}</span>
                <span className={styles.trackDesc}>{trackType.description}</span>
              </div>
              <span className={styles.trackArrow}>›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
