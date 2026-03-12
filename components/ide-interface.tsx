'use client'

import { useState, useEffect, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { CodeEditor } from './code-editor'
import { Terminal } from './terminal'
import { FileExplorer } from './file-explorer'
import { OutputPanel } from './output-panel'
import { IDEHeader } from './ide-header'
import { createClient } from '@/lib/supabase/client'
import { Button } from './ui/button'
import { Play, Save, FileCode, Sparkles, AlertCircle, AlertTriangle, MessageSquare, Eye, EyeOff, GitBranch, Settings, MessageSquareWarning } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './ui/dropdown-menu'
import { AIAssistantPanel } from './ai-assistant-panel'
import { IssuesPanel } from './issues-panel'
import { SourceControlPanel } from './source-control-panel'
import { CodeIssue } from './code-editor'
import { FileNode, FileSystemState, createDefaultFileSystem, getNodePath, getLanguageTemplate } from '@/lib/file-system'

interface IDEInterfaceProps {
  user: User
}

export function IDEInterface({ user }: IDEInterfaceProps) {
  const [fileSystem, setFileSystem] = useState<FileSystemState>(createDefaultFileSystem())
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [executions, setExecutions] = useState(0)
  const [isPaid, setIsPaid] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAIPanel, setShowAIPanel] = useState(true) // Open by default
  const [showIssuesPanel, setShowIssuesPanel] = useState(false)
  const [activeLeftPanel, setActiveLeftPanel] = useState<'files' | 'git'>('files')
  const [codeIssues, setCodeIssues] = useState<CodeIssue[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState(true) // Toggle for AI analysis
  const [commentCheckEnabled, setCommentCheckEnabled] = useState(true) // Toggle for comment/code mismatch
  const [ignoredIssues, setIgnoredIssues] = useState<Set<string>>(new Set())
  const analyzeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const editorRef = useRef<any>(null)

  const supabase = createClient()

  // Create initial file on first load
  useEffect(() => {
    createTemplateFile('javascript')
  }, [])

  useEffect(() => {
    loadUserData()
    // Load active file content
    if (activeFileId) {
      const node = fileSystem.nodes[activeFileId]
      if (node && node.type === 'file') {
        setCode(node.content || '')
      }
    }
  }, [activeFileId])

  const createTemplateFile = (lang: string) => {
    const template = getLanguageTemplate(lang)
    const newFileId = `file-${Date.now()}`
    const newFile: FileNode = {
      id: newFileId,
      name: template.filename,
      type: 'file',
      content: template.content,
      language: lang,
      parentId: 'root',
    }

    setFileSystem(prev => ({
      ...prev,
      nodes: {
        ...prev.nodes,
        [newFileId]: newFile,
        root: {
          ...prev.nodes.root,
          children: [...(prev.nodes.root.children || []), newFileId],
        },
      },
    }))
    setActiveFileId(newFileId)
    setCode(template.content)
    setLanguage(lang)
  }

  const handleLanguageChange = (newLanguage: string) => {
    // Create a new template file for the selected language
    createTemplateFile(newLanguage)
  }

  // Debounced code analysis
  const analyzeCode = async (codeToAnalyze: string, lang: string) => {
    if (!aiAnalysisEnabled) {
      return
    }
    
    if (!codeToAnalyze || codeToAnalyze.trim().length < 10) {
      setCodeIssues([])
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: codeToAnalyze, 
          language: lang,
          checkComments: commentCheckEnabled 
        }),
      })
      const data = await response.json()
      // Add unique IDs to issues for ignore functionality
      const issuesWithIds = (data.issues || []).map((issue: CodeIssue, index: number) => ({
        ...issue,
        id: `${issue.line}-${issue.column}-${issue.message.slice(0, 20)}-${index}`
      }))
      setCodeIssues(issuesWithIds)
    } catch {
      setCodeIssues([])
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Handle ignoring a warning
  const handleIgnoreIssue = (issueId: string) => {
    setIgnoredIssues(prev => new Set([...prev, issueId]))
  }

  // Trigger analysis when code changes (debounced)
  const handleCodeChange = (newCode: string) => {
    setCode(newCode)
    
    // Clear existing timeout
    if (analyzeTimeoutRef.current) {
      clearTimeout(analyzeTimeoutRef.current)
    }
    
    // Set new timeout for analysis (2 seconds after user stops typing)
    analyzeTimeoutRef.current = setTimeout(() => {
      analyzeCode(newCode, language)
    }, 2000)
  }

  const loadUserData = async () => {
    const { data } = await supabase
      .from('users')
      .select('free_executions_remaining, is_premium, is_admin')
      .eq('id', user.id)
      .single()

    if (data) {
      setExecutions(100 - (data.free_executions_remaining || 100))
      setIsPaid(data.is_premium || false)
      setIsAdmin(data.is_admin || false)
    }
  }

  const handleSelectFile = (nodeId: string) => {
    const node = fileSystem.nodes[nodeId]
    if (node && node.type === 'file') {
      setActiveFileId(nodeId)
      setCode(node.content || '')
      setLanguage(node.language || 'javascript')
    }
  }

  const handleCreateFile = (parentId: string, startRenaming?: (id: string) => void) => {
    const newFileId = `file-${Date.now()}`
    const newFile: FileNode = {
      id: newFileId,
      name: '',
      type: 'file',
      content: '',
      language: 'plaintext',
      parentId,
      isNew: true,
    }

    const parent = fileSystem.nodes[parentId]
    if (parent && parent.type === 'folder') {
      setFileSystem({
        ...fileSystem,
        nodes: {
          ...fileSystem.nodes,
          [newFileId]: newFile,
          [parentId]: {
            ...parent,
            children: [...(parent.children || []), newFileId],
          },
        },
      })
      setActiveFileId(newFileId)
      setCode('')
      setLanguage('plaintext')
      
      // Trigger rename mode for the new file
      if (startRenaming) {
        setTimeout(() => startRenaming(newFileId), 50)
      }
    }
  }

  const handleCreateFolder = (parentId: string) => {
    const newFolderId = `folder-${Date.now()}`
    const newFolder: FileNode = {
      id: newFolderId,
      name: 'new-folder',
      type: 'folder',
      children: [],
      parentId,
    }

    const parent = fileSystem.nodes[parentId]
    if (parent && parent.type === 'folder') {
      setFileSystem({
        ...fileSystem,
        nodes: {
          ...fileSystem.nodes,
          [newFolderId]: newFolder,
          [parentId]: {
            ...parent,
            children: [...(parent.children || []), newFolderId],
          },
        },
      })
    }
  }

  const handleDeleteNode = (nodeId: string) => {
    const node = fileSystem.nodes[nodeId]
    if (!node || !node.parentId) return

    const parent = fileSystem.nodes[node.parentId]
    if (!parent || parent.type !== 'folder') return

    const newNodes = { ...fileSystem.nodes }
    delete newNodes[nodeId]

    // Remove from parent's children
    newNodes[node.parentId] = {
      ...parent,
      children: parent.children?.filter(id => id !== nodeId) || [],
    }

    setFileSystem({
      ...fileSystem,
      nodes: newNodes,
    })

    // Clear active file if it was deleted
    if (activeFileId === nodeId) {
      setActiveFileId(null)
      setCode('')
    }
  }

  // Map file extensions to languages
  const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    const extensionMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'cc': 'cpp',
      'cxx': 'cpp',
      'c': 'c',
      'h': 'c',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'kt': 'kotlin',
      'kts': 'kotlin',
      'swift': 'swift',
      'dart': 'dart',
      'scala': 'scala',
      'hs': 'haskell',
      'ex': 'elixir',
      'exs': 'elixir',
      'r': 'r',
      'lua': 'lua',
      'pl': 'perl',
      'sh': 'bash',
      'bash': 'bash',
      'sql': 'sql',
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'xml': 'xml',
      'md': 'markdown',
      'txt': 'plaintext',
    }
    return extensionMap[ext || ''] || 'plaintext'
  }

  const handleRenameNode = (nodeId: string, newName: string) => {
    const node = fileSystem.nodes[nodeId]
    if (!node) return

    const detectedLanguage = node.type === 'file' ? getLanguageFromExtension(newName) : undefined
    
    // Get template content for new files
    let newContent = node.content
    if (node.type === 'file' && (node as any).isNew && detectedLanguage) {
      const template = getLanguageTemplate(detectedLanguage)
      newContent = template.content
    }

    setFileSystem({
      ...fileSystem,
      nodes: {
        ...fileSystem.nodes,
        [nodeId]: {
          ...node,
          name: newName,
          language: detectedLanguage || node.language,
          content: newContent,
          isNew: false,
        },
      },
    })

    // Update current editor if this is the active file
    if (activeFileId === nodeId && node.type === 'file') {
      if (detectedLanguage) {
        setLanguage(detectedLanguage)
      }
      if ((node as any).isNew && newContent) {
        setCode(newContent)
      }
    }
  }

  const saveFile = () => {
    if (activeFileId) {
      const node = fileSystem.nodes[activeFileId]
      if (node && node.type === 'file') {
        setFileSystem({
          ...fileSystem,
          nodes: {
            ...fileSystem.nodes,
            [activeFileId]: {
              ...node,
              content: code,
              language,
            },
          },
        })
      }
    }
  }

  const runCode = async () => {
    if (!isAdmin && !isPaid && executions >= 100) {
      setOutput('You have reached the free tier limit of 100 executions. Please upgrade to continue.')
      return
    }

    setIsRunning(true)
    setOutput('Running...')

    try {
      // Client-side execution for JS/TS
      if (language === 'javascript' || language === 'typescript') {
        const logs: string[] = []
        const originalLog = console.log
        console.log = (...args: any[]) => {
          logs.push(args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '))
        }

        try {
          // eslint-disable-next-line no-eval
          eval(code)
          setOutput(logs.length > 0 ? logs.join('\n') : 'Code executed successfully (no output)')
        } catch (error: any) {
          setOutput(`Error: ${error.message}`)
        } finally {
          console.log = originalLog
        }
      } else {
        // Server-side execution via Piston API
        const response = await fetch('/api/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language, code }),
        })

        const result = await response.json()
        
        if (response.status === 401) {
          setOutput('Please log in to run code. Go to /auth/login to sign in.')
          return
        }
        
        if (response.status === 403 && result.limit_reached) {
          setOutput('You have reached the free tier limit of 100 executions. Please upgrade to continue.')
          return
        }
        
        if (result.error) {
          setOutput(`Error: ${result.error}`)
        } else {
          setOutput(result.output || 'No output')
        }
      }

      // Log execution
      await supabase.from('executions').insert({
        user_id: user.id,
        language,
        code,
      })

      // Reload user data to get updated execution count
      loadUserData()
    } catch (error: any) {
      setOutput(`Error: ${error.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-[#1e1e1e]">
      <IDEHeader 
        user={user} 
        executions={executions} 
        isPaid={isPaid}
        isAdmin={isAdmin}
        onNewFile={() => handleCreateFile('root')}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <div className="w-[48px] bg-[#333333] flex flex-col items-center py-2 border-r border-[#191919]">
          <button
            onClick={() => setActiveLeftPanel('files')}
            className={`w-[48px] h-[48px] flex items-center justify-center transition-colors relative ${
              activeLeftPanel === 'files'
                ? 'text-white'
                : 'text-[#858585] hover:text-white'
            }`}
            title="Explorer"
          >
            {activeLeftPanel === 'files' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 bg-white" />
            )}
            <FileCode className="w-6 h-6" />
          </button>
          <button
            onClick={() => setActiveLeftPanel('git')}
            className={`w-[48px] h-[48px] flex items-center justify-center transition-colors relative ${
              activeLeftPanel === 'git'
                ? 'text-white'
                : 'text-[#858585] hover:text-white'
            }`}
            title="Source Control"
          >
            {activeLeftPanel === 'git' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 bg-white" />
            )}
            <GitBranch className="w-6 h-6" />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="w-[240px] bg-[#252526] border-r border-[#191919]">
          {activeLeftPanel === 'files' ? (
            <FileExplorer
              nodes={fileSystem.nodes}
              rootId={fileSystem.rootId}
              activeFileId={activeFileId}
              onSelectFile={handleSelectFile}
              onCreateFile={handleCreateFile}
              onCreateFolder={handleCreateFolder}
              onDeleteNode={handleDeleteNode}
              onRenameNode={handleRenameNode}
            />
          ) : (
            <SourceControlPanel
              fileSystem={fileSystem}
              onFileSystemChange={setFileSystem}
            />
          )}
        </div>

        {/* Main Content */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Tab bar with actions */}
          <div className="flex items-center justify-between h-[35px] bg-[#252526] border-b border-[#191919] px-2">
            <div className="flex items-center h-full">
              {activeFileId && fileSystem.nodes[activeFileId] ? (
                <div className="flex items-center gap-2 px-3 h-full bg-[#1e1e1e] text-[13px] text-[#ffffff] border-t-2 border-t-[#007acc]">
                  <FileCode className="h-4 w-4 text-[#519aba]" />
                  <span>{fileSystem.nodes[activeFileId].name}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 h-full bg-[#1e1e1e] text-[13px] text-[#ffffff] border-t-2 border-t-[#007acc]">
                  <FileCode className="h-4 w-4 text-[#519aba]" />
                  <span>No file selected</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="h-[26px] rounded-[3px] bg-[#3c3c3c] border border-[#3c3c3c] px-2 text-[12px] text-[#cccccc] focus:border-[#007acc] focus:outline-none cursor-pointer"
              >
                <optgroup label="Popular">
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="c">C</option>
                  <option value="csharp">C#</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                </optgroup>
                <optgroup label="Web & Scripting">
                  <option value="php">PHP</option>
                  <option value="ruby">Ruby</option>
                  <option value="perl">Perl</option>
                  <option value="lua">Lua</option>
                  <option value="bash">Bash</option>
                  <option value="powershell">PowerShell</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                </optgroup>
                <optgroup label="Mobile & Modern">
                  <option value="kotlin">Kotlin</option>
                  <option value="swift">Swift</option>
                  <option value="dart">Dart</option>
                  <option value="objectivec">Objective-C</option>
                </optgroup>
                <optgroup label="Functional & JVM">
                  <option value="scala">Scala</option>
                  <option value="haskell">Haskell</option>
                  <option value="elixir">Elixir</option>
                  <option value="clojure">Clojure</option>
                  <option value="fsharp">F#</option>
                  <option value="groovy">Groovy</option>
                </optgroup>
                <optgroup label="Data & Scientific">
                  <option value="r">R</option>
                  <option value="julia">Julia</option>
                  <option value="matlab">MATLAB</option>
                </optgroup>
                <optgroup label="Systems & Performance">
                  <option value="zig">Zig</option>
                  <option value="nim">Nim</option>
                  <option value="crystal">Crystal</option>
                  <option value="d">D</option>
                  <option value="v">V</option>
                </optgroup>
                <optgroup label="Data & Config">
                  <option value="sql">SQL</option>
                  <option value="json">JSON</option>
                  <option value="yaml">YAML</option>
                  <option value="xml">XML</option>
                  <option value="toml">TOML</option>
                  <option value="graphql">GraphQL</option>
                </optgroup>
                <optgroup label="Other">
                  <option value="assembly">Assembly</option>
                  <option value="fortran">Fortran</option>
                  <option value="cobol">COBOL</option>
                  <option value="lisp">Lisp</option>
                  <option value="erlang">Erlang</option>
                  <option value="ocaml">OCaml</option>
                  <option value="pascal">Pascal</option>
                </optgroup>
              </select>
              {/* Issue count indicator - clickable */}
              {(() => {
                const visibleIssues = codeIssues.filter(i => !(i.id && ignoredIssues.has(i.id)))
                const errorCount = visibleIssues.filter(i => i.severity === 'error').length
                const warningCount = visibleIssues.filter(i => i.severity === 'warning').length
                if (visibleIssues.length === 0) return null
                return (
                  <button
                    onClick={() => setShowIssuesPanel(!showIssuesPanel)}
                    className={`flex items-center gap-2 px-2 py-1 rounded text-[11px] transition-colors ${
                      showIssuesPanel 
                        ? 'bg-[#3c3c3c]' 
                        : 'bg-[#2d2d2d] hover:bg-[#3c3c3c]'
                    }`}
                  >
                    {errorCount > 0 && (
                      <span className="flex items-center gap-1 text-red-400">
                        <AlertCircle className="h-3 w-3" />
                        {errorCount}
                      </span>
                    )}
                    {warningCount > 0 && (
                      <span className="flex items-center gap-1 text-yellow-400">
                        <MessageSquareWarning className="h-3 w-3" />
                        {warningCount}
                      </span>
                    )}
                  </button>
                )
              })()}
              {isAnalyzing && (
                <div className="flex items-center gap-1 px-2 py-1 text-[11px] text-[#808080]">
                  <Sparkles className="h-3 w-3 animate-pulse text-amber-500" />
                  <span>Analyzing...</span>
                </div>
              )}
              {/* AI Settings Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`h-[26px] px-2 text-[12px] rounded-[3px] ${
                      aiAnalysisEnabled 
                        ? 'text-amber-500 hover:bg-[#3c3c3c]' 
                        : 'text-[#808080] hover:bg-[#3c3c3c]'
                    }`}
                    title="AI Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#252526] border-[#3c3c3c] min-w-[220px]">
                  <DropdownMenuLabel className="text-[#cccccc] text-xs">AI Analysis Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#3c3c3c]" />
                  <DropdownMenuCheckboxItem
                    checked={aiAnalysisEnabled}
                    onCheckedChange={(checked) => {
                      setAiAnalysisEnabled(checked)
                      if (checked) {
                        analyzeCode(code, language)
                      } else {
                        setCodeIssues([])
                      }
                    }}
                    className="text-[#cccccc] text-xs"
                  >
                    <Eye className="h-3 w-3 mr-2 text-amber-500" />
                    Enable AI Analysis
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={commentCheckEnabled}
                    onCheckedChange={(checked) => {
                      setCommentCheckEnabled(checked)
                      if (aiAnalysisEnabled) {
                        analyzeCode(code, language)
                      }
                    }}
                    className="text-[#cccccc] text-xs"
                  >
                    <MessageSquareWarning className="h-3 w-3 mr-2 text-purple-500" />
                    Check Comments Match Code
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator className="bg-[#3c3c3c]" />
                  <div className="px-2 py-1.5 text-[10px] text-[#808080]">
                    When enabled, AI will warn you if code comments do not match the actual code behavior.
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* AI Chat Button */}
              <Button
                onClick={() => setShowAIPanel(!showAIPanel)}
                size="sm"
                variant="ghost"
                className={`h-[26px] px-3 text-[12px] rounded-[3px] ${
                  showAIPanel 
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-500' 
                    : 'text-[#cccccc] hover:bg-[#3c3c3c]'
                }`}
              >
                <MessageSquare className="mr-1.5 h-4 w-4" />
                AI Chat
              </Button>
              <Button
                onClick={saveFile}
                size="sm"
                variant="ghost"
                className="h-[26px] px-3 text-[#cccccc] hover:bg-[#3c3c3c] text-[12px] rounded-[3px]"
              >
                <Save className="mr-1.5 h-4 w-4" />
                Save
              </Button>
              <Button
                onClick={runCode}
                size="sm"
                disabled={isRunning}
                className="h-[26px] px-3 bg-[#0e639c] hover:bg-[#1177bb] text-white text-[12px] rounded-[3px]"
              >
                <Play className="mr-1.5 h-4 w-4" />
                {isRunning ? 'Running...' : 'Run'}
              </Button>
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 min-h-0 flex overflow-hidden">
            <div className="flex-1 min-w-0 overflow-hidden">
              <CodeEditor
                value={code}
                language={language}
                onChange={handleCodeChange}
                issues={codeIssues}
                onEditorReady={(editor) => {
                  editorRef.current = editor
                }}
              />
            </div>
            {/* AI Assistant Panel */}
            <AIAssistantPanel
              code={code}
              language={language}
              isOpen={showAIPanel}
              onClose={() => setShowAIPanel(false)}
              onCodeChange={(newCode) => {
                setCode(newCode)
                // Trigger analysis after AI changes code
                if (analyzeTimeoutRef.current) {
                  clearTimeout(analyzeTimeoutRef.current)
                }
                analyzeTimeoutRef.current = setTimeout(() => {
                  analyzeCode(newCode, language)
                }, 1000)
              }}
            />
          </div>

{/* Issues Panel */}
<IssuesPanel
issues={codeIssues}
isOpen={showIssuesPanel}
onClose={() => setShowIssuesPanel(false)}
onGoToLine={(line) => {
// Focus editor on the line with issue
if (editorRef.current) {
editorRef.current.revealLineInCenter(line)
editorRef.current.setPosition({ lineNumber: line, column: 1 })
editorRef.current.focus()
}
setShowIssuesPanel(false)
}}
onIgnoreIssue={handleIgnoreIssue}
ignoredIssues={ignoredIssues}
/>

          {/* Bottom Panel - Terminal and Output */}
          <div className="h-[280px] border-t border-[#191919] flex">
            <div className="flex-[2] min-w-0">
              <Terminal 
                onClear={() => setOutput('')}
                fileSystem={fileSystem}
                onUpdateFileSystem={setFileSystem}
              />
            </div>
            <div className="flex-1 min-w-[300px] border-l border-[#191919]">
              <OutputPanel output={output} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
