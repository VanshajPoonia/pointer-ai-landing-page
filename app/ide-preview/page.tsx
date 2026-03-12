'use client'

import { IDEInterface } from '@/components/ide-interface'
import Link from 'next/link'

// Preview page - allows viewing IDE but execution requires login
export default function IDEPreviewPage() {
  // Mock user for preview (code execution won't work without real auth)
  const mockUser = {
    id: 'preview-user',
    email: 'preview@demo.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Preview banner - positioned above IDE */}
      <div className="bg-amber-500 text-black px-4 py-1.5 text-center text-sm font-medium shrink-0">
        Preview Mode - <Link href="/auth/login" className="underline font-bold">Log in</Link> to run code and save your work
      </div>
      <div className="flex-1 min-h-0">
        <IDEInterface user={mockUser as any} />
      </div>
    </div>
  )
}
