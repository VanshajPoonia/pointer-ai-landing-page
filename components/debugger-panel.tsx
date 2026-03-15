"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Pause, 
  StepInto, 
  StepOver, 
  StepOut, 
  RotateCcw,
  Circle,
  CircleDot,
  ChevronRight,
  ChevronDown,
  Terminal,
  Variable,
  Layers,
  X,
  Plus,
  Trash2,
  Send
} from 'lucide-react'

// Types
export interface Breakpoint {
  id: string
  fileId: string
  fileName: string
  line: number
  enabled: boolean
  condition?: string
  hitCount?: number
}

export interface StackFrame {
  id: string
  name: string
  file: string
  line: number
  column: number
  isAsync?: boolean
}

export interface DebugVariable {
  name: string
  value: string
  type: string
  children?: DebugVariable[]
  expandable?: boolean
}

export interface DebugConsoleEntry {
  id: string
  type: 'input' | 'output' | 'error' | 'info' | 'warn'
  content: string
  timestamp: Date
}

interface DebuggerPanelProps {
  breakpoints: Breakpoint[]
  onAddBreakpoint: (fileId: string, fileName: string, line: number) => void
  onRemoveBreakpoint: (id: string) => void
  onToggleBreakpoint: (id: string) => void
  onClearBreakpoints: () => void
  onNavigateToBreakpoint: (breakpoint: Breakpoint) => void
  isDebugging: boolean
  isPaused: boolean
  onStartDebugging: () => void
  onStopDebugging: () => void
  onContinue: () => void
  onStepOver: () => void
  onStepInto: () => void
  onStepOut: () => void
  callStack: StackFrame[]
  variables: DebugVariable[]
  onStackFrameSelect: (frame: StackFrame) => void
  currentFrame?: StackFrame
}

