'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { X, Columns, AlignLeft, Copy, ChevronDown, ChevronUp } from 'lucide-react'

interface DiffLine {
  type: 'unchanged' | 'added' | 'removed' | 'modified'
  content: string
  oldLineNumber?: number
  newLineNumber?: number
}

interface DiffHunk {
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  lines: DiffLine[]
}

interface DiffViewerProps {
  isOpen: boolean
  onClose: () => void
  originalCode: string
  modifiedCode: string
  originalTitle?: string
  modifiedTitle?: string
  language?: string
}

// Simple diff algorithm (Myers-like)
function computeDiff(original: string, modified: string): DiffLine[] {
  const originalLines = original.split('\n')
  const modifiedLines = modified.split('\n')
  const result: DiffLine[] = []
  
  // LCS-based diff
  const lcs = computeLCS(originalLines, modifiedLines)
  
  let origIdx = 0
  let modIdx = 0
  let lcsIdx = 0
  
  while (origIdx < originalLines.length || modIdx < modifiedLines.length) {
    if (lcsIdx < lcs.length && 
        origIdx < originalLines.length && 
        modIdx < modifiedLines.length &&
        originalLines[origIdx] === lcs[lcsIdx] && 
        modifiedLines[modIdx] === lcs[lcsIdx]) {
      result.push({
        type: 'unchanged',
        content: originalLines[origIdx],
        oldLineNumber: origIdx + 1,
        newLineNumber: modIdx + 1,
      })
      origIdx++
      modIdx++
      lcsIdx++
    } else if (modIdx < modifiedLines.length && 
               (lcsIdx >= lcs.length || modifiedLines[modIdx] !== lcs[lcsIdx])) {
      result.push({
        type: 'added',
        content: modifiedLines[modIdx],
        newLineNumber: modIdx + 1,
      })
      modIdx++
    } else if (origIdx < originalLines.length) {
      result.push({
        type: 'removed',
        content: originalLines[origIdx],
        oldLineNumber: origIdx + 1,
      })
      origIdx++
    }
  }
  
  return result
}

function computeLCS(a: string[], b: string[]): string[] {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }
  
  const result: string[] = []
  let i = m, j = n
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.unshift(a[i - 1])
      i--
      j--
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }
  
  return result
}

// Compute inline character diff for modified lines
function computeCharDiff(oldStr: string, newStr: string): { old: React.ReactNode, new: React.ReactNode } {
  const oldChars = oldStr.split('')
  const newChars = newStr.split('')
  
  // Simple character-level LCS
  const lcs = computeLCS(oldChars, newChars)
  
  let oldResult: React.ReactNode[] = []
  let newResult: React.ReactNode[] = []
  
  let oi = 0, ni = 0, li = 0
  let oldBuffer = '', newBuffer = '', unchangedBuffer = ''
  
  while (oi < oldChars.length || ni < newChars.length) {
    if (li < lcs.length && oi < oldChars.length && ni < newChars.length &&
        oldChars[oi] === lcs[li] && newChars[ni] === lcs[li]) {
      if (oldBuffer) {
        oldResult.push(<span key={`old-del-${oi}`} className="bg-red-500/40">{oldBuffer}</span>)
        oldBuffer = ''
      }
      if (newBuffer) {
        newResult.push(<span key={`new-add-${ni}`} className="bg-green-500/40">{newBuffer}</span>)
        newBuffer = ''
      }
      unchangedBuffer += oldChars[oi]
      oi++
      ni++
      li++
    } else if (ni < newChars.length && (li >= lcs.length || newChars[ni] !== lcs[li])) {
      if (unchangedBuffer) {
        oldResult.push(unchangedBuffer)
        newResult.push(unchangedBuffer)
        unchangedBuffer = ''
      }
      newBuffer += newChars[ni]
      ni++
    } else if (oi < oldChars.length) {
      if (unchangedBuffer) {
        oldResult.push(unchangedBuffer)
        newResult.push(unchangedBuffer)
        unchangedBuffer = ''
      }
      oldBuffer += oldChars[oi]
      oi++
    }
  }
  
  if (oldBuffer) oldResult.push(<span key="old-del-final" className="bg-red-500/40">{oldBuffer}</span>)
  if (newBuffer) newResult.push(<span key="new-add-final" className="bg-green-500/40">{newBuffer}</span>)
  if (unchangedBuffer) {
    oldResult.push(unchangedBuffer)
    newResult.push(unchangedBuffer)
  }
  
  return { old: oldResult, new: newResult }
}

