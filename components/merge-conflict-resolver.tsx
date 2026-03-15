"use client"

import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  GitMerge, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Combine,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConflictRegion {
  id: string
  startLine: number
  endLine: number
  ours: string[]
  theirs: string[]
  base?: string[]
  resolution: 'ours' | 'theirs' | 'both' | 'custom' | null
  customResolution?: string[]
}

interface MergeConflictResolverProps {
  isOpen: boolean
  onClose: () => void
  fileName: string
  ourBranch: string
  theirBranch: string
  conflicts: ConflictRegion[]
  onResolve: (resolvedCode: string) => void
}

// Parse conflict markers from code
export function parseConflicts(code: string): ConflictRegion[] {
  const lines = code.split('\n')
  const conflicts: ConflictRegion[] = []
  let i = 0
  let conflictId = 0

  while (i < lines.length) {
    if (lines[i].startsWith('<<<<<<<')) {
      const startLine = i + 1
      const ours: string[] = []
      const theirs: string[] = []
      let base: string[] | undefined
      
      i++
      // Collect "ours" section
      while (i < lines.length && !lines[i].startsWith('|||||||') && !lines[i].startsWith('=======')) {
        ours.push(lines[i])
        i++
      }
      
      // Check for base section (3-way merge)
      if (lines[i]?.startsWith('|||||||')) {
        base = []
        i++
        while (i < lines.length && !lines[i].startsWith('=======')) {
          base.push(lines[i])
          i++
        }
      }
      
      // Skip separator
      if (lines[i]?.startsWith('=======')) {
        i++
      }
      
      // Collect "theirs" section
      while (i < lines.length && !lines[i].startsWith('>>>>>>>')) {
        theirs.push(lines[i])
        i++
      }
      
      const endLine = i + 1
      
      conflicts.push({
        id: `conflict-${conflictId++}`,
        startLine,
        endLine,
        ours,
        theirs,
        base,
        resolution: null
      })
    }
    i++
  }

  return conflicts
}

// Generate sample conflict for demo
export function generateSampleConflict(): { code: string; conflicts: ConflictRegion[] } {
  const code = `import React from 'react'

function App() {
<<<<<<< HEAD
  const [count, setCount] = useState(0)
  const [name, setName] = useState('User')
=======
  const [counter, setCounter] = useState(0)
  const [userName, setUserName] = useState('')
>>>>>>> feature/update-state

  return (
    <div>
<<<<<<< HEAD
      <h1>Hello, {name}!</h1>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
=======
      <h1>Welcome!</h1>
      <p>Counter: {counter}</p>
      <button onClick={() => setCounter(c => c + 1)}>
        Increment
      </button>
>>>>>>> feature/update-state
    </div>
  )
}

export default App`

  return { code, conflicts: parseConflicts(code) }
}

