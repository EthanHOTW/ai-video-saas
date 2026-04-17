'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Video, Script } from '@/lib/types'
import Navbar from '@/components/Navbar'
import StatusBadge from '@/components/StatusBadge'
import Footer from '@/components/Footer'
import PageTransition from '@/components/PageTransition'
import ShareControls from '@/components/ShareControls'

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
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
            <p className="text-sand-500 dark:text-sand-400">載入影片中...</p>
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
              className="inline-flex items-center text-sand-500 dark:text-sand-400 hover:text-sand-900 dark:hover:text-sand-50 transition-colors mb-8"
            >
              <span className="mr-2">←</span>
              返回儀表板
            </Link>

            {/* Error State */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-sand-900 dark:text-sand-50 mb-2">
                找不到影片
              </h2>
              <p className="text-sand-500 dark:text-sand-400 mb-6">
                {error || '你查找的影片不存在。'}
              </p>
              <Link
                href="/dashboard"
                className="inline-block px-6 py-3 bg-accent hover:bg-accent/90 text-sand-50 font-semibold rounded-lg transition-colors"
              >
                返回儀表板
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
        <PageTransition>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Back Link */}
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sand-500 dark:text-sand-400 hover:text-sand-900 dark:hover:text-sand-50 transition-colors mb-8"
            >
              <span className="mr-2">←</span>
              返回儀表板
            </Link>

            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-sand-900 dark:text-sand-50 mb-2">
                    {video.topic}
                  </h1>
                  <p className="text-sand-500 dark:text-sand-400">
                    建立於 {new Date(video.created_at).toLocaleDateString('zh-TW', {
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
        </PageTransition>
      </main>

      <Footer />
    </div>
  )
}

// Processing/Pending State Component
function ProcessingState({ video }: { video: Video }) {
  const steps = [
    { key: 'script', name: '生成腳本', icon: '✍️' },
    { key: 'voice', name: '建立配音', icon: '🎤' },
    { key: 'visuals', name: 'LTX 生成影片', icon: '🎥' },
    { key: 'compositing', name: '合成影片', icon: '🎬' },
    { key: 'finalizing', name: '最終處理', icon: '✨' },
  ]

  const progressStep = video.progress_step || 'queued'
  const stepOrder = ['queued', 'script', 'voice', 'visuals', 'compositing', 'finalizing', 'done']
  const currentIdx = stepOrder.indexOf(progressStep)

  const tierLabel = video.duration_tier === 'premium' ? '👑 Premium' :
                    video.duration_tier === 'standard' ? '🎬 Standard' : '⚡ Flash'

  return (
    <div className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg p-12">
      <div className="flex flex-col items-center justify-center">
        {/* Large animated spinner */}
        <div className="mb-8 flex items-center justify-center">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full border-4 border-sand-300 dark:border-sand-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent border-r-accent animate-spin"></div>
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-accent/10 to-accent-dark/10 flex items-center justify-center">
              <span className="text-2xl">🎥</span>
            </div>
          </div>
        </div>

        {/* Status text */}
        <h2 className="text-2xl font-bold text-sand-900 dark:text-sand-50 mb-2 text-center">
          正在生成你的影片...
        </h2>
        <p className="text-sand-500 dark:text-sand-400 text-center mb-2">
          {tierLabel} | 預計 {video.duration_tier === 'flash' ? '2-3' : video.duration_tier === 'standard' ? '5-8' : '8-12'} 分鐘
        </p>
        <p className="text-sand-400 dark:text-sand-500 text-sm text-center mb-8">
          進度會即時更新，完成後可直接下載
        </p>

        {/* Progress steps with real-time status */}
        <div className="w-full max-w-md">
          <div className="space-y-3">
            {steps.map((step, index) => {
              const stepIdx = stepOrder.indexOf(step.key)
              const isCompleted = currentIdx > stepIdx
              const isActive = currentIdx === stepIdx
              const isPending = currentIdx < stepIdx

              return (
                <div key={step.key} className="flex items-center space-x-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors
                    ${isCompleted ? 'bg-green-500 text-white' :
                      isActive ? 'bg-accent text-white animate-pulse' :
                      'bg-sand-200 dark:bg-sand-800 text-sand-400'}`}>
                    {isCompleted ? '✓' : step.icon}
                  </div>
                  <span className={`text-sm font-medium transition-colors
                    ${isCompleted ? 'text-green-600 dark:text-green-400' :
                      isActive ? 'text-accent font-bold' :
                      'text-sand-400 dark:text-sand-500'}`}>
                    {step.name}
                    {isActive && ' ...'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Topic display */}
        <div className="mt-10 pt-10 border-t border-sand-300 dark:border-sand-700 w-full">
          <p className="text-sand-500 dark:text-sand-400 text-sm mb-2">主題：</p>
          <p className="text-sand-900 dark:text-sand-50 font-medium">{video.topic}</p>
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
      <div className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg overflow-hidden">
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
          className="flex items-center justify-center px-6 py-3 bg-accent hover:bg-accent/90 text-sand-50 font-semibold rounded-lg transition-colors duration-200"
        >
          <span className="mr-2">⬇️</span>
          下載影片
        </button>
        <Link
          href="/generate"
          className="flex items-center justify-center px-6 py-3 bg-sand-200 hover:bg-sand-300 dark:bg-sand-800 dark:hover:bg-sand-700 text-sand-900 dark:text-sand-50 font-semibold rounded-lg transition-colors duration-200"
        >
          <span className="mr-2">➕</span>
          再建一支
        </Link>
      </div>

      {/* Share Controls */}
      <ShareControls video={video} />

      {/* Video Info */}
      <div className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-sand-900 dark:text-sand-50 mb-4">影片資訊</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-sand-500 dark:text-sand-400 text-sm mb-1">主題</p>
            <p className="text-sand-900 dark:text-sand-50 font-medium">{video.topic}</p>
          </div>
          <div>
            <p className="text-sand-500 dark:text-sand-400 text-sm mb-1">時長</p>
            <p className="text-sand-900 dark:text-sand-50 font-medium">
              {video.duration_sec
                ? `${Math.floor(video.duration_sec / 60)}:${String(
                    video.duration_sec % 60
                  ).padStart(2, '0')}`
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sand-500 dark:text-sand-400 text-sm mb-1">建立日期</p>
            <p className="text-sand-900 dark:text-sand-50 font-medium">
              {new Date(video.created_at).toLocaleDateString('zh-TW', {
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
        <div className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg">
          <button
            onClick={() => setScriptExpanded(!scriptExpanded)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-sand-200/50 dark:hover:bg-sand-700/50 transition-colors"
          >
            <h3 className="text-lg font-semibold text-sand-900 dark:text-sand-50">腳本</h3>
            <span
              className={`transform transition-transform ${
                scriptExpanded ? 'rotate-180' : ''
              }`}
            >
              ▼
            </span>
          </button>

          {scriptExpanded && (
            <div className="px-6 pb-4 border-t border-sand-300 dark:border-sand-700">
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
          影片生成失敗
        </h2>
        {video.error_message && (
          <p className="text-red-300 mb-6 max-w-md">
            {video.error_message}
          </p>
        )}
        {!video.error_message && (
          <p className="text-red-300 mb-6 max-w-md">
            生成影片時發生錯誤，請重試。
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link
            href="/generate"
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-sand-50 font-semibold rounded-lg transition-colors"
          >
            重試
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-sand-200 hover:bg-sand-300 dark:bg-sand-800 dark:hover:bg-sand-700 text-sand-900 dark:text-sand-50 font-semibold rounded-lg transition-colors"
          >
            返回儀表板
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
      <div className="text-sand-500 dark:text-sand-400">
        <p>無法以預期格式顯示腳本</p>
      </div>
    )
  }

  // If script has array structure (e.g., array of scenes/segments)
  if (Array.isArray(script)) {
    return (
      <div className="space-y-4">
        {script.map((item, index) => (
          <div key={index} className="bg-sand-200/50 dark:bg-sand-700/50 rounded p-4">
            <div className="text-sand-900 dark:text-sand-50 font-medium mb-2">場景 {index + 1}</div>
            <p className="text-sand-600 dark:text-sand-300 text-sm whitespace-pre-wrap">
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
      <div className="text-sand-500 dark:text-sand-400">
        <p>沒有腳本內容</p>
      </div>
    )
  }

  // Check if it looks like a single narration/text script
  if (entries.length === 1 && typeof entries[0][1] === 'string') {
    const [, content] = entries[0]
    return (
      <div className="text-sand-600 dark:text-sand-300 text-sm whitespace-pre-wrap leading-relaxed">
        {content}
      </div>
    )
  }

  // Otherwise, display as structured data
  return (
    <div className="space-y-4">
      {entries.map(([key, value], index) => (
        <div key={index} className="bg-sand-200/50 dark:bg-sand-700/50 rounded p-4">
          <div className="text-sand-900 dark:text-sand-50 font-medium mb-2 capitalize">
            {key.replace(/_/g, ' ')}
          </div>
          <div className="text-sand-600 dark:text-sand-300 text-sm whitespace-pre-wrap">
            {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
          </div>
        </div>
      ))}
    </div>
  )
}
