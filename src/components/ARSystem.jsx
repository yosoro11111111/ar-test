import React, { useRef, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { CharacterController } from './CharacterSystem'
import modelList from '../models/modelList'

const CharacterSlot = ({ character, index, onSelect, onRemove, isSelected }) => {
  return (
    <div
      onClick={() => onSelect(index)}
      style={{
        width: '75px',
        height: '75px',
        borderRadius: '50%',
        background: isSelected 
          ? 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)' 
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%)',
        border: isSelected 
          ? '3px solid #f9a8d4' 
          : '2px solid rgba(255, 255, 255, 0.25)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        position: 'relative',
        boxShadow: isSelected 
          ? '0 8px 32px rgba(244, 114, 182, 0.5), inset 0 2px 10px rgba(255, 255, 255, 0.25)' 
          : '0 4px 16px rgba(0, 0, 0, 0.15), inset 0 1px 6px rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(12px)'
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'scale(1.2) translateY(-8px)'
        e.target.style.boxShadow = isSelected 
          ? '0 12px 48px rgba(244, 114, 182, 0.6), inset 0 2px 12px rgba(255, 255, 255, 0.35)' 
          : '0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 8px rgba(255, 255, 255, 0.25)'
        e.target.style.background = isSelected 
          ? 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)' 
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)'
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'scale(1) translateY(0)'
        e.target.style.boxShadow = isSelected 
          ? '0 8px 32px rgba(244, 114, 182, 0.5), inset 0 2px 10px rgba(255, 255, 255, 0.25)' 
          : '0 4px 16px rgba(0, 0, 0, 0.15), inset 0 1px 6px rgba(255, 255, 255, 0.15)'
        e.target.style.background = isSelected 
          ? 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)' 
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%)'
      }}
    >
      {character ? (
        <>
          <div style={{ 
            fontSize: '30px',
            filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.25))',
            animation: 'float 3s ease-in-out infinite'
          }}>✨</div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove(index)
            }}
            style={{
              position: 'absolute',
              top: '-10px',
              right: '-10px',
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #fb7185 0%, #f43f5e 100%)',
              color: 'white',
              border: '2px solid white',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(244, 63, 94, 0.5)',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.3) rotate(90deg)'
              e.target.style.boxShadow = '0 6px 24px rgba(244, 63, 94, 0.7)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1) rotate(0deg)'
              e.target.style.boxShadow = '0 4px 16px rgba(244, 63, 94, 0.5)'
            }}
          >
            ×
          </button>
        </>
      ) : (
        <div style={{ 
          fontSize: '36px', 
          opacity: 0.7,
          filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.15))'
        }}>+</div>
      )}
    </div>
  )
}

const ARContent = ({ selectedFile }) => {
  return (
    <>
      {selectedFile && (
        <CharacterController 
          position={[0, 0, 0]} 
          rotation={[0, 0, 0]} 
          selectedFile={selectedFile}
        />
      )}
    </>
  )
}

const TechButton = ({ children, onClick, style, active = false, size = 'medium' }) => {
  const sizeStyles = {
    small: { width: '45px', height: '45px', fontSize: '18px' },
    medium: { width: '55px', height: '55px', fontSize: '22px' },
    large: { width: '65px', height: '65px', fontSize: '26px' }
  }

  const baseStyle = {
    ...sizeStyles[size],
    borderRadius: '50%',
    background: active 
      ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
    color: 'white',
    border: active ? '2px solid #a78bfa' : '2px solid rgba(255, 255, 255, 0.2)',
    cursor: 'pointer',
    boxShadow: active 
      ? '0 6px 24px rgba(139, 92, 246, 0.5), inset 0 1px 6px rgba(255, 255, 255, 0.2)' 
      : '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 4px rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
    ...style
  }

  return (
    <button
      onClick={onClick}
      style={baseStyle}
      onMouseEnter={(e) => {
        e.target.style.transform = 'scale(1.15) translateY(-4px)'
        e.target.style.boxShadow = active 
          ? '0 8px 32px rgba(139, 92, 246, 0.6), inset 0 1px 8px rgba(255, 255, 255, 0.3)' 
          : '0 6px 24px rgba(0, 0, 0, 0.3), inset 0 1px 6px rgba(255, 255, 255, 0.2)'
        e.target.style.background = active 
          ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)'
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'scale(1) translateY(0)'
        e.target.style.boxShadow = active 
          ? '0 6px 24px rgba(139, 92, 246, 0.5), inset 0 1px 6px rgba(255, 255, 255, 0.2)' 
          : '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 4px rgba(255, 255, 255, 0.1)'
        e.target.style.background = active 
          ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)'
      }}
    >
      {children}
    </button>
  )
}

