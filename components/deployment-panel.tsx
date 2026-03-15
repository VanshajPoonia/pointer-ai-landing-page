'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { 
  X, 
  Rocket, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Clock,
  Globe,
  FileCode,
  RefreshCw,
} from 'lucide-react'

interface Deployment {
  id: string
  project_id: string
  provider: 'vercel' | 'netlify'
  status: 'pending' | 'building' | 'ready' | 'error' | 'canceled'
  url: string | null
  preview_url: string | null
  commit_message: string | null
  build_logs: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

interface DeploymentPanelProps {
  projectId: string
  projectName: string
  isOpen: boolean
  onClose: () => void
}

export function DeploymentPanel({ projectId, projectName, isOpen, onClose }: DeploymentPanelProps) {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [isDeploying, setIsDeploying] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<'vercel' | 'netlify'>('vercel')
  const [showLogs, setShowLogs] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && projectId) {
      fetchDeployments()
      // Poll for updates
      const interval = setInterval(fetchDeployments, 5000)
      return () => clearInterval(interval)
    }
  }, [isOpen, projectId])

  const fetchDeployments = async () => {
    try {
      const response = await fetch(`/api/deploy?projectId=${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setDeployments(data.deployments || [])
      }
    } catch (error) {
      console.error('Failed to fetch deployments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeploy = async () => {
    setIsDeploying(true)
    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          provider: selectedProvider,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Add to top of list
        setDeployments(prev => [{
          id: data.deployment.id,
          project_id: projectId,
          provider: selectedProvider,
          status: 'building',
          url: null,
          preview_url: data.deployment.previewUrl,
          commit_message: `Deploy ${projectName}`,
          build_logs: null,
          error_message: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, ...prev])
      }
    } catch (error) {
      console.error('Deploy failed:', error)
    } finally {
      setIsDeploying(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'building':
      case 'pending':
        return <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready':
        return 'Ready'
      case 'building':
        return 'Building...'
      case 'pending':
        return 'Queued'
      case 'error':
        return 'Failed'
      case 'canceled':
        return 'Canceled'
      default:
        return status
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  if (!isOpen) return null

  return (
    <div className="absolute right-0 top-0 h-full w-[400px] bg-[#252526] border-l border-[#3c3c3c] flex flex-col z-50 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#3c3c3c]">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-amber-500" />
          <h2 className="text-sm font-medium text-white">Deploy</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 text-[#808080] hover:text-white hover:bg-[#3c3c3c]"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Deploy Form */}
      <div className="p-4 border-b border-[#3c3c3c]">
        <div className="mb-3">
          <label className="text-xs text-[#808080] mb-2 block">Deploy to</label>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedProvider('vercel')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border transition-all ${
                selectedProvider === 'vercel'
                  ? 'border-amber-500 bg-amber-500/10 text-white'
                  : 'border-[#3c3c3c] text-[#808080] hover:border-[#505050]'
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 116 100" fill="currentColor">
                <path d="M57.5 0L115 100H0L57.5 0z" />
              </svg>
              <span className="text-sm">Vercel</span>
            </button>
            <button
              onClick={() => setSelectedProvider('netlify')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border transition-all ${
                selectedProvider === 'netlify'
                  ? 'border-teal-500 bg-teal-500/10 text-white'
                  : 'border-[#3c3c3c] text-[#808080] hover:border-[#505050]'
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 256 256" fill="currentColor">
                <path d="M133.418 143.479l35.747-35.741-69.49.008 33.743 35.733z" />
              </svg>
              <span className="text-sm">Netlify</span>
            </button>
          </div>
        </div>

        <Button
          onClick={handleDeploy}
          disabled={isDeploying}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
        >
          {isDeploying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <Rocket className="mr-2 h-4 w-4" />
              Deploy to {selectedProvider === 'vercel' ? 'Vercel' : 'Netlify'}
            </>
          )}
        </Button>
      </div>

      {/* Deployments List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-[#808080] uppercase tracking-wide">
              Recent Deployments
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchDeployments}
              className="h-6 w-6 p-0 text-[#808080] hover:text-white"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 text-[#808080] animate-spin" />
            </div>
          ) : deployments.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-8 w-8 text-[#505050] mx-auto mb-2" />
              <p className="text-sm text-[#808080]">No deployments yet</p>
              <p className="text-xs text-[#606060]">Deploy your project to see it here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {deployments.map((deployment) => (
                <div
                  key={deployment.id}
                  className="bg-[#1e1e1e] rounded-lg p-3 border border-[#3c3c3c] hover:border-[#505050] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(deployment.status)}
                      <span className="text-sm text-white">
                        {getStatusText(deployment.status)}
                      </span>
                    </div>
                    <span className="text-xs text-[#606060]">
                      {formatTime(deployment.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#808080] mb-2">
                    <span className={`px-1.5 py-0.5 rounded ${
                      deployment.provider === 'vercel' 
                        ? 'bg-white/10 text-white' 
                        : 'bg-teal-500/10 text-teal-400'
                    }`}>
                      {deployment.provider}
                    </span>
                    {deployment.commit_message && (
                      <span className="truncate">{deployment.commit_message}</span>
                    )}
                  </div>

                  {deployment.status === 'ready' && deployment.preview_url && (
                    <div className="flex items-center gap-2 mt-2">
                      <a
                        href={deployment.preview_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-amber-500 hover:text-amber-400 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Visit Site
                      </a>
                      <button
                        onClick={() => setShowLogs(showLogs === deployment.id ? null : deployment.id)}
                        className="flex items-center gap-1.5 text-xs text-[#808080] hover:text-white transition-colors"
                      >
                        <FileCode className="h-3 w-3" />
                        {showLogs === deployment.id ? 'Hide Logs' : 'View Logs'}
                      </button>
                    </div>
                  )}

                  {deployment.status === 'error' && deployment.error_message && (
                    <div className="mt-2 p-2 bg-red-500/10 rounded text-xs text-red-400">
                      {deployment.error_message}
                    </div>
                  )}

                  {showLogs === deployment.id && deployment.build_logs && (
                    <div className="mt-2 p-2 bg-[#0d0d0d] rounded font-mono text-xs text-[#808080] whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {deployment.build_logs}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
