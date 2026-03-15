'use client'

import { Button } from './ui/button'
import { FilePlus, LogOut, Coffee, Crown, FolderOpen, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UserData {
  id: string
  email?: string
  user_metadata?: {
    avatar_url?: string
    full_name?: string
  }
}

interface IDEHeaderProps {
  user: UserData | null
  executions: number
  isPaid: boolean
  isAdmin: boolean
  onNewFile: () => void
  projectName?: string
}

export function IDEHeader({ user, executions, isPaid, isAdmin, onNewFile, projectName }: IDEHeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="flex h-[48px] items-center justify-between bg-[#323233] border-b border-[#191919] px-4">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-[#f59e0b] to-[#ea580c] flex items-center justify-center">
            <span className="text-white text-xs font-bold">V</span>
          </div>
          <h1 className="text-[13px] font-medium text-white">Volt</h1>
        </Link>
        
        {projectName && (
          <>
            <div className="h-5 w-px bg-[#3c3c3c]" />
            <Link href="/dashboard" className="flex items-center gap-1.5 text-[#808080] hover:text-[#cccccc] transition-colors">
              <ChevronLeft className="h-4 w-4" />
              <span className="text-[12px]">Projects</span>
            </Link>
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-amber-500" />
              <span className="text-[13px] font-medium text-white">{projectName}</span>
            </div>
          </>
        )}
        
        <Button
          onClick={onNewFile}
          size="sm"
          variant="ghost"
          className="h-[26px] px-2.5 text-[#cccccc] hover:bg-[#3e3e42] text-[12px] rounded-[3px]"
        >
          <FilePlus className="mr-1.5 h-4 w-4" />
          New File
        </Button>
      </div>

      <div className="flex items-center gap-3">
        {isAdmin && (
          <Link href="/admin">
            <Button
              size="sm"
              className="h-[26px] px-2.5 bg-[#f59e0b] text-black hover:bg-[#fbbf24] text-[12px] rounded-[3px] font-medium"
            >
              <Crown className="mr-1.5 h-3.5 w-3.5" />
              Admin
            </Button>
          </Link>
        )}
        
        <div className="flex items-center gap-1.5 bg-[#1e1e1e] px-2.5 py-1 rounded-[3px] text-[12px] border border-[#3c3c3c]">
          {isAdmin ? (
            <span className="text-[#f59e0b] font-medium">Unlimited</span>
          ) : isPaid ? (
            <span className="text-[#4ade80] font-medium">Pro</span>
          ) : (
            <span className="text-[#cccccc]">
              <span className="font-medium">{executions}</span>
              <span className="text-[#808080]">/100</span>
            </span>
          )}
        </div>

        {!isPaid && !isAdmin && (
          <Button
            onClick={() => window.open('https://buymeacoffee.com/yourhandle', '_blank')}
            size="sm"
            className="h-[26px] px-2.5 bg-[#0e639c] hover:bg-[#1177bb] text-white text-[12px] rounded-[3px]"
          >
            <Coffee className="mr-1.5 h-3.5 w-3.5" />
            Upgrade
          </Button>
        )}

        <div className="h-5 w-px bg-[#3c3c3c]" />

        <div className="text-[12px] text-[#cccccc]">{user?.email || 'Guest'}</div>

        <Button
          onClick={handleSignOut}
          size="sm"
          variant="ghost"
          className="h-[26px] w-[26px] p-0 text-[#cccccc] hover:bg-[#3e3e42] rounded-[3px]"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
