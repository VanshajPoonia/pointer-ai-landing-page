'use client'

import { useState, useEffect } from 'react'
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  Plus, 
  Minus, 
  Check, 
  X, 
  RefreshCw, 
  Upload, 
  Download,
  History,
  ChevronRight,
  ChevronDown,
  File,
  FolderGit2,
  Settings,
  Link,
  Unlink
} from 'lucide-react'
import { Button } from './ui/button'
import { FileSystemState } from '@/lib/file-system'

interface GitCommitType {
  id: string
  message: string
  timestamp: Date
  author: string
  files: string[]
}

interface GitChange {
  filename: string
  status: 'added' | 'modified' | 'deleted'
  staged: boolean
}

interface GitPanelProps {
  fileSystem: FileSystemState
  onFileSystemChange: (fs: FileSystemState) => void
}

export function GitPanel({ fileSystem, onFileSystemChange }: GitPanelProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')
  const [repoName, setRepoName] = useState('')
  const [currentBranch, setCurrentBranch] = useState('main')
  const [branches, setBranches] = useState(['main', 'develop'])
  const [showBranches, setShowBranches] = useState(false)
  const [newBranchName, setNewBranchName] = useState('')
  const [showNewBranch, setShowNewBranch] = useState(false)
  
  const [changes, setChanges] = useState<GitChange[]>([])
  const [commits, setCommits] = useState<GitCommitType[]>([])
  const [commitMessage, setCommitMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [githubToken, setGithubToken] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Track file changes (simulated - in real app would compare with last commit)
  useEffect(() => {
    const trackedChanges: GitChange[] = []
    Object.values(fileSystem.nodes).forEach(node => {
      if (node.type === 'file' && node.name) {
        // Simulate some files as changed
        trackedChanges.push({
          filename: node.name,
          status: 'modified',
          staged: false,
        })
      }
    })
    // For demo, show first 3 files as changes
    setChanges(trackedChanges.slice(0, 3))
  }, [fileSystem])

  const stageFile = (filename: string) => {
    setChanges(prev => prev.map(c => 
      c.filename === filename ? { ...c, staged: true } : c
    ))
  }

  const unstageFile = (filename: string) => {
    setChanges(prev => prev.map(c => 
      c.filename === filename ? { ...c, staged: false } : c
    ))
  }

  const stageAll = () => {
    setChanges(prev => prev.map(c => ({ ...c, staged: true })))
  }

  const unstageAll = () => {
    setChanges(prev => prev.map(c => ({ ...c, staged: false })))
  }

  const handleCommit = () => {
    if (!commitMessage.trim()) {
      setError('Please enter a commit message')
      return
    }

    const stagedFiles = changes.filter(c => c.staged)
    if (stagedFiles.length === 0) {
      setError('No files staged for commit')
      return
    }

    const newCommit: GitCommitType = {
      id: Math.random().toString(36).substring(7),
      message: commitMessage,
      timestamp: new Date(),
      author: 'volt-user',
      files: stagedFiles.map(f => f.filename),
    }

    setCommits(prev => [newCommit, ...prev])
    setChanges(prev => prev.filter(c => !c.staged))
    setCommitMessage('')
    setSuccess('Committed successfully!')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handlePush = async () => {
    if (!isConnected) {
      setError('Not connected to a repository')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // In a real implementation, this would call the GitHub API
      await new Promise(resolve => setTimeout(resolve, 1500))
      setSuccess('Pushed to remote successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to push to remote')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePull = async () => {
    if (!isConnected) {
      setError('Not connected to a repository')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setSuccess('Pulled from remote successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to pull from remote')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async () => {
    if (!repoUrl.trim()) {
      setError('Please enter a repository URL')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Parse repo URL to get name
      const urlParts = repoUrl.replace(/\.git$/, '').split('/')
      const name = urlParts[urlParts.length - 1]
      setRepoName(name)
      setIsConnected(true)
      setShowSettings(false)
      setSuccess(`Connected to ${name}!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to connect to repository')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setRepoUrl('')
    setRepoName('')
    setCommits([])
    setChanges([])
  }

  const createBranch = () => {
    if (!newBranchName.trim()) return
    setBranches(prev => [...prev, newBranchName])
    setCurrentBranch(newBranchName)
    setNewBranchName('')
    setShowNewBranch(false)
    setSuccess(`Created and switched to branch: ${newBranchName}`)
    setTimeout(() => setSuccess(''), 3000)
  }

  const switchBranch = (branch: string) => {
    setCurrentBranch(branch)
    setShowBranches(false)
    setSuccess(`Switched to branch: ${branch}`)
    setTimeout(() => setSuccess(''), 3000)
  }

  const stagedChanges = changes.filter(c => c.staged)
  const unstagedChanges = changes.filter(c => !c.staged)

  return (
    <div className="h-full flex flex-col bg-[#252526] text-[#cccccc]">
      {/* Header */}
      <div className="flex items-center justify-between h-[35px] px-4 bg-[#252526] border-b border-[#191919] shrink-0">
        <div className="flex items-center gap-2">
          <FolderGit2 className="w-4 h-4 text-[#f14e32]" />
          <span className="text-[11px] font-semibold text-white uppercase tracking-wide">Source Control</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-1 rounded transition-colors ${showHistory ? 'bg-[#3e3e42] text-white' : 'text-[#858585] hover:text-[#cccccc] hover:bg-[#3e3e42]'}`}
            title="Commit History"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1 rounded transition-colors ${showSettings ? 'bg-[#3e3e42] text-white' : 'text-[#858585] hover:text-[#cccccc] hover:bg-[#3e3e42]'}`}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="px-3 py-2 bg-[#5a1d1d] text-[#f48771] text-xs">
          {error}
          <button onClick={() => setError('')} className="float-right"><X className="w-3 h-3" /></button>
        </div>
      )}
      {success && (
        <div className="px-3 py-2 bg-[#1d3d1d] text-[#89d185] text-xs">
          {success}
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-3 border-b border-[#191919] bg-[#1e1e1e]">
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-[#808080] uppercase">Repository URL</label>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/user/repo.git"
                className="w-full mt-1 px-2 py-1.5 bg-[#3c3c3c] border border-[#3c3c3c] rounded text-xs text-[#cccccc] placeholder:text-[#808080] focus:outline-none focus:border-[#007acc]"
              />
            </div>
            <div>
              <label className="text-[11px] text-[#808080] uppercase">GitHub Token (optional)</label>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full mt-1 px-2 py-1.5 bg-[#3c3c3c] border border-[#3c3c3c] rounded text-xs text-[#cccccc] placeholder:text-[#808080] focus:outline-none focus:border-[#007acc]"
              />
            </div>
            <div className="flex gap-2">
              {isConnected ? (
                <Button
                  onClick={handleDisconnect}
                  size="sm"
                  className="flex-1 h-7 text-xs bg-[#5a1d1d] hover:bg-[#6a2d2d] text-[#f48771]"
                >
                  <Unlink className="w-3 h-3 mr-1" />
                  Disconnect
                </Button>
              ) : (
                <Button
                  onClick={handleConnect}
                  disabled={isLoading}
                  size="sm"
                  className="flex-1 h-7 text-xs bg-[#0e639c] hover:bg-[#1177bb] text-white"
                >
                  <Link className="w-3 h-3 mr-1" />
                  {isLoading ? 'Connecting...' : 'Connect'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Panel */}
      {showHistory && (
        <div className="flex-1 overflow-y-auto border-b border-[#191919]">
          <div className="p-2">
            <div className="text-[11px] text-[#808080] uppercase mb-2">Commit History</div>
            {commits.length === 0 ? (
              <div className="text-xs text-[#808080] text-center py-4">No commits yet</div>
            ) : (
              <div className="space-y-2">
                {commits.map((commit) => (
                  <div key={commit.id} className="p-2 bg-[#1e1e1e] rounded">
                    <div className="flex items-start gap-2">
                      <GitCommit className="w-4 h-4 text-[#f14e32] mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-[#cccccc] truncate">{commit.message}</div>
                        <div className="text-[10px] text-[#808080] mt-1">
                          <span className="text-[#4ec9b0]">{commit.author}</span>
                          {' • '}
                          {commit.timestamp.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-[#808080] mt-1">
                          {commit.files.length} file(s) changed
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      {!showHistory && (
        <div className="flex-1 overflow-y-auto">
          {/* Branch Selector */}
          <div className="p-2 border-b border-[#191919]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBranches(!showBranches)}
                className="flex items-center gap-1 px-2 py-1 bg-[#1e1e1e] rounded hover:bg-[#3c3c3c] text-xs"
              >
                <GitBranch className="w-3 h-3 text-[#f14e32]" />
                <span>{currentBranch}</span>
                {showBranches ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
              {isConnected && (
                <>
                  <Button
                    onClick={handlePull}
                    disabled={isLoading}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-[#808080] hover:text-[#cccccc]"
                    title="Pull"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    onClick={handlePush}
                    disabled={isLoading}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-[#808080] hover:text-[#cccccc]"
                    title="Push"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </div>

            {/* Branch Dropdown */}
            {showBranches && (
              <div className="mt-2 bg-[#1e1e1e] rounded border border-[#3c3c3c]">
                {branches.map((branch) => (
                  <button
                    key={branch}
                    onClick={() => switchBranch(branch)}
                    className={`w-full text-left px-2 py-1.5 text-xs hover:bg-[#3c3c3c] flex items-center gap-2 ${
                      branch === currentBranch ? 'text-[#4ec9b0]' : 'text-[#cccccc]'
                    }`}
                  >
                    <GitBranch className="w-3 h-3" />
                    {branch}
                    {branch === currentBranch && <Check className="w-3 h-3 ml-auto" />}
                  </button>
                ))}
                <div className="border-t border-[#3c3c3c]">
                  {showNewBranch ? (
                    <div className="p-2 flex gap-1">
                      <input
                        type="text"
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        placeholder="branch-name"
                        className="flex-1 px-2 py-1 bg-[#3c3c3c] rounded text-xs text-[#cccccc] placeholder:text-[#808080] focus:outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && createBranch()}
                        autoFocus
                      />
                      <Button onClick={createBranch} size="sm" className="h-6 px-2 text-xs bg-[#0e639c]">
                        <Check className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowNewBranch(true)}
                      className="w-full text-left px-2 py-1.5 text-xs text-[#4ec9b0] hover:bg-[#3c3c3c] flex items-center gap-2"
                    >
                      <Plus className="w-3 h-3" />
                      Create new branch
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Commit Message */}
          <div className="p-2 border-b border-[#191919]">
            <textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Commit message"
              className="w-full px-2 py-1.5 bg-[#3c3c3c] border border-[#3c3c3c] rounded text-xs text-[#cccccc] placeholder:text-[#808080] focus:outline-none focus:border-[#007acc] resize-none"
              rows={2}
            />
            <Button
              onClick={handleCommit}
              disabled={stagedChanges.length === 0 || !commitMessage.trim()}
              size="sm"
              className="w-full mt-2 h-7 text-xs bg-[#0e639c] hover:bg-[#1177bb] text-white disabled:opacity-50"
            >
              <Check className="w-3 h-3 mr-1" />
              Commit ({stagedChanges.length} staged)
            </Button>
          </div>

          {/* Staged Changes */}
          <div className="border-b border-[#191919]">
            <button
              onClick={unstageAll}
              className="w-full flex items-center justify-between px-3 py-2 text-[11px] text-[#808080] uppercase hover:bg-[#2a2d2e]"
            >
              <span>Staged Changes ({stagedChanges.length})</span>
              {stagedChanges.length > 0 && <Minus className="w-3 h-3" />}
            </button>
            {stagedChanges.map((change) => (
              <div
                key={change.filename}
                className="flex items-center gap-2 px-3 py-1 hover:bg-[#2a2d2e] group"
              >
                <File className="w-3.5 h-3.5 text-[#519aba]" />
                <span className="flex-1 text-xs truncate">{change.filename}</span>
                <span className={`text-[10px] px-1 rounded ${
                  change.status === 'added' ? 'text-[#89d185] bg-[#89d185]/10' :
                  change.status === 'deleted' ? 'text-[#f48771] bg-[#f48771]/10' :
                  'text-[#cca700] bg-[#cca700]/10'
                }`}>
                  {change.status[0].toUpperCase()}
                </span>
                <button
                  onClick={() => unstageFile(change.filename)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#3c3c3c] rounded"
                >
                  <Minus className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Unstaged Changes */}
          <div>
            <button
              onClick={stageAll}
              className="w-full flex items-center justify-between px-3 py-2 text-[11px] text-[#808080] uppercase hover:bg-[#2a2d2e]"
            >
              <span>Changes ({unstagedChanges.length})</span>
              {unstagedChanges.length > 0 && <Plus className="w-3 h-3" />}
            </button>
            {unstagedChanges.map((change) => (
              <div
                key={change.filename}
                className="flex items-center gap-2 px-3 py-1 hover:bg-[#2a2d2e] group"
              >
                <File className="w-3.5 h-3.5 text-[#519aba]" />
                <span className="flex-1 text-xs truncate">{change.filename}</span>
                <span className={`text-[10px] px-1 rounded ${
                  change.status === 'added' ? 'text-[#89d185] bg-[#89d185]/10' :
                  change.status === 'deleted' ? 'text-[#f48771] bg-[#f48771]/10' :
                  'text-[#cca700] bg-[#cca700]/10'
                }`}>
                  {change.status[0].toUpperCase()}
                </span>
                <button
                  onClick={() => stageFile(change.filename)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#3c3c3c] rounded"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ))}
            {unstagedChanges.length === 0 && stagedChanges.length === 0 && (
              <div className="text-xs text-[#808080] text-center py-4">
                No changes detected
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="h-[22px] px-3 bg-[#1e1e1e] border-t border-[#191919] flex items-center justify-between text-[10px] text-[#808080] shrink-0">
        <div className="flex items-center gap-2">
          <GitBranch className="w-3 h-3" />
          <span>{currentBranch}</span>
        </div>
        {isConnected && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#89d185]" />
            <span className="truncate max-w-[150px]">{repoName}</span>
          </div>
        )}
      </div>
    </div>
  )
}
