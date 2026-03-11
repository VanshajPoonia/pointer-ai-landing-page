import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params
  
  const cookieStore = await cookies()
  const token = cookieStore.get('github_token')?.value
  
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated with GitHub' }, { status: 401 })
  }
  
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch branches')
    }
    
    const branches = await response.json()
    return NextResponse.json(branches)
  } catch (error) {
    console.error('GitHub branches error:', error)
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 })
  }
}

// Create branch
export async function POST(
  request: Request,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params
  const { branchName, fromBranch = 'main' } = await request.json()
  
  const cookieStore = await cookies()
  const token = cookieStore.get('github_token')?.value
  
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated with GitHub' }, { status: 401 })
  }
  
  try {
    // Get the SHA of the source branch
    const refResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${fromBranch}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    )
    
    if (!refResponse.ok) {
      throw new Error('Failed to get source branch')
    }
    
    const refData = await refResponse.json()
    const sha = refData.object.sha
    
    // Create new branch
    const createResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha,
        }),
      }
    )
    
    if (!createResponse.ok) {
      const error = await createResponse.json()
      return NextResponse.json({ error: error.message }, { status: createResponse.status })
    }
    
    const result = await createResponse.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('GitHub create branch error:', error)
    return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 })
  }
}
