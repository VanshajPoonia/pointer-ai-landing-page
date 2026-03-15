"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  FolderPlus,
  Search,
  Star,
  Clock,
  Download,
  ExternalLink,
  Check,
  Layers,
  Server,
  Globe,
  Database,
  Zap
} from 'lucide-react'

interface ProjectTemplate {
  id: string
  name: string
  description: string
  category: 'frontend' | 'backend' | 'fullstack' | 'api'
  framework: string
  icon: React.ReactNode
  tags: string[]
  stars?: number
  downloads?: number
  files: {
    path: string
    content: string
  }[]
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

interface ProjectTemplatesProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: ProjectTemplate, projectName: string) => void
}

const templates: ProjectTemplate[] = [
  {
    id: 'nextjs-app',
    name: 'Next.js App',
    description: 'A modern Next.js application with App Router, TypeScript, and Tailwind CSS',
    category: 'fullstack',
    framework: 'Next.js 15',
    icon: <Globe className="h-6 w-6" />,
    tags: ['React', 'TypeScript', 'Tailwind CSS', 'App Router'],
    stars: 12500,
    downloads: 450000,
    dependencies: {
      'next': '^15.0.0',
      'react': '^18.3.0',
      'react-dom': '^18.3.0'
    },
    devDependencies: {
      'typescript': '^5.4.0',
      '@types/react': '^18.3.0',
      '@types/node': '^20.0.0',
      'tailwindcss': '^3.4.0',
      'postcss': '^8.4.0',
      'autoprefixer': '^10.4.0'
    },
    files: [
      {
        path: 'app/page.tsx',
        content: `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Welcome to Next.js</h1>
      <p className="mt-4 text-gray-600">Get started by editing app/page.tsx</p>
    </main>
  )
}`
      },
      {
        path: 'app/layout.tsx',
        content: `import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Next.js App',
  description: 'Created with Next.js'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`
      }
    ]
  },
  {
    id: 'react-vite',
    name: 'React + Vite',
    description: 'Fast React development with Vite, TypeScript, and modern tooling',
    category: 'frontend',
    framework: 'React 18',
    icon: <Zap className="h-6 w-6" />,
    tags: ['React', 'Vite', 'TypeScript', 'Fast Refresh'],
    stars: 8900,
    downloads: 320000,
    dependencies: {
      'react': '^18.3.0',
      'react-dom': '^18.3.0'
    },
    devDependencies: {
      'vite': '^5.0.0',
      '@vitejs/plugin-react': '^4.0.0',
      'typescript': '^5.4.0',
      '@types/react': '^18.3.0',
      '@types/react-dom': '^18.3.0'
    },
    files: [
      {
        path: 'src/App.tsx',
        content: `import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <h1>Vite + React</h1>
      <button onClick={() => setCount(c => c + 1)}>
        count is {count}
      </button>
    </div>
  )
}

export default App`
      },
      {
        path: 'src/main.tsx',
        content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
      }
    ]
  },
  {
    id: 'express-api',
    name: 'Express API',
    description: 'RESTful API with Express.js, TypeScript, and best practices',
    category: 'api',
    framework: 'Express.js',
    icon: <Server className="h-6 w-6" />,
    tags: ['Node.js', 'Express', 'TypeScript', 'REST'],
    stars: 6200,
    downloads: 180000,
    dependencies: {
      'express': '^4.18.0',
      'cors': '^2.8.0',
      'helmet': '^7.0.0',
      'morgan': '^1.10.0'
    },
    devDependencies: {
      'typescript': '^5.4.0',
      '@types/express': '^4.17.0',
      '@types/node': '^20.0.0',
      'ts-node': '^10.9.0',
      'nodemon': '^3.0.0'
    },
    files: [
      {
        path: 'src/index.ts',
        content: `import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(helmet())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`)
})`
      }
    ]
  },
  {
    id: 'nextjs-fullstack',
    name: 'Next.js Full-Stack',
    description: 'Full-stack app with Next.js, Prisma, and authentication',
    category: 'fullstack',
    framework: 'Next.js 15',
    icon: <Layers className="h-6 w-6" />,
    tags: ['Next.js', 'Prisma', 'Auth', 'PostgreSQL'],
    stars: 9800,
    downloads: 280000,
    dependencies: {
      'next': '^15.0.0',
      'react': '^18.3.0',
      'react-dom': '^18.3.0',
      '@prisma/client': '^5.0.0',
      'next-auth': '^5.0.0'
    },
    devDependencies: {
      'typescript': '^5.4.0',
      'prisma': '^5.0.0',
      '@types/react': '^18.3.0'
    },
    files: [
      {
        path: 'app/page.tsx',
        content: `import { auth } from '@/auth'

export default async function Home() {
  const session = await auth()
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Full-Stack App</h1>
      {session ? (
        <p className="mt-4">Welcome, {session.user?.name}</p>
      ) : (
        <p className="mt-4">Please sign in to continue</p>
      )}
    </main>
  )
}`
      },
      {
        path: 'prisma/schema.prisma',
        content: `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}`
      }
    ]
  },
  {
    id: 'supabase-app',
    name: 'Supabase Starter',
    description: 'Next.js app with Supabase authentication and database',
    category: 'fullstack',
    framework: 'Next.js + Supabase',
    icon: <Database className="h-6 w-6" />,
    tags: ['Supabase', 'Auth', 'PostgreSQL', 'Real-time'],
    stars: 7500,
    downloads: 210000,
    dependencies: {
      'next': '^15.0.0',
      'react': '^18.3.0',
      '@supabase/supabase-js': '^2.0.0',
      '@supabase/ssr': '^0.1.0'
    },
    devDependencies: {
      'typescript': '^5.4.0',
      '@types/react': '^18.3.0'
    },
    files: [
      {
        path: 'lib/supabase/client.ts',
        content: `import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}`
      },
      {
        path: 'app/page.tsx',
        content: `import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Supabase App</h1>
      {user ? (
        <p className="mt-4">Welcome, {user.email}</p>
      ) : (
        <p className="mt-4">Please sign in</p>
      )}
    </main>
  )
}`
      }
    ]
  },
  ]

const categoryIcons: Record<string, React.ReactNode> = {
  frontend: <Globe className="h-4 w-4" />,
  backend: <Server className="h-4 w-4" />,
  fullstack: <Layers className="h-4 w-4" />,
  api: <Server className="h-4 w-4" />
}

export function ProjectTemplates({
  isOpen,
  onClose,
  onSelectTemplate
}: ProjectTemplatesProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)
  const [projectName, setProjectName] = useState('')

  const categories = ['frontend', 'fullstack', 'api', 'mobile']

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = !selectedCategory || t.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleCreate = () => {
    if (selectedTemplate && projectName.trim()) {
      onSelectTemplate(selectedTemplate, projectName.trim())
      setSelectedTemplate(null)
      setProjectName('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg w-[900px] max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#3c3c3c]">
          <div className="flex items-center gap-3">
            <FolderPlus className="h-5 w-5 text-green-400" />
            <h2 className="text-lg font-semibold text-white">New Project</h2>
          </div>
          <Button
            onClick={onClose}
            size="sm"
            variant="ghost"
            className="text-[#cccccc] hover:bg-[#3c3c3c]"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-[#3c3c3c]">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#858585]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="pl-10 bg-[#3c3c3c] border-[#3c3c3c] text-white"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setSelectedCategory(null)}
              size="sm"
              variant="ghost"
              className={`capitalize ${
                !selectedCategory
                  ? 'bg-[#3c3c3c] text-white'
                  : 'text-[#858585] hover:bg-[#3c3c3c]'
              }`}
            >
              All
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                size="sm"
                variant="ghost"
                className={`capitalize flex items-center gap-1 ${
                  selectedCategory === cat
                    ? 'bg-[#3c3c3c] text-white'
                    : 'text-[#858585] hover:bg-[#3c3c3c]'
                }`}
              >
                {categoryIcons[cat]}
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 min-h-0">
          {/* Templates Grid */}
          <ScrollArea className="flex-1 p-4">
            <div className="grid grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'bg-[#37373d] border-blue-500'
                      : 'bg-[#2d2d2d] border-[#3c3c3c] hover:border-[#4c4c4c]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      selectedTemplate?.id === template.id ? 'bg-blue-500/20 text-blue-400' : 'bg-[#3c3c3c] text-[#cccccc]'
                    }`}>
                      {template.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white truncate">{template.name}</h3>
                        {selectedTemplate?.id === template.id && (
                          <Check className="h-4 w-4 text-blue-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-[#858585] mt-1 line-clamp-2">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px] border-[#3c3c3c] text-[#cccccc]">
                          {template.framework}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {template.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-[#3c3c3c] text-[#858585]">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-[#858585]">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {(template.stars || 0).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {(template.downloads || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Detail Panel */}
          {selectedTemplate && (
            <div className="w-80 border-l border-[#3c3c3c] p-4 bg-[#252526] flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                  {selectedTemplate.icon}
                </div>
                <div>
                  <h3 className="font-medium text-white">{selectedTemplate.name}</h3>
                  <span className="text-xs text-[#858585]">{selectedTemplate.framework}</span>
                </div>
              </div>

              <p className="text-sm text-[#858585] mb-4">
                {selectedTemplate.description}
              </p>

              <div className="mb-4">
                <h4 className="text-xs font-medium text-[#858585] uppercase mb-2">Includes</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedTemplate.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-[10px] border-[#3c3c3c] text-[#cccccc]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-xs font-medium text-[#858585] uppercase mb-2">Files</h4>
                <div className="space-y-1">
                  {selectedTemplate.files.map(file => (
                    <div key={file.path} className="text-xs text-[#cccccc] font-mono">
                      {file.path}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto">
                <label className="text-sm text-[#858585] mb-2 block">Project Name</label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="my-project"
                  className="bg-[#3c3c3c] border-[#3c3c3c] text-white mb-3"
                />
                <Button
                  onClick={handleCreate}
                  disabled={!projectName.trim()}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
