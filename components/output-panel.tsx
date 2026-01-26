'use client'

interface OutputPanelProps {
  output: string
}

export function OutputPanel({ output }: OutputPanelProps) {
  return (
    <div className="flex h-full flex-col bg-[#1e1e1e]">
      <div className="px-4 py-2 bg-[#252526]">
        <h3 className="text-xs font-semibold text-[#cccccc] uppercase tracking-wider">Output</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 bg-[#1e1e1e]">
        <pre className="font-mono text-sm text-[#cccccc] whitespace-pre-wrap leading-relaxed">
          {output || (
            <span className="text-[#6a6a6a]">Run your code to see output here...</span>
          )}
        </pre>
      </div>
    </div>
  )
}
