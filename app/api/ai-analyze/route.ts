import { generateText, Output } from 'ai'
import { z } from 'zod'

export const maxDuration = 30

const issueSchema = z.object({
  issues: z.array(z.object({
    line: z.number(),
    column: z.number(),
    endLine: z.number(),
    endColumn: z.number(),
    message: z.string(),
    severity: z.enum(['error', 'warning', 'info', 'hint']),
    suggestion: z.string().nullable(),
  })),
})

export async function POST(req: Request) {
  const { code, language }: { code: string; language: string } = await req.json()

  if (!code || code.trim().length < 5) {
    return Response.json({ issues: [] })
  }

  try {
    const result = await generateText({
      model: 'openai/gpt-4o-mini',
      output: Output.object({ schema: issueSchema }),
      prompt: `Analyze the following ${language} code for bugs, errors, and potential issues. Focus on:
- Syntax errors
- Logic errors
- Undefined variables
- Type mismatches
- Security vulnerabilities
- Performance issues
- Best practice violations

Return a JSON object with an "issues" array. Each issue should have:
- line: the line number (1-indexed)
- column: the column number (1-indexed)
- endLine: the ending line number
- endColumn: the ending column number
- message: a clear description of the issue
- severity: "error", "warning", "info", or "hint"
- suggestion: a suggested fix (or null if not applicable)

If the code is correct or you can't find any issues, return an empty issues array.

Code to analyze:
\`\`\`${language}
${code}
\`\`\``,
    })

    return Response.json(result.object || { issues: [] })
  } catch (error) {
    console.error('AI analysis error:', error)
    return Response.json({ issues: [] })
  }
}
