'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Bot, Send, X, Sparkles, Loader2, Trash2 } from 'lucide-react'
import { Button } from './ui/button'

interface AIAssistantPanelProps {
  code: string
  language: string
  isOpen: boolean
  onClose: () => void
}

export function AIAssistantPanel({ code, language, isOpen, onClose }: AIAssistantPanelProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ 
      api: '/api/ai-assistant',
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: {
          messages,
          id,
          code,
          language,
        },
      }),
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  const clearChat = () => {
    setMessages([])
  }

  if (!isOpen) return null

  return (
    <div className="w-[400px] h-full flex flex-col bg-[#252526] border-l border-[#191919]">
      {/* Header */}
      <div className="flex items-center justify-between h-[35px] px-4 bg-[#252526] border-b border-[#191919]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="text-[11px] font-semibold text-white uppercase tracking-wide">Volt AI</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="h-6 w-6 p-0 text-[#858585] hover:text-[#cccccc] hover:bg-[#3e3e42]"
            title="Clear chat"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 text-[#858585] hover:text-[#cccccc] hover:bg-[#3e3e42]"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-4">
              <Bot className="h-6 w-6 text-amber-500" />
            </div>
            <h3 className="text-[#cccccc] font-medium mb-2">Volt AI Assistant</h3>
            <p className="text-[#808080] text-sm mb-4">
              Ask me anything about your code. I can help you debug, explain concepts, or suggest improvements.
            </p>
            <div className="grid gap-2 w-full">
              {[
                'Explain this code',
                'Find bugs in my code',
                'How can I improve this?',
                'What does this error mean?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    sendMessage({ text: suggestion })
                  }}
                  className="text-left px-3 py-2 rounded-lg bg-[#3c3c3c] hover:bg-[#4a4a4a] text-[#cccccc] text-sm transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  message.role === 'user'
                    ? 'bg-[#0e639c] text-white'
                    : 'bg-[#3c3c3c] text-[#cccccc]'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    <span className="text-[10px] font-medium text-amber-500">Volt AI</span>
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap">
                  {message.parts.map((part, index) => {
                    if (part.type === 'text') {
                      // Simple markdown-like rendering for code blocks
                      const text = part.text
                      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
                      const parts = []
                      let lastIndex = 0
                      let match

                      while ((match = codeBlockRegex.exec(text)) !== null) {
                        // Add text before code block
                        if (match.index > lastIndex) {
                          parts.push(
                            <span key={`text-${lastIndex}`}>
                              {text.slice(lastIndex, match.index)}
                            </span>
                          )
                        }
                        // Add code block
                        parts.push(
                          <pre
                            key={`code-${match.index}`}
                            className="mt-2 mb-2 p-2 bg-[#1e1e1e] rounded text-xs overflow-x-auto"
                          >
                            <code>{match[2]}</code>
                          </pre>
                        )
                        lastIndex = match.index + match[0].length
                      }
                      // Add remaining text
                      if (lastIndex < text.length) {
                        parts.push(
                          <span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>
                        )
                      }
                      return parts.length > 0 ? parts : <span key={index}>{text}</span>
                    }
                    return null
                  })}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#3c3c3c] rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
                <span className="text-[#808080] text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[#191919]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Volt AI..."
            disabled={isLoading}
            className="flex-1 bg-[#3c3c3c] border border-[#3c3c3c] rounded-lg px-3 py-2 text-sm text-[#cccccc] placeholder:text-[#808080] focus:outline-none focus:border-[#007acc]"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || isLoading}
            className="h-9 w-9 p-0 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
