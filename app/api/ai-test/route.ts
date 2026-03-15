import { streamText } from 'ai'
import { gateway } from '@ai-sdk/gateway'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { code, language, framework, functionName } = await req.json()

    if (!code) {
      return Response.json({ error: 'Code is required' }, { status: 400 })
    }

    // Determine test framework based on language if not provided
    let testFramework = framework
    if (!testFramework) {
      if (language === 'python') {
        testFramework = 'pytest'
      } else if (['javascript', 'typescript', 'jsx', 'tsx'].includes(language)) {
        testFramework = 'jest'
      } else {
        testFramework = 'jest' // Default
      }
    }

    const systemPrompt = `You are an expert test engineer. Generate comprehensive unit tests for code.
    
    Guidelines:
    - Use ${testFramework} framework syntax and conventions
    - Include tests for:
      - Happy path scenarios
      - Edge cases (empty inputs, null values, boundary conditions)
      - Error handling
      - Different input types if applicable
    - Use descriptive test names that explain what's being tested
    - Include setup/teardown if needed
    - Add comments explaining complex test logic
    - Aim for good coverage of all code paths
    
    For Jest:
    - Use describe/it blocks
    - Use expect() assertions
    - Mock external dependencies if needed
    
    For Pytest:
    - Use test_ prefix for functions
    - Use assert statements
    - Use fixtures for setup
    - Use parametrize for multiple test cases`

    const functionContext = functionName 
      ? `Focus on testing the function "${functionName}".` 
      : 'Generate tests for all functions/methods in the code.'

    const userPrompt = `Generate unit tests for this ${language} code using ${testFramework}.
${functionContext}

CODE:
\`\`\`${language}
${code}
\`\`\`

Return ONLY the test code, ready to run.`

    const result = streamText({
      model: gateway('anthropic/claude-sonnet-4'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('AI Test Generator error:', error)
    return Response.json(
      { error: 'Failed to generate tests' },
      { status: 500 }
    )
  }
}
