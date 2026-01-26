'use client'

import { useEffect, useRef } from 'react'
import * as monaco from 'monaco-editor'

interface CodeEditorProps {
  value: string
  language: string
  onChange: (value: string) => void
}

export function CodeEditor({ value, language, onChange }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  useEffect(() => {
    if (editorRef.current && !monacoEditorRef.current) {
      monacoEditorRef.current = monaco.editor.create(editorRef.current, {
        value,
        language: language === 'cpp' ? 'cpp' : language,
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 13,
        fontFamily: "'Consolas', 'Courier New', monospace",
        fontLigatures: true,
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
        glyphMargin: true,
        lineDecorationsWidth: 0,
        lineNumbersMinChars: 3,
        renderWhitespace: 'selection',
        scrollbar: {
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
        },
      })

      monacoEditorRef.current.onDidChangeModelContent(() => {
        onChange(monacoEditorRef.current?.getValue() || '')
      })
    }

    return () => {
      monacoEditorRef.current?.dispose()
      monacoEditorRef.current = null
    }
  }, [])

  useEffect(() => {
    if (monacoEditorRef.current && monacoEditorRef.current.getValue() !== value) {
      monacoEditorRef.current.setValue(value)
    }
  }, [value])

  useEffect(() => {
    if (monacoEditorRef.current) {
      const model = monacoEditorRef.current.getModel()
      if (model) {
        monaco.editor.setModelLanguage(model, language === 'cpp' ? 'cpp' : language)
      }
    }
  }, [language])

  return <div ref={editorRef} className="h-full w-full" />
}
