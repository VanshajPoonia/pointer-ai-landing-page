import {
  consumeStream,
  convertToModelMessages,
  streamText,
  UIMessage,
} from 'ai'

export const maxDuration = 30

// Mock response for when AI Gateway is unavailable (preview mode)
function createMockResponse(userMessage: string, code?: string): ReadableStream {
  const encoder = new TextEncoder()
  
  let mockResponse = ''
  
  if (userMessage.toLowerCase().includes('fix')) {
    mockResponse = `I'd be happy to help fix your code! 

**Note:** AI features require authentication. In preview mode, I'm showing a demo response.

To enable full AI functionality:
1. Deploy this project to Vercel
2. Ensure OIDC is enabled in your project settings
3. Run \`vercel env pull\` if developing locally

${code ? `Here's your current code for reference:
\`\`\`
${code.slice(0, 500)}${code.length > 500 ? '...' : ''}
\`\`\`` : ''}`
  } else if (userMessage.toLowerCase().includes('generate') || userMessage.toLowerCase().includes('create')) {
    mockResponse = `I can help you generate code!

**Note:** AI features require authentication. In preview mode, I'm showing a demo response.

Here's a sample function to get you started:

\`\`\`javascript
// Example function
function greet(name) {
  return \`Hello, \${name}! Welcome to Volt IDE.\`;
}

console.log(greet('Developer'));
\`\`\`

To enable full AI code generation, deploy this project to Vercel with OIDC enabled.`
  } else if (userMessage.toLowerCase().includes('explain')) {
    mockResponse = `I'd be happy to explain your code!

**Note:** AI features require authentication. In preview mode, I'm showing a demo response.

${code ? `Your code appears to be written in a programming language. A full explanation would analyze:
- The purpose of each function
- Variable usage and data flow
- Logic and control structures
- Potential improvements` : 'Please add some code to the editor for me to explain.'}`
  } else {
    mockResponse = `Thanks for your message!

**Note:** AI features require authentication. In preview mode, I'm showing a demo response.

I'm Volt AI, your coding assistant. I can help you:
- Generate code from descriptions
- Fix bugs and errors
- Explain code line by line
- Suggest improvements

To enable full AI functionality, deploy this project to Vercel with OIDC authentication enabled.`
  }
  
  return new ReadableStream({
    start(controller) {
      // Simulate streaming by sending the response in chunks
      const lines = mockResponse.split('\n')
      let index = 0
      
      const sendChunk = () => {
        if (index < lines.length) {
          const line = lines[index] + '\n'
          // Format as SSE data
          controller.enqueue(encoder.encode(`0:${JSON.stringify(line)}\n`))
          index++
          setTimeout(sendChunk, 50)
        } else {
          // Send finish message
          controller.enqueue(encoder.encode(`e:{"finishReason":"stop"}\n`))
          controller.enqueue(encoder.encode(`d:{"finishReason":"stop"}\n`))
          controller.close()
        }
      }
      
      sendChunk()
    }
  })
}

interface ProjectFile {
  id: string
  name: string
  path: string
  content: string
  language: string
}

export async function POST(req: Request) {
  const { messages, code, language, projectFiles, currentFilePath }: { 
    messages: UIMessage[]
    code?: string
    language?: string
    projectFiles?: ProjectFile[]
    currentFilePath?: string
  } = await req.json()

  // Build project context from all files
  const projectContext = projectFiles && projectFiles.length > 0
    ? `## PROJECT FILES (${projectFiles.length} files):
${projectFiles.map(f => `### ${f.path}
\`\`\`${f.language || 'text'}
${f.content.slice(0, 2000)}${f.content.length > 2000 ? '\n... (truncated)' : ''}
\`\`\``).join('\n\n')}`
    : ''

  // Build system prompt for code assistance
  const systemPrompt = `You are Volt AI, an expert AI coding assistant similar to Claude. You are integrated into the Volt online IDE and have access to the user's ENTIRE PROJECT, not just the current file. You can help with project-wide refactoring, cross-file analysis, and understanding the full codebase.

## YOUR CAPABILITIES:
1. **Project-Wide Understanding**: You can see ALL files in the project and understand how they connect
2. **Generate Code**: Write complete, working code from natural language descriptions
3. **Fix Bugs**: Find and fix all bugs including typos, syntax errors, logic bugs across files
4. **Explain Code**: Break down complex code and explain what it does
5. **Improve Code**: Suggest optimizations, better patterns, and best practices
6. **Refactor**: Help restructure code across multiple files
7. **Navigate**: Help users find where things are defined or used in the project

${projectContext}

## CURRENT FILE CONTEXT:
${currentFilePath ? `Currently editing: **${currentFilePath}**` : ''}
${code ? `
\`\`\`${language || 'text'}
${code}
\`\`\`` : 'No code in editor yet.'}

## IMPORTANT INSTRUCTIONS:

### You have project-wide context:
- You can reference other files in the project
- You can suggest changes to multiple files
- You understand imports, exports, and dependencies between files
- You can help with project architecture questions

### When generating or fixing code:
- ALWAYS provide the COMPLETE code in a properly formatted code block
- Use the correct language tag: \`\`\`${language || 'javascript'}
- The user can click "Apply to editor" to replace their code with yours
- Don't give partial code - give the full working version

### When asked about the project:
- You can answer questions about any file
- You can explain how different parts of the codebase work together
- You can suggest where to add new code based on existing patterns

### Examples of project-wide questions:
- "Where is the User type defined?" -> Search project files and show the location
- "How does the auth flow work?" -> Explain the full flow across files
- "Add a new API endpoint" -> Show where and how based on existing patterns
- "Refactor this function to use the existing utility" -> Reference the utility file

Be helpful, thorough, and leverage your full project context to provide accurate answers.`

  try {
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
  } catch (error: unknown) {
    // Check if it's an authentication error
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('401') || errorMessage.includes('OIDC') || errorMessage.includes('authentication')) {
      // Return mock response for preview mode
      const lastMessage = messages[messages.length - 1]
      const userText = typeof lastMessage?.content === 'string' 
        ? lastMessage.content 
        : Array.isArray(lastMessage?.content) 
          ? lastMessage.content.map((p: { type: string; text?: string }) => p.type === 'text' ? p.text : '').join(' ')
          : ''
      
      return new Response(createMockResponse(userText, code), {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }
    
    // Re-throw other errors
    throw error
  }
}
