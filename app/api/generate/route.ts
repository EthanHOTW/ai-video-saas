import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCreditsForTier, DURATION_TIER_CONFIG } from '@/lib/types'
import type { DurationTier } from '@/lib/types'

const VALID_TIERS: DurationTier[] = ['flash', 'standard', 'premium']

// Duration tier permission check (plan → max tier allowed)
const TIER_LEVEL: Record<DurationTier, number> = {
  flash: 1,
  standard: 2,
  premium: 3,
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      topic,
      videoId,
      duration_tier = 'flash',
      language = 'zh-TW',
      theme = 'life',
      style = 'cinematic',
      voice = 'rachel',
      voice_enabled = true,
      bgm_mood = 'auto',
      subtitle_style = 'tiktok',
      script = null,
    } = body

    // --- Validation ---
    if (!topic || !videoId) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, videoId' },
        { status: 400 }
      )
    }

    if (!VALID_TIERS.includes(duration_tier)) {
      return NextResponse.json(
        { error: `Invalid duration_tier: ${duration_tier}. Must be: flash, standard, premium` },
        { status: 400 }
      )
    }

    if (!script || !script.scenes || !Array.isArray(script.scenes)) {
      return NextResponse.json(
        { error: 'Missing or invalid script (must include scenes array)' },
        { status: 400 }
      )
    }

    // --- Auth ---
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: User not authenticated' },
        { status: 401 }
      )
    }

    // --- Profile & Permission Check ---
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits_remaining, max_duration_tier, plan')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    // Check tier permission (e.g., free plan can only use flash)
    const userMaxTier = (profile.max_duration_tier || 'flash') as DurationTier
    if (TIER_LEVEL[duration_tier as DurationTier] > TIER_LEVEL[userMaxTier]) {
      return NextResponse.json(
        {
          error: 'TIER_NOT_ALLOWED',
          message: `你的方案（${profile.plan}）最高支援 ${DURATION_TIER_CONFIG[userMaxTier].label}。請升級方案以使用 ${DURATION_TIER_CONFIG[duration_tier as DurationTier].label}。`,
          max_tier: userMaxTier,
          requested_tier: duration_tier,
          upgrade_url: '/pricing',
        },
        { status: 403 }
      )
    }

    // Calculate credits needed
    const creditsNeeded = getCreditsForTier(duration_tier as DurationTier)

    // Check sufficient credits
    if (profile.credits_remaining < creditsNeeded) {
      return NextResponse.json(
        {
          error: 'INSUFFICIENT_CREDITS',
          message: `點數不足。需要 ${creditsNeeded} 點，剩餘 ${profile.credits_remaining} 點。`,
          required: creditsNeeded,
          available: profile.credits_remaining,
          upgrade_url: '/pricing',
        },
        { status: 402 }
      )
    }

    // --- Update video status ---
    const { error: updateError } = await supabase
      .from('videos')
      .update({
        status: 'processing',
        progress_step: 'queued',
        duration_tier,
        credits_consumed: creditsNeeded,
        started_at: new Date().toISOString(),
      })
      .eq('id', videoId)
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update video status' },
        { status: 500 }
      )
    }

    // --- Deduct credits ---
    const { error: creditError } = await supabase
      .from('profiles')
      .update({ credits_remaining: profile.credits_remaining - creditsNeeded })
      .eq('id', user.id)

    if (creditError) {
      console.error('Failed to decrement credits:', creditError)
    }

    // --- Server-side config ---
    const origin = new URL(request.url).origin
    const callbackUrl = `${origin}/api/callback`
    const callbackSecret = process.env.API_CALLBACK_SECRET

    if (!callbackSecret) {
      console.error('API_CALLBACK_SECRET not configured')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const openaiApiKey = process.env.OPENAI_API_KEY
    const falAiApiKey = process.env.FAL_AI_API_KEY
    const creatomateApiKey = process.env.CREATOMATE_API_KEY

    if (!openaiApiKey || !falAiApiKey || !creatomateApiKey) {
      console.error('Missing upstream API keys')
      return NextResponse.json(
        { error: 'Server misconfiguration: upstream API keys not set' },
        { status: 500 }
      )
    }

    // --- Build n8n payload (LTX-centric) ---
    const tierConfig = DURATION_TIER_CONFIG[duration_tier as DurationTier]

    const n8nPayload = {
      // Core params
      topic,
      video_id: videoId,
      user_id: user.id,

      // Duration & tier
      duration_tier,
      max_scenes: tierConfig.maxScenes,
      target_seconds: tierConfig.targetSeconds,

      // Style & options
      language,
      theme,
      style,
      voice,
      voice_enabled,
      bgm_mood,
      subtitle_style,
      script,

      // Callback
      callback_url: callbackUrl,
      callback_secret: callbackSecret,

      // API keys
      openai_api_key: openaiApiKey,
      fal_ai_api_key: falAiApiKey,
      creatomate_api_key: creatomateApiKey,
    }

    // --- Send to n8n ---
    if (process.env.N8N_WEBHOOK_URL) {
      try {
        const response = await fetch(process.env.N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(n8nPayload),
        })

        if (!response.ok) {
          console.error('n8n webhook error:', response.status, response.statusText)
        }
      } catch (webhookError) {
        console.error('Failed to send webhook to n8n:', webhookError)
      }
    } else {
      console.warn('N8N_WEBHOOK_URL not configured')
    }

    return NextResponse.json({
      success: true,
      video_id: videoId,
      credits_consumed: creditsNeeded,
      credits_remaining: profile.credits_remaining - creditsNeeded,
      estimated_duration_minutes: duration_tier === 'flash' ? 3 : duration_tier === 'standard' ? 6 : 10,
    })
  } catch (error) {
    console.error('Error in /api/generate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
