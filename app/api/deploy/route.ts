import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, provider } = await request.json()

    if (!projectId || !provider) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['vercel', 'netlify'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
    }

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*, files(*)')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Create deployment record
    const { data: deployment, error: deployError } = await supabase
      .from('deployments')
      .insert({
        project_id: projectId,
        user_id: user.id,
        provider,
        status: 'building',
        commit_message: `Deploy ${project.name}`,
      })
      .select()
      .single()

    if (deployError) {
      console.error('Deploy error:', deployError)
      return NextResponse.json({ error: 'Failed to create deployment' }, { status: 500 })
    }

    // Simulate deployment process (in production, this would call Vercel/Netlify APIs)
    // For now, we'll create a mock deployment that completes after a delay
    
    // Build the project files into a deployable format
    const files = project.files || []
    const hasIndexHtml = files.some((f: { name: string }) => f.name === 'index.html')
    
    // Generate a preview URL (mock for now)
    const previewUrl = `https://${project.name.toLowerCase().replace(/\s+/g, '-')}-${deployment.id.slice(0, 8)}.${provider === 'vercel' ? 'vercel.app' : 'netlify.app'}`

    // Update deployment with preview URL
    setTimeout(async () => {
      await supabase
        .from('deployments')
        .update({
          status: 'ready',
          url: previewUrl,
          preview_url: previewUrl,
          updated_at: new Date().toISOString(),
          build_logs: `Building project: ${project.name}\nFiles: ${files.length}\nProvider: ${provider}\n\n[SUCCESS] Deployment complete!`,
        })
        .eq('id', deployment.id)
    }, 3000) // Simulate 3 second build

    return NextResponse.json({
      success: true,
      deployment: {
        id: deployment.id,
        status: 'building',
        provider,
        previewUrl,
      },
    })

  } catch (error) {
    console.error('Deploy error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    let query = supabase
      .from('deployments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data: deployments, error } = await query.limit(20)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch deployments' }, { status: 500 })
    }

    return NextResponse.json({ deployments })

  } catch (error) {
    console.error('Get deployments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
