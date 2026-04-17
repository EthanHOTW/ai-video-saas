import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    // Verify API secret
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.API_CALLBACK_SECRET

    if (!expectedSecret) {
      console.error('API_CALLBACK_SECRET not configured')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const providedSecret = authHeader?.replace('Bearer ', '')
    if (providedSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API secret' }, { status: 401 })
    }

    const body = await request.json()
    const {
      video_id,
      status,
      progress_step,
      video_url,
      thumbnail_url,
      duration,
      script_json,
      render_id,
      error_message,
    } = body

    if (!video_id) {
      return NextResponse.json({ error: 'Missing required field: video_id' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Build update payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    // Progress-only update (intermediate callback from n8n)
    if (progress_step && !status) {
      updateData.progress_step = progress_step
      const { error: updateError } = await supabase
        .from('videos')
        .update(updateData)
        .eq('id', video_id)

      if (updateError) {
        console.error('Failed to update progress:', updateError)
        return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Progress updated', video_id })
    }

    // Full status update
    if (!status) {
      return NextResponse.json({ error: 'Missing required field: status' }, { status: 400 })
    }

    updateData.status = status

    if (progress_step) updateData.progress_step = progress_step
    if (video_url) updateData.video_url = video_url
    if (thumbnail_url) updateData.thumbnail_url = thumbnail_url
    if (duration !== undefined && duration !== null) {
      updateData.duration_sec = Math.round(Number(duration))
    }
    if (script_json) updateData.script_json = script_json
    if (render_id) updateData.render_id = render_id

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
      updateData.progress_step = 'done'
    }

    if (status === 'failed') {
      updateData.error_message = error_message || 'Unknown error'
      updateData.progress_step = 'error'
    }

    // Update video
    const { error: updateError, data: updatedVideo } = await supabase
      .from('videos')
      .update(updateData)
      .eq('id', video_id)
      .select('user_id, credits_consumed')
      .single()

    if (updateError) {
      console.error('Failed to update video:', updateError)
      return NextResponse.json(
        { error: 'Failed to update video', details: updateError.message },
        { status: 500 }
      )
    }

    if (!updatedVideo) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // If failed, restore credits (dynamic amount based on credits_consumed)
    if (status === 'failed') {
      try {
        const userId = updatedVideo.user_id
        const creditsToRestore = updatedVideo.credits_consumed || 1

        const { data: profile } = await supabase
          .from('profiles')
          .select('credits_remaining')
          .eq('id', userId)
          .single()

        if (profile) {
          await supabase
            .from('profiles')
            .update({ credits_remaining: profile.credits_remaining + creditsToRestore })
            .eq('id', userId)

          // Log the refund
          await supabase.from('usage_log').insert({
            user_id: userId,
            event_type: 'video_failed',
            credits_delta: creditsToRestore,
            video_id: video_id,
            metadata: { error_message: error_message || 'Unknown error', credits_restored: creditsToRestore },
          })
        }
      } catch (creditRestoreError) {
        console.error('Error restoring credits:', creditRestoreError)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Video ${status === 'completed' ? 'completed' : status === 'failed' ? 'failed (credits restored)' : 'updated'}`,
      video_id,
    })
  } catch (error) {
    console.error('Error in /api/callback:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
