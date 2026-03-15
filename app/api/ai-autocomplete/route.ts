import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamText } from 'ai'
import { gateway } from '@ai-sdk/gateway'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { code, language, cursorPosition, prefix, suffix } = await request.json()

    // Build context around cursor
    const contextBefore = prefix || code.substring(Math.max(0, cursorPosition - 500), cursorPosition)
    const contextAfter = suffix || code.substring(cursorPosition, Math.min(code.length, cursorPosition + 200))

    const systemPrompt = `You are an AI code completion assistant like GitHub Copilot. 
You provide inline code completions that naturally continue the code the user is writing.

Rules:
- Only output the completion text, nothing else
- Do not include explanations, markdown, or code blocks
- Complete the current line or add a few lines maximum
- Match the existing code style, indentation, and patterns
- Be concise - suggest just enough to be helpful
- If unsure, provide a minimal sensible completion
- Consider the language: ${language}

IMPORTANT - Comment-driven development:
- If the line before cursor is a comment describing what to do (like "// add two numbers" or "# sort the array"), generate the actual code implementation
- Comments are hints about what code the user wants - implement them
- After a comment, generate working code that fulfills what the comment describes
- Match the indentation of the comment when generating code`

    const userPrompt = `Complete this ${language} code. Output ONLY the completion text.

Code before cursor:
\`\`\`
${contextBefore}
\`\`\`

Code after cursor:
\`\`\`
${contextAfter}
\`\`\`

Provide the completion that should go at the cursor position:`

    const result = await streamText({
      model: gateway('openai/gpt-4o-mini'),
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 150,
      temperature: 0.2,
    })

    // Collect the streamed text
    let completion = ''
    for await (const chunk of result.textStream) {
      completion += chunk
    }

    // Clean up the completion
    completion = completion
      .replace(/^```[\w]*\n?/gm, '')
      .replace(/```$/gm, '')
      .trim()

    return NextResponse.json({ completion })
  } catch (error) {
    console.error('Autocomplete error:', error)
    return NextResponse.json(
      { error: 'Failed to generate completion' },
      { status: 500 }
    )
  }
}
