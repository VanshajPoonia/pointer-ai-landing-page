import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { IDEInterface } from '@/components/ide-interface'

export default async function IDEPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return <IDEInterface user={user} />
}
