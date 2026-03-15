"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Package, 
  ArrowUp, 
  AlertTriangle, 
  Check, 
  Trash2,
  Plus,
  RefreshCw,
  ExternalLink,
  Search,
  Shield,
  Clock,
  Download
} from 'lucide-react'

interface Dependency {
  name: string
  currentVersion: string
  latestVersion?: string
  type: 'dependency' | 'devDependency' | 'peerDependency'
  hasUpdate?: boolean
  isVulnerable?: boolean
  vulnerabilityCount?: number
  lastUpdated?: string
  downloads?: number
  license?: string
  description?: string
}

interface DependencyViewerProps {
  isOpen: boolean
  onClose: () => void
  packageJson: {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
  }
  onUpdateDependency: (name: string, version: string) => void
  onRemoveDependency: (name: string, type: string) => void
  onAddDependency: (name: string, version: string, type: string) => void
}

// Mock function to simulate fetching package info
const fetchPackageInfo = (name: string, currentVersion: string): Promise<Partial<Dependency>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockVersions: Record<string, string> = {
        'react': '18.3.0',
        'next': '15.0.0',
        'typescript': '5.4.0',
        'tailwindcss': '3.5.0',
        '@types/react': '18.3.0',
        'eslint': '9.0.0',
        'prettier': '3.2.0'
      }
      
      const latestVersion = mockVersions[name] || currentVersion.replace('^', '')
      const currentClean = currentVersion.replace('^', '').replace('~', '')
      const hasUpdate = latestVersion !== currentClean && Math.random() > 0.5
      
      resolve({
        latestVersion,
        hasUpdate,
        isVulnerable: Math.random() > 0.9,
        vulnerabilityCount: Math.random() > 0.9 ? Math.floor(Math.random() * 3) + 1 : 0,
        lastUpdated: `${Math.floor(Math.random() * 30) + 1} days ago`,
        downloads: Math.floor(Math.random() * 1000000) + 10000,
        license: ['MIT', 'Apache-2.0', 'ISC', 'BSD-3-Clause'][Math.floor(Math.random() * 4)],
        description: `A popular ${name} package for JavaScript/TypeScript projects.`
      })
    }, Math.random() * 500 + 200)
  })
}

