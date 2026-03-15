"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  X,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Download,
  Upload,
  MoreVertical,
  Search,
  FileText,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react'

interface EnvVariable {
  id: string
  key: string
  value: string
  isSecret: boolean
  environment: 'development' | 'staging' | 'production' | 'all'
  description?: string
  lastModified: Date
}

interface EnvManagerProps {
  isOpen: boolean
  onClose: () => void
  variables?: { key: string; value: string; isSecret: boolean }[]
  onAdd?: (variable: { key: string; value: string; isSecret: boolean }) => void
  onUpdate?: (index: number, variable: { key: string; value: string; isSecret: boolean }) => void
  onDelete?: (index: number) => void
  onImport?: (vars: { key: string; value: string; isSecret: boolean }[]) => void
  onSave?: (variables: EnvVariable[]) => void
  onExport?: (env: string) => void
}

const defaultVariables: EnvVariable[] = [
  {
    id: '1',
    key: 'DATABASE_URL',
    value: 'postgresql://user:password@localhost:5432/db',
    isSecret: true,
    environment: 'all',
    description: 'Database connection string',
    lastModified: new Date()
  },
  {
    id: '2',
    key: 'NEXT_PUBLIC_API_URL',
    value: 'https://api.example.com',
    isSecret: false,
    environment: 'production',
    description: 'Public API endpoint',
    lastModified: new Date()
  },
  {
    id: '3',
    key: 'JWT_SECRET',
    value: 'super-secret-jwt-key-here',
    isSecret: true,
    environment: 'all',
    description: 'JWT signing secret',
    lastModified: new Date()
  },
  {
    id: '4',
    key: 'NEXT_PUBLIC_APP_NAME',
    value: 'Pointer IDE',
    isSecret: false,
    environment: 'all',
    description: 'Application name',
    lastModified: new Date()
  }
]

