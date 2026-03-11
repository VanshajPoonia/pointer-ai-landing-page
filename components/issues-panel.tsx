'use client'

import { useState } from 'react'
import { AlertCircle, AlertTriangle, Info, Lightbulb, X, EyeOff, Filter, ChevronDown } from 'lucide-react'
import { Button } from './ui/button'
import { CodeIssue } from './code-editor'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from './ui/dropdown-menu'

interface IssuesPanelProps {
  issues: CodeIssue[]
  isOpen: boolean
  onClose: () => void
  onGoToLine: (line: number) => void
  onIgnoreIssue: (issueId: string) => void
  ignoredIssues: Set<string>
}

export function IssuesPanel({ issues, isOpen, onClose, onGoToLine, onIgnoreIssue, ignoredIssues }: IssuesPanelProps) {
  const [showErrors, setShowErrors] = useState(true)
  const [showWarnings, setShowWarnings] = useState(true)
  const [showInfo, setShowInfo] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'errors' | 'warnings'>('all')

  if (!isOpen) return null

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />
      case 'hint':
        return <Lightbulb className="h-4 w-4 text-green-500 flex-shrink-0" />
      default:
        return <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
    }
  }

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'border-l-red-500 bg-red-500/5'
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-500/5'
      case 'info':
        return 'border-l-blue-500 bg-blue-500/5'
      case 'hint':
        return 'border-l-green-500 bg-green-500/5'
      default:
        return 'border-l-red-500 bg-red-500/5'
    }
  }

  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case 'comment-mismatch':
        return 'Comment Mismatch'
      case 'typo':
        return 'Typo'
      case 'syntax':
        return 'Syntax'
      case 'logic':
        return 'Logic'
      case 'undefined':
        return 'Undefined'
      default:
        return null
    }
  }

  // Filter out ignored issues
  const visibleIssues = issues.filter(issue => {
    if (issue.id && ignoredIssues.has(issue.id)) return false
    if (activeTab === 'errors' && issue.severity !== 'error') return false
    if (activeTab === 'warnings' && issue.severity !== 'warning') return false
    if (!showErrors && issue.severity === 'error') return false
    if (!showWarnings && issue.severity === 'warning') return false
    if (!showInfo && (issue.severity === 'info' || issue.severity === 'hint')) return false
    return true
  })

  const errorCount = issues.filter(i => i.severity === 'error' && !(i.id && ignoredIssues.has(i.id))).length
  const warningCount = issues.filter(i => i.severity === 'warning' && !(i.id && ignoredIssues.has(i.id))).length
  const infoCount = issues.filter(i => (i.severity === 'info' || i.severity === 'hint') && !(i.id && ignoredIssues.has(i.id))).length

  return (
    <div className="absolute bottom-[280px] left-0 right-0 h-[200px] bg-[#1e1e1e] border-t border-[#191919] z-20 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between h-[35px] px-4 bg-[#252526] border-b border-[#191919]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-white uppercase tracking-wide">Problems</span>
          
          {/* Tabs */}
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                activeTab === 'all' 
                  ? 'bg-[#3c3c3c] text-white' 
                  : 'text-[#808080] hover:text-[#cccccc]'
              }`}
            >
              All ({errorCount + warningCount + infoCount})
            </button>
            <button
              onClick={() => setActiveTab('errors')}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors flex items-center gap-1 ${
                activeTab === 'errors' 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'text-[#808080] hover:text-[#cccccc]'
              }`}
            >
              <AlertCircle className="h-3 w-3" />
              {errorCount}
            </button>
            <button
              onClick={() => setActiveTab('warnings')}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors flex items-center gap-1 ${
                activeTab === 'warnings' 
                  ? 'bg-yellow-500/20 text-yellow-400' 
                  : 'text-[#808080] hover:text-[#cccccc]'
              }`}
            >
              <AlertTriangle className="h-3 w-3" />
              {warningCount}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[#858585] hover:text-[#cccccc] hover:bg-[#3e3e42]"
              >
                <Filter className="h-3 w-3 mr-1" />
                <span className="text-[10px]">Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#252526] border-[#3c3c3c]">
              <DropdownMenuCheckboxItem
                checked={showErrors}
                onCheckedChange={setShowErrors}
                className="text-[#cccccc] text-xs"
              >
                <AlertCircle className="h-3 w-3 text-red-500 mr-2" />
                Show Errors
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showWarnings}
                onCheckedChange={setShowWarnings}
                className="text-[#cccccc] text-xs"
              >
                <AlertTriangle className="h-3 w-3 text-yellow-500 mr-2" />
                Show Warnings
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showInfo}
                onCheckedChange={setShowInfo}
                className="text-[#cccccc] text-xs"
              >
                <Info className="h-3 w-3 text-blue-500 mr-2" />
                Show Info
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

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

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto">
        {visibleIssues.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#808080] text-sm">
            {issues.length === 0 ? 'No problems detected' : 'All problems filtered or ignored'}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {visibleIssues.map((issue, index) => (
              <div
                key={issue.id || index}
                className={`group w-full text-left p-2 rounded border-l-2 hover:bg-[#2d2d2d] transition-colors ${getSeverityBg(issue.severity)}`}
              >
                <div className="flex items-start gap-2">
                  {getSeverityIcon(issue.severity)}
                  <button 
                    onClick={() => onGoToLine(issue.line)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#cccccc] text-sm">{issue.message}</span>
                      {getCategoryLabel(issue.category) && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                          issue.category === 'comment-mismatch' 
                            ? 'bg-purple-500/20 text-purple-400' 
                            : 'bg-[#3c3c3c] text-[#808080]'
                        }`}>
                          {getCategoryLabel(issue.category)}
                        </span>
                      )}
                    </div>
                    {issue.suggestion && (
                      <div className="text-[#808080] text-xs mt-1">
                        Suggestion: {issue.suggestion}
                      </div>
                    )}
                    <div className="text-[#606060] text-xs mt-1">
                      Line {issue.line}, Column {issue.column}
                    </div>
                  </button>
                  {/* Ignore button */}
                  {issue.id && issue.severity === 'warning' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onIgnoreIssue(issue.id!)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#3c3c3c] rounded transition-all"
                      title="Ignore this warning"
                    >
                      <EyeOff className="h-3 w-3 text-[#808080]" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with ignored count */}
      {ignoredIssues.size > 0 && (
        <div className="h-[24px] px-4 bg-[#252526] border-t border-[#191919] flex items-center">
          <span className="text-[10px] text-[#808080]">
            {ignoredIssues.size} warning{ignoredIssues.size > 1 ? 's' : ''} ignored
          </span>
        </div>
      )}
    </div>
  )
}
