'use client'

import { useState, useMemo } from 'react'
import { BarChart3, FileCode, ChevronDown, ChevronRight, CheckCircle, XCircle, MinusCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export interface LineCoverage {
  line: number
  hits: number // 0 = not covered, 1+ = covered (number of times hit)
  isBranch?: boolean
  branchCoverage?: {
    taken: number
    total: number
  }
}

export interface FileCoverage {
  filePath: string
  fileName: string
  lines: LineCoverage[]
  statements: { covered: number; total: number }
  branches: { covered: number; total: number }
  functions: { covered: number; total: number }
  lines_stat: { covered: number; total: number }
}

export interface CoverageReport {
  timestamp: Date
  files: FileCoverage[]
  summary: {
    statements: { covered: number; total: number; percentage: number }
    branches: { covered: number; total: number; percentage: number }
    functions: { covered: number; total: number; percentage: number }
    lines: { covered: number; total: number; percentage: number }
  }
}

interface CodeCoverageViewerProps {
  isOpen: boolean
  onClose: () => void
  report: CoverageReport | null
  currentFile?: string
  onNavigateToFile: (filePath: string, line?: number) => void
  onRunTests: () => void
  isRunning: boolean
}

// Get coverage status color
function getCoverageColor(percentage: number): string {
  if (percentage >= 80) return 'text-green-400'
  if (percentage >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

function getCoverageBgColor(percentage: number): string {
  if (percentage >= 80) return 'bg-green-400'
  if (percentage >= 50) return 'bg-yellow-400'
  return 'bg-red-400'
}

// Coverage progress bar
function CoverageBar({ covered, total, label }: { covered: number; total: number; label: string }) {
  const percentage = total > 0 ? Math.round((covered / total) * 100) : 0
  
  return (
    <div className="flex-1">
      <div className="flex items-center justify-between text-[10px] mb-1">
        <span className="text-[#6e6e6e]">{label}</span>
        <span className={getCoverageColor(percentage)}>
          {percentage}% ({covered}/{total})
        </span>
      </div>
      <div className="h-1.5 bg-[#3c3c3c] rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all", getCoverageBgColor(percentage))}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export function CodeCoverageViewer({
  isOpen,
  onClose,
  report,
  currentFile,
  onNavigateToFile,
  onRunTests,
  isRunning
}: CodeCoverageViewerProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<'name' | 'coverage'>('coverage')
  const [filterLow, setFilterLow] = useState(false)

  // Toggle file expansion
  const toggleFile = (filePath: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev)
      if (next.has(filePath)) {
        next.delete(filePath)
      } else {
        next.add(filePath)
      }
      return next
    })
  }

  // Sort and filter files
  const displayedFiles = useMemo(() => {
    if (!report) return []
    
    let files = [...report.files]
    
    // Filter low coverage
    if (filterLow) {
      files = files.filter(f => {
        const pct = f.lines_stat.total > 0 
          ? (f.lines_stat.covered / f.lines_stat.total) * 100 
          : 0
        return pct < 80
      })
    }
    
    // Sort
    files.sort((a, b) => {
      if (sortBy === 'name') {
        return a.fileName.localeCompare(b.fileName)
      }
      const aPct = a.lines_stat.total > 0 ? a.lines_stat.covered / a.lines_stat.total : 0
      const bPct = b.lines_stat.total > 0 ? b.lines_stat.covered / b.lines_stat.total : 0
      return aPct - bPct
    })
    
    return files
  }, [report, sortBy, filterLow])

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e1e1e] border-[#3c3c3c] text-[#cccccc] max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-[#cccccc]">
            <BarChart3 className="h-5 w-5 text-green-400" />
            Code Coverage
          </DialogTitle>
        </DialogHeader>

        {/* Summary */}
        {report && (
          <div className="grid grid-cols-4 gap-3 pb-3 border-b border-[#3c3c3c]">
            <CoverageBar 
              covered={report.summary.statements.covered} 
              total={report.summary.statements.total}
              label="Statements"
            />
            <CoverageBar 
              covered={report.summary.branches.covered} 
              total={report.summary.branches.total}
              label="Branches"
            />
            <CoverageBar 
              covered={report.summary.functions.covered} 
              total={report.summary.functions.total}
              label="Functions"
            />
            <CoverageBar 
              covered={report.summary.lines.covered} 
              total={report.summary.lines.total}
              label="Lines"
            />
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-2 py-2">
          <Button
            size="sm"
            variant="ghost"
            className={cn("h-7 text-[11px]", sortBy === 'coverage' && "bg-[#3c3c3c]")}
            onClick={() => setSortBy('coverage')}
          >
            Sort by Coverage
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={cn("h-7 text-[11px]", sortBy === 'name' && "bg-[#3c3c3c]")}
            onClick={() => setSortBy('name')}
          >
            Sort by Name
          </Button>
          <Button
            size="sm"
            variant={filterLow ? "default" : "ghost"}
            className="h-7 text-[11px]"
            onClick={() => setFilterLow(!filterLow)}
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
            Low Coverage Only
          </Button>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[11px]"
            onClick={onRunTests}
            disabled={isRunning}
          >
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1", isRunning && "animate-spin")} />
            Run Tests
          </Button>
        </div>

        {/* Files List */}
        <div className="flex-1 overflow-y-auto">
          {!report ? (
            <div className="text-center py-12 text-[#6e6e6e]">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-[12px]">No coverage data available</p>
              <p className="text-[11px] mt-1">Run tests to generate coverage report</p>
              <Button
                size="sm"
                className="mt-4 bg-blue-600 hover:bg-blue-700"
                onClick={onRunTests}
                disabled={isRunning}
              >
                <RefreshCw className={cn("h-3.5 w-3.5 mr-1", isRunning && "animate-spin")} />
                Run Tests with Coverage
              </Button>
            </div>
          ) : displayedFiles.length === 0 ? (
            <div className="text-center py-12 text-[#6e6e6e]">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400 opacity-50" />
              <p className="text-[12px]">
                {filterLow ? 'All files have good coverage!' : 'No files in coverage report'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {displayedFiles.map(file => {
                const linePct = file.lines_stat.total > 0 
                  ? Math.round((file.lines_stat.covered / file.lines_stat.total) * 100)
                  : 0
                const isExpanded = expandedFiles.has(file.filePath)
                const isCurrentFile = currentFile === file.filePath
                
                return (
                  <div key={file.filePath} className="border border-[#2a2a2a] rounded">
                    {/* File Header */}
                    <div
                      className={cn(
                        "flex items-center gap-2 p-2 cursor-pointer hover:bg-[#2a2a2a]",
                        isCurrentFile && "bg-blue-500/10 border-l-2 border-l-blue-500"
                      )}
                      onClick={() => toggleFile(file.filePath)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
                      )}
                      <FileCode className="h-3.5 w-3.5 flex-shrink-0 text-[#6e6e6e]" />
                      <span className="text-[12px] flex-1 truncate">{file.fileName}</span>
                      
                      {/* Coverage indicators */}
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[10px]", getCoverageColor(linePct))}>
                          {linePct}%
                        </span>
                        <div className="w-16 h-1.5 bg-[#3c3c3c] rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full", getCoverageBgColor(linePct))}
                            style={{ width: `${linePct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* File Details */}
                    {isExpanded && (
                      <div className="px-3 pb-2 bg-[#1a1a1a]">
                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-2 py-2 text-[10px]">
                          <div>
                            <span className="text-[#6e6e6e]">Statements: </span>
                            <span className={getCoverageColor(
                              file.statements.total > 0 
                                ? (file.statements.covered / file.statements.total) * 100 
                                : 0
                            )}>
                              {file.statements.covered}/{file.statements.total}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#6e6e6e]">Branches: </span>
                            <span className={getCoverageColor(
                              file.branches.total > 0 
                                ? (file.branches.covered / file.branches.total) * 100 
                                : 0
                            )}>
                              {file.branches.covered}/{file.branches.total}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#6e6e6e]">Functions: </span>
                            <span className={getCoverageColor(
                              file.functions.total > 0 
                                ? (file.functions.covered / file.functions.total) * 100 
                                : 0
                            )}>
                              {file.functions.covered}/{file.functions.total}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#6e6e6e]">Lines: </span>
                            <span className={getCoverageColor(linePct)}>
                              {file.lines_stat.covered}/{file.lines_stat.total}
                            </span>
                          </div>
                        </div>

                        {/* Uncovered Lines */}
                        {file.lines.filter(l => l.hits === 0).length > 0 && (
                          <div className="pt-2 border-t border-[#2a2a2a]">
                            <div className="text-[10px] text-[#6e6e6e] mb-1">Uncovered Lines:</div>
                            <div className="flex flex-wrap gap-1">
                              {file.lines
                                .filter(l => l.hits === 0)
                                .map(l => (
                                  <button
                                    key={l.line}
                                    className="px-1.5 py-0.5 text-[10px] bg-red-400/20 text-red-400 rounded hover:bg-red-400/30"
                                    onClick={() => onNavigateToFile(file.filePath, l.line)}
                                  >
                                    {l.line}
                                  </button>
                                ))
                              }
                            </div>
                          </div>
                        )}

                        {/* Navigate button */}
                        <div className="pt-2 mt-2 border-t border-[#2a2a2a]">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px]"
                            onClick={() => onNavigateToFile(file.filePath)}
                          >
                            Open File
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {report && (
          <div className="pt-2 border-t border-[#3c3c3c] text-[10px] text-[#6e6e6e]">
            Last updated: {report.timestamp.toLocaleString()} | {report.files.length} files
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Line coverage gutter decoration
interface CoverageGutterProps {
  lineCoverage: LineCoverage[]
  visibleLines: { start: number; end: number }
}

export function CoverageGutter({ lineCoverage, visibleLines }: CoverageGutterProps) {
  const coverageMap = useMemo(() => {
    const map = new Map<number, LineCoverage>()
    lineCoverage.forEach(lc => map.set(lc.line, lc))
    return map
  }, [lineCoverage])

  return (
    <div className="absolute left-0 top-0 w-3 h-full pointer-events-none">
      {Array.from({ length: visibleLines.end - visibleLines.start + 1 }, (_, i) => {
        const line = visibleLines.start + i
        const coverage = coverageMap.get(line)
        
        if (!coverage) return null
        
        const isCovered = coverage.hits > 0
        
        return (
          <div
            key={line}
            className={cn(
              "absolute left-0 w-3 h-[19px]",
              isCovered ? "bg-green-400/20" : "bg-red-400/20"
            )}
            style={{ top: i * 19 }}
            title={isCovered ? `Covered (${coverage.hits}x)` : 'Not covered'}
          >
            {coverage.isBranch && coverage.branchCoverage && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-yellow-400" />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Generate mock coverage data for testing
export function generateMockCoverage(code: string, filePath: string): FileCoverage {
  const lines = code.split('\n')
  const lineCoverage: LineCoverage[] = []
  
  let coveredLines = 0
  let totalLines = 0
  let coveredFunctions = 0
  let totalFunctions = 0
  let coveredBranches = 0
  let totalBranches = 0
  
  lines.forEach((line, index) => {
    const lineNum = index + 1
    const trimmed = line.trim()
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      return
    }
    
    // Check if line is code
    if (trimmed) {
      totalLines++
      const isCovered = Math.random() > 0.2 // 80% coverage simulation
      if (isCovered) coveredLines++
      
      // Check for branches (if/else, ternary)
      const hasBranch = trimmed.includes('if') || trimmed.includes('?') || trimmed.includes('else')
      let branchCoverage
      if (hasBranch) {
        totalBranches += 2
        const branchesTaken = Math.floor(Math.random() * 3)
        coveredBranches += branchesTaken
        branchCoverage = { taken: branchesTaken, total: 2 }
      }
      
      lineCoverage.push({
        line: lineNum,
        hits: isCovered ? Math.floor(Math.random() * 10) + 1 : 0,
        isBranch: hasBranch,
        branchCoverage
      })
    }
    
    // Check for functions
    if (trimmed.includes('function') || trimmed.includes('=>')) {
      totalFunctions++
      if (Math.random() > 0.15) coveredFunctions++
    }
  })
  
  return {
    filePath,
    fileName: filePath.split('/').pop() || filePath,
    lines: lineCoverage,
    statements: { covered: coveredLines, total: totalLines },
    branches: { covered: coveredBranches, total: totalBranches },
    functions: { covered: coveredFunctions, total: totalFunctions },
    lines_stat: { covered: coveredLines, total: totalLines }
  }
}

export function generateMockReport(files: { code: string; path: string }[]): CoverageReport {
  const fileCoverage = files.map(f => generateMockCoverage(f.code, f.path))
  
  const summary = {
    statements: { covered: 0, total: 0, percentage: 0 },
    branches: { covered: 0, total: 0, percentage: 0 },
    functions: { covered: 0, total: 0, percentage: 0 },
    lines: { covered: 0, total: 0, percentage: 0 }
  }
  
  fileCoverage.forEach(fc => {
    summary.statements.covered += fc.statements.covered
    summary.statements.total += fc.statements.total
    summary.branches.covered += fc.branches.covered
    summary.branches.total += fc.branches.total
    summary.functions.covered += fc.functions.covered
    summary.functions.total += fc.functions.total
    summary.lines.covered += fc.lines_stat.covered
    summary.lines.total += fc.lines_stat.total
  })
  
  summary.statements.percentage = summary.statements.total > 0 
    ? Math.round((summary.statements.covered / summary.statements.total) * 100) 
    : 0
  summary.branches.percentage = summary.branches.total > 0 
    ? Math.round((summary.branches.covered / summary.branches.total) * 100) 
    : 0
  summary.functions.percentage = summary.functions.total > 0 
    ? Math.round((summary.functions.covered / summary.functions.total) * 100) 
    : 0
  summary.lines.percentage = summary.lines.total > 0 
    ? Math.round((summary.lines.covered / summary.lines.total) * 100) 
    : 0
  
  return {
    timestamp: new Date(),
    files: fileCoverage,
    summary
  }
}
