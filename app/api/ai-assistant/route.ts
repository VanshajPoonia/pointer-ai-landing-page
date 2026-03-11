import {
  consumeStream,
  convertToModelMessages,
  streamText,
  UIMessage,
} from 'ai'

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages, code, language }: { messages: UIMessage[]; code?: string; language?: string } = await req.json()

  // Build system prompt for code assistance
  const systemPrompt = `You are Volt AI, an expert coding assistant integrated into the Volt online IDE. You help developers write, debug, and understand code.

Your capabilities:
- Explain code and concepts clearly
- Find and fix bugs in code (typos like "console.lg" instead of "console.log", syntax errors, logic bugs)
- Suggest improvements and best practices
- Help with syntax and language-specific questions
- Generate complete, working code snippets

${code ? `The user is currently working with the following ${language || 'code'}:
\`\`\`${language || ''}
${code}
\`\`\`` : ''}

IMPORTANT INSTRUCTIONS:
1. When asked to fix bugs, provide the COMPLETE corrected code in a code block
2. When you provide code, the user can click "Apply to editor" to use it directly
3. Be specific about what bugs/issues you found and how you fixed them
4. Always use proper code blocks with language tags (\`\`\`javascript, \`\`\`python, etc.)
5. Look for common mistakes like typos in function names (prnit vs print, console.lg vs console.log)

Be concise but thorough. If you spot bugs or issues, fix them and explain what was wrong.`

  const result = streamText({
    model: 'openai/gpt-4o-mini',
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    consumeSseStream: consumeStream,
  })
}
