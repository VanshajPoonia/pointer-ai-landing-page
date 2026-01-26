'use client'

import Editor from '@monaco-editor/react'

interface CodeEditorProps {
  value: string
  language: string
  onChange: (value: string) => void
}

export function CodeEditor({ value, language, onChange }: CodeEditorProps) {
  const getMonacoLanguage = (lang: string) => {
    const languageMap: Record<string, string> = {
      javascript: 'javascript',
      typescript: 'typescript',
      python: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      csharp: 'csharp',
      go: 'go',
      rust: 'rust',
      php: 'php',
      ruby: 'ruby',
      kotlin: 'kotlin',
      swift: 'swift',
      scala: 'scala',
      perl: 'perl',
      lua: 'lua',
      r: 'r',
      dart: 'dart',
      elixir: 'elixir',
      haskell: 'haskell',
      sql: 'sql',
      bash: 'shell',
      powershell: 'powershell',
    }
    return languageMap[lang] || 'javascript'
  }

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={getMonacoLanguage(language)}
        value={value}
        theme="vs-dark"
        onChange={(val) => onChange(val || '')}
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          tabSize: 2,
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          smoothScrolling: true,
          cursorBlinking: 'blink',
          cursorStyle: 'line',
          folding: true,
          glyphMargin: false,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 4,
          padding: { top: 16, bottom: 16 },
          automaticLayout: true,
        }}
        loading={
          <div className="h-full w-full flex items-center justify-center bg-[#1e1e1e]">
            <div className="text-[#808080] text-sm">Loading editor...</div>
          </div>
        }
      />
    </div>
  )
}
