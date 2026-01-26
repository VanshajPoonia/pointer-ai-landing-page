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
    <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-medium text-gray-900">CodeIDE</h1>
        <Button
          onClick={onNewFile}
          size="sm"
          variant="ghost"
          className="text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <FilePlus className="mr-2 h-4 w-4" />
          New File
        </Button>
      </div>

      <div className="flex items-center gap-4">
        {isAdmin && (
          <Link href="/admin">
            <Button
              size="sm"
              className="bg-amber-500 text-white hover:bg-amber-600 rounded-lg shadow-sm"
            >
              <Crown className="mr-2 h-4 w-4" />
              Admin
            </Button>
          </Link>
        )}
        
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 text-sm">
          {isAdmin ? (
            <span className="font-medium text-amber-600">Admin • Unlimited</span>
          ) : isPaid ? (
            <span className="font-medium text-green-600">Pro Plan</span>
          ) : (
            <span className="text-gray-700">
              <span className="font-medium">{executions}</span>
              <span className="text-gray-500">/100</span>
              {executions >= 100 && (
                <span className="ml-2 text-red-600 font-medium">(Limit reached)</span>
              )}
            </span>
          )}
        </div>

        {!isPaid && !isAdmin && (
          <Button
            onClick={() => window.open('https://buymeacoffee.com/yourhandle', '_blank')}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
          >
            <Coffee className="mr-2 h-4 w-4" />
            Upgrade
          </Button>
        )}

        <div className="text-sm text-gray-600">{user.email}</div>

        <Button
          onClick={handleSignOut}
          size="sm"
          variant="ghost"
          className="text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
