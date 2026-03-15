'use client'

import { useState, useCallback } from 'react'
import { X, Columns, Rows, Maximize2, Minimize2, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface EditorPane {
  id: string
  fileId: string | null
  fileName: string
  content: string
  language: string
  isActive: boolean
}

interface SplitEditorProps {
  panes: EditorPane[]
  onPaneChange: (panes: EditorPane[]) => void
  onActivePane: (paneId: string) => void
  onClosePane: (paneId: string) => void
  renderEditor: (pane: EditorPane, index: number) => React.ReactNode
  orientation: 'horizontal' | 'vertical'
  onOrientationChange: (orientation: 'horizontal' | 'vertical') => void
}

export function SplitEditor({
  panes,
  onPaneChange,
  onActivePane,
  onClosePane,
  renderEditor,
  orientation,
  onOrientationChange,
}: SplitEditorProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [splitRatio, setSplitRatio] = useState(50)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)

    const startPos = orientation === 'horizontal' ? e.clientX : e.clientY
    const container = (e.target as HTMLElement).parentElement
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const containerSize = orientation === 'horizontal' ? containerRect.width : containerRect.height

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentPos = orientation === 'horizontal' ? moveEvent.clientX : moveEvent.clientY
      const offset = orientation === 'horizontal' 
        ? currentPos - containerRect.left 
        : currentPos - containerRect.top
      const newRatio = Math.min(Math.max((offset / containerSize) * 100, 20), 80)
      setSplitRatio(newRatio)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [orientation])

  const addPane = useCallback(() => {
    const newPane: EditorPane = {
      id: `pane-${Date.now()}`,
      fileId: null,
      fileName: 'Untitled',
      content: '',
      language: 'typescript',
      isActive: true,
    }
    // Deactivate all other panes
    const updatedPanes = panes.map(p => ({ ...p, isActive: false }))
    onPaneChange([...updatedPanes, newPane])
    onActivePane(newPane.id)
  }, [panes, onPaneChange, onActivePane])

  if (panes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1e1e1e] text-[#6e6e6e]">
        <div className="text-center">
          <p className="text-sm mb-2">No editors open</p>
          <Button
            variant="outline"
            size="sm"
            onClick={addPane}
            className="text-xs"
          >
            Open Editor
          </Button>
        </div>
      </div>
    )
  }

  if (panes.length === 1) {
    return (
      <div className="flex-1 flex flex-col">
        <PaneHeader
          pane={panes[0]}
          onClose={() => onClosePane(panes[0].id)}
          onSplit={addPane}
          canClose={false}
          showSplitOptions
          orientation={orientation}
          onOrientationChange={onOrientationChange}
        />
        <div className="flex-1">
          {renderEditor(panes[0], 0)}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex-1 flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col'
      )}
    >
      {/* First Pane */}
      <div
        className="flex flex-col overflow-hidden"
        style={{
          [orientation === 'horizontal' ? 'width' : 'height']: `${splitRatio}%`,
        }}
      >
        <PaneHeader
          pane={panes[0]}
          onClose={() => onClosePane(panes[0].id)}
          onClick={() => onActivePane(panes[0].id)}
          canClose={panes.length > 1}
          orientation={orientation}
          onOrientationChange={onOrientationChange}
        />
        <div
          className={cn(
            'flex-1 border',
            panes[0].isActive ? 'border-blue-500/50' : 'border-transparent'
          )}
          onClick={() => onActivePane(panes[0].id)}
        >
          {renderEditor(panes[0], 0)}
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className={cn(
          'bg-[#2d2d2d] hover:bg-blue-500 transition-colors flex-shrink-0',
          orientation === 'horizontal' ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize',
          isDragging && 'bg-blue-500'
        )}
        onMouseDown={handleMouseDown}
      />

      {/* Second Pane */}
      <div
        className="flex flex-col overflow-hidden"
        style={{
          [orientation === 'horizontal' ? 'width' : 'height']: `${100 - splitRatio}%`,
        }}
      >
        <PaneHeader
          pane={panes[1]}
          onClose={() => onClosePane(panes[1].id)}
          onClick={() => onActivePane(panes[1].id)}
          canClose={panes.length > 1}
          showSplitOptions
          orientation={orientation}
          onOrientationChange={onOrientationChange}
        />
        <div
          className={cn(
            'flex-1 border',
            panes[1].isActive ? 'border-blue-500/50' : 'border-transparent'
          )}
          onClick={() => onActivePane(panes[1].id)}
        >
          {renderEditor(panes[1], 1)}
        </div>
      </div>
    </div>
  )
}

