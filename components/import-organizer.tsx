'use client'

import { useState, useMemo, useCallback } from 'react'
import { Package, Trash2, ArrowUpDown, Check, X, AlertTriangle, Wand2, Copy, FileCode } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export interface ImportStatement {
  id: string
  raw: string
  type: 'default' | 'named' | 'namespace' | 'side-effect' | 'type'
  source: string
  specifiers: string[]
  isTypeOnly: boolean
  line: number
  isUsed: boolean
  category: 'builtin' | 'external' | 'internal' | 'relative' | 'type'
}

interface ImportOrganizerProps {
  isOpen: boolean
  onClose: () => void
  code: string
  onApply: (organizedCode: string) => void
}

// Parse import statements from code
function parseImports(code: string): ImportStatement[] {
  const imports: ImportStatement[] = []
  const lines = code.split('\n')
  
  // Regex for different import types
  const importRegex = /^import\s+(?:type\s+)?(?:(\{[^}]+\})|(\*\s+as\s+\w+)|(\w+))?\s*,?\s*(?:(\{[^}]+\})|(\w+))?\s*from\s+['"]([^'"]+)['"]/
  const sideEffectRegex = /^import\s+['"]([^'"]+)['"]/
  
  lines.forEach((line, index) => {
    const trimmed = line.trim()
    
    // Side effect import
    const sideEffectMatch = trimmed.match(sideEffectRegex)
    if (sideEffectMatch && !trimmed.includes('from')) {
      imports.push({
        id: `import-${index}`,
        raw: trimmed,
        type: 'side-effect',
        source: sideEffectMatch[1],
        specifiers: [],
        isTypeOnly: false,
        line: index + 1,
        isUsed: true, // Side effects are always considered used
        category: categorizeImport(sideEffectMatch[1])
      })
      return
    }
    
    const match = trimmed.match(importRegex)
    if (match) {
      const [, namedImports1, namespaceImport, defaultImport, namedImports2, defaultImport2, source] = match
      const specifiers: string[] = []
      let type: ImportStatement['type'] = 'named'
      
      // Parse specifiers
      if (defaultImport || defaultImport2) {
        specifiers.push(defaultImport || defaultImport2)
        type = 'default'
      }
      
      if (namespaceImport) {
        specifiers.push(namespaceImport.replace('* as ', ''))
        type = 'namespace'
      }
      
      const namedImports = namedImports1 || namedImports2
      if (namedImports) {
        const names = namedImports
          .replace(/[{}]/g, '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
        specifiers.push(...names)
        if (!defaultImport && !namespaceImport) {
          type = 'named'
        }
      }
      
      const isTypeOnly = trimmed.startsWith('import type')
      
      imports.push({
        id: `import-${index}`,
        raw: trimmed,
        type: isTypeOnly ? 'type' : type,
        source,
        specifiers,
        isTypeOnly,
        line: index + 1,
        isUsed: true, // Will be updated by usage check
        category: isTypeOnly ? 'type' : categorizeImport(source)
      })
    }
  })
  
  return imports
}

// Categorize import by source
function categorizeImport(source: string): ImportStatement['category'] {
  // Node.js built-ins
  const builtins = ['fs', 'path', 'http', 'https', 'url', 'util', 'crypto', 'os', 'stream', 'events', 'buffer', 'child_process', 'cluster', 'dgram', 'dns', 'net', 'readline', 'tls', 'zlib']
  if (builtins.some(b => source === b || source.startsWith(`node:${b}`))) {
    return 'builtin'
  }
  
  // Relative imports
  if (source.startsWith('.') || source.startsWith('/')) {
    return 'relative'
  }
  
  // Internal/aliased imports (e.g., @/components)
  if (source.startsWith('@/') || source.startsWith('~')) {
    return 'internal'
  }
  
  // External packages
  return 'external'
}

// Check if imports are used in code
function checkUsage(imports: ImportStatement[], code: string): ImportStatement[] {
  // Get code without imports
  const codeWithoutImports = code
    .split('\n')
    .filter(line => !line.trim().startsWith('import'))
    .join('\n')
  
  return imports.map(imp => {
    if (imp.type === 'side-effect') {
      return { ...imp, isUsed: true }
    }
    
    // Check if any specifier is used
    const isUsed = imp.specifiers.some(spec => {
      // Handle aliased imports (e.g., "foo as bar")
      const name = spec.includes(' as ') ? spec.split(' as ')[1].trim() : spec.trim()
      // Check for word boundary usage
      const regex = new RegExp(`\\b${name}\\b`)
      return regex.test(codeWithoutImports)
    })
    
    return { ...imp, isUsed }
  })
}

