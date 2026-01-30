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
        width: '70px',
        height: '70px',
        borderRadius: '50%',
        background: isSelected 
          ? 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)' 
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
        border: isSelected 
          ? '3px solid #f9a8d4' 
          : '2px solid rgba(255, 255, 255, 0.3)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        position: 'relative',
        boxShadow: isSelected 
          ? '0 8px 30px rgba(244, 114, 182, 0.4), inset 0 2px 10px rgba(255, 255, 255, 0.2)' 
          : '0 4px 15px rgba(0, 0, 0, 0.1), inset 0 1px 5px rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)'
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'scale(1.15) translateY(-5px)'
        e.target.style.boxShadow = isSelected 
          ? '0 12px 40px rgba(244, 114, 182, 0.5), inset 0 2px 10px rgba(255, 255, 255, 0.3)' 
          : '0 8px 25px rgba(0, 0, 0, 0.2), inset 0 1px 5px rgba(255, 255, 255, 0.2)'
        e.target.style.background = isSelected 
          ? 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)' 
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)'
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'scale(1) translateY(0)'
        e.target.style.boxShadow = isSelected 
          ? '0 8px 30px rgba(244, 114, 182, 0.4), inset 0 2px 10px rgba(255, 255, 255, 0.2)' 
          : '0 4px 15px rgba(0, 0, 0, 0.1), inset 0 1px 5px rgba(255, 255, 255, 0.1)'
        e.target.style.background = isSelected 
          ? 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)' 
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)'
      }}
    >
      {character ? (
        <>
          <div style={{ 
            fontSize: '28px',
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
          }}>✨</div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove(index)
            }}
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #fb7185 0%, #f43f5e 100%)',
              color: 'white',
              border: '2px solid white',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(244, 63, 94, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.2)'
              e.target.style.boxShadow = '0 6px 20px rgba(244, 63, 94, 0.6)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)'
              e.target.style.boxShadow = '0 4px 15px rgba(244, 63, 94, 0.4)'
            }}
          >
            ×
          </button>
        </>
      ) : (
        <div style={{ 
          fontSize: '32px', 
          opacity: 0.6,
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
        }}>+</div>
      )}
    </div>
  )
}

