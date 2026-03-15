'use client'

import { useState, useCallback } from 'react'
import { Bookmark, BookmarkPlus, X, ChevronDown, ChevronRight, FileCode, Trash2, Edit2, Check, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

export interface BookmarkItem {
  id: string
  fileId: string
  fileName: string
  filePath: string
  line: number
  column?: number
  label?: string
  preview?: string
  color?: string
  createdAt: Date
}

export interface BookmarkGroup {
  id: string
  name: string
  bookmarks: BookmarkItem[]
  isExpanded: boolean
}

interface BookmarksPanelProps {
  isOpen: boolean
  onClose: () => void
  bookmarks?: BookmarkItem[]
  groups?: BookmarkGroup[]
  onAddBookmark?: (bookmark: Omit<BookmarkItem, 'id' | 'createdAt'>) => void
  onRemoveBookmark?: (id: string) => void
  onRemove?: (id: string) => void
  onUpdateBookmark?: (id: string, updates: Partial<BookmarkItem>) => void
  onUpdateNote?: (id: string, note: string) => void
  onNavigateToBookmark?: (bookmark: BookmarkItem) => void
  onNavigate?: (bookmark: BookmarkItem) => void
  onCreateGroup?: (name: string) => void
  onDeleteGroup?: (id: string) => void
  onMoveToGroup?: (bookmarkId: string, groupId: string | null) => void
  onToggleGroup?: (groupId: string) => void
  onClear?: () => void
  currentFileId?: string
  currentLine?: number
}

const BOOKMARK_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Cyan', value: '#06b6d4' },
]

