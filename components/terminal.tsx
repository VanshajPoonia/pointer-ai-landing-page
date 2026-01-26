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
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      <div className="flex items-center justify-between h-[35px] px-4 bg-[#252526] border-b border-[#191919]">
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-semibold text-white uppercase tracking-wide">Terminal</span>
        </div>
        <button
          onClick={onClear}
          className="p-1 hover:bg-[#3e3e42] rounded transition-colors text-[#858585] hover:text-[#cccccc]"
          title="Clear terminal"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div
        ref={terminalRef}
        className="flex-1 overflow-auto px-4 py-3 bg-[#1e1e1e] font-mono"
      >
        {output ? (
          <pre className="whitespace-pre-wrap break-words text-[#cccccc] text-[13px] leading-[1.4]">{output}</pre>
        ) : (
          <div className="text-[#6a6a6a] text-[13px]">Output will appear here...</div>
        )}
      </div>
      <div className="flex items-center h-[28px] px-4 bg-[#1e1e1e] border-t border-[#333333]">
        <span className="text-[#569cd6] mr-2 font-mono text-[13px]">~$</span>
        <input
          type="text"
          value={currentCommand}
          onChange={(e) => setCurrentCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none text-[#cccccc] font-mono text-[13px] placeholder:text-[#6a6a6a]"
          placeholder=""
        />
      </div>
    </div>
  )
}
