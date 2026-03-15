'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { AlertCircle, AlertTriangle, Info, CheckCircle, Wand2, FileCode, ChevronDown, ChevronRight, RefreshCw, Lightbulb, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export type TypeErrorSeverity = 'error' | 'warning' | 'suggestion'

export interface TypeErrorQuickFix {
  description: string
  changes: {
    line: number
    column: number
    oldText: string
    newText: string
  }[]
}

export interface TypeScriptError {
  id: string
  code: number
  message: string
  severity: TypeErrorSeverity
  file: string
  line: number
  column: number
  endLine?: number
  endColumn?: number
  relatedInformation?: {
    message: string
    file: string
    line: number
    column: number
  }[]
  quickFixes?: TypeErrorQuickFix[]
}

interface TypeCheckerPanelProps {
  isOpen: boolean
  onClose: () => void
  errors: TypeScriptError[]
  currentFile?: string
  onNavigateToError: (error: TypeScriptError) => void
  onApplyFix?: (error: TypeScriptError) => void
  onApplyQuickFix?: (error: TypeScriptError, fix: TypeErrorQuickFix) => void
  onRefresh?: () => void
  isChecking: boolean
  config?: TypeCheckerConfig
  onConfigChange?: (config: TypeCheckerConfig) => void
}

// Get icon for severity
function getSeverityIcon(severity: TypeErrorSeverity, className?: string) {
  switch (severity) {
    case 'error':
      return <AlertCircle className={cn("h-4 w-4 text-red-400", className)} />
    case 'warning':
      return <AlertTriangle className={cn("h-4 w-4 text-yellow-400", className)} />
    case 'suggestion':
      return <Lightbulb className={cn("h-4 w-4 text-blue-400", className)} />
  }
}

// Error code categories
const ERROR_CATEGORIES: Record<string, { range: [number, number]; label: string }> = {
  'Syntax': { range: [1000, 1999], label: 'Syntax Errors' },
  'Semantic': { range: [2000, 2999], label: 'Semantic Errors' },
  'Declaration': { range: [4000, 4999], label: 'Declaration Errors' },
  'Module': { range: [5000, 5999], label: 'Module Errors' },
  'JSX': { range: [17000, 17999], label: 'JSX Errors' }
}

function getErrorCategory(code: number): string {
  for (const [category, { range }] of Object.entries(ERROR_CATEGORIES)) {
    if (code >= range[0] && code <= range[1]) {
      return category
    }
  }
  return 'Other'
}

