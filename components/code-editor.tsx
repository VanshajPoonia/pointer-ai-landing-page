'use client'

import { useRef, useEffect } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

export interface CodeIssue {
  id?: string
  line: number
  column: number
  endLine: number
  endColumn: number
  message: string
  severity: 'error' | 'warning' | 'info' | 'hint'
  suggestion?: string | null
  category?: 'syntax' | 'typo' | 'comment-mismatch' | 'logic' | 'undefined' | 'other'
  ignored?: boolean
}

interface CursorPosition {
  line: number
  column: number
}

interface Selection {
  startLine: number
  startColumn: number
  endLine: number
  endColumn: number
}

interface GhostTextSuggestion {
  text: string
  position: { lineNumber: number; column: number }
}

interface CodeEditorProps {
  value: string
  language: string
  onChange: (value: string) => void
  issues?: CodeIssue[]
  onEditorReady?: (editor: editor.IStandaloneCodeEditor) => void
  onCursorChange?: (position: CursorPosition, selection?: Selection) => void
  ghostText?: GhostTextSuggestion | null
  onAcceptGhostText?: () => string
  onDismissGhostText?: () => void
}

export function CodeEditor({ 
  value, 
  language, 
  onChange, 
  issues = [], 
  onEditorReady, 
  onCursorChange,
  ghostText,
  onAcceptGhostText,
  onDismissGhostText,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null)
  const ghostTextDecorationsRef = useRef<string[]>([])

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    if (onEditorReady) {
      onEditorReady(editor)
    }

    // Listen for cursor position changes
    if (onCursorChange) {
      editor.onDidChangeCursorPosition((e) => {
        const selection = editor.getSelection()
        const position = { line: e.position.lineNumber - 1, column: e.position.column - 1 }
        
        if (selection && !selection.isEmpty()) {
          onCursorChange(position, {
            startLine: selection.startLineNumber - 1,
            startColumn: selection.startColumn - 1,
            endLine: selection.endLineNumber - 1,
            endColumn: selection.endColumn - 1,
          })
        } else {
          onCursorChange(position)
        }
      })
    }

    // Add Tab key handler for accepting ghost text
    editor.addCommand(monaco.KeyCode.Tab, () => {
      if (ghostText && onAcceptGhostText) {
        const suggestion = onAcceptGhostText()
        if (suggestion) {
          const position = editor.getPosition()
          if (position) {
            editor.executeEdits('ai-autocomplete', [{
              range: new monaco.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column
              ),
              text: suggestion,
            }])
          }
          return
        }
      }
      // Default Tab behavior
      editor.trigger('keyboard', 'tab', {})
    })

    // Add Escape key handler for dismissing ghost text
    editor.addCommand(monaco.KeyCode.Escape, () => {
      if (ghostText && onDismissGhostText) {
        onDismissGhostText()
      }
    })
  }

  // Render ghost text (AI suggestion) as inline decoration
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return
    
    const editor = editorRef.current
    const monaco = monacoRef.current

    // Clear previous ghost text decorations
    if (ghostTextDecorationsRef.current.length > 0) {
      editor.removeDecorations(ghostTextDecorationsRef.current)
      ghostTextDecorationsRef.current = []
    }

    if (ghostText && ghostText.text) {
      // Create inline decoration for ghost text
      const decorations = editor.createDecorationsCollection([
        {
          range: new monaco.Range(
            ghostText.position.lineNumber,
            ghostText.position.column,
            ghostText.position.lineNumber,
            ghostText.position.column
          ),
          options: {
            after: {
              content: ghostText.text,
              inlineClassName: 'ai-ghost-text',
            },
            description: 'ai-autocomplete-ghost-text',
          },
        },
      ])
      ghostTextDecorationsRef.current = decorations.getRanges().map(() => '')
    }
  }, [ghostText])

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
