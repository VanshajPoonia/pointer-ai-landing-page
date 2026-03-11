import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params
  const { searchParams } = new URL(request.url)
  const branch = searchParams.get('branch') || 'main'
  const perPage = searchParams.get('per_page') || '30'
  
  const cookieStore = await cookies()
  const token = cookieStore.get('github_token')?.value
  
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated with GitHub' }, { status: 401 })
  }
  
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&per_page=${perPage}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch commits')
    }
    
    const commits = await response.json()
    return NextResponse.json(commits)
  } catch (error) {
    console.error('GitHub commits error:', error)
    return NextResponse.json({ error: 'Failed to fetch commits' }, { status: 500 })
  }
}

// Create a commit with multiple file changes
export async function POST(
  request: Request,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params
  const { message, files, branch = 'main' } = await request.json()
  
  const cookieStore = await cookies()
  const token = cookieStore.get('github_token')?.value
  
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated with GitHub' }, { status: 401 })
  }
  
  try {
    // Get the current commit SHA
    const refResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    )
    
    if (!refResponse.ok) {
      throw new Error('Failed to get branch ref')
    }
    
    const refData = await refResponse.json()
    const latestCommitSha = refData.object.sha
    
    // Get the tree SHA of the latest commit
    const commitResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    )
    
    const commitData = await commitResponse.json()
    const baseTreeSha = commitData.tree.sha
    
    // Create blobs for each file
    const blobPromises = files.map(async (file: { path: string; content: string }) => {
      const blobResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: file.content,
            encoding: 'utf-8',
          }),
        }
      )
      const blobData = await blobResponse.json()
      return {
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha,
      }
    })
    
    const treeItems = await Promise.all(blobPromises)
    
    // Create a new tree
    const treeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: treeItems,
        }),
      }
    )
    
    const treeData = await treeResponse.json()
    
    // Create the commit
    const newCommitResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/commits`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          tree: treeData.sha,
          parents: [latestCommitSha],
        }),
      }
    )
    
    const newCommitData = await newCommitResponse.json()
    
    // Update the branch reference
    const updateRefResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sha: newCommitData.sha,
        }),
      }
    )
    
    if (!updateRefResponse.ok) {
      throw new Error('Failed to update branch reference')
    }
    
    return NextResponse.json({
      sha: newCommitData.sha,
      message: newCommitData.message,
      url: newCommitData.html_url,
    })
  } catch (error) {
    console.error('GitHub commit error:', error)
    return NextResponse.json({ error: 'Failed to create commit' }, { status: 500 })
  }
}
