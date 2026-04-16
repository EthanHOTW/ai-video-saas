'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Video } from '@/lib/types'

interface Props {
  video: Video
  onUpdated?: (v: Partial<Video>) => void
}

// Simple slug generator: 12 lowercase alphanumerics
function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let s = ''
  for (let i = 0; i < 12; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export default function ShareControls({ video, onUpdated }: Props) {
  const supabase = createClient()
  const [isPublic, setIsPublic] = useState(video.is_public)
  const [slug, setSlug] = useState(video.share_slug)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shareUrl =
    slug && typeof window !== 'undefined'
      ? `${window.location.origin}/share/${slug}`
      : null

  const togglePublic = async () => {
    setLoading(true)
    setError(null)
    const next = !isPublic
    const nextSlug = slug || (next ? generateSlug() : null)
    const { error: updErr } = await supabase
      .from('videos')
      .update({ is_public: next, share_slug: nextSlug })
      .eq('id', video.id)
    if (updErr) {
      setError('更新失敗：' + updErr.message)
    } else {
      setIsPublic(next)
      setSlug(nextSlug)
      onUpdated?.({ is_public: next, share_slug: nextSlug })
    }
    setLoading(false)
  }

  const copyLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('複製失敗，請手動複製。')
    }
  }

  return (
    <div className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-sand-900 dark:text-sand-50 mb-1">
            公開分享
          </h3>
          <p className="text-sand-500 dark:text-sand-400 text-sm">
            開啟後，任何人都可以透過連結觀看此影片（不需登入）。
          </p>
        </div>
        <button
          onClick={togglePublic}
          disabled={loading}
          role="switch"
          aria-checked={isPublic}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
            isPublic ? 'bg-accent' : 'bg-sand-300 dark:bg-sand-700'
          } disabled:opacity-50`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              isPublic ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {error && (
        <div className="mb-3 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded p-2">
          {error}
        </div>
      )}

      {isPublic && shareUrl && (
        <div className="flex gap-2">
          <input
            readOnly
            value={shareUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 px-3 py-2 text-sm bg-sand-50 dark:bg-sand-800 border border-sand-300 dark:border-sand-700 rounded-lg text-sand-900 dark:text-sand-50 font-mono"
          />
          <button
            onClick={copyLink}
            className="px-4 py-2 bg-accent hover:bg-accent-dark text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            {copied ? '✓ 已複製' : '複製連結'}
          </button>
        </div>
      )}
    </div>
  )
}
