'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronRight, FileCode, FolderOpen, Hash, Braces, Type, Variable, Code2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Symbol types for breadcrumb navigation
export type SymbolType = 'file' | 'folder' | 'class' | 'function' | 'method' | 'interface' | 'type' | 'variable' | 'namespace'

export interface BreadcrumbSymbol {
  name: string
  type: SymbolType
  line?: number
  children?: BreadcrumbSymbol[]
}

interface BreadcrumbNavigationProps {
  filePath: string
  code: string
  cursorLine?: number
  onNavigate?: (symbol: BreadcrumbSymbol) => void
  className?: string
}

// Get icon for symbol type
function getSymbolIcon(type: SymbolType) {
  switch (type) {
    case 'file':
      return <FileCode className="h-3.5 w-3.5" />
    case 'folder':
      return <FolderOpen className="h-3.5 w-3.5" />
    case 'class':
      return <Code2 className="h-3.5 w-3.5 text-orange-400" />
    case 'function':
    case 'method':
      return <Braces className="h-3.5 w-3.5 text-purple-400" />
    case 'interface':
      return <Type className="h-3.5 w-3.5 text-blue-400" />
    case 'type':
      return <Hash className="h-3.5 w-3.5 text-cyan-400" />
    case 'variable':
      return <Variable className="h-3.5 w-3.5 text-green-400" />
    case 'namespace':
      return <FolderOpen className="h-3.5 w-3.5 text-yellow-400" />
    default:
      return <FileCode className="h-3.5 w-3.5" />
  }
}

// Parse code to extract symbol hierarchy
function parseSymbolHierarchy(code: string): BreadcrumbSymbol[] {
  const symbols: BreadcrumbSymbol[] = []
  const lines = code.split('\n')
  
  // Track current scope
  let currentClass: BreadcrumbSymbol | null = null
  let braceDepth = 0
  let classStartDepth = -1

  lines.forEach((line, index) => {
    const lineNum = index + 1
    
    // Count braces
    const openBraces = (line.match(/{/g) || []).length
    const closeBraces = (line.match(/}/g) || []).length
    
    // Check for class/interface end
    if (currentClass && braceDepth <= classStartDepth && closeBraces > 0) {
      currentClass = null
      classStartDepth = -1
    }
    
    braceDepth += openBraces - closeBraces

    // Match class declarations
    const classMatch = line.match(/(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/)
    if (classMatch) {
      currentClass = {
        name: classMatch[1],
        type: 'class',
        line: lineNum,
        children: []
      }
      symbols.push(currentClass)
      classStartDepth = braceDepth - openBraces
      return
    }

    // Match interface declarations
    const interfaceMatch = line.match(/(?:export\s+)?interface\s+(\w+)/)
    if (interfaceMatch) {
      currentClass = {
        name: interfaceMatch[1],
        type: 'interface',
        line: lineNum,
        children: []
      }
      symbols.push(currentClass)
      classStartDepth = braceDepth - openBraces
      return
    }

    // Match type declarations
    const typeMatch = line.match(/(?:export\s+)?type\s+(\w+)/)
    if (typeMatch) {
      symbols.push({
        name: typeMatch[1],
        type: 'type',
        line: lineNum
      })
      return
    }

    // Match function declarations (standalone)
    const funcMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/)
    if (funcMatch && !currentClass) {
      symbols.push({
        name: funcMatch[1],
        type: 'function',
        line: lineNum
      })
      return
    }

    // Match arrow functions (const name = () => or const name = async () =>)
    const arrowMatch = line.match(/(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*(?::\s*\w+)?\s*=>/)
    if (arrowMatch && !currentClass) {
      symbols.push({
        name: arrowMatch[1],
        type: 'function',
        line: lineNum
      })
      return
    }

    // Match methods inside class
    if (currentClass) {
      const methodMatch = line.match(/^\s*(?:public\s+|private\s+|protected\s+)?(?:static\s+)?(?:async\s+)?(\w+)\s*\([^)]*\)/)
      if (methodMatch && !['if', 'for', 'while', 'switch', 'catch'].includes(methodMatch[1])) {
        currentClass.children?.push({
          name: methodMatch[1],
          type: 'method',
          line: lineNum
        })
      }
    }
  })

  return symbols
}

