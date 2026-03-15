'use client'

import { IDEInterface } from '@/components/ide-interface'
import Link from 'next/link'
import { useEffect } from 'react'

// Preview page - allows viewing IDE but execution requires login
export default function IDEPreviewPage() {
  useEffect(() => {
    console.log('[v0] IDEPreviewPage mounted')
  }, [])

  return (
    <div className="h-screen flex flex-col">
      {/* Preview banner - positioned above IDE */}
      <div className="bg-amber-500 text-black px-4 py-1.5 text-center text-sm font-medium shrink-0">
        Preview Mode - <Link href="/auth/login" className="underline font-bold">Log in</Link> to run code and save your work
      </div>
      <div className="flex-1 min-h-0">
        <IDEInterface />
      </div>
    </div>
  )
}
