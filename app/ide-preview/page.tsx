'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'

// Dynamically import the IDE to avoid SSR issues with Monaco
const IDEInterface = dynamic(
  () => import('@/components/ide-interface').then(mod => mod.IDEInterface),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-[#1e1e1e] flex items-center justify-center">
        <div className="text-white">Loading IDE...</div>
      </div>
    )
  }
)

// Preview page - allows viewing IDE but execution requires login
export default function IDEPreviewPage() {
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
