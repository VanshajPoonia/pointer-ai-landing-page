import { generateText } from 'ai'

export const maxDuration = 30

export async function POST(req: Request) {
  const { code, language, checkComments = true }: { 
    code: string
    language: string
    checkComments?: boolean 
  } = await req.json()

  if (!code || code.trim().length < 5) {
    return Response.json({ issues: [] })
  }

  // Add line numbers for reference
  const codeWithLineNumbers = code
    .split('\n')
    .map((line, i) => `${i + 1}: ${line}`)
    .join('\n')

  const commentCheckSection = checkComments ? `
### 2. COMMENT vs CODE MISMATCH [severity: warning, category: comment-mismatch]
IMPORTANT: Read each comment carefully and check if the code below it actually does what the comment says.
Examples:
- Comment says "// get user input" but code doesn't use prompt(), readline(), or any input function -> REPORT IT
- Comment says "// calculate sum" but code calculates product -> REPORT IT  
- Comment says "// print hello world" but code prints something else -> REPORT IT
- Comment says "// loop through array" but there's no loop -> REPORT IT
- Comment describes one thing but code does something completely different -> REPORT IT
` : ''

  try {
    const result = await generateText({
      model: 'openai/gpt-4o-mini',
      prompt: `You are an expert code analyzer for ${language}. Analyze the code and find ALL issues.

## ISSUE TYPES TO CHECK (in order of importance):

### 1. TYPOS IN FUNCTION/METHOD NAMES [severity: error, category: typo]
Examples of typos to catch:
- "console.lg" -> "console.log"
- "console.lgo" -> "console.log"  
- "prnit" -> "print"
- "documnet" -> "document"
- "lenght" -> "length"
- "fucntion" -> "function"
- ANY misspelled function, method, or property name
${commentCheckSection}
### 3. SYNTAX ERRORS [severity: error, category: syntax]
- Missing brackets, parentheses, semicolons
- Unclosed strings or quotes
- Invalid syntax

### 4. UNDEFINED REFERENCES [severity: error, category: undefined]
- Variables used before declaration
- Functions that don't exist
- Accessing undefined properties

### 5. LOGIC ERRORS [severity: warning, category: logic]
- Infinite loops
- Dead code
- Unreachable code

## CODE TO ANALYZE:
${codeWithLineNumbers}

## RESPONSE FORMAT (JSON only, no markdown):
{"issues":[{"line":1,"column":1,"endLine":1,"endColumn":10,"message":"Description","severity":"error","category":"typo","suggestion":"How to fix"}]}

## RULES:
- line numbers are 1-indexed (match the numbers shown)
- severity: "error" (will crash), "warning" (potential issue), "info" (suggestion)
- category: "typo", "comment-mismatch", "syntax", "undefined", "logic", or "other"
- If no issues found: {"issues":[]}
- Be THOROUGH - check every line, every comment
- Do NOT miss typos like "console.lg"`,
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
