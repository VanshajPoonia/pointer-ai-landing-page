'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { CodeEditor } from './code-editor'
import { Terminal } from './terminal'
import { FileExplorer } from './file-explorer'
import { OutputPanel } from './output-panel'
import { IDEHeader } from './ide-header'
import { createClient } from '@/lib/supabase/client'
import { Button } from './ui/button'
import { Play, Save, FileCode } from 'lucide-react'

interface CodeFile {
  id: string
  name: string
  language: string
  content: string
  user_id: string
  created_at: string
  updated_at: string
}

interface IDEInterfaceProps {
  user: User
}

export function IDEInterface({ user }: IDEInterfaceProps) {
  const [files, setFiles] = useState<CodeFile[]>([])
  const [activeFile, setActiveFile] = useState<CodeFile | null>(null)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [executions, setExecutions] = useState(0)
  const [isPaid, setIsPaid] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadFiles()
    loadUserData()
  }, [])

  const loadUserData = async () => {
    const { data } = await supabase
      .from('users')
      .select('free_executions_remaining, is_premium, is_admin')
      .eq('id', user.id)
      .single()

    if (data) {
      setExecutions(100 - (data.free_executions_remaining || 100))
      setIsPaid(data.is_premium || false)
      setIsAdmin(data.is_admin || false)
    }
  }

  const loadFiles = async () => {
    const { data } = await supabase
      .from('code_snippets')
      .select('*')
      .order('updated_at', { ascending: false })

    if (data) {
      setFiles(data)
      if (data.length > 0 && !activeFile) {
        setActiveFile(data[0])
        setCode(data[0].content)
        setLanguage(data[0].language)
      }
    }
  }

  const saveFile = async () => {
    if (activeFile) {
      await supabase
        .from('code_snippets')
        .update({ content: code, updated_at: new Date().toISOString() })
        .eq('id', activeFile.id)
    } else {
      const { data } = await supabase
        .from('code_snippets')
        .insert({
          name: `Untitled-${Date.now()}`,
          language,
          content: code,
          user_id: user.id,
        })
        .select()
        .single()

      if (data) {
        setActiveFile(data)
      }
    }
    loadFiles()
  }

  const createNewFile = async () => {
    const { data } = await supabase
      .from('code_snippets')
      .insert({
        name: `Untitled-${Date.now()}`,
        language: 'javascript',
        content: '// Write your code here\n',
        user_id: user.id,
      })
      .select()
      .single()

    if (data) {
      setFiles([data, ...files])
      setActiveFile(data)
      setCode(data.content)
      setLanguage(data.language)
    }
  }

  const runCode = async () => {
    if (!isAdmin && !isPaid && executions >= 100) {
      setOutput('You have reached the free tier limit of 100 executions. Please upgrade to continue.')
      return
    }

    setIsRunning(true)
    setOutput('Running...')

    try {
      // Client-side execution for JS/TS
      if (language === 'javascript' || language === 'typescript') {
        const logs: string[] = []
        const originalLog = console.log
        console.log = (...args: any[]) => {
          logs.push(args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '))
        }

        try {
          // eslint-disable-next-line no-eval
          eval(code)
          setOutput(logs.length > 0 ? logs.join('\n') : 'Code executed successfully (no output)')
        } catch (error: any) {
          setOutput(`Error: ${error.message}`)
        } finally {
          console.log = originalLog
        }
      } else {
        // Server-side execution via Piston API
        const response = await fetch('/api/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language, code }),
        })

        const result = await response.json()
        
        if (result.error) {
          setOutput(`Error: ${result.error}`)
        } else {
          setOutput(result.output || 'No output')
        }
      }

      // Log execution
      await supabase.from('executions').insert({
        user_id: user.id,
        language,
        code,
      })

      // Reload user data to get updated execution count
      loadUserData()
    } catch (error: any) {
      setOutput(`Error: ${error.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-[#1e1e1e]">
      <IDEHeader 
        user={user} 
        executions={executions} 
        isPaid={isPaid}
        isAdmin={isAdmin}
        onNewFile={createNewFile}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <FileExplorer
          files={files}
          activeFile={activeFile}
          onSelectFile={(file) => {
            setActiveFile(file)
            setCode(file.content)
            setLanguage(file.language)
          }}
          onDeleteFile={async (fileId) => {
            await supabase.from('code_snippets').delete().eq('id', fileId)
            loadFiles()
            if (activeFile?.id === fileId) {
              setActiveFile(null)
              setCode('')
            }
          }}
        />

        <div className="flex flex-1 flex-col">
          {/* Tab bar */}
          <div className="flex items-center h-9 bg-[#252526] border-b border-[#1e1e1e]">
            {activeFile && (
              <div className="flex items-center gap-2 px-4 h-full bg-[#1e1e1e] text-sm text-[#cccccc] border-r border-[#1e1e1e]">
                <FileCode className="h-3.5 w-3.5" />
                {activeFile.name}
              </div>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between h-10 bg-[#1e1e1e] border-b border-[#252526] px-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={saveFile}
                size="sm"
                variant="ghost"
                className="h-7 text-[#cccccc] hover:bg-[#2a2d2e] text-xs"
              >
                <Save className="mr-1.5 h-3.5 w-3.5" />
                Save
              </Button>
              <Button
                onClick={runCode}
                size="sm"
                disabled={isRunning}
                className="h-7 bg-[#0e639c] hover:bg-[#1177bb] text-white text-xs"
              >
                <Play className="mr-1.5 h-3.5 w-3.5" />
                {isRunning ? 'Running...' : 'Run'}
              </Button>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="h-7 rounded bg-[#3c3c3c] border border-[#3c3c3c] px-3 text-xs text-[#cccccc] focus:border-[#007acc] focus:outline-none"
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
              <option value="php">PHP</option>
              <option value="ruby">Ruby</option>
            </select>
          </div>

          {/* Editor and Output */}
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1">
              <CodeEditor
                value={code}
                language={language}
                onChange={setCode}
              />
            </div>
            <div className="w-[400px] border-l border-[#252526]">
              <OutputPanel output={output} />
            </div>
          </div>

          {/* Terminal */}
          <div className="h-[200px] border-t border-[#252526]">
            <Terminal output={output} onClear={() => setOutput('')} />
          </div>
        </div>
      </div>
    </div>
  )
}
