'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { AlertCircle, AlertTriangle, Info, CheckCircle, Wand2, Settings, Filter, RefreshCw, FileCode, ChevronDown, ChevronRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'

export type LintSeverity = 'error' | 'warning' | 'info' | 'hint'

export interface LintIssue {
  id: string
  line: number
  column: number
  endLine?: number
  endColumn?: number
  message: string
  rule: string
  severity: LintSeverity
  source: 'eslint' | 'prettier' | 'typescript'
  fix?: {
    range: [number, number]
    text: string
  }
}

export interface LinterConfig {
  eslintEnabled: boolean
  prettierEnabled: boolean
  autoFixOnSave: boolean
  showErrors: boolean
  showWarnings: boolean
  showInfo: boolean
  showHints: boolean
}

interface LinterPanelProps {
  isOpen: boolean
  onClose: () => void
  issues: LintIssue[]
  config: LinterConfig
  onConfigChange: (config: LinterConfig) => void
  onFixIssue: (issue: LintIssue) => void
  onFixAll: () => void
  onNavigateToIssue: (issue: LintIssue) => void
  onRefresh: () => void
  isAnalyzing: boolean
  currentFile?: string
}

// Get icon for severity
function getSeverityIcon(severity: LintSeverity, className?: string) {
  switch (severity) {
    case 'error':
      return <AlertCircle className={cn("h-4 w-4 text-red-400", className)} />
    case 'warning':
      return <AlertTriangle className={cn("h-4 w-4 text-yellow-400", className)} />
    case 'info':
      return <Info className={cn("h-4 w-4 text-blue-400", className)} />
    case 'hint':
      return <Sparkles className={cn("h-4 w-4 text-purple-400", className)} />
  }
}

// Get severity color
function getSeverityColor(severity: LintSeverity) {
  switch (severity) {
    case 'error': return 'text-red-400 bg-red-400/10'
    case 'warning': return 'text-yellow-400 bg-yellow-400/10'
    case 'info': return 'text-blue-400 bg-blue-400/10'
    case 'hint': return 'text-purple-400 bg-purple-400/10'
  }
}

