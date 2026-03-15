import { streamText } from 'ai'
import { gateway } from '@ai-sdk/gateway'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { code, language, mode } = await req.json()

    if (!code) {
      return Response.json({ error: 'Code is required' }, { status: 400 })
    }

    let systemPrompt = ''
    let userPrompt = ''

    switch (mode) {
      case 'explain':
        systemPrompt = `You are an expert code explainer. Explain code in a clear, educational way.
        - Break down the code into logical sections
        - Explain what each part does
        - Highlight any patterns, algorithms, or best practices used
        - Keep explanations concise but thorough`
        userPrompt = `Explain the following ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``
        break

      case 'document':
        systemPrompt = `You are a technical documentation expert. Generate comprehensive documentation for code.
        - Use JSDoc/TSDoc format for JavaScript/TypeScript
        - Use docstrings for Python
        - Include parameter descriptions, return values, and examples
        - Add inline comments for complex logic`
        userPrompt = `Generate documentation for this ${language} code. Return ONLY the documented code:\n\n\`\`\`${language}\n${code}\n\`\`\``
        break

      case 'complexity':
        systemPrompt = `You are a code complexity analyst. Analyze code complexity and provide insights.
        - Determine time complexity (Big O notation)
        - Determine space complexity
        - Identify potential performance bottlenecks
        - Suggest optimizations if applicable
        - Rate overall complexity: Low, Medium, High, Very High`
        userPrompt = `Analyze the complexity of this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``
        break

      default:
        systemPrompt = 'You are an expert programmer. Help explain the code.'
        userPrompt = `Explain this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``
    }

    const result = streamText({
      model: gateway('anthropic/claude-sonnet-4'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('AI Explain error:', error)
    return Response.json(
      { error: 'Failed to explain code' },
      { status: 500 }
    )
  }
}
