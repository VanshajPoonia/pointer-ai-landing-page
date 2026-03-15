"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Play,
  Square,
  Terminal,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Star,
  StarOff,
  Search,
  Package,
  RefreshCw,
  Copy,
  History
} from 'lucide-react'

interface NpmScript {
  name: string
  command: string
  description?: string
  isFavorite: boolean
}

// Hook for managing NPM scripts state
export function useNPMScripts(packageJson?: { scripts?: Record<string, string> }) {
  const [runningScripts, setRunningScripts] = useState<Set<string>>(new Set())
  const [scriptOutputs, setScriptOutputs] = useState<Record<string, string[]>>({})

  const scripts = Object.entries(packageJson?.scripts || {}).map(([name, command]) => ({
    name,
    command
  }))

  const runScript = (name: string, onComplete?: (output: string[]) => void) => {
    setRunningScripts(prev => new Set([...prev, name]))
    setScriptOutputs(prev => ({ ...prev, [name]: [`Running npm run ${name}...`] }))
    
    // Simulate script execution
    setTimeout(() => {
      setScriptOutputs(prev => ({
        ...prev,
        [name]: [...(prev[name] || []), 'Script completed successfully.']
      }))
      setRunningScripts(prev => {
        const next = new Set(prev)
        next.delete(name)
        return next
      })
      onComplete?.(scriptOutputs[name] || [])
    }, 2000)
  }

  const stopScript = (name: string) => {
    setRunningScripts(prev => {
      const next = new Set(prev)
      next.delete(name)
      return next
    })
    setScriptOutputs(prev => ({
      ...prev,
      [name]: [...(prev[name] || []), 'Script terminated.']
    }))
  }

  return {
    scripts,
    runningScripts,
    scriptOutputs,
    runScript,
    stopScript
  }
}

interface ScriptRun {
  id: string
  scriptName: string
  startTime: Date
  endTime?: Date
  status: 'running' | 'success' | 'error'
  output: string[]
}

interface NpmScriptRunnerProps {
  isOpen: boolean
  onClose: () => void
  scripts?: { name: string; command: string }[]
  runningScripts?: Set<string>
  scriptOutputs?: Record<string, string[]>
  onRunScript?: (name: string) => void
  onStopScript?: (name: string) => void
  onAddScript?: (name: string, command: string) => void
  onRemoveScript?: (name: string) => void
}

