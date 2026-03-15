"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  Archive, 
  Plus, 
  Trash2, 
  Play, 
  Eye,
  Clock,
  FileCode,
  GitBranch,
  MoreVertical,
  Download,
  Copy
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export interface StashEntry {
  id: string
  message: string
  branch: string
  timestamp: Date
  files: {
    path: string
    status: 'modified' | 'added' | 'deleted'
    diff?: string
  }[]
}

interface StashManagerProps {
  isOpen: boolean
  onClose: () => void
  stashes: StashEntry[]
  currentBranch: string
  onCreateStash: (message: string) => void
  onApplyStash: (id: string, drop: boolean) => void
  onDropStash: (id: string) => void
  onClearAll: () => void
}

// Hook for managing stashes
export function useStashManager() {
  const [stashes, setStashes] = useState<StashEntry[]>([
    {
      id: 'stash-1',
      message: 'WIP: Feature implementation',
      branch: 'main',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
      files: [
        { path: 'src/components/Button.tsx', status: 'modified' },
        { path: 'src/utils/helpers.ts', status: 'modified' },
        { path: 'src/styles/button.css', status: 'added' }
      ]
    },
    {
      id: 'stash-2',
      message: 'Temporary save before merge',
      branch: 'feature/auth',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      files: [
        { path: 'src/auth/login.tsx', status: 'modified' },
        { path: 'src/auth/types.ts', status: 'added' }
      ]
    },
    {
      id: 'stash-3',
      message: 'Experiment with new layout',
      branch: 'main',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      files: [
        { path: 'src/layouts/MainLayout.tsx', status: 'modified' },
        { path: 'src/layouts/Sidebar.tsx', status: 'modified' },
        { path: 'src/layouts/Header.tsx', status: 'modified' },
        { path: 'src/layouts/old/Footer.tsx', status: 'deleted' }
      ]
    }
  ])

  const createStash = (message: string) => {
    const newStash: StashEntry = {
      id: `stash-${Date.now()}`,
      message: message || `WIP on main: ${new Date().toLocaleString()}`,
      branch: 'main',
      timestamp: new Date(),
      files: [
        { path: 'current-file.tsx', status: 'modified' }
      ]
    }
    setStashes(prev => [newStash, ...prev])
  }

  const applyStash = (id: string, drop: boolean) => {
    // Apply stash logic would go here
    if (drop) {
      setStashes(prev => prev.filter(s => s.id !== id))
    }
  }

  const dropStash = (id: string) => {
    setStashes(prev => prev.filter(s => s.id !== id))
  }

  const clearAll = () => {
    setStashes([])
  }

  return {
    stashes,
    createStash,
    applyStash,
    dropStash,
    clearAll
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

export function StashManager({
  isOpen,
  onClose,
  stashes,
  currentBranch,
  onCreateStash,
  onApplyStash,
  onDropStash,
  onClearAll
}: StashManagerProps) {
  const [newStashMessage, setNewStashMessage] = useState('')
  const [selectedStash, setSelectedStash] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const handleCreate = () => {
    onCreateStash(newStashMessage)
    setNewStashMessage('')
    setShowCreateForm(false)
  }

  const selectedStashData = stashes.find(s => s.id === selectedStash)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[70vh] bg-[#1e1e1e] border-[#3c3c3c] p-0 flex flex-col">
        <DialogHeader className="p-4 border-b border-[#3c3c3c] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Archive className="h-5 w-5 text-yellow-400" />
              <DialogTitle className="text-[#cccccc]">
                Stash Manager
              </DialogTitle>
              <Badge variant="outline" className="bg-[#252526] text-[#808080] border-[#3c3c3c]">
                {stashes.length} stash{stashes.length !== 1 ? 'es' : ''}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                <GitBranch className="h-3 w-3 mr-1" />
                {currentBranch}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Stash List */}
          <div className="w-1/2 border-r border-[#3c3c3c] flex flex-col">
            {/* Create Stash */}
            <div className="p-3 border-b border-[#3c3c3c]">
              {showCreateForm ? (
                <div className="flex gap-2">
                  <Input
                    value={newStashMessage}
                    onChange={(e) => setNewStashMessage(e.target.value)}
                    placeholder="Stash message (optional)"
                    className="flex-1 bg-[#252526] border-[#3c3c3c] text-[#cccccc] text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    autoFocus
                  />
                  <Button size="sm" onClick={handleCreate} className="bg-yellow-600 hover:bg-yellow-700">
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Stash
                </Button>
              )}
            </div>

            {/* Stash Entries */}
            <ScrollArea className="flex-1">
              {stashes.length === 0 ? (
                <div className="p-8 text-center text-[#808080]">
                  <Archive className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No stashed changes</p>
                  <p className="text-xs mt-1">Create a stash to save your work-in-progress</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {stashes.map((stash, index) => (
                    <div
                      key={stash.id}
                      onClick={() => setSelectedStash(stash.id)}
                      className={cn(
                        "p-3 rounded-lg cursor-pointer transition-colors",
                        selectedStash === stash.id
                          ? "bg-[#37373d] border border-[#007acc]"
                          : "hover:bg-[#2a2d2e] border border-transparent"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-yellow-400 font-mono">
                              stash@{{{index}}}
                            </span>
                            <span className="text-xs text-[#808080]">on</span>
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-blue-400 border-blue-500/30">
                              {stash.branch}
                            </Badge>
                          </div>
                          <p className="text-sm text-[#cccccc] truncate">
                            {stash.message}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-[#808080]">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatRelativeTime(stash.timestamp)}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileCode className="h-3 w-3" />
                              {stash.files.length} file{stash.files.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-[#808080] hover:text-[#cccccc]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#252526] border-[#3c3c3c]">
                            <DropdownMenuItem
                              onClick={() => onApplyStash(stash.id, false)}
                              className="text-[#cccccc]"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Apply
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onApplyStash(stash.id, true)}
                              className="text-[#cccccc]"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Pop (Apply & Drop)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDropStash(stash.id)}
                              className="text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Drop
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Clear All */}
            {stashes.length > 0 && (
              <div className="p-3 border-t border-[#3c3c3c]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearAll}
                  className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Stashes
                </Button>
              </div>
            )}
          </div>

          {/* Stash Details */}
          <div className="w-1/2 flex flex-col">
            {selectedStashData ? (
              <>
                <div className="p-4 border-b border-[#3c3c3c] bg-[#252526]">
                  <h3 className="font-medium text-[#cccccc] mb-1">{selectedStashData.message}</h3>
                  <div className="flex items-center gap-2 text-xs text-[#808080]">
                    <Clock className="h-3 w-3" />
                    {selectedStashData.timestamp.toLocaleString()}
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    <h4 className="text-xs font-medium text-[#808080] uppercase mb-3">
                      Changed Files ({selectedStashData.files.length})
                    </h4>
                    <div className="space-y-1">
                      {selectedStashData.files.map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#2a2d2e]"
                        >
                          <FileCode className={cn(
                            "h-4 w-4",
                            file.status === 'added' && "text-green-400",
                            file.status === 'modified' && "text-yellow-400",
                            file.status === 'deleted' && "text-red-400"
                          )} />
                          <span className="flex-1 text-sm text-[#cccccc] truncate font-mono">
                            {file.path}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] py-0 px-1.5",
                              file.status === 'added' && "text-green-400 border-green-500/30",
                              file.status === 'modified' && "text-yellow-400 border-yellow-500/30",
                              file.status === 'deleted' && "text-red-400 border-red-500/30"
                            )}
                          >
                            {file.status[0].toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
                <div className="p-3 border-t border-[#3c3c3c] flex gap-2">
                  <Button
                    onClick={() => onApplyStash(selectedStashData.id, false)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Apply
                  </Button>
                  <Button
                    onClick={() => onApplyStash(selectedStashData.id, true)}
                    variant="outline"
                    className="flex-1 border-[#3c3c3c] text-[#cccccc]"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Pop
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#808080]">
                <div className="text-center">
                  <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Select a stash to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
