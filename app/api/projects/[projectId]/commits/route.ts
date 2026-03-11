import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const supabase = await createClient()
  const { projectId } = await params
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: commits, error } = await supabase
    .from('git_commits')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ 
    commits: commits?.map(c => ({
      id: c.id,
      message: c.message,
      author: c.author_name,
      date: c.created_at,
      sha: c.id.substring(0, 7),
    })) || []
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const supabase = await createClient()
  const { projectId } = await params
  const { commit, files } = await request.json()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get the current branch
  const { data: branch } = await supabase
    .from('git_branches')
    .select('id, head_commit_id')
    .eq('project_id', projectId)
    .eq('is_default', true)
    .single()

  // Create the commit
  const { data: newCommit, error: commitError } = await supabase
    .from('git_commits')
    .insert({
      project_id: projectId,
      branch_id: branch?.id,
      parent_commit_id: branch?.head_commit_id,
      message: commit.message,
      author_name: user.email || 'local-user',
      author_email: user.email,
    })
    .select()
    .single()

  if (commitError) {
    return Response.json({ error: commitError.message }, { status: 500 })
  }

  // Save file snapshots
  if (files && files.length > 0) {
    const snapshots = files.map((f: { fileId: string; content: string }) => ({
      commit_id: newCommit.id,
      file_id: f.fileId,
      content: f.content,
    }))

    await supabase.from('file_snapshots').insert(snapshots)
  }

  // Update branch head
  if (branch) {
    await supabase
      .from('git_branches')
      .update({ head_commit_id: newCommit.id })
      .eq('id', branch.id)
  }

  // Clear staged files
  await supabase
    .from('staged_files')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', user.id)

  return Response.json({ 
    success: true,
    commit: {
      id: newCommit.id,
      message: newCommit.message,
      author: newCommit.author_name,
      date: newCommit.created_at,
      sha: newCommit.id.substring(0, 7),
    }
  })
}
