import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminDashboard } from '@/components/admin-dashboard'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user is admin
  const { data: profile, error } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  console.log('[v0] Admin page - checking user profile:', { profile, error })

  if (error || !profile?.is_admin) {
    redirect('/ide')
  }

  return <AdminDashboard />
}
