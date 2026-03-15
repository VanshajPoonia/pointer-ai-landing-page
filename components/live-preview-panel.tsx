'use client'

import { useState, useEffect, useRef } from 'react'
import { RefreshCw, Maximize2, Minimize2, ExternalLink, Smartphone, Monitor, Tablet } from 'lucide-react'
import { Button } from './ui/button'

interface LivePreviewPanelProps {
  html?: string
  css?: string
  javascript?: string
  isOpen: boolean
  onClose: () => void
}

type DeviceSize = 'mobile' | 'tablet' | 'desktop'

const deviceSizes: Record<DeviceSize, { width: string; label: string }> = {
  mobile: { width: '375px', label: 'Mobile' },
  tablet: { width: '768px', label: 'Tablet' },
  desktop: { width: '100%', label: 'Desktop' },
}

export function LivePreviewPanel({ html, css, javascript, isOpen, onClose }: LivePreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deviceSize, setDeviceSize] = useState<DeviceSize>('desktop')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Generate the preview document
  const generatePreviewDoc = () => {
    const doc = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Reset styles */
    * { box-sizing: border-box; }
    body { 
      margin: 0; 
      padding: 16px; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #ffffff;
      color: #1a1a1a;
    }
    /* User CSS */
    ${css || ''}
  </style>
</head>
<body>
  ${html || '<p style="color: #666;">Write some HTML to see the preview...</p>'}
  <script>
    // Capture console output
    (function() {
      const originalConsole = { ...console };
      ['log', 'error', 'warn', 'info'].forEach(method => {
        console[method] = function(...args) {
          originalConsole[method].apply(console, args);
          window.parent.postMessage({
            type: 'console',
            method: method,
            args: args.map(arg => {
              try {
                return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
              } catch {
                return String(arg);
              }
            })
          }, '*');
        };
      });
      
      // Capture errors
      window.onerror = function(msg, url, line, col, error) {
        window.parent.postMessage({
          type: 'error',
          message: msg,
          line: line,
          column: col
        }, '*');
        return false;
      };
    })();
    
    // User JavaScript
    try {
      ${javascript || ''}
    } catch (e) {
      console.error('Script Error:', e.message);
    }
  </script>
</body>
</html>
    `.trim()
    return doc
  }

  // Update preview when code changes
  useEffect(() => {
    if (!isOpen) return
    
    setIsLoading(true)
    setError(null)
    
    const timer = setTimeout(() => {
      if (iframeRef.current) {
        try {
          const doc = generatePreviewDoc()
          const blob = new Blob([doc], { type: 'text/html' })
          const url = URL.createObjectURL(blob)
          iframeRef.current.src = url
          setLastUpdate(new Date())
          
          // Cleanup blob URL after load
          iframeRef.current.onload = () => {
            URL.revokeObjectURL(url)
            setIsLoading(false)
          }
        } catch (e: any) {
          setError(e.message)
          setIsLoading(false)
        }
      }
    }, 300) // Debounce updates

    return () => clearTimeout(timer)
  }, [html, css, javascript, isOpen])

  // Listen for console messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'console') {
        // Could be used to show console output in a panel
      } else if (event.data?.type === 'error') {
        setError(`Line ${event.data.line}: ${event.data.message}`)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true)
      const doc = generatePreviewDoc()
      const blob = new Blob([doc], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      iframeRef.current.src = url
      iframeRef.current.onload = () => {
        URL.revokeObjectURL(url)
        setIsLoading(false)
        setLastUpdate(new Date())
      }
    }
  }

  const handleOpenInNewTab = () => {
    const doc = generatePreviewDoc()
    const blob = new Blob([doc], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  if (!isOpen) return null

  return (
    <div 
      className={`bg-[#252526] border-l border-[#191919] flex flex-col ${
        isFullscreen 
          ? 'fixed inset-0 z-50' 
          : 'w-[500px] h-full shrink-0'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-[35px] px-3 bg-[#252526] border-b border-[#191919]">
        <div className="flex items-center gap-2">
          <h3 className="text-[11px] font-semibold text-white uppercase tracking-wide">
            Live Preview
          </h3>
          {isLoading && (
            <RefreshCw className="w-3 h-3 text-[#007acc] animate-spin" />
          )}
          {lastUpdate && !isLoading && (
            <span className="text-[10px] text-[#6a6a6a]">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {/* Device Size Buttons */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeviceSize('mobile')}
            className={`h-6 w-6 p-0 ${deviceSize === 'mobile' ? 'text-[#007acc]' : 'text-[#858585]'}`}
            title="Mobile view"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeviceSize('tablet')}
            className={`h-6 w-6 p-0 ${deviceSize === 'tablet' ? 'text-[#007acc]' : 'text-[#858585]'}`}
            title="Tablet view"
          >
            <Tablet className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeviceSize('desktop')}
            className={`h-6 w-6 p-0 ${deviceSize === 'desktop' ? 'text-[#007acc]' : 'text-[#858585]'}`}
            title="Desktop view"
          >
            <Monitor className="w-3.5 h-3.5" />
          </Button>
          
          <div className="w-px h-4 bg-[#3c3c3c] mx-1" />
          
          {/* Action Buttons */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-6 w-6 p-0 text-[#858585] hover:text-white"
            title="Refresh preview"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenInNewTab}
            className="h-6 w-6 p-0 text-[#858585] hover:text-white"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-6 w-6 p-0 text-[#858585] hover:text-white"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-3 py-2 bg-[#5a1d1d] border-b border-[#8b3232] text-[12px] text-[#f48771]">
          {error}
        </div>
      )}

      {/* Preview Area */}
      <div className="flex-1 bg-[#1e1e1e] overflow-hidden flex items-start justify-center p-4">
        <div 
          className={`bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-200 ${
            deviceSize === 'desktop' ? 'w-full h-full' : 'h-full'
          }`}
          style={{ 
            width: deviceSizes[deviceSize].width,
            maxWidth: '100%',
          }}
        >
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            title="Live Preview"
            sandbox="allow-scripts allow-modals"
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-[22px] px-3 bg-[#007acc] flex items-center justify-between">
        <span className="text-[11px] text-white">
          {deviceSizes[deviceSize].label} Preview
        </span>
        <span className="text-[11px] text-white/70">
          {deviceSize !== 'desktop' && deviceSizes[deviceSize].width}
        </span>
      </div>
    </div>
  )
}