export function EnvManager({
  isOpen,
  onClose,
  onSave,
  onExport,
  onImport
}: EnvManagerProps) {
  const [variables, setVariables] = useState<EnvVariable[]>(defaultVariables)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterEnv, setFilterEnv] = useState<string>('all')
  const [hasChanges, setHasChanges] = useState(false)

  const addVariable = () => {
    const newVar: EnvVariable = {
      id: Date.now().toString(),
      key: '',
      value: '',
      isSecret: false,
      environment: 'all',
      lastModified: new Date()
    }
    setVariables([...variables, newVar])
    setEditingId(newVar.id)
    setHasChanges(true)
  }

  const updateVariable = (id: string, updates: Partial<EnvVariable>) => {
    setVariables(vars => vars.map(v => 
      v.id === id ? { ...v, ...updates, lastModified: new Date() } : v
    ))
    setHasChanges(true)
  }

  const deleteVariable = (id: string) => {
    setVariables(vars => vars.filter(v => v.id !== id))
    setHasChanges(true)
  }

  const toggleSecret = (id: string) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const copyValue = (value: string) => {
    navigator.clipboard.writeText(value)
  }

  const handleSave = () => {
    onSave?.(variables)
    setHasChanges(false)
  }

  const handleExport = (format: 'env' | 'json') => {
    let content = ''
    if (format === 'env') {
      content = variables
        .filter(v => filterEnv === 'all' || v.environment === filterEnv || v.environment === 'all')
        .map(v => `${v.key}=${v.value}`)
        .join('\n')
    } else {
      content = JSON.stringify(
        variables.reduce((acc, v) => ({ ...acc, [v.key]: v.value }), {}),
        null,
        2
      )
    }
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = format === 'env' ? '.env' : 'env.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const lines = content.split('\n')
      const newVars: EnvVariable[] = []

      lines.forEach(line => {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=')
          const value = valueParts.join('=')
          if (key && value !== undefined) {
            newVars.push({
              id: Date.now().toString() + Math.random(),
              key: key.trim(),
              value: value.trim().replace(/^["']|["']$/g, ''),
              isSecret: key.includes('SECRET') || key.includes('PASSWORD') || key.includes('KEY'),
              environment: 'all',
              lastModified: new Date()
            })
          }
        }
      })

      setVariables([...variables, ...newVars])
      setHasChanges(true)
    }
    reader.readAsText(file)
  }

  const filteredVariables = variables.filter(v => {
    const matchesSearch = v.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.value.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesEnv = filterEnv === 'all' || v.environment === filterEnv || v.environment === 'all'
    return matchesSearch && matchesEnv
  })

  const getEnvBadgeColor = (env: string) => {
    switch (env) {
      case 'development': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'staging': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'production': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] bg-[#1e1e1e] border-[#3c3c3c] text-[#cccccc] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-400" />
              <span>Environment Variables</span>
              {hasChanges && (
                <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">Unsaved</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-[#cccccc] hover:bg-[#3c3c3c]">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#252526] border-[#3c3c3c]">
                  <DropdownMenuItem onClick={() => handleExport('env')} className="text-[#cccccc] hover:bg-[#3c3c3c]">
                    Export as .env
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('json')} className="text-[#cccccc] hover:bg-[#3c3c3c]">
                    Export as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <label>
                <Button variant="ghost" size="sm" className="h-8 text-[#cccccc] hover:bg-[#3c3c3c]" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-1" />
                    Import
                  </span>
                </Button>
                <input type="file" accept=".env,.txt" onChange={handleImport} className="hidden" />
              </label>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-2 py-2 border-b border-[#3c3c3c]">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#808080]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search variables..."
              className="pl-8 h-8 bg-[#3c3c3c] border-[#4c4c4c] text-[#cccccc] placeholder:text-[#808080]"
            />
          </div>
          <select
            value={filterEnv}
            onChange={(e) => setFilterEnv(e.target.value)}
            className="h-8 px-2 bg-[#3c3c3c] border border-[#4c4c4c] rounded text-[#cccccc] text-sm"
          >
            <option value="all">All Environments</option>
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
          <Button onClick={addVariable} size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-1" />
            Add Variable
          </Button>
        </div>

        {/* Variables List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-2 py-2">
            {filteredVariables.length === 0 ? (
              <div className="text-center py-12 text-[#808080]">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No environment variables found</p>
                <Button onClick={addVariable} variant="ghost" className="mt-2 text-blue-400">
                  Add your first variable
                </Button>
              </div>
            ) : (
              filteredVariables.map((variable) => (
                <div
                  key={variable.id}
                  className="flex items-center gap-2 p-3 bg-[#252526] rounded-lg border border-[#3c3c3c] hover:border-[#4c4c4c] transition-colors"
                >
                  {/* Key */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {variable.isSecret ? (
                        <Lock className="h-3 w-3 text-yellow-400" />
                      ) : (
                        <Unlock className="h-3 w-3 text-[#808080]" />
                      )}
                      {editingId === variable.id ? (
                        <Input
                          value={variable.key}
                          onChange={(e) => updateVariable(variable.id, { key: e.target.value })}
                          onBlur={() => setEditingId(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                          placeholder="KEY_NAME"
                          className="h-6 bg-[#3c3c3c] border-[#4c4c4c] text-[#cccccc] font-mono text-sm"
                          autoFocus
                        />
                      ) : (
                        <span
                          className="font-mono text-sm text-[#9cdcfe] cursor-pointer hover:underline"
                          onClick={() => setEditingId(variable.id)}
                        >
                          {variable.key || 'NEW_VARIABLE'}
                        </span>
                      )}
                      <Badge className={`text-[10px] ${getEnvBadgeColor(variable.environment)}`}>
                        {variable.environment}
                      </Badge>
                    </div>
                    {/* Value */}
                    <div className="flex items-center gap-2">
                      <Input
                        type={variable.isSecret && !showSecrets[variable.id] ? 'password' : 'text'}
                        value={variable.value}
                        onChange={(e) => updateVariable(variable.id, { value: e.target.value })}
                        placeholder="value"
                        className="h-7 bg-[#1e1e1e] border-[#3c3c3c] text-[#cccccc] font-mono text-xs flex-1"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSecret(variable.id)}
                      className="h-7 w-7 p-0 text-[#808080] hover:text-[#cccccc] hover:bg-[#3c3c3c]"
                    >
                      {showSecrets[variable.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyValue(variable.value)}
                      className="h-7 w-7 p-0 text-[#808080] hover:text-[#cccccc] hover:bg-[#3c3c3c]"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateVariable(variable.id, { isSecret: !variable.isSecret })}
                      className={`h-7 w-7 p-0 hover:bg-[#3c3c3c] ${variable.isSecret ? 'text-yellow-400' : 'text-[#808080]'}`}
                    >
                      {variable.isSecret ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#808080] hover:text-[#cccccc] hover:bg-[#3c3c3c]">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#252526] border-[#3c3c3c]">
                        <DropdownMenuItem
                          onClick={() => updateVariable(variable.id, { environment: 'development' })}
                          className="text-[#cccccc] hover:bg-[#3c3c3c]"
                        >
                          Set to Development
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateVariable(variable.id, { environment: 'staging' })}
                          className="text-[#cccccc] hover:bg-[#3c3c3c]"
                        >
                          Set to Staging
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateVariable(variable.id, { environment: 'production' })}
                          className="text-[#cccccc] hover:bg-[#3c3c3c]"
                        >
                          Set to Production
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateVariable(variable.id, { environment: 'all' })}
                          className="text-[#cccccc] hover:bg-[#3c3c3c]"
                        >
                          Set to All
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteVariable(variable.id)}
                          className="text-red-400 hover:bg-[#3c3c3c]"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[#3c3c3c]">
          <div className="flex items-center gap-2 text-xs text-[#808080]">
            <span>{variables.length} variables</span>
            <span>|</span>
            <span>{variables.filter(v => v.isSecret).length} secrets</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} className="text-[#cccccc] hover:bg-[#3c3c3c]">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
