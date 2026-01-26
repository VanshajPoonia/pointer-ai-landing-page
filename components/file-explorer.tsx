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
    <div className="w-64 border-r border-[#333] bg-[#252526]">
      <div className="border-b border-[#333] px-4 py-3 text-sm font-medium text-[#ccc]">
        FILES
      </div>
      <div className="overflow-y-auto">
        {files.map((file) => (
          <div
            key={file.id}
            className={`group flex items-center justify-between px-4 py-2 hover:bg-[#2a2d2e] ${
              activeFile?.id === file.id ? 'bg-[#37373d]' : ''
            }`}
          >
            <button
              onClick={() => onSelectFile(file)}
              className="flex flex-1 items-center gap-2 text-left text-sm text-[#ccc]"
            >
              <FileCode className="h-4 w-4 text-[#519aba]" />
              <span className="truncate">{file.name}</span>
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteFile(file.id)
              }}
              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-[#999] hover:bg-[#3e3e42] hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
