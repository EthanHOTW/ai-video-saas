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

  // Test the actual TTS endpoint we use in production (needs text_to_speech perm)
  try {
    const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
      method: 'POST',
      headers: {
        'xi-api-key': key.trim(),
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: 'ping',
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    })
    diag.ttsApiStatus = r.status
    diag.ttsApiOK = r.ok
    if (!r.ok) {
      const text = await r.text()
      diag.ttsErrorBody = text.slice(0, 400)
    } else {
      diag.ttsContentType = r.headers.get('content-type')
      const buf = await r.arrayBuffer()
      diag.ttsMp3Bytes = buf.byteLength
    }
  } catch (e) {
    diag.fetchError = e instanceof Error ? e.message : 'unknown'
  }

  return NextResponse.json(diag)
}
