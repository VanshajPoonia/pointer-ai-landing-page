'use client'

import { useState, useEffect, useRef } from 'react'
import { CodeEditor } from './code-editor'
import { XTermTerminal } from './xterm-terminal'
import { useCollaboration } from '@/hooks/use-collaboration'
import { CollaborationCursors, CollaboratorPresence } from './collaboration-cursors'
import { FileExplorer } from './file-explorer'
import { OutputPanel } from './output-panel'
import { IDEHeader } from './ide-header'
import { createClient } from '@/lib/supabase/client'
import { Button } from './ui/button'
import { Play, Save, FileCode, Sparkles, AlertCircle, AlertTriangle, MessageSquare, Eye, EyeOff, GitBranch, Settings, MessageSquareWarning, Zap, Search, Keyboard, Command, GitCompare, Columns, ListTree, History, Wand2, X, HelpCircle } from 'lucide-react'
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
import { DiffViewer } from './diff-viewer'
import { SplitEditor, useSplitEditor, EditorPane } from './split-editor'
import { useCodeNavigation, GoToDefinitionDialog, FindReferencesDialog, DocumentOutline, parseSymbols } from './code-navigation'
import { GitBlameView, generateMockBlameData, FileHistory, generateMockCommitHistory } from './git-blame'
import { AIRefactoringPanel } from './ai-refactoring-panel'
import { useAIAutocomplete } from '@/hooks/use-ai-autocomplete'
import { CodeIssue } from './code-editor'
import { FileNode, FileSystemState, createDefaultFileSystem, getNodePath, getLanguageTemplate } from '@/lib/file-system'
// New feature imports
import { BreadcrumbNavigation, BreadcrumbSymbol } from './breadcrumb-navigation'
import { BookmarksPanel, useBookmarks, BookmarkItem } from './bookmarks-panel'
import { LinterPanel, useLinter } from './linter-panel'
import { ImportOrganizer } from './import-organizer'
import { CodeCoverageViewer, generateMockReport, CoverageReport } from './code-coverage'
import { TypeCheckerPanel, useTypeChecker } from './type-checker'
import { Bookmark, Package, BarChart3, AlertCircle as TypeErrorIcon, GitMerge, Archive, GitPullRequest, MessageCircle, Code2, Maximize, Layout, PictureInPicture, Bug } from 'lucide-react'
// Additional feature imports
import { MergeConflictResolver } from './merge-conflict-resolver'
import { StashManager, useStashManager } from './stash-manager'
import { AIPRReview } from './ai-pr-review'
import { CodebaseChat } from './codebase-chat'
import { NaturalLanguageToCode } from './natural-language-to-code'
import { DebuggerPanel, useDebugger } from './debugger-panel'
import { ZenMode, useZenMode } from './zen-mode'
import { CustomLayouts, useCustomLayouts, PanelConfig } from './custom-layouts'
import { PiPPreview, usePiPPreview } from './pip-preview'
// Project management imports
import { EnvManager } from './env-manager'
import { NPMScriptRunner, useNPMScripts } from './npm-script-runner'
import { DependencyViewer } from './dependency-viewer'
import { ProjectTemplates } from './project-templates'
import { FeaturesHelpPanel } from './features-help-panel'
import { FolderPlus, Terminal as TerminalIcon, FileJson, Key, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

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
  const [openTabs, setOpenTabs] = useState<string[]>([])
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
  const [showDiffViewer, setShowDiffViewer] = useState(false)
  const [diffOriginalCode, setDiffOriginalCode] = useState('')
  const [savedVersions, setSavedVersions] = useState<Record<string, string>>({})
  const [selectedCode, setSelectedCode] = useState('')
  const [aiAutocompleteEnabled, setAiAutocompleteEnabled] = useState(true)
  const [activeLeftPanel, setActiveLeftPanel] = useState<'files' | 'git' | 'search' | 'bookmarks' | 'ai' | 'settings' | 'help'>('files')
  const [codeIssues, setCodeIssues] = useState<CodeIssue[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState(true) // Toggle for AI analysis
  const [commentCheckEnabled, setCommentCheckEnabled] = useState(true) // Toggle for comment/code mismatch
  const [ignoredIssues, setIgnoredIssues] = useState<Set<string>>(new Set())
  const [previewContent, setPreviewContent] = useState<{ html: string; css: string; js: string }>({ html: '', css: '', js: '' })
  const [project, setProject] = useState<ProjectData | null>(null)
  const [loadingProject, setLoadingProject] = useState(!!projectId)
  const [collaborationEnabled, setCollaborationEnabled] = useState(false)
  // New features state
  const [showGitBlame, setShowGitBlame] = useState(false)
  const [showFileHistory, setShowFileHistory] = useState(false)
  const [showRefactoringPanel, setShowRefactoringPanel] = useState(false)
  const [showDocumentOutline, setShowDocumentOutline] = useState(false)
  // Additional new features state
  const [showBookmarksPanel, setShowBookmarksPanel] = useState(false)
  const [showLinterPanel, setShowLinterPanel] = useState(false)
  const [showImportOrganizer, setShowImportOrganizer] = useState(false)
  const [showCoverageViewer, setShowCoverageViewer] = useState(false)
  const [showTypeChecker, setShowTypeChecker] = useState(false)
  const [coverageReport, setCoverageReport] = useState<CoverageReport | null>(null)
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [cursorLine, setCursorLine] = useState(1)
  // More new features state
  const [showMergeResolver, setShowMergeResolver] = useState(false)
  const [showStashManager, setShowStashManager] = useState(false)
  const [showPRReview, setShowPRReview] = useState(false)
  const [showCodebaseChat, setShowCodebaseChat] = useState(false)
  const [showNLToCode, setShowNLToCode] = useState(false)
  const [showDebugger, setShowDebugger] = useState(false)
  const [showCustomLayouts, setShowCustomLayouts] = useState(false)
  // Project management state
  const [showEnvManager, setShowEnvManager] = useState(false)
  const [showScriptRunner, setShowScriptRunner] = useState(false)
  const [showDependencyViewer, setShowDependencyViewer] = useState(false)
  const [showProjectTemplates, setShowProjectTemplates] = useState(false)
  const [showFeaturesHelp, setShowFeaturesHelp] = useState(false)
  const [envVariables, setEnvVariables] = useState<Array<{ key: string; value: string; isSecret: boolean }>>([
    { key: 'DATABASE_URL', value: 'postgresql://...', isSecret: true },
    { key: 'NEXT_PUBLIC_API_URL', value: 'https://api.example.com', isSecret: false }
  ])
  const [packageJson, setPackageJson] = useState<any>({
    name: 'my-project',
    version: '1.0.0',
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint'
    },
    dependencies: {
      'next': '^15.0.0',
      'react': '^18.3.0',
      'react-dom': '^18.3.0'
    },
    devDependencies: {
      'typescript': '^5.4.0',
      '@types/react': '^18.3.0',
      'tailwindcss': '^3.4.0'
    }
  })
  const analyzeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const editorRef = useRef<any>(null)

  const supabase = createClient()

  // New feature hooks
  const bookmarks = useBookmarks()
  const linter = useLinter(code, language)
  const typeChecker = useTypeChecker(code, language)
  const stashManager = useStashManager()
  const debugger_ = useDebugger()
  const zenMode = useZenMode()
  const pipPreview = usePiPPreview()
  const npmScripts = useNPMScripts(packageJson)
  const layoutConfig = useCustomLayouts({
    sidebar: true,
    sidebarWidth: 250,
    terminal: true,
    terminalHeight: 200,
    preview: true,
    previewWidth: 400,
    aiPanel: false,
    aiPanelWidth: 350,
    outputPanel: true,
    debugPanel: false
  })

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
    // New feature shortcuts
    'cmd+shift+b': () => {
      // Toggle bookmark at current line
      if (activeFileId) {
        const node = fileSystem.nodes[activeFileId]
        if (node) {
          const preview = code.split('\n')[cursorLine - 1]?.trim() || ''
          bookmarks?.toggleBookmarkAtLine?.(activeFileId, node.name, getNodePath(fileSystem, activeFileId), cursorLine, preview)
        }
      }
    },
    'cmd+shift+o': () => setShowImportOrganizer(true),
    'cmd+shift+z': () => zenMode?.toggleZenMode?.(),
    'f5': () => debugger_?.isDebugging ? debugger_?.continueExecution?.() : debugger_?.startDebugging?.(),
    'f10': () => debugger_?.stepOver?.(),
    'f11': () => debugger_?.stepInto?.(),
  })

  // Track recent files
  useEffect(() => {
    if (activeFileId && !recentFiles.includes(activeFileId)) {
      setRecentFiles(prev => [activeFileId, ...prev.slice(0, 9)])
    }
  }, [activeFileId])

  // Code navigation hook
  const codeNavigation = useCodeNavigation(
    Object.values(fileSystem.nodes).map(node => ({
      id: node.id,
      name: node.name,
      path: getNodePath(fileSystem, node.id),
      content: node.content
    }))
  )

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
      // Add to open tabs if not already open
      setOpenTabs(prev => prev.includes(nodeId) ? prev : [...prev, nodeId])
      // Update preview when selecting a file
      updatePreviewContent(node.content || '', node.language || 'javascript')
    }
  }

  const handleCloseTab = (nodeId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setOpenTabs(prev => {
      const newTabs = prev.filter(id => id !== nodeId)
      // If closing the active tab, switch to another tab
      if (activeFileId === nodeId && newTabs.length > 0) {
        const closedIndex = prev.indexOf(nodeId)
        const newActiveIndex = Math.min(closedIndex, newTabs.length - 1)
        const newActiveId = newTabs[newActiveIndex]
        const newNode = fileSystem.nodes[newActiveId]
        if (newNode) {
          setActiveFileId(newActiveId)
          setCode(newNode.content || '')
          setLanguage(newNode.language || 'javascript')
        }
      } else if (newTabs.length === 0) {
        setActiveFileId(null)
        setCode('')
      }
      return newTabs
    })
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
        onNewFolder={() => handleCreateFolder('root')}
        onSave={saveFile}
        onRun={runCode}
        projectName={project?.name}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <TooltipProvider delayDuration={200}>
        <div className="w-[48px] bg-[#333333] flex flex-col items-center py-2 border-r border-[#191919]">
          {/* Top Section - File Management */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveLeftPanel('files')}
                className={`w-[48px] h-[48px] flex items-center justify-center transition-colors relative ${
                  activeLeftPanel === 'files' ? 'text-white' : 'text-[#858585] hover:text-white'
                }`}
              >
                {activeLeftPanel === 'files' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 bg-white" />}
                <FileCode className="w-6 h-6" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#252526] border-[#454545] text-[#cccccc]">
              <p>Explorer</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowGlobalSearch(true)}
                className="w-[48px] h-[48px] flex items-center justify-center transition-colors relative text-[#858585] hover:text-white"
              >
                <Search className="w-6 h-6" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#252526] border-[#454545] text-[#cccccc]">
              <p>Search in Files <span className="text-[#808080] ml-2">Cmd+Shift+F</span></p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveLeftPanel('git')}
                className={`w-[48px] h-[48px] flex items-center justify-center transition-colors relative ${
                  activeLeftPanel === 'git' ? 'text-white' : 'text-[#858585] hover:text-white'
                }`}
              >
                {activeLeftPanel === 'git' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 bg-white" />}
                <GitBranch className="w-6 h-6" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#252526] border-[#454545] text-[#cccccc]">
              <p>Source Control</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowBookmarksPanel(true)}
                className={`w-[48px] h-[48px] flex items-center justify-center transition-colors relative ${
                  (bookmarks?.bookmarks || []).length > 0 ? 'text-blue-400' : 'text-[#858585] hover:text-white'
                }`}
              >
                <Bookmark className="w-6 h-6" />
                {(bookmarks?.bookmarks || []).length > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {(bookmarks?.bookmarks || []).length}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#252526] border-[#454545] text-[#cccccc]">
              <p>Bookmarks ({(bookmarks?.bookmarks || []).length})</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowDebuggerPanel(true)}
                className="w-[48px] h-[48px] flex items-center justify-center transition-colors relative text-[#858585] hover:text-white"
              >
                <Bug className="w-6 h-6" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#252526] border-[#454545] text-[#cccccc]">
              <p>Run and Debug</p>
            </TooltipContent>
          </Tooltip>

          <div className="flex-1" />

          {/* Bottom Section - AI & Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowAIPanel(!showAIPanel)}
                className={`w-[48px] h-[48px] flex items-center justify-center transition-colors relative ${
                  showAIPanel ? 'text-amber-500' : 'text-[#858585] hover:text-white'
                }`}
              >
                <MessageSquare className="w-6 h-6" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#252526] border-[#454545] text-[#cccccc]">
              <p>AI Assistant <span className="text-[#808080] ml-2">Cmd+Shift+A</span></p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowSettingsPanel(true)}
                className="w-[48px] h-[48px] flex items-center justify-center transition-colors relative text-[#858585] hover:text-white"
              >
                <Settings className="w-6 h-6" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#252526] border-[#454545] text-[#cccccc]">
              <p>Settings <span className="text-[#808080] ml-2">Cmd+,</span></p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowFeaturesHelp(true)}
                className="w-[48px] h-[48px] flex items-center justify-center transition-colors relative text-amber-500 hover:text-amber-400"
              >
                <HelpCircle className="w-6 h-6" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#252526] border-[#454545] text-[#cccccc]">
              <p>Help & Tutorial Guide</p>
            </TooltipContent>
          </Tooltip>
        </div>
        </TooltipProvider>

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
            <div className="flex items-center h-full overflow-x-auto max-w-[300px] scrollbar-thin">
              {openTabs.length > 0 ? (
                openTabs.map(tabId => {
                  const node = fileSystem.nodes[tabId]
                  if (!node) return null
                  const isActive = tabId === activeFileId
                  return (
                    <div
                      key={tabId}
                      onClick={() => handleSelectFile(tabId)}
                      className={`group flex items-center gap-1.5 px-3 h-full text-[13px] cursor-pointer border-r border-[#191919] transition-all duration-150 ${
                        isActive
                          ? 'bg-[#1e1e1e] text-[#ffffff] border-t-2 border-t-[#007acc]'
                          : 'bg-[#2d2d2d] text-[#969696] hover:bg-[#2a2a2a] border-t-2 border-t-transparent'
                      }`}
                    >
                      <FileCode className={`h-3.5 w-3.5 ${isActive ? 'text-[#519aba]' : 'text-[#6e6e6e]'}`} />
                      <span className="whitespace-nowrap">{node.name}</span>
                      <button
                        onClick={(e) => handleCloseTab(tabId, e)}
                        className={`ml-1 p-0.5 rounded hover:bg-[#3c3c3c] transition-all duration-150 ${
                          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })
              ) : (
                <div className="flex items-center gap-2 px-3 h-full bg-[#1e1e1e] text-[13px] text-[#808080] border-t-2 border-t-transparent">
                  <FileCode className="h-4 w-4 text-[#6e6e6e]" />
                  <span>No file open</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto toolbar-scroll flex-1 min-w-0 pr-2">
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="h-[26px] rounded-[3px] bg-[#3c3c3c] border border-[#3c3c3c] px-2 text-[12px] text-[#cccccc] focus:border-[#007acc] focus:outline-none cursor-pointer shrink-0 transition-all duration-150"
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
    className={`h-[26px] px-3 text-[12px] rounded-[3px] shrink-0 transition-all duration-150 ${
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
    className={`h-[26px] px-3 text-[12px] rounded-[3px] shrink-0 transition-all duration-150 ${
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
    className={`h-[26px] px-3 text-[12px] rounded-[3px] shrink-0 transition-all duration-150 ${
      showAIPanel
        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-500'
        : 'text-[#cccccc] hover:bg-[#3c3c3c]'
    }`}
  >
    <MessageSquare className="mr-1.5 h-4 w-4" />
  AI Chat
  </Button>
  {/* Command Palette Button */}
  <Button
    onClick={() => setShowCommandPalette(true)}
    size="sm"
    variant="ghost"
    className="h-[26px] px-3 text-[12px] rounded-[3px] text-[#cccccc] hover:bg-[#3c3c3c] shrink-0 transition-all duration-150"
    title="Command Palette (Cmd+Shift+P)"
  >
    <Command className="mr-1.5 h-4 w-4" />
  </Button>
  {/* Diff Viewer Button */}
  <Button
    onClick={() => {
      // Store current code as original if we haven't saved a version
      if (activeFileId && !savedVersions[activeFileId]) {
        setSavedVersions(prev => ({ ...prev, [activeFileId]: code }))
      }
      setDiffOriginalCode(savedVersions[activeFileId] || code)
      setShowDiffViewer(true)
    }}
    size="sm"
    variant="ghost"
    className="h-[26px] px-3 text-[12px] rounded-[3px] text-[#cccccc] hover:bg-[#3c3c3c] shrink-0 transition-all duration-150"
    title="Compare Changes"
  >
  <GitCompare className="h-4 w-4" />
  </Button>
  {/* Git Blame Button */}
  <Button
    onClick={() => setShowGitBlame(true)}
    size="sm"
    variant="ghost"
    className="h-[26px] px-3 text-[12px] rounded-[3px] text-[#cccccc] hover:bg-[#3c3c3c] shrink-0 transition-all duration-150"
    title="Git Blame"
  >
    <History className="h-4 w-4" />
  </Button>
  {/* Document Outline Button */}
  <Button
    onClick={() => setShowDocumentOutline(!showDocumentOutline)}
    size="sm"
    variant="ghost"
    className={`h-[26px] px-3 text-[12px] rounded-[3px] shrink-0 transition-all duration-150 ${
      showDocumentOutline
        ? 'bg-blue-500/20 text-blue-400'
        : 'text-[#cccccc] hover:bg-[#3c3c3c]'
    }`}
    title="Document Outline"
  >
    <ListTree className="h-4 w-4" />
  </Button>
{/* AI Refactoring Button */}
  <Button
  onClick={() => setShowRefactoringPanel(true)}
  size="sm"
  variant="ghost"
  className="h-[26px] px-3 text-[12px] rounded-[3px] text-[#cccccc] hover:bg-[#3c3c3c] shrink-0 transition-all duration-150"
  title="AI Refactoring"
  >
  <Wand2 className="h-4 w-4" />
  </Button>
  {/* Linter Panel Button */}
  <Button
    onClick={() => setShowLinterPanel(true)}
    size="sm"
    variant="ghost"
    className={`h-[26px] px-3 text-[12px] rounded-[3px] shrink-0 transition-all duration-150 ${
      (linter.issues || []).filter(i => i.severity === 'error').length > 0
        ? 'text-red-400'
        : (linter.issues || []).filter(i => i.severity === 'warning').length > 0
        ? 'text-yellow-400'
        : 'text-[#cccccc] hover:bg-[#3c3c3c]'
    }`}
    title="ESLint/Prettier"
  >
    <AlertCircle className="h-4 w-4" />
    {(linter.issues || []).length > 0 && (
      <span className="ml-1 text-[10px]">{(linter.issues || []).length}</span>
    )}
  </Button>
  {/* Import Organizer Button */}
  <Button
    onClick={() => setShowImportOrganizer(true)}
    size="sm"
    variant="ghost"
    className="h-[26px] px-3 text-[12px] rounded-[3px] text-[#cccccc] hover:bg-[#3c3c3c] shrink-0 transition-all duration-150"
    title="Organize Imports (Cmd+Shift+O)"
  >
    <Package className="h-4 w-4" />
  </Button>
  {/* Code Coverage Button */}
  <Button
    onClick={() => setShowCoverageViewer(true)}
    size="sm"
    variant="ghost"
    className={`h-[26px] px-3 text-[12px] rounded-[3px] shrink-0 transition-all duration-150 ${
      coverageReport
        ? 'text-green-400'
        : 'text-[#cccccc] hover:bg-[#3c3c3c]'
    }`}
    title="Code Coverage"
  >
    <BarChart3 className="h-4 w-4" />
  </Button>
{/* Type Checker Button */}
  <Button
  onClick={() => setShowTypeChecker(true)}
  size="sm"
  variant="ghost"
  className={`h-[26px] px-3 text-[12px] rounded-[3px] shrink-0 transition-all duration-150 ${
  (typeChecker.errors || []).filter(e => e.severity === 'error').length > 0
  ? 'text-red-400'
  : (typeChecker.errors || []).length > 0
  ? 'text-yellow-400'
  : 'text-[#cccccc] hover:bg-[#3c3c3c]'
  }`}
  title="TypeScript Type Checker"
  >
  <TypeErrorIcon className="h-4 w-4" />
  {(typeChecker.errors || []).length > 0 && (
    <span className="ml-1 text-[10px]">{(typeChecker.errors || []).length}</span>
  )}
  </Button>
  {/* Debugger Button */}
  <Button
    onClick={() => setShowDebugger(!showDebugger)}
    size="sm"
    variant="ghost"
    className={`h-[26px] px-3 text-[12px] rounded-[3px] shrink-0 transition-all duration-150 ${
      debugger_?.isDebugging
        ? debugger_?.isPaused
          ? 'text-yellow-400 bg-yellow-500/10'
          : 'text-green-400 bg-green-500/10'
        : 'text-[#cccccc] hover:bg-[#3c3c3c]'
    }`}
    title="Debugger"
  >
    <Bug className="h-4 w-4" />
  </Button>
  {/* AI PR Review Button */}
  <Button
    onClick={() => setShowPRReview(true)}
    size="sm"
    variant="ghost"
    className="h-[26px] px-3 text-[12px] rounded-[3px] text-[#cccccc] hover:bg-[#3c3c3c]"
    title="AI Code Review"
  >
    <GitPullRequest className="h-4 w-4" />
  </Button>
  {/* Codebase Chat Button */}
  <Button
    onClick={() => setShowCodebaseChat(true)}
    size="sm"
    variant="ghost"
    className="h-[26px] px-3 text-[12px] rounded-[3px] text-[#cccccc] hover:bg-[#3c3c3c]"
    title="Codebase Chat"
  >
    <MessageCircle className="h-4 w-4" />
  </Button>
  {/* NL to Code Button */}
  <Button
    onClick={() => setShowNLToCode(true)}
    size="sm"
    variant="ghost"
    className="h-[26px] px-3 text-[12px] rounded-[3px] text-[#cccccc] hover:bg-[#3c3c3c]"
    title="Natural Language to Code"
  >
    <Code2 className="h-4 w-4" />
  </Button>
  <div className="w-px h-4 bg-[#3c3c3c] mx-1" />
  {/* Zen Mode Button */}
  <Button
    onClick={() => zenMode?.toggleZenMode?.()}
    size="sm"
    variant="ghost"
    className="h-[26px] px-3 text-[12px] rounded-[3px] text-[#cccccc] hover:bg-[#3c3c3c]"
    title="Zen Mode (Cmd+Shift+Z)"
  >
    <Maximize className="h-4 w-4" />
  </Button>
  {/* Custom Layouts Button */}
  <Button
    onClick={() => setShowCustomLayouts(true)}
    size="sm"
    variant="ghost"
    className="h-[26px] px-3 text-[12px] rounded-[3px] text-[#cccccc] hover:bg-[#3c3c3c]"
    title="Workspace Layouts"
  >
    <Layout className="h-4 w-4" />
  </Button>
{/* PiP Preview Button */}
  <Button
