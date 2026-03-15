'use client'

import { useState } from 'react'
import { 
  X, 
  Sparkles, 
  Code2, 
  GitBranch, 
  Terminal, 
  Zap, 
  Search, 
  Settings,
  Keyboard,
  FileCode,
  Bug,
  MessageSquare,
  Rocket,
  BookOpen,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

interface FeaturesHelpPanelProps {
  isOpen: boolean
  onClose: () => void
}

interface Feature {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  category: 'ai' | 'editor' | 'tools' | 'shortcuts'
  shortcut?: string[]
  tips?: string[]
}

const features: Feature[] = [
  // AI Features
  {
    id: 'ai-chat',
    title: 'Volt AI Assistant',
    description: 'Chat with AI that has full context of your entire project. Ask questions, generate code, fix bugs, and get explanations.',
    icon: <Sparkles className="h-5 w-5 text-amber-500" />,
    category: 'ai',
    tips: [
      'AI can see all files in your project',
      'Ask about how different files connect',
      'Request project-wide refactoring'
    ]
  },
  {
    id: 'copilot',
    title: 'AI Copilot',
    description: 'Intelligent code completion that suggests code as you type. Write a comment and get the implementation.',
    icon: <Zap className="h-5 w-5 text-cyan-500" />,
    category: 'ai',
    shortcut: ['Tab'],
    tips: [
      'Write a comment describing what you want',
      'Press Tab to accept suggestions',
      'Works with all programming languages'
    ]
  },
  {
    id: 'ai-tools',
    title: 'AI Tools',
    description: 'Explain code, generate documentation, fix bugs automatically, and generate unit tests.',
    icon: <Code2 className="h-5 w-5 text-indigo-500" />,
    category: 'ai',
    tips: [
      'Select code and use AI Tools menu',
      'Generate JSDoc comments automatically',
      'Create tests for your functions'
    ]
  },
  // Editor Features
  {
    id: 'multi-tab',
    title: 'Multi-Tab Editor',
    description: 'Open multiple files in tabs. Click the X to close tabs, or click tabs to switch between files.',
    icon: <FileCode className="h-5 w-5 text-blue-500" />,
    category: 'editor',
    tips: [
      'Middle-click to close tabs quickly',
      'Drag tabs to reorder them',
      'Right-click for more options'
    ]
  },
  {
    id: 'search',
    title: 'Quick Open & Search',
    description: 'Quickly find and open files. Search across your entire project.',
    icon: <Search className="h-5 w-5 text-green-500" />,
    category: 'editor',
    shortcut: ['Cmd/Ctrl', 'P'],
    tips: [
      'Type file name to filter',
      'Use Cmd+Shift+F for global search',
      'Search supports regex patterns'
    ]
  },
  {
    id: 'terminal',
    title: 'Integrated Terminal',
    description: 'Run commands directly in the IDE. Execute your code and see output.',
    icon: <Terminal className="h-5 w-5 text-green-400" />,
    category: 'editor',
    tips: [
      'Run Python, Node.js, and more',
      'Output appears in the terminal',
      'Clear terminal with clear command'
    ]
  },
  // Tools
  {
    id: 'git',
    title: 'Source Control',
    description: 'Git integration for version control. View changes, commit, and manage branches.',
    icon: <GitBranch className="h-5 w-5 text-orange-500" />,
    category: 'tools',
    tips: [
      'View file diffs before committing',
      'Stage individual files or all changes',
      'Create and switch branches'
    ]
  },
  {
    id: 'debugger',
    title: 'Debugger',
    description: 'Set breakpoints, step through code, and inspect variables.',
    icon: <Bug className="h-5 w-5 text-red-500" />,
    category: 'tools',
    tips: [
      'Click line numbers to set breakpoints',
      'Use step over/into/out controls',
      'Watch expressions in real-time'
    ]
  },
  {
    id: 'deploy',
    title: 'One-Click Deploy',
    description: 'Deploy your project to Vercel or Netlify with a single click.',
    icon: <Rocket className="h-5 w-5 text-purple-500" />,
    category: 'tools',
    tips: [
      'Connect your GitHub repository',
      'Automatic deployments on push',
      'Preview deployments for PRs'
    ]
  },
  // Shortcuts
  {
    id: 'command-palette',
    title: 'Command Palette',
    description: 'Access all commands quickly. Search for any action in the IDE.',
    icon: <Keyboard className="h-5 w-5 text-gray-400" />,
    category: 'shortcuts',
    shortcut: ['Cmd/Ctrl', 'Shift', 'P'],
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Customize your editor theme, font size, tab size, and more.',
    icon: <Settings className="h-5 w-5 text-gray-400" />,
    category: 'shortcuts',
    shortcut: ['Cmd/Ctrl', ','],
  },
]

const categories = [
  { id: 'ai', name: 'AI Features', icon: <Sparkles className="h-4 w-4" /> },
  { id: 'editor', name: 'Editor', icon: <FileCode className="h-4 w-4" /> },
  { id: 'tools', name: 'Tools', icon: <Code2 className="h-4 w-4" /> },
  { id: 'shortcuts', name: 'Shortcuts', icon: <Keyboard className="h-4 w-4" /> },
]

export function FeaturesHelpPanel({ isOpen, onClose }: FeaturesHelpPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ai')
  const [expandedFeature, setExpandedFeature] = useState<string | null>('ai-chat')

  if (!isOpen) return null

  const filteredFeatures = features.filter(f => f.category === selectedCategory)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#3c3c3c] bg-gradient-to-r from-amber-500/10 to-orange-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Volt IDE Features</h2>
              <p className="text-sm text-[#808080]">Everything you can do in Volt</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-[#808080] hover:text-white hover:bg-[#3c3c3c] rounded-lg"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex h-[calc(85vh-100px)]">
          {/* Category Sidebar */}
          <div className="w-48 border-r border-[#3c3c3c] p-3 bg-[#252526]">
            <nav className="space-y-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                    selectedCategory === cat.id
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400'
                      : 'text-[#cccccc] hover:bg-[#3c3c3c]'
                  )}
                >
                  {cat.icon}
                  {cat.name}
                </button>
              ))}
            </nav>

            <div className="mt-6 pt-4 border-t border-[#3c3c3c]">
              <a
                href="https://github.com/volt-ide/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm text-[#808080] hover:text-[#cccccc] transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Full Documentation
              </a>
            </div>
          </div>

          {/* Features List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {filteredFeatures.map(feature => (
                <div
                  key={feature.id}
                  className={cn(
                    "border border-[#3c3c3c] rounded-xl overflow-hidden transition-all duration-200",
                    expandedFeature === feature.id ? 'bg-[#252526]' : 'bg-[#1e1e1e] hover:bg-[#252526]'
                  )}
                >
                  <button
                    onClick={() => setExpandedFeature(expandedFeature === feature.id ? null : feature.id)}
                    className="w-full flex items-center gap-3 p-4 text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#3c3c3c] flex items-center justify-center shrink-0">
                      {feature.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-[#cccccc]">{feature.title}</h3>
                        {feature.shortcut && (
                          <div className="flex items-center gap-1">
                            {feature.shortcut.map((key, i) => (
                              <span key={i}>
                                <kbd className="px-1.5 py-0.5 text-[10px] bg-[#3c3c3c] rounded text-[#808080] font-mono">
                                  {key}
                                </kbd>
                                {i < feature.shortcut!.length - 1 && <span className="text-[#505050] mx-0.5">+</span>}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-[#808080] line-clamp-1">{feature.description}</p>
                    </div>
                    <ChevronRight className={cn(
                      "h-5 w-5 text-[#505050] transition-transform duration-200",
                      expandedFeature === feature.id && "rotate-90"
                    )} />
                  </button>

                  {expandedFeature === feature.id && feature.tips && (
                    <div className="px-4 pb-4 border-t border-[#3c3c3c] pt-3 ml-[52px]">
                      <p className="text-xs text-[#6e6e6e] uppercase tracking-wide mb-2">Pro Tips</p>
                      <ul className="space-y-1.5">
                        {feature.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-[#a0a0a0]">
                            <span className="text-amber-500 mt-1">-</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
