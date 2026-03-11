'use client'

import { useState, useEffect } from 'react'
import { 
  GitBranch, 
  Github, 
  Database, 
  Plus, 
  Check, 
  X, 
  RefreshCw, 
  Upload, 
  Download,
  GitCommit,
  GitPullRequest,
  FolderGit2,
  ChevronDown,
  ChevronRight,
  FileCode,
  Trash2,
  ExternalLink,
  LogOut,
  Settings,
  Lock
} from 'lucide-react'
import { Button } from './ui/button'
import { FileSystemState, FileNode } from '@/lib/file-system'

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  private: boolean
  default_branch: string
  html_url: string
}

interface GitHubBranch {
  name: string
  commit: { sha: string }
}

interface Commit {
  id: string
  message: string
  author: string
  date: string
  sha?: string
}

interface SourceControlPanelProps {
  fileSystem: FileSystemState
  onFileSystemChange: (fs: FileSystemState) => void
  projectId?: string
}

type VersionControlMode = 'select' | 'github' | 'local'

export function SourceControlPanel({ fileSystem, onFileSystemChange, projectId }: SourceControlPanelProps) {
  // Mode selection
  const [mode, setMode] = useState<VersionControlMode>('select')
  
  // GitHub state
  const [isGitHubConnected, setIsGitHubConnected] = useState(false)
  const [githubUser, setGithubUser] = useState<{ login: string; avatar_url: string } | null>(null)
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null)
  const [branches, setBranches] = useState<GitHubBranch[]>([])
  const [currentBranch, setCurrentBranch] = useState('main')
  const [isLoadingRepos, setIsLoadingRepos] = useState(false)
  const [showRepoSelector, setShowRepoSelector] = useState(false)
  
  // Local Git state
  const [localBranch, setLocalBranch] = useState('main')
  const [localBranches, setLocalBranches] = useState(['main'])
  const [showNewBranchInput, setShowNewBranchInput] = useState(false)
  const [newBranchName, setNewBranchName] = useState('')
  
  // Shared state
  const [stagedFiles, setStagedFiles] = useState<string[]>([])
  const [commitMessage, setCommitMessage] = useState('')
  const [commits, setCommits] = useState<Commit[]>([])
  const [isCommitting, setIsCommitting] = useState(false)
  const [isPushing, setIsPushing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    staged: true,
    changes: true,
    history: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Check GitHub connection on mount
  useEffect(() => {
    checkGitHubConnection()
    loadLocalCommits()
  }, [])

  const checkGitHubConnection = async () => {
    try {
      const res = await fetch('/api/github/repos')
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          setIsGitHubConnected(true)
          setGithubUser(data.user)
          setRepos(data.repos || [])
        }
      }
    } catch {
      // Not connected
    }
  }

  const loadLocalCommits = async () => {
    // Load commits from database if we have a project
    if (projectId) {
      try {
        const res = await fetch(`/api/projects/${projectId}/commits`)
        if (res.ok) {
          const data = await res.json()
          setCommits(data.commits || [])
        }
      } catch {
        // Use local state
      }
    }
  }

  const connectToGitHub = () => {
    window.location.href = '/api/auth/github'
  }

  const disconnectGitHub = async () => {
    try {
      await fetch('/api/auth/github/disconnect', { method: 'POST' })
      setIsGitHubConnected(false)
      setGithubUser(null)
      setRepos([])
      setSelectedRepo(null)
      setMode('select')
    } catch {
      setError('Failed to disconnect from GitHub')
    }
  }

  const selectRepo = async (repo: GitHubRepo) => {
    setSelectedRepo(repo)
    setShowRepoSelector(false)
    setCurrentBranch(repo.default_branch)
    
    // Fetch branches
    try {
      const res = await fetch(`/api/github/repos/${repo.full_name.split('/')[0]}/${repo.name}/branches`)
      if (res.ok) {
        const data = await res.json()
        setBranches(data.branches || [])
      }
    } catch {
      setError('Failed to fetch branches')
    }
  }

  const cloneRepo = async () => {
    if (!selectedRepo) return
    setIsPulling(true)
    setError(null)
    
    try {
      const [owner, repo] = selectedRepo.full_name.split('/')
      const res = await fetch(`/api/github/repos/${owner}/${repo}/contents?ref=${currentBranch}`)
      
      if (res.ok) {
        const data = await res.json()
        
        // Convert GitHub files to our file system
        const newNodes: Record<string, FileNode> = {
          root: { id: 'root', name: selectedRepo.name, type: 'folder', children: [] }
        }
        
        const processFiles = (files: any[], parentId: string) => {
          files.forEach((file: any) => {
            const nodeId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            
            if (file.type === 'file') {
              newNodes[nodeId] = {
                id: nodeId,
                name: file.name,
                type: 'file',
                content: file.content || '',
                language: getLanguageFromFilename(file.name),
                parentId,
              }
            } else if (file.type === 'dir') {
              newNodes[nodeId] = {
                id: nodeId,
                name: file.name,
                type: 'folder',
                children: [],
                parentId,
              }
              if (file.children) {
                processFiles(file.children, nodeId)
              }
            }
            
            const parent = newNodes[parentId]
            if (parent.type === 'folder') {
              parent.children = [...(parent.children || []), nodeId]
            }
          })
        }
        
        processFiles(data.files || [], 'root')
        onFileSystemChange({ rootId: 'root', nodes: newNodes })
        setSuccess(`Cloned ${selectedRepo.name} successfully!`)
      } else {
        throw new Error('Failed to fetch repository contents')
      }
    } catch (err) {
      setError('Failed to clone repository')
    } finally {
      setIsPulling(false)
    }
  }

  const getLanguageFromFilename = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    const map: Record<string, string> = {
      js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
      py: 'python', java: 'java', cpp: 'cpp', c: 'c', go: 'go', rs: 'rust',
      rb: 'ruby', php: 'php', html: 'html', css: 'css', json: 'json',
      md: 'markdown', yaml: 'yaml', yml: 'yaml', sql: 'sql',
    }
    return map[ext || ''] || 'plaintext'
  }

  const getModifiedFiles = (): FileNode[] => {
    return Object.values(fileSystem.nodes).filter(
      node => node.type === 'file' && node.name && !stagedFiles.includes(node.id)
    )
  }

  const stageFile = (fileId: string) => {
    setStagedFiles(prev => [...prev, fileId])
  }

  const unstageFile = (fileId: string) => {
    setStagedFiles(prev => prev.filter(id => id !== fileId))
  }

  const stageAll = () => {
    const allFiles = Object.values(fileSystem.nodes)
      .filter(n => n.type === 'file' && n.name)
      .map(n => n.id)
    setStagedFiles(allFiles)
  }

  const unstageAll = () => {
    setStagedFiles([])
  }

  const commitChanges = async () => {
    if (!commitMessage.trim() || stagedFiles.length === 0) return
    
    setIsCommitting(true)
    setError(null)
    
    try {
      if (mode === 'github' && selectedRepo) {
        // Commit to GitHub
        const [owner, repo] = selectedRepo.full_name.split('/')
        const filesToCommit = stagedFiles.map(id => {
          const node = fileSystem.nodes[id]
          return {
            path: node.name,
            content: node.content || '',
          }
        })
        
        const res = await fetch(`/api/github/repos/${owner}/${repo}/commits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: commitMessage,
            branch: currentBranch,
            files: filesToCommit,
          }),
        })
        
        if (!res.ok) throw new Error('Failed to commit to GitHub')
        
        const data = await res.json()
        setCommits(prev => [{
          id: data.sha,
          sha: data.sha,
          message: commitMessage,
          author: githubUser?.login || 'unknown',
          date: new Date().toISOString(),
        }, ...prev])
      } else {
        // Local commit - save to database
        const newCommit: Commit = {
          id: `commit-${Date.now()}`,
          message: commitMessage,
          author: 'local-user',
          date: new Date().toISOString(),
        }
        
        if (projectId) {
          await fetch(`/api/projects/${projectId}/commits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              commit: newCommit,
              files: stagedFiles.map(id => ({
                fileId: id,
                content: fileSystem.nodes[id]?.content || '',
              })),
            }),
          })
        }
        
        setCommits(prev => [newCommit, ...prev])
      }
      
      setStagedFiles([])
      setCommitMessage('')
      setSuccess('Changes committed successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Failed to commit changes')
    } finally {
      setIsCommitting(false)
    }
  }

  const pushChanges = async () => {
    if (mode !== 'github' || !selectedRepo) return
    
    setIsPushing(true)
    setError(null)
    
    try {
      // Already pushed when committing to GitHub
      setSuccess('Changes pushed to GitHub!')
      setTimeout(() => setSuccess(null), 3000)
    } finally {
      setIsPushing(false)
    }
  }

  const pullChanges = async () => {
    if (mode !== 'github' || !selectedRepo) return
    await cloneRepo()
  }

  const createBranch = (isGitHub: boolean) => {
    if (!newBranchName.trim()) return
    
    if (isGitHub) {
      // Create GitHub branch via API
      // For now, just add locally
      setBranches(prev => [...prev, { name: newBranchName, commit: { sha: '' } }])
      setCurrentBranch(newBranchName)
    } else {
      setLocalBranches(prev => [...prev, newBranchName])
      setLocalBranch(newBranchName)
    }
    
    setNewBranchName('')
    setShowNewBranchInput(false)
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // Mode selection screen
  if (mode === 'select') {
    return (
      <div className="h-full flex flex-col bg-[#252526]">
        <div className="flex items-center h-[35px] px-4 bg-[#252526] border-b border-[#191919]">
          <span className="text-[11px] font-semibold text-white uppercase tracking-wide">Source Control</span>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="text-center mb-6">
            <FolderGit2 className="w-12 h-12 text-[#4ec9b0] mx-auto mb-3" />
            <h3 className="text-white font-medium mb-2">Choose Version Control</h3>
            <p className="text-[#808080] text-xs">Select how you want to manage your code</p>
          </div>
          
          {/* GitHub Option */}
          <button
            onClick={() => {
              if (isGitHubConnected) {
                setMode('github')
              } else {
                connectToGitHub()
              }
            }}
            className="w-full p-4 mb-3 bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg hover:border-[#007acc] transition-colors text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <Github className="w-6 h-6 text-white" />
              <span className="text-white font-medium">GitHub</span>
              {isGitHubConnected && (
                <span className="ml-auto text-[10px] px-2 py-0.5 bg-[#89d185]/20 text-[#89d185] rounded">Connected</span>
              )}
            </div>
            <p className="text-[#808080] text-xs">
              Connect to GitHub to push, pull, and sync your code with remote repositories.
            </p>
            {isGitHubConnected && githubUser && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#3c3c3c]">
                <img src={githubUser.avatar_url} alt="" className="w-5 h-5 rounded-full" />
                <span className="text-[#cccccc] text-xs">{githubUser.login}</span>
              </div>
            )}
          </button>
          
          {/* Local Option */}
          <button
            onClick={() => setMode('local')}
            className="w-full p-4 bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg hover:border-[#007acc] transition-colors text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <Database className="w-6 h-6 text-[#4ec9b0]" />
              <span className="text-white font-medium">Local Version Control</span>
            </div>
            <p className="text-[#808080] text-xs">
              Use our built-in version control system. Your commits are saved to the cloud database.
            </p>
          </button>
        </div>
      </div>
    )
  }

  // GitHub mode
  if (mode === 'github') {
    return (
      <div className="h-full flex flex-col bg-[#252526]">
        {/* Header */}
        <div className="flex items-center justify-between h-[35px] px-4 bg-[#252526] border-b border-[#191919]">
          <div className="flex items-center gap-2">
            <button onClick={() => setMode('select')} className="text-[#808080] hover:text-white">
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <Github className="w-4 h-4 text-white" />
            <span className="text-[11px] font-semibold text-white uppercase tracking-wide">GitHub</span>
          </div>
          <button
            onClick={disconnectGitHub}
            className="p-1 hover:bg-[#3e3e42] rounded text-[#808080] hover:text-white"
            title="Disconnect"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Repository Selector */}
          <div className="p-3 border-b border-[#191919]">
            {selectedRepo ? (
              <button
                onClick={() => setShowRepoSelector(!showRepoSelector)}
                className="w-full flex items-center justify-between p-2 bg-[#1e1e1e] rounded hover:bg-[#2d2d2d] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-[#4ec9b0]" />
                  <span className="text-[#cccccc] text-xs">{selectedRepo.full_name}</span>
                  {selectedRepo.private && <Lock className="w-3 h-3 text-[#808080]" />}
                </div>
                <ChevronDown className={`w-4 h-4 text-[#808080] transition-transform ${showRepoSelector ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <button
                onClick={() => setShowRepoSelector(true)}
                className="w-full flex items-center justify-center gap-2 p-2 bg-[#1e1e1e] border border-dashed border-[#3c3c3c] rounded hover:border-[#007acc] transition-colors"
              >
                <Plus className="w-4 h-4 text-[#808080]" />
                <span className="text-[#808080] text-xs">Select Repository</span>
              </button>
            )}
            
            {showRepoSelector && (
              <div className="mt-2 max-h-[200px] overflow-y-auto bg-[#1e1e1e] border border-[#3c3c3c] rounded">
                {repos.map(repo => (
                  <button
                    key={repo.id}
                    onClick={() => selectRepo(repo)}
                    className="w-full flex items-center gap-2 p-2 hover:bg-[#2d2d2d] transition-colors text-left"
                  >
                    <FolderGit2 className="w-4 h-4 text-[#4ec9b0]" />
                    <span className="text-[#cccccc] text-xs flex-1">{repo.name}</span>
                    {repo.private && <Lock className="w-3 h-3 text-[#808080]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedRepo && (
            <>
              {/* Branch Selector */}
              <div className="p-3 border-b border-[#191919]">
                <div className="flex items-center gap-2 mb-2">
                  <GitBranch className="w-4 h-4 text-[#4ec9b0]" />
                  <select
                    value={currentBranch}
                    onChange={(e) => setCurrentBranch(e.target.value)}
                    className="flex-1 bg-[#1e1e1e] text-[#cccccc] text-xs p-1.5 rounded border border-[#3c3c3c]"
                  >
                    {branches.map(b => (
                      <option key={b.name} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowNewBranchInput(!showNewBranchInput)}
                    className="p-1 hover:bg-[#3e3e42] rounded text-[#808080] hover:text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {showNewBranchInput && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      placeholder="New branch name"
                      className="flex-1 bg-[#1e1e1e] text-[#cccccc] text-xs p-1.5 rounded border border-[#3c3c3c]"
                    />
                    <button
                      onClick={() => createBranch(true)}
                      className="p-1 bg-[#0e639c] hover:bg-[#1177bb] rounded text-white"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Sync buttons */}
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    onClick={cloneRepo}
                    disabled={isPulling}
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-xs bg-[#1e1e1e] border-[#3c3c3c] text-[#cccccc] hover:bg-[#2d2d2d]"
                  >
                    {isPulling ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Download className="w-3 h-3 mr-1" />}
                    Pull
                  </Button>
                  <Button
                    onClick={pushChanges}
                    disabled={isPushing || commits.length === 0}
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-xs bg-[#1e1e1e] border-[#3c3c3c] text-[#cccccc] hover:bg-[#2d2d2d]"
                  >
                    {isPushing ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                    Push
                  </Button>
                </div>
              </div>

              {/* Staged Files */}
              <div className="border-b border-[#191919]">
                <button
                  onClick={() => toggleSection('staged')}
                  className="w-full flex items-center justify-between p-3 hover:bg-[#2a2d2e]"
                >
                  <div className="flex items-center gap-2">
                    {expandedSections.staged ? <ChevronDown className="w-4 h-4 text-[#808080]" /> : <ChevronRight className="w-4 h-4 text-[#808080]" />}
                    <span className="text-[#cccccc] text-xs font-medium">Staged Changes</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-[#4ec9b0]/20 text-[#4ec9b0] rounded">{stagedFiles.length}</span>
                  </div>
                  {stagedFiles.length > 0 && (
                    <button onClick={(e) => { e.stopPropagation(); unstageAll(); }} className="text-[#808080] hover:text-white text-[10px]">
                      Unstage All
                    </button>
                  )}
                </button>
                {expandedSections.staged && stagedFiles.length > 0 && (
                  <div className="pb-2">
                    {stagedFiles.map(id => {
                      const file = fileSystem.nodes[id]
                      if (!file) return null
                      return (
                        <div key={id} className="flex items-center justify-between px-3 py-1 hover:bg-[#2a2d2e] group">
                          <div className="flex items-center gap-2">
                            <FileCode className="w-3.5 h-3.5 text-[#4ec9b0]" />
                            <span className="text-[#cccccc] text-xs">{file.name}</span>
                          </div>
                          <button
                            onClick={() => unstageFile(id)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#3e3e42] rounded"
                          >
                            <X className="w-3 h-3 text-[#808080]" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Changes */}
              <div className="border-b border-[#191919]">
                <button
                  onClick={() => toggleSection('changes')}
                  className="w-full flex items-center justify-between p-3 hover:bg-[#2a2d2e]"
                >
                  <div className="flex items-center gap-2">
                    {expandedSections.changes ? <ChevronDown className="w-4 h-4 text-[#808080]" /> : <ChevronRight className="w-4 h-4 text-[#808080]" />}
                    <span className="text-[#cccccc] text-xs font-medium">Changes</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-[#cca700]/20 text-[#cca700] rounded">{getModifiedFiles().length}</span>
                  </div>
                  {getModifiedFiles().length > 0 && (
                    <button onClick={(e) => { e.stopPropagation(); stageAll(); }} className="text-[#808080] hover:text-white text-[10px]">
                      Stage All
                    </button>
                  )}
                </button>
                {expandedSections.changes && (
                  <div className="pb-2">
                    {getModifiedFiles().map(file => (
                      <div key={file.id} className="flex items-center justify-between px-3 py-1 hover:bg-[#2a2d2e] group">
                        <div className="flex items-center gap-2">
                          <FileCode className="w-3.5 h-3.5 text-[#cca700]" />
                          <span className="text-[#cccccc] text-xs">{file.name}</span>
                        </div>
                        <button
                          onClick={() => stageFile(file.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#3e3e42] rounded"
                        >
                          <Plus className="w-3 h-3 text-[#808080]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Commit Input */}
              {stagedFiles.length > 0 && (
                <div className="p-3 border-b border-[#191919]">
                  <textarea
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Commit message"
                    className="w-full h-16 bg-[#1e1e1e] text-[#cccccc] text-xs p-2 rounded border border-[#3c3c3c] resize-none"
                  />
                  <Button
                    onClick={commitChanges}
                    disabled={!commitMessage.trim() || isCommitting}
                    size="sm"
                    className="w-full mt-2 h-7 text-xs bg-[#0e639c] hover:bg-[#1177bb]"
                  >
                    {isCommitting ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <GitCommit className="w-3 h-3 mr-1" />}
                    Commit & Push
                  </Button>
                </div>
              )}

              {/* Commit History */}
              <div>
                <button
                  onClick={() => toggleSection('history')}
                  className="w-full flex items-center gap-2 p-3 hover:bg-[#2a2d2e]"
                >
                  {expandedSections.history ? <ChevronDown className="w-4 h-4 text-[#808080]" /> : <ChevronRight className="w-4 h-4 text-[#808080]" />}
                  <span className="text-[#cccccc] text-xs font-medium">Commit History</span>
                </button>
                {expandedSections.history && (
                  <div className="pb-2">
                    {commits.length === 0 ? (
                      <p className="text-[#808080] text-xs px-3 py-2">No commits yet</p>
                    ) : (
                      commits.slice(0, 10).map(commit => (
                        <div key={commit.id} className="px-3 py-2 hover:bg-[#2a2d2e]">
                          <div className="flex items-center gap-2 mb-1">
                            <GitCommit className="w-3 h-3 text-[#4ec9b0]" />
                            <span className="text-[#cccccc] text-xs font-medium truncate">{commit.message}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-[#808080] ml-5">
                            <span>{commit.author}</span>
                            <span>•</span>
                            <span>{new Date(commit.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {!selectedRepo && (
            <div className="p-4 text-center">
              <p className="text-[#808080] text-xs">Select a repository to get started</p>
            </div>
          )}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-2 bg-[#5a1d1d] text-[#f48771] text-xs">
            {error}
          </div>
        )}
        {success && (
          <div className="p-2 bg-[#1d3d1d] text-[#89d185] text-xs">
            {success}
          </div>
        )}
      </div>
    )
  }

  // Local mode
  return (
    <div className="h-full flex flex-col bg-[#252526]">
      {/* Header */}
      <div className="flex items-center justify-between h-[35px] px-4 bg-[#252526] border-b border-[#191919]">
        <div className="flex items-center gap-2">
          <button onClick={() => setMode('select')} className="text-[#808080] hover:text-white">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <Database className="w-4 h-4 text-[#4ec9b0]" />
          <span className="text-[11px] font-semibold text-white uppercase tracking-wide">Local Git</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Branch Selector */}
        <div className="p-3 border-b border-[#191919]">
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className="w-4 h-4 text-[#4ec9b0]" />
            <select
              value={localBranch}
              onChange={(e) => setLocalBranch(e.target.value)}
              className="flex-1 bg-[#1e1e1e] text-[#cccccc] text-xs p-1.5 rounded border border-[#3c3c3c]"
            >
              {localBranches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <button
              onClick={() => setShowNewBranchInput(!showNewBranchInput)}
              className="p-1 hover:bg-[#3e3e42] rounded text-[#808080] hover:text-white"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {showNewBranchInput && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="New branch name"
                className="flex-1 bg-[#1e1e1e] text-[#cccccc] text-xs p-1.5 rounded border border-[#3c3c3c]"
              />
              <button
                onClick={() => createBranch(false)}
                className="p-1 bg-[#0e639c] hover:bg-[#1177bb] rounded text-white"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Staged Files */}
        <div className="border-b border-[#191919]">
          <button
            onClick={() => toggleSection('staged')}
            className="w-full flex items-center justify-between p-3 hover:bg-[#2a2d2e]"
          >
            <div className="flex items-center gap-2">
              {expandedSections.staged ? <ChevronDown className="w-4 h-4 text-[#808080]" /> : <ChevronRight className="w-4 h-4 text-[#808080]" />}
              <span className="text-[#cccccc] text-xs font-medium">Staged Changes</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-[#4ec9b0]/20 text-[#4ec9b0] rounded">{stagedFiles.length}</span>
            </div>
            {stagedFiles.length > 0 && (
              <button onClick={(e) => { e.stopPropagation(); unstageAll(); }} className="text-[#808080] hover:text-white text-[10px]">
                Unstage All
              </button>
            )}
          </button>
          {expandedSections.staged && stagedFiles.length > 0 && (
            <div className="pb-2">
              {stagedFiles.map(id => {
                const file = fileSystem.nodes[id]
                if (!file) return null
                return (
                  <div key={id} className="flex items-center justify-between px-3 py-1 hover:bg-[#2a2d2e] group">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-3.5 h-3.5 text-[#4ec9b0]" />
                      <span className="text-[#cccccc] text-xs">{file.name}</span>
                    </div>
                    <button
                      onClick={() => unstageFile(id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#3e3e42] rounded"
                    >
                      <X className="w-3 h-3 text-[#808080]" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Changes */}
        <div className="border-b border-[#191919]">
          <button
            onClick={() => toggleSection('changes')}
            className="w-full flex items-center justify-between p-3 hover:bg-[#2a2d2e]"
          >
            <div className="flex items-center gap-2">
              {expandedSections.changes ? <ChevronDown className="w-4 h-4 text-[#808080]" /> : <ChevronRight className="w-4 h-4 text-[#808080]" />}
              <span className="text-[#cccccc] text-xs font-medium">Changes</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-[#cca700]/20 text-[#cca700] rounded">{getModifiedFiles().length}</span>
            </div>
            {getModifiedFiles().length > 0 && (
              <button onClick={(e) => { e.stopPropagation(); stageAll(); }} className="text-[#808080] hover:text-white text-[10px]">
                Stage All
              </button>
            )}
          </button>
          {expandedSections.changes && (
            <div className="pb-2">
              {getModifiedFiles().map(file => (
                <div key={file.id} className="flex items-center justify-between px-3 py-1 hover:bg-[#2a2d2e] group">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-[#cca700]" />
                    <span className="text-[#cccccc] text-xs">{file.name}</span>
                  </div>
                  <button
                    onClick={() => stageFile(file.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#3e3e42] rounded"
                  >
                    <Plus className="w-3 h-3 text-[#808080]" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Commit Input */}
        {stagedFiles.length > 0 && (
          <div className="p-3 border-b border-[#191919]">
            <textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Commit message"
              className="w-full h-16 bg-[#1e1e1e] text-[#cccccc] text-xs p-2 rounded border border-[#3c3c3c] resize-none"
            />
            <Button
              onClick={commitChanges}
              disabled={!commitMessage.trim() || isCommitting}
              size="sm"
              className="w-full mt-2 h-7 text-xs bg-[#0e639c] hover:bg-[#1177bb]"
            >
              {isCommitting ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <GitCommit className="w-3 h-3 mr-1" />}
              Commit
            </Button>
          </div>
        )}

        {/* Commit History */}
        <div>
          <button
            onClick={() => toggleSection('history')}
            className="w-full flex items-center gap-2 p-3 hover:bg-[#2a2d2e]"
          >
            {expandedSections.history ? <ChevronDown className="w-4 h-4 text-[#808080]" /> : <ChevronRight className="w-4 h-4 text-[#808080]" />}
            <span className="text-[#cccccc] text-xs font-medium">Commit History</span>
          </button>
          {expandedSections.history && (
            <div className="pb-2">
              {commits.length === 0 ? (
                <p className="text-[#808080] text-xs px-3 py-2">No commits yet</p>
              ) : (
                commits.slice(0, 10).map(commit => (
                  <div key={commit.id} className="px-3 py-2 hover:bg-[#2a2d2e]">
                    <div className="flex items-center gap-2 mb-1">
                      <GitCommit className="w-3 h-3 text-[#4ec9b0]" />
                      <span className="text-[#cccccc] text-xs font-medium truncate">{commit.message}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#808080] ml-5">
                      <span>{commit.author}</span>
                      <span>•</span>
                      <span>{new Date(commit.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-2 bg-[#5a1d1d] text-[#f48771] text-xs">
          {error}
        </div>
      )}
      {success && (
        <div className="p-2 bg-[#1d3d1d] text-[#89d185] text-xs">
          {success}
        </div>
      )}
    </div>
  )
}