export function NPMScriptRunner({
  isOpen,
  onClose,
  scripts: propsScripts,
  runningScripts,
  scriptOutputs,
  onRunScript,
  onStopScript,
  onAddScript,
  onRemoveScript
}: NpmScriptRunnerProps) {
  const [scripts, setScripts] = useState<NpmScript[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [localRunningScripts, setLocalRunningScripts] = useState<Record<string, ScriptRun>>({})
  const [history, setHistory] = useState<ScriptRun[]>([])
  const [expandedOutput, setExpandedOutput] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)

  // Initialize scripts from props
  useEffect(() => {
    const favorites = ['dev', 'build', 'lint', 'test']
    
    setScripts(
      propsScripts.map(({ name, command }) => ({
        name,
        command,
        description: getScriptDescription(name),
        isFavorite: favorites.includes(name)
      }))
    )
  }, [propsScripts])

  const getScriptDescription = (name: string): string => {
    const descriptions: Record<string, string> = {
      'dev': 'Start development server',
      'build': 'Build for production',
      'start': 'Start production server',
      'lint': 'Run ESLint',
      'test': 'Run tests',
      'test:watch': 'Run tests in watch mode',
      'test:coverage': 'Run tests with coverage',
      'format': 'Format code with Prettier',
      'typecheck': 'Check TypeScript types',
      'db:migrate': 'Run database migrations',
      'db:seed': 'Seed database',
      'db:studio': 'Open Prisma Studio'
    }
    return descriptions[name] || ''
  }

  const handleRunScript = (scriptName: string) => {
    const runId = Date.now().toString()
    const run: ScriptRun = {
      id: runId,
      scriptName,
      startTime: new Date(),
      status: 'running',
      output: scriptOutputs[scriptName] || []
    }

    setLocalRunningScripts(prev => ({ ...prev, [scriptName]: run }))
    setExpandedOutput(scriptName)
    onRunScript(scriptName)
  }

  const handleStopScript = (scriptName: string) => {
    setLocalRunningScripts(prev => {
      const updatedRun = {
        ...prev[scriptName],
        endTime: new Date(),
        status: 'error' as const
      }
      setHistory(h => [updatedRun, ...h].slice(0, 10))
      return { ...prev, [scriptName]: updatedRun }
    })
    onStopScript(scriptName)
  }

  // Update local running scripts when props change
  useEffect(() => {
    setLocalRunningScripts(prev => {
      const updated = { ...prev }
      // Update status based on runningScripts set
      for (const name of Object.keys(updated)) {
        if (!runningScripts.has(name) && updated[name]?.status === 'running') {
          updated[name] = {
            ...updated[name],
            endTime: new Date(),
            status: 'success',
            output: scriptOutputs[name] || updated[name].output
          }
          setHistory(h => [updated[name], ...h].slice(0, 10))
        }
      }
      return updated
    })
  }, [runningScripts, scriptOutputs])

  const toggleFavorite = (scriptName: string) => {
    setScripts(prev => prev.map(s => 
      s.name === scriptName ? { ...s, isFavorite: !s.isFavorite } : s
    ))
  }

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(`npm run ${command}`)
  }

  const filteredScripts = scripts.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.command.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const favoriteScripts = filteredScripts.filter(s => s.isFavorite)
  const otherScripts = filteredScripts.filter(s => !s.isFavorite)

  const formatDuration = (start: Date, end?: Date): string => {
    const ms = (end || new Date()).getTime() - start.getTime()
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] bg-[#1e1e1e] border-[#3c3c3c] text-[#cccccc] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-red-400" />
              <span>NPM Scripts</span>
              <Badge className="bg-[#3c3c3c] text-[#cccccc] text-xs">
                {packageJson?.name || 'project'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className={`h-8 ${showHistory ? 'bg-[#3c3c3c]' : ''} text-[#cccccc] hover:bg-[#3c3c3c]`}
              >
                <History className="h-4 w-4 mr-1" />
                History
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#808080]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search scripts..."
            className="pl-8 h-8 bg-[#3c3c3c] border-[#4c4c4c] text-[#cccccc] placeholder:text-[#808080]"
          />
        </div>

        <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
          {/* Scripts List */}
          <ScrollArea className="flex-1">
            <div className="space-y-4 pr-2">
              {/* Favorites */}
              {favoriteScripts.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-[#808080] uppercase mb-2 flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-400" />
                    Favorites
                  </h3>
                  <div className="space-y-1">
                    {favoriteScripts.map(script => (
                      <ScriptItem
                        key={script.name}
                        script={script}
                        run={localRunningScripts[script.name]}
                        isRunning={runningScripts.has(script.name)}
                        isExpanded={expandedOutput === script.name}
                        onRun={() => handleRunScript(script.name)}
                        onStop={() => handleStopScript(script.name)}
                        onToggleFavorite={() => toggleFavorite(script.name)}
                        onExpand={() => setExpandedOutput(expandedOutput === script.name ? null : script.name)}
                        onCopy={() => copyCommand(script.name)}
                        formatDuration={formatDuration}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All Scripts */}
              <div>
                <h3 className="text-xs font-medium text-[#808080] uppercase mb-2">
                  {favoriteScripts.length > 0 ? 'Other Scripts' : 'All Scripts'}
                </h3>
                <div className="space-y-1">
                  {otherScripts.map(script => (
                    <ScriptItem
                      key={script.name}
                      script={script}
                      run={localRunningScripts[script.name]}
                      isRunning={runningScripts.has(script.name)}
                      isExpanded={expandedOutput === script.name}
                      onRun={() => handleRunScript(script.name)}
                      onStop={() => handleStopScript(script.name)}
                      onToggleFavorite={() => toggleFavorite(script.name)}
                      onExpand={() => setExpandedOutput(expandedOutput === script.name ? null : script.name)}
                      onCopy={() => copyCommand(script.name)}
                      formatDuration={formatDuration}
                    />
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* History Panel */}
          {showHistory && (
            <div className="w-64 border-l border-[#3c3c3c] pl-4">
              <h3 className="text-xs font-medium text-[#808080] uppercase mb-2">Run History</h3>
              <ScrollArea className="h-full">
                <div className="space-y-2 pr-2">
                  {history.length === 0 ? (
                    <p className="text-xs text-[#808080]">No history yet</p>
                  ) : (
                    history.map(run => (
                      <div
                        key={run.id}
                        className="p-2 bg-[#252526] rounded border border-[#3c3c3c] text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[#9cdcfe]">{run.scriptName}</span>
                          {run.status === 'success' ? (
                            <CheckCircle className="h-3 w-3 text-green-400" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[#808080]">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(run.startTime, run.endTime)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Script Item Component
function ScriptItem({
  script,
  run,
  isRunning,
  isExpanded,
  onRun,
  onStop,
  onToggleFavorite,
  onExpand,
  onCopy,
  formatDuration
}: {
  script: NpmScript
  run?: ScriptRun
  isRunning: boolean
  isExpanded: boolean
  onRun: () => void
  onStop: () => void
  onToggleFavorite: () => void
  onExpand: () => void
  onCopy: () => void
  formatDuration: (start: Date, end?: Date) => string
}) {
  return (
    <div className="bg-[#252526] rounded-lg border border-[#3c3c3c] overflow-hidden">
      <div className="flex items-center gap-2 p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onExpand}
          className="h-6 w-6 p-0 text-[#808080] hover:text-[#cccccc] hover:bg-[#3c3c3c]"
        >
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#9cdcfe]">{script.name}</span>
            {isRunning && (
              <Badge className="bg-green-500/20 text-green-400 text-[10px]">
                <Loader2 className="h-2 w-2 mr-1 animate-spin" />
                Running
              </Badge>
            )}
            {run?.status === 'success' && !isRunning && (
              <CheckCircle className="h-3 w-3 text-green-400" />
            )}
            {run?.status === 'error' && !isRunning && (
              <XCircle className="h-3 w-3 text-red-400" />
            )}
          </div>
          <p className="text-xs text-[#808080] truncate">{script.command}</p>
        </div>

        <div className="flex items-center gap-1">
          {run && (
            <span className="text-[10px] text-[#808080]">
              {formatDuration(run.startTime, run.endTime)}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFavorite}
            className={`h-6 w-6 p-0 hover:bg-[#3c3c3c] ${script.isFavorite ? 'text-yellow-400' : 'text-[#808080]'}`}
          >
            {script.isFavorite ? <Star className="h-3 w-3" /> : <StarOff className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCopy}
            className="h-6 w-6 p-0 text-[#808080] hover:text-[#cccccc] hover:bg-[#3c3c3c]"
          >
            <Copy className="h-3 w-3" />
          </Button>
          {isRunning ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onStop}
              className="h-6 w-6 p-0 text-red-400 hover:bg-red-500/20"
            >
              <Square className="h-3 w-3" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRun}
              className="h-6 w-6 p-0 text-green-400 hover:bg-green-500/20"
            >
              <Play className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Output */}
      {isExpanded && run && (
        <div className="border-t border-[#3c3c3c] bg-[#1e1e1e] p-2 max-h-40 overflow-auto font-mono text-xs">
          {run.output.map((line, i) => (
            <div key={i} className={`${line.includes('error') || line.includes('Error') ? 'text-red-400' : line.includes('Warning') ? 'text-yellow-400' : 'text-[#d4d4d4]'}`}>
              {line || '\u00A0'}
            </div>
          ))}
          {isRunning && (
            <div className="flex items-center gap-1 text-[#808080]">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Running...</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
