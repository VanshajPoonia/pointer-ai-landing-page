"use client"

import { useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { X, Maximize2 } from 'lucide-react'

interface ZenModeProps {
  isActive: boolean
  onExit: () => void
  children: React.ReactNode
}

export function ZenMode({ isActive, onExit, children }: ZenModeProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isActive) {
      onExit()
    }
  }, [isActive, onExit])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (isActive) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isActive])

  if (!isActive) return null

  return (
    <div className="fixed inset-0 z-50 bg-[#1e1e1e]">
      {/* Minimal toolbar */}
      <div className="absolute top-0 left-0 right-0 h-10 flex items-center justify-between px-4 bg-[#1e1e1e]/80 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity z-10">
        <div className="flex items-center gap-2 text-xs text-[#888888]">
          <Maximize2 className="h-4 w-4" />
          <span>Zen Mode</span>
          <span className="text-[#666666]">Press ESC to exit</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onExit}
          className="h-7 px-2 text-[#888888] hover:text-[#cccccc]"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor content - centered and focused */}
      <div className="h-full flex items-center justify-center p-8">
        <div className="w-full max-w-5xl h-full rounded-lg overflow-hidden shadow-2xl border border-[#3c3c3c]">
          {children}
        </div>
      </div>
    </div>
  )
}

// Hook for managing zen mode
export function useZenMode() {
  const [isZenMode, setIsZenMode] = useState(false)

  const enterZenMode = useCallback(() => setIsZenMode(true), [])
  const exitZenMode = useCallback(() => setIsZenMode(false), [])
  const toggleZenMode = useCallback(() => setIsZenMode(prev => !prev), [])

  return {
    isZenMode,
    enterZenMode,
    exitZenMode,
    toggleZenMode
  }
}

import { useState } from 'react'

export default ZenMode