interface PaneHeaderProps {
  pane: EditorPane
  onClose: () => void
  onClick?: () => void
  canClose: boolean
  showSplitOptions?: boolean
  orientation: 'horizontal' | 'vertical'
  onOrientationChange: (orientation: 'horizontal' | 'vertical') => void
}

function PaneHeader({
  pane,
  onClose,
  onClick,
  canClose,
  showSplitOptions,
  orientation,
  onOrientationChange,
}: PaneHeaderProps) {
  return (
    <div
      className={cn(
        'h-[35px] bg-[#252526] border-b border-[#3c3c3c] flex items-center justify-between px-2 cursor-pointer',
        pane.isActive && 'bg-[#1e1e1e]'
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[12px] text-[#cccccc] truncate">{pane.fileName}</span>
        {pane.isActive && (
          <span className="text-[10px] text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded">
            Active
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {showSplitOptions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-[#808080] hover:text-white hover:bg-[#3c3c3c]"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#252526] border-[#3c3c3c]">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onOrientationChange('horizontal')
                }}
                className={cn(
                  'text-[#cccccc] hover:bg-[#3c3c3c] text-xs',
                  orientation === 'horizontal' && 'bg-[#3c3c3c]'
                )}
              >
                <Columns className="h-3 w-3 mr-2" />
                Split Horizontal
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onOrientationChange('vertical')
                }}
                className={cn(
                  'text-[#cccccc] hover:bg-[#3c3c3c] text-xs',
                  orientation === 'vertical' && 'bg-[#3c3c3c]'
                )}
              >
                <Rows className="h-3 w-3 mr-2" />
                Split Vertical
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {canClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="h-5 w-5 p-0 text-[#808080] hover:text-white hover:bg-[#3c3c3c]"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

// Hook to manage split editor state
export function useSplitEditor(initialFileId?: string, initialFileName?: string, initialContent?: string, initialLanguage?: string) {
  const [panes, setPanes] = useState<EditorPane[]>([
    {
      id: 'pane-1',
      fileId: initialFileId || null,
      fileName: initialFileName || 'Untitled',
      content: initialContent || '',
      language: initialLanguage || 'typescript',
      isActive: true,
    },
  ])
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal')

  const setActivePane = useCallback((paneId: string) => {
    setPanes(prev =>
      prev.map(p => ({
        ...p,
        isActive: p.id === paneId,
      }))
    )
  }, [])

  const closePane = useCallback((paneId: string) => {
    setPanes(prev => {
      const remaining = prev.filter(p => p.id !== paneId)
      if (remaining.length > 0 && !remaining.some(p => p.isActive)) {
        remaining[0].isActive = true
      }
      return remaining
    })
  }, [])

  const updatePaneContent = useCallback((paneId: string, content: string) => {
    setPanes(prev =>
      prev.map(p => (p.id === paneId ? { ...p, content } : p))
    )
  }, [])

  const updatePaneFile = useCallback((paneId: string, fileId: string, fileName: string, content: string, language: string) => {
    setPanes(prev =>
      prev.map(p =>
        p.id === paneId
          ? { ...p, fileId, fileName, content, language }
          : p
      )
    )
  }, [])

  const addPane = useCallback((fileId?: string, fileName?: string, content?: string, language?: string) => {
    const newPane: EditorPane = {
      id: `pane-${Date.now()}`,
      fileId: fileId || null,
      fileName: fileName || 'Untitled',
      content: content || '',
      language: language || 'typescript',
      isActive: true,
    }
    setPanes(prev => [...prev.map(p => ({ ...p, isActive: false })), newPane])
    return newPane.id
  }, [])

  const getActivePane = useCallback(() => {
    return panes.find(p => p.isActive) || panes[0]
  }, [panes])

  return {
    panes,
    setPanes,
    orientation,
    setOrientation,
    setActivePane,
    closePane,
    updatePaneContent,
    updatePaneFile,
    addPane,
    getActivePane,
  }
}
