"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  GitPullRequest, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Code,
  Shield,
  Zap,
  Bug,
  Loader2
} from 'lucide-react'

interface ReviewComment {
  id: string
  type: 'suggestion' | 'issue' | 'praise' | 'question'
  severity: 'critical' | 'warning' | 'info' | 'positive'
  category: 'security' | 'performance' | 'style' | 'logic' | 'best-practice'
  line?: number
  endLine?: number
  message: string
  suggestion?: string
  codeSnippet?: string
}

interface PRReviewResult {
  summary: string
  overallScore: number
  approved: boolean
  comments: ReviewComment[]
  stats: {
    additions: number
    deletions: number
    filesChanged: number
  }
}

interface AIPRReviewProps {
  isOpen: boolean
  onClose: () => void
  code: string
  originalCode?: string
  fileName: string
  language: string
  onApplySuggestion?: (suggestion: string) => void
}

export function AIPRReview({
  isOpen,
  onClose,
  code,
  originalCode,
  fileName,
  language,
  onApplySuggestion
}: AIPRReviewProps) {
  const [isReviewing, setIsReviewing] = useState(false)
  const [review, setReview] = useState<PRReviewResult | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [expandedComment, setExpandedComment] = useState<string | null>(null)

  const runReview = async () => {
    setIsReviewing(true)
    
    try {
      const response = await fetch('/api/ai-pr-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          originalCode,
          fileName,
          language,
          customPrompt
        })
      })

      if (response.ok) {
        const result = await response.json()
        setReview(result)
      } else {
        // Generate mock review for demo
        setReview(generateMockReview(code, originalCode))
      }
    } catch (error) {
      // Generate mock review for demo
      setReview(generateMockReview(code, originalCode))
    } finally {
      setIsReviewing(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return <Shield className="h-4 w-4" />
      case 'performance': return <Zap className="h-4 w-4" />
      case 'logic': return <Bug className="h-4 w-4" />
      default: return <Code className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/30'
      case 'warning': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
      case 'positive': return 'text-green-400 bg-green-500/10 border-green-500/30'
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'issue': return <AlertTriangle className="h-4 w-4" />
      case 'suggestion': return <Lightbulb className="h-4 w-4" />
      case 'praise': return <ThumbsUp className="h-4 w-4" />
      case 'question': return <MessageSquare className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] bg-[#1e1e1e] border-[#3c3c3c] p-0 flex flex-col">
        <DialogHeader className="p-4 border-b border-[#3c3c3c]">
          <DialogTitle className="flex items-center gap-2 text-[#cccccc]">
            <GitPullRequest className="h-5 w-5 text-purple-400" />
            AI Code Review
            <Badge variant="outline" className="ml-2 text-[10px]">
              {fileName}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 p-4">
          {!review ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <GitPullRequest className="h-16 w-16 text-[#4a4a4a]" />
              <p className="text-[#888888] text-center max-w-md">
                Get AI-powered code review with suggestions for improvements,
                security issues, and best practices.
              </p>
              
              <div className="w-full max-w-md">
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Optional: Add specific areas to focus on (e.g., 'Check for SQL injection vulnerabilities')"
                  className="bg-[#2d2d2d] border-[#3c3c3c] text-[#cccccc] text-sm resize-none"
                  rows={3}
                />
              </div>

              <Button
                onClick={runReview}
                disabled={isReviewing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isReviewing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Reviewing...
                  </>
                ) : (
                  <>
                    <GitPullRequest className="h-4 w-4 mr-2" />
                    Start Review
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 gap-4">
              {/* Summary Card */}
              <div className={`p-4 rounded-lg border ${
                review.approved 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-yellow-500/10 border-yellow-500/30'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {review.approved ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    )}
                    <span className={`font-medium ${
                      review.approved ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {review.approved ? 'Approved' : 'Changes Requested'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#888888] text-sm">Score:</span>
                    <span className={`font-bold ${
                      review.overallScore >= 80 ? 'text-green-400' :
                      review.overallScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {review.overallScore}/100
                    </span>
                  </div>
                </div>
                <p className="text-[#cccccc] text-sm">{review.summary}</p>
                <div className="flex gap-4 mt-3 text-xs text-[#888888]">
                  <span className="text-green-400">+{review.stats.additions} additions</span>
                  <span className="text-red-400">-{review.stats.deletions} deletions</span>
                  <span>{review.stats.filesChanged} file(s)</span>
                </div>
              </div>

              {/* Comments List */}
              <ScrollArea className="flex-1">
                <div className="space-y-3">
                  {review.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`p-3 rounded-lg border ${getSeverityColor(comment.severity)} cursor-pointer`}
                      onClick={() => setExpandedComment(
                        expandedComment === comment.id ? null : comment.id
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getTypeIcon(comment.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getCategoryIcon(comment.category)}
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {comment.category}
                            </Badge>
                            {comment.line && (
                              <span className="text-[10px] text-[#888888]">
                                Line {comment.line}{comment.endLine ? `-${comment.endLine}` : ''}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[#cccccc]">{comment.message}</p>
                          
                          {expandedComment === comment.id && comment.suggestion && (
                            <div className="mt-3 p-3 bg-[#1a1a1a] rounded border border-[#3c3c3c]">
                              <p className="text-xs text-[#888888] mb-2">Suggested fix:</p>
                              <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                                {comment.suggestion}
                              </pre>
                              {onApplySuggestion && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-2 h-7 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onApplySuggestion(comment.suggestion!)
                                  }}
                                >
                                  Apply Suggestion
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Actions */}
              <div className="flex justify-between pt-3 border-t border-[#3c3c3c]">
                <Button
                  variant="outline"
                  onClick={() => setReview(null)}
                  className="border-[#3c3c3c] text-[#cccccc]"
                >
                  New Review
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    Request Changes
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function generateMockReview(code: string, originalCode?: string): PRReviewResult {
  const lines = code.split('\n')
  const additions = originalCode ? Math.abs(code.length - originalCode.length) / 10 : lines.length
  
  const comments: ReviewComment[] = []
  
  // Check for common issues
  if (code.includes('console.log')) {
    comments.push({
      id: '1',
      type: 'suggestion',
      severity: 'warning',
      category: 'best-practice',
      message: 'Consider removing console.log statements before production.',
      suggestion: code.replace(/console\.log\([^)]*\);?\n?/g, '')
    })
  }
  
  if (code.includes('any')) {
    comments.push({
      id: '2',
      type: 'issue',
      severity: 'warning',
      category: 'style',
      message: 'Avoid using "any" type. Consider using a more specific type.',
    })
  }
  
  if (code.includes('eval(') || code.includes('innerHTML')) {
    comments.push({
      id: '3',
      type: 'issue',
      severity: 'critical',
      category: 'security',
      message: 'Potential security vulnerability detected. Avoid using eval() or innerHTML with user input.',
    })
  }
  
  if (!code.includes('try') && (code.includes('fetch') || code.includes('await'))) {
    comments.push({
      id: '4',
      type: 'suggestion',
      severity: 'warning',
      category: 'logic',
      message: 'Async operations should be wrapped in try-catch for proper error handling.',
    })
  }
  
  // Add some positive feedback
  if (code.includes('interface') || code.includes('type ')) {
    comments.push({
      id: '5',
      type: 'praise',
      severity: 'positive',
      category: 'style',
      message: 'Good use of TypeScript types for better code documentation and safety.',
    })
  }
  
  if (code.includes('useMemo') || code.includes('useCallback')) {
    comments.push({
      id: '6',
      type: 'praise',
      severity: 'positive',
      category: 'performance',
      message: 'Good use of memoization hooks for performance optimization.',
    })
  }

  const criticalCount = comments.filter(c => c.severity === 'critical').length
  const warningCount = comments.filter(c => c.severity === 'warning').length
  const score = Math.max(0, 100 - (criticalCount * 25) - (warningCount * 10))

  return {
    summary: criticalCount > 0 
      ? 'Critical issues found that need to be addressed before merging.'
      : warningCount > 0
      ? 'Code looks good overall but has some warnings to consider.'
      : 'Excellent code quality! Ready to merge.',
    overallScore: score,
    approved: criticalCount === 0 && warningCount <= 1,
    comments,
    stats: {
      additions: Math.round(additions),
      deletions: Math.round(additions * 0.3),
      filesChanged: 1
    }
  }
}

export default AIPRReview