export function BookmarksPanel({
  isOpen,
  onClose,
  bookmarks = [],
  groups = [],
  onAddBookmark,
  onRemoveBookmark,
  onRemove,
  onUpdateBookmark,
  onUpdateNote,
  onNavigateToBookmark,
  onNavigate,
  onCreateGroup,
  onDeleteGroup,
  onMoveToGroup,
  onToggleGroup,
  onClear,
  currentFileId,
  currentLine
}: BookmarksPanelProps) {
  // Use either prop name for backward compatibility
  const handleRemove = onRemoveBookmark || onRemove || (() => {})
  const handleNavigate = onNavigateToBookmark || onNavigate || (() => {})
  const handleUpdateBookmark = onUpdateBookmark || ((id: string, updates: Partial<BookmarkItem>) => {
    if (onUpdateNote && updates.label) {
      onUpdateNote(id, updates.label)
    }
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [sortBy, setSortBy] = useState<'file' | 'line' | 'date' | 'label'>('file')

  // Get ungrouped bookmarks
  const ungroupedBookmarks = (bookmarks || []).filter(b => 
    !(groups || []).some(g => (g.bookmarks || []).some(gb => gb.id === b.id))
  )

  // Sort bookmarks
  const sortBookmarks = useCallback((items: BookmarkItem[]) => {
    return [...items].sort((a, b) => {
      switch (sortBy) {
        case 'file':
          return a.fileName.localeCompare(b.fileName) || a.line - b.line
        case 'line':
          return a.line - b.line
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'label':
          return (a.label || '').localeCompare(b.label || '')
        default:
          return 0
      }
    })
  }, [sortBy])

  // Start editing a bookmark label
  const startEditing = (bookmark: BookmarkItem) => {
    setEditingId(bookmark.id)
    setEditLabel(bookmark.label || '')
  }

  // Save bookmark label
  const saveLabel = () => {
    if (editingId) {
      handleUpdateBookmark(editingId, { label: editLabel })
      setEditingId(null)
      setEditLabel('')
    }
  }

  // Create new group
  const createGroup = () => {
    if (newGroupName.trim() && onCreateGroup) {
      onCreateGroup(newGroupName.trim())
      setNewGroupName('')
      setShowNewGroup(false)
    }
  }

  // Check if current position is bookmarked
  const isCurrentPositionBookmarked = currentFileId && currentLine && 
    (bookmarks || []).some(b => b.fileId === currentFileId && b.line === currentLine)

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e1e1e] border-[#3c3c3c] text-[#cccccc] max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-[#cccccc]">
            <Bookmark className="h-5 w-5 text-blue-400" />
            Bookmarks
          </DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-2 pb-2 border-b border-[#3c3c3c]">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[11px] text-[#cccccc] hover:bg-[#3c3c3c]"
            onClick={() => setShowNewGroup(true)}
          >
            <BookmarkPlus className="h-3.5 w-3.5 mr-1" />
            New Group
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[11px] text-[#cccccc] hover:bg-[#3c3c3c] ml-auto"
              >
                <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#252526] border-[#3c3c3c]">
              <DropdownMenuItem
                onClick={() => setSortBy('file')}
                className={cn("text-[11px]", sortBy === 'file' && "bg-[#3c3c3c]")}
              >
                By File
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('line')}
                className={cn("text-[11px]", sortBy === 'line' && "bg-[#3c3c3c]")}
              >
                By Line
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('date')}
                className={cn("text-[11px]", sortBy === 'date' && "bg-[#3c3c3c]")}
              >
                By Date
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('label')}
                className={cn("text-[11px]", sortBy === 'label' && "bg-[#3c3c3c]")}
              >
                By Label
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* New Group Input */}
        {showNewGroup && (
          <div className="flex items-center gap-2 p-2 bg-[#252526] rounded">
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group name..."
              className="h-7 text-[11px] bg-[#3c3c3c] border-[#4c4c4c]"
              onKeyDown={(e) => e.key === 'Enter' && createGroup()}
              autoFocus
            />
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={createGroup}>
              <Check className="h-3.5 w-3.5 text-green-400" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setShowNewGroup(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Bookmarks List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {/* Groups */}
          {(groups || []).map(group => (
            <div key={group.id} className="border border-[#3c3c3c] rounded">
              <div
                className="flex items-center gap-2 p-2 bg-[#252526] cursor-pointer hover:bg-[#2a2a2a]"
                onClick={() => onToggleGroup?.(group.id)}
              >
                {group.isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
                <Bookmark className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-[12px] flex-1">{group.name}</span>
                <span className="text-[10px] text-[#6e6e6e]">{group.bookmarks.length}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteGroup?.(group.id)
                  }}
                >
                  <Trash2 className="h-3 w-3 text-red-400" />
                </Button>
              </div>

              {group.isExpanded && (
                <div className="p-1">
                  {sortBookmarks(group.bookmarks || []).map(bookmark => (
                    <BookmarkRow
                      key={bookmark.id}
                      bookmark={bookmark}
                      editingId={editingId}
                      editLabel={editLabel}
                      onNavigate={() => handleNavigate(bookmark)}
                      onEdit={() => startEditing(bookmark)}
                      onSaveLabel={saveLabel}
                      onEditLabelChange={setEditLabel}
                      onRemove={() => handleRemove(bookmark.id)}
                      onUpdateColor={(color) => handleUpdateBookmark(bookmark.id, { color })}
                      groups={groups || []}
                      onMoveToGroup={(groupId) => onMoveToGroup?.(bookmark.id, groupId)}
                    />
                  ))}
                  {(group.bookmarks || []).length === 0 && (
                    <div className="text-[11px] text-[#6e6e6e] text-center py-2">
                      No bookmarks in this group
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Ungrouped Bookmarks */}
          {ungroupedBookmarks.length > 0 && (
            <div className="border border-[#3c3c3c] rounded">
              <div className="p-2 bg-[#252526] text-[12px] text-[#6e6e6e]">
                Ungrouped
              </div>
              <div className="p-1">
                {sortBookmarks(ungroupedBookmarks).map(bookmark => (
                  <BookmarkRow
                    key={bookmark.id}
                    bookmark={bookmark}
                    editingId={editingId}
                    editLabel={editLabel}
                    onNavigate={() => handleNavigate(bookmark)}
                    onEdit={() => startEditing(bookmark)}
                    onSaveLabel={saveLabel}
                    onEditLabelChange={setEditLabel}
                    onRemove={() => handleRemove(bookmark.id)}
                    onUpdateColor={(color) => handleUpdateBookmark(bookmark.id, { color })}
                    groups={groups || []}
                    onMoveToGroup={(groupId) => onMoveToGroup?.(bookmark.id, groupId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {(bookmarks || []).length === 0 && (
            <div className="text-center py-8 text-[#6e6e6e]">
              <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-[12px]">No bookmarks yet</p>
              <p className="text-[11px] mt-1">
                Press Ctrl+Shift+B to bookmark a line
              </p>
            </div>
          )}
        </div>

        {/* Footer with current position info */}
        {currentFileId && currentLine && (
          <div className="pt-2 border-t border-[#3c3c3c] text-[11px] text-[#6e6e6e]">
            Current: Line {currentLine}
            {isCurrentPositionBookmarked && (
              <span className="ml-2 text-blue-400">(bookmarked)</span>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Bookmark row component
interface BookmarkRowProps {
  bookmark: BookmarkItem
  editingId: string | null
  editLabel: string
  onNavigate: () => void
  onEdit: () => void
  onSaveLabel: () => void
  onEditLabelChange: (value: string) => void
  onRemove: () => void
  onUpdateColor: (color: string) => void
  groups: BookmarkGroup[]
  onMoveToGroup: (groupId: string | null) => void
}

function BookmarkRow({
  bookmark,
  editingId,
  editLabel,
  onNavigate,
  onEdit,
  onSaveLabel,
  onEditLabelChange,
  onRemove,
  onUpdateColor,
  groups,
  onMoveToGroup
}: BookmarkRowProps) {
  const isEditing = editingId === bookmark.id

  return (
    <div className="group flex items-center gap-2 p-1.5 rounded hover:bg-[#2a2a2a] cursor-pointer">
      {/* Color indicator */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: bookmark.color || '#3b82f6' }}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-[#252526] border-[#3c3c3c]">
          <div className="grid grid-cols-4 gap-1 p-2">
            {BOOKMARK_COLORS.map(color => (
              <button
                key={color.value}
                className={cn(
                  "w-5 h-5 rounded-full border-2",
                  bookmark.color === color.value ? "border-white" : "border-transparent"
                )}
                style={{ backgroundColor: color.value }}
                onClick={() => onUpdateColor(color.value)}
                title={color.name}
              />
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Main content */}
      <div className="flex-1 min-w-0" onClick={onNavigate}>
        <div className="flex items-center gap-1">
          <FileCode className="h-3 w-3 flex-shrink-0 text-[#6e6e6e]" />
          <span className="text-[11px] truncate">{bookmark.fileName}</span>
          <span className="text-[10px] text-[#6e6e6e]">:{bookmark.line}</span>
        </div>
        
        {isEditing ? (
          <div className="flex items-center gap-1 mt-0.5">
            <Input
              value={editLabel}
              onChange={(e) => onEditLabelChange(e.target.value)}
              placeholder="Add label..."
              className="h-5 text-[10px] bg-[#3c3c3c] border-[#4c4c4c] flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveLabel()
                if (e.key === 'Escape') onSaveLabel()
              }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
            <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={onSaveLabel}>
              <Check className="h-3 w-3 text-green-400" />
            </Button>
          </div>
        ) : (
          bookmark.label && (
            <div className="text-[10px] text-[#6e6e6e] truncate mt-0.5">
              {bookmark.label}
            </div>
          )
        )}
        
        {bookmark.preview && !isEditing && (
          <div className="text-[10px] text-[#4e4e4e] truncate mt-0.5 font-mono">
            {bookmark.preview}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
        >
          <Edit2 className="h-3 w-3" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={(e) => e.stopPropagation()}>
              <Bookmark className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#252526] border-[#3c3c3c]">
            <DropdownMenuItem
              onClick={() => onMoveToGroup(null)}
              className="text-[11px]"
            >
              Ungrouped
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#3c3c3c]" />
            {groups.map(group => (
              <DropdownMenuItem
                key={group.id}
                onClick={() => onMoveToGroup(group.id)}
                className="text-[11px]"
              >
                {group.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          <Trash2 className="h-3 w-3 text-red-400" />
        </Button>
      </div>
    </div>
  )
}

// Hook to manage bookmarks state
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [groups, setGroups] = useState<BookmarkGroup[]>([])

  const addBookmark = useCallback((bookmark: Omit<BookmarkItem, 'id' | 'createdAt'>) => {
    const newBookmark: BookmarkItem = {
      ...bookmark,
      id: `bookmark-${Date.now()}`,
      createdAt: new Date()
    }
    setBookmarks(prev => [...prev, newBookmark])
    return newBookmark
  }, [])

  const removeBookmark = useCallback((id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id))
    // Also remove from groups
    setGroups(prev => prev.map(g => ({
      ...g,
      bookmarks: g.bookmarks.filter(b => b.id !== id)
    })))
  }, [])

  const updateBookmark = useCallback((id: string, updates: Partial<BookmarkItem>) => {
    setBookmarks(prev => prev.map(b => 
      b.id === id ? { ...b, ...updates } : b
    ))
    // Update in groups too
    setGroups(prev => prev.map(g => ({
      ...g,
      bookmarks: g.bookmarks.map(b => 
        b.id === id ? { ...b, ...updates } : b
      )
    })))
  }, [])

  const createGroup = useCallback((name: string) => {
    const newGroup: BookmarkGroup = {
      id: `group-${Date.now()}`,
      name,
      bookmarks: [],
      isExpanded: true
    }
    setGroups(prev => [...prev, newGroup])
    return newGroup
  }, [])

  const deleteGroup = useCallback((id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id))
  }, [])

  const moveToGroup = useCallback((bookmarkId: string, groupId: string | null) => {
    const bookmark = bookmarks.find(b => b.id === bookmarkId)
    if (!bookmark) return

    setGroups(prev => prev.map(g => ({
      ...g,
      bookmarks: g.id === groupId 
        ? [...g.bookmarks.filter(b => b.id !== bookmarkId), bookmark]
        : g.bookmarks.filter(b => b.id !== bookmarkId)
    })))
  }, [bookmarks])

  const toggleGroup = useCallback((groupId: string) => {
    setGroups(prev => prev.map(g => 
      g.id === groupId ? { ...g, isExpanded: !g.isExpanded } : g
    ))
  }, [])

  const toggleBookmarkAtLine = useCallback((
    fileId: string,
    fileName: string,
    filePath: string,
    line: number,
    preview?: string
  ) => {
    const existing = bookmarks.find(b => b.fileId === fileId && b.line === line)
    if (existing) {
      removeBookmark(existing.id)
    } else {
      addBookmark({ fileId, fileName, filePath, line, preview })
    }
  }, [bookmarks, addBookmark, removeBookmark])

  const getBookmarksForFile = useCallback((fileId: string) => {
    return bookmarks.filter(b => b.fileId === fileId).sort((a, b) => a.line - b.line)
  }, [bookmarks])

  return {
    bookmarks,
    groups,
    addBookmark,
    removeBookmark,
    updateBookmark,
    createGroup,
    deleteGroup,
    moveToGroup,
    toggleGroup,
    toggleBookmarkAtLine,
    getBookmarksForFile
  }
}

export { BOOKMARK_COLORS }
