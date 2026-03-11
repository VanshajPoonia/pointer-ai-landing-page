import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET all files for a project
export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify project ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const { data: files, error } = await supabase
    .from('files')
    .select('*')
    .eq('project_id', projectId)
    .order('type', { ascending: false }) // folders first
    .order('name', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ files })
}

// POST create new file/folder
export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, type, content, language, parent_id, path } = await req.json()

  const { data: file, error } = await supabase
    .from('files')
    .insert({
      project_id: projectId,
      name,
      type,
      content: content || '',
      language: language || 'plaintext',
      parent_id,
      path: path || '/',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update project timestamp
  await supabase
    .from('projects')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', projectId)

  return NextResponse.json({ file })
}

// PUT update file
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, name, content, language } = await req.json()

  const { data: file, error } = await supabase
    .from('files')
    .update({
      name,
      content,
      language,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('project_id', projectId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update project timestamp
  await supabase
    .from('projects')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', projectId)

  return NextResponse.json({ file })
}

// DELETE file
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const fileId = searchParams.get('fileId')

  if (!fileId) {
    return NextResponse.json({ error: 'File ID required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('files')
    .delete()
    .eq('id', fileId)
    .eq('project_id', projectId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
