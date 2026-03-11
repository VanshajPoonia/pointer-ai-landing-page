import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path') || ''
  const ref = searchParams.get('ref') || 'main'
  
  const cookieStore = await cookies()
  const token = cookieStore.get('github_token')?.value
  
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated with GitHub' }, { status: 401 })
  }
  
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })
    
    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.message }, { status: response.status })
    }
    
    const contents = await response.json()
    return NextResponse.json(contents)
  } catch (error) {
    console.error('GitHub contents error:', error)
    return NextResponse.json({ error: 'Failed to fetch contents' }, { status: 500 })
  }
}

// Create or update file
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params
  const body = await request.json()
  const { path, content, message, sha, branch = 'main' } = body
  
  const cookieStore = await cookies()
  const token = cookieStore.get('github_token')?.value
  
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated with GitHub' }, { status: 401 })
  }
  
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        content: Buffer.from(content).toString('base64'),
        sha,
        branch,
      }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.message }, { status: response.status })
    }
    
    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('GitHub update error:', error)
    return NextResponse.json({ error: 'Failed to update file' }, { status: 500 })
  }
}

// Delete file
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params
  const body = await request.json()
  const { path, message, sha, branch = 'main' } = body
  
  const cookieStore = await cookies()
  const token = cookieStore.get('github_token')?.value
  
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated with GitHub' }, { status: 401 })
  }
  
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sha,
        branch,
      }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.message }, { status: response.status })
    }
    
    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('GitHub delete error:', error)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}
