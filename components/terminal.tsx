'use client'

import React from "react"

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

import { FileSystemState, FileNode, getNodePath, findNodeByPath } from '@/lib/file-system'

interface TerminalProps {
  onClear: () => void
  fileSystem: FileSystemState
  onUpdateFileSystem: (fs: FileSystemState) => void
}

interface TerminalLine {
  type: 'command' | 'output' | 'error'
  content: string
}

export function Terminal({ onClear, fileSystem, onUpdateFileSystem }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'output', content: 'Welcome to Volt Terminal v1.0' },
    { type: 'output', content: 'Type "help" for available commands' },
    { type: 'output', content: '' },
  ])
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [currentCommand, setCurrentCommand] = useState('')
  const [currentDir, setCurrentDir] = useState('root')
  const [currentNodeId, setCurrentNodeId] = useState('root') // Declare currentNodeId

  const setFileSystem = (fs: FileSystemState) => {
    onUpdateFileSystem(fs)
  }

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [lines])

  const executeCommand = (command: string) => {
    const parts = command.trim().split(' ')
    const cmd = parts[0]
    const args = parts.slice(1)
    
    const currentPath = getNodePath(fileSystem.nodes, currentNodeId)
    setLines(prev => [...prev, { type: 'command', content: `${currentPath} $ ${command}` }])

    let output = ''
    const currentNode = fileSystem.nodes[currentNodeId]

    switch (cmd) {
      case 'help':
        output = `Available commands:
  ls              - List files and directories
  cd <dir>        - Change directory  
  pwd             - Print working directory
  cat <file>      - Display file contents
  tree            - Show directory tree
  echo <text>     - Print text
  mkdir <dir>     - Create directory
  touch <file>    - Create file
  rm <file/dir>   - Remove file or directory
  clear           - Clear terminal
  date            - Show current date/time
  whoami          - Display current user
  history         - Show command history
  help            - Show this help message`
        break

      case 'ls':
        if (currentNode?.type === 'folder' && currentNode.children) {
          const items = currentNode.children
            .map(childId => {
              const child = fileSystem.nodes[childId]
              return child ? (child.type === 'folder' ? child.name + '/' : child.name) : ''
            })
            .filter(Boolean)
          output = items.length > 0 ? items.join('  ') : 'Directory is empty'
        } else {
          output = 'Not a directory'
        }
        break

      case 'pwd':
        output = currentPath
        break

      case 'cd':
        if (!args[0] || args[0] === '~') {
          setCurrentNodeId('root')
          output = ''
        } else if (args[0] === '..') {
          if (currentNode?.parentId) {
            setCurrentNodeId(currentNode.parentId)
          }
          output = ''
        } else {
          if (currentNode?.type === 'folder' && currentNode.children) {
            const childId = currentNode.children.find(id => 
              fileSystem.nodes[id]?.name === args[0]
            )
            const child = childId ? fileSystem.nodes[childId] : null
            if (child && child.type === 'folder') {
              setCurrentNodeId(childId!)
              output = ''
            } else {
              output = `cd: ${args[0]}: No such directory`
            }
          } else {
            output = 'Not in a directory'
          }
        }
        break

      case 'cat':
        if (!args[0]) {
          output = 'cat: missing file operand'
        } else if (currentNode?.type === 'folder' && currentNode.children) {
          const fileId = currentNode.children.find(id => fileSystem.nodes[id]?.name === args[0])
          const file = fileId ? fileSystem.nodes[fileId] : null
          if (file && file.type === 'file') {
            output = file.content || '(empty file)'
          } else {
            output = `cat: ${args[0]}: No such file`
          }
        }
        break

      case 'tree':
        const buildTree = (nodeId: string, prefix: string = '', isLast: boolean = true): string[] => {
          const node = fileSystem.nodes[nodeId]
          if (!node) return []
          
          const lines: string[] = []
          const connector = isLast ? '└── ' : '├── '
          const icon = node.type === 'folder' ? '📁 ' : '📄 '
          
          if (nodeId !== 'root') {
            lines.push(prefix + connector + icon + node.name)
          }
          
          if (node.type === 'folder' && node.children) {
            const newPrefix = prefix + (isLast ? '    ' : '│   ')
            node.children.forEach((childId, index) => {
              const isLastChild = index === node.children!.length - 1
              lines.push(...buildTree(childId, newPrefix, isLastChild))
            })
          }
          
          return lines
        }
        
        const treeOutput = buildTree(currentNodeId)
        output = treeOutput.length > 0 ? treeOutput.join('\n') : 'Empty directory'
        break

      case 'echo':
        output = args.join(' ')
        break

      case 'mkdir':
        if (!args[0]) {
          output = 'mkdir: missing operand'
        } else if (currentNode?.type === 'folder') {
          const exists = currentNode.children?.some(id => fileSystem.nodes[id]?.name === args[0])
          if (!exists) {
            const newFolderId = `folder-${Date.now()}`
            const newFolder: FileNode = {
              id: newFolderId,
              name: args[0],
              type: 'folder',
              children: [],
              parentId: currentNodeId,
            }
            onUpdateFileSystem({
              ...fileSystem,
              nodes: {
                ...fileSystem.nodes,
                [newFolderId]: newFolder,
                [currentNodeId]: {
                  ...currentNode,
                  children: [...(currentNode.children || []), newFolderId],
                },
              },
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
        } else if (currentNode?.type === 'folder') {
          const exists = currentNode.children?.some(id => fileSystem.nodes[id]?.name === args[0])
          if (!exists) {
            const newFileId = `file-${Date.now()}`
            const extension = args[0].split('.').pop() || 'txt'
            const languageMap: Record<string, string> = {
              js: 'javascript',
              ts: 'typescript',
              py: 'python',
              java: 'java',
              cpp: 'cpp',
              c: 'c',
              rs: 'rust',
              go: 'go',
              rb: 'ruby',
              php: 'php',
            }
            const newFile: FileNode = {
              id: newFileId,
              name: args[0],
              type: 'file',
              content: '',
              language: languageMap[extension] || 'plaintext',
              parentId: currentNodeId,
            }
            onUpdateFileSystem({
              ...fileSystem,
              nodes: {
                ...fileSystem.nodes,
                [newFileId]: newFile,
                [currentNodeId]: {
                  ...currentNode,
                  children: [...(currentNode.children || []), newFileId],
                },
              },
            })
            output = ''
          }
        }
        break

      case 'rm':
        if (!args[0]) {
          output = 'rm: missing operand'
        } else if (currentNode?.type === 'folder' && currentNode.children) {
          const targetId = currentNode.children.find(id => fileSystem.nodes[id]?.name === args[0])
          if (targetId) {
            const newNodes = { ...fileSystem.nodes }
            delete newNodes[targetId]
            newNodes[currentNodeId] = {
              ...currentNode,
              children: currentNode.children.filter(id => id !== targetId),
            }
            onUpdateFileSystem({
              ...fileSystem,
              nodes: newNodes,
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
        output = 'volt-user'
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
      setLines(prev => [...prev, { type: 'output', content: output }])
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
          <span className="text-[#4ec9b0] mr-2">{getNodePath(fileSystem.nodes, currentNodeId)} $</span>
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
