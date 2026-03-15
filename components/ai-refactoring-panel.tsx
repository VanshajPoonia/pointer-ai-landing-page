'use client'

import { useState, useCallback } from 'react'
import { 
  X, Wand2, FunctionSquare, Component, Type, Zap, 
  GitBranch, Shield, Rocket, FileCode, ArrowRight,
  Loader2, Copy, Check, ChevronDown, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// Refactoring operation types
export type RefactorType = 
  | 'extract-function'
  | 'extract-component'
  | 'rename-symbol'
  | 'convert-to-async'
  | 'simplify-conditionals'
  | 'add-error-handling'
  | 'optimize-performance'
  | 'convert-to-typescript'
  | 'modernize-syntax'

interface RefactorOption {
  id: RefactorType
  name: string
  description: string
  icon: React.ReactNode
  category: 'extract' | 'transform' | 'optimize' | 'modernize'
  requiresInput?: boolean
  inputLabel?: string
  inputPlaceholder?: string
}

const REFACTOR_OPTIONS: RefactorOption[] = [
  {
    id: 'extract-function',
    name: 'Extract Function',
    description: 'Extract selected code into a new function',
    icon: <FunctionSquare className="h-4 w-4" />,
    category: 'extract',
  },
  {
    id: 'extract-component',
    name: 'Extract Component',
    description: 'Extract JSX into a new React component',
    icon: <Component className="h-4 w-4" />,
    category: 'extract',
  },
  {
    id: 'rename-symbol',
    name: 'Rename Symbol',
    description: 'Rename a variable, function, or class',
    icon: <Type className="h-4 w-4" />,
    category: 'transform',
    requiresInput: true,
    inputLabel: 'New name',
    inputPlaceholder: 'Enter new name...',
  },
  {
    id: 'convert-to-async',
    name: 'Convert to Async/Await',
    description: 'Convert Promise chains to async/await',
    icon: <Zap className="h-4 w-4" />,
    category: 'transform',
  },
  {
    id: 'simplify-conditionals',
    name: 'Simplify Conditionals',
    description: 'Simplify complex if/else logic',
    icon: <GitBranch className="h-4 w-4" />,
    category: 'transform',
  },
  {
    id: 'add-error-handling',
    name: 'Add Error Handling',
    description: 'Add try/catch and validation',
    icon: <Shield className="h-4 w-4" />,
    category: 'optimize',
  },
  {
    id: 'optimize-performance',
    name: 'Optimize Performance',
    description: 'Add memoization and optimizations',
    icon: <Rocket className="h-4 w-4" />,
    category: 'optimize',
  },
  {
    id: 'convert-to-typescript',
    name: 'Add TypeScript Types',
    description: 'Add proper TypeScript annotations',
    icon: <FileCode className="h-4 w-4" />,
    category: 'modernize',
  },
  {
    id: 'modernize-syntax',
    name: 'Modernize Syntax',
    description: 'Update to latest ES features',
    icon: <Wand2 className="h-4 w-4" />,
    category: 'modernize',
  },
]

const CATEGORIES = [
  { id: 'extract', name: 'Extract' },
  { id: 'transform', name: 'Transform' },
  { id: 'optimize', name: 'Optimize' },
  { id: 'modernize', name: 'Modernize' },
]

interface AIRefactoringPanelProps {
  isOpen: boolean
  onClose: () => void
  selectedCode: string
  language: string
  onApplyRefactoring: (refactoredCode: string) => void
}

export function AIRefactoringPanel({
  isOpen,
  onClose,
  selectedCode,
  language,
  onApplyRefactoring,
}: AIRefactoringPanelProps) {
  const [selectedRefactor, setSelectedRefactor] = useState<RefactorType | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [symbolName, setSymbolName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    refactoredCode: string
    explanation: string
    extraInfo?: Record<string, unknown>
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['extract', 'transform', 'optimize', 'modernize'])
  )

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }, [])

  const handleRefactor = useCallback(async () => {
    if (!selectedRefactor || !selectedCode) return

    const option = REFACTOR_OPTIONS.find(o => o.id === selectedRefactor)
    if (option?.requiresInput && !inputValue) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/ai-refactor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: selectedCode,
          refactorType: selectedRefactor,
          language,
          symbolName: selectedRefactor === 'rename-symbol' ? symbolName : undefined,
          newName: selectedRefactor === 'rename-symbol' ? inputValue : undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to refactor code')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      let fullText = ''
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
      }

      // Parse the streamed response - extract JSON from the text
      const jsonMatch = fullText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          setResult({
            refactoredCode: parsed.refactoredCode || parsed.newFunction || parsed.newComponent || parsed.renamedCode || '',
            explanation: parsed.explanation || '',
            extraInfo: parsed,
          })
        } catch {
          // If JSON parsing fails, treat the whole response as code
          setResult({
            refactoredCode: fullText,
            explanation: 'Refactoring complete',
          })
        }
      } else {
        setResult({
          refactoredCode: fullText,
          explanation: 'Refactoring complete',
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [selectedRefactor, selectedCode, language, inputValue, symbolName])

  const copyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }, [])

  const handleApply = useCallback(() => {
    if (result?.refactoredCode) {
      onApplyRefactoring(result.refactoredCode)
      onClose()
    }
  }, [result, onApplyRefactoring, onClose])

  const selectedOption = selectedRefactor 
    ? REFACTOR_OPTIONS.find(o => o.id === selectedRefactor)
    : null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e1e1e] border-[#3c3c3c] text-white max-w-4xl max-h-[85vh]">
        <DialogHeader className="border-b border-[#3c3c3c] pb-3">
          <DialogTitle className="text-[14px] text-[#cccccc] flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-purple-400" />
            AI Refactoring
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[60vh] gap-4">
          {/* Left panel - Refactoring options */}
          <div className="w-[280px] flex-shrink-0 border-r border-[#3c3c3c] pr-4">
            <ScrollArea className="h-full">
              {CATEGORIES.map(category => {
                const options = REFACTOR_OPTIONS.filter(o => o.category === category.id)
                const isExpanded = expandedCategories.has(category.id)

                return (
                  <div key={category.id} className="mb-3">
                    <button
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] font-medium text-[#808080] uppercase tracking-wide hover:text-white"
                      onClick={() => toggleCategory(category.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                      {category.name}
                    </button>

                    {isExpanded && (
                      <div className="space-y-1 mt-1">
                        {options.map(option => (
                          <button
                            key={option.id}
                            className={cn(
                              'w-full text-left px-3 py-2 rounded transition-colors',
                              selectedRefactor === option.id
                                ? 'bg-purple-500/20 border border-purple-500/50'
                                : 'hover:bg-[#3c3c3c] border border-transparent'
                            )}
                            onClick={() => {
                              setSelectedRefactor(option.id)
                              setResult(null)
                              setError(null)
                              setInputValue('')
                            }}
                          >
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={cn(
                                'text-[#808080]',
                                selectedRefactor === option.id && 'text-purple-400'
                              )}>
                                {option.icon}
                              </span>
                              <span className="text-[12px] text-[#cccccc]">
                                {option.name}
                              </span>
                            </div>
                            <p className="text-[10px] text-[#808080] pl-6">
                              {option.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </ScrollArea>
          </div>

          {/* Right panel - Code and results */}
          <div className="flex-1 flex flex-col min-w-0">
            {!selectedCode ? (
              <div className="flex-1 flex items-center justify-center text-[#808080] text-sm">
                Select code in the editor to refactor
              </div>
            ) : !selectedRefactor ? (
              <div className="flex-1 flex items-center justify-center text-[#808080] text-sm">
                Select a refactoring operation from the left
              </div>
            ) : (
              <>
                {/* Input section for rename */}
                {selectedOption?.requiresInput && (
                  <div className="mb-4 space-y-2">
                    {selectedRefactor === 'rename-symbol' && (
                      <div>
                        <Label className="text-[11px] text-[#808080]">Current symbol name</Label>
                        <Input
                          value={symbolName}
                          onChange={(e) => setSymbolName(e.target.value)}
                          placeholder="Enter current name..."
                          className="h-8 text-[12px] bg-[#3c3c3c] border-[#4c4c4c] mt-1"
                        />
                      </div>
                    )}
                    <div>
                      <Label className="text-[11px] text-[#808080]">
                        {selectedOption.inputLabel}
                      </Label>
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={selectedOption.inputPlaceholder}
                        className="h-8 text-[12px] bg-[#3c3c3c] border-[#4c4c4c] mt-1"
                      />
                    </div>
                  </div>
                )}

                {/* Original code */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-[#808080] font-medium">Original Code</span>
                    <span className="text-[10px] text-[#808080]">
                      {selectedCode.split('\n').length} lines
                    </span>
                  </div>
                  <ScrollArea className="h-[120px] bg-[#252526] rounded border border-[#3c3c3c]">
                    <pre className="p-3 text-[11px] font-mono text-[#d4d4d4]">
                      {selectedCode}
                    </pre>
                  </ScrollArea>
                </div>

                {/* Refactor button */}
                <Button
                  onClick={handleRefactor}
                  disabled={isLoading || (selectedOption?.requiresInput && !inputValue)}
                  className="mb-4 bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Refactoring...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Refactor Code
                    </>
                  )}
                </Button>

                {/* Error */}
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-[12px]">
                    {error}
                  </div>
                )}

                {/* Result */}
                {result && (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-[#808080] font-medium">Refactored Code</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] text-[#808080] hover:text-white"
                          onClick={() => copyCode(result.refactoredCode)}
                        >
                          {copiedCode ? (
                            <Check className="h-3 w-3 mr-1" />
                          ) : (
                            <Copy className="h-3 w-3 mr-1" />
                          )}
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          className="h-6 text-[10px] bg-green-600 hover:bg-green-700"
                          onClick={handleApply}
                        >
                          <ArrowRight className="h-3 w-3 mr-1" />
                          Apply
                        </Button>
                      </div>
                    </div>

                    <ScrollArea className="flex-1 bg-[#252526] rounded border border-[#3c3c3c]">
                      <pre className="p-3 text-[11px] font-mono text-[#d4d4d4]">
                        {result.refactoredCode}
                      </pre>
                    </ScrollArea>

                    {result.explanation && (
                      <div className="mt-3 p-2 bg-[#252526] rounded border border-[#3c3c3c]">
                        <p className="text-[11px] text-[#969696]">
                          {result.explanation}
                        </p>
                      </div>
                    )}

                    {/* Extra info like optimizations list */}
                    {result.extraInfo?.optimizations && (
                      <div className="mt-2">
                        <span className="text-[10px] text-[#808080]">Optimizations applied:</span>
                        <ul className="mt-1 space-y-0.5">
                          {(result.extraInfo.optimizations as string[]).map((opt, i) => (
                            <li key={i} className="text-[10px] text-green-400 flex items-center gap-1">
                              <Check className="h-2.5 w-2.5" />
                              {opt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Quick refactor context menu component
interface QuickRefactorMenuProps {
  position: { x: number; y: number }
  onSelect: (refactorType: RefactorType) => void
  onClose: () => void
}

export function QuickRefactorMenu({
  position,
  onSelect,
  onClose,
}: QuickRefactorMenuProps) {
  const quickOptions = [
    { id: 'extract-function' as RefactorType, name: 'Extract Function', icon: <FunctionSquare className="h-3.5 w-3.5" /> },
    { id: 'extract-component' as RefactorType, name: 'Extract Component', icon: <Component className="h-3.5 w-3.5" /> },
    { id: 'rename-symbol' as RefactorType, name: 'Rename Symbol', icon: <Type className="h-3.5 w-3.5" /> },
    { id: 'convert-to-async' as RefactorType, name: 'Convert to Async', icon: <Zap className="h-3.5 w-3.5" /> },
  ]

  return (
    <div
      className="fixed z-50 bg-[#252526] border border-[#3c3c3c] rounded-md shadow-xl py-1 min-w-[180px]"
      style={{ left: position.x, top: position.y }}
    >
      <div className="px-3 py-1.5 text-[10px] text-[#808080] font-medium uppercase tracking-wide border-b border-[#3c3c3c]">
        Quick Refactor
      </div>
      {quickOptions.map(option => (
        <button
          key={option.id}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-[#cccccc] hover:bg-[#3c3c3c] transition-colors"
          onClick={() => {
            onSelect(option.id)
            onClose()
          }}
        >
          <span className="text-[#808080]">{option.icon}</span>
          {option.name}
        </button>
      ))}
      <div className="border-t border-[#3c3c3c] mt-1 pt-1">
        <button
          className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-purple-400 hover:bg-[#3c3c3c] transition-colors"
          onClick={onClose}
        >
          <Wand2 className="h-3.5 w-3.5" />
          More Refactorings...
        </button>
      </div>
    </div>
  )
}
