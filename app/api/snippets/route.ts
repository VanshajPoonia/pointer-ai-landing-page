import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  
  const language = searchParams.get('language')
  const tag = searchParams.get('tag')
  const search = searchParams.get('search')
  const view = searchParams.get('view') || 'my' // 'my', 'public', 'favorites'
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let query = supabase.from('snippets').select('*')

  if (view === 'my') {
    query = query.eq('user_id', user.id)
  } else if (view === 'public') {
    query = query.eq('is_public', true)
  } else if (view === 'favorites') {
    // Get user's favorited snippets
    const { data: favorites } = await supabase
      .from('snippet_favorites')
      .select('snippet_id')
      .eq('user_id', user.id)
    
    const favoriteIds = favorites?.map(f => f.snippet_id) || []
    if (favoriteIds.length === 0) {
      return NextResponse.json([])
    }
    query = query.in('id', favoriteIds)
  }

  if (language) {
    query = query.eq('language', language)
  }

  if (tag) {
    query = query.contains('tags', [tag])
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,code.ilike.%${search}%`)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { title, description, code, language, tags, is_public } = body

  if (!title || !code || !language) {
    return NextResponse.json({ error: 'Title, code, and language are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('snippets')
    .insert({
      user_id: user.id,
      title,
      description: description || '',
      code,
      language,
      tags: tags || [],
      is_public: is_public || false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
