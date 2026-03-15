import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function IDEPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Redirect to dashboard - users should create/select a project first
  redirect('/dashboard')
}