onClick={() => pipPreview?.openPiP?.('/api/preview')}
    size="sm"
    variant="ghost"
    className={`h-[26px] px-3 text-[12px] rounded-[3px] ${
      pipPreview?.isOpen ? 'text-blue-400 bg-blue-500/10' : 'text-[#cccccc] hover:bg-[#3c3c3c]'
  }`}
  title="Picture-in-Picture Preview"
  >
  <PictureInPicture className="h-4 w-4" />
  </Button>
  {/* Help/Features Button */}
  <Button
    onClick={() => setShowFeaturesHelp(true)}
    size="sm"
    variant="ghost"
    className="h-[26px] px-3 text-[12px] rounded-[3px] text-amber-500 hover:bg-amber-500/10 transition-all duration-150"
    title="Features & Help"
  >
    <HelpCircle className="h-4 w-4" />
  </Button>
  <div className="w-px h-4 bg-[#3c3c3c] mx-1" />
  {/* Project Management Buttons */}
  <Button
    onClick={() => setShowProjectTemplates(true)}
    size="sm"
    variant="ghost"
    className="h-[26px] px-3 text-[12px] rounded-[3px] text-[#cccccc] hover:bg-[#3c3c3c]"
    title="New Project from Template"
  >
    <FolderPlus className="h-4 w-4" />
  </Button>
  <Button
    onClick={() => setShowEnvManager(true)}
    size="sm"
    variant="ghost"
    className="h-[26px] px-3 text-[12px] rounded-[3px] text-[#cccccc] hover:bg-[#3c3c3c]"
    title="Environment Variables"
  >
    <Key className="h-4 w-4" />
  </Button>
  <Button
    onClick={() => setShowScriptRunner(true)}
    size="sm"
    variant="ghost"
    className={`h-[26px] px-3 text-[12px] rounded-[3px] ${
      (npmScripts?.runningScripts?.size || 0) > 0 
        ? 'text-green-400 bg-green-500/10' 
        : 'text-[#cccccc] hover:bg-[#3c3c3c]'
    }`}
    title="NPM Scripts"
  >
    <TerminalIcon className="h-4 w-4" />
    {(npmScripts?.runningScripts?.size || 0) > 0 && (
      <span className="ml-1 text-[10px]">{npmScripts?.runningScripts?.size || 0}</span>
    )}
  </Button>
  <Button
    onClick={() => setShowDependencyViewer(true)}
    size="sm"
    variant="ghost"
    className="h-[26px] px-3 text-[12px] rounded-[3px] text-[#cccccc] hover:bg-[#3c3c3c]"
    title="Dependency Manager"
  >
    <FileJson className="h-4 w-4" />
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
  <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
  {/* Breadcrumb Navigation */}
  {activeFileId && (
    <BreadcrumbNavigation
      filePath={getNodePath(fileSystem, activeFileId)}
      code={code}
      cursorLine={cursorLine}
      onNavigate={(symbol) => {
        if (symbol.line && editorRef.current) {
          editorRef.current.revealLineInCenter(symbol.line)
          editorRef.current.setPosition({ lineNumber: symbol.line, column: 1 })
          editorRef.current.focus()
        }
      }}
    />
  )}
  <div className="flex-1 min-h-0">
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
  // Track cursor line for breadcrumb navigation
  setCursorLine(position.lineNumber)
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
              projectFiles={Object.values(fileSystem.nodes)
                .filter(n => n.type === 'file' && n.content)
                .map(n => ({
                  id: n.id,
                  name: n.name,
                  path: getNodePath(fileSystem, n.id),
                  content: n.content || '',
                  language: n.language || 'text'
                }))}
              currentFilePath={activeFileId ? getNodePath(fileSystem, activeFileId) : undefined}
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

      {/* VS Code-style Status Bar */}
      <div className="h-[22px] bg-[#007acc] flex items-center justify-between px-2 text-[11px] text-white shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveLeftPanel('git')} 
            className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors"
          >
            <GitBranch className="h-3.5 w-3.5" />
            <span>main</span>
          </button>
          <button 
            onClick={() => setShowIssuesPanel(!showIssuesPanel)}
            className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{codeIssues.filter(i => i.severity === 'error').length}</span>
            <AlertTriangle className="h-3.5 w-3.5 ml-1" />
            <span>{codeIssues.filter(i => i.severity === 'warning').length}</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/70">Ln {cursorLine}, Col 1</span>
          <span className="text-white/70">{language.toUpperCase()}</span>
          <span className="text-white/70">UTF-8</span>
          <button 
            onClick={() => setShowFeaturesHelp(true)}
            className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors"
          >
            <Info className="h-3.5 w-3.5" />
            <span>Volt IDE</span>
          </button>
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
          { id: 'compare-changes', name: 'Compare Changes (Diff)', icon: <GitCompare className="h-4 w-4" />, category: 'view', action: () => { setDiffOriginalCode(savedVersions[activeFileId || ''] || code); setShowDiffViewer(true) } },
          { id: 'git-blame', name: 'Show Git Blame', icon: <History className="h-4 w-4" />, category: 'view', action: () => setShowGitBlame(true) },
          { id: 'file-history', name: 'Show File History', icon: <History className="h-4 w-4" />, category: 'view', action: () => setShowFileHistory(true) },
          { id: 'document-outline', name: 'Toggle Document Outline', icon: <ListTree className="h-4 w-4" />, category: 'view', action: () => setShowDocumentOutline(!showDocumentOutline) },
          { id: 'ai-refactor', name: 'AI Refactoring', icon: <Wand2 className="h-4 w-4" />, category: 'ai', action: () => setShowRefactoringPanel(true) },
          { id: 'go-to-definition', name: 'Go to Definition', shortcut: ['F12'], category: 'navigation', action: () => {
            if (selectedCode) {
              const def = codeNavigation.goToDefinition(selectedCode.trim())
              if (def) {
                setActiveFileId(def.fileId)
                const node = fileSystem.nodes[def.fileId]
                if (node?.content) setCode(node.content)
              }
            }
          }},
          { id: 'find-references', name: 'Find All References', shortcut: ['Shift', 'F12'], category: 'navigation', action: () => {
            if (selectedCode) {
              codeNavigation.findAllReferences(selectedCode.trim())
            }
          }},
          // New feature commands
          { id: 'toggle-bookmark', name: 'Toggle Bookmark', shortcut: ['Cmd', 'Shift', 'B'], icon: <Bookmark className="h-4 w-4" />, category: 'navigation', action: () => {
            if (activeFileId) {
              const node = fileSystem.nodes[activeFileId]
              if (node) {
                const preview = code.split('\n')[cursorLine - 1]?.trim() || ''
                bookmarks?.toggleBookmarkAtLine?.(activeFileId, node.name, getNodePath(fileSystem, activeFileId), cursorLine, preview)
              }
            }
          }},
          { id: 'show-bookmarks', name: 'Show Bookmarks', icon: <Bookmark className="h-4 w-4" />, category: 'navigation', action: () => setShowBookmarksPanel(true) },
          { id: 'organize-imports', name: 'Organize Imports', shortcut: ['Cmd', 'Shift', 'O'], icon: <Package className="h-4 w-4" />, category: 'code', action: () => setShowImportOrganizer(true) },
          { id: 'show-linter', name: 'Show Linter Panel', icon: <AlertCircle className="h-4 w-4" />, category: 'code', action: () => setShowLinterPanel(true) },
          { id: 'show-coverage', name: 'Show Code Coverage', icon: <BarChart3 className="h-4 w-4" />, category: 'code', action: () => setShowCoverageViewer(true) },
          { id: 'show-type-checker', name: 'Show Type Checker', icon: <TypeErrorIcon className="h-4 w-4" />, category: 'code', action: () => setShowTypeChecker(true) },
          { id: 'run-tests', name: 'Run Tests with Coverage', icon: <BarChart3 className="h-4 w-4" />, category: 'code', action: () => {
            setIsRunningTests(true)
            setTimeout(() => {
              const files = Object.values(fileSystem.nodes)
                .filter(n => n.type === 'file')
                .map(n => ({
                  id: n.id,
                  name: n.name,
                  path: getNodePath(fileSystem, n.id),
                  content: n.content
                }))
              setCoverageReport(generateMockReport(files))
              setIsRunningTests(false)
              setShowCoverageViewer(true)
            }, 2000)
          }},
        ]}
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

      {/* Diff Viewer */}
      <DiffViewer
        isOpen={showDiffViewer}
        onClose={() => setShowDiffViewer(false)}
        originalCode={diffOriginalCode}
        modifiedCode={code}
        originalTitle={activeFileId ? `${fileSystem.nodes[activeFileId]?.name} (saved)` : 'Original'}
        modifiedTitle={activeFileId ? `${fileSystem.nodes[activeFileId]?.name} (current)` : 'Modified'}
        language={language}
      />

      {/* Git Blame View */}
      <GitBlameView
        isOpen={showGitBlame}
        onClose={() => setShowGitBlame(false)}
        fileName={activeFileId ? fileSystem.nodes[activeFileId]?.name || 'Untitled' : 'Untitled'}
        code={code}
        blameData={generateMockBlameData(code)}
        onLineClick={(line) => {
          // Could integrate with editor to jump to line
          console.log('[v0] Jump to line:', line)
        }}
      />

      {/* File History */}
      <FileHistory
        isOpen={showFileHistory}
        onClose={() => setShowFileHistory(false)}
        fileName={activeFileId ? fileSystem.nodes[activeFileId]?.name || 'Untitled' : 'Untitled'}
        commits={generateMockCommitHistory(activeFileId ? fileSystem.nodes[activeFileId]?.name || 'file' : 'file')}
        onCommitSelect={(commit) => {
          console.log('[v0] Selected commit:', commit.hash)
          // Could load the file version at that commit
          setShowFileHistory(false)
        }}
      />

      {/* AI Refactoring Panel */}
      <AIRefactoringPanel
        isOpen={showRefactoringPanel}
        onClose={() => setShowRefactoringPanel(false)}
        selectedCode={selectedCode || code}
        language={language}
        onApplyRefactoring={(refactoredCode) => {
          setCode(refactoredCode)
          handleCodeChange(refactoredCode)
        }}
      />

      {/* Go to Definition Dialog */}
      {codeNavigation.goToDefDialog && (
        <GoToDefinitionDialog
          isOpen={!!codeNavigation.goToDefDialog}
          onClose={() => codeNavigation.setGoToDefDialog(null)}
          symbol={codeNavigation.goToDefDialog.symbol}
          definitions={codeNavigation.goToDefDialog.definitions}
          onSelect={(def) => {
            setActiveFileId(def.fileId)
            const node = fileSystem.nodes[def.fileId]
            if (node?.content) setCode(node.content)
          }}
        />
      )}

      {/* Find References Dialog */}
      {codeNavigation.findRefsDialog && (
        <FindReferencesDialog
          isOpen={!!codeNavigation.findRefsDialog}
          onClose={() => codeNavigation.setFindRefsDialog(null)}
          symbol={codeNavigation.findRefsDialog.symbol}
          references={codeNavigation.findRefsDialog.references}
          definition={codeNavigation.findRefsDialog.definition}
          onSelect={(ref) => {
            setActiveFileId(ref.fileId)
            const node = fileSystem.nodes[ref.fileId]
            if (node?.content) setCode(node.content)
          }}
        />
      )}

      {/* Document Outline */}
      {showDocumentOutline && (
        <div className="fixed right-0 top-[50px] bottom-0 z-40">
          <DocumentOutline
            symbols={parseSymbols(code, activeFileId || 'main', activeFileId ? getNodePath(fileSystem, activeFileId) : 'main.ts')}
            onSelect={(symbol) => {
              // Jump to symbol line in editor
              if (editorRef.current && symbol.line) {
                editorRef.current.revealLineInCenter(symbol.line)
                editorRef.current.setPosition({ lineNumber: symbol.line, column: 1 })
                editorRef.current.focus()
              }
            }}
            isOpen={showDocumentOutline}
            onClose={() => setShowDocumentOutline(false)}
          />
        </div>
      )}

      {/* Bookmarks Panel */}
      <BookmarksPanel
        isOpen={showBookmarksPanel}
        onClose={() => setShowBookmarksPanel(false)}
        bookmarks={bookmarks?.bookmarks || []}
        groups={bookmarks?.groups || []}
        onAddBookmark={(bookmark) => bookmarks?.addBookmark?.(bookmark)}
        onRemoveBookmark={(id) => bookmarks?.removeBookmark?.(id)}
        onUpdateBookmark={(id, updates) => bookmarks?.updateBookmark?.(id, updates)}
        onNavigateToBookmark={(bookmark) => {
          setActiveFileId(bookmark.fileId)
          const node = fileSystem.nodes[bookmark.fileId]
          if (node?.content) {
            setCode(node.content)
            setTimeout(() => {
              if (editorRef.current) {
                editorRef.current.revealLineInCenter(bookmark.line)
                editorRef.current.setPosition({ lineNumber: bookmark.line, column: 1 })
                editorRef.current.focus()
              }
            }, 100)
          }
          setShowBookmarksPanel(false)
        }}
        onCreateGroup={(name) => bookmarks?.createGroup?.(name)}
        onDeleteGroup={(id) => bookmarks?.deleteGroup?.(id)}
        onMoveToGroup={(bookmarkId, groupId) => bookmarks?.moveToGroup?.(bookmarkId, groupId)}
        onToggleGroup={(groupId) => bookmarks?.toggleGroup?.(groupId)}
        currentFileId={activeFileId || undefined}
        currentLine={cursorLine}
      />

      {/* Linter Panel */}
      <LinterPanel
        isOpen={showLinterPanel}
        onClose={() => setShowLinterPanel(false)}
        issues={linter?.issues || []}
        isAnalyzing={linter?.isAnalyzing || false}
        config={linter?.config || { eslintEnabled: true, prettierEnabled: true, autoFixOnSave: true, showErrors: true, showWarnings: true, showInfo: true, showHints: true }}
        onConfigChange={linter?.updateConfig || (() => {})}
        onFixIssue={(issue) => {
          if (issue.fix) {
            setCode(issue.fix)
            handleCodeChange(issue.fix)
          }
        }}
        onFixAll={() => {
          const fixedCode = linter?.fixAllAuto?.()
          if (fixedCode) {
            setCode(fixedCode)
            handleCodeChange(fixedCode)
          }
        }}
        onNavigateToIssue={(issue) => {
          if (editorRef.current) {
            editorRef.current.revealLineInCenter(issue.line)
            editorRef.current.setPosition({ lineNumber: issue.line, column: issue.column || 1 })
            editorRef.current.focus()
          }
          setShowLinterPanel(false)
        }}
      />

      {/* Import Organizer */}
      <ImportOrganizer
        isOpen={showImportOrganizer}
        onClose={() => setShowImportOrganizer(false)}
        code={code}
        language={language}
        onApply={(organizedCode) => {
          setCode(organizedCode)
          handleCodeChange(organizedCode)
          setShowImportOrganizer(false)
        }}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettingsPanel}
        onClose={() => setShowSettingsPanel(false)}
        settings={editorSettings}
        onSettingsChange={setEditorSettings}
      />

      {/* Code Coverage Viewer */}
      <CodeCoverageViewer
        isOpen={showCoverageViewer}
        onClose={() => setShowCoverageViewer(false)}
        report={coverageReport}
        isRunning={isRunningTests}
        onRunTests={() => {
          setIsRunningTests(true)
          // Simulate running tests and generating coverage
          setTimeout(() => {
            const files = Object.values(fileSystem.nodes)
              .filter(n => n.type === 'file')
              .map(n => ({
                id: n.id,
                name: n.name,
                path: getNodePath(fileSystem, n.id),
                content: n.content
              }))
            setCoverageReport(generateMockReport(files))
            setIsRunningTests(false)
          }, 2000)
        }}
        onNavigateToFile={(fileId, line) => {
          setActiveFileId(fileId)
          const node = fileSystem.nodes[fileId]
          if (node?.content) {
            setCode(node.content)
            setTimeout(() => {
              if (editorRef.current && line) {
                editorRef.current.revealLineInCenter(line)
                editorRef.current.setPosition({ lineNumber: line, column: 1 })
                editorRef.current.focus()
              }
            }, 100)
          }
        }}
      />

      {/* Type Checker Panel */}
      <TypeCheckerPanel
        isOpen={showTypeChecker}
        onClose={() => setShowTypeChecker(false)}
        errors={typeChecker?.errors || []}
        isChecking={typeChecker?.isChecking || false}
        config={typeChecker?.config || { strict: true, noImplicitAny: true, strictNullChecks: true, noUnusedLocals: true, noUnusedParameters: true }}
        onConfigChange={typeChecker?.updateConfig || (() => {})}
        onNavigateToError={(error) => {
          if (editorRef.current) {
            editorRef.current.revealLineInCenter(error.line)
            editorRef.current.setPosition({ lineNumber: error.line, column: error.column || 1 })
            editorRef.current.focus()
          }
          setShowTypeChecker(false)
        }}
        onApplyFix={(error) => {
          if (error.fix) {
            setCode(error.fix)
            handleCodeChange(error.fix)
          }
        }}
      />

      {/* Merge Conflict Resolver */}
      <MergeConflictResolver
        isOpen={showMergeResolver}
        onClose={() => setShowMergeResolver(false)}
        fileName={activeFileId ? fileSystem.nodes[activeFileId]?.name || 'file' : 'file'}
        currentCode={code}
        incomingCode={savedVersions[activeFileId || ''] || code}
        baseCode={code}
        onResolve={(resolvedCode) => {
          setCode(resolvedCode)
          handleCodeChange(resolvedCode)
          setShowMergeResolver(false)
        }}
      />

      {/* Stash Manager */}
      <StashManager
        isOpen={showStashManager}
        onClose={() => setShowStashManager(false)}
        stashes={stashManager?.stashes || []}
        currentBranch="main"
        onCreateStash={(message) => {
          stashManager?.createStash?.(message)
        }}
        onApplyStash={(id, drop) => {
          stashManager?.applyStash?.(id, drop)
        }}
        onDropStash={stashManager?.dropStash || (() => {})}
        onClearAll={() => stashManager?.clearAll?.()}
      />

      {/* AI PR Review */}
      <AIPRReview
        isOpen={showPRReview}
        onClose={() => setShowPRReview(false)}
        code={code}
        originalCode={savedVersions[activeFileId || '']}
        fileName={activeFileId ? fileSystem.nodes[activeFileId]?.name || 'file' : 'file'}
        language={language}
        onApplySuggestion={(suggestion) => {
          setCode(suggestion)
          handleCodeChange(suggestion)
        }}
      />

      {/* Codebase Chat */}
      <CodebaseChat
        isOpen={showCodebaseChat}
        onClose={() => setShowCodebaseChat(false)}
        files={Object.values(fileSystem.nodes).filter(n => n.type === 'file').map(n => ({
          id: n.id,
          name: n.name,
          path: getNodePath(fileSystem, n.id),
          content: n.content
        }))}
        currentFile={activeFileId ? {
          id: activeFileId,
          name: fileSystem.nodes[activeFileId]?.name || 'file',
          path: getNodePath(fileSystem, activeFileId),
          content: code
        } : undefined}
        onNavigateToFile={(fileId) => {
          setActiveFileId(fileId)
          const node = fileSystem.nodes[fileId]
          if (node?.content) setCode(node.content)
        }}
        onInsertCode={(insertCode) => {
          if (editorRef.current) {
            const position = editorRef.current.getPosition()
            editorRef.current.executeEdits('codebase-chat', [{
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column
              },
              text: insertCode
            }])
          }
        }}
      />

      {/* Natural Language to Code */}
      <NaturalLanguageToCode
        isOpen={showNLToCode}
        onClose={() => setShowNLToCode(false)}
        language={language}
        currentCode={selectedCode || code}
        onInsertCode={(insertCode) => {
          if (editorRef.current) {
            const position = editorRef.current.getPosition()
            editorRef.current.executeEdits('nl-to-code', [{
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column
              },
              text: '\n' + insertCode + '\n'
            }])
          }
          setShowNLToCode(false)
        }}
        onReplaceCode={(newCode) => {
          setCode(newCode)
          handleCodeChange(newCode)
        }}
      />

      {/* Custom Layouts */}
      <CustomLayouts
        isOpen={showCustomLayouts}
        onClose={() => setShowCustomLayouts(false)}
        currentConfig={layoutConfig?.config || { sidebar: true, sidebarWidth: 250, terminal: true, terminalHeight: 200, preview: true, previewWidth: 400, aiPanel: false, aiPanelWidth: 350, outputPanel: true, debugPanel: false }}
        onApplyLayout={layoutConfig?.applyLayout || (() => {})}
        onSaveLayout={(name, config) => {
          console.log('[v0] Saved layout:', name, config)
        }}
      />

      {/* PiP Preview */}
      <PiPPreview
        isOpen={pipPreview?.isOpen || false}
        onClose={pipPreview?.closePiP || (() => {})}
        previewUrl={pipPreview?.previewUrl || '/api/preview'}
        onRefresh={() => {
          // Trigger preview refresh
        }}
      />

      {/* Zen Mode */}
      <ZenMode isActive={zenMode?.isZenMode || false} onExit={zenMode?.exitZenMode || (() => {})}>
        <CodeEditor
          code={code}
          onChange={handleCodeChange}
          language={language}
          issues={codeIssues}
          onEditorReady={(editor) => { editorRef.current = editor }}
        />
      </ZenMode>

      {/* Debugger Panel - Fixed position */}
      {showDebugger && (
        <div className="fixed right-0 top-[50px] bottom-0 w-80 z-40 shadow-xl">
          <DebuggerPanel
            breakpoints={debugger_?.breakpoints || []}
            onAddBreakpoint={debugger_?.addBreakpoint || (() => {})}
            onRemoveBreakpoint={debugger_?.removeBreakpoint || (() => {})}
            onToggleBreakpoint={debugger_?.toggleBreakpoint || (() => {})}
            onClearBreakpoints={debugger_?.clearBreakpoints || (() => {})}
            onNavigateToBreakpoint={(bp) => {
              setActiveFileId(bp.fileId)
              const node = fileSystem.nodes[bp.fileId]
              if (node?.content) {
                setCode(node.content)
                setTimeout(() => {
                  if (editorRef.current) {
                    editorRef.current.revealLineInCenter(bp.line)
                    editorRef.current.setPosition({ lineNumber: bp.line, column: 1 })
                  }
                }, 100)
              }
            }}
            isDebugging={debugger_?.isDebugging || false}
            isPaused={debugger_?.isPaused || false}
            onStartDebugging={debugger_?.startDebugging || (() => {})}
            onStopDebugging={debugger_?.stopDebugging || (() => {})}
            onContinue={debugger_?.continueExecution || (() => {})}
            onStepOver={debugger_?.stepOver || (() => {})}
            onStepInto={debugger_?.stepInto || (() => {})}
            onStepOut={debugger_?.stepOut || (() => {})}
            callStack={debugger_?.callStack || []}
            variables={debugger_?.variables || []}
            onStackFrameSelect={debugger_?.setCurrentFrame || (() => {})}
            currentFrame={debugger_?.currentFrame}
          />
        </div>
      )}

      {/* Features & Help Panel */}
      <FeaturesHelpPanel
        isOpen={showFeaturesHelp}
        onClose={() => setShowFeaturesHelp(false)}
      />

      {/* Environment Variables Manager */}
      <EnvManager
        isOpen={showEnvManager}
        onClose={() => setShowEnvManager(false)}
      />

      {/* NPM Script Runner */}
      <NPMScriptRunner
        isOpen={showScriptRunner}
        onClose={() => setShowScriptRunner(false)}
        scripts={npmScripts?.scripts || []}
        runningScripts={npmScripts?.runningScripts || new Set()}
        scriptOutputs={npmScripts?.scriptOutputs || {}}
        onRunScript={(name) => npmScripts?.runScript?.(name, (output) => {
          // Script completed
          console.log('[v0] Script completed:', name, output)
        })}
        onStopScript={npmScripts?.stopScript || (() => {})}
        onAddScript={(name, command) => {
          setPackageJson({
            ...packageJson,
            scripts: { ...packageJson.scripts, [name]: command }
          })
        }}
        onRemoveScript={(name) => {
          const { [name]: _, ...rest } = packageJson.scripts
          setPackageJson({ ...packageJson, scripts: rest })
        }}
      />

      {/* Dependency Viewer */}
      <DependencyViewer
        isOpen={showDependencyViewer}
        onClose={() => setShowDependencyViewer(false)}
        packageJson={packageJson}
        onUpdateDependency={(name, version) => {
          const isDev = packageJson.devDependencies?.[name]
          if (isDev) {
            setPackageJson({
              ...packageJson,
              devDependencies: { ...packageJson.devDependencies, [name]: version }
            })
          } else {
            setPackageJson({
              ...packageJson,
              dependencies: { ...packageJson.dependencies, [name]: version }
            })
          }
        }}
        onRemoveDependency={(name, type) => {
          if (type === 'devDependency') {
            const { [name]: _, ...rest } = packageJson.devDependencies
            setPackageJson({ ...packageJson, devDependencies: rest })
          } else {
            const { [name]: _, ...rest } = packageJson.dependencies
            setPackageJson({ ...packageJson, dependencies: rest })
          }
        }}
        onAddDependency={(name, version, type) => {
          if (type === 'devDependency') {
            setPackageJson({
              ...packageJson,
              devDependencies: { ...packageJson.devDependencies, [name]: version }
            })
          } else {
            setPackageJson({
              ...packageJson,
              dependencies: { ...packageJson.dependencies, [name]: version }
            })
          }
        }}
      />

      {/* Project Templates */}
      <ProjectTemplates
        isOpen={showProjectTemplates}
        onClose={() => setShowProjectTemplates(false)}
        onSelectTemplate={(template, projectName) => {
          // Create new project from template
          console.log('[v0] Creating project:', projectName, 'from template:', template.name)
          // Add template files to file system
          template.files.forEach(file => {
            console.log('[v0] Would create file:', file.path)
          })
          // Update package.json
          if (template.dependencies || template.devDependencies) {
            setPackageJson({
              ...packageJson,
              name: projectName,
              dependencies: { ...packageJson.dependencies, ...template.dependencies },
              devDependencies: { ...packageJson.devDependencies, ...template.devDependencies }
            })
          }
        }}
      />
    </div>
  )
}