export function LinterPanel({
  isOpen,
  onClose,
  issues,
  config,
  onConfigChange,
  onFixIssue,
  onFixAll,
  onNavigateToIssue,
  onRefresh,
  isAnalyzing,
  currentFile
}: LinterPanelProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())
  const [showSettings, setShowSettings] = useState(false)

  // Filter issues based on config
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      if (issue.severity === 'error' && !config.showErrors) return false
      if (issue.severity === 'warning' && !config.showWarnings) return false
      if (issue.severity === 'info' && !config.showInfo) return false
      if (issue.severity === 'hint' && !config.showHints) return false
      return true
    })
  }, [issues, config])

  // Group issues by file (for now, all belong to current file)
  const issuesByFile = useMemo(() => {
    const grouped: Record<string, LintIssue[]> = {}
    filteredIssues.forEach(issue => {
      const file = currentFile || 'Unknown File'
      if (!grouped[file]) grouped[file] = []
      grouped[file].push(issue)
    })
    return grouped
  }, [filteredIssues, currentFile])

  // Count by severity
  const counts = useMemo(() => ({
    error: issues.filter(i => i.severity === 'error').length,
    warning: issues.filter(i => i.severity === 'warning').length,
    info: issues.filter(i => i.severity === 'info').length,
    hint: issues.filter(i => i.severity === 'hint').length,
    fixable: issues.filter(i => i.fix).length
  }), [issues])

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
    setExpandedFiles(new Set(Object.keys(issuesByFile)))
  }, [issuesByFile])

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e1e1e] border-[#3c3c3c] text-[#cccccc] max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-[#cccccc]">
            <AlertCircle className="h-5 w-5 text-red-400" />
            Linter & Formatter
          </DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-2 pb-2 border-b border-[#3c3c3c]">
          {/* Counts */}
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 text-red-400" />
              {counts.error}
            </span>
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
              {counts.warning}
            </span>
            <span className="flex items-center gap-1">
              <Info className="h-3.5 w-3.5 text-blue-400" />
              {counts.info}
            </span>
          </div>

          <div className="flex-1" />

          {/* Fix All */}
          {counts.fixable > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[11px] text-green-400 hover:bg-green-400/10"
              onClick={onFixAll}
            >
              <Wand2 className="h-3.5 w-3.5 mr-1" />
              Fix All ({counts.fixable})
            </Button>
          )}

          {/* Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                <Filter className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#252526] border-[#3c3c3c]">
              <DropdownMenuCheckboxItem
                checked={config.showErrors}
                onCheckedChange={(checked) => onConfigChange({ ...config, showErrors: checked })}
                className="text-[11px]"
              >
                <AlertCircle className="h-3 w-3 mr-2 text-red-400" />
                Errors
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={config.showWarnings}
                onCheckedChange={(checked) => onConfigChange({ ...config, showWarnings: checked })}
                className="text-[11px]"
              >
                <AlertTriangle className="h-3 w-3 mr-2 text-yellow-400" />
                Warnings
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={config.showInfo}
                onCheckedChange={(checked) => onConfigChange({ ...config, showInfo: checked })}
                className="text-[11px]"
              >
                <Info className="h-3 w-3 mr-2 text-blue-400" />
                Info
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={config.showHints}
                onCheckedChange={(checked) => onConfigChange({ ...config, showHints: checked })}
                className="text-[11px]"
              >
                <Sparkles className="h-3 w-3 mr-2 text-purple-400" />
                Hints
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Refresh */}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={onRefresh}
            disabled={isAnalyzing}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isAnalyzing && "animate-spin")} />
          </Button>

          {/* Settings */}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-3 bg-[#252526] rounded border border-[#3c3c3c] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] font-medium">ESLint</div>
                <div className="text-[10px] text-[#6e6e6e]">JavaScript/TypeScript linting</div>
              </div>
              <Switch
                checked={config.eslintEnabled}
                onCheckedChange={(checked) => onConfigChange({ ...config, eslintEnabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] font-medium">Prettier</div>
                <div className="text-[10px] text-[#6e6e6e]">Code formatting</div>
              </div>
              <Switch
                checked={config.prettierEnabled}
                onCheckedChange={(checked) => onConfigChange({ ...config, prettierEnabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] font-medium">Auto-fix on Save</div>
                <div className="text-[10px] text-[#6e6e6e]">Automatically fix issues when saving</div>
              </div>
              <Switch
                checked={config.autoFixOnSave}
                onCheckedChange={(checked) => onConfigChange({ ...config, autoFixOnSave: checked })}
              />
            </div>
          </div>
        )}

        {/* Issues List */}
        <div className="flex-1 overflow-y-auto">
          {Object.entries(issuesByFile).map(([file, fileIssues]) => (
            <div key={file} className="border-b border-[#2a2a2a] last:border-b-0">
              {/* File Header */}
              <div
                className="flex items-center gap-2 p-2 hover:bg-[#2a2a2a] cursor-pointer"
                onClick={() => toggleFile(file)}
              >
                {expandedFiles.has(file) ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
                <FileCode className="h-3.5 w-3.5 text-[#6e6e6e]" />
                <span className="text-[12px] flex-1 truncate">{file}</span>
                <span className="text-[10px] text-[#6e6e6e]">{fileIssues.length} issues</span>
              </div>

              {/* File Issues */}
              {expandedFiles.has(file) && (
                <div className="pl-6">
                  {fileIssues.sort((a, b) => a.line - b.line).map(issue => (
                    <div
                      key={issue.id}
                      className="group flex items-start gap-2 p-2 hover:bg-[#2a2a2a] cursor-pointer border-l-2"
                      style={{ borderLeftColor: issue.severity === 'error' ? '#ef4444' : issue.severity === 'warning' ? '#eab308' : '#3b82f6' }}
                      onClick={() => onNavigateToIssue(issue)}
                    >
                      {getSeverityIcon(issue.severity, "flex-shrink-0 mt-0.5")}
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] leading-relaxed">
                          {issue.message}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-[#6e6e6e]">
                          <span>Ln {issue.line}, Col {issue.column}</span>
                          <span className={cn(
                            "px-1 rounded",
                            getSeverityColor(issue.severity)
                          )}>
                            {issue.rule}
                          </span>
                          <span className="text-[#4e4e4e]">{issue.source}</span>
                        </div>
                      </div>

                      {issue.fix && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[10px] opacity-0 group-hover:opacity-100 text-green-400 hover:bg-green-400/10"
                          onClick={(e) => {
                            e.stopPropagation()
                            onFixIssue(issue)
                          }}
                        >
                          <Wand2 className="h-3 w-3 mr-1" />
                          Fix
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Empty State */}
          {filteredIssues.length === 0 && (
            <div className="text-center py-12 text-[#6e6e6e]">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400 opacity-50" />
              <p className="text-[12px]">No issues found</p>
              <p className="text-[11px] mt-1">Your code looks great!</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Simulate linting (in real app, would call actual linters)
export function useLinter(code: string, language: string) {
  const [issues, setIssues] = useState<LintIssue[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [config, setConfig] = useState<LinterConfig>({
    eslintEnabled: true,
    prettierEnabled: true,
    autoFixOnSave: true,
    showErrors: true,
    showWarnings: true,
    showInfo: true,
    showHints: true
  })

  // Analyze code for issues
  const analyze = useCallback(() => {
    if (!code || !['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(language)) {
      setIssues([])
      return
    }

    setIsAnalyzing(true)
    
    // Simulate async analysis
    setTimeout(() => {
      const newIssues: LintIssue[] = []
      const lines = code.split('\n')

      lines.forEach((line, index) => {
        const lineNum = index + 1
        
        // Check for console.log
        if (line.includes('console.log') && config.eslintEnabled) {
          const col = line.indexOf('console.log') + 1
          newIssues.push({
            id: `eslint-${lineNum}-console`,
            line: lineNum,
            column: col,
            message: 'Unexpected console statement.',
            rule: 'no-console',
            severity: 'warning',
            source: 'eslint',
            fix: {
              range: [0, 0], // Would be actual range
              text: ''
            }
          })
        }

        // Check for var usage
        if (/\bvar\s+/.test(line) && config.eslintEnabled) {
          const col = line.search(/\bvar\s+/) + 1
          newIssues.push({
            id: `eslint-${lineNum}-var`,
            line: lineNum,
            column: col,
            message: 'Unexpected var, use let or const instead.',
            rule: 'no-var',
            severity: 'error',
            source: 'eslint',
            fix: {
              range: [0, 0],
              text: 'let'
            }
          })
        }

        // Check for == instead of ===
        if (/[^=!]={2}[^=]/.test(line) && config.eslintEnabled) {
          const col = line.search(/[^=!]={2}[^=]/) + 2
          newIssues.push({
            id: `eslint-${lineNum}-eqeq`,
            line: lineNum,
            column: col,
            message: 'Expected \'===\' and instead saw \'==\'.',
            rule: 'eqeqeq',
            severity: 'error',
            source: 'eslint',
            fix: {
              range: [0, 0],
              text: '==='
            }
          })
        }

        // Check for trailing spaces (Prettier)
        if (line.endsWith(' ') && config.prettierEnabled) {
          newIssues.push({
            id: `prettier-${lineNum}-trailing`,
            line: lineNum,
            column: line.length,
            message: 'Delete trailing space.',
            rule: 'prettier/prettier',
            severity: 'info',
            source: 'prettier',
            fix: {
              range: [0, 0],
              text: ''
            }
          })
        }

        // Check for long lines (Prettier)
        if (line.length > 100 && config.prettierEnabled) {
          newIssues.push({
            id: `prettier-${lineNum}-maxlen`,
            line: lineNum,
            column: 101,
            message: `Line ${lineNum} exceeds the maximum line length of 100.`,
            rule: 'max-len',
            severity: 'warning',
            source: 'prettier'
          })
        }

        // Check for unused variables (simplified)
        const varMatch = line.match(/(?:const|let|var)\s+(\w+)\s*=/)
        if (varMatch && config.eslintEnabled) {
          const varName = varMatch[1]
          // Check if variable is used elsewhere (simplified)
          const restOfCode = lines.slice(index + 1).join('\n')
          if (!restOfCode.includes(varName)) {
            newIssues.push({
              id: `eslint-${lineNum}-unused`,
              line: lineNum,
              column: line.indexOf(varName) + 1,
              message: `'${varName}' is assigned a value but never used.`,
              rule: 'no-unused-vars',
              severity: 'warning',
              source: 'eslint'
            })
          }
        }

        // Check for any type (TypeScript)
        if (line.includes(': any') && language.includes('typescript')) {
          const col = line.indexOf(': any') + 1
          newIssues.push({
            id: `ts-${lineNum}-any`,
            line: lineNum,
            column: col,
            message: 'Unexpected any. Specify a different type.',
            rule: '@typescript-eslint/no-explicit-any',
            severity: 'warning',
            source: 'typescript'
          })
        }
      })

      setIssues(newIssues)
      setIsAnalyzing(false)
    }, 300)
  }, [code, language, config.eslintEnabled, config.prettierEnabled])

  // Auto-analyze when code changes
  useEffect(() => {
    const timer = setTimeout(analyze, 500)
    return () => clearTimeout(timer)
  }, [analyze])

  // Fix single issue
  const fixIssue = useCallback((issue: LintIssue) => {
    // In real implementation, would apply the fix to the code
    setIssues(prev => prev.filter(i => i.id !== issue.id))
  }, [])

  // Fix all issues
  const fixAll = useCallback(() => {
    // In real implementation, would apply all fixes
    setIssues(prev => prev.filter(i => !i.fix))
  }, [])

  return {
    issues,
    isAnalyzing,
    config,
    setConfig,
    analyze,
    fixIssue,
    fixAll
  }
}
