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
    <div className="w-[240px] flex flex-col bg-[#252526] border-r border-[#191919]">
      {/* Explorer Header */}
      <div className="h-[35px] flex items-center px-5 text-[11px] font-semibold text-[#bbbbbb] uppercase tracking-wider bg-[#252526]">
        Explorer
      </div>
      
      {/* Files Section */}
      <div className="px-2 py-1">
        <div className="text-[11px] font-bold text-[#cccccc] px-2 py-1.5 uppercase">
          Files
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {files.length === 0 ? (
          <div className="px-4 py-6 text-center text-[11px] text-[#6a6a6a]">
            No files yet. Click "New File" to create one.
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className={`group flex items-center justify-between h-[22px] pl-6 pr-2 cursor-pointer ${
                activeFile?.id === file.id 
                  ? 'bg-[#094771]' 
                  : 'hover:bg-[#2a2d2e]'
              }`}
            >
              <button
                onClick={() => onSelectFile(file)}
                className="flex flex-1 items-center gap-1.5 text-left min-w-0"
              >
                <FileCode className="h-4 w-4 text-[#519aba] flex-shrink-0" />
                <span className={`truncate text-[13px] ${
                  activeFile?.id === file.id ? 'text-white' : 'text-[#cccccc]'
                }`}>
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
                className="opacity-0 group-hover:opacity-100 h-5 w-5 p-0 text-[#cccccc] hover:bg-transparent hover:text-[#f87171]"
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
