export interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  content?: string // Only for files
  language?: string // Only for files
  children?: string[] // Only for folders - array of child IDs
  parentId?: string | null
  isNew?: boolean // Flag for newly created files awaiting name input
  dbId?: string // Database ID for syncing with Supabase
}

export interface FileSystemState {
  nodes: Record<string, FileNode>
  rootId: string
}

export const createDefaultFileSystem = (): FileSystemState => {
  const root: FileNode = {
    id: 'root',
    name: '~',
    type: 'folder',
    children: [],
    parentId: null,
  }

  return {
    nodes: { root },
    rootId: 'root',
  }
}

export const getLanguageTemplate = (language: string): { filename: string; content: string } => {
  const templates: Record<string, { filename: string; content: string }> = {
    javascript: {
      filename: 'main.js',
      content: `// JavaScript Template
console.log("Hello, World!");

// Your code here
`,
    },
    typescript: {
      filename: 'main.ts',
      content: `// TypeScript Template
const greeting: string = "Hello, World!";
console.log(greeting);

// Your code here
`,
    },
    python: {
      filename: 'main.py',
      content: `# Python Template
print("Hello, World!")

# Your code here
`,
    },
    java: {
      filename: 'Main.java',
      content: `// Java Template
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`,
    },
    cpp: {
      filename: 'main.cpp',
      content: `// C++ Template
#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
`,
    },
    c: {
      filename: 'main.c',
      content: `// C Template
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
`,
    },
    csharp: {
      filename: 'Program.cs',
      content: `// C# Template
using System;

class Program {
    static void Main(string[] args) {
        Console.WriteLine("Hello, World!");
    }
}
`,
    },
    go: {
      filename: 'main.go',
      content: `// Go Template
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
`,
    },
    rust: {
      filename: 'main.rs',
      content: `// Rust Template
fn main() {
    println!("Hello, World!");
}
`,
    },
    php: {
      filename: 'index.php',
      content: `<?php
// PHP Template
echo "Hello, World!\\n";

// Your code here
?>
`,
    },
    ruby: {
      filename: 'main.rb',
      content: `# Ruby Template
puts "Hello, World!"

# Your code here
`,
    },
    kotlin: {
      filename: 'Main.kt',
      content: `// Kotlin Template
fun main() {
    println("Hello, World!")
}
`,
    },
    swift: {
      filename: 'main.swift',
      content: `// Swift Template
print("Hello, World!")

// Your code here
`,
    },
    dart: {
      filename: 'main.dart',
      content: `// Dart Template
void main() {
  print('Hello, World!');
}
`,
    },
    scala: {
      filename: 'Main.scala',
      content: `// Scala Template
object Main extends App {
  println("Hello, World!")
}
`,
    },
    haskell: {
      filename: 'Main.hs',
      content: `-- Haskell Template
main :: IO ()
main = putStrLn "Hello, World!"
`,
    },
    elixir: {
      filename: 'main.ex',
      content: `# Elixir Template
IO.puts("Hello, World!")

# Your code here
`,
    },
    r: {
      filename: 'main.R',
      content: `# R Template
print("Hello, World!")

# Your code here
`,
    },
    lua: {
      filename: 'main.lua',
      content: `-- Lua Template
print("Hello, World!")

-- Your code here
`,
    },
    perl: {
      filename: 'main.pl',
      content: `#!/usr/bin/perl
# Perl Template
print "Hello, World!\\n";

# Your code here
`,
    },
    bash: {
      filename: 'script.sh',
      content: `#!/bin/bash
# Bash Template
echo "Hello, World!"

# Your code here
`,
    },
    sql: {
      filename: 'query.sql',
      content: `-- SQL Template
SELECT 'Hello, World!' AS greeting;

-- Your queries here
`,
    },
    html: {
      filename: 'index.html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hello World</title>
</head>
<body>
    <h1>Hello, World!</h1>
</body>
</html>
`,
    },
    css: {
      filename: 'styles.css',
      content: `/* CSS Template */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
}

h1 {
    color: #333;
}
`,
    },
  }

  return templates[language] || {
    filename: `main.${language}`,
    content: `// ${language.charAt(0).toUpperCase() + language.slice(1)} Template\n// Your code here\n`,
  }
}

export const getNodePath = (nodes: Record<string, FileNode>, nodeId: string): string => {
  const node = nodes[nodeId]
  if (!node || nodeId === 'root') return '~'
  
  const pathParts: string[] = []
  let current: FileNode | undefined = node
  
  while (current && current.parentId) {
    pathParts.unshift(current.name)
    current = nodes[current.parentId]
  }
  
  return '~/' + pathParts.join('/')
}

export const findNodeByPath = (
  nodes: Record<string, FileNode>,
  path: string
): FileNode | null => {
  if (path === '~') return nodes.root
  
  const parts = path.replace(/^~\/?/, '').split('/').filter(Boolean)
  let currentNode = nodes.root
  
  for (const part of parts) {
    if (!currentNode.children) return null
    const childId = currentNode.children.find(childId => nodes[childId]?.name === part)
    if (!childId) return null
    currentNode = nodes[childId]
  }
  
  return currentNode
}

export const downloadFile = (node: FileNode) => {
  if (node.type !== 'file' || !node.content) return
  
  const blob = new Blob([node.content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = node.name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
