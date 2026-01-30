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
        
        // 简化的摄像头请求，使用默认参数
        navigator.mediaDevices.getUserMedia({ 
          video: true
        })
        .then(stream => {
          try {
            console.log('摄像头权限获取成功，流大小:', stream.getTracks().length);
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
        if (videoRef.current && videoRef.current.srcObject) {
          const mediaStream = videoRef.current.srcObject;
          if (mediaStream && typeof mediaStream.getTracks === 'function') {
            mediaStream.getTracks().forEach(t => {
              try {
                t.stop();
              } catch (stopError) {
                console.error('停止摄像头轨道失败:', stopError);
              }
            });
            console.log('摄像头已关闭');
          }
        }
      } catch (error) {
        console.error('关闭摄像头失败:', error);
      }
    }
  }, [isARMode]);

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
        <div style={{
          marginTop: '12px',
          background: 'rgba(0, 0, 0, 0.6)',
          color: 'white',
          padding: '10px',
          borderRadius: '8px',
          fontSize: '12px',
          textAlign: 'center'
        }}>
          {isARMode ? 'AR模式已激活，摄像头正在使用中' : '点击按钮启动AR模式，将使用摄像头显示真实环境'}
        </div>
      </div>
    </div>
  )
}

export default ARScene