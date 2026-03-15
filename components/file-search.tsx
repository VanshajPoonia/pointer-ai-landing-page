'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  FileCode, 
  FolderOpen, 
  X, 
  Replace,
  ChevronDown,
  ChevronRight,
  FileText,
  FileJson,
  FileType
} from 'lucide-react'
import { getFileIcon } from './file-icons'

interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  content?: string
}

interface SearchResult {
  file: FileNode
  matches: Array<{
    line: number
    content: string
    matchStart: number
    matchEnd: number
  }>
}

// Fuzzy matching function
function fuzzyMatch(pattern: string, str: string): { matches: boolean; score: number; indices: number[] } {
  const patternLower = pattern.toLowerCase()
  const strLower = str.toLowerCase()
  
  if (patternLower.length === 0) return { matches: true, score: 0, indices: [] }
  if (patternLower.length > strLower.length) return { matches: false, score: 0, indices: [] }
  
  let patternIdx = 0
  let score = 0
  const indices: number[] = []
  let lastMatchIdx = -1
  
  for (let i = 0; i < strLower.length && patternIdx < patternLower.length; i++) {
    if (strLower[i] === patternLower[patternIdx]) {
      indices.push(i)
      // Bonus for consecutive matches
      if (lastMatchIdx === i - 1) {
        score += 10
      }
      // Bonus for matching at word boundaries
      if (i === 0 || str[i - 1] === '/' || str[i - 1] === '-' || str[i - 1] === '_' || str[i - 1] === '.') {
        score += 5
      }
      lastMatchIdx = i
      patternIdx++
      score++
    }
  }
  
  return {
    matches: patternIdx === patternLower.length,
    score,
    indices
  }
}

// Quick Open (Cmd+P) - File Search
interface QuickOpenProps {
  isOpen: boolean
  onClose: () => void
  files: FileNode[]
  onFileSelect: (fileId: string) => void
  recentFiles?: string[]
}