// Sort imports by category and alphabetically
function sortImports(imports: ImportStatement[]): ImportStatement[] {
  const order: Record<ImportStatement['category'], number> = {
    builtin: 0,
    external: 1,
    internal: 2,
    relative: 3,
    type: 4
  }
  
  return [...imports].sort((a, b) => {
    // First by category
    const catDiff = order[a.category] - order[b.category]
    if (catDiff !== 0) return catDiff
    
    // Then alphabetically by source
    return a.source.localeCompare(b.source)
  })
}

// Generate organized import statements
function generateOrganizedImports(imports: ImportStatement[]): string {
  const sorted = sortImports(imports)
  const lines: string[] = []
  let currentCategory: ImportStatement['category'] | null = null
  
  sorted.forEach(imp => {
    // Add blank line between categories
    if (currentCategory !== null && currentCategory !== imp.category) {
      lines.push('')
    }
    currentCategory = imp.category
    
    // Generate import statement
    if (imp.type === 'side-effect') {
      lines.push(`import '${imp.source}'`)
    } else if (imp.type === 'namespace') {
      lines.push(`import * as ${imp.specifiers[0]} from '${imp.source}'`)
    } else if (imp.type === 'type') {
      if (imp.specifiers.length === 1 && !imp.raw.includes('{')) {
        lines.push(`import type ${imp.specifiers[0]} from '${imp.source}'`)
      } else {
        lines.push(`import type { ${imp.specifiers.join(', ')} } from '${imp.source}'`)
      }
    } else {
      const defaultImport = imp.type === 'default' ? imp.specifiers[0] : null
      const namedImports = imp.type === 'default' ? imp.specifiers.slice(1) : imp.specifiers
      
      let statement = 'import '
      if (imp.isTypeOnly) statement += 'type '
      
      if (defaultImport && namedImports.length > 0) {
        statement += `${defaultImport}, { ${namedImports.sort().join(', ')} }`
      } else if (defaultImport) {
        statement += defaultImport
      } else if (namedImports.length > 0) {
        statement += `{ ${namedImports.sort().join(', ')} }`
      }
      
      statement += ` from '${imp.source}'`
      lines.push(statement)
    }
  })
  
  return lines.join('\n')
}

