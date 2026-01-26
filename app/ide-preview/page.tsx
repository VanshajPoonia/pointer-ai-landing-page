'use client'

import { IDEInterface } from '@/components/ide-interface'

// Temporary preview page - bypasses auth for demo purposes
export default function IDEPreviewPage() {
  // Mock user for preview
  const mockUser = {
    id: 'preview-user',
    email: 'preview@demo.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  }

  return <IDEInterface user={mockUser as any} />
}
