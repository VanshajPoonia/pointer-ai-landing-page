import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET all projects for current user
export async function GET() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ projects })
}

// Template starter files
const TEMPLATE_FILES: Record<string, Array<{ name: string; content: string; language: string }>> = {
  web: [
    { name: 'index.html', content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Web Project</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Hello, World!</h1>
  <p>Start editing to see your changes in the live preview.</p>
  <script src="script.js"></script>
</body>
</html>`, language: 'html' },
    { name: 'style.css', content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
}

h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

p {
  color: #888;
}`, language: 'css' },
    { name: 'script.js', content: `// Your JavaScript code here
console.log('Hello from JavaScript!');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded');
});`, language: 'javascript' },
  ],
  python: [
    { name: 'main.py', content: `# Python Project
# Run this file to see the output

def main():
    print("Hello, World!")
    
    # Your code here
    name = input("Enter your name: ") if False else "Developer"
    print(f"Welcome, {name}!")

if __name__ == "__main__":
    main()`, language: 'python' },
  ],
  nodejs: [
    { name: 'index.js', content: `// Node.js Project
console.log('Hello from Node.js!');

// Example: Simple HTTP server
// const http = require('http');
// const server = http.createServer((req, res) => {
//   res.writeHead(200, { 'Content-Type': 'text/plain' });
//   res.end('Hello World!');
// });
// server.listen(3000);

const greet = (name) => {
  return \`Hello, \${name}!\`;
};

console.log(greet('Developer'));`, language: 'javascript' },
    { name: 'package.json', content: `{
  "name": "nodejs-project",
  "version": "1.0.0",
  "description": "A Node.js project",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  }
}`, language: 'json' },
  ],
  cpp: [
    { name: 'main.cpp', content: `#include <iostream>
#include <string>

using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    
    string name = "Developer";
    cout << "Welcome, " << name << "!" << endl;
    
    return 0;
}`, language: 'cpp' },
  ],
  java: [
    { name: 'Main.java', content: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        String name = "Developer";
        System.out.println("Welcome, " + name + "!");
    }
}`, language: 'java' },
  ],
  typescript: [
    { name: 'index.ts', content: `// TypeScript Project
interface User {
  name: string;
  age: number;
}

const greet = (user: User): string => {
  return \`Hello, \${user.name}! You are \${user.age} years old.\`;
};

const user: User = {
  name: 'Developer',
  age: 25,
};

console.log(greet(user));`, language: 'typescript' },
    { name: 'tsconfig.json', content: `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist"
  },
  "include": ["*.ts"],
  "exclude": ["node_modules"]
}`, language: 'json' },
  ],
  go: [
    { name: 'main.go', content: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
    
    name := "Developer"
    fmt.Printf("Welcome, %s!\\n", name)
}`, language: 'go' },
  ],
  rust: [
    { name: 'main.rs', content: `fn main() {
    println!("Hello, World!");
    
    let name = "Developer";
    println!("Welcome, {}!", name);
}`, language: 'rust' },
  ],
}

// POST create new project
export async function POST(req: Request) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, description, template = 'web' } = await req.json()

  // Create project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: name || 'Untitled Project',
      description: description || '',
      template: template,
      last_opened_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 })
  }

  // Create default branch
  const { error: branchError } = await supabase
    .from('git_branches')
    .insert({
      project_id: project.id,
      name: 'main',
      is_default: true,
    })

  if (branchError) {
    console.error('Failed to create default branch:', branchError)
  }

  // Create root folder
  const { data: rootFolder, error: rootError } = await supabase
    .from('files')
    .insert({
      project_id: project.id,
      name: 'root',
      type: 'folder',
      path: '/',
      parent_id: null,
    })
    .select()
    .single()

  if (rootError) {
    console.error('Failed to create root folder:', rootError)
  }

  // Create template files
  const templateFiles = TEMPLATE_FILES[template] || TEMPLATE_FILES.web
  for (const file of templateFiles) {
    const { error: fileError } = await supabase
      .from('files')
      .insert({
        project_id: project.id,
        name: file.name,
        type: 'file',
        path: `/${file.name}`,
        parent_id: rootFolder?.id,
        content: file.content,
        language: file.language,
      })
    
    if (fileError) {
      console.error(`Failed to create file ${file.name}:`, fileError)
    }
  }

  return NextResponse.json({ project, rootFolderId: rootFolder?.id })
}

// DELETE project
export async function DELETE(req: Request) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('id')

  if (!projectId) {
    return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
  }

  // Delete all related data first (files, branches, commits, etc.)
  await supabase.from('files').delete().eq('project_id', projectId)
  await supabase.from('git_commits').delete().eq('project_id', projectId)
  await supabase.from('git_branches').delete().eq('project_id', projectId)
  await supabase.from('git_staged_files').delete().eq('project_id', projectId)
  
  // Delete the project
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
