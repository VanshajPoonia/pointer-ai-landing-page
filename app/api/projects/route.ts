import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET all projects for current user
export async function GET() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ projects })
}

// POST create new project
export async function POST(req: Request) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, description } = await req.json()

  // Create project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: name || 'Untitled Project',
      description: description || '',
    })
    .select()
    .single()

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 })
  }

  // Create default branch
  const { error: branchError } = await supabase
    .from('git_branches')
    .insert({
      project_id: project.id,
      name: 'main',
      is_default: true,
    })

  if (branchError) {
    console.error('Failed to create default branch:', branchError)
  }

  // Create root folder
  const { data: rootFolder, error: rootError } = await supabase
    .from('files')
    .insert({
      project_id: project.id,
      name: 'root',
      type: 'folder',
      path: '/',
      parent_id: null,
    })
    .select()
    .single()

  if (rootError) {
    console.error('Failed to create root folder:', rootError)
  }

  return NextResponse.json({ project, rootFolderId: rootFolder?.id })
}
