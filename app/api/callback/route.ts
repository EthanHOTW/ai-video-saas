import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    // Verify API secret from Authorization header
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.API_CALLBACK_SECRET

    if (!expectedSecret) {
      console.error('API_CALLBACK_SECRET not configured')
      return NextResponse.json(
        { error: 'Server misconfiguration' },
        { status: 500 }
      )
    }

    const providedSecret = authHeader?.replace('Bearer ', '')
    if (providedSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid API secret' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      video_id,
      status,
      video_url,
      thumbnail_url,
      duration,
      script_json,
      render_id,
      error_message,
    } = body

    if (!video_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: video_id, status' },
        { status: 400 }
      )
    }

    // Create admin Supabase client (bypasses RLS, no cookies needed)
    const supabase = createAdminClient()

    // Prepare update data with all provided fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    }

    // Add optional fields if provided
    if (video_url) {
      updateData.video_url = video_url
    }
    if (thumbnail_url) {
      updateData.thumbnail_url = thumbnail_url
    }
    if (duration !== undefined && duration !== null) {
      // duration_sec is an integer column — round floats before insert
      updateData.duration_sec = Math.round(Number(duration))
    }
    if (script_json) {
      updateData.script_json = script_json
    }
    if (render_id) {
      updateData.render_id = render_id
    }
    if (status === 'failed' && error_message) {
      updateData.error_message = error_message
    }

    // Update videos table
    const { error: updateError, data: updatedVideos } = await supabase
      .from('videos')
      .update(updateData)
      .eq('id', video_id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update video:', updateError)
      return NextResponse.json(
        {
          error: 'Failed to update video',
          details: updateError.message,
          code: updateError.code,
          hint: updateError.hint,
          attemptedUpdate: updateData,
        },
        { status: 500 }
      )
    }

    if (!updatedVideos) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // If status is 'failed', restore 1 credit to user
    if (status === 'failed') {
      try {
        const userId = updatedVideos.user_id

        // Get current credits
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('credits_remaining')
          .eq('id', userId)
          .single()

        if (fetchError) {
          console.error('Failed to fetch user profile:', fetchError)
        } else if (profile) {
          // Update credits with increment
          const { error: creditError } = await supabase
            .from('profiles')
            .update({
              credits_remaining: profile.credits_remaining + 1,
            })
            .eq('id', userId)

          if (creditError) {
            console.error('Failed to restore credit:', creditError)
          }
        }
      } catch (creditRestoreError) {
        console.error('Error restoring credit:', creditRestoreError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Video callback processed successfully',
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
