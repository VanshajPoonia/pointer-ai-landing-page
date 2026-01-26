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
  go: 'go',
  rust: 'rust',
  php: 'php',
  ruby: 'ruby',
}

export async function POST(request: NextRequest) {
  try {
    const { language, code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 })
    }

    // Check authentication and usage limits
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    const pistonLanguage = languageMap[language] || language

    // Get available runtimes
    const runtimesResponse = await fetch(`${PISTON_API}/runtimes`)
    const runtimes = await runtimesResponse.json()
    
    const runtime = runtimes.find(
      (r: any) => r.language === pistonLanguage
    )

    if (!runtime) {
      return NextResponse.json(
        { error: `Language ${language} is not supported` },
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

    if (result.run) {
      const output = result.run.output || result.run.stdout || ''
      const stderr = result.run.stderr || ''
      
      return NextResponse.json({
        output: stderr ? `${output}\n${stderr}` : output,
        success: !stderr,
      })
    }

    return NextResponse.json({ error: 'Execution failed' }, { status: 500 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
