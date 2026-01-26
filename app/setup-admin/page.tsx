'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function SetupAdminPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)

  const setupAdmin = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/setup-admin', {
        method: 'POST'
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to connect to API' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-lg p-8">
        <h1 className="text-2xl font-bold text-white mb-4">Admin Setup</h1>
        <p className="text-slate-400 mb-6">
          Click the button below to create the admin account. This should only be done once.
        </p>

        <div className="space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded p-4">
            <p className="text-sm text-slate-300">
              <span className="font-semibold">Email:</span> vanshaj@vanshajpoonia.com
            </p>
            <p className="text-sm text-slate-300 mt-1">
              <span className="font-semibold">Password:</span> admin123
            </p>
          </div>

          <Button 
            onClick={setupAdmin} 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Creating Admin...' : 'Create Admin Account'}
          </Button>

          {result && (
            <div className={`p-4 rounded border ${
              result.success 
                ? 'bg-green-950/50 border-green-800 text-green-300' 
                : 'bg-red-950/50 border-red-800 text-red-300'
            }`}>
              <p className="font-semibold mb-1">
                {result.success ? '✓ Success' : '✗ Error'}
              </p>
              <p className="text-sm">
                {result.message || result.error}
              </p>
              {result.success && (
                <p className="text-xs mt-2 text-slate-400">
                  You can now delete the /app/setup-admin and /app/api/setup-admin folders for security.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