export function ImportOrganizer({ isOpen, onClose, code, onApply }: ImportOrganizerProps) {
  const [showUnusedOnly, setShowUnusedOnly] = useState(false)
  
  // Parse and analyze imports
  const imports = useMemo(() => {
    const parsed = parseImports(code)
    return checkUsage(parsed, code)
  }, [code])
  
  // Get unused imports
  const unusedImports = useMemo(() => 
    imports.filter(imp => !imp.isUsed),
  [imports])
  
  // Get organized preview
  const organizedPreview = useMemo(() => {
    const usedImports = imports.filter(imp => imp.isUsed)
    return generateOrganizedImports(usedImports)
  }, [imports])
  
  // Get original imports section
  const originalImports = useMemo(() => {
    return imports.map(imp => imp.raw).join('\n')
  }, [imports])
  
  // Apply changes
  const handleApply = useCallback(() => {
    // Get code without imports
    const lines = code.split('\n')
    const nonImportLines = lines.filter(line => !line.trim().startsWith('import'))
    
    // Find first non-empty, non-import line
    let insertIndex = 0
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].trim().startsWith('import') && lines[i].trim() !== '') {
        insertIndex = i
        break
      }
    }
    
    // Combine organized imports with rest of code
    const organizedCode = organizedPreview + '\n\n' + nonImportLines.filter(l => l.trim()).join('\n')
    onApply(organizedCode)
    onClose()
  }, [code, organizedPreview, onApply, onClose])
  
  // Remove single import
  const removeImport = useCallback((id: string) => {
    // This would need state management to actually remove
    // For now, just show the preview without it
  }, [])
  
  // Filter displayed imports
  const displayedImports = showUnusedOnly ? unusedImports : imports
  
  // Group imports by category for display
  const groupedImports = useMemo(() => {
    const groups: Record<string, ImportStatement[]> = {
      builtin: [],
      external: [],
      internal: [],
      relative: [],
      type: []
    }
    
    displayedImports.forEach(imp => {
      groups[imp.category].push(imp)
    })
    
    return groups
  }, [displayedImports])

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e1e1e] border-[#3c3c3c] text-[#cccccc] max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-[#cccccc]">
            <Package className="h-5 w-5 text-blue-400" />
            Import Organizer
          </DialogTitle>
        </DialogHeader>

        {/* Stats */}
        <div className="flex items-center gap-4 pb-3 border-b border-[#3c3c3c] text-[11px]">
          <span>{imports.length} total imports</span>
          {unusedImports.length > 0 && (
            <span className="text-yellow-400">
              <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
              {unusedImports.length} unused
            </span>
          )}
          <Button
            size="sm"
            variant={showUnusedOnly ? "default" : "ghost"}
            className="h-6 text-[10px] ml-auto"
            onClick={() => setShowUnusedOnly(!showUnusedOnly)}
          >
            Show Unused Only
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex gap-4">
          {/* Current Imports */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="text-[11px] font-medium text-[#6e6e6e] mb-2">Current Imports</div>
            <div className="flex-1 overflow-y-auto bg-[#1a1a1a] rounded p-2 space-y-3">
              {Object.entries(groupedImports).map(([category, categoryImports]) => {
                if (categoryImports.length === 0) return null
                
                return (
                  <div key={category}>
                    <div className="text-[10px] text-[#6e6e6e] uppercase tracking-wider mb-1">
                      {category === 'builtin' && 'Node.js Built-ins'}
                      {category === 'external' && 'External Packages'}
                      {category === 'internal' && 'Internal Modules'}
                      {category === 'relative' && 'Relative Imports'}
                      {category === 'type' && 'Type Imports'}
                    </div>
                    {categoryImports.map(imp => (
                      <div
                        key={imp.id}
                        className={cn(
                          "group flex items-start gap-2 p-1.5 rounded text-[11px] font-mono",
                          !imp.isUsed && "bg-yellow-400/10 border border-yellow-400/30"
                        )}
                      >
                        <FileCode className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-[#6e6e6e]" />
                        <div className="flex-1 min-w-0">
                          <div className="truncate" title={imp.raw}>
                            {imp.raw}
                          </div>
                          {!imp.isUsed && (
                            <div className="text-[10px] text-yellow-400 mt-0.5">
                              Unused import
                            </div>
                          )}
                        </div>
                        {!imp.isUsed && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-3 w-3 text-red-400" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )
              })}
              
              {displayedImports.length === 0 && (
                <div className="text-center py-8 text-[#6e6e6e]">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-[11px]">
                    {showUnusedOnly ? 'No unused imports' : 'No imports found'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center">
            <ArrowUpDown className="h-6 w-6 text-[#6e6e6e] rotate-90" />
          </div>

          {/* Organized Preview */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="text-[11px] font-medium text-[#6e6e6e] mb-2">Organized Preview</div>
            <div className="flex-1 overflow-y-auto bg-[#1a1a1a] rounded p-2">
              <pre className="text-[11px] font-mono whitespace-pre-wrap text-green-400">
                {organizedPreview}
              </pre>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-[#3c3c3c]">
          <div className="text-[10px] text-[#6e6e6e] flex-1">
            {unusedImports.length > 0 
              ? `${unusedImports.length} unused import${unusedImports.length === 1 ? '' : 's'} will be removed`
              : 'Imports will be sorted and grouped'
            }
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[11px]"
            onClick={() => {
              navigator.clipboard.writeText(organizedPreview)
            }}
          >
            <Copy className="h-3.5 w-3.5 mr-1" />
            Copy
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[11px]"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
          
          <Button
            size="sm"
            className="h-7 text-[11px] bg-blue-600 hover:bg-blue-700"
            onClick={handleApply}
          >
            <Wand2 className="h-3.5 w-3.5 mr-1" />
            Apply Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { parseImports, checkUsage, sortImports, generateOrganizedImports }
