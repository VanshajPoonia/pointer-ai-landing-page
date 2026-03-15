'use client'

import { useState, useEffect, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { CodeEditor } from './code-editor'
import { XTermTerminal } from './xterm-terminal'
import { useCollaboration } from '@/hooks/use-collaboration'
import { CollaborationCursors, CollaboratorPresence } from './collaboration-cursors'
import { FileExplorer } from './file-explorer'
import { OutputPanel } from './output-panel'
import { IDEHeader } from './ide-header'
import { createClient } from '@/lib/supabase/client'
import { Button } from './ui/button'
import { Play, Save, FileCode, Sparkles, AlertCircle, AlertTriangle, MessageSquare, Eye, EyeOff, GitBranch, Settings, MessageSquareWarning, Zap, Search, Keyboard, Command } from 'lucide-react'
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
import { LivePreviewPanel } from './live-preview-panel'
import { SnippetsPanel } from './snippets-panel'
import { DeploymentPanel } from './deployment-panel'
import { AIToolsPanel } from './ai-tools-panel'
import { CommandPalette, KeyboardShortcutsPanel, defaultShortcuts, useKeyboardShortcuts } from './command-palette'
import { SettingsPanel, defaultSettings, EditorSettings } from './settings-panel'
import { QuickOpen, GlobalSearch } from './file-search'
import { useAIAutocomplete } from '@/hooks/use-ai-autocomplete'
import { CodeIssue } from './code-editor'
import { FileNode, FileSystemState, createDefaultFileSystem, getNodePath, getLanguageTemplate } from '@/lib/file-system'

interface IDEInterfaceProps {
  projectId?: string
}

interface ProjectData {
  id: string
  name: string
  template: string
  description: string | null
}

interface UserData {
  id: string
  email?: string
  user_metadata?: {
    avatar_url?: string
    full_name?: string
  }
}

export function IDEInterface({ projectId }: IDEInterfaceProps) {
  const [fileSystem, setFileSystem] = useState<FileSystemState>(createDefaultFileSystem())
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const [executions, setExecutions] = useState(0)
  const [isPaid, setIsPaid] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAIPanel, setShowAIPanel] = useState(true) // Open by default
  const [showIssuesPanel, setShowIssuesPanel] = useState(false)
  const [showLivePreview, setShowLivePreview] = useState(false)
  const [showSnippetsPanel, setShowSnippetsPanel] = useState(false)
  const [showDeploymentPanel, setShowDeploymentPanel] = useState(false)
  const [showAIToolsPanel, setShowAIToolsPanel] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [showQuickOpen, setShowQuickOpen] = useState(false)
  const [showGlobalSearch, setShowGlobalSearch] = useState(false)
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(defaultSettings)
  const [recentFiles, setRecentFiles] = useState<string[]>([])
  const [selectedCode, setSelectedCode] = useState('')
  const [aiAutocompleteEnabled, setAiAutocompleteEnabled] = useState(true)
  const [activeLeftPanel, setActiveLeftPanel] = useState<'files' | 'git'>('files')
  const [codeIssues, setCodeIssues] = useState<CodeIssue[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState(true) // Toggle for AI analysis
  const [commentCheckEnabled, setCommentCheckEnabled] = useState(true) // Toggle for comment/code mismatch
  const [ignoredIssues, setIgnoredIssues] = useState<Set<string>>(new Set())
  const [previewContent, setPreviewContent] = useState<{ html: string; css: string; js: string }>({ html: '', css: '', js: '' })
  const [project, setProject] = useState<ProjectData | null>(null)
  const [loadingProject, setLoadingProject] = useState(!!projectId)
  const [collaborationEnabled, setCollaborationEnabled] = useState(false)
  const analyzeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const editorRef = useRef<any>(null)

  const supabase = createClient()

  // Get current file's database ID for collaboration
  const activeFileDbId = activeFileId ? fileSystem.nodes[activeFileId]?.dbId : undefined

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'cmd+p': () => setShowQuickOpen(true),
    'cmd+shift+p': () => setShowCommandPalette(true),
    'cmd+shift+f': () => setShowGlobalSearch(true),
    'cmd+s': () => handleSave(),
    'cmd+shift+a': () => setShowAIPanel(!showAIPanel),
    'cmd+,': () => setShowSettingsPanel(true),
    'cmd+k': () => setShowKeyboardShortcuts(true),
  })

  // Track recent files
  useEffect(() => {
    if (activeFileId && !recentFiles.includes(activeFileId)) {
      setRecentFiles(prev => [activeFileId, ...prev.slice(0, 9)])
    }
  }, [activeFileId])

  // AI Autocomplete hook
  const {
    suggestion: aiSuggestion,
    isLoading: isAutocompletLoading,
    getSuggestion,
    acceptSuggestion,
    dismissSuggestion,
  } = useAIAutocomplete({
    enabled: aiAutocompleteEnabled,
    language,
    debounceMs: 800,
  })

  // Collaboration hook - only active when we have a project, user, and active file
  const {
    collaborators,
    isConnected: isCollabConnected,
    sendUpdate: sendCollabUpdate,
    updateCursor: updateCollabCursor,
    initializeContent: initCollabContent,
    userColor,
  } = useCollaboration({
    fileId: activeFileDbId || '',
    projectId: projectId || '',
    userId: user?.id || '',
    userName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous',
    onRemoteChange: (content) => {
      if (collaborationEnabled) {
        setCode(content)
      }
    },
  })

  // Load project data from Supabase
  const loadProjectData = async () => {
    if (!projectId) return
    
    setLoadingProject(true)
    try {
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()
      
      if (projectError || !projectData) {
        console.error('Failed to load project:', projectError)
        setLoadingProject(false)
        return
      }
      
      setProject(projectData)
      
      // Update last_opened_at
      await supabase
        .from('projects')
        .update({ last_opened_at: new Date().toISOString() })
        .eq('id', projectId)
      
      // Fetch all files for this project
      const { data: files, error: filesError } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .order('type', { ascending: false }) // Folders first
      
      if (filesError) {
        console.error('Failed to load files:', filesError)
        setLoadingProject(false)
        return
      }
      
      // Build file system from database files
      const nodes: Record<string, FileNode> = {
        root: {
          id: 'root',
          name: '~',
          type: 'folder',
          children: [],
          parentId: null,
        },
      }
      
      // Map database IDs to our internal IDs
      const dbIdToNodeId: Record<string, string> = {}
      
      // First pass: create all nodes
      files.forEach((file: { id: string; name: string; type: string; content: string | null; language: string | null; parent_id: string | null }) => {
        const nodeId = `file-${file.id}`
        dbIdToNodeId[file.id] = nodeId
        
        nodes[nodeId] = {
          id: nodeId,
          name: file.name,
          type: file.type as 'file' | 'folder',
          content: file.content || '',
          language: file.language || 'javascript',
          parentId: file.parent_id ? `file-${file.parent_id}` : 'root',
          children: file.type === 'folder' ? [] : undefined,
          dbId: file.id, // Store database ID for saving
        }
      })
      
      // Second pass: build parent-child relationships
      Object.values(nodes).forEach((node) => {
        if (node.id !== 'root' && node.parentId) {
          const parent = nodes[node.parentId]
          if (parent && parent.children) {
            parent.children.push(node.id)
          } else if (node.parentId === 'root') {
            nodes.root.children?.push(node.id)
          }
        }
      })
      
      setFileSystem({ nodes, rootId: 'root' })
      
      // Select first file
      const firstFile = files.find((f: { type: string }) => f.type === 'file')
      if (firstFile) {
        const nodeId = dbIdToNodeId[firstFile.id]
        setActiveFileId(nodeId)
        setCode(firstFile.content || '')
        setLanguage(firstFile.language || 'javascript')
        updatePreviewContent(firstFile.content || '', firstFile.language || 'javascript')
      }
      
    } catch (err) {
      console.error('Error loading project:', err)
    } finally {
      setLoadingProject(false)
    }
  }

  // Load project data if projectId is provided
  useEffect(() => {
    if (projectId) {
      loadProjectData()
    } else {
      createTemplateFile('javascript')
    }
  }, [projectId])

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

  // Update preview content based on current file and file system
  const updatePreviewContent = (currentCode: string, currentLang: string) => {
    let html = ''
    let css = ''
    let js = ''
    
    // If current file is HTML/CSS/JS, use it
    if (currentLang === 'html') {
      html = currentCode
    } else if (currentLang === 'css') {
      css = currentCode
    } else if (currentLang === 'javascript' || currentLang === 'typescript') {
      js = currentCode
    }
    
    // Also check for other files in the file system
    Object.values(fileSystem.nodes).forEach((node) => {
      if (node.type === 'file' && node.content) {
        const ext = node.name.split('.').pop()?.toLowerCase()
        if (ext === 'html' && currentLang !== 'html') {
          html = node.content
        } else if (ext === 'css' && currentLang !== 'css') {
          css = node.content
        } else if ((ext === 'js' || ext === 'ts') && currentLang !== 'javascript' && currentLang !== 'typescript') {
          js = node.content
        }
      }
    })
    
    setPreviewContent({ html, css, js })
  }

  // Auto-save to Supabase (debounced)
  const autoSaveToDb = async (content: string) => {
    if (!projectId || !activeFileId) return
    
    const node = fileSystem.nodes[activeFileId]
    if (!node?.dbId) return
    
    try {
      await supabase
        .from('files')
        .update({ 
          content, 
          language,
          updated_at: new Date().toISOString()
        })
        .eq('id', node.dbId)
    } catch (err) {
      console.error('Auto-save failed:', err)
    }
  }

  // Trigger analysis when code changes (debounced)
  const handleCodeChange = (newCode: string) => {
    setCode(newCode)
    
    // Update local file system state
    if (activeFileId) {
      const node = fileSystem.nodes[activeFileId]
      if (node && node.type === 'file') {
        setFileSystem(prev => ({
          ...prev,
          nodes: {
            ...prev.nodes,
            [activeFileId]: {
              ...node,
              content: newCode,
            },
          },
        }))
      }
    }
    
    // Update preview content
    updatePreviewContent(newCode, language)
    
    // Clear existing timeouts
    if (analyzeTimeoutRef.current) {
      clearTimeout(analyzeTimeoutRef.current)
    }
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    
    // Set new timeout for analysis (2 seconds after user stops typing)
    analyzeTimeoutRef.current = setTimeout(() => {
      analyzeCode(newCode, language)
    }, 2000)
    
    // Auto-save after 1 second of no typing
    if (projectId) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSaveToDb(newCode)
      }, 1000)
    }
  }

  const loadUserData = async () => {
    // Get authenticated user
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return
    
    setUser({
      id: authUser.id,
      email: authUser.email,
      user_metadata: authUser.user_metadata,
    })
    
    // Get user profile data
    const { data } = await supabase
      .from('users')
      .select('free_executions_remaining, is_premium, is_admin')
      .eq('id', authUser.id)
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
      // Update preview when selecting a file
      updatePreviewContent(node.content || '', node.language || 'javascript')
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

  const saveFile = async () => {
    if (activeFileId) {
      const node = fileSystem.nodes[activeFileId]
      if (node && node.type === 'file') {
        // Update local state
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
        
        // Sync with Supabase if this is a project file
        if (projectId && node.dbId) {
          try {
            await supabase
              .from('files')
              .update({ 
                content: code, 
                language,
                updated_at: new Date().toISOString()
              })
              .eq('id', node.dbId)
          } catch (err) {
            console.error('Failed to save file to database:', err)
          }
        }
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

  // Show loading state while loading project
  if (loadingProject) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1e1e1e]">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mx-auto" />
          <p className="text-[#cccccc]">Loading project...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-[#1e1e1e]">
      <IDEHeader 
        user={user} 
        executions={executions} 
        isPaid={isPaid}
        isAdmin={isAdmin}
        onNewFile={() => handleCreateFile('root')}
        projectName={project?.name}
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
              {/* Live Preview Button - Only for web projects */}
              {(!project || project.template === 'web') && (
                <Button
                  onClick={() => {
                    setShowLivePreview(!showLivePreview)
                    // Update preview content when opening
                    if (!showLivePreview) {
                      updatePreviewContent(code, language)
                    }
                  }}
                  size="sm"
                  variant="ghost"
                  className={`h-[26px] px-3 text-[12px] rounded-[3px] ${
                    showLivePreview 
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-500' 
                      : 'text-[#cccccc] hover:bg-[#3c3c3c]'
                  }`}
                  title="Live Preview (HTML/CSS/JS)"
                >
                  <Eye className="mr-1.5 h-4 w-4" />
                  Preview
                </Button>
              )}
 {/* Collaboration Button - Only when project is loaded */}
  {projectId && user && activeFileDbId && (
    <>
      <Button
        onClick={() => setCollaborationEnabled(!collaborationEnabled)}
        size="sm"
        variant="ghost"
        className={`h-[26px] px-3 text-[12px] rounded-[3px] ${
          collaborationEnabled
            ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400'
            : 'text-[#cccccc] hover:bg-[#3c3c3c]'
        }`}
        title={collaborationEnabled ? 'Collaboration enabled' : 'Enable collaboration'}
      >
        <svg className="mr-1.5 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        Collab
        {isCollabConnected && collaborationEnabled && (
          <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-green-500" />
        )}
      </Button>
      {/* Collaborator Presence */}
      {collaborationEnabled && collaborators.length > 0 && (
        <CollaboratorPresence collaborators={collaborators} />
      )}
    </>
  )}
  {/* Code Snippets Button */}
  <Button
    onClick={() => setShowSnippetsPanel(!showSnippetsPanel)}
    size="sm"
    variant="ghost"
    className={`h-[26px] px-3 text-[12px] rounded-[3px] ${
      showSnippetsPanel
        ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400'
        : 'text-[#cccccc] hover:bg-[#3c3c3c]'
    }`}
    title="Code Snippets Library"
  >
    <FileCode className="mr-1.5 h-4 w-4" />
    Snippets
  </Button>
  {/* Deploy Button */}
  {projectId && (
    <Button
      onClick={() => setShowDeploymentPanel(!showDeploymentPanel)}
      size="sm"
      variant="ghost"
      className={`h-[26px] px-3 text-[12px] rounded-[3px] ${
        showDeploymentPanel
          ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400'
          : 'text-[#cccccc] hover:bg-[#3c3c3c]'
      }`}
      title="Deploy to Vercel/Netlify"
    >
      <svg className="mr-1.5 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 19.5h20L12 2z" />
      </svg>
      Deploy
    </Button>
  )}
  {/* AI Autocomplete Toggle */}
  <Button
    onClick={() => setAiAutocompleteEnabled(!aiAutocompleteEnabled)}
    size="sm"
    variant="ghost"
    className={`h-[26px] px-3 text-[12px] rounded-[3px] ${
      aiAutocompleteEnabled
        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400'
        : 'text-[#666666] hover:bg-[#3c3c3c]'
    }`}
    title={aiAutocompleteEnabled ? 'AI Autocomplete On (Tab to accept)' : 'AI Autocomplete Off'}
  >
    <Sparkles className="mr-1.5 h-4 w-4" />
    Copilot
    {isAutocompletLoading && (
      <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
    )}
  </Button>
  {/* AI Tools Button */}
  <Button
    onClick={() => setShowAIToolsPanel(!showAIToolsPanel)}
    size="sm"
    variant="ghost"
    className={`h-[26px] px-3 text-[12px] rounded-[3px] ${
      showAIToolsPanel
        ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/20 text-indigo-400'
        : 'text-[#cccccc] hover:bg-[#3c3c3c]'
    }`}
    title="AI Tools: Explain, Document, Fix Bugs, Generate Tests"
  >
    <Zap className="mr-1.5 h-4 w-4" />
    AI Tools
  </Button>
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
  {/* Search Button */}
  <Button
    onClick={() => setShowQuickOpen(true)}
    size="sm"
    variant="ghost"
    className="h-[26px] px-3 text-[12px] rounded-[3px] text-[#cccccc] hover:bg-[#3c3c3c]"
    title="Quick Open (Cmd+P)"
  >
    <Search className="mr-1.5 h-4 w-4" />
    Search
  </Button>
  {/* Command Palette Button */}
  <Button
    onClick={() => setShowCommandPalette(true)}
    size="sm"
    variant="ghost"
    className="h-[26px] px-3 text-[12px] rounded-[3px] text-[#cccccc] hover:bg-[#3c3c3c]"
    title="Command Palette (Cmd+Shift+P)"
  >
    <Command className="mr-1.5 h-4 w-4" />
  </Button>
  {/* Settings Button */}
  <Button
    onClick={() => setShowSettingsPanel(true)}
    size="sm"
    variant="ghost"
    className="h-[26px] px-3 text-[12px] rounded-[3px] text-[#cccccc] hover:bg-[#3c3c3c]"
    title="Settings (Cmd+,)"
  >
    <Settings className="h-4 w-4" />
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
  onChange={(newCode) => {
    handleCodeChange(newCode)
    // Send to collaborators
    if (collaborationEnabled && projectId && activeFileDbId) {
      sendCollabUpdate(newCode)
    }
    // Trigger AI autocomplete suggestion
    if (aiAutocompleteEnabled && editorRef.current) {
      const position = editorRef.current.getPosition()
      if (position) {
        getSuggestion(newCode, position.lineNumber, position.column)
      }
    }
  }}
  issues={codeIssues}
  onEditorReady={(editor) => {
    editorRef.current = editor
    // Initialize collaboration content when editor is ready
    if (collaborationEnabled && code) {
      initCollabContent(code)
    }
  }}
  onCursorChange={(position, selection) => {
    // Update cursor position for collaborators
    if (collaborationEnabled && projectId && activeFileDbId) {
      updateCollabCursor(position, selection)
    }
    // Dismiss suggestion on cursor move
    if (aiSuggestion) {
      dismissSuggestion()
    }
  }}
  ghostText={aiSuggestion ? {
    text: aiSuggestion,
    position: editorRef.current?.getPosition() || { lineNumber: 1, column: 1 }
  } : null}
  onAcceptGhostText={() => {
    const suggestion = acceptSuggestion()
    return suggestion || ''
  }}
  onDismissGhostText={dismissSuggestion}
  onSelectionChange={(text) => setSelectedCode(text)}
  />
  {/* Collaboration Cursors */}
  {collaborationEnabled && collaborators.length > 0 && (
    <CollaborationCursors 
      collaborators={collaborators} 
      editorRef={editorRef} 
    />
  )}
            </div>
            {/* Live Preview Panel - Only for web projects */}
            {(!project || project.template === 'web') && (
              <LivePreviewPanel
                html={previewContent.html}
                css={previewContent.css}
                javascript={previewContent.js}
                isOpen={showLivePreview}
                onClose={() => setShowLivePreview(false)}
              />
            )}
            {/* AI Assistant Panel */}
            <AIAssistantPanel
              code={code}
              language={language}
              isOpen={showAIPanel}
              onClose={() => setShowAIPanel(false)}
              onCodeChange={(newCode) => {
                setCode(newCode)
                updatePreviewContent(newCode, language)
                // Trigger analysis after AI changes code
                if (analyzeTimeoutRef.current) {
                  clearTimeout(analyzeTimeoutRef.current)
                }
                analyzeTimeoutRef.current = setTimeout(() => {
                  analyzeCode(newCode, language)
                }, 1000)
              }}
            />
            {/* Snippets Panel */}
            <SnippetsPanel
              isOpen={showSnippetsPanel}
              onClose={() => setShowSnippetsPanel(false)}
              onInsertSnippet={(snippetCode) => {
                // Insert snippet at cursor position or replace selection
                if (editorRef.current) {
                  const selection = editorRef.current.getSelection()
                  if (selection) {
                    editorRef.current.executeEdits('snippet-insert', [{
                      range: selection,
                      text: snippetCode,
                    }])
                  }
                } else {
                  // Fallback: append to code
                  const newCode = code + '\n' + snippetCode
                  setCode(newCode)
                  handleCodeChange(newCode)
                }
                setShowSnippetsPanel(false)
              }}
              currentCode={code}
              currentLanguage={language}
            />
            {/* Deployment Panel */}
            {projectId && (
              <DeploymentPanel
                projectId={projectId}
                projectName={project?.name || 'Project'}
                isOpen={showDeploymentPanel}
                onClose={() => setShowDeploymentPanel(false)}
              />
            )}
            {/* AI Tools Panel */}
            <AIToolsPanel
              isOpen={showAIToolsPanel}
              onClose={() => setShowAIToolsPanel(false)}
              selectedCode={selectedCode || code}
              language={language}
              onApplyFix={(fixedCode) => {
                setCode(fixedCode)
                handleCodeChange(fixedCode)
              }}
              onInsertTests={(testCode) => {
                // Create a new test file
                const testFileName = activeFileId 
                  ? `${fileSystem.nodes[activeFileId]?.name?.replace(/\.\w+$/, '')}.test.${language === 'python' ? 'py' : 'ts'}`
                  : `tests.${language === 'python' ? 'py' : 'ts'}`
                // Insert at cursor or append to file
                const newCode = code + '\n\n// Tests\n' + testCode
                setCode(newCode)
                handleCodeChange(newCode)
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
 <XTermTerminal
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

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        actions={[
          { id: 'quick-open', name: 'Quick Open', shortcut: ['Cmd', 'P'], icon: <Search className="h-4 w-4" />, category: 'navigation', action: () => setShowQuickOpen(true) },
          { id: 'global-search', name: 'Search in Files', shortcut: ['Cmd', 'Shift', 'F'], icon: <Search className="h-4 w-4" />, category: 'navigation', action: () => setShowGlobalSearch(true) },
          { id: 'save', name: 'Save File', shortcut: ['Cmd', 'S'], icon: <Save className="h-4 w-4" />, category: 'file', action: () => saveFile() },
          { id: 'run', name: 'Run Code', shortcut: ['Cmd', 'Enter'], icon: <Play className="h-4 w-4" />, category: 'file', action: () => runCode() },
          { id: 'toggle-ai', name: 'Toggle AI Chat', shortcut: ['Cmd', 'Shift', 'A'], icon: <MessageSquare className="h-4 w-4" />, category: 'ai', action: () => setShowAIPanel(!showAIPanel) },
          { id: 'ai-tools', name: 'AI Tools', icon: <Zap className="h-4 w-4" />, category: 'ai', action: () => setShowAIToolsPanel(true) },
          { id: 'snippets', name: 'Code Snippets', icon: <FileCode className="h-4 w-4" />, category: 'ai', action: () => setShowSnippetsPanel(true) },
          { id: 'deploy', name: 'Deploy Project', icon: <Play className="h-4 w-4" />, category: 'file', action: () => setShowDeploymentPanel(true) },
          { id: 'settings', name: 'Settings', shortcut: ['Cmd', ','], icon: <Settings className="h-4 w-4" />, category: 'settings', action: () => setShowSettingsPanel(true) },
          { id: 'shortcuts', name: 'Keyboard Shortcuts', shortcut: ['Cmd', 'K'], icon: <Keyboard className="h-4 w-4" />, category: 'settings', action: () => setShowKeyboardShortcuts(true) },
          { id: 'toggle-preview', name: 'Toggle Live Preview', icon: <Eye className="h-4 w-4" />, category: 'view', action: () => setShowLivePreview(!showLivePreview) },
          { id: 'toggle-issues', name: 'Toggle Issues Panel', icon: <AlertCircle className="h-4 w-4" />, category: 'view', action: () => setShowIssuesPanel(!showIssuesPanel) },
        ]}
      />

      {/* Keyboard Shortcuts Panel */}
      <KeyboardShortcutsPanel
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
        shortcuts={defaultShortcuts}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettingsPanel}
        onClose={() => setShowSettingsPanel(false)}
        settings={editorSettings}
        onSettingsChange={setEditorSettings}
      />

      {/* Quick Open (File Search) */}
      <QuickOpen
        isOpen={showQuickOpen}
        onClose={() => setShowQuickOpen(false)}
        files={Object.values(fileSystem.nodes).map(node => ({
          id: node.id,
          name: node.name,
          type: node.type,
          path: getNodePath(fileSystem, node.id),
          content: node.content
        }))}
        onFileSelect={(fileId) => {
          setActiveFileId(fileId)
          const node = fileSystem.nodes[fileId]
          if (node && node.type === 'file') {
            setCode(node.content || '')
          }
        }}
        recentFiles={recentFiles}
      />

      {/* Global Search */}
      <GlobalSearch
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
        files={Object.values(fileSystem.nodes).map(node => ({
          id: node.id,
          name: node.name,
          type: node.type,
          path: getNodePath(fileSystem, node.id),
          content: node.content
        }))}
        onResultSelect={(fileId, line) => {
          setActiveFileId(fileId)
          const node = fileSystem.nodes[fileId]
          if (node && node.type === 'file') {
            setCode(node.content || '')
          }
          // Jump to line (would need editor integration)
          setShowGlobalSearch(false)
        }}
      />
    </div>
  )
}
