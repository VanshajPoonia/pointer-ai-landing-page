'use client'

import React from "react"

import { useEffect, useRef, useState } from 'react'
import { X, Plus, TerminalSquare, Trash2 } from 'lucide-react'

import { FileSystemState, FileNode, getNodePath, findNodeByPath } from '@/lib/file-system'

interface TerminalProps {
  onClear: () => void
  fileSystem: FileSystemState
  onUpdateFileSystem: (fs: FileSystemState) => void
}

interface TerminalLine {
  type: 'command' | 'output' | 'error' | 'success' | 'info' | 'warning'
  content: string
  timestamp?: Date
}

export function Terminal({ onClear, fileSystem, onUpdateFileSystem }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'info', content: '╭─────────────────────────────────────────╮' },
    { type: 'info', content: '│     Welcome to Volt Terminal v2.0      │' },
    { type: 'info', content: '│  Type "help" for available commands    │' },
    { type: 'info', content: '╰─────────────────────────────────────────╯' },
    { type: 'output', content: '' },
  ])
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [currentCommand, setCurrentCommand] = useState('')
  const [currentDir, setCurrentDir] = useState('root')
  const [currentNodeId, setCurrentNodeId] = useState('root')
  const [tabCompletionIndex, setTabCompletionIndex] = useState(-1)
  const [envVars, setEnvVars] = useState<Record<string, string>>({
    HOME: '/root',
    USER: 'volt-user',
    SHELL: '/bin/vsh',
    TERM: 'xterm-256color',
    PATH: '/usr/local/bin:/usr/bin:/bin',
    PWD: '/root',
  })

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
        output = `╭─────────────────────────────────────────────────────────────╮
│                    VOLT TERMINAL COMMANDS                   │
├─────────────────────────────────────────────────────────────┤
│  FILE OPERATIONS                                            │
│    ls [-la]         List files (-l: details, -a: hidden)    │
│    cd <dir>         Change directory (.. for parent)        │
│    pwd              Print working directory                 │
│    cat <file>       Display file contents                   │
│    head <file>      Show first 10 lines                     │
│    tail <file>      Show last 10 lines                      │
│    wc <file>        Count lines, words, chars               │
│    cp <src> <dst>   Copy file                               │
│    mv <src> <dst>   Move/rename file                        │
│    rm [-r] <path>   Remove file (-r: recursive)             │
│    touch <file>     Create empty file                       │
│    mkdir [-p] <dir> Create directory (-p: parents)          │
│    tree             Show directory tree                     │
│    find <name>      Search for files                        │
│    grep <pat> <f>   Search pattern in file                  │
├─────────────────────────────────────────────────────────────┤
│  SYSTEM COMMANDS                                            │
│    echo <text>      Print text (supports $VAR)              │
│    env              Show environment variables              │
│    export VAR=val   Set environment variable                │
│    date             Show current date/time                  │
│    uptime           Show session uptime                     │
│    whoami           Display current user                    │
│    hostname         Display hostname                        │
│    uname [-a]       System information                      │
│    clear            Clear terminal                          │
│    history          Show command history                    │
│    !!               Repeat last command                     │
│    !<n>             Repeat command n from history           │
├─────────────────────────────────────────────────────────────┤
│  UTILITIES                                                  │
│    calc <expr>      Calculator (e.g., calc 2+2)             │
│    base64 <text>    Encode/decode base64                    │
│    time <cmd>       Measure command execution time          │
│    alias            Show/set command aliases                │
│    help             Show this help message                  │
├─────────────────────────────────────────────────────────────┤
│  GIT COMMANDS                                               │
│    git status       Show working tree status                │
│    git add <file>   Stage file for commit                   │
│    git commit -m    Commit staged changes                   │
│    git log          Show commit history                     │
│    git branch       List/create branches                    │
│    git checkout     Switch branches                         │
│    git diff         Show file differences                   │
│    git init         Initialize new repository               │
╰─────────────────────────────────────────────────────────────╯`
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
        output = envVars.USER
        break

      case 'hostname':
        output = 'volt-ide'
        break

      case 'uname':
        if (args.includes('-a')) {
          output = 'VoltOS 2.0.0 volt-ide x86_64 GNU/Linux'
        } else {
          output = 'VoltOS'
        }
        break

      case 'uptime':
        output = `Session started at ${new Date().toLocaleTimeString()}`
        break

      case 'env':
        output = Object.entries(envVars).map(([k, v]) => `${k}=${v}`).join('\n')
        break

      case 'export':
        if (args[0] && args[0].includes('=')) {
          const [key, ...valueParts] = args[0].split('=')
          const value = valueParts.join('=')
          setEnvVars(prev => ({ ...prev, [key]: value }))
          output = ''
        } else {
          output = 'export: usage: export VAR=value'
        }
        break

      case 'history':
        output = history.map((h, i) => `  ${(i + 1).toString().padStart(4)}  ${h}`).join('\n')
        break

      case '!!':
        if (history.length > 0) {
          const lastCmd = history[history.length - 1]
          executeCommand(lastCmd)
          return
        }
        output = 'No commands in history'
        break

      case 'head':
        if (!args[0]) {
          output = 'head: missing file operand'
        } else if (currentNode?.type === 'folder' && currentNode.children) {
          const fileId = currentNode.children.find(id => fileSystem.nodes[id]?.name === args[0])
          const file = fileId ? fileSystem.nodes[fileId] : null
          if (file && file.type === 'file') {
            const lines = (file.content || '').split('\n').slice(0, 10)
            output = lines.join('\n') || '(empty file)'
          } else {
            output = `head: ${args[0]}: No such file`
          }
        }
        break

      case 'tail':
        if (!args[0]) {
          output = 'tail: missing file operand'
        } else if (currentNode?.type === 'folder' && currentNode.children) {
          const fileId = currentNode.children.find(id => fileSystem.nodes[id]?.name === args[0])
          const file = fileId ? fileSystem.nodes[fileId] : null
          if (file && file.type === 'file') {
            const lines = (file.content || '').split('\n').slice(-10)
            output = lines.join('\n') || '(empty file)'
          } else {
            output = `tail: ${args[0]}: No such file`
          }
        }
        break

      case 'wc':
        if (!args[0]) {
          output = 'wc: missing file operand'
        } else if (currentNode?.type === 'folder' && currentNode.children) {
          const fileId = currentNode.children.find(id => fileSystem.nodes[id]?.name === args[0])
          const file = fileId ? fileSystem.nodes[fileId] : null
          if (file && file.type === 'file') {
            const content = file.content || ''
            const lineCount = content.split('\n').length
            const wordCount = content.split(/\s+/).filter(Boolean).length
            const charCount = content.length
            output = `  ${lineCount}  ${wordCount}  ${charCount} ${args[0]}`
          } else {
            output = `wc: ${args[0]}: No such file`
          }
        }
        break

      case 'find':
        if (!args[0]) {
          output = 'find: missing search pattern'
        } else {
          const searchResults: string[] = []
          const searchNodes = (nodeId: string, path: string) => {
            const node = fileSystem.nodes[nodeId]
            if (!node) return
            const nodePath = path + '/' + node.name
            if (node.name.includes(args[0])) {
              searchResults.push(nodePath)
            }
            if (node.type === 'folder' && node.children) {
              node.children.forEach(childId => searchNodes(childId, nodePath))
            }
          }
          const root = fileSystem.nodes['root']
          if (root?.children) {
            root.children.forEach(childId => searchNodes(childId, ''))
          }
          output = searchResults.length > 0 ? searchResults.join('\n') : 'No matches found'
        }
        break

      case 'grep':
        if (args.length < 2) {
          output = 'grep: usage: grep <pattern> <file>'
        } else if (currentNode?.type === 'folder' && currentNode.children) {
          const pattern = args[0]
          const fileId = currentNode.children.find(id => fileSystem.nodes[id]?.name === args[1])
          const file = fileId ? fileSystem.nodes[fileId] : null
          if (file && file.type === 'file') {
            const matches = (file.content || '').split('\n')
              .map((line, i) => ({ line, num: i + 1 }))
              .filter(({ line }) => line.includes(pattern))
              .map(({ line, num }) => `${num}: ${line}`)
            output = matches.length > 0 ? matches.join('\n') : 'No matches found'
          } else {
            output = `grep: ${args[1]}: No such file`
          }
        }
        break

      case 'cp':
        if (args.length < 2) {
          output = 'cp: missing destination'
        } else if (currentNode?.type === 'folder' && currentNode.children) {
          const srcId = currentNode.children.find(id => fileSystem.nodes[id]?.name === args[0])
          const srcFile = srcId ? fileSystem.nodes[srcId] : null
          if (srcFile && srcFile.type === 'file') {
            const newFileId = `file-${Date.now()}`
            const newFile: FileNode = {
              ...srcFile,
              id: newFileId,
              name: args[1],
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
          } else {
            output = `cp: ${args[0]}: No such file`
          }
        }
        break

      case 'mv':
        if (args.length < 2) {
          output = 'mv: missing destination'
        } else if (currentNode?.type === 'folder' && currentNode.children) {
          const srcId = currentNode.children.find(id => fileSystem.nodes[id]?.name === args[0])
          if (srcId) {
            const srcNode = fileSystem.nodes[srcId]
            onUpdateFileSystem({
              ...fileSystem,
              nodes: {
                ...fileSystem.nodes,
                [srcId]: { ...srcNode, name: args[1] },
              },
            })
            output = ''
          } else {
            output = `mv: ${args[0]}: No such file or directory`
          }
        }
        break

      case 'calc':
        if (!args.length) {
          output = 'calc: usage: calc <expression>'
        } else {
          try {
            const expr = args.join(' ').replace(/[^0-9+\-*/.()%\s]/g, '')
            const result = Function(`"use strict"; return (${expr})`)()
            output = `= ${result}`
          } catch {
            output = 'calc: invalid expression'
          }
        }
        break

      case 'base64':
        if (!args.length) {
          output = 'base64: usage: base64 <text> or base64 -d <encoded>'
        } else if (args[0] === '-d' && args[1]) {
          try {
            output = atob(args.slice(1).join(' '))
          } catch {
            output = 'base64: invalid input'
          }
        } else {
          output = btoa(args.join(' '))
        }
        break

      case 'time':
        if (!args.length) {
          output = 'time: usage: time <command>'
        } else {
          const start = performance.now()
          executeCommand(args.join(' '))
          const end = performance.now()
          setLines(prev => [...prev, { type: 'info', content: `\nreal\t${((end - start) / 1000).toFixed(3)}s` }])
          return
        }
        break

      case 'git':
        const gitSubCmd = args[0]
        switch (gitSubCmd) {
          case 'status':
            output = `On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)

${Object.values(fileSystem.nodes)
  .filter(n => n.type === 'file' && n.name)
  .slice(0, 3)
  .map(n => `\t\x1b[31mmodified:   ${n.name}\x1b[0m`)
  .join('\n')}

no changes added to commit (use "git add" and/or "git commit -a")`
            break
          case 'init':
            output = `Initialized empty Git repository in /volt-ide/.git/`
            break
          case 'add':
            if (args[1] === '.') {
              output = 'Added all files to staging area'
            } else if (args[1]) {
              output = `Added ${args[1]} to staging area`
            } else {
              output = 'Nothing specified, nothing added.'
            }
            break
          case 'commit':
            if (args[1] === '-m' && args[2]) {
              const msg = args.slice(2).join(' ').replace(/^["']|["']$/g, '')
              output = `[main ${Math.random().toString(36).substring(2, 9)}] ${msg}
 3 files changed, 42 insertions(+), 12 deletions(-)`
            } else {
              output = 'error: switch `m` requires a value'
            }
            break
          case 'log':
            output = `commit ${Math.random().toString(36).substring(2, 9)}abc123 (HEAD -> main)
Author: volt-user <user@volt-ide.com>
Date:   ${new Date().toUTCString()}

    Initial commit

commit def456${Math.random().toString(36).substring(2, 9)} 
Author: volt-user <user@volt-ide.com>
Date:   ${new Date(Date.now() - 86400000).toUTCString()}

    Setup project structure`
            break
          case 'branch':
            if (args[1]) {
              output = `Created branch '${args[1]}'`
            } else {
              output = `* main
  develop
  feature/new-feature`
            }
            break
          case 'checkout':
            if (args[1]) {
              output = `Switched to branch '${args[1]}'`
            } else {
              output = 'error: you must specify a branch to checkout'
            }
            break
          case 'diff':
            output = `diff --git a/main.js b/main.js
index abc1234..def5678 100644
--- a/main.js
+++ b/main.js
@@ -1,4 +1,5 @@
 // JavaScript Template
 console.log("Hello, World!");
+console.log("New line added");
 
 // Your code here`
            break
          case 'push':
            output = `Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
Writing objects: 100% (3/3), 285 bytes | 285.00 KiB/s, done.
Total 3 (delta 2), reused 0 (delta 0)
To github.com:user/repo.git
   abc1234..def5678  main -> main`
            break
          case 'pull':
            output = `Already up to date.`
            break
          case 'clone':
            if (args[1]) {
              const repoName = args[1].split('/').pop()?.replace('.git', '') || 'repo'
              output = `Cloning into '${repoName}'...
remote: Enumerating objects: 100, done.
remote: Counting objects: 100% (100/100), done.
remote: Compressing objects: 100% (80/80), done.
remote: Total 100 (delta 20), reused 90 (delta 10)
Receiving objects: 100% (100/100), 50.00 KiB | 1.00 MiB/s, done.
Resolving deltas: 100% (20/20), done.`
            } else {
              output = 'usage: git clone <repository>'
            }
            break
          case 'remote':
            if (args[1] === 'add' && args[2] && args[3]) {
              output = ''
            } else if (args[1] === '-v') {
              output = `origin\thttps://github.com/user/repo.git (fetch)
origin\thttps://github.com/user/repo.git (push)`
            } else {
              output = 'origin'
            }
            break
          default:
            output = `git: '${gitSubCmd}' is not a git command. See 'git --help'.`
        }
        break

      case '':
        output = ''
        break

      default:
        // Check for history expansion !n
        if (cmd.startsWith('!') && cmd.length > 1) {
          const n = parseInt(cmd.slice(1))
          if (!isNaN(n) && n > 0 && n <= history.length) {
            executeCommand(history[n - 1])
            return
          }
        }
        output = `${cmd}: command not found. Type "help" for available commands.`
    }

    if (output) {
      setLines(prev => [...prev, { type: 'output', content: output }])
    }
  }

  // Tab completion
  const getCompletions = (partial: string): string[] => {
    const parts = partial.split(' ')
    const lastPart = parts[parts.length - 1]
    const currentNode = fileSystem.nodes[currentNodeId]
    
    if (parts.length === 1) {
      // Command completion
      const commands = [
        'help', 'ls', 'cd', 'pwd', 'cat', 'head', 'tail', 'wc', 'tree', 'echo',
        'mkdir', 'touch', 'rm', 'cp', 'mv', 'find', 'grep', 'clear', 'date',
        'whoami', 'hostname', 'uname', 'uptime', 'env', 'export', 'history',
        'calc', 'base64', 'time', 'alias'
      ]
      return commands.filter(c => c.startsWith(lastPart))
    } else {
      // File/folder completion
      if (currentNode?.type === 'folder' && currentNode.children) {
        return currentNode.children
          .map(id => fileSystem.nodes[id]?.name || '')
          .filter(name => name.startsWith(lastPart))
      }
    }
    return []
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const command = currentCommand.trim()
      if (command) {
        setHistory([...history, command])
        executeCommand(command)
        setCurrentCommand('')
        setHistoryIndex(-1)
        setTabCompletionIndex(-1)
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const completions = getCompletions(currentCommand)
      if (completions.length === 1) {
        // Single match - auto complete
        const parts = currentCommand.split(' ')
        parts[parts.length - 1] = completions[0]
        setCurrentCommand(parts.join(' ') + ' ')
      } else if (completions.length > 1) {
        // Multiple matches - show options or cycle through
        if (tabCompletionIndex === -1) {
          setLines(prev => [...prev, { type: 'info', content: completions.join('  ') }])
          setTabCompletionIndex(0)
        } else {
          const nextIndex = (tabCompletionIndex + 1) % completions.length
          const parts = currentCommand.split(' ')
          parts[parts.length - 1] = completions[nextIndex]
          setCurrentCommand(parts.join(' '))
          setTabCompletionIndex(nextIndex)
        }
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
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setLines([])
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault()
      setCurrentCommand('')
      setLines(prev => [...prev, { type: 'output', content: '^C' }])
    } else {
      setTabCompletionIndex(-1)
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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <TerminalSquare className="w-4 h-4 text-[#4ec9b0]" />
            <span className="text-[11px] font-semibold text-white uppercase tracking-wide">Terminal</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[#6d8086]">
            <span className="px-1.5 py-0.5 bg-[#1e1e1e] rounded">vsh</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLines([])}
            className="p-1 hover:bg-[#3e3e42] rounded transition-colors text-[#858585] hover:text-[#cccccc]"
            title="Clear terminal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClear}
            className="p-1 hover:bg-[#3e3e42] rounded transition-colors text-[#858585] hover:text-[#cccccc]"
            title="Close terminal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
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
            ) : line.type === 'success' ? (
              <div className="text-[#89d185]">{line.content}</div>
            ) : line.type === 'info' ? (
              <div className="text-[#3794ff]">{line.content}</div>
            ) : line.type === 'warning' ? (
              <div className="text-[#cca700]">{line.content}</div>
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
