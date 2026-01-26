import { NextRequest, NextResponse } from 'next/server'

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
