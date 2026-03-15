'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  FolderOpen, 
  Trash2, 
  Clock, 
  Code2, 
  Globe, 
  FileCode,
  MoreVertical,
  LogOut,
  User
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface Project {
  id: string
  name: string
  description: string | null
  template: string
  created_at: string
  updated_at: string
  last_opened_at: string
}

const TEMPLATE_INFO: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
  web: { name: 'HTML/CSS/JS', icon: <Globe className="h-5 w-5" />, color: 'text-orange-500' },
  python: { name: 'Python', icon: <FileCode className="h-5 w-5" />, color: 'text-blue-500' },
  nodejs: { name: 'Node.js', icon: <Code2 className="h-5 w-5" />, color: 'text-green-500' },
  typescript: { name: 'TypeScript', icon: <FileCode className="h-5 w-5" />, color: 'text-blue-400' },
  cpp: { name: 'C++', icon: <Code2 className="h-5 w-5" />, color: 'text-purple-500' },
  java: { name: 'Java', icon: <FileCode className="h-5 w-5" />, color: 'text-red-500' },
  go: { name: 'Go', icon: <Code2 className="h-5 w-5" />, color: 'text-cyan-500' },
  rust: { name: 'Rust', icon: <Code2 className="h-5 w-5" />, color: 'text-orange-600' },
}

