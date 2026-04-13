import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { video_id, status, video_url, duration } = body

    if (!video_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: video_id, status' },
        { status: 400 }
      )
    }

    // Create Supabase server client
    const supabase = await createClient()

    // Prepare update data
    const updateData: {
      status: string
      video_url?: string | null
      duration_sec?: number | null
      error_message?: string | null
      updated_at: string
    } = {
      status,
      updated_at: new Date().toISOString(),
    }

    // Add optional fields if provided
    if (video_url) {
      updateData.video_url = video_url
    }
    if (duration !== undefined) {
      updateData.duration_sec = duration
    }

    // If failed, add error message
    if (status === 'failed' && body.error_message) {
      updateData.error_message = body.error_message
    }

    // Update videos table
    const { error: updateError, data: updatedVideo } = await supabase
      .from('videos')
      .update(updateData)
      .eq('id', video_id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update video:', updateError)
      return NextResponse.json(
        { error: 'Failed to update video' },
        { status: 500 }
      )
    }

    // If status is 'failed', restore 1 credit to user
    if (status === 'failed' && updatedVideo) {
      try {
        const { error: creditError } = await supabase
          .from('profiles')
          .update({
            credits_remaining: supabase.rpc('increment_credits', {
              user_id: updatedVideo.user_id,
              amount: 1,
            }),
          })
          .eq('id', updatedVideo.user_id)

        if (creditError) {
          console.error('Failed to restore credit:', creditError)
        }
      } catch (creditRestoreError) {
        console.error('Error restoring credit:', creditRestoreError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in /api/callback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
