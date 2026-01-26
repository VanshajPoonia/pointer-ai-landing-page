'use client'

interface OutputPanelProps {
  output: string
}

export function OutputPanel({ output }: OutputPanelProps) {
  return (
    <div className="flex h-full flex-col bg-[#1e1e1e]">
      <div className="flex items-center h-[35px] px-4 bg-[#252526] border-b border-[#191919]">
        <h3 className="text-[11px] font-semibold text-white uppercase tracking-wide">Output</h3>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 bg-[#1e1e1e]">
        <pre className="font-mono text-[13px] text-[#cccccc] whitespace-pre-wrap leading-[1.4]">
          {output || (
            <span className="text-[#6a6a6a]">Run your code to see output here...</span>
          )}
        </pre>
      </div>
    </div>
  )
}
