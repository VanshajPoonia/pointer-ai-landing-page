'use client'

import { useState, useCallback, useMemo } from 'react'
import { X, FileCode, MapPin, ArrowRight, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

// Types for symbol information
export interface SymbolLocation {
  fileId: string
  filePath: string
  line: number
  column: number
  endLine?: number
  endColumn?: number
  preview: string
}

export interface SymbolDefinition extends SymbolLocation {
  name: string
  kind: 'function' | 'class' | 'variable' | 'interface' | 'type' | 'constant' | 'method' | 'property' | 'import'
}

export interface SymbolReference extends SymbolLocation {
  context: 'read' | 'write' | 'call' | 'import' | 'export'
}

interface CodeNavigationProps {
  files: Array<{
    id: string
    name: string
    path: string
    content?: string
  }>
  onNavigate: (fileId: string, line: number, column?: number) => void
}

// Parse symbols from code
export function parseSymbols(code: string, fileId: string, filePath: string): SymbolDefinition[] {
  const symbols: SymbolDefinition[] = []
  const lines = code.split('\n')

  lines.forEach((line, lineIndex) => {
    const lineNum = lineIndex + 1

    // Function declarations
    const funcMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/g)
    if (funcMatch) {
      const nameMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/)
      if (nameMatch) {
        symbols.push({
          name: nameMatch[1],
          kind: 'function',
          fileId,
          filePath,
          line: lineNum,
          column: line.indexOf(nameMatch[1]) + 1,
          preview: line.trim(),
        })
      }
    }

    // Arrow functions with const
    const arrowMatch = line.match(/(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(/)
    if (arrowMatch) {
      symbols.push({
        name: arrowMatch[1],
        kind: 'function',
        fileId,
        filePath,
        line: lineNum,
        column: line.indexOf(arrowMatch[1]) + 1,
        preview: line.trim(),
      })
    }

    // Class declarations
    const classMatch = line.match(/(?:export\s+)?class\s+(\w+)/)
    if (classMatch) {
      symbols.push({
        name: classMatch[1],
        kind: 'class',
        fileId,
        filePath,
        line: lineNum,
        column: line.indexOf(classMatch[1]) + 1,
        preview: line.trim(),
      })
    }

    // Interface declarations
    const interfaceMatch = line.match(/(?:export\s+)?interface\s+(\w+)/)
    if (interfaceMatch) {
      symbols.push({
        name: interfaceMatch[1],
        kind: 'interface',
        fileId,
        filePath,
        line: lineNum,
        column: line.indexOf(interfaceMatch[1]) + 1,
        preview: line.trim(),
      })
    }

    // Type declarations
    const typeMatch = line.match(/(?:export\s+)?type\s+(\w+)\s*=/)
    if (typeMatch) {
      symbols.push({
        name: typeMatch[1],
        kind: 'type',
        fileId,
        filePath,
        line: lineNum,
        column: line.indexOf(typeMatch[1]) + 1,
        preview: line.trim(),
      })
    }

    // Variable/constant declarations
    const varMatch = line.match(/(?:export\s+)?(?:const|let|var)\s+(\w+)\s*[=:]/)
    if (varMatch && !arrowMatch) {
      const isConst = line.includes('const')
      symbols.push({
        name: varMatch[1],
        kind: isConst ? 'constant' : 'variable',
        fileId,
        filePath,
        line: lineNum,
        column: line.indexOf(varMatch[1]) + 1,
        preview: line.trim(),
      })
    }
  })

  return symbols
}

// Find references to a symbol
export function findReferences(
  symbolName: string,
  files: Array<{ id: string; path: string; content?: string }>,
  excludeDefinition?: SymbolLocation
): SymbolReference[] {
  const references: SymbolReference[] = []

  files.forEach(file => {
    if (!file.content) return

    const lines = file.content.split('\n')
    lines.forEach((line, lineIndex) => {
      const lineNum = lineIndex + 1

      // Skip if this is the definition location
      if (excludeDefinition && 
          file.id === excludeDefinition.fileId && 
          lineNum === excludeDefinition.line) {
        return
      }

      // Find all occurrences of the symbol in this line
      const regex = new RegExp(`\\b${symbolName}\\b`, 'g')
      let match
      while ((match = regex.exec(line)) !== null) {
        // Determine the context
        let context: SymbolReference['context'] = 'read'
        
        if (line.includes('import')) {
          context = 'import'
        } else if (line.includes('export')) {
          context = 'export'
        } else if (line.match(new RegExp(`${symbolName}\\s*\\(`))) {
          context = 'call'
        } else if (line.match(new RegExp(`${symbolName}\\s*=(?!=)`))) {
          context = 'write'
        }

        references.push({
          fileId: file.id,
          filePath: file.path,
          line: lineNum,
          column: match.index + 1,
          preview: line.trim(),
          context,
        })
      }
    })
  })

  return references
}

// Go to Definition Dialog
interface GoToDefinitionDialogProps {
  isOpen: boolean
  onClose: () => void
  symbol: string
  definitions: SymbolDefinition[]
  onSelect: (definition: SymbolDefinition) => void
}

export function GoToDefinitionDialog({
  isOpen,
  onClose,
  symbol,
  definitions,
  onSelect,
}: GoToDefinitionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#252526] border-[#3c3c3c] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[14px] text-[#cccccc]">
            Go to Definition: <span className="text-blue-400">{symbol}</span>
          </DialogTitle>
        </DialogHeader>

        {definitions.length === 0 ? (
          <div className="py-8 text-center text-[#808080] text-sm">
            No definitions found for "{symbol}"
          </div>
        ) : definitions.length === 1 ? (
          <div className="py-4">
            <p className="text-sm text-[#808080] mb-2">Found 1 definition:</p>
            <DefinitionItem
              definition={definitions[0]}
              onClick={() => {
                onSelect(definitions[0])
                onClose()
              }}
            />
          </div>
        ) : (
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-1">
              {definitions.map((def, index) => (
                <DefinitionItem
                  key={`${def.fileId}-${def.line}-${index}`}
                  definition={def}
                  onClick={() => {
                    onSelect(def)
                    onClose()
                  }}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DefinitionItem({
  definition,
  onClick,
}: {
  definition: SymbolDefinition
  onClick: () => void
}) {
  return (
    <button
      className="w-full text-left px-3 py-2 rounded hover:bg-[#3c3c3c] transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-1">
        <SymbolIcon kind={definition.kind} />
        <span className="text-[13px] text-blue-400">{definition.name}</span>
        <span className="text-[11px] text-[#808080]">{definition.kind}</span>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-[#808080]">
        <FileCode className="h-3 w-3" />
        <span className="truncate">{definition.filePath}</span>
        <span>:{definition.line}</span>
      </div>
      <pre className="mt-1 text-[11px] text-[#969696] bg-[#1e1e1e] px-2 py-1 rounded overflow-hidden text-ellipsis whitespace-nowrap">
        {definition.preview}
      </pre>
    </button>
  )
}

// Find All References Dialog
interface FindReferencesDialogProps {
  isOpen: boolean
  onClose: () => void
  symbol: string
  references: SymbolReference[]
  definition?: SymbolDefinition
  onSelect: (reference: SymbolLocation) => void
  isLoading?: boolean
}

export function FindReferencesDialog({
  isOpen,
  onClose,
  symbol,
  references,
  definition,
  onSelect,
  isLoading = false,
}: FindReferencesDialogProps) {
  const [filter, setFilter] = useState('')

  const filteredRefs = useMemo(() => {
    if (!filter) return references
    const lower = filter.toLowerCase()
    return references.filter(ref =>
      ref.filePath.toLowerCase().includes(lower) ||
      ref.preview.toLowerCase().includes(lower)
    )
  }, [references, filter])

  const groupedRefs = useMemo(() => {
    const groups: Record<string, SymbolReference[]> = {}
    filteredRefs.forEach(ref => {
      if (!groups[ref.filePath]) {
        groups[ref.filePath] = []
      }
      groups[ref.filePath].push(ref)
    })
    return groups
  }, [filteredRefs])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#252526] border-[#3c3c3c] text-white max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-[14px] text-[#cccccc] flex items-center gap-2">
            References: <span className="text-blue-400">{symbol}</span>
            <span className="text-[#808080] text-[12px]">
              ({references.length} reference{references.length !== 1 ? 's' : ''})
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#808080]" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter references..."
            className="pl-9 bg-[#3c3c3c] border-[#4c4c4c] text-[#cccccc] h-8 text-[12px]"
          />
        </div>

        {isLoading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : references.length === 0 ? (
          <div className="py-8 text-center text-[#808080] text-sm">
            No references found for "{symbol}"
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            {definition && (
              <div className="mb-3">
                <div className="text-[11px] font-medium text-[#808080] uppercase tracking-wide mb-1 px-1">
                  Definition
                </div>
                <ReferenceItem
                  reference={{
                    ...definition,
                    context: 'write',
                  }}
                  onClick={() => {
                    onSelect(definition)
                    onClose()
                  }}
                  showContext={false}
                />
              </div>
            )}

            <div className="text-[11px] font-medium text-[#808080] uppercase tracking-wide mb-1 px-1">
              References
            </div>
            {Object.entries(groupedRefs).map(([filePath, refs]) => (
              <div key={filePath} className="mb-3">
                <div className="flex items-center gap-2 px-2 py-1 text-[12px] text-[#969696]">
                  <FileCode className="h-3.5 w-3.5" />
                  <span className="truncate">{filePath}</span>
                  <span className="text-[#808080]">({refs.length})</span>
                </div>
                <div className="space-y-0.5">
                  {refs.map((ref, index) => (
                    <ReferenceItem
                      key={`${ref.line}-${index}`}
                      reference={ref}
                      onClick={() => {
                        onSelect(ref)
                        onClose()
                      }}
                      showFile={false}
                    />
                  ))}
                </div>
              </div>
            ))}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ReferenceItem({
  reference,
  onClick,
  showFile = true,
  showContext = true,
}: {
  reference: SymbolReference
  onClick: () => void
  showFile?: boolean
  showContext?: boolean
}) {
  const contextColors: Record<SymbolReference['context'], string> = {
    read: 'text-green-400',
    write: 'text-orange-400',
    call: 'text-blue-400',
    import: 'text-purple-400',
    export: 'text-yellow-400',
  }

  return (
    <button
      className="w-full text-left px-3 py-1.5 rounded hover:bg-[#3c3c3c] transition-colors flex items-start gap-3"
      onClick={onClick}
    >
      <span className="text-[11px] text-[#808080] w-8 text-right flex-shrink-0 pt-0.5">
        {reference.line}
      </span>
      <div className="flex-1 min-w-0">
        <pre className="text-[12px] text-[#cccccc] overflow-hidden text-ellipsis whitespace-nowrap font-mono">
          {reference.preview}
        </pre>
        {showContext && (
          <span className={cn('text-[10px] capitalize', contextColors[reference.context])}>
            {reference.context}
          </span>
        )}
      </div>
      <ArrowRight className="h-3 w-3 text-[#808080] flex-shrink-0 mt-1" />
    </button>
  )
}

function SymbolIcon({ kind }: { kind: SymbolDefinition['kind'] }) {
  const colors: Record<SymbolDefinition['kind'], string> = {
    function: 'text-purple-400',
    class: 'text-orange-400',
    variable: 'text-blue-400',
    interface: 'text-green-400',
    type: 'text-green-400',
    constant: 'text-blue-300',
    method: 'text-purple-400',
    property: 'text-blue-400',
    import: 'text-yellow-400',
  }

  const labels: Record<SymbolDefinition['kind'], string> = {
    function: 'fn',
    class: 'C',
    variable: 'V',
    interface: 'I',
    type: 'T',
    constant: 'K',
    method: 'M',
    property: 'P',
    import: 'Im',
  }

  return (
    <span className={cn(
      'text-[10px] font-bold px-1 rounded bg-[#3c3c3c]',
      colors[kind]
    )}>
      {labels[kind]}
    </span>
  )
}

// Document Outline/Symbols panel
interface DocumentOutlineProps {
  symbols: SymbolDefinition[]
  onSelect: (symbol: SymbolDefinition) => void
  isOpen: boolean
  onClose: () => void
}

export function DocumentOutline({
  symbols,
  onSelect,
  isOpen,
  onClose,
}: DocumentOutlineProps) {
  const [filter, setFilter] = useState('')

  const filteredSymbols = useMemo(() => {
    if (!filter) return symbols
    const lower = filter.toLowerCase()
    return symbols.filter(s => s.name.toLowerCase().includes(lower))
  }, [symbols, filter])

  const groupedSymbols = useMemo(() => {
    const groups: Record<SymbolDefinition['kind'], SymbolDefinition[]> = {
      class: [],
      interface: [],
      type: [],
      function: [],
      method: [],
      constant: [],
      variable: [],
      property: [],
      import: [],
    }
    filteredSymbols.forEach(s => {
      groups[s.kind].push(s)
    })
    return groups
  }, [filteredSymbols])

  if (!isOpen) return null

  return (
    <div className="w-[250px] bg-[#252526] border-l border-[#3c3c3c] flex flex-col h-full">
      <div className="h-[35px] flex items-center justify-between px-3 border-b border-[#3c3c3c]">
        <span className="text-[12px] text-[#cccccc] font-medium">Outline</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-5 w-5 p-0 text-[#808080] hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="p-2">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter symbols..."
          className="h-7 text-[11px] bg-[#3c3c3c] border-[#4c4c4c]"
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="px-2 pb-2">
          {Object.entries(groupedSymbols).map(([kind, syms]) => {
            if (syms.length === 0) return null
            return (
              <div key={kind} className="mb-2">
                <div className="text-[10px] uppercase text-[#808080] font-medium px-1 mb-1">
                  {kind}s ({syms.length})
                </div>
                {syms.map((sym, index) => (
                  <button
                    key={`${sym.name}-${index}`}
                    className="w-full text-left px-2 py-1 rounded hover:bg-[#3c3c3c] flex items-center gap-2 text-[12px]"
                    onClick={() => onSelect(sym)}
                  >
                    <SymbolIcon kind={sym.kind} />
                    <span className="text-[#cccccc] truncate">{sym.name}</span>
                    <span className="text-[#808080] text-[10px] ml-auto">{sym.line}</span>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

// Hook for code navigation
export function useCodeNavigation(files: Array<{ id: string; name: string; path: string; content?: string }>) {
  const [goToDefDialog, setGoToDefDialog] = useState<{ symbol: string; definitions: SymbolDefinition[] } | null>(null)
  const [findRefsDialog, setFindRefsDialog] = useState<{ symbol: string; references: SymbolReference[]; definition?: SymbolDefinition } | null>(null)
  const [showOutline, setShowOutline] = useState(false)
  const [currentSymbols, setCurrentSymbols] = useState<SymbolDefinition[]>([])

  const allSymbols = useMemo(() => {
    const symbols: SymbolDefinition[] = []
    files.forEach(file => {
      if (file.content) {
        symbols.push(...parseSymbols(file.content, file.id, file.path))
      }
    })
    return symbols
  }, [files])

  const goToDefinition = useCallback((symbolName: string) => {
    const definitions = allSymbols.filter(s => s.name === symbolName)
    
    if (definitions.length === 0) {
      setGoToDefDialog({ symbol: symbolName, definitions: [] })
    } else if (definitions.length === 1) {
      // Auto-navigate if only one definition
      return definitions[0]
    } else {
      setGoToDefDialog({ symbol: symbolName, definitions })
    }
    return null
  }, [allSymbols])

  const findAllReferences = useCallback((symbolName: string) => {
    const definition = allSymbols.find(s => s.name === symbolName)
    const references = findReferences(symbolName, files, definition)
    setFindRefsDialog({ symbol: symbolName, references, definition })
  }, [allSymbols, files])

  const updateCurrentFileSymbols = useCallback((fileId: string, content: string, filePath: string) => {
    const symbols = parseSymbols(content, fileId, filePath)
    setCurrentSymbols(symbols)
  }, [])

  return {
    goToDefinition,
    findAllReferences,
    goToDefDialog,
    setGoToDefDialog,
    findRefsDialog,
    setFindRefsDialog,
    showOutline,
    setShowOutline,
    currentSymbols,
    updateCurrentFileSymbols,
    allSymbols,
  }
}
