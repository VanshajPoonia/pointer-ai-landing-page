"use client"

import { useState, useCallback, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  Layout, 
  Save, 
  Trash2, 
  Check, 
  Plus,
  LayoutGrid,
  Columns,
  PanelLeft,
  PanelRight,
  PanelTop,
  PanelBottom,
  Star,
  StarOff
} from 'lucide-react'

export interface PanelConfig {
  sidebar: boolean
  sidebarWidth: number
  terminal: boolean
  terminalHeight: number
  preview: boolean
  previewWidth: number
  aiPanel: boolean
  aiPanelWidth: number
  outputPanel: boolean
  debugPanel: boolean
}

export interface SavedLayout {
  id: string
  name: string
  config: PanelConfig
  isDefault?: boolean
  isFavorite?: boolean
  createdAt: Date
}

const PRESET_LAYOUTS: Omit<SavedLayout, 'id' | 'createdAt'>[] = [
  {
    name: 'Default',
    isDefault: true,
    config: {
      sidebar: true,
      sidebarWidth: 250,
      terminal: true,
      terminalHeight: 200,
      preview: true,
      previewWidth: 400,
      aiPanel: false,
      aiPanelWidth: 350,
      outputPanel: true,
      debugPanel: false
    }
  },
  {
    name: 'Focus Mode',
    config: {
      sidebar: false,
      sidebarWidth: 250,
      terminal: false,
      terminalHeight: 200,
      preview: false,
      previewWidth: 400,
      aiPanel: false,
      aiPanelWidth: 350,
      outputPanel: false,
      debugPanel: false
    }
  },
  {
    name: 'Full Preview',
    config: {
      sidebar: true,
      sidebarWidth: 200,
      terminal: false,
      terminalHeight: 200,
      preview: true,
      previewWidth: 600,
      aiPanel: false,
      aiPanelWidth: 350,
      outputPanel: false,
      debugPanel: false
    }
  },
  {
    name: 'AI Coding',
    config: {
      sidebar: true,
      sidebarWidth: 200,
      terminal: true,
      terminalHeight: 150,
      preview: false,
      previewWidth: 400,
      aiPanel: true,
      aiPanelWidth: 400,
      outputPanel: true,
      debugPanel: false
    }
  },
  {
    name: 'Debug Mode',
    config: {
      sidebar: true,
      sidebarWidth: 250,
      terminal: true,
      terminalHeight: 200,
      preview: false,
      previewWidth: 400,
      aiPanel: false,
      aiPanelWidth: 350,
      outputPanel: true,
      debugPanel: true
    }
  }
]

interface CustomLayoutsProps {
  isOpen: boolean
  onClose: () => void
  currentConfig: PanelConfig
  onApplyLayout: (config: PanelConfig) => void
  onSaveLayout: (name: string, config: PanelConfig) => void
}

