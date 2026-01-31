import { useState, useCallback, useRef, useEffect } from 'react'

// 语音控制 Hook
// 支持语音识别和语音指令控制
export const useVoiceControl = ({ onCommand, enabled = true }) => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState(null)
  const [isSupported, setIsSupported] = useState(true)
  const recognitionRef = useRef(null)
  const timeoutRef = useRef(null)

  // 指令映射表
  const commandMap = {
    // 基础动作
    '跳': 'jump',
    '跳跃': 'jump',
    '跳一下': 'jump',
    '走': 'walk',
    '走路': 'walk',
    '跑': 'run',
    '奔跑': 'run',
    '坐': 'sit',
    '坐下': 'sit',
    '站': 'stand',
    '站立': 'stand',
    '躺': 'lie',
    '躺下': 'lie',
    '打招呼': 'greet',
    '挥手': 'wave',
    '鞠躬': 'bow',
    '敬礼': 'salute',

    // 情绪表情
    '开心': 'happy',
    '笑': 'laugh',
    '大笑': 'laugh',
    '微笑': 'smile',
    '害羞': 'shy',
    '伤心': 'sad',
    '哭': 'cry',
    '生气': 'angry',
    '惊讶': 'surprised',
    '震惊': 'shocked',

    // 战斗动作
    '攻击': 'attack',
    '防御': 'defend',
    '闪避': 'dodge',
    '胜利': 'victory',
    '失败': 'defeat',

    // 舞蹈
    '跳舞': 'hiphop',
    '舞蹈': 'hiphop',
    '街舞': 'hiphop',
    '芭蕾': 'ballet',
    '拉丁': 'latin',
    '宅舞': 'otaku',

    // 日常动作
    '吃': 'eat',
    '吃饭': 'eat',
    '喝': 'drink',
    '喝水': 'drink',
    '睡': 'sleep',
    '睡觉': 'sleep',
    '拍照': 'photo',
    '自拍': 'selfie',
    '看书': 'read',
    '写字': 'write',

    // 特殊
    ' idle': 'idle',
    '待机': 'idle',
    '停止': 'idle',
    '随机': 'random',
    '随便': 'random'
  }

  useEffect(() => {
    // 检查浏览器是否支持语音识别
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setIsSupported(false)
      setError('浏览器不支持语音识别功能')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'zh-CN'

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    recognition.onend = () => {
      setIsListening(false)
      // 自动重启识别（如果仍在启用状态）
      if (enabled && recognitionRef.current) {
        timeoutRef.current = setTimeout(() => {
          try {
            recognitionRef.current.start()
          } catch (e) {
            // 忽略重启错误
          }
        }, 500)
      }
    }

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      const fullTranscript = finalTranscript || interimTranscript
      setTranscript(fullTranscript)

      // 解析指令
      if (finalTranscript) {
        parseCommand(finalTranscript)
      }
    }

    recognition.onerror = (event) => {
      console.error('语音识别错误:', event.error)
      setError(event.error)
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // 忽略停止错误
        }
      }
    }
  }, [enabled])

  // 解析语音指令
  const parseCommand = useCallback((text) => {
    const cleanText = text.toLowerCase().trim()
    console.log('识别到语音:', cleanText)

    // 遍历指令映射表
    for (const [keyword, action] of Object.entries(commandMap)) {
      if (cleanText.includes(keyword)) {
        console.log('匹配指令:', keyword, '->', action)
        onCommand?.(action, cleanText)
        return
      }
    }

    // 如果没有匹配到指令，尝试模糊匹配
    const fuzzyMatch = fuzzyFindCommand(cleanText)
    if (fuzzyMatch) {
      console.log('模糊匹配指令:', fuzzyMatch)
      onCommand?.(fuzzyMatch, cleanText)
    }
  }, [onCommand])

  // 模糊查找指令
  const fuzzyFindCommand = (text) => {
    // 简单的模糊匹配逻辑
    const keywords = Object.keys(commandMap)
    let bestMatch = null
    let bestScore = 0

    for (const keyword of keywords) {
      let score = 0
      // 计算相似度
      for (let i = 0; i < Math.min(text.length, keyword.length); i++) {
        if (text[i] === keyword[i]) {
          score++
        }
      }
      // 如果包含关键词，额外加分
      if (text.includes(keyword)) {
        score += 5
      }

      if (score > bestScore && score >= 2) {
        bestScore = score
        bestMatch = commandMap[keyword]
      }
    }

    return bestMatch
  }

  // 开始监听
  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      setError('语音识别不可用')
      return
    }

    try {
      recognitionRef.current.start()
    } catch (e) {
      console.error('启动语音识别失败:', e)
      setError('启动失败，请重试')
    }
  }, [isSupported])

  // 停止监听
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        // 忽略停止错误
      }
    }
    setIsListening(false)
  }, [])

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
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    toggleListening
  }
}

export default useVoiceControl
