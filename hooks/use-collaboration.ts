'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import * as Y from 'yjs'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface Collaborator {
  id: string
  userId: string
  userName: string
  userColor: string
  cursorPosition: { line: number; column: number }
  selection?: { startLine: number; startColumn: number; endLine: number; endColumn: number }
  isActive: boolean
  lastSeenAt: string
}

interface UseCollaborationOptions {
  fileId: string
  projectId: string
  userId: string
  userName: string
  userColor?: string
  onRemoteChange?: (content: string) => void
}

// Color palette for collaborators
const COLLABORATOR_COLORS = [
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#10b981', // emerald
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#14b8a6', // teal
  '#f97316', // orange
  '#06b6d4', // cyan
]

export function useCollaboration({
  fileId,
  projectId,
  userId,
  userName,
  userColor,
  onRemoteChange,
}: UseCollaborationOptions) {
  const supabase = createClient()
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  
  const ydocRef = useRef<Y.Doc | null>(null)
  const ytextRef = useRef<Y.Text | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const lastUpdateRef = useRef<string>('')
  const color = userColor || COLLABORATOR_COLORS[Math.floor(Math.random() * COLLABORATOR_COLORS.length)]

  // Initialize Yjs document
  useEffect(() => {
    const ydoc = new Y.Doc()
    const ytext = ydoc.getText('content')
    ydocRef.current = ydoc
    ytextRef.current = ytext

    return () => {
      ydoc.destroy()
    }
  }, [])

  // Set up Supabase Realtime channel
  useEffect(() => {
    if (!fileId || !projectId || !userId) return

    const setupCollaboration = async () => {
      try {
        // Create or update session in database
        const { data: session, error: sessionError } = await supabase
          .from('collaboration_sessions')
          .upsert({
            file_id: fileId,
            project_id: projectId,
            user_id: userId,
            user_name: userName,
            user_color: color,
            is_active: true,
            last_seen_at: new Date().toISOString(),
          }, {
            onConflict: 'file_id,user_id',
          })
          .select()
          .single()

        if (sessionError) {
          console.error('Failed to create session:', sessionError)
          setConnectionError('Failed to join collaboration session')
          return
        }

        sessionIdRef.current = session.id

        // Subscribe to realtime changes
        const channel = supabase
          .channel(`collaboration:${fileId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'collaboration_sessions',
              filter: `file_id=eq.${fileId}`,
            },
            (payload) => {
              if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const record = payload.new as any
                if (record.user_id !== userId) {
                  setCollaborators(prev => {
                    const existing = prev.findIndex(c => c.userId === record.user_id)
                    const collaborator: Collaborator = {
                      id: record.id,
                      userId: record.user_id,
                      userName: record.user_name || 'Anonymous',
                      userColor: record.user_color || '#888888',
                      cursorPosition: record.cursor_position || { line: 0, column: 0 },
                      selection: record.selection,
                      isActive: record.is_active,
                      lastSeenAt: record.last_seen_at,
                    }
                    
                    if (existing >= 0) {
                      const updated = [...prev]
                      updated[existing] = collaborator
                      return updated.filter(c => c.isActive)
                    }
                    return [...prev, collaborator].filter(c => c.isActive)
                  })
                }
              } else if (payload.eventType === 'DELETE') {
                const record = payload.old as any
                setCollaborators(prev => prev.filter(c => c.id !== record.id))
              }
            }
          )
          .on('broadcast', { event: 'yjs-update' }, ({ payload }) => {
            if (payload.userId !== userId && ydocRef.current) {
              try {
                const update = new Uint8Array(payload.update)
                Y.applyUpdate(ydocRef.current, update)
                
                const newContent = ytextRef.current?.toString() || ''
                if (newContent !== lastUpdateRef.current) {
                  lastUpdateRef.current = newContent
                  onRemoteChange?.(newContent)
                }
              } catch (e) {
                console.error('Failed to apply Yjs update:', e)
              }
            }
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsConnected(true)
              setConnectionError(null)
            } else if (status === 'CHANNEL_ERROR') {
              setConnectionError('Connection error')
            }
          })

        channelRef.current = channel

        // Load existing collaborators
        const { data: existingCollabs } = await supabase
          .from('collaboration_sessions')
          .select('*')
          .eq('file_id', fileId)
          .eq('is_active', true)
          .neq('user_id', userId)

        if (existingCollabs) {
          setCollaborators(existingCollabs.map(c => ({
            id: c.id,
            userId: c.user_id,
            userName: c.user_name || 'Anonymous',
            userColor: c.user_color || '#888888',
            cursorPosition: c.cursor_position || { line: 0, column: 0 },
            selection: c.selection,
            isActive: c.is_active,
            lastSeenAt: c.last_seen_at,
          })))
        }

      } catch (e) {
        console.error('Collaboration setup error:', e)
        setConnectionError('Failed to set up collaboration')
      }
    }

    setupCollaboration()

    // Heartbeat to keep session alive
    const heartbeat = setInterval(async () => {
      if (sessionIdRef.current) {
        await supabase
          .from('collaboration_sessions')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', sessionIdRef.current)
      }
    }, 30000) // Every 30 seconds

    return () => {
      clearInterval(heartbeat)
      
      // Mark session as inactive
      if (sessionIdRef.current) {
        supabase
          .from('collaboration_sessions')
          .update({ is_active: false })
          .eq('id', sessionIdRef.current)
          .then(() => {})
      }
      
      // Unsubscribe from channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [fileId, projectId, userId, userName, color, onRemoteChange, supabase])

  // Send local changes to collaborators
  const sendUpdate = useCallback((content: string) => {
    if (!ydocRef.current || !ytextRef.current || !channelRef.current) return

    const ytext = ytextRef.current
    const currentContent = ytext.toString()
    
    if (content !== currentContent) {
      ydocRef.current.transact(() => {
        ytext.delete(0, ytext.length)
        ytext.insert(0, content)
      })

      const update = Y.encodeStateAsUpdate(ydocRef.current)
      lastUpdateRef.current = content

      channelRef.current.send({
        type: 'broadcast',
        event: 'yjs-update',
        payload: {
          userId,
          update: Array.from(update),
        },
      })
    }
  }, [userId])

  // Update cursor position
  const updateCursor = useCallback(async (position: { line: number; column: number }, selection?: { startLine: number; startColumn: number; endLine: number; endColumn: number }) => {
    if (!sessionIdRef.current) return

    await supabase
      .from('collaboration_sessions')
      .update({
        cursor_position: position,
        selection: selection || null,
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', sessionIdRef.current)
  }, [supabase])

  // Initialize document with content
  const initializeContent = useCallback((content: string) => {
    if (!ytextRef.current || !ydocRef.current) return
    
    ydocRef.current.transact(() => {
      ytextRef.current!.delete(0, ytextRef.current!.length)
      ytextRef.current!.insert(0, content)
    })
    lastUpdateRef.current = content
  }, [])

  return {
    collaborators,
    isConnected,
    connectionError,
    sendUpdate,
    updateCursor,
    initializeContent,
    userColor: color,
  }
}
