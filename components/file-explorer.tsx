'use client'

import { FileCode, Trash2 } from 'lucide-react'
import { Button } from './ui/button'

interface CodeFile {
  id: string
  name: string
  language: string
  content: string
}

interface FileExplorerProps {
  files: CodeFile[]
  activeFile: CodeFile | null
  onSelectFile: (file: CodeFile) => void
  onDeleteFile: (fileId: string) => void
}

export function FileExplorer({
  files,
  activeFile,
  onSelectFile,
  onDeleteFile,
}: FileExplorerProps) {
  return (
    <div className="w-64 border-r border-[#252526] bg-[#252526]">
      <div className="px-4 py-3 text-xs font-semibold text-[#cccccc] uppercase tracking-wider">
        Explorer
      </div>
      <div className="overflow-y-auto">
        {files.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-[#6a6a6a]">
            No files yet
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className={`group flex items-center justify-between px-3 py-1.5 cursor-pointer ${
                activeFile?.id === file.id 
                  ? 'bg-[#37373d]' 
                  : 'hover:bg-[#2a2d2e]'
              }`}
            >
              <button
                onClick={() => onSelectFile(file)}
                className="flex flex-1 items-center gap-2 text-left min-w-0"
              >
                <FileCode className="h-4 w-4 text-[#519aba] flex-shrink-0" />
                <span className="truncate text-sm text-[#cccccc]">
                  {file.name}
                </span>
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteFile(file.id)
                }}
                className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-[#858585] hover:bg-[#3e3e42] hover:text-[#f87171]"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