export function MergeConflictResolver({
  isOpen,
  onClose,
  fileName,
  ourBranch,
  theirBranch,
  conflicts: initialConflicts,
  onResolve
}: MergeConflictResolverProps) {
  const [conflicts, setConflicts] = useState<ConflictRegion[]>(initialConflicts)
  const [currentConflict, setCurrentConflict] = useState(0)
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split')

  const resolvedCount = conflicts.filter(c => c.resolution !== null).length
  const allResolved = resolvedCount === conflicts.length

  const handleResolve = (conflictId: string, resolution: 'ours' | 'theirs' | 'both') => {
    setConflicts(prev => prev.map(c => 
      c.id === conflictId ? { ...c, resolution } : c
    ))
  }

  const handleCustomResolve = (conflictId: string, customLines: string[]) => {
    setConflicts(prev => prev.map(c => 
      c.id === conflictId ? { ...c, resolution: 'custom', customResolution: customLines } : c
    ))
  }

  const getResolvedLines = (conflict: ConflictRegion): string[] => {
    switch (conflict.resolution) {
      case 'ours':
        return conflict.ours
      case 'theirs':
        return conflict.theirs
      case 'both':
        return [...conflict.ours, ...conflict.theirs]
      case 'custom':
        return conflict.customResolution || []
      default:
        return []
    }
  }

  const handleApplyAll = () => {
    // This would reconstruct the file with resolved conflicts
    // For now, just signal completion
    const resolvedCode = conflicts.map(c => getResolvedLines(c).join('\n')).join('\n\n')
    onResolve(resolvedCode)
    onClose()
  }

  const conflict = conflicts[currentConflict]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[85vh] bg-[#1e1e1e] border-[#3c3c3c] p-0 flex flex-col">
        <DialogHeader className="p-4 border-b border-[#3c3c3c] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitMerge className="h-5 w-5 text-orange-400" />
              <DialogTitle className="text-[#cccccc]">
                Resolve Merge Conflicts - {fileName}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {ourBranch}
              </Badge>
              <span className="text-[#808080]">vs</span>
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                {theirBranch}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Conflict Navigation */}
        <div className="px-4 py-2 border-b border-[#3c3c3c] flex items-center justify-between bg-[#252526]">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentConflict(Math.max(0, currentConflict - 1))}
              disabled={currentConflict === 0}
              className="text-[#cccccc]"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-[#cccccc]">
              Conflict {currentConflict + 1} of {conflicts.length}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentConflict(Math.min(conflicts.length - 1, currentConflict + 1))}
              disabled={currentConflict === conflicts.length - 1}
              className="text-[#cccccc]"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {conflicts.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setCurrentConflict(i)}
                  className={cn(
                    "w-3 h-3 rounded-full transition-colors",
                    i === currentConflict ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-[#252526]" : "",
                    c.resolution === null
                      ? "bg-orange-400"
                      : "bg-green-400"
                  )}
                />
              ))}
            </div>
            <Badge variant="outline" className={cn(
              allResolved ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"
            )}>
              {resolvedCount}/{conflicts.length} Resolved
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={viewMode === 'split' ? 'secondary' : 'ghost'}
              onClick={() => setViewMode('split')}
              className="text-[#cccccc]"
            >
              Split
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'unified' ? 'secondary' : 'ghost'}
              onClick={() => setViewMode('unified')}
              className="text-[#cccccc]"
            >
              Unified
            </Button>
          </div>
        </div>

        {/* Conflict View */}
        <div className="flex-1 overflow-hidden">
          {conflict && (
            viewMode === 'split' ? (
              <div className="h-full flex">
                {/* Ours Side */}
                <div className="flex-1 border-r border-[#3c3c3c] flex flex-col">
                  <div className="px-4 py-2 bg-blue-500/10 border-b border-[#3c3c3c] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowLeft className="h-4 w-4 text-blue-400" />
                      <span className="text-sm font-medium text-blue-400">Current Changes ({ourBranch})</span>
                    </div>
                    <Button
                      size="sm"
                      variant={conflict.resolution === 'ours' ? 'default' : 'outline'}
                      onClick={() => handleResolve(conflict.id, 'ours')}
                      className={cn(
                        conflict.resolution === 'ours' 
                          ? "bg-blue-500 text-white" 
                          : "text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
                      )}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Accept Current
                    </Button>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-4 font-mono text-sm">
                      {conflict.ours.map((line, i) => (
                        <div key={i} className="py-0.5 text-blue-300 bg-blue-500/5 px-2 -mx-2">
                          <span className="text-[#808080] mr-4 select-none">{i + 1}</span>
                          {line || ' '}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Theirs Side */}
                <div className="flex-1 flex flex-col">
                  <div className="px-4 py-2 bg-green-500/10 border-b border-[#3c3c3c] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-green-400" />
                      <span className="text-sm font-medium text-green-400">Incoming Changes ({theirBranch})</span>
                    </div>
                    <Button
                      size="sm"
                      variant={conflict.resolution === 'theirs' ? 'default' : 'outline'}
                      onClick={() => handleResolve(conflict.id, 'theirs')}
                      className={cn(
                        conflict.resolution === 'theirs' 
                          ? "bg-green-500 text-white" 
                          : "text-green-400 border-green-500/30 hover:bg-green-500/20"
                      )}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Accept Incoming
                    </Button>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-4 font-mono text-sm">
                      {conflict.theirs.map((line, i) => (
                        <div key={i} className="py-0.5 text-green-300 bg-green-500/5 px-2 -mx-2">
                          <span className="text-[#808080] mr-4 select-none">{i + 1}</span>
                          {line || ' '}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            ) : (
              // Unified view
              <ScrollArea className="h-full">
                <div className="p-4 font-mono text-sm">
                  {/* Current changes */}
                  <div className="mb-4">
                    <div className="text-xs text-blue-400 mb-2 flex items-center gap-2">
                      <ArrowLeft className="h-3 w-3" />
                      Current Changes ({ourBranch})
                    </div>
                    {conflict.ours.map((line, i) => (
                      <div key={`ours-${i}`} className="py-0.5 text-blue-300 bg-blue-500/10 px-2 border-l-2 border-blue-500">
                        {line || ' '}
                      </div>
                    ))}
                  </div>
                  
                  {/* Incoming changes */}
                  <div>
                    <div className="text-xs text-green-400 mb-2 flex items-center gap-2">
                      <ArrowRight className="h-3 w-3" />
                      Incoming Changes ({theirBranch})
                    </div>
                    {conflict.theirs.map((line, i) => (
                      <div key={`theirs-${i}`} className="py-0.5 text-green-300 bg-green-500/10 px-2 border-l-2 border-green-500">
                        {line || ' '}
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            )
          )}
        </div>

        {/* Resolution Actions */}
        <div className="px-4 py-3 border-t border-[#3c3c3c] bg-[#252526] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {conflict && (
              <Button
                size="sm"
                variant={conflict.resolution === 'both' ? 'default' : 'outline'}
                onClick={() => handleResolve(conflict.id, 'both')}
                className={cn(
                  conflict.resolution === 'both' 
                    ? "bg-purple-500 text-white" 
                    : "text-purple-400 border-purple-500/30 hover:bg-purple-500/20"
                )}
              >
                <Combine className="h-3 w-3 mr-1" />
                Accept Both
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-[#cccccc]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyAll}
              disabled={!allResolved}
              className={cn(
                allResolved
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-[#3c3c3c] text-[#808080]"
              )}
            >
              <Check className="h-4 w-4 mr-2" />
              Apply Resolution
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
