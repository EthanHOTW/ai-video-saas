'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Video, Script } from '@/lib/types'
import Navbar from '@/components/Navbar'
import StatusBadge from '@/components/StatusBadge'
import Footer from '@/components/Footer'

export default function VideoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [user, setUser] = useState<{ email: string; display_name: string } | null>(null)
  const [video, setVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const videoId = params.id as string

  // Fetch video data
  const fetchVideo = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single()

      if (fetchError || !data) {
        setError('Video not found')
        setVideo(null)
        return
      }

      setVideo(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching video:', err)
      setError('Failed to load video')
    }
  }

  // Initial load: fetch user and video
  /* eslint-disable-next-line react-hooks/exhaustive-deps */
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true)

        // Get current user
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (!authUser) {
          router.push('/auth')
          return
        }

        setUser({
          email: authUser.email || '',
          display_name: authUser.user_metadata?.display_name || authUser.email || 'User',
        })

        // Fetch video
        await fetchVideo()
      } catch (err) {
        console.error('Error initializing:', err)
        setError('An error occurred while loading the page')
      } finally {
        setLoading(false)
      }
    }

    initialize()

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [router, videoId, supabase])

  // Set up polling when video status is pending or processing
  /* eslint-disable-next-line react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!video) return

    if (video.status === 'pending' || video.status === 'processing') {
      // Poll every 5 seconds
      pollIntervalRef.current = setInterval(() => {
        fetchVideo()
      }, 5000)

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
        }
      }
    } else {
      // Stop polling if status is completed or failed
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [video?.status])

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen w-full">
        <Navbar user={user} />
        <main className="flex-1 w-full pt-20 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-400">Loading video...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="flex flex-col min-h-screen w-full">
        <Navbar user={user} />
        <main className="flex-1 w-full pt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Back Link */}
            <Link
              href="/dashboard"
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-8"
            >
              <span className="mr-2">←</span>
              Back to Dashboard
            </Link>

            {/* Error State */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Video Not Found
              </h2>
              <p className="text-gray-400 mb-6">
                {error || 'The video you are looking for does not exist.'}
              </p>
              <Link
                href="/dashboard"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <Navbar user={user} />

      <main className="flex-1 w-full pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Back Link */}
          <Link
            href="/dashboard"
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-8"
          >
            <span className="mr-2">←</span>
            Back to Dashboard
          </Link>

          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  {video.topic}
                </h1>
                <p className="text-gray-400">
                  Created {new Date(video.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <StatusBadge status={video.status} />
              </div>
            </div>
          </div>

          {/* Content based on status */}
          {(video.status === 'pending' || video.status === 'processing') && (
            <ProcessingState video={video} />
          )}

          {video.status === 'completed' && (
            <CompletedState video={video} />
          )}

          {video.status === 'failed' && (
            <FailedState video={video} />
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

// Processing/Pending State Component
function ProcessingState({ video }: { video: Video }) {
  const statusText = video.status === 'pending'
    ? 'Generating your video...'
    : 'Processing...'

  const steps = [
    { name: 'Generating script', icon: '✍️' },
    { name: 'Creating voiceover', icon: '🎤' },
    { name: 'Generating images', icon: '🖼️' },
    { name: 'Rendering video', icon: '🎬' },
  ]

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-12">
      <div className="flex flex-col items-center justify-center">
        {/* Large animated spinner */}
        <div className="mb-8 flex items-center justify-center">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-600 animate-spin"></div>
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-600/10 to-purple-600/10 flex items-center justify-center">
              <span className="text-2xl">🎥</span>
            </div>
          </div>
        </div>

        {/* Status text */}
        <h2 className="text-2xl font-bold text-white mb-2 text-center">
          {statusText}
        </h2>
        <p className="text-gray-400 text-center mb-8">
          This may take a few minutes. We&apos;ll update you as we go.
        </p>

        {/* Progress steps */}
        <div className="w-full max-w-md">
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-sm text-gray-400">
                  {step.icon}
                </div>
                <span className="text-gray-400 text-sm">{step.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Topic display */}
        <div className="mt-10 pt-10 border-t border-gray-700 w-full">
          <p className="text-gray-400 text-sm mb-2">Topic:</p>
          <p className="text-white font-medium">{video.topic}</p>
        </div>
      </div>
    </div>
  )
}

// Completed State Component
function CompletedState({ video }: { video: Video }) {
  const [scriptExpanded, setScriptExpanded] = useState(false)

  const handleDownload = () => {
    if (video.video_url) {
      window.open(video.video_url, '_blank')
    }
  }

  return (
    <div className="space-y-8">
      {/* Video Player */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div className="relative aspect-video bg-black">
          <video
            src={video.video_url || undefined}
            controls
            className="w-full h-full"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleDownload}
          className="flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
        >
          <span className="mr-2">⬇️</span>
          Download Video
        </button>
        <Link
          href="/generate"
          className="flex items-center justify-center px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors duration-200"
        >
          <span className="mr-2">➕</span>
          Create Another
        </Link>
      </div>

      {/* Video Info */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Video Info</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-gray-400 text-sm mb-1">Topic</p>
            <p className="text-white font-medium">{video.topic}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Duration</p>
            <p className="text-white font-medium">
              {video.duration_sec
                ? `${Math.floor(video.duration_sec / 60)}:${String(
                    video.duration_sec % 60
                  ).padStart(2, '0')}`
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Created</p>
            <p className="text-white font-medium">
              {new Date(video.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Script Section */}
      {video.script_json && Object.keys(video.script_json).length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg">
          <button
            onClick={() => setScriptExpanded(!scriptExpanded)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors"
          >
            <h3 className="text-lg font-semibold text-white">Script</h3>
            <span
              className={`transform transition-transform ${
                scriptExpanded ? 'rotate-180' : ''
              }`}
            >
              ▼
            </span>
          </button>

          {scriptExpanded && (
            <div className="px-6 pb-4 border-t border-gray-700">
              <ScriptDisplay script={video.script_json} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Failed State Component
function FailedState({ video }: { video: Video }) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-12">
      <div className="flex flex-col items-center justify-center text-center">
        {/* Error Icon */}
        <div className="text-6xl mb-4">❌</div>

        {/* Error Message */}
        <h2 className="text-2xl font-bold text-red-400 mb-2">
          Video Generation Failed
        </h2>
        {video.error_message && (
          <p className="text-red-300 mb-6 max-w-md">
            {video.error_message}
          </p>
        )}
        {!video.error_message && (
          <p className="text-red-300 mb-6 max-w-md">
            We encountered an error while generating your video. Please try again.
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link
            href="/generate"
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
          >
            Try Again
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

// Script Display Component
function ScriptDisplay({ script }: { script: Script }) {
  // Handle different script formats
  if (typeof script !== 'object' || script === null) {
    return (
      <div className="text-gray-400">
        <p>Unable to display script in expected format</p>
      </div>
    )
  }

  // If script has array structure (e.g., array of scenes/segments)
  if (Array.isArray(script)) {
    return (
      <div className="space-y-4">
        {script.map((item, index) => (
          <div key={index} className="bg-gray-700/50 rounded p-4">
            <div className="text-white font-medium mb-2">Scene {index + 1}</div>
            <p className="text-gray-300 text-sm whitespace-pre-wrap">
              {JSON.stringify(item, null, 2)}
            </p>
          </div>
        ))}
      </div>
    )
  }

  // If script is object with properties
  const entries = Object.entries(script)

  if (entries.length === 0) {
    return (
      <div className="text-gray-400">
        <p>No script content available</p>
      </div>
    )
  }

  // Check if it looks like a single narration/text script
  if (entries.length === 1 && typeof entries[0][1] === 'string') {
    const [, content] = entries[0]
    return (
      <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
        {content}
      </div>
    )
  }

  // Otherwise, display as structured data
  return (
    <div className="space-y-4">
      {entries.map(([key, value], index) => (
        <div key={index} className="bg-gray-700/50 rounded p-4">
          <div className="text-white font-medium mb-2 capitalize">
            {key.replace(/_/g, ' ')}
          </div>
          <div className="text-gray-300 text-sm whitespace-pre-wrap">
            {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
          </div>
        </div>
      ))}
    </div>
  )
}