const ActionButton = ({ item, index, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        minWidth: '95px',
        height: '75px',
        background: index === 0 
          ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        border: index === 0 ? '2px solid #a78bfa' : '2px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '16px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        color: 'white',
        boxShadow: index === 0 
          ? '0 6px 24px rgba(139, 92, 246, 0.4), inset 0 1px 6px rgba(255, 255, 255, 0.2)' 
          : '0 4px 16px rgba(0, 0, 0, 0.15), inset 0 1px 4px rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)'
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'translateY(-6px) scale(1.08)'
        e.target.style.boxShadow = index === 0 
          ? '0 8px 32px rgba(139, 92, 246, 0.5), inset 0 1px 8px rgba(255, 255, 255, 0.3)' 
          : '0 6px 24px rgba(0, 0, 0, 0.25), inset 0 1px 6px rgba(255, 255, 255, 0.2)'
        e.target.style.background = index === 0 
          ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)'
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0) scale(1)'
        e.target.style.boxShadow = index === 0 
          ? '0 6px 24px rgba(139, 92, 246, 0.4), inset 0 1px 6px rgba(255, 255, 255, 0.2)' 
          : '0 4px 16px rgba(0, 0, 0, 0.15), inset 0 1px 4px rgba(255, 255, 255, 0.1)'
        e.target.style.background = index === 0 
          ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)'
      }}
    >
      <div style={{ fontSize: '26px', filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))' }}>{item.icon}</div>
      <div style={{ fontSize: '10px', fontWeight: '700', textAlign: 'center', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>{item.name}</div>
    </button>
  )
}

