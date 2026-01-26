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
    <div className="w-72 border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Files
        </h2>
      </div>
      <div className="overflow-y-auto p-2">
        {files.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            No files yet. Create a new file to get started.
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className={`group flex items-center justify-between rounded-lg px-3 py-2.5 mb-1 transition-colors ${
                activeFile?.id === file.id 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <button
                onClick={() => onSelectFile(file)}
                className="flex flex-1 items-center gap-3 text-left"
              >
                <FileCode className={`h-5 w-5 ${
                  activeFile?.id === file.id ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <span className={`truncate text-sm ${
                  activeFile?.id === file.id ? 'font-medium text-blue-900' : 'text-gray-700'
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
                className="opacity-0 group-hover:opacity-100 h-7 w-7 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-md transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
