'use client'

import { useRef, useEffect } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

export interface CodeIssue {
  line: number
  column: number
  endLine: number
  endColumn: number
  message: string
  severity: 'error' | 'warning' | 'info' | 'hint'
  suggestion?: string | null
}

interface CodeEditorProps {
  value: string
  language: string
  onChange: (value: string) => void
  issues?: CodeIssue[]
  onEditorReady?: (editor: editor.IStandaloneCodeEditor) => void
}

export function CodeEditor({ value, language, onChange, issues = [], onEditorReady }: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null)

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    if (onEditorReady) {
      onEditorReady(editor)
    }
  }

  // Update markers when issues change
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return

    const model = editorRef.current.getModel()
    if (!model) return

    const monaco = monacoRef.current

    const severityMap = {
      error: monaco.MarkerSeverity.Error,
      warning: monaco.MarkerSeverity.Warning,
      info: monaco.MarkerSeverity.Info,
      hint: monaco.MarkerSeverity.Hint,
    }

    const markers = issues.map((issue) => ({
      startLineNumber: issue.line,
      startColumn: issue.column,
      endLineNumber: issue.endLine,
      endColumn: issue.endColumn,
      message: issue.suggestion 
        ? `${issue.message}\n\nSuggestion: ${issue.suggestion}`
        : issue.message,
      severity: severityMap[issue.severity],
      source: 'Volt AI',
    }))

    monaco.editor.setModelMarkers(model, 'volt-ai', markers)
  }, [issues])

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
        onMount={handleEditorMount}
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
