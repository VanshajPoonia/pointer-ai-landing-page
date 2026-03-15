'use client'

import { use } from 'react'
import { IDEInterface } from '@/components/ide-interface'

export default function ProjectIDEPage({ 
  params 
}: { 
  params: Promise<{ projectId: string }> 
}) {
  const { projectId } = use(params)
  
  return <IDEInterface projectId={projectId} />
}
