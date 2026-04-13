'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
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
          setError('Failed to load profile')
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
      setError('Please enter a topic')
      return
    }

    if (!profile || !user) {
      setError('Profile not loaded')
      return
    }

    if (profile.credits_remaining <= 0) {
      setError('No credits remaining. Please upgrade your plan.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        setError('Not authenticated')
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
        setError('Failed to create video')
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
      setError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen w-full">
        <Navbar />
        <main className="flex-1 w-full pt-20 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <Navbar user={user} />

      <main className="flex-1 w-full pt-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Back Link */}
          <Link
            href="/dashboard"
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-8"
          >
            <span className="mr-2">←</span>
            Back to Dashboard
          </Link>

          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">
              Create New Video
            </h1>
            <p className="text-gray-400">
              Enter a topic and let our AI generate a professional video for you
            </p>
          </div>

          {/* No Credits Message */}
          {profile && profile.credits_remaining <= 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-red-400 mb-2">
                No Credits Remaining
              </h3>
              <p className="text-red-300 mb-4">
                You&apos;ve used all your credits for this month. Upgrade your plan
                to continue creating videos.
              </p>
              <Link
                href="/pricing"
                className="inline-block px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
              >
                View Pricing Plans
              </Link>
            </div>
          )}

          {/* Main Content */}
          {profile && profile.credits_remaining > 0 ? (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
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
                    className="block text-sm font-semibold text-white mb-3"
                  >
                    Video Topic
                  </label>
                  <textarea
                    id="topic"
                    placeholder="e.g., 5 Amazing Facts About Space"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={submitting}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                    rows={4}
                  />
                  <p className="text-gray-400 text-sm mt-2">
                    Be as specific as you&apos;d like. The AI will generate a script,
                    voiceover, and matching images.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-between">
                  <p className="text-gray-400 text-sm">
                    Credits remaining: <span className="text-white font-semibold">{profile.credits_remaining}</span>
                  </p>
                  <button
                    type="submit"
                    disabled={submitting || !topic.trim()}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting && (
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    <span>{submitting ? 'Creating...' : 'Generate Video'}</span>
                  </button>
                </div>
              </form>

              {/* Info Section */}
              <div className="mt-8 pt-8 border-t border-gray-700">
                <h3 className="text-white font-semibold mb-4">What happens next?</h3>
                <ul className="space-y-3 text-gray-400 text-sm">
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-3 font-bold">1.</span>
                    <span>Our AI generates a detailed script based on your topic</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-3 font-bold">2.</span>
                    <span>Natural-sounding voiceover is created for the script</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-3 font-bold">3.</span>
                    <span>Beautiful images are generated to match each part of the script</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-3 font-bold">4.</span>
                    <span>Everything is combined into a professional video</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4 opacity-50">⚠️</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                No Credits Available
              </h2>
              <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                You&apos;ve used all the video credits on your current plan. Upgrade
                your plan to continue creating videos.
              </p>
              <Link
                href="/pricing"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                View Plans and Upgrade
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
