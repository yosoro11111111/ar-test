import React, { useRef, useEffect, useState } from 'react'

// AI对话系统组件
const AISystem = () => {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [memory, setMemory] = useState([]) // 模拟记忆数据库
  const messagesEndRef = useRef(null)

  // 模拟LLM响应
  const generateAIResponse = async (userInput) => {
    setIsLoading(true)
    
    // 检索记忆
    const relevantMemory = retrieveMemory(userInput)
    
    // 模拟LLM处理时间
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 基于用户输入和记忆生成响应
    let response = ''
    
    if (userInput.includes('你好') || userInput.includes('hello')) {
      response = '你好！很高兴见到你！今天过得怎么样？'
    } else if (userInput.includes('名字') || userInput.includes('叫什么')) {
      response = '我是Aetheris，你的幻梦之灵。'
    } else if (userInput.includes('心情') || userInput.includes('感觉')) {
      response = '我现在感觉很好，因为有你在身边！'
    } else if (userInput.includes('吃饭') || userInput.includes('饿')) {
      response = '谢谢你关心我，我现在不饿哦！'
    } else if (relevantMemory.length > 0) {
      // 基于记忆生成响应
      response = `我记得你之前说过关于${relevantMemory[0].topic}的事情，你现在还在想那个吗？`
    } else {
      response = '这是一个很有趣的话题！能告诉我更多吗？'
    }
    
    // 保存到记忆
    saveToMemory(userInput, response)
    
    setIsLoading(false)
    return response
  }

  // 检索记忆
  const retrieveMemory = (userInput) => {
    // 简单的关键词匹配
    return memory.filter(item => 
      userInput.toLowerCase().includes(item.userInput.toLowerCase()) ||
      item.userInput.toLowerCase().includes(userInput.toLowerCase())
    ).slice(0, 3)
  }

  // 保存到记忆
  const saveToMemory = (userInput, aiResponse) => {
    // 提取主题关键词
    const topic = extractTopic(userInput)
    
    setMemory(prev => [
      ...prev,
      {
        id: Date.now(),
        userInput,
        aiResponse,
        topic,
        timestamp: new Date().toISOString()
      }
    ].slice(-50)) // 只保留最近50条记忆
  }

  // 提取主题关键词
  const extractTopic = (text) => {
    // 简单的主题提取
    const keywords = ['天气', '心情', '工作', '学习', '朋友', '家人', '游戏', '电影', '音乐']
    
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return keyword
      }
    }
    
    return '其他'
  }

  // 处理发送消息
  const handleSendMessage = async () => {
    if (!inputText.trim()) return
    
    // 添加用户消息
    const userMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      timestamp: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    
    // 生成AI响应
    const aiResponse = await generateAIResponse(inputText)
    
    // 添加AI消息
    const aiMessage = {
      id: Date.now() + 1,
      text: aiResponse,
      sender: 'ai',
      timestamp: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, aiMessage])
  }

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="ai-system">
      <div className="chat-container">
        <div className="chat-header">
          <h3>AI对话</h3>
        </div>
        
        <div className="messages-container">
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
            >
              <div className="message-content">
                {message.text}
              </div>
              <div className="message-time">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message ai-message">
              <div className="message-content">
                <div className="loading-indicator">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="input-container">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="输入消息..."
            disabled={isLoading}
          />
          <button 
            onClick={handleSendMessage} 
            disabled={isLoading || !inputText.trim()}
          >
            发送
          </button>
        </div>
      </div>

      <style jsx>{`
        .ai-system {
          position: absolute;
          bottom: 20px;
          left: 20px;
          width: 350px;
          z-index: 1000;
        }
        
        .chat-container {
          background: rgba(0, 0, 0, 0.8);
          border-radius: 10px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 400px;
        }
        
        .chat-header {
          background: #646cff;
          padding: 10px;
          text-align: center;
        }
        
        .chat-header h3 {
          margin: 0;
          color: white;
          font-size: 16px;
        }
        
        .messages-container {
          flex: 1;
          padding: 15px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .message {
          max-width: 80%;
          padding: 10px;
          border-radius: 10px;
          position: relative;
        }
        
        .user-message {
          align-self: flex-end;
          background: #45b7d1;
          color: white;
          border-bottom-right-radius: 0;
        }
        
        .ai-message {
          align-self: flex-start;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border-bottom-left-radius: 0;
        }
        
        .message-content {
          font-size: 14px;
          line-height: 1.4;
        }
        
        .message-time {
          font-size: 10px;
          opacity: 0.7;
          margin-top: 5px;
          text-align: right;
        }
        
        .loading-indicator {
          display: flex;
          gap: 5px;
        }
        
        .loading-indicator span {
          animation: pulse 1.5s infinite;
        }
        
        .loading-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .loading-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes pulse {
          0% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
        }
        
        .input-container {
          display: flex;
          padding: 10px;
          gap: 10px;
          background: rgba(255, 255, 255, 0.1);
        }
        
        .input-container input {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 5px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          outline: none;
        }
        
        .input-container input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
        
        .input-container button {
          padding: 10px 15px;
          border: none;
          border-radius: 5px;
          background: #646cff;
          color: white;
          cursor: pointer;
          font-size: 14px;
        }
        
        .input-container button:hover {
          background: #535bf2;
        }
        
        .input-container button:disabled {
          background: rgba(100, 108, 255, 0.5);
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}

export default AISystem