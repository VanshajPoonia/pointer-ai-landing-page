'use client'

import { User } from '@supabase/supabase-js'
import { Button } from './ui/button'
import { FilePlus, LogOut, Coffee, Crown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface IDEHeaderProps {
  user: User
  executions: number
  isPaid: boolean
  isAdmin: boolean
  onNewFile: () => void
}

export function IDEHeader({ user, executions, isPaid, isAdmin, onNewFile }: IDEHeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="flex h-12 items-center justify-between bg-[#181818] border-b border-[#2b2b2b] px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-base font-semibold text-[#f0f0f0]">CodeIDE</h1>
        <Button
          onClick={onNewFile}
          size="sm"
          variant="ghost"
          className="h-8 text-[#cccccc] hover:bg-[#2a2d2e] text-xs"
        >
          <FilePlus className="mr-1.5 h-3.5 w-3.5" />
          New File
        </Button>
      </div>

      <div className="flex items-center gap-3">
        {isAdmin && (
          <Link href="/admin">
            <Button
              size="sm"
              className="h-8 bg-[#f59e0b] text-white hover:bg-[#d97706] text-xs"
            >
              <Crown className="mr-1.5 h-3.5 w-3.5" />
              Admin
            </Button>
          </Link>
        )}
        
        <div className="flex items-center gap-1.5 bg-[#252526] px-2.5 py-1 rounded text-xs border border-[#3c3c3c]">
          {isAdmin ? (
            <span className="text-[#f59e0b]">Admin • Unlimited</span>
          ) : isPaid ? (
            <span className="text-[#4ade80]">Pro Plan</span>
          ) : (
            <span className="text-[#cccccc]">
              <span className="font-medium">{executions}</span>
              <span className="text-[#808080]">/100</span>
              {executions >= 100 && (
                <span className="ml-1.5 text-[#f87171]">(Limit)</span>
              )}
            </span>
          )}
        </div>

        {!isPaid && !isAdmin && (
          <Button
            onClick={() => window.open('https://buymeacoffee.com/yourhandle', '_blank')}
            size="sm"
            className="h-8 bg-[#0e639c] hover:bg-[#1177bb] text-white text-xs"
          >
            <Coffee className="mr-1.5 h-3.5 w-3.5" />
            Upgrade
          </Button>
        )}

        <div className="text-xs text-[#cccccc]">{user.email}</div>

        <Button
          onClick={handleSignOut}
          size="sm"
          variant="ghost"
          className="h-8 text-[#cccccc] hover:bg-[#2a2d2e]"
        >
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
