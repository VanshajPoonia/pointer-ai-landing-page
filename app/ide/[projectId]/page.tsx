'use client'

import { use } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import the IDE to avoid SSR issues with Monaco
const IDEInterface = dynamic(
  () => import('@/components/ide-interface').then(mod => mod.IDEInterface),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen w-full bg-[#1e1e1e] flex items-center justify-center">
        <div className="text-white">Loading IDE...</div>
      </div>
    )
  }
)

export default function ProjectIDEPage({ 
  params 
}: { 
  params: Promise<{ projectId: string }> 
}) {
  const { projectId } = use(params)
  
  return <IDEInterface projectId={projectId} />
}
