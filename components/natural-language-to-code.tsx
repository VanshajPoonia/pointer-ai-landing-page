"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  Wand2, 
  Loader2, 
  Copy, 
  Check, 
  Code,
  Sparkles,
  FileCode,
  ArrowRight
} from 'lucide-react'

interface NLToCodeProps {
  isOpen: boolean
  onClose: () => void
  language: string
  currentCode?: string
  onInsertCode: (code: string) => void
  onReplaceCode?: (code: string) => void
}

const EXAMPLE_PROMPTS = [
  "Create a function that fetches user data from an API",
  "Add a debounce utility function",
  "Create a React hook for local storage",
  "Write a function to validate email addresses",
  "Create a sorting function for an array of objects",
  "Add error boundary component",
  "Create a custom fetch wrapper with retry logic",
  "Write a function to deep clone objects"
]

export function NaturalLanguageToCode({
  isOpen,
  onClose,
  language,
  currentCode,
  onInsertCode,
  onReplaceCode
}: NLToCodeProps) {
  const [prompt, setPrompt] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<{ prompt: string; code: string }[]>([])

  const generateCode = async () => {
    if (!prompt.trim() || isGenerating) return

    setIsGenerating(true)
    setGeneratedCode('')

    try {
      const response = await fetch('/api/ai-generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          language,
          currentCode: currentCode?.slice(0, 1000)
        })
      })

      if (response.ok) {
        const result = await response.json()
        setGeneratedCode(result.code)
        setHistory(prev => [{ prompt, code: result.code }, ...prev.slice(0, 9)])
      } else {
        // Generate mock code
        const mockCode = generateMockCode(prompt, language)
        setGeneratedCode(mockCode)
        setHistory(prev => [{ prompt, code: mockCode }, ...prev.slice(0, 9)])
      }
    } catch (error) {
      const mockCode = generateMockCode(prompt, language)
      setGeneratedCode(mockCode)
      setHistory(prev => [{ prompt, code: mockCode }, ...prev.slice(0, 9)])
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault()
      generateCode()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] bg-[#1e1e1e] border-[#3c3c3c] p-0 flex flex-col">
        <DialogHeader className="p-4 border-b border-[#3c3c3c]">
          <DialogTitle className="flex items-center gap-2 text-[#cccccc]">
            <Wand2 className="h-5 w-5 text-purple-400" />
            Natural Language to Code
            <Badge variant="outline" className="ml-2 text-[10px]">
              {language}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 p-4 gap-4">
          {/* Input Section */}
          <div className="space-y-2">
            <label className="text-xs text-[#888888]">
              Describe what you want to create:
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Create a function that validates email addresses and returns true/false"
              className="bg-[#2d2d2d] border-[#3c3c3c] text-[#cccccc] text-sm resize-none min-h-[80px]"
              rows={3}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#666666]">
                Press Cmd+Enter to generate
              </span>
              <Button
                onClick={generateCode}
                disabled={!prompt.trim() || isGenerating}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Code
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Example Prompts */}
          {!generatedCode && !isGenerating && (
            <div className="space-y-2">
              <label className="text-xs text-[#888888]">
                Try these examples:
              </label>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.slice(0, 4).map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(example)}
                    className="px-3 py-1.5 text-xs bg-[#2d2d2d] hover:bg-[#3c3c3c] rounded-full border border-[#3c3c3c] text-[#cccccc] transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Generated Code */}
          {(generatedCode || isGenerating) && (
            <div className="flex-1 flex flex-col min-h-0 border border-[#3c3c3c] rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-[#2d2d2d] border-b border-[#3c3c3c]">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-[#888888]" />
                  <span className="text-xs text-[#888888]">Generated {language}</span>
                </div>
                {generatedCode && (
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={copyToClipboard}
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-green-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
              
              <ScrollArea className="flex-1 bg-[#0d0d0d]">
                {isGenerating ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                      <span className="text-sm text-[#888888]">
                        Generating code...
                      </span>
                    </div>
                  </div>
                ) : (
                  <pre className="p-4 text-sm font-mono text-[#cccccc] whitespace-pre-wrap">
                    <code>{generatedCode}</code>
                  </pre>
                )}
              </ScrollArea>

              {generatedCode && (
                <div className="flex items-center gap-2 p-2 bg-[#2d2d2d] border-t border-[#3c3c3c]">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs border-[#3c3c3c]"
                    onClick={() => onInsertCode(generatedCode)}
                  >
                    <Code className="h-3 w-3 mr-1" />
                    Insert at Cursor
                  </Button>
                  {onReplaceCode && (
                    <Button
                      size="sm"
                      className="flex-1 h-8 text-xs bg-purple-600 hover:bg-purple-700"
                      onClick={() => {
                        onReplaceCode(generatedCode)
                        onClose()
                      }}
                    >
                      <ArrowRight className="h-3 w-3 mr-1" />
                      Replace Selection
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* History */}
          {history.length > 0 && !generatedCode && !isGenerating && (
            <div className="space-y-2">
              <label className="text-xs text-[#888888]">
                Recent generations:
              </label>
              <ScrollArea className="max-h-40">
                <div className="space-y-2">
                  {history.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setPrompt(item.prompt)
                        setGeneratedCode(item.code)
                      }}
                      className="w-full text-left p-2 text-xs bg-[#2d2d2d] hover:bg-[#3c3c3c] rounded border border-[#3c3c3c] text-[#cccccc] transition-colors"
                    >
                      <span className="line-clamp-1">{item.prompt}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function generateMockCode(prompt: string, language: string): string {
  const p = prompt.toLowerCase()

  if (p.includes('fetch') || p.includes('api')) {
    return `async function fetchUserData(userId: string) {
  try {
    const response = await fetch(\`/api/users/\${userId}\`)
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching user data:', error)
    throw error
  }
}`
  }

  if (p.includes('debounce')) {
    return `function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}`
  }

  if (p.includes('hook') && p.includes('storage')) {
    return `import { useState, useEffect } from 'react'

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(error)
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(error)
    }
  }

  return [storedValue, setValue] as const
}

export default useLocalStorage`
  }

  if (p.includes('email') && p.includes('valid')) {
    return `function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/
  return emailRegex.test(email)
}

// Extended validation with more checks
function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: false, error: 'Email is required' }
  }

  if (email.length > 254) {
    return { valid: false, error: 'Email is too long' }
  }

  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' }
  }

  return { valid: true }
}`
  }

  if (p.includes('sort')) {
    return `function sortByKey<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]

    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })
}

// Usage example:
// const sorted = sortByKey(users, 'name', 'asc')`
  }

  if (p.includes('error boundary')) {
    return `import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-red-500">
          Something went wrong. Please try again.
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary`
  }

  // Default template
  return `// Generated ${language} code for: ${prompt}

function generatedFunction() {
  // TODO: Implement the requested functionality
  // Based on: "${prompt}"
  
  return null
}

export default generatedFunction`
}

export default NaturalLanguageToCode