export function CustomLayouts({
  isOpen,
  onClose,
  currentConfig,
  onApplyLayout,
  onSaveLayout
}: CustomLayoutsProps) {
  const [layouts, setLayouts] = useState<SavedLayout[]>([])
  const [newLayoutName, setNewLayoutName] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)

  useEffect(() => {
    // Load saved layouts from localStorage
    const saved = localStorage.getItem('ide-layouts')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setLayouts(parsed.map((l: any) => ({
          ...l,
          createdAt: new Date(l.createdAt)
        })))
      } catch (e) {
        setLayouts([])
      }
    }
  }, [])

  const saveLayouts = (newLayouts: SavedLayout[]) => {
    setLayouts(newLayouts)
    localStorage.setItem('ide-layouts', JSON.stringify(newLayouts))
  }

  const handleSaveLayout = () => {
    if (!newLayoutName.trim()) return

    const newLayout: SavedLayout = {
      id: Date.now().toString(),
      name: newLayoutName.trim(),
      config: currentConfig,
      createdAt: new Date()
    }

    saveLayouts([...layouts, newLayout])
    setNewLayoutName('')
    setShowSaveInput(false)
    onSaveLayout(newLayoutName, currentConfig)
  }

  const handleDeleteLayout = (id: string) => {
    saveLayouts(layouts.filter(l => l.id !== id))
  }

  const handleToggleFavorite = (id: string) => {
    saveLayouts(layouts.map(l =>
      l.id === id ? { ...l, isFavorite: !l.isFavorite } : l
    ))
  }

  const getLayoutIcon = (config: PanelConfig) => {
    if (!config.sidebar && !config.terminal && !config.preview) {
      return <Layout className="h-8 w-8" />
    }
    if (config.preview && config.previewWidth > 500) {
      return <Columns className="h-8 w-8" />
    }
    if (config.debugPanel) {
      return <PanelRight className="h-8 w-8" />
    }
    return <LayoutGrid className="h-8 w-8" />
  }

  const allLayouts = [
    ...PRESET_LAYOUTS.map((l, i) => ({
      ...l,
      id: `preset-${i}`,
      createdAt: new Date(0)
    })),
    ...layouts.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1
      if (!a.isFavorite && b.isFavorite) return 1
      return b.createdAt.getTime() - a.createdAt.getTime()
    })
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#1e1e1e] border-[#3c3c3c] p-0">
        <DialogHeader className="p-4 border-b border-[#3c3c3c]">
          <DialogTitle className="flex items-center gap-2 text-[#cccccc]">
            <Layout className="h-5 w-5 text-blue-400" />
            Workspace Layouts
          </DialogTitle>
        </DialogHeader>

        <div className="p-4">
          {/* Save Current Layout */}
          <div className="mb-4">
            {showSaveInput ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newLayoutName}
                  onChange={(e) => setNewLayoutName(e.target.value)}
                  placeholder="Layout name..."
                  className="flex-1 h-9 bg-[#2d2d2d] border-[#3c3c3c] text-[#cccccc]"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveLayout()}
                />
                <Button
                  size="sm"
                  onClick={handleSaveLayout}
                  disabled={!newLayoutName.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowSaveInput(false)
                    setNewLayoutName('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShowSaveInput(true)}
                variant="outline"
                className="w-full border-dashed border-[#3c3c3c] text-[#888888] hover:text-[#cccccc] hover:border-blue-500/50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Save Current Layout
              </Button>
            )}
          </div>

          {/* Layout Grid */}
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-2 gap-3">
              {allLayouts.map((layout) => (
                <div
                  key={layout.id}
                  className="relative group p-4 bg-[#2d2d2d] hover:bg-[#3c3c3c] rounded-lg border border-[#3c3c3c] hover:border-blue-500/50 cursor-pointer transition-all"
                  onClick={() => {
                    onApplyLayout(layout.config)
                    onClose()
                  }}
                >
                  {/* Layout Preview */}
                  <div className="flex items-center justify-center h-20 mb-3 bg-[#1e1e1e] rounded border border-[#3c3c3c]">
                    <div className="flex items-center gap-1 text-[#888888]">
                      {getLayoutIcon(layout.config)}
                    </div>
                  </div>

                  {/* Layout Info */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-[#cccccc]">
                        {layout.name}
                      </h4>
                      <div className="flex items-center gap-1 mt-1">
                        {layout.isDefault && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1">
                            Preset
                          </Badge>
                        )}
                        {layout.config.sidebar && (
                          <PanelLeft className="h-3 w-3 text-[#666666]" />
                        )}
                        {layout.config.preview && (
                          <PanelRight className="h-3 w-3 text-[#666666]" />
                        )}
                        {layout.config.terminal && (
                          <PanelBottom className="h-3 w-3 text-[#666666]" />
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {!layout.isDefault && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleFavorite(layout.id)
                          }}
                        >
                          {layout.isFavorite ? (
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                          ) : (
                            <StarOff className="h-3 w-3 text-[#888888]" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-400 hover:bg-red-500/10"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteLayout(layout.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook for managing layout state
export function useCustomLayouts(defaultConfig: PanelConfig) {
  const [config, setConfig] = useState<PanelConfig>(defaultConfig)

  const updateConfig = useCallback((updates: Partial<PanelConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }, [])

  const applyLayout = useCallback((newConfig: PanelConfig) => {
    setConfig(newConfig)
  }, [])

  return {
    config,
    updateConfig,
    applyLayout
  }
}

export default CustomLayouts
