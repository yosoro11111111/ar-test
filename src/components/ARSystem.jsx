import React, { useRef, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { CharacterController } from './CharacterSystem'

// Canvas内部的AR内容组件
const ARContent = ({ selectedFile }) => {
  return (
    <>
      {/* 显示角色模型 */}
      {selectedFile && (
        <CharacterController 
          position={[0, 1, -2]} 
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
      
      {/* AR控制界面 */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        width: '90%',
        maxWidth: '300px'
      }}>
        <button 
          onClick={() => setIsARMode(!isARMode)}
          style={{
            padding: '16px 24px',
            background: isARMode ? '#ef4444' : '#646cff',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: '600',
            width: '100%',
            boxShadow: isARMode ? '0 4px 15px rgba(239, 68, 68, 0.4)' : '0 4px 15px rgba(100, 108, 255, 0.4)',
            transition: 'all 0.3s ease'
          }}
        >
          {isARMode ? '关闭AR模式' : '启动AR模式'}
        </button>
        
        {isARMode && (
          <>
            <button 
              onClick={() => setCameraFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
              style={{
                marginTop: '12px',
                padding: '12px 20px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                width: '100%',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                transition: 'all 0.3s ease'
              }}
            >
              {cameraFacingMode === 'environment' ? '切换到前置摄像头' : '切换到后置摄像头'}
            </button>

            {/* 拍照录像控制 */}
            <div style={{
              marginTop: '16px',
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={takePhoto}
                style={{
                  padding: '12px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  width: '60px',
                  height: '60px',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                📷
              </button>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                style={{
                  padding: '12px',
                  background: isRecording ? '#ef4444' : '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  width: '60px',
                  height: '60px',
                  boxShadow: isRecording ? '0 4px 15px rgba(239, 68, 68, 0.4)' : '0 4px 15px rgba(245, 158, 11, 0.4)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isRecording ? '⏹️' : '🎥'}
              </button>
            </div>

            {/* 录像时间显示 */}
            {isRecording && (
              <div style={{
                marginTop: '12px',
                background: 'rgba(239, 68, 68, 0.8)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
              }}>
                录制中: {formatTime(recordingTime)}
              </div>
            )}
          </>
        )}
        
        <div style={{
          marginTop: '12px',
          background: 'rgba(0, 0, 0, 0.6)',
          color: 'white',
          padding: '10px',
          borderRadius: '8px',
          fontSize: '12px',
          textAlign: 'center'
        }}>
          {isARMode ? 
            `AR模式已激活，当前使用${cameraFacingMode === 'environment' ? '后置' : '前置'}摄像头` : 
            '点击按钮启动AR模式，将使用摄像头显示真实环境'
          }
        </div>
      </div>

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