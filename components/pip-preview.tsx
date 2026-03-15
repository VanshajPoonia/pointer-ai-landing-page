"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { 
  X, 
  Minimize2, 
  Maximize2, 
  Move,
  RefreshCw,
  ExternalLink,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react'

interface PiPPreviewProps {
  isOpen: boolean
  onClose: () => void
  previewUrl: string
  onRefresh: () => void
}

type DeviceType = 'desktop' | 'tablet' | 'mobile'

const DEVICE_SIZES: Record<DeviceType, { width: number; height: number }> = {
  desktop: { width: 400, height: 300 },
  tablet: { width: 300, height: 400 },
  mobile: { width: 200, height: 350 }
}

export function PiPPreview({
  isOpen,
  onClose,
  previewUrl,
  onRefresh
}: PiPPreviewProps) {
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isMinimized, setIsMinimized] = useState(false)
  const [device, setDevice] = useState<DeviceType>('desktop')
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    
    const newX = Math.max(0, Math.min(window.innerWidth - 100, e.clientX - dragOffset.x))
    const newY = Math.max(0, Math.min(window.innerHeight - 50, e.clientY - dragOffset.y))
    
    setPosition({ x: newX, y: newY })
  }, [isDragging, dragOffset])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Position in bottom right by default
  useEffect(() => {
    if (isOpen && !isDragging) {
      setPosition({
        x: window.innerWidth - DEVICE_SIZES[device].width - 40,
        y: window.innerHeight - DEVICE_SIZES[device].height - 100
      })
    }
  }, [isOpen, device])

  if (!isOpen) return null

  const size = DEVICE_SIZES[device]

  return (
    <div
      ref={containerRef}
      className={`fixed z-50 transition-all duration-200 ${
        isDragging ? 'cursor-grabbing' : ''
      }`}
      style={{
        left: position.x,
        top: position.y,
        width: isMinimized ? 200 : size.width,
        height: isMinimized ? 40 : size.height + 40
      }}
    >
      {/* Header */}
      <div
        className="h-10 bg-[#2d2d2d] border border-[#3c3c3c] rounded-t-lg flex items-center justify-between px-2 cursor-grab"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <Move className="h-3 w-3 text-[#888888]" />
          <span className="text-xs text-[#cccccc] font-medium">Preview</span>
        </div>
        
        <div className="flex items-center gap-1">
          {!isMinimized && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className={`h-6 w-6 p-0 ${device === 'mobile' ? 'text-blue-400' : 'text-[#888888]'}`}
                onClick={() => setDevice('mobile')}
                title="Mobile"
              >
                <Smartphone className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className={`h-6 w-6 p-0 ${device === 'tablet' ? 'text-blue-400' : 'text-[#888888]'}`}
                onClick={() => setDevice('tablet')}
                title="Tablet"
              >
                <Tablet className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className={`h-6 w-6 p-0 ${device === 'desktop' ? 'text-blue-400' : 'text-[#888888]'}`}
                onClick={() => setDevice('desktop')}
                title="Desktop"
              >
                <Monitor className="h-3 w-3" />
              </Button>
              <div className="w-px h-4 bg-[#3c3c3c] mx-1" />
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-[#888888] hover:text-[#cccccc]"
                onClick={onRefresh}
                title="Refresh"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-[#888888] hover:text-[#cccccc]"
                onClick={() => window.open(previewUrl, '_blank')}
                title="Open in new tab"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-[#888888] hover:text-[#cccccc]"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? (
              <Maximize2 className="h-3 w-3" />
            ) : (
              <Minimize2 className="h-3 w-3" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-[#888888] hover:text-red-400"
            onClick={onClose}
            title="Close"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      {!isMinimized && (
        <div
          className="bg-white border border-t-0 border-[#3c3c3c] rounded-b-lg overflow-hidden"
          style={{ height: size.height }}
        >
          <iframe
            src={previewUrl}
            className="w-full h-full"
            title="Preview"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      )}
    </div>
  )
}

// Hook for managing PiP state
export function usePiPPreview() {
  const [isOpen, setIsOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')

  const openPiP = useCallback((url: string) => {
    setPreviewUrl(url)
    setIsOpen(true)
  }, [])

  const closePiP = useCallback(() => {
    setIsOpen(false)
  }, [])

  return {
    isOpen,
    previewUrl,
    openPiP,
    closePiP,
    setPreviewUrl
  }
}

export default PiPPreview
