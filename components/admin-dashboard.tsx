'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Code, Crown, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  email: string
  is_admin: boolean
  is_premium: boolean
  free_executions_remaining: number
  created_at: string
}

interface CodeSnippet {
  id: string
  user_id: string
  title: string
  language: string
  code: string
  created_at: string
  users: {
    email: string
  }
}

export function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [snippets, setSnippets] = useState<CodeSnippet[]>([])
  const [activeTab, setActiveTab] = useState<'users' | 'snippets'>('users')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    
    // Load all users
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('[v0] Admin dashboard - users query:', { usersData, usersError })

    // Load all code snippets with user email
    const { data: snippetsData, error: snippetsError } = await supabase
      .from('code_snippets')
      .select(`
        *,
        users (
          email
        )
      `)
      .order('created_at', { ascending: false })

    console.log('[v0] Admin dashboard - snippets query:', { snippetsData, snippetsError })

    if (usersData) setUsers(usersData)
    if (snippetsData) setSnippets(snippetsData as any)
    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-yellow-500" />
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/ide">
              <Button variant="ghost">Go to IDE</Button>
            </Link>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold">{users.length}</p>
              </div>
              <Users className="h-10 w-10 text-blue-500" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Code Snippets</p>
                <p className="text-3xl font-bold">{snippets.length}</p>
              </div>
              <Code className="h-10 w-10 text-green-500" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Premium Users</p>
                <p className="text-3xl font-bold">
                  {users.filter((u) => u.is_premium).length}
                </p>
              </div>
              <Crown className="h-10 w-10 text-yellow-500" />
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b border-border">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 font-medium transition-colors ${
              activeTab === 'users'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('snippets')}
            className={`pb-3 font-medium transition-colors ${
              activeTab === 'snippets'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Code Snippets
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <>
            {activeTab === 'users' && (
              <div className="space-y-4">
                {users.map((user) => (
                  <Card key={user.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold">{user.email}</p>
                          {user.is_admin && (
                            <Badge variant="default" className="bg-yellow-500">
                              Admin
                            </Badge>
                          )}
                          {user.is_premium && (
                            <Badge variant="default" className="bg-green-500">
                              Premium
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <span>Free Executions Left: {user.free_executions_remaining}</span>
                          <span>
                            Joined: {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {activeTab === 'snippets' && (
              <div className="space-y-4">
                {snippets.map((snippet) => (
                  <Card key={snippet.id} className="p-6">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{snippet.title}</h3>
                        <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                          <span>By: {snippet.users.email}</span>
                          <span>Language: {snippet.language}</span>
                          <span>
                            {new Date(snippet.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <pre className="mt-3 max-h-40 overflow-auto rounded-md bg-muted p-3 text-sm">
                      <code>{snippet.code}</code>
                    </pre>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