export default function DashboardPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTemplate, setFilterTemplate] = useState<string>('all')
  const [showNewProject, setShowNewProject] = useState(false)
  const [user, setUser] = useState<{ email?: string } | null>(null)

  useEffect(() => {
    fetchProjects()
    fetchUser()
  }, [])

  const fetchUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      if (data.projects) {
        setProjects(data.projects)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    try {
      const res = await fetch(`/api/projects?id=${projectId}`, { method: 'DELETE' })
      if (res.ok) {
        setProjects(projects.filter(p => p.id !== projectId))
      }
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  const openProject = async (projectId: string) => {
    // Update last_opened_at
    const supabase = createClient()
    await supabase
      .from('projects')
      .update({ last_opened_at: new Date().toISOString() })
      .eq('id', projectId)
    
    router.push(`/ide/${projectId}`)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesFilter = filterTemplate === 'all' || project.template === filterTemplate
    return matchesSearch && matchesFilter
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {/* Header */}
      <header className="border-b border-[#262626] bg-[#0d0d0d]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="text-xl font-semibold text-white">Volt</span>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 text-[#a1a1a1] hover:text-white">
                  <div className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="hidden sm:inline">{user?.email?.split('@')[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#262626]">
                <DropdownMenuItem className="text-[#a1a1a1]">
                  {user?.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#262626]" />
                <DropdownMenuItem onClick={handleLogout} className="text-red-400 cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Title and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Your Projects</h1>
            <p className="text-[#666]">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
          </div>
          <Button
            onClick={() => setShowNewProject(true)}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1a1a] border-[#262626] text-white placeholder:text-[#666] focus:border-amber-500/50"
            />
          </div>
          <select
            value={filterTemplate}
            onChange={(e) => setFilterTemplate(e.target.value)}
            className="px-4 py-2 bg-[#1a1a1a] border border-[#262626] rounded-md text-white focus:border-amber-500/50 focus:outline-none"
          >
            <option value="all">All Templates</option>
            {Object.entries(TEMPLATE_INFO).map(([key, info]) => (
              <option key={key} value={key}>{info.name}</option>
            ))}
          </select>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-[#1a1a1a] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="h-16 w-16 text-[#333] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery || filterTemplate !== 'all' ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-[#666] mb-6">
              {searchQuery || filterTemplate !== 'all' 
                ? 'Try adjusting your search or filter'
                : 'Create your first project to get started'}
            </p>
            {!searchQuery && filterTemplate === 'all' && (
              <Button
                onClick={() => setShowNewProject(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProjects.map((project) => {
              const templateInfo = TEMPLATE_INFO[project.template] || TEMPLATE_INFO.web
              return (
                <div
                  key={project.id}
                  onClick={() => openProject(project.id)}
                  className="group relative bg-[#1a1a1a] border border-[#262626] rounded-xl p-5 cursor-pointer hover:border-[#333] transition-all hover:bg-[#1f1f1f]"
                >
                  {/* Template Icon */}
                  <div className={`w-10 h-10 rounded-lg bg-[#262626] flex items-center justify-center mb-4 ${templateInfo.color}`}>
                    {templateInfo.icon}
                  </div>

                  {/* Project Info */}
                  <h3 className="font-semibold text-white mb-1 truncate">{project.name}</h3>
                  <p className="text-sm text-[#666] mb-3 line-clamp-2 h-10">
                    {project.description || 'No description'}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-[#666]">
                    <span className={templateInfo.color}>{templateInfo.name}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(project.last_opened_at || project.updated_at)}
                    </span>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4 text-[#666]" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#262626]">
                      <DropdownMenuItem 
                        onClick={(e) => deleteProject(project.id, e as unknown as React.MouseEvent)}
                        className="text-red-400 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {showNewProject && (
        <NewProjectModal 
          onClose={() => setShowNewProject(false)} 
          onCreated={(project) => {
            setProjects([project, ...projects])
            setShowNewProject(false)
            router.push(`/ide/${project.id}`)
          }}
        />
      )}
    </div>
  )
}

// New Project Modal Component
function NewProjectModal({ 
  onClose, 
  onCreated 
}: { 
  onClose: () => void
  onCreated: (project: Project) => void 
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [template, setTemplate] = useState('web')
  const [creating, setCreating] = useState(false)

  const templates = [
    { id: 'web', name: 'HTML/CSS/JS', description: 'Build websites with live preview', icon: <Globe className="h-6 w-6" />, color: 'from-orange-500 to-amber-500' },
    { id: 'python', name: 'Python', description: 'General purpose programming', icon: <FileCode className="h-6 w-6" />, color: 'from-blue-500 to-blue-600' },
    { id: 'nodejs', name: 'Node.js', description: 'JavaScript runtime environment', icon: <Code2 className="h-6 w-6" />, color: 'from-green-500 to-emerald-600' },
    { id: 'typescript', name: 'TypeScript', description: 'Typed JavaScript', icon: <FileCode className="h-6 w-6" />, color: 'from-blue-400 to-blue-500' },
    { id: 'cpp', name: 'C++', description: 'High-performance applications', icon: <Code2 className="h-6 w-6" />, color: 'from-purple-500 to-purple-600' },
    { id: 'java', name: 'Java', description: 'Enterprise applications', icon: <FileCode className="h-6 w-6" />, color: 'from-red-500 to-red-600' },
    { id: 'go', name: 'Go', description: 'Efficient compiled language', icon: <Code2 className="h-6 w-6" />, color: 'from-cyan-500 to-cyan-600' },
    { id: 'rust', name: 'Rust', description: 'Memory-safe systems language', icon: <Code2 className="h-6 w-6" />, color: 'from-orange-600 to-orange-700' },
  ]

  const createProject = async () => {
    if (!name.trim()) return
    setCreating(true)

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, template }),
      })
      const data = await res.json()
      if (data.project) {
        onCreated(data.project)
      }
    } catch (error) {
      console.error('Failed to create project:', error)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#262626]">
          <h2 className="text-2xl font-bold text-white">Create New Project</h2>
          <p className="text-[#666] mt-1">Choose a template to get started</p>
        </div>

        <div className="p-6">
          {/* Project Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">Project Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Project"
              className="bg-[#0d0d0d] border-[#262626] text-white placeholder:text-[#666] focus:border-amber-500/50"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">Description (optional)</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of your project"
              className="bg-[#0d0d0d] border-[#262626] text-white placeholder:text-[#666] focus:border-amber-500/50"
            />
          </div>

          {/* Template Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-3">Select Template</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    template === t.id
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-[#262626] hover:border-[#333] bg-[#0d0d0d]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${t.color} flex items-center justify-center text-white mb-3`}>
                    {t.icon}
                  </div>
                  <div className="font-medium text-white text-sm">{t.name}</div>
                  <div className="text-xs text-[#666] mt-1 line-clamp-2">{t.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#262626] flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-[#a1a1a1] hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={createProject}
            disabled={!name.trim() || creating}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </div>
    </div>
  )
}