export function TypeCheckerPanel({
  isOpen,
  onClose,
  errors,
  currentFile,
  onNavigateToError,
  onApplyFix,
  onApplyQuickFix,
  onRefresh,
  isChecking,
  config,
  onConfigChange
}: TypeCheckerPanelProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())
  const [filterSeverity, setFilterSeverity] = useState<TypeErrorSeverity | 'all'>('all')
  const [showCurrentFileOnly, setShowCurrentFileOnly] = useState(false)
  const [selectedError, setSelectedError] = useState<TypeScriptError | null>(null)

  // Filter errors
  const filteredErrors = useMemo(() => {
    let result = errors
    
    if (filterSeverity !== 'all') {
      result = result.filter(e => e.severity === filterSeverity)
    }
    
    if (showCurrentFileOnly && currentFile) {
      result = result.filter(e => e.file === currentFile)
    }
    
    return result
  }, [errors, filterSeverity, showCurrentFileOnly, currentFile])

  // Group errors by file
  const errorsByFile = useMemo(() => {
    const grouped: Record<string, TypeScriptError[]> = {}
    filteredErrors.forEach(error => {
      if (!grouped[error.file]) grouped[error.file] = []
      grouped[error.file].push(error)
    })
    // Sort by line within each file
    Object.values(grouped).forEach(errs => errs.sort((a, b) => a.line - b.line))
    return grouped
  }, [filteredErrors])

  // Count by severity
  const counts = useMemo(() => ({
    error: errors.filter(e => e.severity === 'error').length,
    warning: errors.filter(e => e.severity === 'warning').length,
    suggestion: errors.filter(e => e.severity === 'suggestion').length
  }), [errors])

  // Toggle file expansion
  const toggleFile = (file: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev)
      if (next.has(file)) {
        next.delete(file)
      } else {
        next.add(file)
      }
      return next
    })
  }

  // Expand all files by default
  useEffect(() => {
    setExpandedFiles(new Set(Object.keys(errorsByFile)))
  }, [errorsByFile])

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e1e1e] border-[#3c3c3c] text-[#cccccc] max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-[#cccccc]">
            <AlertCircle className="h-5 w-5 text-red-400" />
            TypeScript Type Checker
          </DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-2 pb-2 border-b border-[#3c3c3c]">
          {/* Counts */}
          <div className="flex items-center gap-3 text-[11px]">
            <button
              className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded",
                filterSeverity === 'error' && "bg-red-400/20"
              )}
              onClick={() => setFilterSeverity(filterSeverity === 'error' ? 'all' : 'error')}
            >
              <AlertCircle className="h-3.5 w-3.5 text-red-400" />
              {counts.error}
            </button>
            <button
              className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded",
                filterSeverity === 'warning' && "bg-yellow-400/20"
              )}
              onClick={() => setFilterSeverity(filterSeverity === 'warning' ? 'all' : 'warning')}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
              {counts.warning}
            </button>
            <button
              className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded",
                filterSeverity === 'suggestion' && "bg-blue-400/20"
              )}
              onClick={() => setFilterSeverity(filterSeverity === 'suggestion' ? 'all' : 'suggestion')}
            >
              <Lightbulb className="h-3.5 w-3.5 text-blue-400" />
              {counts.suggestion}
            </button>
          </div>

          <div className="flex-1" />

          {/* Current file only */}
          {currentFile && (
            <Button
              size="sm"
              variant={showCurrentFileOnly ? "default" : "ghost"}
              className="h-7 text-[11px]"
              onClick={() => setShowCurrentFileOnly(!showCurrentFileOnly)}
            >
              Current File Only
            </Button>
          )}

          {/* Refresh */}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={onRefresh}
            disabled={isChecking}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isChecking && "animate-spin")} />
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex gap-4">
          {/* Errors List */}
          <div className="flex-1 overflow-y-auto">
            {Object.entries(errorsByFile).map(([file, fileErrors]) => {
              const isExpanded = expandedFiles.has(file)
              const fileName = file.split('/').pop() || file
              const errorCount = fileErrors.filter(e => e.severity === 'error').length
              const warningCount = fileErrors.filter(e => e.severity === 'warning').length
              
              return (
                <div key={file} className="border-b border-[#2a2a2a] last:border-b-0">
                  {/* File Header */}
                  <div
                    className={cn(
                      "flex items-center gap-2 p-2 hover:bg-[#2a2a2a] cursor-pointer",
                      currentFile === file && "bg-blue-500/10"
                    )}
                    onClick={() => toggleFile(file)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                    <FileCode className="h-3.5 w-3.5 text-[#6e6e6e]" />
                    <span className="text-[12px] flex-1 truncate">{fileName}</span>
                    <div className="flex items-center gap-1 text-[10px]">
                      {errorCount > 0 && (
                        <span className="text-red-400">{errorCount}E</span>
                      )}
                      {warningCount > 0 && (
                        <span className="text-yellow-400">{warningCount}W</span>
                      )}
                    </div>
                  </div>

                  {/* File Errors */}
                  {isExpanded && (
                    <div className="pl-4">
                      {fileErrors.map(error => (
                        <div
                          key={error.id}
                          className={cn(
                            "group flex items-start gap-2 p-2 hover:bg-[#2a2a2a] cursor-pointer border-l-2",
                            error.severity === 'error' && "border-l-red-400",
                            error.severity === 'warning' && "border-l-yellow-400",
                            error.severity === 'suggestion' && "border-l-blue-400",
                            selectedError?.id === error.id && "bg-[#2a2a2a]"
                          )}
                          onClick={() => {
                            setSelectedError(error)
                            onNavigateToError(error)
                          }}
                        >
                          {getSeverityIcon(error.severity, "flex-shrink-0 mt-0.5")}
                          
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] leading-relaxed">
                              {error.message}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-[#6e6e6e]">
                              <span>Ln {error.line}, Col {error.column}</span>
                              <span className="px-1 rounded bg-[#3c3c3c] text-[#9e9e9e]">
                                TS{error.code}
                              </span>
                            </div>
                          </div>

                          {/* Quick fix button */}
                          {error.quickFixes && error.quickFixes.length > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 opacity-0 group-hover:opacity-100 text-green-400 hover:bg-green-400/10"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onApplyQuickFix(error, error.quickFixes![0])
                                    }}
                                  >
                                    <Wand2 className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-[11px]">{error.quickFixes[0].description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Empty State */}
            {filteredErrors.length === 0 && (
              <div className="text-center py-12 text-[#6e6e6e]">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400 opacity-50" />
                <p className="text-[12px]">No type errors found</p>
                <p className="text-[11px] mt-1">Your code is type-safe!</p>
              </div>
            )}
          </div>

          {/* Error Details Panel */}
          {selectedError && (
            <div className="w-72 border-l border-[#3c3c3c] pl-4 overflow-y-auto">
              <div className="text-[11px] font-medium mb-2">Error Details</div>
              
              {/* Error Info */}
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] text-[#6e6e6e]">Code</div>
                  <div className="text-[11px] font-mono">TS{selectedError.code}</div>
                </div>
                
                <div>
                  <div className="text-[10px] text-[#6e6e6e]">Category</div>
                  <div className="text-[11px]">{getErrorCategory(selectedError.code)}</div>
                </div>
                
                <div>
                  <div className="text-[10px] text-[#6e6e6e]">Message</div>
                  <div className="text-[11px] leading-relaxed">{selectedError.message}</div>
                </div>
                
                <div>
                  <div className="text-[10px] text-[#6e6e6e]">Location</div>
                  <div className="text-[11px] font-mono">
                    {selectedError.file.split('/').pop()}:{selectedError.line}:{selectedError.column}
                  </div>
                </div>

                {/* Related Information */}
                {selectedError.relatedInformation && selectedError.relatedInformation.length > 0 && (
                  <div>
                    <div className="text-[10px] text-[#6e6e6e] mb-1">Related</div>
                    {selectedError.relatedInformation.map((info, i) => (
                      <div key={i} className="text-[10px] p-1.5 bg-[#252526] rounded mb-1">
                        <div className="text-[#9e9e9e]">{info.message}</div>
                        <div className="text-[#6e6e6e] font-mono mt-0.5">
                          {info.file.split('/').pop()}:{info.line}:{info.column}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Fixes */}
                {selectedError.quickFixes && selectedError.quickFixes.length > 0 && (
                  <div>
                    <div className="text-[10px] text-[#6e6e6e] mb-1">Quick Fixes</div>
                    {selectedError.quickFixes.map((fix, i) => (
                      <Button
                        key={i}
                        size="sm"
                        variant="ghost"
                        className="w-full h-auto py-1.5 px-2 text-left text-[10px] justify-start bg-green-400/10 hover:bg-green-400/20 text-green-400 mb-1"
                        onClick={() => onApplyQuickFix(selectedError, fix)}
                      >
                        <Wand2 className="h-3 w-3 mr-1.5 flex-shrink-0" />
                        <span className="truncate">{fix.description}</span>
                      </Button>
                    ))}
                  </div>
                )}

                {/* Copy Error */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full h-7 text-[10px]"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `TS${selectedError.code}: ${selectedError.message}\n` +
                      `at ${selectedError.file}:${selectedError.line}:${selectedError.column}`
                    )
                  }}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Error
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook to simulate TypeScript checking
export interface TypeCheckerConfig {
  strict: boolean
  noImplicitAny: boolean
  strictNullChecks: boolean
  noUnusedLocals: boolean
  noUnusedParameters: boolean
}

export function useTypeChecker(code: string, language: string) {
  const [errors, setErrors] = useState<TypeScriptError[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [config, setConfig] = useState<TypeCheckerConfig>({
    strict: true,
    noImplicitAny: true,
    strictNullChecks: true,
    noUnusedLocals: true,
    noUnusedParameters: true
  })

  const checkTypes = useCallback(() => {
    if (!code || !language.includes('typescript')) {
      setErrors([])
      return
    }

    setIsChecking(true)

    // Simulate async type checking
    setTimeout(() => {
      const newErrors: TypeScriptError[] = []
      const lines = code.split('\n')

      lines.forEach((line, index) => {
        const lineNum = index + 1
        const trimmed = line.trim()

        // Check for any type
        if (trimmed.includes(': any')) {
          const col = line.indexOf(': any') + 1
          newErrors.push({
            id: `ts-${lineNum}-any`,
            code: 7006,
            message: "Parameter implicitly has an 'any' type.",
            severity: 'error',
            file: 'current-file.tsx',
            line: lineNum,
            column: col,
            quickFixes: [{
              description: 'Add explicit type annotation',
              changes: [{ line: lineNum, column: col, oldText: ': any', newText: ': unknown' }]
            }]
          })
        }

        // Check for unused variables
        const varMatch = line.match(/(?:const|let|var)\s+(\w+)\s*[=:]/)
        if (varMatch) {
          const varName = varMatch[1]
          const restOfCode = lines.slice(index + 1).join('\n')
          if (!restOfCode.includes(varName) && !trimmed.includes('export')) {
            newErrors.push({
              id: `ts-${lineNum}-unused`,
              code: 6133,
              message: `'${varName}' is declared but its value is never read.`,
              severity: 'warning',
              file: 'current-file.tsx',
              line: lineNum,
              column: line.indexOf(varName) + 1,
              quickFixes: [{
                description: `Remove unused variable '${varName}'`,
                changes: [{ line: lineNum, column: 1, oldText: line, newText: '' }]
              }, {
                description: `Prefix with underscore to indicate intentionally unused`,
                changes: [{ line: lineNum, column: line.indexOf(varName) + 1, oldText: varName, newText: `_${varName}` }]
              }]
            })
          }
        }

        // Check for missing return type
        const funcMatch = line.match(/(?:function\s+\w+|(?:const|let)\s+\w+\s*=\s*(?:async\s*)?\([^)]*\))\s*(?!:)/)
        if (funcMatch && !trimmed.includes(': ') && trimmed.includes('{')) {
          newErrors.push({
            id: `ts-${lineNum}-returntype`,
            code: 7010,
            message: "Function lacks ending return type annotation.",
            severity: 'suggestion',
            file: 'current-file.tsx',
            line: lineNum,
            column: line.indexOf('{'),
            quickFixes: [{
              description: 'Infer return type from usage',
              changes: [{ line: lineNum, column: line.indexOf('{'), oldText: '{', newText: ': void {' }]
            }]
          })
        }

        // Check for ! assertion
        if (trimmed.includes('!.') || trimmed.includes('!,') || trimmed.includes('!)')) {
          const col = line.indexOf('!')
          newErrors.push({
            id: `ts-${lineNum}-assertion`,
            code: 2345,
            message: "Non-null assertion operator used. Consider adding proper null check.",
            severity: 'warning',
            file: 'current-file.tsx',
            line: lineNum,
            column: col + 1
          })
        }

        // Check for @ts-ignore
        if (trimmed.includes('@ts-ignore') || trimmed.includes('@ts-nocheck')) {
          newErrors.push({
            id: `ts-${lineNum}-ignore`,
            code: 7009,
            message: "TypeScript ignore comment detected. Consider fixing the underlying issue.",
            severity: 'warning',
            file: 'current-file.tsx',
            line: lineNum,
            column: line.indexOf('@ts-') + 1
          })
        }
      })

      setErrors(newErrors)
      setIsChecking(false)
    }, 400)
  }, [code, language])

  // Auto-check when code changes
  useEffect(() => {
    const timer = setTimeout(checkTypes, 600)
    return () => clearTimeout(timer)
  }, [checkTypes])

  const applyQuickFix = useCallback((error: TypeScriptError, fix: TypeErrorQuickFix) => {
    // Would apply the fix to the code
    setErrors(prev => prev.filter(e => e.id !== error.id))
  }, [])

return {
  errors,
  isChecking,
  config,
  updateConfig: setConfig,
  checkTypes,
  applyQuickFix
  }
}
