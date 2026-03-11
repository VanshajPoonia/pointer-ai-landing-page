import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get branches for project
  const { data: branches, error } = await supabase
    .from('git_branches')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ branches: branches || [] })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, sourceBranch } = await request.json()

  if (!name) {
    return NextResponse.json({ error: 'Branch name is required' }, { status: 400 })
  }

  // Check if branch already exists
  const { data: existingBranch } = await supabase
    .from('git_branches')
    .select('id')
    .eq('project_id', projectId)
    .eq('name', name)
    .single()

  if (existingBranch) {
    return NextResponse.json({ error: 'Branch already exists' }, { status: 400 })
  }

  // Get the source branch's latest commit
  let headCommitId = null
  if (sourceBranch) {
    const { data: source } = await supabase
      .from('git_branches')
      .select('head_commit_id')
      .eq('project_id', projectId)
      .eq('name', sourceBranch)
      .single()
    
    headCommitId = source?.head_commit_id
  }

  // Create new branch
  const { data: branch, error } = await supabase
    .from('git_branches')
    .insert({
      project_id: projectId,
      name,
      head_commit_id: headCommitId,
      is_default: false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ branch })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const branchName = searchParams.get('name')

  if (!branchName) {
    return NextResponse.json({ error: 'Branch name is required' }, { status: 400 })
  }

  // Don't allow deleting the default branch
  const { data: branch } = await supabase
    .from('git_branches')
    .select('is_default')
    .eq('project_id', projectId)
    .eq('name', branchName)
    .single()

  if (branch?.is_default) {
    return NextResponse.json({ error: 'Cannot delete default branch' }, { status: 400 })
  }

  const { error } = await supabase
    .from('git_branches')
    .delete()
    .eq('project_id', projectId)
    .eq('name', branchName)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
