'use client'

interface OutputPanelProps {
  output: string
}

export function OutputPanel({ output }: OutputPanelProps) {
  return (
    <div className="flex h-full flex-col bg-[#1e1e1e]">
      <div className="border-b border-[#333] px-4 py-2 text-sm font-medium text-[#ccc]">
        OUTPUT
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <pre className="font-mono text-sm text-[#ccc] whitespace-pre-wrap">
          {output || 'Run your code to see output here...'}
        </pre>
      </div>
    </div>
  )
}
