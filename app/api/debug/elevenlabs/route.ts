import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Debug endpoint: validates ELEVENLABS_API_KEY by calling /v1/user.
// Does NOT return the key itself. Only safe diagnostics.
// Requires authenticated user to prevent abuse.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const key = process.env.ELEVENLABS_API_KEY || ''
  const diag: Record<string, unknown> = {
    envVarPresent: !!key,
    keyLength: key.length,
    hasLeadingWhitespace: key !== key.trimStart(),
    hasTrailingWhitespace: key !== key.trimEnd(),
    keyStartsWithSk: key.startsWith('sk_'),
    keyCharClass: /^[a-f0-9]+$/i.test(key.trim()) ? 'hex'
      : /^sk_[A-Za-z0-9_-]+$/.test(key.trim()) ? 'sk_prefixed'
      : 'other',
  }

  if (!key) {
    diag.status = 'ENV_VAR_MISSING'
    return NextResponse.json(diag)
  }

  try {
    const r = await fetch('https://api.elevenlabs.io/v1/user', {
      method: 'GET',
      headers: { 'xi-api-key': key.trim() },
    })
    diag.apiStatus = r.status
    diag.apiOK = r.ok
    if (!r.ok) {
      const text = await r.text()
      diag.apiErrorBody = text.slice(0, 300)
    } else {
      const data = await r.json()
      diag.subscriptionTier = data.subscription?.tier
      diag.characterCount = data.subscription?.character_count
      diag.characterLimit = data.subscription?.character_limit
    }
  } catch (e) {
    diag.fetchError = e instanceof Error ? e.message : 'unknown'
  }

  return NextResponse.json(diag)
}
