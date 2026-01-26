import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// This endpoint should be called once to create the admin user
// After creation, you can delete this file for security
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Create admin user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'vanshaj@vanshajpoonia.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        is_admin: true
      }
    })

    if (authError) {
      console.error('[v0] Admin creation error:', authError)
      return NextResponse.json({ 
        error: 'Failed to create admin user', 
        details: authError.message 
      }, { status: 500 })
    }

    // Update the user profile to set is_admin
    if (authData.user) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_admin: true })
        .eq('id', authData.user.id)

      if (updateError) {
        console.error('[v0] Profile update error:', updateError)
        return NextResponse.json({ 
          error: 'User created but failed to set admin flag',
          details: updateError.message 
        }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Admin user created successfully',
      email: 'vanshaj@vanshajpoonia.com'
    })
  } catch (error) {
    console.error('[v0] Setup admin error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