export function QuickOpen({ isOpen, onClose, files, onFileSelect, recentFiles = [] }: QuickOpenProps) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredFiles = useMemo(() => {
    const allFiles = files.filter(f => f.type === 'file')
    
    if (!search) {
      // Show recent files first, then all files
      const recent = recentFiles
        .map(id => allFiles.find(f => f.id === id))
        .filter(Boolean) as FileNode[]
      const others = allFiles.filter(f => !recentFiles.includes(f.id))
      return [...recent, ...others].slice(0, 20)
    }
    
    return allFiles
      .map(file => ({
        file,
        ...fuzzyMatch(search, file.path || file.name)
      }))
      .filter(result => result.matches)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(result => result.file)
  }, [files, search, recentFiles])

  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, filteredFiles.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredFiles[selectedIndex]) {
          onFileSelect(filteredFiles[selectedIndex].id)
          onClose()
        }
        break
      case 'Escape':
        onClose()
        break
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="overflow-hidden p-0 shadow-lg bg-[#1e1e1e] border-[#3c3c3c] max-w-[600px] top-[20%] translate-y-0">
        <div className="flex items-center border-b border-[#3c3c3c] px-3">
          <Search className="h-4 w-4 text-[#808080]" />
          <Input
            ref={inputRef}
            placeholder="Search files by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border-0 bg-transparent text-[#cccccc] placeholder:text-[#808080] focus-visible:ring-0 h-12"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-[#808080] hover:text-[#cccccc]">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="max-h-[400px] overflow-y-auto py-2">
          {filteredFiles.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#808080]">
              No files found
            </div>
          ) : (
            filteredFiles.map((file, index) => {
              const Icon = getFileIcon(file.name)
              return (
                <button
                  key={file.id}
                  onClick={() => {
                    onFileSelect(file.id)
                    onClose()
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                    index === selectedIndex 
                      ? 'bg-[#094771] text-white' 
                      : 'text-[#cccccc] hover:bg-[#2a2d2e]'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm truncate block">{file.name}</span>
                    <span className="text-xs text-[#808080] truncate block">{file.path}</span>
                  </div>
                  {recentFiles.includes(file.id) && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-[#3c3c3c] border-[#505050] text-[#808080]">
                      Recent
                    </Badge>
                  )}
                </button>
              )
            })
          )}
        </div>
        
        <div className="flex items-center justify-between px-4 py-2 border-t border-[#3c3c3c] text-[10px] text-[#808080]">
          <div className="flex gap-4">
            <span><Badge variant="outline" className="px-1 py-0 mr-1">↑↓</Badge> Navigate</span>
            <span><Badge variant="outline" className="px-1 py-0 mr-1">Enter</Badge> Open</span>
            <span><Badge variant="outline" className="px-1 py-0 mr-1">Esc</Badge> Close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Global Search (Cmd+Shift+F) - Search across all files
interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
  files: FileNode[]
  onResultSelect: (fileId: string, line: number) => void
}

export function GlobalSearch({ isOpen, onClose, files, onResultSelect }: GlobalSearchProps) {
  const [search, setSearch] = useState('')
  const [replace, setReplace] = useState('')
  const [showReplace, setShowReplace] = useState(false)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [useRegex, setUseRegex] = useState(false)
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo((): SearchResult[] => {
    if (!search || search.length < 2) return []
    
    const searchResults: SearchResult[] = []
    
    files.filter(f => f.type === 'file' && f.content).forEach(file => {
      const lines = file.content!.split('\n')
      const matches: SearchResult['matches'] = []
      
      lines.forEach((line, lineIndex) => {
        let searchStr = search
        let lineStr = line
        
        if (!caseSensitive) {
          searchStr = searchStr.toLowerCase()
          lineStr = lineStr.toLowerCase()
        }
        
        let idx = lineStr.indexOf(searchStr)
        while (idx !== -1) {
          if (!wholeWord || (
            (idx === 0 || !/\w/.test(line[idx - 1])) &&
            (idx + search.length >= line.length || !/\w/.test(line[idx + search.length]))
          )) {
            matches.push({
              line: lineIndex + 1,
              content: line,
              matchStart: idx,
              matchEnd: idx + search.length
            })
          }
          idx = lineStr.indexOf(searchStr, idx + 1)
        }
      })
      
      if (matches.length > 0) {
        searchResults.push({ file, matches })
      }
    })
    
    return searchResults
  }, [files, search, caseSensitive, wholeWord, useRegex])

  const totalMatches = useMemo(() => 
    results.reduce((sum, r) => sum + r.matches.length, 0),
    [results]
  )

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const toggleFile = (fileId: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev)
      if (next.has(fileId)) {
        next.delete(fileId)
      } else {
        next.add(fileId)
      }
      return next
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[400px] bg-[#1e1e1e] border-l border-[#3c3c3c] shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#3c3c3c]">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-[#cccccc]" />
          <span className="text-sm font-medium text-[#cccccc]">Search</span>
        </div>
        <button onClick={onClose} className="text-[#808080] hover:text-[#cccccc]">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 space-y-2 border-b border-[#3c3c3c]">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              placeholder="Search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-[#3c3c3c] border-[#505050] text-[#cccccc] h-8 pr-20"
            />
            <div className="absolute right-1 top-1 flex gap-0.5">
              <button
                onClick={() => setCaseSensitive(!caseSensitive)}
                className={`p-1 rounded text-xs ${caseSensitive ? 'bg-[#094771] text-white' : 'text-[#808080] hover:bg-[#505050]'}`}
                title="Match Case"
              >
                Aa
              </button>
              <button
                onClick={() => setWholeWord(!wholeWord)}
                className={`p-1 rounded text-xs ${wholeWord ? 'bg-[#094771] text-white' : 'text-[#808080] hover:bg-[#505050]'}`}
                title="Whole Word"
              >
                ab
              </button>
              <button
                onClick={() => setUseRegex(!useRegex)}
                className={`p-1 rounded text-xs ${useRegex ? 'bg-[#094771] text-white' : 'text-[#808080] hover:bg-[#505050]'}`}
                title="Use Regex"
              >
                .*
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowReplace(!showReplace)}
            className={`p-1.5 rounded ${showReplace ? 'bg-[#094771] text-white' : 'text-[#808080] hover:bg-[#3c3c3c]'}`}
            title="Toggle Replace"
          >
            <Replace className="h-4 w-4" />
          </button>
        </div>
        
        {showReplace && (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Replace"
              value={replace}
              onChange={e => setReplace(e.target.value)}
              className="bg-[#3c3c3c] border-[#505050] text-[#cccccc] h-8 flex-1"
            />
            <Button size="sm" variant="outline" className="h-8 text-xs bg-[#3c3c3c] border-[#505050] text-[#cccccc] hover:bg-[#505050]">
              Replace All
            </Button>
          </div>
        )}
        
        {search.length >= 2 && (
          <div className="text-xs text-[#808080]">
            {totalMatches} results in {results.length} files
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {results.map(result => {
          const Icon = getFileIcon(result.file.name)
          const isExpanded = expandedFiles.has(result.file.id)
          
          return (
            <div key={result.file.id} className="border-b border-[#2a2d2e]">
              <button
                onClick={() => toggleFile(result.file.id)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#2a2d2e] text-left"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 text-[#808080]" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-[#808080]" />
                )}
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm text-[#cccccc] truncate flex-1">{result.file.name}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-[#3c3c3c] border-[#505050] text-[#808080]">
                  {result.matches.length}
                </Badge>
              </button>
              
              {isExpanded && (
                <div className="pl-8 pb-2">
                  {result.matches.slice(0, 50).map((match, idx) => (
                    <button
                      key={idx}
                      onClick={() => onResultSelect(result.file.id, match.line)}
                      className="w-full flex items-start gap-2 px-2 py-1 hover:bg-[#2a2d2e] text-left"
                    >
                      <span className="text-[10px] text-[#808080] w-8 flex-shrink-0 text-right">
                        {match.line}
                      </span>
                      <span className="text-xs text-[#cccccc] font-mono truncate">
                        {match.content.slice(0, match.matchStart)}
                        <span className="bg-[#613214] text-[#ffcc00]">
                          {match.content.slice(match.matchStart, match.matchEnd)}
                        </span>
                        {match.content.slice(match.matchEnd)}
                      </span>
                    </button>
                  ))}
                  {result.matches.length > 50 && (
                    <div className="px-2 py-1 text-[10px] text-[#808080]">
                      ... and {result.matches.length - 50} more matches
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        
        {search.length >= 2 && results.length === 0 && (
          <div className="p-8 text-center text-sm text-[#808080]">
            No results found for "{search}"
          </div>
        )}
        
        {search.length < 2 && (
          <div className="p-8 text-center text-sm text-[#808080]">
            Enter at least 2 characters to search
          </div>
        )}
      </div>
    </div>
  )
}
