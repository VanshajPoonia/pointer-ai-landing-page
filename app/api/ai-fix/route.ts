import { generateText } from 'ai'
import { gateway } from '@ai-sdk/gateway'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { code, error, language } = await req.json()

    if (!code || !error) {
      return Response.json({ error: 'Code and error are required' }, { status: 400 })
    }

    const systemPrompt = `You are an expert bug fixer. Analyze code and errors to provide fixes.
    
    IMPORTANT: You must respond in valid JSON format with this exact structure:
    {
      "diagnosis": "Brief explanation of what's causing the error",
      "fixedCode": "The complete fixed code",
      "changes": ["List of specific changes made"],
      "explanation": "Detailed explanation of why this fix works"
    }
    
    Rules:
    - Always return the COMPLETE fixed code, not just the changed parts
    - Preserve code formatting and style
    - Make minimal changes to fix the specific error
    - Do not add unnecessary modifications`

    const userPrompt = `Fix this ${language} code that has the following error:

ERROR:
${error}

CODE:
\`\`\`${language}
${code}
\`\`\`

Respond with valid JSON only.`

    const result = await generateText({
      model: gateway('anthropic/claude-sonnet-4'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.2,
    })

    // Parse the JSON response
    let parsed
    try {
      // Try to extract JSON from the response
      const jsonMatch = result.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch {
      // If parsing fails, return a structured error response
      return Response.json({
        diagnosis: 'Unable to parse fix suggestion',
        fixedCode: code,
        changes: [],
        explanation: result.text,
      })
    }

    return Response.json(parsed)
  } catch (error) {
    console.error('AI Fix error:', error)
    return Response.json(
      { error: 'Failed to fix code' },
      { status: 500 }
    )
  }
}
