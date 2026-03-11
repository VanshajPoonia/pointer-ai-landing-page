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
      prompt: `You are an expert code analyzer for ${language}. Your job is to find ALL bugs, errors, and issues in code.

CRITICAL - You MUST check for these issues:

1. **TYPOS IN FUNCTION/METHOD NAMES** (MOST IMPORTANT):
   - "console.lg" should be "console.log" (JavaScript)
   - "console.lgo" should be "console.log"
   - "prnit" should be "print" (Python)
   - "pirnt" should be "print"
   - "documnet" should be "document"
   - Any misspelled built-in function or method names

2. **COMMENT vs CODE MISMATCH**:
   - If a comment says "print user input" but the code doesn't take any input, report it
   - If a comment describes functionality that the code doesn't implement, report it
   - If a comment says "calculate sum" but code calculates something else, report it

3. **SYNTAX ERRORS**:
   - Missing brackets, parentheses, semicolons
   - Unclosed strings or quotes
   - Invalid syntax for the language

4. **UNDEFINED REFERENCES**:
   - Using variables before declaring them
   - Calling functions that don't exist
   - Accessing properties on undefined objects

5. **LOGIC ERRORS**:
   - Infinite loops
   - Off-by-one errors
   - Incorrect conditionals

Code with line numbers:
${codeWithLineNumbers}

RESPOND WITH ONLY THIS JSON FORMAT (no markdown, no extra text):
{"issues":[{"line":6,"column":1,"endLine":6,"endColumn":12,"message":"Typo: 'console.lg' should be 'console.log'","severity":"error","suggestion":"Change 'console.lg' to 'console.log'"}]}

RULES:
- line/endLine: Use the exact line numbers shown above (1-indexed)
- column: Start position of the issue (1-indexed)
- endColumn: End position of the issue
- severity: "error" for bugs that will crash, "warning" for potential issues, "info" for suggestions
- suggestion: How to fix it
- If no issues: {"issues":[]}

BE THOROUGH. Find every single typo and bug. Do not miss obvious errors like "console.lg".`,
    })

    // Parse the response
    let issues = []
    try {
      const text = result.text.trim()
      // Remove markdown code blocks if present
      const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(jsonText)
      issues = parsed.issues || []
    } catch {
      issues = []
    }

    return Response.json({ issues })
  } catch (error) {
    console.error('AI analysis error:', error)
    return Response.json({ issues: [] })
  }
}
