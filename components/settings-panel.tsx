'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { 
  X, 
  Sun, 
  Moon, 
  Monitor, 
  Palette,
  Type,
  Settings2,
  RotateCcw
} from 'lucide-react'

interface EditorSettings {
  theme: 'dark' | 'light' | 'system' | 'monokai' | 'dracula' | 'github-dark' | 'solarized-dark'
  fontSize: number
  fontFamily: string
  tabSize: number
  lineNumbers: boolean
  minimap: boolean
  wordWrap: boolean
  bracketPairColorization: boolean
  autoSave: boolean
  autoSaveDelay: number
}

const defaultSettings: EditorSettings = {
  theme: 'dark',
  fontSize: 14,
  fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
  tabSize: 2,
  lineNumbers: true,
  minimap: true,
  wordWrap: false,
  bracketPairColorization: true,
  autoSave: false,
  autoSaveDelay: 1000
}

const themes = [
  { id: 'dark', name: 'Dark (Default)', icon: Moon },
  { id: 'light', name: 'Light', icon: Sun },
  { id: 'system', name: 'System', icon: Monitor },
  { id: 'monokai', name: 'Monokai', icon: Palette },
  { id: 'dracula', name: 'Dracula', icon: Palette },
  { id: 'github-dark', name: 'GitHub Dark', icon: Palette },
  { id: 'solarized-dark', name: 'Solarized Dark', icon: Palette },
]

const fontFamilies = [
  { id: 'jetbrains', name: 'JetBrains Mono', value: 'JetBrains Mono, Menlo, Monaco, monospace' },
  { id: 'firacode', name: 'Fira Code', value: 'Fira Code, Menlo, Monaco, monospace' },
  { id: 'monaco', name: 'Monaco', value: 'Monaco, Menlo, monospace' },
  { id: 'consolas', name: 'Consolas', value: 'Consolas, Monaco, monospace' },
  { id: 'sourcecodepro', name: 'Source Code Pro', value: 'Source Code Pro, Menlo, Monaco, monospace' },
]

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  settings: EditorSettings
  onSettingsChange: (settings: EditorSettings) => void
}