// Find the current symbol based on cursor position
function findCurrentSymbol(symbols: BreadcrumbSymbol[], cursorLine: number): BreadcrumbSymbol[] {
  const path: BreadcrumbSymbol[] = []
  
  // Find containing symbol
  let bestMatch: BreadcrumbSymbol | null = null
  let bestChildMatch: BreadcrumbSymbol | null = null

  for (const symbol of symbols) {
    if (symbol.line && symbol.line <= cursorLine) {
      if (!bestMatch || symbol.line > bestMatch.line!) {
        bestMatch = symbol
        bestChildMatch = null
        
        // Check children
        if (symbol.children) {
          for (const child of symbol.children) {
            if (child.line && child.line <= cursorLine) {
              if (!bestChildMatch || child.line > bestChildMatch.line!) {
                bestChildMatch = child
              }
            }
          }
        }
      }
    }
  }

  if (bestMatch) {
    path.push(bestMatch)
    if (bestChildMatch) {
      path.push(bestChildMatch)
    }
  }

  return path
}

export function BreadcrumbNavigation({
  filePath,
  code,
  cursorLine = 1,
  onNavigate,
  className
}: BreadcrumbNavigationProps) {
  const [symbols, setSymbols] = useState<BreadcrumbSymbol[]>([])
  
  // Parse symbols when code changes
  useEffect(() => {
    const parsed = parseSymbolHierarchy(code)
    setSymbols(parsed)
  }, [code])

  // Build breadcrumb path
  const breadcrumbPath = useMemo(() => {
    const path: BreadcrumbSymbol[] = []
    
    // Add file path segments
    const pathParts = filePath.split('/')
    pathParts.forEach((part, index) => {
      if (part) {
        path.push({
          name: part,
          type: index === pathParts.length - 1 ? 'file' : 'folder'
        })
      }
    })

    // Add symbol path based on cursor position
    const symbolPath = findCurrentSymbol(symbols, cursorLine)
    path.push(...symbolPath)

    return path
  }, [filePath, symbols, cursorLine])

  // Get siblings for dropdown
  const getSiblings = (index: number): BreadcrumbSymbol[] => {
    const item = breadcrumbPath[index]
    
    // For file path items, return empty (could enhance with file tree)
    if (item.type === 'folder' || item.type === 'file') {
      return []
    }

    // For symbols, return all top-level symbols or children
    if (index === breadcrumbPath.length - 1) {
      // Last item - check if it's a child
      const parent = breadcrumbPath[index - 1]
      if (parent?.children) {
        return parent.children
      }
    }

    // Return all top-level symbols
    return symbols
  }

  return (
    <div className={cn(
      "flex items-center h-[22px] px-2 text-[11px] bg-[#252526] border-b border-[#3c3c3c] overflow-x-auto",
      className
    )}>
      {breadcrumbPath.map((item, index) => (
        <div key={`${item.name}-${index}`} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="h-3 w-3 mx-0.5 text-[#6e6e6e] flex-shrink-0" />
          )}
          
          {getSiblings(index).length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-1 py-0.5 rounded hover:bg-[#3c3c3c] text-[#cccccc]">
                  {getSymbolIcon(item.type)}
                  <span className="truncate max-w-[150px]">{item.name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="bg-[#252526] border-[#3c3c3c] max-h-[300px] overflow-y-auto"
              >
                {getSiblings(index).map((sibling, i) => (
                  <DropdownMenuItem
                    key={`${sibling.name}-${i}`}
                    onClick={() => onNavigate?.(sibling)}
                    className="flex items-center gap-2 text-[11px] text-[#cccccc] hover:bg-[#3c3c3c] cursor-pointer"
                  >
                    {getSymbolIcon(sibling.type)}
                    <span>{sibling.name}</span>
                    {sibling.line && (
                      <span className="ml-auto text-[#6e6e6e]">:{sibling.line}</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button 
              onClick={() => onNavigate?.(item)}
              className="flex items-center gap-1 px-1 py-0.5 rounded hover:bg-[#3c3c3c] text-[#cccccc]"
            >
              {getSymbolIcon(item.type)}
              <span className="truncate max-w-[150px]">{item.name}</span>
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

export { parseSymbolHierarchy, findCurrentSymbol }
