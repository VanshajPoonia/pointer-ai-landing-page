'use client'

import { User } from '@supabase/supabase-js'
import { Button } from './ui/button'
import { FilePlus, LogOut, Coffee } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface IDEHeaderProps {
  user: User
  executions: number
  isPaid: boolean
  onNewFile: () => void
}

export function IDEHeader({ user, executions, isPaid, onNewFile }: IDEHeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="flex h-12 items-center justify-between border-b border-[#333] bg-[#323233] px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-white">Code IDE</h1>
        <Button
          onClick={onNewFile}
          size="sm"
          variant="ghost"
          className="text-[#ccc] hover:bg-[#3e3e42] hover:text-white"
        >
          <FilePlus className="mr-2 h-4 w-4" />
          New File
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-sm text-[#ccc]">
          {isPaid ? (
            <span className="text-green-400">Pro Plan</span>
          ) : (
            <span>
              {executions}/100 executions
              {executions >= 100 && (
                <span className="ml-2 text-red-400">(Limit reached)</span>
              )}
            </span>
          )}
        </div>

        {!isPaid && (
          <Button
            onClick={() => window.open('https://buymeacoffee.com/yourhandle', '_blank')}
            size="sm"
            className="bg-[#FFDD00] text-black hover:bg-[#FFDD00]/90"
          >
            <Coffee className="mr-2 h-4 w-4" />
            Upgrade
          </Button>
        )}

        <div className="text-sm text-[#ccc]">{user.email}</div>

        <Button
          onClick={handleSignOut}
          size="sm"
          variant="ghost"
          className="text-[#ccc] hover:bg-[#3e3e42] hover:text-white"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
