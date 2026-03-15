'use client'

import { Collaborator } from '@/hooks/use-collaboration'
import { useEffect, useRef } from 'react'

interface CollaborationCursorsProps {
  collaborators: Collaborator[]
  editorRef: React.RefObject<any>
}

// CSS styles for cursor decorations
const cursorStyles = `
.collaborator-cursor {
  position: absolute;
  width: 2px;
  pointer-events: none;
  z-index: 100;
}

.collaborator-cursor-widget {
  position: absolute;
  top: 0;
  left: 0;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 500;
  color: white;
  border-radius: 3px 3px 3px 0;
  white-space: nowrap;
  pointer-events: none;
  transform: translateY(-100%);
  animation: cursorFadeIn 0.2s ease-out;
}

.collaborator-selection {
  position: absolute;
  opacity: 0.3;
  pointer-events: none;
}

@keyframes cursorFadeIn {
  from {
    opacity: 0;
    transform: translateY(-80%);
  }
  to {
    opacity: 1;
    transform: translateY(-100%);
  }
}

@keyframes cursorBlink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
`

export function CollaborationCursors({ collaborators, editorRef }: CollaborationCursorsProps) {
  const decorationsRef = useRef<string[]>([])
  const styleRef = useRef<HTMLStyleElement | null>(null)

  // Add styles to document
  useEffect(() => {
    if (!styleRef.current) {
      const style = document.createElement('style')
      style.textContent = cursorStyles
      document.head.appendChild(style)
      styleRef.current = style
    }

    return () => {
      if (styleRef.current) {
        document.head.removeChild(styleRef.current)
        styleRef.current = null
      }
    }
  }, [])

  // Update cursor decorations when collaborators change
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const monaco = (window as any).monaco
    if (!monaco) return

    // Clear old decorations
    if (decorationsRef.current.length > 0) {
      editor.deltaDecorations(decorationsRef.current, [])
      decorationsRef.current = []
    }

    const newDecorations: any[] = []

    collaborators.forEach(collaborator => {
      if (!collaborator.isActive) return

      const { cursorPosition, selection, userName, userColor } = collaborator
      
      // Cursor line decoration
      newDecorations.push({
        range: new monaco.Range(
          cursorPosition.line + 1,
          cursorPosition.column + 1,
          cursorPosition.line + 1,
          cursorPosition.column + 2
        ),
        options: {
          className: 'collaborator-cursor',
          beforeContentClassName: `collaborator-cursor-line-${collaborator.userId}`,
          hoverMessage: { value: userName },
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      })

      // Selection decoration
      if (selection) {
        newDecorations.push({
          range: new monaco.Range(
            selection.startLine + 1,
            selection.startColumn + 1,
            selection.endLine + 1,
            selection.endColumn + 1
          ),
          options: {
            className: `collaborator-selection-${collaborator.userId}`,
            hoverMessage: { value: `${userName}'s selection` },
          },
        })
      }

      // Add dynamic CSS for this collaborator's color
      const existingStyle = document.getElementById(`collab-style-${collaborator.userId}`)
      if (existingStyle) {
        existingStyle.remove()
      }
      
      const dynamicStyle = document.createElement('style')
      dynamicStyle.id = `collab-style-${collaborator.userId}`
      dynamicStyle.textContent = `
        .collaborator-cursor-line-${collaborator.userId}::before {
          content: '';
          position: absolute;
          width: 2px;
          height: 18px;
          background-color: ${userColor};
          animation: cursorBlink 1s infinite;
        }
        .collaborator-cursor-line-${collaborator.userId}::after {
          content: '${userName}';
          position: absolute;
          top: -18px;
          left: 0;
          padding: 1px 4px;
          font-size: 10px;
          font-weight: 500;
          color: white;
          background-color: ${userColor};
          border-radius: 2px 2px 2px 0;
          white-space: nowrap;
          pointer-events: none;
        }
        .collaborator-selection-${collaborator.userId} {
          background-color: ${userColor};
          opacity: 0.25;
        }
      `
      document.head.appendChild(dynamicStyle)
    })

    // Apply new decorations
    if (newDecorations.length > 0) {
      decorationsRef.current = editor.deltaDecorations([], newDecorations)
    }

    // Cleanup dynamic styles on unmount
    return () => {
      collaborators.forEach(collaborator => {
        const style = document.getElementById(`collab-style-${collaborator.userId}`)
        if (style) {
          style.remove()
        }
      })
    }
  }, [collaborators, editorRef])

  return null
}

// Collaborator presence indicator component
export function CollaboratorPresence({ collaborators }: { collaborators: Collaborator[] }) {
  const activeCollaborators = collaborators.filter(c => c.isActive)
  
  if (activeCollaborators.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 px-2">
      <span className="text-[11px] text-[#808080]">
        {activeCollaborators.length} editing
      </span>
      <div className="flex -space-x-1.5">
        {activeCollaborators.slice(0, 5).map(collaborator => (
          <div
            key={collaborator.userId}
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium text-white border-2 border-[#1e1e1e]"
            style={{ backgroundColor: collaborator.userColor }}
            title={collaborator.userName}
          >
            {collaborator.userName.charAt(0).toUpperCase()}
          </div>
        ))}
        {activeCollaborators.length > 5 && (
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium text-white bg-[#3c3c3c] border-2 border-[#1e1e1e]">
            +{activeCollaborators.length - 5}
          </div>
        )}
      </div>
    </div>
  )
}
