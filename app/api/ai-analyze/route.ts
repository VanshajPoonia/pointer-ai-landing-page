import { generateText } from 'ai'

export const maxDuration = 30

export async function POST(req: Request) {
  const { code, language }: { code: string; language: string } = await req.json()

  if (!code || code.trim().length < 5) {
    return Response.json({ issues: [] })
  }

  // Add line numbers for reference
  const codeWithLineNumbers = code
    .split('\n')
    .map((line, i) => `${i + 1}: ${line}`)
    .join('\n')

  try {
    const result = await generateText({
      model: 'openai/gpt-4o-mini',
      prompt: `You are a code analyzer. Analyze the following ${language} code for bugs, errors, and issues.

IMPORTANT: Look for these specific issues:
1. Typos in function/method names (e.g., "console.lg" instead of "console.log", "prnit" instead of "print")
2. Syntax errors (missing brackets, semicolons, quotes)
3. Undefined variables or functions
4. Logic errors
5. Best practice violations

Code with line numbers:
${codeWithLineNumbers}

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{"issues":[{"line":1,"column":1,"endLine":1,"endColumn":10,"message":"description","severity":"error","suggestion":"fix"}]}

Rules:
- line/endLine: 1-indexed line numbers
- column/endColumn: 1-indexed column positions  
- severity: must be "error", "warning", "info", or "hint"
- suggestion: can be null or a string with the fix
- If no issues found, return: {"issues":[]}

Find ALL issues in the code.`,
    })

    // Parse the response
    let issues = []
    try {
      const text = result.text.trim()
      // Remove markdown code blocks if present
      const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(jsonText)
      issues = parsed.issues || []
    } catch (parseError) {
      console.error('Failed to parse AI response:', result.text)
      issues = []
    }

    return Response.json({ issues })
  } catch (error) {
    console.error('AI analysis error:', error)
    return Response.json({ issues: [] })
  }
}
