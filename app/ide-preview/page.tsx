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
    <div className="relative">
      {/* Preview banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/90 text-black px-4 py-2 text-center text-sm font-medium">
        Preview Mode - <Link href="/auth/login" className="underline font-bold">Log in</Link> to run code and save your work
      </div>
      <div className="pt-10">
        <IDEInterface user={mockUser as any} />
      </div>
    </div>
  )
}
