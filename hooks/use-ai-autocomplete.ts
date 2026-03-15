'use client'

import { useState, useRef, useCallback } from 'react'

interface AutocompleteState {
  suggestion: string
  isLoading: boolean
  position: { lineNumber: number; column: number } | null
}

interface UseAIAutocompleteOptions {
  language: string
  enabled: boolean
  debounceMs?: number
}

export function useAIAutocomplete({ language, enabled, debounceMs = 500 }: UseAIAutocompleteOptions) {
  const [state, setState] = useState<AutocompleteState>({
    suggestion: '',
    isLoading: false,
    position: null,
  })
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastRequestRef = useRef<string>('')

  const fetchSuggestion = useCallback(async (
    code: string,
    cursorLine: number,
    cursorColumn: number
  ) => {
    if (!enabled) return

    // Create request key to avoid duplicate requests
    const requestKey = `${code}:${cursorLine}:${cursorColumn}`
    if (requestKey === lastRequestRef.current) return
    lastRequestRef.current = requestKey

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Debounce the request
    debounceTimerRef.current = setTimeout(async () => {
      // Don't fetch for very short code or if cursor is at the beginning
      const lines = code.split('\n')
      const currentLine = lines[cursorLine - 1] || ''
      
      // Skip if line is empty or just whitespace
      if (currentLine.trim().length < 2) {
        setState(prev => ({ ...prev, suggestion: '', position: null }))
        return
      }

      // Skip if we're in a comment or string (basic check)
      const beforeCursor = currentLine.slice(0, cursorColumn - 1)
      if (beforeCursor.includes('//') || beforeCursor.includes('#')) {
        setState(prev => ({ ...prev, suggestion: '', position: null }))
        return
      }

      abortControllerRef.current = new AbortController()
      
      setState(prev => ({ ...prev, isLoading: true }))

      try {
        const response = await fetch('/api/ai-autocomplete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            language,
            cursorLine,
            cursorColumn,
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error('Failed to fetch suggestion')
        }

        const data = await response.json()
        
        if (data.suggestion && data.suggestion.trim()) {
          setState({
            suggestion: data.suggestion,
            isLoading: false,
            position: { lineNumber: cursorLine, column: cursorColumn },
          })
        } else {
          setState({
            suggestion: '',
            isLoading: false,
            position: null,
          })
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Autocomplete error:', error)
        }
        setState(prev => ({ ...prev, isLoading: false, suggestion: '', position: null }))
      }
    }, debounceMs)
  }, [enabled, language, debounceMs])

  const acceptSuggestion = useCallback(() => {
    const suggestion = state.suggestion
    clearSuggestion()
    return suggestion
  }, [state.suggestion])

  const clearSuggestion = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setState({
      suggestion: '',
      isLoading: false,
      position: null,
    })
    lastRequestRef.current = ''
  }, [])

  return {
    suggestion: state.suggestion,
    isLoading: state.isLoading,
    position: state.position,
    fetchSuggestion,
    acceptSuggestion,
    clearSuggestion,
  }
}