export const ARScene = ({ selectedFile }) => {
  const [isARMode, setIsARMode] = useState(false)
  const videoRef = useRef(null)
  const [cameraFacingMode, setCameraFacingMode] = useState('environment')
  const streamRef = useRef(null)
  const canvasRef = useRef(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const recordingTimerRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])
  const [isSwingMode, setIsSwingMode] = useState(false)
  const gyroscopeRef = useRef(null)
  const lastGyroDataRef = useRef({ x: 0, y: 0, z: 0 })
  const swingThreshold = 0.5
  const [characters, setCharacters] = useState([null, null, null])
  const [selectedCharacterIndex, setSelectedCharacterIndex] = useState(0)
  const [showModelSelect, setShowModelSelect] = useState(false)
  const [characterScale, setCharacterScale] = useState(1.0)
  const [actionIntensity, setActionIntensity] = useState(1.0)
  const [isRandomMode, setIsRandomMode] = useState(false)
  const [showAnimationPanel, setShowAnimationPanel] = useState(false)
  const [modelAnimations, setModelAnimations] = useState([])

  const toggleSwingMode = () => {
    setIsSwingMode(!isSwingMode)
    console.log('摆动模式:', !isSwingMode ? '开启' : '关闭')
  }

  useEffect(() => {
    if (isSwingMode && window.DeviceOrientationEvent) {
      const handleOrientation = (event) => {
        const { alpha, beta, gamma } = event
        const gyroData = { x: beta, y: gamma, z: alpha }

        const swingX = Math.abs(gyroData.x - lastGyroDataRef.current.x)
        const swingY = Math.abs(gyroData.y - lastGyroDataRef.current.y)
        const swingZ = Math.abs(gyroData.z - lastGyroDataRef.current.z)

        if (swingX > swingThreshold || swingY > swingThreshold || swingZ > swingThreshold) {
          console.log('检测到大幅度摆动:', { swingX, swingY, swingZ })
          if (window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('swingDetected', {
              detail: { swingX, swingY, swingZ }
            }))
          }
        }

        lastGyroDataRef.current = gyroData
      }

      window.addEventListener('deviceorientation', handleOrientation)
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation)
      }
    }
  }, [isSwingMode])

  useEffect(() => {
    if (isARMode) {
      try {
        console.log('尝试获取摄像头权限...')
        
        const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        if (!isSecureContext) {
          console.error('摄像头访问需要在安全环境中（HTTPS或localhost）')
          alert('摄像头访问需要在安全环境中（HTTPS或localhost）。请在HTTPS环境下使用此功能。')
          setIsARMode(false)
          return
        }
        
        if (!navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.error('浏览器不支持摄像头访问')
          alert('您的浏览器不支持摄像头访问，请使用现代浏览器如Chrome、Firefox或Safari。')
          setIsARMode(false)
          return
        }
        
        console.log('浏览器支持摄像头访问，准备请求权限...')
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop())
          streamRef.current = null
        }
        
        navigator.mediaDevices.getUserMedia({ 
          video: {
            facingMode: cameraFacingMode
          }
        })
        .then(stream => {
          try {
            console.log('摄像头权限获取成功，流大小:', stream.getTracks().length)
            streamRef.current = stream
            if (videoRef.current) {
              videoRef.current.srcObject = stream
              console.log('摄像头视频流已设置到video元素')
            }
          } catch (error) {
            console.error('设置摄像头视频流失败:', error)
            setIsARMode(false)
          }
        })
        .catch(err => {
          console.error("AR Access Denied:", err)
          alert('摄像头权限被拒绝，请在浏览器设置中允许摄像头访问。')
        })
      } catch (error) {
        console.error('摄像头初始化失败:', error)
        setIsARMode(false)
      }
    } else {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => {
            try {
              t.stop()
            } catch (stopError) {
              console.error('停止摄像头轨道失败:', stopError)
            }
          })
          streamRef.current = null
          console.log('摄像头已关闭')
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null
        }
      } catch (error) {
        console.error('关闭摄像头失败:', error)
      }
    }
  }, [isARMode, cameraFacingMode])

  useEffect(() => {
    if (selectedFile) {
      console.log('检测到模型文件，等待模型加载完成后启动AR模式...')
      const timer = setTimeout(() => {
        console.log('启动AR模式...')
        setIsARMode(true)
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [selectedFile])

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('摄像头或画布未初始化')
      return
    }

    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      const ctx = canvas.getContext('2d')

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ar-photo-${Date.now()}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        console.log('拍照成功')
      })
    } catch (error) {
      console.error('拍照失败:', error)
    }
  }

  const startRecording = () => {
    if (!streamRef.current) {
      console.error('摄像头流未初始化')
      return
    }

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm'
      })

      mediaRecorderRef.current = mediaRecorder
      recordedChunksRef.current = []
      setRecordingTime(0)

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: 'video/webm'
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ar-video-${Date.now()}.webm`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        console.log('录像完成')
      }

      mediaRecorder.start()
      setIsRecording(true)

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      console.log('开始录像')
    } catch (error) {
      console.error('开始录像失败:', error)
    }
  }

  const stopRecording = () => {
    if (!mediaRecorderRef.current) {
      console.error('录像未开始')
      return
    }

    try {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }

      console.log('停止录像')
    } catch (error) {
      console.error('停止录像失败:', error)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {isARMode && (
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            filter: 'grayscale(5%)'
          }}
        />
      )}

      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: 1,
        background: isARMode ? 'transparent' : 'linear-gradient(to bottom, #0f172a 0%, #1e293b 100%)'
      }}>
        <Canvas gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}>
          <PerspectiveCamera makeDefault position={[0, 0.8, 2.5]} fov={50} />
          <ambientLight intensity={0.8} />
          <spotLight position={[5, 10, 5]} intensity={1.2} castShadow />
          <directionalLight position={[0, 5, 0]} intensity={0.6} />
          
          <ARContent selectedFile={selectedFile} />
          
          {!isARMode && (
            <OrbitControls 
              enablePan={false} 
              minDistance={1}
              maxDistance={5}
              target={[0, 0.6, 0]}
              maxPolarAngle={Math.PI / 1.8}
            />
          )}
        </Canvas>
      </div>
      
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        height: '70px',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(124, 58, 237, 0.9) 100%)',
        backdropFilter: 'blur(20px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)',
        borderBottom: '2px solid rgba(255, 255, 255, 0.2)'
      }}>
        <TechButton 
          size="small"
          onClick={() => window.location.reload()}
        >
          ✕
        </TechButton>
        <div style={{
          color: 'white',
          fontSize: '18px',
          fontWeight: '800',
          textShadow: '0 3px 8px rgba(0, 0, 0, 0.3)',
          letterSpacing: '1px'
        }}>
          ✨ AR角色系统 ✨
        </div>
        <div style={{ width: '50px' }} />
      </div>

      <div style={{
        position: 'absolute',
        top: '90px',
        left: '24px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {characters.map((character, index) => (
          <CharacterSlot
            key={index}
            character={character}
            index={index}
            onSelect={() => setSelectedCharacterIndex(index)}
            onRemove={(idx) => {
              const newCharacters = [...characters]
              newCharacters[idx] = null
              setCharacters(newCharacters)
            }}
            isSelected={selectedCharacterIndex === index}
          />
        ))}
      </div>

      <div style={{
        position: 'absolute',
        top: '90px',
        right: '24px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <TechButton 
          size="medium"
          active={showAnimationPanel}
          onClick={() => setShowModelSelect(true)}
        >
          ➕
        </TechButton>
        <TechButton 
          size="medium"
          onClick={() => setCharacterScale(Math.max(0.5, characterScale - 0.1))}
        >
          ➖
        </TechButton>
        <TechButton 
          size="medium"
          onClick={() => setCharacterScale(Math.min(2.0, characterScale + 0.1))}
        >
          ➕
        </TechButton>
        <TechButton 
          size="medium"
          active={isSwingMode}
          onClick={toggleSwingMode}
        >
          🔄
        </TechButton>
        <TechButton 
          size="medium"
          active={showAnimationPanel}
          onClick={() => setShowAnimationPanel(!showAnimationPanel)}
        >
          🎬
        </TechButton>
      </div>

      {showAnimationPanel && (
        <div style={{
          position: 'absolute',
          top: '90px',
          right: '90px',
          width: '220px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '20px',
          zIndex: 1000,
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
          border: '2px solid rgba(139, 92, 246, 0.3)'
        }}>
          <div style={{
            fontSize: '15px',
            fontWeight: '800',
            color: '#f9a8d4',
            marginBottom: '16px',
            textAlign: 'center',
            textShadow: '0 2px 8px rgba(249, 168, 212, 0.4)',
            letterSpacing: '1px'
          }}>
            ✨ 模型动画 ✨
          </div>
          {modelAnimations.length > 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              maxHeight: '320px',
              overflowY: 'auto',
              paddingRight: '8px'
            }}>
              {modelAnimations.map((anim, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (window.dispatchEvent) {
                      window.dispatchEvent(new CustomEvent('playModelAnimation', {
                        detail: { animationName: anim.name }
                      }))
                    }
                  }}
                  style={{
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(139, 92, 246, 0.15) 100%)',
                    color: 'white',
                    border: '2px solid rgba(139, 92, 246, 0.4)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '700',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.4) 0%, rgba(139, 92, 246, 0.3) 100%)'
                    e.target.style.transform = 'translateX(6px) scale(1.02)'
                    e.target.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(139, 92, 246, 0.15) 100%)'
                    e.target.style.transform = 'translateX(0) scale(1)'
                    e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.2)'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>🎭</span>
                  <span>{anim.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.6)',
              textAlign: 'center',
              padding: '24px 0',
              fontWeight: '600'
            }}>
              该模型没有自带动画
            </div>
          )}
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        height: '110px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '16px',
        overflowX: 'auto',
        boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.4)',
        borderTop: '2px solid rgba(139, 92, 246, 0.3)'
      }}>
        {[
          { action: 'idle', name: '待机', icon: '🧍' },
          { action: 'wave', name: '挥手', icon: '👋' },
          { action: 'dance', name: '舞蹈', icon: '💃' },
          { action: 'jump', name: '跳跃', icon: '🚀' },
          { action: 'sit', name: '坐下', icon: '🧘' },
          { action: 'run', name: '奔跑', icon: '🏃' },
          { action: 'happy', name: '开心', icon: '😊' },
          { action: 'sad', name: '难过', icon: '😢' },
          { action: 'combo', name: '连招', icon: '🎯' },
          { action: 'random', name: '随机', icon: '🎲' }
        ].map((item, index) => (
          <ActionButton
            key={index}
            item={item}
            index={index}
            onClick={() => {
              if (window.dispatchEvent) {
                if (item.action === 'combo') {
                  window.dispatchEvent(new CustomEvent('executeCombo', {
                    detail: { sequence: ['wave', 'dance', 'jump', 'happy'] }
                  }))
                } else if (item.action === 'random') {
                  window.dispatchEvent(new CustomEvent('toggleRandom'))
                } else {
                  window.dispatchEvent(new CustomEvent('executeAction', {
                    detail: { actionName: item.action }
                  }))
                }
              }
            }}
          />
        ))}
      </div>

      <div style={{
        position: 'absolute',
        bottom: '130px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        gap: '24px',
        alignItems: 'center'
      }}>
        <TechButton 
          size="large"
          onClick={takePhoto}
        >
          📷
        </TechButton>
        <TechButton 
          size="large"
          active={isRecording}
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? '⏹️' : '🎥'}
        </TechButton>
        <TechButton 
          size="large"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('resetPosition'))
          }}
        >
          🔄
        </TechButton>
      </div>

      {showModelSelect && (
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
            color: 'white',
            padding: '36px',
            borderRadius: '24px',
            width: '90%',
            maxWidth: '520px',
            maxHeight: '85vh',
            overflow: 'auto',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)',
            border: '2px solid rgba(139, 92, 246, 0.4)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h3 style={{ 
                margin: 0, 
                color: '#a78bfa', 
                fontSize: '20px',
                fontWeight: '800',
                textShadow: '0 2px 8px rgba(167, 139, 250, 0.4)',
                letterSpacing: '1px'
              }}>
                ✨ 选择模型 ✨
              </h3>
              <TechButton 
                size="small"
                onClick={() => setShowModelSelect(false)}
              >
                ✕
              </TechButton>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '14px'
            }}>
              {modelList.map((model, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const newCharacters = [...characters]
                    newCharacters[selectedCharacterIndex] = model
                    setCharacters(newCharacters)
                    setShowModelSelect(false)
                  }}
                  style={{
                    padding: '18px',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
                    color: 'white',
                    border: '2px solid rgba(139, 92, 246, 0.4)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    textAlign: 'center',
                    boxShadow: '0 4px 16px rgba(139, 92, 246, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.35) 0%, rgba(139, 92, 246, 0.25) 100%)'
                    e.target.style.transform = 'scale(1.05) translateY(-4px)'
                    e.target.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)'
                    e.target.style.transform = 'scale(1) translateY(0)'
                    e.target.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.2)'
                  }}
                >
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>🧑</div>
                  <div style={{ fontSize: '14px', fontWeight: '700' }}>{model.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default ARScene
