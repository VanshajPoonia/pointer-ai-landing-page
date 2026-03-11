import { redirect } from 'next/navigation'

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!
const GITHUB_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`
  : 'http://localhost:3000/api/auth/github/callback'

export async function GET() {
  const scope = 'repo user read:org'
  
  const authUrl = new URL('https://github.com/login/oauth/authorize')
  authUrl.searchParams.set('client_id', GITHUB_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', GITHUB_REDIRECT_URI)
  authUrl.searchParams.set('scope', scope)
  authUrl.searchParams.set('state', crypto.randomUUID())
  
  redirect(authUrl.toString())
}
