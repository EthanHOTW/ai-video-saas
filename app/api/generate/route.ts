import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { topic, videoId } = body

    if (!topic || !videoId) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, videoId' },
        { status: 400 }
      )
    }

    // Get user session from Supabase
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

    // Fetch user profile to check credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits_remaining')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    // Check if user has credits
    if (profile.credits_remaining <= 0) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please upgrade your plan.' },
        { status: 403 }
      )
    }

    // Update video status to 'processing'
    const { error: updateError } = await supabase
      .from('videos')
      .update({ status: 'processing' })
      .eq('id', videoId)
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update video status' },
        { status: 500 }
      )
    }

    // Decrement credits by 1
    const { error: creditError } = await supabase
      .from('profiles')
      .update({ credits_remaining: profile.credits_remaining - 1 })
      .eq('id', user.id)

    if (creditError) {
      console.error('Failed to decrement credits:', creditError)
      // Don't fail the request - credits will be refunded if generation fails
    }

    // Get the base URL for callback
    const origin = new URL(request.url).origin
    const callbackUrl = `${origin}/api/callback`
    const callbackSecret = process.env.API_CALLBACK_SECRET

    if (!callbackSecret) {
      console.error('API_CALLBACK_SECRET not configured')
      return NextResponse.json(
        { error: 'Server misconfiguration' },
        { status: 500 }
      )
    }

    // Prepare n8n webhook payload with all required fields
    const n8nPayload = {
      topic,
      video_id: videoId,
      user_id: user.id,
      callback_url: callbackUrl,
      callback_secret: callbackSecret,
    }

    // Send to n8n webhook
    if (process.env.N8N_WEBHOOK_URL) {
      try {
        const response = await fetch(process.env.N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(n8nPayload),
        })

        if (!response.ok) {
          console.error('n8n webhook error:', response.status, response.statusText)
          // Still return success to client since video status is already updated
        }
      } catch (webhookError) {
        console.error('Failed to send webhook to n8n:', webhookError)
        // Don't fail the request if webhook fails, video is already marked as processing
      }
    } else {
      console.warn('N8N_WEBHOOK_URL not configured')
    }

    return NextResponse.json({ success: true, video_id: videoId })
  } catch (error) {
    console.error('Error in /api/generate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