const ARContent = ({ selectedFile }) => {
  return (
    <>
      {/* 显示角色模型 */}
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

// 主AR场景组件
export const ARScene = ({ selectedFile }) => {
  const [isARMode, setIsARMode] = useState(false)
  const videoRef = useRef(null)
  const [cameraFacingMode, setCameraFacingMode] = useState('environment') // 'environment' 或 'user'
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

  // 切换摆动模式
  const toggleSwingMode = () => {
    setIsSwingMode(!isSwingMode)
    console.log('摆动模式:', !isSwingMode ? '开启' : '关闭')
  }

  // 监听陀螺仪数据
  useEffect(() => {
    if (isSwingMode && window.DeviceOrientationEvent) {
      const handleOrientation = (event) => {
        const { alpha, beta, gamma } = event
        const gyroData = { x: beta, y: gamma, z: alpha }

        // 计算摆动幅度
        const swingX = Math.abs(gyroData.x - lastGyroDataRef.current.x)
        const swingY = Math.abs(gyroData.y - lastGyroDataRef.current.y)
        const swingZ = Math.abs(gyroData.z - lastGyroDataRef.current.z)

        // 检测大幅度摆动
        if (swingX > swingThreshold || swingY > swingThreshold || swingZ > swingThreshold) {
          console.log('检测到大幅度摆动:', { swingX, swingY, swingZ })
          // 触发摆动动作
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

  // 摄像头控制
  useEffect(() => {
    if (isARMode) {
      try {
        console.log('尝试获取摄像头权限...');
        
        // 检查是否在安全环境中（HTTPS或localhost）
        const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (!isSecureContext) {
          console.error('摄像头访问需要在安全环境中（HTTPS或localhost）');
          alert('摄像头访问需要在安全环境中（HTTPS或localhost）。请在HTTPS环境下使用此功能。');
          setIsARMode(false);
          return;
        }
        
        // 检查浏览器是否支持摄像头访问
        if (!navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.error('浏览器不支持摄像头访问');
          alert('您的浏览器不支持摄像头访问，请使用现代浏览器如Chrome、Firefox或Safari。');
          setIsARMode(false);
          return;
        }
        
        console.log('浏览器支持摄像头访问，准备请求权限...');
        
        // 关闭之前的流
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
        
        // 请求摄像头，指定方向
        navigator.mediaDevices.getUserMedia({ 
          video: {
            facingMode: cameraFacingMode
          }
        })
        .then(stream => {
          try {
            console.log('摄像头权限获取成功，流大小:', stream.getTracks().length);
            streamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              console.log('摄像头视频流已设置到video元素');
            }
          } catch (error) {
            console.error('设置摄像头视频流失败:', error);
            setIsARMode(false);
          }
        })
        .catch(err => {
          console.error("AR Access Denied:", err);
          // 提示用户权限被拒绝
          alert('摄像头权限被拒绝，请在浏览器设置中允许摄像头访问。');
          // 不要立即关闭AR模式，让用户有机会修改设置
          // setIsARMode(false);
        });
      } catch (error) {
        console.error('摄像头初始化失败:', error);
        setIsARMode(false);
      }
    } else {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => {
            try {
              t.stop();
            } catch (stopError) {
              console.error('停止摄像头轨道失败:', stopError);
            }
          });
          streamRef.current = null;
          console.log('摄像头已关闭');
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      } catch (error) {
        console.error('关闭摄像头失败:', error);
      }
    }
  }, [isARMode, cameraFacingMode]);

  // 当模型文件加载时自动启动AR模式
  useEffect(() => {
    if (selectedFile) {
      console.log('检测到模型文件，等待模型加载完成后启动AR模式...');
      // 延迟启动AR模式，确保模型有足够时间加载
      const timer = setTimeout(() => {
        console.log('启动AR模式...');
        setIsARMode(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [selectedFile]);

  // 拍照功能
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('摄像头或画布未初始化');
      return;
    }

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');

      // 设置画布尺寸
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // 绘制视频画面
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 转换为图片并下载
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ar-photo-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('拍照成功');
      });
    } catch (error) {
      console.error('拍照失败:', error);
    }
  };

  // 开始录像
  const startRecording = () => {
    if (!streamRef.current) {
      console.error('摄像头流未初始化');
      return;
    }

    try {
      // 创建MediaRecorder
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm'
      });

      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];
      setRecordingTime(0);

      // 监听数据可用事件
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      // 监听录制结束事件
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: 'video/webm'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ar-video-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('录像完成');
      };

      // 开始录制
      mediaRecorder.start();
      setIsRecording(true);

      // 开始计时
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      console.log('开始录像');
    } catch (error) {
      console.error('开始录像失败:', error);
    }
  };

  // 停止录像
  const stopRecording = () => {
    if (!mediaRecorderRef.current) {
      console.error('录像未开始');
      return;
    }

    try {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // 清除计时器
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      console.log('停止录像');
    } catch (error) {
      console.error('停止录像失败:', error);
    }
  };

  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
            filter: 'grayscale(10%)'
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
      
      {/* 顶部导航栏 */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        height: '60px',
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)'
      }}>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}
        >
          ✕
        </button>
        <div style={{
          color: 'white',
          fontSize: '16px',
          fontWeight: '700',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
        }}>
          AR角色系统
        </div>
        <div style={{ width: '50px' }} />
      </div>

      {/* 左侧角色选择 */}
      <div style={{
        position: 'absolute',
        top: '80px',
        left: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
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

      {/* 右侧控制按钮 */}
      <div style={{
        position: 'absolute',
        top: '80px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <button
          onClick={() => setShowModelSelect(true)}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)'
          }}
        >
          ➕
        </button>
        <button
          onClick={() => setCharacterScale(Math.max(0.5, characterScale - 0.1))}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)'
          }}
        >
          ➖
        </button>
        <button
          onClick={() => setCharacterScale(Math.min(2.0, characterScale + 0.1))}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)'
          }}
        >
          ➕
        </button>
        <button
          onClick={toggleSwingMode}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: isSwingMode ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            boxShadow: isSwingMode ? '0 4px 15px rgba(139, 92, 246, 0.4)' : '0 4px 15px rgba(99, 102, 241, 0.4)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)'
          }}
        >
          🔄
        </button>
        <button
          onClick={() => setShowAnimationPanel(!showAnimationPanel)}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: showAnimationPanel ? 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' : 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            boxShadow: showAnimationPanel ? '0 4px 15px rgba(236, 72, 153, 0.4)' : '0 4px 15px rgba(244, 114, 182, 0.4)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)'
          }}
        >
          🎬
        </button>
      </div>

      {/* 动画面板 */}
      {showAnimationPanel && (
        <div style={{
          position: 'absolute',
          top: '80px',
          right: '80px',
          width: '200px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '16px',
          zIndex: 1000,
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '700',
            color: '#f9a8d4',
            marginBottom: '12px',
            textAlign: 'center',
            textShadow: '0 2px 4px rgba(249, 168, 212, 0.3)'
          }}>
            ✨ 模型动画
          </div>
          {modelAnimations.length > 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '300px',
              overflowY: 'auto'
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
                    padding: '10px 12px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)',
                    color: 'white',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.4) 0%, rgba(99, 102, 241, 0.3) 100%)'
                    e.target.style.transform = 'translateX(5px)'
                    e.target.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)'
                    e.target.style.transform = 'translateX(0)'
                    e.target.style.boxShadow = 'none'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>🎭</span>
                  <span>{anim.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.6)',
              textAlign: 'center',
              padding: '20px 0'
            }}>
              该模型没有自带动画
            </div>
          )}
        </div>
      )}

      {/* 底部动作选择栏 */}
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        height: '100px',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: '15px',
        overflowX: 'auto',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.2)'
      }}>
        {[
          { action: 'idle', name: 'Ready to trailblaze', icon: '🧍' },
          { action: 'wave', name: 'Watch this!', icon: '👋' },
          { action: 'dance', name: 'Dance time!', icon: '💃' },
          { action: 'jump', name: 'Jump high!', icon: '🚀' },
          { action: 'sit', name: 'Take a seat', icon: '🧘' },
          { action: 'run', name: 'Run fast!', icon: '🏃' },
          { action: 'happy', name: 'So happy!', icon: '😊' },
          { action: 'sad', name: 'Feeling sad', icon: '😢' },
          { action: 'combo', name: 'Combo!', icon: '🎯' },
          { action: 'random', name: 'Random', icon: '🎲' }
        ].map((item, index) => (
          <button
            key={index}
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
            style={{
              minWidth: '100px',
              height: '80px',
              background: index === 0 ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'rgba(31, 41, 55, 0.8)',
              border: index === 0 ? '2px solid #60a5fa' : '2px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              color: 'white',
              boxShadow: index === 0 ? '0 4px 15px rgba(99, 102, 241, 0.4)' : '0 4px 15px rgba(0, 0, 0, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px) scale(1.05)'
              e.target.style.boxShadow = index === 0 ? '0 6px 20px rgba(99, 102, 241, 0.5)' : '0 6px 20px rgba(0, 0, 0, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)'
              e.target.style.boxShadow = index === 0 ? '0 4px 15px rgba(99, 102, 241, 0.4)' : '0 4px 15px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ fontSize: '24px' }}>{item.icon}</div>
            <div style={{ fontSize: '10px', fontWeight: '600', textAlign: 'center' }}>{item.name}</div>
          </button>
        ))}
      </div>

      {/* 底部中央拍照录像控制 */}
      <div style={{
        position: 'absolute',
        bottom: '120px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        gap: '20px',
        alignItems: 'center'
      }}>
        <button
          onClick={takePhoto}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '24px',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)'
          }}
        >
          📷
        </button>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: isRecording ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '28px',
            boxShadow: isRecording ? '0 4px 15px rgba(239, 68, 68, 0.4)' : '0 4px 15px rgba(245, 158, 11, 0.4)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)'
          }}
        >
          {isRecording ? '⏹️' : '🎥'}
        </button>
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('resetPosition'))
          }}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '24px',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)'
          }}
        >
          🔄
        </button>
      </div>

      {/* 模型选择弹窗 */}
      {showModelSelect && (
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.95)',
            color: 'white',
            padding: '30px',
            borderRadius: '20px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, color: '#60a5fa' }}>选择模型</h3>
              <button
                onClick={() => setShowModelSelect(false)}
                style={{
                  padding: '8px 16px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px'
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
                    padding: '16px',
                    background: 'rgba(96, 165, 250, 0.15)',
                    color: 'white',
                    border: '2px solid rgba(96, 165, 250, 0.4)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(96, 165, 250, 0.3)'
                    e.target.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(96, 165, 250, 0.15)'
                    e.target.style.transform = 'scale(1)'
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🧑</div>
                  <div style={{ fontSize: '12px', fontWeight: '600' }}>{model.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 隐藏的画布，用于拍照 */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          display: 'none'
        }}
      />
    </div>
  )
}

export default ARScene