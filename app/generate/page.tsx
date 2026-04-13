'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PageTransition from '@/components/PageTransition'
import type { Profile } from '@/lib/types'

export default function GeneratePage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<{ email: string; display_name: string } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [topic, setTopic] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Check auth and fetch profile on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        setError(null)

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

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (profileError || !profileData) {
          setError('無法載入個人資料')
          return
        }

        setProfile(profileData)
      } catch (err) {
        console.error('Error fetching user data:', err)
        setError('An error occurred while loading your profile')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!topic.trim()) {
      setError('請輸入主題')
      return
    }

    if (!profile || !user) {
      setError('無法載入個人資料')
      return
    }

    if (profile.credits_remaining <= 0) {
      setError('點數已用完，請升級方案。')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        setError('未登入')
        return
      }

      // Create video record
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          user_id: authUser.id,
          topic: topic.trim(),
          status: 'pending',
        })
        .select()
        .single()

      if (videoError || !videoData) {
        setError('建立影片失敗')
        return
      }

      // Deduct credit
      const { error: creditError } = await supabase
        .from('profiles')
        .update({
          credits_remaining: profile.credits_remaining - 1,
        })
        .eq('id', authUser.id)

      if (creditError) {
        console.error('Error deducting credit:', creditError)
        // Continue anyway - video was created
      }

      // Call API to generate video
      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic: topic.trim(),
            videoId: videoData.id,
          }),
        })

        if (!response.ok) {
          console.error('API error:', response.statusText)
          // Don't show error to user - video was created and will process
        }
      } catch (err) {
        console.error('Error calling generate API:', err)
        // Don't show error to user - video was created and will process
      }

      // Redirect to video page
      router.push(`/video/${videoData.id}`)
    } catch (err) {
      console.error('Error:', err)
      setError('發生錯誤，請重試。')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-sand-50 dark:bg-sand-950">
        <Navbar />
        <main className="flex-1 w-full pt-20 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
            <p className="text-sand-500 dark:text-sand-400">載入中...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-sand-50 dark:bg-sand-950">
      <Navbar user={user} />

      <PageTransition>
        <main className="flex-1 w-full pt-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Back Link */}
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sand-500 dark:text-sand-400 hover:text-sand-700 dark:hover:text-sand-200 transition-colors mb-8"
            >
              <span className="mr-2">←</span>
              返回儀表板
            </Link>

            {/* Page Header */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-sand-900 dark:text-sand-50 mb-2">
                建立新影片
              </h1>
              <p className="text-sand-500 dark:text-sand-400">
                輸入主題，讓 AI 為你生成專業影片
              </p>
            </div>

            {/* No Credits Message */}
            {profile && profile.credits_remaining <= 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-red-400 mb-2">
                  點數已用完
                </h3>
                <p className="text-red-300 mb-4">
                  本月點數已全部用完，請升級方案繼續建立影片。
                </p>
                <Link
                  href="/pricing"
                  className="inline-block px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                >
                  查看方案價格
                </Link>
              </div>
            )}

            {/* Main Content */}
            {profile && profile.credits_remaining > 0 ? (
              <div className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg p-8">
                <form onSubmit={handleSubmit}>
                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                      <p className="text-red-300">{error}</p>
                    </div>
                  )}

                  {/* Topic Input */}
                  <div className="mb-8">
                    <label
                      htmlFor="topic"
                      className="block text-sm font-semibold text-sand-900 dark:text-sand-50 mb-3"
                    >
                      影片主題
                    </label>
                    <textarea
                      id="topic"
                      placeholder="例如：太空的 5 個驚人事實"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      disabled={submitting}
                      className="w-full px-4 py-3 bg-sand-50 dark:bg-sand-800 border border-sand-300 dark:border-sand-600 rounded-lg text-sand-900 dark:text-sand-50 placeholder-sand-400 dark:placeholder-sand-500 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                      rows={4}
                    />
                    <p className="text-sand-500 dark:text-sand-400 text-sm mt-2">
                      可以盡量描述細節，AI 會自動產生腳本、旁白和配圖。
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-between">
                    <p className="text-sand-500 dark:text-sand-400 text-sm">
                      剩餘點數：<span className="text-sand-900 dark:text-sand-50 font-semibold">{profile.credits_remaining}</span>
                    </p>
                    <button
                      type="submit"
                      disabled={submitting || !topic.trim()}
                      className="flex items-center space-x-2 px-6 py-3 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting && (
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      )}
                      <span>{submitting ? '建立中...' : '生成影片'}</span>
                    </button>
                  </div>
                </form>

                {/* Info Section */}
                <div className="mt-8 pt-8 border-t border-sand-300 dark:border-sand-700">
                  <h3 className="text-sand-900 dark:text-sand-50 font-semibold mb-4">接下來會發生什麼？</h3>
                  <ul className="space-y-3 text-sand-500 dark:text-sand-400 text-sm">
                    <li className="flex items-start">
                      <span className="text-accent mr-3 font-bold">1.</span>
                      <span>AI 根據你的主題產生詳細腳本</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-accent mr-3 font-bold">2.</span>
                      <span>自動生成自然語調的旁白</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-accent mr-3 font-bold">3.</span>
                      <span>為每個段落產生精美配圖</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-accent mr-3 font-bold">4.</span>
                      <span>將所有素材合成為專業影片</span>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg p-12 text-center">
                <div className="text-6xl mb-4 opacity-50">⚠️</div>
                <h2 className="text-2xl font-bold text-sand-900 dark:text-sand-50 mb-2">
                  沒有可用點數
                </h2>
                <p className="text-sand-500 dark:text-sand-400 mb-6 max-w-sm mx-auto">
                  目前方案的影片點數已全部用完，請升級方案。
                </p>
                <Link
                  href="/pricing"
                  className="inline-block px-6 py-3 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-colors"
                >
                  查看方案並升級
                </Link>
              </div>
            )}
          </div>
        </main>
      </PageTransition>

      <Footer />
    </div>
  )
}
