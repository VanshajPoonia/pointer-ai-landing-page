'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { X, GitCommit, User, Clock, ChevronRight, History, ExternalLink, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// Types
export interface BlameInfo {
  line: number
  commitHash: string
  shortHash: string
  author: string
  authorEmail: string
  date: Date
  message: string
  isOriginal?: boolean
}

export interface CommitInfo {
  hash: string
  shortHash: string
  author: string
  authorEmail: string
  date: Date
  message: string
  changes: {
    additions: number
    deletions: number
    files: string[]
  }
}

interface GitBlameProps {
  isOpen: boolean
  onClose: () => void
  fileName: string
  code: string
  blameData: BlameInfo[]
  onCommitClick?: (hash: string) => void
  onLineClick?: (line: number) => void
}

// Generate mock blame data for demo purposes
export function generateMockBlameData(code: string): BlameInfo[] {
  const lines = code.split('\n')
  const authors = [
    { name: 'Alex Chen', email: 'alex@pointer.ai' },
    { name: 'Sarah Miller', email: 'sarah@pointer.ai' },
    { name: 'James Wilson', email: 'james@pointer.ai' },
    { name: 'Emily Davis', email: 'emily@pointer.ai' },
  ]
  
  const commits = [
    { hash: 'a1b2c3d4e5f6', message: 'Initial implementation' },
    { hash: 'b2c3d4e5f6a1', message: 'Add error handling' },
    { hash: 'c3d4e5f6a1b2', message: 'Refactor for performance' },
    { hash: 'd4e5f6a1b2c3', message: 'Fix edge cases' },
    { hash: 'e5f6a1b2c3d4', message: 'Add TypeScript types' },
    { hash: 'f6a1b2c3d4e5', message: 'Code cleanup' },
  ]

  const now = new Date()
  
  return lines.map((_, index) => {
    const commit = commits[Math.floor(Math.random() * commits.length)]
    const author = authors[Math.floor(Math.random() * authors.length)]
    const daysAgo = Math.floor(Math.random() * 90) + 1
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    
    return {
      line: index + 1,
      commitHash: commit.hash,
      shortHash: commit.hash.slice(0, 7),
      author: author.name,
      authorEmail: author.email,
      date,
      message: commit.message,
    }
  })
}

// Format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

