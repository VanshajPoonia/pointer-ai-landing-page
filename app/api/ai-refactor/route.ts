import { streamText } from 'ai'
import { gateway } from '@ai-sdk/gateway'

export const maxDuration = 60

const REFACTOR_PROMPTS: Record<string, string> = {
  'extract-function': `You are a code refactoring expert. Extract the selected code into a new function.

Rules:
1. Create a well-named function based on what the code does
2. Identify all variables used from outer scope and make them parameters
3. Determine the return type based on what the code produces
4. Add TypeScript types for parameters and return value
5. Ensure the extracted function is pure when possible
6. Show both the new function and how to call it from the original location

Respond with JSON:
{
  "newFunction": "// The extracted function code",
  "callSite": "// How to call the function from original location",
  "explanation": "Brief explanation of the refactoring"
}`,

  'extract-component': `You are a React refactoring expert. Extract the selected JSX into a new React component.

Rules:
1. Create a properly named component (PascalCase)
2. Identify all props needed from the parent scope
3. Add TypeScript interface for props
4. Use proper React patterns (hooks, event handlers)
5. Keep state in the appropriate component
6. Handle any callbacks/events properly

Respond with JSON:
{
  "newComponent": "// The extracted component code with interface",
  "usage": "// How to use the component in the parent",
  "explanation": "Brief explanation of the refactoring"
}`,

  'rename-symbol': `You are a code refactoring expert. Rename the specified symbol throughout the code.

Rules:
1. Find ALL occurrences of the symbol
2. Handle different contexts (declaration, usage, imports, exports)
3. Preserve string literals that coincidentally match
4. Update any JSDoc or comments referencing the symbol
5. Maintain consistency with naming conventions

Respond with JSON:
{
  "renamedCode": "// The full code with renamed symbol",
  "changesCount": number,
  "locations": ["line:column descriptions of changes"],
  "explanation": "Brief explanation of the refactoring"
}`,

  'convert-to-async': `You are a code refactoring expert. Convert the function to use async/await.

Rules:
1. Add async keyword to function declaration
2. Convert .then() chains to await
3. Convert .catch() to try/catch blocks
4. Handle Promise.all and Promise.race appropriately
5. Maintain error handling semantics
6. Update return types to Promise<T>

Respond with JSON:
{
  "refactoredCode": "// The converted async/await code",
  "explanation": "Brief explanation of changes made"
}`,

  'simplify-conditionals': `You are a code refactoring expert. Simplify the conditional logic.

Rules:
1. Apply De Morgan's laws where helpful
2. Use early returns to reduce nesting
3. Convert nested ifs to guard clauses
4. Simplify boolean expressions
5. Use ternary operators where appropriate (but not nested)
6. Consider switch statements for multiple conditions

Respond with JSON:
{
  "refactoredCode": "// The simplified code",
  "explanation": "Brief explanation of simplifications made"
}`,

  'add-error-handling': `You are a code refactoring expert. Add comprehensive error handling.

Rules:
1. Wrap risky operations in try/catch
2. Add input validation
3. Handle edge cases (null, undefined, empty)
4. Add meaningful error messages
5. Consider error boundaries for React components
6. Add optional logging/telemetry hooks

Respond with JSON:
{
  "refactoredCode": "// Code with error handling added",
  "explanation": "Brief explanation of error handling added"
}`,

  'optimize-performance': `You are a code optimization expert. Optimize the code for better performance.

Rules:
1. Memoize expensive calculations (useMemo, useCallback for React)
2. Avoid unnecessary re-renders
3. Optimize loops and iterations
4. Use appropriate data structures
5. Reduce memory allocations
6. Add performance-related comments

Respond with JSON:
{
  "refactoredCode": "// The optimized code",
  "optimizations": ["List of optimizations applied"],
  "explanation": "Brief explanation of performance improvements"
}`,

  'convert-to-typescript': `You are a TypeScript expert. Add proper TypeScript types to the code.

Rules:
1. Add explicit types to function parameters
2. Add return types to functions
3. Create interfaces for object shapes
4. Use proper generic types where applicable
5. Avoid 'any' type - use 'unknown' or proper types
6. Add type guards where needed

Respond with JSON:
{
  "refactoredCode": "// Code with TypeScript types",
  "newTypes": "// Any new interfaces/types created",
  "explanation": "Brief explanation of types added"
}`,

  'modernize-syntax': `You are a JavaScript/TypeScript expert. Modernize the code to use latest ES features.

Rules:
1. Convert var to const/let
2. Use arrow functions where appropriate
3. Use destructuring
4. Use template literals
5. Use spread operator
6. Use optional chaining and nullish coalescing
7. Use modern array methods (map, filter, reduce)

Respond with JSON:
{
  "refactoredCode": "// The modernized code",
  "modernizations": ["List of modern features applied"],
  "explanation": "Brief explanation of changes"
}`
}

export async function POST(req: Request) {
  try {
    const { code, refactorType, language, symbolName, newName, context } = await req.json()

    if (!code || !refactorType) {
      return Response.json(
        { error: 'Code and refactor type are required' },
        { status: 400 }
      )
    }

    const systemPrompt = REFACTOR_PROMPTS[refactorType]
    if (!systemPrompt) {
      return Response.json(
        { error: 'Invalid refactor type' },
        { status: 400 }
      )
    }

    let userPrompt = `Language: ${language || 'typescript'}

Code to refactor:
\`\`\`${language || 'typescript'}
${code}
\`\`\``

    // Add extra context for specific refactor types
    if (refactorType === 'rename-symbol' && symbolName && newName) {
      userPrompt += `\n\nRename symbol: "${symbolName}" -> "${newName}"`
    }

    if (context) {
      userPrompt += `\n\nAdditional context: ${context}`
    }

    const result = streamText({
      model: gateway('anthropic/claude-sonnet-4'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.2,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('AI Refactor error:', error)
    return Response.json(
      { error: 'Failed to process refactoring request' },
      { status: 500 }
    )
  }
}