export function SettingsPanel({ isOpen, onClose, settings, onSettingsChange }: SettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState<EditorSettings>(settings)
  const [activeTab, setActiveTab] = useState<'appearance' | 'editor' | 'keybindings'>('appearance')

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const updateSetting = <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
    const newSettings = { ...localSettings, [key]: value }
    setLocalSettings(newSettings)
    onSettingsChange(newSettings)
  }

  const resetToDefaults = () => {
    setLocalSettings(defaultSettings)
    onSettingsChange(defaultSettings)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div 
        className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#3c3c3c]">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-[#cccccc]" />
            <h2 className="text-lg font-semibold text-[#cccccc]">Settings</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-[#808080] hover:text-[#cccccc] transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex h-[calc(85vh-80px)]">
          {/* Sidebar */}
          <div className="w-48 border-r border-[#3c3c3c] p-2">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('appearance')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                  activeTab === 'appearance' 
                    ? 'bg-[#094771] text-white' 
                    : 'text-[#cccccc] hover:bg-[#2a2d2e]'
                }`}
              >
                <Palette className="h-4 w-4" />
                Appearance
              </button>
              <button
                onClick={() => setActiveTab('editor')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                  activeTab === 'editor' 
                    ? 'bg-[#094771] text-white' 
                    : 'text-[#cccccc] hover:bg-[#2a2d2e]'
                }`}
              >
                <Type className="h-4 w-4" />
                Editor
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'appearance' && (
              <div className="space-y-8">
                {/* Theme Selection */}
                <div>
                  <h3 className="text-sm font-semibold text-[#cccccc] mb-4">Color Theme</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {themes.map(theme => {
                      const Icon = theme.icon
                      return (
                        <button
                          key={theme.id}
                          onClick={() => updateSetting('theme', theme.id as EditorSettings['theme'])}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            localSettings.theme === theme.id
                              ? 'border-[#0078d4] bg-[#0078d4]/10'
                              : 'border-[#3c3c3c] hover:border-[#505050] bg-[#252526]'
                          }`}
                        >
                          <Icon className={`h-5 w-5 ${
                            localSettings.theme === theme.id ? 'text-[#0078d4]' : 'text-[#808080]'
                          }`} />
                          <span className={`text-sm ${
                            localSettings.theme === theme.id ? 'text-[#cccccc]' : 'text-[#808080]'
                          }`}>
                            {theme.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Font Family */}
                <div>
                  <h3 className="text-sm font-semibold text-[#cccccc] mb-4">Font Family</h3>
                  <div className="space-y-2">
                    {fontFamilies.map(font => (
                      <button
                        key={font.id}
                        onClick={() => updateSetting('fontFamily', font.value)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                          localSettings.fontFamily === font.value
                            ? 'border-[#0078d4] bg-[#0078d4]/10'
                            : 'border-[#3c3c3c] hover:border-[#505050] bg-[#252526]'
                        }`}
                      >
                        <span 
                          className="text-sm text-[#cccccc]"
                          style={{ fontFamily: font.value }}
                        >
                          {font.name}
                        </span>
                        <span 
                          className="text-xs text-[#808080]"
                          style={{ fontFamily: font.value }}
                        >
                          {'const x = 123'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'editor' && (
              <div className="space-y-6">
                {/* Font Size */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-[#cccccc]">Font Size</Label>
                    <p className="text-xs text-[#808080] mt-1">Controls the editor font size in pixels</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateSetting('fontSize', Math.max(10, localSettings.fontSize - 1))}
                      className="h-8 w-8 p-0 bg-[#3c3c3c] border-[#505050] text-[#cccccc] hover:bg-[#505050]"
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      value={localSettings.fontSize}
                      onChange={e => updateSetting('fontSize', parseInt(e.target.value) || 14)}
                      className="w-16 h-8 text-center bg-[#3c3c3c] border-[#505050] text-[#cccccc]"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateSetting('fontSize', Math.min(32, localSettings.fontSize + 1))}
                      className="h-8 w-8 p-0 bg-[#3c3c3c] border-[#505050] text-[#cccccc] hover:bg-[#505050]"
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Tab Size */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-[#cccccc]">Tab Size</Label>
                    <p className="text-xs text-[#808080] mt-1">The number of spaces a tab is equal to</p>
                  </div>
                  <select
                    value={localSettings.tabSize}
                    onChange={e => updateSetting('tabSize', parseInt(e.target.value))}
                    className="h-8 px-3 rounded bg-[#3c3c3c] border border-[#505050] text-[#cccccc] text-sm"
                  >
                    <option value={2}>2 spaces</option>
                    <option value={4}>4 spaces</option>
                    <option value={8}>8 spaces</option>
                  </select>
                </div>

                {/* Toggle Options */}
                {[
                  { key: 'lineNumbers', label: 'Line Numbers', description: 'Show line numbers in the editor' },
                  { key: 'minimap', label: 'Minimap', description: 'Show code minimap on the right side' },
                  { key: 'wordWrap', label: 'Word Wrap', description: 'Wrap long lines to fit the viewport' },
                  { key: 'bracketPairColorization', label: 'Bracket Pair Colorization', description: 'Colorize matching brackets' },
                  { key: 'autoSave', label: 'Auto Save', description: 'Automatically save files after changes' },
                ].map(option => (
                  <div key={option.key} className="flex items-center justify-between">
                    <div>
                      <Label className="text-[#cccccc]">{option.label}</Label>
                      <p className="text-xs text-[#808080] mt-1">{option.description}</p>
                    </div>
                    <button
                      onClick={() => updateSetting(option.key as keyof EditorSettings, !localSettings[option.key as keyof EditorSettings])}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        localSettings[option.key as keyof EditorSettings] ? 'bg-[#0078d4]' : 'bg-[#3c3c3c]'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          localSettings[option.key as keyof EditorSettings] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}

                {/* Auto Save Delay (only show if auto save is enabled) */}
                {localSettings.autoSave && (
                  <div className="flex items-center justify-between pl-4 border-l-2 border-[#3c3c3c]">
                    <div>
                      <Label className="text-[#cccccc]">Auto Save Delay</Label>
                      <p className="text-xs text-[#808080] mt-1">Delay in milliseconds before auto saving</p>
                    </div>
                    <select
                      value={localSettings.autoSaveDelay}
                      onChange={e => updateSetting('autoSaveDelay', parseInt(e.target.value))}
                      className="h-8 px-3 rounded bg-[#3c3c3c] border border-[#505050] text-[#cccccc] text-sm"
                    >
                      <option value={500}>500ms</option>
                      <option value={1000}>1 second</option>
                      <option value={2000}>2 seconds</option>
                      <option value={5000}>5 seconds</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[#3c3c3c]">
          <Button
            variant="ghost"
            onClick={resetToDefaults}
            className="text-[#808080] hover:text-[#cccccc] hover:bg-[#3c3c3c]"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button
            onClick={onClose}
            className="bg-[#0078d4] hover:bg-[#006cbd] text-white"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}

export { defaultSettings }
export type { EditorSettings }
