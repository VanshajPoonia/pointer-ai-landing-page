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

export async function POST(req: Request) {
  const { messages, code, language }: { messages: UIMessage[]; code?: string; language?: string } = await req.json()

  // Build system prompt for code assistance
  const systemPrompt = `You are Volt AI, an expert AI coding assistant similar to Claude Code. You are integrated into the Volt online IDE and can help developers write, debug, and generate code.

## YOUR CAPABILITIES:
1. **Generate Code**: Write complete, working code from natural language descriptions
2. **Fix Bugs**: Find and fix all bugs including typos like "console.lg", syntax errors, logic bugs
3. **Explain Code**: Break down complex code and explain what it does
4. **Improve Code**: Suggest optimizations, better patterns, and best practices
5. **Debug**: Help identify why code isn't working
6. **Modify Code**: Make changes to existing code based on user requests

## CURRENT CODE CONTEXT:
${code ? `The user is working with this ${language || 'code'}:
\`\`\`${language || ''}
${code}
\`\`\`` : 'No code in editor yet.'}

## IMPORTANT INSTRUCTIONS:

### When generating or fixing code:
- ALWAYS provide the COMPLETE code in a properly formatted code block
- Use the correct language tag: \`\`\`${language || 'javascript'}
- The user can click "Apply to editor" to replace their code with yours
- Don't give partial code - give the full working version

### When asked to "generate", "create", "write", or "make" something:
- Generate complete, working code immediately
- Include comments explaining key parts
- Make sure it's ready to run

### When asked to "fix" code:
- Identify ALL issues (typos, bugs, logic errors)
- Explain what was wrong
- Provide the COMPLETE corrected code

### Check for comment/code mismatches:
- If a comment says "print user input" but code doesn't take input, point it out
- If comments don't match what the code does, flag it

### Examples of what users might ask:
- "Write a function that sorts an array" -> Generate complete sorting function
- "Fix my code" -> Find all bugs and provide corrected version
- "Add error handling" -> Modify the code to include try/catch
- "Make this code faster" -> Optimize and provide improved version
- "What does this code do?" -> Explain line by line

Be helpful, thorough, and always provide working code when appropriate.`

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
