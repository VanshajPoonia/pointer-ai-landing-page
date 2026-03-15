'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { X, Search, FileCode, Hash, Braces, Box, Type, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Symbol types for parsing
export type SymbolKind = 'function' | 'class' | 'interface' | 'type' | 'variable' | 'const' | 'enum' | 'method' | 'property'

export interface Symbol {
  name: string
  kind: SymbolKind
  line: number
  column: number
  endLine?: number
  endColumn?: number
  fileId: string
  filePath: string
  parent?: string
  documentation?: string
}

export interface SymbolReference {
  fileId: string
  filePath: string
  line: number
  column: number
  context: string // Line content for preview
  isDefinition: boolean
}

interface SymbolNavigationProps {
  isOpen: boolean
  onClose: () => void
  files: Array<{
    id: string
    name: string
    path: string
    content?: string
  }>
  onNavigate: (fileId: string, line: number, column: number) => void
  mode: 'definition' | 'references' | 'outline'
  targetSymbol?: string
  currentFileId?: string
}

// Parse symbols from TypeScript/JavaScript code
export function parseSymbols(content: string, fileId: string, filePath: string): Symbol[] {
  const symbols: Symbol[] = []
  const lines = content.split('\n')

  // Regular expressions for different symbol types
  const patterns = {
    function: /(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
    arrowFunction: /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*(?::\s*[^=]+)?\s*=>/,
    class: /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/,
    interface: /(?:export\s+)?interface\s+(\w+)/,
    type: /(?:export\s+)?type\s+(\w+)/,
    enum: /(?:export\s+)?enum\s+(\w+)/,
    const: /(?:export\s+)?const\s+(\w+)\s*(?::\s*[^=]+)?\s*=/,
    let: /(?:export\s+)?let\s+(\w+)/,
    method: /^\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/,
    property: /^\s*(?:readonly\s+)?(\w+)\s*(?:\?)?:\s*/,
  }

  let currentClass: string | undefined
  let braceDepth = 0

  lines.forEach((line, index) => {
    const lineNum = index + 1
    
    // Track brace depth for class context
    const openBraces = (line.match(/\{/g) || []).length
    const closeBraces = (line.match(/\}/g) || []).length
    braceDepth += openBraces - closeBraces

    if (braceDepth === 0) {
      currentClass = undefined
    }

    // Check for class (sets context for methods)
    const classMatch = line.match(patterns.class)
    if (classMatch) {
      currentClass = classMatch[1]
      symbols.push({
        name: classMatch[1],
        kind: 'class',
        line: lineNum,
        column: line.indexOf(classMatch[1]) + 1,
        fileId,
        filePath,
      })
      return
    }

    // Check for interface
    const interfaceMatch = line.match(patterns.interface)
    if (interfaceMatch) {
      symbols.push({
        name: interfaceMatch[1],
        kind: 'interface',
        line: lineNum,
        column: line.indexOf(interfaceMatch[1]) + 1,
        fileId,
        filePath,
      })
      return
    }

    // Check for type
    const typeMatch = line.match(patterns.type)
    if (typeMatch) {
      symbols.push({
        name: typeMatch[1],
        kind: 'type',
        line: lineNum,
        column: line.indexOf(typeMatch[1]) + 1,
        fileId,
        filePath,
      })
      return
    }

    // Check for enum
    const enumMatch = line.match(patterns.enum)
    if (enumMatch) {
      symbols.push({
        name: enumMatch[1],
        kind: 'enum',
        line: lineNum,
        column: line.indexOf(enumMatch[1]) + 1,
        fileId,
        filePath,
      })
      return
    }

    // Check for function
    const functionMatch = line.match(patterns.function)
    if (functionMatch) {
      symbols.push({
        name: functionMatch[1],
        kind: currentClass ? 'method' : 'function',
        line: lineNum,
        column: line.indexOf(functionMatch[1]) + 1,
        fileId,
        filePath,
        parent: currentClass,
      })
      return
    }

    // Check for arrow function
    const arrowMatch = line.match(patterns.arrowFunction)
    if (arrowMatch) {
      symbols.push({
        name: arrowMatch[1],
        kind: 'function',
        line: lineNum,
        column: line.indexOf(arrowMatch[1]) + 1,
        fileId,
        filePath,
      })
      return
    }

    // Check for const (but not arrow functions, already caught above)
    if (!arrowMatch) {
      const constMatch = line.match(patterns.const)
      if (constMatch && !line.includes('=>')) {
        symbols.push({
          name: constMatch[1],
          kind: 'const',
          line: lineNum,
          column: line.indexOf(constMatch[1]) + 1,
          fileId,
          filePath,
        })
        return
      }
    }

    // Check for method inside class
    if (currentClass && braceDepth > 0) {
      const methodMatch = line.match(patterns.method)
      if (methodMatch && methodMatch[1] !== 'if' && methodMatch[1] !== 'for' && methodMatch[1] !== 'while') {
        symbols.push({
          name: methodMatch[1],
          kind: 'method',
          line: lineNum,
          column: line.indexOf(methodMatch[1]) + 1,
          fileId,
          filePath,
          parent: currentClass,
        })
      }
    }
  })

  return symbols
}

// Find all references to a symbol
export function findReferences(
  symbolName: string,
  files: Array<{ id: string; name: string; path: string; content?: string }>,
  allSymbols: Symbol[]
): SymbolReference[] {
  const references: SymbolReference[] = []
  const definitionSymbol = allSymbols.find(s => s.name === symbolName)

  files.forEach(file => {
    if (!file.content) return

    const lines = file.content.split('\n')
    lines.forEach((line, index) => {
      // Create regex to find whole word matches
      const regex = new RegExp(`\\b${symbolName}\\b`, 'g')
      let match
      while ((match = regex.exec(line)) !== null) {
        const isDefinition = definitionSymbol?.fileId === file.id && definitionSymbol?.line === index + 1
        references.push({
          fileId: file.id,
          filePath: file.path,
          line: index + 1,
          column: match.index + 1,
          context: line.trim(),
          isDefinition,
        })
      }
    })
  })

  return references
}

// Get icon for symbol kind
function getSymbolIcon(kind: SymbolKind) {
  switch (kind) {
    case 'function':
    case 'method':
      return <Braces className="h-4 w-4 text-purple-400" />
    case 'class':
      return <Box className="h-4 w-4 text-orange-400" />
    case 'interface':
    case 'type':
      return <Type className="h-4 w-4 text-blue-400" />
    case 'variable':
    case 'const':
      return <Hash className="h-4 w-4 text-cyan-400" />
    case 'enum':
      return <Hash className="h-4 w-4 text-green-400" />
    default:
      return <FileCode className="h-4 w-4 text-gray-400" />
  }
}

export function SymbolNavigation({
  isOpen,
  onClose,
  files,
  onNavigate,
  mode,
  targetSymbol,
  currentFileId,
}: SymbolNavigationProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Parse all symbols from files
  const allSymbols = useMemo(() => {
    const symbols: Symbol[] = []
    files.forEach(file => {
      if (file.content && (file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.js') || file.name.endsWith('.jsx'))) {
        symbols.push(...parseSymbols(file.content, file.id, file.path))
      }
    })
    return symbols
  }, [files])

  // Get current file symbols for outline mode
  const currentFileSymbols = useMemo(() => {
    if (mode !== 'outline' || !currentFileId) return []
    return allSymbols.filter(s => s.fileId === currentFileId)
  }, [allSymbols, currentFileId, mode])

  // Find references if in references mode
  const references = useMemo(() => {
    if (mode !== 'references' || !targetSymbol) return []
    return findReferences(targetSymbol, files, allSymbols)
  }, [mode, targetSymbol, files, allSymbols])

  // Filter symbols based on search
  const filteredSymbols = useMemo(() => {
    const symbolsToFilter = mode === 'outline' ? currentFileSymbols : allSymbols
    if (!searchQuery) return symbolsToFilter
    const query = searchQuery.toLowerCase()
    return symbolsToFilter.filter(s => s.name.toLowerCase().includes(query))
  }, [allSymbols, currentFileSymbols, mode, searchQuery])

  // Find definition
  const definition = useMemo(() => {
    if (mode !== 'definition' || !targetSymbol) return null
    return allSymbols.find(s => s.name === targetSymbol)
  }, [mode, targetSymbol, allSymbols])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const items = mode === 'references' ? references : filteredSymbols
      
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (mode === 'references' && references[selectedIndex]) {
          const ref = references[selectedIndex]
          onNavigate(ref.fileId, ref.line, ref.column)
          onClose()
        } else if (filteredSymbols[selectedIndex]) {
          const symbol = filteredSymbols[selectedIndex]
          onNavigate(symbol.fileId, symbol.line, symbol.column)
          onClose()
        }
      } else if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredSymbols, references, selectedIndex, mode, onNavigate, onClose])

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  // Handle direct navigation for definition mode
  useEffect(() => {
    if (mode === 'definition' && definition && isOpen) {
      onNavigate(definition.fileId, definition.line, definition.column)
      onClose()
    }
  }, [mode, definition, isOpen, onNavigate, onClose])

  const title = mode === 'definition' 
    ? 'Go to Definition' 
    : mode === 'references' 
    ? `References: ${targetSymbol}` 
    : 'Document Outline'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-[#1e1e1e] border-[#3c3c3c] text-[#cccccc] p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-sm font-medium">{title}</DialogTitle>
        </DialogHeader>
        
        {mode !== 'definition' && (
          <div className="px-4 pt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6e6e6e]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={mode === 'references' ? 'Filter references...' : 'Search symbols...'}
                className="pl-9 bg-[#3c3c3c] border-[#3c3c3c] text-sm h-9"
                autoFocus
              />
            </div>
          </div>
        )}

        <div className="max-h-[400px] overflow-y-auto p-2">
          {mode === 'references' ? (
            // References view
            references.length === 0 ? (
              <div className="text-center py-8 text-[#6e6e6e] text-sm">
                No references found
              </div>
            ) : (
              <div className="space-y-1">
                {references.map((ref, index) => (
                  <div
                    key={`${ref.fileId}-${ref.line}-${ref.column}`}
                    className={cn(
                      'flex items-start gap-3 p-2 rounded cursor-pointer',
                      index === selectedIndex ? 'bg-[#094771]' : 'hover:bg-[#2a2d2e]'
                    )}
                    onClick={() => {
                      onNavigate(ref.fileId, ref.line, ref.column)
                      onClose()
                    }}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {ref.isDefinition ? (
                        <Box className="h-4 w-4 text-yellow-400" />
                      ) : (
                        <ArrowRight className="h-4 w-4 text-[#6e6e6e]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[#cccccc] truncate">{ref.filePath}</span>
                        <span className="text-[#6e6e6e]">:{ref.line}</span>
                        {ref.isDefinition && (
                          <span className="text-yellow-400 text-[10px] bg-yellow-400/20 px-1 rounded">
                            Definition
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#808080] font-mono mt-1 truncate">
                        {ref.context}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // Symbols view (outline or go to symbol)
            filteredSymbols.length === 0 ? (
              <div className="text-center py-8 text-[#6e6e6e] text-sm">
                {mode === 'definition' ? 'Definition not found' : 'No symbols found'}
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredSymbols.map((symbol, index) => (
                  <div
                    key={`${symbol.fileId}-${symbol.line}-${symbol.name}`}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded cursor-pointer',
                      index === selectedIndex ? 'bg-[#094771]' : 'hover:bg-[#2a2d2e]'
                    )}
                    onClick={() => {
                      onNavigate(symbol.fileId, symbol.line, symbol.column)
                      onClose()
                    }}
                  >
                    {getSymbolIcon(symbol.kind)}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#cccccc]">{symbol.name}</span>
                        {symbol.parent && (
                          <span className="text-xs text-[#6e6e6e]">
                            in {symbol.parent}
                          </span>
                        )}
                      </div>
                      {mode !== 'outline' && (
                        <div className="text-[11px] text-[#6e6e6e] truncate">
                          {symbol.filePath}:{symbol.line}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-[#6e6e6e] capitalize">{symbol.kind}</span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-[#3c3c3c] text-[11px] text-[#6e6e6e]">
          <div className="flex items-center gap-4">
            <span><kbd className="px-1 bg-[#3c3c3c] rounded">Enter</kbd> to select</span>
            <span><kbd className="px-1 bg-[#3c3c3c] rounded">Esc</kbd> to close</span>
          </div>
          <span>
            {mode === 'references' 
              ? `${references.length} reference${references.length !== 1 ? 's' : ''}`
              : `${filteredSymbols.length} symbol${filteredSymbols.length !== 1 ? 's' : ''}`
            }
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Document Outline Panel (sidebar view)
export function DocumentOutline({
  symbols,
  onNavigate,
  currentLine,
}: {
  symbols: Symbol[]
  onNavigate: (line: number, column: number) => void
  currentLine?: number
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  // Group symbols by parent (for class methods)
  const groupedSymbols = useMemo(() => {
    const groups: Record<string, Symbol[]> = { _root: [] }
    
    symbols.forEach(symbol => {
      if (symbol.parent) {
        if (!groups[symbol.parent]) groups[symbol.parent] = []
        groups[symbol.parent].push(symbol)
      } else {
        groups._root.push(symbol)
      }
    })

    return groups
  }, [symbols])

  const toggleExpanded = (name: string) => {
    setExpanded(prev => ({ ...prev, [name]: !prev[name] }))
  }

  return (
    <div className="h-full bg-[#252526] border-l border-[#3c3c3c] overflow-y-auto">
      <div className="p-2 border-b border-[#3c3c3c]">
        <span className="text-[11px] text-[#808080] uppercase tracking-wide">Outline</span>
      </div>
      <div className="p-1">
        {symbols.length === 0 ? (
          <div className="text-center py-4 text-[#6e6e6e] text-xs">
            No symbols in this file
          </div>
        ) : (
          groupedSymbols._root.map(symbol => {
            const children = groupedSymbols[symbol.name] || []
            const hasChildren = children.length > 0
            const isExpanded = expanded[symbol.name] !== false // Default expanded

            return (
              <div key={`${symbol.name}-${symbol.line}`}>
                <div
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-[12px]',
                    currentLine === symbol.line ? 'bg-[#094771]' : 'hover:bg-[#2a2d2e]'
                  )}
                  onClick={() => {
                    if (hasChildren) toggleExpanded(symbol.name)
                    onNavigate(symbol.line, symbol.column)
                  }}
                >
                  {hasChildren && (
                    <span className={cn('transition-transform', isExpanded && 'rotate-90')}>
                      <ArrowRight className="h-3 w-3 text-[#6e6e6e]" />
                    </span>
                  )}
                  {getSymbolIcon(symbol.kind)}
                  <span className="text-[#cccccc] truncate">{symbol.name}</span>
                </div>
                {hasChildren && isExpanded && (
                  <div className="ml-4">
                    {children.map(child => (
                      <div
                        key={`${child.name}-${child.line}`}
                        className={cn(
                          'flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-[12px]',
                          currentLine === child.line ? 'bg-[#094771]' : 'hover:bg-[#2a2d2e]'
                        )}
                        onClick={() => onNavigate(child.line, child.column)}
                      >
                        {getSymbolIcon(child.kind)}
                        <span className="text-[#cccccc] truncate">{child.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
