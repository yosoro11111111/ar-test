import React, { useRef, useEffect, useState } from 'react'

// 商业化功能系统组件
const CommerceSystem = () => {
  const [skins, setSkins] = useState([
    {
      id: 1,
      name: '默认皮肤',
      price: 0,
      unlocked: true,
      description: '角色的初始皮肤',
      color: '#ff6b6b'
    },
    {
      id: 2,
      name: '星空皮肤',
      price: 1000,
      unlocked: false,
      description: '带有星空图案的特殊皮肤',
      color: '#45b7d1'
    },
    {
      id: 3,
      name: '樱花皮肤',
      price: 1500,
      unlocked: false,
      description: '粉嫩的樱花主题皮肤',
      color: '#ffb3ba'
    },
    {
      id: 4,
      name: '深海皮肤',
      price: 2000,
      unlocked: false,
      description: '神秘的深海主题皮肤',
      color: '#667eea'
    }
  ])

  const [accessories, setAccessories] = useState([
    {
      id: 1,
      name: '蝴蝶结',
      price: 500,
      unlocked: false,
      description: '可爱的蝴蝶结发饰',
      type: 'hair'
    },
    {
      id: 2,
      name: '眼镜',
      price: 800,
      unlocked: false,
      description: '知性的眼镜',
      type: 'face'
    },
    {
      id: 3,
      name: '翅膀',
      price: 2500,
      unlocked: false,
      description: '华丽的天使翅膀',
      type: 'back'
    },
    {
      id: 4,
      name: '项链',
      price: 600,
      unlocked: false,
      description: '精致的项链',
      type: 'neck'
    }
  ])

  const [characterCoins, setCharacterCoins] = useState(5000) // 角色金币
  const [selectedSkin, setSelectedSkin] = useState(1) // 当前选中的皮肤
  const [selectedAccessories, setSelectedAccessories] = useState([]) // 当前选中的配件
  const [isCommerceOpen, setIsCommerceOpen] = useState(false)

  // 解锁皮肤
  const unlockSkin = (skinId) => {
    const skin = skins.find(s => s.id === skinId)
    if (skin && !skin.unlocked && characterCoins >= skin.price) {
      setSkins(prev => prev.map(s => 
        s.id === skinId ? { ...s, unlocked: true } : s
      ))
      setCharacterCoins(prev => prev - skin.price)
      setSelectedSkin(skinId)
    }
  }

  // 解锁配件
  const unlockAccessory = (accessoryId) => {
    const accessory = accessories.find(a => a.id === accessoryId)
    if (accessory && !accessory.unlocked && characterCoins >= accessory.price) {
      setAccessories(prev => prev.map(a => 
        a.id === accessoryId ? { ...a, unlocked: true } : a
      ))
      setCharacterCoins(prev => prev - accessory.price)
      setSelectedAccessories(prev => [...prev, accessoryId])
    }
  }

  // 选择皮肤
  const selectSkin = (skinId) => {
    const skin = skins.find(s => s.id === skinId)
    if (skin && skin.unlocked) {
      setSelectedSkin(skinId)
    }
  }

  // 切换配件
  const toggleAccessory = (accessoryId) => {
    const accessory = accessories.find(a => a.id === accessoryId)
    if (accessory && accessory.unlocked) {
      setSelectedAccessories(prev => 
        prev.includes(accessoryId) 
          ? prev.filter(id => id !== accessoryId) 
          : [...prev, accessoryId]
      )
    }
  }

  return (
    <>
      {/* 商业化系统入口按钮 */}
      <button 
        onClick={() => setIsCommerceOpen(!isCommerceOpen)}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: '#f39c12',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer',
          zIndex: 1000
        }}
      >
        商城
      </button>

      {/* 金币显示 */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '100px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: '#f39c12',
        padding: '10px',
        borderRadius: '5px',
        zIndex: 1000
      }}>
        金币: {characterCoins}
      </div>

      {/* 商业化系统界面 */}
      {isCommerceOpen && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'white',
            color: 'black',
            padding: '30px',
            borderRadius: '10px',
            width: '80%',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2>商城</h2>
              <button 
                onClick={() => setIsCommerceOpen(false)}
                style={{
                  background: 'red',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                关闭
              </button>
            </div>

            {/* 皮肤系统 */}
            <div style={{ marginBottom: '40px' }}>
              <h3>皮肤</h3>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px' }}>
                {skins.map(skin => (
                  <div 
                    key={skin.id}
                    style={{
                      border: `2px solid ${selectedSkin === skin.id ? '#f39c12' : skin.unlocked ? '#4CAF50' : '#ccc'}`,
                      borderRadius: '10px',
                      padding: '20px',
                      width: '200px',
                      textAlign: 'center',
                      position: 'relative'
                    }}
                  >
                    <div style={{
                      width: '100px',
                      height: '150px',
                      backgroundColor: skin.color,
                      borderRadius: '10px',
                      margin: '0 auto 15px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      角色
                    </div>
                    <h4>{skin.name}</h4>
                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>{skin.description}</p>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#f39c12' }}>
                      {skin.price === 0 ? '免费' : `${skin.price} 金币`}
                    </p>
                    {skin.unlocked ? (
                      <button 
                        onClick={() => selectSkin(skin.id)}
                        style={{
                          background: selectedSkin === skin.id ? '#f39c12' : '#4CAF50',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          marginTop: '10px'
                        }}
                      >
                        {selectedSkin === skin.id ? '已装备' : '装备'}
                      </button>
                    ) : (
                      <button 
                        onClick={() => unlockSkin(skin.id)}
                        disabled={characterCoins < skin.price}
                        style={{
                          background: characterCoins >= skin.price ? '#f39c12' : '#ccc',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '5px',
                          cursor: characterCoins >= skin.price ? 'pointer' : 'not-allowed',
                          marginTop: '10px'
                        }}
                      >
                        解锁
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 配件系统 */}
            <div>
              <h3>配件</h3>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px' }}>
                {accessories.map(accessory => (
                  <div 
                    key={accessory.id}
                    style={{
                      border: `2px solid ${selectedAccessories.includes(accessory.id) ? '#f39c12' : accessory.unlocked ? '#4CAF50' : '#ccc'}`,
                      borderRadius: '10px',
                      padding: '20px',
                      width: '200px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{
                      width: '80px',
                      height: '80px',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '10px',
                      margin: '0 auto 15px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontSize: '30px'
                    }}>
                      {accessory.type === 'hair' && '🎀'}
                      {accessory.type === 'face' && '👓'}
                      {accessory.type === 'back' && ' wings'}
                      {accessory.type === 'neck' && '📿'}
                    </div>
                    <h4>{accessory.name}</h4>
                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>{accessory.description}</p>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#f39c12' }}>
                      {accessory.price} 金币
                    </p>
                    {accessory.unlocked ? (
                      <button 
                        onClick={() => toggleAccessory(accessory.id)}
                        style={{
                          background: selectedAccessories.includes(accessory.id) ? '#f39c12' : '#4CAF50',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          marginTop: '10px'
                        }}
                      >
                        {selectedAccessories.includes(accessory.id) ? '已装备' : '装备'}
                      </button>
                    ) : (
                      <button 
                        onClick={() => unlockAccessory(accessory.id)}
                        disabled={characterCoins < accessory.price}
                        style={{
                          background: characterCoins >= accessory.price ? '#f39c12' : '#ccc',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '5px',
                          cursor: characterCoins >= accessory.price ? 'pointer' : 'not-allowed',
                          marginTop: '10px'
                        }}
                      >
                        解锁
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CommerceSystem