export function DebuggerPanel({
  breakpoints,
  onAddBreakpoint,
  onRemoveBreakpoint,
  onToggleBreakpoint,
  onClearBreakpoints,
  onNavigateToBreakpoint,
  isDebugging,
  isPaused,
  onStartDebugging,
  onStopDebugging,
  onContinue,
  onStepOver,
  onStepInto,
  onStepOut,
  callStack,
  variables,
  onStackFrameSelect,
  currentFrame
}: DebuggerPanelProps) {
  const [activeTab, setActiveTab] = useState<'breakpoints' | 'variables' | 'callstack' | 'console'>('breakpoints')
  const [consoleInput, setConsoleInput] = useState('')
  const [consoleHistory, setConsoleHistory] = useState<DebugConsoleEntry[]>([])
  const [expandedVars, setExpandedVars] = useState<Set<string>>(new Set())
  const consoleEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [consoleHistory])

  const toggleVarExpand = (name: string) => {
    setExpandedVars(prev => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  const executeConsoleCommand = () => {
    if (!consoleInput.trim()) return

    const input: DebugConsoleEntry = {
      id: Date.now().toString(),
      type: 'input',
      content: consoleInput,
      timestamp: new Date()
    }

    // Simulate evaluation
    let output: DebugConsoleEntry
    try {
      // Mock evaluation
      if (consoleInput.includes('error')) {
        output = {
          id: (Date.now() + 1).toString(),
          type: 'error',
          content: 'ReferenceError: error is not defined',
          timestamp: new Date()
        }
      } else if (consoleInput.startsWith('console.')) {
        output = {
          id: (Date.now() + 1).toString(),
          type: 'info',
          content: 'undefined',
          timestamp: new Date()
        }
      } else {
        output = {
          id: (Date.now() + 1).toString(),
          type: 'output',
          content: `=> ${JSON.stringify(eval(consoleInput))}`,
          timestamp: new Date()
        }
      }
    } catch (e: any) {
      output = {
        id: (Date.now() + 1).toString(),
        type: 'output',
        content: `=> "${consoleInput}"`,
        timestamp: new Date()
      }
    }

    setConsoleHistory(prev => [...prev, input, output])
    setConsoleInput('')
  }

  const renderVariable = (variable: DebugVariable, depth = 0) => {
    const isExpanded = expandedVars.has(variable.name)
    const paddingLeft = depth * 16

    return (
      <div key={variable.name}>
        <div
          className="flex items-center gap-2 py-1 px-2 hover:bg-[#2d2d2d] cursor-pointer text-xs"
          style={{ paddingLeft: paddingLeft + 8 }}
          onClick={() => variable.expandable && toggleVarExpand(variable.name)}
        >
          {variable.expandable ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3 text-[#888888]" />
            ) : (
              <ChevronRight className="h-3 w-3 text-[#888888]" />
            )
          ) : (
            <span className="w-3" />
          )}
          <span className="text-blue-400">{variable.name}</span>
          <span className="text-[#888888]">:</span>
          <span className="text-[#ce9178] truncate">{variable.value}</span>
          <span className="text-[#4ec9b0] ml-auto">{variable.type}</span>
        </div>
        {variable.expandable && isExpanded && variable.children?.map(child =>
          renderVariable(child, depth + 1)
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] border-l border-[#3c3c3c]">
      {/* Debug Controls */}
      <div className="flex items-center gap-1 p-2 border-b border-[#3c3c3c]">
        {!isDebugging ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={onStartDebugging}
            className="h-7 px-2 text-green-400 hover:bg-green-500/10"
          >
            <Play className="h-4 w-4" />
          </Button>
        ) : (
          <>
            {isPaused ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={onContinue}
                className="h-7 px-2 text-green-400 hover:bg-green-500/10"
                title="Continue (F5)"
              >
                <Play className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {}}
                className="h-7 px-2 text-yellow-400 hover:bg-yellow-500/10"
                title="Pause"
              >
                <Pause className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={onStopDebugging}
              className="h-7 px-2 text-red-400 hover:bg-red-500/10"
              title="Stop"
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="w-px h-4 bg-[#3c3c3c] mx-1" />
            <Button
              size="sm"
              variant="ghost"
              onClick={onStepOver}
              disabled={!isPaused}
              className="h-7 px-2 hover:bg-[#3c3c3c]"
              title="Step Over (F10)"
            >
              <StepOver className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onStepInto}
              disabled={!isPaused}
              className="h-7 px-2 hover:bg-[#3c3c3c]"
              title="Step Into (F11)"
            >
              <StepInto className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onStepOut}
              disabled={!isPaused}
              className="h-7 px-2 hover:bg-[#3c3c3c]"
              title="Step Out (Shift+F11)"
            >
              <StepOut className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onStartDebugging}
              className="h-7 px-2 hover:bg-[#3c3c3c]"
              title="Restart"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#3c3c3c]">
        {[
          { id: 'breakpoints', icon: CircleDot, label: 'Breakpoints' },
          { id: 'variables', icon: Variable, label: 'Variables' },
          { id: 'callstack', icon: Layers, label: 'Call Stack' },
          { id: 'console', icon: Terminal, label: 'Console' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs ${
              activeTab === tab.id
                ? 'text-[#cccccc] border-b-2 border-blue-400 -mb-px'
                : 'text-[#888888] hover:text-[#cccccc]'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            {tab.id === 'breakpoints' && breakpoints.length > 0 && (
              <Badge variant="outline" className="ml-1 h-4 px-1 text-[9px]">
                {breakpoints.length}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <ScrollArea className="flex-1">
        {activeTab === 'breakpoints' && (
          <div className="p-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#888888]">
                {breakpoints.length} breakpoint{breakpoints.length !== 1 ? 's' : ''}
              </span>
              {breakpoints.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClearBreakpoints}
                  className="h-6 px-2 text-xs text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
            {breakpoints.length === 0 ? (
              <p className="text-xs text-[#888888] text-center py-4">
                Click in the gutter to add breakpoints
              </p>
            ) : (
              <div className="space-y-1">
                {breakpoints.map(bp => (
                  <div
                    key={bp.id}
                    className="flex items-center gap-2 p-2 hover:bg-[#2d2d2d] rounded cursor-pointer group"
                    onClick={() => onNavigateToBreakpoint(bp)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleBreakpoint(bp.id)
                      }}
                      className={`${bp.enabled ? 'text-red-500' : 'text-[#888888]'}`}
                    >
                      {bp.enabled ? (
                        <CircleDot className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#cccccc] truncate">{bp.fileName}</p>
                      <p className="text-[10px] text-[#888888]">Line {bp.line}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveBreakpoint(bp.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 text-[#888888] hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'variables' && (
          <div>
            {!isDebugging || !isPaused ? (
              <p className="text-xs text-[#888888] text-center py-4">
                {isDebugging ? 'Resume to see variables' : 'Start debugging to inspect variables'}
              </p>
            ) : variables.length === 0 ? (
              <p className="text-xs text-[#888888] text-center py-4">
                No variables in current scope
              </p>
            ) : (
              variables.map(v => renderVariable(v))
            )}
          </div>
        )}

        {activeTab === 'callstack' && (
          <div className="p-2">
            {!isDebugging || !isPaused ? (
              <p className="text-xs text-[#888888] text-center py-4">
                {isDebugging ? 'Paused' : 'Start debugging to see call stack'}
              </p>
            ) : callStack.length === 0 ? (
              <p className="text-xs text-[#888888] text-center py-4">
                No call stack
              </p>
            ) : (
              <div className="space-y-0.5">
                {callStack.map((frame, i) => (
                  <div
                    key={frame.id}
                    onClick={() => onStackFrameSelect(frame)}
                    className={`p-2 rounded cursor-pointer text-xs ${
                      currentFrame?.id === frame.id
                        ? 'bg-blue-500/20 border border-blue-500/30'
                        : 'hover:bg-[#2d2d2d]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {i === 0 && <ChevronRight className="h-3 w-3 text-yellow-400" />}
                      <span className="text-[#dcdcaa]">{frame.name}</span>
                      {frame.isAsync && (
                        <Badge variant="outline" className="text-[8px] h-4 px-1">
                          async
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-[#888888] ml-5">
                      {frame.file}:{frame.line}:{frame.column}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'console' && (
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 p-2">
              {consoleHistory.map(entry => (
                <div
                  key={entry.id}
                  className={`py-1 px-2 text-xs font-mono ${
                    entry.type === 'input' ? 'text-blue-400' :
                    entry.type === 'error' ? 'text-red-400' :
                    entry.type === 'warn' ? 'text-yellow-400' :
                    entry.type === 'info' ? 'text-[#888888]' :
                    'text-[#cccccc]'
                  }`}
                >
                  {entry.type === 'input' && <span className="text-[#888888] mr-2">&gt;</span>}
                  {entry.content}
                </div>
              ))}
              <div ref={consoleEndRef} />
            </ScrollArea>
          </div>
        )}
      </ScrollArea>

      {/* Console Input */}
      {activeTab === 'console' && (
        <div className="flex items-center gap-2 p-2 border-t border-[#3c3c3c]">
          <span className="text-[#888888] text-xs">&gt;</span>
          <Input
            value={consoleInput}
            onChange={(e) => setConsoleInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && executeConsoleCommand()}
            placeholder="Evaluate expression..."
            className="flex-1 h-7 text-xs bg-transparent border-none focus-visible:ring-0 text-[#cccccc] font-mono"
            disabled={!isDebugging || !isPaused}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={executeConsoleCommand}
            disabled={!consoleInput.trim() || !isDebugging || !isPaused}
            className="h-7 px-2"
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}

// Hook for managing debugger state
export function useDebugger() {
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([])
  const [isDebugging, setIsDebugging] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [callStack, setCallStack] = useState<StackFrame[]>([])
  const [variables, setVariables] = useState<DebugVariable[]>([])
  const [currentFrame, setCurrentFrame] = useState<StackFrame | undefined>()

  const addBreakpoint = useCallback((fileId: string, fileName: string, line: number) => {
    const id = `bp-${fileId}-${line}`
    if (breakpoints.find(bp => bp.id === id)) return
    
    setBreakpoints(prev => [...prev, {
      id,
      fileId,
      fileName,
      line,
      enabled: true,
      hitCount: 0
    }])
  }, [breakpoints])

  const removeBreakpoint = useCallback((id: string) => {
    setBreakpoints(prev => prev.filter(bp => bp.id !== id))
  }, [])

  const toggleBreakpoint = useCallback((id: string) => {
    setBreakpoints(prev => prev.map(bp =>
      bp.id === id ? { ...bp, enabled: !bp.enabled } : bp
    ))
  }, [])

  const clearBreakpoints = useCallback(() => {
    setBreakpoints([])
  }, [])

  const startDebugging = useCallback(() => {
    setIsDebugging(true)
    setIsPaused(false)
    // Simulate hitting a breakpoint after a moment
    setTimeout(() => {
      if (breakpoints.length > 0) {
        setIsPaused(true)
        setCallStack([
          { id: '1', name: 'handleClick', file: 'component.tsx', line: 42, column: 5 },
          { id: '2', name: 'onClick', file: 'button.tsx', line: 15, column: 10, isAsync: true },
          { id: '3', name: 'anonymous', file: 'index.tsx', line: 8, column: 1 }
        ])
        setVariables([
          { name: 'props', value: '{...}', type: 'Object', expandable: true, children: [
            { name: 'onClick', value: 'function', type: 'Function' },
            { name: 'className', value: '"btn-primary"', type: 'string' }
          ]},
          { name: 'state', value: '{count: 5}', type: 'Object', expandable: true, children: [
            { name: 'count', value: '5', type: 'number' }
          ]},
          { name: 'event', value: 'MouseEvent', type: 'MouseEvent', expandable: true }
        ])
        setCurrentFrame({ id: '1', name: 'handleClick', file: 'component.tsx', line: 42, column: 5 })
      }
    }, 500)
  }, [breakpoints])

  const stopDebugging = useCallback(() => {
    setIsDebugging(false)
    setIsPaused(false)
    setCallStack([])
    setVariables([])
    setCurrentFrame(undefined)
  }, [])

  const continueExecution = useCallback(() => {
    setIsPaused(false)
    setTimeout(() => {
      setIsPaused(true) // Simulate hitting another breakpoint
    }, 300)
  }, [])

  const stepOver = useCallback(() => {
    // Simulate stepping
    setCurrentFrame(prev => prev ? { ...prev, line: prev.line + 1 } : prev)
  }, [])

  const stepInto = useCallback(() => {
    // Simulate stepping into
  }, [])

  const stepOut = useCallback(() => {
    // Simulate stepping out
    setCallStack(prev => prev.slice(1))
    setCurrentFrame(callStack[1])
  }, [callStack])

  return {
    breakpoints,
    addBreakpoint,
    removeBreakpoint,
    toggleBreakpoint,
    clearBreakpoints,
    isDebugging,
    isPaused,
    startDebugging,
    stopDebugging,
    continueExecution,
    stepOver,
    stepInto,
    stepOut,
    callStack,
    variables,
    currentFrame,
    setCurrentFrame
  }
}

export default DebuggerPanel
