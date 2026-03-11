import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PISTON_API = 'https://emkc.org/api/v2/piston'

const languageMap: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  cpp: 'c++',
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
  bash: 'bash',
  haskell: 'haskell',
  groovy: 'groovy',
  fsharp: 'fsharp',
  clojure: 'clojure',
  elixir: 'elixir',
}

export async function POST(request: NextRequest) {
  try {
    const { language, code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 })
    }

    // Check authentication and usage limits (optional - allow guest execution)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // If user is logged in, check their limits
    if (user) {
      // Get user profile to check admin status and execution count
      const { data: profile } = await supabase
        .from('users')
        .select('is_admin, is_premium, free_executions_remaining')
        .eq('id', user.id)
        .single()

      // Check if user has executions remaining (skip for admins)
      if (!profile?.is_admin && !profile?.is_premium && (profile?.free_executions_remaining || 0) <= 0) {
        return NextResponse.json({ 
          error: 'Execution limit reached. Please upgrade to continue.',
          limit_reached: true 
        }, { status: 403 })
      }

      // Decrement free executions (only for non-admin, non-premium users)
      if (!profile?.is_admin && !profile?.is_premium) {
        await supabase
          .from('users')
          .update({ 
            free_executions_remaining: (profile?.free_executions_remaining || 100) - 1 
          })
          .eq('id', user.id)
      }
    }
    // Guest users can execute code without limits (for now - can add IP-based limits later)

    const pistonLanguage = languageMap[language] || language

    console.log('[v0] Executing code for language:', pistonLanguage)

    // Get available runtimes
    const runtimesResponse = await fetch(`${PISTON_API}/runtimes`)
    
    if (!runtimesResponse.ok) {
      console.log('[v0] Failed to fetch runtimes:', runtimesResponse.statusText)
      return NextResponse.json(
        { error: 'Failed to connect to code execution service' },
        { status: 503 }
      )
    }
    
    const runtimes = await runtimesResponse.json()
    
    const runtime = runtimes.find(
      (r: any) => r.language === pistonLanguage || r.language.toLowerCase() === pistonLanguage.toLowerCase()
    )

    if (!runtime) {
      console.log('[v0] Available runtimes:', runtimes.map((r: any) => r.language))
      console.log('[v0] Requested language:', pistonLanguage)
      return NextResponse.json(
        { error: `Language ${language} (${pistonLanguage}) is not currently supported by the execution service` },
        { status: 400 }
      )
    }

    // Execute code
    const executeResponse = await fetch(`${PISTON_API}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: pistonLanguage,
        version: runtime.version,
        files: [
          {
            content: code,
          },
        ],
      }),
    })

    const result = await executeResponse.json()

    console.log('[v0] Execution result:', JSON.stringify(result, null, 2))

    if (result.run) {
      const stdout = result.run.stdout || ''
      const stderr = result.run.stderr || ''
      const output = result.run.output || ''
      
      // Combine all output
      let finalOutput = stdout || output
      if (stderr) {
        finalOutput = finalOutput ? `${finalOutput}\n\nErrors:\n${stderr}` : stderr
      }
      
      return NextResponse.json({
        output: finalOutput || '(No output)',
        success: !stderr || stderr.trim() === '',
      })
    }

    if (result.message) {
      console.log('[v0] Execution error:', result.message)
      return NextResponse.json({ error: result.message }, { status: 500 })
    }

    return NextResponse.json({ error: 'Execution failed' }, { status: 500 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
