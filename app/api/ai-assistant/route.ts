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
- Find and fix bugs in code
- Suggest improvements and best practices
- Help with syntax and language-specific questions
- Generate code snippets on request

${code ? `The user is currently working with the following ${language || 'code'}:
\`\`\`${language || ''}
${code}
\`\`\`` : ''}

Be concise but thorough. Use code blocks with proper syntax highlighting when showing code. If you spot bugs or issues in the code, point them out proactively.`

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