export function DependencyViewer({
  isOpen,
  onClose,
  packageJson,
  onUpdateDependency,
  onRemoveDependency,
  onAddDependency
}: DependencyViewerProps) {
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'updates' | 'vulnerable'>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newPackage, setNewPackage] = useState({ name: '', version: '', type: 'dependency' })
  const [selectedDep, setSelectedDep] = useState<Dependency | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadDependencies()
    }
  }, [isOpen, packageJson])

  const loadDependencies = async () => {
    setIsLoading(true)
    const deps: Dependency[] = []
    
    // Parse dependencies
    if (packageJson.dependencies) {
      for (const [name, version] of Object.entries(packageJson.dependencies)) {
        deps.push({ name, currentVersion: version, type: 'dependency' })
      }
    }
    
    if (packageJson.devDependencies) {
      for (const [name, version] of Object.entries(packageJson.devDependencies)) {
        deps.push({ name, currentVersion: version, type: 'devDependency' })
      }
    }
    
    if (packageJson.peerDependencies) {
      for (const [name, version] of Object.entries(packageJson.peerDependencies)) {
        deps.push({ name, currentVersion: version, type: 'peerDependency' })
      }
    }

    // Fetch additional info for each dependency
    const enrichedDeps = await Promise.all(
      deps.map(async (dep) => {
        const info = await fetchPackageInfo(dep.name, dep.currentVersion)
        return { ...dep, ...info }
      })
    )

    setDependencies(enrichedDeps)
    setIsLoading(false)
  }

  const filteredDeps = dependencies.filter(dep => {
    const matchesSearch = dep.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'updates' ? dep.hasUpdate :
      filter === 'vulnerable' ? dep.isVulnerable : true
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: dependencies.length,
    withUpdates: dependencies.filter(d => d.hasUpdate).length,
    vulnerable: dependencies.filter(d => d.isVulnerable).length
  }

  const handleUpdateAll = () => {
    dependencies.filter(d => d.hasUpdate).forEach(dep => {
      if (dep.latestVersion) {
        onUpdateDependency(dep.name, `^${dep.latestVersion}`)
      }
    })
    loadDependencies()
  }

  const handleAddPackage = () => {
    if (newPackage.name && newPackage.version) {
      onAddDependency(newPackage.name, newPackage.version, newPackage.type)
      setNewPackage({ name: '', version: '', type: 'dependency' })
      setShowAddDialog(false)
      loadDependencies()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg w-[900px] max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#3c3c3c]">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Dependency Manager</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={loadDependencies}
              size="sm"
              variant="ghost"
              className="text-[#cccccc] hover:bg-[#3c3c3c]"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setShowAddDialog(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Package
            </Button>
            <Button
              onClick={onClose}
              size="sm"
              variant="ghost"
              className="text-[#cccccc] hover:bg-[#3c3c3c]"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-[#3c3c3c] bg-[#252526]">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-[#858585]" />
            <span className="text-sm text-[#cccccc]">{stats.total} packages</span>
          </div>
          {stats.withUpdates > 0 && (
            <div className="flex items-center gap-2">
              <ArrowUp className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-blue-400">{stats.withUpdates} updates available</span>
            </div>
          )}
          {stats.vulnerable > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-sm text-red-400">{stats.vulnerable} vulnerabilities</span>
            </div>
          )}
          <div className="flex-1" />
          {stats.withUpdates > 0 && (
            <Button
              onClick={handleUpdateAll}
              size="sm"
              variant="ghost"
              className="text-blue-400 hover:bg-blue-500/10"
            >
              Update All
            </Button>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#3c3c3c]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#858585]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search packages..."
              className="pl-10 bg-[#3c3c3c] border-[#3c3c3c] text-white"
            />
          </div>
          <div className="flex gap-1">
            {(['all', 'updates', 'vulnerable'] as const).map((f) => (
              <Button
                key={f}
                onClick={() => setFilter(f)}
                size="sm"
                variant="ghost"
                className={`capitalize ${
                  filter === f
                    ? 'bg-[#3c3c3c] text-white'
                    : 'text-[#858585] hover:bg-[#3c3c3c]'
                }`}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        {/* Dependencies List */}
        <div className="flex flex-1 min-h-0">
          <ScrollArea className="flex-1 p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 text-blue-400 animate-spin" />
                <span className="ml-2 text-[#858585]">Loading dependencies...</span>
              </div>
            ) : filteredDeps.length === 0 ? (
              <div className="text-center py-12 text-[#858585]">
                No packages found
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDeps.map((dep) => (
                  <div
                    key={`${dep.type}-${dep.name}`}
                    onClick={() => setSelectedDep(dep)}
                    className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                      selectedDep?.name === dep.name
                        ? 'bg-[#37373d] border-blue-500/50'
                        : 'bg-[#2d2d2d] border-[#3c3c3c] hover:border-[#4c4c4c]'
                    }`}
                  >
                    <Package className="h-4 w-4 text-[#858585] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white truncate">{dep.name}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] ${
                            dep.type === 'devDependency' 
                              ? 'border-yellow-500/50 text-yellow-400'
                              : dep.type === 'peerDependency'
                              ? 'border-purple-500/50 text-purple-400'
                              : 'border-blue-500/50 text-blue-400'
                          }`}
                        >
                          {dep.type === 'devDependency' ? 'dev' : dep.type === 'peerDependency' ? 'peer' : 'prod'}
                        </Badge>
                        {dep.isVulnerable && (
                          <Badge variant="destructive" className="text-[10px]">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {dep.vulnerabilityCount} vuln
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-[#858585]">{dep.currentVersion}</span>
                        {dep.hasUpdate && dep.latestVersion && (
                          <>
                            <ArrowUp className="h-3 w-3 text-blue-400" />
                            <span className="text-xs text-blue-400">{dep.latestVersion}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {dep.hasUpdate && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (dep.latestVersion) {
                              onUpdateDependency(dep.name, `^${dep.latestVersion}`)
                              loadDependencies()
                            }
                          }}
                          size="sm"
                          variant="ghost"
                          className="h-7 text-blue-400 hover:bg-blue-500/10"
                        >
                          <ArrowUp className="h-3 w-3 mr-1" />
                          Update
                        </Button>
                      )}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveDependency(dep.name, dep.type)
                          loadDependencies()
                        }}
                        size="sm"
                        variant="ghost"
                        className="h-7 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Detail Panel */}
          {selectedDep && (
            <div className="w-72 border-l border-[#3c3c3c] p-4 bg-[#252526]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-white truncate">{selectedDep.name}</h3>
                <a
                  href={`https://www.npmjs.com/package/${selectedDep.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#858585] hover:text-white"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              
              <p className="text-sm text-[#858585] mb-4">{selectedDep.description}</p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-[#858585]" />
                  <span className="text-[#858585]">Version:</span>
                  <span className="text-white">{selectedDep.currentVersion}</span>
                </div>
                
                {selectedDep.latestVersion && (
                  <div className="flex items-center gap-2 text-sm">
                    <ArrowUp className="h-4 w-4 text-blue-400" />
                    <span className="text-[#858585]">Latest:</span>
                    <span className="text-blue-400">{selectedDep.latestVersion}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-[#858585]" />
                  <span className="text-[#858585]">License:</span>
                  <span className="text-white">{selectedDep.license}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-[#858585]" />
                  <span className="text-[#858585]">Updated:</span>
                  <span className="text-white">{selectedDep.lastUpdated}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Download className="h-4 w-4 text-[#858585]" />
                  <span className="text-[#858585]">Downloads:</span>
                  <span className="text-white">{selectedDep.downloads?.toLocaleString()}/week</span>
                </div>
              </div>

              {selectedDep.isVulnerable && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md">
                  <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-1">
                    <AlertTriangle className="h-4 w-4" />
                    Security Alert
                  </div>
                  <p className="text-xs text-red-300">
                    {selectedDep.vulnerabilityCount} known vulnerabilities found. 
                    Update to the latest version to fix.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add Package Dialog */}
        {showAddDialog && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="bg-[#2d2d2d] border border-[#3c3c3c] rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold text-white mb-4">Add Package</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-[#858585] mb-1 block">Package Name</label>
                  <Input
                    value={newPackage.name}
                    onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                    placeholder="e.g., lodash"
                    className="bg-[#3c3c3c] border-[#3c3c3c] text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#858585] mb-1 block">Version</label>
                  <Input
                    value={newPackage.version}
                    onChange={(e) => setNewPackage({ ...newPackage, version: e.target.value })}
                    placeholder="e.g., ^4.17.21"
                    className="bg-[#3c3c3c] border-[#3c3c3c] text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#858585] mb-1 block">Type</label>
                  <select
                    value={newPackage.type}
                    onChange={(e) => setNewPackage({ ...newPackage, type: e.target.value })}
                    className="w-full p-2 bg-[#3c3c3c] border border-[#3c3c3c] rounded text-white"
                  >
                    <option value="dependency">Dependency</option>
                    <option value="devDependency">Dev Dependency</option>
                    <option value="peerDependency">Peer Dependency</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  onClick={() => setShowAddDialog(false)}
                  variant="ghost"
                  className="text-[#cccccc]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddPackage}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Add Package
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
