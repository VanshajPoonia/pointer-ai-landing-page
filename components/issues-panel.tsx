'use client'

import { AlertCircle, AlertTriangle, Info, Lightbulb, X } from 'lucide-react'
import { Button } from './ui/button'
import { CodeIssue } from './code-editor'

interface IssuesPanelProps {
  issues: CodeIssue[]
  isOpen: boolean
  onClose: () => void
  onGoToLine: (line: number) => void
}

export function IssuesPanel({ issues, isOpen, onClose, onGoToLine }: IssuesPanelProps) {
  if (!isOpen) return null

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      case 'hint':
        return <Lightbulb className="h-4 w-4 text-green-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />
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

  const errorCount = issues.filter(i => i.severity === 'error').length
  const warningCount = issues.filter(i => i.severity === 'warning').length

  return (
    <div className="absolute bottom-[280px] left-0 right-0 h-[200px] bg-[#1e1e1e] border-t border-[#191919] z-20 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between h-[35px] px-4 bg-[#252526] border-b border-[#191919]">
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-semibold text-white uppercase tracking-wide">Problems</span>
          <div className="flex items-center gap-3 text-[11px]">
            {errorCount > 0 && (
              <span className="flex items-center gap-1 text-red-500">
                <AlertCircle className="h-3 w-3" />
                {errorCount} Error{errorCount > 1 ? 's' : ''}
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-1 text-yellow-500">
                <AlertTriangle className="h-3 w-3" />
                {warningCount} Warning{warningCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 text-[#858585] hover:text-[#cccccc] hover:bg-[#3e3e42]"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto">
        {issues.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#808080] text-sm">
            No problems detected
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {issues.map((issue, index) => (
              <button
                key={index}
                onClick={() => onGoToLine(issue.line)}
                className={`w-full text-left p-2 rounded border-l-2 hover:bg-[#2d2d2d] transition-colors ${getSeverityBg(issue.severity)}`}
              >
                <div className="flex items-start gap-2">
                  {getSeverityIcon(issue.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="text-[#cccccc] text-sm">{issue.message}</div>
                    {issue.suggestion && (
                      <div className="text-[#808080] text-xs mt-1">
                        Suggestion: {issue.suggestion}
                      </div>
                    )}
                    <div className="text-[#606060] text-xs mt-1">
                      Line {issue.line}, Column {issue.column}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
