'use client'

import { useState, useEffect } from 'react'
import { 
  Code, Search, Plus, Heart, Globe, Lock, Copy, 
  Trash2, Edit2, X, Tag, Filter, Star, ChevronDown
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { createClient } from '@/lib/supabase/client'

interface Snippet {
  id: string
  title: string
  description: string
  code: string
  language: string
  tags: string[]
  is_public: boolean
  favorites_count: number
  user_id: string
  created_at: string
}

interface SnippetsPanelProps {
  isOpen: boolean
  onClose: () => void
  onInsertSnippet: (code: string) => void
  currentLanguage: string
  currentCode?: string
}

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 
  'go', 'rust', 'ruby', 'php', 'html', 'css', 'sql', 'bash'
]

export function SnippetsPanel({ 
  isOpen, 
  onClose, 
  onInsertSnippet, 
  currentLanguage,
  currentCode 
}: SnippetsPanelProps) {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'my' | 'public' | 'favorites'>('my')
  const [searchQuery, setSearchQuery] = useState('')
  const [languageFilter, setLanguageFilter] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null)
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null)
  
  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formLanguage, setFormLanguage] = useState(currentLanguage)
  const [formTags, setFormTags] = useState('')
  const [formIsPublic, setFormIsPublic] = useState(false)

  const supabase = createClient()

  const fetchSnippets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ view })
      if (languageFilter) params.append('language', languageFilter)
      if (searchQuery) params.append('search', searchQuery)
      
      const res = await fetch(`/api/snippets?${params}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setSnippets(data)
      }
    } catch (err) {
      console.error('Failed to fetch snippets:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchSnippets()
    }
  }, [isOpen, view, languageFilter, searchQuery])

  const handleCreateSnippet = async () => {
    if (!formTitle || !formCode) return

    try {
      const res = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          code: formCode,
          language: formLanguage,
          tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
          is_public: formIsPublic,
        }),
      })
      
      if (res.ok) {
        resetForm()
        setShowCreateModal(false)
        fetchSnippets()
      }
    } catch (err) {
      console.error('Failed to create snippet:', err)
    }
  }

  const handleUpdateSnippet = async () => {
    if (!editingSnippet || !formTitle || !formCode) return

    try {
      const res = await fetch(`/api/snippets/${editingSnippet.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          code: formCode,
          language: formLanguage,
          tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
          is_public: formIsPublic,
        }),
      })
      
      if (res.ok) {
        resetForm()
        setEditingSnippet(null)
        fetchSnippets()
      }
    } catch (err) {
      console.error('Failed to update snippet:', err)
    }
  }

  const handleDeleteSnippet = async (id: string) => {
    if (!confirm('Are you sure you want to delete this snippet?')) return

    try {
      const res = await fetch(`/api/snippets/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchSnippets()
        if (selectedSnippet?.id === id) {
          setSelectedSnippet(null)
        }
      }
    } catch (err) {
      console.error('Failed to delete snippet:', err)
    }
  }

  const handleToggleFavorite = async (snippet: Snippet) => {
    try {
      // Simple toggle - POST to add, DELETE to remove
      const res = await fetch(`/api/snippets/${snippet.id}/favorite`, {
        method: 'POST',
      })
      if (res.ok) {
        fetchSnippets()
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    }
  }

  const resetForm = () => {
    setFormTitle('')
    setFormDescription('')
    setFormCode('')
    setFormLanguage(currentLanguage)
    setFormTags('')
    setFormIsPublic(false)
  }

  const openEditModal = (snippet: Snippet) => {
    setFormTitle(snippet.title)
    setFormDescription(snippet.description)
    setFormCode(snippet.code)
    setFormLanguage(snippet.language)
    setFormTags(snippet.tags.join(', '))
    setFormIsPublic(snippet.is_public)
    setEditingSnippet(snippet)
  }

  const openCreateWithCurrentCode = () => {
    setFormCode(currentCode || '')
    setFormLanguage(currentLanguage)
    setShowCreateModal(true)
  }

  if (!isOpen) return null

  return (
    <div className="absolute right-0 top-0 bottom-0 w-[400px] bg-[#252526] border-l border-[#3c3c3c] flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#3c3c3c]">
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5 text-amber-500" />
          <h2 className="text-[14px] font-medium text-white">Code Snippets</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 text-[#808080] hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* View Tabs */}
      <div className="flex border-b border-[#3c3c3c]">
        {(['my', 'public', 'favorites'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 px-4 py-2 text-[12px] transition-colors ${
              view === v
                ? 'text-amber-500 border-b-2 border-amber-500 bg-[#1e1e1e]'
                : 'text-[#808080] hover:text-white'
            }`}
          >
            {v === 'my' && <Lock className="inline h-3 w-3 mr-1" />}
            {v === 'public' && <Globe className="inline h-3 w-3 mr-1" />}
            {v === 'favorites' && <Heart className="inline h-3 w-3 mr-1" />}
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="p-3 space-y-2 border-b border-[#3c3c3c]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#808080]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search snippets..."
            className="pl-9 h-8 bg-[#1e1e1e] border-[#3c3c3c] text-[12px]"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="flex-1 h-7 px-2 text-[11px] bg-[#1e1e1e] border border-[#3c3c3c] rounded text-[#cccccc]"
          >
            <option value="">All Languages</option>
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
          <Button
            onClick={openCreateWithCurrentCode}
            size="sm"
            className="h-7 px-3 text-[11px] bg-amber-600 hover:bg-amber-700"
          >
            <Plus className="h-3 w-3 mr-1" />
            Save Current
          </Button>
        </div>
      </div>

      {/* Snippets List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        ) : snippets.length === 0 ? (
          <div className="text-center py-8 text-[#808080] text-[12px]">
            {view === 'my' ? 'No snippets yet. Save your first snippet!' : 'No snippets found.'}
          </div>
        ) : (
          <div className="divide-y divide-[#3c3c3c]">
            {snippets.map((snippet) => (
              <div
                key={snippet.id}
                className={`p-3 cursor-pointer transition-colors ${
                  selectedSnippet?.id === snippet.id ? 'bg-[#37373d]' : 'hover:bg-[#2a2d2e]'
                }`}
                onClick={() => setSelectedSnippet(snippet)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[13px] font-medium text-white truncate">{snippet.title}</h3>
                      {snippet.is_public ? (
                        <Globe className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <Lock className="h-3 w-3 text-[#808080] flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#808080] truncate mt-0.5">
                      {snippet.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 bg-[#3c3c3c] rounded text-amber-400">
                        {snippet.language}
                      </span>
                      {snippet.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-[#3c3c3c] rounded text-[#808080]">
                          {tag}
                        </span>
                      ))}
                      {snippet.favorites_count > 0 && (
                        <span className="text-[10px] text-[#808080] flex items-center gap-0.5">
                          <Star className="h-3 w-3 text-amber-500" />
                          {snippet.favorites_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Snippet Preview */}
      {selectedSnippet && (
        <div className="border-t border-[#3c3c3c] bg-[#1e1e1e]">
          <div className="p-3 border-b border-[#3c3c3c]">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-medium text-white">{selectedSnippet.title}</h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onInsertSnippet(selectedSnippet.code)}
                  className="h-6 px-2 text-[11px] text-emerald-500 hover:bg-emerald-500/10"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Insert
                </Button>
                {view !== 'public' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(selectedSnippet)}
                      className="h-6 w-6 p-0 text-[#808080] hover:text-white"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSnippet(selectedSnippet.id)}
                      className="h-6 w-6 p-0 text-[#808080] hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
                {view === 'public' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleFavorite(selectedSnippet)}
                    className="h-6 w-6 p-0 text-[#808080] hover:text-amber-500"
                  >
                    <Heart className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          <pre className="p-3 text-[11px] font-mono text-[#cccccc] max-h-[150px] overflow-auto">
            <code>{selectedSnippet.code}</code>
          </pre>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingSnippet) && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-[350px] bg-[#252526] rounded-lg border border-[#3c3c3c] shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#3c3c3c]">
              <h3 className="text-[14px] font-medium text-white">
                {editingSnippet ? 'Edit Snippet' : 'Save Snippet'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  resetForm()
                  setShowCreateModal(false)
                  setEditingSnippet(null)
                }}
                className="h-6 w-6 p-0 text-[#808080]"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] text-[#808080] mb-1">Title *</label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="My awesome snippet"
                  className="h-8 bg-[#1e1e1e] border-[#3c3c3c] text-[12px]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#808080] mb-1">Description</label>
                <Input
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="What does this snippet do?"
                  className="h-8 bg-[#1e1e1e] border-[#3c3c3c] text-[12px]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#808080] mb-1">Language</label>
                <select
                  value={formLanguage}
                  onChange={(e) => setFormLanguage(e.target.value)}
                  className="w-full h-8 px-3 text-[12px] bg-[#1e1e1e] border border-[#3c3c3c] rounded text-[#cccccc]"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-[#808080] mb-1">Tags (comma-separated)</label>
                <Input
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="utility, helper, api"
                  className="h-8 bg-[#1e1e1e] border-[#3c3c3c] text-[12px]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#808080] mb-1">Code *</label>
                <textarea
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="Paste your code here..."
                  rows={6}
                  className="w-full px-3 py-2 text-[12px] font-mono bg-[#1e1e1e] border border-[#3c3c3c] rounded text-[#cccccc] resize-none"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsPublic}
                  onChange={(e) => setFormIsPublic(e.target.checked)}
                  className="rounded border-[#3c3c3c]"
                />
                <span className="text-[12px] text-[#cccccc]">Share publicly in marketplace</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-[#3c3c3c]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  resetForm()
                  setShowCreateModal(false)
                  setEditingSnippet(null)
                }}
                className="h-8 px-4 text-[12px]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={editingSnippet ? handleUpdateSnippet : handleCreateSnippet}
                className="h-8 px-4 text-[12px] bg-amber-600 hover:bg-amber-700"
              >
                {editingSnippet ? 'Update' : 'Save'} Snippet
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