export function DiffViewer({
  isOpen,
  onClose,
  originalCode,
  modifiedCode,
  originalTitle = 'Original',
  modifiedTitle = 'Modified',
  language = 'text',
}: DiffViewerProps) {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'inline'>('side-by-side')
  const [showUnchanged, setShowUnchanged] = useState(true)
  
  const diffLines = useMemo(() => computeDiff(originalCode, modifiedCode), [originalCode, modifiedCode])
  
  const stats = useMemo(() => {
    const added = diffLines.filter(l => l.type === 'added').length
    const removed = diffLines.filter(l => l.type === 'removed').length
    return { added, removed }
  }, [diffLines])
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-[95vw] max-w-7xl h-[90vh] bg-[#1e1e1e] rounded-lg border border-[#3c3c3c] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#3c3c3c] bg-[#252526]">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-medium text-white">Diff Viewer</h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-green-400">+{stats.added} additions</span>
              <span className="text-red-400">-{stats.removed} deletions</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#3c3c3c] rounded overflow-hidden">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setViewMode('side-by-side')}
                className={`h-7 px-3 rounded-none text-xs ${
                  viewMode === 'side-by-side' 
                    ? 'bg-[#0e639c] text-white' 
                    : 'text-[#cccccc] hover:bg-[#4c4c4c]'
                }`}
              >
                <Columns className="h-3.5 w-3.5 mr-1.5" />
                Side by Side
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setViewMode('inline')}
                className={`h-7 px-3 rounded-none text-xs ${
                  viewMode === 'inline' 
                    ? 'bg-[#0e639c] text-white' 
                    : 'text-[#cccccc] hover:bg-[#4c4c4c]'
                }`}
              >
                <AlignLeft className="h-3.5 w-3.5 mr-1.5" />
                Inline
              </Button>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowUnchanged(!showUnchanged)}
              className="h-7 px-3 text-xs text-[#cccccc] hover:bg-[#3c3c3c]"
            >
              {showUnchanged ? <ChevronUp className="h-3.5 w-3.5 mr-1.5" /> : <ChevronDown className="h-3.5 w-3.5 mr-1.5" />}
              {showUnchanged ? 'Hide' : 'Show'} Unchanged
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="h-7 w-7 p-0 text-[#cccccc] hover:bg-[#3c3c3c]"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* File Headers */}
        <div className="flex border-b border-[#3c3c3c] bg-[#2d2d2d]">
          {viewMode === 'side-by-side' ? (
            <>
              <div className="flex-1 px-4 py-2 text-xs text-[#cccccc] border-r border-[#3c3c3c]">
                <span className="text-red-400 mr-2">-</span>
                {originalTitle}
              </div>
              <div className="flex-1 px-4 py-2 text-xs text-[#cccccc]">
                <span className="text-green-400 mr-2">+</span>
                {modifiedTitle}
              </div>
            </>
          ) : (
            <div className="flex-1 px-4 py-2 text-xs text-[#cccccc]">
              {originalTitle} → {modifiedTitle}
            </div>
          )}
        </div>
        
        {/* Diff Content */}
        <div className="flex-1 overflow-auto font-mono text-sm">
          {viewMode === 'side-by-side' ? (
            <SideBySideDiff diffLines={diffLines} showUnchanged={showUnchanged} />
          ) : (
            <InlineDiff diffLines={diffLines} showUnchanged={showUnchanged} />
          )}
        </div>
      </div>
    </div>
  )
}

function SideBySideDiff({ diffLines, showUnchanged }: { diffLines: DiffLine[], showUnchanged: boolean }) {
  // Group consecutive changes for side-by-side view
  const pairedLines: Array<{ left: DiffLine | null, right: DiffLine | null }> = []
  let i = 0
  
  while (i < diffLines.length) {
    const line = diffLines[i]
    
    if (line.type === 'unchanged') {
      if (showUnchanged) {
        pairedLines.push({ left: line, right: line })
      }
      i++
    } else if (line.type === 'removed') {
      // Look ahead for corresponding addition
      let nextAdd = i + 1
      while (nextAdd < diffLines.length && diffLines[nextAdd].type === 'removed') {
        nextAdd++
      }
      
      // Pair removals with additions
      let removeIdx = i
      while (removeIdx < nextAdd) {
        if (nextAdd < diffLines.length && diffLines[nextAdd].type === 'added') {
          pairedLines.push({ left: diffLines[removeIdx], right: diffLines[nextAdd] })
          nextAdd++
        } else {
          pairedLines.push({ left: diffLines[removeIdx], right: null })
        }
        removeIdx++
      }
      
      // Any remaining additions
      while (nextAdd < diffLines.length && diffLines[nextAdd].type === 'added') {
        pairedLines.push({ left: null, right: diffLines[nextAdd] })
        nextAdd++
      }
      
      i = nextAdd
    } else if (line.type === 'added') {
      pairedLines.push({ left: null, right: line })
      i++
    } else {
      i++
    }
  }
  
  return (
    <div className="flex min-w-full">
      {/* Left (Original) */}
      <div className="flex-1 border-r border-[#3c3c3c]">
        {pairedLines.map((pair, idx) => (
          <DiffLineRow 
            key={`left-${idx}`} 
            line={pair.left} 
            side="left" 
            pairedLine={pair.right}
          />
        ))}
      </div>
      
      {/* Right (Modified) */}
      <div className="flex-1">
        {pairedLines.map((pair, idx) => (
          <DiffLineRow 
            key={`right-${idx}`} 
            line={pair.right} 
            side="right"
            pairedLine={pair.left}
          />
        ))}
      </div>
    </div>
  )
}

