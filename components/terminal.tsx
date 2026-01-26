'use client'

import React from "react"

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

interface TerminalProps {
  onClear: () => void
}

interface TerminalLine {
  type: 'command' | 'output' | 'error'
  content: string
}

export function Terminal({ onClear }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'output', content: 'Welcome to CodeIDE Terminal v1.0' },
    { type: 'output', content: 'Type "help" for available commands' },
    { type: 'output', content: '' },
  ])
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [currentCommand, setCurrentCommand] = useState('')
  const [currentDir, setCurrentDir] = useState('~')
  const [fileSystem, setFileSystem] = useState<Record<string, string[]>>({
    '~': ['project', 'documents', 'downloads'],
    '~/project': ['src', 'package.json', 'README.md'],
    '~/project/src': ['index.js', 'app.js', 'utils.js'],
    '~/documents': ['notes.txt', 'todo.md'],
    '~/downloads': [],
  })

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [lines])

  const executeCommand = (command: string) => {
    const parts = command.trim().split(' ')
    const cmd = parts[0]
    const args = parts.slice(1)

    setLines(prev => [...prev, { type: 'command', content: `${currentDir} $ ${command}` }])

    let output = ''

    switch (cmd) {
      case 'help':
        output = `Available commands:
  ls              - List files and directories
  cd <dir>        - Change directory
  pwd             - Print working directory
  cat <file>      - Display file contents
  echo <text>     - Print text
  mkdir <dir>     - Create directory
  touch <file>    - Create file
  rm <file>       - Remove file
  clear           - Clear terminal
  date            - Show current date/time
  whoami          - Display current user
  history         - Show command history
  help            - Show this help message`
        break

      case 'ls':
        const items = fileSystem[currentDir] || []
        output = items.length > 0 ? items.join('  ') : 'Directory is empty'
        break

      case 'pwd':
        output = currentDir
        break

      case 'cd':
        if (!args[0]) {
          setCurrentDir('~')
          output = ''
        } else if (args[0] === '..') {
          const parts = currentDir.split('/')
          parts.pop()
          setCurrentDir(parts.join('/') || '~')
          output = ''
        } else {
          const newDir = args[0].startsWith('~') ? args[0] : `${currentDir}/${args[0]}`
          if (fileSystem[newDir]) {
            setCurrentDir(newDir)
            output = ''
          } else {
            output = `cd: ${args[0]}: No such file or directory`
          }
        }
        break

      case 'cat':
        if (!args[0]) {
          output = 'cat: missing file operand'
        } else {
          const items = fileSystem[currentDir] || []
          if (items.includes(args[0])) {
            output = `Contents of ${args[0]}:\n// Sample file content\nconsole.log('Hello from ${args[0]}');`
          } else {
            output = `cat: ${args[0]}: No such file or directory`
          }
        }
        break

      case 'echo':
        output = args.join(' ')
        break

      case 'mkdir':
        if (!args[0]) {
          output = 'mkdir: missing operand'
        } else {
          const items = fileSystem[currentDir] || []
          if (!items.includes(args[0])) {
            setFileSystem({
              ...fileSystem,
              [currentDir]: [...items, args[0]],
              [`${currentDir}/${args[0]}`]: [],
            })
            output = ''
          } else {
            output = `mkdir: cannot create directory '${args[0]}': File exists`
          }
        }
        break

      case 'touch':
        if (!args[0]) {
          output = 'touch: missing file operand'
        } else {
          const items = fileSystem[currentDir] || []
          if (!items.includes(args[0])) {
            setFileSystem({
              ...fileSystem,
              [currentDir]: [...items, args[0]],
            })
            output = ''
          }
        }
        break

      case 'rm':
        if (!args[0]) {
          output = 'rm: missing operand'
        } else {
          const items = fileSystem[currentDir] || []
          if (items.includes(args[0])) {
            setFileSystem({
              ...fileSystem,
              [currentDir]: items.filter(item => item !== args[0]),
            })
            output = ''
          } else {
            output = `rm: cannot remove '${args[0]}': No such file or directory`
          }
        }
        break

      case 'clear':
        setLines([])
        return

      case 'date':
        output = new Date().toString()
        break

      case 'whoami':
        output = 'codeide-user'
        break

      case 'history':
        output = history.map((h, i) => `${i + 1}  ${h}`).join('\n')
        break

      case '':
        output = ''
        break

      default:
        output = `${cmd}: command not found. Type "help" for available commands.`
    }

    if (output) {
      setLines(prev => [...prev, { type: cmd === 'help' ? 'output' : 'output', content: output }])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const command = currentCommand.trim()
      if (command) {
        setHistory([...history, command])
        executeCommand(command)
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
        const newIndex = historyIndex + 1
        if (newIndex >= history.length) {
          setHistoryIndex(-1)
          setCurrentCommand('')
        } else {
          setHistoryIndex(newIndex)
          setCurrentCommand(history[newIndex])
        }
      }
    }
  }

  const handleClear = () => {
    setLines([])
    onClear()
  }

  return (
    <div 
      className="flex flex-col h-full bg-[#1e1e1e]"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex items-center justify-between h-[35px] px-4 bg-[#252526] border-b border-[#191919]">
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-semibold text-white uppercase tracking-wide">Terminal</span>
        </div>
        <button
          onClick={handleClear}
          className="p-1 hover:bg-[#3e3e42] rounded transition-colors text-[#858585] hover:text-[#cccccc]"
          title="Clear terminal"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div
        ref={terminalRef}
        className="flex-1 overflow-auto px-4 py-3 bg-[#1e1e1e] font-mono cursor-text"
      >
        {lines.map((line, i) => (
          <div key={i} className="text-[13px] leading-[1.6]">
            {line.type === 'command' ? (
              <div className="text-[#4ec9b0]">{line.content}</div>
            ) : line.type === 'error' ? (
              <div className="text-[#f48771]">{line.content}</div>
            ) : (
              <div className="text-[#cccccc] whitespace-pre-wrap">{line.content}</div>
            )}
          </div>
        ))}
        <div className="flex items-center mt-1">
          <span className="text-[#4ec9b0] mr-2">{currentDir} $</span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-[#cccccc] text-[13px]"
            autoFocus
          />
        </div>
      </div>
    </div>
  )
}
