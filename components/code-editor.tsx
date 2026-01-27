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
      // Popular languages
      javascript: 'javascript',
      typescript: 'typescript',
      python: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      csharp: 'csharp',
      go: 'go',
      rust: 'rust',
      // Web & Scripting
      php: 'php',
      ruby: 'ruby',
      perl: 'perl',
      lua: 'lua',
      bash: 'shell',
      powershell: 'powershell',
      html: 'html',
      css: 'css',
      // Mobile & Modern
      kotlin: 'kotlin',
      swift: 'swift',
      dart: 'dart',
      objectivec: 'objective-c',
      // Functional & JVM
      scala: 'scala',
      haskell: 'haskell',
      elixir: 'elixir',
      clojure: 'clojure',
      fsharp: 'fsharp',
      groovy: 'groovy',
      // Data & Scientific
      r: 'r',
      julia: 'julia',
      matlab: 'matlab',
      // Systems & Performance
      zig: 'rust', // Monaco doesn't have Zig, using Rust as fallback
      nim: 'python', // Monaco doesn't have Nim, using Python as fallback
      crystal: 'ruby', // Monaco doesn't have Crystal, using Ruby as fallback
      d: 'd',
      v: 'go', // Monaco doesn't have V, using Go as fallback
      // Data & Config
      sql: 'sql',
      json: 'json',
      yaml: 'yaml',
      xml: 'xml',
      toml: 'ini',
      graphql: 'graphql',
      // Other
      assembly: 'asm',
      fortran: 'fortran',
      cobol: 'cobol',
      lisp: 'scheme',
      erlang: 'erlang',
      ocaml: 'ocaml',
      pascal: 'pascal',
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
          // Enable all keyboard shortcuts
          quickSuggestions: true,
          acceptSuggestionOnEnter: 'on',
          formatOnPaste: true,
          formatOnType: true,
          autoIndent: 'full',
          bracketPairColorization: { enabled: true },
          suggest: {
            showKeywords: true,
            showSnippets: true,
          },
          // Enable multi-cursor and other advanced features
          multiCursorModifier: 'ctrlCmd',
          snippetSuggestions: 'top',
          // Allow all keybindings
          contextmenu: true,
          find: {
            addExtraSpaceOnTop: true,
            autoFindInSelection: 'never',
            seedSearchStringFromSelection: 'selection',
          },
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
