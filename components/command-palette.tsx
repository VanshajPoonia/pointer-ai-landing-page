'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { 
  FileCode, 
  Search, 
  Settings, 
  Palette, 
  Play, 
  Save, 
  FolderOpen, 
  GitBranch, 
  MessageSquare,
  Zap,
  FileText,
  Terminal,
  Bug,
  TestTube,
  Code,
  Keyboard,
  Sun,
  Moon,
  Monitor,
  RotateCcw
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface CommandAction {
  id: string
  name: string
  description?: string
  shortcut?: string[]
  icon: React.ReactNode
  category: 'file' | 'edit' | 'view' | 'ai' | 'git' | 'settings' | 'navigation'
  action: () => void
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  actions: CommandAction[]
  onActionSelect?: (actionId: string) => void
}

export function CommandPalette({ isOpen, onClose, actions, onActionSelect }: CommandPaletteProps) {
  const [search, setSearch] = useState('')

  // Group actions by category
  const groupedActions = useMemo(() => {
    const groups: Record<string, CommandAction[]> = {}
    actions.forEach(action => {
      if (!groups[action.category]) {
        groups[action.category] = []
      }
      groups[action.category].push(action)
    })
    return groups
  }, [actions])

  const categoryLabels: Record<string, string> = {
    file: 'File',
    edit: 'Edit',
    view: 'View',
    ai: 'AI Tools',
    git: 'Git',
    settings: 'Settings',
    navigation: 'Navigation'
  }

  const handleSelect = (actionId: string) => {
    const action = actions.find(a => a.id === actionId)
    if (action) {
      action.action()
      onActionSelect?.(actionId)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="overflow-hidden p-0 shadow-lg bg-[#1e1e1e] border-[#3c3c3c] max-w-[640px]">
        <Command className="bg-transparent">
          <CommandInput 
            placeholder="Type a command or search..." 
            value={search}
            onValueChange={setSearch}
            className="h-12 border-b border-[#3c3c3c] text-[#cccccc] placeholder:text-[#808080]"
          />
          <CommandList className="max-h-[400px] overflow-y-auto">
            <CommandEmpty className="py-6 text-center text-sm text-[#808080]">
              No commands found.
            </CommandEmpty>
            
            {Object.entries(groupedActions).map(([category, categoryActions], index) => (
              <div key={category}>
                {index > 0 && <CommandSeparator className="bg-[#3c3c3c]" />}
                <CommandGroup heading={categoryLabels[category]} className="text-[#808080]">
                  {categoryActions.map(action => (
                    <CommandItem
                      key={action.id}
                      value={action.name}
                      onSelect={() => handleSelect(action.id)}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer text-[#cccccc] hover:bg-[#2a2d2e] data-[selected=true]:bg-[#094771]"
                    >
                      <span className="text-[#808080]">{action.icon}</span>
                      <div className="flex-1">
                        <span className="text-sm">{action.name}</span>
                        {action.description && (
                          <span className="ml-2 text-xs text-[#808080]">{action.description}</span>
                        )}
                      </div>
                      {action.shortcut && (
                        <div className="flex gap-1">
                          {action.shortcut.map((key, i) => (
                            <Badge 
                              key={i} 
                              variant="outline" 
                              className="px-1.5 py-0.5 text-[10px] font-mono bg-[#3c3c3c] border-[#505050] text-[#cccccc]"
                            >
                              {key}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </div>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

// Keyboard shortcuts hook
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const cmdKey = isMac ? e.metaKey : e.ctrlKey

      // Build key combo string
      let keyCombo = ''
      if (cmdKey) keyCombo += 'cmd+'
      if (e.shiftKey) keyCombo += 'shift+'
      if (e.altKey) keyCombo += 'alt+'
      keyCombo += e.key.toLowerCase()

      if (shortcuts[keyCombo]) {
        e.preventDefault()
        shortcuts[keyCombo]()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

// Keyboard shortcuts panel component
interface KeyboardShortcutsPanelProps {
  isOpen: boolean
  onClose: () => void
  shortcuts: Array<{
    name: string
    shortcut: string[]
    description: string
    category: string
  }>
}

export function KeyboardShortcutsPanel({ isOpen, onClose, shortcuts }: KeyboardShortcutsPanelProps) {
  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, typeof shortcuts> = {}
    shortcuts.forEach(shortcut => {
      if (!groups[shortcut.category]) {
        groups[shortcut.category] = []
      }
      groups[shortcut.category].push(shortcut)
    })
    return groups
  }, [shortcuts])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div 
        className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#3c3c3c]">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-[#cccccc]" />
            <h2 className="text-lg font-semibold text-[#cccccc]">Keyboard Shortcuts</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-[#808080] hover:text-[#cccccc] transition-colors"
          >
            <span className="sr-only">Close</span>
            &times;
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category} className="mb-6 last:mb-0">
              <h3 className="text-sm font-semibold text-[#808080] uppercase tracking-wider mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded bg-[#252526] hover:bg-[#2a2d2e] transition-colors"
                  >
                    <div>
                      <span className="text-[#cccccc] text-sm">{shortcut.name}</span>
                      <p className="text-[#808080] text-xs mt-0.5">{shortcut.description}</p>
                    </div>
                    <div className="flex gap-1">
                      {shortcut.shortcut.map((key, i) => (
                        <Badge 
                          key={i}
                          variant="outline"
                          className="px-2 py-1 text-xs font-mono bg-[#3c3c3c] border-[#505050] text-[#cccccc]"
                        >
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Default keyboard shortcuts
export const defaultShortcuts = [
  { name: 'Quick Open', shortcut: ['Cmd', 'P'], description: 'Search and open files quickly', category: 'Navigation' },
  { name: 'Command Palette', shortcut: ['Cmd', 'Shift', 'P'], description: 'Open command palette', category: 'Navigation' },
  { name: 'Global Search', shortcut: ['Cmd', 'Shift', 'F'], description: 'Search across all files', category: 'Search' },
  { name: 'Find in File', shortcut: ['Cmd', 'F'], description: 'Find text in current file', category: 'Search' },
  { name: 'Replace in File', shortcut: ['Cmd', 'H'], description: 'Find and replace in current file', category: 'Search' },
  { name: 'Save File', shortcut: ['Cmd', 'S'], description: 'Save current file', category: 'File' },
  { name: 'Save All', shortcut: ['Cmd', 'Shift', 'S'], description: 'Save all open files', category: 'File' },
  { name: 'New File', shortcut: ['Cmd', 'N'], description: 'Create a new file', category: 'File' },
  { name: 'Close Tab', shortcut: ['Cmd', 'W'], description: 'Close current tab', category: 'File' },
  { name: 'Undo', shortcut: ['Cmd', 'Z'], description: 'Undo last action', category: 'Edit' },
  { name: 'Redo', shortcut: ['Cmd', 'Shift', 'Z'], description: 'Redo last action', category: 'Edit' },
  { name: 'Cut', shortcut: ['Cmd', 'X'], description: 'Cut selection', category: 'Edit' },
  { name: 'Copy', shortcut: ['Cmd', 'C'], description: 'Copy selection', category: 'Edit' },
  { name: 'Paste', shortcut: ['Cmd', 'V'], description: 'Paste from clipboard', category: 'Edit' },
  { name: 'Toggle Terminal', shortcut: ['Cmd', '`'], description: 'Show/hide terminal', category: 'View' },
  { name: 'Toggle Sidebar', shortcut: ['Cmd', 'B'], description: 'Show/hide sidebar', category: 'View' },
  { name: 'Toggle AI Chat', shortcut: ['Cmd', 'Shift', 'A'], description: 'Open AI assistant', category: 'AI' },
  { name: 'AI Explain', shortcut: ['Cmd', 'Shift', 'E'], description: 'Explain selected code', category: 'AI' },
  { name: 'Run Code', shortcut: ['Cmd', 'Enter'], description: 'Run current file', category: 'Run' },
  { name: 'Git Commit', shortcut: ['Cmd', 'Shift', 'G'], description: 'Open Git panel', category: 'Git' },
]
