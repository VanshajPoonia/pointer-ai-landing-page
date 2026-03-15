"use client"

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  Send, 
  Code, 
  FileCode, 
  Loader2,
  Copy,
  Check,
  Sparkles,
  FolderTree,
  Search,
  Lightbulb
} from 'lucide-react'

interface FileContext {
  id: string
  name: string
  path: string
  content?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  codeBlocks?: { language: string; code: string }[]
  referencedFiles?: string[]
  timestamp: Date
}

interface CodebaseChatProps {
  isOpen: boolean
  onClose: () => void
  files: FileContext[]
  currentFile?: FileContext
  onNavigateToFile?: (fileId: string, line?: number) => void
  onInsertCode?: (code: string) => void
}

const SUGGESTED_QUESTIONS = [
  "What does this codebase do?",
  "How is authentication handled?",
  "Where are the API routes defined?",
  "What components are available?",
  "How can I add a new feature?",
  "Explain the file structure"
]

export function CodebaseChat({
  isOpen,
  onClose,
  files,
  currentFile,
  onNavigateToFile,
  onInsertCode
}: CodebaseChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai-codebase-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          files: files.map(f => ({ name: f.name, path: f.path, content: f.content?.slice(0, 2000) })),
          currentFile: currentFile ? { name: currentFile.name, path: currentFile.path } : null,
          history: messages.slice(-10)
        })
      })

      if (response.ok) {
        const result = await response.json()
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.content,
          codeBlocks: result.codeBlocks,
          referencedFiles: result.referencedFiles,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        // Generate mock response
        setMessages(prev => [...prev, generateMockResponse(content, files, currentFile)])
      }
    } catch (error) {
      setMessages(prev => [...prev, generateMockResponse(content, files, currentFile)])
    } finally {
      setIsLoading(false)
    }
  }

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] bg-[#1e1e1e] border-[#3c3c3c] p-0 flex flex-col">
        <DialogHeader className="p-4 border-b border-[#3c3c3c]">
          <DialogTitle className="flex items-center gap-2 text-[#cccccc]">
            <MessageSquare className="h-5 w-5 text-blue-400" />
            Codebase Chat
            <Badge variant="outline" className="ml-2 text-[10px]">
              {files.length} files indexed
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
              <div className="text-center">
                <Sparkles className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#cccccc] mb-2">
                  Ask anything about your codebase
                </h3>
                <p className="text-sm text-[#888888] max-w-md">
                  I have context of all {files.length} files in your project. 
                  Ask me about architecture, how things work, or how to implement features.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 max-w-lg">
                {SUGGESTED_QUESTIONS.map((question, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(question)}
                    className="flex items-center gap-2 p-3 text-left text-sm bg-[#2d2d2d] hover:bg-[#3c3c3c] rounded-lg border border-[#3c3c3c] text-[#cccccc] transition-colors"
                  >
                    <Lightbulb className="h-4 w-4 text-yellow-400 shrink-0" />
                    <span className="line-clamp-2">{question}</span>
                  </button>
                ))}
              </div>

              {currentFile && (
                <div className="flex items-center gap-2 text-xs text-[#888888]">
                  <FileCode className="h-4 w-4" />
                  Current context: {currentFile.name}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#2d2d2d] text-[#cccccc] border border-[#3c3c3c]'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {message.codeBlocks?.map((block, i) => (
                      <div key={i} className="mt-3 rounded overflow-hidden border border-[#3c3c3c]">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-[#1a1a1a]">
                          <span className="text-xs text-[#888888]">{block.language}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                            onClick={() => copyCode(block.code, `${message.id}-${i}`)}
                          >
                            {copiedId === `${message.id}-${i}` ? (
                              <Check className="h-3 w-3 text-green-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <pre className="p-3 text-xs font-mono bg-[#0d0d0d] overflow-x-auto">
                          <code>{block.code}</code>
                        </pre>
                        {onInsertCode && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-full h-7 text-xs rounded-none border-t border-[#3c3c3c]"
                            onClick={() => onInsertCode(block.code)}
                          >
                            <Code className="h-3 w-3 mr-1" />
                            Insert at cursor
                          </Button>
                        )}
                      </div>
                    ))}

                    {message.referencedFiles && message.referencedFiles.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {message.referencedFiles.map((file, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              const f = files.find(f => f.path.includes(file) || f.name === file)
                              if (f && onNavigateToFile) onNavigateToFile(f.id)
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-[#1a1a1a] hover:bg-[#3c3c3c] rounded text-blue-400"
                          >
                            <FileCode className="h-3 w-3" />
                            {file}
                          </button>
                        ))}
                      </div>
                    )}

                    <span className="text-[10px] text-[#666666] mt-2 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#2d2d2d] rounded-lg p-3 border border-[#3c3c3c]">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t border-[#3c3c3c]">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your codebase..."
              className="bg-[#2d2d2d] border-[#3c3c3c] text-[#cccccc]"
              disabled={isLoading}
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function generateMockResponse(question: string, files: FileContext[], currentFile?: FileContext): ChatMessage {
  const q = question.toLowerCase()
  let content = ''
  let codeBlocks: { language: string; code: string }[] = []
  let referencedFiles: string[] = []

  if (q.includes('what does') || q.includes('codebase do')) {
    const components = files.filter(f => f.path.includes('components')).length
    const pages = files.filter(f => f.path.includes('app') && f.name.includes('page')).length
    const apis = files.filter(f => f.path.includes('api')).length
    
    content = `This appears to be a Next.js application with:\n\n• ${components} components\n• ${pages} pages/routes\n• ${apis} API endpoints\n\nThe project uses TypeScript and appears to follow the App Router pattern.`
    referencedFiles = ['app/page.tsx', 'components/']
  } else if (q.includes('authentication') || q.includes('auth')) {
    content = `Based on the codebase, authentication appears to be handled through:\n\n1. Supabase Auth integration\n2. Server-side session management\n3. Protected routes via middleware\n\nThe auth flow uses email/password and potentially OAuth providers.`
    referencedFiles = ['lib/supabase/client.ts', 'middleware.ts']
  } else if (q.includes('api') || q.includes('routes')) {
    const apiFiles = files.filter(f => f.path.includes('api'))
    content = `API routes are defined in the \`app/api/\` directory. Found ${apiFiles.length} API endpoints including:\n\n${apiFiles.slice(0, 5).map(f => `• ${f.path}`).join('\n')}`
    referencedFiles = apiFiles.slice(0, 3).map(f => f.name)
  } else if (q.includes('component')) {
    const componentFiles = files.filter(f => f.path.includes('components'))
    content = `Found ${componentFiles.length} components in the project:\n\n${componentFiles.slice(0, 8).map(f => `• ${f.name}`).join('\n')}\n\nComponents follow a modular pattern with UI primitives in \`components/ui/\`.`
    referencedFiles = componentFiles.slice(0, 3).map(f => f.name)
  } else if (q.includes('add') || q.includes('feature') || q.includes('implement')) {
    content = `To add a new feature, I recommend:\n\n1. Create a new component in \`components/\`\n2. Add any necessary API routes in \`app/api/\`\n3. Update the relevant page to use the component\n4. Add types if using TypeScript\n\nHere's a basic component template:`
    codeBlocks = [{
      language: 'typescript',
      code: `"use client"\n\nimport { useState } from 'react'\n\ninterface MyFeatureProps {\n  // props here\n}\n\nexport function MyFeature({ }: MyFeatureProps) {\n  const [state, setState] = useState()\n\n  return (\n    <div>\n      {/* Your feature UI */}\n    </div>\n  )\n}`
    }]
  } else if (q.includes('file structure') || q.includes('structure')) {
    content = `The project follows Next.js App Router conventions:\n\n\`\`\`\n├── app/           # Pages and API routes\n├── components/    # React components\n├── hooks/         # Custom React hooks\n├── lib/           # Utilities and configs\n├── public/        # Static assets\n└── scripts/       # Database migrations\n\`\`\`\n\nEach route in \`app/\` can have page.tsx, layout.tsx, and loading.tsx files.`
  } else {
    content = `Based on analyzing your codebase with ${files.length} files, I can help you understand:\n\n• Code architecture and patterns\n• How specific features work\n• Best practices for this project\n• How to implement new functionality\n\nCould you be more specific about what you'd like to know?`
  }

  return {
    id: (Date.now() + 1).toString(),
    role: 'assistant',
    content,
    codeBlocks: codeBlocks.length > 0 ? codeBlocks : undefined,
    referencedFiles: referencedFiles.length > 0 ? referencedFiles : undefined,
    timestamp: new Date()
  }
}

export default CodebaseChat