function DiffLineRow({ 
  line, 
  side,
  pairedLine 
}: { 
  line: DiffLine | null, 
  side: 'left' | 'right',
  pairedLine?: DiffLine | null
}) {
  if (!line) {
    return (
      <div className="flex h-6 bg-[#2d2d2d]">
        <div className="w-12 px-2 text-right text-[#6e6e6e] text-xs leading-6 select-none bg-[#252526]" />
        <div className="flex-1 px-2" />
      </div>
    )
  }
  
  const bgClass = {
    unchanged: 'bg-transparent',
    added: 'bg-green-500/10',
    removed: 'bg-red-500/10',
    modified: 'bg-yellow-500/10',
  }[line.type]
  
  const gutterBgClass = {
    unchanged: 'bg-[#252526]',
    added: 'bg-green-500/20',
    removed: 'bg-red-500/20',
    modified: 'bg-yellow-500/20',
  }[line.type]
  
  const lineNumber = side === 'left' ? line.oldLineNumber : line.newLineNumber
  
  // Show character-level diff if we have a paired line of opposite type
  let content: React.ReactNode = line.content
  if (pairedLine && line.type !== 'unchanged' && pairedLine.type !== 'unchanged') {
    const charDiff = computeCharDiff(
      side === 'left' ? line.content : pairedLine.content,
      side === 'left' ? pairedLine.content : line.content
    )
    content = side === 'left' ? charDiff.old : charDiff.new
  }
  
  return (
    <div className={`flex h-6 ${bgClass}`}>
      <div className={`w-12 px-2 text-right text-[#6e6e6e] text-xs leading-6 select-none ${gutterBgClass}`}>
        {lineNumber}
      </div>
      <div className="w-6 flex items-center justify-center text-xs select-none">
        {line.type === 'removed' && <span className="text-red-400">-</span>}
        {line.type === 'added' && <span className="text-green-400">+</span>}
      </div>
      <div className="flex-1 px-2 leading-6 text-[#d4d4d4] whitespace-pre overflow-x-auto">
        {content || ' '}
      </div>
    </div>
  )
}

function InlineDiff({ diffLines, showUnchanged }: { diffLines: DiffLine[], showUnchanged: boolean }) {
  const filteredLines = showUnchanged 
    ? diffLines 
    : diffLines.filter(l => l.type !== 'unchanged')
  
  return (
    <div>
      {filteredLines.map((line, idx) => {
        const bgClass = {
          unchanged: 'bg-transparent',
          added: 'bg-green-500/10',
          removed: 'bg-red-500/10',
          modified: 'bg-yellow-500/10',
        }[line.type]
        
        const gutterBgClass = {
          unchanged: 'bg-[#252526]',
          added: 'bg-green-500/20',
          removed: 'bg-red-500/20',
          modified: 'bg-yellow-500/20',
        }[line.type]
        
        return (
          <div key={idx} className={`flex h-6 ${bgClass}`}>
            <div className={`w-12 px-2 text-right text-[#6e6e6e] text-xs leading-6 select-none ${gutterBgClass}`}>
              {line.oldLineNumber || ''}
            </div>
            <div className={`w-12 px-2 text-right text-[#6e6e6e] text-xs leading-6 select-none ${gutterBgClass}`}>
              {line.newLineNumber || ''}
            </div>
            <div className="w-6 flex items-center justify-center text-xs select-none">
              {line.type === 'removed' && <span className="text-red-400">-</span>}
              {line.type === 'added' && <span className="text-green-400">+</span>}
            </div>
            <div className="flex-1 px-2 leading-6 text-[#d4d4d4] whitespace-pre overflow-x-auto">
              {line.content || ' '}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default DiffViewer
