'use client'

import { useState } from 'react'
import { X, Code, Bug, TestTube, FileText, Zap, Loader2, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCompletion } from '@ai-sdk/react'

interface AIToolsPanelProps {
  isOpen: boolean
  onClose: () => void
  selectedCode: string
  language: string
  onApplyFix?: (code: string) => void
  onInsertTests?: (code: string) => void
}

type Tool = 'explain' | 'document' | 'complexity' | 'fix' | 'test'

export function AIToolsPanel({
  isOpen,
  onClose,
  selectedCode,
  language,
  onApplyFix,
  onInsertTests,
}: AIToolsPanelProps) {
  const [activeTool, setActiveTool] = useState<Tool>('explain')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [fixResult, setFixResult] = useState<{
    diagnosis?: string
    fixedCode?: string
    changes?: string[]
    explanation?: string
  } | null>(null)
  const [isFixing, setIsFixing] = useState(false)
  const [testFramework, setTestFramework] = useState<'jest' | 'pytest'>('jest')
  const [showDiff, setShowDiff] = useState(false)

  // For streaming responses (explain, document, complexity, test)
  const { completion, complete, isLoading } = useCompletion({
    api: activeTool === 'test' ? '/api/ai-test' : '/api/ai-explain',
    onError: (err) => {
      setError(err.message)
    },
  })

  const handleToolClick = async (tool: Tool) => {
    setActiveTool(tool)
    setError(null)
    setFixResult(null)

    if (!selectedCode.trim()) {
      setError('Please select some code first')
      return
    }

    if (tool === 'fix') {
      // Bug fixer uses non-streaming API
      setIsFixing(true)
      try {
        const response = await fetch('/api/ai-fix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: selectedCode,
            error: 'Analyze and fix any bugs or issues in this code',
            language,
          }),
        })
        const data = await response.json()
        if (data.error) {
          setError(data.error)
        } else {
          setFixResult(data)
        }
      } catch (err) {
        setError('Failed to analyze code')
      } finally {
        setIsFixing(false)
      }
    } else if (tool === 'test') {
      // Test generator
      await complete('', {
        body: {
          code: selectedCode,
          language,
          framework: testFramework,
        },
      })
    } else {
      // Explain, document, complexity
      await complete('', {
        body: {
          code: selectedCode,
          language,
          mode: tool,
        },
      })
    }
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleApplyFix = () => {
    if (fixResult?.fixedCode && onApplyFix) {
      onApplyFix(fixResult.fixedCode)
    }
  }

  const handleInsertTests = () => {
    if (completion && onInsertTests) {
      // Extract code from markdown code blocks if present
      const codeMatch = completion.match(/```[\w]*\n([\s\S]*?)```/)
      const testCode = codeMatch ? codeMatch[1] : completion
      onInsertTests(testCode)
    }
  }

  if (!isOpen) return null

  const tools = [
    { id: 'explain' as Tool, label: 'Explain', icon: Code, color: 'text-blue-400' },
    { id: 'document' as Tool, label: 'Document', icon: FileText, color: 'text-green-400' },
    { id: 'complexity' as Tool, label: 'Complexity', icon: Zap, color: 'text-yellow-400' },
    { id: 'fix' as Tool, label: 'Fix Bugs', icon: Bug, color: 'text-red-400' },
    { id: 'test' as Tool, label: 'Generate Tests', icon: TestTube, color: 'text-purple-400' },
  ]

  return (
    <div className="w-[400px] h-full bg-[#1e1e1e] border-l border-[#333333] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#333333]">
        <h2 className="text-sm font-medium text-[#e1e1e1]">AI Tools</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 text-[#808080] hover:text-[#e1e1e1] hover:bg-[#333333]"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tool Buttons */}
      <div className="flex flex-wrap gap-2 p-3 border-b border-[#333333]">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            onClick={() => handleToolClick(tool.id)}
            size="sm"
            variant="ghost"
            className={`h-8 px-3 text-xs ${
              activeTool === tool.id
                ? 'bg-[#333333] text-white'
                : 'text-[#808080] hover:text-[#e1e1e1] hover:bg-[#2d2d2d]'
            }`}
            disabled={isLoading || isFixing}
          >
            <tool.icon className={`mr-1.5 h-3.5 w-3.5 ${tool.color}`} />
            {tool.label}
          </Button>
        ))}
      </div>

      {/* Framework selector for tests */}
      {activeTool === 'test' && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#333333]">
          <span className="text-xs text-[#808080]">Framework:</span>
          <Button
            size="sm"
            variant="ghost"
            className={`h-6 px-2 text-xs ${testFramework === 'jest' ? 'bg-[#333333] text-white' : 'text-[#808080]'}`}
            onClick={() => setTestFramework('jest')}
          >
            Jest
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={`h-6 px-2 text-xs ${testFramework === 'pytest' ? 'bg-[#333333] text-white' : 'text-[#808080]'}`}
            onClick={() => setTestFramework('pytest')}
          >
            Pytest
          </Button>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-3">
        {/* Loading State */}
        {(isLoading || isFixing) && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
            <span className="ml-2 text-sm text-[#808080]">
              {activeTool === 'fix' ? 'Analyzing bugs...' : 
               activeTool === 'test' ? 'Generating tests...' :
               activeTool === 'document' ? 'Generating documentation...' :
               activeTool === 'complexity' ? 'Analyzing complexity...' :
               'Explaining code...'}
            </span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Bug Fixer Result */}
        {activeTool === 'fix' && fixResult && !isFixing && (
          <div className="space-y-4">
            {/* Diagnosis */}
            <div>
              <h3 className="text-xs font-medium text-[#e1e1e1] mb-2">Diagnosis</h3>
              <p className="text-sm text-[#b0b0b0]">{fixResult.diagnosis}</p>
            </div>

            {/* Changes */}
            {fixResult.changes && fixResult.changes.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-[#e1e1e1] mb-2">Changes Made</h3>
                <ul className="space-y-1">
                  {fixResult.changes.map((change, i) => (
                    <li key={i} className="text-sm text-[#b0b0b0] flex items-start">
                      <span className="text-green-400 mr-2">+</span>
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Diff Toggle */}
            <button
              onClick={() => setShowDiff(!showDiff)}
              className="flex items-center text-xs text-blue-400 hover:text-blue-300"
            >
              {showDiff ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
              {showDiff ? 'Hide' : 'Show'} Before/After
            </button>

            {showDiff && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <h4 className="text-xs text-red-400 mb-1">Before</h4>
                  <pre className="p-2 bg-[#2d2d2d] rounded text-xs text-[#b0b0b0] overflow-x-auto max-h-[200px] overflow-y-auto">
                    {selectedCode}
                  </pre>
                </div>
                <div>
                  <h4 className="text-xs text-green-400 mb-1">After</h4>
                  <pre className="p-2 bg-[#2d2d2d] rounded text-xs text-[#b0b0b0] overflow-x-auto max-h-[200px] overflow-y-auto">
                    {fixResult.fixedCode}
                  </pre>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleApplyFix}
                size="sm"
                className="h-8 bg-green-600 hover:bg-green-700 text-white"
              >
                Apply Fix
              </Button>
              <Button
                onClick={() => handleCopy(fixResult.fixedCode || '')}
                size="sm"
                variant="outline"
                className="h-8 border-[#404040] text-[#e1e1e1]"
              >
                {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                Copy
              </Button>
            </div>
          </div>
        )}

        {/* Streaming Response (Explain, Document, Complexity, Test) */}
        {activeTool !== 'fix' && completion && !isLoading && (
          <div className="space-y-3">
            <div className="prose prose-invert prose-sm max-w-none">
              <pre className="p-3 bg-[#2d2d2d] rounded text-xs text-[#e1e1e1] whitespace-pre-wrap overflow-x-auto">
                {completion}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {activeTool === 'test' && (
                <Button
                  onClick={handleInsertTests}
                  size="sm"
                  className="h-8 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <TestTube className="h-3.5 w-3.5 mr-1" />
                  Insert Tests
                </Button>
              )}
              {activeTool === 'document' && (
                <Button
                  onClick={() => {
                    const codeMatch = completion.match(/```[\w]*\n([\s\S]*?)```/)
                    const docCode = codeMatch ? codeMatch[1] : completion
                    if (onApplyFix) onApplyFix(docCode)
                  }}
                  size="sm"
                  className="h-8 bg-green-600 hover:bg-green-700 text-white"
                >
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  Apply Documentation
                </Button>
              )}
              <Button
                onClick={() => handleCopy(completion)}
                size="sm"
                variant="outline"
                className="h-8 border-[#404040] text-[#e1e1e1]"
              >
                {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                Copy
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isFixing && !error && !completion && !fixResult && (
          <div className="text-center py-8 text-[#808080]">
            <p className="text-sm">Select code in the editor, then click a tool above.</p>
            <p className="text-xs mt-2">
              Tip: Highlight code with your mouse or use Ctrl+A to select all.
            </p>
          </div>
        )}
      </div>

      {/* Selected Code Preview */}
      {selectedCode && (
        <div className="border-t border-[#333333] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#808080]">Selected Code</span>
            <span className="text-xs text-[#606060]">{selectedCode.split('\n').length} lines</span>
          </div>
          <pre className="p-2 bg-[#2d2d2d] rounded text-xs text-[#808080] max-h-[60px] overflow-hidden">
            {selectedCode.slice(0, 200)}{selectedCode.length > 200 ? '...' : ''}
          </pre>
        </div>
      )}
    </div>
  )
}
