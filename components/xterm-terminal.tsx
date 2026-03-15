'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { X, Plus, TerminalSquare, Trash2 } from 'lucide-react'
import { FileSystemState, FileNode, getNodePath, findNodeByPath } from '@/lib/file-system'
import '@xterm/xterm/css/xterm.css'

interface XTermTerminalProps {
  onClear: () => void
  fileSystem: FileSystemState
  onUpdateFileSystem: (fs: FileSystemState) => void
}

interface TabState {
  id: string
  name: string
  currentDir: string
  currentNodeId: string
  history: string[]
  historyIndex: number
}

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  underline: '\x1b[4m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
}

export function XTermTerminal({ onClear, fileSystem, onUpdateFileSystem }: XTermTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const [tabs, setTabs] = useState<TabState[]>([
    { id: '1', name: 'Terminal 1', currentDir: '~', currentNodeId: 'root', history: [], historyIndex: -1 }
  ])
  const [activeTab, setActiveTab] = useState('1')
  const [currentInput, setCurrentInput] = useState('')
  const inputBufferRef = useRef('')
  const historyIndexRef = useRef(-1)
  const currentNodeIdRef = useRef('root')
  const fileSystemRef = useRef(fileSystem)

  // Keep refs in sync
  useEffect(() => {
    fileSystemRef.current = fileSystem
  }, [fileSystem])

  const activeTabState = tabs.find(t => t.id === activeTab)!

  // Get completions for tab completion
  const getCompletions = useCallback((partial: string): string[] => {
    const currentNode = fileSystemRef.current.nodes[currentNodeIdRef.current]
    if (!currentNode || currentNode.type !== 'folder' || !currentNode.children) return []
    
    return currentNode.children
      .map(childId => {
        const child = fileSystemRef.current.nodes[childId]
        if (!child) return null
        const name = child.type === 'folder' ? child.name + '/' : child.name
        if (name.toLowerCase().startsWith(partial.toLowerCase())) {
          return name
        }
        return null
      })
      .filter(Boolean) as string[]
  }, [])

  // Execute command and return output
  const executeCommand = useCallback((command: string): string => {
    const parts = command.trim().split(/\s+/)
    const cmd = parts[0]
    const args = parts.slice(1)
    const fs = fileSystemRef.current
    const currentNode = fs.nodes[currentNodeIdRef.current]
    const currentPath = getNodePath(fs.nodes, currentNodeIdRef.current)

    switch (cmd) {
      case '':
        return ''

      case 'help':
        return `${COLORS.cyan}${COLORS.bold}
╭─────────────────────────────────────────────────────────────╮
│                    VOLT TERMINAL v3.0                       │
├─────────────────────────────────────────────────────────────┤
│  ${COLORS.yellow}FILE OPERATIONS${COLORS.cyan}                                            │
│    ls [-la]         List files                              │
│    cd <dir>         Change directory                        │
│    pwd              Print working directory                 │
│    cat <file>       Display file contents                   │
│    touch <file>     Create empty file                       │
│    mkdir <dir>      Create directory                        │
│    rm <path>        Remove file/folder                      │
│    tree             Show directory tree                     │
├─────────────────────────────────────────────────────────────┤
│  ${COLORS.yellow}SYSTEM COMMANDS${COLORS.cyan}                                           │
│    echo <text>      Print text                              │
│    date             Show current date/time                  │
│    whoami           Display current user                    │
│    clear            Clear terminal                          │
│    history          Show command history                    │
│    help             Show this help message                  │
╰─────────────────────────────────────────────────────────────╯${COLORS.reset}`

      case 'ls': {
        if (!currentNode || currentNode.type !== 'folder' || !currentNode.children) {
          return `${COLORS.red}Not a directory${COLORS.reset}`
        }
        const showAll = args.includes('-a') || args.includes('-la') || args.includes('-al')
        const showLong = args.includes('-l') || args.includes('-la') || args.includes('-al')
        
        let items = currentNode.children
          .map(childId => fs.nodes[childId])
          .filter(Boolean)
        
        if (showAll) {
          items = [{ id: '.', name: '.', type: 'folder' } as FileNode, { id: '..', name: '..', type: 'folder' } as FileNode, ...items]
        }

        if (items.length === 0) {
          return `${COLORS.dim}(empty directory)${COLORS.reset}`
        }

        if (showLong) {
          const lines = items.map(item => {
            const isDir = item.type === 'folder'
            const perms = isDir ? 'drwxr-xr-x' : '-rw-r--r--'
            const size = item.content?.length || 0
            const date = 'Mar 15 12:00'
            const name = isDir ? `${COLORS.blue}${COLORS.bold}${item.name}/${COLORS.reset}` : item.name
            return `${COLORS.gray}${perms}  1 volt volt ${String(size).padStart(5)} ${date}${COLORS.reset}  ${name}`
          })
          return lines.join('\r\n')
        } else {
          return items.map(item => {
            if (item.type === 'folder') {
              return `${COLORS.blue}${COLORS.bold}${item.name}/${COLORS.reset}`
            }
            return item.name
          }).join('  ')
        }
      }

      case 'pwd':
        return `${COLORS.green}${currentPath}${COLORS.reset}`

      case 'cd': {
        if (!args[0] || args[0] === '~') {
          currentNodeIdRef.current = 'root'
          return ''
        } else if (args[0] === '..') {
          if (currentNode?.parentId) {
            currentNodeIdRef.current = currentNode.parentId
          }
          return ''
        } else if (args[0] === '.') {
          return ''
        } else {
          const targetName = args[0].replace(/\/$/, '')
          if (currentNode?.children) {
            const targetNode = currentNode.children
              .map(childId => fs.nodes[childId])
              .find(child => child?.name === targetName && child?.type === 'folder')
            
            if (targetNode) {
              currentNodeIdRef.current = targetNode.id
              return ''
            }
          }
          return `${COLORS.red}cd: ${args[0]}: No such directory${COLORS.reset}`
        }
      }

      case 'cat': {
        if (!args[0]) {
          return `${COLORS.red}cat: missing operand${COLORS.reset}`
        }
        const fileName = args[0]
        if (currentNode?.children) {
          const file = currentNode.children
            .map(childId => fs.nodes[childId])
            .find(child => child?.name === fileName && child?.type === 'file')
          
          if (file) {
            return file.content || `${COLORS.dim}(empty file)${COLORS.reset}`
          }
        }
        return `${COLORS.red}cat: ${fileName}: No such file${COLORS.reset}`
      }

      case 'touch': {
        if (!args[0]) {
          return `${COLORS.red}touch: missing file operand${COLORS.reset}`
        }
        const newFileName = args[0]
        const newId = `file-${Date.now()}`
        const extension = newFileName.split('.').pop()?.toLowerCase() || ''
        const langMap: Record<string, string> = {
          'js': 'javascript', 'ts': 'typescript', 'py': 'python', 'html': 'html',
          'css': 'css', 'json': 'json', 'md': 'markdown', 'java': 'java',
          'cpp': 'cpp', 'c': 'c', 'go': 'go', 'rs': 'rust',
        }
        
        const newNode: FileNode = {
          id: newId,
          name: newFileName,
          type: 'file',
          content: '',
          language: langMap[extension] || 'text',
          parentId: currentNodeIdRef.current,
        }
        
        const updatedNodes = { ...fs.nodes, [newId]: newNode }
        const parent = updatedNodes[currentNodeIdRef.current]
        if (parent && parent.children) {
          updatedNodes[currentNodeIdRef.current] = {
            ...parent,
            children: [...parent.children, newId]
          }
        }
        
        onUpdateFileSystem({ ...fs, nodes: updatedNodes })
        return `${COLORS.green}Created: ${newFileName}${COLORS.reset}`
      }

      case 'mkdir': {
        if (!args[0]) {
          return `${COLORS.red}mkdir: missing operand${COLORS.reset}`
        }
        const dirName = args[0]
        const newDirId = `folder-${Date.now()}`
        
        const newDir: FileNode = {
          id: newDirId,
          name: dirName,
          type: 'folder',
          children: [],
          parentId: currentNodeIdRef.current,
        }
        
        const updatedNodes = { ...fs.nodes, [newDirId]: newDir }
        const parent = updatedNodes[currentNodeIdRef.current]
        if (parent && parent.children) {
          updatedNodes[currentNodeIdRef.current] = {
            ...parent,
            children: [...parent.children, newDirId]
          }
        }
        
        onUpdateFileSystem({ ...fs, nodes: updatedNodes })
        return `${COLORS.green}Created directory: ${dirName}${COLORS.reset}`
      }

      case 'rm': {
        if (!args[0]) {
          return `${COLORS.red}rm: missing operand${COLORS.reset}`
        }
        const targetName = args[0]
        if (currentNode?.children) {
          const targetNode = currentNode.children
            .map(childId => fs.nodes[childId])
            .find(child => child?.name === targetName)
          
          if (targetNode) {
            const updatedNodes = { ...fs.nodes }
            delete updatedNodes[targetNode.id]
            const parent = updatedNodes[currentNodeIdRef.current]
            if (parent && parent.children) {
              updatedNodes[currentNodeIdRef.current] = {
                ...parent,
                children: parent.children.filter(id => id !== targetNode.id)
              }
            }
            onUpdateFileSystem({ ...fs, nodes: updatedNodes })
            return `${COLORS.green}Removed: ${targetName}${COLORS.reset}`
          }
        }
        return `${COLORS.red}rm: ${targetName}: No such file or directory${COLORS.reset}`
      }

      case 'tree': {
        const buildTree = (nodeId: string, prefix: string = '', isLast: boolean = true): string[] => {
          const node = fs.nodes[nodeId]
          if (!node) return []
          
          const lines: string[] = []
          const connector = isLast ? '└── ' : '├── '
          const name = node.type === 'folder' ? `${COLORS.blue}${COLORS.bold}${node.name}/${COLORS.reset}` : node.name
          
          if (nodeId !== 'root') {
            lines.push(`${prefix}${connector}${name}`)
          } else {
            lines.push(`${COLORS.blue}${COLORS.bold}.${COLORS.reset}`)
          }
          
          if (node.type === 'folder' && node.children) {
            const childPrefix = nodeId === 'root' ? '' : prefix + (isLast ? '    ' : '│   ')
            node.children.forEach((childId, index) => {
              const childIsLast = index === node.children!.length - 1
              lines.push(...buildTree(childId, childPrefix, childIsLast))
            })
          }
          
          return lines
        }
        return buildTree(currentNodeIdRef.current).join('\r\n')
      }

      case 'echo':
        return args.join(' ')

      case 'date':
        return `${COLORS.cyan}${new Date().toString()}${COLORS.reset}`

      case 'whoami':
        return `${COLORS.green}volt-user${COLORS.reset}`

      case 'hostname':
        return `${COLORS.green}volt-ide${COLORS.reset}`

      case 'uname':
        if (args.includes('-a')) {
          return `${COLORS.cyan}VoltOS 3.0.0 volt-ide x86_64 GNU/Linux${COLORS.reset}`
        }
        return `${COLORS.cyan}VoltOS${COLORS.reset}`

      case 'clear':
        return '\x1b[2J\x1b[H'

      case 'history': {
        const tab = tabs.find(t => t.id === activeTab)
        if (!tab || tab.history.length === 0) {
          return `${COLORS.dim}(no history)${COLORS.reset}`
        }
        return tab.history.map((cmd, i) => `${COLORS.gray}${String(i + 1).padStart(4)}${COLORS.reset}  ${cmd}`).join('\r\n')
      }

      default:
        return `${COLORS.red}Command not found: ${cmd}${COLORS.reset}\r\nType ${COLORS.cyan}help${COLORS.reset} for available commands.`
    }
  }, [activeTab, tabs, onUpdateFileSystem])

  // Initialize xterm
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return

    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Menlo, Monaco, monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#cccccc',
        cursor: '#f59e0b',
        cursorAccent: '#1e1e1e',
        selectionBackground: '#3c3c3c',
        black: '#1e1e1e',
        red: '#f44336',
        green: '#4caf50',
        yellow: '#f59e0b',
        blue: '#2196f3',
        magenta: '#9c27b0',
        cyan: '#00bcd4',
        white: '#cccccc',
        brightBlack: '#666666',
        brightRed: '#ef5350',
        brightGreen: '#66bb6a',
        brightYellow: '#ffca28',
        brightBlue: '#42a5f5',
        brightMagenta: '#ab47bc',
        brightCyan: '#26c6da',
        brightWhite: '#ffffff',
      },
      allowProposedApi: true,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    
    term.open(terminalRef.current)
    fitAddon.fit()

    xtermRef.current = term
    fitAddonRef.current = fitAddon

    // Welcome message
    term.writeln(`${COLORS.cyan}${COLORS.bold}`)
    term.writeln('╭─────────────────────────────────────────╮')
    term.writeln('│       Welcome to Volt Terminal v3.0    │')
    term.writeln('│    Type "help" for available commands  │')
    term.writeln('╰─────────────────────────────────────────╯')
    term.writeln(`${COLORS.reset}`)
    
    // Write initial prompt
    const writePrompt = () => {
      const path = getNodePath(fileSystemRef.current.nodes, currentNodeIdRef.current)
      term.write(`\r\n${COLORS.green}${COLORS.bold}volt${COLORS.reset}:${COLORS.blue}${path}${COLORS.reset}$ `)
    }
    writePrompt()

    // Handle input
    term.onKey(({ key, domEvent }) => {
      const ev = domEvent

      if (ev.key === 'Enter') {
        const command = inputBufferRef.current.trim()
        inputBufferRef.current = ''
        term.write('\r\n')
        
        if (command) {
          // Add to history
          setTabs(prev => prev.map(tab => {
            if (tab.id === activeTab) {
              return { ...tab, history: [...tab.history, command], historyIndex: -1 }
            }
            return tab
          }))
          historyIndexRef.current = -1
          
          // Execute command
          const output = executeCommand(command)
          if (output) {
            if (output === '\x1b[2J\x1b[H') {
              term.clear()
            } else {
              term.writeln(output)
            }
          }
        }
        
        writePrompt()
      } else if (ev.key === 'Backspace') {
        if (inputBufferRef.current.length > 0) {
          inputBufferRef.current = inputBufferRef.current.slice(0, -1)
          term.write('\b \b')
        }
      } else if (ev.key === 'Tab') {
        ev.preventDefault()
        const parts = inputBufferRef.current.split(' ')
        const lastPart = parts[parts.length - 1]
        const completions = getCompletions(lastPart)
        
        if (completions.length === 1) {
          const completion = completions[0]
          const toAdd = completion.slice(lastPart.length)
          inputBufferRef.current += toAdd
          term.write(toAdd)
        } else if (completions.length > 1) {
          term.write('\r\n')
          term.writeln(completions.join('  '))
          writePrompt()
          term.write(inputBufferRef.current)
        }
      } else if (ev.key === 'ArrowUp') {
        const tab = tabs.find(t => t.id === activeTab)
        if (tab && tab.history.length > 0) {
          const newIndex = historyIndexRef.current < tab.history.length - 1 
            ? historyIndexRef.current + 1 
            : historyIndexRef.current
          historyIndexRef.current = newIndex
          
          // Clear current input
          while (inputBufferRef.current.length > 0) {
            term.write('\b \b')
            inputBufferRef.current = inputBufferRef.current.slice(0, -1)
          }
          
          // Write history command
          const historyCmd = tab.history[tab.history.length - 1 - newIndex]
          inputBufferRef.current = historyCmd
          term.write(historyCmd)
        }
      } else if (ev.key === 'ArrowDown') {
        const tab = tabs.find(t => t.id === activeTab)
        if (tab) {
          const newIndex = historyIndexRef.current > 0 ? historyIndexRef.current - 1 : -1
          historyIndexRef.current = newIndex
          
          // Clear current input
          while (inputBufferRef.current.length > 0) {
            term.write('\b \b')
            inputBufferRef.current = inputBufferRef.current.slice(0, -1)
          }
          
          if (newIndex >= 0) {
            const historyCmd = tab.history[tab.history.length - 1 - newIndex]
            inputBufferRef.current = historyCmd
            term.write(historyCmd)
          }
        }
      } else if (ev.ctrlKey && ev.key === 'c') {
        term.write('^C')
        inputBufferRef.current = ''
        writePrompt()
      } else if (ev.ctrlKey && ev.key === 'l') {
        term.clear()
        writePrompt()
      } else if (!ev.ctrlKey && !ev.altKey && !ev.metaKey && key.length === 1) {
        inputBufferRef.current += key
        term.write(key)
      }
    })

    // Handle resize
    const handleResize = () => {
      fitAddon.fit()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      term.dispose()
      xtermRef.current = null
      fitAddonRef.current = null
    }
  }, [activeTab, executeCommand, getCompletions, tabs])

  // Fit terminal on container resize
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit()
      }
    })
    
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current)
    }
    
    return () => resizeObserver.disconnect()
  }, [])

  const addTab = () => {
    const newId = String(Date.now())
    setTabs(prev => [...prev, {
      id: newId,
      name: `Terminal ${prev.length + 1}`,
      currentDir: '~',
      currentNodeId: 'root',
      history: [],
      historyIndex: -1,
    }])
    setActiveTab(newId)
  }

  const closeTab = (tabId: string) => {
    if (tabs.length === 1) return
    setTabs(prev => prev.filter(t => t.id !== tabId))
    if (activeTab === tabId) {
      setActiveTab(tabs[0].id === tabId ? tabs[1].id : tabs[0].id)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      {/* Tab bar */}
      <div className="flex items-center bg-[#252526] border-b border-[#3c3c3c] px-2 h-9 shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer rounded-t transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#1e1e1e] text-white'
                  : 'text-[#808080] hover:text-white hover:bg-[#2d2d2d]'
              }`}
            >
              <TerminalSquare className="h-3.5 w-3.5" />
              <span>{tab.name}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                  className="hover:bg-[#3c3c3c] rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addTab}
          className="ml-2 p-1 hover:bg-[#3c3c3c] rounded text-[#808080] hover:text-white transition-colors"
          title="New Terminal"
        >
          <Plus className="h-4 w-4" />
        </button>
        <div className="flex-1" />
        <button
          onClick={onClear}
          className="p-1 hover:bg-[#3c3c3c] rounded text-[#808080] hover:text-white transition-colors"
          title="Clear Terminal"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Terminal container */}
      <div 
        ref={terminalRef} 
        className="flex-1 p-2 overflow-hidden"
        style={{ minHeight: 0 }}
      />
    </div>
  )
}
