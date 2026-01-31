// 人物管理面板组件
import React, { useState } from 'react'
import { furnitureList } from '../../data/furniture'

const CharacterManager = ({
  isMobile,
  characters,
  selectedCharacterIndex,
  characterProps,
  onSelectCharacter,
  onRemoveCharacter,
  onAddCharacter,
  onOpenFurniture,
  onClose,
  showNotification
}) => {
  const [searchQuery, setSearchQuery] = useState('')

  const characterCount = characters.filter(c => c !== null).length

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
        borderRadius: '24px',
        padding: isMobile ? '20px' : '32px',
        maxWidth: '700px',
        width: '92%',
        maxHeight: '85vh',
        overflow: 'auto',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 25px 80px rgba(0,0,0,0.6)'
      }}>
        {/* 标题栏 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div>
            <h2 style={{
              color: 'white',
              margin: 0,
              fontSize: isMobile ? '20px' : '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              👥 人物管理
              <span style={{
                fontSize: isMobile ? '12px' : '14px',
                color: 'rgba(255,255,255,0.6)',
                fontWeight: 'normal'
              }}>
                ({characterCount}/3)
              </span>
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >×</button>
        </div>

        {/* 搜索框 */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: isMobile ? '10px 14px' : '12px 18px',
            border: '1px solid rgba(255,255,255,0.15)'
          }}>
            <span style={{ fontSize: '18px', marginRight: '10px' }}>🔍</span>
            <input
              type="text"
              placeholder="搜索角色..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: isMobile ? '14px' : '15px',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '18px',
                  cursor: 'pointer'
                }}
              >✕</button>
            )}
          </div>
          <button
            onClick={() => {
              onClose()
              onAddCharacter()
            }}
            disabled={characterCount >= 3}
            style={{
              padding: isMobile ? '10px 16px' : '12px 24px',
              background: characterCount >= 3
                ? 'rgba(255,255,255,0.1)'
                : 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
              border: 'none',
              borderRadius: '16px',
              color: 'white',
              fontSize: isMobile ? '13px' : '15px',
              fontWeight: '600',
              cursor: characterCount >= 3 ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              opacity: characterCount >= 3 ? 0.5 : 1
            }}
          >
            + 添加角色
          </button>
        </div>

        {/* 角色列表 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {[0, 1, 2].map((index) => {
            const character = characters[index]
            const isSelected = selectedCharacterIndex === index

            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: isMobile ? '14px' : '18px',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(255, 107, 157, 0.25) 0%, rgba(196, 69, 105, 0.15) 100%)'
                    : 'rgba(255,255,255,0.05)',
                  borderRadius: '16px',
                  border: isSelected
                    ? '2px solid #ff6b9d'
                    : '2px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* 角色序号 */}
                <div style={{
                  width: isMobile ? '36px' : '44px',
                  height: isMobile ? '36px' : '44px',
                  borderRadius: '50%',
                  background: character
                    ? 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)'
                    : 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isMobile ? '16px' : '20px',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  {character ? '🌸' : (index + 1)}
                </div>

                {/* 角色信息 */}
                <div style={{ flex: 1 }}>
                  {character ? (
                    <>
                      <div style={{
                        color: 'white',
                        fontSize: isMobile ? '15px' : '17px',
                        fontWeight: '600',
                        marginBottom: '4px'
                      }}>
                        {character.name || character.filename?.replace('.vrm', '') || `角色${index + 1}`}
                        {isSelected && (
                          <span style={{
                            marginLeft: '8px',
                            fontSize: '12px',
                            color: '#ff6b9d',
                            background: 'rgba(255,107,157,0.2)',
                            padding: '2px 8px',
                            borderRadius: '10px'
                          }}>当前选中</span>
                        )}
                      </div>
                      <div style={{
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: isMobile ? '12px' : '13px'
                      }}>
                        {characterProps[index]
                          ? `装备: ${furnitureList.find(f => f.id === characterProps[index])?.name || '未知'}`
                          : '无装备'}
                      </div>
                    </>
                  ) : (
                    <div style={{
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: isMobile ? '14px' : '16px'
                    }}>
                      空槽位 - 点击添加角色
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                <div style={{
                  display: 'flex',
                  gap: '8px'
                }}>
                  {character ? (
                    <>
                      <button
                        onClick={() => {
                          onSelectCharacter(index)
                          onClose()
                        }}
                        style={{
                          padding: isMobile ? '8px 12px' : '10px 16px',
                          background: isSelected
                            ? 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)'
                            : 'rgba(255,255,255,0.1)',
                          border: 'none',
                          borderRadius: '10px',
                          color: 'white',
                          fontSize: isMobile ? '12px' : '13px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        {isSelected ? '已选中' : '选择'}
                      </button>
                      <button
                        onClick={() => onOpenFurniture(index)}
                        style={{
                          padding: isMobile ? '8px 12px' : '10px 16px',
                          background: 'rgba(255,255,255,0.1)',
                          border: 'none',
                          borderRadius: '10px',
                          color: 'white',
                          fontSize: isMobile ? '12px' : '13px',
                          cursor: 'pointer'
                        }}
                      >
                        🎁 道具
                      </button>
                      <button
                        onClick={() => {
                          onRemoveCharacter(index)
                          showNotification(`已删除角色${index + 1}`, 'info')
                        }}
                        style={{
                          padding: isMobile ? '8px 12px' : '10px 16px',
                          background: 'rgba(255,107,107,0.2)',
                          border: 'none',
                          borderRadius: '10px',
                          color: '#ff6b6b',
                          fontSize: isMobile ? '12px' : '13px',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        onSelectCharacter(index)
                        onClose()
                        onAddCharacter()
                      }}
                      style={{
                        padding: isMobile ? '8px 16px' : '10px 20px',
                        background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        fontSize: isMobile ? '12px' : '14px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      + 添加
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* 底部提示 */}
        <div style={{
          marginTop: '20px',
          padding: '14px',
          background: 'rgba(0,212,255,0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(0,212,255,0.2)',
          color: 'rgba(255,255,255,0.7)',
          fontSize: isMobile ? '12px' : '13px',
          textAlign: 'center'
        }}>
          💡 提示：点击"选择"切换到该角色，点击"道具"给角色装备物品，点击"🗑️"删除角色
        </div>
      </div>
    </div>
  )
}

export default CharacterManager
