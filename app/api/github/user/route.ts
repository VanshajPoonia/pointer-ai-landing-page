import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get GitHub connection
  const { data: connection } = await supabase
    .from('github_connections')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!connection) {
    return NextResponse.json({ connected: false })
  }

  // Fetch GitHub user info
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      // Token might be invalid, delete connection
      await supabase
        .from('github_connections')
        .delete()
        .eq('user_id', user.id)
      
      return NextResponse.json({ connected: false })
    }

    const githubUser = await response.json()

    return NextResponse.json({
      connected: true,
      user: {
        login: githubUser.login,
        avatar_url: githubUser.avatar_url,
        name: githubUser.name,
        html_url: githubUser.html_url,
      },
    })
  } catch (error) {
    return NextResponse.json({ connected: false, error: 'Failed to fetch GitHub user' })
  }
}

export async function DELETE() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Delete GitHub connection
  await supabase
    .from('github_connections')
    .delete()
    .eq('user_id', user.id)

  return NextResponse.json({ success: true })
}
