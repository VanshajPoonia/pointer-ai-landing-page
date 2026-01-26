'use client'

import React from "react"

import { useState } from 'react'
import { FileCode, Folder, FolderOpen, ChevronRight, ChevronDown, Plus, Trash2, Edit2, Download, MoreVertical } from 'lucide-react'
import { Button } from './ui/button'
import { FileNode, downloadFile } from '@/lib/file-system'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FileExplorerProps {
  nodes: Record<string, FileNode>
  rootId: string
  activeFileId: string | null
  onSelectFile: (nodeId: string) => void
  onCreateFile: (parentId: string) => void
  onCreateFolder: (parentId: string) => void
  onDeleteNode: (nodeId: string) => void
  onRenameNode: (nodeId: string, newName: string) => void
}

export function FileExplorer({
  nodes,
  rootId,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onDeleteNode,
  onRenameNode,
}: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root', 'project', 'src']))
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const startRename = (nodeId: string, currentName: string) => {
    setRenamingId(nodeId)
    setRenameValue(currentName)
  }

  const finishRename = () => {
    if (renamingId && renameValue.trim()) {
      onRenameNode(renamingId, renameValue.trim())
    }
    setRenamingId(null)
    setRenameValue('')
  }

  const renderNode = (nodeId: string, depth: number = 0): React.ReactNode => {
    const node = nodes[nodeId]
    if (!node) return null

    const isExpanded = expandedFolders.has(nodeId)
    const isActive = activeFileId === nodeId
    const isRenaming = renamingId === nodeId

    if (node.type === 'folder') {
      return (
        <div key={nodeId}>
          <div
            className={`group flex items-center justify-between h-[22px] pr-2 cursor-pointer ${
              isActive ? 'bg-[#094771]' : 'hover:bg-[#2a2d2e]'
            }`}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            <div className="flex items-center flex-1 min-w-0" onClick={() => toggleFolder(nodeId)}>
              <span className="mr-1 flex-shrink-0">
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-[#cccccc]" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-[#cccccc]" />
                )}
              </span>
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 text-[#dcb67a] flex-shrink-0 mr-1.5" />
              ) : (
                <Folder className="h-4 w-4 text-[#dcb67a] flex-shrink-0 mr-1.5" />
              )}
              {isRenaming ? (
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={finishRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') finishRename()
                    if (e.key === 'Escape') {
                      setRenamingId(null)
                      setRenameValue('')
                    }
                  }}
                  className="flex-1 bg-[#3c3c3c] text-[13px] text-white outline-none border border-[#007acc] px-1"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className={`truncate text-[13px] ${isActive ? 'text-white' : 'text-[#cccccc]'}`}>
                  {node.name}
                </span>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 h-5 w-5 p-0 text-[#cccccc] hover:bg-[#3e3e42]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#252526] border-[#3c3c3c] text-[#cccccc]">
                <DropdownMenuItem onClick={() => onCreateFile(nodeId)} className="text-xs cursor-pointer">
                  <Plus className="h-3 w-3 mr-2" />
                  New File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCreateFolder(nodeId)} className="text-xs cursor-pointer">
                  <Folder className="h-3 w-3 mr-2" />
                  New Folder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => startRename(nodeId, node.name)} className="text-xs cursor-pointer">
                  <Edit2 className="h-3 w-3 mr-2" />
                  Rename
                </DropdownMenuItem>
                {nodeId !== 'root' && (
                  <DropdownMenuItem 
                    onClick={() => onDeleteNode(nodeId)} 
                    className="text-xs cursor-pointer text-[#f87171] focus:text-[#f87171]"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {isExpanded && node.children?.map((childId) => renderNode(childId, depth + 1))}
        </div>
      )
    }

    // File node
    return (
      <div
        key={nodeId}
        className={`group flex items-center justify-between h-[22px] pr-2 cursor-pointer ${
          isActive ? 'bg-[#094771]' : 'hover:bg-[#2a2d2e]'
        }`}
        style={{ paddingLeft: `${depth * 12 + 20}px` }}
      >
        <div className="flex items-center flex-1 min-w-0" onClick={() => onSelectFile(nodeId)}>
          <FileCode className="h-4 w-4 text-[#519aba] flex-shrink-0 mr-1.5" />
          {isRenaming ? (
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={finishRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') finishRename()
                if (e.key === 'Escape') {
                  setRenamingId(null)
                  setRenameValue('')
                }
              }}
              className="flex-1 bg-[#3c3c3c] text-[13px] text-white outline-none border border-[#007acc] px-1"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className={`truncate text-[13px] ${isActive ? 'text-white' : 'text-[#cccccc]'}`}>
              {node.name}
            </span>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 h-5 w-5 p-0 text-[#cccccc] hover:bg-[#3e3e42]"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#252526] border-[#3c3c3c] text-[#cccccc]">
            <DropdownMenuItem onClick={() => downloadFile(node)} className="text-xs cursor-pointer">
              <Download className="h-3 w-3 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => startRename(nodeId, node.name)} className="text-xs cursor-pointer">
              <Edit2 className="h-3 w-3 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDeleteNode(nodeId)} 
              className="text-xs cursor-pointer text-[#f87171] focus:text-[#f87171]"
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <div className="w-[280px] flex flex-col bg-[#252526] border-r border-[#191919]">
      <div className="h-[35px] flex items-center justify-between px-4 bg-[#252526]">
        <span className="text-[11px] font-semibold text-[#bbbbbb] uppercase tracking-wider">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCreateFile('root')}
            className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#3e3e42]"
            title="New File"
          >
            <FileCode className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCreateFolder('root')}
            className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#3e3e42]"
            title="New Folder"
          >
            <Folder className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {renderNode(rootId, 0)}
      </div>
    </div>
  )
}
