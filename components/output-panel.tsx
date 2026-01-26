'use client'

interface OutputPanelProps {
  output: string
}

export function OutputPanel({ output }: OutputPanelProps) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">Output</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
        <pre className="font-mono text-sm text-gray-100 whitespace-pre-wrap leading-relaxed">
          {output || (
            <span className="text-gray-500">Run your code to see output here...</span>
          )}
        </pre>
      </div>
    </div>
  )
}
