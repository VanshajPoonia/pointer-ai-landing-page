import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('github_token')?.value
  
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated with GitHub' }, { status: 401 })
  }
  
  try {
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch repos')
    }
    
    const repos = await response.json()
    return NextResponse.json(repos)
  } catch (error) {
    console.error('GitHub repos error:', error)
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 })
  }
}
