'use client'

import React from "react"

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

interface TerminalProps {
  output: string
  onClear: () => void
}

export function Terminal({ output, onClear }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [currentCommand, setCurrentCommand] = useState('')

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [output])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const command = currentCommand.trim()
      if (command) {
        setHistory([...history, command])
        // Terminal commands would be processed here
        // For now, just clear the input
        setCurrentCommand('')
        setHistoryIndex(-1)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setCurrentCommand(history[newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex !== -1) {
        const newIndex = Math.min(history.length - 1, historyIndex + 1)
        if (newIndex === history.length - 1) {
          setHistoryIndex(-1)
          setCurrentCommand('')
        } else {
          setHistoryIndex(newIndex)
          setCurrentCommand(history[newIndex])
        }
      }
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d30] border-b border-[#3e3e42]">
        <span className="text-xs font-medium">Terminal</span>
        <button
          onClick={onClear}
          className="p-1 hover:bg-[#3e3e42] rounded transition-colors"
          title="Clear terminal"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div
        ref={terminalRef}
        className="flex-1 overflow-auto p-4 space-y-1"
      >
        {output ? (
          <pre className="whitespace-pre-wrap break-words">{output}</pre>
        ) : (
          <div className="text-[#808080]">Output will appear here...</div>
        )}
      </div>
      <div className="flex items-center px-4 py-2 bg-[#2d2d30] border-t border-[#3e3e42]">
        <span className="text-[#4fc3f7] mr-2">$</span>
        <input
          type="text"
          value={currentCommand}
          onChange={(e) => setCurrentCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none text-[#d4d4d4]"
          placeholder="Type a command..."
        />
      </div>
    </div>
  )
}
