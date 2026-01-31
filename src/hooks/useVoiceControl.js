// 语音控制Hook
import { useState, useCallback, useRef, useEffect } from 'react'

export const useVoiceControl = (onCommand) => {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState(null)
  
  const recognitionRef = useRef(null)

  // 检查浏览器支持
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.lang = 'zh-CN'
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      
      recognitionRef.current.onresult = (event) => {
        const result = event.results[0][0].transcript
        setTranscript(result)
        parseCommand(result)
      }
      
      recognitionRef.current.onerror = (event) => {
        console.error('语音识别错误:', event.error)
        setError(event.error)
        setIsListening(false)
      }
      
      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  // 解析语音命令
  const parseCommand = useCallback((text) => {
    const lowerText = text.toLowerCase()
    
    // 动作命令
    const actionCommands = {
      '待机': 'idle',
      '站立': 'stand',
      '坐下': 'sit',
      '走路': 'walk',
      '跑步': 'run',
      '跳跃': 'jump',
      '挥手': 'wave',
      '打招呼': 'greet',
      '鞠躬': 'bow',
      '开心': 'happy',
      '伤心': 'sad',
      '生气': 'angry',
      '惊讶': 'surprised',
      '跳舞': 'dance',
      '唱歌': 'sing',
      '睡觉': 'sleep',
      '拍照': 'photo',
      '放大': 'zoomIn',
      '缩小': 'zoomOut',
      '旋转': 'rotate',
      '重置': 'reset'
    }
    
    // 检查动作命令
    for (const [command, action] of Object.entries(actionCommands)) {
      if (lowerText.includes(command)) {
        onCommand?.({ type: 'action', value: action, original: text })
        return
      }
    }
    
    // 家具命令
    const furnitureCommands = {
      '椅子': 'chair',
      '沙发': 'sofa',
      '吉他': 'guitar',
      '钢琴': 'piano',
      '皇冠': 'crown',
      '眼镜': 'glasses',
      '剑': 'sword',
      '盾牌': 'shield',
      '花': 'flower',
      '气球': 'balloon'
    }
    
    for (const [command, furniture] of Object.entries(furnitureCommands)) {
      if (lowerText.includes(command)) {
        onCommand?.({ type: 'furniture', value: furniture, original: text })
        return
      }
    }
    
    // 表情命令
    const expressionCommands = {
      '微笑': 'happy',
      '大笑': 'laugh',
      '哭泣': 'cry',
      '眨眼': 'wink',
      '爱心': 'love',
      '酷': 'cool'
    }
    
    for (const [command, expression] of Object.entries(expressionCommands)) {
      if (lowerText.includes(command)) {
        onCommand?.({ type: 'expression', value: expression, original: text })
        return
      }
    }
    
    // 系统命令
    if (lowerText.includes('拍照') || lowerText.includes('截图')) {
      onCommand?.({ type: 'system', value: 'screenshot', original: text })
      return
    }
    
    if (lowerText.includes('录像') || lowerText.includes('录制')) {
      onCommand?.({ type: 'system', value: 'record', original: text })
      return
    }
    
    if (lowerText.includes('帮助') || lowerText.includes('怎么')) {
      onCommand?.({ type: 'system', value: 'help', original: text })
      return
    }
    
    // 未识别命令
    onCommand?.({ type: 'unknown', value: text, original: text })
  }, [onCommand])

  // 开始监听
  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setError(null)
      setTranscript('')
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (err) {
        setError(err.message)
      }
    }
  }, [isListening])

  // 停止监听
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [isListening])

  // 切换监听状态
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  return {
    isListening,
    isSupported,
    transcript,
    error,
    startListening,
    stopListening,
    toggleListening
  }
}

export default useVoiceControl