// Get color for author (consistent hashing)
function getAuthorColor(author: string): string {
  const colors = [
    'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'bg-green-500/20 text-green-400 border-green-500/30',
    'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  ]
  
  let hash = 0
  for (let i = 0; i < author.length; i++) {
    hash = ((hash << 5) - hash) + author.charCodeAt(i)
    hash = hash & hash
  }
  
  return colors[Math.abs(hash) % colors.length]
}

export function GitBlameView({
  isOpen,
  onClose,
  fileName,
  code,
  blameData,
  onCommitClick,
  onLineClick,
}: GitBlameProps) {
  const lines = useMemo(() => code.split('\n'), [code])
  const [hoveredLine, setHoveredLine] = useState<number | null>(null)
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null)
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  // Group consecutive lines by commit
  const blameGroups = useMemo(() => {
    const groups: { startLine: number; endLine: number; blame: BlameInfo }[] = []
    let currentGroup: typeof groups[0] | null = null

    blameData.forEach((blame, index) => {
      if (!currentGroup || currentGroup.blame.commitHash !== blame.commitHash) {
        if (currentGroup) groups.push(currentGroup)
        currentGroup = {
          startLine: blame.line,
          endLine: blame.line,
          blame,
        }
      } else {
        currentGroup.endLine = blame.line
      }
    })
    
    if (currentGroup) groups.push(currentGroup)
    return groups
  }, [blameData])

  const copyCommitHash = useCallback((hash: string) => {
    navigator.clipboard.writeText(hash)
    setCopiedHash(hash)
    setTimeout(() => setCopiedHash(null), 2000)
  }, [])

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e1e1e] border-[#3c3c3c] text-white max-w-[90vw] max-h-[85vh] w-[1200px]">
        <DialogHeader className="border-b border-[#3c3c3c] pb-3">
          <DialogTitle className="text-[14px] text-[#cccccc] flex items-center gap-2">
            <GitCommit className="h-4 w-4 text-orange-400" />
            Git Blame: <span className="text-blue-400">{fileName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[70vh]">
          {/* Blame annotations column */}
          <div className="w-[280px] flex-shrink-0 border-r border-[#3c3c3c] overflow-hidden">
            <div className="h-[30px] bg-[#252526] border-b border-[#3c3c3c] flex items-center px-3">
              <span className="text-[11px] text-[#808080]">Commit History</span>
            </div>
            <ScrollArea className="h-[calc(100%-30px)]">
              <div className="font-mono text-[12px]">
                {blameGroups.map((group, groupIndex) => {
                  const blame = group.blame
                  const isHovered = hoveredLine !== null && 
                    hoveredLine >= group.startLine && 
                    hoveredLine <= group.endLine
                  const isSelected = selectedCommit === blame.commitHash
                  const lineCount = group.endLine - group.startLine + 1

                  return (
                    <TooltipProvider key={groupIndex}>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'px-2 py-1 border-b border-[#2d2d2d] cursor-pointer transition-colors',
                              isHovered && 'bg-[#2a2a2a]',
                              isSelected && 'bg-blue-500/10 border-l-2 border-l-blue-500'
                            )}
                            style={{ minHeight: `${lineCount * 20}px` }}
                            onMouseEnter={() => setHoveredLine(group.startLine)}
                            onMouseLeave={() => setHoveredLine(null)}
                            onClick={() => {
                              setSelectedCommit(blame.commitHash)
                              onCommitClick?.(blame.commitHash)
                            }}
                          >
                            <div className="flex items-center gap-2 mb-0.5">
                              <span
                                className={cn(
                                  'text-[10px] px-1.5 py-0.5 rounded border',
                                  getAuthorColor(blame.author)
                                )}
                              >
                                {blame.author.split(' ')[0]}
                              </span>
                              <span className="text-[10px] text-[#808080]">
                                {formatRelativeTime(blame.date)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                className="text-[10px] text-orange-400 hover:text-orange-300 font-mono flex items-center gap-1"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  copyCommitHash(blame.commitHash)
                                }}
                              >
                                {copiedHash === blame.commitHash ? (
                                  <Check className="h-2.5 w-2.5" />
                                ) : (
                                  <Copy className="h-2.5 w-2.5" />
                                )}
                                {blame.shortHash}
                              </button>
                            </div>
                            <p className="text-[10px] text-[#969696] truncate mt-0.5">
                              {blame.message}
                            </p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="right" 
                          className="bg-[#252526] border-[#3c3c3c] text-[#cccccc] max-w-[300px]"
                        >
                          <div className="space-y-2 p-1">
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 text-[#808080]" />
                              <span className="text-[12px]">{blame.author}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-[#808080]" />
                              <span className="text-[12px]">
                                {blame.date.toLocaleDateString()} {blame.date.toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <GitCommit className="h-3.5 w-3.5 text-[#808080]" />
                              <span className="text-[12px] font-mono">{blame.commitHash}</span>
                            </div>
                            <p className="text-[12px] text-[#969696] border-t border-[#3c3c3c] pt-2">
                              {blame.message}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Code column */}
          <div className="flex-1 overflow-hidden">
            <div className="h-[30px] bg-[#252526] border-b border-[#3c3c3c] flex items-center px-3">
              <span className="text-[11px] text-[#808080]">Source Code</span>
            </div>
            <ScrollArea className="h-[calc(100%-30px)]">
              <pre className="font-mono text-[12px] leading-[20px]">
                {lines.map((line, index) => {
                  const lineNum = index + 1
                  const blame = blameData.find(b => b.line === lineNum)
                  const isHovered = hoveredLine === lineNum
                  const isSelected = blame && selectedCommit === blame.commitHash

                  return (
                    <div
                      key={index}
                      className={cn(
                        'flex hover:bg-[#2a2a2a] transition-colors',
                        isHovered && 'bg-[#2a2a2a]',
                        isSelected && 'bg-blue-500/10'
                      )}
                      onMouseEnter={() => setHoveredLine(lineNum)}
                      onMouseLeave={() => setHoveredLine(null)}
                      onClick={() => onLineClick?.(lineNum)}
                    >
                      <span className="w-[50px] text-right pr-4 text-[#6e6e6e] select-none flex-shrink-0 border-r border-[#2d2d2d]">
                        {lineNum}
                      </span>
                      <code className="pl-4 text-[#d4d4d4] whitespace-pre">
                        {line || ' '}
                      </code>
                    </div>
                  )
                })}
              </pre>
            </ScrollArea>
          </div>
        </div>

        {/* Footer with summary */}
        <div className="border-t border-[#3c3c3c] pt-3 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[11px] text-[#808080]">
            <span>{lines.length} lines</span>
            <span>{new Set(blameData.map(b => b.commitHash)).size} commits</span>
            <span>{new Set(blameData.map(b => b.author)).size} contributors</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] text-[#808080] hover:text-white"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// File History Timeline
interface FileHistoryProps {
  isOpen: boolean
  onClose: () => void
  fileName: string
  commits: CommitInfo[]
  onCommitSelect: (commit: CommitInfo) => void
}

export function FileHistory({
  isOpen,
  onClose,
  fileName,
  commits,
  onCommitSelect,
}: FileHistoryProps) {
  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#252526] border-[#3c3c3c] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[14px] text-[#cccccc] flex items-center gap-2">
            <History className="h-4 w-4 text-blue-400" />
            File History: <span className="text-blue-400">{fileName}</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          <div className="relative pl-6">
            {/* Timeline line */}
            <div className="absolute left-[11px] top-0 bottom-0 w-[2px] bg-[#3c3c3c]" />

            {commits.map((commit, index) => (
              <div key={commit.hash} className="relative mb-4">
                {/* Timeline dot */}
                <div className={cn(
                  'absolute left-0 w-[10px] h-[10px] rounded-full border-2',
                  index === 0 
                    ? 'bg-blue-500 border-blue-400' 
                    : 'bg-[#252526] border-[#808080]'
                )} style={{ top: '6px', left: '6px' }} />

                <button
                  className="w-full text-left ml-6 p-3 rounded hover:bg-[#3c3c3c] transition-colors"
                  onClick={() => onCommitSelect(commit)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono text-orange-400">
                      {commit.shortHash}
                    </span>
                    <span className="text-[11px] text-[#808080]">
                      {formatRelativeTime(commit.date)}
                    </span>
                  </div>
                  <p className="text-[13px] text-[#cccccc] mb-2">{commit.message}</p>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1 text-[#808080]">
                      <User className="h-3 w-3" />
                      {commit.author}
                    </span>
                    <span className="text-green-400">+{commit.changes.additions}</span>
                    <span className="text-red-400">-{commit.changes.deletions}</span>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// Generate mock commit history
export function generateMockCommitHistory(fileName: string): CommitInfo[] {
  const commits: CommitInfo[] = []
  const messages = [
    'Refactor component structure',
    'Add error handling',
    'Fix type definitions',
    'Improve performance',
    'Update dependencies',
    'Add new feature',
    'Code cleanup and formatting',
    'Fix edge case bug',
  ]
  const authors = ['Alex Chen', 'Sarah Miller', 'James Wilson', 'Emily Davis']
  const now = new Date()

  for (let i = 0; i < 8; i++) {
    const daysAgo = i * 7 + Math.floor(Math.random() * 7)
    commits.push({
      hash: Math.random().toString(36).substring(2, 14),
      shortHash: Math.random().toString(36).substring(2, 9),
      author: authors[Math.floor(Math.random() * authors.length)],
      authorEmail: 'author@pointer.ai',
      date: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
      message: messages[i % messages.length],
      changes: {
        additions: Math.floor(Math.random() * 50) + 1,
        deletions: Math.floor(Math.random() * 30),
        files: [fileName],
      },
    })
  }

  return commits
}
